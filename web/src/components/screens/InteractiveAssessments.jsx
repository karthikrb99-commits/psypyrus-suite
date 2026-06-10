import { useState, useEffect } from 'react';
import { Database } from '../../services/db';

export function InteractiveAssessments({ activePatientId = 1 }) {
    const [selectedStandard, setSelectedStandard] = useState(null); // 'PHQ-9', 'GAD-7', 'BDI-II', 'PCL-5'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [completedScore, setCompletedScore] = useState(null);
    const [completedSeverity, setCompletedSeverity] = useState('');
    const [pastScores, setPastScores] = useState([]);

    const instruments = {
        'PHQ-9': {
            title: "Patient Health Questionnaire (PHQ-9)",
            shortName: "PHQ-9",
            description: "Standardized 9-question tool to measure severity of clinical depression.",
            estTime: "3 mins",
            maxOptions: 4, // 0 to 3
            options: [
                { val: 0, label: "Not at all" },
                { val: 1, label: "Several days" },
                { val: 2, label: "More than half the days" },
                { val: 3, label: "Nearly every day" }
            ],
            questions: [
                "Little interest or pleasure in doing things?",
                "Feeling down, depressed, or hopeless?",
                "Trouble falling or staying asleep, or sleeping too much?",
                "Feeling tired or having little energy?",
                "Poor appetite or overeating?",
                "Feeling bad about yourself — or that you are a failure or have let yourself or your family down?",
                "Trouble concentrating on things, such as reading the newspaper or watching television?",
                "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?",
                "Thoughts that you would be better off dead, or of hurting yourself in some way?"
            ],
            interpret: (score) => {
                if (score <= 4) return { label: "Minimal/No Depression", color: "var(--color-success)" };
                if (score <= 9) return { label: "Mild Depression", color: "var(--color-primary)" };
                if (score <= 14) return { label: "Moderate Depression", color: "var(--color-warning)" };
                if (score <= 19) return { label: "Moderately Severe Depression", color: "#f5a623" };
                return { label: "Severe Depression", color: "var(--color-error)" };
            }
        },
        'GAD-7': {
            title: "Generalized Anxiety Disorder (GAD-7)",
            shortName: "GAD-7",
            description: "Standardized 7-question scale to check and monitor anxiety levels.",
            estTime: "2 mins",
            maxOptions: 4, // 0 to 3
            options: [
                { val: 0, label: "Not at all" },
                { val: 1, label: "Several days" },
                { val: 2, label: "More than half the days" },
                { val: 3, label: "Nearly every day" }
            ],
            questions: [
                "Feeling nervous, anxious or on edge?",
                "Not being able to stop or control worrying?",
                "Worrying too much about different things?",
                "Trouble relaxing?",
                "Being so restless that it is hard to sit still?",
                "Becoming easily annoyed or irritable?",
                "Feeling afraid, as if something awful might happen?"
            ],
            interpret: (score) => {
                if (score <= 4) return { label: "Minimal Anxiety", color: "var(--color-success)" };
                if (score <= 9) return { label: "Mild Anxiety", color: "var(--color-primary)" };
                if (score <= 14) return { label: "Moderate Anxiety", color: "var(--color-warning)" };
                return { label: "Severe Anxiety", color: "var(--color-error)" };
            }
        },
        'BDI-II': {
            title: "Beck Depression Inventory (BDI-II)",
            shortName: "BDI-II",
            description: "Self-report inventory measuring somatic and cognitive symptoms of depression.",
            estTime: "5 mins",
            maxOptions: 4, // 0 to 3
            options: [
                { val: 0, label: "Not at all" },
                { val: 1, label: "Mild / Several days" },
                { val: 2, label: "Moderate / Frequent" },
                { val: 3, label: "Severe / Constant" }
            ],
            questions: [
                "Sadness (e.g. Feeling down, blue, or discouraged)",
                "Pessimism (e.g. Feeling hopeless about the future)",
                "Past Failure (e.g. Feeling like you have failed more than you should)",
                "Loss of Pleasure (e.g. Inability to enjoy things you used to)",
                "Guilty Feelings (e.g. Feeling guilty or bad about yourself)",
                "Punishment Feelings (e.g. Feeling like you are being punished)",
                "Self-Dislike (e.g. Feeling disappointed in or hating yourself)",
                "Self-Criticalness (e.g. Blaming yourself for failures)",
                "Suicidal Thoughts or Wishes (e.g. Thoughts of escape/harm)",
                "Crying (e.g. Crying more than usual)",
                "Agitation (e.g. Feeling restless or constantly moving)",
                "Loss of Interest (e.g. Finding it hard to care about things)",
                "Indecisiveness (e.g. Having trouble making decisions)",
                "Worthlessness (e.g. Feeling useless or of no value)",
                "Loss of Energy (e.g. Feeling too tired to do anything)",
                "Changes in Sleeping Pattern (e.g. Insomnia or hypersomnia)",
                "Irritability (e.g. Getting annoyed easily)",
                "Changes in Appetite (e.g. Loss of appetite or overeating)",
                "Concentration Difficulty (e.g. Trouble keeping attention)",
                "Tiredness or Fatigue (e.g. Feeling exhausted constantly)",
                "Loss of Interest in Sex (e.g. Diminished libido)"
            ],
            interpret: (score) => {
                if (score <= 13) return { label: "Minimal Depression", color: "var(--color-success)" };
                if (score <= 19) return { label: "Mild Depression", color: "var(--color-primary)" };
                if (score <= 28) return { label: "Moderate Depression", color: "var(--color-warning)" };
                return { label: "Severe Depression", color: "var(--color-error)" };
            }
        },
        'PCL-5': {
            title: "PTSD Checklist for DSM-5 (PCL-5)",
            shortName: "PCL-5",
            description: "20-item checklist to monitor traumatic stress and assess probable PTSD.",
            estTime: "5 mins",
            maxOptions: 5, // 0 to 4
            options: [
                { val: 0, label: "Not at all" },
                { val: 1, label: "A little bit" },
                { val: 2, label: "Moderately" },
                { val: 3, label: "Quite a bit" },
                { val: 4, label: "Extremely" }
            ],
            questions: [
                "Repeated, disturbing, and unwanted memories of the stressful experience?",
                "Repeated, disturbing dreams of the stressful experience?",
                "Suddenly feeling or acting as if the stressful experience were actually happening again?",
                "Feeling very upset when something reminded you of the stressful experience?",
                "Having strong physical reactions when something reminded you of the stressful experience?",
                "Avoiding memories, thoughts, or feelings related to the stressful experience?",
                "Avoiding external reminders of the stressful experience (e.g. people, places, conversations)?",
                "Trouble remembering important parts of the stressful experience?",
                "Having strong negative beliefs about yourself, other people, or the world?",
                "Blaming yourself or someone else for the stressful experience or what happened after it?",
                "Having strong negative feelings such as fear, horror, anger, guilt, or shame?",
                "Loss of interest in activities that you used to enjoy?",
                "Feeling distant or cut off from other people?",
                "Trouble having positive feelings (e.g. love, happiness)?",
                "Irritable behavior, angry outbursts, or acting aggressively?",
                "Taking too many risks or doing things that could cause you harm?",
                "Being 'super-alert' or watchful or on guard (hyper-vigilance)?",
                "Feeling jumpy or easily startled?",
                "Having difficulty concentrating?",
                "Trouble falling or staying asleep?"
            ],
            interpret: (score) => {
                if (score >= 33) return { label: "Probable PTSD (Meets DSM-5 Threshold)", color: "var(--color-error)" };
                if (score >= 15) return { label: "Moderate Traumatic Stress", color: "var(--color-warning)" };
                return { label: "Mild / Sub-clinical Traumatic Stress", color: "var(--color-success)" };
            }
        }
    };

    // Load past scores for this patient
    useEffect(() => {
        if (activePatientId) {
            const allScores = Database.getAssessments(activePatientId);
            setPastScores(allScores);
        }
    }, [activePatientId, completedScore]);

    const handleSelectInstrument = (key) => {
        setSelectedStandard(key);
        setCurrentQuestionIndex(0);
        setAnswers(new Array(instruments[key].questions.length).fill(null));
        setCompletedScore(null);
    };

    const handleSelectOption = (value) => {
        const updatedAnswers = [...answers];
        updatedAnswers[currentQuestionIndex] = value;
        setAnswers(updatedAnswers);

        // Auto-advance to next question if not at the end
        if (currentQuestionIndex < instruments[selectedStandard].questions.length - 1) {
            setTimeout(() => {
                setCurrentQuestionIndex(prev => prev + 1);
            }, 200);
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < instruments[selectedStandard].questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleCalculateResults = () => {
        const unfilledIdx = answers.findIndex(a => a === null);
        if (unfilledIdx !== -1) {
            alert(`Please answer all questions before compiling. Question ${unfilledIdx + 1} is missing.`);
            setCurrentQuestionIndex(unfilledIdx);
            return;
        }

        const score = answers.reduce((sum, val) => sum + val, 0);
        const detailsObj = instruments[selectedStandard].interpret(score);

        setCompletedScore(score);
        setCompletedSeverity(detailsObj.label);

        // Save to Database
        Database.insertAssessmentScore({
            patientId: Number(activePatientId),
            type: selectedStandard,
            score: score,
            details: detailsObj.label
        });
    };

    const handleReset = () => {
        setSelectedStandard(null);
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setCompletedScore(null);
    };

    return (
        <div className="screen-container active" id="screen-assessments">
            <style>{`
                .instrument-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-top: 16px;
                }
                .instrument-card {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 140px;
                }
                .instrument-card:hover {
                    background: rgba(0, 242, 254, 0.04);
                    border-color: rgba(0, 242, 254, 0.2);
                    transform: translateY(-3px);
                }
                .q-slider-progress-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                .q-progress-bar {
                    flex-grow: 1;
                    height: 5px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 0 16px;
                }
                .q-progress-fill {
                    height: 100%;
                    background: var(--color-primary);
                    border-radius: 10px;
                    transition: width 0.2s ease;
                }
                .question-display-box {
                    background: rgba(0,0,0,0.15);
                    border: 1px solid rgba(255,255,255,0.03);
                    border-radius: 12px;
                    padding: 24px;
                    min-height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: 500;
                    color: var(--text-light);
                    text-align: center;
                    margin-bottom: 24px;
                }
                .options-container {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .option-pill-button {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    color: var(--text-normal);
                    padding: 14px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 13px;
                    text-align: left;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s ease;
                }
                .option-pill-button:hover {
                    background: rgba(0, 242, 254, 0.05);
                    border-color: var(--color-primary);
                }
                .option-pill-button.active {
                    background: var(--color-primary-glow);
                    border-color: var(--color-primary);
                    color: var(--text-light);
                    font-weight: bold;
                }
                .score-gauge-radial {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background: rgba(0,0,0,0.25);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px;
                    text-align: center;
                    max-width: 320px;
                    margin: 20px auto;
                }
                .past-assessments-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 12px;
                    font-size: 12px;
                }
                .past-assessments-table th, .past-assessments-table td {
                    padding: 8px 12px;
                    text-align: left;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                }
                .past-assessments-table th {
                    color: var(--text-muted);
                    font-weight: 600;
                }
            `}</style>

            <div className="section-header-block">
                <i className="fa-solid fa-square-poll-horizontal"></i>
                <h2>Interactive Assessments Instrument Panel</h2>
            </div>

            {/* Standard Selector Dashboard */}
            {!selectedStandard && (
                <>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Select a standardized clinical instrument to run an evaluation on the active patient profile:
                    </p>

                    <div className="instrument-grid">
                        {Object.entries(instruments).map(([key, data]) => (
                            <div key={key} className="instrument-card" onClick={() => handleInstrumentGridSelect(key)}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <strong style={{ color: 'var(--text-light)', fontSize: '14px' }}>{data.shortName}</strong>
                                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', color: 'var(--color-primary)' }}>{data.estTime}</span>
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{data.description}</p>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-normal)', marginTop: '12px', textAlign: 'right' }}>
                                    {data.questions.length} Items <i className="fa-solid fa-chevron-right" style={{ marginLeft: '4px' }}></i>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Past Assessments History Log */}
                    <div className="workspace-card" style={{ marginTop: '24px' }}>
                        <div className="card-title-bar">
                            <h3>Assessment Scoring Logs</h3>
                        </div>
                        {pastScores.length === 0 ? (
                            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                                No completed assessment records logged.
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="past-assessments-table">
                                    <thead>
                                        <tr>
                                            <th>Instrument</th>
                                            <th>Date Logs</th>
                                            <th>Numeric Score</th>
                                            <th>Severity Output</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pastScores.slice().reverse().map(score => (
                                            <tr key={score.id}>
                                                <td style={{ fontWeight: 'bold', color: 'var(--text-light)' }}>{score.type}</td>
                                                <td>{new Date(score.date).toLocaleString()}</td>
                                                <td style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{score.score}</td>
                                                <td>{score.details}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Questionnaire Active Mode */}
            {selectedStandard && completedScore === null && (
                <div className="workspace-card" style={{ marginTop: '16px' }}>
                    <div className="q-slider-progress-container">
                        <button className="patient-filter-chip active" style={{ margin: 0 }} onClick={handleReset}>
                            <i className="fa-solid fa-arrow-left"></i> Exit Quiz
                        </button>
                        <div className="q-progress-bar">
                            <div 
                                className="q-progress-fill" 
                                style={{ width: `${((currentQuestionIndex + 1) / instruments[selectedStandard].questions.length) * 100}%` }}
                            ></div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            Item {currentQuestionIndex + 1} of {instruments[selectedStandard].questions.length}
                        </span>
                    </div>

                    {/* Question Card */}
                    <div className="question-display-box">
                        {instruments[selectedStandard].questions[currentQuestionIndex]}
                    </div>

                    {/* Options Pilling */}
                    <div className="options-container">
                        {instruments[selectedStandard].options.map((opt) => (
                            <button
                                key={opt.val}
                                className={`option-pill-button ${answers[currentQuestionIndex] === opt.val ? 'active' : ''}`}
                                onClick={() => handleSelectOption(opt.val)}
                            >
                                <span>{opt.label}</span>
                                <span style={{ opacity: 0.6 }}>Score: {opt.val}</span>
                            </button>
                        ))}
                    </div>

                    {/* Nav buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <button 
                            className="action-button-btn secondary" 
                            disabled={currentQuestionIndex === 0}
                            onClick={handleBack}
                        >
                            Back
                        </button>

                        {currentQuestionIndex < instruments[selectedStandard].questions.length - 1 ? (
                            <button 
                                className="action-button-btn secondary"
                                disabled={answers[currentQuestionIndex] === null}
                                onClick={handleNext}
                            >
                                Next
                            </button>
                        ) : (
                            <button 
                                className="action-button-btn" 
                                disabled={answers.includes(null)}
                                onClick={handleCalculateResults}
                            >
                                Calculate & Log Score
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Results Radial Gauge */}
            {completedScore !== null && (
                <div className="workspace-card" style={{ marginTop: '16px', textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--text-light)' }}>Assessment Results Report</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        EHR Record saved for patient ID {activePatientId} under {selectedStandard} criteria.
                    </p>

                    <div className="score-gauge-radial" style={{ borderColor: instruments[selectedStandard].interpret(completedScore).color }}>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Aggregate Score</span>
                        <div style={{ fontSize: '72px', fontWeight: 800, color: 'var(--text-light)', margin: '10px 0', fontFamily: 'monospace' }}>
                            {completedScore}
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: instruments[selectedStandard].interpret(completedScore).color }}>
                            {completedSeverity}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
                        <button className="action-button-btn secondary-btn" onClick={handleReset}>
                            Questionnaire Gallery
                        </button>
                        <button className="action-button-btn" onClick={() => handleSelectInstrument(selectedStandard)}>
                            Retake Questionnaire
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    function handleInstrumentGridSelect(key) {
        handleSelectInstrument(key);
    }
}
