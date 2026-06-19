# Document 02 — TRD (Technical Requirements Document)

This document establishes the unified technical architecture, library dependencies, platform wrappers, security layers, and API models for the **PsyPyrus Suite** operating as part of the **Papyrus Ecosystem** across all platforms.

---

## 1. Client Architectures

### 1.1 Web Client
*   **Framework**: React (ES6, Vite, JSX) using a single-page app layout.
*   **Styling**: Tailwind CSS (with predefined design system tokens).
*   **Target Compilation**: Static bundle optimized for Vercel, Netlify, or AWS Amplify.

### 1.2 Android Native Client
*   **Language & UI**: Kotlin, Jetpack Compose, Material 3 UI widgets.
*   **Target SDK**: API Level 36 (Android 16+), compiled using JDK 17+.
*   **Local Storage**: SQLite powered by **Room ORM** featuring Destructive Migration fallbacks.
*   **Biometrics**: Native Android `androidx.biometric:biometric` library using `BiometricPrompt`.

### 1.3 iOS & macOS Native Client
*   **Language & UI**: Swift, SwiftUI views.
*   **Target OS**: iOS 17+ / macOS 14+ (Sonoma).
*   **Code Sharing**: macOS client targets reference and compile the shared iOS SwiftUI views via Python structure generation script.
*   **Local Storage**: SQLite storage.
*   **Biometrics**: Native iOS Apple `LocalAuthentication` framework (Face ID / Touch ID).

### 1.4 Desktop Wrapper Client
*   **Runtime**: Electron wrapper packaging the compiled production bundle of the React Web companion.
*   **Native Hooks**: Secure IPC Preload bridge exposing system tray configurations, local file writers, and notifications.

---

## 2. Shared Cloud & API Interfaces

All clients share standard network gateways to perform remote AI analysis, diagnostic classifications, clinical trial queries, and database sync within the Papyrus network.

```
+-------------------------------------------------------------+
|                     PsyPyrus Clients                        |
|   (React Web  |  Android Compose  |  iOS/macOS SwiftUI)     |
|             (Operating on top of Papyrus Ecosystem)         |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
  +------------------+                  +------------------+
  |  External APIs   |                  |Papyrus Sync Serv.|
  |  (Gemini 2.5,    |                  | (Node.js/Express |
  |   WHO ICDAPI,    |                  | Firebase Auth SDK|
  |   ClinicalTrials)|                  |    Prisma ORM)   |
  +------------------+                  +---------+--------+
                                                  |
                                                  v
                                        +------------------+
                                        |    PostgreSQL    |
                                        |     Database     |
                                        +------------------+
```

### 2.1 Google Gemini AI API
*   **Model**: `gemini-2.5-flash`
*   **Protocol**: REST HTTPS POST with bearer token.
*   **Integration**: Mobile clients use native OkHttp/Retrofit HTTP calls sending JSON payloads; Web/Electron uses browser Fetch requests.
*   **De-identification**: Client-side filters anonymize patient names and DOBs before sending payloads to preserve privacy by design.

### 2.2 WHO ICDAPI Registry
*   **Endpoint**: `https://id.who.int/icd/release/11`
*   **Protocol**: OAuth2 Client Credentials Flow (Client ID & Client Secret) fetching a temporary Bearer token (cached for 3600 seconds).
*   **Offline Fallback**: Standardized local lookup dictionary supporting 23 clinical classes of psychiatric conditions.

### 2.3 Cloud Sync Gateway API
The synchronization gateway is implemented by the **Papyrus Sync Service** (running on port `3001` in local dev). It is a Node.js/Express-based microservice that replicates and syncs local client records (Room, IndexedDB, SQLite) to PostgreSQL.
*   `POST /sync`: Main synchronization endpoint that accepts delta payloads from the client. Resolves conflicts server-side using a Last-Write-Wins (LWW) strategy and persists records via Prisma ORM.
*   `GET/POST/PATCH/DELETE /patients`: Full RESTful CRUD endpoints for patient records with ownership validation enforced via Firebase Auth.
*   `GET /sync/events`: Returns a structured audit trail of all synchronization events (including delta payloads and conflict results).
*   `GET /health`: Returns service health status and API version (`{ "status": "ok", "service": "papyrus-sync-service", "version": "1.0.0" }`).
*   **Authentication**: Enforced via Firebase Admin SDK middleware (`Authorization: Bearer <firebase-id-token>`), featuring a development bypass mode.

---

## 3. Library & Dependencies Manifest

### Web & Desktop (Electron)
*   `vite` & `react` & `react-dom`
*   `lucide-react` (Unified vector icons)
*   `chart.js` & `react-chartjs-2` (Clinical trend analysis charts)
*   `electron` & `electron-builder`

### Android App
*   `androidx.compose.ui` & `androidx.compose.material3`
*   `androidx.room:room-runtime` & `androidx.room:room-ktx`
*   `androidx.biometric:biometric` (Biometric Validation)
*   `okhttp3` & `retrofit2` & `gson`

### iOS & macOS App
*   `SwiftUI` & `Combine`
*   `LocalAuthentication` (Face ID / Touch ID)

---

## 4. Security & Compliance Specifications

1. **At-Rest Encryption**:
   *   Android: Room DB is encrypted using SQLCipher if active.
   *   iOS: Keychain Services encrypt patient session records and API keys.
   *   Web/Electron: LocalStorage/IndexedDB state variables are stored inside encrypted local containers.
2. **In-Transit Encryption**: All network traffic runs over TLS 1.3 (HTTPS/WSS).
3. **Audit Log Database**: Persistent, read-only local structures writing every encounter view, diagnostic engine invocation, and security toggle.
4. **Biometric Validation**: Successful FaceID/Fingerprint validation is mandatory on application launch or when unlocking from an idle timeout state.
5. **Global Compliance Posture**:
   *   **HIPAA & GDPR-Aware**: The codebase implements security-aware principles (TLS 1.3, biometric locks, audit logging, de-identification filters) that align with HIPAA and GDPR guidelines. Formal certification requires an independent audit, signed Business Associate Agreements, and a covered hosting infrastructure — none of which this repository provides out-of-the-box.
   *   **DISHA & ABDM**: Supports India's Digital Information Security in Healthcare Act (DISHA) and Ayushman Bharat Digital Mission (ABDM) guidelines, incorporating SNOMED CT clinical terms, LOINC codes, and Aadhaar-verified ABHA health cards.
