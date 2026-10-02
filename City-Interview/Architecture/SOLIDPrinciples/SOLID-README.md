# 🧱 SOLID Principles — Interview Cheat Sheet

The **SOLID** principles are five design guidelines intended to make software designs more understandable, flexible, and maintainable. They are frequently asked in senior iOS interviews.

---

## 1. [S] Single Responsibility Principle (SRP)
> **Definition:** A class should have one, and only one, reason to change. It should have a single responsibility.
- **Why it matters:** If a class handles networking, parsing, and UI updates, changing the UI might accidentally break the networking code. SRP keeps classes small, focused, and easy to test.
- **Example in iOS:** A `UIViewController` or SwiftUI `View` should only handle UI rendering and user interactions, not parsing JSON or directly making network calls.

## 2. [O] Open/Closed Principle (OCP)
> **Definition:** Software entities (classes, modules, functions) should be **open for extension**, but **closed for modification**.
- **Why it matters:** You should be able to add new functionality without rewriting or risking bugs in existing, tested code.
- **Example in iOS:** Using `Protocols` and `Extensions`. If you have a `PaymentProcessor`, you shouldn't modify it to support Apple Pay. Instead, create a `PaymentMethod` protocol, and add `ApplePay` as a new struct conforming to it.

## 3. [L] Liskov Substitution Principle (LSP)
> **Definition:** Objects of a superclass shall be replaceable with objects of its subclasses without breaking the application.
- **Why it matters:** If you use inheritance, a subclass must behave in a way that doesn't surprise the caller. It shouldn't crash or throw unexpected errors for methods it inherited.
- **Example in iOS:** If you have a `Bird` class with a `fly()` method, creating an `Ostrich` subclass that crashes when `fly()` is called violates LSP. Instead, use protocols like `Flyable` and `Walkable`.

## 4. [I] Interface Segregation Principle (ISP)
> **Definition:** No client should be forced to depend on methods it does not use.
- **Why it matters:** Fat, "do-everything" interfaces force classes to implement methods they don't need, leading to empty or crashing implementations.
- **Example in iOS:** Instead of a massive `Worker` protocol with `eat()`, `sleep()`, and `work()`, split it into `Eatable`, `Sleepable`, and `Workable`. A `Robot` class can then just conform to `Workable`.

## 5. [D] Dependency Inversion Principle (DIP)
> **Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions (e.g., interfaces/protocols).
- **Why it matters:** Hardcoding dependencies creates tight coupling. By depending on protocols, you can easily swap implementations (like swapping a real API with a Mock API for unit testing).
- **Example in iOS:** A `ViewModel` should not directly instantiate `URLSessionNetworkManager`. Instead, it should require a `NetworkFetching` protocol.

---

### Interview Tip 💡
When explaining these in an interview, **always** provide a quick iOS-specific example (like the ones above) to prove you understand how to apply them practically, not just theoretically!
