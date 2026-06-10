# 🍎 PsyPyrus iOS Client — SwiftUI Developer Guide

This directory contains the native iOS client for the **PsyPyrus Suite**, built using **SwiftUI**, **Combine**, and native Apple networking utilities. It mirrors the Material Design layout of the Android and Web applications in a sleek, native Apple human-interface aesthetic.

---

## 🏛️ Xcode Project & Source Directory structure

The SwiftUI source folder `/ios/PsyPyrus` is organized as follows:

```
ios/PsyPyrus/
├── PsyPyrusApp.swift        # App entry point initializing the main window group
│
├── Models/
│   └── Entities.swift       # Struct models conforming to Codable & Identifiable
│
├── ViewModels/
│   └── PsyPyrusViewModel.swift # Coordinates app state, active tabs, CRUD, and remote endpoints
│
├── Services/
│   ├── DiagnosticEngine.swift  # Offline DSM-5-TR rules evaluator written in Swift
│   ├── GeminiService.swift     # Handles URLSession requests to the Google Gemini API
│   ├── ClinicalTrialsService.swift # URLSession connector for ClinicalTrials.gov REST API v2
│   └── SecurityLogger.swift    # Registers in-memory audit logs matching HIPAA requirements
│
└── Views/
    ├── ContentView.swift       # Routing gatekeeper switching between Biometric lock & Workspace
    ├── BiometricLockView.swift # Simulated FaceID / passcode authorization gateway screen
    ├── MainLayoutView.swift    # Visual shell with top bar, drawer panel sheet, & tab bar
    ├── CommonComponents.swift  # Reusable premium cards, pill views, and text inputs
    │
    ├── Professional/           # Clinician workspace panel views
    │   ├── ClinicianDashboardView.swift # EHR summary metrics & schedules list
    │   ├── SoapNoteView.swift           # Dictation SOAP note transcriber
    │   ├── MentalStatusExamView.swift   # Cognitive & behavioral status checklists
    │   └── DiagnosticsSuiteView.swift   # Rule-based calculations & LLM differentials
    │
    ├── Patient/                # Patient workspace panel views
    │   ├── PatientDashboardView.swift   # Quick telehealth link & homework lists
    │   └── WellnessLoungeView.swift     # Breathing timer, mood logs, and gratitude lists
    │
    └── Shared/                 # Multi-role shared panel views
        ├── InteractiveAssessmentsView.swift # Scale questionnaires & scores list
        ├── TeletherapyView.swift            # virtual teletherapy room
        ├── MarketplaceView.swift            # Plugins browser
        └── HipaSecurityShieldView.swift     # HIPAA audit trail logs explorer
```

---

## ⚙️ Xcode Project Generator Script (`generate_xcodeproj.py`)

Xcode project structures (`.xcodeproj`) are XML and property-list directories that are notoriously prone to git merge conflicts. To prevent developer workflow interruptions, we use a Python script to build the Xcode project structure dynamically:

*   The [generate_xcodeproj.py](file:///ios/generate_xcodeproj.py) script uses a node-construction logic to parse the folder structure and write out a clean, compile-ready `PsyPyrus.xcodeproj`.
*   Run the script inside `/ios` whenever you add new files to the codebase:
    ```bash
    python generate_xcodeproj.py
    ```

---

## 🛠️ Code Sharing with macOS
The native macOS client (located in `/macos`) does not duplicate the SwiftUI source files. Instead, it utilizes relative folder references (`../ios/PsyPyrus/...`) in its generated Xcode project. This ensures that any modification to the core Swift files immediately updates both platforms.

---

## 🚀 Building & Running the Project

### Prerequisites
*   A Apple macOS workstation (required to run Xcode).
*   **Xcode (v15 or newer)**.
*   Python 3 (to generate the project structure).

### 1. Build the Xcode Workspace
Open terminal inside the `/ios` folder and run the generator:
```bash
python generate_xcodeproj.py
```
This generates the compile configuration folder `PsyPyrus.xcodeproj`.

### 2. Open and Run in Xcode
1. Double-click `PsyPyrus.xcodeproj` to open it in Xcode.
2. Select the **PsyPyrus** target and choose an iOS Simulator (e.g. iPhone 15 Pro) or a connected device as your destination.
3. Configure the **Gemini API Key** by opening the Settings panel drawer (gear icon in the app navigation bar) inside the app simulator. (If left blank, the client defaults to pre-seeded mock outputs).
4. Run the project (`Cmd + R`).
