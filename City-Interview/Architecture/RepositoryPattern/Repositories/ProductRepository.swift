import Foundation

// MARK: - REPOSITORY PROTOCOL
//
// 💡 INTERVIEW CHEAT SHEET (REPOSITORY PATTERN):
//
// 1. WHAT IS IT?
//    An abstraction layer between data sources (Network, Database, Cache) and the rest of the application (ViewModel).
//
// 2. WHY USE IT?
//    • Loose Coupling: ViewModel doesn't care WHERE data comes from (URLSession, CoreData, Realm, or InMemory).
//    • Dependency Inversion (D in SOLID): High-level modules (ViewModel) depend on abstractions (Protocol), not concrete classes.
//    • Easy Unit Testing: Swap real API implementation with a Mock repository in unit tests without touching ViewModel code.
//    • Single Source of Truth: Centralizes data fetching & caching strategies behind a unified interface.
//
// 3. COMMON INTERVIEW QUESTION:
//    "How would you switch your app from URLSession to Firebase or CoreData?"
//    → "I would create a new class conforming to `ProductRepository` and inject it into the ViewModel. The ViewModel code stays 100% untouched."

protocol ProductRepository {
    /// Fetches all products asynchronously.
    func fetchAll() async throws -> [Product]
    
    /// Fetches a single product by ID asynchronously.
    func fetchById(_ id: Int) async throws -> Product?
}

