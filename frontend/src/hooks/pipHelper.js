import React from 'react';
import ReactDOM from 'react-dom/client';
import FloatingPalette from '../components/FloatingPalette';

const PIP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: transparent; color: #fff; font-family: 'Inter', -apple-system, sans-serif; overflow: hidden; }
  ::selection { background: rgba(129,140,248,0.3); color: white; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  button:hover { opacity: 0.9; }
  input::placeholder { color: rgba(148,163,184,0.4); }
  input:focus { outline: none; }
`;

let pipWindowRef = null;
let pipReactRoot = null;
let videoElementRef = null;
let isCollapsed = false;

export function setVideoElement(videoEl) {
  videoElementRef = videoEl;
}

function captureFrame() {
  if (!videoElementRef) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 576;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElementRef, 0, 0, 1024, 576);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (e) { return null; }
}

function collapsePip() {
  if (!pipWindowRef || pipWindowRef.closed) return;
  isCollapsed = true;
  try { pipWindowRef.resizeTo(64, 64); } catch (e) { /* may not work */ }
  renderPaletteInternal();
}

function expandPip() {
  if (!pipWindowRef || pipWindowRef.closed) return;
  isCollapsed = false;
  try { pipWindowRef.resizeTo(440, 620); } catch (e) { /* may not work */ }
  renderPaletteInternal();
  setTimeout(() => {
    const input = pipWindowRef?.document?.querySelector('[data-testid="pip-decision-input"]');
    if (input) input.focus();
  }, 200);
}

function togglePip() {
  if (isCollapsed) expandPip();
  else collapsePip();
}

let currentScreenContext = '';

function renderPaletteInternal() {
  if (!pipReactRoot) return;
  pipReactRoot.render(
    <FloatingPalette
      screenContext={currentScreenContext}
      onRequestClose={closeFloatingPalette}
      captureFrameFn={captureFrame}
      collapsed={isCollapsed}
      onCollapse={collapsePip}
      onExpand={expandPip}
    />
  );
}

export async function openFloatingPalette(screenContext) {
  currentScreenContext = screenContext;

  if (pipWindowRef && !pipWindowRef.closed) {
    if (isCollapsed) expandPip();
    else pipWindowRef.focus();
    return pipWindowRef;
  }

  if (!('documentPictureInPicture' in window)) {
    alert('Your browser does not support the floating palette. Please use Chrome 116+ for this feature.');
    return null;
  }

  try {
    isCollapsed = false;
    const pip = await window.documentPictureInPicture.requestWindow({
      width: 440,
      height: 620,
    });

    pipWindowRef = pip;

    const style = pip.document.createElement('style');
    style.textContent = PIP_STYLES;
    pip.document.head.appendChild(style);

    pip.document.title = 'Tilt';

    const container = pip.document.createElement('div');
    container.id = 'tilt-floating-root';
    container.style.height = '100vh';
    container.style.width = '100vw';
    pip.document.body.appendChild(container);

    pipReactRoot = ReactDOM.createRoot(container);
    renderPaletteInternal();

    // Cmd+K toggles expand/collapse
    pip.document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isCollapsed) {
          expandPip();
        } else {
          const input = pip.document.querySelector('[data-testid="pip-decision-input"]');
          if (input) input.focus();
        }
      }
    });

    pip.addEventListener('pagehide', () => {
      if (pipReactRoot) { pipReactRoot.unmount(); pipReactRoot = null; }
      pipWindowRef = null; isCollapsed = false;
    });

    return pip;
  } catch (err) {
    console.error('Failed to open floating palette:', err);
    return null;
  }
}

export function renderPalette(screenContext) {
  currentScreenContext = screenContext;
  if (!isCollapsed) renderPaletteInternal();
}

export function closeFloatingPalette() {
  if (pipWindowRef && !pipWindowRef.closed) pipWindowRef.close();
  pipWindowRef = null; pipReactRoot = null; isCollapsed = false;
}

export function isPipOpen() {
  return pipWindowRef && !pipWindowRef.closed;
}
