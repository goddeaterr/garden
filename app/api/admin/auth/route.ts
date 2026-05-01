import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const attempts: Map<string, { count: number; resetAt: number }> = new Map();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.password || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }

  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminHash || !adminToken) {
    return NextResponse.json({ error: 'Admin not configured. Set ADMIN_TOKEN and ADMIN_PASSWORD_HASH in .env.local' }, { status: 503 });
  }

  const isHashLike = /^[0-9a-f]{64}$/i.test(adminHash);
  const inputHash = createHash('sha256').update(`plantadmin:${body.password}`).digest('hex');
  const valid = isHashLike ? inputHash === adminHash : body.password === adminHash;
  if (!valid) {
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const sessionToken = createHash('sha256')
    .update(`${adminToken}:${adminHash}:${Math.floor(Date.now() / (1000 * 60 * 60 * 4))}`)
    .digest('hex');

  return NextResponse.json({ session: sessionToken });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
