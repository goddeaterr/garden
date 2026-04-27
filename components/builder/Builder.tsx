'use client';

import { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Canvas } from './Canvas';
import { TreePalette } from './TreePalette';
import { GardenSummary } from './GardenSummary';
import { ControlsPanel } from './ControlsPanel';
import { MobileBuilderOverlay } from './MobileBuilderOverlay';
import { useGarden } from './GardenContext';
import { useI18n } from '@/lib/i18nContext';
import { Sparkles, Maximize2, Trees } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export function Builder() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { canvasRef, placed, total, showCheckout } = useGarden();
  const { tr, locale } = useI18n();
  const b = tr.builder;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close mobile builder when checkout modal opens
  useEffect(() => {
    if (showCheckout) setMobileOpen(false);
  }, [showCheckout]);

  return (
    <section ref={ref} id="builder" className="relative bg-forest-50 dark:bg-forest-950">

      {/* ── MOBILE: teaser card + open button ── */}
      <div className="sm:hidden px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
            <Sparkles size={11} className="text-forest-700 dark:text-forest-300" />
            <span className="text-[10px] font-medium tracking-wide text-forest-800 dark:text-forest-200 uppercase">{b.mobileBadge}</span>
          </div>
          <h2 className="text-[2rem] font-bold tracking-tight text-forest-950 dark:text-forest-50 leading-tight mb-3">
            {b.mobileTitle.split('\n')[0]}<br />{b.mobileTitle.split('\n')[1]}
          </h2>
          <p className="text-[14px] text-forest-600 dark:text-forest-400 leading-relaxed mb-6">{b.sub}</p>

          {/* Preview card */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-forest-900/5 dark:ring-forest-50/5 mb-5" style={{ height: 220 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-forest-800 via-forest-700 to-moss-600" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                <Trees size={32} className="text-white" />
              </div>
              <p className="text-white/90 text-[13px] font-medium mb-1">
                {placed.length > 0
                  ? `${placed.length} ${placed.length === 1 ? tr.summary.tree : tr.summary.trees} · ${formatPrice(total)}`
                  : (locale === 'lt' ? 'Sukurkite savo sodą' : locale === 'ru' ? 'Создайте свой сад' : 'Design your garden')}
              </p>
              <p className="text-white/60 text-[11px]">
                {locale === 'lt' ? 'Pridėkite medžių, išsaugokite PDF' : locale === 'ru' ? 'Добавьте деревья, сохраните PDF' : 'Add trees, export PDF plan'}
              </p>
            </div>
            {/* Decorative floating tree icons */}
            {['🌳','🌲','🍎'].map((e, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0], rotate: [0, 3, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 1.2 }}
                className="absolute text-4xl pointer-events-none"
                style={{ left: `${20 + i * 28}%`, bottom: `${20 + (i % 2) * 15}%` }}
              >
                {e}
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[16px] font-bold shadow-lg shadow-forest-900/20 hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            <Maximize2 size={20} />
            {locale === 'lt' ? 'Atidaryti sodo kūrėją' : locale === 'ru' ? 'Открыть конструктор' : 'Open Garden Builder'}
          </button>
        </motion.div>
      </div>

      {/* Mobile fullscreen overlay */}
      <MobileBuilderOverlay open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* ── DESKTOP layout ── */}
      <div className="hidden sm:block py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5">
              <Sparkles size={12} className="text-forest-700 dark:text-forest-300" />
              <span className="text-[11px] font-medium tracking-wide text-forest-800 dark:text-forest-200 uppercase">{b.badge}</span>
            </div>
            <h2 className="text-headline text-[clamp(2.25rem,5vw,4rem)] text-forest-950 dark:text-forest-50 mb-4">{b.title}</h2>
            <p className="text-lg text-forest-700 dark:text-forest-300 leading-relaxed">{b.sub}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              ref={canvasRef}
              className="relative w-full h-[80vh] min-h-[600px] max-h-[900px] rounded-3xl overflow-hidden shadow-2xl shadow-forest-900/20 ring-1 ring-forest-900/5 dark:ring-forest-50/5"
            >
              <Canvas />
              <TreePalette />
              <GardenSummary />
              <ControlsPanel />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[12px] text-forest-600 dark:text-forest-400">
              {[[b.hint1kbd,b.hint1txt],[b.hint2kbd,b.hint2txt],['',b.hint3],['',b.hint4]].map(([kbd,txt],i) => (
                <div key={i} className="inline-flex items-center gap-1.5">
                  {kbd && <span className="px-1.5 py-0.5 rounded bg-forest-100 dark:bg-forest-800 font-mono text-[10px] text-forest-700 dark:text-forest-300">{kbd}</span>}
                  <span>{txt}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
