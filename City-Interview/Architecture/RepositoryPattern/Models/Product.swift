import Foundation

// MARK: - MODEL
//
// 💡 INTERVIEW TALKING POINTS (MODEL):
// • What is it? A pure data container representing business entities (e.g., Domain or Data models).
// • Key Property: It has NO dependency on UI (SwiftUI), ViewModels, or Data Sources (Networking/CoreData).
// • Why? Keeps models lightweight, serializable (Codable), and easy to pass around across layers.

struct Product: Identifiable {
    let id: Int
    let name: String
    let price: Double
}

