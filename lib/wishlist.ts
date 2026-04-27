'use client';

const KEY = 'ph_wishlist';

export function getWishlist(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function toggleWishlist(id: string): boolean {
  const list = getWishlist();
  const idx = list.indexOf(id);
  if (idx === -1) { list.push(id); localStorage.setItem(KEY, JSON.stringify(list)); return true; }
  list.splice(idx, 1); localStorage.setItem(KEY, JSON.stringify(list)); return false;
}

export function isWishlisted(id: string): boolean {
  return getWishlist().includes(id);
}
