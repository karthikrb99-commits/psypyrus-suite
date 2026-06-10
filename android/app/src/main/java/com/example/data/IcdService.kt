package com.example.data

import android.util.Base64
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class IcdSearchResult(
    val code: String,
    val title: String,
    val uri: String
)

object IcdService {
    private const val TAG = "IcdService"
    private const val TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token"
    private const val SEARCH_URL = "https://id.who.int/icd/entity/search"

    var customClientId: String = ""
    var customClientSecret: String = ""

    private var cachedToken: String = ""
    private var tokenExpiryTime: Long = 0

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private suspend fun getAccessToken(): String? = withContext(Dispatchers.IO) {
        if (customClientId.isEmpty() || customClientSecret.isEmpty()) {
            return@withContext null
        }

        // Return cached token if valid
        val currentTime = System.currentTimeMillis()
        if (cachedToken.isNotEmpty() && currentTime < tokenExpiryTime) {
            return@withContext cachedToken
        }

        try {
            val authHeader = "Basic " + Base64.encodeToString(
                "$customClientId:$customClientSecret".toByteArray(Charsets.UTF_8),
                Base64.NO_WRAP
            )

            val requestBody = FormBody.Builder()
                .add("grant_type", "client_credentials")
                .add("scope", "icdapi_access")
                .build()

            val request = Request.Builder()
                .url(TOKEN_URL)
                .post(requestBody)
                .addHeader("Authorization", authHeader)
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e(TAG, "Token request failed: ${response.code}")
                    return@withContext null
                }
                val body = response.body?.string() ?: ""
                val json = JSONObject(body)
                val token = json.getString("access_token")
                val expiresIn = json.getLong("expires_in") // seconds

                cachedToken = token
                tokenExpiryTime = System.currentTimeMillis() + (expiresIn - 60) * 1000 // Buffer of 60 seconds
                return@withContext token
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting access token", e)
            return@withContext null
        }
    }

    suspend fun searchIcd11(query: String): List<IcdSearchResult> = withContext(Dispatchers.IO) {
        val token = getAccessToken()
        if (token == null) {
            Log.i(TAG, "Using local fallback ICD-11 search for query: $query")
            return@withContext getLocalFallbackResults(query)
        }

        try {
            val url = "$SEARCH_URL?q=${java.net.URLEncoder.encode(query, "UTF-8")}"
            val request = Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer $token")
                .addHeader("API-Version", "v2")
                .addHeader("Accept-Language", "en")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e(TAG, "Search request failed: ${response.code}. Falling back to local data.")
                    return@withContext getLocalFallbackResults(query)
                }

                val body = response.body?.string() ?: ""
                val json = JSONObject(body)
                val results = mutableListOf<IcdSearchResult>()
                
                val destinationEntities = json.optJSONArray("destinationEntities")
                if (destinationEntities != null) {
                    for (i in 0 until destinationEntities.length()) {
                        val entity = destinationEntities.getJSONObject(i)
                        val titleRaw = entity.optString("title", "")
                        // Strip HTML tags from WHO search titles
                        val title = titleRaw.replace(Regex("<[^>]*>"), "")
                        val code = entity.optString("theCode", "N/A")
                        val uri = entity.optString("id", "")
                        results.add(IcdSearchResult(code = code, title = title, uri = uri))
                    }
                }
                return@withContext results
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in ICD-11 search, falling back.", e)
            return@withContext getLocalFallbackResults(query)
        }
    }

    private fun getLocalFallbackResults(query: String): List<IcdSearchResult> {
        val lower = query.lowercase().trim()
        val allLocalData = listOf(
            IcdSearchResult("6A70", "Single episode depressive disorder", "https://id.who.int/icd/entity/1410143890"),
            IcdSearchResult("6A71", "Recurrent depressive disorder", "https://id.who.int/icd/entity/281313880"),
            IcdSearchResult("6A72", "Dysthymic disorder", "https://id.who.int/icd/entity/46387063"),
            IcdSearchResult("6B00", "Generalized anxiety disorder", "https://id.who.int/icd/entity/1511210815"),
            IcdSearchResult("6B01", "Panic disorder", "https://id.who.int/icd/entity/1297593674"),
            IcdSearchResult("6B02", "Specific phobia", "https://id.who.int/icd/entity/1429994640"),
            IcdSearchResult("6B03", "Social anxiety disorder", "https://id.who.int/icd/entity/1897368560"),
            IcdSearchResult("6B05", "Agoraphobia", "https://id.who.int/icd/entity/240578619"),
            IcdSearchResult("6B40", "Post-traumatic stress disorder (PTSD)", "https://id.who.int/icd/entity/2070316417"),
            IcdSearchResult("6B41", "Complex post-traumatic stress disorder (Complex PTSD)", "https://id.who.int/icd/entity/585833559"),
            IcdSearchResult("6B42", "Adjustment disorder", "https://id.who.int/icd/entity/155985011"),
            IcdSearchResult("6A05", "Attention deficit hyperactivity disorder (ADHD)", "https://id.who.int/icd/entity/374567562"),
            IcdSearchResult("6A02", "Autism spectrum disorder", "https://id.who.int/icd/entity/1244592887"),
            IcdSearchResult("6A60", "Bipolar I disorder", "https://id.who.int/icd/entity/1930263630"),
            IcdSearchResult("6A61", "Bipolar II disorder", "https://id.who.int/icd/entity/877409240"),
            IcdSearchResult("6A62", "Cyclothymic disorder", "https://id.who.int/icd/entity/2130767228"),
            IcdSearchResult("6D10", "Personality disorder", "https://id.who.int/icd/entity/1922987179"),
            IcdSearchResult("6D11.5", "Borderline pattern personality specifier", "https://id.who.int/icd/entity/713337965"),
            IcdSearchResult("6B20", "Obsessive-compulsive disorder (OCD)", "https://id.who.int/icd/entity/1018318894"),
            IcdSearchResult("6B21", "Body dysmorphic disorder", "https://id.who.int/icd/entity/1769854497"),
            IcdSearchResult("6B80", "Anorexia nervosa", "https://id.who.int/icd/entity/263852482"),
            IcdSearchResult("6B81", "Bulimia nervosa", "https://id.who.int/icd/entity/1120014902"),
            IcdSearchResult("6B82", "Binge eating disorder", "https://id.who.int/icd/entity/1959728221")
        )

        if (lower.isEmpty()) return allLocalData

        return allLocalData.filter {
            it.title.lowercase().contains(lower) || it.code.lowercase().contains(lower)
        }
    }
}
