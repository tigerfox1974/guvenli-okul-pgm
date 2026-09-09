# Güvenli Okul PGM

KKTC genelindeki okullarda güvenlik sorunlarının anonim olarak bildirilmesi, PGM panelinde harita, ısı haritası ve kategori bazlı analizlerle takip edilmesi için geliştirilen Güvenli Okul web projesi.

## Amaç

Güvenli Okul, öğrenciler, veliler, öğretmenler, okul personeli ve okul çevresindeki vatandaşların güvenlik risklerini kolay, sade ve anonim şekilde bildirebilmesini sağlar. Proje, Polis Genel Müdürlüğü bünyesinde gelen bildirimlerin merkezi olarak takip edilmesi, sınıflandırılması ve harita üzerinden analiz edilmesi amacıyla tasarlanmıştır.

## İlk Demo Kapsamı

- Halka açık tanıtım sayfası
- Anonim güvenlik bildirimi formu
- Bildirim sayfasına girişte 5 saniyelik acil durum telefon yönlendirme uyarısı
- İlçe seçimine göre filtrelenen gerçek okul listesi
- Fotoğraf veya dosya ekleme alanı
- PGM yönetim paneli tasarımı
- KKTC haritası üzerinde okul noktaları
- Kategori ve olay sayısına göre ısı haritası görünümü
- Bildirim durumu takibi
- Kurumsal raporlama temeli

## Okul Seçimi

Kullanıcı önce ilçeyi seçer. Okul alanında yalnızca seçilen ilçeye bağlı okullar listelenir. İlçe seçilmeden tüm okullar gösterilmez.

## Acil Durum Politikası

Bu sistem acil olay bildirimi almak için kullanılmaz. Devam eden kavga, yaralanma, silah, yangın, ciddi tehdit veya anlık tehlike gibi durumlar web formu üzerinden alınmamalıdır.

Bildirim sayfasına girildiğinde kullanıcıya 5 saniyelik zorunlu uyarı gösterilir. Sayım tamamlandıktan sonra yalnızca acil olmayan okul güvenliği bildirimi yapılmasına izin verilir.

Acil durumlar derhal 155 Polis İmdat veya 112 Acil Çağrı Merkezi telefon hattına bildirilmelidir.

## Çalıştırma

Bu ilk sürüm bağımsız statik demo olarak hazırlanmıştır. `index.html` dosyası tarayıcıda açılarak incelenebilir.

Supabase entegrasyonu test edilirken `file://` yerine yerel HTTP sunucu ile açmanız önerilir.

Örnek (Python yüklüyse):

1. Terminalde proje klasörüne gidin.
2. `python -m http.server 5500` komutunu çalıştırın.
3. Tarayıcıdan `http://localhost:5500` adresine gidin.

## Supabase ile Kalıcı Kayıt

Anonim bildirim formu artık local kayıt yanında Supabase'e de yazacak altyapıya sahiptir.

### 1. Supabase Projesi Aç

1. [https://supabase.com](https://supabase.com) adresine gir.
2. Yeni bir proje oluştur.
3. Proje kurulduktan sonra sol menüden SQL Editor'u aç.

### 2. Veritabanı Altyapısını Kur

1. Projedeki [docs/supabase-setup.sql](docs/supabase-setup.sql) dosyasını aç.
2. Tüm SQL içeriğini kopyala.
3. Supabase SQL Editor'a yapıştır.
4. Run ile çalıştır.

Bu script şunları yapar:
- `public.anonymous_reports` tablosunu oluşturur.
- Gerekli indexleri ekler.
- RLS'i (Row Level Security) aktif eder.
- Anonim kullanıcı (`anon`) için sadece insert policy tanımlar.

### 3. Proje İçine Supabase Anahtarlarını Gir

1. Bu dosyayı aç: [js/config/supabase.config.js](js/config/supabase.config.js)
2. `url` ve `anonKey` alanlarını doldur.

Örnek:

```js
export const SUPABASE_CONFIG = Object.freeze({
	url: 'https://YOUR_PROJECT_REF.supabase.co',
	anonKey: 'YOUR_SUPABASE_ANON_KEY',
	schema: 'public',
	reportsTable: 'anonymous_reports',
	requestTimeoutMs: 10000
});
```

Anahtarları Supabase panelinden bulma yolu:
1. Project Settings -> API
2. `Project URL` değerini `url` alanına kopyala.
3. `anon public` key değerini `anonKey` alanına kopyala.

Güvenlik notu:
- `service_role` key bu projede tarayıcı tarafına konulmamalıdır.
- Sadece `anon public` key kullan.

### 4. Çalıştığını Doğrula

1. Tarayıcıda sayfayı yenile.
2. Anonim bildirim formundan yeni kayıt gönder.
3. Supabase Table Editor -> `anonymous_reports` tablosunu aç.
4. Yeni satırın geldiğini doğrula.

### 5. Bağlantı Kesilirse Ne Olur?

Bağlantı problemi olursa form kaydı yine localStorage'a yazılır ve Supabase gönderimi kuyruklanır. Bağlantı geri geldiğinde (veya sayfa yeniden açıldığında) kuyruktaki kayıtlar otomatik tekrar gönderilir.
