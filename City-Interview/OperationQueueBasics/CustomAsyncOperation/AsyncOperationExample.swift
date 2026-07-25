import Foundation

// MARK: - ⏳ Custom Asynchronous Operation
//
// 💡 INTERVIEW TALKING POINTS:
// • Why the boilerplate?: By default, an `Operation` assumes its work is synchronous (blocking). If you wrap an async network call inside `main()`, the Operation immediately returns and thinks it's "finished" before the network callback fires!
// • KVO Requirement: To make an Operation truly async, you must override `isAsynchronous` to `true`, and manually manage the state (`isExecuting` and `isFinished`) using Key-Value Observing (KVO). 
// • The Pitfall (Leaking Slots): If you forget to trigger the KVO `isFinished` notification when the async task completes, the OperationQueue slot will hang forever, leaking resources and blocking other operations.

// ==========================================
// Boilerplate Base Class for Async Operations
// ==========================================
class AsyncOperation: Operation {
    
    // Custom state tracking enum
    enum State: String {
        case ready, executing, finished
        var keyPath: String { return "is" + rawValue.capitalized }
    }
    
    private var state = State.ready {
        willSet {
            willChangeValue(forKey: newValue.keyPath)
            willChangeValue(forKey: state.keyPath)
        }
        didSet {
            didChangeValue(forKey: oldValue.keyPath)
            didChangeValue(forKey: state.keyPath)
        }
    }
    
    override var isReady: Bool { super.isReady && state == .ready }
    override var isExecuting: Bool { state == .executing }
    override var isFinished: Bool { state == .finished }
    override var isAsynchronous: Bool { true }
    
    override func start() {
        if isCancelled {
            state = .finished
            return
        }
        main()
        state = .executing
    }
    
    // Subclasses must call this when their async work completes
    func finish() {
        state = .finished
    }
}

// ==========================================
// Usage Example (Network Call)
// ==========================================
class NetworkDownloadOperation: AsyncOperation {
    let url: URL
    
    init(url: URL) {
        self.url = url
        super.init()
    }
    
    override func main() {
        // 1. Simulate async network call
        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            print("Network download completed.")
            
            // 2. ⚠️ CRITICAL: Must call finish() or the queue slot hangs forever!
            self?.finish()
        }.resume()
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why do you have to override `start()` and manually fire `willChangeValue/didChangeValue`?
//   A: OperationQueue uses Key-Value Observing (KVO) to monitor the `isFinished` and `isExecuting` properties. Standard Swift properties don't automatically emit KVO notifications unless properly configured.
// • Q: If I use `BlockOperation`, is it async?
//   A: No. `BlockOperation` closures execute synchronously on the background thread provided by the queue. If you put an async network call inside a `BlockOperation`, the operation finishes immediately.
// • Q: Is all this boilerplate still necessary in modern Swift?
//   A: Mostly, no. With `async/await` and `TaskGroup`, you can achieve async concurrency much cleaner. This is largely legacy architecture, but crucial for maintaining older, robust codebases.
