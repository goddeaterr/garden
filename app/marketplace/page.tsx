'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I18nProvider } from '@/lib/i18nContext';
import {
  Search, SlidersHorizontal, ExternalLink, TrendingDown, Award, Leaf,
  Heart, BarChart2, Bell, X, ChevronDown, ChevronUp, RefreshCw, Check,
  MapPin, ShoppingBag, ArrowUpRight, Star, Shield, Clock
} from 'lucide-react';
import { CompareBar } from '@/components/ui/CompareBar';
import { getRecentlyViewed, ViewedItem } from '@/lib/recentlyViewed';
import { toggleWishlist, isWishlisted } from '@/lib/wishlist';
import Link from 'next/link';
import { recordView } from '@/lib/recentlyViewed';
import type { MarketplaceGroup, MarketplaceOffer } from '@/lib/scraper';

interface MarketplaceData {
  updatedAt: string; totalProducts: number; totalGroups: number;
  groups: MarketplaceGroup[];
}

const CAT_LABELS: Record<string, string> = {
  all: 'All plants', fruit: 'Fruit trees', decorative: 'Decorative',
  evergreen: 'Evergreen', shrub: 'Shrubs',
};
const CAT_EMOJI: Record<string, string> = { fruit:'🍎', decorative:'🌸', evergreen:'🌲', shrub:'🌿' };
const CAT_COLORS: Record<string, string> = {
  fruit: 'bg-amber-50 text-amber-700 border-amber-200',
  decorative: 'bg-pink-50 text-pink-700 border-pink-200',
  evergreen: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  shrub: 'bg-purple-50 text-purple-700 border-purple-200',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function OfferRow({ offer, group, rank }: { offer: MarketplaceOffer; group: MarketplaceGroup; rank: number }) {
  const isBest = rank === 0;
  const savings = rank > 0 ? offer.price - group.bestPrice : 0;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isBest ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-forest-900 border border-forest-200/60 dark:border-forest-800/60 hover:border-forest-300 dark:hover:border-forest-700'}`}>
      {isBest && <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Check size={11} className="text-white"/></div>}
      {!isBest && <div className="w-5 h-5 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-forest-500">{rank + 1}</div>}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-forest-900 dark:text-forest-50 truncate">{offer.sellerName}</span>
          <span title="Verified seller" className="inline-flex flex-shrink-0"><Shield size={11} className="text-forest-400" aria-hidden="true"/></span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {offer.height && <span className="text-[10px] text-forest-500 flex items-center gap-0.5"><Leaf size={9}/>{offer.height}</span>}
          {offer.stockStatus === 'in_stock' && <span className="text-[10px] text-emerald-600 font-medium">In stock</span>}
          {offer.stockStatus === 'out_of_stock' && <span className="text-[10px] text-red-500">Out of stock</span>}
          <span className="text-[10px] text-forest-400 flex items-center gap-0.5"><Clock size={9}/>{timeAgo(offer.scrapedAt)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          {offer.originalPrice && offer.originalPrice > offer.price && (
            <div className="text-[11px] text-forest-400 line-through tabular-nums">€{offer.originalPrice.toFixed(2)}</div>
          )}
          <div className={`text-[16px] font-black tabular-nums ${isBest ? 'text-emerald-600' : 'text-forest-900 dark:text-forest-50'}`}>
            €{offer.price.toFixed(2)}
          </div>
          {savings > 0.5 && <div className="text-[10px] text-red-500 font-medium">+€{savings.toFixed(0)} vs best</div>}
        </div>
        <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${isBest ? 'bg-emerald-600 text-white' : 'bg-forest-900 dark:bg-forest-50 text-white dark:text-forest-900'}`}
          onClick={e => e.stopPropagation()}>
          View <ExternalLink size={11}/>
        </a>
      </div>
    </div>
  );
}

function GroupCard({ group, onCompare, compareSelected }: {
  group: MarketplaceGroup;
  onCompare: (g: MarketplaceGroup) => void;
  compareSelected: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [alertSet, setAlertSet] = useState(false);
  const savings = group.offers.length > 1 ? group.offers[group.offers.length - 1].price - group.bestPrice : 0;

  useEffect(() => { setWishlisted(isWishlisted(group.slug)); }, [group.slug]);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleWishlist(group.slug);
    setWishlisted(added);
  };

  const handleAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAlertSet(v => !v);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompare(group);
  };

  return (
    <motion.div layout className={`bg-white dark:bg-forest-900 rounded-2xl border transition-all overflow-hidden ${compareSelected ? 'border-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-800' : 'border-forest-200/60 dark:border-forest-800/60 hover:border-forest-300 dark:hover:border-forest-700'}`}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start gap-3">
          {/* Image / emoji */}
          <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl bg-forest-50 dark:bg-forest-800">
            {(group.offers[0]?.localImagePath || group.offers[0]?.imageUrl)
              ? <img src={group.offers[0].localImagePath || group.offers[0].imageUrl} alt={group.canonicalName} className="w-full h-full object-cover rounded-xl" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}/>
              : <span>{CAT_EMOJI[group.category] || '🌳'}</span>}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/trees/${group.slug}`} className="text-[14px] font-bold text-forest-950 dark:text-forest-50 hover:text-emerald-600 transition-colors leading-tight block" onClick={() => recordView({ slug: group.slug, name: group.canonicalName, category: group.category, bestPrice: group.bestPrice })}>{group.canonicalName}</Link>
                {group.latinName && <div className="text-[11px] text-forest-400 italic mt-0.5">{group.latinName}</div>}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={handleWishlist} title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${wishlisted ? 'bg-red-50 text-red-500' : 'bg-forest-50 dark:bg-forest-800 text-forest-400 hover:text-red-400'}`}>
                  <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'}/>
                </button>
                <button onClick={handleAlert} title={alertSet ? 'Alert set' : 'Alert me on price drop'}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${alertSet ? 'bg-amber-50 text-amber-500' : 'bg-forest-50 dark:bg-forest-800 text-forest-400 hover:text-amber-400'}`}>
                  <Bell size={13} fill={alertSet ? 'currentColor' : 'none'}/>
                </button>
                <button onClick={handleCompare} title="Add to compare"
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${compareSelected ? 'bg-emerald-50 text-emerald-600' : 'bg-forest-50 dark:bg-forest-800 text-forest-400 hover:text-emerald-500'}`}>
                  <BarChart2 size={13}/>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CAT_COLORS[group.category] || 'bg-forest-50 text-forest-600 border-forest-200'}`}>
                {group.category}
              </span>
              <span className="text-[11px] text-forest-500">{group.offers.length} seller{group.offers.length !== 1 ? 's' : ''}</span>
              {savings > 1 && <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5"><TrendingDown size={10}/>Save €{savings.toFixed(0)}</span>}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-[11px] text-forest-500 mb-0.5">from</div>
            <div className="text-[20px] font-black text-emerald-600 tabular-nums leading-none">€{group.bestPrice.toFixed(0)}</div>
            {group.offers.length > 1 && (
              <div className="text-[11px] text-forest-400 mt-0.5">to €{group.offers[group.offers.length - 1].price.toFixed(0)}</div>
            )}
          </div>
        </div>

        {/* Collapsed preview - first 2 offers */}
        {!expanded && (
          <div className="mt-3 space-y-1">
            {group.offers.slice(0, 2).map((offer, j) => (
              <div key={j} className="flex items-center justify-between text-[12px]">
                <span className="text-forest-600 dark:text-forest-400 flex items-center gap-1.5">
                  {j === 0 && <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={8} className="text-white"/></span>}
                  {j !== 0 && <span className="w-4 h-4 rounded-full bg-forest-200 dark:bg-forest-700 flex items-center justify-center text-[9px] font-bold text-forest-600">{j+1}</span>}
                  {offer.sellerName}
                </span>
                <span className={`font-bold tabular-nums ${j === 0 ? 'text-emerald-600' : 'text-forest-700 dark:text-forest-200'}`}>€{offer.price.toFixed(2)}</span>
              </div>
            ))}
            {group.offers.length > 2 && (
              <div className="text-[11px] text-forest-400 text-center flex items-center justify-center gap-1 mt-1">
                <ChevronDown size={12}/>+{group.offers.length - 2} more sellers
              </div>
            )}
          </div>
        )}

        {expanded && <div className="flex justify-center mt-1"><ChevronUp size={14} className="text-forest-400"/></div>}
      </div>

      {/* Expanded offers */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2 border-t border-forest-100 dark:border-forest-800 pt-3">
              {group.offers.map((offer, j) => <OfferRow key={j} offer={offer} group={group} rank={j}/>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MarketplaceInner() {
  const [data, setData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<'sellers'|'price_asc'|'price_desc'|'name'>('sellers');
  const [maxPrice, setMaxPrice] = useState(500);
  const [showFilters, setShowFilters] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<ViewedItem[]>([]);
  const [compareItems, setCompareItems] = useState<{ slug: string; name: string; bestPrice: number; category: string }[]>([]);

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed());
    fetch('/marketplace.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let g = data.groups;
    if (cat !== 'all') g = g.filter(x => x.category === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      g = g.filter(x => x.canonicalName.toLowerCase().includes(q) || x.latinName?.toLowerCase().includes(q));
    }
    g = g.filter(x => x.bestPrice <= maxPrice);
    if (sort === 'sellers') g = [...g].sort((a, b) => b.offers.length - a.offers.length || a.bestPrice - b.bestPrice);
    else if (sort === 'price_asc') g = [...g].sort((a, b) => a.bestPrice - b.bestPrice);
    else if (sort === 'price_desc') g = [...g].sort((a, b) => b.bestPrice - a.bestPrice);
    else if (sort === 'name') g = [...g].sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));
    return g;
  }, [data, cat, search, sort, maxPrice]);

  const sellers = useMemo(() => {
    if (!data) return 0;
    return new Set(data.groups.flatMap(g => g.offers.map(o => o.sellerName))).size;
  }, [data]);

  const handleCompare = useCallback((group: MarketplaceGroup) => {
    setCompareItems(prev => {
      const exists = prev.find(i => i.slug === group.slug);
      if (exists) return prev.filter(i => i.slug !== group.slug);
      if (prev.length >= 4) return prev;
      return [...prev, { slug: group.slug, name: group.canonicalName, bestPrice: group.bestPrice, category: group.category }];
    });
  }, []);

  return (
    <div className="min-h-screen bg-forest-50 dark:bg-forest-950">
      {/* Header */}
      <div className="bg-white dark:bg-forest-900 border-b border-forest-200/60 dark:border-forest-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-forest-900 dark:text-forest-50 flex-shrink-0">
              <Leaf size={20} className="text-forest-600"/>
              <span className="font-bold text-[15px] hidden sm:block">MB Plant House</span>
              <span className="text-forest-400 text-[13px] hidden sm:block">/ Marketplace</span>
            </Link>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plants…"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-forest-50 dark:bg-forest-800 border border-forest-200 dark:border-forest-700 text-[13px] text-forest-900 dark:text-forest-100 placeholder:text-forest-400 outline-none focus:ring-2 focus:ring-forest-300 dark:focus:ring-forest-600"/>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setShowFilters(v => !v)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${showFilters ? 'bg-forest-900 text-white' : 'bg-forest-50 dark:bg-forest-800 text-forest-700 dark:text-forest-200 border border-forest-200 dark:border-forest-700'}`}>
                <SlidersHorizontal size={14}/>Filters
              </button>
            </div>
          </div>

          {/* Filters row */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="pt-3 flex flex-wrap items-center gap-3">
                  {/* Category pills */}
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.entries(CAT_LABELS).map(([k, v]) => (
                      <button key={k} onClick={() => setCat(k)}
                        className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${cat === k ? 'bg-forest-900 text-white dark:bg-forest-50 dark:text-forest-900' : 'bg-white dark:bg-forest-800 text-forest-700 dark:text-forest-300 border border-forest-200 dark:border-forest-700 hover:border-forest-400'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="w-px h-5 bg-forest-200 dark:bg-forest-700 hidden sm:block"/>
                  {/* Sort */}
                  <select value={sort} onChange={e => setSort(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-forest-800 border border-forest-200 dark:border-forest-700 text-[12px] text-forest-900 dark:text-forest-100 outline-none cursor-pointer">
                    <option value="sellers">Most sellers first</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                    <option value="name">Name A–Z</option>
                  </select>
                  {/* Max price */}
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-forest-500 whitespace-nowrap">Max</span>
                    <input type="range" min={0} max={500} step={10} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="apple-slider w-24"/>
                    <span className="text-[12px] font-semibold text-forest-900 dark:text-forest-100 tabular-nums w-14">€{maxPrice}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-gradient-to-r from-forest-900 to-forest-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <TrendingDown size={14} className="text-emerald-400"/>
            <span className="text-[12px]"><strong>{data?.totalGroups ?? '…'}</strong> plant species</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Shield size={14} className="text-emerald-400"/>
            <span className="text-[12px]"><strong>{sellers || '…'}</strong> verified sellers</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Award size={14} className="text-emerald-400"/>
            <span className="text-[12px]"><strong>{data?.groups.filter(g => g.offers.length > 1).length ?? '…'}</strong> with price comparison</span>
          </div>
          {data?.updatedAt && (
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
              <RefreshCw size={11} className="text-white/40"/>
              <span className="text-[11px] text-white/40">Updated {timeAgo(data.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(9)].map((_,i) => <div key={i} className="h-48 rounded-2xl bg-white dark:bg-forest-900 border border-forest-200/60 dark:border-forest-800 animate-pulse"/>)}
          </div>
        ) : !data || data.totalGroups === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="text-xl font-bold text-forest-900 dark:text-forest-50 mb-2">No listings yet</h2>
            <p className="text-forest-500 mb-6">Use the admin scraper to collect nursery listings from Lithuanian websites.</p>
            <Link href="/admin" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-900 text-white text-[13px] font-semibold hover:bg-forest-800 transition-colors">
              Open Admin Panel <ArrowUpRight size={14}/>
            </Link>
          </div>
        ) : (
          <>

            {/* Recently viewed */}
            {recentlyViewed.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[12px] uppercase tracking-wider font-semibold text-forest-500 dark:text-forest-400 mb-3">Recently viewed</h3>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {recentlyViewed.map(item => (
                    <Link key={item.slug} href={`/trees/${item.slug}`}
                      className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-forest-900 border border-forest-200/60 dark:border-forest-800 hover:border-forest-300 dark:hover:border-forest-700 transition-colors">
                      <span className="text-base">{{'fruit':'🍎','decorative':'🌸','evergreen':'🌲','shrub':'🌿'}[item.category]||'🌳'}</span>
                      <div>
                        <div className="text-[12px] font-medium text-forest-900 dark:text-forest-50 whitespace-nowrap">{item.name}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">€{item.bestPrice.toFixed(0)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Best deals banner */}
            {filtered.filter(g => g.offers.length > 1).length > 0 && (
              <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={14} className="text-emerald-600"/>
                  <span className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Best savings today</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {filtered.filter(g => g.offers.length > 1).slice(0, 4).map(g => {
                    const save = g.offers[g.offers.length - 1].price - g.bestPrice;
                    return (
                      <div key={g.slug} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-forest-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <span className="text-[12px] font-medium text-forest-900 dark:text-forest-50">{g.canonicalName}</span>
                        <span className="text-[11px] text-emerald-600 font-bold">save €{save.toFixed(0)}</span>
                        <span className="text-[10px] text-forest-400">{g.offers.length} sellers</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-forest-600 dark:text-forest-400">
                <strong className="text-forest-900 dark:text-forest-50">{filtered.length}</strong> results
                {filtered.length !== data.totalGroups && ` of ${data.totalGroups}`}
              </p>
              {compareItems.length > 0 && (
                <span className="text-[12px] text-emerald-600 font-medium">{compareItems.length}/4 selected to compare</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(group => (
                <GroupCard
                  key={group.slug}
                  group={group}
                  onCompare={handleCompare}
                  compareSelected={compareItems.some(i => i.slug === group.slug)}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-forest-500">
                <Search size={32} className="mx-auto mb-3 opacity-30"/>
                <p>No plants match your filters.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Compare bar */}
      <CompareBar
        items={compareItems}
        onRemove={(slug) => setCompareItems(prev => prev.filter(i => i.slug !== slug))}
        onClear={() => setCompareItems([])}
      />
    </div>
  );
}

export default function MarketplacePage() {
  return <I18nProvider><MarketplaceInner/></I18nProvider>;
}
