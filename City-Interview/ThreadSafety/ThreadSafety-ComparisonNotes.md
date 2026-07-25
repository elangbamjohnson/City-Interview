# Thread Safety Decision Table

When an interviewer asks "How do you protect shared state?", your answer should demonstrate that you know the spectrum from old-school C-level speed to modern Swift safety.

| Mechanism | Best For... | Pros / Cons |
|---|---|---|
| **Swift Actors** | Modern Swift codebases (iOS 15+). State that naturally fits in an object. | **Pros:** Compiler enforced! Impossible to write a data race. Clean syntax.<br>**Cons:** Forces the call site to be `async/await`. Susceptible to Reentrancy bugs. |
| **GCD Concurrent Queue + `.barrier`** | Reader-Writer scenarios (e.g. In-memory Cache) in legacy or non-async codebases. | **Pros:** Multiple concurrent reads (fast), exclusive writes (safe). High level API.<br>**Cons:** High boilerplate. Dispatch queues have higher memory overhead than simple locks. |
| **os_unfair_lock** | High-performance, low-level engine code where every microsecond counts (e.g. Game Engines, Audio processing). | **Pros:** Blazing fast. Lowest possible memory footprint.<br>**Cons:** Danger of Deadlocks. Unforgiving C-API. Must manually defer unlocks. |
| **Atomics** | Pure Integer counters, Flags, or single pointer swaps. | **Pros:** Non-blocking (threads don't sleep).<br>**Cons:** Hard to find/use natively in Swift without external packages. Limited functionality. |

## 🏆 Quick Rule of Thumb for Interviews:
> "Historically, I'd reach for a GCD Concurrent Queue with `.barrier` to build a thread-safe cache (Reader-Writer pattern). However, if the project is on iOS 15+, I strictly default to Swift `actor` because it shifts the burden of thread-safety from the developer's memory to the Compiler."
