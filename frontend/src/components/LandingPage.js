import React from 'react';
import { Command } from 'lucide-react';

export default function LandingPage({ onStartScreenShare, isSharing, onStop, onOpenPalette }) {
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
        <div className="absolute inset-0 bg-gradient-to-t from-white from-[20%] via-white/50 via-[45%] to-transparent to-[70%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent via-[12%] to-transparent" />
      </div>

      {/* Top-left logo */}
      <div className="absolute top-6 left-7 z-20" data-testid="tilt-logo">
        <img src="/tilt-logo-dark.svg" alt="Tilt" className="h-7" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        <h1
          className="text-5xl md:text-[4.8rem] leading-[1.1] text-center mb-6"
          style={{ fontFamily: "'Instrument Serif', serif", color: '#1e293b' }}
          data-testid="landing-headline"
        >
          Decide better, together.
        </h1>

        <p className="font-body text-base md:text-lg text-slate-600 max-w-lg text-center mb-9 leading-relaxed">
          AI that learns your way of deciding and gets better with every choice.
        </p>

        {/* CTA — switches between start and recording state */}
        {!isSharing ? (
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
            Let's decide
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Recording pill */}
            <button
              onClick={onOpenPalette}
              data-testid="recording-indicator"
              className="flex items-center gap-3 px-8 py-3.5 rounded-2xl font-body font-medium text-[14px]
                         cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(180deg, rgba(220,38,38,0.9) 0%, rgba(153,27,27,0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 0 20px rgba(239,68,68,0.25), 0 8px 24px rgba(153,27,27,0.35)',
                color: 'rgba(255,255,255,0.95)',
              }}
            >
              {/* Pulsing dot */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              Co-evolving...
            </button>

            {/* Stop button */}
            <button
              onClick={onStop}
              data-testid="stop-sharing-btn"
              className="font-body text-[12px] text-slate-500 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
            >
              Stop sharing
            </button>
          </div>
        )}

        {/* Hint */}
        <div className="mt-7 flex flex-col items-center gap-2">
          {!isSharing ? (
            <>
              <p className="font-body text-[13px] text-slate-600 leading-relaxed">
                Share your screen once. Call it anytime with{' '}
                <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-700">
                  <Command size={9} className="inline" />K
                </kbd>
              </p>
              <p className="font-body text-[11px] text-slate-500">
                One shortcut. Better decisions everywhere.
              </p>
            </>
          ) : (
            <p className="font-body text-[12px] text-slate-500 leading-relaxed">
              Press{' '}
              <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-700">
                <Command size={9} className="inline" />K
              </kbd>{' '}
              to open Tilt anytime
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
