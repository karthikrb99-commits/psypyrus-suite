import Foundation

public struct DsmDisorder: Identifiable, Codable {
    public var id: String { name }
    public var name: String
    public var dsmCode: String
    public var icd10Code: String
    public var category: String
    public var briefDescription: String
    public var criteriaSummary: String
    public var criteriaList: [String]
    public var minCriteriaRequired: Int
    public var symptomsKeywords: [String]
    public var differentials: [String]
    public var comorbidities: [String]
    public var interventions: [String]
}

public struct DsmDatabase {
    public static let categories = [
        "All Disorders",
        "Depressive",
        "Anxiety",
        "Trauma-Related",
        "Neurodevelopmental",
        "Bipolar",
        "OCD-Related",
        "Personality",
        "Eating",
        "Stress-Response"
    ]
    
    public static let disorders: [DsmDisorder] = [
        DsmDisorder(
            name: "Major Depressive Disorder (MDD), Single Episode",
            dsmCode: "296.22",
            icd10Code: "F32.9",
            category: "Depressive",
            briefDescription: "Characterized by one or more major depressive episodes without a history of manic, mixed, or hypomanic episodes.",
            criteriaSummary: "At least 5 of 9 persistent symptoms present during the same 2-week period, representing a change from previous functioning. At least one of the symptoms is either (1) depressed mood or (2) loss of interest or pleasure (Anhedonia).",
            criteriaList: [
                "Depressed mood most of the day, nearly every day (indicated by subjective report or observation)",
                "Markedly diminished interest or pleasure in all, or almost all, activities most of the day, nearly every day (Anhedonia)",
                "Significant weight loss when not dieting or weight gain, or decrease/increase in appetite nearly every day",
                "Insomnia or hypersomnia nearly every day",
                "Psychomotor agitation or retardation nearly every day",
                "Fatigue or loss of energy nearly every day",
                "Feelings of worthlessness or excessive, inappropriate guilt nearly every day (not merely self-reproach about being sick)",
                "Diminished ability to think or concentrate, or indecisiveness, nearly every day",
                "Recurrent thoughts of death, recurrent suicidal ideation without a specific plan, or a suicide attempt/plan"
            ],
            minCriteriaRequired: 5,
            symptomsKeywords: ["depressed_mood", "anhedonia", "appetite_change", "insomnia", "psychomotor", "fatigue", "worthlessness", "concentration_difficulty", "suicidal_ideation"],
            differentials: ["Bipolar Disorder (due to potential hypomanic indicators)", "Dementia / Pseudodementia in elder cohorts", "Substance/Medication-Induced Depressive Disorder", "Hypothyroidism / Organic organic triggers", "Grief / Bereavement corresponding to loss"],
            comorbidities: ["Generalized Anxiety Disorder (GAD)", "Panic Disorder", "Substance Use Disorders", "Borderline Personality Disorder (BPD)"],
            interventions: ["Cognitive Behavioral Therapy (CBT)", "Behavioral Activation Protocols", "Interpersonal Psychotherapy (IPT)", "SSRI/SNRI pharmacotherapy support", "Structured Daily Wellness Checklist"]
        ),
        DsmDisorder(
            name: "Generalized Anxiety Disorder (GAD)",
            dsmCode: "300.02",
            icd10Code: "F41.1",
            category: "Anxiety",
            briefDescription: "Excessive anxiety and worry about a variety of topics, events or activities, occurring more days than not for at least 6 months.",
            criteriaSummary: "Excessive worry occurs more days than not for at least 6 months. It is difficult to control. Associated with at least 3 of 6 somatic/cognitive symptoms (1 for children).",
            criteriaList: [
                "Restlessness or feeling keyed up or on edge",
                "Being easily fatigued",
                "Difficulty concentrating or mind going blank",
                "Irritability",
                "Muscle tension (somatic scanning)",
                "Sleep disturbance (difficulty falling or staying asleep, or restless, unsatisfying sleep)"
            ],
            minCriteriaRequired: 3,
            symptomsKeywords: ["excessive_anxiety", "restlessness", "fatigue", "concentration_difficulty", "irritability", "muscle_tension", "sleep_disturbance"],
            differentials: ["Social Anxiety Disorder", "Obsessive-Compulsive Disorder", "Pheochromocytoma / Thyroid storm", "Post-Traumatic Stress Disorder (PTSD)", "Substance-Induced Anxiety"],
            comorbidities: ["Major Depressive Disorder", "Panic Disorder", "Social Phobia", "Alcohol Use/Abuse"],
            interventions: ["Cognitive Restructuring", "Worry Exposure Techniques", "Acceptance and Commitment Therapy (ACT)", "Progressive Muscle Relaxation (PMR)", "Mindfulness Diaphragmatic Training", "SSRI/Buspirone evaluation"]
        ),
        DsmDisorder(
            name: "Post-Traumatic Stress Disorder (PTSD)",
            dsmCode: "309.81",
            icd10Code: "F43.10",
            category: "Trauma-Related",
            briefDescription: "A mental health condition triggered by experiencing or witnessing a terrifying, traumatic event.",
            criteriaSummary: "Exposure to trauma followed by intrusive symptoms (1+), avoidance behaviors (1+), negative alterations in cognitions/mood (2+), and marked alterations in arousal/reactivity (2+) lasting >1 month.",
            criteriaList: [
                "Involuntary, intrusive, distressing memories, flashbacks, or vivid nightmares of the traumatic event(s)",
                "Intense psychological or physiological distress upon exposure to internal or external trauma cues",
                "Active avoidance of trauma-related stimuli, thoughts, feelings, places, people, or conversations",
                "Inability to remember key aspects of trauma, persistent distorted blame of self, or detachment/estrangement",
                "Markedly diminished interest in activities, inability to feel positive emotions, or emotional numbness",
                "Hypervigilance, exaggerated startle response, or constant threat scanning behavior",
                "Irritable behavior, angry outbursts, reckless self-destructive patterns, insomnia, or poor concentration"
            ],
            minCriteriaRequired: 4,
            symptomsKeywords: ["trauma_exposure", "intrusive_memories", "avoidance_stimuli", "negative_cognitions", "emotional_numbing", "hypervigilance", "irritability_outbursts"],
            differentials: ["Acute Stress Disorder (< 1 month)", "Adjustment Disorder", "Major Depressive Disorder", "Panic Disorder", "Borderline Personality Disorder"],
            comorbidities: ["Major Depressive Disorder", "Alcohol/Substance Use Disorder", "GAD", "Traumatic Brain Injury (TBI)"],
            interventions: ["Eye Movement Desensitization and Reprocessing (EMDR)", "Prolonged Exposure (PE) Therapy", "Cognitive Processing Therapy (CPT)", "Trauma-Informed Somatic Pacing", "Prazosin support for trauma nightmares"]
        ),
        DsmDisorder(
            name: "Attention-Deficit/Hyperactivity Disorder (ADHD), Combined Presentation",
            dsmCode: "314.01",
            icd10Code: "F90.2",
            category: "Neurodevelopmental",
            briefDescription: "A persistent pattern of inattention and/or hyperactivity-impulsivity that interferes with functioning or development.",
            criteriaSummary: "Requires 6 or more symptoms of inattention AND 6 or more symptoms of hyperactivity-impulsivity for at least 6 months (5 symptoms if age 17+). Several symptoms must be present prior to age 12 and in 2+ environments.",
            criteriaList: [
                "Fails to give close attention to details, makes careless mistakes at school/work/tasks",
                "Difficulty sustaining attention, mind drifting, difficulty listening when spoken to directly",
                "Often does not follow through on instructions, fails to finish duties/projects, loses focus easily",
                "Avoids, dislikes, or is reluctant to engage in tasks requiring sustained mental effort",
                "Loses items necessary for tasks; easily distracted; incredibly forgetful",
                "Fidgets, taps hands/feet, squirms in seat, leaves seat inappropriately, feels constantly on the go",
                "Talks excessively, blurts out answers before questions are finished, interrupts others",
                "Inability to wait turn, intrudes on others conversations/games, feels like driven by a motor"
            ],
            minCriteriaRequired: 6,
            symptomsKeywords: ["inattention", "careless_mistakes", "losing_focus", "avoiding_effort", "forgetfulness", "fidgeting", "impulsivity", "hyperactivity"],
            differentials: ["Specific Learning Disorder", "Autism Spectrum Disorder (ASD)", "Bipolar Disorder (racing thoughts mimic inattention)", "Generalized Anxiety", "Sleep Apnea / Chronic Sleep Deprivation"],
            comorbidities: ["Oppositional Defiant Disorder (ODD)", "Specific Learning Disorders", "Anxiety Disorders", "Depression"],
            interventions: ["ADHD Coaching & Cognitive Compensation", "Executive Function Strategy Training", "Parent-Child Interaction Therapy (PCIT)", "Stimulant / Non-Stimulant medication", "Time-segmentation (Pomodoro method)"]
        ),
        DsmDisorder(
            name: "Bipolar I Disorder, Current Episode Manic",
            dsmCode: "296.42",
            icd10Code: "F31.12",
            category: "Bipolar",
            briefDescription: "Characterized by at least one manic episode. Major depressive and hypomanic episodes are common but not strictly required for diagnosis.",
            criteriaSummary: "A distinct period of abnormally and persistently elevated, expansive, or irritable mood, and abnormally increased goal-directed activity lasting at least 1 week, with 3+ symptoms.",
            criteriaList: [
                "Inflated self-esteem or grandiosity",
                "Decreased need for sleep (e.g., feels rested after only 3 hours)",
                "More talkative than usual or pressure to keep talking",
                "Flight of ideas or subjective experience that thoughts are racing",
                "Distractibility (i.e., attention too easily drawn to unimportant stimuli)",
                "Increase in goal-directed activity (socially, work, school, or sexually) or psychomotor agitation",
                "Excessive involvement in activities that have a high potential for painful consequences (spending sprees, sexual indiscretions)"
            ],
            minCriteriaRequired: 3,
            symptomsKeywords: ["elevated_mood", "decreased_sleep", "racing_thoughts", "grandiosity", "hyperactivity", "reckless_spending", "pressured_speech"],
            differentials: ["Schizophrenia / Schizoaffective Disorder", "Substance-Induced Mania (e.g., psychostimulants)", "Bipolar II Disorder (hypomania lacks severe impairment)", "Major Depressive with mixed features"],
            comorbidities: ["Anxiety Disorders", "Attention-Deficit/Hyperactivity Disorder (ADHD)", "Substance Use Disorders", "Borderline Personality Disorder"],
            interventions: ["Psychoeducation on Mood Charting", "Interpersonal and Social Rhythm Therapy (IPSRT)", "Mood Stabilizers (e.g., Lithium, Valproate) / Antipsychotics", "Family-Focused Therapy (FFT)", "Sleep hygiene locks"]
        ),
        DsmDisorder(
            name: "Panic Disorder",
            dsmCode: "300.01",
            icd10Code: "F41.0",
            category: "Anxiety",
            briefDescription: "Characterized by recurrent unexpected panic attacks and worry about future attacks or their consequences.",
            criteriaSummary: "Recurrent unexpected panic attacks (intense surge of fear peaking within minutes) followed by 1+ month of persistent worry about future attacks, implications, or maladaptive change in behavior.",
            criteriaList: [
                "Heart palpitations, pounding heart, or accelerated heart rate",
                "Sweating, trembling, or shaking",
                "Sensations of shortness of breath, smothering, or choking chest discomfort",
                "Nausea, abdominal distress, feeling dizzy, unsteady, light-headed, or faint",
                "Chills or heat sensations, paresthesias (numbness/tingling), derealization or depersonalization",
                "Fear of losing control, 'going crazy', or fear of dying",
                "Persistent concern or worry about additional panic attacks, or significant maladaptive behavior changes to avoid attacks"
            ],
            minCriteriaRequired: 4,
            symptomsKeywords: ["panic_attacks", "palpitations", "shortness_of_breath", "dizziness", "shaking_sweating", "fear_of_dying", "avoidance_behavior"],
            differentials: ["Cardiopulmonary Conditions (ruled out via EKG/PFT)", "Hyperthyroidism", "Vestibular disorders", "Phobias (specific cues)", "Social Anxiety (fear of public embarrassment)"],
            comorbidities: ["Agoraphobia", "Major Depressive Disorder", "Substance Use / Benzodiazepine rebound"],
            interventions: ["Panic Control Treatment (PCT)", "Interoceptive Exposure (provocation exercises)", "Cognitive Restructuring regarding cardiac catastrophic interpretations", "SSRI / Beta-blockers therapy support"]
        ),
        DsmDisorder(
            name: "Borderline Personality Disorder (BPD)",
            dsmCode: "301.83",
            icd10Code: "F60.3",
            category: "Personality",
            briefDescription: "A pervasive pattern of instability of interpersonal relationships, self-image, affects, and marked impulsivity.",
            criteriaSummary: "Pervasive instability starting in early adulthood, occurring in 5 or more of the core diagnostic contexts.",
            criteriaList: [
                "Frantic efforts to avoid real or imagined abandonment (excluding suicidal/self-mutilating acts)",
                "A pattern of unstable and intense interpersonal relationships characterized by splitting (idealization/devaluation)",
                "Identity disturbance: markedly and persistently unstable self-image or sense of self",
                "Impulsivity in at least two areas that are potentially self-damaging (spending, sex, substance abuse, reckless driving)",
                "Recurrent suicidal behavior, gestures, or threats, or self-mutilating behavior (cutting, burning)",
                "Affective instability due to a marked reactivity of mood (intense episodic dysphoria, irritability, or anxiety)",
                "Chronic feelings of emptiness",
                "Inappropriate, intense anger or difficulty controlling anger",
                "Transient, stress-related paranoid ideation or severe dissociative symptoms"
            ],
            minCriteriaRequired: 5,
            symptomsKeywords: ["abandonment_fear", "relationship_instability", "identity_disturbance", "impulsive_behaviors", "suicidal_gestures", "affective_instability", "chronic_emptiness", "uncontrolled_anger", "transient_paranoia"],
            differentials: ["Bipolar Disorder (rapid cycling vs. BPD brief reactivity)", "Complex PTSD (C-PTSD)", "Histrionic Personality Disorder", "Depressive Disorders"],
            comorbidities: ["Major Depressive Disorder", "Post-Traumatic Stress Disorder (PTSD)", "Substance Use Disorders", "Eating Disorders (Bulimia)"],
            interventions: ["Dialectical Behavior Therapy (DBT - Gold Standard)", "Mentalization-Based Treatment (MBT)", "Schema Therapy", "Emotion Regulation and Distress Tolerance Skills", "Crisis Plan and Safety Contract"]
        ),
        DsmDisorder(
            name: "Obsessive-Compulsive Disorder (OCD)",
            dsmCode: "300.3",
            icd10Code: "F42.2",
            category: "OCD-Related",
            briefDescription: "The presence of obsessions, compulsions, or both, which are time-consuming and cause significant distress.",
            criteriaSummary: "Presence of obsessions (intrusive, distressing thoughts) and/or compulsions (repetitive behaviors performed to mentalize/reduce distress) that consume more than 1 hour per day or cause significant impairment.",
            criteriaList: [
                "Obsessions: Recurrent and persistent thoughts, urges, or images experienced as intrusive and unwanted",
                "Obsessions: Individual attempts to ignore, suppress, or neutralize such thoughts, urges, or images",
                "Compulsions: Repetitive behaviors or mental acts that the individual feels driven to perform in response to an obsession",
                "Compulsions: Behaviors/acts are aimed at preventing or reducing anxiety/distress, or preventing a dreaded event"
            ],
            minCriteriaRequired: 1,
            symptomsKeywords: ["intrusive_thoughts", "suppress_thoughts", "compulsive_behaviors", "neutralizing_actions"],
            differentials: ["GAD (worry about real-life concerns vs. OCD magical thinking)", "Depressive ruminations", "Tic disorders", "Autism Spectrum Disorder (repetitive behaviors)"],
            comorbidities: ["Anxiety Disorders", "Depression (MDD)", "Tourette Syndrom / Tic Disorders", "Body Dysmorphic Disorder"],
            interventions: ["Exposure and Response Prevention (ERP)", "Acceptance and Commitment Therapy (ACT)", "Cognitive Behavioral Therapy (CBT)", "High-dose SSRI/Clomipramine pharmacotherapy"]
        ),
        DsmDisorder(
            name: "Anorexia Nervosa",
            dsmCode: "307.1",
            icd10Code: "F50.01",
            category: "Eating",
            briefDescription: "An eating disorder characterized by calorie restriction, fear of weight gain, and body image distortion.",
            criteriaSummary: "Restriction of energy intake leading to significantly low body weight. Intense fear of gaining weight or behavior that interferes with weight gain. Distorted body image.",
            criteriaList: [
                "Restriction of energy intake relative to requirements, leading to a significantly low body weight",
                "Intense fear of gaining weight or of becoming fat, or persistent behavior that interferes with weight gain",
                "Disturbance in the way in which one's body weight or shape is experienced"
            ],
            minCriteriaRequired: 3,
            symptomsKeywords: ["restricted_intake", "fear_weight_gain", "distorted_body_image"],
            differentials: ["Avoidant/Restrictive Food Intake Disorder (ARFID - lacks body image concern)", "Major Depressive Disorder (decreased appetite)", "Inflammatory Bowel Disease / Celiac", "Hyperthyroidism"],
            comorbidities: ["Depression", "Anxiety", "Obsessive-Compulsive Disorder", "Self-harm/BPD traits"],
            interventions: ["Family-Based Treatment (FBT / Maudsley Model)", "Cognitive Behavioral Therapy for Eating Disorders (CBT-E)", "Nutritional Rehabilitation Support", "Multidisciplinary Medical Monitoring"]
        ),
        DsmDisorder(
            name: "Social Anxiety Disorder (SAD)",
            dsmCode: "300.23",
            icd10Code: "F40.10",
            category: "Anxiety",
            briefDescription: "Marked fear or anxiety about one or more social situations in which the individual is exposed to possible scrutiny by others.",
            criteriaSummary: "Fear or anxiety is out of proportion to the actual threat. The social situations are avoided or endured with intense fear. Lasts >= 6 months.",
            criteriaList: [
                "Marked fear or anxiety about one or more social situations in which the individual is exposed to possible scrutiny by others",
                "Fear that he or she will act in a way or show anxiety symptoms that will be negatively evaluated",
                "The social situations almost always provoke fear or anxiety",
                "The social situations are actively avoided or endured with intense fear or anxiety",
                "The fear, anxiety, or avoidance is persistent, typically lasting for 6 months or more"
            ],
            minCriteriaRequired: 4,
            symptomsKeywords: ["social_fear", "negative_evaluation", "provokes_fear", "social_avoidance", "social_duration"],
            differentials: ["Agoraphobia", "Panic Disorder", "Generalized Anxiety Disorder", "Schizoid Personality Disorder"],
            comorbidities: ["MDD", "Substance Use (Alcohol self-medication)", "GAD", "Avoidant Personality Disorder"],
            interventions: ["Cognitive Behavioral Therapy (CBT)", "Social Skills Training", "Exposure Therapy (Roleplaying)", "SSRI/Beta-blockers for performance anxiety"]
        ),
        DsmDisorder(
            name: "Specific Phobia",
            dsmCode: "300.29",
            icd10Code: "F40.2",
            category: "Anxiety",
            briefDescription: "Marked fear or anxiety about a specific object or situation (e.g., flying, heights, animals, receiving an injection, seeing blood).",
            criteriaSummary: "The phobic object or situation almost always provokes immediate fear or anxiety, and is actively avoided. Lasts >= 6 months.",
            criteriaList: [
                "Marked fear or anxiety about a specific object or situation (e.g., flying, heights, animals, blood)",
                "The phobic object or situation almost always provokes immediate fear or anxiety",
                "The phobic object or situation is actively avoided or endured with intense fear or anxiety",
                "The fear or anxiety is out of proportion to the actual danger posed by the specific object",
                "The fear, anxiety, or avoidance is persistent, typically lasting for 6 months or more"
            ],
            minCriteriaRequired: 4,
            symptomsKeywords: ["specific_fear", "immediate_provocation", "phobic_avoidance", "out_of_proportion", "phobia_duration"],
            differentials: ["Agoraphobia", "Social Anxiety Disorder", "PTSD (trauma cues trigger phobic reactions)"],
            comorbidities: ["Other Specific Phobias", "Anxiety Disorders", "Depressive Disorders"],
            interventions: ["Systematic Desensitization", "In-Vivo Exposure Therapy", "Cognitive Restructuring", "Virtual Reality Exposure Therapy (VRET)"]
        ),
        DsmDisorder(
            name: "Adjustment Disorder",
            dsmCode: "309.9",
            icd10Code: "F43.2",
            category: "Stress-Response",
            briefDescription: "The development of emotional or behavioral symptoms in response to an identifiable stressor occurring within 3 months of the onset of the stressor.",
            criteriaSummary: "Marked distress that is out of proportion to the severity or intensity of the stressor, and significant impairment in functioning, resolving within 6 months of stressor termination.",
            criteriaList: [
                "Development of emotional or behavioral symptoms in response to an identifiable stressor occurring within 3 months of stressor onset",
                "Marked distress that is out of proportion to the severity of the stressor, taking into account context",
                "Significant impairment in social, occupational, or other important areas of functioning",
                "Symptoms do not represent normal bereavement or another mental disorder",
                "Once the stressor or its consequences have terminated, the symptoms do not persist for more than an additional 6 months"
            ],
            minCriteriaRequired: 3,
            symptomsKeywords: ["stressor_onset", "outsized_distress", "functional_impairment", "stressor_duration"],
            differentials: ["MDD", "PTSD", "Acute Stress Disorder", "Normal Bereavement"],
            comorbidities: ["Somatic Symptom Disorders", "Substance Use Disorders", "Anxiety Disorders"],
            interventions: ["Brief Psychodynamic Therapy", "Crisis Intervention", "Stress Management & Coping Strategies", "Cognitive Behavioral Therapy (CBT)", "Support Groups"]
        ),
        DsmDisorder(
            name: "Acute Stress Disorder",
            dsmCode: "308.3",
            icd10Code: "F43.0",
            category: "Stress-Response",
            briefDescription: "The development of characteristic symptoms lasting from 3 days to 1 month following exposure to one or more traumatic events.",
            criteriaSummary: "Exposure to trauma, followed by 9 or more symptoms from any of the five categories: intrusion, negative mood, dissociation, avoidance, and arousal. Lasts 3 days to 1 month.",
            criteriaList: [
                "Exposure to actual or threatened death, serious injury, or sexual violation",
                "Presence of 9 or more symptoms from categories: intrusion, negative mood, dissociation, avoidance, arousal",
                "Symptom duration is 3 days to 1 month after trauma exposure",
                "Causes clinically significant distress or impairment in social, occupational, or other areas",
                "Not attributable to physiological effects of a substance or another medical condition"
            ],
            minCriteriaRequired: 4,
            symptomsKeywords: ["trauma_exposure", "acute_symptoms", "acute_duration", "acute_impairment"],
            differentials: ["PTSD (diagnosed only after 1 month)", "Adjustment Disorder", "Panic Disorder", "Substance-Induced Delirium"],
            comorbidities: ["Depressive Disorders", "Panic Attacks", "Substance Abuse"],
            interventions: ["Psychological First Aid (PFA)", "Cognitive Behavioral Therapy (CBT)", "Trauma-Focused Therapy", "Relaxation Techniques", "Sleep support and tracking"]
        )
    ]
}
