import { useCallback, useState, useEffect } from 'react';
import { Database } from '../../services/db';
import { GeminiService } from '../../services/ai';

export function MentalStatusExam({
    patients,
    activePatientId,
    onSetActivePatientId
}) {
    // 10 Tracked MSE Dimensions (initialized to null to guide completion)
    const [appearance, setAppearance] = useState(null);
    const [behavior, setBehavior] = useState(null);
    const [speech, setSpeech] = useState(null);
    const [mood, setMood] = useState(null);
    const [thoughtProcess, setThoughtProcess] = useState(null);
    const [thoughtContent, setThoughtContent] = useState(null);
    const [perception, setPerception] = useState(null);
    const [cognition, setCognition] = useState(null);
    const [insight, setInsight] = useState(null);
    const [judgment, setJudgment] = useState(null);
    const [comments, setComments] = useState('Patient presented with mild somatic signs congruent with active work stressors.');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [previousMse, setPreviousMse] = useState(null);
    const [showCopySuccess, setShowCopySuccess] = useState(false);

    const resetForm = useCallback(() => {
        setAppearance(null);
        setBehavior(null);
        setSpeech(null);
        setMood(null);
        setThoughtProcess(null);
        setThoughtContent(null);
        setPerception(null);
        setCognition(null);
        setInsight(null);
        setJudgment(null);
        setComments('');
        setResult('');
    }, []);

    // Load patient's previous MSE records for comparison
    useEffect(() => {
        if (activePatientId) {
            const notes = Database.getClinicalNotes(activePatientId);
            const mseNotes = notes.filter(n => n.noteType === 'MSE');
            if (mseNotes.length > 0) {
                setPreviousMse(mseNotes[0]); // Latest saved MSE
            } else {
                setPreviousMse(null);
            }
            // Clear current form on patient change
            resetForm();
        }
    }, [activePatientId, resetForm]);

    const getInsightGradeDescription = (grade) => {
        switch (Number(grade)) {
            case 1: return "Grade 1: Complete denial of illness.";
            case 2: return "Grade 2: Slight awareness but denying.";
            case 3: return "Grade 3: Awareness but blaming external factors.";
            case 4: return "Grade 4: Intellectual awareness (knows he/she is ill but no active coping).";
            case 5: return "Grade 5: True intellectual insight (accepts illness, wants to adjust).";
            case 6: return "Grade 6: True emotional insight with active behavioral restructuring.";
            default: return "Select insight grade";
        }
    };

    // Pre-populate form using latest saved note's checklist details (if saved in structured format)
    const handlePrepopulate = () => {
        if (!previousMse) return;
        try {
            const data = JSON.parse(previousMse.bodyJson);
            if (data.checklist) {
                const c = data.checklist;
                setAppearance(c.appearance || null);
                setBehavior(c.behavior || null);
                setSpeech(c.speech || null);
                setMood(c.mood || null);
                setThoughtProcess(c.thoughtProcess || null);
                setThoughtContent(c.thoughtContent || null);
                setPerception(c.perception || null);
                setCognition(c.cognition || null);
                setInsight(c.insight || null);
                setJudgment(c.judgment || null);
                setComments(c.comments || '');
            } else {
                alert("The previous MSE is stored in a legacy text format and cannot be auto-populated.");
            }
        } catch {
            // Fallback for unstructured legacy notes
            alert("Could not parse previous note structured details. Showing text comparison on the right.");
        }
    };

    // Calculate completion progress
    const completedFields = [
        appearance, behavior, speech, mood, thoughtProcess, 
        thoughtContent, perception, cognition, insight, judgment
    ].filter(val => val !== null && val !== '').length;

    const progressPercentage = (completedFields / 10) * 100;

    const handleCompileMse = async () => {
        if (completedFields < 10) {
            alert("Please complete all 10 MSE dimensions before synthesizing the prose narrative.");
            return;
        }

        setLoading(true);
        setResult('');

        const prompt = `Synthesize the following mental status exam ratings and annotations into a single, cohesive, formal psychiatric clinical narrative paragraph (Mental Status Examination narrative block). Avoid bullet points, lists, or headers. Write in continuous, high-fidelity clinical prose:

- Appearance & Hygiene: ${appearance}
- Motor Activity & Behavior: ${behavior}
- Speech & Language: ${speech}
- Mood & Affect: ${mood}
- Thought Process (Form): ${thoughtProcess}
- Thought Content (Themes): ${thoughtContent}
- Perceptual Anomalies: ${perception}
- Cognition & Memory: ${cognition}
- Patient Insight: Grade ${insight} (${getInsightGradeDescription(insight)})
- Judgment Appraisal: ${judgment}
- Additional clinician notes: ${comments || "None"}`;

        try {
            const rawResult = await GeminiService.callGemini(prompt, "You are an expert clinical psychologist writing formal Mental Status Exam summaries.");
            setResult(rawResult);

            // Save structured data along with narrative prose
            const structuredBody = JSON.stringify({
                narrative: rawResult,
                checklist: {
                    appearance, behavior, speech, mood, thoughtProcess,
                    thoughtContent, perception, cognition, insight, judgment, comments
                }
            });

            Database.insertClinicalNote({
                patientId: activePatientId,
                title: "Structured Mental Status Examination",
                noteType: "MSE",
                bodyJson: structuredBody
            });

            // Refresh comparison log
            const notes = Database.getClinicalNotes(activePatientId);
            const mseNotes = notes.filter(n => n.noteType === 'MSE');
            if (mseNotes.length > 0) {
                setPreviousMse(mseNotes[0]);
            }

            setShowCopySuccess(true);
            setTimeout(() => setShowCopySuccess(false), 2500);

        } catch (e) {
            alert(`Error compiling MSE: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getDisplayTextFromPreviousMse = () => {
        if (!previousMse) return "No previous records.";
        try {
            const data = JSON.parse(previousMse.bodyJson);
            return data.narrative || previousMse.bodyJson;
        } catch {
            return previousMse.bodyJson;
        }
    };

    return (
        <div className="screen-container active" id="screen-digital-mse">
            <style>{`
                .mse-layout-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr;
                    gap: 24px;
                    margin-top: 16px;
                }
                @media (max-width: 992px) {
                    .mse-layout-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .mse-section-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 16px;
                    transition: border-color 0.3s ease;
                }
                .mse-section-card.completed {
                    border-color: rgba(0, 242, 254, 0.25);
                    background: rgba(0, 242, 254, 0.01);
                }
                .mse-section-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-light);
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .mse-section-title span.badge {
                    font-size: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-muted);
                    padding: 2px 8px;
                    border-radius: 20px;
                }
                .mse-section-card.completed .mse-section-title span.badge {
                    background: rgba(0, 242, 254, 0.1);
                    color: var(--color-primary);
                }
                .mse-progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .mse-progress-bar-container {
                    width: 100%;
                    height: 6px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 24px;
                }
                .mse-progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
                    border-radius: 10px;
                    transition: width 0.3s ease;
                }
                .mse-options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .mse-option-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.04);
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    color: var(--text-normal);
                    transition: all 0.2s ease;
                }
                .mse-option-item:hover {
                    background: rgba(255,255,255,0.05);
                }
                .mse-option-item.selected {
                    background: rgba(0, 242, 254, 0.05);
                    border-color: var(--color-primary);
                    color: var(--text-light);
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-top: 12px;
                }
                .summary-item-box {
                    background: rgba(0,0,0,0.15);
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    border: 1px solid rgba(255,255,255,0.03);
                }
                .summary-item-label {
                    color: var(--text-muted);
                    font-size: 9px;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }
                .summary-item-val {
                    color: var(--text-light);
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .comparison-box {
                    max-height: 200px;
                    overflow-y: auto;
                    padding: 12px;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    font-size: 12px;
                    line-height: 1.5;
                    color: var(--text-normal);
                }
            `}</style>

            <div className="section-header-block">
                <i className="fa-solid fa-clipboard-list"></i>
                <h2>Digital Mental Status Examination Workstation</h2>
            </div>

            {/* Patient Selector */}
            <div className="workspace-card">
                <label className="form-label">Patient Records Selector:</label>
                <div className="chips-horizontal-scroll" id="mse-patient-chips">
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

            {/* Completion Progress Bar */}
            <div className="workspace-card" style={{ paddingBottom: '16px' }}>
                <div className="mse-progress-header">
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Clinical Profile Completion Progress:</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {completedFields} / 10 Sections ({Math.round(progressPercentage)}%)
                    </span>
                </div>
                <div className="mse-progress-bar-container">
                    <div className="mse-progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="mse-layout-grid">
                
                {/* Left Side: 10 structured sections */}
                <div id="mse-form-container">
                    
                    {/* 1. Appearance */}
                    <div className={`mse-section-card ${appearance ? 'completed' : ''}`}>
                        <div className="mse-section-title">
                            1. Appearance & Hygiene
                            <span className="badge">{appearance ? 'Selected' : 'Required'}</span>
                        </div>
                        <div className="mse-options-list">
                            {[
                                "Well-groomed, dressed appropriately for weather and setting",
                                "Disheveled appearance, poor personal hygiene, strong body odor",
                                "Posture tense, hyper-vigilant scanning, eccentric dressing details",
                                "Somatic signs of extreme fatigue, slumped posture, minimal grooming"
                            ].map(opt => (
                                <div 
                                    key={opt} 
                                    className={`mse-option-item ${appearance === opt ? 'selected' : ''}`}
                                    onClick={() => setAppearance(opt)}
                                >
                                    <i className={`fa-solid ${appearance === opt ? 'fa-circle-dot' : 'fa-circle'}`}></i>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Behavior */}
                    <div className={`mse-section-card ${behavior ? 'completed' : ''}`}>
                        <div className="mse-section-title">
                            2. Motor Activity & Behavior
                            <span className="badge">{behavior ? 'Selected' : 'Required'}</span>
                        </div>
                        <div className="mse-options-list">
                            {[
                                "Cooperative, relaxed posture, normal motor activity",
                                "Psychomotor agitation (constant leg shaking, hand wringing, pacing)",
                                "Guarded, uncooperative, hostile or defensive posturing",
                                "Psychomotor retardation, slowed movements, catatonic-like states"
                            ].map(opt => (
                                <div 
                                    key={opt} 
                                    className={`mse-option-item ${behavior === opt ? 'selected' : ''}`}
                                    onClick={() => setBehavior(opt)}
                                >
                                    <i className={`fa-solid ${behavior === opt ? 'fa-circle-dot' : 'fa-circle'}`}></i>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Speech */}
                    <div className={`mse-section-card ${speech ? 'completed' : ''}`}>
                        <div className="mse-section-title">
                            3. Speech Characteristics & Language
                            <span className="badge">{speech ? 'Selected' : 'Required'}</span>
                        </div>
                        <div className="mse-options-list">
                            {[
                                "Normative rate, normal volume, responsive and fluent tone",
                                "Pressured speech, rapid rate, loud volume, difficult to interrupt",
                                "Slow, hesitant speech, low volume, monosyllabic answers",
                                "Incoherent patterns, neologisms, word salad, or completely mute"
                            ].map(opt => (
                                <div 
                                    key={opt} 
                                    className={`mse-option-item ${speech === opt ? 'selected' : ''}`}
                                    onClick={() => setSpeech(opt)}
                                >
                                    <i className={`fa-solid ${speech === opt ? 'fa-circle-dot' : 'fa-circle'}`}></i>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. Mood & Affect */}
                    <div className={`mse-section-card ${mood ? 'completed' : ''}`}>
                        <div className="mse-section-title">
                            4. Mood & Affect Quality
                            <span className="badge">{mood ? 'Selected' : 'Required'}</span>
                        </div>
                        <div className="mse-options-list">
                            {[
                                "Anxious mood, restricted affect range congruent with stressors",
                                "Depressed mood, flat/blunted affect, poor emotional range",
                                "Euthymic mood, congruent and fully reactive affect range",
                                "Labile mood, expansive affect, frequent shifts in emotional tone"
                            ].map(opt => (
                                <div 
                                    key={opt} 
                                    className={`mse-option-item ${mood === opt ? 'selected' : ''}`}
                                    onClick={() => setMood(opt)}
                                >
                                    <i className={`fa-solid ${mood === opt ? 'fa-circle-dot' : 'fa-circle'}`}></i>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5. Thought Process */}
                    <div className={`mse-section-card ${thoughtProcess ? 'completed' : ''}`}>
                        <div className="mse-section-title">
                            5. Thought Process & Flow (Form)
                            <span className="badge">{thoughtProcess ? 'Selected' : 'Required'}</span>
                        </div>
                        <div className="mse-options-list">
                            {[
                                "Logical, linear, goal-directed flow with coherent associations",
                                "Flight of ideas, rapid shifts, tangential associations",
                                "Circumstantial thought, over-inclusive details but reaches goal",
                                "Loose associations, fragmented logic, derailment of thought stream"
                            ].map(opt => (
                                <div 
                                    key={opt} 
                                    className={`mse-option-item ${thoughtProcess === opt ? 'selected' : ''}`}
                                    onClick={() => setThoughtProcess(opt)}
                                >
                                    <i className={`fa-solid ${thoughtProcess === opt ? 'fa-circle-dot' : 'fa-circle'}`}></i>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 6. Thought Content */}
                    <div className={`mse-section-card ${thoughtContent ? 'completed' : ''}`}>
                        <div className="mse-section-title">
                            6. Thought Content & Ideations (Themes)
                            <span className="badge">{thoughtContent ? 'Selected' : 'Required'}</span>
                        </div>
                        <div className="mse-options-list">
                            {[
                                "No suicidal/homicidal ideations, no active delusional themes",
                                "Active suicidal ideation reported without structured plan or intent",
                                "Delusional themes noted (paranoid, grandiose, somatic, or persecutory)",
                                "Obsessive-compulsive ideation, persistent intrusive worry cycles"
                            ].map(opt => (
                                <div 
                                    key={opt} 
                                    className={`mse-option-item ${thoughtContent === opt ? 'selected' : ''}`}
                                    onClick={() => setThoughtContent(opt)}
                                >
                                    <i className={`fa-solid ${thoughtContent === opt ? 'fa-circle-dot' : 'fa-circle'}`}></i>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 7. Perception */}
                    <div className={`mse-section-card ${perception ? 'completed' : ''}`}>
                        <div className="mse-section-title">
                            7. Perceptual Anomalies
                            <span className="badge">{perception ? 'Selected' : 'Required'}</span>
                        </div>
                        <div className="mse-options-list">
                            {[
                                "Intact perception, no evidence of hallucinations or illusions",
                                "Auditory hallucinations reported (voices speaking, distinct sounds)",
                                "Visual illusions or hallucinations reported by patient",
                                "Somatic depersonalization or derealization states described"
                            ].map(opt => (
                                <div 
                                    key={opt} 
                                    className={`mse-option-item ${perception === opt ? 'selected' : ''}`}
                                    onClick={() => setPerception(opt)}
                                >
                                    <i className={`fa-solid ${perception === opt ? 'fa-circle-dot' : 'fa-circle'}`}></i>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 8. Cognition & Memory */}
                    <div className={`mse-section-card ${cognition ? 'completed' : ''}`}>
                        <div className="mse-section-title">
                            8. Cognition & Memory Capacity
                            <span className="badge">{cognition ? 'Selected' : 'Required'}</span>
                        </div>
                        <div className="mse-options-list">
                            {[
                                "Oriented x3 (Person, Place, Time), immediate/recent/remote memory intact",
                                "Disoriented to time or place, attention fluctuates",
                                "Mild recent memory deficits, struggles with recall of recent events",
                                "Severe cognitive stagnation, poor concentration, remote memory gaps"
                            ].map(opt => (
                                <div 
                                    key={opt} 
                                    className={`mse-option-item ${cognition === opt ? 'selected' : ''}`}
                                    onClick={() => setCognition(opt)}
                                >
                                    <i className={`fa-solid ${cognition === opt ? 'fa-circle-dot' : 'fa-circle'}`}></i>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 9. Insight */}
                    <div className={`mse-section-card ${insight ? 'completed' : ''}`}>
                        <div className="mse-section-title">
                            9. Patient Insight (Grade 1 - 6)
                            <span className="badge">{insight ? 'Selected' : 'Required'}</span>
                        </div>
                        <div className="mse-options-list">
                            {[1, 2, 3, 4, 5, 6].map(grade => (
                                <div 
                                    key={grade} 
                                    className={`mse-option-item ${insight === grade ? 'selected' : ''}`}
                                    onClick={() => setInsight(grade)}
                                >
                                    <i className={`fa-solid ${insight === grade ? 'fa-circle-dot' : 'fa-circle'}`}></i>
                                    {getInsightGradeDescription(grade)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 10. Judgment */}
                    <div className={`mse-section-card ${judgment ? 'completed' : ''}`}>
                        <div className="mse-section-title">
                            10. Judgment Appraisal
                            <span className="badge">{judgment ? 'Selected' : 'Required'}</span>
                        </div>
                        <div className="mse-options-list">
                            {[
                                "Socially sound, personal choices and safety planning appropriate",
                                "Impaired social judgment, poor risk evaluation of career/finances",
                                "Intact test judgment capacity, poor real-world implementation",
                                "Questionable judgment regarding medication adherence or safety"
                            ].map(opt => (
                                <div 
                                    key={opt} 
                                    className={`mse-option-item ${judgment === opt ? 'selected' : ''}`}
                                    onClick={() => setJudgment(opt)}
                                >
                                    <i className={`fa-solid ${judgment === opt ? 'fa-circle-dot' : 'fa-circle'}`}></i>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="workspace-card">
                        <div className="form-field-group">
                            <label className="form-label">Descriptive comments / perceived anomalies:</label>
                            <textarea 
                                className="input-text-field"
                                style={{ minHeight: '80px', width: '100%', boxSizing: 'border-box' }}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Input any clinical subtleties, specific delusional content or additional motor markers..."
                            />
                        </div>
                    </div>

                    <button 
                        className="action-button-btn" 
                        style={{ width: '100%', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={handleCompileMse}
                        disabled={loading || completedFields < 10}
                    >
                        {loading ? (
                            <>
                                <span className="loader-dual-ring"></span>
                                Synthesizing Clinical Prose...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-arrows-spin"></i> 
                                AI-Assist: Synthesize Prose Narrative ({completedFields}/10 completed)
                            </>
                        )}
                    </button>
                </div>

                {/* Right Side: Visual Summary, AI Output, and Comparison logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Visual Summary Card */}
                    <div className="workspace-card" style={{ height: 'fit-content' }}>
                        <div className="card-title-bar">
                            <h3>MSE Current Selections summary</h3>
                        </div>
                        <div className="summary-grid">
                            <div className="summary-item-box">
                                <div className="summary-item-label">Appearance</div>
                                <div className="summary-item-val" title={appearance || 'Pending'}>{appearance ? appearance.split(',')[0] : 'Pending...'}</div>
                            </div>
                            <div className="summary-item-box">
                                <div className="summary-item-label">Motor</div>
                                <div className="summary-item-val" title={behavior || 'Pending'}>{behavior ? behavior.split(',')[0] : 'Pending...'}</div>
                            </div>
                            <div className="summary-item-box">
                                <div className="summary-item-label">Speech</div>
                                <div className="summary-item-val" title={speech || 'Pending'}>{speech ? speech.split(',')[0] : 'Pending...'}</div>
                            </div>
                            <div className="summary-item-box">
                                <div className="summary-item-label">Mood/Affect</div>
                                <div className="summary-item-val" title={mood || 'Pending'}>{mood ? mood.split(',')[0] : 'Pending...'}</div>
                            </div>
                            <div className="summary-item-box">
                                <div className="summary-item-label">Thought Process</div>
                                <div className="summary-item-val" title={thoughtProcess || 'Pending'}>{thoughtProcess ? thoughtProcess.split(',')[0] : 'Pending...'}</div>
                            </div>
                            <div className="summary-item-box">
                                <div className="summary-item-label">Thought Content</div>
                                <div className="summary-item-val" title={thoughtContent || 'Pending'}>{thoughtContent ? thoughtContent.split(',')[0] : 'Pending...'}</div>
                            </div>
                            <div className="summary-item-box">
                                <div className="summary-item-label">Perception</div>
                                <div className="summary-item-val" title={perception || 'Pending'}>{perception ? perception.split(',')[0] : 'Pending...'}</div>
                            </div>
                            <div className="summary-item-box">
                                <div className="summary-item-label">Cognition</div>
                                <div className="summary-item-val" title={cognition || 'Pending'}>{cognition ? cognition.split(',')[0] : 'Pending...'}</div>
                            </div>
                            <div className="summary-item-box">
                                <div className="summary-item-label">Insight</div>
                                <div className="summary-item-val">{insight ? `Grade ${insight}` : 'Pending...'}</div>
                            </div>
                            <div className="summary-item-box">
                                <div className="summary-item-label">Judgment</div>
                                <div className="summary-item-val" title={judgment || 'Pending'}>{judgment ? judgment.split(',')[0] : 'Pending...'}</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Output Card */}
                    {result && (
                        <div id="mse-result-card" className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Synthesized Prose Block:</h3>
                            </div>
                            <div className="ai-formatted-report-block">
                                <p className="formatted-prose-output" id="mse-result-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '13px', margin: 0 }}>
                                    {result}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Historical Comparison Card */}
                    <div className="workspace-card" style={{ height: 'fit-content' }}>
                        <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Historical MSE Reference</h3>
                            {previousMse && (
                                <button 
                                    className="patient-filter-chip active" 
                                    style={{ margin: 0, padding: '4px 8px', fontSize: '10px' }}
                                    onClick={handlePrepopulate}
                                >
                                    Pre-populate
                                </button>
                            )}
                        </div>
                        {previousMse ? (
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    Recorded on: {new Date(previousMse.timestamp).toLocaleString()}
                                </div>
                                <div className="comparison-box">
                                    {getDisplayTextFromPreviousMse()}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>
                                No previous MSE records found for this patient.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showCopySuccess && (
                <div className="hipaa-alert-box info" style={{ marginTop: '20px' }}>
                    <i className="fa-solid fa-cloud-arrow-up" style={{ color: 'var(--color-primary)' }}></i>
                    <div className="alert-message-content">
                        Prose narrative generated and logged to patient's clinical file automatically.
                    </div>
                </div>
            )}
        </div>
    );
}
