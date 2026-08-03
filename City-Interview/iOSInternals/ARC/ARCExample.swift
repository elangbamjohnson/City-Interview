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
//
// ==========================================
// 🔁 Retain Cycles / Memory Leaks — Quick Notes
// ==========================================
//
// 📌 What a Retain Cycle is:
// • Happens when two (or more) objects hold strong references to each other.
// • Each one keeps the other's count above zero forever → neither ever gets deallocated → memory leak.
// • Simple picture: Object A strongly holds B, B strongly holds A → both stuck alive even if nothing else in the app references them.
//
// ⚡ Classic Case #1: Closures capturing self
// • Closures capture variables they use — by default, they capture self strongly.
// • If a class stores a closure as a property, and that closure captures self, you get: object → holds closure (strong) → closure holds self (strong) → cycle.
// • Very common in completion handlers, network callbacks stored as properties.
//
// ⚡ Classic Case #2: Delegate pattern
// • If a delegate property is declared strong (or just default, without weak), and the delegate holds a reference back to the object — cycle.
// • This is why the convention is always `weak var delegate: SomeDelegate?` — breaks the cycle, since the delegate doesn't "own" the object it's delegating for.
//
// ⚡ Classic Case #3: Parent-child view controller / object relationships
// • E.g., a parent VC holds a strong reference to a child, and the child holds a strong parent reference back — cycle.
// • Same fix — one side of the relationship (usually the "child pointing back to parent") should be weak or unowned.
//
// 🔍 How to spot them (interview-relevant):
// • Xcode Memory Graph Debugger — shows purple exclamation marks on retained objects with cycles.
// • Instruments → Leaks tool — profiles the running app and flags leaked memory.
// • Practical check: does `deinit` ever get called on that object? If you expect an object to be deallocated (e.g., after popping a view controller) and `deinit` never prints/logs, that's your sign of a leak.
//
// 💬 One-liner to remember for interview:
// "A retain cycle happens when two objects strongly reference each other, so neither's count ever reaches zero — closures capturing self and delegate properties without weak are the two most common causes."

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
