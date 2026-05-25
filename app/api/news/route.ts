import { NextResponse } from 'next/server';
import { getAllNews } from '@/lib/db';

// Force dynamic so Vercel never statically caches this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const items = await getAllNews();
    return NextResponse.json(items, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (e: any) {
    console.error('[api/news] GET error:', e);
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
