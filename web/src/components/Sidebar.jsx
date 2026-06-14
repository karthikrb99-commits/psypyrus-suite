import { useState, useEffect, useMemo, useRef } from 'react';
import { GamificationService } from '../services/gamification';
import * as Progress from '@radix-ui/react-progress';
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion } from 'framer-motion';

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

    // Gamification state
    const [profile, setProfile] = useState(() => GamificationService.getProfile(activeRole));

    useEffect(() => {
        setProfile(GamificationService.getProfile(activeRole));
    }, [activeRole]);

    useEffect(() => {
        const handleGamificationChange = (e) => {
            if (e.detail && e.detail.role === activeRole) {
                setProfile(e.detail.profile);
            }
        };
        window.addEventListener('psypyrus_gamification_change', handleGamificationChange);
        return () => window.removeEventListener('psypyrus_gamification_change', handleGamificationChange);
    }, [activeRole]);

    // Nav configurations
    const clinicianNavItems = useMemo(() => [
        { name: 'Dashboard', icon: 'fa-chart-pie' },
        { name: 'AI Copilot', icon: 'fa-wand-magic-sparkles', badge: 'New' },
        { name: 'CH+MSE Workstation', icon: 'fa-book-medical', badge: 'Core' },
        { name: 'Digital MSE', icon: 'fa-clipboard-list' },
        { name: 'Diagnostics', icon: 'fa-stethoscope', badge: 'Alert' },
        { name: 'Teletherapy', icon: 'fa-video' },
        { name: 'Planner', icon: 'fa-calendar-check' },
        { name: 'Assessments', icon: 'fa-square-poll-horizontal' },
        { name: 'Intake Forms', icon: 'fa-file-signature', badge: 'New' },
        { name: 'Analytics', icon: 'fa-chart-line' },
        { name: 'Marketplace', icon: 'fa-shop' },
        { name: 'Pricing Hub', icon: 'fa-file-invoice-dollar', badge: 'Pricing' },
        { name: 'Research Hub', icon: 'fa-flask', badge: 'Research' },
        { name: 'Integration Hub', icon: 'fa-circle-nodes', badge: 'Hub' },
        { name: 'RDoC Matrix', icon: 'fa-dna', badge: 'Research' },
        { name: 'HiTOP Matrix', icon: 'fa-sitemap', badge: 'Research' },
        { name: 'HIPAA Shield', icon: 'fa-user-shield' },
        { name: 'Social Feed', icon: 'fa-users-line', badge: 'Connect' },
        { name: 'PsychConnect Matches', icon: 'fa-magnifying-glass-location', label: 'Directory', badge: 'Connect' },
        { name: 'PsychConnect Consultations', icon: 'fa-handshake-angle', label: 'Consultations', badge: 'Connect' },
        { name: 'PsychConnect Messages', icon: 'fa-comments', label: 'Messages', badge: 'Connect' },
        { name: 'Care Board', icon: 'fa-clipboard-check', label: 'Care Tasks', badge: 'Connect' },
        { name: 'Patient Intake Pool', icon: 'fa-hand-holding-heart', badge: 'New' }
    ], []);
 
    const patientNavItems = useMemo(() => [
        { name: 'Dashboard', icon: 'fa-house-medical' },
        { name: 'Wellness', icon: 'fa-spa', label: 'Wellness Lounge', badge: 'New' },
        { name: 'Assessments', icon: 'fa-file-invoice' },
        { name: 'Intake Forms', icon: 'fa-file-signature', label: 'Intake & Consent', badge: 'New' },
        { name: 'Teletherapy', icon: 'fa-video', label: 'Telehealth' },
        { name: 'Marketplace', icon: 'fa-shop', label: 'Wellness Store' },
        { name: 'Pricing Hub', icon: 'fa-file-invoice-dollar', label: 'Pricing Hub', badge: 'Pricing' },
        { name: 'Research Hub', icon: 'fa-flask', label: 'Research Hub', badge: 'Research' },
        { name: 'HIPAA Shield', icon: 'fa-shield-halved', label: 'Security logs' },
        { name: 'Social Feed', icon: 'fa-users-line', badge: 'Connect' },
        { name: 'Match & Book', icon: 'fa-magnifying-glass-location', label: 'Directory', badge: 'Connect' },
        { name: 'PsychConnect Consultations', icon: 'fa-handshake-angle', label: 'Consultations', badge: 'Connect' },
        { name: 'PsychConnect Messages', icon: 'fa-comments', label: 'Messages', badge: 'Connect' },
        { name: 'Care Board', icon: 'fa-clipboard-check', label: 'Care Tasks', badge: 'Connect' },
        { name: 'Progress Tracker', icon: 'fa-chart-simple', label: 'Somatic Tracker', badge: 'Connect' },
        { name: 'Resource Library', icon: 'fa-book-open', label: 'Library', badge: 'Connect' },
        { name: 'Support Requests', icon: 'fa-hand-holding-heart', label: 'Support Requests', badge: 'New' }
    ], []);

    const navItems = useMemo(
        () => activeRole === 'Professional' ? clinicianNavItems : patientNavItems,
        [activeRole, clinicianNavItems, patientNavItems]
    );

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
    }, [focusedIndex, navItems, onScreenChange]);

    // Keep focus index in sync with activeScreen
    useEffect(() => {
        const idx = navItems.findIndex(item => item.name === activeScreen);
        setFocusedIndex(idx);
    }, [activeScreen, navItems]);

    return (
        <Tooltip.Provider>
            <motion.aside 
                ref={sidebarRef}
                className={`sidebar-nav-rail flex flex-col h-full bg-slate-950 border-r border-white/5 select-none ${isCollapsed ? 'collapsed' : ''}`}
                id="app-sidebar"
                animate={{ width: isCollapsed ? 76 : 260 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Collapse Toggle Button */}
                <button 
                    className="sidebar-collapse-toggle-btn absolute top-5 -right-3 w-6 h-6 bg-slate-900 border border-white/10 hover:border-teal-500/30 rounded-full flex items-center justify-center text-[10px] text-slate-400 hover:text-white cursor-pointer transition-all z-50 shadow-lg"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <i className={`fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
                </button>

                {/* Logo/Brand Header */}
                <div className="rail-header flex items-center gap-3 px-5 py-5 border-b border-white/5 cursor-pointer" onClick={onShowLanding}>
                    <i className="fa-solid fa-face-smile-beam rail-logo-icon text-teal-400 text-xl"></i>
                    {!isCollapsed && (
                        <div className="brand-text-container flex flex-col">
                            <h2 className="rail-brand-name text-sm font-bold text-white tracking-wide">PsyPyrus</h2>
                            <span className="rail-brand-sub text-[10px] text-slate-500 font-semibold">AI OS v2.0</span>
                        </div>
                    )}
                </div>

                {/* Clinician / User Profile Info */}
                <div className="user-profile-widget flex items-center gap-3 border-b border-white/5" style={{ padding: isCollapsed ? '12px 10px' : '14px 20px', flexDirection: isCollapsed ? 'column' : 'row' }}>
                    <div className="profile-avatar-circle w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center font-bold text-teal-400 text-sm" title={activeRole === 'Professional' ? 'Dr. Liam Carter' : 'Patient Liam Carter'} style={{ position: 'relative', flexShrink: 0 }}>
                        {activeRole === 'Professional' ? 'LC' : 'PC'}
                        {/* Level Badge Overlay */}
                        <span className="profile-level-badge absolute -bottom-1 -right-1 bg-teal-500 text-slate-950 rounded-full w-4.5 h-4.5 text-[9px] font-bold flex items-center justify-center border border-slate-950 shadow-md">
                            {profile?.level || 1}
                        </span>
                    </div>
                    {!isCollapsed && (
                        <div className="profile-details-text flex-grow min-w-0 flex flex-col gap-0.5">
                            <span className="profile-username text-xs font-semibold text-slate-200 truncate">
                                {activeRole === 'Professional' ? 'Dr. Liam Carter' : 'Liam Carter'}
                            </span>
                            <span className="profile-role-sub text-[10px] text-slate-500 truncate">
                                {activeRole === 'Professional' ? 'Lead Psychiatrist' : 'Patient Persona'}
                            </span>
                            
                            {/* XP Progress Bar */}
                            <div className="sidebar-xp-container mt-1">
                                <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                                    <span>XP: {profile?.xp || 0}/{profile?.nextLevelXp || 100}</span>
                                    {activeRole === 'Patient' && (
                                        <span className="text-amber-400 font-bold">
                                            🪙 {profile?.coins || 0}
                                        </span>
                                    )}
                                </div>
                                <Progress.Root 
                                    className="relative overflow-hidden bg-white/10 rounded-full w-full h-1" 
                                    value={Math.min(100, Math.round(((profile?.xp || 0) / (profile?.nextLevelXp || 100)) * 100))}
                                >
                                    <Progress.Indicator 
                                        className="bg-teal-400 w-full h-full rounded-full transition-transform duration-[660ms] ease-[cubic-bezier(0.65,0,0.35,1)]" 
                                        style={{ transform: `translateX(-${100 - Math.min(100, Math.round(((profile?.xp || 0) / (profile?.nextLevelXp || 100)) * 100))}%)` }}
                                    />
                                </Progress.Root>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Menu */}
                <div className="nav-menu-wrapper flex-grow overflow-y-auto py-4">
                    {!isCollapsed && (
                        <div className="nav-group-title px-5 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                            {activeRole === 'Professional' ? 'Clinical Workspace' : 'Wellness Hub'}
                        </div>
                    )}
                    
                    <ul className="nav-items-list flex flex-col gap-1 px-3">
                        {navItems.map((item, idx) => {
                            const displayName = item.label || item.name;
                            const isActive = activeScreen === item.name;
                            const isFocused = idx === focusedIndex;
                            return (
                                <li key={item.name}>
                                    <Tooltip.Root open={isCollapsed ? undefined : false} delayDuration={100}>
                                        <Tooltip.Trigger asChild>
                                            <div 
                                                className={`nav-item-link relative flex items-center gap-3 px-4.5 py-3 rounded-lg transition-all duration-200 cursor-pointer select-none ${isActive ? 'active !bg-transparent before:hidden text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'} ${isFocused ? 'focused shadow-[0_0_0_2px_rgba(20,184,166,0.5)]' : ''}`}
                                                onClick={() => {
                                                    onScreenChange(item.name);
                                                    setFocusedIndex(idx);
                                                }}
                                                tabIndex={0}
                                                onFocus={() => setFocusedIndex(idx)}
                                            >
                                                <i className={`fa-solid ${item.icon} relative z-10 text-[15px]`}></i>
                                                {!isCollapsed && <span className="nav-item-text relative z-10 text-xs">{displayName}</span>}
                                                {!isCollapsed && item.badge && (
                                                    <span className={`nav-item-badge relative z-10 ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-wide badge-${item.badge.toLowerCase()}`}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {isActive && (
                                                    <motion.div 
                                                        layoutId="active-nav-indicator"
                                                        className="absolute inset-0 bg-teal-500/10 border-l-2 border-teal-500 rounded-lg -z-10"
                                                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                                    />
                                                )}
                                            </div>
                                        </Tooltip.Trigger>
                                        <Tooltip.Portal>
                                            <Tooltip.Content 
                                                className="z-[1000] bg-slate-950 text-slate-200 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-white/10 shadow-2xl select-none"
                                                side="right" 
                                                align="center"
                                                sideOffset={12}
                                            >
                                                {displayName}
                                                <Tooltip.Arrow className="fill-slate-950 border-l border-white/10" />
                                            </Tooltip.Content>
                                        </Tooltip.Portal>
                                    </Tooltip.Root>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Footer / Active EHR / Action Controls */}
                <div className="rail-footer-controls p-4 border-t border-white/5 flex flex-col gap-3">
                    {activeRole === 'Professional' && !isCollapsed && (
                        <div className="active-patient-badge p-2.5 bg-slate-900/60 border border-white/5 rounded-lg text-[11px] text-slate-400 flex flex-col gap-0.5">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">Active EHR Target:</span>
                            <strong id="active-patient-display" className="text-teal-400 truncate">{activePatientName}</strong>
                        </div>
                    )}
                    <div className="rail-bottom-buttons flex items-center justify-around gap-2 mt-1">
                        <button 
                            className="rail-btn p-2 bg-slate-900/60 border border-white/5 hover:border-teal-500/30 rounded-lg text-slate-400 hover:text-teal-400 transition-all flex items-center justify-center w-9 h-9" 
                            title="View Project Landing & Downloads"
                            onClick={onShowLanding}
                            style={{ color: 'var(--color-primary)' }}
                        >
                            <i className="fa-solid fa-house"></i>
                        </button>
                        <button 
                            className="rail-btn rail-btn-role p-2 bg-slate-900/60 border border-white/5 hover:border-teal-500/30 rounded-lg text-slate-400 hover:text-teal-400 transition-all flex items-center justify-center w-9 h-9" 
                            id="role-toggle-sidebar" 
                            title="Switch User Role Persona"
                            onClick={onRoleToggle}
                        >
                            <i className="fa-solid fa-user-gear"></i>
                        </button>
                        <button 
                            className="rail-btn p-2 bg-slate-900/60 border border-white/5 hover:border-teal-500/30 rounded-lg text-slate-400 hover:text-teal-400 transition-all flex items-center justify-center w-9 h-9" 
                            id="lock-session-sidebar" 
                            title="Secure Session (Lock Workspace)"
                            onClick={onLock}
                        >
                            <i className="fa-solid fa-lock"></i>
                        </button>
                    </div>
                </div>
            </motion.aside>
        </Tooltip.Provider>
    );
}
