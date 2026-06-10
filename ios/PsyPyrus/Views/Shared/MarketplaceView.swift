import SwiftUI

public struct MarketplaceView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    @State private var searchQuery = ""
    @State private var selectedCategory = "All"
    @State private var installingIds: Set<String> = []
    @State private var uninstallingIds: Set<String> = []
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // Header
            HStack {
                Image(systemName: "shop")
                    .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                    .font(.title2)
                Text(viewModel.activeRole == "Professional" ? "Clinician Extensions Marketplace" : "Patient Wellness Plugin Store")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            // Hero banner card
            heroBannerCard
            
            // Search field
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                TextField("Search active plugins, tools, guides...", text: $searchQuery)
            }
            .padding(12)
            .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
            .cornerRadius(12)
            
            // Category filters
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(categories, id: \.self) { cat in
                        let isSelected = cat == selectedCategory
                        Button(action: { selectedCategory = cat }) {
                            Text(cat)
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(isSelected ? (viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary) : (viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark))
                                .foregroundColor(isSelected ? .white : (viewModel.theme == "light" ? .black : .gray))
                                .cornerRadius(8)
                        }
                    }
                }
            }
            
            // Sandboxing advisory
            HStack(spacing: 8) {
                Image(systemName: "info.circle.fill")
                    .foregroundColor(PremiumTheme.warning)
                Text("HIPAA Sandbox Compliance: All plugins run locally in the app sandbox. No EHR details transit externally.")
                    .font(.caption2)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
            }
            .padding()
            .background(PremiumTheme.warning.opacity(0.1))
            .cornerRadius(10)
            
            // Marketplace Grid list
            let filteredList = viewModel.plugins.filter { app in
                // Role filter
                let isClinicianPlugin = ["Assessment Packs", "AI Modules", "Integrations"].contains(app.category)
                let matchesRole = viewModel.activeRole == "Professional" ? isClinicianPlugin : !isClinicianPlugin
                
                // Search filter
                let matchesSearch = searchQuery.isEmpty || app.title.lowercased().contains(searchQuery.lowercased()) || app.description.lowercased().contains(searchQuery.lowercased())
                
                // Category filter
                let matchesCategory = selectedCategory == "All" || app.category == selectedCategory
                
                return matchesRole && matchesSearch && matchesCategory
            }
            
            if filteredList.isEmpty {
                Text("No matching plugins found in database.")
                    .font(.footnote)
                    .foregroundColor(.gray)
                    .padding()
            } else {
                LazyVGrid(columns: [GridItem(.flexible())], spacing: 14) {
                    ForEach(filteredList) { app in
                        pluginRowCard(app: app)
                    }
                }
            }
        }
    }
    
    private var heroBannerCard: some View {
        let isClinician = viewModel.activeRole == "Professional"
        let gradient = isClinician ? 
            LinearGradient(colors: [PremiumTheme.clinicianPrimary.opacity(0.15), Color.clear], startPoint: .topLeading, endPoint: .bottomTrailing) :
            LinearGradient(colors: [PremiumTheme.patientPrimary.opacity(0.15), Color.clear], startPoint: .topLeading, endPoint: .bottomTrailing)
            
        return GlassmorphicCard(isLight: viewModel.theme == "light") {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(isClinician ? "EXTEND CLINICAL WORKFLOWS" : "POWER UP RECOVERY JOURNEY")
                        .font(.system(size: 8))
                        .fontWeight(.black)
                        .foregroundColor(isClinician ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                    Spacer()
                    Text("v2.0 Verified")
                        .font(.system(size: 7))
                        .fontWeight(.black)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.white.opacity(0.12))
                        .cornerRadius(4)
                }
                
                Text(isClinician ? "Modular decision templates, fine-tuned AI, or CMS codes generators." : "CBT trackers, paced relaxation audio, and wearable biometric syncing.")
                    .font(.caption)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
            }
            .background(gradient)
        }
    }
    
    private func pluginRowCard(app: AppPlugin) -> some View {
        let isInstalled = app.isInstalled
        let isFree = app.price.lowercased() == "free"
        
        return GlassmorphicCard(isLight: viewModel.theme == "light") {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top) {
                    // Left: Icon
                    Image(systemName: getIconName(app.icon))
                        .font(.title2)
                        .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                        .frame(width: 44, height: 44)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(8)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(app.title)
                            .font(.subheadline)
                            .fontWeight(.bold)
                        Text(app.description)
                            .font(.caption2)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                    }
                    Spacer()
                }
                
                Divider().opacity(0.1)
                
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(app.price)
                            .font(.caption)
                            .fontWeight(.black)
                            .foregroundColor(isFree ? PremiumTheme.success : (viewModel.theme == "light" ? .black : .white))
                        
                        HStack(spacing: 4) {
                            Image(systemName: "star.fill")
                                .font(.system(size: 8))
                                .foregroundColor(PremiumTheme.accentYellow)
                            Text(String(format: "%.1f (\(app.installs))", app.rating))
                                .font(.system(size: 8))
                                .foregroundColor(.gray)
                        }
                    }
                    
                    Spacer()
                    
                    // Install buttons with loading indicator simulation
                    if isInstalled {
                        Button(action: {
                            uninstallingIds.insert(app.id)
                            Task {
                                await viewModel.uninstallPlugin(id: app.id, title: app.title)
                                uninstallingIds.remove(app.id)
                            }
                        }) {
                            HStack(spacing: 6) {
                                if uninstallingIds.contains(app.id) {
                                    ProgressView().scaleEffect(0.6)
                                    Text("Removing...")
                                } else {
                                    Text("Uninstall")
                                }
                            }
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(PremiumTheme.error)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(PremiumTheme.error, lineWidth: 1))
                        }
                        .disabled(uninstallingIds.contains(app.id))
                    } else {
                        Button(action: {
                            installingIds.insert(app.id)
                            Task {
                                await viewModel.installPlugin(id: app.id, title: app.title)
                                installingIds.remove(app.id)
                            }
                        }) {
                            HStack(spacing: 6) {
                                if installingIds.contains(app.id) {
                                    ProgressView().scaleEffect(0.6)
                                    Text("Installing...")
                                } else {
                                    Text("Get")
                                }
                            }
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(isFree ? PremiumTheme.success : (viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary))
                            .cornerRadius(8)
                        }
                        .disabled(installingIds.contains(app.id))
                    }
                }
            }
        }
    }
    
    // Icon mapper
    private func getIconName(_ code: String) -> String {
        switch code {
        case "clipboard": return "doc.text.fill"
        case "sparkles": return "sparkles"
        case "book": return "book.closed.fill"
        case "person": return "person.fill"
        case "video": return "video.fill"
        case "creditcard": return "creditcard.fill"
        case "waveform": return "waveform.path"
        case "calendar": return "calendar"
        case "circle": return "circle.dashed.fill"
        case "wind": return "wind"
        case "checkmark": return "checkmark.seal.fill"
        case "heart": return "heart.text.square.fill"
        default: return "app.dashed"
        }
    }
    
    private var categories: [String] {
        let clinicianCats = ["All", "Assessment Packs", "AI Modules", "Integrations"]
        let patientCats = ["All", "Audio Therapy", "Wellness Guides", "Wearable Sync"]
        return viewModel.activeRole == "Professional" ? clinicianCats : patientCats
    }
}
