# Networking Architecture Decision Table

| Approach | Best For... | Pros / Cons |
|---|---|---|
| **Raw URLSession (Closures)** | Very simple apps, quick prototypes. | **Pros:** Zero dependencies, built-in.<br>**Cons:** Callback hell, hard to chain requests, easy to forget `[weak self]`. |
| **Raw URLSession (async/await)** | Modern iOS apps (iOS 13+). | **Pros:** Reads top-to-bottom, no callback hell, native try/catch.<br>**Cons:** Less native infrastructure for global retry/auth logic. |
| **Custom Network Stack (Client + Endpoint)** | Enterprise apps needing high testability and modularity. | **Pros:** Easy to inject Mock clients, completely decoupled from UI, highly scalable.<br>**Cons:** Takes time to build the boilerplate `NetworkClientProtocol` and Enums. |
| **Interceptors (Middleware)** | Apps with complex global logic (Token refresh, Logging, Analytics). | **Pros:** Keeps network calls completely clean. Global logic is centralized.<br>**Cons:** Can make debugging harder if interceptors mutate requests invisibly. |
| **URLProtocol Subclassing** | Legacy apps, or mocking requests deeply at the OS level. | **Pros:** Intercepts ALL requests globally, great for deep caching or offline modes.<br>**Cons:** Heavy, older C-style API, hard to maintain. |
| **Third Party (Alamofire)** | Teams that need multipart form uploads, advanced cert pinning, or retry logic instantly. | **Pros:** Battle-tested, heavily featured.<br>**Cons:** Adds a massive external dependency for things URLSession now does natively. |

---

## 🎙️ Interview Question: "How do you design the networking layer? (Retries, auth refresh, caching, cancellation.)"

### 💡 The Big Picture (Explained Simply)
Think of a production networking layer like a **restaurant**:
1. **The Menu ([`Endpoint`](file:///Users/johnsonelangbam/Projects/City-Interview/City-Interview/Networking/CustomNetworkStack/NetworkStackExample.swift#L15-L19))**: Type-safe definitions of what you can order (URL path, HTTP method, headers, query params).
2. **The Waiter ([`NetworkInterceptor`](file:///Users/johnsonelangbam/Projects/City-Interview/City-Interview/Networking/Interceptors/InterceptorExample.swift#L17-L20))**: Middleware that injects auth tokens before sending the request and checks status codes (like 401) when responses return.
3. **The Kitchen Engine ([`NetworkClientProtocol`](file:///Users/johnsonelangbam/Projects/City-Interview/City-Interview/Networking/CustomNetworkStack/NetworkStackExample.swift#L36-L38))**: Uses `URLSession` with modern `async/await` and generic `JSONDecoder` to execute calls and return parsed models.
4. **The Pantry (Repository / Cache)**: Decides whether to return cached local data or fetch fresh data from the network.

> **🗣️ 30-Second Interview Pitch:**  
> *"I structure the network layer with a **protocol-oriented, layered design**: an `Endpoint` protocol for type-safety, an injected `NetworkClient` for testability, and an `Interceptor` pipeline for headers and auth. For the 4 core concerns: I retry **transient errors with exponential backoff** on idempotent calls; I handle **token refresh via a Swift actor** to prevent concurrent 401 race conditions; I combine **`URLCache` with a local database** as the Single Source of Truth; and I rely on **Swift Concurrency's cooperative cancellation** to kill tasks when views disappear."*

---

### The 4 Core Pillars (Quick Revision Guide)

#### 1. 🔁 Retries (Resilience)
* **Simple Explanation**: If the user goes through a quick tunnel or elevator, give the request another chance instead of immediately showing a red error banner.
* **Key Interview Rules**:
  - **Only retry transient errors**: Network timeouts, connection lost, or server `503 Service Unavailable`. Never retry `400 Bad Request` or `404 Not Found`.
  - **Respect Idempotency**: Safe to retry `GET`, `PUT`, `DELETE` (repeating them doesn't change state). **Never blindly retry `POST`** (retrying `/checkout` could charge a user twice!).
  - **Exponential Backoff + Jitter**: Wait 1s, then 2s, then 4s + a random delay so thousands of devices don't hammer a recovering server at the exact same millisecond ("thundering herd").

```swift
// Compact retry logic with backoff
for attempt in 0..<maxRetries {
    do {
        return try await client.request(endpoint)
    } catch where endpoint.isIdempotent && isTransient(error) {
        let delay = pow(2.0, Double(attempt)) + Double.random(in: 0...0.5)
        try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
    }
}
```

---

#### 2. 🔑 Auth Refresh (Token Lifecycle & Race Conditions)
* **Simple Explanation**: When the user's 1-hour access token expires, quietly fetch a new one using the refresh token and replay the original request so the user never notices.
* **The Classic Senior Interview Trap**:
  - *Trap*: "What happens when 5 parallel API calls all get `401 Unauthorized` at the exact same moment on launch?"
  - *Answer*: If you fire 5 refresh calls, you cause a **race condition** and break single-use refresh token rotation!
* **The Solution (Actor + Single-Flight Task)**:
  - Guard token refresh inside a Swift `actor`.
  - The first 401 starts an async `Task`. The other 4 calls **await that exact same `Task`** instead of firing new network requests.

```swift
actor TokenManager {
    private var refreshTask: Task<String, Error>?

    func getValidToken() async throws -> String {
        // If a refresh is already in-flight, await the same task!
        if let existingTask = refreshTask {
            return try await existingTask.value
        }
        let task = Task {
            defer { refreshTask = nil }
            return try await api.refreshToken()
        }
        refreshTask = task
        return try await task.value
    }
}
```

---

#### 3. 💾 Caching (Two-Tier Strategy)
* **Simple Explanation**: Don't waste mobile data or battery downloading things you already have.
* **The Two Tiers**:
  1. **HTTP Transport Cache (`URLCache`)**:
     - Built into iOS. Respects server HTTP headers (`Cache-Control`, `ETag`).
     - If unchanged, server returns `304 Not Modified` and iOS serves the cached data without re-downloading the body.
  2. **Domain Persistence Cache (SwiftData / Core Data)**:
     - **Single Source of Truth (SSOT)**: The network writes fresh data into the local DB; the UI observes the local DB.
     - Provides instant load times and **100% offline support**.

---

#### 4. 🛑 Cancellation (Resource Management)
* **Simple Explanation**: If the user leaves the screen before a photo loads, or types another letter in a search bar, abort the previous request immediately.
* **How It Works**:
  - **Swift Concurrency**: Cancellation is cooperative. In SwiftUI, the `.task` modifier cancels automatically when the view disappears, which cascades down to `URLSession` and closes the TCP connection.
  - **Search-as-you-type (Debounce + Cancel)**:
    ```swift
    // Cancel existing search before starting a new one
    searchTask?.cancel()
    searchTask = Task {
        try await Task.sleep(nanoseconds: 300_000_000) // 300ms debounce
        let results = try await client.search(query)
    }
    ```

---

### 🧠 Quick Memory Card (Flashcard for Interviews)

| Pillar | 1-Sentence Senior Talking Point |
|---|---|
| **Retries** | *"Exponential backoff with jitter on idempotent calls (GET/PUT), never blind POST."* |
| **Auth Refresh** | *"Actor-isolated single-flight Task to prevent concurrent 401 race conditions."* |
| **Caching** | *"URLCache for HTTP 304s + SwiftData/CoreData as Single Source of Truth for offline mode."* |
| **Cancellation** | *"Cooperative cancellation via SwiftUI `.task` and debounced Task cancellation for search."* |

* **Code References in this Project**:
  - Custom Stack implementation: [`NetworkStackExample.swift`](file:///Users/johnsonelangbam/Projects/City-Interview/City-Interview/Networking/CustomNetworkStack/NetworkStackExample.swift)
  - Interceptors & Auth Refresh: [`InterceptorExample.swift`](file:///Users/johnsonelangbam/Projects/City-Interview/City-Interview/Networking/Interceptors/InterceptorExample.swift)
  - URLSession configurations: [`URLSessionExample.swift`](file:///Users/johnsonelangbam/Projects/City-Interview/City-Interview/Networking/URLSessionBasics/URLSessionExample.swift)
