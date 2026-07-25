import Foundation
// import XCTest // ⚠️ Note: In a real project, this code lives in a separate Unit Test Target!

// MARK: - 🧪 XCTest Basics
//
// 💡 INTERVIEW TALKING POINTS:
// • Arrange-Act-Assert (AAA): Every good test is split into three phases. Set up the state, perform the action, and verify the outcome.
// • `setUp()` vs `init()`: `setUp()` is called before EVERY single test method runs. This guarantees a completely fresh state so tests don't pollute each other.
// • Naming Convention: Use `test_methodName_condition_expectedResult`. If a test fails in CI, you should know exactly what broke just by reading the name in the log.

// ==========================================
// 1. The Code Under Test (Pure Logic)
// ==========================================
enum LoginError: Error {
    case emptyUsername
    case emptyPassword
}

struct LoginValidator {
    func validate(username: String, password: String) throws -> Bool {
        if username.isEmpty { throw LoginError.emptyUsername }
        if password.isEmpty { throw LoginError.emptyPassword }
        return username.count >= 3 && password.count >= 6
    }
}

// ==========================================
// 2. The Test Case
// ==========================================
/*
class LoginValidatorTests: XCTestCase {
    
    // The System Under Test (SUT)
    var sut: LoginValidator!
    
    // 🛡️ Runs before EVERY test to guarantee fresh state
    override func setUp() {
        super.setUp()
        sut = LoginValidator()
    }
    
    // 🛡️ Clean up after every test
    override func tearDown() {
        sut = nil
        super.tearDown()
    }
    
    // ✅ test_methodName_condition_expectedResult
    func test_validate_validCredentials_returnsTrue() throws {
        // 1. Arrange
        let username = "user123"
        let password = "password123"
        
        // 2. Act
        let isValid = try sut.validate(username: username, password: password)
        
        // 3. Assert
        XCTAssertTrue(isValid, "Validator should return true for valid credentials.")
    }
    
    func test_validate_emptyUsername_throwsError() {
        // Arrange
        let username = ""
        let password = "password123"
        
        // Act & Assert (XCTAssertThrowsError handles both)
        XCTAssertThrowsError(try sut.validate(username: username, password: password)) { error in
            XCTAssertEqual(error as? LoginError, LoginError.emptyUsername)
        }
    }
}
*/

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why force unwrap `var sut: LoginValidator!`?
//   A: Because `sut` is initialized in `setUp()` (which runs after `init`), we use the implicitly unwrapped optional `!` to avoid having to type `sut?.` in every single test method. Since `setUp()` guarantees it exists, it's safe.
// • Q: How do you test asynchronous code?
//   A: Use `XCTestExpectation`. You create an expectation, call the async code, call `expectation.fulfill()` inside the completion handler, and use `wait(for: [expectation], timeout: 5.0)` at the end of the test. Or, in modern Swift, just mark the test function `async throws` and `await` the result!
