import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Database } from '../services/db';

export function AddApptModal({ isOpen, onClose, onSubmit }) {
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Proper date/time inputs
    const [dateVal, setDateVal] = useState('');
    const [timeVal, setTimeVal] = useState('10:00');
    const [notes, setNotes] = useState('Weekly clinical review & cognitive restructuring.');
    const [fee, setFee] = useState('150.00');
    const [isVideo, setIsVideo] = useState(true);

    // Validation state
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const list = Database.getPatients();
            setPatients(list);
            if (list.length > 0) {
                setSelectedPatientId(list[0].id);
            }
            // Default date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const yyyy = tomorrow.getFullYear();
            const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const dd = String(tomorrow.getDate()).padStart(2, '0');
            setDateVal(`${yyyy}-${mm}-${dd}`);
            setValidationError('');
        }
    }, [isOpen]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredPatients = patients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        setValidationError('');

        if (!selectedPatientId) {
            setValidationError("Please select a target patient.");
            return;
        }
        if (!dateVal || !timeVal) {
            setValidationError("Please enter a valid date and time.");
            return;
        }
        if (!notes.trim()) {
            setValidationError("Please enter a session focus/agenda.");
            return;
        }
        if (isNaN(Number(fee)) || Number(fee) <= 0) {
            setValidationError("Please enter a valid session fee amount.");
            return;
        }

        const selectedPatient = patients.find(p => p.id === Number(selectedPatientId));
        if (!selectedPatient) return;

        // Parse date and time into a readable clinical string
        // E.g. "Tomorrow, 11:30 AM" or "10 Jun, 03:00 PM"
        const now = new Date();
        const apptDate = new Date(`${dateVal}T${timeVal}`);
        
        let dateString;
        const diffTime = apptDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const formattedTime = apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (apptDate.toDateString() === now.toDateString()) {
            dateString = `Today, ${formattedTime}`;
        } else if (diffDays === 1) {
            dateString = `Tomorrow, ${formattedTime}`;
        } else {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            dateString = `${apptDate.getDate()} ${months[apptDate.getMonth()]}, ${formattedTime}`;
        }

        Database.insertAppointment({
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            dateTime: dateString,
            notes: notes,
            isVideo: isVideo,
            fee: Number(fee)
        });

        if (onSubmit) onSubmit();
        onClose();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div 
                                className="modal-overlay-block active fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                                id="add-appt-modal-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Dialog.Content asChild>
                                    <motion.div 
                                        className="modal-content-box bg-slate-900 border border-white/10 rounded-lg p-6 w-full max-w-[450px] shadow-2xl relative text-slate-100"
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.95, opacity: 0 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                    >
                                        <Dialog.Title asChild>
                                            <h3 className="modal-header-row text-lg font-bold text-slate-100 border-b border-white/5 pb-3 mb-4">
                                                Schedule EHR Session
                                            </h3>
                                        </Dialog.Title>
                                        
                                        {validationError && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md text-xs mb-4 flex items-center gap-2">
                                                <i className="fa-solid fa-triangle-exclamation"></i>
                                                {validationError}
                                            </div>
                                        )}

                                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                            {/* Patient search & type-ahead select */}
                                            <div className="form-field-group flex flex-col gap-1.5">
                                                <label className="form-label text-xs font-semibold text-slate-400">Search & Select Patient:</label>
                                                <input 
                                                    type="text" 
                                                    className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 placeholder-slate-500 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 px-3 py-2 rounded-md outline-none text-sm transition-all"
                                                    placeholder="Type name to filter..."
                                                    value={searchQuery}
                                                    onChange={handleSearchChange}
                                                />
                                                <div className="patient-typeahead-list bg-black/30 border border-white/5 rounded-lg max-h-[110px] overflow-y-auto mt-1 p-1 flex flex-col gap-0.5">
                                                    {filteredPatients.map(pat => (
                                                        <div 
                                                            key={pat.id} 
                                                            className={`typeahead-item px-3 py-2 text-xs cursor-pointer rounded flex justify-between transition-colors ${selectedPatientId === pat.id ? 'bg-primary/20 text-primary font-medium' : 'text-slate-300 hover:bg-white/5'}`}
                                                            onClick={() => {
                                                                setSelectedPatientId(pat.id);
                                                                setSearchQuery(pat.name);
                                                            }}
                                                        >
                                                            <span>{pat.name}</span>
                                                            <span className="text-[10px] opacity-60">ID: #{pat.id}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Date and Time Pickers */}
                                            <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
                                                <div className="form-field-group flex flex-col gap-1.5">
                                                    <label className="form-label text-xs font-semibold text-slate-400">Session Date:</label>
                                                    <input 
                                                        type="date" 
                                                        className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 px-3 py-2 rounded-md outline-none text-sm focus:border-primary/50 transition-all"
                                                        value={dateVal}
                                                        onChange={(e) => setDateVal(e.target.value)}
                                                    />
                                                </div>
                                                <div className="form-field-group flex flex-col gap-1.5">
                                                    <label className="form-label text-xs font-semibold text-slate-400">Start Time:</label>
                                                    <input 
                                                        type="time" 
                                                        className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 px-3 py-2 rounded-md outline-none text-sm focus:border-primary/50 transition-all"
                                                        value={timeVal}
                                                        onChange={(e) => setTimeVal(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Agenda notes */}
                                            <div className="form-field-group flex flex-col gap-1.5">
                                                <label className="form-label text-xs font-semibold text-slate-400">Therapy Notes Agenda:</label>
                                                <input 
                                                    type="text" 
                                                    className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 placeholder-slate-500 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 px-3 py-2 rounded-md outline-none text-sm transition-all"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder="Primary focus of session..."
                                                />
                                            </div>

                                            {/* Fee setting */}
                                            <div className="form-field-group flex flex-col gap-1.5">
                                                <label className="form-label text-xs font-semibold text-slate-400">Session Fee (USD):</label>
                                                <input 
                                                    type="text" 
                                                    className="input-text-field w-full bg-black/40 border border-white/10 text-slate-100 placeholder-slate-500 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 px-3 py-2 rounded-md outline-none text-sm transition-all"
                                                    value={fee}
                                                    onChange={(e) => setFee(e.target.value)}
                                                    placeholder="150.00"
                                                />
                                            </div>

                                            {/* Video toggle */}
                                            <div className="checkbox-option-row flex items-center gap-2 cursor-pointer py-1">
                                                <input 
                                                    type="checkbox" 
                                                    className="checkbox-control cursor-pointer" 
                                                    id="add-appt-video-checkbox" 
                                                    checked={isVideo}
                                                    onChange={(e) => setIsVideo(e.target.checked)}
                                                    style={{ accentColor: 'var(--color-primary)' }}
                                                />
                                                <label className="checkbox-label text-xs text-slate-300 cursor-pointer select-none" htmlFor="add-appt-video-checkbox">
                                                    Connect as Secure HIPAA Telehealth Chamber
                                                </label>
                                            </div>

                                            <div className="modal-actions-panel flex justify-end gap-3 mt-4 pt-3 border-t border-white/5">
                                                <button 
                                                    type="button" 
                                                    className="action-button-btn secondary px-4 py-2 text-sm font-semibold rounded-md border border-white/10 text-slate-300 hover:bg-white/5 transition-all" 
                                                    onClick={onClose}
                                                >
                                                    Dismiss
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="action-button-btn px-4 py-2 text-sm font-semibold rounded-md bg-primary text-black hover:bg-primary/95 transition-all"
                                                >
                                                    Insert Schedule
                                                </button>
                                            </div>
                                        </form>
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
