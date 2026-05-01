import { NextResponse } from 'next/server';
import { getAllTrees } from '@/lib/db';

export const revalidate = 60;

export async function GET() {
  const trees = await getAllTrees();
  return NextResponse.json(trees);
}
