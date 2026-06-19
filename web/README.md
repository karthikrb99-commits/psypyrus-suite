# 💻 PsyPyrus Web Client — Primary Reference Implementation

This directory contains the React Web application for the **PsyPyrus Suite**, which serves as the **primary reference implementation** of the **Papyrus Open Mental Health Intelligence Ecosystem**. 

Built using **Vite**, **React 19**, and **Tailwind CSS**, it contains the most mature, feature-complete implementation of the clinician workspace (demographics intake, digital MSE, case history, genogram vector canvas, rule-based diagnostics engine, and AI SOAP notes compiler) and the patient-facing wellness portal. All other platform clients are designed around the UX and logic established here.

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
    ├── index.css      # Core Design System (Tailwind definitions, variables, and layouts)
    │
    ├── components/    # Reusable layout and modal components
    ├── Header.jsx           # Global status bar (switches persona modes, displays XP/coins)
    ├── Sidebar.jsx          # Left-hand navigation panel
    ├── BiometricLock.jsx    # Mock fingerprint security gate with PIN validator
    ├── CommandPalette.jsx   # Quick-action shortcut launcher dialog
    └── screens/             # Active workspace page views
        ├── ClinicianDashboard.jsx  # Patient directories and metrics
        ├── CaseHistoryMSE.jsx      # Digitized intake fields and Genogram Canvas
        ├── DiagnosticsSuite.jsx    # Candidate checks and comorbidity ontology graph
        ├── HitopMatrixExplorer.jsx # Hierarchical Taxonomy explore panel
        ├── RdocMatrixExplorer.jsx  # Research Domain Criteria explore panel
        ├── SOAPNotesCopilot.jsx    # SOAP synthesis using Gemini 2.5 Flash
        ├── WellnessLounge.jsx      # Patient relaxation breathing player & mood chart
        └── Marketplace.jsx         # Shop to unlock CRT themes, custom companions
    │
    └── services/      # Service integration modules
        ├── db.js                # IndexedDB database wrapper and HIPAA/DISHA logger
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

## 🔌 Connection Details & Environment Setup

The Web client connects to the central **Papyrus Sync Service** for data synchronization. You can configure this connection using environment variables in a local `.env` file at the root of the `/web` directory:

*   `VITE_SYNC_API_URL`: The URL of the sync gateway (default local test endpoint: `http://localhost:3001`).
*   `VITE_GEMINI_API_KEY`: Google Gemini API Key for SOAP notes and MSE compilations (can also be configured at runtime in the app settings drawer).

For comprehensive instructions on configuring keys and hosting/deploying this application, refer to the [Web Companion Deployment Guide](../DEPLOYMENT.md).

---

## 🎨 Theme Customization
*   Global themes are dynamically toggled by applying CSS classes to the document body (e.g. `.light-theme`, `.crt-theme`, `.glassmorphic-theme`).
*   All styles inherit custom properties defined in `src/index.css` (e.g. `--primary`, `--bg-main`).

---

## 🚦 Development Status, Mocks, & Milestones

The Web client is the most mature component of the PsyPyrus codebase, but it still utilizes simulated stubs for infrastructure and integrations that require live cloud hosting or official credentialing:

### 1. What is Fully Implemented & Working:
- **Local Diagnostic Engine**: Validates inputs against 13 psychiatric conditions locally based on DSM-5-TR duration, exclusion, and symptom count criteria.
- **HiTOP & RDoC Explorers**: Fully interactive hierarchical taxonomy navigation panels.
- **Genogram Canvas**: Interactive HTML5 drawing board for family mappings (saves sketch as local Base64 string).
- **Command Palette**: Fully functional `Ctrl+K` global launcher search panel.
- **Gamification Progression**: mind-coins, XP rewards, and live visual theme toggling (CRT terminal skin / Glassmorphic layout).
- **IndexedDB Storage**: Fully functional local database wrapper mapping 9 core schemas.

### 2. What is Mocked / Simulated:
- **Telehealth Video Streams**: Integrates Jitsi Meet within an iframe; in offline dev configurations, it falls back to a high-fidelity video loop/animation.
- **Biometric authentication**: Emulates biometric lock scanner using CSS fingerprint assets and local PIN entry validation.
- **WHO ICDAPI Connection**: Offline fallback search with 23 primary clinical classes is active by default. Live token requests require configuring custom WHO developer credentials in the client settings drawer.
- **ABDM Sandbox**: Simulated Aadhaar ABHA health card creation and consent manager responses to show how national workflows operate without requiring live government API gateway tokens.

### 3. Next Milestones:
- Establish real-time sync with database events without relying on developer bypass rules.
- Integrate production-ready OAuth2 authorization flows with Keycloak.
