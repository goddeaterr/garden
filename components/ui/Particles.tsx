'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'leaf' | 'pollen' | 'seed' | 'spore';
  opacity: number;
  opacitySpeed: number;
  phase: number;
  wobble: number;
  color: [number, number, number];
}

const LEAF_COLORS: [number, number, number][] = [
  [113, 158, 114],
  [80, 129, 83],
  [151, 191, 151],
  [60, 103, 65],
  [171, 201, 131],
];
const POLLEN_COLORS: [number, number, number][] = [
  [214, 195, 153],
  [230, 210, 140],
  [200, 175, 110],
];
const SEED_COLORS: [number, number, number][] = [
  [180, 155, 100],
  [210, 185, 130],
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function Particles({
  density = 35,
  type = 'mixed',
}: {
  density?: number;
  type?: 'mixed' | 'leaves' | 'pollen';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const activeRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let particles: Particle[] = [];
    let W = 0, H = 0;

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const el = canvas.parentElement;
      W = el ? el.offsetWidth : window.innerWidth;
      H = el ? el.offsetHeight : window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const mkParticle = (randomY = true): Particle => {
      const roll = Math.random();
      let pType: Particle['type'];
      if (type === 'leaves') pType = 'leaf';
      else if (type === 'pollen') pType = roll > 0.3 ? 'pollen' : 'spore';
      else {
        if (roll < 0.45) pType = 'leaf';
        else if (roll < 0.72) pType = 'pollen';
        else if (roll < 0.88) pType = 'seed';
        else pType = 'spore';
      }

      const color =
        pType === 'leaf' ? randomFrom(LEAF_COLORS) :
        pType === 'pollen' ? randomFrom(POLLEN_COLORS) :
        pType === 'seed' ? randomFrom(SEED_COLORS) :
        randomFrom(POLLEN_COLORS);

      const size =
        pType === 'leaf' ? 5 + Math.random() * 9 :
        pType === 'pollen' ? 1.5 + Math.random() * 2.5 :
        pType === 'seed' ? 3 + Math.random() * 5 :
        1 + Math.random() * 2;

      return {
        x: Math.random() * W,
        y: randomY ? Math.random() * H : -size * 2,
        vx: (Math.random() - 0.5) * 0.4,
        vy: pType === 'pollen' || pType === 'spore' ? 0.08 + Math.random() * 0.25 : 0.25 + Math.random() * 0.55,
        size,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * (pType === 'leaf' ? 0.025 : 0.008),
        type: pType,
        opacity: pType === 'pollen' ? 0.15 + Math.random() * 0.35 : 0.3 + Math.random() * 0.45,
        opacitySpeed: (Math.random() - 0.5) * 0.003,
        phase: Math.random() * Math.PI * 2,
        wobble: 0.15 + Math.random() * 0.55,
        color,
      };
    };

    setSize();
    for (let i = 0; i < density; i++) particles.push(mkParticle(true));

    // Use IntersectionObserver to pause when canvas is not visible —
    // this prevents the scroll-glitch caused by animating offscreen
    const io = new IntersectionObserver(
      (entries) => { activeRef.current = entries[0].isIntersecting; },
      { threshold: 0 }
    );
    io.observe(canvas);

    let time = 0;

    const drawLeaf = (p: Particle) => {
      const [r, g, b] = p.color;
      // Body
      ctx.beginPath();
      ctx.save();
      ctx.scale(0.55, 1);
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.restore();
      ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
      ctx.fill();
      // Midrib
      ctx.strokeStyle = `rgba(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)},${p.opacity * 0.6})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(0, p.size);
      ctx.stroke();
      // Small veins
      ctx.lineWidth = 0.4;
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.3);
        ctx.lineTo(i * p.size * 0.4, p.size * 0.1);
        ctx.stroke();
      }
    };

    const drawPollen = (p: Particle) => {
      const [r, g, b] = p.color;
      // Soft glow
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2.5);
      grad.addColorStop(0, `rgba(${r},${g},${b},${p.opacity * 0.8})`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${p.opacity * 0.3})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      // Core dot
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
      ctx.fill();
    };

    const drawSeed = (p: Particle) => {
      const [r, g, b] = p.color;
      // Elongated seed body
      ctx.save();
      ctx.scale(0.35, 1);
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity * 0.85})`;
      ctx.fill();
      ctx.restore();
      // Wispy tail (like a dandelion seed)
      const tailLen = p.size * 2.8;
      const grad = ctx.createLinearGradient(0, 0, 0, -tailLen);
      grad.addColorStop(0, `rgba(${r},${g},${b},${p.opacity * 0.5})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -tailLen);
      ctx.stroke();
    };

    const drawSpore = (p: Particle) => {
      const [r, g, b] = p.color;
      // Tiny soft dot
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity * 0.5})`;
      ctx.fill();
    };

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      if (!activeRef.current) return;

      ctx.clearRect(0, 0, W, H);
      time += 0.008;

      particles.forEach((p, idx) => {
        // Physics
        p.x += p.vx + Math.sin(time * 0.7 + p.phase) * p.wobble;
        p.y += p.vy + Math.sin(time * 1.1 + p.phase * 1.3) * (p.wobble * 0.3);
        p.rotation += p.rotationSpeed;
        p.opacity += p.opacitySpeed;
        if (p.opacity > 0.75 || p.opacity < 0.08) p.opacitySpeed *= -1;

        // Respawn off-top when particle exits bottom
        if (p.y > H + p.size * 3) {
          particles[idx] = mkParticle(false);
          return;
        }
        if (p.x > W + 30) p.x = -30;
        if (p.x < -30) p.x = W + 30;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === 'leaf') drawLeaf(p);
        else if (p.type === 'pollen') drawPollen(p);
        else if (p.type === 'seed') drawSeed(p);
        else drawSpore(p);

        ctx.restore();
      });
    };

    draw();

    const onResize = () => { setSize(); };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      io.disconnect();
    };
  }, [density, type]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
