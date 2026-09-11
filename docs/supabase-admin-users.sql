-- Admin panel login users (username + role)
-- Password is NOT stored here.
-- Password remains in Supabase Auth users.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  auth_email text not null unique,
  role text not null check (role in ('operator', 'supervisor')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_users_active_username
  on public.admin_users (is_active, username);

create or replace function public.touch_admin_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_touch_admin_users_updated_at on public.admin_users;
create trigger trg_touch_admin_users_updated_at
before update on public.admin_users
for each row execute procedure public.touch_admin_users_updated_at();

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_no_client_access" on public.admin_users;
create policy "admin_users_no_client_access"
  on public.admin_users
  for all
  to anon, authenticated
  using (false)
  with check (false);

insert into public.admin_users (username, auth_email, role, is_active)
values
  ('operator', 'operator@okul.gov.ct.tr', 'operator', true),
  ('supervisor', 'supervisor@okul.gov.ct.tr', 'supervisor', true),
  ('operator1', 'operator1@okul.gov.ct.tr', 'operator', true),
  ('operator2', 'operator2@okul.gov.ct.tr', 'operator', true),
  ('supervisor1', 'supervisor1@okul.gov.ct.tr', 'supervisor', true),
  ('supervisor2', 'supervisor2@okul.gov.ct.tr', 'supervisor', true),
  ('bolgeoperator', 'bolgeoperator@okul.gov.ct.tr', 'operator', true),
  ('nobetsupervisor', 'nobetsupervisor@okul.gov.ct.tr', 'supervisor', true)
on conflict (username) do update
set
  auth_email = excluded.auth_email,
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());
