package com.example

import com.example.data.DiagnosticEngine
import org.junit.Assert.*
import org.junit.Test

class DiagnosticEngineTest {

    @Test
    fun evaluateMockDisorders_phantomDisorder_positive() {
        val basicCriteria = listOf("Above 18", "1 year", "Not attributable to Physiological conditions")
        val symptoms = listOf("PDss1", "PDss2", "CDss1") // Matches 3 symptoms

        val results = DiagnosticEngine.evaluateMockDisorders(basicCriteria, symptoms)
        
        assertEquals(1, results.size)
        assertEquals("Phantom Disorder", results[0].disorderName)
        assertEquals("MOCK-PHD-01", results[0].code)
        assertEquals("Low", results[0].confidence) // 3 out of 8 symptoms matched
    }

    @Test
    fun evaluateMockDisorders_hypotheticalDisorder_positive() {
        val basicCriteria = listOf("Above 21", "6 months", "Not better explained by other Physiological conditions")
        val symptoms = listOf("HDss1", "HDss2", "CDss1", "HDss4") // Matches 4 symptoms

        val results = DiagnosticEngine.evaluateMockDisorders(basicCriteria, symptoms)
        
        assertEquals(1, results.size)
        assertEquals("Hypothetical Disorder", results[0].disorderName)
        assertEquals("Moderate", results[0].confidence) // 4 out of 8 symptoms matched
    }

    @Test
    fun evaluateMockDisorders_negative() {
        val basicCriteria = listOf("Above 18") // Missing duration and exclusion
        val symptoms = listOf("PDss1", "PDss2", "CDss1")

        val results = DiagnosticEngine.evaluateMockDisorders(basicCriteria, symptoms)
        
        assertTrue(results.isEmpty())
    }

    @Test
    fun evaluateDsm5Disorders_mdd_positive() {
        val mddSymptoms = listOf(
            "depressed_mood",
            "anhedonia",
            "fatigue",
            "insomnia",
            "concentration_difficulty"
        )
        val exclusions = listOf(
            "No physiological substance attribution",
            "No medical condition attribution",
            "No manic/hypomanic history"
        )
        val results = DiagnosticEngine.evaluateDsm5Disorders(
            mddSymptoms = mddSymptoms,
            gadSymptoms = emptyList(),
            durationWeeks = 3,
            exclusions = exclusions
        )

        assertEquals(1, results.size)
        assertEquals("Major Depressive Disorder (MDD)", results[0].disorderName)
        assertEquals("High", results[0].confidence)
    }

    @Test
    fun evaluateDsm5Disorders_gad_positive() {
        val gadSymptoms = listOf(
            "excessive_anxiety",
            "restlessness",
            "fatigue",
            "muscle_tension"
        )
        val exclusions = listOf(
            "No physiological substance attribution",
            "No medical condition attribution"
        )
        val results = DiagnosticEngine.evaluateDsm5Disorders(
            mddSymptoms = emptyList(),
            gadSymptoms = gadSymptoms,
            durationWeeks = 30, // > 6 months
            exclusions = exclusions
        )

        assertEquals(1, results.size)
        assertEquals("Generalized Anxiety Disorder (GAD)", results[0].disorderName)
        assertEquals("High", results[0].confidence)
    }

    @Test
    fun evaluateDsm5Disorders_mdd_negative_insufficient_duration() {
        val mddSymptoms = listOf(
            "depressed_mood",
            "anhedonia",
            "fatigue",
            "insomnia",
            "concentration_difficulty"
        )
        val exclusions = listOf(
            "No physiological substance attribution",
            "No medical condition attribution"
        )
        // 1 week duration is insufficient for MDD (needs >= 2 weeks)
        val results = DiagnosticEngine.evaluateDsm5Disorders(
            mddSymptoms = mddSymptoms,
            gadSymptoms = emptyList(),
            durationWeeks = 1,
            exclusions = exclusions
        )

        assertTrue(results.isEmpty())
    }
}
