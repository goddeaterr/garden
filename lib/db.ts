import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Tree } from '@/types';

const DATA_FILE = join(process.cwd(), 'public', 'trees-data.json');

// Vercel Postgres creates different variable names depending on prefix config.
// Support all common variants so it works regardless of what was set.
const DB_URL =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.NEON_DATABASE_URL;

// ─── JSON fallback (local dev / no DATABASE_URL) ─────────────────────────────
function readJson(): Tree[] {
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf-8')); } catch { return []; }
}
function writeJson(trees: Tree[]) {
  writeFileSync(DATA_FILE, JSON.stringify(trees, null, 2), 'utf-8');
}

// ─── Row → Tree mapping ───────────────────────────────────────────────────────
function rowToTree(row: any): Tree {
  return {
    id: row.id,
    name: row.name,
    latin: row.latin || '',
    category: row.category,
    size: row.size,
    price: Number(row.price),
    height: row.height || '',
    description: row.description || '',
    imagePath: row.image_path || undefined,
    color: row.color || '#508153',
    bloom: row.bloom || undefined,
    care: row.care_json ?? { watering:'', sunlight:'', soil:'', pruning:'', hardiness:'', spacing:'', growthRate:'', notes:'' },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function initDb(): Promise<void> {
  if (!DB_URL) return;
  const { sql } = await import('@vercel/postgres');
  await sql`
    CREATE TABLE IF NOT EXISTS trees (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      latin       TEXT,
      category    TEXT NOT NULL DEFAULT 'decorative',
      size        TEXT NOT NULL DEFAULT 'medium',
      price       NUMERIC NOT NULL DEFAULT 0,
      height      TEXT,
      description TEXT,
      image_path  TEXT,
      color       TEXT,
      bloom       TEXT,
      care_json   JSONB DEFAULT '{}',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function getAllTrees(): Promise<Tree[]> {
  if (!DB_URL) return readJson();
  try {
    await initDb();
    const { sql } = await import('@vercel/postgres');
    const { rows } = await sql`SELECT * FROM trees ORDER BY created_at ASC`;
    return rows.map(rowToTree);
  } catch (e) {
    console.error('[db] getAllTrees fallback to JSON:', e);
    return readJson();
  }
}

export async function getTreeById(id: string): Promise<Tree | null> {
  if (!DB_URL) {
    return readJson().find(t => t.id === id) || null;
  }
  try {
    const { sql } = await import('@vercel/postgres');
    const { rows } = await sql`SELECT * FROM trees WHERE id = ${id}`;
    return rows[0] ? rowToTree(rows[0]) : null;
  } catch {
    return readJson().find(t => t.id === id) || null;
  }
}

export async function createTree(tree: Tree): Promise<Tree> {
  if (!DB_URL) {
    const trees = readJson();
    if (trees.some(t => t.id === tree.id)) throw new Error('ID already exists');
    trees.push(tree);
    writeJson(trees);
    return tree;
  }
  await initDb();
  const { sql } = await import('@vercel/postgres');
  await sql`
    INSERT INTO trees (id, name, latin, category, size, price, height, description, image_path, color, bloom, care_json)
    VALUES (
      ${tree.id}, ${tree.name}, ${tree.latin || ''}, ${tree.category}, ${tree.size},
      ${tree.price}, ${tree.height || ''}, ${tree.description || ''},
      ${tree.imagePath || null}, ${tree.color || '#508153'}, ${tree.bloom || null},
      ${JSON.stringify(tree.care || {})}
    )
  `;
  return tree;
}

export async function updateTree(tree: Tree): Promise<Tree> {
  if (!DB_URL) {
    const trees = readJson();
    const idx = trees.findIndex(t => t.id === tree.id);
    if (idx === -1) throw new Error('Not found');
    trees[idx] = tree;
    writeJson(trees);
    return tree;
  }
  const { sql } = await import('@vercel/postgres');
  const { rowCount } = await sql`
    UPDATE trees SET
      name = ${tree.name}, latin = ${tree.latin || ''}, category = ${tree.category},
      size = ${tree.size}, price = ${tree.price}, height = ${tree.height || ''},
      description = ${tree.description || ''}, image_path = ${tree.imagePath || null},
      color = ${tree.color || '#508153'}, bloom = ${tree.bloom || null},
      care_json = ${JSON.stringify(tree.care || {})},
      updated_at = NOW()
    WHERE id = ${tree.id}
  `;
  if (!rowCount) throw new Error('Not found');
  return tree;
}

export async function deleteTree(id: string): Promise<boolean> {
  if (!DB_URL) {
    const trees = readJson();
    const filtered = trees.filter(t => t.id !== id);
    if (filtered.length === trees.length) return false;
    writeJson(filtered);
    return true;
  }
  const { sql } = await import('@vercel/postgres');
  const { rowCount } = await sql`DELETE FROM trees WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}
