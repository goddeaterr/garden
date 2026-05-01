import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Old token-based routes → redirect to /admin
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin/') && pathname.split('/').length > 2) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
