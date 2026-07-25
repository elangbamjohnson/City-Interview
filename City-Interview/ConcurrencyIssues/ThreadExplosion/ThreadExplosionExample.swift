import Foundation

// MARK: - 💥 Thread Explosion
//
// 💡 INTERVIEW TALKING POINTS:
// • What is it? When an app spawns far more threads than there are physical CPU cores (e.g. 500 threads on a 6-core iPhone).
// • Why is it bad? Context Switching. The CPU spends more time swapping thread states in and out of memory than actually executing code, causing massive battery drain, freezing, and memory exhaustion (each thread costs ~512KB).
// • GCD vs Swift Concurrency: GCD's global concurrent queues can spin up hundreds of threads if you flood them with blocking tasks. Swift Concurrency (async/await) uses a fixed-size cooperative thread pool (1 thread per core) explicitly to prevent thread explosion.

class ThreadExplosionDemonstrator {
    
    // ==========================================
    // ❌ BUGGY: Exhausting the GCD Thread Pool
    // ==========================================
    func runBuggyThreadExplosion() {
        for i in 0..<1000 {
            // GCD tries to be helpful. If a thread is blocked (e.g. sleep/network/disk), 
            // GCD spawns a NEW thread for the next task.
            DispatchQueue.global().async {
                print("Task \(i) starting on thread: \(Thread.current)")
                
                // Simulating a blocking I/O operation. 
                // This forces GCD to spawn 1000 threads, grinding the system to a halt!
                sleep(2) 
            }
        }
    }
    
    // ==========================================
    // ✅ FIXED 1: Bounded OperationQueue
    // ==========================================
    func fixedWithOperationQueue() {
        let queue = OperationQueue()
        // 🛡️ The Fix: Hard cap the number of concurrent executions.
        queue.maxConcurrentOperationCount = 6 
        
        for i in 0..<1000 {
            queue.addOperation {
                print("Task \(i) executing safely without exploding threads.")
                sleep(2)
            }
        }
    }
    
    // ==========================================
    // ✅ FIXED 2: Swift Concurrency (TaskGroup)
    // ==========================================
    func fixedWithSwiftConcurrency() async {
        // 🛡️ The Modern Fix: Swift Concurrency maintains a fixed thread pool.
        // Even if we spawn 1000 tasks, it will only use ~6 threads (depending on hardware).
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<1000 {
                group.addTask {
                    print("Async Task \(i) executing. Pool size is capped!")
                    
                    // Task.sleep does NOT block the underlying thread! It yields it back to the pool.
                    try? await Task.sleep(nanoseconds: 2_000_000_000)
                }
            }
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why doesn't GCD just limit the number of threads it creates?
//   A: GCD doesn't know if your code is doing CPU work or waiting on a database. If it capped threads at 6, and all 6 were waiting on a network call, your app would deadlock. So it spawns more threads to keep work moving.
// • Q: How does `async/await` solve Thread Explosion?
//   A: Through "Cooperative Concurrency". When an `async` function hits `await`, it doesn't block the thread. It suspends the task and yields the thread back to the fixed-size pool, so 1 thread can juggle thousands of suspended tasks!
// • Q: How can I limit concurrent tasks in GCD if I can't use OperationQueue?
//   A: You can use a `DispatchSemaphore(value: 6)`. Call `.wait()` before your work, and `.signal()` when done, bounding the concurrent executions.
