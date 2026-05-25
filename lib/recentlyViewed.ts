'use client';

const KEY = 'ph_recently_viewed';
const MAX = 8;

export interface ViewedItem {
  slug: string;
  name: string;
  category: string;
  bestPrice: number;
  viewedAt: string;
}

export function recordView(item: Omit<ViewedItem, 'viewedAt'>) {
  try {
    const items: ViewedItem[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    const filtered = items.filter(i => i.slug !== item.slug);
    filtered.unshift({ ...item, viewedAt: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)));
  } catch {}
}

export function getRecentlyViewed(): ViewedItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
