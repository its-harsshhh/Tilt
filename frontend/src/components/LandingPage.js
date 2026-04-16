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
        {/* White gradient fade from bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-white from-[20%] via-white/50 via-[45%] to-transparent to-[70%]" />
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
          Decide better.<br />
          <span style={{ color: '#475569' }}>Not faster.</span>
        </h1>

        {/* Subheading */}
        <p className="font-body text-base md:text-lg text-slate-500 max-w-lg text-center mb-9 leading-relaxed">
          AI that understands what you're doing and helps you choose — without taking over.
        </p>

        {/* CTA Button */}
        <button
          onClick={onStartScreenShare}
          data-testid="start-screen-share-btn"
          className="px-9 py-3.5 rounded-lg bg-slate-900 text-white font-body font-medium text-[15px]
                     hover:bg-slate-800 active:scale-[0.98] transition-all duration-150
                     shadow-md shadow-slate-900/15"
        >
          Start Decision Layer
        </button>

        {/* Hint */}
        <div className="mt-7 flex flex-col items-center gap-2">
          <p className="font-body text-[13px] text-slate-400 leading-relaxed">
            Share your screen once. Call it anytime with{' '}
            <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-500">
              <Command size={9} className="inline" />K
            </kbd>
          </p>
          <p className="font-body text-[11px] text-slate-300">
            One shortcut. Better decisions everywhere.
          </p>
        </div>
      </div>
    </div>
  );
}
