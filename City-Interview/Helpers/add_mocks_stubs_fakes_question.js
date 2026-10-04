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

const newQ71 = {
  id: "Q-71",
  category: "Testing, CI/CD & AI Engineering",
  difficulty: "Senior",
  question: "What are mocks, stubs, and fakes? When do you use each?",
  interviewSentence: "A test double is the umbrella term for test stand-ins: stubs return canned responses to control input, fakes provide lightweight working in-memory implementations to model realistic stateful behavior, and mocks (or spies) record invocations to verify side effects like analytics or logging.",
  answer: `When you test a piece of code, you don't want it to use the real server, the real database, or the real payment system. Those are slow, they cost money, and they give different results each time. So in a test, you replace the real thing with a simple pretend version.

A test double is the general name for any pretend version used in a test. A stand-in means the same thing, just a plainer word. So yes, you can think of it as a placeholder: it sits in the spot where the real object would be, so the code under test does not notice the difference.

Mocks, stubs, and fakes are different kinds of test doubles. They differ in what the pretend version does.

Say it like this:

"A test double is a pretend object that I use in a test instead of the real one. The code I am testing talks to it the same way, usually through a protocol, so the real object can be swapped out.

A stub gives fixed answers. I tell it what to return, like 'return this user' or 'throw this error', and it just does that. It has no logic. I use it when I only need to control what comes into my code.

A fake is a simple but working version of the real thing. The best example is an in-memory database. It really saves and loads data, but it keeps it in a dictionary instead of on disk. I use it when the code needs realistic behavior, like save something and read it back later, but the real thing is too slow or too heavy.

A mock records how it was used, and my test checks that. For example, 'was the analytics event sent once, with this name?' I use it when the important result is a call that goes out and leaves no visible state, like sending an event, a log, or an email.

So the question I ask is: do I need to control the input, do I need realistic behavior, or do I need to check that a call happened? Input is a stub, behavior is a fake, and a call is a mock.

One more point. In everyday Swift talk, people call all of these 'mocks'. That is fine in a team. In an interview, I mention the difference, because it shows I know what each one is for."

The protocol that all three replace

\`\`\`swift
protocol UserStore {                                       // describes what the code needs from storage
    func save(_ user: User)                                // store a user
    func load(id: Int) -> User?                            // read a user back, or nil if missing
}
\`\`\`

1. Stub: fixed answers

\`\`\`swift
struct StubUserService: UserService {                      // a pretend service that returns fixed results
    var result: Result<User, Error>                        // the test decides success or failure

    func fetchUser() async throws -> User {                // same method as the real service
        try result.get()                                   // return the chosen user, or throw the chosen error
    }
}
\`\`\`

2. Fake: a simple working version

\`\`\`swift
final class FakeUserStore: UserStore {                     // behaves like real storage, but only in memory
    private var users: [Int: User] = [:]                   // a dictionary acts as the pretend database

    func save(_ user: User) {                              // same method as the real store
        users[user.id] = user                              // really keep the user, so it can be read later
    }

    func load(id: Int) -> User? {                          // same method as the real store
        users[id]                                          // return what was saved, or nil if nothing was
    }
}
\`\`\`

3. Mock: records calls so the test can check them

\`\`\`swift
final class MockAnalytics: Analytics {                     // a pretend analytics tool that remembers what it received
    private(set) var events: [String] = []                 // every event name that was sent to it

    func track(_ name: String) {                           // same method as the real analytics
        events.append(name)                                // just remember it, do not send anything anywhere
    }
}
\`\`\`

4. How the test uses each one

\`\`\`swift
func test_checkout_tracksPurchaseOnce() async {
    let analytics = MockAnalytics()                        // the mock that will record calls
    let store = FakeUserStore()                            // the fake that really saves in memory
    store.save(User(id: 1, name: "Johnson"))               // put data in, like a real database would hold

    let viewModel = CheckoutViewModel(
        userService: StubUserService(result: .success(User(id: 1, name: "Johnson"))), // stub: controls the input
        store: store,                                      // fake: realistic storage
        analytics: analytics                               // mock: records the outgoing call
    )
    await viewModel.pay()                                  // run the code under test

    XCTAssertEqual(analytics.events, ["purchase"])         // mock check: the event was sent exactly once
}
\`\`\`

How they compare:
• Stub: returns fixed answers. Use it to control what goes into your code, such as success, an error, or an empty list.
• Fake: a simple working version, like an in-memory database. Use it when the code needs realistic behavior but the real thing is too slow or heavy.
• Mock: records calls and lets the test check them. Use it for results that leave no visible state, like analytics, logging, or sending an email.
• Test double: the general name for all of the above. It is a placeholder for the real object.

Two more names you may hear:
• Dummy: an object that is only passed to fill a parameter and is never really used.
• Spy: like a mock, it records calls. The difference is that the test checks the records afterward, instead of setting expectations first. The MockAnalytics above is technically a spy, and most Swift developers still call it a mock.

When to use them, and when not to:
• Use a double at real boundaries: the network, the database, the Keychain, the clock, analytics, and payments.
• Do not use a double for simple value types or your own pure functions. Use the real ones, because that is simpler and more trustworthy.
• Prefer stubs and fakes over mocks. A test that checks state, like "the name is now Johnson", survives refactoring. A test that checks "this method was called twice" breaks whenever the internal steps change.
• Keep doubles small. A stub with ten lines of logic is becoming a second implementation, and it can have bugs of its own.

Good to mention (Staff-Level Interview Points):
• Doubles work because of dependency injection and protocols. Without those, there is no way to swap the real object out.
• A fake can drift from the real thing. If the real database rejects duplicates and the fake does not, tests pass but production fails. A few integration tests with the real thing catch that.
• Too many mocks make tests fragile, and they can pass while the app is broken, because the test only proves that the code calls the mock the way the test expects.
• Swift has no built-in mocking library, so most teams write small doubles by hand, as above. Some use generated mocks (like Cuckoo or Mockingbird), but hand-written ones are easy to read and need no extra tools.

One-liner: A test double is a placeholder for the real object, and a stub gives fixed answers, a fake is a simple working version, and a mock records calls so the test can check them.

Memory trick: S-F-M → "Stub gives answers, Fake works simply, Mock checks calls."`,
  codeExample: `// =========================================================================
// 🎭 SENIOR INTERVIEW ARCHITECTURE: Test Doubles (Stubs, Fakes, Mocks & Spies)
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • Gerard Meszaros Taxonomy: "Test Double" is the overarching generic term.
//   1. Dummy: Passed to satisfy parameter signatures; never accessed or asserted on.
//   2. Stub: Returns canned answers to control input pathways (happy path or errors).
//   3. Fake: Working, lightweight in-memory implementation (e.g., Dictionary-backed store).
//   4. Spy: Records invocation history, arguments, and call counts for post-action verification.
//   5. Mock: Pre-programmed with strict expectations and assertions on interaction protocol.
// • Swift Protocol-Based DI: Because Swift is a statically typed compiled language without
//   dynamic runtime reflection (like JVM Mockito / C# Moq), test doubles require protocol
//   abstraction and constructor/dependency injection.
// • State vs Interaction Verification: Prefer State Verification (asserting final output on
//   Fakes and Stubs) over Interaction Verification (asserting method call counts on Mocks).
//   Interaction verification couples tests to private implementation details and causes brittleness.

import Foundation
import XCTest

// MARK: - 1. Domain Entities & Protocols

struct User: Identifiable, Equatable {
    let id: Int
    let name: String
}

protocol UserService {
    func fetchUser() async throws -> User
}

protocol UserStore {
    func save(_ user: User)
    func load(id: Int) -> User?
}

protocol Analytics {
    func track(_ name: String)
}

// MARK: - 2. Stub: Fixed Canned Answers (Input Control)

struct StubUserService: UserService {
    var result: Result<User, Error>

    func fetchUser() async throws -> User {
        try result.get()
    }
}

// MARK: - 3. Fake: Simplified Working Implementation (In-Memory Database)

final class FakeUserStore: UserStore {
    private var users: [Int: User] = [:]

    func save(_ user: User) {
        users[user.id] = user
    }

    func load(id: Int) -> User? {
        users[id]
    }
}

// MARK: - 4. Mock / Spy: Records Invocations for Side-Effect Verification

final class MockAnalytics: Analytics {
    private(set) var events: [String] = []

    func track(_ name: String) {
        events.append(name)
    }
}

// MARK: - 5. System Under Test (SUT)

final class CheckoutViewModel {
    private let userService: UserService
    private let store: UserStore
    private let analytics: Analytics

    init(userService: UserService, store: UserStore, analytics: Analytics) {
        self.userService = userService
        self.store = store
        self.analytics = analytics
    }

    func pay() async {
        guard let user = try? await userService.fetchUser() else { return }
        store.save(user)
        analytics.track("purchase")
    }
}

// MARK: - 6. XCTest Suite: Clean Orchestration of All Doubles

@MainActor
final class CheckoutViewModelTests: XCTestCase {
    func test_checkout_tracksPurchaseOnce() async {
        // Arrange
        let mockAnalytics = MockAnalytics() // Mock/Spy: records side-effect calls
        let fakeStore = FakeUserStore()     // Fake: realistic in-memory persistence
        let expectedUser = User(id: 1, name: "Johnson")
        
        let stubService = StubUserService(result: .success(expectedUser)) // Stub: canned input

        let viewModel = CheckoutViewModel(
            userService: stubService,
            store: fakeStore,
            analytics: mockAnalytics
        )

        // Act
        await viewModel.pay()

        // Assert: State verification on fake
        XCTAssertEqual(fakeStore.load(id: 1), expectedUser, "User should be persisted in store")

        // Assert: Side-effect verification on mock
        XCTAssertEqual(mockAnalytics.events, ["purchase"], "Analytics event 'purchase' must be tracked once")
    }
}`
};

// 1. Shift questions in questions.json from index 70 onwards (current Q-71: CI/CD onwards)
for (let i = 70; i < questions.length; i++) {
  const currentNum = i + 1; // 71..82
  const newNum = currentNum + 1; // 72..83
  questions[i].id = "Q-" + String(newNum).padStart(2, '0');
}

// Insert newQ71 at index 70
questions.splice(70, 0, newQ71);
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
        cat.questionIds = ['Q-63', 'Q-64', 'Q-65', 'Q-66', 'Q-67', 'Q-68', 'Q-69', 'Q-70', 'Q-71', 'Q-72', 'Q-73'];
        cat.docIds = ["testing-xctest", "performance-profiling", "dependency-injection"];
    } else if (cat.id === 'leadership-production') {
        cat.questionIds = ['Q-74', 'Q-75'];
    } else if (cat.id === 'memory-management') {
        cat.questionIds = ['Q-76', 'Q-77', 'Q-78', 'Q-79', 'Q-80', 'Q-81', 'Q-82', 'Q-83'];
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
    if (num >= 71) {
        const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
        newQ2D[shiftedKey] = val;
    } else {
        newQ2D[key] = val;
    }
}

// Add mapping for Q-71
newQ2D['Q-71'] = [
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
html = html.replace(/82 Questions/g, '83 Questions');
html = html.replace(/82 questions/g, '83 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 3. Update QUESTIONS.md
md = md.replace(
  '| **Testing, CI/CD & AI Engineering** | `10` |',
  '| **Testing, CI/CD & AI Engineering** | `11` |'
);
md = md.replace(
  '| **Total** | **`82`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`83`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 82 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 83 iOS interview questions'
);

// Update Section headers
md = md.replace(
  '## 🧪 Testing, CI/CD & AI Engineering (Q-63 – Q-72)',
  '## 🧪 Testing, CI/CD & AI Engineering (Q-63 – Q-73)'
);
md = md.replace(
  '## 👔 Engineering Leadership & Operations (Q-73 – Q-74)',
  '## 👔 Engineering Leadership & Operations (Q-74 – Q-75)'
);
md = md.replace(
  '## 🧠 Memory Management (Q-75 – Q-82)',
  '## 🧠 Memory Management (Q-76 – Q-83)'
);

// Shift question anchors in reverse (from 82 down to 71)
for (let num = 82; num >= 71; num--) {
  const currentRegex = new RegExp(`### \`Q-${num}\` —`, 'g');
  const targetId = `### \`Q-${num + 1}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Prepare markdown for Q-71
const q71Md = `
---

### \`Q-71\` — What are mocks, stubs, and fakes? When do you use each?

- **Category:** \`Testing, CI/CD & AI Engineering\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"A test double is the umbrella term for test stand-ins: stubs return canned responses to control input, fakes provide lightweight working in-memory implementations to model realistic stateful behavior, and mocks (or spies) record invocations to verify side effects like analytics or logging."*

#### 📖 Detailed Answer

When you test a piece of code, you don't want it to use the real server, the real database, or the real payment system. Those are slow, they cost money, and they give different results each time. So in a test, you replace the real thing with a simple pretend version.

A test double is the general name for any pretend version used in a test. A stand-in means the same thing, just a plainer word. So yes, you can think of it as a placeholder: it sits in the spot where the real object would be, so the code under test does not notice the difference.

Mocks, stubs, and fakes are different kinds of test doubles. They differ in what the pretend version does.

Say it like this:

"A test double is a pretend object that I use in a test instead of the real one. The code I am testing talks to it the same way, usually through a protocol, so the real object can be swapped out.

A stub gives fixed answers. I tell it what to return, like 'return this user' or 'throw this error', and it just does that. It has no logic. I use it when I only need to control what comes into my code.

A fake is a simple but working version of the real thing. The best example is an in-memory database. It really saves and loads data, but it keeps it in a dictionary instead of on disk. I use it when the code needs realistic behavior, like save something and read it back later, but the real thing is too slow or too heavy.

A mock records how it was used, and my test checks that. For example, 'was the analytics event sent once, with this name?' I use it when the important result is a call that goes out and leaves no visible state, like sending an event, a log, or an email.

So the question I ask is: do I need to control the input, do I need realistic behavior, or do I need to check that a call happened? Input is a stub, behavior is a fake, and a call is a mock.

One more point. In everyday Swift talk, people call all of these 'mocks'. That is fine in a team. In an interview, I mention the difference, because it shows I know what each one is for."

The protocol that all three replace

\`\`\`swift
protocol UserStore {                                       // describes what the code needs from storage
    func save(_ user: User)                                // store a user
    func load(id: Int) -> User?                            // read a user back, or nil if missing
}
\`\`\`

1. Stub: fixed answers

\`\`\`swift
struct StubUserService: UserService {                      // a pretend service that returns fixed results
    var result: Result<User, Error>                        // the test decides success or failure

    func fetchUser() async throws -> User {                // same method as the real service
        try result.get()                                   // return the chosen user, or throw the chosen error
    }
}
\`\`\`

2. Fake: a simple working version

\`\`\`swift
final class FakeUserStore: UserStore {                     // behaves like real storage, but only in memory
    private var users: [Int: User] = [:]                   // a dictionary acts as the pretend database

    func save(_ user: User) {                              // same method as the real store
        users[user.id] = user                              // really keep the user, so it can be read later
    }

    func load(id: Int) -> User? {                          // same method as the real store
        users[id]                                          // return what was saved, or nil if nothing was
    }
}
\`\`\`

3. Mock: records calls so the test can check them

\`\`\`swift
final class MockAnalytics: Analytics {                     // a pretend analytics tool that remembers what it received
    private(set) var events: [String] = []                 // every event name that was sent to it

    func track(_ name: String) {                           // same method as the real analytics
        events.append(name)                                // just remember it, do not send anything anywhere
    }
}
\`\`\`

4. How the test uses each one

\`\`\`swift
func test_checkout_tracksPurchaseOnce() async {
    let analytics = MockAnalytics()                        // the mock that will record calls
    let store = FakeUserStore()                            // the fake that really saves in memory
    store.save(User(id: 1, name: "Johnson"))               // put data in, like a real database would hold

    let viewModel = CheckoutViewModel(
        userService: StubUserService(result: .success(User(id: 1, name: "Johnson"))), // stub: controls the input
        store: store,                                      // fake: realistic storage
        analytics: analytics                               // mock: records the outgoing call
    )
    await viewModel.pay()                                  // run the code under test

    XCTAssertEqual(analytics.events, ["purchase"])         // mock check: the event was sent exactly once
}
\`\`\`

How they compare:
• Stub: returns fixed answers. Use it to control what goes into your code, such as success, an error, or an empty list.
• Fake: a simple working version, like an in-memory database. Use it when the code needs realistic behavior but the real thing is too slow or heavy.
• Mock: records calls and lets the test check them. Use it for results that leave no visible state, like analytics, logging, or sending an email.
• Test double: the general name for all of the above. It is a placeholder for the real object.

Two more names you may hear:
• Dummy: an object that is only passed to fill a parameter and is never really used.
• Spy: like a mock, it records calls. The difference is that the test checks the records afterward, instead of setting expectations first. The MockAnalytics above is technically a spy, and most Swift developers still call it a mock.

When to use them, and when not to:
• Use a double at real boundaries: the network, the database, the Keychain, the clock, analytics, and payments.
• Do not use a double for simple value types or your own pure functions. Use the real ones, because that is simpler and more trustworthy.
• Prefer stubs and fakes over mocks. A test that checks state, like "the name is now Johnson", survives refactoring. A test that checks "this method was called twice" breaks whenever the internal steps change.
• Keep doubles small. A stub with ten lines of logic is becoming a second implementation, and it can have bugs of its own.

Good to mention (Staff-Level Interview Points):
• Doubles work because of dependency injection and protocols. Without those, there is no way to swap the real object out.
• A fake can drift from the real thing. If the real database rejects duplicates and the fake does not, tests pass but production fails. A few integration tests with the real thing catch that.
• Too many mocks make tests fragile, and they can pass while the app is broken, because the test only proves that the code calls the mock the way the test expects.
• Swift has no built-in mocking library, so most teams write small doubles by hand, as above. Some use generated mocks (like Cuckoo or Mockingbird), but hand-written ones are easy to read and need no extra tools.

One-liner: A test double is a placeholder for the real object, and a stub gives fixed answers, a fake is a simple working version, and a mock records calls so the test can check them.

Memory trick: S-F-M → "Stub gives answers, Fake works simply, Mock checks calls."

#### 💻 Swift Code Example

\`\`\`swift
${newQ71.codeExample}
\`\`\`
`;

// Insert q71Md right before "### `Q-72` — CI/CD pipelines"
const insertMarker = '### `Q-72` — CI/CD pipelines';
const markerIdx = md.indexOf(insertMarker);
if (markerIdx === -1) {
    console.error('Could not find insertMarker in QUESTIONS.md');
    process.exit(1);
}

md = md.substring(0, markerIdx) + q71Md + '\n\n---\n\n' + md.substring(markerIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
