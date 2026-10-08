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
 if p_method is null or p_method not in ('Efectivo','PIX','QR','Transferencia','Tarjeta','Tarjeta débito','Tarjeta crédito') then raise exception 'invalid payment method'; end if;
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
  return jsonb_build_object('movementId',previous.id,'cashId',previous.id,'replayed',true,'amountPaid',sale.amount_paid,'clientBalance',customer.balance);
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
 return jsonb_build_object('movementId',movement_id,'cashId',cash_id,'remaining',remaining-p_amount,'amountPaid',coalesce(paid,0)+p_amount,'clientBalance',customer.balance+p_amount);
end $$;

-- One transaction settles any selection of purchases, with existing per-payment
-- authorization, ownership, overpayment and idempotency checks.
create or replace function public.collect_selected_payments(
 p_business_id uuid, p_client_id uuid, p_payments jsonb, p_method text, p_note text default null
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare payment jsonb; result jsonb; results jsonb='[]'::jsonb;
begin
 if jsonb_typeof(p_payments) is distinct from 'array' or jsonb_array_length(p_payments)=0 or jsonb_array_length(p_payments)>100 then raise exception 'invalid payment selection'; end if;
 if exists(select 1 from jsonb_array_elements(p_payments) entry group by entry->>'saleId' having count(*)>1) then raise exception 'duplicate sale selection'; end if;
 -- Match lock order for simultaneous batches and avoid deadlocks.
 for payment in select value from jsonb_array_elements(p_payments) order by value->>'saleId' loop
  if nullif(payment->>'saleId','') is null then raise exception 'sale required'; end if;
  result=grassi_private.collect_account_payment(p_business_id,p_client_id,(payment->>'saleId')::uuid,(payment->>'amount')::numeric,p_method,p_note,(payment->>'requestId')::uuid);
  results=results||jsonb_build_array(result||jsonb_build_object('saleId',payment->>'saleId'));
 end loop;
 select jsonb_agg(entry||jsonb_build_object('clientBalance',(select balance from public.clients where id=p_client_id and business_id=p_business_id))) into results from jsonb_array_elements(results) entry;
 return results;
end $$;
revoke all on function public.collect_selected_payments(uuid,uuid,jsonb,text,text) from public,anon;
grant execute on function public.collect_selected_payments(uuid,uuid,jsonb,text,text) to authenticated;
