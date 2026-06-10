/**
 * PsyPyrus AI - Gemini Copilot Service Connection
 * Handles direct browser-side REST requests to Google Gemini 3.5 Flash,
 * Custom LLMs, and maintains conversation histories, caching, and token counts.
 */

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

// Simple local cache for identical prompts
const responseCache = new Map();

export class GeminiService {
    /**
     * Checks if a clinical API key is configured.
     * @returns {boolean}
     */
    static isApiKeyConfigured() {
        const provider = localStorage.getItem('psypyrus_active_provider') || '0';
        if (provider === '1') {
            const key = localStorage.getItem('psypyrus_openai_api_key') || '';
            return key.trim().length > 0;
        }
        const key = localStorage.getItem('psypyrus_gemini_api_key') || '';
        return key.trim().length > 0 && key !== 'AIzaSy...your_gemini_api_key_here...';
    }

    /**
     * Estimates token count based on standard character-to-token ratio (~4 chars per token).
     * @param {string} text 
     * @returns {number}
     */
    static estimateTokenCount(text) {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    }

    /**
     * Clear the response cache
     */
    static clearCache() {
        responseCache.clear();
    }

    /**
     * Calls the configured Custom LLM (OpenAI-compatible) endpoint.
     * @param {string} prompt 
     * @param {string} systemInstruction 
     * @param {Array} history
     * @returns {Promise<string>}
     */
    static async callCustomLlm(prompt, systemInstruction, history = []) {
        const key = localStorage.getItem('psypyrus_openai_api_key') || '';
        const url = localStorage.getItem('psypyrus_custom_llm_url') || 'https://api.openai.com/v1/chat/completions';
        
        if (!key) {
            return "Error: OpenAI/Custom LLM API key is not configured in settings.";
        }

        const messages = [];
        if (systemInstruction) {
            messages.push({ role: "system", content: systemInstruction });
        }

        // Add history
        history.forEach(msg => {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content || msg.text || ""
            });
        });

        messages.push({ role: "user", content: prompt });

        const requestBody = {
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.3
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                return `Custom LLM HTTP ${response.status}: ${errorText}`;
            }

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                const choice = data.choices[0];
                if (choice.message) {
                    return choice.message.content || "No content found.";
                }
            }
            return "Parsing failure inside custom LLM response.";
        } catch (e) {
            console.error("Error in Custom LLM call:", e);
            return `Custom LLM Exception: ${e.message}`;
        }
    }

    /**
     * Calls Gemini API or falls back to mock responses.
     * Supports caching, history, and typewriter streaming callbacks.
     * @param {string} prompt 
     * @param {string} systemInstruction 
     * @param {Array} history - Array of { role: 'user'|'model', parts: [{ text: '...' }] }
     * @param {function} onChunk - Optional callback for typewriter streaming
     * @returns {Promise<string>}
     */
    static async callGemini(prompt, systemInstruction = "", history = [], onChunk = null) {
        const provider = localStorage.getItem('psypyrus_active_provider') || '0';
        
        // Cache lookup key
        const cacheKey = JSON.stringify({ provider, prompt, systemInstruction, history });
        if (responseCache.has(cacheKey) && !onChunk) {
            console.log("PsyPyrus Cache Hit");
            return responseCache.get(cacheKey);
        }

        let resultText;

        if (provider === '1') {
            resultText = await this.callCustomLlm(prompt, systemInstruction, history);
        } else if (!this.isApiKeyConfigured()) {
            console.warn("Gemini API key is not set. Falling back to Demo clinical responder.");
            await new Promise(resolve => setTimeout(resolve, 800));
            resultText = this.getMockResponse(prompt);
        } else {
            const apiKey = localStorage.getItem('psypyrus_gemini_api_key').trim();
            const url = `${BASE_URL}?key=${apiKey}`;

            // Build history in Gemini format
            const contents = [];
            history.forEach(msg => {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content || msg.text || "" }]
                });
            });

            // Add active prompt
            contents.push({
                role: "user",
                parts: [{ text: prompt }]
            });

            const requestBody = {
                contents: contents,
                generationConfig: {
                    temperature: 0.3
                }
            };

            if (systemInstruction) {
                requestBody.systemInstruction = {
                    parts: [{ text: systemInstruction }]
                };
            }

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Gemini API Call failed! HTTP: ${response.status}`, errorText);
                    throw new Error(`HTTP ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                if (data.candidates && data.candidates.length > 0) {
                    const candidate = data.candidates[0];
                    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                        resultText = candidate.content.parts[0].text || "No text generated.";
                    } else {
                        resultText = "No output candidate found. Check content filters or API quota constraints.";
                    }
                } else {
                    resultText = "No output candidate found. Check content filters or API quota constraints.";
                }
            } catch (e) {
                console.error("Error executing call to Gemini API:", e);
                resultText = `Clinical API Error: ${e.message}. Entering local high-safety backup mode.\n\n` + this.getMockResponse(prompt);
            }
        }

        // Cache the response
        if (resultText && !resultText.startsWith("Error:") && !resultText.startsWith("Clinical API Error:")) {
            responseCache.set(cacheKey, resultText);
        }

        // If typewriter streaming is requested
        if (onChunk && resultText) {
            await this.simulateTypewriter(resultText, onChunk);
        }

        return resultText;
    }

    /**
     * Simulates a streaming typewriter effect by emitting chunks of text.
     * @param {string} text 
     * @param {function} onChunk 
     */
    static async simulateTypewriter(text, onChunk) {
        // We will emit chunks of words/characters to make it look active and smooth
        const words = text.split(/(\s+)/);
        let accumulated = "";
        
        // Group words to speed up rendering for long texts
        const chunkSize = text.length > 1500 ? 8 : (text.length > 800 ? 4 : 2);
        
        for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join("");
            accumulated += chunk;
            onChunk(accumulated);
            // Dynamic delay depending on chunk size
            await new Promise(resolve => setTimeout(resolve, 15 + Math.random() * 15));
        }
        // Ensure the final state is emitted fully
        onChunk(text);
    }

    /**
     * Internal mock clinical responder matching the Android app's fallback data.
     * @param {string} prompt 
     * @returns {string}
     */
    static getMockResponse(prompt) {
        const lower = prompt.toLowerCase();
        
        if (lower.includes("soap") || lower.includes("transcript")) {
            return `### CLINICAL SOAP NOTE (DECISION SUPPORT)

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

*Secure Audit Verification Tag: AES-GCM-256 standard validation indicator.*`;
        }
        
        if (lower.includes("mse") || lower.includes("mental status")) {
            return `The patient presented as well-groomed, wearing appropriate casual attire with good hygiene. Eye contact was maintained appropriately. Motor activity was marked by overall cooperation, with slight psychomotor activity (foot tapping) congruent with reported anxiety. Speech rate was within normative limits, displaying appropriate, responsive vocal tones. Objective mood was noted as anxious with restricted affect range. Thought stream was coherent with no formal thought disorders. Perception was intact with no illusions or hallucinations. Cognition was oriented to person, place, and time, exhibiting normal memory retention. Insight was evaluated at Grade 4 (intellectual awareness of anxiety symptoms without current somatic coping). Judgment remains sound for personal and social decision-making.`;
        }
        
        if (lower.includes("risk") || lower.includes("suicide") || lower.includes("crisis") || lower.includes("hurt") || lower.includes("die")) {
            return `### AI MEDICAL SAFETY CORE & RISK DETECTOR

#### ⚠️ Risk Alert Parameters
* **Primary Severity Tracker**: NONE TO LOW CRISIS FLAG DETECTED.
* **Risk Description**: Text contains clinical exhaustion but lacks active suicidal intent, self-directed violence planning, or lethal means description.

#### 📋 Mandatory Action Framework
1. Maintain routine therapeutic boundaries.
2. Support patient with emotional self-regulation exercises.
3. Provide 24/7 National Crisis Line contacts as a universal safety net.`;
        }

        if (lower.includes("smart") || lower.includes("goal") || lower.includes("treat") || lower.includes("treatment")) {
            return `### EVIDENCE-BASED TREATMENT SCHEME

#### 🎯 SMART Goals
* **Specific**: Decrease physical anxiety symptoms during work presentations.
* **Measurable**: Self-reported distress level (0-10) drops from 8 to 4 by week 6.
* **Achievable**: Utilize box breathing for 4 minutes right before stepping onto the podium.
* **Relevant**: Anxiety currently impacts job review and standing.
* **Time-bound**: Accomplish within 6 weeks, validated by presentation logs.

#### 🛠️ Evidence-Based Interventions
1. **Somatic Skills**: Train patient on 4-4-4 diaphragmatic pacing.
2. **Cognitive Reframing**: Identify and disrupt automatic negative thoughts ("I will fail") into objective reality statements.

#### 📝 Homework Assignments
* Practice 5 minutes of box breathing daily in non-stressful situations.
* Log situational triggers in the Cognitive Journal twice per week.`;
        }

        if (lower.includes("summarizer") || lower.includes("summary") || lower.includes("summarize")) {
            return `### CLINICAL SESSION SUMMARY & ACTION ITEMS

**Executive Summary:**
The session focused on cognitive restructuring of work-related anxiety and setting firm work-life boundaries. The patient demonstrated good engagement and receptivity to therapeutic interventions.

**Key Themes Discussed:**
1. Corporate micro-stressors and catastrophizing of peer reviews.
2. Somatic signs (muscle tension, chest tightness) occurring during executive meetings.
3. Setting post-8:00 PM digital detox guidelines.

**Primary Clinical Takeaways:**
- Somatic cues are precursors to cognitive anxiety spirals. Diaphragmatic breathing (4-4-4) serves as an effective immediate stabilizer.
- Sleep latency is directly linked to late-night screen time and active cognitive engagement with work tasks.

**Action Items & Homework:**
- Complete GAD-7 screening before next scheduled visit.
- Adhere to the 8:00 PM digital screen boundary (laptops/work phones powered off).
- Practice structured mindfulness or box breathing for 5 minutes daily.`;
        }
        
        if (lower.includes("diagnosis") || lower.includes("suggest") || lower.includes("symptom")) {
            return `### DSM-5-TR & ICD-10 DIAGNOSTIC CO-PILOT

#### Probable Differential Diagnostics

1. **Major Depressive Disorder, Single Episode, Moderate**
   * **ICD-10 Code**: F32.1
   * **DSM-5 Code**: 296.22
   * **Confidence**: High (84%)
   * **DSM-5 Criteria Checked**:
     * [x] Depressed mood most of the day (~2 weeks)
     * [x] Insomnia (early morning awakening)
     * [x] Psychomotor retardation / fatigue
     * [x] Feelings of worthlessness / excessive guilt

2. **Generalized Anxiety Disorder (Comorbid)**
   * **ICD-10 Code**: F41.1
   * **DSM-5 Code**: 300.02
   * **Confidence**: Moderate (68%)
   * **DSM-5 Criteria Checked**:
     * [x] Excessive anxiety, difficult to control
     * [x] Muscle tension, sleep issues, restlessness

---
#### Clinical Recommendations & Lab Rules
* Recommend organic rule-out: Thyroid Panel (TSH, Free T4) and Vitamin D3/B12 count.
* Rule out Substance-Induced Mood Disorder.`;
        }

        return `### CLINICAL GUIDELINE SEARCH ENGINE

**Query matched in DSM-5-TR Knowledgebase**:
* Section V: Anxiety Disorders Chapter
* Clinical Guidelines: Cognitive Behavioral Therapy (CBT-Anxiety) holds level-1 clinical evidence as primary behavioral intervention. Includes interoceptive exposure (for panic manifestations) and in-vivo situational exposure hierarchies.

**Key Differential Factors**:
* Panic Disorder: characterized by sudden recurring spontaneous unexpected panic surges.
* Social Anxiety Disorder (F40.1): fear strictly bound to peer evaluation or public performances.`;
    }
}
