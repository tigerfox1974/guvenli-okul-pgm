# Panel UI Analiz Raporu

Tarih: 2026-09-11
Kapsam: PGM panelinin mevcut durum analizi, UI odaklı boşluklar, öncelikli düzenleme planı

## 1) Analiz Kapsamı

İncelenen kaynaklar:
- index.html
- css/main.css
- js/app.js
- js/modules/ui.js
- js/modules/map.js
- docs/proje-plani.md
- docs/copilot-gorev-metni.md

Canlı doğrulama:
- Sayfa file protokolü üzerinden açılıp panel akışı test edildi.
- Demo operatör girişi ile dashboard görünümü doğrulandı.

## 2) Kısa Sonuç

Panel fonksiyonel olarak açılıyor; ancak görsel sistem, bilgi hiyerarşisi ve etkileşim netliği açısından hedeflenen kurumsal seviyenin gerisinde. Ayrıca panelde UI çalışmasını da etkileyen kritik bir harita başlatma hatası bulundu. UI düzenlemesine başlamadan önce bu teknik kilidin çözülmesi önerilir.

## 3) Öncelikli Bulgular

### Kritik

1. Harita başlatma çakışması
- Belirti: "Map container is already initialized" hatası görüldü.
- Kök neden: Farklı modül URL kalıpları nedeniyle aynı harita modülü iki kez yükleniyor.
- Kanıt:
  - js/app.js içinde query ile import: ./modules/map.js?v=20260910-1
  - js/modules/ui.js içinde querysiz import: ./map.js
  - map başlatma: js/modules/map.js içinde L.map('map')
- Etki: Panelde harita davranışı kararsız hale gelebilir; UI testlerinin güvenilirliği düşer.

### Yüksek

2. Panel görsel tasarım katmanı eksik
- HTML tarafında çok sayıda panel sınıfı var (admin-summary, map-toolbar, detail-panel vb.) ancak CSS tarafında bunların çoğu için özel kural yok.
- Sonuç: Yerleşim temel olarak tarayıcı varsayılanına yakın görünüyor; kart hiyerarşisi ve okunabilirlik zayıf.

3. Gereksinim-seti ile panel yetenekleri arasında boşluk
- Plan dokümanında beklenen alanlar: dosya/fotoğraf görüntüleme, durum güncelleme, yetkili notu.
- Mevcut panelde filtre + özet + tablo + detay var; bu üç işlem için etkileşim bileşeni görünmüyor.

### Orta

4. Durum dağılımı sunumu metinsel
- Beklenti: renkli durum bagetleri ve kısa tooltipler.
- Mevcut: "Yeni: x | İnceleniyor: y" formatında düz metin.
- Sonuç: Hızlı karar verme için taranabilirlik düşük.

5. Erişilebilirlikte odak görünürlüğü yetersiz
- CSS içinde genel buton/input/select/textarea odak stili bulunmuyor.
- Sonuç: Klavye ile kullanım ve görünür odak takibi zayıf.

6. Inline style kullanımı ve stil dağınıklığı
- Birkaç kritik noktada inline style var; temalaştırma ve bakım zorlaşıyor.

## 4) Gereksinim Uyum Özeti

- Uyumlu olanlar:
  - Rol kapısı ile panel erişim ayrımı
  - İlçe/okul/kategori/durum/tarih filtreleri
  - Özet kartlar
  - Harita + ısı haritası kontrolleri
  - Grup detay paneli

- Eksik veya kısmi olanlar:
  - Durum bageti + tooltip UX
  - Dosya/fotoğraf görüntüleme (panel tarafı)
  - Durum güncelleme akışı
  - Yetkili notu ekleme akışı
  - Raporlama ekranının belirgin UI yüzeyi

## 5) Önerilen UI Revizyon Planı (Onay Sonrası Uygulanacak)

### Faz 0 - Stabilizasyon (Ön şart)
- Harita modül import yolunu tekilleştir.
- Navigasyon event sahipliğini tek katmana indir (app.js veya ui.js, tek kaynak).
- Hedef: Panelde hata üretmeyen stabil temel.

### Faz 1 - Tasarım Sistemi ve Yerleşim
- Panel için özel token seti (spacing, radius, shadow, state renkleri).
- admin-summary, summary-card, filters, map-toolbar, detail-panel, table-wrap için net stil katmanı.
- Sticky filtre sütunu + güçlü kart hiyerarşisi.

### Faz 2 - Etkileşim ve Bilgi Yoğunluğu
- Durum dağılımını renkli chip/baget + tooltip yapısına taşı.
- Tablo satırı etkileşim geri bildirimi (hover/active/focus).
- Boş/yükleniyor/hata durumları için tutarlı state bileşenleri.

### Faz 3 - Erişilebilirlik ve Mobil Son Rötuş
- focus-visible stilleri.
- Klavye dolaşımı ve ARIA iyileştirmeleri.
- 1024/768/480 kırılımlarında panel okunabilirliği ince ayar.

## 6) Tahmini Efor

- Faz 0: 0.5 gün
- Faz 1: 1 gün
- Faz 2: 1 gün
- Faz 3: 0.5 gün
- Toplam: 3 gün (tek geliştirici, mevcut kodu bozmadan minimum risk yaklaşımı)

## 7) Onay Seçenekleri

1. Minimum paket: Faz 0 + Faz 1 (hızlı görsel toparlama)
2. Dengeli paket: Faz 0 + Faz 1 + Faz 2 (önerilen)
3. Tam paket: Faz 0 + Faz 1 + Faz 2 + Faz 3

Onayla birlikte ilgili faz için uygulama adımlarını ve dosya bazlı değişiklik planını başlatabilirim.
