import Foundation

// MARK: - DOMAIN LAYER — Use Case
//
// A Use Case encapsulates a SINGLE business action.
// It orchestrates the flow: "fetch users from the repository".
//
// INTERVIEW KEY POINT:
// • Use Cases make business logic explicit and reusable.
// • The ViewModel calls the Use Case, NOT the repository directly.
// • This adds a clear boundary: if the business rule changes
//   (e.g., "only return active users"), you change the Use Case,
//   not the ViewModel or the Repository.
//
// DEPENDENCY DIRECTION:
//   Presentation → Use Case → Repository (protocol) ← Data (implementation)
//                  ^^^^^^^^
//                  You are here

class FetchUsersUseCase {
    private let repository: UserRepository  // Depends on the PROTOCOL, not the concrete class
    
    init(repository: UserRepository) {
        self.repository = repository
    }
    
    /// Execute the use case — this IS the business logic.
    /// If you needed to filter, sort, or combine data from multiple repos,
    /// that logic would live here.
    func execute() async throws -> [UserEntity] {
        return try await repository.fetchUsers()
    }
}
