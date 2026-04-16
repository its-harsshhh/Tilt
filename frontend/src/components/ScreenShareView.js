import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Circle, MonitorOff, Command, ExternalLink, Eye } from 'lucide-react';
import { setVideoElement } from '../hooks/pipHelper';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ScreenShareView({ stream, onStop, onOpenPalette, captureContextRef }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [contextLabel, setContextLabel] = useState('Observing...');
  const [activityType, setActivityType] = useState('Observing');
  const [analysisCount, setAnalysisCount] = useState(0);
  const intervalRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Register video element so PiP Guide mode can capture frames
      setVideoElement(videoRef.current);
    }
    return () => setVideoElement(null);
  }, [stream]);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 1024;
    canvas.height = 576;
    ctx.drawImage(video, 0, 0, 1024, 576);

    const base64 = canvas.toDataURL('image/jpeg', 0.7);

    setIsCapturing(true);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_URL}/api/analyze-screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64 }),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        const ctx_text = data.context || 'Observing...';
        const activity = data.activity || 'Observing';

        setContextLabel(ctx_text);
        setActivityType(activity);
        setAnalysisCount(prev => prev + 1);

        if (captureContextRef) {
          captureContextRef.current = ctx_text;
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Screen analysis failed:', err);
      }
    } finally {
      setIsCapturing(false);
    }
  }, [captureContextRef]);

  useEffect(() => {
    const initial = setTimeout(captureAndAnalyze, 2500);
    intervalRef.current = setInterval(captureAndAnalyze, 10000);
    return () => {
      clearTimeout(initial);
      clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [captureAndAnalyze]);

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
              {isCapturing ? 'Analyzing' : 'Active'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Vision context indicator */}
          <div className="glass-surface rounded-full px-3.5 py-2 max-w-[300px]" data-testid="context-label">
            <div className="flex items-center gap-2">
              <Eye size={11} className="text-indigo-400/60 flex-shrink-0" />
              <span className="font-mono text-[10px] tracking-wide text-white/40 truncate">
                <span className="text-indigo-400/70 uppercase">{activityType}</span>
                {analysisCount > 0 && (
                  <span className="text-white/20 ml-1.5">
                    {contextLabel.length > 50 ? contextLabel.slice(0, 50) + '...' : contextLabel}
                  </span>
                )}
              </span>
            </div>
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

      {/* Info banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="glass-surface rounded-full px-4 py-2 flex items-center gap-2">
          <Eye size={11} className="text-indigo-400/60" />
          <span className="font-mono text-[9px] tracking-widest uppercase text-white/30">
            AI vision analyzing your screen every 10s
          </span>
        </div>
      </div>
    </div>
  );
}
