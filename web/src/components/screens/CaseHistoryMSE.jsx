import { useState, useEffect, useRef, useCallback } from 'react';
import { Database } from '../../services/db';
import { GeminiService } from '../../services/ai';

const defaultFormData = {
    // Personal Info
    name: '', age: '', dob: '', sex: '', gender: '', pronouns: '', education: '', occupation: '',
    socioEconomicStatus: '', maritalStatus: '', religion: '', residence: '', address: '', language: '',
    sourceOfReferral: '', typeOfAdmission: '', identificationMarks: '',
    
    // Source of Info
    informant: '', informantIntimacy: '', informantAcquaintance: '', informantReliability: '', informantAdequacy: '',
    
    // Chief Complaints
    verbatim: '', modeOfOnset: '', courseOfIllness: '', progressOfIllness: '',
    sleepDisturbance: '', appetiteDisturbance: '', weightDisturbance: '', sexualLifeDisturbance: '', socialLifeDisturbance: '', occupationDisturbance: '',
    
    // Negative History
    negTrauma: false, negTraumaNotes: '',
    negHeadache: false, negHeadacheNotes: '',
    negFever: false, negFeverNotes: '',
    negVomiting: false, negVomitingNotes: '',
    negConfusion: false, negConfusionNotes: '',
    negDisorientation: false, negDisorientationNotes: '',
    negMemory: false, negMemoryNotes: '',
    negHypertension: false, negHypertensionNotes: '',
    negDiabetes: false, negDiabetesNotes: '',
    negSubstance: false, negSubstanceNotes: '',
    
    // Past History
    pastMedicalHistory: '', pastPsychiatricHistory: '', treatmentHistory: '',
    
    // Family History
    familyHistoryText: '', consanguinity: '', genogramText: '', genogramCanvas: '', genogramFileName: '', genogramFileContent: '',
    
    // Personal History - Birth
    typeOfDelivery: '', term: '', birthingFacility: '', deliveryComplications: '', deliveryComplicationsText: '',
    postnatalIllness: '', postnatalIllnessText: '',
    grossMotor: '', fineMotor: '', languageSkills: '', socialSkills: '', adaptiveSkills: '',
    
    // Childhood Behavior
    childhoodConduct: [], childhoodConductNotes: '',
    childhoodTemperTantrums: false, childhoodTemperTantrumsNotes: '',
    childhoodNeuroticTraits: [], childhoodNeuroticTraitsNotes: '',
    
    // Other Personal History
    relationshipParentsSiblingsPeers: '', schoolPerformance: '', attitudeTeachers: '', regularitySchool: '', disciplinaryIssues: '',
    occupationHistory: '', menstrualHistory: '', maritalHistory: '', substanceUseHistory: '',
    
    // Premorbid Personality
    premorbidAttitudeOthers: '', premorbidAttitudeSelf: '', premorbidAttitudeMoral: '', premorbidMood: '', premorbidLeisure: '', premorbidFantasy: '', premorbidStressReaction: '', premorbidHabits: '',
    
    // MSE - Appearance
    msePhysicalAppearance: '', mseEstimateAge: '', mseBodyBuilt: '', mseTouchSurroundings: '', mseEyeContact: '', mseDress: '',
    mseFacialExpression: [], msePosture: [], mseAttitudeExaminer: [], mseRapport: '',
    
    // MSE - Motor Behaviour
    mseMotorBehaviour: [], mseMotorBehaviourNotes: '',
    
    // MSE - Speech
    mseSpeechIntensity: '', mseSpeechPitch: '', mseSpeechQuality: '', mseSpeechProsody: '', mseSpeechReactionTime: '', mseSpeechSpeed: '', mseSpeechPressure: false,
    mseSpeechEase: [], mseSpeechRelevance: '', mseSpeechCoherence: '', mseSpeechGoalDirection: '', mseSpeechProductivity: '', mseSpeechMannerRelating: '', mseSpeechDeviation: [],
    
    // MSE - Cognition
    mseOrientation: '', mseAttention: '', mseConcentration: '',
    mseImmediateMemory: '', mseRecentMemory: '', mseRemoteMemory: '',
    mseAbstractAbility: '',
    mseComprehension: '', mseGeneralInformation: '', mseVocabulary: '', mseCalculation: '',
    
    // MSE - Mood & Affect
    mseMood: '', mseAffectQuality: '', mseAffectSubjective: '', mseAffectObjective: '', mseAffectIntensity: '', mseAffectMobility: '', mseAffectRange: '',
    mseAffectReactivity: '', mseAffectCommunicability: '', mseAffectAppropriateness: '', mseAffectParamimia: false, mseAffectParathymia: false, mseAffectDiurnalVariation: '',
    
    // MSE - Thought
    mseThoughtStream: [], mseThoughtStreamNotes: '',
    mseThoughtForm: [], mseThoughtFormNotes: '',
    mseThoughtPossession: [], mseThoughtPossessionNotes: '',
    mseThoughtContent: [], mseThoughtContentNotes: '',
    mseThoughtDelusion: [], mseThoughtDelusionNotes: '',
    
    // MSE - Perceptions
    msePerceptualSensoryDistortion: [], msePerceptualSensoryDistortionNotes: '',
    msePerceptualSensoryDeception: [], msePerceptualSensoryDeceptionNotes: '',
    
    // MSE - Psychotic & Other Phenomena
    mseOtherPsychoticPhenomena: [], mseOtherPsychoticPhenomenaNotes: '',
    mseOtherPhenomena: [], mseOtherPhenomenaNotes: '',
    
    // MSE - Judgment
    mseJudgmentSocial: '', mseJudgmentPersonal: '', mseJudgmentTest: '',
    
    // MSE - Insight
    mseInsightGrade: '',
    
    // Formulation
    specificSymptom: '', broaderCategory: '',
    bioPredisposing: '', psychPredisposing: '', socialPredisposing: '',
    bioPrecipitating: '', psychPrecipitating: '', socialPrecipitating: '',
    bioPerpetuating: '', psychPerpetuating: '', socialPerpetuating: '',
    limitingFactors: '', modifyingFactors: '',
    
    // AI Output
    aiFormulationNarrative: ''
};

export function CaseHistoryMSE({
    patients,
    activePatientId,
    onSetActivePatientId
}) {
    const [activeMainTab, setActiveMainTab] = useState('CaseHistory'); // 'CaseHistory', 'MSE', 'Formulation'
    const [activeSubTab, setActiveSubTab] = useState('PersonalInfo');
    const [formData, setFormData] = useState(defaultFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [loadingAI, setLoadingAI] = useState(false);
    const [saveToast, setSaveToast] = useState(false);
    
    // Genogram Canvas Ref & State
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawColor, setDrawColor] = useState('#06b6d4');
    const [drawTool, setDrawTool] = useState('pen'); // 'pen', 'eraser'
    const [lineWidth, setLineWidth] = useState(3);
    const fileInputRef = useRef(null);

    // Save and load logic
    const loadPatientData = useCallback((patientId) => {
        const key = `psypyrus_ch_mse_${patientId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge default state to ensure compatibility with any newer keys
                setFormData({ ...defaultFormData, ...parsed });
            } catch (e) {
                console.error("Failed to parse saved CH+MSE data", e);
                setFormData(defaultFormData);
            }
        } else {
            // Check patient profile defaults
            const patient = patients.find(p => p.id === patientId);
            if (patient) {
                setFormData({
                    ...defaultFormData,
                    name: patient.name || '',
                    age: patient.age || '',
                    gender: patient.gender || '',
                    sex: patient.gender || '',
                });
            } else {
                setFormData(defaultFormData);
            }
        }
    }, [patients]);

    useEffect(() => {
        if (activePatientId) {
            loadPatientData(activePatientId);
            // Default sub-tab on patient change
            setActiveMainTab('CaseHistory');
            setActiveSubTab('PersonalInfo');
        }
    }, [activePatientId, loadPatientData]);

    // Draw canvas content back on tab changes or data re-renders
    useEffect(() => {
        if (activeSubTab === 'FamilyHistory' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            // Clear initially
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Set canvas background to a very dark overlay matching theme
            ctx.fillStyle = '#0b1528';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (formData.genogramCanvas) {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                };
                img.src = formData.genogramCanvas;
            }
        }
    }, [activeSubTab, formData.genogramCanvas]);

    const handleSave = (silent = false) => {
        if (!activePatientId) return;
        setIsSaving(true);
        const key = `psypyrus_ch_mse_${activePatientId}`;
        localStorage.setItem(key, JSON.stringify(formData));
        Database.logAudit("Saved CH+MSE Details", `Updated Case History & MSE form details for patient ${formData.name || activePatientId}`);
        setIsSaving(false);
        if (!silent) {
            setSaveToast(true);
            setTimeout(() => setSaveToast(false), 2000);
        }
    };

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset this patient's Case History + MSE form to empty?")) {
            setFormData(defaultFormData);
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#0b1528';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            const key = `psypyrus_ch_mse_${activePatientId}`;
            localStorage.removeItem(key);
            Database.logAudit("Reset CH+MSE Details", `Reset Form for Patient ID ${activePatientId}`);
        }
    };

    // Canvas drawing helper events
    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        // Touch support
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        
        // Mouse support
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const coords = getCoordinates(e);
        
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const coords = getCoordinates(e);
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = lineWidth;
        
        if (drawTool === 'eraser') {
            ctx.strokeStyle = '#0b1528'; // Match background
        } else {
            ctx.strokeStyle = drawColor;
        }

        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const canvas = canvasRef.current;
            if (canvas) {
                const dataUrl = canvas.toDataURL();
                setFormData(prev => ({ ...prev, genogramCanvas: dataUrl }));
            }
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0b1528';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setFormData(prev => ({ ...prev, genogramCanvas: '' }));
    };

    const drawDemoGenogram = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Base background fill
        ctx.fillStyle = '#0b1528';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineWidth = 2;
        ctx.fillStyle = '#f9fafb';
        ctx.strokeStyle = '#06b6d4';
        
        // Draw Legend
        ctx.font = '10px Inter';
        ctx.fillText("Square = Male, Circle = Female, Line = Relationship", 10, 20);

        // Father (Square: x: 100, y: 70, size: 40)
        ctx.strokeRect(100, 70, 40, 40);
        ctx.fillText("Father (56)", 100, 125);

        // Mother (Circle: x: 260, y: 90, r: 20)
        ctx.beginPath();
        ctx.arc(280, 90, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText("Mother (54)", 260, 125);

        // Relationship Line
        ctx.beginPath();
        ctx.moveTo(140, 90);
        ctx.lineTo(260, 90);
        ctx.stroke();

        // Children connection branch
        ctx.beginPath();
        ctx.moveTo(190, 90);
        ctx.lineTo(190, 160);
        ctx.stroke();

        // Active Patient (Square: x: 170, y: 160)
        ctx.strokeRect(170, 160, 40, 40);
        // Double stroke active patient to demarcate index patient
        ctx.strokeRect(167, 157, 46, 46);
        ctx.fillText("Patient (29)", 165, 215);

        // Save State
        const dataUrl = canvas.toDataURL();
        setFormData(prev => ({ ...prev, genogramCanvas: dataUrl }));
    };

    // File Uploader simulator
    const triggerFileSelect = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({
                    ...prev,
                    genogramFileName: file.name,
                    genogramFileContent: event.target.result
                }));
                // Draw mock overlay on canvas to indicate load
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#0b1528';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#10b981';
                    ctx.font = '14px Inter';
                    ctx.fillText(`✓ File Loaded: ${file.name}`, 30, 100);
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
                    ctx.fillRect(20, 60, 360, 80);
                    setFormData(prev => ({ ...prev, genogramCanvas: canvas.toDataURL() }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Pre-fill demo clinical profile
    const handlePreFill = () => {
        if (!activePatientId) return;
        
        const demoProfile = {
            name: "Liam Carter",
            age: 29,
            dob: "1997-04-12",
            sex: "Male",
            gender: "Cisgender Male",
            pronouns: "He/Him",
            education: "Master of Science in Software Engineering",
            occupation: "Senior Backend Systems Engineer",
            socioEconomicStatus: "Upper Middle Class",
            maritalStatus: "Single",
            religion: "Agnostic",
            residence: "Urban",
            address: "Suite 409, 128 Harrison Blvd, Metro City",
            language: "English (Mother tongue), Spanish (Conversational)",
            sourceOfReferral: "Self-referred via employee wellness assistance plan",
            typeOfAdmission: "Voluntary Admission",
            identificationMarks: "Surgical scar approximately 3 inches on lateral aspect of right knee.",
            
            informant: "Patient (Self) and Mother (Clara Carter)",
            informantIntimacy: "Excellent. Mother has daily contact with patient.",
            informantAcquaintance: "Lifetime (Self), 29 years (Mother)",
            informantReliability: "Highly reliable, history matches chronological employer journals.",
            informantAdequacy: "Sufficient",
            
            verbatim: "\"I feel completely stuck in a fog. My brain is operating at 10% speed, and I can't find the motivation to do simple things like feed myself. I sleep for 11 hours and wake up exhausted.\"",
            modeOfOnset: "Insidious (Takes more than 2 weeks e.g. Schizophrenia)",
            courseOfIllness: "Continuous (Uninterrupted change without breaks)",
            progressOfIllness: "Deteriorating-Condition is getting worse by time e.g. Schizophrenia",
            sleepDisturbance: "Severe hypersomnia, sleeping 10-12 hours per night, fragmented quality with difficulty waking up.",
            appetiteDisturbance: "Decreased",
            weightDisturbance: "Decreased",
            sexualLifeDisturbance: "Marked loss of libido reported since onset of depressive episode.",
            socialLifeDisturbance: "Withdrawal from all peer activities, ignored calls from close friends for 3 weeks.",
            occupationDisturbance: "Struggling to meet deadlines, taking double the time for standard coding projects.",
            
            negTrauma: false, negTraumaNotes: "No history of physical head trauma or concussions.",
            negHeadache: false, negHeadacheNotes: "No unusual recurrent headaches reported.",
            negFever: false, negFeverNotes: "No active or recent febrile illness.",
            negVomiting: false, negVomitingNotes: "No recent episodes of nausea or vomiting.",
            negConfusion: false, negConfusionNotes: "Subject denies acute confusion states.",
            negDisorientation: false, negDisorientationNotes: "Patient has been consistently oriented.",
            negMemory: true, negMemoryNotes: "Patient reports subjective short-term memory lapses and brain fog.",
            negHypertension: false, negHypertensionNotes: "Blood pressure within normal limits (120/78).",
            negDiabetes: false, negDiabetesNotes: "No diabetic history, HbA1c normal.",
            negSubstance: true, negSubstanceNotes: "Social alcohol use (1-2 drinks/week), currently suspended. No illicit drug use.",
            
            pastMedicalHistory: "Knee arthroscopy (2023) for torn meniscus. Otherwise unremarkable.",
            pastPsychiatricHistory: "One mild depressive episode in college (2018), resolved with brief counseling. No prior psychiatric hospitalizations.",
            treatmentHistory: "No current psychotropic medications. Brief trial of Escitalopram 10mg in 2018, discontinued after 3 months due to improvement.",
            
            familyHistoryText: "History of major depression in maternal aunt. Father has history of alcohol use disorder, currently in remission.",
            consanguinity: "No consanguinity between parents.",
            genogramText: "Genogram demonstrates a stable nuclear family. Primary index subject has one younger sister (25) who is healthy. No family history of suicide.",
            
            typeOfDelivery: "Natural Birth",
            term: "Full term",
            birthingFacility: "Hospital",
            deliveryComplications: "No",
            deliveryComplicationsText: "Healthy delivery without complications.",
            postnatalIllness: "No",
            postnatalIllnessText: "No major postnatal complications.",
            grossMotor: "Achieved",
            fineMotor: "Achieved",
            languageSkills: "Achieved",
            socialSkills: "Achieved",
            adaptiveSkills: "Achieved",
            
            childhoodConduct: [],
            childhoodConductNotes: "No significant behavior or conduct issues reported during childhood.",
            childhoodTemperTantrums: false,
            childhoodTemperTantrumsNotes: "Normal developmental tantrums, resolved quickly.",
            childhoodNeuroticTraits: ["nail-biting"],
            childhoodNeuroticTraitsNotes: "Occasional nail-biting during exam seasons.",
            
            relationshipParentsSiblingsPeers: "Close relationship with mother and sister. Strained, distant relationship with father.",
            schoolPerformance: "Excellent academic performance. Valedictorian of high school class. Regular school attendance.",
            attitudeTeachers: "Cooperative and respectful.",
            regularitySchool: "Highly regular",
            disciplinaryIssues: "None",
            occupationHistory: "Started working at age 22. Has held 2 software engineering jobs. Highly competent but current work satisfaction is low due to burn out.",
            menstrualHistory: "Not applicable.",
            maritalHistory: "Single. Never married. Unresolved relationship breakup 6 months ago, which serves as a psychological stressor.",
            substanceUseHistory: "No history of dependence or heavy abuse.",
            
            premorbidAttitudeOthers: "Generally introverted but forms deep, long-lasting friendships. Reliable colleague.",
            premorbidAttitudeSelf: "High self-expectations, prone to perfectionism and self-criticism.",
            premorbidAttitudeMoral: "Strict ethical values, active volunteering in open-source software communities.",
            premorbidMood: "Stable, slightly dysthymic baseline.",
            premorbidLeisure: "Hiking, building indie video games, playing piano.",
            premorbidFantasy: "Average, focuses on future career accomplishments and game designs.",
            premorbidStressReaction: "Tends to isolate himself and over-work when stressed.",
            premorbidHabits: "Regular coffee consumer (2 cups daily). Sedentary lifestyle.",
            
            msePhysicalAppearance: "Sickly: physically observable illness state",
            mseEstimateAge: "Appropriate to age",
            mseBodyBuilt: "Leptosomes (long, linear physiques)",
            mseTouchSurroundings: "Present: Patient is oriented; ",
            mseEyeContact: "Partial: Fleeting eye contact with the examiner",
            mseDress: "Appropriate: Dress is properly worn,",
            mseFacialExpression: ["corners of mouth turned down", "creases on the forehead", "wooden expression"],
            msePosture: ["hunched shoulders", "head and gaze inclined downwards"],
            mseAttitudeExaminer: ["Co-operative", "Guarded"],
            mseRapport: "Established with difficult",
            
            mseMotorBehaviour: ["Retardation", "Preoccupied"],
            mseMotorBehaviourNotes: "Patient displays visible psychomotor slowing, taking several seconds to shift posture or gesturate.",
            
            mseSpeechIntensity: "Abnormally soft",
            mseSpeechPitch: "Monotonous",
            mseSpeechQuality: "Soft",
            mseSpeechProsody: "Reduced prosodic variation",
            mseSpeechReactionTime: "Increased reaction time",
            mseSpeechSpeed: "Very slow",
            mseSpeechPressure: false,
            mseSpeechEase: ["Hesitant", "Speaking only when questioned"],
            mseSpeechRelevance: "Relevant",
            mseSpeechCoherence: "Coherent",
            mseSpeechGoalDirection: "Goal-directed but highly delayed",
            mseSpeechProductivity: "Decreased Productivity/scant speech",
            mseSpeechMannerRelating: "Tensed up",
            mseSpeechDeviation: [],
            
            mseOrientation: "Intact",
            mseAttention: "Impaired",
            mseConcentration: "Impaired",
            mseImmediateMemory: "Intact",
            mseRecentMemory: "Impaired",
            mseRemoteMemory: "Intact",
            mseAbstractAbility: "Concrete thinking",
            mseComprehension: "Intact",
            mseGeneralInformation: "Intact",
            mseVocabulary: "Intact",
            mseCalculation: "Impaired",
            
            mseMood: "Depressive",
            mseAffectQuality: "Depressed",
            mseAffectSubjective: "\"I feel like I'm drowning in slow motion.\"",
            mseAffectObjective: "Tearful, flat, restricted range of emotional expression.",
            mseAffectIntensity: "Blunted affect",
            mseAffectMobility: "Fixed affect",
            mseAffectRange: "Restricted range",
            mseAffectReactivity: "Highly restricted",
            mseAffectCommunicability: "Difficult to draw out",
            mseAffectAppropriateness: "Congruent with depressive themes",
            mseAffectParamimia: false,
            mseAffectParathymia: false,
            mseAffectDiurnalVariation: "Worse in morning",
            
            mseThoughtStream: ["Retardation (bradyphrenia)", "Poverty of speech", "Thought blocking"],
            mseThoughtStreamNotes: "Significant bradyphrenia. Long pauses (5-8 seconds) before responding to questions.",
            mseThoughtForm: ["Negative type – the patient looses his previous ability to think and cannot produce a concept."],
            mseThoughtFormNotes: "Struggles to synthesize complex abstract ideas.",
            mseThoughtPossession: [],
            mseThoughtPossessionNotes: "No obsessions or thought insertion/broadcasting reported.",
            mseThoughtContent: ["Depressive cognition", "Idea of worthlessness", "Ideas of helplessness", "Ideas of hopelessness", "Suicidal ideas", "Death wishes"],
            mseThoughtContentNotes: "Passive death wishes reported: \"I wish I just wouldn't wake up.\" Suicidal ideation is passive without plan or active intent.",
            mseThoughtDelusion: [],
            mseThoughtDelusionNotes: "No delusional patterns identified.",
            
            msePerceptualSensoryDistortion: [],
            msePerceptualSensoryDistortionNotes: "No hyperacusis or spatial distortions noted.",
            msePerceptualSensoryDeception: [],
            msePerceptualSensoryDeceptionNotes: "No hallucinations or active deceptions.",
            
            mseOtherPsychoticPhenomena: [],
            mseOtherPsychoticPhenomenaNotes: "No passivity phenomena or made acts.",
            mseOtherPhenomena: [],
            mseOtherPhenomenaNotes: "No derealization or paramnesia active.",
            
            mseJudgmentSocial: "Intact",
            mseJudgmentPersonal: "Impaired",
            mseJudgmentTest: "Intact",
            
            mseInsightGrade: "Grade-4",
            
            specificSymptom: "Hypersomnia, severe psychomotor retardation, cognitive slowing (brain fog), and passive suicidal ideation.",
            broaderCategory: "Major Depressive Disorder, Single Episode, Severe (DSM-5 296.23)",
            
            bioPredisposing: "Maternal family history of depression; baseline introverted/dysthymic temperament.",
            psychPredisposing: "Perfectionistic personality traits, high self-expectations, and avoidant stress-response pattern.",
            socialPredisposing: "Childhood exposure to father's alcohol use disorder and domestic strain.",
            
            bioPrecipitating: "Hypersomnia-induced circadian disruptions.",
            psychPrecipitating: "Unresolved relationship breakup 6 months ago and occupational burn out.",
            socialPrecipitating: "Isolation from professional and peer support networks.",
            
            bioPerpetuating: "Chronic fatigue leading to severe sedentary habits and poor nutrition.",
            psychPerpetuating: "Avoidance coping patterns, intense self-criticism, and cognitive distortions (hopelessness).",
            socialPerpetuating: "Unemployment risk, social isolation, and distance from father.",
            
            limitingFactors: "Retained intellectual capacity, master's degree, strong history of academic and professional success.",
            modifyingFactors: "Receptive to therapeutic rapport; supportive family structure (mother and sister).",
            
            aiFormulationNarrative: ""
        };

        setFormData(prev => ({
            ...prev,
            ...demoProfile
        }));

        // Draw the demo genogram
        setTimeout(() => {
            drawDemoGenogram();
        }, 100);

        Database.logAudit("Pre-filled CH+MSE Form", `Populated demo case details for Liam Carter`);
    };

    // AI formulation synthesis
    const handleCompileFormulation = async () => {
        setLoadingAI(true);
        
        const prompt = `Synthesize a comprehensive psychiatric Case History and Case Formulation clinical narrative using the following structured checklist details:

PERSONAL DETAILS:
- Name: ${formData.name} (Age: ${formData.age}, DOB: ${formData.dob})
- Demographics: Gender: ${formData.gender}, Sex: ${formData.sex}, Socio-economic: ${formData.socioEconomicStatus}, Marital: ${formData.maritalStatus}, Religion: ${formData.religion}, Residence: ${formData.residence}
- Mother Tongue: ${formData.language}, Referral: ${formData.sourceOfReferral}, Admission: ${formData.typeOfAdmission}

CLINICAL DESCRIPTION & HISTORY:
- Chief Complaint (Verbatim): ${formData.verbatim}
- Mode of Onset: ${formData.modeOfOnset}, Course: ${formData.courseOfIllness}, Progress: ${formData.progressOfIllness}
- Associated Disturbances: Sleep: ${formData.sleepDisturbance}, Appetite: ${formData.appetiteDisturbance}, Weight: ${formData.weightDisturbance}, Social: ${formData.socialLifeDisturbance}, Occupation: ${formData.occupationDisturbance}
- Past Medical: ${formData.pastMedicalHistory}, Past Psychiatric: ${formData.pastPsychiatricHistory}, Treatment: ${formData.treatmentHistory}
- Family History: ${formData.familyHistoryText} (Consanguinity: ${formData.consanguinity})

MENTAL STATUS EXAMINATION (MSE):
- Appearance: ${formData.msePhysicalAppearance}, Age Estimate: ${formData.mseEstimateAge}, Built: ${formData.mseBodyBuilt}, Eye Contact: ${formData.mseEyeContact}, Dress: ${formData.mseDress}
- Facial Expression: ${formData.mseFacialExpression.join(', ')}, Posture: ${formData.msePosture.join(', ')}, Attitude: ${formData.mseAttitudeExaminer.join(', ')}
- Motor Behaviour: ${formData.mseMotorBehaviour.join(', ')} (${formData.mseMotorBehaviourNotes})
- Speech: Intensity: ${formData.mseSpeechIntensity}, Pitch: ${formData.mseSpeechPitch}, Quality: ${formData.mseSpeechQuality}, Speed: ${formData.mseSpeechSpeed}, Ease: ${formData.mseSpeechEase.join(', ')}, Relevance: ${formData.mseSpeechRelevance}, Coherence: ${formData.mseSpeechCoherence}
- Cognition: Orientation: ${formData.mseOrientation}, Attention: ${formData.mseAttention}, Concentration: ${formData.mseConcentration}, Memory (Immediate/Recent/Remote): ${formData.mseImmediateMemory}/${formData.mseRecentMemory}/${formData.mseRemoteMemory}, Abstract: ${formData.mseAbstractAbility}
- Mood & Affect: Mood: ${formData.mseMood}, Affect Quality: ${formData.mseAffectQuality}, Subjective: ${formData.mseAffectSubjective}, Objective: ${formData.mseAffectObjective}, Intensity: ${formData.mseAffectIntensity}, Mobility: ${formData.mseAffectMobility}, Range: ${formData.mseAffectRange}, Diurnal: ${formData.mseAffectDiurnalVariation}
- Thought: Stream: ${formData.mseThoughtStream.join(', ')}, Form: ${formData.mseThoughtForm.join(', ')}, Possession: ${formData.mseThoughtPossession.join(', ')}, Content: ${formData.mseThoughtContent.join(', ')} (${formData.mseThoughtContentNotes}), Delusion: ${formData.mseThoughtDelusion.join(', ')}
- Perceptions: Sensory Distortion: ${formData.msePerceptualSensoryDistortion.join(', ')}, Sensory Deception: ${formData.msePerceptualSensoryDeception.join(', ')}
- Psychotic/Other: Other Psychotic: ${formData.mseOtherPsychoticPhenomena.join(', ')}, Other Phenomena: ${formData.mseOtherPhenomena.join(', ')}
- Judgment: Social: ${formData.mseJudgmentSocial}, Personal: ${formData.mseJudgmentPersonal}, Test: ${formData.mseJudgmentTest}
- Insight: Grade: ${formData.mseInsightGrade}

CASE FORMULATION (5P FACTORS):
- Specific Symptom: ${formData.specificSymptom}, Broader Category: ${formData.broaderCategory}
- Predisposing: Bio: ${formData.bioPredisposing}, Psych: ${formData.psychPredisposing}, Social: ${formData.socialPredisposing}
- Precipitating: Bio: ${formData.bioPrecipitating}, Psych: ${formData.psychPrecipitating}, Social: ${formData.socialPrecipitating}
- Perpetuating: Bio: ${formData.bioPerpetuating}, Psych: ${formData.psychPerpetuating}, Social: ${formData.socialPerpetuating}
- Protective/Modifying: Limiting: ${formData.limitingFactors}, Modifying: ${formData.modifyingFactors}

Output a highly structured, formal clinical case record. Group it under:
1. CLINICAL INTAKE HISTORY
2. MENTAL STATUS EXAMINATION SUMMARY
3. INTEGRATIVE CASE FORMULATION (Explaining the predisposing, precipitating, and perpetuating mechanisms)

Write in full, continuous clinical prose. Do not leave placeholder text.`;

        try {
            const rawResult = await GeminiService.callGemini(prompt, "You are an expert clinical psychiatrist writing formal Case Histories and Case Formulations.");
            
            setFormData(prev => {
                const nextState = { ...prev, aiFormulationNarrative: rawResult };
                // Save immediately
                const key = `psypyrus_ch_mse_${activePatientId}`;
                localStorage.setItem(key, JSON.stringify(nextState));
                return nextState;
            });

            // Save as clinical note
            Database.insertClinicalNote({
                patientId: activePatientId,
                title: "Synthesized Case History & Formulation Record",
                noteType: "GENERAL",
                bodyJson: rawResult
            });

        } catch (e) {
            alert(`Error generating formulation: ${e.message}`);
        } finally {
            setLoadingAI(false);
        }
    };

    // Checkbox arrays toggle helper
    const handleCheckboxArrayToggle = (field, value) => {
        setFormData(prev => {
            const arr = prev[field] || [];
            const nextArr = arr.includes(value) 
                ? arr.filter(v => v !== value) 
                : [...arr, value];
            return { ...prev, [field]: nextArr };
        });
    };

    return (
        <div className="screen-container active" id="screen-case-history-mse">
            <style>{`
                .ch-layout-grid {
                    display: grid;
                    grid-template-columns: 240px 1fr 280px;
                    gap: 24px;
                    margin-top: 16px;
                }
                @media (max-width: 1200px) {
                    .ch-layout-grid {
                        grid-template-columns: 200px 1fr;
                    }
                    .ch-right-sidebar {
                        grid-column: span 2;
                    }
                }
                @media (max-width: 768px) {
                    .ch-layout-grid {
                        grid-template-columns: 1fr;
                    }
                    .ch-left-nav {
                        grid-column: span 1;
                    }
                }
                .ch-top-tab-bar {
                    display: flex;
                    gap: 8px;
                    border-bottom: 1px solid var(--color-border);
                    margin-bottom: 20px;
                    padding-bottom: 8px;
                }
                .ch-top-tab-btn {
                    background: transparent;
                    border: none;
                    color: var(--color-text-secondary);
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    border-radius: var(--radius-sm);
                    transition: all var(--transition-fast);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .ch-top-tab-btn:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.02);
                }
                .ch-top-tab-btn.active {
                    color: var(--color-primary);
                    background: var(--color-primary-container);
                }
                .ch-sub-nav-list {
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .ch-sub-nav-item {
                    padding: 10px 14px;
                    border-radius: var(--radius-sm);
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all var(--transition-fast);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .ch-sub-nav-item:hover {
                    background: rgba(255,255,255,0.03);
                    color: #fff;
                }
                .ch-sub-nav-item.active {
                    background: rgba(255,255,255,0.05);
                    color: #fff;
                    border-left: 2px solid var(--color-primary);
                }
                .ch-grid-form-col2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                @media (max-width: 600px) {
                    .ch-grid-form-col2 {
                        grid-template-columns: 1fr;
                    }
                }
                .ch-grid-form-col3 {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 16px;
                }
                @media (max-width: 800px) {
                    .ch-grid-form-col3 {
                        grid-template-columns: 1fr;
                    }
                }
                .ch-checkbox-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 8px;
                    margin-top: 10px;
                }
                .ch-checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.04);
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    color: var(--color-text-secondary);
                    transition: all 0.2s ease;
                }
                .ch-checkbox-item:hover {
                    background: rgba(255,255,255,0.04);
                    color: #fff;
                }
                .ch-checkbox-item.selected {
                    background: rgba(6, 182, 212, 0.05);
                    border-color: var(--color-primary);
                    color: #fff;
                }
                .canvas-card {
                    background: #0b1528;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    padding: 8px;
                }
                .canvas-controls-bar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    align-items: center;
                    margin-top: 8px;
                    padding: 8px;
                    background: rgba(0,0,0,0.2);
                    border-radius: var(--radius-sm);
                }
                .canvas-btn {
                    padding: 6px 12px;
                    font-size: 11px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                    color: #fff;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .canvas-btn:hover {
                    background: rgba(255,255,255,0.08);
                }
                .canvas-btn.active {
                    background: var(--color-primary-container);
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                }
                .compliance-badge-pulse {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--color-success);
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }
                .required-dot {
                    color: var(--color-error);
                    font-weight: bold;
                    margin-left: 2px;
                }
            `}</style>

            <div className="section-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-book-medical" style={{ color: 'var(--color-primary)' }}></i>
                    <h2>Clinical Case History + MSE Workstation</h2>
                </div>
                <div className="compliance-badge-pulse">
                    <i className="fa-solid fa-shield-halved"></i>
                    <span>EHR HIPAA VAULT</span>
                </div>
            </div>

            {/* Top Navigation Tabs */}
            <div className="ch-top-tab-bar">
                <button 
                    className={`ch-top-tab-btn ${activeMainTab === 'CaseHistory' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveMainTab('CaseHistory');
                        setActiveSubTab('PersonalInfo');
                    }}
                >
                    <i className="fa-solid fa-id-card"></i> 1. Case History (CH)
                </button>
                <button 
                    className={`ch-top-tab-btn ${activeMainTab === 'MSE' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveMainTab('MSE');
                        setActiveSubTab('MseAppearance');
                    }}
                >
                    <i className="fa-solid fa-brain"></i> 2. Mental Status Exam (MSE)
                </button>
                <button 
                    className={`ch-top-tab-btn ${activeMainTab === 'Formulation' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveMainTab('Formulation');
                        setActiveSubTab('FormulationFactors');
                    }}
                >
                    <i className="fa-solid fa-dna"></i> 3. Clinical Formulation & HPI
                </button>
            </div>

            <div className="ch-layout-grid">
                
                {/* Left Sub-Navigation Sidebar */}
                <div className="ch-left-nav">
                    <div className="workspace-card" style={{ padding: '12px' }}>
                        <h4 style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                            Sections
                        </h4>
                        
                        {activeMainTab === 'CaseHistory' && (
                            <ul className="ch-sub-nav-list">
                                <li className={`ch-sub-nav-item ${activeSubTab === 'PersonalInfo' ? 'active' : ''}`} onClick={() => setActiveSubTab('PersonalInfo')}>
                                    <span>Personal & Source Info</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'ChiefComplaints' ? 'active' : ''}`} onClick={() => setActiveSubTab('ChiefComplaints')}>
                                    <span>Chief Complaints</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'NegativeHistory' ? 'active' : ''}`} onClick={() => setActiveSubTab('NegativeHistory')}>
                                    <span>Negative History</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'PastHistory' ? 'active' : ''}`} onClick={() => setActiveSubTab('PastHistory')}>
                                    <span>Past Medical & Psychiatric</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'FamilyHistory' ? 'active' : ''}`} onClick={() => setActiveSubTab('FamilyHistory')}>
                                    <span>Family History & Genogram</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'PersonalHistoryBirth' ? 'active' : ''}`} onClick={() => setActiveSubTab('PersonalHistoryBirth')}>
                                    <span>Birth & Development</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'PersonalHistoryBehavior' ? 'active' : ''}`} onClick={() => setActiveSubTab('PersonalHistoryBehavior')}>
                                    <span>Childhood & Social</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'PremorbidPersonality' ? 'active' : ''}`} onClick={() => setActiveSubTab('PremorbidPersonality')}>
                                    <span>Premorbid Personality</span>
                                </li>
                            </ul>
                        )}

                        {activeMainTab === 'MSE' && (
                            <ul className="ch-sub-nav-list">
                                <li className={`ch-sub-nav-item ${activeSubTab === 'MseAppearance' ? 'active' : ''}`} onClick={() => setActiveSubTab('MseAppearance')}>
                                    <span>Appearance & Motor</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'MseSpeech' ? 'active' : ''}`} onClick={() => setActiveSubTab('MseSpeech')}>
                                    <span>Speech Characteristics</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'MseCognition' ? 'active' : ''}`} onClick={() => setActiveSubTab('MseCognition')}>
                                    <span>Cognitive & Intelligence</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'MseMood' ? 'active' : ''}`} onClick={() => setActiveSubTab('MseMood')}>
                                    <span>Mood & Affect</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'MseThought' ? 'active' : ''}`} onClick={() => setActiveSubTab('MseThought')}>
                                    <span>Thought Dynamics</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'MsePerception' ? 'active' : ''}`} onClick={() => setActiveSubTab('MsePerception')}>
                                    <span>Perceptual & Psychotic</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'MseJudgment' ? 'active' : ''}`} onClick={() => setActiveSubTab('MseJudgment')}>
                                    <span>Judgment & Insight</span>
                                </li>
                            </ul>
                        )}

                        {activeMainTab === 'Formulation' && (
                            <ul className="ch-sub-nav-list">
                                <li className={`ch-sub-nav-item ${activeSubTab === 'FormulationFactors' ? 'active' : ''}`} onClick={() => setActiveSubTab('FormulationFactors')}>
                                    <span>Case Formulation Factors</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'FormulationHpi' ? 'active' : ''}`} onClick={() => setActiveSubTab('FormulationHpi')}>
                                    <span>HPI & Modifying Factors</span>
                                </li>
                                <li className={`ch-sub-nav-item ${activeSubTab === 'FormulationAI' ? 'active' : ''}`} onClick={() => setActiveSubTab('FormulationAI')}>
                                    <span>AI Integration Summary</span>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>

                {/* Center Form Editor */}
                <div className="ch-center-editor">
                    
                    {/* --- TAB 1: CASE HISTORY SUB-SECTIONS --- */}
                    
                    {/* Personal & Source Info */}
                    {activeMainTab === 'CaseHistory' && activeSubTab === 'PersonalInfo' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Personal Profile Information</h3>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Name of individual<span className="required-dot">*</span></label>
                                    <input type="text" className="input-text-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Age<span className="required-dot">*</span></label>
                                    <input type="number" className="input-text-field" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                                </div>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">DOB<span className="required-dot">*</span></label>
                                    <input type="date" className="input-text-field" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Sex<span className="required-dot">*</span></label>
                                    <input type="text" className="input-text-field" placeholder="e.g. Male / Female / Intersex" value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} />
                                </div>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Gender<span className="required-dot">*</span></label>
                                    <input type="text" className="input-text-field" placeholder="e.g. Cisgender Male / Transgender Female / Non-binary" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Pronouns</label>
                                    <input type="text" className="input-text-field" placeholder="e.g. He/Him, She/Her, They/Them" value={formData.pronouns} onChange={e => setFormData({...formData, pronouns: e.target.value})} />
                                </div>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Education<span className="required-dot">*</span></label>
                                    <input type="text" className="input-text-field" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Occupation<span className="required-dot">*</span></label>
                                    <input type="text" className="input-text-field" value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} />
                                </div>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Socio-economic status<span className="required-dot">*</span></label>
                                    <select className="input-text-field" value={formData.socioEconomicStatus} onChange={e => setFormData({...formData, socioEconomicStatus: e.target.value})}>
                                        <option value="">Select status</option>
                                        <option value="Upper Class">Upper Class</option>
                                        <option value="Upper Middle Class">Upper Middle Class</option>
                                        <option value="Middle Class">Middle Class</option>
                                        <option value="Lower Middle Class">Lower Middle Class</option>
                                        <option value="Upper Lower Class">Upper Lower Class</option>
                                        <option value="Lower Class">Lower Class</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Marital/Relationship status<span className="required-dot">*</span></label>
                                    <select className="input-text-field" value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value})}>
                                        <option value="">Select status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Separated">Separated</option>
                                        <option value="Divorced">Divorced</option>
                                    </select>
                                </div>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Religion<span className="required-dot">*</span></label>
                                    <input type="text" className="input-text-field" value={formData.religion} onChange={e => setFormData({...formData, religion: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Residence<span className="required-dot">*</span></label>
                                    <select className="input-text-field" value={formData.residence} onChange={e => setFormData({...formData, residence: e.target.value})}>
                                        <option value="">Select residence</option>
                                        <option value="Urban">Urban</option>
                                        <option value="Rural">Rural</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Address<span className="required-dot">*</span></label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Language spoken as mother tongue<span className="required-dot">*</span></label>
                                    <input type="text" className="input-text-field" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Source of referral<span className="required-dot">*</span></label>
                                    <input type="text" className="input-text-field" value={formData.sourceOfReferral} onChange={e => setFormData({...formData, sourceOfReferral: e.target.value})} />
                                </div>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Type of admission, if admitted</label>
                                    <select className="input-text-field" value={formData.typeOfAdmission} onChange={e => setFormData({...formData, typeOfAdmission: e.target.value})}>
                                        <option value="">Select admission type</option>
                                        <option value="Voluntary Admission">Voluntary Admission</option>
                                        <option value="Supported Admission">Supported Admission</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Identification marks (Traceable/permanent, avoid common moles)</label>
                                    <input type="text" className="input-text-field" value={formData.identificationMarks} onChange={e => setFormData({...formData, identificationMarks: e.target.value})} />
                                </div>
                            </div>

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar">
                                <h3>Source of Information</h3>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Informant<span className="required-dot">*</span></label>
                                    <input type="text" className="input-text-field" value={formData.informant} onChange={e => setFormData({...formData, informant: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Intimacy of the informant to the patient</label>
                                    <input type="text" className="input-text-field" value={formData.informantIntimacy} onChange={e => setFormData({...formData, informantIntimacy: e.target.value})} />
                                </div>
                            </div>
                            <div className="ch-grid-form-col3">
                                <div className="form-field-group">
                                    <label className="form-label">Length of acquaintance with the patient</label>
                                    <input type="text" className="input-text-field" value={formData.informantAcquaintance} onChange={e => setFormData({...formData, informantAcquaintance: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Reliability of the information</label>
                                    <input type="text" className="input-text-field" value={formData.informantReliability} onChange={e => setFormData({...formData, informantReliability: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Adequacy of information</label>
                                    <select className="input-text-field" value={formData.informantAdequacy} onChange={e => setFormData({...formData, informantAdequacy: e.target.value})}>
                                        <option value="">Select adequacy</option>
                                        <option value="Sufficient">Sufficient</option>
                                        <option value="Insufficient">Insufficient</option>
                                    </select>
                                    <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
                                        (Assessment of whether info is sufficient for forming a diagnosis)
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chief Complaints */}
                    {activeMainTab === 'CaseHistory' && activeSubTab === 'ChiefComplaints' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Chief Complaints</h3>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Verbatim complaints (Quotes from patient/informant)<span className="required-dot">*</span></label>
                                <textarea className="input-text-field" style={{ minHeight: '100px' }} value={formData.verbatim} onChange={e => setFormData({...formData, verbatim: e.target.value})} />
                            </div>
                            <div className="ch-grid-form-col3">
                                <div className="form-field-group">
                                    <label className="form-label">Mode of onset<span className="required-dot">*</span></label>
                                    <select className="input-text-field" value={formData.modeOfOnset} onChange={e => setFormData({...formData, modeOfOnset: e.target.value})}>
                                        <option value="">Select onset mode</option>
                                        <option value="Abrupt (Sudden, within 48 hours e.g. Delirium)">Abrupt (Sudden, within 48 hours e.g. Delirium)</option>
                                        <option value="Acute (Rapid, within 2 weeks e.g. ATPD)">Acute (Rapid, within 2 weeks e.g. ATPD)</option>
                                        <option value="Insidious (Takes more than 2 weeks e.g. Schizophrenia)">Insidious (Takes more than 2 weeks e.g. Schizophrenia)</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Course of illness<span className="required-dot">*</span></label>
                                    <select className="input-text-field" value={formData.courseOfIllness} onChange={e => setFormData({...formData, courseOfIllness: e.target.value})}>
                                        <option value="">Select course</option>
                                        <option value="Continuous (Uninterrupted change without breaks)">Continuous (Uninterrupted change without breaks)</option>
                                        <option value="Episodic (On and off, with periods of recovery in between at least for a period of 2 months)">Episodic (On and off, with recovery period)</option>
                                        <option value="Fluctuating">Fluctuating</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Progress of illness</label>
                                    <select className="input-text-field" value={formData.progressOfIllness} onChange={e => setFormData({...formData, progressOfIllness: e.target.value})}>
                                        <option value="">Select progress</option>
                                        <option value="Improving- Improving from the date of onset e.g. Depression (with treatment)">Improving (from onset)</option>
                                        <option value="Deteriorating-Condition is getting worse by time e.g. Schizophrenia">Deteriorating (getting worse)</option>
                                        <option value="Static- Condition remains same no change happens e.g. Dysthymia">Static (no change)</option>
                                    </select>
                                </div>
                            </div>

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar">
                                <h3>Associated Disturbances</h3>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Sleep Associated disturbances</label>
                                    <input type="text" className="input-text-field" placeholder="e.g. Insomnia, Hypersomnia, sleep latency..." value={formData.sleepDisturbance} onChange={e => setFormData({...formData, sleepDisturbance: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Appetite associated disturbances</label>
                                    <select className="input-text-field" value={formData.appetiteDisturbance} onChange={e => setFormData({...formData, appetiteDisturbance: e.target.value})}>
                                        <option value="">Select change</option>
                                        <option value="Increases">Increases</option>
                                        <option value="Decreased">Decreased</option>
                                    </select>
                                </div>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Weight associated disturbances</label>
                                    <select className="input-text-field" value={formData.weightDisturbance} onChange={e => setFormData({...formData, weightDisturbance: e.target.value})}>
                                        <option value="">Select change</option>
                                        <option value="Increases">Increases</option>
                                        <option value="Decreased">Decreased</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Sexual life Associated disturbances</label>
                                    <input type="text" className="input-text-field" value={formData.sexualLifeDisturbance} onChange={e => setFormData({...formData, sexualLifeDisturbance: e.target.value})} />
                                </div>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Social life Associated disturbances</label>
                                    <input type="text" className="input-text-field" value={formData.socialLifeDisturbance} onChange={e => setFormData({...formData, socialLifeDisturbance: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Occupation Associated disturbances</label>
                                    <input type="text" className="input-text-field" value={formData.occupationDisturbance} onChange={e => setFormData({...formData, occupationDisturbance: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Negative History */}
                    {activeMainTab === 'CaseHistory' && activeSubTab === 'NegativeHistory' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Negative History (Rule out Organic Aetiology)</h3>
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                                Document negative findings to exclude physical/neurological causation (trauma, endocrine, etc.).
                            </p>

                            {[
                                { key: 'negTrauma', label: 'Trauma' },
                                { key: 'negHeadache', label: 'Headache' },
                                { key: 'negFever', label: 'Fever' },
                                { key: 'negVomiting', label: 'Vomiting' },
                                { key: 'negConfusion', label: 'Confusion' },
                                { key: 'negDisorientation', label: 'Disorientation' },
                                { key: 'negMemory', label: 'Memory Disturbance' },
                                { key: 'negHypertension', label: 'Hypertension' },
                                { key: 'negDiabetes', label: 'Diabetes' },
                                { key: 'negSubstance', label: 'Substance Abuse' }
                            ].map(item => (
                                <div key={item.key} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '220px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                        <input 
                                            type="checkbox" 
                                            className="checkbox-control" 
                                            checked={formData[item.key]} 
                                            onChange={e => setFormData({...formData, [item.key]: e.target.checked})} 
                                        />
                                        <span>{item.label} present?</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input-text-field" 
                                        style={{ margin: 0 }}
                                        placeholder={`Notes or descriptions regarding ${item.label.toLowerCase()}...`} 
                                        value={formData[item.key + 'Notes']} 
                                        onChange={e => setFormData({...formData, [item.key + 'Notes']: e.target.value})} 
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Past History */}
                    {activeMainTab === 'CaseHistory' && activeSubTab === 'PastHistory' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Past Clinical History</h3>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Past medical history<span className="required-dot">*</span></label>
                                <textarea className="input-text-field" style={{ minHeight: '100px' }} value={formData.pastMedicalHistory} onChange={e => setFormData({...formData, pastMedicalHistory: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Past psychiatric history<span className="required-dot">*</span></label>
                                <textarea className="input-text-field" style={{ minHeight: '100px' }} value={formData.pastParpsychiatricHistory || formData.pastPsychiatricHistory} onChange={e => setFormData({...formData, pastPsychiatricHistory: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Treatment history (include compliance)</label>
                                <textarea className="input-text-field" style={{ minHeight: '100px' }} value={formData.treatmentHistory} onChange={e => setFormData({...formData, treatmentHistory: e.target.value})} />
                            </div>
                        </div>
                    )}

                    {/* Family History & Genogram */}
                    {activeMainTab === 'CaseHistory' && activeSubTab === 'FamilyHistory' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Family History</h3>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Short family text summary<span className="required-dot">*</span></label>
                                    <textarea className="input-text-field" style={{ minHeight: '80px' }} value={formData.familyHistoryText} onChange={e => setFormData({...formData, familyHistoryText: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Consanguinity details<span className="required-dot">*</span></label>
                                    <textarea className="input-text-field" style={{ minHeight: '80px' }} placeholder="e.g. Yes/No, details of relation..." value={formData.consanguinity} onChange={e => setFormData({...formData, consanguinity: e.target.value})} />
                                </div>
                            </div>

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Interactive Genogram Builder<span className="required-dot">*</span></h3>
                                <button className="canvas-btn" style={{ color: 'var(--color-primary)' }} onClick={drawDemoGenogram}>
                                    <i className="fa-solid fa-magic"></i> Draw Demo Family Tree
                                </button>
                            </div>
                            
                            {/* Interactive Canvas Board */}
                            <div className="canvas-card">
                                <canvas 
                                    ref={canvasRef}
                                    width={500}
                                    height={240}
                                    style={{ display: 'block', width: '100%', height: '240px', background: '#0b1528', borderRadius: '8px', cursor: 'crosshair' }}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                
                                <div className="canvas-controls-bar">
                                    <button className={`canvas-btn ${drawTool === 'pen' ? 'active' : ''}`} onClick={() => setDrawTool('pen')}>
                                        <i className="fa-solid fa-pen"></i> Pen
                                    </button>
                                    <button className={`canvas-btn ${drawTool === 'eraser' ? 'active' : ''}`} onClick={() => setDrawTool('eraser')}>
                                        <i className="fa-solid fa-eraser"></i> Eraser
                                    </button>
                                    
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>Color:</span>
                                    <input 
                                        type="color" 
                                        value={drawColor} 
                                        onChange={e => setDrawColor(e.target.value)} 
                                        style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} 
                                    />

                                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>Width:</span>
                                    <select 
                                        value={lineWidth} 
                                        onChange={e => setLineWidth(Number(e.target.value))}
                                        style={{ background: '#1f2937', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '11px', color: '#fff', padding: '2px 4px' }}
                                    >
                                        <option value="1">1px</option>
                                        <option value="3">3px</option>
                                        <option value="5">5px</option>
                                        <option value="8">8px</option>
                                    </select>
                                    
                                    <button className="canvas-btn" onClick={clearCanvas} style={{ marginLeft: 'auto', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--color-error)' }}>
                                        <i className="fa-solid fa-trash-can"></i> Clear Draw
                                    </button>
                                </div>
                            </div>

                            <div className="ch-grid-form-col2" style={{ marginTop: '16px' }}>
                                <div className="form-field-group">
                                    <label className="form-label">Genogram Written Description</label>
                                    <textarea className="input-text-field" style={{ minHeight: '80px' }} placeholder="Describe structural links, symbols, or lineage details..." value={formData.genogramText} onChange={e => setFormData({...formData, genogramText: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Simulate Genogram Document Upload</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                        <button className="action-button-btn" onClick={triggerFileSelect} style={{ fontSize: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <i className="fa-solid fa-cloud-arrow-up"></i>
                                            <span>Upload Drawing File</span>
                                        </button>
                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            accept="image/*"
                                            style={{ display: 'none' }} 
                                            onChange={handleFileUpload} 
                                        />
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {formData.genogramFileName ? `Uploaded: ${formData.genogramFileName}` : 'No file selected (Supports PNG/JPG/SVG)'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Birth & Development */}
                    {activeMainTab === 'CaseHistory' && activeSubTab === 'PersonalHistoryBirth' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Birth and Early Development</h3>
                            </div>
                            <div className="ch-grid-form-col3">
                                <div className="form-field-group">
                                    <label className="form-label">Type of delivery<span className="required-dot">*</span></label>
                                    <select className="input-text-field" value={formData.typeOfDelivery} onChange={e => setFormData({...formData, typeOfDelivery: e.target.value})}>
                                        <option value="">Select delivery</option>
                                        <option value="Natural Birth">Natural Birth</option>
                                        <option value="Cesarean">Cesarean</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Term</label>
                                    <select className="input-text-field" value={formData.term} onChange={e => setFormData({...formData, term: e.target.value})}>
                                        <option value="">Select term</option>
                                        <option value="Early term">Early term</option>
                                        <option value="Full term">Full term</option>
                                        <option value="Late term">Late term</option>
                                        <option value="Postterm">Postterm</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Birthing facility</label>
                                    <select className="input-text-field" value={formData.birthingFacility} onChange={e => setFormData({...formData, birthingFacility: e.target.value})}>
                                        <option value="">Select facility</option>
                                        <option value="Hospital">Hospital</option>
                                        <option value="Home">Home</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="ch-grid-form-col2">
                                <div className="form-field-group" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                                        <input type="checkbox" className="checkbox-control" checked={formData.deliveryComplications === 'Yes'} onChange={e => setFormData({...formData, deliveryComplications: e.target.checked ? 'Yes' : 'No'})} />
                                        <span>Complications during delivery?<span className="required-dot">*</span></span>
                                    </label>
                                    <input type="text" className="input-text-field" placeholder="Specify complications..." style={{ marginTop: '8px', display: formData.deliveryComplications === 'Yes' ? 'block' : 'none' }} value={formData.deliveryComplicationsText} onChange={e => setFormData({...formData, deliveryComplicationsText: e.target.value})} />
                                </div>
                                
                                <div className="form-field-group" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                                        <input type="checkbox" className="checkbox-control" checked={formData.postnatalIllness === 'Yes'} onChange={e => setFormData({...formData, postnatalIllness: e.target.checked ? 'Yes' : 'No'})} />
                                        <span>Illness during postnatal period?<span className="required-dot">*</span></span>
                                    </label>
                                    <input type="text" className="input-text-field" placeholder="Specify postnatal illness..." style={{ marginTop: '8px', display: formData.postnatalIllness === 'Yes' ? 'block' : 'none' }} value={formData.postnatalIllnessText} onChange={e => setFormData({...formData, postnatalIllnessText: e.target.value})} />
                                </div>
                            </div>

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar">
                                <h3>Developmental Milestones</h3>
                            </div>
                            {['grossMotor', 'fineMotor', 'languageSkills', 'socialSkills', 'adaptiveSkills'].map(milestone => (
                                <div key={milestone} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>
                                        {milestone.replace(/([A-Z])/g, ' $1')}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {['Achieved', 'Unachieved', 'Delayed'].map(opt => (
                                            <button 
                                                key={opt}
                                                className={`canvas-btn ${formData[milestone] === opt ? 'active' : ''}`}
                                                onClick={() => setFormData({...formData, [milestone]: opt})}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Childhood & Social */}
                    {activeMainTab === 'CaseHistory' && activeSubTab === 'PersonalHistoryBehavior' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Behavior during childhood</h3>
                            </div>
                            
                            <div className="form-field-group">
                                <label className="form-label">Conduct issues during childhood</label>
                                <div className="ch-checkbox-grid">
                                    {['disobedience', 'lying', 'stealing', 'truancy', 'cruelty towards animals', 'bossy attitude', 'not obeying rules'].map(opt => {
                                        const isSel = (formData.childhoodConduct || []).includes(opt);
                                        return (
                                            <div 
                                                key={opt} 
                                                className={`ch-checkbox-item ${isSel ? 'selected' : ''}`}
                                                onClick={() => handleCheckboxArrayToggle('childhoodConduct', opt)}
                                            >
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                                <input type="text" className="input-text-field" placeholder="Additional childhood conduct notes..." style={{ marginTop: '8px' }} value={formData.childhoodConductNotes} onChange={e => setFormData({...formData, childhoodConductNotes: e.target.value})} />
                            </div>

                            <div className="form-field-group" style={{ marginTop: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                                    <input type="checkbox" className="checkbox-control" checked={formData.childhoodTemperTantrums} onChange={e => setFormData({...formData, childhoodTemperTantrums: e.target.checked})} />
                                    <span>Temper tantrums history?</span>
                                </label>
                                <input type="text" className="input-text-field" placeholder="Notes on temper tantrums..." style={{ marginTop: '8px', display: formData.childhoodTemperTantrums ? 'block' : 'none' }} value={formData.childhoodTemperTantrumsNotes} onChange={e => setFormData({...formData, childhoodTemperTantrumsNotes: e.target.value})} />
                            </div>

                            <div className="form-field-group" style={{ marginTop: '16px' }}>
                                <label className="form-label">Neurotic traits during childhood</label>
                                <div className="ch-checkbox-grid">
                                    {['nail-biting', 'thumb sucking', 'food-faddiness', 'stammering', 'mannerisms', 'bedwetting', 'phobias', 'night-terrors', 'sleep walking'].map(opt => {
                                        const isSel = (formData.childhoodNeuroticTraits || []).includes(opt);
                                        return (
                                            <div 
                                                key={opt} 
                                                className={`ch-checkbox-item ${isSel ? 'selected' : ''}`}
                                                onClick={() => handleCheckboxArrayToggle('childhoodNeuroticTraits', opt)}
                                            >
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                                <input type="text" className="input-text-field" placeholder="Additional childhood neurotic traits notes..." style={{ marginTop: '8px' }} value={formData.childhoodNeuroticTraitsNotes} onChange={e => setFormData({...formData, childhoodNeuroticTraitsNotes: e.target.value})} />
                            </div>

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar">
                                <h3>Educational, Marital, & Social Milestones</h3>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Relationship with parents, siblings and peers<span className="required-dot">*</span></label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.relationshipParentsSiblingsPeers} onChange={e => setFormData({...formData, relationshipParentsSiblingsPeers: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">School performance & dynamics</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} placeholder="Scholastic performance, attitude towards teachers, regularity, disciplinary issues..." value={formData.schoolPerformance} onChange={e => setFormData({...formData, schoolPerformance: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Occupation history</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} placeholder="Age of starting work, jobs held, work satisfaction, competence, future ambitions..." value={formData.occupationHistory} onChange={e => setFormData({...formData, occupationHistory: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Menstrual history (if applicable)</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} placeholder="Menarche, regularity of periods: dysmenorrhoea; menorrhagia / oligomenorrhea, emotional disturbance..." value={formData.menstrualHistory} onChange={e => setFormData({...formData, menstrualHistory: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Marital history</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.maritalHistory} onChange={e => setFormData({...formData, maritalHistory: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Substance use/abuse history</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.substanceUseHistory} onChange={e => setFormData({...formData, substanceUseHistory: e.target.value})} />
                            </div>
                        </div>
                    )}

                    {/* Premorbid Personality */}
                    {activeMainTab === 'CaseHistory' && activeSubTab === 'PremorbidPersonality' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Premorbid Personality (Baseline Character)</h3>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Attitude to others in social, family and sexual relationships<span className="required-dot">*</span></label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.premorbidAttitudeOthers} onChange={e => setFormData({...formData, premorbidAttitudeOthers: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Attitude to self</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.premorbidAttitudeSelf} onChange={e => setFormData({...formData, premorbidAttitudeSelf: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Moral and religious attitudes and standards</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.premorbidAttitudeMoral} onChange={e => setFormData({...formData, premorbidAttitudeMoral: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Mood baseline</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.premorbidMood} onChange={e => setFormData({...formData, premorbidMood: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Leisure activities and interests</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.premorbidLeisure} onChange={e => setFormData({...formData, premorbidLeisure: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Fantasy life</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.premorbidFantasy} onChange={e => setFormData({...formData, premorbidFantasy: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Reaction pattern to stress</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.premorbidStressReaction} onChange={e => setFormData({...formData, premorbidStressReaction: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Habits</label>
                                <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.premorbidHabits} onChange={e => setFormData({...formData, premorbidHabits: e.target.value})} />
                            </div>
                        </div>
                    )}
                    
                    {/* --- TAB 2: MENTAL STATUS EXAMINATION SUB-SECTIONS --- */}
                    
                    {/* MSE - Appearance & Motor */}
                    {activeMainTab === 'MSE' && activeSubTab === 'MseAppearance' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>General Appearance & Orientation</h3>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">General physical appearance</label>
                                    <select className="input-text-field" value={formData.msePhysicalAppearance} onChange={e => setFormData({...formData, msePhysicalAppearance: e.target.value})}>
                                        <option value="">Select appearance</option>
                                        <option value="Kempt :neat">Kempt : neat</option>
                                        <option value="Overtly made up: Flamboyant">Overtly made up: Flamboyant</option>
                                        <option value="Unkempt and untidy">Unkempt and untidy</option>
                                        <option value="Sickly: physically observable illness state">Sickly: physically observable illness state</option>
                                        <option value="Perplexed: confused">Perplexed: confused</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Estimate of age</label>
                                    <select className="input-text-field" value={formData.mseEstimateAge} onChange={e => setFormData({...formData, mseEstimateAge: e.target.value})}>
                                        <option value="">Select estimate</option>
                                        <option value="Appropriate to age">Appropriate to age</option>
                                        <option value="Younger that stated age">Younger than stated age</option>
                                        <option value="Older than stated age">Older than stated age</option>
                                    </select>
                                </div>
                            </div>
                            <div className="ch-grid-form-col3">
                                <div className="form-field-group">
                                    <label className="form-label">Body built</label>
                                    <select className="input-text-field" value={formData.mseBodyBuilt} onChange={e => setFormData({...formData, mseBodyBuilt: e.target.value})}>
                                        <option value="">Select body built</option>
                                        <option value="Pyknics (stocky, rounded shapes)">Pyknics (stocky, rounded shapes)</option>
                                        <option value="Leptosomes (long, linear physiques)">Leptosomes (long, linear physiques)</option>
                                        <option value="Athletics (broad-shouldered, muscular types)">Athletics (broad-shouldered, muscular types)</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Touch with surroundings</label>
                                    <select className="input-text-field" value={formData.mseTouchSurroundings} onChange={e => setFormData({...formData, mseTouchSurroundings: e.target.value})}>
                                        <option value="">Select touch</option>
                                        <option value="Present: Patient is oriented; ">Present: oriented</option>
                                        <option value="Partial: Some aspect of his surroundings or their significance to the patient is lost. ">Partial loss</option>
                                        <option value="Absent: Patient is unable to orient himself">Absent: disoriented</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Eye contact with examiner</label>
                                    <select className="input-text-field" value={formData.mseEyeContact} onChange={e => setFormData({...formData, mseEyeContact: e.target.value})}>
                                        <option value="">Select eye contact</option>
                                        <option value="Intact">Intact/Present</option>
                                        <option value="Partial: Fleeting eye contact with the examiner">Partial: Fleeting</option>
                                        <option value="Absent: complete loss of eye contact with the examiner">Absent: Complete loss</option>
                                    </select>
                                </div>
                            </div>

                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Dress</label>
                                    <select className="input-text-field" value={formData.mseDress} onChange={e => setFormData({...formData, mseDress: e.target.value})}>
                                        <option value="">Select dress appropriateness</option>
                                        <option value="Appropriate: Dress is properly worn,">Appropriate: properly worn</option>
                                        <option value="Shabby: Neglect or decreased care for dress ">Shabby: Neglected</option>
                                        <option value="Inappropriate: it is not done in conformity with the situation,">Inappropriate for setting</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Rapport</label>
                                    <select className="input-text-field" value={formData.mseRapport} onChange={e => setFormData({...formData, mseRapport: e.target.value})}>
                                        <option value="">Select rapport</option>
                                        <option value="Easily established">Easily established</option>
                                        <option value="Established with difficult">Established with difficulty</option>
                                        <option value="Not possible">Not possible</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-field-group">
                                <label className="form-label">Facial expression indicators</label>
                                <div className="ch-checkbox-grid">
                                    {['corners of mouth turned down', 'vertical furrows on the brow', 'creases on the forehead', 'widened palpebral fissures', 'dilated pupils', 'wooden expression'].map(opt => {
                                        const isSel = (formData.mseFacialExpression || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseFacialExpression', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="form-field-group">
                                <label className="form-label">Posture indicators</label>
                                <div className="ch-checkbox-grid">
                                    {['hunched shoulders', 'head and gaze inclined downwards', 'sitting on the edge of the chair with hands gripping its sides', 'touching their jewelry or picking at their fingernails', 'tremulous and restless', 'odd postures'].map(opt => {
                                        const isSel = (formData.msePosture || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('msePosture', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="form-field-group">
                                <label className="form-label">Attitude towards examiner</label>
                                <div className="ch-checkbox-grid">
                                    {['Co-operative', 'Attentive', 'Defensive', 'Frank', 'Hostile', 'Seductive', 'Guarded', 'Evasive'].map(opt => {
                                        const isSel = (formData.mseAttitudeExaminer || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseAttitudeExaminer', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar">
                                <h3>Motor Behaviour</h3>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label font-bold">Motor anomalies & behaviors detected</label>
                                <div className="ch-checkbox-grid">
                                    {[
                                        'Retardation', 'Hyperactive', 'Preoccupied', 'Mannerisms', 'Restless', 'Stereotypy', 
                                        'Grimace', 'Awkward', 'Destructive', 'Silly Smiling', 'Tics', 'Aggressive', 
                                        'Odd posturing', 'Rigidity', 'Touching the examiner', 'Gestures', 'Hallucinatory behaviour', 
                                        'Perseveration', 'Waxy Flexibility', 'Automatic obedience', 'Ambivalence', 'Echolalia', 
                                        'Echopraxia', 'Negativism', 'Dystonia', 'Dyskinesia', 'Chorea', 'Athetosis'
                                    ].map(opt => {
                                        const isSel = (formData.mseMotorBehaviour || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseMotorBehaviour', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                <span>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', display: 'block', marginTop: '6px' }}>
                                    Note: <strong>Automatic obedience</strong> = undue compliance irrespective of consequences. <strong>Ambivalence</strong> = coexistence of opposing impulses.
                                </span>
                                <input type="text" className="input-text-field" placeholder="Additional motor behavior remarks..." style={{ marginTop: '8px' }} value={formData.mseMotorBehaviourNotes} onChange={e => setFormData({...formData, mseMotorBehaviourNotes: e.target.value})} />
                            </div>
                        </div>
                    )}

                    {/* MSE - Speech */}
                    {activeMainTab === 'MSE' && activeSubTab === 'MseSpeech' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Speech Characteristics</h3>
                            </div>
                            <div className="ch-grid-form-col3">
                                <div className="form-field-group">
                                    <label className="form-label">Intensity</label>
                                    <select className="input-text-field" value={formData.mseSpeechIntensity} onChange={e => setFormData({...formData, mseSpeechIntensity: e.target.value})}>
                                        <option value="">Select intensity</option>
                                        <option value="Audible">Audible</option>
                                        <option value="Excessively loud">Excessively loud</option>
                                        <option value="Abnormally soft">Abnormally soft</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Pitch</label>
                                    <select className="input-text-field" value={formData.mseSpeechPitch} onChange={e => setFormData({...formData, mseSpeechPitch: e.target.value})}>
                                        <option value="">Select pitch</option>
                                        <option value="Monotonous">Monotonous</option>
                                        <option value="Variable/Normal">Variable / Normal</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Quality</label>
                                    <select className="input-text-field" value={formData.mseSpeechQuality} onChange={e => setFormData({...formData, mseSpeechQuality: e.target.value})}>
                                        <option value="">Select quality</option>
                                        <option value="Soft">Soft</option>
                                        <option value="Hoarse">Hoarse</option>
                                        <option value="Normal">Normal</option>
                                    </select>
                                </div>
                            </div>

                            <div className="ch-grid-form-col3">
                                <div className="form-field-group">
                                    <label className="form-label">Reaction Time</label>
                                    <select className="input-text-field" value={formData.mseSpeechReactionTime} onChange={e => setFormData({...formData, mseSpeechReactionTime: e.target.value})}>
                                        <option value="">Select reaction time</option>
                                        <option value="Increased reaction time">Increased reaction time</option>
                                        <option value="Decreased reaction time">Decreased reaction time</option>
                                        <option value="Normal">Normal</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Speed</label>
                                    <select className="input-text-field" value={formData.mseSpeechSpeed} onChange={e => setFormData({...formData, mseSpeechSpeed: e.target.value})}>
                                        <option value="">Select speed</option>
                                        <option value="Very slow">Very slow</option>
                                        <option value="Rapid">Rapid</option>
                                        <option value="Normal">Normal</option>
                                    </select>
                                </div>
                                <div className="form-field-group" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                                        <input type="checkbox" className="checkbox-control" checked={formData.mseSpeechPressure} onChange={e => setFormData({...formData, mseSpeechPressure: e.target.checked})} />
                                        <span>Pressure of speech?</span>
                                    </label>
                                </div>
                            </div>

                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Prosody (Vocal melody)</label>
                                    <input type="text" className="input-text-field" placeholder="Describe prosody details..." value={formData.mseSpeechProsody} onChange={e => setFormData({...formData, mseSpeechProsody: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Goal Direction</label>
                                    <input type="text" className="input-text-field" placeholder="e.g. Linear, circumstantial, flighty..." value={formData.mseSpeechGoalDirection} onChange={e => setFormData({...formData, mseSpeechGoalDirection: e.target.value})} />
                                </div>
                            </div>

                            <div className="ch-grid-form-col3">
                                <div className="form-field-group">
                                    <label className="form-label">Relevance</label>
                                    <select className="input-text-field" value={formData.mseSpeechRelevance} onChange={e => setFormData({...formData, mseSpeechRelevance: e.target.value})}>
                                        <option value="">Select relevance</option>
                                        <option value="Relevant">Relevant</option>
                                        <option value="Irrelevant">Irrelevant</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Coherence</label>
                                    <select className="input-text-field" value={formData.mseSpeechCoherence} onChange={e => setFormData({...formData, mseSpeechCoherence: e.target.value})}>
                                        <option value="">Select coherence</option>
                                        <option value="Coherent">Coherent</option>
                                        <option value="Incoherent speech">Incoherent speech</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Productivity</label>
                                    <select className="input-text-field" value={formData.mseSpeechProductivity} onChange={e => setFormData({...formData, mseSpeechProductivity: e.target.value})}>
                                        <option value="">Select productivity</option>
                                        <option value="Increased productivity/overabundant">Increased productivity/overabundant</option>
                                        <option value="Decreased Productivity/scant speech">Decreased Productivity/scant speech</option>
                                        <option value="Normal">Normal</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-field-group">
                                <label className="form-label">Ease of speech indicators</label>
                                <div className="ch-checkbox-grid">
                                    {['Hesitant', 'Mutism', 'Slurring', 'Stuttering/Stammering', 'Whispering', 'Muttering', 'Speaking only when questioned'].map(opt => {
                                        const isSel = (formData.mseSpeechEase || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseSpeechEase', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Manner of relating</label>
                                    <select className="input-text-field" value={formData.mseSpeechMannerRelating} onChange={e => setFormData({...formData, mseSpeechMannerRelating: e.target.value})}>
                                        <option value="">Select manner</option>
                                        <option value="Excessively formal">Excessively formal</option>
                                        <option value="Tensed up">Tensed up</option>
                                        <option value="Inappropriately familiar">Inappropriately familiar</option>
                                        <option value="Disinterested">Disinterested</option>
                                        <option value="Normal">Normal</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Speech deviations / Thought flow associations</label>
                                    <div className="ch-checkbox-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        {['Rhyming', 'Punning', 'Talking past the point', 'Clang association', 'Stereotypy', 'Perseveration'].map(opt => {
                                            const isSel = (formData.mseSpeechDeviation || []).includes(opt);
                                            return (
                                                <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseSpeechDeviation', opt)}>
                                                    <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                    {opt}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MSE - Cognition */}
                    {activeMainTab === 'MSE' && activeSubTab === 'MseCognition' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Cognitive Functions</h3>
                            </div>
                            
                            {['Orientation', 'Attention', 'Concentration'].map(field => {
                                const stateKey = `mse${field}`;
                                return (
                                    <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{field}</span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {['Intact', 'Impaired', 'Altered', 'Disrupted', 'Deteriorated'].map(opt => (
                                                <button 
                                                    key={opt}
                                                    className={`canvas-btn ${formData[stateKey] === opt ? 'active' : ''}`}
                                                    onClick={() => setFormData({...formData, [stateKey]: opt})}
                                                    style={{ padding: '4px 10px', fontSize: '10px' }}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar">
                                <h3>Memory Assessment</h3>
                            </div>
                            {['ImmediateMemory', 'RecentMemory', 'RemoteMemory'].map(field => {
                                const stateKey = `mse${field}`;
                                return (
                                    <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{field.replace('Memory', ' Memory')}</span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {['Intact', 'Impaired', 'Altered', 'Disrupted', 'Deteriorated'].map(opt => (
                                                <button 
                                                    key={opt}
                                                    className={`canvas-btn ${formData[stateKey] === opt ? 'active' : ''}`}
                                                    onClick={() => setFormData({...formData, [stateKey]: opt})}
                                                    style={{ padding: '4px 10px', fontSize: '10px' }}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar">
                                <h3>Abstract Ability & Intelligence</h3>
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Abstract Ability</label>
                                <select className="input-text-field" value={formData.mseAbstractAbility} onChange={e => setFormData({...formData, mseAbstractAbility: e.target.value})}>
                                    <option value="">Select abstraction quality</option>
                                    <option value="Functional Thinking">Functional Thinking</option>
                                    <option value="Concrete thinking">Concrete thinking</option>
                                    <option value="Over Abstraction">Over Abstraction</option>
                                </select>
                            </div>

                            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '12px 0 8px 0' }}>
                                Intelligence Dimensions:
                            </p>
                            {['Comprehension', 'GeneralInformation', 'Vocabulary', 'Calculation'].map(field => {
                                const stateKey = `mse${field}`;
                                return (
                                    <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '500' }}>{field.replace('Information', ' Information')}</span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {['Intact', 'Impaired', 'Altered', 'Disrupted', 'Deteriorated'].map(opt => (
                                                <button 
                                                    key={opt}
                                                    className={`canvas-btn ${formData[stateKey] === opt ? 'active' : ''}`}
                                                    onClick={() => setFormData({...formData, [stateKey]: opt})}
                                                    style={{ padding: '3px 8px', fontSize: '9.5px' }}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* MSE - Mood & Affect */}
                    {activeMainTab === 'MSE' && activeSubTab === 'MseMood' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Mood & Affect</h3>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Objective mood classification</label>
                                    <select className="input-text-field" value={formData.mseMood} onChange={e => setFormData({...formData, mseMood: e.target.value})}>
                                        <option value="">Select mood</option>
                                        <option value="Depressive">Depressive</option>
                                        <option value="Hypomanic">Hypomanic</option>
                                        <option value="Manic">Manic</option>
                                        <option value="Euthymic">Euthymic</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Affect quality</label>
                                    <select className="input-text-field" value={formData.mseAffectQuality} onChange={e => setFormData({...formData, mseAffectQuality: e.target.value})}>
                                        <option value="">Select affect quality</option>
                                        {['Dysphoria', 'Anxious', 'Irritable', 'Depressed', 'Elevated', 'Euphoric', 'Elated', 'Exalted', 'Ecstatic', 'Euthymic'].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Subjective evaluation (Quotes from patient)</label>
                                    <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.mseAffectSubjective} onChange={e => setFormData({...formData, mseAffectSubjective: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Objective evaluation (Clinician notes)</label>
                                    <textarea className="input-text-field" style={{ minHeight: '60px' }} value={formData.mseAffectObjective} onChange={e => setFormData({...formData, mseAffectObjective: e.target.value})} />
                                </div>
                            </div>

                            <div className="ch-grid-form-col3">
                                <div className="form-field-group">
                                    <label className="form-label">Intensity of affect</label>
                                    <select className="input-text-field" value={formData.mseAffectIntensity} onChange={e => setFormData({...formData, mseAffectIntensity: e.target.value})}>
                                        <option value="">Select intensity</option>
                                        <option value="Shallow affect">Shallow affect</option>
                                        <option value="Blunted affect">Blunted affect</option>
                                        <option value="Flat affect">Flat affect</option>
                                        <option value="Normal">Normal</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Mobility of affect</label>
                                    <select className="input-text-field" value={formData.mseAffectMobility} onChange={e => setFormData({...formData, mseAffectMobility: e.target.value})}>
                                        <option value="">Select mobility</option>
                                        <option value="Constricted affect">Constricted affect</option>
                                        <option value="Fixed affect">Fixed affect</option>
                                        <option value="Labile affect">Labile affect</option>
                                        <option value="Normal">Normal</option>
                                    </select>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Range of affect</label>
                                    <select className="input-text-field" value={formData.mseAffectRange} onChange={e => setFormData({...formData, mseAffectRange: e.target.value})}>
                                        <option value="">Select range</option>
                                        <option value="Full Range">Full Range</option>
                                        <option value="Restricted range">Restricted range</option>
                                    </select>
                                </div>
                            </div>

                            <div className="ch-grid-form-col3">
                                <div className="form-field-group">
                                    <label className="form-label">Reactivity</label>
                                    <input type="text" className="input-text-field" value={formData.mseAffectReactivity} onChange={e => setFormData({...formData, mseAffectReactivity: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Communicability</label>
                                    <input type="text" className="input-text-field" value={formData.mseAffectCommunicability} onChange={e => setFormData({...formData, mseAffectCommunicability: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Appropriateness</label>
                                    <input type="text" className="input-text-field" value={formData.mseAffectAppropriateness} onChange={e => setFormData({...formData, mseAffectAppropriateness: e.target.value})} />
                                </div>
                            </div>

                            <div className="ch-grid-form-col3">
                                <div className="form-field-group" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                                        <input type="checkbox" className="checkbox-control" checked={formData.mseAffectParamimia} onChange={e => setFormData({...formData, mseAffectParamimia: e.target.checked})} />
                                        <span>Paramimia?</span>
                                    </label>
                                </div>
                                <div className="form-field-group" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                                        <input type="checkbox" className="checkbox-control" checked={formData.mseAffectParathymia} onChange={e => setFormData({...formData, mseAffectParathymia: e.target.checked})} />
                                        <span>Parathymia?</span>
                                    </label>
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Diurnal variation of affect</label>
                                    <select className="input-text-field" value={formData.mseAffectDiurnalVariation} onChange={e => setFormData({...formData, mseAffectDiurnalVariation: e.target.value})}>
                                        <option value="None">None</option>
                                        <option value="Worse in morning">Worse in morning</option>
                                        <option value="Worse in the evening">Worse in the evening</option>
                                        <option value="Worse at night">Worse at night</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MSE - Thought Dynamics */}
                    {activeMainTab === 'MSE' && activeSubTab === 'MseThought' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Thought Dynamics</h3>
                            </div>
                            
                            <div className="form-field-group" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                                <label className="form-label font-bold">Thought Stream (Flow of thoughts)</label>
                                <div className="ch-checkbox-grid">
                                    {[
                                        'Volubility', 'Acceleration', 'Pressured Speech', 'Flight of ideas', 
                                        'Prolixity', 'Retardation (bradyphrenia)', 'Poverty of speech', 'Tangentiality', 'Thought blocking'
                                    ].map(opt => {
                                        const isSel = (formData.mseThoughtStream || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseThoughtStream', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                <span>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', marginTop: '6px' }}>
                                    Note: <strong>Volubility</strong> = copious, coherent, pressured speech or uncontrollable talking.
                                </span>
                                <input type="text" className="input-text-field" placeholder="Notes on stream..." style={{ marginTop: '8px' }} value={formData.mseThoughtStreamNotes} onChange={e => setFormData({...formData, mseThoughtStreamNotes: e.target.value})} />
                            </div>

                            <div className="form-field-group" style={{ marginTop: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                                <label className="form-label font-bold">Thought Form (Formal Thought Disorder)</label>
                                <div className="ch-checkbox-grid">
                                    {[
                                        'Negative type', 'Positive type', 'Loosening of association', 
                                        'Talking past the point (vorbeireden)', 'Verbigeration (word salad/schizophasia/paraphrasia)', 'Derailment', 
                                        'Neologism', 'Over inclusion'
                                    ].map(opt => {
                                        const isSel = (formData.mseThoughtForm || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseThoughtForm', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                <span>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', marginTop: '6px' }}>
                                    Note: <strong>Negative type</strong> = loss of ability to think/produce concept. <strong>Positive type</strong> = false concept produced by blending incongruous elements.
                                </span>
                                <input type="text" className="input-text-field" placeholder="Notes on thought form..." style={{ marginTop: '8px' }} value={formData.mseThoughtFormNotes} onChange={e => setFormData({...formData, mseThoughtFormNotes: e.target.value})} />
                            </div>

                            <div className="form-field-group" style={{ marginTop: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                                <label className="form-label font-bold">Thought Possession</label>
                                <div className="ch-checkbox-grid">
                                    {[
                                        'Obsession: Own and ego-dystonic', 'Obsessional thoughts', 'Obsessional images', 'Obsessional ruminations', 
                                        'Obsessional doubts', 'Obsessional impulses', 'Obsessional phobias', 'Obsessional fear of illnesses', 
                                        'Obsessional slowness', 'Rumination', 'Compulsion', 'Thought alienation: Insertion', 'Thought alienation: Withdrawal', 
                                        'Thought alienation: Broadcasting', 'Thought alienation: Echo'
                                    ].map(opt => {
                                        const isSel = (formData.mseThoughtPossession || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseThoughtPossession', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                <span>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <input type="text" className="input-text-field" placeholder="Notes on possession..." style={{ marginTop: '8px' }} value={formData.mseThoughtPossessionNotes} onChange={e => setFormData({...formData, mseThoughtPossessionNotes: e.target.value})} />
                            </div>

                            <div className="form-field-group" style={{ marginTop: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                                <label className="form-label font-bold">Thought Content</label>
                                <div className="ch-checkbox-grid">
                                    {[
                                        'Worry', 'Phobia', 'Impulse', 'Somatic symptoms', 'Religious pre-occupations', 
                                        'Preoccupation with precipitating factor', 'Excessive day dreaming', 'Antisocial urges', 'Homicidal ideas', 
                                        'Philosophical ideas', 'Magical thinking', 'Depressive cognition', 'Idea of worthlessness', 
                                        'Ideas of helplessness', 'Ideas of hopelessness', 'Suicidal ideas', 'Death wishes', 'Deliberate self-harm (DSH)', 
                                        'self-injury (SI)', 'self- poisoning', 'Inflated self esteem'
                                    ].map(opt => {
                                        const isSel = (formData.mseThoughtContent || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseThoughtContent', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                <span>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <input type="text" className="input-text-field" placeholder="Notes on thought content..." style={{ marginTop: '8px' }} value={formData.mseThoughtContentNotes} onChange={e => setFormData({...formData, mseThoughtContentNotes: e.target.value})} />
                            </div>

                            <div className="form-field-group" style={{ marginTop: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                                <label className="form-label font-bold">Delusions & Overvalued Ideas</label>
                                <div className="ch-checkbox-grid">
                                    {[
                                        'Primary delusion', 'delusional mood', 'sudden delusional idea (delusional intuition)', 'delusional perception', 
                                        'Delusional memories', 'Delusional Misinterpretation', 'Secondary delusion', 'Delusion of Reference', 
                                        'Delusions of Persecution', 'Delusion of control', 'Delusions of infidelity', 'Delusions of love', 
                                        'Grandiose delusions', 'Delusion of grandiose ability', 'Delusion of grandiose identity', 'Delusion of grandiose mission', 
                                        'Delusions of ill health', 'Delusions of guilt', 'Nihilistic delusions', 'Delusions of enormity', 
                                        'Delusions of poverty', 'Hypochondriacal delusions', 'Bizarre delusions', 'Overvalued idea'
                                    ].map(opt => {
                                        const isSel = (formData.mseThoughtDelusion || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseThoughtDelusion', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                <span>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <input type="text" className="input-text-field" placeholder="Notes on delusions..." style={{ marginTop: '8px' }} value={formData.mseThoughtDelusionNotes} onChange={e => setFormData({...formData, mseThoughtDelusionNotes: e.target.value})} />
                            </div>
                        </div>
                    )}

                    {/* MSE - Perceptual & Psychotic */}
                    {activeMainTab === 'MSE' && activeSubTab === 'MsePerception' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Perceptual Disorders</h3>
                            </div>
                            
                            <div className="form-field-group" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                                <label className="form-label font-bold">Sensory distortion</label>
                                <div className="ch-checkbox-grid">
                                    {[
                                        'Hyperaesthesia- increased intensity', 'Hyperacusis- increased sensitivity to noise', 'Hypoacusis- increased threshold',
                                        'Xanthopsia', 'Chloropsia', 'Erythropsia', 'Micropsia', 'Macropsia/ meglopsia', 'Parropsia'
                                    ].map(opt => {
                                        const isSel = (formData.msePerceptualSensoryDistortion || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('msePerceptualSensoryDistortion', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                <span>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <input type="text" className="input-text-field" placeholder="Notes on sensory distortions..." style={{ marginTop: '8px' }} value={formData.msePerceptualSensoryDistortionNotes} onChange={e => setFormData({...formData, msePerceptualSensoryDistortionNotes: e.target.value})} />
                            </div>

                            <div className="form-field-group" style={{ marginTop: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                                <label className="form-label font-bold">Sensory deception (Hallucinations & Illusions)</label>
                                <div className="ch-checkbox-grid">
                                    {[
                                        'Auditory hallucination', 'Visual hallucination', 'Olfactory hallucination', 
                                        'Gustatory hallucination', 'Tactile hallucination', 'Kinaesthetic hallucinations', 
                                        'Pseudo- hallucination', 'Functional hallucination', 'Reflex hallucinations', 
                                        'Extracampine hallucinations', 'Autoscopy (phantom mirror-image)', 'Fantastic illusions', 'Pareidolia'
                                    ].map(opt => {
                                        const isSel = (formData.msePerceptualSensoryDeception || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('msePerceptualSensoryDeception', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                <span>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <input type="text" className="input-text-field" placeholder="Notes on deceptions..." style={{ marginTop: '8px' }} value={formData.msePerceptualSensoryDeceptionNotes} onChange={e => setFormData({...formData, msePerceptualSensoryDeceptionNotes: e.target.value})} />
                            </div>

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar">
                                <h3>Other Psychotic Phenomena</h3>
                            </div>
                            <div className="form-field-group">
                                <div className="ch-checkbox-grid">
                                    {['Somatic passivity', 'Made phenomenon', 'Made act', 'Made affect', 'Made impulse'].map(opt => {
                                        const isSel = (formData.mseOtherPsychoticPhenomena || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseOtherPsychoticPhenomena', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                <span>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <input type="text" className="input-text-field" placeholder="Notes on passivity phenomena..." style={{ marginTop: '8px' }} value={formData.mseOtherPsychoticPhenomenaNotes} onChange={e => setFormData({...formData, mseOtherPsychoticPhenomenaNotes: e.target.value})} />
                            </div>

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar">
                                <h3>Other Phenomena (Depersonalization & Dissociation)</h3>
                            </div>
                            <div className="form-field-group">
                                <div className="ch-checkbox-grid">
                                    {[
                                        'Depersonalization', 'Derealization', 'Body image disturbance', 'Hyperschemazia', 
                                        'Aschemazia or hyposchemazia', 'Paraschemazia', 'Hemisomatognosia', 'Somatoparaphrenia', 
                                        'Paramnesia', 'Déjà vu', 'Jamais vu', 'Deja entendu', 'Confabulation', 
                                        'Retrospective falsification', 'Hyperamnesia', 'Positive False recognition', 'Negative False recognition'
                                    ].map(opt => {
                                        const isSel = (formData.mseOtherPhenomena || []).includes(opt);
                                        return (
                                            <div key={opt} className={`ch-checkbox-item ${isSel ? 'selected' : ''}`} onClick={() => handleCheckboxArrayToggle('mseOtherPhenomena', opt)}>
                                                <i className={`fa-solid ${isSel ? 'fa-square-check' : 'fa-square'}`}></i>
                                                <span>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', display: 'block', marginTop: '6px' }}>
                                    Note: <strong>Positive recognition</strong> = strangers viewed as friends. <strong>Negative recognition</strong> = friends viewed as strangers/disguised.
                                </span>
                                <input type="text" className="input-text-field" placeholder="Notes on other phenomena..." style={{ marginTop: '8px' }} value={formData.mseOtherPhenomenaNotes} onChange={e => setFormData({...formData, mseOtherPhenomenaNotes: e.target.value})} />
                            </div>
                        </div>
                    )}

                    {/* MSE - Judgment & Insight */}
                    {activeMainTab === 'MSE' && activeSubTab === 'MseJudgment' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Judgment Appraisal</h3>
                            </div>
                            {['Social', 'Personal', 'Test'].map(item => {
                                const stateKey = `mseJudgment${item}`;
                                return (
                                    <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{item} Judgment</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {['Intact', 'Impaired'].map(opt => (
                                                <button 
                                                    key={opt}
                                                    className={`canvas-btn ${formData[stateKey] === opt ? 'active' : ''}`}
                                                    onClick={() => setFormData({...formData, [stateKey]: opt})}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar">
                                <h3>Insight Assessment</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { grade: 'Grade-1', desc: 'Grade-1: Complete denial of illness.' },
                                    { grade: 'Grade-2', desc: 'Grade-2: Slight awareness of being sick and needing help, but denying at the same time.' },
                                    { grade: 'Grade-3', desc: 'Grade-3: Awareness of being sick, but it is attributed to external or physical factors.' },
                                    { grade: 'Grade-4', desc: 'Grade-4: Awareness of being sick, due to something unknown in self.' },
                                    { grade: 'Grade-5', desc: 'Grade-5: Intellectual insight- awareness of being ill & due to own irrational feelings/thoughts; yet doesn’t apply knowledge to future experiences.' },
                                    { grade: 'Grade-6', desc: 'Grade-6: True emotional insight- awareness leads to significant basic changes in the future behavior.' }
                                ].map(item => (
                                    <div 
                                        key={item.grade}
                                        className={`ch-checkbox-item ${formData.mseInsightGrade === item.grade ? 'selected' : ''}`}
                                        onClick={() => setFormData({...formData, mseInsightGrade: item.grade})}
                                        style={{ padding: '12px' }}
                                    >
                                        <i className={`fa-solid ${formData.mseInsightGrade === item.grade ? 'fa-circle-dot' : 'fa-circle'}`}></i>
                                        <span style={{ lineHeight: '1.4' }}>{item.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* --- TAB 3: CLINICAL FORMULATION SUB-SECTIONS --- */}
                    
                    {/* Case Formulation Factors */}
                    {activeMainTab === 'Formulation' && activeSubTab === 'FormulationFactors' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>Case Formulation (5P Factors)</h3>
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                                Map biological, psychological, and social causes following the clinical 5P Formulation framework.
                            </p>

                            <h4 style={{ fontSize: '12px', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px', marginBottom: '12px' }}>
                                1. Predisposing Factors
                            </h4>
                            <div className="form-field-group">
                                <label className="form-label">Biological Predisposing factors</label>
                                <textarea className="input-text-field" style={{ minHeight: '50px' }} value={formData.bioPredisposing} onChange={e => setFormData({...formData, bioPredisposing: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Psychological Predisposing factor (e.g. impaired premorbid personality)</label>
                                <textarea className="input-text-field" style={{ minHeight: '50px' }} value={formData.psychPredisposing} onChange={e => setFormData({...formData, psychPredisposing: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Social Predisposing factors (e.g. home atmosphere in childhood, neglect, abuse, low education)</label>
                                <textarea className="input-text-field" style={{ minHeight: '50px' }} value={formData.socialPredisposing} onChange={e => setFormData({...formData, socialPredisposing: e.target.value})} />
                            </div>

                            <h4 style={{ fontSize: '12px', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px', margin: '24px 0 12px 0' }}>
                                2. Precipitating Factors
                            </h4>
                            <div className="form-field-group">
                                <label className="form-label">Biological Precipitating factors (e.g. fever, accident, severe medical illness)</label>
                                <textarea className="input-text-field" style={{ minHeight: '50px' }} value={formData.bioPrecipitating} onChange={e => setFormData({...formData, bioPrecipitating: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Psychological Precipitating factors (e.g. stress intolerance, poor impulse control)</label>
                                <textarea className="input-text-field" style={{ minHeight: '50px' }} value={formData.psychPrecipitating} onChange={e => setFormData({...formData, psychPrecipitating: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Social Precipitating factors (e.g. trauma, loss of job/partner)</label>
                                <textarea className="input-text-field" style={{ minHeight: '50px' }} value={formData.socialPrecipitating} onChange={e => setFormData({...formData, socialPrecipitating: e.target.value})} />
                            </div>

                            <h4 style={{ fontSize: '12px', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px', margin: '24px 0 12px 0' }}>
                                3. Perpetuating Factors
                            </h4>
                            <div className="form-field-group">
                                <label className="form-label">Biological Perpetuating factors (e.g. chronic medical illness, substance use)</label>
                                <textarea className="input-text-field" style={{ minHeight: '50px' }} value={formData.bioPerpetuating} onChange={e => setFormData({...formData, bioPerpetuating: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Psychological Perpetuating factors (e.g. poor insight, poor impulse control, low intelligence)</label>
                                <textarea className="input-text-field" style={{ minHeight: '50px' }} value={formData.psychPerpetuating} onChange={e => setFormData({...formData, psychPerpetuating: e.target.value})} />
                            </div>
                            <div className="form-field-group">
                                <label className="form-label">Social Perpetuating factors (e.g. social isolation, unemployment, family expressed emotions)</label>
                                <textarea className="input-text-field" style={{ minHeight: '50px' }} value={formData.socialPerpetuating} onChange={e => setFormData({...formData, socialPerpetuating: e.target.value})} />
                            </div>
                        </div>
                    )}

                    {/* Formulation & HPI details */}
                    {activeMainTab === 'Formulation' && activeSubTab === 'FormulationHpi' && (
                        <div className="workspace-card">
                            <div className="card-title-bar">
                                <h3>History of Present Illness (HPI) & Symptoms</h3>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Specific Symptoms</label>
                                    <textarea className="input-text-field" style={{ minHeight: '80px' }} placeholder="Specify targeted clinical symptoms..." value={formData.specificSymptom} onChange={e => setFormData({...formData, specificSymptom: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Broader Diagnostic Category</label>
                                    <textarea className="input-text-field" style={{ minHeight: '80px' }} placeholder="Specify DSM/ICD category..." value={formData.broaderCategory} onChange={e => setFormData({...formData, broaderCategory: e.target.value})} />
                                </div>
                            </div>

                            <hr style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />

                            <div className="card-title-bar">
                                <h3>Modifying & Protective Factors</h3>
                            </div>
                            <div className="ch-grid-form-col2">
                                <div className="form-field-group">
                                    <label className="form-label">Limiting factors</label>
                                    <textarea className="input-text-field" style={{ minHeight: '80px' }} placeholder="e.g. cognitive reserve, high intellect..." value={formData.limitingFactors} onChange={e => setFormData({...formData, limitingFactors: e.target.value})} />
                                </div>
                                <div className="form-field-group">
                                    <label className="form-label">Modifying factors</label>
                                    <textarea className="input-text-field" style={{ minHeight: '80px' }} placeholder="e.g. strong family support, treatment compliance..." value={formData.modifyingFactors} onChange={e => setFormData({...formData, modifyingFactors: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Formulation Summary Integration */}
                    {activeMainTab === 'Formulation' && activeSubTab === 'FormulationAI' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="workspace-card">
                                <div className="card-title-bar">
                                    <h3>Synthesized Case Records & AI formulation Copilot</h3>
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                                    Synthesize all checklist items, personal history, MSE scores, and case formulation factors into a seamless, continuous clinical prose document.
                                </p>
                                
                                <button 
                                    className="action-button-btn" 
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    onClick={handleCompileFormulation}
                                    disabled={loadingAI}
                                >
                                    {loadingAI ? (
                                        <>
                                            <span className="loader-dual-ring"></span>
                                            Synthesizing Integrative Case Records...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-arrows-spin"></i>
                                            AI-Assist: Synthesize Integrative Formulation Document
                                        </>
                                    )}
                                </button>
                            </div>

                            {formData.aiFormulationNarrative && (
                                <div className="workspace-card">
                                    <div className="card-title-bar">
                                        <h3>Synthesized Record Narrative:</h3>
                                    </div>
                                    <div className="ai-formatted-report-block">
                                        <pre className="report-markdown-output" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                                            {formData.aiFormulationNarrative}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Progress & Quick Controls Sidebar */}
                <div className="ch-right-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="workspace-card">
                        <div className="card-title-bar">
                            <h3>Controls</h3>
                        </div>
                        
                        <div className="active-patient-badge" style={{ marginBottom: '12px' }}>
                            <span>Active Chart Target:</span>
                            <strong>{formData.name || 'Anonymous Patient'}</strong>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
                                Patient ID: #{activePatientId}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button 
                                className="action-button-btn" 
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => handleSave(false)}
                                disabled={isSaving}
                            >
                                <i className="fa-solid fa-floppy-disk"></i>
                                <span>Save Changes</span>
                            </button>

                            <button 
                                className="action-button-btn" 
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                                onClick={handlePreFill}
                            >
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                                <span>Pre-fill Demo Patient</span>
                            </button>

                            <button 
                                className="action-button-btn" 
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-error)' }}
                                onClick={handleReset}
                            >
                                <i className="fa-solid fa-rotate-left"></i>
                                <span>Reset Form</span>
                            </button>
                        </div>
                    </div>

                    {/* Patient Record Selector */}
                    <div className="workspace-card">
                        <div className="card-title-bar">
                            <h3>Chart Records</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {patients.map(p => (
                                <button 
                                    key={p.id}
                                    className={`patient-filter-chip ${p.id === activePatientId ? 'active' : ''}`}
                                    style={{ width: '100%', textAlign: 'left', margin: 0 }}
                                    onClick={() => onSetActivePatientId(p.id)}
                                >
                                    {p.name} (ID: {p.id})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {saveToast && (
                <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--color-success)', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.2s' }}>
                    <i className="fa-solid fa-circle-check" style={{ marginRight: '8px' }}></i>
                    Case history chart saved successfully.
                </div>
            )}
        </div>
    );
}
