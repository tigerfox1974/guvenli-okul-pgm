-- Demo kayıtları silmek için:
-- delete from public.anonymous_reports where source = 'demo-seed';

-- =============================================================================
-- Kontrollü demo ihbar kayıtları (test & panel doğrulaması)
-- Tüm ilçeler, tüm okullar ve tüm kategoriler için temsili kayıt üretir.
--   source = 'demo-seed'   (gerçek ihbarlardan ayrıştırma)
--   status = 'Yeni'
--   title  = '[DEMO] ...' öneki
-- Idempotent: on conflict (id) do update → aynı script tekrar çalıştırılabilir,
-- çift kayıt oluşturmaz.
--
-- Ön koşul: docs/supabase-setup.sql çalıştırılmış olmalı (public.anonymous_reports).
-- =============================================================================

with schools(school_id, school_name, district) as (
  values
    (1, '19 Mayıs TMK', 'Girne'),
    (2, '20 Temmuz Fen Lisesi', 'Lefkoşa'),
    (3, 'Anadolu Güzel Sanatlar Lisesi', 'Lefkoşa'),
    (4, 'Anafartalar Lisesi', 'Girne'),
    (5, 'Atatürk Meslek Lisesi', 'Lefkoşa'),
    (6, 'Atleks Sanverler Ortaokulu', 'Lefkoşa'),
    (7, 'Bayraktar Ortaokulu', 'Lefkoşa'),
    (8, 'Bekirpaşa Lisesi', 'İskele'),
    (9, 'Bülent Ecevit Anadolu Lisesi', 'Lefkoşa'),
    (10, 'Çanakkale Ortaokulu', 'Gazimağusa'),
    (11, 'Canbulat Özgürlük Ortaokulu', 'Gazimağusa'),
    (12, 'Cengiz Topel Endüstri Meslek Lisesi', 'Lefke'),
    (13, 'Cumhuriyet Lisesi', 'Gazimağusa'),
    (14, 'Değirmenlik Lisesi', 'Lefkoşa'),
    (15, 'Demokrasi Ortaokulu', 'Lefkoşa'),
    (16, 'Dipkarpaz Recep Tayyip Erdoğan Ortaokulu', 'İskele'),
    (17, 'Doğu Akdeniz Doğa Koleji', 'Gazimağusa'),
    (18, 'Dr. Fazıl Küçük Endüstri Meslek Lisesi', 'Gazimağusa'),
    (19, 'Dr. Suat Günsel Koleji', 'Girne'),
    (20, 'Erenköy Lisesi', 'İskele'),
    (21, 'Esentepe Ortaokulu', 'Girne'),
    (22, 'Esin Leman Lisesi', 'Lefkoşa'),
    (23, 'Gazimağusa Meslek Lisesi', 'Gazimağusa'),
    (24, 'Gazimağusa Ticaret Lisesi', 'Gazimağusa'),
    (25, 'Gazimağusa Türk Maarif Koleji', 'Gazimağusa'),
    (26, 'Girne Amerikan Koleji', 'Girne'),
    (27, 'Girne Doğa College', 'Girne'),
    (28, 'Girne Turizm Meslek Lisesi', 'Girne'),
    (29, 'Güzelyurt Meslek Lisesi', 'Güzelyurt'),
    (30, 'Güzelyurt Türk Maarif Koleji', 'Güzelyurt'),
    (31, 'Hala Sultan İlahiyat Koleji', 'Lefkoşa'),
    (32, 'Haydarpaşa Ticaret Lisesi', 'Lefkoşa'),
    (33, 'İrsen Küçük Ortaokulu', 'Lefkoşa'),
    (34, 'İskele Evkaf Türk Maarif Koleji', 'İskele'),
    (35, 'İskele Ticaret Lisesi', 'İskele'),
    (36, 'Karpaz Meslek Lisesi', 'İskele'),
    (37, 'Kurtuluş Lisesi', 'Güzelyurt'),
    (38, 'Lapta Yavuzlar Lisesi', 'Girne'),
    (39, 'Lefke Gazi Lisesi', 'Lefke'),
    (40, 'Lefkoşa Türk Lisesi', 'Lefkoşa'),
    (41, 'Levent Koleji', 'Lefkoşa'),
    (42, 'Meral Vedat Ertüngü', 'Lefkoşa'),
    (43, 'Muharrem Döveç Ortaokulu', 'İskele'),
    (44, 'Namık Kemal Lisesi', 'Gazimağusa'),
    (45, 'Necat British College(Girne)', 'Girne'),
    (46, 'Necat British College(Lefkoşa)', 'Lefkoşa'),
    (47, 'Oğuz Veli Ortaokulu', 'Girne'),
    (48, 'Osman Nejat Konuk Ortaokulu', 'Girne'),
    (49, 'Osman Örek Meslek Lisesi', 'Lefkoşa'),
    (50, 'Polatpaşa Lisesi', 'Gazimağusa'),
    (51, 'Rauf Raif Denktaş Meslek Lisesi', 'Lefkoşa'),
    (52, 'Sedat Simavi Endüstri Meslek Lisesi', 'Lefkoşa'),
    (53, 'Şht. Hüseyin Ruso Ortaokulu', 'Lefkoşa'),
    (54, 'Şht. Turgut Ortaokulu', 'Güzelyurt'),
    (55, 'Şht. Zeka Çorba Ortaokulu', 'Gazimağusa'),
    (56, 'TED Koleji', 'Lefkoşa'),
    (57, 'The English School of Kyrenia', 'Girne'),
    (58, 'Türk Maarif Koleji', 'Lefkoşa'),
    (59, 'Yakın Doğu Koleji Yeniboğaziçi', 'Gazimağusa'),
    (60, 'Yakın Doğu Koleji', 'Lefkoşa')
  ),
categories(category_index, category) as (
  values
    (1, 'Trafik güvenliği'),
    (2, 'Okul servisi / taşımacılık'),
    (3, 'Kavga / şiddet / zorbalık'),
    (4, 'Uyuşturucu veya zararlı madde şüphesi'),
    (5, 'Şüpheli kişi / araç'),
    (6, 'Okul çevresi güvenliği'),
    (7, 'Kamera / aydınlatma / giriş-çıkış eksikliği'),
    (8, 'Siber zorbalık / sosyal medya tehdidi'),
    (9, 'Diğer')
)
insert into public.anonymous_reports (
  id,
  district,
  region,
  school_id,
  school_name,
  category,
  title,
  description,
  event_date,
  attachments,
  status,
  source,
  client_snapshot
)
select
  'demo-' || s.school_id || '-' || c.category_index,
  s.district,
  s.district,
  s.school_id,
  s.school_name,
  c.category,
  '[DEMO] ' || c.category || ' bildirimi',
  case c.category_index
    when 1 then 'Okul giriş-çıkış saatlerinde araç yoğunluğu ve yaya önceliği ihlalleri gözlemlendi (temsili demo veri).'
    when 2 then 'Servis araçlarının okul önü iniş-biniş sırasında oluşturduğu yoğunluk (temsili demo veri).'
    when 3 then 'Öğrenciler arasında sözlü tartışma ve itişme olduğuna dair gözlem (temsili demo veri).'
    when 4 then 'Okul çevresinde zararlı madde bulunduğuna dair gözlem (temsili demo veri).'
    when 5 then 'Okul çevresinde uzun süre bekleyen şüpheli bir araca ilişkin gözlem (temsili demo veri).'
    when 6 then 'Okul çevresinin genel güvenliğine ilişkin durum değerlendirmesi (temsili demo veri).'
    when 7 then 'Kamera kör noktası ve giriş-çıkış kontrolü eksikliği (temsili demo veri).'
    when 8 then 'Öğrencileri hedef alan sosyal medya paylaşımına ilişkin bildirim (temsili demo veri).'
    else 'Diğer kategorisine giren genel okul güvenliği gözlemi (temsili demo veri).'
  end,
  now(),
  '[]'::jsonb,
  'Yeni',
  'demo-seed',
  jsonb_build_object('is_demo', true)
from schools s
cross join categories c
on conflict (id) do update set
  district = excluded.district,
  region = excluded.region,
  school_id = excluded.school_id,
  school_name = excluded.school_name,
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  event_date = excluded.event_date,
  status = excluded.status,
  source = excluded.source,
  client_snapshot = excluded.client_snapshot,
  updated_at = now();
