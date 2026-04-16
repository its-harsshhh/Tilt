import React, { useState, useEffect, useRef, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import ScreenShareView from './components/ScreenShareView';
import CommandPalette from './components/CommandPalette';

export default function App() {
  const [screenStream, setScreenStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const captureContextRef = useRef('Working');

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        },
        audio: false,
      });

      setScreenStream(stream);
      setIsSharing(true);

      // Listen for when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setScreenStream(null);
        setIsSharing(false);
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
  }, [screenStream]);

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
        />
      )}

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        screenContext={captureContextRef.current}
      />
    </div>
  );
}
