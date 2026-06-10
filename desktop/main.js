const { app, BrowserWindow, ipcMain, Notification, Menu, Tray } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
let tray;
const isDev = process.argv.includes('--dev');

// Path to store window state
const stateFilePath = path.join(app.getPath('userData'), 'window-state.json');
// Path to store local audit logs (demonstrates desktop integration)
const auditLogsPath = path.join(app.getPath('userData'), 'desktop_audit_trail.log');

// Helper to load window state
function getSavedWindowState() {
    try {
        if (fs.existsSync(stateFilePath)) {
            return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
        }
    } catch (err) {
        console.error('Failed to load window state:', err);
    }
    return { width: 1280, height: 800 };
}

// Helper to save window state
function saveWindowState(state) {
    try {
        fs.writeFileSync(stateFilePath, JSON.stringify(state), 'utf8');
    } catch (err) {
        console.error('Failed to save window state:', err);
    }
}

function createWindow() {
    const savedState = getSavedWindowState();

    mainWindow = new BrowserWindow({
        x: savedState.x,
        y: savedState.y,
        width: savedState.width,
        height: savedState.height,
        minWidth: 1024,
        minHeight: 700,
        backgroundColor: '#12141c', // Premium dark theme background
        title: 'PsyPyrus AI - Mental Health OS',
        show: false, // Show once ready to avoid visual flashing
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    // Load URL or file
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    // Window events
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Trigger startup notification
        showNotification('PsyPyrus Suite Initialized', 'Secure clinical environment loaded successfully.');
    });

    // Save window state on move/resize
    const updateWindowState = () => {
        if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
            const bounds = mainWindow.getBounds();
            saveWindowState({
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height
            });
        }
    };

    mainWindow.on('resize', updateWindowState);
    mainWindow.on('move', updateWindowState);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Setup Custom Application Menu
    setupMenu();

    // Setup System Tray
    setupTray();
}

function setupMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Lock Session',
                    accelerator: 'CmdOrCtrl+L',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('lock-session');
                            showNotification('Session Locked', 'Your clinical session has been secured.');
                        }
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About PsyPyrus',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About PsyPyrus AI',
                            message: 'PsyPyrus Suite — Windows Client v1.0.0',
                            detail: 'A secure, HIPAA-compliant Mental Health Operating System & Wellness Hub.\n\nRunning on Electron ' + process.versions.electron,
                            buttons: ['OK']
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function setupTray() {
    // We will attempt to load the icon. If not found, use a fallback
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    if (fs.existsSync(iconPath)) {
        tray = new Tray(iconPath);
    } else {
        // Fallback for dev if icon doesn't exist yet
        try {
            tray = new Tray(path.join(__dirname, 'preload.js')); // dummy icon
        } catch (e) {
            console.log('Tray creation skipped or failed. No icon available.');
            return;
        }
    }

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Restore PsyPyrus',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }
        },
        {
            label: 'Lock Workspace',
            click: () => {
                if (mainWindow) {
                    mainWindow.webContents.send('lock-session');
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Exit',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setToolTip('PsyPyrus Mental Health OS');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

function showNotification(title, body) {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title,
            body,
            silent: false,
            icon: path.join(__dirname, 'assets', 'icon.png')
        });
        notification.show();
    }
}

// IPC Handlers
ipcMain.handle('send-native-notification', (event, { title, body }) => {
    showNotification(title, body);
    return true;
});

ipcMain.handle('write-audit-log', (event, logEntry) => {
    try {
        const timestamp = new Date().toISOString();
        const formattedLog = `[${timestamp}] [AUDIT] [${logEntry.actor || 'System'}] Action: ${logEntry.action} | Details: ${logEntry.details} | Encryption: ${logEntry.encryptionStandard || 'AES-GCM-256'}\n`;
        fs.appendFileSync(auditLogsPath, formattedLog, 'utf8');
        return { success: true, path: auditLogsPath };
    } catch (err) {
        console.error('Failed to write local audit log:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('get-system-info', () => {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    
    return {
        platform: os.platform(),
        arch: os.arch(),
        cpuModel: os.cpus()[0]?.model || 'Unknown CPU',
        totalMemoryGB: (totalMemBytes / (1024 * 1024 * 1024)).toFixed(2),
        usedMemoryGB: (usedMemBytes / (1024 * 1024 * 1024)).toFixed(2),
        appVersion: '1.0.0-desktop'
    };
});

// App Lifecycle
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
