import { useState, useEffect } from 'react';
import { Database } from '../../services/db';
import { GeminiService } from '../../services/ai';

// Custom Markdown Renderer for clinical outputs
function renderMarkdown(text) {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
        // Headings
        if (line.startsWith('### ')) {
            return <h3 key={idx} className="md-h3" style={{ color: 'var(--color-primary)', marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('#### ')) {
            return <h4 key={idx} className="md-h4" style={{ color: 'var(--text-light)', marginTop: '12px', marginBottom: '6px', fontWeight: 600 }}>{line.replace('#### ', '')}</h4>;
        }
        if (line.startsWith('## ')) {
            return <h2 key={idx} className="md-h2" style={{ color: 'var(--color-primary)', marginTop: '20px', marginBottom: '10px' }}>{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('# ')) {
            return <h1 key={idx} className="md-h1" style={{ color: 'var(--color-primary)', marginTop: '24px', marginBottom: '12px' }}>{line.replace('# ', '')}</h1>;
        }
        // Horizontal line
        if (line.trim() === '---') {
            return <hr key={idx} style={{ border: 'none', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />;
        }
        // Checkboxes
        if (line.trim().startsWith('* [x] ') || line.trim().startsWith('* [ ] ') || line.trim().startsWith('- [x] ') || line.trim().startsWith('- [ ] ')) {
            const checked = line.includes('[x]');
            const content = line.replace(/^[-*]\s*\[[x ]\]\s*/, '');
            return (
                <div key={idx} className="md-checkbox-line" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0', paddingLeft: '8px' }}>
                    <i className={checked ? "fa-solid fa-square-check" : "fa-regular fa-square"} style={{ color: checked ? 'var(--color-primary)' : 'var(--text-muted)' }}></i>
                    <span style={{ color: checked ? 'var(--text-light)' : 'var(--text-normal)' }}>{content}</span>
                </div>
            );
        }
        // Standard list item
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const content = parseInlineMarkdown(line.replace(/^[*+-]\s*/, ''));
            return <li key={idx} className="md-li" style={{ marginLeft: '20px', listStyleType: 'disc', margin: '6px 0', color: 'var(--text-normal)' }}>{content}</li>;
        }
        // Numbered list item
        if (/^\d+\.\s/.test(line.trim())) {
            const content = parseInlineMarkdown(line.replace(/^\d+\.\s*/, ''));
            return <li key={idx} className="md-li-numbered" style={{ marginLeft: '20px', listStyleType: 'decimal', margin: '6px 0', color: 'var(--text-normal)' }}>{content}</li>;
        }
        // Empty line
        if (!line.trim()) {
            return <div key={idx} style={{ height: '12px' }} />;
        }
        // Regular paragraph
        return <p key={idx} className="md-p" style={{ margin: '8px 0', lineHeight: '1.6', color: 'var(--text-normal)' }}>{parseInlineMarkdown(line)}</p>;
    });
}

function parseInlineMarkdown(text) {
    const parts = [];
    let currentIdx = 0;
    const regex = /(\*\*.*?\*\*|`.*?`|⚠️|📋|🎯|🛠️|📝|ℹ️)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > currentIdx) {
            parts.push(text.substring(currentIdx, match.index));
        }
        const token = match[0];
        if (token.startsWith('**') && token.endsWith('**')) {
            parts.push(<strong key={match.index} style={{ color: 'var(--text-light)', fontWeight: 700 }}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith('`') && token.endsWith('`')) {
            parts.push(<code key={match.index} style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9em', color: 'var(--color-primary)' }}>{token.slice(1, -1)}</code>);
        } else {
            parts.push(<span key={match.index}>{token}</span>);
        }
        currentIdx = regex.lastIndex;
    }
    if (currentIdx < text.length) {
        parts.push(text.substring(currentIdx));
    }
    return parts.length > 0 ? parts : text;
}

export function SOAPNotesCopilot({
    patients,
    activePatientId,
    onSetActivePatientId
}) {
    const [activeTab, setActiveTab] = useState('soap');
    const [transcript, setTranscript] = useState('');
    const [injectContext, setInjectContext] = useState(true);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    
    // Conversation history per patient per mode: { [patientId]: { [mode]: [ {role, content} ] } }
    const [sessionHistory, setSessionHistory] = useState({});
    const [followUpText, setFollowUpText] = useState('');
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    const [savedNotes, setSavedNotes] = useState([]);

    const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

    // Load patient's previous notes matching this tab type
    useEffect(() => {
        if (activePatientId) {
            const allNotes = Database.getClinicalNotes(activePatientId);
            // Map tabs to note types
            const noteTypes = {
                soap: 'SOAP',
                mse: 'MSE',
                risk: 'RISK',
                treatment: 'PLAN',
                summary: 'SUMMARY'
            };
            const filtered = allNotes.filter(n => n.noteType === noteTypes[activeTab]);
            setSavedNotes(filtered);
            setResult('');
        }
    }, [activePatientId, activeTab]);

    const modes = {
        soap: {
            label: "SOAP Notes",
            icon: "fa-file-waveform",
            placeholder: "Paste session transcript, clinical notes draft, or voice dictate to compile a formal medical SOAP note...",
            system: "You are a psychiatric clinical assistant. Convert conversational session transcripts into a formal medical SOAP note. Maintain full clinical clarity and use professional medical vocabularies.",
            prompt: (text) => `Compile the following transcript/draft into a structured, formal healthcare SOAP note. Include SUBJECTIVE, OBJECTIVE, ASSESSMENT, and PLAN. Suggest matching DSM-5, ICD-10/11, and SNOMED CT clinical terminology codes based on symptoms, as recommended by NRCeS India. Also map any assessment scores to standard LOINC codes (e.g. PHQ-9 as LOINC 44261-6, GAD-7 as LOINC 70274-6):\n\nTranscript/Notes:\n"${text}"`
        },
        mse: {
            label: "MSE Synthesizer",
            icon: "fa-clipboard-list",
            placeholder: "Type direct MSE draft observations (e.g. hygiene status, eye contact, speech rate, delusions, judgment)...",
            system: "You are an expert clinical psychologist writing formal Mental Status Exam summaries.",
            prompt: (text) => `Synthesize the following mental status observations and checklist ratings into a single, cohesive, formal psychiatric clinical narrative paragraph (Mental Status Examination prose block). Avoid bullet points in the final narrative, write in continuous clinical prose style:\n\nObservations:\n"${text}"`
        },
        risk: {
            label: "Risk Screening",
            icon: "fa-triangle-exclamation",
            placeholder: "Input concerns regarding suicide, self-harm, cognitive decline, violence risk, or extreme distress...",
            system: "You are a psychiatric crisis specialist. Assess patient risk level and draft a clinical safety plan.",
            prompt: (text) => `Analyze the following patient notes for risk factors (suicidal ideation, self-harm, cognitive disorientation, indicators of violence, etc.) and generate a safety framework with actionable steps:\n\nNotes:\n"${text}"`
        },
        treatment: {
            label: "Treatment Planner",
            icon: "fa-bullseye",
            placeholder: "Input desired therapeutic goals, interventions, diagnostic context, and duration...",
            system: "You are an evidence-based clinical treatment planning assistant.",
            prompt: (text) => `Convert the following therapeutic objectives into a formal evidence-based treatment plan with SMART goals, specific clinical interventions, and homework assignments:\n\nObjectives:\n"${text}"`
        },
        summary: {
            label: "Session Summarizer",
            icon: "fa-list-check",
            placeholder: "Paste raw notes or dialogue transcripts to summarize key themes and actionable items...",
            system: "You are a clinical supervisor generating session summaries for patients.",
            prompt: (text) => `Summarize this session transcript. Extract the executive summary, primary themes, core clinical takeaways, and patient homework action items:\n\nTranscript:\n"${text}"`
        }
    };

    const handleTemplate = (type) => {
        if (type === 'anxiety') {
            setTranscript("Patient reports worsening anxiety symptoms over the past 3 weeks, linked to increased corporate stressors. Describes sleep onset latency (~90 mins) and somatic signs including epigastric tightness, muscle scanning tension, and mild palpitations. Patient notes progress with diaphragmatic breathing but struggles when working over 50 hours/week.");
        } else if (type === 'depression') {
            setTranscript("Presented with recurrent low mood throughout the day. Slept 10 hours but complains of feeling fully unrefreshed, reports complete lock on feelings, feels like can't continue doing things. Thoughts of escape but has a good family core. Admits difficulty initiating minor activities.");
        } else if (type === 'mse_obs') {
            setTranscript("Well groomed male, 29. Appropriate dress. Cooperative and polite but exhibits nervous leg tapping. Speech rate slightly elevated but coherent. Affect Restricted, mood self-reported as 'stressed'. Thought content: no delusions, but excessive worry about career. Oriented x3. Insight Grade 4. Judgment Intact.");
        }
    };

    // Construct the background context about the patient from DB
    const compilePatientEhrContext = () => {
        if (!activePatient) return "";
        
        const assessments = Database.getAssessments(activePatient.id);
        const lastAssessments = assessments.slice(-3).map(a => `${a.type} score: ${a.score} (${a.details}) on ${new Date(a.date).toLocaleDateString()}`).join('; ');
        
        const homeworks = Database.getHomework(activePatient.id);
        const pendingHomework = homeworks.filter(h => !h.isCompleted).map(h => h.description).join('; ');
        
        return `[PATIENT CLINICAL CONTEXT]
Name: ${activePatient.name}
Age/Gender: ${activePatient.age} / ${activePatient.gender}
Assigned Risk Profile: ${activePatient.riskStatus}
Primary Diagnostic Category: ${activePatient.specialty}
Recent Assessments: ${lastAssessments || "None recorded"}
Pending Homework Tasks: ${pendingHomework || "None outstanding"}
[END CONTEXT]\n\n`;
    };

    const handleCompile = async () => {
        const text = transcript.trim();
        if (!text) return;

        setLoading(true);
        setResult('');

        const ehrContext = injectContext ? compilePatientEhrContext() : "";
        const systemInstruction = modes[activeTab].system;
        const promptText = ehrContext + modes[activeTab].prompt(text);

        try {
            // Initiate streaming/typewriter
            await GeminiService.callGemini(promptText, systemInstruction, [], (chunk) => {
                setResult(chunk);
            });

            // Save the conversation history in local React state
            const newHistory = [
                { role: 'user', content: promptText },
                { role: 'model', content: result } // will update below
            ];
            
            setSessionHistory(prev => ({
                ...prev,
                [activePatientId]: {
                    ...prev[activePatientId],
                    [activeTab]: newHistory
                }
            }));

        } catch (e) {
            alert(`Error compiling: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowUpSubmit = async (e) => {
        e.preventDefault();
        const followUp = followUpText.trim();
        if (!followUp || loading || !result) return;

        setLoading(true);
        setFollowUpText('');

        const patientHist = sessionHistory[activePatientId]?.[activeTab] || [];
        const systemInstruction = modes[activeTab].system;

        // Append current result if history is empty
        let updatedHist = [...patientHist];
        if (updatedHist.length === 0) {
            const ehrContext = injectContext ? compilePatientEhrContext() : "";
            updatedHist = [
                { role: 'user', content: ehrContext + modes[activeTab].prompt(transcript) },
                { role: 'model', content: result }
            ];
        }

        try {
            let streamingResult = "";
            await GeminiService.callGemini(followUp, systemInstruction, updatedHist, (chunk) => {
                streamingResult = chunk;
                setResult(chunk);
            });

            setSessionHistory(prev => ({
                ...prev,
                [activePatientId]: {
                    ...prev[activePatientId],
                    [activeTab]: [
                        ...updatedHist,
                        { role: 'user', content: followUp },
                        { role: 'model', content: streamingResult }
                    ]
                }
            }));
        } catch (err) {
            alert(`Error processing follow-up: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = () => {
        if (!result) return;

        const noteTypes = {
            soap: 'SOAP',
            mse: 'MSE',
            risk: 'RISK',
            treatment: 'PLAN',
            summary: 'SUMMARY'
        };

        Database.insertClinicalNote({
            patientId: activePatientId,
            title: `AI Copilot Output (${modes[activeTab].label})`,
            noteType: noteTypes[activeTab],
            bodyJson: result,
            isRiskAlert: result.toLowerCase().includes("risk: severe") || result.toLowerCase().includes("suicide") || result.toLowerCase().includes("self-harm")
        });

        // Trigger update to local list
        const allNotes = Database.getClinicalNotes(activePatientId);
        const filtered = allNotes.filter(n => n.noteType === noteTypes[activeTab]);
        setSavedNotes(filtered);

        // Notify user
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
    };

    const handleExportTxt = () => {
        const element = document.createElement("a");
        const file = new Blob([result], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `PsyPyrus_AI_${modes[activeTab].label}_Patient_${activePatientId}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const loadPastNote = (note) => {
        setResult(note.bodyJson);
    };

    return (
        <div className="screen-container active" id="screen-ai-copilot">
            {/* Custom styles nested inside for isolation */}
            <style>{`
                .copilot-workspace {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    margin-top: 16px;
                }
                @media (max-width: 992px) {
                    .copilot-workspace {
                        grid-template-columns: 1fr;
                    }
                }
                .copilot-tab-bar {
                    display: flex;
                    gap: 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    padding-bottom: 12px;
                    margin-bottom: 16px;
                    overflow-x: auto;
                }
                .copilot-tab {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    color: var(--text-muted);
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                    transition: all 0.2s ease;
                }
                .copilot-tab:hover {
                    background: rgba(255,255,255,0.06);
                    color: var(--text-light);
                }
                .copilot-tab.active {
                    background: var(--color-primary-glow);
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                    font-weight: 500;
                    box-shadow: 0 0 10px rgba(0, 242, 254, 0.15);
                }
                .copilot-pane-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .copilot-pane-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-light);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .copilot-output-display {
                    background: rgba(0,0,0,0.25);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                    padding: 20px;
                    min-height: 280px;
                    max-height: 520px;
                    overflow-y: auto;
                    font-family: inherit;
                    position: relative;
                }
                .follow-up-chat-box {
                    display: flex;
                    gap: 8px;
                    margin-top: 16px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    padding: 6px;
                }
                .follow-up-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: var(--text-light);
                    padding: 8px 12px;
                    font-size: 13px;
                }
                .follow-up-input:focus {
                    outline: none;
                }
                .token-counter-badge {
                    font-size: 11px;
                    color: var(--text-muted);
                    background: rgba(255,255,255,0.04);
                    padding: 2px 8px;
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .past-note-chip {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 12px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.04);
                    border-radius: 6px;
                    margin-bottom: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .past-note-chip:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.1);
                }
            `}</style>

            <div className="section-header-block">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <h2>AI Clinical Copilot Workstation</h2>
            </div>

            {/* Patient context selector */}
            <div className="workspace-card">
                <div className="form-field-group">
                    <label className="form-label">Active Clinical Subject Target:</label>
                    <div className="chips-horizontal-scroll" id="copilot-patient-chips">
                        {patients.map((pat) => (
                            <button 
                                key={pat.id}
                                className={`patient-filter-chip ${pat.id === activePatientId ? 'active' : ''}`}
                                onClick={() => onSetActivePatientId(pat.id)}
                            >
                                {pat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Workstation Mode Tabs */}
            <div className="copilot-tab-bar">
                {Object.entries(modes).map(([key, value]) => (
                    <button
                        key={key}
                        className={`copilot-tab ${activeTab === key ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(key);
                            setResult('');
                        }}
                    >
                        <i className={`fa-solid ${value.icon}`}></i>
                        {value.label}
                    </button>
                ))}
            </div>

            {/* Side-by-Side Workstation Grid */}
            <div className="copilot-workspace">
                
                {/* Left Panel: Inputs and Controls */}
                <div className="workspace-card" style={{ height: 'fit-content' }}>
                    <div className="copilot-pane-header">
                        <span className="copilot-pane-title">
                            <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--color-primary)' }}></i>
                            Source Input & Prompts
                        </span>
                        <span className="token-counter-badge">
                            {transcript.length} Chars (~{Math.ceil(transcript.length / 4)} Tokens)
                        </span>
                    </div>

                    <div className="form-field-group">
                        <textarea 
                            className="input-text-field" 
                            style={{ minHeight: '180px', maxHeight: '360px', width: '100%', boxSizing: 'border-box' }}
                            placeholder={modes[activeTab].placeholder}
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                        />
                    </div>

                    {/* Context Injection & Template Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <input 
                                type="checkbox" 
                                checked={injectContext} 
                                onChange={(e) => setInjectContext(e.target.checked)} 
                                style={{ accentColor: 'var(--color-primary)' }}
                            />
                            Inject EHR Patient Profile Context
                        </label>

                        <div className="chips-horizontal-scroll" style={{ margin: 0, padding: 0 }}>
                            <button className="patient-filter-chip" onClick={() => handleTemplate('anxiety')}>Anxiety Notes</button>
                            <button className="patient-filter-chip" onClick={() => handleTemplate('depression')}>Depression Notes</button>
                            <button className="patient-filter-chip" onClick={() => handleTemplate('mse_obs')}>MSE Obs</button>
                        </div>
                    </div>

                    {/* Execution Actions */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            className="action-button-btn" 
                            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={handleCompile}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loader-dual-ring"></span> 
                                    Processing Copilot...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-wand-magic-sparkles"></i> 
                                    Synthesize with AI
                                </>
                            )}
                        </button>
                        
                        <button 
                            className="action-button-btn secondary-btn" 
                            title="Voice dictation is currently in integration stage"
                            style={{ flex: 1, cursor: 'not-allowed', opacity: 0.6, display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }} 
                            disabled
                        >
                            <i className="fa-solid fa-microphone"></i> 
                            Dictate
                        </button>
                    </div>

                    {/* Past notes in this category */}
                    {savedNotes.length > 0 && (
                        <div style={{ marginTop: '24px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                                Saved {modes[activeTab].label} Reports:
                            </div>
                            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                {savedNotes.map(note => (
                                    <div key={note.id} className="past-note-chip" onClick={() => loadPastNote(note)}>
                                        <span>{note.title}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                            {new Date(note.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: AI Output & Document Workstation */}
                <div className="workspace-card" style={{ height: 'fit-content' }}>
                    <div className="copilot-pane-header">
                        <span className="copilot-pane-title">
                            <i className="fa-solid fa-file-invoice" style={{ color: 'var(--color-primary)' }}></i>
                            Generated Report Document
                        </span>
                        {result && (
                            <span className="token-counter-badge">
                                ~{Math.ceil(result.length / 4)} Generated Tokens
                            </span>
                        )}
                    </div>

                    <div className="copilot-output-display">
                        {loading && !result && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '16px' }}>
                                <div className="loader-dual-ring" style={{ width: '32px', height: '32px' }}></div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>AI is analyzing input & clinical histories...</span>
                            </div>
                        )}
                        {!result && !loading && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px', color: 'var(--text-muted)' }}>
                                <i className="fa-solid fa-terminal" style={{ fontSize: '24px', opacity: 0.3 }}></i>
                                <span style={{ fontSize: '13px' }}>No generated document loaded. Use actions on the left.</span>
                            </div>
                        )}
                        {result && renderMarkdown(result)}
                    </div>

                    {/* Document Management Actions */}
                    {result && (
                        <>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button className="action-button-btn" style={{ flex: 1, background: 'rgba(255,255,255,0.04)', color: 'var(--text-light)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={handleCopyToClipboard}>
                                    <i className="fa-solid fa-copy" style={{ marginRight: '6px' }}></i> Copy
                                </button>
                                <button className="action-button-btn" style={{ flex: 1, background: 'rgba(255,255,255,0.04)', color: 'var(--text-light)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={handleExportTxt}>
                                    <i className="fa-solid fa-download" style={{ marginRight: '6px' }}></i> Export Txt
                                </button>
                                <button className="action-button-btn" style={{ flex: 1.5, background: 'var(--color-primary-glow)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }} onClick={handleSaveNote}>
                                    <i className="fa-solid fa-folder-plus" style={{ marginRight: '6px' }}></i> Save to Chart
                                </button>
                            </div>

                            {/* Refine / Chat Follow-Up Box */}
                            <form className="follow-up-chat-box" onSubmit={handleFollowUpSubmit}>
                                <input 
                                    className="follow-up-input" 
                                    placeholder="Instruct Copilot to refine or edit this document (e.g. 'Add a medical rule-out')..."
                                    value={followUpText}
                                    onChange={(e) => setFollowUpText(e.target.value)}
                                    disabled={loading}
                                />
                                <button 
                                    type="submit" 
                                    className="patient-filter-chip active" 
                                    style={{ margin: 0, padding: '6px 12px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    disabled={loading || !followUpText.trim()}
                                >
                                    {loading ? (
                                        <span className="loader-dual-ring" style={{ width: '12px', height: '12px' }}></span>
                                    ) : (
                                        <i className="fa-solid fa-paper-plane"></i>
                                    )}
                                    Refine
                                </button>
                            </form>
                        </>
                    )}

                    {showCopySuccess && (
                        <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-circle-check"></i>
                            Action completed successfully. Note catalog synced with Local Storage EHR.
                        </div>
                    )}
                </div>
            </div>

            <div className="hipaa-alert-box warning" style={{ marginTop: '24px' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--color-warning)' }}></i>
                <div className="alert-message-content">
                    <strong>HIPAA Security Policy & Co-pilot Disclosure:</strong> PsyPyrus AI offers decision support. Practitioners must review and take final accountability before signing clinical records. All inputs are sanitized in-browser.
                </div>
            </div>
        </div>
    );
}
