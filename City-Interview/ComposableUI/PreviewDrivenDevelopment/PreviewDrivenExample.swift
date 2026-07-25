import SwiftUI

// MARK: - 🎨 Preview-Driven Development
//
// 💡 INTERVIEW TALKING POINTS:
// • Testing in Isolation: Building a tiny component (like a Rating badge or an Add to Cart button) using Xcode Previews means you don't have to launch the simulator, navigate to the 4th screen, and click a button just to see if your padding is correct.
// • Lightweight Visual Tests: By stacking multiple `#Preview` blocks, you can instantly see how your component handles Edge Cases (missing data, max values, truncation) and Environment changes (Dark Mode, Dynamic Type).
// • Living Documentation: Previews act as a catalog for other developers. If they want to know what a `RatingBadgeView` can do, they just look at the previews.

// The Component
struct AddToCartButton: View {
    let isAvailable: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(isAvailable ? "Add to Cart" : "Out of Stock")
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding()
                .background(isAvailable ? Color.blue : Color.gray)
                .foregroundColor(.white)
                .cornerRadius(10)
        }
        .disabled(!isAvailable)
    }
}

// ==========================================
// The Previews (Visual Test Suite)
// ==========================================

#Preview("Standard - Available") {
    AddToCartButton(isAvailable: true, action: {})
        .padding()
}

#Preview("Standard - Out of Stock") {
    AddToCartButton(isAvailable: false, action: {})
        .padding()
}

#Preview("Dark Mode Edge Case") {
    AddToCartButton(isAvailable: true, action: {})
        .padding()
        .preferredColorScheme(.dark)
        // Helps catch issues where white text becomes invisible on a light button in dark mode
}

#Preview("Dynamic Type - Huge Font") {
    AddToCartButton(isAvailable: true, action: {})
        .padding()
        // What happens if the user has accessibility text sizing turned all the way up?
        // Building this in isolation catches text truncation instantly!
        .environment(\.sizeCategory, .accessibilityExtraExtraExtraLarge) 
}


// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why do Previews sometimes fail to build on large monolithic screens?
//   A: Because monolithic screens often have massive dependency graphs (View Models, Network Services, Core Data). The preview compiler tries to build all of it. Small, primitive-driven components compile almost instantly.
// • Q: How is Preview-Driven Development different from UI Testing (XCUITest)?
//   A: Previews are for rapid visual iteration and design-time feedback. XCUITest is for verifying end-to-end user flows (e.g. tapping the button actually adds the item to the database). Both are valuable, but Previews are vastly faster.
