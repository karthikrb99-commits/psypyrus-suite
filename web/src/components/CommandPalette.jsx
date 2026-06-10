import { useState, useEffect, useRef, useCallback } from 'react';

export function CommandPalette({
    isOpen,
    onClose,
    activeRole,
    onNavigate,
    patients = [],
    onSelectPatient
}) {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);

    // List of screens to search
    const clinicianScreens = [
        { id: 'dashboard', name: 'Clinician Dashboard', category: 'Navigation', screen: 'Dashboard', icon: 'fa-chart-pie' },
        { id: 'copilot', name: 'AI SOAP Notes Copilot', category: 'Navigation', screen: 'AI Copilot', icon: 'fa-wand-magic-sparkles' },
        { id: 'mse', name: 'Digital Mental Status Exam (MSE)', category: 'Navigation', screen: 'Digital MSE', icon: 'fa-clipboard-list' },
        { id: 'diagnostics', name: 'Diagnostics Suite', category: 'Navigation', screen: 'Diagnostics', icon: 'fa-stethoscope' },
        { id: 'teletherapy', name: 'Teletherapy Session', category: 'Navigation', screen: 'Teletherapy', icon: 'fa-video' },
        { id: 'planner', name: 'CBT Goal Planner', category: 'Navigation', screen: 'Planner', icon: 'fa-calendar-check' },
        { id: 'assessments', name: 'Clinical Assessment Instruments', category: 'Navigation', screen: 'Assessments', icon: 'fa-square-poll-horizontal' },
        { id: 'analytics', name: 'Performance & Billing Analytics', category: 'Navigation', screen: 'Analytics', icon: 'fa-chart-line' },
        { id: 'marketplace', name: 'PsyPyrus Marketplace', category: 'Navigation', screen: 'Marketplace', icon: 'fa-shop' },
        { id: 'hipaa', name: 'HIPAA Security & Audit Shield', category: 'Navigation', screen: 'HIPAA Shield', icon: 'fa-user-shield' },
    ];

    const patientScreens = [
        { id: 'p-dashboard', name: 'Patient Dashboard', category: 'Navigation', screen: 'Dashboard', icon: 'fa-house-medical' },
        { id: 'p-wellness', name: 'Wellness Lounge', category: 'Navigation', screen: 'Wellness', icon: 'fa-spa' },
        { id: 'p-assessments', name: 'Patient Assessments', category: 'Navigation', screen: 'Assessments', icon: 'fa-file-invoice' },
        { id: 'p-telehealth', name: 'Telehealth Session', category: 'Navigation', screen: 'Teletherapy', icon: 'fa-video' },
        { id: 'p-marketplace', name: 'Wellness Store', category: 'Navigation', screen: 'Marketplace', icon: 'fa-shop' },
        { id: 'p-hipaa', name: 'Security & Consent Logs', category: 'Navigation', screen: 'HIPAA Shield', icon: 'fa-shield-halved' }
    ];

    // Build items
    const navigationItems = activeRole === 'Professional' ? clinicianScreens : patientScreens;
    
    // Add patients to search if Professional
    const patientItems = activeRole === 'Professional' 
        ? patients.map(p => ({
            id: `patient-${p.id}`,
            name: `Patient: ${p.name} (${p.condition || 'General'})`,
            category: 'Patients',
            patientId: p.id,
            icon: 'fa-user'
        }))
        : [];

    const items = [...navigationItems, ...patientItems];

    // Filter items based on search
    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleSelect = useCallback((item) => {
        if (item.category === 'Navigation') {
            onNavigate(item.screen);
        } else if (item.category === 'Patients') {
            onSelectPatient(item.patientId);
            onNavigate('Dashboard'); // Go back to dashboard to view patient details
        }
        onClose();
    }, [onClose, onNavigate, onSelectPatient]);

    // Handle arrow keys and Enter
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    handleSelect(filteredItems[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredItems, handleSelect, isOpen, onClose, selectedIndex]);

    // Scroll selected item into view
    useEffect(() => {
        const activeEl = resultsRef.current?.querySelector('.command-item.selected');
        if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="command-palette-overlay" onClick={onClose}>
            <div 
                className="command-palette-modal" 
                onClick={(e) => e.stopPropagation()}
                id="app-command-palette"
            >
                <div className="command-input-container">
                    <i className="fa-solid fa-magnifying-glass command-search-icon"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search screens, patients, clinical actions..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setSelectedIndex(0);
                        }}
                        className="command-search-input"
                    />
                    <div className="command-kbd-hint">ESC</div>
                </div>

                <div className="command-results-container" ref={resultsRef}>
                    {filteredItems.length === 0 ? (
                        <div className="command-no-results">No matching commands or patients found.</div>
                    ) : (
                        filteredItems.map((item, idx) => {
                            const isSelected = idx === selectedIndex;
                            return (
                                <div
                                    key={item.id}
                                    className={`command-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSelect(item)}
                                >
                                    <div className="command-item-left">
                                        <i className={`fa-solid ${item.icon} command-item-icon`}></i>
                                        <span className="command-item-name">{item.name}</span>
                                    </div>
                                    <span className="command-item-category">{item.category}</span>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="command-palette-footer">
                    <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
                    <span><kbd>Enter</kbd> to select</span>
                    <span><kbd>Esc</kbd> to close</span>
                </div>
            </div>
        </div>
    );
}
