'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, Sun, Layers, Scissors, Thermometer, Maximize2, TrendingUp, Info, MessageSquare } from 'lucide-react';
import type { Tree } from '@/types';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { formatPrice } from '@/lib/utils';
import { useI18n } from '@/lib/i18nContext';

interface Props {
  tree: Tree | null;
  onClose: () => void;
  onQuote?: () => void;
}

const careIcons: Record<string, React.ReactNode> = {
  watering: <Droplets size={15} />,
  sunlight: <Sun size={15} />,
  soil: <Layers size={15} />,
  pruning: <Scissors size={15} />,
  hardiness: <Thermometer size={15} />,
  spacing: <Maximize2 size={15} />,
  growthRate: <TrendingUp size={15} />,
  notes: <Info size={15} />,
};

const careLabels: Record<string, { en: string; lt: string; ru: string }> = {
  watering:   { en: 'Watering',    lt: 'Laistymas',     ru: 'Полив' },
  sunlight:   { en: 'Sunlight',    lt: 'Šviesa',        ru: 'Освещение' },
  soil:       { en: 'Soil',        lt: 'Dirva',         ru: 'Почва' },
  pruning:    { en: 'Pruning',     lt: 'Genėjimas',     ru: 'Обрезка' },
  hardiness:  { en: 'Hardiness',   lt: 'Atsparumas',    ru: 'Морозостойкость' },
  spacing:    { en: 'Spacing',     lt: 'Atstumas',      ru: 'Расстояние' },
  growthRate: { en: 'Growth rate', lt: 'Augimo greitis', ru: 'Скорость роста' },
  notes:      { en: 'Notes',       lt: 'Pastabos',      ru: 'Примечания' },
};

const categoryColors: Record<string, string> = {
  trees:    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
  shrubs:   'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
  perennial:'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200',
  annual:   'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  conifer:  'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200',
  climbing: 'bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-200',
  hedge:    'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  potted:   'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
  grass:    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
};

const categoryLabels: Record<string, { en: string; lt: string; ru: string }> = {
  trees:    { en: 'Trees',              lt: 'Medžiai',                    ru: 'Деревья' },
  shrubs:   { en: 'Shrubs',             lt: 'Krūmai',                     ru: 'Кустарники' },
  perennial:{ en: 'Perennials',         lt: 'Daugiamečiai augalai',        ru: 'Многолетние растения' },
  annual:   { en: 'Annuals',            lt: 'Vienmečiai augalai',          ru: 'Однолетние растения' },
  conifer:  { en: 'Conifers',           lt: 'Spygliuočiai',                ru: 'Хвойные' },
  climbing: { en: 'Climbing plants',    lt: 'Vijokliniai augalai',         ru: 'Вьющиеся растения' },
  hedge:    { en: 'Hedge plants',       lt: 'Gyvatvorių augalai',          ru: 'Растения для живой изгороди' },
  potted:   { en: 'Potted / Terrace',   lt: 'Vazoniniai / terasiniai',     ru: 'Вазонные / террасные' },
  grass:    { en: 'Grasses',            lt: 'Žolės / dekoratyvinės žolės', ru: 'Злаки / декоративные травы' },
};

const sizeLabels: Record<string, { en: string; lt: string; ru: string }> = {
  small:  { en: 'Small',  lt: 'Mažas',      ru: 'Маленькое' },
  medium: { en: 'Medium', lt: 'Vidutinis',  ru: 'Среднее' },
  large:  { en: 'Large',  lt: 'Didelis',    ru: 'Большое' },
};

export function TreeDetailModal({ tree, onClose, onQuote }: Props) {
  const { locale } = useI18n();

  const careKeys = ['watering', 'sunlight', 'soil', 'pruning', 'hardiness', 'spacing', 'growthRate', 'notes'] as const;

  const handleQuote = () => {
    onClose();
    onQuote?.();
  };

  return (
    <AnimatePresence>
      {tree && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: 'rgba(12, 22, 14, 0.7)', backdropFilter: 'blur(10px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-2xl max-h-[92svh] bg-forest-50 dark:bg-forest-950 rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Drag handle for mobile */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-forest-300 dark:bg-forest-700" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center hover:bg-forest-200 dark:hover:bg-forest-700 transition-colors"
            >
              <X size={16} className="text-forest-700 dark:text-forest-200" />
            </button>

            <div className="overflow-y-auto no-scrollbar flex-1">
              {/* Header with illustration */}
              <div className="relative px-6 pt-4 pb-6" style={{ background: `linear-gradient(135deg, ${tree.color}18, ${tree.color}08)` }}>
                <div className="flex gap-5 items-start">
                  <div className="w-28 h-28 flex-shrink-0 flex items-end justify-center">
                    <TreeIllustration svg={tree.svg} imagePath={tree.imagePath} alt={tree.name} className="w-full h-full" />
                  </div>
                  <div className="flex-1 pt-1 pr-8">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-2 ${categoryColors[tree.category]}`}>
                      {(categoryLabels[tree.category]?.[locale] ?? categoryLabels[tree.category]?.en) || tree.category}
                    </span>
                    <h2 className="text-2xl font-bold text-forest-950 dark:text-forest-50 tracking-tight leading-tight">{tree.name}</h2>
                    <p className="text-[13px] text-forest-500 dark:text-forest-400 italic mt-0.5">{tree.latin}</p>
                    <p className="text-forest-700 dark:text-forest-300 text-[14px] mt-2 leading-relaxed">{tree.description}</p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: locale === 'lt' ? 'Aukštis' : locale === 'ru' ? 'Высота' : 'Height', value: tree.height },
                    { label: locale === 'lt' ? 'Dydis' : locale === 'ru' ? 'Размер' : 'Size', value: sizeLabels[tree.size]?.[locale] ?? tree.size },
                    { label: locale === 'lt' ? 'Kaina' : locale === 'ru' ? 'Цена' : 'Price', value: formatPrice(tree.price) },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/60 dark:bg-forest-900/60 rounded-xl px-3 py-2.5 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-forest-500 dark:text-forest-400 mb-0.5">{stat.label}</div>
                      <div className="text-[14px] font-semibold text-forest-950 dark:text-forest-50">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Care guide */}
              <div className="px-6 py-5 border-t border-forest-200/50 dark:border-forest-800/50">
                <h3 className="text-[11px] uppercase tracking-[0.25em] text-forest-500 dark:text-forest-400 mb-4">
                  {locale === 'lt' ? 'Priežiūros gidas' : locale === 'ru' ? 'Руководство по уходу' : 'Care Guide'}
                </h3>
                <div className="space-y-3">
                  {careKeys.map(key => (
                    <div key={key} className="flex gap-3 items-start">
                      <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-forest-100 dark:bg-forest-800 flex items-center justify-center text-forest-600 dark:text-forest-300 mt-0.5">
                        {careIcons[key]}
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400 mb-0.5">
                          {careLabels[key][locale] || careLabels[key].en}
                        </div>
                        <div className="text-[13.5px] text-forest-800 dark:text-forest-200 leading-snug">
                          {tree.care[key]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-forest-200/50 dark:border-forest-800/50 flex gap-3">
              <button
                onClick={handleQuote}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-forest-900 dark:bg-forest-50 text-forest-50 dark:text-forest-900 text-[14px] font-semibold hover:scale-[1.01] active:scale-[0.99] transition-transform"
              >
                <MessageSquare size={16} />
                {locale === 'lt' ? 'Prašyti pasiūlymo' : locale === 'ru' ? 'Запросить цену' : 'Request Quote'}
              </button>
              <div className="flex items-center px-4 rounded-2xl bg-forest-100 dark:bg-forest-800">
                <span className="text-[18px] font-bold tabular-nums text-forest-950 dark:text-forest-50">{formatPrice(tree.price)}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
