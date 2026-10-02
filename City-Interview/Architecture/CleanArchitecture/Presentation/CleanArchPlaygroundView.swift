import SwiftUI
import Combine

// MARK: - PRESENTATION LAYER — ViewModel + View
//
// The outermost layer. Depends on the Domain layer (Use Case + Entity).
// Does NOT import or know about the Data layer.
//
// FULL DEPENDENCY CHAIN:
//
//   ┌──────────────────────────────────────────────────────┐
//   │                   PRESENTATION                       │
//   │  View ──► ViewModel ──► UseCase                      │
//   │                            │                         │
//   │  ┌─────────────────────────┼─────────────────────┐   │
//   │  │         DOMAIN          ▼                     │   │
//   │  │              UserRepository (protocol)        │   │
//   │  │                         ▲                     │   │
//   │  └─────────────────────────┼─────────────────────┘   │
//   │  ┌─────────────────────────┼─────────────────────┐   │
//   │  │         DATA            │                     │   │
//   │  │         UserRepositoryImpl (concrete)         │   │
//   │  │         UserDTO → UserEntity mapping          │   │
//   │  └───────────────────────────────────────────────┘   │
//   └──────────────────────────────────────────────────────┘
//
//  Dependencies always point INWARD (toward Domain).


// MARK: - ViewModel
@MainActor
final class CleanArchViewModel: ObservableObject {
    private let fetchUsersUseCase: FetchUsersUseCase
    
    @Published private(set) var users: [UserEntity] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    
    /// Dependency Injection: the ViewModel receives the Use Case, not the Repository.
    /// This means the ViewModel has NO idea where data comes from (API? Cache? Mock?).
    init(fetchUsersUseCase: FetchUsersUseCase) {
        self.fetchUsersUseCase = fetchUsersUseCase
    }
    
    func loadUsers() {
        Task {
            isLoading = true
            errorMessage = nil
            do {
                users = try await fetchUsersUseCase.execute()
                print("Clean Arch: fetched \(users.count) users")
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}


// MARK: - View
struct CleanArchPlaygroundView: View {
    // Wire up the dependency chain:
    // Repository (Data) → Use Case (Domain) → ViewModel (Presentation)
    @StateObject private var vm = CleanArchViewModel(
        fetchUsersUseCase: FetchUsersUseCase(
            repository: UserRepositoryImpl()
        )
    )
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                
                Button("Fetch Users (Clean Arch)") { vm.loadUsers() }
                    .font(.system(size: 18, weight: .semibold))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color(UIColor.secondarySystemGroupedBackground))
                    .cornerRadius(10)
                
                if vm.isLoading {
                    ProgressView("Loading...")
                        .frame(maxWidth: .infinity)
                }
                
                if let error = vm.errorMessage {
                    Text("❌ \(error)")
                        .foregroundColor(.red)
                        .padding()
                }
                
                ForEach(vm.users) { user in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(user.name)
                            .font(.system(size: 17, weight: .semibold))
                        Text(user.email)
                            .font(.system(size: 15))
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(UIColor.secondarySystemGroupedBackground))
                    .cornerRadius(10)
                }
            }
            .padding()
        }
        .navigationTitle("Clean Architecture")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView { CleanArchPlaygroundView() }
}
