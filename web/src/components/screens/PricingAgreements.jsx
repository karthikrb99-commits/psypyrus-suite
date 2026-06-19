import { useState, useEffect } from 'react';
import { Database } from '../../services/db';
import { useToast } from '../ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';

export function PricingAgreements({ activeRole, currentUser }) {
    const { showToast } = useToast();
    
    // Tab State: 'agreements' (default), 'billing', 'profile'
    const [activeTab, setActiveTab] = useState('agreements');

    // DB state
    const [agreements, setAgreements] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [patientsList, setPatientsList] = useState([]);
    const [publicProfiles, setPublicProfiles] = useState([]);

    // Clinician settings state
    const [allowSlidingScale, setAllowSlidingScale] = useState(() => localStorage.getItem('psypyrus_allow_sliding_scale') !== 'false');
    const [allowProBono, setAllowProBono] = useState(() => localStorage.getItem('psypyrus_allow_pro_bono') !== 'false');
    const [minRate, setMinRate] = useState(() => Number(localStorage.getItem('psypyrus_min_rate') || '50'));
    const [maxRate, setMaxRate] = useState(() => Number(localStorage.getItem('psypyrus_max_rate') || '150'));
    const [proBonoSlots, setProBonoSlots] = useState(() => Number(localStorage.getItem('psypyrus_pro_bono_slots') || '4'));
    const [requiresVerification, setRequiresVerification] = useState(() => localStorage.getItem('psypyrus_requires_verification') === 'true');

    // Patient Form State
    const [selectedClinicianId, setSelectedClinicianId] = useState('dr_liam');
    const [selectedTier, setSelectedTier] = useState('Student Sliding Scale');
    const [proposedFee, setProposedFee] = useState(60);
    const [patientIncome, setPatientIncome] = useState('');
    const [justification, setJustification] = useState('');
    const [simulatedFile, setSimulatedFile] = useState(null);

    // Clinician counter state
    const [counterAgreementId, setCounterAgreementId] = useState(null);
    const [counterFee, setCounterFee] = useState(70);
    const [counterMsg, setCounterMsg] = useState('');

    // --- Tealfeed-inspired: Clinician Public Web Profile Builder State ---
    const [profileName, setProfileName] = useState('Dr. Liam Carter');
    const [profileTitle, setProfileTitle] = useState('Lead Clinical Psychiatrist & Neuroscientist');
    const [profileBio, setProfileBio] = useState('Board-certified psychiatrist specializing in treatment-resistant depression, ADHD, and computational psychometrics. Pioneer of the PsyPyrus AI Operating System.');
    const [profileMode, setProfileMode] = useState('Hybrid (Video & In-Person)');
    const [profileTheme, setProfileTheme] = useState('teal-mint');
    const [profileFont, setProfileFont] = useState('Outfit');
    const [profileAddress, setProfileAddress] = useState('100 Medical Plaza, Suite 401, San Francisco, CA 94143');
    const [profileLanguages, setProfileLanguages] = useState('English, Spanish');
    const [profileSpecialties, setProfileSpecialties] = useState('MDD, ADHD, Somatic Anxiety, PTSD');
    
    // Services pricing state (duration, standard fee)
    const [serviceIntakeFee, setServiceIntakeFee] = useState(250);
    const [serviceIntakeTime, setServiceIntakeTime] = useState(60);
    const [serviceFollowUpFee, setServiceFollowUpFee] = useState(120);
    const [serviceFollowUpTime, setServiceFollowUpTime] = useState(30);
    const [serviceCbtFee, setServiceCbtFee] = useState(150);
    const [serviceCbtTime, setServiceCbtTime] = useState(50);
    const [serviceCrisisFee, setServiceCrisisFee] = useState(180);
    const [serviceCrisisTime, setServiceCrisisTime] = useState(45);

    // --- Tealfeed-inspired: Invoicing & Billing State ---
    const [showIssueInvoiceModal, setShowIssueInvoiceModal] = useState(false);
    const [selectedInvoicePatientId, setSelectedInvoicePatientId] = useState('');
    const [selectedInvoiceService, setSelectedInvoiceService] = useState('CBT Cognitive Restructuring Session');
    const [invoiceAmount, setInvoiceAmount] = useState(150);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState(null);
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardZip, setCardZip] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Mock Booking Preview Interactive State
    const [selectedPreviewService, setSelectedPreviewService] = useState(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingDate, setBookingDate] = useState('2026-06-16');
    const [bookingTime, setBookingTime] = useState('10:00 AM');

    const CLINICIANS = [
        { id: 'dr_liam', name: 'Dr. Liam Carter', specialty: 'General Psychiatry' },
        { id: 'dr_katherine', name: 'Dr. Katherine Brewster', specialty: 'ADHD Specialist' },
        { id: 'dr_sarah', name: 'Dr. Sarah Jenkins', specialty: 'Anxiety & Trauma' }
    ];

    const loadData = () => {
        setAgreements(Database.getPricingAgreements());
        setAppointments(Database.getAppointments());
        setInvoices(Database.getInvoices());
        setPatientsList(Database.getPatients());
        
        const profiles = Database.getPublicProfiles();
        setPublicProfiles(profiles);
        const myProf = profiles.find(p => p.professionalId === 'dr_liam');
        if (myProf) {
            setProfileName(myProf.name || 'Dr. Liam Carter');
            setProfileTitle(myProf.title || '');
            setProfileBio(myProf.bio || '');
            setProfileMode(myProf.consultationMode || 'Hybrid');
            setProfileTheme(myProf.theme || 'teal-mint');
            setProfileFont(myProf.font || 'Outfit');
            setProfileAddress(myProf.address || '');
            setProfileLanguages(myProf.languages?.join(', ') || 'English');
            setProfileSpecialties(myProf.specialties?.join(', ') || '');
            
            // Load services pricing if defined
            if (myProf.services) {
                const intake = myProf.services.find(s => s.id === 1);
                if (intake) { setServiceIntakeFee(intake.fee); setServiceIntakeTime(intake.duration); }
                const follow = myProf.services.find(s => s.id === 2);
                if (follow) { setServiceFollowUpFee(follow.fee); setServiceFollowUpTime(follow.duration); }
                const cbt = myProf.services.find(s => s.id === 3);
                if (cbt) { setServiceCbtFee(cbt.fee); setServiceCbtTime(cbt.duration); }
                const crisis = myProf.services.find(s => s.id === 4);
                if (crisis) { setServiceCrisisFee(crisis.fee); setServiceCrisisTime(crisis.duration); }
            }
        }
    };

    useEffect(() => {
        loadData();
        window.addEventListener('psypyrus_db_change', loadData);
        return () => window.removeEventListener('psypyrus_db_change', loadData);
    }, []);

    // Save clinician settings (Sliding scale / pro bono)
    const handleSaveSettings = (e) => {
        e.preventDefault();
        localStorage.setItem('psypyrus_allow_sliding_scale', allowSlidingScale);
        localStorage.setItem('psypyrus_allow_pro_bono', allowProBono);
        localStorage.setItem('psypyrus_min_rate', minRate);
        localStorage.setItem('psypyrus_max_rate', maxRate);
        localStorage.setItem('psypyrus_pro_bono_slots', proBonoSlots);
        localStorage.setItem('psypyrus_requires_verification', requiresVerification);
        showToast("Pricing policies updated successfully.", "success");
        Database.logAudit("Updated Pricing Policies", `Clinician updated sliding scale ($${minRate}-$${maxRate}) and pro bono slots (${proBonoSlots}) settings.`);
    };

    // Patient Submit Agreement request
    const handlePostRequest = (e) => {
        e.preventDefault();
        if (!justification.trim()) {
            showToast("Please provide a justification message.", "error");
            return;
        }

        const clinician = CLINICIANS.find(c => c.id === selectedClinicianId) || CLINICIANS[0];
        const patientIdStr = String(currentUser.id).replace('patient_', '');

        const finalFee = selectedTier.includes('Pro Bono') ? 0 : Number(proposedFee);

        const newId = Database.createPricingAgreement({
            patientId: Number(patientIdStr) || 1,
            patientName: currentUser.name || "Patient User",
            professionalId: clinician.id,
            professionalName: clinician.name,
            proposedFee: finalFee,
            tier: selectedTier,
            incomeDeclared: patientIncome ? Number(patientIncome) : null,
            message: justification,
            verificationFile: simulatedFile ? simulatedFile.name : null
        });

        if (newId) {
            setJustification('');
            setPatientIncome('');
            setSimulatedFile(null);
            showToast("Pricing request submitted to clinician!", "success");
        }
    };

    // Clinician Action Handlers (Sliding scale)
    const handleApprove = (agreementId) => {
        const success = Database.updatePricingAgreement(agreementId, 'Approved');
        if (success) {
            showToast("Sliding scale/pro bono request approved!", "success");
        }
    };

    const handleReject = (agreementId) => {
        const success = Database.updatePricingAgreement(agreementId, 'Rejected');
        if (success) {
            showToast("Sliding scale/pro bono request rejected.", "info");
        }
    };

    const handleOpenCounter = (ag) => {
        setCounterAgreementId(ag.id);
        setCounterFee(ag.proposedFee);
        setCounterMsg('');
    };

    const handleSendCounter = (e) => {
        e.preventDefault();
        const success = Database.updatePricingAgreement(counterAgreementId, 'Countered', Number(counterFee), counterMsg || "Clinician counter offer.");
        if (success) {
            setCounterAgreementId(null);
            showToast("Counter offer submitted to patient.", "success");
        }
    };

    // Patient accepts/declines counter
    const handleAcceptCounter = (agreementId) => {
        const success = Database.updatePricingAgreement(agreementId, 'Approved');
        if (success) {
            showToast("Accepted counter-proposed rate!", "success");
        }
    };

    const handleDeclineCounter = (agreementId) => {
        const success = Database.updatePricingAgreement(agreementId, 'Rejected');
        if (success) {
            showToast("Declined counter rate.", "info");
        }
    };

    // Save Clinician Public Profile Builder Settings
    const handleSavePublicProfile = (e) => {
        e.preventDefault();
        
        const profileData = {
            name: profileName,
            title: profileTitle,
            bio: profileBio,
            consultationMode: profileMode,
            theme: profileTheme,
            font: profileFont,
            address: profileAddress,
            languages: profileLanguages.split(',').map(s => s.trim()).filter(Boolean),
            specialties: profileSpecialties.split(',').map(s => s.trim()).filter(Boolean),
            services: [
                { id: 1, name: 'Comprehensive Psychiatric Intake', duration: Number(serviceIntakeTime), fee: Number(serviceIntakeFee), description: 'Complete evaluation including history, MSE, and initial diagnostic workup.' },
                { id: 2, name: 'Psychopharmacology Follow-up', duration: Number(serviceFollowUpTime), fee: Number(serviceFollowUpFee), description: 'Review of medication effectiveness, side effects, and dosage adjustments.' },
                { id: 3, name: 'CBT Cognitive Restructuring Session', duration: Number(serviceCbtTime), fee: Number(serviceCbtFee), description: 'Evidence-based cognitive restructuring and therapeutic restructuring homework.' },
                { id: 4, name: 'Emergency Crisis Teletherapy', duration: Number(serviceCrisisTime), fee: Number(serviceCrisisFee), description: 'Urgent stabilization, risk screening, and safety planning.' }
            ]
        };

        const success = Database.updatePublicProfile('dr_liam', profileData);
        if (success) {
            showToast("Public website booking configurations saved!", "success");
        }
    };

    // Copy Shareable Profile URL
    const handleCopyBookingLink = () => {
        const mockLink = `https://psypyrus.org/booking/dr_liam?theme=${profileTheme}&font=${profileFont}`;
        navigator.clipboard.writeText(mockLink);
        showToast("Mock shareable profile URL copied to clipboard!", "info");
    };

    // Auto-compute invoice fee when selecting patient & service
    useEffect(() => {
        if (!selectedInvoicePatientId) return;
        
        // Check if there is an approved pricing agreement for this patient and dr_liam
        const activeAg = agreements.find(
            ag => ag.patientId === Number(selectedInvoicePatientId) && 
            ag.professionalId === 'dr_liam' && 
            ag.status === 'Approved'
        );

        if (activeAg) {
            // Sliding scale fee applies
            setInvoiceAmount(activeAg.proposedFee);
        } else {
            // Fallback to standard service fee
            const standardFees = {
                'Comprehensive Psychiatric Intake': serviceIntakeFee,
                'Psychopharmacology Follow-up': serviceFollowUpFee,
                'CBT Cognitive Restructuring Session': serviceCbtFee,
                'Emergency Crisis Teletherapy': serviceCrisisFee
            };
            setInvoiceAmount(standardFees[selectedInvoiceService] || 150);
        }
    }, [selectedInvoicePatientId, selectedInvoiceService, agreements, serviceIntakeFee, serviceFollowUpFee, serviceCbtFee, serviceCrisisFee]);

    // Clinician Create Invoice
    const handleCreateInvoice = (e) => {
        e.preventDefault();
        if (!selectedInvoicePatientId) {
            showToast("Please select a patient.", "error");
            return;
        }

        const patientObj = patientsList.find(p => p.id === Number(selectedInvoicePatientId));
        if (!patientObj) return;

        const newInvoiceId = Database.createInvoice({
            patientId: patientObj.id,
            patientName: patientObj.name,
            serviceName: selectedInvoiceService,
            amount: Number(invoiceAmount),
            status: 'Pending',
            paymentMethod: null,
            transactionId: null
        });

        if (newInvoiceId) {
            setShowIssueInvoiceModal(false);
            showToast(`Invoice ID ${newInvoiceId} issued to ${patientObj.name}!`, "success");
        }
    };

    // Patient Pay Invoice Submit
    const handleProcessPayment = (e) => {
        e.preventDefault();
        if (!cardNumber || !cardExpiry || !cardCvv || !cardZip) {
            showToast("Please fill in all checkout details.", "error");
            return;
        }

        setIsProcessingPayment(true);

        setTimeout(() => {
            const success = Database.payInvoice(selectedPaymentInvoice.id, `Visa ending in ${cardNumber.slice(-4) || '7890'}`);
            if (success) {
                setIsProcessingPayment(false);
                setShowPaymentModal(false);
                setSelectedPaymentInvoice(null);
                setCardNumber('');
                setCardExpiry('');
                setCardCvv('');
                setCardZip('');
                showToast("Cryptographic invoice payment completed! Receipt issued.", "success");
            }
        }, 1200);
    };

    const handleSendInvoiceReminder = (invoiceId, patientName) => {
        showToast(`Secure payment reminder notification sent to ${patientName}.`, "info");
        Database.logAudit("Sent Invoice Reminder", `Clinician triggered payment notification reminder for invoice ID ${invoiceId} issued to patient ${patientName}.`);
    };

    const handleDownloadReceipt = (invoice) => {
        showToast(`Cryptographic receipt PDF generated for Invoice #${invoice.id}.`, "success");
        Database.logAudit("Downloaded Invoice Receipt", `Cryptographic PDF receipt downloaded for invoice ID ${invoice.id} ($${invoice.amount}).`);
    };

    // Filtering active/pending lists
    const patientIdVal = Number(String(currentUser.id).replace('patient_', '')) || 1;
    const isClinician = activeRole !== 'Patient';

    const filteredAgreements = agreements.filter(ag => {
        if (isClinician) {
            return true;
        } else {
            return ag.patientId === patientIdVal;
        }
    });

    const pendingRequests = filteredAgreements.filter(ag => ag.status === 'Pending' || ag.status === 'Countered');
    const activeAgreements = filteredAgreements.filter(ag => ag.status === 'Approved');

    // Invoices list for this role
    const filteredInvoices = invoices.filter(inv => {
        if (isClinician) return true;
        return inv.patientId === patientIdVal;
    });

    // Payout metrics for Clinician
    const grossEarnings = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
    const outstandingInvoices = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);

    // Styling helpers for Live Website Preview
    const themeClassMap = {
        'teal-mint': { bg: 'bg-teal-950/20', border: 'border-teal-500/30', text: 'text-teal-400', btn: 'bg-teal-500 hover:bg-teal-600 text-slate-950', badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
        'sleek-onyx': { bg: 'bg-slate-900', border: 'border-white/10', text: 'text-slate-200', btn: 'bg-white hover:bg-slate-200 text-slate-950', badge: 'bg-white/10 text-white border-white/10' },
        'rosewood': { bg: 'bg-rose-950/20', border: 'border-rose-500/30', text: 'text-rose-400', btn: 'bg-rose-500 hover:bg-rose-600 text-slate-950', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
        'soft-lavender': { bg: 'bg-indigo-950/20', border: 'border-indigo-500/30', text: 'text-indigo-300', btn: 'bg-indigo-500 hover:bg-indigo-600 text-slate-950', badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' }
    };
    const fontClassMap = {
        'Outfit': 'font-outfit',
        'DM Sans': 'font-dmsans',
        'Playfair Display': 'font-playfair font-serif',
        'Inter': 'font-sans'
    };

    const currentThemeStyle = themeClassMap[profileTheme] || themeClassMap['teal-mint'];
    const currentFontStyle = fontClassMap[profileFont] || 'font-sans';

    return (
        <div className="pricing-accessibility-screen p-6 max-w-7xl mx-auto space-y-6">
            {/* HUB HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <i className="fa-solid fa-file-invoice-dollar text-teal-400"></i>
                        Practice Business & Pricing Hub
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        {isClinician 
                          ? "Manage customized sliding scales, issue patient invoices, and customize your public-facing Tealfeed-style booking website."
                          : "Review your sliding scale agreements, check outstanding billing invoices, and complete secure cryptographic session payments."
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs rounded-full font-semibold">
                        {isClinician ? "Professional Workspace" : "Patient Access Panel"}
                    </span>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-white/5 gap-2 pb-px print:hidden">
                <button
                    onClick={() => setActiveTab('agreements')}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        activeTab === 'agreements'
                            ? 'border-teal-400 text-teal-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-t-lg'
                    }`}
                >
                    <i className="fa-solid fa-file-contract mr-1.5"></i>
                    {isClinician ? "Sliding Scales & Policies" : "Sliding Scale Proposals"}
                </button>
                <button
                    onClick={() => setActiveTab('billing')}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        activeTab === 'billing'
                            ? 'border-teal-400 text-teal-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-t-lg'
                    }`}
                >
                    <i className="fa-solid fa-receipt mr-1.5"></i>
                    {isClinician ? "Billing Ledger & Earnings" : "My Bills & Payments"}
                </button>
                {isClinician && (
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                            activeTab === 'profile'
                                ? 'border-teal-400 text-teal-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-t-lg'
                        }`}
                    >
                        <i className="fa-solid fa-globe mr-1.5"></i>
                        Public Profile & Web Builder
                    </button>
                )}
            </div>

            {/* TAB CONTENTS */}
            <div className="tab-body-container pt-2">
                {activeTab === 'agreements' && (
                    <>
                        {isClinician ? (
                            /* Clinician Sliding Scale Agreements View */
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                                {/* Clinician Policies Configuration */}
                                <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-xl space-y-4">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <i className="fa-solid fa-sliders text-teal-400"></i>
                                        Accessibility Policies
                                    </h2>
                                    <form onSubmit={handleSaveSettings} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-300 text-sm font-medium">Sliding Scale Pricing</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={allowSlidingScale}
                                                    onChange={(e) => setAllowSlidingScale(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-slate-950"></div>
                                            </label>
                                        </div>

                                        {allowSlidingScale && (
                                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/40 rounded-lg border border-white/5">
                                                <div>
                                                    <label htmlFor="min-rate-input" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Minimum Sliding Rate ($)</label>
                                                    <input 
                                                        id="min-rate-input"
                                                        type="number" 
                                                        value={minRate}
                                                        onChange={(e) => setMinRate(Number(e.target.value))}
                                                        className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="max-rate-input" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Maximum Sliding Rate ($)</label>
                                                    <input 
                                                        id="max-rate-input"
                                                        type="number" 
                                                        value={maxRate}
                                                        onChange={(e) => setMaxRate(Number(e.target.value))}
                                                        className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-300 text-sm font-medium">Pro Bono Therapy Tier</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={allowProBono}
                                                    onChange={(e) => setAllowProBono(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-slate-950"></div>
                                            </label>
                                        </div>

                                        {allowProBono && (
                                            <div className="p-3 bg-slate-950/40 rounded-lg border border-white/5 space-y-2">
                                                <div>
                                                    <label htmlFor="slots-input" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Total Pro Bono Slots</label>
                                                    <input 
                                                        id="slots-input"
                                                        type="number" 
                                                        value={proBonoSlots}
                                                        onChange={(e) => setProBonoSlots(Number(e.target.value))}
                                                        className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                                    <span className="text-[11px] text-slate-400">Require Document Upload</span>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={requiresVerification}
                                                        onChange={(e) => setRequiresVerification(e.target.checked)}
                                                        className="accent-teal-500"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button 
                                            type="submit"
                                            className="w-full py-2 bg-teal-505 bg-teal-500 hover:bg-teal-650 hover:bg-teal-600 text-slate-950 text-xs font-semibold rounded transition-all mt-2 cursor-pointer"
                                        >
                                            Update Accessibility Policies
                                        </button>
                                    </form>
                                </div>

                                {/* Request Queue & Active List */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-xl">
                                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-comments-dollar text-amber-400"></i>
                                            Pending Rate Negotiations & Claims
                                        </h2>
                                        {pendingRequests.length === 0 ? (
                                            <p className="text-slate-500 text-xs py-4 text-center">No pending sliding scale negotiations or pro bono claims.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {pendingRequests.map(req => (
                                                    <div key={req.id} className="p-4 bg-slate-950/40 border border-white/5 rounded-lg space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="text-xs font-semibold text-white">{req.patientName}</span>
                                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                                    Requested Tier: <span className="text-teal-400 font-semibold">{req.tier}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-sm font-bold text-emerald-400">
                                                                    {req.proposedFee === 0 ? "FREE" : `$${req.proposedFee}/session`}
                                                                </span>
                                                                <div className="text-[9px] text-slate-500">{new Date(req.date).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>

                                                        <div className="text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded border border-white/5">
                                                            <div className="text-[9px] uppercase text-slate-500 font-bold mb-1">Patient Justification</div>
                                                            "{req.message}"
                                                        </div>

                                                        {req.incomeDeclared !== null && (
                                                            <div className="flex gap-4 text-[10px] text-slate-400">
                                                                <span>Declared Annual Income: <strong className="text-slate-200">${req.incomeDeclared}</strong></span>
                                                                {req.verificationFile && (
                                                                    <span className="text-teal-400">
                                                                        <i className="fa-solid fa-file-pdf mr-1"></i>
                                                                        {req.verificationFile} (Attached)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {req.status === 'Countered' && (
                                                            <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded text-[11px] text-amber-300">
                                                                <strong>Your Counter-Proposed Offer:</strong> ${req.proposedFee}/session. Waiting for patient response.
                                                            </div>
                                                        )}

                                                        {req.status === 'Pending' && counterAgreementId !== req.id && (
                                                            <div className="flex gap-2 justify-end">
                                                                <button 
                                                                    onClick={() => handleReject(req.id)}
                                                                    className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs rounded transition-all cursor-pointer"
                                                                >
                                                                    Decline
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleOpenCounter(req)}
                                                                    className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-xs rounded transition-all cursor-pointer"
                                                                >
                                                                    Counter Rate
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleApprove(req.id)}
                                                                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-600 text-slate-950 font-semibold text-xs rounded transition-all cursor-pointer"
                                                                >
                                                                    Approve
                                                                </button>
                                                            </div>
                                                        )}

                                                        {counterAgreementId === req.id && (
                                                            <form onSubmit={handleSendCounter} className="p-3 bg-slate-900 border border-amber-500/20 rounded-md space-y-3 animate-fade-in">
                                                                <div className="text-xs font-bold text-amber-400">Counter-Propose Rate</div>
                                                                <div className="grid grid-cols-3 gap-2 items-center">
                                                                    <div className="col-span-1">
                                                                        <label htmlFor="counter-fee-val" className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Counter Fee ($)</label>
                                                                        <input 
                                                                            id="counter-fee-val"
                                                                            type="number"
                                                                            value={counterFee}
                                                                            onChange={(e) => setCounterFee(Number(e.target.value))}
                                                                            className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <label htmlFor="counter-msg-val" className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Message to Patient</label>
                                                                        <input 
                                                                            id="counter-msg-val"
                                                                            type="text"
                                                                            placeholder="e.g. Can we meet at $70?"
                                                                            value={counterMsg}
                                                                            onChange={(e) => setCounterMsg(e.target.value)}
                                                                            className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 justify-end">
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => setCounterAgreementId(null)}
                                                                        className="px-2.5 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        type="submit"
                                                                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded transition-all cursor-pointer"
                                                                    >
                                                                        Submit Counter
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Active list */}
                                    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-xl">
                                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-square-check text-teal-400"></i>
                                            Active sliding scale agreements
                                        </h2>
                                        {activeAgreements.length === 0 ? (
                                            <p className="text-slate-500 text-xs py-4 text-center">No active negotiated pricing agreements.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider font-bold">
                                                            <th className="py-2.5">Patient</th>
                                                            <th className="py-2.5">Agreed Rate</th>
                                                            <th className="py-2.5">Tier</th>
                                                            <th className="py-2.5">Approved Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 text-slate-300">
                                                        {activeAgreements.map(ag => (
                                                            <tr key={ag.id} className="hover:bg-white/[0.02]">
                                                                <td className="py-3 font-semibold text-white">{ag.patientName}</td>
                                                                <td className="py-3 text-teal-400 font-semibold">{ag.proposedFee === 0 ? "Pro Bono" : `$${ag.proposedFee}/session`}</td>
                                                                <td className="py-3 text-slate-400">{ag.tier}</td>
                                                                <td className="py-3 text-slate-500">{new Date(ag.date).toLocaleDateString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Patient Sliding Scale Proposals View */
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                                {/* Request Form */}
                                <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-xl space-y-4">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <i className="fa-solid fa-signature text-teal-400"></i>
                                        Request Special Pricing
                                    </h2>
                                    <form onSubmit={handlePostRequest} className="space-y-3.5">
                                        <div>
                                            <label htmlFor="clinician-select-pat" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Select Clinician</label>
                                            <select 
                                                id="clinician-select-pat"
                                                value={selectedClinicianId}
                                                onChange={(e) => setSelectedClinicianId(e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                            >
                                                {CLINICIANS.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} ({c.specialty})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="tier-select-pat" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Select Target Tier</label>
                                            <select 
                                                id="tier-select-pat"
                                                value={selectedTier}
                                                onChange={(e) => setSelectedTier(e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                            >
                                                <option value="Student Sliding Scale">Student Sliding Scale (Requires ID)</option>
                                                <option value="Low Income Sliding Scale">Low Income Sliding Scale (Requires Income Proof)</option>
                                                <option value="Low Income Pro Bono">Low Income Pro Bono Tier (Free Slots)</option>
                                            </select>
                                        </div>

                                        {!selectedTier.includes('Pro Bono') && (
                                            <div>
                                                <label htmlFor="proposed-fee-pat" className="text-[10px] uppercase text-slate-500 font-bold flex justify-between mb-1">
                                                    <span>Proposed Session Fee</span>
                                                    <span className="text-teal-400">${proposedFee}</span>
                                                </label>
                                                <input 
                                                    id="proposed-fee-pat"
                                                    type="range"
                                                    min="30"
                                                    max="120"
                                                    value={proposedFee}
                                                    onChange={(e) => setProposedFee(Number(e.target.value))}
                                                    className="w-full accent-teal-500 cursor-pointer"
                                                />
                                                <div className="flex justify-between text-[9px] text-slate-500">
                                                    <span>$30</span>
                                                    <span>$120</span>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label htmlFor="income-input-pat" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Your Annual Income ($)</label>
                                            <input 
                                                id="income-input-pat"
                                                type="number"
                                                placeholder="e.g. 1500"
                                                value={patientIncome}
                                                onChange={(e) => setPatientIncome(e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Verification Document Simulation</label>
                                            <div className="border border-dashed border-white/10 rounded-lg p-3 text-center bg-slate-950/40 hover:border-teal-500/30 cursor-pointer transition-all" onClick={() => setSimulatedFile({ name: `${selectedTier.replace(/ /g, '_')}_verify.pdf` })}>
                                                <i className="fa-solid fa-cloud-arrow-up text-slate-500 text-sm mb-1.5"></i>
                                                {simulatedFile ? (
                                                    <div className="text-[10px] text-teal-400 font-medium">{simulatedFile.name} (Uploaded)</div>
                                                ) : (
                                                    <div className="text-[10px] text-slate-400">Click to simulated upload verification document</div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="justification-input-pat" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Justification Message</label>
                                            <textarea 
                                                id="justification-input-pat"
                                                rows="3"
                                                placeholder="Explain your student status or financial constraint..."
                                                value={justification}
                                                onChange={(e) => setJustification(e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                            />
                                        </div>

                                        <button 
                                            type="submit"
                                            className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs rounded transition-all cursor-pointer"
                                        >
                                            Submit Pricing Proposal
                                        </button>
                                    </form>
                                </div>

                                {/* Active list and negotiation history */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Active list */}
                                    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-xl">
                                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-square-check text-teal-400"></i>
                                            Your Active Pricing Agreements
                                        </h2>
                                        {activeAgreements.length === 0 ? (
                                            <p className="text-slate-500 text-xs py-4 text-center">You do not have any active sliding scale agreements.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {activeAgreements.map(ag => (
                                                    <div key={ag.id} className="p-3.5 bg-teal-500/5 border border-teal-500/10 rounded-lg flex justify-between items-center">
                                                        <div>
                                                            <div className="text-xs font-semibold text-white">{ag.professionalName}</div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5">Tier: {ag.tier}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm font-bold text-teal-400">
                                                                {ag.proposedFee === 0 ? "Pro Bono (Free)" : `$${ag.proposedFee}/session`}
                                                            </span>
                                                            <div className="text-[9px] text-slate-500">Approved</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Negotiations queue */}
                                    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-xl">
                                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-clock-rotate-left text-amber-400"></i>
                                            Pending Applications & Negotiations
                                        </h2>
                                        {pendingRequests.length === 0 ? (
                                            <p className="text-slate-500 text-xs py-4 text-center">No pending accessibility pricing requests.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {pendingRequests.map(req => (
                                                    <div key={req.id} className="p-4 bg-slate-950/40 border border-white/5 rounded-lg space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="text-xs font-semibold text-white">{req.professionalName}</span>
                                                                <div className="text-[10px] text-slate-400 mt-0.5">Tier: {req.tier}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-sm font-bold text-slate-300">
                                                                    {req.proposedFee === 0 ? "FREE" : `$${req.proposedFee}/session`}
                                                                </span>
                                                                <span className={`block text-[10px] ${req.status === 'Countered' ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>
                                                                    {req.status === 'Countered' ? "Counter Offered" : "Pending Approval"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {req.status === 'Countered' && (
                                                            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg space-y-2.5">
                                                                <div className="text-[11px] text-amber-300">
                                                                    <strong>Clinician Message:</strong> Countered at <strong>${req.proposedFee}/session</strong>.
                                                                </div>
                                                                <div className="flex gap-2 justify-end">
                                                                    <button 
                                                                        onClick={() => handleDeclineCounter(req.id)}
                                                                        className="px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs rounded transition-all cursor-pointer"
                                                                    >
                                                                        Decline Counter
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleAcceptCounter(req.id)}
                                                                        className="px-2.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs rounded transition-all cursor-pointer"
                                                                    >
                                                                        Accept Counter Rate
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'profile' && isClinician && (
                    /* Clinician Public Profile Builder (Tealfeed-style) */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                        {/* Profile Settings Editor Form */}
                        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-xl space-y-4 h-fit">
                            <h2 className="text-lg font-semibold text-white flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <i className="fa-solid fa-gears text-teal-400"></i>
                                    Web Profile Configuration
                                </span>
                                <button 
                                    onClick={handleCopyBookingLink}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-white/5 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Copy Booking Link"
                                >
                                    <i className="fa-solid fa-copy"></i>
                                    <span>Copy URL</span>
                                </button>
                            </h2>

                            <form onSubmit={handleSavePublicProfile} className="space-y-3.5">
                                <div>
                                    <label htmlFor="profile-name-input" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Display Name</label>
                                    <input 
                                        id="profile-name-input"
                                        type="text" 
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-teal-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="profile-title-input" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Clinical Title</label>
                                    <input 
                                        id="profile-title-input"
                                        type="text" 
                                        value={profileTitle}
                                        onChange={(e) => setProfileTitle(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-teal-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="profile-bio-input" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Bio / Practice Description</label>
                                    <textarea 
                                        id="profile-bio-input"
                                        rows="3"
                                        value={profileBio}
                                        onChange={(e) => setProfileBio(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-teal-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="profile-mode-select" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Consultation Mode</label>
                                        <select 
                                            id="profile-mode-select"
                                            value={profileMode}
                                            onChange={(e) => setProfileMode(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                                        >
                                            <option value="Hybrid (Video & In-Person)">Hybrid Mode</option>
                                            <option value="Video Teletherapy Only">Video Only</option>
                                            <option value="In-Person Clinical Only">In-Person Only</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="profile-langs-input" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Languages (comma sep)</label>
                                        <input 
                                            id="profile-langs-input"
                                            type="text" 
                                            value={profileLanguages}
                                            onChange={(e) => setProfileLanguages(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="profile-theme-select" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Branding Theme</label>
                                        <select 
                                            id="profile-theme-select"
                                            value={profileTheme}
                                            onChange={(e) => setProfileTheme(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                                        >
                                            <option value="teal-mint">Teal Mint (Modern)</option>
                                            <option value="sleek-onyx">Sleek Onyx (Minimalist)</option>
                                            <option value="rosewood">Rosewood (Organic)</option>
                                            <option value="soft-lavender">Soft Lavender (Soothing)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="profile-font-select" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Branding Font</label>
                                        <select 
                                            id="profile-font-select"
                                            value={profileFont}
                                            onChange={(e) => setProfileFont(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                                        >
                                            <option value="Outfit">Outfit (Geometric)</option>
                                            <option value="DM Sans">DM Sans (Professional)</option>
                                            <option value="Playfair Display">Playfair Serif (Editorial)</option>
                                            <option value="Inter">Inter (SaaS Standard)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="profile-specs-input" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Specialties (comma sep)</label>
                                    <input 
                                        id="profile-specs-input"
                                        type="text" 
                                        value={profileSpecialties}
                                        onChange={(e) => setProfileSpecialties(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="profile-address-input" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Office Address</label>
                                    <input 
                                        id="profile-address-input"
                                        type="text" 
                                        value={profileAddress}
                                        onChange={(e) => setProfileAddress(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                                    />
                                </div>

                                {/* Custom services rates */}
                                <div className="border-t border-white/5 pt-3 mt-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Service Pricing & Rates</span>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 gap-2 items-center text-[10px] text-slate-400 font-bold">
                                            <span className="col-span-6">Service</span>
                                            <span className="col-span-3">Fee ($)</span>
                                            <span className="col-span-3">Time (min)</span>
                                        </div>
                                        <div className="grid grid-cols-12 gap-2 items-center">
                                            <span className="col-span-6 text-xs text-slate-300 truncate">Intake Intake Evaluation</span>
                                            <input type="number" value={serviceIntakeFee} onChange={(e) => setServiceIntakeFee(Number(e.target.value))} className="col-span-3 bg-slate-950 border border-white/10 rounded py-1 px-1.5 text-xs text-white" />
                                            <input type="number" value={serviceIntakeTime} onChange={(e) => setServiceIntakeTime(Number(e.target.value))} className="col-span-3 bg-slate-950 border border-white/10 rounded py-1 px-1.5 text-xs text-white" />
                                        </div>
                                        <div className="grid grid-cols-12 gap-2 items-center">
                                            <span className="col-span-6 text-xs text-slate-300 truncate">Follow-up Consult</span>
                                            <input type="number" value={serviceFollowUpFee} onChange={(e) => setServiceFollowUpFee(Number(e.target.value))} className="col-span-3 bg-slate-950 border border-white/10 rounded py-1 px-1.5 text-xs text-white" />
                                            <input type="number" value={serviceFollowUpTime} onChange={(e) => setServiceFollowUpTime(Number(e.target.value))} className="col-span-3 bg-slate-950 border border-white/10 rounded py-1 px-1.5 text-xs text-white" />
                                        </div>
                                        <div className="grid grid-cols-12 gap-2 items-center">
                                            <span className="col-span-6 text-xs text-slate-300 truncate">CBT Restructuring Session</span>
                                            <input type="number" value={serviceCbtFee} onChange={(e) => setServiceCbtFee(Number(e.target.value))} className="col-span-3 bg-slate-950 border border-white/10 rounded py-1 px-1.5 text-xs text-white" />
                                            <input type="number" value={serviceCbtTime} onChange={(e) => setServiceCbtTime(Number(e.target.value))} className="col-span-3 bg-slate-950 border border-white/10 rounded py-1 px-1.5 text-xs text-white" />
                                        </div>
                                        <div className="grid grid-cols-12 gap-2 items-center">
                                            <span className="col-span-6 text-xs text-slate-300 truncate">Emergency Crisis Session</span>
                                            <input type="number" value={serviceCrisisFee} onChange={(e) => setServiceCrisisFee(Number(e.target.value))} className="col-span-3 bg-slate-950 border border-white/10 rounded py-1 px-1.5 text-xs text-white" />
                                            <input type="number" value={serviceCrisisTime} onChange={(e) => setServiceCrisisTime(Number(e.target.value))} className="col-span-3 bg-slate-950 border border-white/10 rounded py-1 px-1.5 text-xs text-white" />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded transition-all cursor-pointer mt-2 flex items-center justify-center gap-1.5"
                                >
                                    <i className="fa-solid fa-floppy-disk"></i>
                                    <span>Apply Changes to Public Site</span>
                                </button>
                            </form>
                        </div>

                        {/* LIVE PREVIEW SCREEN */}
                        <div className="lg:col-span-7 space-y-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Live Public Website Preview</span>
                            
                            <div className={`mock-website-preview border rounded-xl overflow-hidden shadow-2xl bg-slate-950 flex flex-col h-[650px] transition-all relative ${currentThemeStyle.border} ${currentFontStyle}`}>
                                {/* Header / Navigation */}
                                <div className="preview-nav px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-black/45">
                                    <div className="flex items-center gap-2">
                                        <i className={`fa-solid fa-face-smile-beam ${currentThemeStyle.text} text-base`}></i>
                                        <span className="text-white text-xs font-bold tracking-wide">{profileName.split(' ')[1] ? `Dr. ${profileName.split(' ').slice(1).join(' ')}` : profileName}</span>
                                    </div>
                                    <div className="flex items-center gap-3.5 text-[10px] text-slate-400 font-semibold">
                                        <span>Services</span>
                                        <span>Location</span>
                                        <span>Portal</span>
                                        <button className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${currentThemeStyle.btn}`}>
                                            Book Appointment
                                        </button>
                                    </div>
                                </div>

                                {/* Banner/Hero Details */}
                                <div className="p-6 border-b border-white/5 flex flex-col gap-2 relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-bold text-white tracking-wide">{profileName}</h3>
                                            <p className={`text-[11px] font-medium leading-normal ${currentThemeStyle.text}`}>{profileTitle}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 border rounded-full text-[8px] font-bold uppercase ${currentThemeStyle.badge}`}>
                                            {profileMode}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-[10.5px] leading-relaxed max-w-xl">{profileBio}</p>
                                    
                                    <div className="flex gap-4 text-[9.5px] text-slate-500 mt-1">
                                        <span><i className="fa-solid fa-language mr-1"></i> {profileLanguages}</span>
                                        <span><i className="fa-solid fa-location-dot mr-1"></i> {profileAddress.split(',')[1] || profileAddress}</span>
                                    </div>
                                </div>

                                {/* Specialties & Services Grid */}
                                <div className="p-6 flex-grow flex flex-col min-h-0 overflow-y-auto gap-4">
                                    {/* Specialties badging */}
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Clinical Specialties</span>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {profileSpecialties.split(',').map((s, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-white/5 rounded text-[9px] text-slate-300 font-medium">
                                                    {s.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Services selector */}
                                    <div className="space-y-2 flex-grow">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Select Service to Book</span>
                                        
                                        {bookingSuccess ? (
                                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center space-y-2.5 animate-scale-in">
                                                <i className="fa-solid fa-circle-check text-emerald-400 text-2xl"></i>
                                                <div>
                                                    <h4 className="text-xs font-bold text-white">Booking Confirmation Requested!</h4>
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        Successfully requested <strong>{selectedPreviewService?.name}</strong> on <strong>{bookingDate}</strong> at <strong>{bookingTime}</strong>.
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => { setBookingSuccess(false); setSelectedPreviewService(null); }}
                                                    className={`px-3.5 py-1.5 text-[10px] font-bold rounded-lg ${currentThemeStyle.btn}`}
                                                >
                                                    Book Another Session
                                                </button>
                                            </div>
                                        ) : selectedPreviewService ? (
                                            /* Calendar Picker Mock */
                                            <div className="p-4 bg-slate-900/60 border border-white/5 rounded-lg space-y-3 animate-fade-in">
                                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => setSelectedPreviewService(null)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                                                        <span className="text-xs font-bold text-white">{selectedPreviewService.name}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-emerald-400">${selectedPreviewService.fee}</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <label htmlFor="preview-book-date" className="text-[9px] text-slate-500 uppercase block mb-1">Select Date</label>
                                                        <input id="preview-book-date" type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1 text-xs text-white" />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="preview-book-time" className="text-[9px] text-slate-500 uppercase block mb-1">Select Time slot</label>
                                                        <select id="preview-book-time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1 text-xs text-white">
                                                            <option>09:00 AM</option>
                                                            <option>10:00 AM</option>
                                                            <option>11:30 AM</option>
                                                            <option>02:00 PM</option>
                                                            <option>04:00 PM</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => {
                                                        setBookingSuccess(true);
                                                        showToast("Mock appointment request routed to Patient Intake Pool!", "success");
                                                    }}
                                                    className={`w-full py-1.5 text-xs font-bold rounded-lg cursor-pointer ${currentThemeStyle.btn}`}
                                                >
                                                    Submit Booking Request
                                                </button>
                                            </div>
                                        ) : (
                                            /* Services Cards List */
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {[
                                                    { id: 1, name: 'Comprehensive Psychiatric Intake', duration: serviceIntakeTime, fee: serviceIntakeFee, desc: 'Complete assessment & diagnostics.' },
                                                    { id: 2, name: 'Psychopharmacology Follow-up', duration: serviceFollowUpTime, fee: serviceFollowUpFee, desc: 'Dosage adjustments and review.' },
                                                    { id: 3, name: 'CBT Cognitive Restructuring', duration: serviceCbtTime, fee: serviceCbtFee, desc: 'Weekly restructuring worksheets.' },
                                                    { id: 4, name: 'Emergency Crisis Teletherapy', duration: serviceCrisisTime, fee: serviceCrisisFee, desc: 'Stabilization & crisis planning.' }
                                                ].map(srv => (
                                                    <div 
                                                        key={srv.id} 
                                                        onClick={() => setSelectedPreviewService(srv)}
                                                        className={`p-3 bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:${currentThemeStyle.border} rounded-lg cursor-pointer transition-all space-y-1.5 group flex flex-col justify-between`}
                                                    >
                                                        <div>
                                                            <div className="flex justify-between items-start gap-1">
                                                                <h4 className="text-[11px] font-bold text-white group-hover:text-teal-400 transition-colors truncate max-w-[120px]">{srv.name}</h4>
                                                                <span className="text-[10px] font-bold text-emerald-400">${srv.fee}</span>
                                                            </div>
                                                            <p className="text-[9.5px] text-slate-500 line-clamp-2 mt-0.5 leading-normal">{srv.desc}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between border-t border-white/5 pt-1.5 text-[9px] text-slate-500 mt-1">
                                                            <span><i className="fa-solid fa-clock mr-1"></i>{srv.duration} mins</span>
                                                            <span className={`group-hover:translate-x-0.5 transition-transform ${currentThemeStyle.text}`}><i className="fa-solid fa-arrow-right"></i></span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mock Badge Footer */}
                                <div className="px-5 py-3 border-t border-white/5 bg-black/35 flex items-center justify-between text-[9px] text-slate-500">
                                    <span>Powered by PsyPyrus practice website builder.</span>
                                    <span className="flex items-center gap-1"><i className="fa-solid fa-shield-halved text-emerald-500"></i> HIPAA Safe Checkout</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'billing' && (
                    /* Billing Ledger & Payments Tab */
                    <div className="space-y-6 animate-fade-in">
                        {isClinician ? (
                            /* Clinician Invoicing and Payouts Dashboard */
                            <div className="space-y-6">
                                {/* Payout Cards row */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-900/60 border border-white/5 p-4.5 rounded-xl flex flex-col justify-between h-28">
                                        <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                                            <span>Gross Clinic Earnings</span>
                                            <i className="fa-solid fa-sack-dollar text-emerald-400 text-sm"></i>
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-white">${grossEarnings.toFixed(2)}</div>
                                            <p className="text-[9px] text-slate-500 mt-1">Lifetime processed paid billing</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/60 border border-white/5 p-4.5 rounded-xl flex flex-col justify-between h-28">
                                        <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                                            <span>Outstanding Balance</span>
                                            <i className="fa-solid fa-clock text-amber-400 text-sm"></i>
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-white">${outstandingInvoices.toFixed(2)}</div>
                                            <p className="text-[9px] text-slate-500 mt-1">Pending and overdue bills</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/60 border border-white/5 p-4.5 rounded-xl flex flex-col justify-between h-28">
                                        <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                                            <span>Next Stripe Payout</span>
                                            <i className="fa-brands fa-stripe text-indigo-400 text-base"></i>
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-teal-400">${(grossEarnings * 0.97).toFixed(2)}</div>
                                            <p className="text-[9px] text-slate-500 mt-1">Estimated payout on Jun 17, 2026</p>
                                        </div>
                                    </div>

                                    {/* Action Box */}
                                    <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 p-4.5 rounded-xl flex flex-col justify-between h-28">
                                        <div className="text-white text-[11px] font-bold">Issue New Bill / Invoice</div>
                                        <p className="text-[10px] text-slate-400 leading-normal">Generate patient invoice using custom sliding scale rates.</p>
                                        <button 
                                            onClick={() => {
                                                if (patientsList.length > 0) {
                                                    setSelectedInvoicePatientId(String(patientsList[0].id));
                                                }
                                                setShowIssueInvoiceModal(true);
                                            }}
                                            className="w-full py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                                        >
                                            <i className="fa-solid fa-file-invoice"></i>
                                            <span>Issue Invoice</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Invoices Ledger Ledger */}
                                <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-xl">
                                    <h3 className="text-base font-bold text-white mb-4"><i className="fa-solid fa-list-check mr-2 text-teal-400"></i>issued Invoices ledger</h3>
                                    {filteredInvoices.length === 0 ? (
                                        <p className="text-slate-500 text-xs py-4 text-center">No invoices issued yet.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider font-bold">
                                                        <th className="py-2.5">Inv ID</th>
                                                        <th className="py-2.5">Patient Name</th>
                                                        <th className="py-2.5">Service Offering</th>
                                                        <th className="py-2.5">Amount</th>
                                                        <th className="py-2.5">Status</th>
                                                        <th className="py-2.5">Date Issued</th>
                                                        <th className="py-2.5 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 text-slate-300">
                                                    {filteredInvoices.map(inv => (
                                                        <tr key={inv.id} className="hover:bg-white/[0.02]">
                                                            <td className="py-3 font-mono text-slate-500">#{inv.id}</td>
                                                            <td className="py-3 font-semibold text-white">{inv.patientName}</td>
                                                            <td className="py-3 text-slate-400">{inv.serviceName}</td>
                                                            <td className="py-3 font-bold text-slate-200">${inv.amount.toFixed(2)}</td>
                                                            <td className="py-3">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                                    inv.status === 'Paid' 
                                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                                        : inv.status === 'Overdue' 
                                                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                }`}>
                                                                    {inv.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                                                            <td className="py-3 text-right space-x-2.5">
                                                                {inv.status !== 'Paid' ? (
                                                                    <>
                                                                        <button 
                                                                            onClick={() => handleSendInvoiceReminder(inv.id, inv.patientName)}
                                                                            className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                                                                        >
                                                                            Remind
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => {
                                                                                Database.payInvoice(inv.id, 'Cash/Offline Payment Override');
                                                                                showToast(`Invoice #${inv.id} marked as Paid offline.`, "success");
                                                                            }}
                                                                            className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                                                                        >
                                                                            Mark Paid
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => handleDownloadReceipt(inv)}
                                                                        className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer flex items-center gap-1 ml-auto justify-end"
                                                                    >
                                                                        <i className="fa-solid fa-file-pdf"></i>
                                                                        <span>Receipt</span>
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Patient Invoices & Payments View */
                            <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-xl space-y-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <i className="fa-solid fa-wallet text-teal-400"></i>
                                    My Invoices & Billing Statements
                                </h3>
                                {filteredInvoices.length === 0 ? (
                                    <p className="text-slate-500 text-xs py-4 text-center">No statements or bills issued to your account.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider font-bold">
                                                    <th className="py-2.5">Invoice</th>
                                                    <th className="py-2.5">Service Offering</th>
                                                    <th className="py-2.5">Amount</th>
                                                    <th className="py-2.5">Status</th>
                                                    <th className="py-2.5">Date Billed</th>
                                                    <th className="py-2.5 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-slate-300">
                                                {filteredInvoices.map(inv => (
                                                    <tr key={inv.id} className="hover:bg-white/[0.02]">
                                                        <td className="py-3 font-mono text-slate-500">#{inv.id}</td>
                                                        <td className="py-3 font-semibold text-white">{inv.serviceName}</td>
                                                        <td className="py-3 font-bold text-slate-200">${inv.amount.toFixed(2)}</td>
                                                        <td className="py-3">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                                inv.status === 'Paid' 
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                                    : inv.status === 'Overdue' 
                                                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' 
                                                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                            }`}>
                                                                {inv.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                                                        <td className="py-3 text-right">
                                                            {inv.status !== 'Paid' ? (
                                                                <button 
                                                                    onClick={() => { setSelectedPaymentInvoice(inv); setShowPaymentModal(true); }}
                                                                    className="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded text-[11px] transition-colors cursor-pointer"
                                                                >
                                                                    Pay Now
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleDownloadReceipt(inv)}
                                                                    className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                                                                >
                                                                    <i className="fa-solid fa-file-pdf mr-1"></i> Receipt
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- CLINICIAN: ISSUE INVOICE MODAL --- */}
            {showIssueInvoiceModal && (
                <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl text-slate-100">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                <i className="fa-solid fa-file-invoice text-teal-400"></i>
                                Issue Patient Invoice
                            </h3>
                            <button onClick={() => setShowIssueInvoiceModal(false)} className="text-slate-400 hover:text-white">&times;</button>
                        </div>

                        <form onSubmit={handleCreateInvoice} className="space-y-4">
                            <div>
                                <label htmlFor="invoice-patient-select" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Select Patient Chart</label>
                                <select 
                                    id="invoice-patient-select"
                                    value={selectedInvoicePatientId}
                                    onChange={(e) => setSelectedInvoicePatientId(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                >
                                    {patientsList.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (ID #{p.id})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="invoice-service-select" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Select Service Rendered</label>
                                <select 
                                    id="invoice-service-select"
                                    value={selectedInvoiceService}
                                    onChange={(e) => setSelectedInvoiceService(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                >
                                    <option>Comprehensive Psychiatric Intake</option>
                                    <option>Psychopharmacology Follow-up</option>
                                    <option>CBT Cognitive Restructuring Session</option>
                                    <option>Emergency Crisis Teletherapy</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="invoice-amount-input" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Billing Amount ($)</label>
                                <input 
                                    id="invoice-amount-input"
                                    type="number"
                                    value={invoiceAmount}
                                    onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                                />
                                <span className="text-[9px] text-slate-500 mt-1 block">Note: If the patient has an active approved sliding scale pricing agreement, the rate is pre-adjusted automatically.</span>
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowIssueInvoiceModal(false)}
                                    className="px-3 py-1.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
                                >
                                    Send Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- PATIENT: SECURE CHECKOUT PAYMENT MODAL --- */}
            {showPaymentModal && selectedPaymentInvoice && (
                <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl text-slate-100">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <i className="fa-solid fa-shield-halved text-emerald-400"></i>
                                Secure Payment Gateway
                            </h3>
                            <button onClick={() => { if (!isProcessingPayment) setShowPaymentModal(false); }} className="text-slate-400 hover:text-white">&times;</button>
                        </div>

                        {isProcessingPayment ? (
                            <div className="py-8 text-center space-y-4 flex flex-col items-center">
                                <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-teal-400">Establishing Cryptographic Handshake...</h4>
                                    <p className="text-[9px] text-slate-500">AES-GCM-256 secure envelope encryption active.</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleProcessPayment} className="space-y-3.5">
                                <div className="p-3 bg-slate-950/60 rounded-lg border border-white/5 space-y-1">
                                    <span className="text-[9px] text-slate-500 uppercase font-bold">Billing Details</span>
                                    <div className="flex justify-between text-xs text-slate-300">
                                        <span>Service Offering:</span>
                                        <span className="font-semibold text-white">{selectedPaymentInvoice.serviceName}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-300 border-t border-white/5 pt-1.5 mt-1.5">
                                        <span className="font-bold text-white">Amount Billed:</span>
                                        <span className="font-black text-emerald-400">${selectedPaymentInvoice.amount.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <div>
                                        <label htmlFor="card-number-input" className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Credit Card Number</label>
                                        <div className="relative">
                                            <input 
                                                id="card-number-input"
                                                type="text" 
                                                maxLength="19"
                                                placeholder="4111 2222 3333 4444"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                                                className="w-full bg-slate-950 border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono placeholder-slate-600 outline-none focus:border-teal-500"
                                            />
                                            <i className="fa-brands fa-cc-visa absolute right-3 top-2 text-slate-500 text-sm"></i>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-1">
                                            <label htmlFor="card-expiry-input" className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Expiry Date</label>
                                            <input 
                                                id="card-expiry-input"
                                                type="text"
                                                maxLength="5"
                                                placeholder="MM/YY"
                                                value={cardExpiry}
                                                onChange={(e) => setCardExpiry(e.target.value)}
                                                className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white text-center font-mono placeholder-slate-600 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label htmlFor="card-cvv-input" className="text-[9px] uppercase text-slate-500 font-bold block mb-1">CVV Code</label>
                                            <input 
                                                id="card-cvv-input"
                                                type="password"
                                                maxLength="3"
                                                placeholder="***"
                                                value={cardCvv}
                                                onChange={(e) => setCardCvv(e.target.value)}
                                                className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white text-center font-mono placeholder-slate-600 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label htmlFor="card-zip-input" className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Billing ZIP</label>
                                            <input 
                                                id="card-zip-input"
                                                type="text"
                                                maxLength="5"
                                                placeholder="94103"
                                                value={cardZip}
                                                onChange={(e) => setCardZip(e.target.value)}
                                                className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white text-center font-mono placeholder-slate-600 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-2">
                                    <button 
                                        type="submit"
                                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <i className="fa-solid fa-lock"></i>
                                        <span>Confirm Payment (${selectedPaymentInvoice.amount.toFixed(2)})</span>
                                    </button>
                                    <span className="text-[8.5px] text-slate-500 text-center leading-normal">
                                        We support secure, PCI-DSS compliant payments. Credit card details are only handled locally to simulate cryptographic signature vaults.
                                    </span>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
