import Foundation

// MARK: - 🥞 Protocol-Oriented Layering
//
// 💡 INTERVIEW TALKING POINTS:
// • Why Layering? To enforce the Single Responsibility Principle (SRP). 
//   - Repositories: Only know about data fetching (Network/DB).
//   - UseCases (Interactors): Only know about Business Logic (combining data, validations).
//   - ViewModels: Only know about formatting data for the View.
// • Clean Architecture Mapping: This perfectly maps to Uncle Bob's Clean Architecture. The Dependency Rule points inward: ViewModels depend on UseCases, UseCases depend on Repositories.
// • Swappable Data Sources: Because every layer communicates strictly via Protocols, you can completely rip out a REST API Repository and replace it with a GraphQL Repository without touching the UseCase or ViewModel!

// ==========================================
// 3-Tier Layering Example
// ==========================================

// 1. DATA LAYER (Repository)
protocol PaymentRepository {
    func processPayment(amount: Double) -> Bool
}

// 2. DOMAIN LAYER (UseCase / Interactor)
protocol CheckoutUseCase {
    func executeCheckout(cartTotal: Double) -> String
}

class DefaultCheckoutUseCase: CheckoutUseCase {
    private let repository: PaymentRepository
    
    init(repository: PaymentRepository) {
        self.repository = repository
    }
    
    func executeCheckout(cartTotal: Double) -> String {
        // Business logic lives here!
        if cartTotal > 10_000 {
            return "Amount too high for standard processing."
        }
        
        let success = repository.processPayment(amount: cartTotal)
        return success ? "Payment Successful" : "Payment Failed"
    }
}

// 3. PRESENTATION LAYER (ViewModel)
class CheckoutViewModel {
    private let useCase: CheckoutUseCase
    var statusMessage: String = ""
    
    init(useCase: CheckoutUseCase) {
        self.useCase = useCase
    }
    
    func onPayButtonTapped(cartTotal: Double) {
        // ViewModel only formats data for the UI, it doesn't do the math or network call!
        statusMessage = useCase.executeCheckout(cartTotal: cartTotal)
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why do we need a UseCase? Why can't the ViewModel talk directly to the Repository?
//   A: In simple apps, it can. But in enterprise apps, business logic (e.g. calculating tax, applying discounts) shouldn't live in the ViewModel because you might need to reuse that exact same logic across multiple different screens. The UseCase centralizes it.
// • Q: How does this resemble VIPER?
//   A: VIPER is essentially this exact separation. The UseCase is the Interactor. The ViewModel is a lighter version of the Presenter. 
// • Q: How do you mock this chain?
//   A: By providing a `MockPaymentRepository` to the UseCase, and a `MockCheckoutUseCase` to the ViewModel. Every layer can be tested in complete isolation.
