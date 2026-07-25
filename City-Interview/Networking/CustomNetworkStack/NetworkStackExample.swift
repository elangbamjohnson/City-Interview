import Foundation

// MARK: - 🏗️ Custom Network Stack
//
// 💡 INTERVIEW TALKING POINTS:
// • Why build a custom stack instead of raw URLSession?
//   - Consistency: Ensures every request uses the same headers, decoding logic, and error handling.
//   - Testability (Dependency Injection): By abstracting the network layer behind a protocol (e.g. `NetworkService`), you can inject a `MockNetworkService` to unit test your ViewModels without making real API calls.
//   - Decoupling: ViewModels shouldn't know how to construct URLs or parse JSON.
// • Tradeoffs: Added complexity and abstraction cost. For a simple app with 2 API calls, it's over-engineering. For an app with 50+ endpoints, it's mandatory.

// ==========================================
// 1. Endpoint Protocol (Decouples URL Construction)
// ==========================================
protocol Endpoint {
    var path: String { get }
    var method: String { get }
    var headers: [String: String]? { get }
}

enum UserEndpoint: Endpoint {
    case getUser(id: Int)
    
    var path: String {
        switch self {
        case .getUser(let id): return "/users/\(id)"
        }
    }
    var method: String { return "GET" }
    var headers: [String: String]? { return ["Content-Type": "application/json"] }
}

// ==========================================
// 2. Generic Network Client
// ==========================================
protocol NetworkClientProtocol {
    func request<T: Decodable>(endpoint: Endpoint) async throws -> T
}

class NetworkClient: NetworkClientProtocol {
    private let baseURL = "https://api.example.com"
    private let session: URLSession
    
    // Injecting the session allows for easy mocking (Dependency Injection!)
    init(session: URLSession = .shared) {
        self.session = session
    }
    
    func request<T: Decodable>(endpoint: Endpoint) async throws -> T {
        guard let url = URL(string: baseURL + endpoint.path) else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method
        request.allHTTPHeaderFields = endpoint.headers
        
        let (data, _) = try await session.data(for: request)
        
        // Generic decoding means we don't repeat JSONDecoder() for every endpoint
        return try JSONDecoder().decode(T.self, from: data)
    }
}

// Usage in an app:
// let client = NetworkClient()
// let user: User = try await client.request(endpoint: UserEndpoint.getUser(id: 1))

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why use an `Endpoint` enum/protocol?
//   A: It provides type-safety for API routes, preventing typos in URL strings scattered across the app.
// • Q: How does Generics (<T: Decodable>) improve the network layer?
//   A: It eliminates boilerplate. One generic `request` method can decode a `User`, `Post`, or `Product` seamlessly.
// • Q: If I use this stack, how do I unit test a ViewModel that fetches a User?
//   A: Make the ViewModel depend on `NetworkClientProtocol`. In tests, pass a `MockNetworkClient` that immediately returns a hardcoded `User` object without hitting the network.
