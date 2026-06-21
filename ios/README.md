# 🍎 PsyPyrus iOS Client — Experimental Stub (Planned Platform)

This directory contains the native iOS client for the **PsyPyrus Suite**. This platform is currently an **experimental stub** — the source structure and service wrappers have been scaffolded, but full UI workflows and data connectivity are pending. All feature development for new clinical workflows should be landed on the [Web React client](../web/README.md) first.

When implementation-ready, this client will be compiled using **SwiftUI**, **Combine**, and native SQLite database connections, targeting an offline-first diagnostic engine matching 13 DSM-5 disorders, native biometric locks (Face ID / Touch ID), and a connection to Google's Gemini 2.5 Flash API.

---

## 🏛️ Architecture & Source Code Structure

The application is structured according to Apple MVVM best practices:

```
ios/PsyPyrus/
├── PsyPyrusApp.swift      # Main Application entry point
│
├── Models/                # Data Layer (Swift entities, decodable models)
│   └── Entities.swift     # Data classes representing SQLite tables
│
├── Services/              # Backend services
│   ├── DsmDatabase.swift  # 13-disorder structured clinical database
│   ├── DiagnosticEngine.swift # Offline dynamic rules evaluator
│   ├── GeminiService.swift # REST client for Gemini API notes compilation
│   ├── ClinicalTrialsService.swift # Client for ClinicalTrials.gov search
│   └── SecurityLogger.swift # Local HIPAA/DISHA audit logger
│
├── ViewModels/            # Presentation Layer
│   └── PsyPyrusViewModel.swift # Published state provider and business logic
│
└── Views/                 # UI components
    ├── MainLayoutView.swift # Shell view layout (bottom tabs, side panels)
    ├── BiometricLockView.swift # FaceID validation and PIN entry gate
    ├── Professional/      # Clinician workspace views (SOAP, MSE, Diagnostics)
    ├── Patient/           # Patient lounge views (Wellness, MindShop)
    └── Shared/            # Shared dashboards (Marketplace, Teletherapy, HIPAA Shield)
```

---

## 🔒 Native Biometrics & LocalAuthentication
*   The client implements biometric locks using Apple's native `LocalAuthentication` framework.
*   Upon launch, `LAContext` triggers the Face ID or Touch ID dialog.
*   Successful authentication decrypts the local state container. If validation fails, users are prompted to enter their 4-digit security PIN.

---

## 🧠 Diagnostic Engine & DsmDatabase
*   The iOS engine references the central [DsmDatabase.swift](./PsyPyrus/Services/DsmDatabase.swift), containing structured criteria lists, comorbidity weights, and severity specifications for 13 disorders.
*   [DiagnosticEngine.swift](./PsyPyrus/Services/DiagnosticEngine.swift) runs dynamic evaluation loops matching symptoms against thresholds, duration limits, and clinical exclusions.

---

## 🛠️ Project Setup & Building

To generate the Xcode project workspace, run the python script in the terminal:

```bash
cd ios
python generate_xcodeproj.py
```

1. Open the generated `PsyPyrus.xcodeproj` in **Xcode**.
2. Add your **Gemini 2.5 Flash API Key** in the Xcode settings panel sheet (accessed via the gear icon in the navigation bar).
3. Configure the **Cloud Sync Server URL** pointing to the **Papyrus Sync Service** (default local test endpoint: `http://localhost:3001`) inside your build environment configurations.
4. Select an iOS Simulator or connected physical device target.
5. Click **Run** (`Cmd + R`) to compile and launch.

For comprehensive backend configuration, API details, and hosting instructions, refer to the [Ecosystem Deployment Guide](../DEPLOYMENT.md).

---

## 🚦 Development Status, Mocks, & Milestones

> [!NOTE]
> This platform is an experimental stub. Core feature workflows are being built into the Web React reference implementation first.

### 1. What is Scaffolded:
- Swift service layer structure (`GeminiService.swift`, `DiagnosticEngine.swift`, `DsmDatabase.swift`) and ViewModel architecture.
- SwiftUI view file structure (`MainLayoutView.swift`, `BiometricLockView.swift`, Professional/Patient directories).
- Data model entities (`Entities.swift`) mirroring the Room DB schemas from the Android client.

### 2. What is Not Yet Implemented:
- Full interactive clinical UI screens (Genogram Canvas, Diagnostics Graph, HiTOP/RDoC explorers).
- Live REST sync with the sync-service backend.
- Fully tested real biometric `LocalAuthentication` flows (requires device testing).

### 3. Next Milestones:
- Complete the SOAP Notes Copilot and Genogram Canvas views.
- Synchronize persistent state with the cross-platform sync service.
- Submit to TestFlight for early clinical beta testing.
