import SwiftUI

// MARK: - 🏢 Monolithic vs Composed Views
//
// 💡 INTERVIEW TALKING POINTS:
// • Why Monolithic Views Hurt: When one `body` property is 300+ lines long, you suffer from:
//   1. Slow Xcode preview compile times.
//   2. Massive merge conflicts when multiple engineers touch the same screen.
//   3. Zero reusability — you can't use the "Product Card" on a different screen.
//   4. Untestability — you can't preview the card without passing in the entire screen's data model.
// • The Rule of Thumb: "If a piece of UI has a name I'd say out loud in a design review — like 'the rating badge' or 'the price tag' — it should probably be its own standalone View."

// ==========================================
// ❌ BAD: The Monolithic Screen
// ==========================================
struct BadProductScreen: View {
    // A single massive body containing all layout, styling, and logic.
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Image(systemName: "cube.box.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(height: 200)
                .foregroundColor(.blue)
            
            Text("Awesome Headphones")
                .font(.title)
                .fontWeight(.bold)
            
            Text("$299.99")
                .font(.title2)
                .foregroundColor(.green)
            
            HStack {
                ForEach(0..<5) { index in
                    Image(systemName: index < 4 ? "star.fill" : "star")
                        .foregroundColor(.yellow)
                }
                Text("(128 Reviews)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Button(action: {
                print("Added to cart")
            }) {
                Text("Add to Cart")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .padding()
    }
}

// ==========================================
// ✅ GOOD: The Composed Screen
// ==========================================
// The exact same UI, but the parent view is now a clean orchestrator, not a dump of modifiers.
struct GoodProductScreen: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            ProductImageView(iconName: "cube.box.fill", color: .blue)
            
            ProductInfoView(title: "Awesome Headphones", price: 299.99)
            
            RatingBadgeView(rating: 4, reviewCount: 128)
            
            AddToCartButton(isAvailable: true, action: {
                print("Added to cart")
            })
        }
        .padding()
    }
}

// (Imagine these are defined in separate files or lower down)
struct ProductImageView: View {
    let iconName: String
    let color: Color
    var body: some View {
        Image(systemName: iconName).resizable().aspectRatio(contentMode: .fit).frame(height: 200).foregroundColor(color)
    }
}

struct ProductInfoView: View {
    let title: String
    let price: Double
    var body: some View {
        VStack(alignment: .leading) {
            Text(title).font(.title).fontWeight(.bold)
            Text(String(format: "$%.2f", price)).font(.title2).foregroundColor(.green)
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How does decomposing views help with SwiftUI performance?
//   A: SwiftUI diffs the view tree to decide what to redraw. If a monolithic view's state changes, SwiftUI might re-evaluate the entire 300-line body. If it's decomposed, SwiftUI can surgically skip re-evaluating subviews whose inputs haven't changed.
// • Q: When is a view TOO small to extract?
//   A: If extracting the view requires you to pass 5+ bindings and closures just to make it work, it might be too tightly coupled to the parent to exist on its own.
// • Q: How do you handle navigation from a decomposed button?
//   A: Use closures. The child button should just emit an action `() -> Void`. The parent orchestrator handles the actual routing or ViewModel interaction.
