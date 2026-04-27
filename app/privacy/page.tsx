'use client';

import Link from 'next/link';
import { I18nProvider, useI18n } from '@/lib/i18nContext';

function PrivacyContent() {
  const { tr } = useI18n();
  const l = tr.legal;
  const p = l.privacy;
  return (
    <main className="min-h-screen bg-forest-50 dark:bg-forest-950 px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[13px] text-forest-600 dark:text-forest-400 hover:text-forest-900 dark:hover:text-white mb-8 inline-flex items-center gap-1">{l.backToHome}</Link>
        <h1 className="text-4xl font-bold text-forest-950 dark:text-forest-50 mb-2 mt-6">{p.title}</h1>
        <p className="text-forest-500 dark:text-forest-400 text-sm mb-10">{l.lastUpdated}</p>
        <div className="space-y-8 text-forest-800 dark:text-forest-200 leading-relaxed">
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{p.s1h}</h2><p>{p.s1p} <a href="mailto:info@planthouse.lt" className="underline">info@planthouse.lt</a> · +370 618 54758</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{p.s2h}</h2><p>{p.s2p}</p><ul className="list-disc ml-6 mt-2 space-y-1">{(p.s2list as unknown as string[]).map((item, i) => <li key={i}>{item}</li>)}</ul><p className="mt-3">{p.s2note}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{p.s3h}</h2><ul className="list-disc ml-6 space-y-2">{(p.s3list as unknown as string[]).map((item, i) => <li key={i}>{item}</li>)}</ul></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{p.s4h}</h2><p>{p.s4p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{p.s5h}</h2><p>{p.s5p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{p.s6h}</h2><p>{p.s6p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{p.s7h}</h2><p>{p.s7p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{p.s8h}</h2><p>{p.s8p}</p></section>
        </div>
      </div>
    </main>
  );
}

export default function PrivacyPage() {
  return <I18nProvider><PrivacyContent /></I18nProvider>;
}
