import Foundation

// MARK: - 🔐 Token Authentication
//
// 💡 INTERVIEW TALKING POINTS:
//
// ==========================================
// 1. What it is
// ==========================================
// Instead of sending username/password on every request, the server gives you a token once (usually after login). You attach that token to every future request to prove "this is really me" — like a wristband at an event, instead of showing your ID every single time.
//
// ==========================================
// 2. How it works, step by step
// ==========================================
// • User logs in with username/password.
// • Server checks credentials, sends back a token (a long random string).
// • App saves the token securely (usually in the Keychain, not UserDefaults).
// • Every future request attaches the token in the header:
//   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// • Server checks the token on each request — if valid, it processes the request; if expired/invalid, it returns 401 Unauthorized.
//
// ==========================================
// 3. Simple code example
// ==========================================

enum AppNetworkError: Error {
    case unauthorized
}

func makeAuthenticatedRequest(url: URL, token: String) async throws -> Data {
    var request = URLRequest(url: url)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

    let (data, response) = try await URLSession.shared.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse else {
        throw URLError(.badServerResponse)
    }

    if httpResponse.statusCode == 401 {
        throw AppNetworkError.unauthorized  // token expired or invalid
    }

    return data
}

// ==========================================
// 4. Two common token types
// ==========================================
// • Access token — short-lived (minutes to hours), used for actual requests.
// • Refresh token — long-lived, used only to get a new access token when the old one expires. Kept more securely, used less often.
//
// ==========================================
// 5. Ideal situation to use token-based auth
// ==========================================
// • Any app where the user logs in once and then stays logged in across multiple screens/sessions — which is basically every modern app (banking, social, enterprise).
// • Especially good when you have many API calls after login — you don't want to resend the password every time, and you don't want the server to have to keep session state in memory for every user (this is called being "stateless," and it scales better for the server).
// • Compare to session-based auth (older method, server keeps a session in memory) — token-based is more common today because it scales better for large systems and works well with mobile apps that go online/offline.
//
// ==========================================
// 🎙️ Interview Summary Rule & One-liner
// ==========================================
// Simple rule to remember:
// "Login once, get a token, attach it as a Bearer header on every request after that. Store it in the Keychain, refresh it when it expires, and never resend the password again after the first login."
