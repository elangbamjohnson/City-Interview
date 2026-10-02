import Foundation
import Combine

// MARK: - VIEWMODEL
/// The ViewModel:
/// 1. Fetches raw data (Model)
/// 2. Transforms it for display (business logic lives here)
/// 3. Exposes @Published properties that the View observes
///
/// INTERVIEW KEY POINT:
/// • The ViewModel has NO idea SwiftUI exists. It doesn't import SwiftUI.
/// • It only uses Foundation + Combine. This makes it fully unit-testable.
/// • Data flows DOWN (ViewModel → View).
/// • Actions flow UP (View → ViewModel).
@MainActor
class TodoViewModel: ObservableObject {
    
    // The View binds to these. When they change, SwiftUI re-renders automatically.
    @Published private(set) var todos: [Todo] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    
    /// Action: View calls this → ViewModel fetches & transforms → View auto-updates
    func fetchTodos() {
        Task {
            isLoading = true
            errorMessage = nil
            
            do {
                let url = URL(string: "https://jsonplaceholder.typicode.com/todos?_limit=10")!
                let (data, _) = try await URLSession.shared.data(from: url)
                todos = try JSONDecoder().decode([Todo].self, from: data)
            } catch {
                errorMessage = error.localizedDescription
            }
            
            isLoading = false
        }
    }
    
    /// Action: View calls this to toggle a todo's completed state
    /// This is business logic — the View doesn't decide HOW to toggle, it just says "toggle this id"
    func toggleTodo(_ id: Int) {
        if let index = todos.firstIndex(where: { $0.id == id }) {
            let old = todos[index]
            todos[index] = Todo(id: old.id, title: old.title, completed: !old.completed)
        }
    }
}
