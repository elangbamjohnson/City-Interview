import SwiftUI
import Combine

// MARK: - VIEWMODEL
//
// 💡 INTERVIEW TALKING POINTS (VIEWMODEL + REPOSITORY):
// • Dependency Injection: We pass `repository: ProductRepository` via `init`.
// • Protocol-Oriented Design: ViewModel depends on `ProductRepository` protocol, NOT `APIProductRepository`.
// • Single Responsibility: ViewModel handles UI state transformation (loading, products, errors), NOT network/storage logic.
// • MainActor: Guarantees UI state modifications happen strictly on the Main Thread.

@MainActor
final class ProductViewModel: ObservableObject {
    
    /// Depend on Protocol abstraction (DIP principle), not concrete types!
    private let repository: ProductRepository
    
    // Published state consumed by SwiftUI View
    @Published private(set) var products: [Product] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    @Published private(set) var dataSource: String = ""
    
    /// Dependency Injection via Initializer (Constructor Injection)
    init(repository: ProductRepository) {
        self.repository = repository
    }
    
    func loadProducts() {
        Task {
            isLoading = true
            errorMessage = nil
            do {
                // Fetch data asynchronously without caring WHERE it comes from
                products = try await repository.fetchAll()
                
                // Show which concrete implementation responded
                dataSource = String(describing: type(of: repository))
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

