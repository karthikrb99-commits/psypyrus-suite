package com.example.data

data class DsmDisorder(
    val name: String,
    val dsmCode: String,
    val icd10Code: String,
    val category: String,
    val briefDescription: String,
    val criteriaSummary: String,
    val criteriaList: List<String>,
    val minCriteriaRequired: Int,
    val symptomsKeywords: List<String>,
    val differentials: List<String>,
    val comorbidities: List<String>,
    val interventions: List<String>
)

object DsmDatabase {
    val categories = listOf(
        "All Disorders",
        "Depressive",
        "Anxiety",
        "Trauma-Related",
        "Neurodevelopmental",
        "Bipolar",
        "OCD-Related",
        "Personality",
        "Eating"
    )

    val disorders = listOf(
        DsmDisorder(
            name = "Major Depressive Disorder (MDD), Single Episode",
            dsmCode = "296.22",
            icd10Code = "F32.9",
            category = "Depressive",
            briefDescription = "Characterized by one or more major depressive episodes without a history of manic, mixed, or hypomanic episodes.",
            criteriaSummary = "At least 5 of 9 persistent symptoms present during the same 2-week period, representing a change from previous functioning. At least one of the symptoms is either (1) depressed mood or (2) loss of interest or pleasure (Anhedonia).",
            criteriaList = listOf(
                "Depressed mood most of the day, nearly every day (indicated by subjective report or observation)",
                "Markedly diminished interest or pleasure in all, or almost all, activities most of the day, nearly every day (Anhedonia)",
                "Significant weight loss when not dieting or weight gain, or decrease/increase in appetite nearly every day",
                "Insomnia or hypersomnia nearly every day",
                "Psychomotor agitation or retardation nearly every day",
                "Fatigue or loss of energy nearly every day",
                "Feelings of worthlessness or excessive, inappropriate guilt nearly every day (not merely self-reproach about being sick)",
                "Diminished ability to think or concentrate, or indecisiveness, nearly every day",
                "Recurrent thoughts of death, recurrent suicidal ideation without a specific plan, or a suicide attempt/plan"
            ),
            minCriteriaRequired = 5,
            symptomsKeywords = listOf("sadness", "depression", "unhappy", "cry", "hopeless", "anhedonia", "pleasure loss", "fatigue", "tired", "sleep", "insomnia", "guilt", "worthless", "suicide", "concentration", "weight"),
            differentials = listOf("Bipolar Disorder (due to potential hypomanic indicators)", "Dementia / Pseudodementia in elder cohorts", "Substance/Medication-Induced Depressive Disorder", "Hypothyroidism / Organic organic triggers", "Grief / Bereavement corresponding to loss"),
            comorbidities = listOf("Generalized Anxiety Disorder (GAD)", "Panic Disorder", "Substance Use Disorders", "Borderline Personality Disorder (BPD)"),
            interventions = listOf("Cognitive Behavioral Therapy (CBT)", "Behavioral Activation Protocols", "Interpersonal Psychotherapy (IPT)", "SSRI/SNRI pharmacotherapy support", "Structured Daily Wellness Checklist")
        ),
        DsmDisorder(
            name = "Generalized Anxiety Disorder (GAD)",
            dsmCode = "300.02",
            icd10Code = "F41.1",
            category = "Anxiety",
            briefDescription = "Excessive anxiety and worry about a variety of topics, events or activities, occurring more days than not for at least 6 months.",
            criteriaSummary = "Excessive worry occurs more days than not for at least 6 months. It is difficult to control. Associated with at least 3 of 6 somatic/cognitive symptoms (1 for children).",
            criteriaList = listOf(
                "Restlessness or feeling keyed up or on edge",
                "Being easily fatigued",
                "Difficulty concentrating or mind going blank",
                "Irritability",
                "Muscle tension (somatic scanning)",
                "Sleep disturbance (difficulty falling or staying asleep, or restless, unsatisfying sleep)"
            ),
            minCriteriaRequired = 3,
            symptomsKeywords = listOf("anxiety", "worry", "stress", "keyed up", "nervous", "tension", "muscle pain", "on edge", "irritability", "sleep", "restless", "fear", "palpitations", "concentration"),
            differentials = listOf("Social Anxiety Disorder", "Obsessive-Compulsive Disorder", "Pheochromocytoma / Thyroid storm", "Post-Traumatic Stress Disorder (PTSD)", "Substance-Induced Anxiety"),
            comorbidities = listOf("Major Depressive Disorder", "Panic Disorder", "Social Phobia", "Alcohol Use/Abuse"),
            interventions = listOf("Cognitive Restructuring", "Worry Exposure Techniques", "Acceptance and Commitment Therapy (ACT)", "Progressive Muscle Relaxation (PMR)", "Mindfulness Diaphragmatic Training", "SSRI/Buspirone evaluation")
        ),
        DsmDisorder(
            name = "Post-Traumatic Stress Disorder (PTSD)",
            dsmCode = "309.81",
            icd10Code = "F43.10",
            category = "Trauma-Related",
            briefDescription = "A mental health condition triggered by experiencing or witnessing a terrifying, traumatic event.",
            criteriaSummary = "Exposure to trauma followed by intrusive symptoms (1+), avoidance behaviors (1+), negative alterations in cognitions/mood (2+), and marked alterations in arousal/reactivity (2+) lasting >1 month.",
            criteriaList = listOf(
                "Involuntary, intrusive, distressing memories, flashbacks, or vivid nightmares of the traumatic event(s)",
                "Intense psychological or physiological distress upon exposure to internal or external trauma cues",
                "Active avoidance of trauma-related stimuli, thoughts, feelings, places, people, or conversations",
                "Inability to remember key aspects of trauma, persistent distorted blame of self, or detachment/estrangement",
                "Markedly diminished interest in activities, inability to feel positive emotions, or emotional numbness",
                "Hypervigilance, exaggerated startle response, or constant threat scanning behavior",
                "Irritable behavior, angry outbursts, reckless self-destructive patterns, insomnia, or poor concentration"
            ),
            minCriteriaRequired = 4,
            symptomsKeywords = listOf("trauma", "flashback", "nightmare", "abuse", "accident", "violence", "avoidance", "trigger", "numb", "startle", "hypervigilant", "panic", "fear", "estrangement", "anger"),
            differentials = listOf("Acute Stress Disorder (< 1 month)", "Adjustment Disorder", "Major Depressive Disorder", "Panic Disorder", "Borderline Personality Disorder"),
            comorbidities = listOf("Major Depressive Disorder", "Alcohol/Substance Use Disorder", "GAD", "Traumatic Brain Injury (TBI)"),
            interventions = listOf("Eye Movement Desensitization and Reprocessing (EMDR)", "Prolonged Exposure (PE) Therapy", "Cognitive Processing Therapy (CPT)", "Trauma-Informed Somatic Pacing", "Prazosin support for trauma nightmares")
        ),
        DsmDisorder(
            name = "Attention-Deficit/Hyperactivity Disorder (ADHD), Combined Presentation",
            dsmCode = "314.01",
            icd10Code = "F90.2",
            category = "Neurodevelopmental",
            briefDescription = "A persistent pattern of inattention and/or hyperactivity-impulsivity that interferes with functioning or development.",
            criteriaSummary = "Requires 6 or more symptoms of inattention AND 6 or more symptoms of hyperactivity-impulsivity for at least 6 months (5 symptoms if age 17+). Several symptoms must be present prior to age 12 and in 2+ environments.",
            criteriaList = listOf(
                "Inattention: Fails to give close attention to details, makes careless mistakes at school/work/tasks",
                "Inattention: Difficulty sustaining attention, mind drifting, difficulty listening when spoken to directly",
                "Inattention: Often does not follow through on instructions, fails to finish duties/projects, loses focus easily",
                "Inattention: Avoids, dislikes, or is reluctant to engage in tasks requiring sustained mental effort",
                "Inattention: Loses items necessary for tasks (keys, wallet, paperwork); easily distracted; incredibly forgetful",
                "Hyperactivity: Fidgets, taps hands/feet, squirms in seat, leaves seat inappropriately, feels constantly on the go",
                "Hyperactivity: Talks excessively, blurts out answers before questions are finished, interrupts others",
                "Hyperactivity: Inability to wait turn, intrudes on others conversations/games, feels like driven by a motor"
            ),
            minCriteriaRequired = 6,
            symptomsKeywords = listOf("inattention", "adhd", "distracted", "forgetful", "hyperactive", "impulsive", "focus", "organize", "careless mistake", "lose items", "fidget", "interrupt", "motor", "bored"),
            differentials = listOf("Specific Learning Disorder", "Autism Spectrum Disorder (ASD)", "Bipolar Disorder (racing thoughts mimic inattention)", "Generalized Anxiety", "Sleep Apnea / Chronic Sleep Deprivation"),
            comorbidities = listOf("Oppositional Defiant Disorder (ODD)", "Specific Learning Disorders", "Anxiety Disorders", "Depression"),
            interventions = listOf("ADHD Coaching & Cognitive Compensation", "Executive Function Strategy Training", "Parent-Child Interaction Therapy (PCIT)", "Stimulant / Non-Stimulant medication", "Time-segmentation (Pomodoro method)")
        ),
        DsmDisorder(
            name = "Bipolar I Disorder, Current Episode Manic",
            dsmCode = "296.42",
            icd10Code = "F31.12",
            category = "Bipolar",
            briefDescription = "Characterized by at least one manic episode. Major depressive and hypomanic episodes are common but not strictly required for diagnosis.",
            criteriaSummary = "A distinct period of abnormally and persistently elevated, expansive, or irritable mood, and abnormally increased goal-directed activity lasting at least 1 week, with 3+ symptoms.",
            criteriaList = listOf(
                "Inflated self-esteem or grandiosity",
                "Decreased need for sleep (e.g., feels rested after only 3 hours)",
                "More talkative than usual or pressure to keep talking",
                "Flight of ideas or subjective experience that thoughts are racing",
                "Distractibility (i.e., attention too easily drawn to unimportant stimuli)",
                "Increase in goal-directed activity (socially, work, school, or sexually) or psychomotor agitation",
                "Excessive involvement in activities that have a high potential for painful consequences (e.g., spending sprees, sexual indiscretions, foolish business investments)"
            ),
            minCriteriaRequired = 3,
            symptomsKeywords = listOf("manic", "mania", "bipolar", "racing thoughts", "grandiosity", "decreased sleep", "pressure speech", "expensive", "hyperactive", "reckless", "spending", "elevation", "flight of ideas"),
            differentials = listOf("Schizophrenia / Schizoaffective Disorder", "Substance-Induced Mania (e.g., psychostimulants)", "Bipolar II Disorder (hypomania lacks severe impairment)", "Major Depressive with mixed features"),
            comorbidities = listOf("Anxiety Disorders", "Attention-Deficit/Hyperactivity Disorder (ADHD)", "Substance Use Disorders", "Borderline Personality Disorder"),
            interventions = listOf("Psychoeducation on Mood Charting", "Interpersonal and Social Rhythm Therapy (IPSRT)", "Mood Stabilizers (e.g., Lithium, Valproate) / Antipsychotics", "Family-Focused Therapy (FFT)", "Sleep hygiene locks")
        ),
        DsmDisorder(
            name = "Panic Disorder",
            dsmCode = "300.01",
            icd10Code = "F41.0",
            category = "Anxiety",
            briefDescription = "Characterized by recurrent unexpected panic attacks and worry about future attacks or their consequences.",
            criteriaSummary = "Recurrent unexpected panic attacks (intense surge of fear peaking within minutes) followed by 1+ month of persistent worry about future attacks, implications, or maladaptive change in behavior.",
            criteriaList = listOf(
                "Heart palpitations, pounding heart, or accelerated heart rate",
                "Sweating, trembling, or shaking",
                "Sensations of shortness of breath, smothering, or choking chest discomfort",
                "Nausea, abdominal distress, feeling dizzy, unsteady, light-headed, or faint",
                "Chills or heat sensations, paresthesias (numbness/tingling), derealization or depersonalization",
                "Fear of losing control, 'going crazy', or fear of dying",
                "Persistent concern or worry about additional panic attacks, or significant maladaptive behavior changes to avoid attacks"
            ),
            minCriteriaRequired = 4,
            symptomsKeywords = listOf("panic", "panic attack", "heart racing", "chest pain", "shortness of breath", "choking", "dizzy", "shaking", "sweating", "fear dying", "paresthesia", "unsteady", "numbness", "breathless"),
            differentials = listOf("Cardiopulmonary Conditions (ruled out via EKG/PFT)", "Hyperthyroidism", "Vestibular disorders", "Phobias (specific cues)", "Social Anxiety (fear of public embarrassment)"),
            comorbidities = listOf("Agoraphobia", "Major Depressive Disorder", "Substance Use / Benzodiazepine rebound"),
            interventions = listOf("Panic Control Treatment (PCT)", "Interoceptive Exposure (provocation exercises)", "Cognitive Restructuring regarding cardiac catastrophic interpretations", "SSRI / Beta-blockers therapy support")
        ),
        DsmDisorder(
            name = "Borderline Personality Disorder (BPD)",
            dsmCode = "301.83",
            icd10Code = "F60.3",
            category = "Personality",
            briefDescription = "A pervasive pattern of instability of interpersonal relationships, self-image, affects, and marked impulsivity.",
            criteriaSummary = "Pervasive instability starting in early adulthood, occurring in 5 or more of the core diagnostic contexts.",
            criteriaList = listOf(
                "Frantic efforts to avoid real or imagined abandonment (excluding suicidal/self-mutilating acts)",
                "A pattern of unstable and intense interpersonal relationships characterized by alternating between extremes of idealization and devaluation (splitting)",
                "Identity disturbance: markedly and persistently unstable self-image or sense of self",
                "Impulsivity in at least two areas that are potentially self-damaging (e.g., spending, sex, substance abuse, reckless driving, binge eating)",
                "Recurrent suicidal behavior, gestures, or threats, or self-mutilating behavior (cutting, burning)",
                "Affective instability due to a marked reactivity of mood (e.g., intense episodic dysphoria, irritability, or anxiety lasting hours)",
                "Chronic feelings of emptiness",
                "Inappropriate, intense anger or difficulty controlling anger (e.g., frequent displays of temper, constant anger, physical fights)",
                "Transient, stress-related paranoid ideation or severe dissociative symptoms"
            ),
            minCriteriaRequired = 5,
            symptomsKeywords = listOf("borderline", "bpd", "relationship", "splitting", "abandonment", "suicidal gesture", "self-harm", "cutting", "identity", "empty", "anger", "paranoia", "mood swing", "impulsive", "idealization"),
            differentials = listOf("Bipolar Disorder (rapid cycling vs. BPD brief reactivity)", "Complex PTSD (C-PTSD)", "Histrionic Personality Disorder", "Depressive Disorders"),
            comorbidities = listOf("Major Depressive Disorder", "Post-Traumatic Stress Disorder (PTSD)", "Substance Use Disorders", "Eating Disorders (Bulimia)"),
            interventions = listOf("Dialectical Behavior Therapy (DBT - Gold Standard)", "Mentalization-Based Treatment (MBT)", "Schema Therapy", "Emotion Regulation and Distress Tolerance Skills", "Crisis Plan and Safety Contract")
        ),
        DsmDisorder(
            name = "Obsessive-Compulsive Disorder (OCD)",
            dsmCode = "300.3",
            icd10Code = "F42.2",
            category = "OCD-Related",
            briefDescription = "The presence of obsessions, compulsions, or both, which are time-consuming and cause significant distress.",
            criteriaSummary = "Presence of obsessions (intrusive, distressing thoughts) and/or compulsions (repetitive behaviors performed to mentalize/reduce distress) that consume more than 1 hour per day or cause significant impairment.",
            criteriaList = listOf(
                "Obsessions: Recurrent and persistent thoughts, urges, or images experienced as intrusive and unwanted, causing major anxiety/distress",
                "Obsessions: Individual attempts to ignore, suppress, or neutralize such thoughts, urges, or images with some other thought or action",
                "Compulsions: Repetitive behaviors (e.g., hand washing, ordering, checking) or mental acts (e.g., praying, counting, repeating words) that the individual feels driven to perform in response to an obsession",
                "Compulsions: Behaviors/acts are aimed at preventing or reducing anxiety/distress, or preventing a dreaded event, but are excessively unrealistic"
            ),
            minCriteriaRequired = 1,
            symptomsKeywords = listOf("obsessive", "compulsive", "ocd", "checking", "washing", "germs", "counting", "symmetry", "intrusive thought", "ritual", "repeat", "hoarding", "scrupulosity"),
            differentials = listOf("GAD (worry about real-life concerns vs. OCD magical thinking)", "Depressive ruminations", "Tic disorders", "Autism Spectrum Disorder (repetitive behaviors)"),
            comorbidities = listOf("Anxiety Disorders", "Depression (MDD)", "Tourette Syndrom / Tic Disorders", "Body Dysmorphic Disorder"),
            interventions = listOf("Exposure and Response Prevention (ERP)", "Acceptance and Commitment Therapy (ACT)", "Cognitive Behavioral Therapy (CBT)", "High-dose SSRI/Clomipramine pharmacotherapy")
        ),
        DsmDisorder(
            name = "Anorexia Nervosa",
            dsmCode = "307.1",
            icd10Code = "F50.01",
            category = "Eating",
            briefDescription = "An eating disorder characterized by calorie restriction, fear of weight gain, and body image distortion.",
            criteriaSummary = "Restriction of energy intake leading to significantly low body weight. Intense fear of gaining weight or behavior that interferes with weight gain. Distorted body image.",
            criteriaList = listOf(
                "Restriction of energy intake relative to requirements, leading to a significantly low body weight in the context of age, sex, developmental trajectory, and physical health",
                "Intense fear of gaining weight or of becoming fat, or persistent behavior that interferes with weight gain, even though at a significantly low weight",
                "Disturbance in the way in which one's body weight or shape is experienced, undue influence of body weight or shape on self-evaluation, or persistent lack of recognition of the seriousness of the current low body weight"
            ),
            minCriteriaRequired = 3,
            symptomsKeywords = listOf("anorexia", "eating disorder", "weight loss", "calorie", "fasting", "fat", "thin", "purge", "body image", "distorted", "body mass index", "bmi", "underweight"),
            differentials = listOf("Avoidant/Restrictive Food Intake Disorder (ARFID - lacks body image concern)", "Major Depressive Disorder (decreased appetite)", "Inflammatory Bowel Disease / Celiac", "Hyperthyroidism"),
            comorbidities = listOf("Depression", "Anxiety", "Obsessive-Compulsive Disorder", "Self-harm/BPD traits"),
            interventions = listOf("Family-Based Treatment (FBT / Maudsley Model)", "Cognitive Behavioral Therapy for Eating Disorders (CBT-E)", "Nutritional Rehabilitation Support", "Multidisciplinary Medical Monitoring")
        )
    )
}
