import Foundation
// import XCTest // ⚠️ Note: In a real project, tests live in a Unit Test Target!

// MARK: - 🔄 TDD Workflow (Red, Green, Refactor)
//
// 💡 INTERVIEW TALKING POINTS:
// • Red-Green-Refactor: 
//   1. Red: Write a failing test for a feature that doesn't exist yet.
//   2. Green: Write the UGLIEST, minimal code possible just to make the test pass.
//   3. Refactor: Clean up the code, extract methods, make it pretty—with the safety net of a passing test.
// • The Real Value: TDD isn't a religion; it's a design tool. Writing the test first forces you to think about the API's usability *before* you get bogged down in implementation details.
// • "Test-Alongside": Be honest in interviews! Say: "In practice, I often do 'test-alongside'. I don't dogmatically write every line test-first, but I understand the discipline and use strict TDD when building complex, tricky business logic."

// ==========================================
// TDD Sequence Narration
// ==========================================

// STEP 1: RED (Write the test first)
/*
func test_isValid_passwordUnder8Characters_returnsFalse() {
    let sut = PasswordValidator()
    let result = sut.isValid(password: "1234567") // ❌ Compiler Error: PasswordValidator doesn't exist!
    XCTAssertFalse(result)
}
*/

// STEP 2: GREEN (Write the minimal code to compile and pass)
/*
struct PasswordValidator {
    func isValid(password: String) -> Bool {
        // Just hardcode it to pass! The goal is GREEN as fast as possible.
        if password == "1234567" { return false }
        return true 
    }
}
*/

// STEP 3: REFACTOR (Write the actual logic, test keeps us safe)
struct PasswordValidator {
    func isValid(password: String) -> Bool {
        // We know we are safe to rewrite this because if we break it, the test will instantly fail.
        let minLength = 8
        return password.count >= minLength
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Does TDD mean 100% test coverage?
//   A: No. TDD is a workflow, not a coverage metric. You can do TDD and still only cover the "happy path." Conversely, you can have 100% coverage without ever doing TDD.
// • Q: How does BDD differ from TDD?
//   A: TDD is a developer workflow (write test -> code -> refactor). BDD (Behavior-Driven Development) is a specification style. BDD tests use `Given/When/Then` syntax (often via frameworks like Quick/Nimble) so Product Managers and QA can read the test output like a plain-English behavior spec.
