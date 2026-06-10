package com.example

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.AppDatabase
import com.example.data.Homework
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class HomeworkDatabaseTest {

    private lateinit var db: AppDatabase

    @Before
    fun createDb() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        db = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
    }

    @After
    fun closeDb() {
        db.close()
    }

    @Test
    fun insertAndFetchHomework() = runBlocking {
        val task = Homework(
            patientId = 99L,
            patientName = "Liam Carter",
            title = "CBT Worksheet",
            description = "Test homework task",
            dueDate = "15 Jun, 2026",
            status = "Assigned"
        )
        val id = db.homeworkDao().insertHomework(task)
        assertTrue(id > 0)

        val list = db.homeworkDao().getHomeworkForPatient(99L).first()
        assertEquals(1, list.size)
        assertEquals("Test homework task", list[0].description)
        assertEquals("Assigned", list[0].status)
    }

    @Test
    fun toggleHomeworkCompletion() = runBlocking {
        val task = Homework(
            patientId = 101L,
            patientName = "Sarah Jenkins",
            title = "Breathing Exercise",
            description = "Toggle task",
            dueDate = "12 Jun, 2026",
            status = "Assigned"
        )
        val id = db.homeworkDao().insertHomework(task)
        val inserted = task.copy(id = id)

        val updated = inserted.copy(status = "Completed")
        db.homeworkDao().updateHomework(updated)

        val list = db.homeworkDao().getHomeworkForPatient(101L).first()
        assertEquals(1, list.size)
        assertEquals("Completed", list[0].status)
    }

    @Test
    fun deleteHomework() = runBlocking {
        val task = Homework(
            patientId = 102L,
            patientName = "Sophia Martinez",
            title = "Gratitude Log",
            description = "Delete task",
            dueDate = "18 Jun, 2026",
            status = "Assigned"
        )
        val id = db.homeworkDao().insertHomework(task)

        db.homeworkDao().deleteHomeworkById(id)

        val list = db.homeworkDao().getHomeworkForPatient(102L).first()
        assertTrue(list.isEmpty())
    }
}

