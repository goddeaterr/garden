'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LangSwitcher } from '@/components/ui/LangSwitcher';
import { useGarden } from '@/components/builder/GardenContext';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { total, placed } = useGarden();
  const { tr } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: tr.marketplace?.compare || 'Compare prices', href: '/marketplace' },
    { label: tr.nav.trees, href: '#catalog' },
    { label: tr.nav.builder, href: '#builder' },
    { label: tr.nav.about, href: '#about' },
    { label: tr.nav.services, href: '#footer' },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-4 px-4"
    >
      <nav
        className={`flex items-center gap-1 rounded-full transition-all duration-500 ${
          scrolled ? 'glass-strong shadow-lg shadow-forest-900/5' : 'glass'
        }`}
        style={{ padding: '6px 6px 6px 22px' }}
      >
        <Link href="#" className="flex items-center gap-2 mr-4 text-forest-900 dark:text-forest-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 22V14M12 14C8 14 5 10 5 6C5 3 8 2 12 2C16 2 19 3 19 6C19 10 16 14 12 14Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-semibold tracking-tight">MB Plant House</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-[13px] font-medium text-forest-700 dark:text-forest-200 hover:text-forest-900 dark:hover:text-white rounded-full transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          <LangSwitcher />
          <ThemeToggle />
          <a
            href="#builder"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[13px] font-medium hover:scale-[1.03] active:scale-[0.97] transition-transform"
          >
            <ShoppingBag size={13} />
            <span className="tabular-nums">{placed.length > 0 ? formatPrice(total) : tr.nav.garden}</span>
          </a>
        </div>
      </nav>
    </motion.header>
  );
}
