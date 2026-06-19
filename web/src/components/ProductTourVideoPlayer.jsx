import { useState, useEffect, useRef } from 'react';

const CHAPTERS = [
    {
        id: 1,
        title: "Clinician Hub & Vault",
        timeRange: [0, 12],
        narration: "Welcome to PsyPyrus AI OS. Let's start with the Clinician Dashboard. Here, practitioners can view their daily schedule, manage active caseloads, and check real-time audit logs in our secure, HIPAA-aware encrypted vault.",
        screenshot: "clinician_dashboard.png"
    },
    {
        id: 2,
        title: "Diagnostics Engine",
        timeRange: [12, 24],
        narration: "Next, we explore the DSM-5-TR Diagnostics Engine. By checking patient symptoms and duration, PsyPyrus runs offline diagnostic checks for Major Depression and Anxiety, showing structural alignments with RDoc and HiTOP matrices.",
        screenshot: "diagnostics_suite.png"
    },
    {
        id: 3,
        title: "Therapeutic Contracts",
        timeRange: [24, 36],
        narration: "Here is the Customizable and Negotiable Therapeutic Contract portal. Clinicians and patients can propose, comment on, and modify terms like session fees and goals, signing securely with encrypted digital signatures.",
        screenshot: "therapeutic_contracts.png"
    },
    {
        id: 4,
        title: "SOAP Notes Copilot",
        timeRange: [36, 48],
        narration: "Witness the AI SOAP Notes Copilot powered by Gemini 2.5 Flash. Simply transcribe or paste session dictation, and the Copilot instantly synthesizes standard medical-grade SOAP documentation, plans, and homework sheets.",
        screenshot: "soap_copilot.png"
    },
    {
        id: 5,
        title: "Telehealth & Wellness",
        timeRange: [48, 60],
        narration: "Finally, our secure Telehealth Session workspace. This features peer-to-peer Jitsi-meet integration, real-time secure chat, and clinical note syncing, alongside a patient-facing Wellness Lounge for self-care.",
        screenshot: "telehealth_session.png"
    }
];

export function ProductTourVideoPlayer() {
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0); // 0 to 60 seconds
    const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1, 1.5, 2
    const [activeChapterIndex, setActiveChapterIndex] = useState(0);
    const [typedText, setTypedText] = useState("");
    const [isCompilingSoap, setIsCompilingSoap] = useState(false);
    const [soapGenerated, setSoapGenerated] = useState(false);
    const [selectedContractFee, setSelectedContractFee] = useState(150);
    const [signatureSigned, setSignatureSigned] = useState(true);
    const [symptomsCheck, setSymptomsCheck] = useState({
        depressedMood: true,
        anhedonia: true,
        fatigue: true,
        sleepLatency: true,
        concentration: false
    });

    const timerRef = useRef(null);

    // Synchronize active chapter with current time
    useEffect(() => {
        const matchingChapterIndex = CHAPTERS.findIndex(
            ch => currentTime >= ch.timeRange[0] && currentTime <= ch.timeRange[1]
        );
        if (matchingChapterIndex !== -1 && matchingChapterIndex !== activeChapterIndex) {
            setActiveChapterIndex(matchingChapterIndex);
        }
    }, [currentTime]);

    // Handle timer playback
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setCurrentTime(prevTime => {
                    if (prevTime >= 60) {
                        return 0; // Loop back
                    }
                    return parseFloat((prevTime + 0.1 * playbackSpeed).toFixed(1));
                });
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, playbackSpeed]);

    // Typewriter effect for SOAP Notes (Chapter 4)
    useEffect(() => {
        if (activeChapterIndex === 3) {
            // Typing timeline runs from 36s to 42s
            const fullText = "Patient Liam Carter reports feeling overwhelmed at work. Has trouble sleeping, taking 90 mins to fall asleep. Feels tired daily. Denies suicidal ideation. Focus was maintained throughout therapy.";
            if (currentTime >= 36 && currentTime < 43) {
                const ratio = (currentTime - 36) / 7; // 0 to 1
                const charactersCount = Math.floor(fullText.length * ratio);
                setTypedText(fullText.substring(0, charactersCount));
                setIsCompilingSoap(false);
                setSoapGenerated(false);
            } else if (currentTime >= 43 && currentTime < 45) {
                setTypedText(fullText);
                setIsCompilingSoap(true);
                setSoapGenerated(false);
            } else if (currentTime >= 45) {
                setTypedText(fullText);
                setIsCompilingSoap(false);
                setSoapGenerated(true);
            }
        } else {
            setTypedText("");
            setIsCompilingSoap(false);
            setSoapGenerated(false);
        }
    }, [currentTime, activeChapterIndex]);

    // Contract animations (Chapter 3)
    useEffect(() => {
        if (activeChapterIndex === 2) {
            // Fee adjustments and signing
            if (currentTime >= 24 && currentTime < 28) {
                setSelectedContractFee(150);
                setSignatureSigned(false);
            } else if (currentTime >= 28 && currentTime < 32) {
                setSelectedContractFee(125); // counter offer
                setSignatureSigned(false);
            } else if (currentTime >= 32) {
                setSelectedContractFee(125);
                setSignatureSigned(true); // Signed!
            }
        }
    }, [currentTime, activeChapterIndex]);

    // Diagnostics animations (Chapter 2)
    useEffect(() => {
        if (activeChapterIndex === 1) {
            if (currentTime >= 12 && currentTime < 15) {
                setSymptomsCheck({ depressedMood: true, anhedonia: false, fatigue: false, sleepLatency: false, concentration: false });
            } else if (currentTime >= 15 && currentTime < 18) {
                setSymptomsCheck({ depressedMood: true, anhedonia: true, fatigue: false, sleepLatency: false, concentration: false });
            } else if (currentTime >= 18 && currentTime < 21) {
                setSymptomsCheck({ depressedMood: true, anhedonia: true, fatigue: true, sleepLatency: true, concentration: false });
            } else if (currentTime >= 21) {
                setSymptomsCheck({ depressedMood: true, anhedonia: true, fatigue: true, sleepLatency: true, concentration: true });
            }
        }
    }, [currentTime, activeChapterIndex]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleChapterJump = (index) => {
        setCurrentTime(CHAPTERS[index].timeRange[0]);
        setActiveChapterIndex(index);
    };

    const handleScrub = (e) => {
        setCurrentTime(parseFloat(e.target.value));
    };

    const handleStep = (direction) => {
        if (direction === 'forward') {
            const nextIndex = (activeChapterIndex + 1) % CHAPTERS.length;
            handleChapterJump(nextIndex);
        } else {
            const prevIndex = (activeChapterIndex - 1 + CHAPTERS.length) % CHAPTERS.length;
            handleChapterJump(prevIndex);
        }
    };

    const handleExport = () => {
        const chapter = CHAPTERS[activeChapterIndex];
        const link = document.createElement('a');
        link.href = `/screenshots/${chapter.screenshot}`;
        link.download = chapter.screenshot;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatTime = (time) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const currentChapter = CHAPTERS[activeChapterIndex];

    return (
        <div className="product-tour-container" id="interactive-demo-tour">
            <div className="product-tour-header">
                <h2><i className="fa-solid fa-circle-play text-teal-400"></i> PsyPyrus OS Interactive Product Tour</h2>
                <p>Experience the EHR mental health suite in action. Toggle playback, skip chapters, or interact directly with the preview screens.</p>
            </div>

            <div className="product-tour-player-layout">
                {/* Chapters Navigation */}
                <div className="player-chapters-sidebar">
                    {CHAPTERS.map((ch, idx) => (
                        <button 
                            key={ch.id} 
                            className={`chapter-nav-btn ${activeChapterIndex === idx ? 'active' : ''}`}
                            onClick={() => handleChapterJump(idx)}
                        >
                            <span className="chapter-index">0{ch.id}</span>
                            <div className="chapter-meta">
                                <span className="chapter-title">{ch.title}</span>
                                <span className="chapter-time">{formatTime(ch.timeRange[0])} - {formatTime(ch.timeRange[1])}</span>
                            </div>
                            {activeChapterIndex === idx && <i className="fa-solid fa-play active-indicator-arrow"></i>}
                        </button>
                    ))}
                </div>

                {/* Simulated Screen Stage */}
                <div className="player-screen-stage">
                    <div className="stage-top-bar">
                        <div className="window-dots">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                        </div>
                        <span className="stage-window-title">
                            psypyrus-ai-suite://portal/demo/{currentChapter.title.toLowerCase().replace(/\s/g, '_')}
                        </span>
                        <div className="stage-badge">
                            <i className="fa-solid fa-shield-halved"></i> SECURE DEMO
                        </div>
                    </div>

                    <div className="stage-content-body">
                        {/* CHAPTER 1 SCREEN: CLINICIAN DASHBOARD */}
                        {activeChapterIndex === 0 && (
                            <div className="mock-screen clinician-dashboard-mock">
                                <div className="mock-sidebar">
                                    <div className="logo-placeholder">P</div>
                                    <div className="nav-items-mock">
                                        <div className="nav-item active"><i className="fa-solid fa-chart-line"></i> Dashboard</div>
                                        <div className="nav-item"><i className="fa-solid fa-user-injured"></i> Patients</div>
                                        <div className="nav-item"><i className="fa-solid fa-file-signature"></i> Contracts</div>
                                        <div className="nav-item"><i className="fa-solid fa-video"></i> Sessions</div>
                                    </div>
                                </div>
                                <div className="mock-main-content">
                                    <div className="dashboard-top-row">
                                        <div>
                                            <h3>Dr. Liam Carter</h3>
                                            <span className="sub">Lead Psychiatrist & Clinic Admin</span>
                                        </div>
                                        <div className="security-status-badge">
                                            <i className="fa-solid fa-circle-check text-green-400"></i> Vault Encrypted (AES-GCM-256)
                                        </div>
                                    </div>
                                    
                                    <div className="metrics-grid-mock">
                                        <div className="metric-box">
                                            <span className="label">Weekly Active Cases</span>
                                            <span className="value">8 Patients</span>
                                            <span className="sub text-green-400"><i className="fa-solid fa-arrow-trend-up"></i> +12% this week</span>
                                        </div>
                                        <div className="metric-box">
                                            <span className="label">SOAP Notes Completed</span>
                                            <span className="value">96.8%</span>
                                            <span className="sub text-teal-400"><i className="fa-solid fa-shield"></i> HIPAA-Aware Architecture</span>
                                        </div>
                                        <div className="metric-box">
                                            <span className="label">SSE Sync Channels</span>
                                            <span className="value text-green-400">Connected</span>
                                            <span className="sub">10ms Latency</span>
                                        </div>
                                    </div>

                                    <div className="caseload-section-mock">
                                        <h4>Today's Appointments</h4>
                                        <div className="appointment-list-mock">
                                            <div className="appt-card-mock current">
                                                <div className="time">10:00 AM</div>
                                                <div className="info">
                                                    <strong>Liam Carter</strong>
                                                    <span>Major Depressive Disorder - Cognitive Session</span>
                                                </div>
                                                <span className="status-badge-mock in-progress">In Session</span>
                                            </div>
                                            <div className="appt-card-mock">
                                                <div className="time">11:30 AM</div>
                                                <div className="info">
                                                    <strong>Elena Rostova</strong>
                                                    <span>HiTOP / RDoc Assessment Intake</span>
                                                </div>
                                                <span className="status-badge-mock pending">Scheduled</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CHAPTER 2 SCREEN: DIAGNOSTICS SUITE */}
                        {activeChapterIndex === 1 && (
                            <div className="mock-screen diagnostics-mock">
                                <div className="diagnostics-split-mock">
                                    <div className="diagnostic-checklist-column">
                                        <h4>DSM-5-TR MDD Intake Checklist</h4>
                                        <p className="subtitle">Real-time diagnostic engine rule checker:</p>
                                        <div className="symptoms-checklist-mock">
                                            <label className="checkbox-row-mock">
                                                <input type="checkbox" checked={symptomsCheck.depressedMood} readOnly />
                                                <span>Depressed Mood / Sadness</span>
                                            </label>
                                            <label className="checkbox-row-mock">
                                                <input type="checkbox" checked={symptomsCheck.anhedonia} readOnly />
                                                <span>Anhedonia (Loss of Interest)</span>
                                            </label>
                                            <label className="checkbox-row-mock">
                                                <input type="checkbox" checked={symptomsCheck.fatigue} readOnly />
                                                <span>Fatigue or Loss of Energy</span>
                                            </label>
                                            <label className="checkbox-row-mock">
                                                <input type="checkbox" checked={symptomsCheck.sleepLatency} readOnly />
                                                <span>Insomnia / Sleep Onset Latency</span>
                                            </label>
                                            <label className="checkbox-row-mock">
                                                <input type="checkbox" checked={symptomsCheck.concentration} readOnly />
                                                <span>Diminished Ability to Concentrate</span>
                                            </label>
                                        </div>
                                        <div className="duration-info-mock">
                                            <span>Symptom Duration:</span>
                                            <strong>4 Weeks (Criteria Met &gt;2 weeks)</strong>
                                        </div>
                                    </div>

                                    <div className="diagnostic-engine-column">
                                        <div className="engine-status-box">
                                            <span className="hdr">ENGINE DIAGNOSIS</span>
                                            {Object.values(symptomsCheck).filter(Boolean).length >= 5 ? (
                                                <div className="badge-outcome met">
                                                    <i className="fa-solid fa-triangle-exclamation"></i> MDD CRITERIA MET
                                                </div>
                                            ) : (
                                                <div className="badge-outcome partial">
                                                    <i className="fa-solid fa-circle-info"></i> SUB-THRESHOLD SYMPTOMS
                                                </div>
                                            )}
                                            <p className="engine-explanation">
                                                Active symptoms: {Object.values(symptomsCheck).filter(Boolean).length}/5 required. Core symptom present: Yes. Recommendation: Initiate therapeutic contract and clinical intake workspace.
                                            </p>
                                        </div>

                                        <div className="matrix-explorer-tease">
                                            <span className="lbl">RDoc / HiTOP Structural Mapping</span>
                                            <div className="matrix-grid-tease">
                                                <div className="matrix-tag negative active">Negative Valence</div>
                                                <div className="matrix-tag cognitive">Cognitive Systems</div>
                                                <div className="matrix-tag internalizing active">Internalizing Spectrum</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CHAPTER 3 SCREEN: THERAPEUTIC CONTRACTS */}
                        {activeChapterIndex === 2 && (
                            <div className="mock-screen contract-mock">
                                <div className="contract-form-view">
                                    <div className="contract-header-mock">
                                        <h4>Therapeutic Agreement & Terms</h4>
                                        <span className="badge-secure"><i className="fa-solid fa-lock"></i> Negotiable Portal</span>
                                    </div>
                                    
                                    <div className="contract-terms-grid">
                                        <div className="term-card">
                                            <span className="term-lbl">Proposing Clinician</span>
                                            <span className="term-val">Dr. Liam Carter</span>
                                        </div>
                                        <div className="term-card">
                                            <span className="term-lbl">Patient Profile</span>
                                            <span className="term-val">Liam Carter</span>
                                        </div>
                                        <div className="term-card highlight">
                                            <span className="term-lbl">Provisional Session Fee</span>
                                            <span className="term-val">${selectedContractFee} / hr</span>
                                        </div>
                                        <div className="term-card">
                                            <span className="term-lbl">Cancellation Policy</span>
                                            <span className="term-val">24-Hour Notice Required</span>
                                        </div>
                                    </div>

                                    <div className="contract-goals-list">
                                        <h5>Primary Treatment Goals</h5>
                                        <ul>
                                            <li><i className="fa-solid fa-circle-check text-teal-400"></i> CBT cognitive reframing of work stress</li>
                                            <li><i className="fa-solid fa-circle-check text-teal-400"></i> Implement sleep hygiene routine</li>
                                        </ul>
                                    </div>

                                    <div className="negotiation-history-mock">
                                        <h5>Agreement History & Logs</h5>
                                        <div className="history-item">
                                            <span className="time">10:05 AM</span>
                                            <span><strong>Dr. Carter</strong> proposed contract with fee $150/hr</span>
                                        </div>
                                        {selectedContractFee === 125 && (
                                            <div className="history-item counter">
                                                <span className="time">10:07 AM</span>
                                                <span><strong>Liam (Patient)</strong> countered with fee $125/hr (Approved by Clinician)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="signature-area-mock">
                                        <div className="sig-block">
                                            <span>Clinician Signature</span>
                                            <div className="sig-pad-mock signed">
                                                <span className="sig-draw">Dr. Liam Carter</span>
                                            </div>
                                        </div>
                                        <div className="sig-block">
                                            <span>Patient Signature</span>
                                            <div className={`sig-pad-mock ${signatureSigned ? 'signed' : 'unsigned'}`}>
                                                {signatureSigned ? (
                                                    <span className="sig-draw patient">Liam Carter</span>
                                                ) : (
                                                    <span className="sig-prompt">Awaiting Patient Signature...</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CHAPTER 4 SCREEN: SOAP NOTES COPILOT */}
                        {activeChapterIndex === 3 && (
                            <div className="mock-screen soap-copilot-mock">
                                <div className="soap-split-layout">
                                    <div className="soap-dictation-side">
                                        <h4>Raw Session Dictation</h4>
                                        <div className="dictation-textbox">
                                            {typedText}
                                            <span className="cursor-blink">|</span>
                                        </div>
                                        <button className="compile-btn-mock" disabled={isCompilingSoap}>
                                            {isCompilingSoap ? (
                                                <span><i className="fa-solid fa-spinner fa-spin"></i> Gemini Synthesizing...</span>
                                            ) : (
                                                <span>Compile SOAP Document <i className="fa-solid fa-wand-magic-sparkles"></i></span>
                                            )}
                                        </button>
                                    </div>

                                    <div className="soap-compiled-side">
                                        <h4>AI Synthesized SOAP Note</h4>
                                        {soapGenerated ? (
                                            <div className="compiled-soap-document">
                                                <div className="soap-sec">
                                                    <strong>SUBJECTIVE:</strong>
                                                    <p>Patient reports feeling overwhelmed at work. Insomnia traits present, sleep onset latency is 90 mins. Endorses daily fatigue. Denies suicidal ideation.</p>
                                                </div>
                                                <div className="soap-sec">
                                                    <strong>OBJECTIVE:</strong>
                                                    <p>Patient was communicative and cooperative. Focus maintained throughout session. Normal speech.</p>
                                                </div>
                                                <div className="soap-sec">
                                                    <strong>ASSESSMENT:</strong>
                                                    <p>Occupational distress. Insomnia secondary to anxiety. Patient is coping but demonstrates significant somatic fatigue.</p>
                                                </div>
                                                <div className="soap-sec">
                                                    <strong>PLAN:</strong>
                                                    <p>Review cognitive restructuring. Implement abdominal breathing techniques before bedtime. Telehealth session next week.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="soap-mock-placeholder">
                                                <i className="fa-solid fa-wand-magic-sparkles magic-icon-mock"></i>
                                                <p>Awaiting dictation text analysis to compile structured clinical note representation...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CHAPTER 5 SCREEN: TELEHEALTH SESSION */}
                        {activeChapterIndex === 4 && (
                            <div className="mock-screen telehealth-mock">
                                <div className="telehealth-main-view">
                                    <div className="video-layout-mock">
                                        {/* Large Patient Video */}
                                        <div className="patient-video-feed">
                                            <div className="avatar-mock">LC</div>
                                            <span className="video-name">Liam Carter (Patient)</span>
                                            <div className="audio-level-mock">
                                                <span></span>
                                                <span className="active"></span>
                                                <span></span>
                                            </div>
                                        </div>
                                        {/* Small Doctor Picture-in-Picture */}
                                        <div className="doctor-pip-feed">
                                            <div className="avatar-mock dr">DC</div>
                                            <span className="video-name">You (Dr. Carter)</span>
                                        </div>
                                    </div>

                                    <div className="telehealth-controls-bar">
                                        <button className="control-btn"><i className="fa-solid fa-microphone"></i></button>
                                        <button className="control-btn"><i className="fa-solid fa-video"></i></button>
                                        <button className="control-btn"><i className="fa-solid fa-desktop"></i></button>
                                        <button className="control-btn disconnect"><i className="fa-solid fa-phone-slash"></i></button>
                                    </div>
                                </div>

                                <div className="telehealth-sidebar-chat">
                                    <div className="chat-header">
                                        <span>Session Room: <code>psy-liam-carter</code></span>
                                        <span className="status-indicator-live">LIVE</span>
                                    </div>
                                    <div className="chat-messages-mock">
                                        <div className="msg-bubble patient">
                                            <strong>Liam:</strong> Hello Doctor, I've loaded the breathing exercises sheet.
                                        </div>
                                        <div className="msg-bubble clinician">
                                            <strong>Dr. Carter:</strong> Great. Let's do a quick evaluation first.
                                        </div>
                                    </div>
                                    <div className="chat-input-area-mock">
                                        <input type="text" placeholder="Type message..." readOnly />
                                        <button className="send-btn"><i className="fa-solid fa-paper-plane"></i></button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subtitle Narration bar */}
                    <div className="stage-narration-bar">
                        <div className="narration-avatar">
                            <i className="fa-solid fa-comment-dots"></i>
                        </div>
                        <div className="narration-text-content">
                            {currentChapter.narration}
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Player Controls Bar */}
            <div className="product-tour-controls-bar">
                <div className="controls-left">
                    <button className="media-btn" onClick={() => handleStep('backward')} title="Previous Chapter">
                        <i className="fa-solid fa-backward-step"></i>
                    </button>
                    <button className="media-btn play-btn" onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"}>
                        {isPlaying ? <i className="fa-solid fa-pause"></i> : <i className="fa-solid fa-play"></i>}
                    </button>
                    <button className="media-btn" onClick={() => handleStep('forward')} title="Next Chapter">
                        <i className="fa-solid fa-forward-step"></i>
                    </button>
                    <span className="time-display">{formatTime(currentTime)} / 01:00</span>
                </div>

                <div className="controls-middle">
                    <input 
                        type="range" 
                        min="0" 
                        max="60" 
                        step="0.1" 
                        value={currentTime} 
                        onChange={handleScrub}
                        className="player-timeline-slider"
                    />
                    <div className="chapter-ticks">
                        {CHAPTERS.map((ch, idx) => (
                            <div 
                                key={ch.id} 
                                className={`tick ${currentTime >= ch.timeRange[0] ? 'passed' : ''}`}
                                style={{ left: `${(ch.timeRange[0] / 60) * 100}%` }}
                                title={ch.title}
                                onClick={() => handleChapterJump(idx)}
                            />
                        ))}
                    </div>
                </div>

                <div className="controls-right">
                    <div className="speed-selector">
                        <button className={`speed-btn ${playbackSpeed === 1 ? 'active' : ''}`} onClick={() => setPlaybackSpeed(1)}>1x</button>
                        <button className={`speed-btn ${playbackSpeed === 1.5 ? 'active' : ''}`} onClick={() => setPlaybackSpeed(1.5)}>1.5x</button>
                        <button className={`speed-btn ${playbackSpeed === 2 ? 'active' : ''}`} onClick={() => setPlaybackSpeed(2)}>2x</button>
                    </div>
                    <button className="export-screenshot-btn" onClick={handleExport} title="Download High-Resolution Screenshot of this view">
                        <i className="fa-solid fa-camera"></i> Export Screen
                    </button>
                </div>
            </div>
        </div>
    );
}
