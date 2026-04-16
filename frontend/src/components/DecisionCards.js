import React from 'react';
import { Shield, Lightbulb, Zap } from 'lucide-react';

const cardConfig = {
  safe: {
    icon: Shield,
    style: 'bg-zinc-900/50 border border-white/5 text-zinc-300 hover:bg-zinc-800/80 hover:border-white/10',
    labelColor: 'text-zinc-400',
    iconColor: 'text-zinc-500',
  },
  smart: {
    icon: Lightbulb,
    style: 'bg-white/5 border border-white/20 text-white hover:bg-white/10 hover:border-white/30 shadow-lg',
    labelColor: 'text-white',
    iconColor: 'text-white/70',
  },
  bold: {
    icon: Zap,
    style: 'bg-zinc-100 text-black hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.15)]',
    labelColor: 'text-black',
    iconColor: 'text-black/60',
  },
};

export default function DecisionCards({ decisions, onSelect, preferredStyle }) {
  const types = ['safe', 'smart', 'bold'];

  return (
    <div className="animate-slide-up" data-testid="decision-cards">
      {/* Header */}
      <p className="font-mono text-[10px] tracking-widest uppercase text-white/25 mb-5">
        How do you want to approach this?
      </p>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {types.map((type) => {
          const config = cardConfig[type];
          const Icon = config.icon;
          const decision = decisions[type];
          const isPreferred = type === preferredStyle;

          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              data-testid={`decision-card-${type}`}
              className={`relative group text-left rounded-xl p-5 transition-all duration-200 cursor-pointer
                ${config.style}
                ${isPreferred ? 'ring-1 ring-white/20' : ''}
                hover:scale-[1.02] active:scale-[0.98]`}
            >
              {/* Preferred badge */}
              {isPreferred && (
                <div className="absolute -top-2 right-3" data-testid={`preferred-badge-${type}`}>
                  <span className="font-mono text-[8px] tracking-widest uppercase bg-white/10 text-white/50 px-2 py-0.5 rounded-full border border-white/10">
                    Preferred
                  </span>
                </div>
              )}

              {/* Icon + Label */}
              <div className="flex items-center gap-2.5 mb-3">
                <Icon size={15} className={config.iconColor} strokeWidth={1.5} />
                <span className={`font-heading font-medium text-sm uppercase tracking-wide ${config.labelColor}`}>
                  {decision?.label || type}
                </span>
              </div>

              {/* Description */}
              <p className={`font-mono text-[10px] tracking-wide uppercase mb-4 ${type === 'bold' ? 'text-black/40' : 'text-white/25'}`}>
                {decision?.description}
              </p>

              {/* Preview */}
              <p className={`font-body text-sm leading-relaxed line-clamp-3 ${type === 'bold' ? 'text-black/70' : 'text-white/50'}`}>
                {decision?.response}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
