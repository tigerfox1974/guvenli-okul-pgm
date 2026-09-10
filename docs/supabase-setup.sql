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

create table if not exists public.security_events (
  id bigserial primary key,
  event_type text not null,
  reason text null,
  route text not null default '/api/report',
  user_agent text null,
  ip_hash text null,
  fingerprint_hash text null,
  report_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_created_at on public.security_events (created_at desc);
create index if not exists idx_security_events_event_type on public.security_events (event_type);
create index if not exists idx_security_events_reason on public.security_events (reason);

alter table public.security_events enable row level security;
revoke all on table public.security_events from public, anon, authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'security_events'
  loop
    execute format('drop policy if exists %I on public.security_events;', policy_record.policyname);
  end loop;
end
$$;

create policy "security_events_no_client_access"
  on public.security_events
  for all
  to anon, authenticated
  using (false)
  with check (false);

alter table public.anonymous_reports enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.anonymous_reports to anon, authenticated;

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

create policy "anon_insert_anonymous_reports"
  on public.anonymous_reports
  for insert
  to anon, authenticated
  with check (
    source = 'web-anon-report'
    and status = 'Yeni'
  );

-- Optional: If later you want authenticated dashboard reads from Supabase,
-- define read policies for authenticated roles here.
