import UIKit

// MARK: - 🚪 Feature Module Public API
//
// 💡 INTERVIEW TALKING POINTS:
// • Access Control as Architecture: In a modular app, `public` and `internal` are architectural tools. You want your module's public surface area to be as tiny as physically possible.
// • Information Hiding: If you expose your internal ViewModels, Views, or Repositories to the rest of the app, other teams will couple their code to your implementation.
// • The Builder Pattern: A standard enterprise practice is to expose a single `public protocol FeatureBuilder`. The host app asks the builder for a `UIViewController`, and the builder internally wires up the Coordinator, ViewModel, and View, keeping them all `internal`.

// ==========================================
// Feature Module Boundary Example
// ==========================================

// 🟢 PUBLIC API: This is the ONLY thing visible outside the SPM Module.
public protocol PaymentFeatureBuilder {
    func buildPaymentScreen(userId: String) -> UIViewController
}

// 🔴 INTERNAL IMPLEMENTATION: Everything below here is completely hidden from the rest of the app.

// Hidden View Controller
internal class PaymentViewController: UIViewController {
    var viewModel: PaymentViewModel!
    // ...
}

// Hidden ViewModel
internal class PaymentViewModel {
    let userId: String
    init(userId: String) { self.userId = userId }
    // ...
}

// The Concrete Builder (Usually registered in a DI Container in the main app target)
public class DefaultPaymentFeatureBuilder: PaymentFeatureBuilder {
    
    public init() {}
    
    public func buildPaymentScreen(userId: String) -> UIViewController {
        // The builder acts as the internal composer. 
        // The rest of the app just gets a generic UIViewController back.
        let viewModel = PaymentViewModel(userId: userId)
        let vc = PaymentViewController()
        vc.viewModel = viewModel
        return vc
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why is the `PaymentViewModel` internal?
//   A: If it were public, another team's module might try to instantiate it or read its properties directly. By keeping it internal, we guarantee that nobody can rely on our module's internal state.
// • Q: How does independent versioning work?
//   A: Because the public API (the protocol) rarely changes, Team A can completely rewrite the internals of the Payment module (switching from MVC to MVVM, for example), increment the internal version, and it won't break any other team's code.
// • Q: How does the main app target know about `DefaultPaymentFeatureBuilder`?
//   A: The main app target is the "Composition Root". It imports the module and maps `PaymentFeatureBuilder` to `DefaultPaymentFeatureBuilder` in the global DI container.
