'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, t, TranslationKey } from './i18n';

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  tr: TranslationKey;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('locale') as Locale;
      if (stored && ['en', 'lt', 'ru'].includes(stored)) setLocaleState(stored);
    } catch {}
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem('locale', l); } catch {}
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, tr: t(locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
