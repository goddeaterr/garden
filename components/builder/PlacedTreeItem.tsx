'use client';

import { useRef, memo } from 'react';
import { Maximize2, X } from 'lucide-react';
import type { PlacedTree, Tree } from '@/types';
import { getGardenDepthMetrics } from '@/lib/gardenDepth';

interface Props {
  placed: PlacedTree;
  tree: Tree;
  isSelected: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onSelect: (uid: string) => void;
  onUpdate: (uid: string, partial: Partial<PlacedTree>) => void;
  onRemove: (uid: string) => void;
  scaleMetersPerPixel: number | null;
}

interface PointerPoint {
  x: number;
  y: number;
}

type Interaction =
  | {
      mode: 'move';
      pointerId: number;
      startX: number;
      startY: number;
      originPx: number;
      originPy: number;
    }
  | {
      mode: 'gesture';
      startDistance: number;
      startAngle: number;
      startCenter: PointerPoint;
      originPx: number;
      originPy: number;
      startScale: number;
      startRotation: number;
    };

const BASE_SIZE = 180;
const MIN_SCALE = 0.28;
const MAX_SCALE = 3;
const MAX_ROTATION = 80;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distance(a: PointerPoint, b: PointerPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angle(a: PointerPoint, b: PointerPoint) {
  return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
}

function midpoint(a: PointerPoint, b: PointerPoint) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function normalizedDeltaAngle(next: number, start: number) {
  let delta = next - start;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

export const PlacedTreeItem = memo(function PlacedTreeItem({
  placed, tree, isSelected, containerRef, onSelect, onUpdate, onRemove, scaleMetersPerPixel,
}: Props) {
  const selfRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const sizeLabelRef = useRef<HTMLDivElement>(null);
  const activePointers = useRef(new Map<number, PointerPoint>());
  const interaction = useRef<Interaction | null>(null);
  const handleState = useRef<{
    mode: 'resize';
    pointerId: number;
    anchor: PointerPoint;
    startDistance: number;
    startAngle: number;
    startScale: number;
    startRotation: number;
  } | null>(null);
  const livePlaced = useRef(placed);
  livePlaced.current = placed;

  const metrics = getGardenDepthMetrics(placed, tree);

  const outerTransform = (value: PlacedTree) => {
    const m = getGardenDepthMetrics(value, tree);
    return `translate(-50%, -82%) scale(${m.finalScale})`;
  };

  const visualTransform = (value: PlacedTree) =>
    `rotate(${value.rotation}deg) scaleX(${value.flipped ? -1 : 1})`;

  const applyShadowStyle = (value: PlacedTree) => {
    const shadow = shadowRef.current;
    if (!shadow) return;
    const m = getGardenDepthMetrics(value, tree);
    shadow.style.opacity = String(m.shadowOpacity);
    shadow.style.filter = `blur(${m.shadowBlur}px)`;
    shadow.style.transform = `translate(-50%, 0) scaleX(${m.shadowScale})`;
  };

  const applyLiveStyle = (next: PlacedTree) => {
    livePlaced.current = next;
    const el = selfRef.current;
    if (!el) return;
    const m = getGardenDepthMetrics(next, tree);
    el.style.left = `${next.x * 100}%`;
    el.style.top = `${next.y * 100}%`;
    el.style.transform = outerTransform(next);
    el.style.opacity = String(m.visualOpacity);
    el.style.zIndex = String(m.zIndex);
    el.style.filter = `blur(${m.blurPx}px) drop-shadow(0 ${Math.round(4 + m.depth * 8)}px ${Math.round(8 + m.depth * 12)}px rgba(0,0,0,${0.14 + m.depth * 0.18}))`;
    if (visualRef.current) visualRef.current.style.transform = visualTransform(next);
    applyShadowStyle(next);
  };

  const controlScale = clamp(1 / Math.max(metrics.finalScale, 0.5), 0.58, 1.9);

  const commitLiveStyle = () => {
    const next = livePlaced.current;
    onUpdate(placed.uid, {
      x: next.x,
      y: next.y,
      scale: next.scale,
      rotation: next.rotation,
    });
  };

  const resetPointerInteraction = () => {
    activePointers.current.clear();
    interaction.current = null;
  };

  const startMove = (pointerId: number, point: PointerPoint) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const current = livePlaced.current;
    interaction.current = {
      mode: 'move',
      pointerId,
      startX: point.x,
      startY: point.y,
      originPx: current.x * rect.width,
      originPy: current.y * rect.height,
    };
  };

  const startGesture = () => {
    const container = containerRef.current;
    const points = Array.from(activePointers.current.values()).slice(0, 2);
    if (!container || points.length < 2) return;
    const rect = container.getBoundingClientRect();
    const current = livePlaced.current;
    interaction.current = {
      mode: 'gesture',
      startDistance: Math.max(24, distance(points[0], points[1])),
      startAngle: angle(points[0], points[1]),
      startCenter: midpoint(points[0], points[1]),
      originPx: current.x * rect.width,
      originPy: current.y * rect.height,
      startScale: current.scale,
      startRotation: current.rotation,
    };
  };

  const updateMove = (state: Extract<Interaction, { mode: 'move' }>, point: PointerPoint) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const current = livePlaced.current;
    applyLiveStyle({
      ...current,
      x: clamp((state.originPx + point.x - state.startX) / rect.width, 0.02, 0.98),
      y: clamp((state.originPy + point.y - state.startY) / rect.height, 0.06, 0.98),
    });
  };

  const updateGesture = (state: Extract<Interaction, { mode: 'gesture' }>) => {
    const container = containerRef.current;
    const points = Array.from(activePointers.current.values()).slice(0, 2);
    if (!container || points.length < 2) return;
    const rect = container.getBoundingClientRect();
    const center = midpoint(points[0], points[1]);
    const nextDistance = Math.max(24, distance(points[0], points[1]));
    const nextAngle = angle(points[0], points[1]);
    const current = livePlaced.current;

    applyLiveStyle({
      ...current,
      x: clamp((state.originPx + center.x - state.startCenter.x) / rect.width, 0.02, 0.98),
      y: clamp((state.originPy + center.y - state.startCenter.y) / rect.height, 0.06, 0.98),
      scale: clamp(state.startScale * (nextDistance / state.startDistance), MIN_SCALE, MAX_SCALE),
      rotation: clamp(state.startRotation + normalizedDeltaAngle(nextAngle, state.startAngle), -MAX_ROTATION, MAX_ROTATION),
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(placed.uid);
    if (e.pointerType === 'mouse' || e.isPrimary || activePointers.current.has(e.pointerId)) {
      resetPointerInteraction();
    }
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}

    if (activePointers.current.size >= 2) startGesture();
    else startMove(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size >= 2) {
      if (interaction.current?.mode !== 'gesture') startGesture();
      if (interaction.current?.mode === 'gesture') updateGesture(interaction.current);
      return;
    }

    if (interaction.current?.mode === 'move' && interaction.current.pointerId === e.pointerId) {
      updateMove(interaction.current, { x: e.clientX, y: e.clientY });
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.delete(e.pointerId);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}

    if (activePointers.current.size >= 2) {
      startGesture();
      return;
    }

    if (activePointers.current.size === 1) {
      const [entry] = activePointers.current.entries();
      startMove(entry[0], entry[1]);
      return;
    }

    commitLiveStyle();
    resetPointerInteraction();
  };

  const onLostPointerCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size >= 2) {
      startGesture();
      return;
    }

    if (activePointers.current.size === 1) {
      const [entry] = activePointers.current.entries();
      startMove(entry[0], entry[1]);
      return;
    }

    commitLiveStyle();
    resetPointerInteraction();
  };

  const getHandleAnchor = () => {
    const el = selfRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.bottom };
    }

    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    const current = livePlaced.current;
    return rect
      ? { x: rect.left + current.x * rect.width, y: rect.top + current.y * rect.height }
      : { x: 0, y: 0 };
  };

  const updateSizeLabel = (nextScale: number) => {
    const label = sizeLabelRef.current;
    if (!label) return;
    if (!scaleMetersPerPixel) { label.style.display = 'none'; return; }
    const current = livePlaced.current;
    const metrics = getGardenDepthMetrics({ ...current, scale: nextScale }, tree);
    const renderedPx = BASE_SIZE * metrics.finalScale;
    const meters = renderedPx * scaleMetersPerPixel;
    label.textContent = meters >= 1 ? `${meters.toFixed(1)} m` : `${(meters * 100).toFixed(0)} cm`;
    label.style.display = 'flex';
  };

  const onHandlePointerMove = (e: PointerEvent) => {
    const state = handleState.current;
    if (!state || e.pointerId !== state.pointerId) return;
    e.preventDefault();
    const current = livePlaced.current;
    const point = { x: e.clientX, y: e.clientY };
    const nextScale = clamp(state.startScale * (distance(state.anchor, point) / state.startDistance), MIN_SCALE, MAX_SCALE);
    applyLiveStyle({ ...current, scale: nextScale });
    updateSizeLabel(nextScale);
  };

  const onHandlePointerUp = (e: PointerEvent) => {
    const state = handleState.current;
    if (!state || e.pointerId !== state.pointerId) return;
    window.removeEventListener('pointermove', onHandlePointerMove);
    window.removeEventListener('pointerup', onHandlePointerUp);
    window.removeEventListener('pointercancel', onHandlePointerUp);
    handleState.current = null;
    // Hide size label
    if (sizeLabelRef.current) sizeLabelRef.current.style.display = 'none';
    commitLiveStyle();
  };

  const onHandlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(placed.uid);
    const current = livePlaced.current;
    const anchor = getHandleAnchor();
    const point = { x: e.clientX, y: e.clientY };
    handleState.current = {
      mode: 'resize',
      pointerId: e.pointerId,
      anchor,
      startDistance: Math.max(24, distance(anchor, point)),
      startAngle: angle(anchor, point),
      startScale: current.scale,
      startRotation: current.rotation,
    };

    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    window.addEventListener('pointermove', onHandlePointerMove, { passive: false });
    window.addEventListener('pointerup', onHandlePointerUp);
    window.addEventListener('pointercancel', onHandlePointerUp);
  };

  return (
    <div
      ref={selfRef}
      data-builder-ui
      data-placed-tree
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onLostPointerCapture}
      onClick={e => {
        e.stopPropagation();
        onSelect(placed.uid);
      }}
      style={{
        position: 'absolute',
        left: `${placed.x * 100}%`,
        top: `${placed.y * 100}%`,
        width: BASE_SIZE,
        height: BASE_SIZE,
        transform: outerTransform(placed),
        transformOrigin: 'center bottom',
        opacity: metrics.visualOpacity,
        zIndex: metrics.zIndex,
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        willChange: 'left, top, transform',
        filter: `blur(${metrics.blurPx}px) drop-shadow(0 ${Math.round(4 + metrics.depth * 8)}px ${Math.round(8 + metrics.depth * 12)}px rgba(0,0,0,${0.14 + metrics.depth * 0.18}))`,
        outline: isSelected ? '2px solid rgba(113,158,114,0.9)' : 'none',
        outlineOffset: '5px',
      }}
    >
      <div
        ref={shadowRef}
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: metrics.shadowY,
          width: 110,
          height: 24,
          borderRadius: '999px',
          background: 'rgba(33, 55, 36, 0.45)',
          opacity: metrics.shadowOpacity,
          filter: `blur(${metrics.shadowBlur}px)`,
          transform: `translate(-50%, 0) scaleX(${metrics.shadowScale})`,
          transformOrigin: 'center',
          pointerEvents: 'none',
        }}
      />
      <div
        ref={visualRef}
        style={{
          width: '100%',
          height: '100%',
          transform: visualTransform(placed),
          transformOrigin: 'center bottom',
          pointerEvents: 'none',
        }}
      >
        {tree.builderImagePath ? (
          <img
            src={tree.builderImagePath}
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
      </div>

      {/* Size label — shown during resize when scale is calibrated */}
      <div
        ref={sizeLabelRef}
        style={{
          display: 'none',
          position: 'absolute',
          top: -36,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15,30,16,0.88)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: 8,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
          alignItems: 'center',
          gap: 4,
        }}
      />

      {isSelected && (
        <div data-builder-ui className="absolute inset-0 pointer-events-none">
          <button
            type="button"
            aria-label="Keisti dydį"
            title="Keisti dydį"
            onPointerDown={onHandlePointerDown}
            className="absolute -right-5 -bottom-5 w-11 h-11 rounded-full bg-forest-900/95 text-white border-2 border-white shadow-xl flex items-center justify-center active:scale-95 pointer-events-auto"
            style={{ touchAction: 'none', cursor: 'nwse-resize', transform: `scale(${controlScale})`, transformOrigin: 'center' }}
          >
            <Maximize2 size={17} />
          </button>
          <button
            type="button"
            aria-label="Augalą pašalinti"
            title="Pašalinti"
            onPointerDown={e => { e.stopPropagation(); e.preventDefault(); }}
            onClick={e => { e.stopPropagation(); onRemove(placed.uid); }}
            className="absolute -right-5 -top-5 w-9 h-9 rounded-full bg-white/95 dark:bg-forest-900/95 border border-forest-300 dark:border-forest-700 shadow-lg flex items-center justify-center text-forest-500 hover:text-red-500 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/30 dark:hover:border-red-700 active:scale-95 pointer-events-auto transition-colors"
            style={{ touchAction: 'none', cursor: 'pointer', transform: `scale(${controlScale})`, transformOrigin: 'center' }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
});
