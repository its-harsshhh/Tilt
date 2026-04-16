import React, { useState, useRef, useEffect } from 'react';
import { getPreferredStyle, getInsightText, getMemory, saveDecision } from '../hooks/useMemory';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function FloatingPalette({ screenContext }) {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('input');
  const [decisions, setDecisions] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);

  useEffect(() => {
    if (phase === 'input') setTimeout(() => inputRef.current?.focus(), 150);
  }, [phase]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setPhase('loading');
    setError(null);
    setActiveIdx(-1);
    const memory = getMemory();
    const preferred = getPreferredStyle();
    try {
      const res = await fetch(`${API_URL}/api/generate-decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_text: input.trim(),
          context: screenContext || null,
          user_preference: preferred !== 'smart' ? preferred : null,
          tone_traits: memory.toneTraits.length > 0 ? memory.toneTraits : null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to generate');
      }
      const data = await res.json();
      setDecisions(data);
      setPhase('decisions');
      // Pre-highlight preferred option
      const types = ['safe', 'smart', 'bold'];
      const prefIdx = types.indexOf(preferred);
      setActiveIdx(prefIdx >= 0 ? prefIdx : 1);
    } catch (err) {
      setError(err.message);
      setPhase('input');
    }
  };

  const handleSelect = (type) => {
    setSelectedType(type);
    saveDecision(type, input, decisions[type]?.response);
    setPhase('output');
  };

  const handleCopy = async () => {
    const text = decisions?.[selectedType]?.response || '';
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement('textarea');
      el.value = text; document.body.appendChild(el);
      el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setPhase('input'); setInput(''); setDecisions(null);
    setSelectedType(null); setError(null); setCopied(false);
    setActiveIdx(-1);
  };

  // Keyboard navigation for decision rows
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && phase === 'input') {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (phase === 'decisions') {
      const types = ['safe', 'smart', 'bold'];
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(prev => Math.min(prev + 1, 2));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault();
        handleSelect(types[activeIdx]);
      }
    }
  };

  const insight = getInsightText();
  const preferred = getPreferredStyle();

  const cardStyles = {
    safe:  { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.06)', accent: '#94a3b8', tag: 'Safe' },
    smart: { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)', accent: '#e2e8f0', tag: 'Smart' },
    bold:  { bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.15)', accent: '#fbbf24', tag: 'Bold' },
  };

  const hasRealContext = screenContext && screenContext !== 'Observing...' && screenContext.length > 15;

  return (
    <div data-testid="floating-palette" style={{
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: 'linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(2,6,23,0.99) 100%)',
      color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column',
    }} onKeyDown={handleKeyDown} tabIndex={-1}>

      {/* Screen Context Banner */}
      {hasRealContext && phase === 'input' && (
        <div style={{
          padding: '10px 16px 0',
        }}>
          <div data-testid="pip-screen-context" style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)',
            borderRadius: '10px', padding: '8px 12px',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8',
              marginTop: '5px', flexShrink: 0, animation: 'pulse 2s infinite',
            }} />
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: '9px', fontWeight: '600', textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'rgba(129,140,248,0.5)',
              }}>Screen Context</span>
              <p style={{
                fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5',
                margin: '2px 0 0', wordBreak: 'break-word',
              }}>{screenContext}</p>
            </div>
          </div>
        </div>
      )}

      {/* Spotlight Search Bar */}
      <div style={{
        padding: '12px 16px 0', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(51,65,85,0.6) 0%, rgba(30,41,59,0.7) 100%)',
          backdropFilter: 'blur(40px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
          border: '1px solid rgba(148,163,184,0.15)',
          borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.05) inset',
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '4px 6px 4px 16px',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasRealContext ? "What do you need help with?" : "Describe your situation..."}
            data-testid="pip-decision-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && phase === 'input') { e.preventDefault(); handleSubmit(); }
            }}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#f1f5f9', fontSize: '15px', fontFamily: "'Inter', sans-serif",
              fontWeight: '400', padding: '10px 0', letterSpacing: '-0.01em',
            }}
          />

          {input.trim() && phase === 'input' && (
            <button onClick={handleSubmit} data-testid="pip-submit-btn" style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', padding: '6px 14px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontFamily: "'Inter', sans-serif",
              fontWeight: '500', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>
              Return
            </button>
          )}

          {phase === 'loading' && (
            <div style={{
              width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.08)',
              borderTopColor: 'rgba(148,163,184,0.5)', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite', flexShrink: 0, marginRight: '8px',
            }} />
          )}
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: '11px', marginTop: '8px', padding: '0 4px', fontFamily: 'monospace' }}
             data-testid="pip-error">{error}</p>
        )}
      </div>

      {/* Results Area */}
      <div style={{ flex: 1, padding: '12px 16px 16px', overflowY: 'auto' }}>

        {/* Reflection Layer — insight chip */}
        {insight && phase === 'input' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', padding: '5px 10px', marginBottom: '12px',
          }} data-testid="pip-insight">
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#818cf8' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '500', letterSpacing: '0.02em' }}>
              {insight}
            </span>
          </div>
        )}

        {/* Empty state */}
        {phase === 'input' && !input.trim() && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.15)', lineHeight: '1.6' }}>
              {hasRealContext
                ? 'Ask anything about what you see on screen.'
                : 'Paste a message, describe a situation,\nor ask how to respond.'}
            </p>
          </div>
        )}

        {/* Loading shimmer */}
        {phase === 'loading' && (
          <div data-testid="pip-loading" style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: '40px', borderRadius: '10px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {/* Decision cards — compact rows with keyboard nav */}
        {phase === 'decisions' && decisions && (
          <div data-testid="pip-decision-cards" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Keyboard nav hint */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', padding: '0 4px',
            }}>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                Use arrow keys to navigate, Enter to select
              </span>
            </div>
            {['safe', 'smart', 'bold'].map((type, idx) => {
              const d = decisions[type];
              const c = cardStyles[type];
              const isPref = type === preferred;
              const isActive = idx === activeIdx;
              return (
                <button key={type} onClick={() => handleSelect(type)} data-testid={`pip-card-${type}`}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '10px', border: 'none',
                    background: isActive
                      ? 'rgba(129,140,248,0.12)'
                      : isPref ? 'rgba(129,140,248,0.06)' : 'transparent',
                    cursor: 'pointer', transition: 'background 0.1s',
                    fontFamily: "'Inter', sans-serif",
                    outline: isActive ? '1px solid rgba(129,140,248,0.25)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    setActiveIdx(idx);
                    if (!isActive && !isPref) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && !isPref) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Tag pill */}
                  <span style={{
                    fontSize: '10px', fontWeight: '600', textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: c.accent, flexShrink: 0,
                    width: '42px', textAlign: 'left',
                  }}>{c.tag}</span>

                  {/* Preview — single line */}
                  <span style={{
                    flex: 1, fontSize: '13px', color: 'rgba(255,255,255,0.45)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    textAlign: 'left',
                  }}>{d?.response}</span>

                  {/* Preferred badge */}
                  {isPref && (
                    <span style={{
                      fontSize: '8px', fontWeight: '600', color: 'rgba(129,140,248,0.5)',
                      background: 'rgba(129,140,248,0.08)', padding: '2px 5px',
                      borderRadius: '4px', flexShrink: 0, textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }} data-testid={`pip-preferred-${type}`}>pref</span>
                  )}

                  {/* Arrow */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              );
            })}
          </div>
        )}

        {/* Output */}
        {phase === 'output' && decisions && selectedType && (
          <div data-testid="pip-output">
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px',
            }}>
              <span style={{
                fontSize: '10px', fontWeight: '600', textTransform: 'uppercase',
                letterSpacing: '0.08em', color: cardStyles[selectedType].accent,
              }}>{cardStyles[selectedType].tag} Response</span>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '14px', marginBottom: '10px',
            }} data-testid="pip-response-text">
              <p style={{
                fontSize: '14px', lineHeight: '1.7', margin: 0,
                color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter', sans-serif",
              }}>{decisions[selectedType]?.response}</p>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <button onClick={handleCopy} data-testid="pip-copy-btn" style={{
                flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
                background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)',
                color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)',
                fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
              }}>
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={handleReset} data-testid="pip-new-decision-btn" style={{
                flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)',
                fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
              }}>
                New
              </button>
            </div>

            {decisions.reasoning?.[selectedType] && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }} data-testid="pip-reasoning">
                <p style={{
                  fontSize: '11px', lineHeight: '1.5', color: 'rgba(255,255,255,0.25)',
                  fontStyle: 'italic', margin: 0,
                }}>
                  {decisions.reasoning[selectedType]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
