/**
 * PsyPyrus AI - Offline Database Simulator (localStorage wrapper)
 * Mimics Room Database entities and provides reactive-like reads/writes.
 * Modernized with Caching, Indexing, Connection Pooling, ACID Transactions,
 * Rate Limiting, Idempotency, and a Message Queue with DLQ.
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
    CARE_REQUESTS: 'psypyrus_care_requests'
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

    // --- Patients ---
    static getPatients() {
        const start = performance.now();
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
            if (activeRole === 'Professional') {
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
            if (activeRole === 'Professional') {
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
                fee: 150.0,
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

            this.logAudit("Patient Deleted", `Cascade deleted patient ID ${pId} and all related clinical logs.`);
            
            // Dispatch changes
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.PATIENTS } }));
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.APPOINTMENTS } }));
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.CLINICAL_NOTES } }));
            window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: STORAGE_KEYS.INTAKE_FORMS } }));
            return true;
        }, [
            STORAGE_KEYS.PATIENTS, 
            STORAGE_KEYS.APPOINTMENTS, 
            STORAGE_KEYS.ASSESSMENTS, 
            STORAGE_KEYS.CLINICAL_NOTES, 
            STORAGE_KEYS.HOMEWORK, 
            STORAGE_KEYS.MOOD_LOGS, 
            STORAGE_KEYS.INTAKE_FORMS,
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
        localStorage.removeItem(this.MQ_KEYS.QUEUE);
        localStorage.removeItem(this.MQ_KEYS.DLQ);
        localStorage.removeItem(this._idempotencyKeysKey);
        this._cache.clear();
        this.init();
    }
}

// Initialize database on import
Database.init();
window.PsyPyrusDatabase = Database;
