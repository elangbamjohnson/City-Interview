// MARK: - 📊 Instruments Quick Lookup Table
//
// 💡 INTERVIEW CHEAT SHEET: "Which instrument do I use?"
//
// Symptom                  | Instrument to Use
// -------------------------|--------------------------------------
// "App feels laggy"        | Time Profiler (Finds CPU bottlenecks)
// "App freezes briefly"    | Hangs (Finds main thread blocks > 250ms)
// "Memory keeps growing"   | Allocations (Finds logical leaks / caching issues)
// "Memory crashes / OOM"   | Leaks (Finds unreachable retain cycles)
// "Scrolling is janky"     | Core Animation (Finds offscreen rendering / dropped frames)
// "Battery drains fast"    | Energy Log (Finds CPU waking, networking, GPS abuse)
//
// ==========================================
// ⚠️ THE MOST IMPORTANT RULE OF PROFILING:
// ==========================================
// NEVER profile on the Simulator.
// ALWAYS profile on a REAL DEVICE.
// ALWAYS profile using the Release configuration (or Profile action in Xcode).
//
// Why?
// The Simulator uses your Mac's CPU (which is vastly more powerful than an iPhone),
// and it does not have the same thermal throttling, memory constraints, or GPU architecture
// as a real iOS device. A heavy operation might run at 60 FPS on your Mac Simulator
// but completely freeze an older iPhone. Furthermore, Debug builds disable compiler optimizations
// which drastically skews performance results.
