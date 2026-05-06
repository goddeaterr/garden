'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Upload, Eye, EyeOff, LogOut, TreePine, Check, X,
  Loader2, AlertCircle, Image as ImageIcon, Save,
} from 'lucide-react';
import type { Tree, TreeCategory, TreeSize } from '@/types';
import { bustTreeCache } from '@/lib/useTrees';
import { BrandedSpinner } from '@/components/ui/BrandedSpinner';

const CATS: TreeCategory[] = ['fruit', 'decorative', 'evergreen', 'shrub'];
const SIZES: TreeSize[] = ['small', 'medium', 'large'];
const CARE_KEYS = ['watering','sunlight','soil','pruning','hardiness','spacing','growthRate','notes'] as const;
const CARE_LABELS: Record<string, string> = {
  watering: 'Watering', sunlight: 'Sunlight', soil: 'Soil', pruning: 'Pruning',
  hardiness: 'Hardiness', spacing: 'Spacing', growthRate: 'Growth Rate', notes: 'Notes',
};

function emptyForm(): Partial<Tree> & { care: Tree['care'] } {
  return {
    id: '', name: '', latin: '', category: 'fruit', size: 'medium', price: 0,
    height: '', description: '', color: '#508153', bloom: '',
    care: { watering:'', sunlight:'', soil:'', pruning:'', hardiness:'', spacing:'', growthRate:'', notes:'' },
  };
}

const fmt = (n: number) => `€${n.toFixed(0)}`;

export default function AdminPage() {
  /* auth */
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [session, setSession] = useState('');

  /* trees */
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loadingTrees, setLoadingTrees] = useState(false);
  const [editTree, setEditTree] = useState<(Partial<Tree> & { care: Tree['care'] }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* alerts */
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const ah = () => ({ 'Authorization': `Bearer ${session}`, 'Content-Type': 'application/json' });

  /* ── auth ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true); setAuthError('');
    try {
      const r = await fetch('/api/admin/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const d = await r.json();
      if (!r.ok) { setAuthError(d.error || 'Login failed'); return; }
      setSession(d.session); setAuthed(true);
      sessionStorage.setItem('admin_session', d.session);
    } catch { setAuthError('Network error'); } finally { setAuthLoading(false); }
  };

  useEffect(() => {
    const s = sessionStorage.getItem('admin_session');
    if (s) { setSession(s); setAuthed(true); }
  }, []);

  /* ── trees ── */
  const fetchTrees = async () => {
    setLoadingTrees(true);
    try {
      const r = await fetch('/api/admin/trees', { headers: { 'Authorization': `Bearer ${session}` } });
      if (r.ok) { setTrees(await r.json()); bustTreeCache(); }
    } catch {} finally { setLoadingTrees(false); }
  };

  useEffect(() => { if (authed && session) fetchTrees(); }, [authed, session]);

  /* ── tree CRUD ── */
  const handleImageChange = (file: File) => {
    setImageFile(file);
    const r = new FileReader(); r.onload = e => setImagePreview(e.target?.result as string); r.readAsDataURL(file);
  };

  // Compress image client-side and return base64 data URL — no filesystem needed
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 480;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = url;
    });

  const uploadImage = async (_treeId: string): Promise<string | null> => {
    if (!imageFile) return editTree?.imagePath || null;
    return compressImage(imageFile);
  };

  const handleSave = async () => {
    if (!editTree) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const id = editTree.id?.trim().toLowerCase().replace(/\s+/g, '-') || '';
      if (!id) throw new Error('ID is required');
      if (!editTree.name?.trim()) throw new Error('Name is required');
      const imagePath = await uploadImage(id);
      const payload = { ...editTree, id, imagePath: imagePath || `/trees/${id}.png` };
      const r = await fetch('/api/admin/trees', { method: isNew ? 'POST' : 'PUT', headers: ah(), body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed');
      setSuccess(isNew ? 'Tree added!' : 'Tree updated!');
      setEditTree(null); setImageFile(null); setImagePreview('');
      fetchTrees();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    const r = await fetch(`/api/admin/trees?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${session}` } });
    if (!r.ok) { setError((await r.json()).error); return; }
    setSuccess('Deleted.'); setDeleteConfirm(null); fetchTrees();
  };

  const logout = () => { sessionStorage.removeItem('admin_session'); setAuthed(false); setSession(''); setPassword(''); };

  /* ── login screen ── */
  if (!authed) return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-2xl bg-forest-700 flex items-center justify-center"><TreePine size={22} className="text-forest-100" /></div>
          <div><div className="text-white font-bold text-lg">MB Plant House</div><div className="text-forest-400 text-[11px] tracking-wider uppercase">Admin Panel</div></div>
        </div>
        <div className="bg-forest-900 rounded-3xl p-8 border border-forest-800">
          <h1 className="text-white font-semibold text-xl mb-1">Welcome back</h1>
          <p className="text-forest-400 text-sm mb-6">Enter your admin password.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Admin password" autoComplete="current-password"
                className="w-full bg-forest-800 border border-forest-700 rounded-xl px-4 py-3 text-white placeholder:text-forest-500 outline-none focus:ring-2 focus:ring-forest-500 pr-12 text-[14px]"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {authError && <p className="text-red-400 text-[13px] flex items-center gap-1.5"><AlertCircle size={13} />{authError}</p>}
            <button type="submit" disabled={authLoading || !password} className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-[14px] disabled:opacity-50 flex items-center justify-center gap-2">
              {authLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {authLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );

  /* ── main UI ── */
  return (
    <div className="min-h-screen bg-forest-950 text-white">
      {/* Header */}
      <div className="border-b border-forest-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest-700 flex items-center justify-center"><TreePine size={16} className="text-forest-100" /></div>
            <span className="font-bold text-white text-sm">MB Plant House</span>
          </div>
          <span className="text-forest-500 text-[12px] hidden sm:inline">Tree Catalog</span>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-forest-400 hover:text-white text-[12px] transition-colors"><LogOut size={13} />Logout</button>
      </div>

      {/* Alerts */}
      <div className="px-6 pt-3">
        <AnimatePresence>
          {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-[13px]"><Check size={13} />{success}<button onClick={() => setSuccess('')} className="ml-auto"><X size={13} /></button></motion.div>}
          {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-[13px]"><AlertCircle size={13} />{error}<button onClick={() => setError('')} className="ml-auto"><X size={13} /></button></motion.div>}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-10">
        {/* Trees */}
        <div>
          <div className="flex items-center justify-between mb-5 pt-2">
            <h2 className="text-lg font-bold">{trees.length} tree{trees.length !== 1 ? 's' : ''} in catalog</h2>
            <button
              onClick={() => { setEditTree(emptyForm()); setIsNew(true); setImageFile(null); setImagePreview(''); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white text-[13px] font-semibold transition-colors"
            >
              <Plus size={15} />Add tree
            </button>
          </div>

          {loadingTrees
            ? <div className="flex justify-center py-16"><BrandedSpinner size={56} label="Loading trees…" /></div>
            : trees.length === 0
              ? (
                <div className="text-center py-20 text-forest-500">
                  <TreePine size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No trees yet. Add one using the button above.</p>
                </div>
              )
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {trees.map(tree => (
                    <div key={tree.id} className="bg-forest-900 rounded-2xl border border-forest-800 overflow-hidden">
                      <div className="h-28 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg,${tree.color}22,${tree.color}08)` }}>
                        {tree.imagePath
                          ? <img src={tree.imagePath} alt={tree.name} className="h-full w-full object-contain p-2" />
                          : <div className="text-4xl">🌳</div>}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: `${tree.color}33`, color: tree.color }}>{tree.category}</span>
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-white text-[13px] leading-tight">{tree.name}</h3>
                          <span className="text-white font-bold text-[13px] tabular-nums">{fmt(tree.price)}</span>
                        </div>
                        <p className="text-forest-400 text-[11px] leading-snug line-clamp-2">{tree.description}</p>
                        <div className="flex gap-2 mt-2.5">
                          <button
                            onClick={() => { setEditTree({ ...tree, care: tree.care || emptyForm().care }); setIsNew(false); setImagePreview(tree.imagePath || ''); setImageFile(null); }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-forest-800 hover:bg-forest-700 text-[11px] text-forest-200 transition-colors"
                          ><Pencil size={11} />Edit</button>
                          <button
                            onClick={() => handleDelete(tree.id)}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] transition-colors ${deleteConfirm === tree.id ? 'bg-red-700 text-white' : 'bg-forest-800 hover:bg-red-900/50 text-forest-200 hover:text-red-300'}`}
                          ><Trash2 size={11} />{deleteConfirm === tree.id ? 'Confirm' : 'Delete'}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
          }
        </div>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editTree && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
            style={{ background: 'rgba(5,12,6,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setEditTree(null); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl bg-forest-900 rounded-3xl border border-forest-800 shadow-2xl my-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-forest-800">
                <div>
                  <h2 className="text-white font-bold text-base">{isNew ? 'Add new tree' : `Edit: ${editTree.name}`}</h2>
                  <p className="text-forest-400 text-[11px]">{isNew ? 'Fill in details and upload an image.' : 'Changes save immediately to the catalog.'}</p>
                </div>
                <button onClick={() => setEditTree(null)} className="w-8 h-8 rounded-full bg-forest-800 flex items-center justify-center text-forest-400 hover:text-white"><X size={15} /></button>
              </div>
              <div className="p-6 space-y-4">
                {/* Image upload */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-2">Image</label>
                  <div
                    className="relative h-32 rounded-2xl border-2 border-dashed border-forest-700 hover:border-forest-500 flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => fileRef.current?.click()}
                  >
                    {imagePreview
                      ? (<><img src={imagePreview} alt="preview" className="h-full w-full object-contain" /><div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-white text-[12px] flex items-center gap-1"><Upload size={13} />Change</span></div></>)
                      : (<div className="text-center text-forest-500"><ImageIcon size={24} className="mx-auto mb-1.5 opacity-40" /><p className="text-[11px]">Click to upload PNG, JPG, WebP</p></div>)
                    }
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageChange(f); }} />
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <F label="Tree ID (slug)" value={editTree.id || ''} onChange={v => setEditTree(t => t ? { ...t, id: v.toLowerCase().replace(/\s/g, '-') } : t)} placeholder="red-oak" disabled={!isNew} />
                  <F label="Common name" value={editTree.name || ''} onChange={v => setEditTree(t => t ? { ...t, name: v } : t)} placeholder="Red Oak" />
                  <F label="Latin name" value={editTree.latin || ''} onChange={v => setEditTree(t => t ? { ...t, latin: v } : t)} placeholder="Quercus rubra" />
                  <F label="Height" value={editTree.height || ''} onChange={v => setEditTree(t => t ? { ...t, height: v } : t)} placeholder="5–10 m" />
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">Category</label>
                    <select value={editTree.category} onChange={e => setEditTree(t => t ? { ...t, category: e.target.value as TreeCategory } : t)} className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500">
                      {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">Size</label>
                    <select value={editTree.size} onChange={e => setEditTree(t => t ? { ...t, size: e.target.value as TreeSize } : t)} className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500">
                      {SIZES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">Price (€)</label>
                    <input type="number" min={0} max={99999} value={editTree.price || 0} onChange={e => setEditTree(t => t ? { ...t, price: Number(e.target.value) } : t)} className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">Accent colour</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={editTree.color || '#508153'} onChange={e => setEditTree(t => t ? { ...t, color: e.target.value } : t)} className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent" />
                      <span className="text-forest-400 text-[12px] font-mono">{editTree.color}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">Description</label>
                  <textarea value={editTree.description || ''} onChange={e => setEditTree(t => t ? { ...t, description: e.target.value } : t)} rows={2} className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500 resize-none" />
                </div>

                {/* Care guide */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">Care Guide</div>
                  <div className="space-y-2">
                    {CARE_KEYS.map(key => (
                      <div key={key}>
                        <label className="block text-[10px] text-forest-500 mb-1">{CARE_LABELS[key]}</label>
                        <textarea value={editTree.care[key] || ''} onChange={e => setEditTree(t => t ? { ...t, care: { ...t.care, [key]: e.target.value } } : t)} rows={1} className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[12px] outline-none focus:ring-2 focus:ring-forest-500 resize-none" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-[14px] disabled:opacity-60">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving…' : isNew ? 'Add to catalog' : 'Save changes'}
                  </button>
                  <button onClick={() => { setEditTree(null); setImageFile(null); setImagePreview(''); }} className="px-5 py-3 rounded-xl bg-forest-800 hover:bg-forest-700 text-forest-300 text-[14px]">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function F({ label, value, onChange, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className="w-full bg-forest-800 border border-forest-700 rounded-xl px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-40 placeholder:text-forest-600" />
    </div>
  );
}
