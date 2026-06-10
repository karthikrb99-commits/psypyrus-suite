# 🍎 PsyPyrus Native macOS Client

This folder contains the native macOS desktop client configuration for the **PsyPyrus Suite**, built using native **SwiftUI**.

It mirrors the high-fidelity native iOS client and shares the exact same SwiftUI Views, Models, ViewModels, and Services located in the `/ios` folder. By using file reference links, this architecture prevents code duplication and maintains a single source of truth for Apple platforms.

---

## 🏛️ Architecture & Code Sharing

The native macOS app references the core logic and visual interface directly from the `ios/` folder:

```
psypyrus/
├── ios/
│   └── PsyPyrus/             # Core Swift codebase (Views, ViewModels, Models, Services)
└── macos/
    ├── generate_xcodeproj.py # Python script to construct the macOS project structure
    └── PsyPyrus.xcodeproj/   # [GENERATED] Compiled macOS Xcode Project configuration
```

By referencing the source files using relative paths (`../ios/PsyPyrus/...`), any enhancement made to the models, viewmodels, or views will instantly reflect in both the iOS and macOS native applications.

---

## 🛠️ Project Bootstrapping

Since Xcode projects are XML/plist structures that can be cumbersome to manage via Git in multi-developer environments, we utilize a Python generator script to assemble the Xcode project dynamically.

### 1. Generate the Xcode Project
Run the generator script from the `macos/` directory:
```bash
python generate_xcodeproj.py
```

This will create `PsyPyrus.xcodeproj` inside the `macos/` folder.

### 2. Open and Build in Xcode
1. Open the generated `PsyPyrus.xcodeproj` using **Xcode** on a macOS system.
2. Select the **PsyPyrus** target.
3. Ensure the active destination scheme is set to **My Mac** (either Mac Designed for iPad or native macOS App target depending on your compilation path. The script is configured for native macOS build target).
4. Press `Cmd + R` to run and compile the application.

---

## 🔒 Security & HIPAA Features

The macOS client features the same security integrations as the iOS client:
* **Simulated Biometric Verification:** Instantly locks and unlocks the local clinical session using face or passcode simulation.
* **Cryptographic Local Auditing:** Operations (such as logins, role switching, note syntheses, and diagnostics) automatically write secure audit log events.
