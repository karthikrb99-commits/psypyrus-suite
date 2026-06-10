import SwiftUI

public struct PremiumTheme {
    public static let bgDark = Color(red: 11/255, green: 13/255, blue: 25/255)
    public static let bgLight = Color(red: 248/255, green: 250/255, blue: 252/255)
    
    public static let cardDark = Color(red: 26/255, green: 29/255, blue: 51/255)
    public static let cardLight = Color.white
    
    public static let textPrimaryDark = Color.white
    public static let textPrimaryLight = Color(red: 15/255, green: 23/255, blue: 42/255)
    
    public static let textSecondaryDark = Color(red: 148/255, green: 163/255, blue: 184/255)
    public static let textSecondaryLight = Color(red: 71/255, green: 85/255, blue: 105/255)
    
    public static let clinicianPrimary = Color(red: 59/255, green: 130/255, blue: 246/255) // Blue
    public static let patientPrimary = Color(red: 20/255, green: 184/255, blue: 166/255) // Teal
    public static let accentYellow = Color(red: 212/255, green: 175/255, blue: 55/255) // Gold
    
    public static let success = Color(red: 16/255, green: 185/255, blue: 129/255)
    public static let warning = Color(red: 245/255, green: 158/255, blue: 11/255)
    public static let error = Color(red: 239/255, green: 68/255, blue: 68/255)
}

public struct GlassmorphicCard<Content: View>: View {
    public var isLight: Bool
    public var content: () -> Content
    
    public init(isLight: Bool, @ViewBuilder content: @escaping () -> Content) {
        self.isLight = isLight
        self.content = content
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 12, content: content)
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isLight ? PremiumTheme.cardLight : PremiumTheme.cardDark.opacity(0.85))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        LinearGradient(
                            colors: [
                                (isLight ? Color.black.opacity(0.06) : Color.white.opacity(0.12)),
                                Color.clear
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
            .shadow(color: isLight ? Color.black.opacity(0.04) : Color.clear, radius: 10, x: 0, y: 4)
    }
}

public struct PrimaryGradientButton: View {
    public var title: String
    public var icon: String? = nil
    public var isClinician: Bool
    public var action: () -> Void
    
    public init(title: String, icon: String? = nil, isClinician: Bool, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.isClinician = isClinician
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon = icon {
                    Image(systemName: icon)
                }
                Text(title)
                    .font(.headline)
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            colors: isClinician ? 
                                [PremiumTheme.clinicianPrimary, PremiumTheme.clinicianPrimary.opacity(0.8)] :
                                [PremiumTheme.patientPrimary, PremiumTheme.patientPrimary.opacity(0.8)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
            )
            .shadow(color: (isClinician ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary).opacity(0.3), radius: 8, x: 0, y: 4)
        }
    }
}

public struct StatusBadge: View {
    public var text: String
    public var type: BadgeType
    
    public enum BadgeType {
        case success, warning, error, info, normal
    }
    
    public init(text: String, type: BadgeType = .normal) {
        self.text = text
        self.type = type
    }
    
    public var body: some View {
        Text(text)
            .font(.caption2)
            .fontWeight(.bold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor.opacity(0.15))
            .foregroundColor(textColor)
            .cornerRadius(6)
    }
    
    private var backgroundColor: Color {
        switch type {
        case .success: return PremiumTheme.success
        case .warning: return PremiumTheme.warning
        case .error: return PremiumTheme.error
        case .info: return PremiumTheme.clinicianPrimary
        case .normal: return PremiumTheme.textSecondaryDark
        }
    }
    
    private var textColor: Color {
        switch type {
        case .success: return PremiumTheme.success
        case .warning: return PremiumTheme.warning
        case .error: return PremiumTheme.error
        case .info: return PremiumTheme.clinicianPrimary
        case .normal: return PremiumTheme.textSecondaryDark
        }
    }
}
