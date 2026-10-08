begin;
create temporary table grassi_qa as
select business_id as business,user_id as usr,gen_random_uuid() as client,gen_random_uuid() as other_client,gen_random_uuid() as product,gen_random_uuid() as req
from public.memberships where active and role::text='admin' limit 1;
grant select on grassi_qa to authenticated;
insert into public.clients(id,business_id,code,name) select client,business,'QA-'||client::text,'QA rollback payment' from grassi_qa;
insert into public.clients(id,business_id,code,name) select other_client,business,'QA-'||other_client::text,'QA rollback other' from grassi_qa;
insert into public.products(id,business_id,code,name,stock,min_stock,cost,price,wholesale_price,unit)
select product,business,'QA-'||product::text,'QA rollback product',10,0,50,100,90,'Unidad' from grassi_qa;
select set_config('request.jwt.claim.sub',usr::text,true) from grassi_qa;
set local role authenticated;
do $test$
declare q record; registration jsonb; sid uuid; payment jsonb; blocked boolean; debit numeric; qty numeric;
begin
 select * into q from grassi_qa;
 sid=public.register_sale(q.business,q.client,'Cuenta cliente',jsonb_build_array(jsonb_build_object('product_id',q.product,'quantity',1,'base_price',100,'unit_price',100)),null,gen_random_uuid()::text,'Venta');

 if sid is null then raise exception 'registration returned no saleId: %',registration; end if;
 payment=public.collect_account_payment(q.business,q.client,sid,40,'Efectivo','QA',q.req);
 if (select balance from public.clients where id=q.client)<>-60 then raise exception 'partial balance mismatch'; end if;
 if (select status from public.sales where id=sid)<>'partial' then raise exception 'partial status mismatch'; end if;
 perform public.collect_account_payment(q.business,q.client,sid,40,'Efectivo','QA',q.req);
 if (select count(*) from public.cash_movements where sale_id=sid)<>1 then raise exception 'duplicate cash'; end if;
 blocked=false;
 begin perform public.collect_account_payment(q.business,q.client,sid,61,'Efectivo',null,gen_random_uuid()); exception when others then blocked=true; end;
 if not blocked then raise exception 'overpayment accepted'; end if;
 blocked=false;
 begin perform public.collect_account_payment(q.business,q.other_client,sid,1,'Efectivo',null,gen_random_uuid()); exception when others then blocked=true; end;
 if not blocked then raise exception 'wrong client accepted'; end if;
 blocked=false;
 begin perform public.update_sale(q.business,sid,q.other_client,jsonb_build_array(jsonb_build_object('product_id',q.product,'quantity',1,'base_price',100,'unit_price',100)),null); exception when others then blocked=true; end;
 if not blocked then raise exception 'paid client changed'; end if;
 blocked=false;
 begin perform public.update_sale(q.business,sid,q.client,jsonb_build_array(jsonb_build_object('product_id',q.product,'quantity',1,'base_price',30,'unit_price',30)),null); exception when others then blocked=true; end;
 if not blocked then raise exception 'total below paid accepted'; end if;
 perform public.update_sale(q.business,sid,q.client,jsonb_build_array(jsonb_build_object('product_id',q.product,'quantity',2,'base_price',100,'unit_price',100)),null);
 if (select sum(amount) from public.cash_movements where sale_id=sid)<>40 then raise exception 'edit destroyed cash'; end if;
 if (select balance from public.clients where id=q.client)<>-160 then raise exception 'edited balance mismatch'; end if;
 if (select stock from public.products where id=q.product)<>8 then raise exception 'stock mismatch'; end if;
 perform public.collect_account_payment(q.business,q.client,sid,160,'PIX','QA',gen_random_uuid());
 if (select balance from public.clients where id=q.client)<>0 then raise exception 'settled balance mismatch'; end if;
 if (select status from public.sales where id=sid)<>'completed' then raise exception 'settled status mismatch'; end if;
 if (select sum(amount) from public.cash_movements where sale_id=sid)<>200 then raise exception 'settled cash mismatch'; end if;
 -- Standalone account debt is paid atomically as well.
 perform public.record_client_movement_v2(q.business,q.other_client,'debit',25,'QA debt');
 perform public.collect_account_payment(q.business,q.other_client,null,10,'Efectivo',null,gen_random_uuid());
 if (select balance from public.clients where id=q.other_client)<>-15 then raise exception 'general debt mismatch'; end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 blocked=false;
 begin perform public.collect_account_payment(q.business,q.client,sid,1,'Efectivo',null,gen_random_uuid()); exception when others then blocked=true; end;
 if not blocked then raise exception 'unauthorized accepted'; end if;
end $test$;
rollback;
select 'PASS: partial/full, idempotency, limits, edit preserves cash/stock/account, general debt and unauthorized calls; all fixtures rolled back' as validation;
