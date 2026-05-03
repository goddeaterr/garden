'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, Send, Loader2, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { TreeIllustration } from '@/components/ui/TreeIllustration';

const CAT_GRADIENT: Record<string, string> = {
  fruit:      'linear-gradient(135deg,#b45309,#92400e)',
  decorative: 'linear-gradient(135deg,#4a7c3f,#2d5a25)',
  evergreen:  'linear-gradient(135deg,#0a7055,#064e3b)',
  shrub:      'linear-gradient(135deg,#6d3bb5,#4c1d95)',
};
const CAT_COLOR: Record<string, string> = {
  fruit:'#b45309', decorative:'#4a7c3f', evergreen:'#0a7055', shrub:'#6d3bb5',
};
const CONFETTI = ['#4ade80','#86efac','#fbbf24','#a78bfa','#f472b6','#34d399','#fff'];

function ConfettiDot({ x, y, color, delay }: { x:number; y:number; color:string; delay:number }) {
  return (
    <motion.div className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{ background: color, left:'50%', top:'25%' }}
      initial={{ x:0, y:0, opacity:1, scale:1 }}
      animate={{ x, y, opacity:0, scale:0.3 }}
      transition={{ duration: 0.9 + delay * 0.3, ease:'easeOut', delay: delay * 0.055 }}
    />
  );
}
const dots = Array.from({length:30},(_,i)=>{
  const a=(i/30)*Math.PI*2, d=80+Math.random()*100;
  return { x:Math.cos(a)*d, y:Math.sin(a)*d-40, color:CONFETTI[i%CONFETTI.length], delay:i*0.4 };
});

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-white dark:bg-forest-900 border border-forest-200 dark:border-forest-700 text-forest-950 dark:text-forest-50 text-[14px] outline-none focus:ring-2 focus:ring-forest-400 dark:focus:ring-forest-600 placeholder:text-forest-400 dark:placeholder:text-forest-600";

export function CartModal() {
  const { items, removeItem, updateQty, clearCart, itemCount, subtotal, isOpen, closeCart } = useCart();
  const [form, setForm] = useState({ name:'', email:'', phone:'', notes:'' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSending(true); setErr('');
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, notes: form.notes,
          items: items.map(i => ({
            treeName: i.tree.name, treeHeight: i.tree.height || '',
            treePrice: i.tree.price, treeCategory: i.tree.category,
            quantity: i.quantity,
          })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Send failed');
      setSent(true);
      clearCart();
    } catch {
      // mailto fallback
      const body = [
        `Name: ${form.name}`, `Email: ${form.email}`,
        form.phone ? `Phone: ${form.phone}` : '',
        '--- Trees Requested ---',
        ...items.map(i => `${i.tree.name} ×${i.quantity} = €${i.tree.price * i.quantity}`),
        `Total: €${subtotal}`,
        form.notes ? `Notes: ${form.notes}` : '',
      ].filter(Boolean).join('\n');
      window.location.href = `mailto:info@planthouse.lt?subject=${encodeURIComponent('Quote Request')}&body=${encodeURIComponent(body)}`;
      setSent(true);
      clearCart();
    } finally { setSending(false); }
  };

  const handleClose = () => {
    if (!sent) { closeCart(); return; }
    setSent(false);
    setForm({ name:'', email:'', phone:'', notes:'' });
    closeCart();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.25 }}
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background:'rgba(12,22,14,0.8)', backdropFilter:'blur(14px)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity:0, y:64, scale:0.96 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:40, scale:0.97 }}
            transition={{ duration:0.38, ease:[0.16,1,0.3,1] }}
            className="relative w-full sm:max-w-xl bg-forest-50 dark:bg-forest-950 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[95svh] flex flex-col"
          >
            {/* Drag handle */}
            <div className="sm:hidden absolute top-0 left-0 right-0 flex justify-center pt-3 z-20 pointer-events-none">
              <div className="w-10 h-1 rounded-full bg-forest-300 dark:bg-forest-700" />
            </div>

            {/* Close */}
            <button onClick={handleClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-forest-900/20 dark:bg-forest-100/10 hover:bg-forest-900/30 flex items-center justify-center transition-colors">
              <X size={14} className="text-forest-700 dark:text-forest-300" />
            </button>

            {sent ? (
              /* ── Success ── */
              <div className="relative overflow-hidden px-8 py-14 text-center">
                {dots.map((d,i) => <ConfettiDot key={i} {...d} />)}
                <motion.div
                  initial={{ scale:0, rotate:-20 }} animate={{ scale:1, rotate:0 }}
                  transition={{ type:'spring', stiffness:260, damping:18, delay:0.1 }}
                  className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{ background:'linear-gradient(135deg,#2d6e35,#0c1a0e)' }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <motion.path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength:0 }} animate={{ pathLength:1 }}
                      transition={{ duration:0.5, delay:0.3 }} />
                  </svg>
                </motion.div>
                <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
                  <h3 className="text-[22px] font-bold text-forest-950 dark:text-forest-50 mb-2 tracking-tight">Quote sent!</h3>
                  <p className="text-forest-600 dark:text-forest-400 text-[14px] leading-relaxed mb-2 max-w-xs mx-auto">
                    We'll send you a confirmation email and reply within 24 hours.
                  </p>
                  <p className="text-forest-500 dark:text-forest-500 text-[12px] mb-7">Check your inbox for a PDF copy of your request.</p>
                  <button onClick={handleClose}
                    className="px-8 py-3 rounded-full bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[14px] font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform">
                    Done
                  </button>
                </motion.div>
              </div>
            ) : (
              <>
                {/* ── Header ── */}
                <div className="flex-shrink-0 px-5 pt-8 pb-4 sm:pt-6 border-b border-forest-200/60 dark:border-forest-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-forest-900 dark:bg-forest-100 flex items-center justify-center">
                      <ShoppingBag size={18} className="text-forest-50 dark:text-forest-900" />
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-forest-950 dark:text-forest-50 leading-tight tracking-tight">Quote Request</h2>
                      <p className="text-[12px] text-forest-500 dark:text-forest-400">
                        {itemCount} {itemCount === 1 ? 'tree' : 'trees'} · est. €{subtotal}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain">
                  {/* ── Cart items ── */}
                  <div className="px-5 pt-4 space-y-2">
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-forest-500 dark:text-forest-400 text-[14px]">
                        Your quote list is empty. Add trees from the catalog.
                      </div>
                    ) : items.map(({ tree, quantity }) => (
                      <div key={tree.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-forest-900 border border-forest-200/60 dark:border-forest-800/60">
                        {/* Mini illustration */}
                        <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                          style={{ background:`radial-gradient(ellipse at 50% 80%,${tree.color}40,transparent 70%), rgb(8,18,10)` }}>
                          <div style={tree.imagePath ? { mixBlendMode:'screen' as const, width:'100%', height:'100%' } : { width:'100%', height:'100%' }}>
                            <TreeIllustration svg={tree.svg} imagePath={tree.builderImagePath || tree.imagePath} alt={tree.name} className="w-full h-full object-contain" />
                          </div>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-forest-950 dark:text-forest-50 truncate">{tree.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLOR[tree.category] || '#508153' }} />
                            <p className="text-[11px] text-forest-500 dark:text-forest-400 capitalize">{tree.category} · €{tree.price} each</p>
                          </div>
                        </div>
                        {/* Qty controls */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => updateQty(tree.id, quantity - 1)}
                            className="w-7 h-7 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center hover:bg-forest-200 dark:hover:bg-forest-700 transition-colors">
                            <Minus size={11} className="text-forest-700 dark:text-forest-300" />
                          </button>
                          <span className="w-6 text-center text-[13px] font-bold text-forest-900 dark:text-forest-100 tabular-nums">{quantity}</span>
                          <button onClick={() => updateQty(tree.id, quantity + 1)}
                            className="w-7 h-7 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center hover:bg-forest-200 dark:hover:bg-forest-700 transition-colors">
                            <Plus size={11} className="text-forest-700 dark:text-forest-300" />
                          </button>
                        </div>
                        {/* Subtotal + remove */}
                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                          <span className="text-[13px] font-bold text-forest-950 dark:text-forest-50 tabular-nums">€{tree.price * quantity}</span>
                          <button onClick={() => removeItem(tree.id)}
                            className="w-5 h-5 flex items-center justify-center text-forest-400 hover:text-red-500 transition-colors">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Subtotal ── */}
                  {items.length > 0 && (
                    <div className="mx-5 mt-2 px-4 py-3 rounded-2xl bg-forest-900 dark:bg-forest-800 flex items-center justify-between">
                      <span className="text-[12px] text-forest-300 font-medium">Estimated total</span>
                      <span className="text-[16px] font-bold text-white tabular-nums">€{subtotal}</span>
                    </div>
                  )}

                  {/* ── Contact form ── */}
                  {items.length > 0 && (
                    <form id="cart-form" onSubmit={handleSubmit} className="px-5 pt-4 pb-6 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-px bg-forest-200/60 dark:bg-forest-800/60" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-forest-500 dark:text-forest-400">Your details</span>
                        <div className="flex-1 h-px bg-forest-200/60 dark:bg-forest-800/60" />
                      </div>
                      {err && <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-[13px]">{err}</div>}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-1.5">Name *</label>
                          <input required value={form.name} onChange={set('name')} placeholder="John Smith" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-1.5">Phone</label>
                          <input value={form.phone} onChange={set('phone')} placeholder="+370 600 00000" type="tel" className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-1.5">Email *</label>
                        <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-1.5">Notes</label>
                        <textarea value={form.notes} onChange={set('notes')} rows={2}
                          placeholder="Delivery address, planting questions, timing…"
                          className={`${inputCls} resize-none`} />
                      </div>
                    </form>
                  )}
                </div>

                {/* ── Sticky footer ── */}
                {items.length > 0 && (
                  <div className="flex-shrink-0 px-5 pb-6 pt-3 border-t border-forest-200/60 dark:border-forest-800/60 bg-forest-50 dark:bg-forest-950">
                    <button type="submit" form="cart-form" disabled={sending}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[14px] font-bold tracking-tight hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition-transform">
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                      {sending ? 'Sending…' : `Send Quote Request · €${subtotal}`}
                    </button>
                    <p className="text-center text-[11px] text-forest-400 dark:text-forest-600 mt-2">PDF quote emailed to you and us · Reply within 24 h</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Floating Action Button ── */
export function CartFAB() {
  const { itemCount, openCart } = useCart();
  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.button
          initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0, opacity:0 }}
          transition={{ type:'spring', stiffness:300, damping:22 }}
          onClick={openCart}
          className="fixed bottom-24 right-4 sm:bottom-8 sm:right-6 z-[150] w-14 h-14 rounded-full shadow-xl flex items-center justify-center bg-forest-900 dark:bg-forest-50 hover:scale-110 active:scale-95 transition-transform"
          aria-label="Open quote cart"
        >
          <ShoppingBag size={22} className="text-forest-50 dark:text-forest-900" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center tabular-nums shadow-sm">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
