import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, Loader2 } from 'lucide-react';
import DecisionCards from './DecisionCards';
import OutputView from './OutputView';
import { getPreferredStyle, getInsightText, getMemory } from '../hooks/useMemory';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CommandPalette({ isOpen, onClose, screenContext }) {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('input'); // input | loading | decisions | output
  const [decisions, setDecisions] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const insight = getInsightText();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      // Reset state when closed
      setPhase('input');
      setInput('');
      setDecisions(null);
      setSelectedType(null);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
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
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate decisions');
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
    setPhase('output');
  };

  const handleNewDecision = () => {
    setPhase('input');
    setInput('');
    setDecisions(null);
    setSelectedType(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      data-testid="command-palette-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-3xl mx-6 glass-surface rounded-3xl overflow-hidden animate-zoom-in"
        data-testid="command-palette-modal"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <img src="/tilt-logo.svg" alt="Tilt" className="h-4" data-testid="tilt-logo" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/30">
              {phase === 'loading' ? 'Thinking...' : phase === 'decisions' ? 'Choose your approach' : phase === 'output' ? 'Response ready' : 'Decision mode'}
            </span>
          </div>
          <button
            onClick={onClose}
            data-testid="close-palette-btn"
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <X size={14} className="text-white/40" />
          </button>
        </div>

        {/* Insight bar */}
        {insight && (
          <div className="px-6 py-2.5 border-b border-white/5 bg-white/[0.02]" data-testid="insight-bar">
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/25">
              {insight}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {phase === 'input' && (
            <form onSubmit={handleSubmit} data-testid="decision-input-form">
              <div className="flex items-start gap-4">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="What do you want to do here?"
                  data-testid="decision-input"
                  rows={3}
                  className="flex-1 bg-transparent border-none text-2xl md:text-3xl font-heading font-light text-white placeholder-zinc-700 focus:outline-none focus:ring-0 resize-none leading-tight"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  data-testid="submit-decision-btn"
                  className="mt-1 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center justify-center flex-shrink-0"
                >
                  <ArrowRight size={16} className="text-white" />
                </button>
              </div>
              {error && (
                <p className="mt-4 text-red-400/80 font-mono text-xs" data-testid="error-message">{error}</p>
              )}
            </form>
          )}

          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4" data-testid="loading-state">
              <Loader2 size={24} className="text-white/30 animate-spin" />
              <span className="font-mono text-xs tracking-widest uppercase text-white/20">
                Generating options...
              </span>
            </div>
          )}

          {phase === 'decisions' && decisions && (
            <DecisionCards
              decisions={decisions}
              onSelect={handleSelect}
              preferredStyle={getPreferredStyle()}
            />
          )}

          {phase === 'output' && decisions && selectedType && (
            <OutputView
              decisions={decisions}
              selectedType={selectedType}
              inputText={input}
              onNewDecision={handleNewDecision}
              onClose={onClose}
            />
          )}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-white/15">
            esc to close
          </span>
          {phase === 'input' && (
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/15">
              enter to submit
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
