import React, { useState, useEffect, useRef, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import ScreenShareView from './components/ScreenShareView';
import CommandPalette from './components/CommandPalette';
import { openFloatingPalette, closeFloatingPalette, isPipOpen, renderPalette } from './hooks/pipHelper';

export default function App() {
  const [screenStream, setScreenStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const captureContextRef = useRef('Working');

  useEffect(() => {
    setPipSupported('documentPictureInPicture' in window);
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        },
        audio: false,
        surfaceSwitching: 'exclude',
        selfBrowserSurface: 'exclude',
      });

      setScreenStream(stream);
      setIsSharing(true);

      // Open the floating PiP palette automatically
      // Small delay to let the screen share settle
      setTimeout(async () => {
        const pip = await openFloatingPalette(captureContextRef.current);
        if (!pip) {
          // Fallback: refocus Tilt tab and use in-tab palette
          window.focus();
        }
      }, 500);

      // Listen for when user stops sharing via browser UI
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
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    setScreenStream(null);
    setIsSharing(false);
    closeFloatingPalette();
  }, [screenStream]);

  // Update PiP palette context — only on meaningful changes, not too frequently
  const lastContextRef = useRef('');
  useEffect(() => {
    if (!isSharing) return;
    const interval = setInterval(() => {
      if (isPipOpen()) {
        const newCtx = captureContextRef.current;
        // Only re-render if context changed significantly
        if (newCtx !== lastContextRef.current) {
          lastContextRef.current = newCtx;
          renderPalette(newCtx);
        }
      }
    }, 12000); // Less frequent to avoid disruption
    return () => clearInterval(interval);
  }, [isSharing]);

  // Cmd+K: open floating palette if PiP supported, else open in-tab palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isSharing) {
          if (pipSupported) {
            // Try to open or focus the floating palette
            if (!isPipOpen()) {
              openFloatingPalette(captureContextRef.current);
            }
          } else {
            // Fallback: in-tab palette
            setPaletteOpen((prev) => !prev);
          }
        }
      }
      if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSharing, paletteOpen, pipSupported]);

  const handleOpenPalette = useCallback(async () => {
    if (pipSupported) {
      if (!isPipOpen()) {
        await openFloatingPalette(captureContextRef.current);
      }
    } else {
      setPaletteOpen(true);
    }
  }, [pipSupported]);

  return (
    <div className="w-full h-screen bg-[#050505] overflow-hidden" data-testid="app-root">
      {!isSharing ? (
        <LandingPage onStartScreenShare={startScreenShare} />
      ) : (
        <ScreenShareView
          stream={screenStream}
          onStop={stopScreenShare}
          onOpenPalette={handleOpenPalette}
          captureContextRef={captureContextRef}
        />
      )}

      {/* Fallback in-tab palette for browsers without Document PiP */}
      <CommandPalette
        isOpen={paletteOpen && !pipSupported}
        onClose={() => setPaletteOpen(false)}
        screenContext={captureContextRef.current}
      />
    </div>
  );
}
