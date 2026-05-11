'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Shovel, Truck, Wrench, LeafyGreen, Clock, ArrowRight } from 'lucide-react';
import { Particles } from '@/components/ui/Particles';
import { useI18n } from '@/lib/i18nContext';

const ICONS = [Shovel, Truck, Wrench, LeafyGreen];

export function Services() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { tr } = useI18n();
  const s = (tr as any).services;

  const SERVICES = [
    { icon: ICONS[0], title: s.card1Title, description: s.card1Desc },
    { icon: ICONS[1], title: s.card2Title, description: s.card2Desc },
    { icon: ICONS[2], title: s.card3Title, description: s.card3Desc },
    { icon: ICONS[3], title: s.card4Title, description: s.card4Desc },
  ];

  return (
    <section ref={ref} id="services" className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden bg-forest-50 dark:bg-forest-950">
      <Particles density={18} type="pollen" />

      {/* Dot-grid texture — dark mode only */}
      <div className="absolute inset-0 opacity-0 dark:opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Light mode subtle texture */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(30,60,32,0.6) 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 opacity-5 dark:opacity-10"
        style={{ background: 'radial-gradient(ellipse, #10b981 0%, transparent 70%)' }} />

      {/* Floating bokeh orbs */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        {([
          { s: 220, l: '8%',  t: '18%', c: 'rgba(16,185,129,0.07)',  d: '0s',   dur: '20s' },
          { s: 150, l: '72%', t: '12%', c: 'rgba(214,195,153,0.09)', d: '-7s',  dur: '25s' },
          { s: 190, l: '50%', t: '60%', c: 'rgba(16,185,129,0.06)',  d: '-12s', dur: '22s' },
          { s: 130, l: '20%', t: '72%', c: 'rgba(106,170,78,0.08)',  d: '-4s',  dur: '28s' },
          { s: 170, l: '85%', t: '50%', c: 'rgba(214,195,153,0.07)', d: '-16s', dur: '18s' },
          { s: 110, l: '38%', t: '28%', c: 'rgba(16,185,129,0.05)',  d: '-9s',  dur: '30s' },
        ] as const).map((o, i) => (
          <div key={i} className="bokeh-float absolute rounded-full"
            style={{
              width: o.s, height: o.s,
              left: o.l, top: o.t,
              background: `radial-gradient(circle, ${o.c}, transparent 70%)`,
              filter: 'blur(28px)',
              animationDelay: o.d,
              animationDuration: o.dur,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 border border-forest-200 dark:bg-white/10 dark:border-white/10 mb-5">
            <Clock size={11} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-medium tracking-widest uppercase text-emerald-600 dark:text-emerald-400">{s.soonBadge}</span>
          </div>
          <h2 className="text-headline text-[clamp(2rem,5vw,3.5rem)] text-forest-950 dark:text-white mb-4 leading-tight">
            <span className="relative inline-block">
              {s.title1}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent"
                style={{ transformOrigin: 'left' }}
              />
            </span>
            <br />{s.title2}
          </h2>
          <p className="text-[15px] text-forest-600 dark:text-white/60 leading-relaxed">{s.subtitle}</p>
        </motion.div>

        {/* Service cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <motion.div
                key={svc.title}
                initial={{ opacity: 0, y: 32 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="service-spotlight relative group rounded-2xl bg-white shadow-sm border border-forest-200 dark:bg-white/5 dark:border-white/[0.08] p-6 overflow-hidden hover:bg-forest-50 dark:hover:bg-white/[0.09] hover:border-emerald-500/40 dark:hover:border-emerald-500/25 transition-all duration-500"
                onMouseMove={e => {
                  const r = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--sx', `${e.clientX - r.left}px`);
                  e.currentTarget.style.setProperty('--sy', `${e.clientY - r.top}px`);
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.removeProperty('--sx');
                  e.currentTarget.style.removeProperty('--sy');
                }}
              >
                {/* Pulsing emerald halo */}
                <div className="service-halo" aria-hidden />

                {/* Soon badge */}
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-forest-100 dark:bg-white/10 text-[9px] font-semibold tracking-wider uppercase text-forest-400 dark:text-white/50">
                  {s.soonBadge}
                </div>

                <div className="relative z-[1] w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/25 group-hover:border-emerald-300 dark:group-hover:border-emerald-500/40 transition-all duration-500">
                  <Icon size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>

                <h3 className="relative z-[1] text-[15px] font-bold text-forest-950 dark:text-white mb-2">{svc.title}</h3>
                <p className="relative z-[1] text-[13px] text-forest-500 dark:text-white/50 leading-relaxed">{svc.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 text-center"
        >
          <p className="text-[13px] text-forest-400 dark:text-white/40 mb-4">{s.ctaNote}</p>
          <a
            href="mailto:info@planthouse.lt?subject=Services"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white text-[13px] font-semibold hover:bg-emerald-400 active:scale-95 transition-all"
          >
            {s.ctaButton}
            <ArrowRight size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
