import SwiftUI

// MARK: - 🎨 Design Tokens
//
// 💡 INTERVIEW TALKING POINTS:
// • What are they? Design tokens are the smallest, indivisible pieces of a design system (colors, typography, spacing, border radii).
// • Why use them? Hardcoding values like `.padding(12)` or `Color(hex: "#FF0000")` across an app makes rebranding impossible. Tokens act as a single source of truth.
// • The Power of Propagation: If the company changes its primary brand color from Blue to Purple, a designer updates the `DSColor.primary` token once, and it instantly propagates to every button, link, and banner in the app.

// ==========================================
// 1. The Tokens (Usually generated from Figma)
// ==========================================
enum DSColor {
    static let primary = Color.blue
    static let secondary = Color.gray
    static let background = Color(UIColor.systemBackground)
    static let surface = Color(UIColor.secondarySystemBackground)
}

enum DSSpacing {
    static let small: CGFloat = 8
    static let medium: CGFloat = 16
    static let large: CGFloat = 24
}

enum DSTypography {
    static let headline = Font.headline.weight(.bold)
    static let body = Font.body
}

// ==========================================
// 2. The Consumer (Design System Component)
// ==========================================
struct DSButton: View {
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                // 🛡️ Notice there are NO hardcoded values here! Everything comes from tokens.
                .font(DSTypography.headline)
                .padding(DSSpacing.medium)
                .frame(maxWidth: .infinity)
                .background(DSColor.primary)
                .foregroundColor(.white)
                .cornerRadius(DSSpacing.small)
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How do design tokens actually get into the codebase?
//   A: At scale, tokens are often exported from Figma as JSON files. Engineering teams write scripts (or use tools like Style Dictionary) to auto-generate the `DSColor` and `DSSpacing` Swift structs during the build process, ensuring perfect parity with design.
// • Q: What happens if a developer uses a raw color instead of a token?
//   A: Ideally, a custom SwiftLint rule is set up in CI/CD to catch and fail the build if a developer types `.padding(8)` instead of `.padding(DSSpacing.small)`.
