import Foundation

// MARK: - 🛑 Cancellation & KVO
//
// 💡 INTERVIEW TALKING POINTS:
// • Cooperative Cancellation: Neither GCD nor OperationQueue forcibly kills your thread. Cancellation is purely "cooperative." Calling `.cancel()` simply sets the `isCancelled` boolean to true.
// • Developer Responsibility: It is YOUR job to routinely check `isCancelled` inside long-running `for` loops or before executing heavy code blocks.
// • Comparison to Async/Await: Swift Concurrency (`Task`) is also cooperative, but it uses `Task.checkCancellation()` which naturally `throws` a CancellationError, integrating cleanly with Swift's error handling.

class CancellableImageProcessor: Operation {
    
    override func main() {
        print("Starting heavy image processing...")
        
        // Simulate a long-running pixel manipulation loop
        for i in 0..<100 {
            // 🛡️ CRITICAL: The cooperative check
            if isCancelled {
                print("Operation was cancelled at step \(i)! Bailing out early.")
                return
            }
            
            // Simulate heavy math
            usleep(100_000) // Sleep 0.1 seconds
        }
        
        print("Finished processing image successfully.")
    }
}

class CancellationDemonstrator {
    
    func runAndCancel() {
        let queue = OperationQueue()
        let op = CancellableImageProcessor()
        
        queue.addOperation(op)
        
        // Wait briefly, then cancel it while it's in the middle of its for-loop
        DispatchQueue.global().asyncAfter(deadline: .now() + 0.3) {
            print("User hit the cancel button!")
            
            // Cancels this specific operation
            op.cancel() 
            
            // OR cancel ALL operations in the queue:
            // queue.cancelAllOperations()
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Does calling `cancelAllOperations()` stop currently running operations immediately?
//   A: No. It simply flips their `isCancelled` flag to true. If the developer didn't write code to check `isCancelled`, the operation will continue running to completion, wasting CPU cycles.
// • Q: How does `isCancelled` relate to `isFinished`?
//   A: When you bail out of `main()` due to cancellation, the Operation automatically sets `isFinished` to true so the queue knows it can free up the slot.
// • Q: What happens if an Operation is cancelled BEFORE it starts running?
//   A: The OperationQueue will still call `start()`, but the default implementation immediately exits and flags it as finished without running `main()`.
