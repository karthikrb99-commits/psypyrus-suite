# 🧠 PsyPyrus Suite — Multi-Platform Mental Health Operating System & Wellness Hub

[![Build Status - Android](https://img.shields.io/badge/Android-Target--SDK--36-green?logo=android)](file:///android)
[![Build Status - iOS & macOS](https://img.shields.io/badge/Apple-iOS--17%20%7C%20macOS--14-blue?logo=apple)](file:///ios)
[![Build Status - Web](https://img.shields.io/badge/Web-Vite%20%2B%20React%20%2B%20ES6-purple?logo=react)](file:///web)
[![Build Status - Desktop](https://img.shields.io/badge/Desktop-Electron--Windows-cyan?logo=electron)](file:///desktop)
[![Compliance](https://img.shields.io/badge/Compliance-HIPAA%20%2F%20GDPR-teal?logo=shield)](file:///android/src/main/java/com/example/data/Entities.kt)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini--3.5--Flash-orange?logo=googlegemini)](https://ai.google.dev/)

Welcome to the **PsyPyrus Suite** repository. PsyPyrus is a premium, multi-platform **Mental Health Operating System (OS)** and clinical decision support framework. It is engineered to provide mental health practitioners with a high-fidelity EHR and documentation workspace, while simultaneously offering patients a secure, interactive wellness tracker.

This repository is structured as a unified **mono-repo** that scales across mobile, web, desktop, and Apple client ecosystems, sharing visual designs, local rule-based diagnostic engines, and clinical AI features.

---

## 🏛️ Mono-Repo Architecture

The repository is partitioned into five standalone target projects and supporting scripts to compile, package, and test:

```
psypyrus/ (Repository Root)
├── README.md                 # Unified Multi-Platform Documentation (This file)
│
├── android/                  # Native Android Client
│   ├── app/                  # Kotlin Compose UI & database source code
│   ├── build.gradle.kts      # Android build definitions
│   └── README.md             # Developer guide for compiling and testing Android
│
├── web/                      # React Web Companion App
│   ├── src/                  # React JSX views, custom CSS, and JS services
│   ├── package.json          # Web scripts & dependencies (Vite)
│   └── README.md             # Developer guide for the web app setup
│
├── desktop/                  # Electron Desktop Wrapper (Windows/macOS)
│   ├── main.js               # Desktop lifecycle, system tray, & filesystem logging
│   ├── preload.js            # Secure IPC bridge between Electron and web client
│   └── README.md             # Execution & packaging scripts for desktop binary
│
├── ios/                      # Native iOS client (SwiftUI)
│   ├── PsyPyrus/             # SwiftUI Views, ViewModels, Models, & Services
│   ├── generate_xcodeproj.py # Python script to generate ios Xcode project structure
│   └── README.md             # Setup guide for Apple mobile platform
│
└── macos/                    # Native macOS client (SwiftUI)
    ├── generate_xcodeproj.py # Python script to generate macOS Xcode project referencing iOS files
    ├── PsyPyrus.xcodeproj/   # Generated mac Xcode project target
    └── README.md             # Guide for macOS Xcode project construction
```

---

## 📊 Platform Feature Support Matrix

| Feature Module | Android (Kotlin) | Web (React) | Desktop (Electron) | iOS / macOS (SwiftUI) |
| :--- | :---: | :---: | :---: | :---: |
| **Dual-Persona Workspace** (Clinician/Patient) | Yes | Yes | Yes | Yes |
| **Expanded DSM-5-TR Database** (13 Disorders) | Yes | Yes | Yes | Yes |
| **WHO ICD-11 Registry client** (OAuth2 Credentials) | — | Yes | Yes | — |
| **Local Diagnostic Engine** (Checklist & Multi-Scores)| Yes | Yes | Yes | Yes |
| **Interactive SVG Ontology Graph** | — | Yes | Yes | — |
| **EHR Case History & Genogram Canvas** | — | Yes | Yes | — |
| **Gamification & MindShop Rewards** | — | Yes | Yes | — |
| **Global Quick-Search Command Palette** | — | Yes | Yes | — |
| **AI SOAP Note Compiler** (Gemini 3.5 Flash) | Yes | Yes | Yes | Yes |
| **AI MSE Narrative Compiler** (Checklist to Prose)| Yes | Yes | Yes | Yes |
| **AI SMART Treatment Planner** | Yes | Yes | Yes | Yes |
| **AI Suicide/Crisis Risk Screening** | Yes | Yes | Yes | Yes |
| **ClinicalTrials.gov Integration** | Yes | Yes | Yes | Yes |
| **Patient Wellness Lounge** (Breathing, Mood logs) | Yes | Yes | Yes | Yes |
| **Local Secure Storage** | Room DB | LocalStorage | LocalStorage | Local State & Cache |
| **HIPAA Security Audit Logs** | SQLite DB | LocalStorage | `AppData` Files | Local memory cache |
| **Native Integrations** (System tray, Toast alerts) | — | — | Yes (Windows) | — |
| **Code-Shared Target Build** (Relative file links)| — | — | — | Yes (macOS imports iOS source) |

---

## 🌟 Latest Feature & Clinical Updates

### 1. Expanded DSM-5-TR Catalog & Database (`dsmDatabase.js`)
The local database contains structured criteria summaries, keyword arrays, exclusion rules, comorbidity weights, and interventions for **13 primary psychiatric conditions**:
*   *Depressive:* Major Depressive Disorder (MDD), Single Episode
*   *Anxiety:* Generalized Anxiety Disorder (GAD), Panic Disorder, Social Anxiety Disorder (SAD), Specific Phobia
*   *Trauma-Related & Stress-Response:* Post-Traumatic Stress Disorder (PTSD), Adjustment Disorder, Acute Stress Disorder
*   *Neurodevelopmental:* Attention-Deficit/Hyperactivity Disorder (ADHD), Combined Presentation
*   *Bipolar:* Bipolar I Disorder, Current Episode Manic
*   *Personality:* Borderline Personality Disorder (BPD)
*   *OCD-Related:* Obsessive-Compulsive Disorder (OCD)
*   *Eating:* Anorexia Nervosa

### 2. Official WHO ICD-11 OAuth2 Search Registry
*   Integrates the official **World Health Organization (WHO) ICDAPI** to query the international classification registry.
*   Handles token retrieval, token caching, API headers, and strips search results HTML markup.
*   Includes a **23-class psychiatric local fallback search** to guarantee functionality in offline environments or if credentials are omitted.

### 3. Gamification & Patient Adherence Engine (`gamification.js`)
A behavioral design layer to combat documentation burnout and patient dropouts:
*   **Clinician Progression:** Clinicians earn XP for logging encounters, running diagnostics, and completing SOAP notes.
*   **Patient Progression & MindCoins:** Patients earn XP and **MindCoins** for logging moods, executing breathing exercises, and finishing homework.
*   **The MindShop:** Allows patients to spend coins to unlock ambient soundscapes (Rainforest, Fireplace), visual styles (Glassmorphism layout, Retro CRT skin), and personalized AI companions (Lisa).
*   **Badges & Daily Quests:** Auto-tracks milestones (e.g. *Scribe Master*, *Zen Master*, *Homework Hero*).

### 4. Interactive SVG Ontology Graph Visualizer
*   Renders a real-time reactive network diagram inside the Diagnostics suite.
*   Visualizes the patient node connected to calculated candidate diagnoses, adding comorbidity links with dash-arrays and statistical correlation weights (e.g. 62% MDD-GAD comorbidity line).

### 5. EHR Case History & Genogram Drawing Canvas
*   **Comprehensive Intake:** Captures verbatim chief complaints, developmental history, pre-morbid personality indices, negative somatic histories, and a 6-grade psychiatric insight scale.
*   **HTML5 Genogram Canvas:** Features a built-in drawing board with drawing tools (pen, eraser, color settings, line sizes) enabling practitioners to draw family genograms directly on screen and save them to local databases.

### 6. Keyboard Shortcut Command Palette (`CommandPalette.jsx`)
*   Provides a quick-search launcher (triggered via global shortcut bindings) allowing clinicians to search screens, select patient directories, and launch actions rapidly.

---

## 🛠️ Quick Bootstrapping & Setup

### 1. Configure Gemini 3.5 Flash API Key
*   **Android App:** Create a `.env` file in the `/android` directory:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
*   **Web App & Desktop Client:** Enter your key inside the **API Configurations** drawer (gear icon in the top right).
*   **iOS & macOS Clients:** Add your key inside the Xcode settings panel sheet (gear icon in the navigation bar).
*   *Note: If no API key is specified, all clients will fallback to the internal mock response engines.*

### 2. Run the Projects

#### 📱 Native Android Client (`/android`)
1. Open **Android Studio**.
2. Select **Open** and select the `/android` directory.
3. Allow Gradle to sync. Run on an Android Emulator or physical device (Target SDK 36, JDK 17+).

#### 💻 Web companion Client (`/web`)
1. Navigate to `/web` and run:
   ```bash
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.

#### 💻 Desktop Wrapper Client (`/desktop`)
1. Run the web companion app first (`npm run dev` in `/web`).
2. Navigate to `/desktop` and run:
   ```bash
   npm install
   npm run dev
   ```
3. To package into a standalone Windows `.exe` or macOS bundle, run:
   ```bash
   npm run package      # For Windows (.exe)
   npm run package:mac  # For macOS (.app/.dmg)
   ```

#### 🍎 Apple iOS Client (`/ios`)
1. Open terminal in the `/ios` directory and run:
   ```bash
   python generate_xcodeproj.py
   ```
2. Open `PsyPyrus.xcodeproj` in **Xcode** on a macOS system.
3. Select an iOS Simulator/device target and run (`Cmd + R`).

#### 🍏 Apple macOS Client (`/macos`)
1. Open terminal in the `/macos` directory and run:
   ```bash
   python generate_xcodeproj.py
   ```
2. Open the generated `PsyPyrus.xcodeproj` in **Xcode**.
3. Select **My Mac** target destination and run (`Cmd + R`).

---

## 🔒 HIPAA & Clinical Disclaimer
This application is designed as a **Clinical Decision Support System (CDSS)**. All AI-generated outputs, diagnostics, summaries, and treatment plans are intended for educational and clinical assistance only and must be reviewed, edited, and approved by a licensed clinical practitioner prior to integration into any active Electronic Health Record.
