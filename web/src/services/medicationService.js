import { Database } from './db';
import { GamificationService } from './gamification';

// Curated psychiatric medication database mapping to standard disorders
export const CLINICAL_DRUGS_DB = {
    "depressive": [
        {
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
        },
        {
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
        }
    ],
    "anxiety": [
        {
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
        },
        {
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
        }
    ],
    "adhd": [
        {
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
        },
        {
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
        }
    ],
    "trauma": [
        {
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
        },
        {
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
        }
    ],
    "bipolar": [
        {
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
        },
        {
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
        }
    ],
    "personality": [
        {
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
        }
    ]
};

export class MedicationService {
    /**
     * Finds drug recommendations based on diagnosed conditions.
     * Maps using case-insensitive substring comparisons.
     * 
     * @param {string[]} diagnoses - Array of diagnostic names (e.g. ["Major Depressive Disorder (MDD), Single Episode"])
     * @returns {Array} List of matching drug recommendations
     */
    static getRecommendationsForDisorders(diagnoses) {
        if (!diagnoses || diagnoses.length === 0) return [];
        
        const recommendations = [];
        const addedIds = new Set();

        diagnoses.forEach(diagName => {
            const nameLower = diagName.toLowerCase();
            let matchedCategory = null;

            if (nameLower.includes("depres") || nameLower.includes("mood")) {
                matchedCategory = "depressive";
            } else if (nameLower.includes("anxi") || nameLower.includes("panic") || nameLower.includes("phobia")) {
                matchedCategory = "anxiety";
            } else if (nameLower.includes("adhd") || nameLower.includes("hyperactivity") || nameLower.includes("attention")) {
                matchedCategory = "adhd";
            } else if (nameLower.includes("ptsd") || nameLower.includes("trauma") || nameLower.includes("stress")) {
                matchedCategory = "trauma";
            } else if (nameLower.includes("bipolar") || nameLower.includes("manic")) {
                matchedCategory = "bipolar";
            } else if (nameLower.includes("borderline") || nameLower.includes("personality")) {
                matchedCategory = "personality";
            }

            if (matchedCategory && CLINICAL_DRUGS_DB[matchedCategory]) {
                CLINICAL_DRUGS_DB[matchedCategory].forEach(drug => {
                    if (!addedIds.has(drug.id)) {
                        addedIds.add(drug.id);
                        recommendations.push({
                            ...drug,
                            originatingDiagnosis: diagName
                        });
                    }
                });
            }
        });

        return recommendations;
    }

    /**
     * Evaluates a list of selected drugs for a patient's age and gender to flag safety alerts.
     * 
     * @param {number} age - Patient's age
     * @param {string} gender - Patient's gender ('Male' or 'Female')
     * @param {Array} selectedDrugs - Array of selected drug objects
     * @returns {Object} Safety report containing alerts, level, and cohort
     */
    static runSafetyAudit(age, gender, selectedDrugs) {
        if (!selectedDrugs || selectedDrugs.length === 0) {
            return {
                alerts: [],
                overallRisk: "None",
                cohort: age < 18 ? "Pediatric" : age > 65 ? "Geriatric" : "Adult"
            };
        }

        const alerts = [];
        let overallRisk = "None";

        const isChild = age < 18;
        const isElderly = age >= 65;
        const isFemale = gender && gender.toLowerCase() === "female";

        selectedDrugs.forEach(drug => {
            if (isChild && drug.pediatricWarning) {
                const isCritical = drug.pediatricWarning.includes("CRITICAL");
                alerts.push({
                    drugName: drug.name,
                    type: "Pediatric Risk",
                    level: isCritical ? "Critical" : "Warning",
                    message: drug.pediatricWarning
                });
                if (isCritical) overallRisk = "Critical";
                else if (overallRisk !== "Critical") overallRisk = "Warning";
            }

            if (isElderly && drug.geriatricWarning) {
                const isCritical = drug.geriatricWarning.includes("CRITICAL");
                alerts.push({
                    drugName: drug.name,
                    type: "Geriatric Risk",
                    level: isCritical ? "Critical" : "Warning",
                    message: drug.geriatricWarning
                });
                if (isCritical) overallRisk = "Critical";
                else if (overallRisk !== "Critical") overallRisk = "Warning";
            }

            if (isFemale && drug.pregnancyWarning) {
                const isCritical = drug.pregnancyWarning.includes("CRITICAL");
                alerts.push({
                    drugName: drug.name,
                    type: "Pregnancy/Childbearing Warning",
                    level: isCritical ? "Critical" : "Warning",
                    message: drug.pregnancyWarning
                });
                if (isCritical) overallRisk = "Critical";
                else if (overallRisk !== "Critical") overallRisk = "Warning";
            }
        });

        return {
            alerts,
            overallRisk,
            cohort: isChild ? "Pediatric" : isElderly ? "Geriatric" : "Adult"
        };
    }

    /**
     * Simulates submitting a digital prescription to the ABDM Health Locker / Gateway.
     * Records transaction details, writes to local audit log, and awards professional XP.
     * 
     * @param {Object} payload - The prescription payload details
     * @param {number} payload.patientId - ID of the patient
     * @param {string} payload.patientName - Name of the patient
     * @param {string} [payload.abhaNumber] - ABHA number
     * @param {Array} payload.medications - List of medications drafted
     * @param {string} payload.clinicalJustification - Explanation justification note
     * @returns {Promise<Object>} Mock receipt of ABDM submission
     */
    static async syncPrescriptionToAbdm(payload) {
        const { patientId, patientName, abhaNumber = "N/A", medications = [], clinicalJustification = "" } = payload;
        
        // Ensure some medications are selected
        if (medications.length === 0) {
            throw new Error("Cannot dispatch an empty prescription.");
        }

        // Generate Transaction details
        const transactionId = "TXN-" + Math.floor(10000000 + Math.random() * 90000000);
        const linkToken = "LNK-" + Math.floor(100000 + Math.random() * 900000);
        const timestamp = new Date().toISOString();

        // 1. Write structured prescription to IndexedDB / localStorage mock
        const abdmRecord = {
            transactionId,
            patientId,
            patientName,
            abhaNumber,
            medications: medications.map(m => ({ name: m.name, salt: m.name, dose: m.dosage, indianBrand: m.indianBrands })),
            clinicalJustification,
            timestamp,
            registryStatus: "LINKED_AND_DISPATCHED",
            digitalSignature: "SHA256withRSA/DrBrewster_PsyPyrusSigningKey"
        };

        // Save in localStorage as a sub-record of patients (or care history)
        const allIntakes = JSON.parse(localStorage.getItem('psypyrus_intake_forms') || '[]');
        allIntakes.push({
            id: 'rx_' + Date.now(),
            patientId,
            type: 'PrescriptionRecord',
            data: abdmRecord,
            timestamp: Date.now()
        });
        localStorage.setItem('psypyrus_intake_forms', JSON.stringify(allIntakes));
        
        // 2. Write to compliance Audit Log
        const drugListStr = medications.map(m => `${m.name} (${m.usBrand})`).join(", ");
        Database.logAudit(
            "ABDM Health Document Dispatch",
            `Signed Prescription dispatched to ABHA/ABDM Gateway for patient ${patientName} (ABHA: ${abhaNumber}). Drugs: ${drugListStr}. Secured under TLS-1.3 Envelope Encryption.`
        );

        // 3. Award XP/Coins to the Practitioner
        GamificationService.awardXp('Professional', 35, 'Dispatched Digital Rx to ABDM Sandbox');
        GamificationService.awardCoins('Professional', 10, 'ABDM Prescription Sync');

        return {
            transactionId,
            registryStatus: "LINKED_AND_DISPATCHED",
            linkToken,
            timestamp,
            patientName,
            abhaNumber,
            recordsDispatchedCount: medications.length
        };
    }
}
