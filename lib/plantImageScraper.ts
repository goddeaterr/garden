import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const BUILDER_IMAGES_FILE = join(process.cwd(), 'public', 'plant-builder-images.json');
export const MARKETPLACE_FILE = join(process.cwd(), 'public', 'marketplace.json');

const SCRAPE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export function readBuilderImages(): Record<string, string> {
  try { return JSON.parse(readFileSync(BUILDER_IMAGES_FILE, 'utf-8')); } catch { return {}; }
}

export function writeBuilderImages(d: Record<string, string>) {
  writeFileSync(BUILDER_IMAGES_FILE, JSON.stringify(d, null, 2));
}

export function readMarketplace(): any {
  try { return JSON.parse(readFileSync(MARKETPLACE_FILE, 'utf-8')); } catch { return { groups: [] }; }
}

export function extractLatinName(latinName: string, canonicalName: string, slug: string): string {
  if (latinName && !/[ąčęėįšųūž]/i.test(latinName) && /[A-Za-z]{3}/.test(latinName)) return latinName;
  const lot = canonicalName?.match(/\(lot\.\s*([^)]+)\)/i);
  if (lot) return lot[1].trim();
  return slug.replace(/-/g, ' ');
}

export function buildSearchQuery(latinName: string, slug: string): string {
  const cleanLatin = latinName
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  const fallback = slug.replace(/-/g, ' ').trim();
  return `${cleanLatin || fallback} plant no background transparent png`;
}

async function scrapeDDG(query: string): Promise<string[]> {
  try {
    const pageRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      { headers: { 'User-Agent': SCRAPE_UA, 'Accept-Language': 'en-US,en;q=0.9' }, signal: AbortSignal.timeout(10000) }
    );
    if (!pageRes.ok) return [];
    const html = await pageRes.text();
    const vqdMatch = html.match(/vqd=['"]([^'"]+)['"]/);
    if (!vqdMatch) return [];

    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(vqdMatch[1])}&p=1&f=type%3Atransparent`,
      {
        headers: { 'User-Agent': SCRAPE_UA, 'Referer': 'https://duckduckgo.com/', 'Accept': 'application/json, */*' },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!imgRes.ok) return [];
    const data = await imgRes.json();
    return (data.results || []).slice(0, 6).map((r: any) => r.image).filter(Boolean);
  } catch { return []; }
}

async function scrapeBing(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&qft=+filterui:photo-transparent&FORM=IRFLTR`,
      { headers: { 'User-Agent': SCRAPE_UA, 'Accept-Language': 'en-US,en;q=0.9' }, signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) return [];
    const html = await res.text();
    const urls: string[] = [];
    const re = /"murl":"(https?:[^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null && urls.length < 6) {
      urls.push(m[1].replace(/\\u0026/g, '&'));
    }
    return urls;
  } catch { return []; }
}

export async function scrapeNoBackgroundImages(query: string): Promise<string[]> {
  const [ddg, bing] = await Promise.all([scrapeDDG(query), scrapeBing(query)]);
  return [...new Set([...ddg, ...bing])];
}

export async function processImage(imageUrl: string, slug: string): Promise<string> {
  const dir = join(process.cwd(), 'public', 'scraped-images');
  mkdirSync(dir, { recursive: true });
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '').slice(0, 40);

  const res = await fetch(imageUrl, { headers: { 'User-Agent': SCRAPE_UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error('Not an image');
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 500 || buffer.length > 10 * 1024 * 1024) throw new Error('Invalid size');

  const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
  const filename = `${safeSlug}-builder${ext}`;
  writeFileSync(join(dir, filename), buffer);
  return `/scraped-images/${filename}`;
}

export async function processGroup(
  group: any
): Promise<{ path?: string; query?: string; source?: string; error?: string }> {
  const latinName = extractLatinName(group.latinName || '', group.canonicalName || '', group.slug);
  const query = buildSearchQuery(latinName, group.slug);
  const imageUrls = await scrapeNoBackgroundImages(query);
  if (!imageUrls.length) return { error: 'No images found', query };

  for (const url of imageUrls) {
    try {
      const path = await processImage(url, group.slug);
      return { path, query, source: url };
    } catch { /* try next */ }
  }
  return { error: 'All candidates failed', query };
}
