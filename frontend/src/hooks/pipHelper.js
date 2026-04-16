import React from 'react';
import ReactDOM from 'react-dom/client';
import FloatingPalette from '../components/FloatingPalette';

// Inject custom styles for the PiP window (spin animation, scrollbar, fonts)
const PIP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #0a0a0a; color: #fff; font-family: 'Satoshi', sans-serif; overflow-x: hidden; }
  ::selection { background: rgba(250, 204, 21, 0.3); color: white; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  button:hover { opacity: 0.85; }
  textarea::placeholder { color: rgba(255,255,255,0.2); }
  textarea:focus { border-color: rgba(255,255,255,0.15) !important; }
`;

let pipWindowRef = null;
let pipReactRoot = null;

export async function openFloatingPalette(screenContext) {
  // If PiP already open, focus it
  if (pipWindowRef && !pipWindowRef.closed) {
    pipWindowRef.focus();
    return pipWindowRef;
  }

  // Check for Document PiP support
  if (!('documentPictureInPicture' in window)) {
    alert('Your browser does not support the floating palette. Please use Chrome 116+ for this feature.');
    return null;
  }

  try {
    const pip = await window.documentPictureInPicture.requestWindow({
      width: 420,
      height: 560,
    });

    pipWindowRef = pip;

    // Inject styles
    const style = pip.document.createElement('style');
    style.textContent = PIP_STYLES;
    pip.document.head.appendChild(style);

    // Set title
    pip.document.title = 'Tilt — Decision Palette';

    // Create React mount point
    const container = pip.document.createElement('div');
    container.id = 'tilt-floating-root';
    pip.document.body.appendChild(container);

    // Create a new React root in the PiP window
    pipReactRoot = ReactDOM.createRoot(container);

    // Render the floating palette
    renderPalette(screenContext);

    // Add Cmd+K listener to the PiP window too (toggles focus to input)
    pip.document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = pip.document.querySelector('[data-testid="pip-decision-input"]');
        if (input) input.focus();
      }
    });

    // Cleanup when PiP closes
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
