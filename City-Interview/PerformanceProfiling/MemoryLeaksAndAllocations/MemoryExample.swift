import Foundation

// MARK: - 🧠 Memory Leaks & Allocations
//
// 💡 INTERVIEW TALKING POINTS:
// • Leaks Instrument: Specifically hunts for "orphaned" memory — objects that have a retain count > 0, but are completely unreachable from any active pointer (e.g., a Retain Cycle).
// • Allocations Instrument: Shows ALL live memory in your app. It tracks growth over time. This is critical for finding "Logical Leaks" — memory that isn't technically a leak (because it's still stored in an array or cache), but just keeps growing forever without being evicted.
// • Generation Analysis (Mark Generation): In Allocations, you can press "Mark Generation", perform an action (open and close a screen), and press it again. If memory between the two generations didn't drop back to zero, you have a retain cycle or a caching issue!

class DataFetcher {
    var onComplete: (() -> Void)?
    
    // ==========================================
    // ❌ BUGGY: Retain Cycle in Closure
    // ==========================================
    func fetchDataBadly() {
        // The closure captures `self` strongly by default.
        // `self` (DataFetcher) also strongly holds the closure (`onComplete`).
        // Leaks Instrument will flag this instantly.
        onComplete = {
            print("Finished fetching for \(self)") 
        }
        onComplete?()
    }
    
    // ==========================================
    // ✅ FIXED: Weak Capture
    // ==========================================
    func fetchDataCorrectly() {
        // `[weak self]` breaks the strong reference cycle.
        onComplete = { [weak self] in
            guard let self = self else { return }
            print("Finished fetching for \(self)")
        }
        onComplete?()
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: What is the difference between the Leaks and Allocations instruments?
//   A: Leaks finds unreachable memory (retain cycles). Allocations tracks all active memory, which helps you find caches or arrays that are growing infinitely.
// • Q: Can a struct cause a memory leak?
//   A: No, structs are value types and do not use reference counting (ARC). Only classes (reference types) and closures can cause retain cycles.
// • Q: How do you use the Memory Graph Debugger in Xcode?
//   A: You click the 3-node icon in the debug bar while running the app. It pauses execution and visually draws the reference lines between objects, highlighting purple exclamation marks where it detects a retain cycle.
