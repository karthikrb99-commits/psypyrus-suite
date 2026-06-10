# 💻 PsyPyrus Desktop Client (Windows)

This folder contains the native Windows desktop client for the **PsyPyrus Suite**, built using **Electron**. It wraps the Vite + React web companion app inside a native Windows frame, enabling deep OS-level integrations.

---

## 🏛️ Desktop Architecture

```
psypyrus/desktop/
├── package.json         # Scripts, metadata, and dependencies
├── main.js              # Electron main process (lifecycle & native APIs)
├── preload.js           # Secure context-bridge IPC channel definitions
├── README.md            # This documentation
├── assets/
│   └── icon.png         # Premium 256x256 application icon
└── dist/                # [AUTOMATICALLY GENERATED] Compiled web assets
```

---

## 🌟 Desktop Integrations

1. **Window State Persistence**: Automaticaly records window size and layout positions. The client launches exactly where you left it on screen.
2. **Native Windows Notifications**: Displays rich Windows toast notifications for administrative transactions (e.g. creating patients, scheduling appointments, toggling clinician modes, or biometric locks).
3. **Local Cryptographic Audit Logging**: In addition to HIPAA-compliant localStorage databases, all operations write a secure, plaintext append-only audit trail directly to the local Windows user profile at `AppData\Roaming\PsyPyrus\desktop_audit_trail.log`.
4. **System Diagnostics Interface**: Exposes CPU, Memory, and Platform parameters directly into the **API Configurations** panel.
5. **System Tray Integration**: An active system tray icon allows minimizing to tray, quick-locking sessions, and workspace restoration on double-click.

---

## 🛠️ Development & Bootstrapping

Ensure you have installed the root level and web packages.

### 1. Install Dependencies
Run from the `desktop/` directory:
```bash
npm install
```

### 2. Launch Dev Client
Run the Vite development server in the `/web` folder, then boot the Electron container pointing to it:
```bash
# Terminal 1 (In psypyrus/web)
npm run dev

# Terminal 2 (In psypyrus/desktop)
npm run dev
```

---

## 📦 Packaging & Distribution

To compile the application into a standalone, portable Windows executable (`.exe`) or macOS packages (`.dmg` & `.zip`):

### Build for Windows:
Run from the `desktop/` folder:
```bash
npm run package
```
This packages the app into a portable Windows executable located in `desktop/out/PsyPyrus.exe`.

### Build for macOS:
Run from the `desktop/` folder:
```bash
npm run package:mac
```
This packages the app into a `.dmg` installer and a `.zip` archive containing the native application bundle in `desktop/out/`.

### How it Works:
These packaging scripts will:
1. Re-build the React production package in `../web/dist` with relative paths (`base: './'`).
2. Copy the distribution assets into the `desktop/dist` folder using a cross-platform Node.js utility.
3. Package the application assets and Electron wrapper into native executables.
