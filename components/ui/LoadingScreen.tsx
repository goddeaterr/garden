'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BRAND = 'MB PLANT HOUSE'.split('');

const SPARKLES = [
  { angle: -80,  dist: 30 }, { angle: -30,  dist: 26 },
  { angle:  18,  dist: 32 }, { angle:  68,  dist: 28 },
  { angle: -130, dist: 24 }, { angle:  118, dist: 27 },
  { angle:  170, dist: 22 }, { angle: -168, dist: 29 },
];

/** Counts up from 0 → target over ~duration seconds using easeInOut */
function useCounter(target: number, duration: number) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setVal(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

export function LoadingScreen({ visible }: { visible: boolean }) {
  const progress = useCounter(100, 1.35);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[500] flex items-center justify-center overflow-hidden select-none"
          style={{ background: 'rgb(7, 14, 9)' }}
        >
          {/* Slow-breathing ambient glow — shifts position gently */}
          <motion.div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              width: '140%', height: '140%',
              top: '-20%', left: '-20%',
              background: 'radial-gradient(ellipse 52% 44% at 52% 50%, rgba(38,102,48,0.38) 0%, transparent 65%)',
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Second, offset glow for depth */}
          <motion.div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              width: '90%', height: '80%',
              top: '10%', left: '5%',
              background: 'radial-gradient(ellipse 40% 35% at 60% 40%, rgba(20,80,30,0.22) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          />

          {/* Subtle dot-grid texture */}
          <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.016]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(200,218,201,1) 1px, transparent 0)',
              backgroundSize: '38px 38px',
            }}
          />

          {/* ── Centre stage ── */}
          <div className="relative flex flex-col items-center">

            {/* Orbit + tree container */}
            <div className="relative w-[148px] h-[148px] flex items-center justify-center mb-9">

              {/* Breathing glow behind tree */}
              <motion.div aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(60,140,72,0.50) 0%, transparent 62%)' }}
                animate={{ scale: [0.82, 1.22, 0.82], opacity: [0.35, 0.85, 0.35] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
              />

              {/* Outer orbit — slow clockwise */}
              <motion.svg aria-hidden className="absolute inset-0 w-full h-full" viewBox="0 0 148 148"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ opacity: { duration: 0.7, delay: 0.25 }, rotate: { duration: 30, repeat: Infinity, ease: 'linear' } }}
              >
                <circle cx="74" cy="74" r="70" stroke="rgba(100,170,108,0.16)" strokeWidth="1" fill="none" strokeDasharray="4 20" />
              </motion.svg>

              {/* Middle orbit — counter-clockwise, faster */}
              <motion.svg aria-hidden className="absolute inset-0 w-full h-full" viewBox="0 0 148 148"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: -360 }}
                transition={{ opacity: { duration: 0.7, delay: 0.4 }, rotate: { duration: 22, repeat: Infinity, ease: 'linear' } }}
              >
                <circle cx="74" cy="74" r="54" stroke="rgba(100,170,108,0.09)" strokeWidth="0.8" fill="none" strokeDasharray="2 13" />
              </motion.svg>

              {/* Arc that draws itself (progress arc) */}
              <motion.svg aria-hidden className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 148 148"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <motion.circle
                  cx="74" cy="74" r="44"
                  stroke="rgba(100,170,108,0.28)" strokeWidth="1.5"
                  fill="none" strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 0.82 }}
                  transition={{ duration: 1.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </motion.svg>

              {/* Sonar pulses — staggered */}
              {[0, 0.65, 1.3].map((delay, i) => (
                <motion.div key={i} aria-hidden
                  className="absolute inset-0 rounded-full border border-emerald-500/[0.12]"
                  initial={{ scale: 0.7, opacity: 0.5 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 3.2, delay: 0.85 + delay, repeat: Infinity, ease: 'easeOut' }}
                />
              ))}

              {/* ── Tree SVG — draws path-by-path ── */}
              <motion.svg
                width="58" height="74" viewBox="0 0 58 74"
                initial={{ opacity: 0, scale: 0.78, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Trunk */}
                <motion.path
                  d="M29 68 L29 36"
                  stroke="rgba(155,210,162,0.65)" strokeWidth="2.2" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.45, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Crown */}
                <motion.path
                  d="M29 36 Q14 23 14 12 Q14 2 29 2 Q44 2 44 12 Q44 23 29 36"
                  stroke="rgba(185,230,188,0.96)" strokeWidth="2.4" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 1.25, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Left branch */}
                <motion.path
                  d="M29 44 Q19 37 16 30"
                  stroke="rgba(155,210,162,0.52)" strokeWidth="1.6" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.42, delay: 1.12, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Right branch */}
                <motion.path
                  d="M29 52 Q39 45 42 38"
                  stroke="rgba(155,210,162,0.52)" strokeWidth="1.6" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.42, delay: 1.28, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Root left */}
                <motion.path
                  d="M29 68 Q20 72 14 70"
                  stroke="rgba(96,148,102,0.36)" strokeWidth="1.2" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.46, delay: 1.52, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Root right */}
                <motion.path
                  d="M29 68 Q38 72 44 70"
                  stroke="rgba(96,148,102,0.36)" strokeWidth="1.2" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.46, delay: 1.62, ease: [0.16, 1, 0.3, 1] }}
                />
              </motion.svg>

              {/* Sparkle burst — fires after crown finishes ~1.85s */}
              {SPARKLES.map((s, i) => {
                const rad = (s.angle * Math.PI) / 180;
                return (
                  <motion.span key={i} aria-hidden
                    className="absolute rounded-full bg-emerald-300"
                    style={{ width: 2.5, height: 2.5, top: '50%', left: '50%', marginTop: -24, marginLeft: -1.25 }}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{
                      x: Math.cos(rad) * s.dist,
                      y: Math.sin(rad) * s.dist,
                      opacity: [0, 0.95, 0],
                      scale: [0, 1.3, 0],
                    }}
                    transition={{ duration: 0.68, delay: 1.82 + i * 0.032, ease: 'easeOut' }}
                  />
                );
              })}

              {/* Tiny floating pollen dots */}
              {[
                { ox: -14, oy: 8,  delay: 0.9,  dur: 1.5 },
                { ox:  17, oy: 10, delay: 1.05, dur: 1.65 },
                { ox:  -6, oy: 15, delay: 1.2,  dur: 1.3 },
                { ox:  21, oy: 4,  delay: 0.95, dur: 1.55 },
                { ox: -22, oy: 6,  delay: 1.15, dur: 1.7 },
                { ox:   8, oy: 12, delay: 1.0,  dur: 1.4 },
              ].map((p, i) => (
                <motion.span key={i} aria-hidden
                  className="absolute w-[3px] h-[3px] rounded-full bg-emerald-400/80"
                  style={{ left: `calc(50% + ${p.ox}px)`, top: `calc(58% + ${p.oy}px)` }}
                  initial={{ y: 0, opacity: 0, scale: 0 }}
                  animate={{ y: [-3, -52], opacity: [0, 0.75, 0], scale: [0, 1, 0.3] }}
                  transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, repeatDelay: 1.4, ease: 'easeOut' }}
                />
              ))}
            </div>

            {/* Brand name — letter stagger with blur-in */}
            <div className="flex items-center" aria-label="MB Plant House">
              {BRAND.map((char, i) => (
                <motion.span key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.44, delay: 0.62 + i * 0.036, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[12px] tracking-[0.3em] font-light text-forest-100/72"
                  style={{ width: char === ' ' ? '0.58em' : undefined }}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* Thin expanding divider */}
            <motion.div
              aria-hidden
              className="mt-[14px] h-px rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(110,162,112,0.50), transparent)' }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 108, opacity: 1 }}
              transition={{ duration: 0.95, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Tagline + percentage counter */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.95 }}
              className="mt-[11px] flex items-center gap-[14px]"
            >
              <span className="text-[9.5px] tracking-[0.24em] uppercase text-forest-500/55 font-light">
                Premium Nursery
              </span>
              <span className="text-[9.5px] tracking-[0.12em] text-forest-600/38 tabular-nums font-light">
                {String(progress).padStart(3, ' ')}%
              </span>
            </motion.div>
          </div>

          {/* Bottom progress bar with shimmer sweep */}
          <div aria-hidden className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{ background: 'rgba(36,82,40,0.22)' }}
          >
            <motion.div
              className="h-full relative overflow-hidden"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transformOrigin: 'left',
                background: 'linear-gradient(90deg, #2c5630, #5a9e5e, #3a7d3e)',
              }}
            >
              {/* Shimmer traveling left → right */}
              <motion.div
                aria-hidden
                className="absolute inset-y-0 w-24 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }}
                initial={{ left: '-96px' }}
                animate={{ left: '100%' }}
                transition={{ duration: 0.95, delay: 0.45, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
