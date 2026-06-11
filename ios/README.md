# 🍎 PsyPyrus iOS Client — Developer Guide

This directory contains the native iOS client for the **PsyPyrus Suite**, compiled using **SwiftUI**, **Combine**, and native SQLite database connections. It implements an offline-first diagnostic rules engine matching 13 DSM-5 disorders, local security auditing, native biometric locks (Face ID / Touch ID), and a connection to Google's Gemini 3.5 API.

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
│   └── SecurityLogger.swift # Local HIPAA audit logger
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
*   The iOS engine references the central [DsmDatabase.swift](file:///ios/PsyPyrus/Services/DsmDatabase.swift), containing structured criteria lists, comorbidity weights, and severity specifications for 13 disorders.
*   [DiagnosticEngine.swift](file:///ios/PsyPyrus/Services/DiagnosticEngine.swift) runs dynamic evaluation loops matching symptoms against thresholds, duration limits, and clinical exclusions.

---

## 🛠️ Project Setup & Building

To generate the Xcode project workspace, run the python script in the terminal:

```bash
cd ios
python generate_xcodeproj.py
```

1. Open the generated `PsyPyrus.xcodeproj` in **Xcode**.
2. Add your **Gemini API Key** in the Xcode settings panel sheet (accessed via the gear icon in the navigation bar).
3. Select an iOS Simulator or connected physical device target.
4. Click **Run** (`Cmd + R`) to compile and launch.
