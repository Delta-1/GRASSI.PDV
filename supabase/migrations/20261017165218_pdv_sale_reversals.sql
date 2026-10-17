-- Complete and version the previously staged returns API.
alter table public.sales add column if not exists returned_total numeric(14,2) not null default 0 check(returned_total>=0 and returned_total<=total);
alter table public.sales add column if not exists refunded_total numeric(14,2) not null default 0 check(refunded_total>=0);
alter table public.sales add column if not exists is_deleted boolean not null default false;
alter table public.sale_items add column if not exists returned_quantity numeric(14,3) not null default 0 check(returned_quantity>=0 and returned_quantity<=quantity);
alter table public.sale_items add column if not exists returned_amount numeric(14,2) not null default 0 check(returned_amount>=0 and returned_amount<=total);
alter table public.cash_movements add column if not exists payment_method text;
create schema if not exists grassi_private;
create table if not exists grassi_private.supervisor_pins(
 business_id uuid primary key references public.businesses(id) on delete cascade, pin_hash text not null
);
create table if not exists grassi_private.supervisor_attempts(
 business_id uuid references public.businesses(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade,
 failures integer not null default 0, locked_until timestamptz, primary key(business_id,user_id)
);
alter table grassi_private.supervisor_pins enable row level security;
alter table grassi_private.supervisor_attempts enable row level security;
revoke all on grassi_private.supervisor_pins,grassi_private.supervisor_attempts from public,anon,authenticated;
-- Deny direct access; only membership-checked private functions can use these tables.
drop policy if exists supervisor_pins_deny on grassi_private.supervisor_pins;
create policy supervisor_pins_deny on grassi_private.supervisor_pins to authenticated using(false) with check(false);
drop policy if exists supervisor_attempts_deny on grassi_private.supervisor_attempts;
create policy supervisor_attempts_deny on grassi_private.supervisor_attempts to authenticated using(false) with check(false);
insert into grassi_private.supervisor_pins(business_id,pin_hash)
 select id,extensions.crypt('1234',extensions.gen_salt('bf')) from public.businesses on conflict do nothing;
create table if not exists public.sale_reversals(
 id uuid primary key, business_id uuid not null references public.businesses(id) on delete cascade,
 sale_id uuid not null references public.sales(id), action text not null check(action in ('return','cancel')),
 amount numeric(14,2) not null check(amount>=0), refund_amount numeric(14,2) not null check(refund_amount>=0),
 payment_method text not null, reason text not null, items jsonb not null, item_request jsonb,
 actor_id uuid not null references auth.users(id), actor_name text, created_at timestamptz not null default now()
);
alter table public.sale_reversals enable row level security;
drop policy if exists sale_reversals_select on public.sale_reversals;
create policy sale_reversals_select on public.sale_reversals for select to authenticated using(public.is_member(business_id));
grant select on public.sale_reversals to authenticated;
create index if not exists sale_reversals_sale_idx on public.sale_reversals(business_id,sale_id,created_at);
grant usage on schema grassi_private to authenticated;

CREATE OR REPLACE FUNCTION public.normalize_sale_payment_state()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.is_deleted or new.status in ('cancelled','returned') then return new; end if;
  if new.payment_method<>'Cuenta cliente' then
    new.amount_paid:=new.total;
    new.status:='completed';
    new.last_payment_method:=coalesce(new.last_payment_method,new.payment_method);
    new.last_payment_at:=coalesce(new.last_payment_at,new.created_at,now());
  else
    if new.amount_paid<0 or new.amount_paid>new.total then
      raise exception 'paid amount exceeds sale total';
    end if;
    new.status:=case
      when new.amount_paid-new.refunded_total>=new.total-new.returned_total then 'completed'
      when new.amount_paid>0 then 'partial'
      else 'pending'
    end;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION grassi_private.reverse_sale(p_business_id uuid, p_sale_id uuid, p_action text, p_items jsonb, p_method text, p_reason text, p_request_id uuid, p_pin text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 member public.memberships%rowtype; sale public.sales%rowtype;
 previous public.sale_reversals%rowtype; line public.sale_items%rowtype;
 attempt grassi_private.supervisor_attempts%rowtype; expected_hash text;
 selected jsonb; returned_items jsonb='[]'::jsonb;
 quantity_value numeric(14,3); line_value numeric(14,2); value_total numeric(14,2)=0;
 paid_value numeric(14,2); refund_value numeric(14,2); net_value numeric(14,2);
 all_returned boolean; stock_row record; response jsonb;
begin
 select * into member from public.memberships where business_id=p_business_id and user_id=auth.uid() and active;
 if not found then raise exception 'access denied'; end if;
 if p_action is null or p_action not in('return','cancel') or p_request_id is null then raise exception 'invalid reversal'; end if;
 if p_method is null or p_method not in('Efectivo','PIX','QR','Transferencia','Tarjeta','Tarjeta débito','Tarjeta crédito') then raise exception 'invalid payment method'; end if;
 if nullif(trim(p_reason),'') is null or length(p_reason)>240 then raise exception 'Indique el motivo (hasta 240 caracteres)'; end if;
 insert into grassi_private.supervisor_attempts(business_id,user_id) values(p_business_id,auth.uid()) on conflict do nothing;
 select * into attempt from grassi_private.supervisor_attempts where business_id=p_business_id and user_id=auth.uid() for update;
 if attempt.locked_until>now() then return jsonb_build_object('error','Demasiados intentos. Intente de nuevo en unos minutos.'); end if;
 if attempt.locked_until is not null then attempt.failures=0; end if;
 select pin_hash into expected_hash from grassi_private.supervisor_pins where business_id=p_business_id;
 if expected_hash is null then raise exception 'Configure la contraseña del supervisor'; end if;
 if p_pin is null or length(p_pin)>64 or extensions.crypt(p_pin,expected_hash) is distinct from expected_hash then
  update grassi_private.supervisor_attempts set failures=attempt.failures+1,locked_until=case when attempt.failures+1>=5 then now()+interval '10 minutes' else null end where business_id=p_business_id and user_id=auth.uid();
  -- Return an error instead of raising, so failed-attempt counters commit.
  return jsonb_build_object('error','Contraseña del supervisor incorrecta');
 end if;
 update grassi_private.supervisor_attempts set failures=0,locked_until=null where business_id=p_business_id and user_id=auth.uid();
 select * into sale from public.sales where id=p_sale_id and business_id=p_business_id for update;
 if not found or sale.kind<>'Venta' then raise exception 'Venta no encontrada'; end if;
 select * into previous from public.sale_reversals where id=p_request_id;
 if found then
  if previous.business_id<>p_business_id or previous.sale_id<>p_sale_id or previous.action<>p_action or previous.item_request is distinct from p_items or previous.payment_method<>p_method or previous.reason<>trim(p_reason) then raise exception 'request already used'; end if;
  return to_jsonb(previous)||jsonb_build_object('replayed',true);
 end if;
 if sale.is_deleted or sale.status in('cancelled','returned') then raise exception 'La venta ya fue cancelada o devuelta'; end if;
 if p_action='return' and (jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>200) then raise exception 'Seleccione los productos a devolver'; end if;
 if p_action='return' and exists(select 1 from jsonb_array_elements(p_items) i group by i->>'itemId' having count(*)>1) then raise exception 'Producto repetido en la devolución'; end if;
 if sale.client_id is not null then perform 1 from public.clients where id=sale.client_id and business_id=p_business_id for update; end if;
 for selected in select value from jsonb_array_elements(case when p_action='cancel' then
  (select coalesce(jsonb_agg(jsonb_build_object('itemId',id,'quantity',quantity-returned_quantity)),'[]') from public.sale_items where sale_id=p_sale_id and business_id=p_business_id and quantity>returned_quantity)
  else p_items end) order by value->>'itemId'
 loop
  select * into line from public.sale_items where id=(selected->>'itemId')::uuid and sale_id=p_sale_id and business_id=p_business_id for update;
  if not found then raise exception 'Producto de otra venta o no encontrado'; end if;
  if (selected->>'quantity')::numeric is null or (selected->>'quantity')::numeric<>round((selected->>'quantity')::numeric,3) then raise exception 'Cantidad inválida'; end if;
  quantity_value=(selected->>'quantity')::numeric;
  if quantity_value<=0 or quantity_value>line.quantity-line.returned_quantity then raise exception 'La cantidad supera lo disponible para devolver'; end if;
  line_value=case when quantity_value=line.quantity-line.returned_quantity then line.total-line.returned_amount else round(line.total*quantity_value/line.quantity,2) end;
  if line_value>line.total-line.returned_amount then raise exception 'Valor de devolución inválido'; end if;
  update public.sale_items set returned_quantity=returned_quantity+quantity_value,returned_amount=returned_amount+line_value where id=line.id;
  returned_items=returned_items||jsonb_build_array(jsonb_build_object('itemId',line.id,'productId',line.product_id,'name',line.product_name,'quantity',quantity_value,'amount',line_value));
  value_total=value_total+line_value;
 end loop;
 if jsonb_array_length(returned_items)=0 then raise exception 'La venta no tiene productos disponibles'; end if;
 for stock_row in select (j->>'productId')::uuid as product_id,sum((j->>'quantity')::numeric) as quantity from jsonb_array_elements(returned_items) j group by (j->>'productId')::uuid order by (j->>'productId')::uuid loop
  update public.products set stock=stock+stock_row.quantity,updated_at=now() where id=stock_row.product_id and business_id=p_business_id;
 end loop;
 select not exists(select 1 from public.sale_items where sale_id=p_sale_id and business_id=p_business_id and quantity>returned_quantity) into all_returned;
 if all_returned then value_total=sale.total-sale.returned_total; end if;
 net_value=sale.total-sale.returned_total-value_total;
 if sale.payment_method='Cuenta cliente' then
  select greatest(sale.amount_paid,coalesce(sum(amount),0)) into paid_value from public.client_ledger where business_id=p_business_id and sale_id=p_sale_id and kind='credit' and payment_method is not null;
 else paid_value=sale.total; end if;
 refund_value=greatest(0,paid_value-sale.refunded_total-net_value);
 if sale.client_id is not null then
  update public.clients set total_purchased=greatest(0,total_purchased-value_total),purchases=greatest(0,purchases-case when all_returned then 1 else 0 end),balance=balance+case when sale.payment_method='Cuenta cliente' then value_total-refund_value else 0 end,updated_at=now() where id=sale.client_id and business_id=p_business_id;
  if sale.payment_method='Cuenta cliente' and value_total>0 then
   insert into public.client_ledger(business_id,client_id,kind,amount,description,sale_id,reference,created_by)
   values(p_business_id,sale.client_id,'credit',value_total,case when p_action='cancel' then 'Cancelación' else 'Devolución' end||' — Venta '||sale.sale_number,p_sale_id,sale.sale_number,auth.uid());
  end if;
  if sale.payment_method='Cuenta cliente' and refund_value>0 then
   insert into public.client_ledger(business_id,client_id,kind,amount,description,sale_id,reference,payment_method,created_by)
   values(p_business_id,sale.client_id,'debit',refund_value,'Reembolso '||p_method||' — Venta '||sale.sale_number,p_sale_id,sale.sale_number,p_method,auth.uid());
  end if;
 end if;
 if refund_value>0 then
  insert into public.cash_movements(id,business_id,kind,description,amount,employee_id,employee_name,sale_id,payment_method)
  values(p_request_id,p_business_id,'out','Reembolso '||p_method||' — Venta '||sale.sale_number,refund_value,auth.uid(),member.display_name,p_sale_id,p_method);
 end if;
 update public.memberships set sales_total=greatest(0,sales_total-value_total),sales_count=greatest(0,sales_count-case when all_returned then 1 else 0 end),updated_at=now() where business_id=p_business_id and user_id=sale.seller_id;
 update public.memberships set average_ticket=case when sales_count>0 then sales_total/sales_count else 0 end where business_id=p_business_id and user_id=sale.seller_id;
 update public.sales set returned_total=returned_total+value_total,refunded_total=refunded_total+refund_value,is_deleted=p_action='cancel',status=case when p_action='cancel' then 'cancelled' when all_returned then 'returned' when paid_value-sale.refunded_total-refund_value>=net_value then 'completed' when paid_value>0 then 'partial' else 'pending' end where id=p_sale_id;
 insert into public.sale_reversals(id,business_id,sale_id,action,amount,refund_amount,payment_method,reason,items,item_request,actor_id,actor_name)
 values(p_request_id,p_business_id,p_sale_id,p_action,value_total,refund_value,p_method,trim(p_reason),returned_items,p_items,auth.uid(),member.display_name) returning to_jsonb(sale_reversals.*) into response;
 return response;
end $function$;

CREATE OR REPLACE FUNCTION public.reverse_sale(p_business_id uuid, p_sale_id uuid, p_action text, p_items jsonb, p_method text, p_reason text, p_request_id uuid, p_pin text)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$select grassi_private.reverse_sale(p_business_id,p_sale_id,p_action,p_items,p_method,p_reason,p_request_id,p_pin);$function$;

CREATE OR REPLACE FUNCTION public.update_sale(p_business_id uuid, p_sale_id uuid, p_client_id uuid, p_items jsonb, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  member memberships%rowtype; old_sale sales%rowtype; item jsonb; p products%rowtype;
  subtotal_value numeric(14,2):=0; total_value numeric(14,2):=0;
  qty numeric(14,3); base_value numeric(14,2); unit_value numeric(14,2);
  item_discount numeric(14,2); item_discount_type text; item_discount_value numeric(14,2);
  customer_name text; old_debt numeric(14,2):=0; paid_value numeric(14,2):=0; block_no_stock boolean:=true;
begin
  select * into member from memberships where business_id=p_business_id and user_id=auth.uid() and active;
  if not found then raise exception 'access denied'; end if;

  select * into old_sale from sales where id=p_sale_id and business_id=p_business_id for update;
  if not found then raise exception 'sale not found'; end if;
  if old_sale.is_deleted or old_sale.status in ('cancelled','returned') or old_sale.returned_total>0
     or exists(select 1 from public.sale_reversals where business_id=p_business_id and sale_id=p_sale_id)
  then raise exception 'No se puede editar una venta cancelada o con devoluciones'; end if;
  select coalesce(sum(amount),0) into paid_value from client_ledger where business_id=p_business_id and sale_id=old_sale.id and kind='credit' and payment_method is not null;
  paid_value=greatest(paid_value,old_sale.amount_paid);
  if old_sale.payment_method='Cuenta cliente' and paid_value>0 and p_client_id is distinct from old_sale.client_id then raise exception 'paid sale cannot change client'; end if;
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
  update products restored
     set stock=restored.stock+si.quantity,updated_at=now()
    from sale_items si
   where si.sale_id=old_sale.id and si.business_id=p_business_id and restored.id=si.product_id and restored.business_id=p_business_id;

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

  if old_sale.payment_method='Cuenta cliente' and total_value<paid_value then raise exception 'sale total below received payments'; end if;
  select name into customer_name from clients where id=p_client_id and business_id=p_business_id;
  update sales
     set client_id=p_client_id,client_name=coalesce(customer_name,'Consumidor final'),subtotal=subtotal_value,
         discount=subtotal_value-total_value,total=total_value,notes=p_notes,
         status=case when payment_method<>'Cuenta cliente' or paid_value>=total_value then 'completed' when paid_value>0 then 'partial' else 'pending' end
   where id=old_sale.id and business_id=p_business_id;

  if p_client_id is not null then
    update clients set purchases=purchases+1,total_purchased=total_purchased+total_value,updated_at=now()
     where id=p_client_id and business_id=p_business_id;
    if old_sale.payment_method='Cuenta cliente' then
      perform public.record_client_movement_v2(p_business_id,p_client_id,'debit',total_value,'Venta '||old_sale.sale_number||' — pendiente',old_sale.created_at,null,old_sale.sale_number,old_sale.id);
    end if;
  end if;

  if old_sale.payment_method<>'Cuenta cliente' then
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
end $function$;

CREATE OR REPLACE FUNCTION public.record_sale_payment(p_business_id uuid, p_sale_id uuid, p_amount numeric, p_payment_method text, p_paid_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_notes text DEFAULT NULL::text, p_client_payment_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  member public.memberships%rowtype;
  target_sale public.sales%rowtype;
  existing_payment public.sale_payments%rowtype;
  payment_id uuid;
  paid_value numeric(14,2);
  remaining_value numeric(14,2);
  next_status text;
begin
  select * into member
    from public.memberships
   where business_id=p_business_id and user_id=auth.uid() and active;
  if not found then raise exception 'access denied'; end if;
  if p_client_payment_id is null or length(trim(p_client_payment_id))<8 then raise exception 'invalid client payment id'; end if;

  select * into existing_payment
    from public.sale_payments
   where business_id=p_business_id and client_payment_id=p_client_payment_id;
  if found then
    select * into target_sale from public.sales where id=existing_payment.sale_id and business_id=p_business_id;
    return jsonb_build_object(
      'paymentId',existing_payment.id,
      'amountPaid',target_sale.amount_paid,
      'remaining',greatest(0,target_sale.total-target_sale.amount_paid),
      'status',target_sale.status
    );
  end if;

  select * into target_sale
    from public.sales
   where id=p_sale_id and business_id=p_business_id
   for update;
  if not found then raise exception 'sale not found'; end if;
  if target_sale.is_deleted or target_sale.status in ('cancelled','returned') or target_sale.returned_total>0 then raise exception 'Use el cobro actualizado para ventas con devoluciones'; end if;
  if target_sale.kind<>'Venta' or target_sale.payment_method<>'Cuenta cliente' then raise exception 'sale does not accept later payment'; end if;
  if target_sale.client_id is null then raise exception 'sale has no client'; end if;
  if nullif(trim(coalesce(p_payment_method,'')),'') is null then raise exception 'invalid payment method'; end if;

  paid_value=round(coalesce(p_amount,0)::numeric,2);
  remaining_value=greatest(0,target_sale.total-target_sale.amount_paid);
  if paid_value<=0 then raise exception 'invalid amount'; end if;
  if paid_value>remaining_value then raise exception 'payment exceeds remaining balance'; end if;

  insert into public.sale_payments(
    business_id,sale_id,client_id,client_payment_id,amount,payment_method,notes,received_by,received_by_name,paid_at
  ) values(
    p_business_id,target_sale.id,target_sale.client_id,trim(p_client_payment_id),paid_value,trim(p_payment_method),
    nullif(trim(coalesce(p_notes,'')),''),auth.uid(),member.display_name,coalesce(p_paid_at,now())
  ) returning id into payment_id;

  perform public.record_client_movement_v2(
    p_business_id,target_sale.client_id,'credit',paid_value,
    'Pago venta '||target_sale.sale_number||' — '||trim(p_payment_method),
    coalesce(p_paid_at,now()),trim(p_payment_method),target_sale.sale_number,target_sale.id
  );

  insert into public.cash_movements(business_id,kind,description,amount,employee_id,employee_name,sale_id,created_at)
  values(
    p_business_id,'in','Pago venta '||target_sale.sale_number||' — '||trim(p_payment_method),paid_value,
    auth.uid(),member.display_name,target_sale.id,coalesce(p_paid_at,now())
  );

  update public.sales
     set amount_paid=amount_paid+paid_value,
         last_payment_method=trim(p_payment_method),
         last_payment_at=coalesce(p_paid_at,now())
   where id=target_sale.id and business_id=p_business_id
   returning amount_paid,status into paid_value,next_status;

  return jsonb_build_object(
    'paymentId',payment_id,
    'amountPaid',paid_value,
    'remaining',greatest(0,target_sale.total-paid_value),
    'status',next_status
  );
end $function$;

CREATE OR REPLACE FUNCTION grassi_private.collect_account_payment(p_business_id uuid, p_client_id uuid, p_sale_id uuid, p_amount numeric, p_method text, p_note text, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 customer public.clients%rowtype; sale public.sales%rowtype;
 member public.memberships%rowtype; previous public.client_ledger%rowtype;
 paid numeric(14,2); remaining numeric(14,2); movement_id uuid; cash_id uuid;
 description_value text;
begin
 select * into member from public.memberships where business_id=p_business_id and user_id=auth.uid() and active;
 if not found then raise exception 'access denied'; end if;
 if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) or p_request_id is null then raise exception 'invalid amount or request'; end if;
 if p_method is null or p_method not in ('Efectivo','PIX','QR','Transferencia','Tarjeta','Tarjeta débito','Tarjeta crédito') then raise exception 'invalid payment method'; end if;
 -- Serialize edits/payments using the same sale lock order as update_sale.
 if p_sale_id is not null then
  select * into sale from public.sales where id=p_sale_id and business_id=p_business_id for update;
  if not found or sale.client_id is distinct from p_client_id or sale.kind<>'Venta' or sale.is_deleted or sale.status in('cancelled','returned') or sale.payment_method<>'Cuenta cliente' then raise exception 'invalid account sale'; end if;
 end if;
 select * into customer from public.clients where id=p_client_id and business_id=p_business_id for update;
 if not found then raise exception 'invalid client'; end if;
 -- Retry the same confirmed request without charging twice.
 select * into previous from public.client_ledger where id=p_request_id and business_id=p_business_id;
 if found then
  if previous.client_id is distinct from p_client_id or previous.sale_id is distinct from p_sale_id or previous.amount<>p_amount or previous.payment_method is distinct from p_method then raise exception 'request already used'; end if;
  return jsonb_build_object('movementId',previous.id,'cashId',previous.id,'replayed',true,'amountPaid',sale.amount_paid,'clientBalance',customer.balance);
 end if;
 if exists(select 1 from public.cash_movements where id=p_request_id) then raise exception 'request already used'; end if;
 if p_sale_id is not null then
  select coalesce(sum(amount),0) into paid from public.client_ledger where business_id=p_business_id and sale_id=p_sale_id and kind='credit' and payment_method is not null;
  paid=greatest(paid,sale.amount_paid);
  remaining=greatest(0,sale.total-sale.returned_total-paid+sale.refunded_total);
 else
  remaining=greatest(0,-customer.balance);
 end if;
 if p_amount>remaining then raise exception 'payment exceeds remaining debt'; end if;
 description_value='Pago '||p_method||case when p_sale_id is not null then ' — Venta '||sale.sale_number else ' — Crediario' end||case when nullif(trim(p_note),'') is not null then ' — '||trim(p_note) else '' end;
 insert into public.client_ledger(id,business_id,client_id,kind,amount,description,effective_at,payment_method,reference,sale_id,created_by)
 values(p_request_id,p_business_id,p_client_id,'credit',p_amount,description_value,now(),p_method,coalesce(sale.sale_number,'Pago de crediario'),p_sale_id,auth.uid()) returning id into movement_id;
 update public.clients set balance=balance+p_amount,updated_at=now() where id=p_client_id and business_id=p_business_id;
 insert into public.cash_movements(id,business_id,kind,description,amount,employee_id,employee_name,sale_id)
 values(p_request_id,p_business_id,'in',description_value||' — '||customer.name,p_amount,auth.uid(),member.display_name,p_sale_id) returning id into cash_id;
 if p_sale_id is not null then
  insert into public.sale_payments(id,business_id,sale_id,client_id,client_payment_id,amount,payment_method,notes,received_by,received_by_name)
  values(p_request_id,p_business_id,p_sale_id,p_client_id,p_request_id::text,p_amount,p_method,p_note,auth.uid(),member.display_name);
  update public.sales set amount_paid=paid+p_amount,last_payment_method=p_method,last_payment_at=now(),status=case when paid+p_amount-sale.refunded_total>=total-returned_total then 'completed' else 'partial' end where id=p_sale_id and business_id=p_business_id;
 end if;
 return jsonb_build_object('movementId',movement_id,'cashId',cash_id,'remaining',remaining-p_amount,'amountPaid',coalesce(paid,0)+p_amount,'clientBalance',customer.balance+p_amount);
end $function$;


revoke all on function grassi_private.reverse_sale(uuid,uuid,text,jsonb,text,text,uuid,text) from public,anon;
grant execute on function grassi_private.reverse_sale(uuid,uuid,text,jsonb,text,text,uuid,text) to authenticated;
revoke all on function public.reverse_sale(uuid,uuid,text,jsonb,text,text,uuid,text) from public,anon;
grant execute on function public.reverse_sale(uuid,uuid,text,jsonb,text,text,uuid,text) to authenticated;
-- Keep the existing RPC grants and sale lock order. Terminal sales cannot be edited or paid.
notify pgrst,'reload schema';

