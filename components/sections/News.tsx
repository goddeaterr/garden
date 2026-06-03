'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Tag, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import type { NewsItem } from '@/types';
import { useI18n } from '@/lib/i18nContext';

function normalizeImagePath(path: string | undefined): string | undefined {
  if (!path?.trim()) return undefined;
  const value = path.trim();
  // base64 data URLs, absolute URLs and root-relative paths are all valid as-is
  if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
  return `/${value}`;
}

function fallbackImageFor(_item: NewsItem): string {
  return '/hero-bg.jpg';
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(
      locale === 'lt' ? 'lt-LT' : locale === 'ru' ? 'ru-RU' : 'en-GB',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  } catch { return iso.slice(0, 10); }
}

function NewsCard({ item, locale }: { item: NewsItem; locale: string }) {
  const [expanded, setExpanded] = useState(false);
  const fallbackImage = fallbackImageFor(item);
  const [imageSrc, setImageSrc] = useState(() => normalizeImagePath(item.imagePath) || fallbackImage);
  const preview = item.content.length > 220 ? item.content.slice(0, 220).replace(/\s+\S*$/, '') + '…' : item.content;
  const needsExpand = item.content.length > 220;

  useEffect(() => {
    setImageSrc(normalizeImagePath(item.imagePath) || fallbackImage);
  }, [fallbackImage, item.imagePath]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white/70 dark:bg-forest-900/60 border border-white/80 dark:border-forest-700/40 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-forest-900/8 transition-shadow duration-300"
    >
      {/* Image */}
      {imageSrc && (
        <div className="relative h-44 overflow-hidden bg-forest-100 dark:bg-forest-800">
          <img
            src={imageSrc}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={() => {
              setImageSrc(current => current === fallbackImage ? '' : fallbackImage);
            }}
          />
        </div>
      )}

      <div className="p-5">
        {/* Tag + date row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {item.tag && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300">
              <Tag size={9} />
              {item.tag}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-forest-500 dark:text-forest-400">
            <Calendar size={11} />
            {formatDate(item.publishedAt, locale)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[16px] font-bold text-forest-950 dark:text-forest-50 leading-snug mb-2 tracking-tight">
          {item.title}
        </h3>

        {/* Content */}
        <p className="text-[13.5px] text-forest-700 dark:text-forest-300 leading-relaxed whitespace-pre-line">
          {expanded ? item.content : preview}
        </p>

        {needsExpand && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-forest-600 dark:text-forest-400 hover:text-forest-900 dark:hover:text-forest-100 transition-colors"
          >
            {expanded
              ? (locale === 'lt' ? 'Sutraukti' : locale === 'ru' ? 'Свернуть' : 'Show less')
              : (locale === 'lt' ? 'Skaityti daugiau' : locale === 'ru' ? 'Читать далее' : 'Read more')}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>
    </motion.article>
  );
}

export function News() {
  const { locale, tr } = useI18n();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news', { cache: 'no-store' })
      .then(r => {
        if (!r.ok) { console.error('[News] API error', r.status); return []; }
        return r.json();
      })
      .then((data: NewsItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch(err => { console.error('[News] fetch failed', err); setItems([]); })
      .finally(() => setLoading(false));
  }, []);

  // Don't render section at all if no news
  if (!loading && items.length === 0) return null;

  const n = (tr as any).news || {};

  return (
    <section id="news" className="py-20 px-4 sm:px-6 bg-forest-50/60 dark:bg-forest-950/60 border-t border-forest-200/40 dark:border-forest-800/40">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300 text-[11px] font-semibold uppercase tracking-wider mb-4">
            <Newspaper size={12} />
            <span>{n.eyebrow || 'News'}</span>
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-forest-950 dark:text-forest-50 leading-tight">
            {n.title || 'Latest from the nursery.'}
          </h2>
        </motion.div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-52 rounded-2xl bg-forest-100 dark:bg-forest-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(item => (
              <NewsCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
