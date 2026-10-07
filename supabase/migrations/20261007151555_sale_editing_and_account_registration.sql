-- Permite conservar preço/desconto por item, registrar vendas pendentes na
-- conta do cliente e editar uma venda de forma atômica.

alter table public.sale_items add column if not exists base_price numeric(14,2);
alter table public.sale_items add column if not exists discount_type text not null default 'percent';
alter table public.sale_items add column if not exists discount_value numeric(14,2) not null default 0;

update public.sale_items
   set base_price=unit_price
 where base_price is null;

alter table public.sale_items alter column base_price set not null;
alter table public.sale_items drop constraint if exists sale_items_discount_type_check;
alter table public.sale_items
  add constraint sale_items_discount_type_check check(discount_type in ('percent','value'));

create or replace function public.register_sale(
  p_business_id uuid,
  p_client_id uuid,
  p_payment_method text,
  p_items jsonb,
  p_notes text default null,
  p_client_sale_id text default null,
  p_kind text default 'Venta'
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  s_id uuid; item jsonb; p products%rowtype;
  subtotal_value numeric(14,2):=0; total_value numeric(14,2):=0;
  qty numeric(14,3); base_value numeric(14,2); unit_value numeric(14,2);
  item_discount numeric(14,2); item_discount_type text; item_discount_value numeric(14,2);
  member memberships%rowtype; number_value text; customer_name text; sequence_name text; prefix text;
  block_no_stock boolean:=true;
begin
  select * into member from memberships where business_id=p_business_id and user_id=auth.uid() and active;
  if not found then raise exception 'access denied'; end if;
  if p_client_sale_id is null or length(trim(p_client_sale_id))<8 then raise exception 'invalid client sale id'; end if;
  if p_kind not in ('Venta','Pedido','Presupuesto') then raise exception 'invalid sale kind'; end if;
  if nullif(trim(coalesce(p_payment_method,'')),'') is null then raise exception 'invalid payment method'; end if;
  if p_kind='Venta' and p_payment_method='Cuenta cliente' and p_client_id is null then raise exception 'client required for account sale'; end if;
  select id into s_id from sales where business_id=p_business_id and client_sale_id=p_client_sale_id;
  if found then return s_id; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'empty sale'; end if;
  if p_client_id is not null and not exists(select 1 from clients where id=p_client_id and business_id=p_business_id) then raise exception 'invalid client'; end if;

  select coalesce((app_config->'options'->>'blockNoStock')::boolean,true)
    into block_no_stock
    from business_settings
   where business_id=p_business_id;
  block_no_stock:=coalesce(block_no_stock,true);

  for item in select * from jsonb_array_elements(p_items) loop
    qty=(item->>'quantity')::numeric;
    unit_value=(item->>'unit_price')::numeric;
    base_value=coalesce(nullif(item->>'base_price','')::numeric,unit_value);
    if qty<=0 or unit_value<0 or base_value<unit_value then raise exception 'invalid item'; end if;
    select * into p from products where id=(item->>'product_id')::uuid and business_id=p_business_id for update;
    if not found then raise exception 'invalid product'; end if;
    if p_kind='Venta' and block_no_stock and p.stock<qty then raise exception 'insufficient stock for %',coalesce(p.name,'product'); end if;
    subtotal_value=subtotal_value+(qty*base_value);
    total_value=total_value+(qty*unit_value);
  end loop;

  prefix=case p_kind when 'Pedido' then 'P' when 'Presupuesto' then 'O' else 'V' end;
  sequence_name=case p_kind when 'Pedido' then 'sale_p' when 'Presupuesto' then 'sale_o' else 'sale_v' end;
  number_value=prefix||lpad(public.next_business_sequence(p_business_id,sequence_name)::text,6,'0');
  select name into customer_name from clients where id=p_client_id and business_id=p_business_id;
  insert into sales(business_id,sale_number,client_sale_id,kind,client_id,client_name,seller_id,seller_name,payment_method,subtotal,discount,total,notes,status)
  values(p_business_id,number_value,p_client_sale_id,p_kind,p_client_id,coalesce(customer_name,'Consumidor final'),auth.uid(),member.display_name,p_payment_method,subtotal_value,subtotal_value-total_value,total_value,p_notes,
    case when p_kind='Venta' and p_payment_method='Cuenta cliente' then 'pending' else 'completed' end)
  returning id into s_id;

  for item in select * from jsonb_array_elements(p_items) loop
    qty=(item->>'quantity')::numeric;
    unit_value=(item->>'unit_price')::numeric;
    base_value=coalesce(nullif(item->>'base_price','')::numeric,unit_value);
    item_discount_type=case when item->>'discount_type'='value' then 'value' else 'percent' end;
    item_discount_value=greatest(0,coalesce(nullif(item->>'discount_value','')::numeric,0));
    item_discount=(base_value-unit_value)*qty;
    select * into p from products where id=(item->>'product_id')::uuid and business_id=p_business_id for update;
    if p_kind='Venta' then update products set stock=stock-qty,updated_at=now() where id=p.id; end if;
    insert into sale_items(business_id,sale_id,product_id,product_code,product_name,quantity,base_price,unit_price,discount_type,discount_value,discount,total)
    values(p_business_id,s_id,p.id,p.code,p.name,qty,base_value,unit_value,item_discount_type,item_discount_value,item_discount,qty*unit_value);
  end loop;

  if p_kind='Venta' and p_client_id is not null then
    update clients set purchases=purchases+1,total_purchased=total_purchased+total_value,updated_at=now() where id=p_client_id and business_id=p_business_id;
    if p_payment_method='Cuenta cliente' then
      perform public.record_client_movement_v2(p_business_id,p_client_id,'debit',total_value,'Venta '||number_value||' — pendiente',now(),null,number_value,s_id);
    end if;
  end if;
  if p_kind='Venta' then
    update memberships set sales_count=sales_count+1,sales_total=sales_total+total_value,average_ticket=(sales_total+total_value)/(sales_count+1),updated_at=now() where business_id=p_business_id and user_id=auth.uid();
    if p_payment_method<>'Cuenta cliente' then
      insert into cash_movements(business_id,kind,description,amount,employee_id,employee_name,sale_id)
      values(p_business_id,'in','Venta '||number_value||' — '||p_payment_method,total_value,auth.uid(),member.display_name,s_id);
    end if;
  end if;
  return s_id;
end $$;

create or replace function public.update_sale(
  p_business_id uuid,
  p_sale_id uuid,
  p_client_id uuid,
  p_items jsonb,
  p_notes text default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  member memberships%rowtype; old_sale sales%rowtype; item jsonb; p products%rowtype;
  subtotal_value numeric(14,2):=0; total_value numeric(14,2):=0;
  qty numeric(14,3); base_value numeric(14,2); unit_value numeric(14,2);
  item_discount numeric(14,2); item_discount_type text; item_discount_value numeric(14,2);
  customer_name text; old_debt numeric(14,2):=0; block_no_stock boolean:=true;
begin
  select * into member from memberships where business_id=p_business_id and user_id=auth.uid() and active;
  if not found then raise exception 'access denied'; end if;

  select * into old_sale from sales where id=p_sale_id and business_id=p_business_id for update;
  if not found then raise exception 'sale not found'; end if;
  if old_sale.kind<>'Venta' then raise exception 'only completed sales can be edited'; end if;
  if member.role::text<>'admin' and old_sale.seller_id<>auth.uid() then raise exception 'access denied'; end if;
  if old_sale.payment_method='Cuenta cliente' and p_client_id is null then raise exception 'client required for account sale'; end if;
  if p_client_id is not null and not exists(select 1 from clients where id=p_client_id and business_id=p_business_id) then raise exception 'invalid client'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'empty sale'; end if;

  select coalesce((app_config->'options'->>'blockNoStock')::boolean,true)
    into block_no_stock
    from business_settings
   where business_id=p_business_id;
  block_no_stock:=coalesce(block_no_stock,true);

  -- Repõe a venda anterior antes de validar o novo carrinho. Todo o bloco roda
  -- na mesma transação; qualquer erro restaura automaticamente o estado antigo.
  update products p
     set stock=p.stock+si.quantity,updated_at=now()
    from sale_items si
   where si.sale_id=old_sale.id and si.business_id=p_business_id and p.id=si.product_id and p.business_id=p_business_id;

  if old_sale.client_id is not null then
    update clients set purchases=greatest(0,purchases-1),total_purchased=greatest(0,total_purchased-old_sale.total),updated_at=now()
     where id=old_sale.client_id and business_id=p_business_id;
  end if;

  if old_sale.payment_method='Cuenta cliente' and old_sale.client_id is not null then
    select coalesce(sum(amount),0) into old_debt
      from client_ledger
     where business_id=p_business_id and client_id=old_sale.client_id and kind='debit' and sale_id=old_sale.id;
    if old_debt>0 then
      update clients set balance=balance+old_debt,updated_at=now()
       where id=old_sale.client_id and business_id=p_business_id;
    end if;
    delete from client_ledger where business_id=p_business_id and client_id=old_sale.client_id and kind='debit' and sale_id=old_sale.id;
  end if;

  delete from sale_items where sale_id=old_sale.id and business_id=p_business_id;

  for item in select * from jsonb_array_elements(p_items) loop
    qty=(item->>'quantity')::numeric;
    unit_value=(item->>'unit_price')::numeric;
    base_value=coalesce(nullif(item->>'base_price','')::numeric,unit_value);
    if qty<=0 or unit_value<0 or base_value<unit_value then raise exception 'invalid item'; end if;
    select * into p from products where id=(item->>'product_id')::uuid and business_id=p_business_id for update;
    if not found then raise exception 'invalid product'; end if;
    if block_no_stock and p.stock<qty then raise exception 'insufficient stock for %',coalesce(p.name,'product'); end if;
    subtotal_value=subtotal_value+(qty*base_value);
    total_value=total_value+(qty*unit_value);
    item_discount_type=case when item->>'discount_type'='value' then 'value' else 'percent' end;
    item_discount_value=greatest(0,coalesce(nullif(item->>'discount_value','')::numeric,0));
    item_discount=(base_value-unit_value)*qty;
    update products set stock=stock-qty,updated_at=now() where id=p.id;
    insert into sale_items(business_id,sale_id,product_id,product_code,product_name,quantity,base_price,unit_price,discount_type,discount_value,discount,total)
    values(p_business_id,old_sale.id,p.id,p.code,p.name,qty,base_value,unit_value,item_discount_type,item_discount_value,item_discount,qty*unit_value);
  end loop;

  select name into customer_name from clients where id=p_client_id and business_id=p_business_id;
  update sales
     set client_id=p_client_id,client_name=coalesce(customer_name,'Consumidor final'),subtotal=subtotal_value,
         discount=subtotal_value-total_value,total=total_value,notes=p_notes,
         status=case when payment_method='Cuenta cliente' then 'pending' else 'completed' end
   where id=old_sale.id and business_id=p_business_id;

  if p_client_id is not null then
    update clients set purchases=purchases+1,total_purchased=total_purchased+total_value,updated_at=now()
     where id=p_client_id and business_id=p_business_id;
    if old_sale.payment_method='Cuenta cliente' then
      perform public.record_client_movement_v2(p_business_id,p_client_id,'debit',total_value,'Venta '||old_sale.sale_number||' — pendiente',old_sale.created_at,null,old_sale.sale_number,old_sale.id);
    end if;
  end if;

  if old_sale.payment_method='Cuenta cliente' then
    delete from cash_movements where business_id=p_business_id and sale_id=old_sale.id;
  else
    update cash_movements
       set amount=total_value,description='Venta '||old_sale.sale_number||' — '||old_sale.payment_method
     where business_id=p_business_id and sale_id=old_sale.id and kind='in';
    if not found then
      insert into cash_movements(business_id,kind,description,amount,employee_id,employee_name,sale_id)
      values(p_business_id,'in','Venta '||old_sale.sale_number||' — '||old_sale.payment_method,total_value,old_sale.seller_id,old_sale.seller_name,old_sale.id);
    end if;
  end if;

  update memberships
     set sales_total=greatest(0,sales_total+total_value-old_sale.total),
         average_ticket=greatest(0,sales_total+total_value-old_sale.total)/greatest(sales_count,1),updated_at=now()
   where business_id=p_business_id and user_id=old_sale.seller_id;

  return old_sale.id;
end $$;

revoke all on function public.register_sale(uuid,uuid,text,jsonb,text,text,text) from public,anon;
grant execute on function public.register_sale(uuid,uuid,text,jsonb,text,text,text) to authenticated;
revoke all on function public.update_sale(uuid,uuid,uuid,jsonb,text) from public,anon;
grant execute on function public.update_sale(uuid,uuid,uuid,jsonb,text) to authenticated;
