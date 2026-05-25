'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGarden } from './GardenContext';
import { useI18n } from '@/lib/i18nContext';
import { useTrees } from '@/lib/useTrees';
import { Trash2, Copy, ArrowUp, ArrowDown, FlipHorizontal2, RotateCcw, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export function ControlsPanel() {
  const trees = useTrees();
  const { placed, selectedUid, setSelectedUid, updateTree, removeTree, duplicateTree, bringForward, sendBackward } = useGarden();
  const { tr } = useI18n();
  const ct = tr.controls;
  const selected = placed.find(p => p.uid === selectedUid);
  const tree = selected ? trees.find(t => t.id === selected.treeId) : null;

  return (
    <AnimatePresence>
      {selected && (
        <>
          <motion.div
            key="desktop"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="hidden sm:block absolute bottom-4 left-1/2 -translate-x-1/2 glass-strong rounded-2xl p-3 shadow-2xl w-[calc(100%-2rem)] max-w-[520px] pointer-events-auto"
            data-builder-ui
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-2">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-forest-500 dark:text-forest-400">{ct.editing}</div>
                <div className="text-sm font-semibold text-forest-950 dark:text-forest-50 truncate">
                  {tree?.name} <span className="text-forest-500 font-normal tabular-nums">· {formatPrice(tree?.price || 0)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <IconBtn onClick={() => duplicateTree(selected.uid)} label={ct.duplicate}><Copy size={13} /></IconBtn>
                <IconBtn onClick={() => bringForward(selected.uid)} label={ct.bringForward}><ArrowUp size={13} /></IconBtn>
                <IconBtn onClick={() => sendBackward(selected.uid)} label={ct.sendBack}><ArrowDown size={13} /></IconBtn>
                <IconBtn onClick={() => updateTree(selected.uid, { flipped: !selected.flipped })} label={ct.flip}><FlipHorizontal2 size={13} /></IconBtn>
                <IconBtn onClick={() => updateTree(selected.uid, { rotation: 0, scale: 1, opacity: 1 })} label={ct.reset}><RotateCcw size={13} /></IconBtn>
                <IconBtn onClick={() => removeTree(selected.uid)} label={ct.delete} danger><Trash2 size={13} /></IconBtn>
              </div>
            </div>
          </motion.div>

          <motion.div
            key="mobile"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'fixed', bottom: 110, left: 0, right: 0, zIndex: 290 }}
            className="sm:hidden mx-2"
            data-builder-ui
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-forest-900 rounded-2xl shadow-2xl border border-forest-200/60 dark:border-forest-800/60 overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-[9px] uppercase tracking-wider text-forest-500 dark:text-forest-400 font-medium">{ct.editing}</div>
                  <div className="text-[13px] font-bold text-forest-950 dark:text-forest-50 leading-tight truncate">
                    {tree?.name} <span className="text-forest-400 font-normal text-[11px]">{formatPrice(tree?.price || 0)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <IconBtn onClick={() => duplicateTree(selected.uid)} label={ct.duplicate}><Copy size={12} /></IconBtn>
                  <IconBtn onClick={() => bringForward(selected.uid)} label={ct.bringForward}><ArrowUp size={12} /></IconBtn>
                  <IconBtn onClick={() => sendBackward(selected.uid)} label={ct.sendBack}><ArrowDown size={12} /></IconBtn>
                  <IconBtn onClick={() => updateTree(selected.uid, { flipped: !selected.flipped })} label={ct.flip}><FlipHorizontal2 size={12} /></IconBtn>
                  <IconBtn onClick={() => updateTree(selected.uid, { rotation: 0, scale: 1, opacity: 1 })} label={ct.reset}><RotateCcw size={12} /></IconBtn>
                  <IconBtn onClick={() => removeTree(selected.uid)} label={ct.delete} danger><Trash2 size={12} /></IconBtn>
                  <IconBtn onClick={() => setSelectedUid(null)} label="Uždaryti"><X size={12} /></IconBtn>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function IconBtn({ children, onClick, label, danger }: { children: React.ReactNode; onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button
      onPointerDown={e => e.stopPropagation()}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-forest-600 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-800'}`}>
      {children}
    </button>
  );
}
