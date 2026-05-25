import { NextResponse } from 'next/server';
import { getAllNews } from '@/lib/db';

export async function GET() {
  try {
    const items = await getAllNews();
    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
