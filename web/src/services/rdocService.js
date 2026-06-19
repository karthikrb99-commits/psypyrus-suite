/**
 * PsyPyrus AI - NIMH Research Domain Criteria (RDoC) Service
 * Implements a dimensional clinical ontology linking patient symptoms, 
 * assessment scores, and biological systems to RDoC domains/constructs.
 */

import { Database } from './db';

// 1. Static RDoC Matrix Definition (6 Domains & their constructs + 5 relevant Units of Analysis)
export const RDOC_MATRIX = {
    domains: [
        {
            id: 'negative_valence',
            name: 'Negative Valence Systems',
            description: 'Systems responsible for responses to aversive situations or contexts.',
            icon: 'fa-triangle-exclamation',
            color: '#f43f5e', // Rose
            constructs: [
                {
                    id: 'acute_threat',
                    name: 'Acute Threat (Fear)',
                    description: 'Activation of brain systems to promote defense against immediate danger.',
                    units: {
                        circuits: 'Amygdala, Anterior Cingulate Cortex (ACC), Medial PFC, Periaqueductal Gray (PAG)',
                        physiology: 'Elevated skin conductance, accelerated heart rate, muscle tension, pupil dilation',
                        behavior: 'Fight-or-flight behaviors, escape, active avoidance, defensive freezing',
                        selfReports: 'Subjective panic rating, fear intensity questionnaires, GAD-7 item 4',
                        paradigms: 'Pavlovian fear conditioning, threat appraisal tasks'
                    }
                },
                {
                    id: 'potential_threat',
                    name: 'Potential Threat (Anxiety)',
                    description: 'Brain systems activated under conditions of uncertainty or potential danger.',
                    units: {
                        circuits: 'Bed Nucleus of the Stria Terminalis (BNST), Amygdala, Insula, Ventromedial PFC',
                        physiology: 'Elevated baseline heart rate, altered Heart Rate Variability (HRV), cortisol elevation',
                        behavior: 'Hypervigilance, risk assessment, passive avoidance, threat vigilance scanning',
                        selfReports: 'GAD-7, State-Trait Anxiety Inventory (STAI), worry diaries',
                        paradigms: 'Threat uncertainty tasks, startle potentiation paradigms'
                    }
                },
                {
                    id: 'sustained_threat',
                    name: 'Sustained Threat',
                    description: 'State of prolonged exposure to internal or external aversive conditions.',
                    units: {
                        circuits: 'Hypothalamic-Pituitary-Adrenal (HPA) axis, BNST, Amygdala, Hippocampus',
                        physiology: 'Chronically elevated cortisol, suppressed immune parameters, altered sleep architecture',
                        behavior: 'Chronic avoidance, lethargy, passive coping, safety-seeking actions',
                        selfReports: 'PTSD Checklist (PCL-5), chronic stress inventories',
                        paradigms: 'Social stress tests, prolonged restraint paradigms'
                    }
                },
                {
                    id: 'loss',
                    name: 'Loss',
                    description: 'State of deprivation of a motivationally significant con-specific or object.',
                    units: {
                        circuits: 'Subgenual Anterior Cingulate Cortex (sgACC), Nucleus Accumbens (hypoactive), Amygdala',
                        physiology: 'HPA axis dysregulation, decreased vagal tone, reduced neuroplasticity (BDNF)',
                        behavior: 'Crying, psychomotor retardation, social withdrawal, reduced goal-directed actions',
                        selfReports: 'PHQ-9 (mood, worthlessness items), Beck Depression Inventory (BDI-II)',
                        paradigms: 'Frustrated non-reward trials, emotional stroop with loss cues'
                    }
                },
                {
                    id: 'frustrative_nonreward',
                    name: 'Frustrative Nonreward',
                    description: 'State elicited by inability to obtain expected reward or cessation of expected reward.',
                    units: {
                        circuits: 'Anterior Insula, Dorsal ACC, Orbitofrontal Cortex (OFC), Amygdala',
                        physiology: 'Sympathetic arousal surges, elevated blood pressure spikes',
                        behavior: 'Aggression, emotional outbursts, irritable snapping, impulsive outbursts',
                        selfReports: 'Irritability scales, anger expression questionnaires',
                        paradigms: 'Rigged reward-delay tasks, peer-exclusion paradigms (Cyberball)'
                    }
                }
            ]
        },
        {
            id: 'positive_valence',
            name: 'Positive Valence Systems',
            description: 'Systems responsible for responses to positive motivational situations.',
            icon: 'fa-star',
            color: '#10b981', // Emerald
            constructs: [
                {
                    id: 'reward_responsiveness',
                    name: 'Reward Responsiveness',
                    description: 'Processes that dictate response to anticipation, receipt, and saturation of rewards.',
                    units: {
                        circuits: 'Ventral Striatum (Nucleus Accumbens), Orbitofrontal Cortex, Ventral Tegmental Area (VTA)',
                        physiology: 'Dopaminergic release surges, Event-Related Potential reward positivity (RewP)',
                        behavior: 'Consummatory pleasure, reward seeking, enthusiasm, approach behavior',
                        selfReports: 'Snaith-Hamilton Pleasure Scale (SHAPS - measuring Anhedonia), TEPS scale',
                        paradigms: 'Monetary Incentive Delay (MID) task, reward consumption tasks'
                    }
                },
                {
                    id: 'reward_valuation',
                    name: 'Reward Valuation',
                    description: 'Decision-making processes computing cost-benefit ratios of reward options.',
                    units: {
                        circuits: 'Anterior Cingulate Cortex (ACC), OFC, Basolateral Amygdala, Ventral Striatum',
                        physiology: 'BOLD activation changes corresponding to reward value computation',
                        behavior: 'Willingness to expend physical or cognitive effort to secure positive rewards',
                        selfReports: 'Effort expenditure scales, temporal discounting rate metrics',
                        paradigms: 'Effort-Expenditure for Rewards Task (EEfRT), Temporal Discounting paradigms'
                    }
                },
                {
                    id: 'reward_learning',
                    name: 'Reward Learning',
                    description: 'Modification of behavior in response to rewarding experiences.',
                    units: {
                        circuits: 'Basal Ganglia, VTA, Caudate, Putamen, Medial PFC',
                        physiology: 'Dopaminergic Prediction Error signaling (phasic firing)',
                        behavior: 'Operant conditioning, habit formation, choice adaptation based on reward history',
                        selfReports: 'Learning agility self-evaluations, habit tracker checklists',
                        paradigms: 'Probabilistic Reversal Learning task, multi-armed bandit tasks'
                    }
                }
            ]
        },
        {
            id: 'cognitive_systems',
            name: 'Cognitive Systems',
            description: 'Systems responsible for core mental operations and executive control.',
            icon: 'fa-brain',
            color: '#06b6d4', // Cyan
            constructs: [
                {
                    id: 'attention',
                    name: 'Attention',
                    description: 'Filtering, orienting, and sustaining processing of select environmental inputs.',
                    units: {
                        circuits: 'Dorsolateral PFC, Posterior Parietal Cortex, Pulvinar, Superior Colliculus',
                        physiology: 'EEG Alpha-band suppression, eye-fixation stability metrics',
                        behavior: 'Sustained focus, selective attention, distractibility prevention',
                        selfReports: 'ADHD Self-Report Scale (ASRS) inattention items, mindfulness scores',
                        paradigms: 'Continuous Performance Test (CPT), Flanker Task, Stroop'
                    }
                },
                {
                    id: 'working_memory',
                    name: 'Working Memory',
                    description: 'Active maintenance and flexible updating of limited-capacity information.',
                    units: {
                        circuits: 'DLPFC, Parietal Cortex, Basal Ganglia loops',
                        physiology: 'EEG Theta-Gamma phase-amplitude coupling, Frontoparietal BOLD activation',
                        behavior: 'Mental arithmetic performance, following complex multi-step rules, item recall',
                        selfReports: 'Working memory deficit checklists, forgetfulness ratings',
                        paradigms: 'N-Back tasks, Digit Span tests, Spatial Working Memory tasks'
                    }
                },
                {
                    id: 'cognitive_control',
                    name: 'Cognitive Control',
                    description: 'Performance monitoring, goal maintenance, and response selection.',
                    units: {
                        circuits: 'dACC, Pre-Supplementary Motor Area (pre-SMA), Bilateral DLPFC',
                        physiology: 'Error-Related Negativity (ERN) on EEG, fronto-striatal signaling',
                        behavior: 'Response inhibition, task switching efficiency, error correction',
                        selfReports: 'Executive dysfunction inventories, impulsivity scales',
                        paradigms: 'Go/No-Go task, Stop-Signal Task (SST), Wisconsin Card Sorting Test'
                    }
                }
            ]
        },
        {
            id: 'social_processes',
            name: 'Systems for Social Processes',
            description: 'Systems mediating responses to interpersonal settings and communications.',
            icon: 'fa-users',
            color: '#a855f7', // Purple
            constructs: [
                {
                    id: 'social_communication',
                    name: 'Social Communication',
                    description: 'Parsing and producing facial and non-facial communication gestures.',
                    units: {
                        circuits: 'Fusiform Face Area (FFA), Superior Temporal Sulcus (STS), Amygdala',
                        physiology: 'Facial EMG responses, eye-tracking patterns on facial features',
                        behavior: 'Accurate reading of facial emotions, eye contact calibration, vocal prosody',
                        selfReports: 'Social responsiveness scale, social communication questionnaires',
                        paradigms: 'Reading the Mind in the Eyes test, dynamic social interaction paradigms'
                    }
                },
                {
                    id: 'perception_others',
                    name: 'Perception and Understanding of Others',
                    description: 'Theory of mind, empathy, and predicting other people\'s actions.',
                    units: {
                        circuits: 'Temporoparietal Junction (TPJ), Medial PFC, Anterior Insula',
                        physiology: 'Mirror neuron system activity, autonomic coupling during empathy tests',
                        behavior: 'Perspective taking, emotional empathy scoring, compassion',
                        selfReports: 'Interpersonal Reactivity Index (IRI), empathy quotient',
                        paradigms: 'Theory of mind animations, empathic accuracy tasks'
                    }
                }
            ]
        },
        {
            id: 'arousal_regulatory',
            name: 'Arousal and Regulatory Systems',
            description: 'Systems generating homeostatic and circadian modulation of energy.',
            icon: 'fa-clock',
            color: '#f59e0b', // Amber
            constructs: [
                {
                    id: 'arousal',
                    name: 'Arousal',
                    description: 'Modulating sensitivity of the organism to sensory inputs and motor responses.',
                    units: {
                        circuits: 'Locus Coeruleus, Orexin neurons, Reticular Activating System (RAS)',
                        physiology: 'Pupil size fluctuations, skin conductance levels, EEG beta/theta ratio',
                        behavior: 'Vigilance tasks, startle sensitivity, motor agitation',
                        selfReports: 'Arousal scales, restlessness self-rating',
                        paradigms: 'Acoustic startle test, psychomotor vigilance test'
                    }
                },
                {
                    id: 'sleep_wakefulness',
                    name: 'Sleep and Wakefulness',
                    description: 'Circadian and homeostatic sleep drives regulating daily sleep parameters.',
                    units: {
                        circuits: 'Suprachiasmatic Nucleus (SCN), Ventrolateral Preoptic Nucleus (VLPO)',
                        physiology: 'EEG delta wave oscillations, actigraphy sleep patterns, melatonin cycles',
                        behavior: 'Sleep onset latency, sleep fragmentation, daytime somnolence',
                        selfReports: 'Pittsburgh Sleep Quality Index (PSQI), sleep diaries',
                        paradigms: 'Actigraphy monitoring, Polysomnography (PSG)'
                    }
                }
            ]
        },
        {
            id: 'sensorimotor_systems',
            name: 'Sensorimotor Systems',
            description: 'Systems controlling the planning and execution of motor behaviors.',
            icon: 'fa-person-walking',
            color: '#3b82f6', // Blue
            constructs: [
                {
                    id: 'motor_actions',
                    name: 'Action Planning and Execution',
                    description: 'Translating cognitive goals into motor output, and executing motor plans.',
                    units: {
                        circuits: 'Primary Motor Cortex, Supplementary Motor Area (SMA), Cerebellum, Basal Ganglia',
                        physiology: 'Motor evoked potentials (MEP) via TMS, movement kinematics',
                        behavior: 'Reaction times, motor coordination, psychomotor agitation or retardation',
                        selfReports: 'Physical activity checklists, subjective motor slowing scales',
                        paradigms: 'Finger tapping task, grip strength tests, visual-motor tracking tasks'
                    }
                }
            ]
        }
    ]
};

// 2. Patient-to-RDoC Mapping Definitions (Rule Engine Seeds)
const SYMPTOM_TO_RDOC_MAP = {
    // Negative Valence
    depressed_mood: { constructId: 'loss', weight: 40 },
    worthlessness: { constructId: 'loss', weight: 35 },
    suicidal_ideation: { constructId: 'loss', weight: 20 },
    abandonment_fear: { constructId: 'loss', weight: 20 },
    chronic_emptiness: { constructId: 'loss', weight: 30 },
    
    excessive_anxiety: { constructId: 'potential_threat', weight: 40 },
    social_fear: { constructId: 'potential_threat', weight: 30 },
    provokes_fear: { constructId: 'potential_threat', weight: 20 },
    transient_paranoia: { constructId: 'potential_threat', weight: 30 },
    
    trauma_exposure: { constructId: 'sustained_threat', weight: 40 },
    avoidance_stimuli: { constructId: 'sustained_threat', weight: 35 },
    phobic_avoidance: { constructId: 'sustained_threat', weight: 30 },
    social_avoidance: { constructId: 'sustained_threat', weight: 25 },
    
    intrusive_memories: { constructId: 'acute_threat', weight: 40 },
    panic_attacks: { constructId: 'acute_threat', weight: 45 },
    palpitations: { constructId: 'acute_threat', weight: 25 },
    fear_of_dying: { constructId: 'acute_threat', weight: 30 },
    
    irritability_outbursts: { constructId: 'frustrative_nonreward', weight: 40 },
    uncontrolled_anger: { constructId: 'frustrative_nonreward', weight: 45 },
    
    // Positive Valence
    anhedonia: { constructId: 'reward_responsiveness', weight: 50 },
    restricted_intake: { constructId: 'reward_valuation', weight: 40 },
    reckless_spending: { constructId: 'reward_valuation', weight: 45 },
    impulsive_behaviors: { constructId: 'reward_learning', weight: 40 },
    
    // Cognitive Systems
    inattention: { constructId: 'attention', weight: 50 },
    careless_mistakes: { constructId: 'attention', weight: 40 },
    losing_focus: { constructId: 'attention', weight: 35 },
    forgetfulness: { constructId: 'working_memory', weight: 45 },
    avoiding_effort: { constructId: 'cognitive_control', weight: 30 },
    
    // Social Processes
    relationship_instability: { constructId: 'social_communication', weight: 30 },
    identity_disturbance: { constructId: 'perception_others', weight: 25 },
    
    // Arousal and Regulatory
    restlessness: { constructId: 'arousal', weight: 40 },
    fidgeting: { constructId: 'arousal', weight: 35 },
    hypervigilance: { constructId: 'arousal', weight: 45 },
    
    insomnia: { constructId: 'sleep_wakefulness', weight: 45 },
    sleep_disturbance: { constructId: 'sleep_wakefulness', weight: 40 },
    decreased_sleep: { constructId: 'sleep_wakefulness', weight: 40 },
    
    // Sensorimotor
    psychomotor: { constructId: 'motor_actions', weight: 50 },
    fatigue: { constructId: 'motor_actions', weight: 30 }
};

export class RdocService {
    /**
     * Get the static RDoC Matrix
     */
    static getMatrix() {
        return RDOC_MATRIX;
    }

    /**
     * Map patient clinical data into dimensional RDoC construct elevations
     * 
     * @param {number} patientId - Patient ID to map
     * @returns {Object} Dimensional mapping report containing construct elevations, domain scores, and clinical recommendations
     */
    static mapPatientToRdoc(patientId) {
        const patients = Database.getPatients();
        const patient = patients.find(p => p.id === Number(patientId));
        if (!patient) return null;

        // Fetch assessments & symptoms
        const assessments = Database.getAssessments(patientId);
        
        // Extract symptoms keywords based on patient specialty/profile in seed database
        let symptomsList = [];
        let phqScore = 0;
        let gadScore = 0;

        if (patientId === 1) {
            // Liam Carter - Major Depression
            symptomsList = ["depressed_mood", "anhedonia", "insomnia", "fatigue", "worthlessness", "concentration_difficulty", "suicidal_ideation", "psychomotor"];
            const phq = assessments.filter(a => a.type === 'PHQ-9');
            phqScore = phq.length ? phq[0].score : 15;
        } else if (patientId === 2) {
            // Sarah Jenkins - GAD
            symptomsList = ["excessive_anxiety", "restlessness", "fatigue", "concentration_difficulty", "irritability", "muscle_tension", "sleep_disturbance"];
            const gad = assessments.filter(a => a.type === 'GAD-7');
            gadScore = gad.length ? gad[0].score : 9;
        } else if (patientId === 3) {
            // John Doe - ADHD
            symptomsList = ["inattention", "careless_mistakes", "losing_focus", "avoiding_effort", "forgetfulness", "fidgeting", "impulsivity", "hyperactivity"];
        } else if (patientId === 4) {
            // Sophia Patel - PTSD
            symptomsList = ["trauma_exposure", "intrusive_memories", "avoidance_stimuli", "negative_cognitions", "emotional_numbing", "hypervigilance", "irritability_outbursts"];
        }

        // Initialize elevations object for constructs
        const constructElevations = {};
        RDOC_MATRIX.domains.forEach(domain => {
            domain.constructs.forEach(construct => {
                constructElevations[construct.id] = {
                    id: construct.id,
                    name: construct.name,
                    domainId: domain.id,
                    score: 0,
                    indicators: []
                };
            });
        });

        // 1. Process symptoms list and add to construct elevations
        symptomsList.forEach(symptom => {
            const mapping = SYMPTOM_TO_RDOC_MAP[symptom];
            if (mapping && constructElevations[mapping.constructId]) {
                constructElevations[mapping.constructId].score += mapping.weight;
                constructElevations[mapping.constructId].indicators.push({
                    type: 'symptom',
                    label: symptom.replace(/_/g, ' '),
                    contribution: mapping.weight
                });
            }
        });

        // 2. Inject assessment score offsets to refine RDoC biosignature
        if (phqScore > 0) {
            // Loss & Reward Responsiveness are affected by depressive symptoms
            if (phqScore >= 15) {
                constructElevations['loss'].score += 30;
                constructElevations['loss'].indicators.push({ type: 'assessment', label: `PHQ-9 High Score (${phqScore})`, contribution: 30 });
                constructElevations['reward_responsiveness'].score += 25; // Anhedonia indicator
                constructElevations['reward_responsiveness'].indicators.push({ type: 'assessment', label: `PHQ-9 Anhedonia Correlation`, contribution: 25 });
            } else if (phqScore >= 5) {
                constructElevations['loss'].score += 15;
                constructElevations['loss'].indicators.push({ type: 'assessment', label: `PHQ-9 Moderate Score (${phqScore})`, contribution: 15 });
            }
        }
        if (gadScore > 0) {
            // Potential Threat is primary anxiety construct
            if (gadScore >= 10) {
                constructElevations['potential_threat'].score += 30;
                constructElevations['potential_threat'].indicators.push({ type: 'assessment', label: `GAD-7 High Score (${gadScore})`, contribution: 30 });
                constructElevations['arousal'].score += 20;
                constructElevations['arousal'].indicators.push({ type: 'assessment', label: `GAD-7 Somatic Arousal`, contribution: 20 });
            } else if (gadScore >= 5) {
                constructElevations['potential_threat'].score += 15;
                constructElevations['potential_threat'].indicators.push({ type: 'assessment', label: `GAD-7 Moderate Score (${gadScore})`, contribution: 15 });
            }
        }

        // Cap construct scores at 100
        Object.keys(constructElevations).forEach(cid => {
            constructElevations[cid].score = Math.min(100, constructElevations[cid].score);
        });

        // 3. Calculate Domain aggregated levels (Average of their constructs' scores)
        const domainScores = {};
        const activeConstructs = [];
        const recommendations = [];

        RDOC_MATRIX.domains.forEach(domain => {
            let totalScore = 0;
            domain.constructs.forEach(c => {
                const cScore = constructElevations[c.id].score;
                totalScore += cScore;
                if (cScore > 0) {
                    activeConstructs.push({
                        id: c.id,
                        name: c.name,
                        score: cScore,
                        domainName: domain.name,
                        color: domain.color,
                        indicators: constructElevations[c.id].indicators
                    });
                }
            });
            const domainAvg = Math.round(totalScore / domain.constructs.length);
            domainScores[domain.id] = {
                id: domain.id,
                name: domain.name,
                score: domainAvg,
                color: domain.color,
                icon: domain.icon
            };
        });

        // 4. Generate Clinical Recommendations based on elevations
        activeConstructs.forEach(ac => {
            if (ac.score >= 50) {

                
                if (ac.id === 'loss') {
                    recommendations.push({
                        constructId: ac.id,
                        name: 'SGACC Circuit & HPA Pacing',
                        type: 'Somatic/Neuromodulation',
                        text: `Elevated sgACC 'Loss' indicator. Recommend EEG Theta-band pacing or fronto-striatal magnetic stimulation (TMS) target. Incorporate physical aerobic tracking to modulate vagal tone.`
                    });
                    recommendations.push({
                        constructId: ac.id,
                        name: 'Loss-Symptom Behavioral Activation',
                        type: 'Paradigm',
                        text: `Utilize behavioral activation protocols matching low ventral-striatal rewards receipt. Track physical homework engagement.`
                    });
                }
                if (ac.id === 'potential_threat') {
                    recommendations.push({
                        constructId: ac.id,
                        name: 'BNST Threat Habituation',
                        type: 'Cognitive/Behavioral',
                        text: `High Potential Threat (BNST loop). Implement prolonged uncertainty-exposure paradigms. Monitor skin conductance levels during relaxation breathing exercises.`
                    });
                }
                if (ac.id === 'reward_responsiveness') {
                    recommendations.push({
                        constructId: ac.id,
                        name: 'EEfRT (Effort-Expenditure Task)',
                        type: 'Research/Diagnostic',
                        text: `Hypoactive reward responsiveness suspected. Conduct the EEfRT computer paradigm to evaluate physical effort discount curves (cost-benefit processing).`
                    });
                }
                if (ac.id === 'attention') {
                    recommendations.push({
                        constructId: ac.id,
                        name: 'Continuous Performance Test (CPT)',
                        type: 'Diagnostic/Paradigm',
                        text: `High attention construct dysregulation. Run a standardized CPT test to calculate omission/commission errors and d-prime metrics.`
                    });
                }
                if (ac.id === 'sleep_wakefulness') {
                    recommendations.push({
                        constructId: ac.id,
                        name: 'Actigraphy Sleep Tracking',
                        type: 'Physiology',
                        text: `Circadian rhythm dysregulation. Prescribe actigraphy watch monitoring for 14 days to audit sleep latency and sleep fragmentation coefficients.`
                    });
                }
            }
        });

        return {
            patientName: patient.name,
            patientId: patient.id,
            symptoms: symptomsList,
            constructElevations: Object.values(constructElevations),
            domainScores: Object.values(domainScores),
            activeConstructs: activeConstructs.sort((a,b) => b.score - a.score),
            recommendations: recommendations
        };
    }

    /**
     * Serialize patient RDoC mappings to RDF Turtle format for Jena integrations
     * 
     * @param {Object} mappingReport 
     * @returns {string} RDF Turtle triples
     */
    static getRdocOntologyTriples(mappingReport) {
        if (!mappingReport) return '';

        
        let triples = `@prefix rdoc: <http://nimh.nih.gov/rdoc/ontology#> .
@prefix psypyrus: <http://psypyrus.ai/ontology#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

psypyrus:patient_${mappingReport.patientId} a psypyrus:Patient ;
    psypyrus:hasName "${mappingReport.patientName}"^^xsd:string .
`;

        mappingReport.domainScores.forEach(ds => {
            if (ds.score > 0) {
                triples += `\npsypyrus:patient_${mappingReport.patientId} rdoc:hasDomainElevation [\n` +
                           `    rdoc:domain rdoc:${ds.id} ;\n` +
                           `    rdoc:elevationScore "${ds.score}"^^xsd:integer\n` +
                           `] .`;
            }
        });

        mappingReport.activeConstructs.forEach(ac => {
            triples += `\npsypyrus:patient_${mappingReport.patientId} rdoc:hasActiveConstruct [\n` +
                       `    rdoc:construct rdoc:${ac.id} ;\n` +
                       `    rdoc:constructScore "${ac.score}"^^xsd:integer ;\n` +
                       `    rdoc:circuitTarget "${ac.name} Circuit"\n` +
                       `] .`;
        });

        return triples;
    }
}
