import Foundation

// MARK: - API IMPLEMENTATION
//
// 💡 INTERVIEW TALKING POINTS (CONCRETE REPOSITORY):
// • Responsibility: Concrete implementation handling Network requests (e.g. URLSession, Alamofire).
// • Key Feature: Implements `ProductRepository` protocol.
// • ViewModel Awareness: ViewModel does NOT know this class exists — it only interacts through `ProductRepository`.

final class APIProductRepository: ProductRepository {
    
    func fetchAll() async throws -> [Product] {
        // Simulating network latency (e.g., URLSession call)
        try await Task.sleep(for: .seconds(1))
        
        print("📡 APIRepo: Fetching from network...")
        return [
            Product(id: 1, name: "MacBook Pro", price: 1999.99),
            Product(id: 2, name: "iPhone 16", price: 999.99),
            Product(id: 3, name: "AirPods Pro", price: 249.99),
        ]
    }
    
    func fetchById(_ id: Int) async throws -> Product? {
        let all = try await fetchAll()
        return all.first { $0.id == id }
    }
}

