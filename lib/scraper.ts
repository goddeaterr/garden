import { createHash } from 'crypto';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { parse, HTMLElement } from 'node-html-parser';

/* ─── Types ──────────────────────────────────────────────────── */
export interface ScrapedProduct {
  id: string; scrapedAt: string; sourceUrl: string; sourceSite: string;
  sellerName: string; sellerLogo: string; sellerCity: string;
  title: string; latinName?: string; category: string;
  height?: string; potSize?: string;
  price: number; originalPrice?: number; currency: 'EUR';
  stockStatus: 'in_stock' | 'out_of_stock' | 'unknown';
  imageUrls: string[]; localImagePath?: string;
  lastSeenAt?: string; missingSince?: string; missingCount?: number; bgRemoved?: boolean;
  description?: string; status: 'active' | 'rejected';
}
export interface MarketplaceOffer {
  productId: string; sellerName: string; sellerLogo: string; sellerCity: string;
  sourceUrl: string; price: number; originalPrice?: number;
  height?: string; stockStatus: string; imageUrl?: string; localImagePath?: string; scrapedAt: string;
}
export interface MarketplaceGroup {
  slug: string; canonicalName: string; latinName?: string; category: string;
  offers: MarketplaceOffer[]; bestPrice: number; updatedAt: string;
}

/* ─── Sources — add more shops here ─────────────────────────── */
// Each source has a type: 'shopify' | 'html'
// Shopify stores expose /collections/{handle}/products.json — no auth needed
export const NURSERY_SOURCES: NurserySource[] = [
  {
    id: 'geliuukis',
    name: 'Gėliuukis',
    city: 'Klaipėda',
    baseUrl: 'https://geliuukis.lt',
    logo: 'https://geliuukis.lt/cdn/shop/files/logo.png',
    type: 'shopify',
    shopifyCollections: [
      'coniferous',
      'decorative-shrubs',
      'decorative-trees',
      'climbing-plants',
      'perennial-flowers',
    ],
    active: true,
  },
  {
    id: 'siupariu-geles',
    name: 'Šiūparių gėlių ūkis',
    city: 'Klaipėdos r.',
    baseUrl: 'https://www.siupariugeles.lt',
    logo: 'https://www.siupariugeles.lt/site/images/logo-default.png',
    type: 'html',
    catalogUrls: ['https://www.siupariugeles.lt/'],
    discoverCatalogUrls: true,
    active: true,
  },
  {
    id: 'growup',
    name: 'GrowUp',
    city: 'Kaunas',
    baseUrl: 'https://www.growup.lt',
    logo: 'https://www.growup.lt/image/cache/catalog/growup-logotipas-582x636.png',
    type: 'html',
    catalogSitemapUrls: ['https://www.growup.lt/sitemap-category.xml'],
    active: true,
  },
  // ── Add more shops here ────────────────────────────────────────────
  // Example Shopify shop:
  // { id: 'other-shop', name: 'Other Shop', city: 'Vilnius',
  //   baseUrl: 'https://othershop.lt', logo: '', type: 'shopify',
  //   shopifyCollections: ['medžiai', 'krūmai'], active: false },
  //
  // Example HTML shop:
  // { id: 'html-shop', name: 'HTML Shop', city: 'Kaunas',
  //   baseUrl: 'https://htmlshop.lt', logo: '', type: 'html',
  //   catalogUrls: ['https://htmlshop.lt/catalog'], active: false },
];

export interface NurserySource {
  id: string; name: string; city: string; baseUrl: string; logo: string;
  type: 'shopify' | 'html';
  shopifyCollections?: string[];
  catalogUrls?: string[];
  catalogSitemapUrls?: string[];
  discoverCatalogUrls?: boolean;
  active: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────── */
export function makeId(url: string, title: string): string {
  return createHash('md5').update(`${url}::${title.toLowerCase().trim()}`).digest('hex').slice(0, 14);
}

export function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/ą/g,'a').replace(/č/g,'c').replace(/ę/g,'e').replace(/ė/g,'e')
    .replace(/į/g,'i').replace(/š/g,'s').replace(/ų/g,'u').replace(/ū/g,'u').replace(/ž/g,'z')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function detectCategory(title: string, tags: string[] = [], desc = ''): string {
  const t = (title + ' ' + tags.join(' ') + ' ' + desc).toLowerCase();
  if (/obelis|kriaušė|slyva|vyšnia|trešnė|abrikosas|vaismed|plum|apple|cherry|pear|serbentas|agrastas|avietė|uogos|braškė/i.test(t)) return 'fruit';
  if (/pušis|eglė|kadagys|tuja|thuja|kėnis|maumedis|kiparisas|spygliuot|pinus|picea|juniperus|taxus|abies|larix|conifera/i.test(t)) return 'evergreen';
  if (/rožė|spireija|forsitija|syringa|alyvė|jazmin|hortenzija|krūm|šaltekšnis|gudobelė|bijūnas|weigela|berberis|buxus|ligustrum|vijokliai|vijokl|rose|shrub|hydrangea|lilac/i.test(t)) return 'shrub';
  if (/ąžuolas|beržas|liepa|klevas|uosis|magnolija|sakura|tuopa|gluosnis|carpinus|quercus|betula|tilia|acer|fraxinus|populus|ornament|dekorat/i.test(t)) return 'decorative';
  return 'decorative';
}

export function extractHeight(text: string): string {
  const m = text.match(/(\d+)\s*[-–]\s*(\d+)\s*cm/i)
    || text.match(/aukštis[^:]*:\s*([^\n,<]+)/i)
    || text.match(/(\d+)\s*cm\s*(?:aukšt|height)/i)
    || text.match(/(\d+\+?\s*cm)/i);
  return m ? m[0].replace(/aukštis[^:]*:\s*/i, '').trim().slice(0, 30) : '';
}

export function extractLatinName(title: string, desc: string): string {
  // Look for italic latin name patterns in HTML
  const m = desc.match(/<(?:em|i|strong)>([A-Z][a-z]+ [a-z]+(?:\s+['"][^'"]+['"])?)<\/(?:em|i|strong)>/i)
    || title.match(/\((?:lot\.?\s*)?([A-ZĄČĘĖĮŠŲŪŽ][a-ząčęėįšųūž]+ [a-ząčęėįšųūž]+)\)/i)
    || desc.match(/([A-ZĄČĘĖĮŠŲŪŽ][a-ząčęėįšųūž]{2,} [a-ząčęėįšųūž]{3,}(?:\s+var\.?\s+[a-ząčęėįšųūž]+)?)/i);
  return m ? m[1].trim() : '';
}

const LOCAL_GENUS_HINTS: Array<[RegExp, string]> = [
  [/hortenz/i, 'hydrangea'],
  [/miskant/i, 'miscanthus'],
  [/salavij/i, 'salvia'],
  [/levand/i, 'lavandula'],
  [/ežiuol|eziuol/i, 'echinacea'],
  [/elebor/i, 'helleborus'],
  [/šilok|silok/i, 'sedum'],
  [/penstemon/i, 'penstemon'],
  [/flioks/i, 'phlox'],
  [/katžol|katzol/i, 'nepeta'],
  [/alūn|alun/i, 'heuchera'],
  [/astilb/i, 'astilbe'],
  [/rudbek/i, 'rudbeckia'],
  [/verben/i, 'verbena'],
  [/soruol/i, 'pennisetum'],
  [/puš|pus/i, 'pinus'],
  [/egl/i, 'picea'],
  [/bukas/i, 'fagus'],
];

function normalizePlantText(text: string): string {
  return text
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/®/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCultivar(title: string): string {
  const normalized_title = normalizePlantText(title);
  const quoted = normalized_title.match(/['"]([^'"]{2,80})['"]/);
  if (quoted) return quoted[1].trim();

  const dash_cultivar = normalized_title.match(/\s[-–]\s*([A-ZĄČĘĖĮŠŲŪŽ0-9][A-ZĄČĘĖĮŠŲŪŽa-ząčęėįšųūž0-9 &]+)$/);
  if (dash_cultivar) return dash_cultivar[1].trim();

  const parenthetical = normalized_title.match(/\((?!\s*lot\.?)([^)]{2,80})\)/i);
  if (parenthetical) return parenthetical[1].trim();

  return '';
}

function extractBotanicalGenus(title: string): string {
  const normalized_title = normalizePlantText(title);
  const parenthetical = normalized_title.match(/\((?:lot\.?\s*)?([A-ZĄČĘĖĮŠŲŪŽ][a-ząčęėįšųūž]+)(?:\s+[a-ząčęėįšųūž]+)?/i);
  if (parenthetical) return parenthetical[1].toLowerCase();

  const inline_latin = normalized_title.match(/\b([A-Z][a-z]{2,})\s+[a-z]{3,}\b/);
  if (inline_latin) return inline_latin[1].toLowerCase();

  const hint = LOCAL_GENUS_HINTS.find(([pattern]) => pattern.test(normalized_title));
  return hint ? hint[1] : '';
}

function extractBotanicalSpeciesKey(title: string): string {
  const normalized_title = normalizePlantText(title);
  const parenthetical = normalized_title.match(/\((?:lot\.?\s*)?([A-ZĄČĘĖĮŠŲŪŽ][a-ząčęėįšųūž]+)\s+([a-ząčęėįšųūž]+)\b/i);
  if (parenthetical) return `${parenthetical[1]} ${parenthetical[2]}`;

  const inline_latin = normalized_title.match(/\b([A-Z][a-z]{2,})\s+([a-z]{3,})\b/);
  return inline_latin ? `${inline_latin[1]} ${inline_latin[2]}` : '';
}

function stripHtml(html = ''): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanText(text = ''): string {
  return text.replace(/\s+/g, ' ').trim();
}

function parseEuroPrice(text = ''): number {
  const price_match = text
    .replace(/\s/g, '')
    .match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur)/i);
  return price_match ? parseFloat(price_match[1].replace(',', '.')) : 0;
}

function normalizeUrl(raw_url: string | undefined, base_url: string): string {
  if (!raw_url) return '';
  try { return new URL(raw_url, base_url).href; } catch { return ''; }
}

function firstImageUrl(card: HTMLElement, base_url: string): string {
  const image = card.querySelector('img');
  if (!image) return '';
  const raw_url = image.getAttribute('data-src')
    || image.getAttribute('data-original')
    || image.getAttribute('data-lazy-src')
    || image.getAttribute('src')
    || '';
  if (raw_url.startsWith('data:')) return '';
  if (/\/image\/\/\d/i.test(raw_url)) return '';
  return safeImageUrl(raw_url, base_url);
}

export function groupKey(title: string): string {
  const genus = extractBotanicalGenus(title);
  const cultivar = extractCultivar(title);
  if (genus && cultivar) return slugify(`${genus} ${cultivar}`);

  const species_key = extractBotanicalSpeciesKey(title);
  if (species_key) return slugify(species_key);

  // Normalize Lithuanian inflections and extract species core
  return slugify(title)
    .replace(/-(?:s|is|ius|as|es|us|ys|ias|ui|io|iams|ems|ims|oms|ums|yms)(?:-|$)/g, '-')
    .replace(/-(?:medelis|augalas|sodas|vnt|c[0-9]+|p[0-9]+|[0-9]+l|[0-9]+cm)(?:-|$)/gi, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '')
    .split('-').slice(0, 4).join('-');
}

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept': 'application/json, text/html, */*',
  'Accept-Language': 'lt-LT,lt;q=0.9,en;q=0.8',
};

/* ─── Image downloading ──────────────────────────────────────── */
const SCRAPED_IMAGES_DIR = join(process.cwd(), 'public', 'scraped-images');
const IMAGE_FETCH_HEADERS = {
  'User-Agent': FETCH_HEADERS['User-Agent'],
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Referer': 'https://www.google.com/',
};

function imageExtensionFromUrl(image_url: string, content_type = ''): string {
  const url_ext = extname(new URL(image_url).pathname).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(url_ext)) return url_ext;
  if (content_type.includes('png')) return '.png';
  if (content_type.includes('webp')) return '.webp';
  if (content_type.includes('avif')) return '.avif';
  if (content_type.includes('jpeg') || content_type.includes('jpg')) return '.jpg';
  return '.jpg';
}

function safeImageUrl(raw_url: string, base_url?: string): string {
  const clean_url = raw_url?.trim();
  if (!clean_url) return '';
  if (clean_url.startsWith('//')) return `https:${clean_url}`;
  if (clean_url.startsWith('http://') || clean_url.startsWith('https://')) return clean_url;
  if (base_url) {
    try { return new URL(clean_url, base_url).href; } catch { return ''; }
  }
  return '';
}

export async function downloadProductImage(image_url: string, product_id: string): Promise<string | null> {
  const safe_url = safeImageUrl(image_url);
  if (!safe_url) {
    console.log(`[Scraper:images] ${product_id}: skipped invalid image URL`);
    return null;
  }
  mkdirSync(SCRAPED_IMAGES_DIR, { recursive: true });

  try {
    console.log(`[Scraper:images] ${product_id}: downloading ${safe_url}`);
    const image_response = await fetch(safe_url, {
      headers: IMAGE_FETCH_HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!image_response.ok) {
      console.log(`[Scraper:images] ${product_id}: image request failed with HTTP ${image_response.status}`);
      return null;
    }

    const content_type = image_response.headers.get('content-type') || '';
    if (!content_type.startsWith('image/')) {
      console.log(`[Scraper:images] ${product_id}: rejected non-image content type "${content_type}"`);
      return null;
    }

    const image_buffer = Buffer.from(await image_response.arrayBuffer());
    if (image_buffer.length < 500 || image_buffer.length > 10 * 1024 * 1024) {
      console.log(`[Scraper:images] ${product_id}: rejected image size ${image_buffer.length} bytes`);
      return null;
    }

    const image_ext = imageExtensionFromUrl(safe_url, content_type);
    const image_filename = `${product_id.replace(/[^a-z0-9-]/gi, '')}${image_ext}`;
    const disk_path = join(SCRAPED_IMAGES_DIR, image_filename);
    const public_path = `/scraped-images/${image_filename}`;

    if (!existsSync(disk_path)) {
      writeFileSync(disk_path, image_buffer);
      console.log(`[Scraper:images] ${product_id}: saved ${public_path} (${image_buffer.length} bytes)`);
    } else {
      console.log(`[Scraper:images] ${product_id}: already saved as ${public_path}`);
    }
    return public_path;
  } catch (error_item: any) {
    console.log(`[Scraper:images] ${product_id}: image download error: ${error_item?.message || 'unknown error'}`);
    return null;
  }
}

export async function downloadImagesForProducts(products: ScrapedProduct[], limit = 120): Promise<ScrapedProduct[]> {
  const updated_products = [...products];
  const missing_images = updated_products.filter(product_item =>
    product_item.imageUrls?.length > 0 && !product_item.localImagePath
  ).slice(0, limit);

  console.log(`[Scraper:images] ${missing_images.length} products need local images (limit ${limit})`);

  for (const product_item of missing_images) {
    console.log(`[Scraper:images] ${product_item.id}: trying ${Math.min(product_item.imageUrls.length, 4)} image candidate(s) for "${product_item.title}"`);
    for (const image_url of product_item.imageUrls.slice(0, 4)) {
      const local_image_path = await downloadProductImage(image_url, product_item.id);
      if (!local_image_path) continue;
      const product_index = updated_products.findIndex(item => item.id === product_item.id);
      if (product_index !== -1) updated_products[product_index] = { ...updated_products[product_index], localImagePath: local_image_path };
      break;
    }
    await new Promise(resolve_item => setTimeout(resolve_item, 120));
  }

  return updated_products;
}


/* ─── Shopify scraper ───────────────────────────────────────── */
// Shopify stores publicly expose their catalog via /products.json and
// /collections/{handle}/products.json — no API key required.
// This is how apps like Kaina24 aggregate Shopify stores.
async function scrapeShopify(source: NurserySource): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  const collections = source.shopifyCollections || [];

  console.log(`[Scraper:shopify] ${source.name}: starting ${collections.length} collection(s) from ${source.baseUrl}`);
  for (const collection of collections) {
    let collection_count = 0;
    let page = 1;
    while (true) {
      const url = `${source.baseUrl}/collections/${collection}/products.json?limit=250&page=${page}`;
      try {
        console.log(`[Scraper:shopify] ${source.name}/${collection}: fetching page ${page}`);
        const res = await fetch(url, {
          headers: FETCH_HEADERS,
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) {
          console.log(`[Scraper:shopify] ${source.name}/${collection}: HTTP ${res.status}, stopping collection`);
          break;
        }

        const data = await res.json() as { products: ShopifyProduct[] };
        if (!data.products || data.products.length === 0) {
          console.log(`[Scraper:shopify] ${source.name}/${collection}: no products on page ${page}, stopping collection`);
          break;
        }

        for (const sp of data.products) {
          // Price: use lowest variant price
          const prices = sp.variants
            .map(v => parseFloat(v.price))
            .filter(p => p > 0)
            .sort((a, b) => a - b);
          if (prices.length === 0) continue;

          const price = prices[0];
          const originalPrice = sp.variants.some(v => v.compare_at_price && parseFloat(v.compare_at_price) > price)
            ? Math.max(...sp.variants.map(v => parseFloat(v.compare_at_price || '0')))
            : undefined;

          // Images — Shopify CDN URLs are stable
          const imageUrls = sp.images.slice(0, 4).map(img => safeImageUrl(img.src, source.baseUrl)).filter(Boolean);

          // Description — strip HTML
          const descHtml = sp.body_html || '';
          const descText = descHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);

          // Height from description or tags
          const height = extractHeight(descText + ' ' + sp.tags.join(' '));

          // Latin name — often in <em> in description
          const latinName = extractLatinName(sp.title, descHtml) || undefined;

          // Pot size from variants or tags
          const potSizes = sp.variants.map(v => v.title).filter(t => /C\d|L\d|\d+l/i.test(t));
          const potSize = potSizes.length > 0 ? potSizes.join(', ') : undefined;

          // Stock
          const inStock = sp.variants.some(v => v.available);

          const productUrl = `${source.baseUrl}/products/${sp.handle}`;

          products.push({
            id: makeId(productUrl, sp.title),
            scrapedAt: new Date().toISOString(),
            sourceUrl: productUrl,
            sourceSite: source.id,
            sellerName: source.name,
            sellerLogo: source.logo,
            sellerCity: source.city,
            title: sp.title.trim(),
            latinName,
            category: detectCategory(sp.title, sp.tags, descText),
            height,
            potSize,
            price,
            originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
            currency: 'EUR',
            stockStatus: inStock ? 'in_stock' : 'out_of_stock',
            imageUrls,
            description: descText,
            status: 'active',
          });
          collection_count++;
        }

        console.log(`[Scraper:shopify] ${source.name}/${collection}: page ${page} produced ${data.products.length} Shopify product(s)`);
        if (data.products.length < 250) break;
        page++;
        await new Promise(r => setTimeout(r, 400));
      } catch (e: any) {
        console.log(`[Scraper] Shopify ${source.name}/${collection} p${page}: ${e.message}`);
        break;
      }
    }
    console.log(`[Scraper:shopify] ${source.name}/${collection}: collected ${collection_count} product(s)`);
  }

  // Deduplicate within source
  const seen = new Set<string>();
  const deduped_products = products.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  console.log(`[Scraper:shopify] ${source.name}: finished with ${deduped_products.length} unique product(s) from ${products.length} scraped row(s)`);
  return deduped_products;
}

interface ShopifyProduct {
  id: number; handle: string; title: string; body_html: string; tags: string[];
  images: { src: string }[];
  variants: { price: string; compare_at_price?: string; title: string; available: boolean }[];
}

/* ─── HTML scraper (fallback for non-Shopify) ────────────────── */
async function scrapeHtml(source: NurserySource): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  const urls = await discoverHtmlCatalogUrls(source);

  console.log(`[Scraper:html] ${source.name}: starting ${urls.length} catalog URL(s)`);
  for (const url of urls) {
    try {
      const before_count = products.length;
      console.log(`[Scraper:html] ${source.name}: fetching ${url}`);
      const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(20000) });
      if (!res.ok) {
        console.log(`[Scraper:html] ${source.name}: HTTP ${res.status} for ${url}`);
        continue;
      }
      const html = await res.text();
      console.log(`[Scraper:html] ${source.name}: downloaded ${html.length} HTML characters`);
      const root = parse(html);
      const parsed_card_products = [
        ...parseSiupariuProductCards(root, source, url),
        ...parseGrowupProductCards(root, source, url),
      ];
      if (parsed_card_products.length > 0) {
        products.push(...parsed_card_products);
        console.log(`[Scraper:html] ${source.name}: parsed ${parsed_card_products.length} structured product card(s)`);
      }

      // 1. Try JSON-LD
      for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
          const data = JSON.parse(match[1]);
          const items = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
          for (const item of items) {
            if (item['@type'] !== 'Product' || !item.name) continue;
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (!offer) continue;
            const price = parseFloat(offer.price || '0');
            if (!price) continue;
            const desc = stripHtml(item.description || '').slice(0, 400);
            const product_url = normalizeUrl(item.url || url, source.baseUrl) || url;
            products.push({
              id: makeId(product_url, item.name),
              scrapedAt: new Date().toISOString(), sourceUrl: product_url,
              sourceSite: source.id, sellerName: source.name, sellerLogo: source.logo, sellerCity: source.city,
              title: item.name.trim(), category: detectCategory(item.name, [], desc),
              height: extractHeight(desc), price, currency: 'EUR',
              stockStatus: (offer.availability || '').includes('InStock') ? 'in_stock' : 'unknown',
              imageUrls: (Array.isArray(item.image) ? item.image : [item.image]).filter(Boolean).map((i: any) => safeImageUrl(typeof i === 'string' ? i : i.url, source.baseUrl)).filter(Boolean),
              description: desc, status: 'active',
            });
          }
        } catch (error_item: any) {
          console.log(`[Scraper:html] ${source.name}: JSON-LD parse failed: ${error_item?.message || 'unknown error'}`);
        }
      }

      // 2. Generic HTML product cards
      if (parsed_card_products.length === 0) {
        const re = /<(?:li|article)[^>]*class="[^"]*\bproduct\b[^"]*"[^>]*>([\s\S]{40,3000}?)<\/(?:li|article)>/gi;
        for (const m of html.matchAll(re)) {
          const block = m[1];
          const titleM = block.match(/<h[2-5][^>]*>(?:<[^>]+>)*([^<]{4,120})/) || block.match(/<a[^>]*title="([^"]{4,120})"/);
          if (!titleM) continue;
          const title = titleM[1].trim();
          const priceM = block.match(/(\d[\d.,]{0,8})\s*€/);
          if (!priceM) continue;
          const price = parseFloat(priceM[1].replace(',','.'));
          if (!price || price > 99999) continue;
          const urlM = block.match(/href="([^"]+)"/);
          const productUrl = urlM ? (urlM[1].startsWith('http') ? urlM[1] : new URL(urlM[1], source.baseUrl).href) : url;
          const imgM = block.match(/(?:src|data-src|data-original|data-lazy-src)="([^"]+\.(?:jpg|jpeg|png|webp|avif)[^"]*)"/i);
          const image = imgM ? safeImageUrl(imgM[1], source.baseUrl) : '';
          products.push({
            id: makeId(productUrl, title), scrapedAt: new Date().toISOString(), sourceUrl: productUrl,
            sourceSite: source.id, sellerName: source.name, sellerLogo: source.logo, sellerCity: source.city,
            title, category: detectCategory(title), height: extractHeight(block),
            price, currency: 'EUR',
            stockStatus: /krepšel|pirkti|in stock|sandėlyje/i.test(block) ? 'in_stock' : 'unknown',
            imageUrls: image ? [image] : [], status: 'active',
          });
        }
      }
      console.log(`[Scraper:html] ${source.name}: ${url} produced ${products.length - before_count} product(s)`);
    } catch (e: any) {
      console.log(`[Scraper] HTML ${source.name}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }
  const seen = new Set<string>();
  const deduped_products = products.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  console.log(`[Scraper:html] ${source.name}: finished with ${deduped_products.length} unique product(s) from ${products.length} scraped row(s)`);
  return deduped_products;
}

async function discoverHtmlCatalogUrls(source: NurserySource): Promise<string[]> {
  const urls = new Set<string>();
  for (const catalog_url of source.catalogUrls || []) urls.add(catalog_url);

  for (const sitemap_url of source.catalogSitemapUrls || []) {
    try {
      console.log(`[Scraper:html] ${source.name}: discovering catalog URLs from ${sitemap_url}`);
      const sitemap_response = await fetch(sitemap_url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(20000) });
      if (!sitemap_response.ok) {
        console.log(`[Scraper:html] ${source.name}: sitemap HTTP ${sitemap_response.status}`);
        continue;
      }
      const sitemap_xml = await sitemap_response.text();
      const discovered_urls = [...sitemap_xml.matchAll(/<loc><!\[CDATA\[(.*?)\]\]><\/loc>|<loc>(.*?)<\/loc>/g)]
        .map(match_item => normalizeUrl(match_item[1] || match_item[2], source.baseUrl))
        .filter(Boolean);
      discovered_urls.forEach(discovered_url => urls.add(discovered_url));
      console.log(`[Scraper:html] ${source.name}: sitemap added ${discovered_urls.length} URL(s)`);
    } catch (error_item: any) {
      console.log(`[Scraper:html] ${source.name}: sitemap discovery failed: ${error_item?.message || 'unknown error'}`);
    }
  }

  if (source.discoverCatalogUrls) {
    for (const seed_url of source.catalogUrls || []) {
      try {
        console.log(`[Scraper:html] ${source.name}: discovering catalog URLs from ${seed_url}`);
        const seed_response = await fetch(seed_url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(20000) });
        if (!seed_response.ok) {
          console.log(`[Scraper:html] ${source.name}: discovery seed HTTP ${seed_response.status}`);
          continue;
        }
        const seed_html = await seed_response.text();
        const root = parse(seed_html);
        const discovered_urls = root.querySelectorAll('a')
          .map(link_item => normalizeUrl(link_item.getAttribute('href'), source.baseUrl))
          .filter(link_url => {
            if (!link_url.startsWith(source.baseUrl)) return false;
            if (link_url.endsWith('.html')) return false;
            return /\/lt\/(?:e-)?parduotuve\//.test(link_url);
          });
        discovered_urls.forEach(discovered_url => urls.add(discovered_url));
        console.log(`[Scraper:html] ${source.name}: page discovery added ${new Set(discovered_urls).size} URL(s)`);
      } catch (error_item: any) {
        console.log(`[Scraper:html] ${source.name}: catalog discovery failed: ${error_item?.message || 'unknown error'}`);
      }
    }
  }

  return [...urls];
}

function parseSiupariuProductCards(root: HTMLElement, source: NurserySource, page_url: string): ScrapedProduct[] {
  const cards = root.querySelectorAll('.box-nina');
  if (cards.length === 0) return [];

  return cards.map(card => {
    const title_link = card.querySelector('.box-nina-text .title a') || card.querySelector('h5 a');
    const title = cleanText(title_link?.text || '');
    const source_url = normalizeUrl(title_link?.getAttribute('href'), source.baseUrl) || page_url;
    const price = parseEuroPrice(card.querySelector('.box-nina-text .text')?.text || card.text);
    const image_url = firstImageUrl(card, source.baseUrl);
    const stock_status = /išparduota|isparduota/i.test(card.text) ? 'out_of_stock' : 'in_stock';

    if (!title || !price || !source_url) return null;
    return {
      id: makeId(source_url, title),
      scrapedAt: new Date().toISOString(),
      sourceUrl: source_url,
      sourceSite: source.id,
      sellerName: source.name,
      sellerLogo: source.logo,
      sellerCity: source.city,
      title,
      latinName: extractLatinName(title, ''),
      category: detectCategory(title),
      height: '',
      price,
      currency: 'EUR' as const,
      stockStatus: stock_status as ScrapedProduct['stockStatus'],
      imageUrls: image_url ? [image_url] : [],
      description: title,
      status: 'active' as const,
    };
  }).filter(Boolean) as ScrapedProduct[];
}

function parseGrowupProductCards(root: HTMLElement, source: NurserySource, page_url: string): ScrapedProduct[] {
  const cards = root.querySelectorAll('.product-layout');
  if (cards.length === 0) return [];

  return cards.map(card => {
    const title_link = card.querySelector('.name a');
    const title = cleanText(title_link?.text || title_link?.getAttribute('title') || '');
    const source_url = normalizeUrl(title_link?.getAttribute('href'), source.baseUrl) || page_url;
    const description = cleanText(card.querySelector('.description')?.text || '');
    const price = parseEuroPrice(card.querySelector('.price-normal')?.text || card.querySelector('.price')?.text || '');
    const image_url = firstImageUrl(card, source.baseUrl);
    const stock_status = /išparduota|isparduota|out of stock/i.test(card.text) ? 'out_of_stock' : 'in_stock';

    if (!title || !price || !source_url) return null;
    return {
      id: makeId(source_url, title),
      scrapedAt: new Date().toISOString(),
      sourceUrl: source_url,
      sourceSite: source.id,
      sellerName: source.name,
      sellerLogo: source.logo,
      sellerCity: source.city,
      title,
      latinName: extractLatinName(title, description),
      category: detectCategory(title, [], description),
      height: extractHeight(description),
      price,
      currency: 'EUR' as const,
      stockStatus: stock_status as ScrapedProduct['stockStatus'],
      imageUrls: image_url ? [image_url] : [],
      description: description.slice(0, 400) || title,
      status: 'active' as const,
    };
  }).filter(Boolean) as ScrapedProduct[];
}

/* ─── Main entry point (called from cron) ───────────────────── */
export async function scrapeSource(source: NurserySource): Promise<ScrapedProduct[]> {
  console.log(`[Scraper] Source ${source.id}: type=${source.type}, active=${source.active}`);
  if (source.type === 'shopify') return scrapeShopify(source);
  return scrapeHtml(source);
}

// Legacy compat — called from admin scrape route
export async function scrapeUrl(catalogUrl: string, sellerName: string, sourceSite: string, sellerCity = '', sellerLogo = ''): Promise<ScrapedProduct[]> {
  const src = NURSERY_SOURCES.find(s => s.id === sourceSite);
  if (src) return scrapeSource(src);
  // Manual URL scrape via HTML
  const tempSource: NurserySource = { id: sourceSite, name: sellerName, city: sellerCity, baseUrl: new URL(catalogUrl).origin, logo: sellerLogo, type: 'html', catalogUrls: [catalogUrl], active: true };
  return scrapeHtml(tempSource);
}

/* ─── Marketplace builder ────────────────────────────────────── */
export function buildMarketplace(products: ScrapedProduct[]): MarketplaceGroup[] {
  const groups = new Map<string, MarketplaceGroup>();
  const active = products.filter(p => p.status === 'active' && p.price > 0);

  for (const p of active) {
    const key = groupKey(p.title);
    if (!key || key.length < 3) continue;

    if (!groups.has(key)) {
      groups.set(key, {
        slug: key, canonicalName: p.title, latinName: p.latinName,
        category: p.category, offers: [], bestPrice: p.price,
        updatedAt: p.scrapedAt,
      });
    }
    const group = groups.get(key)!;
    if (p.latinName && !group.latinName) group.latinName = p.latinName;
    if (p.price < group.bestPrice) group.bestPrice = p.price;

    const existing = group.offers.find(o => o.sellerName === p.sellerName);
    const offer: MarketplaceOffer = {
      productId: p.id, sellerName: p.sellerName, sellerLogo: p.sellerLogo,
      sellerCity: p.sellerCity, sourceUrl: p.sourceUrl, price: p.price,
      originalPrice: p.originalPrice, height: p.height,
      stockStatus: p.stockStatus, imageUrl: p.imageUrls[0] || '',
      localImagePath: p.localImagePath, scrapedAt: p.scrapedAt,
    };
    if (existing) { if (p.price <= existing.price) group.offers[group.offers.indexOf(existing)] = offer; }
    else group.offers.push(offer);
  }

  return [...groups.values()]
    .map(g => ({ ...g, offers: g.offers.sort((a, b) => a.price - b.price) }))
    .sort((a, b) => b.offers.length - a.offers.length || a.bestPrice - b.bestPrice);
}

export function normalizeToTree(product: ScrapedProduct): any {
  const id = slugify(product.title).slice(0, 36) + '-' + product.id.slice(0, 6);
  const heightCm = parseInt(product.height || '0');
  const size = heightCm > 150 ? 'large' : heightCm > 50 ? 'medium' : 'small';
  return {
    id, name: product.title, latin: product.latinName || '',
    category: product.category, size, price: product.price, height: product.height || '',
    description: product.description || product.title, color: '#508153',
    imagePath: product.localImagePath || product.imageUrls[0] || undefined,
    care: { watering:'', sunlight:'', soil:'', pruning:'', hardiness:'', spacing:'', growthRate:'',
      notes: `Šaltinis: ${product.sellerName} — ${product.sourceUrl}` },
    svg: `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><text x="100" y="160" text-anchor="middle" font-size="80">🌳</text></svg>`,
    _scraped: true, _sourceUrl: product.sourceUrl, _sellerName: product.sellerName,
  };
}
