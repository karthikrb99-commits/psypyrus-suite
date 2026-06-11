import SwiftUI

public struct HitopMatrixExplorerView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    
    @State private var activeTab = "Dimensions" // "Dimensions" or "EHR Questionnaire"
    @State private var sandboxTab = "RDF" // "RDF" or "Cypher"
    @State private var selectedSpectrum = "Internalizing"
    
    // B-HiTOP Questionnaire state (Subset of 12 items for guide)
    @State private var answers: [Int: Int] = [
        1: 1, 6: 1, 7: 1, 8: 1, 11: 1, 15: 1, 18: 1, 22: 1, 28: 1, 32: 1, 38: 1, 44: 1
    ]
    
    // Sample B-HiTOP items
    private let sampleItems = [
        (id: 8, text: "My moods were intense and unpredictable.", scale: "Internalizing"),
        (id: 44, text: "I was overwhelmed by anxiety.", scale: "Internalizing"),
        (id: 6, text: "I felt something was wrong with my body.", scale: "Somatoform"),
        (id: 7, text: "I chose to be alone rather than with other people.", scale: "Detachment"),
        (id: 11, text: "I felt like I was outside of my body.", scale: "Thought Disorder"),
        (id: 28, text: "I heard things that no one else could hear.", scale: "Thought Disorder"),
        (id: 15, text: "I had trouble planning and keeping to schedules.", scale: "Disinhibition"),
        (id: 32, text: "I said things without thinking.", scale: "Disinhibition"),
        (id: 1, text: "I found it easy to deceive others.", scale: "Antagonism"),
        (id: 22, text: "I was disgusted with myself.", scale: "Internalizing"),
        (id: 38, text: "I had trouble telling whether something really happened or I just imagined it.", scale: "Thought Disorder"),
        (id: 18, text: "Even when I was very careful, I worried whether I had done something correctly.", scale: "Internalizing")
    ]
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // Header Bar
            HStack(spacing: 12) {
                Image(systemName: "sitemap.fill")
                    .foregroundColor(PremiumTheme.clinicianPrimary)
                    .font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text("HiTOP Clinical Taxonomy Matrix")
                        .font(.title3)
                        .fontWeight(.bold)
                    Text("Quantitative Dimensional Classification & Semantic Web Sandbox")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
                Spacer()
                
                StatusBadge(text: "HIPAA Audit Active", type: .success)
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            // Tab Selector
            Picker("Tabs", selection: $activeTab) {
                Text("Dimensions & Recommendations").tag("Dimensions")
                Text("B-HiTOP Assessment Form").tag("EHR Questionnaire")
            }
            .pickerStyle(SegmentedPickerStyle())
            
            if activeTab == "Dimensions" {
                dimensionsTabContent
            } else {
                questionnaireTabContent
            }
            
            Spacer()
        }
        .onAppear {
            initializeElevationsIfNeeded()
        }
    }
    
    private func initializeElevationsIfNeeded() {
        if viewModel.hitopDimensions.isEmpty {
            viewModel.updateHitopDimension(dimension: "Internalizing", value: 2.8)
            viewModel.updateHitopDimension(dimension: "Somatoform", value: 1.5)
            viewModel.updateHitopDimension(dimension: "Detachment", value: 2.1)
            viewModel.updateHitopDimension(dimension: "Thought Disorder", value: 1.2)
            viewModel.updateHitopDimension(dimension: "Disinhibition", value: 3.1)
            viewModel.updateHitopDimension(dimension: "Antagonism", value: 1.4)
            viewModel.updateHitopDimension(dimension: "p-Factor", value: 2.3)
        }
    }
    
    // MARK: - Dimensions & Recommendations Tab
    private var dimensionsTabContent: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                
                // Sliders panel
                GlassmorphicCard(isLight: viewModel.theme == "light") {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("Active Dimensional Profile (1.0 to 4.0 scale)")
                            .font(.headline)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                        
                        let spectra = [
                            ("Internalizing", "brain", Color.red),
                            ("Somatoform", "heart.text.square.fill", Color.pink),
                            ("Detachment", "person.slash.fill", Color.purple),
                            ("Thought Disorder", "cloud.rainbow.half", Color.blue),
                            ("Disinhibition", "bolt.fill", Color.green),
                            ("Antagonism", "hand.thumbsdown.fill", Color.orange),
                            ("p-Factor", "circle.dashed.inset.filled", Color.cyan)
                        ]
                        
                        ForEach(spectra, id: \.0) { specName, icon, color in
                            let val = viewModel.hitopDimensions[specName] ?? 1.0
                            let percent = Int(((val - 1.0) / 3.0) * 100)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Image(systemName: icon)
                                        .foregroundColor(color)
                                    Text(specName)
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                    Spacer()
                                    Text(String(format: "%.2f (Elevation: %d%%)", val, percent))
                                        .font(.caption)
                                        .fontWeight(.bold)
                                        .foregroundColor(color)
                                }
                                
                                Slider(value: Binding(
                                    get: { val },
                                    set: { viewModel.updateHitopDimension(dimension: specName, value: $0) }
                                ), in: 1.0...4.0, step: 0.1)
                                .accentColor(color)
                            }
                        }
                    }
                }
                
                // Recommendations Card
                GlassmorphicCard(isLight: viewModel.theme == "light") {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Dynamic Clinical Recommendations")
                            .font(.headline)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                        
                        let recommendations = getRecommendations()
                        if recommendations.isEmpty {
                            Text("No major dimensional elevations found. Standard therapy plans apply.")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .italic()
                        } else {
                            ForEach(recommendations, id: \.title) { rec in
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Text(rec.scale)
                                            .font(.caption2)
                                            .fontWeight(.bold)
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(rec.color.opacity(0.15))
                                            .foregroundColor(rec.color)
                                            .cornerRadius(4)
                                        Text(rec.title)
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                    }
                                    
                                    Text(rec.text)
                                        .font(.caption)
                                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                                        .lineLimit(nil)
                                }
                                .padding(8)
                                .background(Color.black.opacity(0.1))
                                .cornerRadius(8)
                            }
                        }
                    }
                }
                
                // Semantic Web Database Sandbox
                GlassmorphicCard(isLight: viewModel.theme == "light") {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Semantic Graph Database Sandbox")
                            .font(.headline)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                        
                        Picker("Sandbox Type", selection: $sandboxTab) {
                            Text("RDF Turtle (.ttl)").tag("RDF")
                            Text("Neo4j Cypher").tag("Cypher")
                        }
                        .pickerStyle(SegmentedPickerStyle())
                        
                        let codeText = (sandboxTab == "RDF") ? generateRdfTurtle() : generateCypherSeed()
                        
                        ScrollView {
                            Text(codeText)
                                .font(.system(.caption, design: .monospaced))
                                .foregroundColor(.cyan)
                                .padding()
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.black.opacity(0.3))
                                .cornerRadius(8)
                        }
                        .frame(height: 150)
                        
                        Button(action: {
                            #if os(iOS)
                            UIPasteboard.general.string = codeText
                            #elseif os(macOS)
                            NSPasteboard.general.clearContents()
                            NSPasteboard.general.setString(codeText, forType: .string)
                            #endif
                            viewModel.logAudit(action: "Exported HiTOP Matrix Schema", details: "Copied \(sandboxTab) dump to clipboard.")
                        }) {
                            HStack {
                                Image(systemName: "doc.on.doc.fill")
                                Text("Copy code to clipboard")
                            }
                            .font(.caption)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(PremiumTheme.clinicianPrimary)
                            .cornerRadius(8)
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - B-HiTOP Assessment Form Tab
    private var questionnaireTabContent: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("B-HiTOP Assessment Form Guide")
                .font(.headline)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            Text("Rate each item based on patient symptom intensity over the past month. Value scale: 1 (Not at all), 2 (A little), 3 (Moderately), 4 (A lot).")
                .font(.caption2)
                .foregroundColor(.gray)
            
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 12) {
                    ForEach(sampleItems, id: \.id) { item in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text("Item \(item.id)")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.gray)
                                Spacer()
                                Text("Scale: \(item.scale)")
                                    .font(.caption2)
                                    .foregroundColor(PremiumTheme.clinicianPrimary)
                            }
                            
                            Text(item.text)
                                .font(.footnote)
                                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                            
                            HStack(spacing: 8) {
                                ForEach(1...4, id: \.self) { val in
                                    Button(action: {
                                        answers[item.id] = val
                                        recalculateFromAnswers()
                                    }) {
                                        Text("\(val)")
                                            .font(.caption2)
                                            .fontWeight(.bold)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 6)
                                            .background(answers[item.id] == val ? PremiumTheme.clinicianPrimary : Color.gray.opacity(0.1))
                                            .foregroundColor(answers[item.id] == val ? .white : .gray)
                                            .cornerRadius(6)
                                    }
                                }
                            }
                        }
                        .padding(10)
                        .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                        .cornerRadius(10)
                    }
                }
            }
            .frame(maxHeight: 320)
            
            HStack {
                Button(action: {
                    answers = [
                        1: 1, 6: 1, 7: 1, 8: 1, 11: 1, 15: 1, 18: 1, 22: 1, 28: 1, 32: 1, 38: 1, 44: 1
                    ]
                    recalculateFromAnswers()
                }) {
                    Text("Clear All")
                        .font(.footnote)
                        .padding()
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Button(action: {
                    let totalScore = answers.values.reduce(0, +)
                    viewModel.addAssessmentScore(
                        patientId: viewModel.selectedPatientId,
                        type: "B-HiTOP Form Guide",
                        score: totalScore,
                        details: "Completed 12-item guideline scoring on iOS client."
                    )
                    viewModel.addClinicianXp(amount: 15)
                }) {
                    Text("Submit B-HiTOP Assessment")
                        .font(.footnote)
                        .fontWeight(.bold)
                        .padding()
                        .foregroundColor(.white)
                        .background(PremiumTheme.clinicianPrimary)
                        .cornerRadius(10)
                }
            }
        }
    }
    
    // MARK: - Recalculate Logic
    private func recalculateFromAnswers() {
        let intAnswers = [answers[8] ?? 1, answers[44] ?? 1, answers[22] ?? 1, answers[18] ?? 1]
        let internalizingVal = Double(intAnswers.reduce(0, +)) / 4.0
        
        let somAnswers = [answers[6] ?? 1]
        let somatoformVal = Double(somAnswers.reduce(0, +)) / 1.0
        
        let detAnswers = [answers[7] ?? 1]
        let detachmentVal = Double(detAnswers.reduce(0, +)) / 1.0
        
        let thgAnswers = [answers[11] ?? 1, answers[28] ?? 1, answers[38] ?? 1]
        let thoughtVal = Double(thgAnswers.reduce(0, +)) / 3.0
        
        let disAnswers = [answers[15] ?? 1, answers[32] ?? 1]
        let disinhibitionVal = Double(disAnswers.reduce(0, +)) / 2.0
        
        let antAnswers = [answers[1] ?? 1]
        let antagonismVal = Double(antAnswers.reduce(0, +)) / 1.0
        
        viewModel.updateHitopDimension(dimension: "Internalizing", value: internalizingVal)
        viewModel.updateHitopDimension(dimension: "Somatoform", value: somatoformVal)
        viewModel.updateHitopDimension(dimension: "Detachment", value: detachmentVal)
        viewModel.updateHitopDimension(dimension: "Thought Disorder", value: thoughtVal)
        viewModel.updateHitopDimension(dimension: "Disinhibition", value: disinhibitionVal)
        viewModel.updateHitopDimension(dimension: "Antagonism", value: antagonismVal)
        
        let allAnswers = Array(answers.values)
        let pFactorVal = Double(allAnswers.reduce(0, +)) / Double(allAnswers.count)
        viewModel.updateHitopDimension(dimension: "p-Factor", value: pFactorVal)
    }
    
    // MARK: - Helpers & Code Generators
    private struct Recommendation {
        let scale: String
        let title: String
        let text: String
        let color: Color
    }
    
    private func getRecommendations() -> [Recommendation] {
        var recs: [Recommendation] = []
        let patient = viewModel.patients.first(where: { $0.id == viewModel.selectedPatientId })
        let pName = patient?.name ?? "Patient"
        
        if (viewModel.hitopDimensions["Internalizing"] ?? 1.0) >= 2.5 {
            recs.append(Recommendation(
                scale: "Internalizing",
                title: "Cognitive Restructuring & SSRI Evaluation",
                text: "Elevated internalizing spectrum for \(pName). Prioritize distress tolerance training, cognitive appraisal pacing, and evaluate standard pharmacotherapy options.",
                color: Color.red
            ))
        }
        if (viewModel.hitopDimensions["Somatoform"] ?? 1.0) >= 2.5 {
            recs.append(Recommendation(
                scale: "Somatoform",
                title: "Somatic Grounding & Biofeedback",
                text: "Somatic symptoms elevated. Incorporate HRV biofeedback breathing, sensory grounding, and interoceptive exposure techniques.",
                color: Color.pink
            ))
        }
        if (viewModel.hitopDimensions["Detachment"] ?? 1.0) >= 2.5 {
            recs.append(Recommendation(
                scale: "Detachment",
                title: "Social Affiliation Pacing",
                text: "Social detachment elevated. Deploy behavior activation with micro-social objectives. Foster therapeutic alliance security.",
                color: Color.purple
            ))
        }
        if (viewModel.hitopDimensions["Thought Disorder"] ?? 1.0) >= 2.5 {
            recs.append(Recommendation(
                scale: "Thought Disorder",
                title: "Reality Testing & Cognitive Pacing",
                text: "Thought disorder spectrum elevated. Engage in structured reality testing. Minimize high cognitive load tasks; establish clear sensory boundaries.",
                color: Color.blue
            ))
        }
        if (viewModel.hitopDimensions["Disinhibition"] ?? 1.0) >= 2.5 {
            recs.append(Recommendation(
                scale: "Disinhibition",
                title: "Executive Function & Response Delay Pacing",
                text: "Disinhibition elevated. Scaffold planning tasks, use external alarm queues, and apply response-cost boundary systems.",
                color: Color.green
            ))
        }
        if (viewModel.hitopDimensions["Antagonism"] ?? 1.0) >= 2.5 {
            recs.append(Recommendation(
                scale: "Antagonism",
                title: "Empathy Training & Interpersonal Regulation",
                text: "Antagonism elevated. Engage in mentalizing exercises, assertiveness contrasts (vs manipulation), and perspective taking modules.",
                color: Color.orange
            ))
        }
        return recs
    }
    
    private func generateRdfTurtle() -> String {
        let pId = viewModel.selectedPatientId
        let patient = viewModel.patients.first(where: { $0.id == pId })
        let pName = patient?.name ?? "Liam Carter"
        
        var triples = """
        @prefix hitop: <http://hitop-taxonomy.org/ontology#> .
        @prefix psypyrus: <http://psypyrus.ai/ontology#> .
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
        
        psypyrus:patient_\(pId) a psypyrus:Patient ;
            psypyrus:hasName "\(pName)"^^xsd:string ;
            hitop:hasPsychopathologyProfile psypyrus:hitop_profile_\(pId) .
            
        psypyrus:hitop_profile_\(pId) a hitop:HiTOPProfile ;
            hitop:dateCompiled "\(ISO8601DateFormatter().string(from: Date()))"^^xsd:dateTime .
        """
        
        let scales = ["Internalizing", "Somatoform", "Detachment", "Thought Disorder", "Disinhibition", "Antagonism"]
        for scale in scales {
            let val = viewModel.hitopDimensions[scale] ?? 1.0
            let elevation = Int(((val - 1.0) / 3.0) * 100)
            triples += """
            
            psypyrus:hitop_profile_\(pId) hitop:hasSpectrumElevation [
                hitop:spectrum hitop:\(scale.replacingOccurrences(of: " ", with: "")) ;
                hitop:meanScore "\(String(format: "%.2f", val))"^^xsd:decimal ;
                hitop:elevationPercent "\(elevation)"^^xsd:integer
            ] .
            """
        }
        
        let pFactorVal = viewModel.hitopDimensions["p-Factor"] ?? 1.0
        let pFactorElevation = Int(((pFactorVal - 1.0) / 3.0) * 100)
        triples += """
        
        psypyrus:hitop_profile_\(pId) hitop:hasSecondaryElevation [
            hitop:scale hitop:pFactor ;
            hitop:meanScore "\(String(format: "%.2f", pFactorVal))"^^xsd:decimal ;
            hitop:elevationPercent "\(pFactorElevation)"^^xsd:integer
        ] .
        """
        
        return triples
    }
    
    private func generateCypherSeed() -> String {
        let pId = viewModel.selectedPatientId
        let patient = viewModel.patients.first(where: { $0.id == pId })
        let pName = patient?.name ?? "Liam Carter"
        let specialty = patient?.specialty ?? "Major Depressive Disorder"
        
        var cypher = """
        // 1. Create Patient & Diagnostic Node
        CREATE (p:Patient {id: \(pId), name: "\(pName)", specialty: "\(specialty)"})
        CREATE (profile:HiTOPProfile {compiledAt: datetime()})
        CREATE (p)-[:HAS_HITOP_PROFILE]->(profile)
        
        // 2. Link Spectra & Elevations
        """
        
        let scales = ["Internalizing", "Somatoform", "Detachment", "Thought Disorder", "Disinhibition", "Antagonism"]
        for scale in scales {
            let val = viewModel.hitopDimensions[scale] ?? 1.0
            let elevation = Int(((val - 1.0) / 3.0) * 100)
            cypher += """
            
            CREATE (s_\(scale.lowercased().replacingOccurrences(of: " ", with: "")):HiTOPSpectrum {name: "\(scale)", score: \(String(format: "%.2f", val)), elevationPercent: \(elevation)})
            CREATE (profile)-[:HAS_SPECTRUM_ELEVATION {severity: \(String(format: "%.2f", val))}]->(s_\(scale.lowercased().replacingOccurrences(of: " ", with: "")))
            """
        }
        
        let pFactorVal = viewModel.hitopDimensions["p-Factor"] ?? 1.0
        let pFactorElevation = Int(((pFactorVal - 1.0) / 3.0) * 100)
        cypher += """
        
        
        // 3. Link General p-Factor
        CREATE (sec_pfactor:HiTOPScale {name: "General p-Factor", score: \(String(format: "%.2f", pFactorVal)), elevationPercent: \(pFactorElevation)})
        CREATE (profile)-[:HAS_SECONDARY_ELEVATION {severity: \(String(format: "%.2f", pFactorVal))}]->(sec_pfactor)
        """
        
        return cypher
    }
}
