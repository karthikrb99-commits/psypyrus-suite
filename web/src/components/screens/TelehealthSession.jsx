import { useState, useEffect, useRef } from 'react';
import { Database } from '../../services/db';
import { GeminiService } from '../../services/ai';

export function TelehealthSession({
    patients,
    activePatientId,
    activeRole
}) {
    const [callActive, setCallActive] = useState(false);
    const [micMuted, setMicMuted] = useState(false);
    const [recordingEnabled, setRecordingEnabled] = useState(true);
    const [chatInput, setChatInput] = useState('');
    const [chatLogs, setChatLogs] = useState([
        "Dr. Brewster: Hi Liam. Glad you joined. We'll check your GAD-7 metrics today.",
        "Liam: Yes, corporative stress was high this past week but practiced somatic breathing."
    ]);
    const [loadingSoap, setLoadingSoap] = useState(false);
    const [soapResult, setSoapResult] = useState('');

    // Session Timer State
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [liveNotes, setLiveNotes] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState([
        "Discuss sleep latency and laptop screen boundaries",
        "Explore corporate triggers linked to somatic muscle tension",
        "Inquire about frequency of diaphragmatic box breathing practice"
    ]);

    // Voice waves animation state
    const [waveHeights, setWaveHeights] = useState([1, 1, 1, 1]);
    const waveIntervalRef = useRef(null);
    const chatEndRef = useRef(null);
    const timerRef = useRef(null);

    const activePatient = patients.find(p => p.id === activePatientId) || patients[0];
    const patientName = activePatient ? activePatient.name : 'Liam Carter';

    // Scroll chat to bottom on updates
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatLogs, callActive]);

    // Timer hook
    useEffect(() => {
        if (callActive) {
            timerRef.current = setInterval(() => {
                setTimerSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setTimerSeconds(0);
        }
        return () => clearInterval(timerRef.current);
    }, [callActive]);

    // Waveform scale animator
    useEffect(() => {
        if (callActive) {
            waveIntervalRef.current = setInterval(() => {
                setWaveHeights([
                    Math.random() * 1.5 + 0.3,
                    Math.random() * 1.5 + 0.3,
                    Math.random() * 1.5 + 0.3,
                    Math.random() * 1.5 + 0.3
                ]);
            }, 150);
        } else {
            clearInterval(waveIntervalRef.current);
            setWaveHeights([1, 1, 1, 1]);
        }

        return () => clearInterval(waveIntervalRef.current);
    }, [callActive]);

    const formatTimer = (totalSecs) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleStartCall = () => {
        setCallActive(true);
        Database.logAudit("Initiated Video Session", `Video telehealth session locked for room PSY-PYR-401 for patient ${patientName}.`);
    };

    const handleHangup = () => {
        setCallActive(false);
        setSoapResult('');
        Database.logAudit("Terminated Video Session", `Session room closed for patient ${patientName}.`);
    };

    const handleSendChat = () => {
        const val = chatInput.trim();
        if (!val) return;

        const prefix = activeRole === "Professional" ? "Dr. Brewster" : patientName.split(' ')[0];
        const newLogs = [...chatLogs, `${prefix}: ${val}`];
        setChatLogs(newLogs);
        setChatInput('');

        // Reactively update AI suggestions to simulate conversation parsing
        setTimeout(() => {
            if (val.toLowerCase().includes("stress") || val.toLowerCase().includes("job")) {
                setAiSuggestions([
                    "Evaluate cognitive catastrophizing of corporate peer reviews",
                    "Explore diaphragmatic breathing stabilizer in meeting settings",
                    "Introduce boundaries around post-8:00 PM email screen checks"
                ]);
            } else if (val.toLowerCase().includes("sleep") || val.toLowerCase().includes("night")) {
                setAiSuggestions([
                    "Verify sleep onset latency vs. middle-of-night awakenings",
                    "Review blue-light filters or evening routine restructuring",
                    "Discuss cognitive journaling before bedtime to offload worry cycles"
                ]);
            } else {
                setAiSuggestions([
                    "Inquire about patient's subjective anxiety ratings this week",
                    "Conduct review of PHQ-9 or GAD-7 homework exercises",
                    "Track somatic triggers during client presentations"
                ]);
            }
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSendChat();
    };

    const handleCompileSoap = async () => {
        const transcript = chatLogs.join("\n");
        setLoadingSoap(true);
        setSoapResult('');

        try {
            const prompt = `Compile the following session conversation transcript into a structured, formal healthcare SOAP note. Include SUBJECTIVE, OBJECTIVE, ASSESSMENT, and PLAN. Suggest matching diagnoses with DSM-5, ICD-11, and SNOMED CT Concept IDs as recommended by NRCeS India. Also format a standard prescription following the MoHFW Telemedicine Practice Guidelines (2020), detailing the RMP Registration Number (e.g. RMP-91024), patient details, and generic drug names with dosages.\n\nTranscript:\n"${transcript}"`;
            const result = await GeminiService.callGemini(prompt, "You are a clinical psychologist assistant compiling telehealth SOAP summaries.");
            setSoapResult(result);

            Database.insertClinicalNote({
                patientId: activePatientId,
                title: `EHR SOAP Note (Telehealth Session)`,
                noteType: "SOAP",
                bodyJson: result
            });
        } catch (e) {
            alert(`Error compiling SOAP note: ${e.message}`);
        } finally {
            setLoadingSoap(false);
        }
    };

    const handleSaveLiveNotes = () => {
        if (!liveNotes.trim()) return;
        Database.insertClinicalNote({
            patientId: activePatientId,
            title: `Clinician Live Session Notes`,
            noteType: "GENERAL",
            bodyJson: liveNotes
        });
        alert("Session notes saved to EHR chart successfully.");
        setLiveNotes('');
    };

    return (
        <div className="screen-container active" id="screen-teletherapy">
            <style>{`
                .telehealth-workstation-grid {
                    display: grid;
                    grid-template-columns: 1.3fr 0.7fr;
                    gap: 24px;
                    margin-top: 16px;
                }
                @media (max-width: 992px) {
                    .telehealth-workstation-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .call-blackbox-container {
                    background: #000;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.06);
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .call-meta-bar {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 20px;
                    background: rgba(0,0,0,0.4);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    font-size: 12px;
                    align-items: center;
                    z-index: 10;
                }
                .blinking-rec-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: var(--color-error);
                    display: inline-block;
                    animation: recPulse 1s infinite alternate;
                    margin-right: 6px;
                }
                @keyframes recPulse {
                    from { opacity: 0.2; }
                    to { opacity: 1; }
                }
                .live-notes-area {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    box-sizing: border-box;
                }
                .ai-suggestions-box {
                    background: rgba(0, 242, 254, 0.03);
                    border: 1px solid rgba(0, 242, 254, 0.1);
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 16px;
                }
            `}</style>

            <div className="section-header-block">
                <i className="fa-solid fa-video"></i>
                <h2>Telehealth Secure Video Chamber</h2>
            </div>

            {!callActive ? (
                /* Pre-Call Entry */
                <div className="workspace-card" id="teletherapy-entry-panel" style={{ padding: '40px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <i className="fa-solid fa-video-slash" style={{ fontSize: '64px', color: 'var(--color-primary)', marginBottom: '16px' }}></i>
                        <h3 style={{ margin: 0, color: 'var(--text-light)', fontSize: '18px' }}>
                            Encrypted Room Endpoint: PSY-PYR-401
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                            Secure E2E envelope encryption session line active. Subject target: <strong>{patientName}</strong>
                        </p>
                        <button 
                            className="action-button-btn" 
                            style={{ width: '100%', maxWidth: '280px', marginTop: '20px' }}
                            onClick={handleStartCall}
                        >
                            Open Video Feed Connection
                        </button>
                    </div>
                </div>
            ) : (
                /* Call Active Workspace Grid */
                <div className="telehealth-workstation-grid">
                    
                    {/* Left: Video feed, console, and companion chat */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div className="call-blackbox-container">
                            
                            {/* Top metadata bar */}
                            <div className="call-meta-bar">
                                <span style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}>
                                    {recordingEnabled && <span className="blinking-rec-dot"></span>}
                                    {recordingEnabled ? 'HIPAA Audit Record: Active' : 'Private Line'}
                                </span>
                                <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                    Duration: {formatTimer(timerSeconds)}
                                </span>
                            </div>

                            {/* Viewports */}
                            <div className="video-grid-blackbox" style={{ padding: '20px 0' }}>
                                <div className="video-avatars-row" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <div className="video-user-viewport clinician" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div className="avatar-circle-display">KB</div>
                                        <span className="video-user-label">Dr. Brewster (You)</span>
                                    </div>
                                    
                                    <div className="video-user-viewport patient" style={{ background: 'rgba(0, 242, 254, 0.02)', border: '1px solid var(--color-primary)' }}>
                                        <div className="avatar-circle-display">{patientName.split(' ').map(n => n[0]).join('')}</div>
                                        <span className="video-user-label">{patientName}</span>
                                        
                                        {/* Speaking audio pacer */}
                                        <div className="waveform-wave-container" style={{ display: 'flex', gap: '4px', height: '24px', alignItems: 'center', marginTop: '8px' }}>
                                            {waveHeights.map((h, idx) => (
                                                <div 
                                                    key={idx} 
                                                    style={{ 
                                                        transform: `scaleY(${h})`, 
                                                        transition: 'transform 0.15s ease',
                                                        width: '4px',
                                                        height: '100%',
                                                        backgroundColor: 'var(--color-primary)',
                                                        borderRadius: '2px'
                                                    }}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Controls Console */}
                            <div className="video-controls-console" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px' }}>
                                <button className={`video-console-btn ${micMuted ? 'muted' : ''}`} onClick={() => setMicMuted(!micMuted)} title="Mute Mic">
                                    <i className={`fa-solid ${micMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                                </button>
                                <button className="video-console-btn hangup" onClick={handleHangup} title="Disconnect Session">
                                    <i className="fa-solid fa-phone-slash"></i>
                                </button>
                                <button className={`video-console-btn record ${recordingEnabled ? 'active' : ''}`} onClick={() => setRecordingEnabled(!recordingEnabled)} title="Toggle Recording Ledger">
                                    <i className="fa-solid fa-record-vinyl"></i>
                                </button>
                            </div>
                        </div>

                        {/* Companion chat */}
                        <div className="secure-companion-chat-box">
                            <h4 className="chat-console-title">Companion Chat Feed</h4>
                            <div className="chat-logs-area" style={{ height: '160px', overflowY: 'auto' }}>
                                {chatLogs.map((log, idx) => {
                                    const isMe = log.startsWith("Dr. Brewster:");
                                    return (
                                        <div key={idx} className="chat-message-bubble" style={{ textAlign: isMe ? 'left' : 'right' }}>
                                            <span style={{ 
                                                background: isMe ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255,255,255,0.03)', 
                                                border: `1px solid ${isMe ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.05)'}`,
                                                padding: '6px 12px', 
                                                borderRadius: '10px', 
                                                display: 'inline-block', 
                                                fontSize: '12px'
                                            }}>
                                                {log}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef}></div>
                            </div>
                            <div className="chat-composer-row" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                <input 
                                    className="input-text-field" 
                                    placeholder="Type secure chat coordinates..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    style={{ flexGrow: 1 }}
                                />
                                <button className="action-button-btn" onClick={handleSendChat}>
                                    <i className="fa-solid fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Live scribble notes, quick triggers, and AI Prompts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* Live scribble pad */}
                        <div className="live-notes-area">
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>
                                Clinician Scribble Pad (Session Notes)
                            </span>
                            <textarea
                                className="input-text-field"
                                style={{ flexGrow: 1, minHeight: '140px', resize: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12px' }}
                                placeholder="Jot down active descriptors, symptoms, or behavior insights to save directly to patient EHR chart..."
                                value={liveNotes}
                                onChange={(e) => setLiveNotes(e.target.value)}
                            />
                            <button className="action-button-btn secondary-btn" style={{ marginTop: '10px', width: '100%' }} onClick={handleSaveLiveNotes} disabled={!liveNotes.trim()}>
                                Save scribble to EHR Chart
                            </button>
                        </div>

                        {/* Quick Assessment Triggers */}
                        {activeRole === 'Professional' && (
                            <div className="workspace-card">
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)' }}>
                                    Quick launch assessments
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                                    <button className="patient-filter-chip active" style={{ margin: 0, fontSize: '11px' }} onClick={() => alert("GAD-7 checklist pushed to patient's active screen.")}>Launch GAD-7</button>
                                    <button className="patient-filter-chip active" style={{ margin: 0, fontSize: '11px' }} onClick={() => alert("PHQ-9 checklist pushed to patient's active screen.")}>Launch PHQ-9</button>
                                </div>
                            </div>
                        )}

                        {/* MoHFW Telemedicine Guidelines Compliance Checklist */}
                        <div className="workspace-card" style={{ border: '1px solid rgba(0, 242, 254, 0.15)', background: 'rgba(0, 242, 254, 0.02)' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i>
                                Telemedicine Compliance Tracker
                            </span>
                            <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px', marginBlockEnd: '10px' }}>
                                Compliant with India Telemedicine Practice Guidelines (MoHFW)
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label className="checkbox-option-row" style={{ padding: '2px 0', cursor: 'pointer' }}>
                                    <input type="checkbox" className="checkbox-control" defaultChecked={true} style={{ accentColor: 'var(--color-primary)' }} />
                                    <span className="checkbox-label" style={{ fontSize: '11px', color: '#fff', marginLeft: '6px' }}>Verify RMP Registration Number</span>
                                </label>
                                <label className="checkbox-option-row" style={{ padding: '2px 0', cursor: 'pointer' }}>
                                    <input type="checkbox" className="checkbox-control" defaultChecked={true} style={{ accentColor: 'var(--color-primary)' }} />
                                    <span className="checkbox-label" style={{ fontSize: '11px', color: '#fff', marginLeft: '6px' }}>Confirm Patient Identity & Age</span>
                                </label>
                                <label className="checkbox-option-row" style={{ padding: '2px 0', cursor: 'pointer' }}>
                                    <input type="checkbox" className="checkbox-control" defaultChecked={true} style={{ accentColor: 'var(--color-primary)' }} />
                                    <span className="checkbox-label" style={{ fontSize: '11px', color: '#fff', marginLeft: '6px' }}>Obtain Explicit Telehealth Consent</span>
                                </label>
                                <label className="checkbox-option-row" style={{ padding: '2px 0', cursor: 'pointer' }}>
                                    <input type="checkbox" className="checkbox-control" style={{ accentColor: 'var(--color-primary)' }} />
                                    <span className="checkbox-label" style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '6px' }}>Prescribe Generic Drug Names Only</span>
                                </label>
                            </div>
                        </div>

                        {/* Real-time AI Suggestions */}
                        <div className="ai-suggestions-box">
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                                AI Clinical Prompts Assistant
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '11px', color: 'var(--text-normal)' }}>
                                {aiSuggestions.map((sug, idx) => (
                                    <div key={idx} style={{ padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', borderLeft: '2px solid var(--color-primary)' }}>
                                        {sug}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Post-Session SOAP compile */}
            {callActive && (
                <div style={{ marginTop: '24px' }}>
                    <button 
                        className="action-button-btn" 
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={handleCompileSoap}
                        disabled={loadingSoap}
                    >
                        {loadingSoap ? (
                            <>
                                <span className="loader-dual-ring"></span>
                                Generating SOAP Note...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-wand-magic-sparkles"></i> 
                                Auto-Compile AI SOAP Note from Session Transcript
                            </>
                        )}
                    </button>

                    {soapResult && (
                        <div className="workspace-card" style={{ marginTop: '20px' }}>
                            <div className="card-title-bar">
                                <h3>AI Compiled Telehealth SOAP Note:</h3>
                            </div>
                            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', color: 'var(--text-normal)', fontFamily: 'inherit', lineHeight: 1.5 }}>
                                {soapResult}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
