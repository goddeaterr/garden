'use client';

import { useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useTrees } from '@/lib/useTrees';
import type { Tree, TreeCategory, TreeSize } from '@/types';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice, cn } from '@/lib/utils';
import { ShoppingBag, Check, Apple, Flower2, TreePine, Sprout } from 'lucide-react';
import { BrandedSpinner } from '@/components/ui/BrandedSpinner';
import { TreeDetailModal } from './TreeDetailModal';
import { useCart } from '@/lib/cartContext';

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
function TreeCard({ tree, onOpen }: {
  tree: Tree;
  onOpen: (t: Tree) => void;
}) {
  const { tr } = useI18n();
  const { addItem, items, openCart } = useCart();
  const inCart = items.some(i => i.tree.id === tree.id);
  const CategoryIcon = CAT_ICON[tree.category] || Sprout;
  const rawMx = useMotionValue(0);
  const rawMy = useMotionValue(0);
  // Spring-smooth the raw mouse values so tilt eases in/out instead of snapping
  const mx = useSpring(rawMx, { stiffness: 120, damping: 22, mass: 0.6 });
  const my = useSpring(rawMy, { stiffness: 120, damping: 22, mass: 0.6 });
  const rotateX = useTransform(my, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mx, [-0.5, 0.5], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    rawMx.set((e.clientX - r.left) / r.width - 0.5);
    rawMy.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleMouseLeave = () => {
    rawMx.set(0);
    rawMy.set(0);
  };

  return (
    <motion.div
      className={`catalog-plant-card tree-card tree-card-${tree.category} group relative bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800/60 overflow-hidden cursor-pointer active:scale-[0.98]`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        // Explicit zero baseline so Framer Motion never interpolates from "none"
        boxShadow: `0 0px 0px 0px ${tree.color}00`,
      }}
      whileHover={{ boxShadow: `0 28px 56px -10px ${tree.color}55, 0 10px 24px -6px ${tree.color}30` }}
      transition={{
        // Tilt (MotionValues) use spring via useTransform — no transition needed here
        // boxShadow uses a slow smooth ease so it never glitches mid-exit
        boxShadow: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] },
      }}
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
        style={{
          background: tree.imagePath
            ? `radial-gradient(ellipse at 60% 80%, ${tree.color}60 0%, transparent 65%), rgb(8,18,10)`
            : `radial-gradient(ellipse at 50% 75%, ${tree.color}30 0%, transparent 68%)`,
        }}
      >
        {/* Outer: owns mix-blend-mode so it always composites against the dark plinth,
            regardless of what transforms happen inside */}
        <div
          className="w-full max-w-[120px] sm:max-w-[150px] mx-auto"
          style={(tree.builderImagePath || tree.imagePath) ? { mixBlendMode: 'screen' } : undefined}
        >
          {/* Inner: owns the hover lift — transform here can't break the blend context above */}
          <div className="transition-all duration-700 ease-out group-hover:-translate-y-3 group-hover:scale-[1.13] group-hover:brightness-110 will-change-transform">
            <TreeIllustration
              svg={tree.svg}
              imagePath={tree.builderImagePath || tree.imagePath}
              alt={tree.name}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[13px] sm:text-[15px] font-semibold text-forest-950 dark:text-forest-50 tracking-tight leading-tight">
            {tree.name}
          </h3>
          {/* In Stock indicator */}
          <span className="flex items-center gap-1 flex-shrink-0 ml-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 leading-none">In Stock</span>
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-forest-500 dark:text-forest-400 italic mb-2 sm:mb-3 truncate">
          {tree.latin} · {tree.height}
        </p>
        <button
          onClick={e => {
            e.stopPropagation();
            if (inCart) { openCart(); } else { addItem(tree); }
          }}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] sm:text-[12px] font-semibold active:scale-95 transition-all',
            inCart
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : 'bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 hover:bg-forest-800 dark:hover:bg-white'
          )}
        >
          {inCart ? <Check size={11} /> : <ShoppingBag size={11} />}
          {inCart ? 'Added — View Cart' : 'Add to Quote'}
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

  const hasActiveFilters = cat !== 'all' || size !== 'all' || maxPrice < PRICE_MAX;
  const clearFilters = () => { setCat('all'); setSize('all'); setMaxPrice(PRICE_MAX); };

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
              <div className="mt-3 h-[2px] w-14 rounded-full bg-gradient-to-r from-forest-600 via-emerald-500 to-transparent" />
            </div>
          </div>

          {/* Filters */}
          <div className="filter-panel bg-white/80 dark:bg-forest-950/80 rounded-2xl p-3 sm:p-4 border border-forest-200/60 dark:border-forest-800/60 mb-8">
            {/* Category pills + count + clear */}
            <div className="flex flex-wrap gap-1.5 mb-3 items-center">
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
              <div className="ml-auto flex items-center gap-1.5">
                {trees.length > 0 && (
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-forest-100 dark:bg-forest-800 text-forest-500 dark:text-forest-400 tabular-nums">
                    {filteredTrees.length} {filteredTrees.length === 1 ? 'tree' : 'trees'}
                  </span>
                )}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-forest-900/10 dark:bg-forest-100/10 text-forest-700 dark:text-forest-300 hover:bg-forest-900/20 dark:hover:bg-forest-100/20 transition-colors"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>

            {/* Price slider + size — stacked on mobile, side-by-side on sm+ */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2 sm:flex-1">
                <label className="text-[12px] text-forest-600 dark:text-forest-400 font-medium whitespace-nowrap">{c.maxPrice}</label>
                <input
                  type="range" min={0} max={1000} step={10} value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="apple-slider flex-1"
                  style={{
                    background: `linear-gradient(to right, #508153 0%, #508153 ${(maxPrice / 1000) * 100}%, rgba(60,80,64,0.2) ${(maxPrice / 1000) * 100}%, rgba(60,80,64,0.2) 100%)`,
                  }}
                />
                <span className="text-[13px] font-semibold tabular-nums text-forest-900 dark:text-forest-100 w-14 text-right">€{maxPrice}</span>
              </div>
              <div className="flex items-center gap-1">
                {(['all','small','medium','large'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={cn(
                      'px-2.5 py-1.5 text-[11px] sm:text-[12px] font-medium rounded-full transition-all',
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
                layout="position"
                initial={{ opacity: 0, y: 24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ delay: Math.min(i * 0.035, 0.25), duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                style={{ perspective: 900 }}
              >
                <TreeCard
                  tree={tree}
                  onOpen={setSelectedTree}
                />
              </motion.div>
            ))}
            </AnimatePresence>
            {filteredTrees.length === 0 && trees.length > 0 && (
              <div className="col-span-full text-center py-12 text-forest-500">{c.noResults}</div>
            )}
            {trees.length === 0 && (
              <>
                <div className="col-span-full flex flex-col items-center py-10 gap-2">
                  <BrandedSpinner size={56} label="Loading catalog…" />
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-forest-200/40 dark:border-forest-800/40 opacity-40">
                    <div className="aspect-square skeleton" />
                    <div className="px-3 pb-4 pt-3 space-y-2">
                      <div className="h-[14px] rounded-full skeleton w-3/4" />
                      <div className="h-[11px] rounded-full skeleton w-1/2" />
                      <div className="h-[38px] rounded-xl skeleton w-full mt-1" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      <TreeDetailModal
        tree={selectedTree}
        onClose={() => setSelectedTree(null)}
        onQuote={() => setSelectedTree(null)}
      />
    </>
  );
}
