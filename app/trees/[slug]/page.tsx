'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { I18nProvider, useI18n } from '@/lib/i18nContext';
import {
  ArrowLeft, ExternalLink, Heart, Bell, Share2, Check, Shield,
  TrendingDown, Users, Clock, Leaf, MapPin, Star, ChevronDown,
  ChevronUp, ShoppingBag, BarChart2
} from 'lucide-react';
import { toggleWishlist, isWishlisted } from '@/lib/wishlist';
import { recordView } from '@/lib/recentlyViewed';
import { recordPrice, getPriceHistory, PricePoint } from '@/lib/priceHistory';
import { useGarden } from '@/components/builder/GardenContext';
import { GardenProvider } from '@/components/builder/GardenContext';

interface Offer {
  productId: string; sellerName: string; sellerCity: string; sellerLogo: string;
  sourceUrl: string; price: number; originalPrice?: number;
  height?: string; stockStatus: string; imageUrl?: string; localImagePath?: string; scrapedAt: string;
}
interface Group {
  slug: string; canonicalName: string; latinName?: string; category: string;
  offers: Offer[]; bestPrice: number; updatedAt: string;
}

const CAT_COLOR: Record<string, string> = {
  fruit: 'bg-amber-50 text-amber-700 border-amber-200',
  decorative: 'bg-pink-50 text-pink-700 border-pink-200',
  evergreen: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  shrub: 'bg-purple-50 text-purple-700 border-purple-200',
};
const CAT_EMOJI: Record<string, string> = { fruit:'🍎', decorative:'🌸', evergreen:'🌲', shrub:'🌿' };

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return 'just now'; if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function MiniChart({ points }: { points: PricePoint[] }) {
  if (points.length < 2) return null;
  const prices = points.map(p => p.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const W = 200, H = 50;
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = H - ((p.price - min) / range) * (H - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="mt-3">
      <div className="text-[11px] text-forest-500 mb-1 flex items-center gap-1">
        <BarChart2 size={10}/>Price trend (last 30 days)
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 50 }}>
        <polyline points={pts} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={pts.split(' ')[0].split(',')[0]} cy={pts.split(' ')[0].split(',')[1]} r="3" fill="#16a34a"/>
        <circle cx={pts.split(' ').pop()!.split(',')[0]} cy={pts.split(' ').pop()!.split(',')[1]} r="3" fill="#16a34a"/>
      </svg>
      <div className="flex justify-between text-[10px] text-forest-400 tabular-nums">
        <span>€{min.toFixed(2)}</span><span>€{max.toFixed(2)}</span>
      </div>
    </div>
  );
}

function TreePageInner({ slug }: { slug: string }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [alertSet, setAlertSet] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [copied, setCopied] = useState(false);
  const { addTree } = useGarden();
  const { tr } = useI18n();

  useEffect(() => {
    fetch('/marketplace.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const g: Group[] = d.groups || [];
        setAllGroups(g);
        const found = g.find((x: Group) => x.slug === slug);
        setGroup(found || null);
        if (found) {
          // Record view
          recordView({ slug: found.slug, name: found.canonicalName, category: found.category, bestPrice: found.bestPrice });
          // Record prices for history
          found.offers.forEach(o => recordPrice(found.slug, o.price, o.sellerName));
          setPriceHistory(getPriceHistory(found.slug));
          setWishlisted(isWishlisted(found.slug));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleAddToGarden = () => {
    if (group) addTree(group.slug, 0.5, 0.6);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-50 dark:bg-forest-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-forest-300 border-t-forest-700 animate-spin"/>
          <p className="text-forest-500 text-[13px]">Loading…</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-forest-50 dark:bg-forest-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="text-xl font-bold text-forest-900 dark:text-forest-50 mb-2">Plant not found</h1>
          <p className="text-forest-500 mb-4">This plant isn't in our catalog yet.</p>
          <Link href="/marketplace" className="px-4 py-2 rounded-xl bg-forest-900 text-white text-[13px] font-medium">
            Browse all plants
          </Link>
        </div>
      </div>
    );
  }

  const best = group.offers[0];
  const savings = group.offers.length > 1 ? group.offers[group.offers.length - 1].price - best.price : 0;
  const similar = allGroups.filter(g => g.category === group.category && g.slug !== group.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-forest-50 dark:bg-forest-950">
      {/* Breadcrumb nav */}
      <div className="bg-white dark:bg-forest-900 border-b border-forest-200/60 dark:border-forest-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-[13px]">
          <Link href="/" className="text-forest-500 hover:text-forest-900 dark:hover:text-white transition-colors">Home</Link>
          <span className="text-forest-300">/</span>
          <Link href="/marketplace" className="text-forest-500 hover:text-forest-900 dark:hover:text-white transition-colors">Marketplace</Link>
          <span className="text-forest-300">/</span>
          <span className="text-forest-900 dark:text-forest-100 font-medium truncate">{group.canonicalName}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left column: info ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mb-2 ${CAT_COLOR[group.category] || 'bg-forest-50 text-forest-600 border-forest-200'}`}>
                    {CAT_EMOJI[group.category]} {group.category}
                  </span>
                  <h1 className="text-[2rem] sm:text-[2.5rem] font-black tracking-tight text-forest-950 dark:text-forest-50 leading-tight">
                    {group.canonicalName}
                  </h1>
                  {group.latinName && (
                    <p className="text-[15px] text-forest-500 italic mt-1">{group.latinName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { const a = toggleWishlist(group.slug); setWishlisted(a); }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${wishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white dark:bg-forest-800 border-forest-200 dark:border-forest-700 text-forest-400'}`}>
                    <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'}/>
                  </button>
                  <button onClick={handleShare}
                    className="w-10 h-10 rounded-full bg-white dark:bg-forest-800 border border-forest-200 dark:border-forest-700 flex items-center justify-center text-forest-400 hover:text-forest-700 dark:hover:text-forest-200 transition-colors">
                    {copied ? <Check size={16} className="text-emerald-500"/> : <Share2 size={16}/>}
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-[13px] text-forest-600 dark:text-forest-400">
                  <Users size={14}/>{group.offers.length} {group.offers.length === 1 ? 'seller' : 'sellers'}
                </div>
                {savings > 0.5 && (
                  <div className="flex items-center gap-1.5 text-[13px] text-emerald-600 font-semibold">
                    <TrendingDown size={14}/>Save up to €{savings.toFixed(2)}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[13px] text-forest-500">
                  <Clock size={12}/>Updated {timeAgo(group.updatedAt)}
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="aspect-video sm:aspect-[16/7] rounded-2xl overflow-hidden bg-white dark:bg-forest-900 border border-forest-200/60 dark:border-forest-800 flex items-center justify-center">
              {group.offers.find(o => o.localImagePath || o.imageUrl) ? (
                <img
                  src={(group.offers.find(o => o.localImagePath || o.imageUrl)!.localImagePath || group.offers.find(o => o.localImagePath || o.imageUrl)!.imageUrl)}
                  alt={group.canonicalName}
                  className="w-full h-full object-contain p-4"
                  onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <span className="text-8xl opacity-20">{CAT_EMOJI[group.category] || '🌳'}</span>
              )}
            </div>

            {/* All offers */}
            <div className="bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-forest-100 dark:border-forest-800 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-forest-950 dark:text-forest-50">Where to buy</h2>
                <span className="text-[12px] text-forest-500">{group.offers.length} offer{group.offers.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-forest-100 dark:divide-forest-800">
                {(expanded ? group.offers : group.offers.slice(0, 4)).map((offer, j) => (
                  <motion.div key={j} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: j * 0.05 }}
                    className={`flex items-center gap-4 px-5 py-4 ${j === 0 ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {j === 0
                        ? <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={14} className="text-white"/></div>
                        : <div className="w-8 h-8 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center text-[13px] font-bold text-forest-600 dark:text-forest-400">{j+1}</div>}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-semibold text-forest-900 dark:text-forest-50">{offer.sellerName}</span>
                        <Shield size={12} className="text-forest-400" title="Verified seller"/>
                        {j === 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">Best price</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {offer.sellerCity && <span className="text-[12px] text-forest-500 flex items-center gap-0.5"><MapPin size={10}/>{offer.sellerCity}</span>}
                        {offer.height && <span className="text-[12px] text-forest-500 flex items-center gap-0.5"><Leaf size={10}/>{offer.height}</span>}
                        {offer.stockStatus === 'in_stock' && <span className="text-[11px] text-emerald-600 font-medium">● In stock</span>}
                      </div>
                    </div>
                    {/* Price + action */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        {offer.originalPrice && offer.originalPrice > offer.price && (
                          <div className="text-[11px] text-forest-400 line-through tabular-nums">€{offer.originalPrice.toFixed(2)}</div>
                        )}
                        <div className={`text-[20px] font-black tabular-nums ${j === 0 ? 'text-emerald-600' : 'text-forest-900 dark:text-forest-50'}`}>
                          €{offer.price.toFixed(2)}
                        </div>
                        {j > 0 && <div className="text-[10px] text-red-500 tabular-nums">+€{(offer.price - best.price).toFixed(2)}</div>}
                      </div>
                      <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${j === 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-forest-900 dark:bg-forest-50 text-white dark:text-forest-900'}`}>
                        Buy <ExternalLink size={12}/>
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
              {group.offers.length > 4 && (
                <button onClick={() => setExpanded(v => !v)}
                  className="w-full py-3 text-[13px] text-forest-500 hover:text-forest-900 dark:hover:text-white flex items-center justify-center gap-1.5 border-t border-forest-100 dark:border-forest-800 transition-colors">
                  {expanded ? <><ChevronUp size={14}/>Show less</> : <><ChevronDown size={14}/>Show {group.offers.length - 4} more offers</>}
                </button>
              )}
            </div>

            {/* Price chart */}
            {priceHistory.length >= 2 && (
              <div className="bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800 p-5">
                <h3 className="text-[14px] font-bold text-forest-950 dark:text-forest-50 mb-1">Price history</h3>
                <MiniChart points={priceHistory}/>
              </div>
            )}
          </div>

          {/* ── Right column: actions + info ── */}
          <div className="space-y-4">
            {/* Buy box */}
            <div className="bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800 p-5 sticky top-24">
              <div className="text-[12px] text-forest-500 mb-1">Best price</div>
              <div className="text-[2.5rem] font-black text-emerald-600 tabular-nums leading-none mb-1">
                €{best.price.toFixed(2)}
              </div>
              <div className="text-[13px] text-forest-600 dark:text-forest-400 mb-4">
                at {best.sellerName}
                {savings > 0.5 && <span className="ml-2 text-emerald-600 font-semibold">· save €{savings.toFixed(2)}</span>}
              </div>

              <div className="space-y-2.5">
                <a href={best.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[15px] transition-colors">
                  Buy now · €{best.price.toFixed(2)} <ExternalLink size={14}/>
                </a>
                <button onClick={handleAddToGarden}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-forest-900 dark:bg-forest-50 text-white dark:text-forest-900 font-semibold text-[14px] transition-colors hover:opacity-90">
                  <ShoppingBag size={14}/>Add to garden builder
                </button>
                <button onClick={() => setAlertSet(v => !v)}
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border text-[13px] font-medium transition-all ${alertSet ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400' : 'border-forest-200 dark:border-forest-700 text-forest-600 dark:text-forest-400 hover:border-forest-400'}`}>
                  <Bell size={14} fill={alertSet ? 'currentColor' : 'none'}/>
                  {alertSet ? 'Alert set — will notify on price drop' : 'Alert me when price drops'}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-forest-100 dark:border-forest-800 space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-forest-500">Sellers tracked</span>
                  <span className="font-semibold text-forest-900 dark:text-forest-100">{group.offers.length}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-forest-500">Price range</span>
                  <span className="font-semibold text-forest-900 dark:text-forest-100 tabular-nums">
                    €{best.price.toFixed(0)} – €{group.offers[group.offers.length-1].price.toFixed(0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-forest-500">Last checked</span>
                  <span className="font-semibold text-forest-900 dark:text-forest-100">{timeAgo(group.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Seller list */}
            <div className="bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800 p-4">
              <h3 className="text-[13px] font-bold text-forest-950 dark:text-forest-50 mb-3">All sellers</h3>
              <div className="space-y-2">
                {group.offers.map((o, j) => (
                  <a key={j} href={o.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-forest-50 dark:hover:bg-forest-800 transition-colors group">
                    <div className="flex items-center gap-2">
                      {j === 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"/>}
                      {j > 0 && <span className="w-1.5 h-1.5 rounded-full bg-forest-200 dark:bg-forest-700 flex-shrink-0"/>}
                      <span className="text-[13px] text-forest-700 dark:text-forest-300 group-hover:text-forest-900 dark:group-hover:text-white transition-colors">{o.sellerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[13px] font-bold tabular-nums ${j === 0 ? 'text-emerald-600' : 'text-forest-700 dark:text-forest-300'}`}>€{o.price.toFixed(2)}</span>
                      <ExternalLink size={11} className="text-forest-300 group-hover:text-forest-500 transition-colors"/>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Similar plants */}
        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="text-[18px] font-bold text-forest-950 dark:text-forest-50 mb-4">
              Similar {group.category} plants
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {similar.map(s => (
                <Link key={s.slug} href={`/trees/${s.slug}`}
                  className="bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800 p-4 hover:border-forest-300 dark:hover:border-forest-700 transition-all group">
                  <div className="text-3xl mb-2">{CAT_EMOJI[s.category] || '🌳'}</div>
                  <div className="text-[13px] font-semibold text-forest-900 dark:text-forest-50 leading-tight group-hover:text-forest-700 dark:group-hover:text-forest-200 transition-colors">
                    {s.canonicalName}
                  </div>
                  <div className="text-[12px] text-emerald-600 font-bold mt-1 tabular-nums">from €{s.bestPrice.toFixed(0)}</div>
                  <div className="text-[11px] text-forest-500 mt-0.5">{s.offers.length} sellers</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TreePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <I18nProvider>
      <GardenProvider>
        <TreePageInner slug={slug}/>
      </GardenProvider>
    </I18nProvider>
  );
}
