import { useState, useEffect, useCallback } from 'react';
import { Database } from './services/db';
import { WebSocketConn } from './services/websocket';
import { SSESubscriber } from './services/sse';
import { ToastProvider, useToast } from './components/ToastProvider';
import { CommandPalette } from './components/CommandPalette';
import { useSyncToServer } from './hooks/useSyncToServer';
// PsychConnect Components & Services

import SocialFeed from './psychconnect/components/SocialFeed';
import Directory from './psychconnect/components/Directory';
import Consultations from './psychconnect/components/Consultations';
import Messages from './psychconnect/components/Messages';
import CareBoard from './psychconnect/components/CareBoard';
import ProgressTracker from './psychconnect/components/ProgressTracker';
import ResourceLibrary from './psychconnect/components/ResourceLibrary';
import CrisisSupportModal from './psychconnect/components/CrisisSupportModal';

import { auth, db } from './psychconnect/services/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { 
  seedDefaultPostsIfEmpty, 
  saveUserProfile, 
  getUserProfile, 
  createPost, 
  likePostInFirebase, 
  createAppointmentInFirebase,
  addChatMessageToFirebase,
  concludeAppointmentInFirebase,
  updateAppointmentStatusInFirebase,
  saveAppointmentFeedbackInFirebase
} from './psychconnect/services/firebaseStore';
import { MOCK_POSTS, MOCK_PSYCHOLOGISTS, MOCK_PATIENT, INITIAL_APPOINTMENTS } from './psychconnect/services/data';


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
import { CaseHistoryMSE } from './components/screens/CaseHistoryMSE';
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
import { IntakeFormsWorkspace } from './components/screens/IntakeFormsWorkspace';
import { IntegrationHub } from './components/screens/IntegrationHub';
import { RdocMatrixExplorer } from './components/screens/RdocMatrixExplorer';
import { HitopMatrixExplorer } from './components/screens/HitopMatrixExplorer';
import { CareRequests } from './components/screens/CareRequests';


function MainAppContent() {
    const { showToast } = useToast();

    const [showLanding, setShowLanding] = useState(true);
    const [isLocked, setIsLocked] = useState(true);
    const [activeRole, setActiveRole] = useState('Professional'); // 'Professional' or 'Patient'
    const [activeScreen, setActiveScreen] = useState('Dashboard');
    const [activePatientId, setActivePatientId] = useState(1);
    const [theme, setTheme] = useState(() => localStorage.getItem('psypyrus_theme') || 'dark-onyx');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [apptModalOpen, setApptModalOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    // Database arrays
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);

    // Initialize WebSockets and SSE subscriptions on mount
    useEffect(() => {
        WebSocketConn.connect();
        
        const handleNotification = (e) => {
            const noti = e.detail;
            showToast(`[SSE Notification] ${noti.message}`, "info");
        };
        
        window.addEventListener('psypyrus_sse_notification', handleNotification);
        SSESubscriber.subscribe(() => {});
        
        return () => {
            WebSocketConn.disconnect();
            window.removeEventListener('psypyrus_sse_notification', handleNotification);
            SSESubscriber.unsubscribe();
        };
    }, [showToast]);

    // --- PsychConnect Core State & Sync Hooks ---
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [pcCurrentUser, setPcCurrentUser] = useState(null);
    const [posts, setPosts] = useState(MOCK_POSTS);
    const [pcAppointments, setPcAppointments] = useState(INITIAL_APPOINTMENTS);
    const [isCrisisSupportOpen, setIsCrisisSupportOpen] = useState(false);

    // Cloud sync hook — auto-syncs local data to sync-service when signed in
    const { isSyncing, lastSyncAt, syncError, triggerSync } = useSyncToServer(firebaseUser);

    // Show toast notifications for sync events
    useEffect(() => {
        if (syncError) {
            showToast(`Cloud sync warning: ${syncError}`, 'error');
        }
    }, [syncError, showToast]);

    useEffect(() => {
        if (lastSyncAt) {
            showToast(`Local data synced to cloud — ${lastSyncAt.toLocaleTimeString()}`, 'success');
        }
    }, [lastSyncAt, showToast]);

    // Auth changed hook
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            if (user) {
                seedDefaultPostsIfEmpty();
                const cloudProfile = await getUserProfile(user.uid);
                if (cloudProfile) {
                    setPcCurrentUser(cloudProfile);
                } else {
                    const defaultProf = {
                        id: user.uid,
                        name: user.displayName || "Google User",
                        email: user.email || "",
                        avatar: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
                        role: activeRole === 'Professional' ? 'psychologist' : 'patient',
                        bio: "Welcome to my clinical mental health dashboard on PsychConnect."
                    };
                    await saveUserProfile(defaultProf);
                    setPcCurrentUser(defaultProf);
                }
            } else {
                setPcCurrentUser(null);
            }
        });
        return () => unsubscribeAuth();
    }, [activeRole]);

    // Sync feed posts from cloud
    useEffect(() => {
        const postsCol = collection(db, "posts");
        const unsubscribePosts = onSnapshot(postsCol, (snapshot) => {
            if (!snapshot.empty) {
                const loadedPosts = [];
                snapshot.forEach((doc) => {
                    loadedPosts.push(doc.data());
                });
                loadedPosts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setPosts(loadedPosts);
            }
        }, (err) => {
            console.warn("Real-time posts subscription using standard mock backup:", err);
        });
        return () => unsubscribePosts();
    }, [firebaseUser]);

    // Sync appointments from cloud
    useEffect(() => {
        if (!firebaseUser) return;
        
        const qPatient = query(collection(db, "appointments"), where("patientId", "==", firebaseUser.uid));
        const unsubscribePatient = onSnapshot(qPatient, (snapshot) => {
            const pAppts = [];
            snapshot.forEach((doc) => {
                pAppts.push(doc.data());
            });
            setPcAppointments((prev) => {
                const otherAndEmpty = prev.filter(a => a.patientId !== firebaseUser.uid && a.psychologistId !== firebaseUser.uid);
                return [...otherAndEmpty, ...pAppts].sort((a,b) => b.id.localeCompare(a.id));
            });
        }, (err) => {
            console.warn("Failed to subscribe to patient appointments:", err);
        });

        const qPsych = query(collection(db, "appointments"), where("psychologistId", "==", firebaseUser.uid));
        const unsubscribePsych = onSnapshot(qPsych, (snapshot) => {
            const psychAppts = [];
            snapshot.forEach((doc) => {
                psychAppts.push(doc.data());
            });
            setPcAppointments((prev) => {
                const otherAndEmpty = prev.filter(a => a.patientId !== firebaseUser.uid && a.psychologistId !== firebaseUser.uid);
                return [...otherAndEmpty, ...psychAppts].sort((a,b) => b.id.localeCompare(a.id));
            });
        }, (err) => {
            console.warn("Failed to subscribe to therapist appointments:", err);
        });

        return () => {
            if (unsubscribePatient) unsubscribePatient();
            if (unsubscribePsych) unsubscribePsych();
        };
    }, [firebaseUser]);

    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            showToast("Synced securely with Firebase Cloud Database!", "success");
        } catch (err) {
            console.error("Firebase Login Error:", err);
            showToast("Firebase login failed: " + err.message, "error");
        }
    };

    const handleGoogleSignOut = async () => {
        try {
            await signOut(auth);
            showToast("Cleared Cloud Database sync. Back to local sandbox.", "info");
        } catch (err) {
            console.error("Firebase Logout Error:", err);
        }
    };

    const computedPsychologists = MOCK_PSYCHOLOGISTS.map((psych) => {
        const apptFeedbacks = pcAppointments
            .filter((a) => a.psychologistId === psych.id && a.feedback)
            .map((a) => ({
                id: `feed_${a.id}`,
                patientName: a.feedback.anonymous ? "Anonymous Patient" : a.patientName,
                rating: a.feedback.rating,
                comment: a.feedback.comment,
                date: a.feedback.submittedAt.split("T")[0]
            }));
        if (apptFeedbacks.length === 0) return psych;
        const baseRatings = psych.ratings || [];
        const uniqueApptFeedbacks = apptFeedbacks.filter(
            (feedback) => !baseRatings.some((r) => r.id === feedback.id)
        );
        const allRatings = [...baseRatings, ...uniqueApptFeedbacks];
        const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
        const ratingAverage = parseFloat((totalRating / allRatings.length).toFixed(1));
        return { ...psych, ratings: allRatings, ratingAverage };
    });

    const activePatientObj = patients.find(p => p.id === Number(activePatientId)) || patients[0];
    const clinicianProfile = {
        id: "dr_liam",
        name: "Dr. Liam Carter",
        role: "psychologist",
        email: "liam.carter@psypyrus.org",
        avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
        bio: "Lead Clinician in PsyPyrus OS."
    };
    const patientProfile = {
        id: activePatientObj ? `patient_${activePatientObj.id}` : "patient_user",
        name: activePatientObj ? activePatientObj.name : "Liam Carter",
        role: "patient",
        email: activePatientObj ? activePatientObj.email : "liam@carter.com",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        bio: "Active client on PsyPyrus."
    };

    const localCurrentUser = activeRole === 'Professional' ? clinicianProfile : patientProfile;
    const currentUser = pcCurrentUser || localCurrentUser;

    const allUsers = firebaseUser
        ? [currentUser, localCurrentUser, ...computedPsychologists]
        : [localCurrentUser, ...computedPsychologists];

    const wrappedSetPosts = (updater) => {
        setPosts((prevPosts) => {
            const nextPosts = typeof updater === "function" ? updater(prevPosts) : updater;
            if (firebaseUser) {
                for (const nextP of nextPosts) {
                    const prevP = prevPosts.find((p) => p.id === nextP.id);
                    if (!prevP) {
                        createPost(nextP);
                    } else {
                        const isLikeDiff = JSON.stringify(prevP.likedBy) !== JSON.stringify(nextP.likedBy);
                        const isCommentDiff = JSON.stringify(prevP.comments) !== JSON.stringify(nextP.comments);
                        if (isLikeDiff) {
                            const alreadyLiked = prevP.likedBy.includes(currentUser.id);
                            likePostInFirebase(nextP.id, currentUser.id, !alreadyLiked);
                        } else if (isCommentDiff) {
                            const postRef = doc(db, "posts", nextP.id);
                            updateDoc(postRef, { comments: nextP.comments }).catch((err) => {
                                console.error("Failed to write comment to Firestore:", err);
                            });
                        }
                    }
                }
            }
            return nextPosts;
        });
    };

    const wrappedSetAppointments = (updater) => {
        setPcAppointments((prevAppts) => {
            const nextAppts = typeof updater === "function" ? updater(prevAppts) : updater;
            if (firebaseUser) {
                for (const nextA of nextAppts) {
                    const prevA = prevAppts.find((a) => a.id === nextA.id);
                    if (!prevA) {
                        createAppointmentInFirebase(nextA);
                    } else {
                        const isStatusDiff = prevA.status !== nextA.status;
                        const isChatDiff = JSON.stringify(prevA.chatHistory) !== JSON.stringify(nextA.chatHistory);
                        const isNotesDiff = prevA.clinicalNotes !== nextA.clinicalNotes || prevA.summaryPDF !== nextA.summaryPDF;
                        const isFeedbackDiff = JSON.stringify(prevA.feedback) !== JSON.stringify(nextA.feedback);
                        
                        if (isFeedbackDiff && nextA.feedback) {
                            saveAppointmentFeedbackInFirebase(nextA.id, nextA.feedback);
                        } else if (isNotesDiff && nextA.status === "completed") {
                            concludeAppointmentInFirebase(nextA.id, nextA.clinicalNotes || "", nextA.summaryPDF || "");
                        } else if (isChatDiff) {
                            const prevChat = prevA.chatHistory || [];
                            const nextChat = nextA.chatHistory || [];
                            if (nextChat.length > prevChat.length) {
                                const newMsg = nextChat[nextChat.length - 1];
                                addChatMessageToFirebase(nextA.id, newMsg);
                            }
                        } else if (isStatusDiff) {
                            updateAppointmentStatusInFirebase(nextA.id, nextA.status);
                        }
                    }
                }
            }
            return nextAppts;
        });
    };

    const refreshData = useCallback(() => {
        setPatients(Database.getPatients());
        setAppointments(Database.getAppointments());
    }, []);

    const handleLock = useCallback(() => {
        setIsLocked(true);
        Database.logAudit("Biometric Session Locked", "EHR cryptographic session locked by user.");
        showToast("Cryptographic session locked. Tap scanner to re-authenticate.", "warning");
    }, [showToast]);

    // Dynamic SEO Metadata Engine
    useEffect(() => {
        const displayRole = activeRole === 'Professional' ? 'Clinician' : 'Patient';
        document.title = `PsyPyrus AI - ${activeScreen} (${displayRole} Mode)`;

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            let desc = `PsyPyrus AI secure portal - ${activeScreen} screen. `;
            if (activeRole === 'Professional') {
                desc += `Clinician tools for DSM-5 diagnostics, SOAP notes copilot, and EHR patient records.`;
            } else {
                desc += `Patient workspace for wellness lounge exercises, self-assessments, and gamification rewards.`;
            }
            metaDescription.setAttribute('content', desc);
        }
    }, [activeScreen, activeRole]);

    useEffect(() => {
        refreshData();
        window.addEventListener('psypyrus_db_change', refreshData);

        // Listen to gamification toasts
        const handleToast = (e) => {
            if (e.detail && e.detail.message) {
                showToast(e.detail.message, e.detail.type || 'info');
            }
        };
        window.addEventListener('psypyrus_toast', handleToast);

        // Sync active role to localStorage
        localStorage.setItem('psypyrus_active_role', activeRole);
        
        // Listen to Electron lock-session event
        let unsubscribeLock;
        if (window.electronAPI && typeof window.electronAPI.onLockSession === 'function') {
            unsubscribeLock = window.electronAPI.onLockSession(() => {
                handleLock();
            });
        }

        return () => {
            window.removeEventListener('psypyrus_db_change', refreshData);
            window.removeEventListener('psypyrus_toast', handleToast);
            if (unsubscribeLock) unsubscribeLock();
        };
    }, [handleLock, refreshData, activeRole, showToast]);

    // Theme manager
    useEffect(() => {
        const themeClasses = ['theme-dark-onyx', 'theme-light', 'theme-retro-crt', 'theme-glassmorphic', 'light-theme'];
        themeClasses.forEach(tc => document.body.classList.remove(tc));
        
        document.body.classList.add(`theme-${theme}`);
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        }
        localStorage.setItem('psypyrus_theme', theme);
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
    }, [handleLock]);

    const handleUnlock = () => {
        setIsLocked(false);
        showToast("Session decrypted. Access granted to EHR data vault.", "success");
    };

    const handleRoleChange = (role) => {
        setActiveRole(role);
        localStorage.setItem('psypyrus_active_role', role);
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
        const nextTheme = theme === 'light' ? 'dark-onyx' : 'light';
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
                case 'CH+MSE Workstation':
                    return (
                        <CaseHistoryMSE
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
                case 'Intake Forms':
                    return (
                        <IntakeFormsWorkspace
                            patients={patients}
                            activePatientId={activePatientId}
                            activeRole={activeRole}
                            onSetActivePatientId={handleSelectPatient}
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
                case 'Integration Hub':
                    return (
                        <IntegrationHub 
                            patients={patients}
                            activePatientId={activePatientId}
                            onSetActivePatientId={handleSelectPatient}
                        />
                    );
                case 'RDoC Matrix':
                    return (
                        <RdocMatrixExplorer 
                            patients={patients}
                            activePatientId={activePatientId}
                            onSetActivePatientId={handleSelectPatient}
                        />
                    );
                case 'HiTOP Matrix':
                    return (
                        <HitopMatrixExplorer 
                            patients={patients}
                            activePatientId={activePatientId}
                            onSetActivePatientId={handleSelectPatient}
                        />
                    );
                case 'Patient Intake Pool':
                    return (
                        <CareRequests 
                            activeRole={activeRole}
                            currentUser={currentUser}
                        />
                    );
                case 'HIPAA Shield':
                    return (
                        <HIPAASecurityShield />
                    );
                case 'Social Feed':
                    return (
                        <SocialFeed 
                            posts={posts} 
                            currentUser={currentUser} 
                            setPosts={wrappedSetPosts} 
                        />
                    );
                case 'Match & Book':
                    return (
                        <Directory
                            psychologists={computedPsychologists}
                            currentUser={currentUser}
                            appointments={pcAppointments}
                            setAppointments={wrappedSetAppointments}
                            setActiveTab={setActiveScreen}
                        />
                    );
                case 'PsychConnect Consultations':
                    return (
                        <Consultations
                            appointments={pcAppointments}
                            currentUser={currentUser}
                            setAppointments={wrappedSetAppointments}
                        />
                    );
                case 'PsychConnect Messages':
                    return (
                        <Messages 
                            currentUser={currentUser} 
                            allUsers={allUsers} 
                        />
                    );
                case 'Care Board':
                    return (
                        <CareBoard
                            currentUser={currentUser}
                            allUsers={allUsers}
                            setActiveTab={setActiveScreen}
                        />
                    );
                case 'Progress Tracker':
                    return (
                        <ProgressTracker
                            currentUser={currentUser}
                            allUsers={allUsers}
                        />
                    );
                case 'Resource Library':
                    return (
                        <ResourceLibrary
                            currentUser={currentUser}
                            allUsers={allUsers}
                        />
                    );
                case 'Social Feed':
                    return (
                        <SocialFeed 
                            posts={posts} 
                            currentUser={currentUser} 
                            setPosts={wrappedSetPosts} 
                        />
                    );
                case 'PsychConnect Matches':
                    return (
                        <Directory
                            psychologists={computedPsychologists}
                            currentUser={currentUser}
                            appointments={pcAppointments}
                            setAppointments={wrappedSetAppointments}
                            setActiveTab={setActiveScreen}
                        />
                    );
                case 'PsychConnect Consultations':
                    return (
                        <Consultations
                            appointments={pcAppointments}
                            currentUser={currentUser}
                            setAppointments={wrappedSetAppointments}
                        />
                    );
                case 'PsychConnect Messages':
                    return (
                        <Messages 
                            currentUser={currentUser} 
                            allUsers={allUsers} 
                        />
                    );
                case 'Care Board':
                    return (
                        <CareBoard
                            currentUser={currentUser}
                            allUsers={allUsers}
                            setActiveTab={setActiveScreen}
                        />
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
                case 'Intake Forms':
                    return (
                        <IntakeFormsWorkspace
                            patients={patients}
                            activePatientId={activePatientId}
                            activeRole={activeRole}
                            onSetActivePatientId={handleSelectPatient}
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
                case 'Social Feed':
                    return (
                        <SocialFeed 
                            posts={posts} 
                            currentUser={currentUser} 
                            setPosts={wrappedSetPosts} 
                        />
                    );
                case 'PsychConnect Matches':
                    return (
                        <Directory
                            psychologists={computedPsychologists}
                            currentUser={currentUser}
                            appointments={pcAppointments}
                            setAppointments={wrappedSetAppointments}
                            setActiveTab={setActiveScreen}
                        />
                    );
                case 'PsychConnect Consultations':
                    return (
                        <Consultations
                            appointments={pcAppointments}
                            currentUser={currentUser}
                            setAppointments={wrappedSetAppointments}
                        />
                    );
                case 'PsychConnect Messages':
                    return (
                        <Messages 
                            currentUser={currentUser} 
                            allUsers={allUsers} 
                        />
                    );
                case 'Care Board':
                    return (
                        <CareBoard
                            currentUser={currentUser}
                            allUsers={allUsers}
                            setActiveTab={setActiveScreen}
                        />
                    );
                case 'Support Requests':
                    return (
                        <CareRequests 
                            activeRole={activeRole}
                            currentUser={currentUser}
                        />
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
        <>
            {/* Immediate Emergency Crisis Panel */}
            {isCrisisSupportOpen && (
                <CrisisSupportModal
                    isOpen={isCrisisSupportOpen}
                    onClose={() => setIsCrisisSupportOpen(false)}
                    currentUser={currentUser}
                    allUsers={allUsers}
                    appointments={pcAppointments}
                    setAppointments={wrappedSetAppointments}
                    setActiveTab={setActiveScreen}
                />
            )}
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
                    firebaseUser={firebaseUser}
                    onGoogleSignIn={handleGoogleSignIn}
                    onGoogleSignOut={handleGoogleSignOut}
                    isSyncing={isSyncing}
                    lastSyncAt={lastSyncAt}
                    onTriggerSync={triggerSync}
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
                theme={theme}
                setTheme={setTheme}
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
        </>
    );
}

export default function App() {
    return (
        <ToastProvider>
            <MainAppContent />
        </ToastProvider>
    );
}
