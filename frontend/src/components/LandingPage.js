import React from 'react';
import { Monitor, Command } from 'lucide-react';

export default function LandingPage({ onStartScreenShare }) {
  return (
    <div
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden"
      data-testid="landing-page"
    >
      {/* Gradient background blobs */}
      <div className="absolute inset-0 bg-[#050505]">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/15 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-900/10 blur-[140px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        {/* Logo */}
        <div className="mb-12" data-testid="tilt-logo">
          <img src="/tilt-logo.svg" alt="Tilt" className="h-10" />
        </div>

        {/* Headline */}
        <h1
          className="font-heading text-5xl md:text-7xl font-light tracking-tighter leading-[1.05] text-white mb-6"
          data-testid="landing-headline"
        >
          Decide better.<br />
          <span className="text-white/40">Not faster.</span>
        </h1>

        {/* Subheading */}
        <p className="font-body text-lg md:text-xl text-white/40 max-w-xl mb-12 leading-relaxed">
          AI that understands what you're doing and helps you choose — without taking over.
        </p>

        {/* CTA Button */}
        <button
          onClick={onStartScreenShare}
          data-testid="start-screen-share-btn"
          className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-body font-medium text-base
                     hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
                     shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
        >
          Start Decision Layer
        </button>

        {/* Hint */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="font-body text-sm text-white/25 leading-relaxed">
            Share your screen once. Call it anytime with{' '}
            <kbd className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 font-mono text-[11px] text-white/40">
              <Command size={10} className="inline" />K
            </kbd>
          </p>
          <p className="font-body text-xs text-white/15 tracking-wide">
            One shortcut. Better decisions everywhere.
          </p>
        </div>
      </div>
    </div>
  );
}
