import { collection, doc, setDoc, updateDoc, getDoc, getDocs, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../services/firebase";
import { MOCK_POSTS } from "./data";
// 1. Seed helper to instantiate default grounding posts if DB is newly empty
export async function seedDefaultPostsIfEmpty() {
    if (!auth.currentUser) {
        console.log("Optional seeding skipped: user is not authenticated.");
        return;
    }
    try {
        const postCol = collection(db, "posts");
        const snap = await getDocs(postCol);
        if (snap.empty) {
            console.log("Seeding default community grounding shares into database...");
            for (const p of MOCK_POSTS) {
                // Rewrite authorId to currentUser uid so it passes the Firestore security rules
                const ownedPost = {
                    ...p,
                    authorId: auth.currentUser.uid
                };
                await setDoc(doc(db, "posts", p.id), ownedPost);
            }
        }
    }
    catch (error) {
        console.info("Optional seeding skipped or unauthorized:", error);
    }
}
// 2. User Profiles Actions
export async function saveUserProfile(profile) {
    const path = `users/${profile.id}`;
    try {
        const userRef = doc(db, "users", profile.id);
        await setDoc(userRef, profile);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
}
export async function getUserProfile(userId) {
    const path = `users/${userId}`;
    try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            return snap.data();
        }
        return null;
    }
    catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        return null;
    }
}
// 3. Mental Health Feed Actions
export async function createPost(post) {
    const path = `posts/${post.id}`;
    try {
        const postRef = doc(db, "posts", post.id);
        await setDoc(postRef, post);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
}
export async function likePostInFirebase(postId, userId, isLiking) {
    const path = `posts/${postId}`;
    try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            likes: increment(isLiking ? 1 : -1),
            likedBy: isLiking ? arrayUnion(userId) : arrayRemove(userId)
        });
    }
    catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
    }
}
// 4. Clinical consultations / tele-appointments Actions
export async function createAppointmentInFirebase(appointment) {
    const path = `appointments/${appointment.id}`;
    try {
        const apptRef = doc(db, "appointments", appointment.id);
        await setDoc(apptRef, appointment);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
}
export async function addChatMessageToFirebase(appointmentId, newMessage) {
    const path = `appointments/${appointmentId}`;
    try {
        const apptRef = doc(db, "appointments", appointmentId);
        await updateDoc(apptRef, {
            chatHistory: arrayUnion(newMessage)
        });
    }
    catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
    }
}
export async function concludeAppointmentInFirebase(appointmentId, clinicalNotes, summaryPDF) {
    const path = `appointments/${appointmentId}`;
    try {
        const apptRef = doc(db, "appointments", appointmentId);
        await updateDoc(apptRef, {
            status: "completed",
            clinicalNotes,
            summaryPDF
        });
    }
    catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
    }
}
export async function updateAppointmentStatusInFirebase(appointmentId, status) {
    const path = `appointments/${appointmentId}`;
    try {
        const apptRef = doc(db, "appointments", appointmentId);
        await updateDoc(apptRef, { status });
    }
    catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
    }
}
// 5. Assigned Resources Actions
export async function assignResourceInFirebase(assigned) {
    const path = `assigned_resources/${assigned.id}`;
    try {
        const ref = doc(db, "assigned_resources", assigned.id);
        await setDoc(ref, assigned);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
}
export async function updateAssignedResourceCompletionInFirebase(assignedId, isCompleted, answers, patientReflections, completedAt) {
    const path = `assigned_resources/${assignedId}`;
    try {
        const ref = doc(db, "assigned_resources", assignedId);
        const updates = { isCompleted };
        if (answers)
            updates.answers = answers;
        if (patientReflections)
            updates.patientReflections = patientReflections;
        if (completedAt)
            updates.completedAt = completedAt;
        await updateDoc(ref, updates);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
    }
}
// 6. Direct In-App Chat Actions
export async function createChatThreadInFirebase(thread) {
    const path = `chats/${thread.id}`;
    try {
        const ref = doc(db, "chats", thread.id);
        await setDoc(ref, thread);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
}
export async function addDirectChatMessageInFirebase(threadId, msg, encryptedLatestMessage, latestMessageTime) {
    const msgPath = `chats/${threadId}/messages/${msg.id}`;
    const threadPath = `chats/${threadId}`;
    try {
        // 1. Write the message into subcollection
        const msgRef = doc(db, "chats", threadId, "messages", msg.id);
        await setDoc(msgRef, msg);
        // 2. Update thread metadata
        const threadRef = doc(db, "chats", threadId);
        await updateDoc(threadRef, {
            latestMessage: encryptedLatestMessage,
            latestMessageTime: latestMessageTime
        });
    }
    catch (err) {
        handleFirestoreError(err, OperationType.WRITE, msgPath);
    }
}
// 7. Clinical Progress Logging & Therapy Goals Actions
export async function createProgressLogInFirebase(log) {
    const path = `progress_logs/${log.id}`;
    try {
        const ref = doc(db, "progress_logs", log.id);
        await setDoc(ref, log);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
}
export async function createTherapyGoalInFirebase(goal) {
    const path = `therapy_goals/${goal.id}`;
    try {
        const ref = doc(db, "therapy_goals", goal.id);
        await setDoc(ref, goal);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
}
export async function updateTherapyGoalStatusInFirebase(goalId, status) {
    const path = `therapy_goals/${goalId}`;
    try {
        const ref = doc(db, "therapy_goals", goalId);
        await updateDoc(ref, { status });
    }
    catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
    }
}
export async function deleteTherapyGoalInFirebase(goalId) {
    const path = `therapy_goals/${goalId}`;
    try {
        const ref = doc(db, "therapy_goals", goalId);
        // Secure delete
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(ref);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
    }
}
// 8. Completed Appointment Feedback Saver
export async function saveAppointmentFeedbackInFirebase(appointmentId, feedback) {
    const path = `appointments/${appointmentId}`;
    try {
        const apptRef = doc(db, "appointments", appointmentId);
        await updateDoc(apptRef, { feedback });
    }
    catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
    }
}
// 9. Habit Tracker Actions
export async function createDailyHabitInFirebase(habit) {
    const path = `habits/${habit.id}`;
    try {
        const ref = doc(db, "habits", habit.id);
        await setDoc(ref, habit);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
}
export async function updateDailyHabitInFirebase(habitId, completedDays) {
    const path = `habits/${habitId}`;
    try {
        const ref = doc(db, "habits", habitId);
        await updateDoc(ref, { completedDays });
    }
    catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
    }
}
export async function deleteDailyHabitInFirebase(habitId) {
    const path = `habits/${habitId}`;
    try {
        const ref = doc(db, "habits", habitId);
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(ref);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
    }
}
// 10. Daily Journal Entries Actions
export async function createJournalEntryInFirebase(journal) {
    const path = `journals/${journal.id}`;
    try {
        const ref = doc(db, "journals", journal.id);
        await setDoc(ref, journal);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
}
// 11. Patient Problems Actions
export async function createPatientProblemInFirebase(problem) {
    const path = `problems/${problem.id}`;
    try {
        const ref = doc(db, "problems", problem.id);
        await setDoc(ref, problem);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
}
export async function addApproachToProblemInFirebase(problemId, approach) {
    const path = `problems/${problemId}`;
    try {
        const ref = doc(db, "problems", problemId);
        await updateDoc(ref, {
            approaches: arrayUnion(approach)
        });
    }
    catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
    }
}
export async function deletePatientProblemFromFirebase(problemId) {
    const path = `problems/${problemId}`;
    try {
        const ref = doc(db, "problems", problemId);
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(ref);
    }
    catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
    }
}
