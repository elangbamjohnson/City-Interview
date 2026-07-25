import Foundation

// MARK: - 🎭 Actor Isolation (Swift 5.5+)
//
// 💡 INTERVIEW TALKING POINTS:
// • What is an Actor? A Swift reference type (like a class) that provides COMPILER-ENFORCED thread safety. 
// • How it works: Actors isolate their mutable state. They internally serialize all access to their properties. Only one task can execute inside an actor at a time.
// • The Catch (`await`): Because access is serialized, calling a method on an actor from the outside might have to pause if the actor is busy. Therefore, all outside interactions MUST be marked with `await`.
// • Modern Standard: This completely eliminates the need for `NSLock`, `DispatchQueue.sync`, or custom Atomicity wrappers in modern Swift.

// ==========================================
// The Modern Thread-Safe Counter (Actor)
// ==========================================

actor SafeActorCounter {
    // This state is isolated! The compiler completely prevents
    // outside threads from mutating it directly.
    var count: Int = 0
    
    // Internal mutations do not require `await` because they are already inside the isolated context!
    func increment() {
        count += 1
    }
}

class ActorDemonstrator {
    
    func runActorTest() {
        let counter = SafeActorCounter()
        
        // Fire 1,000 concurrent tasks!
        for _ in 0..<1000 {
            Task {
                // ⚠️ We MUST use `await` here. If the actor is busy, 
                // this Task gracefully suspends instead of blocking a thread!
                await counter.increment()
            }
        }
        
        // Wait a bit, then print
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            Task {
                let finalCount = await counter.count
                print("Final Actor Count: \(finalCount)") // Guarantees 1000
            }
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How does an Actor differ from a Class?
//   A: Actors are reference types like classes, but they automatically isolate their state. You cannot read or write mutable properties of an actor synchronously from outside of it; you must use `await`.
// • Q: What is `@MainActor`?
//   A: It is a globally uniquely isolated actor that executes all of its code on the Main Thread. Annotating a class with `@MainActor` guarantees UI updates happen on the correct thread.
// • Q: Do Actors prevent deadlocks?
//   A: They prevent DATA RACES, but they DO NOT completely prevent deadlocks (or "Actor Reentrancy" issues). If Actor A `awaits` Actor B, and Actor B `awaits` Actor A, they can hang. Also, since actors yield the thread when `await`ing, internal state can change unexpectedly between `await` calls (Reentrancy).
