'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGarden } from './GardenContext';
import { useTrees } from '@/lib/useTrees';
import { formatPrice } from '@/lib/utils';
import { FileText, ShoppingBag, X, Sprout, Trash2, Loader2 } from 'lucide-react';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { exportGardenPDF, generateGardenImageBase64 } from '@/lib/exportPdf';
import { useI18n } from '@/lib/i18nContext';

export function GardenSummary() {
  const trees = useTrees();
  const { placed, total, removeTree, setSelectedUid, selectedUid, clearAll, canvasRef, setPlanSnapshot, setShowCheckout } = useGarden();
  const { tr } = useI18n();
  const s = tr.summary;
  const [open, setOpen] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [quoting, setQuoting] = useState(false);

  const items = placed
    .map(placed_item1 => {
      const tree_found1 = trees.find(tree_item1 => tree_item1.id === placed_item1.treeId);
      if (!tree_found1) return null;
      return { placed: placed_item1, tree: tree_found1 };
    })
    .filter((item_item1): item_item1 is { placed: typeof placed[number]; tree: typeof trees[number] } => Boolean(item_item1));

  const handleExport = async () => {
    setExporting(true);
    try { await exportGardenPDF(items.map(i => i.tree), total, canvasRef.current); } finally { setExporting(false); }
  };

  const handleRequestQuote = async () => {
    setQuoting(true);
    try {
      const snap = canvasRef.current ? await generateGardenImageBase64(canvasRef.current) : null;
      setPlanSnapshot(snap);
      setShowCheckout(true);
    } finally { setQuoting(false); }
  };

  return (
    <div className="absolute top-4 right-4 z-30 max-w-[calc(100%-2rem)]" data-builder-ui>
      <motion.div layout className="glass-strong rounded-2xl shadow-2xl shadow-forest-900/10 overflow-hidden w-[300px]">
        <button onClick={() => setOpen(v => !v)} className="w-full p-4 pb-3 flex items-center justify-between text-left hover:bg-forest-50/50 dark:hover:bg-forest-900/30 transition-colors">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-forest-500 dark:text-forest-400">Your garden</div>
            <div className="text-[15px] font-semibold text-forest-950 dark:text-forest-50">
              {placed.length} {placed.length === 1 ? s.tree : s.trees} · <span className="tabular-nums">{formatPrice(total)}</span>
            </div>
          </div>
          <motion.div animate={{ rotate: open ? 0 : 180 }} transition={{ duration: 0.3 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-forest-500"/></svg>
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
              <div className="border-t border-forest-200/50 dark:border-forest-800/50 max-h-[280px] overflow-y-auto no-scrollbar">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-forest-500 dark:text-forest-400">
                    <Sprout size={28} className="mx-auto mb-2 text-forest-300 dark:text-forest-700" />
                    <div className="text-sm font-medium text-forest-700 dark:text-forest-300 mb-1">{s.empty}</div>
                    <div className="text-[12px] leading-snug">{s.emptyHint}</div>
                  </div>
                ) : (
                  <ul>
                    {items.map(({ placed, tree }) => (
                      <li key={placed.uid} onClick={() => setSelectedUid(placed.uid)} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-forest-50/60 dark:hover:bg-forest-900/40 transition-colors ${selectedUid === placed.uid ? 'bg-forest-100/60 dark:bg-forest-800/60' : ''}`}>
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: `${tree.color}22` }}>
                          <TreeIllustration svg={tree.svg} imagePath={tree.imagePath} alt={tree.name} className="w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-forest-950 dark:text-forest-50 truncate">{tree.name}</div>
                          <div className="text-[11px] text-forest-500 dark:text-forest-400 tabular-nums">{formatPrice(tree.price)}</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); removeTree(placed.uid); }} aria-label="Remove" className="w-7 h-7 rounded-md text-forest-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors">
                          <X size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-forest-200/50 dark:border-forest-800/50 p-3 space-y-2">
                  <div className="flex items-baseline justify-between px-1">
                    <span className="text-[12px] text-forest-600 dark:text-forest-400">Estimated total</span>
                    <span className="text-lg font-bold tabular-nums text-forest-950 dark:text-forest-50">{formatPrice(total)}</span>
                  </div>
                  <button onClick={handleRequestQuote} disabled={quoting} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[13px] font-medium hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-70">
                    {quoting ? <Loader2 size={13} className="animate-spin" /> : <ShoppingBag size={13} />}
                    {quoting ? s.preparing : s.requestQuote}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleExport} disabled={exporting} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-forest-100 dark:bg-forest-800 text-forest-800 dark:text-forest-100 text-[12px] font-medium hover:bg-forest-200 dark:hover:bg-forest-700 transition-colors disabled:opacity-60">
                      {exporting ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                      {exporting ? s.generating : s.exportPdf}
                    </button>
                    <button onClick={clearAll} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 text-[12px] font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 size={12} />Clear
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
