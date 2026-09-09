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

drop policy if exists "public_insert_anonymous_reports" on public.anonymous_reports;

create policy "public_insert_anonymous_reports"
  on public.anonymous_reports
  for insert
  to anon
  with check (true);

-- Optional: If later you want authenticated dashboard reads from Supabase,
-- define read policies for authenticated roles here.
