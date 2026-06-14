import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Load configuration from Vite environment variables with mock fallbacks
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth-domain",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DB_ID || "(default)";

const app = initializeApp(firebaseConfig);
// CRITICAL: The app will break without specifying the custom firestoreDatabaseId
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth();
export var OperationType;
(function (OperationType) {
    OperationType["CREATE"] = "create";
    OperationType["UPDATE"] = "update";
    OperationType["DELETE"] = "delete";
    OperationType["LIST"] = "list";
    OperationType["GET"] = "get";
    OperationType["WRITE"] = "write";
})(OperationType || (OperationType = {}));
export function handleFirestoreError(error, operationType, path) {
    const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous,
            tenantId: auth.currentUser?.tenantId,
            providerInfo: auth.currentUser?.providerData?.map((provider) => ({
                providerId: provider.providerId,
                email: provider.email,
            })) || [],
        },
        operationType,
        path,
    };
    console.error("Firestore Exception Logged: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
}
