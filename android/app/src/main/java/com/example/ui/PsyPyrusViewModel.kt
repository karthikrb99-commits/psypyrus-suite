package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import org.json.JSONObject
import org.json.JSONArray

class PsyPyrusViewModel(application: Application) : AndroidViewModel(application) {
    private val db = AppDatabase.getDatabase(application)
    private val repository = PsyPyrusRepository(db)

    // Custom Diagnostics and Trials Integration
    private val _clinicalTrials = MutableStateFlow<List<ClinicalTrialStudy>>(emptyList())
    val clinicalTrials: StateFlow<List<ClinicalTrialStudy>> = _clinicalTrials.asStateFlow()

    private val _isTrialsLoading = MutableStateFlow(false)
    val isTrialsLoading: StateFlow<Boolean> = _isTrialsLoading.asStateFlow()

    private val _localDiagnosticResults = MutableStateFlow<List<LocalDiagnosticResult>>(emptyList())
    val localDiagnosticResults: StateFlow<List<LocalDiagnosticResult>> = _localDiagnosticResults.asStateFlow()

    private val _icdSearchResults = MutableStateFlow<List<IcdSearchResult>>(emptyList())
    val icdSearchResults: StateFlow<List<IcdSearchResult>> = _icdSearchResults.asStateFlow()

    private val _isIcdLoading = MutableStateFlow(false)
    val isIcdLoading: StateFlow<Boolean> = _isIcdLoading.asStateFlow()


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

    val availabilitySlots: StateFlow<List<AvailabilitySlot>> = repository.availabilitySlots
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allNotes: StateFlow<List<ClinicalNote>> = repository.allNotes
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allScores: StateFlow<List<AssessmentScore>> = repository.allScores
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val moodLogs: StateFlow<List<MoodLog>> = repository.moodLogs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val auditLogs: StateFlow<List<SecurityAuditLog>> = repository.auditLogs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allHomework: StateFlow<List<Homework>> = repository.allHomework
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allMedications: StateFlow<List<Medication>> = repository.allMedications
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allAdherenceLogs: StateFlow<List<AdherenceLog>> = repository.allAdherenceLogs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val scratchpadNotes: StateFlow<List<ScratchpadNote>> = repository.scratchpadNotes
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _loggedInUser = MutableStateFlow<UserAccount?>(null)
    val loggedInUser: StateFlow<UserAccount?> = _loggedInUser.asStateFlow()

    // UI state for Gemini AI Operations
    private val _aiResultText = MutableStateFlow("")
    val aiResultText: StateFlow<String> = _aiResultText.asStateFlow()

    private val _isAiLoading = MutableStateFlow(false)
    val isAiLoading: StateFlow<Boolean> = _isAiLoading.asStateFlow()

    // UI state for Crisis Intervention De-escalation guidelines
    private val _aiCrisisGuidelines = MutableStateFlow("")
    val aiCrisisGuidelines: StateFlow<String> = _aiCrisisGuidelines.asStateFlow()

    private val _isCrisisAiLoading = MutableStateFlow(false)
    val isCrisisAiLoading: StateFlow<Boolean> = _isCrisisAiLoading.asStateFlow()

    // UI state for Proactive Patient Insights
    private val _proactiveInsights = MutableStateFlow("")
    val proactiveInsights: StateFlow<String> = _proactiveInsights.asStateFlow()

    private val _isInsightsLoading = MutableStateFlow(false)
    val isInsightsLoading: StateFlow<Boolean> = _isInsightsLoading.asStateFlow()

    // Crisis Alert dismissal tracking state
    private val _dismissedAlertIds = MutableStateFlow<Set<String>>(emptySet())
    val dismissedAlertIds: StateFlow<Set<String>> = _dismissedAlertIds.asStateFlow()

    // Biometric security login status
    private val _isBiometricVerified = MutableStateFlow(true) // Start authenticated for smooth preview, let user "lock" or "verify"
    val isBiometricVerified: StateFlow<Boolean> = _isBiometricVerified.asStateFlow()

    // Currently selected patient for clinical activities (defaults to patient 1 or first available)
    private val _selectedPatientId = MutableStateFlow<Long>(1L)
    val selectedPatientId: StateFlow<Long> = _selectedPatientId.asStateFlow()

    // --- CUSTOM CREDENTIALS & INTEGRATIONS DATA STATE ---
    private val sharedPrefs = application.getSharedPreferences("psypyrus_settings", android.content.Context.MODE_PRIVATE)

    private val _customGeminiKey = MutableStateFlow(sharedPrefs.getString("gemini_api_key", "") ?: "")
    val customGeminiKey = _customGeminiKey.asStateFlow()

    private val _customOpenAiKey = MutableStateFlow(sharedPrefs.getString("openai_api_key", "") ?: "")
    val customOpenAiKey = _customOpenAiKey.asStateFlow()

    private val _customLlmUrl = MutableStateFlow(sharedPrefs.getString("llm_custom_url", "https://api.openai.com/v1/chat/completions") ?: "https://api.openai.com/v1/chat/completions")
    val customLlmUrl = _customLlmUrl.asStateFlow()

    private val _activeProvider = MutableStateFlow(sharedPrefs.getInt("active_provider", 0))
    val activeProvider = _activeProvider.asStateFlow()

    private val _customIcdClientId = MutableStateFlow(sharedPrefs.getString("icd_client_id", "") ?: "")
    val customIcdClientId = _customIcdClientId.asStateFlow()

    private val _customIcdClientSecret = MutableStateFlow(sharedPrefs.getString("icd_client_secret", "") ?: "")
    val customIcdClientSecret = _customIcdClientSecret.asStateFlow()

    fun saveApiSettings(geminiKey: String, openAiKey: String, customUrl: String, provider: Int) {
        sharedPrefs.edit().apply {
            putString("gemini_api_key", geminiKey)
            putString("openai_api_key", openAiKey)
            putString("llm_custom_url", customUrl)
            putInt("active_provider", provider)
            apply()
        }
        _customGeminiKey.value = geminiKey
        _customOpenAiKey.value = openAiKey
        _customLlmUrl.value = customUrl
        _activeProvider.value = provider
        
        GeminiService.customGeminiKey = geminiKey
        GeminiService.customOpenAiKey = openAiKey
        GeminiService.customLlmUrl = customUrl
        GeminiService.activeProvider = provider
        
        logAudit("API Credentials Updated", "Updated custom AI integration settings (Provider: $provider)")
    }

    fun saveIcdSettings(clientId: String, clientSecret: String) {
        sharedPrefs.edit().apply {
            putString("icd_client_id", clientId)
            putString("icd_client_secret", clientSecret)
            apply()
        }
        _customIcdClientId.value = clientId
        _customIcdClientSecret.value = clientSecret
        
        IcdService.customClientId = clientId
        IcdService.customClientSecret = clientSecret
        
        logAudit("ICD-11 Credentials Updated", "Updated custom WHO ICD-11 integration settings.")
    }

    fun searchIcd11(query: String) {
        viewModelScope.launch {
            _isIcdLoading.value = true
            logAudit("ICD-11 Search Initiated", "Querying ICD-11 registry for: $query")
            try {
                val results = IcdService.searchIcd11(query)
                _icdSearchResults.value = results
            } catch (e: Exception) {
                _icdSearchResults.value = emptyList()
                logAudit("ICD-11 Search Error", "Error: ${e.localizedMessage}")
            } finally {
                _isIcdLoading.value = false
            }
        }
    }

    // --- CLINICAL DATABASE RESTORE / EXPORT SYSTEM ---
    fun exportBackupJson(): String {
        try {
            val root = JSONObject()
            
            // Patients
            val patientsArray = JSONArray()
            patients.value.forEach { p ->
                patientsArray.put(JSONObject().apply {
                    put("id", p.id)
                    put("name", p.name)
                    put("age", p.age)
                    put("gender", p.gender)
                    put("email", p.email)
                    put("phone", p.phone)
                    put("riskStatus", p.riskStatus)
                    put("specialty", p.specialty)
                    put("registrationDate", p.registrationDate)
                })
            }
            root.put("patients", patientsArray)
            
            // Notes
            val notesArray = JSONArray()
            allNotes.value.forEach { n ->
                notesArray.put(JSONObject().apply {
                    put("id", n.id)
                    put("patientId", n.patientId)
                    put("title", n.title)
                    put("noteType", n.noteType)
                    put("bodyJson", n.bodyJson)
                    put("timestamp", n.timestamp)
                    put("isRiskAlert", n.isRiskAlert)
                })
            }
            root.put("notes", notesArray)

            // Mood Logs
            val moodArray = JSONArray()
            moodLogs.value.forEach { m ->
                moodArray.put(JSONObject().apply {
                    put("id", m.id)
                    put("patientId", m.patientId)
                    put("moodScore", m.moodScore)
                    put("moodNote", m.moodNote)
                    put("gratitude", m.gratitude)
                    put("breathingSeconds", m.breathingSeconds)
                    put("date", m.date)
                })
            }
            root.put("moodLogs", moodArray)

            // Assessment Scores
            val scoresArray = JSONArray()
            allScores.value.forEach { s ->
                scoresArray.put(JSONObject().apply {
                    put("id", s.id)
                    put("patientId", s.patientId)
                    put("type", s.type)
                    put("score", s.score)
                    put("details", s.details)
                    put("date", s.date)
                })
            }
            root.put("assessmentScores", scoresArray)

            // Homework
            val hwArray = JSONArray()
            allHomework.value.forEach { h ->
                hwArray.put(JSONObject().apply {
                    put("id", h.id)
                    put("patientId", h.patientId)
                    put("patientName", h.patientName)
                    put("title", h.title)
                    put("description", h.description)
                    put("dueDate", h.dueDate)
                    put("status", h.status)
                    put("patientNotes", h.patientNotes)
                    put("professionalFeedback", h.professionalFeedback)
                    put("assignedDate", h.assignedDate)
                })
            }
            root.put("homework", hwArray)

            // Medications
            val rxArray = JSONArray()
            allMedications.value.forEach { rx ->
                rxArray.put(JSONObject().apply {
                    put("id", rx.id)
                    put("patientId", rx.patientId)
                    put("patientName", rx.patientName)
                    put("name", rx.name)
                    put("dosage", rx.dosage)
                    put("frequency", rx.frequency)
                    put("purpose", rx.purpose)
                    put("instructions", rx.instructions)
                    put("startDate", rx.startDate)
                    put("durationDays", rx.durationDays)
                    put("isActive", rx.isActive)
                    put("prescribedBy", rx.prescribedBy)
                })
            }
            root.put("medications", rxArray)

            // Adherence Logs
            val adherenceArray = JSONArray()
            allAdherenceLogs.value.forEach { a ->
                adherenceArray.put(JSONObject().apply {
                    put("id", a.id)
                    put("medicationId", a.medicationId)
                    put("patientId", a.patientId)
                    put("status", a.status)
                    put("dateString", a.dateString)
                    put("timestamp", a.timestamp)
                })
            }
            root.put("adherenceLogs", adherenceArray)

            return root.toString(2)
        } catch (e: Exception) {
            return "{\"error\": \"${e.localizedMessage}\"}"
        }
    }

    fun importBackupJson(jsonString: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val root = JSONObject(jsonString)
                
                // Parse Patients
                val patientsArray = root.optJSONArray("patients")
                if (patientsArray != null) {
                    for (i in 0 until patientsArray.length()) {
                        val p = patientsArray.getJSONObject(i)
                        repository.insertPatient(Patient(
                            id = p.optLong("id", 0).takeIf { it != 0L } ?: continue,
                            name = p.optString("name", "Unknown"),
                            age = p.optInt("age", 30),
                            gender = p.optString("gender", "Other"),
                            email = p.optString("email", ""),
                            phone = p.optString("phone", ""),
                            riskStatus = p.optString("riskStatus", "Green"),
                            specialty = p.optString("specialty", ""),
                            registrationDate = p.optLong("registrationDate", System.currentTimeMillis())
                        ))
                    }
                }
                
                // Parse Clinical Notes
                val notesArray = root.optJSONArray("notes")
                if (notesArray != null) {
                    for (i in 0 until notesArray.length()) {
                        val n = notesArray.getJSONObject(i)
                        repository.insertClinicalNote(ClinicalNote(
                            id = n.optLong("id", 0).takeIf { it != 0L } ?: continue,
                            patientId = n.optLong("patientId", 1L),
                            title = n.optString("title", "Clinical Note"),
                            noteType = n.optString("noteType", "SOAP"),
                            bodyJson = n.optString("bodyJson", ""),
                            timestamp = n.optLong("timestamp", System.currentTimeMillis()),
                            isRiskAlert = n.optBoolean("isRiskAlert", false)
                        ))
                    }
                }

                // Parse Mood Logs
                val moodArray = root.optJSONArray("moodLogs")
                if (moodArray != null) {
                    for (i in 0 until moodArray.length()) {
                        val m = moodArray.getJSONObject(i)
                        repository.insertMoodLog(MoodLog(
                            id = m.optLong("id", 0).takeIf { it != 0L } ?: continue,
                            patientId = m.optLong("patientId", 1L),
                            moodScore = m.optInt("moodScore", 5),
                            moodNote = m.optString("moodNote", ""),
                            gratitude = m.optString("gratitude", ""),
                            breathingSeconds = m.optInt("breathingSeconds", 0),
                            date = m.optLong("date", System.currentTimeMillis())
                        ))
                    }
                }

                // Parse Assessment Scores
                val scoresArray = root.optJSONArray("assessmentScores")
                if (scoresArray != null) {
                    for (i in 0 until scoresArray.length()) {
                        val s = scoresArray.getJSONObject(i)
                        repository.insertScore(AssessmentScore(
                            id = s.optLong("id", 0).takeIf { it != 0L } ?: continue,
                            patientId = s.optLong("patientId", 1L),
                            type = s.optString("type", "PHQ-9"),
                            score = s.optInt("score", 0),
                            details = s.optString("details", ""),
                            date = s.optLong("date", System.currentTimeMillis())
                        ))
                    }
                }

                // Parse Homework
                val hwArray = root.optJSONArray("homework")
                if (hwArray != null) {
                    for (i in 0 until hwArray.length()) {
                        val h = hwArray.getJSONObject(i)
                        repository.insertHomework(Homework(
                            id = h.optLong("id", 0).takeIf { it != 0L } ?: continue,
                            patientId = h.optLong("patientId", 1L),
                            patientName = h.optString("patientName", "Unknown"),
                            title = h.optString("title", ""),
                            description = h.optString("description", ""),
                            dueDate = h.optString("dueDate", "15 Jun, 2026"),
                            status = h.optString("status", "Assigned"),
                            patientNotes = h.optString("patientNotes", ""),
                            professionalFeedback = h.optString("professionalFeedback", ""),
                            assignedDate = h.optLong("assignedDate", System.currentTimeMillis())
                        ))
                    }
                }

                // Parse Medications
                val rxArray = root.optJSONArray("medications")
                if (rxArray != null) {
                    for (i in 0 until rxArray.length()) {
                        val rx = rxArray.getJSONObject(i)
                        repository.insertMedication(Medication(
                            id = rx.optLong("id", 0).takeIf { it != 0L } ?: continue,
                            patientId = rx.optLong("patientId", 1L),
                            patientName = rx.optString("patientName", "Unknown"),
                            name = rx.optString("name", ""),
                            dosage = rx.optString("dosage", ""),
                            frequency = rx.optString("frequency", ""),
                            purpose = rx.optString("purpose", ""),
                            instructions = rx.optString("instructions", ""),
                            startDate = rx.optString("startDate", ""),
                            durationDays = rx.optInt("durationDays", 30),
                            isActive = rx.optBoolean("isActive", true),
                            prescribedBy = rx.optString("prescribedBy", "Unknown")
                        ))
                    }
                }

                logAudit("Database Restore Hooked", "Successfully imported JSON data into standard EHR tables.")
                onSuccess()
            } catch (e: Exception) {
                logAudit("Database Restore Failed", "Error parsing import payload: ${e.localizedMessage}")
                onError(e.localizedMessage ?: "Unknown JSON syntax error")
            }
        }
    }

    init {
        // Hydrate GeminiService with loaded parameters
        GeminiService.customGeminiKey = _customGeminiKey.value
        GeminiService.customOpenAiKey = _customOpenAiKey.value
        GeminiService.customLlmUrl = _customLlmUrl.value
        GeminiService.activeProvider = _activeProvider.value

        IcdService.customClientId = _customIcdClientId.value
        IcdService.customClientSecret = _customIcdClientSecret.value

        // Pre-populate Database if empty to provide high-fidelity out-of-the-box clinical profiles
        viewModelScope.launch {
            repository.patients.first().let { currentPatients ->
                if (currentPatients.isEmpty()) {
                    populateInitialData()
                }
            }
            // Always ensure default user accounts exist for seamless testing
            repository.allUserAccounts.first().let { accounts ->
                if (accounts.isEmpty()) {
                    repository.insertUserAccount(
                        UserAccount(
                            username = "doctor",
                            email = "doctor@psy.com",
                            passwordPlain = "doctor123",
                            role = "Professional",
                            fullName = "Dr. Katherine Brewster",
                            licenseOrId = "PSY-99281-OS",
                            specialty = "Clinical Psychologist",
                            bio = "Dedicated clinical psychologist with over 12 years of experience. Specializes in advanced Cognitive Behavioral Therapy (CBT), chronic anxiety disorders, grief counseling, and dynamic depression management schemes.",
                            experienceYears = 12,
                            clinicAddress = "Oceanic Health Center, Suite 4B, Seattle",
                            consultationFee = 165.0,
                            rating = 4.9,
                            availableHours = "09:00 AM - 04:00 PM",
                            languagesSpoken = "English, French"
                        )
                    )
                    repository.insertUserAccount(
                        UserAccount(
                            username = "marcus",
                            email = "marcus@psy.com",
                            passwordPlain = "doctor123",
                            role = "Professional",
                            fullName = "Dr. Marcus Vance",
                            licenseOrId = "MD-33041-PSY",
                            specialty = "Neurodevelopment & ADHD Expert",
                            bio = "Double-board certified adult psychiatrist. Focuses intensely on holistic ADHD tracking, clinical neurodivergence coping mechanics, executive dysfunction therapies, and medication consultation workflows.",
                            experienceYears = 15,
                            clinicAddress = "Pinecrest Psychiatric Suites, Chicago",
                            consultationFee = 210.0,
                            rating = 4.8,
                            availableHours = "10:00 AM - 06:00 PM",
                            languagesSpoken = "English"
                        )
                    )
                    repository.insertUserAccount(
                        UserAccount(
                            username = "elena",
                            email = "elena@psy.com",
                            passwordPlain = "doctor123",
                            role = "Professional",
                            fullName = "Dr. Elena Rostova",
                            licenseOrId = "LCSW-88931",
                            specialty = "Anxiety & PTSD Specialist",
                            bio = "Passionate clinical therapist specializing in trauma recovery. Certified in EMDR, somatic processing, and coping mechanism creation for complex distress, panic attacks, and sleep-related anxieties.",
                            experienceYears = 8,
                            clinicAddress = "Greenwood Wellness Pavilion, Austin",
                            consultationFee = 130.0,
                            rating = 4.7,
                            availableHours = "08:00 AM - 03:00 PM",
                            languagesSpoken = "English, Spanish, Russian"
                        )
                    )
                    repository.insertUserAccount(
                        UserAccount(
                            username = "tyler",
                            email = "tyler@psy.com",
                            passwordPlain = "doctor123",
                            role = "Professional",
                            fullName = "Dr. Tyler Finch",
                            licenseOrId = "LMFT-51120",
                            specialty = "Mindfulness & CBT Counselor",
                            bio = "Counselor focused on young adults experiencing stress, life transitions, and mild to moderate anxiety. Employs a cheerful, collaborative mindfulness and Acceptance and Commitment Therapy (ACT) style.",
                            experienceYears = 6,
                            clinicAddress = "Downtown Counseling Center, Denver",
                            consultationFee = 95.0,
                            rating = 4.6,
                            availableHours = "11:00 AM - 07:00 PM",
                            languagesSpoken = "English"
                        )
                    )
                    repository.insertUserAccount(
                        UserAccount(
                            username = "patient",
                            email = "liam@patient.com",
                            passwordPlain = "patient123",
                            role = "Patient",
                            fullName = "Liam Carter",
                            licenseOrId = "CHART-20921",
                            specialty = ""
                        )
                    )
                }
            }
            populatePeerSupportDefaults()
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
        repository.insertMoodLog(MoodLog(patientId = liamId, moodScore = 2, moodNote = "🚨 CRISIS: Extreme depressive shutdown today. Feeling completely helpless and unable to get out of bed. Intrusive hopeless thoughts.", gratitude = "", breathingSeconds = 0, date = System.currentTimeMillis() - 3600000))
        repository.insertMoodLog(MoodLog(moodScore = 4, moodNote = "Feeling standard stress at startup job", gratitude = "Grateful for good coffee", breathingSeconds = 120, date = System.currentTimeMillis() - 86400000 * 5))
        repository.insertMoodLog(MoodLog(moodScore = 5, moodNote = "Calmer after talking with friend", gratitude = "Sunny weather", breathingSeconds = 240, date = System.currentTimeMillis() - 86400000 * 4))
        repository.insertMoodLog(MoodLog(moodScore = 6, moodNote = "Completed all morning tasks successfully", gratitude = "Quiet workspace", breathingSeconds = 300, date = System.currentTimeMillis() - 86400000 * 3))
        repository.insertMoodLog(MoodLog(moodScore = 5, moodNote = "Tired post mid-week evaluations", gratitude = "Nice support from therapist", breathingSeconds = 180, date = System.currentTimeMillis() - 86400000 * 2))
        repository.insertMoodLog(MoodLog(moodScore = 8, moodNote = "Amazing breathing exercise session, felt totally weightless!", gratitude = "Meditation music", breathingSeconds = 480, date = System.currentTimeMillis() - 86400000))
        repository.insertMoodLog(MoodLog(moodScore = 7, moodNote = "Feeling focused on wellness routine", gratitude = "Woke up early", breathingSeconds = 240, date = System.currentTimeMillis()))

        // Insert initial Homework tasks
        repository.insertHomework(
            Homework(
                patientId = liamId,
                patientName = "Liam Carter",
                title = "Gratitude Journaling",
                description = "Outline 3 distinct triggers of pleasant affect each morning, and note somatic responses.",
                dueDate = "12 Jun, 2026",
                status = "In Progress",
                patientNotes = "I felt okay on Tue when writing. Wed was harder."
            )
        )
        repository.insertHomework(
            Homework(
                patientId = sarahId,
                patientName = "Sarah Jenkins",
                title = "Cognitive Restructuring Log",
                description = "Complete 3 thought record sheets identifying automatic hot thoughts and generating rational alternatives.",
                dueDate = "15 Jun, 2026",
                status = "Assigned",
                patientNotes = ""
            )
        )
        repository.insertHomework(
            Homework(
                patientId = johnId,
                patientName = "John Doe",
                title = "Executive Focus Pomodoro Logs",
                description = "Perform at least five 25-minute quiet deep work task blocks daily and log task completions.",
                dueDate = "16 Jun, 2026",
                status = "Completed",
                patientNotes = "Completed 18 Pomodoro blocks over 3 days. Extremely helpful context!"
            )
        )

        // Insert initial medications
        val med1 = repository.insertMedication(
            Medication(
                patientId = liamId,
                patientName = "Liam Carter",
                name = "Sertraline",
                dosage = "50mg",
                frequency = "Once daily (Morning)",
                purpose = "Anxiety / Major Depression",
                instructions = "Take with breakfast. Monitor mood changes.",
                startDate = "01 Jun, 2026",
                durationDays = 60,
                isActive = true
            )
        )
        val med2 = repository.insertMedication(
            Medication(
                patientId = sarahId,
                patientName = "Sarah Jenkins",
                name = "Escitalopram",
                dosage = "10mg",
                frequency = "Once daily (Evening)",
                purpose = "Generalized Anxiety Disorder",
                instructions = "Take before bed. Avoid alcohol.",
                startDate = "28 May, 2026",
                durationDays = 30,
                isActive = true
            )
        )
        val med3 = repository.insertMedication(
            Medication(
                patientId = johnId,
                patientName = "John Doe",
                name = "Methylphenidate ER",
                dosage = "36mg",
                frequency = "Once daily (Morning)",
                purpose = "Executive Focus / ADHD",
                instructions = "Do not crush. Take immediately upon waking.",
                startDate = "02 Jun, 2026",
                durationDays = 30,
                isActive = true
            )
        )

        // Insert initial adherence logs for the last 5 days
        val datesList = listOf("05 Jun, 2026", "06 Jun, 2026", "07 Jun, 2026", "08 Jun, 2026", "09 Jun, 2026")
        // Liam Carter: 4 Taken, 1 Missed
        repository.insertAdherenceLog(AdherenceLog(medicationId = med1, patientId = liamId, dateString = datesList[0], status = "Taken"))
        repository.insertAdherenceLog(AdherenceLog(medicationId = med1, patientId = liamId, dateString = datesList[1], status = "Taken"))
        repository.insertAdherenceLog(AdherenceLog(medicationId = med1, patientId = liamId, dateString = datesList[2], status = "Missed"))
        repository.insertAdherenceLog(AdherenceLog(medicationId = med1, patientId = liamId, dateString = datesList[3], status = "Taken"))
        repository.insertAdherenceLog(AdherenceLog(medicationId = med1, patientId = liamId, dateString = datesList[4], status = "Taken"))

        // Sarah Jenkins: 5 Taken (100% adherence)
        datesList.forEach { dateStr ->
            repository.insertAdherenceLog(AdherenceLog(medicationId = med2, patientId = sarahId, dateString = dateStr, status = "Taken"))
        }

        // John Doe: 3 Taken, 2 Missed (60%)
        repository.insertAdherenceLog(AdherenceLog(medicationId = med3, patientId = johnId, dateString = datesList[0], status = "Taken"))
        repository.insertAdherenceLog(AdherenceLog(medicationId = med3, patientId = johnId, dateString = datesList[1], status = "Missed"))
        repository.insertAdherenceLog(AdherenceLog(medicationId = med3, patientId = johnId, dateString = datesList[2], status = "Taken"))
        repository.insertAdherenceLog(AdherenceLog(medicationId = med3, patientId = johnId, dateString = datesList[3], status = "Missed"))
        repository.insertAdherenceLog(AdherenceLog(medicationId = med3, patientId = johnId, dateString = datesList[4], status = "Taken"))

        // Insert initial HIPAA Security Audit Logs
        repository.insertAuditLog(SecurityAuditLog(action = "System Database Initialized", details = "Pre-populated database with compliant mock electronic health charts and prescriptions."))
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

    fun setAvailabilitySlot(dateString: String, timeSlot: String, practitionerName: String) {
        viewModelScope.launch {
            val existing = availabilitySlots.value.find { 
                it.dateString == dateString && it.timeSlot == timeSlot && it.practitionerName == practitionerName 
            }
            if (existing == null) {
                repository.insertAvailabilitySlot(
                    AvailabilitySlot(
                        practitionerName = practitionerName,
                        dateString = dateString,
                        timeSlot = timeSlot,
                        isBooked = false
                    )
                )
                logAudit("Configure Calendar Availability", "Added open session slot for $dateString at $timeSlot")
            }
        }
    }

    fun removeAvailabilitySlot(slotId: Long) {
        viewModelScope.launch {
            val existed = availabilitySlots.value.find { it.id == slotId }
            if (existed != null) {
                repository.deleteAvailabilitySlot(slotId)
                logAudit("Remove Calendar Availability", "Removed open session slot ID $slotId")
            }
        }
    }

    fun toggleAvailabilitySlot(dateString: String, timeSlot: String, practitionerName: String) {
        viewModelScope.launch {
            val existing = availabilitySlots.value.find { 
                it.dateString == dateString && it.timeSlot == timeSlot && it.practitionerName == practitionerName 
            }
            if (existing != null) {
                if (!existing.isBooked) {
                    repository.deleteAvailabilitySlot(existing.id)
                    logAudit("Toggle Availability Off", "Removed available slot: $dateString, $timeSlot")
                }
            } else {
                repository.insertAvailabilitySlot(
                    AvailabilitySlot(
                        practitionerName = practitionerName,
                        dateString = dateString,
                        timeSlot = timeSlot,
                        isBooked = false
                    )
                )
                logAudit("Toggle Availability On", "Created available slot: $dateString, $timeSlot")
            }
        }
    }

    fun bookSessionSlot(slotId: Long, patientId: Long, patientName: String, notes: String, isVideo: Boolean, fee: Double) {
        viewModelScope.launch {
            val existing = availabilitySlots.value.find { it.id == slotId }
            if (existing != null && !existing.isBooked) {
                val randomNum = (100..999).random()
                val code = if (isVideo) "PSY-PYR-$randomNum" else "OFFLINE"
                
                val dateParts = existing.dateString.split("-")
                val formattedDate = if (dateParts.size == 3) {
                    val months = listOf("", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
                    val mIdx = dateParts[1].toIntOrNull() ?: 1
                    val mStr = if (mIdx in 1..12) months[mIdx] else "Jun"
                    "${dateParts[2]} $mStr ${dateParts[0]}, ${existing.timeSlot}"
                } else {
                    "${existing.dateString}, ${existing.timeSlot}"
                }

                val apptId = repository.insertAppointment(
                    Appointment(
                        patientId = patientId,
                        patientName = patientName,
                        dateTime = formattedDate,
                        notes = notes,
                        fee = fee,
                        isVideo = isVideo,
                        code = code,
                        status = "Scheduled"
                    )
                )

                val updatedSlot = existing.copy(
                    isBooked = true,
                    patientId = patientId,
                    patientName = patientName,
                    notes = notes,
                    isVideo = isVideo,
                    fee = fee
                )
                repository.updateAvailabilitySlot(updatedSlot)

                logAudit("Booked Session Slot", "Session slot ID $slotId booked by $patientName at $formattedDate")
            }
        }
    }

    fun cancelBookedSessionSlot(slotId: Long) {
        viewModelScope.launch {
            val existing = availabilitySlots.value.find { it.id == slotId }
            if (existing != null && existing.isBooked) {
                val dateParts = existing.dateString.split("-")
                val formattedDatePrefix = if (dateParts.size == 3) {
                    val months = listOf("", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
                    val mIdx = dateParts[1].toIntOrNull() ?: 1
                    val mStr = if (mIdx in 1..12) months[mIdx] else "Jun"
                    "${dateParts[2]} $mStr ${dateParts[0]}"
                } else {
                    existing.dateString
                }

                appointments.value.find { 
                    it.patientId == existing.patientId && it.dateTime.startsWith(formattedDatePrefix) 
                }?.let { appt ->
                    repository.deleteAppointmentById(appt.id)
                }

                val resetSlot = existing.copy(
                    isBooked = false,
                    patientId = null,
                    patientName = null,
                    notes = "",
                    isVideo = true,
                    fee = 150.0
                )
                repository.updateAvailabilitySlot(resetSlot)

                logAudit("Slot Booking Cancelled", "Cancelled booking of session slot ID $slotId")
            }
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

    fun addAssessmentScore(patientId: Long, type: String, score: Int, details: String, timestamp: Long = System.currentTimeMillis()) {
        viewModelScope.launch {
            repository.insertScore(
                AssessmentScore(
                    patientId = patientId,
                    type = type,
                    score = score,
                    details = details,
                    date = timestamp
                )
            )
            logAudit("Logged Assessment", "Added auto-scored $type with value $score ($details) to Patient ID $patientId")
        }
    }

    fun addMoodLog(score: Int, note: String, gratitude: String, breathingSec: Int, patientId: Long = _selectedPatientId.value, timestamp: Long = System.currentTimeMillis()) {
        viewModelScope.launch {
            repository.insertMoodLog(
                MoodLog(
                    patientId = patientId,
                    moodScore = score,
                    moodNote = note,
                    gratitude = gratitude,
                    breathingSeconds = breathingSec,
                    date = timestamp
                )
            )
        }
    }

    fun generateHistoricalWellnessData(patientId: Long) {
        viewModelScope.launch {
            val now = System.currentTimeMillis()
            val dayMillis = 86400000L
            
            val patient = repository.getPatientById(patientId)
            val testType = if (patient?.specialty?.contains("Anxiety") == true) "GAD-7" else "PHQ-9"
            
            // Log 10 historical mood logs with a realistic recovery trajectory
            val moodScores = listOf(3, 3, 4, 5, 5, 6, 7, 6, 8, 8)
            val moodNotes = listOf(
                "Somatic distress is moderate. Feeling sluggish.",
                "Slightly restless during morning presentation prep.",
                "Completed morning box breathing. Somatic tight feelings normalized.",
                "Feeling standard work stress. Coping with mindful pause.",
                "Decent sleep quality. Gratitude reflection helpful.",
                "Excellent session with therapist. Progressing on core issues.",
                "More energized today. Did daily sunlight walk of 10 minutes.",
                "Slight dip in mood after stress, but recovered using box breathing.",
                "Extremely mindful and aligned with somatic breathing exercises.",
                "Strong emotional insight. Feeling confident and ready."
            )
            val gratitudes = listOf(
                "Grateful for a quiet evening.",
                "Grateful for tea and workspace.",
                "Grateful for breathing guides.",
                "Grateful for therapist's guidance.",
                "Grateful for a sunny afternoon.",
                "Grateful for progress.",
                "Grateful for family support.",
                "Grateful for coping strategies.",
                "Grateful for deep calm state.",
                "Grateful for active recovery path."
            )
            val breathingTimes = listOf(0, 120, 240, 180, 240, 300, 240, 180, 480, 300)
            
            for (i in 0 until 10) {
                val offset = (9 - i) * dayMillis
                repository.insertMoodLog(
                    MoodLog(
                        patientId = patientId,
                        moodScore = moodScores[i],
                        moodNote = moodNotes[i],
                        gratitude = gratitudes[i],
                        breathingSeconds = breathingTimes[i],
                        date = now - offset
                    )
                )
            }
            
            // Log 4 progressive clinical scores
            val examScores = if (testType == "GAD-7") listOf(16, 13, 10, 8) else listOf(21, 18, 14, 11)
            val scoreDetails = if (testType == "GAD-7") {
                listOf("Severe Anxiety", "Moderate Anxiety", "Moderate Anxiety", "Mild Anxiety")
            } else {
                listOf("Severe Depression", "Moderately Severe", "Moderate Depression", "Moderate Depression")
            }
            
            for (i in 0 until 4) {
                val offset = (4 - i) * 3 * dayMillis
                repository.insertScore(
                    AssessmentScore(
                        patientId = patientId,
                        type = testType,
                        score = examScores[i],
                        details = scoreDetails[i],
                        date = now - offset
                    )
                )
            }
            
            logAudit("Generated Historical Data", "Seeded 10-day recovery trajectory for Patient ID: $patientId ($testType tracking).")
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

            val prompt = """
                Provide differential medical diagnoses and probable classifications based on these indicators:
                
                Symptomatology:
                "$symptoms"
                
                Direct MSE Indicators:
                "$mseFindings"
                
                Output DSM-5-TR and ICD-10 codes, DSM criteria checklist matching, comorbidities, and confidence indicators (High, Moderate, Low). Include clinical disclaimers.
            """.trimIndent()

            val result = GeminiService.callGemini(prompt, "You are a psychiatric diagnostic advisor.")
            _aiResultText.value = result
            _isAiLoading.value = false
            logAudit("Diagnostic Model Evaluated", "Suggested DSM codes for user criteria.")
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

    // 7. Proactive Patient Insights Analyzer
    fun triggerProactiveInsights(patientId: Long) {
        viewModelScope.launch {
            _isInsightsLoading.value = true
            _proactiveInsights.value = "Analyzing patient assessments, mood trajectories, adherence logs, and clinical notes..."
            logAudit("Proactive Clinical Analysis", "Running proactive clinical insight engine for patient ID: $patientId")

            try {
                // Fetch direct snapshot of current data for this patient
                val patient = repository.patients.first().find { it.id == patientId }
                if (patient == null) {
                    _proactiveInsights.value = "Error: Patient details not found."
                    _isInsightsLoading.value = false
                    return@launch
                }

                val pNotes = repository.allNotes.first().filter { it.patientId == patientId }
                val pScores = repository.allScores.first().filter { it.patientId == patientId }
                val pMoods = repository.moodLogs.first().filter { it.patientId == patientId }
                val pHomework = repository.allHomework.first().filter { it.patientId == patientId }
                val pMeds = repository.allMedications.first().filter { it.patientId == patientId }
                val pAdherence = repository.allAdherenceLogs.first().filter { it.patientId == patientId }

                // Format lists into compact diagnostic data blocks
                val notesStr = pNotes.take(5).joinToString("\n") { 
                    "- Title: ${it.title} (${it.noteType}), Detail: ${it.bodyJson.take(150)}" 
                }
                val scoresStr = pScores.take(5).joinToString("\n") { 
                    "- ${it.type} Score: ${it.score} (${it.details})" 
                }
                val moodsStr = pMoods.take(5).joinToString("\n") { 
                    "- Score: ${it.moodScore}/10, note: ${it.moodNote}, gratitude: ${it.gratitude}, breathing: ${it.breathingSeconds}s" 
                }
                val hwStr = pHomework.take(5).joinToString("\n") { 
                    "- Hw: ${it.title} [Status: ${it.status}], client note: ${it.patientNotes}" 
                }
                val medsStr = pMeds.take(5).joinToString("\n") { 
                    "- Med: ${it.name} (${it.dosage} - ${it.frequency}), Active: ${it.isActive}" 
                }
                val adhereStr = pAdherence.take(10).joinToString("\n") { 
                    "- Date: ${it.dateString}, Status: ${it.status}" 
                }

                val prompt = """
                    You are high-performance clinical psychology co-pilot. Analyze the following psychological and behavioral clinical profile of the patient to generate proactive clinical insights.
                    
                    PATIENT INFO:
                    - Name: ${patient.name}
                    - Age: ${patient.age}, Gender: ${patient.gender}
                    - Specialty Focus: ${patient.specialty}
                    - Baseline Risk: ${patient.riskStatus}
                    
                    RECENT standardized ASSESSMENTS SCORES:
                    ${if (scoresStr.isEmpty()) "No standardized standardized scores logged yet." else scoresStr}
                    
                    RECENT CLIENT MOOD TRACKING LOGS:
                    ${if (moodsStr.isEmpty()) "No self-reported mood tracker entries logged yet." else moodsStr}
                    
                    EXISTING CLINICAL NOTES DATABASE:
                    ${if (notesStr.isEmpty()) "No prior clinical notes." else notesStr}
                    
                    ASSIGNED HOMEWORK TASKS:
                    ${if (hwStr.isEmpty()) "No homework homework assigned." else hwStr}
                    
                    MEDICATION SCHEDULE:
                    ${if (medsStr.isEmpty()) "No current medications prescribed." else medsStr}
                    
                    MEDICATION ADHERENCE LOGS:
                    ${if (adhereStr.isEmpty()) "No past adherence logging." else adhereStr}
                    
                    Formulate a concise clinical briefing for a licensed mental health professional. Structure your response under these exact headings with direct, clinical insights, and suggestions:
                    
                    ### 📈 1. BEHAVIORAL TRENDS & CONTEXT CORRELATIONS
                    [Provide insights on mood trajectories, GAD-7 or PHQ-9 progress, medication adherence patterns, and homework completed vs assigned. Identify what is helping versus triggers.]
                    
                    ### ⚠️ 2. POTENTIAL RISKS & CLINICAL DETERIORATION ALERTS
                    [Analyze safety, mood drops, sleep hygiene issues, sudden drops in compliance, or risk alerts based on clinical notes or scale spikes.]
                    
                    ### 🎯 3. THERAPEUTIC FOCUS & PROACTIVE RECOVERY STEPS
                    [Recommend concrete clinical considerations, therapeutic interventions e.g. CBT, EMDR, clinical plan revisions, or medical referrals for upcoming sessions.]
                    
                    Keep the tone clinical, objective, professional, and compliant with standard EHR terminology. Rely strictly on the evidence in the data. Return in styled markdown formatting.
                """.trimIndent()

                val result = GeminiService.callGemini(prompt, "You are an advanced clinical psychology co-pilot specializing in proactive behavioral analysis and diagnostic support.")
                _proactiveInsights.value = result
            } catch (e: Exception) {
                _proactiveInsights.value = "Failed to compile proactive clinical insights: ${e.message}"
            } finally {
                _isInsightsLoading.value = false
                _selectedPatientId.value.let { id ->
                    logAudit("Proactive Clinical Analysis Complete", "Generated proactive insights scorecard for patient ID: $id")
                }
            }
        }
    }

    // --- Crisis Operations ---
    fun generateCrisisInterventionGuidelines(patientName: String, diagnosis: String, triggerDetails: String, patientNote: String) {
        viewModelScope.launch {
            _isCrisisAiLoading.value = true
            _aiCrisisGuidelines.value = "AI Clinical Companion is compiling therapeutic de-escalation protocols..."
            logAudit("AI Crisis Guidelines Init", "Requesting de-escalation protocol suggestions for $patientName")

            val prompt = """
                Generate professional crisis de-escalation guidelines and acute intervention protocols for this patient.
                Patient: $patientName
                Primary Diagnostic Focus: $diagnosis
                Active Clinical Trigger: $triggerDetails
                Self-reported Context Note: "$patientNote"

                Provide exactly 3 concise, highly actionable, DSM-5 aligned talking points/directives for the therapist to manage this crisis during an immediate call or session. Use professional, gentle, and HIPAA-compliant directives. Keep it focused and impactful.
            """.trimIndent()

            val systemInstruction = "You are an expert psycho-clinical crisis assistant specializing in DBT, CBT, and somatic de-escalation protocols for active panic, trauma triggers, or depressive spikes."

            try {
                val response = GeminiService.callGemini(prompt, systemInstruction)
                _aiCrisisGuidelines.value = response
                logAudit("AI Crisis Guidelines Success", "Crisis guidelines generated for $patientName")
            } catch (e: Exception) {
                _aiCrisisGuidelines.value = "Failed to compile de-escalation protocol: ${e.message}. Maintain general safety check instructions."
            } finally {
                _isCrisisAiLoading.value = false
            }
        }
    }

    fun clearCrisisGuidelines() {
        _aiCrisisGuidelines.value = ""
    }

    fun dismissCrisisAlert(alertId: String) {
        viewModelScope.launch {
            val current = _dismissedAlertIds.value
            _dismissedAlertIds.value = current + alertId
            logAudit("Crisis Alert Resolved", "Marked crisis alert ID $alertId as triaged and resolved.")
        }
    }

    // --- Homework Operations ---
    fun assignHomework(patientId: Long, patientName: String, title: String, description: String, dueDate: String) {
        viewModelScope.launch {
            val id = repository.insertHomework(
                Homework(
                    patientId = patientId,
                    patientName = patientName,
                    title = title,
                    description = description,
                    dueDate = dueDate,
                    status = "Assigned"
                )
            )
            logAudit("Homework Assigned", "Assigned task '$title' to Patient '$patientName' (ID: $patientId, Homework ID: $id)")
        }
    }

    fun updateHomeworkStatus(homeworkId: Long, status: String, patientNotes: String) {
        viewModelScope.launch {
            allHomework.value.firstOrNull { it.id == homeworkId }?.let { hw ->
                val updated = hw.copy(status = status, patientNotes = patientNotes)
                repository.updateHomework(updated)
                logAudit("Homework Status Updated", "Patient updated Homework status to '$status' for Task ID $homeworkId")
            }
        }
    }

    fun reviewHomework(homeworkId: Long, feedback: String, status: String = "Reviewed") {
        viewModelScope.launch {
            allHomework.value.firstOrNull { it.id == homeworkId }?.let { hw ->
                val updated = hw.copy(professionalFeedback = feedback, status = status)
                repository.updateHomework(updated)
                logAudit("Homework Reviewed", "Professional left feedback on Homework ID $homeworkId sets state to '$status'")
            }
        }
    }

    fun deleteHomework(id: Long) {
        viewModelScope.launch {
            repository.deleteHomeworkById(id)
            logAudit("Deleted Homework", "Professionally removed active homework ID $id")
        }
    }

    // --- Medication Operations ---
    fun prescribeMedication(
        patientId: Long,
        patientName: String,
        name: String,
        dosage: String,
        frequency: String,
        purpose: String,
        instructions: String,
        startDate: String,
        durationDays: Int
    ) {
        viewModelScope.launch {
            val id = repository.insertMedication(
                Medication(
                    patientId = patientId,
                    patientName = patientName,
                    name = name,
                    dosage = dosage,
                    frequency = frequency,
                    purpose = purpose,
                    instructions = instructions,
                    startDate = startDate,
                    durationDays = durationDays,
                    isActive = true
                )
            )
            logAudit("Medication Prescribed", "Prescribed '$name $dosage' ($frequency) to Patient '$patientName' (ID: $patientId, Rx ID: $id)")
        }
    }

    fun updateMedicationActiveStatus(medicationId: Long, isActive: Boolean) {
        viewModelScope.launch {
            allMedications.value.firstOrNull { it.id == medicationId }?.let { med ->
                val updated = med.copy(isActive = isActive)
                repository.updateMedication(updated)
                logAudit("Medication Status Changed", "Therapist updated medication ID $medicationId active status to $isActive")
            }
        }
    }

    fun deleteMedication(medicationId: Long) {
        viewModelScope.launch {
            repository.deleteMedicationById(medicationId)
            logAudit("Medication Deleted", "Therapist deleted medication prescription record ID $medicationId")
        }
    }

    fun logMedicationAdherence(medicationId: Long, patientId: Long, dateString: String, status: String) {
        viewModelScope.launch {
            repository.deleteAdherenceLogAtDate(medicationId, dateString) // avoid double logs on same day
            val id = repository.insertAdherenceLog(
                AdherenceLog(
                    medicationId = medicationId,
                    patientId = patientId,
                    dateString = dateString,
                    status = status
                )
            )
            logAudit("Medication Adherence Logged", "Patient logged adherence as '$status' for Medication Rx ID $medicationId on date $dateString")
        }
    }

    // --- Scratchpad Operations ---
    fun addScratchpadNote(text: String, tag: String = "General") {
        viewModelScope.launch {
            if (text.isNotBlank()) {
                repository.insertScratchpadNote(
                    ScratchpadNote(
                        text = text,
                        tag = tag
                    )
                )
                logAudit("Scratchpad Note Added", "Added scratchpad entry with tag: $tag")
            }
        }
    }

    fun deleteScratchpadNote(id: Long) {
        viewModelScope.launch {
            repository.deleteScratchpadNoteById(id)
            logAudit("Scratchpad Note Deleted", "Deleted scratchpad entry ID $id")
        }
    }

    fun clearAllScratchpadNotes() {
        viewModelScope.launch {
            repository.clearAllScratchpadNotes()
            logAudit("Scratchpad Cleared", "Cleared all scratchpad entries")
        }
    }

    fun attachScratchpadNoteToSoap(noteId: Long, text: String, patientId: Long, noteTitle: String = "SOAP Note (from Scratchpad)") {
        viewModelScope.launch {
            repository.insertClinicalNote(
                ClinicalNote(
                    patientId = patientId,
                    title = noteTitle,
                    noteType = "SOAP",
                    bodyJson = text
                )
            )
            repository.deleteScratchpadNoteById(noteId)
            logAudit("Scratchpad Note Attached", "Successfully converted scratchpad note to official SOAP note for patient ID $patientId")
        }
    }

    // --- Authentication Operations ---
    fun login(usernameOrEmail: String, passwordPlain: String, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            if (usernameOrEmail.isBlank() || passwordPlain.isBlank()) {
                onResult(false, "Please fill in all credentials.")
                return@launch
            }
            val matchedUser = repository.getUserByUsername(usernameOrEmail) 
                ?: repository.getUserByEmail(usernameOrEmail)
            
            if (matchedUser == null) {
                onResult(false, "User account not found.")
                logAudit("Authentication Failure", "Attempted login for '$usernameOrEmail' failed: Account does not exist")
            } else if (matchedUser.passwordPlain != passwordPlain) {
                onResult(false, "Invalid password credentials.")
                logAudit("Authentication Failure", "Attempted login for '${matchedUser.username}' failed: Incorrect password")
            } else {
                _loggedInUser.value = matchedUser
                _activeRole.value = matchedUser.role
                onResult(true, "Authentication successful.")
                logAudit("Authentication Success", "${matchedUser.fullName} (${matchedUser.role}) successfully authenticated.")
            }
        }
    }

    fun signup(
        username: String,
        email: String,
        passwordPlain: String,
        role: String,
        fullName: String,
        licenseOrId: String,
        specialty: String = "",
        onResult: (Boolean, String) -> Unit
    ) {
        viewModelScope.launch {
            if (username.isBlank() || email.isBlank() || passwordPlain.isBlank() || fullName.isBlank()) {
                onResult(false, "Please fill in all required fields.")
                return@launch
            }
            if (passwordPlain.length < 5) {
                onResult(false, "Password must be at least 5 characters long.")
                return@launch
            }
            val existingByUsername = repository.getUserByUsername(username)
            if (existingByUsername != null) {
                onResult(false, "Username '$username' is already taken.")
                return@launch
            }
            val existingByEmail = repository.getUserByEmail(email)
            if (existingByEmail != null) {
                onResult(false, "Email '$email' is already registered.")
                return@launch
            }

            val newUser = UserAccount(
                username = username,
                email = email,
                passwordPlain = passwordPlain,
                role = role,
                fullName = fullName,
                licenseOrId = licenseOrId,
                specialty = specialty
            )
            repository.insertUserAccount(newUser)
            
            _loggedInUser.value = newUser
            _activeRole.value = role
            onResult(true, "Registration successful.")
            logAudit("User Registered", "New $role account created for $fullName (Username: $username)")
        }
    }

    fun logout() {
        val user = _loggedInUser.value
        _loggedInUser.value = null
        logAudit("User Logged Out", "User ${user?.fullName ?: "Unknown"} signed out from current session.")
    }

    fun updateProfessionalProfile(
        fullName: String,
        specialty: String,
        licenseOrId: String,
        bio: String,
        experienceYears: Int,
        clinicAddress: String,
        consultationFee: Double,
        availableHours: String,
        languagesSpoken: String,
        onResult: (Boolean, String) -> Unit
    ) {
        val currentUser = _loggedInUser.value ?: return
        viewModelScope.launch {
            val updatedUser = currentUser.copy(
                fullName = fullName,
                specialty = specialty,
                licenseOrId = licenseOrId,
                bio = bio,
                experienceYears = experienceYears,
                clinicAddress = clinicAddress,
                consultationFee = consultationFee,
                availableHours = availableHours,
                languagesSpoken = languagesSpoken
            )
            repository.insertUserAccount(updatedUser)
            _loggedInUser.value = updatedUser
            onResult(true, "Profile saved and updated in local database.")
            logAudit("Profile Updated", "Professional ${fullName} updated their profile settings successfully.")
        }
    }

    fun bookAppointment(
        practitionerName: String,
        dateTime: String,
        notes: String,
        isVideo: Boolean,
        fee: Double,
        onResult: (Boolean, String) -> Unit
    ) {
        val currentUser = _loggedInUser.value ?: return
        viewModelScope.launch {
            val randomNum = (100..999).random()
            val code = if (isVideo) "PSY-PYR-$randomNum" else "OFFLINE"
            val id = repository.insertAppointment(
                Appointment(
                    patientId = currentUser.id,
                    patientName = currentUser.fullName,
                    dateTime = dateTime,
                    notes = notes,
                    fee = fee,
                    isVideo = isVideo,
                    code = code,
                    status = "Scheduled",
                    practitionerName = practitionerName
                )
            )
            logAudit("Scheduled Appointment", "Patient ${currentUser.fullName} booked with $practitionerName on $dateTime (Appt ID: $id)")
            onResult(true, "Appointment successfully booked with $practitionerName!")
        }
    }

    // User Accounts stream
    val allUserAccounts: StateFlow<List<UserAccount>> = repository.allUserAccounts
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Peer Support Groups
    val allPeerGroups: StateFlow<List<PeerGroup>> = repository.allPeerGroups
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _selectedGroupId = MutableStateFlow<Long?>(null)
    val selectedGroupId: StateFlow<Long?> = _selectedGroupId.asStateFlow()

    @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
    val activeGroupMessages: StateFlow<List<PeerMessage>> = _selectedGroupId
        .flatMapLatest { groupId ->
            if (groupId == null) {
                flowOf(emptyList())
            } else {
                repository.getMessagesForGroup(groupId)
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun selectPeerGroup(groupId: Long?) {
        _selectedGroupId.value = groupId
    }

    fun createPeerGroup(name: String, description: String, category: String, facilitatorName: String) {
        viewModelScope.launch {
            val id = repository.insertPeerGroup(
                PeerGroup(
                    name = name,
                    description = description,
                    category = category,
                    facilitatorName = facilitatorName
                )
            )
            logAudit("Create Peer Group", "Created community peer group '$name' under category '$category'")
            if (_selectedGroupId.value == null) {
                _selectedGroupId.value = id
            }
        }
    }

    fun sendPeerMessage(messageText: String, isAnonymous: Boolean) {
        val groupId = _selectedGroupId.value ?: return
        val currentUser = _loggedInUser.value
        val name = if (isAnonymous) "Anonymous Peer" else (currentUser?.fullName ?: "Liam Carter")
        val role = currentUser?.role ?: "Patient"

        viewModelScope.launch {
            repository.insertPeerMessage(
                PeerMessage(
                    groupId = groupId,
                    senderName = name,
                    senderRole = role,
                    messageText = messageText,
                    isAnonymous = isAnonymous
                )
            )
            logAudit("Post Peer Message", "Sent message in support group ID $groupId (Anonymous: $isAnonymous)")
        }
    }

    fun toggleMessagePin(messageId: Long, currentPin: Boolean) {
        viewModelScope.launch {
            repository.updateMessagePinStatus(messageId, !currentPin)
            logAudit("Pin Peer Message", "Toggled pin status of support msg $messageId to ${!currentPin}")
        }
    }

    fun likePeerMessage(messageId: Long) {
        viewModelScope.launch {
            repository.likeMessage(messageId)
        }
    }

    fun deletePeerGroup(groupId: Long) {
        viewModelScope.launch {
            repository.deletePeerGroup(groupId)
            logAudit("Mock Admin Action", "Deleted peer group ID $groupId")
            if (_selectedGroupId.value == groupId) {
                _selectedGroupId.value = allPeerGroups.value.firstOrNull { it.id != groupId }?.id
            }
        }
    }

    fun deletePeerMessage(messageId: Long) {
        viewModelScope.launch {
            repository.deletePeerMessage(messageId)
            logAudit("Mock Admin Action", "Deleted peer message ID $messageId")
        }
    }

    private suspend fun populatePeerSupportDefaults() {
        val groups = repository.allPeerGroups.first()
        if (groups.isEmpty()) {
            val gdId = repository.insertPeerGroup(
                PeerGroup(
                    name = "Mindfulness & Anxiety Coping",
                    description = "A warm peer-led support space containing safe strategies to manage generalized anxiety symptoms.",
                    category = "Anxiety",
                    facilitatorName = "Dr. Katherine Brewster"
                )
            )
            val mdId = repository.insertPeerGroup(
                PeerGroup(
                    name = "Depression Survival & Insights",
                    description = "Discuss coping habits, social activation, and safe CBT strategies among peers experiencing severe low mood.",
                    category = "Depression",
                    facilitatorName = "Dr. Katherine Brewster"
                )
            )
            val adId = repository.insertPeerGroup(
                PeerGroup(
                    name = "Adult ADHD Brainstorming",
                    description = "Share productivity routines, focus apps, and organizational success stories in a judgment-free zone.",
                    category = "ADHD Coping"
                )
            )

            // Insert messages for Anxiety Group
            repository.insertPeerMessage(
                PeerMessage(
                    groupId = gdId,
                    senderName = "Sarah Jenkins",
                    senderRole = "Patient",
                    messageText = "Hi everyone! I practiced the 4-7-8 breathing exercise today and it really helped calm my chest tightness before a presentation.",
                    isAnonymous = false,
                    likesCount = 3
                )
            )
            repository.insertPeerMessage(
                PeerMessage(
                    groupId = gdId,
                    senderName = "Liam Carter",
                    senderRole = "Patient",
                    messageText = "That breathing exercise is great. I usually combine it with cold water on my face.",
                    isAnonymous = false,
                    likesCount = 2
                )
            )
            repository.insertPeerMessage(
                PeerMessage(
                    groupId = gdId,
                    senderName = "Anonymous Peer",
                    senderRole = "Patient",
                    messageText = "Does anyone else get anxious in supermarkets? I find the fluorescent lights and crowds so overstimulating.",
                    isAnonymous = true,
                    likesCount = 5
                )
            )
            repository.insertPeerMessage(
                PeerMessage(
                    groupId = gdId,
                    senderName = "Dr. Katherine Brewster",
                    senderRole = "Professional",
                    messageText = "That is very common, known as sensory overload. Try wearing noise-canceling headphones or listening to calming brown noise while you shop.",
                    isAnonymous = false,
                    isPinned = true,
                    likesCount = 10
                )
            )

            // Insert messages for Depression Group
            repository.insertPeerMessage(
                PeerMessage(
                    groupId = mdId,
                    senderName = "Liam Carter",
                    senderRole = "Patient",
                    messageText = "Feeling really stuck in bed today. The fatigue is incredibly heavy.",
                    isAnonymous = false,
                    likesCount = 4
                )
            )
            repository.insertPeerMessage(
                PeerMessage(
                    groupId = mdId,
                    senderName = "Anonymous Peer",
                    senderRole = "Patient",
                    messageText = "I feel you, Liam. Sometimes just moving my toes or stretching in bed is my victory for the hour. No pressure.",
                    isAnonymous = true,
                    likesCount = 6
                )
            )

            // Select the anxiety group by default on first load
            _selectedGroupId.value = gdId
        } else {
            // Already populated, select the first group
            _selectedGroupId.value = groups.first().id
        }
    }


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
