import SwiftUI

public struct MainLayoutView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    @State private var showingSettings = false
    @State private var showingAddAppt = false
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        NavigationView {
            ZStack {
                // Background
                (viewModel.theme == "light" ? PremiumTheme.bgLight : PremiumTheme.bgDark)
                    .ignoresSafeArea()
                
                // Screen content routing
                VStack(spacing: 0) {
                    headerView
                    
                    ScrollView {
                        VStack(spacing: 20) {
                            renderScreenContent()
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 16)
                    }
                    
                    bottomTabBar
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showingSettings) {
                settingsSheet
            }
            .sheet(isPresented: $showingAddAppt) {
                addApptSheet
            }
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }
    
    // Header View with Persona Pill & Action Gear
    private var headerView: View {
        HStack {
            // Logo / Title
            HStack(spacing: 8) {
                Image(systemName: "brain.headprofile.technology")
                    .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                    .font(.title2)
                
                Text("PsyPyrus")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            }
            
            Spacer()
            
            // Persona Switcher Pill
            HStack(spacing: 4) {
                Button(action: {
                    withAnimation {
                        viewModel.switchRole(role: "Professional")
                    }
                }) {
                    Text("Clinician")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 6)
                        .background(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : Color.clear)
                        .foregroundColor(viewModel.activeRole == "Professional" ? .white : (viewModel.theme == "light" ? .black : .gray))
                        .cornerRadius(12)
                }
                
                Button(action: {
                    withAnimation {
                        viewModel.switchRole(role: "Patient")
                    }
                }) {
                    Text("Patient")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 6)
                        .background(viewModel.activeRole == "Patient" ? PremiumTheme.patientPrimary : Color.clear)
                        .foregroundColor(viewModel.activeRole == "Patient" ? .white : (viewModel.theme == "light" ? .black : .gray))
                        .cornerRadius(12)
                }
            }
            .background(Color.black.opacity(0.15))
            .cornerRadius(16)
            .padding(.trailing, 8)
            
            // Lock and Settings icons
            HStack(spacing: 12) {
                Button(action: {
                    viewModel.isBiometricVerified = false
                    viewModel.logAudit(action: "Biometric Session Locked", details: "EHR cryptographic session locked by user.")
                }) {
                    Image(systemName: "lock.shield.fill")
                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                }
                
                Button(action: {
                    showingSettings = true
                }) {
                    Image(systemName: "gearshape.fill")
                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark.opacity(0.5))
        .overlay(
            VStack {
                Spacer()
                Divider()
            }
        )
    }
    
    // Bottom Tab Bar
    private var bottomTabBar: View {
        HStack {
            Spacer()
            
            // Common Tabs
            tabButton(title: "Home", icon: "house.fill", targetScreen: "Dashboard")
            Spacer()
            
            if viewModel.activeRole == "Professional" {
                tabButton(title: "AI SOAP", icon: "sparkles", targetScreen: "AI Copilot")
                Spacer()
                tabButton(title: "Diag", icon: "waveform.path.ecg", targetScreen: "Diagnostics")
                Spacer()
                tabButton(title: "Store", icon: "bag.fill", targetScreen: "Marketplace")
            } else {
                tabButton(title: "Wellness", icon: "wind", targetScreen: "Wellness")
                Spacer()
                tabButton(title: "Scale", icon: "checklist", targetScreen: "Assessments")
                Spacer()
                tabButton(title: "Store", icon: "bag.fill", targetScreen: "Marketplace")
            }
            
            Spacer()
            tabButton(title: "Shield", icon: "shield.checkered", targetScreen: "HIPAA Shield")
            Spacer()
        }
        .padding(.vertical, 10)
        .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark.opacity(0.5))
        .overlay(
            VStack {
                Divider()
                Spacer()
            }
        )
    }
    
    private func tabButton(title: String, icon: String, targetScreen: String) -> some View {
        let isSelected = viewModel.currentScreen == targetScreen
        let tint = viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary
        
        return Button(action: {
            viewModel.navigate(screen: targetScreen)
        }) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                Text(title)
                    .font(.system(size: 10))
                    .fontWeight(.medium)
            }
            .foregroundColor(isSelected ? tint : (viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark))
        }
    }
    
    // Route Screen
    @ViewBuilder
    private func renderScreenContent() -> some View {
        if viewModel.activeRole == "Professional" {
            switch viewModel.currentScreen {
            case "Dashboard":
                ClinicianDashboardView(viewModel: viewModel, showingAddAppt: $showingAddAppt)
            case "AI Copilot":
                SoapNoteView(viewModel: viewModel)
            case "Digital MSE":
                MentalStatusExamView(viewModel: viewModel)
            case "Diagnostics":
                DiagnosticsSuiteView(viewModel: viewModel)
            case "Teletherapy":
                TeletherapyView(viewModel: viewModel)
            case "Planner":
                TreatmentPlannerView(viewModel: viewModel)
            case "Assessments":
                InteractiveAssessmentsView(viewModel: viewModel)
            case "Marketplace":
                MarketplaceView(viewModel: viewModel)
            case "HIPAA Shield":
                HipaSecurityShieldView(viewModel: viewModel)
            default:
                Text("Dashboard Panel")
            }
        } else {
            // Patient screens
            switch viewModel.currentScreen {
            case "Dashboard":
                PatientDashboardView(viewModel: viewModel)
            case "Wellness":
                WellnessLoungeView(viewModel: viewModel)
            case "Assessments":
                InteractiveAssessmentsView(viewModel: viewModel)
            case "Teletherapy":
                TeletherapyView(viewModel: viewModel)
            case "Marketplace":
                MarketplaceView(viewModel: viewModel)
            case "HIPAA Shield":
                HipaSecurityShieldView(viewModel: viewModel)
            default:
                Text("Dashboard Panel")
            }
        }
    }
    
    // API & Settings Sheet Drawer
    private var settingsSheet: View {
        ZStack {
            (viewModel.theme == "light" ? PremiumTheme.bgLight : PremiumTheme.bgDark)
                .ignoresSafeArea()
            
            VStack(spacing: 24) {
                HStack {
                    Text("API & Workspace Config")
                        .font(.title2)
                        .fontWeight(.bold)
                    Spacer()
                    Button("Done") {
                        showingSettings = false
                    }
                }
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                .padding(.horizontal)
                .padding(.top, 24)
                
                Form {
                    Section(header: Text("Google Gemini Configuration")) {
                        SecureField("Gemini 3.5 API Key", text: Binding(
                            get: { viewModel.geminiApiKey },
                            set: { viewModel.saveApiKey($0) }
                        ))
                        Text("Securely saved in local sandbox UserDefaults storage. Enables live clinical syntheses.")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                    
                    Section(header: Text("WHO ICD-11 Registry Configuration")) {
                        TextField("ICD-11 Client ID", text: Binding(
                            get: { viewModel.icdClientId },
                            set: { viewModel.saveIcdSettings(clientId: $0, clientSecret: viewModel.icdClientSecret) }
                        ))
                        SecureField("ICD-11 Client Secret", text: Binding(
                            get: { viewModel.icdClientSecret },
                            set: { viewModel.saveIcdSettings(clientId: viewModel.icdClientId, clientSecret: $0) }
                        ))
                        Text("Enter official credentials from the WHO Developer Portal. If left blank, searches default to local keyword matching.")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                    
                    Section(header: Text("Visual Interface Settings")) {
                        Picker("Appearance Theme", selection: Binding(
                            get: { viewModel.theme },
                            set: { viewModel.saveTheme($0) }
                        )) {
                            Text("Standard Dark Mode").tag("dark")
                            Text("Standard Light Mode").tag("light")
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                }
                .background(Color.clear)
            }
        }
    }
    
    // Add Appointment Modal Sheet
    @State private var selectedPatId: Int64 = 1
    @State private var apptDate = "Today, 04:00 PM"
    @State private var apptNotes = "General consultation evaluation."
    @State private var apptFee = 150.0
    @State private var apptIsVideo = true
    
    private var addApptSheet: View {
        ZStack {
            (viewModel.theme == "light" ? PremiumTheme.bgLight : PremiumTheme.bgDark)
                .ignoresSafeArea()
            
            VStack(spacing: 24) {
                HStack {
                    Text("Schedule Appointment")
                        .font(.title2)
                        .fontWeight(.bold)
                    Spacer()
                    Button("Cancel") {
                        showingAddAppt = false
                    }
                }
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                .padding(.horizontal)
                .padding(.top, 24)
                
                Form {
                    Section(header: Text("Patient Target Profile")) {
                        Picker("Patient", selection: $selectedPatId) {
                            ForEach(viewModel.patients) { p in
                                Text(p.name).tag(p.id)
                            }
                        }
                    }
                    
                    Section(header: Text("Schedule Details")) {
                        TextField("Date & Time String", text: $apptDate)
                        TextField("Session Clinical Intake Notes", text: $apptNotes)
                        Toggle("Telehealth Video", isOn: $apptIsVideo)
                    }
                    
                    Section(header: Text("Billing Fee")) {
                        Stepper("Fee: $\(Int(apptFee))", value: $apptFee, in: 50...500, step: 25)
                    }
                    
                    Button(action: {
                        if let patient = viewModel.patients.first(where: { $0.id == selectedPatId }) {
                            viewModel.addAppointment(
                                patientId: selectedPatId,
                                patientName: patient.name,
                                dateTime: apptDate,
                                notes: apptNotes,
                                isVideo: apptIsVideo,
                                fee: apptFee
                            )
                        }
                        showingAddAppt = false
                    }) {
                        Text("Lock Schedule Appointment")
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(PremiumTheme.clinicianPrimary)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                }
                .background(Color.clear)
            }
        }
    }
}
