'use client';

import { forwardRef } from 'react';
import { useGarden } from './GardenContext';
import { useTrees } from '@/lib/useTrees';
import { getGardenDepthMetrics } from '@/lib/gardenDepth';

export const CleanRenderLayer = forwardRef<HTMLDivElement>((_, ref) => {
  const { placed, backgroundImage } = useGarden();
  const trees = useTrees();

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden',
      }}
    >
      {backgroundImage && backgroundImage !== 'stock' && (
        <img src={backgroundImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
      )}
      {(!backgroundImage || backgroundImage === 'stock') && (
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="cr-sky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dbeafe" /><stop offset="60%" stopColor="#e3ede3" /><stop offset="100%" stopColor="#c8dac9" />
            </linearGradient>
            <linearGradient id="cr-ground" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9fbf9f" /><stop offset="100%" stopColor="#508153" />
            </linearGradient>
          </defs>
          <rect width="1200" height="800" fill="url(#cr-sky)" />
          <ellipse cx="600" cy="800" rx="900" ry="280" fill="url(#cr-ground)" />
        </svg>
      )}

      {placed
        .slice()
        .sort((a, b) => (a.z + a.y * 1000) - (b.z + b.y * 1000))
        .map(p => {
          const tree = trees.find(t => t.id === p.treeId);
          if (!tree) return null;
          const metrics = getGardenDepthMetrics(p, tree);
          const imagePath = tree.builderImagePath || tree.imagePath;
          return (
            <div
              key={p.uid}
              style={{
                position: 'absolute',
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                width: 180,
                height: 180,
                transform: `translate(-50%, -82%) scale(${metrics.finalScale})`,
                transformOrigin: 'center bottom',
                opacity: metrics.visualOpacity,
                filter: `blur(${metrics.blurPx}px) drop-shadow(0 ${Math.round(4 + metrics.depth * 8)}px ${Math.round(8 + metrics.depth * 12)}px rgba(0,0,0,${0.14 + metrics.depth * 0.18}))`,
                pointerEvents: 'none',
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: metrics.shadowY,
                  width: 110,
                  height: 24,
                  borderRadius: 999,
                  background: 'rgba(33, 55, 36, 0.45)',
                  opacity: metrics.shadowOpacity,
                  filter: `blur(${metrics.shadowBlur}px)`,
                  transform: `translate(-50%, 0) scaleX(${metrics.shadowScale})`,
                }}
              />
              <div style={{ width: '100%', height: '100%', transform: `rotate(${p.rotation}deg) ${p.flipped ? 'scaleX(-1)' : ''}`, transformOrigin: 'center bottom' }}>
                {imagePath ? (
                  <img src={imagePath} alt={tree.name} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', display: 'block' }} draggable={false} crossOrigin="anonymous" />
                ) : (
                  <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: tree.svg }} />
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
});

CleanRenderLayer.displayName = 'CleanRenderLayer';
