export const MOCK_PSYCHOLOGISTS = [
    {
        id: "dr_sarah",
        name: "Dr. Sarah Jenkins, Psy.D.",
        role: "psychologist",
        email: "sarah.jenkins@psychconnect.org",
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
        specialty: ["Anxiety & Panic Attacks", "Cognitive Behavioral Therapy (CBT)", "Mindfulness-Based Stress Reduction"],
        degree: "Doctor of Psychology (Psy.D.)",
        experienceYears: 12,
        fee: 140,
        ratingAverage: 4.9,
        status: "Available",
        onlineStatus: "Available",
        location: "Oakland, CA (Licensed Telehealth Expert)",
        bio: "Dr. Sarah is a licensed clinical psychologist with over a decade of clinical instruction and private practice. She specializes in guiding clients through panic, anxiety, and obsessive-compulsive traits using targeted CBT constructs and deep breathing frameworks.",
        credentials: [
            "Licensed Clinical Psychologist (CA State Board - #PSY29831)",
            "Advisory Member, Cognitive Behavioral Science Coalition",
            "Executive Board, Association for Contextual Behavioral Science"
        ],
        ratings: [
            {
                id: "r1",
                patientName: "Marcus G.",
                rating: 5,
                comment: "Dr. Sarah completely changed my relationship with panic attacks. Her biofeedback insights are incredibly simple and structured.",
                date: "2026-05-18"
            },
            {
                id: "r2",
                patientName: "Linda K.",
                rating: 5,
                comment: "A compassionate professional. The tele-therapy session feels just as authentic and engaging as an in-office discussion.",
                date: "2026-04-29"
            }
        ],
        availability: [
            {
                day: "Monday",
                slots: ["09:00 AM", "10:30 AM", "01:00 PM", "03:30 PM"]
            },
            {
                day: "Wednesday",
                slots: ["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"]
            },
            {
                day: "Thursday",
                slots: ["08:30 AM", "11:00 AM", "01:30 PM", "03:00 PM"]
            }
        ]
    },
    {
        id: "dr_alan",
        name: "Dr. Alan Vance, Ph.D.",
        role: "psychologist",
        email: "alan.vance@psychconnect.org",
        avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
        specialty: ["Depression & Mood Disorders", "Interpersonal Psychotherapy", "Trauma-Informed Care (EMDR)"],
        degree: "Ph.D. in Clinical Psychology",
        experienceYears: 15,
        fee: 160,
        ratingAverage: 4.8,
        status: "verified",
        onlineStatus: "Busy",
        location: "Seattle, WA (Licensed Telehealth Expert)",
        bio: "Dr. Alan focuses on relational trauma, grief, and long-standing mood issues. His therapeutic posture blends attachment science with practical emotion-regulation mechanics to help clients find dynamic resilience in complex life circumstances.",
        credentials: [
            "Licensed Clinical Psychologist (WA Board - #PY604539)",
            "EMDR Certified Therapist (EMDRIA)",
            "Clinical Director, Seattle Attachment Studies Institute"
        ],
        ratings: [
            {
                id: "r3",
                patientName: "David F.",
                rating: 5,
                comment: "I felt truly seen. Dr. Vance doesn't just run through templates; he works with your direct narrative with profound patience.",
                date: "2026-06-02"
            }
        ],
        availability: [
            {
                day: "Tuesday",
                slots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"]
            },
            {
                day: "Thursday",
                slots: ["10:30 AM", "01:00 PM", "03:30 PM", "05:00 PM"]
            }
        ]
    },
    {
        id: "dr_mei",
        name: "Dr. Mei Chen, Psy.D.",
        role: "psychologist",
        email: "mei.chen@psychconnect.org",
        avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200",
        specialty: ["Neurodivergence & ADHD Coaching", "Stress & Burnout", "Acceptance & Commitment Therapy (ACT)"],
        degree: "Doctor of Psychology (Psy.D.)",
        experienceYears: 9,
        fee: 150,
        ratingAverage: 5.0,
        status: "Available",
        onlineStatus: "Available",
        location: "New York, NY (Licensed Telehealth Expert)",
        bio: "Dr. Chen supports high-stress professionals and neurodivergent adults. She relies heavily on ACT models, assisting individuals to decouple from self-imposed expectations and cultivate values-aligned habits.",
        credentials: [
            "Licensed Psychologist & Counselor (NY State Registry - #021943)",
            "Advisory Panelist, Neurodiversity and Clinical Work Alliance",
            "Certified Stress Management & Resiliency Facilitator"
        ],
        ratings: [
            {
                id: "r4",
                patientName: "Evelyn T.",
                rating: 5,
                comment: "Working with Dr. Chen on my late-diagnosed ADHD has been a revelation. Practical, non-judgmental, and highly structured.",
                date: "2026-05-25"
            }
        ],
        availability: [
            {
                day: "Monday",
                slots: ["11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"]
            },
            {
                day: "Tuesday",
                slots: ["10:00 AM", "12:00 PM", "02:30 PM", "04:00 PM"]
            },
            {
                day: "Friday",
                slots: ["09:00 AM", "11:30 AM", "01:00 PM", "03:00 PM"]
            }
        ]
    }
];
export const MOCK_PATIENT = {
    id: "patient_user",
    name: "Alex Rivera",
    role: "patient",
    email: "alex.rivera@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
};
export const MOCK_POSTS = [
    {
        id: "post_1",
        authorId: "dr_sarah",
        authorName: "Dr. Sarah Jenkins, Psy.D.",
        authorAvatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
        authorRole: "psychologist",
        title: "Understanding the 5-4-3-2-1 Grounding Rule for Panic Attacks",
        content: "When panic strikes, your nervous system is hijacked by the 'fight-or-flight' mechanism. Try using the cognitive anchoring rule. Scan your physical space immediately and label: \n\n*   **5 things you can see**: (e.g. books, light beams)\n*   **4 things you can physically touch**: (your jeans, the desk key)\n*   **3 things you can hear**: (distant motor hum, fan breeze)\n*   **2 things you can smell**: (coffee, fresh paper)\n*   **1 thing you can taste**: (toothpaste mint)\n\nThis structures cognitive signals back into the present concrete reality, helping lower your amygdala's alarm response.",
        timestamp: "2026-06-11T14:30:00Z",
        likes: 24,
        likedBy: [],
        tags: ["Anxiety", "Grounding Techniques", "Mindfulness"],
        comments: [
            {
                id: "c1",
                authorId: "patient_user",
                authorName: "Alex Rivera",
                authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
                authorRole: "patient",
                content: "I tried this in the subway today and it actually stopped my dizzy spell from spiraling! Thank you so much, Dr. Sarah.",
                timestamp: "2026-06-11T15:12:00Z"
            }
        ]
    },
    {
        id: "post_2",
        authorId: "patient_user_2",
        authorName: "Anonymous Wanderer",
        authorAvatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=80&w=200",
        authorRole: "patient",
        isAnonymous: true,
        title: "How do you manage physical fatigue from imposter syndrome?",
        content: "I recently joined a software engineering team at a fantastic startup, but every single day I feel like the most clueless person in the room. I wake up with a heavy stomach, and by 3:00 PM my shoulders are so tight and I feel exhausted. Does anyone have tips for letting go of this constant baseline dread? Does it ever get easier?",
        timestamp: "2026-06-10T09:15:00Z",
        likes: 18,
        likedBy: [],
        tags: ["Workplace Burnout", "Imposter Syndrome", "Anonymous Support"],
        comments: [
            {
                id: "c2",
                authorId: "dr_mei",
                authorName: "Dr. Mei Chen, Psy.D.",
                authorAvatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200",
                authorRole: "psychologist",
                content: "What you are experiencing, dear reader, is a continuous baseline activation of your cortisol threat-detection loop. Try 'cognitive defusion'—instead of treating 'I am unqualified' as an absolute fact, rephrase in your thoughts as: 'I notice I am having the thought that I am unqualified.' Let that sit without struggling against it. You can do this!",
                timestamp: "2026-06-10T12:04:00Z"
            }
        ]
    }
];
export const MOCK_SUPPORT_GROUPS = [
    {
        id: "g_anxiety",
        name: "Anxiety & Social Panic Support",
        description: "A community share space for discussing mild anxiety, social dread, and shares on calming grounding strategies.",
        category: "Anxiety",
        membersCount: 1422,
        postsCount: 184,
        icon: "ShieldAlert"
    },
    {
        id: "g_adhd",
        name: "Adult ADHD Compass",
        description: "Strategies for executive dysfunction, focus rituals, rejection sensitivity dysphoria (RSD), and values-aligned planning.",
        category: "Neurodiversities",
        membersCount: 890,
        postsCount: 110,
        icon: "Brain"
    },
    {
        id: "g_burnout",
        name: "Corporate Fatigue & Burnout Recovery",
        description: "Regulating boundaries at demanding jobs, managing chronic fatigue, and processing imposter-driven triggers.",
        category: "Career & Growth",
        membersCount: 1104,
        postsCount: 95,
        icon: "Flame"
    }
];
export const INITIAL_APPOINTMENTS = [
    {
        id: "appt_1",
        patientId: "patient_user",
        patientName: "Alex Rivera",
        psychologistId: "dr_sarah",
        psychologistName: "Dr. Sarah Jenkins, Psy.D.",
        psychologistAvatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
        psychologistSpecialty: "Anxiety & Panic Attacks",
        date: "2026-06-15",
        time: "10:30 AM",
        status: "scheduled",
        chatHistory: [
            { id: "s1", senderId: "system", senderName: "System", content: "Consultation scheduled. Virtual door unlocks 10 minutes prior to call.", timestamp: "2026-06-11T12:00:00Z", isSystem: true }
        ],
        clinicalNotes: "Client indicated elevated subway anxiety during commute. Ready to review 5-4-3-2-1 application today."
    },
    {
        id: "appt_2",
        patientId: "patient_user",
        patientName: "Alex Rivera",
        psychologistId: "dr_mei",
        psychologistName: "Dr. Mei Chen, Psy.D.",
        psychologistAvatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200",
        psychologistSpecialty: "Stress & Burnout",
        date: "2026-06-11", // Today
        time: "03:00 PM",
        status: "completed",
        chatHistory: [
            { id: "s2", senderId: "system", senderName: "System", content: "Interactive consultation room opened.", timestamp: "2026-06-11T15:00:00Z", isSystem: true },
            { id: "m1", senderId: "dr_mei", senderName: "Dr. Mei Chen, Psy.D.", content: "Hi Alex, hope you can hear me. We will run client feedback exercises.", timestamp: "2026-06-11T15:02:00Z" },
            { id: "m2", senderId: "patient_user", senderName: "Alex Rivera", content: "Yes! Visual and audio is pristine. Ready.", timestamp: "2026-06-11T15:03:00Z" }
        ],
        clinicalNotes: "Session focused on late-onset workplace burnout and imposter feelings. Client demonstrated solid mastery of defusion statements. Suggested homework: 5-minute somatic logging during high-stress hours.",
        summaryPDF: "# Clinical Consultation Brief\n\n**Patient Profile**: Alex Rivera (Remote Consultation)\n**Counselor**: Dr. Mei Chen, Psy.D.\n**Duration**: 50 Minutes\n\n### 1. Primary Cognitive & Behavioral Concerns\n- Client reports chronic somatic fatigue manifesting around mid-afternoon due to continuous workplace threat loop.\n- Severe imposter patterns triggered during team reviews leading to extreme muscular tension in the trunk and neck.\n\n### 2. Therapeutic Dialogues & Clinician Interventions\n- Introduced contextual ACT models focusing on cognitive defusion.\n- Rephrased the absolute statement *'I am fully unqualified'* to *'I observe that my thoughts are producing a pattern of insecurity'*.\n\n### 3. Suggested Homework & Exercises\n- Daily somatic check-in logging for 5 minutes during the high activation window.\n- Grounding deep-breathing rhythms (4-7-8 method, 3 continuous cycles).\n\n### 4. Next Session Agenda Focus\n- Evaluate impact of somatic logging and review stress reaction spikes from active team presentations."
    }
];
export const PREDEFINED_RESOURCES = [
    {
        id: "res_cbt_panic",
        title: "Grounding Anchors for Panic Recovery",
        type: "article",
        topic: "Anxiety & Panic",
        description: "An evidence-based primer on how the amygdala responds to sudden autonomic arousal, and how cognitive grounding breaks the cycle.",
        content: "When experiencing a sudden panic spill, your sympathetic nervous system triggers cognitive alarms. This article helps you understand that somatic spikes (e.g. rapid pulse, shallow chest respiration) are temporary and harmless protective systems. By choosing to notice and narrate objective external details (such as the texture of your keys or cool terminal fonts), you force the prefrontal cortex back online. This slows down autonomic survival loops and tells your amygdala that you are safe in the immediate present."
    },
    {
        id: "res_defusion_ws",
        title: "Cognitive Defusion Worksheet",
        type: "worksheet",
        topic: "Workplace Stress & Imposter Patterns",
        description: "Step-by-step cognitive worksheet to identify deep-seated imposter beliefs and decouple from absolute labels.",
        content: "Our brain constantly produces descriptive labels that we mistake for absolute objective truth. Cognitive Defusion helps you create a healthy, objective space between your sense of self and your automatic thoughts.",
        questions: [
            "Write down the specific self-critical thought currently triggering tension (e.g., 'I am unqualified to speak').",
            "Now, prefix it with defusion phrasing ('I observe that I am having the thought that...'). How does the weight of that statement shift?",
            "What is one small, objective piece of evidence that contradicts this automatic self-assessment?"
        ]
    },
    {
        id: "res_box_breathing",
        title: "Interactive Box Breathing Practice",
        type: "exercise",
        topic: "Somatic Tension Regulation",
        description: "Guided somatic pacing utilizing the clinical 4-second box breathing cycle to down-regulate high physical arousal.",
        content: "This guided exercise outlines how to run a complete box-breathing cycle designed to restabilize somatic tension.",
        steps: [
            "Inhale slowly through your nose for 4 seconds, filling your lungs evenly.",
            "Hold your breath gently at the peak for 4 seconds without closing down your throat.",
            "Exhale smoothly through your mouth for 4 seconds, releasing all muscular tension.",
            "Hold empty for 4 seconds before starting the next cycle."
        ]
    },
    {
        id: "res_burnout_habits",
        title: "Boundary Structuring for Hybrid Workloads",
        type: "article",
        topic: "Career Exhaustion & Burnout",
        description: "Strategies for creating clear compartmental blocks in late-capitalist hybrid workspaces to preserve baseline energy.",
        content: "Workplace exhaustion is often fueled by an 'always-on' threat loop. This structural resource guides professionals to define strict boundaries around digital messaging slots, establish regular eye-strain breaks, and practice transitioning away from high cognitive work using custom somatic deceleration rituals."
    },
    {
        id: "res_val_planning",
        title: "Values-Aligned Goals Planning",
        type: "worksheet",
        topic: "Mindfulness & ACT",
        description: "A values-based planning worksheet to outline goals centered on genuine self-care and mental health foundations.",
        content: "ACT teaches us that goals are most resilient when anchored in personal values rather than performance demands. Use this worksheet to audit your core values.",
        questions: [
            "Name one deep personal value that feels neglected by your current daily routine (e.g., 'physical peace', 'creative play').",
            "What is one micro-action (taking less than 10 minutes) you could schedule tomorrow to support this value?",
            "What primary barrier or fear might arise when trying to prioritize this, and how can you allow that feeling to exist while still taking action?"
        ]
    }
];
