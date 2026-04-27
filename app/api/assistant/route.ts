import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { generateResponse, AssistantMessage } from '@/lib/assistant';

const MARKETPLACE_FILE = join(process.cwd(), 'public', 'marketplace.json');
const SCRAPED_FILE = join(process.cwd(), 'public', 'scraped-data.json');

function getCatalog(): any[] {
  // Prefer marketplace groups (deduplicated, cross-seller)
  try {
    const m = JSON.parse(readFileSync(MARKETPLACE_FILE, 'utf-8'));
    if (m.groups && m.groups.length > 0) return m.groups;
  } catch {}
  // Fallback to raw scraped products
  try {
    const s = JSON.parse(readFileSync(SCRAPED_FILE, 'utf-8'));
    if (Array.isArray(s) && s.length > 0) return s;
  } catch {}
  return [];
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.messages || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }
  const messages: AssistantMessage[] = body.messages
    .slice(-12)
    .filter((m: any) => m.role && typeof m.content === 'string')
    .map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant' as const, content: String(m.content).slice(0, 1000) }));

  if (messages.length === 0) return NextResponse.json({ error: 'no messages' }, { status: 400 });

  const catalog = getCatalog();
  const text = generateResponse(messages, catalog);
  return NextResponse.json({ text });
}

export async function GET() {
  return NextResponse.json({ error: 'POST only' }, { status: 405 });
}
