import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT_DIR = join(process.cwd(), 'public', 'scraped-images');

export interface ProcessResult {
  path: string;
  strategy: 'ai-removal' | 'vignette';
  quality: 'good' | 'fallback';
}

type BgStrategy = 'white-bg' | 'light-bg' | 'complex-bg' | 'full-bleed';

interface Analysis {
  strategy: BgStrategy;
  cornerBrightness: number;
  cornerVariance: number;
}

async function analyzeImage(buffer: Buffer): Promise<Analysis> {
  const sharp = (await import('sharp')).default;
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 400;
  const h = meta.height ?? 400;

  const sz = Math.max(8, Math.min(20, Math.floor(Math.min(w, h) * 0.07)));

  const [tl, tr, bl, br] = await Promise.all([
    sharp(buffer).extract({ left: 0, top: 0, width: sz, height: sz }).removeAlpha().raw().toBuffer(),
    sharp(buffer).extract({ left: w - sz, top: 0, width: sz, height: sz }).removeAlpha().raw().toBuffer(),
    sharp(buffer).extract({ left: 0, top: h - sz, width: sz, height: sz }).removeAlpha().raw().toBuffer(),
    sharp(buffer).extract({ left: w - sz, top: h - sz, width: sz, height: sz }).removeAlpha().raw().toBuffer(),
  ]);

  function avgRGB(buf: Buffer): [number, number, number] {
    let r = 0, g = 0, b = 0;
    const n = buf.length / 3;
    for (let i = 0; i < buf.length; i += 3) { r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; }
    return [r / n, g / n, b / n];
  }

  const avgColors = [tl, tr, bl, br].map(avgRGB);
  const brightnesses = avgColors.map(([r, g, b]) => (r + g + b) / 3);
  const avgBrightness = brightnesses.reduce((a, x) => a + x, 0) / 4;

  // Variance of brightness across corners — high variance = plant fills corners
  const bMean = avgBrightness;
  const cornerVariance = brightnesses.reduce((acc, b) => acc + (b - bMean) ** 2, 0) / 4;

  let strategy: BgStrategy;
  if (cornerVariance < 150 && avgBrightness > 225) strategy = 'white-bg';
  else if (cornerVariance < 400 && avgBrightness > 170) strategy = 'light-bg';
  else if (cornerVariance < 800) strategy = 'complex-bg';
  else strategy = 'full-bleed'; // corners wildly different — plant reaches every edge

  return { strategy, cornerBrightness: avgBrightness, cornerVariance };
}

function buildRadialVignetteMask(w: number, h: number): Buffer {
  const buf = Buffer.alloc(w * h * 4);
  const cx = w / 2, cy = h / 2;
  // Elliptical, covers ~95% of width/height as fully opaque
  const rx = w * 0.47, ry = h * 0.47;
  const fadeStart = 0.60, fadeEnd = 1.0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let alpha: number;
      if (dist <= fadeStart) alpha = 255;
      else if (dist >= fadeEnd) alpha = 0;
      else alpha = Math.round(255 * (1 - (dist - fadeStart) / (fadeEnd - fadeStart)));
      const i = (y * w + x) * 4;
      buf[i] = 255; buf[i + 1] = 255; buf[i + 2] = 255; buf[i + 3] = alpha;
    }
  }
  return buf;
}

async function applyVignette(buffer: Buffer): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 400;
  const h = meta.height ?? 400;

  const maskRaw = buildRadialVignetteMask(w, h);
  const maskPng = await sharp(maskRaw, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();

  return sharp(buffer)
    .ensureAlpha()
    .composite([{ input: maskPng, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function removeBackgroundAI(srcBuffer: Buffer): Promise<Buffer> {
  // AI removal requires the ONNX runtime — not available on Vercel lambdas
  if (process.env.VERCEL) throw new Error('AI removal skipped on Vercel');
  const sharp = (await import('sharp')).default;
  const { removeBackground } = await import('@imgly/background-removal-node');

  // Normalize to PNG so the library gets an unambiguous format
  const pngBuffer = await sharp(srcBuffer).png().toBuffer();
  const blob = new Blob([new Uint8Array(pngBuffer)], { type: 'image/png' });
  const result = await removeBackground(blob, { output: { format: 'image/png', quality: 1 } });
  return Buffer.from(await result.arrayBuffer());
}

async function validateRemoval(buffer: Buffer): Promise<boolean> {
  const sharp = (await import('sharp')).default;
  const raw = await sharp(buffer).ensureAlpha().raw().toBuffer();
  let opaque = 0;
  for (let i = 3; i < raw.length; i += 4) if (raw[i] > 64) opaque++;
  const ratio = opaque / (raw.length / 4);
  // Good removal: plant takes 3%–88% of frame
  return ratio > 0.03 && ratio < 0.88;
}

export async function processPlantImage(
  imageSource: string,
  slug: string,
): Promise<ProcessResult> {
  mkdirSync(OUT_DIR, { recursive: true });

  let srcBuffer: Buffer;
  if (imageSource.startsWith('http')) {
    const res = await fetch(imageSource, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${imageSource}`);
    srcBuffer = Buffer.from(await res.arrayBuffer());
  } else {
    srcBuffer = readFileSync(imageSource);
  }

  const safeSlug = slug.replace(/[^a-z0-9-]/g, '').slice(0, 50);
  const outFile = join(OUT_DIR, `${safeSlug}-builder.png`);
  const publicPath = `/scraped-images/${safeSlug}-builder.png`;

  const analysis = await analyzeImage(srcBuffer);
  console.log(`[Processor] ${slug}: ${analysis.strategy} (brightness=${analysis.cornerBrightness.toFixed(0)}, variance=${analysis.cornerVariance.toFixed(0)})`);

  try {
    const removed = await removeBackgroundAI(srcBuffer);
    if (await validateRemoval(removed)) {
      writeFileSync(outFile, removed);
      return { path: publicPath, strategy: 'ai-removal', quality: 'good' };
    }
    console.log(`[Processor] ${slug}: AI removal failed validation, using vignette`);
  } catch (e: any) {
    console.log(`[Processor] ${slug}: AI removal error (${e.message}), using vignette`);
  }

  const vignetted = await applyVignette(srcBuffer);
  writeFileSync(outFile, vignetted);
  return { path: publicPath, strategy: 'vignette', quality: 'fallback' };
}
