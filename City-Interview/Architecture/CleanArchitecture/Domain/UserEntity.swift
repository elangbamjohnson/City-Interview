import Foundation

// MARK: - DOMAIN LAYER — Entity
//
// The Entity is the core business object.
// It belongs to the Domain layer (innermost circle).
//
// RULES:
// • Pure data — no frameworks, no UIKit, no SwiftUI.
// • This struct does NOT know how data is fetched (Data layer)
//   or how data is displayed (Presentation layer).
// • If the API response shape changes, this struct does NOT change.
//   The Data layer handles mapping.

struct UserEntity: Identifiable {
    let id: Int
    let name: String
    let email: String
}
