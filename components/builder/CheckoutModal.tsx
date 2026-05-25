'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGarden } from './GardenContext';
import { useTrees } from '@/lib/useTrees';
import { formatPrice } from '@/lib/utils';
import { useI18n } from '@/lib/i18nContext';
import { exportGardenPDF, generateGardenImageBase64 } from '@/lib/exportPdf';
import { buildPayseraUrl, generateOrderId } from '@/lib/paysera';
import { X, Leaf, User, Phone, Mail, MapPin, MessageSquare, CheckCircle2, Loader2, ChevronRight, FileText, TreePine, CreditCard } from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
  deliveryOption: 'delivery' | 'pickup';
}

const INITIAL: FormData = {
  firstName: '', lastName: '', email: '', phone: '',
  address: '', city: '', notes: '', deliveryOption: 'delivery',
};

function sanitize(str: string): string {
  return str.replace(/[<>'"&]/g, c => ({ '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;', '&': '&amp;' }[c] || c));
}

export function CheckoutModal() {
  const { showCheckout, setShowCheckout, placed, total, planSnapshot, setPlanSnapshot, canvasRef } = useGarden();
  const { tr } = useI18n();
  const c = tr.checkout;
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [payseraLoading, setPayseraLoading] = useState(false);
  const trees = useTrees();

  const items = placed
    .map(placed_item1 => {
      const tree_found1 = trees.find(tree_item1 => tree_item1.id === placed_item1.treeId);

      if (!tree_found1) return null;

      return {
        placed: placed_item1,
        tree: tree_found1,
      };
    })
    .filter((item_item1): item_item1 is { placed: typeof placed[number]; tree: typeof trees[number] } => Boolean(item_item1));

  const countMap: Record<string, number> = {};
  items.forEach(item_item1 => {
    countMap[item_item1.tree.id] = (countMap[item_item1.tree.id] || 0) + 1;
  });
  const unique = items.filter((item_item1, index_item1, array_item1) =>
    array_item1.findIndex(compare_item1 => compare_item1.tree.id === item_item1.tree.id) === index_item1
  );

  const set = (k: keyof FormData, v: string) => {
    const safe = k !== 'email' && k !== 'phone' ? sanitize(v) : v.trim();
    setForm(f => ({ ...f, [k]: safe.slice(0, 300) }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.firstName.trim()) errs.firstName = c.required;
    if (!form.lastName.trim()) errs.lastName = c.required;
    if (!form.email.match(/^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/)) errs.email = c.validEmail;
    if (!form.phone.trim()) errs.phone = c.required;
    if (form.deliveryOption === 'delivery' && !form.address.trim()) errs.address = c.requiredDelivery;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const treeList = unique.map(({ tree }) => {
        const qty = countMap[tree.id];
        return `• ${sanitize(tree.name)} (${sanitize(tree.latin)}) × ${qty} — ${formatPrice(tree.price * qty)}`;
      }).join('\n');

      const body = [
        c.emailTitle,
        '',
        c.emailCustomer,
        `${c.emailNameLabel}: ${sanitize(form.firstName)} ${sanitize(form.lastName)}`,
        `${c.emailEmailLabel}: ${form.email}`,
        `${c.emailPhoneLabel}: ${form.phone}`,
        form.deliveryOption === 'delivery'
          ? `${c.emailAddressLabel}: ${sanitize(form.address)}${form.city ? ', ' + sanitize(form.city) : ''}`
          : c.emailPickupLabel,
        '',
        c.emailOrderTitle,
        treeList,
        '',
        `${c.emailTotalLabel}: ${formatPrice(total)}`,
        '',
        form.notes ? `${c.emailNotesTitle}\n${sanitize(form.notes)}` : '',
        '',
        `${c.emailGeneratedLabel}: ${new Date().toLocaleDateString('lt-LT', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      ].filter(Boolean).join('\n');

      const subject = encodeURIComponent(`${c.emailSubjectPrefix} — ${sanitize(form.firstName)} ${sanitize(form.lastName)} — ${formatPrice(total)}`);
      window.location.href = `mailto:info@planthouse.lt?subject=${subject}&body=${encodeURIComponent(body)}`;
      await new Promise(r => setTimeout(r, 800));
      setStep('success');
    } finally { setSubmitting(false); }
  };

  const handlePaysera = async () => {
    if (!validate()) return;
    setPayseraLoading(true);
    try {
      const url = buildPayseraUrl({
        amount: total,
        orderId: generateOrderId(),
        customerEmail: form.email,
        customerName: `${sanitize(form.firstName)} ${sanitize(form.lastName)}`,
        description: `MB Plant House — ${unique.map(({ tree }) => tree.name).join(', ')}`,
      });
      window.location.href = url;
    } finally { setPayseraLoading(false); }
  };

  const handleClose = () => {
    setShowCheckout(false);
    setStep('form');
    setForm(INITIAL);
    setErrors({});
  };

  const handleExportPDF = async () => {
    await exportGardenPDF(items.map(i => i.tree), total, canvasRef.current);
  };

  return (
    <AnimatePresence>
      {showCheckout && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6"
          style={{ background: 'rgba(12, 22, 14, 0.75)', backdropFilter: 'blur(12px)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl max-h-[92svh] overflow-hidden rounded-3xl bg-forest-50 dark:bg-forest-950 shadow-2xl shadow-forest-900/50 flex flex-col"
          >
            <div className="relative flex-shrink-0 overflow-hidden rounded-t-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-forest-800 via-forest-700 to-moss-600" />
              <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full opacity-30" style={{ background: 'radial-gradient(ellipse, rgba(151,196,89,0.6) 0%, transparent 70%)' }} />
              <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(ellipse, rgba(214,195,153,0.5) 0%, transparent 70%)' }} />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute opacity-[0.07]" style={{ left: `${10 + i * 16}%`, top: `${20 + (i % 2) * 30}%`, fontSize: `${24 + (i % 3) * 14}px` }}>
                  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none"><path d="M12 22V14M12 14C8 14 5 10 5 6C5 3 8 2 12 2C16 2 19 3 19 6C19 10 16 14 12 14Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              ))}
              <div className="relative z-10 p-6 sm:p-8 pb-6 flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-3">
                    <Leaf size={11} className="text-forest-100" />
                    <span className="text-[10px] font-medium tracking-wider text-forest-100 uppercase">{c.badge}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{c.title}</h2>
                  <p className="text-forest-200 text-[13px] mt-1">{c.subtitle}</p>
                </div>
                <button onClick={handleClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors mt-1 flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <AnimatePresence mode="wait">
                {step === 'success' ? (
                  <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center p-10 min-h-[300px]">
                    <div className="w-20 h-20 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center mb-6">
                      <CheckCircle2 size={40} className="text-forest-600 dark:text-forest-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-forest-950 dark:text-forest-50 mb-2">{c.successTitle}</h3>
                    <p className="text-forest-600 dark:text-forest-400 max-w-sm leading-relaxed mb-8">
                      {c.successSub} <strong>{form.email}</strong> {c.successSub2}
                    </p>
                    <div className="flex gap-3 flex-wrap justify-center">
                      <button onClick={handleExportPDF} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[13px] font-medium hover:scale-105 transition-transform">
                        <FileText size={14} />{c.downloadPdf}
                      </button>
                      <button onClick={handleClose} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-100 dark:bg-forest-800 text-forest-800 dark:text-forest-100 text-[13px] font-medium hover:scale-105 transition-transform">
                        {c.backToBuilder}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                    <div className="lg:col-span-3 p-6 sm:p-8 pt-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Field label={c.firstName} icon={<User size={14} />} value={form.firstName} onChange={v => set('firstName', v)} error={errors.firstName} placeholder="Jonas" />
                        <Field label={c.lastName} value={form.lastName} onChange={v => set('lastName', v)} error={errors.lastName} placeholder="Petraitis" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <Field label={c.email} icon={<Mail size={14} />} type="email" value={form.email} onChange={v => set('email', v)} error={errors.email} placeholder="jonas@example.com" />
                        <Field label={c.phone} icon={<Phone size={14} />} type="tel" value={form.phone} onChange={v => set('phone', v)} error={errors.phone} placeholder="+370 618 54758" />
                      </div>

                      <div className="mb-4">
                        <label className="block text-[11px] uppercase tracking-wider text-forest-600 dark:text-forest-400 font-medium mb-2">{c.delivery}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['delivery', 'pickup'] as const).map(opt => (
                            <button key={opt} onClick={() => set('deliveryOption', opt)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium border transition-all ${form.deliveryOption === opt ? 'bg-forest-900 dark:bg-forest-100 text-forest-50 dark:text-forest-900 border-transparent' : 'bg-white dark:bg-forest-900 text-forest-700 dark:text-forest-300 border-forest-200 dark:border-forest-800 hover:border-forest-400'}`}>
                              {opt === 'delivery' ? <MapPin size={14} /> : <TreePine size={14} />}
                              {opt === 'delivery' ? c.deliverTo : c.pickup}
                            </button>
                          ))}
                        </div>
                      </div>

                      {form.deliveryOption === 'delivery' && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <Field label={c.address} icon={<MapPin size={14} />} value={form.address} onChange={v => set('address', v)} error={errors.address} placeholder="Užuovėjos g. 6" />
                          <Field label={c.city} value={form.city} onChange={v => set('city', v)} placeholder="Klaipėda" />
                        </div>
                      )}

                      <div className="mb-5">
                        <label className="block text-[11px] uppercase tracking-wider text-forest-600 dark:text-forest-400 font-medium mb-2">{c.notes}</label>
                        <div className="relative">
                          <MessageSquare size={14} className="absolute left-3 top-3 text-forest-400" />
                          <textarea
                            value={form.notes}
                            onChange={e => set('notes', e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder={c.notesPlaceholder}
                            className="w-full pl-9 pr-3 py-2.5 text-[13px] bg-white dark:bg-forest-900 border border-forest-200 dark:border-forest-800 rounded-xl text-forest-900 dark:text-forest-100 placeholder:text-forest-400 outline-none focus:ring-2 focus:ring-forest-400 dark:focus:ring-forest-600 resize-none transition"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button onClick={handleSubmit} disabled={submitting} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[14px] font-semibold hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-70 shadow-lg shadow-forest-900/20">
                          {submitting ? <Loader2 size={17} className="animate-spin" /> : <ChevronRight size={17} />}
                          {submitting ? c.sending : c.placeOrder}
                        </button>

                        {total > 0 && (
                          <button onClick={handlePaysera} disabled={payseraLoading || submitting} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl border-2 border-forest-700 dark:border-forest-400 text-forest-800 dark:text-forest-100 text-[14px] font-semibold hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-70">
                            {payseraLoading ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
                            {payseraLoading ? c.sending : c.payPaysera}
                          </button>
                        )}
                      </div>


                    </div>

                    <div className="lg:col-span-2 bg-forest-100/50 dark:bg-forest-900/50 border-t lg:border-t-0 lg:border-l border-forest-200/60 dark:border-forest-800/60 p-6 sm:p-8 pt-4">
                      <h3 className="text-[11px] uppercase tracking-wider text-forest-600 dark:text-forest-400 font-medium mb-4">{c.gardenPlan}</h3>

                      {planSnapshot && (
                        <div className="rounded-xl overflow-hidden mb-4 border border-forest-200/60 dark:border-forest-800/60 shadow-sm">
                          <img src={planSnapshot} alt="Garden plan" className="w-full h-32 object-cover" />
                        </div>
                      )}

                      <ul className="space-y-2 mb-4">
                        {unique.map(({ tree }) => {
                          const qty = countMap[tree.id];
                          return (
                            <li key={tree.id} className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: `${tree.color}22` }}>
                                {tree.imagePath
                                  ? <img src={tree.imagePath} alt={tree.name} className="w-full h-full object-contain" />
                                  : <div className="w-full h-full scale-75" dangerouslySetInnerHTML={{ __html: tree.svg }} />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-medium text-forest-950 dark:text-forest-50 truncate">{tree.name}</div>
                                <div className="text-[10px] text-forest-500 dark:text-forest-400 italic">{tree.latin}</div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-[12px] font-semibold text-forest-900 dark:text-forest-100 tabular-nums">{formatPrice(tree.price * qty)}</div>
                                {qty > 1 && <div className="text-[10px] text-forest-500">×{qty}</div>}
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="border-t border-forest-200/60 dark:border-forest-800/60 pt-3 mb-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[12px] text-forest-600 dark:text-forest-400">{c.estimatedTotal}</span>
                          <span className="text-xl font-bold tabular-nums text-forest-950 dark:text-forest-50">{formatPrice(total)}</span>
                        </div>
                        <p className="text-[10px] text-forest-400 mt-1">{c.disclaimer}</p>
                      </div>

                      <button onClick={handleExportPDF} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-forest-800 text-forest-800 dark:text-forest-100 text-[12px] font-medium hover:bg-forest-50 dark:hover:bg-forest-700 border border-forest-200 dark:border-forest-700 transition-colors">
                        <FileText size={13} />{c.downloadPdf}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, icon, value, onChange, error, placeholder, type = 'text', className = '' }: {
  label: string; icon?: React.ReactNode; value: string; onChange: (v: string) => void;
  error?: string; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] uppercase tracking-wider text-forest-600 dark:text-forest-400 font-medium mb-1.5">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={200}
          autoComplete="off"
          spellCheck={false}
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-[13px] bg-white dark:bg-forest-900 border rounded-xl text-forest-900 dark:text-forest-100 placeholder:text-forest-400 outline-none focus:ring-2 transition ${error ? 'border-red-400 focus:ring-red-300' : 'border-forest-200 dark:border-forest-800 focus:ring-forest-400 dark:focus:ring-forest-600'}`}
        />
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
