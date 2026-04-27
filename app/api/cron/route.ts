import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { scrapeSource, buildMarketplace, NURSERY_SOURCES, ScrapedProduct, downloadImagesForProducts } from '@/lib/scraper';

const SCRAPED_FILE = join(process.cwd(), 'public', 'scraped-data.json');
const MARKETPLACE_FILE = join(process.cwd(), 'public', 'marketplace.json');
const LOG_FILE = join(process.cwd(), 'public', 'scrape-log.json');

function readScraped(): ScrapedProduct[] {
  try { return JSON.parse(readFileSync(SCRAPED_FILE, 'utf-8')); } catch { return []; }
}
function writeScraped(scraped_products: ScrapedProduct[]) { writeFileSync(SCRAPED_FILE, JSON.stringify(scraped_products, null, 2)); }
function writeMarketplace(marketplace_data: object) { writeFileSync(MARKETPLACE_FILE, JSON.stringify(marketplace_data, null, 2)); }
function readLog() { try { return JSON.parse(readFileSync(LOG_FILE, 'utf-8')); } catch { return {}; } }
function writeLog(log_data: object) { writeFileSync(LOG_FILE, JSON.stringify(log_data, null, 2)); }

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

export async function GET(req: NextRequest) {
  const auth_header = req.headers.get('authorization');
  const cron_secret = process.env.CRON_SECRET;
  const host_name = req.headers.get('host') || '';
  const is_local = host_name.includes('localhost') || host_name.includes('127.0.0.1') || host_name.includes('192.168.');
  const is_vercel_cron = cron_secret && auth_header === `Bearer ${cron_secret}`;
  if (!is_local && !is_vercel_cron && cron_secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scrape_log = readLog() as Record<string, object>;
  const run_id = Date.now().toString();
  scrape_log[`run_${run_id}`] = { startedAt: new Date().toISOString(), status: 'running' };
  writeLog(scrape_log);

  let existing_products = readScraped();
  const existing_ids = new Set(existing_products.map(product_item => product_item.id));
  const source_results: Record<string, { found: number; added: number; downloadedImages: number; error?: string }> = {};
  let live_added = 0;
  let downloaded_images = 0;

  for (const nursery_source of NURSERY_SOURCES.filter(source_item => source_item.active)) {
    try {
      const scraped_products = await scrapeSource(nursery_source);
      const new_products = scraped_products.filter(product_item => !existing_ids.has(product_item.id));
      new_products.forEach(product_item => {
        existing_ids.add(product_item.id);
        existing_products.push(product_item);
      });

      const before_download_count = existing_products.filter(product_item => product_item.localImagePath).length;
      existing_products = await downloadImagesForProducts(existing_products, 180);
      const after_download_count = existing_products.filter(product_item => product_item.localImagePath).length;
      const source_downloaded_images = Math.max(0, after_download_count - before_download_count);

      live_added += new_products.length;
      downloaded_images += source_downloaded_images;
      source_results[nursery_source.id] = {
        found: scraped_products.length,
        added: new_products.length,
        downloadedImages: source_downloaded_images,
      };
      rebuildAndSave(existing_products);
    } catch (error_item: any) {
      source_results[nursery_source.id] = {
        found: 0,
        added: 0,
        downloadedImages: 0,
        error: error_item?.message || 'Unknown scraper error',
      };
    }
    await new Promise(resolve_item => setTimeout(resolve_item, 500));
  }

  const marketplace_groups = rebuildAndSave(existing_products);

  scrape_log[`run_${run_id}`] = {
    completedAt: new Date().toISOString(),
    status: 'done',
    liveAdded: live_added,
    downloadedImages: downloaded_images,
    totalProducts: existing_products.length,
    marketplace: marketplace_groups,
    sources: source_results,
  };
  writeLog(scrape_log);

  return NextResponse.json({
    success: true,
    liveAdded: live_added,
    downloadedImages: downloaded_images,
    totalProducts: existing_products.length,
    marketplace: marketplace_groups,
    sources: source_results,
  });
}

export async function POST(req: NextRequest) { return GET(req); }
