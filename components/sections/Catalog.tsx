'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useTrees } from '@/lib/useTrees';
import type { Tree, TreeCategory, TreeSize } from '@/types';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice, cn } from '@/lib/utils';
import { ShoppingBag, Check, Trees, TreePine, Sprout, Flower, Flower2, Wind, Rows4, Sun, Wheat } from 'lucide-react';
import { BrandedSpinner } from '@/components/ui/BrandedSpinner';
import { TreeDetailModal } from './TreeDetailModal';
import { useCart } from '@/lib/cartContext';

const PRICE_MAX = 1000;

const CAT_ACTIVE: Record<string, string> = {
  trees:     'bg-forest-700  text-white shadow-md shadow-forest-700/35',
  shrubs:    'bg-teal-600    text-white shadow-md shadow-teal-600/35',
  perennial: 'bg-pink-500    text-white shadow-md shadow-pink-500/35',
  annual:    'bg-amber-500   text-white shadow-md shadow-amber-500/35',
  conifer:   'bg-emerald-700 text-white shadow-md shadow-emerald-700/35',
  climbing:  'bg-violet-500  text-white shadow-md shadow-violet-500/35',
  hedge:     'bg-lime-600    text-white shadow-md shadow-lime-600/35',
  potted:    'bg-orange-500  text-white shadow-md shadow-orange-500/35',
  grass:     'bg-yellow-600  text-white shadow-md shadow-yellow-600/35',
};

const CAT_ICON: Record<string, typeof Sprout> = {
  trees:     Trees,
  shrubs:    Sprout,
  perennial: Flower,
  annual:    Flower2,
  conifer:   TreePine,
  climbing:  Wind,
  hedge:     Rows4,
  potted:    Sun,
  grass:     Wheat,
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
          style={tree.imagePath ? { mixBlendMode: 'screen' } : undefined}
        >
          {/* Inner: owns the hover lift — transform here can't break the blend context above */}
          <div className="transition-all duration-700 ease-out group-hover:-translate-y-3 group-hover:scale-[1.13] group-hover:brightness-110 will-change-transform">
            <TreeIllustration
              svg={tree.svg}
              imagePath={tree.imagePath}
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
            <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 leading-none">{(tr.catalog as any).inStock}</span>
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
          {inCart ? (tr.catalog as any).addedViewCart : (tr.catalog as any).addToQuote}
        </button>
      </div>
    </motion.div>
  );
}

const CAT_STYLES: Record<string, { card: string; icon: string; dot: string }> = {
  trees:     { card: 'from-forest-50 to-forest-100/60 dark:from-forest-950/40 dark:to-forest-900/20 border-forest-200/60 dark:border-forest-700/30',   icon: 'bg-forest-100 dark:bg-forest-900/50 text-forest-700 dark:text-forest-300',   dot: 'bg-forest-600'  },
  shrubs:    { card: 'from-teal-50 to-teal-100/60 dark:from-teal-950/40 dark:to-teal-900/20 border-teal-200/60 dark:border-teal-700/30',               icon: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',           dot: 'bg-teal-500'    },
  perennial: { card: 'from-pink-50 to-pink-100/60 dark:from-pink-950/40 dark:to-pink-900/20 border-pink-200/60 dark:border-pink-700/30',               icon: 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300',           dot: 'bg-pink-500'    },
  annual:    { card: 'from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200/60 dark:border-amber-700/30',         icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300',       dot: 'bg-amber-500'   },
  conifer:   { card: 'from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/30', icon: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-600' },
  climbing:  { card: 'from-violet-50 to-violet-100/60 dark:from-violet-950/40 dark:to-violet-900/20 border-violet-200/60 dark:border-violet-700/30',   icon: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300',   dot: 'bg-violet-500'  },
  hedge:     { card: 'from-lime-50 to-lime-100/60 dark:from-lime-950/40 dark:to-lime-900/20 border-lime-200/60 dark:border-lime-700/30',               icon: 'bg-lime-100 dark:bg-lime-900/50 text-lime-700 dark:text-lime-300',           dot: 'bg-lime-600'    },
  potted:    { card: 'from-orange-50 to-orange-100/60 dark:from-orange-950/40 dark:to-orange-900/20 border-orange-200/60 dark:border-orange-700/30',   icon: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300',   dot: 'bg-orange-500'  },
  grass:     { card: 'from-yellow-50 to-yellow-100/60 dark:from-yellow-950/40 dark:to-yellow-900/20 border-yellow-200/60 dark:border-yellow-700/30',   icon: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',   dot: 'bg-yellow-500'  },
};

/* ── Main Catalog ── */
export function Catalog() {
  const trees = useTrees();
  const { addItem, openCart } = useCart();
  const [activeCat, setActiveCat] = useState<TreeCategory | null>(null);
  const [size, setSize] = useState<TreeSize | 'all'>('all');
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const { tr } = useI18n();
  const c = tr.catalog;

  const categoryDefs = [
    { value: 'trees'     as TreeCategory, label: (c as any).trees,     icon: Trees    },
    { value: 'shrubs'    as TreeCategory, label: (c as any).shrubs,    icon: Sprout   },
    { value: 'perennial' as TreeCategory, label: (c as any).perennial, icon: Flower   },
    { value: 'annual'    as TreeCategory, label: (c as any).annual,    icon: Flower2  },
    { value: 'conifer'   as TreeCategory, label: (c as any).conifer,   icon: TreePine },
    { value: 'climbing'  as TreeCategory, label: (c as any).climbing,  icon: Wind     },
    { value: 'hedge'     as TreeCategory, label: (c as any).hedge,     icon: Rows4    },
    { value: 'potted'    as TreeCategory, label: (c as any).potted,    icon: Sun      },
    { value: 'grass'     as TreeCategory, label: (c as any).grass,     icon: Wheat    },
  ];

  const filteredTrees = useMemo(() => {
    if (!activeCat) return [];
    return trees.filter(t => {
      if (t.category !== activeCat) return false;
      if (size !== 'all' && t.size !== size) return false;
      if (t.price > maxPrice) return false;
      return true;
    });
  }, [trees, activeCat, size, maxPrice]);

  const openCategory = (cat: TreeCategory) => {
    setSize('all');
    setMaxPrice(PRICE_MAX);
    setActiveCat(cat);
  };

  const goBack = () => setActiveCat(null);

  useEffect(() => {
    const handler = (e: Event) => {
      openCategory((e as CustomEvent).detail as TreeCategory);
    };
    window.addEventListener('heroCatSelect', handler);
    return () => window.removeEventListener('heroCatSelect', handler);
  }, []);

  return (
    <>
      <section id="catalog" className="botanical-section-texture relative py-16 sm:py-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-forest-50 via-white to-forest-50 dark:from-forest-950 dark:via-forest-900/80 dark:to-forest-950" />
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="catalog-blob catalog-blob-1" />
          <div className="catalog-blob catalog-blob-2" />
          <div className="catalog-blob catalog-blob-3" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="text-[11px] tracking-[0.3em] uppercase text-forest-600 dark:text-forest-400 mb-2">{c.eyebrow}</div>
            <h2 className="shimmer-title text-headline text-[clamp(1.75rem,5vw,4rem)] leading-[1.2] pb-3">
              {activeCat ? categoryDefs.find(d => d.value === activeCat)?.label ?? c.title : c.title}
            </h2>
            <div className="mt-3 h-[2px] w-14 rounded-full bg-gradient-to-r from-forest-600 via-emerald-500 to-transparent" />
          </div>

          <AnimatePresence mode="wait">
            {/* ── No category selected placeholder ── */}
            {!activeCat && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-4 text-forest-400 dark:text-forest-600"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
                <p className="text-[14px] font-medium">Select a category above to browse plants</p>
              </motion.div>
            )}

            {/* ── Tree grid view ── */}
            {activeCat && (
              <motion.div
                key={activeCat}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Filters — price + size only */}
                <div className="filter-panel bg-white/80 dark:bg-forest-950/80 rounded-2xl p-3 sm:p-4 border border-forest-200/60 dark:border-forest-800/60 mb-8">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2 sm:flex-1">
                      <label className="text-[12px] text-forest-600 dark:text-forest-400 font-medium whitespace-nowrap">{c.maxPrice}</label>
                      <input
                        type="range" min={0} max={1000} step={10} value={maxPrice}
                        onChange={e => setMaxPrice(Number(e.target.value))}
                        className="apple-slider flex-1"
                        style={{ background: `linear-gradient(to right, #508153 0%, #508153 ${(maxPrice / 1000) * 100}%, rgba(60,80,64,0.2) ${(maxPrice / 1000) * 100}%, rgba(60,80,64,0.2) 100%)` }}
                      />
                      <span className="text-[13px] font-semibold tabular-nums text-forest-900 dark:text-forest-100 w-14 text-right">€{maxPrice}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {(['all','small','medium','large'] as const).map(s => (
                        <button key={s} onClick={() => setSize(s)}
                          className={cn('px-2.5 py-1.5 text-[11px] sm:text-[12px] font-medium rounded-full transition-all',
                            size === s ? 'bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900'
                              : 'text-forest-600 dark:text-forest-400 bg-forest-100 dark:bg-forest-800 hover:bg-forest-200 dark:hover:bg-forest-700'
                          )}
                        >
                          {s === 'all' ? c.sizeAll : s === 'small' ? c.sizeSmall : s === 'medium' ? c.sizeMedium : c.sizeLarge}
                        </button>
                      ))}
                      <span className="ml-3 text-[11px] font-medium px-2.5 py-1 rounded-full bg-forest-100 dark:bg-forest-800 text-forest-500 dark:text-forest-400 tabular-nums">
                        {filteredTrees.length} {filteredTrees.length === 1 ? c.countSingle.split(' ')[0] : c.countPlural.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  <AnimatePresence mode="popLayout">
                    {filteredTrees.map((tree, i) => (
                      <motion.div key={tree.id} layout="position"
                        initial={{ opacity: 0, y: 36, scale: 0.88, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)', transition: { duration: 0.18 } }}
                        transition={{ delay: Math.min(i * 0.055, 0.32), duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                        style={{ perspective: 900 }}
                      >
                        <TreeCard tree={tree} onOpen={setSelectedTree} />
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <TreeDetailModal
        tree={selectedTree}
        onClose={() => setSelectedTree(null)}
        onQuote={() => {
          if (selectedTree) addItem(selectedTree);
          setSelectedTree(null);
          window.setTimeout(openCart, 80);
        }}
      />
    </>
  );
}
