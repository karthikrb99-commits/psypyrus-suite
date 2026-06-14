import { GeminiService } from "../../services/ai";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Video, VideoOff, Mic, MicOff, Send, Sparkles, BookOpen, Clock, Play, FileText, CheckCircle2 } from "lucide-react";
export default function Consultations({ appointments, currentUser, setAppointments }) {
    // Find current active telehealth session or upcoming ones
    const activeSession = appointments.find((a) => a.status === "active" || a.status === "scheduled");
    // States
    const [videoOn, setVideoOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [chatMessageText, setChatMessageText] = useState("");
    const [sessionNotes, setSessionNotes] = useState("");
    // Breathing Coach states
    const [breathPhase, setBreathPhase] = useState("Inhale (4s)"); // "Inhale", "Hold", "Exhale"
    const [breathCount, setBreathCount] = useState(4);
    const [breathCycleActive, setBreathCycleActive] = useState(false);
    // AI Scribe states
    const [isScribing, setIsScribing] = useState(false);
    const [scribeBrief, setScribeBrief] = useState("");
    // Simulated mic meter amplitude (random fluid height)
    const [micAmplitude, setMicAmplitude] = useState(20);
    // Real-time countdown timer states (Starts at 48 mins 12 secs i.e. 2892 seconds)
    const [secondsLeft, setSecondsLeft] = useState(2892);
    // Active call timer countdown effect
    useEffect(() => {
        let interval;
        if (activeSession) {
            interval = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeSession]);
    const formatRemainingTime = (totalSecs) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };
    // Simulate mic activity oscillations when mic is enabled
    useEffect(() => {
        let interval;
        if (micOn) {
            interval = setInterval(() => {
                setMicAmplitude(Math.floor(Math.random() * 60) + 10);
            }, 350);
        }
        else {
            setMicAmplitude(2);
        }
        return () => clearInterval(interval);
    }, [micOn]);
    // Handle the Breathing coach countdown Loop
    useEffect(() => {
        let interval;
        if (breathCycleActive) {
            interval = setInterval(() => {
                setBreathCount((prev) => {
                    if (prev <= 1) {
                        // transition states
                        if (breathPhase === "Inhale (4s)") {
                            setBreathPhase("Hold (4s)");
                            return 4;
                        }
                        else if (breathPhase === "Hold (4s)") {
                            setBreathPhase("Exhale (8s)");
                            return 8;
                        }
                        else {
                            setBreathPhase("Inhale (4s)");
                            return 4;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        else {
            setBreathCount(4);
            setBreathPhase("Inhale (4s)");
        }
        return () => clearInterval(interval);
    }, [breathCycleActive, breathPhase]);
    // Load initial notes if completing/viewing previous
    useEffect(() => {
        if (activeSession?.clinicalNotes) {
            setSessionNotes(activeSession.clinicalNotes);
        }
    }, [activeSession]);
    if (!activeSession) {
        return (_jsxs("div", { className: "max-w-4xl mx-auto px-4 py-16 text-center", id: "no-sessions-fallback", children: [_jsx("div", { className: "p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4", children: _jsx(Video, { className: "w-7 h-7 animate-pulse" }) }), _jsx("h2", { className: "text-xl font-light text-slate-100 tracking-wider uppercase", style: { fontFamily: "Georgia, serif" }, children: "No Active Consultations" }), _jsx("p", { className: "text-slate-400 text-xs mt-3 max-w-md mx-auto leading-relaxed", children: "You don't have any telehealth consults scheduled for today. Explore the psychologist directories to find a clinician and secure a spot." })] }));
    }
    const isTherapist = currentUser.role === "psychologist";
    // Send a text message inside active call chat
    const handleSendCallChat = () => {
        if (!chatMessageText.trim())
            return;
        const newMsg = {
            id: "msg_call_" + Date.now(),
            senderId: currentUser.id,
            senderName: currentUser.name.split(",")[0],
            content: chatMessageText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setAppointments(appointments.map((appt) => {
            if (appt.id === activeSession.id) {
                return {
                    ...appt,
                    chatHistory: [...(appt.chatHistory || []), newMsg]
                };
            }
            return appt;
        }));
        setChatMessageText("");
    };
    // Invoke server side Gemini API to generate professional session brief
    const triggerAIScribeBrief = async () => {
        setIsScribing(true);
        setScribeBrief("");
        // Create prompt compiling clinician logs and chats
        const formattedChats = activeSession.chatHistory
            ?.map((c) => `${c.senderName}: ${c.content}`)
            .join("\n") || "";
        const prompt = `
      Please compile a detailed mental health consultation summary from this interaction context:
      - Dialogue Logs: ${formattedChats}
      - Therapist Jotted Notes: ${sessionNotes || "Routine check-in on patient anxiety and somatic stressors"}
    `;
        try {
      const text = await GeminiService.callGemini(prompt, "You are an expert clinical supervisor. Analyze the provided clinical session notes or transcription and compile a summary of the telehealth session: 1. Primary Cognitive & Behavioral Concerns, 2. Therapeutic Dialogues & Clinician Interventions, 3. Suggested Homework & Practical Coping Drills, 4. Strategic Clinical Focus for the Upcoming Consultation. Present this in supportive, clinical, and clean Markdown structure. Maintain complete patient confidentiality (do not mention full names).");
      if (text) {
        setScribeBrief(text);
      } else {
        setScribeBrief("Failed to generate clinical brief. Ensure API keys are active.");
      }
    } catch (err) {
      console.error(err);
      setScribeBrief("Network error compiling summary. Check local API connection.");
    }
        finally {
            setIsScribing(false);
        }
    };
    // Clinician marks session as completed and records homework summary
    const handleCompleteSession = () => {
        setAppointments(appointments.map((appt) => {
            if (appt.id === activeSession.id) {
                return {
                    ...appt,
                    status: "completed",
                    clinicalNotes: sessionNotes,
                    summaryPDF: scribeBrief || "# Clinical Telehealth Session Brief\n- Completed successfully.\n- Mindful breathing practiced in-call."
                };
            }
            return appt;
        }));
    };
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", id: "telehealth-workspace-container", children: [_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0D0D0F] border border-white/5 text-white rounded-2xl p-5 mb-6 shadow-lg", id: "session-banner", children: [_jsxs("div", { className: "text-left space-y-1.5", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider animate-pulse", children: "Live Connection Secured" }), _jsx("span", { className: "text-slate-400 text-xs font-semibold", children: "\u2022 256-bit Encrypted Telehealth" })] }), _jsxs("h2", { className: "text-lg font-light tracking-wider uppercase text-slate-100", style: { fontFamily: "Georgia, serif" }, children: ["Consultation Panel: ", activeSession.patientId === currentUser.id ? activeSession.psychologistName : activeSession.patientName] }), _jsxs("p", { className: "text-[11px] text-slate-400 font-mono", children: ["Topic Focus: ", _jsx("span", { className: "underline text-indigo-400", children: activeSession.psychologistSpecialty })] })] }), _jsxs("div", { className: `flex items-center space-x-2 mt-4 sm:mt-0 px-3 py-1.5 rounded-xl border transition-all duration-300 ${secondsLeft <= 300
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse font-bold"
                            : "bg-white/[0.02] border-white/5 text-slate-200"}`, id: "call-timer-box", children: [_jsx(Clock, { className: `w-3.5 h-3.5 ${secondsLeft <= 300 ? "text-amber-400" : "text-indigo-400"}` }), _jsxs("span", { className: "text-xs font-mono tracking-wider", children: ["Remaining: ", formatRemainingTime(secondsLeft)] })] })] }), secondsLeft <= 300 && secondsLeft > 0 && (_jsxs("div", { className: "bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs py-3.5 px-4 rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in", id: "five-minute-somatic-alert", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "relative flex h-2 w-2", children: [_jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" }), _jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-amber-500" })] }), _jsxs("p", { className: "font-semibold text-xs text-slate-200", children: [_jsx("span", { className: "text-amber-400 uppercase tracking-wider text-[10px] mr-1", children: "[ALERT]" }), " Only ", _jsx("span", { className: "font-mono text-amber-300 font-extrabold", children: formatRemainingTime(secondsLeft) }), " remaining. ", currentUser.role === "psychologist" ? "Clinician, please finalize your diagnostic recommendations." : "Patient, please confirm your weekly repeatable homework and habits."] })] }), _jsx("span", { className: "text-[9px] uppercase font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded tracking-widest font-extrabold select-none", children: "Final 5 Mins Remaining" })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6", id: "telehealth-interactive-board", children: [_jsxs("div", { className: "lg:col-span-8 space-y-6", id: "telehealth-left-deck", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", id: "video-feeds-grid", children: [_jsx("div", { className: "bg-[#0D0D0F] aspect-video rounded-2xl relative overflow-hidden border border-white/5 text-left", id: "feed-therapist", children: videoOn ? (_jsxs("div", { className: "w-full h-full relative", id: "therapist-camera-stream", children: [_jsx("img", { src: activeSession.psychologistAvatar, alt: activeSession.psychologistName, referrerPolicy: "no-referrer", className: "w-full h-full object-cover opacity-85" }), _jsxs("div", { className: "absolute top-3 left-3 bg-indigo-600 border border-indigo-400 text-white font-semibold text-[10px] px-2.5 py-1 rounded flex items-center space-x-1.5 shadow-md", children: [_jsx("span", { className: "w-2 h-2 bg-white rounded-full animate-ping" }), _jsx("span", { children: activeSession.psychologistName.split(",")[0] })] })] })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center text-slate-500 text-xs", children: "Video Stream Muted" })) }), _jsxs("div", { className: "bg-[#0D0D0F] aspect-video rounded-2xl relative overflow-hidden border border-white/5 text-left", id: "feed-patient", children: [videoOn ? (_jsxs("div", { className: "w-full h-full relative animate-pulse-slow", id: "patient-camera-stream", children: [_jsx("img", { src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300", alt: activeSession.patientName, referrerPolicy: "no-referrer", className: "w-full h-full object-cover opacity-80" }), _jsx("div", { className: "absolute top-3 left-3 bg-white/[0.04] border border-white/5 text-slate-200 font-semibold text-[10px] px-2.5 py-1 rounded flex items-center shadow-md", children: _jsxs("span", { children: [activeSession.patientName, " (You)"] }) })] })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center text-slate-500 text-xs", children: "Camera Signal Offline" })), _jsxs("div", { className: "absolute bottom-3 right-3 bg-black/60 rounded-full p-2 flex items-center space-x-1 border border-white/10", children: [micOn ? _jsx(Mic, { className: "w-3.5 h-3.5 text-indigo-400" }) : _jsx(MicOff, { className: "w-3.5 h-3.5 text-rose-500" }), _jsxs("div", { className: "flex space-x-0.5 items-end h-3 w-5", children: [_jsx("div", { className: "bg-indigo-400 w-1 rounded-sm", style: { height: `${micOn ? micAmplitude * 0.5 : 2}%` } }), _jsx("div", { className: "bg-indigo-400 w-1 rounded-sm", style: { height: `${micOn ? micAmplitude * 1.0 : 2}%` } }), _jsx("div", { className: "bg-indigo-400 w-1 rounded-sm", style: { height: `${micOn ? micAmplitude * 0.7 : 2}%` } })] })] })] })] }), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-4 flex flex-wrap gap-3 justify-between items-center shadow-lg", id: "controls-toolbar", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("button", { id: "toggle-video-btn", onClick: () => setVideoOn(!videoOn), className: `p-2.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 text-xs font-bold ${videoOn ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`, children: [videoOn ? _jsx(Video, { className: "w-4 h-4" }) : _jsx(VideoOff, { className: "w-4 h-4" }), _jsx("span", { children: videoOn ? "Cam Connected" : "Cam Paused" })] }), _jsxs("button", { id: "toggle-mic-btn", onClick: () => setMicOn(!micOn), className: `p-2.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 text-xs font-bold ${micOn ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`, children: [micOn ? _jsx(Mic, { className: "w-4 h-4" }) : _jsx(MicOff, { className: "w-4 h-4" }), _jsx("span", { children: micOn ? "Mic Live" : "Mic Muted" })] })] }), _jsxs("div", { className: "flex items-center space-x-2 border-l border-white/5 pl-4", id: "breath-coach-widget", children: [_jsx("span", { className: "text-[10px] font-bold text-slate-500 mr-2 uppercase tracking-wider font-mono", children: "Somatic breather" }), _jsxs("button", { id: "breath-coaching-trigger", onClick: () => setBreathCycleActive(!breathCycleActive), className: `px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition ${breathCycleActive ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-white/[0.03] text-slate-350 hover:bg-white/[0.06] border border-white/5"}`, children: [_jsx(Play, { className: "w-3 h-3 fill-current" }), _jsx("span", { children: breathCycleActive ? "Stop Coach" : "Start Respiration Guide" })] }), breathCycleActive && (_jsxs("div", { className: "flex items-center space-x-2 bg-emerald-500/5 text-emerald-400 border border-emerald-500/25 rounded-xl px-3 py-1 text-[11px] font-bold", id: "breath-countdowns", children: [_jsxs("span", { className: "capitalize", children: [breathPhase, ":"] }), _jsxs("span", { className: "font-mono bg-emerald-550/10 px-1.5 py-0.5 rounded text-emerald-300 font-bold tracking-widest", children: [breathCount, "s"] }), _jsx("div", { className: "w-2.5 h-2.5 bg-emerald-400 rounded-full transition-all duration-1000 shrink-0 border border-emerald-300", style: {
                                                            transform: breathPhase.startsWith("Inhale") ? "scale(2.2)" : breathPhase.startsWith("Hold") ? "scale(2.2)" : "scale(1.0)"
                                                        } })] }))] })] }), isTherapist && (_jsxs("div", { className: "bg-[#0D0D0F] border border-white/5 rounded-2xl p-5 shadow-lg text-left", id: "professional-workspace", children: [_jsxs("div", { className: "flex justify-between items-start mb-3 border-b border-white/5 pb-2", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[9px] uppercase tracking-wider font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded", children: "Psychologist Workspace Only" }), _jsx("h3", { className: "text-sm font-light text-slate-100 mt-2 uppercase", style: { fontFamily: "Georgia, serif" }, children: "Structured Session Logs & Scribe Summary" })] }), _jsxs("button", { id: "ai-scribe-trigger", onClick: triggerAIScribeBrief, disabled: isScribing, className: "bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 disabled:opacity-50 shadow-md cursor-pointer", children: [_jsx(Sparkles, { className: "w-3.5 h-3.5 animate-spin-slow" }), _jsx("span", { children: isScribing ? "Scribing with Gemini..." : "Compile AI Session Brief" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 font-mono", children: "Direct Diagnostic Clinician Logs" }), _jsx("textarea", { id: "therapist-notes-area", placeholder: "Jot down active patient challenges, cognitive defusion response levels, and behavioral observations in real time...", rows: 8, value: sessionNotes, onChange: (e) => setSessionNotes(e.target.value), className: "w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none font-sans" })] }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 font-mono", children: "AI Formulated Session Brief" }), _jsx("div", { className: "bg-[#0A0A0C] border border-white/10 rounded-xl p-3 flex-1 overflow-y-auto text-xs text-slate-300 leading-relaxed font-sans max-h-52", id: "ai-brief-display-box", children: isScribing ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full py-8 text-center space-y-2", children: [_jsx("div", { className: "w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-slate-500 text-[10px]", children: "Processing transcripts & clinical logs..." })] })) : scribeBrief ? (_jsxs("div", { className: "prose prose-xs max-w-full text-[11px] text-slate-350", children: [_jsxs("div", { className: "flex items-center space-x-1 font-bold text-indigo-400 border-b border-white/5 pb-1 mb-2", children: [_jsx(CheckCircle2, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Generated Summary & Homework" })] }), _jsx("div", { className: "whitespace-pre-line text-left", children: scribeBrief })] })) : (_jsxs("div", { className: "flex flex-col items-center justify-center text-center h-full text-slate-550 py-6", children: [_jsx(FileText, { className: "w-8 h-8 text-slate-600 mb-2" }), _jsx("p", { className: "text-[10px] max-w-xs leading-relaxed", children: "Tap \"Compile AI Session Brief\" above to aggregate and review dynamic consult summary briefs automatically using Gemini AI." })] })) })] })] }), _jsxs("div", { className: "mt-5 border-t border-white/5 pt-4 flex justify-between items-center bg-[#09090B] border border-white/5 rounded-xl p-3.5", children: [_jsxs("div", { className: "text-left", children: [_jsx("h4", { className: "font-semibold text-xs text-slate-200 leading-none", children: "Ready to wrap up clinical consultation?" }), _jsx("p", { className: "text-[10px] text-slate-400 mt-1", children: "Completing will sync briefs and homework directly to the patient profile history." })] }), _jsx("button", { id: "complete-consult-btn", onClick: handleCompleteSession, className: "bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0", children: "Conclude Session" })] })] }))] }), _jsxs("div", { className: "lg:col-span-4 space-y-6", id: "telehealth-right-deck", children: [_jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-4 shadow-lg flex flex-col h-[320px] md:h-[350px] text-left", id: "telehealth-chat-box", children: [_jsxs("h3", { className: "text-sm font-light uppercase tracking-wider text-slate-200 flex items-center mb-3", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Send, { className: "w-3.5 h-3.5 text-indigo-400 mr-2" }), "Live Clinic Chat"] }), _jsx("div", { className: "flex-1 overflow-y-auto space-y-2.5 mb-3 pr-1 text-xs", id: "telehealth-chat-history", children: activeSession.chatHistory?.map((msg) => {
                                            if (msg.isSystem) {
                                                return (_jsx("div", { className: "text-center p-1.5 bg-white/[0.01] border border-white/5 rounded-lg text-[10px] text-slate-500 font-mono", children: msg.content }, msg.id));
                                            }
                                            const isMyMsg = msg.senderId === currentUser.id;
                                            return (_jsxs("div", { className: `flex flex-col ${isMyMsg ? "items-end" : "items-start"}`, children: [_jsxs("span", { className: "text-[9px] text-slate-500 mb-0.5 font-mono", children: [msg.senderName, " \u2022 ", msg.timestamp] }), _jsx("div", { className: `p-2.5 rounded-xl max-w-[85%] leading-relaxed ${isMyMsg ? "bg-indigo-600 text-white rounded-tr-none" : "bg-[#0A0A0C] text-slate-350 rounded-tl-none border border-white/5"}`, children: msg.content })] }, msg.id));
                                        }) }), _jsxs("div", { className: "flex space-x-2 pt-2 border-t border-white/5", children: [_jsx("input", { id: "telehealth-msg-input", type: "text", placeholder: "Share material coordinates...", value: chatMessageText, onChange: (e) => setChatMessageText(e.target.value), onKeyDown: (e) => {
                                                    if (e.key === "Enter")
                                                        handleSendCallChat();
                                                }, className: "flex-1 bg-[#0A0A0C] text-slate-250 placeholder-slate-500 text-xs rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500" }), _jsx("button", { id: "send-telehealth-msg-btn", onClick: handleSendCallChat, className: "p-2 bg-indigo-600 text-white hover:bg-indigo-500 transition rounded-xl shrink-0 cursor-pointer", children: _jsx(Send, { className: "w-3.5 h-3.5" }) })] })] }), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-4 shadow-lg text-left", id: "clinical-materials", children: [_jsxs("h3", { className: "text-sm font-light uppercase tracking-wider text-slate-200 flex items-center mb-3", style: { fontFamily: "Georgia, serif" }, children: [_jsx(BookOpen, { className: "w-3.5 h-3.5 text-indigo-400 mr-2" }), "Homework Materials"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start space-x-3 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl", children: [_jsx(FileText, { className: "w-4 h-4 text-slate-500 mt-0.5 shrink-0" }), _jsxs("div", { className: "space-y-0.5", children: [_jsx("h4", { className: "text-xs font-semibold text-slate-200 leading-none", children: "ACT Defusion Card.pdf" }), _jsx("p", { className: "text-[10px] text-slate-400", children: "Cognitive framing statements toolkit" })] })] }), _jsxs("div", { className: "flex items-start space-x-3 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl", children: [_jsx(FileText, { className: "w-4 h-4 text-slate-500 mt-0.5 shrink-0" }), _jsxs("div", { className: "space-y-0.5", children: [_jsx("h4", { className: "text-xs font-semibold text-slate-200 leading-none", children: "Somatic Log Template.xlsx" }), _jsx("p", { className: "text-[10px] text-slate-400", children: "Weekly stress indicator tracker" })] })] })] })] })] })] })] }));
}
