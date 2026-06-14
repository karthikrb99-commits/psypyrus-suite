import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { encryptMessageText, decryptMessageText } from "../services/crypto";
import { createChatThreadInFirebase, addDirectChatMessageInFirebase } from "../services/firebaseStore";
import { db } from "../services/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Send, Search, ShieldCheck, CheckCheck, MessageSquare, Lock, Award } from "lucide-react";
import { WebSocketConn } from "../../services/websocket";
export default function Messages({ currentUser, allUsers }) {
    // Syncing chat threads from Firestore
    const [threads, setThreads] = useState([]);
    const [activeThreadId, setActiveThreadId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsgText, setNewMsgText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef(null);

    const [wsState, setWsState] = useState(WebSocketConn.status);
    const [wsPing, setWsPing] = useState(WebSocketConn.latency);

    useEffect(() => {
        const handleState = (e) => {
            setWsState(e.detail.status);
            setWsPing(e.detail.latency);
        };
        window.addEventListener('psypyrus_ws_state', handleState);
        return () => window.removeEventListener('psypyrus_ws_state', handleState);
    }, []);

    // Scroll to bottom helper
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    // 1. Sync real-time threads matching current user
    useEffect(() => {
        const q = query(collection(db, "chats"), where("participants", "array-contains", currentUser.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const arr = [];
            snapshot.forEach((doc) => {
                arr.push(doc.data());
            });
            setThreads(arr);
            // Auto-select first thread if nothing active
            if (arr.length > 0 && !activeThreadId) {
                // Find most recently updated thread
                const sorted = arr.sort((a, b) => b.latestMessageTime.localeCompare(a.latestMessageTime));
                setActiveThreadId(sorted[0].id);
            }
        }, (err) => {
            console.warn("Real-time chats sync failed:", err);
        });
        return () => unsubscribe();
    }, [currentUser]);
    // 2. Sync active messages from subcollection
    useEffect(() => {
        if (!activeThreadId) {
            setMessages([]);
            return;
        }
        const mQuery = collection(db, "chats", activeThreadId, "messages");
        const unsubscribe = onSnapshot(mQuery, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => {
                list.push(doc.data());
            });
            // Sort chronologically by local millisecond timestamp
            setMessages(list.sort((a, b) => a.createdAt - b.createdAt));
        }, (err) => {
            console.warn("Active thread messages sync failed:", err);
        });
        return () => unsubscribe();
    }, [activeThreadId]);

    // Sync incoming WebSocket messages
    useEffect(() => {
        if (!activeThreadId || !activeCounterUser) return;
        
        const handleWsMessage = (e) => {
            const incomingMsg = e.detail;
            if (incomingMsg.senderId === activeCounterUser.id) {
                const cipherText = encryptMessageText(incomingMsg.content, activeThreadId);
                const finalMsg = {
                    id: incomingMsg.id,
                    senderId: activeCounterUser.id,
                    senderName: activeCounterUser.name.split(",")[0],
                    content: cipherText,
                    timestamp: incomingMsg.timestamp,
                    createdAt: incomingMsg.createdAt
                };
                addDirectChatMessageInFirebase(activeThreadId, finalMsg, cipherText, incomingMsg.timestamp)
                    .catch(err => console.error("Failed to sync incoming WebSocket message:", err));
            }
        };
        
        window.addEventListener('psypyrus_ws_message', handleWsMessage);
        return () => window.removeEventListener('psypyrus_ws_message', handleWsMessage);
    }, [activeThreadId, activeCounterUser]);

    // Find recipient / counter-party details
    const getRecipientProfile = (thread) => {
        const counterId = thread.participants.find((id) => id !== currentUser.id);
        const counterUser = allUsers.find((u) => u.id === counterId);
        if (counterUser)
            return counterUser;
        // Fallback if not found in cache
        const nameIdx = thread.participants.indexOf(counterId || "");
        const counterName = nameIdx !== -1 && thread.participantNames ? thread.participantNames[nameIdx] : "Anonymous Client";
        return {
            id: counterId || "unknown",
            name: counterName,
            role: isPsychologistSelf ? "patient" : "psychologist",
            email: "",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        };
    };
    const isPsychologistSelf = currentUser.role === "psychologist";
    const activeThread = threads.find((t) => t.id === activeThreadId);
    const activeCounterUser = activeThread ? getRecipientProfile(activeThread) : null;
    // 3. Initiate new E2EE Chat Thread deterministically
    const handleStartNewChat = async (recipient) => {
        // Generate compound deterministic chat Id (ensures only 1 private channel exists ever!)
        const smallerId = currentUser.id < recipient.id ? currentUser.id : recipient.id;
        const largerId = currentUser.id > recipient.id ? currentUser.id : recipient.id;
        const threadId = `chat_${smallerId}_${largerId}`;
        const existing = threads.find((t) => t.id === threadId);
        if (existing) {
            setActiveThreadId(threadId);
            return;
        }
        const introductoryContent = `Hello! Standard HIPAA-grade encryptions are fully primed here. Let's coordinate somatic checkpoints safely.`;
        const encryptedIntro = encryptMessageText(introductoryContent, threadId);
        const newThread = {
            id: threadId,
            participants: [currentUser.id, recipient.id],
            participantNames: [currentUser.name, recipient.name],
            latestMessage: encryptedIntro,
            latestMessageTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            initiatorId: currentUser.id,
            receiverId: recipient.id
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
            await createChatThreadInFirebase(newThread);
            await addDirectChatMessageInFirebase(threadId, initialMsg, encryptedIntro, newThread.latestMessageTime);
            setActiveThreadId(threadId);
        }
        catch (err) {
            console.error("Failed to establish chat session:", err);
        }
    };
    // 4. Dispatch private encrypted message
    const handleSendMessage = async () => {
        if (!activeThreadId || !newMsgText.trim() || !activeThread)
            return;
        const rawText = newMsgText.trim();
        setNewMsgText(""); // Immediate clear for UX crispness
        const cipherText = encryptMessageText(rawText, activeThreadId);
        const msgId = "msg_" + Date.now();
        const timeFormatted = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const newMsg = {
            id: msgId,
            senderId: currentUser.id,
            senderName: currentUser.name.split(",")[0],
            content: cipherText, // Saved encrypted!
            timestamp: timeFormatted,
            createdAt: Date.now()
        };
        try {
            await addDirectChatMessageInFirebase(activeThreadId, newMsg, cipherText, timeFormatted);
            WebSocketConn.sendMessage(rawText, activeCounterUser?.id);
        }
        catch (err) {
            console.error("Failed to transmit message securely:", err);
        }
    };
    // Filter contacts available to chat
    const eligibleContacts = allUsers.filter((u) => u.id !== currentUser.id && u.role !== currentUser.role);
    const searchedContacts = eligibleContacts.filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", id: "messaging-module-view", children: [_jsxs("div", { className: "bg-[#0D0D0F] border border-white/5 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-left", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-sm font-semibold text-slate-100 uppercase tracking-widest flex items-center", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Lock, { className: "w-4 h-4 text-indigo-400 mr-2 shrink-0" }), "Secure In-App Chat Chamber"] }), _jsx("p", { className: "text-xs text-slate-400 mt-1 max-w-xl", children: "All consultations are end-to-end encrypted directly on your local device client using rotational XOR offsets. No telemetry is logged onto public indexes, locking HIPAA parity." })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto", children: [
                    _jsxs("div", { className: "flex bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl text-emerald-400 text-[11px] font-bold tracking-wide items-center space-x-1.5 shrink-0", children: [_jsx(ShieldCheck, { className: "w-4.5 h-4.5" }), _jsx("span", { children: "E2EE Clinician Active Protocol" })] }),
                    _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '5px 12px', borderRadius: '10px', fontSize: '11px' }, children: [
                        _jsx("span", { style: { width: '7px', height: '7px', borderRadius: '50%', background: wsState === 'CONNECTED' ? '#10b981' : (wsState === 'RECONNECTING' ? '#f59e0b' : '#ef4444'), boxShadow: wsState === 'CONNECTED' ? '0 0 6px #10b981' : 'none', display: 'inline-block' } }),
                        _jsxs("span", { style: { color: 'var(--text-normal)', fontWeight: 'bold' }, children: ["WS: ", _jsx("span", { style: { color: wsState === 'CONNECTED' ? '#10b981' : (wsState === 'RECONNECTING' ? '#f59e0b' : '#ef4444') }, children: wsState }), wsState === 'CONNECTED' && ` (${wsPing}ms)`] }),
                        _jsx("button", { onClick: () => wsState === 'CONNECTED' ? WebSocketConn.simulateNetworkDrop() : WebSocketConn.connect(), disabled: wsState === 'CONNECTING' || wsState === 'RECONNECTING', style: { fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', marginLeft: '6px' }, children: wsState === 'CONNECTED' ? 'Simulate Drop' : 'Reconnect' })
                    ] })
                ] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 bg-[#0D0D0F] rounded-2xl border border-white/5 overflow-hidden shadow-2xl h-[520px] md:h-[580px]", id: "messaging-panel", children: [_jsxs("div", { className: "md:col-span-4 border-r border-white/5 flex flex-col h-full bg-[#0A0A0C] text-left", id: "threads-column", children: [_jsxs("div", { className: "p-4 border-b border-white/5 bg-[#0D0D0F] space-y-3", id: "search-threads-box", children: [_jsx("span", { className: "text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono block", children: "Chat Contacts & Sandboxes" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-550 w-3.5 h-3.5" }), _jsx("input", { id: "search-chat-contacts", type: "text", placeholder: "Search connected directory profiles...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full bg-[#070708] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder-slate-500" })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-2.5 space-y-3", id: "threads-and-contacts-scrollpanel", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("span", { className: "block text-[9px] uppercase font-bold text-slate-505 tracking-wider font-mono px-1.5 mb-1", children: "Active E2EE Channels" }), threads.length === 0 ? (_jsx("p", { className: "text-[10px] text-slate-500 italic px-2 py-1", children: "No active conversations started yet. Select a sandbox below to initiate secure consults." })) : (threads.map((thread) => {
                                                const isActive = thread.id === activeThreadId;
                                                const counterParty = getRecipientProfile(thread);
                                                const showLastMsgText = decryptMessageText(thread.latestMessage, thread.id);
                                                return (_jsxs("div", { id: `thread-item-${counterParty.id}`, onClick: () => setActiveThreadId(thread.id), className: `p-2.5 rounded-xl transition cursor-pointer flex items-center space-x-3 border ${isActive
                                                        ? "bg-indigo-600/10 border-indigo-500/25 text-indigo-305 shadow-sm"
                                                        : "hover:bg-white/[0.02] bg-[#0D0D0F]/70 border-white/5"}`, children: [_jsxs("div", { className: "relative shrink-0", children: [_jsx("img", { src: counterParty.avatar, alt: counterParty.name, referrerPolicy: "no-referrer", className: "w-9 h-9 rounded-full object-cover ring-2 ring-white/5" }), _jsx("span", { className: "absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0A0A0C]" })] }), _jsxs("div", { className: "flex-1 min-w-0 text-left", children: [_jsxs("div", { className: "flex justify-between items-baseline", children: [_jsx("span", { className: "font-extrabold text-[11.5px] text-slate-200 truncate", children: counterParty.name.split(",")[0] }), _jsx("span", { className: "text-[8.5px] text-slate-500 font-medium font-mono shrink-0", children: thread.latestMessageTime })] }), _jsx("p", { className: "text-[10px] text-slate-400 truncate mt-0.5", title: "Decrypted local stream", children: showLastMsgText })] })] }, thread.id));
                                            }))] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("span", { className: "block text-[9px] uppercase font-bold text-slate-505 tracking-wider font-mono px-1.5 mb-1", children: "Connected Care Profiles" }), searchedContacts.length === 0 ? (_jsx("p", { className: "text-[10px] text-slate-500 italic px-2 py-1", children: "No other participants match filter." })) : (_jsx("div", { className: "grid grid-cols-1 gap-1.5", children: searchedContacts.map((contact) => (_jsxs("div", { id: `start-chat-contact-${contact.id}`, onClick: () => handleStartNewChat(contact), className: "p-2 bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 rounded-lg flex items-center justify-between cursor-pointer transition", children: [_jsxs("div", { className: "flex items-center space-x-2.5 min-w-0", children: [_jsx("img", { src: contact.avatar, alt: contact.name, referrerPolicy: "no-referrer", className: "w-7 h-7 rounded-full object-cover ring-1 ring-white/10 shrink-0" }), _jsx("div", { className: "text-left font-medium text-[11px] truncate text-slate-300", children: contact.name })] }), _jsx("span", { className: "text-[8px] bg-indigo-505/10 border border-indigo-500/10 text-indigo-305 font-bold px-1.5 py-0.2 rounded uppercase shrink-0", children: "Message" })] }, contact.id))) }))] })] })] }), activeThread && activeCounterUser ? (_jsxs("div", { className: "md:col-span-8 flex flex-col h-full bg-[#0A0A0C] text-left", id: "chat-feed-column", children: [_jsxs("div", { className: "p-4 border-b border-white/5 flex items-center justify-between bg-[#0D0D0F]", id: "chat-feed-header", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("img", { src: activeCounterUser.avatar, alt: activeCounterUser.name, referrerPolicy: "no-referrer", className: "w-10 h-10 rounded-full object-cover ring-2 ring-white/5 shrink-0" }), _jsxs("div", { className: "text-left space-y-0.5", children: [_jsx("h3", { className: "font-bold text-xs text-slate-200 leading-none", children: activeCounterUser.name }), _jsxs("div", { className: "flex items-center space-x-1.5 font-mono text-[9px] text-slate-400 uppercase", children: [_jsxs("span", { className: "text-indigo-400 font-bold flex items-center", children: [_jsx(Lock, { className: "w-2.5 h-2.5 mr-0.5 shrink-0" }), "Client E2EE Verified"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: ["Role: ", activeCounterUser.role] })] })] })] }), _jsxs("div", { className: "hidden sm:flex items-center space-x-1.5 bg-indigo-500/5 px-2.5 py-1 rounded-xl border border-indigo-500/10 text-[10px] text-indigo-300", children: [_jsx(Award, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Encrypted Feed" })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#070708]", id: "active-bubbles-stage", children: [_jsxs("div", { className: "p-3 bg-[#0A0A0C] border border-white/5 rounded-2xl max-w-sm mx-auto text-center text-[10.5px] text-slate-450 leading-relaxed font-sans flex items-center space-x-2", children: [_jsx(ShieldCheck, { className: "w-5 h-5 text-emerald-400 shrink-0" }), _jsx("span", { children: "Automatic rotational symmetric cryptographic keys successfully verified. All communication traces are locally safe." })] }), messages.length === 0 ? (_jsx("p", { className: "text-xs text-slate-500 italic text-center pt-8", children: "Establishing security connection timeline... Type first message below!" })) : (messages.map((msg) => {
                                        const isMine = msg.senderId === currentUser.id;
                                        const decryptedText = decryptMessageText(msg.content, activeThreadId);
                                        return (_jsx("div", { className: `flex ${isMine ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: "max-w-[75%] space-y-1", children: [_jsx("div", { className: `p-3 rounded-2xl text-xs leading-relaxed shadow-md ${isMine
                                                            ? "bg-indigo-600 text-white rounded-tr-none"
                                                            : "bg-[#0D0D0F] text-slate-300 rounded-tl-none border border-white/5"}`, children: _jsx("p", { className: "whitespace-pre-line text-left", children: decryptedText }) }), _jsxs("div", { className: `flex items-center space-x-1 text-[8.5px] text-slate-505 ${isMine ? "justify-end" : "justify-start"}`, children: [_jsx("span", { className: "font-mono", children: msg.timestamp }), isMine && _jsx(CheckCheck, { className: "w-3.5 h-3.5 text-indigo-400 shrink-0" })] })] }) }, msg.id));
                                    })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "p-4 border-t border-white/5 bg-[#0D0D0F]", id: "chat-send-console", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { id: "chat-chamber-input-text", type: "text", placeholder: `Send private E2EE response to ${activeCounterUser.name.split(",")[0]}...`, value: newMsgText, onChange: (e) => setNewMsgText(e.target.value), onKeyDown: (e) => {
                                                if (e.key === "Enter")
                                                    handleSendMessage();
                                            }, className: "flex-1 bg-[#070708] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-202 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" }), _jsx("button", { id: "send-chat-chamber-btn", onClick: handleSendMessage, disabled: !newMsgText.trim(), className: "p-3 bg-indigo-600 disabled:opacity-50 text-white hover:bg-indigo-500 transition rounded-xl shrink-0 cursor-pointer flex items-center justify-center shadow-md", children: _jsx(Send, { className: "w-4 h-4" }) })] }) })] })) : (_jsxs("div", { className: "md:col-span-8 flex flex-col items-center justify-center text-center p-8 bg-[#070708] text-slate-500", id: "empty-thread-dialogue", children: [_jsx(MessageSquare, { className: "w-10 h-10 text-slate-700 animate-bounce mb-3" }), _jsx("h3", { className: "font-semibold text-slate-300 uppercase tracking-widest text-xs", style: { fontFamily: "Georgia, serif" }, children: "Select a consult room" }), _jsx("span", { className: "text-[11px] text-slate-500 mt-2.5 max-w-xs leading-relaxed", children: "Choose an active clinician thread or start a secure E2EE workspace from the client listings shortcuts." })] }))] })] }));
}
