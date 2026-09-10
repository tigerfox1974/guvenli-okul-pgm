-- Package C migration for existing installations.
-- Run this in Supabase SQL Editor after Package B deployment.

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

-- Optional hardening: keep only expected event types.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'security_events_event_type_chk'
      and conrelid = 'public.security_events'::regclass
  ) then
    alter table public.security_events
      add constraint security_events_event_type_chk
      check (event_type in ('rate_limit_block', 'duplicate_block', 'invalid_payload', 'submit_error'));
  end if;
end
$$;

-- Weekly metrics query (last 7 days).
select
  event_type,
  reason,
  count(*) as event_count
from public.security_events
where created_at >= now() - interval '7 days'
group by event_type, reason
order by event_count desc;

-- Weekly accepted report count (last 7 days).
select
  count(*) as accepted_reports_7d
from public.anonymous_reports
where created_at >= now() - interval '7 days';
