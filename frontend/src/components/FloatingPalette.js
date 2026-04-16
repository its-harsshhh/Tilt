import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getPreferredStyle, getInsightText, getMemory, saveDecision } from '../hooks/useMemory';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function FloatingPalette({ screenContext, captureFrameFn }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('tilt'); // 'tilt' or 'decide'
  const [decisions, setDecisions] = useState(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [copied, setCopied] = useState(null);
  // Guide state (used within Tilt mode)
  const [guideActive, setGuideActive] = useState(false);
  const [guideTask, setGuideTask] = useState(null);
  const [guideStep, setGuideStep] = useState(1);
  const [guideSteps, setGuideSteps] = useState([]);
  const [guideResult, setGuideResult] = useState(null);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const guideIntervalRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200); }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, decisions, guideResult, annotatedImage]);

  useEffect(() => {
    return () => { if (guideIntervalRef.current) clearInterval(guideIntervalRef.current); };
  }, []);

  const handleCopy = useCallback(async (text, id) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement('textarea');
      el.value = text; document.body.appendChild(el);
      el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  }, []);

  const captureFrame = useCallback(() => {
    if (captureFrameFn) return captureFrameFn();
    return null;
  }, [captureFrameFn]);

  // Draw annotation on screenshot
  const drawAnnotation = useCallback((frameDataUrl, region) => {
    if (!region) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const cx = region.x * img.width;
      const cy = region.y * img.height;
      // Outer glow
      ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)'; ctx.fill();
      // Ring
      ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.8)'; ctx.lineWidth = 3; ctx.stroke();
      // Dot
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(129, 140, 248, 0.9)'; ctx.fill();
      // Label
      if (region.label) {
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; ctx.lineWidth = 3;
        ctx.fillStyle = '#fff';
        const tx = Math.min(cx + 35, img.width - 100);
        const ty = cy + 5;
        ctx.strokeText(region.label, tx, ty);
        ctx.fillText(region.label, tx, ty);
      }
      setAnnotatedImage(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = frameDataUrl;
  }, []);

  // Unified Tilt send — auto-detects chat vs guide
  const sendTilt = useCallback(async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim(), id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setLoading(true); setError(null);

    const memory = getMemory();
    const preferred = getPreferredStyle();
    const frame = captureFrame();
    const conversation = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${API_URL}/api/tilt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          image_base64: frame || null,
          screen_context: screenContext || null,
          conversation,
          user_preference: preferred !== 'smart' ? preferred : null,
          tone_traits: memory.toneTraits.length > 0 ? memory.toneTraits : null,
          guide_active: false,
          completed_steps: [],
          step_number: 1,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Failed'); }
      const data = await res.json();

      if (data.type === 'guide') {
        // Start guide mode
        setGuideActive(true);
        setGuideTask(text.trim());
        setGuideStep(data.step_number || 1);
        setGuideSteps([]);
        setGuideResult(data);
        if (frame) drawAnnotation(frame, data.region);

        // Start auto-capture
        if (guideIntervalRef.current) clearInterval(guideIntervalRef.current);
        guideIntervalRef.current = setInterval(() => {
          autoAdvance(text.trim(), data, 1, []);
        }, 6000);
      } else {
        // Chat response
        setMessages(prev => [...prev, { role: 'assistant', content: data.response, id: Date.now() + 1 }]);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [messages, screenContext, captureFrame, drawAnnotation]);

  // Auto-advance guide
  const autoAdvance = useCallback(async (task, prevResult, prevStep, prevSteps) => {
    const frame = captureFrame();
    if (!frame) return;
    const completedSteps = [...prevSteps];
    if (prevResult?.step_summary) completedSteps.push(prevResult.step_summary);
    try {
      const res = await fetch(`${API_URL}/api/tilt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: task,
          image_base64: frame,
          guide_active: true,
          guide_task: task,
          completed_steps: completedSteps,
          step_number: prevStep + 1,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.type === 'guide') {
        setGuideResult(data);
        setGuideStep(data.step_number || prevStep + 1);
        setGuideSteps(completedSteps);
        drawAnnotation(frame, data.region);
        if (data.is_complete && guideIntervalRef.current) clearInterval(guideIntervalRef.current);
      }
    } catch (e) { /* silent */ }
  }, [captureFrame, drawAnnotation]);

  // Keep interval in sync with latest state
  useEffect(() => {
    if (guideActive && guideTask && guideResult && !guideResult.is_complete) {
      if (guideIntervalRef.current) clearInterval(guideIntervalRef.current);
      guideIntervalRef.current = setInterval(() => {
        autoAdvance(guideTask, guideResult, guideStep, guideSteps);
      }, 6000);
    }
    return () => {
      if (guideIntervalRef.current && (!guideActive || guideResult?.is_complete))
        clearInterval(guideIntervalRef.current);
    };
  }, [guideActive, guideTask, guideResult, guideStep, guideSteps, autoAdvance]);

  const stopGuide = useCallback(() => {
    setGuideActive(false); setGuideTask(null); setGuideResult(null);
    setAnnotatedImage(null); setGuideStep(1); setGuideSteps([]);
    if (guideIntervalRef.current) clearInterval(guideIntervalRef.current);
  }, []);

  // Decide mode
  const sendDecide = useCallback(async (text) => {
    if (!text.trim()) return;
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
      const data = await res.json(); setDecisions(data);
      const types = ['safe', 'smart', 'bold'];
      setActiveIdx(types.indexOf(preferred) >= 0 ? types.indexOf(preferred) : 1);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [screenContext]);

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

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    if (mode === 'decide') sendDecide(input);
    else sendTilt(input);
  }, [input, mode, sendTilt, sendDecide]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !decisions) {
      if (input.trim()) { e.preventDefault(); handleSubmit(); }
      return;
    }
    if (decisions) {
      const types = ['safe', 'smart', 'bold'];
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(prev => Math.min(prev + 1, 2)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(prev => Math.max(prev - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0) handleSelectDecision(types[activeIdx]); }
    }
  };

  const switchMode = (m) => {
    if (m !== 'tilt' && guideActive) stopGuide();
    setMode(m); setDecisions(null); setActiveIdx(-1);
  };

  const insight = getInsightText();
  const preferred = getPreferredStyle();
  const hasCtx = screenContext && screenContext !== 'Observing...' && screenContext.length > 15;
  const tagColors = { safe: '#94a3b8', smart: '#e2e8f0', bold: '#fbbf24' };

  return (
    <div data-testid="floating-palette" style={{
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: 'linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(2,6,23,0.99) 100%)',
      color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column',
    }} onKeyDown={handleKeyDown} tabIndex={-1}>

      {/* Top — two tabs */}
      <div style={{ padding: '8px 12px 4px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px' }}>
          {[{ key: 'tilt', label: 'Tilt' }, { key: 'decide', label: 'Decide' }].map(t => (
            <button key={t.key} onClick={() => switchMode(t.key)} data-testid={`mode-${t.key}-btn`}
              style={{
                flex: 1, padding: '6px 0', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: mode === t.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: mode === t.key ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
                fontSize: '12px', fontWeight: '600', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
              }}>{t.label}</button>
          ))}
        </div>
        {/* Screen context — only in non-guide state */}
        {hasCtx && !guideActive && (
          <div data-testid="pip-screen-context" style={{
            display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px',
            background: 'rgba(99,102,241,0.05)', borderRadius: '8px', padding: '5px 10px',
            border: '1px solid rgba(99,102,241,0.08)',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#818cf8', flexShrink: 0, animation: 'pulse 2s infinite' }} />
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{screenContext}</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Empty state */}
        {messages.length === 0 && !loading && !guideActive && (
          <div style={{ textAlign: 'center', padding: '28px 8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {insight && mode === 'tilt' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '4px 10px', marginBottom: '10px' }} data-testid="pip-insight">
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#818cf8' }} />
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>{insight}</span>
              </div>
            )}
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.15)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {mode === 'tilt'
                ? (hasCtx ? 'I can see your screen.\nAsk anything or tell me what to do.' : 'Ask me anything or say\n"help me do X" for step-by-step guidance.')
                : 'Describe a situation to get\nSafe, Smart & Bold options.'}
            </p>
          </div>
        )}

        {/* Guide view — inline within Tilt mode */}
        {guideActive && guideResult && (
          <div data-testid="guide-view" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', padding: '6px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: guideResult.is_complete ? '#4ade80' : '#818cf8', animation: guideResult.is_complete ? 'none' : 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                  {guideResult.is_complete ? 'Done!' : `Step ${guideStep}`}
                </span>
              </div>
              <button onClick={stopGuide} data-testid="guide-stop-btn" style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px', padding: '3px 10px', cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: "'Inter', sans-serif",
              }}>Stop</button>
            </div>

            {guideSteps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {guideSteps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through' }}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {annotatedImage && (
              <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(129,140,248,0.2)' }}>
                <img src={annotatedImage} alt="Annotated screenshot" data-testid="guide-annotated-image" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            )}

            {!guideResult.is_complete && (
              <div style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: '10px', padding: '10px 12px' }} data-testid="guide-instruction">
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>{guideResult.instruction}</p>
                {guideResult.detail && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>{guideResult.detail}</p>}
              </div>
            )}

            {guideResult.is_complete && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '10px', padding: '12px', textAlign: 'center' }} data-testid="guide-complete">
                <p style={{ fontSize: '14px', color: '#4ade80', margin: 0, fontWeight: '600' }}>Task complete!</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>{guideResult.instruction}</p>
              </div>
            )}

            {!guideResult.is_complete && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(129,140,248,0.4)', animation: `bounce 1.5s ease-in-out ${i*0.2}s infinite` }} />)}
                </div>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>Watching... do the step, I'll auto-advance</span>
              </div>
            )}
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'user' ? (
              <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: '12px 12px 4px 12px', padding: '8px 12px', maxWidth: '85%' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.5', wordBreak: 'break-word' }}>{msg.content}</p>
              </div>
            ) : (
              <div style={{ maxWidth: '95%', width: '100%' }}>
                {msg.decisionType && <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', color: tagColors[msg.decisionType], marginBottom: '3px', display: 'block' }}>{msg.decisionType}</span>}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '4px 12px 12px 12px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: '1.6', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  {msg.reasoning && <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', margin: '6px 0 0' }}>{msg.reasoning}</p>}
                </div>
                <button onClick={() => handleCopy(msg.content, msg.id)} data-testid={`copy-msg-${msg.id}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', color: copied === msg.id ? '#4ade80' : 'rgba(255,255,255,0.2)', fontSize: '10px', fontFamily: "'Inter', sans-serif", marginTop: '2px' }}>
                  {copied === msg.id ? 'copied' : 'copy'}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Decision cards */}
        {decisions && (
          <div data-testid="pip-decision-cards" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', padding: '0 6px 4px', display: 'block' }}>arrow keys + Enter</span>
            {['safe', 'smart', 'bold'].map((type, idx) => {
              const d = decisions[type]; const isPref = type === preferred; const isActive = idx === activeIdx;
              return (
                <button key={type} onClick={() => handleSelectDecision(type)} data-testid={`pip-card-${type}`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', border: 'none',
                    background: isActive ? 'rgba(129,140,248,0.12)' : isPref ? 'rgba(129,140,248,0.06)' : 'transparent',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    outline: isActive ? '1px solid rgba(129,140,248,0.25)' : 'none',
                  }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: tagColors[type], flexShrink: 0, width: '40px', textAlign: 'left' }}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <span style={{ flex: 1, fontSize: '12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>{d?.response}</span>
                  {isPref && <span style={{ fontSize: '8px', fontWeight: '600', color: 'rgba(129,140,248,0.5)', background: 'rgba(129,140,248,0.08)', padding: '2px 5px', borderRadius: '4px', flexShrink: 0 }} data-testid={`pip-preferred-${type}`}>pref</span>}
                </button>
              );
            })}
          </div>
        )}

        {loading && (
          <div data-testid="pip-loading" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 4px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(148,163,184,0.4)', animation: `bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />)}
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
              {mode === 'decide' ? 'Generating options...' : 'Thinking...'}
            </span>
          </div>
        )}
      </div>

      {/* Input — always at bottom */}
      <div style={{ padding: '6px 12px 10px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(2,6,23,0.95)' }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(51,65,85,0.5) 0%, rgba(30,41,59,0.6) 100%)',
          backdropFilter: 'blur(24px)', border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 6px 3px 14px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={messages.length > 0 || guideActive ? 'Continue...' : mode === 'decide' ? 'Describe the situation...' : 'Ask anything or say "help me do X"...'}
            data-testid="pip-decision-input" disabled={loading}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !decisions && input.trim()) { e.preventDefault(); handleSubmit(); } }}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '14px', fontFamily: "'Inter', sans-serif", padding: '9px 0', opacity: loading ? 0.4 : 1 }}
          />
          {input.trim() && !loading && (
            <button onClick={handleSubmit} data-testid="pip-submit-btn" style={{
              background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.15)',
              borderRadius: '8px', padding: '5px 12px', cursor: 'pointer',
              color: 'rgba(199,210,254,0.8)', fontSize: '11px', fontFamily: "'Inter', sans-serif", fontWeight: '600',
            }}>Send</button>
          )}
        </div>
        {error && <p style={{ color: '#f87171', fontSize: '10px', marginTop: '4px', fontFamily: 'monospace' }} data-testid="pip-error">{error}</p>}
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
