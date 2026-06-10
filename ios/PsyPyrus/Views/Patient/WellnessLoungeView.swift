import SwiftUI

public struct WellnessLoungeView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    
    // Mood log states
    @State private var moodValue = 5
    @State private var moodNotes = ""
    @State private var gratitudeText = ""
    
    // Paced breathing bubble states
    @State private var breathingActive = false
    @State private var breathingTimerSec = 0
    @State private var scale: CGFloat = 1.0
    @State private var instruction = "Tap Start to Breathe"
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // Header
            HStack {
                Image(systemName: "wind")
                    .foregroundColor(PremiumTheme.patientPrimary)
                    .font(.title2)
                Text("Patient Wellness Lounge")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            // 1. Paced Breathing Bubble
            breathingBubbleSection
            
            // 2. Mood & Gratitude Log Form
            moodLoggingSection
            
            // Recent mood history log entries
            moodLogsListSection
        }
    }
    
    // Breathing section UI
    private var breathingBubbleSection: View {
        GlassmorphicCard(isLight: viewModel.theme == "light") {
            VStack(alignment: .center, spacing: 20) {
                Text("Somatic Respiratory Pacing")
                    .font(.headline)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                
                Text("CBT Box Breathing Helper (4s inhale / 4s hold / 4s exhale)")
                    .font(.caption2)
                    .foregroundColor(.gray)
                
                // Big breathing bubble
                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [PremiumTheme.patientPrimary.opacity(0.4), Color.clear],
                                center: .center,
                                startRadius: 10,
                                endRadius: 90
                            )
                        )
                        .frame(width: 180, height: 180)
                        .scaleEffect(scale)
                    
                    Circle()
                        .stroke(PremiumTheme.patientPrimary, lineWidth: 3)
                        .frame(width: 130, height: 130)
                        .scaleEffect(scale)
                    
                    VStack(spacing: 4) {
                        Text(instruction)
                            .font(.subheadline)
                            .fontWeight(.black)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                        
                        if breathingActive {
                            Text(formatBreathingTime(breathingTimerSec))
                                .font(.system(.caption, design: .monospaced))
                                .foregroundColor(.gray)
                        }
                    }
                }
                .frame(height: 200)
                .onReceive(timer) { _ in
                    guard breathingActive else { return }
                    breathingTimerSec += 1
                    
                    let phase = breathingTimerSec % 12
                    switch phase {
                    case 0...3:
                        instruction = "Inhale..."
                        withAnimation(.easeInOut(duration: 4)) {
                            scale = 1.4
                        }
                    case 4...7:
                        instruction = "Hold..."
                        // Hold size constant
                    default:
                        instruction = "Exhale..."
                        withAnimation(.easeInOut(duration: 4)) {
                            scale = 0.8
                        }
                    }
                }
                
                // Breath control button
                Button(action: {
                    breathingActive.toggle()
                    if breathingActive {
                        breathingTimerSec = 0
                        instruction = "Inhale..."
                        withAnimation(.easeInOut(duration: 4)) {
                            scale = 1.4
                        }
                    } else {
                        instruction = "Tap Start to Breathe"
                        withAnimation(.spring()) {
                            scale = 1.0
                        }
                        
                        // Auto-log breathing session
                        if breathingTimerSec > 5 {
                            viewModel.addMoodLog(score: moodValue, note: "Paced breathing session completed.", gratitude: "Breathe mindfulness", breathingSec: breathingTimerSec)
                            viewModel.logAudit(action: "Breathing Session Completed", details: "Logged \(breathingTimerSec) seconds of somatic bio-pacing.")
                        }
                    }
                }) {
                    Text(breathingActive ? "Stop Exercise & Log" : "Begin Pacing Session")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(breathingActive ? PremiumTheme.error : PremiumTheme.patientPrimary)
                        .cornerRadius(12)
                }
            }
            .frame(maxWidth: .infinity)
        }
    }
    
    // Mood logger form UI
    private var moodLoggingSection: View {
        GlassmorphicCard(isLight: viewModel.theme == "light") {
            VStack(alignment: .leading, spacing: 14) {
                Text("Log Daily Mood & Gratitude")
                    .font(.headline)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                
                // Mood Slider
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Mood Score")
                            .font(.footnote)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Spacer()
                        Text("\(moodValue) / 10 (\(getMoodAdjective(moodValue)))")
                            .font(.footnote)
                            .fontWeight(.bold)
                            .foregroundColor(PremiumTheme.patientPrimary)
                    }
                    Slider(value: Binding(
                        get: { Double(moodValue) },
                        set: { moodValue = Int($0) }
                    ), in: 1...10, step: 1)
                }
                
                // Mood details
                VStack(alignment: .leading, spacing: 4) {
                    Text("Daily mood notes")
                        .font(.footnote)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                    TextField("What factors contributed to your mood today?", text: $moodNotes)
                        .padding(10)
                        .background(viewModel.theme == "light" ? Color.black.opacity(0.04) : Color.black.opacity(0.25))
                        .cornerRadius(8)
                }
                
                // Gratitude box
                VStack(alignment: .leading, spacing: 4) {
                    Text("Gratitude logs")
                        .font(.footnote)
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                    TextField("Record 1-3 items you are thankful for...", text: $gratitudeText)
                        .padding(10)
                        .background(viewModel.theme == "light" ? Color.black.opacity(0.04) : Color.black.opacity(0.25))
                        .cornerRadius(8)
                }
                
                Button(action: {
                    viewModel.addMoodLog(
                        score: moodValue,
                        note: moodNotes,
                        gratitude: gratitudeText,
                        breathingSec: 0
                    )
                    
                    moodNotes = ""
                    gratitudeText = ""
                    moodValue = 5
                }) {
                    Text("Submit Daily Wellness Log")
                        .font(.footnote)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(PremiumTheme.patientPrimary)
                        .cornerRadius(10)
                }
                .disabled(moodNotes.isEmpty)
            }
        }
    }
    
    // Mood logs list
    private var moodLogsListSection: View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Wellness Log History")
                .font(.headline)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            if viewModel.moodLogs.isEmpty {
                Text("No mood entries logged yet.")
                    .font(.footnote)
                    .foregroundColor(.gray)
            } else {
                ForEach(viewModel.moodLogs) { log in
                    GlassmorphicCard(isLight: viewModel.theme == "light") {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text("\(log.moodScore) / 10")
                                    .fontWeight(.black)
                                    .foregroundColor(PremiumTheme.patientPrimary)
                                
                                Spacer()
                                
                                Text(log.date.formatted(date: .abbreviated, time: .omitted))
                                    .font(.system(size: 8))
                                    .foregroundColor(.gray)
                            }
                            .font(.subheadline)
                            
                            Text(log.moodNote)
                                .font(.caption2)
                                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                            
                            if !log.gratitude.isEmpty {
                                Text("Gratitude: \(log.gratitude)")
                                    .font(.system(size: 9))
                                    .italic()
                                    .foregroundColor(PremiumTheme.accentYellow)
                            }
                            
                            if log.breathingSeconds > 0 {
                                HStack(spacing: 4) {
                                    Image(systemName: "wind")
                                        .font(.system(size: 8))
                                        .foregroundColor(PremiumTheme.patientPrimary)
                                    Text("Breathing paced: \(log.breathingSeconds) seconds")
                                        .font(.system(size: 8))
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    private func getMoodAdjective(_ val: Int) -> String {
        switch val {
        case 1...2: return "Highly Stressed"
        case 3...4: return "Unsettled"
        case 5...6: return "Standard / Euthymic"
        case 7...8: return "Calm / Clear"
        default: return "Excellent"
        }
    }
    
    private func formatBreathingTime(_ sec: Int) -> String {
        let m = sec / 60
        let s = sec % 60
        return String(format: "%02d:%02d", m, s)
    }
}
