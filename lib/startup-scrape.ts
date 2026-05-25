import { readFileSync } from 'fs';
import { join } from 'path';

const MARKETPLACE_FILE = join(process.cwd(), 'public', 'marketplace.json');
const SCRAPED_FILE = join(process.cwd(), 'public', 'scraped-data.json');
const STALE_HOURS = 12;

function isStale(): boolean {
  try {
    const data = JSON.parse(readFileSync(MARKETPLACE_FILE, 'utf-8'));
    if (!data.updatedAt) return true;
    const ageH = (Date.now() - new Date(data.updatedAt).getTime()) / 3600000;
    return ageH > STALE_HOURS;
  } catch { return true; }
}

function isEmpty(): boolean {
  try {
    const data = JSON.parse(readFileSync(SCRAPED_FILE, 'utf-8'));
    return !Array.isArray(data) || data.length === 0;
  } catch { return true; }
}

export function scheduleStartupScrape() {
  const needsScrape = isStale() || isEmpty();

  if (!needsScrape) {
    const data = JSON.parse(readFileSync(MARKETPLACE_FILE, 'utf-8'));
    console.log(`[Scraper] Marketplace fresh: ${data.totalGroups} groups, skipping scrape.`);
    return;
  }

  console.log('[Scraper] Starting background scrape…');

  setTimeout(async () => {
    try {
      const ports = [3000, 3001, 3002, 3003];
      let baseUrl = 'http://localhost:3000';
      for (const port of ports) {
        try {
          const test = await fetch(`http://localhost:${port}/api/cron`, { method: 'HEAD', signal: AbortSignal.timeout(1000) });
          if (test.status < 500) { baseUrl = `http://localhost:${port}`; break; }
        } catch {}
      }

      const cronSecret = process.env.CRON_SECRET || '';
      const headers: Record<string, string> = {};
      if (cronSecret) headers['Authorization'] = `Bearer ${cronSecret}`;

      const res = await fetch(`${baseUrl}/api/cron`, { headers, signal: AbortSignal.timeout(120000) });
      const data = await res.json();
      console.log(`[Scraper] Auto-scrape complete: ${data.liveAdded ?? 0} live products, ${data.downloadedImages ?? 0} images, ${data.marketplace ?? 0} groups`);
    } catch (e: any) {
      console.error('[Scraper] Auto-scrape error:', e.message);
    }
  }, 4000);
}
