'use client';

import { useEffect, useState } from 'react';
import { Nav } from '@/components/sections/Nav';
import { Hero } from '@/components/sections/Hero';
import { Catalog } from '@/components/sections/Catalog';
import { About } from '@/components/sections/About';
import { News } from '@/components/sections/News';
import { Footer } from '@/components/sections/Footer';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { I18nProvider } from '@/lib/i18nContext';
import { StickyMobileBar } from '@/components/ui/StickyMobileBar';
import { CartModal, CartFAB } from '@/components/ui/CartModal';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { CartProvider } from '@/lib/cartContext';
import { CursorGlow } from '@/components/ui/CursorGlow';
import { AmbientOrbs } from '@/components/ui/AmbientOrbs';

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') window.location.href = '/admin';
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1750);
    return () => clearTimeout(t);
  }, []);

  return (
    <I18nProvider>
      <CartProvider>
        <AmbientOrbs />
        <CursorGlow />
        <LoadingScreen visible={loading} />
        <Nav />
        <main className="relative">
          <Hero />
          <Catalog />
          <About />
          <News />
          <Footer />
        </main>
        <StickyMobileBar />
        <CartFAB />
        <CartModal />
        <ScrollProgress />
      </CartProvider>
    </I18nProvider>
  );
}
