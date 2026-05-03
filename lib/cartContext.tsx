'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Tree } from '@/types';

export interface CartItem { tree: Tree; quantity: number; }

interface CartCtx {
  items: CartItem[];
  addItem: (tree: Tree) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (tree: Tree) =>
    setItems(prev => {
      const ex = prev.find(i => i.tree.id === tree.id);
      if (ex) return prev.map(i => i.tree.id === tree.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { tree, quantity: 1 }];
    });

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.tree.id !== id));

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) { removeItem(id); return; }
    setItems(prev => prev.map(i => i.tree.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setItems([]);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal  = items.reduce((s, i) => s + i.tree.price * i.quantity, 0);

  return (
    <Ctx.Provider value={{
      items, addItem, removeItem, updateQty, clearCart,
      itemCount, subtotal,
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
