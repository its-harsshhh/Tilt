import React, { useState, useEffect, useRef, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import ScreenShareView from './components/ScreenShareView';
import CommandPalette from './components/CommandPalette';
import ReturnBanner from './components/ReturnBanner';

export default function App() {
  const [screenStream, setScreenStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isTabAway, setIsTabAway] = useState(false);
  const captureContextRef = useRef('Working');

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        },
        audio: false,
        // Prevent Chrome from showing "Switch to this tab" button
        surfaceSwitching: 'exclude',
        // Prevent sharing the Tilt tab itself (encourage picking another source)
        selfBrowserSurface: 'exclude',
      });

      setScreenStream(stream);
      setIsSharing(true);

      // Aggressively refocus back to Tilt tab after sharing starts
      // Chrome auto-switches to the shared tab — we need to pull user back
      window.focus();
      setTimeout(() => window.focus(), 300);
      setTimeout(() => window.focus(), 800);

      // Listen for when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setScreenStream(null);
        setIsSharing(false);
        setIsTabAway(false);
      });
    } catch (err) {
      console.log('Screen share cancelled or denied:', err.message);
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    setScreenStream(null);
    setIsSharing(false);
    setIsTabAway(false);
  }, [screenStream]);

  // Detect when user navigates away from Tilt tab
  useEffect(() => {
    if (!isSharing) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setIsTabAway(true);
      } else {
        setIsTabAway(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isSharing]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isSharing) {
          setPaletteOpen((prev) => !prev);
        }
      }
      if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSharing, paletteOpen]);

  return (
    <div className="w-full h-screen bg-[#050505] overflow-hidden" data-testid="app-root">
      {!isSharing ? (
        <LandingPage onStartScreenShare={startScreenShare} />
      ) : (
        <ScreenShareView
          stream={screenStream}
          onStop={stopScreenShare}
          onOpenPalette={() => setPaletteOpen(true)}
          captureContextRef={captureContextRef}
          isTabAway={isTabAway}
        />
      )}

      {/* Return-to-Tilt banner shown when sharing but user is on another tab */}
      <ReturnBanner visible={isSharing && isTabAway} />

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        screenContext={captureContextRef.current}
      />
    </div>
  );
}
