'use client';

import { motion, AnimatePresence } from 'framer-motion';

export function LoadingScreen({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-forest-50 dark:bg-forest-950"
        >
          <div className="relative flex flex-col items-center gap-8">
            <motion.svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.path
                d="M40 70 L40 45 M40 45 Q25 30 25 18 Q25 8 40 8 Q55 8 55 18 Q55 30 40 45"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                className="text-forest-700 dark:text-forest-300"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </motion.svg>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm tracking-[0.3em] uppercase text-forest-700 dark:text-forest-300"
            >
              MB Plant House
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
