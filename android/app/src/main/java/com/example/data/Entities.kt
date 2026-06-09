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
    val code: String = "" // teletherapy code e.g. "PSY-PYR-992"
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
data class HomeworkTask(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val patientId: Long,
    val description: String,
    val isCompleted: Boolean = false,
    val assignedDate: Long = System.currentTimeMillis()
)
