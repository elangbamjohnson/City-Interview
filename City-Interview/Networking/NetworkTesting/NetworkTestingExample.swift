import Foundation

/*
 MARK: - 🧪 Network Testing (Mocking)
 
 💡 INTERVIEW TALKING POINTS:
 • Dependency Injection (DI): The easiest way to mock network calls is to inject a protocol (e.g., `UserServiceProtocol`) instead of a concrete class.
 • Why Mock?: It prevents flaky tests caused by real network issues, speeds up test execution, and avoids hitting production APIs or rate limits during CI/CD.
 • Alternatives: URLProtocol subclassing (intercepts requests at the URLSession level, good if you can't use DI), or third-party tools like OHHTTPStubs. Protocol-based DI is the cleanest and most scalable.
*/

// Minimal models and protocols based on existing `fetchUsers` examples
struct MockUser: Decodable {
    let id: Int
    let name: String
}

protocol MockUserServiceProtocol {
    func fetchUsers() async throws -> [MockUser]
}

/*
 ==========================================
 Bare minimum Mock implementation
 ==========================================
 - We conform to the protocol.
 - We add properties to control the outcome (success or failure) during tests.
*/
class NetworkMockUserService: MockUserServiceProtocol {
    
    // Flags to control the mock's behavior from the test case
    var shouldReturnError = false
    var mockUsersToReturn: [MockUser] = []
    
    func fetchUsers() async throws -> [MockUser] {
        if shouldReturnError {
            throw URLError(.badServerResponse)
        }
        return mockUsersToReturn
    }
}

/*
 ==========================================
 Example Usage (Mental Model for Tests)
 ==========================================
 func testFetchUsers_Success() async throws {
     let mockService = NetworkMockUserService()
     mockService.mockUsersToReturn = [MockUser(id: 1, name: "John")] // Setup Mock
     
     let viewModel = UsersViewModel(service: mockService) // Inject Mock
     await viewModel.loadUsers() // Execute
     
     XCTAssertEqual(viewModel.users.count, 1) // Verify
 }
*/

/*
 ==========================================
 🎙️ Interview Summary Rule & One-liner
 ==========================================
 Simple rule to remember:
 "Always code against protocols, not concrete classes. In tests, inject a mock object that conforms to the protocol. The mock should have simple flags (like `shouldReturnError`) to instantly return dummy data or throw errors, avoiding real network waits."
 
 One-liner for interview:
 "For unit testing network layers, I prefer Protocol-based Dependency Injection to supply mock services; it's much cleaner than intercepting URLSession with URLProtocol, and keeps tests lightning fast and deterministic."
*/
