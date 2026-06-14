import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { createPatientProblemInFirebase, addApproachToProblemInFirebase, deletePatientProblemFromFirebase, createChatThreadInFirebase, addDirectChatMessageInFirebase } from "../services/firebaseStore";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { ClipboardList, Plus, AlertCircle, User, Check, X, MessageSquare, HeartHandshake, ShieldAlert, BadgeInfo, CheckCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { encryptMessageText } from "../services/crypto";
export default function CareBoard({ currentUser, allUsers, setActiveTab, setActiveThreadId }) {
    const [problems, setProblems] = useState([]);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [activeProblemDetail, setActiveProblemDetail] = useState(null);
    const [isApproachModalOpen, setIsApproachModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");
    // Form states - Submit Problem
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Stress & Burnout");
    const [severity, setSeverity] = useState("medium");
    const [description, setDescription] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState(false);
    // Form states - Approach
    const [proposalMessage, setProposalMessage] = useState("");
    const [approachError, setApproachError] = useState("");
    const [approachSuccess, setApproachSuccess] = useState(false);
    // Subscribed live problems from Firestore
    useEffect(() => {
        const q = query(collection(db, "problems"), orderBy("postedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => {
                list.push(doc.data());
            });
            // If database has no problems, seed with grounding default ones for beautiful initial state
            if (list.length === 0) {
                seedInitialGroundingProblems();
            }
            else {
                setProblems(list);
            }
        }, (err) => {
            console.warn("Problems fetch failed or collection uninitialized. Displaying grounding set.");
            setProblems(GROUNDING_PROBLEMS);
        });
        return () => unsubscribe();
    }, []);
    const seedInitialGroundingProblems = async () => {
        try {
            for (const p of GROUNDING_PROBLEMS) {
                await createPatientProblemInFirebase(p);
            }
        }
        catch (e) {
            console.warn("Failed optional seeding:", e);
            setProblems(GROUNDING_PROBLEMS);
        }
    };
    // Categories helper
    const categories = ["All", "Stress & Burnout", "Anxiety & OCD", "Depression & Mood", "ADHD & Executive", "Relationships & Family", "Grief & Loss", "General Counsel"];
    // Handle problem post submission
    const handleSubmitProblem = async (e) => {
        e.preventDefault();
        setFormError("");
        if (!title.trim() || title.length < 10) {
            setFormError("Please enter a descriptive title (at least 10 letters).");
            return;
        }
        if (!description.trim() || description.length < 30) {
            setFormError("Carefully summarize your concerns in at least 30 letters so experts can understand.");
            return;
        }
        const newProblem = {
            id: "prob_" + Date.now(),
            patientId: currentUser.id,
            patientName: isAnonymous ? "Anonymous Patient" : currentUser.name.split(",")[0],
            patientAvatar: isAnonymous ? "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80" : currentUser.avatar,
            title: title.trim(),
            category,
            description: description.trim(),
            severity,
            postedAt: new Date().toISOString(),
            approaches: []
        };
        try {
            await createPatientProblemInFirebase(newProblem);
            setFormSuccess(true);
            setTitle("");
            setDescription("");
            setIsAnonymous(false);
            setTimeout(() => {
                setFormSuccess(false);
                setIsSubmitModalOpen(false);
            }, 1500);
        }
        catch (err) {
            setFormError("Failed to store care request on server. Please try again.");
        }
    };
    // Handle therapist approach submission
    const handleSubmitApproach = async (e) => {
        e.preventDefault();
        setApproachError("");
        if (!activeProblemDetail)
            return;
        if (!proposalMessage.trim() || proposalMessage.length < 20) {
            setApproachError("Provide a meaningful clinical proposal message (at least 20 letters).");
            return;
        }
        // Guard against multiple approaches from the same specialist
        const alreadyApproached = activeProblemDetail.approaches.some((a) => a.psychologistId === currentUser.id);
        if (alreadyApproached) {
            setApproachError("You have already approached this patient concern.");
            return;
        }
        const newApproach = {
            psychologistId: currentUser.id,
            psychologistName: currentUser.name,
            psychologistAvatar: currentUser.avatar,
            message: proposalMessage.trim(),
            approachedAt: new Date().toISOString(),
            status: "pending"
        };
        try {
            await addApproachToProblemInFirebase(activeProblemDetail.id, newApproach);
            setApproachSuccess(true);
            setProposalMessage("");
            // Update local state if detailed view is open
            const updatedProb = {
                ...activeProblemDetail,
                approaches: [...activeProblemDetail.approaches, newApproach]
            };
            setActiveProblemDetail(updatedProb);
            setTimeout(() => {
                setApproachSuccess(false);
                setIsApproachModalOpen(false);
            }, 1500);
        }
        catch (err) {
            setApproachError("Failed to lock approach on cloud database.");
        }
    };
    // Accept a therapist's approach & start standard E2EE chat
    const handleAcceptApproach = async (problem, approach) => {
        // Generate deterministic compounding chat Id
        const smallerId = currentUser.id < approach.psychologistId ? currentUser.id : approach.psychologistId;
        const largerId = currentUser.id > approach.psychologistId ? currentUser.id : approach.psychologistId;
        const threadId = `chat_${smallerId}_${largerId}`;
        const introductoryContent = `Hello! I accepted your clinical proposal on the Patient Board regarding my concern "${problem.title}". Let's align on next steps!`;
        const encryptedIntro = encryptMessageText(introductoryContent, threadId);
        const newThread = {
            id: threadId,
            participants: [currentUser.id, approach.psychologistId],
            participantNames: [currentUser.name, approach.psychologistName],
            latestMessage: encryptedIntro,
            latestMessageTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            initiatorId: currentUser.id,
            receiverId: approach.psychologistId
        };
        const initialMsg = {
            id: "init_msg_" + Date.now(),
            senderId: currentUser.id,
            senderName: currentUser.name.split(",")[0],
            content: encryptedIntro,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            createdAt: Date.now()
        };
        try {
            // Create thread documents
            await createChatThreadInFirebase(newThread);
            await addDirectChatMessageInFirebase(threadId, initialMsg, encryptedIntro, newThread.latestMessageTime);
            // Update status of this approach to "connected" in firestore
            const problemRef = doc(db, "problems", problem.id);
            const updatedApproaches = problem.approaches.map((a) => {
                if (a.psychologistId === approach.psychologistId) {
                    return { ...a, status: "connected" };
                }
                return a;
            });
            await updateDoc(problemRef, { approaches: updatedApproaches });
            // If active detailed view is open, sync it
            if (activeProblemDetail && activeProblemDetail.id === problem.id) {
                setActiveProblemDetail({
                    ...activeProblemDetail,
                    approaches: updatedApproaches
                });
            }
            // Smooth transition to Messages Inbox
            if (setActiveThreadId) {
                setActiveThreadId(threadId);
            }
            setActiveTab("messages");
        }
        catch (err) {
            console.error("Clinical onboarding thread failure:", err);
        }
    };
    // Delete matching concern
    const handleDeleteProblem = async (problemId) => {
        if (!window.confirm("Are you sure you want to retract this clinical request?"))
            return;
        try {
            await deletePatientProblemFromFirebase(problemId);
            setActiveProblemDetail(null);
        }
        catch (err) {
            console.warn("Retract concern failed:", err);
        }
    };
    // Match severity badge styling
    const getSeverityStyle = (sev) => {
        switch (sev) {
            case "high":
                return "bg-rose-500/10 text-rose-300 border-rose-500/20";
            case "medium":
                return "bg-amber-500/10 text-amber-300 border-amber-500/20";
            case "low":
                return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
        }
    };
    // Filter problems listed
    const filteredProblems = selectedCategory === "All"
        ? problems
        : problems.filter((p) => p.category === selectedCategory);
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", id: "care-board-container", children: [_jsxs("div", { className: "text-center max-w-3xl mx-auto mb-10", id: "care-board-hero", children: [_jsxs("div", { className: "inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 animate-pulse-slow", children: [_jsx(HeartHandshake, { className: "w-4 h-4 text-indigo-400" }), _jsx("span", { children: "Patient Board & Therapist Matches" })] }), _jsx("h1", { className: "text-3xl font-light text-slate-100 tracking-tight leading-none uppercase", style: { fontFamily: "Georgia, serif" }, children: "Clinical Match Board" }), _jsx("p", { className: "text-slate-400 text-sm mt-3 leading-relaxed", children: "Post clinical challenges anonymously or openly. Let verified experts read, review details, and approach you securely with customized counseling proposals." }), _jsx("div", { className: "mt-6 flex justify-center gap-3", children: currentUser.role === "patient" ? (_jsxs("button", { id: "post-problem-btn", onClick: () => setIsSubmitModalOpen(true), className: "flex items-center space-x-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg hover:shadow-indigo-600/15", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Post New Request" })] })) : (_jsx("div", { className: "px-4 py-2 bg-indigo-950/20 text-indigo-300 border border-indigo-500/15 rounded-xl text-xs font-medium", children: "\u2728 Therapist Account active. Browse candidate details and tap \"Approach Patient\" to match!" })) })] }), _jsx("div", { className: "flex overflow-x-auto space-x-2 pb-4 mb-8 scrollbar-thin scrollbar-thumb-white/5", id: "category-filters", children: categories.map((cat) => (_jsx("button", { onClick: () => setSelectedCategory(cat), className: `px-4 py-2 text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer whitespace-nowrap border shrink-0 ${selectedCategory === cat
                        ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-semibold"
                        : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-slate-200 hover:bg-white/[0.04]"}`, children: cat }, cat))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", id: "care-board-layout-grid", children: [_jsxs("div", { className: "lg:col-span-2 space-y-4", children: [_jsxs("h2", { className: "text-lg font-light tracking-wide text-slate-100 flex items-center space-x-2", style: { fontFamily: "Georgia, serif" }, children: [_jsx(ClipboardList, { className: "w-5 h-5 text-indigo-400" }), _jsxs("span", { children: ["Active Support Requests (", filteredProblems.length, ")"] })] }), filteredProblems.length === 0 ? (_jsxs("div", { className: "bg-[#0D0D0F] border border-white/5 rounded-2xl p-10 text-center text-slate-500", id: "empty-requests", children: [_jsx(BadgeInfo, { className: "w-10 h-10 mx-auto text-slate-600 mb-3" }), _jsx("p", { className: "text-sm", children: "No postings match this category right now." }), currentUser.role === "patient" && (_jsx("button", { onClick: () => setIsSubmitModalOpen(true), className: "mt-4 text-xs font-bold text-indigo-400 hover:underline cursor-pointer uppercase", children: "Create the first post" }))] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", id: "requests-grid", children: filteredProblems.map((prob) => {
                                    const selfPost = prob.patientId === currentUser.id;
                                    return (_jsxs("div", { onClick: () => setActiveProblemDetail(prob), className: `bg-[#0D0D0F] rounded-2xl border p-5 transition-all cursor-pointer hover:bg-[#111114] flex flex-col justify-between text-left h-full ${activeProblemDetail?.id === prob.id
                                            ? "border-indigo-500/50 ring-1 ring-indigo-500/10 bg-[#111114]"
                                            : selfPost
                                                ? "border-indigo-500/20 bg-indigo-950/5"
                                                : "border-white/5"}`, children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("span", { className: `px-2 py-0.5 border rounded text-[10px] uppercase font-semibold tracking-wider ${getSeverityStyle(prob.severity)}`, children: [prob.severity, " Severity"] }), _jsx("span", { className: "text-[10px] text-slate-500", children: new Date(prob.postedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) })] }), _jsx("h3", { className: "text-sm font-semibold tracking-tight text-slate-200 hover:text-[#f1f5f9] transition-all line-clamp-1 mb-2", children: prob.title }), _jsx("span", { className: "inline-block bg-white/[0.04] text-[10px] text-slate-400 px-2 py-0.5 rounded-full font-medium mb-3 border border-white/5", children: prob.category }), _jsx("p", { className: "text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4", children: prob.description })] }), _jsxs("div", { className: "flex items-center justify-between pt-3 border-t border-white/5 text-[11px]", children: [_jsxs("div", { className: "flex items-center space-x-1.5 text-slate-500", children: [_jsx(User, { className: "w-3.5 h-3.5 text-slate-600" }), _jsx("span", { className: "line-clamp-1", children: prob.patientName })] }), _jsxs("div", { className: "flex items-center space-x-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-full font-semibold", children: [_jsx(MessageSquare, { className: "w-3 h-3 text-indigo-400" }), _jsxs("span", { children: [prob.approaches?.length || 0, " Approaches"] })] })] })] }, prob.id));
                                }) }))] }), _jsx("div", { className: "lg:col-span-1", id: "detailed-problem-sidepanel", children: _jsx("div", { className: "sticky top-24 bg-[#0D0D0F] rounded-2xl border border-white/5 p-6 shadow-xl text-left h-fit", id: "problem-detail-card", children: !activeProblemDetail ? (_jsxs("div", { className: "py-20 text-center text-slate-500", id: "detail-fallback-panel", children: [_jsx(ClipboardList, { className: "w-12 h-12 text-slate-700 mx-auto mb-4 animate-bounce-slow" }), _jsx("h3", { className: "text-sm font-medium text-slate-300", children: "Select a problem to analyze detail" }), _jsx("p", { className: "text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed", children: "Click any requests board card to launch full professional options or coordinate therapeutic plans." })] })) : (_jsxs("div", { className: "space-y-6", id: "detail-selected-panel", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("span", { className: `px-2 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider ${getSeverityStyle(activeProblemDetail.severity)}`, children: [activeProblemDetail.severity, " Severity"] }), activeProblemDetail.patientId === currentUser.id && (_jsxs("button", { onClick: () => handleDeleteProblem(activeProblemDetail.id), className: "text-xs text-red-400 hover:text-red-300 hover:underline cursor-pointer uppercase font-bold flex items-center space-x-1", children: [_jsx(X, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Retract" })] }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-base font-bold text-slate-100 uppercase tracking-tight leading-snug", children: activeProblemDetail.title }), _jsx("span", { className: "inline-block bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded-full font-semibold mt-2 uppercase tracking-wide", children: activeProblemDetail.category })] }), _jsxs("div", { className: "space-y-3 bg-[#070709] rounded-xl border border-white/5 p-4", children: [_jsxs("p", { className: "text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center justify-between", children: [_jsx("span", { children: "Clinical Summary" }), _jsxs("span", { className: "text-[10px] tracking-normal font-normal text-slate-500", children: ["Posted ", new Date(activeProblemDetail.postedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })] })] }), _jsx("p", { className: "text-slate-300 text-xs leading-relaxed font-light whitespace-pre-wrap", children: activeProblemDetail.description })] }), _jsxs("div", { className: "flex items-center space-x-3 bg-white/[0.02] border border-white/5 p-3 rounded-xl", children: [_jsx("img", { src: activeProblemDetail.patientAvatar, alt: activeProblemDetail.patientName, className: "w-10 h-10 rounded-full object-cover ring-1 ring-indigo-500/20", referrerPolicy: "no-referrer" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-slate-200", children: activeProblemDetail.patientName }), _jsxs("p", { className: "text-[10px] text-slate-500", children: ["Applicant ID: #", activeProblemDetail.patientId.slice(-6).toUpperCase()] })] })] }), _jsxs("div", { className: "border-t border-white/5 pt-5 space-y-4", children: [_jsxs("h4", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between", children: [_jsxs("span", { children: ["Specialist Matches (", activeProblemDetail.approaches?.length || 0, ")"] }), _jsx(Sparkles, { className: "w-3.5 h-3.5 text-indigo-400" })] }), currentUser.role === "psychologist" && (_jsx("div", { children: activeProblemDetail.approaches.some((a) => a.psychologistId === currentUser.id) ? (_jsxs("div", { className: "flex items-center space-x-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl", children: [_jsx(CheckCircle, { className: "w-4 h-4 shrink-0" }), _jsx("span", { children: "Clinical proposal locked on file! Wait for patient request." })] })) : (_jsxs("button", { id: "approach-patient-btn", onClick: () => {
                                                        setApproachError("");
                                                        setIsApproachModalOpen(true);
                                                    }, className: "w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-505 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-md", children: [_jsx(HeartHandshake, { className: "w-4 h-4" }), _jsx("span", { children: "Approach This Patient" })] })) })), activeProblemDetail.approaches && activeProblemDetail.approaches.length > 0 ? (_jsx("div", { className: "space-y-3 max-h-[220px] overflow-y-auto pr-1", children: activeProblemDetail.approaches.map((app) => {
                                                    const isDoctorSelf = app.psychologistId === currentUser.id;
                                                    const isProblemOwner = activeProblemDetail.patientId === currentUser.id;
                                                    const isConnected = app.status === "connected";
                                                    return (_jsxs("div", { className: `bg-white/[0.01] border rounded-xl p-3 space-y-2.5 text-xs text-left ${isConnected ? "border-emerald-500/30 bg-emerald-950/5" : "border-white/5"}`, children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("img", { src: app.psychologistAvatar, alt: app.psychologistName, className: "w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500/20", referrerPolicy: "no-referrer" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-200 leading-tight", children: app.psychologistName.split(",")[0] }), _jsx("span", { className: "text-[9px] text-slate-500", children: "Therapist" })] })] }), _jsx("span", { className: `px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${isConnected
                                                                            ? "bg-emerald-500/10 text-emerald-300"
                                                                            : "bg-amber-500/10 text-amber-300"}`, children: app.status })] }), _jsxs("p", { className: "text-slate-400 text-[11px] leading-relaxed italic bg-[#070709] p-2 rounded-lg border border-white/5", children: ["\"", app.message, "\""] }), isProblemOwner && !isConnected && (_jsxs("button", { onClick: () => handleAcceptApproach(activeProblemDetail, app), className: "w-full flex items-center justify-center space-x-1 py-1.5 bg-indigo-500/20 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 text-indigo-300 font-bold rounded-lg text-[10px] uppercase tracking-wide transition-all cursor-pointer", children: [_jsx(Check, { className: "w-3 h-3" }), _jsx("span", { children: "Accept Proposal & Chat" })] })), isConnected && (_jsxs("p", { className: "text-[9px] text-emerald-400 flex items-center justify-center space-x-1 font-medium bg-[#070709] py-1 rounded text-center", children: [_jsx(CheckCircle, { className: "w-3.5 h-3.5 text-emerald-500" }), _jsx("span", { children: "Active E2EE Consultation started" })] }))] }, app.psychologistId));
                                                }) })) : (_jsx("p", { className: "text-[11px] text-slate-500 text-center py-4 bg-[#070709] rounded-xl border border-white/5 italic", children: "Waiting for secure specialist evaluations..." }))] })] })) }) })] }), _jsx(AnimatePresence, { children: isSubmitModalOpen && (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", id: "submit-problem-overlay", children: _jsxs(motion.div, { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.95, opacity: 0 }, className: "bg-[#0D0D0F] border border-white/5 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl relative text-left", id: "submit-problem-modal", children: [_jsxs("div", { className: "bg-indigo-500/10 border-b border-indigo-500/20 px-6 py-4 flex items-center justify-between", children: [_jsxs("span", { className: "text-xs uppercase font-extrabold tracking-widest text-indigo-300 flex items-center space-x-2", children: [_jsx(Plus, { className: "w-4 h-4 text-indigo-400" }), _jsx("span", { children: "Submit Clinical Concern" })] }), _jsx("button", { onClick: () => setIsSubmitModalOpen(false), className: "p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition cursor-pointer", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleSubmitProblem, className: "p-6 space-y-4", children: [formError && (_jsxs("div", { className: "bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs flex items-center space-x-2 font-medium", children: [_jsx(ShieldAlert, { className: "w-4 h-4 text-rose-400 shrink-0" }), _jsx("span", { children: formError })] })), formSuccess && (_jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-300 text-xs flex items-center space-x-2 font-medium", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" }), _jsx("span", { children: "Clinical request locked on public board." })] })), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-[10px] text-slate-500 uppercase tracking-widest font-extrabold", children: "Concern Title / Focus" }), _jsx("input", { id: "problem-title-input", type: "text", required: true, maxLength: 100, placeholder: "e.g., Executive ADHD dysregulations and morning panic symptoms", value: title, onChange: (e) => setTitle(e.target.value), className: "w-full bg-[#070709] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/40" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-[10px] text-slate-500 uppercase tracking-widest font-extrabold", children: "Domain Category" }), _jsx("select", { id: "problem-category-select", value: category, onChange: (e) => setCategory(e.target.value), className: "w-full bg-[#070709] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none [color-scheme:dark]", children: categories.slice(1).map((cat) => (_jsx("option", { value: cat, children: cat }, cat))) })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-[10px] text-slate-500 uppercase tracking-widest font-extrabold", children: "Severity Indicator" }), _jsxs("select", { id: "problem-severity-select", value: severity, onChange: (e) => setSeverity(e.target.value), className: "w-full bg-[#070709] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none [color-scheme:dark]", children: [_jsx("option", { value: "low", children: "Low Severity" }), _jsx("option", { value: "medium", children: "Medium Severity" }), _jsx("option", { value: "high", children: "High Severity" })] })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-[10px] text-slate-500 uppercase tracking-widest font-extrabold", children: "Describe Your Current Challenge" }), _jsx("textarea", { id: "problem-description-textarea", required: true, maxLength: 1200, rows: 4, placeholder: "Summarize details. Include symptoms, somatic challenges, sleep rates, panic cycles, and what type of specialist or therapeutic strategy you prefer.", value: description, onChange: (e) => setDescription(e.target.value), className: "w-full bg-[#070709] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/40 resize-none font-light" }), _jsx("span", { className: "text-[9px] text-slate-600 block text-right", children: "Maximum 1200 letters" })] }), _jsxs("div", { className: "flex items-center space-x-2 bg-white/[0.01] border border-white/5 p-3 rounded-xl cursor-pointer", onClick: () => setIsAnonymous(!isAnonymous), children: [_jsx("div", { className: `p-1.5 border rounded-lg transition-all ${isAnonymous ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-semibold" : "border-white/5 text-slate-500"}`, children: _jsx(Check, { className: `w-3.5 h-3.5 ${isAnonymous ? "opacity-100" : "opacity-0"}` }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-slate-300 leading-none", children: "Post Anonymously" }), _jsx("p", { className: "text-[10px] text-slate-500 mt-1 leading-snug", children: "Hides your real name and profile picture from the public listings." })] })] }), _jsx("button", { id: "problem-form-submit-btn", type: "submit", className: "w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all duration-150 cursor-pointer shadow-lg mt-2", children: "Publish to Clinical Board" })] })] }) })) }), _jsx(AnimatePresence, { children: isApproachModalOpen && activeProblemDetail && (_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", id: "approach-problem-overlay", children: _jsxs(motion.div, { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.95, opacity: 0 }, className: "bg-[#0D0D0F] border border-white/5 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl relative text-left", id: "approach-problem-modal", children: [_jsxs("div", { className: "bg-indigo-500/10 border-b border-indigo-500/20 px-6 py-4 flex items-center justify-between", children: [_jsxs("span", { className: "text-xs uppercase font-extrabold tracking-widest text-indigo-300 flex items-center space-x-2", children: [_jsx(HeartHandshake, { className: "w-4 h-4 text-indigo-400" }), _jsx("span", { children: "Send Proposal to Patient" })] }), _jsx("button", { onClick: () => setIsApproachModalOpen(false), className: "p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition cursor-pointer", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleSubmitApproach, className: "p-6 space-y-4", children: [approachError && (_jsxs("div", { className: "bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs flex items-center space-x-2 font-medium", children: [_jsx(ShieldAlert, { className: "w-4 h-4 text-rose-400 shrink-0" }), _jsx("span", { children: approachError })] })), approachSuccess && (_jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-300 text-xs flex items-center space-x-2 font-medium", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-emerald-400 shrink-0" }), _jsx("span", { children: "MATCH PROPOSAL SENT! Patient can initiate chat." })] })), _jsxs("div", { className: "space-y-1.5 bg-[#070709] border border-white/5 p-3 rounded-xl", children: [_jsx("p", { className: "text-[10px] text-slate-500 uppercase tracking-widest font-extrabold", children: "Target Concern" }), _jsx("p", { className: "text-xs font-bold text-slate-200 line-clamp-1", children: activeProblemDetail.title })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-[10px] text-slate-500 uppercase tracking-widest font-extrabold", children: "Match Proposal intro" }), _jsx("textarea", { id: "proposal-message-textarea", required: true, maxLength: 800, rows: 4, placeholder: "Describe your assessment, counseling credentials, and how you can aid Evelyn. (e.g. 'Hello, I specialize in perinatal CBT strategies. I have availability and can guide your sleep recovery safely.')", value: proposalMessage, onChange: (e) => setProposalMessage(e.target.value), className: "w-full bg-[#070709] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/40 resize-none font-light" }), _jsx("span", { className: "text-[9px] text-slate-600 block text-right", children: "Maximum 800 letters" })] }), _jsxs("div", { className: "bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl flex items-start space-x-2 text-[10px] text-amber-300/80", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-amber-400 shrink-0 mt-0.5" }), _jsx("p", { className: "leading-snug", children: "Your full public therapist profile details, degrees, per-session consulting fees, and clinical rating averages will be securely attached to this proposal description for the applicant's verification checks." })] }), _jsx("button", { id: "proposal-submit-btn", type: "submit", className: "w-full py-3 bg-indigo-600 hover:bg-indigo-554 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all duration-150 cursor-pointer shadow-lg mt-2", children: "Deliver Proposal" })] })] }) })) })] }));
}
// Highly customized grounding mental health problems for direct mock clinical demonstrations
const GROUNDING_PROBLEMS = [
    {
        id: "prob_default_1",
        patientId: "usr_sterling",
        patientName: "Evelyn Sterling",
        patientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        title: "Overcoming crushing postpartum anxiety, insomnia, and panic cycles",
        category: "Anxiety & OCD",
        description: "Since giving birth three months ago, my autonomic nervous system has been in constant high alert. I experience terrifying somatic chest palpitations, and find myself waking up every 45 minutes with dread to check on the newborn. I have had recurring daily panic cycles and average less than 3 hours of disconnected sleep. Searching for a secure, compassionate clinical expert specialized in perinatal anxiety therapy.",
        severity: "high",
        postedAt: "2026-06-11T12:00:00Z",
        approaches: [
            {
                psychologistId: "user_dr_melanie",
                psychologistName: "Dr. Melanie Mitchell, PsyD",
                psychologistAvatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80",
                message: "Hello Evelyn, I specialize in perinatal anxiety disorders and clinical somatic trauma therapy. I can offer specialized, gentle, structured ERP and sleeping schedules starting immediately.",
                approachedAt: "2026-06-11T15:30:00Z",
                status: "pending"
            }
        ]
    },
    {
        id: "prob_default_2",
        patientId: "usr_vane",
        patientName: "Marcus Vane",
        patientAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
        title: "Severe executive burnout, fatigue, and chronic ADHD initiation paralysis",
        category: "Stress & Burnout",
        description: "Managing tight tech deliverables has led me to supreme executive exhaustion. I struggle with heavy ADHD task paralysis; I sit in front of critical emails or code blocks, absolutely frozen, with intense racing heart spikes. Looking for CBT strategies to lower cortisol and handle initiation boundaries.",
        severity: "medium",
        postedAt: "2026-06-11T10:15:00Z",
        approaches: []
    },
    {
        id: "prob_default_3",
        patientId: "usr_anonymous_grief",
        patientName: "Anonymous Client",
        patientAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        title: "Existential disconnect and grief counseling following father's loss",
        category: "Grief & Loss",
        description: "My father passed away earlier this spring, and I have felt a hollow, disconnected existential void ever since. My energy for daily progress tracking has plummeted. I seek an empathetic certified practitioner specializing in meaning-centric humanistic therapy or spiritual grief counseling.",
        severity: "low",
        postedAt: "2026-06-10T08:00:00Z",
        approaches: []
    }
];
