'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrees } from '@/lib/useTrees';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { useGarden } from './GardenContext';
import { formatPrice, cn } from '@/lib/utils';
import { ChevronLeft, Plus, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import type { TreeCategory } from '@/types';

export function TreePalette() {
  const [open, setOpen] = useState(true);
  const [cat, setCat] = useState<TreeCategory | 'all'>('all');
  const [query, setQuery] = useState('');
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

  const filtered = trees.filter((t) => {
    if (cat !== 'all' && t.category !== cat) return false;
    if (query && !t.name.toLowerCase().includes(query.toLowerCase()) && !t.latin.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const handleDragStart = (treeId: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/tree-id', treeId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClick = (treeId: string) => () => addTree(treeId, 0.5, 0.7);

  return (
    <div className="absolute top-4 left-4 bottom-4 z-30 flex items-stretch" data-builder-ui>
      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="palette-shell glass-strong rounded-2xl w-[300px] flex flex-col overflow-hidden shadow-2xl shadow-forest-900/10"
          >
            <div className="p-4 pb-3 border-b border-forest-200/50 dark:border-forest-800/50">
              <div className="text-[11px] uppercase tracking-[0.25em] text-forest-500 dark:text-forest-400 mb-1">{p.library}</div>
              <div className="text-[15px] font-semibold text-forest-950 dark:text-forest-50 mb-3">{p.dragHint}</div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={p.searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-[13px] bg-forest-50 dark:bg-forest-900/60 rounded-lg border-0 outline-none focus:ring-2 focus:ring-forest-300 dark:focus:ring-forest-700 placeholder:text-forest-400 text-forest-900 dark:text-forest-100"
                />
              </div>
            </div>

            <div className="px-4 py-3 flex flex-wrap gap-1 border-b border-forest-200/50 dark:border-forest-800/50">
              {cats.map((c) => (
                <button key={c.value} onClick={() => setCat(c.value)}
                  className={cn('px-2.5 py-1 text-[11px] font-medium rounded-full transition-all',
                    cat === c.value
                      ? 'bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900'
                      : 'text-forest-700 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-800'
                  )}>
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 no-scrollbar">
              {filtered.length === 0 ? (
                <div className="text-center text-forest-500 dark:text-forest-400 text-sm py-12">{p.noResults}</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map((tree) => (
                    <div
                      key={tree.id}
                      draggable
                      onDragStart={handleDragStart(tree.id)}
                      onClick={handleClick(tree.id)}
                      className="palette-plant-tile group relative cursor-grab active:cursor-grabbing rounded-xl bg-white/70 dark:bg-forest-900/40 hover:bg-white dark:hover:bg-forest-900/80 border border-forest-200/40 dark:border-forest-800/40 hover:border-forest-300 dark:hover:border-forest-700 p-2 transition-all"
                    >
                      <div className="absolute top-2 right-2 z-[2] w-5 h-5 rounded-full bg-forest-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={11} />
                      </div>
                      <div className="plant-plinth aspect-square flex items-end justify-center">
                        <div className="relative z-[1] transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105">
                          <TreeIllustration svg={tree.svg} imagePath={tree.builderImagePath || tree.imagePath} alt={tree.name} className="w-full max-w-[80px] aspect-square" />
                        </div>
                      </div>
                      <div className="mt-1 text-center">
                        <div className="text-[11px] font-medium text-forest-950 dark:text-forest-50 leading-tight truncate">{tree.name}</div>
                        <div className="text-[10px] text-forest-500 dark:text-forest-400 tabular-nums mt-0.5">{formatPrice(tree.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-forest-200/50 dark:border-forest-800/50 text-[11px] text-forest-500 dark:text-forest-400">
              {p.tapHint}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Collapse palette' : 'Open palette'}
        className="self-center -ml-px w-6 h-16 glass-strong rounded-r-lg flex items-center justify-center hover:bg-white dark:hover:bg-forest-900 transition-colors"
      >
        <motion.div animate={{ rotate: open ? 0 : 180 }} transition={{ duration: 0.3 }}>
          <ChevronLeft size={14} className="text-forest-700 dark:text-forest-300" />
        </motion.div>
      </button>
    </div>
  );
}
