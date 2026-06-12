import { useState, useEffect, useMemo, useRef } from 'react';
import { Database } from '../../services/db';
import { HitopService, HITOP_ITEMS } from '../../services/hitopService';
import { useToast } from '../ToastProvider';

export function HitopMatrixExplorer({ patients, activePatientId, onSetActivePatientId }) {
    const { showToast } = useToast();
    
    // Active patient details
    const activePatient = useMemo(() => {
        return patients.find(p => p.id === Number(activePatientId)) || patients[0];
    }, [patients, activePatientId]);

    // Track active B-HiTOP form answers (array of 45 ratings, 1 to 4)
    const [formAnswers, setFormAnswers] = useState(Array(45).fill(1));
    const [selectedTab, setSelectedTab] = useState('Internalizing'); // Spectrum tabs in workstation
    const [selectedNodeId, setSelectedNodeId] = useState('pfactor'); // Clicking nodes in SVG
    const [rdfLog, setRdfLog] = useState('');
    const [cypherLog, setCypherLog] = useState('');
    const [sandboxTab, setSandboxTab] = useState('rdf'); // 'rdf' or 'cypher'
    
    // SPARQL simulator state
    const [sparqlQuery, setSparqlQuery] = useState(
        `PREFIX hitop: <http://hitop-taxonomy.org/ontology#>
PREFIX psypyrus: <http://psypyrus.ai/ontology#>

SELECT ?patientName ?spectrumName ?score
WHERE {
    ?patient a psypyrus:Patient ;
             psypyrus:hasName ?patientName ;
             hitop:hasPsychopathologyProfile ?profile .
    ?profile hitop:hasSpectrumElevation ?elevation .
    ?elevation hitop:spectrum ?spectrum ;
               hitop:meanScore ?score .
    ?spectrum rdfs:label ?spectrumName .
    FILTER(?score >= 2.5)
}`
    );
    const [sparqlResults, setSparqlResults] = useState(null);
    const [isSimulatingSparql, setIsSimulatingSparql] = useState(false);

    // Load active patient answers from local storage or defaults
    useEffect(() => {
        if (!activePatient) return;
        const report = HitopService.mapPatientToHitop(activePatient.id);
        if (report && report.answers) {
            setFormAnswers([...report.answers]);
        }
    }, [activePatient]);

    // Live report computed from the current form state
    const liveReport = useMemo(() => {
        if (!activePatient) return null;
        // Compute live report based on current answers in state
        const scores = HitopService.scoreHitop(formAnswers);
        const getElevationPercent = (score) => Math.round(((score - 1.0) / 3.0) * 100);

        const spectraElevations = [
            { id: 'internalizing', name: "Internalizing", score: scores.internalizing, elevation: getElevationPercent(scores.internalizing), color: "#f43f5e", icon: "fa-brain" },
            { id: 'somatoform', name: "Somatoform", score: scores.somatoform, elevation: getElevationPercent(scores.somatoform), color: "#ec4899", icon: "fa-heart-pulse" },
            { id: 'detachment', name: "Detachment", score: scores.detachment, elevation: getElevationPercent(scores.detachment), color: "#a855f7", icon: "fa-user-slash" },
            { id: 'thought_disorder', name: "Thought Disorder", score: scores.thoughtDisorder, elevation: getElevationPercent(scores.thoughtDisorder), color: "#3b82f6", icon: "fa-cloud" },
            { id: 'disinhibition', name: "Disinhibition", score: scores.disinhibition, elevation: getElevationPercent(scores.disinhibition), color: "#10b981", icon: "fa-bolt" },
            { id: 'antagonism', name: "Antagonism", score: scores.antagonism, elevation: getElevationPercent(scores.antagonism), color: "#f59e0b", icon: "fa-hand-fist" }
        ];

        const secondaryElevations = [
            { id: 'externalizing', name: "Externalizing (Secondary)", score: scores.externalizing, elevation: getElevationPercent(scores.externalizing), color: "#f97316", icon: "fa-bullhorn" },
            { id: 'p_factor', name: "General p-Factor", score: scores.pFactor, elevation: getElevationPercent(scores.pFactor), color: "#06b6d4", icon: "fa-arrows-to-dot" }
        ];

        const recommendations = [];
        if (scores.internalizing >= 2.5) {
            recommendations.push({
                scale: "Internalizing",
                title: "Cognitive Restructuring & SSRI Evaluation",
                text: "Elevated internalizing spectrum. Prioritize distress tolerance training, cognitive appraisal pacing, and evaluate standard pharmacotherapy options."
            });
        }
        if (scores.somatoform >= 2.5) {
            recommendations.push({
                scale: "Somatoform",
                title: "Somatic Grounding & Biofeedback",
                text: "Somatic symptoms elevated. Incorporate HRV biofeedback breathing, sensory grounding, and interoceptive exposure techniques."
            });
        }
        if (scores.detachment >= 2.5) {
            recommendations.push({
                scale: "Detachment",
                title: "Social Affiliation Pacing",
                text: "Social detachment elevated. Deploy behavior activation with micro-social objectives. Foster therapeutic alliance security."
            });
        }
        if (scores.thoughtDisorder >= 2.5) {
            recommendations.push({
                scale: "Thought Disorder",
                title: "Reality Testing & Cognitive Pacing",
                text: "Thought disorder spectrum elevated. Engage in structured reality testing. Minimize high cognitive load tasks; establish clear sensory boundaries."
            });
        }
        if (scores.disinhibition >= 2.5) {
            recommendations.push({
                scale: "Disinhibition",
                title: "Executive Function & Response Delay Pacing",
                text: "Disinhibition elevated. Scaffold planning tasks, use external alarm queues, and apply response-cost boundary systems."
            });
        }
        if (scores.antagonism >= 2.5) {
            recommendations.push({
                scale: "Antagonism",
                title: "Empathy Training & Interpersonal Regulation",
                text: "Antagonism elevated. Engage in mentalizing exercises, assertiveness contrasts (vs manipulation), and perspective taking modules."
            });
        }

        return {
            patientId: activePatient.id,
            patientName: activePatient.name,
            specialty: activePatient.specialty,
            answers: formAnswers,
            spectra: spectraElevations,
            secondary: secondaryElevations,
            recommendations
        };
    }, [activePatient, formAnswers]);

    // Handle questionnaire submit
    const handleSubmitForm = () => {
        if (!activePatient) return;
        
        // Sum total score as is standard
        const totalScore = formAnswers.reduce((sum, val) => sum + val, 0);

        // Save B-HiTOP Assessment Log
        Database.insertAssessmentScore({
            patientId: Number(activePatient.id),
            type: "B-HiTOP",
            score: totalScore,
            details: `p-Factor mean: ${liveReport?.secondary?.find(s => s.id === 'p_factor')?.score}`,
            answers: formAnswers
        });

        Database.logAudit("HiTOP Assessment Logged", `Saved B-HiTOP diagnostic response array for patient ID ${activePatient.id}.`);
        showToast("B-HiTOP assessment logged successfully in EHR records.", "success");
    };

    // Reset questionnaire form to patient's database values
    const handleResetForm = () => {
        if (!activePatient) return;
        const report = HitopService.mapPatientToHitop(activePatient.id);
        if (report && report.answers) {
            setFormAnswers([...report.answers]);
            showToast("Restored saved questionnaire state.", "info");
        }
    };

    // Update individual rating (1-4)
    const handleSetRating = (itemId, rating) => {
        const updated = [...formAnswers];
        updated[itemId - 1] = rating;
        setFormAnswers(updated);
    };

    // Tab items list for form
    const formItemsByTab = useMemo(() => {
        return HITOP_ITEMS.filter(item => item.scale === selectedTab);
    }, [selectedTab]);

    // RDF Turtle serializations
    const handleGenerateRDF = () => {
        if (!liveReport) return;
        const triples = HitopService.getHitopOntologyTriples(liveReport);
        setRdfLog(triples);
        showToast("RDF/Turtle triples compiled.", "success");
    };

    // Download Turtle File
    const handleDownloadRDF = () => {
        if (!rdfLog) {
            showToast("Generate triples first.", "warning");
            return;
        }
        const blob = new Blob([rdfLog], { type: 'text/turtle' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hitop_mapping_patient_${activePatient.id}_${Date.now()}.ttl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Database.logAudit("Exported HiTOP RDF", `Downloaded RDF/Turtle file for Patient ID ${activePatient.id}`);
        showToast("Turtle RDF file downloaded successfully.", "success");
    };

    // Neo4j Cypher script builder
    const handleGenerateCypher = () => {
        if (!activePatient || !liveReport) return;
        
        let cypher = `// 1. Create Patient & Diagnostic Node\nCREATE (p:Patient {id: ${activePatient.id}, name: "${activePatient.name}", specialty: "${activePatient.specialty || 'General Psychiatry'}"})\n`;
        cypher += `CREATE (profile:HiTOPProfile {compiledAt: datetime()})\n`;
        cypher += `CREATE (p)-[:HAS_HITOP_PROFILE]->(profile)\n\n`;
        
        cypher += `// 2. Link Spectra & Elevations\n`;
        liveReport.spectra.forEach(spec => {
            const cleanName = spec.name.replace(/\s+/g, '');
            cypher += `CREATE (s_${spec.id}:HiTOPSpectrum {name: "${spec.name}", score: ${spec.score}, elevationPercent: ${spec.elevation}})\n`;
            cypher += `CREATE (profile)-[:HAS_SPECTRUM_ELEVATION {severity: ${spec.score}}]->(s_${spec.id})\n`;
        });

        cypher += `\n// 3. Link General p-Factor & Secondary Scales\n`;
        liveReport.secondary.forEach(sec => {
            const cleanName = sec.name.replace(/[^a-zA-Z0-9]/g, '_');
            cypher += `CREATE (sec_${sec.id}:HiTOPScale {name: "${sec.name}", score: ${sec.score}, elevationPercent: ${sec.elevation}})\n`;
            cypher += `CREATE (profile)-[:HAS_SECONDARY_ELEVATION {severity: ${sec.score}}]->(sec_${sec.id})\n`;
        });

        setCypherLog(cypher);
        showToast("HiTOP Cypher script compiled.", "success");
    };

    // SPARQL Simulation Runner
    const handleRunSparql = () => {
        setIsSimulatingSparql(true);
        setTimeout(() => {
            setIsSimulatingSparql(false);
            // Compile elevated spectra across all patients for mock results
            const mockRows = [];
            patients.forEach(pat => {
                const report = HitopService.mapPatientToHitop(pat.id);
                if (report) {
                    report.spectra.forEach(spec => {
                        if (spec.score >= 2.5) {
                            mockRows.push({
                                patientName: pat.name,
                                spectrumName: spec.name,
                                score: spec.score.toFixed(2) + " (Mean)"
                            });
                        }
                    });
                }
            });
            setSparqlResults(mockRows);
            showToast("SPARQL query executed on simulation engine.", "success");
        }, 800);
    };

    // Graph hierarchy details dictionary for interactive nodes
    const nodeDetailsInfo = useMemo(() => {
        if (!activePatient) return {};
        return {
            patient: {
                title: activePatient.name,
                type: "Active EHR Case File",
                def: `Evaluated specialty: "${activePatient.specialty || 'None Assigned'}". All calculated ratings correspond to this patient profile.`,
                clinicalNote: `Risk Profile is marked as "${activePatient.riskStatus || 'None'}" in local storage.`
            },
            pfactor: {
                title: "General p-Factor",
                type: "HiTOP Super-ordinate Dimension",
                def: "Reflects the common variance shared by all psychological symptoms. A high score suggests general psychiatric vulnerability and complexity.",
                clinicalNote: `Patient Liam Carter exhibits a high general p-Factor (${liveReport?.secondary?.find(s => s.id === 'p_factor')?.score || 1.0}) indicating severe multi-spectra distress.`
            },
            internalizing: {
                title: "Internalizing Spectrum",
                type: "HiTOP Spectrum",
                def: "Characterized by negative emotional states, mood swings, somatic complaints, and social withdrawal. Includes depressive disorder, generalized anxiety disorder, PTSD, panic, and phobias.",
                clinicalNote: "Divided into Anxious Misery, Fear, and Eating Pathology subfactors."
            },
            somatoform: {
                title: "Somatoform Spectrum",
                type: "HiTOP Spectrum",
                def: "Features bodily discomfort, pains, fatigue, and severe health concerns without a clear organic medical diagnosis.",
                clinicalNote: "Strongly correlated with Anxious Misery but stands as a distinct diagnostic spectrum."
            },
            detachment: {
                title: "Detachment Spectrum",
                type: "HiTOP Spectrum",
                def: "Involves severe social isolation, low interest in close relationships, and anhedonic inability to experience positive rewards.",
                clinicalNote: "Represents the structural base of Schizoid and Avoidant personality configurations."
            },
            thought_disorder: {
                title: "Thought Disorder Spectrum",
                type: "HiTOP Spectrum",
                def: "Features odd, eccentric, or paranoid beliefs, hallucination vulnerability, and severe cognitive disorganization.",
                clinicalNote: "Encompasses schizotypy, schizophrenia, and delusional syndromes."
            },
            disinhibition: {
                title: "Disinhibition Spectrum",
                type: "HiTOP Spectrum",
                def: "Vulnerability to impulsivity, recklessness, planning failures, and a persistent disregard for schedules or rules.",
                clinicalNote: "Corresponds closely with ADHD, Substance Abuse, and Borderline personality metrics."
            },
            antagonism: {
                title: "Antagonism Spectrum",
                type: "HiTOP Spectrum",
                def: "Features coldheartedness, power seeking, manipulativeness, deceit, and expecting special treatment.",
                clinicalNote: "Formulates the foundation of Antisocial and Narcissistic personality syndromes."
            },
            sub_anxious_misery: {
                title: "Anxious Misery",
                type: "Internalizing Subfactor",
                def: "Contains distress, sadness, and chronic worry. Shared core of major depressive disorder (MDD), generalized anxiety disorder (GAD), and PTSD.",
                clinicalNote: "Treatment responds to SSRIs, SNRIs, and cognitive-behavioral restructuring."
            },
            sub_fear: {
                title: "Fear Subfactor",
                type: "Internalizing Subfactor",
                def: "Coordinates acute, panic-based escape mechanisms and situational phobias.",
                clinicalNote: "Exhibits strong autonomic arousal elevations during threat exposure."
            },
            sub_eating: {
                title: "Eating Pathology",
                type: "Internalizing Subfactor",
                def: "Involves body shape dissatisfaction, binge-purge dynamics, and rigid dietary restraint rules.",
                clinicalNote: "Highly correlated with internalizing distress but categorized as a distinct subfactor."
            },
            sub_impulsive: {
                title: "Impulsive Disinhibition",
                type: "Disinhibition Subfactor",
                def: "Sudden action tendencies, reckless spending, risk-taking, and immediate reward seeking.",
                clinicalNote: "Modulates central dopaminergic pathways."
            },
            sub_irresponsible: {
                title: "Irresponsible Disinhibition",
                type: "Disinhibition Subfactor",
                def: "Failure to follow schedules, paying bills late, losing items, and messy life organization.",
                clinicalNote: "Relates to executive prefrontal control deficits."
            },
            sub_aggressive: {
                title: "Aggressive Antagonism",
                type: "Antagonism Subfactor",
                def: "Hostile reactions, demanding compliance, and taking pleasure in social power or dominance.",
                clinicalNote: "Strong predictor of conduct disorder and domestic hostility."
            },
            sub_deceitful: {
                title: "Deceitful Antagonism",
                type: "Antagonism Subfactor",
                def: "Pattern of lying to avoid trouble, deceiving others, and emotional manipulation.",
                clinicalNote: "Associated with narcissistic entitlement configurations."
            },
            sub_withdrawal: {
                title: "Withdrawal Subfactor",
                type: "Detachment Subfactor",
                def: "Active choices to remain alone, avoidance of close groups, and social fatigue.",
                clinicalNote: "Differentiates schizoid characteristics from anxious avoidant patterns."
            },
            sub_anhedonia: {
                title: "Anhedonia Subfactor",
                type: "Detachment Subfactor",
                def: "Complete loss of enjoyment in romantic, occupational, or social interactions.",
                clinicalNote: "Direct target for reward-based behavioral activation."
            }
        };
    }, [activePatient, liveReport]);

    // Build the dynamic SVG Graph nodes and connectors based on patient state
    const svgContent = useMemo(() => {
        if (!liveReport) return null;

        // Coordinates configuration
        const patientNode = { id: 'patient', label: activePatient.name, x: 60, y: 200, type: 'patient' };
        const pFactorNode = { id: 'pfactor', label: 'General p-Factor', x: 200, y: 200, type: 'pfactor' };
        
        const spectraNodes = [
            { id: 'internalizing', label: 'Internalizing', x: 400, y: 50, color: '#f43f5e', subfactors: ['sub_anxious_misery', 'sub_fear', 'sub_eating'] },
            { id: 'somatoform', label: 'Somatoform', x: 400, y: 110, color: '#ec4899', subfactors: [] },
            { id: 'detachment', label: 'Detachment', x: 400, y: 170, color: '#a855f7', subfactors: ['sub_withdrawal', 'sub_anhedonia'] },
            { id: 'thought_disorder', label: 'Thought Disorder', x: 400, y: 230, color: '#3b82f6', subfactors: [] },
            { id: 'disinhibition', label: 'Disinhibition', x: 400, y: 290, color: '#10b981', subfactors: ['sub_impulsive', 'sub_irresponsible'] },
            { id: 'antagonism', label: 'Antagonism', x: 400, y: 350, color: '#f59e0b', subfactors: ['sub_aggressive', 'sub_deceitful'] }
        ];

        // Draw links
        const paths = [];

        // Patient -> p-Factor link
        const isPFactorElevated = liveReport.secondary.find(s => s.id === 'p_factor')?.score >= 2.5;
        paths.push(
            <path
                key="p-patient"
                d={`M ${patientNode.x} ${patientNode.y} C ${(patientNode.x + pFactorNode.x) / 2} ${patientNode.y}, ${(patientNode.x + pFactorNode.x) / 2} ${pFactorNode.y}, ${pFactorNode.x} ${pFactorNode.y}`}
                stroke={isPFactorElevated ? "var(--color-primary)" : "rgba(255, 255, 255, 0.08)"}
                strokeWidth={isPFactorElevated ? "3" : "1.5"}
                fill="none"
                style={{ filter: isPFactorElevated ? "drop-shadow(0 0 4px var(--color-primary))" : "none" }}
            />
        );

        // p-Factor -> Spectra links
        spectraNodes.forEach(spec => {
            const specScore = liveReport.spectra.find(s => s.id === spec.id)?.score || 1.0;
            const isElevated = specScore >= 2.5;
            paths.push(
                <path
                    key={`p-${spec.id}`}
                    d={`M ${pFactorNode.x} ${pFactorNode.y} C ${(pFactorNode.x + spec.x) / 2} ${pFactorNode.y}, ${(pFactorNode.x + spec.x) / 2} ${spec.y}, ${spec.x} ${spec.y}`}
                    stroke={isElevated ? spec.color : "rgba(255, 255, 255, 0.08)"}
                    strokeWidth={isElevated ? "3" : "1.5"}
                    fill="none"
                    style={{ filter: isElevated ? `drop-shadow(0 0 5px ${spec.color})` : "none" }}
                />
            );
        });

        // Spectra -> Subfactors (for selected spectrum)
        const selectedSpectrumObj = spectraNodes.find(s => s.id === selectedNodeId);
        const subNodes = [];
        if (selectedSpectrumObj && selectedSpectrumObj.subfactors.length > 0) {
            const numSubs = selectedSpectrumObj.subfactors.length;
            selectedSpectrumObj.subfactors.forEach((subId, idx) => {
                const yOffset = selectedSpectrumObj.y + (idx - (numSubs - 1) / 2) * 50;
                const subNode = {
                    id: subId,
                    label: subId.replace('sub_', '').replace('_', ' '),
                    x: 600,
                    y: yOffset,
                    color: selectedSpectrumObj.color
                };
                subNodes.push(subNode);

                const isElevated = (liveReport.spectra.find(s => s.id === selectedSpectrumObj.id)?.score || 1.0) >= 2.5;

                paths.push(
                    <path
                        key={`${selectedSpectrumObj.id}-${subId}`}
                        d={`M ${selectedSpectrumObj.x} ${selectedSpectrumObj.y} C ${(selectedSpectrumObj.x + subNode.x) / 2} ${selectedSpectrumObj.y}, ${(selectedSpectrumObj.x + subNode.x) / 2} ${subNode.y}, ${subNode.x} ${subNode.y}`}
                        stroke={isElevated ? selectedSpectrumObj.color : "rgba(255, 255, 255, 0.08)"}
                        strokeWidth={isElevated ? "2" : "1"}
                        fill="none"
                        style={{ filter: isElevated ? `drop-shadow(0 0 3px ${selectedSpectrumObj.color})` : "none" }}
                    />
                );
            });
        }

        return {
            patientNode,
            pFactorNode,
            spectraNodes,
            subNodes,
            paths
        };
    }, [liveReport, selectedNodeId, activePatient]);

    const activeNodeDetails = useMemo(() => {
        return nodeDetailsInfo[selectedNodeId] || {
            title: "Taxonomy Construct Details",
            type: "Clinical Ontology",
            def: "Click any node in the SVG interactive hierarchy graph to inspect dimensional details, DSM-5 correlations, and diagnostic guidelines.",
            clinicalNote: "No node selected."
        };
    }, [selectedNodeId, nodeDetailsInfo]);

    return (
        <div className="screen-container active" id="screen-hitop-matrix" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '10px' }}>
            <style>{`
                .hitop-main-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.3fr;
                    gap: 20px;
                }
                @media (max-width: 1200px) {
                    .hitop-main-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .hitop-tabs-row {
                    display: flex;
                    gap: 4px;
                    background: rgba(0, 0, 0, 0.2);
                    padding: 4px;
                    border-radius: var(--radius-sm);
                    margin-bottom: 15px;
                    overflow-x: auto;
                }
                .hitop-tab-btn {
                    flex: 1;
                    padding: 8px 12px;
                    border: none;
                    background: transparent;
                    color: var(--color-text-secondary);
                    font-size: 11px;
                    font-weight: 600;
                    border-radius: 4px;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.15s ease;
                }
                .hitop-tab-btn:hover {
                    color: var(--color-text-primary);
                }
                .hitop-tab-btn.active {
                    background: var(--color-primary);
                    color: #fff;
                }
                .slider-row-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 10px;
                    background: rgba(255,255,255,0.01);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-sm);
                    margin-bottom: 8px;
                }
                .slider-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                }
                .slider-opt-container {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                    margin-top: 4px;
                }
                .slider-opt-btn {
                    padding: 6px 4px;
                    font-size: 10px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                    cursor: pointer;
                    text-align: center;
                    color: var(--color-text-secondary);
                    transition: all 0.15s ease;
                }
                .slider-opt-btn:hover {
                    background: rgba(255,255,255,0.05);
                    color: #fff;
                }
                .slider-opt-btn.active {
                    background: var(--color-primary-container);
                    border-color: var(--color-primary);
                    color: #fff;
                    font-weight: bold;
                }
                .metric-bar-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .metric-bar-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                }
                .metric-bar-bg {
                    height: 8px;
                    background: rgba(255,255,255,0.04);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .metric-bar-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                .svg-viewport {
                    background: radial-gradient(circle at center, #0b1528 0%, #030712 100%);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    box-shadow: var(--shadow-sm);
                }
                .svg-node {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .svg-node:hover {
                    filter: brightness(1.2);
                }
                .query-console-block {
                    font-family: var(--font-mono);
                    background: rgba(0,0,0,0.5);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    padding: 12px;
                    color: #38bdf8;
                    font-size: 12px;
                    min-height: 120px;
                    max-height: 250px;
                    overflow-y: auto;
                    white-space: pre-wrap;
                }
            `}</style>

            {/* Breadcrumb + Patient Dropdown Top Bar */}
            <div className="section-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="fa-solid fa-sitemap" style={{ color: 'var(--color-primary)', fontSize: '24px' }}></i>
                    <div>
                        <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 800 }}>HiTOP Clinical Taxonomy Matrix</h2>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>Quantitative Dimensional Classification & Graph database sandbox</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="fa-solid fa-shield-halved" style={{ color: 'var(--color-success)' }}></i> HIPAA Audit Active
                    </span>
                    <select 
                        value={activePatientId} 
                        onChange={(e) => onSetActivePatientId(Number(e.target.value))}
                        className="patient-select-dropdown"
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.specialty})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="hitop-main-grid">
                
                {/* LEFT COLUMN: Real-Time Workstation & Biosignatures */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* B-HiTOP Live Diagnostic Form */}
                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ fontSize: '14px', color: '#fff' }}><i className="fa-solid fa-clipboard-question"></i> B-HiTOP Assessment Workstation</h3>
                            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '10px' }}>45 Items</span>
                        </div>
                        
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '15px', lineHeight: '1.4' }}>
                            Adjust ratings in real-time below to compile dimensional severity. Ratings represent severity: 1 (Not at all) to 4 (A lot).
                        </p>

                        <div className="hitop-tabs-row">
                            {['Internalizing', 'Somatoform', 'Detachment', 'Thought Disorder', 'Disinhibition', 'Antagonism'].map(specName => (
                                <button 
                                    key={specName} 
                                    className={`hitop-tab-btn ${selectedTab === specName ? 'active' : ''}`}
                                    onClick={() => setSelectedTab(specName)}
                                >
                                    {specName}
                                </button>
                            ))}
                        </div>

                        <div style={{ minHeight: '260px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px', marginBottom: '15px' }}>
                            {formItemsByTab.map(item => (
                                <div key={item.id} className="slider-row-item">
                                    <div className="slider-header">
                                        <span style={{ fontWeight: '500', color: '#fff' }}>Item {item.id}</span>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Scale: {item.scale}</span>
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0' }}>
                                        {item.text}
                                    </span>
                                    <div className="slider-opt-container">
                                        {[1, 2, 3, 4].map(val => (
                                            <button 
                                                key={val}
                                                className={`slider-opt-btn ${formAnswers[item.id - 1] === val ? 'active' : ''}`}
                                                onClick={() => handleSetRating(item.id, val)}
                                            >
                                                {val === 1 ? "1 - Not at all" : val === 2 ? "2 - A little" : val === 3 ? "3 - Moderately" : "4 - A lot"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="action-button-btn secondary" onClick={handleResetForm} style={{ fontSize: '12px', padding: '8px 16px' }}>
                                <i className="fa-solid fa-rotate-left"></i> Reset Defaults
                            </button>
                            <button className="action-button-btn" onClick={handleSubmitForm} style={{ fontSize: '12px', padding: '8px 16px' }}>
                                <i className="fa-solid fa-save"></i> Submit EHR Record
                            </button>
                        </div>
                    </div>

                    {/* Patient Biosignature progress metrics */}
                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <div className="card-title-bar" style={{ marginBottom: '15px' }}>
                            <h3 style={{ fontSize: '14px', color: '#fff' }}><i className="fa-solid fa-chart-line"></i> Dynamic Biosignature Metrics</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Spectra bars */}
                            {liveReport?.spectra.map(spec => (
                                <div key={spec.id} className="metric-bar-group">
                                    <div className="metric-bar-header">
                                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                                            <i className={`fa-solid ${spec.icon}`} style={{ marginRight: '6px', color: spec.color }}></i>{spec.name}
                                        </span>
                                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{spec.score.toFixed(2)} / 4.0 ({spec.elevation}%)</span>
                                    </div>
                                    <div className="metric-bar-bg">
                                        <div 
                                            className="metric-bar-fill" 
                                            style={{ width: `${spec.elevation}%`, backgroundColor: spec.color }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            
                            <hr style={{ border: 'none', borderBottom: '1px solid var(--color-border)', margin: '5px 0' }} />

                            {/* Secondary bars */}
                            {liveReport?.secondary.map(sec => (
                                <div key={sec.id} className="metric-bar-group">
                                    <div className="metric-bar-header">
                                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                                            <i className={`fa-solid ${sec.icon}`} style={{ marginRight: '6px', color: sec.color }}></i>{sec.name}
                                        </span>
                                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{sec.score.toFixed(2)} / 4.0 ({sec.elevation}%)</span>
                                    </div>
                                    <div className="metric-bar-bg">
                                        <div 
                                            className="metric-bar-fill" 
                                            style={{ width: `${sec.elevation}%`, backgroundColor: sec.color }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Interactive SVG Hierarchy & Database Sandbox */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* SVG Graphic Ontology Hierarchy */}
                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ fontSize: '14px', color: '#fff' }}><i className="fa-solid fa-diagram-project"></i> Interactive Ontology Graph</h3>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Click node to inspect</span>
                        </div>

                        <div className="svg-viewport" style={{ position: 'relative' }}>
                            <svg viewBox="0 0 800 400" width="100%" height="400" style={{ display: 'block' }}>
                                {/* Defs for glow effects */}
                                <defs>
                                    <filter id="glow-pfactor" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="5" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>

                                {/* Connecting Bezier Curves */}
                                {svgContent?.paths}

                                {/* Patient Node */}
                                {svgContent?.patientNode && (
                                    <g 
                                        className="svg-node" 
                                        onClick={() => setSelectedNodeId('patient')}
                                    >
                                        <circle 
                                            cx={svgContent.patientNode.x} 
                                            cy={svgContent.patientNode.y} 
                                            r="30" 
                                            fill="#1e293b" 
                                            stroke={selectedNodeId === 'patient' ? "var(--color-primary)" : "var(--color-border)"} 
                                            strokeWidth="2"
                                        />
                                        <text x={svgContent.patientNode.x} y={svgContent.patientNode.y + 4} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
                                            {activePatient?.name ? activePatient.name.split(' ')[0] : ''}
                                        </text>
                                        <text x={svgContent.patientNode.x} y={svgContent.patientNode.y + 15} textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">
                                            EHR Root
                                        </text>
                                    </g>
                                )}

                                {/* p-Factor Node */}
                                {svgContent?.pFactorNode && (
                                    <g 
                                        className="svg-node" 
                                        onClick={() => setSelectedNodeId('pfactor')}
                                    >
                                        <circle 
                                            cx={svgContent.pFactorNode.x} 
                                            cy={svgContent.pFactorNode.y} 
                                            r="35" 
                                            fill="#0f172a" 
                                            stroke={selectedNodeId === 'pfactor' ? "var(--color-primary)" : "rgba(255,255,255,0.15)"} 
                                            strokeWidth={selectedNodeId === 'pfactor' ? "3" : "1.5"}
                                            style={{ filter: isPFactorElevated ? "url(#glow-pfactor)" : "none" }}
                                        />
                                        <text x={svgContent.pFactorNode.x} y={svgContent.pFactorNode.y - 2} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
                                            p-Factor
                                        </text>
                                        <text x={svgContent.pFactorNode.x} y={svgContent.pFactorNode.y + 10} textAnchor="middle" fill="var(--color-primary)" fontSize="10" fontWeight="800">
                                            {liveReport?.secondary?.find(s => s.id === 'p_factor')?.score.toFixed(2)}
                                        </text>
                                    </g>
                                )}

                                {/* Spectra Nodes */}
                                {svgContent?.spectraNodes.map(node => {
                                    const specScore = liveReport.spectra.find(s => s.id === node.id)?.score || 1.0;
                                    const isElevated = specScore >= 2.5;
                                    const isActive = selectedNodeId === node.id;
                                    return (
                                        <g 
                                            key={node.id} 
                                            className="svg-node"
                                            onClick={() => setSelectedNodeId(node.id)}
                                        >
                                            <rect 
                                                x={node.x - 70} 
                                                y={node.y - 18} 
                                                width="140" 
                                                height="36" 
                                                rx="6" 
                                                fill={isActive ? "rgba(255,255,255,0.03)" : "#0f172a"}
                                                stroke={isActive ? "var(--color-primary)" : isElevated ? node.color : "var(--color-border)"}
                                                strokeWidth={isActive ? "2.5" : isElevated ? "2" : "1"}
                                            />
                                            <text x={node.x} y={node.y - 2} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="500">
                                                {node.label}
                                            </text>
                                            <text x={node.x} y={node.y + 11} textAnchor="middle" fill={isElevated ? node.color : "var(--color-text-muted)"} fontSize="9" fontWeight="700">
                                                {specScore.toFixed(2)}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Subfactor / Syndrome Nodes */}
                                {svgContent?.subNodes.map(node => {
                                    const isActive = selectedNodeId === node.id;
                                    return (
                                        <g 
                                            key={node.id} 
                                            className="svg-node"
                                            onClick={() => setSelectedNodeId(node.id)}
                                        >
                                            <circle 
                                                cx={node.x} 
                                                cy={node.y} 
                                                r="16" 
                                                fill="#1e293b" 
                                                stroke={isActive ? "var(--color-primary)" : node.color} 
                                                strokeWidth={isActive ? "2" : "1.2"}
                                            />
                                            <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">
                                                {node.label.substring(0, 4)}..
                                            </text>
                                            <text x={node.x} y={node.y - 20} textAnchor="middle" fill="var(--color-text-secondary)" fontSize="9">
                                                {node.label}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* Interactive Node Info Panel */}
                        <div style={{ marginTop: '15px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '13px', color: '#fff' }}>{activeNodeDetails.title}</strong>
                                <span style={{ fontSize: '9px', background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                    {activeNodeDetails.type}
                                </span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4', margin: '0 0 8px 0' }}>
                                {activeNodeDetails.def}
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--color-accent)', fontStyle: 'italic', margin: 0 }}>
                                <i className="fa-solid fa-lightbulb"></i> Clinical Consideration: {activeNodeDetails.clinicalNote}
                            </p>
                        </div>
                    </div>

                    {/* RDF Turtle & Neo4j Cypher Database Sandbox */}
                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ fontSize: '14px', color: '#fff' }}><i className="fa-solid fa-database"></i> Semantic & Graph Database Sandbox</h3>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                    className={`patient-filter-chip ${sandboxTab === 'rdf' ? 'active' : ''}`}
                                    onClick={() => setSandboxTab('rdf')}
                                    style={{ padding: '3px 8px', fontSize: '10px' }}
                                >
                                    Apache Jena RDF
                                </button>
                                <button 
                                    className={`patient-filter-chip ${sandboxTab === 'cypher' ? 'active' : ''}`}
                                    onClick={() => setSandboxTab('cypher')}
                                    style={{ padding: '3px 8px', fontSize: '10px' }}
                                >
                                    Neo4j Cypher
                                </button>
                            </div>
                        </div>

                        {sandboxTab === 'rdf' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>RDF Turtle Format (.ttl)</span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button className="action-button-btn secondary" onClick={handleGenerateRDF} style={{ fontSize: '10px', padding: '4px 10px' }}>
                                            Compile Triples
                                        </button>
                                        <button className="action-button-btn" onClick={handleDownloadRDF} disabled={!rdfLog} style={{ fontSize: '10px', padding: '4px 10px' }}>
                                            Download .ttl File
                                        </button>
                                    </div>
                                </div>
                                <div className="query-console-block">
                                    {rdfLog || `# Click 'Compile Triples' to generate RDF mapping for patient ${activePatient?.name || ''}.`}
                                </div>

                                {/* SPARQL Simulator block */}
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '5px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}><i className="fa-solid fa-terminal"></i> SPARQL Simulation Engine</span>
                                        <button className="action-button-btn" onClick={handleRunSparql} disabled={isSimulatingSparql} style={{ fontSize: '10px', padding: '4px 10px' }}>
                                            {isSimulatingSparql ? "Running SPARQL..." : "Execute SPARQL Query"}
                                        </button>
                                    </div>
                                    <textarea
                                        value={sparqlQuery}
                                        onChange={(e) => setSparqlQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '90px',
                                            background: 'rgba(0,0,0,0.4)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '6px',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '11px',
                                            color: '#e2e8f0',
                                            padding: '8px',
                                            outline: 'none',
                                            resize: 'none'
                                        }}
                                    />
                                    {sparqlResults && (
                                        <div style={{ marginTop: '8px', background: 'rgba(0,242,254,0.02)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '5px' }}>Query Result Bindings:</div>
                                            <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>
                                                        <th style={{ textAlign: 'left', padding: '4px' }}>?patientName</th>
                                                        <th style={{ textAlign: 'left', padding: '4px' }}>?spectrumName</th>
                                                        <th style={{ textAlign: 'left', padding: '4px' }}>?score</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sparqlResults.map((row, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                            <td style={{ padding: '4px', color: '#fff' }}>{row.patientName}</td>
                                                            <td style={{ padding: '4px', color: 'var(--color-primary)' }}>{row.spectrumName}</td>
                                                            <td style={{ padding: '4px', color: 'var(--color-accent)' }}>{row.score}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Cypher Graph Statement Simulator</span>
                                    <button className="action-button-btn" onClick={handleGenerateCypher} style={{ fontSize: '10px', padding: '4px 10px' }}>
                                        Compile Cypher Script
                                    </button>
                                </div>
                                <div className="query-console-block" style={{ color: '#10b981' }}>
                                    {cypherLog || `// Click 'Compile Cypher Script' to generate Neo4j schema definitions for patient ${activePatient?.name || ''}.`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
