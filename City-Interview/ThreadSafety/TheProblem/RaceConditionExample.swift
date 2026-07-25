import Foundation

// MARK: - ⚠️ The Problem: Data Races & Race Conditions
//
// 💡 INTERVIEW TALKING POINTS:
// • What is a Data Race? Occurs when two or more threads access the same memory location concurrently, and at least one access is a write.
// • Undefined Behavior: A data race isn't just "sometimes the number is wrong." It is strictly undefined behavior at the compiler/hardware level. It can corrupt memory entirely or cause fatal crashes (EXC_BAD_ACCESS).
// • Non-deterministic: The hardest bugs to fix! They might happen 1 out of 100 times depending on exact CPU scheduling microsecond timing, making them near impossible to reproduce consistently.

class UnsafeCounter {
    var count: Int = 0
    
    func increment() {
        // Read, Modify, Write — NOT atomic!
        // Thread A reads 0, Thread B reads 0. Both write 1. We lost an increment!
        count += 1
    }
}

class RaceConditionDemonstrator {
    
    func demonstrateRaceCondition() {
        let counter = UnsafeCounter()
        let group = DispatchGroup()
        
        // Fire 1,000 concurrent threads trying to increment the counter
        for _ in 0..<1000 {
            DispatchQueue.global().async(group: group) {
                counter.increment()
            }
        }
        
        group.notify(queue: .main) {
            // Expected: 1000. Actual output: Randomly 984, 991, 1000, etc.
            print("Final Unsafe Count: \(counter.count)") 
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: What is the difference between a Data Race and a Race Condition?
//   A: A data race is a low-level memory access conflict (concurrent read/write). A race condition is a higher-level logic flaw where timing affects the program's output (e.g. downloading data finishes before the DB is ready).
// • Q: How does the Thread Sanitizer (TSan) help?
//   A: It is an Xcode tool that instruments your code at compile time to detect data races at runtime, warning you immediately if two threads touch memory unsafely.
// • Q: Why does `count += 1` fail? It's just one line of code!
//   A: At the CPU level, it is three instructions: Load memory to register -> Add 1 to register -> Store register back to memory. Threads can interrupt exactly between those steps.
