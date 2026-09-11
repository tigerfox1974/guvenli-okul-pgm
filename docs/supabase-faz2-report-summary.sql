-- Faz 2: get_report_summary RPC
-- Run this script in Supabase SQL Editor after docs/supabase-setup.sql (veya mevcut kurulumda bir kez).
-- Amac: panel ozetini tek cagrida, sunucu tarafinda hesaplamak (5000 satirlik chunk taramasini ortadan kaldirir).
--
-- On kosul: public.anonymous_reports uzerinde status index'i bulunmalidir.
--   create index if not exists idx_anonymous_reports_status on public.anonymous_reports (status);
--
-- Filtre semantigi api/_shared/admin-common.js ile birebir hizalidir:
--   date whitelist: all | 7 | 30 | year
--   year: gte startOfYear + lt startOfNextYear (UTC)
--   topDistrict: district bossa/bosluk ise region fallback (summary.js:107 ile birebir: trim + fallback)
--   topCategory: btrim(category) (summary.js:108 ile birebir: trim)
--   NOT: RPC tam sayim yapar; 'truncated' alani dondurmez (summary.js'teki 5000 satir kirpma limiti yok).
--        Frontend normalizeSummaryData Boolean(undefined) => false ile ayni davranisi korur.

create or replace function public.get_report_summary(
  p_district text default null,
  p_school   text default null,
  p_category text default null,
  p_status   text default null,
  p_date     text default 'all'
) returns jsonb
language sql
stable
as $$
  with filtered as (
    select district, region, category, status
    from public.anonymous_reports
    where (p_district is null or district = p_district)
      and (p_school   is null or school_id = p_school::int)
      and (p_category is null or category = p_category)
      and (p_status   is null or status = p_status)
      and (
        p_date = 'all'
        or (
          p_date = 'year'
          and created_at >= date_trunc('year', now() at time zone 'utc') at time zone 'utc'
          and created_at <  (date_trunc('year', now() at time zone 'utc') at time zone 'utc') + interval '1 year'
        )
        or (
          p_date in ('7', '30')
          and created_at >= now() - (p_date::int * interval '1 day')
        )
      )
  )
  select jsonb_build_object(
    'totalReports',    (select count(*) from filtered),
    'newReports',      (select count(*) from filtered where status = 'Yeni'),
    'reviewedReports', (select count(*) from filtered where status <> 'Yeni'),
    'topDistrict',     coalesce((
                         select coalesce(nullif(btrim(district), ''), btrim(region))
                         from filtered
                         where coalesce(nullif(btrim(district), ''), btrim(region)) <> ''
                         group by 1
                         order by count(*) desc
                         limit 1
                       ), ''),
    'topCategory',     coalesce((
                         select btrim(category)
                         from filtered
                         where btrim(category) <> ''
                         group by 1
                         order by count(*) desc
                         limit 1
                       ), '')
  );
$$;

-- Dogrulama (opsiyonel):
-- select public.get_report_summary(null, null, null, null, 'all');
-- select public.get_report_summary(null, null, null, null, 'year');