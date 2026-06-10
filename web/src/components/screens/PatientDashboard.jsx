import React, { useState, useEffect } from 'react';
import { Database } from '../../services/db';

export function PatientDashboard({
    appointments,
    activePatientId,
    onNavigateToScreen
}) {
    const [streak, setStreak] = useState(0);
    const [countdown, setCountdown] = useState('');
    const [therapistMsg, setTherapistMsg] = useState('Please practice your deep breathing exercises before our session today.');

    // Filter scheduled appointments for the logged-in patient
    const patientAppts = appointments.filter(a => a.patientId === Number(activePatientId) && a.status === "Scheduled");
    
    // Filter homework tasks for the logged-in patient
    const tasks = Database.getHomework(activePatientId);
    const completedTasksCount = tasks.filter(t => t.isCompleted).length;
    const totalTasksCount = tasks.length;
    const hwPercentage = totalTasksCount ? Math.round((completedTasksCount / totalTasksCount) * 100) : 100;

    // Load mood logs to compute streak
    useEffect(() => {
        const logs = Database.getMoodLogs().filter(l => l.patientId === Number(activePatientId));
        if (logs.length > 0) {
            let s = 0;
            const uniqueDays = Array.from(new Set(logs.map(l => new Date(l.date).toDateString()))).map(d => new Date(d));
            uniqueDays.sort((a,b) => b - a);

            const today = new Date();
            today.setHours(0,0,0,0);
            const checkDate = new Date(uniqueDays[0]);
            checkDate.setHours(0,0,0,0);

            if ((today - checkDate) / (1000*60*60*24) <= 1) {
                s = 1;
                for (let i = 0; i < uniqueDays.length - 1; i++) {
                    const diff = (uniqueDays[i] - uniqueDays[i+1]) / (1000*60*60*24);
                    if (diff <= 1.1) {
                        s++;
                    } else {
                        break;
                    }
                }
            }
            setStreak(s);
        }
    }, [activePatientId]);

    // Compute appointment countdown timer
    useEffect(() => {
        if (patientAppts.length === 0) {
            setCountdown('');
            return;
        }

        const parseApptTime = (dateTimeStr) => {
            const now = new Date();
            let apptDate = new Date();

            if (dateTimeStr.startsWith("Today")) {
                const timePart = dateTimeStr.replace("Today, ", "").trim();
                const [time, modifier] = timePart.split(" ");
                let [hours, minutes] = time.split(":").map(Number);
                if (modifier === "PM" && hours < 12) hours += 12;
                if (modifier === "AM" && hours === 12) hours = 0;
                apptDate.setHours(hours, minutes, 0, 0);
            } else if (dateTimeStr.startsWith("Tomorrow")) {
                apptDate.setDate(now.getDate() + 1);
                const timePart = dateTimeStr.replace("Tomorrow, ", "").trim();
                const [time, modifier] = timePart.split(" ");
                let [hours, minutes] = time.split(":").map(Number);
                if (modifier === "PM" && hours < 12) hours += 12;
                if (modifier === "AM" && hours === 12) hours = 0;
                apptDate.setHours(hours, minutes, 0, 0);
            } else {
                // Parse date like "10 Jun, 03:00 PM"
                const parts = dateTimeStr.split(", ");
                if (parts.length === 2) {
                    const [day, month] = parts[0].split(" ");
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const monthIdx = months.indexOf(month);
                    if (monthIdx !== -1) {
                        apptDate.setMonth(monthIdx);
                        apptDate.setDate(Number(day));
                    }
                    const [time, modifier] = parts[1].split(" ");
                    let [hours, minutes] = time.split(":").map(Number);
                    if (modifier === "PM" && hours < 12) hours += 12;
                    if (modifier === "AM" && hours === 12) hours = 0;
                    apptDate.setHours(hours, minutes, 0, 0);
                }
            }
            return apptDate;
        };

        const updateTimer = () => {
            const now = new Date();
            const apptDate = parseApptTime(patientAppts[0].dateTime);
            const diffMs = apptDate - now;

            if (diffMs < 0) {
                // If it is within 50 minutes, it's ongoing
                if (diffMs > -3000000) {
                    setCountdown("Session in progress");
                } else {
                    setCountdown("Scheduled session");
                }
            } else {
                const diffMins = Math.floor(diffMs / 60000);
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                
                if (hours > 24) {
                    setCountdown(`Starts in ${Math.round(hours / 24)} days`);
                } else if (hours > 0) {
                    setCountdown(`Starts in ${hours}h ${mins}m`);
                } else {
                    setCountdown(`Starts in ${mins}m`);
                }
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 60000); // update every minute
        return () => clearInterval(timer);
    }, [appointments, activePatientId]);

    const handleToggleHomework = (id) => {
        Database.toggleHomework(id);
    };

    const handleBrowseProviders = () => {
        alert("Care Dispatcher Service: Please contact the clinic office for therapist matches.");
    };

    const handleLaunchCall = () => {
        onNavigateToScreen("Teletherapy");
    };

    // Homework SVG Progress Ring Config
    const radius = 24;
    const strokeWidth = 5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (hwPercentage / 100) * circumference;

    return (
        <div className="screen-container active" id="screen-patient-dashboard">
            <style>{`
                .patient-dashboard-widgets {
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr;
                    gap: 24px;
                    margin-top: 16px;
                }
                @media (max-width: 992px) {
                    .patient-dashboard-widgets {
                        grid-template-columns: 1fr;
                    }
                }
                .dashboard-quick-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .quick-action-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .quick-action-card:hover {
                    background: rgba(0, 242, 254, 0.04);
                    border-color: rgba(0, 242, 254, 0.2);
                    transform: translateY(-2px);
                }
                .quick-action-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 10px;
                    background: rgba(0, 242, 254, 0.08);
                    color: var(--color-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                }
                .quick-action-card:last-child .quick-action-icon {
                    background: rgba(245, 166, 35, 0.08);
                    color: var(--color-warning);
                }
                .progress-ring-container {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .therapist-message-widget {
                    background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 24px;
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                }
                .therapist-avatar {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: var(--color-primary-glow);
                    border: 1px solid var(--color-primary);
                    color: var(--color-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 13px;
                }
            `}</style>

            <div className="dashboard-hero-banner">
                <div className="hero-subtitle">Wellness Patient Portal</div>
                <h2 className="hero-title">Welcome back, {activePatientId === 1 ? 'Liam' : 'Sarah'}</h2>
                <p className="hero-description">Your care environment is encrypted. Continue daily mindfulness breathing and log tasks.</p>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="dashboard-quick-actions">
                <div className="quick-action-card" onClick={() => onNavigateToScreen("Wellness")}>
                    <div className="quick-action-icon">
                        <i className="fa-solid fa-wind"></i>
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>Breathing Pacer</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Box, 4-7-8 somatic exercises</span>
                    </div>
                </div>

                <div className="quick-action-card" onClick={() => onNavigateToScreen("Wellness")}>
                    <div className="quick-action-icon">
                        <i className="fa-solid fa-heart"></i>
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>Log Mood Checkpoint</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Streak: {streak} days</span>
                    </div>
                </div>
            </div>

            {/* Therapist Message Banner */}
            <div className="therapist-message-widget">
                <div className="therapist-avatar">KB</div>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)' }}>Dr. Katherine Brewster</span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Therapist note</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-normal)', lineHeight: 1.4 }}>
                        "{therapistMsg}"
                    </p>
                </div>
            </div>

            <div className="patient-dashboard-widgets">
                
                {/* Left Side: Appointments and Care details */}
                <div className="workspace-card" style={{ height: 'fit-content' }}>
                    <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Care Coordination Coordinates</h3>
                        {countdown && (
                            <span style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'var(--color-primary-glow)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--color-primary)' }}>
                                {countdown}
                            </span>
                        )}
                    </div>
                    <div id="patient-care-coordination-container">
                        {patientAppts.length > 0 ? (
                            <div style={{ padding: '6px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <strong style={{ color: 'var(--text-light)', fontSize: '13px' }}>
                                        Telehealth: Dr. Katherine Brewster
                                    </strong>
                                    <span className="badge-text-tag video" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg-dark)', fontWeight: 'bold', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>
                                        SECURE CHAMBER
                                    </span>
                                </div>
                                <div className="appt-time-details" style={{ fontSize: '12px', color: 'var(--text-normal)' }}>
                                    Date/Time: {patientAppts[0].dateTime}
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 16px 0', lineHeight: 1.4 }}>
                                    Session Focus: {patientAppts[0].notes}
                                </p>
                                <button className="action-button-btn launch-patient-call-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleLaunchCall}>
                                    <i className="fa-solid fa-video"></i> Join Encrypted Video Chamber
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                                <p style={{ fontSize: '13px', marginBottom: '12px' }}>No upcoming session appointments coordinates found.</p>
                                <button className="action-button-btn secondary" id="patient-browse-providers-btn" onClick={handleBrowseProviders}>
                                    Browse Directory Providers
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Homework Circular Progress */}
                <div className="workspace-card" style={{ height: 'fit-content' }}>
                    <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Clinical Assignments</h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {completedTasksCount} / {totalTasksCount} completed
                        </span>
                    </div>

                    {/* Progress Circle Visualizer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '12px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                            <circle 
                                cx="30" 
                                cy="30" 
                                r={radius} 
                                fill="transparent" 
                                stroke="rgba(255,255,255,0.05)" 
                                strokeWidth={strokeWidth} 
                            />
                            <circle 
                                cx="30" 
                                cy="30" 
                                r={radius} 
                                fill="transparent" 
                                stroke="var(--color-primary)" 
                                strokeWidth={strokeWidth} 
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                            />
                        </svg>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)' }}>
                                Homework Completion: {hwPercentage}%
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Assigned by Dr. Katherine Brewster
                            </span>
                        </div>
                    </div>

                    {/* Tasks List */}
                    <div className="homework-list-container" id="patient-homework-list">
                        {tasks.length === 0 ? (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                                No pending homework coordinates assigned. Focus on mindfulness pacing.
                            </p>
                        ) : (
                            tasks.map((task) => (
                                <div key={task.id} className="homework-list-item" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px', marginBottom: '8px' }}>
                                    <label className={`homework-item-label ${task.isCompleted ? 'completed' : ''}`} style={{ display: 'flex', gap: '8px', cursor: 'pointer', alignItems: 'flex-start', fontSize: '12px' }}>
                                        <input 
                                            type="checkbox" 
                                            className="checkbox-control homework-toggle-chk"
                                            checked={task.isCompleted}
                                            onChange={() => handleToggleHomework(task.id)}
                                            style={{ accentColor: 'var(--color-primary)', marginTop: '2px' }}
                                        />
                                        <span style={{ color: task.isCompleted ? 'var(--text-muted)' : 'var(--text-normal)', textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                                            {task.description}
                                        </span>
                                    </label>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
