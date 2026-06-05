'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Trees, TreePine, Sprout, Flower, Flower2, Wind, Rows4, Sun, Wheat } from 'lucide-react';
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
      className="relative min-h-[100svh] flex items-start justify-center overflow-hidden bg-gradient-to-b from-[#e8f0e8] via-[#f0f4f0] to-[#e3ede3] dark:from-[#0c160e] dark:via-[#101f12] dark:to-[#0c160e]"
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


      {/* Category selection cards — prominent, with picture areas */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-20 left-0 right-0 z-[25] px-4 overflow-x-auto scrollbar-none"
      >
        <div className="flex gap-3 min-w-max mx-auto w-fit pb-1">
          {([
            { key: 'trees',     icon: Trees,    label: (tr.hero as any).cat1,          bg: 'bg-forest-900/80',   ic: 'text-forest-300',  border: 'border-forest-500/50'  },
            { key: 'shrubs',    icon: Sprout,   label: (tr as any).catalog.shrubs,     bg: 'bg-teal-900/80',     ic: 'text-teal-300',    border: 'border-teal-500/50'    },
            { key: 'perennial', icon: Flower,   label: (tr as any).catalog.perennial,  bg: 'bg-pink-950/80',     ic: 'text-pink-300',    border: 'border-pink-500/50'    },
            { key: 'annual',    icon: Flower2,  label: (tr as any).catalog.annual,     bg: 'bg-amber-950/80',    ic: 'text-amber-300',   border: 'border-amber-500/50'   },
            { key: 'conifer',   icon: TreePine, label: (tr.hero as any).cat2,          bg: 'bg-emerald-950/80',  ic: 'text-emerald-300', border: 'border-emerald-500/50' },
            { key: 'climbing',  icon: Wind,     label: (tr as any).catalog.climbing,   bg: 'bg-violet-950/80',   ic: 'text-violet-300',  border: 'border-violet-500/50'  },
            { key: 'hedge',     icon: Rows4,    label: (tr as any).catalog.hedge,      bg: 'bg-lime-950/80',     ic: 'text-lime-300',    border: 'border-lime-500/50'    },
            { key: 'potted',    icon: Sun,      label: (tr.hero as any).cat3,          bg: 'bg-orange-950/80',   ic: 'text-orange-300',  border: 'border-orange-500/50'  },
            { key: 'grass',     icon: Wheat,    label: (tr as any).catalog.grass,      bg: 'bg-yellow-950/80',   ic: 'text-yellow-300',  border: 'border-yellow-500/50'  },
          ] as { key: string; icon: React.ElementType; label: string; bg: string; ic: string; border: string }[]).map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('heroCatSelect', { detail: item.key }));
                  setTimeout(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }), 80);
                }}
                className={`group flex flex-col items-center rounded-2xl backdrop-blur-md border border-white/10 hover:border-white/25 hover:scale-[1.06] active:scale-[0.97] transition-all duration-200 cursor-pointer overflow-hidden ${item.bg} min-w-[130px] shadow-md hover:shadow-xl`}
              >
                {/* Picture area — full bleed, fades into card bg at bottom */}
                <div className="relative w-full h-[120px] overflow-hidden flex-shrink-0">
                  {/* Placeholder icon shown when no image */}
                  <div className={`absolute inset-0 flex items-center justify-center ${item.ic} opacity-15`}>
                    <Icon size={56} />
                  </div>
                  {/* Image fills the area, object-cover, bottom-fade into card color */}
                  <img
                    src={`/categories/${item.key}.jpg`}
                    alt={item.label}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  {/* Gradient fade at bottom blending image into card background */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, transparent, var(--card-fade, rgba(0,0,0,0.7)))' }}
                  />
                  {/* Subtle left+right edge vignette */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.18) 100%)' }}
                  />
                </div>
                {/* Icon + label */}
                <div className="flex flex-col items-center gap-1.5 px-3 pt-2 pb-4">
                  <div className={`w-6 h-6 flex items-center justify-center ${item.ic}`}>
                    <Icon size={15} />
                  </div>
                  <span className="text-[11px] font-semibold text-white/90 text-center leading-normal pb-0.5">{item.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Content — top-left, smaller title */}
      <div className="relative z-10 w-full px-5 sm:px-10 pt-[max(7rem,16svh)] max-w-5xl">
        <h1 className="hero-title-depth text-[clamp(1.9rem,4.8vw,4.2rem)] font-bold tracking-[-0.03em] leading-[1.05] text-forest-950 dark:text-forest-50 mb-4 max-w-2xl">
          {words.map((word, i) => (
            <motion.span key={i}
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
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
