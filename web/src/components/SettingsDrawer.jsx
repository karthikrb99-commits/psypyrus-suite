import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Database } from '../services/db';
import { GamificationService } from '../services/gamification';

export function SettingsDrawer({ isOpen, onClose, onSave, theme, setTheme, onOpenLegal }) {
    const [activeSection, setActiveSection] = useState('api'); // 'api', 'display', 'data', 'notifications'

    // API state
    const [activeProvider, setActiveProvider] = useState('0'); 
    const [apiKey, setApiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [customUrl, setCustomUrl] = useState('https://api.openai.com/v1/chat/completions');
    const [icdClientId, setIcdClientId] = useState('');
    const [icdClientSecret, setIcdClientSecret] = useState('');

    // Display state
    const [accentColor, setAccentColor] = useState('teal');
    const [fontSize, setFontSize] = useState('medium');
    const [unlockedThemes, setUnlockedThemes] = useState({ crt: false, glass: false });

    // Notifications state
    const [notifyRisk, setNotifyRisk] = useState(true);
    const [notifySession, setNotifySession] = useState(true);
    const [notifySystem, setNotifySystem] = useState(false);

    const [systemInfo, setSystemInfo] = useState(null);

    // Color definitions
    const colorOptions = {
        teal: { primary: '#00f2fe', glow: 'rgba(0, 242, 254, 0.15)' },
        cyan: { primary: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.15)' },
        purple: { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.15)' },
        green: { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.15)' },
        blue: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.15)' }
    };

    useEffect(() => {
        if (isOpen) {
            // Load saved settings
            setActiveProvider(localStorage.getItem('psypyrus_active_provider') || '0');
            
            const savedGeminiKey = localStorage.getItem('psypyrus_gemini_api_key') || '';
            setApiKey(savedGeminiKey === 'AIzaSy...your_gemini_api_key_here...' ? '' : savedGeminiKey);
            
            setOpenaiKey(localStorage.getItem('psypyrus_openai_api_key') || '');
            setCustomUrl(localStorage.getItem('psypyrus_custom_llm_url') || 'https://api.openai.com/v1/chat/completions');
            setIcdClientId(localStorage.getItem('psypyrus_icd_client_id') || '');
            setIcdClientSecret(localStorage.getItem('psypyrus_icd_client_secret') || '');

            // Load Display settings
            const savedAccent = localStorage.getItem('psypyrus_accent_color') || 'teal';
            const savedFont = localStorage.getItem('psypyrus_font_size') || 'medium';
            setAccentColor(savedAccent);
            setFontSize(savedFont);

            // Load Notifications settings
            setNotifyRisk(localStorage.getItem('psypyrus_notify_risk') !== 'false');
            setNotifySession(localStorage.getItem('psypyrus_notify_session') !== 'false');
            setNotifySystem(localStorage.getItem('psypyrus_notify_system') === 'true');

            // Check theme purchases
            const shopItems = GamificationService.getShopItems();
            setUnlockedThemes({
                crt: shopItems.find(i => i.id === 'shop_theme_retro')?.purchased || false,
                glass: shopItems.find(i => i.id === 'shop_theme_glass')?.purchased || false
            });

            // System diagnostics info fetch
            if (window.electronAPI && typeof window.electronAPI.getSystemInfo === 'function') {
                window.electronAPI.getSystemInfo().then(setSystemInfo).catch(console.error);
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        // Save APIs
        localStorage.setItem('psypyrus_active_provider', activeProvider);
        localStorage.setItem('psypyrus_gemini_api_key', apiKey.trim());
        localStorage.setItem('psypyrus_openai_api_key', openaiKey.trim());
        localStorage.setItem('psypyrus_custom_llm_url', customUrl.trim());
        localStorage.setItem('psypyrus_icd_client_id', icdClientId.trim());
        localStorage.setItem('psypyrus_icd_client_secret', icdClientSecret.trim());
        
        // Save Display & Apply variables dynamically on DOM
        localStorage.setItem('psypyrus_accent_color', accentColor);
        localStorage.setItem('psypyrus_font_size', fontSize);

        const colors = colorOptions[accentColor];
        if (colors) {
            document.documentElement.style.setProperty('--color-primary', colors.primary);
            document.documentElement.style.setProperty('--color-primary-glow', colors.glow);
        }

        const fontSizes = { small: '13px', medium: '15px', large: '17px' };
        document.body.style.fontSize = fontSizes[fontSize];

        // Save Notifications
        localStorage.setItem('psypyrus_notify_risk', String(notifyRisk));
        localStorage.setItem('psypyrus_notify_session', String(notifySession));
        localStorage.setItem('psypyrus_notify_system', String(notifySystem));

        Database.logAudit("API Credentials Saved", `Configured multi-provider settings (Active: ${activeProvider === '0' ? 'Gemini' : 'OpenAI/Custom'}).`);
        if (onSave) onSave();
        onClose();
    };

    const handleExport = () => {
        const data = Database.exportDatabaseToJson();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PsyPyrus_EHR_Backup_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const success = Database.importDatabaseFromJson(event.target.result);
            if (success) {
                alert("EHR Database successfully restored from JSON backup!");
                window.location.reload();
            } else {
                alert("Failed to parse JSON backup file. Ensure standard PsyPyrus format.");
            }
        };
        reader.readAsText(file);
    };

    const handleWipe = () => {
        if (window.confirm("CRITICAL WARNING: This will completely delete all patient charts, clinical notes, scheduled sessions, and logs. This is irreversible. Wipe database?")) {
            Database.clearDatabase();
            alert("Database wiped. Pre-populated clinical seed data loaded.");
            window.location.reload();
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div 
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Dialog.Content asChild>
                                    <motion.div 
                                        className="settings-slide-drawer fixed right-0 top-0 h-full w-full max-w-[400px] bg-slate-900 border-l border-white/10 p-6 shadow-2xl z-[1000] flex flex-col text-slate-100"
                                        id="settings-slide-drawer"
                                        initial={{ x: "100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "100%" }}
                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    >
                                        <Dialog.Title asChild>
                                            <div className="settings-drawer-header flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                                                <h3 className="text-lg font-bold">PsyPyrus System settings</h3>
                                                <button className="rail-btn text-slate-400 hover:text-slate-200" onClick={onClose}>
                                                    <i className="fa-solid fa-xmark"></i>
                                                </button>
                                            </div>
                                        </Dialog.Title>

                                        <Tabs.Root value={activeSection} onValueChange={setActiveSection} className="flex-1 flex flex-col min-h-0">
                                            {/* Tabs Header */}
                                            <Tabs.List className="settings-section-tabs flex gap-1 border-b border-white/5 pb-2 mb-4 overflow-x-auto">
                                                <Tabs.Trigger 
                                                    value="api" 
                                                    className={`settings-sec-tab px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeSection === 'api' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                                >
                                                    AI & APIs
                                                </Tabs.Trigger>
                                                <Tabs.Trigger 
                                                    value="display" 
                                                    className={`settings-sec-tab px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeSection === 'display' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                                >
                                                    Display
                                                </Tabs.Trigger>
                                                <Tabs.Trigger 
                                                    value="data" 
                                                    className={`settings-sec-tab px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeSection === 'data' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                                >
                                                    Database
                                                </Tabs.Trigger>
                                                <Tabs.Trigger 
                                                    value="notifications" 
                                                    className={`settings-sec-tab px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeSection === 'notifications' ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                                >
                                                    Alerts
                                                </Tabs.Trigger>
                                            </Tabs.List>

                                            {/* Tabs Scrollable Content */}
                                            <div className="flex-1 overflow-y-auto pr-1 min-h-0 pb-6">
                                                {/* API SECTION */}
                                                <Tabs.Content value="api" className="flex flex-col gap-4">
                                                    <div className="form-field-group flex flex-col gap-1.5">
                                                        <label className="form-label text-xs font-semibold text-slate-400">Active AI Copilot Provider:</label>
                                                        <select 
                                                            value={activeProvider}
                                                            onChange={(e) => setActiveProvider(e.target.value)}
                                                            className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 px-3 py-2 rounded-md outline-none text-sm focus:border-primary/50 transition-all"
                                                        >
                                                            <option value="0">Google Gemini (Default)</option>
                                                            <option value="1">OpenAI / Custom LLM</option>
                                                        </select>
                                                    </div>

                                                    {activeProvider === '0' ? (
                                                        <div className="form-field-group flex flex-col gap-1.5">
                                                            <label className="form-label text-xs font-semibold text-slate-400">Google Gemini API Key:</label>
                                                            <input 
                                                                type="password" 
                                                                className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 placeholder-slate-500 px-3 py-2 rounded-md outline-none text-sm focus:border-primary/50 transition-all" 
                                                                placeholder="AIzaSy..."
                                                                value={apiKey}
                                                                onChange={(e) => setApiKey(e.target.value)}
                                                            />
                                                            {apiKey.trim().length > 0 ? (
                                                                <div className="text-emerald-400 text-xs mt-1 flex items-center gap-1.5">
                                                                    <i className="fa-solid fa-circle-check"></i> Gemini cloud endpoint configured.
                                                                </div>
                                                            ) : (
                                                                <div className="text-amber-400 text-xs mt-1 flex items-center gap-1.5">
                                                                    <i className="fa-solid fa-triangle-exclamation"></i> Key empty. Using local mock fallbacks.
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-3">
                                                            <div className="form-field-group flex flex-col gap-1.5">
                                                                <label className="form-label text-xs font-semibold text-slate-400">OpenAI / Custom API Key:</label>
                                                                <input 
                                                                    type="password" 
                                                                    className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 placeholder-slate-500 px-3 py-2 rounded-md outline-none text-sm focus:border-primary/50 transition-all" 
                                                                    placeholder="sk-..."
                                                                    value={openaiKey}
                                                                    onChange={(e) => setOpenaiKey(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="form-field-group flex flex-col gap-1.5">
                                                                <label className="form-label text-xs font-semibold text-slate-400">Custom Endpoint Base URL:</label>
                                                                <input 
                                                                    type="text" 
                                                                    className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 px-3 py-2 rounded-md outline-none text-sm focus:border-primary/50 transition-all" 
                                                                    value={customUrl}
                                                                    onChange={(e) => setCustomUrl(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <hr className="border-white/5 my-2" />
                                                    
                                                    <div className="flex flex-col gap-3">
                                                        <span className="text-xs font-bold text-primary">WHO ICD-11 Terminology API</span>
                                                        <div className="form-field-group flex flex-col gap-1.5">
                                                            <label className="form-label text-xs font-semibold text-slate-400">ICD-11 Client ID:</label>
                                                            <input className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 px-3 py-2 rounded-md outline-none text-sm focus:border-primary/50 transition-all" placeholder="Client ID credentials..." value={icdClientId} onChange={(e) => setIcdClientId(e.target.value)} />
                                                        </div>
                                                        <div className="form-field-group flex flex-col gap-1.5">
                                                            <label className="form-label text-xs font-semibold text-slate-400">ICD-11 Client Secret:</label>
                                                            <input type="password" className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 px-3 py-2 rounded-md outline-none text-sm focus:border-primary/50 transition-all" placeholder="Client secret..." value={icdClientSecret} onChange={(e) => setIcdClientSecret(e.target.value)} />
                                                        </div>
                                                    </div>
                                                </Tabs.Content>

                                                {/* DISPLAY SECTION */}
                                                <Tabs.Content value="display" className="flex flex-col gap-5">
                                                    <div className="form-field-group flex flex-col gap-1.5">
                                                        <label className="form-label text-xs font-semibold text-slate-400">System Font Sizing:</label>
                                                        <select 
                                                            value={fontSize}
                                                            onChange={(e) => setFontSize(e.target.value)}
                                                            className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 px-3 py-2 rounded-md outline-none text-sm focus:border-primary/50 transition-all"
                                                        >
                                                            <option value="small">Small Sizing (13px)</option>
                                                            <option value="medium">Medium Standard (15px)</option>
                                                            <option value="large">Large Accessibility (17px)</option>
                                                        </select>
                                                    </div>

                                                    <div className="form-field-group flex flex-col gap-1.5">
                                                        <label className="form-label text-xs font-semibold text-slate-400">System Layout Theme:</label>
                                                        <select 
                                                            value={theme} 
                                                            onChange={(e) => setTheme(e.target.value)}
                                                            className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 px-3 py-2 rounded-md outline-none text-sm focus:border-primary/50 transition-all"
                                                        >
                                                            <option value="dark-onyx">Dark Onyx (Default)</option>
                                                            <option value="light">Light Slate Mode</option>
                                                            <option value="retro-crt" disabled={!unlockedThemes.crt}>
                                                                Retro CRT Terminal {unlockedThemes.crt ? '(Unlocked)' : '(Locked 🪙 100 coins)'}
                                                            </option>
                                                            <option value="glassmorphic" disabled={!unlockedThemes.glass}>
                                                                Glassmorphic Translucent {unlockedThemes.glass ? '(Unlocked)' : '(Locked 🪙 80 coins)'}
                                                            </option>
                                                        </select>
                                                    </div>

                                                    <div className="form-field-group flex flex-col gap-1.5">
                                                        <label className="form-label text-xs font-semibold text-slate-400">Active Workspace Theme Accent:</label>
                                                        <div className="color-picker-grid flex gap-2 mt-1">
                                                            {Object.keys(colorOptions).map((col) => (
                                                                <div 
                                                                    key={col}
                                                                    className={`color-dot w-6 h-6 rounded-full cursor-pointer border-2 transition-transform hover:scale-110 ${accentColor === col ? 'border-white shadow-md' : 'border-transparent'}`}
                                                                    style={{ backgroundColor: colorOptions[col].primary }}
                                                                    onClick={() => setAccentColor(col)}
                                                                    title={col}
                                                                ></div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* System Diagnostics Info */}
                                                    {systemInfo && (
                                                        <div className="system-diagnostics-group mt-6 border-t border-white/5 pt-4">
                                                            <h4 className="mb-2 text-primary font-bold text-xs">System Diagnostics</h4>
                                                            <div className="text-[11px] text-slate-400 flex flex-col gap-1.5">
                                                                <div><strong>OS Platform:</strong> {systemInfo.platform} ({systemInfo.arch})</div>
                                                                <div><strong>Processor:</strong> {systemInfo.cpuModel}</div>
                                                                <div><strong>RAM Utilized:</strong> {systemInfo.usedMemoryGB} GB / {systemInfo.totalMemoryGB} GB</div>
                                                                <div><strong>Desktop Version:</strong> {systemInfo.appVersion}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Tabs.Content>

                                                {/* DATABASE SECTION */}
                                                <Tabs.Content value="data" className="flex flex-col gap-4">
                                                    <span className="text-xs text-slate-400">
                                                        Perform full backup and restore operations on offline localStorage files.
                                                    </span>
                                                    
                                                    <button className="action-button-btn w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 px-3 rounded border border-white/10 flex items-center justify-center gap-1.5 transition-colors" onClick={handleExport}>
                                                        <i className="fa-solid fa-file-export"></i> Backup Database (JSON)
                                                    </button>
                                                    
                                                    <div className="border border-dashed border-white/10 p-3 rounded-lg text-center flex flex-col gap-2">
                                                        <span className="text-[11px] text-slate-400 block">
                                                            Restore from JSON backup file:
                                                        </span>
                                                        <input type="file" accept=".json" onChange={handleImport} className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary file:cursor-pointer hover:file:bg-primary/30" />
                                                    </div>

                                                    <hr className="border-white/5 my-2" />

                                                    <button className="action-button-btn danger w-full bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-semibold py-2 px-3 rounded border border-red-500/30 flex items-center justify-center gap-1.5 transition-colors" onClick={handleWipe}>
                                                        <i className="fa-solid fa-triangle-exclamation"></i> WIPE CLINICAL DATABASE
                                                    </button>
                                                </Tabs.Content>

                                                {/* NOTIFICATIONS */}
                                                <Tabs.Content value="notifications" className="flex flex-col gap-4">
                                                    <span className="text-xs text-slate-400">
                                                        Configure alert preferences for system audit logging events.
                                                    </span>
                                                    
                                                    <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-300">
                                                        <input type="checkbox" checked={notifyRisk} onChange={(e) => setNotifyRisk(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} className="w-4 h-4 cursor-pointer" />
                                                        <span>Risk Flags Warnings Alerts</span>
                                                    </label>

                                                    <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-300">
                                                        <input type="checkbox" checked={notifySession} onChange={(e) => setNotifySession(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} className="w-4 h-4 cursor-pointer" />
                                                        <span>Scheduled Sessions Updates</span>
                                                    </label>

                                                    <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-300">
                                                        <input type="checkbox" checked={notifySystem} onChange={(e) => setNotifySystem(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} className="w-4 h-4 cursor-pointer" />
                                                        <span>System Diagnostics & Audit logs</span>
                                                    </label>
                                                </Tabs.Content>
                                            </div>

                                            <div className="settings-drawer-footer border-t border-white/5 pt-4 mt-4 mb-4 flex flex-col gap-2">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Legal Agreements & Policies</span>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={() => onOpenLegal && onOpenLegal('privacy')} className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded text-[10px] text-slate-300 font-semibold transition-all text-left flex items-center gap-1.5 cursor-pointer">
                                                        <i className="fa-solid fa-shield-halved text-teal-400"></i> Privacy Policy
                                                    </button>
                                                    <button onClick={() => onOpenLegal && onOpenLegal('terms')} className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded text-[10px] text-slate-300 font-semibold transition-all text-left flex items-center gap-1.5 cursor-pointer">
                                                        <i className="fa-solid fa-file-contract text-teal-400"></i> Terms of Use
                                                    </button>
                                                    <button onClick={() => onOpenLegal && onOpenLegal('guidelines')} className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded text-[10px] text-slate-300 font-semibold transition-all text-left flex items-center gap-1.5 cursor-pointer">
                                                        <i className="fa-solid fa-users text-teal-400"></i> Guidelines
                                                    </button>
                                                    <button onClick={() => onOpenLegal && onOpenLegal('copyright')} className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded text-[10px] text-slate-300 font-semibold transition-all text-left flex items-center gap-1.5 cursor-pointer">
                                                        <i className="fa-solid fa-copyright text-teal-400"></i> Copyright Policy
                                                    </button>
                                                </div>
                                            </div>
                                        </Tabs.Root>

                                        <button className="action-button-btn w-full bg-primary text-black hover:bg-primary/95 text-sm font-bold py-2.5 rounded-md mt-auto shadow-md transition-colors" onClick={handleSave}>
                                            Save Settings
                                        </button>
                                    </motion.div>
                                </Dialog.Content>
                            </motion.div>
                        </Dialog.Overlay>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}
