import Foundation

public struct LocalDiagnosticResult: Identifiable, Codable {
    public var id = UUID()
    public var disorderName: String
    public var code: String
    public var confidence: String // "High", "Moderate", "Low"
    public var explanation: String
    
    public init(disorderName: String, code: String, confidence: String, explanation: String) {
        self.disorderName = disorderName
        self.code = code
        self.confidence = confidence
        self.explanation = explanation
    }
}

public struct SetCriteria {
    let basicCriteria: [String]
    let specificConditions: [String: [String]]
}

public struct DiagnosticEngine {
    
    private static let mockDisorderCriteria: [String: SetCriteria] = [
        "Phantom Disorder": SetCriteria(
            basicCriteria: ["Above 18", "1 year", "Not attributable to Physiological conditions"],
            specificConditions: [
                "PDs1": ["PDss1", "PDss2", "PDss3"],
                "PDs2": ["PDss4", "PDss5", "PDss6"],
                "CD1": ["CDss1", "CDss2"]
            ]
        ),
        "Hypothetical Disorder": SetCriteria(
            basicCriteria: ["Above 21", "6 months", "Not better explained by other Physiological conditions"],
            specificConditions: [
                "HDs1": ["HDss1", "HDss2", "HDss3"],
                "HDs2": ["HDss4", "HDss5", "HDss6"],
                "CD1": ["CDss1", "CDss2"]
            ]
        )
    ]
    
    public static func evaluateMockDisorders(
        basicCriteriaInput: [String],
        specificSymptomsInput: [String]
    ) -> [LocalDiagnosticResult] {
        var results: [LocalDiagnosticResult] = []
        
        for (disorderName, criteria) in mockDisorderCriteria {
            let basic = criteria.basicCriteria
            
            // Check exception criteria (index 2)
            let hasException = basicCriteriaInput.contains(basic[2])
            
            // Check if at least one other basic criteria (index 0 or 1) is met
            let hasOtherBasic = basicCriteriaInput.contains(basic[0]) || basicCriteriaInput.contains(basic[1])
            
            if hasException && hasOtherBasic {
                var matchedSymptomCount = 0
                var totalSymptomCount = 0
                
                for (_, symptoms) in criteria.specificConditions {
                    for symptom in symptoms {
                        totalSymptomCount += 1
                        if specificSymptomsInput.contains(symptom) {
                            matchedSymptomCount += 1
                        }
                    }
                }
                
                // At least 3 symptoms required
                if matchedSymptomCount >= 3 {
                    let ratio = totalSymptomCount > 0 ? Double(matchedSymptomCount) / Double(totalSymptomCount) : 0.0
                    let confidence: String
                    if ratio >= 0.6 {
                        confidence = "High"
                    } else if ratio >= 0.4 {
                        confidence = "Moderate"
                    } else {
                        confidence = "Low"
                    }
                    
                    let code = (disorderName == "Phantom Disorder") ? "MOCK-PHD-01" : "MOCK-HYP-02"
                    results.append(
                        LocalDiagnosticResult(
                            disorderName: disorderName,
                            code: code,
                            confidence: confidence,
                            explanation: "Met basic criteria and matched \(matchedSymptomCount) specific symptoms (Ratio: \(Int(ratio * 100))%)."
                        )
                    )
                }
            }
        }
        
        // Sort by likelihood
        return results.sorted { r1, r2 in
            let w1 = r1.confidence == "High" ? 3 : (r1.confidence == "Moderate" ? 2 : 1)
            let w2 = r2.confidence == "High" ? 3 : (r2.confidence == "Moderate" ? 2 : 1)
            return w1 > w2
        }
    }
    
    public static func evaluateDsm5Disorders(
        mddSymptoms: [String],
        gadSymptoms: [String],
        durationWeeks: Int,
        exclusions: [String]
    ) -> [LocalDiagnosticResult] {
        var results: [LocalDiagnosticResult] = []
        let allSymptoms = Array(Set(mddSymptoms + gadSymptoms))
        
        let noSubstance = exclusions.contains("No physiological substance attribution")
        let noMedical = exclusions.contains("No medical condition attribution")
        let noManic = exclusions.contains("No manic/hypomanic history")
        
        for disorder in DsmDatabase.disorders {
            let matchedSymptoms = disorder.symptomsKeywords.filter { key in
                let mappedKey: String
                switch key {
                case "sadness", "depression", "unhappy", "cry", "hopeless", "depressed_mood":
                    mappedKey = "depressed_mood"
                case "anhedonia", "pleasure loss":
                    mappedKey = "anhedonia"
                case "fatigue", "tired":
                    mappedKey = "fatigue"
                case "sleep", "insomnia", "sleep_disturbance":
                    mappedKey = allSymptoms.contains("insomnia") ? "insomnia" : "sleep_disturbance"
                case "worthless", "guilt", "worthlessness":
                    mappedKey = "worthlessness"
                case "concentration", "concentration_difficulty":
                    mappedKey = "concentration_difficulty"
                case "suicide", "suicidal_ideation":
                    mappedKey = "suicidal_ideation"
                case "weight", "weight_change", "appetite_change":
                    mappedKey = "appetite_change"
                case "psychomotor":
                    mappedKey = "psychomotor"
                case "anxiety", "worry", "stress", "excessive_anxiety":
                    mappedKey = "excessive_anxiety"
                case "restless", "keyed up", "on edge", "restlessness":
                    mappedKey = "restlessness"
                case "irritability":
                    mappedKey = "irritability"
                case "tension", "muscle_tension":
                    mappedKey = "muscle_tension"
                default:
                    mappedKey = key
                }
                return allSymptoms.contains(mappedKey)
            }
            
            let requiredWeeks: Int
            if disorder.name.contains("MDD") {
                requiredWeeks = 2
            } else if disorder.name.contains("GAD") || disorder.name.contains("SAD") || disorder.name.contains("Phobia") {
                requiredWeeks = 26
            } else if disorder.name.contains("PTSD") {
                requiredWeeks = 4
            } else if disorder.name.contains("ADHD") || disorder.name.contains("Bipolar") {
                requiredWeeks = 26
            } else if disorder.name.contains("Acute Stress") {
                requiredWeeks = 1
            } else {
                requiredWeeks = 2
            }
            
            let meetsDuration = durationWeeks >= requiredWeeks
            let hasEnoughSymptoms = matchedSymptoms.count >= disorder.minCriteriaRequired
            
            var passesCoreCheck = true
            if disorder.name.contains("MDD") {
                passesCoreCheck = allSymptoms.contains("depressed_mood") || allSymptoms.contains("anhedonia")
            } else if disorder.name.contains("GAD") {
                passesCoreCheck = allSymptoms.contains("excessive_anxiety")
            }
            
            if hasEnoughSymptoms && meetsDuration && noSubstance && noMedical && passesCoreCheck {
                let confidence: String
                if disorder.name.contains("MDD") && !noManic {
                    confidence = "Moderate (Verify Mania/Hypomania Exclusions)"
                } else {
                    confidence = "High"
                }
                results.append(
                    LocalDiagnosticResult(
                        disorderName: disorder.name,
                        code: "DSM-5 \(disorder.dsmCode) / ICD-10 \(disorder.icd10Code)",
                        confidence: confidence,
                        explanation: "Met duration of \(requiredWeeks) weeks with \(matchedSymptoms.count)/\(disorder.minCriteriaRequired) symptoms matched."
                    )
                )
            }
        }
        
        return results
    }
}
