package com.example

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.AppDatabase
import com.example.data.HomeworkTask
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
@Config(sdk = [36])
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
        val task = HomeworkTask(
            patientId = 99L,
            description = "Test homework task",
            isCompleted = false
        )
        val id = db.homeworkTaskDao().insertHomework(task)
        assertTrue(id > 0)

        val list = db.homeworkTaskDao().getHomeworkForPatient(99L).first()
        assertEquals(1, list.size)
        assertEquals("Test homework task", list[0].description)
        assertEquals(false, list[0].isCompleted)
    }

    @Test
    fun toggleHomeworkCompletion() = runBlocking {
        val task = HomeworkTask(
            patientId = 101L,
            description = "Toggle task",
            isCompleted = false
        )
        val id = db.homeworkTaskDao().insertHomework(task)
        val inserted = task.copy(id = id)

        val updated = inserted.copy(isCompleted = true)
        db.homeworkTaskDao().updateHomework(updated)

        val list = db.homeworkTaskDao().getHomeworkForPatient(101L).first()
        assertEquals(1, list.size)
        assertEquals(true, list[0].isCompleted)
    }

    @Test
    fun deleteHomework() = runBlocking {
        val task = HomeworkTask(
            patientId = 102L,
            description = "Delete task",
            isCompleted = false
        )
        val id = db.homeworkTaskDao().insertHomework(task)

        db.homeworkTaskDao().deleteHomeworkById(id)

        val list = db.homeworkTaskDao().getHomeworkForPatient(102L).first()
        assertTrue(list.isEmpty())
    }
}
