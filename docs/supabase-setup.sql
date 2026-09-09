-- Run this script in Supabase SQL Editor.
-- It creates the table for anonymous reports and enables insert access with RLS.

create extension if not exists pgcrypto;

create table if not exists public.anonymous_reports (
  id text primary key,
  district text not null,
  region text not null,
  school_id integer not null,
  school_name text not null,
  category text not null,
  title text not null,
  description text not null,
  event_date timestamptz null,
  attachments jsonb not null default '[]'::jsonb,
  contact_name text null,
  contact_phone text null,
  contact_email text null,
  status text not null default 'Yeni',
  source text not null default 'web-anon-report',
  client_snapshot jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_anonymous_reports_created_at on public.anonymous_reports (created_at desc);
create index if not exists idx_anonymous_reports_district on public.anonymous_reports (district);
create index if not exists idx_anonymous_reports_category on public.anonymous_reports (category);

alter table public.anonymous_reports enable row level security;

grant usage on schema public to anon, authenticated;
grant insert, update on table public.anonymous_reports to anon, authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'anonymous_reports'
  loop
    execute format('drop policy if exists %I on public.anonymous_reports;', policy_record.policyname);
  end loop;
end
$$;

create policy "public_insert_anonymous_reports_anon"
  on public.anonymous_reports
  for insert
  to anon
  with check (true);

create policy "public_insert_anonymous_reports_authenticated"
  on public.anonymous_reports
  for insert
  to authenticated
  with check (true);

create policy "public_update_anonymous_reports_anon"
  on public.anonymous_reports
  for update
  to anon
  using (true)
  with check (true);

create policy "public_update_anonymous_reports_authenticated"
  on public.anonymous_reports
  for update
  to authenticated
  using (true)
  with check (true);

-- Optional: If later you want authenticated dashboard reads from Supabase,
-- define read policies for authenticated roles here.
