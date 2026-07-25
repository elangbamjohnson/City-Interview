import Foundation

// MARK: - 🧱 Module Boundaries
//
// 💡 INTERVIEW TALKING POINTS:
// • Why Modularize? In large apps (15+ engineers), a monolithic target becomes a bottleneck. Splitting into SPM (Swift Package Manager) modules allows parallel builds, vastly faster incremental compilation, and strict compiler-enforced boundaries.
// • The Golden Rule: Modules should depend on ABSTRACTIONS (protocols), not CONCRETE TYPES. 
// • Circular Dependencies: SPM will hard-fail if Module A imports Module B, and Module B imports Module A. This forces you to extract shared logic into a common "Core" module, naturally improving architecture.

// ==========================================
// Simulating 3 Separate SPM Modules
// ==========================================

// 📦 MODULE 1: NetworkingKit
// Knows NOTHING about the UI or specific app features.
public protocol NetworkFetching {
    func fetch(url: URL) async throws -> Data
}

// 📦 MODULE 2: DomainModels
// Knows NOTHING about Networking or UI. Just pure data.
public struct UserProfile {
    public let id: String
    public let name: String
}

// 📦 MODULE 3: ProfileFeature
// Imports NetworkingKit and DomainModels.
// 🛡️ Notice how it relies on the `NetworkFetching` protocol, NOT a concrete `URLSessionNetworkClient`.
public class ProfileLoader {
    private let networkClient: NetworkFetching
    
    // Constructor Injection across boundaries
    public init(networkClient: NetworkFetching) {
        self.networkClient = networkClient
    }
    
    public func loadProfile() async -> UserProfile? {
        // ... network call ...
        return UserProfile(id: "1", name: "Alice")
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why is SPM better than just using Folders in Xcode?
//   A: Folders are imaginary. Anyone can `import` a file from another folder and tightly couple the code. SPM enforces strict access control (`internal` vs `public`), preventing accidental spaghetti code.
// • Q: At what point do you decide to split a monolithic app into modules?
//   A: When build times exceed a few minutes, merge conflicts become a daily pain, or multiple squads need to release features on independent cadences.
// • Q: What is a "Core" module, and why is it dangerous?
//   A: A Core module holds shared logic (extensions, UI constants). It's dangerous because it often becomes a "dumping ground" that every other module depends on, eventually slowing down the build again.
