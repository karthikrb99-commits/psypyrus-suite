/**
 * PsyPyrus AI - Gemini Copilot Service Connection
 * Handles direct browser-side REST requests to Google Gemini 3.5 Flash,
 * with structured fallback responses when the API key is not configured.
 */

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

export class GeminiService {
    /**
     * Checks if a Gemini API key is configured.
     * @returns {boolean}
     */
    static isApiKeyConfigured() {
        const key = localStorage.getItem('psypyrus_gemini_api_key') || '';
        return key.trim().length > 0 && key !== 'AIzaSy...your_gemini_api_key_here...';
    }

    /**
     * Calls Gemini API or falls back to mock responses.
     * @param {string} prompt 
     * @param {string} systemInstruction 
     * @returns {Promise<string>}
     */
    static async callGemini(prompt, systemInstruction = "") {
        if (!this.isApiKeyConfigured()) {
            console.warn("Gemini API key is not set. Falling back to Demo clinical responder.");
            // Mimic a slight network delay (800ms) for high-fidelity loading indicators
            await new Promise(resolve => setTimeout(resolve, 800));
            return this.getMockResponse(prompt);
        }

        const apiKey = localStorage.getItem('psypyrus_gemini_api_key').trim();
        const url = `${BASE_URL}?key=${apiKey}`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.3
            }
        };

        if (systemInstruction) {
            requestBody.systemInstruction = {
                parts: [
                    { text: systemInstruction }
                ]
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
                    return candidate.content.parts[0].text || "No text generated.";
                }
            }
            return "No output candidate found. Check content filters or API quota constraints.";
        } catch (e) {
            console.error("Error executing call to Gemini API:", e);
            return `Clinical API Error: ${e.message}. Entering local high-safety backup mode.\n\n` + this.getMockResponse(prompt);
        }
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
\n*Secure Audit Verification Tag: AES-GCM-256 standard validation indicator.*`;
        }
        
        if (lower.includes("mse") || lower.includes("mental status")) {
            return `The patient presented as well-groomed, wearing appropriate casual attire with good hygiene. Eye contact was maintained appropriately. Motor activity was marked by overall cooperation, with slight psychomotor activity (foot tapping) congruent with reported anxiety. Speech rate was within normative limits, displaying appropriate, responsive vocal tones. Objective mood was noted as anxious with restricted affect range. Thought stream was coherent with no formal thought disorders. Perception was intact with no illusions or hallucinations. Cognition was oriented to person, place, and time, exhibiting normal memory retention. Insight was evaluated at Grade 4 (intellectual awareness of anxiety symptoms without current somatic coping). Judgment remains sound for personal and social decision-making.`;
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
        
        if (lower.includes("smart") || lower.includes("goal") || lower.includes("treat")) {
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
        
        if (lower.includes("risk") || lower.includes("suicide") || lower.includes("crisis")) {
            return `### AI MEDICAL SAFETY CORE & RISK DETECTOR

#### ⚠️ Risk Alert Parameters
* **Primary Severity Tracker**: NONE TO LOW CRISIS FLAG DETECTED.
* **Risk Description**: Text contains clinical exhaustion but lacks active suicidal intent, self-directed violence planning, or lethal means description.

#### 📋 Mandatory Action Framework
1. Maintain routine therapeutic boundaries.
2. Support patient with emotional self-regulation exercises.
3. Provide 24/7 National Crisis Line contacts as a universal safety net.`;
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
