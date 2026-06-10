import Foundation

public struct Patient: Identifiable, Codable {
    public var id: Int64
    public var name: String
    public var age: Int
    public var gender: String
    public var email: String
    public var phone: String
    public var riskStatus: String // "None", "Low", "Moderate", "Severe"
    public var specialty: String // e.g., "Depression", "Anxiety", "PTSD", "ADHD"
    public var registrationDate: Date
    
    public init(id: Int64 = 0, name: String, age: Int, gender: String, email: String, phone: String, riskStatus: String, specialty: String, registrationDate: Date = Date()) {
        self.id = id
        self.name = name
        self.age = age
        self.gender = gender
        self.email = email
        self.phone = phone
        self.riskStatus = riskStatus
        self.specialty = specialty
        self.registrationDate = registrationDate
    }
}

public struct Appointment: Identifiable, Codable {
    public var id: Int64
    public var patientId: Int64
    public var patientName: String
    public var dateTime: String // e.g., "Today, 10:00 AM"
    public var status: String // "Scheduled", "Completed", "Cancelled"
    public var notes: String
    public var fee: Double
    public var isVideo: BooleanLiteralType
    public var code: String // e.g. "PSY-PYR-992"
    
    public init(id: Int64 = 0, patientId: Int64, patientName: String, dateTime: String, status: String = "Scheduled", notes: String = "", fee: Double = 150.0, isVideo: Bool = true, code: String = "") {
        self.id = id
        self.patientId = patientId
        self.patientName = patientName
        self.dateTime = dateTime
        self.status = status
        self.notes = notes
        self.fee = fee
        self.isVideo = isVideo
        self.code = code
    }
}

public struct ClinicalNote: Identifiable, Codable {
    public var id: Int64
    public var patientId: Int64
    public var title: String
    public var noteType: String // "SOAP", "MSE", "PLAN", "GENERAL"
    public var bodyJson: String // Rich content or markdown text
    public var timestamp: Date
    public var isRiskAlert: Bool
    public var riskDisclaimer: String
    
    public init(id: Int64 = 0, patientId: Int64, title: String, noteType: String, bodyJson: String, timestamp: Date = Date(), isRiskAlert: Bool = false, riskDisclaimer: String = "AI-assisted note. Licensed practitioner has reviewed.") {
        self.id = id
        self.patientId = patientId
        self.title = title
        self.noteType = noteType
        self.bodyJson = bodyJson
        self.timestamp = timestamp
        self.isRiskAlert = isRiskAlert
        self.riskDisclaimer = riskDisclaimer
    }
}

public struct AssessmentScore: Identifiable, Codable {
    public var id: Int64
    public var patientId: Int64
    public var type: String // "PHQ-9", "GAD-7", "DASS-21"
    public var score: Int
    public var details: String // e.g. "Mild Depression"
    public var date: Date
    
    public init(id: Int64 = 0, patientId: Int64, type: String, score: Int, details: String, date: Date = Date()) {
        self.id = id
        self.patientId = patientId
        self.type = type
        self.score = score
        self.details = details
        self.date = date
    }
}

public struct MoodLog: Identifiable, Codable {
    public var id: Int64
    public var patientId: Int64
    public var moodScore: Int // 1 to 10
    public var moodNote: String
    public var gratitude: String
    public var breathingSeconds: Int
    public var date: Date
    
    public init(id: Int64 = 0, patientId: Int64 = 1, moodScore: Int, moodNote: String, gratitude: String = "", breathingSeconds: Int = 0, date: Date = Date()) {
        self.id = id
        self.patientId = patientId
        self.moodScore = moodScore
        self.moodNote = moodNote
        self.gratitude = gratitude
        self.breathingSeconds = breathingSeconds
        self.date = date
    }
}

public struct SecurityAuditLog: Identifiable, Codable {
    public var id: Int64
    public var action: String
    public var details: String
    public var timestamp: Date
    public var actor: String
    public var ipAddress: String
    public var encryptionStandard: String
    
    public init(id: Int64 = 0, action: String, details: String, timestamp: Date = Date(), actor: String = "Dr. Katherine Brewster (Admin)", ipAddress: String = "192.168.1.104", encryptionStandard: String = "AES-GCM-256") {
        self.id = id
        self.action = action
        self.details = details
        self.timestamp = timestamp
        self.actor = actor
        self.ipAddress = ipAddress
        self.encryptionStandard = encryptionStandard
    }
}

public struct HomeworkTask: Identifiable, Codable {
    public var id: Int64
    public var patientId: Int64
    public var description: String
    public var isCompleted: Bool
    public var assignedDate: Date
    
    public init(id: Int64 = 0, patientId: Int64, description: String, isCompleted: Bool = false, assignedDate: Date = Date()) {
        self.id = id
        self.patientId = patientId
        self.description = description
        self.isCompleted = isCompleted
        self.assignedDate = assignedDate
    }
}

public struct AppPlugin: Identifiable, Codable {
    public var id: String
    public var title: String
    public var category: String
    public var description: String
    public var price: String
    public var icon: String
    public var rating: Double
    public var installs: String
    public var isInstalled: Bool
    
    public init(id: String, title: String, category: String, description: String, price: String, icon: String, rating: Double, installs: String, isInstalled: Bool = false) {
        self.id = id
        self.title = title
        self.category = category
        self.description = description
        self.price = price
        self.icon = icon
        self.rating = rating
        self.installs = installs
        self.isInstalled = isInstalled
    }
}

public struct IcdSearchResult: Identifiable, Codable {
    public var id = UUID()
    public var code: String
    public var title: String
    public var uri: String
    
    public init(code: String, title: String, uri: String) {
        self.code = code
        self.title = title
        self.uri = uri
    }
}
