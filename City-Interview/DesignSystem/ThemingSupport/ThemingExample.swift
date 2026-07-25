import SwiftUI

// MARK: - 🎭 Theming Support
//
// 💡 INTERVIEW TALKING POINTS:
// • Why Environment Injection? If every component has an `if colorScheme == .dark` check inside it, the component becomes tightly coupled to Apple's system setting. Injecting a `Theme` via the `@Environment` keeps components dumb and highly flexible.
// • Multi-Brand / White-Labeling: Standard light/dark mode is just the beginning. Enterprise apps often ship the exact same codebase to different clients (e.g. Bank A and Bank B). A Theme protocol allows you to inject an entirely different color palette at the root of the app without changing a single line of component code.

// ==========================================
// 1. The Theme Protocol
// ==========================================
protocol AppTheme {
    var brandPrimary: Color { get }
    var cardBackground: Color { get }
    var textColor: Color { get }
}

struct DefaultLightTheme: AppTheme {
    let brandPrimary = Color.blue
    let cardBackground = Color.white
    let textColor = Color.black
}

struct DefaultDarkTheme: AppTheme {
    let brandPrimary = Color.cyan
    let cardBackground = Color(white: 0.15)
    let textColor = Color.white
}

// ==========================================
// 2. Environment Setup
// ==========================================
struct ThemeEnvironmentKey: EnvironmentKey {
    static let defaultValue: AppTheme = DefaultLightTheme()
}

extension EnvironmentValues {
    var theme: AppTheme {
        get { self[ThemeEnvironmentKey.self] }
        set { self[ThemeEnvironmentKey.self] = newValue }
    }
}

// ==========================================
// 3. Theme-Aware Component
// ==========================================
struct DSCard<Content: View>: View {
    // 🛡️ The component relies entirely on the injected theme, not hardcoded light/dark logic.
    @Environment(\.theme) var theme
    
    let content: () -> Content
    
    var body: some View {
        VStack {
            content()
        }
        .padding(16)
        .background(theme.cardBackground)
        .foregroundColor(theme.textColor)
        .cornerRadius(12)
        .shadow(color: theme.brandPrimary.opacity(0.2), radius: 5)
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why not just rely on iOS Asset Catalogs (Colors.xcassets) for Light/Dark mode?
//   A: Asset Catalogs are great, but they are limited to Light/Dark/High Contrast. If your app needs a "Halloween Theme" or "Enterprise Client B Theme," Asset Catalogs cannot handle that dynamically. Environment-injected themes can.
// • Q: How does a component react when the theme changes?
//   A: Because `@Environment` acts like an `@ObservedObject` for the view hierarchy, changing the theme at the root level instantly triggers a redraw of every component relying on it.
