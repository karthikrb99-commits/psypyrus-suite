import React, { useState, useEffect } from "react";
import { GeminiService } from "../services/ai";
import { 
  FileText, 
  BrainCircuit, 
  Sparkles, 
  Loader2, 
  ClipboardCheck, 
  ThumbsUp, 
  Sparkle 
} from "lucide-react";

// CLINICAL NOTE TEMPLATES CONSTANTS
const DEPRESSION_TEMPLATE = `CLINICAL FOCUS: MAJOR DEPRESSIVE DISORDER (MDD) EVALUATION
SUBJECTIVE:
- Patient reports persistent low mood, deep anhedonia, and terminal insomnia (getting ~3-4 hours of broken sleep).
- Describes a constant lack of energy, difficulty initiating tasks, and strong feelings of worthlessness & guilt.
- Denies active suicidal ideation, intent, or plan; reports passive 'desire to escape reality'.

OBJECTIVE:
- Speech: Soft, low volume, prolonged response latencies.
- Behavior: Stooped posture, slowed movements consistent with mild psychomotor retardation.
- Affect: Restricted, congruent with depressed mood, occasional tearfulness.
- Screen: PHQ-9 score: 18 (Severe depression index).

ASSESSMENT:
- Major Depressive Disorder, single episode, moderate-to-severe (DSM-5-TR: F32.1).
- Secondary sleep maintenance insomnia related to acute depressive symptoms.

PLAN:
- Pharmacotherapy: Escalate Sertraline to 125mg for 1 week, then 150mg daily.
- Insomnia: Add Trazodone 50mg PO HS PRN for sleep.
- Psychotherapy: Refer to clinical psychologist for targeted Cognitive Behavioral Therapy (CBT-I).
- Risk/Safety: Complete safety contract. Review emergency numbers. Follow up in 2 weeks.`;

const ADHD_TEMPLATE = `CLINICAL FOCUS: ADHD CLINICAL PROGRESS & TITRATION ASSESSMENT
SUBJECTIVE:
- Patient complains of executive dysfunction, constant task-switching, high distractibility, and poor project follow-through.
- Describes high internal restlessness ('mind feels like a browser with 20 tabs open') and frequent working memory gaps.
- Denies prominent mood symptoms or panic episodes, but reports anxiety due to workload deficits.

OBJECTIVE:
- Appearance: Alert, slightly hyper-fidgety, tapping foot throughout interview.
- Speech: Rapid, highly fluent, speaks in long uninterrupted bursts.
- Thought Process: Tangential but coherent; shifts topics rapidly.
- Screen: ASRS-v1.1 screen positive (5/6 in Part A).

ASSESSMENT:
- Attention-Deficit/Hyperactivity Disorder, predominantly inattentive presentation (DSM-5-TR: F90.0).
- Secondary administrative occupational stress.

PLAN:
- Pharmacotherapy: Initiate titration of Methylphenidate ER 18mg daily in morning. Check blood pressure twice weekly.
- Behavioral: Introduce time-blocking, external checklist boards, and structured 'buffer days'.
- Cardiac Profile: Confirm baseline ECG normal prior to next visit escalation. Follow up in 2 weeks.`;

const ANXIETY_TEMPLATE = `CLINICAL FOCUS: GENERALIZED ANXIETY DISORDER (GAD) ASSESSMENT
SUBJECTIVE:
- Patient presents with near-constant daily worry about vocational deadlines, family safety, and somatic health.
- Mentions somatic anxiety symptoms: chronic muscle tension (tightness in shoulders/jaw), mild palpitations, tremulousness, and difficulty winding down.
- Denies discrete panic attacks or agoraphobia.

OBJECTIVE:
- Behavior: Restless, scanning room occasionally, fidgeting with shirt cuffs.
- Speech: Slightly tremulous and rapid, expressing high anticipatory worry.
- Affect: Anxious, tense, congruent with vocalized preoccupations.
- Screen: GAD-7 score: 15 (Severe anxiety indicators).

ASSESSMENT:
- Generalized Anxiety Disorder (DSM-5-TR: F41.1).
- Muscle tension and somatic hyper-arousal secondary to GAD.

PLAN:
- Pharmacotherapy: Start Escitalopram 10mg daily. Add Buspirone 5mg BID for augmented somatic anxiety coverage.
- Therapy: Referral for Acceptance and Commitment Therapy (ACT) to address worry loops.
- Lifestyle: Restrict stimulant intake (caffeine) after 1PM. PMR exercises. Follow up in 3 weeks.`;

const BIPOLAR_TEMPLATE = `CLINICAL FOCUS: BIPOLAR DISORDER (MANIC/HYPOMANIC EPISODE ASSESSMENT)
SUBJECTIVE:
- Patient presents with acute decrease in subjective need for sleep (sleeping 2-3 hours per night while feeling 'completely energized').
- Reports flight of ideas, intense creative surges, high distractibility, and embarking on multiple simultaneous high-risk business ventures.
- Denies prominent dysphoria, though admits to extreme irritability.

OBJECTIVE:
- Behavior: Extremely restless, pacing, intense grandiose posture, expansive hand gestures.
- Speech: Pressured, rapid, loud, difficult to interrupt.
- Thought Process: Marked flight of ideas, highly tangential, grandiose ideas regarding personal abilities and cosmic insights.
- Affect: Expansive, labile, euphoric, highly reactive.

ASSESSMENT:
- Bipolar I Disorder, current manic episode without psychotic features (DSM-5-TR: F31.1).
- Occupatory/social impairment high due to impulsive driving and high spending.

PLAN:
- Safety: Patient agrees to temporary family custody of credit cards to control spending hazards.
- Pharmacotherapy: Discontinue Escitalopram immediately to prevent antidepressant-induced mania. Check serum Lithium level. Start Olanzapine 5mg PO HS for acute antimanic stabilisation.
- Referrals: Collateral safety planning. Follow up in 4 days.`;

export default function IntakeMseSoapModule({
  activePatient,
  onChangePatient,
  rawIntake,
  setRawIntake,
  rawMse,
  setRawMse,
  rawSoap,
  setRawSoap,
  sessionSummary,
  setSessionSummary
}) {
  const [activeTab, setActiveTab] = useState("intake");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  // Local outputs for AI drafts
  const [generatedMse, setGeneratedMse] = useState("");
  const [generatedSoap, setGeneratedSoap] = useState("");
  const [transcriptInput, setTranscriptInput] = useState("");
  const [generatedSummary, setGeneratedSummary] = useState("");

  useEffect(() => {
    setGeneratedMse("");
    setGeneratedSoap("");
    setTranscriptInput(rawSoap || activePatient.rawSoapBullets || "");
    setGeneratedSummary(sessionSummary || "");
  }, [activePatient]);

  const handleAiAction = async (action) => {
    setIsSynthesizing(true);
    try {
      let promptText = "";
      let systemInstruction = "";
      let payloadText = "";

      if (action === "draft_mse") {
        payloadText = rawMse;
        systemInstruction = "You are a clinical psychiatry specialist. Transcribe a raw paragraph or set of clinical bullets into a high-quality, professional, objective Mental Status Examination (MSE) paragraph. Group observations into the standard 11 MSE domains (Appearance, Behavior, Speech, Mood, Affect, Thought Process, Thought Content, Perception, Cognition, Insight, Judgment). Remain strictly objective and professional. Do not use conversational filler or meta-talk. Response should be structured and clinical.";
        promptText = `Here are the psychiatric observations for drafting a detailed clinical MSE:\n"${payloadText}"`;
      } else if (action === "draft_soap") {
        payloadText = rawSoap;
        systemInstruction = "You are an expert mental health documentation officer. Compile session transcripts, clinician notes, or intake bullets into a highly polished, structured SOAP clinical note (Subjective, Objective, Assessment, Plan). Ensure the Subjective part captures client accounts, Objective captures indicators/MSE, Assessment includes clinical impressions, and Plan outlines goals and interventions. Avoid placeholders and generate realistic details.";
        promptText = `Compile the following intake or therapy session raw transcript/notes into a highly structured SOAP clinical note:\n"${payloadText}"`;
      } else if (action === "summarize_session") {
        payloadText = transcriptInput;
        systemInstruction = "You are an expert psychotherapist assistant. Summarize the following clinical session encounter transcript or notes into a brief, structured clinical summary. \nThe summary must highlight:\n1. Key Discussion Points\n2. Patient Sentiment & Emotional State (e.g., anxiety level, mood, emotional tone)\n3. Progress Towards Treatment Goals\nWrite in a professional, concise, objective, HIPAA-compliant format. Do not use conversational filler or meta-talk. Output a formatted structured note with clear headings for Key Discussion Points, Patient Sentiment, and Progress.";
        promptText = `Analyze and summarize the following session notes/transcript:\n"${payloadText}"`;
      }

      if (!payloadText.trim()) {
        alert("Please provide some text or observations to process.");
        setIsSynthesizing(false);
        return;
      }

      const responseText = await GeminiService.callGemini(promptText, systemInstruction);
      
      if (responseText) {
        if (action === "draft_mse") {
          setGeneratedMse(responseText);
        } else if (action === "draft_soap") {
          setGeneratedSoap(responseText);
        } else if (action === "summarize_session") {
          setGeneratedSummary(responseText);
        }
      } else {
        alert("Failed to utilize clinical synthesizer.");
      }
    } catch (e) {
      alert("Error contacting clinical AI bridge: " + e.message);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleApplyToPatient = (type) => {
    const updated = { ...activePatient };
    if (type === "intake") {
      updated.rawIntakeBullets = rawIntake;
    } else if (type === "mse") {
      updated.rawMseBullets = generatedMse || rawMse;
    } else if (type === "soap") {
      updated.rawSoapBullets = generatedSoap || rawSoap;
    } else if (type === "summary") {
      updated.sessionSummary = generatedSummary;
      setSessionSummary(generatedSummary);
    }
    onChangePatient(updated);
    alert(`Successfully applied and persisted ${type.toUpperCase()} updates to ${activePatient.name}'s medical record.`);
  };

  return (
    <div id="intake-mse-soap-root" className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Module Title Tab Header */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            Clinical Intake, Assessment & Summary Suite
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Psychiatric intake structures, AI Mental Status Exam (MSE), SOAP note compiler, and clinician-approved summaries.
          </p>
        </div>
        
        <div className="flex flex-wrap bg-slate-200/60 dark:bg-slate-800 p-1 rounded-lg gap-0.5">
          <button
            id="tab-intake"
            type="button"
            onClick={() => setActiveTab("intake")}
            className={`text-xs font-medium px-3 py-2 rounded-md transition-all ${
              activeTab === "intake" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/60"
            }`}
          >
            Psychiatric Intake
          </button>
          <button
            id="tab-mse"
            type="button"
            onClick={() => setActiveTab("mse")}
            className={`text-xs font-medium px-3 py-2 rounded-md transition-all ${
              activeTab === "mse" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/60"
            }`}
          >
            MSE Engine (AI)
          </button>
          <button
            id="tab-soap"
            type="button"
            onClick={() => setActiveTab("soap")}
            className={`text-xs font-medium px-3 py-2 rounded-md transition-all ${
              activeTab === "soap" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/60"
            }`}
          >
            SOAP Generator (AI)
          </button>
          <button
            id="tab-summary"
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`text-xs font-medium px-3 py-2 rounded-md transition-all ${
              activeTab === "summary" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/60"
            }`}
          >
            Session Summarizer (AI)
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === "intake" && (
          <div id="intake-panel" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                Intake Structured Summary
              </span>
              <button
                id="apply-intake-btn"
                onClick={() => handleApplyToPatient("intake")}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded cursor-pointer transition"
              >
                Save Intake to EHR
              </button>
            </div>
            <textarea
              id="intake-textarea"
              value={rawIntake}
              onChange={(e) => setRawIntake(e.target.value)}
              className="w-full h-80 p-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-sky-500 bg-slate-50 dark:bg-slate-950"
              placeholder="Enter comprehensive intake complaints, trauma history, developmental, and social notes..."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                <span className="font-semibold block text-slate-700 dark:text-slate-300 mb-0.5">Demographics Integrated</span>
                Directly maps patient intake concerns onto structural DSM classifications.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                <span className="font-semibold block text-slate-700 dark:text-slate-300 mb-0.5">Symptom Trackers</span>
                Logs active psychiatric parameters, sleep cycles, and daily anxiety levels.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                <span className="font-semibold block text-slate-700 dark:text-slate-300 mb-0.5">Clinical Collaboration</span>
                Changes are persisted dynamically across the electronic clinical workflow.
              </div>
            </div>
          </div>
        )}

        {activeTab === "mse" && (
          <div id="mse-panel" className="space-y-4">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-4">
              <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 block">AI-Powered Mental Status Evaluation</span>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed mt-0.5">
                  Provide raw, casual clinician bullet observations regarding Appearance, Speech, Mood, Affect, or Cognition, then compile. PsyPyrus drafts formal mental health narratives.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Observations Scratchpad (Appearance, Mood, Insight)</label>
                  <button
                    id="synthesize-mse-btn"
                    disabled={isSynthesizing}
                    onClick={() => handleAiAction("draft_mse")}
                    className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                  >
                    {isSynthesizing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating MSE...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Synthesize Draft
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="mse-raw-textarea"
                  value={rawMse}
                  onChange={(e) => setRawMse(e.target.value)}
                  className="w-full h-80 p-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-indigo-500"
                  placeholder="Appearance: Slightly disheveled. Speech: Pressured. Mood: Highly anxious, reports insomnia..."
                />
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 block uppercase tracking-wide">Structured Draft Output (HIPAA Compliant)</label>
                    {generatedMse && (
                      <button
                        id="apply-mse-btn"
                        onClick={() => handleApplyToPatient("mse")}
                        className="text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 px-2 py-1 rounded font-medium cursor-pointer transition"
                      >
                        Apply To Patient EHR
                      </button>
                    )}
                  </div>
                  {generatedMse ? (
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-sans whitespace-pre-line leading-relaxed h-[18rem] overflow-y-auto bg-white dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800 rounded">
                      {generatedMse}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 dark:text-slate-500 h-[18rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      <BrainCircuit className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                      <span>No compiled evaluation yet.</span>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Provide observations and click 'Synthesize Draft'.</p>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2 mt-4">
                  Reminder: All drafted content is subject to practitioner review, validation, and final medical clearance.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "soap" && (
          <div id="soap-panel" className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">AI SOAP Note Generator</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
                  Translate consultation logs, spoken transcripts, or therapy files into formal Subjective, Objective, Assessment, and Plan notes instantly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {/* Clinical Template Quick Picker */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest block">SOAP Clinical Note Templates</span>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      id="template-depression-btn"
                      type="button"
                      onClick={() => {
                        setRawSoap(DEPRESSION_TEMPLATE);
                      }}
                      className="text-[10px] text-slate-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 p-2 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      title="Load clinical template for Major Depressive Disorder (MDD)"
                    >
                      <span>🩺</span> Depression focused
                    </button>
                    <button
                      id="template-adhd-btn"
                      type="button"
                      onClick={() => {
                        setRawSoap(ADHD_TEMPLATE);
                      }}
                      className="text-[10px] text-slate-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 p-2 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      title="Load clinical template for ADHD Focus"
                    >
                      <span>🧠</span> ADHD focused
                    </button>
                    <button
                      id="template-anxiety-btn"
                      type="button"
                      onClick={() => {
                        setRawSoap(ANXIETY_TEMPLATE);
                      }}
                      className="text-[10px] text-slate-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 p-2 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      title="Load clinical template for Generalized Anxiety Disorder (GAD)"
                    >
                      <span>😰</span> Anxiety focused
                    </button>
                    <button
                      id="template-bipolar-btn"
                      type="button"
                      onClick={() => {
                        setRawSoap(BIPOLAR_TEMPLATE);
                      }}
                      className="text-[10px] text-slate-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 p-2 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      title="Load clinical template for Bipolar Manic Episode"
                    >
                      <span>🌀</span> Bipolar template
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Session Notes / Transcript Input</label>
                  <button
                    id="synthesize-soap-btn"
                    disabled={isSynthesizing}
                    onClick={() => handleAiAction("draft_soap")}
                    className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                  >
                    {isSynthesizing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating SOAP...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate SOAP Note
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="soap-raw-textarea"
                  value={rawSoap}
                  onChange={(e) => setRawSoap(e.target.value)}
                  className="w-full h-80 p-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-sky-500"
                  placeholder="Enter raw therapeutic dialog or bullet points..."
                />
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block uppercase tracking-wide">Structured SOAP Note Output</label>
                    {generatedSoap && (
                      <button
                        id="apply-soap-btn"
                        onClick={() => handleApplyToPatient("soap")}
                        className="text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 px-2 py-1 rounded font-medium cursor-pointer transition"
                      >
                        Apply To Patient EHR
                      </button>
                    )}
                  </div>
                  {generatedSoap ? (
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-sans whitespace-pre-line leading-relaxed h-[18rem] overflow-y-auto bg-white dark:bg-slate-950 p-3 border border-slate-100 dark:border-slate-800 rounded">
                      {generatedSoap}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 dark:text-slate-500 h-[18rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                      <span>No compiled SOAP notes yet.</span>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Compile and transition raw clinical logs in a click.</p>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2 mt-4">
                  Note: Standard medical charts require manual verification before applying findings permanently.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SESSION SUMMARIZER */}
        {activeTab === "summary" && (
          <div id="session-summarizer-panel" className="space-y-4">
            <div className="bg-sky-50 dark:bg-sky-950/20 p-4 rounded-lg border border-sky-100 dark:border-sky-900/40 flex items-start gap-3">
              <Sparkle className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-semibold text-sky-900 dark:text-sky-300 block">AI-Powered Session Summarization & Goal Monitor</span>
                <p className="text-xs text-sky-700 dark:text-sky-400 leading-relaxed mt-0.5">
                  Analyzes long session transcripts or detailed notes to extract **Key Discussion Points**, **Patient Sentiment**, and **Goal Benchmarks**. Practitioners must review and formally approve results before applying them to the records.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Encounter Notes / Dialogue Transcript</label>
                  <button
                    id="generate-summary-btn"
                    disabled={isSynthesizing}
                    onClick={() => handleAiAction("summarize_session")}
                    className="flex items-center gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
                  >
                    {isSynthesizing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating Summary...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Analyze & Summarize
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  id="summary-transcript-textarea"
                  value={transcriptInput}
                  onChange={(e) => setTranscriptInput(e.target.value)}
                  className="w-full h-80 p-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-sky-500"
                  placeholder="Enter detailed encounter transcripts, speech logs, or comprehensive clinician notes to generate the structured summary..."
                />
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-sky-800 dark:text-sky-400 block uppercase tracking-wide">Structured Draft Preview (Pending Clinician Approval)</label>
                    {generatedSummary && (
                      <button
                        id="approve-summary-btn"
                        onClick={() => handleApplyToPatient("summary")}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1 rounded inline-flex items-center gap-1 shadow-sm cursor-pointer transition"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        Approve & Apply Summary
                      </button>
                    )}
                  </div>
                  
                  {generatedSummary ? (
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-sans whitespace-pre-line leading-relaxed h-[18rem] overflow-y-auto bg-white dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 shadow-xs">
                      {generatedSummary}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 dark:text-slate-500 h-[18rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950">
                      <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
                      <span>No session summary drafted yet.</span>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Submit notes on the left to create a goal-oriented overview.</p>
                    </div>
                  )}
                </div>
                
                <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2 mt-4">
                  Note: Approved summaries are committed directly to progress notes in patient’s EHR profile summary.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
