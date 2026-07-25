import Foundation

// MARK: - DOMAIN LAYER — Repository Protocol
//
// This protocol defines WHAT data operations exist,
// but NOT HOW they are implemented.
//
// INTERVIEW KEY POINT — Dependency Inversion Principle (DIP):
// • The Domain layer defines the interface (this protocol).
// • The Data layer provides the concrete implementation.
// • Dependencies point INWARD → Data depends on Domain, never the reverse.
//
// WHY?
// • Domain layer stays pure and testable.
// • You can swap the real API with a mock/fake for unit tests
//   by simply providing a different conformance to this protocol.

protocol UserRepository {
    func fetchUsers() async throws -> [UserEntity]
}
