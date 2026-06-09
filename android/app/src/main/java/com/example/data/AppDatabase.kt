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
interface HomeworkTaskDao {
    @Query("SELECT * FROM homework_tasks ORDER BY assignedDate DESC")
    fun getAllHomework(): Flow<List<HomeworkTask>>

    @Query("SELECT * FROM homework_tasks WHERE patientId = :patientId ORDER BY assignedDate DESC")
    fun getHomeworkForPatient(patientId: Long): Flow<List<HomeworkTask>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHomework(task: HomeworkTask): Long

    @Update
    suspend fun updateHomework(task: HomeworkTask)

    @Query("DELETE FROM homework_tasks WHERE id = :id")
    suspend fun deleteHomeworkById(id: Long)
}

@Database(
    entities = [
        Patient::class,
        Appointment::class,
        ClinicalNote::class,
        AssessmentScore::class,
        MoodLog::class,
        SecurityAuditLog::class,
        HomeworkTask::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun patientDao(): PatientDao
    abstract fun appointmentDao(): AppointmentDao
    abstract fun clinicalNoteDao(): ClinicalNoteDao
    abstract fun assessmentScoreDao(): AssessmentScoreDao
    abstract fun moodLogDao(): MoodLogDao
    abstract fun securityAuditLogDao(): SecurityAuditLogDao
    abstract fun homeworkTaskDao(): HomeworkTaskDao

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
