import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import {
  readBuilderImages,
  writeBuilderImages,
  readMarketplace,
  processGroup,
} from '@/lib/plantImageScraper';

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

export async function GET(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(readBuilderImages());
}

export async function DELETE(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  const existing = readBuilderImages();
  delete existing[slug];
  writeBuilderImages(existing);
  return NextResponse.json({ deleted: slug });
}

export async function POST(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  if (body.action === 'bulk') {
    const marketplace = readMarketplace();
    const existing = readBuilderImages();
    const allGroups: any[] = marketplace.groups || [];
    const unprocessed = allGroups.filter(g => !existing[g.slug]);
    const limit = Math.min(body.limit || 5, 10);
    const batch = unprocessed.slice(0, limit);

    const results: Record<string, any> = {};
    for (const group of batch) {
      const result = await processGroup(group);
      results[group.slug] = result;
      if (result.path) {
        existing[group.slug] = result.path;
        writeBuilderImages(existing);
      }
    }
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

  const result = await processGroup({ slug, latinName, canonicalName });
  if (result.error) return NextResponse.json({ error: result.error, query: result.query }, { status: 404 });

  const existing = readBuilderImages();
  existing[slug] = result.path!;
  writeBuilderImages(existing);
  return NextResponse.json({ path: result.path, slug, query: result.query, source: result.source });
}
