'use client';

import { useEffect, useState } from 'react';
import { Nav } from '@/components/sections/Nav';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Catalog } from '@/components/sections/Catalog';
import { Services } from '@/components/sections/Services';
import { Footer } from '@/components/sections/Footer';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { I18nProvider } from '@/lib/i18nContext';
import { StickyMobileBar } from '@/components/ui/StickyMobileBar';
import { CartModal, CartFAB } from '@/components/ui/CartModal';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { CartProvider } from '@/lib/cartContext';

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
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <I18nProvider>
      <CartProvider>
        <LoadingScreen visible={loading} />
        <Nav />
        <main className="relative">
          <Hero />
          <About />
          <Catalog />
          <Services />
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
