# Güvenli Okul Proje Planı

## 1. Proje Tanımı

Güvenli Okul, KKTC genelindeki okullarda görülen güvenlik sorunlarının anonim şekilde bildirilmesini ve Polis Genel Müdürlüğü bünyesinde merkezi olarak takip edilmesini sağlayacak web tabanlı bir sistemdir.

Sistem iki ana yüzeyden oluşur:

- Herkese açık anonim bildirim sayfası
- PGM yetkilileri için yönetim ve analiz paneli

## 2. Temel Kararlar

| Başlık | Karar |
|---|---|
| Proje adı | Güvenli Okul |
| Kurumsal yapı | KKTC Polis Genel Müdürlüğü bünyesinde |
| Bildirim yapabilecek kişiler | Herkes |
| Kimlik zorunluluğu | Yok, anonim bildirim esas |
| Okul seçimi | Önce ilçe seçilir, okul listesi sadece seçilen ilçeye göre gelir |
| Dosya / fotoğraf | PDF, JPG, PNG desteklenir |
| Acil olay bildirimi | Alınmayacak |
| Bildirim giriş uyarısı | 5 saniyelik telefon yönlendirme ekranı olacak |
| Yönetim paneli | Olacak |
| Yönetim paneli erişimi | Halka açık derlemede demo rol kapısı (mock auth) zorunlu |
| Harita motoru | Leaflet + OpenStreetMap |
| Isı haritası | Leaflet.heat ile kategori, olay sayısı ve tarih aralığına göre olacak |
| Okul harita pinleri | Bildirim olmasa bile Excel koordinat listesine göre Leaflet varsayılan pinleriyle gösterilecek |

## 3. Halka Açık Sayfa

Halka açık sayfada kullanıcıya kısa ve güven veren bir açıklama sunulur. Dil sade olmalıdır. Kullanıcıdan zorunlu kimlik bilgisi istenmemelidir.

Sayfada bulunması gereken bölümler:

- Güvenli Okul nedir?
- Hangi durumlar bildirilebilir?
- Anonimlik ve gizlilik açıklaması
- Acil durumların bu sistemden alınmadığını belirten telefon yönlendirmesi
- Bildirim formuna geçiş

## 4. Bildirim Sayfası Giriş Uyarısı

Bildirim sayfasına girildiğinde form hemen kullanıma açılmamalıdır. Önce 5 saniyelik zorunlu bir uyarı ekranı gösterilmelidir.

Uyarı, uygulama açılışında otomatik başlamamalı; kullanıcı Bildirim Yap görünümünü aktif ettiğinde modal olarak açılmalıdır.

Uyarı aktifken form etkileşimi kapalı kalmalı, sayaç tamamlandıktan sonra kullanıcı devam düğmesine basana kadar form kullanılmamalıdır.

Uyarı amacı:

- Sistemin acil olay bildirimi almadığını açıkça anlatmak
- Devam eden tehlike durumlarında 155 ve 112 telefon hatlarına yönlendirmek
- Sayım tamamlandıktan sonra formu kullanıma açmak

Önerilen uyarı metni:

> Acil durum bildirimi bu sistemden alınmaz. Devam eden kavga, yaralanma, silah, yangın, ciddi tehdit veya anlık tehlike varsa lütfen bu formu kullanmayın. Bu durumlar derhal 155 Polis İmdat veya 112 Acil Çağrı Merkezi telefon hattına bildirilmelidir.

## 5. Anonim Bildirim Formu

İlk sürüm form alanları:

| Alan | Zorunlu mu? | Açıklama |
|---|---:|---|
| İlçe | Evet | Okul listesini filtrelemek için |
| Okul | Evet | Yalnızca seçilen ilçeye bağlı okullar listelenir |
| Bildirim kategorisi | Evet | Risk türünü belirler |
| Kısa başlık | Evet | Bildirimin hızlı anlaşılması için |
| Açıklama | Evet | Olayın detayları |
| Olay tarihi / yaklaşık saat | Hayır | Kullanıcı bilmiyorsa boş bırakabilir |
| Fotoğraf / dosya | Hayır | PDF, JPG, PNG |
| İletişim bilgisi | Hayır | Tamamen isteğe bağlı |

Olay tarihi alanı opsiyoneldir. Kullanıcı bu alanı boş bıraksa da form, diğer zorunlu alanlar tamamlandığında gönderilebilir.

Formda acil durum veya aciliyet seçimi bulunmamalıdır. Bu sistem yalnızca acil olmayan okul güvenliği bildirimleri için kullanılmalıdır.

### Okul Listesi İş Kuralı

- İlçe seçilmeden okul listesi açılmamalıdır.
- İlçe seçildiğinde sadece o ilçeye bağlı okullar gösterilmelidir.
- Kullanıcı okul adını serbest yazmamalıdır.
- Okul listesi merkezi okul verisinden beslenmelidir.

## 6. Bildirim Kategorileri

İlk kategori seti:

- Trafik güvenliği
- Okul servisi / taşımacılık
- Kavga / şiddet / zorbalık
- Uyuşturucu veya zararlı madde şüphesi
- Şüpheli kişi / araç
- Okul çevresi güvenliği
- Kamera / aydınlatma / giriş-çıkış eksikliği
- Siber zorbalık / sosyal medya tehdidi
- Diğer

Not: Bu kategoriler acil olay alma amacı taşımaz. Devam eden tehlike içeren olaylar 155 veya 112 telefon hattına yönlendirilmelidir.

## 7. PGM Yönetim Paneli

Yönetim paneli anonim yüzeyden ayrılmalıdır. Halka açık derlemede panel yalnızca demo amaçlı görünür olabilir; erişim rol doğrulaması (operatör/süpervizör) arkasında olmalıdır.

Bu demoda kullanılan giriş mekanizması mock authentication seviyesindedir. Gerçek idari veya hassas veri akışı, sunucu taraflı kimlik doğrulama ve rol bazlı yetkilendirme eklenmeden panelle entegre edilmemelidir.

Panelde bulunması gereken temel alanlar:

- Genel durum özet kartları
- Gelen bildirim listesi
- Demo/gerçek bildirim verisine bağlı çalışan filtreler
- Bildirim detay ekranı
- Fotoğraf / dosya görüntüleme
- Durum değiştirme
- Yetkili notu ekleme
- İlçe, okul, kategori, durum ve tarih filtreleri
- Filtreye göre güncellenen Leaflet tabanlı KKTC okul haritası
- Filtreye göre güncellenen ısı haritası modu
- Rapor ekranı

### Bildirim Durumları

- Yeni
- İnceleniyor
- Aktarıldı
- Sonuçlandı
- Arşivlendi
- Asılsız

## 8. Harita ve Isı Haritası

PGM panelinde Leaflet + OpenStreetMap tabanlı KKTC haritası kullanılmalıdır. Okullar harita üzerinde Leaflet varsayılan pinleriyle gösterilmelidir. Isı haritası için Leaflet.heat eklentisi kullanılacaktır.

Mevcut demo aşamasında harita motoru gerçek Leaflet haritasıdır. Okul koordinatları `KKTC_Okullar_Tam_Koordinatlari(1).xlsx` dosyasındaki 60 okulluk doğrulanmış enlem-boylam listesinden alınmıştır. Okullar sabit kurum verisi; bildirimler ve ısı haritası ayrı olay verisidir. Hiç bildirim yokken veya ısı haritası verisi oluşmamışken de tüm okul pinleri haritada görünür kalmalıdır.

Isı haritası şu verilere göre üretilebilir:

- Okul bazlı olay sayısı
- İlçe bazlı olay sayısı
- Kategori yoğunluğu
- Tarih aralığı
- Tekrarlayan benzer bildirimler

İlk panel geliştirmesinde toplam bildirim, yeni bildirim, incelenen bildirim, en yoğun ilçe ve en yoğun kategori kartları eklenmiştir. Demo bildirim listesi artık filtrelere bağlı çalışır; listedeki okul adına tıklanınca harita ilgili okul konumuna yakınlaşır.

İkinci panel geliştirmesinde ana tablo okul + kategori bazlı bildirim grubu olarak çalışır. Grup satırında toplam bildirim sayısı ve renkli durum dağılımı bagetleri görünür. Bagetlerin üzerinde beklenince "3 yeni", "2 inceleniyor", "8 Aktarıldı", "1 sonuçlandı" veya "1 asılsız" gibi kısa açıklama balonları gösterilir. Ana gruba tıklanınca o gruba bağlı tekil bildirimler detay panelinde listelenir.

Harita yöneticinin şu sorulara hızlı cevap almasını sağlamalıdır:

- Hangi okul çevresinde daha fazla bildirim var?
- Hangi ilçede hangi kategori yoğunlaşıyor?
- Aynı okuldan tekrar eden riskler var mı?
- Hangi konular belirli dönemlerde artış gösteriyor?

## 9. Gizlilik ve Kötüye Kullanım Önlemleri

Sistem halka açık tarafta ad-soyad ve iletişim bilgisini zorunlu istemez. Bu nedenle kullanıcı açısından kimliksiz bildirim esastır. Bununla birlikte bilgi kirliliğini ve kötüye kullanımı azaltmak için sınırlı teknik güvenlik kaydı tutulabilir.

PGM panelindeki geçici demo kartında normal web sayfasının alabileceği bilgiler gösterilir:

| Teknik bilgi | Kullanım amacı |
|---|---|
| IP adresi | Tekrarlı sahte bildirim ve spam analizi |
| Cihaz türü | Mobil/masaüstü kullanım ayrımı |
| Tarayıcı | Teknik uyumluluk ve güvenlik incelemesi |
| İşletim sistemi | Teknik güvenlik izi |
| Dil ve saat dilimi | Tutarlılık kontrolü |
| Ekran boyutu | Cihaz sınıflandırması |
| Gönderim zamanı | Olay ve gönderim yoğunluğu analizi |
| Tarayıcı konumu | Kullanıcının açık izniyle enlem, boylam ve doğruluk bilgisi |

Normal web sayfası IMEI, cihaz seri numarası ve MAC adresi alamaz. Bu bilgiler tarayıcı ve işletim sistemi güvenlik modeli nedeniyle web sitelerine açılmaz. Gerçek konum bilgisi ise ancak kullanıcının açık tarayıcı izniyle alınabilir; izin verilmezse sistem kesin konum alamaz.

Önerilen önlemler:

- Çok kısa sürede tekrarlı gönderim sınırlaması
- Zararlı dosya türü engelleme
- Dosya boyutu sınırı
- Yetkisiz panel erişimini engelleme
- Yetkili işlem kayıtları
- Kişisel veri yazılmaması için kullanıcı uyarısı
- Teknik güvenlik kayıtlarına rol bazlı erişim
- Acil olayların web formuna değil telefon hatlarına yönlendirilmesi

### 9.1 Planlanan Güvenlik Geliştirmeleri (Backlog)

Bu bölüm, anonim bildirim akışını bozmadan spam ve kötüye kullanım riskini azaltmak için sonraki sürümlerde uygulanacak adımları kaydeder.

Mevcut durum:

- Public bildirim akışı login zorunlu değildir.
- anonymous_reports tablosunda insert-only RLS policy vardır.
- PGM panel kimlik doğrulaması ileride gerçek auth + rol yönetimi ile güçlendirilecektir.

Hedef 1: Rol yüzeyini daraltma

- RLS insert policy rolü, kullanım senaryosuna göre yalnızca anon olacak şekilde daraltılabilir.
- authenticated rolü, yalnızca gerçekten ihtiyaç varsa geri açılmalıdır.

Hedef 2: Sunucu tarafı anti-spam katmanı

- Tarayıcıdan tabloya doğrudan yazım yerine Edge Function veya backend endpoint üzerinden yazım modeli uygulanır.
- Sunucu tarafında doğrulama yapılmadan veritabanına insert atılmaz.
- Kritik doğrulamalar: zorunlu alan bütünlüğü, metin uzunluğu, link sayısı, dosya türü ve dosya boyutu.

Hedef 3: Rate limit ve tekrar kontrolü

- IP başına hız limiti: 10 dakikada en fazla 5 gönderim.
- Cihaz izi (fingerprint) başına hız limiti: 10 dakikada en fazla 3 gönderim.
- İçerik benzerliği kontrolü: aynı okul + başlık + açıklama kombinasyonu 15 dakika içinde tekrar gönderilemez.
- Limit aşımında istemciye 429 yanıtı döndürülür ve kullanıcıya kısa bilgilendirme mesajı gösterilir.

Hedef 4: Bot azaltma

- Honeypot alanı ve minimum form doldurma süresi kontrolü eklenir.
- Gerekirse captcha aşaması koşullu olarak açılır (ör. art arda başarısız deneme sonrası).

Hedef 5: İzleme ve operasyon

- Güvenlik olayları için ayrı log alanı tutulur (rate limit, duplicate, invalid payload).
- Haftalık kontrol metriği: engellenen istek sayısı, false positive oranı, başarılı bildirim oranı.

Uygulama sırası (önerilen):

1. Hızlı kazanç: honeypot + minimum süre + duplicate kontrolü
2. Edge Function veya backend endpoint ile zorunlu sunucu katmanı
3. IP ve fingerprint rate limit politikalarının aktif edilmesi
4. Captcha ve operasyon metriklerinin devreye alınması

## 10. İlk Teknik Yaklaşım

İlk demo statik HTML olarak hazırlanmıştır. Sonraki üretim sürümünde önerilen yapı:

- Frontend: React veya Next.js
- Veritabanı: Supabase PostgreSQL
- Dosya depolama: Supabase Storage
- Kimlik doğrulama: PGM yetkili kullanıcıları için rol bazlı giriş
- Halka açık build koruması: Operatör modülleri yetki olmadan başlatılmamalı, admin veri yolları public katmanda taşınmamalı
- Harita: Leaflet + OpenStreetMap, KKTC okul koordinatları ile okul noktaları
- Isı haritası: Leaflet.heat ile olay yoğunluğu katmanı
- Raporlama: İlçe, okul, kategori ve tarih bazlı analizler
