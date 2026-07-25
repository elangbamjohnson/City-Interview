import Foundation

// MARK: - 🔗 Operation Dependencies
//
// 💡 INTERVIEW TALKING POINTS:
// • Execution Order Guarantee: Dependencies force Operations to execute in a strict sequence, even if they are added to a highly concurrent queue (or even completely different queues!).
// • Why not raw GCD?: Achieving a strict A -> B -> C execution chain in GCD across different background queues requires DispatchGroups or nested closures (Callback Hell). `Operation` handles it natively via `.addDependency()`.

class DependencyDemonstrator {
    
    func runDependencyChain() {
        let queue = OperationQueue()
        
        // 1. Create Operations
        let downloadOp = BlockOperation {
            print("1. Downloading Image...")
            sleep(1)
        }
        
        let processOp = BlockOperation {
            print("2. Applying Sepia Filter...")
            sleep(1)
        }
        
        let saveOp = BlockOperation {
            print("3. Saving to Disk...")
            sleep(1)
        }
        
        // 2. Add Dependencies (The Magic ✨)
        // processOp will NOT start until downloadOp is completely finished.
        processOp.addDependency(downloadOp)
        
        // saveOp will NOT start until processOp is completely finished.
        saveOp.addDependency(processOp)
        
        // 3. Add to Queue
        // Order of addition doesn't matter! The queue respects the dependency graph.
        queue.addOperations([saveOp, downloadOp, processOp], waitUntilFinished: false)
        
        print("Operations added to queue. Continuing execution on current thread...")
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Can Operations from different OperationQueues depend on each other?
//   A: Yes! Dependencies are tracked on the Operation object itself, not the queue. Op A on Queue 1 can depend on Op B on Queue 2.
// • Q: What happens if a dependency is cancelled?
//   A: The dependent operation will still execute! Cancellation does not automatically skip dependent operations. You must manually check `isCancelled` or `dependencies.first?.isCancelled` inside the subsequent operation.
// • Q: How does this prevent Callback Hell?
//   A: Instead of nesting closures (Download { Process { Save } }), you create flat, reusable objects and explicitly link them, keeping code incredibly clean.
