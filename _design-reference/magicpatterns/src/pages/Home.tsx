import React from 'react';
import { Target, Handshake, Phone, Megaphone, Bell, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ASSETS, TOPICS, AWARENESS_ITEMS, REMINDERS } from '../data/homeContent';
import { TopicCard } from '../components/home/TopicCard';
export function Home() {
  return <section id="home" className="w-full bg-[#f8fafc]">
      {/* 1-3: Kurumsal başlık bandı */}
      <div className="border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto max-w-[1220px] px-5 py-8 lg:px-6 lg:py-10">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 sm:gap-8">
            <img src={ASSETS.polvakLogo} alt="POLVAK - Polis Güçlendirme Vakfı logosu" className="h-14 w-14 object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24" />
            <div className="text-center">
              <h1 className="text-[24px] font-bold uppercase leading-[1.05] tracking-[-0.01em] text-[#14213d] sm:text-[38px] lg:text-[48px]">
                Güvenlİ Okul  <span className="text-[#047857]">PROJESİ</span>
              </h1>
              <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#475569] sm:text-[15px]">
                GÜVENLİ YARINLAR, GÜÇLÜ NESİLLER
              </p>
            </div>
            <img src={ASSETS.policeLogo} alt="KKTC Polis Genel Müdürlüğü logosu" className="h-14 w-14 object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1220px] px-5 py-8 lg:px-6 lg:py-10">
        {/* 4-7: Hero ve yan kartlar */}
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)_320px] lg:items-stretch">
          <article className="order-2 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] lg:order-1">
            <div className="flex items-center gap-2.5 bg-[#b91c1c] px-5 py-3 text-white">
              <Target className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 className="text-[15px] font-bold uppercase tracking-[0.04em]">PROJENİN AMACI</h2>
            </div>
            <p className="px-5 py-4 text-[15px] leading-[1.75] text-[#374151]">
              İlkokul, ortaokul ve lise düzeyindeki tüm okullarda daha güvenli, huzurlu ve destekleyici bir
              ortam oluşturarak öğrencilerimizin sağlıklı, bilinçli ve güvenli bireyler olarak yetişmelerini
              sağlamaktır.
            </p>
          </article>

          <figure className="order-1 overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#eef2f7] lg:order-2">
            <img src={ASSETS.heroImage} alt="Okul bahçesinde öğrencilerin yanında duran polis memuru" className="h-full min-h-[220px] w-full object-cover sm:min-h-[320px]" />
          </figure>

          <div className="order-3 flex flex-col gap-5">
            <article className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2.5 bg-[#14213d] px-5 py-3 text-white">
                <Handshake className="h-5 w-5 shrink-0" aria-hidden="true" />
                <h2 className="text-[15px] font-bold uppercase leading-tight tracking-[0.04em]">
                  POLİS GÜCÜNÜ HALKTAN ALIR
                </h2>
              </div>
              <p className="px-5 py-4 text-center text-[16px] font-bold uppercase leading-[1.55] text-[#b91c1c]">
                Bİrlİkte koruruz,
                <br />
                bİrlİkte güçlenİrİz,
                <br />
                bİrlİkte güvendeyİz!
              </p>
            </article>

            <article className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2.5 bg-[#047857] px-5 py-3 text-white">
                <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
                <h2 className="text-[15px] font-bold uppercase tracking-[0.04em]">GÜVENLİ İHBAR HATTI</h2>
              </div>
              <div className="flex items-center gap-4 px-5 py-4">
                <a href="tel:+905428520021" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-3 transition-colors hover:bg-[#d1fae5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#047857] text-white">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#047857]">
                      İhbar hattı
                    </span>
                    <span className="block whitespace-nowrap text-[17px] font-bold leading-tight text-[#14213d]">
                      0542 852 00 21
                    </span>
                  </span>
                </a>
                <img src={ASSETS.reportQr} alt="Güvenli İhbar Hattı bildirim formuna götüren QR kod" className="h-24 w-24 shrink-0 rounded-md border border-[#e2e8f0] bg-white object-contain p-1" />
              </div>
              <p className="border-t border-[#e2e8f0] px-5 py-3 text-center text-[13px] font-bold uppercase tracking-[0.08em] text-[#047857]">
                7/24 GIZLI • GÜVENLI • ETKİLİ
              </p>
            </article>
          </div>
        </div>

        {/* Acil durum hatırlatması */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#b91c1c]" aria-hidden="true" />
          <p className="text-[14px] leading-[1.7] text-[#7f1d1d]" style={{
          fontSize: "20px"
        }}>
            Bu platform, devam eden veya acil müdahale gerektiren olayların bildirilmesi için{' '}
            <strong className="underline">kullanılmamalıdır</strong>. Acil durumlarda derhal{' '}
            <strong>155 Polis İmdat</strong> veya <strong>112 Acil Çağrı Merkezi</strong> aranmalıdır.
          </p>
        </div>

        {/* 8: Konu kartları */}
        <div className="mt-8">
          <h2 className="sr-only">Proje konu başlıkları</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {TOPICS.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
          </div>
        </div>

        {/* 9: Sizin dikkatiniz, bizim gücümüz */}
        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2.5 bg-[#14213d] px-5 py-3 text-white">
              <Megaphone className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 className="text-[15px] font-bold uppercase tracking-[0.04em]">
                Sizin dikkatiniz, bizim gücümüz!
              </h2>
            </div>
            <div className="px-5 py-5">
              <p className="text-center text-[15px] font-semibold text-[#334155]">
                Okullarımızı daha güvenli hale getirmek için hepimizin sorumluluğu var.
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {AWARENESS_ITEMS.map((item) => <li key={item} className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-[14px] leading-[1.6] text-[#374151]">
                    {item}
                  </li>)}
              </ul>
              <p className="mt-5 flex items-center justify-center gap-2.5 rounded-lg bg-[#14213d] px-4 py-3 text-center text-[14px] font-semibold text-white">
                <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
                Gördüğünüz, duyduğunuz, şüphelendiğiniz her durumda bize ulaşın.
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2.5 bg-[#047857] px-5 py-3 text-white">
              <Bell className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 className="text-[15px] font-bold uppercase tracking-[0.04em]">Unutmayın!</h2>
            </div>
            <ul className="divide-y divide-[#eef2f7]">
              {REMINDERS.map((reminder) => <li key={reminder} className="px-5 py-4 text-[15px] font-semibold leading-[1.6] text-[#14213d]">
                  {reminder}
                </li>)}
            </ul>
          </section>
        </div>
      </div>

      {/* 10: Kapanış bandı */}
      <div className="bg-[#14213d]">
        <div className="mx-auto max-w-[1220px] px-5 py-8 text-center lg:px-6">
          <p className="text-[14px] font-semibold uppercase tracking-[0.12em] text-white/80">
            Daha güvenli okullar için
          </p>
          <p className="mt-2 text-[24px] font-bold uppercase tracking-[0.02em] text-[#facc15] sm:text-[32px]">
            Hep beraber el ele!
          </p>
        </div>
      </div>
    </section>;
}