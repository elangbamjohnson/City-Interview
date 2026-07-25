# 🤝 SwiftUI & UIKit Interoperability — Interview Cheat Sheet

In large production apps, teams often mix UIKit and SwiftUI. Knowing how to bridge them is a highly requested skill in senior iOS interviews.

---

## 1. Using UIKit inside SwiftUI 🍎 ➡️ 🟢

When you have a legacy UIKit View or Controller and want to use it in a modern SwiftUI View, you use **Representable** protocols.

### `UIViewRepresentable` (For Views)
- **What it is:** A wrapper protocol that allows you to embed a `UIView` (like `UITextView` or `MKMapView`) inside SwiftUI.
- **Key Methods:**
  1. `makeUIView(context:)`: Called exactly ONCE. This is where you instantiate and return the UIKit view.
  2. `updateUIView(_:context:)`: Called whenever SwiftUI's state changes. You update the UIKit view's properties here.

### `UIViewControllerRepresentable` (For Controllers)
- **What it is:** Same concept, but for full `UIViewController`s (like `UIImagePickerController` or `SFSafariViewController`).
- **Key Methods:** `makeUIViewController` and `updateUIViewController`.

### 🚨 The `Coordinator` (Interview Hot Topic!)
**"How do you handle UIKit Delegates in SwiftUI?"**
- **Answer:** SwiftUI is declarative and uses value types (structs), but UIKit delegates require reference types (classes). To bridge this, you use a `Coordinator`. 
- The `Coordinator` is a class that conforms to the required UIKit delegate protocols (e.g., `UITextFieldDelegate`). You instantiate it in the `makeCoordinator()` method, and it communicates back to SwiftUI (usually via `@Binding`).

---

## 2. Using SwiftUI inside UIKit 🟢 ➡️ 🍎

When you are working in an older UIKit app and want to build a new screen using SwiftUI.

### `UIHostingController`
- **What it is:** A specialized `UIViewController` provided by Apple that "hosts" a SwiftUI View.
- **How to use it:** 
  1. Initialize it: `let hostingVC = UIHostingController(rootView: MySwiftUIView())`
  2. Treat it like any other `UIViewController`. You can push it onto a `UINavigationController`, present it modally, or add it as a child view controller.

---

## 3. Common Interview Q&A

### Q1: When is `makeUIView` called vs `updateUIView`?
> **Answer:** `makeUIView` is called only once when the view is first created by the SwiftUI engine. `updateUIView` is called immediately after, AND every single time the state (like an `@State` or `@Binding` property) associated with that view changes.

### Q2: Why does `UIViewRepresentable` need a `Coordinator` class instead of just making the struct the delegate?
> **Answer:** SwiftUI Views are ephemeral structs; they are constantly destroyed and recreated. UIKit delegates are usually `weak` references. If a struct was the delegate, it would be destroyed almost immediately, breaking the delegate pattern. A `Coordinator` is a persistent reference type (class) managed by SwiftUI explicitly for this purpose.

### Q3: How do you pass data from a SwiftUI view back into the UIKit app?
> **Answer:** You can pass closures, or if you are using an MVVM pattern, you can share an `ObservableObject` (or just an observable class) between the `UIHostingController` and the parent UIKit controller.
