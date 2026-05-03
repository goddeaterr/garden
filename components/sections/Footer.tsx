'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import { Particles } from '@/components/ui/Particles';

const services = [
  'Sodo projektavimas', 'Vizitai į vietą', 'Augalų pristatymas', 'Sodinimas', 'Dirvos paruošimas',
  'Sodo projektavimas', 'Vizitai į vietą', 'Augalų pristatymas', 'Sodinimas', 'Dirvos paruošimas',
];

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { tr } = useI18n();
  const f = tr.footer;

  return (
    <footer ref={ref} id="footer" className="relative bg-forest-950 text-forest-50 overflow-hidden">
      <Particles density={12} type="mixed" />
      <div className="border-b border-forest-800 py-8 overflow-hidden relative">
        {/* Edge vignette — fades items in/out at sides */}
        <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgb(12,22,14), transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, rgb(12,22,14), transparent)' }} />
        <div className="flex marquee whitespace-nowrap">
          {[...services, ...services].map((s, i) => (
            <div key={i} className="flex items-center mx-10">
              <span className="text-3xl md:text-5xl font-light italic text-forest-200">{s}</span>
              {/* Leaf separator */}
              <svg className="mx-10 text-forest-600 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17 8C8 10 5.9 16.17 3.82 22H5.5c.5-2 1.5-4 2.5-5.5 2 1.5 4.5 2 6.5 2s4-.5 5-2c1-1.5 2-3.5 2.5-5.5H23C21.5 5 17 8 17 8z" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16"
        >
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 22V14M12 14C8 14 5 10 5 6C5 3 8 2 12 2C16 2 19 3 19 6C19 10 16 14 12 14Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-base font-semibold tracking-tight">MB Plant House</span>
            </div>
            <p className="text-2xl font-light leading-relaxed text-forest-200 max-w-md">{f.tagline}</p>
            <div className="mt-8 flex gap-2">
              <a href="#catalog" className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-50 text-forest-950 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform">
                {f.catalog}
                <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" />
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-forest-400 mb-4">{f.browse}</div>
            <ul className="space-y-3">
              {[
                { label: f.catalog, href: '#catalog' },
                { label: f.aboutUs, href: '#about' },
                { label: f.services, href: '#' },
                { label: f.care, href: '#' },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[15px] text-forest-100 hover:text-white inline-flex items-center gap-1 group">
                    {l.label}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-forest-400 mb-4">{f.visitContact}</div>
            <ul className="space-y-3 text-[15px] text-forest-100">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-forest-400 flex-shrink-0" />
                <span>Užuovėjos g. 6, Piktožių k.<br />LT-96164 Klaipėdos r., Lithuania</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-forest-400 flex-shrink-0" />
                <a href="tel:+37061854758" className="hover:text-white">+370 618 54758</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-forest-400 flex-shrink-0" />
                <a href="mailto:info@planthouse.lt" className="hover:text-white">info@planthouse.lt</a>
              </li>
            </ul>
            <div className="mt-6 pt-6 border-t border-forest-800">
              <div className="text-[11px] uppercase tracking-[0.2em] text-forest-400 mb-2">{f.open}</div>
              <p className="text-[14px] text-forest-200 leading-relaxed whitespace-pre-line">{f.hours}</p>
            </div>
          </div>
        </motion.div>

        <div className="mt-20 pt-8 border-t border-forest-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-forest-400">© {new Date().getFullYear()} MB Plant House. {f.copyright}</p>
          <div className="flex items-center gap-6 text-xs text-forest-400">
            <a href="/privacy" className="hover:text-forest-200">{f.privacy}</a>
            <a href="/terms" className="hover:text-forest-200">{f.terms}</a>
            <a href="/cookies" className="hover:text-forest-200">{f.cookies}</a>
            <a href="/admin" className="opacity-20 hover:opacity-60 transition-opacity" aria-label="Admin">⚙</a>
          </div>
        </div>
      </div>

      {/* Full-width forest panorama silhouette */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" aria-hidden>
        <svg viewBox="0 0 1440 160" preserveAspectRatio="xMidYMax meet" className="w-full block" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="rgba(235,245,236,0.07)"
            d="M0,160 L0,125 C40,118 70,108 100,115 C120,120 135,130 155,126 C178,121 190,98 218,82 C232,74 244,78 258,92 C272,106 282,118 300,114 C318,109 332,85 358,68 C374,57 388,62 402,78 C416,92 428,104 448,100 C468,94 482,68 508,52 C524,42 538,46 554,62 C568,76 580,90 600,86 C620,80 634,56 660,40 C678,28 694,33 710,50 C726,66 736,80 756,76 C776,70 790,46 816,32 C834,22 850,27 866,44 C882,60 892,74 912,70 C932,65 946,42 972,28 C990,18 1006,22 1024,40 C1040,56 1052,70 1072,66 C1092,60 1106,38 1132,26 C1150,16 1166,22 1184,40 C1200,56 1212,70 1232,66 C1252,60 1266,40 1290,30 C1308,22 1326,28 1346,46 C1362,60 1376,74 1398,70 C1418,66 1432,52 1440,46 L1440,160 Z"
          />
          <path
            fill="rgba(235,245,236,0.04)"
            d="M0,160 L0,140 C60,132 110,128 160,135 C200,140 230,148 270,144 C310,139 340,122 380,112 C410,104 436,106 462,118 C488,130 508,142 540,138 C572,132 596,112 630,100 C656,90 680,92 706,106 C730,118 752,132 780,128 C808,122 830,104 860,92 C884,82 908,84 932,98 C956,112 974,128 1002,124 C1028,118 1048,100 1076,88 C1100,78 1124,80 1148,94 C1172,108 1190,124 1216,120 C1240,115 1260,98 1288,88 C1312,80 1340,82 1370,96 C1398,110 1420,126 1440,122 L1440,160 Z"
          />
        </svg>
      </div>
    </footer>
  );
}
