import { useState, useEffect, useRef } from "react";
import { encryptMessageText, decryptMessageText } from "../services/crypto";
import { createChatThreadInFirebase, addDirectChatMessageInFirebase } from "../services/firebaseStore";
import { db } from "../services/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { 
  Send, Search, ShieldCheck, CheckCheck, Check, Lock, 
  Plus, Trash2, Smile, X, Activity, Info,
  Mic, Play, Pause, Pin
} from "lucide-react";
import { WebSocketConn } from "../../services/websocket";
import { GeminiService } from "../../services/ai";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_CHANNELS = [
  { id: "chan_general", name: "general", description: "Broad support, coping discussions, and community sharing.", isDefault: true },
  { id: "chan_cbt", name: "cbt-grounding", description: "Structured Cognitive Behavioral strategies and templates.", isDefault: true },
  { id: "chan_wellness", name: "wellness-chat", description: "Daily check-ins, sleep updates, and somatic trackers.", isDefault: true },
  { id: "chan_announcements", name: "announcements", description: "Read-only official clinical staff updates.", isDefault: true }
];

const INITIAL_CHANNEL_MESSAGES = {
  "chan_general": [
    { id: "chm1", senderId: "dr_sarah", senderName: "Dr. Sarah Jenkins", content: "Welcome to the #general channel! Feel free to ask questions or share daily mindfulness learnings.", timestamp: "10:15 AM", reactions: {} },
    { id: "chm2", senderId: "patient_user", senderName: "Alex Rivera", content: "Thanks for setting this up! Looking forward to chatting with the community.", timestamp: "10:20 AM", reactions: {} }
  ],
  "chan_cbt": [
    { id: "chm3", senderId: "dr_mei", senderName: "Dr. Mei Chen", content: "Hi everyone, in this channel you can practice reframing automatic thoughts. Try typing `/coping` in the chat input to generate a worksheet template!", timestamp: "09:30 AM", reactions: {} }
  ],
  "chan_announcements": [
    { id: "chm4", senderId: "dr_alan", senderName: "Dr. Alan Vance", content: "📢 Announcement: Our virtual weekend breathing circle starts at 10:00 AM on Saturday. Link will be posted in DMs.", timestamp: "Yesterday", reactions: {} }
  ],
  "chan_wellness": []
};

export default function Messages({ currentUser, allUsers }) {
  // Chat foldertabs (Telegram style): all, unread, channels, clinical DMs, patient DMs
  const [folderTab, setFolderTab] = useState("all");

  // Navigation tabs: 'channels' or 'dms'
  const [activeTab, setActiveTab] = useState("channels");
  const [activeChannelId, setActiveChannelId] = useState("chan_general");

  // Dynamic channels list & messages loaded from localStorage
  const [channels, setChannels] = useState(() => {
    const saved = localStorage.getItem("psypyrus_channels");
    return saved ? JSON.parse(saved) : DEFAULT_CHANNELS;
  });

  const [channelMessages, setChannelMessages] = useState(() => {
    const saved = localStorage.getItem("psypyrus_channel_messages");
    return saved ? JSON.parse(saved) : INITIAL_CHANNEL_MESSAGES;
  });

  // Dynamic channel modal states
  const [isNewChannelModalOpen, setIsNewChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");

  // E2EE Direct Message states
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Chat input
  const [newMsgText, setNewMsgText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  // WebSocket Connection States
  const [wsState, setWsState] = useState(WebSocketConn.status);
  const [wsPing, setWsPing] = useState(WebSocketConn.latency);

  // Hover bubble emoji reaction menu
  const [reactionMsgId, setReactionMsgId] = useState(null);

  // PyrusBot AI states
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Zenbox visual breathing exercise state
  const [zenActive, setZenActive] = useState(false);
  const [zenPhase, setZenPhase] = useState("Inhale"); // Inhale, Hold, Exhale, Hold Empty
  const [zenCountdown, setZenCountdown] = useState(4);
  const [zenCycleCount, setZenCycleCount] = useState(1);

  // Pinned Messages state
  const [pinnedMessages, setPinnedMessages] = useState(() => {
    const saved = localStorage.getItem("psypyrus_pinned_messages");
    return saved ? JSON.parse(saved) : {};
  });

  // Highlighted message ID (for scrolling/glow)
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);

  // WhatsApp Voice Note Recorder State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordSeconds, setVoiceRecordSeconds] = useState(0);
  const voiceTimerRef = useRef(null);

  // Voice playback states
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [voiceProgress, setVoiceProgress] = useState({});
  const playbackTimerRef = useRef(null);

  const isPsychologistSelf = currentUser.role === "psychologist";
  const activeThread = threads.find((t) => t.id === activeThreadId);

  const getRecipientProfile = (thread) => {
    const counterId = thread.participants.find((id) => id !== currentUser.id);
    const counterUser = allUsers.find((u) => u.id === counterId);
    if (counterUser) return counterUser;
    
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

  const activeCounterUser = activeThread ? getRecipientProfile(activeThread) : null;

  // Persist channels, messages, and pins
  useEffect(() => {
    localStorage.setItem("psypyrus_channels", JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem("psypyrus_channel_messages", JSON.stringify(channelMessages));
  }, [channelMessages]);

  useEffect(() => {
    localStorage.setItem("psypyrus_pinned_messages", JSON.stringify(pinnedMessages));
  }, [pinnedMessages]);

  useEffect(() => {
    const handleState = (e) => {
      setWsState(e.detail.status);
      setWsPing(e.detail.latency);
    };
    window.addEventListener('psypyrus_ws_state', handleState);
    return () => window.removeEventListener('psypyrus_ws_state', handleState);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, channelMessages, activeChannelId, activeThreadId, isBotTyping, isRecordingVoice]);

  // Sync DMs from Firestore
  useEffect(() => {
    const q = query(collection(db, "chats"), where("participants", "array-contains", currentUser.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const arr = [];
      snapshot.forEach((doc) => {
        arr.push(doc.data());
      });
      setThreads(arr);
      if (arr.length > 0 && !activeThreadId) {
        const sorted = arr.sort((a, b) => b.latestMessageTime.localeCompare(a.latestMessageTime));
        setActiveThreadId(sorted[0].id);
      }
    }, (err) => {
      console.warn("Real-time chats sync failed:", err);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Sync active DM messages
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
      // Populate mock default ticks to DMs loaded from DB
      const sorted = list.sort((a, b) => a.createdAt - b.createdAt).map(m => ({
        ...m,
        status: m.status || "read"
      }));
      setMessages(sorted);
    }, (err) => {
      console.warn("Active thread messages sync failed:", err);
    });
    return () => unsubscribe();
  }, [activeThreadId]);

  // Sync incoming WebSocket DMs
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
          createdAt: incomingMsg.createdAt,
          reactions: {},
          status: "read"
        };
        addDirectChatMessageInFirebase(activeThreadId, finalMsg, cipherText, incomingMsg.timestamp)
          .catch(err => console.error("Failed to sync incoming WebSocket message:", err));
      }
    };
    
    window.addEventListener('psypyrus_ws_message', handleWsMessage);
    return () => window.removeEventListener('psypyrus_ws_message', handleWsMessage);
  }, [activeThreadId, activeCounterUser]);

  // Zen breathing coach timer
  useEffect(() => {
    if (!zenActive) return;
    
    const interval = setInterval(() => {
      setZenCountdown(prev => {
        if (prev > 1) {
          return prev - 1;
        } else {
          if (zenPhase === "Inhale") {
            setZenPhase("Hold");
            return 4;
          } else if (zenPhase === "Hold") {
            setZenPhase("Exhale");
            return 4;
          } else if (zenPhase === "Exhale") {
            setZenPhase("Hold Empty");
            return 4;
          } else {
            setZenCycleCount(c => {
              if (c >= 2) {
                setZenActive(false);
                const finishedMsg = {
                  id: "sys_zen_" + Date.now(),
                  senderId: "system",
                  senderName: "ZenBot",
                  content: "🌀 Visual Box Breathing completed successfully. Somatic heart rate stabilized.",
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  isSystem: true
                };
                addMessageToRoom(finishedMsg);
              }
              return c + 1;
            });
            setZenPhase("Inhale");
            return 4;
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [zenActive, zenPhase]);

  // Voice Note Recording Mockup
  const startVoiceRecording = () => {
    setIsRecordingVoice(true);
    setVoiceRecordSeconds(0);
    voiceTimerRef.current = setInterval(() => {
      setVoiceRecordSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopVoiceRecording = (shouldSend = true) => {
    clearInterval(voiceTimerRef.current);
    setIsRecordingVoice(false);
    if (shouldSend && voiceRecordSeconds > 0) {
      const voiceId = "voice_" + Date.now();
      const timeFormatted = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const voiceMsg = {
        id: voiceId,
        senderId: currentUser.id,
        senderName: currentUser.name.split(",")[0],
        isVoice: true,
        voiceDuration: voiceRecordSeconds,
        timestamp: timeFormatted,
        status: "sent",
        reactions: {},
        createdAt: Date.now()
      };
      
      addMessageToRoom(voiceMsg);
      if (activeTab === "dms") {
        simulateTicksTransition(voiceId);
      }
    }
    setVoiceRecordSeconds(0);
  };

  // Voice Note Playback Mockup
  const handlePlayVoice = (msgId, duration) => {
    if (playingVoiceId === msgId) {
      clearInterval(playbackTimerRef.current);
      setPlayingVoiceId(null);
    } else {
      if (playingVoiceId) {
        clearInterval(playbackTimerRef.current);
      }
      setPlayingVoiceId(msgId);
      
      const startPercent = voiceProgress[msgId] || 0;
      let currentPercent = startPercent >= 100 ? 0 : startPercent;
      const step = 100 / (duration * 10); // step per 100ms
      
      playbackTimerRef.current = setInterval(() => {
        currentPercent += step;
        if (currentPercent >= 100) {
          currentPercent = 100;
          clearInterval(playbackTimerRef.current);
          setPlayingVoiceId(null);
        }
        setVoiceProgress(prev => ({
          ...prev,
          [msgId]: currentPercent
        }));
      }, 100);
    }
  };

  const handleSeekVoice = (msgId, progressPercent) => {
    setVoiceProgress(prev => ({
      ...prev,
      [msgId]: progressPercent
    }));
  };

  // WhatsApp-style message ticks transitions (sent -> delivered -> read)
  const simulateTicksTransition = (msgId) => {
    // 0.8s: sent -> delivered
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "delivered" } : m));
    }, 800);
    // 1.8s: delivered -> read
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "read" } : m));
    }, 1800);
  };

  const addMessageToRoom = (msgObj) => {
    if (activeTab === "channels") {
      setChannelMessages(prev => {
        const currentMsgs = prev[activeChannelId] || [];
        return {
          ...prev,
          [activeChannelId]: [...currentMsgs, msgObj]
        };
      });
    } else {
      setMessages(prev => [...prev, msgObj]);
    }
  };



  // Establish DM Secure Chat
  const handleStartNewChat = async (recipient) => {
    const smallerId = currentUser.id < recipient.id ? currentUser.id : recipient.id;
    const largerId = currentUser.id > recipient.id ? currentUser.id : recipient.id;
    const threadId = `chat_${smallerId}_${largerId}`;
    const existing = threads.find((t) => t.id === threadId);
    if (existing) {
      setActiveThreadId(threadId);
      setActiveTab("dms");
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
      createdAt: Date.now(),
      reactions: {},
      status: "read"
    };
    try {
      await createChatThreadInFirebase(newThread);
      await addDirectChatMessageInFirebase(threadId, initialMsg, encryptedIntro, newThread.latestMessageTime);
      setActiveThreadId(threadId);
      setActiveTab("dms");
    } catch (err) {
      console.error("Failed to establish chat session:", err);
    }
  };

  // Slack-style Slash commands parser
  const handleSlashCommand = async (commandText) => {
    const parts = commandText.split(" ");
    const command = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ");
    const timeFormatted = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (command === "/help") {
      const helpMsg = {
        id: "sys_" + Date.now(),
        senderId: "system",
        senderName: "PyrusBot",
        content: `🛠️ **PsychConnect Slack Commands**:\n\n` +
                 `• \`/help\`: List all available commands.\n` +
                 `• \`/zen\`: Starts a 16-second box breathing mindfulness visual coach right in the chat room.\n` +
                 `• \`/coping\`: Populates input field with a blank cognitive reframing CBT worksheet.\n` +
                 `• \`/clear\`: Clears the local chat workspace logging.\n` +
                 `• \`/dsm <disorder name>\`: Asks PyrusBot to query clinical criteria rules for the disorder.`,
        timestamp: timeFormatted,
        isSystem: true
      };
      addMessageToRoom(helpMsg);
    } else if (command === "/zen") {
      setZenCountdown(4);
      setZenPhase("Inhale");
      setZenCycleCount(1);
      setZenActive(true);
    } else if (command === "/coping") {
      setNewMsgText(
        `Situation: [Describe trigger]\n` +
        `Negative Automatic Thought: [Absolute statements]\n` +
        `Cognitive Distortion: [Label e.g. Black/White, Catastrophizing]\n` +
        `Rational Alternative: [Evidence-based replacement]`
      );
    } else if (command === "/clear") {
      if (activeTab === "channels") {
        setChannelMessages(prev => ({ ...prev, [activeChannelId]: [] }));
      } else {
        setMessages([]);
      }
    } else if (command === "/dsm" || commandText.startsWith("/")) {
      const prompt = command === "/dsm" 
        ? `Explain the primary diagnostic criteria, duration, and key differentials for: "${arg}".`
        : commandText.slice(1);
      
      const userMsg = {
        id: "usr_cmd_" + Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name.split(",")[0],
        content: commandText,
        timestamp: timeFormatted,
        status: "sent"
      };
      addMessageToRoom(userMsg);
      if (activeTab === "dms") {
        simulateTicksTransition(userMsg.id);
      }

      setIsBotTyping(true);
      
      try {
        const response = await GeminiService.callGemini(
          prompt, 
          "You are PyrusBot, a helpful AI mental health clinical assistant. Give concise, extremely structured explanations of disorders, DSM-5 criteria, or general wellness coping advice. Use markdown list bullets and format beautifully."
        );
        
        setIsBotTyping(false);
        const botReply = {
          id: "bot_reply_" + Date.now(),
          senderId: "pyrusbot",
          senderName: "PyrusBot",
          content: response || "Apologies, my AI core could not formulate a response. Check network parameters.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isBot: true
        };
        addMessageToRoom(botReply);
        
        // When bot replies, auto-read previous messages in DMs
        if (activeTab === "dms") {
          setMessages(prev => prev.map(m => m.senderId === currentUser.id ? { ...m, status: "read" } : m));
        }
      } catch {
        setIsBotTyping(false);
        const errReply = {
          id: "bot_err_" + Date.now(),
          senderId: "pyrusbot",
          senderName: "PyrusBot",
          content: "Failed to connect to the Pyrus AI core. Ensure your API keys are valid.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isBot: true
        };
        addMessageToRoom(errReply);
      }
    }
  };

  // Dispatch message
  const handleSendMessage = async () => {
    if (!newMsgText.trim()) return;
    const rawText = newMsgText.trim();
    setNewMsgText(""); 

    if (rawText.startsWith("/")) {
      handleSlashCommand(rawText);
      return;
    }

    const timeFormatted = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (activeTab === "channels") {
      const channelMsg = {
        id: "msg_" + Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name.split(",")[0],
        content: rawText,
        timestamp: timeFormatted,
        reactions: {}
      };
      setChannelMessages(prev => {
        const currentMsgs = prev[activeChannelId] || [];
        return {
          ...prev,
          [activeChannelId]: [...currentMsgs, channelMsg]
        };
      });

      if (rawText.toLowerCase().includes("@pyrusbot") || rawText.toLowerCase().includes("bot")) {
        setIsBotTyping(true);
        setTimeout(async () => {
          try {
            const botResponse = await GeminiService.callGemini(
              rawText, 
              "You are PyrusBot, a helpful AI therapist companion inside #general chat. Respond directly to the user's message with a warm, therapeutic, grounding reply in 2-3 sentences max."
            );
            setIsBotTyping(false);
            setChannelMessages(prev => ({
              ...prev,
              [activeChannelId]: [...(prev[activeChannelId] || []), {
                id: "bot_" + Date.now(),
                senderId: "pyrusbot",
                senderName: "PyrusBot",
                content: botResponse || "Hello! Let me know if you need to run a mindfulness exercise with `/zen`.",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                isBot: true
              }]
            }));
          } catch {
            setIsBotTyping(false);
          }
        }, 1500);
      }

    } else {
      // Secure DM
      if (!activeThreadId) return;
      const cipherText = encryptMessageText(rawText, activeThreadId);
      const msgId = "msg_" + Date.now();
      const newMsg = {
        id: msgId,
        senderId: currentUser.id,
        senderName: currentUser.name.split(",")[0],
        content: cipherText, 
        timestamp: timeFormatted,
        createdAt: Date.now(),
        reactions: {},
        status: "sent"
      };
      try {
        await addDirectChatMessageInFirebase(activeThreadId, newMsg, cipherText, timeFormatted);
        WebSocketConn.sendMessage(rawText, activeCounterUser?.id);
        simulateTicksTransition(msgId);
      } catch (err) {
        console.error("Failed to transmit message securely:", err);
      }
    }
  };

  // Add emoji reactions to message bubble
  const handleReactToMessage = (msgId, emoji) => {
    if (activeTab === "channels") {
      setChannelMessages(prev => {
        const list = prev[activeChannelId] || [];
        const updated = list.map(m => {
          if (m.id === msgId) {
            const rx = m.reactions || {};
            return {
              ...m,
              reactions: { ...rx, [emoji]: (rx[emoji] || 0) + 1 }
            };
          }
          return m;
        });
        return { ...prev, [activeChannelId]: updated };
      });
    } else {
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          const rx = m.reactions || {};
          return {
            ...m,
            reactions: { ...rx, [emoji]: (rx[emoji] || 0) + 1 }
          };
        }
        return m;
      }));
    }
    setReactionMsgId(null);
  };

  // Create Channel
  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return;
    const cleanName = newChannelName.trim().toLowerCase().replace(/\s+/g, "-");
    const newChan = {
      id: "chan_" + Date.now(),
      name: cleanName,
      description: newChannelDesc.trim() || "A custom community wellness space.",
      isDefault: false
    };
    setChannels([...channels, newChan]);
    setChannelMessages(prev => ({
      ...prev,
      [newChan.id]: [
        {
          id: "sys_init_" + Date.now(),
          senderId: "system",
          senderName: "System",
          content: `Welcome to the new #${cleanName} channel! Created by ${currentUser.name.split(",")[0]}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSystem: true
        }
      ]
    }));
    setNewChannelName("");
    setNewChannelDesc("");
    setIsNewChannelModalOpen(false);
    setActiveChannelId(newChan.id);
  };

  // Delete Channel
  const handleDeleteChannel = (chanId, e) => {
    e.stopPropagation();
    setChannels(channels.filter(c => c.id !== chanId));
    setChannelMessages(prev => {
      const cpy = { ...prev };
      delete cpy[chanId];
      return cpy;
    });
    if (activeChannelId === chanId) {
      setActiveChannelId("chan_general");
    }
  };

  // Pin / Unpin messages
  const handlePin = (msg) => {
    const roomId = activeTab === "channels" ? activeChannelId : activeThreadId;
    setPinnedMessages(prev => ({
      ...prev,
      [roomId]: msg
    }));
  };

  const handleUnpin = () => {
    const roomId = activeTab === "channels" ? activeChannelId : activeThreadId;
    setPinnedMessages(prev => {
      const cpy = { ...prev };
      delete cpy[roomId];
      return cpy;
    });
  };

  const handleGoToPinned = (msgId) => {
    setHighlightedMsgId(msgId);
    setTimeout(() => {
      setHighlightedMsgId(null);
    }, 2500); // Highlight glows for 2.5 seconds
  };

  const eligibleContacts = allUsers.filter((u) => u.id !== currentUser.id && u.role !== currentUser.role);
  const searchedContacts = eligibleContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filtering Channels & DMs list based on folder tabs (Telegram style)
  const filteredChannelsList = channels.filter(c => {
    const queryMatch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!queryMatch) return false;
    
    if (folderTab === "all") return true;
    if (folderTab === "channels") return true;
    if (folderTab === "unread") return c.id === "chan_wellness"; // mock unread
    return false;
  });

  const filteredDMsList = threads.filter(t => {
    const counterParty = getRecipientProfile(t);
    const queryMatch = counterParty.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!queryMatch) return false;

    if (folderTab === "all") return true;
    if (folderTab === "dms") return true;
    if (folderTab === "unread") return t.id.includes("dr_sarah"); // mock unread
    if (folderTab === "clinical") return counterParty.role === "psychologist";
    return false;
  });

  const activeChannelObj = channels.find(c => c.id === activeChannelId) || channels[0];
  const activeRoomMessages = activeTab === "channels" 
    ? (channelMessages[activeChannelId] || [])
    : messages;

  const currentRoomId = activeTab === "channels" ? activeChannelId : activeThreadId;
  const pinnedMsgForRoom = pinnedMessages[currentRoomId];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" id="messaging-module-view">
      
      {/* Visual Box Breathing Overlay */}
      <AnimatePresence>
        {zenActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 z-[99999] flex flex-col items-center justify-center backdrop-blur-md"
          >
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-glow flex flex-col items-center">
              <div className="flex justify-between items-center w-full border-b border-white/5 pb-2">
                <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Zen breathing coach</span>
                <button onClick={() => setZenActive(false)} className="text-slate-400 hover:text-white transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative w-48 h-48 flex items-center justify-center my-6">
                <motion.div 
                  animate={{
                    scale: zenPhase === "Inhale" ? [1, 1.8] : 
                           zenPhase === "Hold" ? 1.8 : 
                           zenPhase === "Exhale" ? [1.8, 1] : 1
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="absolute inset-0 bg-teal-500/10 rounded-full border border-teal-400/40 shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                />
                
                <div className="w-24 h-24 bg-teal-600 rounded-full flex flex-col items-center justify-center shadow-lg relative z-10">
                  <span className="text-2xl font-bold text-white font-mono">{zenCountdown}s</span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white uppercase tracking-wide">{zenPhase}</h3>
                <p className="text-xs text-slate-400">
                  {zenPhase === "Inhale" && "Draw air in slowly through the nose..."}
                  {zenPhase === "Hold" && "Rest holding the air inside your lungs..."}
                  {zenPhase === "Exhale" && "Exhale smoothly through your mouth..."}
                  {zenPhase === "Hold Empty" && "Rest empty before your next cycle..."}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 w-full flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Cycle: {zenCycleCount} / 2</span>
                <span>Box Method (4-4-4-4)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secure Header Panel */}
      <div className="bg-[#0D0D0F] border border-white/5 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-left">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-widest flex items-center" style={{ fontFamily: "Georgia, serif" }}>
            <Lock className="w-4 h-4 text-indigo-400 mr-2 shrink-0" />
            Secure Collaboration Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Workspace conversations are end-to-end encrypted. Supports WhatsApp voice notes, read ticks, Telegram folders, message pinning, and PyrusBot AI integrations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="flex bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl text-emerald-400 text-[11px] font-bold tracking-wide items-center space-x-1.5 shrink-0">
            <ShieldCheck className="w-4.5 h-4.5" />
            <span>E2EE Active Protocol</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '5px 12px', borderRadius: '10px', fontSize: '11px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: wsState === 'CONNECTED' ? '#10b981' : (wsState === 'RECONNECTING' ? '#f59e0b' : '#ef4444'), boxShadow: wsState === 'CONNECTED' ? '0 0 6px #10b981' : 'none', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-normal)', fontWeight: 'bold' }}>
              WS: <span style={{ color: wsState === 'CONNECTED' ? '#10b981' : (wsState === 'RECONNECTING' ? '#f59e0b' : '#ef4444') }}>{wsState}</span>
              {wsState === 'CONNECTED' && ` (${wsPing}ms)`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Discord/Slack Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 bg-[#0D0D0F] rounded-2xl border border-white/5 overflow-hidden shadow-2xl h-[520px] md:h-[620px]" id="messaging-panel">
        
        {/* Left Workspace Panel: Folders, Channels & DMs list */}
        <div className="md:col-span-4 border-r border-white/5 flex flex-col h-full bg-[#0A0A0C] text-left" id="threads-column">
          
          {/* Telegram Chat Folders (Horizontal Scrolling tabs) */}
          <div className="flex items-center space-x-1 overflow-x-auto p-2 bg-slate-950/60 border-b border-white/5 scrollbar-none shrink-0">
            {[
              { id: "all", label: "All Chats" },
              { id: "unread", label: "Unread" },
              { id: "channels", label: "Channels" },
              { id: "clinical", label: "Clinical" },
              { id: "dms", label: "Patients" }
            ].map(f => (
              <button 
                key={f.id} 
                onClick={() => {
                  setFolderTab(f.id);
                  if (f.id === "channels") {
                    setActiveTab("channels");
                  } else if (f.id === "dms" || f.id === "clinical") {
                    setActiveTab("dms");
                  }
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 transition cursor-pointer ${folderTab === f.id ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tab Selector: Channels vs DMs */}
          <div className="grid grid-cols-2 bg-slate-950 p-1.5 border-b border-white/5 shrink-0">
            <button 
              onClick={() => setActiveTab("channels")} 
              className={`py-2 text-xs uppercase font-bold tracking-wider rounded-xl transition cursor-pointer ${activeTab === "channels" ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
            >
              # Channels
            </button>
            <button 
              onClick={() => setActiveTab("dms")} 
              className={`py-2 text-xs uppercase font-bold tracking-wider rounded-xl transition cursor-pointer ${activeTab === "dms" ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
            >
              💬 Direct Chats
            </button>
          </div>

          {/* Search Contacts */}
          <div className="p-3 border-b border-white/5 bg-[#0D0D0F] shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
              <input 
                id="search-chat-contacts" 
                type="text" 
                placeholder={activeTab === "channels" ? "Search channels..." : "Search direct contacts..."}
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-[#070708] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-202 placeholder-slate-500" 
              />
            </div>
          </div>

          {/* Scrolling Lists */}
          <div className="flex-grow overflow-y-auto p-2.5 space-y-3">
            {activeTab === "channels" ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1.5 mb-1.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono">Group Channels</span>
                  <button 
                    onClick={() => setIsNewChannelModalOpen(true)}
                    className="p-1 hover:bg-white/5 rounded text-indigo-400 hover:text-white transition cursor-pointer"
                    title="Create custom channel"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {filteredChannelsList.map((chan) => {
                    const isActive = activeChannelId === chan.id;
                    const hasUnreadMock = chan.id === "chan_wellness" && folderTab === "unread";
                    return (
                      <div 
                        key={chan.id} 
                        onClick={() => setActiveChannelId(chan.id)}
                        className={`group px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between border relative ${isActive ? "bg-indigo-600/10 border-indigo-500/25 text-indigo-300 shadow-sm" : "hover:bg-white/[0.02] bg-[#0D0D0F]/70 border-white/5"}`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className="text-slate-500 font-mono text-sm group-hover:text-indigo-400 transition">#</span>
                          <span className="text-xs font-bold truncate text-slate-205">{chan.name}</span>
                          {hasUnreadMock && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse ml-1.5" />
                          )}
                        </div>
                        {!chan.isDefault && (
                          <button 
                            onClick={(e) => handleDeleteChannel(chan.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Direct messages column list
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono px-1.5 mb-1 font-sans">Active Secure Chats</span>
                  {filteredDMsList.length === 0 ? (
                    <p className="text-[10px] text-slate-505 italic px-2 py-1">No active conversations found.</p>
                  ) : (
                    filteredDMsList.map((thread) => {
                      const isActive = thread.id === activeThreadId;
                      const counterParty = getRecipientProfile(thread);
                      const showLastMsgText = decryptMessageText(thread.latestMessage, thread.id);
                      const hasUnreadMock = thread.id.includes("dr_sarah") && folderTab === "unread";
                      return (
                        <div 
                          key={thread.id} 
                          id={`thread-item-${counterParty.id}`} 
                          onClick={() => setActiveThreadId(thread.id)} 
                          className={`p-2.5 rounded-xl transition cursor-pointer flex items-center space-x-3 border ${isActive ? "bg-indigo-600/10 border-indigo-500/25 text-indigo-305 shadow-sm" : "hover:bg-white/[0.02] bg-[#0D0D0F]/70 border-white/5"}`}
                        >
                          <div className="relative shrink-0">
                            <img src={counterParty.avatar} alt={counterParty.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-white/5" />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0A0A0C]" />
                          </div>
                          <div className="flex-grow min-w-0 text-left">
                            <div className="flex justify-between items-baseline">
                              <span className="font-extrabold text-[11.5px] text-slate-202 truncate">{counterParty.name.split(",")[0]}</span>
                              <span className="text-[8.5px] text-slate-500 font-medium font-mono shrink-0">{thread.latestMessageTime}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5" title="Local secure stream">{showLastMsgText}</p>
                          </div>
                          {hasUnreadMock && (
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex items-center justify-center text-[7px] text-white font-bold shrink-0 animate-pulse px-1.5 py-1">1</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {folderTab === "all" && (
                  <div className="space-y-1.5">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono px-1.5 mb-1">Explore Care Providers</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {searchedContacts.map((contact) => (
                        <div 
                          key={contact.id} 
                          id={`start-chat-contact-${contact.id}`} 
                          onClick={() => handleStartNewChat(contact)} 
                          className="p-2 bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 rounded-lg flex items-center justify-between cursor-pointer transition"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <img src={contact.avatar} alt={contact.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 shrink-0" />
                            <div className="text-left font-medium text-[11px] truncate text-slate-350">{contact.name}</div>
                          </div>
                          <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/10 text-indigo-305 font-bold px-1.5 py-0.2 rounded uppercase shrink-0">Message</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Chat Chamber */}
        <div className="md:col-span-8 flex flex-col h-full bg-[#0A0A0C] text-left relative" id="chat-feed-column">
          
          {/* Header info */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0D0D0F] shrink-0" id="chat-feed-header">
            {activeTab === "channels" ? (
              <div className="text-left space-y-0.5">
                <h3 className="font-bold text-sm text-slate-202 leading-none flex items-center">
                  <span className="text-slate-500 mr-1.5 font-mono text-base">#</span>
                  {activeChannelObj?.name}
                </h3>
                <p className="text-[10px] text-slate-500 font-sans leading-none">{activeChannelObj?.description}</p>
              </div>
            ) : (
              activeThread && activeCounterUser && (
                <div className="flex items-center space-x-3">
                  <img src={activeCounterUser.avatar} alt={activeCounterUser.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/5 shrink-0" />
                  <div className="text-left space-y-0.5">
                    <h3 className="font-bold text-xs text-slate-202 leading-none">{activeCounterUser.name}</h3>
                    <div className="flex items-center space-x-1.5 font-mono text-[9px] text-slate-400 uppercase">
                      <span className="text-indigo-400 font-bold flex items-center">
                        <Lock className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                        Client E2EE Verified
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}

            <div className="hidden sm:flex items-center space-x-1.5 bg-indigo-500/5 px-2.5 py-1 rounded-xl border border-indigo-500/10 text-[10px] text-indigo-305">
              <Activity className="w-3.5 h-3.5" />
              <span>{activeTab === "channels" ? "Group Active" : "Private DM"}</span>
            </div>
          </div>

          {/* WhatsApp/Telegram-style Pinned Message Banner */}
          {pinnedMsgForRoom && (
            <div className="bg-slate-900/95 border-b border-white/5 px-4 py-2 flex items-center justify-between z-10 shrink-0 text-xs shadow-md backdrop-blur-md">
              <div 
                className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white truncate flex-1"
                onClick={() => handleGoToPinned(pinnedMsgForRoom.id)}
              >
                <Pin className="w-3.5 h-3.5 text-indigo-400 shrink-0 rotate-45" />
                <span className="font-bold text-[10px] text-indigo-400 shrink-0">Pinned Message:</span>
                <span className="truncate">
                  {pinnedMsgForRoom.isVoice ? "🎤 Voice Note" : pinnedMsgForRoom.content}
                </span>
              </div>
              <button 
                onClick={handleUnpin}
                className="text-slate-500 hover:text-white transition cursor-pointer p-1"
                title="Unpin"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Messages Feed View */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3.5 bg-[#070708]" id="active-bubbles-stage">
            <div className="p-3 bg-[#0A0A0C] border border-white/5 rounded-2xl max-w-sm mx-auto text-center text-[10px] text-slate-400 leading-relaxed font-sans flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Rotational cryptographic verification active. Supports Voice Notes and pinning.</span>
            </div>

            {activeRoomMessages.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center pt-8">Establishing channel timelines... Type your message below!</p>
            )}

            {activeRoomMessages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              const isSys = msg.isSystem;
              
              const decryptedText = activeTab === "channels" 
                ? msg.content 
                : (isSys ? msg.content : decryptMessageText(msg.content, activeThreadId));

              // Ticks render logic (WhatsApp style)
              const renderTicks = () => {
                if (!isMine) return null;
                const stat = msg.status || "read";
                if (stat === "sent") {
                  return <Check className="w-3 h-3 text-slate-500 shrink-0" />;
                } else if (stat === "delivered") {
                  return <CheckCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
                } else {
                  return <CheckCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
                }
              };

              // Highlight glowing backdrop
              const isGlowActive = highlightedMsgId === msg.id;

              if (isSys) {
                return (
                  <div key={msg.id} className="flex justify-center my-2 select-text">
                    <div className="bg-slate-900 border border-white/5 px-4 py-2.5 rounded-2xl max-w-md text-xs text-slate-400 leading-relaxed text-left flex items-start space-x-2 shadow-md">
                      <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{decryptedText}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMine ? "justify-end" : "justify-start"} relative group/msg transition-all duration-300 ${isGlowActive ? 'bg-indigo-500/10 scale-[1.01] rounded-2xl p-1.5' : ''}`}
                >
                  <div className="max-w-[75%] space-y-1 relative">
                    <div className="flex items-center space-x-2 text-[9px] text-slate-500 px-1 font-mono justify-between">
                      <span className="font-semibold text-slate-400">{msg.senderName}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-md select-text relative ${isMine ? "bg-indigo-600 text-white rounded-tr-none" : "bg-[#0D0D0F] text-slate-300 rounded-tl-none border border-white/5"}`}>
                      
                      {/* Render Content: Voice vs Text */}
                      {msg.isVoice ? (
                        // WhatsApp style Voice Message player UI
                        <div className="flex items-center space-x-3 py-1 pr-6 min-w-[200px]">
                          <button 
                            onClick={() => handlePlayVoice(msg.id, msg.voiceDuration)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                          >
                            {playingVoiceId === msg.id ? (
                              <Pause className="w-4 h-4 fill-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white translate-x-0.5" />
                            )}
                          </button>
                          
                          {/* Segmented Light-Up Waveform seekbar */}
                          <div className="flex-grow flex items-center space-x-[2px] h-6 cursor-pointer">
                            {Array.from({ length: 18 }).map((_, i) => {
                              const barProgress = (i / 18) * 100;
                              const currentProgress = voiceProgress[msg.id] || 0;
                              const isHighlighted = currentProgress >= barProgress;
                              const barHeight = 8 + (Math.sin(i * 0.8) * 6) + 4; // Mock waveform shapes
                              
                              return (
                                <div 
                                  key={i}
                                  onClick={() => handleSeekVoice(msg.id, barProgress)}
                                  className={`w-[3px] rounded-full transition-colors`}
                                  style={{ 
                                    height: `${barHeight}px`,
                                    backgroundColor: isHighlighted ? "var(--color-primary, #14b8a6)" : "rgba(255,255,255,0.15)"
                                  }}
                                />
                              );
                            })}
                          </div>

                          <span className="text-[10px] font-mono shrink-0 font-bold opacity-80">
                            {voiceProgress[msg.id] >= 100 ? "0:00" : `0:${String(Math.ceil((msg.voiceDuration || 5) * (1 - (voiceProgress[msg.id] || 0)/100))).padStart(2, '0')}`}
                          </span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line text-left">{decryptedText}</p>
                      )}

                      {/* Reactions & Pin trigger */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center space-x-1.5 bg-slate-950/80 rounded px-1 py-0.5 backdrop-blur-sm shadow border border-white/5">
                        <button 
                          onClick={() => setReactionMsgId(reactionMsgId === msg.id ? null : msg.id)}
                          className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition cursor-pointer"
                          title="Add reaction"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handlePin(msg)}
                          className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition cursor-pointer"
                          title="Pin message"
                        >
                          <Pin className="w-3.5 h-3.5 rotate-45" />
                        </button>
                      </div>

                      {/* Floating Reactions selector */}
                      <AnimatePresence>
                        {reactionMsgId === msg.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute z-[100] right-0 bottom-8 bg-slate-900 border border-white/10 rounded-full px-2 py-1 flex items-center space-x-2 shadow-2xl"
                          >
                            {["👍", "❤️", "🧘", "💡", "😮"].map(emoji => (
                              <button 
                                key={emoji} 
                                onClick={() => handleReactToMessage(msg.id, emoji)}
                                className="text-sm hover:scale-130 transition cursor-pointer select-none"
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Bottom Reactions & Status Indicators */}
                    <div className="flex items-center space-x-2 justify-end mt-0.5">
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(msg.reactions).map(emoji => {
                            const count = msg.reactions[emoji];
                            if (count === 0) return null;
                            return (
                              <span key={emoji} className="bg-slate-800 border border-white/5 rounded-full px-2 py-0.5 text-[9px] text-slate-300 font-mono font-bold">
                                {emoji} {count}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {renderTicks()}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* PyrusBot Typing Indicator */}
            {isBotTyping && (
              <div className="flex justify-start">
                <div className="max-w-[70%] space-y-1">
                  <span className="text-[9px] text-slate-505 px-1 font-mono">PyrusBot</span>
                  <div className="bg-[#0D0D0F] border border-white/5 text-slate-400 p-3 rounded-2xl rounded-tl-none flex items-center space-x-2 shadow-md">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">PyrusBot is formulating clinical response...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Consol panel */}
          <div className="p-4 border-t border-white/5 bg-[#0D0D0F] shrink-0" id="chat-send-console">
            
            {isRecordingVoice ? (
              // WhatsApp style active voice recorder UI
              <div className="flex items-center justify-between bg-[#070708] border border-red-500/25 rounded-2xl px-4 py-2.5 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="font-bold text-red-400 font-mono">REC: 0:{String(voiceRecordSeconds).padStart(2, '0')}</span>
                  <span className="text-slate-500">| Waveform simulation primed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => stopVoiceRecording(false)}
                    className="p-2 bg-white/5 hover:bg-red-550/10 rounded-xl text-slate-400 hover:text-red-400 transition cursor-pointer"
                    title="Discard recording"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => stopVoiceRecording(true)}
                    className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-505 text-white rounded-xl transition cursor-pointer flex items-center space-x-1.5 font-bold shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Audio</span>
                  </button>
                </div>
              </div>
            ) : (
              // Standard message input console
              <div className="flex space-x-2">
                <button 
                  onClick={startVoiceRecording}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-450 hover:text-white transition shrink-0 cursor-pointer flex items-center justify-center border border-white/5"
                  title="Record Voice Note"
                >
                  <Mic className="w-4.5 h-4.5" />
                </button>

                <input 
                  id="chat-chamber-input-text" 
                  type="text" 
                  placeholder={activeTab === "channels" ? `Message #${activeChannelObj?.name}... (Try /zen, /coping, or /help)` : `Send E2EE chat...`} 
                  value={newMsgText} 
                  onChange={(e) => setNewMsgText(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }} 
                  className="flex-1 bg-[#070708] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-202 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
                
                <button 
                  id="send-chat-chamber-btn" 
                  onClick={handleSendMessage} 
                  disabled={!newMsgText.trim()} 
                  className="p-3 bg-indigo-600 disabled:opacity-50 text-white hover:bg-indigo-500 transition rounded-xl shrink-0 cursor-pointer flex items-center justify-center shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dynamic Channel Modal */}
      {isNewChannelModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 flex items-center justify-center backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-5 shadow-2xl text-left space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Create Custom Channel</h3>
              <button onClick={() => setIsNewChannelModalOpen(false)} className="text-slate-400 hover:text-white transition cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Channel Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. mindfulness-meditation" 
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-202 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-500" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Description (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Focus on physical deep-grounding check-ins." 
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-202 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-500" 
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button 
                onClick={() => setIsNewChannelModalOpen(false)} 
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-350 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
