import Foundation
import XCTest

// MARK: - 🧪 XCTest Basics
//
// 💡 INTERVIEW TALKING POINTS:
// • XCTestCase Lifecycle: Xcode instantiates the test class ONCE, but calls `setUp` and `tearDown` before and after EVERY single test method.
// • State Leakage: You must nil out your properties in `tearDown`. If you don't, Xcode holds onto the memory of every object instantiated in `setUp` until ALL tests in the suite finish, causing massive memory bloat in large projects.
// • Naming Convention: Test methods MUST start with the word `test` for Xcode's test runner to automatically discover and run them.

// A simple model/method to test
struct StringValidator {
    func isValidEmail(_ email: String) -> Bool {
        return email.contains("@") && email.contains(".")
    }
}

class StringValidatorTests: XCTestCase {
    
    // System Under Test (SUT)
    // Declared as an implicitly unwrapped optional (!) because we instantiate it in setUp, not init.
    var validator: StringValidator!
    
    // ==========================================
    // 1. Setup & Teardown
    // ==========================================
    
    /// `setUp()` runs immediately BEFORE every single `test...()` method in this class.
    /// Interview Point: Use this to give every test a perfectly clean, isolated environment.
    override func setUp() {
        super.setUp()
        print("➡️ setUp() called: Initializing fresh StringValidator...")
        validator = StringValidator()
    }
    
    /// `tearDown()` runs immediately AFTER every single `test...()` method finishes.
    /// Interview Point: You MUST set your objects to nil here. If you don't, the XCTest runner
    /// keeps them in memory for the duration of the entire test suite, leading to OOM crashes.
    override func tearDown() {
        print("⬅️ tearDown() called: Niling out StringValidator to prevent memory leaks...\n")
        validator = nil
        super.tearDown()
    }
    
    // ==========================================
    // 2. The Test Methods
    // ==========================================
    
    /// 💡 INTERVIEW POINT: The AAA Pattern (Arrange, Act, Assert)
    /// This is the industry-standard way to structure unit tests. It makes tests incredibly readable.
    func testValidEmail_ReturnsTrue() {
        print("   ▶️ Running test: testValidEmail_ReturnsTrue")
        
        // 1. ARRANGE: Set up the specific state and inputs for this exact scenario.
        let validEmail = "test@example.com"
        
        // 2. ACT: Execute the specific method being tested.
        let isValid = validator.isValidEmail(validEmail)
        
        // 3. ASSERT: Verify the outcome matches your exact expectation.
        XCTAssertTrue(isValid, "Expected an email containing both '@' and '.' to be evaluated as valid.")
    }
    
    /// 💡 INTERVIEW POINT: Testing the "Sad Path"
    /// Junior devs only test the "Happy Path" (success). Seniors always test the failure conditions.
    func testInvalidEmail_MissingAtSymbol_ReturnsFalse() {
        print("   ▶️ Running test: testInvalidEmail_MissingAtSymbol_ReturnsFalse")
        
        // Arrange
        let invalidEmail = "testexample.com"
        
        // Act
        let isValid = validator.isValidEmail(invalidEmail)
        
        // Assert
        XCTAssertFalse(isValid, "Expected an email missing the '@' symbol to be evaluated as invalid.")
    }
    
    /// A third test specifically added to demonstrate that setUp and tearDown
    /// run independently wrapping EVERY single test method.
    func testInvalidEmail_MissingDomain_ReturnsFalse() {
        print("   ▶️ Running test: testInvalidEmail_MissingDomain_ReturnsFalse")
        
        // Arrange
        let invalidEmail = "test@example" // Missing the '.'
        
        // Act
        let isValid = validator.isValidEmail(invalidEmail)
        
        // Assert
        XCTAssertFalse(isValid, "Expected an email missing a domain (the '.') to be evaluated as invalid.")
    }
}
