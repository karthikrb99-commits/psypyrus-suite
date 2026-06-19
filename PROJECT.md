# Project: PsyPyrus Multi-Platform Integration, Fixes & Verification

## Architecture
PsyPyrus is a multi-platform app containing:
- **Web**: React companion web app with Vitest tests, located in `/web`.
- **Android**: Native Android application written in Kotlin, using Jetpack Compose, located in `/android`.
- **Desktop**: Electron companion app, located in `/desktop`.
- **iOS/macOS**: Native Apple code, located in `/ios` and `/macos`.
- **Sync Service**: Shared backend service, located in `/sync-service`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| 1 | Exploration & Diagnostic Analysis | Analyze directories, files, and syntax errors in Android | None | DONE |
| 2 | Android Code Debugging & Fixing | Fix `PsyPyrusUi.kt` compilation errors and verify compilation | M1 | DONE |
| 3 | Multi-Platform Build & Test Verification | Run builds and test suites across Web, Desktop, iOS/macOS | M1, M2 | IN_PROGRESS |
| 4 | Git Committing & Pushing | Logically group changes in conventional commits and push | M1, M2, M3 | PLANNED |
| 5 | Validation & Sentinel Notification | Run forensic audit and notify Sentinel (ID: cae8610d-aad7-495f-9814-b155691cfa54) | M4 | PLANNED |

## Code Layout
- `/web` - Vite + React web application.
- `/android` - Android app workspace.
- `/desktop` - Electron app workspace.
- `/ios` & `/macos` - Swift codebases and scripts.
- `/sync-service` - Backend coordination service.

## Interface Contracts
- Shared models and communication formats defined in each platform package (e.g. Kotlin data classes matching JSON formats from sync-service, Swift entities mirroring target structures).
