# Document 01 — PRD (Product Requirements Document)

## App Name
**PsyPyrus Suite** (the multi-platform client application of the **Papyrus Ecosystem**)

## Tagline
The Multi-Platform Client Suite & Practitioner Workspace for the Papyrus Open Mental Health Intelligence Ecosystem

---

## 1. Problem Statement
Mental health practitioners (psychologists, psychiatrists, and counselors) face significant administrative burdens. Documenting encounters, compiling Mental Status Examinations (MSE), matching DSM-5 criteria, mapping ICD-11 classifications, and drawing family genograms consume hours of non-billable time, contributing to clinician burnout. Concurrently, patients struggle with treatment compliance, lack structured wellness tracking (like mood logs and breathing exercises) between therapy sessions, and drop out of homework programs.

To resolve these challenges, the **PsyPyrus Suite** unifies practice management, EHR tracking, clinical diagnostics, and patient engagement across Web, Mobile (Android/iOS), Desktop, and Cloud deployments. It serves as the primary front-end interface of the **Papyrus Ecosystem**—an open-source initiative to build a next-generation Mental Health Operating System that democratizes access to advanced mental health technologies while preserving scientific rigor, clinical integrity, privacy, and human-centered care.

---

## 2. Target Users
1. **Mental Health Practitioners (MHPs)**: Individual therapists, clinical psychologists, psychiatrists, and multi-disciplinary teams working in hospitals or private practices who require a secure, intelligent, and open EHR environment.
2. **Patients**: Individuals undergoing mental health treatment, tracking their daily emotional patterns, and participating in therapist-prescribed self-care routines.
3. **Researchers & Academics**: Clinical and public health researchers looking for open, reproducible science and clinical schemas.

---

## 3. Core Features (Parity Specs Across All Platforms)

### 3.1 Dual-Persona Interface
* Standalone, tailored dashboards for both **Clinician** (practice management, EHR files, analytics, comorbidity networks) and **Patient** (wellness lounge, rewards, homework tasks).
* Seamless persona-switching with context preservation.

### 3.2 Case History & Digitized Intake Workspace
* Fully structured intake fields to log chief complaints, somatic symptoms, developmental history, and insight scales.
* **Interactive Genogram Canvas**: A built-in graphical drawing pad enabling practitioners to draw family genograms, save sketches directly to local databases, and clear/customize lines.

### 3.3 Mental Status Examination (MSE) Checklist
* Structured categorization of general appearance, motor behavior, speech, cognition, mood/affect, thought content, and perception.
* Translates checklist configurations into professional prose using AI.

### 3.4 DSM-5-TR Catalog Database & Diagnostic Engine
* In-app knowledge base mapping **13 primary psychiatric conditions** (MDD, GAD, PTSD, Bipolar I, BPD, ADHD, OCD, SAD, Specific Phobia, Adjustment Disorder, Acute Stress Disorder, etc.) with symptom checklists, comorbidity indices, and evidence-based interventions.
* **Rule-Based Checker**: Computes likelihood coefficients based on symptom count, required core indicators, minimum duration thresholds, and exclusion rules.

### 3.5 Quantitative & Matrix Frameworks (HiTOP & RDoC)
* **HiTOP Matrix Explorer**: Interactive exploration of the Hierarchical Taxonomy of Psychopathology, tracking quantitative, dimension-based psychiatric traits (Internalizing, Externalizing, Thought Disorder) rather than categorical boundaries.
* **RDoC Matrix Explorer**: Research Domain Criteria matrix tracker mapping patient observations across genetic, physiological, behavioral, and self-report levels.

### 3.6 WHO ICD-11 Registry Integration
* Integrated Search API to query international classifications with OAuth2 bearer tokens and an offline local search fallback of 23 clinical classes.

### 3.7 AI Copilot Modules (Gemini 3.5 Flash)
* **SOAP Note Compiler**: Drafts professional subjective/objective/assessment/planning notes from session transcripts.
* **MSE Narrative Compiler**: Translates checklist selections into clinical prose paragraphs.
* **SMART Treatment Planner**: Formulates specific, measurable, and action-oriented goals.
* **Suicide/Crisis Risk Screener**: Scans logs and complaints for immediate risk factors, triggering automated alert disclaimers.

### 3.8 Gamification & MindShop Reward Engine
* Behaviors like completing exercises earn patients **XP** and **MindCoins**.
* **MindShop Storefront**: Allows spending coins to unlock ambient soundscapes (rainforest, fireplace), visual skins (retro CRT terminal, glassmorphic layout), and AI avatars (Lisa).

### 3.9 Cryptographic Security & Biometric Locks
* Real native biometric security utilizing `BiometricPrompt` (Android) and `LocalAuthentication` (iOS/macOS) alongside 4-digit PIN locks.
* Comprehensive, HIPAA-compliant audit logs tracking every file view, data read, and AI transaction.

### 3.10 Cloud Database Synchronization
* Automatic background replication of local records (Room, IndexedDB, SQLite) to a central cloud container, featuring offline operational support and conflict-resolution routines.

---

## 4. Nice to Have (Future Roadmap)
* **Voice-to-MSE Dictation**: Direct audio capture of client sessions, auto-transcribing and parsing clinical terminology into structured MSE checklists.
* **Integrated Telehealth Video Client**: Secure, peer-to-peer webRTC video calls with real-time AI session summaries.

---

## 5. Out of Scope (Current Version)
* **Live Payment Gateways**: Invoices are generated and managed as drafts; direct stripe checkout or bank transfer processing is simulated (mocked).
* **e-Prescriptions**: Provides medication class recommendations for psychiatrists, but does not connect to commercial pharmacy networks.

---

## 6. Success Metrics
* **Documentation Time Reduction**: Average time spent drafting SOAP notes and MSE reports reduced from 20 minutes to under 5 minutes per session.
* **Engagement Adherence**: Patient daily wellness lounge activity maintained at >70% active days over a 30-day treatment cycle.
* **Compliance Verification**: 100% of diagnostic decisions and file accesses logged in the HIPAA audit stream.
* **Open-Source Participation**: Increase community-led translations, clinical rule contributions, and platform plugin integrations.
