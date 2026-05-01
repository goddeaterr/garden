'use client';

import { useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useTrees } from '@/lib/useTrees';
import type { Tree, TreeCategory, TreeSize } from '@/types';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice, cn } from '@/lib/utils';
import { MessageSquare, Apple, Flower2, TreePine, Sprout } from 'lucide-react';
import { TreeDetailModal } from './TreeDetailModal';
import { QuoteModal } from './QuoteModal';

const PRICE_MAX = 1000;

const CAT_ACTIVE: Record<string, string> = {
  all:        'bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900',
  fruit:      'bg-amber-500 text-white shadow-md shadow-amber-500/35',
  decorative: 'bg-[#6a9a4a] text-white shadow-md shadow-[#6a9a4a]/35',
  evergreen:  'bg-emerald-600 text-white shadow-md shadow-emerald-600/35',
  shrub:      'bg-violet-500 text-white shadow-md shadow-violet-500/35',
};

const CAT_ICON: Record<string, typeof Sprout> = {
  fruit: Apple,
  decorative: Flower2,
  evergreen: TreePine,
  shrub: Sprout,
};

/* ── Tree card ── */
function TreeCard({ tree, onOpen, onQuote }: {
  tree: Tree;
  onOpen: (t: Tree) => void;
  onQuote: (t: Tree) => void;
}) {
  const { tr } = useI18n();
  const CategoryIcon = CAT_ICON[tree.category] || Sprout;
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useTransform(my, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(mx, [-0.5, 0.5], [-7, 7]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleMouseLeave = () => { mx.set(0); my.set(0); };

  return (
    <motion.div
      className={`catalog-plant-card tree-card tree-card-${tree.category} group relative bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800/60 overflow-hidden cursor-pointer active:scale-[0.98] transition-colors duration-200`}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpen(tree)}
    >
      {/* Category badge */}
      <div className="absolute top-2 left-2 z-10">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium tracking-wide uppercase bg-white/80 dark:bg-forest-900/80 text-forest-700 dark:text-forest-300 backdrop-blur-sm">
          <CategoryIcon size={9} />
          {tree.category}
        </div>
      </div>

      {/* Floating price badge — overlaid on image area */}
      <div className="absolute top-2 right-2 z-10">
        <div className="px-2 py-0.5 rounded-full text-[11px] sm:text-[12px] font-bold tabular-nums bg-forest-950/80 dark:bg-white/90 text-white dark:text-forest-950 backdrop-blur-sm shadow-sm">
          {formatPrice(tree.price)}
        </div>
      </div>

      {/* Image area */}
      <div
        className="plant-plinth aspect-square flex items-end justify-center p-3 relative"
        style={{ background: `radial-gradient(ellipse at 50% 75%, ${tree.color}30 0%, transparent 68%)` }}
      >
        <div className="relative z-[1] w-full max-w-[120px] sm:max-w-[150px] mx-auto transition-transform duration-700 group-hover:-translate-y-1 group-hover:scale-105">
          <TreeIllustration
            svg={tree.svg}
            imagePath={tree.builderImagePath || tree.imagePath}
            alt={tree.name}
            className="w-full"
          />
        </div>
      </div>

      {/* Info — no border-t, gradient fade from image into info */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2">
        <h3 className="text-[13px] sm:text-[15px] font-semibold text-forest-950 dark:text-forest-50 mb-0.5 tracking-tight leading-tight">
          {tree.name}
        </h3>
        <p className="text-[10px] sm:text-[11px] text-forest-500 dark:text-forest-400 italic mb-2 sm:mb-3 truncate">
          {tree.latin} · {tree.height}
        </p>
        <button
          onClick={e => { e.stopPropagation(); onQuote(tree); }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] sm:text-[12px] font-semibold bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 active:scale-95 transition-transform hover:bg-forest-800 dark:hover:bg-white"
        >
          <MessageSquare size={11} />
          {(tr.catalog as any).requestQuote || 'Request Quote'}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main Catalog ── */
export function Catalog() {
  const trees = useTrees();
  const [cat, setCat] = useState<TreeCategory | 'all'>('all');
  const [size, setSize] = useState<TreeSize | 'all'>('all');
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [quoteTree, setQuoteTree] = useState<Tree | null>(null);
  const { tr } = useI18n();
  const c = tr.catalog;

  const categories = [
    { value: 'all' as const, label: c.allCats },
    { value: 'fruit' as const, label: c.fruit },
    { value: 'decorative' as const, label: c.decorative },
    { value: 'evergreen' as const, label: c.evergreen },
    { value: 'shrub' as const, label: c.shrub },
  ];

  const filteredTrees = useMemo(() => {
    return trees.filter(t => {
      if (cat !== 'all' && t.category !== cat) return false;
      if (size !== 'all' && t.size !== size) return false;
      if (t.price > maxPrice) return false;
      return true;
    });
  }, [trees, cat, size, maxPrice]);

  return (
    <>
      <section id="catalog" className="botanical-section-texture relative py-16 sm:py-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-forest-50 via-white to-forest-50 dark:from-forest-950 dark:via-forest-900/80 dark:to-forest-950" />
        {/* Organic animated blobs replace the old white grid */}
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="catalog-blob catalog-blob-1" />
          <div className="catalog-blob catalog-blob-2" />
          <div className="catalog-blob catalog-blob-3" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="text-[11px] tracking-[0.3em] uppercase text-forest-600 dark:text-forest-400 mb-2">{c.eyebrow}</div>
              <h2 className="shimmer-title text-headline text-[clamp(1.75rem,5vw,4rem)]">{c.title}</h2>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-panel bg-white/80 dark:bg-forest-950/80 rounded-2xl p-3 sm:p-4 border border-forest-200/60 dark:border-forest-800/60 mb-8">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {categories.map(cat_ => (
                <button
                  key={cat_.value}
                  onClick={() => setCat(cat_.value)}
                  className={cn(
                    'px-3 py-1.5 text-[12px] sm:text-[13px] font-medium rounded-full transition-all duration-200',
                    cat === cat_.value
                      ? CAT_ACTIVE[cat_.value]
                      : 'text-forest-700 dark:text-forest-300 bg-forest-100 dark:bg-forest-800 hover:bg-forest-200 dark:hover:bg-forest-700'
                  )}
                >
                  {cat_.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <label className="text-[12px] text-forest-600 dark:text-forest-400 font-medium whitespace-nowrap">{c.maxPrice}</label>
                <input
                  type="range" min={0} max={1000} step={10} value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="apple-slider flex-1 min-w-[80px]"
                />
                <span className="text-[13px] font-semibold tabular-nums text-forest-900 dark:text-forest-100 w-14 text-right">€{maxPrice}</span>
              </div>
              <div className="flex items-center gap-1">
                {(['all','small','medium','large'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-medium rounded-full transition-all',
                      size === s
                        ? 'bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900'
                        : 'text-forest-600 dark:text-forest-400 bg-forest-100 dark:bg-forest-800 hover:bg-forest-200 dark:hover:bg-forest-700'
                    )}
                  >
                    {s === 'all' ? c.sizeAll : s === 'small' ? c.sizeSmall : s === 'medium' ? c.sizeMedium : c.sizeLarge}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            <AnimatePresence mode="popLayout">
            {filteredTrees.map((tree, i) => (
              <motion.div
                key={tree.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.93 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88, y: -12, transition: { duration: 0.22 } }}
                transition={{ delay: i * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ perspective: 900 }}
              >
                <TreeCard
                  tree={tree}
                  onOpen={setSelectedTree}
                  onQuote={setQuoteTree}
                />
              </motion.div>
            ))}
            </AnimatePresence>
            {filteredTrees.length === 0 && trees.length > 0 && (
              <div className="col-span-full text-center py-12 text-forest-500">{c.noResults}</div>
            )}
            {trees.length === 0 && (
              <div className="col-span-full text-center py-12 text-forest-500">
                <TreePine size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-[14px]">Loading catalog…</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <TreeDetailModal
        tree={selectedTree}
        onClose={() => setSelectedTree(null)}
        onQuote={() => { setQuoteTree(selectedTree); setSelectedTree(null); }}
      />
      <QuoteModal tree={quoteTree} onClose={() => setQuoteTree(null)} />
    </>
  );
}
