import SwiftUI

public struct ClinicianDashboardView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    @Binding var showingAddAppt: Bool
    
    // Forms for new patient
    @State private var showingAddPatient = false
    @State private var newName = ""
    @State private var newAge = 30
    @State private var newGender = "Female"
    @State private var newEmail = ""
    @State private var newPhone = ""
    @State private var newRisk = "Moderate"
    @State private var newSpecialty = "Major Depressive Disorder"
    
    public init(viewModel: PsyPyrusViewModel, showingAddAppt: Binding<Bool>) {
        self.viewModel = viewModel
        self._showingAddAppt = showingAddAppt
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // 1. Executive Summary Cards
            summaryGrid
            
            // 2. Patient Profile Selector Scroll
            patientSelectorSection
            
            // Selected Patient demographics card
            if let activePatient = viewModel.patients.first(where: { $0.id == viewModel.selectedPatientId }) {
                demographicsCard(patient: activePatient)
            }
            
            // 3. Clinical Action Panel Shortcuts
            clinicalShortcutsSection
            
            // 4. Scheduled Visits Section
            scheduleSection
            
            // 5. Active Case History Notes
            caseNotesSection
        }
        .sheet(isPresented: $showingAddPatient) {
            addPatientSheet
        }
    }
    
    // Stats Summary Boxes
    private var summaryGrid: some View {
        HStack(spacing: 10) {
            statsCard(title: "Active cases", value: "\(viewModel.patients.count)", icon: "person.2.fill")
            statsCard(title: "Today visits", value: "\(viewModel.appointments.filter{$0.status == "Scheduled"}.count)", icon: "calendar")
            statsCard(title: "Billing Revenue", value: "$\(Int(viewModel.appointments.filter{$0.status == "Completed"}.map(\.fee).reduce(0,+)))", icon: "banknote")
        }
    }
    
    private func statsCard(title: String, value: String, icon: String) -> some View {
        GlassmorphicCard(isLight: viewModel.theme == "light") {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title.uppercased())
                        .font(.system(size: 9))
                        .fontWeight(.bold)
                        .foregroundColor(.gray)
                    Text(value)
                        .font(.title3)
                        .fontWeight(.black)
                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                }
                Spacer()
                Image(systemName: icon)
                    .foregroundColor(PremiumTheme.clinicianPrimary)
                    .font(.footnote)
            }
        }
    }
    
    // Patient Profile Selector
    private var patientSelectorSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Select Patient Record")
                    .font(.headline)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                Spacer()
                Button(action: { showingAddPatient = true }) {
                    HStack(spacing: 4) {
                        Image(systemName: "plus")
                        Text("Add Patient")
                    }
                    .font(.caption)
                    .foregroundColor(PremiumTheme.clinicianPrimary)
                }
            }
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(viewModel.patients) { p in
                        let isSelected = p.id == viewModel.selectedPatientId
                        Button(action: {
                            viewModel.setSelectedPatient(id: p.id)
                        }) {
                            Text(p.name)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(isSelected ? PremiumTheme.clinicianPrimary : (viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark))
                                .foregroundColor(isSelected ? .white : (viewModel.theme == "light" ? .black : .gray))
                                .cornerRadius(10)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                )
                        }
                    }
                }
            }
        }
    }
    
    // Demographics display
    private func demographicsCard(patient: Patient) -> some View {
        GlassmorphicCard(isLight: viewModel.theme == "light") {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(patient.name)
                        .font(.title3)
                        .fontWeight(.bold)
                    Spacer()
                    StatusBadge(text: "\(patient.riskStatus) Risk", type: patient.riskStatus == "Severe" ? .error : (patient.riskStatus == "Moderate" ? .warning : .success))
                }
                
                Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 8) {
                    GridRow {
                        infoField(label: "Age", value: "\(patient.age)")
                        infoField(label: "Gender", value: patient.gender)
                    }
                    GridRow {
                        infoField(label: "Email", value: patient.email)
                        infoField(label: "Phone", value: patient.phone)
                    }
                    GridRow {
                        infoField(label: "Diagnosis specialty", value: patient.specialty)
                        Spacer()
                    }
                }
            }
        }
    }
    
    private func infoField(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased())
                .font(.system(size: 8))
                .fontWeight(.bold)
                .foregroundColor(.gray)
            Text(value)
                .font(.footnote)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
        }
    }
    
    // Clinical Shortcuts Grid
    private var clinicalShortcutsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("EHR Clinical Shortcuts")
                .font(.headline)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                shortcutButton(title: "AI SOAP Copilot", icon: "sparkles", screen: "AI Copilot")
                shortcutButton(title: "Digital MSE", icon: "pencil.and.outline", screen: "Digital MSE")
                shortcutButton(title: "Treatment Planner", icon: "calendar.badge.clock", screen: "Planner")
                shortcutButton(title: "Scale Assessments", icon: "checklist", screen: "Assessments")
                shortcutButton(title: "HiTOP Matrix", icon: "sitemap.fill", screen: "HiTOP")
                shortcutButton(title: "RDoC Matrix", icon: "dna", screen: "RDoC")
            }
        }
    }
    
    private func shortcutButton(title: String, icon: String, screen: String) -> some View {
        Button(action: { viewModel.navigate(screen: screen) }) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(PremiumTheme.clinicianPrimary)
                Text(title)
                    .font(.footnote)
                    .fontWeight(.bold)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                Spacer()
            }
            .padding()
            .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.02), radius: 5, x: 0, y: 2)
        }
    }
    
    // Scheduled Visits
    private var scheduleSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Today's Appointment Queue")
                    .font(.headline)
                    .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                Spacer()
                Button(action: { showingAddAppt = true }) {
                    Text("Schedule")
                        .font(.caption)
                        .foregroundColor(PremiumTheme.clinicianPrimary)
                }
            }
            
            if viewModel.appointments.isEmpty {
                Text("No sessions scheduled for today.")
                    .font(.footnote)
                    .foregroundColor(.gray)
            } else {
                ForEach(viewModel.appointments) { appt in
                    GlassmorphicCard(isLight: viewModel.theme == "light") {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Image(systemName: appt.isVideo ? "video.fill" : "person.fill")
                                    .foregroundColor(.gray)
                                Text(appt.patientName)
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                Spacer()
                                Text(appt.dateTime)
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            
                            Text(appt.notes)
                                .font(.caption2)
                                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                            
                            HStack {
                                StatusBadge(text: appt.status, type: appt.status == "Completed" ? .success : (appt.status == "Cancelled" ? .error : .warning))
                                Spacer()
                                
                                if appt.status == "Scheduled" {
                                    if appt.isVideo {
                                        Button(action: {
                                            viewModel.navigate(screen: "Teletherapy")
                                        }) {
                                            Text("Launch Session")
                                                .font(.caption)
                                                .fontWeight(.bold)
                                                .foregroundColor(.white)
                                                .padding(.horizontal, 10)
                                                .padding(.vertical, 6)
                                                .background(PremiumTheme.clinicianPrimary)
                                                .cornerRadius(8)
                                        }
                                    }
                                    
                                    Button(action: {
                                        viewModel.conductAppointment(appointmentId: appt.id, status: "Completed")
                                    }) {
                                        Text("Complete")
                                            .font(.caption)
                                            .foregroundColor(PremiumTheme.success)
                                    }
                                    
                                    Button(action: {
                                        viewModel.deleteAppointment(id: appt.id)
                                    }) {
                                        Text("Cancel")
                                            .font(.caption)
                                            .foregroundColor(PremiumTheme.error)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Case Notes list
    private var caseNotesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Clinical Notes Archives")
                .font(.headline)
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            let activeNotes = viewModel.allNotes.filter { $0.patientId == viewModel.selectedPatientId }
            if activeNotes.isEmpty {
                Text("No clinical records saved for this case profile.")
                    .font(.footnote)
                    .foregroundColor(.gray)
            } else {
                ForEach(activeNotes) { note in
                    GlassmorphicCard(isLight: viewModel.theme == "light") {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(note.title)
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                Spacer()
                                StatusBadge(text: note.noteType, type: .info)
                            }
                            
                            Text(note.bodyJson)
                                .font(.caption)
                                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                                .lineLimit(3)
                            
                            HStack {
                                if note.isRiskAlert {
                                    StatusBadge(text: "Risk Warning", type: .error)
                                }
                                Spacer()
                                Text(note.timestamp.formatted())
                                    .font(.system(size: 8))
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Create new patient sheet drawer
    private var addPatientSheet: View {
        ZStack {
            (viewModel.theme == "light" ? PremiumTheme.bgLight : PremiumTheme.bgDark)
                .ignoresSafeArea()
            
            VStack(spacing: 24) {
                HStack {
                    Text("Add Patient Record")
                        .font(.title2)
                        .fontWeight(.bold)
                    Spacer()
                    Button("Cancel") {
                        showingAddPatient = false
                    }
                }
                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                .padding(.horizontal)
                .padding(.top, 24)
                
                Form {
                    Section(header: Text("Demographics")) {
                        TextField("Full Name", text: $newName)
                        Stepper("Age: \(newAge)", value: $newAge, in: 18...100)
                        Picker("Gender", selection: $newGender) {
                            Text("Female").tag("Female")
                            Text("Male").tag("Male")
                            Text("Non-Binary").tag("Non-Binary")
                        }
                    }
                    Section(header: Text("Contact Info")) {
                        TextField("Email Address", text: $newEmail)
                        TextField("Phone Number", text: $newPhone)
                    }
                    Section(header: Text("Clinical Profile")) {
                        Picker("Risk Profile", selection: $newRisk) {
                            Text("None").tag("None")
                            Text("Low").tag("Low")
                            Text("Moderate").tag("Moderate")
                            Text("Severe").tag("Severe")
                        }
                        TextField("Diagnosis specialty", text: $newSpecialty)
                    }
                    
                    Button(action: {
                        viewModel.addPatient(
                            name: newName,
                            age: newAge,
                            gender: newGender,
                            email: newEmail,
                            phone: newPhone,
                            risk: newRisk,
                            specialty: newSpecialty
                        )
                        showingAddPatient = false
                    }) {
                        Text("Create Patient Record")
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
