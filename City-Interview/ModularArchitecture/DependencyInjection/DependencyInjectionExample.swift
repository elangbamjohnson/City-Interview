import Foundation

// MARK: - 💉 Dependency Injection (DI)
//
// 💡 INTERVIEW TALKING POINTS:
// • Why it matters: DI is the backbone of modularity. If Class A instantiates Class B internally, they are tightly coupled. If Class A *receives* Class B via its initializer, it is decoupled and immensely testable via Mocks.
// • Constructor vs Property vs Service Locator:
//   - Constructor Injection: (Best) Dependencies are guaranteed to exist before the object is used.
//   - Property Injection: Useful for Storyboards where you don't control the initializer, but dangerous because the property is implicitly optional or implicitly unwrapped.
//   - Service Locator / Container: Using frameworks like `Swinject` or `Resolver` to automatically resolve dependencies at runtime. Great for massive apps, but adds hidden magic.

// ==========================================
// DI Example
// ==========================================

// 1. The Abstraction
protocol ModularUserServiceProtocol {
    func fetchUserName() -> String
}

// 2. The Concrete Implementation (Production)
class RealUserService: ModularUserServiceProtocol {
    func fetchUserName() -> String {
        return "Real Network User" // Imagine an API call here
    }
}

// 3. The Consumer (ViewModel)
class ProfileViewModel {
    
    // We hold the protocol, NOT the concrete RealUserService
    private let userService: ModularUserServiceProtocol
    
    // 🛡️ Constructor Injection
    init(userService: ModularUserServiceProtocol) {
        self.userService = userService
    }
    
    func getGreeting() -> String {
        return "Hello, \(userService.fetchUserName())"
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How does DI make Unit Testing easier?
//   A: Because `ProfileViewModel` takes a protocol, I can pass a `MockUserService` into it during tests that returns hardcoded data instantly, without hitting the network.
// • Q: What is a DI Container?
//   A: It is a central registry (like a Dictionary) where you map Protocols to Concrete types (e.g., `container.register(ModularUserServiceProtocol.self) { RealUserService() }`). The container automatically provides the correct instance when asked.
// • Q: What is the main drawback of a Service Locator pattern over Constructor Injection?
//   A: Service Locators hide dependencies. Looking at a class's initializer doesn't tell you what it relies on, which makes the code harder to reason about and easier to accidentally crash if a dependency wasn't registered.
