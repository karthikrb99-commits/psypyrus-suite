import { useState } from 'react';
import { useToast } from '../ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';

export function DisabilityComplianceActs() {
    const { showToast } = useToast();
    
    // Sub-tab Navigation state: 'rci', 'rpwd', 'national-trust'
    const [subTab, setSubTab] = useState('rci');

    // RPwD sub-tab state: 'advisor' | 'qa' | 'explorer' | 'viewer'
    const [rpwdTab, setRpwdTab] = useState('advisor');
    // Section explorer search query
    const [sectionQuery, setSectionQuery] = useState('');
    // Q&A accordion state
    const [expandedQaId, setExpandedQaId] = useState(null);

    // --- RCI CRR Lookups ---
    const [crrQuery, setCrrQuery] = useState('');
    const [crrCategory, setCrrCategory] = useState('All');
    const [crrResults, setCrrResults] = useState([]);
    const [isSearchingCrr, setIsSearchingCrr] = useState(false);
    
    const mockCrrDb = [
        { crrNo: 'A12345', name: 'Dr. Liam Carter', category: 'Clinical Psychologist', status: 'Active', renewalDate: '15 Aug 2028', institution: 'National Institute of Mental Health and Neurosciences (NIMHANS), Bangalore' },
        { crrNo: 'A78392', name: 'Prof. Anjali Sharma', category: 'Clinical Psychologist', status: 'Active', renewalDate: '24 Jan 2029', institution: 'Central Institute of Psychiatry (CIP), Ranchi' },
        { crrNo: 'B22910', name: 'Rajesh K. Verma', category: 'Rehabilitation Social Worker', status: 'Active', renewalDate: '10 Nov 2027', institution: 'Tata Institute of Social Sciences (TISS), Mumbai' },
        { crrNo: 'C99302', name: 'Sunita Deshmukh', category: 'Special Educator (Intellectual Disability)', status: 'Active', renewalDate: '05 Mar 2028', institution: 'National Institute for the Empowerment of Persons with Intellectual Disabilities (NIEPID), Secunderabad' },
        { crrNo: 'A48938', name: 'Dr. Vikram Malhotra', category: 'Clinical Psychologist', status: 'Renewal Pending', renewalDate: '01 Jun 2026', institution: 'Institute of Human Behaviour and Allied Sciences (IHBAS), Delhi' },
        { crrNo: 'D10293', name: 'Amit Sengupta', category: 'Speech & Hearing Therapist', status: 'Suspended', renewalDate: 'Expired', institution: 'All India Institute of Speech and Hearing (AIISH), Mysore' }
    ];

    const handleCrrSearch = (e) => {
        e.preventDefault();
        setIsSearchingCrr(true);
        setTimeout(() => {
            const query = crrQuery.toLowerCase().trim();
            const filtered = mockCrrDb.filter(item => {
                const matchesText = item.crrNo.toLowerCase().includes(query) || 
                                    item.name.toLowerCase().includes(query) ||
                                    item.institution.toLowerCase().includes(query);
                const matchesCategory = crrCategory === 'All' || item.category.includes(crrCategory);
                return matchesText && matchesCategory;
            });
            setCrrResults(filtered);
            setIsSearchingCrr(false);
            if (filtered.length > 0) {
                showToast(`Found ${filtered.length} matching rehabilitation practitioners.`, "success");
            } else {
                showToast("No credentials matching the query found in CRR.", "warning");
            }
        }, 600);
    };

    // --- RPwD Act 2016 21 Disabilities & Certification Checklist Generator ---
    const [selectedDisability, setSelectedDisability] = useState('Mental Illness');
    const [certificationDetails, setCertificationDetails] = useState({
        disability: 'Mental Illness',
        definition: 'A substantial disorder of thinking, mood, perception, orientation or memory that grossly impairs judgment, behaviour, capacity to recognise reality or ability to meet the ordinary demands of life, but does not include retardation which is a condition of arrested or incomplete development of mind of a person, specially characterised by subnormality of intelligence.',
        authority: 'Psychiatrist (Medical Board comprising at least one Clinical Psychologist and one Psychiatric Social Worker / Psychiatric Nurse).',
        criteria: 'Minimum 40% disability assessed using the Indian Disability Evaluation and Assessment Scale (IDEAS). Validity varies: 5 years for temporary/fluctuating states, permanent for chronic stable states.',
        documents: ['Standard Government Proforma Form IVA & IVB', 'Recent Passport photos', 'Aadhaar Card / ABHA Card', 'History of treatment (minimum 1 year psychiatric notes)', 'Detailed psychometric assessment report signed by RCI-registered Clinical Psychologist.'],
        guidelines: 'Refer to Gazette Notification No. S.O. 91(E) by Ministry of Social Justice and Empowerment.'
    });

    const disabilitiesData = {
        'Mental Illness': {
            definition: 'A substantial disorder of thinking, mood, perception, orientation or memory that grossly impairs judgment, behaviour, capacity to recognise reality or ability to meet the ordinary demands of life, but does not include retardation which is a condition of arrested or incomplete development of mind of a person, specially characterised by subnormality of intelligence.',
            authority: 'Psychiatrist (Medical Board comprising at least one Clinical Psychologist and one Psychiatric Social Worker / Psychiatric Nurse).',
            criteria: 'Minimum 40% disability assessed using the Indian Disability Evaluation and Assessment Scale (IDEAS). Validity varies: 5 years for temporary/fluctuating states, permanent for chronic stable states.',
            documents: ['Standard Government Proforma Form IVA & IVB', 'Recent Passport photos', 'Aadhaar Card / ABHA Card', 'History of treatment (minimum 1 year psychiatric notes)', 'Detailed psychometric assessment report signed by RCI-registered Clinical Psychologist.'],
            guidelines: 'Refer to Gazette Notification No. S.O. 91(E) by Ministry of Social Justice and Empowerment.',
            concessions: [
                'Compensatory time in examinations (20 minutes extra per hour).',
                'Provision of a scribe / reader if writing capability is affected.',
                'Flexible working hours / option for remote work in public/private sectors.',
                'Rest breaks during work hours to manage cognitive fatigue.',
                'Protection against termination or demotion due to mental illness acquired during service (Section 20(4)).',
                'Access to clinical progress records, treatment plans, and diagnosis reports under MHCA 2017 Section 25.'
            ]
        },
        'Autism Spectrum Disorder': {
            definition: 'A neuro-developmental condition typically appearing in the first three years of life that significantly affects a person’s ability to communicate, understand relationships and relate to others, and is frequently associated with unusual or stereotypical rituals or behaviours.',
            authority: 'Multidisciplinary Board including a Pediatrician or Pediatric Neurologist, a Psychiatrist, a Clinical Psychologist, and a Speech Therapist.',
            criteria: 'ISAA (Indian Scale for Assessment of Autism) score or INCLEN tool. Certificate validity can be temporary (under 18 years for developmental tracking) or permanent (after 18 years).',
            documents: ['ISAA Score Card & Assessment Profile', 'Pediatric developmental history', 'Recent Passport photos', 'Address/Identity Proof (Aadhaar/ABHA)', 'Consent form from parents/guardian.'],
            guidelines: 'Assessment Guidelines notified in Gazette on 25 April 2016.',
            concessions: [
                'Compensatory time (20 minutes per hour) and scribe/reader.',
                'Alternative question papers or simplified visual prompts.',
                'Sensory regulation breaks during exams/work.',
                'Visual schedule aids and structured task instructions.',
                'Reservation in higher education (5%) and government jobs (1% pool).'
            ]
        },
        'Specific Learning Disabilities': {
            definition: 'A heterogeneous group of conditions wherein there is a deficit in processing language, spoken or written, that may manifest itself as a difficulty to comprehend, speak, read, write, spell, or to do mathematical calculations and includes such conditions as perceptual disabilities, brain injury, minimal brain dysfunction, dyslexia, dysgraphia and dyscalculia.',
            authority: 'Medical Board comprising a Pediatrician or Pediatric Neurologist, Clinical/School Psychologist, Special Educator, and Speech-Language Pathologist.',
            criteria: 'NIMHANS battery for SLD or other recognized standardized batteries. Certified only after 8-9 years of age. Minimum 40% impairment.',
            documents: ['Standardized SLD Diagnostic Test Report', 'School progress report card & teacher referral summary', 'Aadhaar card copy', 'Passport size photos', 'Ophthalmic and Audiometric clearance certificates (to rule out sensory deficit).'],
            guidelines: 'Guidelines issued by Ministry of Social Justice and Empowerment in April 2018.',
            concessions: [
                'Provision of a scribe, reader, or transcriptionist during examinations.',
                'Compensatory time of 20 minutes per hour.',
                'Use of calculators, mathematical tables, and computers with spelling tools.',
                'Alternative exam options (oral exams, project-based assessment).',
                'Exemption from second/third language requirements (studying one language).'
            ]
        },
        'Cerebral Palsy': {
            definition: 'A group of non-progressive neurological condition affecting body movements and muscle coordination, caused by damage to one or more specific areas of the brain, usually occurring before, during or shortly after birth.',
            authority: 'Physical Medicine and Rehabilitation (PMR) Specialist, Orthopedic Surgeon, and Pediatrician or Neurologist.',
            criteria: 'Structured locomotor testing and neurological evaluation. Certified as permanent except in early infant cases which require tracking.',
            documents: ['PMR diagnostic summary', 'Locomotor evaluation scorecard', 'Recent passport size photos', 'Aadhaar Card copy'],
            guidelines: 'Standard evaluation methods under RPwD Rules 2017.',
            concessions: [
                'Scribe/writer and compensatory time (20 minutes per hour).',
                'Accessible ground floor exam halls / office workstations.',
                'Use of assistive devices (ergonomic keyboards, speech-to-text).',
                'Locomotor reservation (1% pool) in government jobs.',
                'Free assistive aids and appliances supplied by government schemes.'
            ]
        },
        'Intellectual Disability': {
            definition: 'A condition characterised by significant limitation both in intellectual functioning (reasoning, learning, problem solving) and in adaptive behaviour which covers a range of every day, social and practical skills.',
            authority: 'Pediatrician or Psychiatrist, accompanied by a Clinical Psychologist and Special Educator.',
            criteria: 'IQ below 70 using Binet-Kamat Test (BKT) or Malin\'s Intelligence Scale for Indian Children (MISIC), along with Vineland Social Maturity Scale (VSMS) for adaptive behavior.',
            documents: ['IQ assessment report signed by RCI Clinical Psychologist', 'VSMS Social Age / SQ report', 'Birth Certificate / Age proof', 'Aadhaar Card & photos'],
            guidelines: 'Assessed under intellectual functioning guidelines notified in RPwD Rules.',
            concessions: [
                'Compensatory time (20 minutes per hour) and scribe.',
                'Simplified language question papers and grading concessions.',
                'Use of calculator and custom learning aids.',
                'Assistance of special educators and legal guardians (Section 14).',
                'Welfare schemes, including Niramaya health insurance and Samarth respite care.'
            ]
        },
        'Hearing Impairment': {
            definition: 'Deaf means persons having 70 dB hearing loss in speech frequencies in both ears; hard of hearing means person having 60 dB to 70 dB hearing loss in speech frequencies in both ears.',
            authority: 'ENT Specialist / Otorhinolaryngologist and Audiologist.',
            criteria: 'Pure Tone Audiometry (PTA) testing showing hearing threshold loss.',
            documents: ['Pure Tone Audiometric report', 'Tympanometry/BERA report (if applicable)', 'Passport photos', 'Aadhaar Card copy'],
            guidelines: 'Acoustic standard guidelines under RPwD Act.',
            concessions: [
                'Services of a professional Sign Language Interpreter.',
                'Real-time captioning (speech-to-text) for classes/meetings.',
                'Visual alert/evacuation systems in offices and schools.',
                'Deaf & Hard of Hearing job reservation (1% pool).',
                'Hearing aid and cochlear implant concessions.'
            ]
        },
        'Blindness & Low-vision': {
            definition: 'Total absence of sight, or visual acuity not exceeding 3/60 or 10/200 (Snellen) in the better eye with correcting lenses, or limitation of the field of vision subtending an angle of less than 20 degree.',
            authority: 'Ophthalmologist / Eye Specialist.',
            criteria: 'Refraction and visual field testing.',
            documents: ['Detailed vision charting report', 'Passport photos', 'Aadhaar Card copy'],
            guidelines: 'Ophthalmic standards under RPwD Act.',
            concessions: [
                'Braille, large print, or screen-reader (NVDA/JAWS) computer systems.',
                'Scribe, reader, or laboratory assistant during exams.',
                'Double compensatory time or extra 20 minutes/hour.',
                'Tactile paving and audio-guided orientation in public areas.',
                'Blindness & Low-vision job reservation (1% pool).'
            ]
        }
    };

    const handleGenerateChecklist = (disability) => {
        setSelectedDisability(disability);
        const data = disabilitiesData[disability];
        if (data) {
            setCertificationDetails({
                disability,
                ...data
            });
            showToast(`Generated Indian disability certification checklist for ${disability}.`, "success");
        } else {
            showToast("Disability details not found. Showing default information.", "info");
        }
    };

    // --- National Trust Act 1999 Schemes ---
    const [selectedScheme, setSelectedScheme] = useState('Niramaya');
    const schemesData = {
        'Niramaya': {
            title: 'Niramaya Health Insurance Scheme',
            benefits: 'Comprehensive health insurance coverage of up to ₹1,00,000 (1 Lakh) per annum for all age groups with Autism, Cerebral Palsy, Intellectual Disability, and Multiple Disabilities.',
            coverageDetails: 'Covers OPD treatment, medicines, pathological tests, corrective surgery, therapies (speech, occupational, physical), and transportation expenses. No pre-insurance medical test is required.',
            premium: 'Free for BPL (Below Poverty Line) families. Nominally priced (₹250 to ₹500/year) for non-BPL families depending on income levels.',
            eligibility: 'Must have valid disability certificate for one of the 4 National Trust disabilities. Registrations are linked to the legal guardian\'s bank account.'
        },
        'Disha': {
            title: 'Disha Early Intervention Scheme',
            benefits: 'Early intervention and school readiness scheme for children up to 10 years of age with Autism, Cerebral Palsy, Intellectual Disability, or Multiple Disabilities.',
            coverageDetails: 'Provides infrastructure and training for early detection, therapeutic support (Speech, Occupational Therapy, Physiotherapy), behavioral modification, and counseling for parents.',
            premium: 'Fully subsidized by the National Trust through registered NGOs/service providers.',
            eligibility: 'Children in the age group of 0-10 years with a certified National Trust disability.'
        },
        'Samarth': {
            title: 'Samarth Respite Care Scheme',
            benefits: 'Respite care and residential services for both short-term (respite) and long-term stays for persons with disabilities.',
            coverageDetails: 'Covers food, shelter, medical support, recreation, and vocational training in designated centers. Relieves parents/families from continuous care responsibilities.',
            premium: 'Subsidized based on family income; completely free for destitute/orphaned individuals with disabilities.',
            eligibility: 'Persons of all age groups with one of the 4 covered disabilities.'
        },
        'Gyan Prabha': {
            title: 'Gyan Prabha Scholarship Scheme',
            benefits: 'Scholarship program for pursuing vocational training, professional courses, or higher education.',
            coverageDetails: 'Financial assistance of up to ₹1,000 per month for the duration of the course to support tuition fees, books, and study materials.',
            premium: 'Scholarship grant (no cost).',
            eligibility: 'Must be registered under National Trust, pursuing recognized vocational or professional courses. Selection based on academic/vocational merit.'
        }
    };

    // --- Local Level Committee (LLC) Legal Guardianship Checklist ---
    const llcChecklist = [
        { step: 1, title: 'Check Eligibility', desc: 'Ensure the ward is 18 years or older and has Autism, Cerebral Palsy, Intellectual Disability, or Multiple Disabilities. (Natural parents are legal guardians by birth, but statutory legal guardianship is required for major wards).' },
        { step: 2, title: 'Locate Local Level Committee (LLC)', desc: 'Find your District Collector / District Magistrate office which hosts the LLC chaired by the District Collector, featuring one local NGO member and one person with disability.' },
        { step: 3, title: 'Prepare Form A', desc: 'Fill out Form A under the National Trust Rules, 2000. It requires details of the ward, parent/caregiver, proposed guardian, and consent from next of kin.' },
        { step: 4, title: 'Gather Supporting Documents', desc: 'Disability Certificate, Age Proof of ward/guardian, Residence Proof, two fitness certificates for the guardian, and consent letters from relatives.' },
        { step: 5, title: 'Submit Application', desc: 'Submit the completed application (Form A + attachments) to the LLC convener (usually the District Social Welfare Officer).' },
        { step: 6, title: 'LLC Interview & Verification', desc: 'The LLC will conduct an interview, inspect the living conditions of the ward, and assess the suitability of the proposed guardian.' },
        { step: 7, title: 'Certificate Issuance', desc: 'Once satisfied, the LLC issues the official legal guardianship certificate in Form B. Guardians must submit annual reports to the LLC.' }
    ];

    return (
        <div className="screen-container active p-6 text-slate-100 flex flex-col gap-6" id="screen-disability-compliance" style={{ overflowY: 'auto', maxHeight: '100%' }}>
            <style>{`
                .compliance-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 1.8fr;
                    gap: 24px;
                }
                .compliance-tab-btn {
                    padding: 12px 18px;
                    font-size: 13px;
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 2px solid transparent;
                }
                .compliance-tab-btn.active {
                    color: var(--color-primary);
                    border-bottom: 2px solid var(--color-primary);
                    background: rgba(0, 242, 254, 0.04);
                }
                .compliance-card {
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    padding: 20px;
                    box-shadow: 0 4px 30px rgba(0,0,0,0.3);
                }
                .compliance-tag {
                    font-size: 10px;
                    font-weight: 700;
                    padding: 3px 8px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    display: inline-block;
                }
                .tag-active { background: rgba(16, 185, 129, 0.15); color: #10b981; }
                .tag-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
                .tag-suspended { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
                .ethics-alert-box {
                    border-left: 4px solid #ef4444;
                    background: rgba(239, 68, 68, 0.08);
                    border-radius: 4px;
                    padding: 14px;
                    margin-bottom: 16px;
                }
                .referral-criteria-box {
                    border-left: 4px solid var(--color-primary);
                    background: rgba(0, 242, 254, 0.06);
                    border-radius: 4px;
                    padding: 14px;
                    margin-top: 10px;
                }
            `}</style>

            {/* Header Block */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 text-lg border border-teal-500/30">
                        <i className="fa-solid fa-gavel"></i>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-wide">Disability Compliance & Acts</h2>
                        <span className="text-xs text-slate-400">Indian Statutory Frameworks for Mental Health & Rehabilitation Services</span>
                    </div>
                </div>
                
                {/* external links */}
                <div className="flex gap-2 text-xs">
                    <a 
                        href="https://rehabcouncil.nic.in/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-md bg-slate-900 border border-white/10 hover:border-teal-500/30 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
                    >
                        <i className="fa-solid fa-graduation-cap"></i> RCI Official
                    </a>
                    <a 
                        href="https://depwd.gov.in/en/acts/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-md bg-slate-900 border border-white/10 hover:border-teal-500/30 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
                    >
                        <i className="fa-solid fa-scale-balanced"></i> DEPwD Acts
                    </a>
                </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex border-b border-white/5 bg-slate-900/40 rounded-t-lg">
                <button 
                    className={`compliance-tab-btn ${subTab === 'rci' ? 'active' : ''}`}
                    onClick={() => setSubTab('rci')}
                >
                    <i className="fa-solid fa-id-card-clip mr-2"></i> RCI CRR & Professional Standards (Act 1992)
                </button>
                <button 
                    className={`compliance-tab-btn ${subTab === 'rpwd' ? 'active' : ''}`}
                    onClick={() => setSubTab('rpwd')}
                >
                    <i className="fa-solid fa-universal-access mr-2"></i> Rights of Persons with Disabilities (Act 2016)
                </button>
                <button 
                    className={`compliance-tab-btn ${subTab === 'national-trust' ? 'active' : ''}`}
                    onClick={() => setSubTab('national-trust')}
                >
                    <i className="fa-solid fa-handshake-angle mr-2"></i> National Trust Welfare & Schemes (Act 1999)
                </button>
            </div>

            {/* TAB CONTENT: RCI CENTRAL REHABILITATION REGISTER */}
            {subTab === 'rci' && (
                <div className="compliance-grid">
                    {/* Left Panel: Search and Verification */}
                    <div className="flex flex-col gap-4">
                        <div className="compliance-card">
                            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-magnifying-glass text-teal-400"></i> Central Rehabilitation Register (CRR) Lookup
                            </h3>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                                Verify registration details of clinical psychologists, special educators, and therapists registered under the Rehabilitation Council of India Act, 1992.
                            </p>

                            <form onSubmit={handleCrrSearch} className="flex flex-col gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Search Query</label>
                                    <input 
                                        type="text" 
                                        className="input-text-field w-full text-xs" 
                                        placeholder="Enter CRR Number (e.g. A12345) or Practitioner Name..."
                                        value={crrQuery}
                                        onChange={(e) => setCrrQuery(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] text-slate-400 block mb-1">Professional Category</label>
                                    <select 
                                        className="input-text-field w-full text-xs"
                                        value={crrCategory}
                                        onChange={(e) => setCrrCategory(e.target.value)}
                                        style={{ height: '36px', padding: '0 10px', background: '#0f172a' }}
                                    >
                                        <option value="All">All Categories</option>
                                        <option value="Clinical Psychologist">Clinical Psychologist</option>
                                        <option value="Rehabilitation Social Worker">Rehabilitation Social Worker</option>
                                        <option value="Special Educator">Special Educator</option>
                                        <option value="Speech & Hearing">Speech & Hearing</option>
                                    </select>
                                </div>

                                <button 
                                    type="submit" 
                                    className="action-button-btn w-full mt-2" 
                                    style={{ background: 'var(--color-primary)', border: 'none', color: '#000', fontWeight: 'bold', height: '38px', borderRadius: '6px', cursor: 'pointer' }}
                                    disabled={isSearchingCrr}
                                >
                                    {isSearchingCrr ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin mr-2"></i> Querying CRR Database...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-address-book mr-2"></i> Query CRR Register
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Ethical compliance card */}
                        <div className="compliance-card">
                            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-circle-exclamation text-red-500"></i> Legal Compliance Warning (Section 13)
                            </h3>
                            <div className="ethics-alert-box">
                                <h4 className="text-xs font-bold text-red-400 mb-1">Section 13 (3) of RCI Act, 1992:</h4>
                                <p className="text-[11px] text-slate-300 leading-relaxed">
                                    "No person, other than a rehabilitation professional whose name is entered on the Register, shall practice as a rehabilitation professional."
                                </p>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-2">
                                Practicing as a clinical psychologist or rehabilitation professional in India without active RCI registration is a cognizable offence punishable by:
                            </p>
                            <ul className="text-xs text-slate-300 list-disc pl-5 flex flex-col gap-1.5">
                                <li>Imprisonment for a term which may extend to <strong>1 year</strong>, or</li>
                                <li>A fine which may extend to <strong>₹1,000</strong>, or both.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Panel: Search results & detail card */}
                    <div className="compliance-card flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">
                            <i className="fa-solid fa-list-check text-teal-400 mr-2"></i> CRR Query Output
                        </h3>

                        {crrResults.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3 border border-dashed border-white/5 rounded-lg">
                                <i className="fa-solid fa-database text-4xl"></i>
                                <span className="text-xs">Enter search details on the left to pull credentials from CRR.</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {crrResults.map((p) => (
                                    <div 
                                        key={p.crrNo} 
                                        className="p-4 rounded-lg bg-slate-900/60 border border-white/5 hover:border-teal-500/20 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{p.name}</h4>
                                                <span className="text-xs text-slate-400 font-semibold">{p.category}</span>
                                            </div>
                                            <span className={`compliance-tag ${
                                                p.status === 'Active' ? 'tag-active' : p.status === 'Suspended' ? 'tag-suspended' : 'tag-pending'
                                            }`}>
                                                {p.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-2 mt-3 text-xs border-t border-white/5 pt-3">
                                            <div>
                                                <span className="text-slate-500 block text-[10px]">CRR Registration No.</span>
                                                <strong className="text-teal-400 font-mono">{p.crrNo}</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block text-[10px]">Renewal Due Date</span>
                                                <strong className="text-slate-300">{p.renewalDate}</strong>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-slate-500 block text-[10px]">RCI Recognized Training Institution</span>
                                                <span className="text-slate-300 leading-relaxed text-[11px]">{p.institution}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: RPWD ACT 2016 */}
            {subTab === 'rpwd' && (
                <div className="flex flex-col gap-4 animate-fade-in text-left">
                    {/* Nested Sub-Tabs for RPwD */}
                    <div className="flex flex-wrap gap-2 p-1 bg-slate-950/60 border border-white/5 rounded-lg max-w-fit">
                        <button 
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition cursor-pointer select-none border-none ${rpwdTab === 'advisor' ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white bg-transparent'}`}
                            onClick={() => setRpwdTab('advisor')}
                        >
                            <i className="fa-solid fa-graduation-cap mr-1"></i> Accommodations Advisor
                        </button>
                        <button 
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition cursor-pointer select-none border-none ${rpwdTab === 'qa' ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white bg-transparent'}`}
                            onClick={() => setRpwdTab('qa')}
                        >
                            <i className="fa-solid fa-circle-question mr-1"></i> Rights Q&A Index
                        </button>
                        <button 
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition cursor-pointer select-none border-none ${rpwdTab === 'explorer' ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white bg-transparent'}`}
                            onClick={() => setRpwdTab('explorer')}
                        >
                            <i className="fa-solid fa-scale-balanced mr-1"></i> Section Explorer
                        </button>
                        <button 
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition cursor-pointer select-none border-none ${rpwdTab === 'viewer' ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white bg-transparent'}`}
                            onClick={() => setRpwdTab('viewer')}
                        >
                            <i className="fa-solid fa-file-pdf mr-1"></i> Official PDF Document
                        </button>
                    </div>

                    {/* RPwD SUB-TAB VIEW: ACCOMMODATIONS ADVISOR */}
                    {rpwdTab === 'advisor' && (
                        <div className="compliance-grid animate-fade-in">
                            {/* Left Column: 21 disabilities selector */}
                            <div className="compliance-card flex flex-col gap-3">
                                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-clipboard-question text-teal-400"></i> Indian Disability Certificate Referral
                                </h3>
                                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                                    Select a category to view the competent certifying authority, required paperwork, and standard legal accommodations under the RPwD Act, 2016.
                                </p>

                                <label className="text-[11px] text-slate-400 block font-semibold">Select Disability Category (RPwD Act 2016)</label>
                                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px', background: '#090d16' }}>
                                    {Object.keys(disabilitiesData).map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => handleGenerateChecklist(key)}
                                            className="w-full text-left text-xs px-3 py-2 rounded transition-all flex justify-between items-center hover:bg-white/5"
                                            style={{
                                                background: selectedDisability === key ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                                                color: selectedDisability === key ? 'var(--color-primary)' : 'var(--text-normal)',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <span>{key}</span>
                                            {selectedDisability === key && <i className="fa-solid fa-check text-xs"></i>}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="mt-4 p-3 rounded bg-slate-900/40 border border-white/5">
                                    <h4 className="text-xs font-bold text-teal-400 mb-1">Rights and Protections (Section 3-12)</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        The RPwD Act mandates equal opportunities in employment, reservations (4-5% in government jobs/education), free education up to 18 years, and barrier-free access in all public buildings, transport, and websites.
                                    </p>
                                </div>
                            </div>

                            {/* Right Column: Generated Checklist */}
                            <div className="compliance-card">
                                <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex justify-between items-center">
                                    <span><i className="fa-solid fa-file-invoice text-teal-400 mr-2"></i> Accommodations & Referral Checklist</span>
                                    {certificationDetails && (
                                        <span className="text-[10px] bg-teal-400/10 text-teal-400 px-2 py-0.5 rounded font-mono">Active Target</span>
                                    )}
                                </h3>

                                {certificationDetails ? (
                                    <div className="flex flex-col gap-4 mt-3">
                                        <div>
                                            <h4 className="text-xs font-bold text-teal-400 mb-1">Selected Condition</h4>
                                            <h3 className="text-base font-bold text-white">{certificationDetails.disability}</h3>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-teal-400 mb-1">Statutory Definition</h4>
                                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded border border-white/5">
                                                {certificationDetails.definition}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-xs font-bold text-teal-400 mb-1">Competent Certifying Authority</h4>
                                                <span className="text-xs text-slate-300 leading-relaxed block">
                                                    {certificationDetails.authority}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-teal-400 mb-1">Assessment Criteria & Thresholds</h4>
                                                <span className="text-xs text-slate-300 leading-relaxed block">
                                                    {certificationDetails.criteria}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="referral-criteria-box">
                                            <h4 className="text-xs font-bold text-teal-300 mb-2 flex items-center gap-1.5">
                                                <i className="fa-solid fa-circle-info"></i> Required Documents for UDID Registration
                                            </h4>
                                            <ul className="text-xs text-slate-300 list-disc pl-5 flex flex-col gap-1.5">
                                                {certificationDetails.documents.map((doc, idx) => (
                                                    <li key={idx}>{doc}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Statutory Concessions and Accommodations List */}
                                        {certificationDetails.concessions && (
                                            <div className="p-3.5 rounded bg-indigo-950/20 border border-indigo-500/15">
                                                <h4 className="text-xs font-bold text-indigo-300 mb-2 flex items-center gap-1.5">
                                                    <i className="fa-solid fa-universal-access"></i> Standard Concessions & Accommodations
                                                </h4>
                                                <ul className="text-xs text-slate-305 list-disc pl-5 flex flex-col gap-1.5 text-left">
                                                    {certificationDetails.concessions.map((con, idx) => (
                                                        <li key={idx}>{con}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-2">
                                            <span className="text-[10.5px] text-slate-500 font-mono">{certificationDetails.guidelines}</span>
                                            <button 
                                                className="action-button-btn secondary text-xs"
                                                style={{ height: '32px', borderRadius: '4px', cursor: 'pointer', padding: '0 12px' }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(JSON.stringify(certificationDetails, null, 2));
                                                    showToast(`Referral schema copied for ${certificationDetails.disability}.`, "success");
                                                }}
                                            >
                                                <i className="fa-solid fa-copy mr-1"></i> Copy Referral Card
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3 border border-dashed border-white/5 rounded-lg">
                                        <i className="fa-solid fa-file-medical text-4xl"></i>
                                        <span className="text-xs">Click "Select Disability Category" on the left to generate compliance guidelines.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RPwD SUB-TAB VIEW: RIGHTS & ENTITLEMENTS Q&A */}
                    {rpwdTab === 'qa' && (
                        <div className="compliance-card flex flex-col gap-4 animate-fade-in w-full text-left">
                            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-circle-question text-teal-400"></i> Rights & Entitlements Q&A Index
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                Browse common legal questions regarding employment discrimination, promotions, examinations, and protection against abuse. Each answer is linked to statutory sections of the RPwD Act 2016.
                            </p>
                            
                            <div className="flex flex-col gap-3">
                                {RPWD_QA.map((item) => {
                                    const isExpanded = expandedQaId === item.id;
                                    return (
                                        <div 
                                            key={item.id} 
                                            className="border border-white/5 rounded-lg overflow-hidden bg-slate-900/40 hover:border-teal-500/20 transition-all"
                                        >
                                            <button
                                                className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-white hover:text-teal-400 transition cursor-pointer border-none bg-transparent"
                                                onClick={() => setExpandedQaId(isExpanded ? null : item.id)}
                                            >
                                                <span className="flex-1 pr-4">{item.question}</span>
                                                <span className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[10px] bg-slate-800 text-teal-400 px-2 py-0.5 rounded font-mono">{item.section}</span>
                                                    <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
                                                </span>
                                            </button>
                                            
                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="border-t border-white/5 bg-slate-950/40 p-4 text-xs text-slate-300 leading-relaxed"
                                                    >
                                                        <p>{item.answer}</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* RPwD SUB-TAB VIEW: SECTION EXPLORER */}
                    {rpwdTab === 'explorer' && (
                        <div className="compliance-card flex flex-col gap-4 animate-fade-in w-full text-left">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-3 gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <i className="fa-solid fa-scale-balanced text-teal-400"></i> Section-by-Section Legal Explorer
                                    </h3>
                                    <span className="text-xs text-slate-400">Search key chapters, civil rights, and statutory rules.</span>
                                </div>
                                
                                <div className="relative max-w-sm w-full">
                                    <input 
                                        type="text" 
                                        className="input-text-field w-full text-xs" 
                                        placeholder="Search by section or keyword (e.g. reservation, Section 20)..."
                                        value={sectionQuery}
                                        onChange={(e) => setSectionQuery(e.target.value)}
                                        style={{ height: '36px', padding: '0 12px 0 32px', background: '#0a0d16' }}
                                    />
                                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-500 text-xs"></i>
                                    {sectionQuery && (
                                        <button 
                                            onClick={() => setSectionQuery('')}
                                            className="absolute right-3 top-2 text-slate-450 hover:text-white border-none bg-transparent cursor-pointer text-xs"
                                        >
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {(() => {
                                const query = sectionQuery.toLowerCase().trim();
                                const filtered = RPWD_SECTIONS.filter(sec => 
                                    sec.number.toLowerCase().includes(query) ||
                                    sec.title.toLowerCase().includes(query) ||
                                    sec.summary.toLowerCase().includes(query) ||
                                    sec.chapter.toLowerCase().includes(query)
                                );
                                
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {filtered.length === 0 ? (
                                            <div className="col-span-2 flex flex-col items-center justify-center py-16 text-slate-500 gap-3 border border-dashed border-white/5 rounded-lg">
                                                <i className="fa-solid fa-book-bookmark text-3xl"></i>
                                                <span className="text-xs">No sections matching your search query. Try another keyword.</span>
                                            </div>
                                        ) : (
                                            filtered.map((sec, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className="p-4 rounded-lg bg-slate-900/40 border border-white/5 hover:border-teal-500/20 transition-all flex flex-col justify-between"
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[10px] text-teal-400 font-mono font-bold uppercase tracking-wider">{sec.number}</span>
                                                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-semibold">{sec.chapter}</span>
                                                        </div>
                                                        <h4 className="text-xs font-bold text-white mb-2">{sec.title}</h4>
                                                        <p className="text-[11px] text-slate-400 leading-relaxed">{sec.summary}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* RPwD SUB-TAB VIEW: OFFICIAL PDF DOCUMENT */}
                    {rpwdTab === 'viewer' && (
                        <div className="compliance-card flex flex-col gap-4 animate-fade-in w-full text-left" style={{ height: '650px' }}>
                            <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <i className="fa-solid fa-file-pdf text-rose-500"></i> Official RPwD Act 2016 PDF Document
                                    </h3>
                                    <span className="text-xs text-slate-400">Read the official Gazette notification issued by the Ministry of Law and Justice.</span>
                                </div>
                                
                                <div className="flex gap-2">
                                    <a 
                                        href="/rpwd_act_2016.pdf" 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="px-3 py-1.5 rounded bg-slate-900 border border-white/10 hover:border-teal-500/30 text-xs text-slate-350 hover:text-white flex items-center gap-1.5 transition cursor-pointer select-none"
                                    >
                                        <i className="fa-solid fa-up-right-from-square"></i> Open in New Tab
                                    </a>
                                    <a 
                                        href="/rpwd_act_2016.pdf" 
                                        download="the_rights_of_persons_with_disabilities_act_2016.pdf"
                                        className="px-3 py-1.5 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer select-none font-sans"
                                    >
                                        <i className="fa-solid fa-download"></i> Download PDF
                                    </a>
                                </div>
                            </div>
                            
                            <div className="flex-1 w-full bg-slate-950/60 border border-white/5 rounded-lg overflow-hidden relative">
                                <iframe 
                                    src="/rpwd_act_2016.pdf" 
                                    title="Rights of Persons with Disabilities Act 2016 PDF Viewer"
                                    className="w-full h-full border-none"
                                    style={{ background: '#0a0d16' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: NATIONAL TRUST ACT 1999 */}
            {subTab === 'national-trust' && (
                <div className="compliance-grid">
                    {/* Left Column: National Trust Overview & Schemes */}
                    <div className="compliance-card flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-shield text-teal-400"></i> Welfare Schemes (National Trust Act 1999)
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            The National Trust administers social security schemes, monitors caregiver networks, and processes legal guardianships for people suffering from <strong>Autism, Cerebral Palsy, Intellectual Disability, and Multiple Disabilities</strong>.
                        </p>

                        <div className="flex border-b border-white/5 bg-slate-900/60 rounded">
                            {Object.keys(schemesData).map((sKey) => (
                                <button
                                    key={sKey}
                                    className={`compliance-tab-btn flex-1 text-center py-2 ${selectedScheme === sKey ? 'active' : ''}`}
                                    onClick={() => setSelectedScheme(sKey)}
                                    style={{ fontSize: '11px', borderBottom: 'none' }}
                                >
                                    {sKey}
                                </button>
                            ))}
                        </div>

                        {selectedScheme && schemesData[selectedScheme] && (
                            <div className="p-4 rounded-lg bg-slate-900/30 border border-white/5 flex flex-col gap-3">
                                <h4 className="text-xs font-bold text-teal-400">{schemesData[selectedScheme].title}</h4>
                                
                                <div>
                                    <span className="text-[10px] text-slate-500 block">Key Welfare Benefits</span>
                                    <p className="text-xs text-slate-300 leading-relaxed">{schemesData[selectedScheme].benefits}</p>
                                </div>

                                <div>
                                    <span className="text-[10px] text-slate-500 block">Coverage Details</span>
                                    <p className="text-xs text-slate-300 leading-relaxed">{schemesData[selectedScheme].coverageDetails}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] text-slate-500 block">Premium & Cost Structure</span>
                                        <span className="text-xs text-slate-300">{schemesData[selectedScheme].premium}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 block">Eligibility Threshold</span>
                                        <span className="text-xs text-slate-300">{schemesData[selectedScheme].eligibility}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Legal Guardianship Checklist */}
                    <div className="compliance-card flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex justify-between items-center">
                            <span><i className="fa-solid fa-scale-unbalanced-flip text-teal-400 mr-2"></i> Local Level Committee (LLC) Legal Guardianship</span>
                            <span className="text-[10px] bg-teal-400/10 text-teal-400 px-2 py-0.5 rounded font-mono">Form A & B Procedure</span>
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Under Section 14 of the National Trust Act, 1999, the Local Level Committee (headed by the District Collector) holds the statutory power to appoint a legal guardian for adults with covered disabilities.
                        </p>

                        <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '350px' }}>
                            {llcChecklist.map((step) => (
                                <div key={step.step} className="flex gap-3 p-3 rounded bg-slate-900/40 border border-white/5 hover:border-teal-500/10 transition-all text-left">
                                    <div className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold text-xs border border-teal-500/20 flex-shrink-0">
                                        {step.step}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white">{step.title}</h4>
                                        <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const RPWD_SECTIONS = [
    {
        number: "Section 2",
        chapter: "Chapter I: Preliminary",
        title: "Definitions",
        summary: "Defines key legal terms: 'barrier' (any factor hampering full participation), 'benchmark disability' (not less than 40% of a specified disability), 'person with disability' (long-term physical, mental, intellectual or sensory impairment), and 'reasonable accommodation' (necessary modifications and adjustments to ensure rights enjoyment)."
    },
    {
        number: "Section 3",
        chapter: "Chapter II: Rights & Entitlements",
        title: "Equality and Non-discrimination",
        summary: "Prohibits discrimination against persons with disabilities. The Government shall ensure that persons with disabilities enjoy the right to equality, life with dignity, and respect for their integrity equally with others. No person shall be deprived of personal liberty solely on the ground of disability."
    },
    {
        number: "Section 4",
        chapter: "Chapter II: Rights & Entitlements",
        title: "Women and Children with Disabilities",
        summary: "Mandates that the Government take measures to ensure that women and children with disabilities enjoy their rights equally with others."
    },
    {
        number: "Section 5",
        chapter: "Chapter II: Rights & Entitlements",
        title: "Community Life",
        summary: "Guarantees the right of persons with disabilities to live in the community and not be forced into any particular living arrangement."
    },
    {
        number: "Section 6",
        chapter: "Chapter II: Rights & Entitlements",
        title: "Protection from Cruelty and Inhuman Treatment",
        summary: "Requires the Government to take measures to protect persons with disabilities from being subjected to cruelty, inhuman, or degrading treatment."
    },
    {
        number: "Section 12",
        chapter: "Chapter II: Rights & Entitlements",
        title: "Access to Justice",
        summary: "Ensures persons with disabilities have access to any court, tribunal, authority, or office without discrimination. Mandates suitable support and accommodations during legal proceedings."
    },
    {
        number: "Section 14",
        chapter: "Chapter II: Rights & Entitlements",
        title: "Provision for Guardianship",
        summary: "Establishes statutory rules for legal guardianship. Mandates that where a District Court or designated authority finds a person with disability is unable to take legally binding decisions, it can grant limited guardianship. Joint/limited guardianship prioritizes supporting the person's own decision-making."
    },
    {
        number: "Section 16",
        chapter: "Chapter III: Education",
        title: "Inclusive Education",
        summary: "Mandates that all government-funded or recognized educational institutions provide inclusive education to children with disabilities. This includes admitting them without discrimination, making the campus accessible, providing suitable pedagogical support, and individual learning aids."
    },
    {
        number: "Section 17",
        chapter: "Chapter III: Education",
        title: "Measures for Inclusive Education",
        summary: "Requires governments to conduct surveys, train teachers, employ special educators, provide free books and learning materials, and supply scribes or readers to students with benchmark disabilities."
    },
    {
        number: "Section 19",
        chapter: "Chapter IV: Skill Development & Employment",
        title: "Vocational Training and Self-employment",
        summary: "Requires the government to formulate schemes and programs including provision of loans at concessional rates to facilitate vocational training and self-employment."
    },
    {
        number: "Section 20",
        chapter: "Chapter IV: Skill Development & Employment",
        title: "Non-discrimination in Employment",
        summary: "Forbids discrimination in employment. Government establishments cannot deny promotions based on disability. If an employee acquires a disability during service, they cannot be fired or demoted. They must be shifted to an equivalent post or kept on a supernumerary post until retirement."
    },
    {
        number: "Section 21",
        chapter: "Chapter IV: Skill Development & Employment",
        title: "Equal Opportunity Policy",
        summary: "Mandates that every establishment (both government and private) notify and register an Equal Opportunity Policy detailing facilities, accommodations, and positions reserved for persons with disabilities."
    },
    {
        number: "Section 23",
        chapter: "Chapter IV: Skill Development & Employment",
        title: "Grievance Redressal Officer",
        summary: "Mandates that every government establishment appoint a Grievance Redressal Officer. Any employee aggrieved by discrimination can lodge a complaint, which must be investigated within two weeks."
    },
    {
        number: "Section 31",
        chapter: "Chapter VI: Special Provisions for Benchmark Disabilities",
        title: "Free Education (Ages 6 to 18)",
        summary: "Every child with a benchmark disability (minimum 40%) has the right to free education in a neighborhood school or special school of their choice between the ages of 6 and 18."
    },
    {
        number: "Section 32",
        chapter: "Chapter VI: Special Provisions for Benchmark Disabilities",
        title: "Reservation in Higher Education",
        summary: "Mandates a minimum of 5% reservation (seat allocation) for students with benchmark disabilities in all government and government-aided higher educational institutions, along with an upper age relaxation of 5 years."
    },
    {
        number: "Section 34",
        chapter: "Chapter VI: Special Provisions for Benchmark Disabilities",
        title: "Reservation in Government Jobs",
        summary: "Mandates government establishments to reserve at least 4% of their vacancies for persons with benchmark disabilities. This includes 1% each for: (a) Blindness & low vision, (b) Deaf & hard of hearing, (c) Locomotor disability (cerebral palsy, muscular dystrophy, cured leprosy, acid attack), (d) Autism, intellectual disability, specific learning disability, mental illness, or multiple disabilities."
    },
    {
        number: "Section 40",
        chapter: "Chapter VIII: Duties of Governments",
        title: "Accessibility Standards",
        summary: "Mandates the Central Government to formulate accessibility standards for physical environment, transportation, information & communication technology, and public utilities, which all public and private service providers must comply with."
    },
    {
        number: "Section 89",
        chapter: "Chapter XVI: Offences and Penalties",
        title: "General Penalty for Contraventions",
        summary: "Any person who violates any provision of the Act or its rules is punishable with a fine of up to ₹10,000 for the first offence, and between ₹50,000 and ₹5,00,000 for subsequent violations."
    },
    {
        number: "Section 92",
        chapter: "Chapter XVI: Offences and Penalties",
        title: "Punishment for Atrocities and Abuse",
        summary: "Criminalizes atrocities. Anyone who insults, intimidates, assaults, sexually exploits, or denies food/medical care to a person with disability is punishable with imprisonment from 6 months to 5 years, along with a fine."
    },
    {
        number: "Section 25 (MHCA)",
        chapter: "Mental Healthcare Act, 2017",
        title: "Right to Access Medical Records",
        summary: "Explicitly guarantees persons undergoing mental health treatment the right to access their basic clinical records, history, diagnosis, and treatment plans. It distinguishes between standard EHR clinical notes (which must be accessible) and therapist's private psychotherapy notes (which may be protected)."
    }
];

const RPWD_QA = [
    {
        id: "qa_termination",
        question: "Can an employer fire me if I develop a mental illness or other disability while working?",
        section: "Section 20(4)",
        answer: "Absolutely not. Under Section 20(4) of the RPwD Act 2016, if an employee acquires a disability during service, they cannot be terminated or reduced in rank. If they can no longer perform their original duties, they must be shifted to another post with the same pay scale and benefits. If no such post is available, they must be kept on a supernumerary post (a temporary position created specifically for them) until a suitable vacancy arises or they reach retirement age."
    },
    {
        id: "qa_promotion",
        question: "What are my rights if I am denied a promotion or job opportunity because of my disability?",
        section: "Section 20(1) & Section 21",
        answer: "Under Section 20(1), government establishments are strictly forbidden from discriminating against persons with disabilities in employment. Disability cannot be used as a ground to deny a promotion. Section 21 requires every employer (both government and private) to notify and register an Equal Opportunity Policy detailing how they support employees with disabilities, which is monitored by the Commissioner."
    },
    {
        id: "qa_exams",
        question: "What exam accommodations and concessions can students with disabilities get?",
        section: "Section 17 & Ministry Guidelines",
        answer: "Students with benchmark disabilities (40% or more) are legally entitled to: (1) Scribes or readers to write/read the exam. (2) Compensatory time of 20 minutes extra per hour of exam. (3) Accessible formats (large print, audio, braille, or laptops). (4) Exemption from secondary languages. These guidelines apply to all CBSE, state board, university, and competitive entrance exams in India."
    },
    {
        id: "qa_abuse",
        question: "How does the law protect individuals with disabilities from cruelty, insults, or abuse?",
        section: "Section 6, 89 & 92",
        answer: "The Act provides strong criminal and civil protections. Section 92 makes it a cognizable criminal offence to intentionally insult, intimidate, assault, or sexually exploit a person with a disability in public view, punishable by 6 months to 5 years of rigorous imprisonment and a fine. Grievances can be filed with the designated Grievance Redressal Officer in organizations, the Police (via an FIR), or directly with the State/Chief Commissioner for Persons with Disabilities."
    },
    {
        id: "qa_jobs",
        question: "How do government job reservations work under the RPwD Act?",
        section: "Section 34",
        answer: "The Act mandates government establishments to reserve at least 4% of all vacancies for persons with benchmark disabilities. The 4% is split: 1% for blindness/low vision; 1% for deaf/hard of hearing; 1% for locomotor disabilities (including cerebral palsy, cured leprosy, dwarfism, acid attack victims, muscular dystrophy); and 1% for autism, intellectual disabilities, specific learning disabilities, mental illness, and multiple disabilities."
    },
    {
        id: "qa_medical_records",
        question: "Do I have a legal right to access my psychiatric medical records and therapy notes?",
        section: "Section 25 (MHCA 2017) & EHR Standards",
        answer: "Yes. Under Section 25 of the Mental Healthcare Act, 2017 (which governs psychiatric care alongside the RPwD Act), every patient has a statutory right to access their basic clinical records, including admission/discharge summaries, diagnoses, test results, and treatment plans. However, a legal distinction is made: clinical progress notes (such as SOAP notes in the EHR) are fully accessible to patients, whereas a therapist's private personal 'psychotherapy process notes' (containing raw conversational transcripts and clinical reflections) are kept separate and confidential to safeguard therapeutic trust."
    }
];
