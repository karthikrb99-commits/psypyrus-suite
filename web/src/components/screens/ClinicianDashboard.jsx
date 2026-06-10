import React, { useState, useEffect } from 'react';
import { Database } from '../../services/db';

export function ClinicianDashboard({
    patients,
    appointments,
    onNavigateToScreen,
    onSetActivePatientId,
    onOpenApptModal
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPatients, setFilteredPatients] = useState(patients);
    
    // Quick add patient state
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newAge, setNewAge] = useState('');
    const [newGender, setNewGender] = useState('Male');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newSpecialty, setNewSpecialty] = useState('');
    const [newRisk, setNewRisk] = useState('None');

    // Calendar & Notes Search state
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [notesSearchQuery, setNotesSearchQuery] = useState('');
    const [allNotes, setAllNotes] = useState([]);

    // Update patient list and notes
    useEffect(() => {
        setFilteredPatients(Database.searchPatients(searchQuery));
        setAllNotes(Database.searchClinicalNotes(notesSearchQuery));
    }, [searchQuery, notesSearchQuery, patients]);

    // Risk alerts
    const severePatients = patients.filter(p => p.riskStatus === "Severe" || p.riskStatus === "Moderate");

    // Metrics
    const completedAppts = appointments.filter(a => a.status === "Completed");
    const scheduledAppts = appointments.filter(a => a.status === "Scheduled");
    const totalRev = completedAppts.reduce((sum, a) => sum + a.fee, 0) + 
                     scheduledAppts.reduce((sum, a) => sum + a.fee, 0) * 0.7;

    const handleStartAppt = (appt) => {
        onSetActivePatientId(appt.patientId);
        Database.updateAppointmentStatus(appt.id, "Completed");
        if (appt.isVideo) {
            onNavigateToScreen("Teletherapy");
        } else {
            onNavigateToScreen("AI Copilot");
        }
    };

    const handleCancelAppt = (apptId) => {
        if (window.confirm("Cancel this scheduled session?")) {
            Database.deleteAppointment(apptId);
        }
    };

    const handleOpenPatientEhr = (patId) => {
        onSetActivePatientId(patId);
        onNavigateToScreen("Patient Detail");
    };

    const handleAddPatientSubmit = (e) => {
        e.preventDefault();
        if (!newName || !newAge || !newEmail || !newSpecialty) {
            alert("Please complete name, age, email, and specialty focus.");
            return;
        }

        const newId = Database.insertPatient({
            name: newName,
            age: Number(newAge),
            gender: newGender,
            email: newEmail,
            phone: newPhone || 'None',
            riskStatus: newRisk,
            specialty: newSpecialty
        });

        if (newId) {
            // Reset form
            setNewName('');
            setNewAge('');
            setNewEmail('');
            setNewPhone('');
            setNewSpecialty('');
            setNewRisk('None');
            setShowAddForm(false);
            alert("New patient EHR profile initialized successfully.");
            // Trigger parent states updates
            window.location.reload(); // Simple reload to refresh all context/props cleanly
        }
    };

    // Revenue SVG Bar Chart Data
    const revenueData = [
        { month: 'Jan', revenue: 1400 },
        { month: 'Feb', revenue: 2100 },
        { month: 'Mar', revenue: 1800 },
        { month: 'Apr', revenue: 2600 },
        { month: 'May', revenue: 3100 },
        { month: 'Jun', revenue: Math.round(totalRev) || 2400 }
    ];

    const maxRev = Math.max(...revenueData.map(d => d.revenue));

    // Calendar Grid Mapping (9:00 AM - 5:00 PM for the week)
    const timeSlots = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "04:30 PM"];
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

    const getApptForSlot = (day, slot) => {
        // Mock matching string mapping: "Today, 10:00 AM", "Tomorrow, 11:30 AM", etc.
        // Let's match based on scheduled appts indexes for illustrative high-fidelity mapping
        return scheduledAppts.find(a => {
            const timeLower = a.dateTime.toLowerCase();
            const slotHour = slot.split(":")[0];
            const isMatchTime = timeLower.includes(slotHour);
            
            if (day === "Wed" && timeLower.includes("today") && isMatchTime) return true;
            if (day === "Thu" && timeLower.includes("tomorrow") && isMatchTime) return true;
            if (day === "Fri" && timeLower.includes("10 jun") && isMatchTime) return true;
            return false;
        });
    };

    return (
        <div className="screen-container active" id="screen-clinician-dashboard">
            <style>{`
                .clinician-dashboard-layout {
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr;
                    gap: 24px;
                    margin-top: 16px;
                }
                @media (max-width: 992px) {
                    .clinician-dashboard-layout {
                        grid-template-columns: 1fr;
                    }
                }
                .quick-actions-panel {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .dashboard-quick-btn {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    padding: 12px;
                    color: var(--text-light);
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                .dashboard-quick-btn:hover {
                    background: var(--color-primary-glow);
                    border-color: var(--color-primary);
                    transform: translateY(-2px);
                }
                .dashboard-quick-btn i {
                    font-size: 18px;
                    color: var(--color-primary);
                }
                .revenue-chart-container {
                    background: rgba(0,0,0,0.15);
                    border: 1px solid rgba(255,255,255,0.03);
                    border-radius: 8px;
                    padding: 16px;
                }
                .calendar-grid-wrapper {
                    display: grid;
                    grid-template-columns: 60px repeat(5, 1fr);
                    gap: 4px;
                    background: rgba(255,255,255,0.01);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    padding: 8px;
                    overflow-x: auto;
                }
                .calendar-header-cell {
                    text-align: center;
                    font-size: 11px;
                    font-weight: bold;
                    color: var(--text-muted);
                    padding: 6px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .calendar-time-cell {
                    font-size: 9px;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    padding-right: 8px;
                    border-right: 1px solid rgba(255,255,255,0.05);
                }
                .calendar-slot-cell {
                    min-height: 48px;
                    background: rgba(255,255,255,0.01);
                    border: 1px dashed rgba(255,255,255,0.03);
                    border-radius: 4px;
                    padding: 4px;
                    font-size: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .calendar-appt-block {
                    background: var(--color-primary-glow);
                    border: 1px solid var(--color-primary);
                    color: var(--text-light);
                    border-radius: 4px;
                    padding: 4px;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .risk-status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    display: inline-block;
                }
                .risk-status-dot.Severe { background-color: var(--color-error); box-shadow: 0 0 8px var(--color-error); }
                .risk-status-dot.Moderate { background-color: var(--color-warning); }
                .risk-status-dot.Low { background-color: #f5a623; }
                .risk-status-dot.None { background-color: var(--color-success); }

                .patient-roster-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255,255,255,0.01);
                    border: 1px solid rgba(255,255,255,0.04);
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 8px;
                    transition: border-color 0.2s ease;
                }
                .patient-roster-card:hover {
                    border-color: rgba(0, 242, 254, 0.15);
                    background: rgba(0, 242, 254, 0.01);
                }
            `}</style>

            <div className="dashboard-hero-banner">
                <div className="hero-subtitle">Clinical Suite Dashboard</div>
                <h2 className="hero-title" id="clinician-welcome-name">Dr. Katherine Brewster</h2>
                <p className="hero-description">Secure HIPAA-compliant environment. Encrypted local EHR charts workspace.</p>
            </div>

            {/* Urgent Alerts Widget */}
            {severePatients.length > 0 && (
                <div className="hipaa-alert-box danger" id="risk-alerts-container" style={{ marginBottom: '20px' }}>
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <div className="alert-message-content" style={{ width: '100%' }}>
                        <div className="alert-message-title">URGENT RISK ALERTS ({severePatients.length})</div>
                        <div id="risk-alert-patients-list">
                            {severePatients.map((pat) => (
                                <div key={pat.id} className="alert-message-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                                    <div>
                                        <span className={`risk-status-dot ${pat.riskStatus}`} style={{ marginRight: '8px' }}></span>
                                        <strong>{pat.name}</strong> - Flagged Risk: <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>{pat.riskStatus}</span> | {pat.specialty}
                                    </div>
                                    <button 
                                        className="action-button-btn secondary mini-action-btn review-ai-btn"
                                        onClick={() => handleOpenPatientEhr(pat.id)}
                                    >
                                        EHR Profile
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions Panel */}
            <div className="quick-actions-panel">
                <div className="dashboard-quick-btn" onClick={() => setShowAddForm(!showAddForm)}>
                    <i className="fa-solid fa-user-plus"></i>
                    <span style={{ fontSize: '11px' }}>Add Patient</span>
                </div>
                <div className="dashboard-quick-btn" onClick={onOpenApptModal}>
                    <i className="fa-solid fa-calendar-plus"></i>
                    <span style={{ fontSize: '11px' }}>Schedule Session</span>
                </div>
                <div className="dashboard-quick-btn" onClick={() => onNavigateToScreen("AI Copilot")}>
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span style={{ fontSize: '11px' }}>AI Note Builder</span>
                </div>
                <div className="dashboard-quick-btn" onClick={() => {
                    const confirm = window.confirm("Export complete HIPAA database backup as JSON file?");
                    if (confirm) {
                        const data = Database.exportDatabaseToJson();
                        const blob = new Blob([data], { type: 'application/json' });
                        const elem = document.createElement('a');
                        elem.href = URL.createObjectURL(blob);
                        elem.download = 'psypyrus_backup_ehr.json';
                        document.body.appendChild(elem);
                        elem.click();
                        document.body.removeChild(elem);
                    }
                }}>
                    <i className="fa-solid fa-file-export"></i>
                    <span style={{ fontSize: '11px' }}>Export DB</span>
                </div>
            </div>

            {/* Add Patient Collapsible Form */}
            {showAddForm && (
                <form className="workspace-card" onSubmit={handleAddPatientSubmit} style={{ marginBottom: '24px', border: '1px solid var(--color-primary)' }}>
                    <div className="card-title-bar">
                        <h3>Initialize EHR Patient Chart</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        <div className="form-field-group">
                            <label className="form-label">Full Name:</label>
                            <input className="input-text-field" placeholder="Liam Carter" value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </div>
                        <div className="form-field-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <label className="form-label">Age:</label>
                                <input type="number" className="input-text-field" placeholder="29" value={newAge} onChange={(e) => setNewAge(e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">Gender:</label>
                                <select className="input-text-field" value={newGender} onChange={(e) => setNewGender(e.target.value)}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-field-group">
                            <label className="form-label">Email Address:</label>
                            <input className="input-text-field" placeholder="liam.c@health.me" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                        </div>
                        <div className="form-field-group">
                            <label className="form-label">Phone Contact:</label>
                            <input className="input-text-field" placeholder="555-0192" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                        </div>
                        <div className="form-field-group">
                            <label className="form-label">Diagnostic Category / Focus:</label>
                            <input className="input-text-field" placeholder="Major Depressive Disorder" value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} />
                        </div>
                        <div className="form-field-group">
                            <label className="form-label">Clinical Risk Profile:</label>
                            <select className="input-text-field" value={newRisk} onChange={(e) => setNewRisk(e.target.value)}>
                                <option value="None">None (Stable)</option>
                                <option value="Low">Low</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Severe">Severe</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <button type="button" className="action-button-btn secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                        <button type="submit" className="action-button-btn">Initialize File</button>
                    </div>
                </form>
            )}

            {/* Layout Grid */}
            <div className="clinician-dashboard-layout">
                
                {/* Left Side: Appointments Calendar / List & Revenue Analytics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Appointments Card */}
                    <div className="workspace-card">
                        <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Today's Practice Appointments</h3>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button className={`patient-filter-chip ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
                                <button className={`patient-filter-chip ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>Week Calendar</button>
                            </div>
                        </div>

                        {viewMode === 'list' ? (
                            <div className="appointment-list-stack" id="scheduled-appointments-list" style={{ marginTop: '12px' }}>
                                {scheduledAppts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                        No further appointments scheduled.
                                    </div>
                                ) : (
                                    scheduledAppts.map((appt) => (
                                        <div key={appt.id} className="appointment-item-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div className="appointment-info-core">
                                                <div className="appt-patient-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className="appt-patient-name" style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>{appt.patientName}</span>
                                                    {appt.isVideo && <span className="badge-text-tag video" style={{ fontSize: '9px', background: 'var(--color-primary-glow)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: '4px', padding: '1px 6px' }}>Video</span>}
                                                </div>
                                                <div className="appt-time-details" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Time: {appt.dateTime} | Fee Case: ${appt.fee}</div>
                                                <div className="appt-notes-agenda" style={{ fontSize: '12px', color: 'var(--text-normal)', marginTop: '6px' }}>{appt.notes}</div>
                                            </div>
                                            <div className="appointment-actions-block" style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                                                <button className="action-button-btn mini-action-btn appt-start-btn" onClick={() => handleStartAppt(appt)}>Start</button>
                                                <button className="action-button-btn secondary mini-action-btn appt-cancel-btn" style={{ color: 'var(--color-error)' }} onClick={() => handleCancelAppt(appt.id)}>Cancel</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="calendar-grid-wrapper" style={{ marginTop: '12px' }}>
                                {/* Days Header */}
                                <div></div>
                                {weekDays.map(d => (
                                    <div key={d} className="calendar-header-cell">{d}</div>
                                ))}

                                {/* Slots Grid */}
                                {timeSlots.map(slot => (
                                    <React.Fragment key={slot}>
                                        <div className="calendar-time-cell">{slot}</div>
                                        {weekDays.map(day => {
                                            const appt = getApptForSlot(day, slot);
                                            return (
                                                <div key={day} className="calendar-slot-cell">
                                                    {appt ? (
                                                        <div className="calendar-appt-block" onClick={() => handleOpenPatientEhr(appt.patientId)}>
                                                            <div style={{ fontWeight: 'bold' }}>{appt.patientName}</div>
                                                            <div style={{ fontSize: '8px', opacity: 0.8 }}>{appt.isVideo ? 'Video' : 'Clinic'}</div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Revenue Analytics SVG Chart */}
                    <div className="workspace-card">
                        <div className="card-title-bar">
                            <h3>Practice Snapshot Revenue Trends</h3>
                        </div>
                        <div className="revenue-chart-container" style={{ marginTop: '12px' }}>
                            <svg viewBox="0 0 450 140" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                                {/* Horizontal grid lines */}
                                {[0, 1000, 2000, 3000].map(level => {
                                    const y = 110 - (level * 90 / 3500);
                                    return (
                                        <g key={level}>
                                            <line x1="25" y1={y} x2="430" y2={y} stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                                            <text x="20" y={y + 3} fill="var(--text-muted)" fontSize="8" textAnchor="end">${level}</text>
                                        </g>
                                    );
                                })}

                                {/* Bars */}
                                {revenueData.map((d, idx) => {
                                    const barWidth = 28;
                                    const x = 50 + (idx * 65);
                                    const barHeight = d.revenue * 90 / 3500;
                                    const y = 110 - barHeight;
                                    return (
                                        <g key={d.month}>
                                            {/* Glow filter under bars */}
                                            <rect 
                                                x={x} 
                                                y={y} 
                                                width={barWidth} 
                                                height={barHeight} 
                                                fill="var(--color-primary)" 
                                                opacity="0.85" 
                                                rx="3" 
                                            />
                                            <text x={x + barWidth/2} y={y - 6} fill="var(--text-light)" fontSize="8" fontWeight="bold" textAnchor="middle">${d.revenue}</text>
                                            <text x={x + barWidth/2} y="125" fill="var(--text-muted)" fontSize="9" textAnchor="middle">{d.month}</text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Right Side: Roster, Search & Insights */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Patient search & roster list */}
                    <div className="workspace-card">
                        <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Patient EHR Records Roster</h3>
                            <input 
                                type="text" 
                                className="input-text-field"
                                style={{ margin: 0, padding: '4px 8px', fontSize: '11px', width: '130px' }}
                                placeholder="Search roster..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div style={{ maxHeight: '280px', overflowY: 'auto', marginTop: '12px' }}>
                            {filteredPatients.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>
                                    No patients matched.
                                </div>
                            ) : (
                                filteredPatients.map(pat => (
                                    <div key={pat.id} className="patient-roster-card" onClick={() => handleOpenPatientEhr(pat.id)} style={{ cursor: 'pointer' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={`risk-status-dot ${pat.riskStatus}`}></span>
                                                <strong style={{ color: 'var(--text-light)', fontSize: '13px' }}>{pat.name}</strong>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({pat.age}y / {pat.gender[0]})</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px' }}>{pat.specialty}</div>
                                        </div>
                                        <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Clinical Notes Search Widget */}
                    <div className="workspace-card">
                        <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Clinical Notes Catalog</h3>
                            <input 
                                type="text" 
                                className="input-text-field"
                                style={{ margin: 0, padding: '4px 8px', fontSize: '11px', width: '130px' }}
                                placeholder="Search notes..."
                                value={notesSearchQuery}
                                onChange={(e) => setNotesSearchQuery(e.target.value)}
                            />
                        </div>

                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {allNotes.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>
                                    No matching clinical notes found.
                                </div>
                            ) : (
                                allNotes.map(n => (
                                    <div key={n.id} className="patient-roster-card" onClick={() => handleOpenPatientEhr(n.patientId)} style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)' }}>{n.title}</span>
                                            <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px', color: 'var(--color-primary)' }}>{n.noteType}</span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                                            {n.bodyJson && n.bodyJson.startsWith('{') ? JSON.parse(n.bodyJson).narrative : n.bodyJson}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* AI Practice Insights Panel */}
                    <div className="workspace-card">
                        <div className="suggestion-banner-container" style={{ margin: 0, background: 'rgba(0, 242, 254, 0.03)', border: '1px solid rgba(0, 242, 254, 0.1)', padding: '14px' }}>
                            <div className="suggestion-banner-title" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                <i className="fa-solid fa-wand-magic-sparkles"></i> AI CLINICAL PRACTICE INSIGHTS
                            </div>
                            <div className="suggestion-banner-items" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '11px', color: 'var(--text-normal)', lineHeight: 1.4 }}>
                                <div>• <strong>Sarah Jenkins:</strong> GAD-7 scores improved by 43% this month. Paced breathing logs indicate excellent self-regulation compliance. Consider adjusting goals next session.</div>
                                <div>• <strong>Liam Carter:</strong> Sleep onset latency remains severe (~90m). Daily journal notes corporate stressors. AI suggests introducing CBT insomnia (CBT-I) sleep hygiene protocols.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
