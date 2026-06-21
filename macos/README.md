# 🍏 PsyPyrus macOS Client — Experimental Stub (Planned Platform)

This directory contains the native macOS target for the **PsyPyrus Suite**. Like the iOS client, this platform is currently an **experimental stub** — the Xcode project scaffolding exists but full clinical UI workflows are pending.

To maximize code reuse, the macOS client is designed to dynamically import and reference the shared source files from the `/ios` client module once that platform matures.

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
3. Configure the **Gemini 2.5 Flash API Key** in the settings panel sheet.
4. Configure the **Cloud Sync Server URL** pointing to the **Papyrus Sync Service** (default local test endpoint: `http://localhost:3001`) inside your build environment configurations.
5. Click **Run** (`Cmd + R`) to compile and launch.

For comprehensive backend configuration, API details, and hosting instructions, refer to the [Ecosystem Deployment Guide](../DEPLOYMENT.md).

---

## 🚦 Development Status & Milestones

> [!NOTE]
> This platform is at the earliest experimental stage. iOS scaffolding must reach feature completeness first, as this client shares its source files.

### 1. Current State:
- Xcode project generation scripts are functional.
- Shares all Swift source files with the iOS client via file references.

### 2. Next Milestones:
- Finalize iOS client screens first.
- Validate macOS Catalyst or native SwiftUI compatibility for larger screen layouts.
- Bundle and test `.app` binary distribution.
