# Concurrency Options Decision Table

Knowing WHEN to use which concurrency model is a hallmark of a Senior iOS Developer.

| Framework | Best For... | Pros / Cons |
|---|---|---|
| **GCD (Dispatch)** | Quick, simple, fire-and-forget background tasks. Dispatching UI updates to the Main thread. | **Pros:** Incredibly lightweight, low overhead.<br>**Cons:** Callback hell, hard to cancel tasks, hard to manage dependencies. |
| **OperationQueue** | Complex, graph-like tasks (e.g. Download -> Unzip -> Parse -> Save). Limiting max parallel executions. | **Pros:** Easy cancellation, dependency chaining, limits concurrent execution easily.<br>**Cons:** Heavy boilerplate, legacy KVO syntax, high object overhead. |
| **Async/Await (Swift Tasks)** | The modern standard for almost all async logic. Network calls, continuous streams (AsyncStream). | **Pros:** Clean top-to-bottom reading, native error throwing, built-in cooperative cancel.<br>**Cons:** Requires iOS 13+ (mostly iOS 15+ for full feature set), steep learning curve. |

## 🏆 Quick Rule of Thumb for Interviews:
> "I default to `async/await` for all new networking and asynchronous control flows because structured concurrency is safer and cleaner. However, if I am working in a legacy codebase that requires heavily managed, cancellable task graphs (like an offline syncing engine), `OperationQueue` is still an incredibly powerful, battle-tested tool."
