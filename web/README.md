# 💻 PsyPyrus Web Client — Developer Guide

This directory contains the React Web companion application for the **PsyPyrus Suite**, built using **Vite**, **React 18**, and custom **Vanilla CSS** styles. It serves as the primary browser portal for clinicians (practice management EHR, genogram canvas, AI notes compiling) and patients (wellness lounge, daily quests, MindShop rewards).

---

## 🏛️ Architecture & Project Structure

The React source code is modularly structured:

```
web/
├── index.html         # HTML entry point (contains scanline filters for CRT skin)
├── package.json       # Node dependency and script manager
├── vite.config.js     # Vite configuration
│
└── src/
    ├── main.jsx       # Mounts App component to HTML root DOM
    ├── App.jsx        # Root Layout Router (manages biometric authentication state)
    ├── style.css      # Core Design System (CSS custom properties, themes, layouts)
    │
    ├── components/    # Reusable layout and modal components
    │   ├── Header.jsx           # Global status bar (switches persona modes, displays XP/coins)
    │   ├── Sidebar.jsx          # Left-hand navigation panel
    │   ├── BiometricLock.jsx    # Mock fingerprint security gate with PIN validator
    │   ├── CommandPalette.jsx   # Quick-action shortcut launcher dialog
    │   └── screens/             # Active workspace page views
    │       ├── ClinicianDashboard.jsx  # Patient directories and metrics
    │       ├── CaseHistoryMSE.jsx      # Digitized intake fields and Genogram Canvas
    │       ├── DiagnosticsSuite.jsx    # Candidate checks and comorbidity ontology graph
    │       ├── HitopMatrixExplorer.jsx # Hierarchical Taxonomy explore panel
    │       ├── RdocMatrixExplorer.jsx  # Research Domain Criteria explore panel
    │       ├── SOAPNotesCopilot.jsx    # SOAP synthesis using Gemini 3.5
    │       ├── WellnessLounge.jsx      # Patient relaxation breathing player & mood chart
    │       └── Marketplace.jsx         # Shop to unlock CRT themes, custom companions
    │
    └── services/      # Service integration modules
        ├── db.js                # IndexedDB database wrapper and HIPAA logger
        ├── dsmDatabase.js       # Structured data arrays for 13 disorders
        ├── diagnostics.js       # Rule-based diagnostic calculation engine
        ├── icdService.js        # WHO ICD-11 search registry API connector
        └── gamification.js      # XP progression calculations and quest trackers
```

---

## 🛠️ Setup & Development

### 1. Install Dependencies
Run npm install in `/web`:
```bash
npm install
```

### 2. Launch Local Development Server
Start the Vite server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🎨 Theme Customization
*   Global themes are dynamically toggled by applying CSS classes to the document body (e.g. `.light-theme`, `.crt-theme`, `.glassmorphic-theme`).
*   All styles inherit custom properties defined in `src/style.css` (e.g. `--primary`, `--bg-main`).
