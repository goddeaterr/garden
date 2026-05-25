import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Tree, NewsItem } from '@/types';

const DATA_FILE = join(process.cwd(), 'public', 'trees-data.json');
const NEWS_FILE = join(process.cwd(), 'public', 'news-data.json');

// Vercel Postgres creates different variable names depending on prefix config.
// Support all common variants so it works regardless of what was set.
const DB_URL =
  process.env.DATABASE_URL_POSTGRES_URL ||
  process.env.DATABASE_URL_DATABASE_URL ||
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
function readNewsJson(): NewsItem[] {
  try { return JSON.parse(readFileSync(NEWS_FILE, 'utf-8')); } catch { return []; }
}
function writeNewsJson(items: NewsItem[]) {
  writeFileSync(NEWS_FILE, JSON.stringify(items, null, 2), 'utf-8');
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

// ─── DB pool (explicit connectionString — avoids @vercel/postgres POSTGRES_URL hardcode) ──
async function getPool() {
  const { createPool } = await import('@vercel/postgres');
  return createPool({ connectionString: DB_URL! });
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function initDb(): Promise<void> {
  if (!DB_URL) return;
  const pool = await getPool();
  await pool.sql`
    CREATE TABLE IF NOT EXISTS trees (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      latin       TEXT,
      category    TEXT NOT NULL DEFAULT 'trees',
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
    const pool = await getPool();
    await pool.sql`CREATE TABLE IF NOT EXISTS trees (id TEXT PRIMARY KEY, name TEXT NOT NULL, latin TEXT, category TEXT NOT NULL DEFAULT 'trees', size TEXT NOT NULL DEFAULT 'medium', price NUMERIC NOT NULL DEFAULT 0, height TEXT, description TEXT, image_path TEXT, color TEXT, bloom TEXT, care_json JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
    const { rows } = await pool.sql`SELECT * FROM trees ORDER BY created_at ASC`;
    return rows.map(rowToTree);
  } catch (e) {
    console.error('[db] getAllTrees error:', e);
    throw e;
  }
}

export async function getTreeById(id: string): Promise<Tree | null> {
  if (!DB_URL) return readJson().find(t => t.id === id) || null;
  const pool = await getPool();
  const { rows } = await pool.sql`SELECT * FROM trees WHERE id = ${id}`;
  return rows[0] ? rowToTree(rows[0]) : null;
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
  const pool = await getPool();
  await pool.sql`
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
  const pool = await getPool();
  const { rowCount } = await pool.sql`
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
  const pool = await getPool();
  const { rowCount } = await pool.sql`DELETE FROM trees WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}

// ─── News CRUD ────────────────────────────────────────────────────────────────
async function initNewsTable(pool: any) {
  await pool.sql`
    CREATE TABLE IF NOT EXISTS news (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      content      TEXT NOT NULL DEFAULT '',
      image_path   TEXT,
      tag          TEXT,
      published_at TIMESTAMPTZ DEFAULT NOW(),
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

function rowToNews(row: any): NewsItem {
  return {
    id: row.id,
    title: row.title,
    content: row.content || '',
    imagePath: row.image_path || undefined,
    tag: row.tag || undefined,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : new Date().toISOString(),
  };
}

export async function getAllNews(): Promise<NewsItem[]> {
  if (!DB_URL) return readNewsJson().sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  try {
    const pool = await getPool();
    await initNewsTable(pool);
    const { rows } = await pool.sql`SELECT * FROM news ORDER BY published_at DESC`;
    return rows.map(rowToNews);
  } catch (e) {
    console.error('[db] getAllNews error:', e);
    throw e;
  }
}

export async function createNews(item: NewsItem): Promise<NewsItem> {
  if (!DB_URL) {
    const items = readNewsJson();
    items.unshift(item);
    writeNewsJson(items);
    return item;
  }
  try {
    const pool = await getPool();
    await initNewsTable(pool);
    await pool.sql`
      INSERT INTO news (id, title, content, image_path, tag, published_at)
      VALUES (${item.id}, ${item.title}, ${item.content || ''}, ${item.imagePath || null}, ${item.tag || null}, ${item.publishedAt})
    `;
    return item;
  } catch (e) {
    console.error('[db] createNews error:', e);
    throw e;
  }
}

export async function updateNews(item: NewsItem): Promise<NewsItem> {
  if (!DB_URL) {
    const items = readNewsJson();
    const idx = items.findIndex(n => n.id === item.id);
    if (idx === -1) throw new Error('Not found');
    items[idx] = item;
    writeNewsJson(items);
    return item;
  }
  const pool = await getPool();
  const { rowCount } = await pool.sql`
    UPDATE news SET
      title = ${item.title}, content = ${item.content || ''},
      image_path = ${item.imagePath || null}, tag = ${item.tag || null},
      published_at = ${item.publishedAt}
    WHERE id = ${item.id}
  `;
  if (!rowCount) throw new Error('Not found');
  return item;
}

export async function deleteNews(id: string): Promise<boolean> {
  if (!DB_URL) {
    const items = readNewsJson();
    const filtered = items.filter(n => n.id !== id);
    if (filtered.length === items.length) return false;
    writeNewsJson(filtered);
    return true;
  }
  const pool = await getPool();
  const { rowCount } = await pool.sql`DELETE FROM news WHERE id = ${id}`;
  return (rowCount ?? 0) > 0;
}
