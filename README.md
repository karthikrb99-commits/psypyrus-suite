# 🧠 PsyPyrus AI — Mental Health Operating System

[![Build Status](https://img.shields.io/badge/Build-Android--v36-brightgreen?logo=android)](https://developer.android.com/studio)
[![Database](https://img.shields.io/badge/Database-Room--SQLite-blue?logo=sqlite)](https://developer.android.com/training/data-storage/room)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini--3.5--Flash-orange?logo=googlegemini)](https://ai.google.dev/)
[![Compliance](https://img.shields.io/badge/Compliance-HIPAA%20%2F%20GDPR-teal?logo=shield)](https://www.hhs.gov/hipaa/index.html)

PsyPyrus AI is an advanced, premium-tier **Mental Health Operating System (OS)** designed to serve as a secure clinical decision support system and practice management workspace for mental health professionals, combined with a wellness tracking application for patients. 

It implements high-fidelity local rules-based diagnostic checks, external integrations with ClinicalTrials.gov, and a multi-modular **AI Copilot** powered by **Google Gemini 3.5 Flash** for clinical documentation, mental status narrative synthesis, risk evaluation, and treatment planning.

---

## 🏛️ System Architecture

PsyPyrus AI is built on standard Android MVVM architecture using Jetpack Compose and Kotlin, with a fully-offline Room database supporting live clinical state synchronization.

```
┌──────────────────────────────────────────────────────────────────┐
│                          UI LAYER (Compose)                      │
│     ┌──────────────────────────────────────────────────────┐     │
│     │               Biometric Lock Screen                  │     │
│     ├──────────────────────────┬───────────────────────────┤     │
│     │    Professional View     │       Patient View        │     │
│     │  • Clinic Dashboard      │  • Wellness Dashboard     │     │
│     │  • AI Copilot Workspace  │  • Mindful Breathing Timer│     │
│     │  • Digital MSE checklist │  • Mood Journal Logs      │     │
│     │  • Diagnostics Engine    │  • Homework Panel         │     │
│     │  • HIPAA Security Audits │  • Telehealth launcher    │     │
│     └──────────────────────────┴───────────────────────────┘     │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ Observes StateFlows
┌────────────────────────────────▼─────────────────────────────────┐
│                       VIEWMODEL (PsyPyrusViewModel)              │
│       Coordinates State Flows, AI Actions & DB Operations        │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ Coordinates Transactions
┌────────────────────────────────▼─────────────────────────────────┐
│                    REPOSITORY (PsyPyrusRepository)               │
└──────┬─────────────────────────┼─────────────────────────┬───────┘
       │ Reads/Writes            │ Remote Queries          │ Remote Queries
┌──────▼──────┐           ┌──────▼──────┐           ┌──────▼──────┐
│  Local DB   │           │ Gemini      │           │ Clinical    │
│  (Room /    │           │ Service     │           │ Trials      │
│   SQLite)   │           │ (Gemini     │           │ Service     │
│             │           │  3.5 Flash) │           │ (Official   │
│             │           │             │           │  API v2)    │
└─────────────┘           └─────────────┘           └─────────────┘
```

---

## 🌟 Core Feature Suite

### 1. Dual-Persona Workspace
The system dynamically adapts to the logged-in user persona, toggled instantly via the app bar:
*   **Professional Mode (Clinician Suite):** Enables cases management, EHR chart review, diagnostic evaluations, clinical narrative generation, practice scheduling, telehealth launching, and billing/revenue insights.
*   **Patient Mode (Wellness Hub):** Provides patients with a HIPAA-secured gateway to access scheduled video sessions, view assigned clinical homework, keep gratitude logs, report mood indices, and engage in paced mindful breathing.

### 2. AI Copilot (Powered by Gemini 3.5 Flash)
A suite of clinical intelligence features integrated directly with the Gemini API:
*   **SOAP Note Generator:** Translates unstructured session transcripts into formalized medical SOAP notes (Subjective, Objective, Assessment, Plan), complete with DSM-5-TR and ICD-10 diagnostic code considerations.
*   **MSE Narrative Compiler:** Synthesizes objective checklist assessments (appearance, behavioral attributes, speech pattern, mood/affect, insight, and clinical judgment) into a continuous prose paragraph suitable for formal EHR charts.
*   **Hybrid Diagnostic Assistant:** Combines the outputs of the local rule-based diagnostic engine with clinical LLM reasoning to evaluate complex symptom descriptions and output differential options, criteria checkmarks, and comorbidity suggestions.
*   **SMART Goal Treatment Planner:** Converts basic therapy goals into full, evidence-based treatment schemes containing SMART objectives, specific interventions, assigned patient homework, and progress milestones.
*   **Crisis & Suicide Risk Detector:** Runs real-time safety classification on input clinical notes/transcripts to detect crisis indicators, suicidal ideation, or severe mental deterioration.
*   **Clinical Librarian:** Queries medical guidelines and DSM archives to return brief, high-yield academic summaries.

### 3. Local Rule-Based Diagnostic Engine
Runs completely offline within [DiagnosticEngine.kt](file:///app/src/main/java/com/example/data/DiagnosticEngine.kt) to calculate criteria compliance:
*   **DSM-5-TR Major Depressive Disorder (MDD):** Checks for $\ge 5$ symptoms present for $\ge 2$ weeks, requiring at least one core indicator (depressed mood or anhedonia) and verifying exclusion criteria (no manic/hypomanic history, no substance/medical attributions).
*   **DSM-5-TR Generalized Anxiety Disorder (GAD):** Verifies excessive anxiety occurring more days than not for $\ge 6$ months, accompanied by $\ge 3$ of 6 standard somatic/cognitive indicators (restlessness, fatigue, muscle tension, etc.).
*   **Mock Disorders (Phantom & Hypothetical):** Facilitates testing and validation of the engine using custom, multi-tiered symptom sets and age boundaries.

### 4. Security & HIPAA Shield
*   **Biometric Lock Screen:** Initial gatekeeping component verifying user credentials before rendering patient health data.
*   **Cryptographic Audit Trails:** Automatically logs security events (e.g. EHR access, database initialization, AI generations) in a dedicated local table, registering the actor, IP, event descriptions, and enforcing compliance standards (AES-GCM-256 standard validation indicator).

### 5. ClinicalTrials.gov Integration
*   Directly queries the official **ClinicalTrials.gov REST API v2** using `query.cond` based on the patient's specialty diagnosis.
*   Pulls the first 5 active, recruiting studies including NCT identifier, official study title, recruitment status, and conditions.
*   Includes a robust mock fallback dataset to ensure fluid demonstration in offline or restricted network environments.

---

## 🗄️ Database Design

The local database contains 7 relational entities managed via Room ORM:

| Entity Name | Table Name | Purpose / Metadata |
| :--- | :--- | :--- |
| `Patient` | `patients` | General EHR profile, risk category status, and specialty diagnosed condition. |
| `Appointment` | `appointments` | Clinic scheduler logs, virtual/offline marker, billable fee, and video code. |
| `ClinicalNote` | `clinical_notes` | Houses notes structured by noteType (`SOAP`, `MSE`, `PLAN`, `GENERAL`), body text, risk flags, and clinical disclaimers. |
| `AssessmentScore`| `assessments` | Clinical questionnaire tracker storing historical scores (PHQ-9, GAD-7) and severity tags. |
| `MoodLog` | `mood_logs` | Daily patient journal entries tracking numerical mood (1–10), gratitude lists, and breathing logs. |
| `SecurityAuditLog`| `security_audit_logs` | HIPAA-compliant event ledger tracking user actions, timestamps, and encryption parameters. |
| `HomeworkTask` | `homework_tasks` | Clinical homework items assigned to specific patient IDs with completion checkboxes. |

---

## 🛠️ Getting Started & Local Execution

### Prerequisites
*   [Android Studio (Koala or newer)](https://developer.android.com/studio)
*   Android SDK 36 (targetSdk)
*   Java JDK 17+

### 1. Open the Project
Open Android Studio, select **Open**, and select the `psypyrus-ai` folder. Allow Gradle to synchronize dependencies and resolve toolchain files.

### 2. Configure Environment Variables
Create a file named `.env` in the root of the `psypyrus-ai` directory. Define your Gemini API key (obtained from Google AI Studio) inside it:

```env
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here...
```

*Note: If no API key is specified or if the key matches the placeholder in `.env.example`, the app will automatically fall back to its internal, high-fidelity mock clinical responder to ensure all AI Copilot features remain fully testable.*

### 3. Build & Run
1. Run the app on an Android Emulator or a physical device.
2. If compiling for debug/testing, make sure the Gradle build configuration is set to `debug`.
3. To configure signing options, edit the `signingConfigs` block inside the [app/build.gradle.kts](file:///app/build.gradle.kts) file.

---

## 📁 Codebase Directory Structure

```
psypyrus-ai/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/
│   │   │   │   ├── MainActivity.kt        # Application Entrypoint
│   │   │   │   ├── data/                  # Data Layer
│   │   │   │   │   ├── AppDatabase.kt     # Room Database, Daos
│   │   │   │   │   ├── Entities.kt        # Room Database Entity Definitions
│   │   │   │   │   ├── Repository.kt      # Repository pattern wrapper
│   │   │   │   │   ├── DiagnosticEngine.kt# Rule-based MDD, GAD & Mock evaluator
│   │   │   │   │   ├── GeminiService.kt   # Client connection to Google Gemini API
│   │   │   │   │   └── ClinicalTrialsService.kt # OkHttp client for ClinicalTrials.gov
│   │   │   │   └── ui/                    # UI / Presentation Layer
│   │   │   │       ├── PsyPyrusUi.kt      # All screen layouts, navigation, dialogs
│   │   │   │       ├── PsyPyrusViewModel.kt# ViewModel managing states & triggers
│   │   │   │       └── theme/             # Custom color schemes, typography, styles
│   │   │   └── AndroidManifest.xml        # App declarations and configurations
│   │   └── test/                          # Unit & UI Tests (Robolectric & Roborazzi)
│   └── build.gradle.kts                   # Module level Gradle configuration
├── gradle/
│   └── libs.versions.toml                 # Version Catalog for dependencies
├── .env.example                           # Template file for api configuration
├── build.gradle.kts                       # Project level build scripts
└── settings.gradle.kts                    # Project build directories
```

---

## 🔒 HIPAA & Clinical Disclaimer
This application is designed as a **Clinical Decision Support System (CDSS)**. Any AI-generated documentation, SOAP notes, mental status narratives, or diagnostic suggestions must be reviewed, edited, and approved by a licensed clinical practitioner prior to integration into any active Electronic Health Record. It does not replace independent clinical judgment.
