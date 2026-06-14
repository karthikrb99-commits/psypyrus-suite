import { useState, useEffect } from 'react';
import { Database } from '../../services/db';
import { DiagnosticEngine } from '../../services/diagnostics';
import { ClinicalTrialsService } from '../../services/trials';
import { DsmDatabase } from '../../services/dsmDatabase';
import { GeminiService } from '../../services/ai';
import { IcdService } from '../../services/icdService';
import { useToast } from '../ToastProvider';
import { GamificationService } from '../../services/gamification';
import { MedicationService } from '../../services/medicationService';

const ALL_SYMPTOMS_GROUPED = {
    "Mood Indicators": [
        ["depressed_mood", "Depressed mood / persistent sadness"],
        ["anhedonia", "Loss of interest or pleasure (Anhedonia)"],
        ["elevated_mood", "Elevated, expansive, or irritable mood"],
        ["affective_instability", "Marked reactivity of mood / emotional reactivity"],
        ["chronic_emptiness", "Chronic feelings of emptiness"]
    ],
    "Anxiety & Phobias": [
        ["excessive_anxiety", "Excessive anxiety/worry about various events"],
        ["social_fear", "Fear of scrutiny/negative evaluation in social settings"],
        ["specific_fear", "Marked fear of specific objects or situations"],
        ["panic_attacks", "Recurrent unexpected panic attacks"],
        ["fear_of_dying", "Fear of dying or losing control during surges of fear"],
        ["social_avoidance", "Active avoidance of social situations"],
        ["phobic_avoidance", "Active avoidance of phobic stimuli"],
        ["avoidance_behavior", "Behavior changes to avoid panic triggers"]
    ],
    "Trauma & Stressors": [
        ["trauma_exposure", "Exposure to actual/threatened death or violence"],
        ["stressor_onset", "Symptoms developing after an identifiable stressor"],
        ["intrusive_memories", "Distressing memories, flashbacks, or nightmares"],
        ["avoidance_stimuli", "Avoidance of trauma-related cues or thoughts"],
        ["negative_cognitions", "Negative alterations in cognition/mood after trauma"],
        ["emotional_numbing", "Inability to feel positive emotions / numbing"],
        ["outsized_distress", "Stressor distress out of proportion to its severity"]
    ],
    "Cognitive & Executive": [
        ["inattention", "Careless errors or drifting focus in tasks"],
        ["losing_focus", "Inability to sustain focus during work/play"],
        ["avoiding_effort", "Reluctance to engage in sustained mental effort"],
        ["forgetfulness", "Forgetfulness in daily tasks / losing tools"],
        ["racing_thoughts", "Subjective racing thoughts or flight of ideas"],
        ["grandiosity", "Inflated self-esteem or delusional grandiosity"],
        ["intrusive_thoughts", "Intrusive unwanted thoughts or mental images"],
        ["suppress_thoughts", "Compulsive attempts to ignore/neutralize thoughts"]
    ],
    "Somatic & Physiological": [
        ["insomnia", "Insomnia or hypersomnia (sleep disturbance)"],
        ["fatigue", "Fatigue, loss of energy, or being easily fatigued"],
        ["appetite_change", "Weight or appetite changes when not dieting"],
        ["muscle_tension", "Muscle tension or somatic scanning aches"],
        ["palpitations", "Heart palpitations or accelerated heart rate"],
        ["shortness_of_breath", "Shortness of breath or choking sensations"],
        ["dizziness", "Nausea, abdominal distress, or light-headedness"],
        ["restricted_intake", "Calorie restriction leading to low body weight"],
        ["fear_weight_gain", "Intense fear of gaining weight or fat"],
        ["distorted_body_image", "Distorted body shape perception / weight denial"]
    ],
    "Behavioral & Relational": [
        ["psychomotor", "Psychomotor agitation or retardation"],
        ["fidgeting", "Fidgeting, hand-tapping, or seat squirming"],
        ["impulsivity", "Inability to wait turn, blurting out answers"],
        ["hyperactivity", "Excessive talking / acting as if driven by motor"],
        ["reckless_spending", "Self-damaging reckless acts (spending, sex)"],
        ["compulsive_behaviors", "Repetitive rituals (hand washing, checking)"],
        ["abandonment_fear", "Frantic efforts to avoid real/imagined abandonment"],
        ["relationship_instability", "Pattern of unstable intense relationships (splitting)"],
        ["identity_disturbance", "Markedly unstable self-image or sense of self"],
        ["suicidal_ideation", "Recurrent thoughts of death or suicidal ideation"],
        ["suicidal_gestures", "Suicidal behaviors, gestures, or self-harm (cutting)"],
        ["uncontrolled_anger", "Inappropriate intense anger or frequent fights"]
    ]
};

const EXCLUSIONS_OPTIONS = [
    ["No physiological substance attribution", "Not attributable to substance physiological effects"],
    ["No medical condition attribution", "Not attributable to other medical conditions"],
    ["No manic/hypomanic history", "No history of manic/hypomanic episodes"]
];

export function DiagnosticsSuite({ patients, activePatientId }) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState(1); // Default to Rule-Based Checker for Wow factor

    // --- TAB 0: DSM-5 LOOKUP STATE ---
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All Disorders");
    const [expandedDisorderName, setExpandedDisorderName] = useState(null);
    const [criteriaChecks, setCriteriaChecks] = useState({});

    // --- TAB 0: ICD-11 SEARCH STATE ---
    const [icdQuery, setIcdQuery] = useState("");
    const [icdResults, setIcdResults] = useState([]);
    const [isIcdLoading, setIsIcdLoading] = useState(false);

    // --- TAB 1: ADVANCED RULE-BASED CHECKER STATE ---
    const [checkedSymptoms, setCheckedSymptoms] = useState([]);
    const [durationWeeks, setDurationWeeks] = useState(12);
    const [exclusionsChecked, setExclusionsChecked] = useState([
        "No physiological substance attribution",
        "No medical condition attribution"
    ]);
    const [diagReport, setDiagReport] = useState({ diagnoses: [], differentials: [], comorbidities: [], riskAssessment: { level: "None", indicators: [] } });

    // Clinical trials search
    const [trials, setTrials] = useState([]);
    const [loadingTrials, setLoadingTrials] = useState(false);
    const [trialsQueried, setTrialsQueried] = useState(false);

    // --- TAB 2: AI CLINICAL DIFFERENTIAL STATE ---
    const [symptomsInput, setSymptomsInput] = useState(
        "Client presents with chronic sadness, loss of pleasure in key occupational activities, sleep onset disturbance, concentration deficits, and mild feelings of worthlessness."
    );
    const [mseFindingsText, setMseFindingsText] = useState(
        "Client shows restricted affect range, psychomotor slowing, and poor eye contact."
    );
    const [aiResultText, setAiResultText] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);

    // --- TAB 3: PHARMACOTHERAPY & MEDICATION ADVISOR STATE ---
    const [draftPrescription, setDraftPrescription] = useState([]);
    const [selectedDrugDetails, setSelectedDrugDetails] = useState(null);
    const [rxJustificationNote, setRxJustificationNote] = useState("");
    const [isRxJustificationLoading, setIsRxJustificationLoading] = useState(false);
    const [isSyncingToAbdm, setIsSyncingToAbdm] = useState(false);
    const [abdmReceipt, setAbdmReceipt] = useState(null);

    // Security/Safety: Clear prescription draft when switching patients
    useEffect(() => {
        setDraftPrescription([]);
        setSelectedDrugDetails(null);
        setRxJustificationNote("");
        setAbdmReceipt(null);
    }, [activePatientId]);

    const activePatient = patients.find(p => p.id === activePatientId) || patients[0];
    const specialtyCondition = activePatient ? activePatient.specialty : 'None';

    // Update diagnosis report in real-time when symptoms change
    useEffect(() => {
        const report = DiagnosticEngine.evaluateClinicalProfile({
            symptoms: checkedSymptoms,
            durationWeeks,
            exclusions: exclusionsChecked,
            mseFindings: activePatient ? [activePatient.specialty] : [],
            assessmentScores: { phq9: 15, gad7: 11 } // Default baseline scores
        });
        setDiagReport(report);
    }, [checkedSymptoms, durationWeeks, exclusionsChecked, activePatient]);

    const handleIcdSearch = async () => {
        if (!icdQuery.trim()) return;
        setIsIcdLoading(true);
        try {
            const results = await IcdService.searchIcd11(icdQuery);
            setIcdResults(results);
            showToast(`WHO Registry search found ${results.length} matches.`, "success");
        } catch (e) {
            console.error("ICD-11 search error:", e);
            setIcdResults([]);
            showToast("ICD-11 query offline fallback triggered.", "warning");
        } finally {
            setIsIcdLoading(false);
        }
    };

    const handleToggleSymptom = (symId) => {
        setCheckedSymptoms(prev => 
            prev.includes(symId) ? prev.filter(s => s !== symId) : [...prev, symId]
        );
    };

    const handleToggleExclusion = (exId) => {
        setExclusionsChecked(prev => 
            prev.includes(exId) ? prev.filter(e => e !== exId) : [...prev, exId]
        );
    };

    const handleQueryTrials = async () => {
        if (!specialtyCondition || specialtyCondition === 'None') {
            showToast("No specialty clinical target found for patient.", "warning");
            return;
        }
        
        let condition = specialtyCondition;
        if (specialtyCondition.toLowerCase().includes("depres")) condition = "Major Depressive Disorder";
        if (specialtyCondition.toLowerCase().includes("anxiety")) condition = "Generalized Anxiety Disorder";
        if (specialtyCondition.toLowerCase().includes("adhd")) condition = "ADHD";
        if (specialtyCondition.toLowerCase().includes("ptsd")) condition = "PTSD";

        setLoadingTrials(true);
        setTrials([]);
        setTrialsQueried(true);

        try {
            const results = await ClinicalTrialsService.fetchActiveTrials(condition);
            setTrials(results);
            Database.logAudit("Query Clinical Trials", `Searched ClinicalTrials.gov for condition: ${condition}`);
            
            // Gamification Hook
            GamificationService.awardXp('Professional', 15, 'Queried Clinical Trials Database');

            showToast(`ClinicalTrials.gov queried successfully.`, "success");
        } catch {
            showToast(`Trials API timeout: fallback activated.`, "warning");
        } finally {
            setLoadingTrials(false);
        }
    };

    // TAB 0 Checklist
    const handleCriteriaToggle = (disorderName, idx) => {
        setCriteriaChecks(prev => {
            const current = prev[disorderName] || {};
            return {
                ...prev,
                [disorderName]: {
                    ...current,
                    [idx]: !current[idx]
                }
            };
        });
    };

    const compileToAiCompanion = (disorder) => {
        const checkedList = [];
        const current = criteriaChecks[disorder.name] || {};
        disorder.criteriaList.forEach((crit, index) => {
            if (current[index]) {
                checkedList.push(crit);
            }
        });

        const symptomsString = `Symptom Profile matching [${disorder.name}] (${disorder.dsmCode}):\n` +
            `- Category: ${disorder.category}\n` +
            `- Checked Criteria: ${checkedList.length > 0 ? checkedList.join("; ") : "None checked in lookup."}\n` +
            `- Keywords: ${disorder.symptomsKeywords.slice(0, 5).join(", ")}`;
        
        setSymptomsInput(symptomsString);
        setMseFindingsText("Client demonstrates somatic indicators matching clinical criteria. Sad affect, restricted range.");
        setActiveTab(2);
        
        // Gamification Hook
        GamificationService.awardXp('Professional', 10, 'Compiled Criteria to AI Workspace');

        showToast("Criteria compiled to AI Workspace.", "success");
    };

    const runAiDifferentialDiagnosis = async () => {
        setIsAiLoading(true);
        setAiResultText("");
        Database.logAudit("AI Differential Diagnosis Request", `Symptom check: ${symptomsInput.substring(0, 40)}...`);

        const prompt = `You are a clinical decision support assistant. Analyze the following patient symptoms and mental status exam (MSE) findings to formulate probable differential diagnoses.

Patient Symptoms:
${symptomsInput}

Mental Status Exam (MSE) Findings:
${mseFindingsText}

Provide a structured differential diagnostics analysis conforming to DSM-5-TR guidelines:
1. Probable Differential Diagnostics (with estimated confidence, ICD-10/DSM-5 codes, and criteria checked)
2. Organic and Medical Rule-Outs
3. Recommended Clinical Interventions or next steps`;

        try {
            const result = await GeminiService.callGemini(prompt, "You are an expert clinical psychologist and psychiatrist specializing in DSM-5-TR differential diagnosis.");
            setAiResultText(result);
            Database.logAudit("AI Differential Diagnosis Complete", "Formulation compiled successfully.");
            
            // Gamification Hook
            GamificationService.trackAction('Professional', 'RUN_DIAGNOSTIC');
            GamificationService.awardXp('Professional', 25, 'Formulated AI Differential Diagnosis');

            showToast("AI Differential report successfully compiled.", "success");
        } catch (e) {
            setAiResultText(`Error generating differential: ${e.message}`);
            showToast("AI generation failed.", "error");
        } finally {
            setIsAiLoading(false);
        }
    };

    // --- TAB 3: PHARMACOTHERAPY HANDLERS ---
    const handleTogglePrescribe = (drug) => {
        setDraftPrescription(prev => {
            const exists = prev.some(d => d.id === drug.id);
            if (exists) {
                showToast(`${drug.name} removed from draft prescription.`, "info");
                return prev.filter(d => d.id !== drug.id);
            } else {
                showToast(`${drug.name} added to draft prescription.`, "success");
                return [...prev, drug];
            }
        });
    };

    const generateAiRxJustification = async () => {
        if (draftPrescription.length === 0) {
            showToast("Cannot generate justification for an empty prescription.", "warning");
            return;
        }

        setIsRxJustificationLoading(true);
        setRxJustificationNote("");

        const drugsStr = draftPrescription.map(d => `${d.name} (${d.usBrand}) - typical dose: ${d.dosage}`).join("\n");
        const patientCohort = activePatient.age < 18 ? "Pediatric" : activePatient.age > 65 ? "Geriatric" : "Adult";

        const prompt = `You are an expert clinical psychopharmacology advisor. Formulate a brief, professional, and explainable clinical justification note for prescribing the following medication(s) for a ${activePatient.age}-year-old patient (${patientCohort} cohort) presenting with symptoms of ${specialtyCondition}. Also include brief instructions for patient counseling (e.g. side effects to watch out for). Keep it extremely concise and professional (maximum 150 words).

Medications:
${drugsStr}

Provide only the clinical note itself. No intro or outro.`;

        try {
            const result = await GeminiService.callGemini(prompt, "You are a clinical decision support advisor specializing in psychopharmacology and patient medication safety.");
            setRxJustificationNote(result.trim());
            showToast("AI Clinical Justification generated successfully.", "success");
        } catch (e) {
            console.error("AI Rx Justification generation error:", e);
            setRxJustificationNote("Clinical rationale formulated based on standard psychiatric guidelines. Monitor for therapeutic response and watch for initial somatic indicators.");
            showToast("AI generation offline. Fallback justification set.", "warning");
        } finally {
            setIsRxJustificationLoading(false);
        }
    };

    const submitToAbdm = async () => {
        if (draftPrescription.length === 0) {
            showToast("Prescription draft is empty.", "warning");
            return;
        }

        setIsSyncingToAbdm(true);
        setAbdmReceipt(null);

        try {
            const receipt = await MedicationService.syncPrescriptionToAbdm({
                patientId: activePatient.id,
                patientName: activePatient.name,
                abhaNumber: activePatient.abhaNumber || "91-0000-0000-0000",
                medications: draftPrescription,
                clinicalJustification: rxJustificationNote
            });

            setAbdmReceipt(receipt);
            showToast("Prescription signed & synced to ABDM Health Locker!", "success");
        } catch (e) {
            console.error("ABDM Sync Error:", e);
            showToast(`ABDM Sync Failed: ${e.message}`, "error");
        } finally {
            setIsSyncingToAbdm(false);
        }
    };

    // Filtered disorders
    const filteredDisorders = DsmDatabase.disorders.filter(dis => {
        const matchesCategory = selectedCategory === "All Disorders" || dis.category === selectedCategory;
        const matchesSearch = dis.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dis.briefDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dis.symptomsKeywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="screen-container active" id="screen-diagnostics" style={{ padding: '0px' }}>
            
            <div className="section-header-block">
                <i className="fa-solid fa-calculator"></i>
                <h2>Clinical Decision Support Suite</h2>
            </div>

            {/* Premium Navigator */}
            <div className="persona-switcher-pill" style={{ marginBottom: '24px', maxWidth: '800px' }}>
                <button 
                    className={`persona-pill-btn ${activeTab === 0 ? 'active' : ''}`}
                    onClick={() => setActiveTab(0)}
                    style={{ flex: 1, justifyContent: 'center' }}
                >
                    <i className="fa-solid fa-book-open"></i> DSM Lookup
                </button>
                <button 
                    className={`persona-pill-btn ${activeTab === 1 ? 'active' : ''}`}
                    onClick={() => setActiveTab(1)}
                    style={{ flex: 1, justifyContent: 'center' }}
                >
                    <i className="fa-solid fa-calculator"></i> Rule-Based Checker
                </button>
                <button 
                    className={`persona-pill-btn ${activeTab === 2 ? 'active' : ''}`}
                    onClick={() => setActiveTab(2)}
                    style={{ flex: 1, justifyContent: 'center' }}
                >
                    <i className="fa-solid fa-wand-magic-sparkles"></i> AI Differential
                </button>
                <button 
                    className={`persona-pill-btn ${activeTab === 3 ? 'active' : ''}`}
                    onClick={() => setActiveTab(3)}
                    style={{ flex: 1, justifyContent: 'center' }}
                >
                    <i className="fa-solid fa-pills"></i> Medication Advisor
                </button>
            </div>

            {/* TAB 0: DSM-5 LOOKUP */}
            {activeTab === 0 && (
                <div style={{ display: 'grid', gap: '20px' }}>
                    <div className="workspace-card" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <h3 className="radio-group-title" style={{ color: 'var(--color-primary)', fontSize: '15px' }}>DSM-5-TR Classification Lookup</h3>
                        <input 
                            type="text"
                            className="input-text-field"
                            placeholder="Type symptoms or disorder name (e.g. sadness, GAD, BPD)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ marginBottom: '16px' }}
                        />

                        <div className="chips-horizontal-scroll" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {DsmDatabase.categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`patient-filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        {filteredDisorders.length === 0 ? (
                            <div className="workspace-card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                No DSM-5 disorders match search filters.
                            </div>
                        ) : (
                            filteredDisorders.map(disorder => {
                                const isExpanded = expandedDisorderName === disorder.name;
                                const checkedCount = Object.values(criteriaChecks[disorder.name] || {}).filter(Boolean).length;
                                const isCriteriaMet = checkedCount >= disorder.minCriteriaRequired;

                                return (
                                    <div 
                                        key={disorder.name} 
                                        className="workspace-card"
                                        style={{ border: isExpanded ? '1px solid var(--color-primary)' : '1px solid var(--color-border)' }}
                                    >
                                        <div 
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                            onClick={() => setExpandedDisorderName(isExpanded ? null : disorder.name)}
                                        >
                                            <div>
                                                <span className="badge-text-tag video" style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px' }}>
                                                    DSM {disorder.dsmCode} / ICD-10 {disorder.icd10Code} {disorder.snomedCode ? ` / SNOMED CT ${disorder.snomedCode}` : ''}
                                                </span>
                                                <h4 style={{ margin: '6px 0 2px 0', color: '#fff' }}>{disorder.name}</h4>
                                                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Category: {disorder.category}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span 
                                                    style={{ 
                                                        fontSize: '11px', 
                                                        padding: '4px 10px', 
                                                        borderRadius: '8px', 
                                                        fontWeight: '600',
                                                        background: isCriteriaMet ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.1)', 
                                                        color: isCriteriaMet ? 'var(--color-success)' : 'var(--color-warning)'
                                                    }}
                                                >
                                                    {checkedCount} / {disorder.minCriteriaRequired} met
                                                </span>
                                                <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: 'var(--color-text-muted)' }}></i>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                                                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                                                    {disorder.briefDescription}
                                                </p>

                                                <div className="radio-options-card-group" style={{ background: 'rgba(255,255,255,0.01)', marginBottom: '16px' }}>
                                                    <div className="radio-group-title" style={{ fontSize: '12px' }}>Diagnostic Criteria:</div>
                                                    <div style={{ display: 'grid', gap: '8px' }}>
                                                        {disorder.criteriaList.map((crit, idx) => {
                                                            const isChecked = !!(criteriaChecks[disorder.name]?.[idx]);
                                                            return (
                                                                <label key={idx} className="checkbox-option-row">
                                                                    <input 
                                                                        type="checkbox"
                                                                        className="checkbox-control"
                                                                        checked={isChecked}
                                                                        onChange={() => handleCriteriaToggle(disorder.name, idx)}
                                                                    />
                                                                    <span className="checkbox-label" style={{ color: isChecked ? '#fff' : 'var(--color-text-secondary)' }}>{crit}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                                        <strong style={{ fontSize: '11px', color: 'var(--color-primary)', textTransform: 'uppercase' }}>Differentials</strong>
                                                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '16px', fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                                                            {disorder.differentials.map(diff => <li key={diff}>{diff}</li>)}
                                                        </ul>
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                                        <strong style={{ fontSize: '11px', color: 'var(--color-primary)', textTransform: 'uppercase' }}>Comorbidities</strong>
                                                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '16px', fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                                                            {disorder.comorbidities.map(com => <li key={com}>{com}</li>)}
                                                        </ul>
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                                        <strong style={{ fontSize: '11px', color: 'var(--color-primary)', textTransform: 'uppercase' }}>Interventions</strong>
                                                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '16px', fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                                                            {disorder.interventions.map(int => <li key={int}>{int}</li>)}
                                                        </ul>
                                                    </div>
                                                </div>

                                                <button 
                                                    className="action-button-btn"
                                                    onClick={() => compileToAiCompanion(disorder)}
                                                    style={{ width: '100%' }}
                                                >
                                                    <i className="fa-solid fa-wand-magic-sparkles"></i> Compile to AI Companion
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* ICD-11 Registry Search */}
                    <div className="workspace-card" style={{ border: '1px solid var(--color-border)' }}>
                        <h3 className="radio-group-title" style={{ fontSize: '15px' }}><i className="fa-solid fa-search"></i> WHO ICD-11 Registry Search</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                            <input 
                                type="text"
                                className="input-text-field"
                                placeholder="Query official ICD-11 classification registry..."
                                value={icdQuery}
                                onChange={(e) => setIcdQuery(e.target.value)}
                            />
                            <button 
                                className="action-button-btn"
                                onClick={handleIcdSearch}
                                disabled={isIcdLoading}
                                style={{ minWidth: '120px' }}
                            >
                                {isIcdLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Query Registry"}
                            </button>
                        </div>

                        {icdResults.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {icdResults.map((res, idx) => (
                                        <div key={idx} className="metric-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px' }}>
                                            <div>
                                                <span className="badge-text-tag recruiting" style={{ fontSize: '9px', padding: '2px 6px' }}>{res.code}</span>
                                                <strong style={{ color: '#fff', marginLeft: '10px' }}>{res.title}</strong>
                                            </div>
                                            <button 
                                                className="rail-btn"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${res.code}: ${res.title}`);
                                                    showToast("Code copied to clipboard", "success");
                                                }}
                                                title="Copy Code"
                                            >
                                                <i className="fa-solid fa-copy"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 1: REAL-TIME RULE-BASED CHECKER */}
            {activeTab === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', alignItems: 'start' }}>
                    
                    {/* Left Panel: Symptoms check & sliders */}
                    <div style={{ display: 'grid', gap: '20px' }}>
                        
                        {/* Grouped Symptom Selector */}
                        <div className="workspace-card">
                            <h3 className="radio-group-title" style={{ fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Symptom Evaluation Checklist</span>
                                <button 
                                    className="auth-switch-btn" 
                                    onClick={() => setCheckedSymptoms([])}
                                    style={{ padding: '4px 10px', fontSize: '10px' }}
                                >
                                    Clear Checks
                                </button>
                            </h3>
                            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                                Select patient observations to run through the clinical diagnostic pipeline.
                            </p>

                            <div style={{ display: 'grid', gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                                {Object.entries(ALL_SYMPTOMS_GROUPED).map(([groupName, syms]) => (
                                    <div key={groupName} className="radio-options-card-group" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                                        <div className="radio-group-title" style={{ fontSize: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '8px' }}>
                                            {groupName}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                                            {syms.map(([symId, label]) => {
                                                const isChecked = checkedSymptoms.includes(symId);
                                                return (
                                                    <label key={symId} className="checkbox-option-row">
                                                        <input 
                                                            type="checkbox"
                                                            className="checkbox-control"
                                                            checked={isChecked}
                                                            onChange={() => handleToggleSymptom(symId)}
                                                        />
                                                        <span className="checkbox-label" style={{ color: isChecked ? '#fff' : 'var(--color-text-secondary)' }}>{label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Duration and Exclusions */}
                        <div className="workspace-card">
                            <h3 className="radio-group-title" style={{ fontSize: '14px' }}>Duration & Exclusions Protocols</h3>
                            <div className="interactive-slider-row" style={{ marginTop: '14px' }}>
                                <div className="slider-label-block">
                                    <span>Continuous Symptom Duration:</span>
                                    <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{durationWeeks} weeks</span>
                                </div>
                                <input 
                                    type="range"
                                    min={0}
                                    max={52}
                                    value={durationWeeks}
                                    onChange={(e) => setDurationWeeks(Number(e.target.value))}
                                    className="slider-control-field"
                                />
                            </div>

                            <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
                                {EXCLUSIONS_OPTIONS.map(([exId, label]) => {
                                    const isChecked = exclusionsChecked.includes(exId);
                                    return (
                                        <label key={exId} className="checkbox-option-row">
                                            <input 
                                                type="checkbox"
                                                className="checkbox-control"
                                                checked={isChecked}
                                                onChange={() => handleToggleExclusion(exId)}
                                            />
                                            <span className="checkbox-label" style={{ color: isChecked ? '#fff' : 'var(--color-text-secondary)' }}>{label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Outcomes, graph and gauges */}
                    <div style={{ display: 'grid', gap: '20px', position: 'sticky', top: '10px' }}>
                        
                        {/* Live Outcomes */}
                        <div className="workspace-card" style={{ border: '1px solid rgba(var(--color-primary-rgb), 0.2)' }}>
                            <h3 className="radio-group-title" style={{ fontSize: '15px' }}>Rule Engine Output</h3>
                            
                            {/* Risk banner */}
                            {diagReport.riskAssessment.level !== "None" && (
                                <div className={`hipaa-alert-box ${diagReport.riskAssessment.level === 'Critical' || diagReport.riskAssessment.level === 'Severe' ? 'danger' : 'warning'}`} style={{ padding: '12px', margin: '12px 0' }}>
                                    <i className="fa-solid fa-triangle-exclamation"></i>
                                    <div className="alert-message-content">
                                        <div className="alert-message-title">Risk Level: {diagReport.riskAssessment.level}</div>
                                        <span style={{ fontSize: '11px' }}>{diagReport.riskAssessment.notes}</span>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                                {diagReport.diagnoses.length === 0 && diagReport.differentials.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '12.5px' }}>
                                        Check symptoms to calculate diagnostic candidates.
                                    </div>
                                ) : (
                                    <>
                                        {/* Confirmed diagnoses */}
                                        {diagReport.diagnoses.map((d, idx) => (
                                            <div key={idx} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <strong style={{ color: '#fff', fontSize: '13.5px' }}>{d.disorderName}</strong>
                                                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{d.code} {d.snomedCode ? ` / SNOMED CT ${d.snomedCode}` : ''}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span className="badge-text-tag recruiting" style={{ fontSize: '10px' }}>{d.severity}</span>
                                                        <strong style={{ color: 'var(--color-primary)', fontSize: '14px' }}>{d.confidenceScore}%</strong>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                                                    {d.explanation}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Differentials */}
                                        {diagReport.differentials.map((d, idx) => (
                                            <div key={idx} style={{ opacity: 0.6, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <strong style={{ color: 'var(--color-text-muted)', fontSize: '13.5px' }}>{d.disorderName} (Differential)</strong>
                                                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{d.code} {d.snomedCode ? ` / SNOMED CT ${d.snomedCode}` : ''}</div>
                                                    </div>
                                                    <strong style={{ color: 'gray', fontSize: '14px' }}>{d.confidenceScore}%</strong>
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '4px' }}>
                                                    {d.notes}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Interactive SVG Knowledge Graph */}
                        <div className="workspace-card" style={{ padding: '16px' }}>
                            <h3 className="radio-group-title" style={{ fontSize: '14px', marginBottom: '12px' }}>Interactive Ontology Graph</h3>
                            
                            <div style={{ width: '100%', height: '240px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative' }}>
                                <svg width="100%" height="100%" style={{ display: 'block' }}>
                                    <defs>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>

                                    {/* Connections */}
                                    {diagReport.diagnoses.map((d, idx) => {
                                        const angle = (idx * 2 * Math.PI) / Math.max(diagReport.diagnoses.length, 1);
                                        const targetX = 150 + Math.cos(angle) * 80;
                                        const targetY = 120 + Math.sin(angle) * 60;
                                        return (
                                            <g key={`link-${idx}`}>
                                                <line 
                                                    x1="150" y1="120" 
                                                    x2={targetX} y2={targetY} 
                                                    stroke="var(--color-primary)" 
                                                    strokeWidth="2" 
                                                    strokeOpacity="0.6"
                                                />
                                            </g>
                                        );
                                    })}

                                    {/* Comorbidities links */}
                                    {diagReport.comorbidities.map((c, idx) => {
                                        const idx1 = diagReport.diagnoses.findIndex(d => d.disorderName === c.primary);
                                        const idx2 = diagReport.diagnoses.findIndex(d => d.disorderName === c.secondary);
                                        
                                        if (idx1 >= 0 && idx2 >= 0) {
                                            const angle1 = (idx1 * 2 * Math.PI) / diagReport.diagnoses.length;
                                            const angle2 = (idx2 * 2 * Math.PI) / diagReport.diagnoses.length;
                                            const x1 = 150 + Math.cos(angle1) * 80;
                                            const y1 = 120 + Math.sin(angle1) * 60;
                                            const x2 = 150 + Math.cos(angle2) * 80;
                                            const y2 = 120 + Math.sin(angle2) * 60;

                                            return (
                                                <line 
                                                    key={`com-link-${idx}`}
                                                    x1={x1} y1={y1} 
                                                    x2={x2} y2={y2} 
                                                    stroke="var(--color-secondary)" 
                                                    strokeWidth="1.5" 
                                                    strokeDasharray="4 3"
                                                />
                                            );
                                        }
                                        return null;
                                    })}

                                    {/* Patient Center Node */}
                                    <circle cx="150" cy="120" r="20" fill="rgba(6, 182, 212, 0.15)" stroke="var(--color-primary)" strokeWidth="2" filter="url(#glow)" />
                                    <text x="150" y="124" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">Liam</text>

                                    {/* Diagnostic Candidates Nodes */}
                                    {diagReport.diagnoses.map((d, idx) => {
                                        const angle = (idx * 2 * Math.PI) / diagReport.diagnoses.length;
                                        const targetX = 150 + Math.cos(angle) * 80;
                                        const targetY = 120 + Math.sin(angle) * 60;
                                        const isHigh = d.confidenceScore >= 70;

                                        return (
                                            <g key={`node-${idx}`}>
                                                <circle 
                                                    cx={targetX} cy={targetY} 
                                                    r="14" 
                                                    fill={isHigh ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"} 
                                                    stroke={isHigh ? "var(--color-success)" : "var(--color-warning)"} 
                                                    strokeWidth="1.5" 
                                                />
                                                <text x={targetX} y={targetY - 18} fill="#fff" fontSize="8" fontWeight="600" textAnchor="middle">
                                                    {d.disorderName.substring(0, 14)}...
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                                <div style={{ position: 'absolute', bottom: '6px', right: '10px', fontSize: '9px', color: 'var(--color-text-muted)' }}>
                                    Cyan: Active | Green: High Conf. | Orange: Comorbid
                                </div>
                            </div>
                        </div>

                        {/* Clinical Trials Finder */}
                        <div className="workspace-card" style={{ border: '1px solid rgba(var(--color-secondary-rgb), 0.2)' }}>
                            <h3 className="radio-group-title" style={{ color: 'var(--color-secondary)', fontSize: '14px' }}>
                                <i className="fa-solid fa-graduation-cap"></i> Clinical Recruiting Trials
                            </h3>
                            <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                                Find trials for patient specialty profile: <strong>{specialtyCondition}</strong>
                            </p>
                            <button 
                                className="action-button-btn secondary"
                                onClick={handleQueryTrials}
                                disabled={loadingTrials}
                                style={{ width: '100%', fontSize: '12px', padding: '10px' }}
                            >
                                {loadingTrials ? <i className="fa-solid fa-spinner fa-spin"></i> : "Query ClinicalTrials.gov"}
                            </button>

                            {trialsQueried && (
                                <div style={{ marginTop: '14px', maxHeight: '180px', overflowY: 'auto' }}>
                                    {trials.length === 0 ? (
                                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>No recruiting trials found.</p>
                                    ) : (
                                        trials.map(t => (
                                            <div key={t.nctId} style={{ borderBottom: '1px dashed var(--color-border)', padding: '6px 0', fontSize: '11.5px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)' }}>
                                                    <strong>{t.nctId}</strong>
                                                    <span style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '2px 4px', borderRadius: '4px' }}>{t.status}</span>
                                                </div>
                                                <div style={{ color: '#fff', fontSize: '11px', margin: '2px 0' }}>{t.title}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: AI CLINICAL DIFFERENTIAL */}
            {activeTab === 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    <div className="workspace-card">
                        <h3 className="radio-group-title" style={{ fontSize: '15px' }}>AI Differential Diagnostic Compiler</h3>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                            Submit detailed symptom summaries and MSE cues to build a differential diagnosis report powered by clinical intelligence.
                        </p>

                        <div style={{ display: 'grid', gap: '14px' }}>
                            <div>
                                <label className="form-label">Client Behavioral Symptoms Profile:</label>
                                <textarea 
                                    className="input-text-field"
                                    rows={3}
                                    value={symptomsInput}
                                    onChange={(e) => setSymptomsInput(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="form-label">Observed MSE Findings:</label>
                                <textarea 
                                    className="input-text-field"
                                    rows={2}
                                    value={mseFindingsText}
                                    onChange={(e) => setMseFindingsText(e.target.value)}
                                />
                            </div>

                            <button 
                                className="action-button-btn"
                                onClick={runAiDifferentialDiagnosis}
                                disabled={isAiLoading}
                                style={{ width: '100%' }}
                            >
                                {isAiLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Generate Comprehensive Differential Report"}
                            </button>
                        </div>
                    </div>

                    {aiResultText && (
                        <div className="workspace-card" style={{ border: '1px solid var(--color-primary)' }}>
                            <h3 className="radio-group-title" style={{ fontSize: '14px' }}><i className="fa-solid fa-file-contract"></i> AI Clinical Differential Report</h3>
                            <div className="report-markdown-output" style={{ marginTop: '12px' }}>
                                {aiResultText}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: PHARMACOTHERAPY & MEDICATION ADVISOR */}
            {activeTab === 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
                    {/* Left Column: Recommendations & Safety Audit */}
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {/* Recommendations Panel */}
                        <div className="workspace-card" style={{ border: '1px solid var(--color-border)' }}>
                            <h3 className="radio-group-title" style={{ fontSize: '15px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-pills"></i>
                                Pharmacotherapy Recommendations
                            </h3>
                            <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                                Recommended medications based on the client's evaluated candidate diagnoses:
                            </p>

                            {diagReport.diagnoses.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                    <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '20px', marginBottom: '8px', display: 'block', color: 'var(--color-warning)' }}></i>
                                    No candidate diagnoses calculated. Go to the <strong>Rule-Based Checker</strong> tab and select symptoms to generate recommendations.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '14px' }}>
                                    {MedicationService.getRecommendationsForDisorders(diagReport.diagnoses.map(d => d.disorderName)).map(drug => {
                                        const isInDraft = draftPrescription.some(d => d.id === drug.id);
                                        return (
                                            <div key={drug.id} className="metric-card" style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <span className="badge-text-tag clinical" style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-primary)' }}>
                                                            {drug.name} ({drug.usBrand})
                                                        </span>
                                                        <h4 style={{ margin: '6px 0 2px 0', fontSize: '14px', color: '#fff' }}>Generic: {drug.name}</h4>
                                                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0' }}>Target: {drug.originatingDiagnosis}</p>
                                                    </div>
                                                    <button
                                                        className={`action-button-btn ${isInDraft ? 'secondary' : ''}`}
                                                        onClick={() => handleTogglePrescribe(drug)}
                                                        style={{ padding: '6px 12px', fontSize: '11px' }}
                                                    >
                                                        {isInDraft ? "Remove" : "Add to Draft"}
                                                    </button>
                                                </div>
                                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Typical dose: <strong>{drug.dosage}</strong></span>
                                                    <button 
                                                        className="auth-switch-btn"
                                                        onClick={() => setSelectedDrugDetails(drug)}
                                                        style={{ fontSize: '11px', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
                                                    >
                                                        Details <i className="fa-solid fa-arrow-right"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Safety & Contraindications Audit */}
                        <div className="workspace-card" style={{ border: '1px solid var(--color-border)' }}>
                            <h3 className="radio-group-title" style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--color-success)' }}></i>
                                Real-Time Safety Audit
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', margin: '10px 0' }}>
                                <span style={{ fontSize: '12px' }}>Client: <strong>{activePatient.name}</strong></span>
                                <span style={{ fontSize: '12px' }}>Age: <strong>{activePatient.age}</strong></span>
                                <span style={{ fontSize: '12px' }}>Cohort: <strong>{activePatient.age < 18 ? 'Pediatric' : activePatient.age > 65 ? 'Geriatric' : 'Adult'}</strong></span>
                            </div>

                            {draftPrescription.length === 0 ? (
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', textAlign: 'center', padding: '12px' }}>
                                    No medications added to the draft. Select medications to audit.
                                </div>
                            ) : (
                                (() => {
                                    const audit = MedicationService.runSafetyAudit(activePatient.age, activePatient.gender, draftPrescription);
                                    return (
                                        <div>
                                            {audit.alerts.length === 0 ? (
                                                <div className="hipaa-alert-box success" style={{ display: 'flex', gap: '8px', padding: '10px', margin: '8px 0', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '6px' }}>
                                                    <i className="fa-solid fa-circle-check" style={{ marginTop: '3px' }}></i>
                                                    <span style={{ fontSize: '11.5px' }}>No age-based alerts or contraindications detected for this selection. (Clinician must verify all factors).</span>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'grid', gap: '8px' }}>
                                                    {audit.alerts.map((alert, idx) => (
                                                        <div key={idx} className={`hipaa-alert-box ${alert.level === 'Critical' ? 'danger' : 'warning'}`} style={{ padding: '10px', display: 'flex', gap: '8px', margin: '0', borderRadius: '6px', background: alert.level === 'Critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', borderLeft: alert.level === 'Critical' ? '3px solid rgb(239, 68, 68)' : '3px solid rgb(245, 158, 11)' }}>
                                                            <i className="fa-solid fa-triangle-exclamation" style={{ marginTop: '3px', color: alert.level === 'Critical' ? 'rgb(239, 68, 68)' : 'rgb(245, 158, 11)' }}></i>
                                                            <div>
                                                                <strong style={{ fontSize: '12px', display: 'block', color: '#fff' }}>{alert.drugName} - {alert.type} ({alert.level})</strong>
                                                                <span style={{ fontSize: '11.5px', lineHeight: '1.4', display: 'block', marginTop: '3px', color: 'var(--color-text-secondary)' }}>{alert.message}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </div>

                    {/* Right Column: Draft Prescription Workspace & ABDM Sync */}
                    <div style={{ display: 'grid', gap: '20px', position: 'sticky', top: '10px' }}>
                        <div className="workspace-card" style={{ border: '1px solid rgba(var(--color-primary-rgb), 0.3)' }}>
                            <h3 className="radio-group-title" style={{ fontSize: '15px', color: '#fff', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '14px' }}>
                                <i className="fa-solid fa-file-prescription" style={{ marginRight: '6px' }}></i>
                                Active Prescription Draft
                            </h3>

                            {draftPrescription.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--color-text-muted)', fontSize: '12.5px' }}>
                                    Draft is currently empty. Use the recommendations panel to add medications.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '14px' }}>
                                    <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'grid', gap: '8px' }}>
                                        {draftPrescription.map(drug => (
                                            <div key={drug.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong style={{ color: '#fff', fontSize: '13px' }}>{drug.name} ({drug.usBrand})</strong>
                                                    <span style={{ fontSize: '11px', display: 'block', color: 'var(--color-text-secondary)' }}>Dose: {drug.dosage}</span>
                                                </div>
                                                <button
                                                    className="rail-btn"
                                                    onClick={() => handleTogglePrescribe(drug)}
                                                    style={{ border: 'none', background: 'none', color: 'var(--color-error)', cursor: 'pointer' }}
                                                    title="Remove"
                                                >
                                                    <i className="fa-solid fa-trash-can"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Clinical Justification Input */}
                                    <div className="radio-options-card-group" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                                        <div className="radio-group-title" style={{ fontSize: '12px', marginBottom: '6px' }}>Clinical Justification Note:</div>
                                        <textarea
                                            className="textarea-input-field"
                                            rows={3}
                                            style={{ width: '100%', fontSize: '12px', resize: 'none', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px', color: '#fff' }}
                                            placeholder="Provide clinical rationale for this pharmacological course..."
                                            value={rxJustificationNote}
                                            onChange={(e) => setRxJustificationNote(e.target.value)}
                                        />
                                        <button
                                            className="action-button-btn secondary"
                                            onClick={generateAiRxJustification}
                                            disabled={isRxJustificationLoading}
                                            style={{ width: '100%', marginTop: '8px', fontSize: '11px', padding: '8px', cursor: 'pointer' }}
                                        >
                                            {isRxJustificationLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-wand-magic-sparkles"></i> Autocomplete with AI Copilot</>}
                                        </button>
                                    </div>

                                    {/* Sync to ABDM Section */}
                                    <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '14px', borderRadius: '8px', marginTop: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}><i className="fa-solid fa-link" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i> ABHA Registry Sync</span>
                                            {activePatient.abhaNumber ? (
                                                <span className="badge-text-tag recruiting" style={{ fontSize: '9px', padding: '1px 6px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', borderRadius: '4px' }}>Linked</span>
                                            ) : (
                                                <span className="badge-text-tag trial" style={{ fontSize: '9px', padding: '1px 6px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', borderRadius: '4px' }}>No ABHA Found</span>
                                            )}
                                        </div>
                                        {activePatient.abhaNumber && (
                                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                                                ABHA ID: <strong>{activePatient.abhaNumber}</strong> ({activePatient.abhaAddress})
                                            </div>
                                        )}
                                        <button
                                            className="action-button-btn"
                                            onClick={submitToAbdm}
                                            disabled={isSyncingToAbdm}
                                            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                        >
                                            {isSyncingToAbdm ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-cloud-arrow-up"></i> Sign & Submit to ABDM Registry</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ABDM Registry Receipt */}
                        {abdmReceipt && (
                            <div className="workspace-card animate-fadeIn" style={{ border: '1px solid var(--color-success)', background: 'rgba(16, 185, 129, 0.03)', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <i className="fa-solid fa-circle-check"></i>
                                    ABDM Gateway Submission Receipt
                                </h4>
                                <div style={{ fontSize: '11px', display: 'grid', gap: '4px', color: 'var(--color-text-secondary)' }}>
                                    <div>Transaction ID: <strong style={{ color: '#fff' }}>{abdmReceipt.transactionId}</strong></div>
                                    <div>Registry Status: <strong style={{ color: 'var(--color-success)' }}>{abdmReceipt.registryStatus}</strong></div>
                                    <div>Link Token: <strong style={{ color: '#fff' }}>{abdmReceipt.linkToken}</strong></div>
                                    <div>Timestamp: <strong>{new Date(abdmReceipt.timestamp).toLocaleString()}</strong></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Drug Details Slide-down drawer (if selected) */}
            {selectedDrugDetails && (
                <div 
                    style={{
                        position: 'fixed',
                        bottom: 0, right: 0, left: 0,
                        background: 'var(--color-surface)',
                        borderTop: '2px solid var(--color-primary)',
                        padding: '24px',
                        zIndex: 1000,
                        maxHeight: '60%',
                        overflowY: 'auto',
                        boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
                        animation: 'slideUp 0.3s ease-out'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div>
                            <span className="badge-text-tag video" style={{ fontSize: '10px', borderRadius: '4px' }}>Drug Information Monograph</span>
                            <h3 style={{ margin: '6px 0 0 0', color: '#fff' }}>{selectedDrugDetails.name} ({selectedDrugDetails.usBrand})</h3>
                        </div>
                        <button 
                            className="rail-btn"
                            onClick={() => setSelectedDrugDetails(null)}
                            style={{ border: 'none', background: 'rgba(255,255,255,0.05)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <i className="fa-solid fa-xmark" style={{ color: '#fff' }}></i>
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div>
                            <h4 style={{ fontSize: '12px', color: 'var(--color-primary)', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Indian Context Brand Equivalents</h4>
                            <p style={{ fontSize: '12.5px', color: '#fff', margin: '0 0 12px 0' }}>{selectedDrugDetails.indianBrands}</p>

                            <h4 style={{ fontSize: '12px', color: 'var(--color-primary)', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Estimated Price (India)</h4>
                            <p style={{ fontSize: '12.5px', color: '#fff', margin: '0 0 12px 0' }}>{selectedDrugDetails.indianPrice}</p>

                            <h4 style={{ fontSize: '12px', color: 'var(--color-primary)', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Typical Dosage</h4>
                            <p style={{ fontSize: '12.5px', color: '#fff', margin: '0' }}>{selectedDrugDetails.dosage}</p>
                        </div>

                        <div>
                            <h4 style={{ fontSize: '12px', color: 'var(--color-primary)', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Common Side Effects</h4>
                            <ul style={{ margin: '0 0 12px 0', paddingLeft: '16px', fontSize: '12.5px', color: '#fff' }}>
                                {selectedDrugDetails.sideEffects.map((se, i) => <li key={i}>{se}</li>)}
                            </ul>

                            <h4 style={{ fontSize: '12px', color: 'var(--color-primary)', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Precautions</h4>
                            <p style={{ fontSize: '12.5px', color: '#fff', margin: '0', lineHeight: '1.4' }}>{selectedDrugDetails.precautions}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
