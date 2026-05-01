'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { I18nProvider, useI18n } from '@/lib/i18nContext';
import { ArrowLeft, MessageSquare, Droplets, Sun, Layers, Scissors, Thermometer, Maximize2, TrendingUp } from 'lucide-react';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { QuoteModal } from '@/components/sections/QuoteModal';
import { formatPrice } from '@/lib/utils';
import type { Tree } from '@/types';

const careIcons: Record<string, React.ReactNode> = {
  watering: <Droplets size={15} />, sunlight: <Sun size={15} />, soil: <Layers size={15} />,
  pruning: <Scissors size={15} />, hardiness: <Thermometer size={15} />,
  spacing: <Maximize2 size={15} />, growthRate: <TrendingUp size={15} />,
};

function TreePageInner({ slug }: { slug: string }) {
  const [tree, setTree] = useState<Tree | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const { locale } = useI18n();

  useEffect(() => {
    fetch('/api/trees')
      .then(r => r.ok ? r.json() : [])
      .then((trees: Tree[]) => setTree(trees.find(t => t.id === slug) || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-50 dark:bg-forest-950 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-forest-300 border-t-forest-700 animate-spin" />
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="min-h-screen bg-forest-50 dark:bg-forest-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="text-xl font-bold text-forest-900 dark:text-forest-50 mb-2">Tree not found</h1>
          <p className="text-forest-500 mb-4">This tree isn't in our catalog.</p>
          <Link href="/#catalog" className="px-4 py-2 rounded-xl bg-forest-900 text-white text-[13px] font-medium">Browse catalog</Link>
        </div>
      </div>
    );
  }

  const careKeys = ['watering', 'sunlight', 'soil', 'pruning', 'hardiness', 'spacing', 'growthRate'] as const;

  return (
    <div className="min-h-screen bg-forest-50 dark:bg-forest-950">
      <div className="bg-white dark:bg-forest-900 border-b border-forest-200/60 dark:border-forest-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-[13px]">
          <Link href="/" className="text-forest-500 hover:text-forest-900 dark:hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft size={13} /> Home
          </Link>
          <span className="text-forest-300">/</span>
          <Link href="/#catalog" className="text-forest-500 hover:text-forest-900 dark:hover:text-white transition-colors">Catalog</Link>
          <span className="text-forest-300">/</span>
          <span className="text-forest-900 dark:text-forest-100 font-medium truncate">{tree.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Image */}
          <div className="lg:col-span-2 bg-white dark:bg-forest-900 rounded-3xl border border-forest-200/60 dark:border-forest-800 p-8 flex items-center justify-center min-h-[280px]" style={{ background: `linear-gradient(135deg, ${tree.color}12, ${tree.color}06)` }}>
            <TreeIllustration svg={tree.svg || ''} imagePath={tree.imagePath} alt={tree.name} className="w-full max-w-[200px]" />
          </div>

          {/* Info */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300">
                {tree.category}
              </span>
              <h1 className="text-[2.2rem] font-black tracking-tight text-forest-950 dark:text-forest-50 leading-tight">{tree.name}</h1>
              {tree.latin && <p className="text-[15px] text-forest-500 italic mt-1">{tree.latin}</p>}
              <p className="text-forest-700 dark:text-forest-300 text-[14px] mt-3 leading-relaxed">{tree.description}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: locale === 'lt' ? 'Kaina' : locale === 'ru' ? 'Цена' : 'Price', value: formatPrice(tree.price) },
                { label: locale === 'lt' ? 'Aukštis' : locale === 'ru' ? 'Высота' : 'Height', value: tree.height },
                { label: locale === 'lt' ? 'Dydis' : locale === 'ru' ? 'Размер' : 'Size', value: tree.size },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800 px-4 py-3 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-forest-500 dark:text-forest-400 mb-1">{s.label}</div>
                  <div className="text-[16px] font-bold text-forest-950 dark:text-forest-50">{s.value}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setQuoteOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[15px] font-bold hover:scale-[1.01] active:scale-[0.99] transition-transform">
              <MessageSquare size={17} />
              {locale === 'lt' ? 'Prašyti pasiūlymo' : locale === 'ru' ? 'Запросить цену' : 'Request a Quote'}
            </button>
          </div>
        </motion.div>

        {/* Care guide */}
        <div className="mt-10 bg-white dark:bg-forest-900 rounded-3xl border border-forest-200/60 dark:border-forest-800 p-6 sm:p-8">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-forest-500 dark:text-forest-400 mb-6">
            {locale === 'lt' ? 'Priežiūros gidas' : locale === 'ru' ? 'Руководство по уходу' : 'Care Guide'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {careKeys.map(key => tree.care[key] ? (
              <div key={key} className="flex gap-3 items-start">
                <div className="w-8 h-8 flex-shrink-0 rounded-xl bg-forest-100 dark:bg-forest-800 flex items-center justify-center text-forest-600 dark:text-forest-300">
                  {careIcons[key]}
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-0.5">{key}</div>
                  <div className="text-[13.5px] text-forest-800 dark:text-forest-200">{tree.care[key]}</div>
                </div>
              </div>
            ) : null)}
          </div>
        </div>
      </div>

      <QuoteModal tree={quoteOpen ? tree : null} onClose={() => setQuoteOpen(false)} />
    </div>
  );
}

export default function TreePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <I18nProvider>
      <TreePageInner slug={slug} />
    </I18nProvider>
  );
}
