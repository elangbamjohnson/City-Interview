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
