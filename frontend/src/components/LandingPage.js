import React from 'react';
import { Command } from 'lucide-react';

export default function LandingPage({ onStartScreenShare }) {
  return (
    <div
      className="relative w-full h-screen flex flex-col overflow-hidden"
      data-testid="landing-page"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/hero-bg.jpg"
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 35%' }}
        />
        {/* White gradient fade from bottom + slight from top for navbar */}
        <div className="absolute inset-0 bg-gradient-to-t from-white from-[20%] via-white/50 via-[45%] to-transparent to-[70%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent via-[12%] to-transparent" />
      </div>

      {/* Top-left logo */}
      <div className="absolute top-6 left-7 z-20" data-testid="tilt-logo">
        <img src="/tilt-logo-dark.svg" alt="Tilt" className="h-7" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        {/* Headline — Instrument Serif, dark shade */}
        <h1
          className="text-5xl md:text-[4.8rem] leading-[1.1] text-center mb-6"
          style={{
            fontFamily: "'Instrument Serif', serif",
            color: '#1e293b',
          }}
          data-testid="landing-headline"
        >
          Decide better, together.
        </h1>

        {/* Subheading — WCAG AA: slate-600 = #475569, 7:1 on white */}
        <p className="font-body text-base md:text-lg text-slate-600 max-w-lg text-center mb-9 leading-relaxed">
          AI that learns your way of deciding and gets better with every choice.
        </p>

        {/* CTA Button — gradient, border, text shadow */}
        <button
          onClick={onStartScreenShare}
          data-testid="start-screen-share-btn"
          className="px-10 py-4 rounded-2xl font-body font-medium text-[15px] text-white
                     active:scale-[0.97] transition-all duration-150 cursor-pointer"
          style={{
            background: 'linear-gradient(180deg, #334155 0%, #0f172a 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 8px 24px rgba(15,23,42,0.35), 0 2px 6px rgba(15,23,42,0.2)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          Start Decision Layer
        </button>

        {/* Hint — WCAG AA compliant */}
        <div className="mt-7 flex flex-col items-center gap-2">
          <p className="font-body text-[13px] text-slate-600 leading-relaxed">
            Share your screen once. Call it anytime with{' '}
            <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-700">
              <Command size={9} className="inline" />K
            </kbd>
          </p>
          <p className="font-body text-[11px] text-slate-500">
            One shortcut. Better decisions everywhere.
          </p>
        </div>
      </div>
    </div>
  );
}
