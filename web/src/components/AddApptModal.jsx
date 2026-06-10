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

    if (!isOpen) return null;

    return (
        <div className="modal-overlay-block active" id="add-appt-modal-overlay">
            <style>{`
                .patient-typeahead-list {
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 8px;
                    max-height: 110px;
                    overflow-y: auto;
                    margin-top: 6px;
                    padding: 4px;
                }
                .typeahead-item {
                    padding: 8px 12px;
                    font-size: 12px;
                    color: var(--text-normal);
                    cursor: pointer;
                    border-radius: 4px;
                    display: flex;
                    justify-content: space-between;
                }
                .typeahead-item:hover, .typeahead-item.selected {
                    background: var(--color-primary-glow);
                    color: var(--color-primary);
                }
            `}</style>

            <div className="modal-content-box" style={{ maxWidth: '450px' }}>
                <h3 className="modal-header-row">Schedule EHR Session</h3>
                
                {validationError && (
                    <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--color-error)', color: 'var(--color-error)', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
                        {validationError}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    {/* Patient search & type-ahead select */}
                    <div className="form-field-group">
                        <label className="form-label">Search & Select Patient:</label>
                        <input 
                            type="text" 
                            className="input-text-field"
                            placeholder="Type name to filter..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        <div className="patient-typeahead-list">
                            {filteredPatients.map(pat => (
                                <div 
                                    key={pat.id} 
                                    className={`typeahead-item ${selectedPatientId === pat.id ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelectedPatientId(pat.id);
                                        setSearchQuery(pat.name);
                                    }}
                                >
                                    <span>{pat.name}</span>
                                    <span style={{ fontSize: '10px', opacity: 0.6 }}>ID: #{pat.id}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Date and Time Pickers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                        <div className="form-field-group">
                            <label className="form-label">Session Date:</label>
                            <input 
                                type="date" 
                                className="input-text-field"
                                value={dateVal}
                                onChange={(e) => setDateVal(e.target.value)}
                            />
                        </div>
                        <div className="form-field-group">
                            <label className="form-label">Start Time:</label>
                            <input 
                                type="time" 
                                className="input-text-field"
                                value={timeVal}
                                onChange={(e) => setTimeVal(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Agenda notes */}
                    <div className="form-field-group">
                        <label className="form-label">Therapy Notes Agenda:</label>
                        <input 
                            type="text" 
                            className="input-text-field"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Primary focus of session..."
                        />
                    </div>

                    {/* Fee setting */}
                    <div className="form-field-group">
                        <label className="form-label">Session Fee (USD):</label>
                        <input 
                            type="text" 
                            className="input-text-field"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            placeholder="150.00"
                        />
                    </div>

                    {/* Video toggle */}
                    <div className="checkbox-option-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            className="checkbox-control" 
                            id="add-appt-video-checkbox" 
                            checked={isVideo}
                            onChange={(e) => setIsVideo(e.target.checked)}
                            style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <label className="checkbox-label" htmlFor="add-appt-video-checkbox" style={{ fontSize: '12px', cursor: 'pointer' }}>
                            Connect as Secure HIPAA Telehealth Chamber
                        </label>
                    </div>

                    <div className="modal-actions-panel" style={{ marginTop: '10px' }}>
                        <button type="button" className="action-button-btn secondary" onClick={onClose}>Dismiss</button>
                        <button type="submit" className="action-button-btn">Insert Schedule</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
