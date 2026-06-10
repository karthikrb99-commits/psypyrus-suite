import React, { useState, useEffect } from 'react';
import { Database } from '../../services/db';

export function PerformanceAnalytics() {
    const [moodLogs, setMoodLogs] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [assessments, setAssessments] = useState([]);

    const refreshData = () => {
        setMoodLogs(Database.getMoodLogs());
        setAuditLogs(Database.get('psypyrus_audit_logs'));
        setPatients(Database.getPatients());
        setAppointments(Database.getAppointments());
        setAssessments(Database.getAssessments());
    };

    useEffect(() => {
        refreshData();
        window.addEventListener('psypyrus_db_change', refreshData);
        return () => window.removeEventListener('psypyrus_db_change', refreshData);
    }, []);

    // 1. Calculations for Practice Performance
    const completedSessions = appointments.filter(a => a.status === 'Completed').length;
    const totalSessions = appointments.length;
    const fillRate = totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 100;
    
    // Average session fee
    const totalRevenue = appointments.filter(a => a.status === 'Completed' || a.status === 'Scheduled').reduce((sum, a) => sum + a.fee, 0);
    const outstandingInvoices = appointments.filter(a => a.status === 'Scheduled').reduce((sum, a) => sum + a.fee, 0);

    // Patient demographics
    const totalPatients = patients.length;
    const femalePatientsCount = patients.filter(p => p.gender === 'Female').length;
    const malePatientsCount = patients.filter(p => p.gender === 'Male').length;
    const femalePercent = totalPatients ? Math.round((femalePatientsCount / totalPatients) * 100) : 50;
    const malePercent = totalPatients ? Math.round((malePatientsCount / totalPatients) * 100) : 50;

    // Age breakdown
    const youthCount = patients.filter(p => p.age < 30).length;
    const midCount = patients.filter(p => p.age >= 30 && p.age < 45).length;
    const seniorCount = patients.filter(p => p.age >= 45).length;

    // Outcome calculations (PHQ-9 & GAD-7 aggregate drop)
    const phqScores = assessments.filter(a => a.type === 'PHQ-9');
    const phqAvg = phqScores.length ? (phqScores.reduce((sum, a) => sum + a.score, 0) / phqScores.length).toFixed(1) : 12;

    const gadScores = assessments.filter(a => a.type === 'GAD-7');
    const gadAvg = gadScores.length ? (gadScores.reduce((sum, a) => sum + a.score, 0) / gadScores.length).toFixed(1) : 9;

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
        return `${timeStr} ${dateStr}`;
    };

    return (
        <div className="screen-container active" id="screen-analytics">
            <style>{`
                .analytics-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    margin-top: 16px;
                }
                @media (max-width: 992px) {
                    .analytics-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .analytics-metric-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .analytics-metric-card {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 10px;
                    padding: 16px;
                    text-align: center;
                }
                .analytics-metric-val {
                    font-size: 28px;
                    font-weight: 800;
                    color: var(--color-primary);
                    margin: 8px 0;
                }
                .stacked-progress-bar {
                    display: flex;
                    height: 14px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 12px 0;
                }
                .stacked-segment {
                    height: 100%;
                    transition: width 0.3s ease;
                }
                .demographics-legend {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .legend-color {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
            `}</style>

            <div className="section-header-block">
                <i className="fa-solid fa-chart-line"></i>
                <h2>Practice Performance & Outcome Analytics</h2>
            </div>

            {/* Top Practice Overview Row */}
            <div className="analytics-metric-row">
                <div className="analytics-metric-card">
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Completed Sessions</span>
                    <div className="analytics-metric-val">{completedSessions}</div>
                    <span style={{ fontSize: '10px', color: 'var(--text-normal)' }}>Practice fill rate: {fillRate}%</span>
                </div>
                <div className="analytics-metric-card">
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Practice Revenue</span>
                    <div className="analytics-metric-val">${totalRevenue}</div>
                    <span style={{ fontSize: '10px', color: 'var(--text-normal)' }}>Outstanding: ${outstandingInvoices}</span>
                </div>
                <div className="analytics-metric-card">
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Avg PHQ-9 Severity</span>
                    <div className="analytics-metric-val">{phqAvg}</div>
                    <span style={{ fontSize: '10px', color: 'var(--text-normal)' }}>Moderate category</span>
                </div>
                <div className="analytics-metric-card">
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Avg GAD-7 Severity</span>
                    <div className="analytics-metric-val">{gadAvg}</div>
                    <span style={{ fontSize: '10px', color: 'var(--text-normal)' }}>Mild/Moderate category</span>
                </div>
            </div>

            {/* Core Analytics Grid */}
            <div className="analytics-grid">
                
                {/* Left Side: Demographics & Clinical Outcomes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Patient Demographics */}
                    <div className="workspace-card">
                        <div className="card-title-bar">
                            <h3>EHR Roster Demographics</h3>
                        </div>
                        
                        {/* Gender Stacked Bar */}
                        <div style={{ margin: '12px 0' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)' }}>Gender Representation:</span>
                            <div className="stacked-progress-bar">
                                <div className="stacked-segment" style={{ width: `${femalePercent}%`, backgroundColor: 'var(--color-primary)' }} title={`Female ${femalePercent}%`}></div>
                                <div className="stacked-segment" style={{ width: `${malePercent}%`, backgroundColor: 'var(--color-accent)' }} title={`Male ${malePercent}%`}></div>
                            </div>
                            <div className="demographics-legend">
                                <div className="legend-item">
                                    <div className="legend-color" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                                    <span>Female ({femalePercent}%)</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color" style={{ backgroundColor: 'var(--color-accent)' }}></div>
                                    <span>Male ({malePercent}%)</span>
                                </div>
                            </div>
                        </div>

                        {/* Age Stacked Bar */}
                        <div style={{ margin: '24px 0 12px 0' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-light)' }}>Age Distribution Bracket:</span>
                            <div className="stacked-progress-bar">
                                <div className="stacked-segment" style={{ width: `${totalPatients ? (youthCount/totalPatients)*100 : 33}%`, backgroundColor: '#4facfe' }}></div>
                                <div className="stacked-segment" style={{ width: `${totalPatients ? (midCount/totalPatients)*100 : 33}%`, backgroundColor: '#00f2fe' }}></div>
                                <div className="stacked-segment" style={{ width: `${totalPatients ? (seniorCount/totalPatients)*100 : 34}%`, backgroundColor: '#f5a623' }}></div>
                            </div>
                            <div className="demographics-legend">
                                <div className="legend-item">
                                    <div className="legend-color" style={{ backgroundColor: '#4facfe' }}></div>
                                    <span>Youth &lt;30y</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color" style={{ backgroundColor: '#00f2fe' }}></div>
                                    <span>Adult 30y-45y</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color" style={{ backgroundColor: '#f5a623' }}></div>
                                    <span>Mature &gt;45y</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Outcome Trends */}
                    <div className="workspace-card">
                        <div className="card-title-bar">
                            <h3>Outcome Clinical Metrics (Pre vs Post)</h3>
                        </div>
                        <div style={{ padding: '10px 0' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Average patient GAD-7 Score trajectory decline over 45 days:
                            </span>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '30px', justifyContent: 'center', height: '100px', marginTop: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ height: '70px', width: '32px', background: 'rgba(239, 68, 68, 0.7)', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>16</div>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>Intake Avg</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ height: '39px', width: '32px', background: 'rgba(16, 185, 129, 0.7)', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>9</div>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>Active Avg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Security Audit Logs Ledger */}
                <div className="workspace-card" style={{ height: 'fit-content' }}>
                    <div className="card-title-bar">
                        <h3>Device HIPAA Security Audit Logs</h3>
                    </div>
                    <div className="audit-logs-scroll-stack" style={{ maxHeight: '380px', overflowY: 'auto', marginTop: '12px' }}>
                        {auditLogs.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'gray' }}>Empty ledger logs.</div>
                        ) : (
                            auditLogs.map((log) => (
                                <div key={log.id} className="audit-log-item">
                                    <div className="audit-header-line">
                                        <span className="audit-action-name" style={{ fontWeight: 'bold' }}>Action: {log.action}</span>
                                        <span className="audit-timestamp">{formatTimestamp(log.timestamp)}</span>
                                    </div>
                                    <div className="audit-details-text" style={{ fontSize: '11px', color: 'var(--text-normal)' }}>Details: {log.details}</div>
                                    <div className="audit-footer-labels" style={{ fontSize: '9px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                        <span>Actor: {log.actor}</span>
                                        <span>Standard: {log.encryptionStandard}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
