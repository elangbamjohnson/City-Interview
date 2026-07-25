import Foundation

// MARK: - DATA LAYER — Repository Implementation
//
// This is the CONCRETE implementation of the Domain's UserRepository protocol.
// It knows HOW to fetch data (network, database, cache, etc).
//
// INTERVIEW KEY POINTS:
// • The Data layer depends on the Domain layer (implements its protocol).
// • The Domain layer does NOT depend on this file.
// • The DTO (Data Transfer Object) maps the raw API shape → Domain Entity.
//   This protects the Domain from API changes.
//
// DEPENDENCY DIRECTION:
//   This file IMPLEMENTS → Domain/UserRepository protocol
//   This file MAPS      → API JSON (UserDTO) → Domain (UserEntity)


// MARK: - DTO (Data Transfer Object)
/// Matches the raw JSON shape from the API.
/// If the API adds/removes fields, only this struct changes — not the Entity.
private struct UserDTO: Decodable {
    let id: Int
    let name: String
    let email: String
    
    /// Map DTO → Domain Entity
    func toDomain() -> UserEntity {
        UserEntity(id: id, name: name, email: email)
    }
}


// MARK: - Repository Implementation
final class UserRepositoryImpl: UserRepository {
    
    /// Fetches users from the network and maps DTOs → Domain Entities
    func fetchUsers() async throws -> [UserEntity] {
        let url = URL(string: "https://jsonplaceholder.typicode.com/users")!
        let (data, _) = try await URLSession.shared.data(from: url)
        let dtos = try JSONDecoder().decode([UserDTO].self, from: data)
        
        // Map: Data layer shape → Domain layer shape
        return dtos.map { $0.toDomain() }
    }
}
