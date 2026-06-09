package com.example.data

/**
 * Diagnostic result returned by the local DiagnosticEngine.
 */
data class LocalDiagnosticResult(
    val disorderName: String,
    val code: String,
    val confidence: String, // "High", "Moderate", "Low"
    val explanation: String
)

/**
 * Rule-based local Diagnostic Engine for PsyPyrus AI.
 * Implements offline evaluations for mock disorders (Phantom, Hypothetical)
 * and real clinical disorders (Major Depressive Disorder - MDD, Generalized Anxiety Disorder - GAD).
 */
object DiagnosticEngine {

    // Mock Disorders Criteria Configuration
    private val MOCK_DISORDER_CRITERIA = mapOf(
        "Phantom Disorder" to SetCriteria(
            basicCriteria = listOf("Above 18", "1 year", "Not attributable to Physiological conditions"),
            specificConditions = mapOf(
                "PDs1" to listOf("PDss1", "PDss2", "PDss3"),
                "PDs2" to listOf("PDss4", "PDss5", "PDss6"),
                "CD1" to listOf("CDss1", "CDss2")
            )
        ),
        "Hypothetical Disorder" to SetCriteria(
            basicCriteria = listOf("Above 21", "6 months", "Not better explained by other Physiological conditions"),
            specificConditions = mapOf(
                "HDs1" to listOf("HDss1", "HDss2", "HDss3"),
                "HDs2" to listOf("HDss4", "HDss5", "HDss6"),
                "CD1" to listOf("CDss1", "CDss2")
            )
        )
    )

    private data class SetCriteria(
        val basicCriteria: List<String>,
        val specificConditions: Map<String, List<String>>
    )

    /**
     * Evaluates mock/phantom disorders based on checklists.
     */
    fun evaluateMockDisorders(
        basicCriteriaInput: List<String>,
        specificSymptomsInput: List<String>
    ): List<LocalDiagnosticResult> {
        val results = mutableListOf<LocalDiagnosticResult>()

        for ((disorderName, criteria) in MOCK_DISORDER_CRITERIA) {
            val basic = criteria.basicCriteria
            
            // Check exception criteria (index 2)
            val hasException = basic[2] in basicCriteriaInput
            
            // Check if at least one other basic criteria (index 0 or 1) is met
            val hasOtherBasic = basic[0] in basicCriteriaInput || basic[1] in basicCriteriaInput
            
            if (hasException && hasOtherBasic) {
                // Count how many specific symptoms are matching
                var matchedSymptomCount = 0
                var totalSymptomCount = 0
                
                for ((_, symptoms) in criteria.specificConditions) {
                    for (symptom in symptoms) {
                        totalSymptomCount++
                        if (symptom in specificSymptomsInput) {
                            matchedSymptomCount++
                        }
                    }
                }
                
                // At least 3 symptoms required
                if (matchedSymptomCount >= 3) {
                    val ratio = if (totalSymptomCount > 0) matchedSymptomCount.toDouble() / totalSymptomCount else 0.0
                    val confidence = when {
                        ratio >= 0.6 -> "High"
                        ratio >= 0.4 -> "Moderate"
                        else -> "Low"
                    }
                    
                    results.add(
                        LocalDiagnosticResult(
                            disorderName = disorderName,
                            code = if (disorderName == "Phantom Disorder") "MOCK-PHD-01" else "MOCK-HYP-02",
                            confidence = confidence,
                            explanation = "Met basic criteria and matched $matchedSymptomCount specific symptoms (Ratio: ${(ratio * 100).toInt()}%)."
                        )
                    )
                }
            }
        }

        // Sort by likelihood (ratio of symptoms)
        return results.sortedByDescending { result ->
            if (result.confidence == "High") 3 else if (result.confidence == "Moderate") 2 else 1
        }
    }

    /**
     * Evaluates actual DSM-5-TR disorders (MDD & GAD) locally.
     */
    fun evaluateDsm5Disorders(
        mddSymptoms: List<String>,
        gadSymptoms: List<String>,
        durationWeeks: Int,
        exclusions: List<String>
    ): List<LocalDiagnosticResult> {
        val results = mutableListOf<LocalDiagnosticResult>()

        // 1. Major Depressive Disorder (MDD)
        // Symptoms: depressed_mood, anhedonia, fatigue, sleep_disturbance, weight_change, psychomotor, worthlessness, concentration_difficulty, suicidal_ideation
        val hasCoreMdd = "depressed_mood" in mddSymptoms || "anhedonia" in mddSymptoms
        val hasEnoughMddSymptoms = mddSymptoms.distinct().size >= 5
        val meetsMddDuration = durationWeeks >= 2
        
        val noSubstance = "No physiological substance attribution" in exclusions
        val noMedical = "No medical condition attribution" in exclusions
        val noManic = "No manic/hypomanic history" in exclusions

        if (hasCoreMdd && hasEnoughMddSymptoms && meetsMddDuration && noSubstance && noMedical) {
            val confidence = if (noManic) "High" else "Moderate (Verify Mania/Hypomania Exclusions)"
            results.add(
                LocalDiagnosticResult(
                    disorderName = "Major Depressive Disorder (MDD)",
                    code = "DSM-5 296.2x / ICD-10 F32.x",
                    confidence = confidence,
                    explanation = "Met 2-week duration with ${mddSymptoms.size} clinical symptoms including core indicators."
                )
            )
        }

        // 2. Generalized Anxiety Disorder (GAD)
        // Symptoms: excessive_anxiety, restlessness, fatigue, concentration_difficulty, irritability, muscle_tension, sleep_disturbance
        val hasCoreGad = "excessive_anxiety" in gadSymptoms
        val anxietyIndicators = setOf(
            "restlessness", "fatigue", "concentration_difficulty", "irritability", "muscle_tension", "sleep_disturbance"
        )
        val matchedGadIndicatorsCount = gadSymptoms.distinct().filter { it in anxietyIndicators }.size
        val meetsGadDuration = durationWeeks >= 26 // 6 months

        if (hasCoreGad && matchedGadIndicatorsCount >= 3 && meetsGadDuration && noSubstance && noMedical) {
            results.add(
                LocalDiagnosticResult(
                    disorderName = "Generalized Anxiety Disorder (GAD)",
                    code = "DSM-5 300.02 / ICD-10 F41.1",
                    confidence = "High",
                    explanation = "Excessive anxiety present for >= 6 months with $matchedGadIndicatorsCount somatic/cognitive anxiety symptoms."
                )
            )
        }

        return results
    }
}
