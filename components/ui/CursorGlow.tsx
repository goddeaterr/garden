'use client';

import { useEffect, useRef } from 'react';

/**
 * Cursor glow — pure RAF lerp, zero React re-renders.
 * No framer-motion spring (which fires a re-render every animation frame).
 * The orb is promoted to its own GPU layer via will-change:transform.
 */
export function CursorGlow() {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start off-screen so there's no flash on mount
    let tx = -1000, ty = -1000;
    let cx = -1000, cy = -1000;
    let rafId = 0;
    const LERP = 0.072; // lag factor — lower = more lag

    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };

    const loop = () => {
      cx += (tx - cx) * LERP;
      cy += (ty - cy) * LERP;
      if (orbRef.current) {
        // translate so the centre of the 620px orb sits on the cursor
        orbRef.current.style.transform = `translate(${cx - 310}px,${cy - 310}px)`;
      }
      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    // Only renders on pointer:fine (mouse) devices
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[2] hidden [@media(pointer:fine)]:block overflow-hidden">
      <div
        ref={orbRef}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: 620,
          height: 620,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(88,192,108,0.11) 0%, rgba(68,152,88,0.045) 48%, transparent 70%)',
          mixBlendMode: 'soft-light',
          willChange: 'transform',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
