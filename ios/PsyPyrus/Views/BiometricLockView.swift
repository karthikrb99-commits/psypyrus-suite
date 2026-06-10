import SwiftUI

public struct BiometricLockView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    @State private var isAnimating = false
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        ZStack {
            // Background
            (viewModel.theme == "light" ? PremiumTheme.bgLight : PremiumTheme.bgDark)
                .ignoresSafeArea()
            
            VStack(spacing: 40) {
                Spacer()
                
                // Animated lock shield
                VStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: viewModel.activeRole == "Professional" ?
                                        [PremiumTheme.clinicianPrimary.opacity(0.2), Color.clear] :
                                        [PremiumTheme.patientPrimary.opacity(0.2), Color.clear],
                                    startPoint: .center,
                                    endPoint: .bottom
                                )
                            )
                            .frame(width: 150, height: 150)
                            .scaleEffect(isAnimating ? 1.15 : 0.95)
                            .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: isAnimating)
                        
                        Image(systemName: "shield.hashpattern")
                            .font(.system(size: 64))
                            .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                        
                        Image(systemName: "lock.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.white)
                            .offset(y: -4)
                    }
                    .onAppear {
                        isAnimating = true
                    }
                    
                    Text("PsyPyrus HIPAA Secure Shield")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                    
                    Text("End-to-End Cryptographic Patient Records Vault")
                        .font(.subheadline)
                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                }
                
                // Role indicator pill
                HStack(spacing: 8) {
                    Image(systemName: viewModel.activeRole == "Professional" ? "waveform.path.ecg" : "heart.fill")
                    Text(viewModel.activeRole == "Professional" ? "Professional Workspace" : "Patient Wellness Portal")
                }
                .font(.footnote)
                .fontWeight(.semibold)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.white.opacity(0.08))
                .cornerRadius(20)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                
                Spacer()
                
                // Action options
                VStack(spacing: 16) {
                    Button(action: {
                        viewModel.isBiometricVerified = true
                        viewModel.logAudit(action: "Biometric Session Verified", details: "Local biometric identity successfully validated.")
                    }) {
                        HStack {
                            Image(systemName: "faceid")
                                .font(.title3)
                            Text("Simulate Biometric Verification")
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(
                                    LinearGradient(
                                        colors: viewModel.activeRole == "Professional" ?
                                            [PremiumTheme.clinicianPrimary, PremiumTheme.clinicianPrimary.opacity(0.8)] :
                                            [PremiumTheme.patientPrimary, PremiumTheme.patientPrimary.opacity(0.8)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                        )
                        .padding(.horizontal, 30)
                    }
                    
                    // Backup Passcode Button
                    Button(action: {
                        viewModel.isBiometricVerified = true
                        viewModel.logAudit(action: "Passcode Authentication", details: "Secure PIN lock code verified locally.")
                    }) {
                        Text("Verify with Local Passcode PIN")
                            .font(.footnote)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.clinicianPrimary : PremiumTheme.textSecondaryDark)
                    }
                }
                .padding(.bottom, 40)
            }
        }
    }
}
