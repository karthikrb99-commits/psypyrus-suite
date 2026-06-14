# Contributing to the Papyrus Ecosystem

Thank you for your interest in contributing to the **Papyrus Ecosystem** and the **PsyPyrus Suite**! We welcome improvements, bug fixes, features, documentation updates, clinical evaluations, and design contributions to this open-source Mental Health Operating System.

As a clinical decision support and health intelligence platform, we maintain high standards of code quality, scientific validation, security, and ethical alignment. Please read this document carefully before making changes.

---

## 🌟 Who Can Contribute?

Papyrus is intentionally interdisciplinary. We believe that building the future of mental healthcare technology requires collective intelligence across multiple fields:

### 🩺 Mental Health Professionals
* **Roles**: Psychologists, psychiatrists, psychotherapists, counselors, social workers, occupational therapists, psychiatric nurses.
* **How to help**: Validate clinical workflows, review diagnostic rules, audit AI-generated prose (SOAP/MSE notes) for clinical safety, and suggest evidence-based intervention plans.

### 🔬 Researchers & Academics
* **Roles**: Clinical researchers, neuroscientists, cognitive scientists, epidemiologists, public health researchers, computational psychiatrists.
* **How to help**: Improve the **HiTOP Matrix Explorer** and **RDoC Matrix Explorer** domains, design validation studies, benchmark clinical algorithms, and contribute de-identified datasets.

### 💻 Computer Science & AI Engineers
* **Roles**: Frontend, backend, mobile (Kotlin/SwiftUI), desktop (Electron) developers, ML/NLP researchers, knowledge graph engineers, cybersecurity experts.
* **How to help**: Write clean and performant code, optimize offline local diagnostic engines, implement secure HL7 FHIR payloads, enhance biometric security layers, and test UI/UX.

### 🎨 Design & Human Factors
* **Roles**: UX researchers, UI designers, accessibility experts, service designers.
* **How to help**: Enhance patient engagement interfaces, improve accessibility standards, conduct user studies, and design intuitive clinician views.

### 📊 Health Informatics Specialists
* **Roles**: HL7/FHIR experts, medical informatics strategists.
* **How to help**: Maintain CDAC/NRCeS compliance, improve SNOMED CT and LOINC concept mappings, and implement integrations with open EHR standard models (such as openEHR archetypes).

### ⚖️ Ethics, Policy & Law
* **Roles**: Bioethicists, privacy scholars, AI governance researchers.
* **How to help**: Conduct safety reviews of LLM-based copilots, design explainable AI protocols, and audit compliance logs for HIPAA, GDPR, and DISHA acts.

### 👥 Community Contributors
* **Roles**: Patients, lived-experience advocates, translators, documentation writers, educators.
* **How to help**: Improve translations, write educational materials, document setup instructions, and advocate for ethical, patient-centric digital care.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to the project maintainers.

---

## Mono-Repo Architecture

The PsyPyrus client suite is managed as a unified monorepo. Here is the layout of the primary packages:

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

1. **Branching**: Create your feature branches off of the `main` branch.
   - Name branches as `feature/your-feature`, `bugfix/your-fix`, or `docs/your-changes`.
2. **Linting & Formatting**: Follow code conventions for the respective languages:
   - **JS/React**: Follow standard ESLint rules.
   - **Kotlin**: Follow standard Kotlin style guides.
   - **Swift**: Follow SwiftUI best practices.
3. **No Hardcoded Secrets**: Never commit private keys, passwords, or API credentials. Use environment variables (via `.env` or system environment configurations).
4. **Clinical Safety**: Any changes made to diagnostic algorithms (e.g. `dsmDatabase`, rule matching engines) must be verified against current DSM-5-TR / ICD-11 guidelines and thoroughly unit-tested.
5. **Localization & Compliance Modules**: When contributing to local regulations or gateway clients (such as US HIPAA/GDPR or Indian ABDM/DISHA registries), ensure all data transmission models adhere strictly to the respective regional healthcare standards (e.g. HL7 FHIR profiles, SNOMED CT terminology) and mock sandbox environments are kept fully decoupled from production keys.

---

## Submitting Pull Requests

1. Verify that your changes build without errors across the platform you worked on.
2. Write clear, comprehensive unit or integration tests for new features.
3. Commit your changes using clear commit messages (e.g., `feat(web): add soap note exporter`, `fix(android): resolve memory leak on biometric lock`).
4. Open a Pull Request using our [PR Template](.github/PULL_REQUEST_TEMPLATE.md).
5. A maintainer will review your code. Address any review comments promptly.

---

## Licensing

By contributing to Papyrus, you agree that your contributions will be licensed under the **Apache License 2.0**.
