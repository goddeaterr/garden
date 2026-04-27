import { createHash } from 'crypto';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

/* ─── Types ──────────────────────────────────────────────────── */
export interface ScrapedProduct {
  id: string; scrapedAt: string; sourceUrl: string; sourceSite: string;
  sellerName: string; sellerLogo: string; sellerCity: string;
  title: string; latinName?: string; category: string;
  height?: string; potSize?: string;
  price: number; originalPrice?: number; currency: 'EUR';
  stockStatus: 'in_stock' | 'out_of_stock' | 'unknown';
  imageUrls: string[]; localImagePath?: string;
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
    || title.match(/\(([A-Z][a-z]+ [a-z]+)\)/)
    || desc.match(/([A-Z][a-z]{2,} [a-z]{3,}(?:\s+var\.?\s+[a-z]+)?)/);
  return m ? m[1].trim() : '';
}

export function groupKey(title: string): string {
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
  if (!safe_url) return null;
  mkdirSync(SCRAPED_IMAGES_DIR, { recursive: true });

  try {
    const image_response = await fetch(safe_url, {
      headers: IMAGE_FETCH_HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!image_response.ok) return null;

    const content_type = image_response.headers.get('content-type') || '';
    if (!content_type.startsWith('image/')) return null;

    const image_buffer = Buffer.from(await image_response.arrayBuffer());
    if (image_buffer.length < 500 || image_buffer.length > 10 * 1024 * 1024) return null;

    const image_ext = imageExtensionFromUrl(safe_url, content_type);
    const image_filename = `${product_id.replace(/[^a-z0-9-]/gi, '')}${image_ext}`;
    const disk_path = join(SCRAPED_IMAGES_DIR, image_filename);
    const public_path = `/scraped-images/${image_filename}`;

    if (!existsSync(disk_path)) writeFileSync(disk_path, image_buffer);
    return public_path;
  } catch {
    return null;
  }
}

export async function downloadImagesForProducts(products: ScrapedProduct[], limit = 120): Promise<ScrapedProduct[]> {
  const updated_products = [...products];
  const missing_images = updated_products.filter(product_item =>
    product_item.imageUrls?.length > 0 && !product_item.localImagePath
  ).slice(0, limit);

  for (const product_item of missing_images) {
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

  for (const collection of collections) {
    let page = 1;
    while (true) {
      const url = `${source.baseUrl}/collections/${collection}/products.json?limit=250&page=${page}`;
      try {
        const res = await fetch(url, {
          headers: FETCH_HEADERS,
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) break;

        const data = await res.json() as { products: ShopifyProduct[] };
        if (!data.products || data.products.length === 0) break;

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
        }

        if (data.products.length < 250) break;
        page++;
        await new Promise(r => setTimeout(r, 400));
      } catch (e: any) {
        console.log(`[Scraper] Shopify ${source.name}/${collection} p${page}: ${e.message}`);
        break;
      }
    }
  }

  // Deduplicate within source
  const seen = new Set<string>();
  return products.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
}

interface ShopifyProduct {
  id: number; handle: string; title: string; body_html: string; tags: string[];
  images: { src: string }[];
  variants: { price: string; compare_at_price?: string; title: string; available: boolean }[];
}

/* ─── HTML scraper (fallback for non-Shopify) ────────────────── */
async function scrapeHtml(source: NurserySource): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  const urls = source.catalogUrls || [];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      const html = await res.text();

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
            const desc = (item.description || '').replace(/<[^>]+>/g, '').slice(0, 400);
            products.push({
              id: makeId(item.url || url, item.name),
              scrapedAt: new Date().toISOString(), sourceUrl: item.url || url,
              sourceSite: source.id, sellerName: source.name, sellerLogo: source.logo, sellerCity: source.city,
              title: item.name.trim(), category: detectCategory(item.name, [], desc),
              height: extractHeight(desc), price, currency: 'EUR',
              stockStatus: (offer.availability || '').includes('InStock') ? 'in_stock' : 'unknown',
              imageUrls: (Array.isArray(item.image) ? item.image : [item.image]).filter(Boolean).map((i: any) => safeImageUrl(typeof i === 'string' ? i : i.url, source.baseUrl)).filter(Boolean),
              description: desc, status: 'active',
            });
          }
        } catch {}
      }

      // 2. Generic HTML product cards
      if (products.length === 0) {
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
    } catch (e: any) {
      console.log(`[Scraper] HTML ${source.name}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }
  const seen = new Set<string>();
  return products.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
}

/* ─── Main entry point (called from cron) ───────────────────── */
export async function scrapeSource(source: NurserySource): Promise<ScrapedProduct[]> {
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
