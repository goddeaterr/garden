'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Zap, X, SlidersHorizontal, Sun, CloudSun, Cloud, Leaf, Sprout } from 'lucide-react';
import { useTrees } from '@/lib/useTrees';
import { useGarden } from './GardenContext';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { formatPrice, cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18nContext';
import type { Tree, TreeCategory } from '@/types';

/* ── Static option value/emoji (labels resolved from i18n inside component) ── */
const AI_PRESET_STATIC = [
  { id: 'hedge-fast', emoji: '🌿', query: 'hedge fast' },
  { id: 'low-maint',  emoji: '😌', query: 'low maintenance' },
  { id: 'shade',      emoji: '🌥️', query: 'shade' },
  { id: 'modern',     emoji: '🏙️', query: 'modern' },
  { id: 'natural',    emoji: '🌾', query: 'natural' },
  { id: 'homestead',  emoji: '🏡', query: 'fruit' },
  { id: 'italian',    emoji: '🇮🇹', query: 'evergreen' },
] as const;

type PresetId = typeof AI_PRESET_STATIC[number]['id'];

const CAT_STATIC: { value: TreeCategory | 'all'; emoji: string }[] = [
  { value: 'all',        emoji: '🌳' },
  { value: 'evergreen',  emoji: '🌲' },
  { value: 'shrub',      emoji: '🌿' },
  { value: 'decorative', emoji: '🌸' },
  { value: 'fruit',      emoji: '🍎' },
];

/* ── Filter types ── */
type HeightBucket = 'all' | 'under1' | '1to3' | 'over3';
type SunFilter = 'all' | 'sun' | 'partial' | 'shade';
type GrowthFilter = 'all' | 'fast' | 'medium' | 'slow';
type SizeFilter = 'all' | 'small' | 'medium' | 'large';
type SoilFilter = 'all' | 'sandy' | 'clay' | 'rich' | 'acidic' | 'dry' | 'moist';
type LocationFilter = 'all' | 'windy' | 'wall';

/* ── Helpers ── */
function parseHeightM(h: string): number {
  const cm = h.match(/(\d+)\s*cm/i);
  if (cm) return Number(cm[1]) / 100;
  const m = h.match(/(\d+(?:\.\d+)?)\s*m/i);
  if (m) return Number(m[1]);
  return -1;
}

function matchesHeightBucket(h: string, bucket: HeightBucket): boolean {
  if (bucket === 'all') return true;
  const m = parseHeightM(h);
  if (m < 0) return true;
  if (bucket === 'under1') return m < 1;
  if (bucket === '1to3')   return m >= 1 && m <= 3;
  if (bucket === 'over3')  return m > 3;
  return true;
}

function inferSunlight(tree: Tree): 'sun' | 'partial' | 'shade' {
  const sun = (tree.care?.sunlight || '').toLowerCase();
  if (sun.includes('shade') || sun.includes('pavės') || sun.includes('shadow') || sun.includes('umbra')) return 'shade';
  if (sun.includes('partial') || sun.includes('dalies') || sun.includes('semi')) return 'partial';
  if (sun.includes('full') || sun.includes('saulė') || sun.includes('sun')) return 'sun';
  // Category heuristics when care data is absent
  if (tree.category === 'fruit') return 'sun';
  if (tree.category === 'evergreen') return 'sun';
  if (tree.category === 'shrub') return 'partial';
  return 'partial';
}

function inferGrowthRate(tree: Tree): 'fast' | 'medium' | 'slow' {
  const gr = (tree.care?.growthRate || '').toLowerCase();
  if (gr.includes('fast') || gr.includes('greit') || gr.includes('rapid') || gr.includes('vigour')) return 'fast';
  if (gr.includes('slow') || gr.includes('lėt') || gr.includes('dwarf')) return 'slow';
  if (gr.includes('medium') || gr.includes('vidutin') || gr.includes('moderate')) return 'medium';
  // Heuristics from category
  if (tree.category === 'shrub') return 'fast';
  if (tree.category === 'evergreen') return 'slow';
  if (tree.category === 'fruit') return 'medium';
  return 'medium';
}

function inferSize(tree: Tree): 'small' | 'medium' | 'large' {
  if (tree.size === 'small') return 'small';
  if (tree.size === 'large') return 'large';
  // Derive from height if size is 'medium' (the default)
  const m = parseHeightM(tree.height);
  if (m > 0) {
    if (m < 1.2) return 'small';
    if (m > 4) return 'large';
    return 'medium';
  }
  if (tree.category === 'shrub') return 'small';
  if (tree.category === 'evergreen') return 'large';
  return 'medium';
}

function inferSoil(tree: Tree): SoilFilter {
  const s = (tree.care?.soil || '').toLowerCase();
  if (s.includes('sand') || s.includes('smėl') || s.includes('sandy')) return 'sandy';
  if (s.includes('clay') || s.includes('mol') || s.includes('heavy')) return 'clay';
  if (s.includes('acid') || s.includes('rūgšt') || s.includes('ericac') || s.includes('peat')) return 'acidic';
  if (s.includes('moist') || s.includes('wet') || s.includes('drėg') || s.includes('boggy')) return 'moist';
  if (s.includes('dry') || s.includes('saus') || s.includes('drought') || s.includes('xer')) return 'dry';
  if (s.includes('rich') || s.includes('fertile') || s.includes('derling') || s.includes('loam') || s.includes('humus')) return 'rich';
  return 'all';
}

function inferLocation(tree: Tree): Set<LocationFilter> {
  const result = new Set<LocationFilter>(['all']);
  const care = Object.values(tree.care || {}).join(' ').toLowerCase();
  // Wind-tolerant: shrubs and evergreens with windbreak mentions, or coastal notes
  if (
    tree.category === 'shrub' ||
    tree.category === 'evergreen' ||
    care.includes('wind') || care.includes('vėj') || care.includes('coastal') || care.includes('exposed')
  ) result.add('windy');
  // Wall/fence: shade plants, climbing mentions, or partial shade
  if (
    inferSunlight(tree) === 'shade' || inferSunlight(tree) === 'partial' ||
    care.includes('wall') || care.includes('fence') || care.includes('siena') || care.includes('tvor') ||
    care.includes('climb') || care.includes('trellis')
  ) result.add('wall');
  return result;
}

function matchesPreset(tree: Tree, query: string): boolean {
  if (query === 'fruit') return tree.category === 'fruit';
  if (query === 'evergreen') return tree.category === 'evergreen';
  if (query === 'shade') return inferSunlight(tree) === 'shade' || inferSunlight(tree) === 'partial';
  if (query === 'hedge fast') return tree.category === 'shrub';
  if (query === 'low maintenance') {
    const care = Object.values(tree.care || {}).join(' ').toLowerCase();
    return care.includes('low') || care.includes('minimal') || care.includes('easy') || tree.category === 'evergreen';
  }
  return tree.name.toLowerCase().includes(query) || tree.category.toLowerCase().includes(query);
}

export function BuilderLeftPanel() {
  const trees = useTrees();
  const { addTree } = useGarden();
  const { tr } = useI18n();
  const lp = tr.leftPanel;

  /* ── i18n-resolved option arrays ── */
  const AI_PRESETS = [
    { ...AI_PRESET_STATIC[0], label: lp.presetHedge },
    { ...AI_PRESET_STATIC[1], label: lp.presetLowMaint },
    { ...AI_PRESET_STATIC[2], label: lp.presetShade },
    { ...AI_PRESET_STATIC[3], label: lp.presetModern },
    { ...AI_PRESET_STATIC[4], label: lp.presetNatural },
    { ...AI_PRESET_STATIC[5], label: lp.presetHomestead },
    { ...AI_PRESET_STATIC[6], label: lp.presetItalian },
  ];

  const CATEGORIES = [
    { ...CAT_STATIC[0], label: lp.catAll },
    { ...CAT_STATIC[1], label: lp.catEvergreen },
    { ...CAT_STATIC[2], label: lp.catShrub },
    { ...CAT_STATIC[3], label: lp.catDecor },
    { ...CAT_STATIC[4], label: lp.catFruit },
  ];

  const HEIGHT_OPTS: { value: HeightBucket; label: string }[] = [
    { value: 'all',    label: lp.heightAll },
    { value: 'under1', label: lp.heightUnder1 },
    { value: '1to3',   label: lp.height1to3 },
    { value: 'over3',  label: lp.heightOver3 },
  ];

  const SUN_OPTS: { value: SunFilter; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'all',     label: lp.sunAll,     icon: CloudSun, color: 'text-forest-500' },
    { value: 'sun',     label: lp.sunFull,    icon: Sun,      color: 'text-amber-500' },
    { value: 'partial', label: lp.sunPartial, icon: CloudSun, color: 'text-sky-500' },
    { value: 'shade',   label: lp.sunShade,   icon: Cloud,    color: 'text-slate-500' },
  ];

  const GROWTH_OPTS: { value: GrowthFilter; label: string; emoji: string }[] = [
    { value: 'all',    label: lp.growthAll,    emoji: '—'  },
    { value: 'fast',   label: lp.growthFast,   emoji: '🚀' },
    { value: 'medium', label: lp.growthMedium, emoji: '🌱' },
    { value: 'slow',   label: lp.growthSlow,   emoji: '🐢' },
  ];

  const SIZE_OPTS: { value: SizeFilter; label: string; emoji: string }[] = [
    { value: 'all',    label: lp.sizeAll,    emoji: '—'  },
    { value: 'small',  label: lp.sizeSmall,  emoji: '🌱' },
    { value: 'medium', label: lp.sizeMedium, emoji: '🌿' },
    { value: 'large',  label: lp.sizeLarge,  emoji: '🌳' },
  ];

  const SOIL_OPTS: { value: SoilFilter; label: string; emoji: string }[] = [
    { value: 'all',    label: lp.soilAll,   emoji: '—'  },
    { value: 'sandy',  label: lp.soilSandy, emoji: '🏖️' },
    { value: 'clay',   label: lp.soilClay,  emoji: '🏺' },
    { value: 'rich',   label: lp.soilRich,  emoji: '🌾' },
    { value: 'acidic', label: lp.soilAcidic,emoji: '🍋' },
    { value: 'dry',    label: lp.soilDry,   emoji: '🌵' },
    { value: 'moist',  label: lp.soilMoist, emoji: '💧' },
  ];

  const LOCATION_OPTS: { value: LocationFilter; label: string; emoji: string }[] = [
    { value: 'all',   label: lp.locationAll,   emoji: '—'  },
    { value: 'windy', label: lp.locationWindy, emoji: '💨' },
    { value: 'wall',  label: lp.locationWall,  emoji: '🧱' },
  ];

  const [query, setQuery]               = useState('');
  const [cat, setCat]                   = useState<TreeCategory | 'all'>('all');
  const [height, setHeight]             = useState<HeightBucket>('all');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxPrice, setMaxPrice]         = useState(500);
  const [sun, setSun]                   = useState<SunFilter>('all');
  const [growth, setGrowth]             = useState<GrowthFilter>('all');
  const [size, setSize]                 = useState<SizeFilter>('all');
  const [soil, setSoil]                 = useState<SoilFilter>('all');
  const [location, setLocation]         = useState<LocationFilter>('all');

  const filtered = useMemo(() => {
    return trees.filter(t => {
      if (cat !== 'all' && t.category !== cat) return false;
      if (t.price > maxPrice) return false;
      if (!matchesHeightBucket(t.height, height)) return false;
      if (sun !== 'all'    && inferSunlight(t)   !== sun)    return false;
      if (growth !== 'all' && inferGrowthRate(t) !== growth) return false;
      if (size !== 'all'   && inferSize(t)       !== size)   return false;
      if (soil !== 'all') {
        const ts = inferSoil(t);
        if (ts !== 'all' && ts !== soil) return false;
      }
      if (location !== 'all' && !inferLocation(t).has(location)) return false;
      if (activePreset) {
        const preset = AI_PRESETS.find(p => p.id === activePreset);
        if (preset && !matchesPreset(t, preset.query)) return false;
      }
      if (query) {
        const q = query.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.latin.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [trees, cat, height, activePreset, query, maxPrice, sun, growth, size, soil, location]);

  const handleDragStart = (treeId: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/tree-id', treeId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const clearAll = () => {
    setQuery(''); setCat('all'); setHeight('all'); setActivePreset(null);
    setMaxPrice(500); setSun('all'); setGrowth('all'); setSize('all');
    setSoil('all'); setLocation('all');
  };

  const hasFilters = query || cat !== 'all' || height !== 'all' || activePreset
    || maxPrice < 500 || sun !== 'all' || growth !== 'all' || size !== 'all'
    || soil !== 'all' || location !== 'all';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-forest-950 border-r border-forest-200/60 dark:border-forest-800 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-forest-100 dark:border-forest-800/80 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-forest-500 dark:text-forest-400 font-medium">{lp.catalog}</div>
            <div className="text-[13px] font-bold text-forest-950 dark:text-forest-50 leading-tight">
              {filtered.length} <span className="font-normal text-forest-500">{lp.filtered} {trees.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {hasFilters && (
              <button onClick={clearAll} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <X size={10} /> {lp.clearBtn}
              </button>
            )}
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors',
                showAdvanced ? 'bg-forest-900 dark:bg-forest-50 text-white dark:text-forest-900' : 'bg-forest-100 dark:bg-forest-800 text-forest-600 dark:text-forest-300'
              )}
            >
              <SlidersHorizontal size={11} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={lp.search}
            className="w-full pl-8 pr-3 py-2 text-[12px] bg-forest-50 dark:bg-forest-900 rounded-xl border border-forest-200/60 dark:border-forest-800 outline-none focus:ring-2 focus:ring-forest-400 dark:focus:ring-forest-500 placeholder:text-forest-400 text-forest-900 dark:text-forest-100"
          />
        </div>
      </div>

      {/* ── AI presets ── */}
      <div className="px-3 py-2.5 border-b border-forest-100 dark:border-forest-800/60 flex-shrink-0">
        <div className="text-[9px] uppercase tracking-widest text-forest-400 mb-1.5 flex items-center gap-1">
          <Zap size={9} className="text-amber-400" /> {lp.aiQuickLabel}
        </div>
        <div className="flex flex-wrap gap-1">
          {AI_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePreset(activePreset === p.id ? null : p.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all border',
                activePreset === p.id
                  ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
                  : 'bg-forest-50 dark:bg-forest-900 border-forest-200/60 dark:border-forest-800 text-forest-700 dark:text-forest-300 hover:border-forest-300 dark:hover:border-forest-600'
              )}
            >
              <span>{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Category pills ── */}
      <div className="px-3 py-2 border-b border-forest-100 dark:border-forest-800/60 flex-shrink-0">
        <div className="flex flex-col gap-0.5">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCat(c.value)}
              className={cn(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left',
                cat === c.value
                  ? 'bg-forest-900 dark:bg-forest-100 text-white dark:text-forest-900'
                  : 'text-forest-700 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-900'
              )}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Advanced filters (collapsible) ── */}
      {showAdvanced && (
        <div className="px-3 py-2.5 border-b border-forest-100 dark:border-forest-800/60 flex-shrink-0 space-y-3 overflow-y-auto" style={{ maxHeight: 340 }}>

          {/* Height */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-forest-400 mb-1.5">{lp.heightLabel}</div>
            <div className="grid grid-cols-2 gap-1">
              {HEIGHT_OPTS.map(h => (
                <button
                  key={h.value}
                  onClick={() => setHeight(h.value)}
                  className={cn(
                    'px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border text-center',
                    height === h.value
                      ? 'bg-forest-900 dark:bg-forest-100 text-white dark:text-forest-900 border-transparent'
                      : 'border-forest-200/60 dark:border-forest-800 text-forest-600 dark:text-forest-400 hover:border-forest-300'
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sunlight */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-forest-400 mb-1.5">{lp.sunLabel}</div>
            <div className="grid grid-cols-2 gap-1">
              {SUN_OPTS.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.value}
                    onClick={() => setSun(s.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border',
                      sun === s.value
                        ? 'bg-forest-900 dark:bg-forest-100 text-white dark:text-forest-900 border-transparent'
                        : 'border-forest-200/60 dark:border-forest-800 text-forest-600 dark:text-forest-400 hover:border-forest-300'
                    )}
                  >
                    <Icon size={10} className={sun === s.value ? '' : s.color} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Growth rate */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-forest-400 mb-1.5">{lp.growthLabel}</div>
            <div className="grid grid-cols-2 gap-1">
              {GROWTH_OPTS.map(g => (
                <button
                  key={g.value}
                  onClick={() => setGrowth(g.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border',
                    growth === g.value
                      ? 'bg-forest-900 dark:bg-forest-100 text-white dark:text-forest-900 border-transparent'
                      : 'border-forest-200/60 dark:border-forest-800 text-forest-600 dark:text-forest-400 hover:border-forest-300'
                  )}
                >
                  <span className="text-[9px]">{g.emoji}</span>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-forest-400 mb-1.5">{lp.sizeLabel}</div>
            <div className="grid grid-cols-2 gap-1">
              {SIZE_OPTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSize(s.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border',
                    size === s.value
                      ? 'bg-forest-900 dark:bg-forest-100 text-white dark:text-forest-900 border-transparent'
                      : 'border-forest-200/60 dark:border-forest-800 text-forest-600 dark:text-forest-400 hover:border-forest-300'
                  )}
                >
                  <span className="text-[9px]">{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Soil type */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-forest-400 mb-1.5">{lp.soilLabel}</div>
            <div className="grid grid-cols-2 gap-1">
              {SOIL_OPTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSoil(s.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border',
                    soil === s.value
                      ? 'bg-forest-900 dark:bg-forest-100 text-white dark:text-forest-900 border-transparent'
                      : 'border-forest-200/60 dark:border-forest-800 text-forest-600 dark:text-forest-400 hover:border-forest-300'
                  )}
                >
                  <span className="text-[9px]">{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location / wind */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-forest-400 mb-1.5">{lp.locationLabel}</div>
            <div className="grid grid-cols-1 gap-1">
              {LOCATION_OPTS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLocation(l.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border text-left',
                    location === l.value
                      ? 'bg-forest-900 dark:bg-forest-100 text-white dark:text-forest-900 border-transparent'
                      : 'border-forest-200/60 dark:border-forest-800 text-forest-600 dark:text-forest-400 hover:border-forest-300'
                  )}
                >
                  <span className="text-[9px]">{l.emoji}</span>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[9px] uppercase tracking-widest text-forest-400">{lp.maxPriceLabel}</div>
              <div className="text-[11px] font-bold text-forest-900 dark:text-forest-100">€{maxPrice}</div>
            </div>
            <input
              type="range" min={5} max={500} step={5} value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="apple-slider w-full"
            />
          </div>

        </div>
      )}

      {/* ── Plant grid ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">🌱</div>
            <div className="text-[12px] text-forest-500">{lp.noResults}</div>
            <button onClick={clearAll} className="mt-2 text-[11px] text-forest-400 underline">{lp.clearFiltersBtn}</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {filtered.map(tree => (
              <div
                key={tree.id}
                draggable
                onDragStart={handleDragStart(tree.id)}
                onClick={() => addTree(tree.id, 0.5, 0.7)}
                className="group relative cursor-grab active:cursor-grabbing rounded-xl bg-forest-50 dark:bg-forest-900 hover:bg-white dark:hover:bg-forest-800 border border-forest-200/40 dark:border-forest-800/60 hover:border-forest-300 dark:hover:border-forest-600 p-2 transition-all hover:shadow-md"
              >
                <div className="aspect-square flex items-end justify-center pb-1">
                  <TreeIllustration
                    svg={tree.svg}
                    imagePath={tree.builderImagePath || tree.imagePath}
                    alt={tree.name}
                    className="w-full max-w-[72px] aspect-square group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="text-center mt-0.5">
                  <div className="text-[10px] font-semibold text-forest-950 dark:text-forest-50 leading-tight line-clamp-2">{tree.name}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tabular-nums mt-0.5">{formatPrice(tree.price)}</div>
                </div>
                {/* Sunlight/growth badge row */}
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  {(() => {
                    const s = inferSunlight(tree);
                    const g = inferGrowthRate(tree);
                    return (
                      <>
                        <span className={cn('text-[8px]', s === 'sun' ? 'text-amber-400' : s === 'shade' ? 'text-slate-400' : 'text-sky-400')}>
                          {s === 'sun' ? '☀️' : s === 'shade' ? '🌥️' : '⛅'}
                        </span>
                        <span className="text-[8px] text-forest-400">
                          {g === 'fast' ? '🚀' : g === 'slow' ? '🐢' : '🌱'}
                        </span>
                      </>
                    );
                  })()}
                </div>
                {/* Add indicator */}
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-forest-900 dark:bg-forest-100 text-white dark:text-forest-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[11px] font-bold leading-none">+</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer hint ── */}
      <div className="px-3 py-2 border-t border-forest-100 dark:border-forest-800 flex-shrink-0">
        <p className="text-[9px] text-forest-400 dark:text-forest-500 text-center">
          {lp.dragHint}
        </p>
      </div>
    </div>
  );
}
