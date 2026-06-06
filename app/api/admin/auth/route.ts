import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

import { rateLimit, getIP } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // 5 attempts per 15 minutes per IP — brute-force protection
  const ip = getIP(req);
  const { ok, retryAfter } = rateLimit('admin-auth', ip, 5, 15 * 60_000);
  if (!ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
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
