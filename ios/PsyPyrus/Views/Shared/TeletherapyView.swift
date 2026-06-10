import SwiftUI

public struct TeletherapyView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    
    // Call States
    @State private var timeElapsed = 0
    @State private var timerActive = true
    @State private var isMuted = false
    @State private var isCamOff = false
    @State private var scale: CGFloat = 1.0
    @State private var breatheState = "Inhale..."
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(spacing: 20) {
            
            // Header
            HStack {
                Image(systemName: "video.fill")
                    .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                    .font(.title2)
                Text("Secure Video Teletherapy")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
                
                Text(formatTime(timeElapsed))
                    .font(.system(.subheadline, design: .monospaced))
                    .fontWeight(.bold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.black.opacity(0.4))
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            .onReceive(timer) { _ in
                if timerActive {
                    timeElapsed += 1
                    
                    // Somatic pacing bubble cycle: 4s inhale, 4s hold/exhale
                    let cycle = timeElapsed % 8
                    if cycle < 4 {
                        breatheState = "Inhale..."
                        withAnimation(.easeInOut(duration: 4)) {
                            scale = 1.3
                        }
                    } else {
                        breatheState = "Exhale..."
                        withAnimation(.easeInOut(duration: 4)) {
                            scale = 0.8
                        }
                    }
                }
            }
            
            // Video screens layout
            ZStack {
                // Large remote participant view (Therapist or Patient)
                RoundedRectangle(cornerRadius: 16)
                    .fill(
                        LinearGradient(
                            colors: [Color(red: 20/255, green: 24/255, blue: 43/255), Color(red: 40/255, green: 45/255, blue: 75/255)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(height: 380)
                    .overlay(
                        VStack(spacing: 8) {
                            if viewModel.activeRole == "Professional" {
                                Image(systemName: "person.crop.circle.badge.checkmark")
                                    .font(.system(size: 64))
                                    .foregroundColor(PremiumTheme.patientPrimary)
                                Text("Liam Carter (Patient)")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            } else {
                                Image(systemName: "person.crop.circle.badge.plus")
                                    .font(.system(size: 64))
                                    .foregroundColor(PremiumTheme.clinicianPrimary)
                                Text("Dr. Katherine Brewster (Clinician)")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            }
                            
                            Text("Active Video Stream...")
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                    )
                
                // Small local preview PIP (Bottom Right)
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.black.opacity(0.6))
                            .frame(width: 90, height: 130)
                            .overlay(
                                VStack {
                                    if isCamOff {
                                        Image(systemName: "video.slash.fill")
                                            .foregroundColor(.white)
                                    } else {
                                        Image(systemName: "person.fill")
                                            .font(.title2)
                                            .foregroundColor(.gray)
                                        Text("You")
                                            .font(.system(size: 10))
                                            .foregroundColor(.white)
                                    }
                                }
                            )
                            .padding(12)
                    }
                }
                
                // Pacing Breathe Overlay widget (Floating top left)
                VStack {
                    HStack {
                        VStack(spacing: 6) {
                            Circle()
                                .fill(PremiumTheme.patientPrimary.opacity(0.3))
                                .frame(width: 48, height: 48)
                                .scaleEffect(scale)
                                .overlay(
                                    Image(systemName: "wind")
                                        .foregroundColor(PremiumTheme.patientPrimary)
                                )
                            Text(breatheState)
                                .font(.system(size: 9))
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                        .padding(10)
                        .background(Color.black.opacity(0.5))
                        .cornerRadius(14)
                        .padding(12)
                        
                        Spacer()
                    }
                    Spacer()
                }
            }
            .frame(height: 380)
            
            // HIPAA compliance notice
            HStack {
                Image(systemName: "lock.shield.fill")
                    .foregroundColor(PremiumTheme.success)
                Text("HIPAA Sandbox Active: End-to-End Encryption code verified.")
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            
            // Controls Panel
            HStack(spacing: 24) {
                Button(action: { isMuted.toggle() }) {
                    Circle()
                        .fill(isMuted ? PremiumTheme.error : Color.white.opacity(0.12))
                        .frame(width: 50, height: 50)
                        .overlay(
                            Image(systemName: isMuted ? "mic.slash.fill" : "mic.fill")
                                .foregroundColor(.white)
                        )
                }
                
                Button(action: {
                    timerActive = false
                    viewModel.navigate(screen: "Dashboard")
                    viewModel.logAudit(action: "Ended Telehealth Session", details: "Completed teletherapy call code: PSY-PYR-401")
                }) {
                    Circle()
                        .fill(PremiumTheme.error)
                        .frame(width: 60, height: 60)
                        .overlay(
                            Image(systemName: "phone.down.fill")
                                .font(.title3)
                                .foregroundColor(.white)
                        )
                }
                
                Button(action: { isCamOff.toggle() }) {
                    Circle()
                        .fill(isCamOff ? PremiumTheme.error : Color.white.opacity(0.12))
                        .frame(width: 50, height: 50)
                        .overlay(
                            Image(systemName: isCamOff ? "video.slash.fill" : "video.fill")
                                .foregroundColor(.white)
                        )
                }
            }
            .padding(.top, 10)
        }
    }
    
    private func formatTime(_ sec: Int) -> String {
        let min = sec / 60
        let s = sec % 60
        return String(format: "%02d:%02d", min, s)
    }
}
