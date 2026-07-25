import Foundation

// MARK: - 💀 Deadlocks
//
// 💡 INTERVIEW TALKING POINTS:
// • What is a Deadlock? When two or more threads are permanently blocked, each waiting for a lock (or queue) held by the other. 
// • 4 Coffman Conditions: (1) Mutual Exclusion, (2) Hold and Wait, (3) No Preemption, (4) Circular Wait. If you break ANY of these four, a deadlock cannot occur.
// • Debugging: When the app UI freezes, hit the Pause (⏸) button in Xcode. Check the Thread Navigator. If Thread 1 is blocked on Thread 4, and Thread 4 is blocked on Thread 1, you have a deadlock.

class DeadlockDemonstrator {
    
    // ==========================================
    // ❌ BUGGY 1: The Classic iOS Self-Deadlock
    // ==========================================
    func buggyMainQueueSync() {
        // If this function is called from the Main Thread, the app instantly freezes forever.
        // WHY: The main thread STOPS to wait for the block to execute.
        // But the block can't execute because the main thread is STOPPED! (Circular Wait)
        DispatchQueue.main.sync {
            print("This will never print if called from main thread.")
        }
    }
    
    // ==========================================
    // ✅ FIXED 1: Async Dispatch
    // ==========================================
    func fixedMainQueueAsync() {
        // 🛡️ The Fix: Use `.async`. The main thread continues, and the block executes on the next run loop cycle.
        DispatchQueue.main.async {
            print("This is safe!")
        }
    }
    
    
    // ==========================================
    // ❌ BUGGY 2: Lock Ordering Deadlock
    // ==========================================
    let lockA = NSLock()
    let lockB = NSLock()
    
    func buggyLockOrdering() {
        DispatchQueue.global().async {
            self.lockA.lock()
            sleep(1) // Simulate work, giving the other thread time to acquire lockB
            self.lockB.lock() // Waiting for lockB...
            
            print("Thread 1 finished")
            self.lockB.unlock()
            self.lockA.unlock()
        }
        
        DispatchQueue.global().async {
            self.lockB.lock()
            sleep(1) // Simulate work
            self.lockA.lock() // Waiting for lockA... (DEADLOCK!)
            
            print("Thread 2 finished")
            self.lockA.unlock()
            self.lockB.unlock()
        }
    }
    
    // ==========================================
    // ✅ FIXED 2: Consistent Lock Acquisition
    // ==========================================
    func fixedLockOrdering() {
        // 🛡️ The Fix: Always acquire locks in the EXACT SAME ORDER across all threads.
        DispatchQueue.global().async {
            self.lockA.lock()
            self.lockB.lock()
            
            print("Thread 1 finished")
            self.lockB.unlock()
            self.lockA.unlock()
        }
        
        DispatchQueue.global().async {
            self.lockA.lock() // Thread 2 safely waits for lockA, never acquiring lockB out of order.
            self.lockB.lock() 
            
            print("Thread 2 finished")
            self.lockB.unlock()
            self.lockA.unlock()
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why does `DispatchQueue.main.sync` crash the app?
//   A: Because queues are serial. If you are ALREADY on the main queue, asking the queue to block and wait for a new task to finish creates an unresolvable circular dependency.
// • Q: How do you prevent lock-ordering deadlocks in large codebases?
//   A: Establish a strict hierarchy. If Lock A protects the DB and Lock B protects the Network, dictate that threads must ALWAYS acquire the DB lock before the Network lock, never vice versa.
// • Q: Will the compiler warn me about a deadlock?
//   A: No. Deadlocks are runtime issues. However, modern Swift Actors avoid many locking deadlocks because the compiler enforces state isolation natively (though Actor Reentrancy issues can still occur).
