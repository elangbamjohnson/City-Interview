import Foundation

// MARK: - ⚙️ Basic Operation & OperationQueue
//
// 💡 INTERVIEW TALKING POINTS:
// • What is it? OperationQueue is an Objective-C, object-oriented abstraction built ON TOP OF Grand Central Dispatch (GCD).
// • Operation vs DispatchWorkItem (GCD): GCD is a lightweight C-API focused on closures. Operations are heavy, stateful objects (with KVO properties like `isExecuting` and `isCancelled`) that can be paused, resumed, reused, and subclassed.
// • Concurrency Control: You can easily cap the number of parallel tasks using `queue.maxConcurrentOperationCount = 2`. Doing this in raw GCD requires complex Semaphores.

// ==========================================
// Example 1: BlockOperation (Quick & Easy)
// ==========================================
class BasicOperationDemonstrator {
    let queue = OperationQueue()
    
    init() {
        // Limit to 2 concurrent operations
        queue.maxConcurrentOperationCount = 2
    }
    
    func runBlockOperation() {
        // BlockOperation is a built-in subclass for executing closures
        let downloadOp = BlockOperation {
            print("Downloading Image... (BlockOperation)")
            sleep(1) // Simulate work
        }
        
        // As soon as you add it to the queue, it schedules execution on a background thread.
        queue.addOperation(downloadOp)
    }
}

// ==========================================
// Example 2: Custom Synchronous Operation
// ==========================================
class ProcessImageOperation: Operation {
    let imageID: String
    
    init(imageID: String) {
        self.imageID = imageID
        super.init()
    }
    
    // For synchronous tasks, you only need to override `main()`
    override func main() {
        // 🛡️ Always check for cancellation before doing heavy work!
        if isCancelled { return }
        
        print("Processing Image \(imageID)... (Custom Operation)")
        sleep(1) // Simulate synchronous heavy work
        
        if isCancelled { return }
        print("Finished Processing Image \(imageID)")
    }
}

func runCustomOperation() {
    let queue = OperationQueue()
    let processOp = ProcessImageOperation(imageID: "IMG_123")
    queue.addOperation(processOp)
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Does OperationQueue run on the main thread?
//   A: No, instances of OperationQueue run on background threads by default. However, `OperationQueue.main` specifically executes on the Main thread.
// • Q: Why use `Operation` instead of `DispatchQueue.global().async`?
//   A: If you need to cancel a task, limit concurrent executions, or build complex dependency graphs, `Operation` is far superior. If it's a simple fire-and-forget closure, use GCD.
// • Q: What happens if you call `.start()` on an Operation manually without a Queue?
//   A: It runs synchronously on the current thread, blocking it until finished (unless it's a custom Asynchronous Operation).
