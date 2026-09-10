-- Quick fix for 401 RLS insert error on anonymous_reports
-- Run this in Supabase SQL Editor, then test form submission again.

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

select
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public' and tablename = 'anonymous_reports'
order by cmd, policyname;

select
  has_table_privilege('anon', 'public.anonymous_reports', 'insert') as anon_insert_grant,
  has_table_privilege('anon', 'public.anonymous_reports', 'update') as anon_update_grant,
  has_table_privilege('authenticated', 'public.anonymous_reports', 'insert') as authenticated_insert_grant,
  has_table_privilege('authenticated', 'public.anonymous_reports', 'update') as authenticated_update_grant;
