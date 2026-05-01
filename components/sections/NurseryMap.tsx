'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18nContext';

interface Nursery {
  name: string;
  city: string;
  lat: number;
  lon: number;
  mapQuery: string;
  url: string;
  color: string;
}

const NURSERIES: Nursery[] = [
  {
    name: 'Šiūparių gėlių ūkis',
    city: 'Klaipėdos r.',
    lat: 55.641,
    lon: 21.331,
    mapQuery: 'Šiūparių+gėlių+ūkis+Klaipėda',
    url: 'https://www.siupariugeles.lt',
    color: '#10b981',
  },
  {
    name: 'GrowUp',
    city: 'Kaunas',
    lat: 54.899,
    lon: 23.904,
    mapQuery: 'GrowUp+nursery+Kaunas+Lithuania',
    url: 'https://www.growup.lt',
    color: '#6366f1',
  },
  {
    name: 'Gėliuukis',
    city: 'Klaipėda',
    lat: 55.703,
    lon: 21.144,
    mapQuery: 'Gėliuukis+Klaipėda+Lithuania',
    url: 'https://geliuukis.lt',
    color: '#f59e0b',
  },
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  highlight?: string | null;
  onSelectNursery?: (name: string | null) => void;
}

export function NurseryMap({ highlight, onSelectNursery }: Props) {
  const [active, setActive] = useState<Nursery>(NURSERIES[0]);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [maxKm, setMaxKm] = useState(200);

  useEffect(() => {
    if (highlight) {
      const found = NURSERIES.find(n => n.name === highlight);
      if (found) setActive(found);
    }
  }, [highlight]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) { setLocError('Geolokacija nepalaikoma'); return; }
    setLocLoading(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocLoading(false);
      },
      () => {
        setLocError('Nepavyko gauti jūsų vietos');
        setLocLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  const distances = userPos
    ? NURSERIES.map(n => ({ name: n.name, km: haversineKm(userPos.lat, userPos.lon, n.lat, n.lon) }))
    : null;

  const visibleNurseries = distances
    ? NURSERIES.filter(n => {
        const d = distances.find(dd => dd.name === n.name);
        return d ? d.km <= maxKm : true;
      })
    : NURSERIES;

  const embedSrc = `https://maps.google.com/maps?q=${active.mapQuery}&z=13&output=embed&hl=lt`;

  return (
    <div className="rounded-2xl overflow-hidden border border-forest-200/60 dark:border-forest-800 bg-white dark:bg-forest-900 shadow-sm">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-forest-100 dark:border-forest-800">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-emerald-500" />
            <span className="text-[13px] font-semibold text-forest-900 dark:text-forest-50">Darželių vietos</span>
          </div>

          {/* Near me / distance controls */}
          <div className="flex items-center gap-2">
            {userPos && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-forest-500 whitespace-nowrap">Iki</span>
                <input
                  type="range" min={20} max={400} step={10} value={maxKm}
                  onChange={e => setMaxKm(Number(e.target.value))}
                  className="apple-slider w-20"
                />
                <span className="text-[11px] font-semibold text-forest-700 dark:text-forest-300 tabular-nums w-14">{maxKm} km</span>
                <button
                  onClick={() => { setUserPos(null); setLocError(null); }}
                  className="w-5 h-5 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center text-forest-500 hover:text-red-500 transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            )}
            {!userPos && (
              <button
                onClick={locate}
                disabled={locLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300 text-[12px] font-medium hover:bg-forest-200 dark:hover:bg-forest-700 transition-colors disabled:opacity-60"
              >
                {locLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                Šalia manęs
              </button>
            )}
            {locError && <span className="text-[11px] text-red-500">{locError}</span>}
          </div>
        </div>

        {/* Nursery tabs */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {NURSERIES.map(n => {
            const dist = distances?.find(d => d.name === n.name);
            const hidden = userPos && !visibleNurseries.includes(n);
            return (
              <button
                key={n.name}
                onClick={() => {
                  setActive(n);
                  onSelectNursery?.(n.name);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border',
                  hidden ? 'opacity-30 pointer-events-none' : '',
                  active.name === n.name
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-forest-50 dark:bg-forest-800 text-forest-700 dark:text-forest-300 border-forest-200 dark:border-forest-700 hover:border-forest-300'
                )}
                style={active.name === n.name ? { background: n.color, borderColor: n.color } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: active.name === n.name ? 'rgba(255,255,255,0.8)' : n.color }}
                />
                {n.name}
                {n.city && (
                  <span className={cn('text-[10px]', active.name === n.name ? 'text-white/70' : 'text-forest-400')}>
                    · {n.city}
                  </span>
                )}
                {dist && !hidden && (
                  <span className={cn(
                    'text-[10px] font-semibold tabular-nums',
                    active.name === n.name ? 'text-white/80' : 'text-emerald-600 dark:text-emerald-400'
                  )}>
                    {dist.km < 10 ? `${dist.km.toFixed(1)}` : Math.round(dist.km)} km
                  </span>
                )}
              </button>
            );
          })}

          {onSelectNursery && (
            <button
              onClick={() => onSelectNursery(null)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-forest-400 hover:text-forest-700 dark:hover:text-forest-200 transition-colors"
            >
              <X size={10} /> Išvalyti filtrą
            </button>
          )}
        </div>
      </div>

      {/* Google Maps iframe */}
      <div className="relative" style={{ height: 300 }}>
        <iframe
          key={active.name}
          src={embedSrc}
          width="100%"
          height="300"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Žemėlapis: ${active.name}`}
        />
        {/* Nursery info overlay */}
        <div className="absolute bottom-3 left-3 glass-strong rounded-xl px-3 py-2 shadow-lg pointer-events-none">
          <div className="text-[11px] font-bold text-forest-900 dark:text-forest-50">{active.name}</div>
          <div className="text-[10px] text-forest-500">{active.city}</div>
          {distances && (
            <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {(() => {
                const d = distances.find(dd => dd.name === active.name);
                if (!d) return null;
                return d.km < 10
                  ? `${d.km.toFixed(1)} km nuo jūsų`
                  : `${Math.round(d.km)} km nuo jūsų`;
              })()}
            </div>
          )}
        </div>
        {/* Visit link */}
        <a
          href={active.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 glass-strong rounded-xl px-3 py-2 text-[11px] font-semibold text-forest-800 dark:text-forest-100 hover:scale-105 active:scale-95 transition-transform shadow-lg"
        >
          Apsilankyti →
        </a>
      </div>
    </div>
  );
}
