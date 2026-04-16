import React from 'react';
import ReactDOM from 'react-dom/client';
import FloatingPalette from '../components/FloatingPalette';

// Inject custom styles for the PiP window (spin animation, scrollbar, fonts)
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
