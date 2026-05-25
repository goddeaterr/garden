'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, RotateCcw, Sparkles } from 'lucide-react';

interface Props {
  imageUrl: string | null;
  onClose: () => void;
  onRetry: () => void;
}

export function AIVisualizationModal({ imageUrl, onClose, onRetry }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'garden-visualization.png';
    a.click();
  };

  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === overlayRef.current) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl shadow-black/40 bg-forest-950"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-forest-800 bg-forest-950/90 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Sparkles size={13} className="text-emerald-400" />
                </div>
                <span className="text-[13px] font-semibold text-forest-100">AI Visualization</span>
                <span className="text-[11px] text-forest-500 ml-1">photorealistic render</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-forest-300 hover:text-forest-100 hover:bg-forest-800 transition-colors"
                >
                  <RotateCcw size={12} />
                  Re-generate
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  <Download size={12} />
                  Download
                </button>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-forest-400 hover:text-forest-100 hover:bg-forest-800 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="relative w-full bg-forest-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="AI photorealistic garden visualization"
                className="w-full h-auto max-h-[75vh] object-contain"
                draggable={false}
              />
              {/* Subtle badge */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                <Sparkles size={10} className="text-emerald-400" />
                <span className="text-[10px] text-white/80 font-medium">AI generated</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
