import SwiftUI

// MARK: - VIEW
/// The View:
/// 1. Observes the ViewModel via @StateObject
/// 2. Renders whatever @Published properties say
/// 3. Forwards user actions to ViewModel methods (never handles logic itself)
///
/// INTERVIEW KEY POINT:
/// • The View is "dumb" — it has ZERO business logic.
/// • It only knows how to display data and call ViewModel methods.
/// • View knows about ViewModel, but never touches Model directly.
struct MVVMPlaygroundView: View {
    @StateObject private var vm = TodoViewModel()  // View OWNS the ViewModel
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                
                // Action: user taps → View forwards to ViewModel
                Button("Fetch Todos") { vm.fetchTodos() }
                    .font(.system(size: 18, weight: .semibold))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color(UIColor.secondarySystemGroupedBackground))
                    .cornerRadius(10)
                
                // State: loading
                if vm.isLoading {
                    ProgressView("Loading...")
                        .frame(maxWidth: .infinity)
                }
                
                // State: error
                if let error = vm.errorMessage {
                    Text("❌ \(error)")
                        .foregroundColor(.red)
                        .padding()
                }
                
                // State: data → View just renders, no logic
                ForEach(vm.todos) { todo in
                    HStack {
                        Image(systemName: todo.completed ? "checkmark.circle.fill" : "circle")
                            .foregroundColor(todo.completed ? .green : .gray)
                            .font(.system(size: 22))
                        
                        Text(todo.title)
                            .font(.system(size: 17))
                            .strikethrough(todo.completed)
                            .foregroundStyle(todo.completed ? .secondary : .primary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(UIColor.secondarySystemGroupedBackground))
                    .cornerRadius(10)
                    .onTapGesture {
                        // Action flows UP: View → ViewModel
                        vm.toggleTodo(todo.id)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("MVVM Pattern")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView { MVVMPlaygroundView() }
}
