'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Leaf, ChevronDown, RotateCcw } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  'Gyvatvorė privatumui, vėjuota pakrantė',
  '3 vaisiniai medžiai mažam sodui',
  'Geriausi medžiai Lietuvos žiemoms',
  'Greitai augantys medžiai pavėsiui?',
];

const WELCOME = `Sveiki! 🌳 Esu jūsų sodo patarėjas MB Plant House. Papasakokite apie savo sodą — dydis, vieta, apšvietimas — ir rekomenduosiu tinkamiausius augalus.

*You can also write in English or Russian.*`;

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: WELCOME }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const reset = () => {
    setMessages([{ role: 'assistant', content: WELCOME }]);
    setError('');
    setInput('');
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-[400] w-14 h-14 rounded-full shadow-2xl shadow-forest-900/30 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#2d5a12,#508153)' }}
        aria-label="Atidaryti sodo patarėją"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}><X size={22} className="text-white"/></motion.div>
            : <motion.div key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}><Sparkles size={22} className="text-white"/></motion.div>}
        </AnimatePresence>
        {!open && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white animate-pulse"/>}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-4 sm:right-6 z-[399] w-[calc(100vw-2rem)] sm:w-[390px] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
            style={{ maxHeight: '70dvh', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3.5" style={{ background: 'linear-gradient(135deg,#1e3d16,#3b6d11)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Leaf size={16} className="text-white"/>
                </div>
                <div>
                  <div className="text-white font-bold text-[13px] leading-tight">Sodo patarėjas</div>
                  <div className="text-white/50 text-[10px]">MB Plant House · AI</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={reset} title="Naujas pokalbis" className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                  <RotateCcw size={12}/>
                </button>
                <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                  <ChevronDown size={14}/>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0" style={{ background: 'linear-gradient(135deg,#3b6d11,#508153)' }}>
                      <Leaf size={12} className="text-white"/>
                    </div>
                  )}
                  <div className={`max-w-[84%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-forest-900 text-white rounded-br-sm'
                      : 'bg-forest-50 text-forest-900 border border-forest-200/60 rounded-bl-sm'
                  }`}>
                    <span dangerouslySetInnerHTML={{ __html: m.content
                      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                      .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
                      .replace(/\*([^*]+)\*/g,'<em>$1</em>')
                      .replace(/_(.*?)_/g,'<em>$1</em>')
                      .replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener" style="color:#3b6d11;text-decoration:underline;word-break:break-all">$1</a>')
                      .replace(/• /g,'&bull; ')
                    }} />
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 mr-2 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3b6d11,#508153)' }}>
                    <Leaf size={12} className="text-white"/>
                  </div>
                  <div className="bg-forest-50 border border-forest-200/60 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }}/>)}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mx-2 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  ⚠ {error}
                  {error.includes('ANTHROPIC_API_KEY') && (
                    <div className="mt-1 text-[11px] text-red-500">Add <code className="font-mono bg-red-100 px-1 rounded">ANTHROPIC_API_KEY=sk-ant-...</code> to your <code>.env.local</code> file and restart the server.</div>
                  )}
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)} className="flex-shrink-0 px-2.5 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-[11px] text-forest-700 hover:bg-forest-100 transition-colors whitespace-nowrap">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-forest-100">
              <div className="flex items-end gap-2 bg-forest-50 rounded-2xl border border-forest-200 px-3 py-2 focus-within:border-forest-400 transition-colors">
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder="Klauskite apie augalus, sodinimą, priežiūrą…" rows={1} maxLength={500}
                  className="flex-1 bg-transparent text-[13px] text-forest-900 placeholder:text-forest-400 outline-none resize-none leading-relaxed"
                  style={{ maxHeight: 80 }}/>
                <button onClick={() => send(input)} disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{ background: input.trim() && !loading ? 'linear-gradient(135deg,#2d5a12,#508153)' : '#e5e7eb' }}>
                  <Send size={14} className={input.trim() && !loading ? 'text-white' : 'text-gray-400'}/>
                </button>
              </div>
              <p className="text-[10px] text-forest-400 text-center mt-1">Enter — siųsti · Shift+Enter — nauja eilutė</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
