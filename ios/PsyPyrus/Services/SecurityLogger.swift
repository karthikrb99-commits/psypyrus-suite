import Foundation

public class SecurityLogger {
    public static let shared = SecurityLogger()
    private init() {}
    
    public func createLog(action: String, details: String) -> SecurityAuditLog {
        return SecurityAuditLog(
            action: action,
            details: details,
            timestamp: Date(),
            actor: "Dr. Katherine Brewster (Admin)",
            ipAddress: "192.168.1.104",
            encryptionStandard: "AES-GCM-256"
        )
    }
}
