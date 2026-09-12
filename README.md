# 🏫 Güvenli Okul Bilgi ve Bildirim Platformu

<div align="center">

**KKTC Polis Genel Müdürlüğü & POLVAK İş Birliği ile**

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://guvenli-okul-pgm.vercel.app)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet-199900?style=flat-square&logo=leaflet)](https://leafletjs.com)
[![Playwright](https://img.shields.io/badge/Tests-Playwright-45ba4b?style=flat-square&logo=playwright)](https://playwright.dev)

*Güvenli Yarınlar, Güçlü Nesiller*

</div>

---

## 📋 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Özellikler](#-özellikler)
- [Teknolojiler](#-teknolojiler)
- [Klasör Yapısı](#-klasör-yapısı)
- [Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
- [Supabase Entegrasyonu](#-supabase-entegrasyonu)
- [Test](#-test)
- [Vercel Deploy](#-vercel-deploy)
- [Acil Durum Politikası](#-acil-durum-politikası)
- [Sürüm Notları](#-sürüm-notları)

---

## 🎯 Proje Hakkında

**Güvenli Okul**, KKTC genelindeki ilkokul, ortaokul ve lise düzeyindeki tüm okullarda güvenlik sorunlarının **anonim** olarak bildirilmesini ve Polis Genel Müdürlüğü (PGM) bünyesinde merkezi olarak takip edilmesini sağlayan web tabanlı bir platformdur.

### Amaç

- 🎓 Öğrenciler, veliler, öğretmenler ve okul çevresindeki vatandaşların güvenlik risklerini **kolay, sade ve anonim** şekilde bildirmesi
- 🗺️ Bildirimlerin **harita üzerinden analiz** edilmesi ve risk bölgelerinin belirlenmesi
- 📊 Kategori bazlı sınıflandırma ve **ısı haritası** görselleştirmesi ile önceliklendirme
- 🔒 Merkezi takip sistemi ile **önleyici tedbirlerin** koordineli alınması

---

## ✨ Özellikler

### 👥 Herkese Açık Arayüz

| Özellik | Açıklama |
|---------|----------|
| **Tanıtım Sayfası** | Proje hakkında bilgilendirme, güvenlik kategorileri ve kullanım kılavuzu |
| **Anonim Bildirim Formu** | Kimlik bilgisi gerektirmeyen, güvenli bildirim sistemi |
| **Okul Seçimi** | İlçeye göre filtrelenen gerçek okul listesi (koordinatlı) |
| **Acil Durum Uyarısı** | Form girişinde 5 saniyelik zorunlu telefon yönlendirme ekranı |
| **WhatsApp Paylaşımı** | Platformu sosyal medyada paylaşma imkanı |
| **QR Kod Erişimi** | Hızlı mobil erişim için QR kod desteği |

### 🔐 PGM Yönetim Paneli

| Özellik | Açıklama |
|---------|----------|
| **Rol Tabanlı Kimlik Doğrulama** | Yetkili kullanıcı girişi (Operator, Supervisor, Admin) |
| **Interaktif Harita** | KKTC haritası üzerinde okul noktaları ve bildirim lokasyonları |
| **Isı Haritası** | Kategori, olay sayısı ve tarih aralığına göre risk yoğunluğu görselleştirmesi |
| **Filtreleme** | İlçe, okul, kategori ve tarih bazlı filtreleme |
| **Özet Kartları** | Toplam, bekleyen, incelenen ve çözülen bildirim sayıları |
| **Risk Tablosu** | Okul bazlı risk öncelikli sıralama |
| **Detay Paneli** | Seçilen bildirimin tüm ayrıntıları |

---

## 🛠️ Teknolojiler

### Frontend

| Teknoloji | Kullanım Alanı |
|-----------|----------------|
| **HTML5 / CSS3** | Semantik yapı ve responsive tasarım |
| **Vanilla JavaScript (ES Modules)** | Uygulama mantığı ve modüler yapı |
| **Leaflet.js** | İnteraktif harita ve OpenStreetMap entegrasyonu |
| **Leaflet.heat** | Isı haritası görselleştirmesi |

### Backend & Veritabanı

| Teknoloji | Kullanım Alanı |
|-----------|----------------|
| **Supabase PostgreSQL** | Veritabanı ve gerçek zamanlı veri |
| **Supabase Auth** | Kullanıcı kimlik doğrulama |
| **Vercel Serverless Functions** | API endpoint'leri (`/api/report`) |
| **Row Level Security (RLS)** | Veritabanı güvenlik politikaları |

### Güvenlik & Anti-Spam

| Özellik | Açıklama |
|---------|----------|
| **Rate Limiting** | IP başına 10 dk'da max 5 gönderim |
| **Fingerprint Limiting** | Cihaz izi başına 10 dk'da max 3 gönderim |
| **Duplicate Detection** | 15 dk içinde aynı içerik engelleme |
| **Content Sanitization** | Link sayısı, metin uzunluğu kontrolü |
| **Security Event Logging** | Güvenlik olayları kayıt sistemi |

---

## 📁 Klasör Yapısı

```
guvenli-okul-pgm/
├── 📄 index.html                    # Ana uygulama sayfası
├── 📄 vercel.json                   # Vercel yapılandırması ve güvenlik başlıkları
├── 📄 README.md                     # Proje dokümantasyonu
│
├── 📂 api/                          # Vercel Serverless Functions
│   ├── report.js                    # Bildirim gönderim API'si (rate limit, validation)
│   ├── _shared/                     # Paylaşımlı yardımcı modüller
│   │   └── admin-common.js
│   └── admin/                       # Admin API endpoint'leri
│       ├── login.js
│       ├── panel.js
│       └── reports.js
│
├── 📂 js/                           # Frontend JavaScript modülleri
│   ├── app.js                       # Ana uygulama giriş noktası
│   ├── config/
│   │   └── supabase.config.js       # Supabase yapılandırması
│   ├── data/
│   │   ├── canonical-source.mjs     # Okul koordinat verisi (tek kaynak)
│   │   └── schools.js               # Okul listesi export
│   └── modules/
│       ├── admin-api.js             # Admin kimlik doğrulama
│       ├── form.js                  # Bildirim formu mantığı
│       ├── map.js                   # Harita ve katman yönetimi
│       ├── supabase.js              # Supabase istemci
│       ├── ui.js                    # Panel UI bileşenleri
│       └── utils.js                 # Yardımcı fonksiyonlar
│
├── 📂 css/
│   └── main.css                     # Tüm stil tanımları
│
├── 📂 assets/
│   ├── images/                      # Görseller (brand, icons, illustrations)
│   ├── logos/                       # Kurumsal logolar
│   ├── qr/                          # QR kod görselleri
│   └── vendor/
│       └── leaflet/                 # Leaflet kütüphanesi (offline)
│
├── 📂 docs/                         # Proje dokümantasyonu
│   ├── proje-plani.md               # Detaylı proje planı
│   ├── surum-notu-*.md              # Sürüm notları
│   ├── supabase-setup.sql           # Veritabanı kurulum SQL'i
│   ├── supabase-admin-users.sql     # Admin kullanıcı tablosu
│   ├── supabase-rls-fix.sql         # RLS düzeltmeleri
│   └── ...                          # Diğer teknik dökümanlar
│
├── 📂 scripts/
│   └── seed-admin-users.mjs         # Admin kullanıcı oluşturma scripti
│
├── 📂 tests/
│   └── smoke/                       # Playwright smoke testleri
│       ├── package.json
│       ├── playwright.config.js
│       ├── smoke.spec.js
│       └── README.md
│
└── 📂 _design-reference/            # Tasarım referansları (production dışı)
    └── magicpatterns/               # React/Tailwind prototip
```

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler

- Modern web tarayıcısı (Chrome, Firefox, Edge, Safari)
- Yerel geliştirme için: Python 3.x veya Node.js

### Yerel Sunucu ile Çalıştırma

> ⚠️ Supabase entegrasyonu test edilirken `file://` yerine yerel HTTP sunucu ile açmanız **zorunludur**.

#### Yöntem A: Python ile

```bash
# Proje klasörüne gidin
cd guvenli-okul-pgm

# HTTP sunucuyu başlatın
python -m http.server 5500

# Tarayıcıda açın
# http://localhost:5500
```

#### Yöntem B: Node.js ile

```bash
# Proje klasörüne gidin
cd guvenli-okul-pgm

# npx ile serve kullanın
npx serve . -l 5500

# Tarayıcıda açın
# http://localhost:5500
```

#### Yöntem C: VS Code Live Server

VS Code kullanıyorsanız **Live Server** eklentisi ile `index.html` dosyasını doğrudan açabilirsiniz.

---

## 🗄️ Supabase Entegrasyonu

### Hızlı Başlangıç

1. **Supabase Hesabı Oluşturun**: [supabase.com](https://supabase.com)

2. **Yeni Proje Oluşturun**: Dashboard'dan "New Project" ile proje oluşturun

3. **Veritabanı Tablolarını Kurun**:
   ```sql
   -- docs/supabase-setup.sql dosyasını SQL Editor'de çalıştırın
   ```

4. **API Anahtarlarını Alın**:
   - Project Settings → API → `anon public` anahtarı
   - Project URL

5. **Yapılandırmayı Güncelleyin**:
   ```javascript
   // js/config/supabase.config.js
   export const SUPABASE_CONFIG = Object.freeze({
     url: 'YOUR_SUPABASE_URL',
     anonKey: 'YOUR_ANON_KEY',
     // ...
   });
   ```

### Veritabanı Şeması

| Tablo | Açıklama |
|-------|----------|
| `anonymous_reports` | Anonim bildirimler |
| `admin_users` | Yetkili kullanıcılar |
| `report_rate_limits` | Rate limit kayıtları |
| `security_events` | Güvenlik olay logları |

### RLS Politikaları

- **Insert-only** politikası: Anonim kullanıcılar yalnızca bildirim ekleyebilir
- **Read** politikası: Yalnızca yetkili kullanıcılar bildirimleri okuyabilir

> 📖 Mevcut README.md'nin eski sürümünde yer alan ayrıntılı "Supabase ile Kalıcı Kayıt" adım adım rehberi, bu bölümde özetlenmiştir. Tam SQL kurulum betikleri `docs/` klasöründe bulunur.

---

## 🧪 Test

### Smoke Testleri (Salt Okunur)

Tarayıcı tabanlı, salt okunur smoke test takımı `tests/smoke/` altında yer alır.

#### Kapsam

- ✅ `index.html` yüklenmesi
- ✅ İhbar adım akışı
- ✅ Acil durum ve gönderim bildirim modalları
- ✅ Admin giriş kapısı
- ✅ Çekirdek filtreler
- ✅ Harita katman geçişleri

#### Kurulum ve Çalıştırma

```bash
# Test klasörüne gidin
cd tests/smoke

# Bağımlılıkları yükleyin
npm install

# Playwright tarayıcısını yükleyin
npx playwright install chromium

# Testleri çalıştırın
npm test

# Görsel modda çalıştırın (isteğe bağlı)
npm run test:headed
```

#### Farklı Ortamda Test

```bash
# Vercel preview adresi için
SMOKE_BASE_URL=https://your-preview.vercel.app npm test
```

> 💡 Testler hiçbir gerçek ağ isteği göndermez (yazma uçları stub'lanır). Bu nedenle hem yerel HTTP sunucusuna hem Vercel preview adresine karşı güvenle çalıştırılabilir.

---

## ☁️ Vercel Deploy

### Otomatik Deploy

GitHub reposuna push yapıldığında Vercel otomatik olarak deploy eder.

### Manuel Deploy

```bash
# Vercel CLI ile
npx vercel
```

### Güvenlik Başlıkları

`vercel.json` dosyasında tanımlanan güvenlik başlıkları:

| Başlık | Değer |
|--------|-------|
| Content-Security-Policy | Script, style, image ve connect kaynakları kısıtlı |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | Kamera, mikrofon, ödeme devre dışı |

### Cache Ayarları

```json
{
  "source": "/js/(.*)",
  "headers": [
    { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
  ]
}
```

> ⚠️ Deploy sonrası cache sorunları için: `?cb=1` parametresi ekleyerek sayfayı açın.

---

## 🚨 Acil Durum Politikası

> ⚠️ **Bu sistem acil olay bildirimi almak için kullanılmaz.**

Aşağıdaki durumlar bu sistemden **bildirilmemelidir**:

- 🔴 Devam eden kavga
- 🔴 Yaralanma
- 🔴 Silah
- 🔴 Yangın
- 🔴 Ciddi tehdit
- 🔴 Anlık tehlike

### Acil Durumlarda

| Hat | Numara |
|-----|--------|
| **Polis İmdat** | 155 |
| **Acil Çağrı Merkezi** | 112 |

Bildirim sayfasına girildiğinde kullanıcıya **5 saniyelik zorunlu uyarı** gösterilir. Sayım tamamlandıktan sonra yalnızca **acil olmayan** okul güvenliği bildirimi yapılmasına izin verilir.

---

## 📝 Sürüm Notları

### Son Güncellemeler

| Tarih | Sürüm | Açıklama |
|-------|-------|----------|
| 2026-09-11 | Panel Faz 0-3 | Harita stabilizasyonu, UI düzeni, erişilebilirlik iyileştirmeleri |

> 📖 Detaylı sürüm notları: [docs/surum-notu-2026-09-11-panel-faz3.md](docs/surum-notu-2026-09-11-panel-faz3.md)

### Planlanan Geliştirmeler

- [ ] Durum güncelleme aksiyonları (CRUD)
- [ ] Yetkili notu ekleme
- [ ] Dosya/fotoğraf görüntüleme (panel içi)
- [ ] Captcha entegrasyonu (koşullu)
- [ ] Operasyon metrikleri dashboard'u

---

## ⚖️ Lisans ve Sorumluluk

Bu proje **KKTC Polis Genel Müdürlüğü** ve **POLVAK (Polis Güçlendirme Vakfı)** iş birliği ile geliştirilmektedir.

### Kullanım Şartları

- Bildirimler **resmi şikâyet başvurusu değildir**
- Toplanan bilgiler yalnızca okul güvenliği kapsamında değerlendirilir
- Kasıtlı olarak gerçeğe aykırı bilgi verilmesi yasal işlem gerektirebilir

### Gizlilik

- Kimlik bilgisi zorunlu değildir
- Konum bilgisi yalnızca açık izin ile alınır
- Teknik kayıtlar (IP hash, cihaz izi) güvenlik amacıyla işlenir

---

<div align="center">

**Güvenli Okul Bilgi ve Bildirim Platformu**

*KKTC Polis Genel Müdürlüğü © 2026*

</div>

