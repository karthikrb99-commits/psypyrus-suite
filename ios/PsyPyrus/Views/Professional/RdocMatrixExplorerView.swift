import SwiftUI

public struct RdocMatrixExplorerView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    
    @State private var selectedDomain = "Negative Valence"
    @State private var selectedConstruct = "Anxiety"
    @State private var selectedUnit = "Circuits" // Circuits, Physiology, Behavior, Self-Reports, Paradigms
    @State private var sandboxTab = "RDF" // RDF or Cypher
    
    // Definitions of RDoC domains
    private let domains = [
        (name: "Negative Valence", icon: "exclamationmark.shield.fill", color: Color.red, desc: "Systems responsible for responses to aversive contexts or stimuli, such as fear, anxiety, or sustained threat."),
        (name: "Positive Valence", icon: "heart.fill", color: Color.green, desc: "Systems responsible for responses to positive motivational situations, like reward learning, valuation, and habit."),
        (name: "Cognitive Systems", icon: "brain.head.profile", color: Color.blue, desc: "Responsible for cognitive processes including attention, working memory, perception, and cognitive control."),
        (name: "Social Processes", icon: "person.2.wave.and.curve.fill", color: Color.purple, desc: "Systems mediating social interactions, including affiliation, attachment, and social communication."),
        (name: "Arousal & Regulatory", icon: "sunset.fill", color: Color.orange, desc: "Responsible for homeostatic regulation, circadian rhythms, sleep-wake cycles, and general arousal states."),
        (name: "Sensorimotor Systems", icon: "figure.walk", color: Color.pink, desc: "Responsible for motor action, sensorimotor dynamics, and action selection execution.")
    ]
    
    // Constructs by domain
    private let constructsByDomain: [String: [String]] = [
        "Negative Valence": ["Acute Threat (Fear)", "Potential Threat (Anxiety)", "Sustained Threat", "Loss", "Frustrated Non-reward"],
        "Positive Valence": ["Reward Valuation", "Effort Valuation", "Habit", "Reward Learning"],
        "Cognitive Systems": ["Attention", "Perception", "Working Memory", "Cognitive Control"],
        "Social Processes": ["Affiliation & Attachment", "Social Communication", "Self-Knowledge", "Theory of Mind"],
        "Arousal & Regulatory": ["Arousal", "Circadian Rhythms", "Sleep-Wake Control"],
        "Sensorimotor Systems": ["Motor Planning", "Action Execution", "Sensorimotor Gating"]
    ]
    
    // Units of analysis descriptions for a few constructs
    private func getUnitContent(construct: String, unit: String) -> String {
        switch construct {
        case "Potential Threat (Anxiety)":
            switch unit {
            case "Circuits": return "BNST, amygdala, hippocampus, vmPFC, locus coeruleus"
            case "Physiology": return "HRV decreases, skin conductance elevations, startle potentiation"
            case "Behavior": return "Avoidance, vigilant scanning, safety-seeking behaviors"
            case "Self-Reports": return "Symptom logs, GAD-7 score, distress scale ratings"
            case "Paradigms": return "Threat-anticipation tasks, unpredictable shock escape tasks"
            default: return ""
            }
        case "Loss":
            switch unit {
            case "Circuits": return "sgACC, ventral striatum, orbital frontal cortex, dorsal raphe"
            case "Physiology": return "Cortisol flattening, diminished autonomic arousal"
            case "Behavior": return "Somatic psychomotor retardation, crying, behavioral withdrawal"
            case "Self-Reports": return "PHQ-9 score, helplessness survey response, grief logs"
            case "Paradigms": return "Reward omission task, frustrative non-reward test"
            default: return ""
            }
        case "Reward Learning":
            switch unit {
            case "Circuits": return "VTA, nucleus accumbens, caudate, anterior cingulate cortex"
            case "Physiology": return "Phasic dopamine release, reward-prediction error EPs"
            case "Behavior": return "Instrumental conditioning rates, exploratory behavior"
            case "Self-Reports": return "Anhedonia scale rating, novelty seeking inventory"
            case "Paradigms": return "Probabilistic reward task, reinforcement learning game"
            default: return ""
            }
        default:
            switch unit {
            case "Circuits": return "Prefrontal cortex networks, matching cortical loops"
            case "Physiology": return "Sympathetic/parasympathetic balance changes"
            case "Behavior": return "Approach-avoidance, response delay modifications"
            case "Self-Reports": return "Clinical checklist, subjective distress scores"
            case "Paradigms": return "Standard cognitive testing, behavioral assessment games"
            default: return ""
            }
        }
    }
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            
            // Header Bar
            HStack(spacing: 12) {
                Image(systemName: "dna")
                    .foregroundColor(PremiumTheme.clinicianPrimary)
                    .font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Research Domain Criteria (RDoC) Workspace")
                        .font(.title3)
                        .fontWeight(.bold)
                    Text("Multi-dimensional biological-behavioral diagnostic framework")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
                Spacer()
                
                StatusBadge(text: "RDoC Mapped", type: .info)
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 20) {
                    
                    // Sliders Card
                    GlassmorphicCard(isLight: viewModel.theme == "light") {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Patient Dimensional Biosignature Elevation")
                                .font(.headline)
                                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                            
                            ForEach(domains, id: \.name) { d in
                                let score = viewModel.rdocDomains[d.name] ?? 0.0
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Image(systemName: d.icon)
                                            .foregroundColor(d.color)
                                        Text(d.name)
                                            .font(.subheadline)
                                            .fontWeight(.semibold)
                                        Spacer()
                                        Text("\(Int(score))%")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(d.color)
                                    }
                                    
                                    Slider(value: Binding(
                                        get: { score },
                                        set: { viewModel.updateRdocDomain(domain: d.name, value: $0) }
                                    ), in: 0.0...100.0, step: 5.0)
                                    .accentColor(d.color)
                                }
                            }
                        }
                    }
                    
                    // Active Domain & Construct Matrix Card
                    GlassmorphicCard(isLight: viewModel.theme == "light") {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Interactive Construct Matrix Explorer")
                                .font(.headline)
                                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                            
                            // Domain picker dropdown
                            Picker("Domain", selection: $selectedDomain) {
                                ForEach(domains, id: \.name) { d in
                                    Text(d.name).tag(d.name)
                                }
                            }
                            .pickerStyle(MenuPickerStyle())
                            .padding(.vertical, 4)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            
                            if let domainInfo = domains.first(where: { $0.name == selectedDomain }) {
                                Text(domainInfo.desc)
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                    .lineLimit(nil)
                                    .padding(.bottom, 6)
                                
                                Text("\(selectedDomain) Constructs:")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.gray)
                                
                                let constructs = constructsByDomain[selectedDomain] ?? []
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 8) {
                                        ForEach(constructs, id: \.self) { cons in
                                            let isSelected = selectedConstruct == cons
                                            Button(action: {
                                                selectedConstruct = cons
                                            }) {
                                                Text(cons)
                                                    .font(.caption2)
                                                    .fontWeight(.bold)
                                                    .padding(.horizontal, 10)
                                                    .padding(.vertical, 6)
                                                    .background(isSelected ? domainInfo.color : Color.gray.opacity(0.1))
                                                    .foregroundColor(isSelected ? .white : .gray)
                                                    .cornerRadius(6)
                                            }
                                        }
                                    }
                                }
                                
                                Divider().padding(.vertical, 8)
                                
                                // Unit of analysis
                                Text("Construct Analysis: \(selectedConstruct)")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                
                                Picker("Unit", selection: $selectedUnit) {
                                    Text("Circuits").tag("Circuits")
                                    Text("Physiology").tag("Physiology")
                                    Text("Behavior").tag("Behavior")
                                    Text("Self-Reports").tag("Self-Reports")
                                }
                                .pickerStyle(SegmentedPickerStyle())
                                .padding(.vertical, 4)
                                
                                Text(getUnitContent(construct: selectedConstruct, unit: selectedUnit))
                                    .font(.system(.footnote, design: .monospaced))
                                    .foregroundColor(domainInfo.color)
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.black.opacity(0.2))
                                    .cornerRadius(8)
                            }
                        }
                    }
                    
                    // Recommendations Card
                    GlassmorphicCard(isLight: viewModel.theme == "light") {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Biosignature Treatment Rationale")
                                .font(.headline)
                                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                            
                            let recommendations = getRecommendations()
                            if recommendations.isEmpty {
                                Text("No dysregulations flagged. Regular tracking matches therapy guidelines.")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                    .italic()
                            } else {
                                ForEach(recommendations, id: \.title) { rec in
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack {
                                            Text(rec.domain)
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
                                    }
                                    .padding(8)
                                    .background(Color.black.opacity(0.1))
                                    .cornerRadius(8)
                                }
                            }
                        }
                    }
                    
                    // RDF & Cypher database output
                    GlassmorphicCard(isLight: viewModel.theme == "light") {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("RDoC Ontology Schema Console")
                                .font(.headline)
                                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                            
                            Picker("Console Type", selection: $sandboxTab) {
                                Text("RDF Triples").tag("RDF")
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
                                viewModel.logAudit(action: "Exported RDoC Ontology Schema", details: "Copied \(sandboxTab) dump to clipboard.")
                            }) {
                                HStack {
                                    Image(systemName: "doc.on.doc.fill")
                                    Text("Copy schema to clipboard")
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
        .onAppear {
            initializeElevationsIfNeeded()
        }
    }
    
    private func initializeElevationsIfNeeded() {
        if viewModel.rdocDomains.isEmpty {
            viewModel.updateRdocDomain(domain: "Negative Valence", value: 65.0)
            viewModel.updateRdocDomain(domain: "Positive Valence", value: 30.0)
            viewModel.updateRdocDomain(domain: "Cognitive Systems", value: 45.0)
            viewModel.updateRdocDomain(domain: "Social Processes", value: 50.0)
            viewModel.updateRdocDomain(domain: "Arousal & Regulatory", value: 75.0)
            viewModel.updateRdocDomain(domain: "Sensorimotor Systems", value: 20.0)
        }
    }
    
    // MARK: - Helpers & Recommendations
    private struct Recommendation {
        let domain: String
        let title: String
        let text: String
        let color: Color
    }
    
    private func getRecommendations() -> [Recommendation] {
        var recs: [Recommendation] = []
        let patient = viewModel.patients.first(where: { $0.id == viewModel.selectedPatientId })
        let pName = patient?.name ?? "Liam"
        
        if (viewModel.rdocDomains["Negative Valence"] ?? 0.0) >= 50.0 {
            recs.append(Recommendation(
                domain: "Negative Valence",
                title: "Amygdala/PFC Circuit Desensitization",
                text: "Flagged high threat validation for \(pName). Initiate cognitive restructuring and EMDR grounding exercises targeting ventral circuit hyperactivity.",
                color: Color.red
            ))
        }
        if (viewModel.rdocDomains["Positive Valence"] ?? 0.0) <= 40.0 {
            recs.append(Recommendation(
                domain: "Positive Valence",
                title: "Behavioral Reward Activation Therapy",
                text: "Low positive valence detected. Scaffold daily tasks using Pomodoro goals, log MindCoin rewards to trigger dopaminergic motivation.",
                color: Color.green
            ))
        }
        if (viewModel.rdocDomains["Arousal & Regulatory"] ?? 0.0) >= 60.0 {
            recs.append(Recommendation(
                domain: "Arousal & Regulatory",
                title: "Sleep-Wake Homeostatic Regulation",
                text: "Arousal system dysregulation flagged. Prescribe 10-minute diaphragmatic pacing breathing exercises before sleep and sleep log checks.",
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
        @prefix rdoc: <http://nimh.nih.gov/rdoc/ontology#> .
        @prefix psypyrus: <http://psypyrus.ai/ontology#> .
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
        
        psypyrus:patient_\(pId) a psypyrus:Patient ;
            psypyrus:hasName "\(pName)"^^xsd:string ;
            rdoc:hasRdocProfile psypyrus:rdoc_profile_\(pId) .
            
        psypyrus:rdoc_profile_\(pId) a rdoc:RdocProfile ;
            rdoc:dateCompiled "\(ISO8601DateFormatter().string(from: Date()))"^^xsd:dateTime .
        """
        
        for d in domains {
            let score = viewModel.rdocDomains[d.name] ?? 0.0
            let cleanDomain = d.name.replacingOccurrences(of: " ", with: "").replacingOccurrences(of: "&", with: "")
            triples += """
            
            psypyrus:rdoc_profile_\(pId) rdoc:hasDomainElevation [
                rdoc:domain rdoc:\(cleanDomain) ;
                rdoc:elevationPercent "\(Int(score))"^^xsd:integer
            ] .
            """
        }
        
        return triples
    }
    
    private func generateCypherSeed() -> String {
        let pId = viewModel.selectedPatientId
        let patient = viewModel.patients.first(where: { $0.id == pId })
        let pName = patient?.name ?? "Liam Carter"
        
        var cypher = """
        // 1. Create Patient Node
        CREATE (p:Patient {id: \(pId), name: "\(pName)"})
        CREATE (profile:RdocProfile {compiledAt: datetime()})
        CREATE (p)-[:HAS_RDOC_PROFILE]->(profile)
        
        // 2. Map elevated RDoC constructs & Biological circuits
        """
        
        for d in domains {
            let score = viewModel.rdocDomains[d.name] ?? 0.0
            if score >= 50.0 {
                let cleanDomain = d.name.lowercased().replacingOccurrences(of: " ", with: "").replacingOccurrences(of: "&", with: "")
                cypher += """
                
                CREATE (c_\(cleanDomain):RdocConstruct {name: "\(d.name)", elevation: \(Int(score))})
                CREATE (p)-[:ELEVATED_DYSREGULATION {score: \(Int(score))}]->(c_\(cleanDomain))
                """
            }
        }
        
        return cypher
    }
}
