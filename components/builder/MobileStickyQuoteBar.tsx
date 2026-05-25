'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, TreePine, Loader2 } from 'lucide-react';
import { useGarden } from './GardenContext';
import { formatPrice } from '@/lib/utils';
import { generateGardenImageBase64 } from '@/lib/exportPdf';
import { useI18n } from '@/lib/i18nContext';

/**
 * Page-level mobile sticky bar — fixed at the bottom of the screen.
 * Visible on sm and below only, when at least one plant has been placed.
 * Disappears when the checkout modal is open.
 */
export function MobileStickyQuoteBar() {
  const { placed, total, showCheckout, canvasRef, setPlanSnapshot, setShowCheckout } = useGarden();
  const { tr } = useI18n();
  const s = tr.summary;
  const [quoting, setQuoting] = useState(false);
  const [visible, setVisible] = useState(false);

  // Delay appearance slightly so it doesn't pop on first render
  useEffect(() => {
    if (placed.length > 0 && !showCheckout) {
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [placed.length, showCheckout]);

  const handleQuote = async () => {
    setQuoting(true);
    try {
      const snap = canvasRef.current ? await generateGardenImageBase64(canvasRef.current) : null;
      setPlanSnapshot(snap);
      setShowCheckout(true);
    } finally {
      setQuoting(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="sm:hidden fixed bottom-0 left-0 right-0 z-[400] safe-bottom"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Gradient fade above the bar */}
          <div className="h-6 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          <div className="bg-white dark:bg-forest-900 border-t border-forest-200/80 dark:border-forest-800 px-4 py-3 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3">
              {/* Plant count badge */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
                  <TreePine size={15} className="text-forest-700 dark:text-forest-200" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-forest-950 dark:text-forest-50 leading-none">
                    {placed.length} {placed.length === 1 ? s.tree : s.trees}
                  </div>
                  <div className="text-[10px] text-forest-500 tabular-nums leading-none mt-0.5">
                    {formatPrice(total)}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleQuote}
                disabled={quoting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 active:bg-emerald-700 text-white text-[14px] font-bold shadow-lg shadow-emerald-900/30 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {quoting
                  ? <Loader2 size={16} className="animate-spin" />
                  : <ShoppingBag size={16} />}
                {quoting ? s.preparing : s.requestQuote}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
