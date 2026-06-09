package com.example.data

import kotlinx.coroutines.flow.Flow

class PsyPyrusRepository(private val db: AppDatabase) {
    val patients: Flow<List<Patient>> = db.patientDao().getAllPatients()
    val appointments: Flow<List<Appointment>> = db.appointmentDao().getAllAppointments()
    val allNotes: Flow<List<ClinicalNote>> = db.clinicalNoteDao().getAllClinicalNotes()
    val allScores: Flow<List<AssessmentScore>> = db.assessmentScoreDao().getAllScores()
    val moodLogs: Flow<List<MoodLog>> = db.moodLogDao().getAllMoodLogs()
    val auditLogs: Flow<List<SecurityAuditLog>> = db.securityAuditLogDao().getAllAuditLogs()

    suspend fun insertPatient(patient: Patient): Long = db.patientDao().insertPatient(patient)
    suspend fun getPatientById(id: Long): Patient? = db.patientDao().getPatientById(id)
    suspend fun deletePatientById(id: Long) = db.patientDao().deletePatientById(id)

    suspend fun insertAppointment(appointment: Appointment): Long = db.appointmentDao().insertAppointment(appointment)
    suspend fun updateAppointment(appointment: Appointment) = db.appointmentDao().updateAppointment(appointment)
    suspend fun deleteAppointmentById(id: Long) = db.appointmentDao().deleteAppointmentById(id)

    fun getNotesForPatient(patientId: Long): Flow<List<ClinicalNote>> = db.clinicalNoteDao().getClinicalNotesForPatient(patientId)
    suspend fun insertClinicalNote(note: ClinicalNote): Long = db.clinicalNoteDao().insertClinicalNote(note)

    fun getScoresForPatient(patientId: Long): Flow<List<AssessmentScore>> = db.assessmentScoreDao().getScoresForPatient(patientId)
    suspend fun insertScore(score: AssessmentScore): Long = db.assessmentScoreDao().insertScore(score)

    suspend fun insertMoodLog(log: MoodLog): Long = db.moodLogDao().insertMoodLog(log)
    suspend fun insertAuditLog(log: SecurityAuditLog) {
        db.securityAuditLogDao().insertAuditLog(log)
    }

    // Homework Task Operations
    val allHomework: Flow<List<HomeworkTask>> = db.homeworkTaskDao().getAllHomework()
    fun getHomeworkForPatient(patientId: Long): Flow<List<HomeworkTask>> = db.homeworkTaskDao().getHomeworkForPatient(patientId)
    suspend fun insertHomework(task: HomeworkTask): Long = db.homeworkTaskDao().insertHomework(task)
    suspend fun updateHomework(task: HomeworkTask) = db.homeworkTaskDao().updateHomework(task)
    suspend fun deleteHomeworkById(id: Long) = db.homeworkTaskDao().deleteHomeworkById(id)
}
