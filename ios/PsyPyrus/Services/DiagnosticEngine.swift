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
        
        // 1. Major Depressive Disorder (MDD)
        let hasCoreMdd = mddSymptoms.contains("depressed_mood") || mddSymptoms.contains("anhedonia")
        let hasEnoughMddSymptoms = Set(mddSymptoms).count >= 5
        let meetsMddDuration = durationWeeks >= 2
        
        let noSubstance = exclusions.contains("No physiological substance attribution")
        let noMedical = exclusions.contains("No medical condition attribution")
        let noManic = exclusions.contains("No manic/hypomanic history")
        
        if hasCoreMdd && hasEnoughMddSymptoms && meetsMddDuration && noSubstance && noMedical {
            let confidence = noManic ? "High" : "Moderate (Verify Mania/Hypomania Exclusions)"
            results.append(
                LocalDiagnosticResult(
                    disorderName: "Major Depressive Disorder (MDD)",
                    code: "DSM-5 296.2x / ICD-10 F32.x",
                    confidence: confidence,
                    explanation: "Met 2-week duration with \(mddSymptoms.count) clinical symptoms including core indicators."
                )
            )
        }
        
        // 2. Generalized Anxiety Disorder (GAD)
        let hasCoreGad = gadSymptoms.contains("excessive_anxiety")
        let anxietyIndicators: Set<String> = [
            "restlessness", "fatigue", "concentration_difficulty", "irritability", "muscle_tension", "sleep_disturbance"
        ]
        let matchedGadIndicatorsCount = Set(gadSymptoms).filter { anxietyIndicators.contains($0) }.count
        let meetsGadDuration = durationWeeks >= 26 // 6 months
        
        if hasCoreGad && matchedGadIndicatorsCount >= 3 && meetsGadDuration && noSubstance && noMedical {
            results.append(
                LocalDiagnosticResult(
                    disorderName: "Generalized Anxiety Disorder (GAD)",
                    code: "DSM-5 300.02 / ICD-10 F41.1",
                    confidence: "High",
                    explanation: "Excessive anxiety present for >= 6 months with \(matchedGadIndicatorsCount) somatic/cognitive anxiety symptoms."
                )
            )
        }
        
        return results
    }
}
