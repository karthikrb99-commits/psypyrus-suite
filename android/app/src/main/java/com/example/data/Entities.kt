package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "patients")
data class Patient(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val age: Int,
    val gender: String,
    val email: String,
    val phone: String,
    val riskStatus: String, // "None", "Low", "Moderate", "Severe"
    val specialty: String, // e.g., "Depression", "Anxiety", "PTSD", "ADHD"
    val registrationDate: Long = System.currentTimeMillis()
)

@Entity(tableName = "appointments")
data class Appointment(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val patientId: Long,
    val patientName: String,
    val dateTime: String, // e.g., "Today, 10:00 AM" or "08 Jun 2026, 02:00 PM"
    val status: String, // "Scheduled", "Completed", "Cancelled"
    val notes: String = "",
    val fee: Double = 150.0,
    val isVideo: Boolean = true,
    val code: String = "", // teletherapy code e.g. "PSY-PYR-992"
    val practitionerName: String = "Dr. Katherine Brewster"
)

@Entity(tableName = "clinical_notes")
data class ClinicalNote(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val patientId: Long,
    val title: String, // e.g., "SOAP Note", "MSE Assessment", "Treatment Plan"
    val noteType: String, // "SOAP", "MSE", "PLAN", "GENERAL"
    val bodyJson: String, // JSON payload representing structured fields
    val timestamp: Long = System.currentTimeMillis(),
    val isRiskAlert: Boolean = false,
    val riskDisclaimer: String = "AI-assisted note. Licenses practitioner has reviewed."
)

@Entity(tableName = "assessments")
data class AssessmentScore(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val patientId: Long,
    val type: String, // "PHQ-9", "GAD-7", "DASS-21"
    val score: Int,
    val details: String, // e.g. "Mild Depression", "Severe Anxiety"
    val date: Long = System.currentTimeMillis()
)

@Entity(tableName = "mood_logs")
data class MoodLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val patientId: Long = 1, // Default logged-in patient
    val moodScore: Int, // 1 to 10
    val moodNote: String,
    val gratitude: String = "",
    val breathingSeconds: Int = 0,
    val date: Long = System.currentTimeMillis()
)

@Entity(tableName = "security_audit_logs")
data class SecurityAuditLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val action: String, // e.g., "Read Patient EHR", "Generated SOAP Note via AI"
    val details: String, // HIPAA Event description details
    val timestamp: Long = System.currentTimeMillis(),
    val actor: String = "Dr. Katherine Brewster (Admin)",
    val ipAddress: String = "192.168.1.104",
    val encryptionStandard: String = "AES-GCM-256"
)

@Entity(tableName = "homework_tasks")
data class Homework(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val patientId: Long,
    val patientName: String,
    val title: String,
    val description: String,
    val dueDate: String, // e.g. "15 Jun, 2026"
    val status: String, // "Assigned", "In Progress", "Completed"
    val patientNotes: String = "",
    val professionalFeedback: String = "",
    val assignedDate: Long = System.currentTimeMillis()
)

@Entity(tableName = "medications")
data class Medication(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val patientId: Long,
    val patientName: String,
    val name: String,
    val dosage: String,         // e.g. "50mg"
    val frequency: String,      // e.g. "Once daily (Morning)"
    val purpose: String,        // e.g. "Anxiety management"
    val instructions: String,   // e.g. "Take with food"
    val startDate: String,      // e.g. "09 Jun, 2026"
    val durationDays: Int = 30, // Prescription duration
    val isActive: Boolean = true,
    val prescribedBy: String = "Dr. Katherine Brewster"
)

@Entity(tableName = "adherence_logs")
data class AdherenceLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val medicationId: Long,
    val patientId: Long,
    val dateString: String,      // e.g. "09 Jun, 2026"
    val status: String,          // "Taken", "Missed"
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "scratchpad_notes")
data class ScratchpadNote(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val text: String,
    val timestamp: Long = System.currentTimeMillis(),
    val tag: String = "General"
)

@Entity(tableName = "user_accounts")
data class UserAccount(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val username: String,
    val email: String,
    val passwordPlain: String,
    val role: String, // "Professional" or "Patient"
    val fullName: String,
    val licenseOrId: String = "",
    val specialty: String = "",
    val bio: String = "No bio provided yet. Update your professional profile builder to tell patients more about your background and clinical methods.",
    val experienceYears: Int = 5,
    val clinicAddress: String = "Suite 300, Integrative Psychiatric Group, NY",
    val consultationFee: Double = 150.0,
    val rating: Double = 4.8,
    val availableHours: String = "9:00 AM - 5:00 PM",
    val languagesSpoken: String = "English"
)

@Entity(tableName = "availability_slots")
data class AvailabilitySlot(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val practitionerName: String,
    val dateString: String,      // format: "YYYY-MM-DD" e.g. "2026-06-15"
    val timeSlot: String,        // e.g. "09:00 AM", "10:30 AM", "01:00 PM"
    val isBooked: Boolean = false,
    val patientId: Long? = null,
    val patientName: String? = null,
    val notes: String = "",
    val isVideo: Boolean = true,
    val fee: Double = 150.0
)

@Entity(tableName = "peer_groups")
data class PeerGroup(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val description: String,
    val category: String, // e.g., "Anxiety", "Depression", "PTSD", "ADHD Coping", "General Wellness"
    val facilitatorName: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "peer_messages")
data class PeerMessage(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val groupId: Long,
    val senderName: String,
    val senderRole: String,
    val messageText: String,
    val isAnonymous: Boolean = false,
    val isPinned: Boolean = false,
    val likesCount: Int = 0,
    val timestamp: Long = System.currentTimeMillis()
)


