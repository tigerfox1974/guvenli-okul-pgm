# Güvenli Okul PGM — Smoke Testleri (Salt Okunur)

Sürüm kontrollerini hafif tutmak için tarayıcı tabanlı, **salt okunur** bir smoke
test takımıdır. Testler; `index.html` yüklenmesini, ihbar adım akışını, acil durum
ve gönderim bildirim modallarını, admin giriş kapısını, çekirdek filtreleri ve
harita katman geçişlerini kapsar.

Testler hiçbir gerçek ağ isteği göndermez: `/api/report`, `/api/admin/*`,
Supabase REST ve Auth uçları test içinde stub'lanır. Böylece Supabase'e veya
deploy edilmiş serverless fonksiyonlara dokunmadan, yerel HTTP sunucusu veya
Vercel preview üzerinde çalıştırılabilir.

## Kurulum

```bash
cd tests/smoke
npm install
npx playwright install chromium
```

## Çalıştırma

Varsayılan taban adres `http://localhost:5500`'dir. Önce proje kökünde yerel bir
sunucu başlatın (örn. `python -m http.server 5500` veya `npx serve . -l 5500`),
sonra:

```bash
cd tests/smoke
npm test
```

Farklı bir adrese (ör. Vercel preview) karşı çalıştırmak için `SMOKE_BASE_URL`
ortam değişkenini kullanın:

```powershell
$env:SMOKE_BASE_URL = 'https://guvenli-okul-pgm.vercel.app'
cd tests/smoke
npm test
```

Başlı gözlemlemek için:

```bash
npm run test:headed
```
