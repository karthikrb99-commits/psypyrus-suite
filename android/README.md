# 📱 PsyPyrus Android Client — Experimental Mobile Work-In-Progress

This directory contains the native Android mobile client for the **PsyPyrus Suite**. Unlike the React Web app (which is the primary reference implementation), this mobile application is currently in an early **work-in-progress (experimental)** status.

It is built using **Kotlin**, **Jetpack Compose** (Material 3), and **Room ORM** (SQLite). It is designed to implement an offline-first diagnostic rules engine, local security auditing aligned with HIPAA/DISHA principles, native biometric locks, and a connection to Google's Gemini 2.5 Flash API.

---

## 🏛️ Architecture & Source Code Structure

The application is structured according to Android MVVM best practices:

```
android/app/src/main/java/com/example/
├── MainActivity.kt        # ComponentActivity launcher initializing Compose & Biometrics
│
├── data/                  # Data Layer (Database schemas, APIs, & rules engine)
│   ├── AppDatabase.kt     # RoomDatabase builder, migrations, and DAO declarations
│   ├── Entities.kt        # Data classes representing SQLite tables
│   ├── Repository.kt      # PsyPyrusRepository wrapping Room DAOs and providing Flow streams
│   ├── DsmDatabase.kt     # 13-disorder structured clinical database
│   ├── DiagnosticEngine.kt# Offline dynamic rule-based evaluator for 13 psychiatric conditions
│   ├── GeminiService.kt   # OkHttp client for Gemini API content generation
│   └── ClinicalTrialsService.kt # Retrofit/OkHttp client for ClinicalTrials.gov studies
│
└── ui/                    # UI / Presentation Layer
    ├── PsyPyrusUi.kt      # Composables (Screens, dialogs, widgets, biometric lock)
    ├── PsyPyrusViewModel.kt# ViewModel exposing Flow states and orchestrating DB transactions
    └── theme/             # Custom color schemes, typography, and styling variables
```

---

## 🗄️ Room Database Entities & DAOs

The local SQLite database (`psypyrus_ai_database`) exposes the following tables defined in [Entities.kt](./app/src/main/java/com/example/data/Entities.kt):

*   **`patients`:** Stores clinician client charts (name, email, age, gender, diagnostic specialty, and risk flags).
*   **`appointments`:** Logged scheduling data, teletherapy session codes (`PSY-PYR-xxx`), and fees.
*   **`clinical_notes`:** Patient SOAP notes, MSE narratives, and treatment plans with crisis flags.
*   **`assessments`:** Historical self-report score logs (PHQ-9, GAD-7, HiTOP-DSM-5) mapping recovery progress.
*   **`mood_logs`:** Mood indices (1-10), gratitude statements, and deep breathing durations.
*   **`security_audit_logs`:** HIPAA/DISHA audit trails tracking practitioner logins, data reads, and AI calls.
*   **`homework_tasks`:** Patient tasks assigned by practitioners, tracked via completion status checkmarks.
*   **`gamification_profiles`:** XP levels, MindCoins, and unlocked theme states.

---

## 🧠 Dynamic Diagnostic Engine Rules

The [DiagnosticEngine.kt](./app/src/main/java/com/example/data/DiagnosticEngine.kt) class implements dynamic rules-based checks matching the **13 DSM-5-TR disorders** in the database:
*   Matches checked symptoms against disorder keywords.
*   Evaluates minimum criteria thresholds and core symptom dependencies (e.g. depressed mood or anhedonia for MDD).
*   Verifies duration limits (e.g. 2 weeks for MDD, 6 months for GAD/SAD/Phobia).
*   Checks exclusion parameters (no physiological substance or medical condition attributions).

---

## 🛠️ Local Compiling & Build Configuration

### Prerequisites
*   [Android Studio (Koala or newer)](https://developer.android.com/studio)
*   Android SDK 36 (targetSdk)
*   Java JDK 17+

### 1. Configure the API Key
Create a file named `.env` in the `/android` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
The [app/build.gradle.kts](./app/build.gradle.kts) uses the `Secrets Gradle Plugin` to inject this variable into the Android compilation workspace as `BuildConfig.GEMINI_API_KEY`. 

*If no key is configured, the application automatically redirects all AI prompts to an internal mock database of typical clinical outputs (such as structured SOAP tables, MSE paragraphs, and SMART targets) to ensure full app testing in offline dev sandboxes.*

### 2. Configure the Cloud Sync Server
The Android app is designed to sync its local Room database to the **Papyrus Sync Service**. In your local `.env` configuration file, configure:
*   `SYNC_API_URL`: The URL of the target synchronization backend (default local test endpoint: `http://localhost:3001` or your emulator host mapping like `http://10.0.2.2:3001`).

Refer to the [Ecosystem Deployment Guide](../DEPLOYMENT.md) for more details on environment variables and backend setup.

### 3. Signing Setup
In the `buildTypes` block of the Gradle script:
*   **Debug builds** utilize the pre-packaged `debug.keystore` located in the root of the Android project module.
*   **Release builds** look up system environment variables (`KEYSTORE_PATH`, `STORE_PASSWORD`, and `KEY_PASSWORD`) to sign the production package.

### 4. Run the App
Connect a device or launch an Android Emulator, then click **Run** (`Shift + F10`) inside Android Studio.

---

## 🧪 Testing

Run unit and integration tests using Gradle in the `/android` folder:
```bash
./gradlew test
```

---

## 🚦 Development Status, Mocks, & Milestones

The Android client is currently a secondary target in an early development phase. Key clinical and integration modules are represented by stubs and mocks:

### 1. What is Implemented:
- **Local Room Database Schemas**: Table entities for patients, mood logs, audit logs, and gamification profiles.
- **Biometric Security Integration**: Real native `BiometricPrompt` framework implementation verifying local fingerprint/face credentials.
- **Diagnostic Rules Engine Structure**: Evaluates symptom checks against core DSM criteria locally.
- **Gemini REST Connection API**: Functional Retrofit/OkHttp request wrapper targeting `gemini-2.5-flash`.

### 2. What is Mocked / Simulated:
- **EHR Genogram Canvas**: Stub screen (non-interactive image mockup).
- **Gamification Rewards MindShop**: Mocked storefront purchase buttons.
- **ABDM Sync & Telehealth**: Telehealth screen and ABHA sandboxes are UI layouts with static simulated response states.

### 3. Next Milestones:
- Complete the vector genogram drawing canvas.
- Synchronize Room DB entities with the WebSocket sync service.
