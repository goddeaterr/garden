'use client';

import { useMemo } from 'react';
import { Zap, TrendingUp, Leaf, Palette, Sun } from 'lucide-react';
import { useTrees } from '@/lib/useTrees';
import { useGarden } from './GardenContext';
import { useI18n } from '@/lib/i18nContext';
import { cn } from '@/lib/utils';

interface Tip {
  icon: React.ElementType;
  color: string;
  text: string;
  action?: string;
}

function useAITips(): Tip[] {
  const { placed } = useGarden();
  const trees = useTrees();
  const { tr } = useI18n();
  const ai = tr.ai;

  return useMemo(() => {
    const tips: Tip[] = [];
    if (placed.length === 0) {
      return [
        { icon: Leaf, color: 'text-emerald-500', text: ai.noPlants, action: ai.browsePlants },
      ];
    }

    const placedTrees = placed.map(p => trees.find(t => t.id === p.treeId)).filter(Boolean);
    const cats = [...new Set(placedTrees.map(t => t!.category))];

    if (placed.length < 3) {
      tips.push({ icon: TrendingUp, color: 'text-blue-500', text: ai.addMore.replace('{n}', String(3 - placed.length)) });
    }

    if (cats.length === 1) {
      tips.push({ icon: Palette, color: 'text-purple-500', text: ai.mixTypes });
    }

    if (!cats.includes('evergreen') && placed.length >= 2) {
      tips.push({ icon: Sun, color: 'text-amber-500', text: ai.addEvergreen });
    }

    if (placed.length >= 5) {
      tips.push({ icon: TrendingUp, color: 'text-emerald-500', text: ai.greatComp });
    }

    if (placed.length >= 3 && cats.length >= 2) {
      tips.push({ icon: Leaf, color: 'text-green-500', text: ai.goodBalance });
    }

    return tips.slice(0, 3);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed, trees, ai]);
}

export function AIRecommendations({ compact = false }: { compact?: boolean }) {
  const tips = useAITips();
  const { tr } = useI18n();

  if (tips.length === 0) return null;

  return (
    <div className={cn('rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden', compact ? 'p-2' : 'p-3')}>
      <div className="flex items-center gap-1.5 mb-2">
        <Zap size={11} className="text-amber-500" />
        <span className="text-[10px] uppercase tracking-widest font-semibold text-amber-700 dark:text-amber-400">{tr.ai.tipsLabel}</span>
      </div>
      <div className={cn('space-y-1.5')}>
        {tips.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <div key={i} className="flex items-start gap-2">
              <Icon size={12} className={cn('flex-shrink-0 mt-0.5', tip.color)} />
              <p className="text-[11px] text-forest-700 dark:text-forest-300 leading-snug">{tip.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
