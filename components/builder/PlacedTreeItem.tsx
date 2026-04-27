'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useGarden } from './GardenContext';
import { useTrees } from '@/lib/useTrees';
import type { PlacedTree } from '@/types';

interface Props {
  placed: PlacedTree;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function PlacedTreeItem({ placed, containerRef }: Props) {
  const trees = useTrees();
  const tree = trees.find(t => t.id === placed.treeId);
  const { selectedUid, setSelectedUid, updateTree } = useGarden();
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  if (!tree) return null;
  const isSelected = selectedUid === placed.uid;

  const perspectiveScale = 0.55 + placed.y * 0.55;
  const finalScale = placed.scale * perspectiveScale;
  const baseSize = 180;
  const renderSize = baseSize * finalScale;

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedUid(placed.uid);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    dragStart.current = { x: e.clientX, y: e.clientY, px: placed.x * rect.width, py: placed.y * rect.height };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const nx = Math.max(0.02, Math.min(0.98, (dragStart.current.px + dx) / rect.width));
    const ny = Math.max(0.05, Math.min(0.98, (dragStart.current.py + dy) / rect.height));
    updateTree(placed.uid, { x: nx, y: ny });
  };

  const onPointerUp = () => { dragStart.current = null; };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${placed.x * 100}%`,
    top: `${placed.y * 100}%`,
    width: renderSize,
    height: renderSize,
    transform: `translate(-50%, -80%) rotate(${placed.rotation}deg) scaleX(${placed.flipped ? -1 : 1})`,
    opacity: placed.opacity,
    zIndex: Math.min(placed.z, 20),
    cursor: 'grab',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    filter: `drop-shadow(0 ${renderSize * 0.04}px ${renderSize * 0.06}px rgba(0,0,0,0.35))`,
  };

  return (
    <motion.div
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      animate={{ outline: isSelected ? '2px solid rgba(113,158,114,0.9)' : '2px solid transparent', outlineOffset: '4px' }}
    >
      {tree.imagePath ? (
        <img
          src={tree.imagePath}
          alt={tree.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', pointerEvents: 'none', display: 'block' }}
          draggable={false}
          crossOrigin="anonymous"
        />
      ) : (
        <div
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          dangerouslySetInnerHTML={{ __html: tree.svg }}
        />
      )}
    </motion.div>
  );
}
