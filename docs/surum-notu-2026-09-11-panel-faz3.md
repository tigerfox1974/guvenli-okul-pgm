# Surum Notu - 2026-09-11 (Panel Faz 0-3)

Bu not, PGM paneli icin uygulanan stabilizasyon, UI duzeni ve erisilebilirlik iyilestirmelerini ozetler.

## Ozet

- Paneldeki harita baslatma cakismasi giderildi.
- Panel gorunumu kurumsal hiyerarsiye uygun sekilde guclendirildi.
- Durum dagilimi metin yerine renkli baget ve tooltip yapisina tasindi.
- Klavye erisilebilirligi ve canli durum duyurulari eklendi.
- Mobil kirilimlarda panel okunabilirligi iyilestirildi.

## Teknik Degisiklikler

### 1) Stabilizasyon

- Dinamik import yollari tekillestirildi.
- Ayni modulu farkli URL ile iki kez yukleme riski azaltildi.

Etkilenen dosya:
- js/app.js

### 2) Panel UI Duzeni

- Filtre alani, ozet kartlari, risk tablosu, harita arac cubugu, tablo ve detay paneli icin ozel stil katmani eklendi.
- Satir secim/odak gorunurlugu ve aktif satir vurgusu eklendi.
- Durum etiketleri icin renk tabanli gorsel dil tanimlandi.

Etkilenen dosyalar:
- css/main.css
- js/modules/ui.js
- index.html

### 3) Erisilebilirlik ve Mobil

- role=status + aria-live duyurulari eklendi.
- Harita katman butonlari ve risk odak butonlari icin aria-pressed senkronu eklendi.
- Grup satirlarinda Enter/Space secim, ArrowUp/ArrowDown odak gecisi eklendi.
- Detay listesinin aria-busy durumu render akisi ile senkronlandi.
- 1040px ara kirilim ve mevcut mobil kirilimlarda panel sikismasi azaltildi.

Etkilenen dosyalar:
- index.html
- js/modules/ui.js
- css/main.css

## Dogrulama Notu

- Kod duzeyinde yeni hata tespit edilmedi.
- Canli tarayici testlerinde panel girisi, filtreleme, risk odagi, tablo secimi ve detay panel akisi dogrulandi.
- Gecici test verisi test sonunda temizlendi.

## Bilinen Kapsam Disi Basliklar

Bu surumde uygulanan degisiklikler kapsaminda asagidaki islevler eklenmemistir:

- Durum guncelleme aksiyonlari (CRUD)
- Yetkili notu ekleme aksiyonlari
- Dosya/fotograf goruntuleme aksiyonlari (panel ici)

Bu basliklar bir sonraki is paketinde ele alinabilir.
