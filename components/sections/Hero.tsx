'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUpRight, Sparkles, Trees, TreePine, Sprout, Flower, Flower2, Wind, Rows4, Sun, Wheat } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import { Particles } from '@/components/ui/Particles';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function ScrambleWord({ word, className }: { word: string; className: string }) {
  const [display, setDisplay] = useState(word);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const runScramble = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const framesPerChar = 3;   // how many random frames before each char locks in
    const intervalMs   = 28;   // ms between frames → very snappy
    let frame = 0;
    let lastTime = 0;

    const tick = (now: number) => {
      if (now - lastTime < intervalMs) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastTime = now;

      const resolved = Math.floor(frame / framesPerChar);
      const out = word
        .split('')
        .map((ch, i) => {
          if (i < resolved)               return ch;          // locked in
          if (ch === '.' || ch === '!')   return ch;          // keep punctuation
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join('');

      setDisplay(out);
      frame++;

      if (frame <= word.replace(/[.! ]/g, '').length * framesPerChar) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(word);          // ensure final state is exact
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [word]);

  useEffect(() => {
    // First run shortly after the entrance animation settles (words blur-in at ~1.7s)
    const firstTimer = setTimeout(() => {
      runScramble();

      const loop = () => {
        // Random repeat every 10–40 seconds
        const delay = 10_000 + Math.random() * 30_000;
        timerRef.current = setTimeout(() => {
          runScramble();
          loop();
        }, delay);
      };
      loop();
    }, 3_200);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [runScramble]);

  return <span className={className}>{display}</span>;
}


export function Hero() {
  const { tr } = useI18n();
  const words = tr.hero.headline as unknown as string[];
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  return (
    <section
      id="hero"
      onMouseMove={handleMouseMove}
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#e8f0e8] via-[#f0f4f0] to-[#e3ede3] dark:from-[#0c160e] dark:via-[#101f12] dark:to-[#0c160e]"
    >

      {/* Photo background — placed first so it sits behind everything */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <img
          src="/hero-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Light mode: soft green tint at 45% so photo shows clearly */}
        <div className="absolute inset-0 dark:hidden"
          style={{ background: 'linear-gradient(to bottom, rgba(232,240,232,0.45), rgba(240,244,240,0.40), rgba(227,237,227,0.52))' }} />
        {/* Dark mode: deep forest tint at 55% */}
        <div className="absolute inset-0 hidden dark:block"
          style={{ background: 'linear-gradient(to bottom, rgba(12,22,14,0.55), rgba(16,31,18,0.50), rgba(12,22,14,0.62))' }} />
      </div>

      {/* Mouse spotlight */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[2] transition-all duration-700 ease-out"
        style={{ background: `radial-gradient(700px circle at ${mouse.x}% ${mouse.y}%, rgba(113,158,114,0.18), transparent 55%)` }}
      />

      {/* Soft blobs — CSS only, no scroll transforms */}
      <div className="absolute inset-0 hero-canopy" aria-hidden />
      <div className="absolute inset-0 hero-sun-rake" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-[36%] hero-meadow-haze" aria-hidden />

      {/* Particles */}
      <Particles density={64} type="mixed" />

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
          <g style={{
            transform: `translateX(${(mouse.x - 50) * -0.35}px)`,
            transition: 'transform 2.2s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* round trees */}
            {[150,420,700,950,1220].map((cx,i) => {
              const r = 90+(i%3)*28;
              const dur = 7 + i * 1.9;
              return (
                <g key={i} style={{
                  animation: `tree-sway ${dur}s ease-in-out ${i * 0.7}s infinite ${i % 2 ? 'reverse' : 'normal'}`,
                  transformBox: 'fill-box', transformOrigin: 'bottom center',
                }}>
                  <ellipse cx={cx} cy={400-r} rx={r*1.2} ry={r} fill="url(#t1)" />
                  <rect x={cx-10} y={400-r*0.18} width={20} height={r*0.22} fill="url(#t1)" />
                </g>
              );
            })}
          </g>
          <g style={{
            transform: `translateX(${(mouse.x - 50) * 0.55}px)`,
            transition: 'transform 1.6s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* pine trees + ground ellipse */}
            {[80,290,510,730,960,1160,1380].map((cx,i) => {
              const h=180+(i%3)*50; const w=30+(i%3)*10;
              const dur = 9 + i * 1.4;
              return <path key={`p${i}`} fill="url(#t2)"
                style={{
                  animation: `tree-sway ${dur}s ease-in-out ${i * 0.5}s infinite ${i % 2 ? 'normal' : 'reverse'}`,
                  transformBox: 'fill-box', transformOrigin: 'bottom center',
                }}
                d={`M${cx} 400 L${cx} ${400-h*0.28} L${cx-w*2} ${400-h*0.6} L${cx-w*1.4} ${400-h*0.6} L${cx-w*2.2} ${400-h*0.82} L${cx-w*1.4} ${400-h*0.82} L${cx-w*1.7} ${400-h} L${cx} ${400-h-18} L${cx+w*1.7} ${400-h} L${cx+w*1.4} ${400-h*0.82} L${cx+w*2.2} ${400-h*0.82} L${cx+w*1.4} ${400-h*0.6} L${cx+w*2} ${400-h*0.6} Z`} />;
            })}
            <ellipse cx={720} cy={400} rx={900} ry={100} fill="rgba(30,50,32,0.2)" />
          </g>
        </svg>
      </div>


      {/* All 9 category quick-links — horizontal strip above the wave */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-20 left-0 right-0 z-10 px-4 overflow-x-auto scrollbar-none"
      >
        <div className="flex gap-2 min-w-max mx-auto w-fit">
          {([
            { href: '#catalog', icon: Trees,    label: (tr.hero as any).cat1,  bg: 'bg-forest-100/80 dark:bg-forest-800/70', ic: 'text-forest-700 dark:text-forest-300' },
            { href: '#catalog', icon: Sprout,   label: (tr as any).catalog.shrubs,    bg: 'bg-teal-100/80   dark:bg-teal-900/50',   ic: 'text-teal-700   dark:text-teal-300'   },
            { href: '#catalog', icon: Flower,   label: (tr as any).catalog.perennial, bg: 'bg-pink-100/80   dark:bg-pink-900/50',   ic: 'text-pink-600   dark:text-pink-300'   },
            { href: '#catalog', icon: Flower2,  label: (tr as any).catalog.annual,    bg: 'bg-amber-100/80  dark:bg-amber-900/50',  ic: 'text-amber-700  dark:text-amber-300'  },
            { href: '#catalog', icon: TreePine, label: (tr.hero as any).cat2,  bg: 'bg-emerald-100/80 dark:bg-emerald-900/50', ic: 'text-emerald-700 dark:text-emerald-300' },
            { href: '#catalog', icon: Wind,     label: (tr as any).catalog.climbing,  bg: 'bg-violet-100/80 dark:bg-violet-900/50', ic: 'text-violet-600 dark:text-violet-300' },
            { href: '#catalog', icon: Rows4,    label: (tr as any).catalog.hedge,     bg: 'bg-lime-100/80   dark:bg-lime-900/50',   ic: 'text-lime-700   dark:text-lime-300'   },
            { href: '#catalog', icon: Sun,      label: (tr.hero as any).cat3,  bg: 'bg-orange-100/80 dark:bg-orange-900/50', ic: 'text-orange-600 dark:text-orange-300' },
            { href: '#catalog', icon: Wheat,    label: (tr as any).catalog.grass,     bg: 'bg-yellow-100/80 dark:bg-yellow-900/50', ic: 'text-yellow-700 dark:text-yellow-300' },
          ] as { href: string; icon: React.ElementType; label: string; bg: string; ic: string }[]).map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.a
                key={i} href={item.href}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl backdrop-blur-md border border-white/50 dark:border-forest-700/40 hover:scale-[1.06] active:scale-[0.97] transition-transform cursor-pointer min-w-[76px] ${item.bg}`}
              >
                <div className={`w-7 h-7 flex items-center justify-center ${item.ic}`}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-semibold text-forest-900 dark:text-forest-50 text-center leading-tight">{item.label}</span>
              </motion.a>
            );
          })}
        </div>
      </motion.div>

      {/* Content — centered as before */}
      <div className="relative z-10 text-center px-5 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative inline-flex items-center justify-center mb-8"
        >
          <div
            className="hero-badge-shine relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.7)' }}
          >
            <Sparkles size={14} className="text-forest-700 dark:text-forest-300" />
            <span className="text-xs font-medium tracking-wide text-forest-800 dark:text-forest-200">{tr.hero.badge}</span>
          </div>
        </motion.div>

        <h1 className="hero-title-depth text-[clamp(2.6rem,8.5vw,8rem)] font-bold tracking-[-0.04em] leading-[0.95] text-forest-950 dark:text-forest-50 mb-6">
          {words.map((word, i) => (
            <motion.span key={i}
              initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.0, delay: 0.4 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block mr-[0.22em]"
            >
              {i === words.length - 1 ? (
                <ScrambleWord
                  word={word}
                  className="hero-word-drift bg-gradient-to-br from-forest-700 via-moss-600 to-forest-900 dark:from-moss-300 dark:via-forest-200 dark:to-moss-400 bg-clip-text text-transparent italic font-light"
                />
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
          <div className="relative group/cta">
            <span className="cta-glow-ring absolute -inset-[3px] rounded-full opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500" aria-hidden />
            <a href="#catalog" className="relative magnetic-button group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-semibold bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 hover:scale-[1.02] active:scale-[0.98] transition-transform">
              {tr.hero.cta1}
              <ArrowUpRight size={16} className="group-hover:rotate-45 transition-transform duration-500" />
            </a>
          </div>
          <a href="#about" className="magnetic-button group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-medium bg-white/60 dark:bg-forest-900/60 border border-white/70 dark:border-forest-700/50 text-forest-900 dark:text-forest-50 hover:scale-[1.02] active:scale-[0.98] transition-transform">
            {tr.hero.cta2}
          </a>
        </motion.div>


      </div>

      {/* Animated wave divider — slides infinitely into next section */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-20 overflow-hidden" aria-hidden>
        <svg
          viewBox="0 0 2880 80"
          className="wave-slide block"
          style={{ width: '200%', minWidth: '200%' }}
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,50 C180,80 360,18 540,48 C720,78 900,16 1080,46 C1220,68 1350,38 1440,52 C1620,80 1800,18 1980,48 C2160,78 2340,16 2520,46 C2660,68 2790,38 2880,52 L2880,80 L0,80 Z"
            style={{ fill: 'rgb(var(--bg))' }}
          />
        </svg>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-forest-700 dark:text-forest-300 pointer-events-none"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase opacity-70">{tr.hero.scroll}</span>
        <div className="w-6 h-9 rounded-full border border-current/40 flex items-start justify-center pt-1.5 mt-0.5">
          <motion.div
            animate={{ y: [0, 13, 0], opacity: [0.9, 0.2, 0.9] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-0.5 h-2 rounded-full bg-current"
          />
        </div>
      </motion.div>
    </section>
  );
}
