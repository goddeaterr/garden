'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import type { Tree } from '@/types';
import { TreeIllustration } from '@/components/ui/TreeIllustration';

interface Props {
  tree: Tree | null;
  onClose: () => void;
}

const CAT_GRADIENT: Record<string, string> = {
  fruit:      'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
  decorative: 'linear-gradient(135deg, #4a7c3f 0%, #2d5a25 100%)',
  evergreen:  'linear-gradient(135deg, #0a7055 0%, #064e3b 100%)',
  shrub:      'linear-gradient(135deg, #6d3bb5 0%, #4c1d95 100%)',
};

const CONFETTI_COLORS = ['#4ade80','#86efac','#fbbf24','#a78bfa','#f472b6','#34d399','#fff'];

function ConfettiDot({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{ background: color, left: '50%', top: '30%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0.3 }}
      transition={{ duration: 0.9 + delay * 0.3, ease: 'easeOut', delay: delay * 0.06 }}
    />
  );
}

const confettiDots = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2;
  const dist = 70 + Math.random() * 90;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist - 30,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: i * 0.5,
  };
});

export function QuoteModal({ tree, onClose }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', quantity: '1', notes: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setError('');
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          treeName: tree?.name || '', treeHeight: tree?.height || '',
          treePrice: tree?.price || 0, treeCategory: tree?.category || 'decorative',
          quantity: form.quantity, notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Send failed');
      setSent(true);
    } catch (err: any) {
      // Fallback to mailto if API unavailable
      const body = [
        `Name: ${form.name}`, `Email: ${form.email}`,
        form.phone ? `Phone: ${form.phone}` : '',
        `Tree: ${tree?.name}`, `Quantity: ${form.quantity}`,
        form.notes ? `Notes: ${form.notes}` : '',
      ].filter(Boolean).join('\n');
      window.location.href = `mailto:info@planthouse.lt?subject=${encodeURIComponent(`Quote: ${tree?.name}`)}&body=${encodeURIComponent(body)}`;
      setSent(true);
    } finally { setSending(false); }
  };

  const handleClose = () => {
    setSent(false); setError('');
    setForm({ name: '', email: '', phone: '', quantity: '1', notes: '' });
    onClose();
  };

  const gradient = tree ? (CAT_GRADIENT[tree.category] || CAT_GRADIENT.decorative) : CAT_GRADIENT.decorative;

  return (
    <AnimatePresence>
      {tree && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: 'rgba(12,22,14,0.78)', backdropFilter: 'blur(14px)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-lg bg-forest-50 dark:bg-forest-950 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-0 absolute top-0 left-0 right-0 z-20">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-white" />
            </button>

            {sent ? (
              /* ── Success screen ── */
              <div className="relative px-8 py-14 text-center overflow-hidden">
                {/* Confetti burst */}
                {confettiDots.map((d, i) => <ConfettiDot key={i} {...d} />)}

                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                  className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{ background: gradient }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <motion.path
                      d="M5 13l4 4L19 7"
                      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                    />
                  </svg>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <h3 className="text-[22px] font-bold text-forest-950 dark:text-forest-50 mb-2 tracking-tight">Request sent!</h3>
                  <p className="text-forest-600 dark:text-forest-400 text-[14px] leading-relaxed mb-7 max-w-xs mx-auto">
                    We received your quote for <strong className="text-forest-800 dark:text-forest-200">{tree.name}</strong>. We&apos;ll reply within 24 hours.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-8 py-3 rounded-full bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[14px] font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    Done
                  </button>
                </motion.div>
              </div>
            ) : (
              <>
                {/* ── Colored tree header ── */}
                <div className="relative overflow-hidden" style={{ background: gradient }}>
                  {/* Noise overlay */}
                  <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }}
                  />
                  <div className="relative flex items-end gap-4 px-6 pt-10 pb-5">
                    {/* Tree illustration */}
                    <div
                      className="w-[72px] h-[72px] flex-shrink-0 rounded-2xl overflow-hidden flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.15)' }}
                    >
                      <TreeIllustration
                        svg={tree.svg}
                        imagePath={tree.imagePath}
                        alt={tree.name}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pb-0.5">
                      <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">Request a Quote</p>
                      <h2 className="text-white text-[19px] font-bold leading-tight tracking-tight truncate">{tree.name}</h2>
                      <p className="text-white/65 text-[12px] mt-0.5">{tree.height} &nbsp;·&nbsp; €{tree.price}</p>
                    </div>
                  </div>
                </div>

                {/* ── Form ── */}
                <div className="px-6 pb-7 pt-5">
                  {error && (
                    <div className="mb-3 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-[13px]">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-1.5">Your name *</label>
                        <input required value={form.name} onChange={set('name')} placeholder="John Smith"
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-forest-900 border border-forest-200 dark:border-forest-700 text-forest-950 dark:text-forest-50 text-[14px] outline-none focus:ring-2 focus:ring-forest-400 dark:focus:ring-forest-600 placeholder:text-forest-400 dark:placeholder:text-forest-600" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-1.5">Phone</label>
                        <input value={form.phone} onChange={set('phone')} placeholder="+370 600 00000" type="tel"
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-forest-900 border border-forest-200 dark:border-forest-700 text-forest-950 dark:text-forest-50 text-[14px] outline-none focus:ring-2 focus:ring-forest-400 dark:focus:ring-forest-600 placeholder:text-forest-400 dark:placeholder:text-forest-600" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-1.5">Email *</label>
                      <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-forest-900 border border-forest-200 dark:border-forest-700 text-forest-950 dark:text-forest-50 text-[14px] outline-none focus:ring-2 focus:ring-forest-400 dark:focus:ring-forest-600 placeholder:text-forest-400 dark:placeholder:text-forest-600" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-1.5">Tree</label>
                        <div className="px-4 py-2.5 rounded-xl bg-forest-100 dark:bg-forest-800 border border-forest-200 dark:border-forest-700 text-forest-700 dark:text-forest-300 text-[14px] truncate">
                          {tree.name}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-1.5">Qty</label>
                        <input type="number" min="1" max="999" value={form.quantity} onChange={set('quantity')}
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-forest-900 border border-forest-200 dark:border-forest-700 text-forest-950 dark:text-forest-50 text-[14px] outline-none focus:ring-2 focus:ring-forest-400 dark:focus:ring-forest-600 text-center" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-1.5">Notes</label>
                      <textarea value={form.notes} onChange={set('notes')} rows={2}
                        placeholder="Delivery address, planting questions, timing…"
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-forest-900 border border-forest-200 dark:border-forest-700 text-forest-950 dark:text-forest-50 text-[14px] outline-none focus:ring-2 focus:ring-forest-400 dark:focus:ring-forest-600 resize-none placeholder:text-forest-400 dark:placeholder:text-forest-600" />
                    </div>

                    <button
                      type="submit" disabled={sending}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold tracking-tight hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition-transform mt-1 text-white"
                      style={{ background: gradient }}
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                      {sending ? 'Sending…' : 'Send Quote Request'}
                    </button>
                    <p className="text-center text-[11px] text-forest-400 dark:text-forest-600">We reply within 24 hours · No spam, ever.</p>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
