import React, { useState, useEffect, useRef } from 'react';

export function Sidebar({
    activeRole,
    activeScreen,
    activePatientName,
    onScreenChange,
    onRoleToggle,
    onLock,
    onShowLanding
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const sidebarRef = useRef(null);

    // Nav configurations
    const clinicianNavItems = [
        { name: 'Dashboard', icon: 'fa-chart-pie' },
        { name: 'AI Copilot', icon: 'fa-wand-magic-sparkles', badge: 'New' },
        { name: 'Digital MSE', icon: 'fa-clipboard-list' },
        { name: 'Diagnostics', icon: 'fa-stethoscope', badge: 'Alert' },
        { name: 'Teletherapy', icon: 'fa-video' },
        { name: 'Planner', icon: 'fa-calendar-check' },
        { name: 'Assessments', icon: 'fa-square-poll-horizontal' },
        { name: 'Analytics', icon: 'fa-chart-line' },
        { name: 'Marketplace', icon: 'fa-shop' },
        { name: 'HIPAA Shield', icon: 'fa-user-shield' }
    ];

    const patientNavItems = [
        { name: 'Dashboard', icon: 'fa-house-medical' },
        { name: 'Wellness', icon: 'fa-spa', label: 'Wellness Lounge', badge: 'New' },
        { name: 'Assessments', icon: 'fa-file-invoice' },
        { name: 'Teletherapy', icon: 'fa-video', label: 'Telehealth' },
        { name: 'Marketplace', icon: 'fa-shop', label: 'Wellness Store' },
        { name: 'HIPAA Shield', icon: 'fa-shield-halved', label: 'Security logs' }
    ];

    const navItems = activeRole === 'Professional' ? clinicianNavItems : patientNavItems;

    // Handle keyboard navigation (Arrow keys, Space/Enter)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex((prev) => (prev + 1) % navItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex((prev) => (prev - 1 + navItems.length) % navItems.length);
            } else if (e.key === 'Enter' || e.key === ' ') {
                if (focusedIndex >= 0 && focusedIndex < navItems.length) {
                    e.preventDefault();
                    onScreenChange(navItems[focusedIndex].name);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navItems, focusedIndex]);

    // Keep focus index in sync with activeScreen
    useEffect(() => {
        const idx = navItems.findIndex(item => item.name === activeScreen);
        setFocusedIndex(idx);
    }, [activeScreen, navItems]);

    return (
        <aside 
            ref={sidebarRef}
            className={`sidebar-nav-rail ${isCollapsed ? 'collapsed' : ''}`}
            id="app-sidebar"
        >
            {/* Collapse Toggle Button */}
            <button 
                className="sidebar-collapse-toggle-btn"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                <i className={`fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
            </button>

            {/* Logo/Brand Header */}
            <div className="rail-header" onClick={onShowLanding} style={{ cursor: 'pointer' }}>
                <i className="fa-solid fa-face-smile-beam rail-logo-icon"></i>
                {!isCollapsed && (
                    <div className="brand-text-container">
                        <h2 className="rail-brand-name">PsyPyrus</h2>
                        <span className="rail-brand-sub">AI OS v2.0</span>
                    </div>
                )}
            </div>

            {/* Clinician / User Profile Info */}
            <div className="user-profile-widget">
                <div className="profile-avatar-circle" title={activeRole === 'Professional' ? 'Dr. Liam Carter' : 'Patient Liam Carter'}>
                    {activeRole === 'Professional' ? 'LC' : 'PC'}
                </div>
                {!isCollapsed && (
                    <div className="profile-details-text">
                        <span className="profile-username">
                            {activeRole === 'Professional' ? 'Dr. Liam Carter' : 'Liam Carter'}
                        </span>
                        <span className="profile-role-sub">
                            {activeRole === 'Professional' ? 'Lead Psychiatrist' : 'Patient Dashboard'}
                        </span>
                    </div>
                )}
            </div>

            {/* Navigation Menu */}
            <div className="nav-menu-wrapper">
                {!isCollapsed && (
                    <div className="nav-group-title">
                        {activeRole === 'Professional' ? 'Clinical Workspace' : 'Wellness Hub'}
                    </div>
                )}
                
                <ul className="nav-items-list">
                    {navItems.map((item, idx) => {
                        const displayName = item.label || item.name;
                        const isActive = activeScreen === item.name;
                        const isFocused = idx === focusedIndex;
                        return (
                            <li key={item.name}>
                                <div 
                                    className={`nav-item-link ${isActive ? 'active' : ''} ${isFocused ? 'focused' : ''}`}
                                    onClick={() => {
                                        onScreenChange(item.name);
                                        setFocusedIndex(idx);
                                    }}
                                    title={isCollapsed ? displayName : ''}
                                    tabIndex={0}
                                    onFocus={() => setFocusedIndex(idx)}
                                >
                                    <i className={`fa-solid ${item.icon}`}></i>
                                    {!isCollapsed && <span className="nav-item-text">{displayName}</span>}
                                    {!isCollapsed && item.badge && (
                                        <span className={`nav-item-badge badge-${item.badge.toLowerCase()}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Footer / Active EHR / Action Controls */}
            <div className="rail-footer-controls">
                {activeRole === 'Professional' && !isCollapsed && (
                    <div className="active-patient-badge">
                        <span>Active EHR Target:</span>
                        <strong id="active-patient-display">{activePatientName}</strong>
                    </div>
                )}
                <div className="rail-bottom-buttons">
                    <button 
                        className="rail-btn" 
                        title="View Project Landing & Downloads"
                        onClick={onShowLanding}
                        style={{ color: 'var(--color-primary)' }}
                    >
                        <i className="fa-solid fa-house"></i>
                    </button>
                    <button 
                        className="rail-btn rail-btn-role" 
                        id="role-toggle-sidebar" 
                        title="Switch User Role Persona"
                        onClick={onRoleToggle}
                    >
                        <i className="fa-solid fa-user-gear"></i>
                    </button>
                    <button 
                        className="rail-btn" 
                        id="lock-session-sidebar" 
                        title="Secure Session (Lock Workspace)"
                        onClick={onLock}
                    >
                        <i className="fa-solid fa-lock"></i>
                    </button>
                </div>
            </div>
        </aside>
    );
}

