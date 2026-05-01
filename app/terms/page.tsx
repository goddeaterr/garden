'use client';

import Link from 'next/link';
import { I18nProvider, useI18n } from '@/lib/i18nContext';

function TermsContent() {
  const { tr } = useI18n();
  const l = tr.legal;
  const t = l.terms;
  return (
    <main className="min-h-screen bg-forest-50 dark:bg-forest-950 px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[13px] text-forest-600 dark:text-forest-400 hover:text-forest-900 dark:hover:text-white mb-8 inline-flex items-center gap-1">{l.backToHome}</Link>
        <h1 className="text-4xl font-bold text-forest-950 dark:text-forest-50 mb-2 mt-6">{t.title}</h1>
        <p className="text-forest-500 dark:text-forest-400 text-sm mb-10">{l.lastUpdated}</p>
        <div className="space-y-8 text-forest-800 dark:text-forest-200 leading-relaxed">
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{t.s1h}</h2><p>{t.s1p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{t.s2h}</h2><p>{t.s2p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{t.s3h}</h2><p>{t.s3p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{t.s4h}</h2><p>{t.s4p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{t.s5h}</h2><p>{t.s5p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{t.s6h}</h2><p>{t.s6p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{t.s7h}</h2><p>{t.s7p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{t.s8h}</h2><p>{t.s8p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{t.s9h}</h2><p>{t.s9p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{t.s10h}</h2><p>{t.s10p}<br /><a href="mailto:info@planthouse.lt" className="underline">info@planthouse.lt</a> · +370 618 54758</p></section>
        </div>
      </div>
    </main>
  );
}

export default function TermsPage() {
  return <I18nProvider><TermsContent /></I18nProvider>;
}
