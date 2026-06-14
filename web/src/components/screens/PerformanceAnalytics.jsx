import { useState, useEffect } from 'react';
import { Database } from '../../services/db';
import { Logger } from '../../services/logger';
import { Tracer } from '../../services/tracer';
import { WebSocketConn } from '../../services/websocket';
import { SSESubscriber } from '../../services/sse';

export function PerformanceAnalytics() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [assessments, setAssessments] = useState([]);

    // Observability & Systems Monitoring State
    const [obsLogs, setObsLogs] = useState([]);
    const [obsTraces, setObsTraces] = useState([]);
    const [selectedTraceId, setSelectedTraceId] = useState(null);
    const [wsStatus, setWsStatus] = useState(WebSocketConn.status);
    const [wsLatency, setWsLatency] = useState(WebSocketConn.latency);
    const [sseStatus, setSseStatus] = useState(SSESubscriber.status);
    
    const [cpuUsage, setCpuUsage] = useState(32);
    const [memUsage, setMemUsage] = useState(48.2);
    const [reqRate, setReqRate] = useState(1.2);
    const [errRate, setErrRate] = useState(0);
    const [latencyVal, setLatencyVal] = useState(42);

    const [isLoadSpike, setIsLoadSpike] = useState(false);
    const [isDbLock, setIsDbLock] = useState(false);
    const [alertThresholds, setAlertThresholds] = useState({ cpu: 80, latency: 800, errorRate: 10 });
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [slackPayload, setSlackPayload] = useState(null);
    const [logFilter, setLogFilter] = useState('');

    const refreshData = () => {
        setAuditLogs(Database.get('psypyrus_audit_logs'));
        setPatients(Database.getPatients());
        setAppointments(Database.getAppointments());
        setAssessments(Database.getAssessments());
    };

    useEffect(() => {
        setObsLogs(Logger.getLogs());
        setObsTraces(Tracer.getCompletedTraces());
        
        const handleLog = (e) => {
            setObsLogs(prev => [e.detail, ...prev].slice(0, 100));
        };
        const handleLogClear = () => {
            setObsLogs([]);
        };
        
        const handleTrace = (e) => {
            setObsTraces(prev => [e.detail, ...prev].slice(0, 30));
        };
        const handleTraceUpdate = (e) => {
            setObsTraces(prev => prev.map(t => t.traceId === e.detail.traceId ? e.detail : t));
        };
        const handleTraceClear = () => {
            setObsTraces([]);
        };
        
        const handleWsState = (e) => {
            setWsStatus(e.detail.status);
            setWsLatency(e.detail.latency);
        };
        
        const handleSseState = (e) => {
            setSseStatus(e.detail.status);
        };
        
        window.addEventListener('psypyrus_log', handleLog);
        window.addEventListener('psypyrus_log_clear', handleLogClear);
        window.addEventListener('psypyrus_trace', handleTrace);
        window.addEventListener('psypyrus_trace_update', handleTraceUpdate);
        window.addEventListener('psypyrus_trace_clear', handleTraceClear);
        window.addEventListener('psypyrus_ws_state', handleWsState);
        window.addEventListener('psypyrus_sse_state', handleSseState);
        
        return () => {
            window.removeEventListener('psypyrus_log', handleLog);
            window.removeEventListener('psypyrus_log_clear', handleLogClear);
            window.removeEventListener('psypyrus_trace', handleTrace);
            window.removeEventListener('psypyrus_trace_update', handleTraceUpdate);
            window.removeEventListener('psypyrus_trace_clear', handleTraceClear);
            window.removeEventListener('psypyrus_ws_state', handleWsState);
            window.removeEventListener('psypyrus_sse_state', handleSseState);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            let targetCpu = isLoadSpike ? (Math.floor(Math.random() * 10) + 85) : (Math.floor(Math.random() * 12) + 25);
            let targetMem = isLoadSpike ? (Math.floor(Math.random() * 5) + 120) : (Math.floor(Math.random() * 3) + 45);
            let targetRps = isLoadSpike ? (Math.floor(Math.random() * 15) + 30) : (Math.floor(Math.random() * 4) + 1.2);
            
            let targetErr = 0;
            let targetLatency = wsLatency || 25;
            
            if (isDbLock) {
                targetErr = 15;
                targetLatency = 4500;
                targetCpu += 8;
            }
            
            setCpuUsage(prev => parseFloat((prev * 0.4 + targetCpu * 0.6).toFixed(1)));
            setMemUsage(prev => parseFloat((prev * 0.4 + targetMem * 0.6).toFixed(1)));
            setReqRate(prev => parseFloat((prev * 0.4 + targetRps * 0.6).toFixed(1)));
            setErrRate(prev => parseFloat((prev * 0.4 + targetErr * 0.6).toFixed(1)));
            setLatencyVal(prev => parseFloat((prev * 0.4 + targetLatency * 0.6).toFixed(0)));
        }, 1500);
        
        return () => clearInterval(interval);
    }, [isLoadSpike, isDbLock, wsLatency]);

    useEffect(() => {
        const alerts = [];
        if (cpuUsage > alertThresholds.cpu) {
            alerts.push(`CPU_THRESHOLD_EXCEEDED (Current: ${cpuUsage}%, Limit: ${alertThresholds.cpu}%)`);
        }
        if (latencyVal > alertThresholds.latency) {
            alerts.push(`LATENCY_THRESHOLD_EXCEEDED (Current: ${latencyVal}ms, Limit: ${alertThresholds.latency}ms)`);
        }
        if (errRate > alertThresholds.errorRate) {
            alerts.push(`ERROR_RATE_THRESHOLD_EXCEEDED (Current: ${errRate}%, Limit: ${alertThresholds.errorRate}%)`);
        }
        
        setActiveAlerts(alerts);
        
        if (alerts.length > 0) {
            const payload = {
                text: `[CRITICAL ALERT] PsyPyrus Suite observed ${alerts.length} systems threshold breaches:`,
                attachments: alerts.map(a => ({
                    color: "#ef4444",
                    text: a,
                    ts: Math.floor(Date.now() / 1000)
                }))
            };
            setSlackPayload(payload);
            Logger.warn('monitoring-service', 'ALERT_TRIGGERED', `Systems alert triggered: ${alerts.join(', ')}`);
        } else {
            setSlackPayload(null);
        }
    }, [cpuUsage, latencyVal, errRate, alertThresholds]);

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

            {/* SYSTEMS OBSERVABILITY & DIAGNOSTICS DASHBOARD */}
            <div style={{ marginTop: '36px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }} id="observability-dashboard-section text-left">
                <div className="section-header-block" style={{ marginBottom: '16px' }}>
                    <i className="fa-solid fa-gauge-high" style={{ color: 'var(--color-primary)' }}></i>
                    <h2>Systems Observability & Diagnostics</h2>
                </div>
                
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '20px' }}>
                    Monitor live container resource consumption, inspect distributed trace spans of EHR database transactions, view structured JSON logs, and test health threshold alarms.
                </p>

                {/* Telemetry metrics bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div className="analytics-metric-card" style={{ textAlign: 'left', background: 'rgba(255,255,255,0.01)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CPU Load</span>
                        <div className="analytics-metric-val" style={{ color: cpuUsage > alertThresholds.cpu ? 'var(--color-error)' : 'var(--color-primary)' }}>{cpuUsage}%</div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' }}>
                            <div style={{ height: '100%', background: cpuUsage > alertThresholds.cpu ? 'var(--color-error)' : 'var(--color-primary)', width: `${Math.min(cpuUsage, 100)}%`, transition: 'width 0.3s ease' }}></div>
                        </div>
                    </div>
                    
                    <div className="analytics-metric-card" style={{ textAlign: 'left', background: 'rgba(255,255,255,0.01)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Memory Allocated</span>
                        <div className="analytics-metric-val">{memUsage} MB</div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Limit: 512 MB</span>
                    </div>

                    <div className="analytics-metric-card" style={{ textAlign: 'left', background: 'rgba(255,255,255,0.01)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Request Rate (RPS)</span>
                        <div className="analytics-metric-val" style={{ color: '#38bdf8' }}>{reqRate} rps</div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HTTP API Gateway scrapable</span>
                    </div>

                    <div className="analytics-metric-card" style={{ textAlign: 'left', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>WS Latency</span>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: wsStatus === 'CONNECTED' ? '#10b981' : (wsStatus === 'RECONNECTING' ? '#f59e0b' : '#ef4444'),
                                display: 'inline-block'
                            }} title={`WebSocket: ${wsStatus}`}></span>
                        </div>
                        <div className="analytics-metric-val" style={{ color: latencyVal > alertThresholds.latency ? 'var(--color-error)' : '#10b981' }}>
                            {wsStatus === 'CONNECTED' ? `${latencyVal} ms` : 'Offline'}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>WebSocket Status: {wsStatus}</span>
                    </div>
                </div>

                {/* Dashboard Controller Actions */}
                <div className="workspace-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                            <input 
                                type="checkbox" 
                                checked={isLoadSpike}
                                onChange={(e) => {
                                    setIsLoadSpike(e.target.checked);
                                    Logger.warn('observability-ui', 'SPIKE_SIMULATOR', `Simulated CPU load spike toggled: ${e.target.checked}`);
                                }}
                                style={{ accentColor: 'var(--color-primary)' }}
                            />
                            <span>Simulate Traffic Spike</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                            <input 
                                type="checkbox" 
                                checked={isDbLock}
                                onChange={(e) => {
                                    setIsDbLock(e.target.checked);
                                    Logger.warn('observability-ui', 'DB_LOCK_SIMULATOR', `Simulated Database Lock outage toggled: ${e.target.checked}`);
                                }}
                                style={{ accentColor: 'var(--color-primary)' }}
                            />
                            <span>Simulate DB Lock Outage</span>
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="action-button-btn secondary" style={{ fontSize: '11px', margin: 0, padding: '6px 12px' }} onClick={() => {
                            Logger.info('observability-ui', 'USER_TRIGGER', 'Practitioner generated manual structured diagnostics verification log entry.', { randomId: Math.floor(Math.random() * 1000) });
                        }}>
                            Generate Test Log
                        </button>
                        <button className="action-button-btn secondary" style={{ fontSize: '11px', margin: 0, padding: '6px 12px', color: 'var(--color-error)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => {
                            Logger.clearLogs();
                            Tracer.clearTraces();
                        }}>
                            Clear Buffers
                        </button>
                    </div>
                </div>

                {/* Health alerting details */}
                <div className="workspace-card" style={{ padding: '16px', marginBottom: '24px', background: activeAlerts.length > 0 ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', color: activeAlerts.length > 0 ? 'var(--color-error)' : '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className={activeAlerts.length > 0 ? 'fa-solid fa-triangle-exclamation fa-fade' : 'fa-solid fa-circle-check'} style={{ color: activeAlerts.length > 0 ? 'var(--color-error)' : '#10b981' }}></i>
                            Active Health Alarms {activeAlerts.length > 0 ? `(${activeAlerts.length})` : ''}
                        </h4>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Threshold Limits: CPU &gt; {alertThresholds.cpu}%, Latency &gt; {alertThresholds.latency}ms, Error Rate &gt; {alertThresholds.errorRate}%</span>
                    </div>

                    {activeAlerts.length === 0 ? (
                        <p style={{ fontSize: '11px', color: '#10b981', margin: 0 }}>All server clusters are currently operational. Monitoring metrics comply with green thresholds.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {activeAlerts.map((alert, i) => (
                                    <div key={i} style={{ fontSize: '10.5px', color: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid var(--color-error)' }}>
                                        {alert}
                                    </div>
                                ))}
                            </div>

                            <div>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Simulated Slack/Alert Webhook Payload:</span>
                                <pre style={{
                                    fontFamily: 'monospace',
                                    fontSize: '9.5px',
                                    background: '#09090b',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '6px',
                                    padding: '8px',
                                    color: '#38bdf8',
                                    overflowX: 'auto',
                                    margin: 0
                                }}>{JSON.stringify(slackPayload, null, 2)}</pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Traces and Logs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: '20px' }}>
                    
                    {/* Distributed Traces Waterfall Viewer */}
                    <div className="workspace-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '12.5px', color: '#fff' }}>
                                <i className="fa-solid fa-network-wired" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i>
                                Distributed Tracing Spans (Jaeger Mock)
                            </h4>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Latest transactions</span>
                        </div>

                        <div style={{ overflowY: 'auto', maxHeight: '360px', minHeight: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {obsTraces.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '30px' }}>
                                    No database write or read traces captured yet. Interacting with clinical logs or saving charts will populate traces.
                                </div>
                            ) : (
                                obsTraces.map((trace) => {
                                    const isExpanded = selectedTraceId === trace.traceId;
                                    return (
                                        <div 
                                            key={trace.traceId}
                                            style={{
                                                background: 'rgba(255,255,255,0.01)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: '8px',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div 
                                                onClick={() => setSelectedTraceId(isExpanded ? null : trace.traceId)}
                                                style={{
                                                    padding: '8px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                                                    fontSize: '11px'
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold', color: '#fff' }}>
                                                    {trace.name} <span style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--text-muted)', fontFamily: 'monospace' }}>({trace.traceId.substring(0, 8)})</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: trace.rootSpan?.tags?.error ? 'var(--color-error)' : '#10b981', fontWeight: 'bold' }}>{trace.durationMs}ms</span>
                                                    <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '10px', color: 'var(--text-muted)' }}></i>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.04)', background: '#09090b', fontFamily: 'monospace', fontSize: '10px' }}>
                                                    <div style={{ color: 'var(--text-muted)', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                                                        Trace Execution Waterfall:
                                                    </div>
                                                    
                                                    {/* Span waterfall rendering */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {trace.spans.map((span) => {
                                                            const isChild = !!span.parentSpanId;
                                                            return (
                                                                <div key={span.spanId} style={{ paddingLeft: isChild ? '16px' : '0px', borderLeft: isChild ? '1px dashed rgba(255,255,255,0.15)' : 'none' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: span.tags?.error ? 'var(--color-error)' : '#fff' }}>
                                                                        <span>{isChild ? '↳ ' : '■ '}{span.name}</span>
                                                                        <span>{span.durationMs}ms</span>
                                                                    </div>
                                                                    <div style={{ color: 'var(--text-muted)', fontSize: '9px', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                        <span>spanId: {span.spanId.substring(0,6)}</span>
                                                                        {Object.entries(span.tags).map(([k, v]) => (
                                                                            <span key={k}>{k}: {String(v)}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Structured Logs Console */}
                    <div className="workspace-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '12.5px', color: '#fff' }}>
                                <i className="fa-solid fa-list-ul" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i>
                                Structured JSON Logs Stream
                            </h4>
                            
                            <input 
                                type="text"
                                className="input-text-field"
                                value={logFilter}
                                onChange={(e) => setLogFilter(e.target.value)}
                                placeholder="Filter log messages..."
                                style={{ margin: 0, padding: '3px 8px', fontSize: '10.5px', width: '150px' }}
                            />
                        </div>

                        <div style={{
                            flex: 1,
                            background: '#09090b',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px',
                            padding: '12px',
                            fontFamily: 'monospace',
                            fontSize: '9.5px',
                            minHeight: '220px',
                            maxHeight: '360px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            {obsLogs.filter(log => {
                                if (!logFilter) return true;
                                const term = logFilter.toLowerCase();
                                return log.message.toLowerCase().includes(term) || log.service.toLowerCase().includes(term) || log.event.toLowerCase().includes(term);
                            }).length === 0 ? (
                                <span style={{ color: 'var(--text-muted)' }}>Console idle. Awaiting log streams.</span>
                            ) : (
                                obsLogs.filter(log => {
                                    if (!logFilter) return true;
                                    const term = logFilter.toLowerCase();
                                    return log.message.toLowerCase().includes(term) || log.service.toLowerCase().includes(term) || log.event.toLowerCase().includes(term);
                                }).map((log, i) => (
                                    <div 
                                        key={i} 
                                        style={{
                                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                                            paddingBottom: '6px',
                                            color: log.level === 'ERROR' ? 'var(--color-error)' : (log.level === 'WARN' ? 'var(--color-warning)' : '#e2e8f0'),
                                            lineHeight: 1.4
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '8.5px', marginBottom: '2px' }}>
                                            <span>{log.timestamp} | SERVICE: {log.service}</span>
                                            <span>EVENT: {log.event}</span>
                                        </div>
                                        <div>
                                            <strong style={{
                                                padding: '1px 4px',
                                                borderRadius: '3px',
                                                background: log.level === 'ERROR' ? 'rgba(239, 68, 68, 0.15)' : (log.level === 'WARN' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)'),
                                                marginRight: '6px',
                                                fontSize: '8px'
                                            }}>{log.level}</strong>
                                            {log.message}
                                        </div>
                                        {Object.keys(log.metadata).length > 0 && (
                                            <div style={{ color: '#0ea5e9', fontSize: '8.5px', marginTop: '2px' }}>
                                                metadata: {JSON.stringify(log.metadata)}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                </div>

            </div>
        </div>
    );
}
