'use client';

const KEY = 'ph_price_history';
const HISTORY_DAYS = 30;
const MAX_ENTRIES_PER_SLUG = 30;

export interface PricePoint {
  date: string; // ISO date string YYYY-MM-DD
  price: number;
  sellerName: string;
}

export interface PriceHistoryEntry {
  slug: string;
  points: PricePoint[];
}

function readHistory(): Record<string, PricePoint[]> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function writeHistory(h: Record<string, PricePoint[]>) {
  try { localStorage.setItem(KEY, JSON.stringify(h)); } catch {}
}

export function recordPrice(slug: string, price: number, sellerName: string) {
  const h = readHistory();
  if (!h[slug]) h[slug] = [];
  const today = new Date().toISOString().slice(0, 10);
  // Update or add today's entry for this seller
  const existing = h[slug].findIndex(p => p.date === today && p.sellerName === sellerName);
  if (existing >= 0) { h[slug][existing].price = price; }
  else h[slug].push({ date: today, price, sellerName });
  // Keep only recent entries
  const cutoff = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString().slice(0, 10);
  h[slug] = h[slug].filter(p => p.date >= cutoff).slice(-MAX_ENTRIES_PER_SLUG);
  writeHistory(h);
}

export function getPriceHistory(slug: string): PricePoint[] {
  return readHistory()[slug] || [];
}
