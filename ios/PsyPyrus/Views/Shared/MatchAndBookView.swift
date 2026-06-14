import SwiftUI

public struct MatchAndBookView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    @State private var selectedDoctorId = "dr_sarah"
    @State private var bookingStatus: String? = nil
    
    private let doctors = [
        DocProfile(id: "dr_sarah", name: "Dr. Sarah Jenkins, Psy.D.", specialty: "Anxiety, CBT, Stress", fee: 140, avatar: "LC"),
        DocProfile(id: "dr_alan", name: "Dr. Alan Vance, Ph.D.", specialty: "Depression, Mood, EMDR", fee: 160, avatar: "AV"),
        DocProfile(id: "dr_mei", name: "Dr. Mei Chen, Psy.D.", specialty: "ADHD, ACT, Burnout", fee: 150, avatar: "MC")
    ]
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Header
            HStack {
                Image(systemName: "calendar.badge.plus")
                    .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                    .font(.title2)
                Text(viewModel.activeRole == "Professional" ? "Your Booking Availability" : "Therapist Match & Book")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            if viewModel.activeRole == "Professional" {
                // Professional View: list scheduled bookings
                Text("Manage your slots and upcoming appointments with registered patients.")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                VStack(spacing: 12) {
                    ForEach(viewModel.appointments) { appt in
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(appt.patientName)
                                    .fontWeight(.bold)
                                Text(appt.dateTime)
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            Spacer()
                            Text(appt.status)
                                .font(.caption2)
                                .fontWeight(.bold)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(PremiumTheme.clinicianPrimary.opacity(0.15))
                                .foregroundColor(PremiumTheme.clinicianPrimary)
                                .cornerRadius(8)
                        }
                        .padding()
                        .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                        .cornerRadius(12)
                    }
                }
            } else {
                // Patient View: book slots
                Text("Select a verified provider to book a secure telehealth consultation slot.")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                if let status = bookingStatus {
                    Text(status)
                        .font(.footnote)
                        .fontWeight(.bold)
                        .foregroundColor(PremiumTheme.success)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(PremiumTheme.success.opacity(0.1))
                        .cornerRadius(10)
                }
                
                VStack(spacing: 14) {
                    ForEach(doctors) { doc in
                        let isSelected = doc.id == selectedDoctorId
                        VStack(alignment: .leading, spacing: 10) {
                            HStack(spacing: 12) {
                                Circle()
                                    .fill(PremiumTheme.patientPrimary.opacity(0.2))
                                    .frame(width: 40, height: 40)
                                    .overlay(
                                        Text(doc.avatar)
                                            .fontWeight(.bold)
                                            .foregroundColor(PremiumTheme.patientPrimary)
                                    )
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(doc.name)
                                        .fontWeight(.bold)
                                    Text(doc.specialty)
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                                Spacer()
                                Text("$\(doc.fee)/hr")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.teal)
                            }
                            
                            if isSelected {
                                Divider()
                                Text("Available slots for Wednesday:")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                
                                HStack(spacing: 8) {
                                    Button(action: { bookSession(doc: doc, slot: "10:00 AM") }) {
                                        Text("10:00 AM")
                                            .font(.caption2)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 6)
                                            .background(PremiumTheme.patientPrimary)
                                            .foregroundColor(.white)
                                            .cornerRadius(6)
                                    }
                                    
                                    Button(action: { bookSession(doc: doc, slot: "02:00 PM") }) {
                                        Text("02:00 PM")
                                            .font(.caption2)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 6)
                                            .background(PremiumTheme.patientPrimary)
                                            .foregroundColor(.white)
                                            .cornerRadius(6)
                                    }
                                    
                                    Button(action: { bookSession(doc: doc, slot: "04:30 PM") }) {
                                        Text("04:30 PM")
                                            .font(.caption2)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 6)
                                            .background(PremiumTheme.patientPrimary)
                                            .foregroundColor(.white)
                                            .cornerRadius(6)
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(isSelected ? PremiumTheme.patientPrimary : Color.clear, lineWidth: 1)
                        )
                        .onTapGesture {
                            selectedDoctorId = doc.id
                        }
                    }
                }
            }
        }
    }
    
    private func bookSession(doc: DocProfile, slot: String) {
        bookingStatus = "Booking confirmed with \(doc.name) at \(slot)!"
        
        // Add to main appointments viewmodel list
        let nextId = Int64(viewModel.appointments.count + 1)
        let newAppt = Appointment(
            id: nextId,
            patientId: 1,
            patientName: "Alex Rivera",
            dateTime: "Wed, \(slot)",
            status: "Scheduled",
            notes: "Initial consultation via PsychConnect Match.",
            fee: Double(doc.fee),
            isVideo: true,
            code: "PSY-CON-\(nextId)"
        )
        viewModel.appointments.append(newAppt)
    }
}

struct DocProfile: Identifiable {
    let id: String
    let name: String
    let specialty: String
    let fee: Int
    let avatar: String
}
