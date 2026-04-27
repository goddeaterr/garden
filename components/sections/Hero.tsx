'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import { Particles } from '@/components/ui/Particles';

export function Hero() {
  const { tr } = useI18n();
  const words = tr.hero.headline as unknown as string[];

  return (
    <section id="hero" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#e8f0e8] via-[#f0f4f0] to-[#e3ede3] dark:from-[#0c160e] dark:via-[#101f12] dark:to-[#0c160e]">

      {/* Soft blobs — CSS only, no scroll transforms */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-[20%] -left-[15%] w-[75vw] h-[75vw] rounded-full opacity-40"
          style={{ background: 'radial-gradient(ellipse, rgba(113,158,114,0.5) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute -bottom-[20%] -right-[15%] w-[65vw] h-[65vw] rounded-full opacity-35"
          style={{ background: 'radial-gradient(ellipse, rgba(214,195,153,0.5) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div className="absolute top-[30%] left-[30%] w-[50vw] h-[50vw] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(50,83,54,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* Particles */}
      <Particles density={40} type="mixed" />

      {/* Background tree silhouettes — static, no parallax */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" aria-hidden>
        <svg viewBox="0 0 1440 400" className="w-full" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="t1" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="rgba(50,83,54,0.12)" />
              <stop offset="100%" stopColor="rgba(30,52,33,0.35)" />
            </linearGradient>
            <linearGradient id="t2" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="rgba(60,103,65,0.18)" />
              <stop offset="100%" stopColor="rgba(22,40,24,0.55)" />
            </linearGradient>
          </defs>
          {[150,420,700,950,1220].map((cx,i) => {
            const r = 90+(i%3)*28;
            return <g key={i}>
              <ellipse cx={cx} cy={400-r} rx={r*1.2} ry={r} fill="url(#t1)" />
              <rect x={cx-10} y={400-r*0.18} width={20} height={r*0.22} fill="url(#t1)" />
            </g>;
          })}
          {[80,290,510,730,960,1160,1380].map((cx,i) => {
            const h=180+(i%3)*50; const w=30+(i%3)*10;
            return <path key={`p${i}`} fill="url(#t2)"
              d={`M${cx} 400 L${cx} ${400-h*0.28} L${cx-w*2} ${400-h*0.6} L${cx-w*1.4} ${400-h*0.6} L${cx-w*2.2} ${400-h*0.82} L${cx-w*1.4} ${400-h*0.82} L${cx-w*1.7} ${400-h} L${cx} ${400-h-18} L${cx+w*1.7} ${400-h} L${cx+w*1.4} ${400-h*0.82} L${cx+w*2.2} ${400-h*0.82} L${cx+w*1.4} ${400-h*0.6} L${cx+w*2} ${400-h*0.6} Z`} />;
          })}
          <ellipse cx={720} cy={400} rx={900} ry={100} fill="rgba(30,50,32,0.2)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-5 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.7)' }}
        >
          <Sparkles size={14} className="text-forest-700 dark:text-forest-300" />
          <span className="text-xs font-medium tracking-wide text-forest-800 dark:text-forest-200">{tr.hero.badge}</span>
        </motion.div>

        <h1 className="text-[clamp(2.6rem,8.5vw,8rem)] font-bold tracking-[-0.04em] leading-[0.95] text-forest-950 dark:text-forest-50 mb-6">
          {words.map((word, i) => (
            <motion.span key={i}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block mr-[0.22em]"
            >
              {i === words.length - 1 ? (
                <span className="bg-gradient-to-br from-forest-700 via-moss-600 to-forest-900 dark:from-moss-300 dark:via-forest-200 dark:to-moss-400 bg-clip-text text-transparent italic font-light">
                  {word}
                </span>
              ) : word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(0.95rem,2vw,1.25rem)] text-forest-700 dark:text-forest-200 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {tr.hero.sub}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <a href="#catalog" className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-semibold bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 hover:scale-[1.02] active:scale-[0.98] transition-transform">
            {tr.hero.cta1}
            <ArrowUpRight size={16} className="group-hover:rotate-45 transition-transform duration-500" />
          </a>
          <a href="#builder" className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-medium bg-white/60 dark:bg-forest-900/60 border border-white/70 dark:border-forest-700/50 text-forest-900 dark:text-forest-50 hover:scale-[1.02] active:scale-[0.98] transition-transform">
            {tr.hero.cta2}
            <span className="text-forest-500 dark:text-forest-400 text-xs font-mono ml-1">{tr.hero.cta2badge}</span>
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-forest-700 dark:text-forest-300 pointer-events-none"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase">{tr.hero.scroll}</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-10 bg-gradient-to-b from-current to-transparent" />
      </motion.div>
    </section>
  );
}
