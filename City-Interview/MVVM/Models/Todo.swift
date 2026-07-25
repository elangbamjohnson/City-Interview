import Foundation

// MARK: - MODEL
/// The Model is a plain data container. No UI logic, no formatting.
/// It represents the raw shape of data from an API/database.
///
/// INTERVIEW KEY POINT:
/// • Model knows NOTHING about ViewModel or View.
struct Todo: Codable, Identifiable {
    let id: Int
    let title: String
    let completed: Bool
}
