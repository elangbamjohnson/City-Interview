import Foundation
// import XCTest // ⚠️ Note: In a real project, this code lives in a UI Test Target!

// MARK: - 📱 UI Testing (XCUITest)
//
// 💡 INTERVIEW TALKING POINTS:
// • Separate Process: UI Tests run in a completely different process than your app. They do not have access to your app's internal variables or code. They literally drive the app from the outside using the Accessibility tree.
// • Accessibility Identifiers vs Labels: Never match elements by visible text (`app.buttons["Login"]`). If the app is translated to Spanish, the test breaks. Always use Accessibility Identifiers (`app.buttons["login_submit_button"]`) because they don't change across languages.
// • The Testing Pyramid: UI tests are slow, flaky, and expensive to maintain. Reserve them for critical "Golden Paths" (like Checkout or Login), not exhaustive edge cases.

// ==========================================
// 1. The Code Under Test (SwiftUI View)
// ==========================================
import SwiftUI

struct LoginView: View {
    @State private var username = ""
    @State private var status = ""
    
    var body: some View {
        VStack {
            TextField("Username", text: $username)
                // 🛡️ The critical piece that allows XCUITest to find this element reliably
                .accessibilityIdentifier("username_textfield")
            
            Button("Submit") {
                status = "Success"
            }
            .accessibilityIdentifier("login_submit_button")
            
            Text(status)
                .accessibilityIdentifier("status_label")
        }
    }
}

// ==========================================
// 2. The UI Test Case
// ==========================================
/*
class LoginUITests: XCTestCase {
    
    let app = XCUIApplication()
    
    override func setUp() {
        super.setUp()
        // Stop immediately if a failure occurs (UI tests are too slow to keep going if the first step fails)
        continueAfterFailure = false
        app.launch()
    }
    
    func test_loginFlow_validInput_showsSuccessStatus() {
        // 1. Find elements via Accessibility Identifiers (NOT visible text)
        let usernameTextField = app.textFields["username_textfield"]
        let submitButton = app.buttons["login_submit_button"]
        let statusLabel = app.staticTexts["status_label"]
        
        // 2. Interact
        XCTAssertTrue(usernameTextField.exists)
        usernameTextField.tap()
        usernameTextField.typeText("testuser")
        
        XCTAssertTrue(submitButton.exists)
        submitButton.tap()
        
        // 3. Assert
        XCTAssertTrue(statusLabel.exists)
        XCTAssertEqual(statusLabel.label, "Success")
    }
}
*/

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How do you mock network calls in a UI Test if it runs in a separate process?
//   A: You can pass launch arguments (`app.launchArguments.append("-mockNetwork")`) when starting the app in the UI Test. The app reads this argument on launch and swaps its real network stack for a local mock JSON server or stubbed responses.
// • Q: Why are UI tests "flaky"?
//   A: Because they depend on network latency, animations finishing, and the iOS simulator rendering. A button might take 0.5 seconds to appear, causing the test to tap nothing and fail.
