import Foundation

// MARK: - 🛡️ Interceptors (Middleware)
//
// 💡 INTERVIEW TALKING POINTS:
// • What are they? Interceptors sit between your app code and the network, automatically modifying requests before they go out, or inspecting responses before they come back.
// • Use Cases:
//   - Request: Injecting Auth/Bearer tokens into headers, appending API keys to queries.
//   - Response: Logging errors globally, refreshing expired Auth tokens automatically (401 Unauthorized), or caching headers.
// • Implementations: 
//   - Native iOS: `URLProtocol` subclassing (intercepts ALL traffic at the OS level).
//   - Protocol/Chain: A custom "Chain of Responsibility" built in your network stack (demonstrated below).

// ==========================================
// 1. Interceptor Protocol
// ==========================================
protocol NetworkInterceptor {
    func adapt(_ request: URLRequest) -> URLRequest
    func process(_ response: HTTPURLResponse, data: Data)
}

// ==========================================
// 2. Concrete Interceptor Examples
// ==========================================

class AuthInterceptor: NetworkInterceptor {
    private let tokenManager = TokenManager() // Assume this manages auth state
    
    // Runs BEFORE the network call
    func adapt(_ request: URLRequest) -> URLRequest {
        var adaptedRequest = request
        if let token = tokenManager.getToken() {
            // Automatically inject the token into EVERY outgoing request!
            adaptedRequest.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return adaptedRequest
    }
    
    // Runs AFTER the network call
    func process(_ response: HTTPURLResponse, data: Data) {
        if response.statusCode == 401 {
            print("Auth Token Expired! Triggering global refresh flow...")
            tokenManager.refreshToken()
        }
    }
}

class LoggingInterceptor: NetworkInterceptor {
    func adapt(_ request: URLRequest) -> URLRequest {
        print("🚀 Requesting: \(request.url?.absoluteString ?? "")")
        return request
    }
    
    func process(_ response: HTTPURLResponse, data: Data) {
        print("✅ Received Status: \(response.statusCode) with \(data.count) bytes")
    }
}

// Dummy class for compiling
class TokenManager {
    func getToken() -> String? { return "secret_abc123" }
    func refreshToken() {}
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why use Interceptors instead of adding the Auth Token in every endpoint?
//   A: Separation of Concerns (DRY). Endpoints shouldn't care about Auth logic. Interceptors handle it globally in one place.
// • Q: What is URLProtocol?
//   A: It is an Apple class you can subclass to intercept URL requests at the lowest Foundation level. It is incredibly powerful and often used for advanced mocking or caching.
// • Q: If a token expires and returns a 401, how do Interceptors help?
//   A: A response interceptor can catch the 401 globally, pause the network queue, execute a token refresh, and then automatically retry the failed request without the ViewModel ever knowing it failed!
