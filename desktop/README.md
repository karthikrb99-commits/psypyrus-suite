# 💻 PsyPyrus Desktop Wrapper — Electron Web App Wrapper

This directory contains the **Electron Desktop Wrapper** for the **PsyPyrus Suite**. This is a thin **system tray + native OS wrapper** around the Web React client — it does **not** contain independent clinical logic. All clinical features, diagnostics, and AI integrations are implemented in the [`/web`](../web/README.md) React application.

The wrapper packages the compiled static production build of the Web client into a standalone desktop application, providing native OS integration (system tray, file logging, toast notifications, and secure biometrics simulation).

---

## 🏛️ Project Structure

```
desktop/
├── main.js        # Main process managing app lifecycle, system tray, & logging
├── preload.js     # Secure contextBridge IPC preload script
├── package.json   # NPM scripts and dependencies (Electron, electron-builder)
└── README.md      # Setup and packaging guide (This file)
```

## 🔌 Connection Details & Environment Setup

The desktop application wraps the compiled Web client. It connects to the central **Papyrus Sync Service** for data synchronization. You can configure this connection by specifying environment variables (in a local `.env` file under the `/web` directory before compiling, or at runtime):

*   `VITE_SYNC_API_URL`: The URL of the sync gateway (default local test endpoint: `http://localhost:3001`).
*   `VITE_GEMINI_API_KEY`: Google Gemini API Key for SOAP notes and MSE compilations.

For comprehensive instructions on configuring keys and hosting/deploying this application, refer to the [Web Companion Deployment Guide](../DEPLOYMENT.md).

---

## 🛠️ Setup & Development

### 1. Compile the Web Client
Before running or packaging the desktop application, compile the React Web client:
```bash
cd web
npm install
npm run build
```
This generates the static distribution folder inside `web/dist/`.

### 2. Launch Electron in Dev Mode
Navigate to `/desktop`, install dependencies, and start the development server:
```bash
cd desktop
npm install
npm run dev
```

---

## 📦 Packaging Standalone Installers

We use `electron-builder` to package the compiled code into standalone desktop installers.

### Package for Windows (`.exe` Installer)
To compile a single-file Windows installer:
```bash
npm run package
```
The resulting executable is generated in `desktop/dist/`.

### Package for macOS (`.dmg` / `.app` Bundle)
To compile a macOS installer (requires execution on a macOS system):
```bash
npm run package:mac
```
The resulting files are saved in `desktop/dist/mac/`.

---

## 🚦 Development Status & Milestones

> [!IMPORTANT]
> This Electron wrapper simply loads the compiled Web React application. It does **not** implement any clinical logic independently. Update and test features in the `/web` directory first.

### 1. What is Working:
- System tray integration (minimize to tray, restore window).
- Native application menu (File, View, Help) with platform shortcuts.
- About dialog with version information.
- Logging to local OS filesystem via `app.getPath('logs')`.

### 2. What is Mocked / Simulated:
- Biometric security lock: displays a CSS animation simulation (not integrated with Windows Hello or Touch ID on macOS).

### 3. Compliance Note:
> Calling this desktop application "HIPAA-compliant" requires the full stack (backend hosting, auth system, encryption at rest, audit trail) to be independently assessed. The Electron wrapper itself implements **HIPAA-aware principles** (session logging, local file encryption context) but does not constitute certification.

### 4. Next Milestones:
- Integrate Windows Hello / macOS Touch ID via the `keytar` package.
- Auto-update mechanism using `electron-updater`.
