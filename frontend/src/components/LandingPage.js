import React from 'react';
import { Command } from 'lucide-react';

const SKY_BG = 'https://images.unsplash.com/photo-1613742631162-cdba058776b9?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1920&h=1080&fit=crop';

export default function LandingPage({ onStartScreenShare }) {
  return (
    <div
      className="relative w-full h-screen flex flex-col overflow-hidden"
      data-testid="landing-page"
    >
      {/* Sky background image */}
      <div className="absolute inset-0">
        <img
          src={SKY_BG}
          alt=""
          className="w-full h-[70%] object-cover"
          style={{ objectPosition: '50% 60%' }}
        />
        {/* White gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-white from-[30%] via-white/60 via-[50%] to-transparent to-[75%]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 pt-0">
        {/* Logo — on the sky */}
        <div className="mb-6" data-testid="tilt-logo">
          <img src="/tilt-logo.svg" alt="Tilt" className="h-8 drop-shadow-[0_1px_8px_rgba(0,0,0,0.1)]" />
        </div>

        {/* Headline — on the sky/cloud zone */}
        <h1
          className="font-heading text-5xl md:text-[4.5rem] font-bold tracking-tight leading-[1.1] text-white text-center mb-6"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)' }}
          data-testid="landing-headline"
        >
          Decide better.<br />
          <span className="text-white/80">Not faster.</span>
        </h1>

        {/* Subheading — transition zone */}
        <p className="font-body text-base md:text-lg text-slate-500 max-w-lg text-center mb-9 leading-relaxed">
          AI that understands what you're doing and helps you choose — without taking over.
        </p>

        {/* CTA Button — on white */}
        <button
          onClick={onStartScreenShare}
          data-testid="start-screen-share-btn"
          className="px-9 py-3.5 rounded-lg bg-slate-900 text-white font-body font-medium text-[15px]
                     hover:bg-slate-800 active:scale-[0.98] transition-all duration-150
                     shadow-md shadow-slate-900/15"
        >
          Start Decision Layer
        </button>

        {/* Hint — on white */}
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
