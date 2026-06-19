
function getFallbackDiagnostics(patient) {
  if (patient.id === 7 || patient.name.includes("Elena")) {
    return {
      diagnoses: [
        {
          code: "F32.1",
          name: "Major Depressive Disorder, single episode, moderate",
          confidence: 85,
          matchingCriteria: [
            "Depressed mood most of day",
            "Marked anhedonia (4 months)",
            "Insomnia (gets ~3-4 hours of broken sleep)",
            "Feelings of worthlessness and guilt",
            "Weight loss of 6 lbs"
          ],
          evidenceSummary: "Client meets 5 of 9 DSM-5-TR criteria for MDD (Depressed mood, anhedonia, insomnia, fatigue, guilt/worthlessness) persisting for over 2 weeks with significant occupational distress.",
          differentialRankings: ["F41.1 Generalized Anxiety Disorder", "F31.3 Bipolar II Disorder"]
        }
      ],
      riskFlag: "MODERATE",
      riskExplanation: "Passive suicidal ideation expressed ('wish I could sleep and not wake up'), denies plans or immediate intent. Safety contract active."
    };
  } else if (patient.id === 8 || patient.name.includes("Lucas")) {
    return {
      diagnoses: [
        {
          code: "F31.32",
          name: "Bipolar II Disorder, current episode depressed, moderate",
          confidence: 78,
          matchingCriteria: [
            "History of hypomanic episodes (sleeping 2 hours while feeling hyper-charged)",
            "Current depressive phase (lethargy, oversleeping 11+ hours)",
            "Impulsive behavior (spending $1200 on stock options)"
          ],
          evidenceSummary: "Patient describes distinct hypomanic episodes followed by a depressive crash, consistent with Bipolar II. Primary family history of Bipolar I in father adds diagnostic weight.",
          differentialRankings: ["F90.0 ADHD, Combined Presentation", "F31.1 Bipolar I Disorder"]
        }
      ],
      riskFlag: "LOW",
      riskExplanation: "Denies active or passive self-harm or suicidal ideation during current depressive phase. Agrees to mood monitoring."
    };
  } else {
    return {
      diagnoses: [
        {
          code: "F41.0",
          name: "Panic Disorder",
          confidence: 90,
          matchingCriteria: [
            "Recurrent spontaneous panic attacks (2-3 times per week)",
            "Somatic hyper-arousal (chest tightness, palpitations, hyperventilation)",
            "Agoraphobic avoidance of school drop-offs and traffic"
          ],
          evidenceSummary: "Frequent spontaneous panic episodes accompanied by agoraphobic avoidance and anticipatory anxiety regarding vocational impact.",
          differentialRankings: ["F40.1 Social Anxiety Disorder", "F41.1 Generalized Anxiety Disorder"]
        }
      ],
      riskFlag: "LOW",
      riskExplanation: "No suicidal ideation or self-harm indicators present. Strong family and school community support systems act  factors."
    };
  }
}


const initialGenogramNodes = [
  { id: "g1", name: "Elena Rostova", relation: "Self", gender: "F", age: 34, conditions: ["Major Depres. (Single Ep.)", "Hypothyroidism"], x: 300, y: 250 },
  { id: "g2", name: "Mikhail Rostov", relation: "Spouse", gender: "M", age: 36, conditions: ["None"], x: 500, y: 250 },
  { id: "g3", name: "Anna Rostova", relation: "Mother", gender: "F", age: 62, conditions: ["Generalized Anxiety"], x: 200, y: 100 },
  { id: "g4", name: "Victor Rostov", relation: "Father", gender: "M", age: 65, conditions: ["None"], x: 400, y: 100 },
  { id: "g5", name: "Sofia Ivanova", relation: "Maternal Grandmother", gender: "F", age: 84, conditions: ["Recurrent Major Depression"], x: 150, y: -20 },
  { id: "g6", name: "Dmitry Rostov", relation: "Paternal Uncle", gender: "M", age: 58, conditions: ["Alcohol Abuse"], x: 550, y: 100 },
];

const initialGenogramLinks = [
  { from: "g1", to: "g2", type: "married" },
  { from: "g3", to: "g4", type: "married" },
  { from: "g3", to: "g1", type: "parent-child" },
  { from: "g4", to: "g1", type: "parent-child" },
  { from: "g5", to: "g3", type: "parent-child" },
  { from: "g4", to: "g6", type: "sibling" }
];

import React, { useState, useEffect, useRef } from "react";


import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const clinicalRiskHistoryMap = {
  7: [
    { date: "May 15", suicide: 1, violence: 1, selfHarm: 1, label: "Initial Intake" },
    { date: "May 29", suicide: 2, violence: 1, selfHarm: 1, label: "Follow Up 1" },
    { date: "June 05", suicide: 2, violence: 1, selfHarm: 1, label: "Follow Up 2" },
    { date: "June 14", suicide: 2, violence: 1, selfHarm: 1, label: "Current Session" }
  ],
  8: [
    { date: "May 10", suicide: 2, violence: 1, selfHarm: 2, label: "Referral" },
    { date: "May 25", suicide: 3, violence: 2, selfHarm: 3, label: "Crisis Intervention" },
    { date: "June 01", suicide: 3, violence: 1, selfHarm: 2, label: "Post-Stabilization" },
    { date: "June 14", suicide: 2, violence: 1, selfHarm: 1, label: "Current Session" }
  ],
  9: [
    { date: "May 01", suicide: 1, violence: 1, selfHarm: 1, label: "Baseline" },
    { date: "May 15", suicide: 1, violence: 1, selfHarm: 1, label: "Monthly Check" },
    { date: "June 02", suicide: 1, violence: 1, selfHarm: 1, label: "Regular Follow-up" },
    { date: "June 14", suicide: 1, violence: 1, selfHarm: 1, label: "Current Session" }
  ]
};

const formatRiskYAxis = (value) => {
  switch (value) {
    case 1: return "Low";
    case 2: return "Mod";
    case 3: return "High";
    case 4: return "Crit";
    default: return "";
  }
};

const recentClinicalNotesByTimestamp = {
  7: [
    { date: "June 14, 2026", riskLevel: "HIGH", text: "Patient reports elevated job stress and moderate self-harm urges. Initiated medication adjustments and tight follow-ups.", location: "Intake Assessment Note" },
    { date: "June 05, 2026", riskLevel: "HIGH", text: "Suicidality assessment indicates coping mechanisms are strained. Active intervention contract signed.", location: "MSE Note Snapshot" },
    { date: "May 29, 2026", riskLevel: "HIGH", text: "Moderate depressive symptoms persist; sleep pattern is severely fragmented with somatic complaints.", location: "SOAP Progress Note" },
    { date: "May 15, 2026", riskLevel: "LOW", text: "Patient presented with mild low mood. Standard evaluation. Denies self-harm behavior or suicidal intent.", location: "Initial Intake Note" }
  ],
  8: [
    { date: "June 14, 2026", riskLevel: "HIGH", text: "Patient reports down-regulation of manic triggers. Impulsive spending and rapid speech moderately reduced.", location: "Clinical Review" },
    { date: "June 01, 2026", riskLevel: "HIGH", text: "Bipolar hypomania is being managed. Violence risk is under supervision, self-harm risk is stable.", location: "Weekly Diagnostic Assessment" },
    { date: "May 25, 2026", riskLevel: "CRITICAL", text: "EMERGENCY: Patient expressed active self-harm desire paired with lethal intent. Deployed emergency high-contrast triage protocols and updated safety networks.", location: "Crisis Intervention Incident SOAP Note" },
    { date: "May 10, 2026", riskLevel: "HIGH", text: "Initial referral documents significant self-harm intent with severe agitation.", location: "Outpatient Admittance Intake" }
  ],
  9: [
    { date: "June 14, 2026", riskLevel: "LOW", text: "Denies all active or passive suicidal/violence ideations. Resilient cognitive restructuring progress.", location: "Regular Follow Up SOAP Note" },
    { date: "June 02, 2026", riskLevel: "LOW", text: "Consistent symptom maintenance. Denies depressive/anxiety relapse cues.", location: "Routine Progress Note" },
    { date: "May 15, 2026", riskLevel: "LOW", text: "Patient feeling healthy. Productive therapeutic alignment.", location: "Routine Telehealth Note" },
    { date: "May 01, 2026", riskLevel: "LOW", text: "Completed standard onboarding assessment. No risk factors observed.", location: "Standard Onboarding Note" }
  ]
};

import IntakeMseSoapModule from "../IntakeMseSoapModule";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { Database } from "../../services/db";
import { GeminiService } from "../../services/ai";
import {
  User,
  Activity,
  Award,
  Heart,
  Video,
  Database as DatabaseIcon,
  Brain,
  TrendingUp,
  Sliders,
  Users,
  Compass,
  ChevronRight,
  Shield,
  FileDown,
  AlertTriangle,
  FolderLock,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Search,
  Check,
  Send,
  Sparkles,
  Info,
  Calendar,
  Lock,
  Download,
  AlertCircle,
  Bell,
  Clock,
  Cpu,
  BookOpen,
  Smartphone,
  Globe,
  Layers,
  Shuffle
} from "lucide-react";

const UserRole = {
  PROFESSIONAL: "Professional",
  PATIENT: "Patient",
  PSYCHIATRIST: "Psychiatrist",
  PSYCHOLOGIST: "Psychologist",
  ADMINISTRATOR: "Administrator"
};

export default function ClinicalWorkspace({
  activePatientId: propActivePatientId,
  onSetActivePatientId
} = {}) {
  // Current logged in medical practitioner state
  const [currentRole, setCurrentRole] = useState("Psychiatrist");
  const [practitionerName, setPractitionerName] = useState("Dr. Arishta Singh");

  // Patients database
  const [patients, setPatients] = useState([]);
  const [activePatientId, setActivePatientId] = useState(propActivePatientId || 7);
  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];

  // Sync active patient from prop
  useEffect(() => {
    if (propActivePatientId && propActivePatientId !== activePatientId) {
      setActivePatientId(propActivePatientId);
    }
  }, [propActivePatientId]);

  // Load patients from global Database
  useEffect(() => {
    setPatients(Database.getPatients());
  }, []);

  // Active module subsection
  const [activeTab, setActiveTab] = useState("ehr");

  // --- PsyPyrus Psychiatric OS Core States ---
  // Measurement-Based Care (PHQ-9 & GAD-7) Tracking History
  const [mbcHistory, setMbcHistory] = useState({
    7: [
      { date: "Jan 2026", phq9: 18, gad7: 15, outcomeSignal: "Severe symptoms, unmanaged" },
      { date: "Feb 2026", phq9: 13, gad7: 11, outcomeSignal: "Partial clinical response" },
      { date: "Mar 2026", phq9: 7, gad7: 6, outcomeSignal: "Remission achieved (61% PHQ reduction)" }
    ],
    8: [
      { date: "Mar 2026", phq9: 22, gad7: 19, outcomeSignal: "Critical escalation" },
      { date: "Apr 2026", phq9: 12, gad7: 10, outcomeSignal: "Significant response post-ketamine" },
      { date: "May 2026", phq9: 8, gad7: 7, outcomeSignal: "Stable moderate-low state" }
    ],
    9: [
      { date: "Apr 2026", phq9: 14, gad7: 12, outcomeSignal: "Moderate severity" },
      { date: "May 2026", phq9: 11, gad7: 9, outcomeSignal: "Mild therapeutic drift" },
      { date: "Jun 2026", phq9: 9, gad7: 6, outcomeSignal: "Close monitoring stable" }
    ]
  });

  // Ecological Momentary Assessments (EMA Loop)
  const [emaEntries, setEmaEntries] = useState([
    { timestamp: "08:30 AM", patientId: "7", mood: 6, anxiety: 3, sleep: 7, stress: 4, loggedVia: "Companion App" },
    { timestamp: "02:15 PM", patientId: "7", mood: 7, anxiety: 2, sleep: 7, stress: 3, loggedVia: "Companion App" },
    { timestamp: "09:00 PM", patientId: "7", mood: 5, anxiety: 4, sleep: 6, stress: 5, loggedVia: "Wearable Watch" },
    { timestamp: "09:12 AM", patientId: "8", mood: 3, anxiety: 8, sleep: 4, stress: 8, loggedVia: "Companion App" }
  ]);

  // Current Patient EMA Questionnaire form state
  const [currentEmaForm, setCurrentEmaForm] = useState({ mood: 6, anxiety: 4, sleep: 7, stress: 4 });

  // Passive Wearable Integration Stream Configuration
  const [wearableStreams, setWearableStreams] = useState({
    7: { sleep: 7.2, steps: 8400, screenTime: 180, typingSpeed: 145, mobility: 82, hrv: 48 },
    8: { sleep: 4.5, steps: 3200, screenTime: 390, typingSpeed: 95, mobility: 40, hrv: 22 },
    9: { sleep: 6.8, steps: 6100, screenTime: 240, typingSpeed: 120, mobility: 68, hrv: 35 }
  });

  // Psychotherapy Workspace state (homework, CBT thought record)
  const [cbtHomework, setCbtHomework] = useState([
    {
      date: "2026-06-12",
      patientId: "7",
      situation: "My research experiment hypothesis w during the lab meeting yesterday.",
      autoThought: "I'm a complete failure  scientist. I'll never publish this paper and everyone knows I'm incompetent.",
      cognitiveDistortion: "All-or-Nothing Thinking & Catastrophizing",
      rationalResponse: "Rejection of a single hypothesis is the normal course of science. My supervisor praised my methodology, and I have five other solid avenues to explore.",
      outcomeRating: 35
    }
  ]);

  // CBT Form Input State
  const [newCbtForm, setNewCbtForm] = useState({
    situation: "",
    autoThought: "",
    cognitiveDistortion: "Catastrophizing",
    rationalResponse: "",
    outcomeRating: 50
  });

  // Multi-Agent System Logs
  const [agentLogs, setAgentLogs] = useState([
    { time: "23:00:15", agent: "Diagnostic Agent", action: "Parsed EMA logs. Correlated low Sleep with spike in generalized anxiety score.", color: "text-blue-600 font-bold" },
    { time: "23:01:02", agent: "Risk Safeguard Agent", action: "Monitored Active Triage Threshold status. Alert level quiet.", color: "text-red-600 font-bold" },
    { time: "23:02:44", agent: "Pharmacology Agent", action: "Checked Sertraline compliance markers. 95% adherence matches digital signature.", color: "text-emerald-600 font-bold" },
    { time: "23:04:10", agent: "Therapy Companion Agent", action: "Indexed new CBT homework entry regarding research failure.", color: "text-violet-600 font-bold" },
    { time: "23:05:00", agent: "Clinical Trial Matcher", action: "Queried ClinicalTrials.gov for 'Refractory MDD Phase-II Biomarkers'. 2 prospective regional cohorts found.", color: "text-amber-600 font-bold" }
  ]);

  // Educational Mode Quiz states
  const [quizScore, setQuizScore] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizStatus, setQuizStatus] = useState("unanswered");
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);

  // Recovery-Oriented Care Goal state
  const [recoveryGoals, setRecoveryGoals] = useState({
    7: [
      { id: "g1", text: "Resume active biomedical lab research at 100% capacity", category: "Career", completed: false },
      { id: "g2", text: "Maintain a stable 7-8 hour sleep schedule daily", category: "Health", completed: true },
      { id: "g3", text: "Attend weekly community research forums without intense panic", category: "Leisure", completed: false }
    ],
    8: [
      { id: "g4", text: "Design a consistent daily physical exercise schedule", category: "Health", completed: false },
      { id: "g5", text: "Initiate dialogue with close family members without aggressive trigger episodes", category: "Relationships", completed: true }
    ],
    9: [
      { id: "g6", text: "Read two non-technical books monthly to reduce work stress", category: "Leisure", completed: false },
      { id: "g7", text: "Keep sodium intake within healthy bounds to stabilize blood pressure", category: "Health", completed: true }
    ]
  });

  const [newGoalInput, setNewGoalInput] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("Health");

  // Federated learning status
  const [fedStatus, setFedStatus] = useState("Ready");

  // Synthetic patient database
  const [syntheticDatabase, setSyntheticDatabase] = useState([
    {
      id: "SYN-8492",
      name: "Arthur Pendelton (Synthetic #1)",
      age: 41,
      primaryIndication: "Bipolar I Disorder, Severe Manic with Psychotic Features",
      history: "Admitted following a 5-day sleepless episode with grandiose spending spree and hyperverbal speech.",
      riskProfile: "High financial harm risk, moderate suicidal vulnerability upon depressive transition."
    },
    {
      id: "SYN-3011",
      name: "Serena Patel (Synthetic #2)",
      age: 27,
      primaryIndication: "Severe Obsessive-Compulsive Disorder",
      history: "Presents with repetitive washing rituals (4-6 hours daily) leading to severe hand lesions.",
      riskProfile: "Minimal active risk, profound level of functional impairment."
    }
  ]);
  const [generatingSynthetic, setGeneratingSynthetic] = useState(false);

  // Active guideline engine view selector
  const [guidelineFilter, setGuidelineFilter] = useState("APA");

  // Social Determinants of Health module (SDOH)
  const [sdohRatings, setSdohRatings] = useState({
    7: { housing: 9, income: 8, education: 10, socialSupport: 6, employment: 8 },
    8: { housing: 4, income: 3, education: 7, socialSupport: 2, employment: 2 },
    9: { housing: 8, income: 7, education: 9, socialSupport: 8, employment: 8 }
  });

  // Explainable AI (XAI) active confidence settings
  const [xaiConfidence, setXaiConfidence] = useState({
    "Major Depression": {
      confidence: 82,
      factors: ["Mood depressed most of day", "Insomnia/severe sleep deficit", "Anhedonia reported >2 weeks", "Work stress/impairment"]
    },
    "Bipolar Spectrum": {
      confidence: 35,
      factors: ["No sustained manic/hypomanic episodes documented", "Family history uncle substance, grandmother depression", "Sleep deficit but high distress"]
    },
    "Generalized Anxiety": {
      confidence: 74,
      factors: ["Worrying uncontrollably about biomedical lab results", "Tremor or autonomic tension report", "Symptom persistence > 6 months"]
    }
  });

  // Clinical Crisis Protocol simulation status
  const [crisisDispatchStatus, setCrisisDispatchStatus] = useState("Armed");

  // Active patient notes scratchpads (lifted up for autosave & hotkeys)
  const [rawIntake, setRawIntake] = useState("");
  const [rawMse, setRawMse] = useState("");
  const [rawSoap, setRawSoap] = useState("");
  const [sessionSummary, setSessionSummary] = useState("");

  // Autosave and Keyboard Shorty configurations
  const [autosave, setAutosave] = useState(true);
  const [lastSaveStatus, setLastSaveStatus] = useState("idle");
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  useEffect(() => {
    if (activePatient) {
      setRawIntake(activePatient.rawIntakeBullets || "");
      setRawMse(activePatient.rawMseBullets || "");
      setRawSoap(activePatient.rawSoapBullets || "");
      setSessionSummary(activePatient.sessionSummary || "");
    }
  }, [activePatientId]);

  // CDSS AI Suggestion States
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiDiagnosticSuggestion, setAiDiagnosticSuggestion] = useState(null);

  // Medication Alert Form States
  const [alertConfigOpenIndex, setAlertConfigOpenIndex] = useState(null);
  const [newAlertForm, setNewAlertForm] = useState({
    frequency: "Daily",
    time: "08:00 AM",
    channel: "SMS",
    instructions: "Take with food"
  });

  // Clinical Triage Threshold & Note Popup States
  const [isThresholdConfigOpen, setIsThresholdConfigOpen] = useState(false);
  const [isAlertOnCritical, setIsAlertOnCritical] = useState(true);
  const [customCriticalThresholdValue, setCustomCriticalThresholdValue] = useState("CRITICAL");
  const [selectedNotesTimestamp, setSelectedNotesTimestamp] = useState(null);

  // AI Copilot States
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const [copilotHistory, setCopilotHistory] = useState([
    {
      sender: "ai",
      text: "Hello I am your biological and psychological CDSS copilot. I am ready to cross-reference DSM-5-TR criteria, ICD coding systems, HiTOP, and RDoC matrices based on your current active patient."
    }
  ]);
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  // Psychometrics custom rating scale input
  const [phq9Answers, setPhq9Answers] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const phq9Questions = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself — or that you are a failure",
    "Trouble concentrating on things, such  or working",
    "Moving or speaking so slowly that other people could have noticed",
    "Thoughts that you would be better off dead, or of hurting yourself"
  ];

  const isTriageAlarmActive = isAlertOnCritical && activePatient && activePatient.riskAssessment && (
    activePatient.riskAssessment.level === "CRITICAL" ||
    (customCriticalThresholdValue === "HIGH" && activePatient.riskAssessment.level === "HIGH")
  );

  const handleOpenRiskNotesPopup = () => {
    const patientNotes = recentClinicalNotesByTimestamp[activePatient.id] || [];
    const currentRisk = activePatient.riskAssessment.level;
    const matchedNote = patientNotes.find((item) => item.riskLevel === currentRisk) || patientNotes[0];
    if (matchedNote) {
      setSelectedNotesTimestamp(matchedNote);
      addAuditLog(`Clinician verified active risk level (${currentRisk}) timestamp clinical notes for ${activePatient.name}`);
    }
  };

  // Genogram Builder States
  const [genogramNodes, setGenogramNodes] = useState(initialGenogramNodes);
  const [genogramLinks, setGenogramLinks] = useState(initialGenogramLinks);
  const [selectedGenNode, setSelectedGenNode] = useState(null);
  
  // Dragging states for Genogram
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const genogramSvgRef = useRef(null);

  // Form states to add family node
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeRelation, setNewNodeRelation] = useState("Sibling");
  const [newNodeGender, setNewNodeGender] = useState("M");
  const [newNodeAge, setNewNodeAge] = useState("");
  const [newNodeConditions, setNewNodeConditions] = useState("");

  // Form states to add relation link
  const [linkFrom, setLinkFrom] = useState("");
  const [linkTo, setLinkTo] = useState("");
  const [linkType, setLinkType] = useState("parent-child");

  // Telehealth video/chat states
  const [teleSessionActive, setTeleSessionActive] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const [teleMessages, setTeleMessages] = useState([
    { sender: "System", text: "Secure FHIR-compliant Telepsychiatry pipeline ready.", time: "10:00 PM" }
  ]);
  const [newTeleMsg, setNewTeleMsg] = useState("");
  const [cameraError, setCameraError] = useState(null);

  // Knowledge Graph states
  const [hoveredKgNode, setHoveredKgNode] = useState(null);
  const [selectedKgNode, setSelectedKgNode] = useState(null);

  // Access control logs
  const [auditLogs, setAuditLogs] = useState([
    { timestamp: "22:01:10", action: "EHR Session Initialized", user: "Dr. Arishta Singh", role: "Psychiatrist" }
  ]);

  // Log function
  const addAuditLog = (action) => {
    const time = new Date().toLocaleTimeString();
    setAuditLogs((prev) => [
      { timestamp: time, action, user: practitionerName, role: currentRole },
      ...prev.slice(0, 19)
    ]);
  };

  // Synchronize internal state on active patient change
  useEffect(() => {
    setPhq9Answers([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setAiDiagnosticSuggestion(null);
  }, [activePatientId]);

  // Telehealth camera activation
  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      addAuditLog("Telehealth webcam feed activated");
    } catch (err) {
      console.warn("Camera frame access not possible:", err);
      setCameraError("Webcam preview denied or unavailable (running in secure iframe). Simulated stream loaded.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (teleSessionActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [teleSessionActive]);

  // Ask AI Copilot Q&A handler
  const askCopilot = async () => {
    if (copilotQuestion.trim()) return;
    const userQuery = copilotQuestion;
    setCopilotHistory((prev) => [...prev, { sender: "user", text: userQuery }]);
    setCopilotQuestion("");
    setIsCopilotTyping(true);

    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "copilot_qa",
          payload: {
            question: userQuery,
            patientContext: `Name: ${activePatient.name}, Age: ${activePatient.age}, Gender: ${activePatient.gender}, Diagnosis/History: ${activePatient.psychiatricHistory.join(", ")}, Risks: ${activePatient.riskAssessment.level}`
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setCopilotHistory((prev) => [...prev, { sender: "ai", text: data.text }]);
        addAuditLog(`Copilot Q&A: Resolved queries matching ${activePatientName()}`);
      } else {
        setCopilotHistory((prev) => [
          ...prev,
          { sender: "ai", text: `Error: ${data.error || "Failed to parse copilot insights."}` }
        ]);
      }
    } catch (e) {
      setCopilotHistory((prev) => [
        ...prev,
        { sender: "ai", text: `Unable to access AI bridge at this time. (${e.message})` }
      ]);
    } finally {
      setIsCopilotTyping(false);
    }
  };

  // Suggest Diagnoses with AI CDSS Diagnostic Engine
  const suggestDiagnosesWithAi = async () => {
    setIsSuggesting(true);
    addAuditLog("Initiating CDSS AI Differential Diagnosis and Diagnostic Hypothesis Engine");
    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suggest_diagnoses",
          payload: {
            symptoms: activePatient.rawIntakeBullets || "No presenting symptoms documented.",
            medicalHistory: `Somatic Conditions: ${activePatient.medicalHistory?.join(", ") || "None documented"}; Psychiatric History: ${activePatient.psychiatricHistory?.join(", ") || "None documented"}; Family History: ${activePatient.familyHistory?.join(", ") || "None documented"}`,
            mseFindings: activePatient.rawMseBullets || "No formal Mental Status Examination findings recorded.",
            duration: "Moderate to high duration, fluctuating between hyper-arousal and deep clinical crashes.",
            impairment: "Marked vocational disruption, social isolation, and extreme circadian cycle fragmentation."
          }
        })
      });
      const result = await res.json();
      if (result.success) {
        setAiDiagnosticSuggestion(result.data);
        addAuditLog("CDSS Diagnostic Hypothesis generated successfully");
      } else {
        alert(result.error || "Failed to generate diagnostic hypothesis.");
      }
    } catch (e) {
      alert("Error contacting CDSS diagnostics layer: " + e.message);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Save current active clinician notes
  const handleSaveActiveNotes = (isAutosave = false) => {
    if (isAutosave) {
      setLastSaveStatus("saving");
      setTimeout(() => setLastSaveStatus("success"), 1000);
    }
    const updated = {
      ...activePatient,
      rawIntakeBullets: rawIntake,
      rawMseBullets: rawMse,
      rawSoapBullets: rawSoap,
      sessionSummary: sessionSummary
    };
    Database.updatePatient(updated.id, updated);
    setPatients(Database.getPatients());
    addAuditLog(isAutosave ? `Background autosave finalized for ${activePatient.name}'s notes` : `Manual clinic note snapshot saved for ${activePatient.name}`);
    if (isAutosave) {
      alert(`Manual Save Successful All currently edited psychiatric intake, MSE findings, SOAP logs, and session summaries are committed to PID-${activePatient.id}.`);
    }
  };

  // Adherence notification simulation banner state
  const [simulationToast, setSimulationToast] = useState(null);

  // Manage frequency-based alerts for patient pharmacology
  const handleModifyMedAlert = (medIndex, action, alertData) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== activePatient.id) return p;
        const currentMeds = p.currentMedications.map((m, idx) => {
          if (idx == medIndex) return m;
          const alertsList = [...(m.alerts || [])];
          if (action === "add" && alertData) {
            alertsList.push({
              id: `alert-${Date.now()}`,
              frequency: alertData.frequency,
              time: alertData.time || "08:00 AM",
              channel: alertData.channel,
              instructions: alertData.instructions || "Take with food",
              isActive: true
            });
          } else if (action === "delete") {
            alertsList.splice(alertData.alertIndex, 1);
          } else if (action === "toggle") {
            alertsList[alertData.alertIndex] = {
              ...alertsList[alertData.alertIndex],
              isActive: alertsList[alertData.alertIndex].isActive
            };
          }
          return { ...m, alerts: alertsList };
        });
        return { ...p, currentMedications: currentMeds };
      })
    );
    addAuditLog(`Clinician altered medication alert triggers for ${activePatient.name}`);
  };

  const handleSimulateAlert = (medName, alert) => {
    const channelEmoji = alert.channel === "SMS" ? "📱 [SMS]" : alert.channel === "Email" ? "📧 [Email]" : alert.channel === "Push Notification" ? "📲 [Push]" : "🔔 [In-App]";
    const msg = `${channelEmoji} Reminder dispatched to ${activePatient.name} for ${medName}: "Take ${medName} (${alert.frequency} at ${alert.time}) - Instructions: ${alert.instructions}"`;
    setSimulationToast({ message: msg, visible: true });
    addAuditLog(`Adherence alert simulation triggered: ${medName} reminder.`);
    setTimeout(() => {
      setSimulationToast(null);
    }, 6000);
  };

  // Run the 30-second autosave loop
  useEffect(() => {
    if (autosave) return;
    const interval = setInterval(() => {
      handleSaveActiveNotes(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [autosave, rawIntake, rawMse, rawSoap, sessionSummary, activePatientId]);

  // Combined keyboard shortcuts and workspace cycler listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + S (or Cmd + S) -> Save current progress
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveActiveNotes(false);
      }
      // Ctrl + P (or Cmd + P) -> Focus client selector dropdown
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        const selectorEl = document.getElementById("patient-selector");
        if (selectorEl) {
          selectorEl.focus();
        }
      }
      // Alt + Q or Ctrl + Tab (where permitted) -> Switch/rotate clinical workspaces
      if ((e.altKey && e.key.toLowerCase() === "q") || ((e.ctrlKey || e.metaKey) && e.key === "Tab")) {
        e.preventDefault();
        const tabs = [
          "ehr",
          "diagnostics",
          "mapping",
          "therapeutics",
          "telehealth",
          "psyos"
        ];
        const nextIdx = (tabs.indexOf(activeTab ) + 1) % tabs.length;
        setActiveTab(tabs[nextIdx]);
        addAuditLog(`Keyboard transition: Cycled workspace tab to ${tabs[nextIdx].toUpperCase()}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, rawIntake, rawMse, rawSoap, sessionSummary, activePatientId]);

  if (!activePatient) {
    return (
      <div className="flex h-screen w-screen bg-slate-950 text-white font-sans items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold tracking-wider animate-pulse text-teal-400">Loading Clinical CORE Workspace...</span>
        </div>
      </div>
    );
  }

  // Formatted PDF Document Exporter using jsPDF with comprehensive clinical history & CDSS diagnosis
  const handleExportPdf = () => {
    try {
      addAuditLog(`Starting Clinical PDF Document compiler for PID-${activePatient.id}`);
      const doc = new jsPDF();
      
      // Page styling and main title design
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("PsyPyrus Clinical Core Summary", 20, 24);
      
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`DocuSync ID: PID-${activePatient.id} | Generated: ${new Date().toLocaleString()}`, 20, 31);
      
      // Divider Line
      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(20, 35, 190, 35);
      
      // 1. Demographics Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text("1. Demographics & Clinical Metrics", 20, 45);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Patient Name: ${activePatient.name}`, 24, 52);
      doc.text(`Age & Gender: ${activePatient.age} yrs / ${activePatient.gender}`, 24, 58);
      doc.text(`Date of Birth: ${activePatient.demographics?.dob || "N/A"}`, 24, 64);
      doc.text(`Occupation: ${activePatient.demographics?.occupation || "N/A"}`, 110, 52);
      doc.text(`Contact: ${activePatient.demographics?.contact || "N/A"}`, 110, 58);
      doc.text(`Insurance: ${activePatient.demographics?.insurance || "N/A"}`, 110, 64);
      
      // Risk evaluation high visibility block
      doc.setFont("helvetica", "bold");
      const riskColor = activePatient.riskAssessment?.level === "CRITICAL" || activePatient.riskAssessment?.level === "HIGH" ? "RED" : "SLATE";
      doc.text(`Triage Security Status: ${activePatient.riskAssessment?.level || "LOW"} RISK LEVEL`, 24, 72);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(20, 77, 190, 77);
      
      // 2. Clinical Histories Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("2. Clinical Anamnesis & Medical Histories", 20, 85);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      
      const psyHist = `• Psychiatric History: ${activePatient.psychiatricHistory?.join(", ") || "None documented"}`;
      const medHist = `• Somatic Conditions: ${activePatient.medicalHistory?.join(", ") || "None documented"}`;
      const allergiesHist = `• Allergies & Sensitivity Flags: ${activePatient.allergies?.join(", ") || "None documented"}`;
      
      doc.text(psyHist, 24, 92);
      doc.text(medHist, 24, 98);
      doc.text(allergiesHist, 24, 104);
      
      doc.line(20, 111, 190, 111);
      
      // 3. Clinical Logs and Notes
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("3. EHR Assessment Logs & SOAP Snapshot", 20, 119);
      
      let currentY = 126;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Compiled SOAP Note Narrative:", 20, currentY);
      currentY += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      
      const textToSplit = rawSoap || activePatient.rawSoapBullets || "No active SOAP record documented.";
      const splitSoap = doc.splitTextToSize(textToSplit, 160);
      doc.text(splitSoap, 20, currentY);
      currentY += (splitSoap.length * 4.5) + 8;
      
      // Check summary
      const savedSummaryText = sessionSummary || activePatient.sessionSummary;
      if (savedSummaryText) {
        if (currentY > 260) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text("Clinician-Approved AI Session Summary (Goal Monitor):", 20, currentY);
        currentY += 6;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const splitSummary = doc.splitTextToSize(savedSummaryText, 160);
        
        if (currentY + (splitSummary.length * 4.5) > 280) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(splitSummary, 20, currentY);
        currentY += (splitSummary.length * 4.5) + 8;
      }
      
      // 4. CDSS Diagnostics
      if (currentY + 45 > 280) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("4. Clinical Decision Support System (CDSS) Diagnoses", 20, currentY);
      currentY += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      
      if (aiDiagnosticSuggestion?.diagnoses?.length > 0) {
        aiDiagnosticSuggestion.diagnoses.forEach((diag, index) => {
          if (currentY + 24 > 280) {
            doc.addPage();
            currentY = 20;
          }
          
          doc.setFont("helvetica", "bold");
          doc.setTextColor(79, 70, 229); // indigo-600
          doc.text(`[Rank ${index + 1}: ${diag.code}] ${diag.name} (CDSS Confidence: ${diag.confidence}%)`, 24, currentY);
          currentY += 5;
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
          const splitEvidence = doc.splitTextToSize(`Justification: ${diag.evidenceSummary}`, 155);
          doc.text(splitEvidence, 27, currentY);
          currentY += (splitEvidence.length * 4.5) + 2;
          
          const splitDiff = doc.splitTextToSize(`Suggested Differentials: ${diag.differentialRankings?.join(", ") || "None listed"}`, 155);
          doc.text(splitDiff, 27, currentY);
          currentY += (splitDiff.length * 4.5) + 5;
        });
      } else {
        doc.text("No active CDSS diagnostic reasoning suggestions compiled under the current session.", 25, currentY);
        currentY += 10;
      }
      
      // Footer text in small gray
      if (currentY + 15 > 280) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("CONFIDENTIAL - SECURE MEDICAL TRANSCRIPT. ONLY TO BE SHARED WITH AUTHORIZED CLINICAL TEAM.", 20, currentY + 10);
      
      // Finish saving
      doc.save(`PsyPyrus_Clinical_Assessment_${activePatient.name.replace(/\s+/g, "_")}.pdf`);
      addAuditLog(`Successfully compiled and downloaded PDF report for ${activePatient.name}`);
    } catch (err) {
      console.error("PDF engine failure:", err);
      alert(`PDF Compilation Error: ${err.message}`);
    }
  };

  const activePatientName = () => activePatient.name;

  // Add custom score to current patient PHQ-9 historical chart
  const handleAddPhq9Score = () => {
    const total = phq9Answers.reduce((sum, current) => sum + current, 0);
    const updated = { ...activePatient };
    updated.psychometricScores = {
      ...updated.psychometricScores,
      phq9: [...(updated.psychometricScores.phq9 || []), total]
    };
    
    // Update local patient array
    setPatients(patients.map((p) => (p.id === activePatient.id ? updated : p)));
    addAuditLog(`New clinical PHQ-9 score of ${total} logged into patient's timeline`);
    alert(`Successfully registered a new diagnostic screener value: ${total}/27.`);
  };

  // Genogram mouse event callbacks (interactive dragging)
  const handleGenNodeMouseDown = (e, node) => {
    e.preventDefault();
    if (currentRole === UserRole.PATIENT) return; // Deny editing to patients
    setDraggingNodeId(node.id);
    setSelectedGenNode(node);

    if (genogramSvgRef.current) {
      const rect = genogramSvgRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y
      });
    }
  };

  const handleGenSvgMouseMove = (e) => {
    if (!draggingNodeId || !genogramSvgRef.current) return;
    const rect = genogramSvgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Boundary containment 
    const boundedX = Math.max(20, Math.min(x, 780));
    const boundedY = Math.max(20, Math.min(y, 380));

    setGenogramNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: boundedX, y: boundedY } : n))
    );
  };

  const handleGenSvgMouseUp = () => {
    if (draggingNodeId) {
      addAuditLog(`Rearranged family genogram node positions`);
      setDraggingNodeId(null);
    }
  };

  // Add Genogram Family Member Node
  const handleAddGenNode = (e) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    const newId = "g_" + Date.now();
    const ageValue = newNodeAge === "" ? undefined : Number(newNodeAge);
    const conditionsList = newNodeConditions
      ? newNodeConditions.split(",").map((c) => c.trim())
      : ["None documented"];

    const newNode = {
      id: newId,
      name: newNodeName,
      relation: newNodeRelation,
      gender: newNodeGender,
      age: ageValue,
      conditions: conditionsList,
      x: 350 + Math.random() * 80,
      y: 150 + Math.random() * 60
    };

    setGenogramNodes((prev) => [...prev, newNode]);
    addAuditLog(`Added family member ${newNodeName} (${newNodeRelation}) to genogram`);
    
    // reset form fields
    setNewNodeName("");
    setNewNodeConditions("");
    setNewNodeAge("");
  };

  // Add relation link
  const handleAddGenLink = (e) => {
    e.preventDefault();
    if (!linkFrom || !linkTo || linkFrom === linkTo) return;

    // Check pre-existing link
    const exists = genogramLinks.find(
      (l) => (l.from === linkFrom && l.to === linkTo) || (l.from === linkTo && l.to === linkFrom)
    );
    if (exists) {
      alert("A relational path connection already links these family members.");
      return;
    }

    const newLink = {
      from: linkFrom,
      to: linkTo,
      type: linkType
    };

    setGenogramLinks((prev) => [...prev, newLink]);
    addAuditLog(`Constructed genogram link: ${linkFrom} to ${linkTo}`);
  };

  // Delete family node
  const handleDeleteGenNode = (nodeId) => {
    setGenogramNodes((prev) => prev.filter((n) => n.id == nodeId));
    setGenogramLinks((prev) => prev.filter((l) => l.from == nodeId && l.to == nodeId));
    setSelectedGenNode(null);
    addAuditLog(`Removed family genogram node`);
  };

  // FHIR JSON Download handler
  const handleDownloadFhir = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(activePatient.fhirRecord);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${activePatient.name}_FHIR_Resource.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addAuditLog("Downloaded HL7 FHIR structured record");
    } catch (e) {
      alert("Error exporting FHIR bundle: " + e.message);
    }
  };

  // UI Patient Profile synchronizer
  const updatePatientProfile = (updatedProfile) => {
    setPatients((prev) => prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p)));
    addAuditLog(`Updated Electronic Health Record parameters for ${updatedProfile.name}`);
  };

  // Telehealth chat support
  const sendTeleMessage = () => {
    if (newTeleMsg.trim()) return;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderLabel = currentRole === UserRole.PSYCHIATRIST || currentRole === UserRole.PSYCHOLOGIST ? "Practitioner" : "You";
    
    setTeleMessages((prev) => [...prev, { sender: senderLabel, text: newTeleMsg, time: timeNow }]);
    setNewTeleMsg("");

    // Simulate reactive patient feedback
    setTimeout(() => {
      const answersList = [
        "Yes, I took my dose this morning.",
        "That strategy seems challenging but I will try.",
        "My sleep w bit better last night, got close to 5 hours.",
        "Thank you, I feel very validated by this session.",
        "The workplace worries are slightly less intense today."
      ];
      const randomAnswer = answersList[Math.floor(Math.random() * answersList.length)];
      setTeleMessages((prev) => [
        ...prev,
        { sender: activePatient.name, text: randomAnswer, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }, 1500);
  };

  // Knowledge Graph nodes definition
  const kgNodes = [
    { id: "S1", label: "Insomnia", type: "symptom", x: 100, y: 120, info: "Sleep onset latency >120m. Disrupts neural frontal gating." },
    { id: "S2", label: "Anhedonia", type: "symptom", x: 160, y: 50, info: "Loss of anticipatory pleasure and ventral striatal rewarding processes." },
    { id: "S3", label: "Severe Stress", type: "symptom", x: 60, y: 220, info: "HPA axis hyperactivation with cortisol spike markers." },
    { id: "D1", label: "Major Depression", type: "diagnosis", x: 300, y: 120, info: "F32.1. Associated with high internalizing spectrum weight." },
    { id: "D2", label: "Bipolar Dynamics", type: "diagnosis", x: 340, y: 240, info: "F31. Significant circadian shift & risk of hypomanic overshoot." },
    { id: "R1", label: "Suicide Risk", type: "risk", x: 440, y: 60, info: "Passive or active ideation heavily amplified by neuro-inflammation." },
    { id: "I1", label: "CBT-Sch", type: "intervention", x: 550, y: 180, info: "Stimulus control, sleep hygiene, & cognitive behavioral reconstruction." },
    { id: "P1", label: "Sertraline", type: "pharmacotherapy", x: 500, y: 280, info: "SSRI agent. Elevates synaptic serotonin levels." }
  ];

  const kgLinks = [
    { from: "S1", to: "D1", label: "core factor" },
    { from: "S2", to: "D1", label: "core factor" },
    { from: "S3", to: "D1", label: "precipitator" },
    { from: "S1", to: "D2", label: "trigger" },
    { from: "D1", to: "R1", label: "correlation (HIGH)" },
    { from: "S1", to: "R1", label: "escalator" },
    { from: "D1", to: "I1", label: "treatment" },
    { from: "D1", to: "P1", label: "treatment" }
  ];

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* FLOATING ADHERENCE ALERT SIMULATION TOAST */}
      <AnimatePresence>
        {simulationToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-11/12 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-4 flex items-start gap-3"
          >
            <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg shrink-0 mt-0.5 animate-bounce">
              <Bell className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1 select-none">
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider block uppercase">Adherence Alert Simulated Dispatched</span>
              <p className="text-xs text-slate-350 leading-relaxed font-sans">{simulationToast.message}</p>
            </div>
            <button
              onClick={() => setSimulationToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 hover:bg-slate-800 rounded transition"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">Ψ</span>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 leading-none">PsyPyrus</h1>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Clinical Workspace</span>
              </div>
            </div>
            
            {/* Active User Practitioner Info */}
            <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                {practitionerName.split(" ").slice(-1)[0][0]}
              </div>
              <div className="overflow-hidden">
                <span className="block text-xs font-semibold text-slate-800 truncate">{practitionerName}</span>
                <span className="text-[10px] text-slate-400 block truncate">{currentRole}</span>
              </div>
            </div>
          </div>

          {/* MAIN PANELS SECTIONS NAV LIST */}
          <nav className="p-4 space-y-1">
            <span className="px-3 text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-2">Workspace Nodes</span>
            <button
              id="nav-ehr-btn"
              onClick={() => setActiveTab("ehr")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "ehr"
                  ? "bg-sky-50 text-sky-700 shadow-xs border-l-2 border-sky-600"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              EHR & Note-taking Suite
            </button>

            <button
              id="nav-diagnostics-btn"
              onClick={() => setActiveTab("diagnostics")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "diagnostics"
                  ? "bg-sky-50 text-sky-700 shadow-xs border-l-2 border-sky-600"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              }`}
            >
              <Brain className="w-4 h-4 shrink-0" />
              CDSS Diagnostic & HiTOP
            </button>

            <button
              id="nav-mapping-btn"
              onClick={() => setActiveTab("mapping")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "mapping"
                  ? "bg-sky-50 text-sky-700 shadow-xs border-l-2 border-sky-600"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              Genograms & Relations
            </button>

            <button
              id="nav-therapeutics-btn"
              onClick={() => setActiveTab("therapeutics")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "therapeutics"
                  ? "bg-sky-50 text-sky-700 shadow-xs border-l-2 border-sky-600"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              Symptom Trends & Meds
            </button>

            <button
              id="nav-telehealth-btn"
              onClick={() => setActiveTab("telehealth")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all relative ${
                activeTab === "telehealth"
                  ? "bg-sky-50 text-sky-700 shadow-xs border-l-2 border-sky-600"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              }`}
            >
              <Video className="w-4 h-4 shrink-0" />
              Telehealth & ABHA
              {teleSessionActive && (
                <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            <button
              id="nav-psyos-btn"
              onClick={() => setActiveTab("psyos")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all relative ${
                activeTab === "psyos"
                  ? "bg-indigo-50 text-indigo-700 shadow-xs border-l-2 border-indigo-600 font-bold"
                  : "text-slate-600 hover:text-indigo-950 hover:bg-indigo-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 shrink-0 text-indigo-500 animate-pulse" />
                <span>PsyOS Core Operating Suite</span>
              </div>
              <span className="text-[8.5px] uppercase tracking-widest bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-black">25 MODULES</span>
            </button>
          </nav>
        </div>

        {/* PRACTICE PARAMETERS & ROLE CONFIGURATOR */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Workspace Role Access</label>
            <select
              id="role-select"
              value={currentRole}
              onChange={(e) => {
                const targetRole = e.target.value ;
                setCurrentRole(targetRole);
                addAuditLog(`Practitioner changed active workspace role to ${targetRole}`);
                if (targetRole === UserRole.PATIENT) {
                  setPractitionerName("Elena Rostova (Patient Portal)");
                } else if (targetRole === UserRole.PSYCHOLOGIST) {
                  setPractitionerName("Dr. Alvarez (Clinical Psych)");
                } else if (targetRole === UserRole.ADMINISTRATOR) {
                  setPractitionerName("Admin Staff");
                } else {
                  setPractitionerName("Dr. Arishta Singh");
                }
              }}
              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value={UserRole.PSYCHIATRIST}>Psychiatrist View (Full Access)</option>
              <option value={UserRole.PSYCHOLOGIST}>Psychologist View (Med Lock)</option>
              <option value={UserRole.PATIENT}>Patient View (Read-Only Specs)</option>
              <option value={UserRole.ADMINISTRATOR}>Administrator View (Audit Only)</option>
            </select>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              HIPAA & FHIR Standard
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </aside>

      {/* MAIN MAIN VIEWPORTS GRID */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP STATUS BAR */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Active Patient</span>
            
            <div className="flex items-center gap-2">
              <select
                id="patient-selector"
                value={activePatientId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setActivePatientId(val);
                  if (onSetActivePatientId) {
                    onSetActivePatientId(val);
                  }
                  addAuditLog(`Switched active workspace client profile to ${val}`);
                }}
                className="font-bold text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.gender}, {p.age})
                  </option>
                ))}
              </select>
              <span className="text-xs bg-slate-100 text-slate-500 font-mono px-2 py-1 rounded">
                PID-{activePatient.id}
              </span>
            </div>
          </div>

          {/* Quick Metrics Alerts */}
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            {/* Keyboard Shortcuts Manual Button */}
            <button
              id="shortcuts-manual-btn"
              onClick={() => setShowShortcutsModal(true)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 bg-white cursor-pointer transition shadow-2xs"
              title="Show Keyboard Hotkeys Guidance"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              Shortcuts
            </button>

            {/* Autosave Switch and Status Pulsar */}
            <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-1">
              <label htmlFor="autosave-checkbox" className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  id="autosave-checkbox"
                  type="checkbox"
                  checked={autosave}
                  onChange={(e) => {
                    setAutosave(e.target.checked);
                    addAuditLog(`Clinician updated autosave preference: ${e.target.checked}`);
                  }}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-slate-200 rounded-full peer peer-focus:ring-1 peer-focus:ring-indigo-300 peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Autosave</span>
              </label>
              
              {autosave && (
                <span className="flex h-1.5 w-1.5 relative" title={`Autosave is active. Status: ${lastSaveStatus}`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${lastSaveStatus === "saving" ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${lastSaveStatus === "saving" ? "bg-amber-500" : "bg-emerald-500"}`}></span>
                </span>
              )}
            </div>

            {/* Formatted PDF Document Export Button */}
            <button
              id="export-pdf-summary-btn"
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 bg-emerald-605 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer font-sans"
              title="Export formatted clinical summary to PDF"
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>

            {/* Risk Indicator Badge & Triage Alarm Threshold Guard */}
            <div className="flex items-center gap-1.5 relative">
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Triage</span>
              <button
                type="button"
                id="status-risk-badge"
                onClick={handleOpenRiskNotesPopup}
                title="Click to view raw clinical notes associated with this triage risk level"
                className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-xs hover:scale-105 hover:brightness-95 active:scale-95 transition-all text-left flex items-center gap-1 cursor-pointer border border-black/5 ${
                  activePatient.riskAssessment.level === "CRITICAL"
                    ? "bg-red-100 text-red-800 hover:bg-red-200"
                    : activePatient.riskAssessment.level === "HIGH"
                    ? "bg-orange-100 text-orange-850 hover:bg-orange-200"
                    : activePatient.riskAssessment.level === "MODERATE"
                    ? "bg-yellow-100 text-yellow-850 hover:bg-yellow-200"
                    : "bg-emerald-100 text-emerald-850 hover:bg-emerald-250"
                }`}
              >
                <span>{activePatient.riskAssessment.level} RISK</span>
                <span className="text-[9px] opacity-75 font-normal">🔍 notes</span>
              </button>

              {/* Threshold Configuration Button */}
              <button
                type="button"
                id="risk-config-trigger-btn"
                onClick={() => setIsThresholdConfigOpen(!isThresholdConfigOpen)}
                className={`p-1.5 rounded-lg border text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition cursor-pointer ${
                  isThresholdConfigOpen ? "bg-indigo-50 border-indigo-200 text-indigo-650" : "bg-transparent border-transparent"
                }`}
                title="Configure clinic-wide critical risk threshold alarms"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              {/* Threshold Configuration Panel Popover */}
              {isThresholdConfigOpen && (
                <div
                  id="risk-config-panel"
                  className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-indigo-500" /> Triage Alarms
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsThresholdConfigOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold leading-none p-1 rounded hover:bg-slate-100"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-3.5 text-xs">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAlertOnCritical}
                        onChange={(e) => {
                          setIsAlertOnCritical(e.target.checked);
                          addAuditLog(`Clinician updated triage alert trigger: ${e.target.checked ? "ENABLED" : "DISABLED"}`);
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-700">Enable Triage Safeguard Alarms</span>
                    </label>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alert Threshold Level</label>
                      <select
                        value={customCriticalThresholdValue}
                        onChange={(e) => {
                          setCustomCriticalThresholdValue(e.target.value);
                          addAuditLog(`Clinician updated alarm threshold to: ${e.target.value}`);
                        }}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
                      >
                        <option value="CRITICAL">Critical level entries only</option>
                        <option value="HIGH">High risk & Critical level entries</option>
                      </select>
                    </div>
                    
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-[10px] text-slate-500 leading-normal font-medium">
                      💡 Alerts Clinician when the active patient's current risk assessment matches or exceeds the threshold level parameter.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* India ABHA Linked indicator */}
            {activePatient.abhaId && (
              <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg font-semibold tracking-wide flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                ABHA Sync
              </span>
            )}
          </div>
        </header>

        {/* DESKTOP CLINICAL CONSOLE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ACTION RESTRICTION BAR (Patient Portal Warning) */}
          {currentRole === UserRole.PATIENT && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-blue-900 block text-sm">Patient Portal Experience</span>
                <p className="text-xs text-blue-700 leading-relaxed mt-0.5">
                  You are logged into the patient-facing portal. Standard diagnostic tools, AI medical drafting mechanisms, medication write permissions, and full HIPAA audit logs are locked according to safety specifications.
                </p>
              </div>
            </div>
          )}

          {/* VIEWPORT CONTROLLER SWITCHCASE */}
          <AnimatePresence mode="wait">

          {/* TAB 1: EHR & INTAKE NOTE SUITE */}
          {activeTab === "ehr" && (
            <motion.div
              key="ehr"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              id="tab-ehr-viewport"
              className="space-y-6"
            >
              
              {/* ALARM / TRIAGE THRESHOLD NOTIFICATION BANNER */}
              {isTriageAlarmActive && (
                <div
                  id="clinical-threshold-banner"
                  className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3.5 shadow-sm animate-pulse"
                >
                  <div className="bg-red-100 text-red-800 p-2 rounded-lg shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-red-650" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-red-950 font-bold text-sm tracking-tight flex items-center gap-1.5">
                      ⚠️ ALERT: CLINICAL TRIAGE SECURITY THRESHOLD TRIGGERED
                    </h4>
                    <p className="text-xs text-red-800 leading-relaxed font-semibold">
                      Active threshold check for <strong className="font-extrabold underline">{activePatient.name}</strong> indicates current triaged risk level h or exceeded your configured limit <strong className="font-bold">({customCriticalThresholdValue}+)</strong>. Recent clinical assessment level: <strong className="font-black uppercase">{activePatient.riskAssessment.level}</strong>. Immediately confirm protective safety plans and confirm emergency contact arrangements.
                    </p>
                    <div className="flex gap-2 pt-1 font-sans">
                      <button
                        type="button"
                        onClick={handleOpenRiskNotesPopup}
                        className="text-[10.5px] bg-red-600 hover:bg-red-700 text-white font-extrabold px-3 py-1 rounded shadow-xs transition cursor-pointer"
                      >
                        ⚡ Inspect Last Severity Clinical Note
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAlertOnCritical(false)}
                        className="text-[10.5px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-1 rounded transition cursor-pointer"
                      >
                        Dismiss Temp Alert Indicator
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* EHR GRID LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1.1 Demographics Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Core EHR Demographics</span>
                    <User className="w-4 h-4 text-sky-600" />
                  </div>
                  
                  <div className="flex items-center gap-4 py-2">
                    <img
                      src={activePatient.avatar}
                      alt={activePatient.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 outline outline-offset-1 outline-sky-500"
                    />
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{activePatient.name}</h3>
                      <span className="text-xs text-slate-400 capitalize">{activePatient.gender} • DOB {activePatient.demographics.dob}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Occupation</span>
                      <span className="font-semibold text-slate-700">{activePatient.demographics.occupation}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Primary Contact</span>
                      <span className="font-semibold text-slate-700">{activePatient.demographics.contact}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Emergency Liaison</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[160px] inline-block">{activePatient.demographics.emergencyContact}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Insurance Provider</span>
                      <span className="font-semibold text-slate-700">{activePatient.demographics.insurance}</span>
                    </div>
                    {activePatient.abhaId && (
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Ayushman ID</span>
                        <span className="font-bold text-indigo-700 font-mono">{activePatient.abhaId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1.2 Psychiatric/Medical History */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Structural Histories</span>
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wider block mb-1.5">Psychiatric Antecedents</span>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {activePatient.psychiatricHistory.map((history, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold shrink-0">•</span>
                            <span>{history}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block mb-1.5">General Somatic Illnesses</span>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {activePatient.medicalHistory.map((history, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-teal-500 font-bold shrink-0">•</span>
                            <span>{history}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block mb-1.5">Allergies & Contraindications</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activePatient.allergies.map((allergy, idx) => (
                          <span key={idx} className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded font-medium">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1.3 High-Contrast Risk Assessment Triage */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Core Clinical Risks</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* MANUALLY CHANGE RISK LEVEL (TRIGGERS ADHERENCE NOTIFICATIONS REALTIME) */}
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-1 shadow-2xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider block">Set Triage Severity Level</span>
                        <p className="text-[9.5px] text-slate-500 leading-none">Sets active patient's live clinical risk.</p>
                      </div>
                      <select
                        value={activePatient.riskAssessment.level}
                        onChange={(e) => {
                          const updatedLevel = e.target.value;
                          updatePatientProfile({
                            ...activePatient,
                            riskAssessment: {
                              ...activePatient.riskAssessment,
                              level: updatedLevel
                            }
                          });
                          addAuditLog(`Set active risk assessment level for ${activePatient.name} to ${updatedLevel}`);
                        }}
                        className="text-xs font-bold p-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 cursor-pointer shadow-3xs"
                      >
                        <option value="LOW">LOW RISK</option>
                        <option value="MODERATE">MODERATE RISK</option>
                        <option value="HIGH">HIGH RISK</option>
                        <option value="CRITICAL">CRITICAL RISK</option>
                      </select>
                    </div>

                    <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-100 rounded-lg">
                      <span className="font-bold text-orange-950 block">Suicidality Evaluation</span>
                      <p className="text-slate-700 leading-relaxed mt-1 text-[11px]">{activePatient.riskAssessment.suicideRisk}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-800 block mb-1">Risk Parameters Matrix</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                        <div className="bg-white border p-1 rounded text-center">
                          <span className="text-slate-400 block uppercase">Self-Harm</span>
                          <span className="font-semibold text-slate-800">{activePatient.riskAssessment.selfHarmRisk}</span>
                        </div>
                        <div className="bg-white border p-1 rounded text-center">
                          <span className="text-slate-400 block uppercase">Violence Risk</span>
                          <span className="font-semibold text-slate-800">{activePatient.riskAssessment.violenceRisk}</span>
                        </div>
                      </div>
                    </div>

                    {/* RISK EVOLUTION HEATMAP */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide flex items-center gap-1">
                          📊 Clinical Risk Intensity Heatmap
                        </span>
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-extrabold uppercase">
                          Evolution Grid
                        </span>
                      </div>

                      {/* Heatmap Legend */}
                      <div className="flex justify-between items-center text-[9px] text-slate-500 bg-white border border-slate-100 p-1.5 rounded-md leading-none shadow-3xs">
                        <span className="font-bold uppercase tracking-wider text-[8px]">Legend:</span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-emerald-300"></span> Low</span>
                          <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-yellow-350 bg-yellow-300"></span> Mod</span>
                          <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-orange-400"></span> High</span>
                          <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-red-500 animate-pulse"></span> Crit</span>
                        </div>
                      </div>

                      {/* Heatmap Grid */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px] select-none border-collapse text-slate-600">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="py-1 font-bold text-slate-500 uppercase tracking-wider">Dimension</th>
                              {(clinicalRiskHistoryMap[activePatient.id] || clinicalRiskHistoryMap["7"]).map((h, i) => (
                                <th key={i} className="py-1 px-1.5 font-bold text-slate-700 text-center font-mono">
                                  {h.date}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Row 1: Suicidality */}
                            <tr className="hover:bg-indigo-50/40 rounded transition-colors">
                              <td className="py-1.5 font-semibold text-slate-800 pr-2">Suicide Risk</td>
                              {(clinicalRiskHistoryMap[activePatient.id] || clinicalRiskHistoryMap["7"]).map((h, i) => {
                                let labelHex = "bg-emerald-300 text-emerald-950";
                                let desc = "Low";
                                if (h.suicide === 2) { labelHex = "bg-yellow-350 bg-yellow-300 text-yellow-950"; desc = "Moderate"; }
                                else if (h.suicide === 3) { labelHex = "bg-orange-400 text-white"; desc = "High"; }
                                else if (h.suicide >= 4) { labelHex = "bg-red-500 text-white animate-pulse"; desc = "Critical"; }
                                return (
                                  <td key={i} className="py-1 px-1 text-center">
                                    <div
                                      className={`p-1.5 rounded-md font-extrabold ${labelHex} text-[9px] border border-black/5 flex items-center justify-center transition-all hover:scale-105 cursor-help shadow-3xs`}
                                      title={`Suicide Risk level on ${h.date}: ${desc}`}
                                    >
                                      {desc.slice(0, 3)}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Row 2: Self-Harm */}
                            <tr className="hover:bg-indigo-50/40 rounded transition-colors">
                              <td className="py-1.5 font-semibold text-slate-800 pr-2">Self-Harm</td>
                              {(clinicalRiskHistoryMap[activePatient.id] || clinicalRiskHistoryMap["7"]).map((h, i) => {
                                let labelHex = "bg-emerald-300 text-emerald-950";
                                let desc = "Low";
                                if (h.selfHarm === 2) { labelHex = "bg-yellow-350 bg-yellow-300 text-yellow-950"; desc = "Moderate"; }
                                else if (h.selfHarm === 3) { labelHex = "bg-orange-400 text-white"; desc = "High"; }
                                else if (h.selfHarm >= 4) { labelHex = "bg-red-500 text-white animate-pulse"; desc = "Critical"; }
                                return (
                                  <td key={i} className="py-1 px-1 text-center">
                                    <div
                                      className={`p-1.5 rounded-md font-extrabold ${labelHex} text-[9px] border border-black/5 flex items-center justify-center transition-all hover:scale-105 cursor-help shadow-3xs`}
                                      title={`Self-Harm level on ${h.date}: ${desc}`}
                                    >
                                      {desc.slice(0, 3)}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Row 3: Violence */}
                            <tr className="hover:bg-indigo-50/40 rounded transition-colors">
                              <td className="py-1.5 font-semibold text-slate-800 pr-2">Violence</td>
                              {(clinicalRiskHistoryMap[activePatient.id] || clinicalRiskHistoryMap["7"]).map((h, i) => {
                                let labelHex = "bg-emerald-300 text-emerald-950";
                                let desc = "Low";
                                if (h.violence === 2) { labelHex = "bg-yellow-350 bg-yellow-300 text-yellow-950"; desc = "Moderate"; }
                                else if (h.violence === 3) { labelHex = "bg-orange-400 text-white"; desc = "High"; }
                                else if (h.violence >= 4) { labelHex = "bg-red-500 text-white animate-pulse"; desc = "Critical"; }
                                return (
                                  <td key={i} className="py-1 px-1 text-center">
                                    <div
                                      className={`p-1.5 rounded-md font-extrabold ${labelHex} text-[9px] border border-black/5 flex items-center justify-center transition-all hover:scale-105 cursor-help shadow-3xs`}
                                      title={`Violence level on ${h.date}: ${desc}`}
                                    >
                                      {desc.slice(0, 3)}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* DYNAMIC RISK TRENDS TIMELINE CHART */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Risk Assessment Severity Timeline</span>
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <div className="h-44 w-full" style={{ minWidth: '100px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={clinicalRiskHistoryMap[activePatient.id] || clinicalRiskHistoryMap["7"]}
                            margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 500 }} stroke="#64748b" />
                            <YAxis
                              domain={[1, 4]}
                              ticks={[1, 2, 3, 4]}
                              tickFormatter={formatRiskYAxis}
                              tick={{ fontSize: 9, fontWeight: 500 }}
                              stroke="#64748b"
                            />
                            <Tooltip
                              contentStyle={{ fontSize: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                              formatter={(value, name) => {
                                let label = "Low";
                                if (value === 2) label = "Moderate";
                                if (value === 3) label = "High";
                                if (value === 4) label = "Critical";
                                return [label, name.charAt(0).toUpperCase() + name.slice(1) + " Risk"];
                              }}
                            />
                            <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "8.5px", pt: 2 }} />
                            <Line
                              type="monotone"
                              dataKey="suicide"
                              stroke="#f97316"
                              strokeWidth={2.5}
                              name="Suicide"
                              activeDot={{ r: 4 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="selfHarm"
                              stroke="#a855f7"
                              strokeWidth={2}
                              name="Self-Harm"
                              activeDot={{ r: 4 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="violence"
                              stroke="#ef4444"
                              strokeWidth={2}
                              name="Violence"
                              activeDot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {activePatient.riskAssessment.clinicalFlags.map((flag, idx) => (
                        <span key={idx} className="text-[10px] bg-yellow-50 border border-yellow-200 text-yellow-800 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                          ⚠️ {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Clinician-Approved AI Session Summary Card */}
              {sessionSummary && (
                <div id="approved-session-summary-card" className="bg-slate-50 border border-slate-205 border-slate-200 rounded-xl p-6 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <h4 className="font-bold text-sm text-slate-805 flex items-center gap-1.5">
                      <Sparkles className="w-4.5 h-4.5 text-sky-600 animate-pulse" />
                      Clinician-Approved AI Session Summary & Goal Benchmark
                    </h4>
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Approved EHR Snapshot
                    </span>
                  </div>
                  <div className="text-xs text-slate-705 font-sans leading-relaxed whitespace-pre-line bg-white p-4 rounded-lg border border-slate-100 shadow-2xs">
                    {sessionSummary}
                  </div>
                </div>
              )}

              {/* DYNAMIC AI SYNTHESIS COMPONENT FOR INTAKE, MSE & SOAP */}
              <IntakeMseSoapModule
                activePatient={activePatient}
                onChangePatient={(updated) => updatePatientProfile(updated)}
                rawIntake={rawIntake}
                setRawIntake={setRawIntake}
                rawMse={rawMse}
                setRawMse={setRawMse}
                rawSoap={rawSoap}
                setRawSoap={setRawSoap}
                sessionSummary={sessionSummary}
                setSessionSummary={setSessionSummary}
              />

              {/* INTEGRATED TREATMENT PLANNING PANEL */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
                <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-base text-slate-850 flex items-center gap-1.5">
                      <CheckCircle className="w-5 h-5 text-sky-600" />
                      Intervention Schema & Diagnostic Treatment Plan
                    </h3>
                    <p className="text-xs text-slate-400">Goals, short-term benchmarks, and clinical actions.</p>
                  </div>
                  {currentRole !== UserRole.PATIENT && (
                    <button
                      id="draft-plan-ai-btn"
                      onClick={async () => {
                        const confirmPrompt = confirm("Draft a comprehensive psychiatric treatment plan using Gemini AI, matching the active EHR history?");
                        if (confirmPrompt) return;
                        addAuditLog("Generating diagnostic treatment plan blueprint");
                        try {
                          const res = await fetch("/api/gemini/analyze", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "draft_treatment_plan", payload: activePatient.rawSoapBullets })
                          });
                          const data = await res.json();
                          if (data.success) {
                            const updated = { ...activePatient };
                            updated.treatmentPlan = {
                              ...updated.treatmentPlan,
                              longTermGoal: data.text
                            };
                            updatePatientProfile(updated);
                            alert("AI draft compiled successfully under Diagnostic Goal");
                          } else {
                            alert(data.error);
                          }
                        } catch (e) {
                          alert(e.message);
                        }
                      }}
                      className="text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI treatment blueprint
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Long-Term Goal */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-sky-700 uppercase tracking-wide block">1. Long-Term Remission Target</span>
                    <div className="bg-slate-50 border border-slate-150 rounded-lg p-4 text-xs font-medium text-slate-700 leading-relaxed h-[180px] overflow-y-auto">
                      {activePatient.treatmentPlan.longTermGoal}
                    </div>
                  </div>

                  {/* Short-Term Objectives */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wide block">2. Measurable Milestones</span>
                    <div className="bg-slate-50 border border-slate-150 rounded-lg p-4 text-xs space-y-2.5 h-[180px] overflow-y-auto">
                      {activePatient.treatmentPlan.shortTermObjectives.map((obj, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-slate-700 dark:text-slate-300">{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Specific Evidence-Based Interventions */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-violet-700 uppercase tracking-wide block">3. Interventions & Pharmacotherapy</span>
                    <div className="bg-slate-50 border border-slate-150 rounded-lg p-4 text-xs space-y-2.5 h-[180px] overflow-y-auto">
                      {activePatient.treatmentPlan.interventions.map((intv, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-violet-600 font-extrabold shrink-0">§</span>
                          <span className="text-slate-700 dark:text-slate-300">{intv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 2: DIAGNOSTICS & HARD TAXONOMIES (HiTOP & RDoC) */}
          {activeTab === "diagnostics" && (
            <motion.div
              key="diagnostics"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              id="tab-diagnostics-viewport"
              className="space-y-6"
            >
              
              {/* CDSS INTELLIGENCE DECK */}
              <div className="bg-indigo-950 text-white rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-[40%] bg-indigo-900/40 clip-path-diagonal pointer-events-none" />
                <div className="relative z-10 max-w-4xl space-y-4">
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-full font-bold uppercase tracking-wide inline-block">
                    Module 5: Clinical Decision Support System (CDSS)
                  </span>

                  <h3 className="font-extrabold text-2xl tracking-tight leading-tight">AI Differential Diagnosis, DSM-5-TR, and ICD-11 Validation Core</h3>
                  <p className="text-xs text-indigo-200 leading-relaxed max-w-2xl">
                    Run our state-of-the-art diagnostic reasoning models directly against current active case data. Our CDSS matches presenting histories to standardized DSM indicators, suggests F-codes, classifies risk matrices, and validates differential probabilities.
                  </p>

                  <div className="flex gap-4 pt-2">
                    {currentRole !== UserRole.PATIENT ? (
                      <button
                        id="run-cdss-btn"
                        onClick={suggestDiagnosesWithAi}
                        className="bg-white text-indigo-950 font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-slate-100 shadow-sm flex items-center gap-2"
                      >
                        {isSuggesting ? "Generating Core Diagnoses..." : "Generate CDSS Hypothesis"}
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      </button>
                    ) : (
                      <span className="text-xs text-indigo-300 font-medium">Logged in : Diagnosis lock active</span>
                    )}
                  </div>
                </div>
              </div>

              {/* DIAGNOSTIC GRAPH / CDSS MATRIX */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* AI Hypothesis suggestion output */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-slate-50 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CDSS Diagnostic Hypothesis</span>
                    </div>

                    {aiDiagnosticSuggestion ? (
                      <div id="cdss-results-box" className="space-y-4">
                        <div className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100">
                          <span className="text-xs font-semibold text-indigo-800">Assessed Core Risk Threshold</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-sm text-indigo-950">{aiDiagnosticSuggestion.riskFlag}</span>
                            <span className="text-[11px] text-indigo-600">— {aiDiagnosticSuggestion.riskExplanation}</span>
                          </div>
                        </div>

                        <div className="space-y-3.5">
                          {aiDiagnosticSuggestion.diagnoses.map((diag, idx) => (
                            <div key={idx} className="border border-slate-100 p-4 rounded-xl space-y-3 bg-slate-50/50 hover:bg-white transition-all">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mr-2">{diag.code}</span>
                                  <span className="font-bold text-xs text-slate-800">{diag.name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">{diag.confidence}% confidence</span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                <span className="font-semibold text-slate-800">Clinical Justification: </span>
                                {diag.evidenceSummary}
                              </p>

                              <div className="text-[10px] space-y-1">
                                <span className="font-semibold text-slate-500 block">Satisfied DSM-5-TR criteria checklist:</span>
                                <div className="flex flex-wrap gap-1">
                                  {diag.matchingCriteria.map((crit, cIdx) => (
                                    <span key={cIdx} className="bg-slate-200/60 text-slate-700 px-1.5 py-0.5 rounded">{crit}</span>
                                  ))}
                                </div>
                              </div>

                              <div className="text-[10px] font-medium text-slate-500 bg-white p-2 border border-slate-100 rounded">
                                <span className="font-bold block text-slate-705 mb-1 text-[9px] text-indigo-600 uppercase">Differential diagnosis rank alternatives:</span>
                                <div className="flex gap-2 font-mono">
                                  {diag.differentialRankings.map((diff, dIdx) => (
                                    <span key={dIdx}>#{dIdx + 1}: {diff}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-slate-400 border border-dashed rounded-lg">
                        <Brain className="w-12 h-12 text-slate-300 animate-pulse mb-3" />
                        <span className="text-slate-600 font-semibold text-sm">Hypothesis Deck Idle</span>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">Click "Generate CDSS Hypothesis" at the top to prompt structural diagnosis algorithms against active EHR logs.</p>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 mt-4 leading-relaxed">
                    CDSS does not claim psychiatric diagnostic authority. It aligns clinical evidence based on standard semantic classifications.
                  </div>
                </div>

                {/* DSM-5-TR & ICD-11 CLASSIFICATIONS LIBRARY LOOKUP */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-slate-50 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Module 8-9: DSM-5-TR & ICD-11 Codes Reference</span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                        <span className="font-extrabold text-indigo-700 block text-[10px] uppercase">Major Depressive Disorder (F32 & F33)</span>
                        <p className="text-slate-650 leading-relaxed text-[11px]">Requires 5+ symptoms (including depressed mood/anhedonia) during same 2-week period. Significant impairment, not attributable to substances or grief.</p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                        <span className="font-extrabold text-blue-700 block text-[10px] uppercase">Bipolar II Disorder (F31.81)</span>
                        <p className="text-slate-650 leading-relaxed text-[11px]">Requires history of at least one hypomanic episode (4+ days of elevated energy, decreased sleep) and at least one major depressive episode. No manic episode history.</p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                        <span className="font-extrabold text-emerald-700 block text-[10px] uppercase">Panic Disorder (F41.0)</span>
                        <p className="text-slate-655 leading-relaxed text-[11px]">Recurrent unexpected panic attacks followed by 1+ months of persistent worry about future attacks, their consequences, or significant maladaptive behavior changes.</p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                        <span className="font-extrabold text-purple-700 block text-[10px] uppercase">ADHD, Combined Presentation (F90.2)</span>
                        <p className="text-slate-655 leading-relaxed text-[11px]">Persistent schema of inattention and/or hyperactivity-impulsivity that interferes with functioning or development, with symptoms present across 2+ settings prior to age 12.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/60 mt-4">
                    <span className="font-bold text-[11px] text-indigo-800 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      Dynamic Diagnosis Classification Mapping
                    </span>
                    <p className="text-[10px] text-indigo-700 mt-0.5 leading-relaxed">
                      PsyPyrus syncs DSM-5 criteria sets to global WHO ICD-11 coding schema rules mapping psychiatric entries onto standard insurance claim protocols instantly.
                    </p>
                  </div>
                </div>

              </div>

              {/* MODULE 10-11: HiTOP & RDoC INTEGRATION MATRICES */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 2.1 HiTOP Spectrum Visualizer */}
                <div id="hitop-card" className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-4.5 h-4.5 text-sky-600" />
                      Hierarchical Taxonomy of Psychopathology (HiTOP) Multi-Spectral Array
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Moving from categorical tags to comprehensive symptom spectrum weights.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-red-700">Internalizing Psychopathology Spectrum</span>
                        <span>{activePatient.hitopSpectrum.internalizing}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600 transition-all duration-500"
                          style={{ width: `${activePatient.hitopSpectrum.internalizing}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Anxiety, depression, somatization indicators, fear avoidance.</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-sky-700">Thought Disorder Spectrum</span>
                        <span>{activePatient.hitopSpectrum.thoughtDisorder}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 transition-all duration-500"
                          style={{ width: `${activePatient.hitopSpectrum.thoughtDisorder}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Delusion cycles, perceptual deviations, sensory vulnerability, paranoia.</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-yellow-700">Disinhibited Externalizing Spectrum</span>
                        <span>{activePatient.hitopSpectrum.disinhibitedExternalizing}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 transition-all duration-500"
                          style={{ width: `${activePatient.hitopSpectrum.disinhibitedExternalizing}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Sensation seeking, severe impulsivity, risk-taking, ADHD-related outbursts.</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-purple-700">Antagonistic Externalizing Spectrum</span>
                        <span>{activePatient.hitopSpectrum.antagonisticExternalizing}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${activePatient.hitopSpectrum.antagonisticExternalizing}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Aggression indices, oppositional conduct pattern, antisocial features.</p>
                    </div>
                  </div>
                </div>

                {/* 2.2 RDoC Matrix */}
                <div id="rdoc-card" className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                      <Compass className="w-4.5 h-4.5 text-teal-605 text-teal-600" />
                      NIMH Research Domain Criteria (RDoC) Structural Matrix
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Evaluating underlying biological circuits, arousal gating, and cognition systems.</p>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2 bg-rose-50/60 border border-rose-100 rounded-lg">
                      <span className="font-bold text-rose-950 block">Negative Valence System (Threat, Frustration)</span>
                      <p className="text-[10.5px] text-slate-700 leading-relaxed mt-0.5">{activePatient.rdocDomains.negativeValence}</p>
                    </div>

                    <div className="p-2 bg-amber-50/60 border border-amber-100 rounded-lg">
                      <span className="font-bold text-amber-950 block">Positive Valence System (Reward Valuation, Habituations)</span>
                      <p className="text-[10.5px] text-slate-700 leading-relaxed mt-0.5">{activePatient.rdocDomains.positiveValence}</p>
                    </div>

                    <div className="p-2 bg-teal-50/60 border border-teal-100 rounded-lg">
                      <span className="font-bold text-teal-950 block">Cognitive Systems (Mental Control, Attention Gates)</span>
                      <p className="text-[10.5px] text-slate-700 leading-relaxed mt-0.5">{activePatient.rdocDomains.cognitiveSystems}</p>
                    </div>

                    <div className="p-2 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                      <span className="font-bold text-indigo-950 block">Social Processes (Affiliation, Communication Systems)</span>
                      <p className="text-[10.5px] text-slate-700 leading-relaxed mt-0.5">{activePatient.rdocDomains.socialProcesses}</p>
                    </div>

                    <div className="p-2 bg-violet-50/60 border border-violet-100 rounded-lg">
                      <span className="font-bold text-violet-950 block">Arousal & Regulatory Systems (Circadian, Sleep Gating)</span>
                      <p className="text-[10.5px] text-slate-700 leading-relaxed mt-0.5">{activePatient.rdocDomains.arousalRegulatory}</p>
                    </div>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 3: MAPPING & INTERACTIVE GRAPHS (GENOGRAM & KNOWLEDGE REFERENCE) */}
          {activeTab === "mapping" && (
            <motion.div
              key="mapping"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              id="tab-mapping-viewport"
              className="space-y-6"
            >

              {/* MODULE 19: GENOGRAM BUILDER WORKSPACE */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <div className="border-b border-indigo-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <Users className="w-5.5 h-5.5 text-fuchsia-600" />
                      Interactive Genogram Family Graph Map
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Drag family nodes to visually reorganize ties. Click node to review historic conditions or add connections.</p>
                  </div>

                  <div className="text-right text-[10px] text-slate-500 font-medium">
                    Workspace Mode: <span className="bg-fuchsia-100 text-fuchsia-805 text-fuchsia-800 px-2 py-0.5 rounded-full font-bold">INTERACTIVE EDITOR</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Left Controls - Add Node */}
                  <div className="lg:col-span-1 space-y-5 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                    <form onSubmit={handleAddGenNode} className="space-y-3.5">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b pb-1">1. Add Family Node</span>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Grandma Rose"
                          value={newNodeName}
                          onChange={(e) => setNewNodeName(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Relation</label>
                          <select
                            value={newNodeRelation}
                            onChange={(e) => setNewNodeRelation(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                          >
                            <option value="Self">Self</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Mother">Mother</option>
                            <option value="Father">Father</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Maternal Grandmother">Maternal Grandma</option>
                            <option value="Maternal Grandfather">Maternal Grandpa</option>
                            <option value="Paternal Grandmother">Paternal Grandma</option>
                            <option value="Paternal Grandfather">Paternal Grandpa</option>
                            <option value="Aunt">Aunt</option>
                            <option value="Uncle">Uncle</option>
                            <option value="Child">Child</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Gender</label>
                          <select
                            value={newNodeGender}
                            onChange={(e) => setNewNodeGender(e.target.value )}
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                          >
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="Other">Non-Binary</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Age (Opt)</label>
                          <input
                            type="number"
                            placeholder="65"
                            value={newNodeAge}
                            onChange={(e) => setNewNodeAge(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Conditions</label>
                          <input
                            type="text"
                            placeholder="Depression, CHD"
                            value={newNodeConditions}
                            onChange={(e) => setNewNodeConditions(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full flex justify-center items-center gap-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-xs py-2 rounded transition-all shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Introduce Member
                      </button>
                    </form>

                    {/* form link */}
                    <form onSubmit={handleAddGenLink} className="space-y-3.5 pt-4 border-t border-slate-200">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b pb-1">2. Add Relational Path</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">From Member</label>
                          <select
                            value={linkFrom}
                            onChange={(e) => setLinkFrom(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                          >
                            <option value="">Select</option>
                            {genogramNodes.map((n) => (
                              <option key={n.id} value={n.id}>{n.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">To Member</label>
                          <select
                            value={linkTo}
                            onChange={(e) => setLinkTo(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                          >
                            <option value="">Select</option>
                            {genogramNodes.map((n) => (
                              <option key={n.id} value={n.id}>{n.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">Tie Status Type</label>
                        <select
                          value={linkType}
                          onChange={(e) => setLinkType(e.target.value )}
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                        >
                          <option value="parent-child">Parent-Child</option>
                          <option value="married">Spouse (Married)</option>
                          <option value="divorced">Divorced / Separated</option>
                          <option value="sibling">Sibling Connection</option>
                          <option value="conflict">Conflict / Distressed Path</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full flex justify-center items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 rounded transition-all"
                      >
                        Connect Ties
                      </button>
                    </form>
                  </div>

                  {/* Center Interactive SVG canvas */}
                  <div className="lg:col-span-2 relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden min-h-[400px]">
                    <div className="absolute top-3 left-3 flex gap-2 z-10 text-[10px] font-semibold">
                      <span className="bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-600 shadow-xs">
                        🖱️ Grab node to position and coordinate genetics map
                      </span>
                    </div>

                    <svg
                      ref={genogramSvgRef}
                      className="w-full h-[400px]"
                      onMouseMove={handleGenSvgMouseMove}
                      onMouseUp={handleGenSvgMouseUp}
                      style={{ cursor: draggingNodeId ? "grabbing" : "default" }}
                    >
                      {/* Definitions for arrow markers on links */}
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                        </marker>
                      </defs>

                      {/* Render Ties Lines */}
                      {genogramLinks.map((link, idx) => {
                        const fromNode = genogramNodes.find((n) => n.id === link.from);
                        const toNode = genogramNodes.find((n) => n.id === link.to);
                        if (!fromNode || !toNode) return null;

                        const isConflict = link.type === "conflict";
                        const isDivorced = link.type === "divorced";

                        return (
                          <g key={idx}>
                            <line
                              x1={fromNode.x}
                              y1={fromNode.y}
                              x2={toNode.x}
                              y2={toNode.y}
                              stroke={isConflict ? "#ef4444" : isDivorced ? "#f59e0b" : "#94a3b8"}
                              strokeWidth={isConflict ? 2.5 : 2}
                              strokeDasharray={isDivorced ? "4, 4" : "0"}
                              className="transition-all"
                            />
                            {/* Short Label mid ties */}
                            <text
                              x={(fromNode.x + toNode.x) / 2}
                              y={(fromNode.y + toNode.y) / 2 - 5}
                              textAnchor="middle"
                              fill="#64748b"
                              fontSize="9"
                              fontWeight="600"
                              className="bg-white px-1"
                            >
                              {link.type}
                            </text>
                          </g>
                        );
                      })}

                      {/* Render Nodes */}
                      {genogramNodes.map((node) => {
                        const isSelected = selectedGenNode?.id === node.id;
                        const isFemale = node.gender === "F";

                        return (
                          <g
                            key={node.id}
                            transform={`translate(${node.x}, ${node.y})`}
                            onMouseDown={(e) => handleGenNodeMouseDown(e, node)}
                            className="cursor-grab transition-colors"
                          >
                            {/* Circle/Square base depending on biological sex */}
                            {isFemale ? (
                              <circle
                                r="22"
                                fill={isSelected ? "#fdf2f8" : "#ffffff"}
                                stroke={isSelected ? "#db2777" : "#cbd5e1"}
                                strokeWidth={isSelected ? 3.5 : 2.5}
                                className="filter drop-shadow-xs"
                              />
                            ) : (
                              <rect
                                x="-22"
                                y="-22"
                                width="44"
                                height="44"
                                rx="4"
                                fill={isSelected ? "#eff6ff" : "#ffffff"}
                                stroke={isSelected ? "#2563eb" : "#cbd5e1"}
                                strokeWidth={isSelected ? 3.5 : 2.5}
                                className="filter drop-shadow-xs"
                              />
                            )}

                            {/* Center symbol details */}
                            <text y="3" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                              {node.relation.substring(0, 4)}
                            </text>

                            {/* Member Name */}
                            <text y="36" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="extrabold">
                              {node.name}
                            </text>

                            {/* Display brief conditions tags above or below */}
                            {node.conditions.some((c) => c == "None") && (
                              <g transform="translate(0, -32)">
                                <rect x="-28" y="-7" width="56" height="12" rx="2" fill="# fee2e2" stroke="#fecaca" fillOpacity="0.8" />
                                <text textAnchor="middle" y="2" fill="#c53030" fontSize="7" fontWeight="bold">
                                  GENETIC FLAG
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Right side editor / details */}
                  <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b pb-2">Selected Family Node Details</span>

                      {selectedGenNode ? (
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Full Name</span>
                            <span className="font-bold text-sm text-slate-800">{selectedGenNode.name}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Relation Index</span>
                              <span className="font-bold text-slate-705">{selectedGenNode.relation}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Biological Age</span>
                              <span className="font-bold text-slate-705">{selectedGenNode.age || "Unknown"} yrs</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium mb-1">Diagnostic Genogram Markers</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedGenNode.conditions.map((cond, idx) => (
                                <span key={idx} className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded font-semibold">
                                  {cond}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteGenNode(selectedGenNode.id)}
                            className="w-full flex items-center justify-center gap-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 py-1.5 rounded border border-red-200 mt-2 font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove Member
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 text-center py-10">
                          Click any node circle or rectangle in the canv to monitor genetics lineage, age registers, or eliminate nodes.
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border p-3 rounded-lg text-[10px] text-slate-500 mt-4 leading-relaxed">
                      💡 Genogram mappings are vital in family systems therapy and matching genetic risk vectors for heritable mood pathologies.
                    </div>
                  </div>

                </div>
              </div>

              {/* MODULE 12: CLINICAL KNOWLEDGE GRAPH */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-base text-slate-850 flex items-center gap-1.5">
                    <Compass className="w-5 h-5 text-indigo-600" />
                    Interactive Psychiatric Brain Knowledge Graph Reference
                  </h3>
                  <p className="text-xs text-slate-400">Biological relationships mapping Insomnia & Cortisol vectors, MDD, self-harm, and standard interventions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Hover info detail quadrant */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest block border-b pb-2">Concept Mapping Matrix</span>
                      <p className="text-xs text-slate-500 leading-relaxed mt-2">
                        Hover or click any vector point in the visual schema to retrieve underlying clinical research protocols and neuropathological facts.
                      </p>

                      <div className="mt-5 space-y-3">
                        {hoveredKgNode ? (
                          <div className="bg-white border border-indigo-100 p-3.5 rounded-lg space-y-2">
                            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide block">
                              {kgNodes.find((n) => n.id === hoveredKgNode)?.label}
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                              {kgNodes.find((n) => n.id === hoveredKgNode)?.info}
                            </p>
                          </div>
                        ) : selectedKgNode ? (
                          <div className="bg-white border border-sky-100 p-3.5 rounded-lg space-y-2">
                            <span className="text-xs font-bold text-sky-900 uppercase tracking-wide block">
                              {kgNodes.find((n) => n.id === selectedKgNode)?.label}
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                              {kgNodes.find((n) => n.id === selectedKgNode)?.info}
                            </p>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic py-6 text-center">
                            No concept highlighted. Move cursor over node vector ports to query facts.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-4 leading-relaxed bg-white border p-2.5 rounded">
                      🧠 Explainable AI relies on knowledge relational databases, aligning logical parameters to clinical recommendations instead of raw statistical guessing.
                    </div>
                  </div>

                  {/* SVG Map Core representation */}
                  <div className="md:col-span-2 min-h-[300px] border border-slate-200 rounded-xl relative bg-slate-900 overflow-hidden">
                    <svg className="w-full h-[300px]">
                      {/* Grid background effect */}
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.2" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* Render connection lines */}
                      {kgLinks.map((link, i) => {
                        const fromNode = kgNodes.find((n) => n.id === link.from);
                        const toNode = kgNodes.find((n) => n.id === link.to);
                        if (!fromNode || !toNode) return null;

                        const isHighlighted = hoveredKgNode === fromNode.id || hoveredKgNode === toNode.id;

                        return (
                          <g key={i}>
                            <line
                              x1={fromNode.x * 1.2 + 80}
                              y1={fromNode.y * 0.8 + 40}
                              x2={toNode.x * 1.2 + 80}
                              y2={toNode.y * 0.8 + 40}
                              stroke={isHighlighted ? "#38bdf8" : "#475569"}
                              strokeWidth={isHighlighted ? 2.5 : 1.2}
                              strokeOpacity={isHighlighted ? 0.9 : 0.4}
                              className="transition-all"
                            />
                          </g>
                        );
                      })}

                      {/* Render Nodes ports */}
                      {kgNodes.map((node) => {
                        const cx = node.x * 1.2 + 80;
                        const cy = node.y * 0.8 + 40;
                        const isHovered = hoveredKgNode === node.id;
                        const isSelected = selectedKgNode === node.id;

                        // Type dependent coloring
                        const nodeColor =
                          node.type === "diagnosis"
                            ? "#38bdf8"
                            : node.type === "risk"
                            ? "#f43f5e"
                            : node.type === "intervention"
                            ? "#10b981"
                            : node.type === "pharmacotherapy"
                            ? "#a855f7"
                            : "#94a3b8";

                        return (
                          <g
                            key={node.id}
                            transform={`translate(${cx}, ${cy})`}
                            onMouseEnter={() => setHoveredKgNode(node.id)}
                            onMouseLeave={() => setHoveredKgNode(null)}
                            onClick={() => setSelectedKgNode(node.id)}
                            className="cursor-pointer"
                          >
                            <circle
                              r={isHovered || isSelected ? 16 : 12}
                              fill="#0f172a"
                              stroke={nodeColor}
                              strokeWidth={isHovered || isSelected ? 3 : 1.8}
                              className="transition-all"
                            />
                            <circle r="4" fill={nodeColor} />
                            
                            {/* Short indicators label text inside black nodes */}
                            <text
                              x="20"
                              y="4"
                              fill={isHovered || isSelected ? "#ffffff" : "#94a3b8"}
                              fontSize="10"
                              fontWeight="bold"
                              className="pointer-events-none drop-shadow-md transition-all font-mono"
                            >
                              {node.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: THERAPEUTICS & TRACKERS (MEDICATIONS & PSYCHOMETRICS) */}
          {activeTab === "therapeutics" && (
            <motion.div
              key="therapeutics"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              id="tab-therapeutics-viewport"
              className="space-y-6"
            >

              {/* MODULE 18: PSYCHOMETRIC TESTING TIMELINES GRAPH */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-850 flex items-center gap-2">
                      <TrendingUp className="w-5.5 h-5.5 text-sky-600" />
                      Symptom Longitudinal History Chart
                    </h3>
                    <p className="text-xs text-slate-400">Score trackers for GAD-7 (Anxiety) and PHQ-9 (Depression).</p>
                  </div>

                  {/* Add psychometrics scores trigger */}
                  <div className="flex gap-2">
                    <button
                      id="launch-phq-dialog-btn"
                      onClick={() => {
                        const targetBox = document.getElementById("phq-screener-modal");
                        if (targetBox) targetBox.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-xs font-bold border border-slate-205 text-slate-600 bg-slate-50 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      Log New Diagnostic Evaluator
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* SVG line graph representing actual history progression */}
                  <div className="lg:col-span-2 bg-slate-50/50 p-5 rounded-xl border border-slate-150 relative">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Longitudinal Score Progress Graph</span>

                    {/* Highly compliant, pristine React fallback SVG renderer */}
                    <div className="h-[220px] w-full flex items-end relative pb-8">
                      {/* Vertical Grid Y lines */}
                      <div className="absolute left-0 right-0 top-0 bottom-8 border-b-2 border-slate-200 flex flex-col justify-between text-[9px] text-slate-400 font-mono">
                        <div className="w-full flex justify-between border-t border-dashed border-slate-200 pt-0.5">
                          <span>Max Scale (27)</span>
                        </div>
                        <div className="w-full flex justify-between border-t border-dashed border-slate-200 pt-0.5">
                          <span>Severe Border (20)</span>
                        </div>
                        <div className="w-full flex justify-between border-t border-dashed border-slate-200 pt-0.5">
                          <span>Mid Point (10)</span>
                        </div>
                      </div>

                      {/* Score dots mapping */}
                      <div className="w-full flex justify-around relative z-10 font-bold text-xs h-full items-end pb-2">
                        {activePatient.psychometricScores.phq9.map((score, ind) => {
                          const percentHeightPhq = (score / 27) * 100;
                          const percentHeightGad = ((activePatient.psychometricScores.gad7?.[ind] || 0) / 21) * 100;

                          return (
                            <div key={ind} className="flex flex-col items-center gap-2 w-1/4">
                              <div className="flex gap-2 text-[10px]">
                                <span className="bg-indigo-600 text-white px-1 py-0.5 rounded shadow-xs" title="PHQ-9">
                                  P: {score}
                                </span>
                                {activePatient.psychometricScores.gad7?.[ind] !== undefined && (
                                  <span className="bg-emerald-600 text-white px-1 py-0.5 rounded shadow-xs" title="GAD-7">
                                    G: {activePatient.psychometricScores.gad7[ind]}
                                  </span>
                                )}
                              </div>
                              <div className="w-4 h-[120px] bg-slate-100 rounded-full overflow-hidden flex items-end">
                                <div
                                  className="w-full bg-indigo-500 rounded-b-full shadow-inner"
                                  style={{ height: `${percentHeightPhq}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">Session {ind + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-4 justify-center text-xs mt-3 border-t pt-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-indigo-500" />
                        PHQ-9 (Depressive Index)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        GAD-7 (Anxiety Index)
                      </span>
                    </div>
                  </div>

                  {/* Screener scores details metrics cards */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b pb-1">Historical Indexes Parameters</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
                        <span className="text-[10px] text-indigo-700 block font-bold uppercase">Latest PHQ-9 Status</span>
                        <span className="text-2xl font-black text-indigo-950 block mt-1">
                          {activePatient.psychometricScores.phq9.slice(-1)[0]}
                        </span>
                        <span className="text-[9px] text-indigo-800 font-semibold block uppercase">
                          {activePatient.psychometricScores.phq9.slice(-1)[0] >= 15 ? "Severe Depression" : "Mild to Moderate"}
                        </span>
                      </div>

                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                        <span className="text-[10px] text-emerald-700 block font-bold uppercase">Latest GAD-7 Status</span>
                        <span className="text-2xl font-black text-emerald-950 block mt-1 border-opacity-5">
                          {activePatient.psychometricScores.gad7?.slice(-1)[0] || 0}
                        </span>
                        <span className="text-[9px] text-emerald-800 font-semibold block uppercase">
                          {(activePatient.psychometricScores.gad7?.slice(-1)[0] || 0) >= 15 ? "Severe Anxiety" : "Mild to Moderate"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border rounded-lg text-xs text-slate-600 leading-relaxed space-y-1">
                      <span className="font-extrabold text-slate-800 block text-[10px] uppercase">Clinical Significance Analysis</span>
                      PHQ-9 scores between 10-14 correspond to Moderate, while GAD-7 scores above 15 signal severe functional anxiety limits requiring behavioral exposure programs context.
                    </div>
                  </div>

                </div>

                {/* LOG NEW PHQ-9 ACTIVE SCREENER */}
                <div id="phq-screener-modal" className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-5">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Interactive Diagnostic PHQ-9 Screener Survey</span>
                    <p className="text-xs text-slate-400 mt-0.5">Check patient responses for the last 2 weeks to calculate and sync status.</p>
                  </div>

                  <div className="space-y-3.5">
                    {phq9Questions.map((q, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/80 gap-3">
                        <span className="text-xs font-semibold text-slate-700">{idx + 1}. {q}</span>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                const next = [...phq9Answers];
                                next[idx] = val;
                                setPhq9Answers(next);
                              }}
                              className={`text-[10px] font-bold px-2.5 py-1.5 rounded transition ${
                                phq9Answers[idx] === val
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              }`}
                            >
                              {val === 0 ? "Not at all" : val === 1 ? "Several days" : val === 2 ? "More than half" : "Nearly every day"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="text-xs">
                      <span className="text-slate-400">Total Aggressive Aggregate: </span>
                      <span className="font-extrabold text-indigo-750 text-indigo-700 font-mono text-sm">
                        {phq9Answers.reduce((sum, curr) => sum + curr, 0)} / 27
                      </span>
                    </div>
                    <button
                      type="button"
                      id="save-phq-btn"
                      onClick={handleAddPhq9Score}
                      className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white px-5 py-2 rounded shadow-xs"
                    >
                      Log Score to Patient Record
                    </button>
                  </div>
                </div>

              </div>

              {/* MODULE 16: MEDICATION MANAGEMENT CONSOLE */}
              <div id="medication-card" className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                      <Heart className="w-5 h-5 text-red-500" />
                      Somatic & Psychiatric Medication Control Panel
                    </h3>
                    <p className="text-xs text-slate-400">Manage dose schedules, tracked adherence behaviors, and patient reported side-effects.</p>
                  </div>
                  {currentRole === UserRole.PSYCHOLOGIST && (
                    <span className="text-[10px] bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded font-bold">
                      PSYCHOLOGIST LOCK: Read Only
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Active Meds list table */}
                  <div className="lg:col-span-2 space-y-3">
                    {activePatient.currentMedications.length > 0 ? (
                      activePatient.currentMedications.map((med, index) => (
                        <div key={index} className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-sm text-slate-800">{med.name}</span>
                              <span className="text-xs text-slate-400 font-mono ml-2">({med.dose})</span>
                            </div>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                              {med.adherence}
                            </span>
                          </div>

                          <div className="text-xs text-slate-650 max-w-2xl leading-relaxed">
                            <span className="font-semibold text-slate-700 block mb-0.5">Reported Side Effects Tolerability:</span>
                            {med.sideEffects}
                          </div>

                          {/* ALERTS & ADHERENCE TRIGGER SYSTEM */}
                          <div className="mt-3.5 pt-3 border-t border-slate-200/60 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                                Patient Reminders & Adherence Alerts ({med.alerts?.length || 0})
                              </span>
                              {currentRole === UserRole.PSYCHIATRIST && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAlertConfigOpenIndex(alertConfigOpenIndex === index ? null : index);
                                  }}
                                  className="text-[10px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Plus className="w-3 h-3 text-indigo-600" />
                                  Add Alert Trigger
                                </button>
                              )}
                            </div>

                            {/* Expandable alert config form */}
                            {alertConfigOpenIndex === index && (
                              <div className="bg-white border border-slate-150 rounded-xl p-3.5 space-y-3 shadow-xs">
                                <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wide block border-b pb-1">
                                  Configure Frequency-Based Alert Guard
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Set Frequency</label>
                                    <select
                                      value={newAlertForm.frequency}
                                      onChange={(e) => setNewAlertForm({ ...newAlertForm, frequency: e.target.value })}
                                      className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-medium"
                                    >
                                      <option value="Daily">Daily Alert</option>
                                      <option value="Twice Daily">Twice Daily Alert</option>
                                      <option value="Weekly">Weekly Alert</option>
                                      <option value="PRN">PRN Interval</option>
                                      <option value="Every 12 Hours">Every 12 Hours Alert</option>
                                      <option value="Every 8 Hours">Every 8 Hours Alert</option>
                                      <option value="Custom">Custom Prescribed Hours</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Delivery Channel</label>
                                    <select
                                      value={newAlertForm.channel}
                                      onChange={(e) => setNewAlertForm({ ...newAlertForm, channel: e.target.value })}
                                      className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-medium"
                                    >
                                      <option value="SMS">SMS Message Alert</option>
                                      <option value="Email">Email Alert</option>
                                      <option value="In-App Popup">In-App Alert Notification</option>
                                      <option value="Push Notification">Push Notification</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Trigger Time Profile</label>
                                    <input
                                      type="text"
                                      value={newAlertForm.time}
                                      onChange={(e) => setNewAlertForm({ ...newAlertForm, time: e.target.value })}
                                      className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-mono"
                                      placeholder="e.g. 08:00 AM"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Reminding Instructions</label>
                                    <input
                                      type="text"
                                      value={newAlertForm.instructions}
                                      onChange={(e) => setNewAlertForm({ ...newAlertForm, instructions: e.target.value })}
                                      className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-medium"
                                      placeholder="e.g. Swallow with warm water after food"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setAlertConfigOpenIndex(null)}
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer transition"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleModifyMedAlert(index, "add", newAlertForm);
                                      setAlertConfigOpenIndex(null);
                                    }}
                                    className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded cursor-pointer transition"
                                  >
                                    Add Guard Alert
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Active reminders lists */}
                            <div className="space-y-1.5">
                              {med.alerts && med.alerts.length > 0 ? (
                                med.alerts.map((alert, alertIdx) => (
                                  <div
                                    key={alert.id}
                                    className={`p-2.5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs leading-none transition ${
                                      alert.isActive ? "bg-white border-slate-200 shadow-3xs" : "bg-slate-100/50 border-slate-150 opacity-60"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2 max-w-sm">
                                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-bold text-slate-800">{alert.frequency}</span>
                                          <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-1 py-0.5 rounded uppercase tracking-wider">
                                            {alert.channel}
                                          </span>
                                          <span className="text-slate-350 select-none">•</span>
                                          <span className="text-slate-500 font-mono font-bold text-[10px]">{alert.time}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 font-medium italic">"{alert.instructions}"</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0 select-none">
                                      <button
                                        type="button"
                                        onClick={() => handleModifyMedAlert(index, "toggle", { alertIndex: alertIdx })}
                                        className={`text-[9.5px] font-extrabold px-2 py-1 rounded-md border transition cursor-pointer ${
                                          alert.isActive
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-750"
                                            : "bg-slate-200 border-slate-300 text-slate-600"
                                        }`}
                                      >
                                        {alert.isActive ? "Active Guard" : "Disabled"}
                                      </button>

                                      {alert.isActive && (
                                        <button
                                          type="button"
                                          onClick={() => handleSimulateAlert(med.name, alert)}
                                          className="text-[9.5px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold px-2 py-1 rounded-md transition hover:bg-emerald-100 flex items-center gap-0.5 cursor-pointer"
                                        >
                                          ⚡ Simulate Remind
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleModifyMedAlert(index, "delete", { alertIndex: alertIdx })}
                                        className="text-slate-400 hover:text-red-600 p-1 rounded-md transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[10px] bg-white border border-dashed border-slate-200 text-slate-400 italic p-3 rounded-lg text-center font-medium leading-relaxed">
                                  No clinical frequency reminding guards structured for this medication schedule. Click "Add Alert Trigger" above to set.
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 border border-dashed rounded-lg text-center text-slate-400 text-xs">
                        No active psychiatric pharmacology documented for this patient.
                      </div>
                    )}
                  </div>

                  {/* Interaction Alerts Q&A and safety parameters */}
                  <div className="p-5 bg-red-50/50 border border-red-200/60 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-red-800 flex items-center gap-1 uppercase tracking-wider">
                      ⚠️ CDSS Medication Adherence Guard
                    </span>

                    <div className="space-y-2 text-[11px] text-red-800 font-medium">
                      <div className="bg-white p-2.5 rounded border border-red-100">
                        <span className="font-bold block text-red-950 mb-0.5">MAOI & SSRIs Warning</span>
                        Concurrent administration of serotonergic agents without complete wash times risks toxic Serotonin Syndrome. Keep active triggers disabled.
                      </div>

                      <div className="bg-white p-2.5 rounded border border-red-100">
                        <span className="font-bold block text-red-950 mb-0.5">Lamotrigine Titration Rule</span>
                        Escalate Lamotrigine strictly over 4-6 weeks (25mg increments) to eliminate hazard of Stevens-Johnson syndrome dermatological emergencies.
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 5: TELEHEALTH & ABDM INTEROPERABILITY */}
          {activeTab === "telehealth" && (
            <motion.div
              key="telehealth"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              id="tab-telehealth-viewport"
              className="space-y-6"
            >

              {/* MODULE 22: SECURE TELEPSYCHIATRY MODULE console */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-850 flex items-center gap-1.5">
                      <Video className="w-5.5 h-5.5 text-rose-500" />
                      HIPAA / ABDM Compliant Telepsychiatry Pipeline
                    </h3>
                    <p className="text-xs text-slate-400">Fully encrypted clinical videoconferencing with dynamic frame analytics.</p>
                  </div>

                  <button
                    id="telehealth-trigger"
                    onClick={() => {
                      setTeleSessionActive(teleSessionActive);
                      addAuditLog(teleSessionActive ? "Disconnected Telehealth Consulting Panel" : "Connected Telehealth Videoconference Port");
                    }}
                    className={`text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-all ${
                      teleSessionActive
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-sky-600 hover:bg-sky-700 text-white"
                    }`}
                  >
                    {teleSessionActive ? "Terminate Session" : "Join Consult Session"}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Webcam video placeholder frame */}
                  <div className="lg:col-span-2 bg-slate-900 rounded-xl relative overflow-hidden min-h-[300px] flex items-center justify-center text-white">
                    {teleSessionActive ? (
                      <div className="w-full h-full relative">
                        {stream ? (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-[320px] object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-full h-[320px] bg-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                            <Video className="w-12 h-12 text-sky-400 animate-pulse" />
                            <span className="font-bold text-sm block">Practitioner Web Video Connected</span>
                            <span className="text-[10px] text-slate-400 max-w-sm">
                              {cameraError || "Camera feed active."}
                            </span>
                          </div>
                        )}

                        {/* Patient simulation insert sub-box */}
                        <div className="absolute right-3 bottom-3 w-32 h-24 bg-slate-950 border-2 border-indigo-500 rounded-lg overflow-hidden flex items-end">
                          <img
                            src={activePatient.avatar}
                            alt="Patient stream"
                            className="w-full h-full object-cover opacity-80"
                          />
                          <span className="absolute bottom-1 left-1.5 text-[9px] bg-slate-950/80 px-1 py-0.5 rounded font-mono">
                            Remote Patient
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center max-w-sm space-y-3">
                        <Video className="w-12 h-12 text-slate-600 mx-auto" />
                        <span className="font-bold text-slate-300 block">Videoconferencing Offline</span>
                        <p className="text-xs text-slate-500">Enable session to join visual clinical diagnostic interactions with {activePatient.name}.</p>
                      </div>
                    )}
                  </div>

                  {/* Secure session messaging stream */}
                  <div className="bg-slate-50 border border-slate-205 rounded-xl p-5 flex flex-col h-[320px] justify-between">
                    <span className="text-xs font-bold text-slate-600 block border-b pb-1.5">Secure Consult Chat</span>

                    <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
                      {teleMessages.map((msg, i) => (
                        <div key={i} className={`p-2 rounded-lg ${
                          msg.sender === "System"
                            ? "bg-slate-200/60 text-slate-600 text-center text-[10px]"
                            : msg.sender === activePatient.name
                            ? "bg-indigo-50 text-indigo-950 self-start border border-indigo-100 max-w-[85%]"
                            : "bg-sky-50 text-sky-950 self-end border border-sky-100 max-w-[85%] ml-auto"
                        }`}>
                          <div className="flex justify-between items-center mb-0.5 text-[9px] font-bold text-slate-400">
                            <span>{msg.sender}</span>
                            <span>{msg.time}</span>
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <input
                        type="text"
                        disabled={teleSessionActive}
                        placeholder={teleSessionActive ? "Send message..." : "Join session to chat"}
                        value={newTeleMsg}
                        onChange={(e) => setNewTeleMsg(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendTeleMessage()}
                        className="flex-1 text-xs px-2.5 py-1.5 bg-white border rounded focus:outline-none focus:border-sky-500 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        disabled={teleSessionActive}
                        onClick={sendTeleMessage}
                        className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold p-1.5 rounded transition"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* MODULE 20-21: ABDM ABHA INTEGRATION & HL7 FHIR RECORD DOWNLOADING */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Ayushman Bharat India ABHA Card simulator */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                      <Award className="w-5 h-5 text-indigo-600" />
                      Ayushman Bharat Health Account (ABHA/ABDM) Digital ID card
                    </h4>
                    <p className="text-xs text-slate-400">Simulating real-world Indian health stack integration capabilities.</p>
                  </div>

                  {activePatient.abhaId ? (
                    <div className="p-5 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white rounded-2xl relative shadow-md overflow-hidden max-w-md mx-auto">
                      <div className="absolute top-0 right-0 p-5 opacity-10">
                        <Award className="w-24 h-24" />
                      </div>

                      <div className="flex justify-between items-start border-b border-white/20 pb-4">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-200">National Health Authority</span>
                          <h5 className="font-extrabold text-sm tracking-tight leading-none text-white mt-0.5">Government of India</h5>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          ABHA ACTIVE
                        </span>
                      </div>

                      <div className="flex gap-4 pt-5 items-center">
                        <img
                          src={activePatient.avatar}
                          alt="ID Photo"
                          className="w-14 h-14 rounded-lg object-cover border border-white/30"
                        />
                        <div className="text-xs leading-normal">
                          <span className="font-bold text-sm block">{activePatient.name}</span>
                          <div className="font-mono text-indigo-200 text-[10px] mt-1 space-y-0.5">
                            <div>ABHA Address: {activePatient.abhaId}</div>
                            <div>YOB: {activePatient.demographics.dob.split("-")[0]}</div>
                            <div>Gender: {activePatient.gender}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-5 border-t border-white/10 mt-5 text-[9px] text-indigo-300">
                        <span>Unified National Digital Health Mission</span>
                        <span className="font-mono bg-white text-slate-900 px-2 py-0.5 rounded text-[8px] font-bold">ABDM Sync ok</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed rounded-lg text-center text-slate-400 text-xs">
                      Active Patient h associated Indian ABDM ABHA credentials.
                    </div>
                  )}

                  <div className="bg-slate-50 border p-3.5 rounded-lg text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold block text-slate-805 mb-1 text-[10px] uppercase">ABDM Registry Sync Guidelines</span>
                    Validates the universal Ayushman Bharat token permitting psychiatrists to instantly review clinical prescriptions across public healthcare clinics globally.
                  </div>
                </div>

                {/* HL7 FHIR Interoperability payload viewer */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <DatabaseIcon className="w-5 h-5 text-teal-650 text-teal-600" />
                        HL7 FHIR JSON Interoperability resource payload
                      </h4>
                      <p className="text-xs text-slate-400">Exchanges files securely across modern hospital OpenMRS and Epic engines.</p>
                    </div>

                    <button
                      id="export-fhir-btn"
                      onClick={handleDownloadFhir}
                      className="text-xs bg-slate-850 hover:bg-slate-900 text-slate-800 border p-1.5 rounded flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      FHIR JSON
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      id="fhir-payload-box"
                      readOnly
                      value={activePatient.fhirRecord}
                      className="w-full h-[180px] p-3 border border-slate-205 rounded bg-slate-900 text-teal-400 font-mono text-[10.5px] leading-normal"
                    />
                    <span className="absolute bottom-2.5 right-3 text-[9px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded font-mono">
                      Bundle Resource JSON (read-only)
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 leading-relaxed">
                    HL7 (Health Level Seven) FHIR specifies international structured parameters for seamless patient care history synchronization.
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 6: PSYOS OPERATING SUITE CORE (25 MODULES INTEGRATION) */}
          {activeTab === "psyos" && (
            <motion.div
              key="psyos"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              id="tab-psyos-viewport"
              className="space-y-6"
            >
              {/* PRIMARY PROMINENT OPERATING SYSTEM CORE OVERVIEW HEADER */}
              <div className="bg-indigo-900 text-white rounded-2xl shadow-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 to-purple-950 opacity-90" />
                <div className="relative p-6 sm:p-8 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 px-3 py-1 rounded font-extrabold uppercase tracking-widest leading-none">
                        PsyPyrus Psychiatric OS Core • v2.6
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-15">
                        Unified Clinical Decision & Psychiatric Intelligence Engine
                      </h2>
                      <p className="text-xs sm:text-sm text-indigo-200 leading-normal max-w-2xl mt-0.5">
                        Synthesizing measurement-based outcomes, Ecological Momentary Assessments, passive digital phenotyping, and multi-agent AI guidelines inside a secure unified system.
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const statusList = ["Sanitizing Weights", "Encrypting Noise", "Transmitting Gradients", "Model Updated"];
                          setFedStatus("Sanitizing Weights");
                          statusList.forEach((st, idx) => {
                            setTimeout(() => {
                              setFedStatus(st);
                              if (st === "Model Updated") {
                                addAuditLog("Federated learning gradients pushed successfully to collaborative node network.");
                              }
                            }, (idx + 1) * 1000);
                          });
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition border border-indigo-500 flex items-center gap-1.5 shadow-sm"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Sync Fed Learning</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCrisisDispatchStatus("First-Line Dispatched");
                          addAuditLog(`CRITICAL SECURITY ACTION: Dispatch emergency contact communication plan for ${activePatient.name}`);
                          setTimeout(() => {
                            setCrisisDispatchStatus("Family Contact Notified");
                          }, 1500);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                        <span>Trigger Emergency Protocol</span>
                      </button>
                    </div>
                  </div>

                  {/* MINI BADGES GRID: 1-12 CORE MODULE CHECKERS */}
                  <div className="border-t border-indigo-805/60 pt-4">
                    <span className="text-[9.5px] font-bold text-indigo-300 uppercase tracking-widest block mb-2">
                      Sentry Node Compliance Matrix: Active & Offline Handlers
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 text-[10px]">
                      <div className="flex items-center gap-1.5 bg-indigo-950/45 p-2 rounded-lg border border-indigo-800/30">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-slate-100 truncate">1. Measurement (MBC)</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-indigo-950/45 p-2 rounded-lg border border-indigo-800/30">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-slate-100 truncate">2. Momentary (EMA)</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-indigo-950/45 p-2 rounded-lg border border-indigo-800/30">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-slate-100 truncate">3. Passive Phenotype</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-indigo-950/45 p-2 rounded-lg border border-indigo-800/30">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-slate-100 truncate">4. Wearable Streams</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-indigo-950/45 p-2 rounded-lg border border-indigo-800/30">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-slate-100 truncate">5. Life Timeline View</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-indigo-950/45 p-2 rounded-lg border border-indigo-800/30">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-slate-100 truncate">6. Trajectory Model</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TWO COLUMN BENTO GRID */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT BLOCK (2 COLS CAPACITY) */}
                <div className="xl:col-span-2 space-y-6">

                  {/* SECT 1: MBC & EMA WORKSPACE */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Activity className="w-4.5 h-4.5 text-indigo-600" />
                          Measurement-Based Care & EMA Tracking Hub
                        </h3>
                        <p className="text-[11px] text-slate-450">Standardized outcome measures (PHQ-9 / GAD-7) paired with Ecological Momentary Assessments.</p>
                      </div>
                      {/* CALCULATE PERCENTAGE IMPROVEMENT DYNAMICALLY */}
                      {(() => {
                        const history = mbcHistory[activePatientId] || [];
                        if (history.length >= 2) {
                          const first = history[0].phq9;
                          const last = history[history.length - 1].phq9;
                          const reduction = first > 0 ? Math.round(((first - last) / first) * 100) : 0;
                          return (
                            <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 font-black shrink-0">
                              ✨ Patient showing {reduction}% improvement over tracking cycle
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* MBC RECHARTS GRAPH */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10.5px]">
                          <span className="font-extrabold text-slate-700">PHQ-9 & GAD-7 Longitudinal Metrics</span>
                          <span className="text-slate-500 font-mono font-bold">PID: {activePatientId}</span>
                        </div>
                        <div className="h-52 w-full bg-slate-25/50 rounded-xl p-2 border border-slate-100" style={{ minWidth: "100px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={mbcHistory[activePatientId] || []}
                              margin={{ top: 12, right: 12, left: -22, bottom: 4 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={9.5} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={9.5} tickLine={false} domain={[0, 27]} />
                              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                              <Legend wrapperStyle={{ fontSize: 9.5 }} />
                              <Line type="monotone" dataKey="phq9" name="PHQ-9 (Depressive)" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
                              <Line type="monotone" dataKey="gad7" name="GAD-7 (Anxiety)" stroke="#ec4899" strokeWidth={2.5}  />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Interactive logger form */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">RECORD DATE</label>
                            <input
                              type="text"
                              id="mbc-date-input"
                              placeholder="e.g. Jun 2026"
                              className="w-full border border-slate-205 rounded p-1 text-xs select-text focus:outline-indigo-500 text-slate-800 font-semibold"
                              defaultValue="Jun 2026"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">PHQ-9 VALUE</label>
                            <input
                              type="number"
                              id="phq9-val-input"
                              min="0"
                              max="27"
                              className="w-full border border-slate-205 rounded p-1 text-xs focus:outline-indigo-500 text-slate-800 font-bold"
                              defaultValue="6"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">GAD-7 VALUE</label>
                            <input
                              type="number"
                              id="gad7-val-input"
                              min="0"
                              max="21"
                              className="w-full border border-slate-205 rounded p-1 text-xs focus:outline-indigo-500 text-slate-800 font-bold"
                              defaultValue="5"
                            />
                          </div>
                          <div className="col-span-3">
                            <button
                              type="button"
                              onClick={() => {
                                const dateVal = (document.getElementById("mbc-date-input") )?.value || "Jun 2026";
                                const phq9Val = parseInt((document.getElementById("phq9-val-input") )?.value || "0");
                                const gad7Val = parseInt((document.getElementById("gad7-val-input") )?.value || "0");
                                
                                const currentHistory = mbcHistory[activePatientId] || [];
                                const newRecord = {
                                  date: dateVal,
                                  phq9: phq9Val,
                                  gad7: gad7Val,
                                  outcomeSignal: `Adaptive rating updated. PHQ-9 recorded as ${phq9Val}.`
                                };
                                setMbcHistory({
                                  ...mbcHistory,
                                  [activePatientId]: [...currentHistory, newRecord]
                                });
                                addAuditLog(`Recorded Measurement-Based Care (MBC) outcome score: PHQ-9=${phq9Val}, GAD-7=${gad7Val} for ${activePatient.name}`);
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded text-[11px] font-extrabold cursor-pointer transition shadow-2xs text-center"
                            >
                              Append Measurement Record
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* EMA INTERACTIVE PASSIVE LOOP */}
                      <div className="space-y-4 border-l border-slate-50 pl-0 lg:pl-6">
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="font-extrabold text-indigo-950 uppercase tracking-widest flex items-center gap-1">
                            <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                            EMA (Ecological Momentary Assessment) Logger
                          </span>
                          <span className="bg-red-100 text-red-700 text-[8.5px] font-black tracking-widest px-1.5 py-0.5 rounded leading-none">REAL-TIME</span>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-150 space-y-3.5 text-xs">
                          <p className="text-[10px] text-slate-500 italic leading-relaxed">
                            Simulate active patient entering real-world ratings directly via local smartphone companion client.
                          </p>

                          {/* SLIDERS FOR EMA */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-705 mb-0.5">
                                <span>Mood Index ({currentEmaForm.mood}/10)</span>
                                <span className={currentEmaForm.mood < 4 ? "text-red-500 font-extrabold" : currentEmaForm.mood > 7 ? "text-green-500 font-extrabold" : "text-amber-500 font-extrabold"}>
                                  {currentEmaForm.mood < 4 ? "Anhedonic" : currentEmaForm.mood > 7 ? "Optimal" : "Stable"}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={currentEmaForm.mood}
                                onChange={(e) => setCurrentEmaForm({ ...currentEmaForm, mood: parseInt(e.target.value) })}
                                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg outline-none"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-705 mb-0.5">
                                <span>Anxiety Jitter ({currentEmaForm.anxiety}/10)</span>
                                <span className={currentEmaForm.anxiety > 6 ? "text-red-500 font-extrabold animate-pulse" : "text-slate-400"}>
                                  {currentEmaForm.anxiety > 6 ? "Acute Jitter" : "Minimal"}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={currentEmaForm.anxiety}
                                onChange={(e) => setCurrentEmaForm({ ...currentEmaForm, anxiety: parseInt(e.target.value) })}
                                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg outline-none"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-705 mb-0.5">
                                <span>Sleep Duration last night ({currentEmaForm.sleep} hrs)</span>
                                <span className={currentEmaForm.sleep < 5 ? "text-orange-500 font-extrabold" : "text-slate-400"}>
                                  {currentEmaForm.sleep < 5 ? "Sleep Deficit" : "Sufficient"}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="12"
                                value={currentEmaForm.sleep}
                                onChange={(e) => setCurrentEmaForm({ ...currentEmaForm, sleep: parseInt(e.target.value) })}
                                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg outline-none"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-705 mb-0.5">
                                <span>Stress Level ({currentEmaForm.stress}/10)</span>
                                <span className={currentEmaForm.stress > 7 ? "text-rose-500 font-extrabold animate-pulse" : "text-slate-400"}>
                                  {currentEmaForm.stress > 7 ? "High Strain" : "Adaptive"}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={currentEmaForm.stress}
                                onChange={(e) => setCurrentEmaForm({ ...currentEmaForm, stress: parseInt(e.target.value) })}
                                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const newEntry = {
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                patientId: activePatientId,
                                mood: currentEmaForm.mood,
                                anxiety: currentEmaForm.anxiety,
                                sleep: currentEmaForm.sleep,
                                stress: currentEmaForm.stress,
                                loggedVia: "Clinician Entry"
                              };
                              setEmaEntries([newEntry, ...emaEntries]);
                              addAuditLog(`Logged real-time Ecological Momentary Assessment (EMA) for ${activePatient.name}`);
                              
                              const agentLog = {
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
                                agent: "Diagnostic Agent",
                                action: `Synthesized momentary assessment. Current mood index: ${currentEmaForm.mood}/10, anxiety rating: ${currentEmaForm.anxiety}/10. Correlation metrics quiet.`,
                                color: "text-blue-600 font-bold"
                              };
                              setAgentLogs([agentLog, ...agentLogs]);
                            }}
                            className="w-full bg-slate-900 hover:bg-black text-white p-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Dispatch EMA Client Simulation</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* EMA RECENT LOGS TABLE */}
                    <div className="border-t border-slate-100 pt-4">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                        Active Stream Logs: Ecological Momentary Assessments (Filter: Current Patient)
                      </span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] leading-tight text-slate-600">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-[9px] uppercase tracking-wider">
                              <th className="pb-1.5 font-bold">Time Stamp</th>
                              <th className="pb-1.5 font-bold">Patient</th>
                              <th className="pb-1.5 font-bold text-center">Mood</th>
                              <th className="pb-1.5 font-bold text-center">Anxiety</th>
                              <th className="pb-1.5 font-bold text-center">Sleep Hrs</th>
                              <th className="pb-1.5 font-bold text-center">Stress</th>
                              <th className="pb-1.5 font-bold text-right">Source Route</th>
                            </tr>
                          </thead>
                          <tbody>
                            {emaEntries
                              .filter((x) => x.patientId === activePatientId)
                              .slice(0, 4)
                              .map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                                  <td className="py-2 font-mono font-bold text-slate-700">{item.timestamp}</td>
                                  <td className="py-2 font-semibold text-slate-900">{activePatient.name}</td>
                                  <td className="py-2 text-center">
                                    <span className={`px-1.5 py-0.5 rounded font-black text-[10px] ${item.mood >= 7 ? "bg-emerald-50 text-emerald-700" : item.mood <= 3 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                      {item.mood}/10
                                    </span>
                                  </td>
                                  <td className="py-2 text-center font-bold">{item.anxiety}/10</td>
                                  <td className="py-2 text-center font-bold text-indigo-700">{item.sleep} hrs</td>
                                  <td className="py-2 text-center">
                                    <span className={`font-semibold ${item.stress > 6 ? "text-rose-600" : "text-slate-500"}`}>
                                      {item.stress}/10
                                    </span>
                                  </td>
                                  <td className="py-2 text-right text-[10px] font-mono text-slate-400">{item.loggedVia}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* SECT 2: CLINICAL TIMELINE "LIFE CHART" & FORECASTING */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
                    <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Calendar className="w-4.5 h-4.5 text-indigo-600" />
                          Longitudinal Life Chart Timeline (Bipolar & Chronic Disorders)
                        </h3>
                        <p className="text-[11px] text-slate-405">Chronological display of diagnoses, medication titrations, hospital admissions, and therapy events.</p>
                      </div>
                      <span className="text-[9.5px] bg-slate-150 text-slate-700 font-bold px-2.5 py-1 rounded uppercase font-mono">
                        Active Patient: {activePatient.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* LIFE CHART TIMELINE TRACKS */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="relative pl-6 border-l border-indigo-100 ml-3 space-y-5 text-xs">
                          {/* DYNAMIC TIMELINE GENERATION COMPARED TO PATIENT */}
                          {activePatientId === 7 ? (
                            <>
                              <div className="relative">
                                <span className="absolute -left-[30px] top-0.5 bg-indigo-600 outline outline-4 outline-white text-white rounded-full w-4 h-4 flex items-center justify-center font-black text-[8px]" />
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-[10px] text-slate-400 font-mono tracking-wider">MARCH 2018</span>
                                  <h4 className="font-bold text-slate-800">Hypothyroidism Diagnostic Event</h4>
                                  <p className="text-slate-500 leading-normal">Diagnosed at primary clinic. Commenced thyroid supplemental replacement (Levothyroxine 70mcg daily) to stabilize somatic hormone profiles.</p>
                                </div>
                              </div>
                              <div className="relative">
                                <span className="absolute -left-[30px] top-0.5 bg-violet-600 outline outline-4 outline-white text-white rounded-full w-4 h-4 flex items-center justify-center font-black text-[8px]" />
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-[10px] text-slate-400 font-mono tracking-wider">SEPTEMBER 2021</span>
                                  <h4 className="font-bold text-slate-800">Moderate Recurrent Depressive Episode</h4>
                                  <p className="text-slate-500 leading-normal">Co-occurred with major lab deadline panic. Successfully managed using 12 weekly structured sessions of Cognitive Behavioral Therapy paired with Sertraline 50mg titration.</p>
                                </div>
                              </div>
                              <div className="relative animate-pulse">
                                <span className="absolute -left-[30px] top-0.5 bg-red-500 outline outline-4 outline-white text-white rounded-full w-4 h-4 flex items-center justify-center font-black text-[8px]" />
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-[10px] text-red-500 font-mono tracking-wider">JANUARY 2026 - CURRENT</span>
                                  <h4 className="font-bold text-slate-800 text-red-650">Sertraline Up-Titration (100mg) & Insomnia Flare</h4>
                                  <p className="text-slate-500 leading-normal">Worsening work strain led to depressive relapsing features and severe broken sleeping patterns (3-4 hours night). Sertraline titrated to 100mg.</p>
                                </div>
                              </div>
                            </>
                          ) : activePatientId === 8 ? (
                            <>
                              <div className="relative">
                                <span className="absolute -left-[30px] top-0.5 bg-indigo-600 outline outline-4 outline-white text-white rounded-full w-4 h-4 flex items-center justify-center font-black text-[8px]" />
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-[10px] text-slate-400 font-mono tracking-wider">JUNE 2022</span>
                                  <h4 className="font-bold text-slate-800">Court Incarceration & Detox Program</h4>
                                  <p className="text-slate-500 leading-normal">Admitted following severe compound DUI arrest. Initiated immediate phenobarbital-assisted physiological alcohol detox program over 7 days.</p>
                                </div>
                              </div>
                              <div className="relative">
                                <span className="absolute -left-[30px] top-0.5 bg-rose-500 outline outline-4 outline-white text-white rounded-full w-4 h-4 flex items-center justify-center font-black text-[8px]" />
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-[10px] text-slate-400 font-mono tracking-wider">MARCH 2026</span>
                                  <h4 className="font-bold text-slate-800">Self-Harm Escalation Protocol Triggered</h4>
                                  <p className="text-slate-500 leading-normal">Exhibited severe non-suicidal self-injury (cutting) wrist laceration requiring ER care. Collaborative suicide safety agreement executed.</p>
                                </div>
                              </div>
                              <div className="relative">
                                <span className="absolute -left-[30px] top-0.5 bg-teal-500 outline outline-4 outline-white text-white rounded-full w-4 h-4 flex items-center justify-center font-black text-[8px]" />
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-[10px] text-slate-400 font-mono tracking-wider">APRIL 2026</span>
                                  <h4 className="font-bold text-slate-800">Induction of Intravenous / Sublingual Ketamine Therapy</h4>
                                  <p className="text-slate-500 leading-normal">Received 4-cycle rapid ketamine session clinic-monitored. Suicidal active ideation resolved almost immediately. Significant compliance observed.</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="relative">
                                <span className="absolute -left-[30px] top-0.5 bg-indigo-600 outline outline-4 outline-white text-white rounded-full w-4 h-4 flex items-center justify-center font-black text-[8px]" />
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-[10px] text-slate-400 font-mono tracking-wider">OCTOBER 2020</span>
                                  <h4 className="font-bold text-slate-800">Generalized Anxiety Disorder (GAD) Clinical Intake</h4>
                                  <p className="text-slate-500 leading-normal">Formally diagnosed by university psychologist. Commenced Escitalopram 10mg daily morning to stabilize extreme academic panic spikes.</p>
                                </div>
                              </div>
                              <div className="relative animate-pulse">
                                <span className="absolute -left-[30px] top-0.5 bg-amber-500 outline outline-4 outline-white text-white rounded-full w-4 h-4 flex items-center justify-center font-black text-[8px]" />
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-[10px] text-slate-400 font-mono tracking-wider">JUNE 2026 (NOW)</span>
                                  <h4 className="font-bold text-slate-800">Tapering Plan due to Planned Pregnancy Strategy</h4>
                                  <p className="text-slate-500 leading-normal">Discussing prenatal psychiatric support protocols. Clinical plan initiated for gradual taper off Escitalopram 10mg to 5mg under intensive maternal tracking supervision.</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* LONGITUDINAL TRAJECTORY FORECASTER */}
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="font-black text-rose-900 uppercase text-[9px] tracking-widest block bg-rose-50 border border-rose-100 p-1.5 rounded text-center animate-pulse">
                            ⚠️ RELAPSE RELIABILITY MATRIX PROGRESSION
                          </span>

                          {/* COMPUTE RISK TRAJECTORY DYNAMICALLY BASED ON CURRENT DIGITAL PHENOTYPE */}
                          {(() => {
                            const stats = wearableStreams[activePatientId] || { sleep: 7.2, screenTime: 180 };
                            let computedRelapseRisk = Math.min(95, Math.max(5, Math.round((stats.screenTime / 400) * 50 + (8 - stats.sleep) * 12)));
                            
                            return (
                              <div className="space-y-3.5 text-xs text-slate-600">
                                <div>
                                  <div className="flex justify-between font-bold text-slate-705 text-[10px] mb-1">
                                    <span>Model Relapse Prediction Index</span>
                                    <span className={computedRelapseRisk > 60 ? "text-red-700 font-black animate-pulse" : "text-emerald-700"}>
                                      {computedRelapseRisk}% Forecast Risk
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all duration-300 ${computedRelapseRisk > 60 ? "bg-red-500" : computedRelapseRisk > 30 ? "bg-amber-400" : "bg-emerald-500"}`}
                                      style={{ width: `${computedRelapseRisk}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-150 text-[10px] leading-relaxed italic border-l-4 border-l-indigo-550 font-mono select-text">
                                  "Patient exhibiting critical signals of sleep dysregulation and passive interaction. Estimated {computedRelapseRisk}% risk of depressive relapse within 6 months unless behavioral activation is deployed."
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Interactive adjustments */}
                        <div className="space-y-2.5">
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block">Simulation Presets</span>
                          <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                            <button
                              type="button"
                              onClick={() => {
                                setWearableStreams({
                                  ...wearableStreams,
                                  [activePatientId]: { sleep: 3.5, steps: 1200, screenTime: 420, typingSpeed: 75, mobility: 30, hrv: 14 }
                                });
                                addAuditLog(`Simulated Sleep Deficit Crisis state on wearables for ${activePatient.name}`);
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-700 py-1.5 px-2 rounded border border-red-200 transition font-extrabold cursor-pointer text-center"
                            >
                              Stress & Insomnia
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setWearableStreams({
                                  ...wearableStreams,
                                  [activePatientId]: { sleep: 8.2, steps: 11000, screenTime: 120, typingSpeed: 160, mobility: 85, hrv: 55 }
                                });
                                addAuditLog(`Simulated Optimal Vagally-Regulated State on wearables for ${activePatient.name}`);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1.5 px-2 rounded border border-emerald-200 transition font-extrabold cursor-pointer text-center"
                            >
                              Vagal Recovery
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* SECT 3: EXPLAINABLE AI (XAI) & PATHWAYS */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
                    <div className="border-b border-slate-50 pb-4">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Brain className="w-4.5 h-4.5 text-indigo-600" />
                        Explainable AI (XAI) Diagnostic Attribution Engine
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold">Deep causal factor attribution parameters validating AI-calculated diagnostic confidence thresholds.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs leading-normal">
                      {Object.keys(xaiConfidence).map((diag) => {
                        const details = xaiConfidence[diag];
                        return (
                          <div key={diag} className="bg-slate-50 border border-slate-150 rounded-xl p-4.5 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-800 text-xs tracking-tight">{diag}</span>
                              <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                {details.confidence}% Confidence
                              </span>
                            </div>

                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${details.confidence}%` }} />
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">Attributed Phenotypic Elements:</span>
                              <ul className="space-y-1">
                                {details.factors.map((f, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-slate-600 font-medium">
                                    <span className="text-blue-500 font-bold shrink-0">✓</span>
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex gap-1.5 items-center pt-2 border-t border-slate-200/50">
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">Adj Weight:</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={details.confidence}
                                onChange={(e) => {
                                  const newConf = parseInt(e.target.value);
                                  setXaiConfidence({
                                    ...xaiConfidence,
                                    [diag]: { ...details, confidence: newConf }
                                  });
                                  addAuditLog(`Clinician updated differential diagnosis weight parameters for other psychiatric criteria: ${diag}=${newConf}%`);
                                }}
                                className="flex-1 accent-indigo-600 cursor-pointer h-1 bg-slate-200 rounded-lg outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* CAUSAL REASONING GRAPH PREVIEW */}
                    <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 font-mono text-[10.5px]">
                      <div className="flex justify-between items-center text-[10px] border-b border-slate-800 pb-2 mb-2">
                        <span className="text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <DatabaseIcon className="w-3.5 h-3.5 text-teal-400" /> Causal Knowledge Graph Pathways (Hierarchical Spec)
                        </span>
                        <span className="text-[9px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded">GROUNDED MATRIX</span>
                      </div>
                      <div className="grid grid-cols-5 items-center text-center gap-2 select-none">
                        <div className="bg-slate-850 p-2.5 rounded border border-slate-700">
                          <span className="text-[9.5px] font-bold block text-indigo-300">Wearables Sleep</span>
                          <span className="text-[10px] text-slate-400">Deficit &lt; 5h</span>
                        </div>
                        <div className="text-slate-500 font-bold">➔</div>
                        <div className="bg-slate-850 p-2.5 rounded border border-slate-700">
                          <span className="text-[9.5px] font-bold block text-indigo-300">Somatic Fatigue</span>
                          <span className="text-[10px] text-slate-400">Anhedonia Risk</span>
                        </div>
                        <div className="text-slate-500 font-bold">➔</div>
                        <div className="bg-slate-850 p-2.5 rounded border border-slate-700 animate-pulse">
                          <span className="text-[9.5px] font-bold block text-red-400">Suicidal Ideation</span>
                          <span className="text-[10px] text-slate-400">Passive (MODERATE)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECT 4: EVIDENCE BASED CLINICAL GUIDELINE ENGINE */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <BookOpen className="w-4.5 h-4.5 text-indigo-600" />
                          Psychiatric Evidence Guideline Engine (DSM-ICD-HiTOP Integrated)
                        </h3>
                        <p className="text-[11px] text-slate-400">Cross-reference active patient profile against global authority criteria sets dynamically.</p>
                      </div>
                      <div className="bg-slate-100 p-1.5 rounded-lg flex items-center gap-1 font-sans text-[10px] font-extrabold">
                        {["APA", "NICE", "WHO"].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setGuidelineFilter(item);
                              addAuditLog(`Loaded active medical guidelines: ${item} Framework`);
                            }}
                            className={`px-3 py-1 rounded transition-all cursor-pointer uppercase ${guidelineFilter === item ? "bg-white text-indigo-600 shadow-2xs font-extrabold" : "text-slate-500"}`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-50/50 p-4.5 rounded-xl border border-indigo-100 text-xs text-slate-700 leading-relaxed space-y-3">
                      <div className="flex items-center gap-2 text-indigo-950 font-bold">
                        <Award className="w-4 h-4 text-indigo-650 animate-pulse" />
                        <span>Dynamically Calculated Clinical Recommendation ({guidelineFilter} Protocol Specification):</span>
                      </div>
                      
                      {guidelineFilter === "APA" ? (
                        <p>
                          <strong>APA Recommendation for {activePatient.name} ({activePatient.riskAssessment.level} Risk Depressive state):</strong> First-line intervention requires therapeutic titration of Sertraline to 100mg (completed) paired with standardized 12-week Cognitive Behavioral Therapy (CBT) covering cognitive restructuring and behavioral activation. Monitor daily via companion Ecological momentary feedback loops. If sleep deficit persists above 4 weeks, consider structural low-dose Trazodone supplementation (25-50mg QHS).
                        </p>
                      ) : guidelineFilter === "NICE" ? (
                        <p>
                          <strong>NICE Guidelines for {activePatient.name}:</strong> Deploy High-Intensity Psychological Interventions (structured weekly CBT or IPT)  pathway. Pharmacological support may be run concurrently given symptom duration exceeds 4 months with severe functional impairment. Routine laboratory screening for thyroid markers (TSH, free T4) required in active hypothyroidism to rule out endocrinology contributions behind sleep anhedonia features.
                        </p>
                      ) : (
                        <p>
                          <strong>WHO mhGAP Guidelines for {activePatient.name}:</strong> Facilitate psychoeducation regarding depressive episodes for both patient and primary support systems. Routine benzodiazepine utilization is strictly contraindicated. Implement standardized progress scoring intervals. Mobilize employment, residential, and social support assets (Social Determinants of Health integration).
                        </p>
                      )}

                      <div className="flex gap-2.5 pt-2 border-t border-indigo-100/50 text-[10px] text-indigo-800 font-semibold font-mono">
                        <span className="flex items-center gap-1">✓ Evidence Level: Class 1a Meta-Analysis</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">✓ Precision Targeting: Phenotype Compliant</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT BLOCK (1 COL CAPACITY) */}
                <div className="space-y-6">

                  {/* DIGITAL PHENOTYPING PASSIVE WEARABLES CARD */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Smartphone className="w-4.5 h-4.5 text-indigo-600" />
                        Digital Phenotyping & Wearables
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold">Passive telemetry stream analytics from client consumer wearables.</p>
                    </div>

                    {(() => {
                      const stats = wearableStreams[activePatientId] || { sleep: 7.2, steps: 8400, screenTime: 180, typingSpeed: 145, mobility: 82, hrv: 48 };
                      return (
                        <div className="space-y-3.5 text-xs">
                          {/* Heart Rate Variability HRV */}
                          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl leading-none">
                            <div className="space-y-0.5">
                              <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Heart Rate Variability (HRV)</span>
                              <span className="font-mono font-black text-slate-800 text-sm">{stats.hrv} ms</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${stats.hrv < 25 ? "bg-red-50 text-red-700 animate-pulse" : stats.hrv < 40 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                              {stats.hrv < 25 ? "Vagal Deficit" : stats.hrv < 40 ? "Moderate" : "Optimized"}
                            </span>
                          </div>

                          {/* Passive typing speed latency jitter indicator */}
                          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl leading-none">
                            <div className="space-y-0.5">
                              <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Typing Speed Jitter</span>
                              <span className="font-mono font-black text-slate-800 text-sm">{stats.typingSpeed} ms latency</span>
                            </div>
                            <span className="px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[9.5px] font-bold uppercase">
                              Phenotype Jitter
                            </span>
                          </div>

                          {/* Screen time & sleep tracker */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl leading-none space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Mobile Screen Time</span>
                              <span className="font-mono font-black text-slate-900 text-sm block">{stats.screenTime} min</span>
                              <span className="text-[9.5px] text-slate-400">Daily interaction duration</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl leading-none space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Physical Mobility index</span>
                              <span className="font-mono font-black text-slate-900 text-sm block">{stats.mobility}%</span>
                              <span className="text-[9.5px] text-slate-405">Geo-location variance</span>
                            </div>
                          </div>

                          <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200 text-[10.5px] text-amber-900 flex gap-1.5 leading-relaxed">
                            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                              Privacy and continuous clinician consent models are actively running. Stream telemetry utilizes client encryption and anonymization protocols.
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* COLLABORATIVE PSYCHOTHERAPY WORKSPACE WORKSHEETS */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                    <div className="border-b border-slate-50 pb-3">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Users className="w-4.5 h-4.5 text-indigo-600" />
                        Psychotherapy & CBT Studio Room
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold">Review patient goals, cognitive restructure homework sheets, and DBT diaries.</p>
                    </div>

                    <div className="space-y-4 text-xs font-sans">
                      {/* Interactive goal management */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Patient Recovery-Oriented Goals</span>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                          {(recoveryGoals[activePatientId] || []).map((goal) => (
                            <label
                              key={goal.id}
                              className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-150 hover:bg-slate-100/50 cursor-pointer text-slate-700 leading-tight"
                            >
                              <input
                                type="checkbox"
                                checked={goal.completed}
                                onChange={() => {
                                  const updatedGoals = (recoveryGoals[activePatientId] || []).map((x) =>
                                    x.id === goal.id ? { ...x, completed: x.completed } : x
                                  );
                                  setRecoveryGoals({ ...recoveryGoals, [activePatientId]: updatedGoals });
                                  addAuditLog(`Clinician updated recovery goal status: ${goal.text} (${goal.completed ? "COMPLETED" : "IN PROGRESS"})`);
                                }}
                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer shrink-0"
                              />
                              <div className="flex-1 space-y-0.5">
                                <span className={`font-semibold block text-[10.5px] ${goal.completed ? "line-through text-slate-400" : ""}`}>{goal.text}</span>
                                <span className="text-[8.5px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded uppercase tracking-wider font-extrabold">{goal.category}</span>
                              </div>
                            </label>
                          ))}
                        </div>

                        {/* Add new goal inline */}
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="Add goal..."
                            value={newGoalInput}
                            onChange={(e) => setNewGoalInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newGoalInput.trim()) {
                                const newGoal = { id: `g_new_${Date.now()}`, text: newGoalInput.trim(), category: newGoalCategory, completed: false };
                                setRecoveryGoals({ ...recoveryGoals, [activePatientId]: [...(recoveryGoals[activePatientId] || []), newGoal] });
                                setNewGoalInput("");
                                addAuditLog(`Added custom recovery-oriented goal for ${activePatient.name}: ${newGoal.text}`);
                              }
                            }}
                            className="flex-1 border text-[11px] p-1 border-slate-205 rounded uppercase select-text focus:outline-indigo-500"
                          />
                          <select
                            value={newGoalCategory}
                            onChange={(e) => setNewGoalCategory(e.target.value)}
                            className="text-[10px] border p-1 rounded font-bold cursor-pointer bg-slate-50"
                          >
                            <option value="Health">Health</option>
                            <option value="Career">Career</option>
                            <option value="Relationships">Social</option>
                            <option value="Leisure">Leisure</option>
                          </select>
                        </div>
                      </div>

                      {/* CBT WORKBOOK */}
                      <div className="border-t border-slate-100 pt-3.5 space-y-3">
                        <span className="text-[9.5px] font-bold text-indigo-950 uppercase block tracking-widest">
                          CBT Thought restructuring record
                        </span>
                        
                        <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-2 font-sans italic text-slate-600 text-[11px] leading-relaxed">
                          {(cbtHomework.filter((x) => x.patientId === activePatientId)).slice(0, 1).map((item, id) => (
                            <div key={id} className="space-y-1 text-left">
                              <span className="font-bold text-[9px] text-indigo-500 block not-italic uppercase tracking-wider">LATEST HOMEWORK ENTRY:</span>
                              <div className="font-extrabold text-[11px] text-slate-800">Situation: <span className="font-medium">"{item.situation}"</span></div>
                              <div className="font-semibold text-rose-700 leading-tight">Automatic Negative Thought: <span>"{item.autoThought}"</span></div>
                              <div className="font-black text-[9px] text-slate-400 not-italic uppercase tracking-widest block">Distorted Pattern: <span className="text-slate-900 italic font-medium lowercase">{item.cognitiveDistortion}</span></div>
                              <div className="font-semibold text-emerald-800 leading-tight">Rational Response: <span>"{item.rationalResponse}"</span></div>
                            </div>
                          ))}
                        </div>

                        {/* CBT FORM INPUTS INLINE */}
                        <div className="space-y-1.5 text-[10px] text-slate-700">
                          <input
                            type="text"
                            placeholder="Current Situation..."
                            value={newCbtForm.situation}
                            onChange={(e) => setNewCbtForm({ ...newCbtForm, situation: e.target.value })}
                            className="w-full border p-1.5 rounded select-text focus:outline-indigo-500 text-slate-800 font-semibold"
                          />
                          <input
                            type="text"
                            placeholder="Automatic Negative Thought..."
                            value={newCbtForm.autoThought}
                            onChange={(e) => setNewCbtForm({ ...newCbtForm, autoThought: e.target.value })}
                            className="w-full border p-1.5 rounded select-text focus:outline-indigo-500 text-slate-800 font-semibold"
                          />
                          <input
                            type="text"
                            placeholder="Empirical Rational Response..."
                            value={newCbtForm.rationalResponse}
                            onChange={(e) => setNewCbtForm({ ...newCbtForm, rationalResponse: e.target.value })}
                            className="w-full border p-1.5 rounded select-text focus:outline-indigo-500 text-slate-805 font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newCbtForm.situation || newCbtForm.autoThought || newCbtForm.rationalResponse) return;
                              const newEntry = {
                                date: new Date().toISOString().split('T')[0],
                                patientId: activePatientId,
                                situation: newCbtForm.situation,
                                autoThought: newCbtForm.autoThought,
                                cognitiveDistortion: newCbtForm.cognitiveDistortion,
                                rationalResponse: newCbtForm.rationalResponse,
                                outcomeRating: newCbtForm.outcomeRating
                              };
                              setCbtHomework([newEntry, ...cbtHomework]);
                              setNewCbtForm({ situation: "", autoThought: "", cognitiveDistortion: "Catastrophizing", rationalResponse: "", outcomeRating: 50 });
                              addAuditLog(`Composed new Psychotherapy Cognitive Restructuring record for PID-${activePatientId}`);
                            }}
                            className="w-full bg-slate-900 text-white hover:bg-black font-extrabold py-1.5 rounded cursor-pointer transition shadow-3xs text-center"
                          >
                            Add CBT Worksheet Entry
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MULTI-AGENT SENTRY PIPELINE STREAM SIMULATOR */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Cpu className="w-4.5 h-4.5 text-indigo-600" />
                          Multi-Agent Clinical Pipeline Sentry
                        </h3>
                        <p className="text-[11px] text-slate-400">Collaboration of specialized agents (Pharm, Diagnostic, Risk) on grounded logic.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const actionLogs = [
                            { time: new Date().toLocaleTimeString([], { hour12: false }), agent: "Research Matcher", action: "Matched active biomarker panel with ClinTrials database.", color: "text-amber-500 font-bold" },
                            { time: new Date().toLocaleTimeString([], { hour12: false }), agent: "Pharmacology Agent", action: "Validated Sertraline clearance indices matching renal clearance.", color: "text-emerald-500 font-bold" },
                            { time: new Date().toLocaleTimeString([], { hour12: false }), agent: "Risk Safeguard Agent", action: "No active self-harm keywords scanned in EMA logs. Standard monitor active.", color: "text-rose-500 font-bold" }
                          ];
                          setAgentLogs([...actionLogs, ...agentLogs]);
                          addAuditLog("Re-stimulated specialized AI medical agent pipeline collaboration logs.");
                        }}
                        title="Force recalculation and polling streams for current patient"
                        className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-205 rounded hover:scale-105 transition"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="bg-slate-950 rounded-xl p-3.5 text-[10.5px] font-mono leading-relaxed space-y-2 text-slate-400 h-[210px] overflow-y-auto selection:bg-slate-700">
                      {agentLogs.map((log, idx) => (
                        <div key={idx} className="border-b border-slate-900 pb-2 flex gap-1.5 items-start">
                          <span className="text-slate-500 text-[9.5px] block shrink-0">[{log.time}]</span>
                          <span className={`${log.color} shrink-0`}>{log.agent}:</span>
                          <span className="text-slate-200">{log.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FEDERATED PRIVACY LEARNING MODULE */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Shield className="w-4.5 h-4.5 text-indigo-600" />
                        Privacy Preserving Federated Node
                      </h3>
                      <p className="text-[11px] text-slate-400">Collaborative deep-learning model syncing without centralizing patient health items.</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5 text-xs font-semibold">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-extrabold text-slate-750">Node Sync Status</span>
                        <span className="font-mono bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                          {fedStatus}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 h-1.5 rounded-full">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 bg-indigo-600`}
                          style={{
                            width:
                              fedStatus === "Ready"
                                ? "0%"
                                : fedStatus === "Sanitizing Weights"
                                ? "25%"
                                : fedStatus === "Encrypting Noise"
                                ? "50%"
                                : fedStatus === "Transmitting Gradients"
                                ? "75%"
                                : "100%"
                          }}
                        />
                      </div>

                      <div className="text-[10px] leading-relaxed text-slate-500 italic block font-mono">
                        "Enables model training directly across multi-institution psychiatric databases. Patient data is scrubbed client-side and injected with Laplace differential privacy noise."
                      </div>
                    </div>
                  </div>

                  {/* SYNTHETIC PATIENT MEDICAL GENERATOR DATABASE */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Plus className="w-4.5 h-4.5 text-indigo-600" />
                          Synthetic Profile Generator (Simulator)
                        </h3>
                        <p className="text-[11px] text-slate-400 font-semibold font-sans">Instantly synthesize complete cases for residency training.</p>
                      </div>
                      <button
                        type="button"
                        disabled={generatingSynthetic}
                        onClick={() => {
                          setGeneratingSynthetic(true);
                          setTimeout(() => {
                            const newSynth = {
                              id: `SYN-${Math.floor(1000 + Math.random() * 9000)}`,
                              name: `Synthetic #${syntheticDatabase.length + 1} (${["Amelia", "Devon", "Ravi", "Teresa"][Math.floor(Math.random() * 4)]} Gray)`,
                              age: Math.floor(20 + Math.random() * 50),
                              primaryIndication: ["Persistent Depressive Disorder", "Panic Spectrums", "Bipolar Hypomanic Drift", "Post-Traumatic Stress (PTSD)"][Math.floor(Math.random() * 4)],
                              history: "Generated using deep psychiatric simulation tokens. High variance in sleep metrics.",
                              riskProfile: "Minimal active threats; high compliance potential."
                            };
                            setSyntheticDatabase([...syntheticDatabase, newSynth]);
                            setGeneratingSynthetic(false);
                            addAuditLog(`Synthesized artificial medical profile case: ${newSynth.name} (${newSynth.id})`);
                          }, 1000);
                        }}
                        className={`text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded transition shadow-2xs flex items-center gap-1 cursor-pointer`}
                      >
                        {generatingSynthetic ? "Generating..." : "Synthesize Case"}
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                      {syntheticDatabase.map((caseProfile) => (
                        <div key={caseProfile.id} className="bg-slate-50 border border-slate-150 p-3 rounded-xl hover:bg-slate-100/30 transition text-xs space-y-1">
                          <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                            <span>{caseProfile.name}</span>
                            <span className="font-mono text-indigo-700 text-[10px]">{caseProfile.id}</span>
                          </div>
                          <p className="font-semibold text-indigo-900 text-[10.5px]">Indication: {caseProfile.primaryIndication}</p>
                          <p className="text-slate-500 text-[10px] leading-tight select-text italic">"{caseProfile.history}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RESIDENT EDUCATIONAL CLINICAL QUIZ */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                    <div className="border-b border-slate-50 pb-3">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Award className="w-4.5 h-4.5 text-indigo-600" />
                        Resident Academy: Board Quiz Core
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold font-sans">Simulated diagnostic boards for training psychology, psychiatry, and nursing residents.</p>
                    </div>

                    {/* QUIZ PORTAL */}
                    {(() => {
                      const questionsList = [
                        {
                          text: "Which model of hierarchical classification incorporates spectrums (like 'Internalizing' or 'Thought Disorder') to capture co-morbid sign groupings?",
                          options: ["A) DSM-5-TR", "B) HiTOP (Hierarchical Taxonomy)", "C) ICD-11 Spectrum System", "D) Standard Binary Classifiers"],
                          correct: 1,
                          explanation: "The Hierarchical Taxonomy of Psychopathology (HiTOP) constructs continuous spectrums based on heavy empirical symptom co-occurrence models, bypassing arbitrary disease cutoffs."
                        },
                        {
                          text: "According to NICE and APA titration guidelines, what is the conservative escalation dosage parameter for Lamotrigine titration to avoid Stevens-Johnson syndrome?",
                          options: ["A) Initiate at 100mg from Day 1", "B) 25mg increments every 2 weeks maximum", "C) 50mg weekly increments", "D) High-dosage loading patterns"],
                          correct: 1,
                          explanation: "Lamotrigine must be started at 25mg/day for 14 days, followed by 50mg/day for 14 days, precisely to mitigate severe immunogenic epidermal necrolysis risks."
                        },
                        {
                          text: "Which of the following is considered a core dimension of the NIMH Research Domain Criteria (RDoC) matrix?",
                          options: ["A) Social Processes & Negative Valence Systems", "B) Binary Disease Entity Categories", "C) Standard SOAP narrative parameters", "D) Multiaxial GAF parameters"],
                          correct: 0,
                          explanation: "Research Domain Criteria (RDoC) incorporates domains such  Valence, Cognitive Systems, and Social Processes across multi-system levels from genetics to behaviors."
                        }
                      ];

                      const activeQ = questionsList[quizIndex % questionsList.length];

                      return (
                        <div className="space-y-4 text-xs font-sans">
                          {/* Progress and score tracker */}
                          <div className="flex justify-between items-center text-[10.5px] bg-slate-50 p-2 rounded-lg border border-slate-150">
                            <span className="font-bold text-slate-600 uppercase tracking-wide">Board Quiz Mode</span>
                            <span className="font-extrabold text-indigo-700">Resident Score: {quizScore} Correct • Q{quizIndex + 1}</span>
                          </div>

                          <div className="space-y-2">
                            <p className="font-extrabold text-slate-800 text-[11.5px] leading-relaxed select-text">
                              Q: {activeQ.text}
                            </p>

                            <div className="space-y-1.5">
                              {activeQ.options.map((opt, id) => (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => {
                                    if (quizStatus == "unanswered") return;
                                    setSelectedQuizOption(id);
                                  }}
                                  className={`w-full text-left p-2.5 rounded-lg border text-slate-705 transition font-semibold block cursor-pointer text-[10.5px] ${
                                    quizStatus == "unanswered"
                                      ? id === activeQ.correct
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold"
                                        : selectedQuizOption === id
                                        ? "bg-red-50 border-red-300 text-red-800 font-extrabold"
                                        : "bg-slate-50 border-slate-150 text-slate-400"
                                      : selectedQuizOption === id
                                      ? "bg-indigo-50 border-indigo-300 text-indigo-800 font-bold"
                                      : "bg-white border-slate-200 hover:bg-slate-50/50"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>

                            {quizStatus === "unanswered" && selectedQuizOption == null && (
                              <button
                                type="button"
                                onClick={() => {
                                  const isCorrect = selectedQuizOption === activeQ.correct;
                                  setQuizStatus(isCorrect ? "correct" : "incorrect");
                                  if (isCorrect) setQuizScore(quizScore + 1);
                                  addAuditLog(`Resident submitted board test question response: ${isCorrect ? "PASSED" : "FAILED"}`);
                                }}
                                className="w-full bg-slate-900 text-white font-bold p-2 rounded transition cursor-pointer hover:bg-black uppercase text-center"
                              >
                                Submit Board Answer
                              </button>
                            )}

                            {quizStatus == "unanswered" && (
                              <div className="space-y-2.5 bg-indigo-50/40 p-3 rounded-lg border border-indigo-100 mt-2">
                                <p className="text-[10px] text-indigo-900 leading-normal italic font-semibold">
                                  <strong>Clinical Explanation:</strong> {activeQ.explanation}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuizIndex((quizIndex + 1) % questionsList.length);
                                    setQuizStatus("unanswered");
                                    setSelectedQuizOption(null);
                                  }}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold p-1.5 rounded text-[10px] transition uppercase cursor-pointer text-center"
                                >
                                  Next-Level Quiz Question ➔
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>

              </div>

            </motion.div>
          )}

          </AnimatePresence>

          {/* SYSTEM SIDE: BOTTOM AUDIT TRAILLING BLOCK */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest block">System Security Audit Metrics</span>
                <p className="text-[10px] text-slate-400">HIPAA compliant security telemetry recording clinical actions.</p>
              </div>
              <Lock className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="max-h-[140px] overflow-y-auto space-y-2 font-mono text-[10px] text-slate-500">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="flex justify-between hover:bg-slate-50 p-1.5 rounded transition">
                  <div className="flex gap-2">
                    <span className="text-slate-400">[{log.timestamp}]</span>
                    <span className="font-extrabold text-slate-800">{log.action}</span>
                  </div>
                  <div className="flex gap-2 font-semibold">
                    <span>by {log.user}</span>
                    <span className="bg-slate-150 text-slate-600 px-1 py-0.2 rounded text-[9px]">{log.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* RIGHT CHAT AUXILIARY CDSS COPILOT DOCK */}
      <aside className="w-80 bg-white border-l border-slate-200/80 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">CDSS Biological Copilot</h4>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">Ask for evidence-based DSM-5 specifiers, RDoC circuit evaluations, and HiTOP recommendations.</p>
        </div>

        {/* Conversation history block */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {copilotHistory.map((historyItem, i) => (
            <div key={i} className={`p-3 rounded-xl text-xs leading-relaxed ${
              historyItem.sender === "user"
                ? "bg-slate-100 text-slate-800 ml-5 font-medium"
                : "bg-indigo-50/70 border border-indigo-100 text-indigo-950 mr-5"
            }`}>
              <div className="font-bold text-[9px] text-slate-400 mb-0.5 uppercase">
                {historyItem.sender === "user" ? "You" : "PsyPyrus CDSS"}
              </div>
              <p className="whitespace-pre-line">{historyItem.text}</p>
            </div>
          ))}

          {isCopilotTyping && (
            <div className="bg-indigo-50/40 p-3 rounded-xl text-xs text-indigo-800 italic flex items-center gap-2 max-w-[80%] pr-5">
              <span>Generating expert insights...</span>
            </div>
          )}
        </div>

        {/* Input dialog */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {currentRole !== UserRole.PATIENT ? (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask copilot e.g. Differential for Insomnia..."
                  value={copilotQuestion}
                  onChange={(e) => setCopilotQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askCopilot()}
                  className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={askCopilot}
                  disabled={isCopilotTyping}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold p-2.5 rounded-lg transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-[9px] text-slate-400 leading-normal text-center pt-1.5">
                Outputs are contextually grounded using current active patient files.
              </div>
            </>
          ) : (
            <div className="p-2 bg-slate-50 text-[10px] text-slate-400 text-center rounded border">
              Diagnostic copilot locked for Patients
            </div>
          )}
        </div>
      </aside>

      {/* Keyboard Shortcuts Bento Modal */}
      {showShortcutsModal && (
        <div id="shortcuts-helper-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in font-sans">
            <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Clinician Keyboard Shortcuts Guidance
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Speed up clinical documentation and EHR navigation.</p>
              </div>
              <button 
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-slate-650 text-sm font-bold p-1 bg-slate-200/50 hover:bg-slate-200 rounded-full h-6 w-6 flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-805 block">Save Clinical Progress</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Saves active psychiatric notes and summaries.</span>
                  </div>
                  <kbd className="bg-white border rounded shadow-2xs text-[10px] font-mono px-2 py-1 font-bold text-slate-600 shrink-0">
                    Ctrl + S
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-805 block">Focus Patient Selector</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Instantly focuses active patient dropdown list.</span>
                  </div>
                  <kbd className="bg-white border rounded shadow-2xs text-[10px] font-mono px-2 py-1 font-bold text-slate-600 shrink-0">
                    Ctrl + P
                  </kbd>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-850 block">Cycle Workspace Module</span>
                    <span className="text-[10px] text-slate-405 mt-0.5">Switches to next active clinical tab.</span>
                  </div>
                  <kbd className="bg-white border rounded shadow-2xs text-[10px] font-mono px-2 py-1 font-bold text-slate-600 shrink-0">
                    Alt + Q
                  </kbd>
                </div>
              </div>

              <div className="bg-emerald-50 text-[10px] text-emerald-800 leading-relaxed p-3 border border-emerald-100 rounded-lg italic text-center">
                Note: Client notes are automatically persisted to cloud secure memory every 30 seconds if Autosave is toggled on.
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="bg-slate-900 hover:bg-black text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clinician Historical Notes Source Verification Modal */}
      {selectedNotesTimestamp && (
        <div id="risk-notes-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-fade-in font-sans">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center animate-in fade-in zoom-in-95 duration-150">
              <div>
                <span className="text-[10px] font-bold text-red-400 tracking-widest block uppercase">Risk Timestamp Source Verification</span>
                <h3 className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  Clinical Notes associated with {selectedNotesTimestamp.riskLevel} Risk level
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedNotesTimestamp(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 bg-slate-800 hover:bg-slate-700 rounded-full h-6 w-6 flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 border border-slate-150 p-3.5 rounded-xl">
                <div>
                  <span className="text-slate-400 block uppercase text-[9px] font-bold tracking-wider">Recorded Severity Level</span>
                  <span className="font-extrabold text-sm text-red-600 uppercase">
                    {selectedNotesTimestamp.riskLevel} Risk
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[9px] font-bold tracking-wider">Timestamp / Date</span>
                  <span className="font-bold text-sm text-slate-800">
                    {selectedNotesTimestamp.date}
                  </span>
                </div>
                <div className="col-span-2 border-t border-slate-200 pt-2.5">
                  <span className="text-slate-400 block uppercase text-[9px] font-bold tracking-wider">Note Source Document Location</span>
                  <span className="font-semibold text-xs text-slate-800 flex items-center gap-1 mt-0.5">
                    📄 {selectedNotesTimestamp.location}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Clinical Note Body Content</span>
                <div className="bg-white border text-left border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-line italic select-text">
                  "{selectedNotesTimestamp.text}"
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2 text-[11px] text-amber-800 leading-relaxed font-sans mt-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Confirm clinical continuity of protective safety agreements matching this session timestamp. This view verifies raw medical entries behind the automated risk triage indicators.
                </span>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedNotesTimestamp.text);
                  addAuditLog(`Copied verified risk note from timestamp: ${selectedNotesTimestamp.date}`);
                }}
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow-2xs"
              >
                Copy Note Text
              </button>
              <button
                type="button"
                onClick={() => setSelectedNotesTimestamp(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition shadow-2xs"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
