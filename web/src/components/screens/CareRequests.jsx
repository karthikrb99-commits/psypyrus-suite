import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database } from '../../services/db';

export function CareRequests({ activeRole, currentUser }) {
    const [requests, setRequests] = useState([]);
    
    // Patient Form State
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('Stress & Burnout');
    const [newSeverity, setNewSeverity] = useState('Moderate');
    const [newDescription, setNewDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Clinician Search/Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterSeverity, setFilterSeverity] = useState('All');
    
    // Clinician Proposal Input State
    const [selectedReqIdForOffer, setSelectedReqIdForOffer] = useState(null);
    const [proposalMessage, setProposalMessage] = useState('');

    const CATEGORIES = [
        'Stress & Burnout',
        'Anxiety',
        'Depression',
        'Trauma/PTSD',
        'ADHD/Executive Function',
        'Relationship',
        'Other'
    ];

    const SEVERITIES = ['Mild', 'Moderate', 'Severe'];

    // Load care requests and listen to database changes
    const loadRequests = () => {
        const allRequests = Database.getCareRequests();
        if (activeRole === 'Patient') {
            // Patient user should only see their own requests
            const patientIdStr = String(currentUser.id).replace('patient_', '');
            const filtered = allRequests.filter(r => String(r.patientId) === patientIdStr);
            setRequests(filtered);
        } else {
            // Professionals can see all requests
            setRequests(allRequests);
        }
    };

    useEffect(() => {
        loadRequests();
        window.addEventListener('psypyrus_db_change', loadRequests);
        return () => window.removeEventListener('psypyrus_db_change', loadRequests);
    }, [activeRole, currentUser]);

    // Handle Patient Submission
    const handlePostRequest = (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newDescription.trim()) {
            alert("Please provide both a title and a detailed description.");
            return;
        }

        setIsSubmitting(true);
        const patientIdStr = String(currentUser.id).replace('patient_', '');
        
        const reqId = Database.insertCareRequest({
            patientId: Number(patientIdStr) || 1,
            patientName: currentUser.name || "Patient",
            title: newTitle,
            category: newCategory,
            severity: newSeverity,
            description: newDescription
        });

        if (reqId) {
            setNewTitle('');
            setNewDescription('');
            // Trigger a toast notification event
            window.dispatchEvent(new CustomEvent('psypyrus_toast', {
                detail: { message: "Support request posted successfully to Clinical Pool!", type: "success" }
            }));
        }
        setIsSubmitting(false);
    };

    // Handle Clinician Sending Offer
    const handleSendOffer = (e, reqId) => {
        e.preventDefault();
        if (!proposalMessage.trim()) {
            alert("Please enter a message for your clinical proposal.");
            return;
        }

        const success = Database.addOfferToCareRequest(reqId, {
            professionalId: currentUser.id,
            professionalName: currentUser.name,
            message: proposalMessage
        });

        if (success !== false) {
            setProposalMessage('');
            setSelectedReqIdForOffer(null);
            window.dispatchEvent(new CustomEvent('psypyrus_toast', {
                detail: { message: "Clinical proposal submitted to patient!", type: "success" }
            }));
        } else {
            alert("You have already submitted an offer for this request.");
        }
    };

    // Handle Patient Accepting Offer
    const handleAcceptOffer = (reqId, offerId, offerName) => {
        if (window.confirm(`Accept services from ${offerName} and schedule an initial session?`)) {
            const apptId = Database.acceptOffer(reqId, offerId);
            if (apptId) {
                window.dispatchEvent(new CustomEvent('psypyrus_toast', {
                    detail: { message: `Matched successfully! Session scheduled with ${offerName}.`, type: "success" }
                }));
            }
        }
    };

    // Helpers
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Stress & Burnout': return 'fa-fire-alt text-amber-400';
            case 'Anxiety': return 'fa-wind text-sky-400';
            case 'Depression': return 'fa-cloud-showers-heavy text-indigo-400';
            case 'Trauma/PTSD': return 'fa-heart-broken text-rose-400';
            case 'ADHD/Executive Function': return 'fa-brain text-purple-400';
            case 'Relationship': return 'fa-user-friends text-emerald-400';
            default: return 'fa-question-circle text-slate-400';
        }
    };

    const getCategoryClass = (category) => {
        switch (category) {
            case 'Stress & Burnout': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'Anxiety': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
            case 'Depression': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'Trauma/PTSD': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'ADHD/Executive Function': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'Relationship': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getSeverityClass = (severity) => {
        switch (severity) {
            case 'Severe': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'Moderate': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'Mild': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Open': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
            case 'Offer Received': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'Connected': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    // Filters for Clinicians
    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              req.patientName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'All' || req.category === filterCategory;
        const matchesSeverity = filterSeverity === 'All' || req.severity === filterSeverity;
        return matchesSearch && matchesCategory && matchesSeverity;
    });

    return (
        <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full max-w-7xl mx-auto w-full">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <i className="fa-solid fa-hand-holding-heart text-teal-400"></i>
                        {activeRole === 'Patient' ? 'My Support Requests' : 'Patient Care & Intake Pool'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {activeRole === 'Patient' 
                            ? 'Submit and manage descriptions of what you are experiencing. Clinicians can review and reach out.'
                            : 'Review clinical complaints posted by patients. Submit custom service proposals to connect with them.'
                        }
                    </p>
                </div>
                {activeRole === 'Professional' && (
                    <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 px-3 py-1.5 rounded-lg text-xs">
                        <i className="fa-solid fa-user-shield text-teal-400"></i>
                        <span className="text-slate-300 font-semibold">HIPAA Protected Clinical Access Only</span>
                    </div>
                )}
            </div>

            {activeRole === 'Patient' ? (
                // --- Patient Layout ---
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left: Form to Post */}
                    <div className="lg:col-span-1 bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-edit text-teal-400"></i>
                            Post Support Request
                        </h2>
                        <form onSubmit={handlePostRequest} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Brief Title / Topic</label>
                                <input 
                                    type="text" 
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. Managing career transition anxiety"
                                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                                    <select 
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                                    >
                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Severity Indicator</label>
                                    <select 
                                        value={newSeverity}
                                        onChange={(e) => setNewSeverity(e.target.value)}
                                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
                                    >
                                        {SEVERITIES.map(sev => <option key={sev} value={sev}>{sev}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Describe What You Are Going Through</label>
                                <textarea 
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    placeholder="Provide details about your symptoms, duration, triggers, and what kind of therapeutic help you are seeking. Your anonymity is maintained relative to public users; only verified doctors and therapists can view this."
                                    rows={5}
                                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 resize-none"
                                    required
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer hover:shadow-glow transition-all"
                            >
                                {isSubmitting ? 'Posting...' : 'Submit to Intake Pool'}
                            </button>
                        </form>
                    </div>

                    {/* Right: List of submitted requests */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <i className="fa-solid fa-list text-teal-400"></i>
                            My Active Support Requests ({requests.length})
                        </h2>

                        {requests.length === 0 ? (
                            <div className="bg-slate-900/40 border border-dashed border-white/5 rounded-2xl p-8 text-center text-slate-500">
                                <i className="fa-solid fa-folder-open text-2xl mb-2"></i>
                                <p className="text-sm">You haven't posted any support requests yet. Use the form to submit one.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {requests.map((req) => (
                                    <div key={req.id} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-sm font-bold text-white">{req.title}</h3>
                                                <span className="text-[10px] text-slate-500 font-semibold">Posted {new Date(req.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityClass(req.severity)}`}>
                                                    {req.severity}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryClass(req.category)}`}>
                                                    <i className={`fa-solid ${getCategoryIcon(req.category)} mr-1`}></i>
                                                    {req.category}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusClass(req.status)}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                            {req.description}
                                        </p>

                                        {/* Offers section */}
                                        <div className="border-t border-white/5 pt-4 mt-1">
                                            <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                                                <i className="fa-solid fa-user-doctor text-teal-400"></i>
                                                Professional Offers & Proposals ({req.offers?.length || 0})
                                            </h4>

                                            {(!req.offers || req.offers.length === 0) ? (
                                                <p className="text-xs text-slate-500 italic">Pending review by clinic professionals. You will see proposals here once they reach out.</p>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    {req.offers.map((offer) => (
                                                        <div 
                                                            key={offer.id} 
                                                            className={`border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                                                                offer.status === 'Accepted'
                                                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                                                    : offer.status === 'Declined'
                                                                    ? 'bg-slate-950/20 border-white/5 opacity-50'
                                                                    : 'bg-slate-950/60 border-white/5 hover:border-teal-500/20'
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/25 flex items-center justify-center font-bold text-teal-400 text-xs mt-0.5">
                                                                    {offer.professionalName.split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <strong className="text-xs text-white">{offer.professionalName}</strong>
                                                                        <span className="text-[9px] text-slate-500">{new Date(offer.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-300 leading-relaxed mt-1">{offer.message}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 self-end sm:self-center">
                                                                {offer.status === 'Accepted' ? (
                                                                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                                                        <i className="fa-solid fa-circle-check"></i> Connected & Scheduled
                                                                    </span>
                                                                ) : offer.status === 'Declined' ? (
                                                                    <span className="text-xs text-slate-500">Declined</span>
                                                                ) : req.status === 'Connected' ? (
                                                                    <span className="text-[10px] text-slate-500 italic">Matched with other clinician</span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleAcceptOffer(req.id, offer.id, offer.professionalName)}
                                                                        className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-all hover:shadow-glow"
                                                                    >
                                                                        Accept & Book
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // --- Professional Layout ---
                <div className="flex flex-col gap-4">
                    {/* Filter controls */}
                    <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 w-full max-w-md">
                            <i className="fa-solid fa-magnifying-glass text-slate-500"></i>
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by patient name or request keywords..."
                                className="w-full bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-400">Category:</span>
                                <select 
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500/50"
                                >
                                    <option value="All">All Categories</option>
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-400">Severity:</span>
                                <select 
                                    value={filterSeverity}
                                    onChange={(e) => setFilterSeverity(e.target.value)}
                                    className="bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500/50"
                                >
                                    <option value="All">All Severities</option>
                                    {SEVERITIES.map(sev => <option key={sev} value={sev}>{sev}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Feed count */}
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs text-slate-400">Showing <strong>{filteredRequests.length}</strong> active patient intakes</span>
                    </div>

                    {/* Request Grid/List */}
                    {filteredRequests.length === 0 ? (
                        <div className="bg-slate-900/30 border border-dashed border-white/5 rounded-2xl p-12 text-center text-slate-500">
                            <i className="fa-solid fa-heart-crack text-3xl mb-2 text-slate-600"></i>
                            <p className="text-sm">No care requests match your criteria or are currently pending review.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredRequests.map((req) => {
                                const clinicianOffer = req.offers?.find(o => o.professionalId === currentUser.id);
                                const otherOffersCount = (req.offers?.length || 0) - (clinicianOffer ? 1 : 0);

                                return (
                                    <div 
                                        key={req.id} 
                                        className={`bg-slate-900/60 border border-white/5 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4 justify-between transition-all ${
                                            req.status === 'Connected' ? 'opacity-70 border-emerald-500/10' : ''
                                        }`}
                                    >
                                        <div className="flex flex-col gap-3">
                                            {/* Top Metadata */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-950/80 border border-white/5 flex items-center justify-center font-bold text-slate-300 text-xs">
                                                        {req.patientName.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <strong className="text-xs text-white">{req.patientName}</strong>
                                                        <span className="text-[9px] text-slate-500">Submitted {new Date(req.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getSeverityClass(req.severity)}`}>
                                                        {req.severity}
                                                    </span>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryClass(req.category)}`}>
                                                        <i className={`fa-solid ${getCategoryIcon(req.category)} mr-1`}></i>
                                                        {req.category}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Problem Title & Body */}
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-200 mt-1">{req.title}</h3>
                                                <p className="text-xs text-slate-400 mt-2 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5 min-h-[90px]">
                                                    {req.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions & Proposals */}
                                        <div className="border-t border-white/5 pt-4 mt-2 flex flex-col gap-3">
                                            {clinicianOffer ? (
                                                <div className="bg-teal-500/5 border border-teal-500/15 rounded-xl p-3 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-teal-400 font-bold flex items-center gap-1">
                                                            <i className="fa-solid fa-circle-check"></i> Your Proposal Sent
                                                        </span>
                                                        <span className="text-[9px] text-slate-500">{new Date(clinicianOffer.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-300 italic">"{clinicianOffer.message}"</p>
                                                    <div className="text-[9px] text-slate-500 text-right mt-1">
                                                        Status: <strong>{clinicianOffer.status}</strong>
                                                    </div>
                                                </div>
                                            ) : req.status === 'Connected' ? (
                                                <div className="text-center bg-slate-950/30 rounded-xl p-3 border border-white/5">
                                                    <span className="text-xs text-slate-500 italic">Patient matched with another clinician</span>
                                                </div>
                                            ) : selectedReqIdForOffer === req.id ? (
                                                <form onSubmit={(e) => handleSendOffer(e, req.id)} className="flex flex-col gap-2.5">
                                                    <textarea
                                                        value={proposalMessage}
                                                        onChange={(e) => setProposalMessage(e.target.value)}
                                                        placeholder="Write a warm, professional introduction message detailing how you can help..."
                                                        rows={3}
                                                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 resize-none"
                                                        required
                                                    />
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedReqIdForOffer(null)}
                                                            className="text-slate-400 hover:text-white text-[10px] px-3 py-1 rounded-lg cursor-pointer"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-all hover:shadow-glow"
                                                        >
                                                            Send Proposal
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-[10px] text-slate-500 italic">
                                                        {otherOffersCount > 0 
                                                            ? `${otherOffersCount} clinician offer${otherOffersCount > 1 ? 's' : ''} pending`
                                                            : 'No clinical offers yet'
                                                        }
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReqIdForOffer(req.id);
                                                            setProposalMessage('');
                                                        }}
                                                        className="bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-slate-950 border border-teal-500/20 hover:border-transparent text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-all"
                                                    >
                                                        Offer Clinical Services
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
