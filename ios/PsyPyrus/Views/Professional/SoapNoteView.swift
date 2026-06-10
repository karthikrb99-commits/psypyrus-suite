import SwiftUI

public struct SoapNoteView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    @State private var transcriptText = ""
    @State private var showingCopiedAlert = false
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // Header Block
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(PremiumTheme.clinicianPrimary)
                    .font(.title2)
                Text("AI Clinical SOAP Note Copilot")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            // API Status Notice
            if viewModel.geminiApiKey.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "info.circle.fill")
                        .foregroundColor(PremiumTheme.warning)
                    Text("Running in Simulated Fallback Mode. Configure your Gemini API key in settings for live AI output.")
                        .font(.caption)
                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                }
                .padding()
                .background(PremiumTheme.warning.opacity(0.1))
                .cornerRadius(10)
            }
            
            // Patient selector
            VStack(alignment: .leading, spacing: 6) {
                Text("Select Patient Target")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.gray)
                
                Picker("Patient", selection: $viewModel.selectedPatientId) {
                    ForEach(viewModel.patients) { p in
                        Text(p.name).tag(p.id)
                    }
                }
                .pickerStyle(MenuPickerStyle())
                .padding(.horizontal, 8)
                .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                .cornerRadius(8)
            }
            
            // Raw Transcript input
            VStack(alignment: .leading, spacing: 8) {
                Text("Session Dialogue Transcript")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                
                TextEditor(text: $transcriptText)
                    .frame(height: 150)
                    .padding(8)
                    .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
                
                HStack {
                    Button(action: {
                        transcriptText = "Patient reports feeling very stressed lately. Works 60 hours a week as a project manager. Mentions trouble sleeping and somatic tension. Says box breathing has helped a little but works too late. Checked GAD-7 score and it's 14 today. Objective: appearance tidy, cooperative, anxious affect, speech slightly rapid but coherent. Plan: schedule follow-up, work on boundary setting, continue daily breathing."
                    }) {
                        Text("Load Sample Dialogue")
                            .font(.caption2)
                            .foregroundColor(PremiumTheme.clinicianPrimary)
                    }
                    Spacer()
                    Button(action: {
                        transcriptText = ""
                    }) {
                        Text("Clear Input")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                }
            }
            
            // Generate button
            Button(action: {
                Task {
                    await viewModel.triggerAiSoapNote(transcript: transcriptText, patientId: viewModel.selectedPatientId)
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
                    Text(viewModel.isAiLoading ? "Generating Notes..." : "Synthesize SOAP note")
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(PremiumTheme.clinicianPrimary)
                .cornerRadius(12)
            }
            .disabled(transcriptText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.isAiLoading)
            
            // Output Display Card
            if !viewModel.aiResultText.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Generated SOAP Output")
                            .font(.headline)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                        Spacer()
                        
                        Button(action: {
                            UIPasteboard.general.string = viewModel.aiResultText
                            showingCopiedAlert = true
                        }) {
                            Image(systemName: "doc.on.doc.fill")
                                .font(.footnote)
                                .foregroundColor(PremiumTheme.clinicianPrimary)
                        }
                    }
                    
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
                    
                    Text("Auto-Saved: This compiled soap note has been locked and appended to this patient's EHR note database.")
                        .font(.system(size: 9))
                        .foregroundColor(.gray)
                }
                .padding()
                .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                .cornerRadius(12)
            }
        }
        .alert(isPresented: $showingCopiedAlert) {
            Alert(title: Text("Copied"), message: Text("Note copied to clipboard."), dismissButton: .default(Text("OK")))
        }
    }
}
