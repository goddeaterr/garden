'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, Loader2, CheckCircle2 } from 'lucide-react';
import type { Tree } from '@/types';

interface Props {
  tree: Tree | null;
  onClose: () => void;
}

export function QuoteModal({ tree, onClose }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', quantity: '1', notes: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    const treeName = tree?.name || '';
    const body = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Tree: ${treeName}`,
      `Quantity: ${form.quantity}`,
      form.notes ? `Notes: ${form.notes}` : '',
    ].filter(Boolean).join('\n');

    // Try EmailJS if configured
    const svcId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const tplId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const pubKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (svcId && tplId && pubKey) {
      try {
        const emailjs = (await import('@emailjs/browser')).default;
        await emailjs.send(svcId, tplId, {
          from_name: form.name,
          from_email: form.email,
          phone: form.phone,
          tree_name: treeName,
          quantity: form.quantity,
          notes: form.notes,
          message: body,
        }, pubKey);
        setSent(true);
        setSending(false);
        return;
      } catch {}
    }

    // Fallback: mailto
    const subject = encodeURIComponent(`Quote Request: ${treeName}`);
    const mailBody = encodeURIComponent(body);
    window.location.href = `mailto:info@mbplanthouse.lt?subject=${subject}&body=${mailBody}`;
    setSent(true);
    setSending(false);
  };

  const handleClose = () => {
    setSent(false);
    setForm({ name: '', email: '', phone: '', quantity: '1', notes: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {tree && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: 'rgba(12, 22, 14, 0.75)', backdropFilter: 'blur(12px)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-lg bg-forest-50 dark:bg-forest-950 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-forest-300 dark:bg-forest-700" />
            </div>

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center hover:bg-forest-200 dark:hover:bg-forest-700 transition-colors"
            >
              <X size={16} className="text-forest-700 dark:text-forest-200" />
            </button>

            {sent ? (
              <div className="px-8 py-12 text-center">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                  <CheckCircle2 size={52} className="text-emerald-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold text-forest-950 dark:text-forest-50 mb-2">Quote request sent!</h3>
                <p className="text-forest-600 dark:text-forest-400 text-[14px] mb-6">We'll get back to you within 24 hours with pricing and availability.</p>
                <button onClick={handleClose}
                  className="px-6 py-2.5 rounded-full bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[14px] font-semibold hover:scale-[1.02] transition-transform">
                  Close
                </button>
              </div>
            ) : (
              <div className="px-6 pb-8 pt-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 pr-10">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${tree.color}22` }}>
                    <MessageSquare size={18} style={{ color: tree.color }} />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-bold text-forest-950 dark:text-forest-50 leading-tight">Request a Quote</h2>
                    <p className="text-[13px] text-forest-500 dark:text-forest-400">{tree.name} · {tree.height}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-1.5">Your name *</label>
                      <input required value={form.name} onChange={set('name')} placeholder="John Smith"
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-forest-900 border border-forest-200 dark:border-forest-700 text-forest-950 dark:text-forest-50 text-[14px] outline-none focus:ring-2 focus:ring-forest-400 dark:focus:ring-forest-600 placeholder:text-forest-400 dark:placeholder:text-forest-600" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
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
                    <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Delivery address, planting questions, timing…"
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-forest-900 border border-forest-200 dark:border-forest-700 text-forest-950 dark:text-forest-50 text-[14px] outline-none focus:ring-2 focus:ring-forest-400 dark:focus:ring-forest-600 resize-none placeholder:text-forest-400 dark:placeholder:text-forest-600" />
                  </div>

                  <button type="submit" disabled={sending}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[14px] font-semibold hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition-transform mt-1">
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                    {sending ? 'Sending…' : 'Send quote request'}
                  </button>
                  <p className="text-center text-[12px] text-forest-400 dark:text-forest-600">We reply within 24 hours.</p>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
