# iOS Concurrency & GCD Reference

This directory contains `GCDPlaygroundView.swift`, an interactive playground to demonstrate various GCD concepts (Serial, Concurrent, Group, Barrier, Semaphore) hands-on.

## All GCD Dispatch Queues

| # | Queue | How to Create (Exact Syntax) | Serial / Concurrent | 🧵 Runs On | You Own It? | Use Case |
|---|---|---|---|---|---|---|
| 1 | **Main Queue** | `DispatchQueue.main` | **Serial** | **🟢 Main Thread** (Thread 1) | ❌ System singleton | UI updates, touch events |
| 2 | **Global (userInteractive)** | `DispatchQueue.global(qos: .userInteractive)` | **Concurrent** | **🔵 Background Thread Pool** (highest priority) | ❌ System-shared | Animations, immediate feedback |
| 3 | **Global (userInitiated)** | `DispatchQueue.global(qos: .userInitiated)` | **Concurrent** | **🔵 Background Thread Pool** (high priority) | ❌ System-shared | User is actively waiting |
| 4 | **Global (default)** | `DispatchQueue.global(qos: .default)` | **Concurrent** | **🔵 Background Thread Pool** (medium priority) | ❌ System-shared | General work |
| 5 | **Global (utility)** | `DispatchQueue.global(qos: .utility)` | **Concurrent** | **🔵 Background Thread Pool** (low priority) | ❌ System-shared | Long tasks with progress bars |
| 6 | **Global (background)** | `DispatchQueue.global(qos: .background)` | **Concurrent** | **🔵 Background Thread Pool** (lowest priority) | ❌ System-shared | Prefetch, sync, cleanup |
| 7 | **Custom Serial** | `DispatchQueue(label: "com.citi.serial")` | **Serial** | **🔵 Background Thread** | ✅ You own it | Thread-safe data, ordered tasks |
| 8 | **Custom Concurrent** | `DispatchQueue(label: "com.citi.concurrent", attributes: .concurrent)` | **Concurrent** | **🔵 Background Thread Pool** | ✅ You own it | Reader/Writer with barriers |

## OperationQueue (Built on GCD)

| # | Queue | How to Create (Exact Syntax) | Serial / Concurrent | 🧵 Runs On | Use Case |
|---|---|---|---|---|---|
| 9 | **OperationQueue** | `let queue = OperationQueue()` | **Concurrent** (default) | **🔵 Background Thread Pool** | Cancellable tasks, dependency chains |
| 10 | **OperationQueue (serial mode)** | `let q = OperationQueue(); q.maxConcurrentOperationCount = 1` | **Serial** | **🔵 Background Thread** | Ordered tasks that need cancellation |
| 11 | **OperationQueue.main** | `OperationQueue.main` | **Serial** | **🟢 Main Thread** (Thread 1) | UI updates via Operation API |

## ⚠️ The `.sync` Optimization Gotcha

When using `.sync`, the thread does not necessarily switch to a background thread. GCD optimizes execution by running the block on the **calling thread**.

```swift
let serialQueue = DispatchQueue(label: "com.citi.queue")

// If called from the Main Thread:
serialQueue.sync {
    // This runs on the MAIN THREAD as an optimization!
    // It blocks the caller thread until finished.
}
```

---

## GCD vs Swift Concurrency — When to Use Which and Why

### Side-by-Side Equivalents

| Concept | GCD (Old Way) | Swift Concurrency (Modern Way) |
|---|---|---|
| **Run work in background** | `DispatchQueue.global().async { }` | `Task { }` |
| **Return to main thread** | `DispatchQueue.main.async { }` | `@MainActor` or `await MainActor.run { }` |
| **Wait for async result** | Callback / completion handler | `let result = await fetchData()` |
| **Protect shared state** | Serial queue or `NSLock` | `actor MyActor { }` |
| **Run multiple tasks in parallel** | `DispatchGroup` | `async let` or `TaskGroup` |
| **Limit concurrency** | `DispatchSemaphore(value: N)` | `TaskGroup` with manual limiting |
| **Reader/Writer lock** | Concurrent queue + `.barrier` | `actor` (serializes all access) |
| **Cancel running work** | Not built-in (manual flags) | `task.cancel()` + `Task.isCancelled` |
| **Sequential execution** | Serial `DispatchQueue` | `await` (sequential by default) |
| **Error propagation** | Manual via callbacks | `try await` (native throws) |

### Feature Comparison

| Feature | GCD | Swift Concurrency |
|---|---|---|
| **Introduced** | iOS 4 (2010) | iOS 15 / Swift 5.5 (2021) |
| **Syntax** | Closures / callbacks | `async` / `await` keywords |
| **Thread safety** | Manual (locks, serial queues) | Compiler-enforced (`actor`, `Sendable`) |
| **Cancellation** | ❌ Not built-in | ✅ Structured cancellation |
| **Thread explosion risk** | ⚠️ Yes (unlimited thread creation) | ✅ No (cooperative thread pool) |
| **Callback hell** | ⚠️ Yes (nested closures) | ✅ No (linear code flow) |
| **Compile-time data race detection** | ❌ No | ✅ Yes (Swift 6 strict concurrency) |
| **Debugging** | Hard (stack traces are cryptic) | Easier (async stack frames) |
| **Learning curve** | Moderate | Steeper initially |
| **Legacy codebase support** | ✅ Works everywhere | ⚠️ iOS 15+ minimum |

### Code Comparison: Fetching 3 API Calls Then Updating UI

**GCD Approach (Dispatch Group):**
```swift
func loadDashboard() {
    let group = DispatchGroup()
    var user: User?
    var transactions: [Transaction]?
    var alerts: [Alert]?

    DispatchQueue.global().async(group: group) {
        user = try? self.fetchUser()              // callback hell risk
    }
    DispatchQueue.global().async(group: group) {
        transactions = try? self.fetchTransactions()
    }
    DispatchQueue.global().async(group: group) {
        alerts = try? self.fetchAlerts()
    }

    group.notify(queue: .main) {
        self.updateUI(user: user, transactions: transactions, alerts: alerts)
    }
}
```

**Swift Concurrency Approach (async let):**
```swift
func loadDashboard() async throws {
    async let user = fetchUser()                  // clean, linear
    async let transactions = fetchTransactions()
    async let alerts = fetchAlerts()

    let (u, t, a) = try await (user, transactions, alerts)
    await MainActor.run {
        updateUI(user: u, transactions: t, alerts: a)
    }
}
```

### When to Use GCD

| Situation | Why GCD |
|---|---|
| Maintaining **legacy codebase** (pre-iOS 15) | Swift Concurrency not available |
| Need **precise queue control** (barriers, specific QoS) | GCD gives you exact queue management |
| Working with **C/Obj-C APIs** that use dispatch queues | Direct interop |
| Simple **fire-and-forget** background work | `DispatchQueue.global().async { }` is quick |

### When to Use Swift Concurrency

| Situation | Why Swift Concurrency |
|---|---|
| **New code** in iOS 15+ projects | Modern, safer, cleaner |
| **Complex async flows** (chained API calls, error handling) | `async/await` eliminates callback hell |
| **Thread safety** is critical (financial apps like Citi) | `actor` gives compiler-enforced safety |
| **Cancellation** matters (user navigates away mid-request) | Built-in structured cancellation |
| **Testability** | Async functions are easier to unit test than callback chains |

### 💡 Interview One-Liner

> *"I use Swift Concurrency for all new code because actors give me compile-time data race safety and async/await eliminates callback hell. But I'm comfortable with GCD for legacy code and when I need precise queue-level control like barriers or specific QoS priorities."*
