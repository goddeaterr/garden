import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { scrapeSource, buildMarketplace, NURSERY_SOURCES, ScrapedProduct, downloadImagesForProducts } from '@/lib/scraper';

const SCRAPED_FILE = join(process.cwd(), 'public', 'scraped-data.json');
const MARKETPLACE_FILE = join(process.cwd(), 'public', 'marketplace.json');
const LOG_FILE = join(process.cwd(), 'public', 'scrape-log.json');
const LOCK_FILE = join(process.cwd(), 'public', 'scrape.lock');
const LOCK_MAX_AGE_MS = 20 * 60 * 1000;

let in_memory_scrape_running = false;

interface SourceRunResult {
  found: number;
  added: number;
  updated: number;
  unchanged: number;
  stale: number;
  downloadedImages: number;
  durationMs: number;
  error?: string;
}

function readScraped(): ScrapedProduct[] {
  try { return JSON.parse(readFileSync(SCRAPED_FILE, 'utf-8')); } catch { return []; }
}
function atomicWriteJson(file_path: string, data: object) {
  const tmp_path = `${file_path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp_path, JSON.stringify(data, null, 2));
  renameSync(tmp_path, file_path);
  console.log(`[Cron] Wrote ${file_path}`);
}
function writeScraped(scraped_products: ScrapedProduct[]) { atomicWriteJson(SCRAPED_FILE, scraped_products); }
function writeMarketplace(marketplace_data: object) { atomicWriteJson(MARKETPLACE_FILE, marketplace_data); }
function readLog() { try { return JSON.parse(readFileSync(LOG_FILE, 'utf-8')); } catch { return {}; } }
function writeLog(log_data: object) { atomicWriteJson(LOG_FILE, log_data); }

function canStartRun() {
  if (in_memory_scrape_running) return { ok: false, reason: 'A scrape is already running in this server process.' };
  if (!existsSync(LOCK_FILE)) return { ok: true };

  try {
    const lock_data = JSON.parse(readFileSync(LOCK_FILE, 'utf-8'));
    const age_ms = Date.now() - new Date(lock_data.startedAt).getTime();
    if (age_ms < LOCK_MAX_AGE_MS) {
      return { ok: false, reason: `A scrape started ${Math.round(age_ms / 1000)}s ago and still holds the lock.` };
    }
    console.log(`[Cron] Existing scrape lock is stale (${Math.round(age_ms / 1000)}s old), replacing it.`);
  } catch {
    console.log('[Cron] Existing scrape lock could not be parsed, replacing it.');
  }
  return { ok: true };
}

function acquireLock(run_id: string) {
  in_memory_scrape_running = true;
  atomicWriteJson(LOCK_FILE, { runId: run_id, startedAt: new Date().toISOString(), pid: process.pid });
  console.log(`[Cron] Acquired scrape lock for run ${run_id}`);
}

function releaseLock(run_id: string) {
  in_memory_scrape_running = false;
  try {
    if (!existsSync(LOCK_FILE)) return;
    const lock_data = JSON.parse(readFileSync(LOCK_FILE, 'utf-8'));
    if (lock_data.runId === run_id) {
      unlinkSync(LOCK_FILE);
      console.log(`[Cron] Released scrape lock for run ${run_id}`);
    }
  } catch (error_item: any) {
    console.log(`[Cron] Could not release scrape lock: ${error_item?.message || 'unknown error'}`);
  }
}

function rebuildAndSave(scraped_products: ScrapedProduct[]) {
  writeScraped(scraped_products);
  const marketplace_groups = buildMarketplace(scraped_products);
  writeMarketplace({
    updatedAt: new Date().toISOString(),
    totalProducts: scraped_products.length,
    totalGroups: marketplace_groups.length,
    groups: marketplace_groups,
  });
  return marketplace_groups.length;
}

function productsAreDifferent(existing_product: ScrapedProduct, scraped_product: ScrapedProduct) {
  return existing_product.title !== scraped_product.title
    || existing_product.latinName !== scraped_product.latinName
    || existing_product.category !== scraped_product.category
    || existing_product.height !== scraped_product.height
    || existing_product.potSize !== scraped_product.potSize
    || existing_product.price !== scraped_product.price
    || existing_product.originalPrice !== scraped_product.originalPrice
    || existing_product.stockStatus !== scraped_product.stockStatus
    || existing_product.description !== scraped_product.description
    || JSON.stringify(existing_product.imageUrls || []) !== JSON.stringify(scraped_product.imageUrls || []);
}

function mergeSourceProducts(existing_products: ScrapedProduct[], scraped_products: ScrapedProduct[], source_id: string, now_iso: string) {
  const products_by_id = new Map(existing_products.map((product_item, index) => [product_item.id, { product: product_item, index }]));
  const seen_ids = new Set(scraped_products.map(product_item => product_item.id));
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  let stale = 0;

  for (const scraped_product of scraped_products) {
    const existing_match = products_by_id.get(scraped_product.id);
    if (!existing_match) {
      existing_products.push({ ...scraped_product, lastSeenAt: now_iso });
      added++;
      console.log(`[Cron:merge] ADD ${scraped_product.id}: ${scraped_product.title} (${scraped_product.price} EUR)`);
      continue;
    }

    const existing_product = existing_match.product;
    const changed = productsAreDifferent(existing_product, scraped_product);
    existing_products[existing_match.index] = {
      ...existing_product,
      ...scraped_product,
      status: existing_product.status === 'rejected' ? 'rejected' : scraped_product.status,
      localImagePath: existing_product.localImagePath,
      bgRemoved: existing_product.bgRemoved,
      lastSeenAt: now_iso,
      missingSince: undefined,
      missingCount: 0,
    };

    if (changed) {
      updated++;
      console.log(`[Cron:merge] UPDATE ${scraped_product.id}: ${scraped_product.title} (${existing_product.price} -> ${scraped_product.price} EUR, stock ${existing_product.stockStatus} -> ${scraped_product.stockStatus})`);
    } else {
      unchanged++;
      console.log(`[Cron:merge] OK ${scraped_product.id}: ${scraped_product.title}`);
    }
  }

  for (let product_index = 0; product_index < existing_products.length; product_index++) {
    const existing_product = existing_products[product_index];
    if (existing_product.sourceSite !== source_id) continue;
    if (existing_product.status === 'rejected') continue;
    if (seen_ids.has(existing_product.id)) continue;

    const missing_count = (existing_product.missingCount || 0) + 1;
    existing_products[product_index] = {
      ...existing_product,
      stockStatus: 'out_of_stock',
      missingSince: existing_product.missingSince || now_iso,
      missingCount: missing_count,
    };
    stale++;
    console.log(`[Cron:merge] STALE ${existing_product.id}: ${existing_product.title} missing from ${source_id}; marked out_of_stock (missingCount=${missing_count})`);
  }

  return { products: existing_products, added, updated, unchanged, stale };
}

export async function GET(req: NextRequest) {
  const auth_header = req.headers.get('authorization');
  const cron_secret = process.env.CRON_SECRET;
  const host_name = req.headers.get('host') || '';
  const is_local = host_name.includes('localhost') || host_name.includes('127.0.0.1') || host_name.includes('192.168.');
  const is_vercel_cron = cron_secret && auth_header === `Bearer ${cron_secret}`;
  if (!is_local && !is_vercel_cron && cron_secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const run_id = Date.now().toString();
  const start_ms = Date.now();
  const lock_status = canStartRun();
  if (!lock_status.ok) {
    console.log(`[Cron] Refusing run ${run_id}: ${lock_status.reason}`);
    return NextResponse.json({ error: 'Scrape already running', detail: lock_status.reason }, { status: 409 });
  }

  acquireLock(run_id);
  const scrape_log = readLog() as Record<string, object>;
  scrape_log[`run_${run_id}`] = { startedAt: new Date().toISOString(), status: 'running', message: 'Scrape run started' };
  writeLog(scrape_log);
  console.log(`[Cron] Run ${run_id} started`);

  let existing_products = readScraped();
  const source_results: Record<string, SourceRunResult> = {};
  let live_added = 0;
  let live_updated = 0;
  let live_unchanged = 0;
  let live_stale = 0;
  let downloaded_images = 0;

  try {
    console.log(`[Cron] Loaded ${existing_products.length} existing scraped product(s)`);

    for (const nursery_source of NURSERY_SOURCES.filter(source_item => source_item.active)) {
      const source_start_ms = Date.now();
      console.log(`[Cron] Source ${nursery_source.id}: starting scrape`);
      try {
        const scraped_products = await scrapeSource(nursery_source);
        console.log(`[Cron] Source ${nursery_source.id}: scrape returned ${scraped_products.length} product(s)`);

        const merged_result = mergeSourceProducts(existing_products, scraped_products, nursery_source.id, new Date().toISOString());
        existing_products = merged_result.products;

        const before_download_count = existing_products.filter(product_item => product_item.localImagePath).length;
        existing_products = await downloadImagesForProducts(existing_products, 500);
        const after_download_count = existing_products.filter(product_item => product_item.localImagePath).length;
        const source_downloaded_images = Math.max(0, after_download_count - before_download_count);

        live_added += merged_result.added;
        live_updated += merged_result.updated;
        live_unchanged += merged_result.unchanged;
        live_stale += merged_result.stale;
        downloaded_images += source_downloaded_images;
        source_results[nursery_source.id] = {
          found: scraped_products.length,
          added: merged_result.added,
          updated: merged_result.updated,
          unchanged: merged_result.unchanged,
          stale: merged_result.stale,
          downloadedImages: source_downloaded_images,
          durationMs: Date.now() - source_start_ms,
        };

        const groups_after_source = rebuildAndSave(existing_products);
        console.log(`[Cron] Source ${nursery_source.id}: saved progress with ${existing_products.length} product(s), ${groups_after_source} marketplace group(s)`);
      } catch (error_item: any) {
        source_results[nursery_source.id] = {
          found: 0,
          added: 0,
          updated: 0,
          unchanged: 0,
          stale: 0,
          downloadedImages: 0,
          durationMs: Date.now() - source_start_ms,
          error: error_item?.message || 'Unknown scraper error',
        };
        console.log(`[Cron] Source ${nursery_source.id}: error ${error_item?.message || 'unknown scraper error'}`);
      }
      await new Promise(resolve_item => setTimeout(resolve_item, 500));
    }

    const marketplace_groups = rebuildAndSave(existing_products);
    const duration_ms = Date.now() - start_ms;

    scrape_log[`run_${run_id}`] = {
      completedAt: new Date().toISOString(),
      status: 'done',
      durationMs: duration_ms,
      liveAdded: live_added,
      liveUpdated: live_updated,
      liveUnchanged: live_unchanged,
      liveStale: live_stale,
      downloadedImages: downloaded_images,
      totalProducts: existing_products.length,
      marketplace: marketplace_groups,
      sources: source_results,
    };
    writeLog(scrape_log);
    console.log(`[Cron] Run ${run_id} complete in ${duration_ms}ms: added=${live_added}, updated=${live_updated}, unchanged=${live_unchanged}, stale=${live_stale}, images=${downloaded_images}, total=${existing_products.length}, groups=${marketplace_groups}`);

    return NextResponse.json({
      success: true,
      durationMs: duration_ms,
      liveAdded: live_added,
      liveUpdated: live_updated,
      liveUnchanged: live_unchanged,
      liveStale: live_stale,
      downloadedImages: downloaded_images,
      totalProducts: existing_products.length,
      marketplace: marketplace_groups,
      sources: source_results,
    });
  } catch (error_item: any) {
    scrape_log[`run_${run_id}`] = {
      completedAt: new Date().toISOString(),
      status: 'error',
      error: error_item?.message || 'Unknown cron error',
      sources: source_results,
    };
    writeLog(scrape_log);
    console.log(`[Cron] Run ${run_id} failed: ${error_item?.message || 'unknown cron error'}`);
    return NextResponse.json({ error: error_item?.message || 'Unknown cron error' }, { status: 500 });
  } finally {
    releaseLock(run_id);
  }
}

export async function POST(req: NextRequest) { return GET(req); }
