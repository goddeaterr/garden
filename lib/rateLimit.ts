/**
 * lib/rateLimit.ts — IP-based in-memory rate limiter
 *
 * Works on any Node.js host (serverless or long-running).
 * Each named "bucket" has its own counter map so routes don't
 * share counts.
 *
 * Usage:
 *   const { ok, retryAfter } = rateLimit('quote', getIP(req), 3, 60 * 60_000);
 *   if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface Entry { count: number; resetAt: number }

// Global store — persists for the lifetime of the process
const buckets = new Map<string, Map<string, Entry>>();

/**
 * Check (and increment) an IP's request count for a named bucket.
 *
 * @param bucket    Namespace, e.g. 'quote', 'auth', 'api'
 * @param ip        Client IP address
 * @param limit     Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(
  bucket: string,
  ip: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter?: number } {
  if (!buckets.has(bucket)) buckets.set(bucket, new Map());
  const store = buckets.get(bucket)!;

  const now  = Date.now();
  const key  = ip || 'unknown';
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { ok: true };
}

/**
 * Extract the real client IP from common proxy / CDN headers.
 * Works with Vercel, Cloudflare, Railway, Nginx proxy_pass, etc.
 */
export function getIP(req: Request | { headers: { get(k: string): string | null } }): string {
  const h = req.headers;
  return (
    (h.get('cf-connecting-ip'))                       || // Cloudflare
    (h.get('x-forwarded-for')?.split(',')[0].trim())  || // Nginx / proxies
    (h.get('x-real-ip'))                               || // Nginx
    (h.get('true-client-ip'))                          || // Akamai / Cloudflare Enterprise
    'unknown'
  );
}
