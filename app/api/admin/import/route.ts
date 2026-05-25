import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { normalizeToTree } from '@/lib/scraper';

const SCRAPED_FILE = join(process.cwd(), 'public', 'scraped-data.json');
const TREES_FILE = join(process.cwd(), 'public', 'trees-data.json');

function getSessionToken() {
  const t = process.env.ADMIN_TOKEN; const h = process.env.ADMIN_PASSWORD_HASH;
  if (!t || !h) return null;
  return createHash('sha256').update(`${t}:${h}:${Math.floor(Date.now() / (1000 * 60 * 60 * 4))}`).digest('hex');
}
function getPrevToken() {
  const t = process.env.ADMIN_TOKEN; const h = process.env.ADMIN_PASSWORD_HASH;
  if (!t || !h) return null;
  return createHash('sha256').update(`${t}:${h}:${Math.floor(Date.now() / (1000 * 60 * 60 * 4)) - 1}`).digest('hex');
}
function verifySession(req: NextRequest): boolean {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  return token === getSessionToken() || token === getPrevToken();
}

function readScraped() { try { return JSON.parse(readFileSync(SCRAPED_FILE, 'utf-8')); } catch { return []; } }
function writeScraped(d: any[]) { writeFileSync(SCRAPED_FILE, JSON.stringify(d, null, 2)); }
function readTrees() { try { return JSON.parse(readFileSync(TREES_FILE, 'utf-8')); } catch { return []; } }
function writeTrees(d: any[]) { writeFileSync(TREES_FILE, JSON.stringify(d, null, 2)); }

export async function POST(req: NextRequest) {
  if (!verifySession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.ids || !Array.isArray(body.ids)) return NextResponse.json({ error: 'ids array required' }, { status: 400 });

  const scraped = readScraped();
  const trees = readTrees();
  const existingIds = new Set(trees.map((t: any) => t.id));
  const imported: string[] = [];
  const errors: string[] = [];

  for (const id of body.ids.slice(0, 50)) {
    const product = scraped.find((p: any) => p.id === id);
    if (!product) { errors.push(`${id}: not found`); continue; }

    try {
      const tree = normalizeToTree(product);
      if (existingIds.has(tree.id)) {
        // Deduplicate — append suffix
        tree.id = `${tree.id}-2`;
      }
      // Validate essential fields
      if (!tree.name || !tree.price) { errors.push(`${id}: missing name or price`); continue; }
      tree.price = Math.max(0, Math.min(99999, Number(tree.price)));
      tree.name = String(tree.name).slice(0, 100);

      trees.push(tree);
      existingIds.add(tree.id);

      // Mark as imported
      const idx = scraped.findIndex((p: any) => p.id === id);
      if (idx !== -1) scraped[idx].status = 'imported';
      imported.push(id);
    } catch (e: any) {
      errors.push(`${id}: ${e.message}`);
    }
  }

  writeTrees(trees);
  writeScraped(scraped);
  return NextResponse.json({ imported: imported.length, errors, total: trees.length });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
