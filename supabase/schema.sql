-- GRASSI PDV — schema inicial para Supabase/PostgreSQL
-- Execute no SQL Editor de um projeto novo. Não use service_role no frontend.
create extension if not exists pgcrypto;

create type public.member_role as enum ('admin','employee');
create type public.ledger_kind as enum ('credit','debit');
create type public.cash_kind as enum ('in','out');

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  tax_id text,
  phone text,
  city text,
  currency text not null default 'Bs',
  created_at timestamptz not null default now()
);

create table public.memberships (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'employee',
  display_name text not null,
  email text,
  job_title text,
  phone text,
  document text,
  avatar_url text,
  supervisor boolean not null default false,
  active boolean not null default true,
  sales_count integer not null default 0,
  sales_total numeric(14,2) not null default 0,
  average_ticket numeric(14,2) not null default 0,
  goal_progress numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  primary key (business_id,user_id)
);
create index memberships_user_idx on public.memberships(user_id,business_id);

create table public.products (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  code text not null, ean text, name text not null, category text not null default 'General', unit text not null default 'Unidad', notes text,
  stock numeric(14,3) not null default 0 check(stock >= 0), min_stock numeric(14,3) not null default 0,
  cost numeric(14,2) not null default 0, price numeric(14,2) not null default 0, wholesale_price numeric(14,2) not null default 0,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(business_id,code)
);
create index products_business_search_idx on public.products(business_id,name,code);

create table public.clients (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  code text not null, name text not null, customer_type text not null default 'Minorista', phone text, document text, city text, notes text, avatar_url text,
  balance numeric(14,2) not null default 0, purchases integer not null default 0, total_purchased numeric(14,2) not null default 0,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(business_id,code)
);
create index clients_business_search_idx on public.clients(business_id,name,document);

create table public.client_ledger (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade, kind public.ledger_kind not null,
  amount numeric(14,2) not null check(amount > 0), description text not null, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create index client_ledger_client_idx on public.client_ledger(business_id,client_id,created_at desc);

create table public.sales (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  sale_number text not null, client_sale_id text not null, kind text not null default 'Venta', client_id uuid references public.clients(id), client_name text,
  seller_id uuid not null references auth.users(id), seller_name text not null, payment_method text not null,
  subtotal numeric(14,2) not null, discount numeric(14,2) not null default 0, total numeric(14,2) not null,
  notes text, status text not null default 'completed', created_at timestamptz not null default now(), unique(business_id,sale_number), unique(business_id,client_sale_id)
);
create index sales_business_date_idx on public.sales(business_id,created_at desc);
create index sales_seller_idx on public.sales(business_id,seller_id,created_at desc);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade, product_id uuid not null references public.products(id),
  product_name text not null, quantity numeric(14,3) not null check(quantity > 0), unit_price numeric(14,2) not null, total numeric(14,2) not null
);
create index sale_items_sale_idx on public.sale_items(business_id,sale_id);

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  kind public.cash_kind not null, description text not null, amount numeric(14,2) not null check(amount > 0),
  employee_id uuid references auth.users(id), employee_name text, sale_id uuid references public.sales(id), created_at timestamptz not null default now()
);
create index cash_business_date_idx on public.cash_movements(business_id,created_at desc);

create table public.business_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  theme jsonb not null default '{"mode":"light","palette":"blue","accent":"#0098f9"}',
  pos_layout jsonb not null default '{"dock":"sidebar","density":"comfortable","theme":"touch","items":["client","wholesale","delivery","notes","payment"]}',
  updated_at timestamptz not null default now()
);

create or replace function public.is_member(p_business_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from memberships where business_id=p_business_id and user_id=(select auth.uid()) and active);
$$;
create or replace function public.is_admin(p_business_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from memberships where business_id=p_business_id and user_id=(select auth.uid()) and role='admin' and active);
$$;

alter table public.businesses enable row level security; alter table public.memberships enable row level security;
alter table public.products enable row level security; alter table public.clients enable row level security;
alter table public.client_ledger enable row level security; alter table public.sales enable row level security;
alter table public.sale_items enable row level security; alter table public.cash_movements enable row level security;
alter table public.business_settings enable row level security;

create policy businesses_select on public.businesses for select to authenticated using (public.is_member(id));
create policy businesses_admin_update on public.businesses for update to authenticated using (public.is_admin(id)) with check (public.is_admin(id));
create policy memberships_select on public.memberships for select to authenticated using (public.is_member(business_id));
create policy memberships_admin_write on public.memberships for all to authenticated using (public.is_admin(business_id)) with check (public.is_admin(business_id));
create policy products_select on public.products for select to authenticated using (public.is_member(business_id));
create policy products_admin_write on public.products for all to authenticated using (public.is_admin(business_id)) with check (public.is_admin(business_id));
create policy clients_select on public.clients for select to authenticated using (public.is_member(business_id));
create policy clients_insert on public.clients for insert to authenticated with check (public.is_member(business_id));
create policy clients_admin_update on public.clients for update to authenticated using (public.is_admin(business_id)) with check (public.is_admin(business_id));
create policy ledger_select on public.client_ledger for select to authenticated using (public.is_member(business_id));
create policy sales_select on public.sales for select to authenticated using (public.is_member(business_id));
create policy sale_items_select on public.sale_items for select to authenticated using (public.is_member(business_id));
create policy cash_select on public.cash_movements for select to authenticated using (public.is_member(business_id));
create policy cash_insert on public.cash_movements for insert to authenticated with check (public.is_member(business_id));
create policy settings_select on public.business_settings for select to authenticated using (public.is_member(business_id));
create policy settings_admin_write on public.business_settings for all to authenticated using (public.is_admin(business_id)) with check (public.is_admin(business_id));

create or replace function public.record_client_movement(p_business_id uuid,p_client_id uuid,p_kind public.ledger_kind,p_amount numeric,p_description text)
returns uuid language plpgsql security definer set search_path=public as $$
declare movement_id uuid;
begin
  if not public.is_member(p_business_id) then raise exception 'access denied'; end if;
  if p_amount <= 0 then raise exception 'invalid amount'; end if;
  if not exists(select 1 from clients where id=p_client_id and business_id=p_business_id) then raise exception 'invalid client'; end if;
  insert into client_ledger(business_id,client_id,kind,amount,description,created_by) values(p_business_id,p_client_id,p_kind,p_amount,p_description,auth.uid()) returning id into movement_id;
  update clients set balance=balance+case when p_kind='credit' then p_amount else -p_amount end,updated_at=now() where id=p_client_id and business_id=p_business_id;
  return movement_id;
end $$;

create or replace function public.register_sale(p_business_id uuid,p_client_id uuid,p_payment_method text,p_items jsonb,p_notes text default null,p_client_sale_id text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare s_id uuid; item jsonb; p products%rowtype; total_value numeric(14,2):=0; qty numeric(14,3); unit_value numeric(14,2); member memberships%rowtype; number_value text; customer_name text;
begin
  select * into member from memberships where business_id=p_business_id and user_id=auth.uid() and active;
  if not found then raise exception 'access denied'; end if;
  if p_client_sale_id is null or length(trim(p_client_sale_id))<8 then raise exception 'invalid client sale id'; end if;
  select id into s_id from sales where business_id=p_business_id and client_sale_id=p_client_sale_id;
  if found then return s_id; end if;
  if jsonb_array_length(p_items)=0 then raise exception 'empty sale'; end if;
  if p_client_id is not null and not exists(select 1 from clients where id=p_client_id and business_id=p_business_id) then raise exception 'invalid client'; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    qty=(item->>'quantity')::numeric; unit_value=(item->>'unit_price')::numeric;
    select * into p from products where id=(item->>'product_id')::uuid and business_id=p_business_id for update;
    if not found or p.stock<qty then raise exception 'insufficient stock for %',coalesce(p.name,'product'); end if;
    total_value=total_value+(qty*unit_value);
  end loop;
  number_value='V'||to_char(now(),'YYMMDDHH24MISSMS');
  select name into customer_name from clients where id=p_client_id and business_id=p_business_id;
  insert into sales(business_id,sale_number,client_sale_id,client_id,client_name,seller_id,seller_name,payment_method,subtotal,total,notes) values(p_business_id,number_value,p_client_sale_id,p_client_id,coalesce(customer_name,'Consumidor final'),auth.uid(),member.display_name,p_payment_method,total_value,total_value,p_notes) returning id into s_id;
  for item in select * from jsonb_array_elements(p_items) loop
    qty=(item->>'quantity')::numeric; unit_value=(item->>'unit_price')::numeric;
    select * into p from products where id=(item->>'product_id')::uuid and business_id=p_business_id for update;
    update products set stock=stock-qty,updated_at=now() where id=p.id;
    insert into sale_items(business_id,sale_id,product_id,product_name,quantity,unit_price,total) values(p_business_id,s_id,p.id,p.name,qty,unit_value,qty*unit_value);
  end loop;
  if p_client_id is not null then
    update clients set purchases=purchases+1,total_purchased=total_purchased+total_value,updated_at=now() where id=p_client_id and business_id=p_business_id;
    if p_payment_method='Cuenta cliente' then perform record_client_movement(p_business_id,p_client_id,'debit',total_value,'Venta '||number_value); end if;
  end if;
  update memberships set sales_count=sales_count+1,sales_total=sales_total+total_value,average_ticket=(sales_total+total_value)/(sales_count+1) where business_id=p_business_id and user_id=auth.uid();
  if p_payment_method<>'Cuenta cliente' then insert into cash_movements(business_id,kind,description,amount,employee_id,employee_name,sale_id) values(p_business_id,'in','Venta '||number_value||' — '||p_payment_method,total_value,auth.uid(),member.display_name,s_id); end if;
  return s_id;
end $$;

revoke all on function public.record_client_movement(uuid,uuid,public.ledger_kind,numeric,text) from public;
grant execute on function public.record_client_movement(uuid,uuid,public.ledger_kind,numeric,text) to authenticated;
revoke all on function public.register_sale(uuid,uuid,text,jsonb,text,text) from public;
grant execute on function public.register_sale(uuid,uuid,text,jsonb,text,text) to authenticated;

grant usage on schema public to authenticated;
grant select on public.businesses,public.memberships,public.products,public.clients,public.client_ledger,public.sales,public.sale_items,public.cash_movements,public.business_settings to authenticated;
grant insert on public.clients,public.cash_movements to authenticated;
grant insert,update,delete on public.products,public.memberships,public.business_settings to authenticated;
grant update on public.businesses,public.clients to authenticated;
