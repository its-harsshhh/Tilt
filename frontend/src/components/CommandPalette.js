import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Loader2, Shield, Lightbulb, Zap, Copy, Check, RotateCcw } from 'lucide-react';
import { getPreferredStyle, getInsightText, getMemory, saveDecision } from '../hooks/useMemory';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CommandPalette({ isOpen, onClose, screenContext }) {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('input');
  const [decisions, setDecisions] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  const insight = getInsightText();

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
    if (!isOpen) {
      setPhase('input'); setInput(''); setDecisions(null);
      setSelectedType(null); setError(null); setCopied(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    setPhase('loading'); setError(null);
    const memory = getMemory();
    const preferred = getPreferredStyle();
    try {
      const res = await fetch(`${API_URL}/api/generate-decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_text: input.trim(), context: screenContext || null,
          user_preference: preferred !== 'smart' ? preferred : null,
          tone_traits: memory.toneTraits.length > 0 ? memory.toneTraits : null,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Failed'); }
      const data = await res.json();
      setDecisions(data); setPhase('decisions');
    } catch (err) { setError(err.message); setPhase('input'); }
  };

  const handleSelect = (type) => {
    setSelectedType(type);
    saveDecision(type, input, decisions[type]?.response);
    setPhase('output');
  };

  const handleCopy = async () => {
    const text = decisions?.[selectedType]?.response || '';
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement('textarea'); el.value = text;
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setPhase('input'); setInput(''); setDecisions(null);
    setSelectedType(null); setCopied(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (!isOpen) return null;
  const preferred = getPreferredStyle();
  const cardConfig = {
    safe:  { icon: Shield, accent: 'text-slate-400', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]' },
    smart: { icon: Lightbulb, accent: 'text-slate-200', bg: 'bg-white/[0.06]', border: 'border-white/[0.12]' },
    bold:  { icon: Zap, accent: 'text-amber-400', bg: 'bg-white/[0.08]', border: 'border-white/[0.15]' },
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh]"
      data-testid="command-palette-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div className="relative z-10 w-full max-w-2xl mx-6 animate-zoom-in" data-testid="command-palette-modal">

        {/* ── Spotlight Search Bar ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(30,41,59,0.85) 0%, rgba(15,23,42,0.95) 100%)',
            backdropFilter: 'blur(48px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(48px) saturate(1.4)',
            border: '1px solid rgba(148,163,184,0.12)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
          }}
        >
          {/* Search input row */}
          <div className="flex items-center gap-3 px-5 py-1">
            <Search size={18} className="text-slate-500 flex-shrink-0" strokeWidth={2} />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What do you want to do here?"
              data-testid="decision-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
              }}
              className="flex-1 bg-transparent border-none text-[15px] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 py-3.5 font-body"
            />
            {input.trim() && phase === 'input' && (
              <button onClick={handleSubmit} data-testid="submit-decision-btn"
                className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/[0.08] text-[11px] text-white/50 font-medium font-body hover:bg-white/15 transition-colors">
                Return ↵
              </button>
            )}
            {phase === 'loading' && <Loader2 size={18} className="text-slate-500 animate-spin flex-shrink-0" />}
            <button onClick={onClose} data-testid="close-palette-btn"
              className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0">
              <X size={12} className="text-white/30" />
            </button>
          </div>

          {error && <p className="px-5 pb-2 text-red-400/80 font-mono text-xs" data-testid="error-message">{error}</p>}

          {/* Insight chip */}
          {insight && phase === 'input' && (
            <div className="px-5 pb-3" data-testid="insight-bar">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/[0.08] border border-indigo-400/10">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
                <span className="text-[10px] text-indigo-300/50 font-medium">{insight}</span>
              </div>
            </div>
          )}

          {/* Results */}
          {(phase === 'loading' || phase === 'decisions' || phase === 'output') && (
            <div className="border-t border-white/[0.06] px-4 py-3 max-h-[50vh] overflow-y-auto">

              {/* Loading shimmer */}
              {phase === 'loading' && (
                <div className="flex flex-col gap-0.5" data-testid="loading-state">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-10 rounded-lg skeleton-pulse" />
                  ))}
                </div>
              )}

              {/* Decision cards — compact rows */}
              {phase === 'decisions' && decisions && (
                <div className="flex flex-col gap-0 animate-slide-up" data-testid="decision-cards">
                  {['safe', 'smart', 'bold'].map((type) => {
                    const c = cardConfig[type]; const Icon = c.icon;
                    const d = decisions[type]; const isPref = type === preferred;
                    return (
                      <button key={type} onClick={() => handleSelect(type)} data-testid={`decision-card-${type}`}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                          hover:bg-white/[0.05] transition-colors cursor-pointer
                          ${isPref ? 'bg-indigo-500/[0.06]' : ''}`}>
                        <Icon size={14} className={c.accent} strokeWidth={1.5} />
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${c.accent} w-10 text-left flex-shrink-0`}>
                          {d?.label}
                        </span>
                        <span className="text-[13px] text-white/45 truncate flex-1 text-left">{d?.response}</span>
                        {isPref && (
                          <span className="text-[9px] font-medium text-indigo-400/50 bg-indigo-400/[0.08] px-1.5 py-0.5 rounded flex-shrink-0"
                            data-testid={`preferred-badge-${type}`}>preferred</span>
                        )}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/15 flex-shrink-0">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Output */}
              {phase === 'output' && decisions && selectedType && (
                <div className="animate-slide-up" data-testid="output-view">
                  <div className="flex items-center gap-2 mb-3">
                    {React.createElement(cardConfig[selectedType].icon, { size: 13, className: cardConfig[selectedType].accent, strokeWidth: 1.5 })}
                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${cardConfig[selectedType].accent}`}>
                      {decisions[selectedType]?.label} Response
                    </span>
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3.5 mb-3" data-testid="output-response">
                    <p className="text-[14px] text-white/85 leading-relaxed font-body">{decisions[selectedType]?.response}</p>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <button onClick={handleCopy} data-testid="copy-response-btn"
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[12px] font-medium transition-all
                        ${copied ? 'bg-green-500/10 border-green-400/20 text-green-400' : 'bg-white/[0.06] border-white/[0.08] text-white/50 hover:bg-white/[0.1]'}`}>
                      {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                    <button onClick={handleReset} data-testid="new-decision-btn"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/30 text-[12px] font-medium hover:bg-white/[0.06] transition-all">
                      <RotateCcw size={13} /> New
                    </button>
                  </div>
                  {decisions.reasoning?.[selectedType] && (
                    <div className="border-t border-white/[0.04] pt-2.5" data-testid="reasoning-section">
                      <p className="text-[11px] text-white/25 italic leading-relaxed">{decisions.reasoning[selectedType]}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex justify-center mt-3">
          <span className="font-mono text-[10px] text-white/15 tracking-widest uppercase">esc to close</span>
        </div>
      </div>
    </div>
  );
}
