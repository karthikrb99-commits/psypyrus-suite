import { useState } from 'react';
import { ProductTourVideoPlayer } from '../ProductTourVideoPlayer';

export function LandingPage({ onEnterPortal, onOpenLegal }) {
    const [activeAppleTab, setActiveAppleTab] = useState(null); // 'ios' or 'macos' or null
    const [demoMode, setDemoMode] = useState('diagnostics'); // 'diagnostics' or 'soap'
    const [showWarning, setShowWarning] = useState(true);
    
    // Interactive Diagnostics Teaser State
    const [mddSymptoms, setMddSymptoms] = useState({
        depressedMood: true,
        anhedonia: false,
        weightChange: true,
        insomnia: true,
        agitation: false,
        fatigue: true,
        worthlessness: false,
        concentration: true,
        suicideIdeation: false
    });
    const [durationWeeks, setDurationWeeks] = useState(3);
    const [exclusionMet, setExclusionMet] = useState(false);

    // Interactive SOAP note teaser state
    const [soapInput, setSoapInput] = useState(
        "Patient Liam Carter reports feeling overwhelmed at work. Has trouble sleeping, taking 90 mins to fall asleep. Feels tired daily. Denies suicidal ideation. Focus was maintained throughout therapy."
    );
    const [soapOutput, setSoapOutput] = useState("");
    const [isCompilingSoap, setIsCompilingSoap] = useState(false);

    const toggleSymptom = (key) => {
        setMddSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Diagnostics engine checker (subset of real app logic)
    const runTeaserDiagnostics = () => {
        const symptomsCount = Object.values(mddSymptoms).filter(Boolean).length;
        const hasCoreSymptom = mddSymptoms.depressedMood || mddSymptoms.anhedonia;
        const durationMet = durationWeeks >= 2;

        if (exclusionMet) {
            return {
                status: "EXCLUDED",
                color: "var(--color-warning)",
                message: "Symptoms are attributed to another condition or physiological substance abuse. Diagnostic checklist invalid."
            };
        }

        if (symptomsCount >= 5 && hasCoreSymptom && durationMet) {
            return {
                status: "MDD CRITERIA MET",
                color: "var(--color-error)",
                message: `Differential diagnosis: Major Depressive Disorder (MDD) indicated. ${symptomsCount} active symptoms present over ${durationWeeks} weeks. Core criteria met.`
            };
        } else {
            return {
                status: "SUB-THRESHOLD SYMPTOMS",
                color: "var(--color-secondary)",
                message: `Active symptoms: ${symptomsCount}/9. Core symptom: ${hasCoreSymptom ? "Yes" : "No"}. Duration criteria: ${durationMet ? "Yes" : "No"}. Follow-up evaluation indicated.`
            };
        }
    };

    const handleCompileSoap = () => {
        setIsCompilingSoap(true);
        setTimeout(() => {
            const compiledNote = 
`[PsyPyrus AI OS - Compiled Clinical SOAP Note]
==============================================
SUBJECTIVE:
- Patient reports feeling "overwhelmed at work."
- Reports sleep onset latency of 90 minutes.
- Endorses daily fatigue.
- Patient denies suicidal ideation.

OBJECTIVE:
- Patient was responsive and communicative.
- Focus was maintained throughout the session.
- Appearance: Appropriate grooming.

ASSESSMENT:
- Elevated occupational distress.
- Secondary insomnia traits.
- MDD and anxiety features remain active but stable.

PLAN:
- Review cognitive restructuring worksheets.
- Implement sleep hygiene instructions (abdominal breathing exercises).
- Next teletherapy session scheduled in 1 week.`;
            setSoapOutput(compiledNote);
            setIsCompilingSoap(false);
        }, 1200);
    };

    const diagResult = runTeaserDiagnostics();

    return (
        <div className="landing-page-wrapper" id="landing-page-root">
            {/* --- TOP WARNING BANNER --- */}
            {showWarning && (
                <div className="warning-banner" id="prototype-warning-banner">
                    <div className="warning-banner-content">
                        <i className="fa-solid fa-triangle-exclamation warning-banner-icon"></i>
                        <p className="warning-banner-text">
                            <strong>Notice:</strong> The current version of PsyPyrus is a mock prototype, vibe-coded MVP. AI-generated SOAP notes, clinical decision matrices, and compliance dashboards are simulations. Do not use for active clinical diagnostic determinations.
                        </p>
                    </div>
                    <button className="warning-banner-close" onClick={() => setShowWarning(false)} aria-label="Dismiss warning">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            )}

            {/* --- HEADER --- */}
            <header className="landing-header">
                <div className="landing-brand">
                    <i className="fa-solid fa-brain landing-logo-icon"></i>
                    <div>
                        <span className="brand-title">PsyPyrus <span className="brand-accent">AI OS</span></span>
                        <span className="brand-subtitle">Mental Health Operating System</span>
                    </div>
                </div>
                <nav className="landing-nav">
                    <a href="#vision-section" className="nav-anchor">Vision</a>
                    <a href="#features-section" className="nav-anchor">Features</a>
                    <a href="#teaser-section" className="nav-anchor">Interactive Demo</a>
                    <a href="#roadmap-section" className="nav-anchor">Roadmap</a>
                    <a href="#contribute-section" className="nav-anchor">Contribute</a>
                    <a href="#manifesto-section" className="nav-anchor">Manifesto</a>
                    <button className="nav-cta-btn" onClick={onEnterPortal}>
                        Launch Portal <i className="fa-solid fa-arrow-right-to-bracket"></i>
                    </button>
                </nav>
            </header>

            {/* --- HERO SECTION --- */}
            <section className="landing-hero">
                <div className="hero-glow-blob"></div>
                <div className="hero-content">
                    <div className="hero-pill-badge">
                        <i className="fa-solid fa-shield-halved"></i> HIPAA, GDPR & DISHA Privacy Shield Active
                    </div>
                    <h1 className="hero-main-title">
                        The Next-Generation <br />
                        <span className="gradient-text">Mental Health Operating System</span>
                    </h1>
                    <p className="hero-desc-para">
                        PsyPyrus AI OS is a premium open-source clinical suite designed for secure mental health operations, client charting, and clinical decision support. Empowering practitioners with local diagnostic checkers and AI SOAP notes, while providing patients a calming wellness companion portal.
                    </p>
                    <div className="hero-actions-row">
                        <button className="primary-action-btn" onClick={onEnterPortal}>
                            Launch Web Companion <i className="fa-solid fa-network-wired"></i>
                        </button>
                        <a href="#download-section" className="secondary-action-btn">
                            Download Clients <i className="fa-solid fa-download"></i>
                        </a>
                    </div>
                </div>

                {/* Hero Showcase Mockup */}
                <div className="hero-mockup-showcase">
                    <div className="mockup-header-toolbar">
                        <div className="mockup-window-controls">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span className="mockup-window-title">psypyrus-ai-suite://workspace</span>
                    </div>
                    <div className="mockup-content-grid">
                        <div className="mockup-item">
                            <span className="mockup-lbl">System Security Vault</span>
                            <span className="mockup-val active"><i className="fa-solid fa-lock"></i> AES-GCM-256 Envelope</span>
                            <span className="mockup-sub">Compliance: HIPAA, GDPR, DISHA</span>
                        </div>
                        <div className="mockup-item">
                            <span className="mockup-lbl">Local Diagnostics Engine</span>
                            <span className="mockup-val" style={{ color: 'var(--color-secondary)' }}><i className="fa-solid fa-calculator"></i> DSM-5-TR Catalog Active</span>
                            <span className="mockup-sub">Comorbidities & Multi-Scale Scores</span>
                        </div>
                        <div className="mockup-item">
                            <span className="mockup-lbl">AI Clinical Copilot</span>
                            <span className="mockup-val" style={{ color: 'var(--color-accent)' }}><i className="fa-solid fa-wand-magic-sparkles"></i> Gemini 2.5 Flash</span>
                            <span className="mockup-sub">Automated Clinical Notes Scribe</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- VISION SECTION --- */}
            <section className="landing-vision" id="vision-section">
                <div className="vision-container">
                    <h2 className="section-title">A Movement for Mental Health Liberation</h2>
                    <p className="section-subtitle">
                        Building a secure, accessible, and scientifically transparent digital commons.
                    </p>
                    
                    <div className="vision-quote-card">
                        <div className="quote-icon"><i className="fa-solid fa-quote-left"></i></div>
                        <p className="quote-text">
                            Knowledge that can reduce suffering should not be locked away. The tools that help humanity understand and heal itself belong, in spirit, to humanity itself.
                        </p>
                        <span className="quote-author">— The PsyPyrus Vision Statement</span>
                    </div>

                    <div className="vision-grid">
                        <div className="vision-card">
                            <div className="vision-icon"><i className="fa-solid fa-book-open-reader"></i></div>
                            <h3>Open Clinical Knowledge</h3>
                            <p>Democratizing advanced clinical engines. Our diagnostic checkers and logic rulesets are transparent, auditable, and open to peer validation.</p>
                        </div>
                        <div className="vision-card">
                            <div className="vision-icon"><i className="fa-solid fa-flask"></i></div>
                            <h3>Reproducible Science</h3>
                            <p>Integrating modern psychiatric taxonomy. Aligning tools with structural research frameworks like HiTOP and neural domains like RDoC.</p>
                        </div>
                        <div className="vision-card">
                            <div className="vision-icon"><i className="fa-solid fa-globe"></i></div>
                            <h3>Accessible & Local Care</h3>
                            <p>Designing cross-platform clients that operate locally offline. Built to support low-resource, cross-cultural, and remote settings.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section className="landing-features" id="features-section">
                <h2 className="section-title">Engineered for Excellence Across 5 Core Pillars</h2>
                <p className="section-subtitle">
                    A unified code framework that scales across Web, Desktop, and Mobile clients.
                </p>

                <div className="features-container-grid">
                    <div className="feature-item-card">
                        <div className="feature-icon-wrapper color-blue">
                            <i className="fa-solid fa-users-viewfinder"></i>
                        </div>
                        <h3>Dual-Persona Workspace</h3>
                        <p>Toggle seamlessly between the Professional Clinician Suite (EHR records, SOAP scribe, telehealth) and the Patient Wellness Hub (mood trackers, breathing lounge, homework).</p>
                    </div>

                    <div className="feature-item-card">
                        <div className="feature-icon-wrapper color-green">
                            <i className="fa-solid fa-user-shield"></i>
                        </div>
                        <h3>Cryptographic HIPAA Shield</h3>
                        <p>Fully compliant local database vaults backed by AES-GCM-256 envelope encryption. Features biometric lock screen configurations and continuous audit logs.</p>
                    </div>

                    <div className="feature-item-card">
                        <div className="feature-icon-wrapper color-gold">
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                        </div>
                        <h3>AI SOAP Notes Copilot</h3>
                        <p>Leverage Google Gemini 2.5 Flash to synthesize transcripts and therapy session drafts into structured medical SOAP notes, goals, and behavioral homework sheets.</p>
                    </div>

                    <div className="feature-item-card">
                        <div className="feature-icon-wrapper color-teal">
                            <i className="fa-solid fa-laptop-medical"></i>
                        </div>
                        <h3>DSM-5-TR Diagnostics Engine</h3>
                        <p>Local offline diagnostic rulesets matching official criteria for Major Depression (MDD) and Generalized Anxiety Disorder (GAD-7) to speed intake evaluations.</p>
                    </div>

                    <div className="feature-item-card">
                        <div className="feature-icon-wrapper color-purple">
                            <i className="fa-solid fa-magnifying-glass-chart"></i>
                        </div>
                        <h3>ClinicalTrials.gov Finder</h3>
                        <p>Automatically queries and parses active, recruiting clinical trials using official REST API v2 endpoints based on patient indicators and diagnostic findings.</p>
                    </div>
                </div>
            </section>

            {/* --- INTERACTIVE DEMO --- */}
            <section className="landing-teaser" id="teaser-section">
                <h2 className="section-title">Experience the Operating System</h2>
                <p className="section-subtitle">Test out our clinical diagnostics checker and AI SOAP note scribe tools live.</p>

                <div className="teaser-box-wrapper">
                    <div className="teaser-menu-bar">
                        <button 
                            className={`teaser-menu-btn ${demoMode === 'diagnostics' ? 'active' : ''}`}
                            onClick={() => setDemoMode('diagnostics')}
                        >
                            <i className="fa-solid fa-calculator"></i> DSM-5-TR Diagnostic Checker
                        </button>
                        <button 
                            className={`teaser-menu-btn ${demoMode === 'soap' ? 'active' : ''}`}
                            onClick={() => setDemoMode('soap')}
                        >
                            <i className="fa-solid fa-wand-magic-sparkles"></i> AI SOAP Notes Compiler
                        </button>
                    </div>

                    <div className="teaser-content-area">
                        {demoMode === 'diagnostics' ? (
                            <div className="teaser-diagnostics-layout">
                                <div className="teaser-form-column">
                                    <h4>Major Depressive Disorder Checklist</h4>
                                    <span className="field-hint">Toggle diagnostic symptoms below (Requires 5+ including 1 core symptom):</span>
                                    
                                    <div className="teaser-checklist-grid">
                                        <label className="teaser-checkbox-row">
                                            <input 
                                                type="checkbox" 
                                                checked={mddSymptoms.depressedMood} 
                                                onChange={() => toggleSymptom('depressedMood')}
                                                className="teaser-checkbox"
                                            />
                                            <span className="teaser-checkbox-label">Depressed Mood *</span>
                                        </label>
                                        <label className="teaser-checkbox-row">
                                            <input 
                                                type="checkbox" 
                                                checked={mddSymptoms.anhedonia} 
                                                onChange={() => toggleSymptom('anhedonia')}
                                                className="teaser-checkbox"
                                            />
                                            <span className="teaser-checkbox-label">Anhedonia (Loss of Interest) *</span>
                                        </label>
                                        <label className="teaser-checkbox-row">
                                            <input 
                                                type="checkbox" 
                                                checked={mddSymptoms.weightChange} 
                                                onChange={() => toggleSymptom('weightChange')}
                                                className="teaser-checkbox"
                                            />
                                            <span className="teaser-checkbox-label">Appetite/Weight Change</span>
                                        </label>
                                        <label className="teaser-checkbox-row">
                                            <input 
                                                type="checkbox" 
                                                checked={mddSymptoms.insomnia} 
                                                onChange={() => toggleSymptom('insomnia')}
                                                className="teaser-checkbox"
                                            />
                                            <span className="teaser-checkbox-label">Insomnia / Hypersomnia</span>
                                        </label>
                                        <label className="teaser-checkbox-row">
                                            <input 
                                                type="checkbox" 
                                                checked={mddSymptoms.agitation} 
                                                onChange={() => toggleSymptom('agitation')}
                                                className="teaser-checkbox"
                                            />
                                            <span className="teaser-checkbox-label">Psychomotor Agitation</span>
                                        </label>
                                        <label className="teaser-checkbox-row">
                                            <input 
                                                type="checkbox" 
                                                checked={mddSymptoms.fatigue} 
                                                onChange={() => toggleSymptom('fatigue')}
                                                className="teaser-checkbox"
                                            />
                                            <span className="teaser-checkbox-label">Fatigue / Loss of Energy</span>
                                        </label>
                                        <label className="teaser-checkbox-row">
                                            <input 
                                                type="checkbox" 
                                                checked={mddSymptoms.worthlessness} 
                                                onChange={() => toggleSymptom('worthlessness')}
                                                className="teaser-checkbox"
                                            />
                                            <span className="teaser-checkbox-label">Worthlessness / Guilt</span>
                                        </label>
                                        <label className="teaser-checkbox-row">
                                            <input 
                                                type="checkbox" 
                                                checked={mddSymptoms.concentration} 
                                                onChange={() => toggleSymptom('concentration')}
                                                className="teaser-checkbox"
                                            />
                                            <span className="teaser-checkbox-label">Diminished Concentration</span>
                                        </label>
                                        <label className="teaser-checkbox-row">
                                            <input 
                                                type="checkbox" 
                                                checked={mddSymptoms.suicideIdeation} 
                                                onChange={() => toggleSymptom('suicideIdeation')}
                                                className="teaser-checkbox"
                                            />
                                            <span className="teaser-checkbox-label">Suicidal Ideation</span>
                                        </label>
                                    </div>

                                    <div className="teaser-sliders-row" style={{ marginTop: '20px' }}>
                                        <div className="teaser-slider-group">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                <span>Symptom Duration:</span>
                                                <strong>{durationWeeks} Weeks</strong>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="1" 
                                                max="12" 
                                                value={durationWeeks} 
                                                onChange={(e) => setDurationWeeks(Number(e.target.value))}
                                                className="teaser-range-slider"
                                            />
                                        </div>

                                        <label className="teaser-checkbox-row" style={{ marginTop: '10px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={exclusionMet} 
                                                onChange={(e) => setExclusionMet(e.target.checked)}
                                                className="teaser-checkbox"
                                            />
                                            <span className="teaser-checkbox-label text-warning" style={{ fontSize: '12px' }}>
                                                Exclusion Met (Attributed to substance use or other physiological condition)
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="teaser-outcome-column">
                                    <div className="teaser-gauge-card" style={{ borderColor: diagResult.color }}>
                                        <span className="gauge-lbl">Diagnostics Report</span>
                                        <h3 className="gauge-title" style={{ color: diagResult.color }}>{diagResult.status}</h3>
                                        <p className="gauge-message">{diagResult.message}</p>
                                        <div className="code-block-preview">
                                            <pre>
{`{
  "activeSymptoms": ${Object.values(mddSymptoms).filter(Boolean).length},
  "coreSymptomMet": ${mddSymptoms.depressedMood || mddSymptoms.anhedonia ? "true" : "false"},
  "durationWeeks": ${durationWeeks},
  "exclusionMet": ${exclusionMet ? "true" : "false"},
  "diagnosticDifferential": "${diagResult.status}"
}`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="teaser-soap-layout">
                                <div className="teaser-input-card">
                                    <h4>AI SOAP Note Text Scribe</h4>
                                    <span className="field-hint">Paste clinical logs, transcription segments, or dictation snippets:</span>
                                    <textarea 
                                        className="teaser-textarea"
                                        value={soapInput}
                                        onChange={(e) => setSoapInput(e.target.value)}
                                        placeholder="Enter patient details..."
                                    />
                                    <button 
                                        className="teaser-compile-btn"
                                        onClick={handleCompileSoap}
                                        disabled={isCompilingSoap || !soapInput.trim()}
                                    >
                                        {isCompilingSoap ? (
                                            <>
                                                <i className="fa-solid fa-spinner fa-spin"></i> Processing Clinical Scribe...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-gears"></i> Compile SOAP Note (Gemini Sandbox)
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="teaser-output-card">
                                    <h4>Synthesized SOAP Output</h4>
                                    {soapOutput ? (
                                        <pre className="teaser-pre">{soapOutput}</pre>
                                    ) : (
                                        <div className="teaser-output-placeholder">
                                            <i className="fa-solid fa-wand-magic-sparkles placeholder-magic-icon"></i>
                                            <p>Press "Compile SOAP Note" to run the natural language parser and synthesize the SOAP record.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* --- PRODUCT TOUR VIDEO --- */}
            <section className="landing-teaser-video" style={{ padding: '0px 24px 60px 24px' }}>
                <ProductTourVideoPlayer />
            </section>

            {/* --- OPEN SOURCE ROADMAP --- */}
            <section className="landing-roadmap" id="roadmap-section">
                <div className="roadmap-container">
                    <h2 className="section-title">Development Roadmap</h2>
                    <p className="section-subtitle">
                        Tracking milestones across the client applications and clinical databases.
                    </p>

                    <div className="timeline">
                        <div className="timeline-item completed">
                            <div className="timeline-badge"><i className="fa-solid fa-check"></i></div>
                            <div className="timeline-panel">
                                <div className="timeline-heading">
                                    <h4>Milestone 1: Foundation & Core Layout</h4>
                                    <span className="milestone-status">Completed</span>
                                </div>
                                <div className="timeline-body">
                                    <p>Migrated styling, layout elements (Sidebar, Header, Command Palette), and configured IndexedDB client wrappers.</p>
                                </div>
                            </div>
                        </div>

                        <div className="timeline-item active">
                            <div className="timeline-badge"><i className="fa-solid fa-spinner fa-spin"></i></div>
                            <div className="timeline-panel">
                                <div className="timeline-heading">
                                    <h4>Milestone 2: Security & Regional Compliance</h4>
                                    <span className="milestone-status text-primary">In Progress</span>
                                </div>
                                <div className="timeline-body">
                                    <p>HIPAA/GDPR/DISHA compliant credentials vault, ABHA ID verification sandboxes, Aadhaar health card generators, and RCI compliance checklists.</p>
                                </div>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-badge"><i className="fa-solid fa-clock"></i></div>
                            <div className="timeline-panel">
                                <div className="timeline-heading">
                                    <h4>Milestone 3: AI Scribe & Clinical Workspace</h4>
                                    <span className="milestone-status text-muted">Planned</span>
                                </div>
                                <div className="timeline-body">
                                    <p>Integrating Gemini 3.5 Flash REST endpoints for SOAP/MSE narrative builders, interactive DSM graph visualizer, and SMART goals generators.</p>
                                </div>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-badge"><i className="fa-solid fa-clock"></i></div>
                            <div className="timeline-panel">
                                <div className="timeline-heading">
                                    <h4>Milestone 4: Matrix Explorers & Interactive Labs</h4>
                                    <span className="milestone-status text-muted">Planned</span>
                                </div>
                                <div className="timeline-body">
                                    <p>Clinical explorers for HiTOP models and RDoC neural domains, telehealth workspaces, and patient wellness modules.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CONTRIBUTOR GUIDE --- */}
            <section className="landing-contributor" id="contribute-section">
                <div className="contributor-container">
                    <h2 className="section-title">Open-Source Contributor Guide</h2>
                    <p className="section-subtitle">
                        PsyPyrus is interdisciplinary. We invite contributors across all fields of clinical care and engineering.
                    </p>

                    <div className="contributor-grid">
                        <div className="contributor-card">
                            <div className="contrib-icon"><i className="fa-solid fa-user-doctor"></i></div>
                            <h4>Clinicians & Caregivers</h4>
                            <p>Validate clinical diagnostic pathways, evaluate AI SOAP scribe quality, and review rules for patient safety guidelines.</p>
                        </div>
                        <div className="contributor-card">
                            <div className="contrib-icon"><i className="fa-solid fa-code"></i></div>
                            <h4>Engineers & Architects</h4>
                            <p>Optimize React/Kotlin/Swift frontend clients, build local database Room/IndexedDB engines, and implement HL7 FHIR structures.</p>
                        </div>
                        <div className="contributor-card">
                            <div className="contrib-icon"><i className="fa-solid fa-dna"></i></div>
                            <h4>Researchers & Academics</h4>
                            <p>Improve the HiTOP Matrix Explorer and RDoC domains, benchmark diagnostic scoring models, and design clinical studies.</p>
                        </div>
                        <div className="contributor-card">
                            <div className="contrib-icon"><i className="fa-solid fa-palette"></i></div>
                            <h4>Designers & Advocates</h4>
                            <p>Conduct accessibility and usability studies, improve patient wellness layouts, and enhance localization translation files.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- RESEARCH MANIFESTO --- */}
            <section className="landing-manifesto" id="manifesto-section">
                <div className="manifesto-content">
                    <h2 className="section-title">The PsyPyrus Research Manifesto</h2>
                    <p className="section-subtitle">A commitment to open science and the dismantling of proprietary diagnostic silos.</p>
                    
                    <div className="manifesto-grid">
                        <div className="manifesto-text-block">
                            <h3>Breaking Down Diagnostic Silos</h3>
                            <p>
                                Traditional electronic health records (EHRs) are built around proprietary databases that isolate data and lock clinicians into rigid models. PsyPyrus aims to break these silos by integrating unified terminologies and scientific systems directly into the application layer.
                            </p>
                            <p>
                                We map diagnostic classifications to SNOMED CT concepts and evaluation results to LOINC identifiers, allowing clinical documents to easily compile into international HL7 FHIR formats.
                            </p>
                        </div>
                        <div className="manifesto-text-block">
                            <h3>Embracing HiTOP & RDoC Frameworks</h3>
                            <p>
                                Clinical psychology is moving beyond simple binary categories. By incorporating the Hierarchical Taxonomy of Psychopathology (HiTOP) and the NIMH's Research Domain Criteria (RDoC), we allow researchers to study mental health disorders along dimensional spectra and underlying bio-behavioral systems.
                            </p>
                            <p>
                                PsyPyrus provides interactive explorers for these systems, bridge-linking active patient indicators directly to modern neuroscience and clinical research findings.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- DOWNLOAD HUB --- */}
            <section className="landing-downloads" id="download-section">
                <h2 className="section-title">Cross-Platform Deployments Hub</h2>
                <p className="section-subtitle">
                    Select your platform build and deploy installers compiled directly from the Mono-Repo source code.
                </p>

                <div className="download-grid-cards">
                    {/* Android Card */}
                    <div className="download-platform-card">
                        <div className="platform-header">
                            <i className="fa-brands fa-android platform-icon icon-android"></i>
                            <div>
                                <h4>Android Client</h4>
                                <span className="platform-meta">Native Kotlin (SDK 36)</span>
                            </div>
                        </div>
                        <p className="platform-desc">Includes offline SQLite bindings, Room DB, biometric prompt, and local diagnostics.</p>
                        <a href="/psypyrus-ai-debug.apk" download className="platform-download-link anchor-button-android">
                            <i className="fa-solid fa-download"></i> Download APK (.apk)
                        </a>
                    </div>

                    {/* Windows Card */}
                    <div className="download-platform-card">
                        <div className="platform-header">
                            <i className="fa-brands fa-windows platform-icon icon-windows"></i>
                            <div>
                                <h4>Windows Desktop</h4>
                                <span className="platform-meta">Electron + React App</span>
                            </div>
                        </div>
                        <p className="platform-desc">Features desktop window shell management, system tray options, and system logging capabilities.</p>
                        <a href="/PsyPyrus_1.0.0.exe" download className="platform-download-link anchor-button-windows">
                            <i className="fa-solid fa-download"></i> Download Installer (.exe)
                        </a>
                    </div>

                    {/* macOS Card */}
                    <div className="download-platform-card">
                        <div className="platform-header">
                            <i className="fa-brands fa-apple platform-icon icon-mac"></i>
                            <div>
                                <h4>macOS Desktop</h4>
                                <span className="platform-meta">SwiftUI Native App</span>
                            </div>
                        </div>
                        <p className="platform-desc">Beautiful SwiftUI target pulling code-shared files from the core iOS directory.</p>
                        <button className="platform-info-btn btn-mac-info" onClick={() => setActiveAppleTab('macos')}>
                            <i className="fa-solid fa-gears"></i> Build Instructions
                        </button>
                    </div>

                    {/* iOS Card */}
                    <div className="download-platform-card">
                        <div className="platform-header">
                            <i className="fa-solid fa-mobile-screen-button platform-icon icon-ios"></i>
                            <div>
                                <h4>iOS Mobile</h4>
                                <span className="platform-meta">SwiftUI Mobile App</span>
                            </div>
                        </div>
                        <p className="platform-desc">Fully optimized Apple phone layouts, CoreData models, and biometric credentials setup.</p>
                        <button className="platform-info-btn btn-ios-info" onClick={() => setActiveAppleTab('ios')}>
                            <i className="fa-solid fa-gears"></i> Build Instructions
                        </button>
                    </div>
                </div>
            </section>

            {/* --- JOIN THE MOVEMENT (COMMUNITY LINKS) --- */}
            <section className="landing-community" style={{ padding: '60px 24px', background: 'rgba(20, 184, 166, 0.03)', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 className="section-title">Join the PsyPyrus Movement</h2>
                    <p className="section-subtitle">We are building the future of digital mental health tools in the open. Join our community channels to participate.</p>
                    
                    <div className="community-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '32px', textAlign: 'left' }}>
                        
                        {/* GitHub Link Card */}
                        <a href="https://github.com/karthikrb99-commits/psypyrus-suite" target="_blank" rel="noopener noreferrer" className="community-card-link" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="community-card" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '28px', transition: 'transform var(--transition-fast), border-color var(--transition-fast)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                                        <i className="fa-brands fa-github"></i>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>GitHub Repository</h4>
                                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Explore the codebase</span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>
                                    Browse the monorepo, submit issues, propose pull requests, or review native code configurations for all target clients.
                                </p>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600', marginTop: '16px' }}>
                                    View Repository <i className="fa-solid fa-arrow-right"></i>
                                </span>
                            </div>
                        </a>

                        {/* WhatsApp Link Card */}
                        <a href="https://chat.whatsapp.com/IhpkN47zdIwBIyQNySOfJx" target="_blank" rel="noopener noreferrer" className="community-card-link" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="community-card" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '28px', transition: 'transform var(--transition-fast), border-color var(--transition-fast)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(37, 211, 102, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', color: '#25D366' }}>
                                        <i className="fa-brands fa-whatsapp"></i>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>WhatsApp Community</h4>
                                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Chat with contributors</span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>
                                    Join our developer and clinician group to discuss features, align on specifications, ask questions, or connect with maintainers.
                                </p>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#25D366', fontWeight: '600', marginTop: '16px' }}>
                                    Join Chat Group <i className="fa-solid fa-arrow-right"></i>
                                </span>
                            </div>
                        </a>

                        {/* LinkedIn Article Card */}
                        <a href="https://www.linkedin.com/pulse/join-psypyrus-movement-help-build-future-mental-health-b-karthik-ravi-hvrzc" target="_blank" rel="noopener noreferrer" className="community-card-link" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="community-card" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '28px', transition: 'transform var(--transition-fast), border-color var(--transition-fast)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(10, 102, 194, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', color: '#0A66C2' }}>
                                        <i className="fa-brands fa-linkedin"></i>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>LinkedIn Article</h4>
                                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Read the launching post</span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>
                                    Read our launch manifest article explaining the goals, system architecture, and why mental health care deserves a digital commons.
                                </p>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0A66C2', fontWeight: '600', marginTop: '16px' }}>
                                    Read Article <i className="fa-solid fa-arrow-right"></i>
                                </span>
                            </div>
                        </a>
                        
                    </div>
                </div>
            </section>

            {/* --- COMPLIANCE FOOTER --- */}
            <footer className="landing-footer">
                <div className="footer-compliance-row">
                    <span className="compliance-shield-tag"><i className="fa-solid fa-shield-halved"></i> HIPAA-Aware Architecture</span>
                    <span className="compliance-shield-tag"><i className="fa-solid fa-key"></i> AES-GCM-256 Encryption Vaults</span>
                    <span className="compliance-shield-tag"><i className="fa-solid fa-calculator"></i> DSM-5-TR Compliant Logic</span>
                </div>
                
                <p className="clinical-disclaimer">
                    <strong>Clinical Disclaimer:</strong> PsyPyrus AI OS serves as an administrative and clinical decision support system (CDSS). It does not provide medical services. All AI predictions, SOAP syntheses, and diagnostic indicators must be approved, reviewed, and finalized by a licensed professional.
                </p>
                
                <div className="footer-bottom-credits">
                    <span>© {new Date().getFullYear()} PsyPyrus Suite. All rights reserved. Open-source under Apache License 2.0.</span>
                    <span>Mono-Repo Codebase version 2.0.0</span>
                </div>

                <div className="footer-links-row" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px', fontSize: '11px', flexWrap: 'wrap', opacity: 0.8 }}>
                    <button onClick={() => onOpenLegal && onOpenLegal('privacy')} className="footer-link-btn" style={{ background: 'none', border: 'none', color: '#14b8a6', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}>Privacy Policy</button>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                    <button onClick={() => onOpenLegal && onOpenLegal('terms')} className="footer-link-btn" style={{ background: 'none', border: 'none', color: '#14b8a6', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}>Terms of Use</button>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                    <button onClick={() => onOpenLegal && onOpenLegal('guidelines')} className="footer-link-btn" style={{ background: 'none', border: 'none', color: '#14b8a6', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}>Community Guidelines</button>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                    <button onClick={() => onOpenLegal && onOpenLegal('copyright')} className="footer-link-btn" style={{ background: 'none', border: 'none', color: '#14b8a6', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}>Copyright Policy</button>
                </div>
            </footer>

            {/* --- APPLE BUILD MODALS --- */}
            {activeAppleTab && (
                <div className="apple-modal-overlay" onClick={() => setActiveAppleTab(null)}>
                    <div className="apple-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setActiveAppleTab(null)}>&times;</button>
                        
                        {activeAppleTab === 'macos' ? (
                            <div>
                                <h3><i className="fa-brands fa-apple"></i> macOS SwiftUI Native App Setup</h3>
                                <p>The macOS app is structured as a native SwiftUI client that reuses UI layouts and logic modules directly from the iOS client via Xcode target links.</p>
                                
                                <div className="modal-steps-list">
                                    <div className="modal-step">
                                        <span className="step-num">1</span>
                                        <div className="step-txt">
                                            <strong>Prerequisites:</strong> Ensure you are on a macOS machine with Xcode 15+ installed.
                                        </div>
                                    </div>
                                    <div className="modal-step">
                                        <span className="step-num">2</span>
                                        <div className="step-txt">
                                            <strong>Generate Xcode Project:</strong> Open your terminal in the macOS source directory:
                                            <pre className="modal-code">cd psypyrus/macos&#10;python generate_xcodeproj.py</pre>
                                        </div>
                                    </div>
                                    <div className="modal-step">
                                        <span className="step-num">3</span>
                                        <div className="step-txt">
                                            <strong>Open and Build:</strong> Double-click the generated <code>PsyPyrus.xcodeproj</code> to open in Xcode. Select <strong>My Mac</strong> target and press <code>Cmd + R</code> to compile and run.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3><i className="fa-solid fa-mobile-screen-button"></i> iOS SwiftUI Mobile App Setup</h3>
                                <p>The iOS app is designed for iPhones and iPads, utilizing modern Apple UI standards, CoreData schemas, and Secure Enclave local biometric key generation.</p>
                                
                                <div className="modal-steps-list">
                                    <div className="modal-step">
                                        <span className="step-num">1</span>
                                        <div className="step-txt">
                                            <strong>Prerequisites:</strong> Requires Xcode 15+ and an active Apple Developer profile for physical device deploys.
                                        </div>
                                    </div>
                                    <div className="modal-step">
                                        <span className="step-num">2</span>
                                        <div className="step-txt">
                                            <strong>Assemble Project Structures:</strong> Generate your localized Apple build layout:
                                            <pre className="modal-code">cd psypyrus/ios&#10;python generate_xcodeproj.py</pre>
                                        </div>
                                    </div>
                                    <div className="modal-step">
                                        <span className="step-num">3</span>
                                        <div className="step-txt">
                                            <strong>Compile and Debug:</strong> Launch <code>PsyPyrus.xcodeproj</code> in Xcode, choose an iOS Simulator or connected Apple test device, and run using <code>Cmd + R</code>.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <button className="modal-ok-btn" onClick={() => setActiveAppleTab(null)}>Close Guide</button>
                    </div>
                </div>
            )}
        </div>
    );
}
