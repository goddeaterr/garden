import {
  buildSearchQuery,
  extractLatinName,
  readBuilderImages,
  readMarketplace,
  scrapeNoBackgroundImages,
  writeBuilderImages,
} from '../lib/plantImageScraper';
import { processPlantImage } from '../lib/plantImageProcessor';

function getLimit() {
  const raw = process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1];
  const limit = Number(raw || 30);
  return Number.isFinite(limit) && limit > 0 ? limit : 30;
}

async function main() {
  const limit = getLimit();
  const marketplace = readMarketplace();
  const groups: any[] = marketplace.groups || [];
  const builderImages = readBuilderImages();
  const queue = groups.filter(group => !builderImages[group.slug]).slice(0, limit);

  console.log(`[BuilderImages] ${queue.length} plant(s) queued for Latin-name no-background search.`);

  for (const group of queue) {
    console.log(`[BuilderImages] Searching ${group.slug} (${group.latinName || group.canonicalName || 'no name'})`);
    const result = await processGroupLocally(group);

    if (result.path) {
      builderImages[group.slug] = result.path;
      writeBuilderImages(builderImages);
      console.log(`[BuilderImages] OK ${group.slug}: ${result.query} -> ${result.path}`);
    } else {
      console.log(`[BuilderImages] FAIL ${group.slug}: ${result.error || 'unknown error'} (${result.query || 'no query'})`);
    }

    await new Promise(resolve => setTimeout(resolve, 250));
  }

  console.log('[BuilderImages] Done.');
}

async function processGroupLocally(
  group: any
): Promise<{ path?: string; query?: string; source?: string; error?: string }> {
  const latinName = extractLatinName(group.latinName || '', group.canonicalName || '', group.slug);
  const query = buildSearchQuery(latinName, group.slug);
  const imageUrls = await scrapeNoBackgroundImages(query);
  if (!imageUrls.length) return { error: 'No images found', query };

  for (const url of imageUrls) {
    try {
      const result = await processPlantImage(url, group.slug);
      return { path: result.path, query, source: url };
    } catch (e: any) {
      console.log(`[BuilderImages] Candidate failed for ${group.slug}: ${e.message || e}`);
    }
  }

  return { error: 'All candidates failed', query };
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
