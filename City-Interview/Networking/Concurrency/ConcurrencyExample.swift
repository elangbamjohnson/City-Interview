import Foundation
import Combine

// MARK: - 🚦 Concurrency in Networking
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

class ConcurrencyDemonstrator {
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
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why is Async/Await preferred over Completion Handlers?
//   A: It forces linear control flow, preventing deeply nested closures (Callback Hell), guarantees that errors are handled via `throws`, and removes retain cycle risks (`[weak self]`).
// • Q: How does cancellation work in Combine vs Async/Await?
//   A: Combine relies on the lifecycle of `AnyCancellable` (when it deallocates, the task cancels). Async/Await uses "Cooperative Cancellation" where canceling a `Task` propagates down the call stack.
// • Q: In the completion handler example, what happens if we forget to call `completion(nil)` on an error?
//   A: The caller hangs forever waiting for a response, leading to frozen loading spinners in the UI. Async/Await solves this because you are forced to return or `throw`.
