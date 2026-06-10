import React, { useState, useEffect } from 'react';
import { Database } from '../../services/db';
import { useToast } from '../ToastProvider';

const CLINICIAN_APPS = [
    {
        id: "hamd-rating-scale",
        title: "Hamilton Depression Rating Scale (HAM-D)",
        category: "Assessment Packs",
        description: "The classic 17-item clinician-administered rating scale for measuring depression severity in patients.",
        price: "Free",
        icon: "fa-clipboard-list",
        rating: 4.8,
        installs: "1.2k"
    },
    {
        id: "symptom-extractor-ai",
        title: "Symptom AI Extraction Copilot",
        category: "AI Modules",
        description: "Extracts psychiatric symptoms and severity indicators from session transcript draft logs automatically.",
        price: "$29.00/mo",
        icon: "fa-wand-magic-sparkles",
        rating: 4.9,
        installs: "840"
    },
    {
        id: "cbt-anxiety-protocol",
        title: "CBT Pacing Course Protocol",
        category: "Clinical Protocols",
        description: "Standardized 6-week Cognitive Behavioral Therapy pacing guidelines for moderate to severe Generalized Anxiety Disorder (GAD).",
        price: "Free",
        icon: "fa-book-open",
        rating: 4.6,
        installs: "2.3k"
    },
    {
        id: "pediatric-mse-synthesizer",
        title: "Pediatric MSE Synthesizer",
        category: "AI Modules",
        description: "A fine-tuned LLM assistant specializing in pediatric Mental Status Exams based on play-observation records.",
        price: "$19.99/mo",
        icon: "fa-child-reaching",
        rating: 4.7,
        installs: "450"
    },
    {
        id: "zoom-telehealth-e2ee",
        title: "Zoom Health Telehealth Integration",
        category: "Integrations",
        description: "Secure, end-to-end encrypted video sessions with HIPAA-compliant virtual background capability.",
        price: "$9.99/mo",
        icon: "fa-video",
        rating: 4.5,
        installs: "4.1k"
    },
    {
        id: "smart-calendar-billing",
        title: "Smart Calendar Auto-Billing",
        category: "Integrations",
        description: "Integrates with CMS-1500 templates to automatically generate and file codes upon telehealth completion.",
        price: "$15.00/mo",
        icon: "fa-file-invoice-dollar",
        rating: 4.4,
        installs: "1.9k"
    }
];

const PATIENT_APPS = [
    {
        id: "sleep-pacing-audio",
        title: "Sleep Pacing Audio Suite",
        category: "Audio Therapy",
        description: "Guided breathing and pacing exercises designed to decrease sleep latency and somatic muscle scanning tension.",
        price: "Free",
        icon: "fa-music",
        rating: 4.9,
        installs: "5.4k"
    },
    {
        id: "cbt-habit-restructuring",
        title: "CBT Habit Restructuring Planner",
        category: "Wellness Guides",
        description: "Daily interactive logs to record automatic negative thoughts and practice cognitive reframing.",
        price: "Free",
        icon: "fa-calendar-check",
        rating: 4.7,
        installs: "3.2k"
    },
    {
        id: "oura-bio-sync",
        title: "Oura Ring Bio-Sync Connector",
        category: "Wearable Sync",
        description: "Synchronizes sleep architecture, resting heart rate, and heart rate variability (HRV) into the wellness dashboard.",
        price: "$4.99/mo",
        icon: "fa-circle-notch",
        rating: 4.8,
        installs: "1.1k"
    },
    {
        id: "anxiety-grounding-exercises",
        title: "Anxiety Grounding Exercises",
        category: "Audio Therapy",
        description: "Somatic mindfulness tracks to resolve epigastric tightness and chest discomfort during acute stress.",
        price: "Free",
        icon: "fa-wind",
        rating: 4.9,
        installs: "8.1k"
    },
    {
        id: "mindfulness-habit-tracker",
        title: "Mindfulness Habit Tracker",
        category: "Wellness Guides",
        description: "Custom checklist for building long-term meditation habits and logging gratitude scores.",
        price: "Free",
        icon: "fa-check-double",
        rating: 4.6,
        installs: "2.7k"
    },
    {
        id: "fitbit-vitality-sync",
        title: "Fitbit Vitality Connector",
        category: "Wearable Sync",
        description: "Real-time sync of active minutes, steps, and heart rate logs to support behavioral activation homework.",
        price: "Free",
        icon: "fa-heart-pulse",
        rating: 4.4,
        installs: "4.5k"
    }
];

export function Marketplace({ activeRole }) {
    const [installedIds, setInstalledIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [loadingStates, setLoadingStates] = useState({}); // appId -> 'installing' or 'uninstalling'

    const { showToast } = useToast();

    const isProfessional = activeRole === 'Professional';
    const catalog = isProfessional ? CLINICIAN_APPS : PATIENT_APPS;

    // Categories available
    const categories = ['All', ...new Set(catalog.map(app => app.category))];

    const refreshInstalled = () => {
        setInstalledIds(Database.getInstalledApps());
    };

    useEffect(() => {
        refreshInstalled();
        window.addEventListener('psypyrus_db_change', refreshInstalled);
        return () => window.removeEventListener('psypyrus_db_change', refreshInstalled);
    }, []);

    const handleInstall = (app) => {
        setLoadingStates(prev => ({ ...prev, [app.id]: 'installing' }));
        
        setTimeout(() => {
            Database.installApp(app.id, app.title, activeRole);
            setLoadingStates(prev => {
                const copy = { ...prev };
                delete copy[app.id];
                return copy;
            });
            showToast(`Extension "${app.title}" installed successfully in active sandbox.`, "success");
        }, 1200);
    };

    const handleUninstall = (app) => {
        setLoadingStates(prev => ({ ...prev, [app.id]: 'uninstalling' }));
        
        setTimeout(() => {
            Database.uninstallApp(app.id, app.title, activeRole);
            setLoadingStates(prev => {
                const copy = { ...prev };
                delete copy[app.id];
                return copy;
            });
            showToast(`Extension "${app.title}" uninstalled from sandbox.`, "info");
        }, 800);
    };

    const filteredApps = catalog.filter(app => {
        const matchesSearch = app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              app.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || app.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="screen-container active" id="screen-marketplace">
            <style>{`
                .marketplace-card {
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease, box-shadow 0.3s ease;
                }
                .marketplace-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--color-primary);
                    box-shadow: 0 4px 20px var(--color-primary-glow);
                }
                .stars-rating-container {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    color: var(--color-warning);
                    font-size: 11px;
                }
            `}</style>

            <div className="section-header-block">
                <i className="fa-solid fa-shop"></i>
                <h2>{isProfessional ? "Clinical Extensions & Plugins Marketplace" : "Patient Wellness & Integrations Store"}</h2>
            </div>

            <div className="dashboard-hero-banner" style={{ background: isProfessional ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(0, 242, 254, 0.08))' : 'linear-gradient(135deg, rgba(0, 242, 254, 0.08), rgba(245, 166, 35, 0.04))' }}>
                <span className="marketplace-hero-badge">v2.0 Verified</span>
                <div className="hero-subtitle">{isProfessional ? "PRACTITIONER SUITE" : "MY WELLNESS LAB"}</div>
                <h2 className="hero-title">{isProfessional ? "Extend Your Clinical Workflow" : "Power Up Your Recovery Journey"}</h2>
                <p className="hero-description">
                    {isProfessional 
                        ? "Install clinical assessment packs, specialized AI copilot engines, or telemetry integrations directly into your HIPAA-compliant practitioner desktop workspace." 
                        : "Discover audio relaxation packs, CBT mood logs, and wearable sync integrations to complete your homework plans and track wellness metrics."}
                </p>
                <div style={{ marginTop: '14px', fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span><i className="fa-solid fa-cloud-arrow-down" style={{ color: 'var(--color-primary)', marginRight: '4px' }}></i> <strong>{installedIds.length}</strong> Active Plugins Installed</span>
                    <span>•</span>
                    <span><i className="fa-solid fa-shield-halved" style={{ color: 'var(--color-success)', marginRight: '4px' }}></i> Sandbox Encrypted Client Environment</span>
                </div>
            </div>

            {/* Search and Category Filters */}
            <div className="workspace-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
                <div className="marketplace-search-row">
                    <div className="marketplace-search-input-wrapper" style={{ width: '100%' }}>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input 
                            type="text" 
                            className="marketplace-search-input" 
                            placeholder={isProfessional ? "Search clinical plugins, assessments, AI toolsets..." : "Search wellness guides, audio courses, wearables..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', border: 'none', background: 'transparent', color: '#fff' }}
                        />
                    </div>
                </div>

                <div className="chips-horizontal-scroll" style={{ paddingBottom: '0', marginTop: '12px' }}>
                    {categories.map((cat) => (
                        <button 
                            key={cat}
                            className={`patient-filter-chip ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* HIPAA Compliance Advisory */}
            <div className="hipaa-alert-box warning" style={{ marginBottom: '24px' }}>
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--color-warning)' }}></i>
                <div className="alert-message-content">
                    <strong>HIPAA Security Sandboxing:</strong> All marketplace items are containerized in local cryptographic sandboxes. Client notes, PHI, or telemetry variables remain strictly local to your browser database.
                </div>
            </div>

            {/* Grid Catalog */}
            {filteredApps.length === 0 ? (
                <div className="workspace-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
                    <i className="fa-solid fa-store-slash" style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--color-text-muted)' }}></i>
                    <h4>No items found matching your filters.</h4>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting your search terms or category selections.</p>
                </div>
            ) : (
                <div className="marketplace-grid">
                    {filteredApps.map((app) => {
                        const isInstalled = installedIds.includes(app.id);
                        const state = loadingStates[app.id]; // 'installing' or 'uninstalling' or undefined
                        const isFree = app.price.toLowerCase() === 'free';

                        return (
                            <div key={app.id} className={`marketplace-card ${isInstalled ? 'installed' : ''}`}>
                                <div className="marketplace-card-header">
                                    <div className="marketplace-card-icon-wrapper">
                                        <i className={`fa-solid ${app.icon}`}></i>
                                    </div>
                                    <span className="marketplace-tag">{app.category}</span>
                                </div>

                                <div>
                                    <h3 className="marketplace-card-title" style={{ color: 'var(--text-light)', fontSize: '14px', margin: '12px 0 6px 0' }}>{app.title}</h3>
                                    <p className="marketplace-card-desc" style={{ fontSize: '12px', color: 'var(--text-normal)', lineHeight: 1.4, margin: '0 0 16px 0' }}>{app.description}</p>
                                </div>

                                <div className="marketplace-card-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className={`marketplace-price-tag ${isFree ? 'free' : ''}`} style={{ fontSize: '12px', fontWeight: 'bold', color: isFree ? 'var(--color-success)' : 'var(--text-light)' }}>{app.price}</span>
                                        <div className="stars-rating-container" style={{ marginTop: '4px' }}>
                                            <i className="fa-solid fa-star"></i>
                                            <span>{app.rating} ({app.installs})</span>
                                        </div>
                                    </div>

                                    <div className="marketplace-card-actions">
                                        {isInstalled ? (
                                            <button 
                                                className="action-button-btn secondary mini-action-btn"
                                                style={{ border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
                                                onClick={() => handleUninstall(app)}
                                                disabled={!!state}
                                            >
                                                {state === 'uninstalling' ? (
                                                    <>
                                                        <span className="loader-dual-ring" style={{ width: '10px', height: '10px', borderWidth: '1.5px', marginRight: '4px' }}></span>
                                                        Removing...
                                                    </>
                                                ) : (
                                                    "Uninstall"
                                                )}
                                            </button>
                                        ) : (
                                            <button 
                                                className="action-button-btn mini-action-btn"
                                                style={{ background: isFree ? 'var(--color-success)' : 'var(--color-primary)' }}
                                                onClick={() => handleInstall(app)}
                                                disabled={!!state}
                                            >
                                                {state === 'installing' ? (
                                                    <>
                                                        <span className="loader-dual-ring" style={{ width: '10px', height: '10px', borderWidth: '1.5px', marginRight: '4px' }}></span>
                                                        Installing...
                                                    </>
                                                ) : (
                                                    "Get"
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
