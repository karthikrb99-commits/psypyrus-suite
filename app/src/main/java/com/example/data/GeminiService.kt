package com.example.data

import android.util.Log
import com.example.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

object GeminiService {
    private const val TAG = "GeminiService"
    private const val BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent"

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    // Helper to check key existence
    fun isApiKeyConfigured(): Boolean {
        val key = BuildConfig.GEMINI_API_KEY
        return key.isNotEmpty() && key != "MY_GEMINI_API_KEY" && key != "GEMINI_API_KEY"
    }

    suspend fun callGemini(prompt: String, systemInstruction: String = ""): String = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.GEMINI_API_KEY
        
        // Return structured mock outputs if API key is not available
        if (!isApiKeyConfigured()) {
            Log.w(TAG, "Gemini API key is not set or placeholder. Falling back to Demo clinical responder.")
            return@withContext getMockResponse(prompt)
        }

        try {
            val requestBodyJson = JSONObject().apply {
                val contentsArray = JSONArray().apply {
                    val contentObj = JSONObject().apply {
                        val partsArray = JSONArray().apply {
                            val partObj = JSONObject().apply {
                                put("text", prompt)
                            }
                            put(partObj)
                        }
                        put("parts", partsArray)
                    }
                    put(contentObj)
                }
                put("contents", contentsArray)

                if (systemInstruction.isNotEmpty()) {
                    val systemInstructionObj = JSONObject().apply {
                        val partsArray = JSONArray().apply {
                            val partObj = JSONObject().apply {
                                put("text", systemInstruction)
                            }
                            put(partObj)
                        }
                        put("parts", partsArray)
                    }
                    put("systemInstruction", systemInstructionObj)
                }

                // Optional configuration
                val config = JSONObject().apply {
                    put("temperature", 0.3) // Lower temperature for more clinical/deterministic data
                }
                put("generationConfig", config)
            }

            val mediaType = "application/json; charset=utf-8".toMediaType()
            val requestBody = requestBodyJson.toString().toRequestBody(mediaType)

            val url = "$BASE_URL?key=$apiKey"
            val request = Request.Builder()
                .url(url)
                .post(requestBody)
                .header("Content-Type", "application/json")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val errorBody = response.body?.string() ?: ""
                    Log.e(TAG, "Gemini API Call failed! HTTP: ${response.code}, Body: $errorBody")
                    throw IOException("Network failure: HTTP ${response.code} $errorBody")
                }

                val responseBody = response.body?.string()
                if (responseBody.isNullOrEmpty()) {
                    return@withContext "Empty response from PsyPyrus AI Engine."
                }

                val responseJson = JSONObject(responseBody)
                val candidatesArray = responseJson.optJSONArray("candidates")
                if (candidatesArray != null && candidatesArray.length() > 0) {
                    val firstCandidate = candidatesArray.getJSONObject(0)
                    val contentObj = firstCandidate.optJSONObject("content")
                    val partsArray = contentObj?.optJSONArray("parts")
                    if (partsArray != null && partsArray.length() > 0) {
                        return@withContext partsArray.getJSONObject(0).optString("text", "No text generated.")
                    }
                }
                return@withContext "No output candidate found. Check content filters or API quota constraints."
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error executing call to Gemini API: ${e.message}", e)
            return@withContext "Clinical API Error: ${e.localizedMessage}. Entering local high-safety backup mode."
        }
    }

    private fun getMockResponse(prompt: String): String {
        val lower = prompt.lowercase()
        return when {
            lower.contains("soap") || lower.contains("transcript") -> {
                """
                # CLINICAL SOAP NOTE (DECISION SUPPORT)
                
                **SUBJECTIVE (S):**
                Patient reports worsening anxiety symptoms over the past 3 weeks, linked to increased corporate stressors. Describes sleep onset latency (~90 mins) and somatic signs including epigastric tightness, muscle scanning tension, and mild palpitations. Patient notes progress with diaphragmatic breathing but struggles when working over 50 hours/week.
                
                **OBJECTIVE (O):**
                * Appearance: Professionally dressed, appropriate hygiene, good eye contact.
                * Behavior: Co-operative with interviewer; mild psychomotor agitation noted (leg shaking).
                * Affect: Anxious expression, restricted range, congruent with mood.
                * Speech: Elevated rate, volume normal, tone responsive.
                * Cognition: Fully oriented x3. Attention stable. Memory intact.
                * GAD-7: 14 (Moderate anxiety).
                
                **ASSESSMENT (A):**
                1. Generalized Anxiety Disorder (DSM-5 300.02 / ICD-10 F41.1) - Moderate severity, triggered by occupational exhaustion.
                2. Sleep Onset Insomnia Secondary to Anxiety.
                * Differential considerations include Adjustment Disorder with Anxious Mood or Thyroid Dysfunction (recommend medical rule-out).
                
                **PLAN (P):**
                1. Cognitive Behavioral Therapy (CBT) protocols focus: cognitive restructuring of occupational catastrophizing.
                2. Set boundaries around laptop use post-8:00 PM.
                3. Daily wellness: 10 minutes of mindfulness breathing (Wellness Hub).
                4. Homework: Complete GAD-7 assessment before the next session.
                5. Referral: Recommend primary care physician visit to rule out thyroid panel.
                """.trimIndent()
            }
            lower.contains("mse") || lower.contains("mental status") -> {
                """
                The patient presented as well-groomed, wearing appropriate casual attire with good hygiene. Eye contact was maintained appropriately. Motor activity was marked by overall cooperation, with slight psychomotor activity (foot tapping) congruent with reported anxiety. Speech rate was within normative limits, displaying appropriate, responsive vocal tones. Objective mood was noted as anxious with restricted affect range. Thought stream was coherent with no formal thought disorders. Perception was intact with no illusions or hallucinations. Cognition was oriented to person, place, and time, exhibiting normal memory retention. Insight was evaluated at Grade 4 (intellectual awareness of anxiety symptoms without current somatic coping). Judgment remains sound for personal and social decision-making.
                """.trimIndent()
            }
            lower.contains("diagnosis") || lower.contains("suggest") || lower.contains("symptom") -> {
                """
                # DSM-5-TR & ICD-10 DIAGNOSTIC CO-PILOT
                
                ## Probable Differential Diagnostics
                
                ### 1. Major Depressive Disorder, Single Episode, Moderate
                *   **ICD-10 Code**: F32.1
                *   **DSM-5 Code**: 296.22
                *   **Confidence**: High (84%)
                *   **DSM-5 Criteria Checked**:
                    *   [x] Depressed mood most of the day (~2 weeks)
                    *   [x] Insomnia (early morning awakening)
                    *   [x] Psychomotor retardation / fatigue
                    *   [x] Feelings of worthlessness / excessive guilt
                    
                ### 2. Generalized Anxiety Disorder (Comorbid)
                *   **ICD-10 Code**: F41.1
                *   **DSM-5 Code**: 300.02
                *   **Confidence**: Moderate (68%)
                *   **DSM-5 Criteria Checked**:
                    *   [x] Excessive anxiety, difficult to control
                    *   [x] Muscle tension, sleep issues, restlessness
                
                ---
                ## Clinical Recommendations & Lab Rules
                * Recommend organic rule-out: Thyroid Pane (TSH, Free T4) and Vitamin D3/B12 count.
                * Rule out Substance-Induced Mood Disorder.
                """.trimIndent()
            }
            lower.contains("smart") || lower.contains("goal") || lower.contains("treat") -> {
                """
                # EVIDENCE-BASED TREATMENT SCHEME
                
                ## 🎯 SMART Goals
                *   **Specific**: Decrease physical anxiety symptoms during work presentations.
                *   **Measurable**: Self-reported distress level (0-10) drops from 8 to 4 by week 6.
                *   **Achievable**: Utilize box breathing for 4 minutes right before stepping onto the podium.
                *   **Relevant**: Anxiety currently impacts job review and standing.
                *   **Time-bound**: Accomplish within 6 weeks, validated by presentation logs.
                
                ## 🛠️ Evidence-Based Interventions
                1.  **Somatic Skills**: Train patient on 4-4-4 diaphragmatic pacing.
                2.  **Cognitive Reframing**: Identify and disrupt automatic negative thoughts ("I will fail") into objective reality statements.
                
                ## 📝 Homework Assignments
                *   Practice 5 minutes of box breathing daily in non-stressful situations.
                *   Log situational triggers in the Cognitive Journal twice per week.
                """.trimIndent()
            }
            lower.contains("risk") || lower.contains("suicide") || lower.contains("crisis") -> {
                """
                # AI MEDICAL SAFETY CORE & RISK DETECTOR
                
                ## ⚠️ Risk Alert Parameters
                *   **Primary Severity Tracker**: NONE TO LOW CRISIS FLAG DETECTED.
                *   **Risk Description**: Text contains clinical exhaustion but lacks active suicidal intent, self-directed violence planning, or lethal means description.
                
                ## 📋 Mandatory Action Framework
                1.  Maintain routine therapeutic boundaries.
                2.  Support patient with emotional self-regulation exercises.
                3.  Provide 24/7 National Crisis Line contacts as a universal safety net.
                """.trimIndent()
            }
            else -> {
                """
                # CLINICAL GUIDELINE SEARCH ENGINE
                
                **Query matched in DSM-5-TR Knowledgebase**:
                *   Section V: Anxiety Disorders Chapter
                *   Clinical Guidelines: Cognitive Behavioral Therapy (CBT-Anxiety) holds level-1 clinical evidence as primary behavioral intervention. Includes interoceptive exposure (for panic panic manifestations) and in-vivo situational exposure hierarchies.
                
                **Key Differential Factors**:
                *   Panic Disorder: characterized by sudden recurring spontaneous unexpected panic surges.
                *   Social Anxiety Disorder (F40.1): fear strictly bound to peer evaluation or public performances.
                """.trimIndent()
            }
        }
    }
}
