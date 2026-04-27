'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useTrees } from '@/lib/useTrees';
import { TreeIllustration } from '@/components/ui/TreeIllustration';
import { useI18n } from '@/lib/i18nContext';
import { Sprout, Compass } from 'lucide-react';

export function About() {
  const ref = useRef<HTMLElement>(null);
  const allTrees = useTrees();
  const featuredTrees = allTrees.slice(0, 3);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { tr } = useI18n();
  const a = tr.about;

  return (
    <section ref={ref} id="about" className="relative py-32 px-6 bg-forest-50 dark:bg-forest-950 overflow-hidden">
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-moss-100/40 to-transparent dark:from-forest-800/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-sand-100/30 to-transparent dark:from-forest-800/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[11px] tracking-[0.3em] uppercase text-forest-600 dark:text-forest-400 mb-6"
        >
          {a.eyebrow}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-headline text-[clamp(2.25rem,5vw,4.5rem)] text-forest-950 dark:text-forest-50 max-w-4xl mb-20"
        >
          {a.headline1}{' '}
          <span className="text-forest-600 dark:text-forest-400">{a.headline2}</span>
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {[
            { icon: Sprout, title: a.card1Title, body: a.card1Body },
            { icon: Compass, title: a.card2Title, body: a.card2Body },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative p-8 rounded-3xl bg-white/60 dark:bg-forest-900/40 backdrop-blur-xl border border-forest-200/50 dark:border-forest-800/50 hover:border-forest-300 dark:hover:border-forest-700 transition-colors"
            >
              <div className="w-11 h-11 rounded-2xl bg-forest-100 dark:bg-forest-800 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                <item.icon size={20} className="text-forest-700 dark:text-forest-200" />
              </div>
              <h3 className="text-xl font-semibold text-forest-950 dark:text-forest-50 mb-3 tracking-tight">{item.title}</h3>
              <p className="text-[15px] leading-relaxed text-forest-700 dark:text-forest-300">{item.body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase text-forest-600 dark:text-forest-400 mb-3">
              {a.catalogEyebrow}
            </div>
            <h3 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-forest-950 dark:text-forest-50">
              {a.catalogTitle}
            </h3>
          </div>
          <a href="#catalog" className="hidden sm:inline-flex text-sm text-forest-700 dark:text-forest-300 hover:text-forest-900 dark:hover:text-white items-center gap-1 transition-colors">
            {a.seeAll}<span aria-hidden>→</span>
          </a>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {featuredTrees.map((tree, i) => (
            <motion.article
              key={tree.id}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.6 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="tree-card group relative rounded-3xl overflow-hidden bg-gradient-to-b from-white to-forest-50 dark:from-forest-900 dark:to-forest-950 border border-forest-200/60 dark:border-forest-800/60"
            >
              <div className="aspect-[4/5] flex items-end justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-forest-100/40 dark:to-forest-900/40" />
                <motion.div whileHover={{ scale: 1.05, y: -8 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="relative w-full max-w-[200px]">
                  <TreeIllustration svg={tree.svg} imagePath={tree.imagePath} alt={tree.name} className="w-full" />
                </motion.div>
              </div>
              <div className="p-6 pt-0">
                <div className="flex items-baseline justify-between mb-1">
                  <h4 className="text-lg font-semibold text-forest-950 dark:text-forest-50 tracking-tight">{tree.name}</h4>
                  <span className="text-xs text-forest-500 dark:text-forest-400 italic font-light">{tree.latin}</span>
                </div>
                <p className="text-[14px] leading-relaxed text-forest-700 dark:text-forest-300">{tree.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
