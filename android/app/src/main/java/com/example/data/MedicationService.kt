package com.example.data

import java.util.UUID

data class ClinicalDrug(
    val id: String,
    val name: String,
    val usBrand: String,
    val indianBrands: String,
    val indianPrice: String,
    val dosage: String,
    val sideEffects: List<String>,
    val precautions: String,
    val pediatricWarning: String? = null,
    val geriatricWarning: String? = null,
    val pregnancyWarning: String? = null,
    var originatingDiagnosis: String? = null
)

data class MedicationSafetyAlert(
    val id: String = UUID.randomUUID().toString(),
    val drugName: String,
    val type: String,
    val level: String, // "Critical", "Warning"
    val message: String
)

data class MedicationSafetyReport(
    val alerts: List<MedicationSafetyAlert>,
    val overallRisk: String, // "Critical", "Warning", "None"
    val cohort: String // "Pediatric", "Geriatric", "Adult"
)

data class AbdmSyncReceipt(
    val transactionId: String,
    val registryStatus: String, // "LINKED_AND_DISPATCHED"
    val linkToken: String,
    val timestamp: String,
    val patientName: String,
    val abhaNumber: String,
    val recordsDispatchedCount: Int
)

object MedicationService {

    val drugsDb: Map<String, List<ClinicalDrug>> = mapOf(
        "depressive" to listOf(
            ClinicalDrug(
                id = "mdd-sertraline",
                name = "Sertraline",
                usBrand = "Zoloft",
                indianBrands = "Zosert (Sun Pharma), Sertima (Torrent), Daxid (Pfizer India)",
                indianPrice = "₹75 - ₹110 per strip (10 tabs)",
                dosage = "50mg once daily in the morning, titrated up to 200mg max if indicated.",
                sideEffects = listOf("Nausea", "Insomnia", "Dry mouth", "Sexual dysfunction", "Diarrhea", "Increased sweating"),
                precautions = "Do not stop abruptly due to discontinuation syndrome. Avoid concurrent use of MAOIs. Monitor for Serotonin Syndrome.",
                pediatricWarning = "CRITICAL ALERT: Boxed warning for increased risk of suicidal ideation and behavior in pediatric and adolescent patients (ages 6-17). Strict weekly monitoring required.",
                geriatricWarning = "WARNING: High risk of SIADH and hyponatremia in geriatric cohorts (age > 65). Monitor sodium levels regularly. Start with a lower dose (e.g. 25mg daily).",
                pregnancyWarning = "Category C. SSRI exposure in late pregnancy may increase risk of persistent pulmonary hypertension of the newborn (PPHN)."
            ),
            ClinicalDrug(
                id = "mdd-escitalopram",
                name = "Escitalopram",
                usBrand = "Lexapro",
                indianBrands = "Nexito (Torrent), Cilentra (Sun Pharma), Estop (Alkem)",
                indianPrice = "₹60 - ₹95 per strip (10 tabs)",
                dosage = "10mg once daily in the morning or bedtime, max 20mg daily.",
                sideEffects = listOf("Nausea", "Headache", "Somnolence", "Ejaculatory delay", "Fatigue", "Increased appetite"),
                precautions = "Monitor for QTc prolongation at higher doses. Avoid concurrent use of other serotonergic agents.",
                pediatricWarning = "CRITICAL ALERT: Monitor closely for treatment-emergent suicidality. Approved for adolescents aged 12-17.",
                geriatricWarning = "WARNING: Clearance decreased in the elderly. Recommended maximum dose is 10mg daily. Monitor for hyponatremia.",
                pregnancyWarning = "Category C. Standard monitoring for neonatal adaptation syndrome post-delivery."
            )
        ),
        "anxiety" to listOf(
            ClinicalDrug(
                id = "gad-escitalopram",
                name = "Escitalopram",
                usBrand = "Lexapro",
                indianBrands = "Nexito (Torrent), Cilentra (Sun Pharma)",
                indianPrice = "₹60 - ₹95 per strip (10 tabs)",
                dosage = "10mg once daily, titrated to 20mg after 1-2 weeks if necessary.",
                sideEffects = listOf("Nausea", "Drowsiness", "Dry mouth", "Sweating", "Anorgasmia"),
                precautions = "Check baseline ECG in patients with risk factors for QT prolongation.",
                pediatricWarning = "WARNING: Safety and efficacy not established in pediatric GAD patients under 12.",
                geriatricWarning = "WARNING: Initiate at 5mg daily. Geriatric patients are more sensitive to hyponatremia and balance impairment.",
                pregnancyWarning = "Category C. Weigh maternal benefits against potential mild neonatal withdrawal risks."
            ),
            ClinicalDrug(
                id = "gad-buspirone",
                name = "Buspirone",
                usBrand = "Buspar",
                indianBrands = "Buspin (Intas), Buscalm (Wockhardt)",
                indianPrice = "₹45 - ₹70 per strip (10 tabs)",
                dosage = "15mg daily (7.5mg twice daily), increase by 5mg daily every 2-3 days, max 60mg daily.",
                sideEffects = listOf("Dizziness", "Nausea", "Headache", "Nervousness", "Excitement", "Lightheadedness"),
                precautions = "Does not exhibit cross-tolerance with benzodiazepines; will not alleviate benzodiazepine withdrawal.",
                pediatricWarning = "WARNING: Not approved for pediatric patients under 18 due to lack of trials.",
                geriatricWarning = "SAFE ALTERNATIVE: Beers Criteria preferred non-benzodiazepine anxiolytic. No significant dosage adjustment required; monitor renal function.",
                pregnancyWarning = "Category B. No evidence of fetal risk in animal studies, but clinical data in pregnant women is limited."
            )
        ),
        "adhd" to listOf(
            ClinicalDrug(
                id = "adhd-methylphenidate",
                name = "Methylphenidate (Extended Release)",
                usBrand = "Ritalin LA / Concerta",
                indianBrands = "Inspiral SR (Torrent), Addwize OD (Sun Pharma)",
                indianPrice = "₹180 - ₹260 per strip (10 tabs)",
                dosage = "18mg once daily in the morning, titrated weekly by 18mg increments up to 72mg max.",
                sideEffects = listOf("Appetite suppression", "Insomnia", "Tachycardia", "Dry mouth", "Headache", "Irritability"),
                precautions = "Schedule II Controlled Substance (India Schedule H1/X). Monitor heart rate and blood pressure. Avoid in severe anxiety, tics, or glaucoma.",
                pediatricWarning = "WARNING: Approved for ages 6 and older. Monitor height and weight growth curves quarterly.",
                geriatricWarning = "CRITICAL ALERT: Beers Criteria warning. Stimulants should be avoided in older adults with cardiovascular disease, history of arrhythmias, or severe hypertension.",
                pregnancyWarning = "Category C. Association with increased risk of cardiovascular malformations in some registry trials."
            ),
            ClinicalDrug(
                id = "adhd-atomoxetine",
                name = "Atomoxetine",
                usBrand = "Strattera",
                indianBrands = "Attentrol (Sun Pharma), Axepta (Torrent)",
                indianPrice = "₹120 - ₹180 per strip (10 tabs)",
                dosage = "40mg daily in the morning, increase to 80mg after 3 days, max 100mg daily.",
                sideEffects = listOf("Decreased appetite", "Dry mouth", "Nausea", "Erectile dysfunction", "Fatigue", "Urinary hesitation"),
                precautions = "Non-stimulant alternative. Monitor liver function parameters. Monitor heart rate.",
                pediatricWarning = "CRITICAL ALERT: Boxed warning for increased risk of suicidal ideation in children. Monitor closely for behavioral changes.",
                geriatricWarning = "WARNING: Half-life may be prolonged. Use caution in geriatric patients with cardiac history.",
                pregnancyWarning = "Category C. Limited human data available."
            )
        ),
        "trauma" to listOf(
            ClinicalDrug(
                id = "ptsd-sertraline",
                name = "Sertraline",
                usBrand = "Zoloft",
                indianBrands = "Zosert (Sun Pharma), Sertima (Torrent)",
                indianPrice = "₹75 - ₹110 per strip (10 tabs)",
                dosage = "25mg daily for 1 week, then increase to 50mg daily, max 200mg.",
                sideEffects = listOf("Nausea", "Sexual dysfunction", "Insomnia", "Tremor", "Diarrhea"),
                precautions = "Avoid abrupt withdrawal. First-line pharmacotherapy for PTSD.",
                pediatricWarning = "CRITICAL ALERT: Boxed warning for pediatric suicidal ideation. Standard adolescent monitoring required.",
                geriatricWarning = "WARNING: Higher susceptibility to hyponatremia. Monitor cognitive state and serum sodium.",
                pregnancyWarning = "Category C. Potential neonatal adaptation syndrome."
            ),
            ClinicalDrug(
                id = "ptsd-prazosin",
                name = "Prazosin",
                usBrand = "Minipress",
                indianBrands = "Prasopress (Ipca), Minipress XL (Pfizer India)",
                indianPrice = "₹55 - ₹90 per strip (10 tabs)",
                dosage = "1mg at bedtime to start; titrate gradually up to 5mg-10mg for nightmares.",
                sideEffects = listOf("Orthostatic hypotension", "Dizziness", "Palpitations", "Headache", "Nasal congestion", "Weakness"),
                precautions = "Risk of first-dose syncope. Warn patients to rise slowly. Avoid concurrent phosphodiesterase-5 inhibitors.",
                pediatricWarning = "WARNING: Efficacy and safety profiles not systematically evaluated in pediatric trauma.",
                geriatricWarning = "CRITICAL ALERT: Beers Criteria warning. High risk of orthostatic hypotension and syncope in older adults. Significant falls risk. Start at 0.5mg.",
                pregnancyWarning = "Category C. Crossing placenta has been shown; monitor fetal cardiac rates if used in late term."
            )
        ),
        "bipolar" to listOf(
            ClinicalDrug(
                id = "bip-lithium",
                name = "Lithium Carbonate",
                usBrand = "Lithobid",
                indianBrands = "Licab (Torrent), Lithosun (Sun Pharma)",
                indianPrice = "₹35 - ₹65 per strip (10 tabs)",
                dosage = "300mg two to three times daily. Target therapeutic blood levels: 0.6 to 1.2 mEq/L.",
                sideEffects = listOf("Hand tremor", "Polyuria", "Polydipsia", "Nausea", "Weight gain", "Hypothyroidism", "Cognitive dulling"),
                precautions = "Narrow therapeutic index. Requires regular serum level checks, renal and thyroid monitoring.",
                pediatricWarning = "WARNING: Approved for ages 7 and older. Monitor thyroid function closely.",
                geriatricWarning = "CRITICAL ALERT: Renal clearance is significantly reduced. Target lower serum levels (0.5-0.8 mEq/L) to prevent neurotoxicity.",
                pregnancyWarning = "Category D. Known risk of Ebstein's anomaly in the first trimester. Monitor fetal echocardiography."
            ),
            ClinicalDrug(
                id = "bip-valproate",
                name = "Valproic Acid / Divalproex Sodium",
                usBrand = "Depakote",
                indianBrands = "Valparin (Sanofi India), Depakene (Abbott India)",
                indianPrice = "₹85 - ₹140 per strip (10 tabs)",
                dosage = "250mg twice daily, titrate rapidly to therapeutic serum levels: 50 to 125 mcg/mL.",
                sideEffects = listOf("Nausea", "Hair loss (alopecia)", "Weight gain", "Tremor", "Thrombocytopenia", "Hepatic dysfunction"),
                precautions = "Requires liver function test (LFT) and complete blood count (CBC) monitoring.",
                pediatricWarning = "CRITICAL ALERT: Boxed warning for increased risk of suicidal ideation in children. Monitor closely for behavioral changes.",
                geriatricWarning = "WARNING: Reduce initial dosage. Monitor nutritional intake, somnolence, and dehydration parameters.",
                pregnancyWarning = "CRITICAL ALERT: Category D/X. Major teratogen. High risk of neural tube defects (e.g. spina bifida). Avoid in females of childbearing potential unless absolutely necessary."
            )
        ),
        "personality" to listOf(
            ClinicalDrug(
                id = "bpd-lamotrigine",
                name = "Lamotrigine",
                usBrand = "Lamictal",
                indianBrands = "Lametec (Cipla), Lamez (Intas)",
                indianPrice = "₹90 - ₹150 per strip (10 tabs)",
                dosage = "25mg daily for 2 weeks, then 50mg daily for 2 weeks, slow titration up to 100-200mg maintenance.",
                sideEffects = listOf("Headache", "Dizziness", "Somnolence", "Double vision", "Rash", "Nausea"),
                precautions = "Discontinue at first sign of rash due to life-threatening Stevens-Johnson Syndrome (SJS) risk.",
                pediatricWarning = "CRITICAL ALERT: Risk of severe, life-threatening rash (SJS/TEN) is significantly higher in pediatric patients.",
                geriatricWarning = "WARNING: Start at lowest end of titration schedule. Geriatric patients are at higher risk of coordination issues.",
                pregnancyWarning = "Category C. Cleared faster during pregnancy; dosages may require adjustment."
            )
        )
    )

    fun getRecommendations(diagnoses: List<String>): List<ClinicalDrug> {
        val recommendations = mutableListOf<ClinicalDrug>()
        val addedIds = mutableSetOf<String>()

        for (diagnosis in diagnoses) {
            val nameLower = diagnosis.lowercase()
            var matchedCategory: String? = null

            if (nameLower.contains("depres") || nameLower.contains("mood")) {
                matchedCategory = "depressive"
            } else if (nameLower.contains("anxi") || nameLower.contains("panic") || nameLower.contains("phobia")) {
                matchedCategory = "anxiety"
            } else if (nameLower.contains("adhd") || nameLower.contains("hyperactivity") || nameLower.contains("attention")) {
                matchedCategory = "adhd"
            } else if (nameLower.contains("ptsd") || nameLower.contains("trauma") || nameLower.contains("stress")) {
                matchedCategory = "trauma"
            } else if (nameLower.contains("bipolar") || nameLower.contains("manic")) {
                matchedCategory = "bipolar"
            } else if (nameLower.contains("borderline") || nameLower.contains("personality")) {
                matchedCategory = "personality"
            }

            if (matchedCategory != null && drugsDb.containsKey(matchedCategory)) {
                for (drug in drugsDb[matchedCategory]!!) {
                    if (!addedIds.contains(drug.id)) {
                        addedIds.add(drug.id)
                        val drugCopy = drug.copy(originatingDiagnosis = diagnosis)
                        recommendations.add(drugCopy)
                    }
                }
            }
        }

        return recommendations
    }

    fun runSafetyAudit(age: Int, gender: String, selectedDrugs: List<ClinicalDrug>): MedicationSafetyReport {
        val alerts = mutableListOf<MedicationSafetyAlert>()
        var overallRisk = "None"

        val isChild = age < 18
        val isElderly = age >= 65
        val isFemale = gender.lowercase() == "female"

        for (drug in selectedDrugs) {
            if (isChild && drug.pediatricWarning != null) {
                val isCritical = drug.pediatricWarning.contains("CRITICAL")
                alerts.add(
                    MedicationSafetyAlert(
                        drugName = drug.name,
                        type = "Pediatric Risk",
                        level = if (isCritical) "Critical" else "Warning",
                        message = drug.pediatricWarning
                    )
                )
                if (isCritical) overallRisk = "Critical"
                else if (overallRisk != "Critical") overallRisk = "Warning"
            }

            if (isElderly && drug.geriatricWarning != null) {
                val isCritical = drug.geriatricWarning.contains("CRITICAL")
                alerts.add(
                    MedicationSafetyAlert(
                        drugName = drug.name,
                        type = "Geriatric Risk",
                        level = if (isCritical) "Critical" else "Warning",
                        message = drug.geriatricWarning
                    )
                )
                if (isCritical) overallRisk = "Critical"
                else if (overallRisk != "Critical") overallRisk = "Warning"
            }

            if (isFemale && drug.pregnancyWarning != null) {
                val isCritical = drug.pregnancyWarning.contains("CRITICAL")
                alerts.add(
                    MedicationSafetyAlert(
                        drugName = drug.name,
                        type = "Pregnancy/Childbearing Warning",
                        level = if (isCritical) "Critical" else "Warning",
                        message = drug.pregnancyWarning
                    )
                )
                if (isCritical) overallRisk = "Critical"
                else if (overallRisk != "Critical") overallRisk = "Warning"
            }
        }

        val cohort = when {
            isChild -> "Pediatric"
            isElderly -> "Geriatric"
            else -> "Adult"
        }

        return MedicationSafetyReport(alerts, overallRisk, cohort)
    }
}
