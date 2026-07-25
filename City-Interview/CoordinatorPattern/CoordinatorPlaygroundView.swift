import SwiftUI

// MARK: - COORDINATOR ROOT VIEW
//
// This is where everything comes together.
// The Coordinator is created HERE and passed DOWN to child views.
//
// INTERVIEW KEY POINT:
// The NavigationStack's `navigationDestination` is the Coordinator's
// "routing table". It maps Screen enum cases → actual SwiftUI Views.
// This is the ONLY place in the entire app that knows which View
// corresponds to which Screen.

struct CoordinatorPlaygroundView: View {
    @StateObject private var coordinator = AppCoordinator()
    
    var body: some View {
        NavigationStack(path: $coordinator.path) {
            
            // Root screen
            HomeScreen(coordinator: coordinator)
                .navigationTitle("Coordinator Pattern")
            
            // MARK: - Routing Table
            // The Coordinator's "brain": maps Screen enum → View
                .navigationDestination(for: Screen.self) { screen in
                    switch screen {
                    case .home:
                        HomeScreen(coordinator: coordinator)
                    case .userList:
                        UserListScreen(coordinator: coordinator)
                    case .userDetail(let name, let email):
                        UserDetailScreen(coordinator: coordinator, name: name, email: email)
                    case .settings:
                        SettingsScreen(coordinator: coordinator)
                    }
                }
        }
    }
}

#Preview {
    CoordinatorPlaygroundView()
}
