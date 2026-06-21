package com.example.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface PatientDao {
    @Query("SELECT * FROM patients ORDER BY registrationDate DESC")
    fun getAllPatients(): Flow<List<Patient>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPatient(patient: Patient): Long

    @Query("SELECT * FROM patients WHERE id = :id")
    suspend fun getPatientById(id: Long): Patient?

    @Query("DELETE FROM patients WHERE id = :id")
    suspend fun deletePatientById(id: Long)
}

@Dao
interface AppointmentDao {
    @Query("SELECT * FROM appointments ORDER BY id DESC")
    fun getAllAppointments(): Flow<List<Appointment>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAppointment(appointment: Appointment): Long

    @Update
    suspend fun updateAppointment(appointment: Appointment)

    @Query("DELETE FROM appointments WHERE id = :id")
    suspend fun deleteAppointmentById(id: Long)
}

@Dao
interface ClinicalNoteDao {
    @Query("SELECT * FROM clinical_notes WHERE patientId = :patientId ORDER BY timestamp DESC")
    fun getClinicalNotesForPatient(patientId: Long): Flow<List<ClinicalNote>>

    @Query("SELECT * FROM clinical_notes ORDER BY timestamp DESC")
    fun getAllClinicalNotes(): Flow<List<ClinicalNote>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertClinicalNote(note: ClinicalNote): Long
}

@Dao
interface AssessmentScoreDao {
    @Query("SELECT * FROM assessments WHERE patientId = :patientId ORDER BY date DESC")
    fun getScoresForPatient(patientId: Long): Flow<List<AssessmentScore>>

    @Query("SELECT * FROM assessments ORDER BY date DESC")
    fun getAllScores(): Flow<List<AssessmentScore>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScore(score: AssessmentScore): Long
}

@Dao
interface MoodLogDao {
    @Query("SELECT * FROM mood_logs ORDER BY date DESC")
    fun getAllMoodLogs(): Flow<List<MoodLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMoodLog(log: MoodLog): Long
}

@Dao
interface SecurityAuditLogDao {
    @Query("SELECT * FROM security_audit_logs ORDER BY timestamp DESC LIMIT 100")
    fun getAllAuditLogs(): Flow<List<SecurityAuditLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAuditLog(log: SecurityAuditLog): Long
}

@Dao
interface HomeworkDao {
    @Query("SELECT * FROM homework_tasks ORDER BY assignedDate DESC")
    fun getAllHomeworkTasks(): Flow<List<Homework>>

    @Query("SELECT * FROM homework_tasks WHERE patientId = :patientId ORDER BY assignedDate DESC")
    fun getHomeworkForPatient(patientId: Long): Flow<List<Homework>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHomework(homework: Homework): Long

    @Update
    suspend fun updateHomework(homework: Homework)

    @Query("DELETE FROM homework_tasks WHERE id = :id")
    suspend fun deleteHomeworkById(id: Long)
}

@Dao
interface MedicationDao {
    @Query("SELECT * FROM medications ORDER BY isActive DESC, id DESC")
    fun getAllMedications(): Flow<List<Medication>>

    @Query("SELECT * FROM medications WHERE patientId = :patientId ORDER BY isActive DESC, id DESC")
    fun getMedicationsForPatient(patientId: Long): Flow<List<Medication>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMedication(medication: Medication): Long

    @Update
    suspend fun updateMedication(medication: Medication)

    @Query("DELETE FROM medications WHERE id = :id")
    suspend fun deleteMedicationById(id: Long)

    @Query("SELECT * FROM adherence_logs ORDER BY timestamp DESC")
    fun getAllAdherenceLogs(): Flow<List<AdherenceLog>>

    @Query("SELECT * FROM adherence_logs WHERE patientId = :patientId ORDER BY timestamp DESC")
    fun getAdherenceLogsForPatient(patientId: Long): Flow<List<AdherenceLog>>

    @Query("SELECT * FROM adherence_logs WHERE medicationId = :medicationId ORDER BY timestamp DESC")
    fun getAdherenceLogsForMedication(medicationId: Long): Flow<List<AdherenceLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAdherenceLog(log: AdherenceLog): Long

    @Query("DELETE FROM adherence_logs WHERE medicationId = :medicationId AND dateString = :dateString")
    suspend fun deleteAdherenceLogAtDate(medicationId: Long, dateString: String)
}

@Dao
interface ScratchpadNoteDao {
    @Query("SELECT * FROM scratchpad_notes ORDER BY timestamp DESC")
    fun getAllScratchpadNotes(): Flow<List<ScratchpadNote>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScratchpadNote(note: ScratchpadNote): Long

    @Query("DELETE FROM scratchpad_notes WHERE id = :id")
    suspend fun deleteScratchpadNoteById(id: Long)

    @Query("DELETE FROM scratchpad_notes")
    suspend fun deleteAllScratchpadNotes()
}

@Dao
interface UserAccountDao {
    @Query("SELECT * FROM user_accounts ORDER BY id DESC")
    fun getAllUserAccounts(): Flow<List<UserAccount>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUserAccount(user: UserAccount): Long

    @Query("SELECT * FROM user_accounts WHERE username = :username LIMIT 1")
    suspend fun getUserByUsername(username: String): UserAccount?

    @Query("SELECT * FROM user_accounts WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): UserAccount?
}

@Dao
interface AvailabilitySlotDao {
    @Query("SELECT * FROM availability_slots ORDER BY dateString ASC, timeSlot ASC")
    fun getAllAvailabilitySlots(): Flow<List<AvailabilitySlot>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAvailabilitySlot(slot: AvailabilitySlot): Long

    @Update
    suspend fun updateAvailabilitySlot(slot: AvailabilitySlot)

    @Query("DELETE FROM availability_slots WHERE id = :id")
    suspend fun deleteAvailabilitySlot(id: Long)

    @Query("DELETE FROM availability_slots WHERE dateString = :dateString AND timeSlot = :timeSlot AND practitionerName = :practitionerName")
    suspend fun deleteSlotByDetails(dateString: String, timeSlot: String, practitionerName: String)

    @Query("SELECT * FROM availability_slots WHERE dateString = :dateString")
    suspend fun getSlotsForDate(dateString: String): List<AvailabilitySlot>
}

@Dao
interface PeerGroupDao {
    @Query("SELECT * FROM peer_groups ORDER BY createdAt DESC")
    fun getAllPeerGroups(): Flow<List<PeerGroup>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPeerGroup(group: PeerGroup): Long

    @Update
    suspend fun updatePeerGroup(group: PeerGroup)

    @Query("DELETE FROM peer_groups WHERE id = :id")
    suspend fun deletePeerGroup(id: Long)
}

@Dao
interface PeerMessageDao {
    @Query("SELECT * FROM peer_messages WHERE groupId = :groupId ORDER BY isPinned DESC, timestamp ASC")
    fun getMessagesForGroup(groupId: Long): Flow<List<PeerMessage>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPeerMessage(message: PeerMessage): Long

    @Query("DELETE FROM peer_messages WHERE id = :id")
    suspend fun deletePeerMessage(id: Long)

    @Query("UPDATE peer_messages SET isPinned = :isPinned WHERE id = :id")
    suspend fun updateMessagePinStatus(id: Long, isPinned: Boolean)

    @Query("UPDATE peer_messages SET likesCount = likesCount + 1 WHERE id = :id")
    suspend fun likeMessage(id: Long)
}

@Database(
    entities = [
        Patient::class,
        Appointment::class,
        ClinicalNote::class,
        AssessmentScore::class,
        MoodLog::class,
        SecurityAuditLog::class,
        Homework::class,
        Medication::class,
        AdherenceLog::class,
        ScratchpadNote::class,
        UserAccount::class,
        AvailabilitySlot::class,
        PeerGroup::class,
        PeerMessage::class
    ],
    version = 10,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun patientDao(): PatientDao
    abstract fun appointmentDao(): AppointmentDao
    abstract fun clinicalNoteDao(): ClinicalNoteDao
    abstract fun assessmentScoreDao(): AssessmentScoreDao
    abstract fun moodLogDao(): MoodLogDao
    abstract fun securityAuditLogDao(): SecurityAuditLogDao
    abstract fun homeworkDao(): HomeworkDao
    abstract fun medicationDao(): MedicationDao
    abstract fun scratchpadNoteDao(): ScratchpadNoteDao
    abstract fun userAccountDao(): UserAccountDao
    abstract fun availabilitySlotDao(): AvailabilitySlotDao
    abstract fun peerGroupDao(): PeerGroupDao
    abstract fun peerMessageDao(): PeerMessageDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "psypyrus_ai_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
