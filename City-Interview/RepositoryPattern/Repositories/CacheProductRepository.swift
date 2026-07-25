import Foundation

// MARK: - CACHE IMPLEMENTATION
//
// 💡 INTERVIEW TALKING POINTS (LOCAL / CACHE REPOSITORY):
// • Responsibility: Concrete implementation fetching from local cache (CoreData, SwiftData, Realm, or Memory).
// • Flexibility: Demonstrates polymorphism — same protocol (`ProductRepository`), completely different source.
// • Offline Support: In production, a Composite Repository can try Cache first, then fallback to API if stale.

final class CacheProductRepository: ProductRepository {
    
    private var cache: [Product] = [
        Product(id: 1, name: "MacBook Pro (cached)", price: 1999.99),
        Product(id: 2, name: "iPhone 16 (cached)", price: 999.99),
    ]
    
    func fetchAll() async throws -> [Product] {
        print("💾 CacheRepo: Returning from local cache...")
        return cache
    }
    
    func fetchById(_ id: Int) async throws -> Product? {
        return cache.first { $0.id == id }
    }
}

