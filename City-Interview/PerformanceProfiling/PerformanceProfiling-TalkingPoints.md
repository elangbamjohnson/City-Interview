# Performance Profiling & Instruments — Interview Talking Points

A quick reference for diagnosing and fixing performance bottlenecks, memory leaks, and UI hangs using Xcode Instruments.

## 1. Core Concepts
- **Time Profiler:** Samples the call stack to show which functions consume the most CPU time. A major spike on the main thread track indicates UI "hitching."
- **Leaks vs Allocations:** The **Leaks** instrument finds unreachable memory (like retain cycles). The **Allocations** instrument tracks all live memory, which helps you spot logical leaks (like an array that grows infinitely).
- **Core Animation / Hangs:** Measures dropped frames and UI unresponsiveness. A "Hang" occurs when the Main Thread is blocked for > 250ms.
- **Energy Log:** Tracks battery-draining offenders like unnecessary GPS polling, keeping the network radio alive, or aggressive timers running in the background.
- **Custom Signposts (`os_signpost`):** Allows you to inject custom markers (e.g., "Image Download Started/Ended") directly into the Instruments timeline, so you can map business logic to CPU spikes.
- **The Golden Rule:** Always profile on a **real device** using the **Release** configuration. The Simulator uses your Mac's CPU and memory, which hides actual performance problems.

## 2. Common Interview Questions
- **Q: What is the first thing you check when a screen feels laggy?**
  - A: I check if heavy computation, parsing, or synchronous I/O is accidentally running on the Main Thread instead of a background queue.
- **Q: What does "Invert Call Tree" do in the Time Profiler?**
  - A: It flips the stack trace upside down so the deepest functions (the ones doing the actual heavy lifting) bubble up to the top of the list, making bottlenecks obvious.
- **Q: Why should you avoid using `print()` heavily in production?**
  - A: `print()` performs synchronous I/O and locks. In tight loops, it severely degrades performance and causes CPU spikes.
- **Q: What causes "Offscreen Rendering"?**
  - A: Combining multiple visual effects (like corner radius, shadows, and masking) forces the GPU to stop and composite the layer in a separate offscreen buffer before displaying it, dropping the frame rate.

## 3. Quick Self-Check
- [ ] Can I distinguish between a memory leak and a logical leak (unbounded allocation)?
- [ ] Do I know how to use `DispatchQueue.global().async` to fix a Main Thread hang?
- [ ] Can I explain why profiling on the Simulator is a bad idea?
- [ ] Do I understand how `os_signpost` helps correlate business logic to system performance?
