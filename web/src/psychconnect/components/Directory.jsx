import { useState } from "react";
import { Search, MapPin, Clock, Star, ShieldCheck, X, Check, CalendarDays, Percent } from "lucide-react";
import { Database } from "../../services/db";

export default function Directory({
    psychologists,
    currentUser,
    appointments,
    setAppointments,
    setActiveTab,
}) {
    // Search & Filter state
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("");

    // Booking states
    const [activePsychologist, setActivePsychologist] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [clinicalMessage, setClinicalMessage] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // Notification States
    const [optInSMS, setOptInSMS] = useState(false);
    const [optInPush, setOptInPush] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");

    // Sliding Scale states
    const [activePricingPsychologist, setActivePricingPsychologist] = useState(null);
    const [selectedTier, setSelectedTier] = useState("Student Sliding Scale");
    const [proposedFee, setProposedFee] = useState(60);
    const [patientIncome, setPatientIncome] = useState("");
    const [justification, setJustification] = useState("");
    const [simulatedFile, setSimulatedFile] = useState(null);
    const [slidingSuccess, setSlidingSuccess] = useState(false);

    // Specialties list
    const allSpecialties = Array.from(
        new Set(psychologists.flatMap((p) => p.specialty || []))
    );

    // Filter psychologists
    const filteredPsychs = psychologists.filter((psych) => {
        const matchesSearch =
            psych.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (psych.bio && psych.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (psych.specialty &&
                psych.specialty.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())));
        const matchesSpecialty =
            !selectedSpecialty || (psych.specialty && psych.specialty.includes(selectedSpecialty));
        return matchesSearch && matchesSpecialty;
    });

    // Handle slot reservation
    const handleCheckout = (e) => {
        e.preventDefault();
        if (!activePsychologist || !selectedDate || !selectedSlot) return;

        // Create custom appointment object
        const newAppointment = {
            id: "appt_" + Date.now(),
            patientId: currentUser.id,
            patientName: currentUser.name,
            psychologistId: activePsychologist.id,
            psychologistName: activePsychologist.name,
            psychologistAvatar: activePsychologist.avatar,
            psychologistSpecialty: activePsychologist.specialty?.[0] || "General Counseling",
            date: selectedDate,
            time: selectedSlot,
            status: "scheduled",
            chatHistory: [
                {
                    id: "sys1_" + Date.now(),
                    senderId: "system",
                    senderName: "System",
                    content: `Consultation secured on ${selectedDate} at ${selectedSlot}. Virtual clinic door activated.${
                        optInSMS ? ` SMS reminders active for ${phoneNumber || "your number"}.` : ""
                    }${optInPush ? " Device push notifications enabled." : ""}`,
                    timestamp: new Date().toISOString(),
                    isSystem: true,
                },
            ],
            clinicalNotes: clinicalMessage.trim() || undefined,
            notificationPreferences: {
                sms: optInSMS,
                push: optInPush,
                phone: optInSMS ? phoneNumber : undefined,
            },
        };

        setAppointments([newAppointment, ...appointments]);
        setBookingSuccess(true);

        // Reset wizard
        setTimeout(() => {
            setBookingSuccess(false);
            setActivePsychologist(null);
            setSelectedDate("");
            setSelectedSlot("");
            setClinicalMessage("");
            setOptInSMS(false);
            setOptInPush(false);
            setPhoneNumber("");
            setActiveTab("consultations"); // redirect to clinics instantly!
        }, 2200);
    };

    // Handle sliding scale submission
    const handleSlidingSubmit = (e) => {
        e.preventDefault();
        if (!justification.trim()) {
            window.dispatchEvent(
                new CustomEvent("psypyrus_toast", {
                    detail: { message: "Please provide a justification message.", type: "error" },
                })
            );
            return;
        }

        const patientIdStr = String(currentUser.id).replace("patient_", "");
        const finalFee = selectedTier.includes("Pro Bono") ? 0 : Number(proposedFee);

        const newId = Database.createPricingAgreement({
            patientId: Number(patientIdStr) || 1,
            patientName: currentUser.name || "Patient User",
            professionalId: activePricingPsychologist.id,
            professionalName: activePricingPsychologist.name,
            proposedFee: finalFee,
            tier: selectedTier,
            incomeDeclared: patientIncome ? Number(patientIncome) : null,
            message: justification,
            verificationFile: simulatedFile ? simulatedFile.name : null,
        });

        if (newId) {
            setSlidingSuccess(true);
            setTimeout(() => {
                setSlidingSuccess(false);
                setActivePricingPsychologist(null);
                setJustification("");
                setPatientIncome("");
                setSimulatedFile(null);
                window.dispatchEvent(
                    new CustomEvent("psypyrus_toast", {
                        detail: {
                            message: "Sliding scale request submitted to clinician!",
                            type: "success",
                        },
                    })
                );
                setActiveTab("Pricing Hub"); // Redirect to pricing hub screen
            }, 2000);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8" id="directory-container">
            <div className="text-center max-w-3xl mx-auto mb-10" id="directory-hero">
                <h1
                    className="text-3xl font-light text-slate-100 tracking-tight leading-none uppercase"
                    style={{ fontFamily: "Georgia, serif" }}
                >
                    Connect with Verified Clinical Experts
                </h1>
                <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                    Search directories of licensed clinical doctors and counselors. Enjoy secure
                    end-to-end simulated visual telehealth right inside PsychConnect.
                </p>
                <div
                    className="mt-8 flex flex-col sm:flex-row gap-3 bg-[#0D0D0F] p-3 rounded-2xl border border-white/5 shadow-lg"
                    id="filters-form"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            id="search-therapist-input"
                            type="text"
                            placeholder="Search by specialty, clinician name, bio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-0 placeholder-slate-500 text-slate-200"
                        />
                    </div>
                    <select
                        id="specialty-filter-select"
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        className="sm:w-60 bg-[#0A0A0C] border border-white/5 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-300 focus:outline-none cursor-pointer [color-scheme:dark]"
                    >
                        <option value="">All Specialties</option>
                        {allSpecialties.map((spec) => (
                            <option value={spec} key={spec}>
                                {spec}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="psychologist-cards-grid">
                {filteredPsychs.map((psych) => (
                    <div
                        key={psych.id}
                        id={`therapist-card-${psych.id}`}
                        className="bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg hover:border-indigo-500/30 transition-all flex flex-col text-left"
                    >
                        <div className="flex items-start space-x-4">
                            <img
                                src={psych.avatar}
                                alt={psych.name}
                                referrerPolicy="no-referrer"
                                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/5"
                            />
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center space-x-1">
                                    <h3 className="font-bold text-sm text-slate-200 leading-none">
                                        {psych.name}
                                    </h3>
                                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                                </div>
                                <p className="text-[11px] text-indigo-300 font-semibold">
                                    {psych.degree}
                                </p>
                                <div className="flex items-center space-x-1 text-xs text-amber-500 font-bold">
                                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                                    <span>{psych.ratingAverage?.toFixed(1) || "5.0"}</span>
                                    <span className="text-slate-500 text-[10px] font-normal">
                                        ({psych.ratings?.length || 1} Reviews)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-4">
                            {psych.specialty?.map((spec) => (
                                <span
                                    key={spec}
                                    className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                                >
                                    {spec}
                                </span>
                            ))}
                        </div>

                        <p className="text-xs text-slate-400 mt-4 leading-relaxed line-clamp-3">
                            {psych.bio}
                        </p>

                        <div className="mt-5 space-y-2.5 pt-4 border-t border-white/5 text-[11px] text-slate-400 flex-1 flex flex-col justify-end">
                            <div className="flex items-center space-x-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                <span className="line-clamp-1">{psych.location}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>{psych.experienceYears} Years Clinical Work</span>
                            </div>

                            <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="text-left font-mono">
                                        <span className="text-slate-500 text-[10px] block font-normal">
                                            Session Fee
                                        </span>
                                        <span className="text-sm font-bold text-slate-100">
                                            ${psych.fee}
                                        </span>
                                        <span className="text-slate-500 text-[10px] font-medium ml-0.5">
                                            / hr
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg">
                                        Sliding scale available
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        id={`schedule-btn-${psych.id}`}
                                        onClick={() => setActivePsychologist(psych)}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center space-x-1"
                                    >
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        <span>Schedule Spot</span>
                                    </button>
                                    <button
                                        id={`sliding-btn-${psych.id}`}
                                        onClick={() => {
                                            setActivePricingPsychologist(psych);
                                            setProposedFee(Math.round(psych.fee * 0.6));
                                        }}
                                        className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                                    >
                                        <Percent className="w-3.5 h-3.5" />
                                        <span>Apply Sliding</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredPsychs.length === 0 && (
                    <div
                        className="col-span-full py-16 text-center bg-[#0D0D0F]/30 rounded-2xl border border-dashed border-white/10"
                        id="no-search-results"
                    >
                        <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-sm font-bold text-slate-300">No Experts Found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            We couldn't find any psychologists matching your search patterns. Try
                            removing keywords or filter by specialties directly.
                        </p>
                    </div>
                )}
            </div>

            {/* Normal Booking Modal */}
            {activePsychologist && (
                <div
                    className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
                    id="booking-modal-overlay"
                >
                    <div
                        className="bg-[#0D0D0F] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/10 relative overflow-hidden text-left"
                        id="booking-modal-content"
                    >
                        {bookingSuccess && (
                            <div
                                className="absolute inset-0 bg-[#0A0A0C] z-50 flex flex-col items-center justify-center text-center p-6 animate-fade-in animate-pulse"
                                id="booking-success-box"
                            >
                                <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-full mb-4 border border-indigo-500/20">
                                    <Check className="w-8 h-8 animate-bounce" />
                                </div>
                                <h3
                                    className="text-lg font-light text-slate-100 uppercase tracking-widest"
                                    style={{ fontFamily: "Georgia, serif" }}
                                >
                                    Telehealth Secured!
                                </h3>
                                <p className="text-xs text-slate-400 mt-2 max-w-sm">
                                    Your appointment with{" "}
                                    <span className="font-bold text-indigo-400">
                                        {activePsychologist.name}
                                    </span>{" "}
                                    has been securely logged. Launching the secure video clinic
                                    consult window now!
                                </p>
                                {optInSMS && (
                                    <p className="text-[11px] text-emerald-400 mt-2 font-mono">
                                        ✓ SMS Integration: Armed alerts for{" "}
                                        {phoneNumber || "your number"}
                                    </p>
                                )}
                                {optInPush && (
                                    <p className="text-[11px] text-teal-400 mt-1 font-mono">
                                        ✓ Direct Push notifications enabled
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between items-start pb-3 border-b border-white/5">
                            <div>
                                <span className="text-[9px] uppercase tracking-wider font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-sm">
                                    Clinical Scheduling Wizard
                                </span>
                                <h3
                                    className="text-sm font-light text-slate-100 tracking-wide mt-2 uppercase"
                                    style={{ fontFamily: "Georgia, serif" }}
                                >
                                    Book Tele-session with {activePsychologist.name.split(",")[0]}
                                </h3>
                            </div>
                            <button
                                id="close-booking-btn"
                                onClick={() => setActivePsychologist(null)}
                                className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex space-x-3.5 bg-white/[0.02] p-3.5 rounded-xl border border-white/5 text-xs my-4">
                            <img
                                src={activePsychologist.avatar}
                                alt={activePsychologist.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-xl object-cover"
                            />
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-slate-200">
                                    {activePsychologist.name}
                                </h4>
                                <p className="text-indigo-300 font-medium text-[11px]">
                                    {activePsychologist.degree}
                                </p>
                                <span className="text-slate-500 text-[10px]">
                                    Licensed state provider • ${activePsychologist.fee}/hr
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleCheckout} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    1. Choose Date
                                </label>
                                <input
                                    id="booking-date"
                                    type="date"
                                    required
                                    min={new Date().toISOString().split("T")[0]}
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setSelectedSlot("");
                                    }}
                                    className="w-full bg-[#0A0A0C] text-slate-200 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none [color-scheme:dark]"
                                />
                            </div>

                            {selectedDate && (
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        2. Choose Telehealth Hour Slot
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {activePsychologist.availability
                                            ?.flatMap((av) => av.slots)
                                            .map((slot) => (
                                                <button
                                                    id={`slot-${slot.replace(/\s+/g, "-")}`}
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`py-1.5 px-2 text-[10px] font-bold border rounded-lg transition text-center cursor-pointer ${
                                                        selectedSlot === slot
                                                            ? "bg-indigo-600 text-white border-indigo-600"
                                                            : "bg-[#0A0A0C] text-slate-300 hover:bg-white/[0.04] border-white/5"
                                                    }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    3. Session Objectives & Focus Notes (Confidential)
                                </label>
                                <textarea
                                    id="booking-message-input"
                                    placeholder="Tell the psychologist about any triggers to optimize your consultation..."
                                    rows={2}
                                    value={clinicalMessage}
                                    onChange={(e) => setClinicalMessage(e.target.value)}
                                    className="w-full bg-[#0A0A0C] border border-white/10 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed resize-none"
                                />
                            </div>

                            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 space-y-3 text-left">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Session Notification Prefs
                                </span>
                                <div className="flex flex-col space-y-2">
                                    <label
                                        htmlFor="opt-in-push"
                                        className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none"
                                    >
                                        <input
                                            id="opt-in-push"
                                            type="checkbox"
                                            checked={optInPush}
                                            onChange={(e) => setOptInPush(e.target.checked)}
                                            className="rounded border-white/10 text-indigo-600 focus:ring-indigo-500 bg-[#0A0A0C] w-3.5 h-3.5 cursor-pointer"
                                        />
                                        <span>Opt-in to Device Push Notifications</span>
                                    </label>
                                    <label
                                        htmlFor="opt-in-sms"
                                        className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none"
                                    >
                                        <input
                                            id="opt-in-sms"
                                            type="checkbox"
                                            checked={optInSMS}
                                            onChange={(e) => setOptInSMS(e.target.checked)}
                                            className="rounded border-white/10 text-indigo-600 focus:ring-indigo-500 bg-[#0A0A0C] w-3.5 h-3.5 cursor-pointer"
                                        />
                                        <span>Opt-in to SMS Alerts</span>
                                    </label>
                                </div>

                                {optInSMS && (
                                    <div className="pl-5 pt-1 space-y-1 animate-fade-in">
                                        <label
                                            htmlFor="notification-phone"
                                            className="block text-[9px] text-slate-500 uppercase font-bold"
                                        >
                                            Enter Mobile Number
                                        </label>
                                        <input
                                            id="notification-phone"
                                            type="tel"
                                            placeholder="+1 (555) 019-2834"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            required={optInSMS}
                                            className="w-full bg-[#0A0A0C] text-slate-200 border border-white/15 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/10 rounded-xl space-y-1.5 text-xs text-indigo-300">
                                <span className="font-extrabold text-[9px] uppercase tracking-wider text-indigo-400 block font-mono">
                                    Simulated Secure Checkout
                                </span>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span>1 Hour Zoom Clinic Fee</span>
                                    <span className="font-bold text-slate-200">
                                        ${activePsychologist.fee}.00
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] pb-1 border-b border-white/5">
                                    <span>SSL Security & Taxes</span>
                                    <span className="text-slate-500 font-normal">
                                        Waived ($0.00)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-black pt-1">
                                    <span>To Be Charged</span>
                                    <span className="text-slate-100 font-mono font-bold">
                                        ${activePsychologist.fee}.00
                                    </span>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    id="cancel-booking-btn"
                                    type="button"
                                    onClick={() => setActivePsychologist(null)}
                                    className="flex-1 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition text-center text-xs cursor-pointer"
                                >
                                    Go Back
                                </button>
                                <button
                                    id="confirm-booking-btn"
                                    type="submit"
                                    disabled={!selectedDate || !selectedSlot}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl transition text-center text-xs cursor-pointer shadow-md"
                                >
                                    Confirm Tele-Session
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sliding Scale Request Modal */}
            {activePricingPsychologist && (
                <div
                    className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
                    id="sliding-modal-overlay"
                >
                    <div
                        className="bg-[#0D0D0F] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/10 relative overflow-hidden text-left animate-fade-in"
                        id="sliding-modal-content"
                    >
                        {slidingSuccess && (
                            <div
                                className="absolute inset-0 bg-[#0A0A0C] z-50 flex flex-col items-center justify-center text-center p-6 animate-pulse"
                                id="sliding-success-box"
                            >
                                <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full mb-4 border border-emerald-500/20">
                                    <Check className="w-8 h-8 font-extrabold text-emerald-400" />
                                </div>
                                <h3
                                    className="text-lg font-light text-slate-100 uppercase tracking-widest"
                                    style={{ fontFamily: "Georgia, serif" }}
                                >
                                    Application Logged!
                                </h3>
                                <p className="text-xs text-slate-400 mt-2 max-w-sm">
                                    Your sliding scale/pro bono request for{" "}
                                    <span className="font-bold text-emerald-400">
                                        {activePricingPsychologist.name}
                                    </span>{" "}
                                    has been submitted for review. Redirecting to Pricing Hub...
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between items-start pb-3 border-b border-white/5">
                            <div>
                                <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-sm">
                                    Sliding Scale Application
                                </span>
                                <h3
                                    className="text-sm font-light text-slate-100 tracking-wide mt-2 uppercase"
                                    style={{ fontFamily: "Georgia, serif" }}
                                >
                                    Apply with {activePricingPsychologist.name.split(",")[0]}
                                </h3>
                            </div>
                            <button
                                onClick={() => setActivePricingPsychologist(null)}
                                className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex space-x-3.5 bg-white/[0.02] p-3.5 rounded-xl border border-white/5 text-xs my-4">
                            <img
                                src={activePricingPsychologist.avatar}
                                alt={activePricingPsychologist.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-xl object-cover"
                            />
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-slate-200">
                                    {activePricingPsychologist.name}
                                </h4>
                                <span className="text-slate-500 text-[10px]">
                                    Standard Rate: ${activePricingPsychologist.fee}/hr
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSlidingSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        Select Tier
                                    </label>
                                    <select
                                        value={selectedTier}
                                        onChange={(e) => setSelectedTier(e.target.value)}
                                        className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/50"
                                    >
                                        <option value="Student Sliding Scale">
                                            Student Sliding Scale
                                        </option>
                                        <option value="Low-Income Sliding Scale">
                                            Low-Income Sliding Scale
                                        </option>
                                        <option value="Pro Bono Therapy">
                                            Pro Bono (Full Subsidy)
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        Declared Monthly Income ($)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="e.g. 1200"
                                        value={patientIncome}
                                        onChange={(e) => setPatientIncome(e.target.value)}
                                        className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/50"
                                    />
                                </div>
                            </div>

                            {!selectedTier.includes("Pro Bono") && (
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between">
                                        <span>Proposed Session Rate</span>
                                        <span className="text-emerald-400 font-bold">
                                            ${proposedFee}
                                        </span>
                                    </label>
                                    <input
                                        type="range"
                                        min="30"
                                        max={activePricingPsychologist.fee - 10}
                                        value={proposedFee}
                                        onChange={(e) => setProposedFee(Number(e.target.value))}
                                        className="w-full accent-emerald-500"
                                    />
                                    <span className="text-[10px] text-slate-500 block text-right">
                                        Min: $30 | Max: ${activePricingPsychologist.fee - 10}
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Justification / Proof & Statement
                                </label>
                                <textarea
                                    required
                                    placeholder="Please provide details about your financial situation, student status, or reason for requesting discounted therapy..."
                                    rows={3}
                                    value={justification}
                                    onChange={(e) => setJustification(e.target.value)}
                                    className="w-full bg-[#0A0A0C] border border-white/10 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Upload Proof (Optional)
                                </label>
                                <div className="border border-dashed border-white/10 rounded-xl p-3 text-center bg-white/[0.01]">
                                    <input
                                        type="file"
                                        id="sliding-proof-file"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setSimulatedFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="sliding-proof-file"
                                        className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                                    >
                                        {simulatedFile
                                            ? `✓ Selected: ${simulatedFile.name}`
                                            : "Choose Student ID or Income Statement PDF"}
                                    </label>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActivePricingPsychologist(null)}
                                    className="flex-1 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition text-center text-xs cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl transition text-center text-xs cursor-pointer shadow-md"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
