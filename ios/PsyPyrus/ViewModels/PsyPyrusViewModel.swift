import Foundation
import Combine

@MainActor
public class PsyPyrusViewModel: ObservableObject {
    // Active Role state: "Professional" or "Patient"
    @Published public var activeRole: String = "Professional"
    
    // Current Screen / Tab state
    @Published public var currentScreen: String = "Dashboard"
    
    // Database arrays
    @Published public var patients: [Patient] = []
    @Published public var appointments: [Appointment] = []
    @Published public var allNotes: [ClinicalNote] = []
    @Published public var allScores: [AssessmentScore] = []
    @Published public var moodLogs: [MoodLog] = []
    @Published public var auditLogs: [SecurityAuditLog] = []
    @Published public var homeworkTasks: [HomeworkTask] = []
    @Published public var plugins: [AppPlugin] = []
    
    // Selected patient ID
    @Published public var selectedPatientId: Int64 = 1
    
    // Clinical trials state
    @Published public var clinicalTrials: [ClinicalTrialStudy] = []
    @Published public var isTrialsLoading: Bool = false
    
    // AI Operations State
    @Published public var aiResultText: String = ""
    @Published public var isAiLoading: Bool = false
    
    // Local diagnostic results
    @Published public var localDiagnosticResults: [LocalDiagnosticResult] = []
    
    // Biometric Security Lock Status
    @Published public var isBiometricVerified: Bool = true
    
    // API configurations
    @Published public var geminiApiKey: String = ""
    @Published public var theme: String = "dark"
    
    // ICD-11 State
    @Published public var icdSearchResults: [IcdSearchResult] = []
    @Published public var isIcdLoading: Bool = false
    @Published public var icdClientId: String = ""
    @Published public var icdClientSecret: String = ""
    
    // --- STANDARDIZED GAMIFICATION & DIMENSION STATE ---
    @Published public var mindCoins: Int = 0
    @Published public var clinicianXp: Int = 0
    @Published public var clinicianLevel: Int = 1
    @Published public var unlockedSkins: Set<String> = ["Default Onyx"]
    @Published public var hitopDimensions: [String: Double] = [:]
    @Published public var rdocDomains: [String: Double] = [:]

    
    public init() {
        // Load API key and theme from UserDefaults if saved
        self.geminiApiKey = UserDefaults.standard.string(forKey: "PsyPyrusGeminiApiKey") ?? ""
        self.theme = UserDefaults.standard.string(forKey: "PsyPyrusTheme") ?? "dark"
        
        self.icdClientId = UserDefaults.standard.string(forKey: "PsyPyrusIcdClientId") ?? ""
        self.icdClientSecret = UserDefaults.standard.string(forKey: "PsyPyrusIcdClientSecret") ?? ""
        
        IcdService.shared.customClientId = self.icdClientId
        IcdService.shared.customClientSecret = self.icdClientSecret
        
        populateInitialData()
    }
    
    public func saveApiKey(_ key: String) {
        self.geminiApiKey = key
        UserDefaults.standard.set(key, forKey: "PsyPyrusGeminiApiKey")
        logAudit(action: "API Key Updated", details: "Gemini API key changed and secured in UserDefaults.")
    }
    
    public func saveTheme(_ selectedTheme: String) {
        self.theme = selectedTheme
        UserDefaults.standard.set(selectedTheme, forKey: "PsyPyrusTheme")
    }
    
    private func populateInitialData() {
        // Seed patients
        let liam = Patient(id: 1, name: "Liam Carter", age: 29, gender: "Male", email: "liam.carter@health.me", phone: "555-0192", riskStatus: "Severe", specialty: "Major Depres. (Single Ep.)")
        let sarah = Patient(id: 2, name: "Sarah Jenkins", age: 34, gender: "Female", email: "sarah.j@outlook.com", phone: "555-2311", riskStatus: "Moderate", specialty: "Generalized Anxiety Disorder")
        let john = Patient(id: 3, name: "John Doe", age: 42, gender: "Male", email: "j.doe@company.com", phone: "555-8833", riskStatus: "None", specialty: "ADHD Clinical Consultation")
        let sophia = Patient(id: 4, name: "Sophia Patel", age: 23, gender: "Female", email: "sophia.patel@edu.org", phone: "555-4422", riskStatus: "Low", specialty: "PTSD Trauma Therapy")
        
        self.patients = [liam, sarah, john, sophia]
        self.selectedPatientId = liam.id
        
        // Seed appointments
        self.appointments = [
            Appointment(id: 1, patientId: liam.id, patientName: liam.name, dateTime: "Today, 10:00 AM", status: "Scheduled", notes: "Pre-assessment for Severe cognitive stagnation. Risk indicators require supervision.", fee: 175.0, isVideo: true, code: "PSY-PYR-401"),
            Appointment(id: 2, patientId: sarah.id, patientName: sarah.name, dateTime: "Today, 02:00 PM", status: "Scheduled", notes: "Weekly Cognitive Restructuring session. Evaluate habit track logs.", fee: 150.0, isVideo: true, code: "PSY-PYR-402"),
            Appointment(id: 3, patientId: john.id, patientName: john.name, dateTime: "Tomorrow, 11:30 AM", status: "Scheduled", notes: "ADHD executive function coaching. Evaluate planner metrics.", fee: 150.0, isVideo: false, code: "OFFLINE"),
            Appointment(id: 4, patientId: sophia.id, patientName: sophia.name, dateTime: "10 Jun, 03:00 PM", status: "Scheduled", notes: "EMDR therapy grounding and somatic integration.", fee: 180.0, isVideo: true, code: "PSY-PYR-403")
        ]
        
        // Seed assessments
        self.allScores = [
            AssessmentScore(id: 1, patientId: liam.id, type: "PHQ-9", score: 21, details: "Severe Depression", date: Date().addingTimeInterval(-86400 * 30)),
            AssessmentScore(id: 2, patientId: liam.id, type: "PHQ-9", score: 18, details: "Moderately Severe Depression", date: Date().addingTimeInterval(-86400 * 15)),
            AssessmentScore(id: 3, patientId: liam.id, type: "PHQ-9", score: 15, details: "Moderate Depression", date: Date()),
            
            AssessmentScore(id: 4, patientId: sarah.id, type: "GAD-7", score: 16, details: "Severe Anxiety", date: Date().addingTimeInterval(-86400 * 20)),
            AssessmentScore(id: 5, patientId: sarah.id, type: "GAD-7", score: 13, details: "Moderate Anxiety", date: Date().addingTimeInterval(-86400 * 10)),
            AssessmentScore(id: 6, patientId: sarah.id, type: "GAD-7", score: 9, details: "Mild Anxiety", date: Date())
        ]
        
        // Seed clinical notes
        self.allNotes = [
            ClinicalNote(id: 1, patientId: liam.id, title: "Initial Intake Note", noteType: "GENERAL", bodyJson: "Patient presented with a history of recurrent low mood, complete anhedonia, and diminished energy. Sleeping 11 hours daily with poor quality. Passive suicidal ideation with no current plans or intent."),
            ClinicalNote(id: 2, patientId: sarah.id, title: "CBT Relaxation Schema", noteType: "PLAN", bodyJson: "Taught mindfulness-based abdominal pacing. Assigned daily breathing log homework on wellness app. Plan: Exposure hierarchy development next session.")
        ]
        
        // Seed mood logs
        self.moodLogs = [
            MoodLog(id: 1, patientId: 1, moodScore: 4, moodNote: "Feeling standard stress at startup job", gratitude: "Grateful for good coffee", breathingSeconds: 120, date: Date().addingTimeInterval(-86400 * 5)),
            MoodLog(id: 2, patientId: 1, moodScore: 5, moodNote: "Calmer after talking with friend", gratitude: "Sunny weather", breathingSeconds: 240, date: Date().addingTimeInterval(-86400 * 4)),
            MoodLog(id: 3, patientId: 1, moodScore: 6, moodNote: "Completed all morning tasks successfully", gratitude: "Quiet workspace", breathingSeconds: 300, date: Date().addingTimeInterval(-86400 * 3)),
            MoodLog(id: 4, patientId: 1, moodScore: 5, moodNote: "Tired post mid-week evaluations", gratitude: "Nice support from therapist", breathingSeconds: 180, date: Date().addingTimeInterval(-86400 * 2)),
            MoodLog(id: 5, patientId: 1, moodScore: 8, moodNote: "Amazing breathing exercise session, felt totally weightless!", gratitude: "Meditation music", breathingSeconds: 480, date: Date().addingTimeInterval(-86400 * 1)),
            MoodLog(id: 6, patientId: 1, moodScore: 7, moodNote: "Feeling focused on wellness routine", gratitude: "Woke up early", breathingSeconds: 240, date: Date())
        ]
        
        // Seed homework tasks
        self.homeworkTasks = [
            HomeworkTask(id: 1, patientId: liam.id, description: "Record sleep latency and daily sleep quality in sleep log notebook", isCompleted: false),
            HomeworkTask(id: 2, patientId: liam.id, description: "Commit to completing 5-minute deep abdominal breathing at 9 AM and 9 PM", isCompleted: true),
            HomeworkTask(id: 3, patientId: sarah.id, description: "Log work cognitive distortions and practice restructuring three times this week", isCompleted: false),
            HomeworkTask(id: 4, patientId: sarah.id, description: "Set boundaries: turn off workstation laptop by 8 PM daily", isCompleted: false)
        ]
        
        // Seed HIPAA audit logs
        self.auditLogs = [
            SecurityAuditLog(id: 1, action: "System Database Initialized", details: "Pre-populated database with compliant mock electronic health charts."),
            SecurityAuditLog(id: 2, action: "User Authentication", details: "Dr. Katherine Brewster successfully authenticated. Session secured under compliance ID #1004."),
            SecurityAuditLog(id: 3, action: "Key Ring Verification", details: "Checked Google KMS. End-to-end envelope encryption standard AES-GCM-256 validated.")
        ]
        
        // Seed Marketplace Plugins
        self.plugins = [
            // Clinician Apps
            AppPlugin(id: "hamd-rating-scale", title: "Hamilton Depression Rating Scale (HAM-D)", category: "Assessment Packs", description: "The classic 17-item clinician-administered rating scale for measuring depression severity in patients.", price: "Free", icon: "clipboard", rating: 4.8, installs: "1.2k", isInstalled: false),
            AppPlugin(id: "symptom-extractor-ai", title: "Symptom AI Extraction Copilot", category: "AI Modules", description: "Extracts psychiatric symptoms and severity indicators from session transcript draft logs automatically.", price: "$29.00/mo", icon: "sparkles", rating: 4.9, installs: "840", isInstalled: false),
            AppPlugin(id: "cbt-anxiety-protocol", title: "CBT Pacing Course Protocol", category: "Clinical Protocols", description: "Standardized 6-week Cognitive Behavioral Therapy pacing guidelines for moderate to severe Generalized Anxiety Disorder (GAD).", price: "Free", icon: "book", rating: 4.6, installs: "2.3k", isInstalled: false),
            AppPlugin(id: "pediatric-mse-synthesizer", title: "Pediatric MSE Synthesizer", category: "AI Modules", description: "A fine-tuned LLM assistant specializing in pediatric Mental Status Exams based on play-observation records.", price: "$19.99/mo", icon: "person", rating: 4.7, installs: "450", isInstalled: false),
            AppPlugin(id: "zoom-telehealth-e2ee", title: "Zoom Health Telehealth Integration", category: "Integrations", description: "Secure, end-to-end encrypted video sessions with HIPAA-compliant virtual background capability.", price: "$9.99/mo", icon: "video", rating: 4.5, installs: "4.1k", isInstalled: false),
            AppPlugin(id: "smart-calendar-billing", title: "Smart Calendar Auto-Billing", category: "Integrations", description: "Integrates with CMS-1500 templates to automatically generate and file codes upon telehealth completion.", price: "$15.00/mo", icon: "creditcard", rating: 4.4, installs: "1.9k", isInstalled: false),
            
            // Patient Apps
            AppPlugin(id: "sleep-pacing-audio", title: "Sleep Pacing Audio Suite", category: "Audio Therapy", description: "Guided breathing and pacing exercises designed to decrease sleep latency and somatic muscle scanning tension.", price: "Free", icon: "waveform", rating: 4.9, installs: "5.4k", isInstalled: false),
            AppPlugin(id: "cbt-habit-restructuring", title: "CBT Habit Restructuring Planner", category: "Wellness Guides", description: "Daily interactive logs to record automatic negative thoughts and practice cognitive reframing.", price: "Free", icon: "calendar", rating: 4.7, installs: "3.2k", isInstalled: false),
            AppPlugin(id: "oura-bio-sync", title: "Oura Ring Bio-Sync Connector", category: "Wearable Sync", description: "Synchronizes sleep architecture, resting heart rate, and heart rate variability (HRV) into the wellness dashboard.", price: "$4.99/mo", icon: "circle", rating: 4.8, installs: "1.1k", isInstalled: false),
            AppPlugin(id: "anxiety-grounding-exercises", title: "Anxiety Grounding Exercises", category: "Audio Therapy", description: "Somatic mindfulness tracks to resolve epigastric tightness and chest discomfort during acute stress.", price: "Free", icon: "wind", rating: 4.9, installs: "8.1k", isInstalled: false),
            AppPlugin(id: "mindfulness-habit-tracker", title: "Mindfulness Habit Tracker", category: "Wellness Guides", description: "Custom checklist for building long-term meditation habits and logging gratitude scores.", price: "Free", icon: "checkmark", rating: 4.6, installs: "2.7k", isInstalled: false),
            AppPlugin(id: "fitbit-vitality-sync", title: "Fitbit Vitality Connector", category: "Wearable Sync", description: "Real-time sync of active minutes, steps, and heart rate logs to support behavioral activation homework.", price: "Free", icon: "heart", rating: 4.4, installs: "4.5k", isInstalled: false)
        ]
    }
    
    // Role switching and main navigation
    public func switchRole(role: String) {
        self.activeRole = role
        self.currentScreen = "Dashboard"
        if role == "Patient" {
            self.selectedPatientId = 1 // default patient
        }
        logAudit(action: "Switched Role Mode", details: "Role set to \(role). Permissions applied.")
    }
    
    public func navigate(screen: String) {
        self.currentScreen = screen
        self.aiResultText = ""
    }
    
    public func setSelectedPatient(id: Int64) {
        self.selectedPatientId = id
        logAudit(action: "Accessed EHR Record", details: "Viewed Electronic Health Record for Patient ID: \(id)")
    }
    
    // HIPAA Logging
    public func logAudit(action: String, details: String) {
        let newLog = SecurityLogger.shared.createLog(action: action, details: details)
        let newId = (self.auditLogs.map(\.id).max() ?? 0) + 1
        var logged = newLog
        logged.id = newId
        self.auditLogs.insert(logged, at: 0)
    }
    
    public func toggleBiometric() {
        self.isBiometricVerified.toggle()
        logAudit(action: "Biometric State Altered", details: "Auth toggle clicked. Verified: \(isBiometricVerified)")
    }
    
    // --- Database Operations ---
    public func addPatient(name: String, age: Int, gender: String, email: String, phone: String, risk: String, specialty: String) {
        let newId = (self.patients.map(\.id).max() ?? 0) + 1
        let p = Patient(id: newId, name: name, age: age, gender: gender, email: email, phone: phone, riskStatus: risk, specialty: specialty)
        self.patients.append(p)
        logAudit(action: "Patient Created", details: "Added patient \(name) with ID \(newId) and Risk \(risk)")
        
        // Add clinical note placeholder
        addClinicalNote(patientId: newId, title: "Intake Note Reference", type: "GENERAL", body: "Patient \(name) enrolled in clinic. Initial diagnostic consideration: \(specialty). Assigned Risk Profile: \(risk).")
    }
    
    public func addAppointment(patientId: Int64, patientName: String, dateTime: String, notes: String, isVideo: Bool, fee: Double) {
        let newId = (self.appointments.map(\.id).max() ?? 0) + 1
        let code = isVideo ? "PSY-PYR-\(Int.random(in: 100...999))" : "OFFLINE"
        let appt = Appointment(id: newId, patientId: patientId, patientName: patientName, dateTime: dateTime, status: "Scheduled", notes: notes, fee: fee, isVideo: isVideo, code: code)
        self.appointments.append(appt)
        logAudit(action: "Scheduled Appointment", details: "Appointment scheduled for \(patientName) on \(dateTime) (Appt ID: \(newId))")
    }
    
    public func conductAppointment(appointmentId: Int64, status: String) {
        if let idx = self.appointments.firstIndex(where: { $0.id == appointmentId }) {
            self.appointments[idx].status = status
            logAudit(action: "Appointment Complete", details: "Managed appointment ID \(appointmentId) with status: \(status)")
        }
    }
    
    public func deleteAppointment(id: Int64) {
        self.appointments.removeAll(where: { $0.id == id })
        logAudit(action: "Cancelled Appointment", details: "Cancelled appointment ID \(id)")
    }
    
    public func addClinicalNote(patientId: Int64, title: String, type: String, body: String, isRiskAlert: Bool = false) {
        let newId = (self.allNotes.map(\.id).max() ?? 0) + 1
        let note = ClinicalNote(id: newId, patientId: patientId, title: title, noteType: type, bodyJson: body, timestamp: Date(), isRiskAlert: isRiskAlert)
        self.allNotes.insert(note, at: 0)
        logAudit(action: "Added Clinical Note", details: "Saved a new \(type) notes file for Patient ID \(patientId). Risk status flagged: \(isRiskAlert)")
    }
    
    public func addAssessmentScore(patientId: Int64, type: String, score: Int, details: String) {
        let newId = (self.allScores.map(\.id).max() ?? 0) + 1
        let sc = AssessmentScore(id: newId, patientId: patientId, type: type, score: score, details: details, date: Date())
        self.allScores.append(sc)
        logAudit(action: "Logged Assessment", details: "Added auto-scored \(type) with value \(score) (\(details)) to Patient ID \(patientId)")
    }
    
    public func addMoodLog(score: Int, note: String, gratitude: String, breathingSec: Int) {
        let newId = (self.moodLogs.map(\.id).max() ?? 0) + 1
        let log = MoodLog(id: newId, patientId: 1, moodScore: score, moodNote: note, gratitude: gratitude, breathingSeconds: breathingSec, date: Date())
        self.moodLogs.insert(log, at: 0)
    }
    
    // --- Diagnostics Engine Bridge ---
    public func runLocalMockDiagnostics(basicCriteria: [String], specificSymptoms: [String]) {
        self.localDiagnosticResults = DiagnosticEngine.evaluateMockDisorders(
            basicCriteriaInput: basicCriteria,
            specificSymptomsInput: specificSymptoms
        )
    }
    
    public func runLocalDsm5Diagnostics(mddSymptoms: [String], gadSymptoms: [String], durationWeeks: Int, exclusions: [String]) {
        self.localDiagnosticResults = DiagnosticEngine.evaluateDsm5Disorders(
            mddSymptoms: mddSymptoms,
            gadSymptoms: gadSymptoms,
            durationWeeks: durationWeeks,
            exclusions: exclusions
        )
    }
    
    // --- AI Operations ---
    
    public func triggerAiSoapNote(transcript: String, patientId: Int64) async {
        self.isAiLoading = true
        self.aiResultText = "AI Clinical Copilot is running SOAP compilation engine..."
        logAudit(action: "AI Request Init", details: "Triggered SOAP generator for patient ID: \(patientId)")
        
        let systemInstruction = "You are a psychiatric clinical assistant. Convert conversational session transcripts into a formal medical SOAP note. Maintain full clinical clarity and use professional vocabularies."
        let prompt = """
        Compile the following session conversation transcript into a structured, formal healthcare SOAP note.
        Include SUBJECTIVE, OBJECTIVE, ASSESSMENT, and PLAN. Keep and suggest matching diagnoses (such as DSM-5/ICD-10 codes) based on indicators.
        
        Transcript:
        "\(transcript)"
        """
        
        let result = await GeminiService.shared.callGemini(prompt: prompt, systemInstruction: systemInstruction, apiKey: self.geminiApiKey)
        self.aiResultText = result
        self.isAiLoading = false
        
        // Auto-save note
        let hasAlert = transcript.contains("hurt") || transcript.contains("suicide") || transcript.contains("die")
        addClinicalNote(patientId: patientId, title: "AI SOAP Copilot Output", type: "SOAP", body: result, isRiskAlert: hasAlert)
        logAudit(action: "AI Soap Generation Success", details: "Saved AI Generated SOAP note to database for patientId \(patientId)")
    }
    
    public func triggerAiMseNarrative(
        patientId: Int64,
        appearance: String,
        behavior: String,
        speech: String,
        mood: String,
        attention: String,
        insight: Int,
        judgment: String,
        notes: String
    ) async {
        self.isAiLoading = true
        self.aiResultText = "AI compile engine writing structured Mental Status Examination narrative..."
        logAudit(action: "MSE Narrative Request", details: "Compiling MSE Narrative for Patient ID: \(patientId)")
        
        let prompt = """
        Synthesize the following mental status exam checklist ratings and brief annotations into a single, cohesive, formal psychiatric clinical narrative paragraph (Mental Status Examination narrative block). Avoid list bullets in output, write in continuous prose style.
        
        Ratings:
        * Appearance/Attire: \(appearance)
        * Behavior/Cooperation: \(behavior)
        * Speech Patterns: \(speech)
        * Patient mood/affect: \(mood)
        * Attention: \(attention)
        * Insight Rating: Grade \(insight) / 6
        * Clinical Judgment: \(judgment)
        * Descriptive annotations: \(notes)
        """
        
        let result = await GeminiService.shared.callGemini(prompt: prompt, systemInstruction: "You are an expert clinical psychologist writing formal Mental Status Exam summaries.", apiKey: self.geminiApiKey)
        self.aiResultText = result
        self.isAiLoading = false
        
        let dbBody = "Mental Status Examination (Structured Narrative):\n\n\(result)\n\n[Checklist Details]\nAppearance: \(appearance) | Behavior: \(behavior) | Speech: \(speech) | Mood: \(mood) | Insight: Grade \(insight) | Judgment: \(judgment)"
        addClinicalNote(patientId: patientId, title: "Mental Status Exam Narrative", type: "MSE", body: dbBody)
        logAudit(action: "MSE Summary Saved", details: "Saved completed MSE narrative to database.")
    }
    
    public func triggerDiagnosticAssistant(symptoms: String, mseFindings: String) async {
        self.isAiLoading = true
        self.aiResultText = "Diagnostic engine scanning DSM-5-TR guidelines..."
        logAudit(action: "Diagnostic Assistance Request", details: "Symptoms analyzed: \(symptoms.prefix(30))...")
        
        let localResultsStr = localDiagnosticResults.isEmpty ? "No definitive matching criteria met locally." :
            localDiagnosticResults.map { "- \($0.disorderName) (\($0.code)): Confidence=\($0.confidence). Details: \($0.explanation)" }.joined(separator: "\n")
            
        let prompt = """
        Provide differential medical diagnoses and probable classifications based on these indicators:
        
        Symptomatology:
        "\(symptoms)"
        
        Direct MSE Indicators:
        "\(mseFindings)"
        
        Local Rule-Based Evaluation Results:
        \(localResultsStr)
        
        Please take the Local Rule-Based Evaluation Results into account. Validate if the local rules correctly identified the criteria constraints (for MDD, GAD, or mock disorders) and provide a comprehensive differential diagnosis report. 
        Include DSM-5-TR and ICD-10 codes, DSM criteria checklist matching, comorbidities, and confidence indicators (High, Moderate, Low). Include clinical disclaimers.
        """
        
        let result = await GeminiService.shared.callGemini(prompt: prompt, systemInstruction: "You are a psychiatric diagnostic advisor.", apiKey: self.geminiApiKey)
        self.aiResultText = result
        self.isAiLoading = false
        logAudit(action: "Diagnostic Model Evaluated", details: "Suggested DSM codes for user criteria using hybrid local context.")
    }
    
    public func triggerSmartTreatmentPlanner(goal: String, description: String, patientId: Int64) async {
        self.isAiLoading = true
        self.aiResultText = "CBT Planner compiler framing SMART targets..."
        logAudit(action: "Treatment Planner Request", details: "Goal: \(goal)")
        
        let prompt = """
        Convert this basic mental health therapy goal into a comprehensive clinical treatment plan following clinical standards:
        
        Goal: "\(goal)"
        Context: "\(description)"
        
        Output:
        1. Specific, Measurable, Achievable, Relevant, and Time-bound (SMART) Goal configuration.
        2. Evidence-Based Clinical Interventions.
        3. Concrete patient homework assignment tasks.
        4. Measurable therapy progress tracking milestones.
        """
        
        let result = await GeminiService.shared.callGemini(prompt: prompt, systemInstruction: "You are a cognitive behavioral therapist (CBT) treatment planner.", apiKey: self.geminiApiKey)
        self.aiResultText = result
        self.isAiLoading = false
        
        addClinicalNote(patientId: patientId, title: "Treatment Plan: \(goal)", type: "PLAN", body: result)
        logAudit(action: "Treatment Plan Locked", details: "Assigned goal-treatment schema to database.")
    }
    
    public func triggerClinicalSearch(query: String) async {
        self.isAiLoading = true
        self.aiResultText = "Querying clinical knowledge indexes..."
        logAudit(action: "Knowledge Base Query", details: "Query: \(query)")
        
        let prompt = """
        Search clinical archives and academic summaries for this inquiry:
        "\(query)"
        
        Deliver relevant Diagnostic Criteria, ICD billing codes, guidelines and scientific consensus recommendations in a brief, premium summary.
        """
        
        let result = await GeminiService.shared.callGemini(prompt: prompt, systemInstruction: "You are an AI Clinical Librarian powered by PsyPyrus Knowledge base.", apiKey: self.geminiApiKey)
        self.aiResultText = result
        self.isAiLoading = false
        logAudit(action: "Search Archive Completed", details: "Delivered academic summary for query: \(query)")
    }
    
    public func clearAiOutput() {
        self.aiResultText = ""
    }
    
    // --- Homework Management ---
    public func addHomework(description: String) {
        guard !description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        let newId = (self.homeworkTasks.map(\.id).max() ?? 0) + 1
        let task = HomeworkTask(id: newId, patientId: selectedPatientId, description: description, isCompleted: false)
        self.homeworkTasks.append(task)
        logAudit(action: "Homework Assigned", details: "Assigned task '\(description)' to Patient ID \(selectedPatientId) (Task ID: \(newId))")
    }
    
    public func toggleHomeworkStatus(task: HomeworkTask) {
        if let idx = self.homeworkTasks.firstIndex(where: { $0.id == task.id }) {
            self.homeworkTasks[idx].isCompleted.toggle()
            logAudit(action: "Homework Status Toggled", details: "Toggled task ID \(task.id) to isCompleted: \(self.homeworkTasks[idx].isCompleted)")
        }
    }
    
    public func deleteHomework(id: Int64) {
        self.homeworkTasks.removeAll(where: { $0.id == id })
        logAudit(action: "Homework Deleted", details: "Deleted homework task ID \(id)")
    }
    
    // --- Live Clinical Trials ---
    public func fetchClinicalTrialsForActivePatient() async {
        guard let patient = patients.first(where: { $0.id == selectedPatientId }) else { return }
        self.isTrialsLoading = true
        logAudit(action: "Query Clinical Trials", details: "Searching ClinicalTrials.gov studies for condition: \(patient.specialty)")
        
        let condition: String
        let specialtyLower = patient.specialty.lowercased()
        if specialtyLower.contains("depres") {
            condition = "Major Depressive Disorder"
        } else if specialtyLower.contains("anxiety") {
            condition = "Generalized Anxiety Disorder"
        } else if specialtyLower.contains("adhd") {
            condition = "ADHD"
        } else if specialtyLower.contains("ptsd") {
            condition = "PTSD"
        } else {
            condition = patient.specialty
        }
        
        let results = await ClinicalTrialsService.shared.fetchActiveTrials(condition: condition)
        self.clinicalTrials = results
        self.isTrialsLoading = false
        logAudit(action: "Clinical Trials Search Success", details: "Retrieved \(results.count) active studies for \(condition)")
    }
    
    // --- Plugins Store ---
    public func installPlugin(id: String, title: String) async {
        // Simulate premium installation latency
        if let idx = self.plugins.firstIndex(where: { $0.id == id }) {
            try? await Task.sleep(nanoseconds: UInt64(1.2 * 1_000_000_000))
            self.plugins[idx].isInstalled = true
            logAudit(action: "Plugin Installed", details: "Installed clinical plugin: \(title)")
        }
    }
    
    public func uninstallPlugin(id: String, title: String) async {
        // Simulate premium uninstallation latency
        if let idx = self.plugins.firstIndex(where: { $0.id == id }) {
            try? await Task.sleep(nanoseconds: UInt64(0.8 * 1_000_000_000))
            self.plugins[idx].isInstalled = false
            logAudit(action: "Plugin Uninstalled", details: "Uninstalled plugin: \(title)")
        }
    }
    
    // --- ICD-11 Methods ---
    public func saveIcdSettings(clientId: String, clientSecret: String) {
        self.icdClientId = clientId
        self.icdClientSecret = clientSecret
        
        UserDefaults.standard.set(clientId, forKey: "PsyPyrusIcdClientId")
        UserDefaults.standard.set(clientSecret, forKey: "PsyPyrusIcdClientSecret")
        
        IcdService.shared.customClientId = clientId
        IcdService.shared.customClientSecret = clientSecret
        
        logAudit(action: "ICD-11 Credentials Updated", details: "Updated custom WHO ICD-11 settings in UserDefaults.")
    }
    
    public func searchIcd11(query: String) async {
        self.isIcdLoading = true
        logAudit(action: "ICD-11 Search Initiated", details: "Querying ICD-11 registry for: \(query)")
        
        let results = await IcdService.shared.searchIcd11(query: query)
        self.icdSearchResults = results
        self.isIcdLoading = false
    }
    
    // --- GAMIFICATION & DIAGNOSTIC METHODS ---
    public func addMindCoins(amount: Int) {
        self.mindCoins += amount
        logAudit(action: "MindCoins Earned", details: "User gained \(amount) MindCoins.")
    }
    
    public func addClinicianXp(amount: Int) {
        self.clinicianXp += amount
        let currentXp = self.clinicianXp
        let neededXp = self.clinicianLevel * 100
        if currentXp >= neededXp {
            self.clinicianLevel += 1
            self.clinicianXp = currentXp - neededXp
            logAudit(action: "Clinician Level Up", details: "Clinician leveled up to Level \(self.clinicianLevel).")
        }
    }
    
    public func unlockSkin(skinName: String, cost: Int) -> Bool {
        if self.mindCoins >= cost {
            self.mindCoins -= cost
            self.unlockedSkins.insert(skinName)
            logAudit(action: "Skin Unlocked", details: "Unlocked display theme skin: \(skinName)")
            return true
        }
        return false
    }
    
    public func updateHitopDimension(dimension: String, value: Double) {
        self.hitopDimensions[dimension] = value
    }
    
    public func updateRdocDomain(domain: String, value: Double) {
        self.rdocDomains[domain] = value
    }
}
