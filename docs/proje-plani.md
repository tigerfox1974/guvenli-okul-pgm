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
| Okul seçimi | Mevcut okul listesinden seçim |
| Dosya / fotoğraf | PDF, JPG, PNG desteklenir |
| Yönetim paneli | Olacak |
| Harita | PGM panelinde KKTC haritası olacak |
| Isı haritası | Kategori, olay sayısı, aciliyet ve tarih aralığına göre olacak |

## 3. Halka Açık Sayfa

Halka açık sayfada kullanıcıya kısa ve güven veren bir açıklama sunulur. Dil sade olmalıdır. Kullanıcıdan zorunlu kimlik bilgisi istenmemelidir.

Sayfada bulunması gereken bölümler:

- Güvenli Okul nedir?
- Hangi durumlar bildirilebilir?
- Anonimlik ve gizlilik açıklaması
- Acil durum uyarısı
- Bildirim formuna geçiş

## 4. Anonim Bildirim Formu

İlk sürüm form alanları:

| Alan | Zorunlu mu? | Açıklama |
|---|---:|---|
| İlçe | Evet | Okul listesini filtrelemek için |
| Okul | Evet | Mevcut okul listesinden seçilir |
| Bildirim kategorisi | Evet | Risk türünü belirler |
| Kısa başlık | Evet | Bildirimin hızlı anlaşılması için |
| Açıklama | Evet | Olayın detayları |
| Olay tarihi / yaklaşık saat | Hayır | Kullanıcı bilmiyorsa boş bırakabilir |
| Fotoğraf / dosya | Hayır | PDF, JPG, PNG |
| Aciliyet beyanı | Evet | Kullanıcının durum algısı |
| İletişim bilgisi | Hayır | Tamamen isteğe bağlı |

## 5. Bildirim Kategorileri

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

## 6. Aciliyet Modeli

Aciliyet tek başına bildirimi yapan kişinin beyanına bırakılmamalıdır. Sistem üç aşamalı çalışmalıdır.

| Aşama | Kim / Ne Belirler? | Açıklama |
|---|---|---|
| 1 | Bildirimi yapan kişi | Acil olduğunu düşünüp düşünmediğini işaretler |
| 2 | Sistem | Kategori, anahtar risk ifadeleri, tekrar sayısı ve olay yoğunluğuna göre öncelik üretir |
| 3 | PGM yetkilisi | Resmi işlem önceliğini onaylar veya değiştirir |

### Aciliyet Seviyeleri

| Seviye | Anlamı | Örnek |
|---|---|---|
| Kritik | Hemen değerlendirme gerektirir | Silah, bıçak, devam eden kavga, ciddi tehdit, okul çevresinde aktif tehlike |
| Yüksek | Kısa sürede kontrol gerektirir | Uyuşturucu şüphesi, sürekli şüpheli kişi/araç, servis güvenliği riski |
| Orta | İnceleme ve planlama gerektirir | Kamera eksikliği, aydınlatma sorunu, giriş-çıkış düzensizliği |
| Düşük | Takip ve kayıt amaçlıdır | Tekrar etmeyen genel çevre şikayeti |

### Acil Durum Uyarısı

Kullanıcıya şu uyarı açıkça gösterilmelidir:

> Devam eden kavga, yaralanma, silah, yangın, ciddi tehdit veya anlık tehlike varsa bu form yerine derhal 155 / 112 aranmalıdır.

## 7. PGM Yönetim Paneli

Panelde bulunması gereken temel alanlar:

- Gelen bildirim listesi
- Bildirim detay ekranı
- Fotoğraf / dosya görüntüleme
- Durum değiştirme
- Yetkili notu ekleme
- İlçe, okul, kategori, aciliyet ve tarih filtreleri
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
- Aciliyet seviyesi
- Tarih aralığı
- Tekrarlayan benzer bildirimler

Harita yöneticinin şu sorulara hızlı cevap almasını sağlamalıdır:

- Hangi okul çevresinde daha fazla bildirim var?
- Hangi ilçede hangi kategori yoğunlaşıyor?
- Acil bildirimler hangi bölgelerde toplanıyor?
- Aynı okuldan tekrar eden riskler var mı?

## 9. Gizlilik ve Kötüye Kullanım Önlemleri

Anonimlik korunmalıdır. Bununla birlikte sistem kötüye kullanıma karşı sessiz güvenlik önlemleri içermelidir.

Önerilen önlemler:

- Çok kısa sürede tekrarlı gönderim sınırlaması
- Zararlı dosya türü engelleme
- Dosya boyutu sınırı
- Yetkisiz panel erişimini engelleme
- Yetkili işlem kayıtları
- Kişisel veri yazılmaması için kullanıcı uyarısı

## 10. İlk Teknik Yaklaşım

İlk demo statik HTML olarak hazırlanmıştır. Sonraki üretim sürümünde önerilen yapı:

- Frontend: React veya Next.js
- Veritabanı: Supabase PostgreSQL
- Dosya depolama: Supabase Storage
- Kimlik doğrulama: PGM yetkili kullanıcıları için rol bazlı giriş
- Harita: KKTC okul koordinatları ile harita katmanı
- Raporlama: İlçe, okul, kategori, aciliyet ve tarih bazlı analizler
