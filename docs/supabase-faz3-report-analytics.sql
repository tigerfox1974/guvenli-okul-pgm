-- Faz 3: get_report_summary RPC genisletmesi (panel analytics / aggregates)
-- Run this script in Supabase SQL Editor after docs/supabase-faz2-report-summary.sql (mevcut kurulumda bir kez).
--
-- Amac: panel analizlerini (ozet kartlari, bolgesel risk ozeti, kategori/ilce dagilimlari, harita pin/heatmap
--       ve gruplanmis tablo) sayfali `items` listesi yerine, TUM filtrelenmis kayit kumesini temsil eden
--       sunucu tarafi aggregate veriden uretmek. Boylece 100+ kayitta panel ilk sayfa ile sinirli kalmaz.
--
-- Onemli:
--   * Fonksiyon imzasi ve return tipi Faz 2 ile aynidir; `create or replace` mevcut fonksiyonu genisletir.
--   * Faz 2 cikti alanlari (totalReports, newReports, reviewedReports, topDistrict, topCategory) AYNEN korunur.
--   * Yeni alan: analytics { totalRecords, cells[] }
--   * API (api/_shared/admin-common.js) `analytics` alanini goremezse eski davranisa geri duser
--     (geriye donuk uyumluluk). Bu nedenle bu script calistirilmadan da panel calismaya devam eder.
--
-- Filtre semantigi api/_shared/admin-common.js ile birebir hizalidir (Faz 2 ile ayni):
--   date whitelist: all | 7 | 30 | year
--   year: gte startOfYear + lt startOfNextYear (UTC)
--   district/school/category/status: null ise filtre uygulanmaz
--   analytics.cells district degeri: district bos ise region fallback
--     (mapSupabaseRowToReport -> `district: row.district || row.region` ile birebir)
--   analytics.cells status degeri: bos ise 'Yeni'
--     (mapSupabaseRowToReport -> `status: row.status || 'Yeni'` ile birebir)
--
-- analytics.cells granularitesi: (district, school_id, school_name, category, status) -> count
--   Panel bu hucrelerden; ilce x risk basligi matrisini, okul bazli harita yogunlugunu,
--   okul+kategori gruplarini (status bagetleri dahil) ve filtre secenek sayacilarini uretir.
--   Hucre sayisi kayit sayisiyla degil, okul x kategori x durum kombinasyonuyla sinirlidir.

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
    select
      case
        when district is null or district = '' then coalesce(region, '')
        else district
      end as district_key,
      school_id,
      coalesce(school_name, '') as school_name_key,
      coalesce(category, '') as category_key,
      case
        when status is null or status = '' then 'Yeni'
        else status
      end as status_key,
      district,
      region
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
  ),
  cells as (
    select
      district_key,
      school_id,
      school_name_key,
      category_key,
      status_key,
      count(*)::int as record_count
    from filtered
    group by district_key, school_id, school_name_key, category_key, status_key
  )
  select jsonb_build_object(
    'totalReports',    (select count(*) from filtered),
    'newReports',      (select count(*) from filtered where status_key = 'Yeni'),
    'reviewedReports', (select count(*) from filtered where status_key <> 'Yeni'),
    'topDistrict',     coalesce((
                         select coalesce(nullif(btrim(district), ''), btrim(region))
                         from filtered
                         where coalesce(nullif(btrim(district), ''), btrim(region)) <> ''
                         group by 1
                         order by count(*) desc
                         limit 1
                       ), ''),
    'topCategory',     coalesce((
                         select btrim(category_key)
                         from filtered
                         where btrim(category_key) <> ''
                         group by 1
                         order by count(*) desc
                         limit 1
                       ), ''),
    'analytics',       jsonb_build_object(
      'totalRecords', (select count(*) from filtered),
      'cells',        coalesce((
                        select jsonb_agg(
                          jsonb_build_object(
                            'district',   district_key,
                            'schoolId',   school_id,
                            'schoolName', school_name_key,
                            'category',   category_key,
                            'status',     status_key,
                            'count',      record_count
                          )
                          order by district_key, school_id, category_key, status_key
                        )
                        from cells
                      ), '[]'::jsonb)
    )
  );
$$;

-- Opsiyonel performans onerisi (buyuk veri setinde GROUP BY maliyetini dusurur, mevcut filtreleri bozmaz):
-- create index if not exists idx_anonymous_reports_school_category on public.anonymous_reports (school_id, category);

-- Dogrulama (opsiyonel):
-- select public.get_report_summary(null, null, null, null, 'all');
-- select public.get_report_summary(null, null, null, null, 'year');
-- select public.get_report_summary('Lefkosa', null, null, null, '30');
-- Beklenen: Faz 2 alanlari ayni kalir + analytics.totalRecords = totalReports ve analytics.cells dolu doner.
