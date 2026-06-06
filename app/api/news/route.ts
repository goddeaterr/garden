import { NextRequest, NextResponse } from 'next/server';
import { getAllNews } from '@/lib/db';
import { rateLimit, getIP } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  // 120 requests per minute per IP
  const { ok } = rateLimit('api-news', getIP(req), 120, 60_000);
  if (!ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const items = await getAllNews();
    return NextResponse.json(items, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma':  'no-cache',
        'Expires': '0',
      },
    });
  } catch (e: any) {
    console.error('[api/news] GET error:', e);
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
  }
}
