# 🔄 SwiftUI State Management — Interview Cheat Sheet

SwiftUI is a declarative framework. The UI is a function of its state. When the state changes, SwiftUI automatically re-renders the affected views. Understanding which property wrapper to use is a guaranteed interview question.

---

## 1. Value Types (Structs, Strings, Ints, Bools)

### `@State`
- **What it is:** Local, private state owned by a single View.
- **When to use:** For simple value types (e.g., `String`, `Int`, `Bool`) that are only used inside that specific view (like a toggle state or a text field input).
- **Rule of thumb:** Always mark it as `private`.

### `@Binding`
- **What it is:** A two-way connection to a state owned by another (usually parent) view.
- **When to use:** When a child view needs to read AND write to a state that lives in its parent.
- **Rule of thumb:** It does not own the data, it just points to it. You pass a binding using the `$` prefix (e.g., `$parentState`).

---

## 2. Reference Types (Classes conforming to `ObservableObject`)

### `@StateObject` (Introduced in iOS 14)
- **What it is:** Used to **create** and **own** an instance of an `ObservableObject`.
- **When to use:** When the view is the one instantiating the class. 
- **Why it's important:** SwiftUI guarantees that the object is not destroyed and recreated when the view re-renders. It keeps the object alive for the lifecycle of the view.

### `@ObservedObject`
- **What it is:** Used to **observe** an `ObservableObject` that was passed in from the outside.
- **When to use:** When a child view needs to listen to changes from a class instance that was created by its parent (or a router).
- **Warning:** Do NOT use `@ObservedObject` to create the initial instance (e.g., `@ObservedObject var vm = ViewModel()`). If the view re-renders, the object will be destroyed and recreated, causing data loss. Always use `@StateObject` for creation.

### `@EnvironmentObject`
- **What it is:** A shared `ObservableObject` available anywhere in the view hierarchy.
- **When to use:** For global data (like User Settings, Authentication State, or Themes) that many deeply nested views need access to. 
- **Rule of thumb:** Prevents "Prop drilling" (passing data through 5 layers of views just so the 6th layer can use it). It must be injected high up in the tree using `.environmentObject(myObject)`. If a view expects an EnvironmentObject and it hasn't been injected, the app will crash.

---

## 3. Persistent State

### `@AppStorage`
- **What it is:** A SwiftUI property wrapper over `UserDefaults`.
- **When to use:** For lightweight, non-sensitive data (like "Dark Mode Enabled") that should persist across app launches. It automatically re-renders the view when the value in UserDefaults changes.

---

### 💡 iOS 17+ Modern Update (`@Observable` macro)
In iOS 17, Apple introduced the `@Observable` macro, which simplifies state management.
- You no longer need `@Published` on properties.
- `@StateObject` and `@ObservedObject` are replaced entirely by just using `@State` and `@Bindable`.
*(Be ready to mention this in an interview to show you are up-to-date with modern SwiftUI, even if they ask about the older Property Wrappers!)*
