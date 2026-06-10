/**
 * PsyPyrus AI - Local Rule-Based Diagnostic Engine
 * Implements clinical rules for DSM-5-TR Major Depressive Disorder (MDD),
 * Generalized Anxiety Disorder (GAD), and conceptual Mock disorders.
 */

const MOCK_DISORDER_CRITERIA = {
    "Phantom Disorder": {
        basicCriteria: ["Above 18", "1 year", "Not attributable to Physiological conditions"],
        specificConditions: {
            "PDs1": ["PDss1", "PDss2", "PDss3"],
            "PDs2": ["PDss4", "PDss5", "PDss6"],
            "CD1": ["CDss1", "CDss2"]
        },
        code: "MOCK-PHD-01"
    },
    "Hypothetical Disorder": {
        basicCriteria: ["Above 21", "6 months", "Not better explained by other Physiological conditions"],
        specificConditions: {
            "HDs1": ["HDss1", "HDss2", "HDss3"],
            "HDs2": ["HDss4", "HDss5", "HDss6"],
            "CD1": ["CDss1", "CDss2"]
        },
        code: "MOCK-HYP-02"
    }
};

export class DiagnosticEngine {
    /**
     * Evaluates conceptual mock disorders based on basic and specific symptoms inputs.
     * @param {string[]} basicCriteriaInput 
     * @param {string[]} specificSymptomsInput 
     * @returns {Array<{disorderName: string, code: string, confidence: string, explanation: string}>}
     */
    static evaluateMockDisorders(basicCriteriaInput, specificSymptomsInput) {
        const results = [];

        for (const [disorderName, criteria] of Object.entries(MOCK_DISORDER_CRITERIA)) {
            const basic = criteria.basicCriteria;
            
            // Check exception criteria (index 2)
            const hasException = basicCriteriaInput.includes(basic[2]);
            
            // Check if at least one other basic criteria (index 0 or 1) is met
            const hasOtherBasic = basicCriteriaInput.includes(basic[0]) || basicCriteriaInput.includes(basic[1]);
            
            if (hasException && hasOtherBasic) {
                let matchedSymptomCount = 0;
                let totalSymptomCount = 0;
                
                for (const symptoms of Object.values(criteria.specificConditions)) {
                    for (const symptom of symptoms) {
                        totalSymptomCount++;
                        if (specificSymptomsInput.includes(symptom)) {
                            matchedSymptomCount++;
                        }
                    }
                }
                
                // At least 3 symptoms required
                if (matchedSymptomCount >= 3) {
                    const ratio = totalSymptomCount > 0 ? matchedSymptomCount / totalSymptomCount : 0;
                    let confidence = "Low";
                    if (ratio >= 0.6) {
                        confidence = "High";
                    } else if (ratio >= 0.4) {
                        confidence = "Moderate";
                    }
                    
                    results.push({
                        disorderName: disorderName,
                        code: criteria.code,
                        confidence: confidence,
                        explanation: `Met basic criteria and matched ${matchedSymptomCount} specific symptoms (Ratio: ${Math.round(ratio * 100)}%).`
                    });
                }
            }
        }

        // Sort by likelihood mapping (High > Moderate > Low)
        const confidenceWeights = { "High": 3, "Moderate": 2, "Low": 1 };
        return results.sort((a, b) => confidenceWeights[b.confidence] - confidenceWeights[a.confidence]);
    }

    /**
     * Evaluates real DSM-5-TR disorders locally.
     * @param {string[]} mddSymptoms 
     * @param {string[]} gadSymptoms 
     * @param {number} durationWeeks 
     * @param {string[]} exclusions 
     * @returns {Array<{disorderName: string, code: string, confidence: string, explanation: string}>}
     */
    static evaluateDsm5Disorders(mddSymptoms, gadSymptoms, durationWeeks, exclusions) {
        const results = [];

        // 1. Major Depressive Disorder (MDD)
        // Core indicators: depressed_mood or anhedonia
        const hasCoreMdd = mddSymptoms.includes("depressed_mood") || mddSymptoms.includes("anhedonia");
        const uniqueMddCount = [...new Set(mddSymptoms)].length;
        const hasEnoughMddSymptoms = uniqueMddCount >= 5;
        const meetsMddDuration = durationWeeks >= 2;
        
        const noSubstance = exclusions.includes("No physiological substance attribution");
        const noMedical = exclusions.includes("No medical condition attribution");
        const noManic = exclusions.includes("No manic/hypomanic history");

        if (hasCoreMdd && hasEnoughMddSymptoms && meetsMddDuration && noSubstance && noMedical) {
            const confidence = noManic ? "High" : "Moderate (Verify Mania/Hypomania Exclusions)";
            results.push({
                disorderName: "Major Depressive Disorder (MDD)",
                code: "DSM-5 296.2x / ICD-10 F32.x",
                confidence: confidence,
                explanation: `Met 2-week duration with ${uniqueMddCount} clinical symptoms including core indicators (depressed mood or loss of interest).`
            });
        }

        // 2. Generalized Anxiety Disorder (GAD)
        // Core: excessive_anxiety
        const hasCoreGad = gadSymptoms.includes("excessive_anxiety");
        const anxietyIndicators = new Set([
            "restlessness", "fatigue", "concentration_difficulty", "irritability", "muscle_tension", "sleep_disturbance"
        ]);
        const matchedGadIndicatorsCount = [...new Set(gadSymptoms)].filter(s => anxietyIndicators.has(s)).length;
        const meetsGadDuration = durationWeeks >= 26; // 6 months

        if (hasCoreGad && matchedGadIndicatorsCount >= 3 && meetsGadDuration && noSubstance && noMedical) {
            results.push({
                disorderName: "Generalized Anxiety Disorder (GAD)",
                code: "DSM-5 300.02 / ICD-10 F41.1",
                confidence: "High",
                explanation: `Excessive anxiety present for >= 6 months with ${matchedGadIndicatorsCount} somatic/cognitive anxiety symptoms.`
            });
        }

        return results;
    }
}
