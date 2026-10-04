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

const newQ66 = {
  id: "Q-66",
  category: "Testing, CI/CD & AI Engineering",
  difficulty: "Advanced",
  question: "How do you write code that is easy to test?",
  interviewSentence: "Writing testable code relies on four habits: constructor dependency injection over singletons, protocol abstractions at external boundaries, injecting deterministic time and UUID generators, and encapsulating business logic in side-effect-free pure functions.",
  answer: `Code is hard to test when it reaches out to things a test cannot control: the real network, the clock, a database, or a singleton. A test then needs internet, and it gives a different result on each run. So the idea is to give the code its dependencies from outside, so a test can swap in a fake one. This matters most in ViewModels, services, and business rules.

Say it like this:

"I follow four habits.

First, I inject dependencies. The ViewModel receives its service in the initializer, and I avoid singletons like APIClient.shared inside logic, because a test cannot replace them.

Second, I depend on protocols at real boundaries, like the network, the database, and the Keychain. The app passes the real type, and the test passes a small fake that returns success or an error, whatever I choose.

Third, I control time and randomness. If code calls Date() or UUID() directly, the result changes on every run, so I pass them in.

Fourth, I keep business rules in pure functions and keep views thin. A pure function gives the same output for the same input, so it needs no setup.

If a test needs a lot of setup, I change the design, not the test."

1. Inject a protocol instead of using a singleton

\`\`\`swift
protocol UserService {                                    // describes only what the ViewModel needs
    func fetchUser() async throws -> User                 // one method, easy to fake
}

init(service: UserService) {                              // the dependency comes from outside
    self.service = service                                // store it, the real app passes the real one
}
\`\`\`

2. A tiny mock for the test

\`\`\`swift
struct MockUserService: UserService {                     // a fake that conforms to the same protocol
    var result: Result<User, Error>                       // the test chooses success or failure

    func fetchUser() async throws -> User {               // same signature as the real service
        try result.get()                                  // return the user, or throw the error
    }
}
\`\`\`

3. Control time and IDs

\`\`\`swift
init(now: @escaping () -> Date = Date.init,               // the real app uses the real clock by default
     makeID: @escaping () -> UUID = UUID.init) {          // the real app uses real IDs by default
    self.now = now                                        // store the clock function
    self.makeID = makeID                                  // store the ID function, a test passes fixed values
}
\`\`\`

4. Pure function for a business rule

\`\`\`swift
func discountedTotal(subtotal: Decimal, percentOff: Decimal) -> Decimal {
    max(subtotal - subtotal * percentOff / 100, 0)        // depends only on inputs, never goes below zero
}
\`\`\`

5. One test shows the result

\`\`\`swift
func test_load_failure_setsError() async {
    let service = MockUserService(result: .failure(URLError(.notConnectedToInternet))) // a fake that fails
    let viewModel = ProfileViewModel(service: service)    // inject the fake
    await viewModel.load()                                // wait for the work, no sleep needed
    XCTAssertEqual(viewModel.errorMessage, "Could not load profile") // check the visible state
}
\`\`\`

Quick steps to remember:
• Inject dependencies through the initializer.
• Protocols only at real boundaries.
• Control time and randomness by passing them in.
• Pure functions for rules, thin views for display.

Good to mention:
• Default parameter values keep production code clean, and tests override them.
• Test behavior, such as visible state, and not private methods.
• Do not mock everything. Fake only the boundaries.
• Never use sleep in tests. Use await, or an injected clock.
• Avoid global state, because it leaks between tests.

One-liner: Inject dependencies through protocols, control time and randomness, and keep logic in pure functions, so tests are fast and predictable.

Memory trick: I-P-C-S → "Inject, Protocols at boundaries, Control time, Separate logic from UI."`,
  codeExample: `// =========================================================================
// 🧪 SENIOR INTERVIEW ARCHITECTURE: Writing Testable iOS Code
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • Dependency Injection at Boundaries: Inject protocols into initializers rather than
//   accessing singletons (like URLSession.shared or APIClient.shared) inside logic.
// • Controlling Non-Determinism (Time & Randomness): Never call \`Date()\` or \`UUID()\` directly
//   inside business logic. Pass closures with default arguments (\`now: @escaping () -> Date = Date.init\`).
// • Pure Functions for Business Logic: Extract calculation algorithms into pure functions
//   (same input -> same output, no side effects) requiring zero mocks or setup.
// • State Verification over Mock Verification: Assert on observable state (ViewModel properties)
//   rather than asserting on private implementation details.
// • Flaky Test Elimination: Never use \`Thread.sleep\` or hardcoded delays in tests. Use Swift
//   concurrency \`await\` or injected deterministic clocks.

import Foundation
import XCTest

// MARK: - 1. Domain Models
struct User: Codable, Equatable {
    let id: UUID
    let name: String
    let isPremium: Bool
}

// MARK: - 2. Protocol Boundaries (The Dependency)
protocol UserService {
    func fetchUser() async throws -> User
}

// MARK: - 3. Testable ViewModel (Dependency Injection & Deterministic Time/ID)
@MainActor
final class ProfileViewModel: ObservableObject {
    @Published private(set) var user: User?
    @Published private(set) var errorMessage: String?
    @Published private(set) var lastUpdated: Date?
    
    private let service: UserService
    private let now: () -> Date
    private let makeID: () -> UUID
    
    // 💡 Default parameter values keep production call sites clean: ProfileViewModel(service: RealService())
    // while unit tests can override every dependency deterministically.
    init(
        service: UserService,
        now: @escaping () -> Date = Date.init,
        makeID: @escaping () -> UUID = UUID.init
    ) {
        self.service = service
        self.now = now
        self.makeID = makeID
    }
    
    func load() async {
        do {
            let fetchedUser = try await service.fetchUser()
            self.user = fetchedUser
            self.lastUpdated = now()
            self.errorMessage = nil
        } catch {
            self.errorMessage = "Could not load profile"
        }
    }
    
    // 💡 Pure Function: Zero side-effects, 100% deterministic, trivially testable
    func discountedTotal(subtotal: Decimal, percentOff: Decimal) -> Decimal {
        max(subtotal - (subtotal * percentOff / 100), 0)
    }
}

// MARK: - 4. Lightweight Test Fake (Mock)
struct MockUserService: UserService {
    var result: Result<User, Error>
    
    func fetchUser() async throws -> User {
        try result.get()
    }
}

// MARK: - 5. Unit Tests (Fast, Deterministic, Zero Network)
final class ProfileViewModelTests: XCTestCase {
    
    func test_load_success_populatesUserAndTimestamp() async {
        // Arrange: fixed deterministic time and mock user
        let fixedDate = Date(timeIntervalSince1970: 1700000000)
        let expectedUser = User(id: UUID(), name: "Jane Doe", isPremium: true)
        let mockService = MockUserService(result: .success(expectedUser))
        
        let viewModel = await ProfileViewModel(
            service: mockService,
            now: { fixedDate }
        )
        
        // Act
        await viewModel.load()
        
        // Assert: verify observable public state
        let loadedUser = await viewModel.user
        let loadedDate = await viewModel.lastUpdated
        let error = await viewModel.errorMessage
        
        XCTAssertEqual(loadedUser, expectedUser)
        XCTAssertEqual(loadedDate, fixedDate)
        XCTAssertNil(error)
    }
    
    func test_load_failure_setsError() async {
        // Arrange: inject network failure mock
        let mockService = MockUserService(result: .failure(URLError(.notConnectedToInternet)))
        let viewModel = await ProfileViewModel(service: mockService)
        
        // Act
        await viewModel.load()
        
        // Assert: verify error banner message
        let error = await viewModel.errorMessage
        let loadedUser = await viewModel.user
        
        XCTAssertEqual(error, "Could not load profile")
        XCTAssertNil(loadedUser)
    }
    
    func test_discountedTotal_calculatesAccuratelyAndNeverNegative() async {
        let viewModel = await ProfileViewModel(service: MockUserService(result: .failure(URLError(.cancelled))))
        
        let standard = await viewModel.discountedTotal(subtotal: 100, percentOff: 20)
        let excessive = await viewModel.discountedTotal(subtotal: 50, percentOff: 120)
        
        XCTAssertEqual(standard, 80)
        XCTAssertEqual(excessive, 0)
    }
}`
};

// 1. Shift questions in questions.json from index 65 (current Q-66) onwards
for (let i = 65; i < questions.length; i++) {
  const currentNum = i + 1; // 66..80
  const newNum = currentNum + 1; // 67..81
  questions[i].id = "Q-" + String(newNum).padStart(2, '0');
}

// Insert newQ66 at index 65
questions.splice(65, 0, newQ66);
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
        cat.questionIds = ['Q-60', 'Q-61', 'Q-62', 'Q-63', 'Q-64', 'Q-65', 'Q-66', 'Q-67', 'Q-68'];
        cat.docIds = ["testing-xctest", "dependency-injection", "solid-principles"];
    } else if (cat.id === 'leadership-production') {
        cat.questionIds = ['Q-69', 'Q-70'];
    } else if (cat.id === 'memory-management') {
        cat.questionIds = ['Q-71', 'Q-72', 'Q-73', 'Q-74', 'Q-75', 'Q-76', 'Q-77', 'Q-78'];
    } else if (cat.id === 'security-compliance') {
        cat.questionIds = ['Q-48', 'Q-49', 'Q-50', 'Q-51', 'Q-52', 'Q-53', 'Q-54', 'Q-55', 'Q-56', 'Q-79', 'Q-80', 'Q-81'];
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
    if (num >= 66) {
        const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
        newQ2D[shiftedKey] = val;
    } else {
        newQ2D[key] = val;
    }
}

// Add mapping for Q-66
newQ2D['Q-66'] = [
    {
        docId: "testing-xctest",
        title: "XCTest, Mocking & UI Testing Guide",
        filename: "Testing-TalkingPoints.md",
        icon: "🧪"
    },
    {
        docId: "dependency-injection",
        title: "Dependency Injection (Constructor vs Property Injection)",
        filename: "DI-README.md",
        icon: "💉"
    }
];

const newQ2DCode = 'const QUESTION_TO_DOCS = ' + JSON.stringify(newQ2D) + ';';
html = html.substring(0, startQ2D) + newQ2DCode + html.substring(endQ2D + 2);

// Update text counters in index.html
html = html.replace(/80 Questions/g, '81 Questions');
html = html.replace(/80 questions/g, '81 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 3. Update QUESTIONS.md
md = md.replace(
  '| **Testing, CI/CD & AI Engineering** | `8` |',
  '| **Testing, CI/CD & AI Engineering** | `9` |'
);
md = md.replace(
  '| **Total** | **`80`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`81`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 80 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 81 iOS interview questions'
);

// Update Section headers
md = md.replace(
  '## 🧪 Testing, CI/CD & AI Engineering (Q-60 – Q-67)',
  '## 🧪 Testing, CI/CD & AI Engineering (Q-60 – Q-68)'
);
md = md.replace(
  '## 👔 Engineering Leadership & Operations (Q-68 – Q-69)',
  '## 👔 Engineering Leadership & Operations (Q-69 – Q-70)'
);
md = md.replace(
  '## 🧠 Memory Management (Q-70 – Q-77)',
  '## 🧠 Memory Management (Q-71 – Q-78)'
);
md = md.replace(
  '## 🔒 Security, Auth & Compliance (Q-48 – Q-56, Q-78 – Q-80)',
  '## 🔒 Security, Auth & Compliance (Q-48 – Q-56, Q-79 – Q-81)'
);

// Shift question anchors in reverse
md = md.replace(/### `Q-80` —/g, '### `Q-81` —');
md = md.replace(/### `Q-79` —/g, '### `Q-80` —');
md = md.replace(/### `Q-78` —/g, '### `Q-79` —');

for (let num = 77; num >= 66; num--) {
  const currentRegex = new RegExp(`### \`Q-${num}\` —`, 'g');
  const targetId = `### \`Q-${num + 1}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Prepare markdown for Q-66
const q66Md = `
---

### \`Q-66\` — How do you write code that is easy to test?

- **Category:** \`Testing, CI/CD & AI Engineering\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"Writing testable code relies on four habits: constructor dependency injection over singletons, protocol abstractions at external boundaries, injecting deterministic time and UUID generators, and encapsulating business logic in side-effect-free pure functions."*

#### 📖 Detailed Answer

Code is hard to test when it reaches out to things a test cannot control: the real network, the clock, a database, or a singleton. A test then needs internet, and it gives a different result on each run. So the idea is to give the code its dependencies from outside, so a test can swap in a fake one. This matters most in ViewModels, services, and business rules.

Say it like this:

"I follow four habits.

First, I inject dependencies. The ViewModel receives its service in the initializer, and I avoid singletons like APIClient.shared inside logic, because a test cannot replace them.

Second, I depend on protocols at real boundaries, like the network, the database, and the Keychain. The app passes the real type, and the test passes a small fake that returns success or an error, whatever I choose.

Third, I control time and randomness. If code calls Date() or UUID() directly, the result changes on every run, so I pass them in.

Fourth, I keep business rules in pure functions and keep views thin. A pure function gives the same output for the same input, so it needs no setup.

If a test needs a lot of setup, I change the design, not the test."

1. Inject a protocol instead of using a singleton

\`\`\`swift
protocol UserService {                                    // describes only what the ViewModel needs
    func fetchUser() async throws -> User                 // one method, easy to fake
}

init(service: UserService) {                              // the dependency comes from outside
    self.service = service                                // store it, the real app passes the real one
}
\`\`\`

2. A tiny mock for the test

\`\`\`swift
struct MockUserService: UserService {                     // a fake that conforms to the same protocol
    var result: Result<User, Error>                       // the test chooses success or failure

    func fetchUser() async throws -> User {               // same signature as the real service
        try result.get()                                  // return the user, or throw the error
    }
}
\`\`\`

3. Control time and IDs

\`\`\`swift
init(now: @escaping () -> Date = Date.init,               // the real app uses the real clock by default
     makeID: @escaping () -> UUID = UUID.init) {          // the real app uses real IDs by default
    self.now = now                                        // store the clock function
    self.makeID = makeID                                  // store the ID function, a test passes fixed values
}
\`\`\`

4. Pure function for a business rule

\`\`\`swift
func discountedTotal(subtotal: Decimal, percentOff: Decimal) -> Decimal {
    max(subtotal - subtotal * percentOff / 100, 0)        // depends only on inputs, never goes below zero
}
\`\`\`

5. One test shows the result

\`\`\`swift
func test_load_failure_setsError() async {
    let service = MockUserService(result: .failure(URLError(.notConnectedToInternet))) // a fake that fails
    let viewModel = ProfileViewModel(service: service)    // inject the fake
    await viewModel.load()                                // wait for the work, no sleep needed
    XCTAssertEqual(viewModel.errorMessage, "Could not load profile") // check the visible state
}
\`\`\`

Quick steps to remember:
• Inject dependencies through the initializer.
• Protocols only at real boundaries.
• Control time and randomness by passing them in.
• Pure functions for rules, thin views for display.

Good to mention:
• Default parameter values keep production code clean, and tests override them.
• Test behavior, such as visible state, and not private methods.
• Do not mock everything. Fake only the boundaries.
• Never use sleep in tests. Use await, or an injected clock.
• Avoid global state, because it leaks between tests.

One-liner: Inject dependencies through protocols, control time and randomness, and keep logic in pure functions, so tests are fast and predictable.

Memory trick: I-P-C-S → "Inject, Protocols at boundaries, Control time, Separate logic from UI."

#### 💻 Swift Code Example

\`\`\`swift
${newQ66.codeExample}
\`\`\`
`;

// Insert q66Md right before "### `Q-67` — CI/CD pipelines"
const insertMarker = '### `Q-67` — CI/CD pipelines';
const markerIdx = md.indexOf(insertMarker);
if (markerIdx === -1) {
    console.error('Could not find insertMarker in QUESTIONS.md');
    process.exit(1);
}

md = md.substring(0, markerIdx) + q66Md + '\n\n---\n\n' + md.substring(markerIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
