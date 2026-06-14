import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { PREDEFINED_RESOURCES } from "../services/data";
import { assignResourceInFirebase, updateAssignedResourceCompletionInFirebase } from "../services/firebaseStore";
import { db } from "../services/firebase";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { BookOpen, BookText, CheckCircle, Clock, Send, Play, RotateCcw, UserPlus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
export default function ResourceLibrary({ currentUser, allUsers }) {
    const isPsychologist = currentUser.role === "psychologist";
    // State
    const [activeTab, setActiveTab] = useState("browse");
    const [filterType, setFilterType] = useState("all");
    const [filterTopic, setFilterTopic] = useState("all");
    const [assignedList, setAssignedList] = useState([]);
    const [allPatients, setAllPatients] = useState([]);
    // Assign resource flow
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [assigneeId, setAssigneeId] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignSuccess, setAssignSuccess] = useState(false);
    // Active resource workout modal
    const [workoutResource, setWorkoutResource] = useState(null);
    const [worksheetAnswers, setWorksheetAnswers] = useState([]);
    const [patientReflection, setPatientReflection] = useState("");
    // Pacer state for Box Breathing exercise
    const [pacerStep, setPacerStep] = useState(0);
    const [pacerTimer, setPacerTimer] = useState(4);
    const [isPacerActive, setIsPacerActive] = useState(false);
    // Extract unique topics
    const topics = Array.from(new Set(PREDEFINED_RESOURCES.map((r) => r.topic)));
    // Load all patients from users dropdown list helper
    useEffect(() => {
        // Collect users who are patients
        const patients = allUsers.filter((u) => u.role === "patient");
        setAllPatients(patients);
        if (patients.length > 0) {
            setAssigneeId(patients[0].id);
        }
    }, [allUsers]);
    // Sync assigned resources from Firestore
    useEffect(() => {
        const q = collection(db, "assigned_resources");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => {
                list.push(doc.data());
            });
            // Filter based on user role securely on client
            if (isPsychologist) {
                setAssignedList(list.filter((r) => r.assignedById === currentUser.id));
            }
            else {
                setAssignedList(list.filter((r) => r.assignedToId === currentUser.id));
            }
        }, (err) => {
            console.warn("Real-time assignments subscription error using mock fallback:", err);
        });
        return () => unsubscribe();
    }, [currentUser, isPsychologist]);
    // Handle assigning resource
    const handleAssignResource = async (e) => {
        e.preventDefault();
        if (!selectedTemplate || !assigneeId)
            return;
        const patient = allPatients.find((p) => p.id === assigneeId);
        if (!patient)
            return;
        const newAssignment = {
            id: "assign_" + Date.now(),
            templateId: selectedTemplate.id,
            title: selectedTemplate.title,
            type: selectedTemplate.type,
            topic: selectedTemplate.topic,
            description: selectedTemplate.description,
            content: selectedTemplate.content,
            questions: selectedTemplate.questions || [],
            steps: selectedTemplate.steps || [],
            assignedById: currentUser.id,
            assignedByName: currentUser.name,
            assignedToId: patient.id,
            assignedToName: patient.name,
            assignedAt: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }),
            isCompleted: false
        };
        try {
            await assignResourceInFirebase(newAssignment);
            setAssignSuccess(true);
            setTimeout(() => {
                setAssignSuccess(false);
                setIsAssigning(false);
                setSelectedTemplate(null);
            }, 1500);
        }
        catch (err) {
            console.error("Failed to assign resource:", err);
        }
    };
    // Open resource view or template interactive session
    const openWorkout = (assigned) => {
        setWorkoutResource(assigned);
        setWorksheetAnswers(assigned.questions ? assigned.questions.map(() => "") : []);
        setPatientReflection(assigned.patientReflections || "");
        setIsPacerActive(false);
        setPacerStep(0);
        setPacerTimer(4);
    };
    // Box Breathing visual timer loop
    useEffect(() => {
        let interval;
        if (isPacerActive && workoutResource?.type === "exercise") {
            interval = setInterval(() => {
                setPacerTimer((prev) => {
                    if (prev <= 1) {
                        setPacerStep((step) => (step + 1) % 4);
                        return 4; // Reset to 4 seconds for next step
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPacerActive, workoutResource]);
    const pacerInstructions = [
        { title: "INHALE", desc: "Breath in slow, cool air...", color: "border-indigo-500 bg-indigo-500/10 text-indigo-400 scale-125" },
        { title: "HOLD GENTLY", desc: "Allow air to rest in lungs...", color: "border-purple-500 bg-purple-500/10 text-purple-400 scale-125 font-bold" },
        { title: "EXHALE", desc: "Release all stress and tension...", color: "border-teal-500 bg-teal-500/10 text-teal-400 scale-95" },
        { title: "HOLD EMPTY", desc: "Observe perfect silence...", color: "border-slate-500 bg-slate-500/10 text-slate-400 scale-95" }
    ];
    // Submit patient answers / annotations
    const handleSubmitWorkout = async () => {
        if (!workoutResource)
            return;
        try {
            await updateAssignedResourceCompletionInFirebase(workoutResource.id, true, worksheetAnswers, patientReflection, new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }));
            setWorkoutResource(null);
        }
        catch (err) {
            console.error("Failed to complete assignment:", err);
        }
    };
    // Psychologist retracting assignments
    const handleDeleteAssignment = async (id) => {
        if (!confirm("Are you sure you want to delete / retract this assignment?"))
            return;
        try {
            await deleteDoc(doc(db, "assigned_resources", id));
        }
        catch (err) {
            console.error("Retraction failed:", err);
        }
    };
    // Filter templates
    const filteredTemplates = PREDEFINED_RESOURCES.filter((res) => {
        const matchType = filterType === "all" || res.type === filterType;
        const matchTopic = filterTopic === "all" || res.topic === filterTopic;
        return matchType && matchTopic;
    });
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8 text-left", id: "resource-library-root", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between mb-8 border-b border-white/5 pb-5", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-xl font-light tracking-wide text-slate-100 uppercase flex items-center", style: { fontFamily: "Georgia, serif" }, children: [_jsx(BookOpen, { className: "w-5.5 h-5.5 text-indigo-500 mr-2 shrink-0 animate-pulse" }), "Therapeutic Resource Library"] }), _jsx("p", { className: "text-xs text-slate-400 mt-1 max-w-xl", children: "Browse and coordinate professional cognitive-behavioral tools, deep somatic breathing sheets, and verified anxiety containment worksheets." })] }), _jsxs("div", { className: "flex bg-[#0D0D0F] border border-white/5 rounded-xl p-1 mt-4 md:mt-0 max-w-fit shadow-md", children: [_jsx("button", { id: "tab-browse-resources", onClick: () => setActiveTab("browse"), className: `px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none uppercase tracking-wider ${activeTab === "browse" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`, children: "All Templates" }), _jsxs("button", { id: "tab-assignments", onClick: () => setActiveTab("assignments"), className: `px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none uppercase tracking-wider flex items-center ${activeTab === "assignments" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`, children: [_jsx("span", { children: isPsychologist ? "My Assignments" : "Assigned Homework" }), assignedList.filter(r => !r.isCompleted).length > 0 && (_jsx("span", { className: "w-2 h-2 ml-1.5 rounded-full bg-rose-500 animate-pulse" }))] })] })] }), activeTab === "browse" ? (_jsxs("div", { className: "space-y-6", id: "browse-templates-screen", children: [_jsxs("div", { className: "bg-[#0D0D0F] border border-white/5 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-sm", children: [_jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "block text-[9px] uppercase font-bold text-slate-500 tracking-wide font-mono", children: "Filter by Resource Type" }), _jsxs("select", { id: "filter-type-select", value: filterType, onChange: (e) => setFilterType(e.target.value), className: "bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer [color-scheme:dark]", children: [_jsx("option", { value: "all", children: "All Templates" }), _jsx("option", { value: "article", children: "Articles" }), _jsx("option", { value: "worksheet", children: "Worksheets" }), _jsx("option", { value: "exercise", children: "Guided Exercises" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "block text-[9px] uppercase font-bold text-slate-500 tracking-wide font-mono", children: "Filter by Topic" }), _jsxs("select", { id: "filter-topic-select", value: filterTopic, onChange: (e) => setFilterTopic(e.target.value), className: "bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer [color-scheme:dark]", children: [_jsx("option", { value: "all", children: "All Topics" }), topics.map((t) => (_jsx("option", { value: t, children: t }, t)))] })] })] }), _jsxs("div", { className: "text-[11px] font-mono text-slate-500", children: ["Showing ", _jsx("span", { className: "text-indigo-400 font-bold", children: filteredTemplates.length }), " structured resource templates"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", id: "templates-grid", children: filteredTemplates.map((res) => {
                            const iconColor = res.type === "article" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                                res.type === "worksheet" ? "text-purple-400 bg-purple-500/10 border-purple-500/20" :
                                    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                            return (_jsxs("div", { id: `template-card-${res.id}`, className: "bg-[#0D0D0F] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/20 transition-all shadow-md flex flex-col justify-between", children: [_jsxs("div", { className: "space-y-3 text-left", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: `px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${iconColor}`, children: res.type }), _jsx("span", { className: "text-[10px] text-slate-500 capitalize", children: res.topic })] }), _jsx("h3", { className: "font-bold text-slate-100 text-sm leading-snug", children: res.title }), _jsx("p", { className: "text-xs text-slate-400 leading-relaxed line-clamp-3", children: res.description })] }), _jsx("div", { className: "mt-5 pt-4 border-t border-white/5 flex items-center justify-between", children: isPsychologist ? (_jsxs("button", { id: `assign-btn-${res.id}`, onClick: () => {
                                                setSelectedTemplate(res);
                                                setIsAssigning(true);
                                            }, className: "w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1", children: [_jsx(UserPlus, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Assign Homework" })] })) : (_jsxs("div", { className: "flex items-center space-x-2 text-[11px] text-slate-500", children: [_jsx(BookText, { className: "w-4 h-4 text-slate-600" }), _jsx("span", { children: "Self-guided checkout tool" })] })) })] }, res.id));
                        }) })] })) : (_jsx("div", { className: "space-y-6", id: "assignments-screen", children: assignedList.length === 0 ? (_jsxs("div", { className: "py-16 text-center bg-[#0D0D0F] border border-dashed border-white/10 rounded-2xl max-w-lg mx-auto", id: "empty-assignments", children: [_jsx(Clock, { className: "w-10 h-10 text-slate-650 mx-auto mb-2.5 block" }), _jsx("h3", { className: "text-sm font-semibold text-slate-350 uppercase tracking-widest", style: { fontFamily: "Georgia, serif" }, children: "No active homework assignments" }), _jsx("p", { className: "text-xs text-slate-500 mt-2.5 max-w-xs mx-auto leading-relaxed", children: isPsychologist
                                ? "You have not assigned any therapy materials to your clinical client profiles yet. Head over to templates to assign cognitive sheets!"
                                : "Excellent job! You are caught up with all homework assigned by your connected clinician specialists." })] })) : (_jsx("div", { className: "space-y-4", id: "assignments-history", children: assignedList.sort((a, b) => b.id.localeCompare(a.id)).map((item) => {
                        const isItemCompleted = item.isCompleted;
                        return (_jsxs("div", { id: `assignment-bar-${item.id}`, className: `p-4 rounded-2xl border transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isItemCompleted
                                ? "bg-emerald-950/5 border-emerald-500/10 hover:border-emerald-500/20"
                                : "bg-indigo-950/5 border-indigo-500/10 hover:border-indigo-500/20 animate-pulse"}`, children: [_jsxs("div", { className: "flex-1 min-w-0 text-left space-y-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "font-bold text-xs text-slate-200", children: item.title }), isItemCompleted ? (_jsxs("span", { className: "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[8.5px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider flex items-center", children: [_jsx(CheckCircle, { className: "w-2.5 h-2.5 mr-1" }), "Completed ", item.completedAt && `(${item.completedAt})`] })) : (_jsxs("span", { className: "bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[8.5px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider flex items-center", children: [_jsx(Clock, { className: "w-2.5 h-2.5 mr-1 animate-spin" }), "Needs Action"] })), _jsx("span", { className: "bg-white/[0.04] border border-white/5 text-slate-400 text-[9px] px-2 py-0.2 rounded-md font-mono", children: item.type.toUpperCase() })] }), _jsx("p", { className: "text-xs text-slate-400 line-clamp-1 leading-normal", children: item.description }), _jsxs("div", { className: "flex items-center space-x-2.5 text-[10px] text-slate-500 pt-0.5", children: [_jsxs("span", { children: ["Assigned ", item.assignedAt] }), _jsx("span", { children: "\u2022" }), _jsx("span", { children: isPsychologist ? `Sent To: ${item.assignedToName}` : `Clinician: ${item.assignedByName}` })] })] }), _jsx("div", { className: "flex items-center space-x-2 shrink-0 w-full md:w-auto mt-2 md:mt-0", children: isPsychologist ? (_jsxs(_Fragment, { children: [isItemCompleted && (_jsx("button", { id: `read-reflections-btn-${item.id}`, onClick: () => openWorkout(item), className: "px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer transition flex-1 md:flex-none text-center", children: "Check reflections" })), _jsx("button", { id: `retract-btn-${item.id}`, onClick: () => handleDeleteAssignment(item.id), className: "p-1.5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl cursor-pointer transition", title: "Retract / delete assignment", children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) })] })) : (_jsx("button", { id: `workout-btn-${item.id}`, onClick: () => openWorkout(item), className: `w-full md:w-auto px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${isItemCompleted
                                            ? "bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 border border-white/5"
                                            : "bg-indigo-600 hover:bg-indigo-505 text-white shadow-md hover:shadow-lg"}`, children: isItemCompleted ? "Review Completed" : "Open Workspace" })) })] }, item.id));
                    }) })) })), isAssigning && selectedTemplate && (_jsx("div", { id: "assign-modal-overlay", className: "fixed inset-0 bg-[#070708]/85 backdrop-blur-md z-150 flex items-center justify-center p-4", children: _jsxs("div", { id: "assign-modal-content", className: "bg-[#0C0C0E] border border-white/5 max-w-md w-full rounded-2xl h-auto overflow-hidden shadow-2xl p-6 text-left space-y-4 animate-scale-up", children: [_jsx("h3", { className: "font-light text-slate-100 text-md tracking-wider uppercase border-b border-white/5 pb-3", children: "Assign Care Material" }), _jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "text-[10px] uppercase font-bold text-slate-500 tracking-wide font-mono block", children: "Earmarked Resource" }), _jsx("p", { className: "text-xs font-bold text-slate-200", children: selectedTemplate.title }), _jsx("span", { className: "text-[10px] text-slate-400 italic block", children: selectedTemplate.description })] }), _jsxs("form", { onSubmit: handleAssignResource, className: "space-y-4 pt-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-[10px] uppercase font-bold text-slate-405 tracking-wide font-mono", children: "Select Active Care Client" }), allPatients.length === 0 ? (_jsx("p", { className: "text-xs text-rose-400", children: "No registered patient accounts found. Please ensure you have other patients in sandbox." })) : (_jsx("select", { id: "assignee-select", value: assigneeId, onChange: (e) => setAssigneeId(e.target.value), className: "w-full bg-[#070708] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-205 focus:outline-none cursor-pointer [color-scheme:dark]", children: allPatients.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id))) }))] }), assignSuccess && (_jsxs("div", { className: "p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2", children: [_jsx(CheckCircle, { className: "w-4 h-4 shrink-0" }), _jsx("span", { children: "Homework successfully assigned! Seeding dashboard..." })] })), _jsxs("div", { className: "flex space-x-2 justify-end pt-2", children: [_jsx("button", { id: "cancel-assign-btn", type: "button", onClick: () => {
                                                setIsAssigning(false);
                                                setSelectedTemplate(null);
                                            }, className: "px-4 py-2 bg-transparent text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl cursor-pointer", children: "Cancel" }), _jsx("button", { id: "submit-assign-btn", type: "submit", disabled: allPatients.length === 0, className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-505 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer", children: "Confirm Assign" })] })] })] }) })), workoutResource && (_jsx("div", { id: "workout-modal-overlay", className: "fixed inset-0 bg-[#070708]/90 backdrop-blur-md z-150 flex items-center justify-center p-4 overflow-y-auto", children: _jsxs("div", { id: "workout-modal-content", className: "bg-[#0C0C0E] border border-white/10 max-w-2xl w-full rounded-2xl shadow-2xl p-6 text-left space-y-5 my-8 max-h-[85vh] flex flex-col justify-between", children: [_jsxs("div", { className: "border-b border-white/5 pb-3 flex justify-between items-center shrink-0", children: [_jsxs("div", { children: [_jsxs("span", { className: "text-[9px] uppercase font-bold text-slate-500 tracking-widest font-mono", children: [workoutResource.type, " workshop space"] }), _jsx("h3", { className: "font-bold text-slate-100 text-sm leading-snug", children: workoutResource.title })] }), _jsx("button", { id: "close-workout-btn", onClick: () => setWorkoutResource(null), className: "text-slate-500 hover:text-slate-350 font-bold font-mono text-xs cursor-pointer bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-md", children: "Close" })] }), _jsxs("div", { className: "overflow-y-auto flex-1 pr-1.5 space-y-4", id: "workout-scroll-stage", children: [_jsxs("div", { className: "p-3.5 bg-[#070708] rounded-xl border border-white/5", children: [_jsx("span", { className: "text-[9px] uppercase font-semibold text-indigo-400 block tracking-wider font-mono mb-1.5", children: "Therapeutic primer" }), _jsx("p", { className: "text-xs text-slate-300 leading-relaxed whitespace-pre-line", children: workoutResource.content })] }), workoutResource.type === "worksheet" && (_jsxs("div", { className: "space-y-4", id: "worksheet-form-stage", children: [_jsx("span", { className: "text-[10px] uppercase font-extrabold text-slate-400 tracking-wider font-mono block", children: "Worksheet Exercises & Prompts" }), workoutResource.questions && workoutResource.questions.map((q, idx) => (_jsxs("div", { className: "space-y-1.5 text-xs text-left", children: [_jsxs("label", { className: "block text-slate-200 font-bold leading-normal", children: ["Prompt ", idx + 1, ": ", q] }), workoutResource.isCompleted ? (_jsx("div", { className: "p-3 bg-white/[0.01] border border-white/5 rounded-xl text-slate-300 italic", children: workoutResource.answers && workoutResource.answers[idx] ? workoutResource.answers[idx] : "[No response recorded]" })) : (_jsx("textarea", { id: `worksheet-answer-input-${idx}`, rows: 2.5, value: worksheetAnswers[idx] || "", onChange: (e) => {
                                                        const newAnsws = [...worksheetAnswers];
                                                        newAnsws[idx] = e.target.value;
                                                        setWorksheetAnswers(newAnsws);
                                                    }, placeholder: "Type your cognitive notes or observations here...", className: "w-full bg-[#070708] border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-indigo-500" }))] }, idx)))] })), workoutResource.type === "exercise" && (_jsxs("div", { className: "space-y-5 text-center flex flex-col items-center py-4", id: "breathing pacer-stage", children: [_jsx("span", { className: "text-[10px] uppercase font-extrabold text-slate-400 tracking-wider font-mono block mb-2", children: "Autonomic Grounding Pacer" }), _jsxs("div", { className: "relative flex items-center justify-center p-6 h-48 w-48", children: [_jsx(AnimatePresence, { mode: "popLayout", children: _jsx(motion.div, { animate: {
                                                            scale: pacerStep === 0 ? [1, 2] : pacerStep === 2 ? [2, 1] : pacerStep === 1 ? 2 : 1,
                                                        }, transition: {
                                                            duration: 4,
                                                            ease: "easeInOut"
                                                        }, className: `absolute inset-4 rounded-full border-2 transition-all ${isPacerActive ? pacerInstructions[pacerStep].color : "border-white/5 bg-white/[0.01]"}` }, pacerStep) }), _jsx("div", { className: "z-10 flex flex-col items-center text-slate-100", children: isPacerActive ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "text-[10px] font-mono tracking-widest text-slate-400", children: ["STEP ", pacerStep + 1] }), _jsxs("span", { className: "text-4xl font-extrabold font-mono text-slate-100 mt-1", children: [pacerTimer, "s"] }), _jsx("span", { className: "text-[11px] font-bold mt-1.5 uppercase tracking-wide text-indigo-300", children: pacerInstructions[pacerStep].title })] })) : (_jsx("span", { className: "text-xs font-bold text-slate-400 italic", children: "Pacer Paused" })) })] }), isPacerActive && (_jsx("div", { className: "text-center transition-all animate-fade-in", children: _jsx("p", { className: "text-xs text-slate-200 font-bold", children: pacerInstructions[pacerStep].desc }) })), _jsxs("div", { className: "flex space-x-2 pt-2 shrink-0", children: [_jsxs("button", { id: "pacer-toggle", onClick: () => setIsPacerActive(!isPacerActive), className: `px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1.5 ${isPacerActive ? "bg-slate-800 hover:bg-slate-700 text-slate-205" : "bg-[#09090b] hover:bg-slate-900 text-[#4ade80] border border-[#22c55e]/20"}`, children: [_jsx(Play, { className: "w-3.5 h-3.5 shrink-0" }), _jsx("span", { children: isPacerActive ? "Pause Pacer" : "Start 4s Box Breathing" })] }), _jsx("button", { id: "pacer-reset", onClick: () => {
                                                        setIsPacerActive(false);
                                                        setPacerStep(0);
                                                        setPacerTimer(4);
                                                    }, className: "px-3.5 py-1.5 bg-[#09090b] text-slate-400 hover:text-slate-205 hover:bg-slate-900 text-xs rounded-lg cursor-pointer border border-white/5", children: _jsx(RotateCcw, { className: "w-3.5 h-3.5" }) })] }), _jsxs("div", { className: "w-full text-left bg-white/[0.01] border border-white/5 rounded-xl p-3 mt-4 space-y-1.5 text-xs", children: [_jsx("span", { className: "font-bold text-[9px] uppercase tracking-wider text-slate-500 font-mono", children: "Exercise Schedule Instructions" }), _jsx("ul", { className: "space-y-1 text-slate-400 list-disc list-inside", children: workoutResource.steps && workoutResource.steps.map((st, i) => (_jsx("li", { className: "text-slate-350", children: st }, i))) })] })] })), workoutResource.type === "article" && (_jsxs("div", { className: "bg-indigo-950/5 border border-indigo-500/10 p-4 rounded-xl text-xs space-y-1", id: "article-summary-stage", children: [_jsx("span", { className: "font-extrabold uppercase tracking-wide text-indigo-300 text-[9.5px] font-mono block", children: "Clinical Takeaway Note" }), _jsxs("p", { className: "text-slate-350 leading-relaxed", children: ["You've reviews the guidelines for ", workoutResource.title, ". Practicing these steps once daily builds mental reserve capacity and lets you re-anchor somatic fear responses before they cascade into high anxiety. Leave your reflections below to help your therapist coordinate followups!"] })] })), _jsxs("div", { className: "space-y-2 text-left pt-3 border-t border-white/5 shrink-0", children: [_jsx("label", { className: "block text-[10.5px] uppercase font-bold text-slate-400 tracking-wider font-mono select-none", children: "Patient Reflection & Somatic Log Notes" }), workoutResource.isCompleted ? (_jsx("div", { className: "p-3 bg-white/[0.01] border border-white/5 rounded-xl text-slate-300 italic text-xs leading-relaxed", children: workoutResource.patientReflections || "[No custom reflection submitted]" })) : (_jsx("textarea", { id: "workout-reflection-input", rows: 2.5, placeholder: "Reflect on how this sheet, read, or somatic exercise felt (e.g. 'Reduced my shoulder tightness by half', 'Helped capture my negative workplace spiral').", value: patientReflection, onChange: (e) => setPatientReflection(e.target.value), className: "w-full bg-[#070708] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-205 placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-indigo-500" }))] })] }), _jsxs("div", { className: "pt-4 border-t border-white/5 flex justify-end space-x-2 shrink-0", children: [_jsx("button", { id: "cancel-workout-btn", onClick: () => setWorkoutResource(null), className: "px-4 py-2 bg-transparent text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl cursor-pointer", children: "Close" }), !workoutResource.isCompleted && (_jsxs("button", { id: "submit-workout-btn", onClick: handleSubmitWorkout, className: "px-5 py-2 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1", children: [_jsx(Send, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Submit to Therapist" })] }))] })] }) }))] }));
}
