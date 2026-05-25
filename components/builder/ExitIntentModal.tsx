'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Mail, ShoppingBag } from 'lucide-react';
import { useGarden } from './GardenContext';
import { generateGardenImageBase64 } from '@/lib/exportPdf';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice } from '@/lib/utils';

export function ExitIntentModal() {
  const { placed, total, canvasRef, setPlanSnapshot, setShowCheckout } = useGarden();
  const { tr } = useI18n();
  const ei = tr.exitIntent;
  const s = tr.summary;
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (placed.length === 0) return;

    // Desktop: mouse leaves viewport from the top
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !firedRef.current) {
        firedRef.current = true;
        setShow(true);
      }
    };

    // beforeunload fallback
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (placed.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [placed.length]);

  const handleSendEmail = async () => {
    if (!email) return;
    // Here you would call an API to send the plan via email
    // For now, simulate success
    setSent(true);
    setTimeout(() => setShow(false), 2000);
  };

  const handleGetQuote = async () => {
    setShow(false);
    const snap = canvasRef.current ? await generateGardenImageBase64(canvasRef.current) : null;
    setPlanSnapshot(snap);
    setShowCheckout(true);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm"
            onClick={() => setShow(false)}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[501] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto bg-white dark:bg-forest-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-forest-900 to-forest-800 px-6 pt-6 pb-8 text-white">
                <button onClick={() => setShow(false)} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X size={14} />
                </button>
                <div className="text-2xl mb-2">🌿</div>
                <h2 className="text-[18px] font-bold leading-tight mb-1">
                  {ei.title}
                </h2>
                <p className="text-[13px] text-white/70">
                  {ei.hasPlants
                    .replace('{n}', `${placed.length} ${placed.length === 1 ? s.tree : s.trees}`)
                    .replace('{total}', formatPrice(total))}
                </p>
              </div>

              <div className="p-5 space-y-3">
                {sent ? (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-[14px] font-semibold text-forest-900 dark:text-forest-50">{ei.sent}</div>
                  </div>
                ) : (
                  <>
                    {/* Get quote */}
                    <button onClick={handleGetQuote} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-bold transition-colors">
                      <ShoppingBag size={15} />
                      {ei.getQuote}
                    </button>

                    <div className="relative flex items-center gap-3">
                      <div className="flex-1 h-px bg-forest-200 dark:bg-forest-700" />
                      <span className="text-[10px] text-forest-400 uppercase tracking-wider">{ei.orLabel}</span>
                      <div className="flex-1 h-px bg-forest-200 dark:bg-forest-700" />
                    </div>

                    {/* Email save */}
                    <div>
                      <p className="text-[11px] text-forest-600 dark:text-forest-400 mb-2 text-center">{ei.emailSave}</p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder={ei.emailPlaceholder}
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
                          className="flex-1 px-3 py-2 text-[12px] rounded-xl border border-forest-200 dark:border-forest-700 bg-forest-50 dark:bg-forest-800 text-forest-900 dark:text-forest-100 outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                        <button onClick={handleSendEmail} className="px-3 py-2 rounded-xl bg-forest-900 dark:bg-forest-100 text-white dark:text-forest-900 flex items-center gap-1 text-[12px] font-semibold hover:opacity-90 transition-opacity">
                          <Mail size={12} /> {ei.send}
                        </button>
                      </div>
                    </div>

                    <button onClick={() => setShow(false)} className="w-full text-center text-[11px] text-forest-400 hover:text-forest-600 transition-colors py-1">
                      {ei.leaveWithout}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
