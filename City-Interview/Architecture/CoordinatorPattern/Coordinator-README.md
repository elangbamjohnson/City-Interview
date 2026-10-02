# 🧭 Coordinator Pattern — Interview Cheat Sheet

## 1. What is the Coordinator Pattern?
The **Coordinator Pattern** extracts routing and navigation logic out of Views and ViewModels. 

Instead of a View deciding *where* to go next (e.g., `NavigationLink(destination: DetailView())`), the View simply tells the Coordinator: *"A user tapped this button"*. The Coordinator then decides which screen to push onto the navigation stack.

### Why is this important? 🛑
- **Views become reusable:** A `ProfileView` shouldn't be hardcoded to navigate to `SettingsView`. If the navigation is hardcoded, you can't easily reuse `ProfileView` in a different flow.
- **Centralized Navigation:** Makes deep linking and complex onboarding flows much easier to manage.

---

## 2. Modules in this Project

This implementation is tailored for modern **SwiftUI** using `NavigationStack` and `NavigationPath`.

### 🔀 `AppCoordinator.swift`
The central navigation brain.
- Holds the `@Published var path = NavigationPath()`, which represents the current navigation stack.
- Contains methods to push new screens (e.g., `push(_ screen: Screen)`), pop screens, or return to the root.
- Injected into views as an `@EnvironmentObject` or passed down so any view can request navigation.

### 📍 `CoordinatorScreens.swift`
Defines the routing destinations.
- Usually implemented as an `enum` (e.g., `enum Screen: Hashable`).
- Lists all possible screens in the app or flow (e.g., `.home`, `.detail(id: Int)`, `.settings`).
- Works perfectly with SwiftUI's `navigationDestination(for:)` modifier.

### 📱 `CoordinatorPlaygroundView.swift`
The container and entry point.
- Sets up the `NavigationStack(path: $coordinator.path)`.
- Defines the `navigationDestination` mapping (translating the `enum` cases into actual SwiftUI Views).
- This is where the Coordinator is instantiated and attached to the view hierarchy.

---

## 3. Communication & Data Flow

```
┌──────────────┐      "User tapped item"     ┌────────────────────┐
│              ├────────────────────────────►│                    │
│     View     │                             │     Coordinator    │
│  (SwiftUI)   │◄────────────────────────────┤  (AppCoordinator)  │
│              │      Updates Navigation     │                    │
└──────────────┘           Path              └─────────┬──────────┘
                                                       │
                                                       ▼
                                             ┌────────────────────┐
                                             │                    │
                                             │  NavigationStack   │
                                             │    pushes new      │
                                             │ CoordinatorScreen  │
                                             └────────────────────┘
```

---

## 4. Common Interview Q&A

### Q1: How does the Coordinator Pattern solve the "Massive View Controller" (or Massive View) problem?
> **Answer:** In traditional iOS development, Views/ViewControllers handle UI, business logic, AND routing. By moving routing logic to a Coordinator, Views only focus on rendering the UI and reporting user interactions.

### Q2: How does the Coordinator Pattern work in modern SwiftUI?
> **Answer:** In iOS 16+, SwiftUI introduced `NavigationStack` and `NavigationPath`. A Coordinator becomes an `ObservableObject` that owns the `NavigationPath`. Views update the path via the Coordinator, and the `NavigationStack` reacts by pushing or popping views automatically.

### Q3: What is the main benefit of using an `enum` for routes (like `CoordinatorScreens`)?
> **Answer:** It provides type-safe routing. Instead of dealing with raw strings or manual View instantiation scattered throughout the app, the `enum` clearly defines all valid destinations and the exact parameters they require (e.g., `.profile(userID: String)`).

### Q4: How does this pattern help with Deep Linking?
> **Answer:** Since the Coordinator owns the navigation state (`NavigationPath`), handling a deep link is as simple as parsing the URL and appending the correct sequence of `enum` cases to the path. The app instantly jumps to the desired screen.

### Q5: What is a coordinator pattern? Is it still needed with NavigationStack?

> **🗣️ Spoken Interview Pitch (Say it like this):**
> *"The Coordinator pattern is an architectural pattern that separates navigation and flow logic from Views and ViewModels into a dedicated routing controller. 
> 
> With iOS 16's `NavigationStack`, Apple introduced native data-driven navigation via `NavigationPath`, but **yes, a coordinator pattern is still very much needed in enterprise apps**—its role has simply evolved from manipulating UIKit view hierarchies to orchestrating application flow, dependency injection, and presentation state.
> 
> While `NavigationStack` solves how the UI pushes and pops views based on a path, it does not solve who decides business navigation rules, who injects dependencies into destination screens, who coordinates modal sheets/covers, or how deep links route across independent modules without tight coupling. In a modern SwiftUI architecture, the Coordinator owns the `NavigationPath` and sheet state, keeping Views completely agnostic of the app's overall flow."*

#### 🧠 In-Depth Interview Breakdown:

#### 1. Why `NavigationStack` Alone Isn't Enough for Large Apps:
| Requirement | `NavigationStack` Alone | `NavigationStack` + Coordinator |
| :--- | :--- | :--- |
| **Push/Pop Stack** | Native `NavigationPath` handles it ✅ | Coordinator owns and mutates `NavigationPath` ✅ |
| **Dependency Injection** | Views must instantiate destination Views & ViewModels ❌ | Coordinator builds destination views and injects mocks/services ✅ |
| **Cross-Module Navigation** | View in Feature A must import View in Feature B ❌ | Views emit actions; Coordinator routes across module boundaries ✅ |
| **Modal Sheets & Full-Screen Covers** | Scattered across individual `.sheet` modifiers in Views ❌ | Coordinator centralizes sheets, covers, and alerts alongside stack navigation ✅ |
| **Complex Branching / Business Logic** | If/else branching pollutes Views or ViewModels ❌ | Coordinator evaluates business rules (e.g., KYC status, session expiry) ✅ |
| **Deep Linking & Push Notifications** | Fragile parsing and manual state passing across views ❌ | Coordinator parses URL and sets the exact navigation path in one place ✅ |

#### 2. How the Coordinator Pattern Looks in Modern SwiftUI:
In modern SwiftUI, the Coordinator is an `ObservableObject` (or `@Observable` in iOS 17+) that acts as the single source of truth for:
1. The `NavigationPath` (for push/pop stack navigation).
2. The `@Published var sheetDestination: Sheet?` (for modal presentations).
3. The `@Published var fullScreenCoverDestination: Cover?` (for full-screen flows).

```swift
// Modern SwiftUI Coordinator Pattern
enum AppScreen: Hashable {
    case transferInput(accountID: String)
    case transferReview(amount: Double)
    case transferReceipt
}

enum AppSheet: Identifiable {
    case termsAndConditions
    case helpCenter
    var id: String { String(describing: self) }
}

@MainActor
final class TransferCoordinator: ObservableObject {
    @Published var path = NavigationPath()
    @Published var activeSheet: AppSheet?
    
    // Dependencies injected at initialization
    private let paymentService: PaymentServiceProtocol
    
    init(paymentService: PaymentServiceProtocol) {
        self.paymentService = paymentService
    }
    
    // MARK: - Navigation Actions (Views call these methods)
    func showReview(amount: Double) {
        path.append(AppScreen.transferReview(amount: amount))
    }
    
    func showReceipt() {
        path.append(AppScreen.transferReceipt)
    }
    
    func popToRoot() {
        path.removeLast(path.count)
    }
    
    func presentTerms() {
        activeSheet = .termsAndConditions
    }
    
    // MARK: - View Builder (Centralized Dependency Injection)
    @ViewBuilder
    func build(screen: AppScreen) -> some View {
        switch screen {
        case .transferInput(let accountID):
            let viewModel = TransferInputViewModel(accountID: accountID, service: paymentService)
            TransferInputView(viewModel: viewModel)
        case .transferReview(let amount):
            TransferReviewView(amount: amount)
        case .transferReceipt:
            TransferReceiptView()
        }
    }
}
```

#### 3. Key Interview Talking Points to Highlight:
- **Single Responsibility Principle (SRP)**: Views render pixels and handle gestures; ViewModels prepare presentation state; Coordinators own the user's journey.
- **Decoupled Modules**: In a multi-module enterprise app (like Citi), a feature module exposes its Coordinator/Router protocol, not its internal SwiftUI views.
- **Coordinators Evolved, Not Died**: In UIKit, coordinators imperatively manipulated `UINavigationController` (`pushViewController`). In SwiftUI, coordinators declaratively own the navigation state (`NavigationPath` and sheet enums) that drives the UI.
