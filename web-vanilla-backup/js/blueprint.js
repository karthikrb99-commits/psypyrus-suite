/**
 * PsyPyrus AI - Blueprint and Sandbox Client Controller
 * Manages tab switching, business strategy accordions, somatic breath pacing,
 * case history compilation, and rule-based diagnostic sandbox evaluations.
 */

// Tab system
function initTabs() {
    const triggers = document.querySelectorAll('.tab-trigger');
    const panes = document.querySelectorAll('.tab-pane');

    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const targetTab = trigger.getAttribute('data-tab');
            
            triggers.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));

            trigger.classList.add('active');
            const targetPane = document.getElementById(`tab-${targetTab}`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });

    // Strategy sub-tabs (SWOT / PESTEL / Forces)
    const subTriggers = document.querySelectorAll('.sub-tab-btn');
    const subPanes = document.querySelectorAll('.sub-tab-pane');

    subTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const targetTab = trigger.getAttribute('data-subtab');

            subTriggers.forEach(t => t.classList.remove('active'));
            subPanes.forEach(p => p.classList.remove('active'));

            trigger.classList.add('active');
            const targetPane = document.getElementById(`subtab-${targetTab}`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

// Accordion logic
function initAccordions() {
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isOpen = item.classList.contains('open');
            
            // Close other items
            const siblingItems = item.parentElement.querySelectorAll('.accordion-item');
            siblingItems.forEach(sib => sib.classList.remove('open'));

            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });
}

// Somatic Breath Restructuring (Box Breathing 4s-4s-4s-4s)
let breathingInterval = null;
function initBreathPacer() {
    const circle = document.getElementById('breath-circle');
    const label = document.getElementById('breath-label');
    const btn = document.getElementById('breath-pacer-toggle');
    if (!circle || !label || !btn) return;

    let breathState = 0; // 0: INHALE, 1: HOLD, 2: EXHALE, 3: HOLD
    const states = [
        { text: 'INHALE', className: 'inhale' },
        { text: 'HOLD', className: 'hold' },
        { text: 'EXHALE', className: 'exhale' },
        { text: 'HOLD', className: 'hold' }
    ];

    function runCycle() {
        // Remove old classes
        circle.classList.remove('inhale', 'hold', 'exhale');
        
        const current = states[breathState];
        label.innerText = current.text;
        if (current.className !== 'hold') {
            circle.classList.add(current.className);
        } else {
            // Apply hold state which sustains current scale
            if (breathState === 1) {
                circle.classList.add('inhale'); // Keep expanded
            } else {
                circle.classList.add('exhale'); // Keep collapsed
            }
            circle.classList.add('hold');
        }

        breathState = (breathState + 1) % 4;
    }

    btn.addEventListener('click', () => {
        if (breathingInterval) {
            clearInterval(breathingInterval);
            breathingInterval = null;
            circle.classList.remove('inhale', 'hold', 'exhale');
            label.innerText = 'BREATHE';
            btn.innerText = 'Start Somatic Restructuring';
        } else {
            breathState = 0;
            runCycle();
            breathingInterval = setInterval(runCycle, 4000);
            btn.innerText = 'Stop Pacer';
        }
    });
}

// Case History and MSE Compiler Sandbox
function initCaseSandbox() {
    const formInputs = [
        'ch-name', 'ch-age', 'ch-sex', 'ch-education', 'ch-occupation',
        'ch-status', 'ch-onset', 'ch-course', 'ch-progress', 'ch-complaint',
        'mse-appearance', 'mse-motor', 'mse-speech', 'mse-mood', 'mse-insight', 'mse-judgment'
    ];

    function compileCase() {
        const data = {};
        formInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                data[id.replace('ch-', '').replace('mse-', '')] = el.value;
            }
        });

        // Generate Prose narrative
        const prose = `CLINICAL BRIEF: ASSESSMENT RECORD
Subject: ${data.name || 'Anonymous Patient'}, Age ${data.age || 'N/A'}, identified as ${data.sex || 'unspecified'}. Education level is ${data.education || 'unspecified'} and occupational status is ${data.occupation || 'unspecified'} (${data.status || 'Single'}).
Chief Complaint: The patient reports: "${data.complaint || 'No complaints stated'}" presenting an ${data.onset || 'insidious'} onset, exhibiting a ${data.course || 'continuous'} course, and the progress of the illness is currently evaluated as ${data.progress || 'static'}.

MENTAL STATUS EXAMINATION:
- General Appearance & Presentation: Evaluated as ${data.appearance || 'well-groomed'}.
- Motor Behavior & Activity: Presenting as ${data.motor || 'normal motor activity'}.
- Speech Characteristics: Manifesting ${data.speech || 'normative rate and volume'}.
- Mood and Affect Quality: The therapist notes a ${data.mood || 'euthymic'} presentation.
- Insight and Judgment Grade: Insight is scored at ${data.insight || 'Grade 4 (Intellectual insight)'}. Social and test judgment functions are deemed ${data.judgment || 'appropriate'}.`;

        const proseEl = document.getElementById('case-prose-output');
        const jsonEl = document.getElementById('case-json-output');

        if (proseEl) proseEl.innerText = prose;
        if (jsonEl) jsonEl.innerText = JSON.stringify({ metadata: { source: "PsyPyrus AI Case Sandbox", timestamp: new Date().toISOString() }, case_record: data }, null, 2);
    }

    formInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', compileCase);
        }
    });

    compileCase(); // Initial compile
}

// Diagnostic Rule-Based Sandbox
const MOCK_CRITERIA_BLUEPRINT = {
    "Phantom Disorder": {
        basic: ["Above 18", "1 year", "Not attributable to Physiological conditions"],
        symptoms: {
            "PDs1": ["PDss1", "PDss2", "PDss3"],
            "PDs2": ["PDss4", "PDss5", "PDss6"],
            "CD1": ["CDss1", "CDss2"]
        },
        code: "DSM-5-MOCK: PHD-01"
    },
    "Hypothetical Disorder": {
        basic: ["Above 21", "6 months", "Not better explained by other Physiological conditions"],
        symptoms: {
            "HDs1": ["HDss1", "HDss2", "HDss3"],
            "HDs2": ["HDss4", "HDss5", "HDss6"],
            "CD1": ["CDss1", "CDss2"]
        },
        code: "DSM-5-MOCK: HYP-02"
    }
};

function runDiagnosticEvaluator() {
    const outputDiv = document.getElementById('diagnostic-results-sandbox');
    if (!outputDiv) return;

    // Determine Mode
    const isMockMode = document.getElementById('diag-mode-mock').checked;
    
    let html = '';

    if (isMockMode) {
        // Collect Mock inputs
        const basicCriteria = [];
        if (document.getElementById('basic-above18').checked) basicCriteria.push("Above 18");
        if (document.getElementById('basic-above21').checked) basicCriteria.push("Above 21");
        if (document.getElementById('basic-1year').checked) basicCriteria.push("1 year");
        if (document.getElementById('basic-6months').checked) basicCriteria.push("6 months");
        if (document.getElementById('basic-excl-phantom').checked) basicCriteria.push("Not attributable to Physiological conditions");
        if (document.getElementById('basic-excl-hypo').checked) basicCriteria.push("Not better explained by other Physiological conditions");

        const specificSymptoms = [];
        const mockSymptomIds = [
            'PDss1', 'PDss2', 'PDss3', 'PDss4', 'PDss5', 'PDss6', 
            'CDss1', 'CDss2', 
            'HDss1', 'HDss2', 'HDss3', 'HDss4', 'HDss5', 'HDss6'
        ];
        mockSymptomIds.forEach(sym => {
            const cb = document.getElementById(`mock-${sym}`);
            if (cb && cb.checked) {
                specificSymptoms.push(sym);
            }
        });

        // Run Mock rules
        const results = [];
        for (const [disorder, criteria] of Object.entries(MOCK_CRITERIA_BLUEPRINT)) {
            const hasExclusion = basicCriteria.includes(criteria.basic[2]);
            const hasAgeOrDuration = basicCriteria.includes(criteria.basic[0]) || basicCriteria.includes(criteria.basic[1]);

            if (hasExclusion && hasAgeOrDuration) {
                let matchedSymptomsCount = 0;
                let totalSymptomsCount = 0;
                for (const syms of Object.values(criteria.symptoms)) {
                    syms.forEach(s => {
                        totalSymptomsCount++;
                        if (specificSymptoms.includes(s)) {
                            matchedSymptomsCount++;
                        }
                    });
                }

                if (matchedSymptomsCount >= 3) {
                    const ratio = matchedSymptomsCount / totalSymptomsCount;
                    let confidence = 'Low';
                    if (ratio >= 0.6) confidence = 'High';
                    else if (ratio >= 0.4) confidence = 'Moderate';

                    results.push({
                        disorder,
                        code: criteria.code,
                        confidence,
                        explanation: `Met exception criterion & duration/age checks. Matched ${matchedSymptomsCount} symptoms of ${totalSymptomsCount} specific conditions (Ratio: ${Math.round(ratio*100)}%).`
                    });
                }
            }
        }

        if (results.length > 0) {
            html += `<div class="outcome-banner positive"><i class="fa-solid fa-circle-check"></i> Diagnostic match found!</div>`;
            results.forEach(res => {
                html += `
                    <div class="diag-result-card">
                        <div class="diag-result-header">
                            <span class="diag-result-title">${res.disorder}</span>
                            <span class="diag-result-confidence ${res.confidence.toLowerCase()}">${res.confidence} Confidence</span>
                        </div>
                        <div class="diag-result-details">${res.explanation}</div>
                        <div class="diag-result-code">${res.code}</div>
                    </div>
                `;
            });
        } else {
            html += `
                <div class="outcome-banner none"><i class="fa-solid fa-triangle-exclamation"></i> No diagnostic matches found</div>
                <p style="font-size: 0.85rem; color: var(--color-text-secondary); padding: 0 10px;">
                    Ensure exception criteria (e.g. "Not attributable...") is checked, together with appropriate age/duration, and at least 3 matching specific symptoms for the target disorder.
                </p>
            `;
        }

    } else {
        // Collect DSM-5 inputs
        const durationWeeks = parseInt(document.getElementById('diag-duration-weeks').value) || 0;
        
        const exclusions = [];
        if (document.getElementById('excl-substance').checked) exclusions.push("No physiological substance attribution");
        if (document.getElementById('excl-medical').checked) exclusions.push("No medical condition attribution");
        if (document.getElementById('excl-mania').checked) exclusions.push("No manic/hypomanic history");

        const mddSymptoms = [];
        const mddIds = ['mdd-mood', 'mdd-anhedonia', 'mdd-weight', 'mdd-sleep', 'mdd-motor', 'mdd-fatigue', 'mdd-worthless', 'mdd-concentration', 'mdd-suicidal'];
        mddIds.forEach(id => {
            const cb = document.getElementById(id);
            if (cb && cb.checked) {
                mddSymptoms.push(id.replace('mdd-', ''));
            }
        });

        const gadSymptoms = [];
        const gadIds = ['gad-anxiety', 'gad-restless', 'gad-fatigue', 'gad-concentration', 'gad-irritable', 'gad-tension', 'gad-sleep'];
        gadIds.forEach(id => {
            const cb = document.getElementById(id);
            if (cb && cb.checked) {
                gadSymptoms.push(id.replace('gad-',''));
            }
        });

        const results = [];

        // 1. Evaluate MDD
        const hasCoreMdd = mddSymptoms.includes('mood') || mddSymptoms.includes('anhedonia');
        const hasEnoughMdd = mddSymptoms.length >= 5;
        const durationOkMdd = durationWeeks >= 2;
        const noSubstance = exclusions.includes("No physiological substance attribution");
        const noMedical = exclusions.includes("No medical condition attribution");
        const noManic = exclusions.includes("No manic/hypomanic history");

        if (hasCoreMdd && hasEnoughMdd && durationOkMdd && noSubstance && noMedical) {
            results.push({
                disorder: 'Major Depressive Disorder (MDD)',
                code: 'DSM-5 296.2x / ICD-10 F32.x',
                confidence: noManic ? 'High' : 'Moderate (Verify Mania/Hypomania)',
                explanation: `Met duration (>=2 weeks) and ${mddSymptoms.length} symptoms including core depressed mood / anhedonia indicators.`
            });
        }

        // 2. Evaluate GAD
        const hasCoreGad = gadSymptoms.includes('anxiety');
        const anxietyIndicators = new Set(['restless', 'fatigue', 'concentration', 'irritable', 'tension', 'sleep']);
        const matchedGadCount = gadSymptoms.filter(s => anxietyIndicators.has(s)).length;
        const durationOkGad = durationWeeks >= 26; // 6 months

        if (hasCoreGad && matchedGadCount >= 3 && durationOkGad && noSubstance && noMedical) {
            results.push({
                disorder: 'Generalized Anxiety Disorder (GAD)',
                code: 'DSM-5 300.02 / ICD-10 F41.1',
                confidence: 'High',
                explanation: `Met 6-month duration criteria with core anxiety and ${matchedGadCount} somatic/cognitive indicators.`
            });
        }

        if (results.length > 0) {
            html += `<div class="outcome-banner positive"><i class="fa-solid fa-circle-check"></i> Diagnostic match found!</div>`;
            results.forEach(res => {
                html += `
                    <div class="diag-result-card">
                        <div class="diag-result-header">
                            <span class="diag-result-title">${res.disorder}</span>
                            <span class="diag-result-confidence high">${res.confidence}</span>
                        </div>
                        <div class="diag-result-details">${res.explanation}</div>
                        <div class="diag-result-code">${res.code}</div>
                    </div>
                `;
            });
        } else {
            html += `
                <div class="outcome-banner none"><i class="fa-solid fa-triangle-exclamation"></i> No diagnostic matches found</div>
                <p style="font-size: 0.85rem; color: var(--color-text-secondary); padding: 0 10px;">
                    MDD criteria requires at least 2 weeks duration, 5+ symptoms (including depressed mood or anhedonia), and no substance/medical exclusions.
                    <br><br>
                    GAD criteria requires at least 26 weeks duration, core anxiety symptoms plus 3 somatic symptoms, and exclusions cleared.
                </p>
            `;
        }
    }

    outputDiv.innerHTML = html;
}

function initDiagnosticSandbox() {
    // Mode switcher triggers layout updates
    const modeDsm = document.getElementById('diag-mode-dsm');
    const modeMock = document.getElementById('diag-mode-mock');
    const dsmSection = document.getElementById('dsm-sandbox-inputs');
    const mockSection = document.getElementById('mock-sandbox-inputs');

    if (!modeDsm || !modeMock || !dsmSection || !mockSection) return;

    function toggleSections() {
        if (modeMock.checked) {
            dsmSection.style.display = 'none';
            mockSection.style.display = 'block';
        } else {
            dsmSection.style.display = 'block';
            mockSection.style.display = 'none';
        }
        runDiagnosticEvaluator();
    }

    modeDsm.addEventListener('change', toggleSections);
    modeMock.addEventListener('change', toggleSections);

    // Bind event listeners to ALL input fields in the sandbox to update results dynamically
    const inputs = document.querySelectorAll('#tab-diagnostics input, #tab-diagnostics select');
    inputs.forEach(input => {
        input.addEventListener('change', runDiagnosticEvaluator);
        if (input.type === 'range' || input.type === 'number') {
            input.addEventListener('input', () => {
                // Update display bubble if any
                const bubble = document.getElementById('diag-weeks-bubble');
                if (bubble) {
                    bubble.innerText = `${input.value} weeks`;
                }
                runDiagnosticEvaluator();
            });
        }
    });

    toggleSections(); // Initial draw
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initAccordions();
    initBreathPacer();
    initCaseSandbox();
    initDiagnosticSandbox();
    console.log("PsyPyrus AI Blueprint Engine fully operational.");
});
