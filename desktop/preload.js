const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the window object in the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Invoke methods (returns Promise)
    sendNotification: (title, body) => ipcRenderer.invoke('send-native-notification', { title, body }),
    writeAuditLog: (logEntry) => ipcRenderer.invoke('write-audit-log', logEntry),
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    
    // Subscriptions (receives events from Main)
    onLockSession: (callback) => {
        const subscription = (event) => callback();
        ipcRenderer.on('lock-session', subscription);
        // Return unsubscribe function
        return () => {
            ipcRenderer.removeListener('lock-session', subscription);
        };
    }
});
