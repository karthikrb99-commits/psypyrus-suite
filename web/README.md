# 💻 PsyPyrus Web companion App — Developer Guide

This folder contains the web companion application for the **PsyPyrus Suite**, built using **React (v19)**, **Vite**, and vanilla **CSS3** styling. The application is designed to mimic the native Android Jetpack Compose layout, utilizing modular ES6 Javascript modules for state management, local database persistence, and API calls.

---

## 🏛️ React Component & Service Hierarchy

The application source folder `/web/src` is structured as follows:

```
web/src/
├── main.jsx                 # Application entrypoint bootstrapping the React tree
├── App.jsx                  # Main router managing screen rendering, lock state, & active patient ID
├── style.css                # Premium Vanilla CSS3 stylesheet defining the dark/light design system
│
├── services/                # Local data models, rules engine, and API connections
│   ├── db.js                # HIPAA-compliant local storage database wrapper & initial seed data
│   ├── ai.js                # Client-side Google Gemini 3.5 Flash API connector
│   ├── diagnostics.js       # Local rules-based diagnostic checks for MDD and GAD
│   └── trials.js            # ClinicalTrials.gov API v2 study query module
│
└── components/              # Layout and Screen views
    ├── Header.jsx           # Top app bar containing active role switcher pill & configuration gear
    ├── Sidebar.jsx          # Left-hand navigation column (retractable on compact viewports)
    ├── BiometricLock.jsx    # Simulated face/passcode verification gateway screen
    ├── SettingsDrawer.jsx   # Configuration slideout drawer to manage API keys & themes
    ├── AddApptModal.jsx     # Clinical schedule editor dialog modal
    │
    └── screens/             # Panel views for professional and patient roles
        ├── ClinicianDashboard.jsx # Stats counters, appointment scheduler, risk flags, suggestions
        ├── PatientDashboard.jsx   # Teletherapy quick-join, active homework lists, assigned tasks
        ├── SOAPNotesCopilot.jsx   # Transcribes conversations into clinical SOAP files
        ├── MentalStatusExam.jsx   # Digital checklists compiling descriptive clinical summaries
        ├── DiagnosticsSuite.jsx   # Hybrid rules-based evaluation and LLM differentials
        ├── TelehealthSession.jsx  # P2P video teletherapy panel with mock stream feeds
        ├── CBTGoalPlanner.jsx     # SMART goal compiler & CBT intervention planner
        ├── InteractiveAssessments.jsx # Automated GAD-7 & PHQ-9 progress charts
        ├── WellnessLounge.jsx     # Mindfulness breathing pacer, mood logs, and gratitude notes
        ├── PerformanceAnalytics.jsx # Billing records and practice metric charts
        ├── HIPAASecurityShield.jsx# Read-only audit log viewer tracking transaction hashes
        └── Marketplace.jsx        # Premium PsyPyrus extension plugins browser
```

---

## 🗄️ LocalStorage Database persistence (`services/db.js`)

Since this app operates completely in the sandbox of the user's browser, data is managed via `localStorage`. The database wrapper implements:
*   Initial database seeding (seeding Patients, Appointments, Assessments, Mood Logs, and Security Logs) on first load.
*   Reactive events utilizing `window.dispatchEvent(new Event('psypyrus_db_change'))` to notify all UI subscribers of data updates.
*   **HIPAA Audit Logging:** Logs administrative activities (e.g. "Accessed EHR Record", "Generated SOAP Note via AI") directly to the local storage log table.

---

## 🧠 Diagnostic Rules & AI Copilot

*   **Offline Engine (`services/diagnostics.js`):** Duplicates the native Android logic, evaluating input checklists against DSM-5 criteria bounds (MDD and GAD) in raw Javascript.
*   **Gemini Client (`services/ai.js`):** Connects to `generativelanguage.googleapis.com/v1beta` to query Gemini 3.5 Flash. It includes a fallback mechanism; if no user key is configured in the settings gear drawer, it intercepts calls and serves detailed, clinically realistic pre-written responses.

---

## 🛠️ Local Bootstrapping & Server Tasks

### Prerequisites
*   [Node.js (v18 or newer)](https://nodejs.org)
*   npm (pre-packaged with Node)

### 1. Install Dependencies
Navigate to the `/web` directory and install packages:
```bash
npm install
```

### 2. Boot the Dev Server
Launch Vite's hot-reloading development server:
```bash
npm run dev
```
The application will boot at `http://localhost:5173`.

### 3. Build & Production Deployment
Compile and bundle static visual assets into optimized chunks in `/web/dist`:
```bash
npm run build
```

---

## 📦 Electron Integration Configuration
The [vite.config.js](file:///web/vite.config.js) uses a relative base path configuration (`base: './'`) when building the production bundle. This allows the Electron desktop container to load packaged web assets correctly using standard filesystem protocol loaders.
