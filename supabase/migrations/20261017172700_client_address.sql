alter table public.clients add column if not exists address text not null default '';
alter table public.clients add column if not exists birthdate date;
notify pgrst, 'reload schema';
