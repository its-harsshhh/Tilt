import React, { useState, useEffect, useRef, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import ScreenShareView from './components/ScreenShareView';
import CommandPalette from './components/CommandPalette';
import { openFloatingPalette, closeFloatingPalette, isPipOpen, renderPalette } from './hooks/pipHelper';
import { logSessionOpen } from './hooks/useMemory';

export default function App() {
  const [screenStream, setScreenStream] = useState(null);

  // Log session open once
  useEffect(() => { logSessionOpen(); }, []);
  const [isSharing, setIsSharing] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const captureContextRef = useRef('Working');
  const captureActivityRef = useRef('Browse');

  useEffect(() => {
    setPipSupported('documentPictureInPicture' in window);
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', displaySurface: 'monitor' },
        audio: false,
        surfaceSwitching: 'exclude',
        selfBrowserSurface: 'exclude',
      });

      setScreenStream(stream);
      setIsSharing(true);

      setTimeout(async () => {
        const pip = await openFloatingPalette(captureContextRef.current, captureActivityRef.current);
        if (!pip) window.focus();
      }, 500);

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setScreenStream(null);
        setIsSharing(false);
        closeFloatingPalette();
      });
    } catch (err) {
      console.log('Screen share cancelled or denied:', err.message);
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStream) screenStream.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    setIsSharing(false);
    closeFloatingPalette();
  }, [screenStream]);

  const lastContextRef = useRef('');
  useEffect(() => {
    if (!isSharing) return;
    const interval = setInterval(() => {
      if (isPipOpen()) {
        const newCtx = captureContextRef.current;
        if (newCtx !== lastContextRef.current) {
          lastContextRef.current = newCtx;
          renderPalette(newCtx, captureActivityRef.current);
        }
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [isSharing]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isSharing) {
          if (pipSupported) openFloatingPalette(captureContextRef.current, captureActivityRef.current);
          else setPaletteOpen((prev) => !prev);
        } else {
          startScreenShare();
        }
      }
      if (e.key === 'Escape' && paletteOpen) setPaletteOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSharing, paletteOpen, pipSupported, startScreenShare]);

  const handleOpenPalette = useCallback(async () => {
    if (pipSupported) {
      if (!isPipOpen()) await openFloatingPalette(captureContextRef.current);
    } else {
      setPaletteOpen(true);
    }
  }, [pipSupported]);

  return (
    <div className="w-full h-screen bg-white overflow-hidden" data-testid="app-root">
      {/* Landing page always visible */}
      <LandingPage
        onStartScreenShare={startScreenShare}
        isSharing={isSharing}
        onStop={stopScreenShare}
        onOpenPalette={handleOpenPalette}
      />

      {/* Hidden screen capture — runs in background */}
      {isSharing && screenStream && (
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <ScreenShareView
            stream={screenStream}
            onStop={stopScreenShare}
            onOpenPalette={handleOpenPalette}
            captureContextRef={captureContextRef}
            captureActivityRef={captureActivityRef}
          />
        </div>
      )}

      <CommandPalette
        isOpen={paletteOpen && !pipSupported}
        onClose={() => setPaletteOpen(false)}
        screenContext={captureContextRef.current}
      />
    </div>
  );
}
