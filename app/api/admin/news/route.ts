import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getAllNews, createNews, updateNews, deleteNews } from '@/lib/db';
import type { NewsItem } from '@/types';

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
  const prev = createHash('sha256')
    .update(`${process.env.ADMIN_TOKEN}:${process.env.ADMIN_PASSWORD_HASH}:${Math.floor(Date.now() / (1000 * 60 * 60 * 4)) - 1}`)
    .digest('hex');
  return token === valid || token === prev;
}

function sanitizeNews(data: any): NewsItem {
  if (typeof data.id !== 'string' || !/^[a-z0-9-]{1,60}$/.test(data.id)) throw new Error('Invalid id');
  if (typeof data.title !== 'string' || !data.title.trim()) throw new Error('Invalid title');
  return {
    id: data.id,
    title: String(data.title).slice(0, 200).replace(/[<>]/g, ''),
    content: String(data.content || '').slice(0, 5000).replace(/<script/gi, ''),
    imagePath: data.imagePath ? String(data.imagePath).slice(0, 500) : undefined,
    tag: data.tag ? String(data.tag).slice(0, 50).replace(/[<>]/g, '') : undefined,
    publishedAt: data.publishedAt || new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await getAllNews();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  try {
    const item = sanitizeNews(body);
    const created = await createNews(item);
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  try {
    const item = sanitizeNews(body);
    const updated = await updateNews(item);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'Not found' ? 404 : 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id || !/^[a-z0-9-]{1,60}$/.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const deleted = await deleteNews(id);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ deleted: id });
}
