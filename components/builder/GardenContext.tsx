'use client';

import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, ReactNode, RefObject } from 'react';
import type { PlacedTree } from '@/types';
import { useTrees } from '@/lib/useTrees';
import { uid } from '@/lib/utils';

interface GardenContextValue {
  placed: PlacedTree[];
  selectedUid: string | null;
  setSelectedUid: (uid: string | null) => void;
  addTree: (treeId: string, x?: number, y?: number) => void;
  updateTree: (uid: string, partial: Partial<PlacedTree>) => void;
  removeTree: (uid: string) => void;
  duplicateTree: (uid: string) => void;
  bringForward: (uid: string) => void;
  sendBackward: (uid: string) => void;
  clearAll: () => void;
  total: number;
  backgroundImage: string | null;
  setBackgroundImage: (url: string | null) => void;
  canvasRef: RefObject<HTMLDivElement>;
  planSnapshot: string | null;
  setPlanSnapshot: (v: string | null) => void;
  showCheckout: boolean;
  setShowCheckout: (v: boolean) => void;
  /** meters per canvas pixel — null until user calibrates */
  scaleMetersPerPixel: number | null;
  setScaleMetersPerPixel: (v: number | null) => void;
  /** Explicit project save — persists to localStorage and returns true */
  saveProject: () => boolean;
  /** True when at least one plant has ever been saved to localStorage */
  hasSavedProject: boolean;
}

const GardenContext = createContext<GardenContextValue | null>(null);

const LS_KEY = 'plantgpt-project-v1';

export function GardenProvider({ children }: { children: ReactNode }) {
  const trees = useTrees();
  const [placed, setPlaced] = useState<PlacedTree[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [planSnapshot, setPlanSnapshot] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [scaleMetersPerPixel, setScaleMetersPerPixel] = useState<number | null>(null);
  const [hasSavedProject, setHasSavedProject] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Restore from localStorage on mount ──────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { placed?: PlacedTree[] };
      if (Array.isArray(data.placed) && data.placed.length > 0) {
        setPlaced(data.placed);
        setHasSavedProject(true);
      }
    } catch {}
  }, []);

  // ── Auto-save placed trees on every change ───────────────────────────
  useEffect(() => {
    if (placed.length === 0) return; // don't overwrite a saved project with empty
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ placed, savedAt: Date.now() }));
      setHasSavedProject(true);
    } catch {}
  }, [placed]);

  const addTree = useCallback((treeId: string, x = 0.5, y = 0.7) => {
    setPlaced(prev => {
      const maxZ = prev.reduce((m, p) => Math.max(m, p.z), 0);
      const t: PlacedTree = { uid: uid(), treeId, x, y, scale: 1, rotation: 0, flipped: false, opacity: 1, z: maxZ + 1 };
      setSelectedUid(t.uid);
      return [...prev, t];
    });
  }, []);

  const updateTree = useCallback((u: string, partial: Partial<PlacedTree>) => {
    setPlaced(prev => prev.map(p => p.uid === u ? { ...p, ...partial } : p));
  }, []);

  const removeTree = useCallback((u: string) => {
    setPlaced(prev => prev.filter(p => p.uid !== u));
    setSelectedUid(cur => cur === u ? null : cur);
  }, []);

  const duplicateTree = useCallback((u: string) => {
    setPlaced(prev => {
      const t = prev.find(p => p.uid === u);
      if (!t) return prev;
      const maxZ = prev.reduce((m, p) => Math.max(m, p.z), 0);
      const copy: PlacedTree = { ...t, uid: uid(), x: Math.min(0.95, t.x + 0.05), y: Math.min(0.95, t.y + 0.03), z: maxZ + 1 };
      setSelectedUid(copy.uid);
      return [...prev, copy];
    });
  }, []);

  const bringForward = useCallback((u: string) => {
    setPlaced(prev => {
      const maxZ = prev.reduce((m, p) => Math.max(m, p.z), 0);
      return prev.map(p => p.uid === u ? { ...p, z: maxZ + 1 } : p);
    });
  }, []);

  const sendBackward = useCallback((u: string) => {
    setPlaced(prev => {
      const minZ = prev.reduce((m, p) => Math.min(m, p.z), Infinity);
      return prev.map(p => p.uid === u ? { ...p, z: minZ - 1 } : p);
    });
  }, []);

  const clearAll = useCallback(() => {
    setPlaced([]);
    setSelectedUid(null);
    try { localStorage.removeItem(LS_KEY); } catch {}
    setHasSavedProject(false);
  }, []);

  const saveProject = useCallback((): boolean => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ placed, savedAt: Date.now() }));
      setHasSavedProject(true);
      return true;
    } catch {
      return false;
    }
  }, [placed]);

  const total = useMemo(() =>
    placed.reduce((sum, p) => sum + (trees.find(t => t.id === p.treeId)?.price || 0), 0),
    [placed]
  );

  return (
    <GardenContext.Provider value={{
      placed, selectedUid, setSelectedUid,
      addTree, updateTree, removeTree, duplicateTree, bringForward, sendBackward, clearAll,
      total, backgroundImage, setBackgroundImage,
      canvasRef,
      planSnapshot, setPlanSnapshot,
      showCheckout, setShowCheckout,
      scaleMetersPerPixel, setScaleMetersPerPixel,
      saveProject, hasSavedProject,
    }}>
      {children}
    </GardenContext.Provider>
  );
}

export function useGarden() {
  const ctx = useContext(GardenContext);
  if (!ctx) throw new Error('useGarden must be used inside GardenProvider');
  return ctx;
}
