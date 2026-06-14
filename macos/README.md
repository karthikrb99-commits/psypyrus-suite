# 🍏 PsyPyrus macOS Client — Developer Guide

This directory contains the native macOS target for the **PsyPyrus Suite**, running as part of the **Papyrus Open Mental Health Intelligence Ecosystem**. 

To maximize code reuse, the macOS client is compiled using **SwiftUI** and is designed to dynamically import and reference the shared source files from the `/ios` client module.

---

## 🏛️ Architecture & Shared Build Strategy

The macOS client is configured as a native Mac Catalyst (or native SwiftUI) workspace. Instead of duplicating views, models, and viewmodels, the Xcode project maps references to files located under the `/ios/PsyPyrus/` directory.

```
macos/
├── generate_xcodeproj.py # Python script to generate macOS Xcode project structure
├── PsyPyrus.xcodeproj/   # Generated macOS Xcode workspace
└── README.md             # This developer setup guide
```

*   **Shared Views**: `MainLayoutView.swift`, `BiometricLockView.swift`, and all views under `Professional/` and `Patient/` are shared.
*   **Shared Models & Services**: `Entities.swift`, `DsmDatabase.swift`, `DiagnosticEngine.swift`, and `GeminiService.swift` compile identically.

---

## 🛠️ Project Setup & Building

To generate the macOS project workspace, run the python script in the terminal:

```bash
cd macos
python generate_xcodeproj.py
```

1. Open the generated `PsyPyrus.xcodeproj` in **Xcode** on a macOS system.
2. Select **My Mac** as the destination target.
3. Configure the **Gemini API Key** in the settings panel sheet.
4. Click **Run** (`Cmd + R`) to compile and launch.
