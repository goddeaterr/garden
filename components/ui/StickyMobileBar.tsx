'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Phone, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cartContext';

export function StickyMobileBar() {
  const [visible, setVisible] = useState(false);
  const { itemCount, openCart } = useCart();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[140] sm:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div
            className="mx-3 mb-3 flex gap-2 p-2 rounded-2xl border border-white/20"
            style={{ background: 'rgba(12,22,14,0.90)', backdropFilter: 'blur(20px)' }}
          >
            <a
              href="tel:+37061854758"
              className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl bg-white/10 text-white text-[13px] font-semibold active:scale-95 transition-transform hover:bg-white/15"
            >
              <Phone size={15} />
              Call
            </a>
            <button
              onClick={openCart}
              className="relative flex items-center justify-center gap-2 flex-[2] py-3 rounded-xl text-white text-[13px] font-bold active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg,#3d6741,#508153)' }}
            >
              <ShoppingBag size={15} />
              {itemCount > 0 ? `View Quote (${itemCount})` : 'Request a Quote'}
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 text-forest-950 text-[10px] font-bold flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
