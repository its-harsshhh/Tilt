import React from 'react';
import { Command } from 'lucide-react';

const FEATURES = [
  {
    title: 'Sees what you\'re working on',
    copy: 'Understands your screen and gives suggestions based on what you\'re actually doing.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    span: 'col-span-1 md:col-span-1',
    accent: 'from-indigo-50 to-blue-50',
    border: 'border-indigo-100/60',
  },
  {
    title: 'One shortcut. Instant clarity.',
    copy: 'Press \u2318K anywhere to get clear options without breaking your flow.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    span: 'col-span-1 md:col-span-1',
    accent: 'from-amber-50 to-orange-50',
    border: 'border-amber-100/60',
  },
  {
    title: 'Not answers. Better choices.',
    copy: 'Get Safe, Smart, and Bold options so you can choose what actually fits.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    span: 'col-span-1 md:col-span-1',
    accent: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-100/60',
  },
  {
    title: 'Learns how you decide',
    copy: 'Gets better with every choice and aligns with how you think over time.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    span: 'col-span-1 md:col-span-1',
    accent: 'from-violet-50 to-purple-50',
    border: 'border-violet-100/60',
  },
  {
    title: 'See trade-offs and blind spots',
    copy: 'Understand what you might miss before making a decision.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    span: 'col-span-1 md:col-span-1',
    accent: 'from-pink-50 to-rose-50',
    border: 'border-pink-100/60',
  },
  {
    title: 'Guides you step by step',
    copy: 'Get voice-guided help while you work. No switching tabs, no guessing.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
      </svg>
    ),
    span: 'col-span-1 md:col-span-1',
    accent: 'from-sky-50 to-cyan-50',
    border: 'border-sky-100/60',
  },
];

function FeatureCard({ title, copy, icon, accent, border }) {
  return (
    <div
      className={`group relative bg-gradient-to-br ${accent} border ${border} rounded-2xl p-6 
                  transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div className="mb-4 w-10 h-10 rounded-xl bg-white/80 border border-white shadow-sm flex items-center justify-center
                      group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-body text-[15px] font-semibold text-slate-800 mb-1.5 leading-snug">{title}</h3>
      <p className="font-body text-[13px] text-slate-500 leading-relaxed">{copy}</p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className="relative bg-white py-24 px-6 overflow-hidden" data-testid="features-section">
      {/* Ghibli art — one image per position with gradient fade */}
      {/* Top-right: clouds */}
      <div className="absolute top-0 right-0 w-[340px] h-[220px] pointer-events-none overflow-hidden">
        <img src="/ghibli-clouds.jpg" alt="" className="w-full h-full object-cover object-center" style={{ opacity: 0.12 }} />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
      </div>
      {/* Left-center: summer scene */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-8 w-[260px] h-[200px] pointer-events-none overflow-hidden">
        <img src="/ghibli-summer.jpg" alt="" className="w-full h-full object-cover object-right" style={{ opacity: 0.1 }} />
        <div className="absolute inset-0 bg-gradient-to-l from-white via-white/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/80" />
      </div>
      {/* Bottom-right: mountain */}
      <div className="absolute bottom-0 right-0 w-[320px] h-[200px] pointer-events-none overflow-hidden">
        <img src="/ghibli-mountain.jpg" alt="" className="w-full h-full object-cover object-top" style={{ opacity: 0.1 }} />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/50 to-white" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-[2.6rem] leading-[1.15] mb-4"
            style={{ fontFamily: "'Instrument Serif', serif", color: '#1e293b' }}
          >
            How Tilt helps you decide better
          </h2>
          <p className="font-body text-base text-slate-500 max-w-md mx-auto leading-relaxed">
            Not more answers. Better decisions, in context.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage({ onStartScreenShare, isSharing, onStop, onOpenPalette }) {
  return (
    <div className="relative w-full overflow-y-auto overflow-x-hidden" style={{ height: '100vh' }} data-testid="landing-page">

      {/* ===== HERO ===== */}
      <section className="relative w-full min-h-screen flex flex-col">
        {/* Background */}
        <div className="absolute inset-0">
          <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover" style={{ objectPosition: '50% 35%' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-white from-[18%] via-white/50 via-[42%] to-transparent to-[68%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent via-[12%] to-transparent" />
        </div>

        {/* Logo */}
        <div className="absolute top-6 left-7 z-20" data-testid="tilt-logo">
          <img src="/tilt-logo-dark.svg" alt="Tilt" className="h-7" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6">
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
              <button onClick={onOpenPalette} data-testid="recording-indicator"
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl font-body font-medium text-[14px] cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(180deg, rgba(220,38,38,0.9) 0%, rgba(153,27,27,0.95) 100%)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 0 20px rgba(239,68,68,0.25), 0 8px 24px rgba(153,27,27,0.35)', color: 'rgba(255,255,255,0.95)' }}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                Co-evolving...
              </button>
              <button onClick={onStop} data-testid="stop-sharing-btn"
                className="font-body text-[12px] text-slate-500 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none">
                Stop sharing
              </button>
            </div>
          )}

          <div className="mt-7 flex flex-col items-center gap-2">
            {!isSharing ? (
              <>
                <p className="font-body text-[13px] text-slate-600 leading-relaxed">
                  Share your screen once. Call it anytime with{' '}
                  <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-700">
                    <Command size={9} className="inline" />K
                  </kbd>
                </p>
                <p className="font-body text-[11px] text-slate-500">One shortcut. Better decisions everywhere.</p>
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

          {/* Scroll hint */}
          {!isSharing && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          )}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <FeaturesSection />

      {/* ===== FOOTER — Large watermark logo + dot grid + footer bar ===== */}
      <footer className="relative overflow-hidden" style={{ background: '#fafafa' }} data-testid="footer">
        {/* Dot grid pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 0.8px, transparent 0.8px)',
          backgroundSize: '24px 24px',
          opacity: 0.4,
        }} />

        {/* Large watermark logo */}
        <div className="relative flex items-center justify-center py-20 md:py-28 overflow-hidden">
          <img
            src="/footer-logo.svg"
            alt=""
            className="w-[80%] max-w-[700px] h-auto pointer-events-none select-none"
            style={{ opacity: 0.04 }}
          />
        </div>

        {/* Footer bar */}
        <div className="relative z-10 border-t border-slate-200/60 px-6 md:px-12 py-5">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
              <span className="font-body text-[12px] text-slate-400">
                Built and crafted by Harsh
              </span>
              <span className="text-red-500 text-[12px]">&#10084;</span>
              <span className="text-slate-300 text-[12px]">&#8226;</span>
              <span className="font-body text-[12px] text-slate-400">
                Powered by Chole bhature & AI
              </span>
            </div>

            <span className="font-body text-[12px] text-slate-400">
              &copy; 2026 Harsh Pal. All rights reserved
            </span>

            <div className="flex items-center gap-4">
              {/* X (Twitter) */}
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors" data-testid="footer-x-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors" data-testid="footer-linkedin-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
