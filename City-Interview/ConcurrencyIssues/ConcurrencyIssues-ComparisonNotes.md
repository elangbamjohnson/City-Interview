# Concurrency Issues Diagnosis Table

When an interviewer presents a scenario, you need to identify the exact issue quickly.

| Issue Type | Symptoms / Recognition Cues | Go-To Fixes |
|---|---|---|
| **Race Condition** | - Random, non-deterministic crashes.<br>- Arrays throwing index out of bounds randomly.<br>- Math calculations yielding incorrect results. | 1. Isolate state using an `actor` (Swift 5.5+)<br>2. Use a Serial Queue (`.sync`)<br>3. Use an `os_unfair_lock` for critical sections. |
| **Deadlock** | - App completely freezes immediately.<br>- CPU usage drops to 0%.<br>- Xcode Pause shows threads waiting on each other in a circle. | 1. Never call `.sync` on the current queue.<br>2. Always acquire multiple locks in the same order.<br>3. Use async/await which avoids many locking deadlocks natively. |
| **Thread Explosion** | - Phone gets extremely hot.<br>- Memory spikes massive amounts rapidly.<br>- App becomes incredibly sluggish/unresponsive.<br>- Hundreds of threads visible in Debugger. | 1. Use `async/await` (fixed cooperative thread pool).<br>2. Set `maxConcurrentOperationCount` on OpQueue.<br>3. Use `DispatchSemaphore` to throttle GCD blocks. |

## 🏆 Quick Rule of Thumb for Interviews:
> "If the data is corrupt, it's a Race Condition. If the app stops forever, it's a Deadlock. If the app chugs, burns battery, and uses massive memory, it's a Thread Explosion. Swift Concurrency (`async/await` and `actor`) was specifically designed by Apple to solve all three of these legacy GCD issues natively at the compiler level."
