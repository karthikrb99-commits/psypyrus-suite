import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Calendar, FileText, Activity, ShieldCheck, ArrowRight, ClipboardList, CheckSquare, Award, Star, Check, Database, Download } from "lucide-react";
import { db } from "../services/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
function FeedbackForm({ appointmentId, psychologistName, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(null);
    const [comment, setComment] = useState("");
    const [anonymous, setAnonymous] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!comment.trim())
            return;
        setIsSubmitting(true);
        setTimeout(() => {
            onSuccess(rating, comment.trim(), anonymous);
            setIsSubmitting(false);
        }, 800);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "p-4 bg-indigo-950/20 border border-indigo-500/10 rounded-xl space-y-4 text-xs mt-4 animate-fade-in", id: `feedback-form-${appointmentId}`, children: [_jsxs("div", { className: "flex justify-between items-center pb-2 border-b border-white/5", children: [_jsx("span", { className: "font-extrabold text-[10px] uppercase tracking-wider text-indigo-400 font-mono", children: "Confidential Post-Session Feedback" }), _jsx("span", { className: "text-[10px] text-slate-500", children: "Quality Assurance" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono", children: ["1. Rate session efficacy with ", psychologistName.split(",")[0]] }), _jsxs("div", { className: "flex items-center space-x-2", children: [[1, 2, 3, 4, 5].map((star) => (_jsx("button", { type: "button", id: `star-btn-${star}-${appointmentId}`, onClick: () => setRating(star), onMouseEnter: () => setHoverRating(star), onMouseLeave: () => setHoverRating(null), className: "p-1 hover:scale-110 transition cursor-pointer", children: _jsx(Star, { className: `w-5 h-5 ${star <= (hoverRating ?? rating)
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-slate-600 fill-transparent"}` }) }, star))), _jsxs("span", { className: "ml-2 font-bold text-slate-300 font-mono text-sm", children: [rating, "/5 Stars"] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono", children: "2. Clinical comments & feedback" }), _jsx("textarea", { id: `feedback-comment-${appointmentId}`, required: true, placeholder: "Help optimize future care. Share constructive feedback regarding breathing coaching, visual quality, clinical suggestions, or dialogue focus...", rows: 3, value: comment, onChange: (e) => setComment(e.target.value), className: "w-full bg-[#0A0A0C] border border-white/10 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed resize-none" })] }), _jsxs("div", { className: "flex items-start space-x-2.5 bg-[#070708] p-3 rounded-xl border border-white/5", children: [_jsx("input", { id: `feedback-anon-checkbox-${appointmentId}`, type: "checkbox", checked: anonymous, onChange: (e) => setAnonymous(e.target.checked), className: "mt-0.5 rounded border-white/10 text-indigo-600 focus:ring-0 cursor-pointer w-4 h-4" }), _jsxs("div", { className: "space-y-0.5 text-[11px]", children: [_jsx("label", { htmlFor: `feedback-anon-checkbox-${appointmentId}`, className: "font-bold text-slate-300 cursor-pointer", children: "Submit anonymously to psychologist" }), _jsx("span", { className: "text-slate-500 block leading-normal", children: "Hides your name, email, and avatar. Your clinician receives only the star rating and qualitative comments to protect therapeutic trust." })] })] }), _jsx("button", { id: `submit-feedback-btn-${appointmentId}`, type: "submit", disabled: isSubmitting || !comment.trim(), className: "w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1", children: _jsx("span", { children: isSubmitting ? "Submitting Secured Review..." : "Submit Confidential Feedback" }) })] }));
}
export default function Profile({ currentUser, appointments, setActiveTab, setAppointments, onToggleRole, isRealUser }) {
    const isPsychologist = currentUser.role === "psychologist";
    // Filter user appointments
    const myAppointments = isPsychologist
        ? appointments.filter((a) => a.psychologistId === currentUser.id)
        : appointments.filter((a) => a.patientId === currentUser.id);
    const upcomingAppts = myAppointments.filter((a) => a.status === "scheduled" || a.status === "active");
    const pastAppts = myAppointments.filter((a) => a.status === "completed");
    // Wellness logger for patients
    const [somaticStress, setSomaticStress] = useState(4); // range 1-10
    const [panicSpikesCount, setPanicSpikesCount] = useState(0);
    const [activeMood, setActiveMood] = useState("Calm");
    const [logSaved, setLogSaved] = useState(false);
    const [logsList, setLogsList] = useState([
        { date: "Yesterday", mood: "Tense", rate: 7 },
        { date: "2 days ago", mood: "Balanced", rate: 3 }
    ]);
    // Selected completed brief to expand
    const [activeExpandedBriefId, setActiveExpandedBriefId] = useState(null);
    // Selected feedback active form to expand
    const [activeFeedbackFormId, setActiveFeedbackFormId] = useState(null);
    // Firestore sync for progress, symptom and habits history for clinical export
    const [dbLogs, setDbLogs] = useState([]);
    useEffect(() => {
        if (!currentUser.id)
            return;
        const qLogs = query(collection(db, "progress_logs"), where("patientId", "==", currentUser.id));
        const unsub = onSnapshot(qLogs, (snap) => {
            const arr = [];
            snap.forEach((doc) => {
                arr.push(doc.data());
            });
            setDbLogs(arr);
        }, (err) => {
            console.warn("DB logs subscription failed on Profile: ", err);
        });
        return () => unsub();
    }, [currentUser.id]);
    const handleExportJSON = () => {
        const dataToExport = {
            timestamp: new Date().toISOString(),
            profile: {
                id: currentUser.id,
                name: currentUser.name,
                role: currentUser.role,
                email: currentUser.email,
                bio: currentUser.bio || "N/A",
                credentials: currentUser.credentials || []
            },
            appointments: myAppointments.map(appt => ({
                id: appt.id,
                date: appt.date,
                time: appt.time,
                clinicianName: appt.psychologistName,
                clinicianSpecialty: appt.psychologistSpecialty,
                sessionStatus: appt.status,
                clinicalNotes: appt.clinicalNotes || "N/A",
                aiSummary: appt.summaryPDF || "N/A",
                feedback: appt.feedback || null
            })),
            progressLogs: (dbLogs.length > 0 ? dbLogs : logsList.map((l, i) => ({
                id: `local_log_${i}`,
                patientId: currentUser.id,
                patientName: currentUser.name,
                date: l.date,
                mood: l.mood,
                somaticStress: l.rate,
                panicSpikesCount: 0,
                symptoms: [],
                timestamp: new Date().toISOString()
            })))
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `secure_health_records_${currentUser.name.replace(/\s+/g, "_")}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };
    const handleExportCSV = () => {
        let csvContent = "";
        csvContent += "=== SECURED USER CLINICAL HEALTH PROFILE ===\n";
        csvContent += `User ID,${currentUser.id}\n`;
        csvContent += `Full Name,${currentUser.name}\n`;
        csvContent += `Email Address,${currentUser.email}\n`;
        csvContent += `Role Classification,${currentUser.role}\n\n`;
        csvContent += "=== TELEHEALTH CONSULTATION APPOINTMENTS ===\n";
        csvContent += "Appointment ID,Scheduled Date,Scheduled Time,Consulting Clinician,Clinician Specialty,Session Status,Feedback Rating,Clinical Jotted Notes,Session Summary\n";
        myAppointments.forEach(appt => {
            const escapedNotes = (appt.clinicalNotes || "").replace(/"/g, '""');
            const escapedSummary = (appt.summaryPDF || "").replace(/"/g, '""');
            csvContent += `"${appt.id}","${appt.date}","${appt.time}","${appt.psychologistName}","${appt.psychologistSpecialty}","${appt.status}","${appt.feedback?.rating || 'Unrated'}","${escapedNotes}","${escapedSummary}"\n`;
        });
        csvContent += "\n";
        csvContent += "=== DAILY SOMATIC PROGRESS & SYMPTOM LOG HISTORY ===\n";
        csvContent += "Log Reference ID,Recorded Date,Dominant Mood State,Somatic Tension Level (1-10),Panic Spikes Count,Logged Symptoms List,Additional Notes\n";
        const somaticLogsToUse = dbLogs.length > 0 ? dbLogs : logsList.map((l, i) => ({
            id: `local_log_${i}`,
            patientId: currentUser.id,
            patientName: currentUser.name,
            date: l.date,
            mood: l.mood,
            somaticStress: l.rate,
            panicSpikesCount: 0,
            symptoms: [],
            timestamp: new Date().toISOString(),
            notes: ""
        }));
        somaticLogsToUse.forEach(log => {
            const escapedNotes = (log.notes || "").replace(/"/g, '""');
            const symptomsStr = (log.symptoms || []).join("; ");
            csvContent += `"${log.id}","${log.date}","${log.mood}","${log.somaticStress}","${log.panicSpikesCount}","${symptomsStr}","${escapedNotes}"\n`;
        });
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", url);
        downloadAnchor.setAttribute("download", `secure_health_records_${currentUser.name.replace(/\s+/g, "_")}.csv`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };
    const handleFeedbackSuccess = (apptId, rating, comment, anonymous) => {
        setAppointments((prevAppts) => prevAppts.map((a) => a.id === apptId
            ? {
                ...a,
                feedback: {
                    rating,
                    comment,
                    anonymous,
                    submittedAt: new Date().toISOString()
                }
            }
            : a));
        // Close form after successful submission
        setActiveFeedbackFormId(null);
        // Expand brief so they can see confirmation
        setActiveExpandedBriefId(apptId);
    };
    // Patient manual wellness log save handler
    const handleSaveWellnessLog = (e) => {
        e.preventDefault();
        const newLog = {
            date: "Today at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            mood: activeMood,
            rate: somaticStress
        };
        setLogsList([newLog, ...logsList]);
        setLogSaved(true);
        setTimeout(() => setLogSaved(false), 2000);
    };
    return (_jsx("div", { className: "max-w-7xl mx-auto px-4 py-8 text-left", id: "profile-container", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8", children: [_jsxs("div", { className: "lg:col-span-4 space-y-6", id: "profile-left-col", children: [_jsx("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg", id: "user-profile-details", children: _jsxs("div", { className: "flex flex-col items-center text-center", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: currentUser.avatar, alt: currentUser.name, referrerPolicy: "no-referrer", className: "w-20 h-20 rounded-full object-cover ring-4 ring-white/5" }), _jsx("span", { className: "absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-[#0D0D0F]" })] }), _jsxs("h2", { className: "text-md font-bold text-slate-100 mt-3 leading-none flex items-center justify-center space-x-1", children: [_jsx("span", { children: currentUser.name }), isPsychologist && _jsx(ShieldCheck, { className: "w-4 h-4 text-indigo-400 shrink-0" })] }), _jsxs("span", { className: "text-[11px] text-slate-505 mt-1 capitalize font-medium", children: [currentUser.role, " ID: ", currentUser.id] }), _jsx("p", { className: "text-xs text-slate-400 mt-2", children: currentUser.email }), isRealUser && onToggleRole && (_jsxs("button", { id: "toggle-profile-role-btn", onClick: onToggleRole, className: "mt-4 w-full px-4 py-2 bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] text-slate-200 text-[11px] font-semibold rounded-xl transition cursor-pointer text-center", children: ["Switch Role to ", isPsychologist ? "Patient" : "Psychologist"] })), isPsychologist && (_jsxs("div", { className: "mt-4 pt-4 border-t border-white/5 w-full space-y-3 text-left", children: [_jsxs("div", { className: "text-[11px]", children: [_jsx("span", { className: "font-extrabold text-slate-500 block uppercase tracking-wider font-mono", children: "Credentials" }), _jsx("p", { className: "font-semibold text-slate-200", children: currentUser.degree }), _jsx("p", { className: "text-indigo-300 font-medium", children: "Verified CA state Clinician" })] }), _jsxs("div", { className: "text-[11px]", children: [_jsx("span", { className: "font-extrabold text-slate-500 block uppercase tracking-wider font-mono", children: "Base Session Rate" }), _jsxs("p", { className: "font-bold text-slate-100 font-mono", children: ["$", currentUser.fee, "/hr (100% Tax-Free)"] })] })] }))] }) }), !isPsychologist && (_jsxs("div", { className: "bg-gradient-to-br from-indigo-505/5 to-purple-500/5 rounded-2xl border border-white/5 p-5 shadow-lg", id: "wellness-logger-card", children: [_jsxs("h3", { className: "text-sm font-light uppercase tracking-wider text-slate-200 flex items-center mb-3", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Activity, { className: "w-4 h-4 text-indigo-400 mr-2" }), "Track Somatic Triggers"] }), _jsxs("form", { onSubmit: handleSaveWellnessLog, className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide font-mono", children: ["Daily Somatic Tension Rate (", somaticStress, "/10)"] }), _jsx("input", { id: "somatic-tension-range", type: "range", min: "1", max: "10", value: somaticStress, onChange: (e) => setSomaticStress(Number(e.target.value)), className: "w-full accent-indigo-500 cursor-pointer" }), _jsxs("div", { className: "flex justify-between text-[9px] text-slate-500 font-mono", children: [_jsx("span", { children: "1 - Serene" }), _jsx("span", { children: "5 - Moderate" }), _jsx("span", { children: "10 - Extreme" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide font-mono", children: "Current Mood" }), _jsxs("select", { id: "mood-logger-select", value: activeMood, onChange: (e) => setActiveMood(e.target.value), className: "w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-[#0D0D0F] cursor-pointer [color-scheme:dark]", children: [_jsx("option", { value: "Calm", children: "Calm" }), _jsx("option", { value: "Tense", children: "Tense" }), _jsx("option", { value: "Burnout", children: "Burnout" }), _jsx("option", { value: "Anxious", children: "Anxious" }), _jsx("option", { value: "Empowered", children: "Empowered" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide font-mono", children: "Panic Spikes (Today)" }), _jsxs("div", { className: "flex items-center space-x-1.5 pt-1", children: [_jsx("button", { id: "decrease-spike-btn", type: "button", onClick: () => setPanicSpikesCount(Math.max(0, panicSpikesCount - 1)), className: "bg-white/[0.02] border border-white/10 w-6 h-6 rounded-md flex items-center justify-center font-bold text-slate-300 hover:bg-white/[0.05] cursor-pointer", children: "-" }), _jsx("span", { className: "font-bold text-xs text-slate-200 w-4 text-center font-mono", children: panicSpikesCount }), _jsx("button", { id: "increase-spike-btn", type: "button", onClick: () => setPanicSpikesCount(panicSpikesCount + 1), className: "bg-white/[0.02] border border-white/10 w-6 h-6 rounded-md flex items-center justify-center font-bold text-slate-300 hover:bg-white/[0.05] cursor-pointer", children: "+" })] })] })] }), _jsxs("button", { id: "save-well-log-btn", type: "submit", className: "w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1", children: [_jsx(ClipboardList, { className: "w-3.5 h-3.5" }), _jsx("span", { children: logSaved ? "Metrics Securely Logged!" : "Save Somatic Log" })] })] }), _jsxs("div", { className: "mt-4 pt-4 border-t border-white/5 space-y-2", children: [_jsx("span", { className: "block text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono", children: "Log History" }), _jsx("div", { className: "space-y-1.5 text-xs text-slate-300", children: logsList.map((log, idx) => (_jsxs("div", { className: "flex justify-between items-center bg-[#0A0A0C]/50 border border-white/5 px-2.5 py-1.5 rounded-lg font-mono", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-400", children: log.date }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.2 rounded text-[10px]", children: log.mood }), _jsxs("span", { className: "text-slate-505 text-[10px]", children: ["Tension: ", log.rate, "/10"] })] })] }, idx))) })] })] })), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg relative overflow-hidden", id: "health-data-portability-exporter", children: [_jsx("div", { className: "absolute top-0 right-0 w-24 h-24 bg-indigo-505/5 rounded-full blur-2xl pointer-events-none" }), _jsxs("h3", { className: "text-sm font-light uppercase tracking-wider text-slate-200 flex items-center mb-1.5", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Database, { className: "w-4 h-4 text-indigo-400 mr-2 shrink-0" }), "Somatic Records & HIPAA Export"] }), _jsx("p", { className: "text-[11.5px] text-slate-400 leading-relaxed mb-4", children: "Export a legally compliant, portable duplicate of your entire telehealth profile, session appointments, somatic moods, and complete symptom history." }), _jsxs("div", { className: "grid grid-cols-2 gap-3 mb-2", children: [_jsxs("button", { id: "export-data-json-btn", onClick: handleExportJSON, className: "bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 border border-white/5 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer", children: [_jsx(Download, { className: "w-3.5 h-3.5 text-indigo-400 shrink-0" }), _jsx("span", { children: "JSON Document" })] }), _jsxs("button", { id: "export-data-csv-btn", onClick: handleExportCSV, className: "bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 border border-white/5 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer", children: [_jsx(Download, { className: "w-3.5 h-3.5 text-emerald-400 shrink-0" }), _jsx("span", { children: "CSV Sheet" })] })] }), _jsx("span", { className: "text-[9px] font-mono text-slate-500 block text-center uppercase tracking-widest mt-3 pt-3 border-t border-white/5", children: "Secure 256-bit HIPAA Record Duplicate" })] })] }), _jsxs("div", { className: "lg:col-span-8 space-y-6", id: "profile-right-col", children: [_jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg", id: "upcoming-clinics-card", children: [_jsxs("h2", { className: "text-sm font-light uppercase tracking-wider text-slate-100 flex items-center mb-4", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Calendar, { className: "w-4.5 h-4.5 text-indigo-400 mr-2" }), "Upcoming Virtual Consultations"] }), upcomingAppts.length === 0 ? (_jsxs("div", { className: "py-10 text-center bg-[#0A0A0C]/30 rounded-xl border border-dashed border-white/10", id: "empty-upcoming-appts", children: [_jsx("p", { className: "text-xs text-slate-500", children: "No scheduled consultations for the near future." }), _jsxs("button", { id: "empty-book-redirect", onClick: () => setActiveTab("directory"), className: "mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1 mx-auto", children: [_jsx("span", { children: "Find a Psychologist" }), _jsx(ArrowRight, { className: "w-3.5 h-3.5" })] })] })) : (_jsx("div", { className: "space-y-3.5", children: upcomingAppts.map((appt) => (_jsxs("div", { id: `upcoming-appt-${appt.id}`, className: "p-4 bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/30 rounded-2xl transition flex flex-col sm:flex-row justify-between items-start sm:items-center", children: [_jsxs("div", { className: "flex items-center space-x-3.5", children: [_jsx("img", { src: appt.psychologistAvatar, alt: appt.psychologistName, referrerPolicy: "no-referrer", className: "w-11 h-11 rounded-full object-cover ring-2 ring-white/5" }), _jsxs("div", { className: "text-left space-y-0.5", children: [_jsxs("div", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "font-extrabold text-sm text-slate-200", children: appt.psychologistName }), _jsx("span", { className: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded-sm uppercase tracking-wide", children: "Confirmed" })] }), _jsx("p", { className: "text-xs text-slate-400", children: appt.psychologistSpecialty }), _jsxs("p", { className: "text-[11px] font-medium text-indigo-300", children: [appt.date, " at ", appt.time, " (Online Virtual Room)"] })] })] }), _jsx("button", { id: `join-appt-btn-${appt.id}`, onClick: () => {
                                                    // Mark active if scheduled, and navigate to clinicroom!
                                                    setAppointments(appointments.map((a) => (a.id === appt.id ? { ...a, status: "active" } : a)));
                                                    setActiveTab("consultations");
                                                }, className: "w-full sm:w-auto mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer text-center", children: "Enter Secure Chamber" })] }, appt.id))) }))] }), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg", id: "completed-plans-card", children: [_jsxs("h2", { className: "text-sm font-light uppercase tracking-wider text-slate-100 flex items-center mb-4", style: { fontFamily: "Georgia, serif" }, children: [_jsx(ClipboardList, { className: "w-4.5 h-4.5 text-indigo-400 mr-2" }), "Somatic Care Plans & AI summaries"] }), pastAppts.length === 0 ? (_jsxs("div", { className: "py-12 text-center text-slate-500 bg-white/[0.01] rounded-2xl border border-dashed border-white/10", children: [_jsx(FileText, { className: "w-8 h-8 text-slate-600 mx-auto mb-2" }), _jsx("p", { className: "text-xs", children: "No historical care plans available." }), _jsx("p", { className: "text-[11px] text-slate-600 mt-1", children: "Conclude active consultations inside Video Clinics to compile custom AI briefs." })] })) : (_jsx("div", { className: "space-y-4", children: pastAppts.map((appt) => {
                                        const isExpanded = activeExpandedBriefId === appt.id;
                                        return (_jsxs("div", { id: `historical-card-${appt.id}`, className: "bg-[#0D0D0F] border border-white/5 rounded-2xl overflow-hidden hover:border-indigo-500/20 transition-all flex flex-col text-left", children: [_jsxs("div", { onClick: () => setActiveExpandedBriefId(isExpanded ? null : appt.id), className: "p-4 bg-white/[0.01] border-b border-white/5 flex justify-between items-center cursor-pointer", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(ClipboardList, { className: "w-4 h-4 text-slate-500 shrink-0" }), _jsxs("div", { children: [_jsxs("h4", { className: "text-xs font-bold text-slate-200", children: ["Clinical Tele-consultation Brief \u2014 ", appt.date] }), _jsxs("span", { className: "text-[10px] text-slate-550 block mt-0.5", children: ["Conducted with ", appt.psychologistName.split(",")[0], " \u2022 Duration: 50 minutes", appt.feedback && (_jsx("span", { className: "text-emerald-400 font-bold ml-2", children: "\u2022 \u2605 Feedback Logged" }))] })] })] }), _jsx("span", { className: "text-xs font-bold text-indigo-400 hover:underline", children: isExpanded ? "Close Briefing" : "Read AI Summary" })] }), isExpanded && (_jsxs("div", { className: "p-5 bg-[#0A0A0C] space-y-4 leading-relaxed border-t border-white/5 animate-fade-in", id: `brief-box-${appt.id}`, children: [appt.summaryPDF ? (_jsxs("div", { className: "prose prose-xs max-w-full text-xs text-slate-300", children: [_jsxs("div", { className: "flex items-center space-x-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-305 font-bold px-2.5 py-1 rounded text-[10px] mb-4", children: [_jsx(Award, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Secured Clinical Record" })] }), _jsx("div", { className: "whitespace-pre-line font-sans text-left", children: appt.summaryPDF })] })) : (_jsx("p", { className: "text-xs text-slate-500", children: "Brief summary notes are not available for this session." })), _jsx("div", { className: "pt-4 border-t border-white/5 mt-4", children: appt.feedback ? (
                                                            /* Feedback already exists: show it nicely regardless of patient or psychologist */
                                                            _jsxs("div", { className: "p-4 bg-indigo-950/10 border border-indigo-500/10 rounded-xl space-y-2 text-xs", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("span", { className: "text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 font-mono flex items-center", children: [_jsx(Check, { className: "w-3.5 h-3.5 mr-1" }), " Post-Session Feedback"] }), _jsxs("span", { className: "text-[10px] text-slate-500 font-mono", children: ["Submitted ", new Date(appt.feedback.submittedAt).toLocaleDateString()] })] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("div", { className: "flex mr-1.5", children: [1, 2, 3, 4, 5].map((star) => (_jsx(Star, { className: `w-3.5 h-3.5 ${star <= appt.feedback.rating
                                                                                        ? "text-amber-400 fill-amber-400"
                                                                                        : "text-slate-700"}` }, star))) }), _jsxs("span", { className: "text-[11px] font-mono text-slate-300", children: ["(", appt.feedback.rating, "/5)"] }), appt.feedback.anonymous ? (_jsx("span", { className: "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold px-1.5 py-0.2 rounded-sm ml-2 uppercase font-mono tracking-wide", children: "Anonymous Channel" })) : (_jsx("span", { className: "bg-slate-800 text-slate-300 text-[9px] font-bold px-1.5 py-0.2 rounded-sm ml-2 uppercase font-mono tracking-wide", children: isPsychologist ? appt.patientName : "Review Shared" }))] }), _jsxs("p", { className: "text-slate-305 leading-relaxed italic pt-1", children: ["\"", appt.feedback.comment, "\""] })] })) : (
                                                            /* Feedback doesn't exist: show options */
                                                            !isPsychologist ? (
                                                            /* Patient: can submit feedback */
                                                            _jsx("div", { children: activeFeedbackFormId === appt.id ? (_jsx(FeedbackForm, { appointmentId: appt.id, psychologistName: appt.psychologistName, onSuccess: (rating, comment, anonymous) => handleFeedbackSuccess(appt.id, rating, comment, anonymous) })) : (_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-950/10 border border-indigo-500/10 p-3.5 rounded-xl gap-3", children: [_jsx("p", { className: "text-[11px] text-slate-400", children: "Help optimize future clinical guidelines. Rate your session and provide anonymous feedback." }), _jsx("button", { id: `open-feedback-form-btn-${appt.id}`, onClick: (e) => {
                                                                                e.stopPropagation();
                                                                                setActiveFeedbackFormId(appt.id);
                                                                            }, className: "bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-[11px] px-3.5 py-2.5 rounded-xl transition shrink-0 cursor-pointer", children: "Leave Session Feedback" })] })) })) : (
                                                            /* Psychologist: show empty placeholder */
                                                            _jsx("p", { className: "text-[11px] text-slate-500 italic", children: "No patient feedback submitted for this session yet." }))) })] }))] }, appt.id));
                                    }) }))] }), _jsxs("div", { className: "bg-emerald-950/10 border border-emerald-500/10 rounded-2xl p-4 text-xs text-emerald-300", id: "profile-ethics-guidelines", children: [_jsxs("h4", { className: "font-extrabold flex items-center mb-1", children: [_jsx(CheckSquare, { className: "w-4 h-4 text-emerald-400 mr-1.5" }), "Confidentiality Protocol"] }), _jsx("p", { className: "leading-relaxed", children: "Care plans on PsychConnect are isolated within client state models and encrypted parameters. No personal identifier information is leaked or submitted to uncontrolled web indexing crawlers. Clinicians and patients are perfectly secured." })] })] })] }) }));
}
