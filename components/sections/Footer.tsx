'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';

const services = [
  'Garden design', 'Site visits', 'Tree delivery', 'Planting', 'Soil preparation',
  'Garden design', 'Site visits', 'Tree delivery', 'Planting', 'Soil preparation',
];

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { tr } = useI18n();
  const f = tr.footer;

  return (
    <footer ref={ref} id="footer" className="relative bg-forest-950 text-forest-50 overflow-hidden">
      <div className="border-b border-forest-800 py-8 overflow-hidden">
        <div className="flex marquee whitespace-nowrap">
          {[...services, ...services].map((s, i) => (
            <div key={i} className="flex items-center mx-12">
              <span className="text-3xl md:text-5xl font-light italic text-forest-200">{s}</span>
              <span className="mx-12 w-2 h-2 rounded-full bg-forest-700" />
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
              <a href="#builder" className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-50 text-forest-950 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform">
                {f.openBuilder}
                <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" />
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-forest-400 mb-4">{f.browse}</div>
            <ul className="space-y-3">
              {[
                { label: f.catalog, href: '#catalog' },
                { label: f.builder, href: '#builder' },
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

      <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] opacity-[0.04] pointer-events-none">
        <svg viewBox="0 0 400 400" fill="currentColor" className="text-forest-50 w-full h-full">
          <path d="M195 400 L195 300 Q170 270 180 230 Q160 200 195 165 Q230 200 210 230 Q220 270 195 300 Z" />
          <ellipse cx="195" cy="160" rx="140" ry="125" />
        </svg>
      </div>
    </footer>
  );
}
