import React from 'react';
import { SiteHeader } from './components/SiteHeader';
import { Home } from './pages/Home';

export function App() {
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] font-heading text-[#111827]">
      <SiteHeader />
      <main>
        <Home />
      </main>
    </div>);

}