'use client';

import { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Canvas } from './Canvas';
import { ControlsPanel } from './ControlsPanel';
import { BuilderLeftPanel } from './BuilderLeftPanel';
import { BuilderRightPanel } from './BuilderRightPanel';
import { MobileBuilderOverlay } from './MobileBuilderOverlay';
import { ExitIntentModal } from './ExitIntentModal';
import { useGarden } from './GardenContext';
import { useI18n } from '@/lib/i18nContext';
import { Maximize2, Trees, Layers } from 'lucide-react';
import { formatPrice } from '@/lib/utils';


export function Builder() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });
  const { placed, total, showCheckout } = useGarden();
  const { tr } = useI18n();
  const b = tr.builder;
  const s = tr.summary;
  const STEPS = [
    { n: '1', label: b.stepUpload },
    { n: '2', label: b.stepAdd },
    { n: '3', label: b.stepPrice },
    { n: '4', label: b.stepBuy },
  ];
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (showCheckout) setMobileOpen(false);
  }, [showCheckout]);

  return (
    <section ref={sectionRef} id="builder" className="relative bg-white dark:bg-forest-950">

      {/* ── MOBILE: teaser + CTA ── */}
      <div className="sm:hidden px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 mb-4">
            <Layers size={11} className="text-emerald-600" />
            <span className="text-[10px] font-bold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">{b.mobileTeaser}</span>
          </div>

          <h2 className="text-[2rem] font-black tracking-tight text-forest-950 dark:text-forest-50 leading-tight mb-3">
            {b.mobileTeaserTitle}
          </h2>
          <p className="text-[14px] text-forest-600 dark:text-forest-400 mb-6 leading-relaxed">
            {b.mobileTeaserSub}
          </p>

          {/* Preview card */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl mb-5 bg-forest-900" style={{ height: 200 }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                <Trees size={28} className="text-white" />
              </div>
              <p className="text-white/90 text-[13px] font-bold mb-1">
                {placed.length > 0
                  ? `${placed.length} · ${formatPrice(total)}`
                  : b.mobileTeaserPreviewEmpty}
              </p>
              <p className="text-white/50 text-[11px]">{b.mobileTeaserPreviewHint}</p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 text-white text-[15px] font-bold shadow-lg shadow-emerald-900/20 active:scale-[0.99] transition-transform"
          >
            <Maximize2 size={18} />
            {b.openBuilderBtn}
          </button>
        </motion.div>
      </div>

      {/* Mobile fullscreen overlay */}
      <MobileBuilderOverlay open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* ── DESKTOP: 3-column builder ── */}
      <div className="hidden sm:block">
        {/* Section header */}
        <div className="px-6 pt-16 pb-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between gap-8"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 mb-3">
                <Layers size={11} className="text-emerald-600" />
                <span className="text-[10px] font-bold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">{b.mobileTeaser}</span>
              </div>
              <h2 className="text-headline text-[clamp(2rem,4vw,3rem)] text-forest-950 dark:text-forest-50">
                {b.mobileTeaserTitle}
              </h2>
            </div>
            {/* Journey steps */}
            <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
              {STEPS.map((s, i) => (
                <div key={s.n} className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-forest-50 dark:bg-forest-900 border border-forest-200/60 dark:border-forest-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{s.n}</span>
                    <span className="text-[11px] font-medium text-forest-700 dark:text-forest-300 whitespace-nowrap">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <span className="text-forest-300 dark:text-forest-700 text-[10px]">→</span>}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── 3-column builder shell ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="px-4 pb-12 max-w-[1600px] mx-auto"
        >
          {/* Brand strip */}
          <div className="flex items-center justify-between px-4 py-2.5 mb-0 rounded-t-2xl bg-forest-950 dark:bg-forest-900 border border-b-0 border-forest-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Trees size={13} className="text-white" />
              </div>
              <span className="text-[12px] font-bold tracking-tight text-white">MB Plant House</span>
              <span className="hidden sm:inline text-[10px] text-forest-400">· {b.brandSub}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-forest-400 tabular-nums hidden md:block">
                {placed.length > 0 ? `${placed.length} ${placed.length === 1 ? s.tree : s.trees} · ${formatPrice(total)}` : b.brandEmpty}
              </span>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>
          </div>

          <div
            className="grid rounded-b-2xl overflow-hidden shadow-2xl shadow-forest-900/15 ring-1 ring-forest-900/8 dark:ring-forest-50/5"
            style={{
              gridTemplateColumns: '280px 1fr 300px',
              height: 'min(85vh, 900px)',
              minHeight: 600,
            }}
          >
            {/* LEFT: catalog + filters */}
            <BuilderLeftPanel />

            {/* CENTER: canvas */}
            <div className="relative flex flex-col overflow-hidden bg-forest-100/30 dark:bg-forest-900/30">
              {/* Canvas fills the column; ControlsPanel overlays it absolutely */}
              <div className="flex-1 relative" style={{ minHeight: 0 }}>
                <Canvas />
                {/* z-[200] overlay — pointer-events-none so clicks pass through to canvas */}
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 200 }}>
                  <ControlsPanel />
                </div>
              </div>
            </div>

            {/* RIGHT: commercial panel */}
            <BuilderRightPanel />
          </div>
        </motion.div>
      </div>

      {/* Exit intent modal (desktop) */}
      <ExitIntentModal />
    </section>
  );
}
