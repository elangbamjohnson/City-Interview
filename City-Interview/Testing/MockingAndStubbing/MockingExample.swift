import Foundation
// import XCTest // ⚠️ Note: In a real project, tests live in a Unit Test Target!

// MARK: - 🎭 Mocking & Stubbing
//
// 💡 INTERVIEW TALKING POINTS:
// • Protocol-Based DI: Swift does not have dynamic reflection-based mocking frameworks like Java's Mockito. The ONLY way to mock an object in Swift is to hide the real object behind a Protocol, and pass a Fake object that conforms to that same protocol.
// • Mock vs Stub:
//   - A Stub just returns canned data (e.g., `return "Success"`).
//   - A Mock *verifies interactions* (e.g., `XCTAssertTrue(mock.didCallLogin)`).
// • Auto-generation: At scale, manually writing mocks is tedious. Mentioning that you know about code-generation libraries like `Cuckoo` or `Mockingbird` is a huge plus for Senior interviews.

// ==========================================
// 1. The Protocol (The secret to Swift mocking)
// ==========================================
protocol NetworkServiceProtocol {
    func login(username: String) -> Bool
}

// ==========================================
// 2. The Real Implementation (Used in App)
// ==========================================
class RealNetworkService: NetworkServiceProtocol {
    func login(username: String) -> Bool {
        // Imaginary real HTTP request that takes 2 seconds
        return true
    }
}

// ==========================================
// 3. The Mock / Stub (Used in Tests)
// ==========================================
class MockNetworkService: NetworkServiceProtocol {
    // 🛡️ Stubbing capability: Let the test define what to return
    var stubbedLoginResult: Bool = true
    
    // 🛡️ Mocking capability: Record if the method was actually called
    var didCallLogin = false
    var capturedUsername: String?
    
    func login(username: String) -> Bool {
        didCallLogin = true
        capturedUsername = username
        return stubbedLoginResult
    }
}

// ==========================================
// 4. The Code Under Test
// ==========================================
class LoginViewModel {
    let networkService: NetworkServiceProtocol
    
    // 🛡️ Constructor Injection!
    init(networkService: NetworkServiceProtocol) {
        self.networkService = networkService
    }
    
    func performLogin() -> Bool {
        return networkService.login(username: "TestUser")
    }
}

// ==========================================
// 5. The Test Case
// ==========================================
/*
class LoginViewModelTests: XCTestCase {
    
    func test_performLogin_callsNetworkService_withCorrectUsername() {
        // Arrange
        let mockNetwork = MockNetworkService()
        mockNetwork.stubbedLoginResult = true // Stub the return value
        
        let sut = LoginViewModel(networkService: mockNetwork)
        
        // Act
        let result = sut.performLogin()
        
        // Assert
        XCTAssertTrue(result)
        XCTAssertTrue(mockNetwork.didCallLogin, "ViewModel failed to call login on the network service.")
        XCTAssertEqual(mockNetwork.capturedUsername, "TestUser", "ViewModel passed the wrong username to the network service.")
    }
}
*/

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: What is a "Fake"?
//   A: A Fake is a working, but simplified implementation of a dependency. For example, an In-Memory CoreData stack. It actually saves data, but it's not a real production database.
// • Q: What is a "Spy"?
//   A: A Spy wraps a REAL object. It records how many times a method was called, but still forwards the call to the real underlying object to do the actual work.
