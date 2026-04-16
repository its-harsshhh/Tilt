import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getPreferredStyle, getInsightText, getMemory, saveDecision } from '../hooks/useMemory';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TILT_ICON_SVG = `<svg width="738" height="482" viewBox="0 0 738 482" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M350.531 196.624L352.753 197.457C354.06 202.978 302.483 453.235 296.829 481.207L165.513 481.203L162.854 480.035C161.5 471.742 204.033 270.846 209.238 247.113C249.839 229.547 306.098 215.246 350.531 196.624Z" fill="white"/><path d="M737.508 0C672.666 35.4666 644.52 52.7052 572.998 80.8864C567.602 82.6882 558.684 85.9164 553.404 87.1426C518.816 101.993 462.272 119.645 426.196 130.248C371.896 146.207 309.881 163.299 253.959 176.005L248.565 177.22C239.517 181.258 180.231 194.961 168.271 197.86C112.084 211.361 55.9912 225.256 0 239.544L25.7739 105.836C83.2496 99.5242 155.99 85.3555 215.305 76.6787L421.234 44.6443C456.568 39.1878 498.244 31.9869 533.281 28.2369C542.046 25.7658 567.113 22.7049 577.236 21.2403L590.026 19.3714C619.875 15.0433 649.758 10.9463 679.671 7.08083C698.019 4.75801 719.844 2.95118 737.508 0Z" fill="url(#g1)"/><defs><linearGradient id="g1" x1="0" y1="222" x2="738" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#2DB7DB"/><stop offset="0.49" stop-color="#3D29A9"/><stop offset="1" stop-color="#E82692"/></linearGradient></defs></svg>`;
const TILT_ICON_DATA_URI = 'data:image/svg+xml,' + encodeURIComponent(TILT_ICON_SVG);

// Pill definitions
const TILT_PILLS = [
  "Summarize what I'm looking at",
  "What should I do next?",
  "Is this a good decision?",
  "Improve this message",
  "Spot issues here",
  "Give a better option",
];

const DECIDE_PILLS = [
  "Help me reply to this",
  "Make this more confident",
  "Say this more clearly",
  "Handle this politely",
  "What should I do here?",
  "Rewrite this better",
];

const CONTEXT_PILLS = [
  "Show trade-offs",
  "What am I missing?",
  "Make it shorter",
  "Make it more direct",
  "Explain why",
  "Alternative approach",
];

// Shared pill component
function Pills({ items, onSelect, testPrefix }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }} data-testid={`${testPrefix}-pills`}>
      {items.map((label, i) => (
        <button key={i} onClick={() => onSelect(label)} data-testid={`${testPrefix}-pill-${i}`}
          style={{
            padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
            fontSize: '12px', fontFamily: "'Inter', sans-serif", cursor: 'pointer',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(129,140,248,0.12)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.2)'; e.currentTarget.style.color = 'rgba(199,210,254,0.8)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >{label}</button>
      ))}
    </div>
  );
}

// Insight layer component
function InsightLayer({ insights }) {
  if (!insights) return null;
  const { trade_offs, blind_spots, recommendation } = insights;
  const hasContent = trade_offs || blind_spots || recommendation;
  if (!hasContent) return null;

  return (
    <div data-testid="insight-layer" style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '6px',
    }}>
      {trade_offs && (
        <div>
          <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)' }}>Trade-offs</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            {['safe', 'smart', 'bold'].map(t => trade_offs[t] && (
              <div key={t} style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: t === 'safe' ? '#94a3b8' : t === 'smart' ? '#e2e8f0' : '#fbbf24', width: '36px', flexShrink: 0 }}>{t}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{trade_offs[t]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {blind_spots && (
        <div>
          <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)' }}>Blind spot</span>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0', lineHeight: '1.5' }}>{blind_spots}</p>
        </div>
      )}
      {recommendation && (
        <div style={{ background: 'rgba(129,140,248,0.06)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(129,140,248,0.08)' }}>
          <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(129,140,248,0.5)' }}>What to do now</span>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '3px 0 0', lineHeight: '1.4', fontWeight: '500' }}>{recommendation}</p>
        </div>
      )}
    </div>
  );
}

export default function FloatingPalette({ screenContext, captureFrameFn, micFns, collapsed, onCollapse, onExpand }) {
  if (collapsed) {
    return (
      <div data-testid="floating-palette-collapsed" onClick={onExpand} style={{
        width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(15,23,42,0.95)', cursor: 'pointer',
      }}>
        <img src={TILT_ICON_DATA_URI} alt="Tilt" style={{ width: '32px', height: 'auto', opacity: 0.9 }} />
      </div>
    );
  }
  return <PaletteExpanded screenContext={screenContext} captureFrameFn={captureFrameFn} micFns={micFns} onCollapse={onCollapse} />;
}

function PaletteExpanded({ screenContext, captureFrameFn, micFns, onCollapse }) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('tilt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  // Tilt state
  const [tiltMessages, setTiltMessages] = useState([]);
  const [guideActive, setGuideActive] = useState(false);
  const [guideTask, setGuideTask] = useState(null);
  const [guideStep, setGuideStep] = useState(1);
  const [guideSteps, setGuideSteps] = useState([]);
  const [guideResult, setGuideResult] = useState(null);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  // Decide state
  const [decideMessages, setDecideMessages] = useState([]);
  const [decisions, setDecisions] = useState(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [selectedType, setSelectedType] = useState(null);
  const [decideInsights, setDecideInsights] = useState(null);
  const [lastDecideInput, setLastDecideInput] = useState('');
  // Voice
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const submittingRef = useRef(false);
  const guideIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const lastSpokenRef = useRef('');
  const recordingPromiseRef = useRef(null);

  const messages = mode === 'tilt' ? tiltMessages : decideMessages;
  const preferred = getPreferredStyle();
  const insight = getInsightText();
  const hasCtx = screenContext && screenContext !== 'Observing...' && screenContext.length > 15;

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [tiltMessages, decideMessages, loading, decisions, guideResult, annotatedImage, decideInsights]);
  useEffect(() => { return () => { if (guideIntervalRef.current) clearInterval(guideIntervalRef.current); }; }, []);

  const handleCopy = useCallback(async (text, id) => {
    try { await navigator.clipboard.writeText(text); } catch { const el = document.createElement('textarea'); el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); }
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  }, []);

  const captureFrame = useCallback(() => captureFrameFn ? captureFrameFn() : null, [captureFrameFn]);

  // TTS
  const speakText = useCallback(async (text) => {
    if (!voiceMode || !text || text === lastSpokenRef.current) return;
    lastSpokenRef.current = text; setSpeaking(true);
    try {
      const res = await fetch(`${API_URL}/api/speak`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice: 'nova' }) });
      if (!res.ok) return;
      const data = await res.json();
      if (data.audio_base64) { if (audioRef.current) { audioRef.current.pause(); } const a = new Audio(`data:audio/mp3;base64,${data.audio_base64}`); audioRef.current = a; a.onended = () => setSpeaking(false); a.onerror = () => setSpeaking(false); await a.play(); }
    } catch (e) {} finally { setTimeout(() => setSpeaking(false), 100); }
  }, [voiceMode]);

  useEffect(() => { if (voiceMode && guideResult?.instruction) speakText(guideResult.instruction); }, [voiceMode, guideResult, speakText]);

  // Annotation drawing
  const drawAnnotation = useCallback((frameDataUrl, region) => {
    if (!region) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      const cx = region.x * img.width, cy = region.y * img.height;
      ctx.strokeStyle = 'rgba(129,140,248,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, img.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(img.width, cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(129,140,248,0.9)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fillStyle = '#818cf8'; ctx.fill();
      if (region.label) {
        ctx.font = '600 12px Inter, sans-serif'; const tw = ctx.measureText(region.label).width;
        const lx = Math.min(cx + 22, img.width - tw - 12), ly = cy - 8;
        ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.beginPath(); ctx.roundRect(lx-4, ly-12, tw+8, 16, 4); ctx.fill();
        ctx.fillStyle = '#c7d2fe'; ctx.fillText(region.label, lx, ly);
      }
      setAnnotatedImage(c.toDataURL('image/jpeg', 0.85));
    }; img.src = frameDataUrl;
  }, []);

  // ===== TILT MODE =====
  const sendTilt = useCallback(async (text) => {
    if (!text.trim() || submittingRef.current) return;
    submittingRef.current = true;
    setTiltMessages(prev => [...prev, { role: 'user', content: text.trim(), id: Date.now() }]);
    setInput(''); setLoading(true); setError(null);
    const memory = getMemory(); const pref = getPreferredStyle();
    const frame = captureFrame();
    const conv = tiltMessages.map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch(`${API_URL}/api/tilt`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), image_base64: frame || null, screen_context: screenContext || null, conversation: conv, user_preference: pref !== 'smart' ? pref : null, tone_traits: memory.toneTraits.length > 0 ? memory.toneTraits : null }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Failed'); }
      const data = await res.json();
      if (data.type === 'guide') {
        setGuideActive(true); setGuideTask(text.trim()); setGuideStep(data.step_number || 1); setGuideSteps([]); setGuideResult(data);
        if (frame) drawAnnotation(frame, data.region);
        setTiltMessages(prev => [...prev, { role: 'assistant', id: Date.now() + 1, isGuide: true, guideData: data, content: data.instruction }]);
        if (guideIntervalRef.current) clearInterval(guideIntervalRef.current);
        guideIntervalRef.current = setInterval(() => autoAdvance(text.trim(), data, 1, []), 6000);
      } else {
        setTiltMessages(prev => [...prev, { role: 'assistant', content: data.response, id: Date.now() + 1 }]);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); submittingRef.current = false; setTimeout(() => inputRef.current?.focus(), 100); }
  }, [tiltMessages, screenContext, captureFrame, drawAnnotation]);

  const autoAdvance = useCallback(async (task, prev, prevStep, prevSteps) => {
    const frame = captureFrame(); if (!frame) return;
    const completed = [...prevSteps]; if (prev?.step_summary) completed.push(prev.step_summary);
    try {
      const res = await fetch(`${API_URL}/api/tilt`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: task, image_base64: frame, guide_active: true, guide_task: task, completed_steps: completed, step_number: prevStep + 1 }),
      });
      if (!res.ok) return; const data = await res.json();
      if (data.type === 'guide') { setGuideResult(data); setGuideStep(data.step_number || prevStep + 1); setGuideSteps(completed); drawAnnotation(frame, data.region); if (data.is_complete && guideIntervalRef.current) clearInterval(guideIntervalRef.current); }
    } catch (e) {}
  }, [captureFrame, drawAnnotation]);

  useEffect(() => {
    if (guideActive && guideTask && guideResult && !guideResult.is_complete) { if (guideIntervalRef.current) clearInterval(guideIntervalRef.current); guideIntervalRef.current = setInterval(() => autoAdvance(guideTask, guideResult, guideStep, guideSteps), 6000); }
    return () => { if (guideIntervalRef.current && (!guideActive || guideResult?.is_complete)) clearInterval(guideIntervalRef.current); };
  }, [guideActive, guideTask, guideResult, guideStep, guideSteps, autoAdvance]);

  const stopGuide = useCallback(() => {
    setGuideActive(false); setGuideTask(null); setGuideResult(null); setAnnotatedImage(null); setGuideStep(1); setGuideSteps([]);
    if (guideIntervalRef.current) clearInterval(guideIntervalRef.current);
  }, []);

  // ===== DECIDE MODE =====
  const sendDecide = useCallback(async (text, modifier, prevResponse) => {
    if (!text.trim() || submittingRef.current) return;
    submittingRef.current = true;
    if (modifier) {
      // Context pill refinement — show the pill as user message
      setDecideMessages(prev => [...prev, { role: 'user', content: modifier, id: Date.now() }]);
    } else {
      setDecideMessages(prev => [...prev, { role: 'user', content: text.trim(), id: Date.now() }]);
      setLastDecideInput(text.trim());
    }
    setInput(''); setLoading(true); setError(null); setDecisions(null); setActiveIdx(-1); setSelectedType(null); setDecideInsights(null);
    const memory = getMemory(); const pref = getPreferredStyle();
    try {
      const res = await fetch(`${API_URL}/api/generate-decisions`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_text: text.trim(), context: screenContext || null, user_preference: pref !== 'smart' ? pref : null, tone_traits: memory.toneTraits.length > 0 ? memory.toneTraits : null, modifier: modifier || null, previous_response: prevResponse || null }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Failed'); }
      const data = await res.json();
      setDecisions(data); setDecideInsights(data.insights || null);
      const types = ['safe', 'smart', 'bold'];
      setActiveIdx(types.indexOf(pref) >= 0 ? types.indexOf(pref) : 1);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); submittingRef.current = false; }
  }, [screenContext]);

  const handleSelectDecision = useCallback((type) => {
    if (!decisions) return;
    saveDecision(type, lastDecideInput, decisions[type]?.response);
    setSelectedType(type);
    setDecideMessages(prev => [...prev, { role: 'assistant', content: decisions[type]?.response, id: Date.now(), decisionType: type, reasoning: decisions?.reasoning?.[type] }]);
    setDecisions(null); setActiveIdx(-1);
  }, [decisions, lastDecideInput]);

  const handleContextPill = useCallback((pill) => {
    if (!lastDecideInput || !selectedType || !decideMessages.length) return;
    const lastResp = decideMessages[decideMessages.length - 1]?.content || '';
    sendDecide(lastDecideInput, pill, lastResp);
  }, [lastDecideInput, selectedType, decideMessages, sendDecide]);

  // ===== SUBMIT =====
  const handleSubmit = useCallback(() => {
    if (!input.trim() || submittingRef.current) return;
    // /clear command — reset current tab to empty/default state
    if (input.trim().toLowerCase() === '/clear') {
      setInput('');
      setError(null);
      if (mode === 'tilt') {
        setTiltMessages([]);
        if (guideActive) stopGuide();
      } else {
        setDecideMessages([]);
        setDecisions(null);
        setActiveIdx(-1);
        setSelectedType(null);
        setDecideInsights(null);
        setLastDecideInput('');
      }
      return;
    }
    if (mode === 'decide') sendDecide(input);
    else sendTilt(input);
  }, [input, mode, sendTilt, sendDecide, guideActive, stopGuide]);

  const handlePillSelect = useCallback((pill) => {
    if (mode === 'tilt') { setInput(pill); setTimeout(() => sendTilt(pill), 50); }
    else { setInput(pill); setTimeout(() => sendDecide(pill), 50); }
  }, [mode, sendTilt, sendDecide]);

  const handleTiltPillThenDecide = useCallback((pill) => {
    setMode('decide'); setInput(pill);
    setTimeout(() => sendDecide(pill), 50);
  }, [sendDecide]);

  // Voice
  const startRecording = useCallback(async () => {
    if (micFns) { try { setRecording(true); recordingPromiseRef.current = micFns.startMicRecording(); } catch { setError('Mic access denied'); setRecording(false); } return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mt = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const rec = new MediaRecorder(stream, { mimeType: mt }); audioChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      rec.onstop = async () => { stream.getTracks().forEach(t => t.stop()); const blob = new Blob(audioChunksRef.current, { type: mt }); await processAudio(blob); };
      mediaRecorderRef.current = rec; rec.start(); setRecording(true);
    } catch { setError('Mic access denied'); }
  }, [micFns]);

  const stopRecording = useCallback(async () => {
    setRecording(false);
    if (micFns) { micFns.stopMicRecording(); try { const blob = await recordingPromiseRef.current; if (blob) await processAudio(blob); } catch { setError('Recording failed'); } }
    else if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  }, [micFns]);

  const processAudio = useCallback(async (blob) => {
    if (blob.size < 500) return;
    setTranscribing(true);
    try {
      const form = new FormData(); form.append('file', blob, `voice.${blob.type.includes('webm') ? 'webm' : 'mp4'}`);
      const res = await fetch(`${API_URL}/api/transcribe`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Transcription failed');
      const data = await res.json();
      if (data.text?.trim()) { setInput(data.text.trim()); setTimeout(() => { if (mode === 'decide') sendDecide(data.text.trim()); else sendTilt(data.text.trim()); }, 300); }
    } catch (err) { setError(err.message); } finally { setTranscribing(false); }
  }, [mode, sendTilt, sendDecide]);

  const toggleRecording = useCallback(() => { if (recording) stopRecording(); else startRecording(); }, [recording, startRecording, stopRecording]);

  const handleKeyDown = (e) => {
    if (decisions) {
      const types = ['safe', 'smart', 'bold'];
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(p => Math.min(p + 1, 2)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(p => Math.max(p - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0) handleSelectDecision(types[activeIdx]); }
    }
  };

  const switchMode = (m) => { if (m !== 'tilt' && guideActive) stopGuide(); setMode(m); setDecisions(null); setActiveIdx(-1); setSelectedType(null); };
  const tagColors = { safe: '#94a3b8', smart: '#e2e8f0', bold: '#fbbf24' };

  return (
    <div data-testid="floating-palette" style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: 'linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(2,6,23,0.99) 100%)', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column' }} onKeyDown={handleKeyDown} tabIndex={-1}>

      {/* Header */}
      <div style={{ padding: '8px 12px 6px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '3px', flex: 1 }}>
            {[
              { key: 'tilt', label: 'Tilt', sub: 'Ask & Guide' },
              { key: 'decide', label: 'Decide', sub: '3 Options' },
            ].map(t => (
              <button key={t.key} onClick={() => switchMode(t.key)} data-testid={`mode-${t.key}-btn`}
                style={{
                  flex: 1, padding: '5px 0 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: mode === t.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
                  fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: mode === t.key ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)' }}>{t.label}</span>
                <span style={{ fontSize: '9px', fontWeight: '500', color: mode === t.key ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', letterSpacing: '0.02em' }}>{t.sub}</span>
              </button>
            ))}
          </div>
          {mode === 'tilt' && (
            <button onClick={() => { setVoiceMode(v => !v); if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }} data-testid="voice-mode-btn"
              style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: voiceMode ? 'rgba(129,140,248,0.2)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke={voiceMode ? '#818cf8' : 'rgba(255,255,255,0.25)'}>
                {voiceMode ? <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></> : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
              </svg>
            </button>
          )}
          {onCollapse && (
            <button onClick={onCollapse} data-testid="collapse-btn" style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Screen context — compact, purposeful */}
        {hasCtx && !guideActive && messages.length === 0 && !loading && (
          <div data-testid="pip-screen-context" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99,102,241,0.04)', borderRadius: '8px', padding: '6px 10px', border: '1px solid rgba(99,102,241,0.06)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(129,140,248,0.5)" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'rgba(129,140,248,0.5)', fontWeight: '600' }}>Seeing: </span>{screenContext}
            </p>
          </div>
        )}

        {/* ====== TILT TAB — empty state ====== */}
        {mode === 'tilt' && messages.length === 0 && !loading && !guideActive && (
          <div style={{ padding: '12px 0 0' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: '500', margin: '0 0 4px', lineHeight: '1.4' }}>
              {hasCtx ? 'I can see your screen.' : 'Your AI co-pilot.'}
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: '0 0 14px' }}>
              {hasCtx ? 'Ask me anything or pick a prompt below.' : 'Share your screen and ask anything.'}
            </p>
            <p style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.2)', margin: '0 0 8px' }}>Try asking</p>
            <Pills items={TILT_PILLS} onSelect={(p) => handlePillSelect(p)} testPrefix="tilt" />
          </div>
        )}

        {/* ====== DECIDE TAB — empty state ====== */}
        {mode === 'decide' && decideMessages.length === 0 && !loading && !decisions && (
          <div style={{ padding: '12px 0 0' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: '500', margin: '0 0 4px', lineHeight: '1.4' }}>
              Get Safe, Smart & Bold options.
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: '0 0 14px' }}>
              Describe a situation and I'll give you 3 ways to handle it.
            </p>
            <p style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.2)', margin: '0 0 8px' }}>Quick prompts</p>
            <Pills items={DECIDE_PILLS} onSelect={(p) => handlePillSelect(p)} testPrefix="decide" />
          </div>
        )}

        {/* Guide header */}
        {guideActive && guideResult && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', padding: '6px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: guideResult.is_complete ? '#4ade80' : '#818cf8', animation: guideResult.is_complete ? 'none' : 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{guideResult.is_complete ? 'Done!' : `Step ${guideStep}`}</span>
              {voiceMode && <span style={{ fontSize: '9px', color: speaking ? '#818cf8' : 'rgba(129,140,248,0.4)' }}>{speaking ? 'Speaking...' : 'Voice on'}</span>}
            </div>
            <button onClick={stopGuide} data-testid="guide-stop-btn" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: "'Inter', sans-serif" }}>Stop</button>
          </div>
        )}
        {guideSteps.length > 0 && guideSteps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '1px 6px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through' }}>{s}</span>
          </div>
        ))}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'user' ? (
              <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: '12px 12px 4px 12px', padding: '8px 12px', maxWidth: '85%' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.5', wordBreak: 'break-word' }}>{msg.content}</p>
              </div>
            ) : (
              <div style={{ maxWidth: '100%', width: '100%' }}>
                {msg.decisionType && <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', color: tagColors[msg.decisionType], marginBottom: '3px', display: 'block' }}>{msg.decisionType}</span>}
                {msg.isGuide ? (
                  <div data-testid="guide-view" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {annotatedImage && <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(129,140,248,0.2)' }}><img src={annotatedImage} alt="Guide" data-testid="guide-annotated-image" style={{ width: '100%', height: 'auto', display: 'block' }} /></div>}
                    <div style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: '10px', padding: '10px 12px' }} data-testid="guide-instruction">
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>{guideResult?.instruction || msg.content}</p>
                      {(guideResult?.detail) && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>{guideResult.detail}</p>}
                    </div>
                    {!guideResult?.is_complete && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 2px' }}><div style={{ display: 'flex', gap: '3px' }}>{[0,1,2].map(i => <div key={i} style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(129,140,248,0.4)', animation: `bounce 1.5s ease-in-out ${i*0.2}s infinite` }} />)}</div><span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.18)' }}>Watching...</span></div>}
                    {guideResult?.is_complete && <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }} data-testid="guide-complete"><p style={{ fontSize: '12px', color: '#4ade80', margin: 0, fontWeight: '600' }}>Task complete!</p></div>}
                  </div>
                ) : (
                  <>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '4px 12px 12px 12px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: '1.6', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      {msg.reasoning && <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', margin: '6px 0 0' }}>{msg.reasoning}</p>}
                    </div>
                    <button onClick={() => handleCopy(msg.content, msg.id)} data-testid={`copy-msg-${msg.id}`} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', color: copied === msg.id ? '#4ade80' : 'rgba(255,255,255,0.2)', fontSize: '10px', fontFamily: "'Inter', sans-serif", marginTop: '2px' }}>{copied === msg.id ? 'copied' : 'copy'}</button>
                  </>
                )}
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
                <button key={type} onClick={() => handleSelectDecision(type)} data-testid={`pip-card-${type}`} onMouseEnter={() => setActiveIdx(idx)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', border: 'none', background: isActive ? 'rgba(129,140,248,0.12)' : isPref ? 'rgba(129,140,248,0.06)' : 'transparent', cursor: 'pointer', fontFamily: "'Inter', sans-serif", outline: isActive ? '1px solid rgba(129,140,248,0.25)' : 'none' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: tagColors[type], flexShrink: 0, width: '40px', textAlign: 'left' }}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <span style={{ flex: 1, fontSize: '12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>{d?.response}</span>
                  {isPref && <span style={{ fontSize: '8px', fontWeight: '600', color: 'rgba(129,140,248,0.5)', background: 'rgba(129,140,248,0.08)', padding: '2px 5px', borderRadius: '4px', flexShrink: 0 }} data-testid={`pip-preferred-${type}`}>pref</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Context pills — shown after selecting a decision */}
        {mode === 'decide' && selectedType && !decisions && !loading && (
          <div style={{ marginTop: '4px' }}>
            <p style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.2)', marginBottom: '6px' }}>Refine this response</p>
            <Pills items={CONTEXT_PILLS} onSelect={handleContextPill} testPrefix="context" />
          </div>
        )}

        {/* Insight layer — shown after decision output */}
        {mode === 'decide' && selectedType && decideInsights && !decisions && !loading && (
          <InsightLayer insights={decideInsights} />
        )}

        {loading && (
          <div data-testid="pip-loading" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 4px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>{[0,1,2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(148,163,184,0.4)', animation: `bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />)}</div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>{mode === 'decide' ? 'Generating options...' : 'Thinking...'}</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ padding: '6px 12px 10px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(2,6,23,0.95)' }}>
        <div style={{ background: 'linear-gradient(180deg, rgba(51,65,85,0.5) 0%, rgba(30,41,59,0.6) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 6px 3px 14px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={transcribing ? 'Transcribing...' : recording ? 'Listening...' : messages.length > 0 || guideActive ? 'Continue...' : mode === 'decide' ? 'Describe the situation...' : 'Ask anything...'}
            data-testid="pip-decision-input" disabled={loading || recording || transcribing}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !decisions && input.trim()) { e.preventDefault(); e.stopPropagation(); handleSubmit(); } }}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '14px', fontFamily: "'Inter', sans-serif", padding: '9px 0', opacity: (loading || transcribing) ? 0.4 : 1 }}
          />
          <button onClick={toggleRecording} data-testid="pip-mic-btn" disabled={loading || transcribing}
            style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: recording ? 'rgba(239,68,68,0.3)' : transcribing ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: recording ? 'pulse 1s infinite' : 'none' }}>
            {transcribing ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(129,140,248,0.4)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke={recording ? '#ef4444' : 'rgba(255,255,255,0.4)'}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
          </button>
          {input.trim() && !loading && !recording && !transcribing && (
            <button onClick={handleSubmit} data-testid="pip-submit-btn" style={{ background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', color: 'rgba(199,210,254,0.8)', fontSize: '11px', fontFamily: "'Inter', sans-serif", fontWeight: '600' }}>Send</button>
          )}
        </div>
        {error && <p style={{ color: '#f87171', fontSize: '10px', marginTop: '4px', fontFamily: 'monospace' }} data-testid="pip-error">{error}</p>}
        {/* Subtle preference footer */}
        {insight && messages.length === 0 && !loading && (
          <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.12)', margin: '4px 0 0', textAlign: 'center' }} data-testid="pip-insight">{insight}</p>
        )}
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
