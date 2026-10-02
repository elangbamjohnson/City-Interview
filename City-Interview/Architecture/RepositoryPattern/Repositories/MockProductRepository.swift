import Foundation

// MARK: - MOCK IMPLEMENTATION
//
// 💡 INTERVIEW TALKING POINTS (UNIT TESTING WITH MOCK REPOSITORIES):
// • Why mock? Real network calls are slow, flaky, and require internet. Mocks make tests fast & deterministic.
// • How it works: Inject `MockProductRepository` into `ProductViewModel` during XCTest runs.
// • Testing Failures: Control `shouldThrowError = true` to test error states in ViewModel without actual network outages.

final class MockProductRepository: ProductRepository {
    
    var mockProducts: [Product] = []
    var shouldThrowError = false
    
    func fetchAll() async throws -> [Product] {
        if shouldThrowError {
            throw URLError(.notConnectedToInternet)
        }
        print("🧪 MockRepo: Returning mock data...")
        return mockProducts
    }
    
    func fetchById(_ id: Int) async throws -> Product? {
        return mockProducts.first { $0.id == id }
    }
}

