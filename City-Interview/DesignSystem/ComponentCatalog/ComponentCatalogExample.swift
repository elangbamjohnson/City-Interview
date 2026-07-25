import SwiftUI

// MARK: - 📚 Component Catalog
//
// 💡 INTERVIEW TALKING POINTS:
// • What is a Component Catalog? It is a dedicated screen (or entirely separate mini-app) that showcases every single component in the Design System in all of its possible states (disabled, active, large, small).
// • Living Documentation: Wiki pages and Figma files go stale the second a developer changes the code. A compiled Component Catalog can NEVER go stale because it runs against the actual production code.
// • QA & Design Audits: A catalog allows designers to open the app, look at one screen, and instantly verify that the `DSBadge` looks exactly as intended across Light Mode, Dark Mode, and Dynamic Type sizing without having to navigate through a complex user flow.

// ==========================================
// The Components
// ==========================================
struct DSBadge: View {
    enum Style { case success, warning, destructive }
    let text: String
    let style: Style
    
    var backgroundColor: Color {
        switch style {
        case .success: return .green
        case .warning: return .orange
        case .destructive: return .red
        }
    }
    
    var body: some View {
        Text(text.uppercased())
            .font(.caption2).fontWeight(.bold)
            .padding(.horizontal, 8).padding(.vertical, 4)
            .background(backgroundColor.opacity(0.2))
            .foregroundColor(backgroundColor)
            .cornerRadius(4)
    }
}

// ==========================================
// The Catalog (Previews acting as documentation)
// ==========================================

struct DSBadge_Catalog_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            Text("DSBadge Catalog").font(.title).bold()
            
            // 🛡️ Show every possible state in one place!
            HStack {
                DSBadge(text: "Verified", style: .success)
                DSBadge(text: "Pending", style: .warning)
                DSBadge(text: "Error", style: .destructive)
            }
            .previewDisplayName("Standard States")
            
            HStack {
                DSBadge(text: "Verified", style: .success)
                DSBadge(text: "Pending", style: .warning)
                DSBadge(text: "Error", style: .destructive)
            }
            .preferredColorScheme(.dark)
            .previewDisplayName("Dark Mode")
            
            DSBadge(text: "Super Long Truncation Text Badge Example", style: .warning)
                .frame(width: 150)
                .previewDisplayName("Edge Case: Truncation")
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Do you ship the Catalog in the production app?
//   A: Never to App Store users. It's usually a standalone Target in the Xcode project, or a hidden debug menu only accessible in Internal/Staging builds for QA.
// • Q: How does this help with Snapshot Testing?
//   A: Perfectly. If you have a Catalog view that renders all components, you can write a single Snapshot Test against the Catalog view. If a developer accidentally breaks the padding on a button, the snapshot test catches it instantly.
