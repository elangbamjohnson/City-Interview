# Repository Pattern — Interview Talking Points

A quick reference for separating data access logic from ViewModels using the Repository Pattern.

## 1. Core Concepts
- **Abstraction Layer:** The repository acts as a middleman between the data source (API, CoreData, Cache) and the rest of the application (ViewModel).
- **Loose Coupling:** The ViewModel has no idea *where* the data comes from, making it totally decoupled from specific frameworks like `URLSession` or `Realm`.
- **Dependency Inversion (SOLID):** High-level modules (ViewModels) depend on abstractions (Protocols) rather than concrete implementations (API classes).
- **Testability via Mocking:** Because the ViewModel relies on a Protocol, you can easily inject a `MockProductRepository` during XCTest to return fake data instantly without hitting a real network.
- **Single Source of Truth:** It centralizes complex data logic (like checking the local cache before falling back to the network API).

## 2. Common Interview Questions
- **Q: How would you switch your app from URLSession to Firebase?**
  - A: I would create a new Firebase class conforming to the Repository Protocol and inject it into the ViewModel. The ViewModel remains 100% untouched.
- **Q: Why mock the repository in Unit Tests?**
  - A: Real network calls are slow, flaky, and require internet. Mocks make tests fast and deterministic.
- **Q: How do you handle errors in a mocked repository test?**
  - A: I configure the mock to deliberately throw an error (e.g. `mock.shouldThrowError = true`) and assert that the ViewModel handles the error state correctly.
- **Q: Should a Repository return Domain Models or Data Transfer Objects (DTOs)?**
  - A: A Repository should return clean Domain Models to the ViewModel, handling the mapping from raw API DTOs internally.

## 3. Quick Self-Check
- [ ] Can I explain how the Repository Pattern satisfies the Dependency Inversion Principle?
- [ ] Can I write a Mock Repository that returns static array data?
- [ ] Can I articulate why a ViewModel should never import `URLSession`?
- [ ] Can I explain the concept of a "Single Source of Truth" in data fetching?
