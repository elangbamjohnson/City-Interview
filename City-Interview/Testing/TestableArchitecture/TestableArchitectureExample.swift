import Foundation
// import XCTest // ⚠️ Note: In a real project, tests live in a Unit Test Target!

// MARK: - 🏗️ Testable Architecture
//
// 💡 INTERVIEW TALKING POINTS:
// • The Golden Rule: Testability is a design decision made upfront. If you can't swap a dependency for a fake, you can't unit test it in isolation.
// • The Anti-Pattern: Instantiating singletons (`URLSession.shared`, `UserDefaults.standard`) directly inside a method makes the class completely untestable without making actual network calls or writing to disk.
// • The Solution: Dependency Injection (DI). It is the exact same principle that drives Modular Architecture—depend on abstractions (Protocols), not concretions (Classes).

// ==========================================
// ❌ BEFORE: Untestable Architecture
// ==========================================
class BadLoginViewModel {
    
    func login() {
        // 🚨 Anti-Pattern: Hardcoded Singleton Dependency!
        // We cannot write a Unit Test for this method without actually hitting the network,
        // which makes the test slow, flaky, and dependent on an internet connection.
        let url = URL(string: "https://api.example.com/login")!
        URLSession.shared.dataTask(with: url) { data, response, error in
            print("Login finished")
        }.resume()
    }
}

// ==========================================
// ✅ AFTER: Testable Architecture
// ==========================================
// 1. Create the abstraction
protocol APIClientProtocol {
    func request(url: URL, completion: @escaping (Bool) -> Void)
}

// 2. Wrap the singleton in a real implementation
class RealAPIClient: APIClientProtocol {
    func request(url: URL, completion: @escaping (Bool) -> Void) {
        URLSession.shared.dataTask(with: url) { _, _, _ in
            completion(true)
        }.resume()
    }
}

class GoodLoginViewModel {
    // 3. Depend on the abstraction
    private let apiClient: APIClientProtocol
    
    // 4. Inject via constructor
    init(apiClient: APIClientProtocol) {
        self.apiClient = apiClient
    }
    
    func login() {
        let url = URL(string: "https://api.example.com/login")!
        // 5. Call the protocol.
        // In the app, this hits the network. In the test, this hits the Mock!
        apiClient.request(url: url) { success in
            print("Login finished: \(success)")
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why is `URLSession.shared` bad for unit tests?
//   A: Unit tests must be fast, deterministic, and isolated. Real network calls are slow, fail if the WiFi drops, and hit external servers. If a test fails, you don't know if the logic is broken or if the server is just down.
// • Q: Can you use Property Injection instead of Constructor Injection?
//   A: Yes (`var apiClient: APIClientProtocol!`), but Constructor Injection is preferred because it guarantees the object is fully configured and ready to use the moment it is instantiated. Property injection allows the object to exist in an invalid state.
