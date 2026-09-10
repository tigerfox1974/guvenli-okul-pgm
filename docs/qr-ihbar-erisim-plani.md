# QR ile Ihbar Formu Dogrudan Erisim Plani

## 1. Amac

Bu planin amaci, kullanicinin QR kod okuttugunda dogrudan Ihbar formunun acilmasini saglamaktir.

## 2. Kapsam

Bu plan sadece Ihbar formu sayfasi icin gecerlidir.

- Dahil: Ihbar formuna dogrudan acilis
- Haric: Ana sayfa, panel veya diger tiklanabilir bolumler icin QR hedefi tanimlama

## 3. URL Stratejisi

Standart kullanim:

- Ana giris URL: https://guvenli-okul-pgm.vercel.app/
- QR hedef URL (birincil): https://guvenli-okul-pgm.vercel.app/#ihbar

Yedek uyumluluk URL'si:

- https://guvenli-okul-pgm.vercel.app/?page=ihbar

Not:

- Kurumsal materyallerde tek format kullanilmasi icin birincil URL olarak #ihbar onerilir.

## 4. Is Kurali

- QR kod sadece Ihbar formuna acacak sekilde uretilir.
- Diger bolumler icin (or. panel, tanitim) ayri QR gereksinimi bu plan kapsaminda yoktur.
- Kullanici alan adini her zaman dogru domaine (guvenli-okul-pgm.vercel.app) dogrulamalidir.

## 5. Guvenlik Ilkeleri

- QR ile forma hizli ulasim saglanmasi, yetkisiz panel erisimi saglamaz.
- Panel zaten ayri rol/giris denetimine tabi kalir.
- Form tarafinda spam riskine karsi sonraki asamada rate limit ve anti-spam katmani uygulanir.

## 6. Test ve Kabul Kriterleri

Kabul kriterleri:

1. QR okutuldugunda Ihbar formu dogrudan acilmalidir.
2. Tarayici adres cubugunda hedef URL gorunmelidir (#ihbar veya ?page=ihbar).
3. Sayfa yenilemede Ihbar gorunumu korunmalidir.
4. Ana URL (/) acildiginda varsayilan olarak tanitim/ana ekran gelmelidir.

Test kontrol listesi:

1. Android Chrome ile QR acilis testi
2. iOS Safari ile QR acilis testi
3. En az bir ucuncu parti QR okuyucu ile test
4. Farkli aglarda (Wi-Fi + mobil veri) acilis testi

## 7. Operasyon Plani

1. QR tasarimlari tek merkezden uretilir.
2. Basili materyal yayina cikmadan once cihaz testi yapilir.
3. Basili materyalde QR altina acik metin olarak hedef URL yazilir.
4. Periyodik kontrolle QR'nin hala dogru adrese gittigi dogrulanir.

## 8. Sorumluluk ve Degisiklik Yonetimi

- Bu planda QR hedefi degistirilirse once test, sonra baski guncellemesi yapilir.
- URL format degisikligi tek karar ile yapilir; sahada karisik format kullanilmaz.

## 9. Yayina Hazir Kontrol Listesi

Yayin oncesi zorunlu kontroller:

1. QR hedef linki yalnizca https://guvenli-okul-pgm.vercel.app/#ihbar olmali.
2. QR okutuldugunda Ihbar formu 3 saniye icinde acilmali.
3. URL cubugunda #ihbar gorunmeli.
4. Sayfa yenilendiginde Ihbar gorunumu korunmali.
5. Ana URL (/) acildiginda varsayilan olarak tanitim ekrani gelmeli.
6. Android ve iOS cihazlarda en az birer fiziksel test tamamlanmali.
7. Basili materyalde QR altinda acik metin URL yazilmali.
8. Yayin sonrasi ilk 24 saatte en az bir canli QR tarama dogrulama testi yapilmali.
