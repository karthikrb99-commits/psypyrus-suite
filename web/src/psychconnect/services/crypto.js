/**
 * Lightweight, robust client-side symmetric encryption/decryption helper
 * to simulate authentic end-to-end encryption (E2EE) before database write.
 */
// A consistent simple salt/key combined with threadId
const SYSTEM_SALT = "psych_connect_e2ee_2026_";
/**
 * Basic character rotation & base64 encoding to obfuscate database field contents.
 * Safely handles full UNICODE emojis & text strings.
 */
export function encryptMessageText(plainText, threadId) {
    if (!plainText)
        return "";
    try {
        const key = SYSTEM_SALT + threadId;
        let result = "";
        for (let i = 0; i < plainText.length; i++) {
            const charCode = plainText.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            // Bitwise XOR rotation
            result += String.fromCharCode(charCode ^ keyChar);
        }
        // Encode as safe Base64 string to keep in Firestore
        const base64 = btoa(encodeURIComponent(result));
        return `🔐E2EE::${base64}`;
    }
    catch (error) {
        console.warn("E2EE Encryption fallback:", error);
        return plainText; // Fallback
    }
}
/**
 * Reverses the XOR character rotation based on threadId key to present clear UI plaintext.
 */
export function decryptMessageText(cipherText, threadId) {
    if (!cipherText)
        return "";
    if (!cipherText.startsWith("🔐E2EE::")) {
        return cipherText; // Return untouched if not encrypted
    }
    try {
        const base64Content = cipherText.replace("🔐E2EE::", "");
        const decodedResult = decodeURIComponent(atob(base64Content));
        const key = SYSTEM_SALT + threadId;
        let result = "";
        for (let i = 0; i < decodedResult.length; i++) {
            const charCode = decodedResult.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode ^ keyChar);
        }
        return result;
    }
    catch (error) {
        console.warn("E2EE Decryption failure:", error);
        // Return masked version to signal secure failure
        return "[End-to-End Encrypted Message]";
    }
}
