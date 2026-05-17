'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import { Particles } from '@/components/ui/Particles';

/* ─── Map embed URL ───────────────────────────────────────── */
const ADDR_ENCODED = 'U%C5%BEuov%C4%97jos+g.+6%2C+Pikt%C5%BE%C5%B3+k.%2C+LT-96164+Klaip%C4%97dos+r.%2C+Lithuania';
const EMBED_URL    = `https://maps.google.com/maps?q=${ADDR_ENCODED}&output=embed&z=14&hl=en`;

/* ─── Open/closed status ──────────────────────────────────── */
function getOpenStatus() {
  const now = new Date();
  const day = now.getDay();                         // 0=Sun … 6=Sat
  const h   = now.getHours() + now.getMinutes() / 60;
  if (day >= 1 && day <= 5) return h >= 9  && h < 18;  // Mon–Fri 9–18
  if (day === 6)             return h >= 10 && h < 16;  // Sat 10–16
  return false;                                          // Sunday
}

/* ─── Botanical corner decoration ────────────────────────── */
function CornerDecoration({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="110" height="110" viewBox="0 0 110 110" fill="none"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden
    >
      {/* L-shaped corner bracket */}
      <path d="M10 60 L10 10 L60 10"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.45"/>

      {/* Main diagonal stem curving from corner into the map */}
      <path d="M10 10 C28 32 42 58 54 98"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55"/>

      {/* Leaf 1 — large, sweeps along the top edge going right */}
      <path d="M10 10 C20 -4 48 -2 52 12 C40 22 22 20 10 10 Z"
        fill="currentColor" opacity="0.38"/>
      {/* Vein 1 */}
      <path d="M10 10 C22 6 36 6 52 12"
        stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" opacity="0.3"/>

      {/* Leaf 2 — medium, from mid-stem going upper-right */}
      <path d="M24 26 C30 8 58 8 58 22 C50 34 34 36 24 26 Z"
        fill="currentColor" opacity="0.30"/>
      {/* Vein 2 */}
      <path d="M24 26 C34 16 46 12 58 22"
        stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity="0.25"/>

      {/* Leaf 3 — from lower-mid stem, pointing right */}
      <path d="M36 46 C44 28 70 30 68 44 C60 58 44 58 36 46 Z"
        fill="currentColor" opacity="0.24"/>
      {/* Vein 3 */}
      <path d="M36 46 C46 36 58 32 68 44"
        stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity="0.2"/>

      {/* Small accent leaf — left side of stem, near top */}
      <path d="M14 22 C8 12 16 4 24 8 C22 14 18 20 14 22 Z"
        fill="currentColor" opacity="0.30"/>
      {/* Its vein */}
      <path d="M14 22 C18 14 22 10 24 8"
        stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.25"/>

      {/* Tiny leaf near stem base */}
      <path d="M46 66 C52 54 66 56 64 66 C60 74 50 72 46 66 Z"
        fill="currentColor" opacity="0.18"/>

      {/* Decorative dots — berries / buds */}
      <circle cx="11" cy="11" r="2.5"  fill="currentColor" opacity="0.35"/>
      <circle cx="16" cy="10"  r="1.4"  fill="currentColor" opacity="0.28"/>
      <circle cx="10" cy="16"  r="1.4"  fill="currentColor" opacity="0.28"/>
      <circle cx="54" cy="72"  r="1.8"  fill="currentColor" opacity="0.20"/>
    </svg>
  );
}


export function Footer() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { tr } = useI18n();
  const f      = tr.footer;
  const isOpen = getOpenStatus();

  return (
    <footer ref={ref} id="footer" className="relative bg-white dark:bg-forest-950 text-forest-900 dark:text-forest-50 overflow-hidden">
      <Particles density={12} type="mixed" />

      {/* ── Marquee band ── */}
      <div
        className="relative border-t border-b border-forest-100 dark:border-forest-800 py-10 overflow-hidden"
        style={{ perspective: '600px' }}
      >
        <div className="dark:hidden absolute inset-y-0 left-0  w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #ffffff, transparent)' }} />
        <div className="hidden dark:block absolute inset-y-0 left-0  w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, rgb(12,22,14), transparent)' }} />
        <div className="dark:hidden absolute inset-y-0 right-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #ffffff, transparent)' }} />
        <div className="hidden dark:block absolute inset-y-0 right-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, rgb(12,22,14), transparent)' }} />
        <div style={{ transform: 'rotateX(8deg)', transformOrigin: 'top center' }}>
          <div className="flex marquee whitespace-nowrap">
            {[...f.serviceItems, ...f.serviceItems].map((s, i) => (
              <div key={i} className="flex items-center mx-10">
                <span className="text-3xl md:text-5xl font-light italic text-forest-700 dark:text-forest-200">{s}</span>
                <svg className="mx-10 text-forest-400 dark:text-forest-600 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17 8C8 10 5.9 16.17 3.82 22H5.5c.5-2 1.5-4 2.5-5.5 2 1.5 4.5 2 6.5 2s4-.5 5-2c1-1.5 2-3.5 2.5-5.5H23C21.5 5 17 8 17 8z" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer body ── */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-12 w-full"
        >
          {/* Browse */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-forest-400 mb-4">{f.browse}</div>
            <ul className="space-y-3">
              {[
                { label: f.catalog,  href: '#catalog'  },
                { label: f.aboutUs,  href: '#about'    },
                { label: f.services, href: '#services' },
                { label: f.care,     href: '#'         },
              ].map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-[15px] text-forest-700 dark:text-forest-100 hover:text-forest-950 dark:hover:text-white inline-flex items-center gap-1 group transition-colors">
                    {l.label}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-forest-400 mb-4">{(f as any).aboutTitle}</div>
            <p className="text-[15px] text-forest-700 dark:text-forest-100 leading-relaxed mb-6">
              {(f as any).aboutDesc}
            </p>
            <div className="text-[11px] uppercase tracking-[0.2em] text-forest-400 mb-3">{(f as any).followUs}</div>
            <div className="flex items-center gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-forest-200 dark:border-forest-700 flex items-center justify-center text-forest-500 dark:text-forest-400 hover:text-forest-900 dark:hover:text-white hover:border-forest-400 dark:hover:border-forest-500 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-forest-200 dark:border-forest-700 flex items-center justify-center text-forest-500 dark:text-forest-400 hover:text-forest-900 dark:hover:text-white hover:border-forest-400 dark:hover:border-forest-500 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-forest-200 dark:border-forest-700 flex items-center justify-center text-forest-500 dark:text-forest-400 hover:text-forest-900 dark:hover:text-white hover:border-forest-400 dark:hover:border-forest-500 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-forest-400 mb-4">{f.visitContact}</div>
            <ul className="space-y-3 text-[15px] text-forest-700 dark:text-forest-100">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-forest-400 flex-shrink-0" />
                <span>Užuovėjos g. 6, Piktožių k.<br />LT-96164 Klaipėdos r., Lithuania</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-forest-400 flex-shrink-0" />
                <a href="tel:+37061854758" className="hover:text-forest-950 dark:hover:text-white transition-colors">+370 618 54758</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-forest-400 flex-shrink-0" />
                <a href="mailto:info@planthouse.lt" className="hover:text-forest-950 dark:hover:text-white transition-colors">info@planthouse.lt</a>
              </li>
            </ul>
            <div className="mt-6 pt-6 border-t border-forest-100 dark:border-forest-800">
              <div className="text-[11px] uppercase tracking-[0.2em] text-forest-400 mb-2">{f.open}</div>
              <p className="text-[14px] text-forest-600 dark:text-forest-200 leading-relaxed whitespace-pre-line">{f.hours}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Map Widget ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 rounded-2xl overflow-hidden border border-forest-100 dark:border-forest-800 shadow-2xl shadow-forest-900/[0.07] dark:shadow-forest-950/60"
        >
          {/* ── Widget header ── */}
          <div className="relative flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-forest-50 dark:bg-forest-900 border-b border-forest-100 dark:border-forest-800">

            {/* Faint botanical watermark left */}
            <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none overflow-hidden opacity-[0.06]" aria-hidden>
              <svg className="absolute -left-4 top-1/2 -translate-y-1/2 w-24 h-24 text-forest-900 dark:text-forest-100" viewBox="0 0 80 80" fill="currentColor">
                <path d="M5 75C5 75 8 52 25 40C42 28 75 5 75 5C75 5 72 18 60 32C48 46 40 50 28 60C16 70 5 75 5 75Z"/>
                <path d="M5 75C18 60 32 48 46 30" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>

            {/* Address block */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/20 flex items-center justify-center">
                <MapPin size={15} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-forest-900 dark:text-forest-50">MB Plant House</span>
                  {/* Live open/closed badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                    isOpen
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-forest-100 dark:bg-forest-800 text-forest-500 dark:text-forest-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-forest-400'}`} />
                    {isOpen ? 'Open now' : 'Closed'}
                  </span>
                </div>
                <p className="text-[11px] text-forest-500 dark:text-forest-400 truncate mt-0.5">
                  Užuovėjos g. 6 · Piktožių k. · Klaipėdos r.
                </p>
              </div>
            </div>

          </div>

          {/* ── Map iframe ── */}
          <div className="relative h-[260px] sm:h-[320px] md:h-[360px]">
            <iframe
              src={EMBED_URL}
              className="w-full h-full dark:[filter:invert(0.92)_hue-rotate(180deg)_saturate(0.68)_brightness(1.08)]"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="MB Plant House – Google Maps"
              allowFullScreen
            />

            {/* Top-left botanical corner */}
            <div className="absolute top-0 left-0 pointer-events-none text-forest-800 dark:text-white opacity-30 dark:opacity-55" aria-hidden>
              <CornerDecoration />
            </div>

            {/* Top-right botanical corner (mirrored) */}
            <div className="absolute top-0 right-0 pointer-events-none text-forest-800 dark:text-white opacity-30 dark:opacity-55" aria-hidden>
              <CornerDecoration flip />
            </div>

            {/* Thin emerald bottom-edge glow */}
            <div className="absolute inset-x-0 bottom-0 h-[3px] pointer-events-none bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

            {/* Subtle side vignettes so iframe edges blend into the card */}
            <div className="absolute inset-y-0 left-0  w-6 pointer-events-none bg-gradient-to-r  from-forest-50/30  dark:from-forest-900/30  to-transparent" />
            <div className="absolute inset-y-0 right-0 w-6 pointer-events-none bg-gradient-to-l  from-forest-50/30  dark:from-forest-900/30  to-transparent" />
          </div>
        </motion.div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 pt-8 border-t border-forest-100 dark:border-forest-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-forest-400">© {new Date().getFullYear()} MB Plant House. {f.copyright}</p>
          <div className="flex items-center gap-6 text-xs text-forest-400">
            <a href="/privacy" className="hover:text-forest-700 dark:hover:text-forest-200 transition-colors">{f.privacy}</a>
            <a href="/terms"   className="hover:text-forest-700 dark:hover:text-forest-200 transition-colors">{f.terms}</a>
            <a href="/cookies" className="hover:text-forest-700 dark:hover:text-forest-200 transition-colors">{f.cookies}</a>
            <a href="/admin"   className="opacity-20 hover:opacity-60 transition-opacity" aria-label="Admin">⚙</a>
          </div>
        </div>
      </div>

      {/* Forest panorama silhouette — dark mode only */}
      <div className="hidden dark:block absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" aria-hidden>
        <svg viewBox="0 0 1440 160" preserveAspectRatio="xMidYMax meet" className="w-full block">
          <path fill="rgba(235,245,236,0.07)" d="M0,160 L0,125 C40,118 70,108 100,115 C120,120 135,130 155,126 C178,121 190,98 218,82 C232,74 244,78 258,92 C272,106 282,118 300,114 C318,109 332,85 358,68 C374,57 388,62 402,78 C416,92 428,104 448,100 C468,94 482,68 508,52 C524,42 538,46 554,62 C568,76 580,90 600,86 C620,80 634,56 660,40 C678,28 694,33 710,50 C726,66 736,80 756,76 C776,70 790,46 816,32 C834,22 850,27 866,44 C882,60 892,74 912,70 C932,65 946,42 972,28 C990,18 1006,22 1024,40 C1040,56 1052,70 1072,66 C1092,60 1106,38 1132,26 C1150,16 1166,22 1184,40 C1200,56 1212,70 1232,66 C1252,60 1266,40 1290,30 C1308,22 1326,28 1346,46 C1362,60 1376,74 1398,70 C1418,66 1432,52 1440,46 L1440,160 Z"/>
          <path fill="rgba(235,245,236,0.04)" d="M0,160 L0,140 C60,132 110,128 160,135 C200,140 230,148 270,144 C310,139 340,122 380,112 C410,104 436,106 462,118 C488,130 508,142 540,138 C572,132 596,112 630,100 C656,90 680,92 706,106 C730,118 752,132 780,128 C808,122 830,104 860,92 C884,82 908,84 932,98 C956,112 974,128 1002,124 C1028,118 1048,100 1076,88 C1100,78 1124,80 1148,94 C1172,108 1190,124 1216,120 C1240,115 1260,98 1288,88 C1312,80 1340,82 1370,96 C1398,110 1420,126 1440,122 L1440,160 Z"/>
        </svg>
      </div>
    </footer>
  );
}
