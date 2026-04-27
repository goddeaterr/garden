'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, TrendingDown, Users, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Offer { sellerName: string; price: number; sourceUrl: string; }
interface Group { slug: string; canonicalName: string; category: string; bestPrice: number; offers: Offer[]; }

const CAT_EMOJI: Record<string, string> = { fruit:'🍎', decorative:'🌸', evergreen:'🌲', shrub:'🌿' };

export function MarketplaceTeaser() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, sellers: 0 });

  useEffect(() => {
    fetch('/marketplace.json?t='+Date.now(), { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const g: Group[] = (d.groups || []).filter((g: Group) => g.offers.length > 1).slice(0, 6);
        setGroups(g);
        const sellers = new Set((d.groups||[]).flatMap((g: Group) => g.offers.map((o: Offer) => o.sellerName)));
        setStats({ products: d.totalGroups || 0, sellers: sellers.size });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && groups.length === 0) return null;

  return (
    <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-forest-50 dark:from-forest-900 dark:to-forest-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase text-forest-600 dark:text-forest-400 mb-3 flex items-center gap-2">
              <TrendingDown size={12}/>Price comparison · Klaipėda
            </div>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-forest-950 dark:text-forest-50 leading-tight">
              Compare prices<br/>across local nurseries.
            </h2>
            <p className="text-[15px] text-forest-600 dark:text-forest-400 mt-3 max-w-lg">
              We track {stats.products || '…'} plants from {stats.sellers || '…'} Klaipėda nurseries so you always get the best price.
            </p>
          </div>
          <Link href="/marketplace"
            className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[14px] font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform">
            See all offers <ArrowUpRight size={15} className="group-hover:rotate-45 transition-transform"/>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_,i) => <div key={i} className="h-28 rounded-2xl bg-forest-100 dark:bg-forest-800 animate-pulse"/>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, i) => {
              const best = group.offers[0];
              const worst = group.offers[group.offers.length-1];
              const savings = worst.price - best.price;
              return (
                <motion.div key={group.slug}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.5, delay: i*0.07, ease:[0.16,1,0.3,1] }}
                  className="group bg-white dark:bg-forest-900 rounded-2xl border border-forest-200/60 dark:border-forest-800/50 p-4 hover:border-forest-300 dark:hover:border-forest-700 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => window.location.href='/marketplace'}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-2xl mb-1">{CAT_EMOJI[group.category]||'🌳'}</div>
                      <h3 className="text-[14px] font-bold text-forest-950 dark:text-forest-50 leading-tight">{group.canonicalName}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-forest-500">from</div>
                      <div className="text-xl font-black text-emerald-600 tabular-nums">€{best.price.toFixed(0)}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {group.offers.slice(0,3).map((offer,j) => (
                      <div key={j} className="flex items-center justify-between text-[12px]">
                        <span className="text-forest-600 dark:text-forest-400 truncate">{offer.sellerName}</span>
                        <span className={`font-semibold tabular-nums ${j===0?'text-emerald-600':'text-forest-700 dark:text-forest-200'}`}>€{offer.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-forest-100 dark:border-forest-800 flex items-center justify-between">
                    <span className="text-[11px] text-forest-500 flex items-center gap-1"><Users size={10}/>{group.offers.length} sellers</span>
                    {savings > 1 && <span className="text-[11px] font-semibold text-emerald-600">Save up to €{savings.toFixed(0)}</span>}
                    <ArrowUpRight size={13} className="text-forest-400 group-hover:text-forest-700 dark:group-hover:text-forest-200 transition-colors"/>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && groups.length > 0 && (
          <div className="text-center mt-8">
            <Link href="/marketplace" className="text-[13px] text-forest-600 dark:text-forest-400 hover:text-forest-900 dark:hover:text-white underline underline-offset-4 transition-colors">
              View all {stats.products} plants with price comparison →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
