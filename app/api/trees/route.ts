import { NextRequest, NextResponse } from 'next/server';
import { getAllTrees } from '@/lib/db';
import { rateLimit, getIP } from '@/lib/rateLimit';

export const revalidate = 60;

export async function GET(req: NextRequest) {
  // 120 requests per minute per IP — protects against scraping
  const { ok } = rateLimit('api-trees', getIP(req), 120, 60_000);
  if (!ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const trees = await getAllTrees();
  return NextResponse.json(trees);
}
