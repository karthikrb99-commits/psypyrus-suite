import { useState, useEffect, useRef } from 'react';
import { Database } from '../../services/db';
import { useToast } from '../ToastProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';

export function TherapeuticContracts({ activeRole, currentUser, patients = [], activePatientId = 1, onSetActivePatientId }) {
    const { showToast } = useToast();
    const isClinician = activeRole !== 'Patient';

    // State variables
    const [contracts, setContracts] = useState([]);
    const [selectedContract, setSelectedContract] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form fields for new contract
    const [newPatientId, setNewPatientId] = useState(activePatientId);
    const [newGoals, setNewGoals] = useState('');
    const [newFrequency, setNewFrequency] = useState('Weekly');
    const [newDuration, setNewDuration] = useState(50);
    const [newCancellation, setNewCancellation] = useState('24-Hour Notice Required');
    const [newExclusions, setNewExclusions] = useState('Standard legal exceptions (imminent danger to self/others, abuse indicators, subpoenas).');
    const [newBoundaries, setNewBoundaries] = useState('PsychConnect secure messages only. No personal text/social media. Use crisis services in emergencies.');
    
    // Negotiation States
    const [activeComment, setActiveComment] = useState('');
    const [isCountering, setIsCountering] = useState(false);
    const [counterFrequency, setCounterFrequency] = useState('Weekly');
    const [counterDuration, setCounterDuration] = useState(50);
    const [counterCancellation, setCounterCancellation] = useState('24-Hour Notice Required');
    const [counterGoals, setCounterGoals] = useState([]);
    const [newGoalInput, setNewGoalInput] = useState('');

    // Signature Pad States
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const [signatureType, setSignatureType] = useState('drawn'); // 'drawn' | 'typed'
    const [typedName, setTypedName] = useState('');
    const [hasDrawn, setHasDrawn] = useState(false);

    // Load contracts
    const loadContracts = () => {
        const all = Database.getTherapeuticContracts();
        setContracts(all);
        
        // Update selected contract references
        if (selectedContract) {
            const current = all.find(c => c.id === selectedContract.id);
            if (current) setSelectedContract(current);
        } else if (all.length > 0) {
            // Default select first contract matching active patient (if patient mode) or first in list
            const patientIdNum = Number(String(currentUser.id).replace('patient_', '')) || 1;
            const patientMatch = all.find(c => c.patientId === (isClinician ? activePatientId : patientIdNum));
            setSelectedContract(patientMatch || all[0]);
        }
    };

    useEffect(() => {
        loadContracts();
        window.addEventListener('psypyrus_db_change', loadContracts);
        return () => window.removeEventListener('psypyrus_db_change', loadContracts);
    }, [activePatientId, currentUser]);

    // Handle patient selection change (clinician dashboard sync)
    useEffect(() => {
        if (isClinician && activePatientId) {
            const all = Database.getTherapeuticContracts();
            const patientMatch = all.find(c => c.patientId === Number(activePatientId));
            if (patientMatch) {
                setSelectedContract(patientMatch);
            }
        }
    }, [activePatientId]);

    // Canvas Drawing Handlers
    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        
        ctx.strokeStyle = '#14b8a6'; // Teal 500
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        // Handle touch or mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        
        isDrawingRef.current = true;
    };

    const draw = (e) => {
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    // Database Actions
    const handleCreateContract = (e) => {
        e.preventDefault();
        const targetPatient = patients.find(p => p.id === Number(newPatientId));
        if (!targetPatient) {
            showToast("Invalid patient target.", "error");
            return;
        }

        const goalList = newGoals.split('\n').map(g => g.trim()).filter(g => g.length > 0);
        if (goalList.length === 0) {
            showToast("Please provide at least one clinical goal.", "error");
            return;
        }

        // Get active pricing details if available
        const pricingAgreements = Database.getPricingAgreements();
        const pricing = pricingAgreements.find(p => p.patientId === targetPatient.id && p.status === 'Approved');
        const finalFee = pricing ? pricing.proposedFee : 150;

        const newId = Database.createTherapeuticContract({
            patientId: targetPatient.id,
            patientName: targetPatient.name,
            professionalId: 'dr_liam',
            professionalName: 'Dr. Liam Carter',
            goals: goalList,
            sessionFrequency: newFrequency,
            sessionDuration: Number(newDuration),
            cancellationPolicy: newCancellation,
            confidentialityExclusions: newExclusions,
            communicationBoundaries: newBoundaries,
            proposedFee: finalFee,
            negotiationHistory: [
                { sender: 'Professional', message: 'Initial contract draft created.', timestamp: Date.now() }
            ]
        });

        if (newId) {
            showToast("Therapeutic contract draft created and sent to patient!", "success");
            setIsCreating(false);
            setNewGoals('');
            
            // Auto-select the newly created contract
            const updated = Database.getTherapeuticContracts();
            const created = updated.find(c => c.id === newId);
            if (created) setSelectedContract(created);
        }
    };

    const handleAddComment = (e) => {
        e.preventDefault();
        if (!activeComment.trim()) return;

        const updatedHistory = [
            ...(selectedContract.negotiationHistory || []),
            {
                sender: isClinician ? 'Professional' : 'Patient',
                message: activeComment.trim(),
                timestamp: Date.now()
            }
        ];

        const success = Database.updateTherapeuticContract(selectedContract.id, {
            negotiationHistory: updatedHistory,
            status: isClinician ? 'Pending Patient Review' : 'Countered'
        });

        if (success) {
            setActiveComment('');
            showToast("Comment added to negotiation timeline.", "success");
        }
    };

    const startCountering = () => {
        setCounterFrequency(selectedContract.sessionFrequency);
        setCounterDuration(selectedContract.sessionDuration);
        setCounterCancellation(selectedContract.cancellationPolicy);
        setCounterGoals([...selectedContract.goals]);
        setIsCountering(true);
    };

    const handleCounterProposal = (e) => {
        e.preventDefault();
        if (counterGoals.length === 0) {
            showToast("Please provide at least one clinical goal.", "error");
            return;
        }

        const logMsg = isClinician 
            ? "Clinician proposed revised contract terms." 
            : "Patient proposed revised contract terms.";

        const updatedHistory = [
            ...(selectedContract.negotiationHistory || []),
            {
                sender: isClinician ? 'Professional' : 'Patient',
                message: logMsg,
                timestamp: Date.now()
            }
        ];

        const success = Database.updateTherapeuticContract(selectedContract.id, {
            sessionFrequency: counterFrequency,
            sessionDuration: Number(counterDuration),
            cancellationPolicy: counterCancellation,
            goals: counterGoals,
            negotiationHistory: updatedHistory,
            status: isClinician ? 'Pending Patient Review' : 'Countered'
        });

        if (success) {
            setIsCountering(false);
            showToast("Counter terms proposed successfully.", "success");
        }
    };

    const handleSignContract = async () => {
        let sigData = '';
        if (signatureType === 'drawn') {
            if (!hasDrawn) {
                showToast("Please draw your signature first.", "error");
                return;
            }
            sigData = canvasRef.current.toDataURL();
        } else {
            if (!typedName.trim()) {
                showToast("Please type your name for the signature.", "error");
                return;
            }
            sigData = `[Typed Signature] ${typedName.trim()}`;
        }

        const updateFields = {};
        const timestamp = Date.now();

        if (isClinician) {
            updateFields.clinicianSignature = sigData;
            updateFields.clinicianSignedAt = timestamp;
        } else {
            updateFields.patientSignature = sigData;
            updateFields.patientSignedAt = timestamp;
        }

        // Add sign log
        const logMsg = isClinician 
            ? "Clinician signed the therapeutic contract." 
            : "Patient signed the therapeutic contract.";

        const updatedHistory = [
            ...(selectedContract.negotiationHistory || []),
            {
                sender: isClinician ? 'Professional' : 'Patient',
                message: logMsg,
                timestamp
            }
        ];
        updateFields.negotiationHistory = updatedHistory;

        // Check if both have signed
        const hasClinicianSig = isClinician ? !!sigData : !!selectedContract.clinicianSignature;
        const hasPatientSig = isClinician ? !!selectedContract.patientSignature : !!sigData;

        if (hasClinicianSig && hasPatientSig) {
            updateFields.status = 'Approved';
            
            // Calculate SHA-256 seal
            const tempContract = {
                ...selectedContract,
                ...updateFields
            };
            const dataStr = JSON.stringify({
                id: tempContract.id,
                goals: tempContract.goals,
                frequency: tempContract.sessionFrequency,
                duration: tempContract.sessionDuration,
                cancellation: tempContract.cancellationPolicy,
                boundaries: tempContract.communicationBoundaries,
                exclusions: tempContract.confidentialityExclusions,
                fee: tempContract.proposedFee,
                patientName: tempContract.patientName,
                professionalName: tempContract.professionalName
            });
            const msgBuffer = new TextEncoder().encode(dataStr);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const seal = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            updateFields.cryptographicSeal = seal;
        } else {
            updateFields.status = isClinician ? 'Pending Patient Review' : 'Countered';
        }

        const success = Database.updateTherapeuticContract(selectedContract.id, updateFields);
        if (success) {
            clearCanvas();
            setTypedName('');
            showToast(hasClinicianSig && hasPatientSig ? "Contract fully approved and cryptographically sealed!" : "Signature recorded.", "success");
        }
    };

    // PDF Exporter
    const handleDownloadPDF = () => {
        if (!selectedContract) return;

        try {
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const primaryColor = [20, 184, 166]; // Teal 500
            const darkSlate = [15, 23, 42]; // Slate 900
            const lightGray = [248, 250, 252]; // Slate 50
            const contentTextColor = [51, 65, 85]; // Slate 700
            const titleTextColor = [15, 23, 42]; // Slate 900
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Header band
            pdf.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
            pdf.rect(0, 0, pageWidth, 38, "F");

            // Teal band divider
            pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            pdf.rect(0, 38, pageWidth, 2, "F");

            // Header Texts
            pdf.setTextColor(255, 255, 255);
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(16);
            pdf.text("PSYPYRUS THERAPEUTIC ALLIANCE CONTRACT", 15, 16);
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(8.5);
            pdf.setTextColor(153, 246, 228); // Teal 200
            pdf.text("Clinical Agreement & Boundary Integration Cryptographic Dossier", 15, 22);

            pdf.setTextColor(255, 255, 255);
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(10);
            pdf.text("STATUS: SECURED & SEALED", pageWidth - 15, 16, { align: "right" });
            pdf.setFont("Helvetica", "oblique");
            pdf.setFontSize(8);
            pdf.setTextColor(253, 164, 175); // Rose 300
            pdf.text(`Agreement ID: PSC-${selectedContract.id.toString().padStart(4, '0')}`, pageWidth - 15, 22, { align: "right" });

            // Timestamp details
            pdf.setTextColor(255, 255, 255);
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(8);
            pdf.text(`Effective Date: ${new Date(selectedContract.date).toLocaleDateString()}`, 15, 31);
            pdf.text(`Compliance Standard: E-Sign Act Compliant`, pageWidth - 15, 31, { align: "right" });

            // Identity Summary Box
            pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
            pdf.rect(15, 48, pageWidth - 30, 22, "F");
            pdf.setDrawColor(226, 232, 240); // Slate 200
            pdf.rect(15, 48, pageWidth - 30, 22, "D");

            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(9);
            pdf.setTextColor(titleTextColor[0], titleTextColor[1], titleTextColor[2]);
            pdf.text("CONTRACTING PARTIES & BILLING DETAILS", 18, 54);

            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(8.5);
            pdf.setTextColor(contentTextColor[0], contentTextColor[1], contentTextColor[2]);
            pdf.text(`Clinician Name: ${selectedContract.professionalName}`, 18, 60);
            pdf.text(`Clinician ID: ${selectedContract.professionalId}`, 18, 65);
            pdf.text(`Client Name: ${selectedContract.patientName}`, pageWidth / 2 + 5, 60);
            pdf.text(`Session Fee: $${selectedContract.proposedFee} / session`, pageWidth / 2 + 5, 65);

            // Document Content Sections
            let currentY = 78;
            const printSectionHeader = (title) => {
                pdf.setFont("Helvetica", "bold");
                pdf.setFontSize(10.5);
                pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                pdf.text(title, 15, currentY);
                pdf.setDrawColor(20, 184, 166);
                pdf.setLineWidth(0.3);
                pdf.line(15, currentY + 1.5, pageWidth - 15, currentY + 1.5);
                currentY += 7;
            };

            const printSectionBody = (text, heightOffset = 6) => {
                pdf.setFont("Helvetica", "normal");
                pdf.setFontSize(8.5);
                pdf.setTextColor(contentTextColor[0], contentTextColor[1], contentTextColor[2]);
                
                const splitLines = pdf.splitTextToSize(text, pageWidth - 30);
                pdf.text(splitLines, 15, currentY);
                currentY += (splitLines.length * 4) + heightOffset;
            };

            // Section 1: Clinical Goals
            printSectionHeader("1. CLINICAL GOALS & AREAS OF THERAPEUTIC FOCUS");
            selectedContract.goals.forEach((goal, i) => {
                printSectionBody(`•  ${goal}`, 2);
            });
            currentY += 4;

            // Section 2: Frequency & Duration
            printSectionHeader("2. FREQUENCY & SESSION DURATION");
            const durationText = `Sessions are scheduled at a frequency of ${selectedContract.sessionFrequency} for a duration of ${selectedContract.sessionDuration} minutes per session. Consistent attendance is critical for clinical development.`;
            printSectionBody(durationText);

            // Section 3: Cancellation
            printSectionHeader("3. CANCELLATION & ATTENDANCE POLICIES");
            const cancellationText = `${selectedContract.cancellationPolicy}. Late cancellations (made outside this window) or no-show events will incur normal session fees, unless verified as clinical emergencies.`;
            printSectionBody(cancellationText);

            // Section 4: Boundaries
            printSectionHeader("4. COMMUNICATION BOUNDARIES & INTER-SESSION CONTACT");
            printSectionBody(selectedContract.communicationBoundaries);

            // Section 5: Confidentiality
            printSectionHeader("5. CONFIDENTIALITY LIMITATIONS & LEGAL EXCLUSIONS");
            printSectionBody(selectedContract.confidentialityExclusions);

            // Page Break for signatures if needed
            if (currentY > 230) {
                pdf.addPage();
                currentY = 25;
            } else {
                currentY += 8;
            }

            // Signatures Section
            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(11);
            pdf.setTextColor(titleTextColor[0], titleTextColor[1], titleTextColor[2]);
            pdf.text("ACKNOWLEDGEMENT & SECURE ELECTRONIC SIGN-OFF", 15, currentY);
            pdf.line(15, currentY + 1.5, pageWidth - 15, currentY + 1.5);
            currentY += 8;

            // Box for signatures
            pdf.setFillColor(248, 250, 252);
            pdf.rect(15, currentY, pageWidth - 30, 32, "F");
            pdf.rect(15, currentY, pageWidth - 30, 32, "D");

            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(8);
            pdf.setTextColor(titleTextColor[0], titleTextColor[1], titleTextColor[2]);
            
            pdf.text("CLINICIAN SIGNATURE", 20, currentY + 5);
            pdf.setFont("Helvetica", "normal");
            if (selectedContract.clinicianSignature.startsWith('data:image')) {
                pdf.addImage(selectedContract.clinicianSignature, 'PNG', 20, currentY + 7, 45, 14);
            } else {
                pdf.setFont("Courier", "italic");
                pdf.setFontSize(10);
                pdf.text(selectedContract.clinicianSignature || "Unsigned", 20, currentY + 14);
            }
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.text(`Signed At: ${selectedContract.clinicianSignedAt ? new Date(selectedContract.clinicianSignedAt).toLocaleString() : 'Pending'}`, 20, currentY + 28);

            pdf.setFont("Helvetica", "bold");
            pdf.setFontSize(8);
            pdf.text("PATIENT SIGNATURE", pageWidth / 2 + 10, currentY + 5);
            pdf.setFont("Helvetica", "normal");
            if (selectedContract.patientSignature.startsWith('data:image')) {
                pdf.addImage(selectedContract.patientSignature, 'PNG', pageWidth / 2 + 10, currentY + 7, 45, 14);
            } else {
                pdf.setFont("Courier", "italic");
                pdf.setFontSize(10);
                pdf.text(selectedContract.patientSignature || "Unsigned", pageWidth / 2 + 10, currentY + 14);
            }
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.text(`Signed At: ${selectedContract.patientSignedAt ? new Date(selectedContract.patientSignedAt).toLocaleString() : 'Pending'}`, pageWidth / 2 + 10, currentY + 28);

            currentY += 38;

            // Cryptographic seal at bottom
            if (selectedContract.cryptographicSeal) {
                pdf.setFillColor(20, 184, 166, 0.08);
                pdf.rect(15, currentY, pageWidth - 30, 12, "F");
                pdf.rect(15, currentY, pageWidth - 30, 12, "D");
                
                pdf.setFont("Courier", "bold");
                pdf.setFontSize(7.5);
                pdf.setTextColor(20, 184, 166);
                pdf.text(`SHA-256 CRYPTOGRAPHIC SEAL: ${selectedContract.cryptographicSeal}`, 18, currentY + 7);
            }

            pdf.save(`Therapeutic_Contract_PSC_${selectedContract.id.toString().padStart(4, '0')}.pdf`);
            showToast("Contract PDF exported and downloaded successfully!", "success");
        } catch (err) {
            console.error("PDF generation failed:", err);
            showToast("Failed to compile contract PDF: " + err.message, "error");
        }
    };

    // Filter patients contracts
    const patientIdVal = Number(String(currentUser.id).replace('patient_', '')) || 1;
    const filteredContracts = contracts.filter(c => {
        if (isClinician) {
            return c.patientId === Number(activePatientId);
        } else {
            return c.patientId === patientIdVal;
        }
    });

    const isFullySigned = selectedContract && selectedContract.clinicianSignature && selectedContract.patientSignature;

    return (
        <div className="therapeutic-contracts-screen p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
            
            {/* Screen Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-sans">
                        <i className="fa-solid fa-file-contract text-teal-400"></i>
                        Negotiable Therapeutic Contracts
                    </h1>
                    <p className="text-slate-400 text-sm font-sans mt-0.5">
                        Establish, comment, and counter-negotiate therapeutic alliance boundaries, goals, and rules of engagement.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isClinician && (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-teal-500/10 font-sans"
                        >
                            <i className="fa-solid fa-plus"></i>
                            Draft New Contract
                        </button>
                    )}
                    <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs rounded-full font-semibold font-sans">
                        {isClinician ? "Professional Workspace" : "Patient Access Panel"}
                    </span>
                </div>
            </div>

            {/* Creation Modal */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-white/10 p-6 rounded-xl w-full max-w-lg space-y-4 shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setIsCreating(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
                            >
                                <i className="fa-solid fa-times text-lg"></i>
                            </button>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 font-sans">
                                <i className="fa-solid fa-file-invoice text-teal-400"></i>
                                Draft Therapeutic Contract
                            </h3>
                            <form onSubmit={handleCreateContract} className="space-y-4 text-xs font-sans">
                                <div>
                                    <label className="text-slate-400 block mb-1">Target Patient</label>
                                    <select 
                                        value={newPatientId}
                                        onChange={(e) => setNewPatientId(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                                    >
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1">Session Frequency</label>
                                    <select 
                                        value={newFrequency}
                                        onChange={(e) => setNewFrequency(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                                    >
                                        <option value="Weekly">Weekly (Recommended)</option>
                                        <option value="Biweekly">Biweekly</option>
                                        <option value="Monthly">Monthly</option>
                                        <option value="Twice a Week">Twice a Week</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1">Session Duration (Minutes)</label>
                                    <input 
                                        type="number"
                                        value={newDuration}
                                        onChange={(e) => setNewDuration(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1">Cancellation Policy</label>
                                    <input 
                                        type="text"
                                        value={newCancellation}
                                        onChange={(e) => setNewCancellation(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1">Clinical Goals (one per line)</label>
                                    <textarea 
                                        rows={3}
                                        placeholder="e.g. Develop cognitive restructuring tools&#10;Implement somatic breathing exercises"
                                        value={newGoals}
                                        onChange={(e) => setNewGoals(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white font-sans"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 py-2 border border-white/10 hover:bg-white/5 text-white font-semibold rounded-lg cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-lg cursor-pointer"
                                    >
                                        Draft & Send
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content Workspace */}
            {contracts.length === 0 ? (
                <div className="bg-slate-900/40 border border-white/5 p-12 text-center rounded-xl font-sans">
                    <i className="fa-solid fa-folder-open text-slate-600 text-4xl mb-3 block"></i>
                    <h3 className="text-white font-medium">No Contracts Available</h3>
                    <p className="text-slate-400 text-xs mt-1">Please create a draft contract as professional to begin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
                    
                    {/* Left Column: Contract Paper Document Preview */}
                    <div className="lg:col-span-7 flex flex-col space-y-4">
                        
                        {/* Selector for clinicians */}
                        {isClinician && (
                            <div className="flex gap-2 bg-slate-900/60 border border-white/5 p-3 rounded-lg text-xs items-center justify-between">
                                <span className="text-slate-300 font-medium">Viewing Contract for:</span>
                                <select 
                                    value={activePatientId}
                                    onChange={(e) => onSetActivePatientId(Number(e.target.value))}
                                    className="bg-slate-950 border border-white/10 rounded px-3 py-1.5 text-white"
                                >
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedContract ? (
                            <div className="bg-slate-50 text-slate-800 shadow-2xl rounded-lg border border-slate-200 overflow-hidden relative font-serif">
                                
                                {/* Top Header Band */}
                                <div className="h-2 bg-teal-500 w-full"></div>

                                {/* Watermark or Sealed Logo overlay */}
                                {isFullySigned && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none opacity-5 border-4 border-teal-600 p-4 rounded text-3xl font-sans font-bold tracking-widest text-teal-600 uppercase rotate-12">
                                        PsyPyrus Alliance Sealed
                                    </div>
                                )}

                                {/* Main Document Content */}
                                <div className="p-8 space-y-6">
                                    <div className="text-center pb-4 border-b border-slate-200">
                                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide font-sans">Therapeutic Alliance & Boundary Agreement</h2>
                                        <p className="text-[10px] text-slate-500 font-sans tracking-widest uppercase mt-1">PsyPyrus Clinical Network Portal</p>
                                    </div>

                                    {/* Document Details Block */}
                                    <div className="grid grid-cols-2 gap-4 text-[10px] font-sans border-b border-slate-200 pb-4">
                                        <div>
                                            <span className="block font-bold text-slate-500 uppercase">Clinician</span>
                                            <span className="text-slate-800 text-sm font-semibold">{selectedContract.professionalName}</span>
                                            <span className="block text-slate-400">ID: {selectedContract.professionalId}</span>
                                        </div>
                                        <div>
                                            <span className="block font-bold text-slate-500 uppercase">Patient Client</span>
                                            <span className="text-slate-800 text-sm font-semibold">{selectedContract.patientName}</span>
                                            <span className="block text-slate-400">ID: {selectedContract.patientId}</span>
                                        </div>
                                    </div>

                                    {/* Section 1: Goals */}
                                    <div className="space-y-2 text-xs">
                                        <h3 className="font-bold text-teal-700 font-sans uppercase text-[11px] tracking-wide">1. Clinical Goals & Focus Areas</h3>
                                        <ul className="list-disc pl-5 space-y-1 text-slate-700 leading-relaxed">
                                            {selectedContract.goals.map((goal, idx) => (
                                                <li key={idx}>{goal}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Section 2: Frequency & Duration */}
                                    <div className="space-y-2 text-xs">
                                        <h3 className="font-bold text-teal-700 font-sans uppercase text-[11px] tracking-wide">2. Scheduling & Session Duration</h3>
                                        <p className="text-slate-700 leading-relaxed">
                                            Therapy sessions shall take place at a frequency of <span className="font-semibold text-slate-900 underline">{selectedContract.sessionFrequency}</span> for a duration of <span className="font-semibold text-slate-900 underline">{selectedContract.sessionDuration} minutes</span> per session.
                                        </p>
                                    </div>

                                    {/* Section 3: Fees & Billing */}
                                    <div className="space-y-2 text-xs">
                                        <h3 className="font-bold text-teal-700 font-sans uppercase text-[11px] tracking-wide">3. Session Fees & Financial Policy</h3>
                                        <p className="text-slate-700 leading-relaxed">
                                            The agreed fee for each session is <span className="font-semibold text-slate-900 font-sans underline">${selectedContract.proposedFee}.00 USD</span>. All fees must be settled upon conclusion of each session unless billing arrangements are configured in the Pricing Hub.
                                        </p>
                                    </div>

                                    {/* Section 4: Cancellation */}
                                    <div className="space-y-2 text-xs">
                                        <h3 className="font-bold text-teal-700 font-sans uppercase text-[11px] tracking-wide">4. Attendance & Cancellation Policy</h3>
                                        <p className="text-slate-700 leading-relaxed">
                                            This agreement requires a <span className="font-semibold text-slate-900 underline">{selectedContract.cancellationPolicy}</span>. Standard session fees will be applied to cancellations made outside of this window.
                                        </p>
                                    </div>

                                    {/* Section 5: Boundaries */}
                                    <div className="space-y-2 text-xs">
                                        <h3 className="font-bold text-teal-700 font-sans uppercase text-[11px] tracking-wide">5. Communication Boundaries</h3>
                                        <p className="text-slate-700 leading-relaxed">
                                            {selectedContract.communicationBoundaries}
                                        </p>
                                    </div>

                                    {/* Section 6: Exclusions */}
                                    <div className="space-y-2 text-xs font-sans text-slate-600 bg-slate-200/50 p-3 rounded border border-slate-300">
                                        <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wide block mb-1">Confidentiality Exclusions</h4>
                                        <p className="text-[10px] leading-relaxed">
                                            {selectedContract.confidentialityExclusions}
                                        </p>
                                    </div>

                                    {/* Sign-offs */}
                                    <div className="border-t border-slate-200 pt-6 mt-6 font-sans">
                                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Cryptographic Electronic Signatures</h4>
                                        
                                        <div className="grid grid-cols-2 gap-6">
                                            {/* Clinician Signature block */}
                                            <div className="border-b border-slate-300 pb-2 flex flex-col justify-between min-h-[60px]">
                                                <span className="text-[8px] text-slate-400 block uppercase">Clinician Signature</span>
                                                <div className="py-2 flex items-center justify-center">
                                                    {selectedContract.clinicianSignature ? (
                                                        selectedContract.clinicianSignature.startsWith('data:image') ? (
                                                            <img src={selectedContract.clinicianSignature} alt="Clinician Sig" className="max-h-10 object-contain" />
                                                        ) : (
                                                            <span className="font-mono italic text-teal-750 text-sm font-semibold">{selectedContract.clinicianSignature.replace('[Typed Signature] ', '')}</span>
                                                        )
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 tracking-wider">Unsigned</span>
                                                    )}
                                                </div>
                                                <span className="text-[8px] text-slate-400 block">
                                                    {selectedContract.clinicianSignedAt ? `Signed: ${new Date(selectedContract.clinicianSignedAt).toLocaleDateString()}` : ''}
                                                </span>
                                            </div>

                                            {/* Patient Signature block */}
                                            <div className="border-b border-slate-300 pb-2 flex flex-col justify-between min-h-[60px]">
                                                <span className="text-[8px] text-slate-400 block uppercase">Patient Signature</span>
                                                <div className="py-2 flex items-center justify-center">
                                                    {selectedContract.patientSignature ? (
                                                        selectedContract.patientSignature.startsWith('data:image') ? (
                                                            <img src={selectedContract.patientSignature} alt="Patient Sig" className="max-h-10 object-contain" />
                                                        ) : (
                                                            <span className="font-mono italic text-teal-750 text-sm font-semibold">{selectedContract.patientSignature.replace('[Typed Signature] ', '')}</span>
                                                        )
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 tracking-wider">Unsigned</span>
                                                    )}
                                                </div>
                                                <span className="text-[8px] text-slate-400 block">
                                                    {selectedContract.patientSignedAt ? `Signed: ${new Date(selectedContract.patientSignedAt).toLocaleDateString()}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cryptographic Hash Seal block */}
                                    {selectedContract.cryptographicSeal && (
                                        <div className="bg-slate-200 text-slate-650 border border-slate-300 p-2.5 rounded text-[8px] font-mono flex items-center gap-2 select-all leading-normal">
                                            <i className="fa-solid fa-lock text-teal-600 text-[10px]"></i>
                                            <div className="break-all font-semibold text-slate-700">
                                                SHA-256 SEAL: {selectedContract.cryptographicSeal}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-900/40 border border-white/5 p-12 text-center rounded-xl text-xs text-slate-400">
                                Select a contract to display details.
                            </div>
                        )}
                    </div>

                    {/* Right Column: Negotiation Sidebar & Timeline */}
                    <div className="lg:col-span-5 space-y-6">
                        {selectedContract && (
                            <div className="bg-slate-900/60 border border-white/5 p-6 rounded-xl space-y-6">
                                
                                {/* Status Header Widget */}
                                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                    <div>
                                        <span className="text-[10px] text-slate-550 uppercase font-bold tracking-wider block">Contract Status</span>
                                        <span className="text-white text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                                            <span className={`w-2 h-2 rounded-full ${isFullySigned ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                                            {selectedContract.status}
                                        </span>
                                    </div>
                                    {isFullySigned && (
                                        <button 
                                            onClick={handleDownloadPDF}
                                            className="px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 hover:text-white font-semibold text-xs rounded-lg flex items-center gap-2 cursor-pointer transition-all shadow-md"
                                        >
                                            <i className="fa-solid fa-file-pdf"></i>
                                            Download PDF
                                        </button>
                                    )}
                                </div>

                                {/* Step Timeline progress */}
                                <div className="relative pl-6 space-y-4 text-xs">
                                    <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-slate-800"></div>
                                    
                                    <div className="relative">
                                        <div className="absolute -left-[20px] top-[2px] w-2.5 h-2.5 bg-teal-500 border-2 border-slate-950 rounded-full"></div>
                                        <span className="text-white font-medium">1. Clinician Drafted</span>
                                    </div>
                                    
                                    <div className="relative">
                                        <div className={`absolute -left-[20px] top-[2px] w-2.5 h-2.5 border-2 border-slate-950 rounded-full ${selectedContract.negotiationHistory.length > 1 || isFullySigned ? 'bg-teal-500' : 'bg-slate-800'}`}></div>
                                        <span className={selectedContract.negotiationHistory.length > 1 || isFullySigned ? 'text-white font-medium' : 'text-slate-500'}>2. Negotiations & Counters</span>
                                    </div>

                                    <div className="relative">
                                        <div className={`absolute -left-[20px] top-[2px] w-2.5 h-2.5 border-2 border-slate-950 rounded-full ${isFullySigned ? 'bg-teal-500' : 'bg-slate-800'}`}></div>
                                        <span className={isFullySigned ? 'text-emerald-400 font-bold' : 'text-slate-500'}>3. Signed & Cryptographically Sealed</span>
                                    </div>
                                </div>

                                {/* Timeline comments feed */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Negotiation Log</h4>
                                    <div className="max-h-40 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                                        {(selectedContract.negotiationHistory || []).map((log, idx) => (
                                            <div key={idx} className="bg-slate-950/65 border border-white/5 p-2.5 rounded-lg text-[11px] space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span className={`font-semibold ${log.sender === 'Professional' ? 'text-teal-400' : 'text-purple-400'}`}>
                                                        {log.sender === 'Professional' ? 'Clinician' : 'Patient'}
                                                    </span>
                                                    <span className="text-[9px] text-slate-500 font-mono">
                                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-slate-300 leading-normal">{log.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Interaction Action Panel */}
                                {!isFullySigned && (
                                    <div className="space-y-4 border-t border-white/5 pt-4">
                                        
                                        {/* Counters form */}
                                        {isCountering ? (
                                            <form onSubmit={handleCounterProposal} className="space-y-3 bg-slate-955 p-4 rounded-lg border border-teal-500/10 text-xs">
                                                <h5 className="font-semibold text-white flex items-center gap-1.5">
                                                    <i className="fa-solid fa-sliders text-teal-400"></i>
                                                    Propose Counter-Terms
                                                </h5>
                                                
                                                <div>
                                                    <label htmlFor="counter-frequency" className="text-slate-400 block mb-1 font-semibold">Frequency</label>
                                                    <select 
                                                        id="counter-frequency"
                                                        value={counterFrequency}
                                                        onChange={(e) => setCounterFrequency(e.target.value)}
                                                        className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-white"
                                                    >
                                                        <option value="Weekly">Weekly</option>
                                                        <option value="Biweekly">Biweekly</option>
                                                        <option value="Monthly">Monthly</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label htmlFor="counter-duration" className="text-slate-400 block mb-1 font-semibold">Session Duration (Minutes)</label>
                                                    <select 
                                                        id="counter-duration"
                                                        value={counterDuration}
                                                        onChange={(e) => setCounterDuration(Number(e.target.value))}
                                                        className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-white"
                                                    >
                                                        <option value={45}>45 Minutes</option>
                                                        <option value={50}>50 Minutes</option>
                                                        <option value={60}>60 Minutes</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label htmlFor="counter-cancellation" className="text-slate-400 block mb-1 font-semibold">Cancellation Policy</label>
                                                    <input 
                                                        id="counter-cancellation"
                                                        type="text"
                                                        value={counterCancellation}
                                                        onChange={(e) => setCounterCancellation(e.target.value)}
                                                        className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-slate-400 block mb-1 font-semibold">Goals List</label>
                                                    <div className="space-y-1.5 mb-2">
                                                        {counterGoals.map((g, i) => (
                                                            <div key={i} className="flex justify-between items-center bg-slate-900 border border-white/5 px-2.5 py-1 rounded">
                                                                <span className="text-[10px] text-slate-300 truncate max-w-[200px]">{g}</span>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setCounterGoals(prev => prev.filter((_, idx) => idx !== i))}
                                                                    className="text-rose-400 hover:text-rose-350 text-[10px]"
                                                                >
                                                                    <i className="fa-solid fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2 font-sans">
                                                        <input 
                                                            type="text"
                                                            placeholder="Add new goal..."
                                                            value={newGoalInput}
                                                            onChange={(e) => setNewGoalInput(e.target.value)}
                                                            className="flex-grow bg-slate-900 border border-white/10 rounded px-2 py-1 text-white"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                if (newGoalInput.trim()) {
                                                                    setCounterGoals(prev => [...prev, newGoalInput.trim()]);
                                                                    setNewGoalInput('');
                                                                }
                                                            }}
                                                            className="px-2.5 py-1 bg-teal-500 hover:bg-teal-400 text-slate-955 font-semibold rounded"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setIsCountering(false)}
                                                        className="flex-1 py-1.5 border border-white/10 hover:bg-white/5 text-white font-semibold rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        type="submit"
                                                        className="flex-1 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded"
                                                    >
                                                        Propose Counter
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={startCountering}
                                                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-semibold text-xs rounded-lg cursor-pointer transition-all"
                                                >
                                                    <i className="fa-solid fa-edit text-teal-400 mr-1.5"></i>
                                                    Propose Counters
                                                </button>
                                            </div>
                                        )}

                                        {/* Comment input form */}
                                        <form onSubmit={handleAddComment} className="flex gap-2 text-xs">
                                            <input 
                                                type="text"
                                                placeholder="Ask questions or add remarks..."
                                                value={activeComment}
                                                onChange={(e) => setActiveComment(e.target.value)}
                                                className="flex-grow bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white"
                                            />
                                            <button 
                                                type="submit"
                                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white font-semibold rounded-lg cursor-pointer"
                                            >
                                                Comment
                                            </button>
                                        </form>

                                        {/* Signature Pad */}
                                        {((isClinician && !selectedContract.clinicianSignature) || (!isClinician && !selectedContract.patientSignature)) && (
                                            <div className="bg-slate-950 border border-white/10 p-4 rounded-lg space-y-3 text-xs">
                                                <h5 className="font-semibold text-white flex justify-between items-center">
                                                    <span>Draw or Type Signature</span>
                                                    <div className="flex gap-1.5 border border-white/5 p-0.5 rounded bg-slate-900">
                                                        <button 
                                                            onClick={() => setSignatureType('drawn')}
                                                            className={`px-2 py-0.5 rounded text-[10px] ${signatureType === 'drawn' ? 'bg-teal-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'}`}
                                                        >
                                                            Draw
                                                        </button>
                                                        <button 
                                                            onClick={() => setSignatureType('typed')}
                                                            className={`px-2 py-0.5 rounded text-[10px] ${signatureType === 'typed' ? 'bg-teal-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'}`}
                                                        >
                                                            Type
                                                        </button>
                                                    </div>
                                                </h5>

                                                {signatureType === 'drawn' ? (
                                                    <div className="space-y-2">
                                                        <canvas 
                                                            ref={canvasRef}
                                                            width={300}
                                                            height={100}
                                                            onMouseDown={startDrawing}
                                                            onMouseMove={draw}
                                                            onMouseUp={stopDrawing}
                                                            onMouseLeave={stopDrawing}
                                                            onTouchStart={startDrawing}
                                                            onTouchMove={draw}
                                                            onTouchEnd={stopDrawing}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-lg cursor-crosshair h-24"
                                                        />
                                                        <div className="flex justify-end">
                                                            <button 
                                                                onClick={clearCanvas}
                                                                className="text-slate-400 hover:text-rose-450 font-semibold text-[10px] cursor-pointer"
                                                            >
                                                                <i className="fa-solid fa-trash-can mr-1"></i>
                                                                Clear Signature
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2 font-sans">
                                                        <input 
                                                            type="text"
                                                            placeholder="Type full legal name..."
                                                            value={typedName}
                                                            onChange={(e) => setTypedName(e.target.value)}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                                                        />
                                                        {typedName.trim() && (
                                                            <div className="p-3 bg-slate-900 border border-white/5 rounded-lg text-center">
                                                                <span className="font-mono italic text-teal-400 text-lg tracking-wide">{typedName.trim()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <button 
                                                    onClick={handleSignContract}
                                                    className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-all shadow-lg shadow-teal-500/10 uppercase tracking-wider"
                                                >
                                                    Lock Agreement & Sign
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
