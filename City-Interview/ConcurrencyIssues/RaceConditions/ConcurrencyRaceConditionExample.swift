import Foundation

// MARK: - 🏎️ Race Conditions
//
// 💡 INTERVIEW TALKING POINTS:
// • What is it? A race condition happens when multiple threads try to read and write shared data at the exact same time without synchronization. 
// • Non-deterministic: The output depends entirely on CPU microsecond scheduling. It might work perfectly in testing and crash instantly for the user, making these the hardest bugs to trace.
// • The Solution (TSan): Xcode's Thread Sanitizer (Edit Scheme -> Diagnostics -> Thread Sanitizer) injects instrumentation to catch these at runtime. An interviewer WILL expect you to mention TSan!

class ConcurrencyRaceConditionDemonstrator {
    
    // ==========================================
    // ❌ BUGGY VERSION
    // ==========================================
    func runBuggyRaceCondition() {
        var sharedArray: [Int] = []
        let group = DispatchGroup()
        
        for i in 0..<1000 {
            DispatchQueue.global().async(group: group) {
                // Thread A might be resizing the array buffer while Thread B tries to write to it!
                // This causes EXC_BAD_ACCESS or silently drops data.
                sharedArray.append(i) 
            }
        }
        
        group.notify(queue: .main) {
            print("Buggy Array Count (likely not 1000, or crashed): \(sharedArray.count)")
        }
    }
    
    // ==========================================
    // ✅ FIXED VERSION
    // ==========================================
    func runFixedRaceCondition() {
        var sharedArray: [Int] = []
        let group = DispatchGroup()
        
        // 🛡️ The Fix: Create a serial queue to act as an implicit lock.
        let serialQueue = DispatchQueue(label: "com.cityinterview.arraySync")
        
        for i in 0..<1000 {
            DispatchQueue.global().async(group: group) {
                // Now, only ONE thread can execute the append at a time.
                serialQueue.sync {
                    sharedArray.append(i)
                }
            }
        }
        
        group.notify(queue: .main) {
            print("Fixed Array Count (exactly 1000): \(sharedArray.count)")
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How would you debug an intermittent crash that only happens on the network response?
//   A: Turn on Thread Sanitizer (TSan). It's highly likely a race condition where the background network thread is mutating an object that the main thread is trying to read for the UI.
// • Q: Why is appending to an Array not thread-safe by default?
//   A: Swift collections (Array, Dictionary) are structs (value types), but they are optimized with copy-on-write. Under the hood, multiple threads trying to reallocate the underlying memory buffer simultaneously will corrupt the memory.
// • Q: Is a serial queue always the best fix for a race condition?
//   A: For simple mutable state, yes. But for high-frequency reads, a Concurrent Queue with `.barrier` for writes (Reader-Writer pattern) is far more performant.
