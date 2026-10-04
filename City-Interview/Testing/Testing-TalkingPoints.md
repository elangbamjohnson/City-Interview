# Testing, TDD/BDD, and Testability — Interview Talking Points

A rehearsal sheet for questions about XCTest, unit/UI testing, TDD/BDD, and mocking/stubbing/testable architecture. This topic often comes up both as a coding exercise (write a test, fix a test) and as a discussion about process. Practice saying this out loud.

## 1. Open with the framing (10 seconds)
> "I think of testability as a design decision, not something bolted on after the fact. If a class can't have its dependencies swapped for fakes, it usually can't be unit tested in isolation — so I lean on protocol-based dependency injection from the start, and write tests alongside (or ahead of) the implementation."

## 2. XCTest basics — structure to reference
- **Arrange-Act-Assert:** set up state, perform the action, assert the outcome — keep each test focused on one behavior.
- **`setUp()` runs before every test method**, not once for the class — this guarantees no shared mutable state leaks between tests.
- **Naming convention worth stating out loud:** `test_methodName_condition_expectedResult` — makes failures self-explanatory in CI logs without opening the file.
- **Common assertions to mention:** `XCTAssertEqual`, `XCTAssertTrue/False`, `XCTAssertNil/NotNil`, `XCTAssertThrowsError`.

## 3. The 5 Testing Tiers — Unit vs Integration vs UI vs Snapshot vs Performance
> "I structure testing as a pyramid: lots of fast unit tests at the bottom, integration tests validating real layers with stubbed network protocols in the middle, and a minimal set of UI tests covering critical user journeys at the top. Snapshot and performance tests guard visuals and speed where they matter most."

- **Unit Tests:** Fast, isolated verification of business rules, ViewModel state, and edge cases with injected mocks.
- **Integration Tests:** Verifies real layers work together (e.g. real `UserRepository` + real `JSONDecoder` with `StubURLProtocol` intercepting network traffic).
- **UI Tests (XCUITest):** Runs as a separate process driving the app through the accessibility layer — slow and prone to flakiness, so reserve for critical journeys (login, checkout). Match on `accessibilityIdentifier` (never localized text) and use `waitForExistence(timeout:)` instead of `Thread.sleep`.
- **Snapshot Tests:** Compares rendered views (using Point-Free's `SnapshotTesting`) against saved reference images. Protects against accidental visual regressions across Light/Dark mode and Dynamic Type.
- **Performance Tests:** Measures hot paths (JSON decoding, image filtering) and app launch time via `measure(metrics: [XCTClockMetric(), XCTMemoryMetric(), XCTApplicationLaunchMetric()])` against saved baselines.

## 4. TDD — red, green, refactor
> "Red-green-refactor: write a failing test first, write the minimal code to make it pass, then refactor with the safety net of a passing test. The real value isn't the ritual — it's that writing the test first forces you to think about the API/interface before the implementation."

Be honest if asked whether you strictly practice TDD:
> "In practice a lot of teams do 'test-alongside' rather than strict TDD — I think what interviewers actually want to hear is that you understand the discipline and can apply it when it adds value (e.g. tricky business logic), not that you dogmatically write every line test-first."

## 5. BDD — how it differs from TDD
- **BDD frames tests as Given/When/Then behavior specs**, often readable by non-engineers (PMs, QA) — less about implementation detail, more about describing expected behavior in plain language.
- **Common tooling to mention:** **Quick/Nimble** in the Swift ecosystem pairs with this style (`describe`, `context`, `it` blocks).
- **One-line distinction to have ready:** **TDD is a workflow** (write test → code → refactor); **BDD is a specification style** (describe behavior in a structured, readable format) — they're not mutually exclusive.

## 6. Mock vs Stub vs Fake vs Spy — precise definitions
Interviewers often probe this exact distinction — have it crisp:

| Term | Definition |
|---|---|
| **Stub** | Returns canned data, no verification of how it was called. |
| **Mock** | Verifies interactions — e.g. asserts `login()` was called exactly once with specific arguments. |
| **Fake** | A working but simplified implementation (e.g. an in-memory database instead of a real one). |
| **Spy** | Wraps a real object and records calls made to it, while still delegating to real behavior. |

> "In Swift, protocol-based dependency injection is what makes any of this possible — there's no reflection-based mocking framework like you'd see in other languages, so you write a protocol, a real implementation, and a hand-written fake/mock conforming to the same protocol."

*Worth a one-line mention:* libraries like **Cuckoo** or **Mockingbird** can auto-generate mocks at scale, but hand-written mocks are common and perfectly fine for smaller codebases.

## 7. Testable architecture — the connecting thread
> "The pattern that makes everything above possible is constructor injection of protocols instead of concrete types — a ViewModel shouldn't instantiate `URLSession.shared` directly; it should take a `NetworkServiceProtocol` so a test can substitute a mock. This is the same dependency injection principle that shows up in modular architecture — testability and modularity come from the same root discipline: depend on abstractions, not concretions."

## 8. A strong closing line if asked to summarize your approach
> "I write unit tests close to the code they cover, reserve UI tests for critical flows, structure dependencies behind protocols so they're mockable, and use TDD selectively where it adds the most value — like business logic with several edge cases — rather than treating it as a rule to follow everywhere."

---

## Quick self-check before the interview
- [ ] Can I explain why `setUp()` runs before every test, not once?
- [ ] Can I explain why UI tests should match on accessibility identifiers, not text?
- [ ] Can I walk through red-green-refactor with a concrete example?
- [ ] Can I distinguish mock vs stub vs fake vs spy without hesitating?
- [ ] Can I explain why protocol-based DI is what makes mocking possible in Swift?
- [ ] Can I give an honest answer about strict TDD vs test-alongside in practice?
