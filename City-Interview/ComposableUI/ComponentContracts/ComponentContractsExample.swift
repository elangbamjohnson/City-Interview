import SwiftUI

// MARK: - 📜 Component Contracts
//
// 💡 INTERVIEW TALKING POINTS:
// • Data-Driven Boundaries: A component should only request the absolute minimum data it needs to render itself. 
// • Primitives over Models: If a `RatingBadgeView` asks for a full `Product` model, it can ONLY ever be used for Products. If it asks for a `Double` and an `Int`, it can be reused for Restaurant ratings, Driver ratings, and Movie ratings!
// • "Dumb" vs "Smart" Views: 
//   - Dumb (Presentational) Views: Take primitive data, format it, emit user actions via closures. Highly reusable.
//   - Smart (Container) Views: Hold `@StateObject` ViewModels, talk to networks, orchestrate child views. Rarely reusable.

// ❌ BAD: Tightly Coupled Contract
// This view is permanently shackled to the `ComposableProduct` domain model.
struct ComposableProduct {
    let id: String
    let title: String
    let price: Double
    let starRating: Double
    let totalReviews: Int
}

struct BadRatingBadgeView: View {
    let product: ComposableProduct // 🚨 Anti-pattern: passing the whole heavy model
    
    var body: some View {
        HStack {
            Image(systemName: "star.fill")
            Text("\(String(format: "%.1f", product.starRating)) (\(product.totalReviews))")
        }
    }
}

// ✅ GOOD: Minimal Primitive Contract
// This view has no idea what a "Product" is. It is a highly reusable, dumb component.
struct RatingBadgeView: View {
    let rating: Double
    let reviewCount: Int
    
    var body: some View {
        HStack {
            ForEach(0..<5) { index in
                Image(systemName: index < Int(rating.rounded()) ? "star.fill" : "star")
                    .foregroundColor(.yellow)
            }
            Text("(\(reviewCount) Reviews)")
                .font(.caption)
                .foregroundColor(.gray)
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why is passing a full Domain Model into a child view bad for Xcode Previews?
//   A: Because to preview that tiny child view, you have to write boilerplate code to instantiate a massive fake Domain Model with all its unrelated properties (id, price, description, etc.).
// • Q: Should a small UI component talk to a ViewModel directly?
//   A: Usually no. Small components should be "dumb" and data-driven via their `init`. The parent "Smart" view should own the ViewModel and pass the necessary state down.
// • Q: How does this relate to Design Systems?
//   A: This exact practice is how enterprise companies build shared UI libraries (like "Uber's Base UI"). The components are completely isolated from the main app's business logic.
