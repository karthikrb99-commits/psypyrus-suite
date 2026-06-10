import SwiftUI

public struct MentalStatusExamView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    
    // MSE State Variables
    @State private var appearance = "Appropriate Grooming & Attire"
    @State private var behavior = "Cooperative"
    @State private var speech = "Normal Rate & Volume"
    @State private var mood = "Euthymic (Congruent Affect)"
    @State private var attention = "Focused & Stable"
    @State private var insightGrade = 4
    @State private var judgment = "Good Personal Judgment"
    @State private var descriptiveNotes = ""
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // Header
            HStack {
                Image(systemName: "pencil.and.outline")
                    .foregroundColor(PremiumTheme.clinicianPrimary)
                    .font(.title2)
                Text("Digital MSE Evaluator")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            // Patient Picker
            VStack(alignment: .leading, spacing: 6) {
                Text("Patient Target")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.gray)
                
                Picker("Patient Selection", selection: $viewModel.selectedPatientId) {
                    ForEach(viewModel.patients) { p in
                        Text(p.name).tag(p.id)
                    }
                }
                .pickerStyle(MenuPickerStyle())
                .padding(.horizontal, 8)
                .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                .cornerRadius(8)
            }
            
            // Selection Form
            VStack(spacing: 12) {
                dropdownSelector(label: "Appearance", selection: $appearance, options: [
                    "Appropriate Grooming & Attire", "Casual / Well Groomed", "Disheveled / Unkempt", "Poor Personal Hygiene"
                ])
                
                dropdownSelector(label: "Behavior & Cooperation", selection: $behavior, options: [
                    "Cooperative", "Guarded / Resistant", "Agitated / Restless", "Lethargic / Slowed"
                ])
                
                dropdownSelector(label: "Speech Patterns", selection: $speech, options: [
                    "Normal Rate & Volume", "Rapid / Pressured Speech", "Slowed / Monotonous", "Halting / Hesitant"
                ])
                
                dropdownSelector(label: "Mood & Affect", selection: $mood, options: [
                    "Euthymic (Congruent Affect)", "Anxious (Restricted Affect)", "Depressed (Flat Affect)", "Irritable (Labile Affect)"
                ])
                
                dropdownSelector(label: "Attention / Concentration", selection: $attention, options: [
                    "Focused & Stable", "Distractible / Short Span", "Hyper-Focused", "Confused / Disoriented"
                ])
                
                // Insight Grade
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Insight Rating")
                            .font(.footnote)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Spacer()
                        Text("Grade \(insightGrade) / 6")
                            .font(.footnote)
                            .foregroundColor(PremiumTheme.clinicianPrimary)
                    }
                    Slider(value: Binding(
                        get: { Double(insightGrade) },
                        set: { insightGrade = Int($0) }
                    ), in: 1...6, step: 1)
                }
                .padding()
                .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                .cornerRadius(12)
                
                dropdownSelector(label: "Clinical Judgment", selection: $judgment, options: [
                    "Good Personal Judgment", "Fair / Partially Impaired", "Poor / Highly Impaired"
                ])
            }
            
            // Narrative details
            VStack(alignment: .leading, spacing: 8) {
                Text("Descriptive Annotations")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                
                TextEditor(text: $descriptiveNotes)
                    .frame(height: 80)
                    .padding(8)
                    .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
            }
            
            // Compile Button
            Button(action: {
                Task {
                    await viewModel.triggerAiMseNarrative(
                        patientId: viewModel.selectedPatientId,
                        appearance: appearance,
                        behavior: behavior,
                        speech: speech,
                        mood: mood,
                        attention: attention,
                        insight: insightGrade,
                        judgment: judgment,
                        notes: descriptiveNotes
                    )
                }
            }) {
                HStack {
                    if viewModel.isAiLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(0.8)
                    } else {
                        Image(systemName: "square.and.pencil")
                    }
                    Text(viewModel.isAiLoading ? "Compiling Prose..." : "Compile MSE Prose Paragraph")
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(PremiumTheme.clinicianPrimary)
                .cornerRadius(12)
            }
            .disabled(viewModel.isAiLoading)
            
            // Output Display Card
            if !viewModel.aiResultText.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Synthesized MSE Summary Paragraph")
                        .font(.headline)
                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                    
                    ScrollView {
                        Text(viewModel.aiResultText)
                            .font(.footnote)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(viewModel.theme == "light" ? Color(red: 240/255, green: 244/255, blue: 250/255) : Color.black.opacity(0.3))
                            .cornerRadius(10)
                    }
                    .frame(height: 150)
                    
                    Text("Auto-Saved: Saved to this client's clinical note records.")
                        .font(.system(size: 8))
                        .foregroundColor(.gray)
                }
                .padding()
                .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                .cornerRadius(12)
            }
        }
    }
    
    private func dropdownSelector(label: String, selection: Binding<String>, options: [String]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.system(size: 8))
                .fontWeight(.bold)
                .foregroundColor(.gray)
            
            Picker(label, selection: selection) {
                ForEach(options, id: \.self) { opt in
                    Text(opt).tag(opt)
                }
            }
            .pickerStyle(MenuPickerStyle())
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
            .cornerRadius(10)
        }
    }
}
