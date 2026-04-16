import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getPreferredStyle, getInsightText, getMemory, saveDecision } from '../hooks/useMemory';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function FloatingPalette({ screenContext }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('chat'); // 'chat' or 'decide'
  const [decisions, setDecisions] = useState(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [copied, setCopied] = useState(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, decisions]);

  const handleCopy = useCallback(async (text, id) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement('textarea');
      el.value = text; document.body.appendChild(el);
      el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const sendChat = useCallback(async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim(), id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    setDecisions(null);

    const memory = getMemory();
    const preferred = getPreferredStyle();

    try {
      const conversation = messages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_URL}/api/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          screen_context: screenContext || null,
          conversation,
          mode: 'chat',
          user_preference: preferred !== 'smart' ? preferred : null,
          tone_traits: memory.toneTraits.length > 0 ? memory.toneTraits : null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed');
      }
      const data = await res.json();
      const aiMsg = { role: 'assistant', content: data.response, id: Date.now() + 1 };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, screenContext]);

  const sendDecide = useCallback(async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim(), id: Date.now(), isDecision: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    setDecisions(null);
    setActiveIdx(-1);

    const memory = getMemory();
    const preferred = getPreferredStyle();

    try {
      const res = await fetch(`${API_URL}/api/generate-decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_text: text.trim(),
          context: screenContext || null,
          user_preference: preferred !== 'smart' ? preferred : null,
          tone_traits: memory.toneTraits.length > 0 ? memory.toneTraits : null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed');
      }
      const data = await res.json();
      setDecisions(data);
      const types = ['safe', 'smart', 'bold'];
      const prefIdx = types.indexOf(preferred);
      setActiveIdx(prefIdx >= 0 ? prefIdx : 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [screenContext]);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    if (mode === 'decide') {
      sendDecide(input);
    } else {
      sendChat(input);
    }
  }, [input, mode, sendChat, sendDecide]);

  const handleSelectDecision = useCallback((type) => {
    if (!decisions) return;
    saveDecision(type, messages[messages.length - 1]?.content || '', decisions[type]?.response);
    const aiMsg = {
      role: 'assistant',
      content: decisions[type]?.response,
      id: Date.now(),
      decisionType: type,
      reasoning: decisions?.reasoning?.[type],
    };
    setMessages(prev => [...prev, aiMsg]);
    setDecisions(null);
    setActiveIdx(-1);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [decisions, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !decisions) {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (decisions) {
      const types = ['safe', 'smart', 'bold'];
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(prev => Math.min(prev + 1, 2));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIdx >= 0) handleSelectDecision(types[activeIdx]);
      }
    }
  };

  const insight = getInsightText();
  const preferred = getPreferredStyle();
  const hasRealContext = screenContext && screenContext !== 'Observing...' && screenContext.length > 15;

  const tagColors = {
    safe: '#94a3b8', smart: '#e2e8f0', bold: '#fbbf24',
  };

  return (
    <div data-testid="floating-palette" style={{
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: 'linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(2,6,23,0.99) 100%)',
      color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column',
    }} onKeyDown={handleKeyDown} tabIndex={-1}>

      {/* Top bar — screen context + mode toggle */}
      <div style={{
        padding: '10px 14px 6px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Mode toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px', marginBottom: hasRealContext ? '8px' : '0',
          background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px',
        }}>
          <button
            onClick={() => { setMode('chat'); setDecisions(null); }}
            data-testid="mode-chat-btn"
            style={{
              flex: 1, padding: '5px 0', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: mode === 'chat' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: mode === 'chat' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
              fontSize: '11px', fontWeight: '600', fontFamily: "'Inter', sans-serif",
              transition: 'all 0.15s', letterSpacing: '0.02em',
            }}
          >Assist</button>
          <button
            onClick={() => { setMode('decide'); setDecisions(null); }}
            data-testid="mode-decide-btn"
            style={{
              flex: 1, padding: '5px 0', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: mode === 'decide' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: mode === 'decide' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
              fontSize: '11px', fontWeight: '600', fontFamily: "'Inter', sans-serif",
              transition: 'all 0.15s', letterSpacing: '0.02em',
            }}
          >Decide</button>
        </div>

        {/* Screen context */}
        {hasRealContext && (
          <div data-testid="pip-screen-context" style={{
            display: 'flex', alignItems: 'flex-start', gap: '6px',
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.08)',
            borderRadius: '8px', padding: '6px 10px',
          }}>
            <div style={{
              width: '5px', height: '5px', borderRadius: '50%', background: '#818cf8',
              marginTop: '4px', flexShrink: 0, animation: 'pulse 2s infinite',
            }} />
            <p style={{
              fontSize: '10px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.4',
              margin: 0, wordBreak: 'break-word',
            }}>{screenContext}</p>
          </div>
        )}
      </div>

      {/* Chat messages area */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '8px 14px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '32px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {insight && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px', padding: '4px 10px', marginBottom: '12px',
              }} data-testid="pip-insight">
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#818cf8' }} />
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>{insight}</span>
              </div>
            )}
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.15)', lineHeight: '1.6' }}>
              {mode === 'chat'
                ? (hasRealContext ? 'I can see your screen. Ask me anything.' : 'Ask me to help with anything.')
                : 'Describe a situation to get Safe, Smart & Bold options.'}
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {msg.role === 'user' ? (
              <div style={{
                background: 'rgba(99,102,241,0.15)', borderRadius: '12px 12px 4px 12px',
                padding: '8px 12px', maxWidth: '85%',
              }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.5', wordBreak: 'break-word' }}>
                  {msg.content}
                </p>
              </div>
            ) : (
              <div style={{ maxWidth: '95%', width: '100%' }}>
                {msg.decisionType && (
                  <span style={{
                    fontSize: '9px', fontWeight: '600', textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: tagColors[msg.decisionType],
                    marginBottom: '3px', display: 'block',
                  }}>{msg.decisionType}</span>
                )}
                <div style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: '4px 12px 12px 12px',
                  padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)',
                  position: 'relative',
                }}>
                  <p style={{
                    fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0,
                    lineHeight: '1.6', wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                  }}>{msg.content}</p>
                  {msg.reasoning && (
                    <p style={{
                      fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic',
                      margin: '6px 0 0', lineHeight: '1.4',
                    }}>{msg.reasoning}</p>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(msg.content, msg.id)}
                  data-testid={`copy-msg-${msg.id}`}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
                    color: copied === msg.id ? '#4ade80' : 'rgba(255,255,255,0.2)',
                    fontSize: '10px', fontFamily: "'Inter', sans-serif", marginTop: '2px',
                    transition: 'color 0.15s',
                  }}
                >{copied === msg.id ? 'copied' : 'copy'}</button>
              </div>
            )}
          </div>
        ))}

        {/* Decision cards — shown inline when in decide mode */}
        {decisions && (
          <div data-testid="pip-decision-cards" style={{
            display: 'flex', flexDirection: 'column', gap: '2px',
            background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
            padding: '6px', border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', padding: '0 6px 4px' }}>
              Pick one — arrow keys + Enter
            </span>
            {['safe', 'smart', 'bold'].map((type, idx) => {
              const d = decisions[type];
              const isPref = type === preferred;
              const isActive = idx === activeIdx;
              return (
                <button key={type} onClick={() => handleSelectDecision(type)} data-testid={`pip-card-${type}`}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 10px', borderRadius: '8px', border: 'none',
                    background: isActive ? 'rgba(129,140,248,0.12)' : isPref ? 'rgba(129,140,248,0.06)' : 'transparent',
                    cursor: 'pointer', transition: 'background 0.1s', fontFamily: "'Inter', sans-serif",
                    outline: isActive ? '1px solid rgba(129,140,248,0.25)' : 'none',
                  }}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  <span style={{
                    fontSize: '10px', fontWeight: '600', textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: tagColors[type], flexShrink: 0, width: '40px', textAlign: 'left',
                  }}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <span style={{
                    flex: 1, fontSize: '12px', color: 'rgba(255,255,255,0.4)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left',
                  }}>{d?.response}</span>
                  {isPref && (
                    <span style={{
                      fontSize: '8px', fontWeight: '600', color: 'rgba(129,140,248,0.5)',
                      background: 'rgba(129,140,248,0.08)', padding: '2px 5px', borderRadius: '4px',
                      flexShrink: 0, textTransform: 'uppercase',
                    }} data-testid={`pip-preferred-${type}`}>pref</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div data-testid="pip-loading" style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 4px',
          }}>
            <div style={{
              display: 'flex', gap: '4px',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'rgba(148,163,184,0.4)',
                  animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
              {mode === 'decide' ? 'Generating options...' : 'Thinking...'}
            </span>
          </div>
        )}
      </div>

      {/* Input bar — ALWAYS at bottom */}
      <div style={{
        padding: '6px 12px 10px', flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(2,6,23,0.95)',
      }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(51,65,85,0.5) 0%, rgba(30,41,59,0.6) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '3px 6px 3px 14px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={messages.length > 0 ? "Continue..." : (mode === 'decide' ? "Describe the situation..." : "Ask me anything...")}
            data-testid="pip-decision-input"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !decisions && input.trim()) {
                e.preventDefault(); handleSubmit();
              }
            }}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#f1f5f9', fontSize: '14px', fontFamily: "'Inter', sans-serif",
              fontWeight: '400', padding: '9px 0', letterSpacing: '-0.01em',
              opacity: loading ? 0.4 : 1,
            }}
          />
          {input.trim() && !loading && (
            <button onClick={handleSubmit} data-testid="pip-submit-btn" style={{
              background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.15)',
              borderRadius: '8px', padding: '5px 12px', cursor: 'pointer',
              color: 'rgba(199,210,254,0.8)', fontSize: '11px', fontFamily: "'Inter', sans-serif",
              fontWeight: '600', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>
              Send
            </button>
          )}
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: '10px', marginTop: '4px', padding: '0 4px', fontFamily: 'monospace' }}
             data-testid="pip-error">{error}</p>
        )}
      </div>

      {/* Inline styles for bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
