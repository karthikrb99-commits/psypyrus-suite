/**
 * PsyPyrus AI - Offline Database Simulator (localStorage wrapper)
 * Mimics Room Database entities and provides reactive-like reads/writes.
 * Modernized with production-grade distributed systems patterns:
 *   Phase 1: Caching, Indexing, Connection Pooling, ACID Transactions,
 *             Rate Limiting, Idempotency, Message Queue + DLQ
 *   Phase 2: Circuit Breaker, Saga Pattern, Distributed Locks,
 *             Consistent Hashing, Bulkhead Isolation, Logger, Tracer
 */

import { GamificationService } from './gamification';
import { Logger } from './logger';
import { Tracer } from './tracer';

const STORAGE_KEYS = {
    PATIENTS: 'psypyrus_patients',
    APPOINTMENTS: 'psypyrus_appointments',
    CLINICAL_NOTES: 'psypyrus_clinical_notes',
    ASSESSMENTS: 'psypyrus_assessments',
    MOOD_LOGS: 'psypyrus_mood_logs',
    AUDIT_LOGS: 'psypyrus_audit_logs',
    HOMEWORK: 'psypyrus_homework_tasks',
    INSTALLED_APPS: 'psypyrus_installed_apps',
    INTAKE_FORMS: 'psypyrus_intake_forms',
    CARE_REQUESTS: 'psypyrus_care_requests',
    RESEARCH_INVITES: 'psypyrus_research_invites',
    PRICING_AGREEMENTS: 'psypyrus_pricing_agreements',
    THERAPEUTIC_CONTRACTS: 'psypyrus_therapeutic_contracts',
    PUBLIC_PROFILES: 'psypyrus_public_profiles',
    INVOICES: 'psypyrus_invoices'
};

// Initial Clinical Seed Data
const SEED_DATA = {
    patients: [
        { id: 1, name: "Liam Carter", age: 29, gender: "Male", email: "liam.carter@health.me", phone: "555-0192", riskStatus: "Severe", specialty: "Major Depres. (Single Ep.)", registrationDate: Date.now() - 86400000 * 45 },
        { id: 2, name: "Sarah Jenkins", age: 34, gender: "Female", email: "sarah.j@outlook.com", phone: "555-2311", riskStatus: "Moderate", specialty: "Generalized Anxiety Disorder", registrationDate: Date.now() - 86400000 * 30 },
        { id: 3, name: "John Doe", age: 42, gender: "Male", email: "j.doe@company.com", phone: "555-8833", riskStatus: "None", specialty: "ADHD Clinical Consultation", registrationDate: Date.now() - 86400000 * 20 },
        { id: 4, name: "Sophia Patel", age: 23, gender: "Female", email: "sophia.patel@edu.org", phone: "555-4422", riskStatus: "Low", specialty: "PTSD Trauma Therapy", registrationDate: Date.now() - 86400000 * 15, abhaNumber: "91-2345-6789-0123", abhaAddress: "sophia.patel@abdm" },
        { id: 5, name: "Aarav Sharma", age: 10, gender: "Male", email: "aarav.sharma@health.in", phone: "91-98765-43210", riskStatus: "Low", specialty: "ADHD Clinical Consultation", registrationDate: Date.now() - 86400000 * 10, abhaNumber: "91-4455-6677-8899", abhaAddress: "aarav@abdm" },
        { id: 6, name: "Leela Devi", age: 72, gender: "Female", email: "leela.devi@care.in", phone: "91-87654-32109", riskStatus: "Moderate", specialty: "Major Depres. (Single Ep.)", registrationDate: Date.now() - 86400000 * 5, abhaNumber: "91-1122-3344-5566", abhaAddress: "leela@abdm" }
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
    ],
    research_invites: [
        { id: 1, title: "Somatic Breathing for Panic Disorder", institution: "Stanford University School of Medicine", category: "Anxiety", description: "This study evaluates the effectiveness of real-time somatic breathing pacing on somatic indicators during panic episodes. Looking for patients diagnosed with panic disorder.", principalInvestigator: "Dr. Alicia Vance", compensation: "$50 Stipend + Free Wearable Tracker", eligibility: "Age 18-45, diagnosed with panic disorder or high anxiety.", status: "Open Studies", upvotes: 18, comments: [ { id: 1, userName: "Sarah Jenkins", comment: "Is remote participation available?", date: Date.now() - 86400000 } ], collaborations: [], timestamp: Date.now() - 86400000 * 3 },
        { id: 2, title: "CBT Habit Tracking and Executive Dysfunction", institution: "PsyPyrus Institute of Tech-Care", category: "ADHD & Anxiety", description: "Evaluating user interface variations in cognitive behavior therapy micro-habit logs. Involves a 3-week study with active daily journaling.", principalInvestigator: "Dr. Liam Carter", compensation: "Certificate of Participation + $25 Wellness Credit", eligibility: "Active clinic patient, experiencing ADHD/GAD.", status: "In Review", upvotes: 12, comments: [], collaborations: [], timestamp: Date.now() - 86400000 * 2 },
        { id: 3, title: "Socioeconomic Factors in E-Mental Health Adherence", institution: "All-India Institute of Medical Sciences", category: "General Psychiatry", description: "Determining adherence trends across various demographics using standard online wellness lounges. Multi-center collaboration.", principalInvestigator: "Prof. Aarav Sharma", compensation: "$100 Participation Stipend", eligibility: "Age 18-70, currently using a mental wellness application.", status: "Ongoing", upvotes: 35, comments: [], collaborations: [ { professionalName: "Dr. Liam Carter", message: "Interested in contributing patient demography data." } ], timestamp: Date.now() - 86400000 }
    ],
    pricing_agreements: [
        { id: 1, patientId: 1, patientName: "Liam Carter", professionalId: "dr_liam", professionalName: "Dr. Liam Carter", proposedFee: 60, tier: "Student", status: "Approved", message: "Currently enrolled in a university program and working part-time. Requesting student sliding scale rate.", date: Date.now() - 86400000 * 10 },
        { id: 2, patientId: 2, patientName: "Sarah Jenkins", professionalId: "dr_liam", professionalName: "Dr. Liam Carter", proposedFee: 0, tier: "Low Income Pro Bono", status: "Pending", message: "In between jobs, requesting low-income tier pro bono therapy sessions.", date: Date.now() - 86400000 * 2 }
    ],
    therapeutic_contracts: [
        {
            id: 1,
            patientId: 1,
            patientName: "Liam Carter",
            professionalId: "dr_liam",
            professionalName: "Dr. Liam Carter",
            goals: ["Reduce daily anxiety episodes", "Implement weekly somatic breathing exercises", "Improve sleep latency to under 30 minutes"],
            sessionFrequency: "Weekly",
            sessionDuration: 50,
            cancellationPolicy: "24-Hour Notice Required",
            confidentialityExclusions: "Standard exclusions (imminent danger to self/others, child/elder abuse, court subpoena)",
            communicationBoundaries: "Email for scheduling only. No social media contact. Crisis hotline for emergencies.",
            status: "Approved",
            proposedFee: 60,
            patientSignature: "Liam Carter",
            patientSignedAt: Date.now() - 86400000 * 9,
            clinicianSignature: "Dr. Liam Carter",
            clinicianSignedAt: Date.now() - 86400000 * 9,
            negotiationHistory: [
                { sender: "Professional", message: "Initial contract terms established.", timestamp: Date.now() - 86400000 * 10 },
                { sender: "Patient", message: "Looks great, ready to sign.", timestamp: Date.now() - 86400000 * 9 }
            ],
            cryptographicSeal: "8a6e87fbc2664539ef5b6d5108b98e566711c210da8eeef34224941728190da8",
            date: Date.now() - 86400000 * 9
        },
        {
            id: 2,
            patientId: 2,
            patientName: "Sarah Jenkins",
            professionalId: "dr_liam",
            professionalName: "Dr. Liam Carter",
            goals: ["CBT cognitive restructuring", "Overcome occupational burn-out distortions"],
            sessionFrequency: "Biweekly",
            sessionDuration: 60,
            cancellationPolicy: "48-Hour Notice Required",
            confidentialityExclusions: "Standard legal and safety exclusions apply.",
            communicationBoundaries: "Use PsychConnect secure messages for updates. No personal SMS.",
            status: "Pending Patient Review",
            proposedFee: 0,
            patientSignature: "",
            patientSignedAt: null,
            clinicianSignature: "Dr. Liam Carter",
            clinicianSignedAt: Date.now() - 86400000,
            negotiationHistory: [
                { sender: "Professional", message: "Proposed contract draft. Please review and sign or comment with your counters.", timestamp: Date.now() - 86400000 }
            ],
            cryptographicSeal: "",
            date: Date.now() - 86400000
        }
    ],
    public_profiles: [
        {
            professionalId: 'dr_liam',
            name: 'Dr. Liam Carter',
            title: 'Lead Clinical Psychiatrist & Neuroscientist',
            bio: 'Board-certified psychiatrist specializing in treatment-resistant depression, ADHD, and computational psychometrics. Pioneer of the PsyPyrus AI Operating System.',
            specialties: ['Major Depressive Disorder', 'ADHD Executive Coaching', 'Generalized Anxiety Disorder', 'PTSD Trauma Recovery'],
            consultationMode: 'Hybrid (Video & In-Person)',
            languages: ['English', 'Spanish'],
            address: '100 Medical Plaza, Suite 401, San Francisco, CA 94143',
            theme: 'teal-mint',
            font: 'Outfit',
            services: [
                { id: 1, name: 'Comprehensive Psychiatric Intake', duration: 60, fee: 250, description: 'Complete evaluation including history, MSE, and initial diagnostic workup.' },
                { id: 2, name: 'Psychopharmacology Follow-up', duration: 30, fee: 120, description: 'Review of medication effectiveness, side effects, and dosage adjustments.' },
                { id: 3, name: 'CBT Cognitive Restructuring Session', duration: 50, fee: 150, description: 'Evidence-based cognitive restructuring and therapeutic restructuring homework.' },
                { id: 4, name: 'Emergency Crisis Teletherapy', duration: 45, fee: 180, description: 'Urgent stabilization, risk screening, and safety planning.' }
            ]
        }
    ],
    invoices: [
        { id: 101, patientId: 1, patientName: 'Liam Carter', serviceName: 'Comprehensive Psychiatric Intake', amount: 250.00, date: Date.now() - 86400000 * 15, status: 'Paid', paymentMethod: 'Visa ending in 4242', transactionId: 'ch_3Mv8x9L2eZ1xQ9y1A2b3c4d5' },
        { id: 102, patientId: 1, patientName: 'Liam Carter', serviceName: 'CBT Cognitive Restructuring Session', amount: 60.00, date: Date.now() - 86400000 * 7, status: 'Paid', paymentMethod: 'Google Pay', transactionId: 'ch_3Mv8x9L2eZ1xQ9y1A6f7g8h9' },
        { id: 103, patientId: 2, patientName: 'Sarah Jenkins', serviceName: 'CBT Cognitive Restructuring Session', amount: 150.00, date: Date.now() - 86400000 * 3, status: 'Overdue', paymentMethod: null, transactionId: null },
        { id: 104, patientId: 1, patientName: 'Liam Carter', serviceName: 'Psychopharmacology Follow-up', amount: 60.00, date: Date.now() - 86400000, status: 'Pending', paymentMethod: null, transactionId: null }
    ]
};

// Database class definition
export class Database {
    // --- Distributed Systems Features & States ---
    
    // In-memory cache map & statistics
    static _cache = new Map();
    static cacheStats = { hits: 0, misses: 0, evictions: 0 };

    // Connection Pool (Queues up tasks if active operations exceed limit)
    static connectionPool = {
        maxConnections: 3,
        activeConnections: 0,
        waitingQueue: [],
        
        async acquire() {
            if (this.activeConnections < this.maxConnections) {
                this.activeConnections++;
                return;
            }
            return new Promise(resolve => {
                this.waitingQueue.push(resolve);
            });
        },
        
        release() {
            if (this.waitingQueue.length > 0) {
                const nextResolve = this.waitingQueue.shift();
                nextResolve();
            } else {
                this.activeConnections = Math.max(0, this.activeConnections - 1);
            }
        }
    };

    // Index structure for O(1) lookups
    static _indexes = {
        patients: { byId: new Map(), byEmail: new Map() },
        appointments: { byPatientId: new Map() },
        clinical_notes: { byPatientId: new Map() },
        assessments: { byPatientId: new Map() },
        mood_logs: { byPatientId: new Map() },
        homework: { byPatientId: new Map() },
        intake_forms: { byPatientId: new Map() }
    };

    // Tracking the last query's execution plan
    static lastQueryPlan = { query: '', strategy: 'Sequential Table Scan', durationMs: 0 };

    // Transaction tracking & locks
    static _locks = new Set();
    static transactionDepth = 0;
    static transactionLogs = [];

    // Rate Limiter: Token Bucket
    static rateLimit = {
        tokens: 15,
        maxTokens: 15,
        refillRate: 3, // 3 tokens per second
        lastRefill: Date.now(),
        
        consume(count = 1) {
            const now = Date.now();
            const elapsedSeconds = (now - this.lastRefill) / 1000;
            this.tokens = Math.min(this.maxTokens, this.tokens + elapsedSeconds * this.refillRate);
            this.lastRefill = now;
            
            if (this.tokens >= count) {
                this.tokens -= count;
                return true;
            }
            return false;
        }
    };

    // Message Queue and Dead Letter Queue (DLQ)
    static MQ_KEYS = {
        QUEUE: 'psypyrus_mq_queue',
        DLQ: 'psypyrus_mq_dlq'
    };

    // Idempotency tracking keys
    static _idempotencyKeysKey = "psypyrus_idempotency_keys";

    // =====================================================================
    // ADVANCED RESILIENCE PATTERNS
    // =====================================================================

    // --- Circuit Breaker ---
    // States: CLOSED (normal) -> OPEN (failing, reject calls) -> HALF_OPEN (probe recovery)
    static circuitBreaker = {
        state: 'CLOSED',        // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
        failureCount: 0,
        failureThreshold: 5,    // Open after 5 consecutive failures
        successThreshold: 2,    // Close again after 2 successes in HALF_OPEN
        halfOpenSuccesses: 0,
        openedAt: null,
        recoveryTimeoutMs: 30000, // 30s before probing again
        history: [],            // Log of state transitions

        recordSuccess() {
            if (this.state === 'HALF_OPEN') {
                this.halfOpenSuccesses++;
                if (this.halfOpenSuccesses >= this.successThreshold) {
                    this._transition('CLOSED');
                    this.failureCount = 0;
                    this.halfOpenSuccesses = 0;
                }
            } else if (this.state === 'CLOSED') {
                this.failureCount = 0;
            }
        },

        recordFailure() {
            this.failureCount++;
            if (this.state === 'HALF_OPEN') {
                this._transition('OPEN');
                this.halfOpenSuccesses = 0;
                this.openedAt = Date.now();
            } else if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
                this._transition('OPEN');
                this.openedAt = Date.now();
            }
        },

        isCallPermitted() {
            if (this.state === 'CLOSED') return true;
            if (this.state === 'OPEN') {
                if (Date.now() - this.openedAt >= this.recoveryTimeoutMs) {
                    this._transition('HALF_OPEN');
                    this.halfOpenSuccesses = 0;
                    return true; // Allow one probe call
                }
                return false; // Still open, reject
            }
            if (this.state === 'HALF_OPEN') return true; // Allow probe
            return false;
        },

        reset() {
            this.state = 'CLOSED';
            this.failureCount = 0;
            this.halfOpenSuccesses = 0;
            this.openedAt = null;
            this.history = [];
        },

        _transition(newState) {
            const prev = this.state;
            this.state = newState;
            const entry = { from: prev, to: newState, at: new Date().toISOString() };
            this.history.unshift(entry);
            if (this.history.length > 20) this.history.pop();
            window.dispatchEvent(new CustomEvent('psypyrus_cb_change', { detail: entry }));
        }
    };

    // --- Saga Engine ---
    // Executes a list of {execute, compensate} steps. On failure, compensates in reverse.
    static sagaLogs = [];

    // --- Distributed Lock Registry ---
    // Named locks (distinct from table-level ACID locks) for resource-level exclusion
    static _distributedLocks = new Map(); // resource -> { owner, acquiredAt }
    static distributedLockLogs = [];

    // --- Consistent Hashing Ring ---
    // Maps data keys to virtual nodes using a hash ring for partitioning awareness
    static hashRing = {
        nodes: ['Node-A', 'Node-B', 'Node-C', 'Node-D'],
        virtualNodeCount: 3,
        ring: [],

        _hash(str) {
            let h = 0;
            for (let i = 0; i < str.length; i++) {
                h = (h * 31 + str.charCodeAt(i)) >>> 0;
            }
            return h;
        },

        build() {
            this.ring = [];
            for (const node of this.nodes) {
                for (let v = 0; v < this.virtualNodeCount; v++) {
                    const vKey = `${node}#vnode-${v}`;
                    this.ring.push({ hash: this._hash(vKey), node });
                }
            }
            this.ring.sort((a, b) => a.hash - b.hash);
        },

        getNode(key) {
            if (this.ring.length === 0) this.build();
            const keyHash = this._hash(String(key));
            for (const entry of this.ring) {
                if (keyHash <= entry.hash) return entry.node;
            }
            return this.ring[0].node; // wrap around
        }
    };

    // --- Bulkhead Pattern ---
    // Separate resource pools for reads vs writes to prevent cascade failures
    static bulkhead = {
        readPool: { max: 5, active: 0, queue: [], name: 'Read Pool' },
        writePool: { max: 2, active: 0, queue: [], name: 'Write Pool' },

        async acquire(poolName) {
            const pool = this[poolName];
            if (!pool) throw new Error(`Unknown bulkhead pool: ${poolName}`);
            if (pool.active < pool.max) {
                pool.active++;
                return;
            }
            if (pool.queue.length >= pool.max * 2) {
                throw new Error(`Bulkhead ${pool.name} queue overflow. Circuit open for pool.`);
            }
            return new Promise(resolve => pool.queue.push(resolve));
        },

        release(poolName) {
            const pool = this[poolName];
            if (!pool) return;
            if (pool.queue.length > 0) {
                const next = pool.queue.shift();
                next();
            } else {
                pool.active = Math.max(0, pool.active - 1);
            }
        },

        getStats() {
            return {
                reads: { active: this.readPool.active, queued: this.readPool.queue.length, max: this.readPool.max },
                writes: { active: this.writePool.active, queued: this.writePool.queue.length, max: this.writePool.max }
            };
        }
    };

    // --- Caching Utilities ---
    static getCache(key) {
        if (this._cache.has(key)) {
            this.cacheStats.hits++;
            return this._cache.get(key);
        }
        this.cacheStats.misses++;
        return null;
    }

    static setCache(key, data) {
        this._cache.set(key, data);
    }

    static invalidateCache(key) {
        if (this._cache.has(key)) {
            this.cacheStats.evictions++;
            this._cache.delete(key);
        }
    }

    static clearCache() {
        this._cache.clear();
        this.cacheStats.evictions++;
    }

    // --- Indexing Utilities ---
    static rebuildIndexes() {
        this._indexes.patients.byId.clear();
        this._indexes.patients.byEmail.clear();
        this._indexes.appointments.byPatientId.clear();
        this._indexes.clinical_notes.byPatientId.clear();
        this._indexes.assessments.byPatientId.clear();
        this._indexes.mood_logs.byPatientId.clear();
        this._indexes.homework.byPatientId.clear();
        this._indexes.intake_forms.byPatientId.clear();

        const patients = this._readRaw(STORAGE_KEYS.PATIENTS);
        patients.forEach(p => {
            this._indexes.patients.byId.set(Number(p.id), p);
            if (p.email) this._indexes.patients.byEmail.set(p.email.toLowerCase(), p);
        });

        const indexByPatientId = (storageKey, indexMap) => {
            const items = this._readRaw(storageKey);
            items.forEach(item => {
                const pid = Number(item.patientId);
                if (pid) {
                    if (!indexMap.has(pid)) indexMap.set(pid, []);
                    indexMap.get(pid).push(item);
                }
            });
        };

        indexByPatientId(STORAGE_KEYS.APPOINTMENTS, this._indexes.appointments.byPatientId);
        indexByPatientId(STORAGE_KEYS.CLINICAL_NOTES, this._indexes.clinical_notes.byPatientId);
        indexByPatientId(STORAGE_KEYS.ASSESSMENTS, this._indexes.assessments.byPatientId);
        indexByPatientId(STORAGE_KEYS.MOOD_LOGS, this._indexes.mood_logs.byPatientId);
        indexByPatientId(STORAGE_KEYS.HOMEWORK, this._indexes.homework.byPatientId);
        indexByPatientId(STORAGE_KEYS.INTAKE_FORMS, this._indexes.intake_forms.byPatientId);
    }

    // --- Rate Limit check ---
    static checkRateLimit() {
        if (!this.rateLimit.consume(1)) {
            const error = new Error("HTTP 429 Too Many Requests: Local Database write rate limit exceeded.");
            error.status = 429;
            throw error;
        }
    }

    // --- Lock management ---
    static acquireLock(table) {
        if (this._locks.has(table)) {
            if (this.transactionDepth > 1) {
                return; // Re-entrant lock reuse
            }
            throw new Error(`LockConflictException: Table ${table} is locked by another active database operation.`);
        }
        this._locks.add(table);
        this.transactionLogs.push(`Acquired Exclusive Lock on table '${table}'`);
    }

    static releaseLock(table) {
        if (this.transactionDepth > 1) {
            return; // Only release locks at outermost depth completion
        }
        this._locks.delete(table);
        this.transactionLogs.push(`Released Lock on table '${table}'`);
    }

    // --- Transaction Wrapper (ACID) ---
    static runInTransaction(callback, tablesToLock = []) {
        const isRootTx = this.transactionDepth === 0;
        const txTrace = isRootTx ? Tracer.startSpan('dbTransaction', null, { tables: tablesToLock.join(',') }) : null;

        this.transactionDepth++;
        const snapshot = {};
        const tablesWeLocked = [];
        
        try {
            // Phase 1: Acquire Locks & Snapshot (Durability & Isolation prep)
            tablesToLock.forEach(table => {
                if (!this._locks.has(table)) {
                    this.acquireLock(table);
                    snapshot[table] = localStorage.getItem(table);
                    tablesWeLocked.push(table);
                }
            });

            this.transactionLogs.push(`Started transaction depth ${this.transactionDepth} locking [${tablesToLock.join(', ')}]`);
            Logger.info('database-service', 'TX_START', `Started transaction depth ${this.transactionDepth}`, { tables: tablesToLock, depth: this.transactionDepth });
            
            // Phase 2: Execute operation (Atomicity & Consistency check)
            const result = callback();
            
            if (this.transactionDepth === 1) {
                this.transactionLogs.push(`Transaction committed successfully. Changes applied to local store.`);
                Logger.info('database-service', 'TX_COMMIT', 'Transaction committed successfully.', { tables: tablesToLock });
                tablesToLock.forEach(table => this.invalidateCache(table));
            }
            if (isRootTx && txTrace) {
                Tracer.endSpan(txTrace.spanId);
            }
            return result;
        } catch (error) {
            // Phase 3: Rollback on Error
            tablesWeLocked.forEach(table => {
                if (snapshot[table] === null) {
                    localStorage.removeItem(table);
                } else {
                    localStorage.setItem(table, snapshot[table]);
                }
            });
            this.transactionLogs.push(`Transaction FAILED at depth ${this.transactionDepth}: "${error.message}". Database rolled back to previous snapshot.`);
            Logger.error('database-service', 'TX_ROLLBACK', `Transaction failed: ${error.message}`, { error: error.message, tables: tablesToLock });
            if (isRootTx && txTrace) {
                Tracer.endSpan(txTrace.spanId, true, error.message);
            }
            throw error;
        } finally {
            // Phase 4: Release Locks
            tablesWeLocked.forEach(table => {
                this.releaseLock(table);
            });
            this.transactionDepth--;
            if (this.transactionDepth === 0) {
                this.rebuildIndexes();
            }
        }
    }

    // --- Idempotency Utilities ---
    static getIdempotentResult(idempotencyKey) {
        if (!idempotencyKey) return null;
        const raw = localStorage.getItem(this._idempotencyKeysKey);
        const keys = raw ? JSON.parse(raw) : {};
        if (keys[idempotencyKey]) {
            this.transactionLogs.push(`Deduplicated request for Idempotency Key: ${idempotencyKey}`);
            return keys[idempotencyKey].result;
        }
        return null;
    }

    static saveIdempotentResult(idempotencyKey, result) {
        if (!idempotencyKey) return;
        const raw = localStorage.getItem(this._idempotencyKeysKey);
        const keys = raw ? JSON.parse(raw) : {};
        keys[idempotencyKey] = {
            result,
            timestamp: Date.now()
        };
        localStorage.setItem(this._idempotencyKeysKey, JSON.stringify(keys));
    }

    // --- Message Queue (MQ) Utilities ---
    static getQueue() {
        const item = localStorage.getItem(this.MQ_KEYS.QUEUE);
        return item ? JSON.parse(item) : [];
    }

    static setQueue(data) {
        localStorage.setItem(this.MQ_KEYS.QUEUE, JSON.stringify(data));
    }

    static getDLQ() {
        const item = localStorage.getItem(this.MQ_KEYS.DLQ);
        return item ? JSON.parse(item) : [];
    }

    static setDLQ(data) {
        localStorage.setItem(this.MQ_KEYS.DLQ, JSON.stringify(data));
    }

    static enqueueTask(taskType, payload) {
        const queue = this.getQueue();
        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: taskType,
            payload,
            retries: 0,
            status: 'queued',
            timestamp: Date.now()
        };
        queue.push(newTask);
        this.setQueue(queue);
        this.transactionLogs.push(`Enqueued async task '${taskType}' (Id: ${newTask.id}) to Message Queue`);
        
        // Process asynchronously
        setTimeout(() => this.processQueue(), 50);
        
        window.dispatchEvent(new CustomEvent('psypyrus_mq_change'));
        return newTask.id;
    }

    static async processQueue() {
        await this.connectionPool.acquire();
        try {
            const queue = this.getQueue();
            if (queue.length === 0) return;

            const task = queue[0];
            if (task.status === 'processing') return;

            task.status = 'processing';
            this.setQueue(queue);
            window.dispatchEvent(new CustomEvent('psypyrus_mq_change'));

            try {
                this.transactionLogs.push(`Processing async task '${task.type}' (Id: ${task.id})`);
                await this.executeTask(task);
                
                // Remove task upon successful execution
                const updatedQueue = this.getQueue().filter(t => t.id !== task.id);
                this.setQueue(updatedQueue);
                this.transactionLogs.push(`Successfully completed task '${task.type}'`);
            } catch (err) {
                this.transactionLogs.push(`Task '${task.type}' failed: ${err.message}. Retries: ${task.retries}/3`);
                
                const currentQueue = this.getQueue();
                const currentTask = currentQueue.find(t => t.id === task.id);
                
                if (currentTask) {
                    if (currentTask.retries < 3) {
                        currentTask.retries++;
                        currentTask.status = 'queued';
                        this.setQueue(currentQueue);
                        // Retry with faster exponential backoff for testing compatibility
                        setTimeout(() => this.processQueue(), 100 * Math.pow(2, currentTask.retries));
                    } else {
                        // Move to Dead Letter Queue (DLQ)
                        const dlq = this.getDLQ();
                        currentTask.status = 'failed';
                        currentTask.error = err.message;
                        dlq.push(currentTask);
                        this.setDLQ(dlq);
                        
                        const updatedQueue = currentQueue.filter(t => t.id !== task.id);
                        this.setQueue(updatedQueue);
                        this.transactionLogs.push(`CRITICAL: Task '${task.type}' failed 3 retries. Moved to Dead Letter Queue (DLQ).`);
                    }
                }
            }
        } finally {
            this.connectionPool.release();
            window.dispatchEvent(new CustomEvent('psypyrus_mq_change'));
        }
    }

    static async executeTask(task) {
        if (task.type === 'SYNC_EHR') {
            const forceFail = localStorage.getItem('psypyrus_force_sync_fail') === 'true';
            if (forceFail) {
                throw new Error("ConnectionTimeoutException: Target EHR Server failed to acknowledge TCP handshakes.");
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        } else if (task.type === 'FIREBASE_SYNC') {
            const forceFail = localStorage.getItem('psypyrus_force_sync_fail') === 'true';
            if (forceFail) {
                throw new Error("FirebaseException: Write rejected due to network connection issues.");
            }
            await new Promise(resolve => setTimeout(resolve, 150));
        } else {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    static retryDLQ() {
        const dlq = this.getDLQ();
        if (dlq.length === 0) return;
        
        const queue = this.getQueue();
        dlq.forEach(task => {
            task.retries = 0;
            task.status = 'queued';
            task.error = undefined;
            queue.push(task);
        });
        
        this.setQueue(queue);
        this.setDLQ([]);
        this.transactionLogs.push(`Republished ${dlq.length} tasks from Dead Letter Queue back to Message Queue.`);
        
        setTimeout(() => this.processQueue(), 50);
        window.dispatchEvent(new CustomEvent('psypyrus_mq_change'));
    }

    static purgeDLQ() {
        const count = this.getDLQ().length;
        this.setDLQ([]);
        this.transactionLogs.push(`Purged ${count} tasks from Dead Letter Queue.`);
        window.dispatchEvent(new CustomEvent('psypyrus_mq_change'));
    }


    // --- Advanced Patterns: Utility Methods ---

    /**
     * Circuit Breaker: Wrap any callable with circuit breaker protection.
     * Throws if the circuit is OPEN. Records success/failure on each call.
     */
    static async circuitCall(fn, fallback = null) {
        if (!this.circuitBreaker.isCallPermitted()) {
            const msg = `CircuitBreakerOpenException: Service unavailable. Circuit is OPEN after ${this.circuitBreaker.failureCount} failures. Retry after ${Math.ceil((this.circuitBreaker.recoveryTimeoutMs - (Date.now() - this.circuitBreaker.openedAt)) / 1000)}s.`;
            Logger.warn('circuit-breaker', 'CB_OPEN', msg, { state: this.circuitBreaker.state });
            if (fallback !== null) return fallback;
            throw new Error(msg);
        }
        try {
            const result = await fn();
            this.circuitBreaker.recordSuccess();
            Logger.info('circuit-breaker', 'CB_SUCCESS', 'Call succeeded.', { state: this.circuitBreaker.state });
            return result;
        } catch (err) {
            this.circuitBreaker.recordFailure();
            Logger.error('circuit-breaker', 'CB_FAILURE', `Call failed: ${err.message}`, { state: this.circuitBreaker.state, failures: this.circuitBreaker.failureCount });
            throw err;
        }
    }

    /**
     * Saga Pattern: Execute a sequence of steps. On any failure, compensate in reverse.
     * Each step: { name: string, execute: () => any, compensate: () => void }
     */
    static async runSaga(steps, sagaName = 'Unnamed Saga') {
        const completed = [];
        const logEntry = { id: `saga_${Date.now()}`, name: sagaName, steps: [], status: 'running', startedAt: new Date().toISOString() };
        this.sagaLogs.unshift(logEntry);
        if (this.sagaLogs.length > 20) this.sagaLogs.pop();

        for (const step of steps) {
            try {
                logEntry.steps.push({ name: step.name, status: 'executing' });
                const result = await step.execute();
                logEntry.steps[logEntry.steps.length - 1].status = 'done';
                completed.push(step);
                Logger.info('saga-engine', 'SAGA_STEP_OK', `[${sagaName}] Step '${step.name}' completed.`, { step: step.name });
            } catch (err) {
                logEntry.steps[logEntry.steps.length - 1].status = 'failed';
                logEntry.steps[logEntry.steps.length - 1].error = err.message;
                Logger.error('saga-engine', 'SAGA_STEP_FAIL', `[${sagaName}] Step '${step.name}' FAILED: ${err.message}. Starting compensation.`, { step: step.name, error: err.message });

                // Compensate in reverse order
                for (const done of [...completed].reverse()) {
                    try {
                        await done.compensate();
                        logEntry.steps.push({ name: `[COMPENSATE] ${done.name}`, status: 'compensated' });
                        Logger.warn('saga-engine', 'SAGA_COMPENSATE', `[${sagaName}] Compensated step '${done.name}'.`, { step: done.name });
                    } catch (cErr) {
                        logEntry.steps.push({ name: `[COMPENSATE FAILED] ${done.name}`, status: 'compensation-failed', error: cErr.message });
                        Logger.error('saga-engine', 'SAGA_COMPENSATE_FAIL', `[${sagaName}] Compensation for '${done.name}' also failed: ${cErr.message}`, {});
                    }
                }

                logEntry.status = 'failed';
                window.dispatchEvent(new CustomEvent('psypyrus_saga_change', { detail: logEntry }));
                throw new Error(`SagaAbortedException: Step '${step.name}' failed — ${err.message}`);
            }
        }

        logEntry.status = 'committed';
        Logger.info('saga-engine', 'SAGA_COMMITTED', `[${sagaName}] All ${steps.length} steps committed successfully.`, { saga: sagaName });
        window.dispatchEvent(new CustomEvent('psypyrus_saga_change', { detail: logEntry }));
        return logEntry;
    }

    /**
     * Distributed Lock: Acquire a named resource lock.
     * Throws if already locked by another owner.
     */
    static acquireDistributedLock(resource, owner = 'system', ttlMs = 5000) {
        const existing = this._distributedLocks.get(resource);
        if (existing) {
            // Check if lock has expired (TTL)
            if (Date.now() - existing.acquiredAt < ttlMs) {
                const msg = `DistributedLockException: Resource '${resource}' is already locked by '${existing.owner}'. Try again later.`;
                Logger.warn('distributed-lock', 'LOCK_CONTENTION', msg, { resource, lockedBy: existing.owner });
                throw new Error(msg);
            }
            // Expired lock — force release
            Logger.warn('distributed-lock', 'LOCK_EXPIRED', `Lock on '${resource}' expired. Force-releasing.`, { resource, previous: existing.owner });
        }
        const lockEntry = { owner, acquiredAt: Date.now(), ttlMs };
        this._distributedLocks.set(resource, lockEntry);
        const log = `[LOCK ACQUIRED] '${resource}' by '${owner}' at ${new Date().toISOString()}`;
        this.distributedLockLogs.unshift(log);
        if (this.distributedLockLogs.length > 30) this.distributedLockLogs.pop();
        Logger.info('distributed-lock', 'LOCK_ACQUIRED', `Lock acquired on '${resource}' by '${owner}'.`, { resource, owner });
        window.dispatchEvent(new CustomEvent('psypyrus_lock_change'));
        return lockEntry;
    }

    static releaseDistributedLock(resource, owner = 'system') {
        const existing = this._distributedLocks.get(resource);
        if (!existing) return false;
        if (existing.owner !== owner) {
            Logger.warn('distributed-lock', 'LOCK_RELEASE_DENIED', `Cannot release lock on '${resource}' — owned by '${existing.owner}', not '${owner}'.`, { resource, owner });
            return false;
        }
        this._distributedLocks.delete(resource);
        const log = `[LOCK RELEASED] '${resource}' by '${owner}' at ${new Date().toISOString()}`;
        this.distributedLockLogs.unshift(log);
        if (this.distributedLockLogs.length > 30) this.distributedLockLogs.pop();
        Logger.info('distributed-lock', 'LOCK_RELEASED', `Lock on '${resource}' released by '${owner}'.`, { resource, owner });
        window.dispatchEvent(new CustomEvent('psypyrus_lock_change'));
        return true;
    }

    static getDistributedLocks() {
        const result = {};
        this._distributedLocks.forEach((val, key) => { result[key] = val; });
        return result;
    }

    // --- Core Database Implementation ---

    static init() {
        // Initialize storage keys if empty
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
        if (!localStorage.getItem(STORAGE_KEYS.CARE_REQUESTS)) {
            localStorage.setItem(STORAGE_KEYS.CARE_REQUESTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.RESEARCH_INVITES)) {
            localStorage.setItem(STORAGE_KEYS.RESEARCH_INVITES, JSON.stringify(SEED_DATA.research_invites));
        }
        if (!localStorage.getItem(STORAGE_KEYS.PRICING_AGREEMENTS)) {
            localStorage.setItem(STORAGE_KEYS.PRICING_AGREEMENTS, JSON.stringify(SEED_DATA.pricing_agreements));
        }
        if (!localStorage.getItem(STORAGE_KEYS.THERAPEUTIC_CONTRACTS)) {
            localStorage.setItem(STORAGE_KEYS.THERAPEUTIC_CONTRACTS, JSON.stringify(SEED_DATA.therapeutic_contracts));
        }
        if (!localStorage.getItem(STORAGE_KEYS.PUBLIC_PROFILES)) {
            localStorage.setItem(STORAGE_KEYS.PUBLIC_PROFILES, JSON.stringify(SEED_DATA.public_profiles));
        }
        if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
            localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(SEED_DATA.invoices));
        }

        // Hot patch existing localstorage patients with Elena, Lucas, and Aanya if absent
        const currentPatients = this._readRaw(STORAGE_KEYS.PATIENTS);
        if (currentPatients.length > 0 && !currentPatients.some(p => p.name === "Elena Rostova")) {
            const extraPatients = [
        {
            id: 7,
            name: "Elena Rostova",
            age: 34,
            gender: "Female",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
            email: "elena.rostova@health.org",
            phone: "+1 (555) 234-5678",
            riskStatus: "Moderate",
            specialty: "Major Depres. (Single Ep.)",
            registrationDate: Date.now() - 86400000 * 5,
            abhaId: "elena.rostova@sbx",
            demographics: {
                dob: "1992-04-12",
                occupation: "Research Scientist (Biomedical)",
                contact: "+1 (555) 234-5678",
                emergencyContact: "Mikhail Rostov (Spouse) - +1 (555) 987-6543",
                insurance: "Blue Cross Prime PPO"
            },
            medicalHistory: [
                "Hypothyroidism (Diagnosed 2018, managed with Levothyroxine)",
                "Mild seasonal asthma (managed with Albuterol PRN)"
            ],
            psychiatricHistory: [
                "Moderate Depressive Episode (2021, resolved with Sertraline 50mg & brief CBT)",
                "Generalized anxiety symptoms since adolescence, un-medicated"
            ],
            familyHistory: [
                "Maternal Grandmother: Treated for major recurrent depressive disorder",
                "Paternal Uncle: History of alcohol abuse"
            ],
            allergies: [
                "Penicillin (leads to severe hives)",
                "Sulfa drugs (moderate rash)"
            ],
            currentMedications: [
                {
                    name: "Sertraline",
                    dose: "100mg daily (morning)",
                    adherence: "Highly adherent (~95% compliance)",
                    sideEffects: "Vague nausea in first week, mild emotional flattening reported at high doses"
                },
                {
                    name: "Levothyroxine",
                    dose: "75mcg daily",
                    adherence: "Fully adherent",
                    sideEffects: "None reported"
                }
            ],
            riskAssessment: {
                level: "MODERATE",
                suicideRisk: "Passive suicidal ideation expressed ('wish I could sleep and not wake up for a month'). No plan, active intent, or immediate preparatory behaviors verbalized.",
                selfHarmRisk: "No historic or present self-harm/cutting behaviours.",
                violenceRisk: "Negligible. Displays helpful, gentle cooperative demeanor.",
                lastAssessmentDate: "2026-06-10",
                clinicalFlags: [
                    "Passive Ideation Flag",
                    "Severe Sleeping Deficit (insomnia)"
                ]
            },
            rawIntakeBullets: `Presenting Complaint:
- 4-month history of worsening low mood, profound anhedonia, and severe sleep onset and maintenance insomnia (getting 3-4 hours of broken sleep).
- Coping poorly with recent research laboratory reorganization. Feels persistently guilty about 'wasting time' and being 'an intellectual fraud' (imposter syndrome).
- Decreased appetite with 6 lbs unintentional weight loss over 3 months.
- Energy levels extremely depleted. Struggles to initiate basic administrative tasks. 
- Denies manic episodes, visual/auditory perceptions or paranoia.
- Describes anxiety as a permanent 'knot in the chest' coupled with excessive worrying about project deliverables.`,
            rawMseBullets: `Appearance: Patient appeared well-groomed but pale with prominent dark undereye circles, conforming to stated age. Dressed in professional casual attire.
Behavior: Maintained decent but intermittent eye contact. Soft, slightly stooped posture, notable psychomotor retardation during motor movements. No tics or tremors.
Speech: Speech was slow, soft-spoken, and deliberate, with prolonged response latencies.
Mood: Subjective mood described as 'sunken', 'completely hollow', and 'exhausted'.
Affect: Restricted, dysthymic, tearful when discussing her research hurdles, but remains fully congruent with her depressed mood.
Thought Process: Linear and coherent, but slow and depleted of spontaneous ideas.
Thought Content: Preoccupied with themes of failure, academic inadequacy, and laboratory hurdles. Passive death wish verbalized ('just wanting a long break from consciousness') but explicitly contracted for safety. No delusional content.
Perception: No auditory or visual hallucinations active or historic.
Cognition: Intact orientation to time, place, and person. Self-reported memory difficulties, but recalled 3/3 words after 5 minutes on formal testing.
Insight: Good. Realizes her low mood and insomnia are clinical problems and wants help.
Judgment: Intact regarding practical affairs, treatment adherence, and safety planning.`,
            rawSoapBullets: `S: Patient states that the last week was 'incredibly heavy.' Her laboratory supervisor noticed her low stamina and suggested she take time off, which triggered intense guilt. Insomnia remains severe, takes 2 hours to fall asleep. Feels like Sertraline 100mg is not doing enough.
O: Patient is a 34-year-old female, sitting stiffly, speaking in a monochromatic, soft voice. Psychomotor slowing is evident. PHQ-9 is 18 (Consistent with Severe Depression), GAD-7 is 14 (Moderate Anxiety). Vitals: BP 118/74, Pulse 68.
A: Major Depressive Disorder, single episode, moderate-to-severe (DSM-5-TR: F32.1), with comorbid generalized anxiety features. Insomnia is a severe secondary factor. Slow psychomotor indicators suggest high internalizing spectrum score (HiTOP).
P: Increase Sertraline to 125mg for 1 week, then 150mg daily. Add Trazodone 50mg HS PRN for insomnia. Initiate 10-session Cognitive Behavioral Therapy for Insomnia (CBT-I) with Dr. Alvarez. Safety plan reviewed and active. Follow up in 2 weeks.`,
            psychometricScores: {
                phq9: [12, 15, 18, 16],
                gad7: [9, 11, 14, 12]
            },
            hitopSpectrum: {
                internalizing: 78,
                thoughtDisorder: 15,
                disinhibitedExternalizing: 8,
                antagonisticExternalizing: 5
            },
            rdocDomains: {
                negativeValence: "Elevated threat response (anticipatory anxiety regarding lab changes), marked loss of positive valence / reward learning (profound anhedonia, no enjoyment in scientific breakthroughs).",
                positiveValence: "Profoundly disrupted reward valuing and attainment; complete lack of goal-directed motivation due to anticipatory anhedonia.",
                cognitiveSystems: "Mild cognitive control deficits; self-reported concentration gaps; executive performance intact but highly effortful.",
                socialProcesses: "Intact social affiliation; feels isolated due to perceived professional inadequacy.",
                arousalRegulatory: "Severely disrupted sleep-wake systems (elevated sleep latency, nocturnal awakenings)."
            },
            fhirRecord: `{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "P001",
        "name": [{ "use": "official", "family": "Rostova", "given": ["Elena"] }],
        "gender": "female",
        "birthDate": "1992-04-12"
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "id": "cond-1",
        "subject": { "reference": "Patient/P001" },
        "code": {
          "coding": [
            { "system": "http://hl7.org/fhir/sid/icd-10", "code": "F32.1", "display": "Major depressive disorder, single episode, moderate" }
          ]
        },
        "clinicalStatus": { "coding": [{ "code": "active" }] }
      }
    }
  ]
}`,
            treatmentPlan: {
                longTermGoal: "Full subjective and objective remission of depressive episode, return to baseline professional functioning, and acquisition of healthy sleep architecture.",
                shortTermObjectives: [
                    "Reduce PHQ-9 score below 10 within 6 weeks.",
                    "Establish sleep latency of less than 30 minutes utilizing CBT-I strategies.",
                    "Practice 15 minutes of cognitive refactoring techniques during acute lab stress."
                ],
                interventions: [
                    "Pharmacotherapy: Titrate Sertraline to 150mg daily; augment with Levothyroxine monitoring by Endocrinology.",
                    "CBT-I: Weekly sessions focused on stimulus control, sleep restriction, and challenge of dysfunctional sleep beliefs.",
                    "Supportive therapy regarding workplace imposter syndrome."
                ],
                followUp: "Bi-weekly psychiatric reviews to track dose adjustment tolerability and suicide safety parameters."
            }
        },
        {
            id: 8,
            name: "Lucas Vance",
            age: 22,
            gender: "Male",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            email: "lucas.vance@sales.com",
            phone: "+1 (555) 765-4321",
            riskStatus: "Low",
            specialty: "Bipolar Spectrum Disorder",
            registrationDate: Date.now() - 86400000 * 3,
            abhaId: "lucas.vance@sbx",
            demographics: {
                dob: "2004-11-28",
                occupation: "SaaS Sales Development Representative (Entry-level)",
                contact: "+1 (555) 765-4321",
                emergencyContact: "Sylvia Vance (Mother) - +1 (555) 345-6789",
                insurance: "UnitedHealth Extended Plan"
            },
            medicalHistory: [
                "No major physical medical illnesses.",
                "Mild eczema on forearm periodically."
            ],
            psychiatricHistory: [
                "Diagnosed with ADHD, Combined Presentation in high school (aged 16), treated with Methylphenidate (discontinued at 19 by self due to 'feeling jittery').",
                "History of transient mood swings, historically written off as 'adolescent turbulence'."
            ],
            familyHistory: [
                "Father: History of Bipolar I Disorder, hospitalized twice for manic episodes with psychotic features.",
                "Older Sister: Treated for Borderline Personality Disorder and Bulimia Nervosa."
            ],
            allergies: [
                "None known."
            ],
            currentMedications: [],
            riskAssessment: {
                level: "LOW",
                suicideRisk: "Expresses episodic frustration but denies suicide plans, intent, or suicidal ideation.",
                selfHarmRisk: "No historic or current self-harm behaviors.",
                violenceRisk: "Slight hazard of impulsivity/irritability during high-energy states but no violent history or current homicidal inclination.",
                lastAssessmentDate: "2026-06-12",
                clinicalFlags: [
                    "Bipolar Family Background",
                    "Discontinued ADHD Stimulants"
                ]
            },
            rawIntakeBullets: `Presenting Complaint:
- 2-week history of highly erratic, volatile energy spikes. Describes 3-4 days where he slept only 2 hours a night but felt 'hyper-charged' and closed 5 SaaS contracts.
- Disrupted cycle became irregular. Now, over the last 3 days, has crashed into a severely sluggish, sluggish state characterized by heavy oversleeping (11 hours+), irritability, and inability to make cold calls.
- High-energy period included spending $1200 on 'designer mechanical keyboards' and high-yield stock options.
- Coworkers noted he was talking 'like a bullet train' and interrupting client pitches.
- Seeking evaluation to see if his ADHD has mutated or if he has a bipolar diagnosis.`,
            rawMseBullets: `Appearance: Shabby corporate-casual wear. Restless, fidgeting in chair continually, tapping feet. Appears moderately disheveled.
Behavior: Highly animated. Pressured, grand gestures, scanning room rapidly. Mild psychomotor agitation.
Speech: Accelerated, louder than normal, difficult to interrupt. Speaks with a distinct salesman bravado.
Mood: Subjectively reported as 'vibrating between clinical rocket ship and garbage puddle'.
Affect: Broadly expressive, volatile, quickly shifting from hyper-enthusiastic to intense irritability when asked about his option trading.
Thought Process: Tangential and flighty. Showed flight of ideas, jumping from SaaS sales quotas to mechanical switches, then immediately to his father's hospitalization history. 
Thought Content: Distinctly grandiose ('I want to be VP of Sales by December', 'I have solved trading analytics'). No overt suicidal intent or persecutory delusions.
Perception: Denies sensory distortions, auditory hallucinations, or paranoid hallucinations.
Cognition: Intact orientation. Intact abstract reasoning but highly distractible.
Insight: Partial. Recognizes his spending is reckless but believes his high-productivity states are 'superpowers'.
Judgment: Impaired during elevated periods (proven financial and social impulsivity). Moderately impaired currently relative to psychiatric safety.`,
            rawSoapBullets: `S: Lucas reports crashing into a 'severe slump' over the past 72 hours. He has missed 2 days of work due to deep lethargy and sleeping through alarms. Regrets option trades.
O: Patient is a 22-year-old male, slouched in chair, wearing sunglasses indoors. Taps foot constantly. ASRS Screener for ADHD is 5/6 (Very High). PHQ-9 is 14 (Moderate Depression). GAD-7 is 12 (Moderate Anxiety). Family history of Bipolar I confirmed.
A: Bipolar II Disorder, currently in a mixed/depressive phase (DSM-5-TR: F31.32). Also highly probable ADHD (Combined Presentation), currently masked/exacerbated by mood instability. Stimulants are contraindicated due to risk of manic/hypomanic induction.
P: Initiate Lamotrigine 25mg daily for 2 weeks, titrate to 50mg for 2 weeks, with targeted 100mg target. Disapprove stimulant restart until mood is stabilized. Educate on mood tracking and sleep hygiene. Follow up weekly.`,
            psychometricScores: {
                phq9: [8, 14, 11, 14],
                gad7: [10, 12, 9, 12],
                asrs: [5, 4, 6, 5]
            },
            hitopSpectrum: {
                internalizing: 45,
                thoughtDisorder: 10,
                disinhibitedExternalizing: 71,
                antagonisticExternalizing: 32
            },
            rdocDomains: {
                negativeValence: "Moderate fear and anxiety; periodic acute panic concerning commercial sales quotas and financial debt accumulation.",
                positiveValence: "Highly dysfunctional reward hypersensitivity during hypomanic states (impulsive spending and option speculation), followed by complete reward hypo-responsiveness during crashes.",
                cognitiveSystems: "Severely impaired cognitive control and working memory; high distraction rate and impulsivity, consistent with historical ADHD complex.",
                socialProcesses: "Impaired social communication during energetic peaks (interrupting, excessive talking); withdrew socially during depressive crashes.",
                arousalRegulatory: "Severe circadian rhythm disruptions; drastically reduced sleep drive during peaks; hyper-somnolent during depression."
            },
            fhirRecord: `{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "P002",
        "name": [{ "use": "official", "family": "Vance", "given": ["Lucas"] }],
        "gender": "male",
        "birthDate": "2004-11-28"
      }
    }
  ]
}`,
            treatmentPlan: {
                longTermGoal: "Stabilize mood volatility, establish baseline safety, and cautiously manage underlying ADHD symptoms without triggering hypomania.",
                shortTermObjectives: [
                    "Remain compliant on Lamotrigine titration without skin rash side effects.",
                    "Track daily mood and sleep duration on the PsyPyrus client mood tracker.",
                    "Establish consistent 7-8 hour sleep schedule."
                ],
                interventions: [
                    "Pharmacotherapy: Lamotrigine titration; avoid stimulating agents like Methylphenidate or SSRIs during volatile transitions.",
                    "Psychoeducation: Counsel on early hypomanic warning signs (reduced sleep drive, racing ideas, spending).",
                    "CBT for ADHD and Mood: Establish structural coping cards for sales roles."
                ],
                followUp: "Weekly safety calls to closely monitor for rash (Stevens-Johnson syndrome) and acute treatment adherence."
            }
        },
        {
            id: 9,
            name: "Aanya Patel",
            age: 45,
            gender: "Female",
            avatar: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150",
            email: "aanya.patel@school.edu",
            phone: "+91 98450 12345",
            riskStatus: "Low",
            specialty: "Generalized Anxiety Disorder",
            registrationDate: Date.now() - 86400000 * 2,
            abhaId: "aanya.patel@sbx",
            demographics: {
                dob: "1981-08-15",
                occupation: "Primary School Principal",
                contact: "+91 98450 12345",
                emergencyContact: "Rajesh Patel (Husband) - +91 98450 54321",
                insurance: "Star Health Clinical Cover"
            },
            medicalHistory: [
                "Mild hypertension (controlled with Amlodipine 5mg daily)",
                "Polycystic Ovary Syndrome (PCOS)"
            ],
            psychiatricHistory: [
                "Severe Panic Attacks (first onset 2018)",
                "Generalized physical anxiety symptoms with somatic representations (gastrointestinal hyper-reactivity)"
            ],
            familyHistory: [
                "Mother: Severe claustrophobia and generalized anxiety",
                "Brother: Diagnosed with Obsessive Compulsive Disorder"
            ],
            allergies: [
                "NSAIDs (causes moderate stomach dyspepsia)"
            ],
            currentMedications: [
                {
                    name: "Amlodipine",
                    dose: "5mg daily (morning)",
                    adherence: "Fully compliant",
                    sideEffects: "Very minor ankle edema"
                },
                {
                    name: "Escitalopram",
                    dose: "10mg daily HS",
                    adherence: "Highly compliant (~90%)",
                    sideEffects: "Decreased libido, mild dreams"
                }
            ],
            riskAssessment: {
                level: "LOW",
                suicideRisk: "No passive or active suicidal ideation indicated. Strong protective factors (children, school community).",
                selfHarmRisk: "None reported.",
                violenceRisk: "None. Patient works with children and is deeply committed to peaceful clinical paradigms.",
                lastAssessmentDate: "2026-06-08",
                clinicalFlags: [
                    "Somatic Panic Focus",
                    "Elevated GAD-7 Profile"
                ]
            },
            rawIntakeBullets: `Presenting Complaint:
- 6-month recurrence of severe, unprovoked panic attacks occurring 2-3 times per week, specifically when stuck in vehicular school traffic. 
- Somatic indicators include sudden chest tightness, rapid palpitation, hyperventilation, and fear of impending doom or cardiac arrest.
- Has resorted to avoiding school assemblies and morning drop-offs to prevent attacks, causing operational hurdles for her school administration.
- Highly supportive domestic environment, but feels 'broken' and worried she will lose her authority status as school principal.`,
            rawMseBullets: `Appearance: Elegantly dressed in traditional Indian attire. Neat, highly organized. Polite, helpful, cooperative, and formal.
Behavior: Sits upright. Hand wringing noticed during physical symptom recall. Frequent swallowing. Good eye contact.
Speech: Clear, fluent, well-articulated, normal volume, slightly elevated rate when talking about panic triggers.
Mood: Subjectively mood described as 'tense', 'apprehensive', and 'vigilant'.
Affect: Anxious, restricted in range, fully congruent with anxiety topics. 
Thought Process: Linear, logical, slightly overinclusive of bodily descriptions.
Thought Content: Preoccupied with physical wellness, cardiac indicators, and worry about panic panic attacks taking place in front of school staff. No suicidal content, delusions, or obsessive check lists.
Perception: No sensory disturbances or depersonalization described during standard settings.
Cognition: Intact concentration and recall. Excellent executive function.
Insight: Good. Comprehends that her somatic dread represents panic disorder and is not a cardiac failure.
Judgment: Intact regarding treatment and personal safety.`,
            rawSoapBullets: `S: Aanya states that avoiding assemblies has worked temporary, but she feels professional defeat. Had one severe panic episode on Tuesday when a parent raised their voice. Wants a safe SOS option.
O: Clinical evaluation shows no physical cardiovascular abnormalities. GAD-7 is 17 (Severe Anxiety), PHQ-9 is 7 (Mild Depressive Symptoms). Vitals: BP 124/82, Pulse 76.
A: Panic Disorder (DSM-5-TR: F41.0) with moderate agoraphobic avoidance. Well-controlled Hypertension. Anxiety is heavily mapped physically.
P: Increase Escitalopram to 15mg daily HS. Prescribe Clonazepam 0.25mg sublingual as SOS (limited to 5 tablets/month). Refer to Interoceptive Exposure Therapy and deep breathing training. Schedule follow-up in 3 weeks.`,
            psychometricScores: {
                phq9: [5, 7, 6, 7],
                gad7: [12, 15, 17, 16]
            },
            hitopSpectrum: {
                internalizing: 84,
                thoughtDisorder: 5,
                disinhibitedExternalizing: 12,
                antagonisticExternalizing: 3
            },
            rdocDomains: {
                negativeValence: "Extremely high acute threat activation (panic response) and elevated potential threat/sustained threat vigilance.",
                positiveValence: "Preserved reward responsiveness; takes pleasure in teaching, but social participation is limited strictly by anticipatory anxiety.",
                cognitiveSystems: "Optimal executive function; high attention bias toward somatic indicators (chest tightness).",
                socialProcesses: "Excellent social skills and affiliation, but marked fear of public embarrassment during somatic panic.",
                arousalRegulatory: "Normal sleep architecture, but elevated daytime baseline physiological arousal/cardiorespiratory reactivity."
            },
            fhirRecord: `{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "P003",
        "name": [{ "use": "official", "family": "Patel", "given": ["Aanya"] }],
        "gender": "female",
        "birthDate": "1981-08-15"
      }
    }
  ]
}`,
            treatmentPlan: {
                longTermGoal: "Eliminate panic attacks, systematically reduce avoidance behaviors, and establish healthy interoceptive threat evaluations.",
                shortTermObjectives: [
                    "Engage in intentional interoceptive hyperventilation exposure for 2 minutes daily.",
                    "Attend at least one complete morning school drop-off drop-off cycle weekly.",
                    "Maintain GAD-7 score below 10 across a 4-week trial."
                ],
                interventions: [
                    "Pharmacotherapy: Escitalopram 15mg daily; establish strict limits/guidelines for Clonazepam SOS.",
                    "Psychotherapy: Cognitive behavioral therapy with hyperventilation/interoceptive exposure exercises.",
                    "Somatic Grounding: Abdominal breathing and progressive muscle relaxation training."
                ],
                followUp: "Follow-up consultation in 3 weeks to evaluate panic frequency and Escitalopram tolerability."
            }
        }
    ];
            this.set(STORAGE_KEYS.PATIENTS, [...currentPatients, ...extraPatients]);
            console.log("Hot-patched clinical workspace patients into active local storage database.");
        }

        // Hot patch existing localstorage patients with Aarav and Leela if absent
        if (currentPatients.length > 0 && !currentPatients.some(p => p.name === "Aarav Sharma")) {
            const extraPatients = [
                { id: 5, name: "Aarav Sharma", age: 10, gender: "Male", email: "aarav.sharma@health.in", phone: "91-98765-43210", riskStatus: "Low", specialty: "ADHD Clinical Consultation", registrationDate: Date.now() - 86400000 * 10, abhaNumber: "91-4455-6677-8899", abhaAddress: "aarav@abdm" },
                { id: 6, name: "Leela Devi", age: 72, gender: "Female", email: "leela.devi@care.in", phone: "91-87654-32109", riskStatus: "Moderate", specialty: "Major Depres. (Single Ep.)", registrationDate: Date.now() - 86400000 * 5, abhaNumber: "91-1122-3344-5566", abhaAddress: "leela@abdm" }
            ];
            this.set(STORAGE_KEYS.PATIENTS, [...currentPatients, ...extraPatients]);
            console.log("Hot-patched pediatric & geriatric patients into active local storage database.");
        }

        // Hot patch existing localstorage assessments with HiTOP seed data if absent
        const assessments = this._readRaw(STORAGE_KEYS.ASSESSMENTS);
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

        // Build Indexes & Clear Cache at launch
        this.rebuildIndexes();
        this._cache.clear();
    }

    // Direct read without checking cache (compliance log safety)
    static _readRaw(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    }

    static get(key) {
        const start = performance.now();
        const dbTrace = Tracer.startSpan('dbQuery', null, { operation: 'read', table: key });
        
        // Cache Hit Check (Cache-Aside pattern)
        const cached = this.getCache(key);
        if (cached !== null) {
            this.lastQueryPlan = {
                query: `get(${key})`,
                strategy: 'Cache Hit (O(1))',
                durationMs: performance.now() - start
            };
            Tracer.endSpan(dbTrace.spanId);
            Logger.info('database-service', 'DB_READ', `Cache hit for table ${key}`, { key, strategy: 'cache' });
            return cached;
        }

        // Cache Miss: Read from Disk
        const data = this._readRaw(key);
        this.setCache(key, data);
        this.lastQueryPlan = {
            query: `get(${key})`,
            strategy: 'Sequential Table Scan (O(N))',
            durationMs: performance.now() - start
        };
        Tracer.endSpan(dbTrace.spanId);
        Logger.info('database-service', 'DB_READ', `Cache miss for table ${key}. Read from localStorage.`, { key, strategy: 'disk', recordCount: data.length });
        return data;
    }

    static set(key, data) {
        const dbTrace = Tracer.startSpan('dbWrite', null, { operation: 'write', table: key });
        localStorage.setItem(key, JSON.stringify(data));
        this.invalidateCache(key);
        this.rebuildIndexes();
        Tracer.endSpan(dbTrace.spanId);
        Logger.info('database-service', 'DB_WRITE', `Successfully updated table ${key}`, { key, recordCount: data.length });
    }

    // --- Audit Log Utility ---
    static logAudit(action, details) {
        const logs = this._readRaw(STORAGE_KEYS.AUDIT_LOGS);
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
        
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
        this.invalidateCache(STORAGE_KEYS.AUDIT_LOGS);
        
        // Desktop Integration Hooks (Electron)
        if (window.electronAPI) {
            if (typeof window.electronAPI.writeAuditLog === 'function') {
                window.electronAPI.writeAuditLog(newLog).catch(console.error);
            }
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

        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.AUDIT_LOGS } }));
        return newLog;
    }

    static getAuditLogs() {
        return this.get(STORAGE_KEYS.AUDIT_LOGS) || [];
    }

    // --- Patients ---
    static getPatients() {
        const data = this.get(STORAGE_KEYS.PATIENTS);
        return data;
    }

    static insertPatient(patient, idempotencyKey = null) {
        if (idempotencyKey) {
            const cachedResult = this.getIdempotentResult(idempotencyKey);
            if (cachedResult !== null) return cachedResult;
        }

        const result = this.runInTransaction(() => {
            this.checkRateLimit();
            const patients = this._readRaw(STORAGE_KEYS.PATIENTS);
            const newPatient = {
                ...patient,
                id: patients.length ? Math.max(...patients.map(p => p.id)) + 1 : 1,
                registrationDate: Date.now()
            };
            patients.push(newPatient);
            
            localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
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
        }, [STORAGE_KEYS.PATIENTS, STORAGE_KEYS.CLINICAL_NOTES, STORAGE_KEYS.AUDIT_LOGS]);

        if (idempotencyKey) {
            this.saveIdempotentResult(idempotencyKey, result);
        }
        return result;
    }

    // --- Appointments ---
    static getAppointments() {
        return this.get(STORAGE_KEYS.APPOINTMENTS);
    }

    static insertAppointment(appt, idempotencyKey = null) {
        if (idempotencyKey) {
            const cachedResult = this.getIdempotentResult(idempotencyKey);
            if (cachedResult !== null) return cachedResult;
        }

        const result = this.runInTransaction(() => {
            this.checkRateLimit();
            const appts = this._readRaw(STORAGE_KEYS.APPOINTMENTS);
            const randomNum = Math.floor(Math.random() * 900) + 100;
            const code = appt.isVideo ? `PSY-PYR-${randomNum}` : "OFFLINE";
            const newAppt = {
                ...appt,
                id: appts.length ? Math.max(...appts.map(a => a.id)) + 1 : 1,
                code,
                status: "Scheduled"
            };
            appts.push(newAppt);
            
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appts));
            this.logAudit("Scheduled Appointment", `Appointment scheduled for ${newAppt.patientName} on ${newAppt.dateTime} (Appt ID: ${newAppt.id})`);
            
            // Enqueue async EHR and Firebase cloud synchronization task
            this.enqueueTask('SYNC_EHR', { appointmentId: newAppt.id });
            this.enqueueTask('FIREBASE_SYNC', { appointmentId: newAppt.id });

            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.APPOINTMENTS } }));
            return newAppt.id;
        }, [STORAGE_KEYS.APPOINTMENTS, STORAGE_KEYS.AUDIT_LOGS]);

        if (idempotencyKey) {
            this.saveIdempotentResult(idempotencyKey, result);
        }
        return result;
    }

    static updateAppointmentStatus(apptId, status) {
        this.runInTransaction(() => {
            this.checkRateLimit();
            const appts = this._readRaw(STORAGE_KEYS.APPOINTMENTS);
            const idx = appts.findIndex(a => a.id === apptId);
            if (idx !== -1) {
                appts[idx].status = status;
                localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appts));
                this.logAudit("Appointment Complete", `Managed appointment ID ${apptId} with status: ${status}`);
                window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.APPOINTMENTS } }));
            }
        }, [STORAGE_KEYS.APPOINTMENTS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static deleteAppointment(apptId) {
        this.runInTransaction(() => {
            this.checkRateLimit();
            const appts = this._readRaw(STORAGE_KEYS.APPOINTMENTS);
            const filtered = appts.filter(a => a.id !== apptId);
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(filtered));
            this.logAudit("Cancelled Appointment", `Cancelled appointment ID ${apptId}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.APPOINTMENTS } }));
        }, [STORAGE_KEYS.APPOINTMENTS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    // --- Clinical Notes ---
    static getClinicalNotes(patientId = null) {
        const start = performance.now();
        if (patientId) {
            const pid = Number(patientId);
            
            // Check cache
            const cachedNotes = this.getCache(`notes_pid_${pid}`);
            if (cachedNotes) {
                this.lastQueryPlan = {
                    query: `getClinicalNotes(patientId: ${pid})`,
                    strategy: 'Cache Hit (O(1))',
                    durationMs: performance.now() - start
                };
                return cachedNotes;
            }

            // O(1) Index Scan Lookup
            const indexedNotes = this._indexes.clinical_notes.byPatientId.get(pid) || [];
            this.setCache(`notes_pid_${pid}`, indexedNotes);
            this.lastQueryPlan = {
                query: `getClinicalNotes(patientId: ${pid})`,
                strategy: 'Index Scan by patientId (O(1))',
                durationMs: performance.now() - start
            };
            return indexedNotes;
        } else {
            // O(N) Table Scan
            const notes = this.get(STORAGE_KEYS.CLINICAL_NOTES);
            this.lastQueryPlan = {
                query: 'getClinicalNotes(all)',
                strategy: 'Sequential Table Scan (O(N))',
                durationMs: performance.now() - start
            };
            return notes;
        }
    }

    static insertClinicalNote(note, idempotencyKey = null) {
        if (idempotencyKey) {
            const cachedResult = this.getIdempotentResult(idempotencyKey);
            if (cachedResult !== null) return cachedResult;
        }

        const result = this.runInTransaction(() => {
            this.checkRateLimit();
            const notes = this._readRaw(STORAGE_KEYS.CLINICAL_NOTES);
            const newNote = {
                ...note,
                id: notes.length ? Math.max(...notes.map(n => n.id)) + 1 : 1,
                timestamp: Date.now(),
                isRiskAlert: note.isRiskAlert || false,
                riskDisclaimer: "AI-assisted note. Licensed practitioner has reviewed."
            };
            notes.unshift(newNote); // Newest note at top
            
            localStorage.setItem(STORAGE_KEYS.CLINICAL_NOTES, JSON.stringify(notes));
            this.logAudit("Added Clinical Note", `Saved a new ${newNote.noteType} note for Patient ID ${newNote.patientId}. Risk status flagged: ${newNote.isRiskAlert}`);
            
            // Gamification Hook
            GamificationService.trackAction('Professional', 'WRITE_NOTE');
            GamificationService.awardXp('Professional', 20, 'Documented Clinical Note');

            // Enqueue async synchronization to EHR and Firebase Cloud
            this.enqueueTask('SYNC_EHR', { noteId: newNote.id });
            this.enqueueTask('FIREBASE_SYNC', { noteId: newNote.id });

            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.CLINICAL_NOTES } }));
            return newNote.id;
        }, [STORAGE_KEYS.CLINICAL_NOTES, STORAGE_KEYS.AUDIT_LOGS]);

        if (idempotencyKey) {
            this.saveIdempotentResult(idempotencyKey, result);
        }
        return result;
    }

    // --- Assessments ---
    static getAssessments(patientId = null) {
        const start = performance.now();
        if (patientId) {
            const pid = Number(patientId);
            const cached = this.getCache(`assessments_pid_${pid}`);
            if (cached) {
                this.lastQueryPlan = {
                    query: `getAssessments(patientId: ${pid})`,
                    strategy: 'Cache Hit (O(1))',
                    durationMs: performance.now() - start
                };
                return cached;
            }

            const indexed = this._indexes.assessments.byPatientId.get(pid) || [];
            this.setCache(`assessments_pid_${pid}`, indexed);
            this.lastQueryPlan = {
                query: `getAssessments(patientId: ${pid})`,
                strategy: 'Index Scan by patientId (O(1))',
                durationMs: performance.now() - start
            };
            return indexed;
        } else {
            const data = this.get(STORAGE_KEYS.ASSESSMENTS);
            this.lastQueryPlan = {
                query: 'getAssessments(all)',
                strategy: 'Sequential Table Scan (O(N))',
                durationMs: performance.now() - start
            };
            return data;
        }
    }

    static insertAssessmentScore(score, idempotencyKey = null) {
        if (idempotencyKey) {
            const cachedResult = this.getIdempotentResult(idempotencyKey);
            if (cachedResult !== null) return cachedResult;
        }

        const result = this.runInTransaction(() => {
            this.checkRateLimit();
            const scores = this._readRaw(STORAGE_KEYS.ASSESSMENTS);
            const newScore = {
                ...score,
                id: scores.length ? Math.max(...scores.map(s => s.id)) + 1 : 1,
                date: Date.now()
            };
            scores.push(newScore);
            
            localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(scores));
            this.logAudit("Logged Assessment", `Added auto-scored ${newScore.type} with value ${newScore.score} (${newScore.details}) to Patient ID ${newScore.patientId}`);
            
            // Gamification Hook
            const activeRole = localStorage.getItem('psypyrus_active_role') || 'Professional';
            if (activeRole !== 'Patient') {
                GamificationService.trackAction('Professional', 'COMPLETE_ASSESSMENT');
                GamificationService.awardXp('Professional', 15, 'Conducted Patient Assessment');
            } else {
                GamificationService.trackAction('Patient', 'COMPLETE_ASSESSMENT');
                GamificationService.awardXp('Patient', 25, 'Completed Self-Assessment');
                GamificationService.awardCoins('Patient', 10, 'Self-Assessment Bonus');
            }

            // Sync with Firebase Cloud
            this.enqueueTask('FIREBASE_SYNC', { assessmentId: newScore.id });

            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.ASSESSMENTS } }));
            return newScore.id;
        }, [STORAGE_KEYS.ASSESSMENTS, STORAGE_KEYS.AUDIT_LOGS]);

        if (idempotencyKey) {
            this.saveIdempotentResult(idempotencyKey, result);
        }
        return result;
    }

    // --- Mood Logs ---
    static getMoodLogs() {
        return this.get(STORAGE_KEYS.MOOD_LOGS);
    }

    static insertMoodLog(log, idempotencyKey = null) {
        if (idempotencyKey) {
            const cachedResult = this.getIdempotentResult(idempotencyKey);
            if (cachedResult !== null) return cachedResult;
        }

        const result = this.runInTransaction(() => {
            this.checkRateLimit();
            const logs = this._readRaw(STORAGE_KEYS.MOOD_LOGS);
            const newLog = {
                ...log,
                id: logs.length ? Math.max(...logs.map(l => l.id)) + 1 : 1,
                patientId: 1, // Default logged-in patient
                date: Date.now()
            };
            logs.push(newLog);
            
            localStorage.setItem(STORAGE_KEYS.MOOD_LOGS, JSON.stringify(logs));
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
        }, [STORAGE_KEYS.MOOD_LOGS, STORAGE_KEYS.AUDIT_LOGS]);

        if (idempotencyKey) {
            this.saveIdempotentResult(idempotencyKey, result);
        }
        return result;
    }

    // --- Homework ---
    static getHomework(patientId = null) {
        const start = performance.now();
        if (patientId) {
            const pid = Number(patientId);
            const cached = this.getCache(`homework_pid_${pid}`);
            if (cached) {
                this.lastQueryPlan = {
                    query: `getHomework(patientId: ${pid})`,
                    strategy: 'Cache Hit (O(1))',
                    durationMs: performance.now() - start
                };
                return cached;
            }

            const indexed = this._indexes.homework.byPatientId.get(pid) || [];
            this.setCache(`homework_pid_${pid}`, indexed);
            this.lastQueryPlan = {
                query: `getHomework(patientId: ${pid})`,
                strategy: 'Index Scan by patientId (O(1))',
                durationMs: performance.now() - start
            };
            return indexed;
        } else {
            const data = this.get(STORAGE_KEYS.HOMEWORK);
            this.lastQueryPlan = {
                query: 'getHomework(all)',
                strategy: 'Sequential Table Scan (O(N))',
                durationMs: performance.now() - start
            };
            return data;
        }
    }

    static insertHomework(task, idempotencyKey = null) {
        if (idempotencyKey) {
            const cachedResult = this.getIdempotentResult(idempotencyKey);
            if (cachedResult !== null) return cachedResult;
        }

        const result = this.runInTransaction(() => {
            this.checkRateLimit();
            const tasks = this._readRaw(STORAGE_KEYS.HOMEWORK);
            const newTask = {
                ...task,
                id: tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
                isCompleted: false,
                assignedDate: Date.now()
            };
            tasks.push(newTask);
            
            localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(tasks));
            this.logAudit("Homework Assigned", `Assigned task '${newTask.description}' to Patient ID ${newTask.patientId}`);
            
            // Gamification Hook
            GamificationService.trackAction('Professional', 'ASSIGN_HOMEWORK');
            GamificationService.awardXp('Professional', 10, 'Assigned Patient Homework');

            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.HOMEWORK } }));
            return newTask.id;
        }, [STORAGE_KEYS.HOMEWORK, STORAGE_KEYS.AUDIT_LOGS]);

        if (idempotencyKey) {
            this.saveIdempotentResult(idempotencyKey, result);
        }
        return result;
    }

    static toggleHomework(taskId) {
        this.runInTransaction(() => {
            this.checkRateLimit();
            const tasks = this._readRaw(STORAGE_KEYS.HOMEWORK);
            const idx = tasks.findIndex(t => t.id === taskId);
            if (idx !== -1) {
                tasks[idx].isCompleted = !tasks[idx].isCompleted;
                localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(tasks));
                this.logAudit("Homework Status Toggled", `Toggled task ID ${taskId} to isCompleted: ${tasks[idx].isCompleted}`);
                
                // Gamification Hook
                if (tasks[idx].isCompleted) {
                    GamificationService.trackAction('Patient', 'COMPLETE_HOMEWORK');
                    GamificationService.awardXp('Patient', 30, 'Completed Homework Task');
                    GamificationService.awardCoins('Patient', 10, 'CBT Task Reward');
                }

                window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.HOMEWORK } }));
            }
        }, [STORAGE_KEYS.HOMEWORK, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static deleteHomework(taskId) {
        this.runInTransaction(() => {
            this.checkRateLimit();
            const tasks = this._readRaw(STORAGE_KEYS.HOMEWORK);
            const filtered = tasks.filter(t => t.id !== taskId);
            localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(filtered));
            this.logAudit("Homework Deleted", `Deleted homework task ID ${taskId}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.HOMEWORK } }));
        }, [STORAGE_KEYS.HOMEWORK, STORAGE_KEYS.AUDIT_LOGS]);
    }

    // --- Intake Forms ---
    static getIntakeForms(patientId = null) {
        const start = performance.now();
        if (patientId) {
            const pid = Number(patientId);
            const cached = this.getCache(`intake_pid_${pid}`);
            if (cached) {
                this.lastQueryPlan = {
                    query: `getIntakeForms(patientId: ${pid})`,
                    strategy: 'Cache Hit (O(1))',
                    durationMs: performance.now() - start
                };
                return cached;
            }

            const indexed = this._indexes.intake_forms.byPatientId.get(pid) || [];
            this.setCache(`intake_pid_${pid}`, indexed);
            this.lastQueryPlan = {
                query: `getIntakeForms(patientId: ${pid})`,
                strategy: 'Index Scan by patientId (O(1))',
                durationMs: performance.now() - start
            };
            return indexed;
        } else {
            const data = this.get(STORAGE_KEYS.INTAKE_FORMS);
            this.lastQueryPlan = {
                query: 'getIntakeForms(all)',
                strategy: 'Sequential Table Scan (O(N))',
                durationMs: performance.now() - start
            };
            return data;
        }
    }

    static insertIntakeForm(formData, idempotencyKey = null) {
        if (idempotencyKey) {
            const cachedResult = this.getIdempotentResult(idempotencyKey);
            if (cachedResult !== null) return cachedResult;
        }

        const result = this.runInTransaction(() => {
            this.checkRateLimit();
            const forms = this._readRaw(STORAGE_KEYS.INTAKE_FORMS) || [];
            const newForm = {
                ...formData,
                id: forms.length ? Math.max(...forms.map(f => f.id)) + 1 : 1,
                date: Date.now()
            };
            forms.push(newForm);
            
            localStorage.setItem(STORAGE_KEYS.INTAKE_FORMS, JSON.stringify(forms));
            this.logAudit("Saved Intake Form", `Saved completed form '${newForm.formTitle}' (Form ID: ${newForm.id}) for Patient ID ${newForm.patientId}`);
            
            // Gamification Hook
            const activeRole = localStorage.getItem('psypyrus_active_role') || 'Professional';
            if (activeRole !== 'Patient') {
                GamificationService.trackAction('Professional', 'WRITE_NOTE');
                GamificationService.awardXp('Professional', 20, 'Digitized Intake Form');
            } else {
                GamificationService.trackAction('Patient', 'COMPLETE_HOMEWORK');
                GamificationService.awardXp('Patient', 30, 'Completed Intake Form');
                GamificationService.awardCoins('Patient', 15, 'Intake Form Bonus');
            }

            // Async EHR Sync
            this.enqueueTask('SYNC_EHR', { formId: newForm.id });

            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INTAKE_FORMS } }));
            return newForm.id;
        }, [STORAGE_KEYS.INTAKE_FORMS, STORAGE_KEYS.AUDIT_LOGS]);

        if (idempotencyKey) {
            this.saveIdempotentResult(idempotencyKey, result);
        }
        return result;
    }

    static deleteIntakeForm(formId) {
        this.runInTransaction(() => {
            this.checkRateLimit();
            const forms = this._readRaw(STORAGE_KEYS.INTAKE_FORMS) || [];
            const filtered = forms.filter(f => f.id !== formId);
            localStorage.setItem(STORAGE_KEYS.INTAKE_FORMS, JSON.stringify(filtered));
            this.logAudit("Deleted Intake Form", `Deleted completed form ID ${formId}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INTAKE_FORMS } }));
        }, [STORAGE_KEYS.INTAKE_FORMS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    // --- Care Requests Matching System ---
    static getCareRequests() {
        return this.get(STORAGE_KEYS.CARE_REQUESTS) || [];
    }

    static insertCareRequest(req) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const requests = this._readRaw(STORAGE_KEYS.CARE_REQUESTS) || [];
            const newReq = {
                ...req,
                id: requests.length ? Math.max(...requests.map(r => r.id)) + 1 : 1,
                status: 'Open',
                offers: [],
                date: Date.now()
            };
            requests.push(newReq);
            localStorage.setItem(STORAGE_KEYS.CARE_REQUESTS, JSON.stringify(requests));
            this.logAudit("Posted Care Request", `Patient ${newReq.patientName} posted care request ID ${newReq.id}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.CARE_REQUESTS } }));
            return newReq.id;
        }, [STORAGE_KEYS.CARE_REQUESTS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static addOfferToCareRequest(reqId, offer) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const requests = this._readRaw(STORAGE_KEYS.CARE_REQUESTS) || [];
            const idx = requests.findIndex(r => r.id === Number(reqId));
            if (idx === -1) return false;

            const request = requests[idx];
            if (request.offers.some(o => o.professionalId === offer.professionalId)) return false;

            const newOffer = {
                ...offer,
                id: request.offers.length ? Math.max(...request.offers.map(o => o.id)) + 1 : 1,
                status: 'Pending',
                date: Date.now()
            };
            request.offers.push(newOffer);
            request.status = 'Offer Received';

            localStorage.setItem(STORAGE_KEYS.CARE_REQUESTS, JSON.stringify(requests));
            this.logAudit("Submitted Clinical Proposal", `Professional ${offer.professionalName} proposed services for request ID ${reqId}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.CARE_REQUESTS } }));
            return true;
        }, [STORAGE_KEYS.CARE_REQUESTS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static acceptOffer(reqId, offerId) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const requests = this._readRaw(STORAGE_KEYS.CARE_REQUESTS) || [];
            const idx = requests.findIndex(r => r.id === Number(reqId));
            if (idx === -1) return null;

            const request = requests[idx];
            const offerIdx = request.offers.findIndex(o => o.id === Number(offerId));
            if (offerIdx === -1) return null;

            request.offers.forEach((o, i) => {
                o.status = i === offerIdx ? 'Accepted' : 'Declined';
            });
            request.status = 'Connected';
            localStorage.setItem(STORAGE_KEYS.CARE_REQUESTS, JSON.stringify(requests));

            const offer = request.offers[offerIdx];

            // Auto-create matching appointment
            const appointments = this._readRaw(STORAGE_KEYS.APPOINTMENTS) || [];
            const randomNum = Math.floor(Math.random() * 900) + 100;
            const newAppt = {
                id: appointments.length ? Math.max(...appointments.map(a => a.id)) + 1 : 1,
                patientId: request.patientId,
                patientName: request.patientName,
                psychologistId: offer.professionalId,
                psychologistName: offer.professionalName,
                dateTime: "Today, 5:00 PM",
                status: "Scheduled",
                notes: `Session booked via Care Request matching: ${request.title}. Professional proposal: ${offer.message}`,
                fee: offer.proposedFee !== undefined && offer.proposedFee !== null ? Number(offer.proposedFee) : 150.0,
                isVideo: true,
                code: `PSY-PYR-${randomNum}`
            };
            appointments.push(newAppt);
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));

            this.logAudit("Matched Services Proposal", `Patient accepted offer from ${offer.professionalName} on request ID ${reqId}`);
            
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.CARE_REQUESTS } }));
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.APPOINTMENTS } }));
            return newAppt.id;
        }, [STORAGE_KEYS.CARE_REQUESTS, STORAGE_KEYS.APPOINTMENTS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    // --- Marketplace Installed Apps ---
    static getInstalledApps() {
        return this.get(STORAGE_KEYS.INSTALLED_APPS) || [];
    }

    static installApp(appId, appName, role) {
        this.runInTransaction(() => {
            this.checkRateLimit();
            const apps = this._readRaw(STORAGE_KEYS.INSTALLED_APPS) || [];
            if (!apps.includes(appId)) {
                apps.push(appId);
                localStorage.setItem(STORAGE_KEYS.INSTALLED_APPS, JSON.stringify(apps));
                this.logAudit("Marketplace App Installed", `User installed plugin '${appName}' (${appId}) in ${role} space.`);
                window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INSTALLED_APPS } }));
            }
        }, [STORAGE_KEYS.INSTALLED_APPS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static uninstallApp(appId, appName, role) {
        this.runInTransaction(() => {
            this.checkRateLimit();
            let apps = this._readRaw(STORAGE_KEYS.INSTALLED_APPS) || [];
            if (apps.includes(appId)) {
                apps = apps.filter(id => id !== appId);
                localStorage.setItem(STORAGE_KEYS.INSTALLED_APPS, JSON.stringify(apps));
                this.logAudit("Marketplace App Uninstalled", `User uninstalled plugin '${appName}' (${appId}) from ${role} space.`);
                window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INSTALLED_APPS } }));
            }
        }, [STORAGE_KEYS.INSTALLED_APPS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    // --- Research Hub ---
    static getResearchInvites() {
        return this.get(STORAGE_KEYS.RESEARCH_INVITES) || [];
    }

    static insertResearchInvite(invite) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const invites = this._readRaw(STORAGE_KEYS.RESEARCH_INVITES) || [];
            const newInvite = {
                ...invite,
                id: invites.length ? Math.max(...invites.map(i => i.id)) + 1 : 1,
                upvotes: 0,
                comments: [],
                collaborations: [],
                timestamp: Date.now()
            };
            invites.push(newInvite);
            localStorage.setItem(STORAGE_KEYS.RESEARCH_INVITES, JSON.stringify(invites));
            this.logAudit("Posted Research Invite", `Research invite '${newInvite.title}' posted by ${newInvite.principalInvestigator}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.RESEARCH_INVITES } }));
            return newInvite.id;
        }, [STORAGE_KEYS.RESEARCH_INVITES, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static upvoteResearchInvite(inviteId) {
        return this.runInTransaction(() => {
            const invites = this._readRaw(STORAGE_KEYS.RESEARCH_INVITES) || [];
            const idx = invites.findIndex(i => i.id === Number(inviteId));
            if (idx !== -1) {
                invites[idx].upvotes = (invites[idx].upvotes || 0) + 1;
                localStorage.setItem(STORAGE_KEYS.RESEARCH_INVITES, JSON.stringify(invites));
                window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.RESEARCH_INVITES } }));
                return true;
            }
            return false;
        }, [STORAGE_KEYS.RESEARCH_INVITES]);
    }

    static addResearchComment(inviteId, commentObj) {
        return this.runInTransaction(() => {
            const invites = this._readRaw(STORAGE_KEYS.RESEARCH_INVITES) || [];
            const idx = invites.findIndex(i => i.id === Number(inviteId));
            if (idx !== -1) {
                const comment = {
                    ...commentObj,
                    id: invites[idx].comments.length ? Math.max(...invites[idx].comments.map(c => c.id)) + 1 : 1,
                    date: Date.now()
                };
                invites[idx].comments.push(comment);
                localStorage.setItem(STORAGE_KEYS.RESEARCH_INVITES, JSON.stringify(invites));
                window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.RESEARCH_INVITES } }));
                return comment.id;
            }
            return null;
        }, [STORAGE_KEYS.RESEARCH_INVITES]);
    }

    static applyToResearch(inviteId, collabObj) {
        return this.runInTransaction(() => {
            const invites = this._readRaw(STORAGE_KEYS.RESEARCH_INVITES) || [];
            const idx = invites.findIndex(i => i.id === Number(inviteId));
            if (idx !== -1) {
                invites[idx].collaborations = invites[idx].collaborations || [];
                invites[idx].collaborations.push({
                    ...collabObj,
                    date: Date.now()
                });
                localStorage.setItem(STORAGE_KEYS.RESEARCH_INVITES, JSON.stringify(invites));
                this.logAudit("Research Collaboration Request", `Collaboration request for study ID ${inviteId}`);
                window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.RESEARCH_INVITES } }));
                return true;
            }
            return false;
        }, [STORAGE_KEYS.RESEARCH_INVITES, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static updateResearchInviteStatus(inviteId, newStatus) {
        return this.runInTransaction(() => {
            const invites = this._readRaw(STORAGE_KEYS.RESEARCH_INVITES) || [];
            const idx = invites.findIndex(i => i.id === Number(inviteId));
            if (idx !== -1) {
                invites[idx].status = newStatus;
                localStorage.setItem(STORAGE_KEYS.RESEARCH_INVITES, JSON.stringify(invites));
                this.logAudit("Research Status Updated", `Research study ID ${inviteId} status set to ${newStatus}`);
                window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.RESEARCH_INVITES } }));
                return true;
            }
            return false;
        }, [STORAGE_KEYS.RESEARCH_INVITES, STORAGE_KEYS.AUDIT_LOGS]);
    }

    // --- Pricing Agreements ---
    static getPricingAgreements() {
        return this.get(STORAGE_KEYS.PRICING_AGREEMENTS) || [];
    }

    static createPricingAgreement(agreement) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const agreements = this._readRaw(STORAGE_KEYS.PRICING_AGREEMENTS) || [];
            const newAgreement = {
                ...agreement,
                id: agreements.length ? Math.max(...agreements.map(a => a.id)) + 1 : 1,
                status: 'Pending',
                date: Date.now()
            };
            agreements.push(newAgreement);
            localStorage.setItem(STORAGE_KEYS.PRICING_AGREEMENTS, JSON.stringify(agreements));
            this.logAudit("Created Pricing Agreement Proposal", `Patient ${newAgreement.patientName} proposed sliding scale fee of $${newAgreement.proposedFee} to clinician ${newAgreement.professionalName}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.PRICING_AGREEMENTS } }));
            return newAgreement.id;
        }, [STORAGE_KEYS.PRICING_AGREEMENTS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static updatePricingAgreement(agreementId, status, counterFee = null, msg = null) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const agreements = this._readRaw(STORAGE_KEYS.PRICING_AGREEMENTS) || [];
            const idx = agreements.findIndex(a => a.id === Number(agreementId));
            if (idx === -1) return false;

            agreements[idx].status = status;
            if (counterFee !== null) {
                agreements[idx].proposedFee = counterFee;
            }
            if (msg !== null) {
                agreements[idx].message = msg;
            }
            agreements[idx].date = Date.now();

            localStorage.setItem(STORAGE_KEYS.PRICING_AGREEMENTS, JSON.stringify(agreements));
            this.logAudit("Updated Pricing Agreement Status", `Pricing agreement ID ${agreementId} status set to ${status}`);
            
            // If approved, update existing/future appointment fees or save to patient's record
            if (status === 'Approved') {
                const appointments = this._readRaw(STORAGE_KEYS.APPOINTMENTS) || [];
                appointments.forEach(a => {
                    if (a.patientId === agreements[idx].patientId && a.psychologistId === agreements[idx].professionalId) {
                        a.fee = agreements[idx].proposedFee;
                    }
                });
                localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
                window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.APPOINTMENTS } }));
            }

            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.PRICING_AGREEMENTS } }));
            return true;
        }, [STORAGE_KEYS.PRICING_AGREEMENTS, STORAGE_KEYS.APPOINTMENTS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    // --- Practice Management (Tealfeed-inspired) ---
    static getPublicProfiles() {
        return this.get(STORAGE_KEYS.PUBLIC_PROFILES) || [];
    }

    static updatePublicProfile(professionalId, profileData) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const profiles = this._readRaw(STORAGE_KEYS.PUBLIC_PROFILES) || [];
            const idx = profiles.findIndex(p => p.professionalId === professionalId);
            if (idx !== -1) {
                profiles[idx] = { ...profiles[idx], ...profileData };
            } else {
                profiles.push({ professionalId, ...profileData });
            }
            localStorage.setItem(STORAGE_KEYS.PUBLIC_PROFILES, JSON.stringify(profiles));
            this.logAudit("Updated Public Profile", `Clinician ${professionalId} customized their public booking site settings.`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.PUBLIC_PROFILES } }));
            return true;
        }, [STORAGE_KEYS.PUBLIC_PROFILES, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static getInvoices() {
        return this.get(STORAGE_KEYS.INVOICES) || [];
    }

    static createInvoice(invoice) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const invoices = this._readRaw(STORAGE_KEYS.INVOICES) || [];
            const newInvoice = {
                ...invoice,
                id: invoices.length ? Math.max(...invoices.map(i => i.id)) + 1 : 101,
                date: Date.now()
            };
            invoices.push(newInvoice);
            localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
            this.logAudit("Created Invoice", `Issued invoice ID ${newInvoice.id} to patient ${newInvoice.patientName} for $${newInvoice.amount}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INVOICES } }));
            return newInvoice.id;
        }, [STORAGE_KEYS.INVOICES, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static payInvoice(invoiceId, paymentMethod) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const invoices = this._readRaw(STORAGE_KEYS.INVOICES) || [];
            const idx = invoices.findIndex(i => i.id === Number(invoiceId));
            if (idx === -1) return false;

            invoices[idx].status = 'Paid';
            invoices[idx].paymentMethod = paymentMethod || 'Visa ending in 9999';
            invoices[idx].transactionId = 'ch_' + Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 10).toUpperCase();
            
            localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
            this.logAudit("Paid Invoice", `Invoice ID ${invoiceId} marked Paid via ${invoices[idx].paymentMethod}. Transaction: ${invoices[idx].transactionId}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INVOICES } }));
            return true;
        }, [STORAGE_KEYS.INVOICES, STORAGE_KEYS.AUDIT_LOGS]);
    }

    // --- Therapeutic Contracts ---
    static getTherapeuticContracts() {
        return this.get(STORAGE_KEYS.THERAPEUTIC_CONTRACTS) || [];
    }

    static createTherapeuticContract(contract) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const contracts = this._readRaw(STORAGE_KEYS.THERAPEUTIC_CONTRACTS) || [];
            const newContract = {
                goals: [],
                sessionFrequency: "Weekly",
                sessionDuration: 50,
                cancellationPolicy: "24-Hour Notice Required",
                confidentialityExclusions: "Standard legal and safety exclusions apply.",
                communicationBoundaries: "PsychConnect secure messages only.",
                proposedFee: 150,
                patientSignature: "",
                patientSignedAt: null,
                clinicianSignature: "",
                clinicianSignedAt: null,
                negotiationHistory: [],
                cryptographicSeal: "",
                ...contract,
                id: contracts.length ? Math.max(...contracts.map(c => c.id)) + 1 : 1,
                status: contract.status || 'Pending Patient Review',
                date: Date.now()
            };
            contracts.push(newContract);
            localStorage.setItem(STORAGE_KEYS.THERAPEUTIC_CONTRACTS, JSON.stringify(contracts));
            this.logAudit("Created Therapeutic Contract Draft", `Clinician created a therapeutic contract draft for Patient ID ${newContract.patientId}`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.THERAPEUTIC_CONTRACTS } }));
            return newContract.id;
        }, [STORAGE_KEYS.THERAPEUTIC_CONTRACTS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static updateTherapeuticContract(contractId, updatedFields) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const contracts = this._readRaw(STORAGE_KEYS.THERAPEUTIC_CONTRACTS) || [];
            const idx = contracts.findIndex(c => c.id === Number(contractId));
            if (idx === -1) return false;

            contracts[idx] = {
                ...contracts[idx],
                ...updatedFields,
                date: Date.now()
            };

            // Log audit based on status change or signing
            if (updatedFields.status === 'Approved' && updatedFields.cryptographicSeal) {
                this.logAudit("Therapeutic Contract Finalized", `Therapeutic contract ID ${contractId} fully signed and sealed. Seal: ${updatedFields.cryptographicSeal}`);
            } else if (updatedFields.status) {
                this.logAudit("Updated Therapeutic Contract Status", `Therapeutic contract ID ${contractId} status set to ${updatedFields.status}`);
            } else {
                this.logAudit("Modified Therapeutic Contract", `Therapeutic contract ID ${contractId} was modified.`);
            }

            localStorage.setItem(STORAGE_KEYS.THERAPEUTIC_CONTRACTS, JSON.stringify(contracts));
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.THERAPEUTIC_CONTRACTS } }));
            return true;
        }, [STORAGE_KEYS.THERAPEUTIC_CONTRACTS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static deleteTherapeuticContract(contractId) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const contracts = this._readRaw(STORAGE_KEYS.THERAPEUTIC_CONTRACTS) || [];
            const filtered = contracts.filter(c => c.id !== Number(contractId));
            localStorage.setItem(STORAGE_KEYS.THERAPEUTIC_CONTRACTS, JSON.stringify(filtered));
            this.logAudit("Deleted Therapeutic Contract", `Therapeutic contract ID ${contractId} deleted.`);
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.THERAPEUTIC_CONTRACTS } }));
            return true;
        }, [STORAGE_KEYS.THERAPEUTIC_CONTRACTS, STORAGE_KEYS.AUDIT_LOGS]);
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
        const groups = {};
        scores.forEach(s => {
            if (!groups[s.type]) {
                groups[s.type] = [];
            }
            groups[s.type].push(s);
        });
        Object.keys(groups).forEach(type => {
            groups[type].sort((a, b) => a.date - b.date);
        });
        return groups;
    }

    static updatePatient(patientId, updatedFields) {
        return this.runInTransaction(() => {
            this.checkRateLimit();
            const patients = this._readRaw(STORAGE_KEYS.PATIENTS);
            const idx = patients.findIndex(p => p.id === Number(patientId));
            if (idx !== -1) {
                patients[idx] = { ...patients[idx], ...updatedFields };
                localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
                this.logAudit("Patient Updated", `Updated fields for Patient ID ${patientId}`);
                window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.PATIENTS } }));
                return true;
            }
            return false;
        }, [STORAGE_KEYS.PATIENTS, STORAGE_KEYS.AUDIT_LOGS]);
    }

    static deletePatient(patientId) {
        const pId = Number(patientId);
        return this.runInTransaction(() => {
            this.checkRateLimit();
            
            // Cascade delete patient record
            const patients = this._readRaw(STORAGE_KEYS.PATIENTS).filter(p => p.id !== pId);
            localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));

            const appts = this._readRaw(STORAGE_KEYS.APPOINTMENTS).filter(a => a.patientId !== pId);
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appts));

            const assessments = this._readRaw(STORAGE_KEYS.ASSESSMENTS).filter(s => s.patientId !== pId);
            localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assessments));

            const notes = this._readRaw(STORAGE_KEYS.CLINICAL_NOTES).filter(n => n.patientId !== pId);
            localStorage.setItem(STORAGE_KEYS.CLINICAL_NOTES, JSON.stringify(notes));

            const tasks = this._readRaw(STORAGE_KEYS.HOMEWORK).filter(t => t.patientId !== pId);
            localStorage.setItem(STORAGE_KEYS.HOMEWORK, JSON.stringify(tasks));

            const moodLogs = this._readRaw(STORAGE_KEYS.MOOD_LOGS).filter(l => l.patientId !== pId);
            localStorage.setItem(STORAGE_KEYS.MOOD_LOGS, JSON.stringify(moodLogs));

            const intakeForms = this._readRaw(STORAGE_KEYS.INTAKE_FORMS).filter(f => f.patientId !== pId);
            localStorage.setItem(STORAGE_KEYS.INTAKE_FORMS, JSON.stringify(intakeForms));

            const contracts = this._readRaw(STORAGE_KEYS.THERAPEUTIC_CONTRACTS).filter(c => c.patientId !== pId);
            localStorage.setItem(STORAGE_KEYS.THERAPEUTIC_CONTRACTS, JSON.stringify(contracts));

            this.logAudit("Patient Deleted", `Cascade deleted patient ID ${pId} and all related clinical logs.`);
            
            // Dispatch changes
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.PATIENTS } }));
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.APPOINTMENTS } }));
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.CLINICAL_NOTES } }));
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INTAKE_FORMS } }));
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.THERAPEUTIC_CONTRACTS } }));
            return true;
        }, [
            STORAGE_KEYS.PATIENTS, 
            STORAGE_KEYS.APPOINTMENTS, 
            STORAGE_KEYS.ASSESSMENTS, 
            STORAGE_KEYS.CLINICAL_NOTES, 
            STORAGE_KEYS.HOMEWORK, 
            STORAGE_KEYS.MOOD_LOGS, 
            STORAGE_KEYS.INTAKE_FORMS,
            STORAGE_KEYS.THERAPEUTIC_CONTRACTS,
            STORAGE_KEYS.AUDIT_LOGS
        ]);
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
            this.runInTransaction(() => {
                Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
                    if (importObj[key]) {
                        localStorage.setItem(storageKey, JSON.stringify(importObj[key]));
                    }
                });
                this.logAudit("Database Restored", "Imported and restored complete database from JSON backup file.");
                window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: 'all' } }));
            }, Object.values(STORAGE_KEYS));
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
        localStorage.removeItem(STORAGE_KEYS.CARE_REQUESTS);
        localStorage.removeItem(STORAGE_KEYS.THERAPEUTIC_CONTRACTS);
        localStorage.removeItem(this.MQ_KEYS.QUEUE);
        localStorage.removeItem(this.MQ_KEYS.DLQ);
        localStorage.removeItem(this._idempotencyKeysKey);
        this._cache.clear();
        this.init();
    }

    // --- Cloud Sync (Offline-First → Server) ---

    /**
     * Syncs all local data to the PsyPyrus Sync Service.
     * Implements the delta payload format from docs/05_backend_schema.md.
     *
     * @param {string} idToken - Firebase Auth ID token for the current user
     * @param {string} [syncApiUrl] - Sync service base URL (defaults to env or localhost)
     * @returns {Promise<{ accepted, created, conflicts, errors, server_timestamp }>}
     */
    static async syncToServer(idToken, syncApiUrl = null) {
        const SYNC_URL = syncApiUrl
            || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SYNC_API_URL)
            || 'http://localhost:3001';

        // Collect all local data as deltas
        const patients = this._readRaw(STORAGE_KEYS.PATIENTS);
        const appointments = this._readRaw(STORAGE_KEYS.APPOINTMENTS);
        const clinicalNotes = this._readRaw(STORAGE_KEYS.CLINICAL_NOTES);
        const assessments = this._readRaw(STORAGE_KEYS.ASSESSMENTS);
        const moodLogs = this._readRaw(STORAGE_KEYS.MOOD_LOGS);
        const homework = this._readRaw(STORAGE_KEYS.HOMEWORK);

        // Add last_modified field required by LWW protocol
        const toDeltas = (items) =>
            items.map((item) => ({
                ...item,
                last_modified: Math.floor((item.registrationDate || item.date || item.timestamp || Date.now()) / 1000),
            }));

        const payload = {
            sync_timestamp: Math.floor(Date.now() / 1000),
            client_device: `Web_${navigator?.userAgent?.split(' ').pop() || 'Browser'}`,
            deltas: {
                patients: toDeltas(patients),
                appointments: toDeltas(appointments),
                clinical_notes: toDeltas(clinicalNotes),
                assessments: toDeltas(assessments),
                mood_logs: toDeltas(moodLogs),
                homework_tasks: toDeltas(homework),
            },
        };

        Logger.info('Database', `Syncing ${patients.length} patients and ${appointments.length} appointments to server...`);

        try {
            const response = await fetch(`${SYNC_URL}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(`Sync failed: ${response.status} ${errorBody.error || response.statusText}`);
            }

            const result = await response.json();

            Logger.info('Database', `Sync complete. Accepted: ${JSON.stringify(result.accepted)}`);

            if (result.conflicts && Object.keys(result.conflicts).length > 0) {
                Logger.warn('Database', `Sync conflicts detected: ${JSON.stringify(result.conflicts)}`);
            }

            return result;
        } catch (err) {
            Logger.error('Database', `Sync error: ${err.message}`);
            throw err;
        }
    }
}

// Initialize database on import
Database.init();
window.PsyPyrusDatabase = Database;

