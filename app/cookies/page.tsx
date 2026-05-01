'use client';

import Link from 'next/link';
import { I18nProvider, useI18n } from '@/lib/i18nContext';

function CookiesContent() {
  const { tr } = useI18n();
  const l = tr.legal;
  const c = l.cookies;
  return (
    <main className="min-h-screen bg-forest-50 dark:bg-forest-950 px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[13px] text-forest-600 dark:text-forest-400 hover:text-forest-900 dark:hover:text-white mb-8 inline-flex items-center gap-1">{l.backToHome}</Link>
        <h1 className="text-4xl font-bold text-forest-950 dark:text-forest-50 mb-2 mt-6">{c.title}</h1>
        <p className="text-forest-500 dark:text-forest-400 text-sm mb-10">{l.lastUpdated}</p>
        <div className="space-y-8 text-forest-800 dark:text-forest-200 leading-relaxed">
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{c.s1h}</h2><p>{c.s1p}</p></section>
          <section>
            <h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{c.s2h}</h2>
            <p className="mb-4">{c.s2p}</p>
            <div className="rounded-xl border border-forest-200 dark:border-forest-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-forest-100 dark:bg-forest-900">
                  <tr>{[c.col1,c.col2,c.col3,c.col4].map(h => <th key={h} className="text-left px-4 py-3 font-semibold text-forest-900 dark:text-forest-100">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-forest-100 dark:divide-forest-800">
                  <tr>{[c.row1k,c.row1p,c.row1t,c.row1e].map((v,i) => <td key={i} className={`px-4 py-3 ${i===0?'font-mono text-xs':''}`}>{v}</td>)}</tr>
                  <tr>{[c.row2k,c.row2p,c.row2t,c.row2e].map((v,i) => <td key={i} className={`px-4 py-3 ${i===0?'font-mono text-xs':''}`}>{v}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{c.s3h}</h2><ul className="list-disc ml-6 space-y-1">{(c.s3list as unknown as string[]).map((item,i) => <li key={i}>{item}</li>)}</ul><p className="mt-3">{c.s3note}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{c.s4h}</h2><p>{c.s4p}</p></section>
          <section><h2 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3">{c.s5h}</h2><p>{c.s5p} <a href="mailto:info@planthouse.lt" className="underline">info@planthouse.lt</a></p></section>
        </div>
      </div>
    </main>
  );
}

export default function CookiesPage() {
  return <I18nProvider><CookiesContent /></I18nProvider>;
}
