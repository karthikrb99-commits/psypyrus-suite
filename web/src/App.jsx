import React, { useState, useEffect } from 'react';
import { Database } from './services/db';
import { ToastProvider, useToast } from './components/ToastProvider';
import { CommandPalette } from './components/CommandPalette';

// Layout Components
import { BiometricLock } from './components/BiometricLock';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SettingsDrawer } from './components/SettingsDrawer';
import { AddApptModal } from './components/AddApptModal';

// Screen Components
import { ClinicianDashboard } from './components/screens/ClinicianDashboard';
import { PatientDashboard } from './components/screens/PatientDashboard';
import { SOAPNotesCopilot } from './components/screens/SOAPNotesCopilot';
import { MentalStatusExam } from './components/screens/MentalStatusExam';
import { DiagnosticsSuite } from './components/screens/DiagnosticsSuite';
import { TelehealthSession } from './components/screens/TelehealthSession';
import { CBTGoalPlanner } from './components/screens/CBTGoalPlanner';
import { InteractiveAssessments } from './components/screens/InteractiveAssessments';
import { WellnessLounge } from './components/screens/WellnessLounge';
import { PerformanceAnalytics } from './components/screens/PerformanceAnalytics';
import { HIPAASecurityShield } from './components/screens/HIPAASecurityShield';
import { Marketplace } from './components/screens/Marketplace';
import { LandingPage } from './components/screens/LandingPage';
import { PatientDetail } from './components/screens/PatientDetail';

function MainAppContent() {
    const { showToast } = useToast();
    const [showLanding, setShowLanding] = useState(true);
    const [isLocked, setIsLocked] = useState(true);
    const [activeRole, setActiveRole] = useState('Professional'); // 'Professional' or 'Patient'
    const [activeScreen, setActiveScreen] = useState('Dashboard');
    const [activePatientId, setActivePatientId] = useState(1);
    const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [apptModalOpen, setApptModalOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    // Database arrays
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const refreshData = () => {
        setPatients(Database.getPatients());
        setAppointments(Database.getAppointments());
    };

    useEffect(() => {
        refreshData();
        window.addEventListener('psypyrus_db_change', refreshData);
        
        // Listen to Electron lock-session event
        let unsubscribeLock;
        if (window.electronAPI && typeof window.electronAPI.onLockSession === 'function') {
            unsubscribeLock = window.electronAPI.onLockSession(() => {
                handleLock();
            });
        }

        return () => {
            window.removeEventListener('psypyrus_db_change', refreshData);
            if (unsubscribeLock) unsubscribeLock();
        };
    }, []);

    // Theme manager
    useEffect(() => {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }, [theme]);

    // Keyboard shortcuts: Ctrl+K / Cmd+K -> Search, Ctrl+L / Cmd+L -> Lock
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setCommandPaletteOpen((prev) => !prev);
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                handleLock();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleUnlock = () => {
        setIsLocked(false);
        showToast("Session decrypted. Access granted to EHR data vault.", "success");
    };

    const handleLock = () => {
        setIsLocked(true);
        Database.logAudit("Biometric Session Locked", "EHR cryptographic session locked by user.");
        showToast("Cryptographic session locked. Tap scanner to re-authenticate.", "warning");
    };

    const handleRoleChange = (role) => {
        setActiveRole(role);
        setActiveScreen('Dashboard');
        if (role === 'Patient') {
            setActivePatientId(1); // Default patient target in patient mode
        }
        Database.logAudit("Switched Role Mode", `Role set to ${role}. Permissions applied.`);
        showToast(`Workspace persona switched to ${role} Mode.`, "info");
    };

    const handleRoleToggle = () => {
        const nextRole = activeRole === 'Professional' ? 'Patient' : 'Professional';
        handleRoleChange(nextRole);
    };

    const handleThemeToggle = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        showToast(`Display theme updated to ${nextTheme} mode.`, "info");
    };

    // Find current active patient details
    const activePatient = patients.find(p => p.id === activePatientId) || patients[0];
    const activePatientName = activePatient ? activePatient.name : 'Liam Carter';

    const handleSelectPatient = (patientId) => {
        setActivePatientId(patientId);
        showToast(`Active EHR Target changed to ${patients.find(p => p.id === patientId)?.name || 'Patient'}`, "info");
    };

    // Router for screens
    const renderScreen = () => {
        if (activeRole === 'Professional') {
            switch (activeScreen) {
                case 'Dashboard':
                    return (
                        <ClinicianDashboard 
                            patients={patients} 
                            appointments={appointments}
                            onNavigateToScreen={setActiveScreen}
                            onSetActivePatientId={handleSelectPatient}
                            onOpenApptModal={() => setApptModalOpen(true)}
                        />
                    );
                case 'Patient Detail':
                    return (
                        <PatientDetail 
                            patients={patients}
                            activePatientId={activePatientId}
                            onNavigateToScreen={setActiveScreen}
                            onSetActivePatientId={handleSelectPatient}
                        />
                    );
                case 'AI Copilot':
                    return (
                        <SOAPNotesCopilot 
                            patients={patients}
                            activePatientId={activePatientId}
                            onSetActivePatientId={handleSelectPatient}
                        />
                    );
                case 'Digital MSE':
                    return (
                        <MentalStatusExam 
                            patients={patients}
                            activePatientId={activePatientId}
                            onSetActivePatientId={handleSelectPatient}
                        />
                    );
                case 'Diagnostics':
                    return (
                        <DiagnosticsSuite 
                            patients={patients}
                            activePatientId={activePatientId}
                        />
                    );
                case 'Teletherapy':
                    return (
                        <TelehealthSession 
                            patients={patients}
                            activePatientId={activePatientId}
                            activeRole={activeRole}
                        />
                    );
                case 'Planner':
                    return (
                        <CBTGoalPlanner 
                            activePatientId={activePatientId}
                        />
                    );
                case 'Assessments':
                    return (
                        <InteractiveAssessments 
                            activePatientId={activePatientId}
                        />
                    );
                case 'Analytics':
                    return (
                        <PerformanceAnalytics />
                    );
                case 'Marketplace':
                    return (
                        <Marketplace 
                            activeRole={activeRole}
                            activePatientId={activePatientId}
                        />
                    );
                case 'HIPAA Shield':
                    return (
                        <HIPAASecurityShield />
                    );
                default:
                    return <div>Screen not found.</div>;
            }
        } else {
            // Patient screens
            switch (activeScreen) {
                case 'Dashboard':
                    return (
                        <PatientDashboard 
                            appointments={appointments}
                            activePatientId={activePatientId}
                            onNavigateToScreen={setActiveScreen}
                        />
                    );
                case 'Wellness':
                    return (
                        <WellnessLounge activePatientId={activePatientId} />
                    );
                case 'Assessments':
                    return (
                        <InteractiveAssessments 
                            activePatientId={activePatientId}
                        />
                    );
                case 'Teletherapy':
                    return (
                        <TelehealthSession 
                            patients={patients}
                            activePatientId={activePatientId}
                            activeRole={activeRole}
                        />
                    );
                case 'Marketplace':
                    return (
                        <Marketplace 
                            activeRole={activeRole}
                            activePatientId={activePatientId}
                        />
                    );
                case 'HIPAA Shield':
                    return (
                        <HIPAASecurityShield />
                    );
                default:
                    return <div>Screen not found.</div>;
            }
        }
    };

    if (showLanding) {
        return <LandingPage onEnterPortal={() => {
            setShowLanding(false);
            showToast("Welcome to PsyPyrus Secure Portal", "success");
        }} />;
    }

    if (isLocked) {
        return <BiometricLock onUnlock={handleUnlock} />;
    }

    return (
        <div className="app-container" id="main-app-container" style={{ display: 'flex' }}>
            <Sidebar 
                activeRole={activeRole}
                activeScreen={activeScreen}
                activePatientName={activePatientName}
                onScreenChange={setActiveScreen}
                onRoleToggle={handleRoleToggle}
                onLock={handleLock}
                onShowLanding={() => setShowLanding(true)}
            />

            <main className="workspace-wrapper">
                <Header 
                    activeRole={activeRole}
                    activeScreen={activeScreen}
                    theme={theme}
                    onRoleChange={handleRoleChange}
                    onThemeToggle={handleThemeToggle}
                    onSettingsOpen={() => setSettingsOpen(true)}
                    onLock={handleLock}
                    onShowLanding={() => setShowLanding(true)}
                    onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
                />

                <div className="content-canvas">
                    {renderScreen()}
                </div>
            </main>

            <SettingsDrawer 
                isOpen={settingsOpen}
                onClose={() => {
                    setSettingsOpen(false);
                    showToast("API configuration saved.", "success");
                }}
            />

            <AddApptModal 
                isOpen={apptModalOpen}
                onClose={() => setApptModalOpen(false)}
            />

            <CommandPalette
                isOpen={commandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
                activeRole={activeRole}
                onNavigate={setActiveScreen}
                patients={patients}
                onSelectPatient={handleSelectPatient}
            />
        </div>
    );
}

export default function App() {
    return (
        <ToastProvider>
            <MainAppContent />
        </ToastProvider>
    );
}

