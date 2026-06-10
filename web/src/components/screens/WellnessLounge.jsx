import React, { useState, useEffect, useRef } from 'react';
import { Database } from '../../services/db';

export function WellnessLounge({ activePatientId = 1 }) {
    // Meditation state
    const [meditationSeconds, setMeditationSeconds] = useState(300);
    const [meditationRunning, setMeditationRunning] = useState(false);
    const [ambientSound, setAmbientSound] = useState('zen');
    const [completionStreak, setCompletionStreak] = useState(0);
    const meditationIntervalRef = useRef(null);

    // Paced breathing states
    const [breathingActive, setBreathingActive] = useState(false);
    const [breathingPattern, setBreathingPattern] = useState('box'); // 'box', '478', 'equal'
    const [breathingPhase, setBreathingPhase] = useState('IDLE'); // 'INHALE', 'HOLD', 'EXHALE', 'REST'
    const [phaseSeconds, setPhaseSeconds] = useState(0);
    const breathingTimerRef = useRef(null);

    // Mood logger state
    const [moodScore, setMoodScore] = useState(7);
    const [gratitude, setGratitude] = useState('');
    const [moodNote, setMoodNote] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Local lists for trends
    const [moodLogs, setMoodLogs] = useState([]);
    const [wellnessScore, setWellnessScore] = useState(75);

    // Load logs and calculate stats on mount / log update
    useEffect(() => {
        const logs = Database.getMoodLogs().filter(l => l.patientId === Number(activePatientId));
        setMoodLogs(logs);

        // Calculate a composite Daily Wellness Score:
        // - Avg mood of last 3 logs * 6 (max 60 points)
        // - Average breathing seconds in last 3 logs / 15 (max 20 points)
        // - Homework completion rate * 20 (max 20 points)
        const recentLogs = logs.slice(-3);
        const avgMood = recentLogs.length ? recentLogs.reduce((sum, l) => sum + l.moodScore, 0) / recentLogs.length : 7;
        const avgBreathing = recentLogs.length ? recentLogs.reduce((sum, l) => sum + (l.breathingSeconds || 0), 0) / recentLogs.length : 120;
        
        const homework = Database.getHomework(activePatientId);
        const completedHW = homework.length ? homework.filter(h => h.isCompleted).length / homework.length : 0.75;

        const score = Math.round((avgMood * 6) + Math.min(20, avgBreathing / 15) + (completedHW * 20));
        setWellnessScore(Math.min(100, Math.max(10, score)));

        // Calculate consecutive days for streak
        if (logs.length > 0) {
            let streak = 0;
            let lastDate = null;
            const uniqueDays = Array.from(new Set(logs.map(l => new Date(l.date).toDateString()))).map(d => new Date(d));
            uniqueDays.sort((a,b) => b - a); // newest first

            const today = new Date();
            today.setHours(0,0,0,0);
            const checkDate = new Date(uniqueDays[0]);
            checkDate.setHours(0,0,0,0);

            // If last log is today or yesterday
            if ((today - checkDate) / (1000*60*60*24) <= 1) {
                streak = 1;
                for (let i = 0; i < uniqueDays.length - 1; i++) {
                    const diff = (uniqueDays[i] - uniqueDays[i+1]) / (1000*60*60*24);
                    if (diff <= 1.1) { // allowance for timezone shifts
                        streak++;
                    } else {
                        break;
                    }
                }
            }
            setCompletionStreak(streak);
        }
    }, [activePatientId, toastMessage]);

    // Meditation Timer hook
    useEffect(() => {
        if (meditationRunning) {
            meditationIntervalRef.current = setInterval(() => {
                setMeditationSeconds((prev) => {
                    if (prev <= 1) {
                        clearInterval(meditationIntervalRef.current);
                        setMeditationRunning(false);
                        
                        // Increment streak and insert a mood log activity representation
                        Database.insertMoodLog({
                            moodScore: 8,
                            moodNote: `Completed a ${ambientSound === 'silence' ? 'silent' : ambientSound} meditation session.`,
                            gratitude: "Completed self-regulation meditation practice.",
                            breathingSeconds: 300
                        });

                        setToastMessage("Meditation completed! Daily streak updated.");
                        setTimeout(() => setToastMessage(''), 3000);
                        return 300; // Reset
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(meditationIntervalRef.current);
        }

        return () => clearInterval(meditationIntervalRef.current);
    }, [meditationRunning, ambientSound]);

    // Paced Breathing cycles config
    const breathingCycles = {
        box: [
            { phase: 'INHALE', duration: 4, msg: 'Breathe in slowly...' },
            { phase: 'HOLD', duration: 4, msg: 'Hold your breath...' },
            { phase: 'EXHALE', duration: 4, msg: 'Release slowly...' },
            { phase: 'REST', duration: 4, msg: 'Wait before inhale...' }
        ],
        478: [
            { phase: 'INHALE', duration: 4, msg: 'Breathe in quietly...' },
            { phase: 'HOLD', duration: 7, msg: 'Hold, let tension dissolve...' },
            { phase: 'EXHALE', duration: 8, msg: 'Sigh out fully...' }
        ],
        equal: [
            { phase: 'INHALE', duration: 5, msg: 'Breathe in...' },
            { phase: 'EXHALE', duration: 5, msg: 'Breathe out...' }
        ]
    };

    // Paced Breathing hook
    useEffect(() => {
        if (breathingActive) {
            let cycleIndex = 0;
            const cycle = breathingCycles[breathingPattern];
            
            const runStep = () => {
                const step = cycle[cycleIndex];
                setBreathingPhase(step.phase);
                setPhaseSeconds(step.duration);

                let durationLeft = step.duration;
                
                // Set up local countdown timer per phase
                const interval = setInterval(() => {
                    durationLeft--;
                    setPhaseSeconds(durationLeft);
                    if (durationLeft <= 0) {
                        clearInterval(interval);
                        cycleIndex = (cycleIndex + 1) % cycle.length;
                        runStep(); // move to next step
                    }
                }, 1000);

                breathingTimerRef.current = interval;
            };

            runStep();
        } else {
            if (breathingTimerRef.current) {
                clearInterval(breathingTimerRef.current);
            }
            setBreathingPhase('IDLE');
            setPhaseSeconds(0);
        }

        return () => {
            if (breathingTimerRef.current) {
                clearInterval(breathingTimerRef.current);
            }
        };
    }, [breathingActive, breathingPattern]);

    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const remainder = secs % 60;
        return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
    };

    const handleLogMood = () => {
        Database.insertMoodLog({
            moodScore: Number(moodScore),
            moodNote: moodNote.trim() || "Routine self-logged mood checkpoint.",
            gratitude: gratitude.trim(),
            breathingSeconds: breathingActive ? 180 : 0
        });

        setToastMessage("Mood record committed successfully to EHR catalog.");
        setGratitude('');
        setMoodNote('');
        setTimeout(() => setToastMessage(''), 3000);
    };

    // Calculate class names for animated concentric breathing circles
    const getBreathingCircleClass = () => {
        if (!breathingActive) return "breathing-circle-outer idle";
        if (breathingPhase === 'INHALE') return "breathing-circle-outer inhale";
        if (breathingPhase === 'EXHALE') return "breathing-circle-outer exhale";
        if (breathingPhase === 'HOLD') return "breathing-circle-outer hold";
        return "breathing-circle-outer rest";
    };

    // Custom SVG Renderer for Mood logs
    const renderMoodChart = () => {
        if (moodLogs.length === 0) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Log emotions to initiate analytical mood trajectory charts.
                </div>
            );
        }

        const width = 450;
        const height = 150;
        const paddingLeft = 30;
        const paddingRight = 15;
        const paddingTop = 20;
        const paddingBottom = 25;

        // Take last 7 logs
        const displayLogs = moodLogs.slice(-7);
        const numPoints = displayLogs.length;

        const points = displayLogs.map((log, idx) => {
            const x = paddingLeft + (idx * (width - paddingLeft - paddingRight) / (numPoints - 1 || 1));
            // y scale is from 1 (bottom) to 10 (top)
            const y = height - paddingBottom - ((log.moodScore - 1) * (height - paddingTop - paddingBottom) / 9);
            return { x, y, score: log.moodScore, date: new Date(log.date).toLocaleDateString() };
        });

        // Generate smooth quadratic curve path d
        let pathD = "";
        if (points.length > 0) {
            pathD = `M ${points[0].x} ${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const xc = (p0.x + p1.x) / 2;
                const yc = (p0.y + p1.y) / 2;
                pathD += ` Q ${p0.x} ${p0.y}, ${xc} ${yc}`;
            }
            // Close the final segment
            pathD += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
        }

        // Area path for gradient fill
        const areaD = points.length > 0 
            ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z` 
            : "";

        return (
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                {/* Horizontal reference grid lines */}
                {[1, 5, 10].map((level) => {
                    const y = height - paddingBottom - ((level - 1) * (height - paddingTop - paddingBottom) / 9);
                    return (
                        <g key={level}>
                            <line 
                                x1={paddingLeft} 
                                y1={y} 
                                x2={width - paddingRight} 
                                y2={y} 
                                stroke="rgba(255,255,255,0.06)" 
                                strokeDasharray="3,3" 
                            />
                            <text 
                                x={paddingLeft - 8} 
                                y={y + 4} 
                                fill="var(--text-muted)" 
                                fontSize="9" 
                                textAnchor="end"
                            >
                                {level}
                            </text>
                        </g>
                    );
                })}

                {/* Shaded Area Under Line */}
                {areaD && <path d={areaD} fill="url(#chartGradient)" />}

                {/* Line Path */}
                {pathD && (
                    <path 
                        d={pathD} 
                        fill="none" 
                        stroke="var(--color-primary)" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                    />
                )}

                {/* Individual Data Points */}
                {points.map((p, idx) => (
                    <g key={idx}>
                        <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r="4.5" 
                            fill="var(--color-bg-dark)" 
                            stroke="var(--color-primary)" 
                            strokeWidth="2" 
                        />
                        <text 
                            x={p.x} 
                            y={p.y - 10} 
                            fill="var(--text-light)" 
                            fontSize="9" 
                            fontWeight="bold" 
                            textAnchor="middle"
                        >
                            {p.score}
                        </text>
                        <text 
                            x={p.x} 
                            y={height - 8} 
                            fill="var(--text-muted)" 
                            fontSize="8" 
                            textAnchor="middle"
                        >
                            {p.date.split('/')[0] + '/' + p.date.split('/')[1]}
                        </text>
                    </g>
                ))}
            </svg>
        );
    };

    // Filtered journal entries
    const filteredLogs = moodLogs
        .filter(l => l.gratitude && l.gratitude.toLowerCase().includes(searchQuery.toLowerCase()))
        .reverse();

    return (
        <div className="screen-container active" id="screen-patient-wellness">
            {/* Embedded styles for localized breathing animation & layout */}
            <style>{`
                .wellness-dashboard-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    margin-top: 16px;
                }
                @media (max-width: 992px) {
                    .wellness-dashboard-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .wellness-score-hero {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: linear-gradient(135deg, rgba(0, 242, 254, 0.08), rgba(79, 172, 254, 0.08));
                    border: 1px solid rgba(0, 242, 254, 0.15);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .wellness-score-value {
                    font-size: 38px;
                    font-weight: 800;
                    color: var(--color-primary);
                    text-shadow: 0 0 15px rgba(0, 242, 254, 0.3);
                }
                .preset-duration-row {
                    display: flex;
                    gap: 6px;
                    margin-bottom: 16px;
                    justify-content: center;
                }
                .preset-duration-btn {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    color: var(--text-normal);
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .preset-duration-btn:hover {
                    background: rgba(255,255,255,0.07);
                    color: var(--text-light);
                }
                .preset-duration-btn.active {
                    background: var(--color-primary-glow);
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                }
                .sound-select-row {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .sound-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .sound-option i {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    transition: all 0.2s ease;
                }
                .sound-option.active i {
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                    background: var(--color-primary-glow);
                    box-shadow: 0 0 10px rgba(0, 242, 254, 0.2);
                }
                .sound-option.active {
                    color: var(--text-light);
                }

                /* Breathing Mandala/Circle styles */
                .breathing-workstation {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 240px;
                    position: relative;
                }
                .breathing-circle-outer {
                    width: 140px;
                    height: 140px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(0, 242, 254, 0.05) 0%, rgba(79, 172, 254, 0.15) 100%);
                    border: 1px solid rgba(0, 242, 254, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transition: transform 4s cubic-bezier(0.4, 0, 0.2, 1), background-color 1s ease, border-color 1s ease;
                }
                .breathing-circle-outer.idle {
                    transform: scale(1.0);
                }
                .breathing-circle-outer.inhale {
                    transform: scale(1.6);
                    background: radial-gradient(circle, rgba(0, 242, 254, 0.2) 0%, rgba(79, 172, 254, 0.3) 100%);
                    border-color: var(--color-primary);
                    box-shadow: 0 0 25px rgba(0, 242, 254, 0.3);
                }
                .breathing-circle-outer.hold {
                    transform: scale(1.6);
                    background: radial-gradient(circle, rgba(245, 166, 35, 0.15) 0%, rgba(245, 166, 35, 0.25) 100%);
                    border-color: var(--color-warning);
                    box-shadow: 0 0 25px rgba(245, 166, 35, 0.25);
                }
                .breathing-circle-outer.exhale {
                    transform: scale(1.0);
                    background: radial-gradient(circle, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.1) 100%);
                    border-color: var(--color-accent);
                    box-shadow: 0 0 15px rgba(79, 172, 254, 0.1);
                }
                .breathing-circle-outer.rest {
                    transform: scale(1.0);
                    background: rgba(255,255,255,0.01);
                    border-color: rgba(255,255,255,0.1);
                }

                .breathing-circle-inner {
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    background: rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                }

                /* Simulated Soundwave Animations */
                .soundwave-container {
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    gap: 3px;
                    height: 20px;
                    margin-top: 10px;
                }
                .soundwave-bar {
                    width: 3px;
                    height: 4px;
                    background-color: var(--color-primary);
                    border-radius: 10px;
                }
                .soundwave-container.animating .soundwave-bar:nth-child(1) { animation: soundpulse 0.8s ease infinite alternate; }
                .soundwave-container.animating .soundwave-bar:nth-child(2) { animation: soundpulse 0.5s ease infinite alternate 0.1s; }
                .soundwave-container.animating .soundwave-bar:nth-child(3) { animation: soundpulse 0.9s ease infinite alternate 0.2s; }
                .soundwave-container.animating .soundwave-bar:nth-child(4) { animation: soundpulse 0.6s ease infinite alternate 0.3s; }
                .soundwave-container.animating .soundwave-bar:nth-child(5) { animation: soundpulse 0.7s ease infinite alternate 0.4s; }
                
                @keyframes soundpulse {
                    0% { height: 4px; }
                    100% { height: 20px; }
                }

                .gratitude-list-scroll {
                    max-height: 200px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-top: 12px;
                }
                .gratitude-item {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.04);
                    border-radius: 8px;
                    padding: 10px 12px;
                }
            `}</style>

            <div className="section-header-block">
                <i className="fa-solid fa-spa"></i>
                <h2>Wellness & Somatic Pacing Lounge</h2>
            </div>

            {/* Score and Streak Banner */}
            <div className="wellness-score-hero">
                <div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-light)' }}>Daily Wellness Score</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                        Composite calculation of sleep, homework completion, mood, and somatic exercise sessions.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div className="wellness-score-value">{wellnessScore} / 100</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: Restructured</span>
                    </div>
                    <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-warning)' }}>
                            <i className="fa-solid fa-fire" style={{ marginRight: '6px' }}></i>
                            {completionStreak}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Days Streak</span>
                    </div>
                </div>
            </div>

            {/* Grid Workspace */}
            <div className="wellness-dashboard-grid">
                
                {/* Left side: Breathing & Meditation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Breathing Pacer Card */}
                    <div className="workspace-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-light)' }}>
                                Paced Diaphragmatic Breathing
                            </h4>
                            <select 
                                className="input-text-field" 
                                style={{ margin: 0, padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                                value={breathingPattern}
                                onChange={(e) => {
                                    setBreathingPattern(e.target.value);
                                    setBreathingActive(false);
                                }}
                            >
                                <option value="box">Box Breathing (4-4-4-4)</option>
                                <option value="478">Relaxing 4-7-8 Pattern</option>
                                <option value="equal">Equal Breathing (5-5)</option>
                            </select>
                        </div>

                        <div className="breathing-workstation">
                            <div className={getBreathingCircleClass()}>
                                <div className="breathing-circle-inner">
                                    <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--color-primary)' }}>
                                        {breathingPhase === 'REST' ? 'REST' : breathingPhase}
                                    </span>
                                    {breathingActive && (
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                                            {phaseSeconds}s
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button 
                            className={`action-button-btn ${breathingActive ? 'danger' : ''}`}
                            onClick={() => setBreathingActive(!breathingActive)}
                            style={{ width: '100%', maxWidth: '240px', margin: '0 auto' }}
                        >
                            {breathingActive ? 'Stop Session' : 'Start Somatic Regulation'}
                        </button>
                    </div>

                    {/* Meditation Clock Card */}
                    <div className="workspace-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '12px' }}>
                            Mindfulness Meditation Timer
                        </h4>

                        {/* Preset Buttons */}
                        <div className="preset-duration-row">
                            {[1, 2, 5, 10, 15].map((mins) => (
                                <button 
                                    key={mins}
                                    className={`preset-duration-btn ${meditationSeconds === mins * 60 ? 'active' : ''}`}
                                    onClick={() => {
                                        setMeditationSeconds(mins * 60);
                                        setMeditationRunning(false);
                                    }}
                                    disabled={meditationRunning}
                                >
                                    {mins}m
                                </button>
                            ))}
                        </div>

                        {/* Sound Selector */}
                        <div className="sound-select-row">
                            {[
                                { id: 'zen', label: 'Zen Bell', icon: 'fa-bell' },
                                { id: 'rain', label: 'Rain', icon: 'fa-cloud-showers-heavy' },
                                { id: 'ocean', label: 'Ocean', icon: 'fa-water' },
                                { id: 'silence', label: 'Silence', icon: 'fa-volume-mute' }
                            ].map((snd) => (
                                <div 
                                    key={snd.id} 
                                    className={`sound-option ${ambientSound === snd.id ? 'active' : ''}`}
                                    onClick={() => setAmbientSound(snd.id)}
                                >
                                    <i className={`fa-solid ${snd.icon}`}></i>
                                    <span>{snd.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Main Timer Display */}
                        <div style={{ fontSize: '56px', lineHeight: 1.1, margin: '8px 0 20px 0', fontFamily: 'monospace', color: 'var(--text-light)', fontWeight: 600 }}>
                            {formatTime(meditationSeconds)}
                        </div>

                        {/* Pulse Waveform simulator when running */}
                        <div className={`soundwave-container ${meditationRunning ? 'animating' : ''}`}>
                            <div className="soundwave-bar"></div>
                            <div className="soundwave-bar"></div>
                            <div className="soundwave-bar"></div>
                            <div className="soundwave-bar"></div>
                            <div className="soundwave-bar"></div>
                        </div>

                        <button 
                            className={`action-button-btn ${meditationRunning ? 'danger' : ''}`}
                            onClick={() => setMeditationRunning(!meditationRunning)}
                            style={{ width: '100%', maxWidth: '240px', marginTop: '20px' }}
                        >
                            {meditationRunning ? 'Pause Session' : 'Begin Quiet Meditation'}
                        </button>
                    </div>
                </div>

                {/* Right side: Mood Logging & Gratitude History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Daily Mood Logger */}
                    <div className="workspace-card">
                        <div className="card-title-bar">
                            <h3>Secure Mood Checkpoint</h3>
                        </div>
                        
                        <div className="interactive-slider-row" style={{ marginBottom: '16px' }}>
                            <div className="slider-label-block">
                                <span>Current Emotional State (1-10):</span>
                                <strong style={{ color: 'var(--color-primary)', fontSize: '16px' }}>{moodScore} / 10</strong>
                            </div>
                            <input 
                                type="range" 
                                className="slider-control-field" 
                                min="1" 
                                max="10" 
                                value={moodScore}
                                onChange={(e) => setMoodScore(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                            />
                        </div>

                        <div className="form-field-group">
                            <label className="form-label">Briefly describe your mood or current stressors:</label>
                            <input 
                                type="text" 
                                className="input-text-field" 
                                placeholder="e.g. Feeling overwhelmed but breathing exercises helped."
                                value={moodNote}
                                onChange={(e) => setMoodNote(e.target.value)}
                            />
                        </div>

                        <div className="form-field-group">
                            <label className="form-label">Name one thing you are grateful for today:</label>
                            <input 
                                type="text" 
                                className="input-text-field" 
                                placeholder="e.g. A supportive partner, sunny weather, finishing my homework..."
                                value={gratitude}
                                onChange={(e) => setGratitude(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                            <span style={{ color: 'var(--color-success)', fontSize: '12px', fontWeight: 600 }}>
                                {toastMessage}
                            </span>
                            <button className="action-button-btn" onClick={handleLogMood} disabled={!gratitude.trim()}>
                                Commit Log
                            </button>
                        </div>
                    </div>

                    {/* Mood Trend Analysis (SVG Chart) */}
                    <div className="workspace-card">
                        <div className="card-title-bar">
                            <h3>Mood Trajectory Analysis</h3>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            {renderMoodChart()}
                        </div>
                    </div>

                    {/* Gratitude & Reflections History */}
                    <div className="workspace-card">
                        <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Gratitude Journal Logs</h3>
                            <input 
                                type="text" 
                                className="input-text-field"
                                style={{ margin: 0, padding: '4px 8px', fontSize: '11px', width: '150px' }}
                                placeholder="Search journal..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="gratitude-list-scroll">
                            {filteredLogs.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>
                                    No reflections found.
                                </div>
                            ) : (
                                filteredLogs.map((log) => (
                                    <div key={log.id} className="gratitude-item">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                            <span>Mood Score: {log.moodScore}/10</span>
                                            <span>{new Date(log.date).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                                            "{log.gratitude}"
                                        </div>
                                        {log.moodNote && log.moodNote !== "Self-logged checklist entry." && (
                                            <div style={{ fontSize: '11px', color: 'var(--text-normal)', marginTop: '4px' }}>
                                                Note: {log.moodNote}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Crisis Alert Sidebar */}
            <div className="hipaa-alert-box warning" style={{ marginTop: '24px' }}>
                <i className="fa-solid fa-life-ring" style={{ color: 'var(--color-warning)' }}></i>
                <div className="alert-message-content">
                    <strong>24/7 Crisis Support & Clinical Grounding:</strong> If you are experiencing thoughts of self-harm, suicide, or extreme psychological distress, please connect with Dr. Brewster immediately or dial/text the National Crisis Support Lifeline at <strong>988</strong>. Safe resources are always available.
                </div>
            </div>
        </div>
    );
}
