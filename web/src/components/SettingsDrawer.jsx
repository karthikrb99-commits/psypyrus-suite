import { useState, useEffect } from 'react';
import { Database } from '../services/db';

export function SettingsDrawer({ isOpen, onClose, onSave }) {
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
        <aside className={`settings-drawer-panel ${isOpen ? 'active' : ''}`} id="settings-slide-drawer">
            <style>{`
                .settings-section-tabs {
                    display: flex;
                    gap: 6px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    padding-bottom: 8px;
                    margin-bottom: 16px;
                    overflow-x: auto;
                }
                .settings-sec-tab {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    font-size: 11px;
                    font-weight: 600;
                    padding: 6px 10px;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }
                .settings-sec-tab:hover {
                    color: var(--text-light);
                    background: rgba(255,255,255,0.02);
                }
                .settings-sec-tab.active {
                    color: var(--color-primary);
                    background: var(--color-primary-glow);
                }
                .color-picker-grid {
                    display: flex;
                    gap: 8px;
                    margin-top: 8px;
                }
                .color-dot {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: transform 0.2s ease;
                }
                .color-dot:hover {
                    transform: scale(1.15);
                }
                .color-dot.active {
                    border-color: #fff;
                    box-shadow: 0 0 10px rgba(255,255,255,0.25);
                }
            `}</style>

            <div className="settings-drawer-header">
                <h3>PsyPyrus System settings</h3>
                <button className="rail-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
            </div>
            
            <div className="settings-drawer-body">
                
                {/* Section selection tabs */}
                <div className="settings-section-tabs">
                    <button className={`settings-sec-tab ${activeSection === 'api' ? 'active' : ''}`} onClick={() => setActiveSection('api')}>AI & APIs</button>
                    <button className={`settings-sec-tab ${activeSection === 'display' ? 'active' : ''}`} onClick={() => setActiveSection('display')}>Display</button>
                    <button className={`settings-sec-tab ${activeSection === 'data' ? 'active' : ''}`} onClick={() => setActiveSection('data')}>Database</button>
                    <button className={`settings-sec-tab ${activeSection === 'notifications' ? 'active' : ''}`} onClick={() => setActiveSection('notifications')}>Alerts</button>
                </div>

                {/* 1. API SECTION */}
                {activeSection === 'api' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-field-group">
                            <label className="form-label">Active AI Copilot Provider:</label>
                            <select 
                                value={activeProvider}
                                onChange={(e) => setActiveProvider(e.target.value)}
                                className="input-text-field"
                            >
                                <option value="0">Google Gemini (Default)</option>
                                <option value="1">OpenAI / Custom LLM</option>
                            </select>
                        </div>

                        {activeProvider === '0' ? (
                            <div className="form-field-group">
                                <label className="form-label">Google Gemini API Key:</label>
                                <input 
                                    type="password" 
                                    className="input-text-field" 
                                    placeholder="AIzaSy..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                {apiKey.trim().length > 0 ? (
                                    <div style={{ color: 'var(--color-success)', fontSize: '11px', marginTop: '6px' }}>
                                        <i className="fa-solid fa-circle-check"></i> Gemini cloud endpoint configured.
                                    </div>
                                ) : (
                                    <div style={{ color: 'var(--color-warning)', fontSize: '11px', marginTop: '6px' }}>
                                        <i className="fa-solid fa-triangle-exclamation"></i> Key empty. Using local mock fallbacks.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="form-field-group">
                                    <label className="form-label">OpenAI / Custom API Key:</label>
                                    <input 
                                        type="password" 
                                        className="input-text-field" 
                                        placeholder="sk-..."
                                        value={openaiKey}
                                        onChange={(e) => setOpenaiKey(e.target.value)}
                                    />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Custom Endpoint Base URL:</label>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        value={customUrl}
                                        onChange={(e) => setCustomUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <hr style={{ border: 'none', height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)' }}>WHO ICD-11 Terminology API</span>
                            <div className="form-field-group">
                                <label className="form-label">ICD-11 Client ID:</label>
                                <input className="input-text-field" placeholder="Client ID credentials..." value={icdClientId} onChange={(e) => setIcdClientId(e.target.value)} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">ICD-11 Client Secret:</label>
                                <input type="password" className="input-text-field" placeholder="Client secret..." value={icdClientSecret} onChange={(e) => setIcdClientSecret(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. DISPLAY SECTION */}
                {activeSection === 'display' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-field-group">
                            <label className="form-label">System Font Sizing:</label>
                            <select 
                                value={fontSize}
                                onChange={(e) => setFontSize(e.target.value)}
                                className="input-text-field"
                            >
                                <option value="small">Small Sizing (13px)</option>
                                <option value="medium">Medium Standard (15px)</option>
                                <option value="large">Large Accessibility (17px)</option>
                            </select>
                        </div>

                        <div className="form-field-group">
                            <label className="form-label">Active Workspace Theme Accent:</label>
                            <div className="color-picker-grid">
                                {Object.keys(colorOptions).map((col) => (
                                    <div 
                                        key={col}
                                        className={`color-dot ${accentColor === col ? 'active' : ''}`}
                                        style={{ backgroundColor: colorOptions[col].primary }}
                                        onClick={() => setAccentColor(col)}
                                        title={col}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. DATABASE SECTION */}
                {activeSection === 'data' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Perform full backup and restore operations on offline localStorage files.
                        </span>
                        
                        <button className="action-button-btn" style={{ width: '100%' }} onClick={handleExport}>
                            <i className="fa-solid fa-file-export"></i> Backup Database (JSON)
                        </button>
                        
                        <div style={{ border: '1px dashed rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                                Restore from JSON backup file:
                            </span>
                            <input type="file" accept=".json" onChange={handleImport} style={{ fontSize: '11px', color: 'var(--text-muted)' }} />
                        </div>

                        <hr style={{ border: 'none', height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />

                        <button className="action-button-btn danger" style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)' }} onClick={handleWipe}>
                            <i className="fa-solid fa-triangle-exclamation"></i> WIPE CLINICAL DATABASE
                        </button>
                    </div>
                )}

                {/* 4. NOTIFICATIONS */}
                {activeSection === 'notifications' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Configure alert preferences for system audit logging events.
                        </span>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                            <input type="checkbox" checked={notifyRisk} onChange={(e) => setNotifyRisk(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                            <span>Risk Flags Warnings Alerts</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                            <input type="checkbox" checked={notifySession} onChange={(e) => setNotifySession(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                            <span>Scheduled Sessions Updates</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                            <input type="checkbox" checked={notifySystem} onChange={(e) => setNotifySystem(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                            <span>System Diagnostics & Audit logs</span>
                        </label>
                    </div>
                )}

                {/* System Diagnostics Info */}
                {systemInfo && activeSection === 'display' && (
                    <div className="system-diagnostics-group" style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                        <h4 style={{ marginBottom: '8px', color: 'var(--color-primary)', fontSize: '12px' }}>System Diagnostics</h4>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div><strong>OS Platform:</strong> {systemInfo.platform} ({systemInfo.arch})</div>
                            <div><strong>Processor:</strong> {systemInfo.cpuModel}</div>
                            <div><strong>RAM Utilized:</strong> {systemInfo.usedMemoryGB} GB / {systemInfo.totalMemoryGB} GB</div>
                            <div><strong>Desktop Version:</strong> {systemInfo.appVersion}</div>
                        </div>
                    </div>
                )}
            </div>

            <button className="action-button-btn" onClick={handleSave} style={{ width: '100%', marginTop: 'auto' }}>
                Save Settings
            </button>
        </aside>
    );
}
