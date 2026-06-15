# 🧠 Papyrus — Open Source Mental Health EHR & HIPAA-Compliant Psychiatric Operating System

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Build Status - Android](https://img.shields.io/badge/Android-Target--SDK--36-green?logo=android)](file:///android)
[![Build Status - iOS & macOS](https://img.shields.io/badge/Apple-iOS--17%20%7C%20macOS--14-blue?logo=apple)](file:///ios)
[![Build Status - Web](https://img.shields.io/badge/Web-Vite%20%2B%20React%20%2B%20ES6-purple?logo=react)](file:///web)
[![Build Status - Desktop](https://img.shields.io/badge/Desktop-Electron--Windows-cyan?logo=electron)](file:///desktop)
[![Compliance](https://img.shields.io/badge/Compliance-HIPAA%20%2F%20GDPR%20%2F%20DISHA-teal?logo=shield)](file:///android/src/main/java/com/example/data/Entities.kt)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini--3.5--Flash-orange?logo=googlegemini)](https://ai.google.dev/)

Welcome to **Papyrus**, a premier open-source **Mental Health Operating System** and **EHR clinical platform**. It is designed to modernize psychiatric and psychological care through interoperable, secure, and privacy-focused digital tools. Papyrus operates as a comprehensive **Clinical Decision Support System (CDSS)**, an **AI SOAP Notes Scribe and Copilot**, and an **expert clinical advisor** that integrates medical science with patient-centered gamification.

Our mission is to democratize access to advanced mental health care technology, providing free therapy tools, digitized Mental Status Exams (MSE), research exploration tools (HiTOP/RDoC), and robust standards-based integrations (like ABDM for India) to practitioners and patients worldwide.

---

## 🌎 A Movement for Mental Health Liberation

Mental healthcare is one of humanity's greatest unfinished projects. Despite remarkable advances in science, millions remain without access to quality care. Clinical knowledge is fragmented, research is siloed, and healthcare infrastructure remains inaccessible to many communities across the world.

Papyrus was born from a simple belief: **Knowledge that can reduce suffering should not be locked away.** The tools that help humanity understand and heal itself belong, in spirit, to humanity itself.

### Open Science. Open Knowledge. Open Care.
We envision a future where mental health technology operates as a global commons:
* **Open Clinical Knowledge** through transparent algorithms and diagnostic models.
* **Reproducible Science** via integrated research matrices (HiTOP, RDoC) and open clinical schemas.
* **Accessible Tools** distributed across cultures, devices, and low-resource settings.
* **Community-Driven Innovation** bringing clinicians, developers, researchers, and patients together.

### Constructive Disruption
Papyrus seeks to constructively disrupt mental healthcare by:
* Replacing fragmented clinical tools with a unified, interoperable operating system.
* Replacing information silos with compound, shared knowledge graphs.
* Replacing proprietary software bottlenecks with open digital health infrastructure.
* Amplifying human care rather than replacing it with automated intelligence.

---

## 📱 The PsyPyrus Suite

The **PsyPyrus Suite** is the multi-platform client application workspace built to run within the Papyrus Ecosystem. It functions as:
1. **A Secure Practitioner Portal (EHR / CDSS)**: Providing clinical status checksheets, intake workflows, a vector genogram drawing board, and AI SOAP/MSE compilers.
2. **A Secure Patient Workspace**: A companion app offering mood tracking, deep breathing exercises, cognitive homework, and gamified progress logs.

The codebase is organized as a unified **mono-repo** scaling across mobile, web, desktop, and Apple client ecosystems:

```
psypyrus/ (Repository Root)
├── README.md                 # Unified Ecosystem & Product Documentation (This file)
├── CONTRIBUTING.md           # Instructions on how to build and contribute to the commons
├── CODE_OF_CONDUCT.md        # Community expectations and covenant
├── SECURITY.md               # Safety disclosures & security policies
│
├── android/                  # Native Android Client
│   ├── app/                  # Kotlin Compose UI, Room Database, & Biometric source code
│   └── README.md             # Developer guide for compiling and testing Android
│
├── web/                      # React Web Companion App
│   ├── src/                  # React JSX views, custom CSS, and JS services
│   └── README.md             # Developer guide for the web app setup
│
├── desktop/                  # Electron Desktop Wrapper (Windows/macOS)
│   ├── main.js               # Desktop lifecycle, system tray, & filesystem logging
│   └── README.md             # Execution & packaging scripts for desktop binary
│
├── ios/                      # Native iOS client (SwiftUI)
│   ├── PsyPyrus/             # SwiftUI Views, ViewModels, Models, & Services
│   └── README.md             # Setup guide for Apple mobile platform
│
└── macos/                    # Native macOS client (SwiftUI)
    ├── PsyPyrus.xcodeproj/   # Generated mac Xcode project target
    └── README.md             # Guide for macOS Xcode project construction
```

---

## 📊 Platform Feature Support Matrix (Parity Sync)

| Feature Module | Android (Kotlin) | Web (React) | Desktop (Electron) | iOS / macOS (SwiftUI) | Cloud / Sync |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dual-Persona Workspace** (Clinician/Patient) | Yes | Yes | Yes | Yes | Yes |
| **Expanded DSM-5-TR Database** (13 Disorders) | Yes | Yes | Yes | Yes | Yes |
| **WHO ICD-11 Registry client** (OAuth2 Credentials) | Yes | Yes | Yes | Yes | Yes |
| **Local Diagnostic Engine** (Checklist & Multi-Scores)| Yes | Yes | Yes | Yes | Yes |
| **Interactive SVG Ontology Graph** | Yes | Yes | Yes | Yes | Yes |
| **EHR Case History & Genogram Canvas** | Yes | Yes | Yes | Yes | Yes |
| **Gamification & MindShop Rewards** | Yes | Yes | Yes | Yes | Yes |
| **Global Quick-Search Command Palette** | Yes | Yes | Yes | Yes | Yes |
| **AI SOAP Note Compiler** (Gemini 3.5 Flash) | Yes | Yes | Yes | Yes | Yes |
| **AI MSE Narrative Compiler** (Checklist to Prose)| Yes | Yes | Yes | Yes | Yes |
| **AI SMART Treatment Planner** | Yes | Yes | Yes | Yes | Yes |
| **AI Suicide/Crisis Risk Screening** | Yes | Yes | Yes | Yes | Yes |
| **ClinicalTrials.gov Integration** | Yes | Yes | Yes | Yes | Yes |
| **Patient Wellness Lounge** (Breathing, Mood logs) | Yes | Yes | Yes | Yes | Yes |
| **Local Secure Storage** | Room DB | IndexedDB | LocalStorage | SQLite & CoreData | Cloud DB |
| **Security Biometrics** | BiometricPrompt | Mock Scanner | Mock Scanner | LocalAuthentication | OAuth2 / RLS |
| **Cloud Synchronization** | REST Sync | REST Sync | REST Sync | REST Sync | WebSocket / REST |

---

## 🌟 Latest Feature & Clinical Updates

### 1. Synced DSM-5-TR Catalog & Database (`DsmDatabase`)
The local database on all client engines supports **13 primary psychiatric conditions** with diagnostic checklists, comorbidity weights, criteria summaries, and interventions:
* *Depressive:* Major Depressive Disorder (MDD), Single Episode
* *Anxiety:* Generalized Anxiety Disorder (GAD), Panic Disorder, Social Anxiety Disorder (SAD), Specific Phobia
* *Trauma-Related & Stress-Response:* Post-Traumatic Stress Disorder (PTSD), Adjustment Disorder, Acute Stress Disorder
* *Neurodevelopmental:* Attention-Deficit/Hyperactivity Disorder (ADHD), Combined Presentation
* *Bipolar:* Bipolar I Disorder, Current Episode Manic
* *Personality:* Borderline Personality Disorder (BPD)
* *OCD-Related:* Obsessive-Compulsive Disorder (OCD)
* *Eating:* Anorexia Nervosa

### 2. Official WHO ICD-11 OAuth2 Search Registry
* Integrates the official **World Health Organization (WHO) ICDAPI** to query the international classification registry.
* Handles token retrieval, token caching, API headers, and strips search results HTML markup.
* Includes a **23-class psychiatric local fallback search** to guarantee functionality in offline environments.

### 3. Ayushman Bharat Digital Mission (ABDM) & EHR India Integration
* **ABHA ID Verification & Generation**: Features an interactive sandbox to link an existing 14-digit ABHA ID / Address or generate a new one via Aadhaar verification, rendering a government-compliant ABHA Health Card.
* **Consent Manager Simulator (HIU/HIP)**: Simulates the official ABDM Consent Framework. Clinicians can raise consent requests, patients can approve/deny requests, and the system fetches and decrypts encrypted HL7 FHIR bundles from national health lockers.
* **DISHA Act Compliance**: Rebranded security panel demonstrating compliance with India's upcoming *Digital Information Security in Healthcare Act* (DISHA) alongside HIPAA and GDPR.
* **Bahmni & eSanjeevani Sync Support**: Hooks to simulate syncing patient charts to Indian open-source EMR/EHR platforms like Bahmni and importing telemedicine consultations from eSanjeevani.
* **C-DAC / NRCeS Clinical Standards**: Integrated mappings for standard **SNOMED CT Concept IDs** for psychiatric classifications and **LOINC Codes** for assessments (PHQ-9, GAD-7, MSE) inside local databases, AI prompts, and FHIR outputs.
* **MoHFW Telemedicine Compliance Tracker**: Interactive compliance verification checklist and prescription formatting matching India's official *Telemedicine Practice Guidelines (2020)*.
* **openEHR Archetype Composition Exporter**: Interactive panel compiling and exporting clinical documents conforming to openEHR archetype definitions.

### 4. Gamification & Patient Adherence Engine
* **Clinician Progression**: Clinicians earn XP for logging encounters, running diagnostics, and completing SOAP notes.
* **Patient Progression & MindCoins**: Patients earn XP and **MindCoins** for logging moods, executing breathing exercises, and finishing homework.
* **The MindShop**: Allows patients to spend coins to unlock ambient soundscapes (Rainforest, Fireplace), visual styles (Glassmorphism layout, Retro CRT skin), and personalized AI companions (Lisa).
* **Badges & Daily Quests**: Auto-tracks milestones (e.g. *Scribe Master*, *Zen Master*, *Homework Hero*).

### 5. Interactive SVG/Canvas Ontology Graph Visualizer
* Renders a real-time reactive network diagram inside the Diagnostics suite.
* Visualizes the patient node connected to calculated candidate diagnoses, adding comorbidity links with dash-arrays and statistical correlation weights (e.g. 62% MDD-GAD comorbidity line).

### 6. EHR Case History & Genogram Drawing Canvas
* **Comprehensive Intake**: Captures verbatim chief complaints, developmental history, pre-morbid personality indices, negative somatic histories, and a 6-grade psychiatric insight scale.
* **HTML5 & Vector Genogram Canvas**: Features a drawing board with drawing tools (pen, eraser, color settings, line sizes) enabling practitioners to draw family genograms directly on screen and save them to local/cloud databases.

### 7. Keyboard Shortcut Command Palette
* Provides a quick-search launcher (triggered via global shortcut bindings like `Ctrl + K` / `Cmd + K`) allowing clinicians to search screens, select patient directories, and launch actions rapidly.

### 8. Native Biometrics & Cloud Sync Engine
* **Biometrics Parity**: Integrates `BiometricPrompt` (Android) and `LocalAuthentication` (iOS/macOS) for cryptographically locked biometric sessions.
* **REST/WebSocket Sync**: Syncs local database records to the cloud utilizing automated conflict-resolution handlers.

---

## 🛠️ Quick Bootstrapping & Setup

### 1. Configure Gemini 3.5 Flash API Key
* **Android App**: Create a `.env` file in the `/android` directory:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
* **Web App & Desktop Client**: Enter your key inside the **API Configurations** drawer (gear icon in the top right).
* **iOS & macOS Clients**: Add your key inside the Xcode settings panel sheet (gear icon in the navigation bar).
* *Note: If no API key is specified, all clients will fallback to the internal mock response engines.*

### 2. Run the Projects

#### 📱 Native Android Client (`/android`)
1. Open **Android Studio**.
2. Select **Open** and select the `/android` directory.
3. Allow Gradle to sync. Run on an Android Emulator or physical device (Target SDK 36, JDK 17+).

#### 💻 Web Companion Client (`/web`)
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

## 🔒 HIPAA, GDPR & Clinical Disclaimer

The PsyPyrus application operates as a **Clinical Decision Support System (CDSS)** within the Papyrus Ecosystem. All AI-generated outputs, diagnostics, summaries, and treatment plans are intended for educational and clinical assistance only and must be reviewed, edited, and approved by a licensed clinical practitioner prior to integration into any active Electronic Health Record.

---

## 🤝 Open Source & Contributing

We welcome contributions to the Papyrus Ecosystem! Please read our [Contributing Guidelines](CONTRIBUTING.md) to get started. By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

For clinical safety or security vulnerabilities, please refer to our [Security Policy](SECURITY.md).

### A Call for Contributors
Papyrus is intentionally interdisciplinary. We invite contributors from every relevant field:
* **Mental Health Professionals**: Psychologists, Psychiatrists, Psychotherapists, Counselors, Social Workers, Occupational Therapists, Psychiatric Nurses.
* **Researchers & Academics**: Clinical Researchers, Neuroscientists, Cognitive Scientists, Behavioral Scientists, Epidemiologists, Computational Psychiatrists.
* **Computer Science & AI**: Software Engineers, Frontend/Backend/Mobile Developers, Machine Learning & NLP Researchers, Data Scientists, Security Specialists.
* **Design & Human Factors**: UX Researchers, UI Designers, Accessibility Experts, Service Designers.
* **Health Informatics**: HL7/FHIR Specialists, Medical Informatics Experts, Healthcare Administrators.
* **Ethics, Policy & Law**: Bioethicists, Privacy Experts, AI Governance Researchers, Health Policy Specialists.
* **Community Contributors**: Patients and Lived-Experience Advocates, Translators, Documentation Writers, Educators.

## 🔍 GitHub Repository SEO Recommendations



- **Description**: `Papyrus: The open-source, secure, HIPAA & DISHA compliant mental health operating system. Features AI SOAP notes, digital MSE, genogram canvas, HiTOP/RDoC matrix explorers, and ABDM India sandbox.`
- **Website URL**: `https://psypyrus.health/`
- **Topics**: 
  - `mental-health`
  - `ehr`
  - `electronic-health-records`
  - `psychiatry`
  - `soap-notes`
  - `hipaa-compliant`
  - `abdm`
  - `disha-compliance`
  - `react`
  - `open-source`
  - `healthcare-it`
  - `dsm-5`
  - `ai-therapist`

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
