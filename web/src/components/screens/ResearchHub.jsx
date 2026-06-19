import { useState, useEffect } from 'react';
import { Database } from '../../services/db';
import { useToast } from '../ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';

export function ResearchHub({ activeRole, currentUser }) {
    const toast = useToast();

    // Data lists
    const [studies, setStudies] = useState([]);
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'directory' | 'board'
    
    // Posting state
    const [showPostForm, setShowPostForm] = useState(false);
    const [title, setTitle] = useState('');
    const [institution, setInstitution] = useState('');
    const [pi, setPi] = useState(currentUser?.name || '');
    const [category, setCategory] = useState('Anxiety');
    const [compensation, setCompensation] = useState('');
    const [eligibility, setEligibility] = useState('');
    const [description, setDescription] = useState('');
    const [pipelineStatus, setPipelineStatus] = useState('Open Studies');
    const [postingAs, setPostingAs] = useState('Researcher'); // 'Researcher' | 'Clinician' | 'Institutional Account'

    // Filtering state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Collaboration application modal
    const [collabStudyId, setCollabStudyId] = useState(null);
    const [collabMsg, setCollabMsg] = useState('');

    // Comment input state
    const [commentTexts, setCommentTexts] = useState({});

    const CATEGORIES = ['Anxiety', 'Depression', 'ADHD & Anxiety', 'General Psychiatry', 'Trauma/PTSD', 'Other'];
    const PIPELINE_STATUSES = ['Open Studies', 'In Review', 'Ongoing', 'Completed'];

    const loadData = () => {
        setStudies(Database.getResearchInvites());
    };

    useEffect(() => {
        loadData();
        window.addEventListener('psypyrus_db_change', loadData);
        return () => window.removeEventListener('psypyrus_db_change', loadData);
    }, []);

    // Handlers
    const handleCreateInvite = (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim() || !institution.trim()) {
            toast.showToast("Please complete the Title, Institution, and Description.", "error");
            return;
        }

        const newId = Database.insertResearchInvite({
            title,
            institution,
            category,
            description,
            principalInvestigator: pi || currentUser?.name || "Anonymous Researcher",
            compensation: compensation || "None / Volunteer",
            eligibility: eligibility || "All individuals",
            status: pipelineStatus,
            postingPersona: postingAs
        });

        if (newId) {
            setTitle('');
            setInstitution('');
            setCompensation('');
            setEligibility('');
            setDescription('');
            setShowPostForm(false);
            toast.showToast("Research study invite published successfully!", "success");
        }
    };

    const handleUpvote = (id) => {
        Database.upvoteResearchInvite(id);
        toast.showToast("Upvoted research study!", "success");
    };

    const handleAddComment = (e, studyId) => {
        e.preventDefault();
        const text = commentTexts[studyId] || '';
        if (!text.trim()) return;

        Database.addResearchComment(studyId, {
            userName: currentUser?.name || "User",
            comment: text
        });

        setCommentTexts(prev => ({ ...prev, [studyId]: '' }));
        toast.showToast("Comment posted.", "success");
    };

    const handleOpenCollab = (studyId) => {
        setCollabStudyId(studyId);
        setCollabMsg('');
    };

    const handleSubmitCollab = (e) => {
        e.preventDefault();
        if (!collabMsg.trim()) return;

        Database.applyToResearch(collabStudyId, {
            professionalName: currentUser?.name || "Interested Professional",
            message: collabMsg
        });

        setCollabStudyId(null);
        toast.showToast("Collaboration request submitted successfully!", "success");
    };

    const handleStatusChange = (studyId, nextStatus) => {
        Database.updateResearchInviteStatus(studyId, nextStatus);
        toast.showToast(`Study pipeline advanced to: ${nextStatus}`, "info");
    };

    // Filter logic
    const filteredStudies = studies.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.principalInvestigator.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.institution.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'All' || s.category === filterCategory;
        const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="research-hub-screen p-6 max-w-7xl mx-auto space-y-6">
            {/* Header banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <i className="fa-solid fa-dna text-indigo-400"></i>
                        Research invites & collaboration
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Participate in clinical trials, contribute patient data safely, and track study pipelines across institutions.
                    </p>
                </div>
                <button 
                    onClick={() => setShowPostForm(!showPostForm)}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 self-start"
                >
                    <i className="fa-solid fa-plus"></i>
                    Post Study Invite
                </button>
            </div>

            {/* Posting Form Drawer/Overlay */}
            <AnimatePresence>
                {showPostForm && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-6 rounded-xl overflow-hidden"
                    >
                        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-square-rss text-indigo-400"></i>
                            Publish New Study & Collaboration Invitation
                        </h2>
                        <form onSubmit={handleCreateInvite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3.5">
                                <div>
                                    <label htmlFor="post-study-title" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Study Title</label>
                                    <input 
                                        id="post-study-title"
                                        type="text" 
                                        placeholder="e.g. Cognitive Efficacy of Somatic Breathing Pacing"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="post-study-institution" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Sponsoring Institution</label>
                                    <input 
                                        id="post-study-institution"
                                        type="text" 
                                        placeholder="e.g. Stanford University School of Medicine"
                                        value={institution}
                                        onChange={(e) => setInstitution(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="post-study-pi" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Principal Investigator</label>
                                        <input 
                                            id="post-study-pi"
                                            type="text" 
                                            value={pi}
                                            onChange={(e) => setPi(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="post-study-category" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Study Category</label>
                                        <select 
                                            id="post-study-category"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="post-study-persona" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Posting Persona</label>
                                        <select 
                                            id="post-study-persona"
                                            value={postingAs}
                                            onChange={(e) => setPostingAs(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                        >
                                            <option value="Researcher">Researcher</option>
                                            <option value="Clinician">Clinician</option>
                                            <option value="Institutional Account">Institutional Account</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="post-study-status" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Initial Status</label>
                                        <select 
                                            id="post-study-status"
                                            value={pipelineStatus}
                                            onChange={(e) => setPipelineStatus(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                        >
                                            {PIPELINE_STATUSES.map(stat => (
                                                <option key={stat} value={stat}>{stat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3.5 flex flex-col justify-between">
                                <div>
                                    <label htmlFor="post-study-compensation" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Compensation / Stipend</label>
                                    <input 
                                        id="post-study-compensation"
                                        type="text" 
                                        placeholder="e.g. $50 Stipend + Travel Expense Reimbursement"
                                        value={compensation}
                                        onChange={(e) => setCompensation(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="post-study-eligibility" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Participant Eligibility Criteria</label>
                                    <input 
                                        id="post-study-eligibility"
                                        type="text" 
                                        placeholder="e.g. Ages 18-50, diagnosed with Generalized Anxiety Disorder"
                                        value={eligibility}
                                        onChange={(e) => setEligibility(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="post-study-description" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Detailed Description</label>
                                    <textarea 
                                        id="post-study-description"
                                        rows="3"
                                        placeholder="Objective, procedures, requirements, privacy/HIPAA guardrails..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                    />
                                </div>

                                <div className="flex gap-2 justify-end mt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPostForm(false)}
                                        className="px-3 py-1.5 text-slate-400 hover:text-white text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded"
                                    >
                                        Publish Study Invitation
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation tabs for different layouts */}
            <div className="flex border-b border-white/5 gap-2">
                <button 
                    onClick={() => setActiveTab('feed')}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${activeTab === 'feed' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-list mr-1.5"></i>
                    Social Feed View
                </button>
                <button 
                    onClick={() => setActiveTab('directory')}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${activeTab === 'directory' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-folder-open mr-1.5"></i>
                    Searchable Directory
                </button>
                <button 
                    onClick={() => setActiveTab('board')}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${activeTab === 'board' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-table-columns mr-1.5"></i>
                    Kanban Board Pipeline
                </button>
            </div>

            {/* Main Switchboard */}
            {activeTab === 'feed' && (
                <div className="space-y-6">
                    {studies.length === 0 ? (
                        <p className="text-center text-slate-500 text-xs py-8">No research invites posted yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {studies.map(study => (
                                <div key={study.id} className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-5 rounded-xl space-y-4 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] rounded-full font-bold uppercase tracking-wide">
                                                    {study.category}
                                                </span>
                                                <h3 className="text-base font-bold text-white mt-1.5">{study.title}</h3>
                                                <div className="text-[10px] text-slate-400">{study.institution}</div>
                                            </div>
                                            <button 
                                                onClick={() => handleUpvote(study.id)}
                                                aria-label="Upvote study"
                                                className="flex flex-col items-center justify-center p-2 bg-slate-950/40 border border-white/5 hover:border-indigo-500/30 rounded text-slate-400 hover:text-indigo-400 transition-all"
                                            >
                                                <i className="fa-solid fa-chevron-up text-[10px]"></i>
                                                <span className="text-[11px] font-bold mt-0.5">{study.upvotes || 0}</span>
                                            </button>
                                        </div>

                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            {study.description}
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/40 p-2.5 rounded border border-white/5">
                                            <div>
                                                <span className="text-slate-500 font-bold uppercase block text-[8px]">Principal Investigator</span>
                                                <span className="text-slate-300">{study.principalInvestigator}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 font-bold uppercase block text-[8px]">Compensation</span>
                                                <span className="text-emerald-400 font-semibold">{study.compensation}</span>
                                            </div>
                                            <div className="col-span-2 pt-1 border-t border-white/5">
                                                <span className="text-slate-500 font-bold uppercase block text-[8px]">Eligibility</span>
                                                <span className="text-slate-300 line-clamp-1">{study.eligibility}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comments & Collaboration Trigger */}
                                    <div className="space-y-3 pt-3 border-t border-white/5">
                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <span>
                                                <i className="fa-solid fa-comments mr-1"></i>
                                                {study.comments?.length || 0} Comments
                                            </span>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleOpenCollab(study.id)}
                                                    className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] rounded font-semibold transition-all"
                                                >
                                                    <i className="fa-solid fa-handshake mr-1"></i>
                                                    Collaborate / Apply
                                                </button>
                                            </div>
                                        </div>

                                        {/* Render Comments */}
                                        {study.comments && study.comments.length > 0 && (
                                            <div className="space-y-2 max-h-32 overflow-y-auto bg-slate-950/20 p-2 rounded border border-white/5">
                                                {study.comments.map(c => (
                                                    <div key={c.id} className="text-[11px] text-slate-300 bg-slate-950/30 p-1.5 rounded border border-white/5">
                                                        <strong className="text-white mr-1">{c.userName}:</strong>
                                                        {c.comment}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <form onSubmit={(e) => handleAddComment(e, study.id)} className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Ask a question about this study..."
                                                value={commentTexts[study.id] || ''}
                                                onChange={(e) => {
                                                    const text = e.target.value;
                                                    setCommentTexts(prev => ({ ...prev, [study.id]: text }));
                                                }}
                                                className="flex-grow bg-slate-950 border border-white/10 rounded px-2.5 py-1 text-[11px] text-white"
                                            />
                                            <button 
                                                type="submit"
                                                className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded"
                                            >
                                                Send
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'directory' && (
                <div className="space-y-4">
                    {/* Filters bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/40 border border-white/5 p-4 rounded-xl">
                        <div>
                            <label htmlFor="search-directory-input" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Search Study Directory</label>
                            <input 
                                id="search-directory-input"
                                type="text"
                                placeholder="Search by title, investigator, institution..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="category-filter-select" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Category Filter</label>
                            <select 
                                id="category-filter-select"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                            >
                                <option value="All">All Categories</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status-filter-select" className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Pipeline Status</label>
                            <select 
                                id="status-filter-select"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                            >
                                <option value="All">All Pipeline Stages</option>
                                {PIPELINE_STATUSES.map(stat => (
                                    <option key={stat} value={stat}>{stat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Directory Listings */}
                    <div className="bg-slate-900/60 border border-white/5 rounded-xl overflow-hidden">
                        {filteredStudies.length === 0 ? (
                            <p className="text-center text-slate-500 text-xs py-8">No studies matching the search filters found.</p>
                        ) : (
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 text-slate-500 uppercase font-bold">
                                        <th className="p-3">Study / Institution</th>
                                        <th className="p-3">PI</th>
                                        <th className="p-3">Compensation</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-300">
                                    {filteredStudies.map(s => (
                                        <tr key={s.id} className="hover:bg-white/[0.02]">
                                            <td className="p-3">
                                                <div className="font-semibold text-white">{s.title}</div>
                                                <div className="text-[10px] text-slate-500">{s.institution}</div>
                                            </td>
                                            <td className="p-3 text-slate-400">{s.principalInvestigator}</td>
                                            <td className="p-3 font-medium text-emerald-400">{s.compensation}</td>
                                            <td className="p-3">
                                                <span className="px-2 py-0.5 bg-indigo-500/5 text-indigo-400 rounded-full text-[9px] border border-indigo-500/10">
                                                    {s.category}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] border font-bold ${
                                                    s.status === 'Open Studies' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    s.status === 'In Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    s.status === 'Ongoing' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button 
                                                    onClick={() => handleOpenCollab(s.id)}
                                                    className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded text-[10px]"
                                                >
                                                    Interested
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'board' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {PIPELINE_STATUSES.map(colName => {
                        const colStudies = studies.filter(s => s.status === colName);
                        return (
                            <div key={colName} className="bg-slate-950/40 border border-white/5 rounded-xl p-4 flex flex-col space-y-3 min-h-[450px]">
                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${
                                            colName === 'Open Studies' ? 'bg-emerald-400' :
                                            colName === 'In Review' ? 'bg-amber-400' :
                                            colName === 'Ongoing' ? 'bg-sky-400' : 'bg-slate-500'
                                        }`}></span>
                                        {colName}
                                    </h3>
                                    <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-1.5 py-0.5 rounded-full">{colStudies.length}</span>
                                </div>

                                <div className="flex-grow space-y-3 overflow-y-auto">
                                    {colStudies.map(s => (
                                        <div key={s.id} className="p-3.5 bg-slate-900/80 border border-white/5 rounded-lg space-y-2 shadow-lg hover:border-indigo-500/20 transition-all">
                                            <div className="text-[10px] font-semibold text-indigo-400">{s.category}</div>
                                            <h4 className="text-xs font-bold text-white leading-tight">{s.title}</h4>
                                            <div className="text-[9px] text-slate-500 truncate">{s.institution}</div>
                                            <div className="text-[9px] text-emerald-400 font-medium">Stipend: {s.compensation}</div>

                                            {/* Advance study state selector */}
                                            {activeRole !== 'Patient' && (
                                                <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                                    <span className="text-[8px] text-slate-500 uppercase font-bold">Move Pipeline</span>
                                                    <select 
                                                        value={s.status}
                                                        onChange={(e) => handleStatusChange(s.id, e.target.value)}
                                                        aria-label="Status"
                                                        className="bg-slate-950 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-slate-300"
                                                    >
                                                        {PIPELINE_STATUSES.map(st => (
                                                            <option key={st} value={st}>{st}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Collaboration Request Dialog */}
            <AnimatePresence>
                {collabStudyId !== null && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                                    <i className="fa-solid fa-handshake-angle text-indigo-400"></i>
                                    Request Study Collaboration
                                </h3>
                                <button onClick={() => setCollabStudyId(null)} className="text-slate-500 hover:text-white">
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <p className="text-xs text-slate-400">
                                Send a message to the Principal Investigator describing how you would like to collaborate or why you are applying to participate.
                            </p>
                            <form onSubmit={handleSubmitCollab} className="space-y-3.5">
                                <textarea 
                                    rows="4"
                                    placeholder="Write a message detail your research goals, available datasets, or eligibility factors..."
                                    value={collabMsg}
                                    onChange={(e) => setCollabMsg(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button 
                                        type="button" 
                                        onClick={() => setCollabStudyId(null)}
                                        className="px-3 py-1.5 text-slate-400 hover:text-white text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded"
                                    >
                                        Submit Request
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
