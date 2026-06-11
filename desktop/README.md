# 💻 PsyPyrus Desktop Wrapper — Developer Guide

This directory contains the **Electron Desktop Wrapper** for the **PsyPyrus Suite**. It packages the compiled static production build of the **Web client** into a standalone desktop application, providing native operating system integration (system tray, file logging, toast notifications, and secure biometrics validation simulation).

---

## 🏛️ Project Structure

```
desktop/
├── main.js        # Main process managing app lifecycle, system tray, & logging
├── preload.js     # Secure contextBridge IPC preload script
├── package.json   # NPM scripts and dependencies (Electron, electron-builder)
└── README.md      # Setup and packaging guide (This file)
```

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
