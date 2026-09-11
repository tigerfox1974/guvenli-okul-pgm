import React, { useState } from 'react';
import { Menu, X, ShieldCheck } from 'lucide-react';

const NAV_ITEMS = [
{ id: 'home', label: 'Tanıtım' },
{ id: 'report', label: 'Online Güvenli İhbar' },
{ id: 'admin', label: 'Giriş' }] as
const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#14213d] text-white shadow-[0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(15,23,42,0.18)]">
      <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-4 px-5 py-3.5 lg:px-6">
        <a href="#home" className="flex items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#93c5fd]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/25">
            <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-[0.01em]">Polis Genel Müdürlüğü</span>
            <span className="block text-[13px] font-normal text-white/70">
              Güvenli Okul Bilgi ve Bildirim Platformu
            </span>
          </span>
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menüyü aç/kapat"
          aria-expanded={open}
          aria-controls="primaryNav"
          className="grid h-11 w-11 place-items-center rounded-lg bg-white/10 md:hidden">
          
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>

        <nav id="primaryNav" aria-label="Ana menü" className="hidden items-center gap-2 md:flex">
          {NAV_ITEMS.map((item, index) =>
          <button
            key={item.id}
            type="button"
            className={
            index === 0 ?
            'rounded-lg bg-white px-3.5 py-2.5 text-[14px] font-bold text-[#14213d]' :
            'rounded-lg bg-white/10 px-3.5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-white/20'
            }>
            
              {item.label}
            </button>
          )}
        </nav>
      </div>

      {open &&
      <nav aria-label="Ana menü" className="border-t border-white/10 px-5 pb-4 pt-3 md:hidden">
          <ul className="grid gap-2">
            {NAV_ITEMS.map((item, index) =>
          <li key={item.id}>
                <button
              type="button"
              className={
              index === 0 ?
              'w-full rounded-lg bg-white px-3.5 py-2.5 text-left text-[14px] font-bold text-[#14213d]' :
              'w-full rounded-lg bg-white/10 px-3.5 py-2.5 text-left text-[14px] font-bold text-white'
              }>
              
                  {item.label}
                </button>
              </li>
          )}
          </ul>
        </nav>
      }
    </header>);

}