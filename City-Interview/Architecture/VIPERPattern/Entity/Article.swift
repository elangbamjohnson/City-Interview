import Foundation

// MARK: - ENTITY (VIPER)
//
// 💡 INTERVIEW TALKING POINTS (ENTITY):
// • What is it? Plain data structures/models used by the Interactor.
// • Key Property: Dummy/Passive data objects (structs or classes) with NO business logic, UI code, or networking code.
// • Scope: Manipulated strictly by the Interactor and passed to Presenter for transformation.

struct Article: Identifiable {
    let id: Int
    let title: String
    let content: String
}
