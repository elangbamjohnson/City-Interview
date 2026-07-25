import Foundation
import os

// MARK: - 🔒 Locks & Mutexes
//
// 💡 INTERVIEW TALKING POINTS:
// • Mutual Exclusion (Mutex): Guarantees that only ONE thread can enter a "Critical Section" of code at a time. Other threads are forced to sleep (block) until the lock is released.
// • `os_unfair_lock`: The modern, low-level Apple replacement for `OSSpinLock`. It is incredibly lightweight and fast. It is "unfair" because it doesn't guarantee the order in which waiting threads get the lock.
// • `NSRecursiveLock`: A normal lock deadlocks if the same thread tries to acquire it twice (e.g. via a recursive function call). A recursive lock tracks the thread ID and allows the same thread to acquire it multiple times without deadlocking.

// ==========================================
// Example 1: NSLock (Object-Oriented, Easy)
// ==========================================
class NSLockCounter {
    private var count: Int = 0
    private let lock = NSLock() // High-level Foundation object
    
    func increment() {
        lock.lock()
        // CRITICAL SECTION
        count += 1
        lock.unlock()
    }
}

// ==========================================
// Example 2: os_unfair_lock (Low-level C, Blazing Fast)
// ==========================================
class UnfairLockCounter {
    private var count: Int = 0
    // Must be a pointer to a struct
    private var unfairLock = os_unfair_lock_s() 
    
    func increment() {
        os_unfair_lock_lock(&unfairLock)
        // CRITICAL SECTION
        count += 1
        os_unfair_lock_unlock(&unfairLock)
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why was `OSSpinLock` deprecated in iOS 10?
//   A: Due to "priority inversion". A low-priority thread holding the spinlock could be starved of CPU time by a high-priority thread spinning continuously waiting for the lock, freezing the app.
// • Q: What is Priority Inversion?
//   A: When a high-priority thread is blocked waiting for a lock held by a low-priority thread. `os_unfair_lock` solves this by safely resolving priority inversions internally.
// • Q: What happens if you forget to call `unlock()`?
//   A: Deadlock! The next thread that tries to call `lock()` will freeze forever. Using `defer { lock.unlock() }` right after locking is a best practice.
