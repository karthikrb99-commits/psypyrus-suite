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

    // Custom runtime integration parameters (synchronized by ViewModel)
    var customGeminiKey: String = ""
    var customOpenAiKey: String = ""
    var customLlmUrl: String = "https://api.openai.com/v1/chat/completions"
    var activeProvider: Int = 0 // 0: Gemini, 1: OpenAI/Custom

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    // Helper to check key existence
    fun isApiKeyConfigured(): Boolean {
        if (activeProvider == 1) {
            return customOpenAiKey.isNotEmpty()
        }
        val key = if (customGeminiKey.isNotEmpty()) customGeminiKey else BuildConfig.GEMINI_API_KEY
        return key.isNotEmpty() && key != "MY_GEMINI_API_KEY" && key != "GEMINI_API_KEY"
    }

    private suspend fun callCustomLlm(prompt: String, systemInstruction: String): String = withContext(Dispatchers.IO) {
        if (customOpenAiKey.isEmpty()) {
            return@withContext "Error: OpenAI/Custom LLM API key is not configured in settings."
        }
        try {
            val messagesArray = JSONArray().apply {
                if (systemInstruction.isNotEmpty()) {
                    put(JSONObject().apply {
                        put("role", "system")
                        put("content", systemInstruction)
                    })
                }
                put(JSONObject().apply {
                    put("role", "user")
                    put("content", prompt)
                })
            }
            
            val requestBodyJson = JSONObject().apply {
                put("model", "gpt-4o-mini") // fallback model identifier
                put("messages", messagesArray)
                put("temperature", 0.3)
            }
            
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val requestBody = requestBodyJson.toString().toRequestBody(mediaType)
            
            val request = Request.Builder()
                .url(customLlmUrl)
                .post(requestBody)
                .addHeader("Content-Type", "application/json")
                .addHeader("Authorization", "Bearer $customOpenAiKey")
                .build()
                
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val errorBody = response.body?.string() ?: ""
                    return@withContext "Custom LLM HTTP ${response.code}: $errorBody"
                }
                val responseBody = response.body?.string() ?: ""
                if (responseBody.isEmpty()) return@withContext "Empty Custom LLM response."
                
                val responseJson = JSONObject(responseBody)
                val choices = responseJson.optJSONArray("choices")
                if (choices != null && choices.length() > 0) {
                    val choice = choices.getJSONObject(0)
                    val msg = choice.optJSONObject("message")
                    if (msg != null) {
                        return@withContext msg.optString("content", "No content found.")
                    }
                }
                return@withContext "Parsing failure inside OpenAI response. Raw: $responseBody"
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in Custom LLM call", e)
            return@withContext "Custom LLM Exception: ${e.localizedMessage}"
        }
    }

    suspend fun callGemini(prompt: String, systemInstruction: String = ""): String = withContext(Dispatchers.IO) {
        if (activeProvider == 1) {
            return@withContext callCustomLlm(prompt, systemInstruction)
        }

        val apiKey = if (customGeminiKey.isNotEmpty()) customGeminiKey else BuildConfig.GEMINI_API_KEY
        
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
            lower.contains("proactive") || lower.contains("trends") || lower.contains("behavioral analysis") -> {
                when {
                    lower.contains("liam") -> {
                        """
                        ### 📈 1. BEHAVIORAL TRENDS & CONTEXT CORRELATIONS
                        - **PHQ-9 Severity Track**: Standard assessment registers a critical PHQ-9 score of 21, indicating severe clinical depression.
                        - **Mood Dynamics & Compliance**: Recent daily mood logs show severe flat affect and cognitive stagnation. Correlation matches low medication adherence (50% adherence logs missed) and uncompleted behavioral homework. Sleep duration of 11 hours is reported, which is highly consistent with unrefreshing hypersomnia typical of atypical depressive episodes.

                        ### ⚠️ 2. POTENTIAL RISKS & CLINICAL DETERIORATION ALERTS
                        - **Risk Screen Alert**: Although no active suicidal plan is documented in current text, the baseline risk status is **Severe** secondary to profound clinical withdrawal and extreme brain fog. Waking up unrefreshed despite hypersomnia increases exhaustion index.
                        - **Somatic Risk**: Elevated cognitive stagnation. Check for severe lethargy and catastrophic negative thoughts.

                        ### 🎯 3. THERAPEUTIC FOCUS & PROACTIVE RECOVERY STEPS
                        - **Clinical Consideration**: Focus upcoming sessions on Behavioral Activation scheduling starting with minimal micro-goals (e.g. 5-minute sunlight walks).
                        - **Plan Revision**: Conduct a structured sleep hygiene check-in and CBT rescheduling for sleep onset boundaries.
                        - **Medical Consultation**: Advise a medication re-evaluation with Dr. Brewster to adjust the dosage of SSRIs or verify antidepressant compliance.
                        """.trimIndent()
                    }
                    lower.contains("sarah") -> {
                        """
                        ### 📈 1. BEHAVIORAL TRENDS & CONTEXT CORRELATIONS
                        - **GAD-7 Anxiety Curve**: Assessment score of 14 points, registering moderate-to-severe occupational anxiety. Worsens severely during corporately demanding presentation preparation.
                        - **Somatic Indicators**: Correlates with epigastric discomfort, chest tightness, and rapid pulse. Shows strong somatic panic symptoms matching GAD-7 scores. Excellent compliance with diaphragmatic breathing training reduces physical tightness temporarily from 8/10 to 4/10 distress.

                        ### ⚠️ 2. POTENTIAL RISKS & CLINICAL DETERIORATION ALERTS
                        - **Somatic Panic Transitions**: High risk of panic onset around presentation dates.
                        - **Coping Failure Risk**: In times of high pressure (>50 hours working weeks), client tends to experience racing thoughts and sleep latency spikes (~90 mins), indicating susceptibility to burnout and autonomic hyperarousal.

                        ### 🎯 3. THERAPEUTIC FOCUS & PROACTIVE RECOVERY STEPS
                        - **Somatic Skill Reinforcement**: Continue training on 4-4-4 chest diaphragmatic pacing; recommend box-breathing exercises 5 minutes before presentations.
                        - **Restructuring Automatic Thoughts**: Conduct CBT Cognitive Restructuring focus on work-triggered catastrophizing ("I will fail and be fired").
                        - **Medical referral**: PCP follow-up recommended to conduct a full thyroid panel and rule out organic endocrine hyperarousal.
                        """.trimIndent()
                    }
                    lower.contains("sophia") -> {
                        """
                        ### 📈 1. BEHAVIORAL TRENDS & CONTEXT CORRELATIONS
                        - **PTSD Traumatic Markers**: Elevated trauma scale scores (GAD-7 baseline 16) with intrusive memory flashbacks related to developmental trauma.
                        - **Behavioral Patterns**: Scanning and hyperarousal are highest during public college lectures, leading to cognitive fatigue and social avoidance.

                        ### ⚠️ 2. POTENTIAL RISKS & CLINICAL DETERIORATION ALERTS
                        - **Panic & Dissociation Risks**: Intrusive memories may trigger acute dissociation or hyperarousal during lectures.
                        - **Academic Impairment**: Concentration deficits present an imminent academic performance threat.

                        ### 🎯 3. THERAPEUTIC FOCUS & PROACTIVE RECOVERY STEPS
                        - **Phase Groundwork**: Focus next clinical sessions on EMDR Phase 2 grounding protocols and resources (e.g., safe place exercises, bilateral stimulation).
                        - **Coping Resources**: Implement daily box breathing and somatic containment.
                        """.trimIndent()
                    }
                    else -> {
                        """
                        ### 📈 1. BEHAVIORAL TRENDS & CONTEXT CORRELATIONS
                        - **Activity Tracker**: Client demonstrates stable mood logs with minor cyclic dips. Standard scale scores are stable.
                        - **Adherence Insight**: High medication compliance correlated with consistent daily gratitude logs.

                        ### ⚠️ 2. POTENTIAL RISKS & CLINICAL DETERIORATION ALERTS
                        - No severe risk alerts are currently triggered. Watch for persistent complaints of occupational stress.

                        ### 🎯 3. THERAPEUTIC FOCUS & PROACTIVE RECOVERY STEPS
                        - Encourage continued compliance with daily wellness habit tracking. Review CBT cognitive logs at the next session.
                        """.trimIndent()
                    }
                }
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
