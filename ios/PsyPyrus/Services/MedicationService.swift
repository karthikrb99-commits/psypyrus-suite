import Foundation

public struct ClinicalDrug: Identifiable, Codable {
    public var id: String
    public var name: String
    public var usBrand: String
    public var indianBrands: String
    public var indianPrice: String
    public var dosage: String
    public var sideEffects: [String]
    public var precautions: String
    public var pediatricWarning: String?
    public var geriatricWarning: String?
    public var pregnancyWarning: String?
    public var originatingDiagnosis: String?
}

public struct MedicationSafetyAlert: Identifiable, Codable {
    public var id: UUID
    public var drugName: String
    public var type: String
    public var level: String // "Critical", "Warning"
    public var message: String
    
    public init(id: UUID = UUID(), drugName: String, type: String, level: String, message: String) {
        self.id = id
        self.drugName = drugName
        self.type = type
        self.level = level
        self.message = message
    }
}

public struct MedicationSafetyReport: Codable {
    public var alerts: [MedicationSafetyAlert]
    public var overallRisk: String // "Critical", "Warning", "None"
    public var cohort: String // "Pediatric", "Geriatric", "Adult"
}

public struct AbdmSyncReceipt: Codable {
    public var transactionId: String
    public var registryStatus: String // "LINKED_AND_DISPATCHED"
    public var linkToken: String
    public var timestamp: String
    public var patientName: String
    public var abhaNumber: String
    public var recordsDispatchedCount: Int
}

public class MedicationService {
    
    public static let drugsDb: [String: [ClinicalDrug]] = [
        "depressive": [
            ClinicalDrug(
                id: "mdd-sertraline",
                name: "Sertraline",
                usBrand: "Zoloft",
                indianBrands: "Zosert (Sun Pharma), Sertima (Torrent), Daxid (Pfizer India)",
                indianPrice: "₹75 - ₹110 per strip (10 tabs)",
                dosage: "50mg once daily in the morning, titrated up to 200mg max if indicated.",
                sideEffects: ["Nausea", "Insomnia", "Dry mouth", "Sexual dysfunction", "Diarrhea", "Increased sweating"],
                precautions: "Do not stop abruptly due to discontinuation syndrome. Avoid concurrent use of MAOIs. Monitor for Serotonin Syndrome.",
                pediatricWarning: "CRITICAL ALERT: Boxed warning for increased risk of suicidal ideation and behavior in pediatric and adolescent patients (ages 6-17). Strict weekly monitoring required.",
                geriatricWarning: "WARNING: High risk of SIADH and hyponatremia in geriatric cohorts (age > 65). Monitor sodium levels regularly. Start with a lower dose (e.g. 25mg daily).",
                pregnancyWarning: "Category C. SSRI exposure in late pregnancy may increase risk of persistent pulmonary hypertension of the newborn (PPHN)."
            ),
            ClinicalDrug(
                id: "mdd-escitalopram",
                name: "Escitalopram",
                usBrand: "Lexapro",
                indianBrands: "Nexito (Torrent), Cilentra (Sun Pharma), Estop (Alkem)",
                indianPrice: "₹60 - ₹95 per strip (10 tabs)",
                dosage: "10mg once daily in the morning or bedtime, max 20mg daily.",
                sideEffects: ["Nausea", "Headache", "Somnolence", "Ejaculatory delay", "Fatigue", "Increased appetite"],
                precautions: "Monitor for QTc prolongation at higher doses. Avoid concurrent use of other serotonergic agents.",
                pediatricWarning: "CRITICAL ALERT: Monitor closely for treatment-emergent suicidality. Approved for adolescents aged 12-17.",
                geriatricWarning: "WARNING: Clearance decreased in the elderly. Recommended maximum dose is 10mg daily. Monitor for hyponatremia.",
                pregnancyWarning: "Category C. Standard monitoring for neonatal adaptation syndrome post-delivery."
            )
        ],
        "anxiety": [
            ClinicalDrug(
                id: "gad-escitalopram",
                name: "Escitalopram",
                usBrand: "Lexapro",
                indianBrands: "Nexito (Torrent), Cilentra (Sun Pharma)",
                indianPrice: "₹60 - ₹95 per strip (10 tabs)",
                dosage: "10mg once daily, titrated to 20mg after 1-2 weeks if necessary.",
                sideEffects: ["Nausea", "Drowsiness", "Dry mouth", "Sweating", "Anorgasmia"],
                precautions: "Check baseline ECG in patients with risk factors for QT prolongation.",
                pediatricWarning: "WARNING: Safety and efficacy not established in pediatric GAD patients under 12.",
                geriatricWarning: "WARNING: Initiate at 5mg daily. Geriatric patients are more sensitive to hyponatremia and balance impairment.",
                pregnancyWarning: "Category C. Weigh maternal benefits against potential mild neonatal withdrawal risks."
            ),
            ClinicalDrug(
                id: "gad-buspirone",
                name: "Buspirone",
                usBrand: "Buspar",
                indianBrands: "Buspin (Intas), Buscalm (Wockhardt)",
                indianPrice: "₹45 - ₹70 per strip (10 tabs)",
                dosage: "15mg daily (7.5mg twice daily), increase by 5mg daily every 2-3 days, max 60mg daily.",
                sideEffects: ["Dizziness", "Nausea", "Headache", "Nervousness", "Excitement", "Lightheadedness"],
                precautions: "Does not exhibit cross-tolerance with benzodiazepines; will not alleviate benzodiazepine withdrawal.",
                pediatricWarning: "WARNING: Not approved for pediatric patients under 18 due to lack of trials.",
                geriatricWarning: "SAFE ALTERNATIVE: Beers Criteria preferred non-benzodiazepine anxiolytic. No significant dosage adjustment required; monitor renal function.",
                pregnancyWarning: "Category B. No evidence of fetal risk in animal studies, but clinical data in pregnant women is limited."
            )
        ],
        "adhd": [
            ClinicalDrug(
                id: "adhd-methylphenidate",
                name: "Methylphenidate (Extended Release)",
                usBrand: "Ritalin LA / Concerta",
                indianBrands: "Inspiral SR (Torrent), Addwize OD (Sun Pharma)",
                indianPrice: "₹180 - ₹260 per strip (10 tabs)",
                dosage: "18mg once daily in the morning, titrated weekly by 18mg increments up to 72mg max.",
                sideEffects: ["Appetite suppression", "Insomnia", "Tachycardia", "Dry mouth", "Headache", "Irritability"],
                precautions: "Schedule II Controlled Substance (India Schedule H1/X). Monitor heart rate and blood pressure. Avoid in severe anxiety, tics, or glaucoma.",
                pediatricWarning: "WARNING: Approved for ages 6 and older. Monitor height and weight growth curves quarterly.",
                geriatricWarning: "CRITICAL ALERT: Beers Criteria warning. Stimulants should be avoided in older adults with cardiovascular disease, history of arrhythmias, or severe hypertension.",
                pregnancyWarning: "Category C. Association with increased risk of cardiovascular malformations in some registry trials."
            ),
            ClinicalDrug(
                id: "adhd-atomoxetine",
                name: "Atomoxetine",
                usBrand: "Strattera",
                indianBrands: "Attentrol (Sun Pharma), Axepta (Torrent)",
                indianPrice: "₹120 - ₹180 per strip (10 tabs)",
                dosage: "40mg daily in the morning, increase to 80mg after 3 days, max 100mg daily.",
                sideEffects: ["Decreased appetite", "Dry mouth", "Nausea", "Erectile dysfunction", "Fatigue", "Urinary hesitation"],
                precautions: "Non-stimulant alternative. Monitor liver function parameters. Monitor heart rate.",
                pediatricWarning: "CRITICAL ALERT: Boxed warning for increased risk of suicidal ideation in children. Monitor closely for behavioral changes.",
                geriatricWarning: "WARNING: Half-life may be prolonged. Use caution in geriatric patients with cardiac history.",
                pregnancyWarning: "Category C. Limited human data available."
            )
        ],
        "trauma": [
            ClinicalDrug(
                id: "ptsd-sertraline",
                name: "Sertraline",
                usBrand: "Zoloft",
                indianBrands: "Zosert (Sun Pharma), Sertima (Torrent)",
                indianPrice: "₹75 - ₹110 per strip (10 tabs)",
                dosage: "25mg daily for 1 week, then increase to 50mg daily, max 200mg.",
                sideEffects: ["Nausea", "Sexual dysfunction", "Insomnia", "Tremor", "Diarrhea"],
                precautions: "Avoid abrupt withdrawal. First-line pharmacotherapy for PTSD.",
                pediatricWarning: "CRITICAL ALERT: Boxed warning for pediatric suicidal ideation. Standard adolescent monitoring required.",
                geriatricWarning: "WARNING: Higher susceptibility to hyponatremia. Monitor cognitive state and serum sodium.",
                pregnancyWarning: "Category C. Potential neonatal adaptation syndrome."
            ),
            ClinicalDrug(
                id: "ptsd-prazosin",
                name: "Prazosin",
                usBrand: "Minipress",
                indianBrands: "Prasopress (Ipca), Minipress XL (Pfizer India)",
                indianPrice: "₹55 - ₹90 per strip (10 tabs)",
                dosage: "1mg at bedtime to start; titrate gradually up to 5mg-10mg for nightmares.",
                sideEffects: ["Orthostatic hypotension", "Dizziness", "Palpitations", "Headache", "Nasal congestion", "Weakness"],
                precautions: "Risk of first-dose syncope. Warn patients to rise slowly. Avoid concurrent phosphodiesterase-5 inhibitors.",
                pediatricWarning: "WARNING: Efficacy and safety profiles not systematically evaluated in pediatric trauma.",
                geriatricWarning: "CRITICAL ALERT: Beers Criteria warning. High risk of orthostatic hypotension and syncope in older adults. Significant falls risk. Start at 0.5mg.",
                pregnancyWarning: "Category C. Crossing placenta has been shown; monitor fetal cardiac rates if used in late term."
            )
        ],
        "bipolar": [
            ClinicalDrug(
                id: "bip-lithium",
                name: "Lithium Carbonate",
                usBrand: "Lithobid",
                indianBrands: "Licab (Torrent), Lithosun (Sun Pharma)",
                indianPrice: "₹35 - ₹65 per strip (10 tabs)",
                dosage: "300mg two to three times daily. Target therapeutic blood levels: 0.6 to 1.2 mEq/L.",
                sideEffects: ["Hand tremor", "Polyuria", "Polydipsia", "Nausea", "Weight gain", "Hypothyroidism", "Cognitive dulling"],
                precautions: "Narrow therapeutic index. Requires regular serum level checks, renal and thyroid monitoring.",
                pediatricWarning: "WARNING: Approved for ages 7 and older. Monitor thyroid function closely.",
                geriatricWarning: "CRITICAL ALERT: Renal clearance is significantly reduced. Target lower serum levels (0.5-0.8 mEq/L) to prevent neurotoxicity.",
                pregnancyWarning: "Category D. Known risk of Ebstein's anomaly in the first trimester. Monitor fetal echocardiography."
            ),
            ClinicalDrug(
                id: "bip-valproate",
                name: "Valproic Acid / Divalproex Sodium",
                usBrand: "Depakote",
                indianBrands: "Valparin (Sanofi India), Depakene (Abbott India)",
                indianPrice: "₹85 - ₹140 per strip (10 tabs)",
                dosage: "250mg twice daily, titrate rapidly to therapeutic serum levels: 50 to 125 mcg/mL.",
                sideEffects: ["Nausea", "Hair loss (alopecia)", "Weight gain", "Tremor", "Thrombocytopenia", "Hepatic dysfunction"],
                precautions: "Requires liver function test (LFT) and complete blood count (CBC) monitoring.",
                pediatricWarning: "CRITICAL ALERT: Hepatotoxicity warning. Children under 2 are at exceptionally high risk of fatal hepatotoxicity.",
                geriatricWarning: "WARNING: Reduce initial dosage. Monitor nutritional intake, somnolence, and dehydration parameters.",
                pregnancyWarning: "CRITICAL ALERT: Category D/X. Major teratogen. High risk of neural tube defects (e.g. spina bifida). Avoid in females of childbearing potential unless absolutely necessary."
            )
        ],
        "personality": [
            ClinicalDrug(
                id: "bpd-lamotrigine",
                name: "Lamotrigine",
                usBrand: "Lamictal",
                indianBrands: "Lametec (Cipla), Lamez (Intas)",
                indianPrice: "₹90 - ₹150 per strip (10 tabs)",
                dosage: "25mg daily for 2 weeks, then 50mg daily for 2 weeks, slow titration up to 100-200mg maintenance.",
                sideEffects: ["Headache", "Dizziness", "Somnolence", "Double vision", "Rash", "Nausea"],
                precautions: "Discontinue at first sign of rash due to life-threatening Stevens-Johnson Syndrome (SJS) risk.",
                pediatricWarning: "CRITICAL ALERT: Risk of severe, life-threatening rash (SJS/TEN) is significantly higher in pediatric patients.",
                geriatricWarning: "WARNING: Start at lowest end of titration schedule. Geriatric patients are at higher risk of coordination issues.",
                pregnancyWarning: "Category C. Cleared faster during pregnancy; dosages may require adjustment."
            )
        ]
    ]

    public static func getRecommendations(diagnoses: [String]) -> [ClinicalDrug] {
        var recommendations: [ClinicalDrug] = []
        var addedIds = Set<String>()
        
        for diagnosis in diagnoses {
            let nameLower = diagnosis.lowercased()
            var matchedCategory: String? = nil
            
            if nameLower.contains("depres") || nameLower.contains("mood") {
                matchedCategory = "depressive"
            } else if nameLower.contains("anxi") || nameLower.contains("panic") || nameLower.contains("phobia") {
                matchedCategory = "anxiety"
            } else if nameLower.contains("adhd") || nameLower.contains("hyperactivity") || nameLower.contains("attention") {
                matchedCategory = "adhd"
            } else if nameLower.contains("ptsd") || nameLower.contains("trauma") || nameLower.contains("stress") {
                matchedCategory = "trauma"
            } else if nameLower.contains("bipolar") || nameLower.contains("manic") {
                matchedCategory = "bipolar"
            } else if nameLower.contains("borderline") || nameLower.contains("personality") {
                matchedCategory = "personality"
            }
            
            if let cat = matchedCategory, let drugs = drugsDb[cat] {
                for drug in drugs {
                    if !addedIds.contains(drug.id) {
                        addedIds.insert(drug.id)
                        var drugWithDiag = drug
                        drugWithDiag.originatingDiagnosis = diagnosis
                        recommendations.append(drugWithDiag)
                    }
                }
            }
        }
        
        return recommendations
    }

    public static func runSafetyAudit(age: Int, gender: String, selectedDrugs: [ClinicalDrug]) -> MedicationSafetyReport {
        var alerts: [MedicationSafetyAlert] = []
        var overallRisk = "None"
        
        let isChild = age < 18
        let isElderly = age >= 65
        let isFemale = gender.lowercased() == "female"
        
        for drug in selectedDrugs {
            if isChild, let warning = drug.pediatricWarning {
                let isCritical = warning.contains("CRITICAL")
                alerts.append(MedicationSafetyAlert(
                    drugName: drug.name,
                    type: "Pediatric Risk",
                    level: isCritical ? "Critical" : "Warning",
                    message: warning
                ))
                if isCritical { overallRisk = "Critical" }
                else if overallRisk != "Critical" { overallRisk = "Warning" }
            }
            
            if isElderly, let warning = drug.geriatricWarning {
                let isCritical = warning.contains("CRITICAL")
                alerts.append(MedicationSafetyAlert(
                    drugName: drug.name,
                    type: "Geriatric Risk",
                    level: isCritical ? "Critical" : "Warning",
                    message: warning
                ))
                if isCritical { overallRisk = "Critical" }
                else if overallRisk != "Critical" { overallRisk = "Warning" }
            }
            
            if isFemale, let warning = drug.pregnancyWarning {
                let isCritical = warning.contains("CRITICAL")
                alerts.append(MedicationSafetyAlert(
                    drugName: drug.name,
                    type: "Pregnancy/Childbearing Warning",
                    level: isCritical ? "Critical" : "Warning",
                    message: warning
                ))
                if isCritical { overallRisk = "Critical" }
                else if overallRisk != "Critical" { overallRisk = "Warning" }
            }
        }
        
        let cohort = isChild ? "Pediatric" : (isElderly ? "Geriatric" : "Adult")
        return MedicationSafetyReport(alerts: alerts, overallRisk: overallRisk, cohort: cohort)
    }
}
