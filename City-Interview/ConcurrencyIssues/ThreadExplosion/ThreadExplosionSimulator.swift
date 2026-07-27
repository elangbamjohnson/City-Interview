import Foundation

// MARK: - 💥 Thread Explosion Simulator
//
// 💡 INTERVIEW TALKING POINTS:
// • What is Thread Explosion? It occurs when an app rapidly dispatches a huge number of synchronous, blocking tasks (like I/O or heavy parsing) to a concurrent queue (like DispatchQueue.global). 
// • Why is it bad? Because GCD tries to accommodate the concurrent work by spinning up a new thread for every single blocked task. Each thread consumes ~512KB of memory and incurs massive Context Switching overhead. This leads to Memory Exhaustion (crashes) and CPU thrashing (UI hangs).
// • How to fix it?
//   1. Bounded Concurrency (OperationQueue.maxConcurrentOperationCount, or DispatchSemaphore).
//   2. Swift Concurrency (Async/Await), which uses a fixed-size thread pool matching the number of CPU cores and utilizes continuations instead of blocking threads.

@available(iOS 13.0, *)
class ThreadExplosionSimulator {
    
    // A thread-safe counter to manually track how many simulated operations are actively running at the exact same moment.
    private let activeThreadsLock = NSLock()
    private var activeSimulatedThreads = 0
    private var peakSimulatedThreads = 0
    
    private func incrementThreadCount() {
        activeThreadsLock.lock()
        activeSimulatedThreads += 1
        if activeSimulatedThreads > peakSimulatedThreads {
            peakSimulatedThreads = activeSimulatedThreads
        }
        activeThreadsLock.unlock()
    }
    
    private func decrementThreadCount() {
        activeThreadsLock.lock()
        activeSimulatedThreads -= 1
        activeThreadsLock.unlock()
    }
    
    private func resetTracking() {
        activeThreadsLock.lock()
        activeSimulatedThreads = 0
        peakSimulatedThreads = 0
        activeThreadsLock.unlock()
    }
    
    // ==========================================
    // 1. UNBOUNDED (The Problem)
    // ==========================================
    // Why it explodes: `DispatchQueue.global()` is highly concurrent. When it sees 200 tasks added almost instantly, and the first few tasks immediately BLOCK the thread (via Thread.sleep), GCD panics. To prevent a deadlock, GCD eagerly spawns MORE threads to handle the remaining tasks in the queue.
    func simulateUnboundedThreads(count: Int, completion: @escaping () -> Void) {
        print("\n--- 🧨 Starting UNBOUNDED Thread Simulation (\(count) tasks) ---")
        resetTracking()
        let startTime = Date()
        
        let dispatchGroup = DispatchGroup()
        let globalQueue = DispatchQueue.global(qos: .userInitiated)
        
        for i in 0..<count {
            dispatchGroup.enter()
            globalQueue.async {
                self.incrementThreadCount()
                
                // ⚠️ This mimics a blocking synchronous call (e.g. Data(contentsOf:), heavy parsing)
                Thread.sleep(forTimeInterval: 0.1)
                
                self.decrementThreadCount()
                dispatchGroup.leave()
            }
        }
        
        dispatchGroup.notify(queue: .main) {
            let duration = Date().timeIntervalSince(startTime)
            print("❌ UNBOUNDED Finished!")
            print("⏱️ Total Time: \(String(format: "%.2f", duration)) seconds")
            print("📈 Peak Active Threads: \(self.peakSimulatedThreads) (Notice how close this is to \(count)!)")
            completion()
        }
    }
    
    // ==========================================
    // 2. BOUNDED (The Old Fix - OperationQueue)
    // ==========================================
    // Why it works: We explicitly tell the queue to never run more than `maxConcurrent` tasks at a time. It's slower (wall-clock time), but the memory footprint and CPU context-switching overhead remain perfectly stable and flat.
    func simulateBoundedConcurrency(count: Int, maxConcurrent: Int, completion: @escaping () -> Void) {
        print("\n--- 🛡️ Starting BOUNDED Simulation (\(count) tasks, Max: \(maxConcurrent)) ---")
        resetTracking()
        let startTime = Date()
        
        let operationQueue = OperationQueue()
        operationQueue.maxConcurrentOperationCount = maxConcurrent
        
        let dispatchGroup = DispatchGroup()
        
        for i in 0..<count {
            dispatchGroup.enter()
            operationQueue.addOperation {
                self.incrementThreadCount()
                
                // ⚠️ Same blocking work
                Thread.sleep(forTimeInterval: 0.1)
                
                self.decrementThreadCount()
                dispatchGroup.leave()
            }
        }
        
        dispatchGroup.notify(queue: .main) {
            let duration = Date().timeIntervalSince(startTime)
            print("✅ BOUNDED Finished!")
            print("⏱️ Total Time: \(String(format: "%.2f", duration)) seconds")
            print("📈 Peak Active Threads: \(self.peakSimulatedThreads) (Safely capped!)")
            completion()
        }
    }
    
    // ==========================================
    // 3. TASK GROUP (The Modern Fix - Swift Concurrency)
    // ==========================================
    // Why it's magical: Swift Concurrency uses a fixed-size thread pool under the hood (usually 1 thread per CPU core). When `Task.sleep` is called, the thread is NOT blocked. The task is suspended, and the thread is instantly freed to pick up the next task.
    @available(iOS 15.0, *)
    func simulateTaskGroupApproach(count: Int) async {
        print("\n--- 🚀 Starting TASK GROUP Simulation (\(count) tasks) ---")
        resetTracking()
        let startTime = Date()
        
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<count {
                group.addTask {
                    self.incrementThreadCount()
                    
                    // ⚠️ `Task.sleep` does NOT block the underlying thread. It suspends the task.
                    // 100_000_000 nanoseconds = 0.1 seconds
                    try? await Task.sleep(nanoseconds: 100_000_000)
                    
                    self.decrementThreadCount()
                }
            }
        }
        
        let duration = Date().timeIntervalSince(startTime)
        print("✅ TASK GROUP Finished!")
        print("⏱️ Total Time: \(String(format: "%.2f", duration)) seconds")
        print("📈 Peak Active 'Threads' (Tasks): \(self.peakSimulatedThreads)")
        print("   (Note: In Swift Concurrency, peak tasks does NOT equal peak OS threads. The OS threads remain strictly capped to the CPU core count!)")
    }
}

// ==========================================
// 🏃‍♂️ The Runner Function
// ==========================================
/// To invoke this simulation, call this function from a simple SwiftUI Button action,
/// or inside `viewDidLoad` of a Playground/Test ViewController.
@available(iOS 15.0, *)
func runThreadExplosionComparison() {
    let simulator = ThreadExplosionSimulator()
    // We cap the count at 200. Going up to 10,000 on `DispatchQueue.global` with Thread.sleep
    // could genuinely crash the simulator/device due to Thread Explosion (Memory OOM)!
    let taskCount = 200 
    
    print("==========================================")
    print("🚦 BEGINNING THREAD EXPLOSION SIMULATION")
    print("==========================================")
    
    // Chain them sequentially for clean logging
    simulator.simulateUnboundedThreads(count: taskCount) {
        simulator.simulateBoundedConcurrency(count: taskCount, maxConcurrent: 4) {
            Task {
                await simulator.simulateTaskGroupApproach(count: taskCount)
                print("\n🏁 SIMULATION COMPLETE. Review the logs above to compare behavior.")
            }
        }
    }
}

// ==========================================
// 4. UI Playground
// ==========================================
import SwiftUI

@available(iOS 15.0, *)
struct ThreadExplosionPlaygroundView: View {
    @State private var isRunning = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Thread Explosion Simulator")
                .font(.title2).bold()
                .multilineTextAlignment(.center)
            
            Text("Check the Xcode Console after tapping run to see the peak thread counts and wall-clock times for each concurrency approach.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button {
                isRunning = true
                runThreadExplosionComparison()
                
                // Reset UI after an estimated time (the simulation takes ~3-4 seconds total)
                DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
                    isRunning = false
                }
            } label: {
                if isRunning {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .frame(maxWidth: .infinity)
                } else {
                    Text("Run Simulation (Check Console)")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .padding(.horizontal, 40)
            .disabled(isRunning)
        }
        .padding()
    }
}

@available(iOS 15.0, *)
#Preview {
    ThreadExplosionPlaygroundView()
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why did the Unbounded test peak at ~200 threads while the Bounded test peaked at exactly 4?
//   A: Because `DispatchQueue.global()` sees blocked tasks and greedily spawns new threads to prevent deadlocks. The Bounded queue strictly respects `maxConcurrentOperationCount`, queueing tasks rather than spawning threads.
// • Q: If Unbounded finishes faster, why is it considered a bug?
//   A: Because it doesn't scale. If you pushed 2,000 tasks instead of 200, the OS would spawn 2,000 threads. Threads cost ~512KB of memory each. 2,000 threads = 1GB of pure overhead. The app would instantly crash with an Out-of-Memory (OOM) error.
// • Q: How does Swift Concurrency prevent thread explosion natively?
//   A: It abandons the "thread-per-task" model. It uses a fixed-size pool of threads equal to your CPU cores. When a task hits an `await` (like a network call), it yields the thread back to the system immediately, allowing another task to run on the exact same thread.
