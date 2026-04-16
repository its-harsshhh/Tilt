import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function ReturnBanner({ visible }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      // Small delay so it doesn't flash during quick tab switches
      const t = setTimeout(() => setShow(true), 200);
      return () => clearTimeout(t);
    } else {
      setShow(false);
    }
  }, [visible]);

  // This banner won't actually be visible when the user is on another tab,
  // but it will be the first thing they see when they return to the Tilt tab.
  // The main purpose is to appear as a "welcome back" indicator when they refocus.
  if (!show) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] animate-slide-up"
      data-testid="return-banner"
    >
      <div className="glass-surface rounded-2xl px-5 py-3 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span className="font-body text-sm text-white/70">
          Cmd+K works here on the <span className="text-white font-medium">Tilt tab</span>
        </span>
        <ArrowUpRight size={14} className="text-white/30" />
      </div>
    </div>
  );
}
