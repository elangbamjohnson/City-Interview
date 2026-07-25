import Foundation

// MARK: - ⏱️ Time Profiler
//
// 💡 INTERVIEW TALKING POINTS:
// • What it shows: The Time Profiler measures CPU usage by sampling the call stack at regular intervals. It shows the Call Tree, highlighting which functions consume the highest % of CPU time.
// • UI Hitching: A "hitch" happens when a heavy operation blocks the Main Thread, preventing the UI from rendering at 60/120 FPS. This shows up as a massive spike on the main thread track in Instruments.
// • The Habit: If a screen feels laggy, the immediate instinct of a senior engineer is to ask: "Is heavy computation or I/O accidentally running on the main thread?"

class TimeProfilerDemonstrator {
    
    // ==========================================
    // ❌ BUGGY: Expensive work blocking Main Thread
    // ==========================================
    func sortMassiveArrayBadly() {
        // Imagine this is called from a Button tap or viewDidLoad.
        // It runs synchronously on the main thread, freezing the UI completely.
        let hugeArray = (0...1_000_000).map { _ in Int.random(in: 1...1000) }
        
        // This blocks the main thread for several seconds!
        let sorted = hugeArray.sorted()
        print("Done sorting \(sorted.count) items on main thread.")
    }
    
    // ==========================================
    // ✅ FIXED: Offloaded to Background Queue
    // ==========================================
    func sortMassiveArrayCorrectly() {
        // 1. Dispatch expensive work off the main thread immediately.
        DispatchQueue.global(qos: .userInitiated).async {
            let hugeArray = (0...1_000_000).map { _ in Int.random(in: 1...1000) }
            let sorted = hugeArray.sorted()
            
            // 2. Deliver the results back on the main thread to update the UI.
            DispatchQueue.main.async {
                print("Done sorting \(sorted.count) items safely.")
                // Update UI here (e.g., tableView.reloadData())
            }
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How does the Time Profiler actually work?
//   A: It samples the active call stacks of all threads at a very high frequency (e.g., 1ms intervals). If a function appears in many consecutive samples, it is mathematically deduced to be consuming the most CPU time.
// • Q: What does it mean to "Invert Call Tree" in Instruments?
//   A: It flips the stack trace upside down, placing the deepest functions (the ones doing the actual work, rather than the top-level dispatchers) at the top of the list so you can easily spot the bottleneck.
// • Q: Why is `print()` slow?
//   A: `print()` involves synchronous I/O and locks. Excessive logging inside a tight loop can severely degrade performance and will show up glaringly in the Time Profiler.
