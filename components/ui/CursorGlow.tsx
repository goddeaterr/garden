'use client';

import { useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';

/**
 * Apple-style ambient cursor glow — a large soft radial-gradient orb
 * that lags behind the cursor using spring physics. Renders as a fixed
 * overlay so it covers the whole page. mix-blend-mode:soft-light keeps
 * it subtle on light sections and beautifully visible on dark ones.
 * Hidden on touch/pointer:coarse devices (no cursor to follow).
 */
export function CursorGlow() {
  const x = useSpring(-800, { stiffness: 75, damping: 26, mass: 0.7 });
  const y = useSpring(-800, { stiffness: 75, damping: 26, mass: 0.7 });

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2] hidden [@media(pointer:fine)]:block"
    >
      <motion.div
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 620,
          height: 620,
          borderRadius: '50%',
          x, y,
          translateX: '-50%',
          translateY: '-50%',
          background:
            'radial-gradient(circle, rgba(90,190,110,0.13) 0%, rgba(70,155,90,0.06) 45%, transparent 70%)',
          mixBlendMode: 'soft-light',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
}
