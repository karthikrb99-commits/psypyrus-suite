/**
 * PsyPyrus AI - HiTOP Clinical Decision Service
 * Implements native scoring, patient biosignature mapping, and semantic RDF Turtle 
 * generation for the Hierarchical Taxonomy of Psychopathology (HiTOP) framework.
 */

import { Database } from './db';

// 1. Brief HiTOP (B-HiTOP / HiTOP-BR) 45 items definitions
// Ratings: 1 = Not at all, 2 = A little, 3 = Moderately, 4 = A lot
export const HITOP_ITEMS = [
    { id: 1, text: "I found it easy to deceive others.", scale: "Antagonism", externalizing: true, pfactor: true },
    { id: 2, text: "I deserved special treatment.", scale: "Antagonism", externalizing: false, pfactor: false },
    { id: 3, text: "I saw things that were not really there.", scale: "Thought Disorder", externalizing: false, pfactor: false },
    { id: 4, text: "My fantasies felt very real to me.", scale: "Thought Disorder", externalizing: false, pfactor: false },
    { id: 5, text: "I liked having power.", scale: "Antagonism", externalizing: false, pfactor: false },
    { id: 6, text: "I felt something was wrong with my body.", scale: "Somatoform", externalizing: false, pfactor: true },
    { id: 7, text: "When I had the chance, I chose to be alone rather than with other people.", scale: "Detachment", externalizing: false, pfactor: false },
    { id: 8, text: "My moods were intense and unpredictable.", scale: "Internalizing", externalizing: false, pfactor: false },
    { id: 9, text: "My mind was flooded with troubling images of a bad experience.", scale: "Internalizing", externalizing: false, pfactor: false },
    { id: 10, text: "I had pains in several parts of my body.", scale: "Somatoform", externalizing: false, pfactor: false },
    { id: 11, text: "I felt like I was outside of my body.", scale: "Thought Disorder", externalizing: false, pfactor: true },
    { id: 12, text: "I was happiest when I was alone.", scale: "Detachment", externalizing: false, pfactor: false },
    { id: 13, text: "I found it easy to manipulate others.", scale: "Antagonism", externalizing: true, pfactor: false },
    { id: 14, text: "I was bothered by several bodily symptoms (e.g., headache, fatigue or stomach problems) for which there was no clear or sufficient medical explanation.", scale: "Somatoform", externalizing: false, pfactor: true },
    { id: 15, text: "I had trouble planning and keeping to schedules.", scale: "Disinhibition", externalizing: true, pfactor: false },
    { id: 16, text: "I lost things that I needed.", scale: "Disinhibition", externalizing: true, pfactor: false },
    { id: 17, text: "I was frustrated with having to convince others I had a real illness.", scale: "Somatoform", externalizing: false, pfactor: false },
    { id: 18, text: "Even when I was very careful, I worried whether I had done something correctly.", scale: "Internalizing", externalizing: false, pfactor: false },
    { id: 19, text: "Reading articles about disease made me worry about my health.", scale: "Somatoform", externalizing: false, pfactor: false },
    { id: 20, text: "I paid my bills late or missed other important deadlines.", scale: "Disinhibition", externalizing: false, pfactor: false },
    { id: 21, text: "I could feel changes in my body.", scale: "Somatoform", externalizing: false, pfactor: false },
    { id: 22, text: "I was disgusted with myself.", scale: "Internalizing", externalizing: false, pfactor: true },
    { id: 23, text: "I felt on guard and on edge.", scale: "Internalizing", externalizing: false, pfactor: true },
    { id: 24, text: "I was a messy person.", scale: "Disinhibition", externalizing: false, pfactor: false },
    { id: 25, text: "I did things to get others to notice me.", scale: "Antagonism", externalizing: true, pfactor: true },
    { id: 26, text: "I noticed small changes to how my body feels.", scale: "Somatoform", externalizing: false, pfactor: false },
    { id: 27, text: "Things went best when I told others what to do.", scale: "Antagonism", externalizing: false, pfactor: false },
    { id: 28, text: "I heard things that no one else could hear.", scale: "Thought Disorder", externalizing: false, pfactor: true },
    { id: 29, text: "I was never on time.", scale: "Disinhibition", externalizing: false, pfactor: false },
    { id: 30, text: "I had no interest in romantic relationships.", scale: "Detachment", externalizing: false, pfactor: false },
    { id: 31, text: "Romantic relationships seemed like a hassle to me.", scale: "Detachment", externalizing: false, pfactor: true },
    { id: 32, text: "I said things without thinking.", scale: "Disinhibition", externalizing: true, pfactor: true },
    { id: 33, text: "People told me I was coldhearted.", scale: "Antagonism", externalizing: false, pfactor: false },
    { id: 34, text: "I made decisions quickly without thinking them through.", scale: "Disinhibition", externalizing: true, pfactor: false },
    { id: 35, text: "I quit tasks that became too challenging.", scale: "Disinhibition", externalizing: true, pfactor: true },
    { id: 36, text: "I had a hard time asserting myself to others.", scale: "Detachment", externalizing: false, pfactor: false },
    { id: 37, text: "I felt that I did not want to be in a close relationship.", scale: "Detachment", externalizing: false, pfactor: true },
    { id: 38, text: "I had trouble telling whether something really happened or I just imagined it.", scale: "Thought Disorder", externalizing: false, pfactor: false },
    { id: 39, text: "I felt that things around me were not real.", scale: "Thought Disorder", externalizing: false, pfactor: false },
    { id: 40, text: "I liked attracting the attention of others.", scale: "Antagonism", externalizing: true, pfactor: false },
    { id: 41, text: "I was afraid that I might suffer from a serious illness", scale: "Somatoform", externalizing: false, pfactor: false },
    { id: 42, text: "I thought a lot about death.", scale: "Internalizing", externalizing: false, pfactor: false },
    { id: 43, text: "I bought much more than I needed.", scale: "Disinhibition", externalizing: false, pfactor: false },
    { id: 44, text: "I was overwhelmed by anxiety.", scale: "Internalizing", externalizing: false, pfactor: false },
    { id: 45, text: "I expected to get treated better than others.", scale: "Antagonism", externalizing: true, pfactor: false }
];

// Default seeds for patients when no B-HiTOP has been completed yet
const DEFAULT_PATIENT_ANSWERS = {
    1: [ // Liam Carter - MDD (severe internalizing/somatoform)
        1, 1, 1, 1, 1, 3, 2, 4, 4, 3, 1, 3, 1, 4, 2, 2, 3, 4, 3, 2, 2, 4, 4, 1, 1, 3, 1, 1, 2, 2, 2, 2, 1, 1, 3, 3, 2, 1, 1, 1, 3, 4, 2, 4, 1
    ],
    2: [ // Sarah Jenkins - GAD (severe internalizing/somatoform/worry)
        1, 1, 1, 1, 1, 3, 1, 3, 2, 4, 1, 2, 1, 4, 2, 1, 2, 4, 4, 2, 3, 4, 4, 1, 1, 3, 1, 1, 1, 1, 2, 1, 1, 2, 2, 2, 2, 1, 1, 1, 3, 3, 2, 4, 1
    ],
    3: [ // John Doe - ADHD (disinhibition focus)
        2, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 4, 4, 1, 2, 1, 4, 1, 2, 2, 4, 2, 1, 2, 1, 4, 1, 1, 4, 2, 4, 4, 2, 1, 1, 1, 2, 1, 1, 3, 2, 2
    ],
    4: [ // Sophia Patel - PTSD (internalizing/detachment/hypervigilance)
        1, 1, 1, 1, 1, 2, 3, 4, 4, 2, 2, 4, 1, 2, 2, 2, 2, 3, 2, 2, 2, 3, 4, 1, 1, 2, 1, 2, 2, 3, 4, 2, 1, 1, 2, 3, 4, 2, 2, 1, 2, 3, 2, 4, 1
    ]
};

export class HitopService {
    /**
     * Scores the B-HiTOP instrument items
     * @param {Array<number>} answers - Array of 45 answers (1-4 scale)
     * @returns {Object} Scale averages and details
     */
    static scoreHitop(answers) {
        const getAnswerVal = (id) => {
            let val = undefined;
            if (Array.isArray(answers)) {
                val = answers[id - 1];
            } else if (answers && typeof answers === 'object') {
                val = answers[id];
            }
            return (val === null || val === undefined) ? 1 : Number(val);
        };

        const getMean = (itemIds) => {
            let sum = 0;
            let count = 0;
            itemIds.forEach(id => {
                const val = getAnswerVal(id);
                sum += val;
                count++;
            });
            return count > 0 ? Number((sum / count).toFixed(2)) : 1.0;
        };

        const somatoform = getMean([6, 10, 14, 17, 19, 21, 26, 41]);
        const detachment = getMean([7, 12, 30, 31, 36, 37]);
        const thoughtDisorder = getMean([3, 4, 11, 28, 38, 39]);
        const disinhibition = getMean([15, 16, 20, 24, 29, 32, 34, 35, 43]);
        const antagonism = getMean([1, 2, 5, 13, 25, 27, 33, 40, 45]);
        const internalizing = getMean([8, 9, 18, 22, 23, 42, 44]);
        
        const externalizing = getMean([1, 13, 15, 16, 25, 32, 34, 35, 40, 45]);
        const pFactor = getMean([1, 6, 11, 14, 22, 23, 25, 28, 31, 32, 35, 37]);

        return {
            somatoform,
            detachment,
            thoughtDisorder,
            disinhibition,
            antagonism,
            internalizing,
            externalizing,
            pFactor
        };
    }

    /**
     * Maps patient assessment logs to HiTOP dimensions and elevations
     * @param {number} patientId 
     * @returns {Object} Complete HiTOP mapping report
     */
    static mapPatientToHitop(patientId) {
        const patients = Database.getPatients();
        const patient = patients.find(p => p.id === Number(patientId));
        if (!patient) return null;

        // Fetch B-HiTOP assessments from Database
        const assessments = Database.getAssessments(patientId);
        const hitopAssessment = assessments.find(a => a.type === 'B-HiTOP');
        
        let answers = null;
        let isDefaultSeed = false;

        if (hitopAssessment && hitopAssessment.answers) {
            answers = hitopAssessment.answers;
        } else {
            answers = DEFAULT_PATIENT_ANSWERS[patientId] || Array(45).fill(1);
            isDefaultSeed = true;
        }

        const scores = this.scoreHitop(answers);

        // Map scales to 0-100% elevations for progress bars & colors
        const getElevationPercent = (score) => {
            // scale is 1 to 4, so (score - 1) / 3 * 100
            return Math.round(((score - 1.0) / 3.0) * 100);
        };

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

        // Determine active/clinical elevations (score >= 2.5 on a 1-4 scale)
        const clinicalElevations = [...spectraElevations, ...secondaryElevations].filter(s => s.score >= 2.5);

        // Build clinical recommendations
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
            patientId: patient.id,
            patientName: patient.name,
            specialty: patient.specialty,
            answers,
            isDefaultSeed,
            spectra: spectraElevations,
            secondary: secondaryElevations,
            clinicalElevations,
            recommendations
        };
    }

    /**
     * Serialize patient HiTOP mappings to RDF Turtle format for Apache Jena integrations
     * @param {Object} report - Complete HiTOP mapping report
     * @returns {string} RDF Turtle triples
     */
    static getHitopOntologyTriples(report) {
        if (!report) return '';
        
        let triples = `@prefix hitop: <http://hitop-taxonomy.org/ontology#> .
@prefix psypyrus: <http://psypyrus.ai/ontology#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

psypyrus:patient_${report.patientId} a psypyrus:Patient ;
    psypyrus:hasName "${report.patientName}"^^xsd:string ;
    hitop:hasPsychopathologyProfile psypyrus:hitop_profile_${report.patientId} .

psypyrus:hitop_profile_${report.patientId} a hitop:HiTOPProfile ;
    hitop:dateCompiled "${new Date().toISOString()}"^^xsd:dateTime .
`;

        report.spectra.forEach(spec => {
            triples += `\npsypyrus:hitop_profile_${report.patientId} hitop:hasSpectrumElevation [\n` +
                       `    hitop:spectrum hitop:${spec.name.replace(/\s+/g, '')} ;\n` +
                       `    hitop:meanScore "${spec.score}"^^xsd:decimal ;\n` +
                       `    hitop:elevationPercent "${spec.elevation}"^^xsd:integer\n` +
                       `] .`;
        });

        report.secondary.forEach(sec => {
            triples += `\npsypyrus:hitop_profile_${report.patientId} hitop:hasSecondaryElevation [\n` +
                       `    hitop:scale hitop:${sec.id === 'p_factor' ? 'pFactor' : 'Externalizing'} ;\n` +
                       `    hitop:meanScore "${sec.score}"^^xsd:decimal ;\n` +
                       `    hitop:elevationPercent "${sec.elevation}"^^xsd:integer\n` +
                       `] .`;
        });

        return triples;
    }
}
