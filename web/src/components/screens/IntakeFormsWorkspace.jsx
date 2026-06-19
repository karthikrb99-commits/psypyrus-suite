import { useState, useEffect, useRef } from 'react';
import { Database } from '../../services/db';
import { INTAKE_FORMS_SCHEMAS } from '../../services/intakeFormsSchema';
import { useToast } from '../ToastProvider';

export function IntakeFormsWorkspace({
    patients = [],
    activePatientId = 1,
    activeRole = 'Professional',
    onSetActivePatientId
}) {
    const [selectedFormKey, setSelectedFormKey] = useState(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [formData, setFormData] = useState({});
    const [submissionHistory, setSubmissionHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('gallery'); // 'gallery', 'history'
    const [selectedCompletedForm, setSelectedCompletedForm] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [validationError, setValidationError] = useState('');

    const { showToast } = useToast();

    // ABHA / ABDM Integration State
    const [abhaModalType, setAbhaModalType] = useState(null); // 'link', 'generate', or null
    const [abhaInput, setAbhaInput] = useState('');
    const [abhaAddressInput, setAbhaAddressInput] = useState('');
    const [aadhaarInput, setAadhaarInput] = useState('');
    const [mobileInput, setMobileInput] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [showAbhaCard, setShowAbhaCard] = useState(false);
    const [abhaCardData, setAbhaCardData] = useState(null);

    // ABHA Handlers
    const handleOpenLinkAbha = () => {
        setAbhaInput('');
        setAbhaAddressInput('');
        setOtpSent(false);
        setOtpInput('');
        setValidationError('');
        setAbhaModalType('link');
    };

    const handleOpenGenerateAbha = () => {
        setAadhaarInput('');
        setMobileInput('');
        setOtpSent(false);
        setOtpInput('');
        setValidationError('');
        setAbhaModalType('generate');
    };

    const handleSendAbhaOtp = () => {
        if (abhaModalType === 'link') {
            if (!abhaInput && !abhaAddressInput) {
                showToast("Please enter either an ABHA Number or ABHA Address.", "error");
                return;
            }
            if (abhaInput && !/^\d{2}-\d{4}-\d{4}-\d{4}$/.test(abhaInput) && !/^\d{14}$/.test(abhaInput)) {
                showToast("Please enter a valid 14-digit ABHA Number (e.g. 91-2345-6789-0123).", "error");
                return;
            }
            if (abhaAddressInput && !abhaAddressInput.includes('@')) {
                showToast("ABHA Address must contain '@' (e.g., username@abdm).", "error");
                return;
            }
        } else {
            if (!aadhaarInput && !mobileInput) {
                showToast("Please enter Aadhaar or Mobile Number.", "error");
                return;
            }
            if (aadhaarInput && !/^\d{12}$/.test(aadhaarInput.replace(/\s/g, ''))) {
                showToast("Please enter a valid 12-digit Aadhaar Number.", "error");
                return;
            }
            if (mobileInput && !/^\d{10}$/.test(mobileInput.trim())) {
                showToast("Please enter a valid 10-digit Mobile Number.", "error");
                return;
            }
        }
        setOtpSent(true);
        setOtpInput('');
        showToast("Mock OTP successfully dispatched to Aadhaar-linked mobile xxxxx-xxx72.", "success");
    };

    const handleVerifyAbhaOtp = () => {
        if (!otpInput || otpInput.trim().length !== 6) {
            showToast("Please enter a valid 6-digit verification OTP.", "error");
            return;
        }

        // Format ABHA number
        let rawAbhaNo = abhaInput.replace(/\D/g, '');
        if (rawAbhaNo.length !== 14) {
            // Generate a random one if registering
            rawAbhaNo = "91" + Math.floor(100000000000 + Math.random() * 900000000000);
        }
        const formattedAbhaNo = `${rawAbhaNo.substring(0,2)}-${rawAbhaNo.substring(2,6)}-${rawAbhaNo.substring(6,10)}-${rawAbhaNo.substring(10,14)}`;
        
        // Format ABHA Address
        const cleanName = activePatient.name.toLowerCase().replace(/\s+/g, '.');
        const formattedAbhaAddr = abhaAddressInput || `${cleanName}@abdm`;

        // Update database patient record
        Database.updatePatient(activePatient.id, {
            abhaNumber: formattedAbhaNo,
            abhaAddress: formattedAbhaAddr
        });

        // Fill form fields
        setFormData(prev => ({
            ...prev,
            abha_number: formattedAbhaNo,
            abha_address: formattedAbhaAddr,
            name: activePatient.name,
            birth_date: prev.birth_date || "1997-05-12",
            age: activePatient.age,
            gender: activePatient.gender,
            email: activePatient.email,
            home_phone: activePatient.phone
        }));

        // Log audit
        Database.logAudit("ABHA ID Verification", `Successfully verified and linked ABHA ID ${formattedAbhaNo} to patient ${activePatient.name}`);

        // Show ABHA Card if newly generated
        if (abhaModalType === 'generate') {
            setAbhaCardData({
                name: activePatient.name,
                abhaNumber: formattedAbhaNo,
                abhaAddress: formattedAbhaAddr,
                gender: activePatient.gender,
                dob: "12/05/1997",
                mobile: activePatient.phone
            });
            setShowAbhaCard(true);
        }

        setAbhaModalType(null);
        setOtpSent(false);
        setOtpInput('');
        showToast("ABHA ID verified and linked successfully!", "success");
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: 'psypyrus_patients' } }));
    };

    // Active patient helper
    const activePatient = patients.find(p => p.id === Number(activePatientId)) || patients[0];

    // Canvas Signature Refs
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [useTypeSignature, setUseTypeSignature] = useState(false);
    const [typedSigName, setTypedSigName] = useState('');

    // Fetch History on Mount and Active Patient Change
    useEffect(() => {
        refreshHistory();
    }, [activePatientId, activeTab]);

    const refreshHistory = () => {
        if (activePatientId) {
            const history = Database.getIntakeForms(activePatientId);
            setSubmissionHistory(history);
        }
    };

    // Prefill form data when a form is selected
    const handleSelectForm = (key) => {
        setSelectedFormKey(key);
        setCurrentPageIndex(0);
        setValidationError('');
        setHasSignature(false);
        setUseTypeSignature(false);
        setTypedSigName('');

        // Initialize form fields with prefill defaults from active patient
        const schema = INTAKE_FORMS_SCHEMAS[key];
        const initialData = {};

        schema.pages.forEach(page => {
            page.fields.forEach(field => {
                if (field.defaultValue !== undefined) {
                    initialData[field.id] = field.defaultValue;
                }
                if (field.prefill && activePatient) {
                    if (field.prefill === 'name') initialData[field.id] = activePatient.name;
                    if (field.prefill === 'email') initialData[field.id] = activePatient.email;
                    if (field.prefill === 'phone') initialData[field.id] = activePatient.phone;
                    if (field.prefill === 'age') initialData[field.id] = activePatient.age;
                    if (field.prefill === 'gender') initialData[field.id] = activePatient.gender;
                }
                if (field.type === 'checkbox') {
                    initialData[field.id] = [];
                }
            });
        });

        setFormData(initialData);
    };

    // Check if field is visible based on conditional schema rules
    const isFieldVisible = (field) => {
        if (!field.condition) return true;
        const targetValue = formData[field.condition.field];
        if (Array.isArray(field.condition.value)) {
            return field.condition.value.includes(targetValue);
        }
        return targetValue === field.condition.value;
    };

    // Handle standard field edits
    const handleFieldChange = (fieldId, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    // Handle multi-select checkboxes
    const handleCheckboxChange = (fieldId, option, checked) => {
        const currentVals = formData[fieldId] || [];
        let nextVals;
        if (checked) {
            nextVals = [...currentVals, option];
        } else {
            nextVals = currentVals.filter(v => v !== option);
        }
        handleFieldChange(fieldId, nextVals);
    };

    // Signature drawing canvas helpers
    const getCoordinates = (e) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Support touch coordinates
        if (e.touches && e.touches[0]) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        const coords = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#f9fafb'; // Light trace matching text color
        isDrawingRef.current = true;
    };

    const draw = (e) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const coords = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
    };

    const clearSignature = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        setValidationError('');
    };

    // Navigation and validation
    const handleNextPage = () => {
        const schema = INTAKE_FORMS_SCHEMAS[selectedFormKey];
        const currentPage = schema.pages[currentPageIndex];

        // Validate visible required fields on the current page
        for (const field of currentPage.fields) {
            if (isFieldVisible(field) && field.required) {
                const val = formData[field.id];
                if (field.type === 'signature') {
                    if (useTypeSignature) {
                        if (!typedSigName.trim()) {
                            setValidationError("Digital typed signature name is required.");
                            return;
                        }
                    } else if (!hasSignature) {
                        setValidationError("Handwritten drawing signature is required.");
                        return;
                    }
                } else if (field.type === 'checkbox') {
                    if (!val || val.length === 0) {
                        setValidationError(`Field "${field.label}" requires at least one selection.`);
                        return;
                    }
                } else if (val === undefined || val === null || String(val).trim() === '') {
                    setValidationError(`Field "${field.label}" is required.`);
                    return;
                }
            }
        }

        setValidationError('');

        // Move to next page or submit if on last page
        if (currentPageIndex < schema.pages.length - 1) {
            setCurrentPageIndex(prev => prev + 1);
            // Re-render canvas if next page has a signature canvas
            setTimeout(() => {
                if (canvasRef.current) {
                    clearSignature();
                }
            }, 100);
        } else {
            handleSubmitForm();
        }
    };

    const handleBackPage = () => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
            setValidationError('');
        }
    };

    const handleSubmitForm = () => {
        const schema = INTAKE_FORMS_SCHEMAS[selectedFormKey];
        let finalSignature = null;

        // Process signature field if present
        const hasSigField = schema.pages.some(p => p.fields.some(f => f.type === 'signature'));
        if (hasSigField) {
            if (useTypeSignature) {
                finalSignature = { type: 'typed', name: typedSigName };
            } else if (canvasRef.current) {
                finalSignature = { type: 'drawn', dataUrl: canvasRef.current.toDataURL() };
            }
        }

        const completedDoc = {
            patientId: Number(activePatientId),
            patientName: activePatient?.name || 'Liam Carter',
            formKey: selectedFormKey,
            formTitle: schema.title,
            category: schema.category,
            responses: {
                ...formData,
                signature: finalSignature
            }
        };

        Database.insertIntakeForm(completedDoc);
        alert(`Form "${schema.title}" logged successfully and secured in EHR data vaults.`);
        setSelectedFormKey(null);
        setActiveTab('history');
        refreshHistory();
    };

    const handleDeleteCompletedForm = (id) => {
        if (confirm("Are you sure you want to delete this completed intake form? This action is recorded in compliance audit trails.")) {
            Database.deleteIntakeForm(id);
            refreshHistory();
            if (selectedCompletedForm?.id === id) {
                setSelectedCompletedForm(null);
            }
        }
    };

    const handlePrintForm = () => {
        window.print();
    };

    // Filter available forms based on search query
    const availableForms = Object.entries(INTAKE_FORMS_SCHEMAS).filter(([key, schema]) =>
        schema.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schema.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="screen-container active" id="screen-intake-forms">
            <style>{`
                .intake-workspace-grid {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 24px;
                    margin-top: 16px;
                }
                @media (max-width: 768px) {
                    .intake-workspace-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .forms-category-list {
                    background: rgba(17, 24, 39, 0.4);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    align-self: start;
                }
                .category-sidebar-btn {
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: var(--radius-sm);
                    color: var(--color-text-secondary);
                    padding: 10px 14px;
                    text-align: left;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all var(--transition-fast);
                }
                .category-sidebar-btn:hover {
                    background: rgba(255, 255, 255, 0.03);
                    color: var(--color-text-primary);
                }
                .category-sidebar-btn.active {
                    background: var(--color-primary-container);
                    color: var(--color-on-primary-container);
                    border-color: var(--color-primary);
                }
                .form-wizard-card {
                    background: rgba(17, 24, 39, 0.45);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 30px;
                    backdrop-filter: blur(16px);
                }
                .form-field-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                    margin-top: 20px;
                }
                .form-field-full {
                    grid-column: span 2;
                }
                @media (max-width: 576px) {
                    .form-field-grid {
                        grid-template-columns: 1fr;
                    }
                    .form-field-full {
                        grid-column: span 1;
                    }
                }
                .form-progress-indicator {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    border-bottom: 1px solid var(--color-border);
                    padding-bottom: 16px;
                }
                .signature-pad-container {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .sig-canvas-frame {
                    background: #111827;
                    border: 1.5px dashed rgba(255, 255, 255, 0.15);
                    border-radius: var(--radius-sm);
                    cursor: crosshair;
                    width: 100%;
                    height: 150px;
                    touch-action: none;
                }
                .completed-reports-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 16px;
                }
                .report-history-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    padding: 16px;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 120px;
                }
                .report-history-card:hover {
                    background: rgba(6, 182, 212, 0.04);
                    border-color: rgba(6, 182, 212, 0.2);
                    transform: translateY(-2px);
                }
                .report-print-view {
                    background: #fff;
                    color: #111827;
                    border-radius: var(--radius-md);
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    font-family: 'Inter', sans-serif;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }
                .print-field-row {
                    display: flex;
                    border-bottom: 1px solid #e5e7eb;
                    padding: 10px 0;
                }
                .print-field-label {
                    width: 250px;
                    font-weight: 600;
                    color: #4b5563;
                }
                .print-field-value {
                    flex-grow: 1;
                    color: #111827;
                }
                .print-instructions {
                    background: #f3f4f6;
                    padding: 16px;
                    border-radius: 6px;
                    margin-bottom: 24px;
                    font-size: 13px;
                    line-height: 1.5;
                    color: #374151;
                    border-left: 4px solid #0891b2;
                }
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #screen-intake-forms, #screen-intake-forms * {
                        visibility: hidden;
                    }
                    .report-print-view, .report-print-view * {
                        visibility: visible;
                    }
                    .report-print-view {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        box-shadow: none;
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="section-header-block no-print">
                <i className="fa-solid fa-file-signature"></i>
                <h2>Digitized Intake & Consent Forms Workspace</h2>
            </div>

            {/* Print View Preview Layer */}
            {selectedCompletedForm && (
                <div className="report-print-container" style={{ margin: '20px 0' }}>
                    <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '16px', justifyContent: 'space-between' }}>
                        <button className="action-button-btn secondary-btn" onClick={() => setSelectedCompletedForm(null)}>
                            <i className="fa-solid fa-arrow-left"></i> Return to List
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="action-button-btn secondary-btn" onClick={handlePrintForm}>
                                <i className="fa-solid fa-print"></i> Print Document
                            </button>
                            {activeRole !== 'Patient' && (
                                <button className="action-button-btn danger-btn" onClick={() => handleDeleteCompletedForm(selectedCompletedForm.id)}>
                                    <i className="fa-solid fa-trash-can"></i> Void Document
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Print Sheet Document */}
                    <div className="report-print-view">
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '16px', marginBottom: '24px' }}>
                            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px', textTransform: 'uppercase', color: '#0891b2' }}>PsyPyrus EHR System Document</h2>
                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0 0', fontFamily: 'monospace' }}>SECURED CLINICAL RECORD // COMPLIANCE INTEGRITY STANDARD v2.0</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                            <div>
                                <strong>Document Title:</strong> {selectedCompletedForm.formTitle} <br />
                                <strong>Category:</strong> {selectedCompletedForm.category}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <strong>Patient Target:</strong> {selectedCompletedForm.patientName} (ID: {selectedCompletedForm.patientId}) <br />
                                <strong>Date Filed:</strong> {new Date(selectedCompletedForm.date).toLocaleString()}
                            </div>
                        </div>

                        {/* Renders each response row based on form key structure */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                            {(() => {
                                const schema = INTAKE_FORMS_SCHEMAS[selectedCompletedForm.formKey];
                                if (!schema) return <p>Schema not found.</p>;

                                return schema.pages.map((page, pIdx) => (
                                    <div key={pIdx} style={{ marginTop: '16px' }}>
                                        <h3 style={{ borderBottom: '1.5px solid #0891b2', paddingBottom: '6px', fontSize: '14px', color: '#0891b2', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                                            {page.title}
                                        </h3>
                                        {page.fields.map((field) => {
                                            const val = selectedCompletedForm.responses[field.id];
                                            if (field.type === 'instructions') {
                                                return (
                                                    <div key={field.id} className="print-instructions">
                                                        <strong>{field.label}:</strong> {field.text}
                                                    </div>
                                                );
                                            }

                                            // Formatting outputs
                                            let displayVal = val;
                                            if (field.type === 'signature' && val) {
                                                displayVal = val.type === 'typed' 
                                                    ? `/Typed Signature/ ${val.name}` 
                                                    : <img src={val.dataUrl} alt="E-Signature" style={{ maxHeight: '60px', borderBottom: '1px solid #ccc' }} />;
                                            } else if (Array.isArray(val)) {
                                                displayVal = val.length > 0 ? val.join(', ') : 'None selected';
                                            } else if (val === undefined || val === null || val === '') {
                                                displayVal = 'N/A';
                                            }

                                            return (
                                                <div key={field.id} className="print-field-row">
                                                    <span className="print-field-label">{field.label}</span>
                                                    <span className="print-field-value">{displayVal}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ));
                            })()}
                        </div>

                        <div style={{ marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '16px', fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                            This document is securely signed and stored inside PsyPyrus Cryptographic Local Vault. Compliance: HIPAA Sec. 164.312.
                        </div>
                    </div>
                </div>
            )}

            {/* Standard Catalog and Wizard UI */}
            {!selectedCompletedForm && (
                <div className="intake-workspace-grid no-print">
                    
                    {/* Navigation Tab & Patient Select Sidebar */}
                    <div className="forms-category-list">
                        <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Workspace Panel</span>
                        </div>
                        <button 
                            className={`category-sidebar-btn ${activeTab === 'gallery' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('gallery');
                                setSelectedFormKey(null);
                            }}
                        >
                            <i className="fa-solid fa-list-check"></i>
                            <span>Forms Library</span>
                        </button>
                        <button 
                            className={`category-sidebar-btn ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('history');
                                setSelectedFormKey(null);
                            }}
                        >
                            <i className="fa-solid fa-clock-rotate-left"></i>
                            <span>Completed Files</span>
                        </button>

                        {activeRole !== 'Patient' && (
                            <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                                <label className="form-label" style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>EHR Patient Target</label>
                                <select 
                                    className="input-text-field"
                                    value={activePatientId}
                                    onChange={(e) => onSetActivePatientId(Number(e.target.value))}
                                    style={{ margin: 0, padding: '8px', fontSize: '12px' }}
                                >
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Active Screen Area */}
                    <div className="main-content-area">

                        {/* Catalog Gallery view */}
                        {activeTab === 'gallery' && !selectedFormKey && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                                        Browse the clinic forms dictionary to initialize, paginate, and sign EHR logs:
                                    </p>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        style={{ margin: 0, padding: '6px 12px', width: '200px', fontSize: '12px' }}
                                        placeholder="Search forms..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                    {availableForms.map(([key, schema]) => (
                                        <div 
                                            key={key} 
                                            className="workspace-card" 
                                            style={{ cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}
                                            onClick={() => handleSelectForm(key)}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-primary)' }}>{schema.category}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}><i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>{schema.timeEstimation}</span>
                                                </div>
                                                <h3 style={{ fontSize: '15px', color: 'var(--color-text-primary)', margin: '4px 0 8px 0', fontWeight: 'bold' }}>{schema.title}</h3>
                                                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: 0 }}>{schema.description}</p>
                                            </div>
                                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '12px', fontSize: '11px', color: 'var(--color-primary)', textAlign: 'right', fontWeight: 600 }}>
                                                Begin Questionnaire <i className="fa-solid fa-circle-arrow-right" style={{ marginLeft: '4px' }}></i>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Completed Forms History Log */}
                        {activeTab === 'history' && !selectedFormKey && (
                            <div className="workspace-card">
                                <div className="card-title-bar">
                                    <h3>Intake Document Vault ({activePatient?.name})</h3>
                                </div>
                                {submissionHistory.length === 0 ? (
                                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                                        No signed intake documents filed for this patient record.
                                    </div>
                                ) : (
                                    <div className="completed-reports-grid">
                                        {submissionHistory.slice().reverse().map(doc => (
                                            <div 
                                                key={doc.id} 
                                                className="report-history-card"
                                                onClick={() => setSelectedCompletedForm(doc)}
                                            >
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                        <span style={{ fontSize: '9px', fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', color: 'var(--color-secondary)', padding: '2px 6px', borderRadius: '4px' }}>{doc.category}</span>
                                                        <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>ID: #{doc.id}</span>
                                                    </div>
                                                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-primary)' }}>{doc.formTitle}</strong>
                                                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Filed: {new Date(doc.date).toLocaleDateString()}</span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-primary)', textAlign: 'right', fontWeight: 'bold', marginTop: '12px' }}>
                                                    View & Print <i className="fa-solid fa-chevron-right" style={{ marginLeft: '2px' }}></i>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Interactive Form Wizard */}
                        {selectedFormKey && (
                            <div className="form-wizard-card">
                                {(() => {
                                    const schema = INTAKE_FORMS_SCHEMAS[selectedFormKey];
                                    const currentPage = schema.pages[currentPageIndex];
                                    const progressPercent = Math.round(((currentPageIndex + 1) / schema.pages.length) * 100);

                                    return (
                                        <>
                                            {/* Progress indicator */}
                                            <div className="form-progress-indicator">
                                                <div>
                                                    <button className="patient-filter-chip active" style={{ margin: 0, padding: '4px 10px', fontSize: '11px' }} onClick={() => setSelectedFormKey(null)}>
                                                        <i className="fa-solid fa-chevron-left" style={{ marginRight: '6px' }}></i> Exit Form
                                                    </button>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                                        Form Progress: {currentPageIndex + 1} of {schema.pages.length} Pages ({progressPercent}%)
                                                    </span>
                                                    <div style={{ width: '150px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
                                                        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.2s' }}></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                                                {schema.title}
                                            </h3>
                                            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '20px' }}>
                                                Active Section: <strong>{currentPage.title}</strong>
                                            </p>

                                            {/* Validation alert bar */}
                                            {validationError && (
                                                <div className="hipaa-alert-box error" style={{ marginBottom: '20px', padding: '10px 14px' }}>
                                                    <i className="fa-solid fa-triangle-exclamation"></i>
                                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{validationError}</span>
                                                </div>
                                            )}

                                            {/* ABDM ABHA Integration Panel */}
                                            {currentPageIndex === 0 && (
                                                <div className="abha-integration-panel" style={{
                                                    background: 'rgba(16, 185, 129, 0.04)',
                                                    border: '1px dashed rgba(16, 185, 129, 0.3)',
                                                    borderRadius: '8px',
                                                    padding: '16px',
                                                    marginBottom: '20px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <i className="fa-solid fa-address-card" style={{ color: '#10b981', fontSize: '18px' }}></i>
                                                            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-primary)' }}>ABDM - Ayushman Bharat Health Account</h4>
                                                        </div>
                                                        {activePatient.abhaNumber ? (
                                                            <span className="badge success" style={{
                                                                background: 'rgba(16, 185, 129, 0.1)',
                                                                color: '#10b981',
                                                                fontSize: '11px',
                                                                padding: '3px 8px',
                                                                borderRadius: '12px',
                                                                fontWeight: 600,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                <i className="fa-solid fa-circle-check"></i> ABHA Linked
                                                            </span>
                                                        ) : (
                                                            <span className="badge warning" style={{
                                                                background: 'rgba(245, 158, 11, 0.1)',
                                                                color: '#f59e0b',
                                                                fontSize: '11px',
                                                                padding: '3px 8px',
                                                                borderRadius: '12px',
                                                                fontWeight: 600
                                                            }}>
                                                                Not Linked
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {activePatient.abhaNumber ? (
                                                        <div>
                                                            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
                                                                This client profile is linked to the national registry. Demographics are synced with the ABDM network.
                                                            </p>
                                                            <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
                                                                <div>
                                                                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>ABHA Number:</span>
                                                                    <strong style={{ color: 'var(--color-text-primary)' }}>{activePatient.abhaNumber}</strong>
                                                                </div>
                                                                <div>
                                                                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>ABHA Address:</span>
                                                                    <strong style={{ color: 'var(--color-text-primary)' }}>{activePatient.abhaAddress}</strong>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                className="preset-duration-btn" 
                                                                onClick={() => {
                                                                    setAbhaCardData({
                                                                        name: activePatient.name,
                                                                        abhaNumber: activePatient.abhaNumber,
                                                                        abhaAddress: activePatient.abhaAddress,
                                                                        gender: activePatient.gender,
                                                                        dob: "12/05/1997",
                                                                        mobile: activePatient.phone
                                                                    });
                                                                    setShowAbhaCard(true);
                                                                }}
                                                                style={{ fontSize: '11px', padding: '4px 8px' }}
                                                            >
                                                                <i className="fa-solid fa-id-card"></i> View ABHA Health Card
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
                                                                Instantly retrieve verified patient demographics and allow secure clinical record sharing via the official ABDM gateway.
                                                            </p>
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <button 
                                                                    className="action-button-btn secondary-btn"
                                                                    onClick={handleOpenLinkAbha}
                                                                    style={{ fontSize: '11px', padding: '6px 12px', margin: 0 }}
                                                                >
                                                                    <i className="fa-solid fa-link"></i> Link Existing ABHA
                                                                </button>
                                                                <button 
                                                                    className="action-button-btn"
                                                                    onClick={handleOpenGenerateAbha}
                                                                    style={{ fontSize: '11px', padding: '6px 12px', margin: 0, background: 'var(--color-primary)' }}
                                                                >
                                                                    <i className="fa-solid fa-user-plus"></i> Generate ABHA
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Form Fields Generator Grid */}
                                            <div className="form-field-grid">
                                                {currentPage.fields.map((field) => {
                                                    if (!isFieldVisible(field)) return null;

                                                    const isFullWidth = field.type === 'textarea' || field.type === 'checkbox' || field.type === 'instructions' || field.type === 'signature';
                                                    const val = formData[field.id];

                                                    return (
                                                        <div key={field.id} className={`form-field-group ${isFullWidth ? 'form-field-full' : ''}`}>
                                                            {field.type !== 'instructions' && (
                                                                <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>
                                                                    {field.label} {field.required && <span style={{ color: 'var(--color-error)' }}>*</span>}
                                                                </label>
                                                            )}

                                                            {/* Render by field type */}
                                                            {field.type === 'instructions' && (
                                                                <div style={{ background: 'rgba(6, 182, 212, 0.05)', borderLeft: '3px solid var(--color-primary)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '10px' }}>
                                                                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '6px' }}>{field.label}</strong>
                                                                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{field.text}</p>
                                                                </div>
                                                            )}

                                                            {field.type === 'text' && (
                                                                <input 
                                                                    type="text" 
                                                                    className="input-text-field" 
                                                                    placeholder={field.placeholder || ""}
                                                                    value={val || ""}
                                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                                />
                                                            )}

                                                            {field.type === 'number' && (
                                                                <input 
                                                                    type="number" 
                                                                    className="input-text-field" 
                                                                    value={val !== undefined ? val : ""}
                                                                    onChange={(e) => handleFieldChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                                                                />
                                                            )}

                                                            {field.type === 'date' && (
                                                                <input 
                                                                    type="date" 
                                                                    className="input-text-field" 
                                                                    value={val || ""}
                                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                                />
                                                            )}

                                                            {field.type === 'email' && (
                                                                <input 
                                                                    type="email" 
                                                                    className="input-text-field" 
                                                                    value={val || ""}
                                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                                />
                                                            )}

                                                            {field.type === 'tel' && (
                                                                <input 
                                                                    type="tel" 
                                                                    className="input-text-field" 
                                                                    value={val || ""}
                                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                                />
                                                            )}

                                                            {field.type === 'textarea' && (
                                                                <textarea 
                                                                    className="input-text-field" 
                                                                    rows="4"
                                                                    value={val || ""}
                                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                                    style={{ resize: 'vertical' }}
                                                                ></textarea>
                                                            )}

                                                            {field.type === 'select' && (
                                                                <select 
                                                                    className="input-text-field"
                                                                    value={val || ""}
                                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                                >
                                                                    <option value="">-- Select Option --</option>
                                                                    {field.options.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            )}

                                                            {field.type === 'radio' && (
                                                                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                                                                    {field.options.map(opt => (
                                                                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                                                                            <input 
                                                                                type="radio" 
                                                                                name={field.id}
                                                                                value={opt}
                                                                                checked={val === opt}
                                                                                onChange={() => handleFieldChange(field.id, opt)}
                                                                                style={{ accentColor: 'var(--color-primary)' }}
                                                                            />
                                                                            <span>{opt}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {field.type === 'checkbox' && (
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '8px' }}>
                                                                    {field.options.map(opt => {
                                                                        const isChecked = (val || []).includes(opt);
                                                                        return (
                                                                            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={isChecked}
                                                                                    onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                                                                                    style={{ accentColor: 'var(--color-primary)' }}
                                                                                />
                                                                                <span>{opt}</span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Digital Signature Canvas Drawing Board */}
                                                            {field.type === 'signature' && (
                                                                <div className="signature-pad-container" style={{ marginTop: '6px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Sign via Mouse or Touchpad:</span>
                                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                                                            <input 
                                                                                type="checkbox" 
                                                                                checked={useTypeSignature}
                                                                                onChange={(e) => {
                                                                                    setUseTypeSignature(e.target.checked);
                                                                                    setValidationError('');
                                                                                }}
                                                                                style={{ accentColor: 'var(--color-primary)' }}
                                                                            />
                                                                            <span>Or Type Full Name</span>
                                                                        </label>
                                                                    </div>

                                                                    {!useTypeSignature ? (
                                                                        <>
                                                                            <canvas
                                                                                ref={canvasRef}
                                                                                className="sig-canvas-frame"
                                                                                width={500}
                                                                                height={150}
                                                                                onMouseDown={startDrawing}
                                                                                onMouseMove={draw}
                                                                                onMouseUp={stopDrawing}
                                                                                onMouseLeave={stopDrawing}
                                                                                onTouchStart={startDrawing}
                                                                                onTouchMove={draw}
                                                                                onTouchEnd={stopDrawing}
                                                                            />
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                <span style={{ fontSize: '10px', color: hasSignature ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                                                                    {hasSignature ? "✓ Signature captured" : "No signature drawn yet."}
                                                                                </span>
                                                                                <button className="preset-duration-btn" onClick={clearSignature}>
                                                                                    Clear Pad
                                                                                </button>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div>
                                                                            <input 
                                                                                type="text" 
                                                                                className="input-text-field"
                                                                                style={{ fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontSize: '16px', letterSpacing: '1px' }}
                                                                                placeholder="Type your full legal name to authorize..."
                                                                                value={typedSigName}
                                                                                onChange={(e) => setTypedSigName(e.target.value)}
                                                                            />
                                                                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
                                                                                By typing your name, you authorize this signature as legally equivalent to a physical handwritten document.
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Wizard Navigation Footer */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                                                <button 
                                                    className="action-button-btn secondary-btn"
                                                    disabled={currentPageIndex === 0}
                                                    onClick={handleBackPage}
                                                >
                                                    Back Section
                                                </button>
                                                <button 
                                                    className="action-button-btn"
                                                    onClick={handleNextPage}
                                                >
                                                    {currentPageIndex === schema.pages.length - 1 ? "File Signed Document" : "Next Section"}
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ABHA Link/Generate Modal Dialog */}
            {abhaModalType && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="workspace-card" style={{
                        width: '100%',
                        maxWidth: '450px',
                        background: 'rgba(23, 28, 41, 0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        padding: '24px',
                        margin: 0
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-passport" style={{ color: 'var(--color-primary)' }}></i>
                                {abhaModalType === 'link' ? "Link National ABHA Account" : "Generate ABHA Health Account"}
                            </h3>
                            <button 
                                onClick={() => setAbhaModalType(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '16px' }}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {!otpSent ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                                    {abhaModalType === 'link' 
                                        ? "Enter your existing 14-digit ABHA Number or your virtual ABHA Address (e.g. username@abdm)." 
                                        : "Register for a national ABHA using your 12-digit Aadhaar Card number or registered Mobile number."}
                                </p>
                                
                                {abhaModalType === 'link' ? (
                                    <>
                                        <div className="form-field-group">
                                            <label className="form-label" style={{ fontSize: '11px' }}>ABHA Number (XX-XXXX-XXXX-XXXX)</label>
                                            <input 
                                                type="text" 
                                                className="input-text-field" 
                                                placeholder="e.g., 91-2345-6789-0123"
                                                value={abhaInput}
                                                onChange={(e) => setAbhaInput(e.target.value)}
                                            />
                                        </div>
                                        <div style={{ textAlign: 'center', margin: '4px 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>— OR —</div>
                                        <div className="form-field-group">
                                            <label className="form-label" style={{ fontSize: '11px' }}>ABHA Address (e.g., name@abdm)</label>
                                            <input 
                                                type="text" 
                                                className="input-text-field" 
                                                placeholder="e.g., sophia.patel@abdm"
                                                value={abhaAddressInput}
                                                onChange={(e) => setAbhaAddressInput(e.target.value)}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-field-group">
                                            <label className="form-label" style={{ fontSize: '11px' }}>Aadhaar Number (12 digits)</label>
                                            <input 
                                                type="text" 
                                                className="input-text-field" 
                                                placeholder="e.g., 5544-3322-1100"
                                                value={aadhaarInput}
                                                onChange={(e) => setAadhaarInput(e.target.value)}
                                            />
                                        </div>
                                        <div style={{ textAlign: 'center', margin: '4px 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>— OR —</div>
                                        <div className="form-field-group">
                                            <label className="form-label" style={{ fontSize: '11px' }}>Mobile Number (10 digits)</label>
                                            <input 
                                                type="text" 
                                                className="input-text-field" 
                                                placeholder="e.g., 9876543210"
                                                value={mobileInput}
                                                onChange={(e) => setMobileInput(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button 
                                        className="action-button-btn secondary" 
                                        onClick={() => setAbhaModalType(null)}
                                        style={{ flex: 1, margin: 0 }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="action-button-btn" 
                                        onClick={handleSendAbhaOtp}
                                        style={{ flex: 1, margin: 0, background: 'var(--color-primary)' }}
                                    >
                                        Request OTP
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                                        <i className="fa-solid fa-shield-halved"></i> Verification OTP Dispatched
                                    </span>
                                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                                        Please enter the 6-digit OTP code sent to your Aadhaar-registered phone.
                                    </p>
                                </div>

                                <div className="form-field-group">
                                    <label className="form-label" style={{ fontSize: '11px' }}>One-Time Password (OTP)</label>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
                                        maxLength={6}
                                        placeholder="••••••"
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button 
                                        className="action-button-btn secondary" 
                                        onClick={() => setOtpSent(false)}
                                        style={{ flex: 1, margin: 0 }}
                                    >
                                        Change Details
                                    </button>
                                    <button 
                                        className="action-button-btn" 
                                        onClick={handleVerifyAbhaOtp}
                                        style={{ flex: 1, margin: 0, background: '#10b981' }}
                                    >
                                        Verify & Link
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ABHA Health Card Display Overlay */}
            {showAbhaCard && abhaCardData && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                        {/* Beautiful ABHA Card UI */}
                        <div style={{
                            width: '430px',
                            height: '260px',
                            background: 'linear-gradient(135deg, rgba(23, 28, 41, 0.95) 0%, rgba(13, 16, 26, 0.98) 100%)',
                            border: '2px solid rgba(16, 185, 129, 0.4)',
                            borderRadius: '16px',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 30px rgba(16, 185, 129, 0.1)',
                            position: 'relative',
                            padding: '20px',
                            color: '#fff',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            overflow: 'hidden'
                        }}>
                            {/* Card Background Overlay Decor */}
                            <div style={{
                                position: 'absolute',
                                top: '-50px',
                                right: '-50px',
                                width: '200px',
                                height: '200px',
                                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
                                pointerEvents: 'none'
                            }} />

                            {/* Top Brand Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '26px',
                                        height: '26px',
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#10b981',
                                        fontSize: '13px',
                                        fontWeight: 'bold'
                                    }}>A</div>
                                    <div>
                                        <h5 style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>ABHA HEALTH CARD</h5>
                                        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', display: 'block' }}>Ayushman Bharat Digital Mission</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.05)' }}>
                                        GOVERNMENT OF INDIA
                                    </span>
                                </div>
                            </div>

                            {/* Card Content body */}
                            <div style={{ display: 'flex', gap: '18px', marginTop: '12px' }}>
                                {/* Left Avatar Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '90px',
                                        height: '110px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '32px',
                                        color: 'rgba(255,255,255,0.3)',
                                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                                    }}>
                                        <i className="fa-solid fa-user"></i>
                                    </div>
                                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Verified Beneficiary</span>
                                </div>

                                {/* Right Demographics Column */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div>
                                        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', display: 'block', textTransform: 'uppercase' }}>Name</span>
                                        <strong style={{ fontSize: '14px', color: '#fff', letterSpacing: '0.2px' }}>{abhaCardData.name}</strong>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <div>
                                            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', display: 'block', textTransform: 'uppercase' }}>Gender</span>
                                            <span style={{ fontSize: '11px', color: '#f3f4f6' }}>{abhaCardData.gender}</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', display: 'block', textTransform: 'uppercase' }}>Date of Birth</span>
                                            <span style={{ fontSize: '11px', color: '#f3f4f6' }}>{abhaCardData.dob}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', display: 'block', textTransform: 'uppercase' }}>ABHA Number</span>
                                        <strong style={{ fontSize: '14px', color: '#10b981', letterSpacing: '0.5px' }}>{abhaCardData.abhaNumber}</strong>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', display: 'block', textTransform: 'uppercase' }}>ABHA Address</span>
                                        <span style={{ fontSize: '11px', color: '#f3f4f6', fontFamily: 'monospace' }}>{abhaCardData.abhaAddress}</span>
                                    </div>
                                </div>

                                {/* QR Code Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        background: '#fff',
                                        borderRadius: '4px',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                    }}>
                                        <i className="fa-solid fa-qrcode" style={{ color: '#000', fontSize: '56px' }}></i>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Card Footer */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'rgba(16, 185, 129, 0.12)',
                                borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                                padding: '6px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.3px' }}>
                                    <i className="fa-solid fa-circle-check" style={{ color: '#10b981', marginRight: '4px' }}></i> Verified Demographics Linked
                                </span>
                                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                                    NHA / ABDM Gateway
                                </span>
                            </div>
                        </div>

                        {/* Download and Close Buttons */}
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <button 
                                className="action-button-btn secondary"
                                onClick={() => {
                                    showToast("ABHA Health Card PDF download triggered.", "success");
                                }}
                                style={{ flex: 1, margin: 0 }}
                            >
                                <i className="fa-solid fa-download" style={{ marginRight: '6px' }}></i> Download PDF
                            </button>
                            <button 
                                className="action-button-btn"
                                onClick={() => setShowAbhaCard(false)}
                                style={{ flex: 1, margin: 0, background: 'var(--color-primary)' }}
                            >
                                Close Card
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
