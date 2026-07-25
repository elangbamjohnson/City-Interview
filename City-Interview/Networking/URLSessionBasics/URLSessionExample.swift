import Foundation

// MARK: - 🌐 URLSession Basics
//
// 💡 INTERVIEW TALKING POINTS:
// • Configurations:
//   - .default: Uses persistent disk-based caching and credential storage.
//   - .ephemeral: No persistent storage (like "Incognito Mode" for networking).
//   - .background: Allows transfers to continue even if the app is suspended/terminated.
// • Task Lifecycle: Tasks are created in a suspended state. You MUST call `.resume()` to start them.
//   You can also call `.suspend()` to pause, or `.cancel()` to abort.
// • APIs: Apple provides Delegate-based (for fine-grained control like SSL Pinning),
//   Completion-Handler-based (closures), and modern Async/Await APIs.

// ==========================================
// Example Entity
// ==========================================
struct SessionUser: Codable {
    let id: Int
    let name: String
    let email: String
}

class URLSessionDemonstrator {
    let url = URL(string: "https://api.example.com/users/1")!
    
    // ==========================================
    // 1. Traditional Completion Handler
    // ==========================================
    func fetchUserLegacy(completion: @escaping (Result<SessionUser, Error>) -> Void) {
        // Creates the task (starts Suspended)
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else { return } // Should handle custom error here
            
            do {
                let user = try JSONDecoder().decode(SessionUser.self, from: data)
                completion(.success(user))
            } catch {
                completion(.failure(error))
            }
        }
        
        // ⚠️ MUST call resume() to start the network request!
        task.resume()
    }
    
    // ==========================================
    // 2. Modern Async/Await (iOS 15+)
    // ==========================================
    func fetchUserModern() async throws -> SessionUser {
        // No .resume() needed. Execution suspends here without blocking the thread!
        let (data, response) = try await URLSession.shared.data(from: url)
        
        // Basic validation
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(SessionUser.self, from: data)
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why do you have to call `.resume()` on a dataTask?
//   A: Because tasks are initialized in a suspended state, allowing you to configure them before execution begins.
// • Q: How does a Background Configuration differ from Default?
//   A: Background configurations hand off the download/upload to an out-of-process system daemon, so it continues even if the app crashes or is killed by the OS.
// • Q: Which thread do URLSession completion handlers execute on by default?
//   A: A background thread (specifically the session's delegate queue). You must explicitly dispatch to the Main thread before updating the UI!
