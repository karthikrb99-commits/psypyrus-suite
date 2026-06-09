/**
 * PsyPyrus AI - UI Controller
 * Manages layout rendering, screen routing, interactive Canvas/SVG animations,
 * custom event listeners, and reactive-like updates from the Database.
 */

import { Database } from './db.js';
import { DiagnosticEngine } from './diagnostics.js';
import { GeminiService } from './ai.js';
import { ClinicalTrialsService } from './trials.js';

export class UI {
    static init() {
        this.activeRole = "Professional"; // Default persona
        this.activeScreen = "Dashboard";
        this.activePatientId = 1; // Default Liam Carter
        this.selectedAssessment = "PHQ-9";
        
        // Modal states
        this.showApptModal = false;
        this.showSettingsDrawer = false;
        
        // Teletherapy Call state
        this.callActive = false;
        this.micMuted = false;
        this.recordingEnabled = true;
        this.callChatLogs = [
            "Dr. Brewster: Hi Liam. Glad you joined. We'll check your GAD-7 metrics today.",
            "Liam: Yes, corporative stress was high this past week but practiced somatic breathing."
        ];

        // Meditation Timer state
        this.meditationInterval = null;
        this.meditationSeconds = 300;
        this.meditationRunning = false;

        // Breathing Mandala state
        this.breathingActive = false;
        this.breathingInterval = null;

        // Sync initial forms and register db changes
        window.addEventListener('psypyrus_db_change', (e) => {
            this.handleDatabaseUpdate(e.detail.key);
        });

        this.registerGlobalListeners();
        this.renderAll();
    }

    // --- RENDER SYSTEM ---
    static renderAll() {
        this.renderRoleMenus();
        this.renderActiveScreen();
        this.renderActivePatientDisplay();
        this.renderSettingsDrawer();
    }

    static handleDatabaseUpdate(key) {
        console.log(`Database change detected for: ${key}`);
        this.renderActiveScreen();
        this.renderActivePatientDisplay();
    }

    static renderActivePatientDisplay() {
        const patients = Database.getPatients();
        const activePat = patients.find(p => p.id === this.activePatientId) || patients[0];
        if (activePat) {
            this.activePatientId = activePat.id;
            const el = document.getElementById('active-patient-display');
            if (el) el.innerText = activePat.name;
            const specialtyEl = document.getElementById('trials-patient-specialty');
            if (specialtyEl) specialtyEl.innerText = activePat.specialty;
        }
    }

    static renderRoleMenus() {
        const clinicianMenu = document.getElementById('clinician-nav-menu');
        const patientMenu = document.getElementById('patient-nav-menu');
        const activePatientBadge = document.querySelector('.active-patient-badge');

        if (this.activeRole === "Professional") {
            clinicianMenu.style.display = 'block';
            patientMenu.style.display = 'none';
            if (activePatientBadge) activePatientBadge.style.display = 'block';
        } else {
            clinicianMenu.style.display = 'none';
            patientMenu.style.display = 'block';
            if (activePatientBadge) activePatientBadge.style.display = 'none';
            this.activePatientId = 1; // Default to Patient 1 (Liam Carter) in wellness mode
        }
    }

    static renderActiveScreen() {
        // Hide all screens
        document.querySelectorAll('.screen-container').forEach(el => el.classList.remove('active'));
        
        // Remove active class from nav items
        document.querySelectorAll('.nav-item-link').forEach(el => el.classList.remove('active'));

        // Highlight selected nav item
        const activeNavSelector = `.nav-item-link[data-screen="${this.activeScreen}"]`;
        document.querySelectorAll(activeNavSelector).forEach(el => el.classList.add('active'));

        // Determine specific screen to show
        if (this.activeRole === "Professional") {
            if (this.activeScreen === "Dashboard") {
                this.renderClinicianDashboard();
            } else if (this.activeScreen === "AI Copilot") {
                this.renderAiCopilot();
            } else if (this.activeScreen === "Digital MSE") {
                this.renderDigitalMse();
            } else if (this.activeScreen === "Diagnostics") {
                this.renderDiagnostics();
            } else if (this.activeScreen === "Teletherapy") {
                this.renderTeletherapy();
            } else if (this.activeScreen === "Planner") {
                this.renderCbtPlanner();
            } else if (this.activeScreen === "Assessments") {
                this.renderAssessments();
            } else if (this.activeScreen === "Analytics") {
                this.renderAnalytics();
            } else if (this.activeScreen === "HIPAA Shield") {
                this.renderHipaaShield();
            }
        } else {
            // Patient View
            if (this.activeScreen === "Dashboard") {
                this.renderPatientDashboard();
            } else if (this.activeScreen === "Wellness") {
                this.renderWellnessLounge();
            } else if (this.activeScreen === "Assessments") {
                this.renderAssessments();
            } else if (this.activeScreen === "Teletherapy") {
                this.renderTeletherapy();
            } else if (this.activeScreen === "HIPAA Shield") {
                this.renderHipaaShield();
            }
        }
    }

    // --- SCREEN RENDERERS ---

    // 1. Clinician Dashboard
    static renderClinicianDashboard() {
        const screen = document.getElementById('screen-clinician-dashboard');
        screen.classList.add('active');

        const patients = Database.getPatients();
        const appts = Database.getAppointments();

        // Render Risk Alerts
        const severePatients = patients.filter(p => p.riskStatus === "Severe" || p.riskStatus === "Moderate");
        const alertsContainer = document.getElementById('risk-alerts-container');
        const alertsCount = document.getElementById('risk-alert-count');
        const alertsList = document.getElementById('risk-alert-patients-list');

        if (severePatients.length > 0) {
            alertsContainer.style.display = 'flex';
            alertsCount.innerText = severePatients.length;
            alertsList.innerHTML = severePatients.map(pat => `
                <div class="alert-message-item">
                    <div>
                        <strong>${pat.name}</strong> - Flagged Risk: <span style="color: var(--color-error); font-weight:700;">${pat.riskStatus}</span> | Clinical: ${pat.specialty}
                    </div>
                    <button class="action-button-btn secondary mini-action-btn review-ai-btn" data-id="${pat.id}">Review AI</button>
                </div>
            `).join('');

            // Add listener to review AI buttons
            alertsList.querySelectorAll('.review-ai-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = Number(e.target.getAttribute('data-id'));
                    this.activePatientId = id;
                    this.activeScreen = "AI Copilot";
                    this.renderAll();
                });
            });
        } else {
            alertsContainer.style.display = 'none';
        }

        // Render stats counters
        document.getElementById('metrics-active-cases').innerText = patients.length;
        const totalRev = appts.filter(a => a.status === "Completed").reduce((sum, a) => sum + a.fee, 0) + 
                         appts.filter(a => a.status === "Scheduled").reduce((sum, a) => sum + a.fee, 0) * 0.7;
        document.getElementById('metrics-snapshot-revenue').innerText = `$${Math.round(totalRev)}`;

        // Render Scheduled Appointments
        const scheduled = appts.filter(a => a.status === "Scheduled");
        const listContainer = document.getElementById('scheduled-appointments-list');
        
        if (scheduled.length === 0) {
            listContainer.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--color-text-secondary);">No further appointments scheduled.</div>`;
        } else {
            listContainer.innerHTML = scheduled.map(appt => `
                <div class="appointment-item-card">
                    <div class="appointment-info-core">
                        <div class="appt-patient-row">
                            <span class="appt-patient-name">${appt.patientName}</span>
                            ${appt.isVideo ? '<span class="badge-text-tag video">Video</span>' : ''}
                        </div>
                        <div class="appt-time-details">Time: ${appt.dateTime} | Fee Case: $${appt.fee}</div>
                        <div class="appt-notes-agenda">${appt.notes}</div>
                    </div>
                    <div class="appointment-actions-block">
                        <button class="action-button-btn mini-action-btn appt-start-btn" data-id="${appt.id}" data-patient="${appt.patientId}" data-video="${appt.isVideo}">Start</button>
                        <button class="action-button-btn secondary mini-action-btn appt-cancel-btn" style="color:var(--color-error);" data-id="${appt.id}">Cancel</button>
                    </div>
                </div>
            `).join('');

            // Click Handlers
            listContainer.querySelectorAll('.appt-start-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const apptId = Number(btn.getAttribute('data-id'));
                    const patId = Number(btn.getAttribute('data-patient'));
                    const isVideo = btn.getAttribute('data-video') === 'true';

                    this.activePatientId = patId;
                    Database.updateAppointmentStatus(apptId, "Completed");
                    
                    if (isVideo) {
                        this.activeScreen = "Teletherapy";
                    } else {
                        this.activeScreen = "AI Copilot";
                    }
                    this.renderAll();
                });
            });

            listContainer.querySelectorAll('.appt-cancel-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const apptId = Number(btn.getAttribute('data-id'));
                    Database.deleteAppointment(apptId);
                });
            });
        }
    }

    // 2. Patient Dashboard
    static renderPatientDashboard() {
        const screen = document.getElementById('screen-patient-dashboard');
        screen.classList.add('active');

        const appts = Database.getAppointments();
        const patientAppts = appts.filter(a => a.patientId === this.activePatientId && a.status === "Scheduled");
        const coordinationContainer = document.getElementById('patient-care-coordination-container');

        if (patientAppts.length > 0) {
            const nextAppt = patientAppts[0];
            coordinationContainer.innerHTML = `
                <div style="padding: 10px 0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                        <strong>Therapy Session: Dr. Katherine Brewster</strong>
                        <span class="badge-text-tag video" style="background-color: var(--color-secondary); color:#fff; font-weight:700;">JOIN ROOM</span>
                    </div>
                    <div class="appt-time-details" style="font-size:13px;">Scheduled: ${nextAppt.dateTime}</div>
                    <p style="font-size:12px; margin: 8px 0 16px 0;">Session focus: ${nextAppt.notes}</p>
                    <button class="action-button-btn launch-patient-call-btn" style="width:100%;">
                        <i class="fa-solid fa-video"></i> Launch Video Telehealth Link
                    </button>
                </div>
            `;
            coordinationContainer.querySelector('.launch-patient-call-btn').addEventListener('click', () => {
                this.activeScreen = "Teletherapy";
                this.renderAll();
            });
        } else {
            coordinationContainer.innerHTML = `
                <div style="text-align:center; padding: 20px 0; color:var(--color-text-secondary);">
                    <p style="font-size:13px; margin-bottom: 12px;">No pending coordinates.</p>
                    <button class="action-button-btn secondary" id="patient-browse-providers-btn">Browse Available Providers</button>
                </div>
            `;
            const browseBtn = document.getElementById('patient-browse-providers-btn');
            if (browseBtn) {
                browseBtn.addEventListener('click', () => {
                    alert("HIPAA Provider list currently offline. Practice mindfulness or call clinical dispatcher.");
                });
            }
        }

        // Render Patient Homework checklist
        const tasks = Database.getHomework(this.activePatientId);
        const homeworkContainer = document.getElementById('patient-homework-list');

        if (tasks.length === 0) {
            homeworkContainer.innerHTML = `<p style="font-size:12px; color:var(--color-text-muted); text-align:center; padding: 12px 0;">No active homework tasks assigned by Dr. Brewster. Focus on mindfulness and breathing exercises.</p>`;
        } else {
            homeworkContainer.innerHTML = tasks.map(task => `
                <div class="homework-list-item">
                    <label class="homework-item-label ${task.isCompleted ? 'completed' : ''}">
                        <input type="checkbox" class="checkbox-control homework-toggle-chk" data-id="${task.id}" ${task.isCompleted ? 'checked' : ''}>
                        <span>${task.description}</span>
                    </label>
                </div>
            `).join('');

            homeworkContainer.querySelectorAll('.homework-toggle-chk').forEach(chk => {
                chk.addEventListener('change', (e) => {
                    const id = Number(chk.getAttribute('data-id'));
                    Database.toggleHomework(id);
                });
            });
        }
    }

    // 3. AI SOAP Copilot
    static renderAiCopilot() {
        const screen = document.getElementById('screen-ai-copilot');
        screen.classList.add('active');

        const patients = Database.getPatients();
        const chipsContainer = document.getElementById('copilot-patient-chips');
        
        // Render Patient Target Selector Chips
        chipsContainer.innerHTML = patients.map(pat => `
            <button class="patient-filter-chip ${pat.id === this.activePatientId ? 'active' : ''}" data-id="${pat.id}">${pat.name}</button>
        `).join('');

        chipsContainer.querySelectorAll('.patient-filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.activePatientId = Number(chip.getAttribute('data-id'));
                this.renderAiCopilot();
            });
        });
    }

    // 4. Digital MSE Screen
    static renderDigitalMse() {
        const screen = document.getElementById('screen-digital-mse');
        screen.classList.add('active');

        const patients = Database.getPatients();
        const chipsContainer = document.getElementById('mse-patient-chips');
        
        // Render Patient selector chips
        chipsContainer.innerHTML = patients.map(pat => `
            <button class="patient-filter-chip ${pat.id === this.activePatientId ? 'active' : ''}" data-id="${pat.id}">${pat.name}</button>
        `).join('');

        chipsContainer.querySelectorAll('.patient-filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.activePatientId = Number(chip.getAttribute('data-id'));
                this.renderDigitalMse();
            });
        });
    }

    // 5. Diagnostics Screen
    static renderDiagnostics() {
        const screen = document.getElementById('screen-diagnostics');
        screen.classList.add('active');
        
        // Trigger live local evaluation results
        this.runDiagnosticsLiveEvaluation();
    }

    static runDiagnosticsLiveEvaluation() {
        const dsmPanel = document.getElementById('diagnostics-dsm-inputs');
        const isDsmMode = dsmPanel.style.display !== 'none';

        const resultsContainer = document.getElementById('local-diag-results-content');
        let results = [];

        if (isDsmMode) {
            // Read checkboxes
            const mddChecked = Array.from(document.querySelectorAll('#dsm-mdd-checklist-box input:checked')).map(el => el.value);
            const gadChecked = Array.from(document.querySelectorAll('#dsm-gad-checklist-box input:checked')).map(el => el.value);
            const duration = Number(document.getElementById('dsm-duration-slider').value);
            const exclusions = Array.from(document.querySelectorAll('#dsm-exclusions-box input:checked')).map(el => el.value);

            results = DiagnosticEngine.evaluateDsm5Disorders(mddChecked, gadChecked, duration, exclusions);
        } else {
            const basicChecked = Array.from(document.querySelectorAll('#mock-basic-checklist-box input:checked')).map(el => el.value);
            const symptomsChecked = Array.from(document.querySelectorAll('#mock-symptoms-checklist-box input:checked')).map(el => el.value);

            results = DiagnosticEngine.evaluateMockDisorders(basicChecked, symptomsChecked);
        }

        if (results.length === 0) {
            resultsContainer.innerHTML = `<p style="font-size:12px; color:var(--color-text-secondary);">No definitive matching criteria met locally.</p>`;
        } else {
            resultsContainer.innerHTML = results.map(res => `
                <div style="border-bottom:1px solid var(--color-border); padding: 8px 0; margin-bottom: 6px;">
                    <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700;">
                        <span>${res.disorderName} (${res.code})</span>
                        <span style="color: ${res.confidence === 'High' ? 'var(--color-success)' : 'var(--color-warning)'}">${res.confidence} Confidence</span>
                    </div>
                    <p style="font-size:11.5px; color: var(--color-text-secondary); margin-top:4px;">${res.explanation}</p>
                </div>
            `).join('');
        }
    }

    // 6. Teletherapy calling Screen
    static renderTeletherapy() {
        const screen = document.getElementById('screen-teletherapy');
        screen.classList.add('active');

        const patients = Database.getPatients();
        const currentPat = patients.find(p => p.id === this.activePatientId) || patients[0];
        
        document.getElementById('video-patient-label').innerText = currentPat.name;

        // Render chat
        const chatLogsArea = document.getElementById('call-chat-logs');
        chatLogsArea.innerHTML = this.callChatLogs.map(log => {
            const isMe = log.startsWith("Dr. Brewster:");
            return `
                <div class="chat-message-bubble" style="text-align: ${isMe ? 'left' : 'right'}; margin-bottom: 4px;">
                    <span style="background: ${isMe ? 'rgba(59,130,246,0.15)' : 'rgba(20,184,166,0.15)'}; padding: 4px 10px; border-radius: var(--radius-md); display:inline-block; max-width: 80%;">
                        ${log}
                    </span>
                </div>
            `;
        }).join('');
        
        // Auto scroll to bottom
        chatLogsArea.scrollTop = chatLogsArea.scrollHeight;
    }

    // 7. Planner Screen
    static renderCbtPlanner() {
        const screen = document.getElementById('screen-planner');
        screen.classList.add('active');

        // Render active homework checklist
        const tasks = Database.getHomework(this.activePatientId);
        const checklistContainer = document.getElementById('planner-homework-checklist-container');

        if (tasks.length === 0) {
            checklistContainer.innerHTML = `<div style="text-align:center; padding:16px; color:var(--color-text-muted); font-size: 13px;">No homework tasks currently assigned.</div>`;
        } else {
            checklistContainer.innerHTML = tasks.map(task => `
                <div class="homework-list-item">
                    <label class="homework-item-label ${task.isCompleted ? 'completed' : ''}">
                        <input type="checkbox" class="checkbox-control planner-hw-check-chk" data-id="${task.id}" ${task.isCompleted ? 'checked' : ''}>
                        <span>${task.description}</span>
                    </label>
                    <button class="homework-delete-btn planner-hw-delete-btn" data-id="${task.id}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `).join('');

            checklistContainer.querySelectorAll('.planner-hw-check-chk').forEach(chk => {
                chk.addEventListener('change', () => {
                    const id = Number(chk.getAttribute('data-id'));
                    Database.toggleHomework(id);
                });
            });

            checklistContainer.querySelectorAll('.planner-hw-delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = Number(btn.getAttribute('data-id'));
                    Database.deleteHomework(id);
                });
            });
        }
    }

    // 8. Assessments Screen
    static renderAssessments() {
        const screen = document.getElementById('screen-assessments');
        screen.classList.add('active');
    }

    // 9. Wellness Screen
    static renderWellnessLounge() {
        const screen = document.getElementById('screen-patient-wellness');
        screen.classList.add('active');
        
        // Setup clock
        this.updateMeditationClock();
    }

    // 10. Analytics Screen
    static renderAnalytics() {
        const screen = document.getElementById('screen-analytics');
        screen.classList.add('active');

        // Render mini audit logs
        const auditLogs = Database.get('psypyrus_audit_logs');
        document.getElementById('analytics-mini-audit-logs').innerHTML = this.buildAuditLogsHtml(auditLogs.slice(0, 5));

        // Render Canvas/SVG mood chart
        const moodLogs = Database.getMoodLogs();
        this.renderSvgMoodChart(moodLogs);
    }

    static renderSvgMoodChart(logs) {
        const svg = document.getElementById('analytics-mood-chart-svg');
        if (!svg) return;
        svg.innerHTML = ''; // Clear

        const width = 800;
        const height = 180;

        // Draw grid lines
        const gridCount = 5;
        for (let i = 0; i <= gridCount; i++) {
            const y = (height / gridCount) * i;
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", "0");
            line.setAttribute("y1", y);
            line.setAttribute("x2", width);
            line.setAttribute("y2", y);
            line.setAttribute("class", "svg-grid-line");
            svg.appendChild(line);
        }

        // Draw mood curve
        const sortedLogs = [...logs].reverse().slice(-8); // take last 8 entries
        if (sortedLogs.length >= 2) {
            const stepX = width / (sortedLogs.length - 1);
            let pathD = "";
            const dots = [];

            sortedLogs.forEach((item, index) => {
                const relativeY = height - ((item.moodScore / 10) * height);
                const x = stepX * index;

                if (index === 0) {
                    pathD += `M ${x} ${relativeY}`;
                } else {
                    pathD += ` L ${x} ${relativeY}`;
                }

                // Create Dot element
                const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                dot.setAttribute("cx", x);
                dot.setAttribute("cy", relativeY);
                dot.setAttribute("r", "6");
                dot.setAttribute("class", "svg-mood-dot");
                dot.setAttribute("title", `Mood: ${item.moodScore} - ${item.moodNote}`);
                dots.push(dot);
            });

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathD);
            path.setAttribute("class", "svg-mood-path");
            svg.appendChild(path);

            dots.forEach(dot => svg.appendChild(dot));
        } else {
            // Draw smooth sine curve fallback
            let pathD = "";
            const pointsCount = 40;
            const stepX = width / pointsCount;
            for (let i = 0; i <= pointsCount; i++) {
                const x = stepX * i;
                const relativeY = (height / 2) + Math.sin(i * 0.4) * (height / 3);
                if (i === 0) {
                    pathD += `M ${x} ${relativeY}`;
                } else {
                    pathD += ` L ${x} ${relativeY}`;
                }
            }

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathD);
            path.setAttribute("class", "svg-mood-path");
            path.style.stroke = "rgba(20, 184, 166, 0.4)";
            svg.appendChild(path);
        }
    }

    // 11. HIPAA Shield
    static renderHipaaShield() {
        const screen = document.getElementById('screen-hipaa-shield');
        screen.classList.add('active');

        const auditLogs = Database.get('psypyrus_audit_logs');
        document.getElementById('hipaa-full-audit-logs').innerHTML = this.buildAuditLogsHtml(auditLogs);
    }

    static buildAuditLogsHtml(logs) {
        if (logs.length === 0) return `<div style="padding:10px; text-align:center; color:gray;">Empty ledger logs.</div>`;
        return logs.map(log => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
                            ' ' + new Date(log.timestamp).toLocaleDateString([], { month: '2-digit', day: '2-digit' });
            return `
                <div class="audit-log-item">
                    <div class="audit-header-line">
                        <span class="audit-action-name">Action: ${log.action}</span>
                        <span class="audit-timestamp">${timeStr}</span>
                    </div>
                    <div class="audit-details-text">Details: ${log.details}</div>
                    <div class="audit-footer-labels">
                        <span>Actor: ${log.actor}</span>
                        <span class="audit-encryption-label">Encryption: ${log.encryptionStandard}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // settings
    static renderSettingsDrawer() {
        const keyVal = localStorage.getItem('psypyrus_gemini_api_key') || '';
        document.getElementById('settings-gemini-key-input').value = keyVal;

        const isConfigured = this.isApiKeyConfigured();
        const indicator = document.getElementById('api-key-status-indicator');
        
        if (isConfigured) {
            indicator.className = "api-key-status-text configured";
            indicator.innerHTML = `<i class="fa-solid fa-circle-check"></i> Key Configured. Real AI Copilot activated.`;
        } else {
            indicator.className = "api-key-status-text fallback";
            indicator.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Key not set. Running in local mock mode.`;
        }
    }

    static isApiKeyConfigured() {
        return GeminiService.isApiKeyConfigured();
    }

    // --- INTERACTIVE ACTIONS & LISTENERS ---
    static registerGlobalListeners() {
        
        // 1. Biometric lock scanner authenticators
        const lockScanner = document.getElementById('lock-scanner-trigger');
        if (lockScanner) {
            lockScanner.addEventListener('click', () => {
                lockScanner.querySelector('.biometric-icon').style.color = "var(--color-primary)";
                lockScanner.style.borderColor = "var(--color-primary)";
                
                setTimeout(() => {
                    document.getElementById('biometric-lock-screen').style.display = 'none';
                    document.getElementById('main-app-container').style.display = 'flex';
                    
                    Database.logAudit("Biometric Authentication", "Biometric credentials parsed. Session successfully decrypted.");
                    this.renderAll();
                }, 1000);
            });
        }

        // Toolbar locks
        const lockBtn = document.getElementById('lock-toggle-btn');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                this.lockSession();
            });
        }
        const lockSessionSidebar = document.getElementById('lock-session-sidebar');
        if (lockSessionSidebar) {
            lockSessionSidebar.addEventListener('click', () => {
                this.lockSession();
            });
        }

        // 2. Tab Navigation links
        document.querySelectorAll('.nav-item-link').forEach(el => {
            el.addEventListener('click', (e) => {
                const target = el.getAttribute('data-screen');
                this.activeScreen = target;
                
                // Clear state when switching
                document.getElementById('copilot-result-card').style.display = 'none';
                document.getElementById('mse-result-card').style.display = 'none';
                document.getElementById('planner-result-card').style.display = 'none';
                
                this.renderAll();
            });
        });

        // 3. Persona Switches
        document.querySelectorAll('.persona-pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const role = btn.getAttribute('data-role');
                this.switchRole(role);
            });
        });
        const roleToggleSidebar = document.getElementById('role-toggle-sidebar');
        if (roleToggleSidebar) {
            roleToggleSidebar.addEventListener('click', () => {
                const nextRole = this.activeRole === "Professional" ? "Patient" : "Professional";
                this.switchRole(nextRole);
            });
        }

        // 4. Mode toggle theme
        const themeBtn = document.getElementById('theme-toggle-btn');
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const icon = themeBtn.querySelector('i');
            if (document.body.classList.contains('light-theme')) {
                icon.className = "fa-solid fa-sun";
            } else {
                icon.className = "fa-solid fa-moon";
            }
        });

        // 5. Settings slide drawers
        const settingsBtn = document.getElementById('settings-toggle-btn');
        const drawer = document.getElementById('settings-slide-drawer');
        const closeDrawerBtn = document.getElementById('close-settings-drawer-btn');
        const saveDrawerBtn = document.getElementById('save-settings-drawer-btn');

        settingsBtn.addEventListener('click', () => {
            drawer.classList.add('active');
        });
        closeDrawerBtn.addEventListener('click', () => {
            drawer.classList.remove('active');
        });
        saveDrawerBtn.addEventListener('click', () => {
            const key = document.getElementById('settings-gemini-key-input').value;
            localStorage.setItem('psypyrus_gemini_api_key', key);
            Database.logAudit("API Credentials Saved", "Configured Google Gemini developer API credentials.");
            drawer.classList.remove('active');
            this.renderAll();
        });

        // 6. Appointments Schedule Modal
        const openApptModalBtn = document.getElementById('open-add-appt-modal');
        const closeApptModalBtn = document.getElementById('close-add-appt-modal-btn');
        const apptOverlay = document.getElementById('add-appt-modal-overlay');
        const submitApptBtn = document.getElementById('submit-add-appt-btn');

        openApptModalBtn.addEventListener('click', () => {
            this.renderAddAppointmentModal();
            apptOverlay.classList.add('active');
        });
        closeApptModalBtn.addEventListener('click', () => {
            apptOverlay.classList.remove('active');
        });
        submitApptBtn.addEventListener('click', () => {
            const activeChip = apptOverlay.querySelector('.patient-filter-chip.active');
            const patId = activeChip ? Number(activeChip.getAttribute('data-id')) : 1;
            const patients = Database.getPatients();
            const patName = patients.find(p => p.id === patId).name;

            const time = document.getElementById('add-appt-time-input').value;
            const notes = document.getElementById('add-appt-notes-input').value;
            const isVideo = document.getElementById('add-appt-video-checkbox').checked;

            Database.insertAppointment({
                patientId: patId,
                patientName: patName,
                dateTime: time,
                notes: notes,
                isVideo: isVideo,
                fee: 150.0
            });

            apptOverlay.classList.remove('active');
        });

        // 7. AI SOAP Notes Compile
        const compileSoapBtn = document.getElementById('compile-soap-btn');
        const transcriptInput = document.getElementById('copilot-transcript-input');
        const copilotResultCard = document.getElementById('copilot-result-card');
        const copilotResultText = document.getElementById('copilot-result-text');

        // Quick templates
        document.getElementById('template-anxiety').addEventListener('click', () => {
            transcriptInput.value = "Patient reports worsening anxiety symptoms over the past 3 weeks, linked to increased corporate stressors. Describes sleep onset latency (~90 mins) and somatic signs including epigastric tightness, muscle scanning tension, and mild palpitations.";
        });
        document.getElementById('template-depression').addEventListener('click', () => {
            transcriptInput.value = "Presented with recurrent low mood throughout the day. Slept 10 hours but complains of feeling fully unrefreshed, reports complete lock on feelings, feels like can't continue doing things. Thoughts of escape but has a good family core.";
        });

        compileSoapBtn.addEventListener('click', async () => {
            const text = transcriptInput.value.trim();
            if (!text) return;

            compileSoapBtn.disabled = true;
            compileSoapBtn.innerHTML = `<span class="loader-dual-ring"></span> Compiling Note...`;
            
            const system = "You are a psychiatric clinical assistant. Convert conversational session transcripts into a formal medical SOAP note. Maintain full clinical clarity and use professional vocabularies.";
            const prompt = `Compile the following session conversation transcript into a structured, formal healthcare SOAP note.\nInclude SUBJECTIVE, OBJECTIVE, ASSESSMENT, and PLAN. Keep and suggest matching diagnoses (such as DSM-5/ICD-10 codes) based on indicators.\n\nTranscript:\n"${text}"`;

            try {
                const result = await GeminiService.callGemini(prompt, system);
                copilotResultText.textContent = result;
                copilotResultCard.style.display = 'block';

                // Save to clinical notes database
                Database.insertClinicalNote({
                    patientId: this.activePatientId,
                    title: "AI SOAP Copilot Output",
                    noteType: "SOAP",
                    bodyJson: result,
                    isRiskAlert: text.includes("hurt") || text.includes("suicide") || text.includes("die") || text.includes("escape")
                });
            } catch (e) {
                alert(`Error compiling SOAP note: ${e.message}`);
            } finally {
                compileSoapBtn.disabled = false;
                compileSoapBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Compile Compliant SOAP Note`;
            }
        });

        // 8. Digital MSE Synthesis
        const compileMseBtn = document.getElementById('compile-mse-btn');
        const mseResultCard = document.getElementById('mse-result-card');
        const mseResultText = document.getElementById('mse-result-text');
        const insightSlider = document.getElementById('mse-insight-slider');

        insightSlider.addEventListener('input', () => {
            const val = Number(insightSlider.value);
            const disp = document.getElementById('mse-insight-grade-display');
            const desc = document.getElementById('mse-insight-grade-desc');
            
            disp.innerText = `Grade ${val}`;
            desc.innerText = this.getInsightGradeDescription(val);
        });

        compileMseBtn.addEventListener('click', async () => {
            compileMseBtn.disabled = true;
            compileMseBtn.innerHTML = `<span class="loader-dual-ring"></span> Synthesizing Prose...`;

            const appearance = document.querySelector('input[name="mse-appearance"]:checked').value;
            const behavior = document.querySelector('input[name="mse-behavior"]:checked').value;
            const speech = document.querySelector('input[name="mse-speech"]:checked').value;
            const mood = document.querySelector('input[name="mse-mood"]:checked').value;
            const attention = document.querySelector('input[name="mse-attention"]:checked').value;
            const insight = insightSlider.value;
            const judgment = document.querySelector('input[name="mse-judgment"]:checked').value;
            const comments = document.getElementById('mse-comments-input').value.trim();

            const prompt = `Synthesize the following mental status exam checklist ratings and brief annotations into a single, cohesive, formal psychiatric clinical narrative paragraph (Mental Status Examination narrative block). Avoid list bullets in output, write in continuous prose style.\n\nRatings:\n* Appearance/Attire: ${appearance}\n* Behavior/Cooperation: ${behavior}\n* Speech Patterns: ${speech}\n* Patient mood/affect: ${mood}\n* Attention: ${attention}\n* Insight Rating: Grade ${insight} / 6\n* Clinical Judgment: ${judgment}\n* Descriptive annotations: ${comments}`;

            try {
                const result = await GeminiService.callGemini(prompt, "You are an expert clinical psychologist writing formal Mental Status Exam summaries.");
                mseResultText.textContent = result;
                mseResultCard.style.display = 'block';

                Database.insertClinicalNote({
                    patientId: this.activePatientId,
                    title: "Mental Status Exam Narrative",
                    noteType: "MSE",
                    bodyJson: `Mental Status Examination (Structured Narrative):\n\n${result}\n\n[Checklist Details]\nAppearance: ${appearance} | Behavior: ${behavior} | Speech: ${speech} | Mood: ${mood} | Insight: Grade ${insight} | Judgment: ${judgment}`
                });
            } catch (e) {
                alert(`Error synthesizing MSE: ${e.message}`);
            } finally {
                compileMseBtn.disabled = false;
                compileMseBtn.innerHTML = `<i class="fa-solid fa-arrows-spin"></i> AI-Assist: Synthesize Prose Narrative`;
            }
        });

        // 9. Diagnostics Checklists Events (Live Evaluator)
        const dsmModeBtn = document.getElementById('diag-mode-dsm-btn');
        const mockModeBtn = document.getElementById('diag-mode-mock-btn');
        const dsmPanel = document.getElementById('diagnostics-dsm-inputs');
        const mockPanel = document.getElementById('diagnostics-mock-inputs');

        dsmModeBtn.addEventListener('click', () => {
            dsmModeBtn.classList.remove('secondary');
            mockModeBtn.classList.add('secondary');
            dsmPanel.style.display = 'block';
            mockPanel.style.display = 'none';
            this.runDiagnosticsLiveEvaluation();
        });

        mockModeBtn.addEventListener('click', () => {
            mockModeBtn.classList.remove('secondary');
            dsmModeBtn.classList.add('secondary');
            mockPanel.style.display = 'grid';
            dsmPanel.style.display = 'none';
            this.runDiagnosticsLiveEvaluation();
        });

        // Seed check boxes
        this.seedDiagnosticsCheckboxes();

        // 10. ClinicalTrials.gov connector
        const queryTrialsBtn = document.getElementById('query-trials-btn');
        const trialsStack = document.getElementById('trials-results-stack');
        
        queryTrialsBtn.addEventListener('click', async () => {
            const patients = Database.getPatients();
            const pat = patients.find(p => p.id === this.activePatientId) || patients[0];
            const specialty = pat.specialty;

            let condition = specialty;
            if (specialty.toLowerCase().includes("depres")) condition = "Major Depressive Disorder";
            if (specialty.toLowerCase().includes("anxiety")) condition = "Generalized Anxiety Disorder";
            if (specialty.toLowerCase().includes("adhd")) condition = "ADHD";
            if (specialty.toLowerCase().includes("ptsd")) condition = "PTSD";

            queryTrialsBtn.disabled = true;
            queryTrialsBtn.innerHTML = `<span class="loader-dual-ring"></span> Querying API...`;

            try {
                const trials = await ClinicalTrialsService.fetchActiveTrials(condition);
                trialsStack.style.display = 'block';
                if (trials.length === 0) {
                    trialsStack.innerHTML = `<p style="font-size:12px; color:gray; text-align:center; padding:10px;">No studies found matching target condition.</p>`;
                } else {
                    trialsStack.innerHTML = trials.map(tr => `
                        <div style="border-bottom: 1px dashed var(--color-border); padding: 8px 0; font-size:12px;">
                            <div style="display:flex; justify-content:space-between; font-weight:700;">
                                <span style="color:var(--color-primary);">${tr.nctId}</span>
                                <span class="badge-text-tag recruiting">${tr.status}</span>
                            </div>
                            <div style="font-weight:600; margin: 4px 0;">${tr.title}</div>
                            <div style="color:var(--color-text-secondary); font-size:11px;">Conditions: ${tr.conditions}</div>
                        </div>
                    `).join('');
                }
                Database.logAudit("Query Clinical Trials", `Searched ClinicalTrials.gov for condition: ${condition}`);
            } catch (e) {
                alert(`Error: ${e.message}`);
            } finally {
                queryTrialsBtn.disabled = false;
                queryTrialsBtn.innerHTML = `Query Active Recruiting Trials`;
            }
        });

        // 11. Teletherapy Active call triggers
        const startCallBtn = document.getElementById('start-video-call-btn');
        const hangupCallBtn = document.getElementById('call-hangup-btn');
        const toggleMicBtn = document.getElementById('call-toggle-mic');
        const toggleRecBtn = document.getElementById('call-toggle-rec');
        const sendChatBtn = document.getElementById('call-send-chat-btn');
        const chatInput = document.getElementById('call-chat-input');
        const callSOAPBtn = document.getElementById('teletherapy-compile-soap-btn');

        startCallBtn.addEventListener('click', () => {
            document.getElementById('teletherapy-entry-panel').style.display = 'none';
            document.getElementById('teletherapy-call-panel').style.display = 'block';
            this.callActive = true;
            Database.logAudit("Initiated Video Session", "Video telehealth session locked for room PSY-PYR-401.");
            
            // Toggle voice wave animation loops
            this.startVoiceWaveAnimation();
        });

        hangupCallBtn.addEventListener('click', () => {
            document.getElementById('teletherapy-call-panel').style.display = 'none';
            document.getElementById('teletherapy-entry-panel').style.display = 'block';
            document.getElementById('teletherapy-soap-result-card').style.display = 'none';
            this.callActive = false;
            this.stopVoiceWaveAnimation();
            Database.logAudit("Terminated Video Session", "Session room PSY-PYR-401 closed.");
        });

        toggleMicBtn.addEventListener('click', () => {
            this.micMuted = !this.micMuted;
            if (this.micMuted) {
                toggleMicBtn.classList.add('muted');
                toggleMicBtn.innerHTML = `<i class="fa-solid fa-microphone-slash"></i>`;
            } else {
                toggleMicBtn.classList.remove('muted');
                toggleMicBtn.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
            }
        });

        toggleRecBtn.addEventListener('click', () => {
            this.recordingEnabled = !this.recordingEnabled;
            if (this.recordingEnabled) {
                toggleRecBtn.classList.add('active');
            } else {
                toggleRecBtn.classList.remove('active');
            }
        });

        sendChatBtn.addEventListener('click', () => {
            const val = chatInput.value.trim();
            if (!val) return;
            const prefix = this.activeRole === "Professional" ? "Dr. Brewster" : "Liam";
            this.callChatLogs.push(`${prefix}: ${val}`);
            chatInput.value = "";
            this.renderTeletherapy();
        });
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatBtn.click();
        });

        callSOAPBtn.addEventListener('click', async () => {
            const transcript = this.callChatLogs.join("\n");
            callSOAPBtn.disabled = true;
            callSOAPBtn.innerHTML = `<span class="loader-dual-ring"></span> Autowriting Note...`;

            try {
                const prompt = `Compile the following session conversation transcript into a structured, formal healthcare SOAP note.\nInclude SUBJECTIVE, OBJECTIVE, ASSESSMENT, and PLAN. Keep and suggest matching diagnoses (such as DSM-5/ICD-10 codes) based on indicators.\n\nTranscript:\n"${transcript}"`;
                const result = await GeminiService.callGemini(prompt, "You are a clinical psychologist assistant compiling telehealth SOAP summaries.");
                
                document.getElementById('teletherapy-soap-result-text').textContent = result;
                document.getElementById('teletherapy-soap-result-card').style.display = 'block';

                Database.insertClinicalNote({
                    patientId: this.activePatientId,
                    title: "AI SOAP Copilot Output",
                    noteType: "SOAP",
                    bodyJson: result
                });
            } catch (e) {
                alert(`Error: ${e.message}`);
            } finally {
                callSOAPBtn.disabled = false;
                callSOAPBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Auto-Compile AI Meeting SOAP Note`;
            }
        });

        // 12. Planner Screen smart goals
        const formulatePlanBtn = document.getElementById('planner-formulate-btn');
        const planResultCard = document.getElementById('planner-result-card');
        const planResultText = document.getElementById('planner-result-text');
        
        formulatePlanBtn.addEventListener('click', async () => {
            const title = document.getElementById('planner-goal-title').value.trim();
            const desc = document.getElementById('planner-goal-desc').value.trim();
            if (!title) return;

            formulatePlanBtn.disabled = true;
            formulatePlanBtn.innerHTML = `<span class="loader-dual-ring"></span> Autoplanning...`;

            const prompt = `Convert this basic mental health therapy goal into a comprehensive clinical treatment plan following clinical standards:\n\nGoal: "${title}"\nContext: "${desc}"\n\nOutput:\n1. Specific, Measurable, Achievable, Relevant, and Time-bound (SMART) Goal configuration.\n2. Evidence-Based Clinical Interventions.\n3. Concrete homework assignments.\n4. Progress tracking milestones.`;

            try {
                const result = await GeminiService.callGemini(prompt, "You are a cognitive behavioral therapist (CBT) treatment planner.");
                planResultText.textContent = result;
                planResultCard.style.display = 'block';

                Database.insertClinicalNote({
                    patientId: this.activePatientId,
                    title: `Treatment Plan: ${title}`,
                    noteType: "PLAN",
                    bodyJson: result
                });
            } catch (e) {
                alert(`Error: ${e.message}`);
            } finally {
                formulatePlanBtn.disabled = false;
                formulatePlanBtn.innerHTML = `<i class="fa-solid fa-brain"></i> Auto-Formulate SMART Details`;
            }
        });

        // Add Homework assignments
        const assignHwBtn = document.getElementById('planner-assign-hw-btn');
        assignHwBtn.addEventListener('click', () => {
            const input = document.getElementById('planner-hw-input');
            const desc = input.value.trim();
            if (!desc) return;

            Database.insertHomework({
                patientId: this.activePatientId,
                description: desc
            });
            input.value = "";
        });
        document.getElementById('planner-hw-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') assignHwBtn.click();
        });

        // 13. Assessments questionnaire layout dynamically
        this.renderInteractiveAssessmentsSliders();

        // 14. Wellness lounge timers
        const meditateBtn = document.getElementById('meditation-toggle-btn');
        meditateBtn.addEventListener('click', () => {
            this.toggleMeditationTimer();
        });

        const breathBtn = document.getElementById('breathing-toggle-btn');
        breathBtn.addEventListener('click', () => {
            this.toggleBreathingMandala();
        });

        const logMoodBtn = document.getElementById('mood-log-submit-btn');
        logMoodBtn.addEventListener('click', () => {
            const score = Number(document.getElementById('mood-score-slider').value);
            const gratitude = document.getElementById('mood-gratitude-input').value.trim();
            
            Database.insertMoodLog({
                moodScore: score,
                moodNote: "Self-logged checklist entry.",
                gratitude: gratitude,
                breathingSeconds: this.breathingActive ? 240 : 0
            });

            const toast = document.getElementById('mood-log-toast-prompt');
            toast.innerText = "Logged entry successfully in local secure vault.";
            setTimeout(() => { toast.innerText = ""; }, 3000);
        });

        document.getElementById('mood-score-slider').addEventListener('input', (e) => {
            document.getElementById('mood-score-slider-display').innerText = e.target.value;
        });
    }

    // Role switcher
    static switchRole(role) {
        this.activeRole = role;
        this.activeScreen = "Dashboard";
        
        // Clear outputs
        this.callChatLogs = [
            "Dr. Brewster: Hi Liam. Glad you joined. We'll check your GAD-7 metrics today.",
            "Liam: Yes, corporative stress was high this past week but practiced somatic breathing."
        ];

        Database.logAudit("Switched Role Mode", `Role set to ${role}. Permissions applied.`);
        this.renderAll();
    }

    static lockSession() {
        document.getElementById('main-app-container').style.display = 'none';
        document.getElementById('biometric-lock-screen').style.display = 'flex';
        document.getElementById('lock-scanner-trigger').querySelector('.biometric-icon').removeAttribute('style');
        document.getElementById('lock-scanner-trigger').removeAttribute('style');
        
        // Stop any running animations or timers
        if (this.meditationRunning) this.toggleMeditationTimer();
        if (this.breathingActive) this.toggleBreathingMandala();
        this.stopVoiceWaveAnimation();
        this.callActive = false;
        document.getElementById('teletherapy-call-panel').style.display = 'none';
        document.getElementById('teletherapy-entry-panel').style.display = 'block';

        Database.logAudit("Biometric Session Locked", "EHR cryptographic session locked by user.");
    }

    // Dynamic text descriptions helpers
    static getInsightGradeDescription(grade) {
        switch (grade) {
            case 1: return "Complete denial of illness.";
            case 2: return "Slight awareness but denying.";
            case 3: return "Awareness but blaming external factors.";
            case 4: return "Intellectual awareness (knows he is ill but no changes).";
            case 5: return "True intellectual insight.";
            case 6: return "True emotional insight with deep somatic action.";
            default: return "";
        }
    }

    // Modal appointment builder
    static renderAddAppointmentModal() {
        const patients = Database.getPatients();
        const container = document.getElementById('add-appt-patient-scroll');
        
        container.innerHTML = patients.map((pat, idx) => `
            <button class="patient-filter-chip ${idx === 0 ? 'active' : ''}" data-id="${pat.id}">${pat.name}</button>
        `).join('');

        container.querySelectorAll('.patient-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                container.querySelectorAll('.patient-filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            });
        });
    }

    // Checkboxes configuration for diagnostics
    static seedDiagnosticsCheckboxes() {
        const mddSymptoms = [
            ["depressed_mood", "Depressed mood / sadness"],
            ["anhedonia", "Loss of interest or pleasure (Anhedonia)"],
            ["appetite_change", "Weight or appetite change"],
            ["insomnia", "Insomnia or hypersomnia"],
            ["psychomotor", "Psychomotor agitation or retardation"],
            ["fatigue", "Fatigue or loss of energy"],
            ["worthlessness", "Feelings of worthlessness or guilt"],
            ["concentration_difficulty", "Concentration difficulty or indecisiveness"],
            ["suicidal_ideation", "Thoughts of death or suicidal ideation"]
        ];

        const gadSymptoms = [
            ["excessive_anxiety", "Excessive anxiety / worry (more days than not)"],
            ["restlessness", "Restlessness or feeling keyed up/on edge"],
            ["fatigue", "Being easily fatigued"],
            ["concentration_difficulty", "Difficulty concentrating or mind going blank"],
            ["irritability", "Irritability"],
            ["muscle_tension", "Muscle tension"],
            ["sleep_disturbance", "Sleep disturbance"]
        ];

        const exclusions = [
            ["No physiological substance attribution", "Not attributable to substance physiological effects"],
            ["No medical condition attribution", "Not attributable to other medical conditions"],
            ["No manic/hypomanic history", "No history of manic/hypomanic episodes"]
        ];

        const mockBasic = [
            "Above 18", "Above 21", "1 year", "6 months",
            "Not attributable to Physiological conditions",
            "Not better explained by other Physiological conditions"
        ];

        const mockSymptoms = [
            "PDss1", "PDss2", "PDss3", "PDss4", "PDss5", "PDss6",
            "CDss1", "CDss2",
            "HDss1", "HDss2", "HDss3", "HDss4", "HDss5", "HDss6"
        ];

        // Inject and bind live listener
        const bindTrigger = (box, html) => {
            box.innerHTML = html;
            box.querySelectorAll('input').forEach(chk => {
                chk.addEventListener('change', () => this.runDiagnosticsLiveEvaluation());
            });
        };

        const mddHtml = mddSymptoms.map(s => `
            <label class="checkbox-option-row">
                <input type="checkbox" class="checkbox-control" value="${s[0]}">
                <span class="checkbox-label">${s[1]}</span>
            </label>
        `).join('');
        bindTrigger(document.getElementById('dsm-mdd-checklist-box'), mddHtml);

        const gadHtml = gadSymptoms.map(s => `
            <label class="checkbox-option-row">
                <input type="checkbox" class="checkbox-control" value="${s[0]}">
                <span class="checkbox-label">${s[1]}</span>
            </label>
        `).join('');
        bindTrigger(document.getElementById('dsm-gad-checklist-box'), gadHtml);

        const exclusionsHtml = exclusions.map(s => `
            <label class="checkbox-option-row">
                <input type="checkbox" class="checkbox-control" value="${s[0]}" checked>
                <span class="checkbox-label">${s[1]}</span>
            </label>
        `).join('');
        bindTrigger(document.getElementById('dsm-exclusions-box'), exclusionsHtml);

        const mockBasicHtml = mockBasic.map(s => `
            <label class="checkbox-option-row">
                <input type="checkbox" class="checkbox-control" value="${s}">
                <span class="checkbox-label">${s}</span>
            </label>
        `).join('');
        bindTrigger(document.getElementById('mock-basic-checklist-box'), mockBasicHtml);

        const mockSymptomsHtml = mockSymptoms.map(s => `
            <label class="checkbox-option-row">
                <input type="checkbox" class="checkbox-control" value="${s}">
                <span class="checkbox-label">${s}</span>
            </label>
        `).join('');
        bindTrigger(document.getElementById('mock-symptoms-checklist-box'), mockSymptomsHtml);

        // Bind slider
        document.getElementById('dsm-duration-slider').addEventListener('input', (e) => {
            document.getElementById('dsm-duration-weeks-display').innerText = `${e.target.value} weeks`;
            this.runDiagnosticsLiveEvaluation();
        });
    }

    // Assessments Builder Sliders
    static renderInteractiveAssessmentsSliders() {
        const standards = ["PHQ-9", "GAD-7", "DASS-21", "BDI"];
        const chipsContainer = document.getElementById('assessments-standards-chips');
        
        chipsContainer.innerHTML = standards.map(std => `
            <button class="patient-filter-chip ${std === this.selectedAssessment ? 'active' : ''}" data-std="${std}">${std} Questionnaire</button>
        `).join('');

        chipsContainer.querySelectorAll('.patient-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.selectedAssessment = chip.getAttribute('data-std');
                this.renderInteractiveAssessmentsSliders();
            });
        });

        // Set questions
        let questions = [];
        if (this.selectedAssessment === "PHQ-9" || this.selectedAssessment === "BDI") {
            questions = [
                "1. Little interest or pleasure in doing things?",
                "2. Feeling down, depressed, or hopeless?",
                "3. Trouble falling or staying asleep, or sleeping too much?",
                "4. Feeling tired or having little energy?"
            ];
        } else if (this.selectedAssessment === "GAD-7") {
            questions = [
                "1. Feeling nervous, anxious or on edge?",
                "2. Not being able to stop or control worrying?",
                "3. Worrying too much about different things?",
                "4. Trouble relaxing?"
            ];
        } else {
            // DASS
            questions = [
                "1. Found it hard to wind down?",
                "2. Was aware of dryness of mouth?",
                "3. Couldn't seem to experience any positive feeling?",
                "4. Experienced breathing difficulty?"
            ];
        }

        const formContainer = document.getElementById('assessments-form-container');
        formContainer.innerHTML = `
            <div style="font-weight:700; color:var(--color-primary); margin-bottom: 12px;">${this.selectedAssessment} Diagnostic Module</div>
            ${questions.map((q, idx) => `
                <div class="interactive-slider-row" style="margin-bottom:16px;">
                    <label class="form-label" style="font-weight: 500;">${q}</label>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <input type="range" class="slider-control-field assessment-q-slider" data-idx="${idx}" min="0" max="3" value="0" style="flex-grow:1;">
                        <span class="assessment-q-slider-val" data-idx="${idx}" style="font-weight:700; font-size:11px; width:100px; color:var(--color-primary);">Never</span>
                    </div>
                </div>
            `).join('')
        `;

        // Add Listeners to sliders
        const updateScores = () => {
            let total = 0;
            formContainer.querySelectorAll('.assessment-q-slider').forEach(sl => {
                const val = Number(sl.value);
                total += val;
                
                // Update text
                let label = "Never";
                if (val === 1) label = "Several Days";
                if (val === 2) label = "More than half";
                if (val === 3) label = "Nearly daily";
                
                const idx = sl.getAttribute('data-idx');
                formContainer.querySelector(`.assessment-q-slider-val[data-idx="${idx}"]`).innerText = label;
            });

            // Display Score
            document.getElementById('assessment-numeric-score').innerText = total;
            
            const severityEl = document.getElementById('assessment-severity-text');
            const scoreCard = document.getElementById('assessments-score-card');
            
            let severity = "Minimal clinical traits";
            let color = "var(--color-success)";
            if (total > 8) {
                severity = "Severe clinical conditions. Direct to professional review.";
                color = "var(--color-error)";
            } else if (total > 5) {
                severity = "Moderate clinical severity";
                color = "var(--color-warning)";
            } else if (total > 3) {
                severity = "Mild clinical levels";
                color = "var(--color-primary)";
            }

            severityEl.innerText = severity;
            severityEl.style.color = color;
            scoreCard.style.borderColor = color;
            scoreCard.style.background = `rgba(${color === 'var(--color-error)' ? '239, 68, 68' : color === 'var(--color-success)' ? '16, 185, 129' : '59, 130, 246'}, 0.05)`;
        };

        formContainer.querySelectorAll('.assessment-q-slider').forEach(sl => {
            sl.addEventListener('input', updateScores);
        });

        // Initialize score display
        updateScores();

        // Bind DB Save log
        const saveBtn = document.getElementById('assessment-save-db-btn');
        // Unbind old listeners
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.replaceWith(newSaveBtn);
        
        newSaveBtn.addEventListener('click', () => {
            const scoreVal = Number(document.getElementById('assessment-numeric-score').innerText);
            const severityText = document.getElementById('assessment-severity-text').innerText;
            
            Database.insertAssessmentScore({
                patientId: this.activePatientId,
                type: this.selectedAssessment,
                score: scoreVal,
                details: severityText
            });
            alert("Score saved to offline database successfully!");
        });
    }

    // SOMATIC BREATHING ANIMATION PACER
    static toggleBreathingMandala() {
        const circle = document.getElementById('mandala-breathing-circle');
        const text = document.getElementById('mandala-breathing-text');
        const btn = document.getElementById('breathing-toggle-btn');

        if (this.breathingActive) {
            // Stop pacer
            this.breathingActive = false;
            clearInterval(this.breathingInterval);
            circle.className = "mandala-pacer-outer";
            text.innerText = "INHALE";
            btn.innerText = "Start Somatic Restructuring";
        } else {
            // Start pacer
            this.breathingActive = true;
            btn.innerText = "Stop Guidance";
            
            let phase = 0; // 0: inhale, 1: hold, 2: exhale, 3: hold
            const runBreathingCycle = () => {
                if (phase === 0) {
                    circle.className = "mandala-pacer-outer inhaling";
                    text.innerText = "INHALE";
                    phase = 1;
                } else if (phase === 1) {
                    text.innerText = "HOLD";
                    phase = 2;
                } else if (phase === 2) {
                    circle.className = "mandala-pacer-outer exhaling";
                    text.innerText = "EXHALE";
                    phase = 3;
                } else {
                    text.innerText = "HOLD";
                    phase = 0;
                }
            };
            
            runBreathingCycle(); // First tick
            this.breathingInterval = setInterval(runBreathingCycle, 4000); // 4 seconds intervals
        }
    }

    // MEDITATION COUNTDOWN CLOCK
    static toggleMeditationTimer() {
        const btn = document.getElementById('meditation-toggle-btn');
        if (this.meditationRunning) {
            this.meditationRunning = false;
            clearInterval(this.meditationInterval);
            btn.innerText = "Meditate";
            btn.classList.remove('danger');
        } else {
            this.meditationRunning = true;
            btn.innerText = "Pause";
            btn.classList.add('danger');
            
            this.meditationInterval = setInterval(() => {
                if (this.meditationSeconds > 0) {
                    this.meditationSeconds--;
                    this.updateMeditationClock();
                } else {
                    this.toggleMeditationTimer();
                    this.meditationSeconds = 300; // Reset
                    this.updateMeditationClock();
                    alert("Meditation session completed. Great work focusing on wellness.");
                }
            }, 1000);
        }
    }

    static updateMeditationClock() {
        const display = document.getElementById('meditation-clock-display');
        if (!display) return;
        const mins = Math.floor(this.meditationSeconds / 60);
        const secs = this.meditationSeconds % 60;
        display.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // TELEHEALTH VOICE WAVE ANIMATION
    static startVoiceWaveAnimation() {
        const waves = document.getElementById('voice-waves');
        if (!waves) return;
        
        this.voiceWavesInterval = setInterval(() => {
            waves.querySelectorAll('.waveform-wave-bar').forEach(bar => {
                // Random scale heights
                const scale = Math.random() * 1.5 + 0.3;
                bar.style.transform = `scaleY(${scale})`;
            });
        }, 150);
    }

    static stopVoiceWaveAnimation() {
        clearInterval(this.voiceWavesInterval);
        const waves = document.getElementById('voice-waves');
        if (waves) {
            waves.querySelectorAll('.waveform-wave-bar').forEach(bar => {
                bar.style.transform = `scaleY(1)`;
            });
        }
    }
}
export default UI;
