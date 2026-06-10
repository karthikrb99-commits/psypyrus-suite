import React, { useState, useEffect } from 'react';
import { Database } from '../../services/db';

export function PatientDetail({
    patients,
    activePatientId,
    onNavigateToScreen,
    onSetActivePatientId
}) {
    const [patient, setPatient] = useState(null);
    const [notes, setNotes] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [homework, setHomework] = useState([]);
    
    // Editor state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editAge, setEditAge] = useState(0);
    const [editGender, setEditGender] = useState('');
    const [editSpecialty, setEditSpecialty] = useState('');
    const [editRisk, setEditRisk] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');

    // Load active patient data
    useEffect(() => {
        const p = patients.find(pat => pat.id === Number(activePatientId)) || patients[0];
        if (p) {
            setPatient(p);
            setEditName(p.name);
            setEditAge(p.age);
            setEditGender(p.gender);
            setEditSpecialty(p.specialty || '');
            setEditRisk(p.riskStatus || 'None');
            setEditEmail(p.email || '');
            setEditPhone(p.phone || '');

            // Load records
            setNotes(Database.getClinicalNotes(p.id));
            setAssessments(Database.getAssessments(p.id));
            setHomework(Database.getHomework(p.id));
        }
    }, [activePatientId, patients]);

    if (!patient) {
        return (
            <div className="screen-container active">
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No patient EHR file active. Navigate to Dashboard to select.
                </div>
            </div>
        );
    }

    const handleSaveProfile = () => {
        const success = Database.updatePatient(patient.id, {
            name: editName,
            age: Number(editAge),
            gender: editGender,
            specialty: editSpecialty,
            riskStatus: editRisk,
            email: editEmail,
            phone: editPhone
        });
        if (success) {
            setIsEditing(false);
            // Alert user via alert fallback (or it will update state via callback props)
            alert("Patient profile updated successfully in EHR database.");
            // Force reload by navigating back
            onNavigateToScreen("Dashboard");
        }
    };

    const handleDeletePatient = () => {
        if (window.confirm(`Are you absolutely sure you want to delete patient ${patient.name} and ALL clinical history? This is irreversible.`)) {
            Database.deletePatient(patient.id);
            alert("Patient record deleted from database.");
            onNavigateToScreen("Dashboard");
        }
    };

    // SVG Trends Rendering
    const renderTrendChart = (type) => {
        const typeScores = assessments.filter(a => a.type === type).sort((a,b) => a.date - b.date);
        if (typeScores.length < 2) {
            return (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>
                    Need at least 2 logs of {type} to render trend trajectories.
                </div>
            );
        }

        const width = 380;
        const height = 120;
        const padL = 25;
        const padR = 15;
        const padT = 15;
        const padB = 20;

        const points = typeScores.map((s, idx) => {
            const x = padL + (idx * (width - padL - padR) / (typeScores.length - 1 || 1));
            // Scores capped: PHQ-9 (27), GAD-7 (21). Assume 27 max scale for simplicity.
            const maxVal = type === 'PHQ-9' ? 27 : 21;
            const y = height - padB - (s.score * (height - padT - padB) / maxVal);
            return { x, y, score: s.score, date: new Date(s.date).toLocaleDateString() };
        });

        const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        return (
            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px' }}>
                    {type} score Trajectory Timeline:
                </div>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible', background: 'rgba(0,0,0,0.1)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)', padding: '8px' }}>
                    {/* Grid */}
                    <line x1={padL} y1={padT} x2={width - padR} y2={padT} stroke="rgba(255,255,255,0.03)" />
                    <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="rgba(255,255,255,0.06)" />
                    
                    {/* Path */}
                    <path d={lineD} fill="none" stroke="var(--color-primary)" strokeWidth="2" />

                    {/* Points */}
                    {points.map((p, idx) => (
                        <g key={idx}>
                            <circle cx={p.x} cy={p.y} r="3.5" fill="var(--color-bg-dark)" stroke="var(--color-primary)" strokeWidth="1.5" />
                            <text x={p.x} y={p.y - 8} fill="var(--text-light)" fontSize="8" fontWeight="bold" textAnchor="middle">{p.score}</text>
                            <text x={p.x} y={height - 6} fill="var(--text-muted)" fontSize="7" textAnchor="middle">{p.date.split('/')[0] + '/' + p.date.split('/')[1]}</text>
                        </g>
                    ))}
                </svg>
            </div>
        );
    };

    return (
        <div className="screen-container active" id="screen-patient-detail">
            <style>{`
                .patient-detail-layout {
                    display: grid;
                    grid-template-columns: 0.8fr 1.2fr;
                    gap: 24px;
                    margin-top: 16px;
                }
                @media (max-width: 992px) {
                    .patient-detail-layout {
                        grid-template-columns: 1fr;
                    }
                }
                .detail-profile-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    padding-bottom: 16px;
                    margin-bottom: 16px;
                }
                .detail-profile-avatar {
                    width: 52px;
                    height: 52px;
                    border-radius: 12px;
                    background: var(--color-primary-glow);
                    border: 1px solid var(--color-primary);
                    color: var(--color-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    font-weight: 800;
                }
                .timeline-flow-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    position: relative;
                    padding-left: 20px;
                    border-left: 1px solid rgba(255,255,255,0.06);
                    margin-left: 8px;
                    margin-top: 12px;
                }
                .timeline-flow-item {
                    position: relative;
                }
                .timeline-flow-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--color-primary);
                    position: absolute;
                    left: -25px;
                    top: 4px;
                    border: 2px solid var(--color-bg-dark);
                }
                .timeline-flow-dot.note { background: var(--color-primary); }
                .timeline-flow-dot.assessment { background: var(--color-accent); }
                .timeline-flow-dot.risk { background: var(--color-error); }
                
                .timeline-flow-card {
                    background: rgba(255,255,255,0.01);
                    border: 1px solid rgba(255,255,255,0.04);
                    border-radius: 8px;
                    padding: 12px;
                }
            `}</style>

            <div className="section-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-folder-open"></i>
                    <h2>Patient Electronic Health Record (EHR) file</h2>
                </div>
                <button className="action-button-btn secondary-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => onNavigateToScreen("Dashboard")}>
                    <i className="fa-solid fa-chevron-left" style={{ marginRight: '6px' }}></i> Back to Dashboard
                </button>
            </div>

            <div className="patient-detail-layout">
                {/* Left side: Profile Summary & Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Patient Profile Card */}
                    <div className="workspace-card">
                        <div className="detail-profile-header">
                            <div className="detail-profile-avatar">
                                {patient.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: 'var(--text-light)', fontSize: '16px' }}>{patient.name}</h3>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered: {new Date(patient.registrationDate).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {!isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                                    <div><strong>Age:</strong> {patient.age}</div>
                                    <div><strong>Gender:</strong> {patient.gender}</div>
                                    <div style={{ gridColumn: 'span 2' }}><strong>Email:</strong> {patient.email}</div>
                                    <div style={{ gridColumn: 'span 2' }}><strong>Phone:</strong> {patient.phone || 'None'}</div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <strong>Diagnostic Focus:</strong> 
                                        <div style={{ color: 'var(--color-primary)', marginTop: '2px' }}>{patient.specialty}</div>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <strong>Clinical Risk Status:</strong>
                                        <span className={`badge-text-tag ${patient.riskStatus === 'Severe' ? 'danger' : 'safe'}`} style={{ marginLeft: '8px', fontSize: '10px' }}>
                                            {patient.riskStatus}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                    <button className="action-button-btn" style={{ flex: 1 }} onClick={() => setIsEditing(true)}>
                                        <i className="fa-solid fa-user-pen"></i> Edit Profile
                                    </button>
                                    <button className="action-button-btn secondary-btn" style={{ border: '1px solid rgba(255,75,75,0.2)', color: 'var(--color-error)' }} onClick={handleDeletePatient}>
                                        <i className="fa-solid fa-trash-can"></i> Delete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div className="form-field-group">
                                    <label className="form-label">Full Name:</label>
                                    <input className="input-text-field" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div className="form-field-group">
                                        <label className="form-label">Age:</label>
                                        <input type="number" className="input-text-field" value={editAge} onChange={(e) => setEditAge(Number(e.target.value))} />
                                    </div>
                                    <div className="form-field-group">
                                        <label className="form-label">Gender:</label>
                                        <input className="input-text-field" value={editGender} onChange={(e) => setEditGender(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Email Address:</label>
                                    <input className="input-text-field" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Phone Contact:</label>
                                    <input className="input-text-field" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Diagnostic Category Focus:</label>
                                    <input className="input-text-field" value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">EHR Clinical Risk Profile:</label>
                                    <select className="input-text-field" value={editRisk} onChange={(e) => setEditRisk(e.target.value)}>
                                        <option value="None">None (Stable)</option>
                                        <option value="Low">Low</option>
                                        <option value="Moderate">Moderate</option>
                                        <option value="Severe">Severe</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    <button className="action-button-btn secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                                    <button className="action-button-btn" onClick={handleSaveProfile}>Save Profile</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Assessments score trend cards */}
                    <div className="workspace-card">
                        <div className="card-title-bar">
                            <h3>Assessment Trends</h3>
                        </div>
                        {assessments.length === 0 ? (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0', textAlign: 'center' }}>
                                No score history logged.
                            </div>
                        ) : (
                            <>
                                {renderTrendChart('PHQ-9')}
                                {renderTrendChart('GAD-7')}
                            </>
                        )}
                    </div>
                </div>

                {/* Right side: Event Timeline & Records */}
                <div className="workspace-card">
                    <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Chronological clinical Timeline</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="patient-filter-chip active" onClick={() => {
                                onSetActivePatientId(patient.id);
                                onNavigateToScreen("AI Copilot");
                            }}>+ AI Note</button>
                            <button className="patient-filter-chip active" onClick={() => {
                                onSetActivePatientId(patient.id);
                                onNavigateToScreen("Digital MSE");
                            }}>+ MSE Record</button>
                        </div>
                    </div>

                    <div className="timeline-flow-list">
                        
                        {/* Notes, Assessments, Homework events merged chronologically */}
                        {[
                            ...notes.map(n => ({ type: 'note', date: n.timestamp, title: n.title, desc: n.bodyJson, details: n.noteType, isRisk: n.isRiskAlert }), {}),
                            ...assessments.map(s => ({ type: 'score', date: s.date, title: `${s.type} assessment logged`, desc: `Calculated Score Value: ${s.score} (${s.details})`, details: s.type })),
                            ...homework.map(h => ({ type: 'homework', date: h.assignedDate, title: `Clinical homework task assigned`, desc: h.description, details: h.isCompleted ? 'Completed' : 'Pending' }))
                        ].sort((a,b) => b.date - a.date).map((event, idx) => {
                            const dateStr = new Date(event.date).toLocaleString();
                            let parsedDesc = event.desc;
                            try {
                                if (event.desc && event.desc.startsWith('{')) {
                                    const parsed = JSON.parse(event.desc);
                                    parsedDesc = parsed.narrative || event.desc;
                                }
                            } catch (e) {
                                // Keep raw desc
                            }

                            return (
                                <div key={idx} className="timeline-flow-item">
                                    <div className={`timeline-flow-dot ${event.isRisk ? 'risk' : (event.type === 'score' ? 'assessment' : 'note')}`}></div>
                                    <div className="timeline-flow-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)' }}>{event.title}</span>
                                            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--color-primary)' }}>
                                                {event.details}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-normal)', margin: '0 0 6px 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                            {parsedDesc}
                                        </p>
                                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{dateStr}</div>
                                    </div>
                                </div>
                            );
                        })}

                        {notes.length === 0 && assessments.length === 0 && homework.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                                Clinical timeline empty. Record diagnostic, notes, or assignment files.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
