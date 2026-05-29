'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LangSwitcher } from '@/components/ui/LangSwitcher';
import { useI18n } from '@/lib/i18nContext';
import { MessageSquare, X } from 'lucide-react';
import { useCart } from '@/lib/cartContext';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [barVisible, setBarVisible] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { tr } = useI18n();
  const { itemCount, openCart } = useCart();

  useEffect(() => {
    if (!localStorage.getItem('ann-spring2026')) setBarVisible(true);
  }, []);

  const dismissBar = () => {
    setBarVisible(false);
    localStorage.setItem('ann-spring2026', '1');
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      // Direct DOM write — no React re-render, true 60fps
      if (progressBarRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
        progressBarRef.current.style.width = `${pct}%`;
        progressBarRef.current.style.opacity = pct > 0.5 ? '1' : '0';
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const ids = ['catalog', 'about', 'services', 'news'];
    const observers: IntersectionObserver[] = [];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        entries => { if (entries[0].isIntersecting) setActiveSection(id); },
        { threshold: 0.25 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const links = [
    { label: tr.nav.trees,               href: '#catalog',  section: 'catalog'  },
    { label: tr.nav.about,               href: '#about',    section: 'about'    },
    { label: tr.nav.services,            href: '#services', section: 'services' },
    { label: (tr.nav as any).news,       href: '#news',     section: 'news'     },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  const handleQuoteClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (itemCount > 0) {
      openCart();
      return;
    }
    scrollToSection('catalog');
  };

  return (
    <>
      {/* Scroll progress line */}
      <div className="fixed top-0 left-0 right-0 z-[200] h-[2.5px] pointer-events-none">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-forest-500 via-emerald-400 to-forest-600"
          style={{ width: '0%', opacity: 0 }}
        />
      </div>


      {/* Seasonal announcement bar */}
      <AnimatePresence>
        {barVisible && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 z-[115] h-9 flex items-center justify-center gap-2 text-[12px] font-medium text-white/90 overflow-hidden"
            style={{ background: 'linear-gradient(90deg,#0c1a0e 0%,#1a3620 40%,#243826 60%,#0c1a0e 100%)' }}
          >
            {/* Shimmer sweep */}
            <span className="ann-shimmer absolute inset-0 pointer-events-none" aria-hidden />
            <span className="text-emerald-400 text-[13px]">🌱</span>
            <span className="hidden sm:inline">{(tr.nav as any).annText}</span>
            <a
              href="#catalog"
              onClick={(e) => {
                e.preventDefault();
                dismissBar();
                scrollToSection('catalog');
              }}
              className="font-semibold text-white hover:text-emerald-300 transition-colors underline underline-offset-2 decoration-white/30"
            >
              {(tr.nav as any).annLink}
            </a>
            <span className="hidden sm:inline text-white/40 mx-1">·</span>
            <span className="hidden sm:inline text-white/50">{(tr.nav as any).annFree}</span>
            <button
              onClick={dismissBar}
              aria-label="Dismiss"
              className="absolute right-3 w-6 h-6 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors rounded-full hover:bg-white/10"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 right-0 z-[100] flex justify-center px-4 transition-[top] duration-300"
      style={{ top: barVisible ? '44px' : '16px' }}
    >
      <nav
        className={`flex items-center gap-1 rounded-full transition-all duration-500 ${
          scrolled ? 'glass-strong shadow-lg shadow-forest-900/5' : 'glass'
        }`}
        style={{ padding: '5px 5px 5px 14px' }}
      >
        <Link href="#" className="flex items-center gap-1.5 mr-2 sm:mr-4 text-forest-900 dark:text-forest-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 22V14M12 14C8 14 5 10 5 6C5 3 8 2 12 2C16 2 19 3 19 6C19 10 16 14 12 14Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[13px] sm:text-sm font-semibold tracking-tight">MB Plant House</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(l.section);
              }}
              className="relative px-3 py-1.5 text-[13px] font-medium text-forest-700 dark:text-forest-200 hover:text-forest-900 dark:hover:text-white rounded-full transition-colors"
            >
              {l.label}
              {activeSection === l.section && (
                <motion.span
                  layoutId="nav-active-dot"
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400"
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                />
              )}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 ml-1 sm:ml-2">
          <a
            href="tel:+37061854758"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-forest-700 dark:text-forest-200 hover:text-forest-950 dark:hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.4h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l1.27-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.18z"/></svg>
            +370 618 54758
          </a>
          <LangSwitcher />
          <ThemeToggle />
          <a
            href="#catalog"
            onClick={handleQuoteClick}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[13px] font-medium hover:scale-[1.03] active:scale-[0.97] transition-transform"
          >
            <MessageSquare size={13} />
            <span className="hidden sm:inline">{(tr.nav as any).requestQuote || 'Quote'}</span>
          </a>
        </div>
      </nav>
    </motion.header>
    </>
  );
}
