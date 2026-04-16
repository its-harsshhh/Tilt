import React, { useState } from 'react';
import { Copy, Check, RotateCcw, Shield, Lightbulb, Zap } from 'lucide-react';
import { saveDecision } from '../hooks/useMemory';

const typeConfig = {
  safe: { icon: Shield, label: 'Safe Response', color: 'text-zinc-400', bg: 'bg-zinc-800/50' },
  smart: { icon: Lightbulb, label: 'Smart Response', color: 'text-white', bg: 'bg-white/5' },
  bold: { icon: Zap, label: 'Bold Response', color: 'text-yellow-400', bg: 'bg-yellow-400/5' },
};

export default function OutputView({ decisions, selectedType, inputText, onNewDecision, onClose }) {
  const [copied, setCopied] = useState(false);
  const config = typeConfig[selectedType];
  const Icon = config.icon;
  const decision = decisions[selectedType];
  const reasoning = decisions.reasoning?.[selectedType];

  // Save to memory on mount
  React.useEffect(() => {
    saveDecision(selectedType, inputText, decision?.response);
  }, [selectedType, inputText, decision]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(decision?.response || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = decision?.response || '';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-slide-up" data-testid="output-view">
      {/* Type label */}
      <div className="flex items-center gap-2.5 mb-6">
        <Icon size={15} className={config.color} strokeWidth={1.5} />
        <span className={`font-mono text-[10px] tracking-widest uppercase ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* Response text */}
      <div className={`${config.bg} rounded-xl border border-white/5 p-6 mb-5`} data-testid="output-response">
        <p className="font-body text-lg leading-relaxed text-white/90">
          {decision?.response}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleCopy}
          data-testid="copy-response-btn"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all text-sm font-body text-white/70"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={onNewDecision}
          data-testid="new-decision-btn"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-body text-white/40"
        >
          <RotateCcw size={14} />
          New Decision
        </button>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div className="border-t border-white/5 pt-5" data-testid="reasoning-section">
          <span className="font-mono text-[10px] tracking-widest uppercase text-white/20 block mb-2">
            Why this works
          </span>
          <p className="font-body text-sm text-white/40 leading-relaxed">
            {reasoning}
          </p>
        </div>
      )}
    </div>
  );
}
