'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGarden } from './GardenContext';
import { useTrees } from '@/lib/useTrees';
import { formatPrice } from '@/lib/utils';
import { FileText, ShoppingBag, X, Trash2, Loader2, ChevronUp } from 'lucide-react';
import { exportGardenPDF, generateGardenImageBase64 } from '@/lib/exportPdf';
import { useI18n } from '@/lib/i18nContext';

export function MobileSummaryBar() {
  const trees = useTrees();
  const { placed, total, removeTree, clearAll, canvasRef, setPlanSnapshot, setShowCheckout } = useGarden();
  const { tr } = useI18n();
  const s = tr.summary;
  const [sheetOpen, setSheetOpen] = useState(false);
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
    <>
      {/* Sheet — position:fixed so it floats over everything */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 310, background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 320, maxHeight: '70dvh', display: 'flex', flexDirection: 'column', borderRadius: '16px 16px 0 0' }}
              className="bg-white dark:bg-forest-900 border-t border-forest-200 dark:border-forest-800"
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div style={{ width: 36, height: 4 }} className="rounded-full bg-forest-300 dark:bg-forest-700" />
              </div>

              <div className="flex items-center justify-between px-4 py-2 flex-shrink-0 border-b border-forest-100 dark:border-forest-800">
                <span className="text-[14px] font-bold text-forest-950 dark:text-forest-50">
                  {placed.length} {placed.length === 1 ? s.tree : s.trees} · {formatPrice(total)}
                </span>
                <button onClick={() => setSheetOpen(false)} className="w-7 h-7 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
                  <X size={14} className="text-forest-600 dark:text-forest-300" />
                </button>
              </div>

              <div className="overflow-y-auto no-scrollbar flex-1">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-forest-500">{s.emptyHint}</div>
                ) : (
                  <ul className="divide-y divide-forest-100 dark:divide-forest-800/50">
                    {items.map(({ placed: p, tree }) => (
                      <li key={p.uid} className="flex items-center gap-3 px-4 py-2.5">
                        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, overflow: 'hidden', background: `${tree.color}22` }}>
                          {tree.imagePath
                            ? <img src={tree.imagePath} alt={tree.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            : <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: tree.svg }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-forest-950 dark:text-forest-50 truncate">{tree.name}</div>
                          <div className="text-[11px] text-forest-500 tabular-nums">{formatPrice(tree.price)}</div>
                        </div>
                        <button onClick={() => removeTree(p.uid)} className="w-7 h-7 flex items-center justify-center text-forest-400">
                          <X size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="p-3 grid grid-cols-2 gap-2 flex-shrink-0">
                  <button onClick={handleRequestQuote} disabled={quoting}
                    className="col-span-2 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[13px] font-semibold disabled:opacity-60">
                    {quoting ? <Loader2 size={13} className="animate-spin" /> : <ShoppingBag size={13} />}
                    {quoting ? s.preparing : s.requestQuote}
                  </button>
                  <button onClick={handleExport} disabled={exporting}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-forest-100 dark:bg-forest-800 text-forest-800 dark:text-forest-100 text-[12px] font-medium disabled:opacity-60">
                    {exporting ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                    {s.exportPdf}
                  </button>
                  <button onClick={() => { clearAll(); setSheetOpen(false); }}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[12px] font-medium">
                    <Trash2 size={12} />{s.clear}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Always-visible bar — exactly 48px, never grows */}
      <button
        onClick={() => setSheetOpen(true)}
        style={{ flexShrink: 0, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 16 }}
        className="w-full bg-forest-900 dark:bg-forest-900 border-t border-forest-800"
      >
        <div className="flex items-center gap-2">
          <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            className={placed.length > 0 ? 'bg-forest-400' : 'bg-forest-700'}>
            <span style={{ fontSize: 10, fontWeight: 700 }} className={placed.length > 0 ? 'text-forest-950' : 'text-forest-400'}>{placed.length}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }} className="text-white">
            {placed.length === 0 ? s.empty : `${placed.length} ${placed.length === 1 ? s.tree : s.trees}`}
          </span>
          {total > 0 && <span style={{ fontSize: 13, fontWeight: 700 }} className="text-forest-300 tabular-nums">{formatPrice(total)}</span>}
        </div>
        <ChevronUp size={16} className="text-forest-400" />
      </button>
    </>
  );
}
