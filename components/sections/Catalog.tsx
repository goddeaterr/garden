'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrees } from '@/lib/useTrees';
import type { TreeCategory, TreeSize } from '@/types';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { useGarden } from '@/components/builder/GardenContext';
import { useI18n } from '@/lib/i18nContext';
import { formatPrice, cn } from '@/lib/utils';
import { Plus, Check, Heart, ExternalLink, TrendingDown, Users, Shield, ChevronDown, ChevronUp, ArrowUpRight, RefreshCw } from 'lucide-react';
import { TreeDetailModal } from './TreeDetailModal';
import { toggleWishlist, isWishlisted } from '@/lib/wishlist';

const PRICE_MAX = 400;

/* ── Marketplace types ── */
interface MarketplaceOffer {
  productId: string; sellerName: string; sourceUrl: string; price: number;
  originalPrice?: number; height?: string; stockStatus: string; imageUrl?: string; localImagePath?: string; scrapedAt: string;
}
interface MarketplaceGroup {
  slug: string; canonicalName: string; latinName?: string; category: string;
  bestPrice: number; offers: MarketplaceOffer[]; updatedAt: string;
}
interface MarketplaceData {
  updatedAt: string; totalGroups: number; groups: MarketplaceGroup[];
}

/* ── Price comparison card ── */
function ComparisonCard({ group, onAdd }: { group: MarketplaceGroup; onAdd: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const savings = group.offers.length > 1
    ? group.offers[group.offers.length - 1].price - group.bestPrice
    : 0;

  useEffect(() => { setWishlisted(isWishlisted(group.slug)); }, [group.slug]);

  const CAT_EMOJI: Record<string, string> = { fruit:'🍎', decorative:'🌸', evergreen:'🌲', shrub:'🌿' };
  const CAT_COLOR: Record<string, string> = {
    fruit: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    decorative: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
    evergreen: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    shrub: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  };

  return (
    <div className="bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800 overflow-hidden hover:border-forest-300 dark:hover:border-forest-700 transition-colors">
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Image */}
          <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden bg-forest-50 dark:bg-forest-800 flex items-center justify-center text-2xl">
            {(group.offers[0]?.localImagePath || group.offers[0]?.imageUrl)
              ? <img src={group.offers[0].localImagePath || group.offers[0].imageUrl} alt={group.canonicalName} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }}/>
              : <span>{CAT_EMOJI[group.category] || '🌳'}</span>}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[14px] font-bold text-forest-950 dark:text-forest-50 leading-tight">{group.canonicalName}</h3>
                {group.latinName && <p className="text-[11px] text-forest-400 italic mt-0.5">{group.latinName}</p>}
              </div>
              <button
                onClick={e => { e.stopPropagation(); const a = toggleWishlist(group.slug); setWishlisted(a); }}
                className="w-7 h-7 rounded-full bg-forest-50 dark:bg-forest-800 flex items-center justify-center flex-shrink-0">
                <Heart size={13} className={wishlisted ? 'text-red-500 fill-red-500' : 'text-forest-400'}/>
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', CAT_COLOR[group.category] || 'bg-forest-50 text-forest-600 border-forest-200')}>
                {group.category}
              </span>
              <span className="text-[11px] text-forest-500 flex items-center gap-1">
                <Users size={10}/>{group.offers.length} seller{group.offers.length !== 1 ? 's' : ''}
              </span>
              {savings > 1 && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingDown size={10}/>Save €{savings.toFixed(0)}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <div className="text-[11px] text-forest-500 mb-0.5">from</div>
            <div className="text-[20px] font-black text-emerald-600 tabular-nums leading-none">€{group.bestPrice.toFixed(0)}</div>
            {group.offers.length > 1 && (
              <div className="text-[10px] text-forest-400">to €{group.offers[group.offers.length-1].price.toFixed(0)}</div>
            )}
          </div>
        </div>

        {/* Collapsed price rows */}
        {!expanded && (
          <div className="mt-3 space-y-1.5">
            {group.offers.slice(0, 3).map((offer, j) => (
              <div key={j} className={cn('flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px]',
                j === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-forest-50 dark:bg-forest-800/50')}>
                <div className="flex items-center gap-1.5">
                  {j === 0
                    ? <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={8} className="text-white"/></span>
                    : <span className="w-4 h-4 rounded-full bg-forest-200 dark:bg-forest-700 flex items-center justify-center text-[9px] font-bold text-forest-600 dark:text-forest-400">{j+1}</span>}
                  <span className="text-forest-700 dark:text-forest-300 flex items-center gap-1">
                    {offer.sellerName}
                    <Shield size={9} className="text-forest-400"/>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('font-bold tabular-nums', j === 0 ? 'text-emerald-600' : 'text-forest-800 dark:text-forest-200')}>
                    €{offer.price.toFixed(2)}
                  </span>
                  <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-forest-400 hover:text-forest-700 dark:hover:text-forest-200 transition-colors">
                    <ExternalLink size={11}/>
                  </a>
                </div>
              </div>
            ))}
            {group.offers.length > 3 && (
              <button onClick={() => setExpanded(true)} className="w-full text-center text-[11px] text-forest-400 hover:text-forest-600 flex items-center justify-center gap-1 py-1">
                <ChevronDown size={12}/>Show {group.offers.length - 3} more
              </button>
            )}
          </div>
        )}

        {/* Expanded */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }} className="overflow-hidden">
              <div className="mt-3 space-y-1.5">
                {group.offers.map((offer, j) => (
                  <div key={j} className={cn('flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px]',
                    j === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-forest-50 dark:bg-forest-800/50')}>
                    <div className="flex items-center gap-1.5">
                      {j === 0
                        ? <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={8} className="text-white"/></span>
                        : <span className="w-4 h-4 rounded-full bg-forest-200 dark:bg-forest-700 flex items-center justify-center text-[9px] font-bold text-forest-600">{j+1}</span>}
                      <span className="text-forest-700 dark:text-forest-300">{offer.sellerName}</span>
                      {offer.height && <span className="text-forest-400 text-[10px]">{offer.height}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {offer.originalPrice && offer.originalPrice > offer.price && (
                        <span className="text-[10px] text-forest-400 line-through">€{offer.originalPrice.toFixed(2)}</span>
                      )}
                      <span className={cn('font-bold tabular-nums', j === 0 ? 'text-emerald-600' : 'text-forest-800 dark:text-forest-200')}>
                        €{offer.price.toFixed(2)}
                      </span>
                      <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-forest-900 dark:bg-forest-50 text-white dark:text-forest-900 text-[10px] font-semibold hover:opacity-90">
                        Buy <ExternalLink size={9}/>
                      </a>
                    </div>
                  </div>
                ))}
                <button onClick={() => setExpanded(false)} className="w-full text-center text-[11px] text-forest-400 hover:text-forest-600 flex items-center justify-center gap-1 py-1">
                  <ChevronUp size={12}/>Collapse
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-forest-100 dark:border-forest-800 flex items-center justify-between gap-2 bg-forest-50/50 dark:bg-forest-950/30">
        <a href={group.offers[0]?.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-colors">
          Best price <ArrowUpRight size={12}/>
        </a>
        <button onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[12px] font-medium hover:opacity-90 transition-opacity">
          <Plus size={12}/>Add to garden
        </button>
      </div>
    </div>
  );
}

/* ── Static tree card (fallback) ── */
function StaticTreeCard({ tree, onOpen, onAdd, isPlaced, pulse, wishlisted, onWishlist }: any) {
  return (
    <div className="bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800/60 overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:border-forest-300 dark:hover:border-forest-700"
      onClick={() => onOpen(tree)}>
      <button onClick={e => { e.stopPropagation(); onWishlist(tree.id, e); }}
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/80 dark:bg-forest-800/80 flex items-center justify-center shadow-sm">
        <Heart size={13} className={wishlisted ? 'text-red-500 fill-red-500' : 'text-forest-400'}/>
      </button>
      <div className="absolute top-2 left-2 z-10">
        <div className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium tracking-wide uppercase bg-white/80 dark:bg-forest-900/80 text-forest-700 dark:text-forest-300">
          {tree.category}
        </div>
      </div>
      <div className="aspect-square flex items-end justify-center p-3 relative">
        <div className="w-full max-w-[120px] sm:max-w-[150px] mx-auto">
          <TreeIllustration svg={tree.svg} imagePath={tree.imagePath} alt={tree.name} className="w-full"/>
        </div>
      </div>
      <div className="p-3 sm:p-4 pt-2 border-t border-forest-100 dark:border-forest-800/60">
        <h3 className="text-[13px] sm:text-[15px] font-semibold text-forest-950 dark:text-forest-50 mb-0.5 tracking-tight leading-tight">{tree.name}</h3>
        <p className="text-[10px] sm:text-[11px] text-forest-500 dark:text-forest-400 italic mb-2 sm:mb-3 truncate">{tree.latin} · {tree.height}</p>
        <div className="flex items-center justify-between gap-1">
          <div className="text-[13px] sm:text-[15px] font-semibold tabular-nums text-forest-950 dark:text-forest-50">{formatPrice(tree.price)}</div>
          <button onClick={e => { e.stopPropagation(); onAdd(tree.id); }}
            className={cn('flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-medium transition-all',
              isPlaced ? 'bg-forest-100 text-forest-800 dark:bg-forest-800 dark:text-forest-100' : 'bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 active:scale-95')}>
            {isPlaced ? <Check size={11}/> : <Plus size={11}/>}
            <span className="hidden sm:inline">{isPlaced ? 'Added' : 'Add to garden'}</span>
            <span className="sm:hidden">{isPlaced ? '✓' : '+'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Catalog ── */
export function Catalog() {
  const staticTrees = useTrees();
  const [cat, setCat] = useState<TreeCategory | 'all'>('all');
  const [size, setSize] = useState<TreeSize | 'all'>('all');
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const { addTree, placed } = useGarden();
  const [pulse, setPulse] = useState<string | null>(null);
  const [selectedTree, setSelectedTree] = useState<typeof staticTrees[0] | null>(null);
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});
  const { tr } = useI18n();
  const c = tr.catalog;

  /* Marketplace data */
  const [marketplace, setMarketplace] = useState<MarketplaceData | null>(null);
  const [mpLoading, setMpLoading] = useState(true);
  const [view, setView] = useState<'comparison' | 'static'>('comparison');

  useEffect(() => {
    fetch('/marketplace.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setMarketplace(d); })
      .catch(() => {})
      .finally(() => setMpLoading(false));
  }, []);

  useEffect(() => {
    const w: Record<string, boolean> = {};
    staticTrees.forEach(t => { w[t.id] = isWishlisted(t.id); });
    setWishlisted(w);
  }, [staticTrees]);

  const handleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleWishlist(id);
    setWishlisted(prev => ({ ...prev, [id]: added }));
  };

  const placedIds = new Set(placed.map(p => p.treeId));

  const handleAdd = (id: string) => {
    addTree(id);
    setPulse(id);
    setTimeout(() => setPulse(null), 600);
  };

  const hasMarketplace = !mpLoading && marketplace && marketplace.totalGroups > 0;

  /* Filter marketplace groups */
  const categories = [
    { value: 'all' as const, label: c.allCats },
    { value: 'fruit' as const, label: c.fruit },
    { value: 'decorative' as const, label: c.decorative },
    { value: 'evergreen' as const, label: c.evergreen },
    { value: 'shrub' as const, label: c.shrub },
  ];

  const filteredGroups = useMemo(() => {
    if (!marketplace?.groups) return [];
    return marketplace.groups.filter(g => {
      if (cat !== 'all' && g.category !== cat) return false;
      if (g.bestPrice > maxPrice) return false;
      return true;
    });
  }, [marketplace, cat, maxPrice]);

  const filteredStatic = useMemo(() => {
    return staticTrees.filter(t => {
      if (cat !== 'all' && t.category !== cat) return false;
      if (size !== 'all' && t.size !== size) return false;
      if (t.price > maxPrice) return false;
      return true;
    });
  }, [staticTrees, cat, size, maxPrice]);

  return (
    <>
    <section id="catalog" className="relative py-16 sm:py-28 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-forest-50 via-white to-forest-50 dark:from-forest-950 dark:via-forest-900/80 dark:to-forest-950"/>
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[60vw] h-[60vw] rounded-full opacity-20" style={{ background:'radial-gradient(ellipse,rgba(113,158,114,0.35) 0%,transparent 70%)',filter:'blur(60px)' }}/>
        <div className="absolute top-[40%] -left-24 w-[45vw] h-[45vw] rounded-full opacity-20" style={{ background:'radial-gradient(ellipse,rgba(214,195,153,0.4) 0%,transparent 70%)',filter:'blur(60px)' }}/>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase text-forest-600 dark:text-forest-400 mb-2">{c.eyebrow}</div>
            <h2 className="text-headline text-[clamp(1.75rem,5vw,4rem)] text-forest-950 dark:text-forest-50">{c.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {hasMarketplace && (
              <>
                <button onClick={() => setView('comparison')}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all', view==='comparison' ? 'bg-forest-900 dark:bg-forest-50 text-white dark:text-forest-900' : 'bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300')}>
                  <TrendingDown size={12}/>Compare prices
                </button>
                <button onClick={() => setView('static')}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all', view==='static' ? 'bg-forest-900 dark:bg-forest-50 text-white dark:text-forest-900' : 'bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300')}>
                  Our nursery
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live data badge */}
        {hasMarketplace && view === 'comparison' && (
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
              <span className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">
                {marketplace!.totalGroups} plants · {new Set(marketplace!.groups.flatMap(g => g.offers.map(o => o.sellerName))).size} local nurseries
              </span>
            </div>
            <span className="text-[11px] text-forest-500 flex items-center gap-1">
              <RefreshCw size={10}/>Updated {new Date(marketplace!.updatedAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/80 dark:bg-forest-950/80 rounded-2xl p-3 sm:p-4 border border-forest-200/60 dark:border-forest-800/60 mb-8">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categories.map(cat_ => (
              <button key={cat_.value} onClick={() => setCat(cat_.value)}
                className={cn('px-3 py-1.5 text-[12px] sm:text-[13px] font-medium rounded-full transition-all',
                  cat === cat_.value ? 'bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900' : 'text-forest-700 dark:text-forest-300 bg-forest-100 dark:bg-forest-800 hover:bg-forest-200 dark:hover:bg-forest-700')}>
                {cat_.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <label className="text-[12px] text-forest-600 dark:text-forest-400 font-medium whitespace-nowrap">Max price</label>
              <input type="range" min={0} max={500} step={10} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="apple-slider flex-1 min-w-[80px]"/>
              <span className="text-[13px] font-semibold tabular-nums text-forest-900 dark:text-forest-100 w-14 text-right">€{maxPrice}</span>
            </div>
          </div>
        </div>

        {/* ── COMPARISON VIEW (scraped marketplace) ── */}
        {(view === 'comparison' || !hasMarketplace) && (
          <div>
            {mpLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_,i) => <div key={i} className="h-56 rounded-2xl bg-white dark:bg-forest-900 border border-forest-200/60 dark:border-forest-800 animate-pulse"/>)}
              </div>
            ) : !hasMarketplace ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🌱</div>
                <h3 className="text-lg font-bold text-forest-900 dark:text-forest-50 mb-2">Scraping in progress…</h3>
                <p className="text-forest-500 text-[14px] mb-4 max-w-md mx-auto">We're collecting live prices from Lithuanian nurseries. This takes a few minutes on first launch. Refresh the page shortly.</p>
                <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-900 text-white text-[13px] font-medium hover:bg-forest-800 transition-colors">
                  <RefreshCw size={13}/>Refresh
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredGroups.map(group => (
                    <ComparisonCard key={group.slug} group={group} onAdd={() => addTree(group.slug, 0.5, 0.7)}/>
                  ))}
                  {filteredGroups.length === 0 && (
                    <div className="col-span-full text-center py-12 text-forest-500">No plants match your filters.</div>
                  )}
                </div>
                <div className="text-center mt-8">
                  <a href="/marketplace" className="inline-flex items-center gap-2 text-[13px] text-forest-600 dark:text-forest-400 hover:text-forest-900 dark:hover:text-white underline underline-offset-4 transition-colors">
                    See full marketplace with advanced filters → {marketplace!.totalGroups} plants
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STATIC VIEW (own nursery) ── */}
        {view === 'static' && hasMarketplace && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {filteredStatic.map(tree => (
              <div key={tree.id} className="relative">
                <StaticTreeCard
                  tree={tree}
                  onOpen={setSelectedTree}
                  onAdd={handleAdd}
                  isPlaced={placedIds.has(tree.id)}
                  pulse={pulse === tree.id}
                  wishlisted={wishlisted[tree.id]}
                  onWishlist={handleWishlist}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
    <TreeDetailModal tree={selectedTree} onClose={() => setSelectedTree(null)}/>
    </>
  );
}
