/**
/**
 * PsyPyrus AI - Declarative Intake & Consent Form Schemas
 * Translates clinical paper forms from Intake-Forms-F021022V2.pdf into structured JSON-compatible layouts.
 */

export const INTAKE_FORMS_SCHEMAS = {
    client_intake: {
        id: "client_intake",
        title: "Client Intake Form",
        description: "Standard questionnaire for new adult clients. Covers contact info, general health, lifestyle, and clinical goals.",
        category: "Intake",
        timeEstimation: "25 mins",
        pages: [
            {
                title: "Personal Demographics",
                fields: [
                    { id: "name", label: "Full Name (Last, First, Middle Initial)", type: "text", required: true, prefill: "name" },
                    { id: "parent_guardian", label: "Name of parent or guardian (if minor)", type: "text" },
                    { id: "birth_date", label: "Birth Date", type: "date", required: true },
                    { id: "age", label: "Age", type: "number", required: true, prefill: "age" },
                    { 
                        id: "gender", 
                        label: "Gender", 
                        type: "select", 
                        options: ["Male", "Female", "Other"], 
                        required: true,
                        prefill: "gender"
                    },
                    { id: "gender_other", label: "If Other, specify:", type: "text", condition: { field: "gender", value: "Other" } },
                    { 
                        id: "marital_status", 
                        label: "Marital Status", 
                        type: "select", 
                        options: ["Single", "Partnered", "Married", "Separated", "Divorced", "Widowed"] 
                    },
                    { id: "num_children", label: "Number of Children", type: "number" },
                    { id: "children_ages", label: "Children's Ages", type: "text" }
                ]
            },
            {
                title: "Contact Information",
                fields: [
                    { id: "home_address", label: "Home Address", type: "text" },
                    { id: "city", label: "City", type: "text" },
                    { id: "state", label: "State", type: "text" },
                    { id: "zip_code", label: "Zip Code", type: "text" },
                    { id: "home_phone", label: "Home Phone", type: "tel", prefill: "phone" },
                    { id: "home_phone_msg", label: "May we leave a message on Home Phone?", type: "radio", options: ["Yes", "No"] },
                    { id: "cell_phone", label: "Cell/Other Phone", type: "tel" },
                    { id: "cell_phone_msg", label: "May we leave a message on Cell/Other Phone?", type: "radio", options: ["Yes", "No"] },
                    { id: "email", label: "Email Address", type: "email", required: true, prefill: "email" },
                    { id: "email_ok", label: "May we email you? (Note: Email is not fully confidential)", type: "radio", options: ["Yes", "No"] },
                    { id: "referred_by", label: "Referred by", type: "text" }
                ]
            },
            {
                title: "Prior Mental Health Services",
                fields: [
                    { id: "current_services", label: "Are you currently receiving psychological, counseling, or psychiatric services?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "current_services_detail", label: "If yes, please list/describe current services & reason for change:", type: "textarea", condition: { field: "current_services", value: "Yes" } },
                    { id: "past_services", label: "Have you received any mental health services in the past?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "past_services_detail", label: "If yes, please list/describe past services & reason for change:", type: "textarea", condition: { field: "past_services", value: "Yes" } },
                    { id: "current_medication", label: "Are you currently taking any psychiatric prescription medication?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "current_medication_detail", label: "If yes, please list medication names & dosages:", type: "textarea", condition: { field: "current_medication", value: "Yes" } },
                    { id: "past_medication", label: "Have you been prescribed psychiatric medication in the past?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "past_medication_detail", label: "If yes, please list past medications:", type: "textarea", condition: { field: "past_medication", value: "Yes" } }
                ]
            },
            {
                title: "General Health & Sleep Habits",
                fields: [
                    { id: "physical_health", label: "How would you describe your physical health at the present time?", type: "select", options: ["Poor", "Unsatisfactory", "Satisfactory", "Good", "Very good"], required: true },
                    { id: "health_concerns", label: "Please list persistent physical concerns (e.g. chronic pain, headaches, high blood pressure, diabetes, thyroid):", type: "textarea" },
                    { id: "medical_medication", label: "Are you taking medication for physical/medical issues?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "medical_medication_detail", label: "If yes, please list:", type: "textarea", condition: { field: "medical_medication", value: "Yes" } },
                    { id: "sleep_problems", label: "Are you having problems with the quality of your sleep?", type: "radio", options: ["Yes", "No"], required: true },
                    { 
                        id: "sleep_concerns_list", 
                        label: "Check all sleep concerns that apply:", 
                        type: "checkbox", 
                        options: ["Sleep too much", "Sleep too little", "Poor quality", "Disturbing dreams"],
                        condition: { field: "sleep_problems", value: "Yes" }
                    },
                    { id: "exercise_days", label: "How many days per week do you exercise?", type: "number" },
                    { id: "exercise_minutes", label: "Average minutes per exercise session?", type: "number" }
                ]
            },
            {
                title: "Nutrition & Substance Use",
                fields: [
                    { id: "eating_changes", label: "Are there any changes or difficulties with your eating habits?", type: "radio", options: ["Yes", "No"], required: true },
                    { 
                        id: "eating_concerns_list", 
                        label: "Check all eating concerns that apply:", 
                        type: "checkbox", 
                        options: ["Eating less", "Eating more", "Bingeing", "Restricting"],
                        condition: { field: "eating_changes", value: "Yes" }
                    },
                    { id: "weight_change", label: "Have you experienced a weight change in the last two months?", type: "radio", options: ["Yes", "No"] },
                    { id: "weight_change_detail", label: "If yes, please describe (lbs lost/gained):", type: "text", condition: { field: "weight_change", value: "Yes" } },
                    { id: "alcohol_regular", label: "Do you consume alcohol regularly?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "alcohol_binge_count", label: "In a typical month, how many times do you have 4 or more drinks in a 24-hour period?", type: "number", condition: { field: "alcohol_regular", value: "Yes" } },
                    { id: "recreational_drugs", label: "How often do you engage in recreational drug use?", type: "select", options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"], required: true }
                ]
            },
            {
                title: "Mood & Safety Screening",
                fields: [
                    { id: "depressed_recently", label: "Have you felt depressed recently?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "depressed_duration", label: "If yes, for how long?", type: "text", condition: { field: "depressed_recently", value: "Yes" } },
                    { id: "suicidal_recent", label: "Have you had any suicidal thoughts recently?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "suicidal_recent_freq", label: "If yes, how often?", type: "select", options: ["Frequently", "Sometimes", "Rarely"], condition: { field: "suicidal_recent", value: "Yes" } },
                    { id: "suicidal_past", label: "Have you ever had suicidal thoughts in the past?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "suicidal_past_time", label: "If yes, how long ago?", type: "text", condition: { field: "suicidal_past", value: "Yes" } },
                    { id: "suicidal_past_freq", label: "And how often did you have them?", type: "select", options: ["Frequently", "Sometimes", "Rarely"], condition: { field: "suicidal_past", value: "Yes" } }
                ]
            },
            {
                title: "Relationships & Employment",
                fields: [
                    { id: "romantic_relationship", label: "Are you currently in a romantic relationship?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "relationship_duration", label: "If yes, how long have you been in this relationship?", type: "text", condition: { field: "romantic_relationship", value: "Yes" } },
                    { id: "relationship_rating", label: "Rate relationship quality on a scale of 1 to 10 (10 being best):", type: "number", condition: { field: "romantic_relationship", value: "Yes" } },
                    { id: "life_changes", label: "In the last year, have you experienced major life changes (employment, relocation, illness, loss)? Describe:", type: "textarea" },
                    { id: "employed", label: "Are you currently employed?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "employer", label: "If yes, who is your employer?", type: "text", condition: { field: "employed", value: "Yes" } },
                    { id: "position", label: "What is your job position?", type: "text", condition: { field: "employed", value: "Yes" } },
                    { id: "happy_work", label: "Are you happy in your current position?", type: "radio", options: ["Yes", "No"], condition: { field: "employed", value: "Yes" } },
                    { id: "stressed_work", label: "Does your work make you stressed?", type: "radio", options: ["Yes", "No"], condition: { field: "employed", value: "Yes" } },
                    { id: "stressors_work", label: "If yes, what are your work-related stressors?", type: "text", condition: { field: "stressed_work", value: "Yes" } }
                ]
            },
            {
                title: "Clinical Symptoms Checklist",
                fields: [
                    { 
                        id: "symptoms_checklist", 
                        label: "Check all clinical concerns that apply to you at the present time:", 
                        type: "checkbox", 
                        options: [
                            "Extreme depressed mood", "Mood swings", "Extreme anxiety", 
                            "Panic attacks", "Phobias", "Sleep disturbance", 
                            "Hallucinations", "Memory problems", "Body complaints", 
                            "Alcohol/substance abuse", "Eating disorder", "Repetitive thoughts", 
                            "Repetitive behaviors", "Homicidal thoughts", "Indecision", 
                            "Suicide attempts", "Trouble planning", "Lack of focus", 
                            "Difficulty with relationships", "Confusion", "Anger issues"
                        ]
                    }
                ]
            },
            {
                title: "Family & Spiritual Context",
                fields: [
                    { id: "practice_religion", label: "Do you practice or observe a religion?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "religion_name", label: "If yes, what is your faith?", type: "text", condition: { field: "practice_religion", value: "Yes" } },
                    { id: "consider_spiritual", label: "If no, do you consider yourself to be spiritual?", type: "radio", options: ["Yes", "No"], condition: { field: "practice_religion", value: "No" } },
                    { 
                        id: "family_history_mental", 
                        label: "Circle family members with a history of any of the following (specify relationship):", 
                        type: "checkbox", 
                        options: [
                            "Depression", "Anxiety Disorders", "Bipolar Disorder", "Panic Attacks", 
                            "Alcohol Abuse", "Drug Abuse", "Eating Disorder", "Learning Disability", 
                            "Trauma History", "Domestic Violence", "Obesity", "OCD", "Schizophrenia"
                        ]
                    },
                    { id: "family_history_details", label: "Details regarding family mental health history (e.g. mother - depression, uncle - schizophrenia):", type: "textarea" }
                ]
            },
            {
                title: "Personal Narrative & Goals",
                fields: [
                    { id: "strengths", label: "List your strengths:", type: "textarea", required: true },
                    { id: "improvements", label: "List areas you would like to develop or improve:", type: "textarea", required: true },
                    { id: "like_self", label: "What do you like most about yourself?", type: "textarea" },
                    { id: "coping_stress", label: "What are some ways you cope with life obstacles and stress?", type: "textarea" },
                    { id: "therapy_goals", label: "What are your goals for therapy? What would you like to accomplish?", type: "textarea", required: true },
                    { id: "additional_info", label: "Is there anything else you would like to share?", type: "textarea" }
                ]
            }
        ]
    },

    life_history: {
        id: "life_history",
        title: "Life History Questionnaire",
        description: "A deep dive into your life history, developmental landmarks, education, and early relationships.",
        category: "Intake",
        timeEstimation: "35 mins",
        pages: [
            {
                title: "Background & Education",
                fields: [
                    { id: "name", label: "Full Name", type: "text", required: true, prefill: "name" },
                    { id: "ethnic_background", label: "What is your ethnic background?", type: "text" },
                    { id: "foreign_born", label: "Were you or anyone in your immediate family foreign-born?", type: "radio", options: ["Yes", "No"] },
                    { id: "foreign_born_detail", label: "If yes, who, where, and approximate age of immigration:", type: "textarea", condition: { field: "foreign_born", value: "Yes" } },
                    { id: "education_level", label: "Highest education grade/degree completed?", type: "text", required: true },
                    { id: "further_education", label: "Any plans to further your education?", type: "radio", options: ["Yes", "No"] },
                    { id: "further_education_detail", label: "If so, when and what?", type: "text", condition: { field: "further_education", value: "Yes" } }
                ]
            },
            {
                title: "Life Stressors Checklist",
                fields: [
                    {
                        id: "life_stressors",
                        label: "Check all items that have been a major source of stress or difficulty recently:",
                        type: "checkbox",
                        options: [
                            "Death of a loved one", "Low Energy", "Smoking",
                            "Debt", "Low Frustration Tolerance", "Spirituality",
                            "Decision-Making Problems", "Low Income", "Step-Parenting",
                            "Divorce", "Marital Conflicts", "Suicidal Thoughts",
                            "Drug/Alcohol Abuse", "Memory Problems", "Unemployment",
                            "Eating Issues", "Physical Illness/Pain", "Weight Issues",
                            "Job Dissatisfaction", "Self-Dislike", "Legal Trouble"
                        ]
                    }
                ]
            },
            {
                title: "Coping & Family Narrative",
                fields: [
                    { id: "cope_narrative", label: "In what ways have you attempted to cope with your current problems?", type: "textarea", required: true },
                    { id: "family_special_problems", label: "Specify family member(s) with special problems and approximate year (e.g. mother, serious illness, 2018):", type: "textarea" },
                    { id: "family_closest", label: "Who in your family do you currently feel closest to?", type: "text" },
                    { id: "family_distant", label: "Who in your family do you feel most distant from?", type: "text" },
                    { id: "health_description", label: "How is your physical health at present?", type: "select", options: ["Poor", "Fair", "Good", "Excellent"], required: true },
                    { id: "drug_use_freq", label: "How often do you engage in recreational drug use?", type: "select", options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"], required: true },
                    { id: "drug_use_problem", label: "Do you consider this drug use a problem?", type: "radio", options: ["Yes", "No", "Unsure"], condition: { field: "drug_use_freq", value: ["Daily", "Weekly", "Monthly", "Rarely"] } },
                    { id: "additional_life_history", label: "Please enter any additional details about your life history here:", type: "textarea" }
                ]
            }
        ]
    },

    psychosocial: {
        id: "psychosocial",
        title: "Psychosocial History",
        description: "Captures historical and developmental data regarding family, relationships, and trauma factors.",
        category: "Intake",
        timeEstimation: "30 mins",
        pages: [
            {
                title: "Family of Origin",
                fields: [
                    { id: "name", label: "Client Name", type: "text", required: true, prefill: "name" },
                    { id: "dob", label: "DOB", type: "date", required: true },
                    { id: "parent_relationship", label: "Describe your parents' relationship with each other when you were a child:", type: "textarea" },
                    { id: "family_growing_up", label: "Describe your family growing up (dynamics, support, stability):", type: "textarea" }
                ]
            },
            {
                title: "Relationships & History",
                fields: [
                    { id: "has_children", label: "Do you have children?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "children_details", label: "If yes, write down their names and ages:", type: "textarea", condition: { field: "has_children", value: "Yes" } },
                    { id: "first_sexual_experience", label: "Describe your first sexual experience (comfort, age, context):", type: "textarea" },
                    { id: "military_history", label: "Military history (branch, length, rank, discharge type, details):", type: "textarea" },
                    { id: "support_system", label: "Who do you turn to for support outside of professional care?", type: "textarea", required: true }
                ]
            },
            {
                title: "Substance Use History",
                fields: [
                    { id: "substance_guilt", label: "Have you ever felt guilty about your drinking/drug use?", type: "radio", options: ["Yes", "No"] },
                    { id: "hangover_cure", label: "Have you ever drank or used drugs to eliminate a hangover?", type: "radio", options: ["Yes", "No"] },
                    { id: "substance_first_age", label: "Age of first alcohol or drug use?", type: "number" },
                    { id: "treatment_history", label: "Describe past treatment history for substance use (dates, programs, outcome):", type: "textarea" },
                    { id: "additional_psychosocial", label: "Is there anything more you want to share about your psychosocial history?", type: "textarea" }
                ]
            }
        ]
    },

    couples_intake: {
        id: "couples_intake",
        title: "Couples Therapy Intake Form",
        description: "Assesses relationship satisfaction, duration, parenting splits, and couples counseling history.",
        category: "Therapy Specific",
        timeEstimation: "20 mins",
        pages: [
            {
                title: "Partner Demographics",
                fields: [
                    { id: "first_name", label: "First Name", type: "text", required: true },
                    { id: "last_name", label: "Last Name", type: "text", required: true },
                    { id: "partner_name", label: "Partner's Full Name", type: "text", required: true }
                ]
            },
            {
                title: "Relationship Timeline",
                fields: [
                    { id: "relationship_status", label: "Relationship Status", type: "select", options: ["Dating", "Cohabiting", "Married", "Separated", "Divorced"] },
                    { id: "relationship_duration", label: "How long have you been in this state with your partner?", type: "text", required: true },
                    { id: "prior_couples_counseling", label: "Have you received couples counseling before?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "prior_counseling_detail", label: "If yes, was it effective?", type: "select", options: ["Very effective", "Somewhat effective", "No change", "Issues worsened"], condition: { field: "prior_couples_counseling", value: "Yes" } },
                    { id: "individual_counseling", label: "Have you ever received individual counseling before?", type: "radio", options: ["Yes", "No"] }
                ]
            },
            {
                title: "Relationship & Intimacy",
                fields: [
                    { id: "sex_frequency", label: "Rate physical intimacy frequency with partner:", type: "select", options: ["Never", "Seldom", "Regularly", "Constantly", "Would like to cut back", "Others want me to cut back"] },
                    { id: "parenting_needs", label: "Check areas where you need the most relationship support:", type: "checkbox", options: ["Parenting skills", "Better sharing of responsibilities", "Help with children's behavior", "Financial coordination", "Emotional connection"] },
                    { id: "couple_strengths", label: "What are your greatest strengths as a couple?", type: "textarea", required: true },
                    { id: "couple_challenges", label: "What are your main goals/challenges as a couple?", type: "textarea", required: true }
                ]
            }
        ]
    },

    outpatient_consent: {
        id: "outpatient_consent",
        title: "Consent for Outpatient Services",
        description: "Official informed consent document covering professional fees, HIPAA privacy, session policies, and digital signature authorization.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Professional Policies & Fees",
                fields: [
                    { 
                        id: "intro_info", 
                        type: "instructions", 
                        label: "Consent Agreement Terms", 
                        text: "Welcome to our practice. This document contains important information about our professional services and business policies. Please read it carefully. When you sign this document, it will represent a binding agreement between us. You have the right to revoke it in writing at any time."
                    },
                    { id: "practioner_name", label: "Name of Practice/Practitioner", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "hourly_fee", label: "Agreed Hourly Session Fee ($)", type: "number", required: true, defaultValue: 150 },
                    { id: "cancellation_policy", label: "Cancellation policy requires notice of at least (hours):", type: "number", required: true, defaultValue: 24 },
                    {
                        id: "privacy_notices",
                        type: "instructions",
                        label: "HIPAA Protected Health Information",
                        text: "Under the Health Insurance Portability and Accountability Act (HIPAA), your session records and health disclosures are highly protected. Exceptions include cases where a child or elderly person is suspected of being abused, or where you present an imminent safety danger to yourself or others."
                    }
                ]
            },
            {
                title: "Client Acknowledgment & Signature",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "client_dob", label: "Client DOB", type: "date", required: true },
                    { 
                        id: "agree_terms", 
                        label: "I have read, understood, and agree to the professional fees, office policies, and HIPAA privacy rules.", 
                        type: "radio", 
                        options: ["I Agree", "I Disagree"], 
                        required: true 
                    },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { 
                        id: "signature", 
                        label: "Draw Client E-Signature below (or type full name):", 
                        type: "signature", 
                        required: true 
                    }
                ]
            }
        ]
    },

    child_intake: {
        id: "child_intake",
        title: "Child Intake Form",
        description: "Intake form for minor/child therapy. Completed by the child's parent or legal guardian.",
        category: "Intake",
        timeEstimation: "20 mins",
        pages: [
            {
                title: "Demographics",
                fields: [
                    { id: "child_name", label: "Child's Full Name", type: "text", required: true },
                    { id: "child_dob", label: "Child's DOB", type: "date", required: true },
                    { id: "child_age", label: "Child's Age", type: "number", required: true },
                    { id: "school_name", label: "School Name", type: "text" },
                    { id: "school_grade", label: "Current Grade", type: "text" },
                    { id: "parent_names", label: "Parent/Guardian Names", type: "text", required: true },
                    { id: "parent_phone", label: "Parent Phone Number", type: "tel", required: true }
                ]
            },
            {
                title: "School & Health History",
                fields: [
                    { id: "school_experience", label: "Describe child's school experience (grades, behavior, peers):", type: "textarea", required: true },
                    { id: "sleep_patterns", label: "Describe child's sleep patterns (insomnia, bedwetting, nightmares):", type: "textarea", required: true },
                    { id: "separation_difficulty", label: "Does your child have difficulty separating from parents?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "separation_detail", label: "If yes, please explain:", type: "text", condition: { field: "separation_difficulty", value: "Yes" } },
                    { id: "severe_illness", label: "Has your child had any severe, long-term illnesses or accidents?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "severe_illness_detail", label: "If yes, please list/describe:", type: "textarea", condition: { field: "severe_illness", value: "Yes" } }
                ]
            },
            {
                title: "Diagnostic Screening",
                fields: [
                    { id: "eating_disorder", label: "Eating Disorder concern?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "learning_disability", label: "Learning Disability concern?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "trauma_history", label: "Trauma History concern?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "behavioral_issues", label: "Behavioral / Conduct Issues concern?", type: "radio", options: ["Yes", "No"], required: true }
                ]
            }
        ]
    },

    developmental_history: {
        id: "developmental_history",
        title: "Developmental History Form",
        description: "Milestone developmental checklist spanning infancy, motor skills, speech, and social relations.",
        category: "Intake",
        timeEstimation: "25 mins",
        pages: [
            {
                title: "Infant Milestones",
                fields: [
                    { id: "child_name", label: "Child's Full Name", type: "text", required: true },
                    { id: "pediatrician_name", label: "Pediatrician Name", type: "text" },
                    { id: "pediatrician_address", label: "Pediatrician Address", type: "text" },
                    { id: "walked_age", label: "Age walked without holding on (months/years):", type: "text" },
                    { id: "walked_speed", label: "Walked milestone speed:", type: "select", options: ["Early", "Normal", "Late"] },
                    { id: "spoke_words_age", label: "Age of first words (months/years):", type: "text" },
                    { id: "spoke_words_speed", label: "Speech milestone speed:", type: "select", options: ["Early", "Normal", "Late"] }
                ]
            },
            {
                title: "Childhood Sleep & Behavior",
                fields: [
                    { 
                        id: "sleep_concerns", 
                        label: "Check all sleep concerns that apply to the child:", 
                        type: "checkbox", 
                        options: ["Difficulty staying asleep", "Difficulty falling asleep", "Terrors/nightmares", "Waking up exhausted", "Sleepwalking"] 
                    },
                    { id: "distracted_tv", label: "Is the child easily distracted while watching television or playing?", type: "radio", options: ["Yes", "No"] },
                    { id: "eye_contact_difficulty", label: "Does the child have difficulty making or keeping eye contact?", type: "radio", options: ["Yes", "No"] },
                    { id: "seasonal_moods", label: "Do child's moods seem connected with the seasons?", type: "radio", options: ["Yes", "No"] }
                ]
            },
            {
                title: "Academic & Family Relations",
                fields: [
                    { id: "academic_excels", label: "Describe areas in which child excels at school:", type: "textarea" },
                    { id: "marital_conflict", label: "Are there any significant marital conflicts between parents?", type: "radio", options: ["Yes", "No"] },
                    { id: "marital_conflict_detail", label: "If yes, briefly describe:", type: "textarea", condition: { field: "marital_conflict", value: "Yes" } },
                    { id: "adult_relations", label: "Does the child have difficulty getting along with adults?", type: "radio", options: ["Yes", "No"] },
                    { id: "adult_relations_detail", label: "If yes, describe:", type: "textarea", condition: { field: "adult_relations", value: "Yes" } },
                    { id: "keeping_friends", label: "Does the child have difficulty keeping friends?", type: "radio", options: ["Yes", "No"] },
                    { id: "best_friend", label: "Does the child have a best friend?", type: "radio", options: ["Yes", "No"] },
                    { id: "child_strengths", label: "What are your child's primary strengths?", type: "textarea", required: true }
                ]
            }
        ]
    },

    family_therapy: {
        id: "family_therapy",
        title: "Family Therapy Intake Form",
        description: "Completed individually by family members (ages 14+) seeking coordinated family therapy.",
        category: "Therapy Specific",
        timeEstimation: "20 mins",
        pages: [
            {
                title: "Background & Medical",
                fields: [
                    { id: "first_name", label: "First Name", type: "text", required: true },
                    { id: "last_name", label: "Last Name", type: "text", required: true },
                    { id: "medical_problems", label: "Please list diagnosed psychiatric or medical problems:", type: "textarea" },
                    { id: "prior_family_therapy", label: "Have you ever received family counseling before?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "prior_therapy_detail", label: "If yes, list dates, location, and reason for seeking counseling:", type: "textarea", condition: { field: "prior_family_therapy", value: "Yes" } }
                ]
            },
            {
                title: "Family Difficulties Checklist",
                fields: [
                    {
                        id: "family_issues",
                        label: "Check all issues that are currently causing stress within the family:",
                        type: "checkbox",
                        options: [
                            "Educational or occupational difficulties", "Housing problems", "Grief or bereavement",
                            "Communication breakdown", "Discipline disagreements", "Financial strain",
                            "Substance abuse", "Emotional distancing", "Frequent arguments"
                        ]
                    }
                ]
            },
            {
                title: "Expectations & Commitment",
                fields: [
                    { id: "counseling_expectations", label: "What are your expectations for family counseling?", type: "textarea", required: true },
                    { id: "relationship_priority_willingness", label: "How willing are you to make 'working on these relationships' a priority in your life? (1 = not willing, 5 = extremely willing):", type: "select", options: ["1", "2", "3", "4", "5"], required: true }
                ]
            }
        ]
    },

    opioid_use: {
        id: "opioid_use",
        title: "Opioid Use Intake Form",
        description: "Specialized clinical intake for patients undergoing assessment or treatment for opioid dependencies.",
        category: "Therapy Specific",
        timeEstimation: "25 mins",
        pages: [
            {
                title: "Clinical Background",
                fields: [
                    { id: "name", label: "Full Name", type: "text", required: true, prefill: "name" },
                    { id: "dob", label: "DOB", type: "date", required: true },
                    { id: "pcp_name", label: "Primary Care Physician Name", type: "text" },
                    { id: "pcp_phone", label: "Physician Phone", type: "tel" },
                    { id: "last_labs", label: "Approximate date of most recent lab work:", type: "date" },
                    { id: "prior_detox", label: "How did you stop opioid use in the past? (Check all that apply):", type: "checkbox", options: ["On your own", "Outpatient treatment", "Live-in program or detox", "Methadone", "Buprenorphine (Suboxone)", "Incarceration"] }
                ]
            },
            {
                title: "Current Usage Profile",
                fields: [
                    { id: "current_opioids", label: "Current opioid(s) used:", type: "text", required: true },
                    { id: "route_admin", label: "Route of administration:", type: "select", options: ["Oral (by mouth)", "Snort", "Smoke", "Inject"], required: true },
                    { id: "daily_use_amount", label: "Average daily amount/dose used:", type: "text", required: true }
                ]
            },
            {
                title: "Medical & Health History",
                fields: [
                    { id: "hepc_tested", label: "Have you ever been tested for Hepatitis C?", type: "radio", options: ["Yes", "No"] },
                    { id: "hepc_test_date", label: "If yes, when?", type: "text", condition: { field: "hepc_tested", value: "Yes" } },
                    { id: "hepc_result", label: "What was the result?", type: "select", options: ["Positive", "Negative"], condition: { field: "hepc_tested", value: "Yes" } },
                    { id: "hepa_history", label: "Have you ever had Hepatitis A?", type: "radio", options: ["Yes", "No"] },
                    { id: "current_prescribed_meds", label: "Current prescribed medications (dose and frequency):", type: "textarea" },
                    { id: "has_children", label: "Do you have children?", type: "radio", options: ["Yes", "No"] },
                    { id: "children_count", label: "If yes, how many?", type: "number", condition: { field: "has_children", value: "Yes" } },
                    { id: "children_ages", label: "Their ages:", type: "text", condition: { field: "has_children", value: "Yes" } }
                ]
            }
        ]
    },

    solution_focused_initial: {
        id: "solution_focused_initial",
        title: "Initial Session Solution-Focused Questions",
        description: "Standard positive alliance and solution-focused inquiry set for client goal-building.",
        category: "Intake",
        timeEstimation: "15 mins",
        pages: [
            {
                title: "Goals & Future Projection",
                fields: [
                    { id: "session_goals", label: "What do you want to get out of being here today?", type: "textarea", required: true },
                    { 
                        id: "miracle_explanation", 
                        type: "instructions", 
                        label: "The Miracle Question", 
                        text: "Suppose tonight, while you are sleeping, a miracle happens, and the problems that brought you here are resolved. When you wake up tomorrow morning, how will you first discover that this miracle occurred? What will be different?"
                    },
                    { id: "miracle_response", label: "Describe what will be different after the miracle occurs:", type: "textarea", required: true },
                    { id: "miracle_sequence", label: "And then what would happen next?", type: "textarea" }
                ]
            },
            {
                title: "Exceptions & Coping",
                fields: [
                    { id: "exception_times", label: "What will you be doing instead during the times the problem does not occur?", type: "textarea", required: true },
                    { id: "different_behaviors", label: "What are you doing differently at those times when things are slightly better?", type: "textarea" },
                    { id: "toughing_out", label: "How will you get through the rest of the day when things feel difficult?", type: "textarea", required: true }
                ]
            }
        ]
    },

    parental_consent_minor: {
        id: "parental_consent_minor",
        title: "Parental Consent for Treatment of Minors",
        description: "Mandatory clinical consent release form granting authorization for treating adolescent or child clients.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Minor Treatment Terms",
                fields: [
                    {
                        id: "minor_terms",
                        type: "instructions",
                        label: "Parental Consent Agreement",
                        text: "I verify that I am the legal parent or guardian of the minor child named below. I hereby give authorization and consent to have the child undergo psychotherapy treatment and counseling services. I understand that the therapist will support a secure, confidential environment for the child, while keeping me informed of safety concerns."
                    },
                    { id: "child_name", label: "Minor Child's Full Name", type: "text", required: true },
                    { id: "child_age", label: "Child's Age", type: "number", required: true },
                    { id: "parent_name", label: "Parent/Guardian Full Name", type: "text", required: true },
                    { id: "parent_relationship", label: "Relationship to Child", type: "select", options: ["Parent", "Legal Guardian", "Foster Parent"] }
                ]
            },
            {
                title: "Consent Release Sign-off",
                fields: [
                    { id: "agree_minor_terms", label: "I authorize treatment for the minor child named above and accept policies.", type: "radio", options: ["I Consent", "I Do Not Consent"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Parent/Guardian E-Signature (draw or type):", type: "signature", required: true }
                ]
            }
        ]
    },

    appt_reminders: {
        id: "appt_reminders",
        title: "Authorization for Appointment Reminders",
        description: "Enables automated email/text reminders and confirms acknowledgement of late-cancellation fees.",
        category: "Consent",
        timeEstimation: "5 mins",
        pages: [
            {
                title: "Reminder Preferences",
                fields: [
                    { id: "clinic_name", label: "Name of Clinic/Practitioner", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "reminder_lead_time", label: "Send reminders how many hours before appointment?", type: "number", required: true, defaultValue: 24 },
                    { id: "channel_preference", label: "Preferred reminder channel:", type: "select", options: ["Email", "Text Message", "Both"], required: true },
                    { id: "cancellation_notice_hours", label: "Minimum required cancellation notice (hours):", type: "number", required: true, defaultValue: 24 }
                ]
            },
            {
                title: "Acknowledgement & Consent",
                fields: [
                    {
                        id: "reminder_policy_text",
                        type: "instructions",
                        label: "E-reminder HIPAA Notice",
                        text: "Appointment reminders contain Protected Health Information (PHI) under HIPAA. Sending via unencrypted email or SMS text message involves some security risks. By signing below, you authorize us to send reminders using your preferred contact options."
                    },
                    { id: "client_name", label: "Client Name", type: "text", required: true, prefill: "name" },
                    { id: "phone_number", label: "Mobile Number for SMS Reminders", type: "tel", prefill: "phone" },
                    { id: "email_address", label: "Email Address for Reminders", type: "email", prefill: "email" },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    release_information: {
        id: "release_information",
        title: "Permission to Release Confidential Information",
        description: "Official HIPAA-compliant release authorization to obtain or disclose record details to external parties.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Release Parties",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "client_dob", label: "Client DOB", type: "date", required: true },
                    { id: "release_direction", label: "Select disclosure flow direction:", type: "select", options: ["Obtain records from", "Disclose records to", "Both obtain and disclose"], required: true },
                    { id: "recipient_name", label: "Target Organization or Professional Name", type: "text", required: true },
                    { id: "recipient_phone", label: "Phone Number of Party", type: "tel" },
                    { id: "recipient_address", label: "Address of Party", type: "text" }
                ]
            },
            {
                title: "Release Scope",
                fields: [
                    {
                        id: "release_items",
                        label: "Check all clinical information permitted for disclosure:",
                        type: "checkbox",
                        options: [
                            "Complete treatment record", "Clinical intake assessments", "Psychological testing results",
                            "Billing and financial charts", "Psychiatric medication logs", "Progress notes only"
                        ],
                        required: true
                    },
                    { id: "release_purpose", label: "Purpose of disclosure (e.g. coordination of care, legal, transfer):", type: "text", required: true }
                ]
            },
            {
                title: "HIPAA Authorization Sign-off",
                fields: [
                    {
                        id: "release_terms_text",
                        type: "instructions",
                        label: "Release Terms and Revocation",
                        text: "This authorization is voluntary. You can revoke it in writing at any time. Revocation will not affect information already shared. Unless revoked earlier, this authorization will expire exactly one year from the date of signature."
                    },
                    { id: "agree_release_terms", label: "I authorize the release/exchange of the specified medical information.", type: "radio", options: ["I Authorize", "I Do Not Authorize"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    child_agreement: {
        id: "child_agreement",
        title: "Child & Adolescent Counseling Agreement",
        description: "A collaborative agreement outlining confidentiality parameters and boundaries for minor clients in therapy.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Counseling Boundaries",
                fields: [
                    { id: "child_name", label: "Minor Child/Teen Name", type: "text", required: true },
                    { id: "counselor_name", label: "Counselor Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    {
                        id: "agreement_boundary_text",
                        type: "instructions",
                        label: "Confidentiality Policy for Adolescents",
                        text: "Psychotherapy is most effective when a child feels safe disclosing thoughts without fear of immediate parental reporting. We respect the child's privacy. However, if the counselor believes the child is doing something that presents an imminent safety danger to themselves or others, parents will be informed immediately."
                    }
                ]
            },
            {
                title: "Mutual Agreements",
                fields: [
                    { id: "child_accepts", label: "I (the child/teen) agree to attend sessions and participate in my wellness work.", type: "radio", options: ["I Agree", "I Disagree"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "child_signature", label: "Child/Teen E-Signature:", type: "signature", required: true },
                    { id: "parent_signature", label: "Parent/Guardian E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    dbt_client_agreement: {
        id: "dbt_client_agreement",
        title: "DBT Client Agreement",
        description: "Patient commitment contract for Dialectical Behavior Therapy, detailing individual work, skills groups, and coaching.",
        category: "Therapy Specific",
        timeEstimation: "15 mins",
        pages: [
            {
                title: "DBT Program Modules",
                fields: [
                    {
                        id: "dbt_intro_text",
                        type: "instructions",
                        label: "DBT Core Framework",
                        text: "Dialectical Behavior Therapy (DBT) is structured and requires high commitment. Clients are expected to engage in weekly individual therapy, weekly skills training groups, and daily diary card self-monitoring. Phone coaching is available for skills application."
                    },
                    { id: "dbt_skills_group", label: "I commit to attending the weekly DBT skills group sessions.", type: "radio", options: ["I Commit", "I Do Not Commit"], required: true },
                    { id: "dbt_diary_cards", label: "I commit to completing daily diary cards and sharing them in individual therapy.", type: "radio", options: ["I Commit", "I Do Not Commit"], required: true },
                    { id: "dbt_phone_coaching", label: "I understand the parameters of phone coaching (skills-focused, non-crisis line).", type: "radio", options: ["I Understand", "I Do Not Understand"], required: true }
                ]
            },
            {
                title: "Attendance and Missed Sessions Policies",
                fields: [
                    {
                        id: "dbt_attendance_text",
                        type: "instructions",
                        label: "The 4-Week Rule",
                        text: "In DBT, if you miss four consecutive scheduled sessions of either individual therapy or skills group, you are automatically discharged from the program unless there are verified medical emergencies. Sessions must be cancelled at least 24 hours in advance."
                    },
                    { id: "dbt_program_duration_weeks", label: "Initial program commitment duration (weeks):", type: "number", required: true, defaultValue: 24 },
                    { id: "dbt_agree_attendance", label: "I accept the 24-hour cancellation rule and the 4-week attendance rule.", type: "radio", options: ["I Agree", "I Disagree"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    dbt_therapist_agreement: {
        id: "dbt_therapist_agreement",
        title: "DBT Therapist Agreement",
        description: "Clinician's counterpart agreement committing to program support, consultation, and ethical boundaries.",
        category: "Therapy Specific",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Therapist Code of Conduct",
                fields: [
                    { id: "therapist_name", label: "Therapist Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    {
                        id: "dbt_therapist_commit_text",
                        type: "instructions",
                        label: "Therapist Agreement Terms",
                        text: "I agree to make every reasonable effort to conduct the DBT program as competently as possible. This includes working within the limits of my training, participating in weekly DBT consultation team meetings, respecting the client's autonomy, and providing phone coaching skills support within structured hours."
                    },
                    { id: "team_meetings", label: "I verify that I actively participate in a certified DBT Consultation Team.", type: "radio", options: ["I Verify", "I Do Not Verify"], required: true }
                ]
            },
            {
                title: "Therapist Sign-off",
                fields: [
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Therapist E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    couples_agreement: {
        id: "couples_agreement",
        title: "Couples Therapy Agreement",
        description: "Sets out session guidelines, billing splits, and the clinical 'No Secrets' policy.",
        category: "Therapy Specific",
        timeEstimation: "15 mins",
        pages: [
            {
                title: "The 'No Secrets' Policy",
                fields: [
                    {
                        id: "no_secrets_text",
                        type: "instructions",
                        label: "No Secrets Clinical Policy",
                        text: "In couples therapy, the primary client is the relationship, not either individual partner. Therefore, if either partner shares information in an individual session or email that impacts the relationship, the therapist reserves the right to encourage the partner to disclose it, or to disclose it directly if clinically necessary to prevent collusion."
                    },
                    { id: "partner_a_name", label: "Partner A Full Name", type: "text", required: true },
                    { id: "partner_b_name", label: "Partner B Full Name", type: "text", required: true },
                    { id: "agree_no_secrets", label: "We accept the 'No Secrets' policy as described above.", type: "radio", options: ["We Agree", "We Disagree"], required: true }
                ]
            },
            {
                title: "Session Billing Splits & Sign-off",
                fields: [
                    { id: "billing_responsibility", label: "Select party responsible for session fees:", type: "select", options: ["Split equally 50/50", "Partner A fully responsible", "Partner B fully responsible", "Other arrangement"] },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "partner_a_sig", label: "Partner A E-Signature:", type: "signature", required: true },
                    { id: "partner_b_sig", label: "Partner B E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    drug_testing: {
        id: "drug_testing",
        title: "Drug Testing Consent Form",
        description: "Authorizes the clinic to take urine samples for routine screening checks.",
        category: "Consent",
        timeEstimation: "5 mins",
        pages: [
            {
                title: "Testing Authorization",
                fields: [
                    { id: "clinic_name", label: "Practice/Therapist Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    {
                        id: "testing_consent_terms",
                        type: "instructions",
                        label: "Urine Sample Screening Consent",
                        text: "I hereby authorize the practice/therapist named above to collect urine samples from me for evidence of drug and drug metabolite presence. I understand that these screenings are conducted as part of my ongoing substance use treatment and treatment compliance program."
                    },
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "agree_testing", label: "I authorize testing collections under these terms.", type: "radio", options: ["I Authorize", "I Do Not Authorize"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    exposure_therapy: {
        id: "exposure_therapy",
        title: "Consent for Treatment Using Exposure Therapy",
        description: "Specialized clinical consent outlining exposure tasks, temporary anxiety spikes, and out-of-office guidelines.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Exposure Therapy Risks & Guidelines",
                fields: [
                    {
                        id: "exposure_disclosures",
                        type: "instructions",
                        label: "Exposure Therapy Information",
                        text: "Exposure therapy is designed to help you confront situations, objects, or memories you avoid due to fear. You will experience temporary spikes in anxiety during exposure tasks. These spikes are expected and constitute a critical mechanism of habituation and cognitive restructuring. You retain the right to suspend any exposure task at any time."
                    },
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "agree_exposure", label: "I understand the risks and agree to participate in exposure therapy.", type: "radio", options: ["I Consent", "I Do Not Consent"], required: true }
                ]
            },
            {
                title: "Out-of-Office Sessions & Sign-off",
                fields: [
                    {
                        id: "outofoffice_terms",
                        type: "instructions",
                        label: "Public and Out-of-Office Settings",
                        text: "Some exposure protocols are best conducted in real-world settings outside the office (e.g. elevators, public transit, crowds). While in public settings, the therapist will maintain absolute professionalism, though third parties might notice our presence. The same confidentiality protections apply."
                    },
                    { id: "agree_outofoffice", label: "I consent to out-of-office exposure sessions when clinically indicated.", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    unencrypted_comms: {
        id: "unencrypted_comms",
        title: "Authorization to Use Unencrypted Email and Text",
        description: "Informed consent allowing communication via standard, unencrypted SMS text and email channels.",
        category: "Consent",
        timeEstimation: "5 mins",
        pages: [
            {
                title: "Security Risk Disclosures",
                fields: [
                    {
                        id: "unencrypted_risks_text",
                        type: "instructions",
                        label: "Unencrypted Communication Risks",
                        text: "Standard email and SMS text messaging services are not encrypted. This means they are not secure. Information sent via these channels could be intercepted by third parties, misdirected to incorrect addresses, or visible on device lockscreens. Do not send highly sensitive clinical details via text or email."
                    },
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "authorized_channels", label: "Select channels authorized for unencrypted coordination:", type: "checkbox", options: ["Email", "Text Messages (SMS)"], required: true },
                    { id: "client_email", label: "Client Email Address", type: "email", prefill: "email" },
                    { id: "client_phone", label: "Client Mobile Number", type: "tel", prefill: "phone" }
                ]
            },
            {
                title: "Acknowledgment & Sign-off",
                fields: [
                    { id: "agree_comms_terms", label: "I understand the security risks and authorize standard unencrypted messaging.", type: "radio", options: ["I Authorize", "I Do Not Authorize"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    recurring_card: {
        id: "recurring_card",
        title: "Authorization for Recurring Credit Card Charges",
        description: "Authorizes card billing for co-pays, sessions, and late-cancellation/no-show fees.",
        category: "Consent",
        timeEstimation: "5 mins",
        pages: [
            {
                title: "Cardholder Details",
                fields: [
                    { id: "cardholder_name", label: "Cardholder Name (as printed on card)", type: "text", required: true },
                    { id: "billing_zip", label: "Billing Zip Code", type: "text", required: true },
                    { id: "card_type", label: "Card Type", type: "select", options: ["Visa", "Mastercard", "American Express", "Discover"], required: true },
                    { id: "last_four_digits", label: "Last 4 Digits of Card Number", type: "text", required: true, placeholder: "e.g. 4321" }
                ]
            },
            {
                title: "Billing Authorization Terms",
                fields: [
                    {
                        id: "card_terms_text",
                        type: "instructions",
                        label: "Recurring Charges Agreement",
                        text: "For convenience, you authorize recurring charges to your credit card to pay for session fees and co-pays. Charges occur on the day of the appointment. Late-cancellation fees ($100 default) and no-show fees are billed automatically under these same terms if less than 24 hours notice is given."
                    },
                    { id: "session_fee_amount", label: "Authorized Standard Session Fee ($)", type: "number", required: true, defaultValue: 150 },
                    { id: "agree_recurring_charges", label: "I authorize recurring card charges for clinical fees.", type: "radio", options: ["I Authorize", "I Do Not Authorize"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Cardholder E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    sliding_scale: {
        id: "sliding_scale",
        title: "Sliding Scale Fee Agreement",
        description: "Financial agreement adjusting standard session fees based on verified income and dependency metrics.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Financial Assessment",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "has_insurance", label: "Do you certify that you lack health insurance coverage for these services?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "annual_income", label: "Gross Annual Household Income ($)", type: "number", required: true },
                    { id: "num_dependents", label: "Number of dependents supported by this income:", type: "number", required: true }
                ]
            },
            {
                title: "Fee Adjustments & Sign-off",
                fields: [
                    { id: "standard_fee", label: "Standard Practice Fee ($)", type: "number", required: true, defaultValue: 150 },
                    { id: "adjusted_fee", label: "Agreed Adjusted Hourly Session Fee ($)", type: "number", required: true },
                    { id: "review_date", label: "Date of next financial assessment review:", type: "date", required: true },
                    { id: "agree_scale", label: "I agree to pay the adjusted fee for sessions.", type: "radio", options: ["I Agree", "I Disagree"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true },
                    { id: "therapist_signature", label: "Therapist E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    good_faith_estimate: {
        id: "good_faith_estimate",
        title: "Good Faith Estimate for Mental Health Services",
        description: "No Surprises Act cost transparency estimate for expected services across a 12-month period.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Client & Estimate Details",
                fields: [
                    { id: "client_name", label: "Client Name", type: "text", required: true, prefill: "name" },
                    { id: "client_dob", label: "Client DOB", type: "date", required: true },
                    { id: "primary_diagnosis", label: "Primary DSM-5-TR Diagnostic consideration:", type: "text", defaultValue: "Major Depressive Disorder" },
                    { id: "session_frequency_desc", label: "Expected frequency of sessions (e.g. weekly, biweekly):", type: "text", required: true, defaultValue: "Weekly" },
                    { id: "cost_per_session", label: "Expected rate cost per session ($):", type: "number", required: true, defaultValue: 150 }
                ]
            },
            {
                title: "Yearly Projection & Sign-off",
                fields: [
                    { id: "estimated_weeks_count", label: "Estimated number of sessions in a 12-month period:", type: "number", required: true, defaultValue: 40 },
                    { id: "calculated_yearly_max", label: "Calculated maximum estimated cost for 12 months ($):", type: "number", required: true, defaultValue: 6000 },
                    {
                        id: "estimate_notices",
                        type: "instructions",
                        label: "No Surprises Act Disclaimer",
                        text: "This Good Faith Estimate shows the costs of services that are reasonably expected for your health care needs. It is based on information known at the time. The estimate does not include unexpected costs. You have the right to initiate a dispute resolution if actual bills exceed this estimate by $400 or more."
                    },
                    { id: "provider_name", label: "Provider Name & Title", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client Acknowledgment Signature (Received Estimate):", type: "signature", required: true }
                ]
            }
        ]
    },

    phi_restriction: {
        id: "phi_restriction",
        title: "Request for Restriction on Use/Disclosure of PHI",
        description: "Enables clients to request specific restrictions on how their Protected Health Information (PHI) is disclosed to specific third parties.",
        category: "Consent",
        timeEstimation: "5 mins",
        pages: [
            {
                title: "Disclosure Restrictions",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "client_dob", label: "Client DOB", type: "date", required: true },
                    { id: "restricted_parties", label: "Provide the names of persons/organizations to be restricted from use/disclosure:", type: "textarea", required: true, placeholder: "e.g. Spouse (name), Insurance provider (name), Family members..." },
                    { id: "restricted_info", label: "Describe the specific information to be restricted (e.g. mental health diagnosis, session notes, billing):", type: "textarea", required: true }
                ]
            },
            {
                title: "Office Acceptance & Sign-off",
                fields: [
                    {
                        id: "restriction_disclaimers",
                        type: "instructions",
                        label: "PHI Restriction Notice",
                        text: "Under HIPAA, the practice is not required to agree to all requested restrictions, except in cases where the disclosure is for payment/healthcare operations and is paid out of pocket. If the practice does agree to a restriction, it is bound by the agreement unless in emergency treatment situations."
                    },
                    { id: "clinic_accepts", label: "Office Decision:", type: "select", options: ["Accepted", "Denied", "Accepted with modifications"], required: true },
                    { id: "clinic_modifications", label: "If accepted with modifications, list details:", type: "textarea", condition: { field: "clinic_accepts", value: "Accepted with modifications" } },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true },
                    { id: "therapist_signature", label: "Therapist/Privacy Officer E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    office_policies: {
        id: "office_policies",
        title: "General Office Policies",
        description: "Standard disclosure document detailing session duration, payment requirements, phone coordination, and termination guidelines.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Office Guidelines & Fees",
                fields: [
                    {
                        id: "office_guideline_terms",
                        type: "instructions",
                        label: "Clinic Regulations",
                        text: "All payments, including co-pays, are due at the time of the session. Standard clinical sessions are 50 minutes. Brief phone calls (under 10 minutes) are not billed; phone consultations exceeding 10 minutes are billed pro-rata based on the hourly rate. Regular attendance is key to therapeutic restructuring success."
                    },
                    { id: "session_duration_mins", label: "Standard Session Duration (minutes):", type: "number", required: true, defaultValue: 50 },
                    { id: "late_cancel_fee", label: "Late Cancellation Fee ($):", type: "number", required: true, defaultValue: 100 },
                    { id: "cancellation_notice_hours", label: "Minimum required cancellation notice (hours):", type: "number", required: true, defaultValue: 24 }
                ]
            },
            {
                title: "Client Agreement & Sign-off",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "agree_office_policies", label: "I accept the session, payment, and cancellation policies of this office.", type: "radio", options: ["I Agree", "I Disagree"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    telehealth_consent: {
        id: "telehealth_consent",
        title: "Informed Consent for Telehealth Services",
        description: "Consent release detailing benefits, privacy security measures, technology backup plans, and risks of remote psychotherapy.",
        category: "Telehealth",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Telehealth Coordination Details",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "client_dob", label: "Client DOB", type: "date", required: true },
                    { id: "telehealth_phone", label: "Telephone number where telehealth occurs:", type: "tel", required: true, prefill: "phone" },
                    { id: "client_location_address", label: "Physical address where you will be located during remote sessions:", type: "text", required: true }
                ]
            },
            {
                title: "Telehealth Acknowledgements",
                fields: [
                    {
                        id: "telehealth_rules_text",
                        type: "instructions",
                        label: "Telehealth Standard Disclosures",
                        text: "1. I have the right to withhold or withdraw consent to telehealth at any time without affecting my right to future care. 2. I agree to use a secure, private room to maintain confidentiality. 3. Technology failures will be managed by transitioning immediately to a standard telephone call or rescheduled if phone is unavailable."
                    },
                    {
                        id: "telehealth_acknowledgements_list",
                        label: "Confirm acknowledgements:",
                        type: "checkbox",
                        options: [
                            "I have the right to withdraw consent at any time",
                            "I understand that records will be kept under standard EHR privacy",
                            "I accept the technology backup plan (phone switch)",
                            "I agree to secure a private, distraction-free setting"
                        ],
                        required: true
                    }
                ]
            },
            {
                title: "Telehealth Sign-off",
                fields: [
                    { id: "agree_telehealth", label: "I consent to receive remote behavioral health services under these terms.", type: "radio", options: ["I Consent", "I Do Not Consent"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    telehealth_safety: {
        id: "telehealth_safety",
        title: "Telehealth Safety Risks and Planning",
        description: "Co-created safety coordination plan detailing local hospital resources, emergency contacts, and coping plans.",
        category: "Telehealth",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Local Emergency Resources",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "local_crisis_hotline", label: "Local Crisis Hotline Phone Number:", type: "tel", required: true, defaultValue: "988" },
                    { id: "local_hospital_name", label: "Nearest Emergency Hospital Name:", type: "text", required: true },
                    { id: "local_hospital_address", label: "Hospital Address:", type: "text", required: true },
                    { id: "emergency_contact_name", label: "Emergency Contact Person (Full Name):", type: "text", required: true },
                    { id: "emergency_contact_phone", label: "Emergency Contact Phone Number:", type: "tel", required: true }
                ]
            },
            {
                title: "Safety Coping & Planning",
                fields: [
                    { id: "distress_coping_steps", label: "List coping strategies you will practice before contacting emergency resources (e.g. box breathing, journaling):", type: "textarea", required: true },
                    { id: "triggers_to_manage", label: "List primary triggers or distress signals we should monitor during sessions:", type: "textarea" },
                    { id: "agree_safety_plan", label: "I commit to following this safety plan in the event of an acute psychiatric crisis during remote care.", type: "radio", options: ["I Commit", "I Do Not Commit"], required: true }
                ]
            },
            {
                title: "Safety Plan Sign-off",
                fields: [
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true },
                    { id: "therapist_signature", label: "Therapist E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    telehealth_emergency: {
        id: "telehealth_emergency",
        title: "Telehealth Emergency Plan",
        description: "Formal emergency protocol for tech failures and physical/psychiatric safety validation.",
        category: "Telehealth",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Emergency Coordination Details",
                fields: [
                    { id: "client_name", label: "Client Name", type: "text", required: true, prefill: "name" },
                    { id: "primary_session_address", label: "Verify primary physical address where remote sessions occur:", type: "text", required: true },
                    { id: "local_responders_direct_line", label: "Local emergency responder direct phone line (if not 911):", type: "tel" },
                    { id: "backup_safety_person", label: "Backup contact person who can check on you in an emergency:", type: "text", required: true },
                    { id: "backup_safety_phone", label: "Backup contact person's phone number:", type: "tel", required: true }
                ]
            },
            {
                title: "Technology Failure Plan",
                fields: [
                    {
                        id: "tech_failure_rules",
                        type: "instructions",
                        label: "Technology Backup Guidelines",
                        text: "In case of technological video failure, the therapist will contact you using your telephone number. In case of telephone line failure, without safety concerns, communication will proceed via secure text messaging or email to reschedule the session."
                    },
                    { id: "agree_tech_failure_plan", label: "I accept the technology failure guidelines and backup emergency procedures.", type: "radio", options: ["I Agree", "I Disagree"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    telehealth_group_agreement: {
        id: "telehealth_group_agreement",
        title: "Telehealth Group Counseling Agreement",
        description: "Confidentiality parameters and interaction guidelines for remote group therapy participants.",
        category: "Telehealth",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Group Privacy Rules",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    {
                        id: "group_rules_text",
                        type: "instructions",
                        label: "Rules of Engagement",
                        text: "Remote group therapy requires absolute confidentiality. You must participate from a private, closed room where others cannot hear the group audio. Recording sessions is strictly prohibited. Headphones are highly recommended. You must keep your camera turned on to verify identity and active participation."
                    },
                    {
                        id: "group_agreements_list",
                        label: "Check to confirm agreements:",
                        type: "checkbox",
                        options: [
                            "I will participate from a private, closed room only",
                            "I will not record any portion of the group sessions",
                            "I will keep my camera turned on throughout the session",
                            "I will use headphones to prevent audio leakage",
                            "I will respect all other group members' privacy"
                        ],
                        required: true
                    }
                ]
            },
            {
                title: "Group Sign-off",
                fields: [
                    { id: "agree_group_terms", label: "I agree to all group guidelines and confidentiality terms.", type: "radio", options: ["I Agree", "I Disagree"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    group_therapy_consent: {
        id: "group_therapy_consent",
        title: "Informed Consent for Group Therapy Services",
        description: "Consent release detailing scheduling, fees, clinical processes, risks, and confidentiality rules in a group setting.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Appointments & Fees",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "practice_name", label: "Therapist/Practice Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "group_start_date", label: "Group Session Start Date", type: "date", required: true },
                    { id: "group_end_date", label: "Group Session End Date", type: "date", required: true },
                    { id: "group_day_of_week", label: "Day of Week", type: "text", required: true, placeholder: "e.g. Wednesday" },
                    { id: "group_time", label: "Session Time", type: "text", required: true, placeholder: "e.g. 5:00 PM" },
                    { id: "group_duration_mins", label: "Session Duration (Minutes)", type: "number", required: true, defaultValue: 90 },
                    { id: "group_fee_per_session", label: "Group Fee per Session ($)", type: "number", required: true, defaultValue: 50 },
                    { id: "insurance_options", label: "Insurance Acceptance:", type: "select", options: ["Does not accept insurance", "Accepts insurance policies"], required: true },
                    { id: "accepted_insurance_list", label: "If insurance accepted, list policies:", type: "text", condition: { field: "insurance_options", value: "Accepts insurance policies" } }
                ]
            },
            {
                title: "Group Terms & Sign-off",
                fields: [
                    {
                        id: "group_consent_terms",
                        type: "instructions",
                        label: "Group Service Agreement",
                        text: "Group therapy is designed to help members communicate and share experiences. While it offers therapeutic benefits, it also carries emotional risks. Each member must commit to regular attendance and strict confidentiality regarding group discussions. The practice cannot guarantee that all members will maintain privacy."
                    },
                    { id: "agree_group_consent", label: "I consent to receive group therapy services and accept the fee/scheduling policies.", type: "radio", options: ["I Consent", "I Do Not Consent"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    send_mail_permission: {
        id: "send_mail_permission",
        title: "Permission to Send Mail",
        description: "Authorizes the therapist or clinic to send postal mail to a home or alternate address.",
        category: "Consent",
        timeEstimation: "5 mins",
        pages: [
            {
                title: "Mailing Options",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "therapist_name", label: "Therapist/Practice Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "home_mail_permitted", label: "Do you permit the therapist/practice to send mail to your home address?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "use_alternate_address", label: "Would you prefer mail sent to an alternate address instead?", type: "radio", options: ["Yes", "No"], required: true }
                ]
            },
            {
                title: "Alternate Address Details",
                fields: [
                    { id: "alternate_in_care_of", label: "Name of business or person mail should be sent 'in care of' (if any):", type: "text", condition: { field: "use_alternate_address", value: "Yes" } },
                    { id: "alternate_street", label: "Street Address (including apt or suite number):", type: "text", required: true, condition: { field: "use_alternate_address", value: "Yes" } },
                    { id: "alternate_city_state_zip", label: "City, State, Zip Code:", type: "text", required: true, condition: { field: "use_alternate_address", value: "Yes" } },
                    { id: "include_name_in_address", label: "Should your name appear in the address?", type: "radio", options: ["Yes", "No"], required: true, condition: { field: "use_alternate_address", value: "Yes" } }
                ]
            },
            {
                title: "Authorization Sign-off",
                fields: [
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    intern_treatment_consent: {
        id: "intern_treatment_consent",
        title: "Treatment by Intern Informed Consent",
        description: "Consent and release for receiving therapy services from a supervised student intern, including session recording rules.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Internship Details",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "student_intern_name", label: "Student Intern Name:", type: "text", required: true },
                    { id: "supervisor_name", label: "Clinical Supervisor Name:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "supervisor_credentials", label: "Supervisor Credentials:", type: "text", required: true, defaultValue: "PsyD, Licensed Psychologist" },
                    { id: "clinic_agency_name", label: "Clinic/Agency Name:", type: "text", required: true, defaultValue: "PsyPyrus Clinical Center" },
                    { id: "revocation_mail_address", label: "Mailing address for written revocation of this consent:", type: "text", required: true, defaultValue: "123 Therapy Way, Suite A, clinical@psypyrus.org" }
                ]
            },
            {
                title: "Recording & Supervision Agreement",
                fields: [
                    {
                        id: "intern_recording_terms",
                        type: "instructions",
                        label: "Recording Policies",
                        text: "To provide the best care, student interns are required to record client sessions for use in supervision. All digital audio, video, and photograph creations are stored on password-protected devices or locked files and are destroyed upon termination of therapy. Revoking consent to record requires transfer to another clinician, as interns cannot be supervised without recordings."
                    },
                    { id: "agree_intern_recording", label: "I consent to treatment by the intern and the use of audio/video recordings in clinical supervision.", type: "radio", options: ["I Consent", "I Do Not Consent"], required: true },
                    { id: "legal_guardian_relationship", label: "Relationship to client (leave blank if self):", type: "text" },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client/Guardian E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    release_family: {
        id: "release_family",
        title: "Release of Confidential Info to Family Members",
        description: "Authorizes the clinic or therapist to exchange Protected Health Information (PHI) with family members to facilitate treatment.",
        category: "Permissions",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Client Information & Clinic",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "client_dob", label: "Client Date of Birth", type: "date", required: true },
                    { id: "clinic_therapist_name", label: "Clinic or Therapist Name:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" }
                ]
            },
            {
                title: "Information to Disclose",
                fields: [
                    {
                        id: "info_to_disclose_list",
                        label: "Select information to be released/obtained:",
                        type: "checkbox",
                        options: [
                            "Names of professionals",
                            "Treatment plan",
                            "Admission and/or discharge information",
                            "Psychological evaluations",
                            "Medications",
                            "Treatment notes/summary",
                            "Other"
                        ],
                        required: true
                    },
                    { id: "other_info_description", label: "If Other, describe specific details:", type: "textarea", condition: { field: "info_to_disclose_list", value: "Other" } }
                ]
            },
            {
                title: "Family Recipients",
                fields: [
                    { id: "recipient_1_name", label: "Family Member 1 Name:", type: "text", required: true },
                    { id: "recipient_1_relation", label: "Relationship to Client:", type: "text", required: true },
                    { id: "recipient_1_phone", label: "Phone Number:", type: "tel", required: true },
                    { id: "recipient_2_name", label: "Family Member 2 Name (Optional):", type: "text" },
                    { id: "recipient_2_relation", label: "Relationship to Client (Optional):", type: "text" },
                    { id: "recipient_2_phone", label: "Phone Number (Optional):", type: "tel" }
                ]
            },
            {
                title: "Expiration & Sign-off",
                fields: [
                    { id: "custom_expiration_enabled", label: "Specify an alternative expiration date instead of the standard 90 days?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "alternative_expiration_date", label: "Alternative Expiration Date:", type: "date", condition: { field: "custom_expiration_enabled", value: "Yes" } },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    release_professionals: {
        id: "release_professionals",
        title: "Release of Confidential Info to Professionals",
        description: "Form authorizing the disclosure of clinical documents and records to outside healthcare professionals.",
        category: "Permissions",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Client & Practice Information",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "client_dob", label: "Client Date of Birth", type: "date", required: true },
                    { id: "practice_therapist_name", label: "Practice/Therapist Name:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" }
                ]
            },
            {
                title: "Disclosure Details",
                fields: [
                    { id: "document_to_release", label: "Name of document/records to disclose (e.g. Diagnostic Evaluation, Treatment Summary):", type: "text", required: true },
                    { id: "recipient_professional_name", label: "Name of Outside Recipient (Professional/Clinic):", type: "text", required: true },
                    { id: "purpose_of_disclosure", label: "Purpose of disclosure (e.g. coordination of care, legal, referral):", type: "text", required: true },
                    { id: "expiration_date", label: "Date of agreed expiration (standard is 90 days):", type: "date", required: true }
                ]
            },
            {
                title: "Authorization Sign-off",
                fields: [
                    { id: "signed_by_other", label: "Is this form being signed by a parent/guardian/legal representative?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "representative_relationship", label: "If yes, specify relationship to client:", type: "text", condition: { field: "signed_by_other", value: "Yes" } },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client/Guardian E-Signature:", type: "signature", required: true },
                    { id: "witness_needed", label: "Is client physically unable to sign (requiring witness verification)?", type: "radio", options: ["Yes", "No"], required: true },
                    { id: "witness_name", label: "Witness Printed Name:", type: "text", condition: { field: "witness_needed", value: "Yes" } },
                    { id: "witness_signature", label: "Witness E-Signature:", type: "signature", condition: { field: "witness_needed", value: "Yes" } }
                ]
            }
        ]
    },

    payment_policies: {
        id: "payment_policies",
        title: "Payment Policies",
        description: "General payment terms, returned check fees, cancellation penalties, and professional gift guidelines.",
        category: "Policies",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Payment Terms",
                fields: [
                    {
                        id: "payment_rules_text",
                        type: "instructions",
                        label: "Clinic Financial Rules",
                        text: "All session fees and co-pays are due at the time of appointment. Bartering for therapeutic services is strictly prohibited. Returned checks incur a penalty fee. Unexcused late cancellations require payment of the full session rate."
                    },
                    { id: "practice_name", label: "Therapist/Practice Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "returned_check_fee", label: "Insufficient Funds Returned Check Fee ($):", type: "number", required: true, defaultValue: 35 },
                    { id: "cancellation_notice_hours", label: "Minimum required cancellation notice (hours):", type: "number", required: true, defaultValue: 24 }
                ]
            },
            {
                title: "Client Agreement & Sign-off",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "agree_payment_policies", label: "I have read, understand, and agree to the payment policies.", type: "radio", options: ["I Agree", "I Disagree"], required: true },
                    { id: "policies_effective_date", label: "Policies Effective Date:", type: "date", required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    appointment_policy: {
        id: "appointment_policy",
        title: "Appointment Policy",
        description: "Official office attendance, scheduling phone, late check-in guidelines, and session booking protocols.",
        category: "Policies",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Scheduling & Attendance",
                fields: [
                    { id: "practice_name", label: "Clinician/Practice Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "scheduling_phone", label: "Phone number for booking and cancellations:", type: "tel", required: true, defaultValue: "555-0199" },
                    { id: "cancellation_limit_hours", label: "Cancellation window to avoid fees (hours):", type: "number", required: true, defaultValue: 24 }
                ]
            },
            {
                title: "Policy & Sign-off",
                fields: [
                    {
                        id: "appt_policy_rules",
                        type: "instructions",
                        label: "Attendance Guidelines",
                        text: "Continuity of care is vital to success. Frequent cancellations or failures to schedule appointments impede progress. If you are late, your session will still end at the scheduled time. Cancelling or failing to show for two consecutive appointments may result in the loss of your scheduled recurring slot."
                    },
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "agree_appointment_policy", label: "I have read, understand, and agree to the appointment policy terms.", type: "radio", options: ["I Agree", "I Disagree"], required: true },
                    { id: "therapist_name", label: "Therapist Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    financial_policy: {
        id: "financial_policy",
        title: "Financial Policy",
        description: "Agreement detailing insurance claim filings, out-of-pocket duties, and non-payment collection terms.",
        category: "Policies",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Insurance & Services",
                fields: [
                    { id: "practice_name", label: "Therapist/Practice Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "insurance_company", label: "Client's Insurance Company Name:", type: "text", required: true, defaultValue: "Blue Cross Blue Shield" }
                ]
            },
            {
                title: "Policy Agreement",
                fields: [
                    {
                        id: "financial_policy_terms",
                        type: "instructions",
                        label: "Financial Responsibilities",
                        text: "1. Session fees are based on a clinical hour (45-50 minutes). 2. Failures to cancel with a 24-hour notice will result in out-of-pocket charges. 3. Late arrivals do not extend session times. 4. Administrative services like phone calls, record reviews, and emails are billed per quarter hour. 5. The client remains responsible for payment if insurance claims are declined."
                    },
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "agree_financial_policy", label: "I authorize benefits payments and accept the financial terms outlined above.", type: "radio", options: ["I Agree", "I Disagree"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    client_rights: {
        id: "client_rights",
        title: "Client Rights & Expectations",
        description: "Outlines standard healthcare client rights, confidentiality exceptions, and behavioral treatment expectations.",
        category: "Policies",
        timeEstimation: "15 mins",
        pages: [
            {
                title: "Client Rights",
                fields: [
                    { id: "therapist_name", label: "Therapist Name:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    {
                        id: "rights_list",
                        type: "instructions",
                        label: "Your Rights as a Client",
                        text: "You have the right to: active participation in treatment decisions, receive a clear explanation of financial policies, express grievances, terminate treatment or switch providers, be treated courteously and free of bias regarding age, gender, race, religion, or sexual preference, and expect absolute confidentiality in all treatment files."
                    },
                    { id: "is_substance_abuse", label: "Are you seeking treatment for substance use/abuse issues?", type: "radio", options: ["Yes", "No"], required: true }
                ]
            },
            {
                title: "Substance Use Expectations",
                fields: [
                    {
                        id: "substance_rights_text",
                        type: "instructions",
                        label: "Rights and Guidelines (Substance Use)",
                        text: "Substance abuse clients have the right to seek voluntary treatment with individual privacy. Expectations include consistent attendance, active motivation to change, and remaining drug/alcohol free or adhering to a responsible drinking plan. Abuse can be reported to the appropriate licensing and state oversight board.",
                        condition: { field: "is_substance_abuse", value: "Yes" }
                    },
                    { id: "abuse_reporting_org", label: "Abuse Reporting Board Organization Name:", type: "text", required: true, defaultValue: "Department of Children & Families", condition: { field: "is_substance_abuse", value: "Yes" } },
                    { id: "abuse_reporting_phone", label: "Abuse Reporting Board Phone Number:", type: "tel", required: true, defaultValue: "1-800-96-ABUSE", condition: { field: "is_substance_abuse", value: "Yes" } }
                ]
            },
            {
                title: "Client Sign-off",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "agree_rights", label: "I acknowledge and understand my rights and treatment expectations.", type: "radio", options: ["I Agree", "I Disagree"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    receipt_privacy_practices: {
        id: "receipt_privacy_practices",
        title: "Receipt of Notice of Privacy Practices",
        description: "Official client acknowledgment of receiving the practice's Notice of Privacy Practices (NOPP).",
        category: "Consent",
        timeEstimation: "5 mins",
        pages: [
            {
                title: "Client Acknowledgment",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "practice_name", label: "Therapist/Practice Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "complaint_contact", label: "Contact for questions or privacy complaints:", type: "text", required: true, defaultValue: "Privacy Officer, clinical@psypyrus.org" },
                    { id: "signed_by_other", label: "Is this form signed by a parent, guardian, or legal representative?", type: "radio", options: ["Yes", "No"], required: true }
                ]
            },
            {
                title: "Representative Sign-off",
                fields: [
                    { id: "representative_relationship", label: "Relationship to Client (e.g. Father, Legal Guardian):", type: "text", required: true, condition: { field: "signed_by_other", value: "Yes" } },
                    { id: "alternative_signature_action", label: "Action taken to obtain legal signature (if representative signed):", type: "select", options: ["Given in person to signee", "Sent via U.S. Mail", "Advised person that policy is available on website", "None"], required: true, condition: { field: "signed_by_other", value: "Yes" } },
                    { id: "website_policy_url", label: "Practice Website Policy URL:", type: "text", condition: { field: "alternative_signature_action", value: "Advised person that policy is available on website" } },
                    { id: "return_address", label: "Address to return signed copies to:", type: "text", required: true, defaultValue: "123 Therapy Way, Suite A" }
                ]
            },
            {
                title: "Acknowledgement Sign-off",
                fields: [
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Signature of Acknowledging Party:", type: "signature", required: true }
                ]
            },
            {
                title: "Clinician Exception Log",
                fields: [
                    { id: "clinician_good_faith_failed", label: "Clinician: Were you unable to obtain written acknowledgement after a good faith effort?", type: "radio", options: ["No - Client signed", "Yes - Client declined to sign", "Yes - Other reason"], required: true },
                    { id: "clinician_failed_reason", label: "If failed, list reason (e.g. communication barrier, emergency care needed):", type: "textarea", condition: { field: "clinician_good_faith_failed", value: "Yes - Other reason" } },
                    { id: "therapist_name", label: "Therapist Printed Name & Title:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "therapist_signature_date", label: "Date:", type: "date", required: true },
                    { id: "therapist_signature", label: "Therapist E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    electronic_comms_policy: {
        id: "electronic_comms_policy",
        title: "Electronic Communication Policy",
        description: "Official policy on client and therapist electronic exchanges, social media borders, and search engine parameters.",
        category: "Policies",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Email, Text & Social Media",
                fields: [
                    {
                        id: "comms_policy_rules",
                        type: "instructions",
                        label: "Electronic Borders",
                        text: "1. Email and text must be limited to administrative topics (scheduling, billing). Do not text/email clinical details as these are not secure. 2. Clinicians do not establish online social relationships with clients (e.g. Facebook, Twitter) to avoid boundary violations. 3. Clinicians do not search for client information online without explicit consent, respecting client privacy."
                    },
                    { id: "practice_website", label: "Practice Website Address:", type: "text", required: true, defaultValue: "www.psypyrus.org" }
                ]
            },
            {
                title: "Agreement & Sign-off",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "agree_comms_policy", label: "I agree to abide by the terms of the Electronic Communication Policy.", type: "radio", options: ["I Agree", "I Disagree"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    hipaa_checklist: {
        id: "hipaa_checklist",
        title: "HIPAA Compliance Checklist",
        description: "Compliance reference checklist for practice administrators and HIPAA Privacy Officers.",
        category: "Policies",
        timeEstimation: "15 mins",
        pages: [
            {
                title: "Officer & Office Policies",
                fields: [
                    { id: "completed_by", label: "Checklist Completed By:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "privacy_officer_name", label: "Appointed HIPAA Privacy Officer Name:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "security_officer_name", label: "Appointed HIPAA Security Officer Name:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "nopp_posted", label: "Is the Notice of Privacy Practices (NOPP) posted in the office and website?", type: "radio", options: ["Yes", "No"], required: true }
                ]
            },
            {
                title: "Compliance Checklist",
                fields: [
                    {
                        id: "checklist_tasks",
                        label: "Verify completed HIPAA audits:",
                        type: "checkbox",
                        options: [
                            "Post updated NOPP in office and website",
                            "Review state-specific privacy laws exceeding federal rules",
                            "Make sure all HIPAA templates exist (Email consent, BAAs, Breach logs)",
                            "Perform risk assessment of electronic devices with PHI",
                            "Establish disaster recovery and clinician contingency plan",
                            "Activate full-disk encryption and strong passwords on devices",
                            "Sign BAAs with all cloud, billing, and IT vendors"
                        ],
                        required: true
                    },
                    { id: "completion_date", label: "Audited Date:", type: "date", required: true },
                    { id: "signature", label: "Privacy Officer Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    hipaa_privacy_notice: {
        id: "hipaa_privacy_notice",
        title: "HIPAA Compliance Privacy Notice",
        description: "Standard disclosure on client rights, practice duties, and legal disclosures of Protected Health Information (PHI).",
        category: "Policies",
        timeEstimation: "20 mins",
        pages: [
            {
                title: "Practice Details",
                fields: [
                    { id: "practice_name", label: "Therapist/Practice Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "practice_address", label: "Practice Physical Address:", type: "text", required: true, defaultValue: "123 Therapy Way, Suite A" },
                    { id: "practice_phone", label: "Practice Phone Number:", type: "tel", required: true, defaultValue: "555-0199" },
                    { id: "practice_email", label: "Practice Email:", type: "email", required: true, defaultValue: "clinical@psypyrus.org" },
                    { id: "privacy_officer_info", label: "Privacy Officer Name & Contact:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, Privacy Officer" }
                ]
            },
            {
                title: "HIPAA Disclosures",
                fields: [
                    {
                        id: "hipaa_rights_summary",
                        type: "instructions",
                        label: "Your Health Information Rights",
                        text: "Under HIPAA, you have the right to: 1. Get an electronic or paper copy of your medical record. 2. Request corrections to incomplete records. 3. Request confidential communications. 4. Request restrictions on what we share. 5. Receive a list of parties with whom we have shared your info. 6. File a complaint if you feel your rights are violated. We are required by law to maintain the privacy of your PHI and notify you of any breach."
                    },
                    { id: "effective_date", label: "Notice Effective Date:", type: "date", required: true }
                ]
            },
            {
                title: "Acknowledge Notice",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "acknowledge_nopp", label: "I acknowledge that I have read or received a copy of the HIPAA Privacy Notice.", type: "radio", options: ["I Acknowledge", "I Do Not Acknowledge"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    use_touch_consent: {
        id: "use_touch_consent",
        title: "Consent to Use Touch in Therapy",
        description: "Consent outlining somatic therapy modalities, touch limits, client rights, and emotional reactions.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Somatic Modalities",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    {
                        id: "touch_modalities",
                        label: "Select somatic modalities to be used in therapy:",
                        type: "checkbox",
                        options: [
                            "Yoga Therapy (YT)",
                            "somatic psychology",
                            "Hakomi",
                            "Processwork",
                            "Somatic Experiencing (SE)",
                            "Body Memory Reset Therapy (BMR)",
                            "Other"
                        ],
                        required: true
                    },
                    { id: "other_modality_desc", label: "If Other, specify somatic training (Optional):", type: "text" }
                ]
            },
            {
                title: "Somatic Interventions",
                fields: [
                    {
                        id: "touch_details_rules",
                        type: "instructions",
                        label: "Clinical Touch Guidelines",
                        text: "Touch is a somatic tool to help clients ground and process trauma. Touch is never sexual, shaming, or derogatory. Interventions may include hand/arm contact to reduce anxiety, structural alignment of posture/feet/breath, or holding muscle tension to aid relaxation. Client comfort levels will be verified before and during each session. Consent can be revoked at any time."
                    },
                    { id: "agree_touch", label: "I consent to the use of clinical touch in therapy sessions under these terms.", type: "radio", options: ["I Consent", "I Do Not Consent"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    record_session_consent: {
        id: "record_session_consent",
        title: "Consent to Record Therapy Session",
        description: "Authorizes audio and video recording of therapy sessions for counselor training, peer review, or clinical supervision.",
        category: "Consent",
        timeEstimation: "5 mins",
        pages: [
            {
                title: "Recording Details",
                fields: [
                    { id: "therapist_name", label: "Therapist/Counselor Name:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "recording_medium", label: "Select recording medium authorized:", type: "radio", options: ["Audio only", "Video only", "Both Audio and Video"], required: true },
                    { id: "recording_purpose", label: "Select purpose of recording:", type: "radio", options: ["Therapist reviews counseling techniques", "Clinical supervision and peer review"], required: true },
                    { id: "professional_org", label: "Supervision/Licensing Professional Organization Name:", type: "text", required: true, defaultValue: "American Psychological Association (APA)" }
                ]
            },
            {
                title: "Recording Rules & Sign-off",
                fields: [
                    {
                        id: "recording_rules_text",
                        type: "instructions",
                        label: "Client Protections",
                        text: "1. You can request to turn off the recorder or erase any portion of it at any time. 2. You can revoke this permission at any time. 3. Recorded content remains strictly confidential and shared only inside individual/group supervision. 4. Recordings will be erased after serving their professional purpose."
                    },
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "agree_recording", label: "I consent to have my therapy sessions recorded under these terms.", type: "radio", options: ["I Consent", "I Do Not Consent"], required: true },
                    { id: "signature_date", label: "Signature Date", type: "date", required: true },
                    { id: "signature", label: "Client E-Signature:", type: "signature", required: true },
                    { id: "therapist_signature", label: "Therapist E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    guest_therapy_consent: {
        id: "guest_therapy_consent",
        title: "Guest Therapy Consent",
        description: "Release form allowing a guest/collateral participant to attend client counseling sessions.",
        category: "Consent",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Guest Details",
                fields: [
                    { id: "client_name", label: "Client Full Name", type: "text", required: true, prefill: "name" },
                    { id: "guest_name", label: "Guest/Collateral Participant Full Name:", type: "text", required: true },
                    { id: "practice_therapist_name", label: "Therapist/Practice Name:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "guest_relationship", label: "Relationship of Guest to Client:", type: "text", required: true, placeholder: "e.g. Spouse, Friend, Parent" }
                ]
            },
            {
                title: "Guest Terms & Sign-off",
                fields: [
                    {
                        id: "guest_policy_disclosures",
                        type: "instructions",
                        label: "Clinical Role",
                        text: "The guest/collateral attends sessions to support the client and provide factual perspective. The guest is NOT a client of the practice, and no professional client-therapist relationship is formed with the guest. Session content remains confidential and the guest agrees to maintain absolute privacy. Guest attendance does not grant access to the client's medical records."
                    },
                    { id: "agree_guest_terms", label: "We understand and accept the guest participation rules.", type: "radio", options: ["We Agree", "We Disagree"], required: true },
                    { id: "client_signature_date", label: "Client Signature Date", type: "date", required: true },
                    { id: "client_signature", label: "Client E-Signature:", type: "signature", required: true },
                    { id: "guest_signature_date", label: "Guest Signature Date", type: "date", required: true },
                    { id: "guest_signature", label: "Guest E-Signature:", type: "signature", required: true },
                    { id: "therapist_signature_date", label: "Therapist Signature Date", type: "date", required: true },
                    { id: "therapist_signature", label: "Therapist E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    divorced_parents_policy: {
        id: "divorced_parents_policy",
        title: "Divorced/Unmarried Parents Policy",
        description: "Office treatment policy for minor children experiencing separation, divorce, or custody divisions.",
        category: "Policies",
        timeEstimation: "15 mins",
        pages: [
            {
                title: "Policy Guidelines",
                fields: [
                    { id: "child_name", label: "Minor Child's Full Name:", type: "text", required: true },
                    { id: "therapist_name", label: "Therapist Printed Name:", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    {
                        id: "divorce_policy_rules",
                        type: "instructions",
                        label: "Custody and Treatment Rules",
                        text: "1. The therapist's priority is the child's health. The clinician will not get involved in legal issues or take sides in custody disputes. 2. Clinic staff will not be exposed to parental conflicts. 3. Both parents will be involved in treatment as clinically appropriate. 4. Parents are responsible for communicating with each other regarding appointments and records. 5. Unless a documented court order forbids it, both parents have equal access to records."
                    }
                ]
            },
            {
                title: "Parents Agreement & Sign-off",
                fields: [
                    { id: "parent1_name", label: "Parent 1 Full Name:", type: "text", required: true },
                    { id: "parent1_signature_date", label: "Parent 1 Date:", type: "date", required: true },
                    { id: "parent1_signature", label: "Parent 1 E-Signature:", type: "signature", required: true },
                    { id: "share_custody", label: "Do both parents legally share custody of the child?", type: "radio", options: ["Yes - Joint Custody", "No - Sole Custody/Other"], required: true },
                    { id: "parent2_name", label: "Parent 2 Full Name:", type: "text", condition: { field: "share_custody", value: "Yes - Joint Custody" }, required: true },
                    { id: "parent2_signature_date", label: "Parent 2 Date:", type: "date", condition: { field: "share_custody", value: "Yes - Joint Custody" }, required: true },
                    { id: "parent2_signature", label: "Parent 2 E-Signature:", type: "signature", condition: { field: "share_custody", value: "Yes - Joint Custody" }, required: true },
                    { id: "therapist_signature_date", label: "Therapist Date:", type: "date", required: true },
                    { id: "therapist_signature", label: "Therapist E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    },

    telehealth_checklist: {
        id: "telehealth_checklist",
        title: "Telehealth Session Checklist",
        description: "Internal clinician checklist to prepare and verify remote telehealth session parameters.",
        category: "Telehealth",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Pre-Session Preparation",
                fields: [
                    { id: "therapist_name", label: "Clinician Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "session_date", label: "Session Date", type: "date", required: true },
                    {
                        id: "pre_session_checks",
                        label: "Pre-Session Technical Checklist:",
                        type: "checkbox",
                        options: [
                            "Restart computer and close background apps",
                            "Verify internet speed (minimum 600 Kbps down, 2.5 Mbps for group)",
                            "Test webcam, microphone, and speakers",
                            "Tidy visible background space",
                            "Set phone to silent and post Do Not Disturb sign",
                            "Verify insurance payment authorization if applicable"
                        ],
                        required: true
                    }
                ]
            },
            {
                title: "Session Launch Checklist",
                fields: [
                    {
                        id: "launch_session_checks",
                        label: "Start of Session Verification Checklist:",
                        type: "checkbox",
                        options: [
                            "Verify client's identity and backup telephone number",
                            "Review emergency safety plan and tech failure plan",
                            "Inform client of telehealth risks and non-video options",
                            "Confirm client is in a safe, private, quiet room",
                            "Remind client that note-taking might cause looking away",
                            "Emphasize importance of attendance and home exercises",
                            "Allow client to ask questions about remote care"
                        ],
                        required: true
                    },
                    { id: "session_notes", label: "Checklist / Preparation Notes:", type: "textarea" }
                ]
            }
        ]
    },

    electronic_device_security: {
        id: "electronic_device_security",
        title: "Security Checklist for Electronic Devices",
        description: "Audit questionnaire for clinicians to verify HIPAA device security settings and data maintenance.",
        category: "Policies",
        timeEstimation: "10 mins",
        pages: [
            {
                title: "Device Security Settings",
                fields: [
                    { id: "clinician_name", label: "Clinician/Auditor Name", type: "text", required: true, defaultValue: "Dr. Katherine Brewster, PsyD" },
                    { id: "device_desc", label: "Device Brand & Model (e.g. Macbook Pro, iPhone 13):", type: "text", required: true },
                    {
                        id: "security_settings_checks",
                        label: "Verify device security configurations:",
                        type: "checkbox",
                        options: [
                            "Full-device / full-disk encryption active",
                            "Strong passcode configured (alphanumeric with symbol)",
                            "Daily updated antivirus/anti-malware running",
                            "Active system firewall enabled",
                            "Automatic lockout / screen-saver active after inactivity"
                        ],
                        required: true
                    }
                ]
            },
            {
                title: "Data Sync & Maintenance",
                fields: [
                    {
                        id: "data_maintenance_checks",
                        label: "Verify HIPAA maintenance standards:",
                        type: "checkbox",
                        options: [
                            "Encrypted file backups stored in separate locations",
                            "Operating system updated with latest security patches",
                            "Server syncing (iCloud/Google) disabled or BAA signed",
                            "Separate user account created specifically for therapy practice"
                        ],
                        required: true
                    },
                    { id: "audit_date", label: "Audit Date:", type: "date", required: true },
                    { id: "signature", label: "Clinician E-Signature:", type: "signature", required: true }
                ]
            }
        ]
    }
};

