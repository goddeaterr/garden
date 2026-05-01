'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LangSwitcher } from '@/components/ui/LangSwitcher';
import { useI18n } from '@/lib/i18nContext';
import { MessageSquare } from 'lucide-react';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { tr } = useI18n();

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
    const ids = ['catalog', 'about', 'services'];
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
    { label: tr.nav.trees,    href: '#catalog',   section: 'catalog'  },
    { label: tr.nav.about,    href: '#about',     section: 'about'    },
    { label: tr.nav.services, href: '#services',  section: 'services' },
  ];

  return (
    <>
      {/* Scroll progress line — direct DOM updates, true 60fps */}
      <div className="fixed top-0 left-0 right-0 z-[200] h-[2.5px] pointer-events-none">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-forest-500 via-emerald-400 to-forest-600"
          style={{ width: '0%', opacity: 0 }}
        />
      </div>
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

        <div className="flex items-center gap-1.5 ml-2">
          <LangSwitcher />
          <ThemeToggle />
          <a
            href="#catalog"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[13px] font-medium hover:scale-[1.03] active:scale-[0.97] transition-transform"
          >
            <MessageSquare size={13} />
            <span>{(tr.nav as any).requestQuote || 'Request Quote'}</span>
          </a>
        </div>
      </nav>
    </motion.header>
    </>
  );
}
