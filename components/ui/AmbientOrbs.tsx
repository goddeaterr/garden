'use client';

/**
 * Three large, heavily-blurred gradient orbs fixed behind the entire page.
 * Each drifts on its own slow cycle (28–44 s). They never obscure content
 * (z-index 0, pointer-events none) but add the kind of depth / warmth you
 * see on Apple Silicon and Vercel marketing pages.
 */
export function AmbientOrbs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Top-left — cool forest green */}
      <div className="ambient-orb ambient-orb-1" />
      {/* Bottom-right — warm moss gold */}
      <div className="ambient-orb ambient-orb-2" />
      {/* Centre — pale emerald accent */}
      <div className="ambient-orb ambient-orb-3" />
    </div>
  );
}
