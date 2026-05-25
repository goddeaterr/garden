'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Canvas } from './Canvas';
import { ControlsPanel } from './ControlsPanel';
import { MobilePalette } from './MobilePalette';
import { MobileSummaryBar } from './MobileSummaryBar';
import { useI18n } from '@/lib/i18nContext';

interface Props { open: boolean; onClose: () => void; }

export function MobileBuilderOverlay({ open, onClose }: Props) {
  const { tr } = useI18n();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', height: '100dvh' }}
          className="bg-forest-50 dark:bg-forest-950"
        >
          {/* Top bar — fixed 48px */}
          <div style={{ flexShrink: 0, height: 48 }} className="flex items-center justify-between px-4 bg-white/90 dark:bg-forest-900/90 border-b border-forest-200/60 dark:border-forest-800/60">
            <span className="text-[13px] font-bold text-forest-900 dark:text-forest-50 tracking-tight">
              {tr.builder.mobileBadge}
            </span>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32 }}
              className="rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center text-forest-700 dark:text-forest-200"
            >
              <X size={16} />
            </button>
          </div>

          {/* Canvas — fills all remaining space */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            <Canvas />
            <ControlsPanel />
          </div>

          {/* Tree strip — fixed 62px */}
          <MobilePalette />

          {/* Summary bar — fixed 48px */}
          <MobileSummaryBar />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
