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
| Harita | PGM panelinde KKTC haritası olacak |
| Isı haritası | Kategori, olay sayısı ve tarih aralığına göre olacak |

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

Panelde bulunması gereken temel alanlar:

- Gelen bildirim listesi
- Bildirim detay ekranı
- Fotoğraf / dosya görüntüleme
- Durum değiştirme
- Yetkili notu ekleme
- İlçe, okul, kategori ve tarih filtreleri
- KKTC haritası
- Isı haritası modu
- Rapor ekranı

### Bildirim Durumları

- Yeni
- İnceleniyor
- İlgili birime aktarıldı
- Sonuçlandı
- Arşivlendi
- Asılsız / değerlendirme dışı

## 8. Harita ve Isı Haritası

PGM panelinde KKTC haritası bulunmalıdır. Okullar harita üzerinde nokta olarak gösterilmelidir.

Isı haritası şu verilere göre üretilebilir:

- Okul bazlı olay sayısı
- İlçe bazlı olay sayısı
- Kategori yoğunluğu
- Tarih aralığı
- Tekrarlayan benzer bildirimler

Harita yöneticinin şu sorulara hızlı cevap almasını sağlamalıdır:

- Hangi okul çevresinde daha fazla bildirim var?
- Hangi ilçede hangi kategori yoğunlaşıyor?
- Aynı okuldan tekrar eden riskler var mı?
- Hangi konular belirli dönemlerde artış gösteriyor?

## 9. Gizlilik ve Kötüye Kullanım Önlemleri

Anonimlik korunmalıdır. Bununla birlikte sistem kötüye kullanıma karşı sessiz güvenlik önlemleri içermelidir.

Önerilen önlemler:

- Çok kısa sürede tekrarlı gönderim sınırlaması
- Zararlı dosya türü engelleme
- Dosya boyutu sınırı
- Yetkisiz panel erişimini engelleme
- Yetkili işlem kayıtları
- Kişisel veri yazılmaması için kullanıcı uyarısı
- Acil olayların web formuna değil telefon hatlarına yönlendirilmesi

## 10. İlk Teknik Yaklaşım

İlk demo statik HTML olarak hazırlanmıştır. Sonraki üretim sürümünde önerilen yapı:

- Frontend: React veya Next.js
- Veritabanı: Supabase PostgreSQL
- Dosya depolama: Supabase Storage
- Kimlik doğrulama: PGM yetkili kullanıcıları için rol bazlı giriş
- Harita: KKTC okul koordinatları ile harita katmanı
- Raporlama: İlçe, okul, kategori ve tarih bazlı analizler
