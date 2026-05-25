'use client';

import { useState } from 'react';
import { ShoppingBag, FileText, X, Trash2, Loader2, Shield, RotateCcw, CheckCircle2, ChevronDown, ChevronUp, Share2, ShoppingCart, BookmarkCheck, Sparkles } from 'lucide-react';
import { useGarden } from './GardenContext';
import { useTrees } from '@/lib/useTrees';
import { formatPrice, cn } from '@/lib/utils';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { exportGardenPDF, generateGardenImageBase64 } from '@/lib/exportPdf';
import { AIRecommendations } from './AIRecommendations';
import { AIVisualizationModal } from './AIVisualizationModal';
import { useI18n } from '@/lib/i18nContext';


export function BuilderRightPanel() {
  const trees = useTrees();
  const { placed, total, removeTree, clearAll, selectedUid, setSelectedUid, canvasRef, setPlanSnapshot, setShowCheckout, saveProject, backgroundImage } = useGarden();
  const { tr } = useI18n();
  const r = tr.rightPanel;
  const s = tr.summary;
  const [listOpen, setListOpen] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [visualizing, setVisualizing] = useState(false);
  const [visualStep, setVisualStep] = useState('');
  const [visualResult, setVisualResult] = useState<string | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);

  const items = placed
    .map(p => ({ placed: p, tree: trees.find(t => t.id === p.treeId) }))
    .filter((i): i is { placed: typeof placed[number]; tree: typeof trees[number] } => !!i.tree);

  const handleQuote = async () => {
    setQuoting(true);
    try {
      const snap = canvasRef.current ? await generateGardenImageBase64(canvasRef.current) : null;
      setPlanSnapshot(snap);
      setShowCheckout(true);
    } finally { setQuoting(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportGardenPDF(items.map(i => i.tree), total, canvasRef.current); }
    finally { setExporting(false); }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSave = () => {
    saveProject();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleVisualize = async () => {
    if (!canvasRef.current) return;
    setVisualizing(true);
    setVisualError(null);
    setVisualStep('Generating realistic view…');
    try {
      // html2canvas skips every element with data-builder-ui — including the plant
      // divs themselves. Temporarily remove that attribute and force full opacity
      // so the screenshot contains solid visible plants, then restore everything.
      const treeEls = canvasRef.current.querySelectorAll<HTMLElement>('[data-placed-tree]');
      const savedOpacities = Array.from(treeEls).map(el => el.style.opacity);
      treeEls.forEach(el => {
        el.removeAttribute('data-builder-ui');
        el.style.opacity = '1';
      });

      const canvasImage = await generateGardenImageBase64(canvasRef.current);

      // Restore immediately after screenshot
      treeEls.forEach((el, i) => {
        el.setAttribute('data-builder-ui', '');
        el.style.opacity = savedOpacities[i];
      });

      const res = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasImage }),
      });
      const data = await res.json() as { result?: string; error?: string };
      if (!res.ok || !data.result) { setVisualError(data.error ?? 'Visualization failed'); return; }
      setVisualResult(data.result);
    } catch {
      setVisualError('Network error. Please try again.');
    } finally {
      setVisualizing(false);
      setVisualStep('');
    }
  };

  const uniqueCount = new Set(placed.map(p => p.treeId)).size;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-forest-950 border-l border-forest-200/60 dark:border-forest-800 overflow-hidden">

      {/* ── Project summary ── */}
      <div className="px-4 pt-4 pb-3 border-b border-forest-100 dark:border-forest-800 flex-shrink-0">
        <div className="text-[10px] uppercase tracking-widest text-forest-500 dark:text-forest-400 mb-1">{r.projectTitle}</div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[28px] font-black text-forest-950 dark:text-forest-50 tabular-nums leading-none">
              {formatPrice(total)}
            </div>
            <div className="text-[11px] text-forest-500 mt-0.5">
              {placed.length} {placed.length === 1 ? s.tree : s.trees} · {uniqueCount} {r.speciesLabel}
            </div>
          </div>
          {placed.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 size={10} /> {r.clearAll}
            </button>
          )}
        </div>
      </div>

      {/* ── Primary CTAs ── */}
      <div className="px-3 py-3 border-b border-forest-100 dark:border-forest-800 flex-shrink-0 space-y-2">

        {/* 1 — Gauti pasiūlymą */}
        <button
          onClick={handleQuote}
          disabled={quoting || placed.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-[13px] font-bold shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {quoting ? <Loader2 size={15} className="animate-spin" /> : <ShoppingBag size={15} />}
          {quoting ? r.quoting : r.getQuote}
        </button>

        {/* 2 — Visualize with AI */}
        <button
          onClick={handleVisualize}
          disabled={visualizing || placed.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] text-white text-[13px] font-bold shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {visualizing
            ? <><Loader2 size={15} className="animate-spin" /><span className="truncate">{visualStep || 'Working…'}</span></>
            : <><Sparkles size={15} /> Visualize with AI</>
          }
        </button>
        {visualError && (
          <p className="text-[11px] text-red-400 text-center -mt-1 px-1">{visualError}</p>
        )}

        {/* 3 — Pirkti augalus */}
        <a
          href="#catalog"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-forest-900 dark:bg-forest-100 hover:bg-forest-800 dark:hover:bg-white active:scale-[0.98] text-white dark:text-forest-900 text-[13px] font-bold transition-all"
        >
          <ShoppingCart size={14} />
          {r.buyPlants}
        </a>

        {/* 3 — Išsaugoti projektą + PDF + Dalintis */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={handleSave}
            disabled={placed.length === 0}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl border text-[10px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed',
              saved
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'border-forest-200 dark:border-forest-700 text-forest-700 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-900'
            )}
          >
            <BookmarkCheck size={13} className={saved ? 'text-emerald-500' : ''} />
            {saved ? r.saved : r.save}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || placed.length === 0}
            className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl border border-forest-200 dark:border-forest-700 text-forest-700 dark:text-forest-300 text-[10px] font-semibold hover:bg-forest-50 dark:hover:bg-forest-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
            {exporting ? r.exporting : r.export}
          </button>
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl border border-forest-200 dark:border-forest-700 text-forest-700 dark:text-forest-300 text-[10px] font-semibold hover:bg-forest-50 dark:hover:bg-forest-900 transition-colors"
          >
            <Share2 size={13} />
            {copied ? r.copied : r.share}
          </button>
        </div>
      </div>

      {/* ── AI recommendations ── */}
      <div className="px-3 py-2.5 border-b border-forest-100 dark:border-forest-800 flex-shrink-0">
        <AIRecommendations />
      </div>

      {/* ── Plant list ── */}
      <div className="flex-shrink-0">
        <button
          onClick={() => setListOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-forest-50 dark:hover:bg-forest-900 transition-colors"
        >
          <span className="text-[11px] font-semibold text-forest-700 dark:text-forest-300 uppercase tracking-wider">
            {r.plantList} ({placed.length})
          </span>
          {listOpen ? <ChevronUp size={13} className="text-forest-400" /> : <ChevronDown size={13} className="text-forest-400" />}
        </button>
      </div>

      {listOpen && (
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
          {items.length === 0 ? (
            <div className="py-8 text-center px-4">
              <div className="text-3xl mb-2">🌱</div>
              <div className="text-[12px] text-forest-500 dark:text-forest-400">
                {r.emptyList}<br />{r.emptyListSub}
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-forest-100 dark:divide-forest-800/50">
              {items.map(({ placed: p, tree }) => (
                <li
                  key={p.uid}
                  onClick={() => setSelectedUid(selectedUid === p.uid ? null : p.uid)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                    selectedUid === p.uid ? 'bg-forest-100/60 dark:bg-forest-800/60' : 'hover:bg-forest-50/60 dark:hover:bg-forest-900/40'
                  )}
                >
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden border border-forest-200/40 dark:border-forest-800" style={{ background: `${tree.color}18` }}>
                    <TreeIllustration svg={tree.svg} imagePath={tree.imagePath} alt={tree.name} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-forest-950 dark:text-forest-50 truncate leading-tight">{tree.name}</div>
                    <div className="text-[10px] text-forest-500 dark:text-forest-400 tabular-nums">{formatPrice(tree.price)}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); removeTree(p.uid); }}
                    className="w-6 h-6 rounded-lg text-forest-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X size={11} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── AI Visualization result modal ── */}
      <AIVisualizationModal
        imageUrl={visualResult}
        onClose={() => setVisualResult(null)}
        onRetry={() => { setVisualResult(null); handleVisualize(); }}
      />

      {/* ── Trust badges ── */}
      <div className="px-3 py-3 border-t border-forest-100 dark:border-forest-800 flex-shrink-0">
        <div className="space-y-1.5">
          {([
            { Icon: Shield,       text: r.trustGuarantee },
            { Icon: CheckCircle2, text: r.trustVerified },
            { Icon: RotateCcw,    text: r.trustReturn },
          ] as const).map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon size={11} className="text-emerald-500 flex-shrink-0" />
              <span className="text-[10px] text-forest-600 dark:text-forest-400">{text}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-forest-100 dark:border-forest-800">
          <p className="text-[9px] text-forest-400 dark:text-forest-500 leading-relaxed">
            {r.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
