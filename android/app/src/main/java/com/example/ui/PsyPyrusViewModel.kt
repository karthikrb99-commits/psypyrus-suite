package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import org.json.JSONObject

class PsyPyrusViewModel(application: Application) : AndroidViewModel(application) {
    private val db = AppDatabase.getDatabase(application)
    private val repository = PsyPyrusRepository(db)

    // Active Role state: "Professional" or "Patient"
    private val _activeRole = MutableStateFlow("Professional")
    val activeRole: StateFlow<String> = _activeRole.asStateFlow()

    // Current Screen / Tab state
    private val _currentScreen = MutableStateFlow("Dashboard")
    val currentScreen: StateFlow<String> = _currentScreen.asStateFlow()

    // Database flow parameters
    val patients: StateFlow<List<Patient>> = repository.patients
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val appointments: StateFlow<List<Appointment>> = repository.appointments
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allNotes: StateFlow<List<ClinicalNote>> = repository.allNotes
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allScores: StateFlow<List<AssessmentScore>> = repository.allScores
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val moodLogs: StateFlow<List<MoodLog>> = repository.moodLogs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val auditLogs: StateFlow<List<SecurityAuditLog>> = repository.auditLogs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Homework flows
    val activePatientHomework: StateFlow<List<HomeworkTask>> = combine(_selectedPatientId, repository.allHomework) { id, tasks ->
        tasks.filter { it.patientId == id }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Clinical Trials list state
    private val _clinicalTrials = MutableStateFlow<List<ClinicalTrialStudy>>(emptyList())
    val clinicalTrials: StateFlow<List<ClinicalTrialStudy>> = _clinicalTrials.asStateFlow()

    private val _isTrialsLoading = MutableStateFlow(false)
    val isTrialsLoading: StateFlow<Boolean> = _isTrialsLoading.asStateFlow()

    // UI state for Gemini AI Operations
    private val _aiResultText = MutableStateFlow("")
    val aiResultText: StateFlow<String> = _aiResultText.asStateFlow()

    private val _isAiLoading = MutableStateFlow(false)
    val isAiLoading: StateFlow<Boolean> = _isAiLoading.asStateFlow()

    // Local Diagnostic Engine state
    private val _localDiagnosticResults = MutableStateFlow<List<LocalDiagnosticResult>>(emptyList())
    val localDiagnosticResults: StateFlow<List<LocalDiagnosticResult>> = _localDiagnosticResults.asStateFlow()

    fun runLocalMockDiagnostics(basicCriteria: List<String>, specificSymptoms: List<String>) {
        _localDiagnosticResults.value = DiagnosticEngine.evaluateMockDisorders(basicCriteria, specificSymptoms)
    }

    fun runLocalDsm5Diagnostics(
        mddSymptoms: List<String>,
        gadSymptoms: List<String>,
        durationWeeks: Int,
        exclusions: List<String>
    ) {
        _localDiagnosticResults.value = DiagnosticEngine.evaluateDsm5Disorders(mddSymptoms, gadSymptoms, durationWeeks, exclusions)
    }


    // Biometric security login status
    private val _isBiometricVerified = MutableStateFlow(true) // Start authenticated for smooth preview, let user "lock" or "verify"
    val isBiometricVerified: StateFlow<Boolean> = _isBiometricVerified.asStateFlow()

    // Currently selected patient for clinical activities (defaults to patient 1 or first available)
    private val _selectedPatientId = MutableStateFlow<Long>(1L)
    val selectedPatientId: StateFlow<Long> = _selectedPatientId.asStateFlow()

    init {
        // Pre-populate Database if empty to provide high-fidelity out-of-the-box clinical profiles
        viewModelScope.launch {
            repository.patients.first().let { currentPatients ->
                if (currentPatients.isEmpty()) {
                    populateInitialData()
                }
            }
        }
    }

    private suspend fun populateInitialData() {
        // Insert patients
        val liamId = repository.insertPatient(
            Patient(
                name = "Liam Carter",
                age = 29,
                gender = "Male",
                email = "liam.carter@health.me",
                phone = "555-0192",
                riskStatus = "Severe",
                specialty = "Major Depres. (Single Ep.)"
            )
        )
        val sarahId = repository.insertPatient(
            Patient(
                name = "Sarah Jenkins",
                age = 34,
                gender = "Female",
                email = "sarah.j@outlook.com",
                phone = "555-2311",
                riskStatus = "Moderate",
                specialty = "Generalized Anxiety Disorder"
            )
        )
        val johnId = repository.insertPatient(
            Patient(
                name = "John Doe",
                age = 42,
                gender = "Male",
                email = "j.doe@company.com",
                phone = "555-8833",
                riskStatus = "None",
                specialty = "ADHD Clinical Consultation"
            )
        )
        val sophiaId = repository.insertPatient(
            Patient(
                name = "Sophia Patel",
                age = 23,
                gender = "Female",
                email = "sophia.patel@edu.org",
                phone = "555-4422",
                riskStatus = "Low",
                specialty = "PTSD Trauma Therapy"
            )
        )

        // Set default selected patient
        _selectedPatientId.value = liamId

        // Insert appointments
        repository.insertAppointment(
            Appointment(
                patientId = liamId,
                patientName = "Liam Carter",
                dateTime = "Today, 10:00 AM",
                status = "Scheduled",
                notes = "Pre-assessment for Severe cognitive stagnation. Risk indicators require supervision.",
                fee = 175.0,
                isVideo = true,
                code = "PSY-PYR-401"
            )
        )
        repository.insertAppointment(
            Appointment(
                patientId = sarahId,
                patientName = "Sarah Jenkins",
                dateTime = "Today, 02:00 PM",
                status = "Scheduled",
                notes = "Weekly Cognitive Restructuring session. Evaluate habit track logs.",
                fee = 150.0,
                isVideo = true,
                code = "PSY-PYR-402"
            )
        )
        repository.insertAppointment(
            Appointment(
                patientId = johnId,
                patientName = "John Doe",
                dateTime = "Tomorrow, 11:30 AM",
                status = "Scheduled",
                notes = "ADHD executive function coaching. Evaluate planner metrics.",
                fee = 150.0,
                isVideo = false,
                code = "OFFLINE"
            )
        )
        repository.insertAppointment(
            Appointment(
                patientId = sophiaId,
                patientName = "Sophia Patel",
                dateTime = "10 Jun, 03:00 PM",
                status = "Scheduled",
                notes = "EMDR therapy grounding and somatic integration.",
                fee = 180.0,
                isVideo = true,
                code = "PSY-PYR-403"
            )
        )

        // Add some initial Assessment Scores for analysis
        repository.insertScore(AssessmentScore(patientId = liamId, type = "PHQ-9", score = 21, details = "Severe Depression", date = System.currentTimeMillis() - 86400000 * 30))
        repository.insertScore(AssessmentScore(patientId = liamId, type = "PHQ-9", score = 18, details = "Moderately Severe Depression", date = System.currentTimeMillis() - 86400000 * 15))
        repository.insertScore(AssessmentScore(patientId = liamId, type = "PHQ-9", score = 15, details = "Moderate Depression", date = System.currentTimeMillis()))

        repository.insertScore(AssessmentScore(patientId = sarahId, type = "GAD-7", score = 16, details = "Severe Anxiety", date = System.currentTimeMillis() - 86400000 * 20))
        repository.insertScore(AssessmentScore(patientId = sarahId, type = "GAD-7", score = 13, details = "Moderate Anxiety", date = System.currentTimeMillis() - 86400000 * 10))
        repository.insertScore(AssessmentScore(patientId = sarahId, type = "GAD-7", score = 9, details = "Mild Anxiety", date = System.currentTimeMillis()))

        // Add some Initial Clinical Notes
        repository.insertClinicalNote(
            ClinicalNote(
                patientId = liamId,
                title = "Initial Intake Note",
                noteType = "GENERAL",
                bodyJson = "Patient presented with a history of recurrent low mood, complete anhedonia, and diminished energy. Sleeping 11 hours daily with poor quality. Passive suicidal ideation with no current plans or intent."
            )
        )
        repository.insertClinicalNote(
            ClinicalNote(
                patientId = sarahId,
                title = "CBT Relaxation Schema",
                noteType = "PLAN",
                bodyJson = "Taught mindfulness-based abdominal pacing. Assigned daily breathing log homework on wellness app. Plan: Exposure hierarchy development next session."
            )
        )

        // Add pre-populated mood logs for Patient Wellness Tracker
        repository.insertMoodLog(MoodLog(moodScore = 4, moodNote = "Feeling standard stress at startup job", gratitude = "Grateful for good coffee", breathingSeconds = 120, date = System.currentTimeMillis() - 86400000 * 5))
        repository.insertMoodLog(MoodLog(moodScore = 5, moodNote = "Calmer after talking with friend", gratitude = "Sunny weather", breathingSeconds = 240, date = System.currentTimeMillis() - 86400000 * 4))
        repository.insertMoodLog(MoodLog(moodScore = 6, moodNote = "Completed all morning tasks successfully", gratitude = "Quiet workspace", breathingSeconds = 300, date = System.currentTimeMillis() - 86400000 * 3))
        repository.insertMoodLog(MoodLog(moodScore = 5, moodNote = "Tired post mid-week evaluations", gratitude = "Nice support from therapist", breathingSeconds = 180, date = System.currentTimeMillis() - 86400000 * 2))
        repository.insertMoodLog(MoodLog(moodScore = 8, moodNote = "Amazing breathing exercise session, felt totally weightless!", gratitude = "Meditation music", breathingSeconds = 480, date = System.currentTimeMillis() - 86400000))
        repository.insertMoodLog(MoodLog(moodScore = 7, moodNote = "Feeling focused on wellness routine", gratitude = "Woke up early", breathingSeconds = 240, date = System.currentTimeMillis()))

        // Seed initial Homework Tasks
        repository.insertHomework(HomeworkTask(patientId = liamId, description = "Record sleep latency and daily sleep quality in sleep log notebook", isCompleted = false))
        repository.insertHomework(HomeworkTask(patientId = liamId, description = "Commit to completing 5-minute deep abdominal breathing at 9 AM and 9 PM", isCompleted = true))
        repository.insertHomework(HomeworkTask(patientId = sarahId, description = "Log work cognitive distortions and practice restructuring three times this week", isCompleted = false))
        repository.insertHomework(HomeworkTask(patientId = sarahId, description = "Set boundaries: turn off workstation laptop by 8 PM daily", isCompleted = false))

        // Insert initial HIPAA Security Audit Logs
        repository.insertAuditLog(SecurityAuditLog(action = "System Database Initialized", details = "Pre-populated database with compliant mock electronic health charts."))
        repository.insertAuditLog(SecurityAuditLog(action = "User Authentication", details = "Dr. Katherine Brewster successfully authenticated. Session secured under compliance ID #1004."))
        repository.insertAuditLog(SecurityAuditLog(action = "Key Ring Verification", details = "Checked Google KMS. End-to-end envelope encryption standard AES-GCM-256 validated."))
    }

    // Role-switching and main navigation
    fun switchRole(role: String) {
        viewModelScope.launch {
            _activeRole.value = role
            _currentScreen.value = "Dashboard"
            logAudit("Switched Role Mode", "Role set to $role. Permissions applied.")
        }
    }

    fun navigate(screen: String) {
        _currentScreen.value = screen
        // Optionally clear AI errors/texts when moving
        _aiResultText.value = ""
    }

    fun setSelectedPatient(id: Long) {
        _selectedPatientId.value = id
        logAudit("Accessed EHR Record", "Viewed Electronic Health Record for Patient ID: $id")
    }

    // HIPAA Logging
    fun logAudit(action: String, details: String) {
        viewModelScope.launch {
            repository.insertAuditLog(SecurityAuditLog(action = action, details = details))
        }
    }

    fun toggleBiometric() {
        _isBiometricVerified.value = !_isBiometricVerified.value
        logAudit("Biometric State Altered", "Auth toggle clicked. Verified: ${_isBiometricVerified.value}")
    }

    // --- DB Operations ---
    fun addPatient(name: String, age: Int, gender: String, email: String, phone: String, risk: String, specialty: String) {
        viewModelScope.launch {
            val id = repository.insertPatient(
                Patient(
                    name = name,
                    age = age,
                    gender = gender,
                    email = email,
                    phone = phone,
                    riskStatus = risk,
                    specialty = specialty
                )
            )
            logAudit("Patient Created", "Added patient $name with ID $id and Risk $risk")
            
            // Add a welcome SOAP Note placeholder
            repository.insertClinicalNote(
                ClinicalNote(
                    patientId = id,
                    title = "Intake Note Reference",
                    noteType = "GENERAL",
                    bodyJson = "Patient $name enrolled in clinic. Initial diagnostic consideration: $specialty. Assigned Risk Profile: $risk."
                )
            )
        }
    }

    fun addAppointment(patientId: Long, patientName: String, dateTime: String, notes: String, isVideo: Boolean, fee: Double) {
        viewModelScope.launch {
            val randomNum = (100..999).random()
            val code = if (isVideo) "PSY-PYR-$randomNum" else "OFFLINE"
            val id = repository.insertAppointment(
                Appointment(
                    patientId = patientId,
                    patientName = patientName,
                    dateTime = dateTime,
                    notes = notes,
                    fee = fee,
                    isVideo = isVideo,
                    code = code,
                    status = "Scheduled"
                )
            )
            logAudit("Scheduled Appointment", "Appointment scheduled for $patientName on $dateTime (Appt ID: $id)")
        }
    }

    fun conductAppointment(appointmentId: Long, status: String) {
        viewModelScope.launch {
            appointments.value.firstOrNull { it.id == appointmentId }?.let { appt ->
                val updated = appt.copy(status = status)
                repository.updateAppointment(updated)
                logAudit("Appointment Complete", "Managed appointment ID $appointmentId with status: $status")
            }
        }
    }

    fun deleteAppointment(id: Long) {
        viewModelScope.launch {
            repository.deleteAppointmentById(id)
            logAudit("Cancelled Appointment", "Cancelled appointment ID $id")
        }
    }

    fun addClinicalNote(patientId: Long, title: String, type: String, bodyHtml: String, isRiskAlert: Boolean = false) {
        viewModelScope.launch {
            repository.insertClinicalNote(
                ClinicalNote(
                    patientId = patientId,
                    title = title,
                    noteType = type,
                    bodyJson = bodyHtml,
                    isRiskAlert = isRiskAlert
                )
            )
            logAudit("Added Clinical Note", "Saved a new $type notes file for Patient ID $patientId. Risk status flagged: $isRiskAlert")
        }
    }

    fun addAssessmentScore(patientId: Long, type: String, score: Int, details: String) {
        viewModelScope.launch {
            repository.insertScore(
                AssessmentScore(
                    patientId = patientId,
                    type = type,
                    score = score,
                    details = details
                )
            )
            logAudit("Logged Assessment", "Added auto-scored $type with value $score ($details) to Patient ID $patientId")
        }
    }

    fun addMoodLog(score: Int, note: String, gratitude: String, breathingSec: Int) {
        viewModelScope.launch {
            repository.insertMoodLog(
                MoodLog(
                    moodScore = score,
                    moodNote = note,
                    gratitude = gratitude,
                    breathingSeconds = breathingSec
                )
            )
        }
    }

    // --- AI Operations using direct Gemini API service ---
    
    // 1. Session SOAP Note Generation
    fun triggerAiSoapNote(transcript: String, patientId: Long) {
        viewModelScope.launch {
            _isAiLoading.value = true
            _aiResultText.value = "AI Clinical Copilot is running SOAP compilation engine..."
            logAudit("AI Request Init", "Triggered SOAP generator for patient ID: $patientId")
            
            val systemInstruction = "You are a psychiatric clinical assistant. Convert conversational session transcripts into a formal medical SOAP note. Maintain full clinical clarity and use professional vocabularies."
            val prompt = """
                Compile the following session conversation transcript into a structured, formal healthcare SOAP note.
                Include SUBJECTIVE, OBJECTIVE, ASSESSMENT, and PLAN. Keep and suggest matching diagnoses (such as DSM-5/ICD-10 codes) based on indicators.
                
                Transcript:
                "$transcript"
            """.trimIndent()
            
            val result = GeminiService.callGemini(prompt, systemInstruction)
            _aiResultText.value = result
            _isAiLoading.value = false
            
            // Automatically insert the clinical SOAP note into database
            repository.insertClinicalNote(
                ClinicalNote(
                    patientId = patientId,
                    title = "AI SOAP Copilot Output",
                    noteType = "SOAP",
                    bodyJson = result,
                    isRiskAlert = transcript.contains("hurt") || transcript.contains("suicide") || transcript.contains("die")
                )
            )
            logAudit("AI Soap Generation Success", "Saved AI Generated SOAP note to database for patientId $patientId")
        }
    }

    // 2. Structured MSE Narrative compiler
    fun triggerAiMseNarrative(
        patientId: Long,
        appearance: String,
        behavior: String,
        speech: String,
        mood: String,
        attention: String,
        insight: Int,
        judgment: String,
        notes: String
    ) {
        viewModelScope.launch {
            _isAiLoading.value = true
            _aiResultText.value = "AI compile engine writing structured Mental Status Examination narrative..."
            logAudit("MSE Narrative Request", "Compiling MSE Narrative for Patient ID: $patientId")

            val prompt = """
                Synthesize the following mental status exam checklist ratings and brief annotations into a single, cohesive, formal psychiatric clinical narrative paragraph (Mental Status Examination narrative block). Avoid list bullets in output, write in continuous prose style.
                
                Ratings:
                * Appearance/Attire: $appearance
                * Behavior/Cooperation: $behavior
                * Speech Patterns: $speech
                * Patient mood/affect: $mood
                * Attention: $attention
                * Insight Rating: Grade $insight / 6
                * Clinical Judgment: $judgment
                * Descriptive annotations: $notes
            """.trimIndent()

            val result = GeminiService.callGemini(prompt, "You are an expert clinical psychologist writing formal Mental Status Exam summaries.")
            _aiResultText.value = result
            _isAiLoading.value = false

            // Save Note to Database
            repository.insertClinicalNote(
                ClinicalNote(
                    patientId = patientId,
                    title = "Mental Status Exam Narrative",
                    noteType = "MSE",
                    bodyJson = "Mental Status Examination (Structured Narrative):\n\n$result\n\n[Checklist Details]\nAppearance: $appearance | Behavior: $behavior | Speech: $speech | Mood: $mood | Insight: Grade $insight | Judgment: $judgment"
                )
            )
            logAudit("MSE Summary Saved", "Saved completed MSE narrative to database.")
        }
    }

    // 3. Diagnostic Assistance support (DSM-5 & ICD-10 suggestions)
    fun triggerDiagnosticAssistant(symptoms: String, mseFindings: String) {
        viewModelScope.launch {
            _isAiLoading.value = true
            _aiResultText.value = "Diagnostic engine scanning DSM-5-TR guidelines..."
            logAudit("Diagnostic Assistance Request", "Symptoms analyzed: ${symptoms.take(30)}...")

            val localResults = _localDiagnosticResults.value
            val localResultsFormatted = if (localResults.isEmpty()) {
                "No definitive matching criteria met locally."
            } else {
                localResults.joinToString("\n") { 
                    "- ${it.disorderName} (${it.code}): Confidence=${it.confidence}. Details: ${it.explanation}" 
                }
            }

            val prompt = """
                Provide differential medical diagnoses and probable classifications based on these indicators:
                
                Symptomatology:
                "$symptoms"
                
                Direct MSE Indicators:
                "$mseFindings"
                
                Local Rule-Based Evaluation Results:
                $localResultsFormatted
                
                Please take the Local Rule-Based Evaluation Results into account. Validate if the local rules correctly identified the criteria constraints (for MDD, GAD, or mock disorders) and provide a comprehensive differential diagnosis report. 
                Include DSM-5-TR and ICD-10 codes, DSM criteria checklist matching, comorbidities, and confidence indicators (High, Moderate, Low). Include clinical disclaimers.
            """.trimIndent()

            val result = GeminiService.callGemini(prompt, "You are a psychiatric diagnostic advisor.")
            _aiResultText.value = result
            _isAiLoading.value = false
            logAudit("Diagnostic Model Evaluated", "Suggested DSM codes for user criteria using hybrid local context.")
        }
    }


    // 4. SMART Goal generator
    fun triggerSmartTreatmentPlanner(goal: String, description: String, patientId: Long) {
        viewModelScope.launch {
            _isAiLoading.value = true
            _aiResultText.value = "CBT Planner compiler framing SMART targets..."
            logAudit("Treatment Planner Request", "Goal: $goal")

            val prompt = """
                Convert this basic mental health therapy goal into a comprehensive clinical treatment plan following clinical standards:
                
                Goal: "$goal"
                Context: "$description"
                
                Output:
                1. Specific, Measurable, Achievable, Relevant, and Time-bound (SMART) Goal configuration.
                2. Evidence-Based Clinical Interventions.
                3. Concrete patient homework assignment tasks.
                4. Measurable therapy progress tracking milestones.
            """.trimIndent()

            val result = GeminiService.callGemini(prompt, "You are a cognitive behavioral therapist (CBT) treatment planner.")
            _aiResultText.value = result
            _isAiLoading.value = false

            // Save clinical Note to Database
            repository.insertClinicalNote(
                ClinicalNote(
                    patientId = patientId,
                    title = "Treatment Plan: $goal",
                    noteType = "PLAN",
                    bodyJson = result
                )
            )
            logAudit("Treatment Plan Locked", "Assigned goal-treatment schema to database.")
        }
    }

    // 5. Automated Suicide & Severe Risk Detector
    fun triggerRiskAnalysis(text: String, onRiskDetected: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            _isAiLoading.value = true
            logAudit("Safety Evaluation", "Screening patient material for suicide/crisis safety triggers.")

            val prompt = """
                Perform clinical risk screening of this text:
                "$text"
                
                Identify and evaluate:
                1. Suicide risk indicators or active plan.
                2. Imminent crisis indicators.
                3. Severe mental/cognitive deterioration markers.
                
                Are there severe safety concerns? Respond strictly with YES if there are suicidal intentions/crisis signs, or NO otherwise. Add a brief assessment detail.
            """.trimIndent()

            val result = GeminiService.callGemini(prompt, "You are a medical safety evaluation core.")
            _isAiLoading.value = false
            
            val isSevere = result.contains("YES") || result.contains("critical") || result.contains("severe")
            onRiskDetected(isSevere, result)
            logAudit("Safety Evaluation Completed", "Risk identified status: $isSevere.")
        }
    }

    // 6. Clinical Knowledge Search (DSM/ICD guidance helper)
    fun triggerClinicalSearch(query: String) {
        viewModelScope.launch {
            _isAiLoading.value = true
            _aiResultText.value = "Querying clinical knowledge indexes..."
            logAudit("Knowledge Base Query", "Query: $query")

            val prompt = """
                Search clinical archives and academic summaries for this inquiry:
                "$query"
                
                Deliver relevant Diagnostic Criteria, ICD billing codes, guidelines and scientific consensus recommendations in a brief, premium summary.
            """.trimIndent()

            val result = GeminiService.callGemini(prompt, "You are an AI Clinical Librarian powered by PsyPyrus Knowledge base.")
            _aiResultText.value = result
            _isAiLoading.value = false
            logAudit("Search Archive Completed", "Delivered academic summary for query: $query")
        }
    }

    // Helper to clear AI results in UI
    fun clearAiOutput() {
        _aiResultText.value = ""
    }

    // Homework Management Methods
    fun addHomework(description: String) {
        if (description.isBlank()) return
        viewModelScope.launch {
            val patientId = _selectedPatientId.value
            val task = HomeworkTask(patientId = patientId, description = description)
            val id = repository.insertHomework(task)
            logAudit("Homework Assigned", "Assigned task '$description' to Patient ID $patientId (Task ID: $id)")
        }
    }

    fun toggleHomeworkStatus(task: HomeworkTask) {
        viewModelScope.launch {
            val updated = task.copy(isCompleted = !task.isCompleted)
            repository.updateHomework(updated)
            logAudit("Homework Status Toggled", "Toggled task ID ${task.id} to isCompleted: ${updated.isCompleted}")
        }
    }

    fun deleteHomework(id: Long) {
        viewModelScope.launch {
            repository.deleteHomeworkById(id)
            logAudit("Homework Deleted", "Deleted homework task ID $id")
        }
    }

    // Live Clinical Trials Search
    fun fetchClinicalTrialsForActivePatient() {
        val patientId = _selectedPatientId.value
        val patient = patients.value.firstOrNull { it.id == patientId } ?: return
        viewModelScope.launch {
            _isTrialsLoading.value = true
            logAudit("Query Clinical Trials", "Searching ClinicalTrials.gov studies for condition: ${patient.specialty}")
            val condition = when {
                patient.specialty.lowercase().contains("depres") -> "Major Depressive Disorder"
                patient.specialty.lowercase().contains("anxiety") -> "Generalized Anxiety Disorder"
                patient.specialty.lowercase().contains("adhd") -> "ADHD"
                patient.specialty.lowercase().contains("ptsd") -> "PTSD"
                else -> patient.specialty
            }
            val results = ClinicalTrialsService.fetchActiveTrials(condition)
            _clinicalTrials.value = results
            _isTrialsLoading.value = false
            logAudit("Clinical Trials Search Success", "Retrieved ${results.size} active studies for $condition")
        }
    }
}
