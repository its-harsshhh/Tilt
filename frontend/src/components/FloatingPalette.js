import React, { useState, useRef, useEffect } from 'react';
import { getPreferredStyle, getInsightText, getMemory, saveDecision } from '../hooks/useMemory';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ICONS = {
  arrow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
  refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
  shield: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  bulb: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`,
  zap: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
};

const LOGO_URL = window.location.origin + '/tilt-logo.svg';

export default function FloatingPalette({ screenContext, onRequestClose }) {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('input');
  const [decisions, setDecisions] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (phase === 'input') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [phase]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setPhase('loading');
    setError(null);

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
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setPhase('input');
    setInput('');
    setDecisions(null);
    setSelectedType(null);
    setError(null);
    setCopied(false);
  };

  const insight = getInsightText();
  const preferred = getPreferredStyle();

  return (
    <div data-testid="floating-palette" style={{
      fontFamily: "'Satoshi', 'Outfit', -apple-system, sans-serif",
      background: '#0a0a0a',
      color: '#fff',
      minHeight: '100vh',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={LOGO_URL} alt="Tilt" style={{ height: '16px' }} data-testid="pip-tilt-logo" />
          <span style={{
            fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
          }}>
            {phase === 'loading' ? 'Thinking...' : phase === 'decisions' ? 'Choose approach' : phase === 'output' ? 'Ready' : ''}
          </span>
        </div>
        {screenContext && (
          <span style={{
            fontSize: '9px', fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
          }}>
            ctx: {screenContext}
          </span>
        )}
      </div>

      {/* Insight */}
      {insight && (
        <div style={{
          fontSize: '9px', fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)',
          marginBottom: '12px',
        }} data-testid="pip-insight">
          {insight}
        </div>
      )}

      {/* Input phase */}
      {phase === 'input' && (
        <div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What do you want to do here?"
            data-testid="pip-decision-input"
            rows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '15px',
              fontFamily: "'Satoshi', sans-serif", resize: 'none', outline: 'none',
              lineHeight: '1.5', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            data-testid="pip-submit-btn"
            style={{
              width: '100%', marginTop: '10px', padding: '12px',
              borderRadius: '12px', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
              background: input.trim() ? '#fff' : 'rgba(255,255,255,0.05)',
              color: input.trim() ? '#000' : 'rgba(255,255,255,0.2)',
              fontSize: '13px', fontWeight: '500', fontFamily: "'Satoshi', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.15s',
            }}
          >
            <span dangerouslySetInnerHTML={{ __html: ICONS.arrow }} />
            Generate Decisions
          </button>
          {error && (
            <p style={{ color: '#f87171', fontSize: '11px', marginTop: '8px', fontFamily: 'monospace' }}
               data-testid="pip-error">{error}</p>
          )}
        </div>
      )}

      {/* Loading */}
      {phase === 'loading' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '40px 0', gap: '12px',
        }} data-testid="pip-loading">
          <div style={{
            width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: 'rgba(255,255,255,0.4)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{
            fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
          }}>Generating options...</span>
        </div>
      )}

      {/* Decision cards */}
      {phase === 'decisions' && decisions && (
        <div data-testid="pip-decision-cards">
          <p style={{
            fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
            marginBottom: '10px',
          }}>How do you want to approach this?</p>

          {['safe', 'smart', 'bold'].map((type) => {
            const decision = decisions[type];
            const isPreferred = type === preferred;
            const configs = {
              safe: { icon: ICONS.shield, bg: 'rgba(39,39,42,0.5)', border: 'rgba(255,255,255,0.05)', color: '#a1a1aa', iconCol: '#71717a' },
              smart: { icon: ICONS.bulb, bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', color: '#fff', iconCol: 'rgba(255,255,255,0.7)' },
              bold: { icon: ICONS.zap, bg: 'rgba(244,244,245,0.95)', border: 'rgba(255,255,255,0.2)', color: '#000', iconCol: 'rgba(0,0,0,0.6)' },
            };
            const c = configs[type];

            return (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                data-testid={`pip-card-${type}`}
                style={{
                  width: '100%', textAlign: 'left', padding: '14px', marginBottom: '8px',
                  borderRadius: '12px', border: `1px solid ${c.border}`,
                  background: c.bg, color: c.color, cursor: 'pointer',
                  transition: 'all 0.15s', position: 'relative',
                  outline: isPreferred ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  fontFamily: "'Satoshi', sans-serif",
                }}
              >
                {isPreferred && (
                  <span style={{
                    position: 'absolute', top: '-8px', right: '10px', fontSize: '8px',
                    fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                    textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }} data-testid={`pip-preferred-${type}`}>Preferred</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: c.iconCol }} dangerouslySetInnerHTML={{ __html: c.icon }} />
                  <span style={{
                    fontSize: '12px', fontWeight: '500', textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>{decision?.label || type}</span>
                  <span style={{
                    fontSize: '9px', fontFamily: "'JetBrains Mono', monospace",
                    color: type === 'bold' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.2)',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}>{decision?.description}</span>
                </div>
                <p style={{
                  fontSize: '13px', lineHeight: '1.5', margin: 0,
                  color: type === 'bold' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{decision?.response}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Output */}
      {phase === 'output' && decisions && selectedType && (
        <div data-testid="pip-output">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px',
          }}>
            <span style={{
              color: selectedType === 'bold' ? '#facc15' : selectedType === 'smart' ? '#fff' : '#a1a1aa',
            }} dangerouslySetInnerHTML={{ __html: ICONS[selectedType === 'safe' ? 'shield' : selectedType === 'smart' ? 'bulb' : 'zap'] }} />
            <span style={{
              fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: selectedType === 'bold' ? '#facc15' : selectedType === 'smart' ? '#fff' : '#a1a1aa',
            }}>{decisions[selectedType]?.label} Response</span>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '16px', marginBottom: '12px',
          }} data-testid="pip-response-text">
            <p style={{
              fontSize: '14px', lineHeight: '1.7', margin: 0, color: 'rgba(255,255,255,0.9)',
              fontFamily: "'Satoshi', sans-serif",
            }}>{decisions[selectedType]?.response}</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              onClick={handleCopy}
              data-testid="pip-copy-btn"
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
                fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px', fontFamily: "'Satoshi', sans-serif",
                transition: 'all 0.15s',
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: copied ? ICONS.check : ICONS.copy }} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleReset}
              data-testid="pip-new-decision-btn"
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)',
                fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px', fontFamily: "'Satoshi', sans-serif",
                transition: 'all 0.15s',
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: ICONS.refresh }} />
              New Decision
            </button>
          </div>

          {/* Reasoning */}
          {decisions.reasoning?.[selectedType] && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }} data-testid="pip-reasoning">
              <span style={{
                fontSize: '9px', fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)',
              }}>Why this works</span>
              <p style={{
                fontSize: '12px', lineHeight: '1.6', color: 'rgba(255,255,255,0.35)',
                marginTop: '6px', fontFamily: "'Satoshi', sans-serif",
              }}>{decisions.reasoning[selectedType]}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontSize: '9px', fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.1)',
        }}>Tilt — Floating Palette</span>
        {phase === 'input' && (
          <span style={{
            fontSize: '9px', fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.1)',
          }}>Enter to submit</span>
        )}
      </div>
    </div>
  );
}
