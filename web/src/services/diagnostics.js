import { DsmDatabase } from './dsmDatabase';

export class DiagnosticEngine {
    /**
     * Unified evaluation pipeline for DSM-5-TR clinical profiles.
     * 
     * @param {Object} profile - The client clinical profile
     * @param {string[]} profile.symptoms - Checked symptom IDs (e.g. ["depressed_mood", "anhedonia"])
     * @param {number} profile.durationWeeks - Duration of symptoms in weeks
     * @param {string[]} profile.exclusions - Medical/substance exclusions (e.g. ["No physiological substance attribution"])
     * @param {string[]} [profile.mseFindings] - Observed MSE descriptors (e.g. ["restricted_affect", "agitation"])
     * @param {string[]} [profile.historyDisorders] - Client's psychiatric history
     * @param {Object} [profile.assessmentScores] - Standardized scores (e.g. { phq9: 16, gad7: 12 })
     * @returns {Object} Diagnostic report containing candidates, differentials, comorbidities, and risk assessment
     */
    static evaluateClinicalProfile(profile) {
        const {
            symptoms = [],
            durationWeeks = 0,
            exclusions = [],
            mseFindings = [],
            historyDisorders = [],
            assessmentScores = {}
        } = profile;

        const candidates = [];
        let riskLevel = "None";
        const matchedRiskIndicators = [];

        // 1. Calculate risk level first based on critical indicators
        const criticalRiskKeywords = ["suicidal_ideation", "suicidal_gestures", "self-harm"];
        symptoms.forEach(sym => {
            if (criticalRiskKeywords.includes(sym)) {
                matchedRiskIndicators.push(sym);
            }
        });

        if (matchedRiskIndicators.includes("suicidal_gestures")) {
            riskLevel = "Critical";
        } else if (matchedRiskIndicators.includes("suicidal_ideation")) {
            riskLevel = "Severe";
        } else if (matchedRiskIndicators.length > 0) {
            riskLevel = "Moderate";
        } else if (symptoms.includes("irritability_outbursts") || symptoms.includes("uncontrolled_anger")) {
            riskLevel = "Low";
            matchedRiskIndicators.push("uncontrolled_anger");
        }

        // 2. Evaluate each disorder in the database
        DsmDatabase.disorders.forEach(disorder => {
            let score = 0;
            const explanationParts = [];

            // A. Criteria Match (40% max)
            const matchedSymptomIds = disorder.symptomsKeywords.filter(keyword => symptoms.includes(keyword));
            const criteriaRatio = disorder.minCriteriaRequired > 0 
                ? Math.min(matchedSymptomIds.length / disorder.minCriteriaRequired, 1.0)
                : 0;
            
            let criteriaScore = criteriaRatio * 40;

            // Core Symptom Penalty (Deduct 50% of criteria score if required core symptom is missing)
            if (disorder.requiredCore && disorder.requiredCore.length > 0) {
                const hasRequiredCore = disorder.requiredCore.some(coreSym => symptoms.includes(coreSym));
                if (!hasRequiredCore) {
                    criteriaScore = criteriaScore * 0.5;
                    explanationParts.push("Missing required core symptom(s) (50% criteria penalty applied)");
                }
            }
            score += criteriaScore;
            explanationParts.push(`Criteria match: ${matchedSymptomIds.length}/${disorder.minCriteriaRequired} symptoms (${Math.round(criteriaScore)}/40 pts)`);

            // B. Duration Match (15% max)
            let durationScore = 0;
            const requiredWeeks = disorder.name.includes("MDD") ? 2 
                                : disorder.name.includes("GAD") || disorder.name.includes("SAD") || disorder.name.includes("Phobia") ? 26
                                : disorder.name.includes("PTSD") ? 4
                                : disorder.name.includes("ADHD") || disorder.name.includes("Bipolar") ? 26
                                : disorder.name.includes("Acute Stress") ? 0.4 // 3 days
                                : 2; // Default

            if (durationWeeks >= requiredWeeks) {
                durationScore = 15;
            } else if (durationWeeks > 0) {
                // Scale duration score linearly
                durationScore = Math.round((durationWeeks / requiredWeeks) * 15);
            }
            score += durationScore;
            explanationParts.push(`Duration: ${durationWeeks} weeks vs ${requiredWeeks} required (${durationScore}/15 pts)`);

            // C. Exclusions Match (15% max)
            let exclusionScore = 0;
            const noSubstance = exclusions.includes("No physiological substance attribution");
            const noMedical = exclusions.includes("No medical condition attribution");

            if (noSubstance && noMedical) {
                exclusionScore = 15;
            } else if (noSubstance || noMedical) {
                exclusionScore = 7;
            }
            score += exclusionScore;
            explanationParts.push(`Exclusions checklist: ${exclusionScore}/15 pts`);

            // D. MSE Alignment (15% max)
            let mseScore = 0;
            const mseMatchKeywords = {
                "Depressive": ["sad_affect", "restricted_affect", "slowing", "flat_affect", "poor_eye_contact"],
                "Anxiety": ["anxious", "restless", "agitation", "trembling", "rapid_speech"],
                "Trauma-Related": ["hypervigilant", "startle", "flat_affect", "guarding"],
                "Bipolar": ["elevated_affect", "pressured_speech", "grandiosity", "racing_thoughts"],
                "Personality": ["affective_instability", "anger", "splitting", "poor_boundaries"],
                "Eating": ["thin", "cachectic", "anxious_affect"]
            };

            const relevantMseKeywords = mseMatchKeywords[disorder.category] || [];
            const matchedMseCount = mseFindings.filter(finding => 
                relevantMseKeywords.some(keyword => finding.toLowerCase().includes(keyword.toLowerCase()))
            ).length;

            if (matchedMseCount > 0) {
                mseScore = Math.min(matchedMseCount * 7.5, 15); // 7.5 pts per match, max 15
            }
            score += mseScore;
            explanationParts.push(`MSE clinical alignment: ${matchedMseCount} indicators matched (${mseScore}/15 pts)`);

            // E. History Alignment (10% max)
            let historyScore = 0;
            if (historyDisorders.some(h => disorder.name.toLowerCase().includes(h.toLowerCase()))) {
                historyScore = 10;
            }
            score += historyScore;
            explanationParts.push(`History correlation: ${historyScore}/10 pts`);

            // F. Standardized Assessment Scores (5% max)
            let assessmentScore = 0;
            if (disorder.name.includes("MDD") && assessmentScores.phq9 >= 10) {
                assessmentScore = 5;
            } else if (disorder.name.includes("GAD") && assessmentScores.gad7 >= 8) {
                assessmentScore = 5;
            }
            score += assessmentScore;
            explanationParts.push(`Screening instruments: ${assessmentScore}/5 pts`);

            // Classify Severity
            let severity = "N/A";
            if (matchedSymptomIds.length >= disorder.minCriteriaRequired) {
                if (matchedSymptomIds.length === disorder.minCriteriaRequired) {
                    severity = "Mild";
                } else if (matchedSymptomIds.length <= disorder.minCriteriaRequired + 2) {
                    severity = "Moderate";
                } else {
                    severity = "Severe";
                }
            }

            candidates.push({
                disorderName: disorder.name,
                code: `DSM-5 ${disorder.dsmCode} / ICD-10 ${disorder.icd10Code}`,
                category: disorder.category,
                confidenceScore: Math.round(score),
                severity: severity,
                explanation: explanationParts.join(" | "),
                differentials: disorder.differentials,
                comorbidities: disorder.comorbidities,
                interventions: disorder.interventions,
                exclusionRules: disorder.exclusionRules,
                comorbidityWeights: disorder.comorbidityWeights
            });
        });

        // 3. Filter candidates (threshold >= 45%)
        let activeCandidates = candidates.filter(c => c.confidenceScore >= 45);

        // 4. Apply Exclusion Rules
        const excludedList = [];
        activeCandidates.forEach(cand => {
            cand.exclusionRules.forEach(ruleName => {
                const excludingCandidate = activeCandidates.find(c => c.disorderName === ruleName && c.confidenceScore > cand.confidenceScore);
                if (excludingCandidate) {
                    excludedList.push(cand.disorderName);
                }
            });
        });

        // Split into confirmed candidates vs differentials due to exclusion
        const confirmedCandidates = activeCandidates.filter(c => !excludedList.includes(c.disorderName));
        const excludedDifferentials = activeCandidates.filter(c => excludedList.includes(c.disorderName))
            .map(c => ({
                ...c,
                notes: "Moved to differential list due to clinical exclusion rules (e.g. Bipolar exclusion)."
            }));

        // Sort confirmed candidates by confidence score descending
        confirmedCandidates.sort((a, b) => b.confidenceScore - a.confidenceScore);

        // 5. Detect Comorbidity Relationships
        const comorbidities = [];
        if (confirmedCandidates.length >= 2) {
            for (let i = 0; i < confirmedCandidates.length; i++) {
                for (let j = i + 1; j < confirmedCandidates.length; j++) {
                    const c1 = confirmedCandidates[i];
                    const c2 = confirmedCandidates[j];
                    
                    if (c1.comorbidityWeights && c1.comorbidityWeights[c2.disorderName]) {
                        comorbidities.push({
                            primary: c1.disorderName,
                            secondary: c2.disorderName,
                            correlationWeight: c1.comorbidityWeights[c2.disorderName],
                            notes: `Flagged comorbid relationship. Relative statistical correlation is ${Math.round(c1.comorbidityWeights[c2.disorderName] * 100)}%.`
                        });
                    }
                }
            }
        }

        return {
            diagnoses: confirmedCandidates,
            differentials: excludedDifferentials,
            comorbidities: comorbidities,
            riskAssessment: {
                level: riskLevel,
                indicators: matchedRiskIndicators,
                notes: riskLevel === "Critical" || riskLevel === "Severe"
                    ? "CRITICAL WARNING: Active self-harm or suicidal indicators present. Formulate clinical safety contract immediately."
                    : "Standard safety protocols active. Risk level low/none."
            }
        };
    }
}
