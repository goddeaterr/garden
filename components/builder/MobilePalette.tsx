'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTrees } from '@/lib/useTrees';
import { useGarden } from './GardenContext';
import { formatPrice, cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18nContext';
import type { TreeCategory } from '@/types';

export function MobilePalette() {
  const [trayOpen, setTrayOpen] = useState(false);
  const [cat, setCat] = useState<TreeCategory | 'all'>('all');
  const trees = useTrees();
  const { addTree } = useGarden();
  const { tr } = useI18n();
  const p = tr.palette;

  const cats = [
    { value: 'all' as const, label: p.all },
    { value: 'fruit' as const, label: p.fruit },
    { value: 'decorative' as const, label: p.decorative },
    { value: 'evergreen' as const, label: p.evergreen },
    { value: 'shrub' as const, label: p.shrub },
  ];

  const filtered = trees.filter(t => cat === 'all' || t.category === cat);

  const handleAdd = (treeId: string) => {
    addTree(treeId, 0.5, 0.65);
    setTrayOpen(false);
  };

  return (
    <>
      {/* Full-screen tray — position:fixed so it floats OVER canvas, not pushing it */}
      <AnimatePresence>
        {trayOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 310, background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setTrayOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 320, maxHeight: '65dvh', display: 'flex', flexDirection: 'column', borderRadius: '16px 16px 0 0' }}
              className="bg-white dark:bg-forest-900 border-t border-forest-200 dark:border-forest-800"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div style={{ width: 36, height: 4 }} className="rounded-full bg-forest-300 dark:bg-forest-700" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
                <span className="text-[14px] font-bold text-forest-950 dark:text-forest-50">{p.library}</span>
                <span className="text-[12px] text-forest-500">{trees.length} augalų</span>
              </div>

              {/* Category pills */}
              <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
                {cats.map(c => (
                  <button key={c.value} onClick={() => setCat(c.value)}
                    className={cn('flex-shrink-0 px-3 py-1 text-[11px] font-semibold rounded-full',
                      cat === c.value
                        ? 'bg-forest-900 dark:bg-forest-50 text-white dark:text-forest-900'
                        : 'bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300'
                    )}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Tree grid — scrollable */}
              <div className="overflow-y-auto no-scrollbar flex-1 px-3 pb-4">
                <div className="grid grid-cols-4 gap-2">
                  {filtered.map(tree => (
                    <button key={tree.id} onClick={() => handleAdd(tree.id)}
                      className="rounded-xl bg-forest-50 dark:bg-forest-800 border border-forest-200/60 dark:border-forest-700/60 p-2 flex flex-col items-center active:scale-95 transition-transform">
                      {tree.imagePath
                        ? <img src={tree.imagePath} alt={tree.name} style={{ width: '100%', height: 56, objectFit: 'contain', objectPosition: 'bottom' }} draggable={false} />
                        : <div style={{ width: '100%', height: 56, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: tree.svg }} />}
                      <div className="mt-1 text-center w-full">
                        <div className="text-[10px] font-medium text-forest-900 dark:text-forest-100 truncate leading-tight">{tree.name.split(' ')[0]}</div>
                        <div className="text-[9px] text-forest-500 dark:text-forest-400 tabular-nums">{formatPrice(tree.price)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Always-visible strip — exactly 62px, never grows */}
      <div
        style={{ flexShrink: 0, height: 62, display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 8, gap: 6, overflowX: 'auto' }}
        className="bg-white/95 dark:bg-forest-900/95 border-t border-forest-200/60 dark:border-forest-800/60 no-scrollbar"
      >
        {trees.slice(0, 7).map(tree => (
          <button key={tree.id} onClick={() => handleAdd(tree.id)}
            style={{ flexShrink: 0, width: 50, height: 50, borderRadius: 12, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}
            className="bg-forest-50 dark:bg-forest-800 border border-forest-200/60 dark:border-forest-700/60 active:scale-90 transition-transform">
            {tree.imagePath
              ? <img src={tree.imagePath} alt={tree.name} style={{ width: '100%', height: 34, objectFit: 'contain', objectPosition: 'bottom' }} draggable={false} />
              : <div style={{ width: '100%', height: 34, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: tree.svg }} />}
            <div style={{ fontSize: 8, marginTop: 1 }} className="text-forest-600 dark:text-forest-300 truncate w-full text-center">{tree.name.split(' ')[0]}</div>
          </button>
        ))}

        <button onClick={() => setTrayOpen(true)}
          style={{ flexShrink: 0, width: 50, height: 50, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          className="bg-forest-900 dark:bg-forest-100 active:scale-90 transition-transform">
          <span style={{ fontSize: 13, fontWeight: 700 }} className="text-white dark:text-forest-900">+{Math.max(0, trees.length - 7)}</span>
          <span style={{ fontSize: 8 }} className="text-white/70 dark:text-forest-600">daugiau</span>
        </button>
      </div>
    </>
  );
}
