import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_FILE = join(process.cwd(), 'public', 'trees-data.json');

function getSessionToken() {
  const adminToken = process.env.ADMIN_TOKEN;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminToken || !adminHash) return null;
  return createHash('sha256')
    .update(`${adminToken}:${adminHash}:${Math.floor(Date.now() / (1000 * 60 * 60 * 4))}`)
    .digest('hex');
}

function verifySession(req: NextRequest): boolean {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  const valid = getSessionToken();
  if (!valid) return false;
  // Also accept previous window
  const prev = createHash('sha256')
    .update(`${process.env.ADMIN_TOKEN}:${process.env.ADMIN_PASSWORD_HASH}:${Math.floor(Date.now() / (1000 * 60 * 60 * 4)) - 1}`)
    .digest('hex');
  return token === valid || token === prev;
}

function readTrees(): any[] {
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf-8')); } catch { return []; }
}

function writeTrees(trees: any[]) {
  writeFileSync(DATA_FILE, JSON.stringify(trees, null, 2), 'utf-8');
}

function sanitizeTree(data: any): any {
  const allowed = ['id','name','latin','category','size','price','height','description','color','bloom','imagePath','care'];
  const out: any = {};
  for (const key of allowed) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  if (typeof out.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(out.id)) throw new Error('Invalid id');
  if (typeof out.name !== 'string' || out.name.length > 100) throw new Error('Invalid name');
  if (!['fruit','decorative','evergreen','shrub'].includes(out.category)) throw new Error('Invalid category');
  if (!['small','medium','large'].includes(out.size)) throw new Error('Invalid size');
  out.price = Number(out.price);
  if (isNaN(out.price) || out.price < 0 || out.price > 99999) throw new Error('Invalid price');
  // Sanitize strings
  for (const k of ['name','latin','height','description','color','bloom']) {
    if (out[k]) out[k] = String(out[k]).slice(0, 500).replace(/[<>]/g, '');
  }
  // Validate care object
  const careKeys = ['watering','sunlight','soil','pruning','hardiness','spacing','growthRate','notes'];
  if (out.care && typeof out.care === 'object') {
    const care: any = {};
    for (const k of careKeys) {
      care[k] = String(out.care[k] || '').slice(0, 500).replace(/[<>]/g, '');
    }
    out.care = care;
  }
  // SVG is never accepted from user — custom trees use imagePath only
  out.svg = `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="280" fill="none"/><text x="100" y="140" text-anchor="middle" fill="${out.color || '#508153'}" font-size="60">🌳</text></svg>`;
  return out;
}

export async function GET(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(readTrees());
}

export async function POST(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  try {
    const tree = sanitizeTree(body);
    const trees = readTrees();
    if (trees.some((t: any) => t.id === tree.id)) return NextResponse.json({ error: 'ID already exists' }, { status: 409 });
    trees.push(tree);
    writeTrees(trees);
    return NextResponse.json(tree, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  try {
    const tree = sanitizeTree(body);
    const trees = readTrees();
    const idx = trees.findIndex((t: any) => t.id === tree.id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    trees[idx] = tree;
    writeTrees(trees);
    return NextResponse.json(tree);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id || !/^[a-z0-9-]{1,40}$/.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const trees = readTrees();
  const filtered = trees.filter((t: any) => t.id !== id);
  if (filtered.length === trees.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  writeTrees(filtered);
  return NextResponse.json({ deleted: id });
}
