import SwiftUI
import Combine

// MARK: - Swift Concurrency Interview Prep Guide
// This playground demonstrates modern structured concurrency in iOS:
// 1. Basic async/await (Structured, cooperative task execution).
// 2. Actors (Data isolation & protection against data races).
// 3. Protocol-oriented async service (Architecture testing & mocking).

// MARK: - Model
struct User: Decodable, Identifiable {
    let id: Int
    let name: String
}

// MARK: - Service Protocol
/// INTERVIEW TOPIC: Protocol-oriented Concurrency
/// Using async throws inside protocols allows downstream components to be decoupled
/// from the concrete network execution context.
protocol UserServiceProtocol {
    func fetchUsers() async throws -> [User]
}

// MARK: - Service Implementation
final class UserService: UserServiceProtocol {
    /// INTERVIEW TOPIC: async throws vs completion handlers
    /// - Completion handlers have issues: optional parameters, nested callback hell, hard-to-propagate errors, no compiler checking for calling completion block.
    /// - Async functions natively return values or throw errors directly, yielding execution control back to the system thread.
    func fetchUsers() async throws -> [User] {
        let url = URL(string: "https://jsonplaceholder.typicode.com/users")!
        
        // try await suspends this current execution unit without blocking the thread.
        // The thread is released back to the system thread pool to do other work until the request finishes.
        let (data, response) = try await URLSession.shared.data(from: url)
        
        let httpResponse = response as! HTTPURLResponse
        guard 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode([User].self, from: data)
    }
}

// MARK: - ViewModel
/// INTERVIEW TOPIC: @MainActor
/// - `@MainActor` is a global actor that coordinates execution on the main dispatch queue.
/// - Annotating a class with `@MainActor` guarantees that all functions, properties, and initialization 
///   run on the main thread automatically, eliminating manual `DispatchQueue.main.async` hops.
@MainActor
final class UsersViewModel: ObservableObject {
    private let service: UserServiceProtocol
    
    // Properties driving the UI must only be modified from the Main Actor context
    @Published private(set) var users: [User] = []
    @Published private(set) var errorMessage: String?
    @Published private(set) var isLoading = false
    
    init(service: UserServiceProtocol = UserService()) {
        self.service = service
    }
    
    /// INTERVIEW TOPIC: Task { ... }
    /// - Used to bridge the synchronous world (e.g. button tap) to the asynchronous world (async/await).
    /// - Creates a new unstructured task running on behalf of the actor.
    func loadUsers() {
        Task {
            isLoading = true
            do {
                // Suspends execution of this task until the service returns.
                // Thread stays unblocked for rendering UI/animations.
                let fetchedUsers = try await service.fetchUsers()
                self.users = fetchedUsers
                print("Fetched users (\(fetchedUsers.count)): \(fetchedUsers)")
            } catch {
                self.errorMessage = error.localizedDescription
                print("Failed to fetch users: \(error)")
            }
            isLoading = false
        }
    }
}

// MARK: - Actor Example (Thread‑safe aggregation)
actor UserCollector {
    private var users: [User] = []
    func add(_ user: User) { users.append(user) }
    func all() -> [User] { users }
}

extension UsersViewModel {
    /// Demonstrates actor usage to collect users safely on a background task.
    func loadUsersWithActor() {
        Task {
            isLoading = true
            let collector = UserCollector()
            do {
                let fetched = try await service.fetchUsers()
                for user in fetched {
                    await collector.add(user)
                }
                self.users = await collector.all()
                print("Fetched \(self.users.count) users via actor")
            } catch {
                self.errorMessage = error.localizedDescription
                print("Actor fetch failed: \(error)")
            }
            isLoading = false
        }
    }
}


// MARK: - View
struct SwiftConcurrencyPlaygroundView: View {
    @StateObject private var vm = UsersViewModel()
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                
                Button("Fetch Users") { vm.loadUsers() }
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
                    HStack {
                        Text("\(user.id)")
                            .font(.system(size: 15, design: .monospaced))
                            .foregroundStyle(.secondary)
                        Text(user.name)
                            .font(.system(size: 17, weight: .semibold))
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(UIColor.secondarySystemGroupedBackground))
                    .cornerRadius(10)
                }
            }
            .padding()
        }
        .navigationTitle("Swift Concurrency")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView { SwiftConcurrencyPlaygroundView() }
}
