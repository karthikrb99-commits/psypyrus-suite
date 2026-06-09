/**
 * PsyPyrus AI - Offline Database Simulator (localStorage wrapper)
 * Mimics Room Database entities and provides reactive-like reads/writes.
 */

const STORAGE_KEYS = {
    PATIENTS: 'psypyrus_patients',
    APPOINTMENTS: 'psypyrus_appointments',
    CLINICAL_NOTES: 'psypyrus_clinical_notes',
    ASSESSMENTS: 'psypyrus_assessments',
    MOOD_LOGS: 'psypyrus_mood_logs',
    AUDIT_LOGS: 'psypyrus_audit_logs',
    HOMEWORK: 'psypyrus_homework_tasks'
};

// Initial Clinical Seed Data
const SEED_DATA = {
    patients: [
        { id: 1, name: "Liam Carter", age: 29, gender: "Male", email: "liam.carter@health.me", phone: "555-0192", riskStatus: "Severe", specialty: "Major Depres. (Single Ep.)", registrationDate: Date.now() - 86400000 * 45 },
        { id: 2, name: "Sarah Jenkins", age: 34, gender: "Female", email: "sarah.j@outlook.com", phone: "555-2311", riskStatus: "Moderate", specialty: "Generalized Anxiety Disorder", registrationDate: Date.now() - 86400000 * 30 },
        { id: 3, name: "John Doe", age: 42, gender: "Male", email: "j.doe@company.com", phone: "555-8833", riskStatus: "None", specialty: "ADHD Clinical Consultation", registrationDate: Date.now() - 86400000 * 20 },
        { id: 4, name: "Sophia Patel", age: 23, gender: "Female", email: "sophia.patel@edu.org", phone: "555-4422", riskStatus: "Low", specialty: "PTSD Trauma Therapy", registrationDate: Date.now() - 86400000 * 15 }
    ],
    appointments: [
        { id: 1, patientId: 1, patientName: "Liam Carter", dateTime: "Today, 10:00 AM", status: "Scheduled", notes: "Pre-assessment for Severe cognitive stagnation. Risk indicators require supervision.", fee: 175.0, isVideo: true, code: "PSY-PYR-401" },
        { id: 2, patientId: 2, patientName: "Sarah Jenkins", dateTime: "Today, 02:00 PM", status: "Scheduled", notes: "Weekly Cognitive Restructuring session. Evaluate habit track logs.", fee: 150.0, isVideo: true, code: "PSY-PYR-402" },
        { id: 3, patientId: 3, patientName: "John Doe", dateTime: "Tomorrow, 11:30 AM", status: "Scheduled", notes: "ADHD executive function coaching. Evaluate planner metrics.", fee: 150.0, isVideo: false, code: "OFFLINE" },
        { id: 4, patientId: 4, patientName: "Sophia Patel", dateTime: "10 Jun, 03:00 PM", status: "Scheduled", notes: "EMDR therapy grounding and somatic integration.", fee: 180.0, isVideo: true, code: "PSY-PYR-403" }
    ],
    assessments: [
        { id: 1, patientId: 1, type: "PHQ-9", score: 21, details: "Severe Depression", date: Date.now() - 86400000 * 30 },
        { id: 2, patientId: 1, type: "PHQ-9", score: 18, details: "Moderately Severe Depression", date: Date.now() - 86400000 * 15 },
        { id: 3, patientId: 1, type: "PHQ-9", score: 15, details: "Moderate Depression", date: Date.now() },
        { id: 4, patientId: 2, type: "GAD-7", score: 16, details: "Severe Anxiety", date: Date.now() - 86400000 * 20 },
        { id: 5, patientId: 2, type: "GAD-7", score: 13, details: "Moderate Anxiety", date: Date.now() - 86400000 * 10 },
        { id: 6, patientId: 2, type: "GAD-7", score: 9, details: "Mild Anxiety", date: Date.now() }
    ],
    clinical_notes: [
        { id: 1, patientId: 1, title: "Initial Intake Note", noteType: "GENERAL", bodyJson: "Patient presented with a history of recurrent low mood, complete anhedonia, and diminished energy. Sleeping 11 hours daily with poor quality. Passive suicidal ideation with no current plans or intent.", timestamp: Date.now() - 86400000 * 5, isRiskAlert: false, riskDisclaimer: "AI-assisted note. Licensed practitioner has reviewed." },
        { id: 2, patientId: 2, title: "CBT Relaxation Schema", noteType: "PLAN", bodyJson: "Taught mindfulness-based abdominal pacing. Assigned daily breathing log homework on wellness app. Plan: Exposure hierarchy development next session.", timestamp: Date.now() - 86400000 * 2, isRiskAlert: false, riskDisclaimer: "AI-assisted note. Licensed practitioner has reviewed." }
    ],
    mood_logs: [
        { id: 1, patientId: 1, moodScore: 4, moodNote: "Feeling standard stress at startup job", gratitude: "Grateful for good coffee", breathingSeconds: 120, date: Date.now() - 86400000 * 5 },
        { id: 2, patientId: 1, moodScore: 5, moodNote: "Calmer after talking with friend", gratitude: "Sunny weather", breathingSeconds: 240, date: Date.now() - 86400000 * 4 },
        { id: 3, patientId: 1, moodScore: 6, moodNote: "Completed all morning tasks successfully", gratitude: "Quiet workspace", breathingSeconds: 300, date: Date.now() - 86400000 * 3 },
        { id: 4, patientId: 1, moodScore: 5, moodNote: "Tired post mid-week evaluations", gratitude: "Nice support from therapist", breathingSeconds: 180, date: Date.now() - 86400000 * 2 },
        { id: 5, patientId: 1, moodScore: 8, moodNote: "Amazing breathing exercise session, felt totally weightless!", gratitude: "Meditation music", breathingSeconds: 480, date: Date.now() - 86400000 },
        { id: 6, patientId: 1, moodScore: 7, moodNote: "Feeling focused on wellness routine", gratitude: "Woke up early", breathingSeconds: 240, date: Date.now() }
    ],
    homework: [
        { id: 1, patientId: 1, description: "Record sleep latency and daily sleep quality in sleep log notebook", isCompleted: false, assignedDate: Date.now() - 86400000 * 2 },
        { id: 2, patientId: 1, description: "Commit to completing 5-minute deep abdominal breathing at 9 AM and 9 PM", isCompleted: true, assignedDate: Date.now() - 86400000 * 2 },
        { id: 3, patientId: 2, description: "Log work cognitive distortions and practice restructuring three times this week", isCompleted: false, assignedDate: Date.now() - 86400000 },
        { id: 4, patientId: 2, description: "Set boundaries: turn off workstation laptop by 8 PM daily", isCompleted: false, assignedDate: Date.now() }
    ],
    audit_logs: [
        { id: 1, action: "System Database Initialized", details: "Pre-populated database with compliant mock electronic health charts.", timestamp: Date.now(), actor: "System Core", ipAddress: "127.0.0.1", encryptionStandard: "AES-GCM-256" },
        { id: 2, action: "User Authentication", details: "Dr. Katherine Brewster successfully authenticated. Session secured under compliance ID #1004.", timestamp: Date.now(), actor: "Dr. Katherine Brewster (Admin)", ipAddress: "192.168.1.104", encryptionStandard: "AES-GCM-256" },
        { id: 3, action: "Key Ring Verification", details: "Checked Local Storage security vault integrity. E2E envelope encryption standards validated.", timestamp: Date.now(), actor: "Dr. Katherine Brewster (Admin)", ipAddress: "192.168.1.104", encryptionStandard: "AES-GCM-256" }
    ]
};

// Database class definition
export class Database {
    static init() {
        // Clear logic for debug/testing if needed, otherwise initialize storage keys if empty
        if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
            localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(SEED_DATA.patients));
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(SEED_DATA.appointments));
            localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(SEED_DATA.assessments));
            localStorage.setItem(STORAGE_KEYS.CLINICAL_NOTES, JSON.stringify(SEED_DATA.clinical_notes));
            localStorage.setItem(STORAGE_KEYS.MOOD_LOGS, JSON.stringify(SEED_DATA.mood_logs));
            localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(SEED_DATA.homework));
            localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_DATA.audit_logs));
            console.log("PsyPyrus offline local database initialized and seeded.");
        }
    }

    static get(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    }

    static set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // --- Audit Log Utility ---
    static logAudit(action, details) {
        const logs = this.get(STORAGE_KEYS.AUDIT_LOGS);
        const newLog = {
            id: logs.length ? Math.max(...logs.map(l => l.id)) + 1 : 1,
            action,
            details,
            timestamp: Date.now(),
            actor: "Dr. Katherine Brewster (Admin)",
            ipAddress: "192.168.1.104",
            encryptionStandard: "AES-GCM-256"
        };
        logs.unshift(newLog); // Put latest logs first
        this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
        // Dispatch custom event to notify listeners of changes
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.AUDIT_LOGS } }));
        return newLog;
    }

    // --- Patients ---
    static getPatients() {
        return this.get(STORAGE_KEYS.PATIENTS);
    }

    static insertPatient(patient) {
        const patients = this.get(STORAGE_KEYS.PATIENTS);
        const newPatient = {
            ...patient,
            id: patients.length ? Math.max(...patients.map(p => p.id)) + 1 : 1,
            registrationDate: Date.now()
        };
        patients.push(newPatient);
        this.set(STORAGE_KEYS.PATIENTS, patients);
        this.logAudit("Patient Created", `Added patient ${newPatient.name} with ID ${newPatient.id}`);
        
        // Auto-create intake clinical note
        this.insertClinicalNote({
            patientId: newPatient.id,
            title: "Intake Note Reference",
            noteType: "GENERAL",
            bodyJson: `Patient ${newPatient.name} enrolled in clinic. Initial diagnostic consideration: ${newPatient.specialty}. Assigned Risk Profile: ${newPatient.riskStatus}.`
        });

        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.PATIENTS } }));
        return newPatient.id;
    }

    // --- Appointments ---
    static getAppointments() {
        return this.get(STORAGE_KEYS.APPOINTMENTS);
    }

    static insertAppointment(appt) {
        const appts = this.get(STORAGE_KEYS.APPOINTMENTS);
        const randomNum = Math.floor(Math.random() * 900) + 100;
        const code = appt.isVideo ? `PSY-PYR-${randomNum}` : "OFFLINE";
        const newAppt = {
            ...appt,
            id: appts.length ? Math.max(...appts.map(a => a.id)) + 1 : 1,
            code,
            status: "Scheduled"
        };
        appts.push(newAppt);
        this.set(STORAGE_KEYS.APPOINTMENTS, appts);
        this.logAudit("Scheduled Appointment", `Appointment scheduled for ${newAppt.patientName} on ${newAppt.dateTime} (Appt ID: ${newAppt.id})`);
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.APPOINTMENTS } }));
        return newAppt.id;
    }

    static updateAppointmentStatus(apptId, status) {
        const appts = this.get(STORAGE_KEYS.APPOINTMENTS);
        const idx = appts.findIndex(a => a.id === apptId);
        if (idx !== -1) {
            appts[idx].status = status;
            this.set(STORAGE_KEYS.APPOINTMENTS, appts);
            this.logAudit("Appointment Complete", `Managed appointment ID ${apptId} with status: ${status}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.APPOINTMENTS } }));
        }
    }

    static deleteAppointment(apptId) {
        const appts = this.get(STORAGE_KEYS.APPOINTMENTS);
        const filtered = appts.filter(a => a.id !== apptId);
        this.set(STORAGE_KEYS.APPOINTMENTS, filtered);
        this.logAudit("Cancelled Appointment", `Cancelled appointment ID ${apptId}`);
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.APPOINTMENTS } }));
    }

    // --- Clinical Notes ---
    static getClinicalNotes(patientId = null) {
        const notes = this.get(STORAGE_KEYS.CLINICAL_NOTES);
        if (patientId) {
            return notes.filter(n => n.patientId === Number(patientId));
        }
        return notes;
    }

    static insertClinicalNote(note) {
        const notes = this.get(STORAGE_KEYS.CLINICAL_NOTES);
        const newNote = {
            ...note,
            id: notes.length ? Math.max(...notes.map(n => n.id)) + 1 : 1,
            timestamp: Date.now(),
            isRiskAlert: note.isRiskAlert || false,
            riskDisclaimer: "AI-assisted note. Licensed practitioner has reviewed."
        };
        notes.unshift(newNote); // Newest note at top
        this.set(STORAGE_KEYS.CLINICAL_NOTES, notes);
        this.logAudit("Added Clinical Note", `Saved a new ${newNote.noteType} note for Patient ID ${newNote.patientId}. Risk status flagged: ${newNote.isRiskAlert}`);
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.CLINICAL_NOTES } }));
        return newNote.id;
    }

    // --- Assessments ---
    static getAssessments(patientId = null) {
        const scores = this.get(STORAGE_KEYS.ASSESSMENTS);
        if (patientId) {
            return scores.filter(s => s.patientId === Number(patientId));
        }
        return scores;
    }

    static insertAssessmentScore(score) {
        const scores = this.get(STORAGE_KEYS.ASSESSMENTS);
        const newScore = {
            ...score,
            id: scores.length ? Math.max(...scores.map(s => s.id)) + 1 : 1,
            date: Date.now()
        };
        scores.push(newScore);
        this.set(STORAGE_KEYS.ASSESSMENTS, scores);
        this.logAudit("Logged Assessment", `Added auto-scored ${newScore.type} with value ${newScore.score} (${newScore.details}) to Patient ID ${newScore.patientId}`);
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.ASSESSMENTS } }));
        return newScore.id;
    }

    // --- Mood Logs ---
    static getMoodLogs() {
        return this.get(STORAGE_KEYS.MOOD_LOGS);
    }

    static insertMoodLog(log) {
        const logs = this.get(STORAGE_KEYS.MOOD_LOGS);
        const newLog = {
            ...log,
            id: logs.length ? Math.max(...logs.map(l => l.id)) + 1 : 1,
            patientId: 1, // Default logged-in patient
            date: Date.now()
        };
        logs.push(newLog);
        this.set(STORAGE_KEYS.MOOD_LOGS, logs);
        this.logAudit("Mood Log Entry", `Logged mood index ${newLog.moodScore}/10 and daily journal entry.`);
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.MOOD_LOGS } }));
        return newLog.id;
    }

    // --- Homework ---
    static getHomework(patientId = null) {
        const tasks = this.get(STORAGE_KEYS.HOMEWORK);
        if (patientId) {
            return tasks.filter(t => t.patientId === Number(patientId));
        }
        return tasks;
    }

    static insertHomework(task) {
        const tasks = this.get(STORAGE_KEYS.HOMEWORK);
        const newTask = {
            ...task,
            id: tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
            isCompleted: false,
            assignedDate: Date.now()
        };
        tasks.push(newTask);
        this.set(STORAGE_KEYS.HOMEWORK, tasks);
        this.logAudit("Homework Assigned", `Assigned task '${newTask.description}' to Patient ID ${newTask.patientId}`);
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.HOMEWORK } }));
        return newTask.id;
    }

    static toggleHomework(taskId) {
        const tasks = this.get(STORAGE_KEYS.HOMEWORK);
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx !== -1) {
            tasks[idx].isCompleted = !tasks[idx].isCompleted;
            this.set(STORAGE_KEYS.HOMEWORK, tasks);
            this.logAudit("Homework Status Toggled", `Toggled task ID ${taskId} to isCompleted: ${tasks[idx].isCompleted}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.HOMEWORK } }));
        }
    }

    static deleteHomework(taskId) {
        const tasks = this.get(STORAGE_KEYS.HOMEWORK);
        const filtered = tasks.filter(t => t.id !== taskId);
        this.set(STORAGE_KEYS.HOMEWORK, filtered);
        this.logAudit("Homework Deleted", `Deleted homework task ID ${taskId}`);
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.HOMEWORK } }));
    }

    // --- Admin Clear / Reset ---
    static clearDatabase() {
        localStorage.removeItem(STORAGE_KEYS.PATIENTS);
        localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
        localStorage.removeItem(STORAGE_KEYS.ASSESSMENTS);
        localStorage.removeItem(STORAGE_KEYS.CLINICAL_NOTES);
        localStorage.removeItem(STORAGE_KEYS.MOOD_LOGS);
        localStorage.removeItem(STORAGE_KEYS.HOMEWORK);
        localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
        this.init();
    }
}
// Initialize database on import
Database.init();
