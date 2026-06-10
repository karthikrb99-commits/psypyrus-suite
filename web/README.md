# 💻 PsyPyrus Web Companion App — Developer Guide

This directory contains the web companion application for the **PsyPyrus Suite**, built using **React (v19)**, **Vite**, and vanilla **CSS3** styling. The application is designed to mimic the native Android Jetpack Compose layout, utilizing modular ES6 Javascript modules for state management, local database persistence, and API calls.

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
│   ├── dsmDatabase.js       # Pre-packaged catalog of 13 primary psychiatric conditions
│   ├── diagnostics.js       # Local rules-based diagnostic checks with statistical criteria weighting
│   ├── icdService.js        # Official WHO ICD-11 Search API connector (OAuth2 credentials)
│   ├── gamification.js      # Tracks XP, Leveling, Badges, Quests, and MindShop purchases
│   ├── ai.js                # Client-side Google Gemini 3.5 Flash API connector
│   └── trials.js            # ClinicalTrials.gov API v2 study query module
│
└── components/              # Layout and Screen views
    ├── Header.jsx           # Top app bar containing active role switcher pill & configuration gear
    ├── Sidebar.jsx          # Left-hand navigation column (retractable on compact viewports)
    ├── BiometricLock.jsx    # Simulated face/passcode verification gateway screen
    ├── SettingsDrawer.jsx   # Configuration slideout drawer to manage API keys & themes
    ├── AddApptModal.jsx     # Clinical schedule editor dialog modal
    ├── CommandPalette.jsx   # Keyboard shortcut search console overlay for quick actions
    ├── ToastProvider.jsx    # Toast notification framework for progress and system alerts
    │
    └── screens/             # Panel views for professional and patient roles
        ├── ClinicianDashboard.jsx # Stats counters, appointment scheduler, risk flags, suggestions
        ├── PatientDashboard.jsx   # Teletherapy quick-join, active homework lists, assigned tasks
        ├── CaseHistoryMSE.jsx     # Exhaustive intake history & HTML5 Genogram Drawing Canvas
        ├── SOAPNotesCopilot.jsx   # Transcribes conversations into clinical SOAP files
        ├── MentalStatusExam.jsx   # Digital checklists compiling descriptive clinical summaries
        ├── DiagnosticsSuite.jsx   # Hybrid rule-based calculations, SVG ontology graph, & AI differentials
        ├── TelehealthSession.jsx  # P2P video teletherapy panel with mock stream feeds
        ├── CBTGoalPlanner.jsx     # SMART goal compiler & CBT intervention planner
        ├── InteractiveAssessments.jsx # Automated GAD-7 & PHQ-9 progress charts
        ├── WellnessLounge.jsx     # Breathing pacer, mood logs, and MindShop items (sounds/themes)
        ├── PerformanceAnalytics.jsx # Billing records and practice metric charts
        ├── HIPAASecurityShield.jsx# Read-only audit log viewer tracking transaction hashes
        └── Marketplace.jsx        # Premium PsyPyrus extension plugins browser
```

---

## 🗄️ LocalStorage Database Persistence (`services/db.js`)

Since this app operates completely in the sandbox of the user's browser, data is managed via `localStorage`. The database wrapper implements:
*   Initial database seeding (seeding Patients, Appointments, Assessments, Mood Logs, and Security Logs) on first load.
*   Reactive events utilizing `window.dispatchEvent(new Event('psypyrus_db_change'))` to notify all UI subscribers of data updates.
*   **HIPAA Audit Logging:** Logs administrative activities (e.g. "Accessed EHR Record", "Generated SOAP Note via AI") directly to the local storage log table.

---

## 🧠 Clinical Services Layer

### 1. Built-in DSM-5-TR Database (`services/dsmDatabase.js`)
*   Contains structured criteria summaries, keywords, exclusions, comorbidity weights, and evidence-based interventions for **13 psychiatric conditions** (MDD, GAD, PTSD, ADHD, Bipolar Manic, Panic, BPD, OCD, Anorexia, SAD, Specific Phobia, Adjustment Disorder, Acute Stress Disorder).

### 2. Local Rules-Based Diagnostic Engine (`services/diagnostics.js`)
*   Exposes `evaluateClinicalProfile(profile)` to calculate diagnostic confidence. 
*   **Weight Configuration:** Criteria Match (40%), Duration Match (15%), Exclusions (15%), MSE Clinical Alignment (15%), History Correlation (10%), Standardized Screeners (5%).
*   Automatically calculates clinical risk status (Critical, Severe, Moderate, Low, None) and applies exclusion overrides (e.g., Bipolar manic episode excludes MDD).

### 3. WHO ICD-11 OAuth2 Service (`services/icdService.js`)
*   Connects to the official **WHO ICD-11 search registry API** using OAuth2 client credentials.
*   Features a **23-class local fallback search** to guarantee clinical coding functionality in offline environments.

### 4. Gamification & Adherence Engine (`services/gamification.js`)
*   Tracks XP progress, level increments, badge unlocks, and daily quests.
*   Integrates a **MindShop** where patients spend MindCoins earned from wellness routines to unlock customizable templates (Rainforest soundscape, Retro CRT console design, and Lisa AI companion guide).

---

## 🎨 Rich Interactive Features

### 1. Case History & Genogram Canvas (`screens/CaseHistoryMSE.jsx`)
*   A medical-grade intake editor logging personal info, informant reliability, chief complaints, negative history, premorbid personality traits, and full MSE sub-categories.
*   **HTML5 Genogram Canvas:** An interactive drawing board with draw tool controls (pen, eraser, color settings, line size) enabling clinicians to sketch and save family genograms directly to the database.

### 2. SVG Ontology Graph (`screens/DiagnosticsSuite.jsx`)
*   Renders a real-time reactive SVG graph mapping patient nodes, diagnostic candidates, and statistical comorbidity linkages.

### 3. Global Command Palette (`components/CommandPalette.jsx`)
*   A keyboard-shortcut search console overlay letting clinicians navigate screens, locate patient directories, and trigger actions rapidly.

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
