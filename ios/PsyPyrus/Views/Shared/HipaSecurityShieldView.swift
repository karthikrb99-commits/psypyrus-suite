import SwiftUI

public struct HipaSecurityShieldView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // Header
            HStack {
                Image(systemName: "shield.checkered")
                    .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                    .font(.title2)
                Text("HIPAA Audit & Cryptography Vault")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            // 1. Encryption Details Card
            encryptionSpecsCard
            
            // 2. Audit Trail Header
            HStack {
                Text("Immutable Security Audit Logs")
                    .font(.headline)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                Spacer()
                Text("\(viewModel.auditLogs.count) Entries")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            // 3. Audit Logs List
            VStack(spacing: 12) {
                ForEach(viewModel.auditLogs) { log in
                    GlassmorphicCard(isLight: viewModel.theme == "light") {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(log.action)
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                                
                                Spacer()
                                
                                Text(log.timestamp.formatted())
                                    .font(.system(size: 8))
                                    .foregroundColor(.gray)
                            }
                            
                            Text(log.details)
                                .font(.caption)
                                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                            
                            Divider().opacity(0.1)
                            
                            Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 4) {
                                GridRow {
                                    metaField(label: "Actor", value: log.actor)
                                    metaField(label: "Source IP", value: log.ipAddress)
                                }
                                GridRow {
                                    metaField(label: "Cypher standard", value: log.encryptionStandard)
                                    metaField(label: "Validation status", value: "Verified Sandbox")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    private var encryptionSpecsCard: some View {
        GlassmorphicCard(isLight: viewModel.theme == "light") {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("HIPAA Sandbox Compliance Specs")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                    Spacer()
                    Image(systemName: "lock.shield.fill")
                        .foregroundColor(PremiumTheme.success)
                }
                
                Text("PsyPyrus operates in a fully containerized client-side cryptographic sandbox. All Electronic Health Records (PHI), diagnostic criteria, and SOAP note dialogue logs are locked locally inside the iOS secure App Sandbox using Envelope Encryption standards.")
                    .font(.caption2)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                
                Divider().opacity(0.1)
                
                VStack(alignment: .leading, spacing: 6) {
                    bulletPoint(title: "Database Encryption", desc: "Local SQLite file encrypted with SQLCipher AES-256-GCM.")
                    bulletPoint(title: "Audit Immutability", desc: "Local security actions are hashed to prevent diagnostic manipulation.")
                    bulletPoint(title: "Biometrics integration", desc: "Protected by iOS Keychain Services and LocalAuthentication (Face ID).")
                }
            }
        }
    }
    
    private func bulletPoint(title: String, desc: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Image(systemName: "checkmark.shield.fill")
                .font(.caption2)
                .foregroundColor(PremiumTheme.success)
                .padding(.top, 2)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                Text(desc)
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
            }
        }
    }
    
    private func metaField(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label.uppercased())
                .font(.system(size: 7))
                .fontWeight(.bold)
                .foregroundColor(.gray)
            Text(value)
                .font(.system(size: 9))
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
        }
    }
}
