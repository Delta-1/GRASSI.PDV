-- Preserve payment-state fields already deployed in production.
alter table public.sales add column if not exists amount_paid numeric(14,2) not null default 0;
alter table public.sales add column if not exists last_payment_method text;
alter table public.sales add column if not exists last_payment_at timestamptz;
create table if not exists public.sale_payments (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 sale_id uuid not null references public.sales(id) on delete cascade,
 client_id uuid not null references public.clients(id) on delete restrict,
 client_payment_id text not null, amount numeric(14,2) not null check(amount>0),
 payment_method text not null, notes text, received_by uuid references auth.users(id) on delete set null,
 received_by_name text, paid_at timestamptz not null default now(), created_at timestamptz not null default now(),
 unique(business_id,client_payment_id)
);
alter table public.sale_payments enable row level security;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='sale_payments' and policyname='sale_payments_select') then
  create policy sale_payments_select on public.sale_payments for select to authenticated using(public.is_member(business_id));
 end if;
end $$;
grant select on public.sale_payments to authenticated;
create index if not exists sale_payments_sale_idx on public.sale_payments(business_id,sale_id);

-- Every payment updates ledger, balance, sale status and cash in one transaction.
-- Internal privileged helper validates active membership and business ownership.
-- Public API is an invoker wrapper; existing table policies remain unchanged.
create schema if not exists grassi_private;
grant usage on schema grassi_private to authenticated;

create or replace function grassi_private.collect_account_payment(
 p_business_id uuid, p_client_id uuid, p_sale_id uuid, p_amount numeric,
 p_method text, p_note text, p_request_id uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 customer public.clients%rowtype; sale public.sales%rowtype;
 member public.memberships%rowtype; previous public.client_ledger%rowtype;
 paid numeric(14,2); remaining numeric(14,2); movement_id uuid; cash_id uuid;
 description_value text;
begin
 select * into member from public.memberships where business_id=p_business_id and user_id=auth.uid() and active;
 if not found then raise exception 'access denied'; end if;
 if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) or p_request_id is null then raise exception 'invalid amount or request'; end if;
 if p_method is null or p_method not in ('Efectivo','PIX','QR','Transferencia','Tarjeta') then raise exception 'invalid payment method'; end if;
 -- Serialize edits/payments using the same sale lock order as update_sale.
 if p_sale_id is not null then
  select * into sale from public.sales where id=p_sale_id and business_id=p_business_id for update;
  if not found or sale.client_id is distinct from p_client_id or sale.kind<>'Venta' or sale.payment_method<>'Cuenta cliente' then raise exception 'invalid account sale'; end if;
 end if;
 select * into customer from public.clients where id=p_client_id and business_id=p_business_id for update;
 if not found then raise exception 'invalid client'; end if;
 -- Retry the same confirmed request without charging twice.
 select * into previous from public.client_ledger where id=p_request_id and business_id=p_business_id;
 if found then
  if previous.client_id is distinct from p_client_id or previous.sale_id is distinct from p_sale_id or previous.amount<>p_amount or previous.payment_method is distinct from p_method then raise exception 'request already used'; end if;
  return jsonb_build_object('movementId',previous.id,'cashId',previous.id,'replayed',true);
 end if;
 if exists(select 1 from public.cash_movements where id=p_request_id) then raise exception 'request already used'; end if;
 if p_sale_id is not null then
  select coalesce(sum(amount),0) into paid from public.client_ledger where business_id=p_business_id and sale_id=p_sale_id and kind='credit' and payment_method is not null;
  paid=greatest(paid,sale.amount_paid);
  remaining=greatest(0,sale.total-paid);
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
  update public.sales set amount_paid=paid+p_amount,last_payment_method=p_method,last_payment_at=now(),status=case when paid+p_amount>=total then 'completed' else 'partial' end where id=p_sale_id and business_id=p_business_id;
 end if;
 return jsonb_build_object('movementId',movement_id,'cashId',cash_id,'remaining',remaining-p_amount,'amountPaid',coalesce(paid,0)+p_amount);
end $$;
revoke all on function grassi_private.collect_account_payment(uuid,uuid,uuid,numeric,text,text,uuid) from public,anon;
grant execute on function grassi_private.collect_account_payment(uuid,uuid,uuid,numeric,text,text,uuid) to authenticated;
create or replace function public.collect_account_payment(
 p_business_id uuid, p_client_id uuid, p_sale_id uuid, p_amount numeric,
 p_method text, p_note text, p_request_id uuid
) returns jsonb language sql security invoker set search_path='' as $$
 select grassi_private.collect_account_payment(p_business_id,p_client_id,p_sale_id,p_amount,p_method,p_note,p_request_id);
$$;
revoke all on function public.collect_account_payment(uuid,uuid,uuid,numeric,text,text,uuid) from public,anon;
grant execute on function public.collect_account_payment(uuid,uuid,uuid,numeric,text,text,uuid) to authenticated;

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
  customer_name text; old_debt numeric(14,2):=0; paid_value numeric(14,2):=0; block_no_stock boolean:=true;
begin
  select * into member from memberships where business_id=p_business_id and user_id=auth.uid() and active;
  if not found then raise exception 'access denied'; end if;

  select * into old_sale from sales where id=p_sale_id and business_id=p_business_id for update;
  if not found then raise exception 'sale not found'; end if;
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
end $$;


revoke all on function public.update_sale(uuid,uuid,uuid,jsonb,text) from public,anon;
grant execute on function public.update_sale(uuid,uuid,uuid,jsonb,text) to authenticated;
