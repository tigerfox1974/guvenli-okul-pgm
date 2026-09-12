# Faz 2 Guvenlik Uygulama Plani

## 1. Faz 2 Amaci

Bu fazin amaci, QR ile hizli erisimi koruyarak anonim Ihbar akisinda spam, bot ve kotuye kullanim riskini azaltmaktir.

## 2. Kapsam

Bu fazda odak sadece public Ihbar akisidir.

- Dahil: Ihbar formu gonderim guvenligi
- Haric: PGM panelinin tam kimlik sistemi (ayri faz)

## 3. Baslangic Durumu

Tamamlananlar:

1. QR ile Ihbar ekranina dogrudan acilis aktif.
2. Supabase RLS asiri izinli policy uyarilari temizlendi.
3. Canli dogrulama testleri basariyla tamamlandi.

## 3.1 Uygulama Durumu

Durum ozeti:

1. Paket A tamamlandi.
2. Paket B uygulandi (sunucu endpoint + server-side kontrol).
3. Paket C uygulandi (guvenlik olay kaydi + haftalik metrik sorgulari).

Paket A'da devreye alinan kontroller:

1. Honeypot alan kontrolu
2. Minimum doldurma suresi kontrolu
3. 15 dakikalik tekrar icerik (dedupe) kontrolu
4. Metin uzunlugu ve link yogunlugu kontrolu

Paket B'de devreye alinan kontroller:

1. Tarayicidan dogrudan tablo yazimi yerine `/api/report` sunucu endpoint modeli
2. Sunucu tarafinda payload dogrulamasi
3. Supabase tabanli merkezi IP ve fingerprint hiz limiti (10 dk penceresi)
4. Sunucu tarafinda duplicate icerik kontrolu (15 dk penceresi)
5. Service role anahtari sadece sunucu ortaminda kullanilacak sekilde ayrim

Paket C'de devreye alinan kontroller:

1. `security_events` tablosuna rate limit, duplicate ve invalid payload olay kaydi
2. Submit hatalari icin `submit_error` olay tipi kaydi
3. Son 7 gun icin guvenlik olay metrik sorgulari
4. Son 7 gun accepted report metrik sorgusu

## 4. Faz 2 Is Paketleri

### Paket A - Hizli Koruma Katmani (Kisa Surede)

Hedef: Sunucu tarafi tam katmana gecmeden once temel spam azaltma.

1. Honeypot alani
- Forma gizli bir alan eklenir.
- Bu alan dolu gelirse kayit reddedilir.

2. Minimum doldurma suresi kontrolu
- Form acilis zamani kaydedilir.
- Ornek esik: 4-5 saniyeden kisa gonderimler supheli kabul edilir.

3. Basit tekrar icerik engeli
- Ayni okul + baslik + aciklama 15 dakika icinde tekrar gelirse engellenir.

4. Icerik sinirlari
- Maksimum metin uzunlugu, link sayisi ve temel karakter kontrolleri uygulanir.

### Paket B - Sunucu Tarafi Dogrulama Katmani (Ana Hedef)

Hedef: Tarayicidan dogrudan tabloya yazimi kaldirip denetimli endpoint modeline gecmek.

1. Supabase Edge Function veya backend endpoint
- Istemci once bu endpoint'e gider.
- Tum guvenlik kontrolleri sunucuda calisir.

2. Rate limit politikasi
- IP: 10 dakikada en fazla 5 istek
- Fingerprint: 10 dakikada en fazla 3 istek
- Limit asiminda 429 donulur.
- Limit kararinin Vercel fonksiyon belleginde degil, Supabase uzerindeki atomik sayaç fonksiyonunda tutulmasi gerekir.
- Gerekli Supabase kurulumu: `docs/supabase-report-rate-limits.sql`

3. Sunucu tarafi dedupe
- Icerik ozetine gore tekrar kayit engellenir.

4. Guvenli insert modeli
- Sunucu dogrulama gecen payload'i tabloya insert eder.

### Paket C - Gozlemleme ve Operasyon

Hedef: Guvenlik kararlarinin olculebilir hale gelmesi.

1. Guvenlik olay kaydi
- rate_limit_block
- duplicate_block
- invalid_payload

2. Haftalik metrikler
- Engellenen istek sayisi
- Basarili bildirim sayisi
- False positive oran tahmini

3. Acil durum proseduru
- Ani spam artisi halinde gecici siki mod (daha dusuk limit + captcha)

## 5. Uygulama Sirasi

1. Paket A
2. Paket B
3. Paket C

## 6. Kabul Kriterleri

Faz 2 tamamlandi sayilmasi icin:

1. Bot benzeri hizli gonderimler tespit edilip engellenmeli.
2. Tekrarlayan ayni icerikler kontrol altina alinmali.
3. Limit asimi cevaplari istemciye net ve kullanici dostu mesaja donusmeli.
4. Guvenlik olaylari raporlanabilir olmali.
5. Normal kullanici akisinda belirgin kullanim zorlugu olusmamali.

## 7. Riskler ve Onlemler

1. Risk: Asiri kati limit nedeniyle masum kullanici engellenmesi
- Onlem: Once yumusak esikler, olcum sonrasi kademeli sikilastirma

2. Risk: Sadece istemci tarafinda kalan kontrollerin atlatilmasi
- Onlem: Paket B ile sunucu tarafina tasima zorunlu

3. Risk: Operasyonel izleme yoklugu
- Onlem: Paket C metrik ve olay kaydinin zorunlu devreye alinmasi

## 8. Faz 2 Cikis Raporu Icin Gerekli Kanitlar

1. Test senaryolari ve sonuc listesi
2. Rate limit blok ornek kayitlari
3. Dedupe engel ornekleri
4. Canli ortamda en az 7 gunluk metrik ozeti

## 9. Bir Sonraki Aksiyon

Paket C dagitimi sonrasi `docs/supabase-package-c-security-events.sql` scripti Supabase'te calistirilir ve canli ortamda olay kaydi dogrulanir.

Kalici hiz limiti icin `docs/supabase-report-rate-limits.sql` scripti Supabase SQL Editor'de calistirilir. Bu script:

1. `report_rate_limits` merkezi sayaç tablosunu olusturur.
2. `consume_report_rate_limit` atomik karar fonksiyonunu olusturur.
3. Public, anon ve authenticated rollerinin tabloya dogrudan erisimini kapatir.
4. API'nin service role anahtariyla RPC uzerinden hiz limiti karari almasini saglar.

## 10. Faz 2 Kapanis Raporu

Durum: TAMAMLANDI

Kapanis tarihi:

1. 2026-09-10

Kabul kriteri kanitlari:

1. `invalid_payload` olayi dogrulandi (`required_fields_missing`).
2. `duplicate_block` olayi dogrulandi (`duplicate_submission`).
3. `rate_limit_block` olayi dogrulandi (`rate_limit_fingerprint`, `rate_limit_ip`).
4. Basarili ihbar kaydi dogrulandi (`accepted_reports_7d = 8`).

Metrik ozeti (dogrulama anindaki sonuclar):

1. `rate_limit_block` + `rate_limit_ip`: 12
2. `rate_limit_block` + `rate_limit_fingerprint`: 4
3. `duplicate_block` + `duplicate_submission`: 4
4. `invalid_payload` + `required_fields_missing`: 1

Genel sonuc:

1. Paket A, Paket B ve Paket C beklenen guvenlik davranisini canli ortamda vermistir.
2. Faz 2 teslimati kapanis kriterlerini saglayarak tamamlanmistir.

## 11. Ek Sertlestirme - Kalici Hiz Limiti

Durum: UYGULANDI

Eski davranis:

1. IP ve fingerprint hiz limiti Vercel fonksiyon bellegindeki gecici `Map` kayitlariyla tutuluyordu.
2. Farkli Vercel fonksiyon instance'lari ayni bellegi paylasmadigi icin limit tutarliligi garanti degildi.

Yeni davranis:

1. `/api/report` hiz limiti kararini Supabase RPC uzerinden alir.
2. IP ve fingerprint icin ayri bucket anahtarlari kullanilir.
3. Limit penceresi ve `Retry-After` degeri Supabase'deki ayni merkezi kayittan hesaplanir.
4. Limit asimi olaylari eskisi gibi `security_events` tablosuna yazilmaya devam eder.

Kurulum notu:

1. Bu degisikligin canli ortamda calismasi icin `docs/supabase-report-rate-limits.sql` scripti Supabase SQL Editor'de bir kez calistirilmelidir.
2. API varsayilan RPC adi olarak `consume_report_rate_limit` kullanir.
3. Gerekirse RPC adi `SUPABASE_RATE_LIMIT_RPC` ortam degiskeniyle degistirilebilir.
