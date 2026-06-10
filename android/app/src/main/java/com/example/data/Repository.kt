package com.example.data

import kotlinx.coroutines.flow.Flow

class PsyPyrusRepository(private val db: AppDatabase) {
    val patients: Flow<List<Patient>> = db.patientDao().getAllPatients()
    val appointments: Flow<List<Appointment>> = db.appointmentDao().getAllAppointments()
    val allNotes: Flow<List<ClinicalNote>> = db.clinicalNoteDao().getAllClinicalNotes()
    val allScores: Flow<List<AssessmentScore>> = db.assessmentScoreDao().getAllScores()
    val moodLogs: Flow<List<MoodLog>> = db.moodLogDao().getAllMoodLogs()
    val auditLogs: Flow<List<SecurityAuditLog>> = db.securityAuditLogDao().getAllAuditLogs()
    val allHomework: Flow<List<Homework>> = db.homeworkDao().getAllHomeworkTasks()
    val allMedications: Flow<List<Medication>> = db.medicationDao().getAllMedications()
    val allAdherenceLogs: Flow<List<AdherenceLog>> = db.medicationDao().getAllAdherenceLogs()
    val scratchpadNotes: Flow<List<ScratchpadNote>> = db.scratchpadNoteDao().getAllScratchpadNotes()
    val allUserAccounts: Flow<List<UserAccount>> = db.userAccountDao().getAllUserAccounts()

    suspend fun insertScratchpadNote(note: ScratchpadNote): Long = db.scratchpadNoteDao().insertScratchpadNote(note)
    suspend fun deleteScratchpadNoteById(id: Long) = db.scratchpadNoteDao().deleteScratchpadNoteById(id)
    suspend fun clearAllScratchpadNotes() = db.scratchpadNoteDao().deleteAllScratchpadNotes()

    suspend fun insertUserAccount(user: UserAccount): Long = db.userAccountDao().insertUserAccount(user)
    suspend fun getUserByUsername(username: String): UserAccount? = db.userAccountDao().getUserByUsername(username)
    suspend fun getUserByEmail(email: String): UserAccount? = db.userAccountDao().getUserByEmail(email)

    fun getHomeworkForPatient(patientId: Long): Flow<List<Homework>> = db.homeworkDao().getHomeworkForPatient(patientId)
    suspend fun insertHomework(homework: Homework): Long = db.homeworkDao().insertHomework(homework)
    suspend fun updateHomework(homework: Homework) = db.homeworkDao().updateHomework(homework)
    suspend fun deleteHomeworkById(id: Long) = db.homeworkDao().deleteHomeworkById(id)

    fun getMedicationsForPatient(patientId: Long): Flow<List<Medication>> = db.medicationDao().getMedicationsForPatient(patientId)
    suspend fun insertMedication(medication: Medication): Long = db.medicationDao().insertMedication(medication)
    suspend fun updateMedication(medication: Medication) = db.medicationDao().updateMedication(medication)
    suspend fun deleteMedicationById(id: Long) = db.medicationDao().deleteMedicationById(id)

    fun getAdherenceLogsForPatient(patientId: Long): Flow<List<AdherenceLog>> = db.medicationDao().getAdherenceLogsForPatient(patientId)
    fun getAdherenceLogsForMedication(medicationId: Long): Flow<List<AdherenceLog>> = db.medicationDao().getAdherenceLogsForMedication(medicationId)
    suspend fun insertAdherenceLog(log: AdherenceLog): Long = db.medicationDao().insertAdherenceLog(log)
    suspend fun deleteAdherenceLogAtDate(medicationId: Long, dateString: String) = db.medicationDao().deleteAdherenceLogAtDate(medicationId, dateString)

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

    // Availability Slots
    val availabilitySlots: Flow<List<AvailabilitySlot>> = db.availabilitySlotDao().getAllAvailabilitySlots()
    suspend fun insertAvailabilitySlot(slot: AvailabilitySlot): Long = db.availabilitySlotDao().insertAvailabilitySlot(slot)
    suspend fun updateAvailabilitySlot(slot: AvailabilitySlot) = db.availabilitySlotDao().updateAvailabilitySlot(slot)
    suspend fun deleteAvailabilitySlot(id: Long) = db.availabilitySlotDao().deleteAvailabilitySlot(id)
    suspend fun deleteSlotByDetails(dateString: String, timeSlot: String, practitionerName: String) = db.availabilitySlotDao().deleteSlotByDetails(dateString, timeSlot, practitionerName)
    suspend fun getSlotsForDate(dateString: String): List<AvailabilitySlot> = db.availabilitySlotDao().getSlotsForDate(dateString)

    // Peer Support Groups
    val allPeerGroups: Flow<List<PeerGroup>> = db.peerGroupDao().getAllPeerGroups()
    suspend fun insertPeerGroup(group: PeerGroup): Long = db.peerGroupDao().insertPeerGroup(group)
    suspend fun updatePeerGroup(group: PeerGroup) = db.peerGroupDao().updatePeerGroup(group)
    suspend fun deletePeerGroup(id: Long) = db.peerGroupDao().deletePeerGroup(id)

    fun getMessagesForGroup(groupId: Long): Flow<List<PeerMessage>> = db.peerMessageDao().getMessagesForGroup(groupId)
    suspend fun insertPeerMessage(message: PeerMessage): Long = db.peerMessageDao().insertPeerMessage(message)
    suspend fun deletePeerMessage(id: Long) = db.peerMessageDao().deletePeerMessage(id)
    suspend fun updateMessagePinStatus(id: Long, isPinned: Boolean) = db.peerMessageDao().updateMessagePinStatus(id, isPinned)
    suspend fun likeMessage(id: Long) = db.peerMessageDao().likeMessage(id)
}
