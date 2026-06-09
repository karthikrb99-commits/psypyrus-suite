# 🧠 PsyPyrus Suite — Mental Health Operating System & Wellness Hub

Welcome to the **PsyPyrus Suite** repository. PsyPyrus is an advanced, premium-tier **Mental Health Operating System (OS)** and clinical decision support platform designed for mental health professionals, coupled with a private wellness tracker for patients.

This repository is structured as a **mono-repo** containing both the high-fidelity native **Android application** and the interactive **Web companion application**. Both platforms share the exact same UI layout, clinical workflows, local diagnostics engine, and AI features to provide a seamless cross-platform experience.

---

## 🏛️ Mono-Repo Architecture

```
psypyrus/ (Repository Root)
├── .gitignore               # Root-level exclusions
├── README.md                # This unified documentation
├── android/                 # Native Android Application
│   ├── app/                 # Kotlin Compose source code
│   │   └── src/
│   │       ├── main/        # Android manifests, resources, and codebase
│   │       └── test/        # Robolectric & Roborazzi screenshot tests
│   ├── gradle/              # Version catalogs & gradle wrapper
│   ├── build.gradle.kts     # Build scripts
│   └── README.md            # Detailed Android developer guide
└── web/                     # Web Application
    ├── index.html           # Main HTML5 layout & components
    ├── style.css            # Vanilla CSS3 visual stylesheet
    └── js/                  # ES6 Javascript Modules
        ├── main.js          # App lifecycle & bootstrapping
        ├── ui.js            # Dual-persona UI render engine
        ├── db.js            # HIPAA-compliant local database layer (LocalStorage)
        ├── diagnostics.js   # Local rule-based DSM-5-TR diagnostic engine
        ├── ai.js            # Client-side Google Gemini 3.5 API integration
        └── trials.js        # ClinicalTrials.gov REST API v2 connector
```

---

## 🌟 Core Feature Suite

### 1. Dual-Persona Secure Workspace
Both applications adapt instantly to the logged-in user role, toggled via a dedicated persona pill:
*   **Professional Mode (Clinician Suite):** Enables EHR case management, digital Mental Status Examinations (MSE), automated clinical narrative synthesis, appointment scheduling, video telehealth, billing snapshots, and HIPAA cryptography audit trails.
*   **Patient Mode (Wellness Hub):** Provides patients with a secure gateway to log daily mood scores, keep gratitude lists, practice paced breathing exercises, check off assigned homework tasks, and launch video therapy sessions.

### 2. Cryptographic Security & HIPAA Shield
*   **Biometric lock screens** protect sensitive health records (PHI) upon workspace initialization.
*   **Cryptographic Audit Trails** automatically record all database actions (EHR reads, logs, AI syntheses) with security metadata (actor, action, hash parameters) using local storage vaults.

### 3. AI Copilot (Powered by Google Gemini 3.5 Flash)
*   **SOAP Note Generator:** Compiles raw transcript dictations into standard clinical SOAP notes (Subjective, Objective, Assessment, Plan).
*   **MSE Prose Synthesizer:** Transcribes objective mental status checklist entries into standard medical record paragraphs.
*   **SMART Goal Treatment Planner:** Formulates unstructured therapy objectives into structured SMART goals, clinical interventions, and assigned patient homework.
*   **Simulated Fallback Mode:** If no Gemini API key is configured, both platforms seamlessly fallback to internal, high-fidelity clinical responders, making the app fully functional and testable out-of-the-box.

### 4. Local Rule-Based Diagnostics Engine
Runs offline on both platforms to evaluate criteria compliance:
*   **DSM-5-TR Major Depressive Disorder (MDD):** Verifies presence of $\ge 5$ symptoms over $\ge 2$ weeks, requiring core symptoms (depressed mood or anhedonia) and checking exclusions.
*   **DSM-5-TR Generalized Anxiety Disorder (GAD):** Evaluates somatic and cognitive criteria occurring more days than not for $\ge 6$ months.

### 5. ClinicalTrials.gov API Integration
*   Directly queries the official **ClinicalTrials.gov REST API v2** matching the patient's diagnosed specialty condition to return active, recruiting clinical studies.

---

## 🛠️ Getting Started & Setup

### 📱 Android Application (`android/`)
Built using **Jetpack Compose**, **Kotlin**, and **Room DB** (SQLite).

1. Open **Android Studio (Koala+)**.
2. Select **Open** and select the `/android` directory.
3. Configure your API key by creating a `.env` file in the `/android` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Run the project on an Android Emulator or physical device (Target SDK 36, JDK 17+).

*For detailed build, signing, and testing guidelines, see the [android/README.md](file:///android/README.md).*

---

### 💻 Web Application (`web/`)
Built with modern, responsive **HTML5**, **CSS3**, and modular **ES6 Javascript** mimicking the native Jetpack Compose styling.

1. Navigate to the `/web` directory.
2. Open `index.html` directly in any modern web browser, or serve it using a lightweight HTTP server (e.g., Python, Node.js, or VS Code Live Server):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (npx)
   npx http-server
   ```
3. Configure your API key inside the **API Configurations** panel (gear icon in the top right of the application). The key is stored securely in your browser's local storage and never transits through intermediate servers.

---

## 🔒 HIPAA & Clinical Disclaimer
This application is designed as a **Clinical Decision Support System (CDSS)**. All AI-generated outputs, diagnostics, summaries, and treatment plans are intended for educational and clinical assistance only and must be reviewed, edited, and approved by a licensed clinical practitioner prior to integration into any active Electronic Health Record.
