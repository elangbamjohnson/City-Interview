# MVVM (Model-View-ViewModel) — Interview Talking Points

A quick reference for the standard architectural pattern for modern SwiftUI and UIKit apps.

## 1. Core Concepts
- **The ViewModel's Job:** It fetches raw data (Model), transforms it into a display-ready format (business logic), and exposes state properties that the View observes.
- **One-Way Data Flow:** Data flows DOWN (ViewModel → View). Actions flow UP (View → ViewModel).
- **View Ignorance:** The ViewModel has absolutely no idea that the View (or SwiftUI/UIKit) exists. It should never import UI frameworks.
- **Testability:** Because the ViewModel is pure business logic and doesn't rely on UI components, it is entirely unit-testable in isolation.
- **`@MainActor` Concurrency:** Since ViewModel state changes trigger UI updates, the ViewModel is usually marked with `@MainActor` to guarantee state modifications happen safely on the Main Thread.

## 2. Common Interview Questions
- **Q: What is the biggest mistake people make with MVVM?**
  - A: Putting UI logic (like `UIColor`, `UIFont`, or navigation routing) inside the ViewModel.
- **Q: How does the View communicate with the ViewModel?**
  - A: The View calls functions (actions) on the ViewModel, but never dictates *how* the ViewModel should accomplish the task.
- **Q: Why is MVVM so popular with SwiftUI?**
  - A: SwiftUI's reactive nature (`@StateObject`, `@Published`, `ObservableObject`) perfectly maps to the MVVM pattern's requirement for the View to automatically bind to ViewModel state changes.
- **Q: Does MVVM solve massive ViewControllers?**
  - A: Yes, by offloading business logic and network fetching. But if navigation isn't handled externally (like with a Coordinator), the ViewModel or View can still become bloated.

## 3. Quick Self-Check
- [ ] Can I explain the exact responsibilities of the Model, View, and ViewModel?
- [ ] Can I explain why importing `SwiftUI` or `UIKit` inside a ViewModel is an anti-pattern?
- [ ] Can I write a simple `@Published` property and explain how it triggers a View redraw?
- [ ] Can I articulate why `@MainActor` is heavily used on ViewModels?
