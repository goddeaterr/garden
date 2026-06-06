/**
 * lib/db.ts — portable database layer
 *
 * Uses the standard `pg` (node-postgres) driver, which works with any
 * PostgreSQL provider: Neon, Supabase, Railway, Render, DigitalOcean,
 * plain VPS, or local Postgres.
 *
 * Connection string env var — checked in priority order:
 *   DATABASE_URL           ← recommended for all providers
 *   POSTGRES_URL           ← Vercel / Neon variant
 *   POSTGRES_PRISMA_URL    ← Vercel / Neon variant
 *   NEON_DATABASE_URL      ← direct Neon
 *   DATABASE_URL_POSTGRES_URL / DATABASE_URL_URL  ← legacy Vercel prefix
 *
 * SSL:
 *   Enabled automatically for non-localhost connections (required by Neon,
 *   Supabase, Railway, etc.). Set DATABASE_SSL=false in .env to disable
 *   (useful when connecting to a local Postgres without SSL).
 *
 * Local dev fallback:
 *   When no DATABASE_URL is set, reads/writes JSON files in public/:
 *     public/trees-data.json
 *     public/news-data.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Pool as PgPool } from 'pg';
import type { Tree, NewsItem } from '@/types';

// ─── Resolve connection string ────────────────────────────────────────────────
const DB_URL =
  process.env.DATABASE_URL           ||
  process.env.POSTGRES_URL           ||
  process.env.POSTGRES_PRISMA_URL    ||
  process.env.NEON_DATABASE_URL      ||
  process.env.DATABASE_URL_POSTGRES_URL ||
  process.env.DATABASE_URL_URL;

// ─── Singleton pool — reuse across hot-reloads / invocations ─────────────────
let _pool: PgPool | null = null;

function getPool(): PgPool {
  if (_pool) return _pool;

  const { Pool } = require('pg') as typeof import('pg');

  const isLocalhost =
    !DB_URL ||
    DB_URL.includes('localhost') ||
    DB_URL.includes('127.0.0.1');

  const sslDisabled = process.env.DATABASE_SSL === 'false';

  _pool = new Pool({
    connectionString: DB_URL,
    // Enable SSL for remote hosts unless explicitly disabled.
    // rejectUnauthorized:false accepts self-signed certs (Neon, Railway, etc.)
    ssl: sslDisabled || isLocalhost ? false : { rejectUnauthorized: false },
    max: 5,                // max connections in pool
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // Log connection errors without crashing the process
  _pool.on('error', (err) => {
    console.error('[db] pool error:', err.message);
  });

  return _pool;
}

// ─── JSON fallback paths (local dev / no DATABASE_URL) ───────────────────────
const DATA_FILE = join(process.cwd(), 'public', 'trees-data.json');
const NEWS_FILE = join(process.cwd(), 'public', 'news-data.json');

function emptyCare() {
  return {
    watering: '', sunlight: '', soil: '', pruning: '',
    hardiness: '', spacing: '', growthRate: '', notes: '',
  };
}

function readJson(): Tree[] {
  try {
    const trees = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
    if (Array.isArray(trees) && trees.length > 0) return trees;
  } catch {}
  return [];
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

// ─── Row mappers ──────────────────────────────────────────────────────────────
function rowToTree(row: any): Tree {
  return {
    id:          row.id,
    name:        row.name,
    latin:       row.latin       || '',
    category:    row.category,
    size:        row.size,
    price:       Number(row.price),
    height:      row.height      || '',
    description: row.description || '',
    imagePath:   row.image_path  || undefined,
    color:       row.color       || '#508153',
    bloom:       row.bloom       || undefined,
    care:        row.care_json   ?? emptyCare(),
  };
}

function rowToNews(row: any): NewsItem {
  return {
    id:          row.id,
    title:       row.title,
    content:     row.content     || '',
    imagePath:   row.image_path  || undefined,
    tag:         row.tag         || undefined,
    publishedAt: row.published_at
      ? new Date(row.published_at).toISOString()
      : new Date().toISOString(),
  };
}

// ─── Schema DDL (idempotent) ──────────────────────────────────────────────────
const CREATE_TREES = `
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

const CREATE_NEWS = `
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

// ─── Trees CRUD ───────────────────────────────────────────────────────────────
export async function initDb(): Promise<void> {
  if (!DB_URL) return;
  const pool = getPool();
  await pool.query(CREATE_TREES);
}

export async function getAllTrees(): Promise<Tree[]> {
  if (!DB_URL) return readJson();
  try {
    const pool = getPool();
    await pool.query(CREATE_TREES);
    const { rows } = await pool.query(
      'SELECT * FROM trees ORDER BY created_at ASC'
    );
    return rows.map(rowToTree);
  } catch (e) {
    console.error('[db] getAllTrees error:', e);
    return readJson();
  }
}

export async function getTreeById(id: string): Promise<Tree | null> {
  if (!DB_URL) return readJson().find(t => t.id === id) || null;
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM trees WHERE id = $1',
    [id]
  );
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
  const pool = getPool();
  await pool.query(
    `INSERT INTO trees
       (id, name, latin, category, size, price, height, description,
        image_path, color, bloom, care_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      tree.id, tree.name, tree.latin || '', tree.category, tree.size,
      tree.price, tree.height || '', tree.description || '',
      tree.imagePath || null, tree.color || '#508153',
      tree.bloom || null, JSON.stringify(tree.care || {}),
    ]
  );
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
  const pool = getPool();
  const { rowCount } = await pool.query(
    `UPDATE trees SET
       name=$1, latin=$2, category=$3, size=$4, price=$5,
       height=$6, description=$7, image_path=$8, color=$9,
       bloom=$10, care_json=$11, updated_at=NOW()
     WHERE id=$12`,
    [
      tree.name, tree.latin || '', tree.category, tree.size, tree.price,
      tree.height || '', tree.description || '', tree.imagePath || null,
      tree.color || '#508153', tree.bloom || null,
      JSON.stringify(tree.care || {}), tree.id,
    ]
  );
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
  const pool = getPool();
  const { rowCount } = await pool.query(
    'DELETE FROM trees WHERE id = $1',
    [id]
  );
  return (rowCount ?? 0) > 0;
}

// ─── News CRUD ────────────────────────────────────────────────────────────────
async function ensureNewsTable(): Promise<void> {
  const pool = getPool();
  await pool.query(CREATE_NEWS);
}

export async function getAllNews(): Promise<NewsItem[]> {
  if (!DB_URL) {
    return readNewsJson().sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }
  try {
    const pool = getPool();
    await ensureNewsTable();
    const { rows } = await pool.query(
      'SELECT * FROM news ORDER BY published_at DESC'
    );
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
    const pool = getPool();
    await ensureNewsTable();
    await pool.query(
      `INSERT INTO news (id, title, content, image_path, tag, published_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        item.id, item.title, item.content || '',
        item.imagePath || null, item.tag || null, item.publishedAt,
      ]
    );
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
  const pool = getPool();
  const { rowCount } = await pool.query(
    `UPDATE news SET
       title=$1, content=$2, image_path=$3, tag=$4, published_at=$5
     WHERE id=$6`,
    [
      item.title, item.content || '',
      item.imagePath || null, item.tag || null,
      item.publishedAt, item.id,
    ]
  );
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
  const pool = getPool();
  const { rowCount } = await pool.query(
    'DELETE FROM news WHERE id = $1',
    [id]
  );
  return (rowCount ?? 0) > 0;
}
