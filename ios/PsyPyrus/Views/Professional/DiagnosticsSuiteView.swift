import SwiftUI

public struct DiagnosticsSuiteView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    
    // Tab State: "DSM-5", "Mock"
    @State private var mode = "DSM-5"
    
    // DSM-5 MDD symptoms
    @State private var mddSymptomsSelected: Set<String> = []
    // DSM-5 GAD symptoms
    @State private var gadSymptomsSelected: Set<String> = []
    // Exclusions
    @State private var exclusionsSelected: Set<String> = []
    // Duration
    @State private var durationWeeks = 4
    
    // Mock checklist states
    @State private var basicSelected: Set<String> = []
    @State private var specificSelected: Set<String> = []
    
    // Symptom narrative for AI Differential Assistant
    @State private var clinicalNarrative = ""
    
    // ICD-11 Search state
    @State private var icdQuery = ""
    @State private var isSearchingIcd = false
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // Header
            HStack {
                Image(systemName: "waveform.path.ecg")
                    .foregroundColor(PremiumTheme.clinicianPrimary)
                    .font(.title2)
                Text("Diagnostics & Decision Support")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            // Mode Selector
            Picker("Mode Selector", selection: $mode) {
                Text("DSM-5-TR Real").tag("DSM-5")
                Text("Mock Disorders").tag("Mock")
                Text("ICD-11 Search").tag("ICD-11")
            }
            .pickerStyle(SegmentedPickerStyle())
            
            if mode == "DSM-5" {
                dsm5FormSection
            } else if mode == "Mock" {
                mockFormSection
            } else {
                icd11SearchSection
            }
            
            // Evaluator Results Card
            if !viewModel.localDiagnosticResults.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Local Rule Engine Findings")
                        .font(.headline)
                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                    
                    ForEach(viewModel.localDiagnosticResults) { res in
                        GlassmorphicCard(isLight: viewModel.theme == "light") {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(res.disorderName)
                                        .fontWeight(.bold)
                                    Spacer()
                                    StatusBadge(text: "Likelihood: \(res.confidence)", type: res.confidence.contains("High") ? .success : .warning)
                                }
                                .font(.subheadline)
                                
                                Text("Code: \(res.code)")
                                    .font(.system(size: 10))
                                    .foregroundColor(.gray)
                                
                                Text(res.explanation)
                                    .font(.caption2)
                                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                            }
                        }
                    }
                }
            } else {
                Text("No differential diagnoses identified locally. Try selecting more criteria.")
                    .font(.caption2)
                    .foregroundColor(.gray)
                    .padding()
                    .background(Color.black.opacity(0.1))
                    .cornerRadius(8)
            }
            
            // AI Hybrid assistant trigger
            VStack(alignment: .leading, spacing: 12) {
                Text("AI Hybrid Diagnostic Assistant")
                    .font(.headline)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                
                TextField("Enter client raw symptom history details...", text: $clinicalNarrative)
                    .padding()
                    .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                    .cornerRadius(10)
                
                Button(action: {
                    Task {
                        await viewModel.triggerDiagnosticAssistant(
                            symptoms: clinicalNarrative,
                            mseFindings: mode == "DSM-5" ? "DSM evaluation with \(mddSymptomsSelected.count + gadSymptomsSelected.count) symptoms checked." : "Mock evaluation checked."
                        )
                    }
                }) {
                    HStack {
                        if viewModel.isAiLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "wand.and.stars")
                        }
                        Text(viewModel.isAiLoading ? "Processing differential report..." : "Synthesize Differential Report")
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(PremiumTheme.clinicianPrimary)
                    .cornerRadius(12)
                }
                .disabled(viewModel.isAiLoading || clinicalNarrative.isEmpty)
            }
            
            // AI Result Report
            if !viewModel.aiResultText.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text("AI Differential Report")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                    
                    ScrollView {
                        Text(viewModel.aiResultText)
                            .font(.system(size: 11))
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(viewModel.theme == "light" ? Color(red: 240/255, green: 244/255, blue: 250/255) : Color.black.opacity(0.3))
                            .cornerRadius(10)
                    }
                    .frame(height: 200)
                }
                .padding()
                .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                .cornerRadius(12)
            }
        }
    }
    
    // DSM-5 checkboxes
    private var dsm5FormSection: View {
        VStack(alignment: .leading, spacing: 12) {
            
            // MDD Symptoms
            Text("DSM-5 MDD Symptoms Checklist (PHQ-9 indicators)")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.gray)
            
            VStack(alignment: .leading, spacing: 6) {
                toggleRow(title: "Depressed mood (Core symptom)", isSelected: mddSymptomsSelected.contains("depressed_mood")) {
                    toggleSymptom(set: &mddSymptomsSelected, val: "depressed_mood")
                }
                toggleRow(title: "Anhedonia / Loss of Interest (Core)", isSelected: mddSymptomsSelected.contains("anhedonia")) {
                    toggleSymptom(set: &mddSymptomsSelected, val: "anhedonia")
                }
                toggleRow(title: "Fatigue or Low Energy", isSelected: mddSymptomsSelected.contains("fatigue")) {
                    toggleSymptom(set: &mddSymptomsSelected, val: "fatigue")
                }
                toggleRow(title: "Sleep Disturbance (Insomnia/Hypersomnia)", isSelected: mddSymptomsSelected.contains("sleep_disturbance")) {
                    toggleSymptom(set: &mddSymptomsSelected, val: "sleep_disturbance")
                }
                toggleRow(title: "Worthlessness or Excessive Guilt", isSelected: mddSymptomsSelected.contains("worthlessness")) {
                    toggleSymptom(set: &mddSymptomsSelected, val: "worthlessness")
                }
                toggleRow(title: "Concentration or Focus Difficulty", isSelected: mddSymptomsSelected.contains("concentration_difficulty")) {
                    toggleSymptom(set: &mddSymptomsSelected, val: "concentration_difficulty")
                }
                toggleRow(title: "Suicidal Ideation or Plan", isSelected: mddSymptomsSelected.contains("suicidal_ideation")) {
                    toggleSymptom(set: &mddSymptomsSelected, val: "suicidal_ideation")
                }
            }
            .padding()
            .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
            .cornerRadius(12)
            
            // GAD Symptoms
            Text("DSM-5 GAD Somatic Indicators Checklist")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.gray)
            
            VStack(alignment: .leading, spacing: 6) {
                toggleRow(title: "Excessive Anxiety & Worry (Core)", isSelected: gadSymptomsSelected.contains("excessive_anxiety")) {
                    toggleSymptom(set: &gadSymptomsSelected, val: "excessive_anxiety")
                }
                toggleRow(title: "Muscle Tension & Epigastric Tightness", isSelected: gadSymptomsSelected.contains("muscle_tension")) {
                    toggleSymptom(set: &gadSymptomsSelected, val: "muscle_tension")
                }
                toggleRow(title: "Restlessness or Scanning", isSelected: gadSymptomsSelected.contains("restlessness")) {
                    toggleSymptom(set: &gadSymptomsSelected, val: "restlessness")
                }
                toggleRow(title: "Irritability", isSelected: gadSymptomsSelected.contains("irritability")) {
                    toggleSymptom(set: &gadSymptomsSelected, val: "irritability")
                }
            }
            .padding()
            .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
            .cornerRadius(12)
            
            // Exclusions
            Text("DSM Exclusion Parameters")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.gray)
            
            VStack(alignment: .leading, spacing: 6) {
                toggleRow(title: "No physiological substance attribution", isSelected: exclusionsSelected.contains("No physiological substance attribution")) {
                    toggleSymptom(set: &exclusionsSelected, val: "No physiological substance attribution")
                }
                toggleRow(title: "No medical condition attribution", isSelected: exclusionsSelected.contains("No medical condition attribution")) {
                    toggleSymptom(set: &exclusionsSelected, val: "No medical condition attribution")
                }
                toggleRow(title: "No manic/hypomanic history", isSelected: exclusionsSelected.contains("No manic/hypomanic history")) {
                    toggleSymptom(set: &exclusionsSelected, val: "No manic/hypomanic history")
                }
            }
            .padding()
            .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
            .cornerRadius(12)
            
            // Duration
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Duration of Symptoms")
                        .font(.footnote)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                    Spacer()
                    Text("\(durationWeeks) Weeks (\(durationWeeks / 4) mo)")
                        .font(.footnote)
                        .foregroundColor(PremiumTheme.clinicianPrimary)
                }
                Slider(value: Binding(
                    get: { Double(durationWeeks) },
                    set: { durationWeeks = Int($0) }
                ), in: 1...52, step: 1)
            }
            .padding()
            .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
            .cornerRadius(12)
            
            // Run Button
            Button(action: {
                viewModel.runLocalDsm5Diagnostics(
                    mddSymptoms: Array(mddSymptomsSelected),
                    gadSymptoms: Array(gadSymptomsSelected),
                    durationWeeks: durationWeeks,
                    exclusions: Array(exclusionsSelected)
                )
            }) {
                Text("Execute local DSM-5 check")
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(PremiumTheme.clinicianPrimary)
                    .cornerRadius(12)
            }
        }
    }
    
    // Mock checklist Form
    private var mockFormSection: View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Mock Basic Parameters")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.gray)
            
            VStack(alignment: .leading, spacing: 6) {
                toggleRow(title: "Above 18", isSelected: basicSelected.contains("Above 18")) {
                    toggleSymptom(set: &basicSelected, val: "Above 18")
                }
                toggleRow(title: "1 year duration", isSelected: basicSelected.contains("1 year")) {
                    toggleSymptom(set: &basicSelected, val: "1 year")
                }
                toggleRow(title: "Not attributable to Physiological conditions", isSelected: basicSelected.contains("Not attributable to Physiological conditions")) {
                    toggleSymptom(set: &basicSelected, val: "Not attributable to Physiological conditions")
                }
                
                Divider().padding(.vertical, 4)
                
                toggleRow(title: "Above 21", isSelected: basicSelected.contains("Above 21")) {
                    toggleSymptom(set: &basicSelected, val: "Above 21")
                }
                toggleRow(title: "6 months duration", isSelected: basicSelected.contains("6 months")) {
                    toggleSymptom(set: &basicSelected, val: "6 months")
                }
                toggleRow(title: "Not better explained by other Physiological conditions", isSelected: basicSelected.contains("Not better explained by other Physiological conditions")) {
                    toggleSymptom(set: &basicSelected, val: "Not better explained by other Physiological conditions")
                }
            }
            .padding()
            .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
            .cornerRadius(12)
            
            Text("Mock Specific Symptoms Checklist")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.gray)
            
            VStack(alignment: .leading, spacing: 6) {
                Text("Phantom Symptoms:")
                    .font(.caption)
                    .foregroundColor(.gray)
                HStack {
                    toggleChip(title: "PDss1", isSelected: specificSelected.contains("PDss1")) { toggleSymptom(set: &specificSelected, val: "PDss1") }
                    toggleChip(title: "PDss2", isSelected: specificSelected.contains("PDss2")) { toggleSymptom(set: &specificSelected, val: "PDss2") }
                    toggleChip(title: "PDss3", isSelected: specificSelected.contains("PDss3")) { toggleSymptom(set: &specificSelected, val: "PDss3") }
                }
                HStack {
                    toggleChip(title: "PDss4", isSelected: specificSelected.contains("PDss4")) { toggleSymptom(set: &specificSelected, val: "PDss4") }
                    toggleChip(title: "PDss5", isSelected: specificSelected.contains("PDss5")) { toggleSymptom(set: &specificSelected, val: "PDss5") }
                    toggleChip(title: "PDss6", isSelected: specificSelected.contains("PDss6")) { toggleSymptom(set: &specificSelected, val: "PDss6") }
                }
                
                Text("Hypothetical Symptoms:")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding(.top, 4)
                HStack {
                    toggleChip(title: "HDss1", isSelected: specificSelected.contains("HDss1")) { toggleSymptom(set: &specificSelected, val: "HDss1") }
                    toggleChip(title: "HDss2", isSelected: specificSelected.contains("HDss2")) { toggleSymptom(set: &specificSelected, val: "HDss2") }
                    toggleChip(title: "HDss3", isSelected: specificSelected.contains("HDss3")) { toggleSymptom(set: &specificSelected, val: "HDss3") }
                }
                HStack {
                    toggleChip(title: "HDss4", isSelected: specificSelected.contains("HDss4")) { toggleSymptom(set: &specificSelected, val: "HDss4") }
                    toggleChip(title: "HDss5", isSelected: specificSelected.contains("HDss5")) { toggleSymptom(set: &specificSelected, val: "HDss5") }
                    toggleChip(title: "HDss6", isSelected: specificSelected.contains("HDss6")) { toggleSymptom(set: &specificSelected, val: "HDss6") }
                }
                
                Text("Comorbid Symptoms:")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding(.top, 4)
                HStack {
                    toggleChip(title: "CDss1", isSelected: specificSelected.contains("CDss1")) { toggleSymptom(set: &specificSelected, val: "CDss1") }
                    toggleChip(title: "CDss2", isSelected: specificSelected.contains("CDss2")) { toggleSymptom(set: &specificSelected, val: "CDss2") }
                }
            }
            .padding()
            .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
            .cornerRadius(12)
            
            // Run Button
            Button(action: {
                viewModel.runLocalMockDiagnostics(
                    basicCriteria: Array(basicSelected),
                    specificSymptoms: Array(specificSelected)
                )
            }) {
                Text("Evaluate mock disorder engine")
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(PremiumTheme.clinicianPrimary)
                    .cornerRadius(12)
            }
        }
    }
    
    private var icd11SearchSection: View {
        VStack(alignment: .leading, spacing: 16) {
            Text("WHO ICD-11 Official Registry Search")
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            Text("Directly query the World Health Organization classification database. Falls back to offline registry on network loss.")
                .font(.caption2)
                .foregroundColor(.gray)

            HStack(spacing: 8) {
                TextField("Query ICD-11 (e.g. Depressive, Panic, GAD)...", text: $icdQuery)
                    .padding(10)
                    .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                    )
                
                Button(action: {
                    isSearchingIcd = true
                    Task {
                        await viewModel.searchIcd11(query: icdQuery)
                        isSearchingIcd = false
                    }
                }) {
                    HStack {
                        if isSearchingIcd || viewModel.isIcdLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "magnifyingglass")
                        }
                    }
                    .foregroundColor(.white)
                    .padding(10)
                    .background(PremiumTheme.clinicianPrimary)
                    .cornerRadius(8)
                }
                .disabled(icdQuery.isEmpty || isSearchingIcd)
            }
            
            if !viewModel.icdSearchResults.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("WHO ICD-11 Registry Matches:")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                    
                    ForEach(viewModel.icdSearchResults) { res in
                        GlassmorphicCard(isLight: viewModel.theme == "light") {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Text(res.code)
                                            .font(.system(size: 10, weight: .bold))
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(PremiumTheme.clinicianPrimary.opacity(0.15))
                                            .foregroundColor(PremiumTheme.clinicianPrimary)
                                            .cornerRadius(4)
                                        
                                        Text(res.title)
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                                    }
                                    
                                    if !res.uri.isEmpty {
                                        Text(res.uri)
                                            .font(.system(size: 9))
                                            .foregroundColor(.blue)
                                    }
                                }
                                Spacer()
                                
                                Button(action: {
                                    #if os(iOS)
                                    UIPasteboard.general.string = "\(res.code): \(res.title)"
                                    #elseif os(macOS)
                                    NSPasteboard.general.clearContents()
                                    NSPasteboard.general.setString("\(res.code): \(res.title)", forType: .string)
                                    #endif
                                    viewModel.logAudit(action: "ICD-11 Code Copied", details: "Copied code \(res.code) for \(res.title)")
                                }) {
                                    Image(systemName: "doc.on.doc")
                                        .font(.system(size: 12))
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                    }
                }
            } else if !icdQuery.isEmpty && !isSearchingIcd && !viewModel.isIcdLoading {
                Text("No matches found in WHO registry or local fallback.")
                    .font(.caption2)
                    .foregroundColor(.gray)
                    .italic()
            }
        }
        .padding()
        .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
        .cornerRadius(12)
    }

    // Helpers
    private func toggleRow(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(title)
                    .font(.footnote)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                Spacer()
                Image(systemName: isSelected ? "checkmark.square.fill" : "square")
                    .foregroundColor(isSelected ? PremiumTheme.clinicianPrimary : .gray)
            }
            .padding(.vertical, 4)
        }
    }
    
    private func toggleChip(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .fontWeight(.bold)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? PremiumTheme.clinicianPrimary : (viewModel.theme == "light" ? Color.gray.opacity(0.1) : Color.white.opacity(0.08)))
                .foregroundColor(isSelected ? .white : (viewModel.theme == "light" ? .black : .gray))
                .cornerRadius(8)
        }
    }
    
    private func toggleSymptom(set: inout Set<String>, val: String) {
        if set.contains(val) {
            set.remove(val)
        } else {
            set.insert(val)
        }
    }
}
