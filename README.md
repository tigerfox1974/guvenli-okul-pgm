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

## Supabase ile Kalıcı Kayıt (Sıfırdan Kurulum Rehberi)

Anonim bildirim formu, yerel kayıt yanında Supabase veritabanına da yazacak şekilde hazırdır.
Bu rehber, daha önce hiç Supabase kullanmamış bir kullanıcıya göre yazılmıştır.

### Aşama 0: Kuruluma Başlamadan Önce

1. Supabase hesabınız olmalı.
2. Bu proje klasörü bilgisayarınızda açık olmalı.
3. İnternet bağlantınız açık olmalı.
4. Terminal ve tarayıcıyı birlikte kullanacaksınız.

### Aşama 1: Supabase Projesi Oluştur

1. Tarayıcıdan [https://supabase.com](https://supabase.com) adresine girin.
2. Sign in ile hesabınıza giriş yapın.
3. Dashboard ekranında New project butonuna tıklayın.
4. Organization olarak kişisel hesabınızı seçin.
5. Name alanına proje adı yazın. Ornek: guvenli-okul-pgm
6. Database Password alanına güçlü bir şifre yazın ve bu şifreyi bir yere not edin.
7. Region alanında size yakın bir bölge seçin. Ornek: Frankfurt (Europe West).
8. Create new project butonuna tıklayın.
9. Proje hazırlanırken 1-3 dakika bekleyin.

Kontrol noktası:
1. Sol menüde Table Editor ve SQL Editor görünüyorsa proje hazırdır.

### Aşama 2: Veritabanı Tablosunu ve Politikaları Kur

1. VS Code'da [docs/supabase-setup.sql](docs/supabase-setup.sql) dosyasını açın.
2. Dosyadaki tüm metni seçip kopyalayın.
3. Supabase'e dönün, sol menüden SQL Editor ekranını açın.
4. New query butonuna tıklayın.
5. Kopyaladığınız SQL metnini sorgu alanına yapıştırın.
6. Run butonuna tıklayın.

Kontrol noktası:
1. Ekranda hata yerine başarı mesajı görünmeli.
2. Sol menüden Table Editor ekranına gidin.
3. public şeması altında anonymous_reports tablosu görünmeli.

Not:
1. Bu script tabloyu, indexleri ve RLS insert politikasını sizin için otomatik kurar.

### Aşama 3: Supabase API Bilgilerini Al

1. Supabase sol menüden Project Settings ekranına girin.
2. API sekmesine tıklayın.
3. Project URL değerini kopyalayın.
4. Public anahtarınızı kopyalayın.
5. Anahtar değeri iki formatta olabilir:
6. sb_publishable_... formatı yeni anahtardır.
7. eyJ... formatı legacy anon anahtardır.
8. İkisi de bu istemci kullanımında çalışır.

Eger API sekmesi acilmiyorsa:
1. General settings ekranindaki Project ID satirinda bulunan Copy butonuna basin.
2. Kopyalanan degeri bir not defterine yapistirip kontrol edin.
3. Tarayicida su adresi acin ve PROJECT_ID yerine kendi kopyaladiginiz degeri yazin:
4. https://supabase.com/dashboard/project/PROJECT_ID/settings/api
5. Hala acilmiyorsa once su adrese gidin:
6. https://supabase.com/dashboard/project/PROJECT_ID
7. Proje acildiktan sonra sol menuden Settings icindeki API veya Data API ekranina gecin.

Eger Data API ekranina ulasip key goremiyorsaniz:
1. Tarayicida su adrese gidin (PROJECT_ID degerini degistirin):
2. https://supabase.com/dashboard/project/PROJECT_ID?showConnect=true
3. Acilan Connect penceresinde JavaScript veya plain API secin.
4. Burada URL ve Publishable key birlikte gorunur.
5. Publishable key degerini kopyalayin.

Güvenlik kuralı:
1. service_role anahtarını tarayıcı tarafındaki bu projeye koymayın.
2. Sadece public/publishable veya legacy anon anahtarı kullanın.

### Aşama 4: Projede Supabase Ayarını Doldur

1. VS Code'da [js/config/supabase.config.js](js/config/supabase.config.js) dosyasını açın.
2. url alanındaki boş metni Project URL ile değiştirin.
3. anonKey alanındaki boş metni public/publishable anahtar ile değiştirin.
4. schema değeri public olarak kalsın.
5. reportsTable değeri anonymous_reports olarak kalsın.

Not:
1. Data API ekraninda gordugunuz URL /rest/v1/ ile bitiyorsa da bu projede kullanabilirsiniz.
2. Sistem otomatik olarak uygun taban URL formatina normalize eder.

Ornek görünüm:

export const SUPABASE_CONFIG = Object.freeze({
  url: 'https://SIZIN-PROJE-REF.supabase.co',
  anonKey: 'SIZIN_ANON_PUBLIC_ANAHTARINIZ',
  schema: 'public',
  reportsTable: 'anonymous_reports',
  requestTimeoutMs: 10000
});

Kontrol noktası:
1. url https ile başlamalı.
2. anonKey boş olmamalı.

### Aşama 4.1: Paket B Sunucu Ayarı (Vercel)

Faz 2 Paket B ile birlikte bildirimler tarayıcıdan dogrudan tabloya degil, Vercel uzerindeki `/api/report` endpoint'ine gider.

Bu nedenle Vercel Project Settings > Environment Variables ekraninda su degerler tanimli olmalidir:

1. SUPABASE_URL = https://SIZIN-PROJE-REF.supabase.co
2. SUPABASE_SERVICE_ROLE_KEY = SIZIN_SERVICE_ROLE_ANAHTARINIZ
3. SUPABASE_SCHEMA = public
4. SUPABASE_REPORTS_TABLE = anonymous_reports
5. REPORT_SECURITY_SALT = rastgele_uzun_bir_metin
6. SUPABASE_SECURITY_EVENTS_TABLE = security_events (opsiyonel, varsayilan tablo adi)

Guvenlik kurali:

1. SUPABASE_SERVICE_ROLE_KEY degerini istemci koduna koymayin.
2. Bu anahtar sadece Vercel sunucu ortam degiskeninde bulunmalidir.

### Aşama 4.2: Paket C Guvenlik Olay Tablosu

Paket C ile birlikte rate limit, duplicate ve invalid payload gibi guvenlik olaylari ayri bir tabloda saklanir.

Mevcut Supabase projesinde bir kez su scripti calistirin:

1. [docs/supabase-package-c-security-events.sql](docs/supabase-package-c-security-events.sql)

Kontrol noktasi:

1. Table Editor icinde public.security_events tablosu gorunmeli.
2. Ilk rate limit veya duplicate testinden sonra tabloda olay kaydi olusmali.

### Aşama 5: Uygulamayı Doğru Şekilde Aç

Supabase testinde file ile açmak yerine yerel sunucu kullanın.

Yontem A (Python varsa):
1. VS Code terminalini açın.
2. Proje klasöründe olduğunuzu kontrol edin.
3. Şu komutu çalıştırın: python -m http.server 5500
4. Tarayıcıda şu adrese gidin: http://localhost:5500

Yontem B (Python yoksa, Node varsa):
1. VS Code terminalini açın.
2. Şu komutu çalıştırın: npx serve . -l 5500
3. Tarayıcıda şu adrese gidin: http://localhost:5500

Kontrol noktası:
1. Site localhost adresinde açılmalı.
2. Terminal açık kalmalı.

### Aşama 6: Test Bildirimi Gönder

1. Sitede Bildirim Yap ekranına geçin.
2. Zorunlu alanları doldurun:
3. İlçe
4. Okul
5. Bildirim kategorisi
6. Sorunun kısa başlığı
7. Açıklama
8. Bildirimi Gönder butonuna basın.

Kontrol noktası:
1. Ekranda bildirimin alındığına dair onay modalı görünmeli.

### Aşama 7: Kaydın Supabase'e Yazıldığını Doğrula

1. Supabase paneline geri dönün.
2. Table Editor ekranına girin.
3. anonymous_reports tablosunu açın.
4. En yeni satırda biraz önce gönderdiğiniz başlık, kategori ve okul bilgisi görünmeli.

### Aşama 8: Çalışmazsa Hızlı Sorun Giderme

1. url ve anonKey yanlış veya eksik olabilir.
2. SQL scripti çalışmamış olabilir.
3. Uygulamayı file yerine localhost ile açmamış olabilirsiniz.
4. Yanlış anahtar kullanılmış olabilir. service_role yerine anon public anahtar olmalı.
5. Tarayıcı konsolunda hata olabilir. F12 ile Console sekmesini açıp hata mesajını kontrol edin.

Eger su hatayi gorurseniz:
1. Supabase request failed (401)
2. new row violates row-level security policy for table anonymous_reports

Su adimlari uygulayin:
1. Supabase SQL Editor acin.
2. [docs/supabase-rls-fix.sql](docs/supabase-rls-fix.sql) dosyasinin guncel halini tekrar calistirin.
3. Table Editor ekraninda anonymous_reports tablosunu acin.
4. Tablo icinde RLS acik kalacak; yalnizca insert-only policy kalacak ve asiri genis update policy bulunmayacak.
5. Uygulamada yeni bir test bildirimi daha gonderin.
6. Hala devam ederse uygulamadaki URL ile Supabase Data API URL alaninin birebir ayni oldugunu dogrulayin.

### Aşama 9: Bağlantı Kesilirse Ne Olur?

1. İnternet kesilirse bildirim yine yerel kayda yazılır.
2. Supabase'e gönderim otomatik kuyruklanır.
3. Bağlantı geri geldiğinde veya sayfa yeniden açıldığında sistem kuyruktaki kayıtları tekrar göndermeyi dener.

### Vercel Deploy Sonrasi Onemli Not (Cache)

Eger local ortamda kayıt dusuyor ama Vercel ortaminda dusmuyorsa, nedeni eski JS dosyalarinin tarayici cache'inden calismasi olabilir.

Kontrol adimlari:
1. Siteyi su sekilde acin: https://guvenli-okul-pgm.vercel.app/?cb=1
2. Formdan yeni test bildirimi gonderin.
3. Supabase Tablo Editor'de anonymous_reports tablosunu yenileyin.

Notlar:
1. Bu projede JS modullerine surum parametresi eklendi (ornek: app.js?v=20260910-1).
2. Vercel icin must-revalidate cache header ayari [vercel.json](vercel.json) dosyasinda tanimlandi.
