import Foundation

// MARK: - 🔄 RunLoop Internals
//
// 💡 INTERVIEW TALKING POINTS:
// • What is a RunLoop? An event processing loop tied to a specific thread. It coordinates the receipt of events (touches, timers, network callbacks).
// • Main Thread: The Main Thread has its RunLoop automatically created and started by iOS. It keeps the thread alive waiting for user input.
// • Background Threads: RunLoops are NOT started automatically on background threads. You must manually start them if you need them.
//
// 🔗 Default Modes:
// • `.default` (NSDefaultRunLoopMode): The mode the run loop is in most of the time.
// • `.common` (NSRunLoopCommonModes): A pseudo-mode. Adding a timer to `.common` means it will fire in ALL common modes (including tracking mode).
// • `UITrackingRunLoopMode`: Entered when the user is actively scrolling a UIScrollView (like a TableView).

class RunLoopDemonstrator {
    
    private var timer: Timer?
    
    // ==========================================
    // ❌ The Scrolling Bug (Timer pauses)
    // ==========================================
    func scheduleTimerBadly() {
        // scheduledTimer() automatically adds the timer to the current run loop in `.default` mode.
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            print("Tick: This pauses when the user scrolls a TableView/ScrollView!")
        }
        
        // ⚠️ WHY IT PAUSES: When the user scrolls, the RunLoop switches from `.default` to `UITrackingRunLoopMode`.
        // Because the timer is only scheduled on `.default`, it stops firing until scrolling ends.
    }
    
    // ==========================================
    // ✅ The Fix (Using .common modes)
    // ==========================================
    func scheduleTimerCorrectly() {
        timer = Timer(timeInterval: 1.0, repeats: true) { _ in
            print("Tick: This keeps firing even during scrolling!")
        }
        
        // 🛡️ THE FIX: Add the timer to `.common` mode.
        // This ensures the timer fires in both `.default` and `UITrackingRunLoopMode`.
        if let safeTimer = timer {
            RunLoop.current.add(safeTimer, forMode: .common)
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why did my Timer stop firing when the user scrolled the UITableView?
//   A: The Main RunLoop switched from `.default` to `UITrackingRunLoopMode`. Fix it by adding the Timer to `.common` mode.
// • Q: Do background threads have RunLoops?
//   A: They have them, but they are idle/dormant by default. You must explicitly start them if you want to use Timers or perform delayed selectors on a background thread.
// • Q: How does the Main Thread stay alive indefinitely instead of just exiting after execution?
//   A: The Main RunLoop puts the thread to sleep when there's no work, and wakes it up instantly when an event (like a touch) occurs.
