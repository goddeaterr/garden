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
          {/* ── Desktop: absolute panel above bottom ── */}
          <motion.div
            key="desktop"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="hidden sm:block absolute bottom-4 left-1/2 -translate-x-1/2 glass-strong rounded-2xl p-3 shadow-2xl w-[calc(100%-2rem)] max-w-[600px]"
            data-builder-ui
          >
            <div className="flex items-center justify-between px-2 pb-3 mb-3 border-b border-forest-200/50 dark:border-forest-700/50">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-forest-500 dark:text-forest-400">{ct.editing}</div>
                <div className="text-sm font-semibold text-forest-950 dark:text-forest-50">
                  {tree?.name} <span className="text-forest-500 font-normal tabular-nums">· {formatPrice(tree?.price || 0)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <IconBtn onClick={() => duplicateTree(selected.uid)} label={ct.duplicate}><Copy size={13} /></IconBtn>
                <IconBtn onClick={() => bringForward(selected.uid)} label={ct.bringForward}><ArrowUp size={13} /></IconBtn>
                <IconBtn onClick={() => sendBackward(selected.uid)} label={ct.sendBack}><ArrowDown size={13} /></IconBtn>
                <IconBtn onClick={() => updateTree(selected.uid, { flipped: !selected.flipped })} label={ct.flip}><FlipHorizontal2 size={13} /></IconBtn>
                <IconBtn onClick={() => updateTree(selected.uid, { rotation: 0, scale: 1, opacity: 1 })} label={ct.reset}><RotateCcw size={13} /></IconBtn>
                <IconBtn onClick={() => removeTree(selected.uid)} label={ct.delete} danger><Trash2 size={13} /></IconBtn>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 px-2 pb-1">
              <Slider label={ct.size} value={selected.scale} min={0.3} max={2.5} step={0.05} onChange={v => updateTree(selected.uid, { scale: v })} format={v => `${Math.round(v * 100)}%`} />
              <Slider label={ct.rotation} value={selected.rotation} min={-30} max={30} step={1} onChange={v => updateTree(selected.uid, { rotation: v })} format={v => `${Math.round(v)}°`} />
              <Slider label={ct.opacity} value={selected.opacity} min={0.2} max={1} step={0.05} onChange={v => updateTree(selected.uid, { opacity: v })} format={v => `${Math.round(v * 100)}%`} />
            </div>
          </motion.div>

          {/* ── Mobile: fixed bottom sheet above the strip ── */}
          <motion.div
            key="mobile"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'fixed', bottom: 110, left: 0, right: 0, zIndex: 290 }}
            className="sm:hidden mx-2"
            data-builder-ui
          >
            <div className="bg-white dark:bg-forest-900 rounded-2xl shadow-2xl border border-forest-200/60 dark:border-forest-800/60 overflow-hidden">
              {/* Header row */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-forest-100 dark:border-forest-800">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-forest-500 dark:text-forest-400 font-medium">{ct.editing}</div>
                  <div className="text-[13px] font-bold text-forest-950 dark:text-forest-50 leading-tight">
                    {tree?.name} <span className="text-forest-400 font-normal text-[11px]">{formatPrice(tree?.price || 0)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <IconBtn onClick={() => duplicateTree(selected.uid)} label={ct.duplicate}><Copy size={12} /></IconBtn>
                  <IconBtn onClick={() => bringForward(selected.uid)} label={ct.bringForward}><ArrowUp size={12} /></IconBtn>
                  <IconBtn onClick={() => sendBackward(selected.uid)} label={ct.sendBack}><ArrowDown size={12} /></IconBtn>
                  <IconBtn onClick={() => updateTree(selected.uid, { flipped: !selected.flipped })} label={ct.flip}><FlipHorizontal2 size={12} /></IconBtn>
                  <IconBtn onClick={() => updateTree(selected.uid, { rotation: 0, scale: 1, opacity: 1 })} label={ct.reset}><RotateCcw size={12} /></IconBtn>
                  <IconBtn onClick={() => removeTree(selected.uid)} label={ct.delete} danger><Trash2 size={12} /></IconBtn>
                  <IconBtn onClick={() => setSelectedUid(null)} label="Close"><X size={12} /></IconBtn>
                </div>
              </div>

              {/* Sliders — stacked vertically on mobile so they fit */}
              <div className="px-3 py-2.5 space-y-2.5">
                <Slider label={ct.size} value={selected.scale} min={0.3} max={2.5} step={0.05} onChange={v => updateTree(selected.uid, { scale: v })} format={v => `${Math.round(v * 100)}%`} />
                <Slider label={ct.rotation} value={selected.rotation} min={-30} max={30} step={1} onChange={v => updateTree(selected.uid, { rotation: v })} format={v => `${Math.round(v)}°`} />
                <Slider label={ct.opacity} value={selected.opacity} min={0.2} max={1} step={0.05} onChange={v => updateTree(selected.uid, { opacity: v })} format={v => `${Math.round(v * 100)}%`} />
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
    <button onClick={onClick} title={label} aria-label={label}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-forest-600 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-800'}`}>
      {children}
    </button>
  );
}

function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] uppercase tracking-wider text-forest-500 dark:text-forest-400 font-semibold w-16 flex-shrink-0">{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="apple-slider flex-1" />
      <span className="text-[11px] font-bold tabular-nums text-forest-900 dark:text-forest-100 w-10 text-right flex-shrink-0">{format(value)}</span>
    </div>
  );
}
