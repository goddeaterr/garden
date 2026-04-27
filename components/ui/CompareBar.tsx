'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart2, ArrowUpRight } from 'lucide-react';

interface CompareItem { slug: string; name: string; bestPrice: number; category: string; }

interface Props {
  items: CompareItem[];
  onRemove: (slug: string) => void;
  onClear: () => void;
}

const CAT_EMOJI: Record<string, string> = { fruit: '🍎', decorative: '🌸', evergreen: '🌲', shrub: '🌿' };

export function CompareBar({ items, onRemove, onClear }: Props) {
  if (items.length === 0) return null;

  const handleCompare = () => {
    const params = items.map(i => i.slug).join(',');
    window.location.href = `/compare?slugs=${params}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[380] w-[calc(100vw-2rem)] max-w-2xl"
      >
        <div className="bg-white dark:bg-forest-900 rounded-2xl border border-forest-200 dark:border-forest-700 shadow-2xl shadow-forest-900/15 p-3 flex items-center gap-3">
          <BarChart2 size={16} className="text-forest-500 flex-shrink-0" />
          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {items.map(item => (
              <div key={item.slug} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 dark:bg-forest-800 border border-forest-200 dark:border-forest-700">
                <span className="text-sm">{CAT_EMOJI[item.category] || '🌳'}</span>
                <span className="text-[12px] font-medium text-forest-900 dark:text-forest-100 whitespace-nowrap">{item.name}</span>
                <span className="text-[11px] text-emerald-600 font-bold tabular-nums">€{item.bestPrice.toFixed(0)}</span>
                <button onClick={() => onRemove(item.slug)} className="text-forest-400 hover:text-red-500 transition-colors">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={onClear} className="text-[12px] text-forest-400 hover:text-forest-700 dark:hover:text-forest-200 transition-colors whitespace-nowrap">
              Clear
            </button>
            <button onClick={handleCompare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[13px] font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform whitespace-nowrap">
              Compare {items.length}
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
