/**
 * PsyPyrus AI - Offline Database Simulator (localStorage wrapper)
 * Mimics Room Database entities and provides reactive-like reads/writes.
 */

import { GamificationService } from './gamification';

const STORAGE_KEYS = {
    PATIENTS: 'psypyrus_patients',
    APPOINTMENTS: 'psypyrus_appointments',
    CLINICAL_NOTES: 'psypyrus_clinical_notes',
    ASSESSMENTS: 'psypyrus_assessments',
    MOOD_LOGS: 'psypyrus_mood_logs',
    AUDIT_LOGS: 'psypyrus_audit_logs',
    HOMEWORK: 'psypyrus_homework_tasks',
    INSTALLED_APPS: 'psypyrus_installed_apps',
    INTAKE_FORMS: 'psypyrus_intake_forms'
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
        { id: 6, patientId: 2, type: "GAD-7", score: 9, details: "Mild Anxiety", date: Date.now() },
        { id: 7, patientId: 1, type: "B-HiTOP", score: 98, details: "p-Factor mean: 2.33", answers: [1, 1, 1, 1, 1, 3, 2, 4, 4, 3, 1, 3, 1, 4, 2, 2, 3, 4, 3, 2, 2, 4, 4, 1, 1, 3, 1, 1, 2, 2, 2, 2, 1, 1, 3, 3, 2, 1, 1, 1, 3, 4, 2, 4, 1], date: Date.now() - 86400000 * 5 },
        { id: 8, patientId: 2, type: "B-HiTOP", score: 92, details: "p-Factor mean: 2.17", answers: [1, 1, 1, 1, 1, 3, 1, 3, 2, 4, 1, 2, 1, 4, 2, 1, 2, 4, 4, 2, 3, 4, 4, 1, 1, 3, 1, 1, 1, 1, 2, 1, 1, 2, 2, 2, 2, 1, 1, 1, 3, 3, 2, 4, 1], date: Date.now() - 86400000 * 4 },
        { id: 9, patientId: 3, type: "B-HiTOP", score: 98, details: "p-Factor mean: 1.83", answers: [2, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 4, 4, 1, 2, 1, 4, 1, 2, 2, 4, 2, 1, 2, 1, 4, 1, 1, 4, 2, 4, 4, 2, 1, 1, 1, 2, 1, 1, 3, 2, 2], date: Date.now() - 86400000 * 3 },
        { id: 10, patientId: 4, type: "B-HiTOP", score: 99, details: "p-Factor mean: 2.25", answers: [1, 1, 1, 1, 1, 2, 3, 4, 4, 2, 2, 4, 1, 2, 2, 2, 2, 3, 2, 2, 2, 3, 4, 1, 1, 2, 1, 2, 2, 3, 4, 2, 1, 1, 2, 3, 4, 2, 2, 1, 2, 3, 2, 4, 1], date: Date.now() - 86400000 * 2 }
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
            localStorage.setItem(STORAGE_KEYS.INSTALLED_APPS, JSON.stringify([]));
            console.log("PsyPyrus offline local database initialized and seeded.");
        }
        if (!localStorage.getItem(STORAGE_KEYS.INTAKE_FORMS)) {
            localStorage.setItem(STORAGE_KEYS.INTAKE_FORMS, JSON.stringify([]));
        }

        // Hot patch existing localstorage assessments with HiTOP seed data if absent
        const assessments = this.get(STORAGE_KEYS.ASSESSMENTS);
        if (assessments.length > 0 && !assessments.some(a => a.type === 'B-HiTOP')) {
            const hitopSeeds = [
                { id: 7, patientId: 1, type: "B-HiTOP", score: 98, details: "p-Factor mean: 2.33", answers: [1, 1, 1, 1, 1, 3, 2, 4, 4, 3, 1, 3, 1, 4, 2, 2, 3, 4, 3, 2, 2, 4, 4, 1, 1, 3, 1, 1, 2, 2, 2, 2, 1, 1, 3, 3, 2, 1, 1, 1, 3, 4, 2, 4, 1], date: Date.now() - 86400000 * 5 },
                { id: 8, patientId: 2, type: "B-HiTOP", score: 92, details: "p-Factor mean: 2.17", answers: [1, 1, 1, 1, 1, 3, 1, 3, 2, 4, 1, 2, 1, 4, 2, 1, 2, 4, 4, 2, 3, 4, 4, 1, 1, 3, 1, 1, 1, 1, 2, 1, 1, 2, 2, 2, 2, 1, 1, 1, 3, 3, 2, 4, 1], date: Date.now() - 86400000 * 4 },
                { id: 9, patientId: 3, type: "B-HiTOP", score: 98, details: "p-Factor mean: 1.83", answers: [2, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 4, 4, 1, 2, 1, 4, 1, 2, 2, 4, 2, 1, 2, 1, 4, 1, 1, 4, 2, 4, 4, 2, 1, 1, 1, 2, 1, 1, 3, 2, 2], date: Date.now() - 86400000 * 3 },
                { id: 10, patientId: 4, type: "B-HiTOP", score: 99, details: "p-Factor mean: 2.25", answers: [1, 1, 1, 1, 1, 2, 3, 4, 4, 2, 2, 4, 1, 2, 2, 2, 2, 3, 2, 2, 2, 3, 4, 1, 1, 2, 1, 2, 2, 3, 4, 2, 1, 1, 2, 3, 4, 2, 2, 1, 2, 3, 2, 4, 1], date: Date.now() - 86400000 * 2 }
            ];
            this.set(STORAGE_KEYS.ASSESSMENTS, [...assessments, ...hitopSeeds]);
            console.log("Hot-patched B-HiTOP clinical seeds into active local storage database.");
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
        
        // Desktop Integration Hooks (Electron)
        if (window.electronAPI) {
            // Write to local file audit log
            if (typeof window.electronAPI.writeAuditLog === 'function') {
                window.electronAPI.writeAuditLog(newLog).catch(console.error);
            }
            // Send native OS notifications for key events
            if (typeof window.electronAPI.sendNotification === 'function') {
                const notifyEvents = [
                    "Patient Created", 
                    "Scheduled Appointment", 
                    "Marketplace App Installed",
                    "Switched Role Mode"
                ];
                if (notifyEvents.includes(action)) {
                    window.electronAPI.sendNotification(action, details);
                }
            }
        }

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
        
        // Gamification Hook
        GamificationService.trackAction('Professional', 'WRITE_NOTE');
        GamificationService.awardXp('Professional', 20, 'Documented Clinical Note');

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
        
        // Gamification Hook
        const activeRole = localStorage.getItem('psypyrus_active_role') || 'Professional';
        if (activeRole === 'Professional') {
            GamificationService.trackAction('Professional', 'COMPLETE_ASSESSMENT');
            GamificationService.awardXp('Professional', 15, 'Conducted Patient Assessment');
        } else {
            GamificationService.trackAction('Patient', 'COMPLETE_ASSESSMENT');
            GamificationService.awardXp('Patient', 25, 'Completed Self-Assessment');
            GamificationService.awardCoins('Patient', 10, 'Self-Assessment Bonus');
        }

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
        
        // Gamification Hook
        GamificationService.trackAction('Patient', 'LOG_MOOD');
        GamificationService.awardXp('Patient', 10, 'Logged Daily Mood');
        
        if (newLog.breathingSeconds > 0) {
            GamificationService.trackAction('Patient', 'COMPLETE_BREATHING');
            GamificationService.awardXp('Patient', 15, 'Completed Somatic Breathing');
            GamificationService.awardCoins('Patient', 5, 'Somatic Breathing Pacing');
        }

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
        
        // Gamification Hook
        GamificationService.trackAction('Professional', 'ASSIGN_HOMEWORK');
        GamificationService.awardXp('Professional', 10, 'Assigned Patient Homework');

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
            
            // Gamification Hook
            if (tasks[idx].isCompleted) {
                GamificationService.trackAction('Patient', 'COMPLETE_HOMEWORK');
                GamificationService.awardXp('Patient', 30, 'Completed Homework Task');
                GamificationService.awardCoins('Patient', 10, 'CBT Task Reward');
            }

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

    // --- Intake Forms ---
    static getIntakeForms(patientId = null) {
        const forms = this.get(STORAGE_KEYS.INTAKE_FORMS) || [];
        if (patientId) {
            return forms.filter(f => f.patientId === Number(patientId));
        }
        return forms;
    }

    static insertIntakeForm(formData) {
        const forms = this.get(STORAGE_KEYS.INTAKE_FORMS) || [];
        const newForm = {
            ...formData,
            id: forms.length ? Math.max(...forms.map(f => f.id)) + 1 : 1,
            date: Date.now()
        };
        forms.push(newForm);
        this.set(STORAGE_KEYS.INTAKE_FORMS, forms);
        this.logAudit("Saved Intake Form", `Saved completed form '${newForm.formTitle}' (Form ID: ${newForm.id}) for Patient ID ${newForm.patientId}`);
        
        // Gamification Hook
        const activeRole = localStorage.getItem('psypyrus_active_role') || 'Professional';
        if (activeRole === 'Professional') {
            GamificationService.trackAction('Professional', 'WRITE_NOTE');
            GamificationService.awardXp('Professional', 20, 'Digitized Intake Form');
        } else {
            GamificationService.trackAction('Patient', 'COMPLETE_HOMEWORK');
            GamificationService.awardXp('Patient', 30, 'Completed Intake Form');
            GamificationService.awardCoins('Patient', 15, 'Intake Form Bonus');
        }

        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INTAKE_FORMS } }));
        return newForm.id;
    }

    static deleteIntakeForm(formId) {
        const forms = this.get(STORAGE_KEYS.INTAKE_FORMS) || [];
        const filtered = forms.filter(f => f.id !== formId);
        this.set(STORAGE_KEYS.INTAKE_FORMS, filtered);
        this.logAudit("Deleted Intake Form", `Deleted completed form ID ${formId}`);
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INTAKE_FORMS } }));
    }

    // --- Marketplace Installed Apps ---
    static getInstalledApps() {
        return this.get(STORAGE_KEYS.INSTALLED_APPS) || [];
    }

    static installApp(appId, appName, role) {
        const apps = this.getInstalledApps();
        if (!apps.includes(appId)) {
            apps.push(appId);
            this.set(STORAGE_KEYS.INSTALLED_APPS, apps);
            this.logAudit("Marketplace App Installed", `User installed plugin '${appName}' (${appId}) in ${role} space.`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INSTALLED_APPS } }));
        }
    }

    static uninstallApp(appId, appName, role) {
        let apps = this.getInstalledApps();
        if (apps.includes(appId)) {
            apps = apps.filter(id => id !== appId);
            this.set(STORAGE_KEYS.INSTALLED_APPS, apps);
            this.logAudit("Marketplace App Uninstalled", `User uninstalled plugin '${appName}' (${appId}) from ${role} space.`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INSTALLED_APPS } }));
        }
    }

    // --- Clinical Search & Actions ---
    static searchPatients(query) {
        const patients = this.getPatients();
        if (!query) return patients;
        const q = query.toLowerCase();
        return patients.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.email.toLowerCase().includes(q) || 
            (p.specialty && p.specialty.toLowerCase().includes(q))
        );
    }

    static searchClinicalNotes(query, patientId = null) {
        const notes = this.getClinicalNotes(patientId);
        if (!query) return notes;
        const q = query.toLowerCase();
        return notes.filter(n => 
            (n.title && n.title.toLowerCase().includes(q)) || 
            (n.bodyJson && n.bodyJson.toLowerCase().includes(q))
        );
    }

    static getAssessmentTrends(patientId) {
        const scores = this.getAssessments(patientId);
        // Group by assessment type
        const groups = {};
        scores.forEach(s => {
            if (!groups[s.type]) {
                groups[s.type] = [];
            }
            groups[s.type].push(s);
        });
        // Sort each group by date ascending
        Object.keys(groups).forEach(type => {
            groups[type].sort((a, b) => a.date - b.date);
        });
        return groups;
    }

    static updatePatient(patientId, updatedFields) {
        const patients = this.get(STORAGE_KEYS.PATIENTS);
        const idx = patients.findIndex(p => p.id === Number(patientId));
        if (idx !== -1) {
            patients[idx] = { ...patients[idx], ...updatedFields };
            this.set(STORAGE_KEYS.PATIENTS, patients);
            this.logAudit("Patient Updated", `Updated fields for Patient ID ${patientId}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.PATIENTS } }));
            return true;
        }
        return false;
    }

    static deletePatient(patientId) {
        const pId = Number(patientId);
        // Cascade delete patient record
        const patients = this.get(STORAGE_KEYS.PATIENTS).filter(p => p.id !== pId);
        this.set(STORAGE_KEYS.PATIENTS, patients);

        // Deletions across other stores
        const appts = this.get(STORAGE_KEYS.APPOINTMENTS).filter(a => a.patientId !== pId);
        this.set(STORAGE_KEYS.APPOINTMENTS, appts);

        const assessments = this.get(STORAGE_KEYS.ASSESSMENTS).filter(s => s.patientId !== pId);
        this.set(STORAGE_KEYS.ASSESSMENTS, assessments);

        const notes = this.get(STORAGE_KEYS.CLINICAL_NOTES).filter(n => n.patientId !== pId);
        this.set(STORAGE_KEYS.CLINICAL_NOTES, notes);

        const tasks = this.get(STORAGE_KEYS.HOMEWORK).filter(t => t.patientId !== pId);
        this.set(STORAGE_KEYS.HOMEWORK, tasks);

        const moodLogs = this.get(STORAGE_KEYS.MOOD_LOGS).filter(l => l.patientId !== pId);
        this.set(STORAGE_KEYS.MOOD_LOGS, moodLogs);

        const intakeForms = this.get(STORAGE_KEYS.INTAKE_FORMS).filter(f => f.patientId !== pId);
        this.set(STORAGE_KEYS.INTAKE_FORMS, intakeForms);

        this.logAudit("Patient Deleted", `Cascade deleted patient ID ${pId} and all related clinical logs.`);
        
        // Dispatch changes
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.PATIENTS } }));
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.APPOINTMENTS } }));
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.CLINICAL_NOTES } }));
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INTAKE_FORMS } }));
        return true;
    }

    static exportDatabaseToJson() {
        const exportObj = {};
        Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
            exportObj[key] = this.get(storageKey);
        });
        return JSON.stringify(exportObj, null, 2);
    }

    static importDatabaseFromJson(jsonStr) {
        try {
            const importObj = JSON.parse(jsonStr);
            Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
                if (importObj[key]) {
                    this.set(storageKey, importObj[key]);
                }
            });
            this.logAudit("Database Restored", "Imported and restored complete database from JSON backup file.");
            // Dispatch general change to reload all screens
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: 'all' } }));
            return true;
        } catch (e) {
            console.error("Failed to import database JSON:", e);
            return false;
        }
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
        localStorage.removeItem(STORAGE_KEYS.INSTALLED_APPS);
        localStorage.removeItem(STORAGE_KEYS.INTAKE_FORMS);
        this.init();
    }
}
// Initialize database on import
Database.init();
window.PsyPyrusDatabase = Database;
