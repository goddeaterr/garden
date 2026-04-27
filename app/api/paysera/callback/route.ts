import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    if (!body || body.length > 10000) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const params = new URLSearchParams(body);
    const status = params.get('status');
    const orderId = params.get('orderid');
    if (!orderId || !/^PH-\d+-[A-Z0-9]+$/.test(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }
    console.log(`Paysera callback: order=${orderId} status=${status}`);
    return new NextResponse('OK', { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
