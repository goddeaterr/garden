'use client';

import { motion, AnimatePresence } from 'framer-motion';

const LETTERS = 'MB PLANT HOUSE'.split('');

const PARTICLES = [
  { ox: -16, oy: 6,  delay: 0.9,  dur: 1.4 },
  { ox:  18, oy: 9,  delay: 1.1,  dur: 1.6 },
  { ox:  -7, oy: 14, delay: 1.3,  dur: 1.25 },
  { ox:  22, oy: 3,  delay: 1.0,  dur: 1.5 },
  { ox: -24, oy: 7,  delay: 1.2,  dur: 1.7 },
  { ox:   9, oy: 11, delay: 0.95, dur: 1.35 },
  { ox: -13, oy: 1,  delay: 1.15, dur: 1.45 },
  { ox:  28, oy: 5,  delay: 1.05, dur: 1.55 },
];

// Crown sparkle burst (fires at t≈1.85s after tree path completes)
const SPARKLES = [
  { angle: -70,  dist: 32 },
  { angle: -20,  dist: 28 },
  { angle:  20,  dist: 34 },
  { angle:  65,  dist: 30 },
  { angle: -110, dist: 26 },
  { angle:  110, dist: 28 },
];

// Corner botanical ornaments (top-left, top-right, bottom-left, bottom-right)
const CORNERS = [
  { cls: 'top-6 left-6',     rotate: '0deg'   },
  { cls: 'top-6 right-6',    rotate: '90deg'  },
  { cls: 'bottom-6 left-6',  rotate: '270deg' },
  { cls: 'bottom-6 right-6', rotate: '180deg' },
];

export function LoadingScreen({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[500] flex items-center justify-center overflow-hidden"
          style={{ background: 'rgb(10, 19, 11)' }}
        >
          {/* Radial ambient glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 58% 48% at 50% 50%, rgba(45,110,53,0.30) 0%, transparent 70%)' }} />

          {/* Faint dot grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.022]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(200,218,201,1) 1px, transparent 0)', backgroundSize: '36px 36px' }} />

          {/* Corner botanical ornaments */}
          {CORNERS.map(({ cls, rotate }, i) => (
            <motion.div
              key={i}
              className={`absolute ${cls} pointer-events-none`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 + i * 0.1 }}
            >
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ transform: `rotate(${rotate})`, opacity: 0.1 }}>
                <path d="M4 48 L4 14 Q4 4 14 4" stroke="rgba(113,158,114,1)" strokeWidth="1" strokeLinecap="round" fill="none" />
                <path d="M4 30 Q14 22 20 14" stroke="rgba(113,158,114,0.7)" strokeWidth="0.8" strokeLinecap="round" fill="none" />
                <path d="M4 38 Q16 34 22 28" stroke="rgba(113,158,114,0.5)" strokeWidth="0.7" strokeLinecap="round" fill="none" />
                <circle cx="22" cy="12" r="2.5" fill="rgba(113,158,114,0.6)" />
                <circle cx="22" cy="26" r="1.8" fill="rgba(113,158,114,0.4)" />
              </svg>
            </motion.div>
          ))}

          {/* ── Center group ── */}
          <div className="relative flex flex-col items-center">

            {/* Logo stage */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-10">

              {/* Breathing glow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(80,129,83,0.40) 0%, transparent 68%)' }}
                animate={{ scale: [1, 1.20, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
              />

              {/* Outer spinning dashed orbit (clockwise) */}
              <motion.svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ opacity: { duration: 0.5, delay: 0.5 }, rotate: { duration: 24, repeat: Infinity, ease: 'linear', delay: 0.5 } }}
              >
                <circle cx="80" cy="80" r="74" stroke="rgba(113,158,114,0.20)" strokeWidth="1" fill="none" strokeDasharray="3 16" />
              </motion.svg>

              {/* Inner counter-rotating ring (anti-clockwise) */}
              <motion.svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: -360 }}
                transition={{ opacity: { duration: 0.5, delay: 0.7 }, rotate: { duration: 18, repeat: Infinity, ease: 'linear', delay: 0.7 } }}
              >
                <circle cx="80" cy="80" r="58" stroke="rgba(113,158,114,0.14)" strokeWidth="1" fill="none" strokeDasharray="2 10" />
              </motion.svg>

              {/* Arc that draws itself */}
              <motion.svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <motion.circle cx="80" cy="80" r="50"
                  stroke="rgba(113,158,114,0.32)" strokeWidth="1.5"
                  fill="none" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 0.76 }}
                  transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </motion.svg>

              {/* 3 sonar pulse rings */}
              {[0, 0.6, 1.2].map((delay, i) => (
                <motion.span key={i}
                  className="absolute rounded-full border border-emerald-500/20"
                  style={{ inset: -i * 3 }}
                  initial={{ scale: 1, opacity: 0.55 }}
                  animate={{ scale: 2.0, opacity: 0 }}
                  transition={{ duration: 2.6, delay: 1.1 + delay, repeat: Infinity, ease: 'easeOut' }}
                />
              ))}

              {/* Tree SVG — trunk + crown + 2 branches + roots */}
              <motion.svg width="62" height="78" viewBox="0 0 62 78"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Crown + trunk */}
                <motion.path
                  d="M31 72 L31 40 M31 40 Q17 26 17 14 Q17 4 31 4 Q45 4 45 14 Q45 26 31 40"
                  stroke="rgba(181,218,182,0.93)" strokeWidth="2.2" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 1.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Left branch */}
                <motion.path d="M31 48 Q21 42 18 35"
                  stroke="rgba(181,218,182,0.52)" strokeWidth="1.5" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.55, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Right branch */}
                <motion.path d="M31 54 Q41 48 44 41"
                  stroke="rgba(181,218,182,0.52)" strokeWidth="1.5" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.55, delay: 1.25, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Root left */}
                <motion.path d="M31 72 Q22 76 16 74"
                  stroke="rgba(113,158,114,0.35)" strokeWidth="1.2" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 1.55, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Root right */}
                <motion.path d="M31 72 Q40 76 46 74"
                  stroke="rgba(113,158,114,0.35)" strokeWidth="1.2" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 1.65, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Root center deep */}
                <motion.path d="M31 72 L31 78"
                  stroke="rgba(113,158,114,0.25)" strokeWidth="1" strokeLinecap="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </motion.svg>

              {/* Crown sparkle burst — fires when tree drawing finishes */}
              {SPARKLES.map((s, i) => {
                const rad = (s.angle * Math.PI) / 180;
                return (
                  <motion.span key={i}
                    className="absolute rounded-full bg-emerald-300"
                    style={{ width: 3, height: 3, top: '50%', left: '50%', marginTop: -28, marginLeft: -1.5 }}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{
                      x: Math.cos(rad) * s.dist,
                      y: Math.sin(rad) * s.dist,
                      opacity: [0, 1, 0],
                      scale: [0, 1.4, 0],
                    }}
                    transition={{ duration: 0.7, delay: 1.85 + i * 0.04, ease: 'easeOut' }}
                  />
                );
              })}

              {/* Floating pollen particles */}
              {PARTICLES.map((p, i) => (
                <motion.span key={i}
                  className="absolute w-1 h-1 rounded-full bg-emerald-400"
                  style={{ left: `calc(50% + ${p.ox}px)`, top: `calc(60% + ${p.oy}px)` }}
                  initial={{ y: 0, opacity: 0, scale: 0 }}
                  animate={{ y: [-2, -50], opacity: [0, 0.8, 0], scale: [0, 1, 0.3] }}
                  transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, repeatDelay: 1.2, ease: 'easeOut' }}
                />
              ))}
            </div>

            {/* Brand name — letter-by-letter stagger */}
            <div className="flex items-center">
              {LETTERS.map((char, i) => (
                <motion.span key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, delay: 0.75 + i * 0.044, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[13px] tracking-[0.28em] font-light text-forest-200/80"
                  style={{ width: char === ' ' ? '0.55em' : undefined }}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* Expanding divider */}
            <motion.div className="mt-5 h-px rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(113,158,114,0.55), transparent)' }}
              initial={{ width: 0 }} animate={{ width: 120 }}
              transition={{ duration: 1.1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.4 }}
              className="mt-3 text-[10px] tracking-[0.22em] uppercase text-forest-500/70"
            >
              Premium Nursery
            </motion.p>
          </div>

          {/* Bottom progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'rgba(45,110,53,0.15)' }}>
            <motion.div className="h-full"
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ duration: 1.38, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left', background: 'linear-gradient(90deg, #3d6741, #71a172, #4a9e56)' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
