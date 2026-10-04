const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '../Resources/questions.json');
const indexPath = path.join(__dirname, '../index.html');
const mdPath = path.join(__dirname, '../QUESTIONS.md');
const genDocsPath = path.join(__dirname, '../Helpers/generated_docs.json');

const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
let html = fs.readFileSync(indexPath, 'utf8');
let md = fs.readFileSync(mdPath, 'utf8');
const genDocs = JSON.parse(fs.readFileSync(genDocsPath, 'utf8'));

console.log('Current questions count:', questions.length);

const newQ70 = {
  id: "Q-70",
  category: "Testing, CI/CD & AI Engineering",
  difficulty: "Staff",
  question: "Unit vs UI vs snapshot vs integration vs performance tests. When do you use each?",
  interviewSentence: "I structure automated testing as a pyramid: fast unit tests verify business logic and ViewModel state, integration tests validate multi-layer data flow with stubbed network protocols, minimal UI tests protect critical user journeys via accessibility identifiers, snapshot tests prevent accidental visual regressions, and performance metrics guard hot paths against regression.",
  answer: `Each test type answers a different question, and each has a different cost. The cheaper tests are fast and precise, and the expensive ones are slow but closer to what the user really does. A good project uses all five, in the right amounts. The usual shape is a test pyramid: many unit tests at the bottom, fewer integration tests in the middle, and a small number of UI tests at the top. Snapshot and performance tests are added where they protect something specific.

Say it like this:

"I choose the test type by the question I want answered.

A unit test asks, 'does this one piece of logic give the right answer?' It tests a single function or ViewModel, with fake dependencies, so there is no network, no database, and no UI. It runs in milliseconds, so I write the most of these. I use them for business rules, calculations, validation, and ViewModel state.

An integration test asks, 'do these real pieces work together?' For example, the real networking layer, the real JSON decoding, and the real repository, with only the outside world replaced, like a stubbed server response or an in-memory database. It catches bugs that unit tests miss, like a wrong JSON key or a wrong mapping between layers. These are slower, so I write fewer.

A UI test asks, 'can a user complete this flow in the real app?' It launches the app and taps through it, like login, add to cart, and checkout. It is the closest to real use, but it is slow and can be flaky, so I keep these for the few critical flows only, and I feed them fake data through launch arguments.

A snapshot test asks, 'does this screen still look the same as before?' It renders a view into an image and compares it with a saved reference image. It catches accidental visual changes, like a broken layout, a missing label, or Dark Mode and Dynamic Type issues. It tells me that something changed, not whether the change is correct, so a person still reviews the difference.

A performance test asks, 'is this code still fast enough?' It runs a piece of code several times, measures time or memory, and compares the result with a saved baseline. I use it for hot paths like parsing a big file, sorting, image processing, and app launch, so a slow change is caught before release.

So for any new feature, most of my tests are unit tests, a few are integration tests for the data flow, one or two UI tests cover the main journey, and snapshot and performance tests protect the parts where looks or speed really matter."

1. Unit test: one piece of logic, with a fake dependency

\`\`\`swift
func test_load_failure_setsError() async {
    let service = MockUserService(result: .failure(URLError(.notConnectedToInternet))) // a fake service that fails
    let viewModel = ProfileViewModel(service: service)       // inject the fake, no real network
    await viewModel.load()                                   // run the logic and wait for it to finish
    XCTAssertEqual(viewModel.errorMessage, "Could not load profile") // check the visible state
}
\`\`\`

2. Integration test: real pieces together, fake only the server

\`\`\`swift
final class StubURLProtocol: URLProtocol {                   // intercepts requests before they reach the internet
    static var responseData = Data()                         // the JSON the test wants the "server" to return

    override class func canInit(with request: URLRequest) -> Bool { true } // handle every request
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request } // no change needed
    override func startLoading() {
        client?.urlProtocol(self, didReceive: HTTPURLResponse(url: request.url!, statusCode: 200,
                            httpVersion: nil, headerFields: nil)!, cacheStoragePolicy: .notAllowed) // send a 200 response
        client?.urlProtocol(self, didLoad: Self.responseData) // send the stubbed JSON body
        client?.urlProtocolDidFinishLoading(self)            // tell URLSession the response is complete
    }
    override func stopLoading() {}                           // nothing to cancel
}

func test_realRepository_decodesServerJSON() async throws {
    let config = URLSessionConfiguration.ephemeral           // a session with no shared cache
    config.protocolClasses = [StubURLProtocol.self]          // route all requests to the stub
    StubURLProtocol.responseData = Data(#"{"name":"Johnson"}"#.utf8) // the fake server response
    let repository = UserRepository(session: URLSession(configuration: config)) // the REAL repository and the REAL decoding
    let user = try await repository.fetchUser()              // runs the real network code path
    XCTAssertEqual(user.name, "Johnson")                     // proves the JSON keys and mapping are correct
}
\`\`\`

3. UI test: a real user flow in the real app

\`\`\`swift
func test_userCanAddItemToCart() {
    let app = XCUIApplication()                              // the app under test
    app.launchArguments = ["-uiTesting"]                     // the app reads this and uses fake, predictable data
    app.launch()                                             // start the app like a user would

    app.buttons["addToCartButton"].tap()                     // find the button by its accessibility identifier and tap it
    app.buttons["cartButton"].tap()                          // open the cart
    XCTAssertTrue(app.staticTexts["cartItemTitle"].waitForExistence(timeout: 3)) // wait for the item to appear, never sleep
}
// In the app code, the identifier is set with: button.accessibilityIdentifier = "addToCartButton"
// In SwiftUI: .accessibilityIdentifier("addToCartButton")
\`\`\`

4. Snapshot test: has the screen changed visually?

\`\`\`swift
import SnapshotTesting                                       // a popular library from Point-Free (it is a third-party package)

func test_profileView_lightAndDark() {
    let view = ProfileView(viewModel: .preview)              // the screen, with fixed sample data
    let vc = UIHostingController(rootView: view)             // wrap the SwiftUI view so it can be rendered
    assertSnapshot(of: vc, as: .image(on: .iPhone13))        // light mode: compare with the saved image
    assertSnapshot(of: vc, as: .image(on: .iPhone13, traits: .init(userInterfaceStyle: .dark))) // dark mode too
}
// First run: saves a reference image and fails once. Next runs: compare against it.
// If the change is intentional, record a new reference and review the image difference in the pull request.
\`\`\`

5. Performance test: is it still fast enough?

\`\`\`swift
func test_parseLargeFeed_performance() {
    let data = loadFixture("big_feed.json")                  // a large, fixed input so every run is comparable
    measure(metrics: [XCTClockMetric(), XCTMemoryMetric()]) { // run the block several times and record time and memory
        _ = try? FeedParser().parse(data)                    // the code whose speed we protect
    }
}
// In Xcode, set a baseline (the "Set Baseline" button). Later runs fail if they become much slower.

func test_launchPerformance() {
    measure(metrics: [XCTApplicationLaunchMetric()]) {       // measures app launch time
        XCUIApplication().launch()                           // start the app on each run
    }
}
\`\`\`

When to use each:
• Unit: business rules, calculations, validation, ViewModel state. Most of your tests.
• Integration: networking plus decoding, repository plus database, anything where the bug could be in the connection between two real parts.
• UI: the few flows that must never break, like login, checkout, and onboarding.
• Snapshot: reusable components and key screens, in light and dark mode, with large text and different languages.
• Performance: hot paths and app launch, where a slowdown would hurt users.

How they compare:
• Speed: unit is the fastest, then integration, snapshot, performance, and UI is the slowest.
• Reliability: unit tests are the most stable, and UI tests are the most likely to be flaky.
• What a failure tells you: a unit test failure points to one function. A UI test failure only says that something in the flow broke.
• Cost to maintain: UI and snapshot tests need the most updates when the design changes.

Good to mention (Staff-Level Interview Points):
• The Test Pyramid: Many unit, fewer integration, very few UI. A pyramid turned upside down creates an unbearable, flaky, slow CI pipeline.
• Avoid Duplicate Coverage: If unit tests verify every permutation of a promo code discount algorithm, the UI test only needs to assert that a discount banner renders, not re-verify 20 math cases.
• UI Test Flakiness Prevention: Always query elements via \`accessibilityIdentifier\` (never localized text), use \`waitForExistence(timeout:)\` rather than \`Thread.sleep\`, and pass launch arguments (\`-uiTesting\`) to stub backend state.
• Snapshot Testing Discipline: Pin simulator models (e.g. iPhone 15 Pro, iOS 17.4) and run snapshot jobs on deterministic CI runners to eliminate font antialiasing discrepancies.
• Performance Baselines: Hardware variance between developer laptops and cloud CI runners can invalidate baselines; run performance baselines on dedicated, isolated CI runners.
• Swift Testing Migration: Modern iOS 18+ projects adopt the native Swift Testing framework (\`@Test\`, \`#expect\`, \`@Suite\`) for lightning-fast unit tests, while retaining XCTest for UI and Performance automation.
• Execution Cadence: Run unit & snapshot suites on every pull request commit; run end-to-end UI tests on nightly builds or merge to main.

One-liner: Use many fast unit tests for logic, integration tests for real connections, a few UI tests for critical flows, snapshot tests for visual changes, and performance tests for speed.

Memory trick: U-I-U-S-P → "Unit = logic, Integration = connections, UI = user flow, Snapshot = looks, Performance = speed."`,
  codeExample: `// =========================================================================
// 🧪 SENIOR INTERVIEW ARCHITECTURE: The 5 Testing Tiers in iOS
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • Test Pyramid: The foundation is fast, hermetic unit tests; the pinnacle is a minimal
//   set of critical end-to-end UI journeys. Inverted pyramids cause brittle CI pipelines.
// • Integration without Internet: Use URLProtocol subclassing to test real URLSession +
//   JSONDecoder + Repository pipeline without hitting external servers.
// • Snapshot Verification: Pin snapshot tests to fixed device dimensions, traits (dark/light),
//   and mock fixtures to eliminate false-positive diffs on pull requests.
// • MetricKit & XCTMetric: Measure time, memory allocation, and app launch performance
//   against established baselines on dedicated CI runners.

import Foundation
import XCTest
import UIKit

// MARK: - 1. TIER 1: UNIT TEST (Fast, Isolated ViewModel Logic)

@MainActor
final class ProfileViewModelTests: XCTestCase {
    func test_load_failure_setsError() async {
        // Arrange
        let mockService = MockUserService(result: .failure(URLError(.notConnectedToInternet)))
        let viewModel = ProfileViewModel(service: mockService)
        
        // Act
        await viewModel.load()
        
        // Assert: verifies observable public state with zero network latency
        XCTAssertEqual(viewModel.errorMessage, "Could not load profile")
    }
}

// MARK: - 2. TIER 2: INTEGRATION TEST (Real URLSession + Decoder, Stubbed Network)

final class StubURLProtocol: URLProtocol {
    static var responseData = Data()
    static var statusCode = 200

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let response = HTTPURLResponse(
            url: request.url!,
            statusCode: Self.statusCode,
            httpVersion: nil,
            headerFields: ["Content-Type": "application/json"]
        )!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Self.responseData)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

final class UserRepositoryIntegrationTests: XCTestCase {
    func test_realRepository_decodesServerJSON() async throws {
        // Ephemeral session configured with our stub protocol
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [StubURLProtocol.self]
        let session = URLSession(configuration: config)

        StubURLProtocol.responseData = Data(#"{"id":"123","name":"Johnson","isPremium":true}"#.utf8)
        
        // REAL UserRepository, REAL JSONDecoder, REAL network pipeline
        let repository = UserRepository(session: session)
        let user = try await repository.fetchUser()

        XCTAssertEqual(user.name, "Johnson")
        XCTAssertTrue(user.isPremium)
    }
}

// MARK: - 3. TIER 3: UI TEST (Real User Flow with Accessibility Identifiers)

final class CheckoutFlowUITests: XCTestCase {
    func test_userCanAddItemToCart() {
        let app = XCUIApplication()
        app.launchArguments = ["-uiTesting", "-mockAuthToken"]
        app.launch()

        // 💡 Query exclusively by accessibilityIdentifier to decouple tests from UI localization
        let addBtn = app.buttons["addToCartButton"]
        XCTAssertTrue(addBtn.waitForExistence(timeout: 5), "Add button must be present")
        addBtn.tap()

        let cartBtn = app.buttons["cartButton"]
        cartBtn.tap()

        let itemTitle = app.staticTexts["cartItemTitle"]
        // 💡 Use waitForExistence rather than brittle Thread.sleep
        XCTAssertTrue(itemTitle.waitForExistence(timeout: 3))
    }
}

// MARK: - 4. TIER 4: SNAPSHOT TEST (Visual Regression)

// In your Podfile / Package.swift: Point-Free SnapshotTesting
// import SnapshotTesting
//
// final class ProfileViewSnapshotTests: XCTestCase {
//     func test_profileView_lightAndDarkMode() {
//         let view = ProfileView(viewModel: .preview)
//         let vc = UIHostingController(rootView: view)
//         
//         // Assert appearance against reference image on iPhone 15
//         assertSnapshot(of: vc, as: .image(on: .iPhone13))
//         assertSnapshot(of: vc, as: .image(on: .iPhone13, traits: .init(userInterfaceStyle: .dark)))
//     }
// }

// MARK: - 5. TIER 5: PERFORMANCE TEST (Measuring Hot Paths & App Launch)

final class AppPerformanceTests: XCTestCase {
    func test_feedParsingPerformance() {
        let bundle = Bundle(for: type(of: self))
        guard let url = bundle.url(forResource: "large_feed", withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return }

        // Measures clock execution time and memory allocation across 10 iterations
        measure(metrics: [XCTClockMetric(), XCTMemoryMetric()]) {
            _ = try? JSONDecoder().decode([User].self, from: data)
        }
    }

    func test_appLaunchPerformance() {
        // Measures time from process fork to first frame render
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }
}`
};

// 1. Shift questions in questions.json from index 69 (current Q-70: CI/CD) onwards
for (let i = 69; i < questions.length; i++) {
  const currentNum = i + 1; // 70..81
  const newNum = currentNum + 1; // 71..82
  questions[i].id = "Q-" + String(newNum).padStart(2, '0');
}

// Insert newQ70 at index 69
questions.splice(69, 0, newQ70);
console.log('New questions count in questions.json:', questions.length);
fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
console.log('✓ questions.json updated successfully!');

// 2. Update index.html
// Replace const QUESTIONS
const startQ = html.indexOf('const QUESTIONS = [');
const endQ = html.indexOf(';\n    const MODULE_DOCS =', startQ);
const newQuestionsCode = 'const QUESTIONS = ' + JSON.stringify(questions);
html = html.substring(0, startQ) + newQuestionsCode + html.substring(endQ);

// Update TOPIC_CATEGORIES
const startCat = html.indexOf('const TOPIC_CATEGORIES = [');
const endCat = html.indexOf('];\n', startCat);
const topicCategories = JSON.parse(html.substring(startCat + 'const TOPIC_CATEGORIES = '.length, endCat + 1));

for (const cat of topicCategories) {
    if (cat.id === 'testing-ci-cd') {
        cat.questionIds = ['Q-63', 'Q-64', 'Q-65', 'Q-66', 'Q-67', 'Q-68', 'Q-69', 'Q-70', 'Q-71', 'Q-72'];
        cat.docIds = ["testing-xctest", "performance-profiling", "dependency-injection"];
    } else if (cat.id === 'leadership-production') {
        cat.questionIds = ['Q-73', 'Q-74'];
    } else if (cat.id === 'memory-management') {
        cat.questionIds = ['Q-75', 'Q-76', 'Q-77', 'Q-78', 'Q-79', 'Q-80', 'Q-81', 'Q-82'];
    }
}
const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(topicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
const newQ2D = {};

for (const [key, val] of Object.entries(oldQ2D)) {
    const num = parseInt(key.replace('Q-', ''), 10);
    if (num >= 70) {
        const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
        newQ2D[shiftedKey] = val;
    } else {
        newQ2D[key] = val;
    }
}

// Add mapping for Q-70
newQ2D['Q-70'] = [
    {
        docId: "testing-xctest",
        title: "XCTest, Mocking & UI Testing Guide",
        filename: "Testing-TalkingPoints.md",
        icon: "🧪"
    },
    {
        docId: "performance-profiling",
        title: "Performance Profiling & Instruments — Talking Points",
        filename: "PerformanceProfiling-TalkingPoints.md",
        icon: "⏱️"
    }
];

const newQ2DCode = 'const QUESTION_TO_DOCS = ' + JSON.stringify(newQ2D) + ';';
html = html.substring(0, startQ2D) + newQ2DCode + html.substring(endQ2D + 2);

// Update text counters in index.html
html = html.replace(/81 Questions/g, '82 Questions');
html = html.replace(/81 questions/g, '82 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 3. Update QUESTIONS.md
md = md.replace(
  '| **Testing, CI/CD & AI Engineering** | `9` |',
  '| **Testing, CI/CD & AI Engineering** | `10` |'
);
md = md.replace(
  '| **Total** | **`81`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`82`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 81 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 82 iOS interview questions'
);

// Update Section headers
md = md.replace(
  '## 🧪 Testing, CI/CD & AI Engineering (Q-63 – Q-71)',
  '## 🧪 Testing, CI/CD & AI Engineering (Q-63 – Q-72)'
);
md = md.replace(
  '## 👔 Engineering Leadership & Operations (Q-72 – Q-73)',
  '## 👔 Engineering Leadership & Operations (Q-73 – Q-74)'
);
md = md.replace(
  '## 🧠 Memory Management (Q-74 – Q-81)',
  '## 🧠 Memory Management (Q-75 – Q-82)'
);

// Shift question anchors in reverse (from 81 down to 70)
for (let num = 81; num >= 70; num--) {
  const currentRegex = new RegExp(`### \`Q-${num}\` —`, 'g');
  const targetId = `### \`Q-${num + 1}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Prepare markdown for Q-70
const q70Md = `
---

### \`Q-70\` — Unit vs UI vs snapshot vs integration vs performance tests. When do you use each?

- **Category:** \`Testing, CI/CD & AI Engineering\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I structure automated testing as a pyramid: fast unit tests verify business logic and ViewModel state, integration tests validate multi-layer data flow with stubbed network protocols, minimal UI tests protect critical user journeys via accessibility identifiers, snapshot tests prevent accidental visual regressions, and performance metrics guard hot paths against regression."*

#### 📖 Detailed Answer

Each test type answers a different question, and each has a different cost. The cheaper tests are fast and precise, and the expensive ones are slow but closer to what the user really does. A good project uses all five, in the right amounts. The usual shape is a test pyramid: many unit tests at the bottom, fewer integration tests in the middle, and a small number of UI tests at the top. Snapshot and performance tests are added where they protect something specific.

Say it like this:

"I choose the test type by the question I want answered.

A unit test asks, 'does this one piece of logic give the right answer?' It tests a single function or ViewModel, with fake dependencies, so there is no network, no database, and no UI. It runs in milliseconds, so I write the most of these. I use them for business rules, calculations, validation, and ViewModel state.

An integration test asks, 'do these real pieces work together?' For example, the real networking layer, the real JSON decoding, and the real repository, with only the outside world replaced, like a stubbed server response or an in-memory database. It catches bugs that unit tests miss, like a wrong JSON key or a wrong mapping between layers. These are slower, so I write fewer.

A UI test asks, 'can a user complete this flow in the real app?' It launches the app and taps through it, like login, add to cart, and checkout. It is the closest to real use, but it is slow and can be flaky, so I keep these for the few critical flows only, and I feed them fake data through launch arguments.

A snapshot test asks, 'does this screen still look the same as before?' It renders a view into an image and compares it with a saved reference image. It catches accidental visual changes, like a broken layout, a missing label, or Dark Mode and Dynamic Type issues. It tells me that something changed, not whether the change is correct, so a person still reviews the difference.

A performance test asks, 'is this code still fast enough?' It runs a piece of code several times, measures time or memory, and compares the result with a saved baseline. I use it for hot paths like parsing a big file, sorting, image processing, and app launch, so a slow change is caught before release.

So for any new feature, most of my tests are unit tests, a few are integration tests for the data flow, one or two UI tests cover the main journey, and snapshot and performance tests protect the parts where looks or speed really matter."

1. Unit test: one piece of logic, with a fake dependency

\`\`\`swift
func test_load_failure_setsError() async {
    let service = MockUserService(result: .failure(URLError(.notConnectedToInternet))) // a fake service that fails
    let viewModel = ProfileViewModel(service: service)       // inject the fake, no real network
    await viewModel.load()                                   // run the logic and wait for it to finish
    XCTAssertEqual(viewModel.errorMessage, "Could not load profile") // check the visible state
}
\`\`\`

2. Integration test: real pieces together, fake only the server

\`\`\`swift
final class StubURLProtocol: URLProtocol {                   // intercepts requests before they reach the internet
    static var responseData = Data()                         // the JSON the test wants the "server" to return

    override class func canInit(with request: URLRequest) -> Bool { true } // handle every request
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request } // no change needed
    override func startLoading() {
        client?.urlProtocol(self, didReceive: HTTPURLResponse(url: request.url!, statusCode: 200,
                            httpVersion: nil, headerFields: nil)!, cacheStoragePolicy: .notAllowed) // send a 200 response
        client?.urlProtocol(self, didLoad: Self.responseData) // send the stubbed JSON body
        client?.urlProtocolDidFinishLoading(self)            // tell URLSession the response is complete
    }
    override func stopLoading() {}                           // nothing to cancel
}

func test_realRepository_decodesServerJSON() async throws {
    let config = URLSessionConfiguration.ephemeral           // a session with no shared cache
    config.protocolClasses = [StubURLProtocol.self]          // route all requests to the stub
    StubURLProtocol.responseData = Data(#"{"name":"Johnson"}"#.utf8) // the fake server response
    let repository = UserRepository(session: URLSession(configuration: config)) // the REAL repository and the REAL decoding
    let user = try await repository.fetchUser()              // runs the real network code path
    XCTAssertEqual(user.name, "Johnson")                     // proves the JSON keys and mapping are correct
}
\`\`\`

3. UI test: a real user flow in the real app

\`\`\`swift
func test_userCanAddItemToCart() {
    let app = XCUIApplication()                              // the app under test
    app.launchArguments = ["-uiTesting"]                     // the app reads this and uses fake, predictable data
    app.launch()                                             // start the app like a user would

    app.buttons["addToCartButton"].tap()                     // find the button by its accessibility identifier and tap it
    app.buttons["cartButton"].tap()                          // open the cart
    XCTAssertTrue(app.staticTexts["cartItemTitle"].waitForExistence(timeout: 3)) // wait for the item to appear, never sleep
}
// In the app code, the identifier is set with: button.accessibilityIdentifier = "addToCartButton"
// In SwiftUI: .accessibilityIdentifier("addToCartButton")
\`\`\`

4. Snapshot test: has the screen changed visually?

\`\`\`swift
import SnapshotTesting                                       // a popular library from Point-Free (it is a third-party package)

func test_profileView_lightAndDark() {
    let view = ProfileView(viewModel: .preview)              // the screen, with fixed sample data
    let vc = UIHostingController(rootView: view)             // wrap the SwiftUI view so it can be rendered
    assertSnapshot(of: vc, as: .image(on: .iPhone13))        // light mode: compare with the saved image
    assertSnapshot(of: vc, as: .image(on: .iPhone13, traits: .init(userInterfaceStyle: .dark))) // dark mode too
}
// First run: saves a reference image and fails once. Next runs: compare against it.
// If the change is intentional, record a new reference and review the image difference in the pull request.
\`\`\`

5. Performance test: is it still fast enough?

\`\`\`swift
func test_parseLargeFeed_performance() {
    let data = loadFixture("big_feed.json")                  // a large, fixed input so every run is comparable
    measure(metrics: [XCTClockMetric(), XCTMemoryMetric()]) { // run the block several times and record time and memory
        _ = try? FeedParser().parse(data)                    // the code whose speed we protect
    }
}
// In Xcode, set a baseline (the "Set Baseline" button). Later runs fail if they become much slower.

func test_launchPerformance() {
    measure(metrics: [XCTApplicationLaunchMetric()]) {       // measures app launch time
        XCUIApplication().launch()                           // start the app on each run
    }
}
\`\`\`

When to use each:
• Unit: business rules, calculations, validation, ViewModel state. Most of your tests.
• Integration: networking plus decoding, repository plus database, anything where the bug could be in the connection between two real parts.
• UI: the few flows that must never break, like login, checkout, and onboarding.
• Snapshot: reusable components and key screens, in light and dark mode, with large text and different languages.
• Performance: hot paths and app launch, where a slowdown would hurt users.

How they compare:
• Speed: unit is the fastest, then integration, snapshot, performance, and UI is the slowest.
• Reliability: unit tests are the most stable, and UI tests are the most likely to be flaky.
• What a failure tells you: a unit test failure points to one function. A UI test failure only says that something in the flow broke.
• Cost to maintain: UI and snapshot tests need the most updates when the design changes.

Good to mention (Staff-Level Interview Points):
• The Test Pyramid: Many unit, fewer integration, very few UI. A pyramid turned upside down creates an unbearable, flaky, slow CI pipeline.
• Avoid Duplicate Coverage: If unit tests verify every permutation of a promo code discount algorithm, the UI test only needs to assert that a discount banner renders, not re-verify 20 math cases.
• UI Test Flakiness Prevention: Always query elements via \`accessibilityIdentifier\` (never localized text), use \`waitForExistence(timeout:)\` rather than \`Thread.sleep\`, and pass launch arguments (\`-uiTesting\`) to stub backend state.
• Snapshot Testing Discipline: Pin simulator models (e.g. iPhone 15 Pro, iOS 17.4) and run snapshot jobs on deterministic CI runners to eliminate font antialiasing discrepancies.
• Performance Baselines: Hardware variance between developer laptops and cloud CI runners can invalidate baselines; run performance baselines on dedicated, isolated CI runners.
• Swift Testing Migration: Modern iOS 18+ projects adopt the native Swift Testing framework (\`@Test\`, \`#expect\`, \`@Suite\`) for lightning-fast unit tests, while retaining XCTest for UI and Performance automation.
• Execution Cadence: Run unit & snapshot suites on every pull request commit; run end-to-end UI tests on nightly builds or merge to main.

One-liner: Use many fast unit tests for logic, integration tests for real connections, a few UI tests for critical flows, snapshot tests for visual changes, and performance tests for speed.

Memory trick: U-I-U-S-P → "Unit = logic, Integration = connections, UI = user flow, Snapshot = looks, Performance = speed."

#### 💻 Swift Code Example

\`\`\`swift
${newQ70.codeExample}
\`\`\`
`;

// Insert q70Md right before "### `Q-71` — CI/CD pipelines"
const insertMarker = '### `Q-71` — CI/CD pipelines';
const markerIdx = md.indexOf(insertMarker);
if (markerIdx === -1) {
    console.error('Could not find insertMarker in QUESTIONS.md');
    process.exit(1);
}

md = md.substring(0, markerIdx) + q70Md + '\n\n---\n\n' + md.substring(markerIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
