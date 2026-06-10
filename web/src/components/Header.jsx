import React, { useState } from 'react';

export function Header({
    activeRole,
    activeScreen,
    theme,
    onRoleChange,
    onThemeToggle,
    onSettingsOpen,
    onLock,
    onShowLanding,
    onCommandPaletteOpen
}) {
    const [notifications, setNotifications] = useState([
        { id: 1, text: "Clinical risk detected for Sophia Martinez" },
        { id: 2, text: "Database backups sync completed" }
    ]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    const handleClearNotifications = (e) => {
        e.stopPropagation();
        setNotifications([]);
    };

    return (
        <header className="header-toolbar">
            {/* Breadcrumb Trail */}
            <div className="toolbar-breadcrumbs">
                <i className="fa-solid fa-hand-holding-medical breadcrumb-icon"></i>
                <span className="breadcrumb-parent">{activeRole}</span>
                <i className="fa-solid fa-chevron-right breadcrumb-separator"></i>
                <span className="breadcrumb-current">{activeScreen}</span>
            </div>

            {/* Center: Command Search Bar Trigger */}
            <div className="toolbar-search-trigger" onClick={onCommandPaletteOpen} title="Open Command Palette (Ctrl+K)">
                <i className="fa-solid fa-magnifying-glass search-trigger-icon"></i>
                <span className="search-trigger-placeholder">Search screens, patients (Ctrl+K)...</span>
                <kbd className="search-trigger-kbd">⌘K</kbd>
            </div>

            <div className="toolbar-actions-group">
                {/* Status indicator dot */}
                <div className="network-status-node" title="System Status: Connected (AES-GCM encrypted)">
                    <span className="status-indicator-dot"></span>
                    <span className="status-indicator-text">Secure</span>
                </div>

                {/* Dynamic Switcher Pill */}
                <div className="persona-switcher-pill">
                    <button 
                        className={`persona-pill-btn ${activeRole === 'Professional' ? 'active' : ''}`}
                        onClick={() => onRoleChange('Professional')}
                    >
                        <i className="fa-solid fa-user-doctor"></i> <span>Professional</span>
                    </button>
                    <button 
                        className={`persona-pill-btn ${activeRole === 'Patient' ? 'active' : ''}`}
                        onClick={() => onRoleChange('Patient')}
                    >
                        <i className="fa-solid fa-user"></i> <span>Patient</span>
                    </button>
                </div>

                {/* Notifications Bell */}
                <div className="notification-bell-wrapper">
                    <button 
                        className="toolbar-icon-btn notification-bell-btn" 
                        title="Notifications"
                        onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    >
                        <i className="fa-solid fa-bell"></i>
                        {notifications.length > 0 && (
                            <span className="notification-badge-count">{notifications.length}</span>
                        )}
                    </button>
                    {showNotifDropdown && (
                        <div className="notification-dropdown-menu">
                            <div className="notif-dropdown-header">
                                <span>Notifications</span>
                                {notifications.length > 0 && (
                                    <button onClick={handleClearNotifications} className="notif-clear-btn">Clear All</button>
                                )}
                            </div>
                            <div className="notif-dropdown-list">
                                {notifications.length === 0 ? (
                                    <div className="notif-empty-state">No new notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className="notif-dropdown-item">
                                            <i className="fa-solid fa-circle-exclamation notif-item-icon"></i>
                                            <span className="notif-item-text">{n.text}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Home/Landing Page Link */}
                <button 
                    className="toolbar-icon-btn" 
                    title="View Project Landing & Downloads"
                    onClick={onShowLanding}
                    style={{ color: 'var(--color-primary)' }}
                >
                    <i className="fa-solid fa-house"></i>
                </button>

                {/* Theme Toggle */}
                <button 
                    className="toolbar-icon-btn" 
                    id="theme-toggle-btn" 
                    title="Toggle Light/Dark Theme"
                    onClick={onThemeToggle}
                >
                    <i className={`fa-solid ${theme === 'light' ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>

                {/* Settings Gear */}
                <button 
                    className="toolbar-icon-btn" 
                    id="settings-toggle-btn" 
                    title="API Settings Configuration"
                    onClick={onSettingsOpen}
                >
                    <i className="fa-solid fa-gears"></i>
                </button>

                {/* Lock Button */}
                <button 
                    className="toolbar-icon-btn" 
                    id="lock-toggle-btn" 
                    title="Cryptographically Lock Session"
                    onClick={onLock}
                >
                    <i className="fa-solid fa-lock-open" style={{ color: 'var(--color-primary)' }}></i>
                </button>
            </div>
        </header>
    );
}

