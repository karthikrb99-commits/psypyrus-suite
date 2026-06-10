package com.example

import com.example.data.IcdService
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class IcdServiceTest {

    @Before
    fun setUp() {
        // Ensure credentials are empty so we consistently test the local fallback mechanism
        IcdService.customClientId = ""
        IcdService.customClientSecret = ""
    }

    @Test
    fun testLocalFallback_emptyQuery_returnsAll() = runBlocking {
        val results = IcdService.searchIcd11("")
        assertTrue("Fallback list should not be empty", results.isNotEmpty())
        assertEquals(23, results.size)
    }

    @Test
    fun testLocalFallback_depressionQuery_returnsMatches() = runBlocking {
        val results = IcdService.searchIcd11("depress")
        assertTrue("Should match depressive disorders", results.isNotEmpty())
        assertTrue(results.any { it.title.contains("depressive", ignoreCase = true) })
    }

    @Test
    fun testLocalFallback_anxietyQuery_returnsMatches() = runBlocking {
        val results = IcdService.searchIcd11("anxiety")
        assertTrue("Should match anxiety disorders", results.isNotEmpty())
        assertTrue(results.any { it.title.contains("anxiety", ignoreCase = true) })
    }

    @Test
    fun testLocalFallback_codeQuery_returnsMatch() = runBlocking {
        // 6A70 is the ICD-11 code for Single episode depressive disorder
        val results = IcdService.searchIcd11("6A70")
        assertEquals(1, results.size)
        assertEquals("Single episode depressive disorder", results[0].title)
    }

    @Test
    fun testLocalFallback_unknownQuery_returnsEmpty() = runBlocking {
        val results = IcdService.searchIcd11("xyzunknownquerystring123")
        assertTrue("Should return empty list for unknown queries", results.isEmpty())
    }
}
