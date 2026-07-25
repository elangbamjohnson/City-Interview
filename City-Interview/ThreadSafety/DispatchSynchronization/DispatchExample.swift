import Foundation

// MARK: - 🚦 Dispatch Synchronization (GCD)
//
// 💡 INTERVIEW TALKING POINTS:
// • Serial Queue as a Lock: A serial GCD queue guarantees tasks execute one by one. Calling `.sync` on it effectively acts as a lock, but it's higher-level and often safer than raw Mutexes.
// • The Reader-Writer Problem: You want multiple threads to READ data simultaneously (fast), but WRITES must be exclusive (mutually exclusive).
// • Concurrent Queue + `.barrier`: The perfect solution for Reader-Writer. Reads are concurrent. When a `.barrier` write is dispatched, the queue waits for all reads to finish, executes the write ALONE, then resumes concurrent reads.

// ==========================================
// Example 1: Serial Queue (Simple Implicit Lock)
// ==========================================
class SerialQueueCounter {
    private var _count: Int = 0
    private let serialQueue = DispatchQueue(label: "com.cityinterview.serialLock")
    
    var count: Int {
        // Read synchronously
        serialQueue.sync { return _count }
    }
    
    func increment() {
        // Write synchronously
        serialQueue.sync { _count += 1 }
    }
}

// ==========================================
// Example 2: Reader-Writer Pattern (Concurrent + Barrier)
// ==========================================
class ThreadSafeCache {
    private var storage: [String: String] = [:]
    
    // 1. MUST be a concurrent queue!
    private let concurrentQueue = DispatchQueue(label: "com.cityinterview.cacheQueue", attributes: .concurrent)
    
    // 2. READS: Concurrent (Multiple threads can read at once)
    func get(key: String) -> String? {
        concurrentQueue.sync {
            return storage[key]
        }
    }
    
    // 3. WRITES: Barrier (Blocks everything else until the write finishes)
    func set(value: String, forKey key: String) {
        // We use `.async` so the caller doesn't wait, but the queue treats it as a barrier internally!
        concurrentQueue.async(flags: .barrier) {
            self.storage[key] = value
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why use GCD `.sync` instead of `NSLock`?
//   A: GCD queues are higher-level, heavily optimized by the OS, and it's much harder to accidentally cause a deadlock (since closures naturally scope the "critical section").
// • Q: Why use a `.barrier` on a concurrent queue?
//   A: It creates an extremely efficient "Reader-Writer Lock". Multiple threads can read simultaneously, but writes are guaranteed to be isolated.
// • Q: What happens if you call `.sync` on the Main Queue from the Main Thread?
//   A: Immediate Deadlock. The main thread stops to wait for the block to execute, but the block can't execute because the main thread is stopped.
