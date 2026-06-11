import { useState, useEffect, useMemo, useRef } from 'react';
import { Database } from '../../services/db';
import { RdocService, RDOC_MATRIX } from '../../services/rdocService';
import { useToast } from '../ToastProvider';

export function RdocMatrixExplorer({ patients, activePatientId, onSetActivePatientId }) {
    const { showToast } = useToast();
    
    // Active states
    const [selectedDomainId, setSelectedDomainId] = useState('negative_valence');
    const [selectedConstructId, setSelectedConstructId] = useState('loss');
    const [activeUnitTab, setActiveUnitTab] = useState('circuits'); // 'circuits', 'physiology', 'behavior', 'selfReports', 'paradigms'
    const [rdfLog, setRdfLog] = useState('');
    const [cypherLog, setCypherLog] = useState('');
    const [activeTabPanel, setActiveTabPanel] = useState('matrix'); // 'matrix', 'sparql', 'cypher'
    
    // SVG Graph states
    const [clickedNode, setClickedNode] = useState(null);
    const svgRef = useRef(null);

    // Get active patient details
    const activePatient = patients.find(p => p.id === Number(activePatientId)) || patients[0];
    
    // Calculate RDoC Mapping for patient
    const rdocMapping = useMemo(() => {
        if (!activePatient) return null;
        return RdocService.mapPatientToRdoc(activePatient.id);
    }, [activePatient]);

    // Update selected construct if domain changes to ensure we show a valid construct
    useEffect(() => {
        const domain = RDOC_MATRIX.domains.find(d => d.id === selectedDomainId);
        if (domain && domain.constructs.length > 0) {
            // Try to find a construct in this domain that is elevated for the patient, otherwise default to first
            const elevatedInDomain = rdocMapping?.activeConstructs.find(ac => ac.domainName === domain.name);
            if (elevatedInDomain) {
                setSelectedConstructId(elevatedInDomain.id);
            } else {
                setSelectedConstructId(domain.constructs[0].id);
            }
        }
    }, [selectedDomainId, rdocMapping]);

    const activeDomain = useMemo(() => {
        return RDOC_MATRIX.domains.find(d => d.id === selectedDomainId);
    }, [selectedDomainId]);

    const activeConstruct = useMemo(() => {
        if (!activeDomain) return null;
        return activeDomain.constructs.find(c => c.id === selectedConstructId) || activeDomain.constructs[0];
    }, [activeDomain, selectedConstructId]);

    // Handle RDF Serialization
    const handleGenerateRDF = () => {
        if (!rdocMapping) return;
        const triples = RdocService.getRdocOntologyTriples(rdocMapping);
        setRdfLog(triples);
        showToast("RDoC Triple graph serialized successfully.", "success");
    };

    // Download RDF Turtle file
    const handleDownloadRDF = () => {
        if (!rdfLog) {
            showToast("Generate triples first.", "warning");
            return;
        }
        const blob = new Blob([rdfLog], { type: 'text/turtle' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rdoc_mapping_patient_${activePatient.id}_${Date.now()}.ttl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Database.logAudit("Exported RDoC RDF", `Downloaded RDF/Turtle file for Patient ID ${activePatient.id}`);
        showToast("Turtle RDF file downloaded successfully.", "success");
    };

    // Handle Cypher Query simulation
    const handleGenerateCypher = () => {
        if (!activePatient || !rdocMapping) return;
        const patientName = activePatient.name;
        
        let cypher = `// 1. Create Patient Node\nCREATE (p:Patient {id: ${activePatient.id}, name: "${patientName}", age: ${activePatient.age}, gender: "${activePatient.gender}"})\n`;
        cypher += `CREATE (d:Disorder {name: "${activePatient.specialty || 'Psychiatric Condition'}"})\n`;
        cypher += `CREATE (p)-[:DIAGNOSED_WITH]->(d)\n\n// 2. Map elevated RDoC constructs & Biological circuits\n`;
        
        rdocMapping.activeConstructs.forEach(ac => {
            const cleanConstruct = ac.id.toUpperCase();
            cypher += `CREATE (c_${ac.id}:RdocConstruct {id: "${ac.id}", name: "${ac.name}"})\n`;
            cypher += `CREATE (p)-[:ELEVATED_DYSREGULATION {score: ${ac.score}}]->(c_${ac.id})\n`;
            
            const constructDetail = RDOC_MATRIX.domains.flatMap(d => d.constructs).find(c => c.id === ac.id);
            if (constructDetail) {
                const circuits = constructDetail.units.circuits.split(',').map(s => s.trim());
                circuits.slice(0, 2).forEach((circ, index) => {
                    const cleanCirc = circ.replace(/[^a-zA-Z0-9]/g, '_');
                    cypher += `CREATE (circ_${cleanCirc}:BrainCircuit {name: "${circ}"})\n`;
                    cypher += `CREATE (c_${ac.id})-[:MEDIATED_BY_CIRCUIT]->(circ_${cleanCirc})\n`;
                });
            }
        });
        
        setCypherLog(cypher);
        showToast("RDoC Cypher Graph statements compiled successfully.", "success");
    };

    // Build the dynamic SVG Graph nodes and edges based on the selected patient
    const graphData = useMemo(() => {
        if (!activePatient || !rdocMapping) return { nodes: [], links: [] };

        const nodes = [];
        const links = [];

        // Center Patient Node
        nodes.push({ id: 'p', label: activePatient.name, type: 'patient', x: 70, y: 150, info: `Patient Context (ID: ${activePatient.id})` });

        // Category/Diagnosis Node
        nodes.push({ id: 'diag', label: activePatient.specialty || 'MDD', type: 'disorder', x: 220, y: 150, info: `DSM-5 / ICD-10 Category` });
        links.push({ source: 'p', target: 'diag', label: 'has_diagnosis' });

        // Generate symptom nodes based on patient mapping
        const mappedSymptoms = rdocMapping.symptoms.slice(0, 3);
        mappedSymptoms.forEach((sym, idx) => {
            const symId = `sym_${idx}`;
            const yPos = 60 + idx * 90;
            nodes.push({ 
                id: symId, 
                label: sym.replace(/_/g, ' '), 
                type: 'symptom', 
                x: 380, 
                y: yPos, 
                info: `Symptom extracted from EHR intake` 
            });
            links.push({ source: 'diag', target: symId, label: 'manifested_by' });

            // Connect symptom to corresponding active RDoC Construct
            if (idx === 0) {
                // Connect first symptom to first active RDoC construct
                const firstAc = rdocMapping.activeConstructs[0];
                if (firstAc) {
                    const constructId = `const_0`;
                    nodes.push({ 
                        id: constructId, 
                        label: firstAc.name, 
                        type: 'construct', 
                        x: 530, 
                        y: 70, 
                        color: firstAc.color,
                        info: `RDoC Construct (Elevation: ${firstAc.score}%)` 
                    });
                    links.push({ source: symId, target: constructId, label: 'maps_to' });

                    // Add a circuit node
                    nodes.push({
                        id: 'circ_0',
                        label: 'sgACC / Ventral Striatum',
                        type: 'circuit',
                        x: 680,
                        y: 70,
                        info: 'Biological circuitry target for treatment pacing'
                    });
                    links.push({ source: constructId, target: 'circ_0', label: 'mediated_by' });
                }
            } else if (idx === 1) {
                const secondAc = rdocMapping.activeConstructs[1] || rdocMapping.activeConstructs[0];
                if (secondAc) {
                    const constructId = `const_1`;
                    nodes.push({ 
                        id: constructId, 
                        label: secondAc.name, 
                        type: 'construct', 
                        x: 530, 
                        y: 150, 
                        color: secondAc.color,
                        info: `RDoC Construct (Elevation: ${secondAc.score}%)` 
                    });
                    links.push({ source: symId, target: constructId, label: 'maps_to' });

                    nodes.push({
                        id: 'circ_1',
                        label: 'BNST / Locus Coeruleus',
                        type: 'circuit',
                        x: 680,
                        y: 150,
                        info: 'Circuits modulating chronic threat response'
                    });
                    links.push({ source: constructId, target: 'circ_1', label: 'mediated_by' });
                }
            } else {
                const thirdAc = rdocMapping.activeConstructs[2] || rdocMapping.activeConstructs[0];
                if (thirdAc) {
                    const constructId = `const_2`;
                    nodes.push({ 
                        id: constructId, 
                        label: thirdAc.name, 
                        type: 'construct', 
                        x: 530, 
                        y: 230, 
                        color: thirdAc.color,
                        info: `RDoC Construct (Elevation: ${thirdAc.score}%)` 
                    });
                    links.push({ source: symId, target: constructId, label: 'maps_to' });

                    nodes.push({
                        id: 'circ_2',
                        label: 'Amgydala / Insula',
                        type: 'circuit',
                        x: 680,
                        y: 230,
                        info: 'Brain networks regulating visceral somatic arousal'
                    });
                    links.push({ source: constructId, target: 'circ_2', label: 'mediated_by' });
                }
            }
        });

        return { nodes, links };
    }, [activePatient, rdocMapping]);

    const activeNodeDetails = useMemo(() => {
        if (!clickedNode) return null;
        return graphData.nodes.find(n => n.id === clickedNode);
    }, [clickedNode, graphData]);

    return (
        <div className="screen-container active" id="screen-rdoc-matrix" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{`
                .rdoc-main-grid {
                    display: grid;
                    grid-template-columns: 1.4fr 1fr;
                    gap: 20px;
                }
                @media (max-width: 1024px) {
                    .rdoc-main-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .rdoc-domains-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-bottom: 15px;
                }
                @media (max-width: 640px) {
                    .rdoc-domains-row {
                        grid-template-columns: 1fr;
                    }
                }
                .rdoc-domain-card {
                    padding: 12px 16px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--color-border);
                    background: rgba(255,255,255,0.01);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s ease;
                }
                .rdoc-domain-card:hover {
                    background: rgba(255,255,255,0.03);
                    border-color: rgba(255,255,255,0.15);
                }
                .rdoc-domain-card.active {
                    background: rgba(255, 255, 255, 0.02);
                    box-shadow: 0 0 10px rgba(6, 182, 212, 0.05);
                }
                .constructs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                .construct-btn {
                    padding: 10px 14px;
                    background: transparent;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-sm);
                    color: var(--color-text-secondary);
                    font-size: 13px;
                    font-weight: 500;
                    text-align: left;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s ease;
                }
                .construct-btn:hover {
                    color: var(--color-text-primary);
                    border-color: rgba(255,255,255,0.2);
                    background: rgba(255,255,255,0.01);
                }
                .construct-btn.active {
                    color: #fff;
                    background: rgba(255,255,255,0.03);
                    border-color: var(--color-primary);
                }
                .unit-tab-row {
                    display: flex;
                    gap: 4px;
                    background: rgba(0,0,0,0.2);
                    padding: 4px;
                    border-radius: var(--radius-sm);
                    overflow-x: auto;
                }
                .unit-tab-btn {
                    flex: 1;
                    padding: 6px 12px;
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
                .unit-tab-btn:hover {
                    color: var(--color-text-primary);
                }
                .unit-tab-btn.active {
                    background: var(--color-primary);
                    color: #fff;
                }
                .biosignature-progress-bar {
                    height: 8px;
                    background: rgba(255,255,255,0.06);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .biosignature-progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.4s ease;
                }
                .svg-graph-container {
                    background: radial-gradient(circle, #0e1726 0%, #030712 100%);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    position: relative;
                }
                .svg-node {
                    cursor: pointer;
                    transition: filter 0.2s ease;
                }
                .svg-node:hover {
                    filter: brightness(1.2) drop-shadow(0 0 4px rgba(255,255,255,0.2));
                }
                .svg-node.active {
                    stroke: #fff !important;
                    stroke-width: 2.5px !important;
                    filter: brightness(1.3) drop-shadow(0 0 6px var(--color-primary));
                }
                .svg-link {
                    stroke-dasharray: 4;
                    animation: dashMovement 20s linear infinite;
                }
                @keyframes dashMovement {
                    to { stroke-dashoffset: -40; }
                }
                .tab-nav-panel {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 14px;
                    border-bottom: 1px solid var(--color-border);
                    padding-bottom: 8px;
                }
                .tab-nav-btn {
                    background: transparent;
                    border: none;
                    color: var(--color-text-secondary);
                    font-size: 12px;
                    font-weight: 600;
                    padding: 6px 12px;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s ease;
                }
                .tab-nav-btn:hover {
                    color: var(--color-text-primary);
                }
                .tab-nav-btn.active {
                    color: var(--color-primary);
                    border-color: var(--color-primary);
                }
            `}</style>

            {/* Header Block */}
            <div className="section-header-block">
                <i className="fa-solid fa-dna" style={{ color: 'var(--color-primary)' }}></i>
                <h2>Research Domain Criteria (RDoC) Workspace</h2>
            </div>

            {/* Patient Context sync */}
            <div className="workspace-card" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mapped Patient:</span>
                    <strong style={{ color: 'var(--color-primary)' }}>{activePatient ? activePatient.name : 'No patient selected'}</strong>
                    <span className="marketplace-tag" style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--color-primary)', fontSize: '10px' }}>
                        {activePatient?.specialty || 'General'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {patients.map(p => (
                        <button 
                            key={p.id} 
                            onClick={() => onSetActivePatientId(p.id)}
                            style={{ 
                                padding: '4px 10px', 
                                fontSize: '11px', 
                                border: '1px solid',
                                borderColor: activePatientId === p.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                                background: activePatientId === p.id ? 'var(--color-primary-glow)' : 'transparent',
                                color: activePatientId === p.id ? 'var(--color-primary)' : 'var(--text-normal)',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            {p.name.split(' ')[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Panel Content */}
            <div className="rdoc-main-grid">
                
                {/* LEFT COLUMN: MATRIX & CONSTRUCT EXPLORER */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-table" style={{ color: 'var(--color-primary)' }}></i>
                            Interactive RDoC Matrix Explorer
                        </h3>

                        {/* Domain rows selection */}
                        <div className="rdoc-domains-row">
                            {RDOC_MATRIX.domains.map(d => {
                                const isActive = selectedDomainId === d.id;
                                const patientDomainScore = rdocMapping?.domainScores.find(ds => ds.id === d.id)?.score || 0;
                                return (
                                    <div 
                                        key={d.id}
                                        className={`rdoc-domain-card ${isActive ? 'active' : ''}`}
                                        onClick={() => setSelectedDomainId(d.id)}
                                        style={{ borderColor: isActive ? d.color : 'var(--color-border)' }}
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: `${d.color}15`,
                                            color: d.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <i className={`fa-solid ${d.icon}`}></i>
                                        </div>
                                        <div style={{ minWidth: 0, flexGrow: 1 }}>
                                            <span style={{ fontSize: '11px', display: 'block', fontWeight: 'bold', color: isActive ? '#fff' : 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {d.name}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                Elevation: {patientDomainScore}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Selected Domain Constructs */}
                        {activeDomain && (
                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '13px', color: activeDomain.color }}>{activeDomain.name} Constructs</h4>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{activeDomain.description}</p>
                                </div>

                                <div className="constructs-list">
                                    {activeDomain.constructs.map(c => {
                                        const isSelected = selectedConstructId === c.id;
                                        const elevated = rdocMapping?.activeConstructs.find(ac => ac.id === c.id);
                                        return (
                                            <button 
                                                key={c.id}
                                                className={`construct-btn ${isSelected ? 'active' : ''}`}
                                                onClick={() => setSelectedConstructId(c.id)}
                                                style={{ borderColor: isSelected ? activeDomain.color : 'var(--color-border)' }}
                                            >
                                                <span>{c.name}</span>
                                                {elevated ? (
                                                    <span className="marketplace-tag" style={{ background: `${activeDomain.color}20`, color: activeDomain.color, fontSize: '9px', margin: 0 }}>
                                                        Elevated ({elevated.score}%)
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Uncharged</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Active Construct Multi-Dimensional detail */}
                                {activeConstruct && (
                                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong style={{ fontSize: '12px', color: '#fff' }}>{activeConstruct.name}</strong>
                                            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{activeConstruct.description}</p>
                                        </div>

                                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Units of Analysis Mapping:</label>
                                        <div className="unit-tab-row" style={{ marginTop: '6px', marginBottom: '10px' }}>
                                            <button className={`unit-tab-btn ${activeUnitTab === 'circuits' ? 'active' : ''}`} onClick={() => setActiveUnitTab('circuits')}>Circuits</button>
                                            <button className={`unit-tab-btn ${activeUnitTab === 'physiology' ? 'active' : ''}`} onClick={() => setActiveUnitTab('physiology')}>Physiology</button>
                                            <button className={`unit-tab-btn ${activeUnitTab === 'behavior' ? 'active' : ''}`} onClick={() => setActiveUnitTab('behavior')}>Behavior</button>
                                            <button className={`unit-tab-btn ${activeUnitTab === 'selfReports' ? 'active' : ''}`} onClick={() => setActiveUnitTab('selfReports')}>Self-Reports</button>
                                            <button className={`unit-tab-btn ${activeUnitTab === 'paradigms' ? 'active' : ''}`} onClick={() => setActiveUnitTab('paradigms')}>Paradigms</button>
                                        </div>

                                        <div style={{ background: '#09090b', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                                                {activeConstruct.units[activeUnitTab]}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SEMANTIC GRAPH INTEGRATION SANDBOX */}
                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <div className="tab-nav-panel">
                            <button className={`tab-nav-btn ${activeTabPanel === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTabPanel('matrix')}>RDF Triples Export</button>
                            <button className={`tab-nav-btn ${activeTabPanel === 'cypher' ? 'active' : ''}`} onClick={() => setActiveTabPanel('cypher')}>Neo4j Cypher Seed</button>
                        </div>

                        {activeTabPanel === 'matrix' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                                    Generate RDF triples linking patient clinical indicators to the official NIMH RDoC schema. Ready for ingest into an Apache Jena triple store.
                                </p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="action-button-btn secondary" style={{ flex: 1, fontSize: '11px' }} onClick={handleGenerateRDF}>
                                        <i className="fa-solid fa-code" style={{ marginRight: '6px' }}></i> Generate RDF Triples
                                    </button>
                                    <button className="action-button-btn secondary" style={{ flex: 1, fontSize: '11px' }} onClick={handleDownloadRDF} disabled={!rdfLog}>
                                        <i className="fa-solid fa-download" style={{ marginRight: '6px' }}></i> Download .ttl File
                                    </button>
                                </div>
                                <textarea
                                    className="input-text-field"
                                    value={rdfLog}
                                    readOnly
                                    placeholder="Click Generate RDF Triples to serialize patient data..."
                                    style={{ height: '120px', fontFamily: 'monospace', fontSize: '10px' }}
                                />
                            </div>
                        )}

                        {activeTabPanel === 'cypher' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                                    Compile Cypher graph database scripts to define nodes for patient, DSM diagnosis, elevated constructs, and biological loops inside Neo4j.
                                </p>
                                <button className="action-button-btn secondary" style={{ width: '100%', fontSize: '11px' }} onClick={handleGenerateCypher}>
                                    <i className="fa-solid fa-database" style={{ marginRight: '6px' }}></i> Generate Cypher Statements
                                </button>
                                <textarea
                                    className="input-text-field"
                                    value={cypherLog}
                                    readOnly
                                    placeholder="Click Generate Cypher Statements to output graph queries..."
                                    style={{ height: '120px', fontFamily: 'monospace', fontSize: '10px' }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: DIMENSIONAL BIOSIGNATURE & SVG GRAPH */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* DIMENSIONAL BIOSIGNATURE CARD */}
                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-gauge-high" style={{ color: 'var(--color-primary)' }}></i>
                            Patient Dimensional Biosignature
                        </h3>

                        {/* RDoC Domain Elevation Sliders */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                            {rdocMapping?.domainScores.map(ds => (
                                <div key={ds.id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: '600', color: '#fff' }}>{ds.name}</span>
                                        <span style={{ color: ds.color, fontWeight: 'bold' }}>{ds.score}%</span>
                                    </div>
                                    <div className="biosignature-progress-bar">
                                        <div 
                                            className="biosignature-progress-fill" 
                                            style={{ width: `${ds.score}%`, backgroundColor: ds.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recommendations block */}
                        <div>
                            <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                Biosignature RDoC Recommendations:
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {rdocMapping?.recommendations.length === 0 ? (
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '10px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                                        No high construct elevations. Standby for standard evaluation protocols.
                                    </div>
                                ) : (
                                    rdocMapping?.recommendations.map((rec, i) => (
                                        <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <strong style={{ fontSize: '11px', color: 'var(--color-primary)' }}>{rec.name}</strong>
                                                <span className="marketplace-tag" style={{ fontSize: '9px', padding: '2px 4px', margin: 0 }}>{rec.type}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                                                {rec.text}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* INTERACTIVE ONTOLOGY KNOWLEDGE GRAPH */}
                    <div className="workspace-card" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-circle-nodes" style={{ color: 'var(--color-primary)' }}></i>
                            SVG RDoC Ontology Graph
                        </h3>

                        <div className="svg-graph-container">
                            <svg ref={svgRef} width="100%" height="300" style={{ display: 'block' }}>
                                {/* Connections */}
                                {graphData.links.map((link, idx) => {
                                    const sourceNode = graphData.nodes.find(n => n.id === link.source);
                                    const targetNode = graphData.nodes.find(n => n.id === link.target);
                                    if (!sourceNode || !targetNode) return null;
                                    
                                    const isHighlighted = clickedNode === link.source || clickedNode === link.target;
                                    return (
                                        <g key={idx}>
                                            <line
                                                x1={sourceNode.x}
                                                y1={sourceNode.y}
                                                x2={targetNode.x}
                                                y2={targetNode.y}
                                                stroke={isHighlighted ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'}
                                                strokeWidth={isHighlighted ? 1.5 : 1}
                                                className={isHighlighted ? 'svg-link' : ''}
                                            />
                                            {isHighlighted && (
                                                <text
                                                    x={(sourceNode.x + targetNode.x) / 2}
                                                    y={(sourceNode.y + targetNode.y) / 2 - 5}
                                                    fill="var(--color-primary)"
                                                    fontSize="8"
                                                    fontFamily="var(--font-mono)"
                                                    textAnchor="middle"
                                                >
                                                    {link.label}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}

                                {/* Nodes */}
                                {graphData.nodes.map(node => {
                                    const isSelected = clickedNode === node.id;
                                    
                                    // Set color based on node type
                                    let fill = '#1e293b';
                                    let stroke = 'rgba(255,255,255,0.2)';
                                    if (node.type === 'patient') {
                                        fill = 'var(--color-primary-container)';
                                        stroke = 'var(--color-primary)';
                                    } else if (node.type === 'disorder') {
                                        fill = 'rgba(245, 158, 11, 0.1)';
                                        stroke = 'var(--color-accent)';
                                    } else if (node.type === 'symptom') {
                                        fill = 'rgba(239, 68, 68, 0.1)';
                                        stroke = 'var(--color-error)';
                                    } else if (node.type === 'construct') {
                                        fill = `${node.color || 'var(--color-secondary)'}15`;
                                        stroke = node.color || 'var(--color-secondary)';
                                    } else if (node.type === 'circuit') {
                                        fill = 'rgba(168, 85, 247, 0.1)';
                                        stroke = '#a855f7';
                                    }

                                    return (
                                        <g 
                                            key={node.id} 
                                            transform={`translate(${node.x}, ${node.y})`}
                                            className={`svg-node ${isSelected ? 'active' : ''}`}
                                            onClick={() => setClickedNode(clickedNode === node.id ? null : node.id)}
                                        >
                                            <rect
                                                x="-45"
                                                y="-16"
                                                width="90"
                                                height="32"
                                                rx="6"
                                                fill={fill}
                                                stroke={stroke}
                                                strokeWidth="1.2"
                                            />
                                            <text
                                                fill="#fff"
                                                fontSize="9"
                                                fontWeight="600"
                                                textAnchor="middle"
                                                y="-2"
                                            >
                                                {node.label.length > 15 ? node.label.substring(0, 13) + '..' : node.label}
                                            </text>
                                            <text
                                                fill="var(--color-text-muted)"
                                                fontSize="7.5"
                                                textAnchor="middle"
                                                y="9"
                                                textTransform="uppercase"
                                            >
                                                {node.type}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                            
                            {/* Selected Graph Node Details */}
                            <div style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--color-border)', padding: '10px 14px', fontSize: '11px', minHeight: '60px' }}>
                                {activeNodeDetails ? (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                            <strong style={{ color: 'var(--color-primary)' }}>{activeNodeDetails.label}</strong>
                                            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{activeNodeDetails.type}</span>
                                        </div>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>{activeNodeDetails.info}</span>
                                    </div>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>Click on any node in the ontology map to inspect its connections.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
