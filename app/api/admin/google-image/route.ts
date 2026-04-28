import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

function getSessionToken() {
  const t = process.env.ADMIN_TOKEN; const h = process.env.ADMIN_PASSWORD_HASH;
  if (!t || !h) return null;
  return createHash('sha256').update(`${t}:${h}:${Math.floor(Date.now() / (1000 * 60 * 60 * 4))}`).digest('hex');
}
function getPrevToken() {
  const t = process.env.ADMIN_TOKEN; const h = process.env.ADMIN_PASSWORD_HASH;
  if (!t || !h) return null;
  return createHash('sha256').update(`${t}:${h}:${Math.floor(Date.now() / (1000 * 60 * 60 * 4)) - 1}`).digest('hex');
}
function verifySession(req: NextRequest): boolean {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  return token === getSessionToken() || token === getPrevToken();
}

const GOOGLE_IMAGES_FILE = join(process.cwd(), 'public', 'plant-google-images.json');
const MARKETPLACE_FILE = join(process.cwd(), 'public', 'marketplace.json');
const BOT_UA = 'Mozilla/5.0 (compatible; PlantImageBot/1.0; +https://github.com/plantgpt)';

function readGoogleImages(): Record<string, string> {
  try { return JSON.parse(readFileSync(GOOGLE_IMAGES_FILE, 'utf-8')); } catch { return {}; }
}
function writeGoogleImages(d: Record<string, string>) {
  writeFileSync(GOOGLE_IMAGES_FILE, JSON.stringify(d, null, 2));
}
function readMarketplace(): any {
  try { return JSON.parse(readFileSync(MARKETPLACE_FILE, 'utf-8')); } catch { return { groups: [] }; }
}

// Extract the real botanical Latin name from Lithuanian canonical names
function extractLatinName(latinName: string, canonicalName: string, slug: string): string {
  if (latinName && !/[ąčęėįšųūž]/i.test(latinName) && /[A-Za-z]{3}/.test(latinName)) {
    return latinName;
  }
  // "(lot. Genus species 'Cultivar')" pattern used in Lithuanian plant names
  const lot = canonicalName?.match(/\(lot\.\s*([^)]+)\)/i);
  if (lot) return lot[1].trim();
  return slug.replace(/-/g, ' ');
}

/* ─── Free image search (no API key required) ─────────────────── */

async function searchINaturalist(name: string): Promise<string[]> {
  try {
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(name)}&limit=3&rank=species,genus,subspecies`;
    const res = await fetch(url, {
      headers: { 'User-Agent': BOT_UA },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const urls: string[] = [];
    for (const taxon of data.results || []) {
      if (taxon.default_photo?.medium_url) urls.push(taxon.default_photo.medium_url);
      for (const tp of (taxon.taxon_photos || []).slice(0, 2)) {
        if (tp.photo?.medium_url) urls.push(tp.photo.medium_url);
      }
    }
    return urls;
  } catch { return []; }
}

async function searchWikipedia(name: string): Promise<string[]> {
  try {
    const slug = name.replace(/\s+/g, '_').replace(/['"]/g, '');
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      { headers: { 'User-Agent': BOT_UA }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const urls: string[] = [];
    if (data.originalimage?.source) urls.push(data.originalimage.source);
    else if (data.thumbnail?.source) urls.push(data.thumbnail.source);
    return urls;
  } catch { return []; }
}

async function searchGBIF(name: string): Promise<string[]> {
  try {
    const sugRes = await fetch(
      `https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(name)}&limit=1`,
      { headers: { 'User-Agent': BOT_UA }, signal: AbortSignal.timeout(6000) }
    );
    if (!sugRes.ok) return [];
    const species = await sugRes.json();
    const key = species[0]?.key;
    if (!key) return [];

    const occRes = await fetch(
      `https://api.gbif.org/v1/occurrence/search?taxonKey=${key}&mediaType=StillImage&limit=10`,
      { headers: { 'User-Agent': BOT_UA }, signal: AbortSignal.timeout(8000) }
    );
    if (!occRes.ok) return [];
    const occ = await occRes.json();
    const urls: string[] = [];
    for (const result of occ.results || []) {
      for (const media of result.media || []) {
        if (media.type === 'StillImage' && media.identifier) urls.push(media.identifier);
      }
    }
    return urls;
  } catch { return []; }
}

async function findPlantImages(latinName: string): Promise<string[]> {
  // Run all three sources concurrently, iNaturalist preferred
  const [inat, wiki, gbif] = await Promise.all([
    searchINaturalist(latinName),
    searchWikipedia(latinName),
    searchGBIF(latinName),
  ]);
  // iNaturalist first (best quality), Wikipedia second, GBIF third
  return [...new Set([...inat, ...wiki, ...gbif])];
}

/* ─── Background removal ─────────────────────────────────────── */

async function removeBgFree(imageUrl: string): Promise<Buffer> {
  // Dynamic import: @imgly/background-removal-node uses ONNX runtime natively
  const { removeBackground } = await import('@imgly/background-removal-node');
  // The library can take a URL directly and returns a transparent PNG Blob
  const resultBlob = await removeBackground(imageUrl, {
    output: { format: 'image/png', quality: 1 },
  });
  return Buffer.from(await resultBlob.arrayBuffer());
}

async function removeBgAPI(imageUrl: string, apiKey: string): Promise<Buffer> {
  const formData = new FormData();
  formData.append('image_url', imageUrl);
  formData.append('size', 'preview');
  formData.append('type', 'product');
  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: formData,
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`remove.bg: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function downloadRaw(imageUrl: string): Promise<{ buffer: Buffer; ext: string }> {
  const res = await fetch(imageUrl, {
    headers: { 'User-Agent': BOT_UA },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.startsWith('image/')) throw new Error('Not an image');
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 500 || buffer.length > 10 * 1024 * 1024) throw new Error('Invalid size');
  const ext = ct.includes('png') ? '.png' : ct.includes('webp') ? '.webp' : '.jpg';
  return { buffer, ext };
}

async function processImage(imageUrl: string, slug: string): Promise<string> {
  const dir = join(process.cwd(), 'public', 'scraped-images');
  mkdirSync(dir, { recursive: true });
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '').slice(0, 40);

  const REMOVE_BG_KEY = process.env.REMOVE_BG_API_KEY;

  if (REMOVE_BG_KEY) {
    // Premium: remove.bg API (best quality, fast)
    const buf = await removeBgAPI(imageUrl, REMOVE_BG_KEY);
    const filepath = join(dir, `${safeSlug}-google.png`);
    writeFileSync(filepath, buf);
    return `/scraped-images/${safeSlug}-google.png`;
  }

  // Free: local AI background removal
  try {
    const buf = await removeBgFree(imageUrl);
    const filepath = join(dir, `${safeSlug}-google.png`);
    writeFileSync(filepath, buf);
    return `/scraped-images/${safeSlug}-google.png`;
  } catch (bgErr) {
    // Fallback: save raw image without bg removal
    const { buffer, ext } = await downloadRaw(imageUrl);
    const filename = `${safeSlug}-google${ext}`;
    writeFileSync(join(dir, filename), buffer);
    return `/scraped-images/${filename}`;
  }
}

async function processGroup(
  group: any,
  existing: Record<string, string>
): Promise<{ path?: string; query?: string; source?: string; error?: string }> {
  const query = extractLatinName(group.latinName || '', group.canonicalName || '', group.slug);
  const imageUrls = await findPlantImages(query);
  if (!imageUrls.length) return { error: 'No image found', query };

  for (const url of imageUrls) {
    try {
      const path = await processImage(url, group.slug);
      existing[group.slug] = path;
      return { path, query, source: url };
    } catch {
      // try next candidate
    }
  }
  return { error: 'All image candidates failed', query };
}

/* ─── Route handlers ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(readGoogleImages());
}

export async function DELETE(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  const existing = readGoogleImages();
  delete existing[slug];
  writeGoogleImages(existing);
  return NextResponse.json({ deleted: slug });
}

export async function POST(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  if (body.action === 'bulk') {
    const marketplace = readMarketplace();
    const existing = readGoogleImages();
    const allGroups: any[] = marketplace.groups || [];
    const unprocessed = allGroups.filter(g => !existing[g.slug]);
    const limit = Math.min(body.limit || 5, 10);
    const batch = unprocessed.slice(0, limit);

    const results: Record<string, any> = {};
    for (const group of batch) {
      results[group.slug] = await processGroup(group, existing);
    }
    writeGoogleImages(existing);
    return NextResponse.json({
      processed: batch.length,
      remaining: unprocessed.length - batch.length,
      total: allGroups.length,
      done: Object.keys(existing).length,
      results,
    });
  }

  const { slug, latinName, canonicalName } = body;
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const existing = readGoogleImages();
  const result = await processGroup({ slug, latinName, canonicalName }, existing);
  if (result.error) return NextResponse.json({ error: result.error, query: result.query }, { status: 404 });
  writeGoogleImages(existing);
  return NextResponse.json({ path: result.path, slug, query: result.query, source: result.source });
}
