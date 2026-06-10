import SwiftUI

public struct TreatmentPlannerView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    @State private var goalTitle = ""
    @State private var goalDescription = ""
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // Header
            HStack {
                Image(systemName: "calendar.badge.clock")
                    .foregroundColor(PremiumTheme.clinicianPrimary)
                    .font(.title2)
                Text("CBT SMART Treatment Planner")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            // Patient selector
            VStack(alignment: .leading, spacing: 6) {
                Text("Select Patient Target")
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
            
            // Inputs
            VStack(alignment: .leading, spacing: 12) {
                Text("Basic Therapy Objective")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                
                TextField("e.g. Decrease presentation anxiety", text: $goalTitle)
                    .padding()
                    .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                    .cornerRadius(10)
                
                Text("Context & Diagnostic Symptoms")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                
                TextEditor(text: $goalDescription)
                    .frame(height: 100)
                    .padding(8)
                    .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
                
                HStack {
                    Button(action: {
                        goalTitle = "Establish sleep hygiene schedule"
                        goalDescription = "Patient reports waking up at 3 AM with rapid heart rate. Stays awake checking emails. Sleep latency is currently 90 minutes. Goal is to stabilize sleep patterns."
                    }) {
                        Text("Load Sample Objective")
                            .font(.caption2)
                            .foregroundColor(PremiumTheme.clinicianPrimary)
                    }
                    Spacer()
                    Button(action: {
                        goalTitle = ""
                        goalDescription = ""
                    }) {
                        Text("Clear Inputs")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                }
            }
            
            // Trigger
            Button(action: {
                Task {
                    await viewModel.triggerSmartTreatmentPlanner(
                        goal: goalTitle,
                        description: goalDescription,
                        patientId: viewModel.selectedPatientId
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
                    Text(viewModel.isAiLoading ? "Compiling Treatment Plan..." : "Compile SMART Treatment Plan")
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(PremiumTheme.clinicianPrimary)
                .cornerRadius(12)
            }
            .disabled(goalTitle.isEmpty || goalDescription.isEmpty || viewModel.isAiLoading)
            
            // Output Display Card
            if !viewModel.aiResultText.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Synthesized CBT Treatment Plan")
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
                    .frame(height: 250)
                    
                    Text("Auto-Saved: Saved to this client's clinical note records as PLAN.")
                        .font(.system(size: 8))
                        .foregroundColor(.gray)
                }
                .padding()
                .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                .cornerRadius(12)
            }
        }
    }
}
