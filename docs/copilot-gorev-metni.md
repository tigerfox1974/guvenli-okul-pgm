# Copilot Görev Metni

Aşağıdaki metin VS Code Copilot Agent veya benzeri bir geliştirme aracına verilecek ilk kapsam metnidir.

```text
Bu repoda Güvenli Okul isimli KKTC Polis Genel Müdürlüğü bünyesinde kullanılacak web projesinin ilk çalışan demosunu geliştir.

Projenin amacı: KKTC genelindeki okullarda güvenlik sorunlarının herkes tarafından anonim şekilde bildirilmesini sağlamak ve PGM panelinde bu bildirimleri okul, ilçe, kategori, aciliyet ve tarih aralığına göre takip etmek.

Korunacak temel kararlar:
- Proje adı şimdilik Güvenli Okul olacak.
- Bildirim yapabilecek kişiler herkes olacak.
- Kimlik bilgisi zorunlu olmayacak; anonim bildirim esas olacak.
- Okul seçimi serbest yazı değil, mevcut okul listesinden yapılacak.
- Dosya/fotoğraf yükleme alanı olacak. PDF, JPG ve PNG desteklenecek.
- PGM yönetim paneli olacak.
- PGM panelinde KKTC haritası olacak.
- Okullar harita üzerinde gösterilecek.
- Harita üzerinde kategoriye, olay sayısına, aciliyet seviyesine ve tarih aralığına göre ısı haritası görünümü olacak.

Halka açık bölümde şunlar olsun:
- Kısa proje tanıtımı
- Anonimlik ve gizlilik açıklaması
- Acil durum uyarısı
- Bildirim formuna geçiş

Bildirim formu alanları:
- İlçe
- Okul
- Bildirim kategorisi
- Sorunun kısa başlığı
- Açıklama
- Olay tarihi / yaklaşık saat
- Fotoğraf veya dosya yükleme
- Kullanıcının aciliyet beyanı
- İsteğe bağlı iletişim bilgisi

Bildirim kategorileri:
- Trafik güvenliği
- Okul servisi / taşımacılık
- Kavga / şiddet / zorbalık
- Uyuşturucu veya zararlı madde şüphesi
- Şüpheli kişi / araç
- Okul çevresi güvenliği
- Kamera / aydınlatma / giriş-çıkış eksikliği
- Siber zorbalık / sosyal medya tehdidi
- Diğer

Aciliyet modeli:
Aciliyet sadece vatandaşın beyanına göre belirlenmeyecek. Sistem üç aşamalı çalışacak:
1. Bildirimi yapan kişi acil olduğunu düşünüp düşünmediğini işaretler.
2. Sistem kategori, anahtar risk ifadeleri, tekrar sayısı ve olay yoğunluğuna göre otomatik öncelik üretir.
3. PGM yetkilisi panelde resmi işlem önceliğini onaylar veya değiştirir.

Aciliyet seviyeleri:
- Kritik
- Yüksek
- Orta
- Düşük

Acil uyarı metni:
Devam eden kavga, yaralanma, silah, yangın, ciddi tehdit veya anlık tehlike varsa bu form yerine derhal 155 / 112 aranmalıdır.

PGM paneli alanları:
- Gelen bildirim listesi
- Bildirim detay ekranı
- Dosya/fotoğraf görüntüleme
- Durum güncelleme
- Yetkili notu ekleme
- İlçe, okul, kategori, aciliyet ve tarih filtreleri
- KKTC haritası
- Isı haritası modu
- Raporlama özetleri

Bildirim durumları:
- Yeni
- İnceleniyor
- İlgili birime aktarıldı
- Sonuçlandı
- Arşivlendi
- Asılsız / değerlendirme dışı

Tasarım dili:
Kurumsal, sade, mobil uyumlu, temiz ve güven veren bir arayüz oluştur. İlk ekran gerçek kullanılabilir ürünü göstersin. Gereksiz pazarlama dili kullanma. PGM panelini demo içinde görünür yap.

Mevcut çalışan bölümleri bozma. Değişiklikleri kontrollü ve minimum müdahale ile yap. Önce mevcut index.html demosunu geliştirilebilir bir frontend yapısına taşı. Gerekiyorsa Vite + React kullanılabilir. Harita için ilk aşamada temsili KKTC harita görünümü yeterlidir; üretim aşamasında gerçek okul koordinatları ve harita kütüphanesi eklenebilir.
```
