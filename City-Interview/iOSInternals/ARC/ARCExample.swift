import Foundation

// MARK: - 🧠 ARC (Automatic Reference Counting) Internals
//
// 💡 INTERVIEW TALKING POINTS:
// • ARC keeps a count of strong references to each object, and deallocates it the moment that count hits zero — it's compile-time inserted, deterministic, and only applies to reference types, not value types.
// • ARC is a compile-time feature, not a runtime garbage collector.
//   The Swift compiler automatically inserts `retain` and `release` calls.
// • When retain count > 0, the object stays in memory.
// • When retain count == 0, ARC deallocates the object and `deinit` is called.
//
// 🔗 Strong vs Weak vs Unowned:
// • strong (default): Increases retain count by 1. Keeps object alive.
// • weak: Does NOT increase retain count. Must be a `var` and `Optional`. Becomes `nil` automatically when object dies.
// • unowned: Does NOT increase retain count. Assumes object will never be `nil` when accessed (crashes if it is). Use when lifecycles are identical.

// ==========================================
// ❌ Retain Cycle (Memory Leak) Example
// ==========================================
class Employee {
    let name: String
    var company: Company? // Strong reference
    
    init(name: String) { self.name = name }
    deinit { print("\(name) deinitialized") } // Will NOT be called in the bad example
}

class Company {
    let name: String
    var employee: Employee? // Strong reference
    
    init(name: String) { self.name = name }
    deinit { print("\(name) deinitialized") } // Will NOT be called in the bad example
}

func demonstrateMemoryLeak() {
    var john: Employee? = Employee(name: "John")
    var apple: Company? = Company(name: "Apple")
    
    john?.company = apple
    apple?.employee = john
    
    // Setting to nil removes OUR references, but they still hold strong references to EACH OTHER.
    // Retain count remains 1 for both. Memory leak!
    john = nil
    apple = nil
}


// ==========================================
// ✅ Fixed Retain Cycle (Using weak)
// ==========================================
class SafeEmployee {
    let name: String
    var company: SafeCompany? // Strong reference
    
    init(name: String) { self.name = name }
    deinit { print("\(name) deinitialized safely") }
}

class SafeCompany {
    let name: String
    // 🛡️ The Fix: weak breaks the cycle. Retain count does not increase.
    weak var employee: SafeEmployee?
    
    init(name: String) { self.name = name }
    deinit { print("\(name) deinitialized safely") }
}

func demonstrateSafeMemory() {
    var jane: SafeEmployee? = SafeEmployee(name: "Jane")
    var google: SafeCompany? = SafeCompany(name: "Google")
    
    jane?.company = google
    google?.employee = jane
    
    // Retain counts drop to 0 correctly. Both deinits are called.
    jane = nil
    google = nil
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How does ARC differ from Garbage Collection?
//   A: ARC happens at compile-time (inserts retain/release), GC runs periodically at runtime to clean up memory.
// • Q: What is the main difference between weak and unowned?
//   A: `weak` is optional and becomes nil safely. `unowned` is non-optional and crashes if accessed after deallocation.
// • Q: How do closures cause retain cycles?
//   A: Closures capture variables strongly by default. If a class owns a closure, and the closure captures `self`, a cycle forms. Fix using `[weak self]`.
