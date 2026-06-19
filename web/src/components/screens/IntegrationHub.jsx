import { useState, useEffect, useRef, useCallback } from 'react';
import { Database } from '../../services/db';
import { Logger } from '../../services/logger';
import { Tracer } from '../../services/tracer';
import { useToast } from '../ToastProvider';
import { HitopService } from '../../services/hitopService';
import { motion, AnimatePresence } from 'framer-motion';

export function IntegrationHub({ patients, activePatientId, onSetActivePatientId }) {
    const { showToast } = useToast();
    
    // Active Tab state
    const [activeTab, setActiveTab] = useState('clinical'); // 'clinical', 'identity', 'graphs', 'telehealth', 'forms', 'analytics', 'ai', 'registry', 'architecture'

    // --- Distributed Systems & DB State ---
    const [dbCacheStats, setDbCacheStats] = useState({ hits: 0, misses: 0, evictions: 0 });
    const [dbQueryPlan, setDbQueryPlan] = useState({ query: '', strategy: 'No queries run', durationMs: 0 });
    const [dbRateLimitTokens, setDbRateLimitTokens] = useState(15);
    const [dbTxLogs, setDbTxLogs] = useState([]);
    const [dbQueue, setDbQueue] = useState([]);
    const [dbDLQ, setDbDLQ] = useState([]);
    const [dbForceSyncFail, setDbForceSyncFail] = useState(localStorage.getItem('psypyrus_force_sync_fail') === 'true');
    const [activeArchitectureSubTab, setActiveArchitectureSubTab] = useState('db-ops'); // 'db-ops', 'acid', 'messaging', 'resilience', 'observability'
    const [idempotencyKeyInput, setIdempotencyKeyInput] = useState('pay-consultation-' + Math.random().toString(36).substr(2, 9));
    const [isSimulatingPool, setIsSimulatingPool] = useState(false);
    const [activeConnections, setActiveConnections] = useState(0);
    const [queuedPoolQueries, setQueuedPoolQueries] = useState([]);
    const [patientLedger, setPatientLedger] = useState({
        p1: 500,
        p2: 100
    });

    // --- Phase 2: Advanced Resilience & Observability State ---
    const [cbState, setCbState] = useState('CLOSED');
    const [cbHistory, setCbHistory] = useState([]);
    const [cbFailureCount, setCbFailureCount] = useState(0);
    const [sagaLogs, setSagaLogs] = useState([]);
    const [distributedLocks, setDistributedLocks] = useState({});
    const [lockLogs, setLockLogs] = useState([]);
    const [bulkheadStats, setBulkheadStats] = useState({ reads: { active: 0, queued: 0, max: 5 }, writes: { active: 0, queued: 0, max: 2 } });
    const [liveLogs, setLiveLogs] = useState([]);
    const [logLevelFilter, setLogLevelFilter] = useState({ INFO: true, WARN: true, ERROR: true, DEBUG: true });
    const [liveTraces, setLiveTraces] = useState([]);
    const logConsoleRef = useRef(null);

    // Resilience & Observability UI Form Inputs
    const [lockResourceInput, setLockResourceInput] = useState('patient_chart_45');
    const [lockOwnerInput, setLockOwnerInput] = useState('clinician_john');
    const [hashKeyInput, setHashKeyInput] = useState('patient_104');
    const [sagaBillingFail, setSagaBillingFail] = useState(false);
    const [selectedTrace, setSelectedTrace] = useState(null);
    const [logSearchQuery, setLogSearchQuery] = useState('');

    const syncDbMetrics = useCallback(() => {
        setDbCacheStats({ ...Database.cacheStats });
        setDbQueryPlan({ ...Database.lastQueryPlan });
        setDbRateLimitTokens(Math.floor(Database.rateLimit.tokens));
        setDbTxLogs([...Database.transactionLogs]);
        setDbQueue(Database.getQueue());
        setDbDLQ(Database.getDLQ());
        // Phase 2 sync
        setCbState(Database.circuitBreaker.state);
        setCbHistory([...Database.circuitBreaker.history]);
        setCbFailureCount(Database.circuitBreaker.failureCount);
        setSagaLogs([...Database.sagaLogs]);
        setDistributedLocks({ ...Database.getDistributedLocks() });
        setLockLogs([...Database.distributedLockLogs]);
        setBulkheadStats(Database.bulkhead.getStats());
        setLiveLogs([...Logger.getLogs()].reverse());
        setLiveTraces([...Tracer.getCompletedTraces()].reverse());
    }, []);

    useEffect(() => {
        syncDbMetrics();
        window.addEventListener('psypyrus_db_change', syncDbMetrics);
        window.addEventListener('psypyrus_mq_change', syncDbMetrics);
        window.addEventListener('psypyrus_cb_change', syncDbMetrics);
        window.addEventListener('psypyrus_lock_change', syncDbMetrics);
        window.addEventListener('psypyrus_saga_change', syncDbMetrics);
        window.addEventListener('psypyrus_log', syncDbMetrics);
        window.addEventListener('psypyrus_trace', syncDbMetrics);
        window.addEventListener('psypyrus_log_clear', syncDbMetrics);
        window.addEventListener('psypyrus_trace_clear', syncDbMetrics);

        const interval = setInterval(() => {
            setDbRateLimitTokens(Math.floor(Database.rateLimit.tokens));
            setActiveConnections(Database.connectionPool.activeConnections);
            setQueuedPoolQueries(Database.connectionPool.waitingQueue.map((_, i) => `Query ${i + 1}`));
            setBulkheadStats(Database.bulkhead.getStats());
        }, 150);

        return () => {
            window.removeEventListener('psypyrus_db_change', syncDbMetrics);
            window.removeEventListener('psypyrus_mq_change', syncDbMetrics);
            window.removeEventListener('psypyrus_cb_change', syncDbMetrics);
            window.removeEventListener('psypyrus_lock_change', syncDbMetrics);
            window.removeEventListener('psypyrus_saga_change', syncDbMetrics);
            window.removeEventListener('psypyrus_log', syncDbMetrics);
            window.removeEventListener('psypyrus_trace', syncDbMetrics);
            window.removeEventListener('psypyrus_log_clear', syncDbMetrics);
            window.removeEventListener('psypyrus_trace_clear', syncDbMetrics);
            clearInterval(interval);
        };
    }, [syncDbMetrics]);


    // Helper to simulate connection pool query queue
    const simulateParallelQueries = async () => {
        setIsSimulatingPool(true);
        const promises = Array.from({ length: 6 }).map(async (_, idx) => {
            await Database.connectionPool.acquire();
            try {
                await new Promise(resolve => setTimeout(resolve, 800 + idx * 100));
            } finally {
                Database.connectionPool.release();
            }
        });
        await Promise.all(promises);
        setIsSimulatingPool(false);
        showToast("Completed concurrent pooled database query batch.", "success");
    };

    // Helper to execute ACID transaction
    const executeAcidTransaction = () => {
        try {
            Database.runInTransaction(() => {
                if (patientLedger.p1 < 100) throw new Error("Insufficient funds.");
                const updatedP1 = patientLedger.p1 - 100;
                const updatedP2 = patientLedger.p2 + 100;
                setPatientLedger({ p1: updatedP1, p2: updatedP2 });
                Database.insertAppointment({
                    patientId: 1,
                    patientName: "Liam Carter",
                    dateTime: "Today, 4:00 PM",
                    notes: "ACID Transaction enrollment fee transfer.",
                    fee: 100.0,
                    isVideo: true
                });
                Database.logAudit("Transfer Completed", "ACID Multi-table patient balance transfer completed successfully.");
            }, ['psypyrus_appointments', 'psypyrus_audit_logs']);
            showToast("Transaction Committed Successfully!", "success");
        } catch (e) {
            showToast("Transaction Failed: " + e.message, "error");
        }
    };

    // Helper to execute ACID transaction with rollback
    const executeTransactionRollback = () => {
        const originalP1 = patientLedger.p1;
        const originalP2 = patientLedger.p2;
        try {
            Database.runInTransaction(() => {
                setPatientLedger({ p1: patientLedger.p1 - 100, p2: patientLedger.p2 + 100 });
                throw new Error("ValidationException: Appointment time cannot be in the past.");
            }, ['psypyrus_appointments']);
        } catch (e) {
            setPatientLedger({ p1: originalP1, p2: originalP2 });
            showToast("Transaction Aborted & Rolled Back: " + e.message, "warning");
        }
    };

    // Helper to simulate payment with or without idempotency key
    const simulateIdempotentPayment = (useKey) => {
        const key = useKey ? idempotencyKeyInput : null;
        try {
            if (key) {
                const cachedResult = Database.getIdempotentResult(key);
                if (cachedResult !== null) {
                    showToast("Payment Deduplicated! Received Cached Response (No charge).", "info");
                    return;
                }
            }
            if (patientLedger.p1 < 150) throw new Error("Insufficient funds.");
            const newBalance = patientLedger.p1 - 150;
            setPatientLedger(prev => ({ ...prev, p1: newBalance }));
            Database.insertAppointment({
                patientId: 1,
                patientName: "Liam Carter",
                dateTime: "Today, 5:00 PM",
                notes: "Consultation Payment Charge.",
                fee: 150.0,
                isVideo: true
            }, key);
            showToast("Payment successful! Charged $150.", "success");
        } catch (e) {
            showToast("Payment error: " + e.message, "error");
        }
    };

    // --- Phase 2: Advanced System Design Pattern Simulation Helpers ---
    const triggerMockCbFailure = async () => {
        try {
            await Database.circuitCall(() => {
                throw new Error("EHR API Timeout: connection reset");
            });
        } catch (err) {
            showToast(`Cb Call Failed: ${err.message}`, "error");
        } finally {
            syncDbMetrics();
        }
    };

    const triggerMockCbSuccess = async () => {
        try {
            const res = await Database.circuitCall(() => {
                return "Patient data fetched successfully";
            });
            showToast(`Cb Call Succeeded: ${res}`, "success");
        } catch (err) {
            showToast(`Cb Call Failed: ${err.message}`, "error");
        } finally {
            syncDbMetrics();
        }
    };

    const triggerBulkheadSaturation = async () => {
        showToast("Saturating bulkhead read pool with 10 concurrent requests...", "info");
        const promises = Array.from({ length: 10 }).map(async (_, idx) => {
            try {
                await Database.bulkhead.acquire('readPool');
                // simulate async work
                await new Promise(r => setTimeout(r, 2000));
            } catch (err) {
                Logger.error('bulkhead-ui', 'BULKHEAD_REJECT', `Request ${idx + 1} rejected: ${err.message}`);
            } finally {
                Database.bulkhead.release('readPool');
                syncDbMetrics();
            }
        });
        // Tick immediately to show active/queued count
        syncDbMetrics();
    };

    const triggerSagaSimulation = async () => {
        const steps = [
            {
                name: "Create Clinician Profile",
                execute: async () => {
                    Database._writeRaw('psypyrus_temp_clinician', { id: 999, name: "Dr. Saga Expert" });
                    Logger.info('saga-ui', 'SAGA_CREATE_CLINICIAN', "Created temporary clinician profile.");
                },
                compensate: async () => {
                    Database._writeRaw('psypyrus_temp_clinician', []);
                    Logger.warn('saga-ui', 'SAGA_ROLLBACK_CLINICIAN', "Compensated: Removed clinician profile.");
                }
            },
            {
                name: "Provision Practice Workspace",
                execute: async () => {
                    Database._writeRaw('psypyrus_temp_workspace', { id: 888, theme: "blue" });
                    Logger.info('saga-ui', 'SAGA_PROVISION_WORKSPACE', "Provisioned default practice workspace.");
                },
                compensate: async () => {
                    Database._writeRaw('psypyrus_temp_workspace', []);
                    Logger.warn('saga-ui', 'SAGA_ROLLBACK_WORKSPACE', "Compensated: Deprovisioned practice workspace.");
                }
            },
            {
                name: "Initialize Stripe Billing Account",
                execute: async () => {
                    if (sagaBillingFail) {
                        throw new Error("Stripe API Connection Timeout (Simulated)");
                    }
                    Database._writeRaw('psypyrus_temp_billing', { id: 777, stripeId: "cus_123" });
                    Logger.info('saga-ui', 'SAGA_BILLING_SETUP', "Stripe billing client initialized.");
                },
                compensate: async () => {
                    Database._writeRaw('psypyrus_temp_billing', []);
                    Logger.warn('saga-ui', 'SAGA_ROLLBACK_BILLING', "Compensated: Deleted billing link.");
                }
            }
        ];

        try {
            showToast("Starting onboarding saga...", "info");
            await Database.runSaga(steps, "Clinician Onboarding Saga");
            showToast("Clinician Onboarding Saga completed and committed!", "success");
        } catch (err) {
            showToast(`Saga Aborted: ${err.message}`, "error");
        } finally {
            syncDbMetrics();
        }
    };

    // Design System Registry State
    const [selectedComp, setSelectedComp] = useState('glass-card');
    const [registryViewTab, setRegistryViewTab] = useState('preview');
    const [cliInput, setCliInput] = useState('');
    const [cliLogs, setCliLogs] = useState([
        '$ npx psypyrus-ui --help',
        'Available components in registry:',
        ' - glass-card',
        ' - action-btn',
        ' - search-input',
        ' - stepper',
        '',
        'Try: npx psypyrus-ui add [component-name]'
    ]);
    const [installedComponents, setInstalledComponents] = useState([]);
    const [btnClickCount, setBtnClickCount] = useState(0);
    const [activeStep, setActiveStep] = useState(1);
    const cliConsoleRef = useRef(null);

    useEffect(() => {
        if (cliConsoleRef.current) {
            cliConsoleRef.current.scrollTop = cliConsoleRef.current.scrollHeight;
        }
    }, [cliLogs]);

    const handleCliSubmit = (e) => {
        e.preventDefault();
        const cmd = cliInput.trim();
        if (!cmd) return;

        setCliLogs(prev => [...prev, `$ ${cmd}`]);
        setCliInput('');

        // Parse command
        if (cmd.startsWith('npx psypyrus-ui add ')) {
            const componentName = cmd.substring('npx psypyrus-ui add '.length).trim();
            const validComponents = ['glass-card', 'action-btn', 'search-input', 'stepper'];

            if (validComponents.includes(componentName)) {
                if (installedComponents.includes(componentName)) {
                    setCliLogs(prev => [
                        ...prev,
                        `[INFO] Component "${componentName}" is already installed. Use --force to reinstall.`
                    ]);
                    return;
                }

                // Simulate installation logs
                let logsSequence = [
                    `⠋ Fetching "${componentName}" from registry...`,
                    `✔ Found component "${componentName}" matching shadcn/ui specs.`,
                    `⠙ Resolving dependencies (framer-motion)...`,
                    `✔ Dependencies verified.`,
                    `⠹ Creating src/components/ui/${componentName}.jsx...`,
                    `✔ Component written to disk successfully.`,
                    `✔ Done! Installed "${componentName}".`
                ];

                // We can output logs one by one
                logsSequence.forEach((log, idx) => {
                    setTimeout(() => {
                        setCliLogs(prev => [...prev, log]);
                        if (idx === logsSequence.length - 1) {
                            setInstalledComponents(prev => [...prev, componentName]);
                            showToast(`Successfully installed ${componentName}!`, "success");
                        }
                    }, (idx + 1) * 350);
                });

            } else if (componentName === 'all') {
                let logsSequence = [
                    `⠋ Fetching all components from registry...`,
                    `✔ Found 4 components in registry.`,
                    `⠙ Resolving dependencies...`,
                    `⠹ Installing: glass-card, action-btn, search-input, stepper...`,
                    `✔ Created 4 components in src/components/ui/`,
                    `✔ Done! All components installed.`
                ];
                logsSequence.forEach((log, idx) => {
                    setTimeout(() => {
                        setCliLogs(prev => [...prev, log]);
                        if (idx === logsSequence.length - 1) {
                            setInstalledComponents(['glass-card', 'action-btn', 'search-input', 'stepper']);
                            showToast("All components installed!", "success");
                        }
                    }, (idx + 1) * 350);
                });
            } else {
                setCliLogs(prev => [
                    ...prev,
                    `Error: Component "${componentName}" not found in registry.`,
                    `Available: glass-card, action-btn, search-input, stepper`
                ]);
            }
        } else if (cmd === 'npx psypyrus-ui list') {
            setCliLogs(prev => [
                ...prev,
                `Available components in registry:`,
                ` - glass-card [Ready]`,
                ` - action-btn [Ready]`,
                ` - search-input [Ready]`,
                ` - stepper [Ready]`,
                `Installed: ${installedComponents.join(', ') || 'none'}`
            ]);
        } else if (cmd === 'npx psypyrus-ui help' || cmd === 'npx psypyrus-ui' || cmd === 'help') {
            setCliLogs(prev => [
                ...prev,
                `Available commands:`,
                `  npx psypyrus-ui add [component-name]`,
                `  npx psypyrus-ui list`,
                `  npx psypyrus-ui help`
            ]);
        } else {
            setCliLogs(prev => [
                ...prev,
                `command not found: ${cmd}. Try "npx psypyrus-ui help"`
            ]);
        }
    };
    
    // Active patient details
    const activePatient = patients.find(p => p.id === Number(activePatientId)) || patients[0];
    
    // Keycloak Simulator State
    const [kcConfig, setKcConfig] = useState({
        url: 'http://localhost:8080/auth',
        realm: 'psypyrus-realm',
        clientId: 'psypyrus-web-client',
        clientSecret: '••••••••••••••••••••••••••••••••'
    });
    const [kcStatus, setKcStatus] = useState('Disconnected'); // 'Disconnected', 'Connecting', 'Connected'
    const [kcToken, setKcToken] = useState(null);
    const [showTokenPayload, setShowTokenPayload] = useState(false);
    
    // EMR Sync State (OpenEMR & Bahmni)
    const [emrType, setEmrType] = useState('openemr'); // 'openemr' or 'bahmni'
    const [emrConfig, setEmrConfig] = useState({
        endpoint: 'http://localhost:8000/apis/default/api',
        clientId: 'psy_client_abc',
        clientSecret: 'psy_secret_xyz'
    });
    const [emrLogs, setEmrLogs] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // FHIR State
    const [fhirLog, setFhirLog] = useState('');
    const [pastedFHIRQuestionnaire, setPastedFHIRQuestionnaire] = useState(JSON.stringify({
        "resourceType": "Questionnaire",
        "id": "phq-9",
        "title": "Patient Health Questionnaire (PHQ-9)",
        "status": "active",
        "item": [
            { "linkId": "1", "text": "Little interest or pleasure in doing things", "type": "choice", "answerOption": [{ "valueInteger": 0, "valueString": "Not at all" }, { "valueInteger": 1, "valueString": "Several days" }, { "valueInteger": 2, "valueString": "More than half the days" }, { "valueInteger": 3, "valueString": "Nearly every day" }] },
            { "linkId": "2", "text": "Feeling down, depressed, or hopeless", "type": "choice", "answerOption": [{ "valueInteger": 0, "valueString": "Not at all" }, { "valueInteger": 1, "valueString": "Several days" }, { "valueInteger": 2, "valueString": "More than half the days" }, { "valueInteger": 3, "valueString": "Nearly every day" }] },
            { "linkId": "3", "text": "Trouble falling or staying asleep, or sleeping too much", "type": "choice", "answerOption": [{ "valueInteger": 0, "valueString": "Not at all" }, { "valueInteger": 1, "valueString": "Several days" }, { "valueInteger": 2, "valueString": "More than half the days" }, { "valueInteger": 3, "valueString": "Nearly every day" }] }
        ]
    }, null, 2));
    const [renderedFHIRQuestions, setRenderedFHIRQuestions] = useState([]);
    const [fhirAnswers, setFhirAnswers] = useState({});

    // ABDM Ecosystem State
    const [abdmConfig, setAbdmConfig] = useState({
        clientId: 'SBX_002934',
        clientSecret: '••••••••••••••••••••••••••••••••',
        gatewayUrl: 'https://dev.abdm.gov.in/gway/v0.5',
        cmUrl: 'https://sbx.abdm.gov.in/cm'
    });
    const [abdmLogs, setAbdmLogs] = useState([
        `[${new Date().toLocaleTimeString()}] ABDM Sandbox Simulator initialized.`,
        'Ready to authenticate with National Health Authority gateway.'
    ]);
    const [isAbdmTesting, setIsAbdmTesting] = useState(false);
    const [abdmPurpose, setAbdmPurpose] = useState('CAREMGT');
    const [abdmDataTypes, setAbdmDataTypes] = useState(['DiagnosticReport', 'Prescription']);
    const [abdmDuration, setAbdmDuration] = useState('1 Month');
    const [consentRequests, setConsentRequests] = useState([
        { id: 'REQ-101', patientName: 'Sophia Patel', abhaAddress: 'sophia.patel@abdm', purpose: 'CAREMGT', dataTypes: ['DiagnosticReport', 'Prescription'], status: 'GRANTED', date: '14 Jun 2026' },
        { id: 'REQ-102', patientName: 'Liam Carter', abhaAddress: 'liam.carter@abdm', purpose: 'CAREMGT', dataTypes: ['Prescription'], status: 'PENDING', date: '14 Jun 2026' }
    ]);
    const [selectedRequestForConsent, setSelectedRequestForConsent] = useState(null);
    const [isFetchingAbdmRecords, setIsFetchingAbdmRecords] = useState(false);
    const [fetchedHealthRecords, setFetchedHealthRecords] = useState(null);

    // NRCeS Standards Registry State
    const [nrcSnomedQuery, setNrcSnomedQuery] = useState('');
    const [nrcSnomedResults, setNrcSnomedResults] = useState([]);
    const [nrcOpenEhrLogs, setNrcOpenEhrLogs] = useState([]);
    const [isOpenEhrExporting, setIsOpenEhrExporting] = useState(false);

    // ABDM Handlers
    const handleTestAbdmGateway = () => {
        setIsAbdmTesting(true);
        const time = () => new Date().toLocaleTimeString();
        setAbdmLogs(prev => [...prev, `[${time()}] POST /v0.5/sessions client_id=${abdmConfig.clientId}...`]);
        
        setTimeout(() => {
            setAbdmLogs(prev => [...prev, `[${time()}] NHA Gateway accepted credentials. Commencing JWKS signature validation...`]);
            setTimeout(() => {
                setAbdmLogs(prev => [
                    ...prev,
                    `[${time()}] Fetched public keys from ABDM directories.`,
                    `[${time()}] Signed JWT assertion token using clinical private key.`,
                    `[${time()}] Handshake successful. Status: Connected. OAuth2 Token active. Sandbox latency: 38ms.`
                ]);
                setIsAbdmTesting(false);
                showToast("Authenticated with ABDM Gateway sandbox successfully!", "success");
            }, 600);
        }, 600);
    };

    const handleRaiseConsentRequest = () => {
        const time = () => new Date().toLocaleTimeString();
        if (!activePatient.abhaNumber) {
            showToast("Active patient does not have a linked ABHA ID. Link ABHA first.", "error");
            return;
        }

        const newReq = {
            id: 'REQ-' + Math.floor(100 + Math.random() * 900),
            patientName: activePatient.name,
            abhaAddress: activePatient.abhaAddress || `${activePatient.name.toLowerCase().replace(/\s+/g, '.')}@abdm`,
            purpose: abdmPurpose,
            dataTypes: abdmDataTypes,
            status: 'PENDING',
            date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        };

        setConsentRequests(prev => [newReq, ...prev]);
        setAbdmLogs(prev => [
            ...prev,
            `[${time()}] POST /v0.5/consent-requests/initiate for patient ${newReq.patientName} (${newReq.abhaAddress})...`,
            `[${time()}] Consent request raised with ID ${newReq.id}. Waiting for patient approval in ABHA locker app.`
        ]);
        showToast(`Raised ABDM consent request ${newReq.id} successfully.`, "success");
    };

    const handleSimulatePatientResponse = (reqId, approve) => {
        const time = () => new Date().toLocaleTimeString();
        setConsentRequests(prev => prev.map(req => {
            if (req.id === reqId) {
                return { ...req, status: approve ? 'GRANTED' : 'DENIED' };
            }
            return req;
        }));

        setAbdmLogs(prev => [
            ...prev,
            `[${time()}] Callback received from Consent Manager for Request ${reqId}.`,
            `[${time()}] Status updated: ${approve ? 'GRANTED (Token: tok_consent_' + reqId + ')' : 'DENIED'}`
        ]);
        
        showToast(
            approve 
                ? `Consent request ${reqId} was APPROVED by the patient.` 
                : `Consent request ${reqId} was DENIED by the patient.`,
            approve ? "success" : "warning"
        );
        setSelectedRequestForConsent(null);
    };

    const handleFetchDecryptedRecords = (req) => {
        setIsFetchingAbdmRecords(true);
        const time = () => new Date().toLocaleTimeString();
        setAbdmLogs(prev => [
            ...prev,
            `[${time()}] Fetching health information from HIP registry using token tok_consent_${req.id}...`,
            `[${time()}] Pulling encrypted HL7 FHIR Bundle from gateway...`
        ]);

        setTimeout(() => {
            setAbdmLogs(prev => [
                ...prev,
                `[${time()}] Encrypted data block received. Size: 45.2 KB.`,
                `[${time()}] Initiating local decryption using Diffie-Hellman key exchange...`,
                `[${time()}] FHIR Bundle parsed successfully. Found 3 resources.`
            ]);
            
            setFetchedHealthRecords({
                patientName: req.patientName,
                abhaAddress: req.abhaAddress,
                records: [
                    { type: 'Teletherapy Consultation', source: 'eSanjeevani Tele-Mental Health Portal', date: '28 May 2026', doctor: 'Dr. Ramesh Nair (M.D. Psychiatry)', notes: 'Symptom check: Moderate anxiety triggers evaluated. Advised CBT relaxation techniques.' },
                    { type: 'Medication Prescription', source: 'PurpleDocs Cloud EHR (Fortis Hospital)', date: '14 May 2026', details: 'Alprazolam 0.25mg - once daily as needed. Qty: 10 tablets. Refills: 0.' },
                    { type: 'Clinical Screening', source: 'Bahmni EMR client (Primary Health Center)', date: '10 Apr 2026', details: 'GAD-7 score: 14 (Moderate anxiety). Patient advised clinical monitoring.' }
                ]
            });
            setIsFetchingAbdmRecords(false);
            showToast("External patient records fetched and decrypted successfully!", "success");
        }, 1200);
    };
    
    // Neo4j State
    const [cypherQuery, setCypherQuery] = useState('// Query Patient RDoC construct elevations\nMATCH (p:Patient {id: 1})-[r:ELEVATED_DYSREGULATION]->(c:RdocConstruct)\nRETURN p.name, c.name, r.score;');
    const [cypherResult, setCypherResult] = useState(null);
    const [isExecutingCypher, setIsExecutingCypher] = useState(false);
    
    // Apache Jena RDF state
    const [sparqlQuery, setSparqlQuery] = useState('PREFIX psypyrus: <http://psypyrus.ai/ontology#>\nPREFIX rdoc: <http://nimh.nih.gov/rdoc/ontology#>\n\nSELECT ?patientName ?constructLabel ?score\nWHERE {\n  ?patient a psypyrus:Patient ;\n           psypyrus:hasName ?patientName ;\n           rdoc:hasActiveConstruct ?c .\n  ?c rdoc:construct ?construct ;\n     rdoc:constructScore ?score .\n  ?construct rdfs:label ?constructLabel .\n}');
    const [sparqlResult, setSparqlResult] = useState(null);
    const [rdfTurtle, setRdfTurtle] = useState('');
    
    // Jitsi Meet State
    const [jitsiMeetingStarted, setJitsiMeetingStarted] = useState(false);
    const [jitsiRoom, setJitsiRoom] = useState('');
    const jitsiContainerRef = useRef(null);
    
    // Cal.com State
    const [calUsername, setCalUsername] = useState('dr-liam-carter');
    const [webhookLog, setWebhookLog] = useState([]);
    const [embedCalLoaded, setEmbedCalLoaded] = useState(false);
    
    // Form.io State
    const [formioSchema, setFormioSchema] = useState(JSON.stringify({
        "components": [
            { "type": "textfield", "key": "chiefComplaint", "label": "Verbatim Chief Complaint", "placeholder": "Describe what brings you in today...", "input": true },
            { "type": "select", "key": "insightGrade", "label": "Psychiatric Insight Scale", "data": { "values": [{ "value": "1", "label": "Grade 1: Complete Denial" }, { "value": "4", "label": "Grade 4: Intellectual Awareness" }, { "value": "6", "label": "Grade 6: True Emotional Insight" }] }, "input": true },
            { "type": "checkbox", "key": "suicidalIdeation", "label": "Active Suicidal Ideation / Intent Present", "defaultValue": false, "input": true }
        ]
    }, null, 2));
    const [formioAnswers, setFormioAnswers] = useState({});
    const [formioSubmittedData, setFormioSubmittedData] = useState(null);
    
    // LangChain State
    const [lcChainType, setLcChainType] = useState('soap_note'); // 'soap_note', 'guardrail', 'clinical_agent'
    const [lcPrompt, setLcPrompt] = useState('Generate a clinical SOAP note based on these transcript logs:\n"Patient reports feeling down for 2 weeks. Has lost interest in work. Sleeping 10 hours a day. GAD score is normal, but PHQ score is 16."');
    const [lcTraceLog, setLcTraceLog] = useState([]);
    const [isRunningChain, setIsRunningChain] = useState(false);
    const [chainOutput, setChainOutput] = useState('');
    
    // LlamaIndex State
    const [llamaQuery, setLlamaQuery] = useState('What are the specific exclusion criteria for Major Depressive Disorder under DSM-5-TR?');
    const [llamaIndexStatus, setLlamaIndexStatus] = useState('Index empty. Ingestion required.');
    const [llamaNodes, setLlamaNodes] = useState([]);
    const [llamaResponse, setLlamaResponse] = useState('');
    const [isIngestingLlama, setIsIngestingLlama] = useState(false);
    const [isQueryingLlama, setIsQueryingLlama] = useState(false);
    
    // Haystack State
    const [haystackPipelineNodes, setHaystackPipelineNodes] = useState([
        { id: '1', name: 'DocumentStore', type: 'InMemoryDocumentStore', active: true },
        { id: '2', name: 'Retriever', type: 'BM25Retriever', active: true },
        { id: '3', name: 'PromptBuilder', type: 'ClinicalSOAPTemplate', active: true },
        { id: '4', name: 'Generator', type: 'GeminiGenerator', active: true }
    ]);
    const [haystackOutputLog, setHaystackOutputLog] = useState('');
    
    // Pre-populate Jitsi room name based on active patient & appointment code
    useEffect(() => {
        if (activePatient) {
            const cleanName = activePatient.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            setJitsiRoom(`psypyrus-tele-session-${cleanName}-${activePatient.id}`);
        }
    }, [activePatient]);
    
    // Keycloak Simulator Action
    const handleKeycloakLogin = () => {
        setKcStatus('Connecting');
        showToast("Initiating OIDC Redirect Connection to Keycloak server...", "info");
        
        setTimeout(() => {
            setKcStatus('Connected');
            const expTime = Math.floor(Date.now() / 1000) + 3600;
            const mockToken = {
                header: {
                    alg: "RS256",
                    typ: "JWT",
                    kid: "keycloak-psypyrus-sig-key-v1"
                },
                payload: {
                    iss: `${kcConfig.url}/realms/${kcConfig.realm}`,
                    sub: "practitioner-liam-carter-1002",
                    aud: kcConfig.clientId,
                    exp: expTime,
                    nbf: Math.floor(Date.now() / 1000) - 10,
                    iat: Math.floor(Date.now() / 1000),
                    name: "Dr. Liam Carter",
                    email: "liam.carter@psypyrus.ai",
                    resource_access: {
                        "psypyrus-web-client": {
                            roles: ["practitioner", "clinical_admin", "soap_notes_writer"]
                        }
                    },
                    scope: "openid profile email clinical:write fhir:read"
                },
                signature: "Hk2_sdF8uS_p9GZ-043_1J_mock_signature_xXyYzz"
            };
            setKcToken(mockToken);
            Database.logAudit("Keycloak Identity Synced", `SSO login completed via realm '${kcConfig.realm}' as Dr. Liam Carter.`);
            showToast("Authenticated successfully. Decoded JWT credentials mapping loaded.", "success");
        }, 1500);
    };
    
    const handleKeycloakDisconnect = () => {
        setKcStatus('Disconnected');
        setKcToken(null);
        Database.logAudit("Keycloak Session Closed", "Revoked OAuth2 active session tokens.");
        showToast("Keycloak SSO disconnected. Access permissions reset to standard sandbox role.", "info");
    };
    
    // EMR Sync Actions
    const handleEmrSync = () => {
        if (!activePatient) return;
        setIsSyncing(true);
        const logTime = () => new Date().toLocaleTimeString();
        setEmrLogs([`[${logTime()}] Initializing connection to ${emrType === 'openemr' ? 'OpenEMR' : 'Bahmni'} REST API at ${emrConfig.endpoint}...`]);
        
        setTimeout(() => {
            setEmrLogs(prev => [...prev, `[${logTime()}] Verifying API client keys (Client ID: ${emrConfig.clientId})...`]);
        }, 600);
        
        setTimeout(() => {
            setEmrLogs(prev => [...prev, `[${logTime()}] Secure authorization successful. OAuth2 Bearer token generated.`]);
            setEmrLogs(prev => [...prev, `[${logTime()}] Querying external patient catalog for: "${activePatient.name}"`]);
        }, 1200);
        
        setTimeout(() => {
            setEmrLogs(prev => [...prev, `[${logTime()}] Match found! External Patient Reference: ID-004812-${emrType.toUpperCase()}`]);
            setEmrLogs(prev => [...prev, `[${logTime()}] Mapping data payloads:
  - demographics: { age: ${activePatient.age}, gender: "${activePatient.gender}" }
  - problem_list: [ "${activePatient.specialty || 'None'}" ]
  - risk_profile: "${activePatient.riskStatus}"`]);
        }, 1800);
        
        setTimeout(() => {
            setEmrLogs(prev => [...prev, `[${logTime()}] Syncing latest clinical notes (SOAP notes & MSE summaries)...`]);
        }, 2300);
        
        setTimeout(() => {
            setIsSyncing(false);
            setEmrLogs(prev => [...prev, `[${logTime()}] SUCCESS: Sync complete. All data streams matching. Transactions recorded.`]);
            Database.logAudit("EHR Registry Sync", `Demographics and clinical charts synced for patient ${activePatient.name} to ${emrType === 'openemr' ? 'OpenEMR' : 'Bahmni'}.`);
            showToast(`Patient charts synced with ${emrType === 'openemr' ? 'OpenEMR' : 'Bahmni'} registry.`, "success");
        }, 3000);
    };
    
    // FHIR Actions
    const handleRenderFHIRQuestionnaire = () => {
        try {
            const parsed = JSON.parse(pastedFHIRQuestionnaire);
            if (parsed.resourceType !== "Questionnaire") {
                showToast("Provided JSON is not a valid FHIR Questionnaire resource.", "error");
                return;
            }
            if (!parsed.item || !Array.isArray(parsed.item)) {
                showToast("Questionnaire resource lacks form items list.", "error");
                return;
            }
            setRenderedFHIRQuestions(parsed.item);
            setFhirAnswers({});
            showToast("FHIR Questionnaire schema parsed. Input forms rendered below.", "success");
        } catch (e) {
            showToast(`JSON Syntax Error: ${e.message}`, "error");
        }
    };
    
    // NRCeS Standard Handlers
    const handleSnomedLookup = (query) => {
        setNrcSnomedQuery(query);
        if (!query.trim()) {
            setNrcSnomedResults([]);
            return;
        }
        
        const mockSnomedRegistry = [
            { code: "370247008", display: "Major depressive disorder, single episode", category: "Depressive" },
            { code: "21897009", display: "Generalized anxiety disorder", category: "Anxiety" },
            { code: "47505003", display: "Post-traumatic stress disorder", category: "Trauma-Related" },
            { code: "307222002", display: "Attention deficit hyperactivity disorder, combined type", category: "Neurodevelopmental" },
            { code: "370933005", display: "Bipolar I disorder, current episode manic", category: "Bipolar" },
            { code: "37163004", display: "Panic disorder", category: "Anxiety" },
            { code: "33010005", display: "Borderline personality disorder", category: "Personality" },
            { code: "49578007", display: "Obsessive-compulsive disorder", category: "OCD-Related" },
            { code: "27171005", display: "Anorexia nervosa", category: "Eating" },
            { code: "48127003", display: "Social phobia", category: "Anxiety" },
            { code: "46132009", display: "Specific phobia", category: "Anxiety" },
            { code: "27218002", display: "Adjustment disorder", category: "Stress-Response" },
            { code: "68212000", display: "Acute stress disorder", category: "Stress-Response" },
            { code: "1023001", display: "Apnea", category: "Observation" },
            { code: "424090002", display: "GAD-7 Assessment Scale", category: "Observation" },
            { code: "70274-6", display: "Generalized Anxiety Disorder 7 item (GAD-7) total score", category: "LOINC Map" },
            { code: "44261-6", display: "Patient Health Questionnaire 9 item (PHQ-9) total score", category: "LOINC Map" }
        ];
        
        const filtered = mockSnomedRegistry.filter(item => 
            item.display.toLowerCase().includes(query.toLowerCase()) || 
            item.code.includes(query) || 
            item.category.toLowerCase().includes(query.toLowerCase())
        );
        setNrcSnomedResults(filtered);
    };

    const handleExportOpenEhr = () => {
        if (!activePatient) return;
        setIsOpenEhrExporting(true);
        const time = () => new Date().toLocaleTimeString();
        setNrcOpenEhrLogs(prev => [...prev, `[${time()}] Initializing openEHR composition builder for archetype 'openEHR-EHR-COMPOSITION.encounter.v1'...`]);
        
        setTimeout(() => {
            setNrcOpenEhrLogs(prev => [...prev, `[${time()}] Mapping patient demographics and active clinical context to openEHR template...`]);
            setTimeout(() => {
                setNrcOpenEhrLogs(prev => [...prev, `[${time()}] Formulating EVALUATION.problem_diagnosis.v1 with SNOMED-CT::370247008...`]);
                setTimeout(() => {
                    const mockOpenEhrComposition = {
                        "openEHR_version": "1.0.4",
                        "archetype_details": {
                            "archetype_id": "openEHR-EHR-COMPOSITION.encounter.v1",
                            "template_id": "PsyPyrus_Standard_Encounter_v2"
                        },
                        "context": {
                            "start_time": new Date().toISOString(),
                            "setting": {
                                "value": "telehealth consultation",
                                "defining_code": {
                                    "terminology_id": "openehr",
                                    "code_string": "238"
                                }
                            }
                        },
                        "content": [
                            {
                                "archetype_id": "openEHR-EHR-EVALUATION.problem_diagnosis.v1",
                                "name": "Active Diagnosis Summary",
                                "data": {
                                    "problem_diagnosis_name": activePatient.specialty,
                                    "terminology": "SNOMED-CT",
                                    "code": activePatient.specialty === "Major Depressive Disorder (MDD), Single Episode" ? "370247008" : "21897009"
                                }
                            },
                            {
                                "archetype_id": "openEHR-EHR-OBSERVATION.phq9.v1",
                                "name": "Psychiatric Screening Metrics",
                                "data": {
                                    "phq9_total_score": 15,
                                    "loinc_code": "44261-6"
                                }
                            }
                        ]
                    };
                    
                    const fileContent = JSON.stringify(mockOpenEhrComposition, null, 2);
                    setNrcOpenEhrLogs(prev => [
                        ...prev, 
                        `[${time()}] Archetype generation completed. Exporting file...`,
                        `[${time()}] Transaction success: openEHR Composition JSON downloaded.`
                    ]);
                    setIsOpenEhrExporting(false);
                    
                    const blob = new Blob([fileContent], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `openEHR_Composition_Encounter_${activePatient.id}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    Database.logAudit("Exported openEHR Archetype", `Exported openEHR Archetype Composition for Patient ID ${activePatient.id}`);
                    showToast("openEHR Archetype composition successfully compiled and downloaded.", "success");
                }, 800);
            }, 600);
        }, 500);
    };

    const handleExportFHIRQuestionnaireResponse = () => {
        if (!activePatient) return;
        const recentScores = Database.getAssessments(activePatient.id);
        const latestPHQ = recentScores.find(s => s.type === 'PHQ-9') || { score: 15, details: "Moderate Depression" };
        
        const qResponse = {
            resourceType: "QuestionnaireResponse",
            id: `qr-${activePatient.id}-${Date.now()}`,
            questionnaire: "http://psypyrus.ai/fhir/Questionnaire/clinical-intake-v1",
            status: "completed",
            subject: {
                reference: `Patient/${activePatient.id}`,
                display: activePatient.name
            },
            authored: new Date().toISOString(),
            author: {
                reference: "Practitioner/1002",
                display: "Dr. Liam Carter"
            },
            item: [
                {
                    linkId: "patient-details",
                    text: "Patient Demographic Indicators",
                    item: [
                        { linkId: "p-name", text: "Full Name", answer: [{ valueString: activePatient.name }] },
                        { linkId: "p-age", text: "Age", answer: [{ valueString: activePatient.age || "29" }] },
                        { linkId: "p-gender", text: "Administrative Gender", answer: [{ valueString: activePatient.gender }] }
                    ]
                },
                {
                    linkId: "clinical-indices",
                    text: "Active Diagnostic Indicators",
                    item: [
                        { 
                            linkId: "c-disorder", 
                            text: "Disorder Focus", 
                            answer: [{ 
                                valueString: activePatient.specialty,
                                extension: [{
                                    url: "http://hl7.org/fhir/StructureDefinition/codeableconcept-coding",
                                    valueCoding: {
                                        system: "http://snomed.info/sct",
                                        code: activePatient.specialty === "Major Depressive Disorder (MDD), Single Episode" ? "370247008" :
                                              activePatient.specialty === "Generalized Anxiety Disorder (GAD)" ? "21897009" :
                                              activePatient.specialty === "Post-Traumatic Stress Disorder (PTSD)" ? "47505003" : "Unknown",
                                        display: activePatient.specialty
                                    }
                                }]
                            }] 
                        },
                        { linkId: "c-risk", text: "Risk Severity Rating", answer: [{ valueString: activePatient.riskStatus }] },
                        { 
                            linkId: "phq-9-score", 
                            text: "Latest PHQ-9 Cumulative Score", 
                            answer: [{ 
                                valueInteger: latestPHQ.score,
                                extension: [{
                                    url: "http://hl7.org/fhir/StructureDefinition/codeableconcept-coding",
                                    valueCoding: {
                                        system: "http://loinc.org",
                                        code: "44261-6",
                                        display: "Patient Health Questionnaire 9 item (PHQ-9) total score [Reported]"
                                    }
                                }]
                            }] 
                        }
                    ]
                }
            ]
        };
        
        const fileContent = JSON.stringify(qResponse, null, 2);
        setFhirLog(fileContent);
        
        const blob = new Blob([fileContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FHIR_QuestionnaireResponse_Patient_${activePatient.id}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Database.logAudit("Exported FHIR Resource", `Exported QuestionnaireResponse resource for Patient ID ${activePatient.id}`);
        showToast("FHIR QuestionnaireResponse JSON generated and downloaded.", "success");
    };
    
    // Neo4j Cypher console simulation
    const handleExecuteCypher = () => {
        setIsExecutingCypher(true);
        setTimeout(() => {
            setIsExecutingCypher(false);
            if (cypherQuery.toLowerCase().includes('match') && cypherQuery.toLowerCase().includes('patient')) {
                if (cypherQuery.toLowerCase().includes('rdoc') || cypherQuery.toLowerCase().includes('construct')) {
                    setCypherResult({
                        headers: ["p.name", "c.name", "r.score"],
                        rows: [
                            [activePatient.name, "Loss", "70%"],
                            [activePatient.name, "Reward Responsiveness", "65%"],
                            [activePatient.name, "Sleep and Wakefulness", "45%"]
                        ]
                    });
                } else if (cypherQuery.toLowerCase().includes('hitop') || cypherQuery.toLowerCase().includes('spectrum')) {
                    setCypherResult({
                        headers: ["p.name", "s.name", "r.score", "r.elevationPercent"],
                        rows: [
                            [activePatient.name, "Internalizing", "3.42", "81%"],
                            [activePatient.name, "Somatoform", "2.88", "63%"],
                            [activePatient.name, "General p-Factor", "2.58", "53%"]
                        ]
                    });
                } else {
                    setCypherResult({
                        headers: ["p.name", "s.name", "r.severity", "r.durationDays"],
                        rows: [
                            [activePatient.name, "Anhedonia", "Severe", "30 days"],
                            [activePatient.name, "Depressed Mood", "Moderate", "14 days"],
                            [activePatient.name, "Insomnia", "Severe", "45 days"]
                        ]
                    });
                }
                showToast("Cypher query parsed. Graph data mapped to tabular nodes.", "success");
            } else {
                setCypherResult({
                    headers: ["Node ID", "Label", "Properties"],
                    rows: [
                        ["dsm-300.02", "Disorder", '{"name": "Generalized Anxiety Disorder", "code": "F41.1"}'],
                        ["dsm-296.22", "Disorder", '{"name": "Major Depressive Disorder", "code": "F32.1"}'],
                        ["symptom-fatigue", "Symptom", '{"name": "Fatigue or lack of energy"}']
                    ]
                });
                showToast("Executed query on DSM-5 clinical database catalog graph.", "success");
            }
        }, 1000);
    };
    
    // Apache Jena Sparql & RDF turtle generator
    const handleGenerateRDF = () => {
        if (!activePatient) return;
        const recentScores = Database.getAssessments(activePatient.id);
        const latestPHQ = recentScores.find(s => s.type === 'PHQ-9') || { score: 15 };
        
        const cleanName = activePatient.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        let turtle = `@prefix psypyrus: <http://psypyrus.ai/ontology#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix hitop: <http://hitop-taxonomy.org/ontology#> .

psypyrus:patient_${activePatient.id} a psypyrus:Patient ;
    psypyrus:hasName "${activePatient.name}"^^xsd:string ;
    psypyrus:hasAge "${activePatient.age}"^^xsd:integer ;
    psypyrus:hasGender "${activePatient.gender}"^^xsd:string ;
    psypyrus:hasRiskLevel "${activePatient.riskStatus}"^^xsd:string ;
    psypyrus:hasDiagnosis psypyrus:disorder_${cleanName} ;
    psypyrus:phq9CumulativeScore "${latestPHQ.score}"^^xsd:integer .

psypyrus:disorder_${cleanName} a psypyrus:MentalDisorder ;
    rdfs:label "${activePatient.specialty || 'Psychiatric Condition'}"^^xsd:string ;
    psypyrus:severityRating "${activePatient.riskStatus === 'Severe' ? 'High' : 'Medium'}"^^xsd:string .
`;

        const hitopReport = HitopService.mapPatientToHitop(activePatient.id);
        if (hitopReport) {
            turtle += `\n# --- HiTOP Dimensional Profile Ontology ---\n`;
            turtle += `psypyrus:patient_${activePatient.id} hitop:hasPsychopathologyProfile psypyrus:hitop_profile_${activePatient.id} .\n\n`;
            turtle += `psypyrus:hitop_profile_${activePatient.id} a hitop:HiTOPProfile ;\n`;
            turtle += `    hitop:dateCompiled "${new Date().toISOString()}"^^xsd:dateTime ;\n`;
            
            // Add spectra elevations
            hitopReport.spectra.forEach((spec, i) => {
                turtle += `    hitop:hasSpectrumElevation [\n` +
                          `        hitop:spectrum hitop:${spec.name.replace(/\s+/g, '')} ;\n` +
                          `        hitop:meanScore "${spec.score}"^^xsd:decimal ;\n` +
                          `        hitop:elevationPercent "${spec.elevation}"^^xsd:integer\n` +
                          `    ]${i === hitopReport.spectra.length - 1 && hitopReport.secondary.length === 0 ? ' .' : ' ;'}\n`;
            });
            
            // Add secondary elevations
            hitopReport.secondary.forEach((sec, i) => {
                turtle += `    hitop:hasSecondaryElevation [\n` +
                          `        hitop:scale hitop:${sec.id === 'p_factor' ? 'pFactor' : 'Externalizing'} ;\n` +
                          `        hitop:meanScore "${sec.score}"^^xsd:decimal ;\n` +
                          `        hitop:elevationPercent "${sec.elevation}"^^xsd:integer\n` +
                          `    ]${i === hitopReport.secondary.length - 1 ? ' .' : ' ;'}\n`;
            });
        }

        setRdfTurtle(turtle);
        showToast("Patient record successfully serialized to RDF/Turtle format.", "success");
    };
    
    const handleExecuteSPARQL = () => {
        setTimeout(() => {
            if (sparqlQuery.toLowerCase().includes('select')) {
                if (sparqlQuery.toLowerCase().includes('rdoc') || sparqlQuery.toLowerCase().includes('construct')) {
                    setSparqlResult({
                        headers: ["patientName", "constructLabel", "score"],
                        rows: [
                            [activePatient.name, "Loss", "70"],
                            [activePatient.name, "Reward Responsiveness", "65"]
                        ]
                    });
                } else if (sparqlQuery.toLowerCase().includes('hitop') || sparqlQuery.toLowerCase().includes('spectrum')) {
                    setSparqlResult({
                        headers: ["patientName", "spectrumName", "score", "elevationPercent"],
                        rows: [
                            [activePatient.name, "Internalizing", "3.42", "81%"],
                            [activePatient.name, "Somatoform", "2.88", "63%"]
                        ]
                    });
                } else {
                    setSparqlResult({
                        headers: ["patientName", "disorderLabel"],
                        rows: [
                            [activePatient.name, activePatient.specialty || "Major Depressive Disorder"]
                        ]
                    });
                }
                showToast("SPARQL query executed on clinical triples store.", "success");
            } else {
                setSparqlResult({
                    headers: ["Subject", "Predicate", "Object"],
                    rows: [
                        [`http://psypyrus.ai/ontology#patient_${activePatient.id}`, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", "http://psypyrus.ai/ontology#Patient"],
                        [`http://psypyrus.ai/ontology#patient_${activePatient.id}`, "http://psypyrus.ai/ontology#hasName", `"${activePatient.name}"`]
                    ]
                });
                showToast("Executed SPARQL DESCRIBE query successfully.", "success");
            }
        }, 800);
    };
    
    // Jitsi Meet Video Session
    const handleStartJitsi = () => {
        setJitsiMeetingStarted(true);
        Database.logAudit("Jitsi Telehealth Session Started", `Room set to '${jitsiRoom}'`);
        showToast(`Telehealth room '${jitsiRoom}' active. Loading WebRTC session.`, "success");
    };
    
    const handleStopJitsi = () => {
        setJitsiMeetingStarted(false);
        Database.logAudit("Jitsi Telehealth Session Closed", `Room closed: '${jitsiRoom}'`);
        showToast("Jitsi meeting ended. Telehealth portal reset.", "info");
    };
    
    // Cal.com simulation
    const handleCalWebhookTest = () => {
        const mockWebhookPayload = {
            event: "BOOKING_CREATED",
            payload: {
                bookingId: Math.floor(Math.random() * 90000) + 10000,
                startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
                endTime: new Date(Date.now() + 86400000 * 2 + 1800000).toISOString(),
                title: `Therapy Consultation with ${activePatient.name}`,
                description: "Cal.com automatic scheduling event",
                attendees: [
                    { name: activePatient.name, email: activePatient.email || "patient@health.me" }
                ],
                organizer: { name: "Dr. Liam Carter", email: "dr-liam-carter@psypyrus.ai" }
            }
        };
        
        // Add to webhook log
        setWebhookLog(prev => [`[${new Date().toLocaleTimeString()}] RECEIVED Cal.com Webhook: BOOKING_CREATED`, ...prev]);
        
        // Insert into database
        const randomNum = Math.floor(Math.random() * 900) + 100;
        const cleanTime = new Date(mockWebhookPayload.payload.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        Database.insertAppointment({
            patientId: activePatient.id,
            patientName: activePatient.name,
            dateTime: cleanTime,
            notes: "Cal.com Scheduler Webhook Integration. Evaluated slots dynamically.",
            fee: 150.0,
            isVideo: true
        });
        
        showToast(`Webhook simulated! Scheduled appointment for ${activePatient.name} via Cal.com.`, "success");
    };
    
    // Form.io Action
    const handleFormioSubmit = (e) => {
        e.preventDefault();
        setFormioSubmittedData(formioAnswers);
        
        // Push as Intake Form
        Database.insertIntakeForm({
            patientId: activePatient.id,
            formTitle: "Dynamic Intake (Form.io)",
            formData: formioAnswers
        });
        
        showToast("Form.io answers compiled and recorded in patient's chart.", "success");
    };
    
    // LangChain Simulation
    const handleRunChain = () => {
        setIsRunningChain(true);
        const logs = [];
        const t = () => new Date().toLocaleTimeString();
        
        logs.push(`[${t()}] > Entering LangChain prompt execution loop...`);
        logs.push(`[${t()}] > Initializing model with system instructions...`);
        
        setTimeout(() => {
            logs.push(`[${t()}] > Running PromptTemplate formatting...`);
            logs.push(`[${t()}] > Variables injected. Prompt token count: ~84 tokens.`);
        }, 500);
        
        setTimeout(() => {
            if (lcChainType === 'guardrail') {
                logs.push(`[${t()}] > SafetyGuardrail: scanning outputs for crisis parameters...`);
                logs.push(`[${t()}] > Flag checked: safe to proceed.`);
            } else if (lcChainType === 'clinical_agent') {
                logs.push(`[${t()}] > ClinicalAgent: invoking external scientific tools...`);
                logs.push(`[${t()}] > Tool response: ClinicalTrials database resolved 4 candidates.`);
            } else {
                logs.push(`[${t()}] > Invoking LLM model API: gemini-3.5-flash`);
            }
        }, 1200);
        
        setTimeout(() => {
            setIsRunningChain(false);
            setLcTraceLog(logs);
            if (lcChainType === 'soap_note') {
                setChainOutput(`### SOAP NOTES (LANGCHAIN OUTPUT)
**SUBJECTIVE**: Patient reports depressed mood lasting 2 weeks. COMPLETE ANHEDONIA present. GAD-7 is within normal parameters.
**OBJECTIVE**: PHQ-9 test recorded 16 (Moderately Severe).
**ASSESSMENT**: Probable MDD candidate. GAD-7 rules out severe generalized anxiety indicators.
**PLAN**: Begin CBT Cognitive journaling protocols.`);
            } else if (lcChainType === 'guardrail') {
                setChainOutput(`SAFE [No crisis indicator detected. Proceed to counselor dashboard.]`);
            } else {
                setChainOutput(`### CLINICAL AGENT DECISION SCHEME
* Step 1: Query Trials Database -> Found recruiting trial for MDD: "Efficacy of CBT vs Somatic Therapy".
* Step 2: Formulate Recommendation -> Suggest patient referral for study ID NCT0481232.`);
            }
            showToast("LangChain sequence output retrieved.", "success");
        }, 2200);
    };
    
    // LlamaIndex simulation
    const handleLlamaIngest = () => {
        setIsIngestingLlama(true);
        setTimeout(() => {
            setIsIngestingLlama(false);
            setLlamaIndexStatus("Index Loaded (18 Document Nodes Active)");
            setLlamaNodes([
                { id: "node-0", text: "MDD Criteria: Depressed mood or loss of interest/pleasure for at least 2 weeks...", score: 1.0 },
                { id: "node-1", text: "Exclusions: The symptoms must not be attributable to physiological effects of a substance...", score: 0.94 },
                { id: "node-2", text: "Specifiers: Mild, Moderate, Severe, With psychotic features, In partial remission...", score: 0.82 },
                { id: "node-3", text: "HiTOP System Manual: Empirical taxonomy replacing categories with dimensions (internalizing, externalizing, thought disorder)...", score: 0.75 }
            ]);
            showToast("Ingested Clinical Manual guidelines (DSM-5 & HiTOP). Vectors stored in client cache.", "success");
        }, 1500);
    };
    
    const handleLlamaQuery = () => {
        if (llamaIndexStatus.includes("Ingestion required")) {
            showToast("Must ingest guidelines documents first.", "warning");
            return;
        }
        setIsQueryingLlama(true);
        setTimeout(() => {
            setIsQueryingLlama(false);
            if (llamaQuery.toLowerCase().includes('hitop') || llamaQuery.toLowerCase().includes('spectrum') || llamaQuery.toLowerCase().includes('hierarchical')) {
                setLlamaResponse(`### LLAMAINDEX RAG RESPONSE (HiTOP Taxonomy Document)
According to the HiTOP (Hierarchical Taxonomy of Psychopathology) Clinical Manual:
1. Internalizing Spectrum (Node 4): Marked by distress, fear, and somatic symptoms. Strongly linked to MDD and GAD.
2. Disinhibited Externalizing (Node 5): Characterized by impulsivity, substance use, and anti-social tendencies.
3. Thought Disorder (Node 6): Characterized by reality distortion, odd beliefs, and hallucinations.
4. Detachment (Node 7): Characterized by coldness, social withdrawal, and anhedonia.
5. Somatoform (Node 8): Characterized by unexplained bodily complaints.
6. Antagonistic Externalizing (Node 9): Characterized by manipulativeness and grandiosity.`);
            } else {
                setLlamaResponse(`### LLAMAINDEX RAG RESPONSE
According to DSM-5-TR guidelines (Node 1), Major Depressive Disorder cannot be diagnosed if:
1. The symptoms are attributable to the physiological effects of a substance (e.g., drug abuse or medication) or another general medical condition (e.g., hypothyroidism).
2. The symptoms are better explained by Schizoaffective Disorder, Schizophrenia, Schizophreniform Disorder, Delusional Disorder, or other specified/unspecified schizophrenia spectrum disorders.
3. There has never been a Manic Episode or a Hypomanic Episode (unless substance-induced or caused by physiological effects).`);
            }
            showToast("LlamaIndex semantic context retrieved.", "success");
        }, 1200);
    };
    
    return (
        <div className="screen-container active" id="screen-integration-hub" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{`
                .hub-nav-row {
                    display: flex;
                    gap: 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    padding-bottom: 12px;
                    overflow-x: auto;
                }
                .hub-tab-btn {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.08);
                    color: var(--text-muted);
                    font-size: 12px;
                    font-weight: 600;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }
                .hub-tab-btn:hover {
                    color: var(--text-light);
                    border-color: rgba(255,255,255,0.2);
                    background: rgba(255,255,255,0.02);
                }
                .hub-tab-btn.active {
                    color: var(--color-primary);
                    border-color: var(--color-primary);
                    background: var(--color-primary-glow);
                }
                .log-console-box {
                    font-family: 'Geist Mono', Courier, monospace;
                    background: #09090b;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 8px;
                    color: #10b981;
                    padding: 14px;
                    font-size: 11px;
                    line-height: 1.5;
                    overflow-y: auto;
                    max-height: 200px;
                }
                .node-graph-svg {
                    border: 1px solid rgba(255,255,255,0.05);
                    background: radial-gradient(circle, #18181b 0%, #09090b 100%);
                    border-radius: 8px;
                }
                .query-result-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    font-size: 12px;
                }
                .query-result-table th, .query-result-table td {
                    border: 1px solid rgba(255,255,255,0.06);
                    padding: 8px 12px;
                    text-align: left;
                }
                .query-result-table th {
                    background: rgba(255,255,255,0.02);
                    color: var(--color-primary);
                }
                .jitsi-iframe-container {
                    width: 100%;
                    height: 500px;
                    background: #000;
                    border-radius: 12px;
                    border: 2px solid var(--color-primary);
                    box-shadow: 0 0 20px var(--color-primary-glow);
                    overflow: hidden;
                    position: relative;
                }
            `}</style>

            <div className="section-header-block">
                <i className="fa-solid fa-circle-nodes" style={{ color: 'var(--color-primary)' }}></i>
                <h2>Enterprise Services Integration Hub</h2>
            </div>

            {/* Hub Tab Navigation */}
            <div className="hub-nav-row">
                <button className={`hub-tab-btn ${activeTab === 'clinical' ? 'active' : ''}`} onClick={() => setActiveTab('clinical')}>
                    <i className="fa-solid fa-hospital" style={{ marginRight: '6px' }}></i> Clinical Registries & FHIR
                </button>
                <button className={`hub-tab-btn ${activeTab === 'abdm' ? 'active' : ''}`} onClick={() => setActiveTab('abdm')}>
                    <i className="fa-solid fa-address-card" style={{ marginRight: '6px' }}></i> ABDM Sandbox
                </button>
                <button className={`hub-tab-btn ${activeTab === 'identity' ? 'active' : ''}`} onClick={() => setActiveTab('identity')}>
                    <i className="fa-solid fa-key" style={{ marginRight: '6px' }}></i> Keycloak SSO Auth
                </button>
                <button className={`hub-tab-btn ${activeTab === 'graphs' ? 'active' : ''}`} onClick={() => setActiveTab('graphs')}>
                    <i className="fa-solid fa-diagram-project" style={{ marginRight: '6px' }}></i> Semantic Graph DBs
                </button>
                <button className={`hub-tab-btn ${activeTab === 'telehealth' ? 'active' : ''}`} onClick={() => setActiveTab('telehealth')}>
                    <i className="fa-solid fa-video" style={{ marginRight: '6px' }}></i> Telehealth & Scheduling
                </button>
                <button className={`hub-tab-btn ${activeTab === 'forms' ? 'active' : ''}`} onClick={() => setActiveTab('forms')}>
                    <i className="fa-solid fa-file-invoice" style={{ marginRight: '6px' }}></i> Form.io intake
                </button>
                <button className={`hub-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                    <i className="fa-solid fa-chart-line" style={{ marginRight: '6px' }}></i> Metabase BI
                </button>
                <button className={`hub-tab-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
                    <i className="fa-solid fa-robot" style={{ marginRight: '6px' }}></i> AI & RAG Orchestration
                </button>
                <button className={`hub-tab-btn ${activeTab === 'registry' ? 'active' : ''}`} onClick={() => setActiveTab('registry')}>
                    <i className="fa-solid fa-cubes" style={{ marginRight: '6px' }}></i> Design System Registry
                </button>
                <button className={`hub-tab-btn ${activeTab === 'architecture' ? 'active' : ''}`} onClick={() => setActiveTab('architecture')}>
                    <i className="fa-solid fa-network-wired" style={{ marginRight: '6px' }}></i> Distributed Systems & DB
                </button>
            </div>

            {/* Active Patient Bar */}
            <div className="workspace-card" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sync Patient Context:</span>
                    <strong style={{ color: 'var(--color-primary)' }}>{activePatient ? activePatient.name : 'No patient selected'}</strong>
                    <span className="marketplace-tag" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '10px' }}>ID: {activePatient?.id}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {patients.map(p => (
                        <button 
                            key={p.id} 
                            onClick={() => onSetActivePatientId(p.id)}
                            style={{ 
                                padding: '4px 10px', 
                                fontSize: '11px', 
                                border: '1px solid',
                                borderColor: activePatientId === p.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                                background: activePatientId === p.id ? 'var(--color-primary-glow)' : 'transparent',
                                color: activePatientId === p.id ? 'var(--color-primary)' : 'var(--text-normal)',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            {p.name.split(' ')[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB CONTENT: CLINICAL REGISTRIES & FHIR */}
            {activeTab === 'clinical' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        
                        {/* OpenEMR / Bahmni Adapter */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <h3 style={{ margin: 0, fontSize: '14px' }}><i className="fa-solid fa-server" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> EMR Sync API Client</h3>
                                <select 
                                    value={emrType} 
                                    onChange={(e) => setEmrType(e.target.value)}
                                    className="input-text-field"
                                    style={{ width: '120px', padding: '4px 8px', fontSize: '11px', margin: 0 }}
                                >
                                    <option value="openemr">OpenEMR client</option>
                                    <option value="bahmni">Bahmni client</option>
                                </select>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FHIR/REST Base Endpoint:</label>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        value={emrConfig.endpoint}
                                        onChange={(e) => setEmrConfig({...emrConfig, endpoint: e.target.value})}
                                        style={{ fontSize: '11px', padding: '6px' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Client ID:</label>
                                        <input 
                                            type="text" 
                                            className="input-text-field" 
                                            value={emrConfig.clientId}
                                            style={{ fontSize: '11px', padding: '6px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Client Secret:</label>
                                        <input 
                                            type="password" 
                                            className="input-text-field" 
                                            value={emrConfig.clientSecret}
                                            style={{ fontSize: '11px', padding: '6px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                className="action-button-btn" 
                                style={{ width: '100%', marginBottom: '14px' }}
                                onClick={handleEmrSync}
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <>
                                        <span className="loader-dual-ring" style={{ width: '12px', height: '12px', marginRight: '6px' }}></span>
                                        Connecting to API & Syncing...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-arrows-rotate" style={{ marginRight: '6px' }}></i>
                                        Sync Charts to {emrType === 'openemr' ? 'OpenEMR' : 'Bahmni'}
                                    </>
                                )}
                            </button>
                            
                            <h4 style={{ fontSize: '11px', margin: '0 0 6px 0', color: 'var(--text-muted)' }}>Adapter Console Logs:</h4>
                            <div className="log-console-box" style={{ height: '120px' }}>
                                {emrLogs.length === 0 ? (
                                    <span style={{ color: 'var(--text-muted)' }}>Ready for clinical transaction.</span>
                                ) : (
                                    emrLogs.map((log, i) => <div key={i}>{log}</div>)
                                )}
                            </div>
                        </div>

                        {/* FHIR Questionnaire Mapper */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 14px 0', fontSize: '14px' }}><i className="fa-solid fa-file-code" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> FHIR Questionnaire Exporter & Parser</h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '14px' }}>
                                Map assessment data directly to FHIR standard resources. Generate a validated QuestionnaireResponse JSON or parse Questionnaire models into native forms.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                                <button className="action-button-btn secondary" style={{ flex: 1 }} onClick={handleExportFHIRQuestionnaireResponse}>
                                    <i className="fa-solid fa-file-export" style={{ marginRight: '6px' }}></i> Export Patient FHIR
                                </button>
                                <button className="action-button-btn secondary" style={{ flex: 1 }} onClick={handleRenderFHIRQuestionnaire}>
                                    <i className="fa-solid fa-folder-open" style={{ marginRight: '6px' }}></i> Compile pasted FHIR
                                </button>
                            </div>
                            
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Questionnaire JSON Schema:</label>
                            <textarea 
                                className="input-text-field"
                                value={pastedFHIRQuestionnaire}
                                onChange={(e) => setPastedFHIRQuestionnaire(e.target.value)}
                                style={{ height: '140px', fontFamily: 'monospace', fontSize: '10px' }}
                            ></textarea>
                        </div>
                    </div>

                    {/* NRCeS STANDARDS INTEGRATION REGISTRY */}
                    <div className="workspace-card" style={{ padding: '20px', border: '1px solid rgba(0, 242, 254, 0.15)', background: 'rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-hospital-user" style={{ color: 'var(--color-primary)' }}></i>
                            NRCeS National EHR Standards Registry (India)
                        </h3>
                        <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: '0 0 20px 0' }}>
                            Incorporate clinical vocabularies and telemedicine protocols notified by the Ministry of Health and Family Welfare (MoHFW), hosted by C-DAC Pune.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
                            
                            {/* Left Column: SNOMED CT and LOINC Registry */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                
                                {/* SNOMED CT Browser Widget */}
                                <div className="radio-options-card-group" style={{ padding: '14px', background: 'rgba(255,255,255,0.01)' }}>
                                    <div className="radio-group-title" style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                        <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--color-primary)' }}></i>
                                        SNOMED CT Concept Browser
                                    </div>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        placeholder="Search clinical terms (e.g. depression)..." 
                                        value={nrcSnomedQuery} 
                                        onChange={(e) => handleSnomedLookup(e.target.value)}
                                        style={{ fontSize: '11px', padding: '6px 10px', marginBottom: '10px' }}
                                    />
                                    
                                    <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {nrcSnomedResults.length === 0 ? (
                                            <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                                {nrcSnomedQuery ? 'No matching terminology concepts.' : 'Type to search standard SNOMED registry.'}
                                            </span>
                                        ) : (
                                            nrcSnomedResults.map(res => (
                                                <div 
                                                    key={res.code} 
                                                    style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center', 
                                                        padding: '6px 8px', 
                                                        background: 'rgba(255,255,255,0.02)', 
                                                        borderRadius: '4px',
                                                        border: '1px solid rgba(255,255,255,0.05)'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: '11px', color: '#fff', fontWeight: '500' }}>{res.display}</div>
                                                        <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{res.category}</div>
                                                    </div>
                                                    <span 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(res.code);
                                                            showToast(`Copied Concept ID: ${res.code}`, "success");
                                                        }}
                                                        style={{ fontSize: '10px', color: 'var(--color-primary)', fontFamily: 'monospace', cursor: 'pointer', background: 'rgba(0, 242, 254, 0.08)', padding: '2px 6px', borderRadius: '4px' }}
                                                        title="Click to Copy ID"
                                                    >
                                                        {res.code} <i className="fa-regular fa-copy" style={{ marginLeft: '2px', fontSize: '8px' }}></i>
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* LOINC Mapping Dashboard */}
                                <div className="radio-options-card-group" style={{ padding: '14px', background: 'rgba(255,255,255,0.01)' }}>
                                    <div className="radio-group-title" style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                        <i className="fa-solid fa-list-check" style={{ color: 'var(--color-primary)' }}></i>
                                        Assessment LOINC Mappings
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                                            <span style={{ color: 'var(--color-text-secondary)' }}>PHQ-9 Severity</span>
                                            <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>44261-6</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                                            <span style={{ color: 'var(--color-text-secondary)' }}>GAD-7 Severity</span>
                                            <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>70274-6</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px' }}>
                                            <span style={{ color: 'var(--color-text-secondary)' }}>Mental Status Exam (MSE)</span>
                                            <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>8684-3</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: openEHR Template Exporter Console */}
                            <div className="radio-options-card-group" style={{ padding: '14px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', justify: 'space-between' }}>
                                <div>
                                    <div className="radio-group-title" style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <i className="fa-solid fa-file-export" style={{ color: 'var(--color-primary)' }}></i>
                                        openEHR Archetype Composition Exporter
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                                        Export structured clinical templates modeled on the openEHR Archetype definition (conforming to NDHM/MoHFW guidelines). Generates compliant XML/JSON composition templates.
                                    </p>
                                    
                                    <button 
                                        className={`action-button-btn ${isOpenEhrExporting ? 'disabled' : ''}`}
                                        style={{ width: '100%', marginBottom: '14px', background: 'var(--color-primary)' }}
                                        onClick={handleExportOpenEhr}
                                        disabled={isOpenEhrExporting}
                                    >
                                        {isOpenEhrExporting ? (
                                            <>
                                                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                                                Compiling Archetype Composition...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-download" style={{ marginRight: '6px' }}></i>
                                                Compile & Export openEHR Template
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div>
                                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>openEHR Transaction Logs:</span>
                                    <div className="log-console-box" style={{ height: '110px', fontFamily: 'monospace', fontSize: '9.5px', padding: '8px', overflowY: 'auto' }}>
                                        {nrcOpenEhrLogs.length === 0 ? (
                                            <span style={{ color: 'var(--color-text-muted)' }}>Ready for openEHR export transaction.</span>
                                        ) : (
                                            nrcOpenEhrLogs.map((log, i) => <div key={i}>{log}</div>)
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RENDERED FHIR QUESTIONNAIRE FORM */}
                    {renderedFHIRQuestions.length > 0 && (
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-primary)' }}>Dynamically Rendered FHIR Form</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {renderedFHIRQuestions.map((item) => (
                                    <div key={item.linkId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{item.text}</label>
                                        {item.type === 'choice' && (
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                                {item.answerOption.map((opt) => (
                                                    <label key={opt.valueInteger} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}>
                                                        <input 
                                                            type="radio" 
                                                            name={`fhir_${item.linkId}`} 
                                                            value={opt.valueInteger}
                                                            checked={fhirAnswers[item.linkId] === opt.valueInteger}
                                                            onChange={() => setFhirAnswers({...fhirAnswers, [item.linkId]: opt.valueInteger})}
                                                            style={{ accentColor: 'var(--color-primary)' }}
                                                        />
                                                        <span>{opt.valueString}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button 
                                    className="action-button-btn" 
                                    style={{ marginTop: '10px', width: '200px' }}
                                    onClick={() => {
                                        showToast("Completed FHIR Form response stored locally.", "success");
                                    }}
                                >
                                    Submit FHIR Data
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: ABDM ECOSYSTEM */}
            {activeTab === 'abdm' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* ABDM CONFIGURATION & CONNECTIVITY GATEWAY */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-circle-nodes" style={{ color: '#10b981' }}></i>
                                ABDM Gateway Credentials (Sandbox)
                            </h3>
                            <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
                                Configure credentials to communicate with the National Health Authority (NHA) ABDM Sandbox gateway.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="form-field-group">
                                    <label className="form-label" style={{ fontSize: '11px' }}>ABDM Client ID</label>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        value={abdmConfig.clientId}
                                        onChange={(e) => setAbdmConfig({ ...abdmConfig, clientId: e.target.value })}
                                    />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label" style={{ fontSize: '11px' }}>Client Secret</label>
                                    <input 
                                        type="password" 
                                        className="input-text-field" 
                                        value={abdmConfig.clientSecret}
                                        onChange={(e) => setAbdmConfig({ ...abdmConfig, clientSecret: e.target.value })}
                                    />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label" style={{ fontSize: '11px' }}>ABDM Gateway Endpoint</label>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        value={abdmConfig.gatewayUrl}
                                        onChange={(e) => setAbdmConfig({ ...abdmConfig, gatewayUrl: e.target.value })}
                                    />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label" style={{ fontSize: '11px' }}>Consent Manager Endpoint</label>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        value={abdmConfig.cmUrl}
                                        onChange={(e) => setAbdmConfig({ ...abdmConfig, cmUrl: e.target.value })}
                                    />
                                </div>

                                <button 
                                    className={`action-button-btn ${isAbdmTesting ? 'disabled' : ''}`}
                                    style={{ background: '#10b981', marginTop: '10px' }}
                                    onClick={handleTestAbdmGateway}
                                    disabled={isAbdmTesting}
                                >
                                    {isAbdmTesting ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                                            Authenticating Gateway...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i>
                                            Verify & Authenticate Sandbox
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Gateway Logs */}
                            <div style={{ marginTop: '20px' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--color-text-primary)' }}>Gateway Connection Activity Logs:</h4>
                                <div style={{
                                    height: '140px',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    padding: '10px',
                                    fontFamily: 'monospace',
                                    fontSize: '11px',
                                    color: '#4ade80',
                                    overflowY: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.4'
                                }}>
                                    {abdmLogs.join('\n')}
                                </div>
                            </div>
                        </div>

                        {/* ABDM CONSENT MANAGER SIMULATOR (HIU/HIP) */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-lock-open" style={{ color: 'var(--color-primary)' }}></i>
                                Consent Manager Request Panel (HIU)
                            </h3>
                            <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
                                Request permission to pull clinical records from national health registries (e.g. eSanjeevani).
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '10px', marginBottom: '2px' }}>Selected Target Patient:</span>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: 'var(--color-text-primary)' }}>{activePatient ? activePatient.name : 'No Patient Selected'} {activePatient && `(ID: #${activePatient.id})`}</strong>
                                        {activePatient && activePatient.abhaNumber ? (
                                            <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 600 }}>
                                                <i className="fa-solid fa-circle-check"></i> {activePatient.abhaAddress}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--color-error)', fontSize: '11px', fontWeight: 600 }}>
                                                <i className="fa-solid fa-triangle-exclamation"></i> No ABHA Linked
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="form-field-group">
                                    <label className="form-label" style={{ fontSize: '11px' }}>Consent Access Purpose</label>
                                    <select 
                                        className="input-text-field"
                                        value={abdmPurpose}
                                        onChange={(e) => setAbdmPurpose(e.target.value)}
                                    >
                                        <option value="CAREMGT">CAREMGT - Care Management & Counseling</option>
                                        <option value="BTG">BTG - Break the Glass (Emergency Access)</option>
                                        <option value="PUBHEALTH">PUBHEALTH - Public Health Analytics</option>
                                    </select>
                                </div>

                                <div className="form-field-group">
                                    <label className="form-label" style={{ fontSize: '11px' }}>Data Types Requested</label>
                                    <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
                                        {['DiagnosticReport', 'Prescription', 'DischargeSummary'].map(type => (
                                            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox"
                                                    checked={abdmDataTypes.includes(type)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setAbdmDataTypes([...abdmDataTypes, type]);
                                                        } else {
                                                            setAbdmDataTypes(abdmDataTypes.filter(t => t !== type));
                                                        }
                                                    }}
                                                    style={{ accentColor: 'var(--color-primary)' }}
                                                />
                                                <span>{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-field-group">
                                    <label className="form-label" style={{ fontSize: '11px' }}>Consent Validity Duration</label>
                                    <select 
                                        className="input-text-field"
                                        value={abdmDuration}
                                        onChange={(e) => setAbdmDuration(e.target.value)}
                                    >
                                        <option value="1 Day">1 Day</option>
                                        <option value="1 Week">1 Week</option>
                                        <option value="1 Month">1 Month</option>
                                        <option value="1 Year">1 Year</option>
                                    </select>
                                </div>

                                <button 
                                    className={`action-button-btn ${(!activePatient || !activePatient.abhaNumber) ? 'disabled' : ''}`}
                                    style={{ marginTop: '6px' }}
                                    onClick={handleRaiseConsentRequest}
                                    disabled={!activePatient || !activePatient.abhaNumber}
                                >
                                    <i className="fa-solid fa-paper-plane" style={{ marginRight: '6px' }}></i>
                                    Raise Consent Access Request
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CONSENT REQUESTS LEDGER */}
                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                            National Consent Ledger Registry
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '10px' }}>Request ID</th>
                                        <th style={{ padding: '10px' }}>Patient</th>
                                        <th style={{ padding: '10px' }}>ABHA Address</th>
                                        <th style={{ padding: '10px' }}>Purpose</th>
                                        <th style={{ padding: '10px' }}>Data Types</th>
                                        <th style={{ padding: '10px' }}>Status</th>
                                        <th style={{ padding: '10px' }}>Date</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consentRequests.map(req => (
                                        <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>{req.id}</td>
                                            <td style={{ padding: '10px' }}>{req.patientName}</td>
                                            <td style={{ padding: '10px', fontFamily: 'monospace', color: 'var(--color-primary)' }}>{req.abhaAddress}</td>
                                            <td style={{ padding: '10px' }}>{req.purpose}</td>
                                            <td style={{ padding: '10px' }}>{req.dataTypes.join(', ')}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{
                                                    fontSize: '10px',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontWeight: 600,
                                                    background: req.status === 'GRANTED' ? 'rgba(16, 185, 129, 0.1)' : req.status === 'DENIED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: req.status === 'GRANTED' ? '#10b981' : req.status === 'DENIED' ? '#ef4444' : '#f59e0b'
                                                }}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px', color: 'var(--color-text-muted)' }}>{req.date}</td>
                                            <td style={{ padding: '10px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                {req.status === 'PENDING' && (
                                                    <button 
                                                        className="patient-filter-chip active"
                                                        onClick={() => setSelectedRequestForConsent(req)}
                                                        style={{ margin: 0, fontSize: '10.5px', background: 'var(--color-primary)' }}
                                                    >
                                                        Simulate Approval
                                                    </button>
                                                )}
                                                {req.status === 'GRANTED' && (
                                                    <button 
                                                        className="patient-filter-chip active"
                                                        onClick={() => handleFetchDecryptedRecords(req)}
                                                        style={{ margin: 0, fontSize: '10.5px', background: '#10b981' }}
                                                    >
                                                        Fetch Health Bundle
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* DECRYPTED RECORD TIMELINE VIEWER */}
                    {fetchedHealthRecords && (
                        <div className="workspace-card" style={{ padding: '20px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.01)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fa-solid fa-folder-open" style={{ color: '#10b981' }}></i>
                                    Decrypted Health Records Timeline: {fetchedHealthRecords.patientName} ({fetchedHealthRecords.abhaAddress})
                                </h3>
                                <button 
                                    className="preset-duration-btn"
                                    onClick={() => setFetchedHealthRecords(null)}
                                    style={{ fontSize: '10px', padding: '3px 8px' }}
                                >
                                    Clear View
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {fetchedHealthRecords.records.map((rec, idx) => (
                                    <div key={idx} style={{
                                        background: 'rgba(0,0,0,0.15)',
                                        borderLeft: '3px solid #10b981',
                                        borderRadius: '4px',
                                        padding: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>
                                                {rec.type}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                                                Date: {rec.date}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                                            <strong>{rec.source}</strong>
                                            {rec.doctor && <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>{rec.doctor}</span>}
                                        </div>
                                        <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.4' }}>
                                            {rec.notes || rec.details}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Simulated Patient Consent Approval Dialog Modal */}
            {selectedRequestForConsent && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="workspace-card" style={{
                        width: '100%',
                        maxWidth: '400px',
                        background: 'rgba(23, 28, 41, 0.96)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        padding: '20px',
                        margin: 0
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '22px',
                                margin: '0 auto 12px auto'
                            }}>
                                <i className="fa-solid fa-mobile-screen"></i>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-primary)' }}>Simulated Patient Consent Approval</h3>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>ABHA Consent Manager App (Sandbox Client)</span>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)' }}>Requester Clinic: </span>
                                <strong style={{ color: 'var(--color-text-primary)' }}>PsyPyrus AI Clinic</strong>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)' }}>Purpose: </span>
                                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedRequestForConsent.purpose}</strong>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)' }}>Requested Data: </span>
                                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedRequestForConsent.dataTypes.join(', ')}</strong>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)' }}>Linked ABHA: </span>
                                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedRequestForConsent.abhaAddress}</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                className="action-button-btn"
                                style={{ flex: 1, margin: 0, background: '#ef4444' }}
                                onClick={() => handleSimulatePatientResponse(selectedRequestForConsent.id, false)}
                            >
                                <i className="fa-solid fa-xmark" style={{ marginRight: '6px' }}></i>
                                Deny Request
                            </button>
                            <button 
                                className="action-button-btn"
                                style={{ flex: 1, margin: 0, background: '#10b981' }}
                                onClick={() => handleSimulatePatientResponse(selectedRequestForConsent.id, true)}
                            >
                                <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i>
                                Grant Consent
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: KEYCLOAK SSO AUTH */}
            {activeTab === 'identity' && (
                <div className="workspace-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px' }}><i className="fa-solid fa-key" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> Keycloak Access Gateway</h3>
                        <span className={`status-indicator ${kcStatus.toLowerCase()}`} style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            background: kcStatus === 'Connected' ? 'rgba(16, 185, 129, 0.1)' : (kcStatus === 'Connecting' ? 'rgba(245, 166, 35, 0.1)' : 'rgba(255,255,255,0.05)'),
                            color: kcStatus === 'Connected' ? 'var(--color-success)' : (kcStatus === 'Connecting' ? 'var(--color-warning)' : 'var(--text-muted)'),
                        }}>
                            {kcStatus}
                        </span>
                    </div>
                    
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '18px' }}>
                        Synchronize user directories and manage clinical permission sets. Maps Keycloak claims directly to dashboard configurations.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Keycloak Server Host URL:</label>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        value={kcConfig.url} 
                                        onChange={(e) => setKcConfig({...kcConfig, url: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Realm:</label>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        value={kcConfig.realm} 
                                        onChange={(e) => setKcConfig({...kcConfig, realm: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Client ID:</label>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        value={kcConfig.clientId} 
                                        onChange={(e) => setKcConfig({...kcConfig, clientId: e.target.value})}
                                    />
                                </div>
                                
                                {kcStatus !== 'Connected' ? (
                                    <button className="action-button-btn" onClick={handleKeycloakLogin} disabled={kcStatus === 'Connecting'}>
                                        {kcStatus === 'Connecting' ? 'Connecting...' : 'Connect SSO (Keycloak)'}
                                    </button>
                                ) : (
                                    <button className="action-button-btn danger" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'var(--color-error)', color: 'var(--color-error)' }} onClick={handleKeycloakDisconnect}>
                                        Disconnect / Logout
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Decoded JWT Active Claims Mapping:</label>
                            {kcToken ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold' }}>User: {kcToken.payload.name}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Email: {kcToken.payload.email}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Issuer: {kcToken.payload.iss}</div>
                                    </div>
                                    
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>Clinical Permissions Granted:</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                            {kcToken.payload.resource_access["psypyrus-web-client"].roles.map(r => (
                                                <span key={r} className="marketplace-tag" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                    {r}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        className="action-button-btn secondary mini-action-btn"
                                        onClick={() => setShowTokenPayload(!showTokenPayload)}
                                    >
                                        {showTokenPayload ? 'Hide Token Payload' : 'Show Token Payload'}
                                    </button>
                                    
                                    {showTokenPayload && (
                                        <pre style={{ fontFamily: 'monospace', fontSize: '9px', background: '#000', padding: '10px', borderRadius: '6px', overflowX: 'auto', maxHeight: '120px' }}>
                                            {JSON.stringify(kcToken, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ) : (
                                <div style={{ border: '1px dashed rgba(255,255,255,0.08)', padding: '30px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                                    No active Keycloak token mapped. Run SSO Login to authorize client access.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: SEMANTIC GRAPH DATABASES */}
            {activeTab === 'graphs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        
                        {/* Neo4j Sandbox */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 14px 0', fontSize: '14px' }}><i className="fa-solid fa-diagram-project" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> Neo4j Knowledge Graph Console</h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '14px' }}>
                                Maps patient nodes and comorbid links. Enter Cypher templates below to query the active clinical graph.
                            </p>
                            
                            <textarea 
                                className="input-text-field"
                                value={cypherQuery}
                                onChange={(e) => setCypherQuery(e.target.value)}
                                style={{ height: '80px', fontFamily: 'monospace', fontSize: '11px', marginBottom: '10px' }}
                            ></textarea>
                            
                            <button className="action-button-btn" onClick={handleExecuteCypher} disabled={isExecutingCypher} style={{ width: '100%' }}>
                                {isExecutingCypher ? 'Running Cypher...' : 'Run Cypher Query'}
                            </button>
                            
                            {cypherResult && (
                                <div style={{ marginTop: '14px' }}>
                                    <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Query Results Table:</h4>
                                    <div style={{ overflowX: 'auto', maxHeight: '120px' }}>
                                        <table className="query-result-table">
                                            <thead>
                                                <tr>
                                                    {cypherResult.headers.map(h => <th key={h}>{h}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cypherResult.rows.map((row, i) => (
                                                    <tr key={i}>
                                                        {row.map((cell, j) => <td key={j}>{cell}</td>)}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Apache Jena Semantic RDF Builder */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 14px 0', fontSize: '14px' }}><i className="fa-solid fa-circle-nodes" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> Apache Jena SPARQL Playground</h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '14px' }}>
                                Serialize records to RDF and test semantic query rules against SPARQL endpoints.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <button className="action-button-btn secondary" style={{ flex: 1 }} onClick={handleGenerateRDF}>
                                    Generate RDF (Turtle)
                                </button>
                                <button className="action-button-btn secondary" style={{ flex: 1 }} onClick={handleExecuteSPARQL}>
                                    Run SPARQL Query
                                </button>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RDF serialization (.ttl):</label>
                                    <textarea 
                                        className="input-text-field"
                                        value={rdfTurtle}
                                        readOnly
                                        placeholder="Generate Turtle schema serialization..."
                                        style={{ height: '120px', fontFamily: 'monospace', fontSize: '9px', background: '#000' }}
                                    ></textarea>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SPARQL Query Editor:</label>
                                    <textarea 
                                        className="input-text-field"
                                        value={sparqlQuery}
                                        onChange={(e) => setSparqlQuery(e.target.value)}
                                        style={{ height: '120px', fontFamily: 'monospace', fontSize: '9px' }}
                                    ></textarea>
                                </div>
                            </div>
                            
                            {sparqlResult && (
                                <div style={{ marginTop: '12px' }}>
                                    <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>SPARQL Query Output:</h4>
                                    <table className="query-result-table">
                                        <thead>
                                            <tr>
                                                {sparqlResult.headers.map(h => <th key={h}>{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sparqlResult.rows.map((row, i) => (
                                                <tr key={i}>
                                                    {row.map((cell, j) => <td key={j}>{cell}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* SVG GRAPH ONTOLOGY MAP */}
                    <div className="workspace-card" style={{ padding: '20px', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', textAlign: 'left', color: 'var(--color-primary)' }}>Visual Clinical Ontology Model Mapping</h4>
                        <svg className="node-graph-svg" width="100%" height="220">
                            <g transform="translate(400, 110)">
                                {/* Comorbidity links */}
                                <line x1="0" y1="0" x2="160" y2="-60" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,5" />
                                <line x1="0" y1="0" x2="-160" y2="40" stroke="#a855f7" strokeWidth="2" />
                                <line x1="-160" y1="40" x2="-260" y2="-40" stroke="#ef4444" strokeWidth="1.5" />
                                
                                {/* Center Patient Node */}
                                <circle cx="0" cy="0" r="30" fill="var(--color-primary-glow)" stroke="var(--color-primary)" strokeWidth="3" />
                                <text x="0" y="5" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">{activePatient?.name.split(' ')[0]}</text>
                                <text x="0" y="-36" fill="var(--text-muted)" fontSize="9" textAnchor="middle">Active Patient Node</text>
                                
                                {/* Disorder Node 1 */}
                                <circle cx="160" cy="-60" r="24" fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="2" />
                                <text x="160" y="-56" fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle">MDD</text>
                                <text x="210" y="-56" fill="var(--text-muted)" fontSize="8">DSM-5 296.22</text>
                                
                                {/* Disorder Node 2 */}
                                <circle cx="-160" cy="40" r="24" fill="rgba(168, 85, 247, 0.1)" stroke="#a855f7" strokeWidth="2" />
                                <text x="-160" y="44" fill="#a855f7" fontSize="9" fontWeight="bold" textAnchor="middle">GAD</text>
                                <text x="-210" y="44" fill="var(--text-muted)" fontSize="8">DSM-5 300.02</text>
                                
                                {/* Symptom Node */}
                                <circle cx="-260" cy="-40" r="20" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeWidth="1.5" />
                                <text x="-260" y="-36" fill="#ef4444" fontSize="8" textAnchor="middle">Anxiety</text>
                                
                                {/* Correlation labels */}
                                <rect x="50" y="-40" width="60" height="18" rx="4" fill="#18181b" stroke="rgba(255,255,255,0.06)" />
                                <text x="80" y="-28" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">Score: 18</text>
                            </g>
                        </svg>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: TELEHEALTH & SCHEDULING */}
            {activeTab === 'telehealth' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        
                        {/* Jitsi Meet Teletherapy Session */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 14px 0', fontSize: '14px' }}><i className="fa-solid fa-video" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> Jitsi Meet Video Session</h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '14px' }}>
                                Secure, end-to-end encrypted video bridge. Generates rooms dynamically matching specific patient files.
                            </p>
                            
                            <div className="form-field-group" style={{ marginBottom: '12px' }}>
                                <label className="form-label" style={{ fontSize: '11px' }}>Jitsi Conference Room Name:</label>
                                <input 
                                    type="text" 
                                    className="input-text-field"
                                    value={jitsiRoom}
                                    onChange={(e) => setJitsiRoom(e.target.value)}
                                    disabled={jitsiMeetingStarted}
                                />
                            </div>
                            
                            {!jitsiMeetingStarted ? (
                                <button className="action-button-btn" onClick={handleStartJitsi} style={{ width: '100%' }}>
                                    <i className="fa-solid fa-phone-flip" style={{ marginRight: '6px' }}></i> Start Live Telehealth Meeting
                                </button>
                            ) : (
                                <button className="action-button-btn danger" onClick={handleStopJitsi} style={{ width: '100%' }}>
                                    <i className="fa-solid fa-phone-slash" style={{ marginRight: '6px' }}></i> Stop Telehealth Session
                                </button>
                            )}
                        </div>

                        {/* Cal.com Scheduling Webhook */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 14px 0', fontSize: '14px' }}><i className="fa-solid fa-calendar-days" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> Cal.com / Cal.diy Scheduler</h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '14px' }}>
                                Sync availability maps. Simulates webhook triggers to schedule appointments dynamically into local storage.
                            </p>
                            
                            <div className="form-field-group" style={{ marginBottom: '12px' }}>
                                <label className="form-label" style={{ fontSize: '11px' }}>Cal.com Handle:</label>
                                <input 
                                    type="text" 
                                    className="input-text-field"
                                    value={calUsername}
                                    onChange={(e) => setCalUsername(e.target.value)}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <button className="action-button-btn secondary" style={{ flex: 1 }} onClick={() => setEmbedCalLoaded(!embedCalLoaded)}>
                                    {embedCalLoaded ? 'Hide Booking Widget' : 'Load Booking Widget'}
                                </button>
                                <button className="action-button-btn" style={{ flex: 1 }} onClick={handleCalWebhookTest}>
                                    Simulate Webhook Call
                                </button>
                            </div>
                            
                            <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Webhook Audit Tracker:</h4>
                            <div className="log-console-box" style={{ height: '100px' }}>
                                {webhookLog.length === 0 ? (
                                    <span style={{ color: 'var(--text-muted)' }}>Awaiting webhook payload trigger.</span>
                                ) : (
                                    webhookLog.map((log, idx) => <div key={idx}>{log}</div>)
                                )}
                            </div>
                        </div>
                    </div>

                    {/* LIVE JITSI VIDEO IFRAME */}
                    {jitsiMeetingStarted && (
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>Active WebRTC Iframe Bridge Container</h4>
                            <div className="jitsi-iframe-container">
                                <iframe 
                                    src={`https://meet.jit.si/${jitsiRoom}#config.prejoinPageEnabled=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`}
                                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    title="Jitsi Video meeting"
                                ></iframe>
                            </div>
                        </div>
                    )}
                    
                    {/* CAL.COM IFRAME EMBED */}
                    {embedCalLoaded && (
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>Embedded Cal.com Booking Interface</h4>
                            <div style={{ width: '100%', height: '500px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                                <iframe 
                                    src={`https://cal.com/${calUsername}`} 
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    title="Cal.com scheduling"
                                ></iframe>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: FORM.IO INTAKE */}
            {activeTab === 'forms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '20px' }}>
                        
                        {/* Schema designer */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 14px 0', fontSize: '14px' }}><i className="fa-solid fa-pen-to-square" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> Form.io Schema Designer</h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '12px' }}>
                                Custom layout JSON definition schema:
                            </p>
                            
                            <textarea 
                                className="input-text-field"
                                value={formioSchema}
                                onChange={(e) => setFormioSchema(e.target.value)}
                                style={{ height: '300px', fontFamily: 'monospace', fontSize: '11px', marginBottom: '14px' }}
                            ></textarea>
                            
                            <button 
                                className="action-button-btn" 
                                style={{ width: '100%' }}
                                onClick={() => {
                                    showToast("Form.io layout saved successfully.", "success");
                                }}
                            >
                                Save Template Schema
                            </button>
                        </div>

                        {/* Interactive renderer */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 14px 0', fontSize: '14px' }}><i className="fa-solid fa-laptop-code" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> Interactive Form.io Renderer</h3>
                            
                            <form onSubmit={handleFormioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {JSON.parse(formioSchema).components.map(comp => (
                                    <div key={comp.key} className="form-field-group">
                                        <label className="form-label" style={{ fontWeight: 'bold' }}>{comp.label}</label>
                                        
                                        {comp.type === 'textfield' && (
                                            <input 
                                                type="text" 
                                                className="input-text-field"
                                                placeholder={comp.placeholder}
                                                value={formioAnswers[comp.key] || ''}
                                                onChange={(e) => setFormioAnswers({...formioAnswers, [comp.key]: e.target.value})}
                                            />
                                        )}
                                        
                                        {comp.type === 'select' && (
                                            <select 
                                                className="input-text-field"
                                                value={formioAnswers[comp.key] || ''}
                                                onChange={(e) => setFormioAnswers({...formioAnswers, [comp.key]: e.target.value})}
                                            >
                                                <option value="">-- Choose Option --</option>
                                                {comp.data.values.map(val => (
                                                    <option key={val.value} value={val.value}>{val.label}</option>
                                                ))}
                                            </select>
                                        )}
                                        
                                        {comp.type === 'checkbox' && (
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>
                                                <input 
                                                    type="checkbox"
                                                    checked={formioAnswers[comp.key] || false}
                                                    onChange={(e) => setFormioAnswers({...formioAnswers, [comp.key]: e.target.checked})}
                                                    style={{ accentColor: 'var(--color-primary)' }}
                                                />
                                                <span>Check if active</span>
                                            </label>
                                        )}
                                    </div>
                                ))}
                                
                                <button type="submit" className="action-button-btn" style={{ width: '200px' }}>
                                    Submit Form
                                </button>
                            </form>
                            
                            {formioSubmittedData && (
                                <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                                    <h4 style={{ fontSize: '12px', color: '#10b981', margin: '0 0 6px 0' }}>Submitted Payload Schema (Form.io Format):</h4>
                                    <pre style={{ fontFamily: 'monospace', fontSize: '10px', background: '#000', padding: '10px', borderRadius: '6px', overflowX: 'auto' }}>
                                        {JSON.stringify(formioSubmittedData, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: METABASE BI ANALYTICS */}
            {activeTab === 'analytics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}><i className="fa-solid fa-chart-line" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> Metabase BI Embedded Dashboards</h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '14px' }}>
                            Displays clinic billing, patient outcomes, and therapist utilization graphs using secure JSON Web Tokens (JWT) parameters.
                        </p>
                        
                        {/* JWT mapping description */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '11px', color: 'var(--text-normal)' }}>
                            <strong>Secure Embedding URL Generation:</strong><br />
                            <code>METABASE_EMBED_URL = "http://localhost:3000/embed/dashboard/" + JWT_SIGN(payload, client_secret)</code>
                            <div style={{ marginTop: '6px', color: 'var(--text-muted)' }}>
                                Active Payload: <code>{`{ "resource": { "dashboard": 8 }, "params": { "practitioner_id": 1002 }, "exp": ${Math.floor(Date.now()/1000) + 3600} }`}</code>
                            </div>
                        </div>
                        
                        {/* Interactive analytical mocks */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '16px' }}>
                            <div className="workspace-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.01)' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Clinic Active Invoices</span>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 4px 0', color: 'var(--color-primary)' }}>$24,850.00</div>
                                <span style={{ fontSize: '10px', color: '#10b981' }}><i className="fa-solid fa-arrow-trend-up"></i> +12.4% vs last month</span>
                            </div>
                            
                            <div className="workspace-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.01)' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Therapist Session Hours (Weekly)</span>
                                <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '8px', marginTop: '10px' }}>
                                    {[20, 35, 45, 30, 48, 55, 40].map((h, i) => (
                                        <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--color-primary)', borderRadius: '2px' }} title={`Day ${i+1}: ${h} hours`}></div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="workspace-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.01)' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Patient Retention</span>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 4px 0', color: '#10b981' }}>94.2%</div>
                                <span style={{ fontSize: '10px', color: '#10b981' }}><i className="fa-solid fa-circle-check"></i> Standard Target Met</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: AI & RAG ORCHESTRATION */}
            {activeTab === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        
                        {/* LangChain */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 14px 0', fontSize: '14px' }}><i className="fa-solid fa-brain" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> LangChain Prompt Chains Playground</h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '14px' }}>
                                Run NLP chain sequences. Visualizes prompt template formatting and output parsing guardrails.
                            </p>
                            
                            <div className="form-field-group" style={{ marginBottom: '12px' }}>
                                <label className="form-label" style={{ fontSize: '11px' }}>Active Prompt Chain Node:</label>
                                <select 
                                    className="input-text-field"
                                    value={lcChainType}
                                    onChange={(e) => setLcChainType(e.target.value)}
                                >
                                    <option value="soap_note">SOAP Notes Extraction Chain</option>
                                    <option value="guardrail">Crisis Safeguards filter</option>
                                    <option value="clinical_agent">ClinicalTrials Research Agent</option>
                                </select>
                            </div>
                            
                            <textarea 
                                className="input-text-field"
                                value={lcPrompt}
                                onChange={(e) => setLcPrompt(e.target.value)}
                                style={{ height: '80px', fontSize: '11px', marginBottom: '12px' }}
                            ></textarea>
                            
                            <button className="action-button-btn" onClick={handleRunChain} disabled={isRunningChain} style={{ width: '100%', marginBottom: '14px' }}>
                                {isRunningChain ? 'Executing Chain...' : 'Execute LangChain Sequence'}
                            </button>
                            
                            <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>LangChain Trace Logs:</h4>
                            <div className="log-console-box" style={{ height: '110px', marginBottom: '10px' }}>
                                {lcTraceLog.length === 0 ? (
                                    <span style={{ color: 'var(--text-muted)' }}>Awaiting prompt execution loop.</span>
                                ) : (
                                    lcTraceLog.map((log, idx) => <div key={idx}>{log}</div>)
                                )}
                            </div>
                            
                            {chainOutput && (
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Chain Output Payload:</label>
                                    <pre style={{ fontFamily: 'monospace', fontSize: '10px', background: '#000', padding: '10px', borderRadius: '6px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        {chainOutput}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* LlamaIndex */}
                        <div className="workspace-card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 14px 0', fontSize: '14px' }}><i className="fa-solid fa-magnifying-glass-chart" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> LlamaIndex RAG Search</h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '14px' }}>
                                Ingest medical PDF criteria guidelines, chunk text, and perform vector searches to find matching nodes.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                                <button className="action-button-btn secondary" style={{ flex: 1 }} onClick={handleLlamaIngest} disabled={isIngestingLlama}>
                                    {isIngestingLlama ? 'Ingesting PDF...' : 'Ingest Clinical Manuals'}
                                </button>
                                <button className="action-button-btn" style={{ flex: 1 }} onClick={handleLlamaQuery} disabled={isQueryingLlama}>
                                    {isQueryingLlama ? 'Searching Index...' : 'Query Index'}
                                </button>
                            </div>
                            
                            <div className="form-field-group" style={{ marginBottom: '12px' }}>
                                <label className="form-label" style={{ fontSize: '11px' }}>RAG Semantic Query:</label>
                                <input 
                                    type="text" 
                                    className="input-text-field"
                                    value={llamaQuery}
                                    onChange={(e) => setLlamaQuery(e.target.value)}
                                    style={{ fontSize: '11px' }}
                                />
                            </div>
                            
                            <div style={{ fontSize: '11px', marginBottom: '12px' }}>
                                <span>Index Status: </span>
                                <strong style={{ color: llamaIndexStatus.includes('Ingestion required') ? 'var(--color-warning)' : '#10b981' }}>{llamaIndexStatus}</strong>
                            </div>
                            
                            {llamaNodes.length > 0 && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Retrieved Document Nodes:</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {llamaNodes.map(node => (
                                            <div key={node.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '4px', fontSize: '10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)' }}>
                                                    <strong>{node.id}</strong>
                                                    <span>Score: {node.score}</span>
                                                </div>
                                                <div style={{ color: 'var(--text-muted)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{node.text}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {llamaResponse && (
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Synthesized Response:</label>
                                    <pre style={{ fontFamily: 'monospace', fontSize: '10px', background: '#000', padding: '10px', borderRadius: '6px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'pre-wrap' }}>
                                        {llamaResponse}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* HAYSTACK PIPELINE VISUAL DESIGNER */}
                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <h4 style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--color-primary)' }}><i className="fa-solid fa-network-wired" style={{ marginRight: '6px' }}></i> Haystack Q&A Pipeline Designer</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {haystackPipelineNodes.map((node, index) => (
                                    <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ 
                                            background: 'rgba(255,255,255,0.02)', 
                                            border: '1px solid',
                                            borderColor: node.active ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                                            padding: '10px 14px', 
                                            borderRadius: '8px', 
                                            textAlign: 'center',
                                            minWidth: '130px'
                                        }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{node.name}</div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{node.type}</div>
                                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '9px', marginTop: '6px', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={node.active} 
                                                    onChange={() => {
                                                        const copy = [...haystackPipelineNodes];
                                                        copy[index].active = !copy[index].active;
                                                        setHaystackPipelineNodes(copy);
                                                    }}
                                                    style={{ accentColor: 'var(--color-primary)' }}
                                                />
                                                <span>Active</span>
                                            </label>
                                        </div>
                                        {index < haystackPipelineNodes.length - 1 && (
                                            <i className="fa-solid fa-arrow-right" style={{ color: 'var(--text-muted)' }}></i>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button 
                                    className="action-button-btn"
                                    onClick={() => {
                                        const activeNodes = haystackPipelineNodes.filter(n => n.active).map(n => n.name).join(' -> ');
                                        setHaystackOutputLog(`[INFO] Initialized Haystack graph sequence: ${activeNodes}\n[INFO] Validating node compatibility...\n[SUCCESS] Pipeline successfully compiled and tested.`);
                                        showToast("Haystack pipeline successfully design checked.", "success");
                                    }}
                                >
                                    Compile Pipeline
                                </button>
                                <pre style={{ fontFamily: 'monospace', fontSize: '8px', background: '#000', padding: '8px', borderRadius: '6px', height: '65px', overflowY: 'auto', margin: 0 }}>
                                    {haystackOutputLog || 'No pipeline output logged yet.'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: DESIGN SYSTEM REGISTRY */}
            {activeTab === 'registry' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '20px' }}>
                        {/* Component Showcase Card */}
                        <div className="workspace-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '14px' }}>
                                    <i className="fa-solid fa-swatchbook" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> Component Showcase
                                </h3>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {['glass-card', 'action-btn', 'search-input', 'stepper'].map(comp => (
                                        <button
                                            key={comp}
                                            onClick={() => setSelectedComp(comp)}
                                            style={{
                                                padding: '4px 10px',
                                                fontSize: '11px',
                                                borderRadius: '6px',
                                                border: '1px solid',
                                                borderColor: selectedComp === comp ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                                                background: selectedComp === comp ? 'var(--color-primary-glow)' : 'transparent',
                                                color: selectedComp === comp ? 'var(--color-primary)' : 'var(--text-normal)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {comp} {installedComponents.includes(comp) && '✓'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* View tabs: Preview or Source Code */}
                            <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                                <button
                                    onClick={() => setRegistryViewTab('preview')}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: registryViewTab === 'preview' ? 'var(--color-primary)' : 'var(--text-muted)',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        borderBottom: registryViewTab === 'preview' ? '2px solid var(--color-primary)' : 'none',
                                        paddingBottom: '4px'
                                    }}
                                >
                                    Interactive Preview
                                </button>
                                <button
                                    onClick={() => setRegistryViewTab('code')}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: registryViewTab === 'code' ? 'var(--color-primary)' : 'var(--text-muted)',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        borderBottom: registryViewTab === 'code' ? '2px solid var(--color-primary)' : 'none',
                                        paddingBottom: '4px'
                                    }}
                                >
                                    React + Tailwind Code
                                </button>
                            </div>

                            {/* View Content area */}
                            {registryViewTab === 'preview' ? (
                                <div style={{
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    background: 'radial-gradient(circle, #18181b 0%, #09090b 100%)',
                                    padding: '40px 20px',
                                    minHeight: '220px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative'
                                }}>
                                    {selectedComp === 'glass-card' && (
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            backdropFilter: 'blur(12px)',
                                            WebkitBackdropFilter: 'blur(12px)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            width: '100%',
                                            maxWidth: '320px',
                                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                                <div style={{
                                                    background: 'var(--color-primary-glow)',
                                                    color: 'var(--color-primary)',
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <i className="fa-solid fa-shield-halved"></i>
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '13px', color: '#fff' }}>Watermelon Glass</h4>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Premium Registry Block</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '11px', color: 'var(--text-normal)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                                                A modern card featuring smooth glassmorphism with high-fidelity border glow. Fully responsive and customizable.
                                            </p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '10px', color: 'var(--color-primary)' }}>Status: Active</span>
                                                <button style={{
                                                    background: 'var(--color-primary)',
                                                    color: '#000',
                                                    border: 'none',
                                                    padding: '4px 10px',
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer'
                                                }}>Explore</button>
                                            </div>
                                        </div>
                                    )}

                                    {selectedComp === 'action-btn' && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                showToast("Action Button clicked! Micro-interaction animated.", "success");
                                                setBtnClickCount(prev => prev + 1);
                                            }}
                                            style={{
                                                background: 'linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%)',
                                                color: '#000',
                                                border: 'none',
                                                padding: '12px 24px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: '0 4px 14px 0 rgba(168, 85, 247, 0.4)'
                                            }}
                                        >
                                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                                            <span>Animate Tap ({btnClickCount})</span>
                                        </motion.button>
                                    )}

                                    {selectedComp === 'search-input' && (
                                        <div style={{ width: '100%', maxWidth: '300px' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                padding: '8px 12px',
                                                background: 'rgba(0,0,0,0.2)'
                                            }}>
                                                <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
                                                <input
                                                    type="text"
                                                    placeholder="Search components..."
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        outline: 'none',
                                                        color: '#fff',
                                                        fontSize: '11px',
                                                        width: '100%'
                                                    }}
                                                    readOnly
                                                />
                                                <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.08)', padding: '2px 4px', borderRadius: '4px', color: 'var(--text-muted)' }}>⌘K</span>
                                            </div>
                                        </div>
                                    )}

                                    {selectedComp === 'stepper' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {[1, 2, 3].map(step => (
                                                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <motion.div
                                                        initial={{ scale: 0.8 }}
                                                        animate={{ scale: 1 }}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '50%',
                                                            background: step <= activeStep ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                                            color: step <= activeStep ? '#000' : 'var(--text-muted)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '10px',
                                                            fontWeight: 'bold',
                                                            border: step <= activeStep ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => setActiveStep(step)}
                                                    >
                                                        {step}
                                                    </motion.div>
                                                    {step < 3 && (
                                                        <div style={{
                                                            width: '40px',
                                                            height: '2px',
                                                            background: step < activeStep ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)'
                                                        }}></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <pre style={{
                                        fontFamily: 'monospace',
                                        fontSize: '10px',
                                        background: '#000',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        maxHeight: '240px',
                                        overflow: 'auto',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        color: '#38bdf8',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {selectedComp === 'glass-card' && (
`// Glassmorphic Card inspired by Watermelon UI & 21st.dev
import React from 'react';

export function GlassCard({ title, subtitle, content }) {
  return (
    <div className="bg-white/3 backdrop-blur-md border border-white/8 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:border-primary/45 hover:shadow-primary/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/20 text-primary w-9 h-9 rounded-full flex items-center justify-center">
          <ShieldIcon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold m-0">{title}</h4>
          <span className="text-slate-400 text-xs">{subtitle}</span>
        </div>
      </div>
      <p className="text-slate-300 text-xs mb-4 leading-relaxed">{content}</p>
    </div>
  );
}`
                                        )}
                                        {selectedComp === 'action-btn' && (
`// Animated Action Button inspired by Cult UI
import React from 'react';
import { motion } from 'framer-motion';

export function ActionButton({ label, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(var(--primary-glow))' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="bg-gradient-to-r from-primary to-purple-500 text-black border-none px-6 py-3 rounded-lg text-sm font-bold shadow-lg transition-colors flex items-center gap-2"
    >
      <span>{label}</span>
    </motion.button>
  );
}`
                                        )}
                                        {selectedComp === 'search-input' && (
`// Sleek Search Input inspired by shadcn/ui
import React from 'react';

export function SearchInput({ value, onChange }) {
  return (
    <div className="relative flex items-center border border-white/10 rounded-lg px-3 py-2 bg-black/20 focus-within:border-primary/50 transition-all">
      <SearchIcon className="text-slate-400 w-4 h-4 mr-2" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Search components..."
        className="bg-transparent border-none outline-none text-white text-xs w-full"
      />
      <kbd className="text-[10px] bg-white/8 text-slate-400 px-1 rounded font-mono">⌘K</kbd>
    </div>
  );
}`
                                        )}
                                        {selectedComp === 'stepper' && (
`// Framer Motion Stepper inspired by 21st.dev
import React from 'react';
import { motion } from 'framer-motion';

export function Stepper({ steps, activeStep }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <motion.div
            animate={{ scale: idx <= activeStep ? 1 : 0.8 }}
            className={\`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold \${
              idx <= activeStep ? 'bg-primary text-black' : 'bg-white/5 text-slate-400 border border-white/10'
            }\`}
          >
            {step}
          </motion.div>
          {idx < steps.length - 1 && (
            <div className={\`w-10 h-0.5 \${idx < activeStep ? 'bg-primary' : 'bg-white/10'}\`} />
          )}
        </div>
      ))}
    </div>
  );
}`
                                        )}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* CLI Simulated Terminal */}
                        <div className="workspace-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <h3 style={{ margin: 0, fontSize: '14px' }}>
                                <i className="fa-solid fa-terminal" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> Simulated CLI Installer
                            </h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                Install components directly using our mock CLI. Type `npx psypyrus-ui add [component-name]` to add components to your workspace.
                            </p>

                            <div style={{
                                flex: 1,
                                minHeight: '180px',
                                background: '#09090b',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '8px',
                                padding: '12px',
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                color: '#22c55e',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }} ref={cliConsoleRef}>
                                {cliLogs.map((log, idx) => (
                                    <div key={idx} style={{
                                        color: log.startsWith('Error') ? 'var(--color-error)' : (log.startsWith('✔') ? '#22c55e' : (log.startsWith('$') ? '#38bdf8' : '#e2e8f0'))
                                    }}>{log}</div>
                                ))}
                            </div>

                            <form onSubmit={handleCliSubmit} style={{ display: 'flex', gap: '8px', margin: 0 }}>
                                <input
                                    type="text"
                                    className="input-text-field"
                                    value={cliInput}
                                    onChange={(e) => setCliInput(e.target.value)}
                                    placeholder="npx psypyrus-ui add glass-card..."
                                    style={{
                                        fontFamily: 'monospace',
                                        fontSize: '11px',
                                        margin: 0,
                                        flex: 1
                                    }}
                                />
                                <button type="submit" className="action-button-btn" style={{ margin: 0, padding: '0 16px' }}>
                                    Run
                                </button>
                            </form>

                            {/* Installed components manifest list */}
                            <div style={{ marginTop: '10px' }}>
                                <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Installed Components Manifest:</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {installedComponents.length === 0 ? (
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No registry components installed in workspace.</span>
                                    ) : (
                                        installedComponents.map(comp => (
                                            <span
                                                key={comp}
                                                className="marketplace-tag"
                                                style={{
                                                    background: 'rgba(34, 197, 94, 0.1)',
                                                    color: '#22c55e',
                                                    border: '1px solid rgba(34, 197, 94, 0.2)',
                                                    fontSize: '9px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <i className="fa-solid fa-circle-check"></i> {comp}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: DISTRIBUTED SYSTEMS & DATABASE OPERATIONS */}
            {activeTab === 'architecture' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <style>{`
                        .arch-sub-nav {
                            display: flex;
                            gap: 10px;
                            margin-bottom: 10px;
                            border-bottom: 1px solid rgba(255,255,255,0.06);
                            padding-bottom: 10px;
                        }
                        .arch-sub-btn {
                            background: rgba(255, 255, 255, 0.02);
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            color: var(--text-muted);
                            padding: 6px 12px;
                            border-radius: 6px;
                            font-size: 11px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        }
                        .arch-sub-btn:hover {
                            color: var(--text-light);
                            background: rgba(255, 255, 255, 0.04);
                        }
                        .arch-sub-btn.active {
                            background: var(--color-primary-glow);
                            border-color: var(--color-primary);
                            color: var(--color-primary);
                        }
                        .metric-card {
                            background: rgba(255, 255, 255, 0.01);
                            border: 1px solid rgba(255,255,255,0.05);
                            border-radius: 8px;
                            padding: 12px;
                            display: flex;
                            flex-direction: column;
                            gap: 6px;
                        }
                        .metric-val {
                            font-size: 20px;
                            font-weight: 700;
                            color: #fff;
                        }
                        .metric-label {
                            font-size: 10px;
                            color: var(--text-muted);
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        .query-plan-box {
                            background: #09090b;
                            border: 1px solid rgba(255, 255, 255, 0.08);
                            border-radius: 6px;
                            padding: 10px;
                            font-family: 'Geist Mono', monospace;
                            font-size: 10px;
                            color: #38bdf8;
                            margin-top: 6px;
                        }
                        .con-slot {
                            width: 14px;
                            height: 14px;
                            border-radius: 50%;
                            display: inline-block;
                        }
                        .con-slot.active {
                            background: #10b981;
                            box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
                        }
                        .con-slot.idle {
                            background: rgba(255,255,255,0.1);
                        }
                    `}</style>

                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px' }}>
                                <i className="fa-solid fa-network-wired" style={{ color: 'var(--color-primary)', marginRight: '8px' }}></i>
                                Distributed Systems & Database Architecture Control Panel
                            </h3>
                            <div className="arch-sub-nav" style={{ margin: 0, padding: 0, border: 0 }}>
                                <button className={`arch-sub-btn ${activeArchitectureSubTab === 'db-ops' ? 'active' : ''}`} onClick={() => setActiveArchitectureSubTab('db-ops')}>
                                    <i className="fa-solid fa-database" style={{ marginRight: '6px' }}></i> DB Performance & Caching
                                </button>
                                <button className={`arch-sub-btn ${activeArchitectureSubTab === 'acid' ? 'active' : ''}`} onClick={() => setActiveArchitectureSubTab('acid')}>
                                    <i className="fa-solid fa-vault" style={{ marginRight: '6px' }}></i> ACID Transactions & Locks
                                </button>
                                <button className={`arch-sub-btn ${activeArchitectureSubTab === 'messaging' ? 'active' : ''}`} onClick={() => setActiveArchitectureSubTab('messaging')}>
                                    <i className="fa-solid fa-envelope-open-text" style={{ marginRight: '6px' }}></i> Message Queue & DLQ
                                </button>
                                <button className={`arch-sub-btn ${activeArchitectureSubTab === 'resilience' ? 'active' : ''}`} onClick={() => setActiveArchitectureSubTab('resilience')}>
                                    <i className="fa-solid fa-shield-halved" style={{ marginRight: '6px' }}></i> Resilience Patterns
                                </button>
                                <button className={`arch-sub-btn ${activeArchitectureSubTab === 'observability' ? 'active' : ''}`} onClick={() => setActiveArchitectureSubTab('observability')}>
                                    <i className="fa-solid fa-binoculars" style={{ marginRight: '6px' }}></i> Observability
                                </button>
                            </div>
                        </div>

                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 16px 0' }}>
                            Monitor and manage ACID database compliance, caching, rate limiting, and event queues integrated directly into the core patient and clinical charts services of the application.
                        </p>

                        {/* SUB-TAB: DB PERFORMANCE & CACHING */}
                        {activeArchitectureSubTab === 'db-ops' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
                                    
                                    {/* Caching Panel */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Cache-Aside Caching (Redis Emulation)</h4>
                                            <button className="action-button-btn secondary mini-action-btn" style={{ padding: '2px 8px', fontSize: '9px' }} onClick={() => {
                                                Database.clearCache();
                                                syncDbMetrics();
                                                showToast("In-memory cache evacuated.", "info");
                                            }}>
                                                Evict Cache
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                                                <div className="metric-val" style={{ color: '#10b981' }}>{dbCacheStats.hits}</div>
                                                <div className="metric-label">Hits</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                                                <div className="metric-val" style={{ color: '#f59e0b' }}>{dbCacheStats.misses}</div>
                                                <div className="metric-label">Misses</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                                                <div className="metric-val" style={{ color: '#ef4444' }}>{dbCacheStats.evictions}</div>
                                                <div className="metric-label">Evictions</div>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                            Hit Ratio: <strong>{((dbCacheStats.hits / (dbCacheStats.hits + dbCacheStats.misses || 1)) * 100).toFixed(1)}%</strong>
                                        </div>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                background: 'var(--color-primary)',
                                                width: `${(dbCacheStats.hits / (dbCacheStats.hits + dbCacheStats.misses || 1)) * 100}%`,
                                                transition: 'width 0.3s ease'
                                            }}></div>
                                        </div>
                                    </div>

                                    {/* Indexing and Explain Query Plan */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#fff' }}>Database Query Plan Explainer</h4>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                                            Indices provide O(1) lookups instead of scanning the full collection.
                                        </p>
                                        
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                            <button className="action-button-btn" style={{ flex: 1, fontSize: '11px' }} onClick={() => {
                                                Database.getClinicalNotes(1);
                                                syncDbMetrics();
                                            }}>
                                                Run Indexed Query (O(1))
                                            </button>
                                            <button className="action-button-btn secondary" style={{ flex: 1, fontSize: '11px' }} onClick={() => {
                                                Database.getClinicalNotes();
                                                syncDbMetrics();
                                            }}>
                                                Run Table Scan Query (O(N))
                                            </button>
                                        </div>

                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Query Execution Strategy & Explain Plan:</div>
                                        <div className="query-plan-box">
                                            <div>EXPLAIN ANALYZE SELECT * FROM clinical_notes WHERE patientId = {dbQueryPlan.query.includes('patientId') ? '1' : 'ALL'};</div>
                                            <div style={{ color: dbQueryPlan.strategy.includes('Table Scan') ? 'var(--color-warning)' : '#10b981', fontWeight: 'bold', marginTop: '6px' }}>
                                                ➔ Strategy: {dbQueryPlan.strategy}
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                                                ➔ Query: {dbQueryPlan.query || 'none'} | Cost/Latency: {dbQueryPlan.durationMs.toFixed(3)} ms
                                            </div>
                                        </div>

                                        {dbQueryPlan.strategy.includes('Table Scan') && (
                                            <div style={{
                                                marginTop: '10px',
                                                padding: '8px 12px',
                                                background: 'rgba(245, 158, 11, 0.05)',
                                                border: '1px solid rgba(245, 158, 11, 0.15)',
                                                borderRadius: '6px',
                                                fontSize: '10px',
                                                color: 'var(--color-warning)',
                                                display: 'flex',
                                                gap: '6px',
                                                alignItems: 'center'
                                            }}>
                                                <i className="fa-solid fa-triangle-exclamation"></i>
                                                <span><strong>Warning (N+1 Query Risk)</strong>: Table Scan scans every row! Add database indexes to avoid bottlenecks.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>
                                    {/* Connection Pooling */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Database Connection Pool Monitor (HikariCP Emulation)</h4>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Max Connections: 3</span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                                            Limits concurrent database slots to protect system resources. Excess queries queue up and wait.
                                        </p>

                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '14px' }}>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                {[1, 2, 3].map(slot => (
                                                    <span 
                                                        key={slot} 
                                                        className={`con-slot ${slot <= activeConnections ? 'active' : 'idle'}`}
                                                    ></span>
                                                ))}
                                                <span style={{ fontSize: '11px', color: '#fff', marginLeft: '6px' }}>
                                                    {activeConnections} / 3 Connections Active
                                                </span>
                                            </div>

                                            <button 
                                                className="action-button-btn" 
                                                onClick={simulateParallelQueries} 
                                                disabled={isSimulatingPool}
                                                style={{ padding: '6px 12px', fontSize: '11px', margin: 0 }}
                                            >
                                                {isSimulatingPool ? 'Simulating...' : 'Simulate 6 Parallel Queries'}
                                            </button>
                                        </div>

                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Connection Queue State:</div>
                                        <div style={{
                                            background: '#09090b',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            fontSize: '10px',
                                            fontFamily: 'monospace',
                                            minHeight: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: queuedPoolQueries.length > 0 ? 'var(--color-warning)' : 'var(--text-muted)'
                                        }}>
                                            {queuedPoolQueries.length > 0 ? (
                                                <span>Waiting Queries Queue: [{queuedPoolQueries.join(', ')}] (Blocked waiting for connection slot)</span>
                                            ) : (
                                                <span>Connection Pool Queue Empty. All queries executed immediately.</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rate Limiting */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#fff' }}>Token Bucket Write Rate Limiter</h4>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                                            Prevents database mutation floods. Consumes 1 token per write.
                                        </p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div>
                                                <div className="metric-label">Write Tokens Remaining</div>
                                                <div className="metric-val" style={{ color: dbRateLimitTokens > 3 ? '#10b981' : 'var(--color-error)' }}>
                                                    {dbRateLimitTokens} / 15
                                                </div>
                                            </div>
                                            <button className="action-button-btn" style={{ margin: 0, padding: '6px 12px', fontSize: '11px' }} onClick={() => {
                                                try {
                                                    Database.insertHomework({
                                                        patientId: 1,
                                                        description: "Spammed write task."
                                                    });
                                                    syncDbMetrics();
                                                } catch (e) {
                                                    showToast("Write Rejected: " + e.message, "error");
                                                }
                                            }}>
                                                Trigger Write
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SUB-TAB: ACID TRANSACTIONS & LOCKS */}
                        {activeArchitectureSubTab === 'acid' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
                                    {/* Ledger Balances */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#fff' }}>Atomic Ledger Balance States</h4>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Patient 1 Balance:</span>
                                                <strong style={{ fontSize: '12px', color: '#fff' }}>${patientLedger.p1}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Patient 2 Balance:</span>
                                                <strong style={{ fontSize: '12px', color: '#fff' }}>${patientLedger.p2}</strong>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button className="action-button-btn" style={{ fontSize: '11px' }} onClick={executeAcidTransaction}>
                                                Process Consultation Transfer ($100)
                                            </button>
                                            <button className="action-button-btn danger" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-error)', fontSize: '11px' }} onClick={executeTransactionRollback}>
                                                Process with Outage (Force Rollback)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Idempotency playground */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#fff' }}>Idempotency & Deduplication Playground</h4>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                                            Verify request deduplication on consultation payments.
                                        </p>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                            <div>
                                                <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Transaction Idempotency Key:</label>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                    <input 
                                                        type="text" 
                                                        className="input-text-field" 
                                                        value={idempotencyKeyInput} 
                                                        onChange={(e) => setIdempotencyKeyInput(e.target.value)}
                                                        style={{ fontSize: '10px', padding: '6px', margin: 0, fontFamily: 'monospace' }}
                                                    />
                                                    <button className="action-button-btn secondary" style={{ margin: 0, padding: '0 10px', fontSize: '10px' }} onClick={() => {
                                                        setIdempotencyKeyInput('pay-consultation-' + Math.random().toString(36).substr(2, 9));
                                                    }}>
                                                        Regen
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <button className="action-button-btn" style={{ fontSize: '11px' }} onClick={() => simulateIdempotentPayment(true)}>
                                                Submit Payment (Deduplicated)
                                            </button>
                                            <button className="action-button-btn secondary" style={{ fontSize: '11px' }} onClick={() => simulateIdempotentPayment(false)}>
                                                Submit (No Idempotency Key)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Transactions Log */}
                                <div className="metric-card" style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '12px', color: '#fff' }}>ACID Transactions & Locking Logs</h4>
                                        <button className="action-button-btn secondary mini-action-btn" style={{ padding: '2px 8px', fontSize: '9px' }} onClick={() => {
                                            Database.transactionLogs = [];
                                            syncDbMetrics();
                                        }}>
                                            Clear Logs
                                        </button>
                                    </div>
                                    <div className="log-console-box" style={{ height: '120px' }}>
                                        {dbTxLogs.length === 0 ? (
                                            <span style={{ color: 'var(--text-muted)' }}>Ready for transaction blocks.</span>
                                        ) : (
                                            dbTxLogs.map((log, idx) => (
                                                <div key={idx} style={{
                                                    color: log.includes('FAILED') ? 'var(--color-error)' : (log.includes('Deduplicated') ? 'var(--color-warning)' : '#10b981')
                                                }}>
                                                    {log}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SUB-TAB: MESSAGE QUEUE & DLQ */}
                        {activeArchitectureSubTab === 'messaging' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr', gap: '20px' }}>
                                    
                                    {/* Active queue monitor */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Message Broker Tasks Queue</h4>
                                            <button className="action-button-btn mini-action-btn" style={{ margin: 0, fontSize: '10px' }} onClick={() => {
                                                Database.enqueueTask('SYNC_EHR', { patientId: activePatientId || 1 });
                                            }}>
                                                Queue Sync Task
                                            </button>
                                        </div>
                                        
                                        <div className="log-console-box" style={{ height: '140px', background: '#09090b', color: '#38bdf8' }}>
                                            {dbQueue.length === 0 ? (
                                                <span style={{ color: 'var(--text-muted)' }}>Message Broker idle. No pending tasks.</span>
                                            ) : (
                                                dbQueue.map((task, idx) => (
                                                    <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px', marginBottom: '4px' }}>
                                                        <span>{idx + 1}. [{task.type}] Id: {task.id.substr(0, 12)}...</span>
                                                        <span style={{
                                                            color: task.status === 'processing' ? '#10b981' : 'var(--text-muted)'
                                                        }}>
                                                            {task.status} (Retries: {task.retries}/3)
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* DLQ Manager */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--color-error)' }}>
                                                <i className="fa-solid fa-skull-crossbones" style={{ marginRight: '6px' }}></i>
                                                Dead Letter Queue (DLQ)
                                            </h4>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="action-button-btn secondary mini-action-btn" style={{ fontSize: '9px', padding: '2px 8px' }} onClick={() => {
                                                    Database.retryDLQ();
                                                }} disabled={dbDLQ.length === 0}>
                                                    Republish DLQ
                                                </button>
                                                <button className="action-button-btn secondary mini-action-btn" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--color-error)', color: 'var(--color-error)' }} onClick={() => {
                                                    Database.purgeDLQ();
                                                }} disabled={dbDLQ.length === 0}>
                                                    Purge
                                                </button>
                                            </div>
                                        </div>

                                        <div className="log-console-box" style={{ height: '140px', background: '#0c0202', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--color-error)' }}>
                                            {dbDLQ.length === 0 ? (
                                                <span style={{ color: 'var(--text-muted)' }}>Dead Letter Queue empty. All sync events processed.</span>
                                            ) : (
                                                dbDLQ.map((task, idx) => (
                                                    <div key={task.id} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(239,68,68,0.1)', paddingBottom: '6px', marginBottom: '6px', fontSize: '9px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                            <span>{idx + 1}. [{task.type}] Id: {task.id.substr(0,12)}</span>
                                                            <span>STATUS: DEAD</span>
                                                        </div>
                                                        <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                                                            Error: {task.error}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Sync Failure Simulator Option */}
                                <div style={{
                                    padding: '12px 20px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <strong style={{ fontSize: '12px', color: '#fff' }}>Simulate Network Failure on EHR Servers</strong>
                                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                                            When enabled, background sync tasks will fail validation and fall back to the Dead Letter Queue.
                                        </p>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={dbForceSyncFail}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setDbForceSyncFail(checked);
                                                localStorage.setItem('psypyrus_force_sync_fail', checked ? 'true' : 'false');
                                                showToast(checked ? "EHR network outage simulated." : "EHR connection restored.", "info");
                                            }}
                                            style={{ accentColor: 'var(--color-primary)' }}
                                        />
                                        <span style={{ fontSize: '11px', color: '#fff' }}>Simulate Network Outage</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* SUB-TAB: RESILIENCE PATTERNS */}
                        {activeArchitectureSubTab === 'resilience' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr', gap: '20px' }}>
                                    
                                    {/* Circuit Breaker Card */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Circuit Breaker (EHR API Wrapper)</h4>
                                            <span style={{
                                                fontSize: '10px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold',
                                                background: cbState === 'CLOSED' ? 'rgba(16, 185, 129, 0.15)' : cbState === 'OPEN' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                color: cbState === 'CLOSED' ? '#10b981' : cbState === 'OPEN' ? '#ef4444' : '#f59e0b',
                                                border: `1px solid ${cbState === 'CLOSED' ? '#10b981' : cbState === 'OPEN' ? '#ef4444' : '#f59e0b'}`
                                            }}>
                                                {cbState}
                                            </span>
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                                                <div className="metric-val" style={{ color: '#fff', fontSize: '16px' }}>{cbFailureCount} / 5</div>
                                                <div className="metric-label">Failure Count</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                                                <div className="metric-val" style={{ color: '#fff', fontSize: '16px' }}>30s</div>
                                                <div className="metric-label">Cooldown TTL</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                                            <button className="action-button-btn secondary mini-action-btn" style={{ flex: 1, fontSize: '10px' }} onClick={triggerMockCbSuccess}>
                                                Mock Success
                                            </button>
                                            <button className="action-button-btn secondary mini-action-btn" style={{ flex: 1, fontSize: '10px', borderColor: 'var(--color-error)', color: 'var(--color-error)' }} onClick={triggerMockCbFailure}>
                                                Mock Failure
                                            </button>
                                            <button className="action-button-btn secondary mini-action-btn" style={{ flex: 1, fontSize: '10px' }} onClick={() => { Database.circuitBreaker.reset(); syncDbMetrics(); showToast("Circuit breaker states reset.", "info"); }}>
                                                Reset
                                            </button>
                                        </div>

                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Transition Logs:</div>
                                        <div className="log-console-box" style={{ height: '90px', background: '#09090b', fontSize: '10px', color: '#10b981' }}>
                                            {cbHistory.length === 0 ? (
                                                <span style={{ color: 'var(--text-muted)' }}>No state transitions recorded.</span>
                                            ) : (
                                                cbHistory.map((h, i) => (
                                                    <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '2px', marginBottom: '2px' }}>
                                                        [{new Date(h.at).toLocaleTimeString()}] TRANSITION: {h.from} ➔ {h.to}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Bulkhead Isolation Card */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Bulkhead Pool Isolation</h4>
                                            <button className="action-button-btn secondary mini-action-btn" style={{ padding: '2px 8px', fontSize: '9px' }} onClick={triggerBulkheadSaturation}>
                                                Saturate Reads
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                                            Prevents thread starvation by partitioning the connection pools into isolated read & write queues.
                                        </p>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            {/* Reads pool */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                                    <span><strong>Read Bulkhead Pool</strong> ({bulkheadStats.reads.active}/{bulkheadStats.reads.max} Slots)</span>
                                                    <span style={{ color: bulkheadStats.reads.queued > 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>
                                                        {bulkheadStats.reads.queued} queued
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                                                    {Array.from({ length: bulkheadStats.reads.max }).map((_, i) => (
                                                        <div key={i} style={{
                                                            flex: 1,
                                                            height: '6px',
                                                            borderRadius: '3px',
                                                            background: i < bulkheadStats.reads.active ? '#10b981' : 'rgba(255,255,255,0.06)',
                                                            boxShadow: i < bulkheadStats.reads.active ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
                                                        }} />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Writes pool */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                                    <span><strong>Write Bulkhead Pool</strong> ({bulkheadStats.writes.active}/{bulkheadStats.writes.max} Slots)</span>
                                                    <span style={{ color: bulkheadStats.writes.queued > 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>
                                                        {bulkheadStats.writes.queued} queued
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {Array.from({ length: bulkheadStats.writes.max }).map((_, i) => (
                                                        <div key={i} style={{
                                                            flex: 1,
                                                            height: '6px',
                                                            borderRadius: '3px',
                                                            background: i < bulkheadStats.writes.active ? '#a855f7' : 'rgba(255,255,255,0.06)',
                                                            boxShadow: i < bulkheadStats.writes.active ? '0 0 8px rgba(168, 85, 247, 0.4)' : 'none'
                                                        }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '20px' }}>
                                    {/* Distributed Lock Manager */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#fff' }}>Distributed Locks Manager</h4>
                                        
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px' }}>Resource Name</label>
                                                <input 
                                                    type="text" 
                                                    value={lockResourceInput} 
                                                    onChange={e => setLockResourceInput(e.target.value)}
                                                    style={{ width: '100%', padding: '4px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px' }}>Owner ID</label>
                                                <input 
                                                    type="text" 
                                                    value={lockOwnerInput} 
                                                    onChange={e => setLockOwnerInput(e.target.value)}
                                                    style={{ width: '100%', padding: '4px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                            <button className="action-button-btn secondary mini-action-btn" style={{ flex: 1, fontSize: '10px' }} onClick={() => {
                                                try {
                                                    Database.acquireDistributedLock(lockResourceInput, lockOwnerInput);
                                                    showToast(`Acquired lock on '${lockResourceInput}' for '${lockOwnerInput}'`, "success");
                                                } catch (err) {
                                                    showToast(err.message, "error");
                                                } finally {
                                                    syncDbMetrics();
                                                }
                                            }}>
                                                Acquire Lock
                                            </button>
                                            <button className="action-button-btn secondary mini-action-btn" style={{ flex: 1, fontSize: '10px' }} onClick={() => {
                                                const released = Database.releaseDistributedLock(lockResourceInput, lockOwnerInput);
                                                if (released) {
                                                    showToast(`Released lock on '${lockResourceInput}'`, "success");
                                                } else {
                                                    showToast(`Failed to release lock on '${lockResourceInput}' (non-owner or not locked)`, "error");
                                                }
                                                syncDbMetrics();
                                            }}>
                                                Release Lock
                                            </button>
                                        </div>

                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Active Locks:</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '70px', overflowY: 'auto', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '4px', marginBottom: '10px', fontSize: '10px' }}>
                                            {Object.keys(distributedLocks).length === 0 ? (
                                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No active distributed locks.</span>
                                            ) : (
                                                Object.entries(distributedLocks).map(([res, info]) => (
                                                    <div key={res} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '2px' }}>
                                                        <span style={{ color: 'var(--color-primary)' }}>{res}</span>
                                                        <span style={{ color: 'var(--text-muted)' }}>Owned by: <strong style={{ color: '#fff' }}>{info.owner}</strong></span>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Lock History Logs:</div>
                                        <div className="log-console-box" style={{ height: '70px', background: '#09090b', color: '#fb7185', fontSize: '9px' }}>
                                            {lockLogs.length === 0 ? (
                                                <span style={{ color: 'var(--text-muted)' }}>No lock logs recorded.</span>
                                            ) : (
                                                lockLogs.map((log, idx) => <div key={idx}>{log}</div>)
                                            )}
                                        </div>
                                    </div>

                                    {/* Saga Transactions Card */}
                                    <div className="metric-card" style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Saga Orchestration Engine</h4>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '10px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={sagaBillingFail} 
                                                    onChange={e => setSagaBillingFail(e.target.checked)} 
                                                    style={{ accentColor: 'var(--color-primary)' }}
                                                />
                                                <span style={{ color: 'var(--text-muted)' }}>Fail Stripe Billing Step</span>
                                            </label>
                                        </div>
                                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                                            Rolls back completed stages using reverse compensation actions if a downstream step fails.
                                        </p>

                                        <button className="action-button-btn" style={{ width: '100%', fontSize: '11px', marginBottom: '12px' }} onClick={triggerSagaSimulation}>
                                            Execute Clinician Onboarding Saga Flow
                                        </button>

                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Saga History Log:</div>
                                        <div className="log-console-box" style={{ height: '160px', background: '#09090b', fontSize: '10px' }}>
                                            {sagaLogs.length === 0 ? (
                                                <span style={{ color: 'var(--text-muted)' }}>No Sagas run yet. Click above to trigger.</span>
                                            ) : (
                                                sagaLogs.map((s, idx) => (
                                                    <div key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px', marginBottom: '6px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                            <span style={{ color: '#fff' }}>{s.name}</span>
                                                            <span style={{ color: s.status === 'committed' ? '#10b981' : '#ef4444' }}>
                                                                {s.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Started at: {new Date(s.startedAt).toLocaleTimeString()}</div>
                                                        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                                                            {s.steps.map((st, i) => (
                                                                <div key={i} style={{ color: st.status === 'done' ? '#10b981' : st.status === 'failed' ? '#ef4444' : st.status === 'compensated' ? '#f59e0b' : '#38bdf8' }}>
                                                                    ➔ {st.name} ({st.status}) {st.error ? `- Err: ${st.error}` : ''}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Consistent Hashing ring section */}
                                <div className="metric-card" style={{ padding: '16px' }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#fff' }}>Consistent Hashing Partitioning Ring</h4>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ flex: 1.2 }}>
                                            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                                                Deterministic ring maps records uniformly across servers. Enter key to find node mapping.
                                            </p>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input 
                                                    type="text" 
                                                    value={hashKeyInput}
                                                    onChange={e => setHashKeyInput(e.target.value)}
                                                    placeholder="Enter key (e.g. patient_123)"
                                                    style={{ flex: 1, padding: '6px 12px', fontSize: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff' }}
                                                />
                                                <div style={{
                                                    padding: '6px 12px',
                                                    fontSize: '11px',
                                                    background: 'var(--color-primary-dark)',
                                                    border: '1px solid var(--color-primary)',
                                                    borderRadius: '4px',
                                                    color: '#fff',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Maps to: {Database.hashRing.getNode(hashKeyInput)}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ flex: 1.8, display: 'flex', gap: '10px', justifyContent: 'space-around' }}>
                                            {['Node-A', 'Node-B', 'Node-C', 'Node-D'].map(node => {
                                                const isActiveNode = Database.hashRing.getNode(hashKeyInput) === node;
                                                return (
                                                    <div key={node} style={{
                                                        padding: '10px 14px',
                                                        borderRadius: '8px',
                                                        background: isActiveNode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                                                        border: `1px solid ${isActiveNode ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'}`,
                                                        textAlign: 'center',
                                                        flex: 1,
                                                        transition: 'all 0.2s ease',
                                                        transform: isActiveNode ? 'scale(1.05)' : 'scale(1)',
                                                        boxShadow: isActiveNode ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none'
                                                    }}>
                                                        <i className={`fa-solid fa-server`} style={{ color: isActiveNode ? 'var(--color-primary)' : 'var(--text-muted)', fontSize: '16px', marginBottom: '4px' }}></i>
                                                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: isActiveNode ? '#fff' : 'var(--text-muted)' }}>{node}</div>
                                                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>3 vnodes</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SUB-TAB: OBSERVABILITY */}
                        {activeArchitectureSubTab === 'observability' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr', gap: '20px' }}>
                                    
                                    {/* Structured Logging Panel */}
                                    <div className="metric-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '420px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Structured JSON Logging Engine</h4>
                                            <button className="action-button-btn secondary mini-action-btn" style={{ padding: '2px 8px', fontSize: '9px' }} onClick={() => { Logger.clearLogs(); syncDbMetrics(); }}>
                                                Clear Logs
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <input 
                                                type="text" 
                                                value={logSearchQuery}
                                                onChange={e => setLogSearchQuery(e.target.value)}
                                                placeholder="Filter messages..."
                                                style={{ flex: 1, padding: '4px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff' }}
                                            />
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                {Object.keys(logLevelFilter).map(lvl => (
                                                    <label key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#fff', cursor: 'pointer' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={logLevelFilter[lvl]}
                                                            onChange={e => setLogLevelFilter({ ...logLevelFilter, [lvl]: e.target.checked })}
                                                            style={{ accentColor: 'var(--color-primary)' }}
                                                        />
                                                        {lvl}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="log-console-box" style={{ flex: 1, background: '#09090b', color: '#e4e4e7', fontSize: '9px', fontFamily: 'monospace', overflowY: 'auto' }}>
                                            {liveLogs
                                                .filter(l => logLevelFilter[l.level])
                                                .filter(l => l.message.toLowerCase().includes(logSearchQuery.toLowerCase()) || l.service.toLowerCase().includes(logSearchQuery.toLowerCase()) || l.event.toLowerCase().includes(logSearchQuery.toLowerCase()))
                                                .map((l, idx) => {
                                                    let lvlColor = '#38bdf8'; // INFO
                                                    if (l.level === 'WARN') lvlColor = '#fbbf24';
                                                    if (l.level === 'ERROR') lvlColor = '#f87171';
                                                    if (l.level === 'DEBUG') lvlColor = '#a78bfa';

                                                    return (
                                                        <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '3px', marginBottom: '3px', lineHeight: 1.3 }}>
                                                            <span style={{ color: 'var(--text-muted)' }}>[{l.timestamp.substr(11, 8)}]</span>{' '}
                                                            <span style={{ color: lvlColor, fontWeight: 'bold' }}>[{l.level}]</span>{' '}
                                                            <span style={{ color: '#818cf8' }}>[{l.service}]</span>{' '}
                                                            <span style={{ color: '#34d399' }}>{l.event}</span> - {l.message}
                                                            {Object.keys(l.metadata).length > 0 && (
                                                                <span style={{ color: '#a1a1aa', fontStyle: 'italic' }}> - meta: {JSON.stringify(l.metadata)}</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            {liveLogs.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No logs emitted yet.</span>}
                                        </div>
                                    </div>

                                    {/* Distributed Tracing waterfall explorer */}
                                    <div className="metric-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '420px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Distributed Trace Timeline Explorer</h4>
                                            <button className="action-button-btn secondary mini-action-btn" style={{ padding: '2px 8px', fontSize: '9px' }} onClick={() => { Tracer.clearTraces(); setSelectedTrace(null); syncDbMetrics(); }}>
                                                Clear Traces
                                            </button>
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '15px', flex: 1, overflow: 'hidden' }}>
                                            {/* Left List */}
                                            <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {liveTraces.length === 0 ? (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>No completed traces. Run queries, transactions, or sagas to trigger tracing.</span>
                                                ) : (
                                                    liveTraces.map(t => {
                                                        const isSelected = selectedTrace?.traceId === t.traceId;
                                                        return (
                                                            <div 
                                                                key={t.traceId}
                                                                onClick={() => setSelectedTrace(t)}
                                                                style={{
                                                                    padding: '8px',
                                                                    borderRadius: '6px',
                                                                    background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255,255,255,0.02)',
                                                                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.04)'}`,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    fontSize: '10px'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                                    <span style={{ color: '#fff' }}>{t.name}</span>
                                                                    <span style={{ color: 'var(--color-primary)' }}>{t.durationMs}ms</span>
                                                                </div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '8px', marginTop: '2px' }}>
                                                                    id: {t.traceId.substr(0, 8)}... | {t.spans.length} spans
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Right Timeline Detail */}
                                            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                                {selectedTrace ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px', marginBottom: '8px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <strong style={{ fontSize: '11px', color: '#fff' }}>{selectedTrace.name}</strong>
                                                                <span style={{ fontSize: '10px', color: 'var(--color-primary)' }}>Total: {selectedTrace.durationMs}ms</span>
                                                            </div>
                                                            <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                                Trace ID: {selectedTrace.traceId}
                                                            </div>
                                                        </div>

                                                        {/* Waterfall visual */}
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {selectedTrace.spans.sort((a,b) => a.startTime - b.startTime).map(span => {
                                                                const startOffsetMs = span.startTime - selectedTrace.startTime;
                                                                const startPct = selectedTrace.durationMs > 0 ? (startOffsetMs / selectedTrace.durationMs) * 100 : 0;
                                                                const widthPct = selectedTrace.durationMs > 0 ? (span.durationMs / selectedTrace.durationMs) * 100 : 100;
                                                                const indent = span.parentSpanId ? 14 : 0;

                                                                return (
                                                                    <div key={span.spanId} style={{ display: 'flex', flexDirection: 'column', fontSize: '9px', paddingLeft: `${indent}px` }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e4e4e7', marginBottom: '2px' }}>
                                                                            <span>
                                                                                {span.parentSpanId ? '↳ ' : ''}
                                                                                <strong>{span.name}</strong>
                                                                                {span.tags.error && <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>[Error]</span>}
                                                                            </span>
                                                                            <span style={{ color: 'var(--text-muted)' }}>{span.durationMs}ms</span>
                                                                        </div>
                                                                        
                                                                        {/* Progress bar container */}
                                                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                                                            <div style={{
                                                                                position: 'absolute',
                                                                                left: `${startPct}%`,
                                                                                width: `${Math.max(2, widthPct)}%`,
                                                                                height: '100%',
                                                                                background: span.tags.error ? 'var(--color-error)' : 'linear-gradient(90deg, var(--color-primary), #3b82f6)',
                                                                                borderRadius: '4px'
                                                                            }} />
                                                                        </div>
                                                                        {span.tags.errorMessage && (
                                                                            <div style={{ color: 'var(--color-error)', fontSize: '8px', fontStyle: 'italic', marginTop: '2px' }}>
                                                                                Error: {span.tags.errorMessage}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '10px', fontStyle: 'italic' }}>
                                                        Select a trace from the list to view the waterfall timeline.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
