import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Search, Shield, Lightbulb, Zap, Copy, Check, Eye } from 'lucide-react';
import { getPreferredStyle, getInsightText, getMemory, saveDecision } from '../hooks/useMemory';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CommandPalette({ isOpen, onClose, screenContext }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('chat');
  const [decisions, setDecisions] = useState(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [copied, setCopied] = useState(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const insight = getInsightText();

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
    if (!isOpen) {
      setInput(''); setMessages([]); setLoading(false);
      setError(null); setMode('chat'); setDecisions(null);
      setActiveIdx(-1); setCopied(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, decisions]);

  const handleCopy = useCallback(async (text, id) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement('textarea'); el.value = text;
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  }, []);

  const sendChat = useCallback(async (text) => {
    const userMsg = { role: 'user', content: text.trim(), id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setLoading(true); setError(null); setDecisions(null);
    const memory = getMemory();
    const preferred = getPreferredStyle();
    try {
      const conversation = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_URL}/api/tilt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(), screen_context: screenContext || null, conversation,
          user_preference: preferred !== 'smart' ? preferred : null,
          tone_traits: memory.toneTraits.length > 0 ? memory.toneTraits : null,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Failed'); }
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.instruction || '', id: Date.now() + 1 }]);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [messages, screenContext]);

  const sendDecide = useCallback(async (text) => {
    const userMsg = { role: 'user', content: text.trim(), id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setLoading(true); setError(null); setDecisions(null); setActiveIdx(-1);
    const memory = getMemory();
    const preferred = getPreferredStyle();
    try {
      const res = await fetch(`${API_URL}/api/generate-decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_text: text.trim(), context: screenContext || null,
          user_preference: preferred !== 'smart' ? preferred : null,
          tone_traits: memory.toneTraits.length > 0 ? memory.toneTraits : null,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Failed'); }
      const data = await res.json();
      setDecisions(data);
      const types = ['safe', 'smart', 'bold'];
      setActiveIdx(types.indexOf(preferred) >= 0 ? types.indexOf(preferred) : 1);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [screenContext]);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    if (mode === 'decide') sendDecide(input); else sendChat(input);
  }, [input, mode, sendChat, sendDecide]);

  const handleSelectDecision = useCallback((type) => {
    if (!decisions) return;
    saveDecision(type, messages[messages.length - 1]?.content || '', decisions[type]?.response);
    setMessages(prev => [...prev, {
      role: 'assistant', content: decisions[type]?.response, id: Date.now(),
      decisionType: type, reasoning: decisions?.reasoning?.[type],
    }]);
    setDecisions(null); setActiveIdx(-1);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [decisions, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (decisions) {
      const types = ['safe', 'smart', 'bold'];
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(prev => Math.min(prev + 1, 2)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(prev => Math.max(prev - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0) handleSelectDecision(types[activeIdx]); }
    }
  };

  if (!isOpen) return null;
  const preferred = getPreferredStyle();
  const hasRealContext = screenContext && screenContext !== 'Observing...' && screenContext.length > 15;
  const tagColors = { safe: '#94a3b8', smart: '#e2e8f0', bold: '#fbbf24' };
  const cardIcons = { safe: Shield, smart: Lightbulb, bold: Zap };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[10vh]"
      data-testid="command-palette-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div className="relative z-10 w-full max-w-2xl mx-6 animate-zoom-in" data-testid="command-palette-modal"
        style={{ maxHeight: '72vh', display: 'flex', flexDirection: 'column' }}>
        <div className="rounded-2xl overflow-hidden flex flex-col" style={{
          background: 'linear-gradient(180deg, rgba(30,41,59,0.88) 0%, rgba(15,23,42,0.96) 100%)',
          backdropFilter: 'blur(48px) saturate(1.4)',
          border: '1px solid rgba(148,163,184,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
          flex: 1, minHeight: 0,
        }}>

          {/* Top bar — mode toggle + context */}
          <div className="flex-shrink-0 px-4 pt-3 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 flex-1">
                <button onClick={() => { setMode('chat'); setDecisions(null); }} data-testid="mode-tilt-btn"
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all border-none cursor-pointer ${
                    mode === 'chat' ? 'bg-white/[0.1] text-white/80' : 'bg-transparent text-white/30'}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}>Tilt</button>
                <button onClick={() => { setMode('decide'); setDecisions(null); }} data-testid="mode-decide-btn"
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all border-none cursor-pointer ${
                    mode === 'decide' ? 'bg-white/[0.1] text-white/80' : 'bg-transparent text-white/30'}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}>Decide</button>
              </div>
              <button onClick={onClose} data-testid="close-palette-btn"
                className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0 border-none cursor-pointer">
                <X size={12} className="text-white/30" />
              </button>
            </div>
            {hasRealContext && (
              <div className="flex items-start gap-2 bg-indigo-500/[0.06] border border-indigo-400/10 rounded-lg px-3 py-2" data-testid="screen-context-banner">
                <Eye size={11} className="text-indigo-400/50 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-white/35 leading-relaxed m-0">{screenContext}</p>
              </div>
            )}
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2" style={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.length === 0 && !loading && (
              <div className="text-center py-8 flex-1 flex flex-col justify-center items-center">
                {insight && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/[0.08] border border-indigo-400/10 mb-3" data-testid="insight-bar">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
                    <span className="text-[10px] text-indigo-300/50 font-medium">{insight}</span>
                  </div>
                )}
                <p className="text-[13px] text-white/15 leading-relaxed">
                  {mode === 'chat'
                    ? (hasRealContext ? 'I can see your screen. Ask me anything.' : 'Ask me anything or say "help me do X" for guidance.')
                    : 'Describe a situation to get Safe, Smart & Bold options.'}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'user' ? (
                  <div className="bg-indigo-500/15 rounded-xl rounded-br-sm px-3 py-2 max-w-[85%]">
                    <p className="text-[13px] text-white/80 m-0 leading-relaxed" style={{ wordBreak: 'break-word' }}>{msg.content}</p>
                  </div>
                ) : (
                  <div style={{ maxWidth: '95%', width: '100%' }}>
                    {msg.decisionType && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: tagColors[msg.decisionType] }}>
                        {msg.decisionType}
                      </span>
                    )}
                    <div className="bg-white/[0.04] rounded-sm rounded-xl rounded-bl-sm border border-white/[0.05] px-3 py-2.5 relative">
                      <p className="text-[13px] text-white/75 m-0 leading-relaxed" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      {msg.reasoning && (
                        <p className="text-[10px] text-white/20 italic mt-1.5 m-0 leading-relaxed">{msg.reasoning}</p>
                      )}
                    </div>
                    <button onClick={() => handleCopy(msg.content, msg.id)} data-testid={`copy-msg-${msg.id}`}
                      className="text-[10px] mt-0.5 bg-transparent border-none cursor-pointer transition-colors"
                      style={{ color: copied === msg.id ? '#4ade80' : 'rgba(255,255,255,0.2)', fontFamily: "'Inter', sans-serif", padding: '1px 0' }}>
                      {copied === msg.id ? 'copied' : 'copy'}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Decision cards inline */}
            {decisions && (
              <div data-testid="decision-cards" className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-1.5">
                <span className="text-[9px] text-white/20 font-mono px-2 block mb-1">arrow keys + Enter</span>
                {['safe', 'smart', 'bold'].map((type, idx) => {
                  const d = decisions[type]; const isPref = type === preferred; const isActive = idx === activeIdx;
                  const Icon = cardIcons[type];
                  return (
                    <button key={type} onClick={() => handleSelectDecision(type)} data-testid={`decision-card-${type}`}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer border-none ${
                        isActive ? 'bg-indigo-500/[0.1] outline outline-1 outline-indigo-400/20' :
                        isPref ? 'bg-indigo-500/[0.06]' : 'hover:bg-white/[0.05] bg-transparent'}`}
                      style={{ fontFamily: "'Inter', sans-serif" }}>
                      <Icon size={13} style={{ color: tagColors[type] }} strokeWidth={1.5} className="flex-shrink-0" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide w-10 text-left flex-shrink-0" style={{ color: tagColors[type] }}>
                        {d?.label}
                      </span>
                      <span className="text-[12px] text-white/40 truncate flex-1 text-left">{d?.response}</span>
                      {isPref && (
                        <span className="text-[8px] font-semibold text-indigo-400/50 bg-indigo-400/[0.08] px-1.5 py-0.5 rounded flex-shrink-0 uppercase"
                          data-testid={`preferred-badge-${type}`}>pref</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {loading && (
              <div data-testid="loading-state" className="flex items-center gap-2 py-2 px-1">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400/40"
                      style={{ animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                  ))}
                </div>
                <span className="text-[11px] text-white/20">{mode === 'decide' ? 'Generating options...' : 'Thinking...'}</span>
              </div>
            )}
          </div>

          {/* Input — always at bottom */}
          <div className="flex-shrink-0 px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3">
              <Search size={15} className="text-slate-500 flex-shrink-0" strokeWidth={2} />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={messages.length > 0 ? "Continue..." : (mode === 'decide' ? "Describe the situation..." : "Ask me anything...")}
                data-testid="decision-input"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !decisions && input.trim()) { e.preventDefault(); handleSubmit(); }
                }}
                className="flex-1 bg-transparent border-none text-[14px] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 py-2.5 font-body"
                style={{ opacity: loading ? 0.4 : 1 }}
              />
              {input.trim() && !loading && (
                <button onClick={handleSubmit} data-testid="submit-decision-btn"
                  className="px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors border cursor-pointer"
                  style={{ background: 'rgba(129,140,248,0.2)', borderColor: 'rgba(129,140,248,0.15)', color: 'rgba(199,210,254,0.8)', fontFamily: "'Inter', sans-serif" }}>
                  Send
                </button>
              )}
            </div>
            {error && <p className="text-red-400/80 font-mono text-[10px] mt-1 px-1" data-testid="error-message">{error}</p>}
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <span className="font-mono text-[10px] text-white/15 tracking-widest uppercase">esc to close</span>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
