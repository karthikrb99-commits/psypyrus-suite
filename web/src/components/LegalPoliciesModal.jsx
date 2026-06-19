import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LegalPoliciesModal({ isOpen, onClose, initialTab = 'privacy' }) {
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, initialTab]);

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'privacy', label: 'Privacy Policy', icon: 'fa-shield-halved' },
        { id: 'terms', label: 'Terms of Use', icon: 'fa-file-contract' },
        { id: 'guidelines', label: 'Community Guidelines', icon: 'fa-users' },
        { id: 'copyright', label: 'Copyright Policy', icon: 'fa-copyright' }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 print:p-0 print:static print:inset-auto" id="legal-policies-modal">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm print:hidden"
                />

                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="relative w-full max-w-5xl h-[85vh] print:h-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 print:border-none print:shadow-none print:bg-white print:text-black"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 print:hidden">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-gavel text-teal-400 text-lg"></i>
                            <div>
                                <h2 className="text-base font-bold text-white tracking-wide">PsyPyrus Legal & Compliance</h2>
                                <p className="text-[10px] text-slate-400">Review official legal agreements, privacy safeguards, and user charters</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handlePrint}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                                title="Print this agreement"
                            >
                                <i className="fa-solid fa-print"></i>
                                <span>Print</span>
                            </button>
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>
                    </div>

                    {/* Main Layout Grid */}
                    <div className="flex-grow flex overflow-hidden print:block print:overflow-visible">
                        {/* Sidebar Tabs */}
                        <div className="w-64 border-r border-white/10 bg-slate-900/30 p-4 flex flex-col gap-1.5 overflow-y-auto print:hidden">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Legal Sections</span>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                                        activeTab === tab.id 
                                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-[inset_0_0_8px_rgba(20,184,166,0.1)]' 
                                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                                    }`}
                                >
                                    <i className={`fa-solid ${tab.icon} text-[14px]`}></i>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                            <div className="mt-auto p-3 bg-slate-950/40 rounded-xl border border-white/5 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-[10px] text-teal-400 font-bold">
                                    <i className="fa-solid fa-shield-halved"></i>
                                    <span>Compliance Shield</span>
                                </div>
                                <p className="text-[9px] text-slate-500 leading-relaxed">
                                    All policies conform with HIPAA Privacy Rules, GDPR data access protocols, and state medical records laws.
                                </p>
                            </div>
                        </div>

                        {/* Content Pane */}
                        <div className="flex-grow p-6 overflow-y-auto bg-slate-950/20 print:p-0 print:bg-white print:text-black">
                            <div className="max-w-3xl mx-auto space-y-6 print:max-w-none print:space-y-8">
                                {activeTab === 'privacy' && <PrivacyPolicyContent />}
                                {activeTab === 'terms' && <TermsOfUseContent />}
                                {activeTab === 'guidelines' && <CommunityGuidelinesContent />}
                                {activeTab === 'copyright' && <CopyrightPolicyContent />}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function PrivacyPolicyContent() {
    return (
        <article className="space-y-4 text-slate-300 leading-relaxed text-xs print:text-black">
            <h1 className="text-xl font-bold text-white border-b border-white/10 pb-2 print:text-black print:border-black">Privacy Policy</h1>
            <p className="text-[10px] text-slate-400 italic">Last Updated: June 15, 2026</p>
            
            <p>
                PsyPyrus AI OS ("we," "our," or "the Platform") is committed to protecting the privacy and security of our practitioners and patients. This Privacy Policy outlines how we process patient health information, therapist records, and diagnostic transcripts in accordance with global healthcare regulations.
            </p>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">1. Regulatory Compliance (HIPAA & GDPR)</h2>
            <p>
                PsyPyrus is designed to meet the administrative, physical, and technical safeguard requirements of the <strong>Health Insurance Portability and Accountability Act (HIPAA)</strong> and the <strong>General Data Protection Regulation (GDPR)</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1">
                <li><strong>Protected Health Information (PHI)</strong> is isolated and encrypted using AES-GCM-256 both in transit and at rest.</li>
                <li>Patients maintain the right to inspect, amend, and restrict disclosure of their medical records under HIPAA rules and GDPR Article 15 (Right of Access).</li>
                <li>Business Associate Agreements (BAAs) are maintained with all cloud infrastructure partners supporting database sync elements.</li>
            </ul>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">2. Cryptographic Security & Local Vaults</h2>
            <p>
                By default, PsyPyrus stores all clinical records inside local, cryptographically sealed database vaults. These vaults are encrypted using individual hardware-backed keys.
            </p>
            <ul className="list-disc pl-5 space-y-1">
                <li>All biometric authentication prompts (fingerprint, FaceID) trigger local cryptographic handshakes and do not transit biometric vectors to our servers.</li>
                <li>Session security is maintained with automatic timeouts and a quick-lock shortcut (Ctrl+L) that flushes in-memory decryption tokens instantly.</li>
            </ul>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">3. AI-Scribe & Transcription Consent</h2>
            <p>
                The AI SOAP Notes Copilot processes telehealth audio feeds to generate clinical notes.
            </p>
            <ul className="list-disc pl-5 space-y-1">
                <li><strong>Informed Consent:</strong> Clinicians must obtain explicit verbal or written consent from patients before activating session transcription.</li>
                <li><strong>Data Processing:</strong> Audio streams are processed in memory and immediately discarded after synthesis. We enforce a strict <strong>zero-retention policy</strong> for audio recordings.</li>
                <li><strong>No Model Training:</strong> Clinical transcripts, SOAP drafts, and diagnostic assessments are never used to train global AI models.</li>
            </ul>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">4. Telehealth & Communication Privacy</h2>
            <p>
                All video and audio teletherapy sessions utilize secure, end-to-end encrypted WebRTC channels. Session data passes directly between clinician and patient, with zero server-side recording or intermediate caching of audio/video packets.
            </p>
        </article>
    );
}

function TermsOfUseContent() {
    return (
        <article className="space-y-4 text-slate-300 leading-relaxed text-xs print:text-black">
            <h1 className="text-xl font-bold text-white border-b border-white/10 pb-2 print:text-black print:border-black">Terms of Use</h1>
            <p className="text-[10px] text-slate-400 italic">Last Updated: June 15, 2026</p>
            
            <p>
                Welcome to PsyPyrus AI OS. By accessing or using our clinical operating system companion, desktop apps, or patient wellness lounge, you agree to comply with and be bound by the following Terms of Use.
            </p>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">1. Medical & Clinical Disclaimer</h2>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 print:text-black print:border-black">
                <strong>CRITICAL NOTICE:</strong> PsyPyrus AI OS is a clinical decision support system (CDSS) and practice management tool. It is NOT a substitute for professional clinical judgment, diagnosis, or treatment. All AI-generated SOAP notes, diagnostic checkers, and treatment plans must be audited, modified, and approved by a licensed medical practitioner before use in clinical charts.
            </div>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">2. Clinician Credentials & Verification</h2>
            <p>
                Clinicians registering for the Professional Suite must provide verifiable proof of licensing, credentials, and identity. PsyPyrus reserves the right to suspend accounts displaying fraudulent credentials or practicing without proper state licensing.
            </p>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">3. Patient Account Autonomy</h2>
            <p>
                Patients utilizing the Wellness Lounge or Booking portal own their somatic tracking data and gratitude journals. Patients can export their complete data file in compliant JSON or PDF formats at any time, or request complete deletion of their patient-facing profile records.
            </p>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">4. Booking & Financial Transactions</h2>
            <p>
                All appointments and payments made through the booking portal are subject to individual therapist agreement rates (including sliding scales). Invoices must be paid in a timely manner. PsyPyrus acts as a mediator for transaction logging and is not responsible for refund disputes, which must be settled between patient and provider.
            </p>
        </article>
    );
}

function CommunityGuidelinesContent() {
    return (
        <article className="space-y-4 text-slate-300 leading-relaxed text-xs print:text-black">
            <h1 className="text-xl font-bold text-white border-b border-white/10 pb-2 print:text-black print:border-black">Community Guidelines</h1>
            <p className="text-[10px] text-slate-400 italic">Last Updated: June 15, 2026</p>
            
            <p>
                PsyPyrus hosts collaborative clinical research, peer feeds, and patient support workspaces. These guidelines ensure a secure, respectful, and legally compliant environment for all participants.
            </p>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">1. Clinical Feed Integrity</h2>
            <p>
                The PsychConnect Social Feed is intended for clinical education, case discussion, and research coordination.
            </p>
            <ul className="list-disc pl-5 space-y-1">
                <li><strong>No Public PHI:</strong> Sharing identifying patient information on the social feed is strictly prohibited. All case discussions must use fully randomized, fictitious details or fully de-identified records.</li>
                <li><strong>Respectful Discourse:</strong> Professional disagreements on psychiatric models (e.g. HiTOP vs DSM) must remain academic, collegiate, and evidence-based. Ad hominem or discriminatory language will result in immediate termination.</li>
            </ul>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">2. Safe Haven Rules for Patient Boards</h2>
            <p>
                Patient support modules, wellness lounges, and group boards are safe spaces.
            </p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Self-harm promotion, suicide coaching, or abuse of peer support resources is subject to immediate account bans and local crisis escalation procedures.</li>
                <li>Bullying, harassment, or medical misadvice targeted at other patients will not be tolerated.</li>
            </ul>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">3. Research Collaboration Rules</h2>
            <p>
                Researchers using the Research Hub must comply with Institutional Review Board (IRB) approvals and obtain appropriate patient consent forms before importing or recruiting participants.
            </p>
        </article>
    );
}

function CopyrightPolicyContent() {
    return (
        <article className="space-y-4 text-slate-300 leading-relaxed text-xs print:text-black">
            <h1 className="text-xl font-bold text-white border-b border-white/10 pb-2 print:text-black print:border-black">Copyright & Open-Source Policy</h1>
            <p className="text-[10px] text-slate-400 italic">Last Updated: June 15, 2026</p>
            
            <p>
                PsyPyrus AI OS believes in open science, community-driven development, and intellectual property respect. This policy details how our code, algorithms, and medical database assets are governed.
            </p>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">1. MIT Open Source License</h2>
            <p>
                The core codebase of the PsyPyrus platform (including UI layouts, routing frameworks, local database wrappers, and diagnostics adapters) is released under the <strong>MIT License</strong>. You are free to clone, edit, fork, and distribute this code, provided the original copyright notice is retained.
            </p>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">2. Clinical Checklists & Medical Taxonomies</h2>
            <p>
                The psychiatric checklists and matrices integrated into PsyPyrus (DSM-5-TR, ICD-11, HiTOP, and RDoC matrices) are the intellectual property of their respective owners (e.g. the American Psychiatric Association, World Health Organization, HiTOP Consortium, and NIMH).
            </p>
            <ul className="list-disc pl-5 space-y-1">
                <li>PsyPyrus implements diagnostic adapters for ease of reference and administrative entry. Users are responsible for procuring appropriate license credentials if their local clinical practice requires explicit diagnostic certification.</li>
                <li>The DSM-5-TR, HiTOP, and RDoC matrices compiled within our code must not be extracted or commercialized separately from the platform.</li>
            </ul>

            <h2 className="text-sm font-bold text-teal-400 pt-2 print:text-black">3. DMCA Take-Down Compliance</h2>
            <p>
                If you believe any content posted on the PsychConnect feed or hosted in the Resource Library infringes your copyright, please submit a formal takedown request to <code>compliance@psypyrus.org</code> with proof of ownership and the exact URL paths.
            </p>
        </article>
    );
}
