# Panel Supabase Canli Veri Entegrasyon Plani

Tarih: 2026-09-11
Durum: Onay Bekliyor

## 1) Neden Gerekli?

Mevcut panel listesi localStorage kaynagindan geliyor. Bu nedenle paneldeki veri cihaza bagimli ve merkezi yonetim icin yetersiz.

Sonuc: PGM panelinin gercek operasyon icin Supabase kaynakli, sunucu tarafi korunmus veri akisina gecmesi gerekir.

## 2) Hedef Mimari (Onerilen)

- Public ihbar yazimi: mevcut akista oldugu gibi /api/report uzerinden devam eder.
- Admin panel okuma/yazma: dogrudan tarayicidan tabloya degil, yalnizca server endpoint uzerinden yapilir.
- Kimlik: Supabase Auth ile operator/supervisor girisi.
- Yetki: sunucuda JWT dogrulama + rol kontrolu.
- Kayitlar: anonymous_reports ana veri kaynagi olmaya devam eder.

## 3) Secenekler

1. Varsayilan/Hizli Yol (gecici)
- Demo giris korunur, sadece read-only endpoint eklenir.
- Artisi: hizli gecis.
- Eksisi: guvenlik ve denetim acisindan yetersiz, gercek kullanimda onerilmez.

2. Gelismis/Pro Yol (onerilen)
- Demo giris kaldirilir, Supabase Auth girisi gelir.
- Tum admin islemleri server endpoint ve rol kontrolunden gecer.
- Artisi: uretim seviyesine uygun guvenlik, izlenebilirlik, genisletilebilirlik.
- Eksisi: gelistirme suresi daha uzun.

3. Onerim
- 2. yol ile ilerleyelim.

## 4) Fazlar ve Is Kapsami

### Faz 0 - Hazirlik ve On Kosullar

Amac: mevcut ortam degiskenleri ve SQL durumunun canli panel icin hazir oldugunu dogrulamak.

Isler:
- Supabase tablolari ve policy dogrulamasi.
- Vercel env dogrulamasi.
- Operator rolleri icin Auth metadata stratejisi netlestirme.

Cikti:
- Precheck raporu (uygun/eksik listesi).

### Faz 1 - Guvenli Admin Read API

Amac: panelin tum liste/filtre verisini sunucudan almasi.

Yeni endpointler:
- GET /api/admin/reports
- GET /api/admin/summary

Kurallar:
- Authorization Bearer token zorunlu.
- Token Supabase Auth ile dogrulanir.
- Yalnizca operator/supervisor rolleri kabul edilir.
- Filtre parametreleri whitelist mantigiyla dogrulanir.
- Pagination zorunlu (ornek pageSize <= 100).

Dosyalar:
- api/admin/reports.js (yeni)
- api/admin/summary.js (yeni)
- api/_shared/admin-auth.js (yeni)
- api/_shared/supabase-admin.js (yeni)

### Faz 2 - Frontend Veri Katmani Degisimi

Amac: panelin localStorage yerine admin API kullanmasi.

Isler:
- Admin veri istemci modulu ekleme.
- ui modulunde veri cekme akisini async hale getirme.
- Yukleniyor/hata/bos durumlarini netlestirme.
- Filtre degisince sunucu sorgusunu tetikleme.

Dosyalar:
- js/modules/admin-api.js (yeni)
- js/modules/ui.js (guncelleme)

### Faz 3 - Gercek Kimlik ve Oturum Akisi

Amac: demo hesaplardan Supabase Auth girisine gecis.

Isler:
- app.js icindeki DEMO_ACCOUNTS modelini kaldirma.
- E-posta + sifre girisi ile token alma.
- Oturum yenileme/cikis davranisi.
- Role select kaldirilarak rolun token claim'inden okunmasi.

Dosyalar:
- js/app.js (guncelleme)
- index.html (admin login form guncellemesi)

### Faz 4 - Opsiyonel Ama Onerilen Islevler

Amac: paneli operasyonel hale yaklastirmak.

Isler:
- Durum degistirme endpointi (PATCH /api/admin/reports/:id/status)
- Yetkili notu endpointi (POST /api/admin/reports/:id/notes)
- SQL: report_notes ve report_status_history tablolari
- UI: durum degistirme ve not girisi bileşenleri

Dosyalar:
- api/admin/report-status.js (yeni)
- api/admin/report-notes.js (yeni)
- docs/supabase-admin-migration.sql (yeni)
- js/modules/ui.js (guncelleme)

## 5) Guvenlik Kurallari (Zorunlu)

- Service role key istemci kodunda asla kullanilmaz.
- Admin endpointleri token olmadan 401 doner.
- Rolu operator/supervisor olmayan kullaniciya 403 doner.
- CORS, cache-control ve hata mesajlari sinirli tutulur.
- Tum admin degisiklik islemleri icin audit kaydi uretilir.

## 6) Efor Tahmini

- Faz 0: 0.5 gun
- Faz 1: 1 gun
- Faz 2: 1 gun
- Faz 3: 1 gun
- Faz 4: 1 - 1.5 gun (opsiyonel)

Toplam:
- Faz 0-3: yaklasik 3.5 gun
- Faz 0-4: yaklasik 4.5 - 5 gun

## 7) Kabul Kriterleri

- Panel login sonrasi veriyi sadece Supabase kaynakli admin API'den alir.
- Filtreler sunucu tarafinda calisir ve pagination vardir.
- Yetkisiz istekler engellenir (401/403).
- Demo localStorage verisi panel kaynagi olmaktan cikar.
- Canli testte en az 20 kayitla filtre, detay, harita baglantisi dogrulanir.

## 8) Riskler ve Onlemler

- Risk: Ani geciste panel bos gorunebilir.
  - Onlem: gecis suresince fallback mesajlari + kontrollu rollout.

- Risk: Role metadata hatali olursa giris yapilamaz.
  - Onlem: Supabase Auth kullanicilari icin standart role checklist.

- Risk: Buyuk veri setinde panel yavaslayabilir.
  - Onlem: pagination, alan secimi, index kontrolu.

## 9) Uygulama Sirasina Dair Oneri

1. Faz 0
2. Faz 1
3. Faz 2
4. Faz 3
5. Faz 4 (opsiyonel, ikinci sprint)

## 10) Onay Sorusu

Onay icin secim:

1. Hizli gecis: Faz 0-2 (read-only canli veri + demo giris korunur)
2. Onerilen uretim adimi: Faz 0-3 (gercek auth dahil)
3. Tam paket: Faz 0-4 (durum/not aksiyonlari dahil)
