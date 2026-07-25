# 🐍 VIPER Architecture — Interview Cheat Sheet

## 1. What is VIPER?
**VIPER** is an architectural pattern for iOS applications that strictly enforces the **Single Responsibility Principle (SRP)** by breaking a feature/screen into 5 separate components.

It is an implementation of Clean Architecture tailored for iOS development.

---

## 2. The 5 VIPER Components

| Component | Responsibility | Does It Have UI Code? |
| :--- | :--- | :---: |
| **V - View** | Displays the UI and sends user touches/events to the Presenter. | **Yes** (SwiftUI / UIKit) |
| **I - Interactor** | Contains **Pure Business Logic** (API calls, Database queries, Data validation). | **No** |
| **P - Presenter** | The central brain. Takes raw data from Interactor, formats it for display, tells View to update, and tells Router to navigate. | **No** |
| **E - Entity** | Plain data models/structs used by the Interactor. | **No** |
| **R - Router** | Handles **Navigation** between screens and **Module Assembly** (Dependency Injection). | **No** |

---

## 3. Communication & Data Flow

```
   ┌──────────┐  1. User Taps Button   ┌───────────┐  2. Request Data   ┌────────────┐
   │   VIEW   │ ─────────────────────► │ PRESENTER │ ─────────────────► │ INTERACTOR │
   │ (SwiftUI)│ ◄───────────────────── │  (Brain)  │ ◄───────────────── │ (Business) │
   └──────────┘  4. Render State       └─────┬─────┘  3. Return Entity  └────────────┘
                                             │
                                             │ 5. Navigate
                                             ▼
                                       ┌───────────┐
                                       │  ROUTER   │
                                       └───────────┘
```

---

## 4. Retain Cycle Prevention (Memory Management)

In VIPER, components refer to each other. To avoid **Retain Cycles (Memory Leaks)**, use the following rules:

- **View → Presenter**: Strong reference (`@StateObject` / `@ObservedObject` in SwiftUI).
- **Presenter → Interactor**: Strong reference.
- **Interactor → Presenter**: ⚠️ **`weak var`** delegate reference!
- **Presenter → Router**: Strong reference.
- **Router → Presenter**: ⚠️ **`weak var`** reference!

---

## 5. Common Interview Q&A

### Q1: Why use VIPER over MVVM?
> **Answer:** MVVM can still suffer from "Massive ViewModels" because ViewModels handle data fetching, presentation formatting, and navigation state. VIPER splits these duties into Interactor (data fetching), Presenter (formatting), and Router (navigation).

### Q2: How do you unit test a VIPER module?
> **Answer:** Because all 5 layers communicate through **Protocols**, every component can be tested in isolation:
> - Test **Presenter** by injecting a `MockInteractor` and `MockRouter`.
> - Test **Interactor** by inspecting data fetching output independently of UI.

### Q3: What is Module Assembly in VIPER?
> **Answer:** Module Assembly is handled inside the **Router** (e.g., `static func createModule() -> View`). It acts as a Factory that instantiates all 5 objects and wires their strong/weak references together.

### Q4: When would you NOT use VIPER?
> **Answer:** For simple screens or small applications. VIPER creates many files per feature, which introduces overhead and boilerplate if the business logic is trivial.
