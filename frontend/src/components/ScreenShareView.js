import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Circle, MonitorOff, Command, ExternalLink } from 'lucide-react';

export default function ScreenShareView({ stream, onStop, onOpenPalette, captureContextRef }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [contextLabel, setContextLabel] = useState('Observing');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 640;
    canvas.height = 360;
    ctx.drawImage(video, 0, 0, 640, 360);

    const labels = ['Writing', 'Browsing', 'Reading', 'Working', 'Composing'];
    const randomLabel = labels[Math.floor(Math.random() * labels.length)];
    setContextLabel(randomLabel);

    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 800);

    if (captureContextRef) {
      captureContextRef.current = randomLabel;
    }
  }, [captureContextRef]);

  useEffect(() => {
    intervalRef.current = setInterval(captureFrame, 7000);
    const initial = setTimeout(captureFrame, 2000);
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(initial);
    };
  }, [captureFrame]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" data-testid="screen-share-view">
      {/* Animated border */}
      <div className="animated-border" />

      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-contain bg-black"
        data-testid="screen-share-video"
      />

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="glass-surface rounded-full px-4 py-2" data-testid="tilt-logo">
            <img src="/tilt-logo.svg" alt="Tilt" className="h-5" />
          </div>

          <div className="flex items-center gap-2 glass-surface rounded-full px-3.5 py-2" data-testid="screen-active-indicator">
            <Circle
              size={8}
              fill={isCapturing ? '#ef4444' : '#22c55e'}
              className={`${isCapturing ? 'text-red-500 animate-pulse' : 'text-green-500'} transition-colors`}
            />
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/60">
              {isCapturing ? 'Capturing' : 'Active'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-surface rounded-full px-3.5 py-2" data-testid="context-label">
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/40">
              Context: <span className="text-white/70">{contextLabel}</span>
            </span>
          </div>

          <button
            onClick={onOpenPalette}
            data-testid="open-palette-btn"
            className="glass-surface rounded-full px-3.5 py-2 hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-2"
          >
            <ExternalLink size={11} className="text-white/40" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/40">Palette</span>
          </button>

          <button
            onClick={onStop}
            data-testid="stop-screen-share-btn"
            className="glass-surface rounded-full px-3.5 py-2 hover:bg-red-500/20 hover:border-red-500/30 transition-all cursor-pointer flex items-center gap-2"
          >
            <MonitorOff size={13} className="text-white/50" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-white/50">Stop</span>
          </button>
        </div>
      </div>

      {/* Bottom center hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={onOpenPalette}
          data-testid="bottom-palette-trigger"
          className="glass-surface rounded-2xl px-6 py-3 hover:bg-white/10 transition-all cursor-pointer flex items-center gap-3 group"
        >
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 border border-white/10">
            <Command size={12} className="text-white/50" />
            <span className="font-mono text-[11px] text-white/50">K</span>
          </div>
          <span className="font-body text-sm text-white/40 group-hover:text-white/60 transition-colors">
            Open floating decision palette
          </span>
        </button>
      </div>

      {/* Info banner: floating palette opens on top of other windows */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="glass-surface rounded-full px-4 py-2 flex items-center gap-2">
          <ExternalLink size={11} className="text-blue-400/60" />
          <span className="font-mono text-[9px] tracking-widest uppercase text-white/30">
            Floating palette opens on top of any window
          </span>
        </div>
      </div>
    </div>
  );
}
