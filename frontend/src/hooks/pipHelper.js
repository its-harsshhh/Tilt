import React from 'react';
import ReactDOM from 'react-dom/client';
import FloatingPalette from '../components/FloatingPalette';

const PIP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #020617; color: #fff; font-family: 'Inter', -apple-system, sans-serif; overflow-x: hidden; }
  ::selection { background: rgba(129,140,248,0.3); color: white; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  button:hover { opacity: 0.9; }
  input::placeholder { color: rgba(148,163,184,0.4); }
  input:focus { outline: none; }
`;

let pipWindowRef = null;
let pipReactRoot = null;
let videoElementRef = null;

// Store reference to the screen share video element
export function setVideoElement(videoEl) {
  videoElementRef = videoEl;
}

// Capture frame from the video element (called by Guide mode in PiP)
function captureFrame() {
  if (!videoElementRef) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElementRef, 0, 0, 1024, 576);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (e) {
    console.error('Frame capture failed:', e);
    return null;
  }
}

export async function openFloatingPalette(screenContext) {
  if (pipWindowRef && !pipWindowRef.closed) {
    pipWindowRef.focus();
    return pipWindowRef;
  }

  if (!('documentPictureInPicture' in window)) {
    alert('Your browser does not support the floating palette. Please use Chrome 116+ for this feature.');
    return null;
  }

  try {
    const pip = await window.documentPictureInPicture.requestWindow({
      width: 440,
      height: 620,
    });

    pipWindowRef = pip;

    const style = pip.document.createElement('style');
    style.textContent = PIP_STYLES;
    pip.document.head.appendChild(style);

    pip.document.title = 'Tilt — AI Assistant';

    const container = pip.document.createElement('div');
    container.id = 'tilt-floating-root';
    pip.document.body.appendChild(container);

    pipReactRoot = ReactDOM.createRoot(container);

    renderPalette(screenContext);

    pip.document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = pip.document.querySelector('[data-testid="pip-decision-input"]');
        if (input) input.focus();
      }
    });

    pip.addEventListener('pagehide', () => {
      if (pipReactRoot) {
        pipReactRoot.unmount();
        pipReactRoot = null;
      }
      pipWindowRef = null;
    });

    return pip;
  } catch (err) {
    console.error('Failed to open floating palette:', err);
    return null;
  }
}

export function renderPalette(screenContext) {
  if (pipReactRoot) {
    pipReactRoot.render(
      <FloatingPalette
        screenContext={screenContext}
        onRequestClose={closeFloatingPalette}
        captureFrameFn={captureFrame}
      />
    );
  }
}

export function closeFloatingPalette() {
  if (pipWindowRef && !pipWindowRef.closed) {
    pipWindowRef.close();
  }
  pipWindowRef = null;
  pipReactRoot = null;
}

export function isPipOpen() {
  return pipWindowRef && !pipWindowRef.closed;
}
