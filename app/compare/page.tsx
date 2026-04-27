'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { I18nProvider } from '@/lib/i18nContext';
import { GardenProvider } from '@/components/builder/GardenContext';
import { ExternalLink, Check, X, Shield, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { toggleWishlist, isWishlisted } from '@/lib/wishlist';
import { Heart } from 'lucide-react';

interface Offer { sellerName: string; sourceUrl: string; price: number; height?: string; stockStatus: string; sellerCity: string; }
interface Group { slug: string; canonicalName: string; latinName?: string; category: string; offers: Offer[]; bestPrice: number; }

const CAT_EMOJI: Record<string, string> = { fruit:'🍎', decorative:'🌸', evergreen:'🌲', shrub:'🌿' };
const ALL_SELLERS_KEY = '__all_sellers__';

function CompareInner() {
  const searchParams = useSearchParams();
  const slugs = (searchParams.get('slugs') || '').split(',').filter(Boolean).slice(0, 4);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (slugs.length === 0) { setLoading(false); return; }
    fetch('/marketplace.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const all: Group[] = d.groups || [];
        const found = slugs.map(s => all.find(g => g.slug === s)).filter(Boolean) as Group[];
        setGroups(found);
        const wl: Record<string, boolean> = {};
        found.forEach(g => { wl[g.slug] = isWishlisted(g.slug); });
        setWishlist(wl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && slugs.length === 0) {
    return (
      <div className="min-h-screen bg-forest-50 dark:bg-forest-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="text-xl font-bold text-forest-900 dark:text-forest-50 mb-2">Nothing to compare</h1>
          <p className="text-forest-500 mb-4">Select plants from the marketplace to compare.</p>
          <Link href="/marketplace" className="px-4 py-2.5 rounded-xl bg-forest-900 text-white text-[13px] font-semibold">Browse marketplace</Link>
        </div>
      </div>
    );
  }

  // Build unified seller list across all groups
  const allSellers = [...new Set(groups.flatMap(g => g.offers.map(o => o.sellerName)))].sort();

  const getOffer = (group: Group, sellerName: string) =>
    group.offers.find(o => o.sellerName === sellerName);

  return (
    <div className="min-h-screen bg-forest-50 dark:bg-forest-950">
      <div className="bg-white dark:bg-forest-900 border-b border-forest-200/60 dark:border-forest-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href="/marketplace" className="flex items-center gap-1.5 text-[13px] text-forest-500 hover:text-forest-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={14}/>Back
          </Link>
          <h1 className="text-[15px] font-bold text-forest-950 dark:text-forest-50">Comparing {groups.length} plants</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-forest-300 border-t-forest-700 animate-spin"/>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            {/* Header row */}
            <thead>
              <tr>
                <th className="text-left py-3 pr-4 text-[13px] font-semibold text-forest-600 dark:text-forest-400 w-40 align-bottom">Plant</th>
                {groups.map(g => (
                  <th key={g.slug} className="px-3 py-3 align-bottom">
                    <div className="bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800 p-4 text-left min-w-[160px]">
                      <div className="text-2xl mb-2">{CAT_EMOJI[g.category] || '🌳'}</div>
                      <Link href={`/trees/${g.slug}`} className="text-[14px] font-bold text-forest-950 dark:text-forest-50 hover:text-emerald-600 transition-colors block leading-tight">
                        {g.canonicalName}
                      </Link>
                      {g.latinName && <div className="text-[11px] text-forest-400 italic mt-0.5">{g.latinName}</div>}
                      <div className="text-[20px] font-black text-emerald-600 tabular-nums mt-2">€{g.bestPrice.toFixed(2)}</div>
                      <div className="text-[11px] text-forest-500 mt-0.5">from {g.offers.length} sellers</div>
                      <div className="flex gap-1.5 mt-3">
                        <a href={g.offers[0]?.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold">
                          Buy <ExternalLink size={10}/>
                        </a>
                        <button onClick={() => { const a = toggleWishlist(g.slug); setWishlist(p => ({...p,[g.slug]:a})); }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${wishlist[g.slug] ? 'bg-red-50 border-red-200 text-red-500' : 'border-forest-200 dark:border-forest-700 text-forest-400'}`}>
                          <Heart size={12} fill={wishlist[g.slug] ? 'currentColor' : 'none'}/>
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-forest-100 dark:divide-forest-800">
              {/* Category */}
              <TableRow label="Category" values={groups.map(g => g.category.charAt(0).toUpperCase() + g.category.slice(1))}/>

              {/* Sellers */}
              {allSellers.map(seller => (
                <tr key={seller} className="hover:bg-white dark:hover:bg-forest-900/50 transition-colors">
                  <td className="py-3 pr-4 text-[12px] font-medium text-forest-700 dark:text-forest-300 align-middle">
                    <div className="flex items-center gap-1.5">
                      <Shield size={11} className="text-forest-400"/>{seller}
                    </div>
                  </td>
                  {groups.map(g => {
                    const offer = getOffer(g, seller);
                    return (
                      <td key={g.slug} className="px-3 py-3 text-center align-middle">
                        {offer ? (
                          <div>
                            <div className={`text-[16px] font-black tabular-nums ${offer.price === g.bestPrice ? 'text-emerald-600' : 'text-forest-800 dark:text-forest-200'}`}>
                              €{offer.price.toFixed(2)}
                            </div>
                            {offer.price === g.bestPrice && <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Best</div>}
                            {offer.height && <div className="text-[10px] text-forest-400 mt-0.5">{offer.height}</div>}
                            <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 mt-1.5 px-2 py-1 rounded-lg bg-forest-900 dark:bg-forest-50 text-white dark:text-forest-900 text-[10px] font-semibold hover:opacity-90">
                              Buy <ExternalLink size={9}/>
                            </a>
                          </div>
                        ) : (
                          <Minus size={14} className="text-forest-200 dark:text-forest-700 mx-auto"/>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Best price */}
              <tr className="bg-emerald-50/50 dark:bg-emerald-900/10">
                <td className="py-3 pr-4 text-[12px] font-bold text-forest-900 dark:text-forest-50">Best price</td>
                {groups.map(g => (
                  <td key={g.slug} className="px-3 py-3 text-center">
                    <span className="text-[18px] font-black text-emerald-600 tabular-nums">€{g.bestPrice.toFixed(2)}</span>
                  </td>
                ))}
              </tr>

              {/* Savings */}
              <tr>
                <td className="py-3 pr-4 text-[12px] font-medium text-forest-700 dark:text-forest-300">Max savings</td>
                {groups.map(g => {
                  const save = g.offers.length > 1 ? g.offers[g.offers.length - 1].price - g.bestPrice : 0;
                  return (
                    <td key={g.slug} className="px-3 py-3 text-center">
                      {save > 0.5
                        ? <span className="text-[13px] font-bold text-emerald-600">Save €{save.toFixed(2)}</span>
                        : <Minus size={14} className="text-forest-200 dark:text-forest-700 mx-auto"/>}
                    </td>
                  );
                })}
              </tr>

              {/* Number of sellers */}
              <tr className="hover:bg-white dark:hover:bg-forest-900/50 transition-colors">
                <td className="py-3 pr-4 text-[12px] font-medium text-forest-700 dark:text-forest-300">Sellers</td>
                {groups.map(g => (
                  <td key={g.slug} className="px-3 py-3 text-center text-[13px] font-semibold text-forest-900 dark:text-forest-50">
                    {g.offers.length}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TableRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="hover:bg-white dark:hover:bg-forest-900/50 transition-colors">
      <td className="py-3 pr-4 text-[12px] font-medium text-forest-700 dark:text-forest-300">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-3 py-3 text-center text-[13px] text-forest-800 dark:text-forest-200">{v}</td>
      ))}
    </tr>
  );
}

export default function ComparePage() {
  return (
    <I18nProvider>
      <GardenProvider>
        <Suspense fallback={<div className="flex justify-center py-24"><div className="w-8 h-8 rounded-full border-2 border-forest-300 border-t-forest-700 animate-spin"/></div>}>
          <CompareInner/>
        </Suspense>
      </GardenProvider>
    </I18nProvider>
  );
}
