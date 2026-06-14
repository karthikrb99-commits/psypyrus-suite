import { GeminiService } from "../../services/ai";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { createProgressLogInFirebase, createTherapyGoalInFirebase, updateTherapyGoalStatusInFirebase, deleteTherapyGoalInFirebase, createDailyHabitInFirebase, updateDailyHabitInFirebase, deleteDailyHabitInFirebase, createJournalEntryInFirebase } from "../services/firebaseStore";
import { db } from "../services/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Activity, Plus, Target, CheckCircle, Flame, ClipboardCheck, TrendingUp, Sparkles, Trash, Bell, Download, ChevronLeft, ChevronRight, Mic, MicOff, Copy, Calendar, X, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
export default function ProgressTracker({ currentUser, allUsers }) {
    const isPsychologist = currentUser.role === "psychologist";
    // Common patient selected for Psychologist view
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [patientsList, setPatientsList] = useState([]);
    // Real-time synced state
    const [logs, setLogs] = useState([]);
    const [goals, setGoals] = useState([]);
    const [connectedAssignments, setConnectedAssignments] = useState([]);
    const [habits, setHabits] = useState([]);
    const [newHabitName, setNewHabitName] = useState("");
    // Patient manual logging form inputs
    const [mood, setMood] = useState("Calm");
    const [somaticStress, setSomaticStress] = useState(4);
    const [panicSpikes, setPanicSpikes] = useState(0);
    const [symptoms, setSymptoms] = useState([]);
    const [saveSuccess, setSaveSuccess] = useState(false);
    // Voice journal & Custom States
    const [notes, setNotes] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [activeHistoryLog, setActiveHistoryLog] = useState(null);
    const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
    // AI Weekly Report States
    const [weeklyReport, setWeeklyReport] = useState("");
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportError, setReportError] = useState(null);
    // Active chart visualization tab state
    const [activeChartTab, setActiveChartTab] = useState("correlation");
    // Daily Mood & Gratitude Journaling states
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [journalMoodScore, setJournalMoodScore] = useState(8);
    const [journalMoodText, setJournalMoodText] = useState("Calm");
    const [journalGratitude, setJournalGratitude] = useState("");
    const [journalSuccess, setJournalSuccess] = useState(false);
    // State for synced journals
    const [journals, setJournals] = useState([]);
    // Function to save journal entries to Firestore
    const handleSaveJournalEntry = async (e) => {
        e.preventDefault();
        const activePatientId = isPsychologist ? selectedPatientId : currentUser.id;
        if (!activePatientId) {
            alert("No active patient scope target context resolved.");
            return;
        }
        const newEntry = {
            id: "journal_" + Date.now(),
            patientId: activePatientId,
            date: new Date().toISOString().split("T")[0],
            moodScore: Number(journalMoodScore),
            moodText: journalMoodText,
            gratitudeText: journalGratitude.trim(),
            timestamp: new Date().toISOString()
        };
        try {
            await createJournalEntryInFirebase(newEntry);
            setJournalSuccess(true);
            setJournalGratitude("");
            setTimeout(() => {
                setJournalSuccess(false);
                setShowJournalModal(false);
            }, 1500);
        }
        catch (err) {
            alert("Failed to save daily reflection journal slot. Firestore execution error.");
            console.error(err);
        }
    };
    const getWeeklyMoodTrendData = () => {
        // Collect last 7 days of logs and journals
        const now = new Date();
        const datesList = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const year = d.getFullYear();
            const month = d.toLocaleDateString("en-US", { month: "short" });
            const day = d.getDate();
            // Format to "Jun 12, 2026" to match somatic_logs formats exactly
            const formatted = `${month} ${day}, ${year}`;
            datesList.push(formatted);
        }
        return datesList.map(dateStr => {
            let scoreFound = null;
            // Look in logs
            const logToday = logs.find(l => l.date === dateStr);
            if (logToday) {
                scoreFound = getQuantifiedMoodScore(logToday.mood);
            }
            // Look in journals (if matches date substring e.g. "2026-06-12")
            // Convert dateStr like "Jun 12, 2026" to "2026-06-12" to match journal.date
            let ymd = "";
            try {
                const parsedD = new Date(dateStr);
                if (!isNaN(parsedD.getTime())) {
                    ymd = parsedD.toISOString().split("T")[0];
                }
            }
            catch { }
            const journalToday = journals.find(j => j.date === ymd);
            if (journalToday) {
                scoreFound = journalToday.moodScore;
            }
            let shortLabel = dateStr;
            try {
                const d = new Date(dateStr);
                shortLabel = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
            }
            catch { }
            return {
                dateStr,
                date: shortLabel,
                "Mood Score": scoreFound !== null ? scoreFound : 5 // fallback to 5
            };
        });
    };
    // Helper mapper helper for Quantified Mood rating (1-10)
    const getQuantifiedMoodScore = (moodStr) => {
        switch ((moodStr || "").toLowerCase()) {
            case "empowered": return 10;
            case "calm": return 8;
            case "balanced": return 6;
            case "tense": return 4;
            case "anxious": return 3;
            case "burnout": return 2;
            default: return 5;
        }
    };
    // Maps telemetry progress logs for past 30 days to Recharts schema
    const getMoodSymptomCorrelationData = () => {
        const sortedLogs = [...logs].reverse();
        // Filter to last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const last30DaysLogs = sortedLogs.filter(item => {
            try {
                const itemDate = new Date(item.date);
                return itemDate >= thirtyDaysAgo;
            }
            catch {
                return true;
            }
        });
        const dataset = last30DaysLogs.length > 0 ? last30DaysLogs : logs.slice(0, 15).reverse();
        return dataset.map(l => {
            let label = l.date;
            try {
                const d = new Date(l.date);
                if (!isNaN(d.getTime())) {
                    label = d.toLocaleDateString([], { month: "short", day: "numeric" });
                }
            }
            catch { }
            return {
                date: label,
                "Mood Score": getQuantifiedMoodScore(l.mood),
                "Symptoms Count": Array.isArray(l.symptoms) ? l.symptoms.length : 0,
                "Somatic Tension": l.somaticStress
            };
        });
    };
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const calendarCells = (() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const prevMonthTotal = new Date(year, month, 0).getDate();
        const cells = [];
        // Prev month padding
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            cells.push({
                day: prevMonthTotal - i,
                isCurrentMonth: false,
                dateObj: new Date(year, month - 1, prevMonthTotal - i)
            });
        }
        // Current month days
        for (let d = 1; d <= totalDays; d++) {
            cells.push({
                day: d,
                isCurrentMonth: true,
                dateObj: new Date(year, month, d)
            });
        }
        // Next month padding
        const totalSlots = Math.ceil(cells.length / 7) * 7;
        const paddingNext = totalSlots - cells.length;
        for (let n = 1; n <= paddingNext; n++) {
            cells.push({
                day: n,
                isCurrentMonth: false,
                dateObj: new Date(year, month + 1, n)
            });
        }
        return cells;
    })();
    const findCellLog = (d) => {
        const formattedDateString = d.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
        return logs.find(l => l.date === formattedDateString);
    };
    // Therapy Goal form inputs
    const [goalText, setGoalText] = useState("");
    const [goalCategory, setGoalCategory] = useState("Somatic Containment");
    const [goalTargetDate, setGoalTargetDate] = useState("");
    const [goalSuccess, setGoalSuccess] = useState(false);
    // Categorized symptoms dictionary
    const CATEGORIZED_SYMPTOMS = {
        "Somatic & Respiratory": [
            "Shallow Chest Respiration",
            "Hyperventilation / Air Hunger",
            "Tight Shoulder & Thoracic Girdle",
            "Autonomic Tremors / Shakes",
            "Heart Racing / Palpitations",
            "Muscle Twitches & Tension"
        ],
        "Digestive & Autonomic": [
            "Gastric Tension",
            "Nausea / Appetite Fluctuations",
            "Cold Sweats / Hot Flashes",
            "Dry Mouth"
        ],
        "Cognitive & Anxiety": [
            "Imposter Anticipatory Dread",
            "Irritability / Brain Fog",
            "Intrusive Worry / Racing Thoughts",
            "Catastrophizing",
            "Derealization / Depersonalization"
        ],
        "Sleep & Energy": [
            "Insomnia / Shallow Sleep",
            "Waking up in Panic / Night Terrors",
            "Daytime Exhaustion",
            "Early Morning Awakening"
        ]
    };
    // State configurations for searchable grouped dropdown
    const [searchTerm, setSearchTerm] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    // Daily alert reminder setups
    const [remindersEnabled, setRemindersEnabled] = useState(() => {
        return localStorage.getItem("somatic_reminders_enabled") === "true";
    });
    const [reminderTime, setReminderTime] = useState(() => {
        return localStorage.getItem("somatic_reminder_time") || "20:00";
    });
    const [notificationPermission, setNotificationPermission] = useState(() => {
        return typeof Notification !== "undefined" ? Notification.permission : "default";
    });
    // Sync patients list
    useEffect(() => {
        const list = allUsers.filter((u) => u.role === "patient");
        setPatientsList(list);
        if (list.length > 0 && !selectedPatientId) {
            setSelectedPatientId(list[0].id);
        }
    }, [allUsers, selectedPatientId]);
    // Target User Id whose logs/goals we are rendering (depends on role)
    const targetUserId = isPsychologist ? selectedPatientId : currentUser.id;
    // Real-time synchronization
    useEffect(() => {
        if (!targetUserId) {
            setLogs([]);
            setGoals([]);
            return;
        }
        // A. Sync progress logs
        const qLogs = query(collection(db, "progress_logs"), where("patientId", "==", targetUserId));
        const unsubLogs = onSnapshot(qLogs, (snap) => {
            const arr = [];
            snap.forEach((doc) => {
                arr.push(doc.data());
            });
            // Sort oldest to newest for trend graphs, but newest first for logs
            setLogs(arr.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
        }, (err) => {
            console.warn("Log tracking subscription fails: ", err);
        });
        // B. Sync therapy goals
        const qGoals = query(collection(db, "therapy_goals"), where("patientId", "==", targetUserId));
        const unsubGoals = onSnapshot(qGoals, (snap) => {
            const arr = [];
            snap.forEach((doc) => {
                arr.push(doc.data());
            });
            setGoals(arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        }, (err) => {
            console.warn("Goals subscription fails: ", err);
        });
        // C. Sync assigned resources completed reflections
        const qAssigned = query(collection(db, "assigned_resources"), where("assignedToId", "==", targetUserId));
        const unsubAssigned = onSnapshot(qAssigned, (snap) => {
            const arr = [];
            snap.forEach((doc) => {
                arr.push(doc.data());
            });
            setConnectedAssignments(arr.filter((r) => r.isCompleted));
        }, (err) => {
            console.warn("Connected assignments lookup fails: ", err);
        });
        // D. Sync daily habits
        const qHabits = query(collection(db, "habits"), where("patientId", "==", targetUserId));
        const unsubHabits = onSnapshot(qHabits, (snap) => {
            const arr = [];
            snap.forEach((doc) => {
                arr.push(doc.data());
            });
            setHabits(arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        }, (err) => {
            console.warn("Habits subscription fails: ", err);
        });
        // E. Sync daily gratitude journals
        const qJournals = query(collection(db, "journals"), where("patientId", "==", targetUserId));
        const unsubJournals = onSnapshot(qJournals, (snap) => {
            const arr = [];
            snap.forEach((doc) => {
                arr.push(doc.data());
            });
            setJournals(arr.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
        }, (err) => {
            console.warn("Journals subscription fails: ", err);
        });
        return () => {
            unsubLogs();
            unsubGoals();
            unsubAssigned();
            unsubHabits();
            unsubJournals();
        };
    }, [targetUserId]);
    // Click-outside setup for symptom search suggestion dropdown
    useEffect(() => {
        const handleOutsideClick = (event) => {
            const element = document.getElementById("searchable-symptom-wrapper");
            if (element && !element.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);
    // Sync reminder configurations to storage
    useEffect(() => {
        localStorage.setItem("somatic_reminders_enabled", String(remindersEnabled));
    }, [remindersEnabled]);
    useEffect(() => {
        localStorage.setItem("somatic_reminder_time", reminderTime);
    }, [reminderTime]);
    // Daily alert notifications Scheduler
    useEffect(() => {
        if (!remindersEnabled || isPsychologist || typeof window === "undefined" || !("Notification" in window)) {
            return;
        }
        const intervalId = setInterval(() => {
            // Check if today's log already exists to avoid redundant reminder alerts
            const todayDate = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
            const hasLoggedToday = logs.some((l) => l.date === todayDate);
            if (hasLoggedToday)
                return;
            const now = new Date();
            const currentHourMin = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
            if (currentHourMin === reminderTime) {
                // Prevent duplicate alerts in the exact same minute block
                const lastNotifiedDay = localStorage.getItem("somatic_last_notified_day");
                const todayStr = now.toDateString();
                if (lastNotifiedDay !== todayStr) {
                    localStorage.setItem("somatic_last_notified_day", todayStr);
                    if (Notification.permission === "granted") {
                        new Notification("Daily Somatic Check-In Alert 🔔", {
                            body: "You haven't logged your daily somatic stress & mood indicators yet today. Take 2 minutes to tune in with your clinician's file.",
                            icon: "/favicon.ico"
                        });
                    }
                }
            }
        }, 25000); // Check every 25 seconds for precise matching
        return () => clearInterval(intervalId);
    }, [remindersEnabled, reminderTime, logs, isPsychologist]);
    const handleRequestPermission = async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            alert("Desktop Alert notifications are not supported in this browser.");
            return;
        }
        try {
            const status = await Notification.requestPermission();
            setNotificationPermission(status);
            if (status === "granted") {
                setRemindersEnabled(true);
            }
        }
        catch (err) {
            console.warn("Credential notification registration declined:", err);
        }
    };
    const handleSendTestNotification = () => {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Care Synchronizer Online ✨", {
                body: "Confirming daily alerts are enabled! We will prompt you everyday at " + reminderTime + " if your daily vital logs are empty.",
                icon: "/favicon.ico"
            });
        }
        else {
            alert("Please grant notification permission first.");
        }
    };
    // Modern professional jspdf Client Report Exporter
    const handleDownloadPDFReport = () => {
        try {
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });
            // Retrieve full profile meta details
            const activePatient = isPsychologist
                ? patientsList.find((p) => p.id === selectedPatientId)
                : currentUser;
            const patientName = activePatient ? activePatient.name : "Active Sandbox Patient";
            const patientEmail = activePatient ? activePatient.email : "karthik.rb99@gmail.com";
            // Cohesively aligned Colors Matching the Vagus Link Branding
            const primaryColor = [79, 70, 229]; // Indigo
            const darkSlate = [15, 23, 42]; // Slate 900
            const crimsonColor = [225, 29, 72]; // Rose 600
            const bgSlate = [248, 250, 252]; // Soft Gray Slate 50
            const contentTextColor = [51, 65, 85]; // Slate 700
            const titleTextColor = [15, 23, 42]; // Deep dark Slate 900
            const mutedSlate = [100, 116, 139]; // Slate 500
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            // Draw Top Title clinical slate header band
            pdf.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
            pdf.rect(0, 0, pageWidth, 42, "F");
            // Draw Indigo highlight strip divider
            pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            pdf.rect(0, 42, pageWidth, 2, "F");
            // Header Texts
            pdf.setTextColor(255, 255, 255);
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(16);
            pdf.text("VAGUS LINK PORTAL", 15, 18);
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(199, 210, 254);
            pdf.text("Somatic Tracking & Interactive Vagal Regulation Registry", 15, 24);
            // Label (confidentiality, etc.) on the right side
            pdf.setTextColor(255, 255, 255);
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(13);
            pdf.text("PROGRESS INTEGRITY STATEMENT", pageWidth - 15, 18, { align: "right" });
            pdf.setFont("Helvetica", "oblique");
            pdf.setFontSize(8);
            pdf.setTextColor(244, 63, 94); // Light rose
            pdf.text("CONFIDENTIAL MEDICAL-GRADE REPORT FILE", pageWidth - 15, 24, { align: "right" });
            // Secondary header info
            pdf.setTextColor(255, 255, 255);
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(8);
            const reportInterval = logs.length > 0
                ? `${logs[logs.length - 1].date} - ${logs[0].date}`
                : "No logs logged";
            pdf.text(`Tracking Interval: ${reportInterval}`, 15, 34);
            pdf.text(`Generated On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 15, 34, { align: "right" });
            // 2. Identity Summary Panel Card
            pdf.setFillColor(bgSlate[0], bgSlate[1], bgSlate[2]);
            pdf.rect(15, 52, pageWidth - 30, 24, "F");
            pdf.setDrawColor(226, 232, 240);
            pdf.rect(15, 52, pageWidth - 30, 24, "D");
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(9.5);
            pdf.setTextColor(titleTextColor[0], titleTextColor[1], titleTextColor[2]);
            pdf.text("ACTIVE PATIENT CLINICAL DOSSIER", 18, 58);
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(8.5);
            pdf.setTextColor(contentTextColor[0], contentTextColor[1], contentTextColor[2]);
            pdf.text(`Target Patient: ${patientName}`, 18, 64);
            pdf.text(`Database ID: ${activePatient?.id || "sandbox-current-user"}`, 18, 69);
            pdf.text(`Associated Clinician: ${isPsychologist ? currentUser.name : "Self-Reporting Sandbox Mode"}`, pageWidth / 2 + 5, 64);
            pdf.text(`Clinical Integrity Standard: HIPAA-Aligned Self Report`, pageWidth / 2 + 5, 69);
            // 3. Grid Row of Scorecards
            const gridWidth = (pageWidth - 30) / 3;
            // Box 1: Avg Tension Stress
            pdf.setFillColor(bgSlate[0], bgSlate[1], bgSlate[2]);
            pdf.rect(15, 84, gridWidth - 2, 21, "F");
            pdf.rect(15, 84, gridWidth - 2, 21, "D");
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(7);
            pdf.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
            pdf.text("AVG PHYSIOLOGICAL TENSION", 18, 89);
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(14);
            pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            pdf.text(`${averageStress}`, 18, 97);
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(contentTextColor[0], contentTextColor[1], contentTextColor[2]);
            pdf.text(" / 10 stress index", 29, 97);
            // Box 2: Spikes Logged
            pdf.setFillColor(bgSlate[0], bgSlate[1], bgSlate[2]);
            pdf.rect(15 + gridWidth, 84, gridWidth - 2, 21, "F");
            pdf.rect(15 + gridWidth, 84, gridWidth - 2, 21, "D");
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(7);
            pdf.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
            pdf.text("TOTAL PANIC SPIKES", 15 + gridWidth + 3, 89);
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(14);
            pdf.setTextColor(crimsonColor[0], crimsonColor[1], crimsonColor[2]);
            pdf.text(`${totalPanicSpikes}`, 15 + gridWidth + 3, 97);
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(contentTextColor[0], contentTextColor[1], contentTextColor[2]);
            pdf.text(" alarms triggered", 15 + gridWidth + 12, 97);
            // Box 3: Total Logs Sync Record
            pdf.setFillColor(bgSlate[0], bgSlate[1], bgSlate[2]);
            pdf.rect(15 + gridWidth * 2, 84, gridWidth - 2, 21, "F");
            pdf.rect(15 + gridWidth * 2, 84, gridWidth - 2, 21, "D");
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(7);
            pdf.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
            pdf.text("WELLNESS LOGS DEPTH", 15 + gridWidth * 2 + 3, 89);
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(14);
            pdf.setTextColor(10, 110, 60); // Emerald green
            pdf.text(`${logs.length}`, 15 + gridWidth * 2 + 3, 97);
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(contentTextColor[0], contentTextColor[1], contentTextColor[2]);
            pdf.text(" days logged today", 15 + gridWidth * 2 + 12, 97);
            // 4. Detailed History Table of Logs
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(10.5);
            pdf.setTextColor(titleTextColor[0], titleTextColor[1], titleTextColor[2]);
            pdf.text("LONGITUDINAL TRACKING BIO-METRICS LOG", 15, 116);
            pdf.setDrawColor(203, 213, 225);
            pdf.line(15, 119, pageWidth - 15, 119);
            let currentY = 126;
            pdf.setFillColor(241, 245, 249);
            pdf.rect(15, currentY - 5, pageWidth - 30, 7, "F");
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(8);
            pdf.setTextColor(titleTextColor[0], titleTextColor[1], titleTextColor[2]);
            pdf.text("DATE", 17, currentY);
            pdf.text("DOMINANT MOOD STATE", 42, currentY);
            pdf.text("TENSION INDEX", 85, currentY);
            pdf.text("SPIKES", 112, currentY);
            pdf.text("REGISTERED SOMATIC SYMPTOMS", 129, currentY);
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(contentTextColor[0], contentTextColor[1], contentTextColor[2]);
            // Print latest 18 logs to fit beautifully inside the boundaries
            const logsSubset = logs.slice(0, 18);
            logsSubset.forEach((item, index) => {
                currentY += 8;
                if (currentY > pageHeight - 22) {
                    pdf.addPage();
                    currentY = 25;
                    // Re-draw table header
                    pdf.setFillColor(241, 245, 250);
                    pdf.rect(15, currentY - 5, pageWidth - 30, 7, "F");
                    pdf.setFont("Helvetica", "bold");
                    pdf.setTextColor(titleTextColor[0], titleTextColor[1], titleTextColor[2]);
                    pdf.text("DATE", 17, currentY);
                    pdf.text("DOMINANT MOOD STATE", 42, currentY);
                    pdf.text("TENSION INDEX", 85, currentY);
                    pdf.text("SPIKES", 112, currentY);
                    pdf.text("REGISTERED SOMATIC SYMPTOMS", 129, currentY);
                    pdf.setFont("Helvetica", "normal");
                    pdf.setTextColor(contentTextColor[0], contentTextColor[1], contentTextColor[2]);
                    currentY += 8;
                }
                if (index % 2 === 1) {
                    pdf.setFillColor(248, 250, 252);
                    pdf.rect(15, currentY - 5, pageWidth - 30, 8, "F");
                }
                pdf.text(item.date, 17, currentY);
                pdf.text(item.mood, 42, currentY);
                pdf.text(`${item.somaticStress}/10`, 85, currentY);
                pdf.text(`${item.panicSpikesCount || 0}`, 112, currentY);
                const sList = item.symptoms && item.symptoms.length > 0 ? item.symptoms.join(", ") : "None documented";
                const truncatedSymptoms = sList.length > 40 ? sList.slice(0, 40) + "..." : sList;
                pdf.text(truncatedSymptoms, 129, currentY);
            });
            // Append Daily Gratitude & Reflections page if journals exist
            if (journals.length > 0) {
                pdf.addPage();
                // Section Header
                pdf.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
                pdf.rect(0, 0, pageWidth, 24, "F");
                pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                pdf.rect(0, 24, pageWidth, 1.5, "F");
                pdf.setTextColor(255, 255, 255);
                pdf.setFont("Helvetica", "bold");
                pdf.setFontSize(11);
                pdf.text("DAILY GRATITUDE & REFLECTION LOGS", 15, 10);
                pdf.setFont("Helvetica", "normal");
                pdf.setFontSize(8);
                pdf.setTextColor(199, 210, 254);
                pdf.text("Live self-reflection tracking & conscious awareness registry", 15, 17);
                // Write journal logs
                let journalY = 38;
                journals.slice(0, 8).forEach((j) => {
                    if (journalY > pageHeight - 34) {
                        pdf.addPage();
                        journalY = 20;
                    }
                    pdf.setFillColor(bgSlate[0], bgSlate[1], bgSlate[2]);
                    pdf.rect(15, journalY - 4, pageWidth - 30, 22, "F");
                    pdf.setDrawColor(226, 232, 240);
                    pdf.rect(15, journalY - 4, pageWidth - 30, 22, "D");
                    pdf.setFont("Helvetica", "bold");
                    pdf.setFontSize(8.5);
                    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                    pdf.text(`Date of Sync: ${j.date}    |    Mood State: ${j.moodText} (${j.moodScore}/10)`, 18, journalY + 2);
                    pdf.setFont("Helvetica", "normal");
                    pdf.setFontSize(8);
                    pdf.setTextColor(contentTextColor[0], contentTextColor[1], contentTextColor[2]);
                    const lines = pdf.splitTextToSize(`Gratitude Reflection: ${j.gratitudeText}`, pageWidth - 36);
                    pdf.text(lines, 18, journalY + 8);
                    journalY += 26;
                });
            }
            // Disclaimer Footer
            pdf.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.text("Disclaimer: This document is an automatically compiled report from sandbox logs. Please present these findings to your licensed medical advisor manually.", 15, pageHeight - 13);
            pdf.text(`Vagus Link HIPAA Support Suite | Sanitized Standard | Page ${pdf.getNumberOfPages()} of ${pdf.getNumberOfPages()}`, pageWidth - 15, pageHeight - 13, { align: "right" });
            pdf.save(`vagus_link_progress_report_${patientName.replace(/\s+/g, "_").toLowerCase()}.pdf`);
        }
        catch (e) {
            console.error("Failed to compile standard PDF metrics report in jsPDF:", e);
            alert("Therapeutic Report generator faced an unexpected system error. Check console logs for metadata.");
        }
    };
    // Web Speech API Voice Journaling Recorder
    const handleToggleVoiceNotes = () => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            alert("🎙️ Web Speech API isn't supported in your browser or iframe context. For voice transcription, please try a modern browser like Chrome.");
            return;
        }
        if (isListening) {
            if (window.progressSpeechRecognizer) {
                try {
                    (window.progressSpeechRecognizer).stop();
                }
                catch (e) {
                    console.warn(e);
                }
            }
            setIsListening(false);
        }
        else {
            try {
                const recognition = new SpeechRec();
                recognition.continuous = true;
                recognition.interimResults = false;
                recognition.lang = "en-US";
                recognition.onstart = () => {
                    setIsListening(true);
                };
                recognition.onresult = (event) => {
                    const resultIndex = event.resultIndex;
                    const transcript = event.results[resultIndex][0].transcript;
                    if (transcript) {
                        setNotes((prev) => (prev ? prev + " " + transcript.trim() : transcript.trim()));
                    }
                };
                recognition.onerror = (e) => {
                    console.error("Speech Recognition internal error:", e.error);
                    setIsListening(false);
                };
                recognition.onend = () => {
                    setIsListening(false);
                };
                recognition.start();
                window.progressSpeechRecognizer = recognition;
            }
            catch (err) {
                console.error("Could not activate Speech Recognition engine:", err);
                setIsListening(false);
            }
        }
    };
    // Secure Server-Side AI Clinical Trend correlation algorithm (Gemini-3.5-flash)
    const generateAITrendReport = async () => {
        setIsGeneratingReport(true);
        setReportError(null);
        try {
      const prompt = `
      Analyze the following patient somatic tracking data and active therapy goals to generate a Weekly Clinical Trend Report:
      1. Daily Somatic Logs:
      ${JSON.stringify(logs, null, 2)}

      2. Active Therapy Goals:
      ${JSON.stringify(goals, null, 2)}
      `;
      const text = await GeminiService.callGemini(prompt, "You are a clinical psychologist and biometric expert. Analyze the provided logs containing mood states, baseline somatic stress indexes (1-10 rate, where 1-4 is Calm/Restful vagal tone, 5-7 is High Anticipatory/Defensive stress, 8-10 is Acute Panic/Flight-or-Fight), panic spike events, check-in symptoms, and therapy goals.\nSynthesize a comprehensive clinical report in clear Markdown including:\n1. **Autonomic State Breakdown**: Synthesize average stress levels, mood fluctuations, and somatic stability over the week.\n2. **Somatic & Symptom Correlations**: Highlight direct, evidence-based correlations between physical symptoms (e.g., shallow respiration, muscle twitches, gastric tension) and elevated stress/mood alarms.\n3. **Therapeutic Goal Alignment**: Assess how their active therapy goals map to the recorded behaviors and recommend adjustments or praise milestones.\n4. **Actionable Somatic Recommendations**: Provide 3 customized, somatic vagus-nerve regulation or mindfulness exercises tailored to contain their specific logged triggers.\nStructure this report to be supportive, clinician-guided, and highly professional. Do not disclose confidential credentials or use cold/mechanical jargon. Maintain complete privacy.");
      if (text) {
        setWeeklyReport(text);
      } else {
        throw new Error("Trend report was returned empty.");
      }
    } catch (err) {
      console.error("AI Report generation failed:", err);
      setReportError(err.message || "Failed to generate report.");
    }
        finally {
            setIsGeneratingReport(false);
        }
    };
    // Submit Progress Log (For Patient ONLY)
    const handleSaveProgressLog = async (e) => {
        e.preventDefault();
        if (isPsychologist)
            return;
        const todayDate = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
        const logId = "log_" + currentUser.id + "_" + Date.now();
        const newLog = {
            id: logId,
            patientId: currentUser.id,
            patientName: currentUser.name,
            date: todayDate,
            mood: mood,
            somaticStress: somaticStress,
            panicSpikesCount: panicSpikes,
            symptoms: symptoms,
            notes: notes,
            timestamp: new Date().toISOString()
        };
        try {
            await createProgressLogInFirebase(newLog);
            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                // Reset states partially
                setPanicSpikes(0);
                setSymptoms([]);
                setNotes("");
            }, 2000);
        }
        catch (err) {
            console.error("Failed to write daily wellness logs:", err);
        }
    };
    // Submit Therapy Goal (For Patient ONLY)
    const handleAddTherapyGoal = async (e) => {
        e.preventDefault();
        if (!goalText || isPsychologist)
            return;
        const goalId = "goal_" + Date.now();
        const newGoal = {
            id: goalId,
            patientId: currentUser.id,
            patientName: currentUser.name,
            goalText: goalText,
            targetDate: goalTargetDate || "Next Session",
            status: "active",
            category: goalCategory,
            createdAt: new Date().toISOString()
        };
        try {
            await createTherapyGoalInFirebase(newGoal);
            setGoalText("");
            setGoalTargetDate("");
            setGoalSuccess(true);
            setTimeout(() => setGoalSuccess(false), 2000);
        }
        catch (err) {
            console.error("Failed to add therapy goal:", err);
        }
    };
    const toggleSymptom = (s) => {
        if (symptoms.includes(s)) {
            setSymptoms(symptoms.filter((x) => x !== s));
        }
        else {
            setSymptoms([...symptoms, s]);
        }
    };
    const handleUpdateGoalStatus = async (gid, requestedState) => {
        try {
            await updateTherapyGoalStatusInFirebase(gid, requestedState);
        }
        catch (err) {
            console.error("Goal status update failed:", err);
        }
    };
    const handleDeleteGoal = async (gid) => {
        if (!confirm("Are you sure you want to remove this goal?"))
            return;
        try {
            await deleteTherapyGoalInFirebase(gid);
        }
        catch (err) {
            console.error("Goal deletion failed:", err);
        }
    };
    // Habit Tracker Actions & Computations
    const handleCreateHabit = async (e) => {
        e.preventDefault();
        if (!newHabitName.trim())
            return;
        const habitId = "habit_" + Date.now();
        const newHabit = {
            id: habitId,
            patientId: targetUserId,
            name: newHabitName.trim(),
            createdAt: new Date().toISOString(),
            completedDays: []
        };
        try {
            await createDailyHabitInFirebase(newHabit);
            setNewHabitName("");
        }
        catch (err) {
            console.error("Failed to create habit:", err);
        }
    };
    const handleToggleHabitDay = async (habit, dateStr) => {
        if (isPsychologist)
            return; // Read-only for clinical staff
        let updatedDays = [...habit.completedDays];
        if (updatedDays.includes(dateStr)) {
            updatedDays = updatedDays.filter(day => day !== dateStr);
        }
        else {
            updatedDays.push(dateStr);
        }
        try {
            await updateDailyHabitInFirebase(habit.id, updatedDays);
        }
        catch (err) {
            console.error("Failed to toggle habit day:", err);
        }
    };
    const handleDeleteHabit = async (habitId) => {
        if (isPsychologist)
            return;
        if (!confirm("Are you sure you want to remove this daily repeat micro-goal?"))
            return;
        try {
            await deleteDailyHabitInFirebase(habitId);
        }
        catch (err) {
            console.error("Failed to delete habit:", err);
        }
    };
    const getPast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const dayName = d.toLocaleDateString([], { weekday: 'short' });
            const dayNum = d.getDate();
            days.push({
                dateStr,
                dayName,
                dayNum,
                isToday: i === 0
            });
        }
        return days;
    };
    const calculateStreak = (habit) => {
        let currentStreak = 0;
        if (!habit.completedDays || habit.completedDays.length === 0)
            return 0;
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        if (!habit.completedDays.includes(todayStr) && !habit.completedDays.includes(yesterdayStr)) {
            return 0;
        }
        const checkDate = habit.completedDays.includes(todayStr) ? today : yesterday;
        while (true) {
            const year = checkDate.getFullYear();
            const month = String(checkDate.getMonth() + 1).padStart(2, '0');
            const day = String(checkDate.getDate()).padStart(2, '0');
            const checkStr = `${year}-${month}-${day}`;
            if (habit.completedDays.includes(checkStr)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
            else {
                break;
            }
        }
        return currentStreak;
    };
    // Pre-calculate statistics for trend charts & clinician panels
    const averageStress = logs.length > 0
        ? (logs.reduce((sum, l) => sum + l.somaticStress, 0) / logs.length).toFixed(1)
        : "0.0";
    const totalPanicSpikes = logs.reduce((sum, l) => sum + l.panicSpikesCount, 0);
    // Compile symptoms occurrence map
    const symptomOccurrences = {};
    logs.forEach((log) => {
        log.symptoms.forEach((sym) => {
            symptomOccurrences[sym] = (symptomOccurrences[sym] || 0) + 1;
        });
    });
    const topSymptoms = Object.entries(symptomOccurrences).sort((a, b) => b[1] - a[1]);
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8 text-left", id: "progress-tracker-root", children: [isPsychologist && (_jsxs("div", { className: "bg-[#0D0D0F] border border-white/5 rounded-2xl p-5 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md", id: "clinician-patient-bar", children: [_jsxs("div", { className: "text-left space-y-1", children: [_jsx("span", { className: "text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono block", children: "Clinician Clinical Desk" }), _jsx("h2", { className: "text-md font-bold text-slate-200", children: "Patient Longitudinal Progress Dashboard" }), _jsx("p", { className: "text-xs text-slate-400", children: "Select any connected sandbox patient profile below to view real-time logs, somatic tension trends, active therapy goals, and completed interactive reflections." })] }), _jsxs("div", { className: "flex items-center space-x-3 shrink-0", children: [_jsx("label", { className: "text-xs font-semibold text-slate-400 font-mono text-right hidden md:block", children: "Active Patient File:" }), _jsx("select", { id: "clinician-selected-patient-select", value: selectedPatientId, onChange: (e) => setSelectedPatientId(e.target.value), className: "bg-[#0A0A0C] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-250 font-semibold focus:outline-none cursor-pointer [color-scheme:dark]", children: patientsList.map((p) => (_jsxs("option", { value: p.id, children: [p.name, " (File ID: ", p.id, ")"] }, p.id))) })] })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8", id: "progress-grids-parent", children: [!isPsychologist ? (_jsxs("div", { className: "lg:col-span-4 space-y-6", id: "progress-form-col", children: [_jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg space-y-5", id: "patient-logger-container", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-light uppercase tracking-wider text-slate-200 flex items-center mb-1", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Activity, { className: "w-5 h-5 text-indigo-400 mr-2 shrink-0" }), "Log Daily Vital Markers"] }), _jsx("p", { className: "text-[11px] text-slate-400", children: "Identify clinical markers daily to trace panic thresholds securely with your psychologist." })] }), _jsxs("form", { onSubmit: handleSaveProgressLog, className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide font-mono", children: ["Baseline Autonomic Stress Rate (", somaticStress, "/10)"] }), _jsx("input", { id: "somatic-stress-tracker-range", type: "range", min: "1", max: "10", value: somaticStress, onChange: (e) => setSomaticStress(Number(e.target.value)), className: "w-full accent-indigo-500 cursor-pointer" }), _jsxs("div", { className: "flex justify-between text-[8px] text-slate-500 font-mono", children: [_jsx("span", { children: "1 - Vagally tone" }), _jsx("span", { children: "5 - High Anticipation" }), _jsx("span", { children: "10 - Acute Panic" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide font-mono", children: "Dominant Mood State" }), _jsxs("select", { id: "mood-state-select", value: mood, onChange: (e) => setMood(e.target.value), className: "w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-250 font-medium focus:outline-none cursor-pointer [color-scheme:dark]", children: [_jsx("option", { value: "Calm", children: "Calm & Safe" }), _jsx("option", { value: "Tense", children: "Tense / Defensive" }), _jsx("option", { value: "Burnout", children: "Exhausted / Bare" }), _jsx("option", { value: "Anxious", children: "Anxious / Alert" }), _jsx("option", { value: "Empowered", children: "Empowered / Clear" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide font-mono", children: "Panic Spikes (Today)" }), _jsxs("div", { className: "flex items-center space-x-1.5 pt-1 justify-center bg-[#070708] border border-white/10 rounded-xl py-1", children: [_jsx("button", { id: "dec-spike-p-btn", type: "button", onClick: () => setPanicSpikes(Math.max(0, panicSpikes - 1)), className: "w-6 h-6 rounded bg-white/[0.03] flex items-center justify-center font-bold text-xs text-slate-300 hover:bg-white/[0.06] cursor-pointer", children: "-" }), _jsx("span", { className: "font-extrabold text-xs text-indigo-400 w-5 text-center font-mono", children: panicSpikes }), _jsx("button", { id: "inc-spike-p-btn", type: "button", onClick: () => setPanicSpikes(panicSpikes + 1), className: "w-6 h-6 rounded bg-white/[0.03] flex items-center justify-center font-bold text-xs text-slate-300 hover:bg-white/[0.06] cursor-pointer", children: "+" })] })] })] }), (() => {
                                                const filteredCategorizedSymptoms = Object.entries(CATEGORIZED_SYMPTOMS).reduce((acc, [category, items]) => {
                                                    const matched = items.filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()));
                                                    if (matched.length > 0) {
                                                        acc[category] = matched;
                                                    }
                                                    return acc;
                                                }, {});
                                                return (_jsxs("div", { className: "space-y-2 text-left relative", id: "searchable-symptom-wrapper", children: [_jsx("span", { className: "block text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono mb-1", children: "Somatic Trigger & Symptom Profiler" }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "symptom-search-input", type: "text", placeholder: "Search symptoms (e.g. sleep, breathing)...", value: searchTerm, onFocus: () => setDropdownOpen(true), onChange: (e) => {
                                                                        setSearchTerm(e.target.value);
                                                                        setDropdownOpen(true);
                                                                    }, className: "w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-205 placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-10" }), _jsx("button", { id: "toggle-symptom-dropdown-arrow-btn", type: "button", onClick: () => setDropdownOpen(!dropdownOpen), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition text-[9px] p-1 cursor-pointer", children: dropdownOpen ? "▲" : "▼" })] }), dropdownOpen && (_jsxs("div", { className: "absolute left-0 right-0 mt-1 bg-[#0D0D0F] border border-white/10 rounded-xl max-h-64 overflow-y-auto shadow-2xl z-50 p-3 space-y-3", id: "symptom-dropdown-overlay", children: [Object.keys(filteredCategorizedSymptoms).length > 0 ? (Object.entries(filteredCategorizedSymptoms).map(([category, items]) => (_jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest font-mono border-b border-white/5 pb-0.5 select-none", children: category }), _jsx("div", { className: "grid grid-cols-1 gap-1 pt-1 text-left", children: items.map((item) => {
                                                                                const isChecked = symptoms.includes(item);
                                                                                return (_jsxs("button", { id: `symptom-item-${item.replace(/\s+/g, "-")}`, type: "button", onClick: () => toggleSymptom(item), className: `w-full text-left p-2 rounded-lg text-xs cursor-pointer select-none border transition flex items-center justify-between ${isChecked
                                                                                        ? "bg-indigo-600/15 border-indigo-500/35 text-indigo-300"
                                                                                        : "bg-[#070708]/30 border-transparent text-slate-400 hover:bg-[#070708] hover:border-white/5"}`, children: [_jsx("span", { children: item }), isChecked && _jsx("span", { className: "text-indigo-400 text-[10px] font-bold", children: "\u2713" })] }, item));
                                                                            }) })] }, category)))) : (
                                                                /* If search input doesn't match dictionary presets, allow adding a custom symptom */
                                                                _jsxs("div", { className: "text-center p-3 text-xs text-slate-500 space-y-2", children: [_jsxs("p", { children: ["No preset symptoms match \"", searchTerm, "\""] }), searchTerm.trim().length > 1 && (_jsxs("button", { id: "add-custom-symptom-entry-btn", type: "button", onClick: () => {
                                                                                const cleanWord = searchTerm.trim();
                                                                                if (cleanWord && !symptoms.includes(cleanWord)) {
                                                                                    setSymptoms([...symptoms, cleanWord]);
                                                                                    setSearchTerm("");
                                                                                    setDropdownOpen(false);
                                                                                }
                                                                            }, className: "w-full bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-[10.5px] py-1.5 rounded-lg transition cursor-pointer", children: ["Add \"", searchTerm.trim(), "\" as Custom Symptom"] }))] })), _jsxs("div", { className: "pt-2 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-mono", children: [_jsx("span", { children: "Standardized Dictionary" }), _jsx("button", { id: "minimize-symptom-dropdown-btn", type: "button", onClick: () => setDropdownOpen(false), className: "text-indigo-400 hover:underline cursor-pointer font-bold", children: "Minimize" })] })] })), symptoms.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1.5 pt-1.5", id: "active-tags-row", children: symptoms.map((s) => (_jsxs("div", { id: `active-tag-badge-${s.replace(/\s+/g, "-")}`, className: "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[9px] px-2.5 py-1 rounded-full flex items-center space-x-1 font-mono animate-scale-up", children: [_jsx("span", { children: s }), _jsx("button", { id: `deselect-tag-btn-${s.replace(/\s+/g, "-")}`, type: "button", onClick: (e) => {
                                                                            e.stopPropagation();
                                                                            setSymptoms(symptoms.filter((x) => x !== s));
                                                                        }, className: "w-3.5 h-3.5 rounded-full hover:bg-white/10 flex items-center justify-center font-bold text-slate-400 hover:text-white transition cursor-pointer text-[10px]", children: "\u00D7" })] }, s))) }))] }));
                                            })(), _jsxs("div", { className: "space-y-1.5 text-left", id: "voice-reflection-notes-wrapper", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { htmlFor: "daily-reflection-notes", className: "block text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono", children: "Therapy Journal & Reflections" }), _jsx("button", { id: "voice-dictation-toggle-btn", type: "button", onClick: handleToggleVoiceNotes, className: `flex items-center space-x-1 px-2 py-0.5 rounded border transition text-[9px] font-bold cursor-pointer select-none ${isListening
                                                                    ? "bg-red-500/15 border-red-500/40 text-red-400 animate-pulse"
                                                                    : "bg-white/[0.02] border-white/5 text-indigo-400 hover:text-indigo-300 hover:bg-white/[0.04]"}`, title: isListening ? "Stop Voice Recording" : "Dictate with voice", children: isListening ? (_jsxs(_Fragment, { children: [_jsx(MicOff, { className: "w-2.5 h-2.5 text-red-450 mr-0.5 shrink-0" }), _jsx("span", { children: "Stop Rec" })] })) : (_jsxs(_Fragment, { children: [_jsx(Mic, { className: "w-2.5 h-2.5 mr-0.5 shrink-0 text-indigo-400" }), _jsx("span", { children: "Voice Input" })] })) })] }), _jsx("textarea", { id: "daily-reflection-notes", placeholder: "Describe trigger response correlations, or dictate via microphone (Web Speech)...", value: notes, onChange: (e) => setNotes(e.target.value), rows: 3, className: "w-full bg-[#070708] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-3 resize-none" }), isListening && (_jsx("span", { className: "text-[8px] text-[#fb7185] font-mono animate-pulse block select-none", children: "\uD83C\uDF99\uFE0F Speak clearly. System is transcribing and appending to your notebook..." }))] }), saveSuccess && (_jsxs("div", { className: "p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2", children: [_jsx(CheckCircle, { className: "w-4 h-4 shrink-0" }), _jsx("span", { children: "Daily wellness secure trace synced to DB!" })] })), _jsxs("button", { id: "submit-daily-wellness-log", type: "submit", className: "w-full bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-md hover:shadow-lg", children: [_jsx(Activity, { className: "w-4 h-4" }), _jsx("span", { children: "Sync Daily Vital Logs" })] })] })] }), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg space-y-4 text-left", id: "patient-goal-builder", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-light uppercase tracking-wider text-slate-200 flex items-center", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Plus, { className: "w-5 h-5 text-indigo-400 mr-1 shrink-0" }), "Co-build Therapy Goals"] }), _jsx("p", { className: "text-[11px] text-slate-400 mt-1", children: "Add actionable checkpoints aligned with your clinician's somatic recommendations." })] }), _jsxs("form", { onSubmit: handleAddTherapyGoal, className: "space-y-3.5", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-[9px] uppercase font-bold text-slate-505 tracking-wider font-mono", children: "Goal Statement" }), _jsx("input", { id: "goal-statement-input", type: "text", required: true, placeholder: "e.g., Maintain box breathing 5 mins during daily spikes...", value: goalText, onChange: (e) => setGoalText(e.target.value), className: "w-full bg-[#070708] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-indigo-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-[9px] uppercase font-bold text-slate-505 tracking-wider font-mono", children: "Classification" }), _jsxs("select", { id: "goal-classification-select", value: goalCategory, onChange: (e) => setGoalCategory(e.target.value), className: "w-full bg-[#070708] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-250 focus:outline-none cursor-pointer [color-scheme:dark]", children: [_jsx("option", { value: "Somatic Containment", children: "Somatic Containment" }), _jsx("option", { value: "Cognitive Restructure", children: "Cognitive Restructure" }), _jsx("option", { value: "CBT Worksheets", children: "CBT Worksheets" }), _jsx("option", { value: "Sleep Health", children: "Sleep Hygiene" })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-[9px] uppercase font-bold text-slate-505 tracking-wider font-mono", children: "Target Date" }), _jsx("input", { id: "goal-target-date-input", type: "text", placeholder: "e.g. Next Wed", value: goalTargetDate, onChange: (e) => setGoalTargetDate(e.target.value), className: "w-full bg-[#070708] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" })] })] }), goalSuccess && (_jsxs("div", { className: "p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] rounded-xl flex items-center space-x-1", children: [_jsx(CheckCircle, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Goal registered successfully!" })] })), _jsx("button", { id: "add-goal-submit-btn", type: "submit", className: "w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-indigo-500/20 text-slate-200 font-bold text-xs py-2 rounded-xl transition cursor-pointer text-center", children: "Confirm Therapy Goal" })] })] }), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg space-y-4 text-left", id: "patient-reminders-panel", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400", children: _jsx(Bell, { className: "w-4 h-4 animate-bounce" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono", children: "Daily Care Alerts" }), _jsx("p", { className: "text-[10px] text-slate-400", children: "Receive standard desktop notifications to sync daily vital metrics." })] })] }), _jsxs("div", { className: "space-y-3 pt-2 text-xs", children: [_jsxs("div", { className: "flex items-center justify-between bg-[#070708] border border-white/5 p-3 rounded-xl", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx("span", { className: "font-bold text-slate-250 block text-[11px]", children: "Daily Reminder Alerts" }), _jsx("span", { className: "text-[9.5px] text-slate-500 block", children: "Reminder if mood is unlogged by target hour" })] }), _jsx("button", { id: "toggle-reminders-btn", type: "button", onClick: () => {
                                                            if (!remindersEnabled && notificationPermission !== "granted") {
                                                                handleRequestPermission();
                                                            }
                                                            setRemindersEnabled(!remindersEnabled);
                                                        }, className: `w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0 ${remindersEnabled ? "bg-indigo-600" : "bg-zinc-800"}`, children: _jsx("div", { className: `w-4.5 h-4.5 bg-white rounded-full shadow-md transform transition-transform ${remindersEnabled ? "translate-x-4.5" : "translate-x-0"}` }) })] }), remindersEnabled && (_jsxs("div", { className: "space-y-1.5 bg-[#070708] border border-white/5 p-3 rounded-xl transition", children: [_jsx("label", { htmlFor: "reminder-time-input", className: "block text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono", children: "Target Schedule Time (24h format)" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { id: "reminder-time-input", type: "time", value: reminderTime, onChange: (e) => setReminderTime(e.target.value), className: "bg-[#0A0A0C] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-205 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer [color-scheme:dark] flex-1" }), _jsx("span", { className: "text-[10px] font-mono text-slate-550", children: "Everyday" })] })] })), _jsxs("div", { className: "text-[10.5px] border border-white/5 p-3 rounded-xl bg-white/[0.01] space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-slate-450 font-mono text-[9px] uppercase tracking-wide", children: "Permission status:" }), notificationPermission === "granted" ? (_jsx("span", { className: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8.5px] font-bold px-1.5 py-0.2 rounded-sm font-mono flex items-center", children: "\u2713 GRANTED" })) : notificationPermission === "denied" ? (_jsx("span", { className: "bg-rose-500/10 border border-rose-500/20 text-rose-450 text-[8.5px] font-bold px-1.5 py-0.2 rounded-sm font-mono flex items-center", children: "\u2717 BLOCKED" })) : (_jsx("span", { className: "bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8.5px] font-bold px-1.5 py-0.2 rounded-sm font-mono flex items-center", children: "? REQUIRES PERMIT" }))] }), notificationPermission !== "granted" && (_jsx("button", { id: "request-notif-permission-btn", type: "button", onClick: handleRequestPermission, className: "w-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 py-1.5 rounded-xl transition text-[10px] font-bold cursor-pointer", children: "Authorize Desktop Reminders" })), notificationPermission === "granted" && (_jsx("button", { id: "trigger-test-notif-btn", type: "button", onClick: handleSendTestNotification, className: "w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-slate-350 py-1.5 rounded-xl transition text-[10px] font-bold cursor-pointer", children: "Trigger Test Alert Now" })), notificationPermission === "denied" && (_jsx("p", { className: "text-[9.5px] text-slate-500 leading-relaxed pt-1 select-none", children: "Note: Notifications have been disabled in browser. Reset permissions or select \"Open in new tab\" to let standard caret Reminders function." }))] })] })] })] })) : null, _jsxs("div", { className: !isPsychologist ? "lg:col-span-8 space-y-6" : "lg:col-span-12 space-y-6", id: "progress-dashboard-panel", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", id: "stats-summary-panels", children: [_jsxs("div", { className: "bg-[#0D0D0F] border border-white/5 p-4 rounded-2xl flex items-center space-x-3.5 text-left shadow-sm", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20", children: _jsx(TrendingUp, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("span", { className: "block text-[9px] uppercase font-bold text-slate-505 tracking-wider font-mono", children: "Average Tension Rate" }), _jsxs("p", { className: "text-xl font-mono font-bold text-slate-100", children: [averageStress, _jsx("span", { className: "text-xs text-slate-500", children: " / 10" })] }), _jsx("span", { className: "text-[10px] text-indigo-305", children: "Computed from latest traces" })] })] }), _jsxs("div", { className: "bg-[#0D0D0F] border border-white/5 p-4 rounded-2xl flex items-center space-x-3.5 text-left shadow-sm", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20", children: _jsx(Flame, { className: "w-5 h-5 shrink-0" }) }), _jsxs("div", { children: [_jsx("span", { className: "block text-[9px] uppercase font-bold text-slate-550 tracking-wider font-mono", children: "My Panic Spikes" }), _jsxs("p", { className: "text-xl font-mono font-bold text-slate-100", children: [totalPanicSpikes, " events"] }), _jsx("span", { className: "text-[10px] text-rose-400", children: "Autonomic alarms registered" })] })] }), _jsxs("div", { className: "bg-[#0D0D0F] border border-white/5 p-4 rounded-2xl flex items-center space-x-3.5 text-left shadow-sm", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20", children: _jsx(Target, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("span", { className: "block text-[9px] uppercase font-bold text-slate-550 tracking-wider font-mono", children: "Goals Checklist" }), _jsxs("p", { className: "text-xl font-mono font-bold text-slate-100", children: [goals.filter(g => g.status === 'completed').length, " ", _jsxs("span", { className: "text-xs text-slate-500", children: ["done / ", goals.length, " total"] })] }), _jsx("span", { className: "text-[10px] text-emerald-400", children: "Interactive therapy goals" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", id: "calendar-ai-report-parent", children: [_jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg text-left flex flex-col justify-between space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-sm font-semibold text-slate-150 uppercase tracking-widest flex items-center", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Calendar, { className: "w-4 h-4 text-indigo-400 mr-2 shrink-0" }), "Biological Safety Calendar"] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("button", { id: "cal-prev-month-btn", type: "button", onClick: () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)), className: "p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer", children: _jsx(ChevronLeft, { className: "w-3.5 h-3.5" }) }), _jsxs("span", { className: "text-[11px] font-mono font-bold text-slate-300 w-24 text-center select-none", children: [monthNames[currentMonthDate.getMonth()], " ", currentMonthDate.getFullYear()] }), _jsx("button", { id: "cal-next-month-btn", type: "button", onClick: () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)), className: "p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer", children: _jsx(ChevronRight, { className: "w-3.5 h-3.5" }) })] })] }), _jsx("p", { className: "text-[10px] text-slate-455 mt-1 leading-normal", children: "Trace autonomic states daily. Click on highlighted dates to load clinical journaling reflection text." })] }), _jsxs("div", { className: "grid grid-cols-7 gap-1.5 text-center mt-2", children: [["S", "M", "T", "W", "T", "F", "S"].map((dayName, idx) => (_jsx("span", { className: "text-[9px] font-bold text-slate-600 font-mono select-none", children: dayName }, idx))), calendarCells.map((cell, idx) => {
                                                        const dayLog = findCellLog(cell.dateObj);
                                                        const isCurrent = cell.isCurrentMonth;
                                                        const isToday = cell.dateObj.toDateString() === new Date().toDateString();
                                                        // mood bullet colors mapping
                                                        let moodColor = "bg-transparent";
                                                        if (dayLog) {
                                                            const mLower = dayLog.mood.toLowerCase();
                                                            if (mLower.includes("calm") || mLower.includes("empowered") || mLower.includes("clear") || mLower.includes("safe")) {
                                                                moodColor = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]";
                                                            }
                                                            else if (mLower.includes("tense") || mLower.includes("defensive") || mLower.includes("co-regulation")) {
                                                                moodColor = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]";
                                                            }
                                                            else if (mLower.includes("anxious") || mLower.includes("hyper") || mLower.includes("alert")) {
                                                                moodColor = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]";
                                                            }
                                                            else {
                                                                moodColor = "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.4)]"; // Gray-out/Burnout
                                                            }
                                                        }
                                                        return (_jsxs("button", { id: `calendar-cell-${cell.dateObj.getDate()}`, type: "button", onClick: () => dayLog && setActiveHistoryLog(dayLog), disabled: !dayLog, className: `relative aspect-square rounded-xl text-xs flex flex-col items-center justify-center border transition select-none group ${dayLog
                                                                ? "bg-[#141419] border-white/5 hover:border-indigo-500/20 hover:bg-[#1a1a23] hover:scale-105 cursor-pointer text-slate-100"
                                                                : "border-transparent text-slate-650"} ${!isCurrent ? "opacity-35" : "opacity-100"} ${isToday ? "ring-1 ring-indigo-500/40 bg-indigo-500/5" : ""}`, children: [_jsx("span", { className: "font-mono text-[9.5px] font-semibold", children: cell.day }), dayLog && (_jsx("span", { className: `w-1.5 h-1.5 rounded-full absolute bottom-1 ${moodColor} animate-pulse shadow-sm` }))] }, idx));
                                                    })] }), _jsx(AnimatePresence, { children: activeHistoryLog && (_jsxs(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: "auto" }, exit: { opacity: 0, height: 0 }, className: "p-3 bg-[#111114] border border-white/5 rounded-xl text-xs space-y-2 text-left", id: "calendar-cell-drawer", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-white/5 pb-1", children: [_jsxs("span", { className: "font-mono text-[9px] text-indigo-400 font-extrabold uppercase", children: ["Log metrics for ", activeHistoryLog.date] }), _jsx("button", { id: "close-cell-drawer-btn", type: "button", onClick: () => setActiveHistoryLog(null), className: "text-[9px] uppercase font-bold text-slate-500 hover:text-white transition cursor-pointer", children: "Close" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-[10.5px]", children: [_jsxs("div", { children: [_jsx("span", { className: "text-slate-500 block text-[9px] uppercase tracking-wide", children: "Dominant Mood State" }), _jsx("span", { className: "font-bold text-slate-200", children: activeHistoryLog.mood })] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500 block text-[9px] uppercase tracking-wide", children: "Vagal Tension Rate" }), _jsxs("span", { className: "font-bold text-indigo-400 font-mono", children: [activeHistoryLog.somaticStress, "/10"] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500 block text-[9px] uppercase tracking-wide", children: "Autonomic Panic Spikes" }), _jsxs("span", { className: "font-bold text-rose-450 font-mono", children: [activeHistoryLog.panicSpikesCount, " events"] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500 block text-[9px] uppercase tracking-wide", children: "Registered Symptoms" }), _jsx("div", { className: "flex flex-wrap gap-1 mt-0.5 max-h-12 overflow-y-auto", children: activeHistoryLog.symptoms && activeHistoryLog.symptoms.length > 0 ? (activeHistoryLog.symptoms.map(s => (_jsx("span", { className: "bg-white/5 px-1.5 py-0.2 rounded text-[8px] text-slate-400 font-mono", children: s }, s)))) : (_jsx("span", { className: "text-slate-650 text-[8px] italic", children: "No symptoms reported" })) })] })] }), activeHistoryLog.notes && (_jsxs("div", { className: "bg-[#070708] p-2 rounded-xl border border-white/5 space-y-1", children: [_jsxs("span", { className: "text-slate-500 block text-[8px] uppercase tracking-widest font-mono font-bold flex items-center", children: [_jsx(Mic, { className: "w-2.5 h-2.5 text-indigo-400 mr-1 shrink-0 animate-ping", style: { animationDuration: "3s" } }), "Therapeutic Reflection Notes"] }), _jsxs("p", { className: "text-slate-300 italic text-[10px] leading-relaxed select-text font-serif", children: ["\"", activeHistoryLog.notes, "\""] })] }))] })) })] }), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg text-left flex flex-col justify-between space-y-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("h3", { className: "text-sm font-semibold text-slate-150 uppercase tracking-widest flex items-center", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Sparkles, { className: "w-4 h-4 text-indigo-400 mr-2 shrink-0" }), "AI Clinical Correlation Report"] }), _jsx("p", { className: "text-[10px] text-slate-455 mt-1 leading-normal", children: "Formulate dynamic biofeedback patterns with Gemini models to isolate panic and respiratory trigger sources." })] }), _jsxs("div", { className: "flex-1 flex flex-col justify-center space-y-3 pt-2", children: [weeklyReport ? (_jsxs("div", { className: "bg-[#070708] border border-white/5 p-4 rounded-xl text-left space-y-3 max-h-[17rem] overflow-y-auto", id: "trend-report-container", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-white/5 pb-1", children: [_jsx("span", { className: "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-bold px-2 py-0.5 rounded font-mono tracking-wider uppercase", children: "AI Correlation Insight" }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs("button", { id: "copy-report-text-btn", type: "button", onClick: () => {
                                                                                    navigator.clipboard.writeText(weeklyReport);
                                                                                    alert("Copied AI Trend Report to clipboard!");
                                                                                }, className: "text-slate-500 hover:text-white transition flex items-center space-x-1 text-[9px] p-1 uppercase font-bold shrink-0 cursor-pointer", children: [_jsx(Copy, { className: "w-2.5 h-2.5 mr-0.5" }), _jsx("span", { children: "Copy" })] }), _jsx("button", { id: "clear-report-text-btn", type: "button", onClick: () => setWeeklyReport(""), className: "text-rose-500 hover:text-rose-450 transition text-[9px] p-1 uppercase font-bold shrink-0 cursor-pointer", children: "Clear" })] })] }), _jsx("div", { className: "text-[11px] text-slate-300 leading-relaxed font-serif prose prose-invert select-text max-w-none", children: _jsx(ReactMarkdown, { children: weeklyReport }) })] })) : (_jsxs("div", { className: "py-8 bg-[#070708]/40 border border-dashed border-white/5 rounded-xl text-center space-y-2.5 flex-1 flex flex-col justify-center items-center", children: [_jsx(Sparkles, { className: "w-6 h-6 text-indigo-500/40 animate-pulse" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-400 font-bold", children: "Synthesize Somatic Telemetry Traces" }), _jsx("p", { className: "text-[9.5px] text-slate-500 max-w-xs mx-auto mt-1 leading-normal", children: "Combines therapeutic targets and diagnostic history points to summarize breathing patterns, stress triggers, and vagal recovery milestones." })] })] })), _jsx("button", { id: "generate-trend-report-btn", type: "button", onClick: generateAITrendReport, disabled: isGeneratingReport || logs.length === 0, className: `w-full font-bold text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow hover:shadow-md ${isGeneratingReport || logs.length === 0
                                                            ? "bg-white/[0.01] border border-white/5 text-slate-600 cursor-not-allowed"
                                                            : "bg-indigo-600 hover:bg-indigo-550 text-white"}`, children: isGeneratingReport ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-1" }), _jsx("span", { children: "Tracing somatic triggers..." })] })) : (_jsxs(_Fragment, { children: [_jsx(Sparkles, { className: "w-3.5 h-3.5 mr-1 text-indigo-300 animate-pulse" }), _jsx("span", { children: weeklyReport ? "Regenerate AI Report" : "Generate AI Trend Report" })] })) }), logs.length === 0 && (_jsx("p", { className: "text-[9px] text-amber-500/80 italic text-center font-mono", children: "\u26A0\uFE0F Log at least one daily wellness trace to unlock report generation." })), reportError && (_jsx("p", { className: "text-[9.5px] text-red-400 text-center font-mono", children: reportError }))] })] })] }), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg text-left space-y-6", id: "somatic-analysis-box", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-white/5 pb-4 gap-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-semibold text-slate-100 uppercase tracking-widest flex items-center", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Sparkles, { className: "w-4 h-4 text-indigo-400 mr-2 shrink-0" }), "Somatic Tension Longitudinal Trend"] }), _jsx("p", { className: "text-[11px] text-slate-450 mt-1", children: "Real-time daily telemetry trace mapping baseline physiological safety. Keep tension rates under 5." })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3 mt-2 lg:mt-0", children: [_jsxs("div", { className: "flex space-x-2 text-[10px] font-mono", children: [_jsx("span", { className: "flex items-center text-[#4ade80] bg-[#4ade80]/5 px-2 py-0.5 rounded border border-[#4ade80]/15", children: "\u25CF Safe Vagally Tone" }), _jsx("span", { className: "flex items-center text-[#fb7185] bg-[#fb7185]/5 px-2 py-0.5 rounded border border-[#fb7185]/15", children: "\u25CF Defensive Panic" })] }), _jsxs("button", { id: "download-progress-report-pdf-btn", type: "button", onClick: handleDownloadPDFReport, className: "bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-md hover:shadow-lg shrink-0 ml-1.5", children: [_jsx(Download, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Download Health Report" })] })] })] }), logs.length === 0 ? (_jsxs("div", { className: "py-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl", children: [_jsx(Activity, { className: "w-8 h-8 text-slate-700 mx-auto mb-2" }), _jsx("p", { className: "text-xs text-slate-500", children: "No somatic tracking logs submitted in this cycle yet." }), _jsx("p", { className: "text-[10px] text-slate-600 mt-1", children: "Clinical telemetry requires daily sync tracking submissions." })] })) : (_jsxs("div", { className: "space-y-6", id: "trend-rendering-workspace", children: [_jsxs("div", { className: "flex items-center space-x-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl w-fit", id: "chart-view-selector", children: [_jsx("button", { id: "show-recharts-btn", onClick: () => setActiveChartTab("correlation"), className: `px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeChartTab === "correlation"
                                                            ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold"
                                                            : "text-slate-400 hover:text-slate-200 border border-transparent"}`, children: "Mood & Symptom Correlation Insights" }), _jsx("button", { id: "show-sparkline-btn", onClick: () => setActiveChartTab("sparkline"), className: `px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeChartTab === "sparkline"
                                                            ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold"
                                                            : "text-slate-400 hover:text-slate-200 border border-transparent"}`, children: "Sparkline Sequence Trace" }), _jsx("button", { id: "show-weekly-trend-btn", onClick: () => setActiveChartTab("weekly"), className: `px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${activeChartTab === "weekly"
                                                            ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold"
                                                            : "text-slate-400 hover:text-slate-200 border border-transparent"}`, children: "Weekly 7-Day Mood Trend" })] }), activeChartTab === "weekly" ? (_jsxs("div", { className: "bg-[#070708] rounded-xl border border-white/5 p-5 shadow-lg flex flex-col justify-between", id: "recharts-weekly-trend-card", children: [_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4", children: [_jsxs("div", { children: [_jsx("span", { className: "block text-[12px] font-bold text-slate-200", children: "7-Day Longitudinal Mood Trend (Weekly)" }), _jsx("span", { className: "text-[10px] text-slate-500 font-mono", children: "Consolidated metrics from daily gratitude insights & clinical logs" })] }), _jsx("div", { className: "flex items-center space-x-3 text-[9.5px] font-mono", children: _jsxs("span", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded bg-[#818cf8]" }), _jsx("span", { className: "text-indigo-300 font-medium", children: "Mood Score (1-10)" })] }) })] }), _jsx("div", { className: "w-full h-64", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: getWeeklyMoodTrendData(), margin: { top: 10, right: 10, left: -25, bottom: 5 }, children: [_jsx(XAxis, { dataKey: "date", stroke: "#475569", fontSize: 9, tickLine: false, axisLine: false }), _jsx(YAxis, { stroke: "#475569", fontSize: 9, domain: [0, 10], tickCount: 6, tickLine: false, axisLine: false }), _jsx(CartesianGrid, { stroke: "#1e293b", strokeDasharray: "3 3", vertical: false }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#09090b', borderColor: '#1e293b', borderRadius: '8px' }, labelStyle: { color: '#94a3b8', fontSize: '10px', fontFamily: 'monospace' }, itemStyle: { fontSize: '11px', padding: '2px 0' } }), _jsx(Line, { name: "Mood Score", type: "monotone", dataKey: "Mood Score", stroke: "#818cf8", strokeWidth: 3, dot: { r: 4, strokeWidth: 2, fill: "#0D0D0F" }, activeDot: { r: 6 } })] }) }) })] })) : activeChartTab === "correlation" ? (_jsxs("div", { className: "bg-[#070708] rounded-xl border border-white/5 p-5 shadow-lg flex flex-col justify-between", id: "recharts-mood-correlation-card", children: [_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4", children: [_jsxs("div", { children: [_jsx("span", { className: "block text-[12px] font-bold text-slate-200", children: "Mood Correlation Insights (Recharts)" }), _jsx("span", { className: "text-[10px] text-slate-500 font-mono", children: "Daily quantified mood values vs. total symptoms logged over previous 30 days" })] }), _jsxs("div", { className: "flex items-center space-x-3 text-[9.5px] font-mono", children: [_jsxs("span", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-[#818cf8]" }), _jsx("span", { className: "text-indigo-300 font-medium", children: "Mood Score (1-10)" })] }), _jsxs("span", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-[#f43f5e]" }), _jsx("span", { className: "text-rose-400 font-medium", children: "Symptoms Count" })] }), _jsxs("span", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-[#22c55e]" }), _jsx("span", { className: "text-emerald-400 font-medium", children: "Somatic Tension" })] })] })] }), _jsx("div", { className: "w-full h-64", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: getMoodSymptomCorrelationData(), margin: { top: 10, right: 10, left: -25, bottom: 5 }, children: [_jsx(XAxis, { dataKey: "date", stroke: "#475569", fontSize: 9, tickLine: false, axisLine: false }), _jsx(YAxis, { stroke: "#475569", fontSize: 9, domain: [0, 10], tickCount: 6, tickLine: false, axisLine: false }), _jsx(CartesianGrid, { stroke: "#1e293b", strokeDasharray: "3 3", vertical: false }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#09090b', borderColor: '#1e293b', borderRadius: '8px' }, labelStyle: { color: '#94a3b8', fontSize: '10px', fontFamily: 'monospace' }, itemStyle: { fontSize: '11px', padding: '2px 0' } }), _jsx(Line, { name: "Mood Score", type: "monotone", dataKey: "Mood Score", stroke: "#818cf8", strokeWidth: 2, dot: { r: 3, strokeWidth: 1 }, activeDot: { r: 5 } }), _jsx(Line, { name: "Symptoms Count", type: "monotone", dataKey: "Symptoms Count", stroke: "#f43f5e", strokeWidth: 2, dot: { r: 3, strokeWidth: 1 }, activeDot: { r: 5 } }), _jsx(Line, { name: "Somatic Tension", type: "monotone", dataKey: "Somatic Tension", stroke: "#22c55e", strokeWidth: 1.5, strokeDasharray: "4 4", dot: { r: 2 }, activeDot: { r: 4 } })] }) }) })] })) : (
                                            /* Custom Sparkline Graph Representation */
                                            _jsxs("div", { className: "h-44 bg-[#070708] rounded-xl border border-white/5 p-4 flex flex-col justify-between", id: "custom-telemetry-sparkline", children: [_jsxs("div", { className: "relative w-full h-24 flex items-end", children: [_jsxs("div", { className: "absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40", children: [_jsx("div", { className: "w-full border-t border-dashed border-white/5", children: _jsx("span", { className: "text-[7.5px] text-rose-500 font-mono", children: "10 - Spike Limit" }) }), _jsx("div", { className: "w-full border-t border-dashed border-white/5", children: _jsx("span", { className: "text-[7.5px] text-slate-500 font-mono", children: "5 - Baseline Median" }) }), _jsx("div", { className: "w-full border-t border-dashed border-white/5", children: _jsx("span", { className: "text-[7.5px] text-emerald-500 font-mono", children: "1 - Vagal Resonance" }) })] }), _jsxs("svg", { className: "w-full h-full text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]", viewBox: "0 0 100 24", preserveAspectRatio: "none", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "stress-grad", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#818cf8", stopOpacity: "0.4" }), _jsx("stop", { offset: "100%", stopColor: "#818cf8", stopOpacity: "0" })] }) }), _jsx("path", { d: `M 0 24 ${logs.slice().reverse().map((l, i) => {
                                                                            const x = (i / Math.max(1, logs.length - 1)) * 100;
                                                                            const y = 24 - (l.somaticStress / 10) * 24;
                                                                            return `L ${x} ${y}`;
                                                                        }).join(" ")} L 100 24 Z`, fill: "url(#stress-grad)" }), _jsx("path", { d: logs.slice().reverse().map((l, i) => {
                                                                            const x = (i / Math.max(1, logs.length - 1)) * 100;
                                                                            const y = 24 - (l.somaticStress / 10) * 24;
                                                                            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                                                                        }).join(" "), fill: "none", stroke: "currentColor", strokeWidth: "1", strokeLinecap: "round" })] }), _jsx("div", { className: "absolute inset-0 flex justify-between items-end", children: logs.slice().reverse().map((log, idx) => {
                                                                    const hoverColor = log.somaticStress >= 7 ? "bg-rose-505 ring-[#fb7185]/30" : "bg-indigo-500 ring-indigo-500/30";
                                                                    return (_jsxs("div", { style: {
                                                                            position: "absolute",
                                                                            left: `${(idx / Math.max(1, logs.length - 1)) * 100}%`,
                                                                            bottom: `${(log.somaticStress / 10) * 100}%`,
                                                                            transform: "translate(-50%, 50%)"
                                                                        }, className: `group cursor-pointer shrink-0 z-10`, id: `datapoint-${log.id}`, children: [_jsx("div", { className: `w-2.5 h-2.5 rounded-full ${hoverColor} ring-4 transition-transform group-hover:scale-150` }), _jsxs("div", { className: "absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/95 border border-white/10 p-2 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 w-32 shadow-xl shrink-0 font-mono text-[9px] text-slate-350 select-none", children: [_jsx("p", { className: "font-bold text-white", children: log.date }), _jsxs("p", { className: "text-indigo-300", children: ["Tension: ", log.somaticStress, "/10"] }), _jsxs("p", { className: "text-amber-300 font-semibold", children: ["Mood: ", log.mood] }), _jsxs("p", { className: "text-rose-450", children: ["Alarm spikes: ", log.panicSpikesCount] })] })] }, log.id));
                                                                }) })] }), _jsxs("div", { className: "flex justify-between items-center text-[8.5px] font-mono text-slate-500 pt-3 border-t border-white/5", children: [_jsx("span", { children: logs.slice().reverse()[0]?.date || "Oldest Entry" }), _jsx("span", { className: "text-slate-600", children: "Trace Logs Sequence Timeline" }), _jsx("span", { children: logs[0]?.date || "Latest Entry" })] })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", id: "symptoms-history-subgrid", children: [_jsxs("div", { className: "space-y-3.5 bg-[#070708] border border-white/5 p-4 rounded-xl", id: "symptomsfrequencybox", children: [_jsx("span", { className: "block text-[9.5px] uppercase font-bold text-indigo-400 tracking-wider font-mono", children: "Symptom Recurrence Breakdown" }), topSymptoms.length === 0 ? (_jsx("p", { className: "text-[11px] text-slate-500 italic pt-2", children: "No symptoms documented in log history yet." })) : (_jsx("div", { className: "space-y-2.5", children: topSymptoms.slice(0, 4).map(([name, count]) => {
                                                                    const percentage = Math.min(100, (count / logs.length) * 100);
                                                                    return (_jsxs("div", { className: "space-y-1 text-xs", id: `symptom-histogram-${name.replace(/\s+/g, "-")}`, children: [_jsxs("div", { className: "flex justify-between font-mono text-[10.5px]", children: [_jsx("span", { className: "text-slate-300 font-bold truncate pr-3", children: name }), _jsxs("span", { className: "text-slate-500 font-medium shrink-0", children: [count, " reports (", Math.round(percentage), "%)"] })] }), _jsx("div", { className: "w-full bg-white/5 h-1.5 rounded-full overflow-hidden", children: _jsx("div", { className: "bg-indigo-500 h-full rounded-full", style: { width: `${percentage}%` } }) })] }, name));
                                                                }) }))] }), _jsxs("div", { className: "space-y-3.5", id: "historical-logs-section", children: [_jsx("span", { className: "block text-[9.5px] uppercase font-bold text-indigo-400 tracking-wider font-mono", children: "Recent Telemetry Transcripts" }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto pr-1", children: logs.map((item) => (_jsxs("div", { id: `progress-log-card-${item.id}`, className: "p-3 bg-[#070708] border border-white/5 hover:border-indigo-500/10 rounded-xl space-y-1.5 text-xs text-left", children: [_jsxs("div", { className: "flex justify-between items-center text-[10px] font-mono", children: [_jsx("span", { className: "text-slate-400 font-bold", children: item.date }), _jsxs("div", { className: "flex items-center space-x-1.5", children: [_jsxs("span", { className: "text-rose-450", children: ["Tension: ", _jsxs("span", { className: "font-extrabold text-slate-200", children: [item.somaticStress, "/10"] })] }), _jsx("span", { children: "\u2022" }), _jsx("span", { className: "bg-indigo-500/10 text-indigo-300 font-bold px-1.5 py-0.1 border border-indigo-500/20 rounded uppercase text-[8.5px]", children: item.mood })] })] }), item.symptoms.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-1", children: item.symptoms.map((s, idx) => (_jsx("span", { className: "bg-white/[0.03] text-slate-400 border border-white/5 px-2 py-0.2 rounded-full text-[9px]", children: s }, idx))) })) : (_jsx("p", { className: "text-[10px] text-slate-500 italic", children: "No somatic symptoms flagged." }))] }, item.id))) })] })] }), _jsxs("div", { className: "bg-[#070708] border border-white/5 p-6 rounded-2xl space-y-6 mt-6 animate-fade-in", id: "gratitude-journals-box", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/5 pb-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "bg-indigo-500/10 text-indigo-300 font-bold px-2 py-0.5 border border-indigo-500/20 rounded-md uppercase text-[9px] tracking-wider font-mono", children: "Micro-Journaling Core" }), _jsx("span", { className: "text-[10px] text-slate-500 font-mono", children: "Inspired by Jamun App" })] }), _jsx("h4", { className: "text-md font-semibold text-slate-100 uppercase tracking-wider font-mono", children: "Private Reflection Canvas & Mood Pixels" }), _jsx("p", { className: "text-[11px] text-slate-400", children: "A clean, minimalist visual timeline and custom \"Year in Pixels\" matrix tracing daily gratitude milestones and quiet moments of safety." })] }), _jsxs("div", { className: "flex items-center space-x-2 bg-[#0C0C0F] border border-white/5 px-3 py-1.5 rounded-xl text-slate-400 font-mono text-[10.5px]", children: [_jsx(Sparkles, { className: "w-4 h-4 text-indigo-400 shrink-0 animate-pulse" }), _jsxs("span", { children: [journals.length, " Moments Logged"] })] })] }), _jsxs("div", { className: "bg-[#0C0C0F]/85 border border-white/5 p-4 rounded-xl space-y-4 text-left", children: [_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2", children: [_jsxs("div", { children: [_jsx("span", { className: "block text-[11px] font-bold text-slate-200 uppercase tracking-widest font-mono", children: "Mood Pixels Matrix (Past 30 Days)" }), _jsx("span", { className: "text-[9.5px] text-slate-500 font-mono block", children: "Hover over any colored square to recall daily moments" })] }), _jsxs("div", { className: "flex flex-wrap gap-2 text-[8px] font-mono select-none", children: [_jsxs("span", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]" }), _jsx("span", { className: "text-slate-405", children: "Thriving (10)" })] }), _jsxs("span", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.3)]" }), _jsx("span", { className: "text-slate-405", children: "Centered (8)" })] }), _jsxs("span", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded bg-teal-500 shadow-[0_0_6px_rgba(20,184,166,0.3)]" }), _jsx("span", { className: "text-slate-405", children: "Steady (6)" })] }), _jsxs("span", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.3)]" }), _jsx("span", { className: "text-slate-450", children: "Tense (4)" })] }), _jsxs("span", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.3)]" }), _jsx("span", { className: "text-slate-450", children: "Restless (3)" })] }), _jsxs("span", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded bg-slate-500 shadow-[0_0_6px_rgba(100,116,139,0.3)]" }), _jsx("span", { className: "text-slate-455", children: "Drained (2)" })] })] })] }), _jsx("div", { className: "flex flex-wrap gap-2 pt-1", id: "mood-pixel-grid", children: (() => {
                                                                    const list30 = [];
                                                                    const now = new Date();
                                                                    for (let i = 29; i >= 0; i--) {
                                                                        const d = new Date();
                                                                        d.setDate(now.getDate() - i);
                                                                        const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
                                                                        list30.push({
                                                                            dateStr,
                                                                            label: d.toLocaleDateString([], { month: "short", day: "numeric" }),
                                                                            dayOfWeek: d.toLocaleDateString([], { weekday: "short" })
                                                                        });
                                                                    }
                                                                    return list30.map((day) => {
                                                                        const jEntry = journals.find((j) => j.date === day.dateStr);
                                                                        let pixelBg = "bg-[#131316] border border-white/5 hover:border-slate-700";
                                                                        let glowShadow = "";
                                                                        let emojiText = "✖";
                                                                        if (jEntry) {
                                                                            const score = jEntry.moodScore;
                                                                            if (score >= 9) {
                                                                                pixelBg = "bg-emerald-500 hover:bg-emerald-400";
                                                                                glowShadow = "shadow-[0_0_10px_rgba(16,185,129,0.5)]";
                                                                                emojiText = "🌸";
                                                                            }
                                                                            else if (score >= 7) {
                                                                                pixelBg = "bg-indigo-550 hover:bg-indigo-500";
                                                                                glowShadow = "shadow-[0_0_10px_rgba(99,102,241,0.5)]";
                                                                                emojiText = "🧘";
                                                                            }
                                                                            else if (score >= 5) {
                                                                                pixelBg = "bg-teal-500 hover:bg-teal-400";
                                                                                glowShadow = "shadow-[0_0_10px_rgba(20,184,166,0.5)]";
                                                                                emojiText = "🍃";
                                                                            }
                                                                            else if (score >= 4) {
                                                                                pixelBg = "bg-amber-500 hover:bg-amber-400";
                                                                                glowShadow = "shadow-[0_0_10px_rgba(245,158,11,0.5)]";
                                                                                emojiText = "⚡";
                                                                            }
                                                                            else if (score >= 3) {
                                                                                pixelBg = "bg-rose-500 hover:bg-rose-405";
                                                                                glowShadow = "shadow-[0_0_10px_rgba(244,63,94,0.5)]";
                                                                                emojiText = "🌪️";
                                                                            }
                                                                            else {
                                                                                pixelBg = "bg-slate-500 hover:bg-slate-450";
                                                                                glowShadow = "shadow-[0_0_10px_rgba(100,116,139,0.5)]";
                                                                                emojiText = "🕯️";
                                                                            }
                                                                        }
                                                                        return (_jsxs("div", { className: "group relative", id: `pixel-day-${day.dateStr}`, children: [_jsx("div", { className: `w-8.5 h-8.5 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 transform hover:scale-110 cursor-pointer ${pixelBg} ${glowShadow}`, children: _jsx("span", { className: jEntry ? "text-[#0C0C0F] scale-95" : "text-slate-700 text-[8px]", children: jEntry ? emojiText : day.label.split(" ")[1] }) }), _jsxs("div", { className: "absolute top-10 left-1/2 -translate-x-1/2 bg-[#09090C] border border-white/10 p-3 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 w-52 shadow-2xl space-y-1.5 text-left text-[10px] leading-relaxed", children: [_jsxs("div", { className: "flex justify-between items-center border-b border-white/5 pb-1 select-none", children: [_jsxs("span", { className: "font-extrabold text-slate-100 font-mono", children: [day.label, " (", day.dayOfWeek, ")"] }), jEntry ? (_jsxs("span", { className: "text-[9px] font-mono bg-indigo-500/10 text-indigo-400 font-bold px-1.5 py-0.2 rounded border border-indigo-500/20", children: ["Score: ", jEntry.moodScore, "/10"] })) : (_jsx("span", { className: "text-[9px] font-mono text-slate-600", children: "Pending" }))] }), jEntry ? (_jsxs("div", { className: "space-y-1 select-text", children: [_jsx("p", { className: "text-slate-450 uppercase font-bold text-[8.5px] tracking-wide font-mono", children: "Mood descriptor:" }), _jsx("p", { className: "text-indigo-300 font-semibold text-[10.5px]", children: jEntry.moodText }), _jsx("p", { className: "text-slate-450 uppercase font-bold text-[8.5px] tracking-wide font-mono", children: "Micro reflection:" }), _jsxs("p", { className: "text-slate-300 font-serif italic max-h-24 overflow-y-auto", children: ["\"", jEntry.gratitudeText.length > 110 ? jEntry.gratitudeText.slice(0, 110) + "..." : jEntry.gratitudeText, "\""] })] })) : (_jsx("p", { className: "text-slate-500 italic", children: "No micro journal logged for this day slot. Sync your first reflection." }))] })] }, day.dateStr));
                                                                    });
                                                                })() })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("span", { className: "block text-[11px] font-bold text-slate-300 uppercase tracking-widest font-mono text-left", children: "Private Reflection Timeline Feed" }), journals.length === 0 ? (_jsxs("div", { className: "py-12 border border-dashed border-white/5 rounded-2xl text-center flex flex-col items-center justify-center space-y-2.5", children: [_jsx(Smile, { className: "w-8 h-8 text-indigo-500/40 animate-pulse" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-400 font-bold", children: "Your Journal timeline is pristine & waiting" }), _jsx("p", { className: "text-[10px] text-slate-550 max-w-xs mx-auto mt-1 leading-normal", children: "Tap the purple glowing \"Quick Journal\" floating action launcher below to instantly document safe somatic gratitude milestones." })] })] })) : (
                                                            /* Chronological list on vertical connector line */
                                                            _jsx("div", { className: "relative border-l-2 border-white/5 ml-3 pl-6 space-y-6 text-left", id: "jamun-timeline-thread", children: journals.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((j) => {
                                                                    const score = j.moodScore;
                                                                    let timelineDotColor = "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]";
                                                                    let moodBadgeColor = "bg-indigo-500/10 border-indigo-500/20 text-indigo-300";
                                                                    let emojiSym = "🧘";
                                                                    if (score >= 9) {
                                                                        timelineDotColor = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]";
                                                                        moodBadgeColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                                                                        emojiSym = "🌸";
                                                                    }
                                                                    else if (score >= 7) {
                                                                        timelineDotColor = "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]";
                                                                        moodBadgeColor = "bg-indigo-500/10 border-indigo-500/20 text-indigo-300";
                                                                        emojiSym = "🧘";
                                                                    }
                                                                    else if (score >= 5) {
                                                                        timelineDotColor = "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]";
                                                                        moodBadgeColor = "bg-teal-500/10 border-teal-500/20 text-teal-400";
                                                                        emojiSym = "🍃";
                                                                    }
                                                                    else if (score >= 4) {
                                                                        timelineDotColor = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]";
                                                                        moodBadgeColor = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                                                                        emojiSym = "⚡";
                                                                    }
                                                                    else if (score >= 3) {
                                                                        timelineDotColor = "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
                                                                        moodBadgeColor = "bg-rose-500/10 border-rose-500/20 text-rose-450";
                                                                        emojiSym = "🌪️";
                                                                    }
                                                                    else {
                                                                        timelineDotColor = "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]";
                                                                        moodBadgeColor = "bg-slate-500/10 border-slate-500/20 text-slate-400";
                                                                        emojiSym = "🕯️";
                                                                    }
                                                                    let formattedTimestamp = j.date;
                                                                    try {
                                                                        const d = new Date(j.timestamp || j.date);
                                                                        if (!isNaN(d.getTime())) {
                                                                            formattedTimestamp = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " at " + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                                                                        }
                                                                    }
                                                                    catch { }
                                                                    return (_jsxs("div", { className: "relative group transition-all duration-300", id: `timeline-node-${j.id}`, children: [_jsx("span", { className: `absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-2 border-[#070708] ${timelineDotColor} transition-transform duration-300 group-hover:scale-125 z-15` }), _jsxs("div", { className: "bg-[#0C0C0F]/90 border border-white/5 hover:border-indigo-500/20 p-4 rounded-xl space-y-3 transition-colors", children: [_jsxs("div", { className: "flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-2", children: [_jsx("span", { className: "text-[11px] font-mono text-slate-400 font-semibold", children: formattedTimestamp }), _jsx("div", { className: "flex items-center space-x-2", children: _jsxs("span", { className: `text-[9px] font-bold px-2 py-0.5 rounded border uppercase font-mono tracking-wider ${moodBadgeColor}`, children: [emojiSym, " ", j.moodText, " (", j.moodScore, "/10)"] }) })] }), _jsx("div", { className: "space-y-1.5 select-text", children: _jsx("p", { className: "text-slate-300 font-sans text-xs whitespace-pre-wrap leading-relaxed", children: j.gratitudeText }) })] })] }, j.id));
                                                                }) }))] })] })] }))] }), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg text-left space-y-4", id: "goals-dashboard-container", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-semibold text-slate-100 uppercase tracking-widest flex items-center", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Target, { className: "w-4.5 h-4.5 text-indigo-400 mr-2 shrink-0" }), "Active Therapeutic Goals Board"] }), _jsx("p", { className: "text-[11px] text-slate-400 mt-1", children: "Interactive roadmap mapping clinical milestones with real-time state tracking." })] }), goals.length === 0 ? (_jsxs("div", { className: "py-12 bg-[#070708]/50 border border-dashed border-white/5 rounded-2xl text-center", id: "emptygoalslist", children: [_jsx(Target, { className: "w-8 h-8 text-slate-700 mx-auto mb-2" }), _jsx("p", { className: "text-xs text-slate-500", children: "No therapeutic co-goals mapped for this clinic cycle yet." }), _jsx("p", { className: "text-[10px] text-slate-655 mt-1", children: "Co-construct targeted safety limits using the form on the left pane." })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", id: "goals-grid-deck", children: goals.map((goal) => {
                                            const statusColors = goal.status === "completed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                                goal.status === "abandoned" ? "text-slate-500 bg-white/[0.02] border-white/5" :
                                                    "bg-indigo-505/10 border-indigo-500/20 text-indigo-400";
                                            return (_jsxs("div", { id: `goal-profile-box-${goal.id}`, className: `p-4 rounded-xl border flex flex-col justify-between space-y-3.5 text-left bg-white/[0.01] ${statusColors}`, children: [_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("span", { className: "text-[9px] font-mono tracking-wider uppercase font-bold text-slate-450", children: goal.category }), _jsx("span", { className: `text-[8px] font-bold tracking-widest px-2 py-0.2 rounded border uppercase font-mono ${goal.status === "completed" ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-slate-700 text-slate-420"}`, children: goal.status })] }), _jsx("p", { className: `text-xs font-medium leading-relaxed ${goal.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-205'}`, children: goal.goalText })] }), _jsxs("div", { className: "flex justify-between items-center text-[10px] pt-1.5 border-t border-white/5 shrink-0", children: [_jsxs("span", { className: "text-[10px] text-slate-450 font-mono", children: ["Target: ", goal.targetDate] }), !isPsychologist ? (_jsxs("div", { className: "flex space-x-1 shrink-0 z-10", children: [goal.status !== "completed" && (_jsx("button", { id: `complete-goal-btn-${goal.id}`, onClick: () => handleUpdateGoalStatus(goal.id, "completed"), className: "px-2 py-0.5 bg-emerald-600 hover:bg-emerald-505 text-white rounded font-bold text-[9px] cursor-pointer transition uppercase", children: "Done" })), goal.status === "completed" && (_jsx("button", { id: `reactivate-goal-btn-${goal.id}`, onClick: () => handleUpdateGoalStatus(goal.id, "active"), className: "px-2 py-0.5 bg-[#1e293b] text-slate-300 hover:bg-slate-800 rounded font-bold text-[9px] cursor-pointer transition uppercase", children: "Revive" })), _jsx("button", { id: `delete-goal-btn-${goal.id}`, onClick: () => handleDeleteGoal(goal.id), className: "p-1 text-slate-500 hover:text-rose-400 transition", title: "Delete Goal", children: _jsx(Trash, { className: "w-3 h-3" }) })] })) : (_jsx("span", { className: "text-[9.5px] italic text-indigo-300 font-medium", children: "Assigned Patient Goal" }))] })] }, goal.id));
                                        }) }))] }), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg text-left space-y-5", id: "habit-tracker-container", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-semibold text-slate-100 uppercase tracking-widest flex items-center", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Flame, { className: "w-4.5 h-4.5 text-orange-400 mr-2 shrink-0 animate-pulse" }), "Somatic Habit Accelerator"] }), _jsx("p", { className: "text-[11px] text-slate-400 mt-1", children: "Track daily micro-goals to build autonomic safety and vagal tone pathways." })] }), !isPsychologist && (_jsxs("form", { onSubmit: handleCreateHabit, className: "flex gap-2 shrink-0", children: [_jsx("input", { id: "new-habit-input", type: "text", value: newHabitName, onChange: (e) => setNewHabitName(e.target.value), placeholder: "e.g., Deep Breathing...", className: "bg-[#070708] border border-white/10 text-slate-200 placeholder:text-slate-600 rounded-xl px-3 py-1 text-xs outline-none focus:border-indigo-500/50 transition w-full sm:w-48" }), _jsxs("button", { id: "add-habit-btn", type: "submit", className: "bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl px-3 py-1 font-semibold text-xs transition cursor-pointer flex items-center shrink-0", children: [_jsx(Plus, { className: "w-3.5 h-3.5 mr-1" }), _jsx("span", { children: "Create" })] })] }))] }), habits.length === 0 ? (_jsxs("div", { className: "py-12 bg-[#070708]/50 border border-dashed border-white/5 rounded-2xl text-center", id: "emptyhabitslist", children: [_jsx(Flame, { className: "w-8 h-8 text-slate-700 mx-auto mb-2" }), _jsx("p", { className: "text-xs text-slate-500", children: "No recurring somatic habits established for this cycle yet." }), !isPsychologist ? (_jsx("p", { className: "text-[10px] text-slate-600 mt-1", children: "Establish daily repeats (like 'box breathing') to track therapeutic resilience streaks." })) : (_jsx("p", { className: "text-[10px] text-slate-600 mt-1", children: "The patient has not logged any custom somatic habits yet." }))] })) : (_jsx("div", { className: "space-y-4", id: "habits-list-deck", children: habits.map((habit) => {
                                            const currentStreak = calculateStreak(habit);
                                            return (_jsxs("div", { id: `habit-card-${habit.id}`, className: "p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { className: "space-y-1 text-left", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-xs font-bold text-slate-100", children: habit.name }), !isPsychologist && (_jsx("button", { id: `delete-habit-btn-${habit.id}`, onClick: () => handleDeleteHabit(habit.id), className: "p-1 text-slate-600 hover:text-rose-450 transition", title: "Delete Habit", children: _jsx(Trash, { className: "w-3 h-3" }) }))] }), _jsxs("div", { className: "flex items-center space-x-2 text-[10px] text-slate-450", children: [_jsxs("span", { className: "flex items-center bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-mono font-bold border border-orange-500/15", children: [_jsx(Flame, { className: "w-3 h-3 mr-1 text-orange-400 animate-pulse fill-current" }), currentStreak, " Day Streak"] }), _jsxs("span", { className: "text-[9px] text-slate-500 font-mono", children: ["Added: ", new Date(habit.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })] })] })] }), _jsx("div", { className: "flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0", children: getPast7Days().map((day) => {
                                                            const isDone = habit.completedDays?.includes(day.dateStr);
                                                            return (_jsxs("button", { id: `toggle-habit-${habit.id}-${day.dateStr}`, type: "button", disabled: isPsychologist, onClick: () => handleToggleHabitDay(habit, day.dateStr), className: `flex flex-col items-center justify-between p-1.5 w-11 h-12 rounded-lg border transition ${isDone
                                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                                    : day.isToday
                                                                        ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-300 pointer-events-auto"
                                                                        : "bg-slate-900/40 border-slate-800/45 text-slate-500 hover:border-slate-700"} ${isPsychologist
                                                                    ? "cursor-default"
                                                                    : "cursor-pointer"}`, title: isPsychologist
                                                                    ? `${habit.name}: ${isDone ? "Completed" : "Incomplete"} on ${day.dateStr} (Read-only)`
                                                                    : `${isDone ? "Earned" : "Toggle"} streak point on ${day.dateStr}`, children: [_jsx("span", { className: "text-[8px] uppercase tracking-wider font-mono font-bold", children: day.dayName }), isDone ? (_jsx(CheckCircle, { className: "w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" })) : (_jsx("span", { className: `text-[10px] font-mono font-bold ${day.isToday ? 'text-indigo-400' : 'text-slate-500'}`, children: day.dayNum }))] }, day.dateStr));
                                                        }) })] }, habit.id));
                                        }) }))] }), isPsychologist && (_jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg text-left space-y-4", id: "clinician-reflections-reader", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-semibold text-slate-100 uppercase tracking-widest flex items-center", style: { fontFamily: "Georgia, serif" }, children: [_jsx(ClipboardCheck, { className: "w-4.5 h-4.5 text-indigo-400 mr-2 shrink-0" }), "Completed Workbook Reflections (", connectedAssignments.length, ")"] }), _jsx("p", { className: "text-[11px] text-slate-400 mt-1", children: "Review active cognitive homework replies submitted by the patient." })] }), connectedAssignments.length === 0 ? (_jsxs("div", { className: "py-8 bg-[#070708]/50 border border-dashed border-white/5 rounded-2xl text-center", children: [_jsx(ClipboardCheck, { className: "w-8 h-8 text-slate-700 mx-auto mb-2" }), _jsx("p", { className: "text-xs text-slate-505", children: "No completed homework reflections logged by this patient yet." })] })) : (_jsx("div", { className: "space-y-4", id: "clinician-homework-reviews-stage", children: connectedAssignments.map((item) => (_jsxs("div", { className: "p-4 bg-[#070708] border border-white/5 rounded-xl space-y-3 text-xs text-left", children: [_jsxs("div", { className: "flex justify-between items-center border-b border-white/5 pb-2", children: [_jsx("span", { className: "font-bold text-slate-200 text-xs", children: item.title }), _jsxs("span", { className: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.2 rounded font-mono font-bold", children: ["SUBMITTED ", item.completedAt] })] }), item.questions && item.questions.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("span", { className: "text-[9.5px] font-bold text-slate-500 uppercase tracking-wider font-mono", children: "Workbook Prompt Answers:" }), item.questions.map((prompt, qIdx) => (_jsxs("div", { className: "bg-white/[0.01] border border-white/5 p-2 rounded-lg text-slate-350", children: [_jsxs("p", { className: "font-semibold text-slate-205", children: ["Q: ", prompt] }), _jsxs("p", { className: "italic text-slate-300 mt-1", children: ["A: ", item.answers && item.answers[qIdx] ? item.answers[qIdx] : "[No response recorded]"] })] }, qIdx)))] })), _jsxs("div", { className: "pt-2 border-t border-white/5 text-slate-300 space-y-1", children: [_jsx("span", { className: "text-[9.5px] font-bold text-slate-505 uppercase tracking-wider font-mono block", children: "Patient's Summary reflections:" }), _jsxs("p", { className: "bg-indigo-950/10 border border-indigo-500/10 p-2.5 rounded-lg italic text-indigo-300", children: ["\"", item.patientReflections || "No reflection logged.", "\""] })] })] }, item.id))) }))] }))] })] }), !isPsychologist && (_jsxs("button", { id: "fab-quick-journal", type: "button", onClick: () => setShowJournalModal(true), className: "fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white p-4 rounded-full shadow-2xl transition cursor-pointer flex items-center space-x-2 group border border-indigo-500/30", title: "Quick Daily Journal", children: [_jsx(Sparkles, { className: "w-5 h-5 text-indigo-200 animate-pulse" }), _jsx("span", { className: "text-xs font-bold uppercase tracking-wider max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap font-mono", children: "Quick Journal" })] })), _jsx(AnimatePresence, { children: showJournalModal && (_jsx("div", { className: "fixed inset-0 bg-[#000000]/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in", id: "journal-modal-overlay", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 15 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 15 }, className: "bg-[#0C0C0E] rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 relative overflow-hidden", id: "journal-modal-container", children: [journalSuccess && (_jsxs("div", { className: "absolute inset-0 bg-[#08080A] z-50 flex flex-col items-center justify-center text-center p-6 animate-fade-in", id: "journal-success-overlay", children: [_jsx("div", { className: "p-4 bg-emerald-500/10 text-emerald-400 rounded-full mb-3 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]", children: _jsx(CheckCircle, { className: "w-10 h-10 animate-bounce" }) }), _jsx("h3", { className: "text-lg font-bold text-slate-100 uppercase tracking-widest font-mono", children: "Reflection Locked" }), _jsx("p", { className: "text-xs text-slate-400 mt-2 max-w-xs leading-relaxed", children: "Your daily Jamun-inspired micro journal has been securely registered to your clinical history feed. Beautifully done." })] })), _jsxs("div", { className: "flex justify-between items-start mb-5 pb-3 border-b border-white/5", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[9px] uppercase tracking-wider font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-sm", children: "Momentary Micro-Journal" }), _jsx("h3", { className: "text-sm font-semibold text-slate-100 tracking-wide mt-2 uppercase font-mono", children: "Document Safe Reflection" })] }), _jsx("button", { id: "close-journal-btn", onClick: () => setShowJournalModal(false), className: "p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleSaveJournalEntry, className: "space-y-5 text-left", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono", children: "Select Core Emotional Quality" }), _jsx("div", { className: "grid grid-cols-3 gap-2.5", id: "mood-selection-grid", children: [
                                                    { text: "Empowered", score: 10, emoji: "🌸", colorClass: "hover:border-emerald-500/30", activeClass: "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]", label: "Thriving" },
                                                    { text: "Calm", score: 8, emoji: "🧘", colorClass: "hover:border-indigo-500/30", activeClass: "bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]", label: "Centered" },
                                                    { text: "Balanced", score: 6, emoji: "🍃", colorClass: "hover:border-teal-400/30", activeClass: "bg-teal-400/10 border-teal-500 text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.15)]", label: "Steady" },
                                                    { text: "Tense", score: 4, emoji: "⚡", colorClass: "hover:border-amber-500/30", activeClass: "bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]", label: "Tense" },
                                                    { text: "Anxious", score: 3, emoji: "🌪️", colorClass: "hover:border-rose-400/30", activeClass: "bg-rose-500/10 border-rose-500 text-rose-450 shadow-[0_0_12px_rgba(244,63,94,0.15)]", label: "Restless" },
                                                    { text: "Burnout", score: 2, emoji: "🕯️", colorClass: "hover:border-slate-500/30", activeClass: "bg-slate-500/10 border-slate-500 text-slate-300 shadow-[0_0_12px_rgba(100,116,139,0.15)]", label: "Drained" }
                                                ].map((m) => {
                                                    const isActive = journalMoodText === m.text;
                                                    return (_jsxs("button", { type: "button", onClick: () => {
                                                            setJournalMoodText(m.text);
                                                            setJournalMoodScore(m.score);
                                                        }, className: `flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 select-none cursor-pointer ${isActive ? m.activeClass : "bg-[#101013] border-white/5 text-slate-400 hover:text-slate-205 " + m.colorClass}`, children: [_jsx("span", { className: "text-lg mb-1", children: m.emoji }), _jsx("span", { className: "text-[10px] font-bold tracking-tight font-mono", children: m.text }), _jsx("span", { className: "text-[8px] text-slate-500 leading-none mt-0.5", children: m.label })] }, m.text));
                                                }) })] }), _jsxs("div", { className: "bg-[#101013] border border-white/5 p-3 rounded-xl space-y-1.5", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("label", { htmlFor: "journal-mood-score", className: "block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono", children: ["Refined Intensity Gauge: ", journalMoodScore, "/10"] }), _jsx("span", { className: "text-[10px] text-indigo-400 font-mono font-bold", children: journalMoodScore >= 9 ? "Deeply Thriving" : journalMoodScore >= 7 ? "Grounded" : journalMoodScore >= 5 ? "Neutral/Steady" : "Tender" })] }), _jsx("input", { id: "journal-mood-score", type: "range", min: "1", max: "10", step: "1", value: journalMoodScore, onChange: (e) => setJournalMoodScore(Number(e.target.value)), className: "w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none" }), _jsxs("div", { className: "flex justify-between text-[7px] text-slate-600 font-mono px-0.5", children: [_jsx("span", { children: "Critical (1)" }), _jsx("span", { children: "Stable (6)" }), _jsx("span", { children: "Optimal (10)" })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono", children: "Stuck? Choose a starter reflection prompt" }), _jsx("div", { className: "flex flex-wrap gap-1.5", id: "modal-reflection-prompts", children: [
                                                    "Today I felt safe & anchored when ",
                                                    "One beautiful detail I noticed today was ",
                                                    "A small physical victory that felt comforting: ",
                                                    "Today, my mind was gentlest when ",
                                                    "I list three positive things I saw: "
                                                ].map((promptText, i) => (_jsxs("button", { type: "button", onClick: () => setJournalGratitude(promptText), className: "text-[9px] bg-[#101013] border border-white/5 hover:border-indigo-500/20 hover:text-slate-100 text-slate-400 px-2 py-1 rounded-lg transition active:scale-95 cursor-pointer max-w-full text-ellipsis overflow-hidden whitespace-nowrap", children: ["\"", promptText.trim(), "...\""] }, i))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "journal-gratitude-input", className: "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono", children: "Daily Reflection Text" }), _jsx("textarea", { id: "journal-gratitude-input", required: true, placeholder: "Describe a detail, a victory, or three pleasant occurrences from today...", rows: 3.5, value: journalGratitude, onChange: (e) => setJournalGratitude(e.target.value), className: "w-full bg-[#101013] border border-white/5 text-slate-205 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500/50 leading-relaxed resize-none font-sans" })] }), _jsxs("div", { className: "flex space-x-3 pt-2", children: [_jsx("button", { id: "cancel-journal-btn", type: "button", onClick: () => setShowJournalModal(false), className: "flex-1 bg-white/[0.02]/80 hover:bg-white/[0.04] border border-white/5 text-slate-400 hover:text-slate-200 font-semibold px-4 py-2.5 rounded-xl transition text-center text-xs cursor-pointer font-mono", children: "Close" }), _jsx("button", { id: "confirm-journal-btn", type: "submit", className: "flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition text-center text-xs cursor-pointer shadow-md font-mono hover:scale-[1.02] active:scale-[0.98] duration-200", children: "Save Reflection" })] })] })] }) })) })] }));
}
