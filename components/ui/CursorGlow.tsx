'use client';

import { useEffect, useRef } from 'react';

export function CursorGlow() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let ox = -400, oy = -400;   // outer (slow, big glow)
    let ix = -400, iy = -400;   // inner (fast, tight dot)
    let raf = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const move = (e: MouseEvent) => {
      ix = e.clientX;
      iy = e.clientY;
    };

    const tick = () => {
      ox = lerp(ox, ix, 0.07);
      oy = lerp(oy, iy, 0.07);
      outer.style.transform = `translate(${ox - 200}px, ${oy - 200}px)`;
      inner.style.transform = `translate(${ix - 6}px, ${iy - 6}px)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', move, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Large soft glow — lags behind cursor for depth */}
      <div
        ref={outerRef}
        aria-hidden
        className="cursor-glow-orb fixed top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none select-none z-[1]"
        style={{
          background: 'radial-gradient(circle, rgba(80,129,83,0.14) 0%, rgba(113,158,114,0.07) 45%, transparent 70%)',
          willChange: 'transform',
        }}
      />
      {/* Tiny crisp dot — snaps to cursor */}
      <div
        ref={innerRef}
        aria-hidden
        className="cursor-glow-orb fixed top-0 left-0 w-3 h-3 rounded-full pointer-events-none select-none z-[2]"
        style={{
          background: 'rgba(80,129,83,0.55)',
          boxShadow: '0 0 12px 4px rgba(80,129,83,0.35)',
          willChange: 'transform',
        }}
      />
    </>
  );
}
