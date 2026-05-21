/**
 * Seed the database with 3 placeholder trees.
 * Run: npm run seed-db
 *
 * If DATABASE_URL is set, inserts into Postgres.
 * Otherwise, writes to public/trees-data.json.
 */
import { initDb, getAllTrees, createTree } from '../lib/db';
import type { Tree } from '../types';

const SEED_TREES: Tree[] = [
  {
    id: 'silver-birch',
    name: 'Silver Birch',
    latin: 'Betula pendula',
    category: 'trees',
    size: 'medium',
    price: 45,
    height: '150–200 cm',
    description: 'A graceful, fast-growing deciduous tree with distinctive white bark and delicate, weeping branches. Perfect as a specimen tree or in small groups.',
    color: '#8fa85a',
    bloom: 'April',
    care: {
      watering: 'Moderate — water deeply once a week during dry spells.',
      sunlight: 'Full sun to partial shade.',
      soil: 'Well-drained, slightly acidic. Tolerates poor soils.',
      pruning: 'Minimal. Prune only in late summer to avoid bleeding.',
      hardiness: 'Zone 2–7. Very cold-hardy.',
      spacing: '6–8 m between trees.',
      growthRate: 'Fast — 50–70 cm per year.',
      notes: '',
    },
  },
  {
    id: 'english-oak',
    name: 'English Oak',
    latin: 'Quercus robur',
    category: 'trees',
    size: 'large',
    price: 85,
    height: '200–300 cm',
    description: 'A majestic, long-lived native oak with distinctive lobed leaves and acorns. A cornerstone species for any large garden or estate planting.',
    color: '#508153',
    bloom: 'May',
    care: {
      watering: 'Low once established. Deep watering in first 2–3 years.',
      sunlight: 'Full sun preferred.',
      soil: 'Deep, well-drained loam. Tolerates clay.',
      pruning: 'Formative pruning in early years only. Minimal intervention after.',
      hardiness: 'Zone 4–8.',
      spacing: '10–15 m between trees.',
      growthRate: 'Slow–moderate — 30–40 cm per year.',
      notes: '',
    },
  },
  {
    id: 'norway-spruce',
    name: 'Norway Spruce',
    latin: 'Picea abies',
    category: 'conifer',
    size: 'small',
    price: 35,
    height: '100–150 cm',
    description: 'The classic Christmas tree — a dense, pyramid-shaped evergreen with rich green needles and a fresh forest scent. Excellent for hedging or as a focal point.',
    color: '#3d7a3f',
    bloom: 'N/A',
    care: {
      watering: 'Moderate. Drought-sensitive when young — water regularly for first 2 seasons.',
      sunlight: 'Full sun.',
      soil: 'Moist, acidic, well-drained. Avoid waterlogged soils.',
      pruning: 'None required. Remove dead branches as needed.',
      hardiness: 'Zone 3–7. Extremely cold-hardy.',
      spacing: '4–6 m between trees.',
      growthRate: 'Moderate — 30–60 cm per year.',
      notes: '',
    },
  },
];

async function seed() {
  console.log('Seeding database…');
  await initDb();

  const existing = await getAllTrees();
  if (existing.length > 0) {
    console.log(`Database already has ${existing.length} tree(s). Skipping seed.`);
    console.log('To re-seed, delete all trees first via the admin panel.');
    return;
  }

  for (const tree of SEED_TREES) {
    await createTree(tree);
    console.log(`  ✓ Created: ${tree.name}`);
  }

  console.log(`\nDone! Seeded ${SEED_TREES.length} placeholder trees.`);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
