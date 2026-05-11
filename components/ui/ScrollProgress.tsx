'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      setProgress(pct);
      setVisible(pct > 0.05);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const R = 20;
  const circ = 2 * Math.PI * R;
  const arc  = circ * progress;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={scrollTop}
          className="fixed bottom-6 left-6 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-forest-900 shadow-xl shadow-forest-900/20 border border-forest-200 dark:border-forest-700 hover:scale-110 active:scale-95 transition-transform"
          aria-label="Back to top"
        >
          {/* Progress ring */}
          <svg width="48" height="48" viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
            {/* Track */}
            <circle cx="24" cy="24" r={R} fill="none" strokeWidth="2"
              className="stroke-forest-200 dark:stroke-forest-700" />
            {/* Arc */}
            <circle cx="24" cy="24" r={R} fill="none" strokeWidth="2.5"
              strokeLinecap="round"
              className="stroke-emerald-500"
              style={{ strokeDasharray: `${arc} ${circ - arc}`, transition: 'stroke-dasharray 0.12s linear' }}
            />
          </svg>
          {/* Sprout icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="relative z-10 text-forest-700 dark:text-forest-200">
            <path d="M12 22V14M12 14C8 14 5 10 5 6C5 3 8 2 12 2C16 2 19 3 19 6C19 10 16 14 12 14Z"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
