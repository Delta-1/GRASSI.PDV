-- All fixtures and mutations roll back, including attempt counters and sequences.
begin;
create temporary table reversal_qa as
select business_id business,user_id usr,gen_random_uuid() client,gen_random_uuid() product
from public.memberships where active and role::text='admin' limit 1;
grant select on reversal_qa to authenticated;
insert into public.clients(id,business_id,code,name)
select client,business,'QA-'||client::text,'QA reversal rollback' from reversal_qa;
insert into public.products(id,business_id,code,name,stock,min_stock,cost,price,wholesale_price,unit)
select product,business,'QA-'||product::text,'QA reversal product',100,0,50,100,90,'Unidad' from reversal_qa;
select set_config('request.jwt.claim.sub',usr::text,true) from reversal_qa;
set local role authenticated;
do $test$
declare q record; sid uuid; line_id uuid; req uuid=gen_random_uuid(); result jsonb; blocked boolean;
begin
 select * into q from reversal_qa;
 if q.business is null then raise exception 'QA membership missing'; end if;
 sid=public.register_sale(q.business,q.client,'Efectivo',jsonb_build_array(jsonb_build_object('product_id',q.product,'quantity',3,'base_price',100,'unit_price',100)),null,gen_random_uuid()::text,'Venta');
 select id into line_id from public.sale_items where sale_id=sid;
 result=public.reverse_sale(q.business,sid,'return',jsonb_build_array(jsonb_build_object('itemId',line_id,'quantity',1)),'Efectivo','QA invalid pin',gen_random_uuid(),'wrong');
 if result->>'error' is null then raise exception 'invalid pin accepted'; end if;
 if (select stock from public.products where id=q.product)<>97 then raise exception 'invalid PIN changed stock'; end if;
 result=public.reverse_sale(q.business,sid,'return',jsonb_build_array(jsonb_build_object('itemId',line_id,'quantity',1)),'PIX','QA partial',req,'1234');
 if (result->>'refund_amount')::numeric<>100 then raise exception 'cash refund mismatch'; end if;
 if (select stock from public.products where id=q.product)<>98 then raise exception 'partial stock mismatch'; end if;
 perform public.reverse_sale(q.business,sid,'return',jsonb_build_array(jsonb_build_object('itemId',line_id,'quantity',1)),'PIX','QA partial',req,'1234');
 if (select stock from public.products where id=q.product)<>98 then raise exception 'replay duplicated stock'; end if;
 blocked=false;
 begin perform public.reverse_sale(q.business,sid,'return',jsonb_build_array(jsonb_build_object('itemId',line_id,'quantity',3)),'Efectivo','QA too many',gen_random_uuid(),'1234'); exception when others then blocked=true; end;
 if not blocked then raise exception 'over-return accepted'; end if;
 blocked=false;
 begin perform public.update_sale(q.business,sid,q.client,jsonb_build_array(jsonb_build_object('product_id',q.product,'quantity',3,'base_price',100,'unit_price',100)),null); exception when others then blocked=true; end;
 if not blocked then raise exception 'returned sale edited'; end if;
 result=public.reverse_sale(q.business,sid,'cancel',null,'Efectivo','QA cancel remainder',gen_random_uuid(),'1234');
 if (result->>'refund_amount')::numeric<>200 then raise exception 'cancel refund mismatch'; end if;
 if (select status from public.sales where id=sid)<>'cancelled' then raise exception 'trigger erased cancelled status'; end if;
 if (select stock from public.products where id=q.product)<>100 then raise exception 'cancel stock mismatch'; end if;
 if (select sum(case when kind='in' then amount else -amount end) from public.cash_movements where sale_id=sid)<>0 then raise exception 'cash not balanced'; end if;
 if (select purchases from public.clients where id=q.client)<>0 then raise exception 'purchase count not restored'; end if;
 -- Partial account return first reduces debt; it refunds only excess receipts.
 sid=public.register_sale(q.business,q.client,'Cuenta cliente',jsonb_build_array(jsonb_build_object('product_id',q.product,'quantity',3,'base_price',100,'unit_price',100)),null,gen_random_uuid()::text,'Venta');
 select id into line_id from public.sale_items where sale_id=sid;
 perform public.collect_account_payment(q.business,q.client,sid,150,'QR',null,gen_random_uuid());
 result=public.reverse_sale(q.business,sid,'return',jsonb_build_array(jsonb_build_object('itemId',line_id,'quantity',1)),'QR','QA reduce debt',gen_random_uuid(),'1234');
 if (result->>'refund_amount')::numeric<>0 or (select balance from public.clients where id=q.client)<>-50 then raise exception 'debt reduction mismatch'; end if;
 perform public.collect_account_payment(q.business,q.client,sid,50,'Efectivo',null,gen_random_uuid());
 if (select status from public.sales where id=sid)<>'completed' then raise exception 'net sale did not settle'; end if;
 result=public.reverse_sale(q.business,sid,'cancel',null,'QR','QA account cancel',gen_random_uuid(),'1234');
 if (result->>'refund_amount')::numeric<>200 or (select balance from public.clients where id=q.client)<>0 then raise exception 'account cancel refund/balance mismatch'; end if;
 if (select stock from public.products where id=q.product)<>100 then raise exception 'account stock mismatch'; end if;
 blocked=false;
 begin perform public.collect_account_payment(q.business,q.client,sid,1,'QR',null,gen_random_uuid()); exception when others then blocked=true; end;
 if not blocked then raise exception 'cancelled sale accepted payment'; end if;
 blocked=false;
 begin perform public.record_sale_payment(q.business,sid,1,'QR',null,null,gen_random_uuid()::text); exception when others then blocked=true; end;
 if not blocked then raise exception 'legacy endpoint accepted cancelled sale'; end if;
 -- Fully return a partly paid purchase: no debt or negative cash remains.
 sid=public.register_sale(q.business,q.client,'Cuenta cliente',jsonb_build_array(jsonb_build_object('product_id',q.product,'quantity',3,'base_price',100,'unit_price',100)),null,gen_random_uuid()::text,'Venta');
 select id into line_id from public.sale_items where sale_id=sid;
 perform public.collect_account_payment(q.business,q.client,sid,250,'PIX',null,gen_random_uuid());
 result=public.reverse_sale(q.business,sid,'return',jsonb_build_array(jsonb_build_object('itemId',line_id,'quantity',1)),'PIX','QA excess refund',gen_random_uuid(),'1234');
 if (result->>'refund_amount')::numeric<>50 or (select balance from public.clients where id=q.client)<>0 then raise exception 'excess refund mismatch'; end if;
 result=public.reverse_sale(q.business,sid,'return',jsonb_build_array(jsonb_build_object('itemId',line_id,'quantity',2)),'PIX','QA full return',gen_random_uuid(),'1234');
 if (result->>'refund_amount')::numeric<>200 or (select status from public.sales where id=sid)<>'returned' then raise exception 'full return mismatch'; end if;
 if (select sum(case when kind='in' then amount else -amount end) from public.cash_movements where sale_id=sid)<>0 then raise exception 'account cash not balanced'; end if;
 -- Reject line IDs from other sales and cross-business authorization.
 blocked=false;
 begin perform public.reverse_sale(gen_random_uuid(),sid,'cancel',null,'QR','QA ownership',gen_random_uuid(),'1234'); exception when others then blocked=true; end;
 if not blocked then raise exception 'wrong business accepted'; end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 blocked=false;
 begin perform public.reverse_sale(q.business,sid,'cancel',null,'QR','QA outsider',gen_random_uuid(),'1234'); exception when others then blocked=true; end;
 if not blocked then raise exception 'outsider accepted'; end if;
end $test$;
rollback;
select 'PASS: PIN, partial/full returns, cancel, replay, over-return, edit/payment guards, stock, cash, debt and authorization; fixtures rolled back' validation;
