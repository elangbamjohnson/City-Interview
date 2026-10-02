# 📱 iOS Senior Interview Question Bank

> A comprehensive, human-readable revision guide for 39 senior iOS interview questions. Each question includes a spoken pitch, in-depth breakdown, and real-world Swift code.

## 📊 Overview

| Tier | Target Level | Questions |
|---|---|:---:|
| **Tier 1 — Must know cold** | Essential interview preparedness | `17` |
| **Tier 2 — Your differentiator** | Essential interview preparedness | `5` |
| **Tier 3 — Know the concept** | Essential interview preparedness | `14` |
| **Tier 4 — Just enough to not go blank** | Essential interview preparedness | `3` |
| **Total** | Full Curriculum | **`39`** |

## 📑 Table of Contents

- [Tier 1 — Must know cold](#tier-1-must-know-cold)
- [Tier 2 — Your differentiator](#tier-2-your-differentiator)
- [Tier 3 — Know the concept](#tier-3-know-the-concept)
- [Tier 4 — Just enough to not go blank](#tier-4-just-enough-to-not-go-blank)

---

## Tier 1 — Must know cold

### `T1-01` — GCD vs Swift Concurrency — when to use which, and why

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I prefer modern Swift Concurrency because the compiler helps prevent data races and thread explosion, but I understand how to read and maintain legacy GCD code."*

#### 📖 Detailed Answer

GCD (Grand Central Dispatch) is the older, callback-based approach using queues (serial/concurrent). Swift Concurrency (async/await) is the modern, structured approach built into the language itself. Swift Concurrency prevents thread explosion, avoids callback hell, and provides compile-time safety (especially with Actors). Use Swift Concurrency for new code, and GCD only when maintaining legacy code or for very specific low-level queue management.

#### 💻 Swift Code Example

```swift
// GCD Example
DispatchQueue.global().async {
    let data = fetchData()
    DispatchQueue.main.async {
        updateUI(with: data)
    }
}

// Swift Concurrency Example
Task {
    let data = await fetchData()
    updateUI(with: data)
}
```

---

### `T1-02` — How do Swift actors actually prevent data races?

- **Difficulty:** 🟣 `Advanced`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"Actors give me thread safety by construction — the compiler won't let two threads touch the same actor's state at once, so I'm not manually managing locks."*

#### 📖 Detailed Answer

A normal class lets any thread call its methods or touch its properties at any time — if two threads do that simultaneously, you get a data race. An actor is a reference type where the compiler enforces that only one task can access its internal state at a time. Every access from outside the actor has to go through `await`, which is the compiler's way of saying 'get in line, you might have to wait your turn.'

#### 💻 Swift Code Example

```swift
actor BankAccount {
    private var balance: Double = 0.0
    
    // Compiler ensures this runs safely, one task at a time
    func deposit(amount: Double) {
        balance += amount
    }
}

// Usage from outside requires 'await'
Task {
    let account = BankAccount()
    await account.deposit(amount: 100)
}
```

---

### `T1-03` — async/await, structured concurrency, task groups

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I use structured concurrency like async let or task groups so that cancellation and error propagation are handled automatically by the system."*

#### 📖 Detailed Answer

async/await allows asynchronous code to be written linearly, making it easier to read. Structured concurrency ties tasks to a specific scope, ensuring they are cancelled automatically if the parent task is cancelled or fails. Task groups allow you to spawn multiple child tasks dynamically and wait for all of them to complete.

#### 💻 Swift Code Example

```swift
func fetchMultipleImages() async throws -> [UIImage] {
    return try await withThrowingTaskGroup(of: UIImage.self) { group in
        for url in imageURLs {
            group.addTask { try await fetchImage(url: url) }
        }
        
        var images: [UIImage] = []
        for try await image in group {
            images.append(image)
        }
        return images
    }
}
```

---

### `T1-04` — Race conditions vs deadlocks — definitions + a real example of each

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"A race condition is when threads step on each other's toes changing shared state, while a deadlock is when they are permanently stuck waiting for each other."*

#### 📖 Detailed Answer

A race condition occurs when two or more threads access shared data and try to change it at the same time, leading to unpredictable results (e.g., two threads incrementing a bank balance simultaneously). A deadlock occurs when two or more threads wait forever for a lock or resource held by each other (e.g., Thread A locks Resource 1 and needs Resource 2; Thread B locks Resource 2 and needs Resource 1).

---

### `T1-05` — OperationQueue / Operation — basic concept

- **Difficulty:** 🟢 `Beginner`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I haven't used Operation's dependency graph hands-on — my structured concurrency work has been through Swift's task groups and async let, which solve a similar sequencing problem in a more modern way."*

#### 📖 Detailed Answer

Before Swift Concurrency existed, `OperationQueue` was Apple's way of managing units of work that might depend on each other. You wrap a task in an `Operation` object, and you can say 'this operation can't start until that one finishes' using `addDependency()`. It's useful when you have a chain of tasks — like resize this image, THEN upload it, THEN update the UI.

---

### `T1-06` — MVC vs MVVM vs Clean Architecture — tradeoffs

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"MVVM hits the sweet spot for me in SwiftUI because the framework's reactive bindings make connecting the View to the ViewModel seamless."*

#### 📖 Detailed Answer

MVC (Model-View-Controller) often leads to 'Massive View Controller' because the Controller handles both business logic and UI lifecycle. MVVM (Model-View-ViewModel) extracts the presentation logic into a ViewModel, making the View dumber and the ViewModel easily testable, but requires binding mechanisms. Clean Architecture separates concerns into concentric layers (Entities, Use Cases, Interfaces) so the core logic is entirely independent of the UI or databases, which is great for large apps but adds significant boilerplate.

---

### `T1-07` — VIPER — the 5 components and why teams choose it

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"VIPER is highly decoupled which is great for enterprise scale and testing, though I usually lean towards MVVM for its balance of simplicity and separation unless the project demands strict VIPER."*

#### 📖 Detailed Answer

VIPER stands for View, Interactor, Presenter, Entity, and Router. It strictly separates responsibilities to make code highly modular and testable. Interactor holds business logic, Presenter formats data for the UI, Router handles navigation. Teams choose it for large enterprise apps where many developers work on the same feature, though it introduces a lot of boilerplate.

---

### `T1-08` — Dependency Injection — constructor vs property injection, why it helps testing

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I prefer constructor injection because it makes dependencies explicit and guarantees the object is fully initialized and ready to use, which makes unit testing with mocks straightforward."*

#### 📖 Detailed Answer

Dependency Injection (DI) is passing dependencies into an object rather than letting the object create them. Constructor injection passes them in the `init` method (preferred, ensures object is fully configured). Property injection sets them on a property later (used when you don't control initialization, like Storyboards). DI makes it easy to pass 'mock' objects during testing instead of hitting a real database or network.

#### 💻 Swift Code Example

```swift
protocol NetworkService {
    func fetch() -> Data
}

// Constructor Injection Example
class ViewModel {
    let network: NetworkService
    
    // Dependency is injected here
    init(network: NetworkService) {
        self.network = network
    }
}
```

---

### `T1-09` — SOLID principles

- **Difficulty:** 🟣 `Advanced`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"Applying SOLID helps keep code modular; for example, using protocols (Dependency Inversion) so I can easily swap out a real network layer for a mock in my unit tests."*

#### 📖 Detailed Answer

1) Single Responsibility: A class should have one reason to change. 2) Open/Closed: Open for extension, closed for modification. 3) Liskov Substitution: Subclasses should be substitutable for base classes. 4) Interface Segregation: Many client-specific interfaces are better than one general-purpose interface. 5) Dependency Inversion: Depend on abstractions, not concretions.

---

### `T1-10` — URLSession and building a networking layer — how would you architect one?

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I build networking layers behind a protocol abstraction so the rest of the app never touches URLSession directly — this makes testing, caching, and adding interceptors straightforward."*

#### 📖 Detailed Answer

URLSession is Apple's API for HTTP networking. A well-architected networking layer wraps URLSession behind a protocol so it can be mocked in tests. You typically create an APIClient that takes URLRequest objects, executes them via URLSession, and decodes the response using Codable. Error handling should map HTTP status codes to typed Swift errors. For enterprise apps, you'd add retry logic, request/response interceptors (for auth tokens), and certificate pinning.

#### 💻 Swift Code Example

```swift
protocol APIClientProtocol {
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T
}

class APIClient: APIClientProtocol {
    private let session: URLSession
    
    init(session: URLSession = .shared) {
        self.session = session
    }
    
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        let (data, response) = try await session.data(for: endpoint.urlRequest)
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
```

---

### `T1-11` — Thread-safe code using synchronization primitives — locks, mutexes, atomic operations

- **Difficulty:** 🟣 `Advanced`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"For legacy code I use serial queues or NSLock for thread safety, but for new code I prefer actors since the compiler enforces the serialization — no risk of forgetting to unlock."*

#### 📖 Detailed Answer

When multiple threads access shared state, you need synchronization. NSLock is a simple mutex — lock before access, unlock after. os_unfair_lock is faster but lower-level. DispatchQueue with a serial queue can also serialize access. @Atomic property wrappers use locks internally. In modern Swift, Actors replace most of these patterns. The key trade-off: locks are explicit and error-prone (forgetting to unlock = deadlock), while actors are compiler-enforced.

#### 💻 Swift Code Example

```swift
// Using a serial queue for thread safety
class ThreadSafeCache<Key: Hashable, Value> {
    private var storage: [Key: Value] = [:]
    private let queue = DispatchQueue(label: "com.app.cache")
    
    func set(_ value: Value, forKey key: Key) {
        queue.sync { storage[key] = value }
    }
    
    func get(forKey key: Key) -> Value? {
        queue.sync { storage[key] }
    }
}

// Modern approach with an Actor
actor SafeCache<Key: Hashable, Value> {
    private var storage: [Key: Value] = [:]
    
    func set(_ value: Value, forKey key: Key) {
        storage[key] = value
    }
    
    func get(forKey key: Key) -> Value? {
        storage[key]
    }
}
```

---

### `T1-12` — Protocol-Oriented Programming in Swift — why it matters

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I lean heavily on protocol-oriented design — it lets me define behavior contracts, provide defaults via extensions, and easily swap implementations for testing."*

#### 📖 Detailed Answer

Swift favors protocols over class inheritance. Protocols define a contract (what an object can do) without dictating implementation. Protocol extensions provide default implementations, enabling code reuse without the tight coupling of subclassing. This approach makes code more testable (swap real implementations for mocks), more composable (a type can conform to many protocols), and avoids the fragile base class problem.

#### 💻 Swift Code Example

```swift
protocol Cacheable {
    associatedtype Item
    func save(_ item: Item)
    func load() -> Item?
}

// Default implementation via extension
extension Cacheable where Item: Codable {
    func save(_ item: Item) {
        let data = try? JSONEncoder().encode(item)
        UserDefaults.standard.set(data, forKey: "\(Item.self)")
    }
    
    func load() -> Item? {
        guard let data = UserDefaults.standard.data(forKey: "\(Item.self)") else { return nil }
        return try? JSONDecoder().decode(Item.self, from: data)
    }
}
```

---

### `T1-13` — App lifecycle and Run Loops — what happens from launch to termination

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I understand the full lifecycle from launch to suspension, and I know never to block the main run loop — that's what causes UI freezes and watchdog kills."*

#### 📖 Detailed Answer

When you tap an app icon: 1) The system loads the binary and calls main(). 2) UIApplicationMain creates the UIApplication singleton and the AppDelegate. 3) The app moves through states: Not Running → Inactive → Active. Background transitions go Active → Inactive → Background → Suspended. The main run loop is a loop on the main thread that continuously processes events (touches, timers, network callbacks). If the main run loop is blocked (heavy work on main thread), the UI freezes.

#### 💻 Swift Code Example

```swift
// SceneDelegate lifecycle methods
func sceneDidBecomeActive(_ scene: UIScene) {
    // App is in the foreground and receiving events
}

func sceneWillResignActive(_ scene: UIScene) {
    // App is about to move to background — save state
}

func sceneDidEnterBackground(_ scene: UIScene) {
    // App is in background — release shared resources
}
```

---

### `T1-14` — UIKit and SwiftUI interoperability — UIHostingController and UIViewRepresentable

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"In my experience with enterprise codebases, I use UIHostingController to embed SwiftUI in UIKit flows, and UIViewRepresentable when I need a UIKit component inside SwiftUI."*

#### 📖 Detailed Answer

In enterprise apps, you'll have a mix of UIKit and SwiftUI. UIHostingController wraps a SwiftUI view so it can be used inside UIKit navigation (push it onto a UINavigationController). UIViewRepresentable wraps a UIKit view (like MKMapView or a custom UIView) so it can be used inside SwiftUI. UIViewControllerRepresentable does the same for full view controllers. The key challenge is bridging state — you use Coordinators to handle UIKit delegates.

#### 💻 Swift Code Example

```swift
// Wrapping a UIKit view for SwiftUI
struct MapView: UIViewRepresentable {
    func makeUIView(context: Context) -> MKMapView {
        MKMapView()
    }
    
    func updateUIView(_ uiView: MKMapView, context: Context) {
        // Update the map when SwiftUI state changes
    }
}

// Wrapping SwiftUI for UIKit
let swiftUIView = MySwiftUIView()
let hostingController = UIHostingController(rootView: swiftUIView)
navigationController.pushViewController(hostingController, animated: true)
```

---

### `T1-15` — MVVM-C (Coordinator pattern) — why enterprise apps use it

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I use Coordinators to centralize navigation logic, which keeps ViewModels focused purely on presentation and makes it easy to reuse screens across different flows."*

#### 📖 Detailed Answer

MVVM-C adds a Coordinator layer on top of MVVM. The Coordinator owns the navigation logic — it decides which screen to show next based on user actions or business rules. This removes navigation from ViewModels (which shouldn't know about other screens) and Views (which shouldn't know about the flow). It's especially useful in large apps where the same screen might appear in different flows (e.g., login vs onboarding).

#### 💻 Swift Code Example

```swift
protocol Coordinator: AnyObject {
    var childCoordinators: [Coordinator] { get set }
    func start()
}

class AppCoordinator: Coordinator {
    var childCoordinators: [Coordinator] = []
    let navigationController: UINavigationController
    
    init(navigationController: UINavigationController) {
        self.navigationController = navigationController
    }
    
    func start() {
        let loginCoordinator = LoginCoordinator(nav: navigationController)
        loginCoordinator.onLoginSuccess = { [weak self] in
            self?.showDashboard()
        }
        childCoordinators.append(loginCoordinator)
        loginCoordinator.start()
    }
    
    func showDashboard() {
        let dashboardVC = DashboardViewController()
        navigationController.pushViewController(dashboardVC, animated: true)
    }
}
```

---

### `T1-16` — How do you reduce build time in a multi-module app?

- **Difficulty:** 🟣 `Advanced`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I reduce build times by splitting modules into Interface and Implementation targets to prevent cascading recompilations, flattening the dependency graph for parallel compilation, and using isolated demo apps so engineers don't build the entire app shell for every change."*

#### 📖 Detailed Answer

To reduce build times in a multi-module codebase, I optimize across three pillars:

1. Module Architecture (Interface vs Implementation): Split each feature module into a lightweight `FeatureInterface` (protocols & data models) and a `FeatureImplementation`. Dependent modules only import the interface. Modifying internal implementation code will not trigger recompilation across dependent modules.

2. Flatten Dependency Graphs: Avoid monolithic 'Common' or 'Core' modules that every target imports; changing one line in Core invalidates the build cache for the entire app. Keep dependencies wide and shallow so Xcode compiles independent targets in parallel across CPU cores.

3. Tooling & Micro-Apps: Create standalone Demo Apps per module so engineers can build and run their focused feature in seconds without compiling the entire 500k-line app shell. For stable third-party or internal packages, leverage precompiled XCFrameworks or binary caching (e.g. Tuist or Bazel).

4. Compiler Flags: Ensure 'Build Active Architecture Only' is enabled for Debug, and use compiler warning flags (-warn-long-expression-type-checking) to eliminate complex Swift type-inference bottlenecks in SwiftUI views.

#### 💻 Swift Code Example

```swift
// Package.swift: Interface vs Implementation Pattern
// FeatureB only imports FeatureAInterface, preventing rebuild cascades
let package = Package(
    name: "FeatureA",
    targets: [
        // 1. Lightweight Interface (protocols only - rarely recompiled)
        .target(name: "FeatureAInterface"),
        
        // 2. Concrete Implementation (views, internal logic)
        .target(
            name: "FeatureAImplementation",
            dependencies: ["FeatureAInterface"]
        ),
        
        // 3. Isolated Demo App Target (builds in seconds!)
        .target(
            name: "FeatureADemoApp",
            dependencies: ["FeatureAImplementation"]
        )
    ]
)
```

---

### `T1-17` — Static vs dynamic frameworks. What is the effect on launch?

- **Difficulty:** 🟣 `Advanced`
- **Tier:** `Tier 1 — Must know cold`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"A static library is copied into the app's main binary at build time. A dynamic framework is a separate file inside the app bundle, and the system loads it when the app starts. That loading is what costs launch time. For every dynamic framework, dyld has to find it, map it into memory, bind its symbols, and run its initializers, all before main(). A few frameworks are fine, but 30 or 50 can make a cold launch noticeably slower.
> 
> On the formats: .a is always static. A .framework can be either, depending on the Mach-O Type setting. An XCFramework is only a container that holds device and simulator builds, so it can hold static or dynamic code. In Swift Package Manager, I choose with type: .static or .dynamic on the library product.
> 
> So in a big modular app, I link most modules statically to keep launch fast. I keep a dynamic framework only when code must be shared between the app and an extension, like a widget, so there is one copy. The trade-off is that static makes the main binary bigger and the final link slower, but launch is faster. I always measure launch before and after, because the real gain depends on the app."*

#### 📖 Detailed Answer

A static library is copied directly into the app's main executable binary at build time by the static linker (`ld64`). A dynamic framework remains a separate, standalone binary file inside the application bundle's `Frameworks/` directory and is dynamically resolved and mapped into memory by `dyld` (the dynamic link editor) at startup.

#### ⏱️ The Impact on Cold Launch Time
For every dynamic framework embedded in your app, `dyld` must perform expensive work before `main()` is reached:
1. **Locate & Map (dlsym / mmap)**: Locates binary on disk, inspects Mach-O load commands (`LC_LOAD_DYLIB`), and maps binary pages into virtual memory.
2. **Rebase & Bind**: Adjusts internal pointers due to ASLR (Address Space Layout Randomization) and resolves external symbol addresses to dependent libraries.
3. **Run Initializers**: Executes runtime `+load` methods and static C++ constructors.

While 5 to 10 dynamic frameworks add negligible overhead, having 30 to 50+ dynamic frameworks causes significant pre-main cold launch latency (often 500ms–2 seconds).

#### 📦 Key Formats & Rules
- **`.a` (Archive)**: Always a static library.
- **`.framework`**: Can be static or dynamic, dictated by the target's **Mach-O Type** build setting (`Static Library` vs `Dynamic Library`).
- **`.xcframework`**: A multi-platform bundle container holding device and simulator slices. It can package either static or dynamic binaries.
- **Swift Package Manager**: Configured explicitly via `.library(name: "Module", type: .static, targets: ["Module"])` or `type: .dynamic`.

#### 🔑 Senior Architectural Rules
- **Static by Default**: In large modular codebases, link the majority of feature and utility modules statically to maximize launch performance.
- **Dynamic for App + Extension Sharing**: Use a dynamic framework when code must be shared simultaneously between the main app and an app extension (e.g. WidgetKit extension, Share Extension) so both processes map the exact same binary in memory.
- **The Duplicate Symbol / Singleton Hazard**: Linking the same static library into both the main app and an embedded dynamic framework duplicates the compiled code and duplicates singleton state (`shared` instances will be separate).
- **Embedding Rule**: Dynamic XCFrameworks require **Embed & Sign** in Xcode target settings. Static libraries require **Do Not Embed** (or build errors occur). SPM handles this automatically.

#### 🛠️ Implementation Decision Table
| Need | How to Configure / Tool |
|---|---|
| **Measure launch** | Instruments App Launch, `DYLD_PRINT_STATISTICS=1`, MetricKit |
| **SPM static / dynamic** | `.library(name: "Cart", type: .static, targets: ["Cart"])` |
| **Xcode target** | Build Settings → **Mach-O Type** (`Static Library` vs `Dynamic Library`) |
| **CocoaPods** | `use_frameworks! :linkage => :static` |
| **Debug fast, Release small** | Xcode 15+ Mergeable Libraries (`MERGEABLE_LIBRARY = YES`) |
| **Binary distribution** | XCFramework + `.binaryTarget` with checksum in SPM |

> **🧠 Memory Trick:** **S-D-E** → *"Static by default, Dynamic for shared, Extensions are the reason."*

#### 💻 Swift Code Example

```swift
// Package.swift: Configuring Static vs Dynamic Linkage in Swift Package Manager
import PackageDescription

let package = Package(
    name: "SharedInfrastructure",
    platforms: [.iOS(.v17)],
    products: [
        // 1. Static Library (Default for app modules — zero pre-main dyld load cost)
        // Code is statically linked into the main app binary at compile time.
        .library(
            name: "CoreNetworking",
            type: .static,
            targets: ["CoreNetworking"]
        ),
        
        // 2. Dynamic Library (Use when shared between App and App Extensions like Widgets)
        // Stored once in the app bundle Frameworks/ folder; shared by both processes.
        .library(
            name: "SharedAuthSession",
            type: .dynamic,
            targets: ["SharedAuthSession"]
        )
    ],
    targets: [
        .target(name: "CoreNetworking"),
        .target(name: "SharedAuthSession")
    ]
)
```

---

## Tier 2 — Your differentiator

### `T2-01` — Rehearse the AIAnalyzer walkthrough out loud — cloud/local/hybrid modes, confidence-based fallback

- **Difficulty:** 🟣 `Advanced`
- **Tier:** `Tier 2 — Your differentiator`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"My AIAnalyzer architecture handles confidence-based fallback automatically, routing simple queries to local on-device models and only escalating to the cloud when a higher parameter model is necessary."*

#### 📖 Detailed Answer

The AIAnalyzer uses a hybrid approach. It can run heavy analysis in the cloud using models like Gemini when network is available and latency/privacy aren't critical. For local mode, it runs smaller models directly on the device (like Ollama/Qwen) ensuring privacy and offline capability. The confidence-based fallback means if the local model is unsure about a result, it can seamlessly escalate the query to the cloud model.

---

### `T2-02` — Why did you choose Gemini for cloud and Ollama/Qwen for local?

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 2 — Your differentiator`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I pair Gemini's massive context window in the cloud with highly quantized local Qwen models on-device to balance power consumption, privacy, and capability."*

#### 📖 Detailed Answer

Gemini was chosen for the cloud because of its massive context window and strong reasoning capabilities. Ollama/Qwen were chosen for local deployment because they offer excellent performance-to-size ratios, allowing them to run efficiently on Apple Silicon without destroying battery life, while still giving solid results for narrower tasks.

---

### `T2-03` — How do you validate AI-generated code before merging?

- **Difficulty:** 🟣 `Advanced`
- **Tier:** `Tier 2 — Your differentiator`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"AI writes the boilerplate, but I am the compiler — nothing gets merged without passing the test suite and a manual review for architectural intent."*

#### 📖 Detailed Answer

AI-generated code must go through the exact same rigorous pipeline as human code: it must pass all automated unit and integration tests, static analysis tools, and mandatory human code reviews to check for architectural fit and subtle edge cases the AI might have missed.

---

### `T2-04` — How building your own AI tool changed how you use Copilot/Cursor day to day

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 2 — Your differentiator`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"Building my own AI agents taught me exactly how LLMs process context, so I now use Cursor as a collaborative reasoning engine rather than just an autocomplete."*

#### 📖 Detailed Answer

Building AI tools gave me a deep understanding of how LLMs process context and system prompts. This changed how I use tools like Cursor — I now focus heavily on providing structured, rich context and constraints upfront, rather than just treating it as a smart autocomplete.

---

### `T2-05` — How do you control app size?

- **Difficulty:** 🟣 `Advanced`
- **Tier:** `Tier 2 — Your differentiator`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I inspect the App Thinning Size Report first to target the biggest assets and models—like quantizing Core ML to INT8 in my Meitei Mayek OCR app—while stripping unused code and enforcing CI size gates."*

#### 📖 Detailed Answer

First, I look at what is actually taking space. I build an App Store archive and open the App Thinning Size Report, and I use the Xcode Organizer to see the real download and install size per device. Most of the time, the biggest part is not the code. It is images, videos, fonts, and ML models. Then I fix the biggest items first.

For assets, I use the asset catalog, so the App Store sends each device only the image scale it needs. I prefer vector images or SF Symbols over big PNGs, and I use HEIC or WebP for photos. Big or rarely used content, like tutorial videos, goes to On-Demand Resources or is downloaded later from a server. For code, I remove unused code and unused libraries, keep the Release build on -Osize if speed allows, and avoid heavy third-party SDKs when a small piece of code can do the job. Too many dynamic frameworks also add size, because each one carries its own overhead. Last, I add a size check in CI, so a pull request that adds 5 MB gets noticed before it merges.

A real example from my work: In my Meitei Mayek OCR app, the Core ML model was the biggest file. I exported it with coremltools and used INT8 weight compression, which makes the model file much smaller than the Float16 version. I then checked that the text recognition was still good enough. That is the same method I would use in a big app: find the largest item, shrink it, and test that quality did not drop.

#### 💻 Swift Code Example

```swift
// 1. On-Demand Resources (ODR): Download heavy assets only when needed
let tags: Set<String> = ["tutorial_videos"]
let resourceRequest = NSBundleResourceRequest(tags: tags)

try await resourceRequest.conditionallyBeginAccessingResources()
// Assets ready in bundle; release when done:
resourceRequest.endAccessingResources()

// 2. Core ML INT8 Quantization (as used in Meitei Mayek OCR):
// coremltools.models.neural_network.quantization_utils.quantize_weights(model, nbits=8)
// Reduces ML model file size by ~50-75% with negligible accuracy loss.
```

---


---

## Tier 3 — Know the concept

### `T3-01` — Certificate pinning — what it is, why it stops MITM attacks

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I haven't implemented certificate pinning myself, but I understand it as hardcoding the expected certificate so the app rejects anything else, even a technically valid one — it protects against MITM attacks."*

#### 📖 Detailed Answer

Normally, when your app talks to a server over HTTPS, it trusts any certificate signed by a recognized authority. Certificate pinning means your app hardcodes ('pins') the exact certificate — or public key — it expects from your server, and rejects the connection if it sees anything else. It protects against man-in-the-middle attacks where someone intercepts traffic with a fraudulent-but-trusted certificate.

---

### `T3-02` — Secure Enclave vs Keychain — what each one is actually for

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"Keychain is encrypted storage for sensitive data like tokens; Secure Enclave is separate hardware that can hold keys and never exposes them, even to the OS — I haven't used either directly, though my encryption work with PJSIP is the same instinct at a different layer."*

#### 📖 Detailed Answer

Keychain is where you store small, sensitive pieces of data — passwords, tokens, keys — encrypted on disk. Secure Enclave is a separate, isolated chip on the device that handles things like Face ID/Touch ID matching and can generate/hold cryptographic keys that never leave the chip, even if the OS itself is compromised.

---

### `T3-03` — Core Data vs SQLite vs Realm — one-line difference

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"Core Data is my depth — I haven't used Realm or raw SQLite directly, though I understand Core Data is often backed by SQLite under the hood."*

#### 📖 Detailed Answer

Core Data is Apple's object graph and persistence framework (often backed by SQLite). SQLite is the raw relational database itself where you write SQL queries. Realm is a third-party object-based alternative, often praised for being simpler to set up and faster for some use cases.

---

### `T3-04` — ARC and retain cycles — a clear example of a strong reference cycle

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"A retain cycle happens when two objects hold strong references to each other, keeping their retain counts above zero; I fix this by using weak or unowned references."*

#### 📖 Detailed Answer

ARC (Automatic Reference Counting) automatically frees up memory when there are zero strong references to an object. A retain cycle happens when Object A holds a strong reference to Object B, and Object B holds a strong reference to Object A, meaning neither can ever be deallocated. You fix it by making one of the references `weak`.

#### 💻 Swift Code Example

```swift
class Parent {
    var child: Child?
    deinit { print("Parent deallocated") }
}

class Child {
    // Must be 'weak' to prevent a retain cycle!
    weak var parent: Parent?
    deinit { print("Child deallocated") }
}

var parent: Parent? = Parent()
var child: Child? = Child()
parent?.child = child
child?.parent = parent
parent = nil  // Both deallocate correctly
child = nil
```

---

### `T3-05` — Instruments tools — Leaks, Allocations, Time Profiler, Thread Sanitizer

- **Difficulty:** 🟣 `Advanced`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I use the Time Profiler to track down UI stutters on the main thread, and the Leaks instrument to verify I haven't accidentally introduced retain cycles."*

#### 📖 Detailed Answer

Leaks: Finds memory that is no longer referenced but hasn't been freed. Allocations: Tracks all memory created and destroyed, helping find memory bloat. Time Profiler: Samples the CPU to show which methods are taking the most time, helping fix lag. Thread Sanitizer: Detects data races at runtime.

---

### `T3-06` — TDD vs BDD — the actual difference

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I practice TDD — writing tests alongside implementation — but I haven't used BDD-style Given/When/Then frameworks specifically."*

#### 📖 Detailed Answer

TDD (Test-Driven Development) is a workflow — you write a failing test, write the minimum code to pass it, then refactor. BDD (Behavior-Driven Development) is more about how you phrase tests — using human-readable 'Given/When/Then' language so tests double as documentation that non-engineers can read.

---

### `T3-07` — XCTest — writing unit tests and UI tests, mocking and stubbing

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I write unit tests with protocol-based mocks injected through constructors, and UI tests for critical flows like login — everything runs in our CI pipeline on every PR."*

#### 📖 Detailed Answer

XCTest is Apple's built-in testing framework. Unit tests validate individual functions/methods in isolation. UI tests interact with the app as a user would (tapping buttons, verifying labels). Mocking means creating a fake object that records what methods were called. Stubbing means providing a predefined return value. Both require dependency injection — your code must accept protocols so you can swap in test doubles.

#### 💻 Swift Code Example

```swift
// Protocol for the dependency
protocol UserRepository {
    func fetchUser(id: String) async throws -> User
}

// Mock for testing
class MockUserRepository: UserRepository {
    var stubbedUser: User?
    var fetchCallCount = 0
    
    func fetchUser(id: String) async throws -> User {
        fetchCallCount += 1
        guard let user = stubbedUser else { throw TestError.notFound }
        return user
    }
}

// Unit test
func testFetchUserIncrementsCallCount() async throws {
    let mock = MockUserRepository()
    mock.stubbedUser = User(name: "Test")
    let vm = ProfileViewModel(repo: mock)
    
    await vm.loadUser(id: "123")
    
    XCTAssertEqual(mock.fetchCallCount, 1)
    XCTAssertEqual(vm.userName, "Test")
}
```

---

### `T3-08` — Auto Layout, Dynamic Type, and Accessibility (a11y)

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I build adaptive layouts with Auto Layout and always use preferred font styles so my UI respects Dynamic Type — it's especially important at Citi where app accessibility is a compliance requirement."*

#### 📖 Detailed Answer

Auto Layout uses constraints to position views relative to each other, so layouts adapt to any screen size. Dynamic Type lets users choose their preferred text size in Settings — your app should respect this using preferred font styles (UIFont.preferredFont). Accessibility (a11y) means making your app usable by everyone — adding accessibilityLabels, accessibilityHints, ensuring VoiceOver reads elements in the right order, and supporting sufficient color contrast.

#### 💻 Swift Code Example

```swift
// Dynamic Type in UIKit
label.font = UIFont.preferredFont(forTextStyle: .body)
label.adjustsFontForContentSizeCategory = true

// Accessibility
button.accessibilityLabel = "Transfer funds"
button.accessibilityHint = "Double-tap to open the transfer screen"

// SwiftUI equivalent
Text("Account Balance")
    .font(.body)  // Automatically scales with Dynamic Type
    .accessibilityLabel("Your current account balance")
```

---

### `T3-09` — Decomposing complex screens into reusable, composable UI components

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I break screens into small, reusable components — like a TransactionRow or AccountCard — that form an internal design system, ensuring consistency and parallel development."*

#### 📖 Detailed Answer

Instead of building a 500-line monolithic View, you break it into small, focused, reusable components — each with a single responsibility. A TransactionRow, an AccountCard, a BalanceHeader. These become your internal design system. Benefits: 1) Consistency across the app, 2) Easier to test individually, 3) Multiple developers can work on different components without conflicts, 4) Changes to a component automatically propagate everywhere it's used.

#### 💻 Swift Code Example

```swift
// Reusable component
struct TransactionRow: View {
    let transaction: Transaction
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(transaction.merchant)
                    .font(.headline)
                Text(transaction.date, style: .date)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(transaction.amount, format: .currency(code: "USD"))
                .foregroundColor(transaction.amount < 0 ? .red : .green)
        }
    }
}

// Used in multiple screens
struct AccountDetailView: View {
    let transactions: [Transaction]
    var body: some View {
        List(transactions) { txn in
            TransactionRow(transaction: txn)
        }
    }
}
```

---

### `T3-10` — CI/CD pipelines for iOS — what goes into one

- **Difficulty:** 🟣 `Advanced`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I've worked with CI/CD pipelines that lint, build, test, and deploy on every PR — using Fastlane for automation and Jenkins or GitHub Actions as the runner."*

#### 📖 Detailed Answer

A typical iOS CI/CD pipeline: 1) Trigger on PR/push. 2) Run SwiftLint for code style. 3) Build the project (xcodebuild). 4) Run unit tests and UI tests. 5) Generate code coverage reports. 6) Run static analysis (e.g., SonarQube). 7) Archive and sign the IPA. 8) Upload to TestFlight or an internal distribution tool. Common tools: Fastlane for automation, Jenkins/GitHub Actions/Bitrise as the CI server, and Xcode Cloud for Apple-native CI.

---

### `T3-11` — Swift Package Manager (SPM) and modularization strategies

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I use SPM to modularize large codebases into focused packages — Networking, DesignSystem, CoreModels — which speeds up builds and enforces clean boundaries between teams."*

#### 📖 Detailed Answer

SPM is Apple's built-in dependency manager and module builder. For enterprise apps, you split the codebase into separate Swift packages — a Networking package, a DesignSystem package, a CoreModels package, etc. Each package has its own tests and can be versioned independently. Benefits: faster build times (only recompile changed modules), clearer ownership boundaries, and the ability to share packages across multiple apps.

#### 💻 Swift Code Example

```swift
// Package.swift for a shared Networking module
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Networking",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "Networking", targets: ["Networking"]),
    ],
    targets: [
        .target(name: "Networking"),
        .testTarget(name: "NetworkingTests", dependencies: ["Networking"]),
    ]
)
```

---

### `T3-12` — REST and GraphQL API integration — contract-driven development

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I've integrated both REST and GraphQL APIs — I prefer contract-driven development where we agree on the schema upfront so frontend and backend can develop in parallel."*

#### 📖 Detailed Answer

REST uses fixed endpoints (GET /users/123) returning full resource representations. GraphQL uses a single endpoint where the client specifies exactly what data it needs, reducing over-fetching. Contract-driven development means the API schema is defined upfront (e.g., OpenAPI spec for REST, GraphQL schema), and both frontend and backend teams build against this contract independently. This prevents integration surprises.

#### 💻 Swift Code Example

```swift
// REST with Codable
struct User: Codable {
    let id: String
    let name: String
    let email: String
}

func fetchUser() async throws -> User {
    let url = URL(string: "https://api.example.com/users/123")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}
```

---

### `T3-13` — Feature flagging, A/B testing, and remote configuration

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"Feature flags are essential in enterprise banking apps — they let us do phased rollouts and instantly kill a feature if something goes wrong, without pushing an app update."*

#### 📖 Detailed Answer

Feature flags let you enable/disable features without an app update — crucial in enterprise apps where you might need to kill a feature instantly. A/B testing shows different variants to different user groups to measure impact. Remote configuration stores settings on a server (e.g., Firebase Remote Config) so you can change app behavior without a release. In banking, feature flags are also used for phased rollouts to manage risk.

#### 💻 Swift Code Example

```swift
// Simple feature flag check
struct FeatureFlags {
    static let isNewTransferFlowEnabled: Bool = {
        RemoteConfig.shared.bool(forKey: "new_transfer_flow")
    }()
}

// Usage
if FeatureFlags.isNewTransferFlowEnabled {
    showNewTransferFlow()
} else {
    showLegacyTransferFlow()
}
```

---

### `T3-14` — Secure data handling in financial apps — tokenization, biometric auth, session management

- **Difficulty:** 🔵 `Intermediate`
- **Tier:** `Tier 3 — Know the concept`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I understand tokenization as keeping sensitive data server-side, biometric auth via LocalAuthentication for high-security actions, and short-lived JWT sessions with automatic refresh."*

#### 📖 Detailed Answer

Tokenization replaces sensitive data (like a card number) with a non-sensitive token — the real data lives on the server only. Biometric authentication uses Face ID/Touch ID via the LocalAuthentication framework to verify the user's identity before sensitive operations. Session management means handling auth tokens (usually JWTs), refreshing them before they expire, and invalidating them on logout. In banking apps, sessions often have very short timeouts for security.

#### 💻 Swift Code Example

```swift
import LocalAuthentication

func authenticateWithBiometrics() async -> Bool {
    let context = LAContext()
    var error: NSError?
    
    guard context.canEvaluatePolicy(
        .deviceOwnerAuthenticationWithBiometrics,
        error: &error
    ) else {
        return false
    }
    
    do {
        return try await context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: "Authenticate to view account details"
        )
    } catch {
        return false
    }
}
```

---


---

## Tier 4 — Just enough to not go blank

### `T4-01` — PCI-DSS — what it protects and who it applies to

- **Difficulty:** 🟢 `Beginner`
- **Tier:** `Tier 4 — Just enough to not go blank`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I don't have direct compliance experience with PCI-DSS, but I understand it mandates strict controls over credit card data handling, and I'd expect to ramp into Citi's specific requirements quickly."*

#### 📖 Detailed Answer

PCI-DSS is a security standard for any company that handles credit card data; dictates how card numbers must be stored, transmitted, and protected.

---

### `T4-02` — SOX (Sarbanes-Oxley) — what it's for

- **Difficulty:** 🟢 `Beginner`
- **Tier:** `Tier 4 — Just enough to not go blank`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I don't have direct compliance experience with SOX, but I understand it requires strict audit trails and access controls on financial systems."*

#### 📖 Detailed Answer

SOX is a US law requiring public companies to have strong internal controls over financial reporting, to prevent accounting fraud; for engineers, this often means audit trails and access controls on financial systems.

---

### `T4-03` — GDPR — what it protects and where it applies

- **Difficulty:** 🟢 `Beginner`
- **Tier:** `Tier 4 — Just enough to not go blank`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I don't have direct compliance experience with GDPR, but I understand it gives users right-to-delete and mandates strict data storage practices, and I'd expect to ramp into Citi's specific requirements quickly."*

#### 📖 Detailed Answer

GDPR is an EU law giving individuals control over their personal data — right to access, correct, and delete it; affects how apps collect, store, and process user data for anyone in the EU.

---
