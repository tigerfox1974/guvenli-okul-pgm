# Copilot Görev Metni

Aşağıdaki metin VS Code Copilot Agent veya benzeri bir geliştirme aracına verilecek ilk kapsam metnidir.

```text
Bu repoda Güvenli Okul isimli KKTC Polis Genel Müdürlüğü bünyesinde kullanılacak web projesinin ilk çalışan demosunu geliştir.

Projenin amacı: KKTC genelindeki okullarda güvenlik sorunlarının herkes tarafından anonim şekilde bildirilmesini sağlamak ve PGM panelinde bu bildirimleri okul, ilçe, kategori ve tarih aralığına göre takip etmek.

Korunacak temel kararlar:
- Proje adı şimdilik Güvenli Okul olacak.
- Bildirim yapabilecek kişiler herkes olacak.
- Kimlik bilgisi zorunlu olmayacak; anonim bildirim esas olacak.
- Okul seçimi serbest yazı değil, mevcut okul listesinden yapılacak.
- Kullanıcı önce ilçeyi seçecek; okul listesinde sadece seçilen ilçenin okulları görünecek.
- İlçe seçilmeden okul listesi tüm okulları göstermeyecek.
- Dosya/fotoğraf yükleme alanı olacak. PDF, JPG ve PNG desteklenecek.
- Acil olay bildirimi bu sistemden hiçbir şekilde alınmayacak.
- Bildirim sayfasına girişte 5 saniye geri sayan zorunlu uyarı ekranı gösterilecek.
- Geri sayım bitmeden bildirim formu kullanıma açılmayacak.
- Uyarı ekranı, acil durumların 155 Polis İmdat veya 112 Acil Çağrı Merkezi telefon hattına bildirilmesi gerektiğini açıkça söyleyecek.
- Formda aciliyet beyanı, acil seçenek, öncelik seviyesi veya benzeri hiçbir alan bulunmayacak.
- PGM yönetim paneli olacak.
- PGM panelinde KKTC haritası olacak.
- Okullar harita üzerinde gösterilecek.
- Harita üzerinde kategoriye, olay sayısına ve tarih aralığına göre ısı haritası görünümü olacak.

Halka açık bölümde şunlar olsun:
- Kısa proje tanıtımı
- Anonimlik ve gizlilik açıklaması
- Acil durumların web formundan alınmadığını belirten telefon yönlendirmesi
- Bildirim formuna geçiş

Bildirim sayfası giriş uyarısı:
Bildirim sayfasına girildiğinde önce 5 saniyelik geri sayım ekranı göster. Bu ekran kapatılabilir olmamalı. Sayım bittiğinde kullanıcı bildirim formuna geçebilmelidir.

Uyarı metni:
Acil durum bildirimi bu sistemden alınmaz. Devam eden kavga, yaralanma, silah, yangın, ciddi tehdit veya anlık tehlike varsa lütfen bu formu kullanmayın. Bu durumlar derhal 155 Polis İmdat veya 112 Acil Çağrı Merkezi telefon hattına bildirilmelidir.

Bildirim formu alanları:
- İlçe
- Okul
- Bildirim kategorisi
- Sorunun kısa başlığı
- Açıklama
- Olay tarihi / yaklaşık saat
- Fotoğraf veya dosya yükleme
- İsteğe bağlı iletişim bilgisi

Okul listesi kuralı:
- İlçe seçimi zorunlu olacak.
- Okul alanı ilçe seçilene kadar pasif olacak.
- İlçe seçildiğinde sadece o ilçenin okulları listelenecek.
- Okul adları serbest yazılmayacak.

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

PGM paneli alanları:
- Gelen bildirim listesi
- Bildirim detay ekranı
- Dosya/fotoğraf görüntüleme
- Durum güncelleme
- Yetkili notu ekleme
- İlçe, okul, kategori ve tarih filtreleri
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
