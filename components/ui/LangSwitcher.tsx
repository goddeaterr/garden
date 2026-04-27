'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18nContext';
import { LOCALES } from '@/lib/i18n';
import { ChevronDown } from 'lucide-react';

export function LangSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find(l => l.code === locale)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-semibold tracking-widest text-forest-700 dark:text-forest-200 hover:bg-forest-100 dark:hover:bg-forest-800/60 transition-colors"
        aria-label="Select language"
      >
        {current.label}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={11} className="opacity-50" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-1.5 glass-strong rounded-xl overflow-hidden shadow-lg shadow-forest-900/10 min-w-[72px]"
          >
            {LOCALES.map(l => (
              <button
                key={l.code}
                onClick={() => { setLocale(l.code); setOpen(false); }}
                className={`w-full flex items-center justify-center px-3 py-2 text-[12px] font-semibold tracking-widest transition-colors ${
                  locale === l.code
                    ? 'bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900'
                    : 'text-forest-800 dark:text-forest-100 hover:bg-forest-100 dark:hover:bg-forest-800'
                }`}
              >
                {l.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
