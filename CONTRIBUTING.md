# Contributing to PsyPyrus Suite

Thank you for your interest in contributing to the **PsyPyrus Suite**! We welcome improvements, bug fixes, and feature additions to this Mental Health Operating System. 

As a clinical decision support platform, we maintain high standards of code quality, security, and verification. Please read this document carefully before making changes.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to the project maintainers.

---

## Mono-Repo Architecture

PsyPyrus is managed as a unified monorepo. Here is the layout of the primary packages:

*   `/web` — React 19 web companion app (Vite, Tailwind CSS, Radix UI, Framer Motion, IndexedDB).
*   `/android` — Native Android client built with Jetpack Compose, Kotlin Coroutines, and Room.
*   `/ios` & `/macos` — SwiftUI targets sharing view logic, SQLite, and CoreData layers.
*   `/desktop` — Electron-based desktop shell wrapping the web companion app.

---

## Environment Setup & Development

### 1. Web Client (`/web`)
- **Prerequisites**: Node.js v18+, npm
- **Setup**:
  ```bash
  cd web
  npm install
  ```
- **Local Dev Server**:
  ```bash
  npm run dev
  ```
- **Testing**: We use **Vitest** and **jsdom** for unit and integration testing.
  ```bash
  npm run test
  ```
- **Vite Environment Variables**: Copy `web/.env.example` to `web/.env` and configure your Firebase keys to test cloud synchronization. If omitted, the app will run in mock/offline mode.

### 2. Android Client (`/android`)
- **Prerequisites**: Android Studio (Koala or later), JDK 17+
- **Setup**: Open the `/android` directory inside Android Studio and let Gradle sync.
- **Local API Configuration**: Create a `.env` file in `/android` with:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  ```
- **SDK Target**: Target SDK 36, Compile SDK 36.

### 3. iOS & macOS Clients (`/ios` and `/macos`)
- **Prerequisites**: Xcode 15+, macOS environment, Python 3
- **Xcode Project Generation**:
  Run `python generate_xcodeproj.py` in the `/ios` or `/macos` directory.
- **Run**: Open the generated `.xcodeproj` file in Xcode, select your simulator target, and build (`Cmd + R`).

### 4. Desktop Client (`/desktop`)
- **Prerequisites**: Run the web client first (`npm run dev` in `/web`).
- **Setup**:
  ```bash
  cd desktop
  npm install
  npm run dev
  ```

---

## Development Workflow & Code Style

1.  **Branching**: Create your feature branches off of the `main` branch.
    - Name branches as `feature/your-feature`, `bugfix/your-fix`, or `docs/your-changes`.
2.  **Linting & Formatting**: Follow code conventions for the respective languages:
    - **JS/React**: Follow standard ESLint rules.
    - **Kotlin**: Follow standard Kotlin style guides.
    - **Swift**: Follow SwiftUI best practices.
3.  **No Hardcoded Secrets**: Never commit private keys, passwords, or API credentials. Use environment variables (via `.env` or system environment configurations).
4.  **Clinical Safety**: Any changes made to diagnostic algorithms (e.g. `dsmDatabase`, rule matching engines) must be verified against current DSM-5-TR guidelines and thoroughly unit-tested.

---

## Submitting Pull Requests

1.  Verify that your changes build without errors across the platform you worked on.
2.  Write clear, comprehensive unit or integration tests for new features.
3.  Commit your changes using clear commit messages (e.g., `feat(web): add soap note exporter`, `fix(android): resolve memory leak on biometric lock`).
4.  Open a Pull Request using our [PR Template](.github/PULL_REQUEST_TEMPLATE.md).
5.  A maintainer will review your code. Address any review comments promptly.

---

## Licensing

By contributing to PsyPyrus, you agree that your contributions will be licensed under the **Apache License 2.0**.
