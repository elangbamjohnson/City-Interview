# 💉 Dependency Injection (DI) — Interview Cheat Sheet

## 1. What is Dependency Injection?
**Dependency Injection (DI)** is a design pattern where an object receives its dependencies from the outside rather than creating them itself.

Instead of a class instantiating the services it needs (e.g., `let database = Database()`), the service is **injected** into the class (e.g., passed through the `init`).

---

## 2. Why use Dependency Injection? 🎯
- **Testability**: This is the #1 reason! If a class creates its own network manager, you can't test it without making real API calls. If the network manager is injected, you can inject a `MockNetworkManager` instead.
- **Decoupling**: Classes don't need to know *how* to create their dependencies, only *how to use* them.
- **Reusability**: You can pass different implementations (e.g., switching from a `StagingDatabase` to a `ProductionDatabase`) without changing the core class.

---

## 3. The 3 Types of Dependency Injection

### ① Initializer (Constructor) Injection 🏆 [Preferred]
The dependency is passed through the initializer (`init`).
- **Pros**: The dependency is guaranteed to be present when the object is created. The property can be immutable (`let`).
- **When to use**: Almost always! This is the safest and most robust form of DI.

### ② Property Injection
The dependency is assigned to a public property after the object is created.
- **Pros**: Useful when you don't have control over the initialization process (e.g., traditional UIKit Storyboards or ViewControllers).
- **Cons**: The property must be a `var` and often an optional, which means it might be `nil` at runtime, leading to crashes if not handled carefully.

### ③ Method Injection
The dependency is passed as an argument directly into the specific function that needs it.
- **Pros**: Keeps the class lightweight if the dependency is only needed for a single action, rather than for the lifetime of the object.

---

## 4. Common Interview Q&A

### Q1: Is Dependency Injection the same as Dependency Inversion?
> **Answer:** No, but they work together perfectly. **Dependency Injection (DI)** is the *technique* of passing dependencies from the outside. **Dependency Inversion Principle (DIP)** is the SOLID *design principle* stating you should depend on abstractions (Protocols), not concrete classes. When you combine them, you inject Protocols.

### Q2: What happens if you don't use Dependency Injection?
> **Answer:** You create "Tight Coupling." The class becomes strictly dependent on a specific implementation, making it rigid, hard to maintain, and virtually impossible to unit test effectively.

### Q3: What is a DI Container?
> **Answer:** In large apps, manually passing dependencies down the tree gets messy. A DI Container (or Resolver) is a centralized factory that registers and resolves dependencies automatically (e.g., using frameworks like Swinject or Factory).
