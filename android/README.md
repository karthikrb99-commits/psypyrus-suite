# 📱 PsyPyrus Android Client — Developer Guide

This directory contains the native Android client for the **PsyPyrus Suite**, built using **Kotlin**, **Jetpack Compose** (Material 3), and **Room ORM** (SQLite). It implements an offline-first diagnostic rules engine, local security auditing for HIPAA compliance, and a connection to Google's Gemini 3.5 API.

---

## 🏛️ Architecture & Source Code Structure

The application is structured according to Android MVVM best practices:

```
android/app/src/main/java/com/example/
├── MainActivity.kt        # ComponentActivity launcher initializing Compose setContent
│
├── data/                  # Data Layer (Database schemas, APIs, & rules engine)
│   ├── AppDatabase.kt     # RoomDatabase builder, migrations, and DAO declarations
│   ├── Entities.kt        # Data classes representing SQLite tables
│   ├── Repository.kt      # PsyPyrusRepository wrapping Room DAOs and providing Flow streams
│   ├── DiagnosticEngine.kt# Offline rule-based evaluator for MDD, GAD, & Mock disorders
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

The local SQLite database (`psypyrus_ai_database`) exposes the following tables defined in [Entities.kt](file:///android/app/src/main/java/com/example/data/Entities.kt):

*   **`patients`:** Stores clinician client charts (name, email, age, gender, diagnostic specialty, and severe/moderate risk flags).
*   **`appointments`:** Logged scheduling data, teletherapy session codes (`PSY-PYR-xxx`), and fees.
*   **`clinical_notes`:** Patient SOAP notes, MSE narratives, and treatment plans with crisis flag indicators.
*   **`assessments`:** Historical self-report score logs (PHQ-9, GAD-7) mapping recovery progress.
*   **`mood_logs`:** Mood indices (1-10), gratitude statements, and deep breathing durations.
*   **`security_audit_logs`:** HIPAA audit trails tracking practitioner logins, data reads, and AI calls.
*   **`homework_tasks`:** Patient tasks assigned by practitioners, tracked via completion status checkmarks.

---

## 🧠 Local Diagnostic Engine Rules

The [DiagnosticEngine.kt](file:///android/app/src/main/java/com/example/data/DiagnosticEngine.kt) class implements direct rules-based checks matching the DSM-5-TR:
*   **Major Depressive Disorder (MDD):** Verifies the presence of $\ge 5$ distinct symptoms for a duration of $\ge 2$ weeks. Requires at least one core symptom (depressed mood or loss of interest/pleasure). Excludes cases where substance abuse, manic/hypomanic history, or general medical conditions are listed.
*   **Generalized Anxiety Disorder (GAD):** Verifies excessive anxiety present for a duration of $\ge 26$ weeks (6 months) with $\ge 3$ somatic anxiety indicators (restlessness, fatigue, muscle tension, sleep disturbance, irritability, concentration difficulty).

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
The [app/build.gradle.kts](file:///android/app/build.gradle.kts) uses the `Secrets Gradle Plugin` to inject this variable into the Android compilation workspace as `BuildConfig.GEMINI_API_KEY`. 

*If no key is configured, the application automatically redirects all AI prompts to an internal mock database of typical clinical outputs (such as structured SOAP tables, MSE paragraphs, and SMART targets) to ensure full app testing in offline dev sandboxes.*

### 2. Signing Setup
In the `buildTypes` block of the Gradle script:
*   **Debug builds** utilize the pre-packaged `debug.keystore` located in the root of the Android project module.
*   **Release builds** look up system environment variables (`KEYSTORE_PATH`, `STORE_PASSWORD`, and `KEY_PASSWORD`) to sign the production package.

### 3. Run the App
Connect a device or launch an Android Emulator, then click **Run** (`Shift + F10`) inside Android Studio.

---

## 🧪 Testing

The `/android/app/src/test` directory contains unit and integration tests using:
*   **Robolectric:** For executing Android framework APIs locally on the JVM.
*   **Roborazzi:** For automated screenshot rendering and screenshot comparison testing.
*   **JUnit 4:** For evaluating diagnostic engine calculations.

Run tests using Gradle in the `/android` folder:
```bash
./gradlew test
```
