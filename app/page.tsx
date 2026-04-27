'use client';

import { useEffect, useState } from 'react';
import { Nav } from '@/components/sections/Nav';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Catalog } from '@/components/sections/Catalog';
import { Builder } from '@/components/builder/Builder';
import { MarketplaceTeaser } from '@/components/sections/MarketplaceTeaser';
import { CheckoutModal } from '@/components/builder/CheckoutModal';
import { Footer } from '@/components/sections/Footer';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { GardenProvider } from '@/components/builder/GardenContext';
import { I18nProvider } from '@/lib/i18nContext';
import { AIAssistant } from '@/components/ui/AIAssistant';

export default function Home() {
  const [loading, setLoading] = useState(true);


  // Ctrl+Shift+A → go to admin
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        window.location.href = '/admin';
      }
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
      <GardenProvider>
        <LoadingScreen visible={loading} />
        <Nav />
        <main className="relative">
          <Hero />
          <About />
          <MarketplaceTeaser />
          <Catalog />
          <Builder />
          <Footer />
        </main>
        <CheckoutModal />
        <AIAssistant />
      </GardenProvider>
    </I18nProvider>
  );
}
