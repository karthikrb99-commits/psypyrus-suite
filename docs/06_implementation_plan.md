# Document 06 — Implementation Plan (Step-by-Step Build Sequence)

This document maps the implementation sequence of the **PsyPyrus Suite** from setup to multi-platform deployment and database synchronization within the **Papyrus Ecosystem**.

---

## Milestone Build Sequence

```
+--------------------+      +--------------------+      +--------------------+
| Phase 1: Setup     | ---> | Phase 2: Database  | ---> | Phase 3: Auth      |
| Visual themes, CSS |      | Room, IndexedDB    |      | Biometrics & PINs  |
+--------------------+      +--------------------+      +--------------------+
                                                                   |
+--------------------+      +--------------------+      +----------v---------+
| Phase 6: AI Notes  | <--- | Phase 5: Engines   | <--- | Phase 4: Canvas    |
| SOAP compilation   |      | 13-Disorder search |      | Family Genogram    |
+--------------------+      +--------------------+      +--------------------+
         |
+--------v-----------+      +--------------------+      +--------------------+
| Phase 7: Rewards   | ---> | Phase 8: Builds    | ---> | Phase 9: Sync      |
| XP, MindCoins      |      | Electron, APK, DMG |      | Cloud REST Sync    |
+--------------------+      +--------------------+      +--------------------+
```

---

### Phase 1: Setup & CSS Configuration
*   **Tasks**:
    *   Initialize folders: React (`web/`), Android (`android/`), iOS/macOS (`ios/`, `macos/`), and Electron (`desktop/`).
    *   Define core dark Onyx themes, colors, and layout tokens inside `web/src/style.css`.
*   **Verification**: Static dev server boots via `npm run dev` in `/web`.

### Phase 2: Database Initialization & Seeding
*   **Tasks**:
    *   Set up Dexie IndexedDB schemas on Web/Electron, Room Database entities on Android, and SQLite/CoreData schemas on iOS.
    *   Seed clinical DSM-5-TR databases with the 13 disorders, symptoms, and comorbidities.
*   **Verification**: Checklists and dropdown selectors load diagnostic seed lists.

### Phase 3: Biometric Security & Session Locks
*   **Tasks**:
    *   Implement real biometric locks: `BiometricPrompt` on Android and Apple `LocalAuthentication` on iOS.
    *   Add PIN passcode fallbacks.
*   **Verification**: Lock screens intercept unauthenticated sessions.

### Phase 4: Drawing Canvas Control
*   **Tasks**:
    *   Create `CaseHistoryMSE.jsx` and intake screens.
    *   Add family genogram drawing canvas, supporting pencil draw, stroke weight adjustments, and base64 vector uploads.
*   **Verification**: Genograms save to local database profiles.

### Phase 5: Diagnostics & Ontology Graph
*   **Tasks**:
    *   Code rule-based evaluator matching clinical checklists against the 13 DSM-5 conditions.
    *   Render comorbidity connections on the SVG ontology graph.
    *   Add WHO ICD-11 search integration with cached token controls.
*   **Verification**: Checkboxes compute diagnoses and comorbidity weights in real time.

### Phase 6: AI Clinical Copilots
*   **Tasks**:
    *   Write Gemini 2.5 Flash prompt templates for SOAP notes, MSE narrative prose, and crisis screening.
*   **Verification**: Session transcripts compile into clinical summaries.

### Phase 7: Wellness Lounge & Gamification
*   **Tasks**:
    *   Build relaxation breathing player widget with circular scale controls.
    *   Assemble the MindShop store, awarding XP and MindCoins for CBT activities.
*   **Verification**: Unlocked themes (Retro CRT, Glassmorphic layouts) apply global visual transformations.

### Phase 8: Desktop Packaging & Mobile Compiles
*   **Tasks**:
    *   Package Electron static files into Windows `.exe` installers.
    *   Compile native APKs (SDK 36, Kotlin) and Xcode projects (`xcodebuild`).
*   **Verification**: Installers launch and load compliance logs.

### Phase 9: Cloud Gateway Synchronization
*   **Tasks**:
    *   Configure REST endpoints for batch uploading local database deltas.
    *   Implement Last-Write-Wins (LWW) conflict resolution schemas.
*   **Verification**: Device data syncs to the cloud server, maintaining data consistency.
