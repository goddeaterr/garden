'use client';

import { motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useState } from 'react';
import { useI18n } from '@/lib/i18nContext';
import { Sprout, Compass, type LucideIcon } from 'lucide-react';
import { Particles } from '@/components/ui/Particles';

function FeatureCard({
  icon: Icon, title, body, delay, inView,
}: { icon: LucideIcon; title: string; body: string; delay: number; inView: boolean }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useTransform(my, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mx, [-0.5, 0.5], [-5, 5]);
  const [burst, setBurst] = useState(false);
  const triggerBurst = () => {
    setBurst(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBurst(true));
    });
    setTimeout(() => setBurst(false), 700);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      whileHover={{ scale: 1.015 }}
      className="feature-tile group relative p-8 rounded-2xl bg-white/70 dark:bg-forest-900/50 backdrop-blur-xl border border-forest-200/50 dark:border-forest-800/50 hover:border-forest-300 dark:hover:border-forest-700 transition-colors cursor-default"
    >
      <div
        className="feature-icon relative w-11 h-11 rounded-2xl bg-forest-100 dark:bg-forest-800 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500"
        onMouseEnter={triggerBurst}
      >
        <Icon size={20} className="text-forest-700 dark:text-forest-200" />
        {burst && [0,1,2,3,4,5,6,7].map(i => (
          <span
            key={i}
            className="burst-leaf absolute left-1/2 top-1/2 pointer-events-none"
            style={{ '--ba': `${i * 45}deg`, '--bd': `${26 + (i % 3) * 9}px` } as React.CSSProperties}
          />
        ))}
      </div>
      <h3 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3 tracking-tight">{title}</h3>
      <p className="text-[15px] leading-relaxed text-forest-700 dark:text-forest-300">{body}</p>
    </motion.div>
  );
}

export function About() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { tr } = useI18n();
  const a = tr.about;

  return (
    <section ref={ref} id="about" className="botanical-section-texture relative py-32 px-6 bg-forest-50 dark:bg-forest-950 overflow-hidden">
      <Particles density={22} type="leaves" />

      {/* Botanical SVG watermark — large rotating fern ornament */}
      <div className="absolute -right-24 sm:-right-8 top-1/2 -translate-y-1/2 opacity-[0.045] dark:opacity-[0.055] pointer-events-none select-none" aria-hidden>
        <svg
          className="w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] text-forest-600 dark:text-forest-400"
          style={{ animation: 'spin-slow 90s linear infinite' }}
          viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer ring of leaf pairs, 8 directions */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const cos = Math.cos(angle), sin = Math.sin(angle);
            return (
              <g key={i} transform={`rotate(${i * 45} 200 200)`}>
                {/* Main frond stem */}
                <path d="M200,200 Q200,130 200,60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                {/* Leaflets branching off stem */}
                {[70,95,120,145,168].map((y, j) => {
                  const spread = 18 + j * 6;
                  return (
                    <g key={j}>
                      <path d={`M200,${y} Q${200 - spread},${y - 8} ${200 - spread * 1.4},${y - 22}`} stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                      <path d={`M200,${y} Q${200 + spread},${y - 8} ${200 + spread * 1.4},${y - 22}`} stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </g>
                  );
                })}
              </g>
            );
          })}
          {/* Centre circle ornament */}
          <circle cx="200" cy="200" r="18" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="200" cy="200" r="8" fill="currentColor" opacity="0.5"/>
          <circle cx="200" cy="200" r="34" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 4"/>
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[11px] tracking-[0.3em] uppercase text-forest-600 dark:text-forest-400 mb-6"
        >
          {a.eyebrow}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-headline text-[clamp(2.25rem,5vw,4.5rem)] text-forest-950 dark:text-forest-50 max-w-4xl mb-20"
        >
          {a.headline1}{' '}
          <span className="relative inline-block">
            <span className="text-forest-600 dark:text-forest-400">{a.headline2}</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -bottom-1 left-0 h-[2.5px] w-full rounded-full bg-gradient-to-r from-forest-600 via-emerald-500 to-transparent"
              style={{ transformOrigin: 'left' }}
            />
          </span>
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          <FeatureCard icon={Sprout}  title={a.card1Title} body={a.card1Body} delay={0.2}  inView={inView} />
          <FeatureCard icon={Compass} title={a.card2Title} body={a.card2Body} delay={0.32} inView={inView} />
        </div>

      </div>
    </section>
  );
}
