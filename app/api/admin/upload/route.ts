import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getSessionToken() {
  const t = process.env.ADMIN_TOKEN; const h = process.env.ADMIN_PASSWORD_HASH;
  if (!t || !h) return null;
  return createHash('sha256').update(`${t}:${h}:${Math.floor(Date.now() / (1000 * 60 * 60 * 4))}`).digest('hex');
}

function verifySession(req: NextRequest): boolean {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  const valid = getSessionToken();
  if (!valid) return false;
  const prev = createHash('sha256').update(`${process.env.ADMIN_TOKEN}:${process.env.ADMIN_PASSWORD_HASH}:${Math.floor(Date.now() / (1000 * 60 * 60 * 4)) - 1}`).digest('hex');
  return token === valid || token === prev;
}

export async function POST(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  const file = form.get('file') as File | null;
  const treeId = form.get('treeId') as string | null;
  if (!file || !treeId) return NextResponse.json({ error: 'Missing file or treeId' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  if (!/^[a-z0-9-]{1,40}$/.test(treeId)) return NextResponse.json({ error: 'Invalid tree ID' }, { status: 400 });
  const ext = extname(file.name).toLowerCase() || '.png';
  const filename = `${treeId}${ext}`;
  const dir = join(process.cwd(), 'public', 'trees');
  mkdirSync(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(join(dir, filename), buffer);
  return NextResponse.json({ path: `/trees/${filename}` });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
