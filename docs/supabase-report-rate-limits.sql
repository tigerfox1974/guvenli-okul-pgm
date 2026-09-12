-- Durable rate limit store for /api/report.
-- Run this in Supabase SQL Editor before deploying the API change.

create table if not exists public.report_rate_limits (
  bucket_key text primary key,
  scope text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_report_rate_limits_scope on public.report_rate_limits (scope);
create index if not exists idx_report_rate_limits_expires_at on public.report_rate_limits (expires_at);

alter table public.report_rate_limits enable row level security;
revoke all on table public.report_rate_limits from public, anon, authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'report_rate_limits'
  loop
    execute format('drop policy if exists %I on public.report_rate_limits;', policy_record.policyname);
  end loop;
end
$$;

create policy "report_rate_limits_no_client_access"
  on public.report_rate_limits
  for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function public.consume_report_rate_limit(
  p_bucket_key text,
  p_scope text,
  p_window_seconds integer,
  p_max_count integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  request_count integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_seconds integer := greatest(coalesce(p_window_seconds, 0), 1);
  v_max_count integer := greatest(coalesce(p_max_count, 0), 1);
  v_bucket_key text := nullif(trim(p_bucket_key), '');
  v_scope text := nullif(trim(p_scope), '');
  v_window_start timestamptz;
  v_reset_at timestamptz;
  v_request_count integer;
begin
  if v_bucket_key is null or v_scope is null then
    raise exception 'bucket_key_and_scope_required';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / v_window_seconds) * v_window_seconds
  );
  v_reset_at := v_window_start + make_interval(secs => v_window_seconds);

  insert into public.report_rate_limits (
    bucket_key,
    scope,
    window_start,
    request_count,
    expires_at,
    updated_at
  )
  values (
    v_bucket_key,
    v_scope,
    v_window_start,
    1,
    v_reset_at,
    v_now
  )
  on conflict (bucket_key) do update
    set scope = excluded.scope,
        window_start = case
          when public.report_rate_limits.window_start < excluded.window_start
            then excluded.window_start
          else public.report_rate_limits.window_start
        end,
        request_count = case
          when public.report_rate_limits.window_start < excluded.window_start
            then 1
          else public.report_rate_limits.request_count + 1
        end,
        expires_at = case
          when public.report_rate_limits.window_start < excluded.window_start
            then excluded.expires_at
          else public.report_rate_limits.expires_at
        end,
        updated_at = excluded.updated_at
  returning public.report_rate_limits.request_count,
            public.report_rate_limits.expires_at
    into v_request_count,
         v_reset_at;

  allowed := v_request_count <= v_max_count;
  retry_after_seconds := case
    when allowed then 0
    else greatest(1, ceil(extract(epoch from (v_reset_at - v_now)))::integer)
  end;
  request_count := v_request_count;
  reset_at := v_reset_at;
  return next;
end;
$$;

revoke all on function public.consume_report_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_report_rate_limit(text, text, integer, integer) to service_role;

-- Optional cleanup for old windows. Run occasionally if the table grows.
delete from public.report_rate_limits
where expires_at < now() - interval '1 day';
