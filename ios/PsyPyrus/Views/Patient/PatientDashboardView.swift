import SwiftUI

public struct PatientDashboardView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // 1. Welcome Banner
            welcomeBanner
            
            // 2. Health & Mood Vitals Snapshot
            moodSnapshotSection
            
            // 3. Upcoming Session Card
            upcomingSessionSection
            
            // 4. Assigned Homework Tasks
            homeworkSection
            
            // 5. Wellness Shortcuts
            wellnessShortcutsSection
        }
    }
    
    private var welcomeBanner: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Good Morning, Liam")
                .font(.title2)
                .fontWeight(.black)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            Text("Recovering step-by-step. Keep up with your daily pacing targets.")
                .font(.footnote)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
        }
        .padding(.vertical, 8)
    }
    
    private var moodSnapshotSection: some View {
        let recentScores = viewModel.moodLogs.prefix(5)
        let averageMood = recentScores.isEmpty ? 0 : Double(recentScores.map(\.moodScore).reduce(0,+)) / Double(recentScores.count)
        
        return GlassmorphicCard(isLight: viewModel.theme == "light") {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Mood Tracker Index".uppercased())
                            .font(.system(size: 8))
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text(String(format: "%.1f / 10 Average", averageMood))
                            .font(.headline)
                            .fontWeight(.black)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                    }
                    Spacer()
                    Image(systemName: "heart.text.square.fill")
                        .foregroundColor(PremiumTheme.patientPrimary)
                }
                
                // Mini bar chart
                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(viewModel.moodLogs.suffix(6)) { log in
                        VStack(spacing: 4) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(PremiumTheme.patientPrimary.opacity(0.8))
                                .frame(width: 20, height: CGFloat(log.moodScore * 6))
                            
                            Text("\(log.moodScore)")
                                .font(.system(size: 8))
                                .foregroundColor(.gray)
                        }
                    }
                }
                .frame(height: 70)
                .padding(.top, 4)
            }
        }
    }
    
    private var upcomingSessionSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Telehealth Visits Queue")
                .font(.headline)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            let liamAppts = viewModel.appointments.filter { $0.patientId == 1 && $0.status == "Scheduled" }
            
            if liamAppts.isEmpty {
                Text("No upcoming telehealth sessions scheduled.")
                    .font(.footnote)
                    .foregroundColor(.gray)
                    .padding()
            } else {
                ForEach(liamAppts) { appt in
                    GlassmorphicCard(isLight: viewModel.theme == "light") {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Image(systemName: "video.fill")
                                    .foregroundColor(PremiumTheme.patientPrimary)
                                Text("Dr. Katherine Brewster")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                Spacer()
                                Text(appt.dateTime)
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            
                            Text("Topic: Cognitive Restructuring. Click below to launch workspace code: \(appt.code).")
                                .font(.caption2)
                                .foregroundColor(.gray)
                            
                            Button(action: {
                                viewModel.navigate(screen: "Teletherapy")
                            }) {
                                Text("Join Video Call Room")
                                    .font(.footnote)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(PremiumTheme.patientPrimary)
                                    .cornerRadius(10)
                            }
                        }
                    }
                }
            }
        }
    }
    
    private var homeworkSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("My Assigned Recovery Homework")
                .font(.headline)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            let liamTasks = viewModel.homeworkTasks.filter { $0.patientId == 1 }
            
            if liamTasks.isEmpty {
                Text("No clinical homework tasks assigned.")
                    .font(.footnote)
                    .foregroundColor(.gray)
            } else {
                ForEach(liamTasks) { task in
                    HStack {
                        Button(action: {
                            viewModel.toggleHomeworkStatus(task: task)
                        }) {
                            Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                                .foregroundColor(task.isCompleted ? PremiumTheme.patientPrimary : .gray)
                        }
                        
                        Text(task.description)
                            .font(.footnote)
                            .strikethrough(task.isCompleted)
                            .foregroundColor(task.isCompleted ? .gray : (viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark))
                        
                        Spacer()
                    }
                    .padding()
                    .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                    .cornerRadius(10)
                }
            }
        }
    }
    
    private var wellnessShortcutsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Wellness Resources")
                .font(.headline)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            HStack(spacing: 12) {
                Button(action: { viewModel.navigate(screen: "Wellness") }) {
                    HStack {
                        Image(systemName: "wind")
                            .foregroundColor(PremiumTheme.patientPrimary)
                        Text("Breathing Lounge")
                            .font(.footnote)
                            .fontWeight(.bold)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                        Spacer()
                    }
                    .padding()
                    .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                    .cornerRadius(12)
                }
                
                Button(action: { viewModel.navigate(screen: "Assessments") }) {
                    HStack {
                        Image(systemName: "checklist")
                            .foregroundColor(PremiumTheme.patientPrimary)
                        Text("PHQ/GAD Scales")
                            .font(.footnote)
                            .fontWeight(.bold)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                        Spacer()
                    }
                    .padding()
                    .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                    .cornerRadius(12)
                }
            }
        }
    }
}
