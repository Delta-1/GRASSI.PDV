-- Extend existing allowlists only; preserve all authorization, locking,
-- idempotency checks, function ownership and execution grants.
do $migration$
declare target record; definition text; changed integer=0;
begin
 for target in
  select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='grassi_private' and p.proname in ('collect_account_payment','reverse_sale')
 loop
  definition=pg_get_functiondef(target.oid);
  if position('''Cheque''' in definition)=0 then
   if position('''Tarjeta crédito''' in definition)=0 then
    raise exception 'Payment allowlist not found in %',target.oid::regprocedure;
   end if;
   definition=replace(definition,'''Tarjeta crédito''','''Tarjeta crédito'',''Cheque''');
   execute definition;
  end if;
  changed=changed+1;
 end loop;
 if changed<>2 then raise exception 'Expected two payment functions, found %',changed; end if;
end $migration$;
