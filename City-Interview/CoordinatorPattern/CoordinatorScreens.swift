import SwiftUI

// MARK: - CHILD VIEWS — Screens managed by the Coordinator
//
// INTERVIEW KEY POINT:
// Notice that NONE of these views import or reference each other.
// They only know about the Coordinator.
// HomeView doesn't know UserListView exists.
// UserListView doesn't know UserDetailView exists.
// The Coordinator is the ONLY object that knows the full navigation map.


// MARK: - Home Screen
/// The root screen. Provides buttons that tell the Coordinator WHERE to go.
/// It does NOT create or push other views — it just says "navigate to X".
struct HomeScreen: View {
    let coordinator: AppCoordinator  // Receives coordinator, doesn't create it
    
    var body: some View {
        VStack(spacing: 20) {
            Text("🏠 Home")
                .font(.system(size: 28, weight: .bold))
            
            Text("I don't know what other screens look like.\nI just tell the Coordinator where to go.")
                .font(.system(size: 15))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            // Action flows UP to Coordinator — View doesn't decide HOW to navigate
            Button("Go to User List") {
                coordinator.navigate(to: .userList)
            }
            .buttonStyle(.borderedProminent)
            
            Button("Go to Settings") {
                coordinator.navigate(to: .settings)
            }
            .buttonStyle(.bordered)
        }
        .padding()
    }
}


// MARK: - User List Screen
/// Fetches and displays users. On tap, asks Coordinator to show detail.
struct UserListScreen: View {
    let coordinator: AppCoordinator
    
    // Simple hardcoded data for demo — in real app, this comes from a ViewModel
    let users = [
        ("Leanne Graham", "leanne@example.com"),
        ("Ervin Howell", "ervin@example.com"),
        ("Clementine Bauch", "clem@example.com"),
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ForEach(users, id: \.0) { name, email in
                    Button {
                        // Tell Coordinator: "show detail for this user"
                        // This view has NO idea what the detail screen looks like
                        coordinator.navigate(to: .userDetail(name: name, email: email))
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(name).font(.system(size: 17, weight: .semibold))
                                Text(email).font(.system(size: 15)).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(.tertiary)
                        }
                        .padding()
                        .background(Color(UIColor.secondarySystemGroupedBackground))
                        .cornerRadius(10)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
        .navigationTitle("Users")
    }
}


// MARK: - User Detail Screen
/// Displays a single user's info. Can go back or jump to root.
struct UserDetailScreen: View {
    let coordinator: AppCoordinator
    let name: String
    let email: String
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.circle.fill")
                .font(.system(size: 80))
                .foregroundStyle(.blue)
            
            Text(name).font(.system(size: 24, weight: .bold))
            Text(email).font(.system(size: 17)).foregroundStyle(.secondary)
            
            Divider()
            
            // Coordinator controls navigation — not the view
            Button("← Go Back") {
                coordinator.goBack()
            }
            .buttonStyle(.bordered)
            
            Button("🏠 Go to Root") {
                coordinator.goToRoot()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .navigationTitle("Detail")
    }
}


// MARK: - Settings Screen
struct SettingsScreen: View {
    let coordinator: AppCoordinator
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "gearshape.fill")
                .font(.system(size: 60))
                .foregroundStyle(.gray)
            
            Text("Settings").font(.system(size: 24, weight: .bold))
            Text("This screen also doesn't know\nabout any other screen.")
                .font(.system(size: 15))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            
            Button("← Back") { coordinator.goBack() }
                .buttonStyle(.bordered)
        }
        .padding()
        .navigationTitle("Settings")
    }
}
