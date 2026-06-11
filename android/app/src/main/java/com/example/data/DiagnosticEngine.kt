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
     * Evaluates actual DSM-5-TR disorders locally.
     */
    fun evaluateDsm5Disorders(
        mddSymptoms: List<String>,
        gadSymptoms: List<String>,
        durationWeeks: Int,
        exclusions: List<String>
    ): List<LocalDiagnosticResult> {
        val results = mutableListOf<LocalDiagnosticResult>()
        val allSymptoms = (mddSymptoms + gadSymptoms).distinct()

        val noSubstance = "No physiological substance attribution" in exclusions
        val noMedical = "No medical condition attribution" in exclusions
        val noManic = "No manic/hypomanic history" in exclusions

        for (disorder in DsmDatabase.disorders) {
            // Map keywords to standardized symptom keys
            val matchedSymptoms = disorder.symptomsKeywords.filter { key ->
                val mappedKey = when(key) {
                    "sadness", "depression", "unhappy", "cry", "hopeless", "depressed_mood" -> "depressed_mood"
                    "anhedonia", "pleasure loss" -> "anhedonia"
                    "fatigue", "tired" -> "fatigue"
                    "sleep", "insomnia", "sleep_disturbance" -> if ("insomnia" in allSymptoms) "insomnia" else "sleep_disturbance"
                    "worthless", "guilt", "worthlessness" -> "worthlessness"
                    "concentration", "concentration_difficulty" -> "concentration_difficulty"
                    "suicide", "suicidal_ideation" -> "suicidal_ideation"
                    "weight", "weight_change", "appetite_change" -> "appetite_change"
                    "psychomotor" -> "psychomotor"
                    "anxiety", "worry", "stress", "excessive_anxiety" -> "excessive_anxiety"
                    "restless", "keyed up", "on edge", "restlessness" -> "restlessness"
                    "irritability" -> "irritability"
                    "tension", "muscle_tension" -> "muscle_tension"
                    else -> key
                }
                mappedKey in allSymptoms
            }

            val requiredWeeks = when {
                disorder.name.contains("MDD") -> 2
                disorder.name.contains("GAD") || disorder.name.contains("SAD") || disorder.name.contains("Phobia") -> 26
                disorder.name.contains("PTSD") -> 4
                disorder.name.contains("ADHD") || disorder.name.contains("Bipolar") -> 26
                disorder.name.contains("Acute Stress") -> 1
                else -> 2
            }

            val meetsDuration = durationWeeks >= requiredWeeks
            val hasEnoughSymptoms = matchedSymptoms.size >= disorder.minCriteriaRequired

            val passesCoreCheck = when {
                disorder.name.contains("MDD") -> "depressed_mood" in allSymptoms || "anhedonia" in allSymptoms
                disorder.name.contains("GAD") -> "excessive_anxiety" in allSymptoms
                else -> true
            }

            if (hasEnoughSymptoms && meetsDuration && noSubstance && noMedical && passesCoreCheck) {
                val confidence = when {
                    disorder.name.contains("MDD") && !noManic -> "Moderate (Verify Mania/Hypomania Exclusions)"
                    else -> "High"
                }
                results.add(
                    LocalDiagnosticResult(
                        disorderName = disorder.name,
                        code = "DSM-5 ${disorder.dsmCode} / ICD-10 ${disorder.icd10Code}",
                        confidence = confidence,
                        explanation = "Met duration of $requiredWeeks weeks with ${matchedSymptoms.size}/${disorder.minCriteriaRequired} symptoms matched."
                    )
                )
            }
        }
        
        return results
    }
}
