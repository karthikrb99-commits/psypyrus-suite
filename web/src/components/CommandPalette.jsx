import * as Dialog from '@radix-ui/react-dialog';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
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
        { id: 'intake', name: 'Digital Intake Forms & Consent Hub', category: 'Navigation', screen: 'Intake Forms', icon: 'fa-file-signature' },
        { id: 'analytics', name: 'Performance & Billing Analytics', category: 'Navigation', screen: 'Analytics', icon: 'fa-chart-line' },
        { id: 'marketplace', name: 'PsyPyrus Marketplace', category: 'Navigation', screen: 'Marketplace', icon: 'fa-shop' },
        { id: 'rdoc', name: 'NIMH RDoC Matrix Explorer & Biosignature Workspace', category: 'Navigation', screen: 'RDoC Matrix', icon: 'fa-dna' },
        { id: 'hipaa', name: 'HIPAA Security & Audit Shield', category: 'Navigation', screen: 'HIPAA Shield', icon: 'fa-user-shield' },
    ];

    const patientScreens = [
        { id: 'p-dashboard', name: 'Patient Dashboard', category: 'Navigation', screen: 'Dashboard', icon: 'fa-house-medical' },
        { id: 'p-wellness', name: 'Wellness Lounge', category: 'Navigation', screen: 'Wellness', icon: 'fa-spa' },
        { id: 'p-assessments', name: 'Patient Assessments', category: 'Navigation', screen: 'Assessments', icon: 'fa-file-invoice' },
        { id: 'p-intake', name: 'Intake Forms & Permissions', category: 'Navigation', screen: 'Intake Forms', icon: 'fa-file-signature' },
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

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div 
                                className="command-palette-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[15vh] p-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Dialog.Content asChild>
                                    <motion.div 
                                        className="command-palette-modal bg-slate-950 border border-white/10 rounded-lg shadow-2xl w-full max-w-[550px] overflow-hidden flex flex-col"
                                        id="app-command-palette"
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.95, opacity: 0 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                    >
                                        <div className="command-input-container flex items-center gap-3 px-4 py-3 border-b border-white/10">
                                            <i className="fa-solid fa-magnifying-glass command-search-icon text-slate-400"></i>
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                placeholder="Search screens, patients, clinical actions..."
                                                value={search}
                                                onChange={(e) => {
                                                    setSearch(e.target.value);
                                                    setSelectedIndex(0);
                                                }}
                                                className="command-search-input bg-transparent text-slate-100 placeholder-slate-500 outline-none flex-1 text-sm"
                                                autoFocus
                                            />
                                            <div className="command-kbd-hint text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded uppercase font-mono">ESC</div>
                                        </div>

                                        <ScrollArea.Root className="overflow-hidden flex flex-col max-h-[300px]">
                                            <ScrollArea.Viewport className="w-full max-h-[300px]" ref={resultsRef}>
                                                <div className="p-2 flex flex-col gap-0.5">
                                                    {filteredItems.length === 0 ? (
                                                        <div className="command-no-results px-4 py-6 text-center text-sm text-slate-500">No matching commands or patients found.</div>
                                                    ) : (
                                                        filteredItems.map((item, idx) => {
                                                            const isSelected = idx === selectedIndex;
                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    className={`command-item flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer text-sm transition-colors ${isSelected ? 'selected bg-primary/20 text-primary font-medium' : 'text-slate-300 hover:bg-white/5'}`}
                                                                    onClick={() => handleSelect(item)}
                                                                >
                                                                    <div className="command-item-left flex items-center gap-3">
                                                                        <i className={`fa-solid ${item.icon} command-item-icon text-slate-400 ${isSelected ? 'text-primary' : ''}`}></i>
                                                                        <span className="command-item-name">{item.name}</span>
                                                                    </div>
                                                                    <span className="command-item-category text-xs text-slate-500">{item.category}</span>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </ScrollArea.Viewport>
                                            <ScrollArea.Scrollbar className="flex select-none touch-none p-0.5 bg-black/10 transition-colors w-1.5" orientation="vertical">
                                                <ScrollArea.Thumb className="flex-1 bg-white/20 rounded-full" />
                                            </ScrollArea.Scrollbar>
                                        </ScrollArea.Root>

                                        <div className="command-palette-footer flex justify-between items-center px-4 py-2.5 bg-slate-900/50 border-t border-white/5 text-[11px] text-slate-500">
                                            <span>Use <kbd className="bg-white/5 px-1 py-0.5 rounded">↑</kbd> <kbd className="bg-white/5 px-1 py-0.5 rounded">↓</kbd> to navigate</span>
                                            <span><kbd className="bg-white/5 px-1 py-0.5 rounded">Enter</kbd> to select</span>
                                            <span><kbd className="bg-white/5 px-1 py-0.5 rounded">Esc</kbd> to close</span>
                                        </div>
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
