import SwiftUI

// MARK: - 🧩 Composition & ViewModifiers
//
// 💡 INTERVIEW TALKING POINTS:
// • `@ViewBuilder`: The magical Swift attribute that enables composition. It allows a parent view to accept a block of child views without knowing or caring what those child views are. This is how `VStack` and `List` work under the hood!
// • Custom `ViewModifier`: If you find yourself pasting `.padding().background(Color.white).cornerRadius(8).shadow(...)` over and over, that is a failure in composition. Extract it into a `ViewModifier` to create a Single Source of Truth for your design system.

// ==========================================
// 1. The Custom ViewModifier (Single Source of Truth for styling)
// ==========================================
struct CardStyleModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

extension View {
    // syntactic sugar to make it feel native
    func cardStyle() -> some View {
        self.modifier(CardStyleModifier())
    }
}

// ==========================================
// 2. The @ViewBuilder Container (Content Agnostic)
// ==========================================
struct HighlightCard<Content: View>: View {
    let title: String
    
    // 🛡️ The `@ViewBuilder` closure allows us to slot in ANY SwiftUI views here!
    @ViewBuilder let content: () -> Content 
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .foregroundColor(.blue)
            
            // Render whatever the caller passed in
            content()
        }
        .cardStyle() // Apply our centralized styling
    }
}

// ==========================================
// 3. Composing it all together
// ==========================================
struct CompositionExampleScreen: View {
    var body: some View {
        ZStack {
            Color(.systemGroupedBackground).edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 20) {
                // Usage 1: A card with a Product inside
                HighlightCard(title: "Featured Product") {
                    HStack {
                        Image(systemName: "headphones")
                        Text("Awesome Headphones")
                    }
                }
                
                // Usage 2: A card with completely different content, same styling!
                HighlightCard(title: "Account Status") {
                    VStack {
                        Text("Active Member")
                        ProgressView(value: 0.8)
                    }
                }
            }
            .padding()
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How does `@ViewBuilder` actually work?
//   A: It is a Swift "Result Builder" that takes multiple separate View expressions inside a closure and combines them into a single `TupleView` (or similar composite type) at compile time.
// • Q: Why use a `ViewModifier` instead of just a function that returns a View?
//   A: `ViewModifier` is structurally recognized by the SwiftUI layout engine, making it easier to maintain view state and identity across redraws. It also naturally supports chaining via the `.modifier()` syntax.
