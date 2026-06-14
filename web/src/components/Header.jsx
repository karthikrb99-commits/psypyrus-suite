import { useState, useEffect } from 'react';
import { GamificationService } from '../services/gamification';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';

export function Header({
    activeRole,
    activeScreen,
    theme,
    onRoleChange,
    onThemeToggle,
    onSettingsOpen,
    onLock,
    onShowLanding,
    onCommandPaletteOpen,
    firebaseUser = null,
    onGoogleSignIn = null,
    onGoogleSignOut = null
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

    // Gamification header state
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

    return (
        <Tooltip.Provider>
            <header className="header-toolbar flex items-center justify-between px-6 bg-slate-950/40 backdrop-blur-md border-b border-white/5 h-[70px]">
                {/* Breadcrumb Trail */}
                <div className="toolbar-breadcrumbs flex items-center gap-2 text-sm text-slate-400 font-medium">
                    <i className="fa-solid fa-hand-holding-medical breadcrumb-icon"></i>
                    <span className="breadcrumb-parent">{activeRole}</span>
                    <i className="fa-solid fa-chevron-right breadcrumb-separator text-xs opacity-50"></i>
                    <span className="breadcrumb-current text-teal-400 font-semibold">{activeScreen}</span>
                </div>

                {/* Center: Command Search Bar Trigger */}
                <div 
                    className="toolbar-search-trigger flex items-center justify-between gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-900/90 border border-white/5 hover:border-teal-500/30 rounded-lg text-xs text-slate-400 cursor-pointer transition-all duration-200 select-none w-72" 
                    onClick={onCommandPaletteOpen} 
                    title="Open Command Palette (Ctrl+K)"
                >
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-magnifying-glass search-trigger-icon text-slate-500"></i>
                        <span className="search-trigger-placeholder">Search screens, patients (Ctrl+K)...</span>
                    </div>
                    <kbd className="search-trigger-kbd px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded text-[10px] font-mono border border-white/5">⌘K</kbd>
                </div>

                <div className="toolbar-actions-group flex items-center gap-4">
                    {/* Firebase Cloud Database Sync Button */}
                    {firebaseUser ? (
                        <button 
                            onClick={onGoogleSignOut}
                            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[11px] font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
                            title={`Synced as ${firebaseUser.email}. Click to sign out.`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Cloud Synced</span>
                        </button>
                    ) : (
                        <button 
                            onClick={onGoogleSignIn}
                            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-[11px] font-semibold hover:bg-indigo-500/20 transition-all cursor-pointer"
                            title="Connect secure Firebase auth and real-time Cloud Firestore syncing."
                        >
                            <i className="fa-solid fa-cloud-arrow-up text-[10px]"></i>
                            <span>Sync Cloud DB</span>
                        </button>
                    )}

                    {/* Status indicator dot */}
                    <div className="network-status-node flex items-center gap-2 px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-[11px] text-teal-400 font-semibold" title="System Status: Connected (AES-GCM encrypted)">
                        <span className="status-indicator-dot w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                        <span className="status-indicator-text">Secure</span>
                    </div>

                    {/* Gamification Micro-widget */}
                    <div className="header-gamification-pill flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[11px] font-bold text-slate-300 cursor-default">
                        {activeRole === 'Patient' ? (
                            <>
                                <span className="text-amber-400">🪙</span>
                                <span>{profile?.coins || 0}</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-trophy text-amber-400 text-[10px]"></i>
                                <span>Lvl {profile?.level || 1}</span>
                            </>
                        )}
                    </div>

                    {/* Dynamic Switcher Pill */}
                    <div className="persona-switcher-pill flex bg-slate-900/80 p-0.5 rounded-lg border border-white/5">
                        <button 
                            className={`persona-pill-btn px-3 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${activeRole === 'Professional' ? 'active bg-teal-500 text-slate-950 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                            onClick={() => onRoleChange('Professional')}
                        >
                            <i className="fa-solid fa-user-doctor"></i> <span>Professional</span>
                        </button>
                        <button 
                            className={`persona-pill-btn px-3 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${activeRole === 'Patient' ? 'active bg-teal-500 text-slate-950 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                            onClick={() => onRoleChange('Patient')}
                        >
                            <i className="fa-solid fa-user"></i> <span>Patient</span>
                        </button>
                    </div>

                    {/* Notifications Bell */}
                    <div className="notification-bell-wrapper relative">
                        <DropdownMenu.Root open={showNotifDropdown} onOpenChange={setShowNotifDropdown}>
                            <DropdownMenu.Trigger asChild>
                                <button 
                                    className="toolbar-icon-btn notification-bell-btn relative p-2 bg-slate-900/60 border border-white/5 hover:border-teal-500/30 rounded-lg text-slate-400 hover:text-teal-400 transition-all" 
                                    title="Notifications"
                                >
                                    <i className="fa-solid fa-bell"></i>
                                    {notifications.length > 0 && (
                                        <span className="notification-badge-count absolute -top-1 -right-1 bg-teal-500 text-slate-950 font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-950">
                                            {notifications.length}
                                        </span>
                                    )}
                                </button>
                            </DropdownMenu.Trigger>

                            <AnimatePresence>
                                {showNotifDropdown && (
                                    <DropdownMenu.Portal forceMount>
                                        <DropdownMenu.Content 
                                            forceMount 
                                            asChild
                                            align="end" 
                                            sideOffset={8}
                                        >
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                transition={{ duration: 0.15 }}
                                                className="notification-dropdown-menu !static !top-auto !right-auto flex flex-col w-72 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden focus:outline-none"
                                            >
                                                <div className="notif-dropdown-header flex items-center justify-between px-4 py-3 border-b border-white/5 text-xs text-slate-300 font-semibold">
                                                    <span>Notifications</span>
                                                    {notifications.length > 0 && (
                                                        <button onClick={handleClearNotifications} className="notif-clear-btn text-teal-400 hover:text-teal-300 transition-colors font-medium">Clear All</button>
                                                    )}
                                                </div>
                                                <div className="notif-dropdown-list flex flex-col p-1.5 max-h-72 overflow-y-auto overflow-x-hidden">
                                                    <AnimatePresence initial={false}>
                                                        {notifications.length === 0 ? (
                                                            <motion.div 
                                                                key="empty"
                                                                initial={{ opacity: 0, y: -5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 5 }}
                                                                className="notif-empty-state py-8 text-center text-xs text-slate-500 font-medium"
                                                            >
                                                                No new notifications
                                                            </motion.div>
                                                        ) : (
                                                            notifications.map(n => (
                                                                <DropdownMenu.Item asChild key={n.id}>
                                                                    <motion.div 
                                                                        initial={{ opacity: 0, height: 0, x: -10 }}
                                                                        animate={{ opacity: 1, height: 'auto', x: 0 }}
                                                                        exit={{ opacity: 0, height: 0, x: 10 }}
                                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                        className="notif-dropdown-item flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs text-slate-300 focus:bg-white/5 focus:outline-none"
                                                                    >
                                                                        <i className="fa-solid fa-circle-exclamation notif-item-icon text-teal-500 mt-0.5"></i>
                                                                        <span className="notif-item-text leading-relaxed">{n.text}</span>
                                                                    </motion.div>
                                                                </DropdownMenu.Item>
                                                            ))
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                )}
                            </AnimatePresence>
                        </DropdownMenu.Root>
                    </div>

                    {/* Home/Landing Page Link */}
                    <Tooltip.Root delayDuration={200}>
                        <Tooltip.Trigger asChild>
                            <button 
                                className="toolbar-icon-btn p-2 bg-slate-900/60 border border-white/5 hover:border-teal-500/30 rounded-lg text-slate-400 hover:text-teal-400 transition-all" 
                                onClick={onShowLanding}
                                style={{ color: 'var(--color-primary)' }}
                            >
                                <i className="fa-solid fa-house"></i>
                            </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                            <Tooltip.Content 
                                className="z-[1000] bg-slate-950 text-slate-200 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-white/10 shadow-2xl select-none"
                                side="bottom" 
                                align="center"
                                sideOffset={8}
                            >
                                View Project Landing & Downloads
                                <Tooltip.Arrow className="fill-slate-950 border-t border-white/10" />
                            </Tooltip.Content>
                        </Tooltip.Portal>
                    </Tooltip.Root>

                    {/* Theme Toggle */}
                    <Tooltip.Root delayDuration={200}>
                        <Tooltip.Trigger asChild>
                            <button 
                                className="toolbar-icon-btn p-2 bg-slate-900/60 border border-white/5 hover:border-teal-500/30 rounded-lg text-slate-400 hover:text-teal-400 transition-all" 
                                id="theme-toggle-btn" 
                                onClick={onThemeToggle}
                            >
                                <i className={`fa-solid ${theme === 'light' ? 'fa-sun' : 'fa-moon'}`}></i>
                            </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                            <Tooltip.Content 
                                className="z-[1000] bg-slate-950 text-slate-200 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-white/10 shadow-2xl select-none"
                                side="bottom" 
                                align="center"
                                sideOffset={8}
                            >
                                Toggle Light/Dark Theme
                                <Tooltip.Arrow className="fill-slate-950 border-t border-white/10" />
                            </Tooltip.Content>
                        </Tooltip.Portal>
                    </Tooltip.Root>

                    {/* Settings Gear */}
                    <Tooltip.Root delayDuration={200}>
                        <Tooltip.Trigger asChild>
                            <button 
                                className="toolbar-icon-btn p-2 bg-slate-900/60 border border-white/5 hover:border-teal-500/30 rounded-lg text-slate-400 hover:text-teal-400 transition-all" 
                                id="settings-toggle-btn" 
                                onClick={onSettingsOpen}
                            >
                                <i className="fa-solid fa-gears"></i>
                            </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                            <Tooltip.Content 
                                className="z-[1000] bg-slate-950 text-slate-200 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-white/10 shadow-2xl select-none"
                                side="bottom" 
                                align="center"
                                sideOffset={8}
                            >
                                API Settings Configuration
                                <Tooltip.Arrow className="fill-slate-950 border-t border-white/10" />
                            </Tooltip.Content>
                        </Tooltip.Portal>
                    </Tooltip.Root>

                    {/* Lock Button */}
                    <Tooltip.Root delayDuration={200}>
                        <Tooltip.Trigger asChild>
                            <button 
                                className="toolbar-icon-btn p-2 bg-slate-900/60 border border-white/5 hover:border-teal-500/30 rounded-lg text-slate-400 hover:text-teal-400 transition-all" 
                                id="lock-toggle-btn" 
                                onClick={onLock}
                            >
                                <i className="fa-solid fa-lock-open" style={{ color: 'var(--color-primary)' }}></i>
                            </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                            <Tooltip.Content 
                                className="z-[1000] bg-slate-950 text-slate-200 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-white/10 shadow-2xl select-none"
                                side="bottom" 
                                align="center"
                                sideOffset={8}
                            >
                                Cryptographically Lock Session
                                <Tooltip.Arrow className="fill-slate-950 border-t border-white/10" />
                            </Tooltip.Content>
                        </Tooltip.Portal>
                    </Tooltip.Root>
                </div>
            </header>
        </Tooltip.Provider>
    );
}

