'use client';

import { useState, useEffect } from 'react';
import type { Tree } from '@/types';

// Category → simple SVG fallback
const CATEGORY_SVG: Record<string, string> = {
  fruit: `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><path d="M95 280L95 175Q92 155 94 140L106 140Q108 155 105 175L105 280Z" fill="#6b4c2a"/><ellipse cx="100" cy="105" rx="72" ry="70" fill="#6aaa4e"/><ellipse cx="72" cy="88" rx="32" ry="29" fill="#88c866" opacity="0.7"/><ellipse cx="132" cy="92" rx="28" ry="26" fill="#88c866" opacity="0.6"/><circle cx="80" cy="118" r="7" fill="#d85a30"/><circle cx="118" cy="128" r="6" fill="#c2452d"/></svg>`,
  evergreen: `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><rect x="93" y="220" width="14" height="60" fill="#6b4c2a"/><polygon points="100,20 55,110 85,110 45,175 75,175 30,240 170,240 125,175 155,175 115,110 145,110" fill="#3d7a3f"/><polygon points="100,20 60,105 90,105 52,168 80,168 38,232 162,232 120,168 148,168 110,105 140,105" fill="#508153" opacity="0.7"/></svg>`,
  decorative: `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><path d="M97 280L97 170Q94 155 96 140L104 140Q106 155 103 170L103 280Z" fill="#6b4c2a"/><ellipse cx="100" cy="100" rx="75" ry="72" fill="#8fa85a"/><ellipse cx="70" cy="82" rx="35" ry="30" fill="#adc46e" opacity="0.7"/><ellipse cx="132" cy="88" rx="30" ry="28" fill="#adc46e" opacity="0.6"/><ellipse cx="100" cy="58" rx="26" ry="24" fill="#c8da8a" opacity="0.5"/></svg>`,
  shrub: `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><rect x="92" y="230" width="16" height="50" fill="#6b4c2a"/><ellipse cx="100" cy="160" rx="80" ry="65" fill="#6aaa4e"/><ellipse cx="65" cy="145" rx="42" ry="38" fill="#88c866" opacity="0.8"/><ellipse cx="138" cy="150" rx="38" ry="35" fill="#88c866" opacity="0.7"/><ellipse cx="100" cy="125" rx="35" ry="32" fill="#aada82" opacity="0.6"/></svg>`,
};

function groupToTree(group: any): Tree {
  const bestOffer = group.offers?.[0];
  const imageUrl = bestOffer?.imageUrl || group.offers?.find((o: any) => o.imageUrl)?.imageUrl || '';
  const localPath = bestOffer?.localImagePath || group.offers?.find((o: any) => o.localImagePath)?.localImagePath || '';

  return {
    id: group.slug,
    name: group.canonicalName,
    latin: group.latinName || '',
    category: group.category || 'decorative',
    size: 'medium',
    price: group.bestPrice || 0,
    height: bestOffer?.height || '',
    description: `${group.canonicalName}${group.latinName ? ` (${group.latinName})` : ''} — ${group.offers?.length || 1} seller${(group.offers?.length || 1) !== 1 ? 's' : ''} from €${group.bestPrice?.toFixed(0) || 0}`,
    svg: CATEGORY_SVG[group.category] || CATEGORY_SVG.decorative,
    imagePath: localPath || imageUrl || undefined,
    color: { fruit: '#d85a30', evergreen: '#3d7a3f', decorative: '#8fa85a', shrub: '#6aaa4e' }[group.category as string] || '#508153',
    care: {
      watering: '', sunlight: '', soil: '', pruning: '',
      hardiness: '', spacing: '', growthRate: '',
      notes: group.offers?.map((o: any) => `${o.sellerName}: €${o.price} — ${o.sourceUrl}`).join('\n') || '',
    },
  };
}

let cachedTrees: Tree[] | null = null;
let cacheTime = 0;
const CACHE_MS = 60_000;

export function useTrees(): Tree[] {
  const [trees, setTrees] = useState<Tree[]>(cachedTrees || []);

  useEffect(() => {
    const now = Date.now();
    if (cachedTrees && now - cacheTime < CACHE_MS) return;

    fetch('/marketplace.json?t=' + now, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!d?.groups?.length) return;
        const converted: Tree[] = d.groups.map(groupToTree);
        cachedTrees = converted;
        cacheTime = Date.now();
        setTrees(converted);
      })
      .catch(() => {});
  }, []);

  return trees;
}

// Bust cache (call after scrape completes)
export function bustTreeCache() {
  cachedTrees = null;
  cacheTime = 0;
}
