import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

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

const SCRAPED_FILE = join(process.cwd(), 'public', 'scraped-data.json');
function readScraped() { try { return JSON.parse(readFileSync(SCRAPED_FILE, 'utf-8')); } catch { return []; } }
function writeScraped(d: any[]) { writeFileSync(SCRAPED_FILE, JSON.stringify(d, null, 2)); }

export async function POST(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.imageUrl || !body?.productId) return NextResponse.json({ error: 'imageUrl and productId required' }, { status: 400 });

  const { imageUrl, productId } = body;

  // Validate imageUrl
  let parsed: URL;
  try { parsed = new URL(imageUrl); } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }
  if (!['http:', 'https:'].includes(parsed.protocol)) return NextResponse.json({ error: 'HTTP/S only' }, { status: 400 });

  const REMOVE_BG_KEY = process.env.REMOVE_BG_API_KEY;
  const dir = join(process.cwd(), 'public', 'scraped-images');
  mkdirSync(dir, { recursive: true });

  const safeId = productId.replace(/[^a-z0-9-]/g, '').slice(0, 40);

  try {
    if (REMOVE_BG_KEY) {
      // Use remove.bg API
      const formData = new FormData();
      formData.append('image_url', imageUrl);
      formData.append('size', 'preview');
      formData.append('type', 'product');

      const res = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': REMOVE_BG_KEY },
        body: formData,
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`remove.bg error: ${err}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const filename = `${safeId}.png`;
      writeFileSync(join(dir, filename), buffer);
      const localPath = `/scraped-images/${filename}`;

      const data = readScraped();
      const idx = data.findIndex((p: any) => p.id === productId);
      if (idx !== -1) { data[idx].localImagePath = localPath; data[idx].bgRemoved = true; writeScraped(data); }

      return NextResponse.json({ path: localPath, bgRemoved: true });
    } else {
      // Fallback: just download the image without bg removal
      const res = await fetch(imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
      const filename = `${safeId}${ext}`;
      const buffer = Buffer.from(await res.arrayBuffer());

      if (buffer.length > 10 * 1024 * 1024) throw new Error('Image too large');

      writeFileSync(join(dir, filename), buffer);
      const localPath = `/scraped-images/${filename}`;

      const data = readScraped();
      const idx = data.findIndex((p: any) => p.id === productId);
      if (idx !== -1) { data[idx].localImagePath = localPath; data[idx].bgRemoved = false; writeScraped(data); }

      return NextResponse.json({ path: localPath, bgRemoved: false, note: 'Set REMOVE_BG_API_KEY for background removal' });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
