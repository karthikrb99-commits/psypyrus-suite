import SwiftUI

public struct InteractiveAssessmentsView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    
    // Scale Selection: "PHQ-9", "GAD-7"
    @State private var scaleType = "PHQ-9"
    
    // PHQ-9 Answers
    @State private var phq9Answers = Array(repeating: 0, count: 9)
    // GAD-7 Answers
    @State private var gad7Answers = Array(repeating: 0, count: 7)
    
    private let phq9Questions = [
        "Little interest or pleasure in doing things",
        "Feeling down, depressed, or hopeless",
        "Trouble falling or staying asleep, or sleeping too much",
        "Feeling tired or having little energy",
        "Poor appetite or overeating",
        "Feeling bad about yourself, or that you are a failure",
        "Trouble concentrating on things, such as reading or watching TV",
        "Moving or speaking so slowly that other people could have noticed, or being fidgety",
        "Thoughts that you would be better off dead, or of hurting yourself"
    ]
    
    private let gad7Questions = [
        "Feeling nervous, anxious, or on edge",
        "Not being able to stop or control worrying",
        "Worrying too much about different things",
        "Trouble relaxing",
        "Being so restless that it is hard to sit still",
        "Becoming easily annoyed or irritable",
        "Feeling afraid, as if something awful might happen"
    ]
    
    private let severityOptions = ["Not at all", "Several days", "More than half", "Nearly every day"]
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // Header
            HStack {
                Image(systemName: "checklist")
                    .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                    .font(.title2)
                Text("Interactive Diagnostics Scales")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            // Picker
            Picker("Scale Type", selection: $scaleType) {
                Text("PHQ-9 Depression").tag("PHQ-9")
                Text("GAD-7 Anxiety").tag("GAD-7")
            }
            .pickerStyle(SegmentedPickerStyle())
            
            // Active patient info indicator
            if let patient = viewModel.patients.first(where: { $0.id == viewModel.selectedPatientId }) {
                HStack {
                    Text("Recording scale for:")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(patient.name)
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                    Spacer()
                }
                .padding(.horizontal, 4)
            }
            
            // Questions list
            VStack(spacing: 16) {
                if scaleType == "PHQ-9" {
                    ForEach(0..<phq9Questions.count, id: \.self) { idx in
                        questionRow(index: idx, text: phq9Questions[idx], answers: $phq9Answers)
                    }
                } else {
                    ForEach(0..<gad7Questions.count, id: \.self) { idx in
                        questionRow(index: idx, text: gad7Questions[idx], answers: $gad7Answers)
                    }
                }
            }
            
            // Live calculated score display
            scoreCalculationCard
            
            // Submit Button
            Button(action: {
                let finalScore = scaleType == "PHQ-9" ? phq9Answers.reduce(0, +) : gad7Answers.reduce(0, +)
                let severity = getSeverityLabel(score: finalScore, type: scaleType)
                
                viewModel.addAssessmentScore(
                    patientId: viewModel.selectedPatientId,
                    type: scaleType,
                    score: finalScore,
                    details: severity
                )
                
                // Clear answers
                if scaleType == "PHQ-9" {
                    phq9Answers = Array(repeating: 0, count: 9)
                } else {
                    gad7Answers = Array(repeating: 0, count: 7)
                }
            }) {
                Text("Lock & Submit Scale Score")
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                    .cornerRadius(12)
            }
        }
    }
    
    private func questionRow(index: Int, text: String, answers: Binding<[Int]>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(index + 1). \(text)")
                .font(.footnote)
                .fontWeight(.medium)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            Picker("Score \(index)", selection: Binding(
                get: { answers.wrappedValue[index] },
                set: { answers.wrappedValue[index] = $0 }
            )) {
                ForEach(0..<4) { val in
                    Text(severityOptions[val]).tag(val)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
        }
        .padding()
        .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
        .cornerRadius(12)
    }
    
    private var scoreCalculationCard: some View {
        let finalScore = scaleType == "PHQ-9" ? phq9Answers.reduce(0, +) : gad7Answers.reduce(0, +)
        let severity = getSeverityLabel(score: finalScore, type: scaleType)
        let color = getSeverityColor(severity: severity)
        
        return GlassmorphicCard(isLight: viewModel.theme == "light") {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("CURRENT CALCULATED TOTAL")
                        .font(.system(size: 8))
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                    
                    Text("\(finalScore) points")
                        .font(.title2)
                        .fontWeight(.black)
                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("SEVERITY TIER")
                        .font(.system(size: 8))
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                    
                    StatusBadge(text: severity, type: color)
                }
            }
        }
    }
    
    private func getSeverityLabel(score: Int, type: String) -> String {
        if type == "PHQ-9" {
            switch score {
            case 0...4: return "Minimal Depression"
            case 5...9: return "Mild Depression"
            case 10...14: return "Moderate Depression"
            case 15...19: return "Moderately Severe Depression"
            default: return "Severe Depression"
            }
        } else {
            switch score {
            case 0...4: return "Minimal Anxiety"
            case 5...9: return "Mild Anxiety"
            case 10...14: return "Moderate Anxiety"
            default: return "Severe Anxiety"
            }
        }
    }
    
    private func getSeverityColor(severity: String) -> StatusBadge.BadgeType {
        let lower = severity.lowercased()
        if lower.contains("severe") {
            return .error
        } else if lower.contains("moderate") {
            return .warning
        } else if lower.contains("mild") {
            return .info
        } else {
            return .success
        }
    }
}
