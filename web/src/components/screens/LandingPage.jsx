import { useState } from 'react';

export function LandingPage({ onEnterPortal }) {
    const [activeAppleTab, setActiveAppleTab] = useState(null); // 'ios' or 'macos' or null
    const [demoMode, setDemoMode] = useState('diagnostics'); // 'diagnostics' or 'soap'
    
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
            {/* --- HEADER --- */}
            <header className="landing-header">
                <div className="landing-brand">
                    <i className="fa-solid fa-face-smile-beam landing-logo-icon"></i>
                    <div>
                        <span className="brand-title">PsyPyrus <span className="brand-accent">AI OS</span></span>
                        <span className="brand-subtitle">Mental Health Operating System</span>
                    </div>
                </div>
                <nav className="landing-nav">
                    <a href="#features-section" className="nav-anchor">Features</a>
                    <a href="#teaser-section" className="nav-anchor">Interactive Demo</a>
                    <a href="#download-section" className="nav-anchor">Download Hub</a>
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
                        <i className="fa-solid fa-shield-halved"></i> HIPAA & GDPR Cryptographic Security Shield Active
                    </div>
                    <h1 className="hero-main-title">
                        The Next-Generation <br />
                        <span className="gradient-text">Mental Health Operating System</span>
                    </h1>
                    <p className="hero-desc-para">
                        PsyPyrus AI OS is a premium, secure mono-repo suite designed for clinical decision support, EHR tracking, and patient wellness. Empowering practitioners with automated AI SOAP synthesis and local diagnostic checkers while providing patients a soothing wellness portal.
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
                            <span className="mockup-val active"><i className="fa-solid fa-lock"></i> AES-GCM-256</span>
                            <span className="mockup-sub">Compliance: HIPAA Certified</span>
                        </div>
                        <div className="mockup-item">
                            <span className="mockup-lbl">Local Diagnostics Engine</span>
                            <span className="mockup-val" style={{ color: 'var(--color-secondary)' }}><i className="fa-solid fa-calculator"></i> DSM-5-TR Active</span>
                            <span className="mockup-sub">MDD / GAD-7 Checklists</span>
                        </div>
                        <div className="mockup-item">
                            <span className="mockup-lbl">AI Clinical Copilot</span>
                            <span className="mockup-val" style={{ color: 'var(--color-accent)' }}><i className="fa-solid fa-wand-magic-sparkles"></i> Gemini 3.5 Flash</span>
                            <span className="mockup-sub">Prose & SOAP Synthesis</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section className="landing-features" id="features-section">
                <h2 className="section-title">Engineered for Excellence across 5 Core Pillars</h2>
                <p className="section-subtitle">
                    A unified code framework that spans Web, Desktop (Windows, macOS), and Mobile (Android, iOS).
                </p>

                <div className="features-container-grid">
                    <div className="feature-item-card">
                        <div className="feature-icon-wrapper color-blue">
                            <i className="fa-solid fa-users-viewfinder"></i>
                        </div>
                        <h3>Dual-Persona Workspace</h3>
                        <p>Toggle seamlessly between the Professional Clinician Suite (EHR record keeping, calendar, telehealth) and the Patient Wellness Hub (gratitude journaling, breathing exercises, tasks).</p>
                    </div>

                    <div className="feature-item-card">
                        <div className="feature-icon-wrapper color-green">
                            <i className="fa-solid fa-user-shield"></i>
                        </div>
                        <h3>Cryptographic HIPAA Shield</h3>
                        <p>Fully compliant local database vaults backed by AES-GCM-256 envelope encryption. Features biometric scanning lock mockups and continuous action security logs.</p>
                    </div>

                    <div className="feature-item-card">
                        <div className="feature-icon-wrapper color-gold">
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                        </div>
                        <h3>AI SOAP Notes Copilot</h3>
                        <p>Leverage Google Gemini 3.5 Flash to synthesize transcripts and therapy dictations into medical-grade SOAP documentation, SMART treatment goals, and behavioral homework checksheets.</p>
                    </div>

                    <div className="feature-item-card">
                        <div className="feature-icon-wrapper color-teal">
                            <i className="fa-solid fa-laptop-medical"></i>
                        </div>
                        <h3>DSM-5-TR Diagnostics Engine</h3>
                        <p>Local offline diagnostic rulesets matching official criteria for Major Depression (MDD) and somatic Generalized Anxiety Disorder (GAD-7) to speed clinical intake evaluations.</p>
                    </div>

                    <div className="feature-item-card">
                        <div className="feature-icon-wrapper color-purple">
                            <i className="fa-solid fa-magnifying-glass-chart"></i>
                        </div>
                        <h3>ClinicalTrials.gov Finder</h3>
                        <p>Automatically queries and parses active, recruiting clinical trials using official REST API v2 endpoints based on the patient's diagnostic outcomes and indicators.</p>
                    </div>
                </div>
            </section>

            {/* --- INTERACTIVE PREVIEW SANDBOX (TEASER) --- */}
            <section className="landing-teaser" id="teaser-section">
                <div className="teaser-box-wrapper">
                    <div className="teaser-menu-bar">
                        <button 
                            className={`teaser-menu-btn ${demoMode === 'diagnostics' ? 'active' : ''}`}
                            onClick={() => setDemoMode('diagnostics')}
                        >
                            <i className="fa-solid fa-stethoscope"></i> Local Diagnostics Sandbox
                        </button>
                        <button 
                            className={`teaser-menu-btn ${demoMode === 'soap' ? 'active' : ''}`}
                            onClick={() => setDemoMode('soap')}
                        >
                            <i className="fa-solid fa-wand-magic-sparkles"></i> AI SOAP Notes Previewer
                        </button>
                    </div>

                    <div className="teaser-content-area">
                        {demoMode === 'diagnostics' ? (
                            <div className="teaser-diagnostics-layout">
                                <div className="teaser-form-column">
                                    <h4>DSM-5-TR Depressive Criteria Checklist</h4>
                                    <p className="field-hint">Select patient indicators to test the rule-based validation engine in real-time:</p>
                                    
                                    <div className="teaser-checklist-grid">
                                        {Object.keys(mddSymptoms).map((key) => (
                                            <label key={key} className="teaser-checkbox-row">
                                                <input 
                                                    type="checkbox" 
                                                    checked={mddSymptoms[key]} 
                                                    onChange={() => toggleSymptom(key)}
                                                    className="teaser-checkbox"
                                                />
                                                <span className="teaser-checkbox-label">
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                </span>
                                            </label>
                                        ))}
                                    </div>

                                    <div className="teaser-sliders-row" style={{ marginTop: '16px' }}>
                                        <div className="teaser-slider-group">
                                            <div className="slider-label-block">
                                                <span>Symptom Duration:</span>
                                                <strong style={{ color: 'var(--color-primary)' }}>{durationWeeks} Weeks</strong>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="12" 
                                                value={durationWeeks} 
                                                onChange={(e) => setDurationWeeks(parseInt(e.target.value))}
                                                className="teaser-range-slider"
                                            />
                                        </div>
                                    </div>

                                    <label className="teaser-checkbox-row" style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={exclusionMet} 
                                            onChange={(e) => setExclusionMet(e.target.checked)}
                                            className="teaser-checkbox"
                                        />
                                        <span className="teaser-checkbox-label" style={{ color: 'var(--color-warning)' }}>
                                            Exclusion criteria: Symptoms are substance-induced or due to other clinical causes.
                                        </span>
                                    </label>
                                </div>

                                <div className="teaser-outcome-column">
                                    <div className="teaser-gauge-card">
                                        <span className="gauge-lbl">ENGINE CODE EVALUATOR</span>
                                        <div className="gauge-title" style={{ color: diagResult.color }}>
                                            {diagResult.status}
                                        </div>
                                        <p className="gauge-message">{diagResult.message}</p>
                                        
                                        <div className="code-block-preview">
                                            <pre>
{`// Local evaluation engine
const checkMDD = (symptoms, weeks, excluded) => {
  if (excluded) return "EXCLUDED";
  const count = Object.values(symptoms).filter(Boolean).length;
  const core = symptoms.depressedMood || symptoms.anhedonia;
  return (count >= 5 && core && weeks >= 2) ? "MDD_MET" : "SUB_LIMIT";
};
console.log(checkMDD(${JSON.stringify(mddSymptoms).substring(0,25)}..., ${durationWeeks}, ${exclusionMet}));`}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="teaser-soap-layout">
                                <div className="teaser-input-card">
                                    <h4>Raw Session Dictation / Transcript Draft:</h4>
                                    <textarea 
                                        className="teaser-textarea"
                                        value={soapInput} 
                                        onChange={(e) => setSoapInput(e.target.value)}
                                        placeholder="Type therapy dictation draft..."
                                    />
                                    <button 
                                        className="teaser-compile-btn"
                                        onClick={handleCompileSoap}
                                        disabled={isCompilingSoap}
                                    >
                                        {isCompilingSoap ? (
                                            <span><i className="fa-solid fa-spinner fa-spin"></i> Processing Gemini Copilot...</span>
                                        ) : (
                                            <span>Compile SOAP Document <i className="fa-solid fa-wand-magic-sparkles"></i></span>
                                        )}
                                    </button>
                                </div>
                                <div className="teaser-output-card">
                                    <h4>AI Synthesized SOAP Note Output:</h4>
                                    {soapOutput ? (
                                        <pre className="teaser-pre">{soapOutput}</pre>
                                    ) : (
                                        <div className="teaser-output-placeholder">
                                            <i className="fa-solid fa-wand-magic-sparkles placeholder-magic-icon"></i>
                                            <p>Input raw text and click the compile button to synthesize your HIPAA-compliant EHR document representation.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* --- DOWNLOAD HUB --- */}
            <section className="landing-downloads" id="download-section">
                <h2 className="section-title">Cross-Platform Deployments Hub</h2>
                <p className="section-subtitle">
                    Select your preferred platform build and deploy native installers compiled directly from the Mono-Repo source code.
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

            {/* --- COMPLIANCE FOOTER --- */}
            <footer className="landing-footer">
                <div className="footer-compliance-row">
                    <span className="compliance-shield-tag"><i className="fa-solid fa-shield-halved"></i> HIPAA Compliant Architecture</span>
                    <span className="compliance-shield-tag"><i className="fa-solid fa-key"></i> AES-GCM-256 Encryption Vaults</span>
                    <span className="compliance-shield-tag"><i className="fa-solid fa-calculator"></i> DSM-5-TR Compliant Logic</span>
                </div>
                
                <p className="clinical-disclaimer">
                    <strong>Clinical Disclaimer:</strong> PsyPyrus AI OS serves as an administrative and clinical decision support system (CDSS). It does not provide medical services. All AI predictions, SOAP syntheses, and diagnostic indicators must be approved, reviewed, and finalized by a licensed professional.
                </p>
                
                <div className="footer-bottom-credits">
                    <span>© {new Date().getFullYear()} PsyPyrus Suite. All rights reserved. Open-source under MIT License.</span>
                    <span>Mono-Repo Codebase version 2.0.0</span>
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
