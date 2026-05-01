'use client';

import { useState, useEffect, useRef, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Upload, Eye, EyeOff, LogOut, TreePine, Check, X,
  Loader2, AlertCircle, Image as ImageIcon, Save, Search, Globe, Download,
  RefreshCw, Filter, ExternalLink, Sparkles, Database, PackageCheck, Zap, Wand2
} from 'lucide-react';
import type { Tree, TreeCategory, TreeSize } from '@/types';

/* ── types ─────────────────────────────────────────────────── */
const CATS: TreeCategory[] = ['fruit', 'decorative', 'evergreen', 'shrub'];
const SIZES: TreeSize[] = ['small', 'medium', 'large'];
const CARE_KEYS = ['watering','sunlight','soil','pruning','hardiness','spacing','growthRate','notes'] as const;
const CARE_LABELS: Record<string, string> = { watering:'Watering', sunlight:'Sunlight', soil:'Soil', pruning:'Pruning', hardiness:'Hardiness', spacing:'Spacing', growthRate:'Growth Rate', notes:'Notes' };

interface ScrapedProduct {
  id: string; scrapedAt: string; sourceUrl: string; sourceSite: string;
  sellerName: string; title: string; latinName?: string; category: string;
  height?: string; price: number; currency: string; stockStatus: string;
  imageUrls: string[]; localImagePath?: string; description?: string;
  status: 'pending'|'processed'|'imported'|'rejected'; bgRemoved?: boolean;
}

interface NurserySource { id: string; name: string; baseUrl: string; searchUrl: string; active: boolean; }

function emptyForm(): Partial<Tree> & { care: Tree['care'] } {
  return { id:'', name:'', latin:'', category:'fruit', size:'medium', price:0, height:'', description:'', color:'#508153', bloom:'',
    care:{ watering:'', sunlight:'', soil:'', pruning:'', hardiness:'', spacing:'', growthRate:'', notes:'' } };
}

/* ── helpers ─────────────────────────────────────────────────── */
const fmt = (n: number) => `€${n.toFixed(0)}`;

/* ══════════════════════════════════════════════════════════════ */
export default function AdminPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  /* auth */
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [session, setSession] = useState('');

  /* tabs */
  const [tab, setTab] = useState<'trees'|'scraper'|'images'>('trees');

  /* trees tab */
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loadingTrees, setLoadingTrees] = useState(false);
  const [editTree, setEditTree] = useState<(Partial<Tree> & { care: Tree['care'] }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* scraper tab */
  const [sources, setSources] = useState<NurserySource[]>([]);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeSellerName, setScrapeSellerName] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<{found:number;added:number}|null>(null);
  const [scraped, setScraped] = useState<ScrapedProduct[]>([]);
  const [scrapedFilter, setScrapedFilter] = useState<'all'|'pending'|'imported'|'rejected'>('all');
  const [loadingScraped, setLoadingScraped] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [scrapeLog, setScrapeLog] = useState<Record<string,any>>({});

  /* images tab */
  const [processingId, setProcessingId] = useState<string|null>(null);
  const [processResults, setProcessResults] = useState<Record<string,{path:string;bgRemoved:boolean}>>({});

  /* google images tab */
  const [googleImages, setGoogleImages] = useState<Record<string,string>>({});
  const [marketplaceGroups, setMarketplaceGroups] = useState<any[]>([]);
  const [googleFetchingSlug, setGoogleFetchingSlug] = useState<string|null>(null);
  const [googleBulking, setGoogleBulking] = useState(false);
  const [googleBulkStatus, setGoogleBulkStatus] = useState<{processed:number;remaining:number;total:number;done:number}|null>(null);

  /* global alert */
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const ah = () => ({ 'Authorization': `Bearer ${session}`, 'Content-Type': 'application/json' });

  /* ── auth ─────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true); setAuthError('');
    try {
      const r = await fetch('/api/admin/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, password }) });
      const d = await r.json();
      if (!r.ok) { setAuthError(d.error||'Login failed'); return; }
      setSession(d.session); setAuthed(true);
      sessionStorage.setItem('admin_session', d.session);
    } catch { setAuthError('Network error'); } finally { setAuthLoading(false); }
  };

  useEffect(() => {
    const s = sessionStorage.getItem('admin_session');
    if (s) { setSession(s); setAuthed(true); }
  }, []);

  /* ── load trees ─────────────────────────── */
  const fetchTrees = async () => {
    setLoadingTrees(true);
    try {
      const r = await fetch('/api/admin/trees', { headers: { 'Authorization': `Bearer ${session}` } });
      if (r.ok) setTrees(await r.json());
    } catch {} finally { setLoadingTrees(false); }
  };

  /* ── load scraped ─────────────────────────── */
  const fetchScraped = async () => {
    setLoadingScraped(true);
    try {
      const [sr, lr, sourcesR] = await Promise.all([
        fetch('/api/admin/scrape', { headers: { 'Authorization': `Bearer ${session}` } }),
        fetch('/api/admin/scrape?action=log', { headers: { 'Authorization': `Bearer ${session}` } }),
        fetch('/api/admin/scrape?action=sources', { headers: { 'Authorization': `Bearer ${session}` } }),
      ]);
      if (sr.ok) { const d = await sr.json(); setScraped(d.items||[]); }
      if (lr.ok) setScrapeLog(await lr.json());
      if (sourcesR.ok) setSources(await sourcesR.json());
    } catch {} finally { setLoadingScraped(false); }
  };

  useEffect(() => { if (authed && session) { fetchTrees(); fetchScraped(); fetchGoogleImages(); } }, [authed, session]);

  /* ── scrape ─────────────────────────── */
  const handleScrape = async () => {
    if (!scrapeUrl.trim()) { setError('Enter a URL to scrape'); return; }
    setScraping(true); setScrapeResult(null); setError('');
    try {
      const r = await fetch('/api/admin/scrape', { method:'POST', headers: ah(), body: JSON.stringify({ url: scrapeUrl.trim(), sellerName: scrapeSellerName.trim() || undefined }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Scrape failed');
      setScrapeResult({ found: d.found, added: d.added });
      setSuccess(`Found ${d.found} products, added ${d.added} new.`);
      await fetchScraped();
    } catch (e: any) { setError(e.message); } finally { setScraping(false); }
  };

  const handleScrapeSource = async (src: NurserySource) => {
    setScrapeUrl(src.searchUrl); setScrapeSellerName(src.name);
  };

  const handleClearScraped = async () => {
    if (!confirm('Clear all scraped data?')) return;
    await fetch('/api/admin/scrape', { method:'POST', headers: ah(), body: JSON.stringify({ action:'clear_all' }) });
    setScraped([]); setScrapeLog({}); setSelected(new Set());
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch('/api/admin/scrape', { method:'POST', headers: ah(), body: JSON.stringify({ action:'update_status', id, status }) });
    setScraped(prev => prev.map(p => p.id === id ? {...p, status: status as any} : p));
  };

  const handleDeleteScraped = async (id: string) => {
    await fetch(`/api/admin/scrape?id=${id}`, { method:'DELETE', headers: { 'Authorization': `Bearer ${session}` } });
    setScraped(prev => prev.filter(p => p.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleImport = async () => {
    if (selected.size === 0) { setError('Select products to import'); return; }
    setImporting(true); setError('');
    try {
      const r = await fetch('/api/admin/import', { method:'POST', headers: ah(), body: JSON.stringify({ ids: [...selected] }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Import failed');
      setSuccess(`Imported ${d.imported} trees to catalog. ${d.errors?.length ? `${d.errors.length} errors.` : ''}`);
      setSelected(new Set());
      await Promise.all([fetchTrees(), fetchScraped()]);
    } catch (e: any) { setError(e.message); } finally { setImporting(false); }
  };

  /* ── image processing ─────────────────────────── */
  const handleRemoveBg = async (product: ScrapedProduct) => {
    const imageUrl = product.imageUrls[0];
    if (!imageUrl) { setError('No image URL for this product'); return; }
    setProcessingId(product.id);
    try {
      const r = await fetch('/api/admin/removebg', { method:'POST', headers: ah(), body: JSON.stringify({ imageUrl, productId: product.id }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Processing failed');
      setProcessResults(prev => ({ ...prev, [product.id]: { path: d.path, bgRemoved: d.bgRemoved } }));
      setSuccess(d.bgRemoved ? `Background removed! Saved to ${d.path}` : `Image downloaded to ${d.path}. Add REMOVE_BG_API_KEY for bg removal.`);
      await fetchScraped();
    } catch (e: any) { setError(e.message); } finally { setProcessingId(null); }
  };

  /* ── google image fetching ─────────────────────────── */
  const fetchGoogleImages = async () => {
    try {
      const [bi, mp] = await Promise.all([
        fetch('/api/admin/google-image', { headers: { 'Authorization': `Bearer ${session}` } }),
        fetch('/marketplace.json?t=' + Date.now(), { cache: 'no-store' }),
      ]);
      if (bi.ok) setGoogleImages(await bi.json());
      if (mp.ok) { const d = await mp.json(); setMarketplaceGroups(d.groups || []); }
    } catch {}
  };

  const handleGoogleFetch = async (group: any) => {
    setGoogleFetchingSlug(group.slug); setError('');
    try {
      const r = await fetch('/api/admin/google-image', {
        method: 'POST', headers: ah(),
        body: JSON.stringify({ slug: group.slug, latinName: group.latinName, canonicalName: group.canonicalName }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Fetch failed');
      setGoogleImages(prev => ({ ...prev, [group.slug]: d.path }));
      setSuccess(`Image fetched for ${group.canonicalName}`);
    } catch (e: any) { setError(e.message); } finally { setGoogleFetchingSlug(null); }
  };

  const handleGoogleBulk = async () => {
    setGoogleBulking(true); setError('');
    try {
      const r = await fetch('/api/admin/google-image', {
        method: 'POST', headers: ah(),
        body: JSON.stringify({ action: 'bulk', limit: 10 }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Bulk fetch failed');
      setGoogleBulkStatus({ processed: d.processed, remaining: d.remaining, total: d.total, done: d.done });
      setSuccess(`Processed ${d.processed} plants. ${d.remaining} remaining.`);
      await fetchGoogleImages();
    } catch (e: any) { setError(e.message); } finally { setGoogleBulking(false); }
  };

  const handleGoogleDelete = async (slug: string) => {
    await fetch(`/api/admin/google-image?slug=${encodeURIComponent(slug)}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${session}` } });
    setGoogleImages(prev => { const n = { ...prev }; delete n[slug]; return n; });
  };

  /* ── tree CRUD ─────────────────────────── */
  const handleImageChange = (file: File) => {
    setImageFile(file);
    const r = new FileReader(); r.onload = e => setImagePreview(e.target?.result as string); r.readAsDataURL(file);
  };

  const uploadImage = async (treeId: string): Promise<string|null> => {
    if (!imageFile) return editTree?.imagePath || null;
    const form = new FormData(); form.append('file', imageFile); form.append('treeId', treeId);
    const r = await fetch('/api/admin/upload', { method:'POST', headers:{ 'Authorization': `Bearer ${session}` }, body: form });
    if (!r.ok) throw new Error('Image upload failed');
    return (await r.json()).path;
  };

  const handleSave = async () => {
    if (!editTree) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const id = editTree.id?.trim().toLowerCase().replace(/\s+/g,'-') || '';
      if (!id) throw new Error('ID is required');
      if (!editTree.name?.trim()) throw new Error('Name is required');
      const imagePath = await uploadImage(id);
      const payload = { ...editTree, id, imagePath: imagePath || `/trees/${id}.png` };
      const r = await fetch('/api/admin/trees', { method: isNew?'POST':'PUT', headers: ah(), body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error||'Save failed');
      setSuccess(isNew ? 'Tree added!' : 'Tree updated!');
      setEditTree(null); setImageFile(null); setImagePreview('');
      fetchTrees();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    const r = await fetch(`/api/admin/trees?id=${id}`, { method:'DELETE', headers:{ 'Authorization': `Bearer ${session}` } });
    if (!r.ok) { setError((await r.json()).error); return; }
    setSuccess('Deleted.'); setDeleteConfirm(null); fetchTrees();
  };

  const logout = () => { sessionStorage.removeItem('admin_session'); setAuthed(false); setSession(''); setPassword(''); };

  /* ── login screen ─────────────────────────── */
  if (!authed) return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center p-6">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-2xl bg-forest-700 flex items-center justify-center"><TreePine size={22} className="text-forest-100" /></div>
          <div><div className="text-white font-bold text-lg">MB Plant House</div><div className="text-forest-400 text-[11px] tracking-wider uppercase">Admin Panel</div></div>
        </div>
        <div className="bg-forest-900 rounded-3xl p-8 border border-forest-800">
          <h1 className="text-white font-semibold text-xl mb-1">Welcome back</h1>
          <p className="text-forest-400 text-sm mb-6">Enter your admin password.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Admin password" autoComplete="current-password"
                className="w-full bg-forest-800 border border-forest-700 rounded-xl px-4 py-3 text-white placeholder:text-forest-500 outline-none focus:ring-2 focus:ring-forest-500 pr-12 text-[14px]" />
              <button type="button" onClick={()=>setShowPwd(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400">{showPwd?<EyeOff size={16}/>:<Eye size={16}/>}</button>
            </div>
            {authError && <p className="text-red-400 text-[13px] flex items-center gap-1.5"><AlertCircle size={13}/>{authError}</p>}
            <button type="submit" disabled={authLoading||!password} className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-[14px] disabled:opacity-50 flex items-center justify-center gap-2">
              {authLoading ? <Loader2 size={16} className="animate-spin"/> : null}{authLoading?'Signing in…':'Sign in'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );

  const filteredScraped = scraped.filter(p => scrapedFilter === 'all' || p.status === scrapedFilter);
  const pendingImages = scraped.filter(p => p.imageUrls[0] && !p.localImagePath && p.status !== 'rejected');

  /* ── main UI ─────────────────────────── */
  return (
    <div className="min-h-screen bg-forest-950 text-white">
      {/* Header */}
      <div className="border-b border-forest-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest-700 flex items-center justify-center"><TreePine size={16} className="text-forest-100"/></div>
            <span className="font-bold text-white text-sm">MB Plant House</span>
          </div>
          <div className="flex items-center gap-1">
            {([['trees','Catalog',Database],['scraper','Scraper',Globe],['images','Images',Sparkles]] as const).map(([t,label,Icon]) => (
              <button key={t} onClick={()=>setTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${tab===t?'bg-forest-700 text-white':'text-forest-400 hover:text-white hover:bg-forest-800'}`}>
                <Icon size={13}/>{label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-forest-400 hover:text-white text-[12px] transition-colors"><LogOut size={13}/>Logout</button>
      </div>

      {/* Alerts */}
      <div className="px-6 pt-3">
        <AnimatePresence>
          {success && <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-[13px]"><Check size={13}/>{success}<button onClick={()=>setSuccess('')} className="ml-auto"><X size={13}/></button></motion.div>}
          {error && <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-[13px]"><AlertCircle size={13}/>{error}<button onClick={()=>setError('')} className="ml-auto"><X size={13}/></button></motion.div>}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-10">
        {/* ══════ CATALOG TAB ══════ */}
        {tab === 'trees' && (
          <div>
            <div className="flex items-center justify-between mb-5 pt-2">
              <h2 className="text-lg font-bold">{trees.length} custom trees in catalog</h2>
              <button onClick={()=>{ setEditTree(emptyForm()); setIsNew(true); setImageFile(null); setImagePreview(''); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white text-[13px] font-semibold transition-colors">
                <Plus size={15}/>Add tree
              </button>
            </div>
            {loadingTrees ? <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-forest-500"/></div>
            : trees.length === 0 ? (
              <div className="text-center py-20 text-forest-500">
                <TreePine size={40} className="mx-auto mb-3 opacity-30"/>
                <p>No custom trees. Add one or import from Scraper tab.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {trees.map(tree => (
                  <div key={tree.id} className="bg-forest-900 rounded-2xl border border-forest-800 overflow-hidden">
                    <div className="h-28 flex items-center justify-center relative" style={{ background:`linear-gradient(135deg,${tree.color}22,${tree.color}08)` }}>
                      {tree.imagePath ? <img src={tree.imagePath} alt={tree.name} className="h-full w-full object-contain p-2"/> : <div className="text-4xl">🌳</div>}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{background:`${tree.color}33`,color:tree.color}}>{tree.category}</span>
                      {(tree as any)._scraped && <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] bg-blue-900/60 text-blue-300 border border-blue-800">scraped</span>}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-white text-[13px] leading-tight">{tree.name}</h3>
                        <span className="text-white font-bold text-[13px] tabular-nums">{fmt(tree.price)}</span>
                      </div>
                      {(tree as any)._sellerName && <p className="text-forest-500 text-[10px] mb-1">via {(tree as any)._sellerName}</p>}
                      <p className="text-forest-400 text-[11px] leading-snug line-clamp-2">{tree.description}</p>
                      <div className="flex gap-2 mt-2.5">
                        <button onClick={()=>{ setEditTree({...tree,care:tree.care||emptyForm().care}); setIsNew(false); setImagePreview(tree.imagePath||''); setImageFile(null); }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-forest-800 hover:bg-forest-700 text-[11px] text-forest-200 transition-colors"><Pencil size={11}/>Edit</button>
                        <button onClick={()=>handleDelete(tree.id)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] transition-colors ${deleteConfirm===tree.id?'bg-red-700 text-white':'bg-forest-800 hover:bg-red-900/50 text-forest-200 hover:text-red-300'}`}>
                          <Trash2 size={11}/>{deleteConfirm===tree.id?'Confirm':'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ SCRAPER TAB ══════ */}
        {tab === 'scraper' && (
          <div className="pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Scrape form */}
              <div className="lg:col-span-2 bg-forest-900 rounded-2xl border border-forest-800 p-5">
                <h3 className="text-[13px] font-bold text-white mb-1 flex items-center gap-2"><Globe size={14} className="text-forest-400"/>Scrape a nursery website</h3>
                <p className="text-forest-500 text-[11px] mb-4">Enter any Lithuanian nursery URL. The scraper will extract product listings, prices, and images automatically.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-forest-500 mb-1">Website URL</label>
                    <input value={scrapeUrl} onChange={e=>setScrapeUrl(e.target.value)} placeholder="https://www.medelynas.lt/katalogas"
                      className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2.5 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500 placeholder:text-forest-600"/>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-forest-500 mb-1">Seller name (optional)</label>
                    <input value={scrapeSellerName} onChange={e=>setScrapeSellerName(e.target.value)} placeholder="Vilniaus medelynas"
                      className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2.5 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500 placeholder:text-forest-600"/>
                  </div>
                  <button onClick={handleScrape} disabled={scraping||!scrapeUrl.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-[13px] disabled:opacity-50 transition-colors">
                    {scraping ? <Loader2 size={15} className="animate-spin"/> : <Search size={15}/>}
                    {scraping ? 'Scraping…' : 'Start scraping'}
                  </button>
                  {scrapeResult && (
                    <div className="flex gap-3 text-[12px]">
                      <span className="text-forest-300">Found: <strong className="text-white">{scrapeResult.found}</strong></span>
                      <span className="text-emerald-400">New: <strong>{scrapeResult.added}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick source buttons */}
              <div className="bg-forest-900 rounded-2xl border border-forest-800 p-5">
                <h3 className="text-[13px] font-bold text-white mb-3 flex items-center gap-2"><Zap size={14} className="text-amber-400"/>Quick sources</h3>
                <div className="space-y-2">
                  {sources.map(src => (
                    <button key={src.id} onClick={()=>handleScrapeSource(src)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-forest-800 hover:bg-forest-700 text-[12px] text-forest-200 transition-colors">
                      <span className="truncate">{src.name}</span>
                      <ExternalLink size={11} className="text-forest-500 flex-shrink-0"/>
                    </button>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-forest-800 text-[11px] text-forest-500">
                  Click a source to fill the URL above, then click Scrape.
                </div>
              </div>
            </div>

            {/* Scraped results */}
            <div className="bg-forest-900 rounded-2xl border border-forest-800">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-forest-800">
                <div className="flex items-center gap-3">
                  <h3 className="text-[13px] font-bold text-white">{scraped.length} scraped products</h3>
                  <div className="flex items-center gap-1">
                    {(['all','pending','imported','rejected'] as const).map(f => (
                      <button key={f} onClick={()=>setScrapedFilter(f)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${scrapedFilter===f?'bg-forest-600 text-white':'text-forest-500 hover:text-forest-300'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.size > 0 && (
                    <button onClick={handleImport} disabled={importing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[12px] font-semibold disabled:opacity-60">
                      {importing ? <Loader2 size={12} className="animate-spin"/> : <PackageCheck size={12}/>}
                      Import {selected.size} to catalog
                    </button>
                  )}
                  <button onClick={fetchScraped} className="w-7 h-7 flex items-center justify-center rounded-lg bg-forest-800 hover:bg-forest-700 text-forest-400">
                    <RefreshCw size={13}/>
                  </button>
                  <button onClick={handleClearScraped} className="px-3 py-1.5 rounded-lg bg-forest-800 hover:bg-red-900/50 text-forest-400 hover:text-red-400 text-[12px] transition-colors">Clear all</button>
                </div>
              </div>

              {loadingScraped ? <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-forest-500"/></div>
              : filteredScraped.length === 0 ? (
                <div className="text-center py-16 text-forest-500">
                  <Search size={32} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-[13px]">No scraped products. Enter a URL above and click Scrape.</p>
                </div>
              ) : (
                <div className="divide-y divide-forest-800">
                  {filteredScraped.map(product => (
                    <div key={product.id} className={`flex items-start gap-3 px-5 py-3 hover:bg-forest-800/40 transition-colors ${selected.has(product.id)?'bg-emerald-900/20':''}`}>
                      <input type="checkbox" checked={selected.has(product.id)} onChange={()=>toggleSelect(product.id)}
                        disabled={product.status==='imported'||product.status==='rejected'}
                        className="mt-1 w-4 h-4 accent-emerald-500 flex-shrink-0 cursor-pointer"/>

                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-forest-800 flex-shrink-0 overflow-hidden">
                        {(processResults[product.id]?.path || product.localImagePath || product.imageUrls[0]) &&
                          <img src={processResults[product.id]?.path || product.localImagePath || product.imageUrls[0]}
                            alt={product.title} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[13px] font-medium text-white leading-tight truncate">{product.title}</div>
                            <div className="text-[11px] text-forest-500 mt-0.5">{product.sellerName} · <a href={product.sourceUrl} target="_blank" rel="noopener" className="hover:text-forest-300">{new URL(product.sourceUrl).hostname}</a></div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {product.price > 0 && <span className="text-[13px] font-bold text-white tabular-nums">{fmt(product.price)}</span>}
                            <StatusBadge status={product.status}/>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] bg-forest-800 px-1.5 py-0.5 rounded text-forest-400">{product.category}</span>
                          {product.height && <span className="text-[10px] text-forest-500">{product.height}</span>}
                          {product.bgRemoved && <span className="text-[10px] text-purple-400 flex items-center gap-0.5"><Sparkles size={9}/>bg removed</span>}
                          {product.localImagePath && !product.bgRemoved && <span className="text-[10px] text-blue-400 flex items-center gap-0.5"><Download size={9}/>image saved</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {product.status === 'pending' && (
                          <button onClick={()=>handleStatusChange(product.id,'rejected')} title="Reject"
                            className="w-6 h-6 rounded flex items-center justify-center text-forest-600 hover:text-red-400 hover:bg-red-900/30">
                            <X size={12}/>
                          </button>
                        )}
                        <button onClick={()=>handleDeleteScraped(product.id)} title="Delete"
                          className="w-6 h-6 rounded flex items-center justify-center text-forest-600 hover:text-red-400">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ IMAGES TAB ══════ */}
        {tab === 'images' && (
          <div className="pt-2">
            <div className="bg-forest-900 rounded-2xl border border-forest-800 p-5 mb-4">
              <h3 className="text-[14px] font-bold text-white mb-1 flex items-center gap-2"><Sparkles size={15} className="text-purple-400"/>Image Processing Pipeline</h3>
              <p className="text-forest-400 text-[12px] mb-3">Download images from scraped products and optionally remove backgrounds using remove.bg API.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
                <div className="bg-forest-800 rounded-xl p-3">
                  <div className="text-forest-300 font-semibold mb-1">Step 1: Scrape</div>
                  <div className="text-forest-500">Use the Scraper tab to collect products with image URLs</div>
                </div>
                <div className="bg-forest-800 rounded-xl p-3">
                  <div className="text-purple-300 font-semibold mb-1">Step 2: Process</div>
                  <div className="text-forest-500">Download images. With REMOVE_BG_API_KEY set, backgrounds are removed automatically</div>
                </div>
                <div className="bg-forest-800 rounded-xl p-3">
                  <div className="text-emerald-300 font-semibold mb-1">Step 3: Import</div>
                  <div className="text-forest-500">Import processed products to your catalog with clean transparent images</div>
                </div>
              </div>

              {!process.env.REMOVE_BG_API_KEY && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-900/30 border border-amber-800 text-amber-300 text-[12px]">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>
                  <div>Add <code className="font-mono bg-amber-900/50 px-1 rounded">REMOVE_BG_API_KEY=your_key</code> to .env.local to enable background removal. Get a free key at <a href="https://www.remove.bg/api" target="_blank" rel="noopener" className="underline">remove.bg</a> (50 free/month).</div>
                </div>
              )}
            </div>

            <div className="bg-forest-900 rounded-2xl border border-forest-800">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-forest-800">
                <h3 className="text-[13px] font-bold text-white">{pendingImages.length} products with unprocessed images</h3>
                <button onClick={fetchScraped} className="w-7 h-7 flex items-center justify-center rounded-lg bg-forest-800 hover:bg-forest-700 text-forest-400"><RefreshCw size={13}/></button>
              </div>

              {pendingImages.length === 0 ? (
                <div className="text-center py-16 text-forest-500">
                  <ImageIcon size={32} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-[13px]">No pending images. Scrape some products first.</p>
                </div>
              ) : (
                <div className="divide-y divide-forest-800">
                  {pendingImages.map(product => {
                    const result = processResults[product.id] || (product.localImagePath ? { path: product.localImagePath, bgRemoved: product.bgRemoved ?? false } : null);
                    const isProcessing = processingId === product.id;
                    return (
                      <div key={product.id} className="flex items-center gap-4 px-5 py-3">
                        {/* Before */}
                        <div className="flex-shrink-0">
                          <div className="text-[9px] text-forest-600 mb-1 uppercase">Original</div>
                          <div className="w-16 h-16 rounded-lg bg-forest-800 overflow-hidden">
                            {(product.localImagePath || product.imageUrls[0]) && <img src={product.localImagePath || product.imageUrls[0]} alt="" className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
                          </div>
                        </div>

                        <div className="text-forest-600">→</div>

                        {/* After */}
                        <div className="flex-shrink-0">
                          <div className="text-[9px] text-forest-600 mb-1 uppercase">Processed</div>
                          <div className="w-16 h-16 rounded-lg bg-forest-800 overflow-hidden" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\'%3E%3Crect width=\'4\' height=\'4\' fill=\'%23374151\'/%3E%3Crect x=\'4\' y=\'4\' width=\'4\' height=\'4\' fill=\'%23374151\'/%3E%3C/svg%3E")'}}>
                            {result && <img src={result.path} alt="" className="w-full h-full object-contain"/>}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-white truncate">{product.title}</div>
                          <div className="text-[11px] text-forest-500">{product.sellerName}</div>
                          {result && <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${result.bgRemoved?'text-purple-400':'text-blue-400'}`}>{result.bgRemoved?<><Sparkles size={9}/>Background removed</>:<><Download size={9}/>Image downloaded</>}</div>}
                        </div>

                        <button onClick={()=>handleRemoveBg(product)} disabled={isProcessing||!!result}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${result?'bg-forest-800 text-forest-600 cursor-default':'bg-purple-700 hover:bg-purple-600 text-white'} disabled:opacity-60`}>
                          {isProcessing ? <Loader2 size={13} className="animate-spin"/> : result ? <Check size={13}/> : <Sparkles size={13}/>}
                          {isProcessing ? 'Processing…' : result ? 'Done' : 'Process image'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          {/* ── Google Image Search ── */}
          <div className="mt-6">
            <div className="bg-forest-900 rounded-2xl border border-forest-800 p-5 mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[14px] font-bold text-white mb-1 flex items-center gap-2"><Wand2 size={15} className="text-amber-400"/>Auto Plant Images + BG Remove</h3>
                  <p className="text-forest-400 text-[12px]">Searches DuckDuckGo and Bing for "{'{'}plant name{'}'} without background" — no API keys. Downloads the result and strips the background with local AI. These images appear <strong className="text-forest-200">only in the garden builder</strong>, not in the catalog.</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <button onClick={handleGoogleBulk} disabled={googleBulking}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-[12px] font-semibold disabled:opacity-60 whitespace-nowrap">
                    {googleBulking ? <Loader2 size={13} className="animate-spin"/> : <Wand2 size={13}/>}
                    {googleBulking ? 'Fetching…' : 'Fetch next 10'}
                  </button>
                  {googleBulkStatus && (
                    <div className="text-[11px] text-forest-400 text-right">
                      {googleBulkStatus.done}/{googleBulkStatus.total} done · {googleBulkStatus.remaining} remaining
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-forest-800/60 border border-forest-700 text-forest-400 text-[12px]">
                <Check size={14} className="flex-shrink-0 mt-0.5 text-emerald-500"/>
                <div>Works out of the box — no API keys needed. Searches iNaturalist, Wikipedia, and GBIF. Background removal runs locally using AI (first run downloads ~30 MB model, cached after). Optionally set <code className="font-mono bg-forest-700 px-1 rounded text-forest-200">REMOVE_BG_API_KEY</code> for faster cloud removal.</div>
              </div>
            </div>

            <div className="bg-forest-900 rounded-2xl border border-forest-800">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-forest-800">
                <h3 className="text-[13px] font-bold text-white">
                  {Object.keys(googleImages).length} of {marketplaceGroups.length} plants have Google images
                </h3>
                <button onClick={fetchGoogleImages} className="w-7 h-7 flex items-center justify-center rounded-lg bg-forest-800 hover:bg-forest-700 text-forest-400"><RefreshCw size={13}/></button>
              </div>

              {marketplaceGroups.length === 0 ? (
                <div className="text-center py-12 text-forest-500 text-[13px]">No marketplace data. Scrape some plants first.</div>
              ) : (
                <div className="divide-y divide-forest-800 max-h-[500px] overflow-y-auto">
                  {marketplaceGroups.map(group => {
                    const googlePath = googleImages[group.slug];
                    const isFetching = googleFetchingSlug === group.slug;
                    return (
                      <div key={group.slug} className="flex items-center gap-3 px-5 py-2.5">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-forest-800 flex-shrink-0 overflow-hidden"
                          style={{backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\'%3E%3Crect width=\'4\' height=\'4\' fill=\'%23374151\'/%3E%3Crect x=\'4\' y=\'4\' width=\'4\' height=\'4\' fill=\'%23374151\'/%3E%3C/svg%3E")'}}>
                          {googlePath && <img src={googlePath} alt="" className="w-full h-full object-contain" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-white truncate">{group.canonicalName}</div>
                          <div className="text-[10px] text-forest-500 truncate">{group.latinName || group.slug}</div>
                          {googlePath && <div className="text-[10px] text-amber-400 flex items-center gap-0.5 mt-0.5"><Wand2 size={9}/>Google image ready</div>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {googlePath && (
                            <button onClick={()=>handleGoogleDelete(group.slug)} title="Remove Google image"
                              className="w-6 h-6 rounded flex items-center justify-center text-forest-600 hover:text-red-400">
                              <X size={12}/>
                            </button>
                          )}
                          <button onClick={()=>handleGoogleFetch(group)} disabled={isFetching}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-60 ${googlePath ? 'bg-forest-800 text-forest-400 hover:bg-forest-700 hover:text-white' : 'bg-amber-700 hover:bg-amber-600 text-white'}`}>
                            {isFetching ? <Loader2 size={11} className="animate-spin"/> : <Wand2 size={11}/>}
                            {isFetching ? 'Fetching…' : googlePath ? 'Re-fetch' : 'Fetch'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </div>
        )}
      </div>

      {/* ══════ EDIT MODAL ══════ */}
      <AnimatePresence>
        {editTree && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
            style={{background:'rgba(5,12,6,0.85)',backdropFilter:'blur(8px)'}}
            onClick={e=>{if(e.target===e.currentTarget)setEditTree(null)}}>
            <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
              transition={{duration:0.35,ease:[0.16,1,0.3,1]}}
              className="w-full max-w-2xl bg-forest-900 rounded-3xl border border-forest-800 shadow-2xl my-4"
              onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-forest-800">
                <div>
                  <h2 className="text-white font-bold text-base">{isNew?'Add new tree':`Edit: ${editTree.name}`}</h2>
                  <p className="text-forest-400 text-[11px]">{isNew?'Fill in details and upload an image.':'Changes save immediately to the catalog.'}</p>
                </div>
                <button onClick={()=>setEditTree(null)} className="w-8 h-8 rounded-full bg-forest-800 flex items-center justify-center text-forest-400 hover:text-white"><X size={15}/></button>
              </div>
              <div className="p-6 space-y-4">
                {/* Image */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-2">Image</label>
                  <div className="relative h-32 rounded-2xl border-2 border-dashed border-forest-700 hover:border-forest-500 flex items-center justify-center cursor-pointer overflow-hidden" onClick={()=>fileRef.current?.click()}>
                    {imagePreview ? (<><img src={imagePreview} alt="preview" className="h-full w-full object-contain"/><div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-white text-[12px] flex items-center gap-1"><Upload size={13}/>Change</span></div></>) : (
                      <div className="text-center text-forest-500"><ImageIcon size={24} className="mx-auto mb-1.5 opacity-40"/><p className="text-[11px]">Click to upload PNG, JPG, WebP</p></div>
                    )}
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleImageChange(f)}}/>
                  </div>
                </div>
                {/* Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <F label="Tree ID (slug)" value={editTree.id||''} onChange={v=>setEditTree(t=>t?{...t,id:v.toLowerCase().replace(/\s/g,'-')}:t)} placeholder="red-oak" disabled={!isNew}/>
                  <F label="Common name" value={editTree.name||''} onChange={v=>setEditTree(t=>t?{...t,name:v}:t)} placeholder="Red Oak"/>
                  <F label="Latin name" value={editTree.latin||''} onChange={v=>setEditTree(t=>t?{...t,latin:v}:t)} placeholder="Quercus rubra"/>
                  <F label="Height" value={editTree.height||''} onChange={v=>setEditTree(t=>t?{...t,height:v}:t)} placeholder="5–10 m"/>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">Category</label>
                    <select value={editTree.category} onChange={e=>setEditTree(t=>t?{...t,category:e.target.value as TreeCategory}:t)} className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500">
                      {CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">Size</label>
                    <select value={editTree.size} onChange={e=>setEditTree(t=>t?{...t,size:e.target.value as TreeSize}:t)} className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500">
                      {SIZES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">Price (€)</label>
                    <input type="number" min={0} max={99999} value={editTree.price||0} onChange={e=>setEditTree(t=>t?{...t,price:Number(e.target.value)}:t)} className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500"/>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">Accent colour</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={editTree.color||'#508153'} onChange={e=>setEditTree(t=>t?{...t,color:e.target.value}:t)} className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"/>
                      <span className="text-forest-400 text-[12px] font-mono">{editTree.color}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">Description</label>
                  <textarea value={editTree.description||''} onChange={e=>setEditTree(t=>t?{...t,description:e.target.value}:t)} rows={2} className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500 resize-none"/>
                </div>
                {/* Care */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">Care Guide</div>
                  <div className="space-y-2">
                    {CARE_KEYS.map(key=>(
                      <div key={key}>
                        <label className="block text-[10px] text-forest-500 mb-1">{CARE_LABELS[key]}</label>
                        <textarea value={editTree.care[key]||''} onChange={e=>setEditTree(t=>t?{...t,care:{...t.care,[key]:e.target.value}}:t)} rows={1} className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[12px] outline-none focus:ring-2 focus:ring-forest-500 resize-none"/>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-[14px] disabled:opacity-60">
                    {saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}{saving?'Saving…':isNew?'Add to catalog':'Save changes'}
                  </button>
                  <button onClick={()=>{setEditTree(null);setImageFile(null);setImagePreview('');}} className="px-5 py-3 rounded-xl bg-forest-800 hover:bg-forest-700 text-forest-300 text-[14px]">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string,string> = { pending:'bg-amber-900/50 text-amber-300 border-amber-800', imported:'bg-emerald-900/50 text-emerald-300 border-emerald-800', rejected:'bg-red-900/50 text-red-300 border-red-800', processed:'bg-blue-900/50 text-blue-300 border-blue-800' };
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${map[status]||'bg-forest-800 text-forest-400'}`}>{status}</span>;
}

function F({ label, value, onChange, placeholder, disabled }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; disabled?:boolean }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-40 placeholder:text-forest-600"/>
    </div>
  );
}
