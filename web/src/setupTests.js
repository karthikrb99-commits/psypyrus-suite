import '@testing-library/jest-dom';

// 1. Mock HTML Canvas 2D context to support signature/drawing components
HTMLCanvasElement.prototype.getContext = () => {
  return {
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    clearRect: () => {},
    fillRect: () => {},
    drawImage: () => {},
    putImageData: () => {},
    createImageData: () => {},
    setTransform: () => {},
    save: () => {},
    restore: () => {},
    arc: () => {},
    fill: () => {},
    scale: () => {},
    rotate: () => {},
    translate: () => {},
  };
};

// 2. Mock IndexedDB (Global polyfill)
if (!globalThis.indexedDB) {
  globalThis.indexedDB = {
    open: () => ({
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
    }),
  };
}

// 3. Ensure localStorage / sessionStorage are defined (JSDOM handles this but we enforce a fallback)
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = {};
  window.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); },
    length: 0,
    key: (index) => Object.keys(store)[index] || null
  };
}

// 4. Mock Electron window.electronAPI injected context to prevent EHR/session crashes
globalThis.electronAPI = {
  onLockSession: () => {
    // Return unsubscribe function
    return () => {};
  },
  writeAuditLog: () => Promise.resolve(),
  sendNotification: () => {},
};

// Also set on window explicitly
if (typeof window !== 'undefined') {
  window.electronAPI = globalThis.electronAPI;
}
