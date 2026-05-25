'use client';

import { useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGarden } from './GardenContext';
import { PlacedTreeItem } from './PlacedTreeItem';
import { useTrees } from '@/lib/useTrees';
import { useI18n } from '@/lib/i18nContext';
import { Upload, ImagePlus, Trees, Ruler, X, Check } from 'lucide-react';

type CalibPhase =
  | { phase: 'idle' }
  | { phase: 'picking-start' }
  | { phase: 'picking-end'; p1x: number; p1y: number; curX: number; curY: number }
  | { phase: 'input'; p1x: number; p1y: number; p2x: number; p2y: number };

export function Canvas() {
  const {
    placed, addTree, backgroundImage, setBackgroundImage,
    setSelectedUid, selectedUid, updateTree, removeTree, canvasRef: containerRef,
    scaleMetersPerPixel, setScaleMetersPerPixel,
  } = useGarden();
  const trees = useTrees();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [calib, setCalib] = useState<CalibPhase>({ phase: 'idle' });
  const [calibInput, setCalibInput] = useState('');
  const { tr } = useI18n();
  const cv = tr.canvas;

  const isBuilderUiTarget = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest('[data-builder-ui]'));

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setBackgroundImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const triggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const treeId = e.dataTransfer.getData('text/tree-id');
    if (treeId) { addTree(treeId, Math.max(0.05, Math.min(0.95, x)), Math.max(0.1, Math.min(0.95, y))); return; }
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [addTree]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);

  // ── Calibration helpers ──────────────────────────────────────────────
  const getCanvasPoint = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isBuilderUiTarget(e.target)) return;

    if (calib.phase === 'picking-start') {
      const { x, y } = getCanvasPoint(e);
      setCalib({ phase: 'picking-end', p1x: x, p1y: y, curX: x, curY: y });
      return;
    }
    if (calib.phase === 'picking-end') {
      const { x, y } = getCanvasPoint(e);
      setCalib({ phase: 'input', p1x: calib.p1x, p1y: calib.p1y, p2x: x, p2y: y });
      setCalibInput('');
      return;
    }
    // Normal: deselect
    if (calib.phase === 'idle') setSelectedUid(null);
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (calib.phase === 'picking-end') {
      const { x, y } = getCanvasPoint(e);
      setCalib({ ...calib, curX: x, curY: y });
    }
  };

  const confirmCalib = () => {
    if (calib.phase !== 'input') return;
    const meters = parseFloat(calibInput.replace(',', '.'));
    if (!isFinite(meters) || meters <= 0) return;
    const px = Math.hypot(calib.p2x - calib.p1x, calib.p2y - calib.p1y);
    if (px < 4) return;
    setScaleMetersPerPixel(meters / px);
    setCalib({ phase: 'idle' });
  };

  const cancelCalib = () => {
    setCalib({ phase: 'idle' });
    setCalibInput('');
  };

  // SVG line coords
  const lineData = (() => {
    if (calib.phase === 'picking-end') {
      return { x1: calib.p1x, y1: calib.p1y, x2: calib.curX, y2: calib.curY };
    }
    if (calib.phase === 'input') {
      return { x1: calib.p1x, y1: calib.p1y, x2: calib.p2x, y2: calib.p2y };
    }
    return null;
  })();

  const isCalibrating = calib.phase !== 'idle';

  return (
    <div
      ref={containerRef}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onPointerDown={isCalibrating ? undefined : (e) => {
        if (!isBuilderUiTarget(e.target)) setSelectedUid(null);
      }}
      onClick={onCanvasClick}
      onMouseMove={onCanvasMouseMove}
      className="builder-canvas relative w-full h-full overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 via-sky-50 to-moss-100 dark:from-forest-900 dark:via-forest-950 dark:to-forest-900"
      style={{ cursor: calib.phase === 'picking-start' || calib.phase === 'picking-end' ? 'crosshair' : undefined }}
    >
      {/* Single always-mounted file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <AnimatePresence mode="wait">
        {backgroundImage && backgroundImage !== 'stock' ? (
          <motion.img key="user-bg" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} src={backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        ) : backgroundImage === 'stock' ? (
          <StockScene key="stock" />
        ) : (
          <DefaultScene key="default" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dragOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-2 z-20 rounded-2xl border-2 border-dashed border-forest-500 dark:border-forest-300 bg-forest-50/30 dark:bg-forest-950/30 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="text-center text-forest-800 dark:text-forest-100">
              <Upload size={32} className="mx-auto mb-2" />
              <div className="font-medium">{cv.dropHere}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!backgroundImage && (
        <div
          data-builder-ui
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 pointer-events-auto"
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Desktop card */}
          <div className="hidden sm:block glass-strong rounded-2xl p-8 shadow-2xl shadow-forest-900/10 text-center max-w-sm mx-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
              <ImagePlus size={24} className="text-forest-700 dark:text-forest-200" />
            </div>
            <h3 className="text-lg font-semibold text-forest-950 dark:text-forest-50 mb-2 tracking-tight">{cv.uploadTitle}</h3>
            <p className="text-[13px] text-forest-600 dark:text-forest-400 mb-5 leading-relaxed">{cv.uploadSub}</p>
            <div className="flex gap-2">
              <button onClick={triggerFilePicker} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[13px] font-medium active:scale-[0.98] transition-transform">
                <Upload size={13} />{cv.uploadBtn}
              </button>
              <button onClick={() => setBackgroundImage('stock')} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-forest-100 dark:bg-forest-800 text-forest-800 dark:text-forest-100 text-[13px] font-medium">
                <Trees size={13} />{cv.sampleBtn}
              </button>
            </div>
          </div>

          {/* Mobile compact — two pill buttons */}
          <div className="flex sm:hidden gap-2">
            <button onClick={triggerFilePicker}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-forest-900 text-white text-[13px] font-semibold active:scale-95 transition-transform shadow-lg">
              <Upload size={14} />{cv.uploadBtn}
            </button>
            <button onClick={() => setBackgroundImage('stock')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/80 border border-forest-200 text-forest-800 text-[13px] font-medium active:scale-95 transition-transform shadow">
              <Trees size={14} />{cv.sampleBtn}
            </button>
          </div>
        </div>
      )}

      {placed.map(p => {
        const tree = trees.find(t => t.id === p.treeId);
        if (!tree) return null;
        return (
          <PlacedTreeItem
            key={p.uid}
            placed={p}
            tree={tree}
            isSelected={selectedUid === p.uid}
            containerRef={containerRef}
            onSelect={setSelectedUid}
            onUpdate={updateTree}
            onRemove={removeTree}
            scaleMetersPerPixel={scaleMetersPerPixel}
          />
        );
      })}

      {/* ── Calibration SVG overlay ── */}
      {lineData && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-40"
          style={{ overflow: 'visible' }}
        >
          {/* Line */}
          <line
            x1={lineData.x1} y1={lineData.y1}
            x2={lineData.x2} y2={lineData.y2}
            stroke="#22c55e" strokeWidth="2" strokeDasharray="6 4"
          />
          {/* Arrow heads */}
          <circle cx={lineData.x1} cy={lineData.y1} r="5" fill="#22c55e" />
          <circle cx={lineData.x2} cy={lineData.y2} r="5" fill="#22c55e" />
        </svg>
      )}

      {/* Calibration instruction banner */}
      {(calib.phase === 'picking-start' || calib.phase === 'picking-end') && (
        <div
          data-builder-ui
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-xl px-4 py-2 shadow-lg flex items-center gap-3"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <Ruler size={15} className="text-green-500 flex-shrink-0" />
          <span className="text-[13px] font-medium text-forest-900 dark:text-forest-50">
            {calib.phase === 'picking-start' ? cv.calibStart : cv.calibEnd}
          </span>
          <button onClick={cancelCalib} className="ml-2 text-forest-400 hover:text-forest-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Calibration length input */}
      {calib.phase === 'input' && (
        <div
          data-builder-ui
          className="absolute z-50 glass-strong rounded-xl p-3 shadow-xl"
          style={{
            left: Math.min(calib.p1x, calib.p2x) + Math.abs(calib.p2x - calib.p1x) / 2 - 100,
            top: Math.min(calib.p1y, calib.p2y) + Math.abs(calib.p2y - calib.p1y) / 2 + 16,
          }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <div className="text-[11px] text-forest-500 mb-1.5 font-medium">{cv.calibLabel}</div>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="number"
              min="0.1"
              step="0.5"
              placeholder={cv.calibPlaceholder}
              value={calibInput}
              onChange={e => setCalibInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmCalib(); if (e.key === 'Escape') cancelCalib(); }}
              className="w-20 px-2 py-1.5 rounded-lg border border-forest-200 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-900 dark:text-forest-50 text-[13px] font-medium outline-none focus:ring-2 focus:ring-green-400"
            />
            <span className="text-[13px] text-forest-600 dark:text-forest-300 font-medium">m</span>
            <button
              onClick={confirmCalib}
              className="w-7 h-7 rounded-lg bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              <Check size={14} />
            </button>
            <button onClick={cancelCalib} className="w-7 h-7 rounded-lg bg-forest-100 dark:bg-forest-800 text-forest-600 dark:text-forest-300 flex items-center justify-center">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Scale calibration button + indicator */}
      {backgroundImage && (
        <div
          data-builder-ui
          className="absolute bottom-4 right-4 z-30 flex items-center gap-2"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          {scaleMetersPerPixel !== null && !isCalibrating && (
            <div className="glass-strong rounded-full px-3 py-1.5 text-[11px] font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <Ruler size={11} />
              {cv.scaleSet}
              <button onClick={() => setScaleMetersPerPixel(null)} className="ml-1 text-forest-400 hover:text-red-500">
                <X size={10} />
              </button>
            </div>
          )}
          {!isCalibrating && (
            <button
              onClick={() => setCalib({ phase: 'picking-start' })}
              className="glass-strong rounded-full px-3 py-2 text-[12px] font-medium text-forest-800 dark:text-forest-100 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5"
            >
              <Ruler size={12} />
              {scaleMetersPerPixel !== null ? cv.recalibrate : cv.setScale}
            </button>
          )}
          <button
            data-builder-ui
            onClick={triggerFilePicker}
            className="glass-strong rounded-full px-3 py-2 text-[12px] font-medium text-forest-800 dark:text-forest-100 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <ImagePlus size={12} />{cv.changePhoto}
          </button>
        </div>
      )}
    </div>
  );
}

function DefaultScene() {
  return (
    <motion.svg key="default-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="sky-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dbeafe" /><stop offset="60%" stopColor="#e3ede3" /><stop offset="100%" stopColor="#c8dac9" />
        </linearGradient>
        <linearGradient id="ground-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9fbf9f" /><stop offset="100%" stopColor="#508153" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#sky-gradient)" />
      <ellipse cx="600" cy="800" rx="900" ry="280" fill="url(#ground-gradient)" />
      <ellipse cx="200" cy="780" rx="500" ry="120" fill="rgba(60,103,65,0.3)" />
      <ellipse cx="900" cy="780" rx="450" ry="100" fill="rgba(60,103,65,0.25)" />
    </motion.svg>
  );
}

function StockScene() {
  return (
    <motion.svg key="stock-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="stock-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" /><stop offset="40%" stopColor="#fde68a" /><stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="stock-ground" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#86efac" /><stop offset="50%" stopColor="#4ade80" /><stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="stock-path" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d6c399" /><stop offset="100%" stopColor="#b6925b" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#stock-sky)" />
      <circle cx="900" cy="200" r="60" fill="#fff" opacity="0.7" />
      <circle cx="900" cy="200" r="100" fill="#fff" opacity="0.2" />
      <path d="M0 450 L150 380 L300 410 L450 360 L600 390 L750 350 L900 400 L1050 370 L1200 400 L1200 800 L0 800 Z" fill="rgba(167,139,250,0.4)" />
      <path d="M0 550 L200 480 L400 520 L600 470 L800 510 L1000 480 L1200 520 L1200 800 L0 800 Z" fill="#bbf7d0" opacity="0.7" />
      <ellipse cx="600" cy="900" rx="1100" ry="350" fill="url(#stock-ground)" />
      <path d="M500 800 Q550 700 580 600 Q600 540 620 500 Q625 480 630 470" stroke="url(#stock-path)" strokeWidth="80" fill="none" strokeLinecap="round" opacity="0.8" />
    </motion.svg>
  );
}
