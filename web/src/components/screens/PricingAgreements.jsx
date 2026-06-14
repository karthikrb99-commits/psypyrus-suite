import { useState, useEffect } from 'react';
import { Database } from '../../services/db';
import { useToast } from '../ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';

export function PricingAgreements({ activeRole, currentUser }) {
    const { showToast } = useToast();
    
    // DB state
    const [agreements, setAgreements] = useState([]);
    const [appointments, setAppointments] = useState([]);

    // Clinician settings state (stored in localstorage for persistence)
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

    const CLINICIANS = [
        { id: 'dr_liam', name: 'Dr. Liam Carter', specialty: 'General Psychiatry' },
        { id: 'dr_katherine', name: 'Dr. Katherine Brewster', specialty: 'ADHD Specialist' },
        { id: 'dr_sarah', name: 'Dr. Sarah Jenkins', specialty: 'Anxiety & Trauma' }
    ];

    const loadData = () => {
        setAgreements(Database.getPricingAgreements());
        setAppointments(Database.getAppointments());
    };

    useEffect(() => {
        loadData();
        window.addEventListener('psypyrus_db_change', loadData);
        return () => window.removeEventListener('psypyrus_db_change', loadData);
    }, []);

    // Save clinician settings
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

    // Clinician action handlers
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
        const success = Database.updatePricingAgreement(counterAgreementId, 'Countered', Number(counterFee), counterMsg || "Clinician counter propuesta.");
        if (success) {
            setCounterAgreementId(null);
            showToast("Counter offer submitted to patient.", "success");
        }
    };

    // Patient accepts counter
    const handleAcceptCounter = (agreementId) => {
        const success = Database.updatePricingAgreement(agreementId, 'Approved');
        if (success) {
            showToast("Accepted counter-proposed rate!", "success");
        }
    };

    // Patient declines counter
    const handleDeclineCounter = (agreementId) => {
        const success = Database.updatePricingAgreement(agreementId, 'Rejected');
        if (success) {
            showToast("Declined counter rate.", "info");
        }
    };

    // Filtering active/pending lists
    const patientIdVal = Number(String(currentUser.id).replace('patient_', '')) || 1;
    const isClinician = activeRole === 'Professional';

    const filteredAgreements = agreements.filter(ag => {
        if (isClinician) {
            return true; // Clinician views all (since we have one clinician persona in professional mode)
        } else {
            return ag.patientId === patientIdVal;
        }
    });

    const pendingRequests = filteredAgreements.filter(ag => ag.status === 'Pending' || ag.status === 'Countered');
    const activeAgreements = filteredAgreements.filter(ag => ag.status === 'Approved');

    return (
        <div className="pricing-accessibility-screen p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <i className="fa-solid fa-file-invoice-dollar text-teal-400"></i>
                        Pricing & Accessibility Hub
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Manage interactive sliding scale negotiations, pro bono session allocations, and student/low-income verifications.
                    </p>
                </div>
                <div className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs rounded-full font-semibold">
                    {isClinician ? "Professional Workspace" : "Patient Access Panel"}
                </div>
            </div>

            {isClinician ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Min Rate ($)</label>
                                        <input 
                                            type="number" 
                                            value={minRate}
                                            onChange={(e) => setMinRate(Number(e.target.value))}
                                            className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Max Rate ($)</label>
                                        <input 
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
                                        <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Monthly Free Sessions Limit</label>
                                        <input 
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
                                className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-semibold rounded transition-all mt-2"
                            >
                                Update Accessibility Policies
                            </button>
                        </form>
                    </div>

                    {/* Clinician View: Request Queue & Active Agreements */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Pending Negotiations */}
                        <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-xl">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-comments-dollar text-amber-400"></i>
                                Pending Rate Negotiations & Pro Bono Claims
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
                                                    <span>Declared Income: <strong className="text-slate-200">${req.incomeDeclared}/mo</strong></span>
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
                                                        className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs rounded transition-all"
                                                    >
                                                        Decline
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenCounter(req)}
                                                        className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-xs rounded transition-all"
                                                    >
                                                        Counter Rate
                                                    </button>
                                                    <button 
                                                        onClick={() => handleApprove(req.id)}
                                                        className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs rounded transition-all"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            )}

                                            {counterAgreementId === req.id && (
                                                <form onSubmit={handleSendCounter} className="p-3 bg-slate-900 border border-amber-500/20 rounded-md space-y-3">
                                                    <div className="text-xs font-bold text-amber-400">Counter-Propose Rate</div>
                                                    <div className="grid grid-cols-3 gap-2 items-center">
                                                        <div className="col-span-1">
                                                            <label className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Counter Fee ($)</label>
                                                            <input 
                                                                type="number"
                                                                value={counterFee}
                                                                onChange={(e) => setCounterFee(Number(e.target.value))}
                                                                className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Message to Patient</label>
                                                            <input 
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
                                                            className="px-2.5 py-1 text-slate-400 hover:text-white text-xs"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button 
                                                            type="submit"
                                                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded transition-all"
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

                        {/* Active Agreements */}
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
                /* Patient Interface */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Apply for Sliding Scale Form */}
                    <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-xl space-y-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <i className="fa-solid fa-signature text-teal-400"></i>
                            Request Special Pricing
                        </h2>
                        <form onSubmit={handlePostRequest} className="space-y-3.5">
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Select Therapist</label>
                                <select 
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
                                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Accessibility Tier</label>
                                <select 
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
                                    <label className="text-[10px] uppercase text-slate-500 font-bold flex justify-between mb-1">
                                        <span>Proposed Fee / Session</span>
                                        <span className="text-teal-400">${proposedFee}</span>
                                    </label>
                                    <input 
                                        type="range"
                                        min="30"
                                        max="120"
                                        value={proposedFee}
                                        onChange={(e) => setProposedFee(Number(e.target.value))}
                                        className="w-full accent-teal-500"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-500">
                                        <span>$30</span>
                                        <span>$120</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Declared Monthly Income ($) (Optional)</label>
                                <input 
                                    type="number"
                                    placeholder="e.g. 1200"
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
                                        <div className="text-[10px] text-slate-400">Click to upload Student ID or Income Declaration PDF</div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Justification Message</label>
                                <textarea 
                                    rows="3"
                                    placeholder="Brief explanation of your financial situation or student status..."
                                    value={justification}
                                    onChange={(e) => setJustification(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs rounded transition-all"
                            >
                                Submit Pricing Proposal
                            </button>
                        </form>
                    </div>

                    {/* Patient View: Active Agreements & Negotiation History */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Active Agreements */}
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

                        {/* Pending Claims / Counter History */}
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
                                                            className="px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs rounded transition-all"
                                                        >
                                                            Decline Counter
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAcceptCounter(req.id)}
                                                            className="px-2.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs rounded transition-all"
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
        </div>
    );
}
