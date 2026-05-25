import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const MARKETPLACE_FILE = join(process.cwd(), 'public', 'marketplace.json');
const BUILDER_IMAGES_FILE = join(process.cwd(), 'public', 'plant-builder-images.json');

function readJson(path: string, fallback: any) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch { return fallback; }
}

function getImageSource(group: any): string | null {
  const localPath =
    group.offers?.find((o: any) => o.localImagePath)?.localImagePath || null;
  if (localPath) return join(process.cwd(), 'public', localPath.replace(/^\//, ''));

  const imageUrl =
    group.offers?.find((o: any) => o.imageUrl)?.imageUrl || null;
  return imageUrl;
}

export async function syncCatalogImages(): Promise<void> {
  const marketplace = readJson(MARKETPLACE_FILE, { groups: [] });
  const groups: any[] = marketplace.groups || [];
  if (!groups.length) {
    console.log('[CatalogSync] No marketplace data yet, skipping.');
    return;
  }

  const builderImages = readJson(BUILDER_IMAGES_FILE, {});

  const toProcess = groups.filter(g => {
    if (builderImages[g.slug]) return false;
    return !!getImageSource(g);
  });

  if (!toProcess.length) {
    console.log('[CatalogSync] All catalog plants already processed.');
    return;
  }

  console.log(`[CatalogSync] Starting — ${toProcess.length} plants to process from catalog images.`);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { processPlantImage } = require('./plantImageProcessor');

  for (const group of toProcess) {
    const source = getImageSource(group);
    if (!source) continue;

    try {
      const result = await processPlantImage(source, group.slug);
      // Re-read each time to avoid stomping concurrent writes
      const current: Record<string, string> = readJson(BUILDER_IMAGES_FILE, {});
      current[group.slug] = result.path;
      writeFileSync(BUILDER_IMAGES_FILE, JSON.stringify(current, null, 2));
      console.log(`[CatalogSync] ✓ ${group.slug} → ${result.strategy}`);
    } catch (e: any) {
      console.error(`[CatalogSync] ✗ ${group.slug}: ${e.message}`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log('[CatalogSync] Done.');
}
