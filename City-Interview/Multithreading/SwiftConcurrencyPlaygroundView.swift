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


// MARK: - 🚦 Legacy vs Modern Concurrency in Networking
//
// 💡 INTERVIEW TALKING POINTS:
// • Structured Concurrency (async/await): Now the preferred approach. It avoids "Callback Hell", eliminates the need for `[weak self]` boilerplate inside closures, and makes control flow strictly top-to-bottom.
// • Cancellation Differences:
//   - Completion Handlers: Must keep a reference to `URLSessionDataTask` to call `.cancel()`.
//   - Combine: Cancels automatically when the `AnyCancellable` subscription is deallocated.
//   - Async/Await: Propagates cancellation automatically via Swift's `Task` tree. If the parent `Task` is cancelled, the network call throws a `CancellationError`.

struct ConcurrencyUser: Codable {
    let id: Int
    let name: String
    let email: String
}

class LegacyVsModernNetworkingDemonstrator {
    let url = URL(string: "https://api.example.com/users/1")!
    private var cancellables = Set<AnyCancellable>()
    
    // ==========================================
    // 1. Completion Handlers (The Old Way)
    // ==========================================
    func fetchWithClosures(completion: @escaping (ConcurrencyUser?) -> Void) {
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data else {
                completion(nil)
                return
            }
            let user = try? JSONDecoder().decode(ConcurrencyUser.self, from: data)
            completion(user)
        }.resume()
    }
    
    // ==========================================
    // 2. Combine (The Reactive Way)
    // ==========================================
    func fetchWithCombine() {
        
        URLSession.shared.dataTaskPublisher(for: url)
            .map { $0.data }
            .decode(type: ConcurrencyUser.self, decoder: JSONDecoder())
            .replaceError(with: ConcurrencyUser(id: 0, name: "Error", email: "")) // Simplistic error handling
            .sink { user in
                print("Combine User: \(user.name)")
            }
            .store(in: &cancellables) // Cancellation happens when `cancellables` deallocates!
    }
    
    // ==========================================
    // 3. Async/Await (The Modern Way)
    // ==========================================
    func fetchWithAsyncAwait() async throws -> ConcurrencyUser {
        // Linear, clean, no [weak self], throws naturally.
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(ConcurrencyUser.self, from: data)
    }
}

// ==========================================
// 🎙️ Interview Q&A (Legacy vs Modern)
// ==========================================
// • Q: Why is Async/Await preferred over Completion Handlers?
//   A: It forces linear control flow, preventing deeply nested closures (Callback Hell), guarantees that errors are handled via `throws`, and removes retain cycle risks (`[weak self]`).
// • Q: How does cancellation work in Combine vs Async/Await?
//   A: Combine relies on the lifecycle of `AnyCancellable` (when it deallocates, the task cancels). Async/Await uses "Cooperative Cancellation" where canceling a `Task` propagates down the call stack.
// • Q: In the completion handler example, what happens if we forget to call `completion(nil)` on an error?
//   A: The caller hangs forever waiting for a response, leading to frozen loading spinners in the UI. Async/Await solves this because you are forced to return or `throw`.


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

// ==========================================
// 🚀 Async/Await + Concurrency in Networking — Quick Notes
// ==========================================
//
// Basic async/await call
// let (data, response) = try await URLSession.shared.data(from: url)
// 💡 No more nested closures ("callback hell") — reads top to bottom like normal code.
// 💡 try because it can throw, await because it pauses until the network call finishes, without blocking the thread.
//
// async let — run multiple requests in parallel
// async let user = fetchUser()
// async let posts = fetchPosts()
// let (userResult, postsResult) = try await (user, posts)
// 💡 Both requests start at the same time, not one after another.
// 💡 You only wait once, at the end, for both to finish.
// 💡 Good when requests don't depend on each other.
//
// TaskGroup — parallel requests when the number isn't fixed
// try await withThrowingTaskGroup(of: Post.self) { group in
//     for id in postIds {
//         group.addTask { try await fetchPost(id: id) }
//     }
//     for try await post in group {
//         // collect results as they complete
//     }
// }
// 💡 Use this when you have a list of things to fetch (unknown count), unlike async let which is fixed to a specific number of calls.
//
// Cancellation
// 💡 If you cancel a Task, and that task is doing a network call, the URLSession call is cancelled too — you'll get a CancellationError or URLError(.cancelled).
// 💡 Important for things like search-as-you-type — cancel the previous request before starting a new one, so you don't waste bandwidth or show stale results.
// task?.cancel()  // cancels the in-flight network request tied to this Task
// task = Task {
//     let results = try await search(query: text)
// }
//
// ==========================================
// 🎙️ Interview Summary Rule & One-liner
// ==========================================
// Simple rule to remember:
// "Use async let for a fixed, known number of parallel calls. Use TaskGroup when the number of calls is dynamic. Cancelling a Task cancels its underlying network call too — useful for things like live search."
//
// One-liner for interview:
// "I use async/await for cleaner networking code, async let when I need a couple of independent calls in parallel, and TaskGroup for a dynamic batch of requests — and I make sure to cancel superseded tasks, like in search, to avoid wasted calls and stale results."
