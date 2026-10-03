const fs = require('fs');
const vm = require('vm');

const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';
const GENERATED_DOCS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Helpers/generated_docs.json';
const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

// 1. Read existing questions and docs
let questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
const generatedDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));

console.log('Total questions before insertion:', questions.length);

// Map existing questions to their companion docs before ID shift
const textToDocs = new Map();
questions.forEach(q => {
  if (generatedDocs.QUESTION_TO_DOCS[q.id]) {
    textToDocs.set(q.question, generatedDocs.QUESTION_TO_DOCS[q.id]);
  }
});

// 2. Define the new question
const newQuestion = {
  id: "Q-48", // Placeholder, will be re-indexed
  category: "Security, Auth & Compliance",
  difficulty: "Advanced",
  question: "Explain a safe login flow: OAuth 2.0, refresh tokens, and token rotation",
  interviewSentence: "Log in through the system browser with the code flow and PKCE, use a short-lived access token for the API, and use a rotating refresh token, stored in the Keychain, to renew it one refresh at a time.",
  answer: `This is how an app logs a user in without ever seeing their password. You see it in "Sign in with Google", banking apps, and any app with its own login server. The user logs in on the login server's page, and the app only receives tokens.

• OAuth 2.0: the standard way to give an app limited access to a user's account.
• Access token: a short-lived token (5 to 15 minutes) that the app sends to the API on every call.
• Refresh token: a longer-lived token used only to get a new access token, so the user stays logged in.
• Token rotation: every refresh gives a new refresh token, and the old one stops working.
• PKCE: a small extra step (Proof Key for Code Exchange) that makes the authorization code flow safe on mobile devices.

Say it like this:
"For a mobile app, I use the Authorization Code flow with PKCE. I open the login page in a system browser using ASWebAuthenticationSession, so my app never sees the password. The user logs in and agrees to the permissions. The server then sends my app back a one-time code. My app trades that code for an access token and a refresh token.

PKCE protects that trade. Before login, my app makes a random secret and sends only its hash. When I trade the code, I send the original secret. If another app steals the code, it cannot use it, because it does not have the secret.

After that, I send the access token in the header of every API call. It expires quickly, so if someone steals it, they can use it only for a short time. When it expires, I use the refresh token to get a new one, without asking the user to log in again.

With rotation, each refresh returns a new refresh token, and the old one is dead. If a thief uses an old refresh token after I already used it, the server sees the same token twice, knows it was stolen, and ends the whole session. In my app, I allow only one refresh at a time, because two refreshes together would look like theft.

Both tokens are stored in the Keychain. On logout, I tell the server to revoke the token and delete everything locally."

The flow in one picture:
\`\`\`text
 App                  System Browser          Login Server              API
  |                         |                       |                     |
  | 1. open login page ---->|---------------------->|                     |
  |    (with PKCE hash)     |                       |                     |
  |                         | 2. user logs in       |                     |
  |                         |    (app never sees the password)            |
  |                                                 |                     |
  | 3. redirect back with a one-time CODE <---------|                     |
  |                                                 |                     |
  | 4. send CODE + PKCE secret -------------------->|                     |
  | 5. access token + refresh token <---------------|                     |
  |    (save both in Keychain)                      |                     |
  |                                                                       |
  | 6. call API with access token ----------------------------------->    |
  |                                                                       |
  | 7. access token expired                                               |
  |    send refresh token ------------------------->|                     |
  |    NEW access token + NEW refresh token <-------|                     |
  |    (old refresh token is now dead = rotation)                         |
\`\`\`

Quick steps to remember:
1. Login in the system browser: the app never sees the password.
2. Code: the server sends a one-time code, and PKCE protects it.
3. Tokens: trade the code for an access token and a refresh token, store both in the Keychain.
4. Use: access token in the Authorization header.
5. Refresh: when it expires, use the refresh token. Each refresh gives a new refresh token (rotation).
6. One at a time: only one refresh runs at once (single-flight via Actor).
7. Logout: revoke on the server, delete locally from Keychain.

Good to mention (Staff-Level Interview Points):
• Short-Lived vs. Long-Lived: Access tokens are short-lived (5-15 mins) and refresh tokens are long-lived. The short lifetime limits the attack window if an access token leaks in transit or memory.
• Reuse Detection in Token Rotation: The main security benefit of rotation is theft detection. If an attacker uses an old, already-rotated refresh token, the server detects token reuse, flags the session as compromised, and revokes all tokens issued in that lineage.
• OIDC vs. OAuth 2.0: OpenID Connect (OIDC) sits on top of OAuth. It adds an ID token (JWT) specifying *who* the user is (identity/authentication). OAuth 2.0 alone specifies *what* the app may do (delegated authorization/scopes).
• Deprecated Anti-Patterns: Avoid the Implicit Flow (tokens exposed in redirect URL fragments) and Resource Owner Password Credentials Grant (where the mobile app handles raw usernames and passwords).
• Sandboxed Authentication: Always use ASWebAuthenticationSession, never a custom in-app WKWebView (which could log keystrokes or bypass Apple Face ID/Passkey autofill).
• Zero Token Leakage: Never log tokens to OSLog/Console, and never embed them as query parameters in GET request URLs (always use Authorization: Bearer <token> headers).

One-liner: Log in through the system browser with the code flow and PKCE, use a short-lived access token for the API, and use a rotating refresh token, stored in the Keychain, to renew it one refresh at a time.

Memory trick: B-C-T-U-R → "Browser login, Code, Tokens in Keychain, Use the access token, Refresh with rotation."`,
  codeExample: `// =========================================================================
// SENIOR INTERVIEW ARCHITECTURE: Safe Login Flow (OAuth 2.0 + PKCE + Rotation)
// =========================================================================
import Foundation
import AuthenticationServices
import Security
import UIKit

// MARK: - 1. Open the Login Page with PKCE & ASWebAuthenticationSession
// 💡 SENIOR TALKING POINT:
// Using ASWebAuthenticationSession provides a sandboxed system browser.
// The host app CANNOT inspect keystrokes or steal credentials, and benefits
// from shared Safari session cookies and system Passkey / 2FA autofill.

final class OAuthLoginCoordinator: NSObject, ASWebAuthenticationPresentationContextProviding {
    private var webAuthSession: ASWebAuthenticationSession?
    
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first(where: { $0.isKeyWindow }) else {
            return ASPresentationAnchor()
        }
        return window
    }
    
    func startLogin(challenge: String, state: String, completion: @escaping (Result<URL, Error>) -> Void) {
        var comps = URLComponents(string: "https://auth.example.com/authorize")!
        comps.queryItems = [
            .init(name: "response_type", value: "code"),              // We request a one-time authorization code
            .init(name: "client_id", value: "my-ios-app"),            // Registered public client ID
            .init(name: "redirect_uri", value: "myapp://callback"),   // Custom scheme or Universal Link callback
            .init(name: "scope", value: "profile offline_access"),    // offline_access requests a refresh token
            .init(name: "state", value: state),                       // CSRF protection token
            .init(name: "code_challenge", value: challenge),          // PKCE: SHA-256 hash of the code verifier
            .init(name: "code_challenge_method", value: "S256")       // RFC 7636 S256 challenge method
        ]
        
        let session = ASWebAuthenticationSession(
            url: comps.url!,
            callbackURLScheme: "myapp"
        ) { callbackURL, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let url = callbackURL else {
                completion(.failure(AuthError.invalidCallback))
                return
            }
            completion(.success(url))
        }
        
        session.presentationContextProvider = self
        session.prefersEphemeralWebBrowserSession = false // Allows SSO via Safari session cookies
        self.webAuthSession = session
        session.start()
    }
}

// MARK: - 2. Trade the One-Time Code for Tokens
// 💡 SENIOR TALKING POINT:
// The code_verifier proves this client instance initiated the request.
// Even if an attacker intercepts the authorization code via URL scheme hijacking,
// they cannot exchange it without the unhashed secret.

struct TokenResponse: Codable {
    let access_token: String
    let refresh_token: String
    let expires_in: Int
    let token_type: String
}

enum AuthError: Error {
    case loggedOut
    case invalidCallback
    case tokenRefreshFailed
}

func exchange(code: String, verifier: String) async throws {
    var request = URLRequest(url: URL(string: "https://auth.example.com/token")!)
    request.httpMethod = "POST"
    request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
    
    let bodyString = "grant_type=authorization_code" +
        "&code=\\(code)" +
        "&redirect_uri=myapp://callback" +
        "&client_id=my-ios-app" +
        "&code_verifier=\\(verifier)"
    
    request.httpBody = Data(bodyString.utf8)
    
    let (data, response) = try await URLSession.shared.data(for: request)
    guard (response as? HTTPURLResponse)?.statusCode == 200 else {
        throw AuthError.tokenRefreshFailed
    }
    
    let tokens = try JSONDecoder().decode(TokenResponse.self, from: data)
    TokenStorage.save(tokens) // Store securely in Keychain
}

// MARK: - 3. Call Protected API with Bearer Access Token
// 💡 SENIOR TALKING POINT:
// Tokens must ALWAYS be delivered via Authorization headers, NEVER in URL query params.

func fetchOrders(accessToken: String) async throws -> Data {
    var request = URLRequest(url: URL(string: "https://api.example.com/orders")!)
    request.setValue("Bearer \\(accessToken)", forHTTPHeaderField: "Authorization")
    let (data, _) = try await URLSession.shared.data(for: request)
    return data
}

// MARK: - 4. Token Rotation with Single-Flight Actor
// 💡 SENIOR TALKING POINT:
// Concurrency Trap: If 5 parallel network calls encounter an expired access token,
// they must NOT trigger 5 simultaneous refresh requests. With Token Rotation,
// the 2nd request using the invalidated refresh token would cause the server to
// trigger 'Reuse Detection' and revoke the user session!
// We serialize refreshes using a Swift Actor with task deduplication.

actor TokenManager {
    private var refreshTask: Task<String, Error>? // In-flight refresh task deduplication

    func validAccessToken() async throws -> String {
        if let token = TokenStorage.accessToken, !TokenStorage.isExpired {
            return token // Fast-path: Token is valid in memory/Keychain
        }
        
        // Single-flight pattern: Share ongoing refresh task among all callers
        if let running = refreshTask {
            return try await running.value
        }
        
        let task = Task { try await self.refresh() }
        refreshTask = task
        defer { refreshTask = nil } // Clear once completed
        return try await task.value
    }

    private func refresh() async throws -> String {
        guard let oldRefresh = TokenStorage.refreshToken else {
            throw AuthError.loggedOut
        }
        
        var request = URLRequest(url: URL(string: "https://auth.example.com/token")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data(
            "grant_type=refresh_token&refresh_token=\\(oldRefresh)&client_id=my-ios-app".utf8
        )
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            // If the server returns 400/401, token was revoked or reused by an attacker.
            TokenStorage.clear()
            throw AuthError.loggedOut
        }
        
        let tokens = try JSONDecoder().decode(TokenResponse.self, from: data)
        // TOKEN ROTATION: Store the newly issued refresh token; the previous one is invalidated
        TokenStorage.save(tokens)
        return tokens.access_token
    }
}

// MARK: - 5. Keychain Token Storage & Expiry Checking
enum TokenStorage {
    private static let accessKey = "com.citi.retailbanking.accessToken"
    private static let refreshKey = "com.citi.retailbanking.refreshToken"
    private static let expiryKey = "com.citi.retailbanking.tokenExpiry"
    
    static var accessToken: String? {
        readKeychain(key: accessKey)
    }
    
    static var refreshToken: String? {
        readKeychain(key: refreshKey)
    }
    
    static var isExpired: Bool {
        guard let expiryString = readKeychain(key: expiryKey),
              let timestamp = Double(expiryString) else { return true }
        return Date().timeIntervalSince1970 >= (timestamp - 30) // 30-second buffer
    }
    
    static func save(_ response: TokenResponse) {
        saveKeychain(key: accessKey, value: response.access_token)
        saveKeychain(key: refreshKey, value: response.refresh_token)
        let expiry = Date().addingTimeInterval(Double(response.expires_in)).timeIntervalSince1970
        saveKeychain(key: expiryKey, value: String(expiry))
    }
    
    static func clear() {
        deleteKeychain(key: accessKey)
        deleteKeychain(key: refreshKey)
        deleteKeychain(key: expiryKey)
    }
    
    // MARK: - Low-level SecItem Helpers
    private static func saveKeychain(key: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    private static func readKeychain(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var item: AnyObject?
        if SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
           let data = item as? Data {
            return String(data: data, encoding: .utf8)
        }
        return nil
    }
    
    private static func deleteKeychain(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - 6. Secure Logout with Server-Side Revocation
func logout() async {
    if let refresh = TokenStorage.refreshToken {
        var request = URLRequest(url: URL(string: "https://auth.example.com/revoke")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data("token=\\(refresh)&client_id=my-ios-app".utf8)
        _ = try? await URLSession.shared.data(for: request) // Best effort revocation on backend
    }
    TokenStorage.clear() // Wipe tokens from local device Keychain
}`
};

// 3. Insert right after Q-47 ("How do you store tokens and secrets on iOS? What goes in Keychain?")
const index47 = questions.findIndex(q => q.id === 'Q-47');
console.log('Inserting right after Q-47 at index:', index47 + 1);
questions.splice(index47 + 1, 0, newQuestion);

// Re-index all questions sequentially Q-01 to Q-74
questions.forEach((q, idx) => {
  q.id = `Q-${String(idx + 1).padStart(2, '0')}`;
});

console.log('New total questions count:', questions.length);

// 4. Save questions.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
console.log('Saved questions.json successfully!');

// 5. Re-map QUESTION_TO_DOCS with shifted IDs
const updatedQToDocs = {};
const securityDocs = [
  {
    docId: "security-comparison",
    title: "Security Decision Table (Keychain, Enclave, Pinning)",
    icon: "🔒",
    filename: "SecurityDecisionTable.md"
  },
  {
    docId: "networking-architecture",
    title: "Networking Architecture & Design Patterns",
    icon: "🌐",
    filename: "NetworkingArchitecture.md"
  }
];

questions.forEach(q => {
  if (q.question.includes("OAuth 2.0") || q.question.includes("safe login flow")) {
    updatedQToDocs[q.id] = securityDocs;
  } else if (textToDocs.has(q.question)) {
    updatedQToDocs[q.id] = textToDocs.get(q.question);
  }
});

generatedDocs.QUESTION_TO_DOCS = updatedQToDocs;
fs.writeFileSync(GENERATED_DOCS_PATH, JSON.stringify(generatedDocs, null, 2), 'utf-8');
console.log('Updated generated_docs.json successfully!');

// 6. Define TOPIC_CATEGORIES for 74 questions
const TOPIC_CATEGORIES = [
  {
    id: "architecture",
    title: "Architecture & Design Patterns",
    shortTitle: "Architecture",
    icon: "🏗️",
    color: "#D97757",
    summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles.",
    docIds: ["clean-architecture", "coordinator-pattern", "dependency-injection", "mvvm", "repository-pattern", "solid-principles", "viper-pattern"],
    questionIds: ["Q-01", "Q-02", "Q-03", "Q-04", "Q-05"]
  },
  {
    id: "concurrency",
    title: "Swift Concurrency & Multithreading",
    shortTitle: "Swift Concurrency",
    icon: "⚡",
    color: "#D49544",
    summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions.",
    docIds: ["multithreading-gcd", "concurrency-issues", "thread-safety", "operation-queue"],
    questionIds: ["Q-06", "Q-07", "Q-08", "Q-09", "Q-10", "Q-11", "Q-12"]
  },
  {
    id: "core-advance-swift",
    title: "Core Swift & Language Internals",
    shortTitle: "Core & Advance Swift",
    icon: "🚀",
    color: "#8E5B70",
    summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops.",
    docIds: ["ios-internals", "swiftui-state"],
    questionIds: ["Q-13", "Q-14", "Q-15", "Q-16", "Q-17", "Q-18"]
  },
  {
    id: "swift-basics-ui",
    title: "SwiftUI & UIKit Layout",
    shortTitle: "UI & Layout",
    icon: "🎨",
    color: "#C15F3D",
    summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), iPad adaptive layouts, internationalization & RTL, UICollectionView diffable data sources & compositional layouts, atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, and UIKit interoperability.",
    docIds: ["autolayout-basics", "composable-ui", "design-system", "swiftui-uikit-interop", "swiftui-state"],
    questionIds: ["Q-19", "Q-20", "Q-21", "Q-22", "Q-23", "Q-24", "Q-25", "Q-26", "Q-27", "Q-28"]
  },
  {
    id: "combine-reactive",
    title: "Combine & Reactive Streams",
    shortTitle: "Combine & Streams",
    icon: "🌊",
    color: "#4D7C8A",
    summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles.",
    docIds: [],
    questionIds: ["Q-29"]
  },
  {
    id: "networking",
    title: "Networking, APIs & Background Tasks",
    shortTitle: "Networking & APIs",
    icon: "🌐",
    color: "#5A7D65",
    summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler.",
    docIds: ["networking-architecture"],
    questionIds: ["Q-30", "Q-31", "Q-32", "Q-33", "Q-34"]
  },
  {
    id: "modularity-performance",
    title: "Modularity, Build & Launch Performance",
    shortTitle: "Modularity & Perf",
    icon: "📦",
    color: "#7E6E5C",
    summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.",
    docIds: ["modular-architecture", "performance-profiling"],
    questionIds: ["Q-35", "Q-36", "Q-37", "Q-38", "Q-39", "Q-40", "Q-41"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#7C5379",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-42", "Q-43", "Q-44", "Q-45"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#B84A39",
    summary: "Keychain vs Secure Enclave, token storage CRUD, OAuth 2.0 PKCE & token rotation, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "networking-architecture", "leadership-ownership"],
    questionIds: ["Q-46", "Q-47", "Q-48", "Q-49", "Q-50", "Q-51", "Q-52", "Q-53", "Q-54"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#A34836",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-55", "Q-56"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#4A7C94",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-57", "Q-58", "Q-59", "Q-60", "Q-61", "Q-62", "Q-63", "Q-64"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#B07038",
    summary: "Production incident triage, crash log analysis & dSYM symbolication, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: ["leadership-ownership"],
    questionIds: ["Q-65", "Q-66"]
  },
  {
    id: "memory-management",
    title: "Memory Management",
    shortTitle: "Memory Mgmt",
    icon: "🧠",
    color: "#477C6B",
    summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit.",
    docIds: [],
    questionIds: ["Q-67", "Q-68", "Q-69", "Q-70", "Q-71", "Q-72", "Q-73", "Q-74"]
  }
];

// 7. Regenerate QUESTIONS.md
const topicMeta = {
  "Swift Internals & Advanced Types": { icon: "⚡", summary: "Memory layouts, Copy-on-Write, Existential Containers, Method Dispatch, Generics, and opaque types." },
  "Swift Concurrency & Async/Await": { icon: "🔀", summary: "Actors, Tasks, TaskGroups, AsyncSequence, Thread Sanitizer, and non-blocking concurrency." },
  "Modern Architecture & Patterns": { icon: "🏗️", summary: "VIPER, Clean Swift, Coordinator, TCA, State Machines, and Event-Driven systems." },
  "Auto Layout, UIKit & Modern SwiftUI": { icon: "📐", summary: "Constraint solving engine, intrinsic content size, priorities, iPad multitasking & adaptive size classes, Localizable string catalogs & RTL, and UICollectionView diffable data sources with compositional layouts." },
  "Combine & Reactive Streams": { icon: "🌊", summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles." },
  "Networking, APIs & Background Tasks": { icon: "🌐", summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, BGTaskScheduler, App Suspension & State Restoration." },
  "Modularity & Launch Performance": { icon: "📦", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Modularity, Build & Launch Performance": { icon: "📦", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Data Persistence, SwiftData & Memory Deep Dive": { icon: "💾", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Data Persistence & Memory Management": { icon: "💾", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Security, App Hardening & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, token storage CRUD, OAuth 2.0 PKCE & token rotation, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "Security, Auth & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, token storage CRUD, OAuth 2.0 PKCE & token rotation, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "System Design & Mobile Architecture": { icon: "🏛️", summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution." },
  "Testing, CI/CD & AI Engineering": { icon: "🧪", summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems." },
  "Engineering Leadership & Operations": { icon: "👔", summary: "Production incident triage, crash log analysis & dSYM symbolication, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern." },
  "Memory Management": { icon: "🧠", summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit." }
};

const catGroups = {};
for (const q of questions) {
  if (!catGroups[q.category]) catGroups[q.category] = [];
  catGroups[q.category].push(q);
}

const mdLines = [];
mdLines.push("# 📱 iOS Senior & Staff Interview Question Bank");
mdLines.push("");
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, UICollectionView Diffable Data Sources & Compositional Layouts, Background Execution & State Restoration, Performance Profiling & Instruments, 60/120fps Scroll Hitch Elimination, Scalable Image Caching, Keychain Secrets Management, OAuth 2.0 PKCE & Token Rotation, Production Crash Log Triage & Symbolication, Memory Management, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
mdLines.push("");
mdLines.push("## 📊 Overview");
mdLines.push("");
mdLines.push("| Category / Topic | Questions | Key Coverage |");
mdLines.push("|---|:---:|---|");

for (const [cat, qList] of Object.entries(catGroups)) {
  const summary = topicMeta[cat]?.summary || "";
  mdLines.push(`| **${cat}** | \`${qList.length}\` | ${summary} |`);
}

mdLines.push(`| **Total** | **\`${questions.length}\`** | Complete Senior & Staff iOS Interview Curriculum |`);
mdLines.push("");
mdLines.push("---");
mdLines.push("");

for (const [cat, qList] of Object.entries(catGroups)) {
  const meta = topicMeta[cat] || { icon: "📌", summary: "" };
  const startId = qList[0].id;
  const endId = qList[qList.length - 1].id;
  const rangeStr = startId !== endId ? `(${startId} – ${endId})` : `(${startId})`;
  mdLines.push(`## ${meta.icon} ${cat} ${rangeStr}`);
  mdLines.push("");
  mdLines.push(`> ${meta.summary}`);
  mdLines.push("");

  for (const q of qList) {
    mdLines.push(`### \`${q.id}\` — ${q.question}`);
    mdLines.push("");
    mdLines.push(`- **Category:** \`${q.category}\``);
    mdLines.push("");
    mdLines.push("> [!TIP]");
    mdLines.push("> **🗣️ Interview Pitch (Say it like this):**  ");
    mdLines.push(`> *"${q.interviewSentence}"*`);
    mdLines.push("");
    mdLines.push("#### 📖 Detailed Answer");
    mdLines.push("");
    mdLines.push(q.answer);
    mdLines.push("");
    mdLines.push("#### 💻 Swift Code Example");
    mdLines.push("");
    mdLines.push("```swift");
    mdLines.push(q.codeExample);
    mdLines.push("```");
    mdLines.push("");
    mdLines.push("---");
    mdLines.push("");
  }
}

fs.writeFileSync(QUESTIONS_MD_PATH, mdLines.join("\n"), 'utf-8');
console.log('Regenerated QUESTIONS.md successfully!');

// 8. Update index.html
let indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');

// Update counts in HTML
indexHtml = indexHtml.replace(/\d+ Questions · 24 Guides/g, `${questions.length} Questions · 24 Guides`);
indexHtml = indexHtml.replace(/\d+ Curated Questions/g, `${questions.length} Curated Questions`);

const scriptOpen = indexHtml.indexOf('<script>');
const scriptClose = indexHtml.lastIndexOf('</script>');
const preScript = indexHtml.substring(0, scriptOpen);
const postScript = indexHtml.substring(scriptClose + 9);
const scriptBody = indexHtml.substring(scriptOpen + 8, scriptClose);

let newScript = scriptBody;
newScript = newScript.replace(
  /const QUESTIONS = \[[\s\S]*?\];\n/,
  () => `const QUESTIONS = ${JSON.stringify(questions)};\n`
);
newScript = newScript.replace(
  /const TOPIC_CATEGORIES = \[[\s\S]*?\];\n/,
  () => `const TOPIC_CATEGORIES = ${JSON.stringify(TOPIC_CATEGORIES)};\n`
);
newScript = newScript.replace(
  /const QUESTION_TO_DOCS = \{[\s\S]*?\};\n/,
  () => `const QUESTION_TO_DOCS = ${JSON.stringify(generatedDocs.QUESTION_TO_DOCS)};\n`
);

// Validate script syntax
try {
  new vm.Script(newScript, { filename: 'dashboard-bundle.js' });
  console.log('VALIDATION PASSED: 100% Valid JavaScript Syntax! No errors!');
} catch (e) {
  console.error('VALIDATION FAILED in newScript:', e);
  process.exit(1);
}

const finalHtml = `${preScript}<script>${newScript}</script>${postScript}`;
fs.writeFileSync(INDEX_PATH, finalHtml, 'utf-8');
console.log(`Successfully updated index.html with all ${questions.length} questions!`);
