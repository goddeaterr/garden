import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { scrapeUrl, buildMarketplace, NURSERY_SOURCES, ScrapedProduct, downloadImagesForProducts } from '@/lib/scraper';

const SCRAPED_FILE = join(process.cwd(), 'public', 'scraped-data.json');
const MARKETPLACE_FILE = join(process.cwd(), 'public', 'marketplace.json');
const LOG_FILE = join(process.cwd(), 'public', 'scrape-log.json');

function tok() {
  const t = process.env.ADMIN_TOKEN, h = process.env.ADMIN_PASSWORD_HASH;
  if (!t||!h) return null;
  return createHash('sha256').update(`${t}:${h}:${Math.floor(Date.now()/(1000*60*60*4))}`).digest('hex');
}
function prevTok() {
  const t = process.env.ADMIN_TOKEN, h = process.env.ADMIN_PASSWORD_HASH;
  if (!t||!h) return null;
  return createHash('sha256').update(`${t}:${h}:${Math.floor(Date.now()/(1000*60*60*4))-1}`).digest('hex');
}
function auth(req: NextRequest) {
  const a = req.headers.get('authorization');
  if (!a?.startsWith('Bearer ')) return false;
  const s = a.slice(7); return s===tok()||s===prevTok();
}
function read(): ScrapedProduct[] { try { return JSON.parse(readFileSync(SCRAPED_FILE,'utf-8')); } catch { return []; } }
function write(d: ScrapedProduct[]) { writeFileSync(SCRAPED_FILE, JSON.stringify(d,null,2)); }
function rebuildMarketplace(products: ScrapedProduct[]) {
  const m = buildMarketplace(products);
  writeFileSync(MARKETPLACE_FILE, JSON.stringify({ updatedAt: new Date().toISOString(), totalProducts: products.length, totalGroups: m.length, groups: m }, null, 2));
  return m;
}
function readLog() { try { return JSON.parse(readFileSync(LOG_FILE,'utf-8')); } catch { return {}; } }
function writeLog(d: any) { writeFileSync(LOG_FILE, JSON.stringify(d,null,2)); }

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error:'Unauthorized' },{status:401});
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  if (action==='sources') return NextResponse.json(NURSERY_SOURCES);
  if (action==='log') return NextResponse.json(readLog());
  if (action==='marketplace') {
    try { return NextResponse.json(JSON.parse(readFileSync(MARKETPLACE_FILE,'utf-8'))); } catch { return NextResponse.json({}); }
  }
  const status = searchParams.get('status');
  const data = read();
  const items = status ? data.filter(p=>p.status===status) : data;
  return NextResponse.json({ total: items.length, items });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error:'Unauthorized' },{status:401});
  const body = await req.json().catch(()=>null);
  if (!body) return NextResponse.json({ error:'Invalid body' },{status:400});

  if (body.action==='clear_all') { write([]); rebuildMarketplace([]); writeLog({}); return NextResponse.json({cleared:true}); }

  if (body.action==='rebuild_marketplace') {
    const data = read();
    const m = rebuildMarketplace(data);
    return NextResponse.json({ groups: m.length });
  }

  if (body.action==='update_status') {
    const data = read();
    const idx = data.findIndex(p=>p.id===body.id);
    if (idx===-1) return NextResponse.json({error:'Not found'},{status:404});
    data[idx].status = body.status;
    write(data); rebuildMarketplace(data);
    return NextResponse.json(data[idx]);
  }

  if (body.action==='scrape_all') {
    // Trigger full scrape of all active sources
    const res = await fetch(new URL('/api/cron', req.url).href, {
      method: 'GET',
      headers: { authorization: `Bearer ${process.env.CRON_SECRET||''}` },
    });
    const d = await res.json();
    return NextResponse.json(d);
  }

  if (!body.url) return NextResponse.json({error:'URL required'},{status:400});
  let parsed: URL;
  try { parsed = new URL(body.url); } catch { return NextResponse.json({error:'Invalid URL'},{status:400}); }
  if (!['http:','https:'].includes(parsed.protocol)) return NextResponse.json({error:'HTTP/S only'},{status:400});

  const log = readLog();
  log[body.url] = { startedAt: new Date().toISOString(), status:'running' };
  writeLog(log);

  try {
    const products = await scrapeUrl(body.url, body.sellerName||parsed.hostname, body.sourceSite||parsed.hostname, body.city||'', body.logo||'');
    const existing = read();
    const existingIds = new Set(existing.map(p=>p.id));
    const newOnes = products.filter(p=>!existingIds.has(p.id));
    let all = [...existing, ...newOnes];
    all = await downloadImagesForProducts(all, 500);
    write(all);
    rebuildMarketplace(all);
    log[body.url] = { completedAt: new Date().toISOString(), status:'done', found: products.length, added: newOnes.length };
    writeLog(log);
    return NextResponse.json({ found: products.length, added: newOnes.length, downloadedImages: all.filter(p => p.localImagePath).length, items: newOnes });
  } catch(e:any) {
    log[body.url] = { failedAt: new Date().toISOString(), status:'error', error: e.message };
    writeLog(log);
    return NextResponse.json({ error: e.message },{status:500});
  }
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({error:'Unauthorized'},{status:401});
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({error:'id required'},{status:400});
  const data = read().filter(p=>p.id!==id);
  write(data); rebuildMarketplace(data);
  return NextResponse.json({deleted:id});
}
