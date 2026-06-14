# Document 03 — App Flow (Navigation & User Journey Map)

This document maps the standardized application screens, navigation triggers, and interactive user journeys across all clients in the **PsyPyrus Suite** operating within the **Papyrus Ecosystem**.

---

## 1. Unified Screens & Routes Map

Regardless of client runtime (React SPA routes or native mobile screen states), the system implements a standardized set of primary views:

| Action / View | Web Route | Android Screen | iOS View |
| :--- | :--- | :--- | :--- |
| **Landing Hub** | `/` | `LandingScreen` | `LandingView` |
| **Biometric Lock** | `/login` | `BiometricLockScreen` | `BiometricLockView` |
| **Clinician Dashboard** | `/clinician` | `DashboardScreen` | `ClinicianDashboardView` |
| **Patient Directory** | `/clinician/patient/:id`| `PatientDetailScreen` | `PatientDetailView` |
| **Intake / Genogram** | `/clinician/intake` | `IntakeFormsScreen` | `IntakeFormsView` |
| **Digital MSE checklist**| `/clinician/mse` | `DigitalMseScreen` | `MentalStatusExamView` |
| **Diagnostics Suite** | `/clinician/diagnostics`| `DiagnosticsScreen` | `DiagnosticsSuiteView` |
| **HiTOP Explorer** | `/clinician/hitop` | `HitopExplorerScreen` | `HitopMatrixExplorerView` |
| **RDoC Explorer** | `/clinician/rdoc` | `RdocExplorerScreen` | `RdocMatrixExplorerView` |
| **SOAP Copilot** | `/clinician/soap` | `AiCopilotScreen` | `SoapNoteView` |
| **Treatment Planner** | `/clinician/planner` | `TreatmentPlannerScreen`| `TreatmentPlannerView` |
| **Patient Dashboard** | `/patient` | `PatientDashboardScreen`| `PatientDashboardView` |
| **Wellness Lounge** | `/patient/lounge` | `WellnessScreen` | `WellnessLoungeView` |
| **MindShop Storefront** | `/patient/mindshop` | `MindShopScreen` | `MindShopView` |
| **Telehealth Session** | `/telehealth` | `TeletherapyScreen` | `TeletherapyView` |
| **Marketplace / Plugins**| `/marketplace` | `MarketplaceScreen` | `MarketplaceView` |
| **Security & Compliance Logs** | `/security` | `SecurityScreen` | `HipaSecurityShieldView` |

---

## 2. Universal Navigation Patterns

1. **Sidebar Navigation (Web/Desktop)**: Collapsible left-hand command drawer providing immediate access to clinician modules, security/compliance logs, and theme settings.
2. **Bottom Tab Bar (Mobile Android/iOS)**: Persistent tab bar containing 4 slots:
   *   Clinician Mode: `Dashboard`, `Diagnostics`, `SOAP Copilot`, `Settings`
   *   Patient Mode: `Home`, `Lounge`, `MindShop`, `Security`
3. **Floating Command Palette**: Triggered globally via keyboard binding (`Ctrl + K` or `Cmd + K`) or navigation header bar. Allows searching patients, switching screens, or configuring API parameters.

---

## 3. Core User Journeys

```
Journey 1 (Clinician):
Enter Biometrics -> Clinician Dashboard -> Open Patient Intake -> Draw Family Genogram
    -> Complete MSE checklist -> Run 13-Disorder Diagnostic Engine -> View Ontology Graph
    -> Call Gemini API SOAP Note Compiler -> Save EHR file -> Sync to Cloud Database
    -> Export openEHR Archetypes / ABDM Consent Records (Integration Hub)

Journey 2 (Patient):
Enter Biometrics -> Patient Dashboard -> Check Daily Quests -> Open Wellness Lounge
    -> Log Mood & Gratitude -> Complete Guided Breathing -> Earn XP & MindCoins
    -> Open MindShop -> Buy CRT Theme / Lisa Companion -> Skins update client CSS/SwiftUI theme
```

### 3.1 Clinician Intake & Diagnosis Journey
1. The practitioner launches the app and touches the fingerprint sensor / starts FaceID scan.
2. Upon successful authentication, they access the Clinician Dashboard.
3. They select an active patient or click "Add Patient" inside the Command Palette.
4. On the Intake panel, they fill out demographics, verbatim complaints, somatic symptoms, and pre-morbid parameters.
5. They use the **Genogram Drawing Canvas** to draw familial relationships and save the sketch.
6. The clinician progresses to the **Digital MSE** tab, checking options for speech, motor behavior, mood, thought, and cognition.
7. Under the **Diagnostics Suite**, they check matching symptom profiles. The local engine evaluates all 13 conditions, generating candidate diagnoses and comorbidity weights on the SVG ontology graph.
8. They query WHO ICD-11 fallback parameters or retrieve tokens via official APIs.
9. They generate the SOAP notes using Gemini 3.5, formulate treatment plans, check compliance with telemedicine guidelines, and save the patient's record.
10. If practicing in India, they utilize the ABDM Sandbox to verify Aadhaar and link the patient's ABHA Health Card, or export openEHR-compliant FHIR documents.

### 3.2 Patient Wellness & Gamification Rewards Journey
1. The patient unlocks the app via biometric scan.
2. The Patient Dashboard displays daily CBT quests (e.g., "Log mood", "Complete 5-minute breathing session").
3. They route to the **Wellness Lounge** and record their mood on the sliding scale, writing a quick gratitude entry.
4. They launch the breathing widget, following the circular scaling animation for deep inhales/exhales.
5. Upon completion, a toast triggers showing "+20 XP and +15 MindCoins".
6. The patient routes to the **MindShop** and spends coins to purchase the "Retro CRT Skin".
7. The unlocked skin instantly updates the global style variables, rendering terminal scanlines.

---

## 4. Operational Fallbacks & Errors

*   **Offline Mode**: Warning banner indicates "Local Database Active. Cloud Sync Deferred." Local calculations (13-disorder engine, mock AI engines, 23-class ICD dictionary) run without interruption to support low-resource setups.
*   **Conflict Resolution**: If the Cloud Gateway detects a record mismatch, a popup shows local vs. cloud edit timestamps, allowing the practitioner to merge or overwrite.
*   **Biometrics Fail**: If native biometrics fail 3 times, the client falls back to requesting the 4-digit security PIN.
