'use client';

import { useState, useEffect } from 'react';
import type { Tree } from '@/types';

const CATEGORY_SVG: Record<string, string> = {
  trees:    `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><path d="M97 280L97 170Q94 155 96 140L104 140Q106 155 103 170L103 280Z" fill="#6b4c2a"/><ellipse cx="100" cy="100" rx="75" ry="72" fill="#8fa85a"/><ellipse cx="70" cy="82" rx="35" ry="30" fill="#adc46e" opacity="0.7"/><ellipse cx="132" cy="88" rx="30" ry="28" fill="#adc46e" opacity="0.6"/><ellipse cx="100" cy="58" rx="26" ry="24" fill="#c8da8a" opacity="0.5"/></svg>`,
  shrubs:   `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><rect x="92" y="230" width="16" height="50" fill="#6b4c2a"/><ellipse cx="100" cy="160" rx="80" ry="65" fill="#6aaa4e"/><ellipse cx="65" cy="145" rx="42" ry="38" fill="#88c866" opacity="0.8"/><ellipse cx="138" cy="150" rx="38" ry="35" fill="#88c866" opacity="0.7"/><ellipse cx="100" cy="125" rx="35" ry="32" fill="#aada82" opacity="0.6"/></svg>`,
  perennial:`<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><rect x="96" y="210" width="8" height="70" fill="#6b4c2a"/><ellipse cx="100" cy="150" rx="55" ry="50" fill="#c084fc" opacity="0.8"/><circle cx="100" cy="105" r="18" fill="#e879f9"/><circle cx="68" cy="130" r="14" fill="#d946ef" opacity="0.85"/><circle cx="132" cy="130" r="14" fill="#d946ef" opacity="0.85"/><circle cx="82" cy="160" r="12" fill="#c026d3" opacity="0.7"/><circle cx="118" cy="160" r="12" fill="#c026d3" opacity="0.7"/></svg>`,
  annual:   `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><rect x="96" y="210" width="8" height="70" fill="#6b4c2a"/><circle cx="100" cy="120" r="22" fill="#fbbf24"/><ellipse cx="100" cy="78" rx="14" ry="22" fill="#fde68a" opacity="0.9"/><ellipse cx="100" cy="162" rx="14" ry="22" fill="#fde68a" opacity="0.9"/><ellipse cx="62" cy="120" rx="22" ry="14" fill="#fde68a" opacity="0.9"/><ellipse cx="138" cy="120" rx="22" ry="14" fill="#fde68a" opacity="0.9"/></svg>`,
  conifer:  `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><rect x="93" y="220" width="14" height="60" fill="#6b4c2a"/><polygon points="100,20 55,110 85,110 45,175 75,175 30,240 170,240 125,175 155,175 115,110 145,110" fill="#3d7a3f"/><polygon points="100,20 60,105 90,105 52,168 80,168 38,232 162,232 120,168 148,168 110,105 140,105" fill="#508153" opacity="0.7"/></svg>`,
  climbing: `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><path d="M100 280 Q105 220 110 180 Q120 140 130 100 Q140 60 120 30" stroke="#6b4c2a" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="128" cy="58" rx="22" ry="18" fill="#4ade80" transform="rotate(-20 128 58)"/><ellipse cx="118" cy="100" rx="20" ry="16" fill="#22c55e" transform="rotate(15 118 100)"/><ellipse cx="125" cy="140" rx="22" ry="17" fill="#4ade80" transform="rotate(-10 125 140)"/><ellipse cx="112" cy="178" rx="20" ry="15" fill="#86efac" transform="rotate(20 112 178)"/></svg>`,
  hedge:    `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="160" width="180" height="120" rx="8" fill="#15803d"/><rect x="10" y="160" width="180" height="120" rx="8" fill="#166534" opacity="0.4"/><ellipse cx="45" cy="155" rx="38" ry="35" fill="#16a34a"/><ellipse cx="100" cy="148" rx="42" ry="38" fill="#15803d"/><ellipse cx="155" cy="155" rx="38" ry="35" fill="#16a34a"/><ellipse cx="72" cy="152" rx="32" ry="30" fill="#22c55e" opacity="0.6"/><ellipse cx="128" cy="152" rx="32" ry="30" fill="#22c55e" opacity="0.6"/></svg>`,
  potted:   `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><path d="M75 180 L65 260 L135 260 L125 180 Z" fill="#b45309"/><rect x="62" y="173" width="76" height="14" rx="5" fill="#92400e"/><ellipse cx="100" cy="125" rx="58" ry="55" fill="#6aaa4e"/><ellipse cx="72" cy="108" rx="28" ry="25" fill="#88c866" opacity="0.7"/><ellipse cx="130" cy="112" rx="25" ry="23" fill="#88c866" opacity="0.6"/><ellipse cx="100" cy="88" rx="22" ry="20" fill="#aada82" opacity="0.5"/></svg>`,
  grass:    `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><path d="M100 280 Q95 240 88 200 Q80 160 70 120 Q62 80 75 50" stroke="#84cc16" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M100 280 Q105 240 112 200 Q120 160 130 120 Q138 80 125 50" stroke="#65a30d" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M100 280 Q92 250 82 215 Q72 175 60 140 Q50 105 62 70" stroke="#a3e635" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M100 280 Q108 250 118 215 Q128 175 140 140 Q150 105 138 70" stroke="#a3e635" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M100 280 Q97 260 93 230 Q88 195 90 160 Q91 125 100 95" stroke="#4d7c0f" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
};

function enrichTree(raw: any): Tree {
  return {
    ...raw,
    svg: raw.svg || CATEGORY_SVG[raw.category as string] || CATEGORY_SVG.trees,
    care: raw.care || { watering:'', sunlight:'', soil:'', pruning:'', hardiness:'', spacing:'', growthRate:'', notes:'' },
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

    fetch('/api/trees')
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        const converted = data.map(enrichTree);
        cachedTrees = converted;
        cacheTime = Date.now();
        setTrees(converted);
      })
      .catch(() => {});
  }, []);

  return trees;
}

export function bustTreeCache() {
  cachedTrees = null;
  cacheTime = 0;
}
