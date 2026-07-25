import Foundation
import os.log

// MARK: - 🏷️ Signposts & Custom Instruments
//
// 💡 INTERVIEW TALKING POINTS:
// • Why Custom Signposts? Instruments natively shows you system-level activity (CPU spikes, memory allocs). But it doesn't know YOUR business logic. Signposts let you inject custom markers (e.g., "ImageDecodeStarted", "ImageDecodeEnded") directly into the Instruments timeline.
// • Correlation: When you see a massive CPU spike in the Time Profiler, a custom signpost sitting directly above it on the timeline instantly tells you exactly which of your functions caused the spike.
// • OSLog / Logger: Modern Swift uses `OSLog` (or the `Logger` API in iOS 14+) for high-performance, low-overhead logging.

class SignpostDemonstrator {
    
    // 1. Create a custom log object with the `.signpost` category.
    // The subsystem is usually your bundle identifier.
    let logger = OSLog(subsystem: "com.city.interview", category: .pointsOfInterest)
    
    func processImage(imageID: String) {
        
        // 2. Mark the BEGINNING of an important operation.
        // The `os_signpost` function emits an event to the Instruments timeline.
        let signpostID = OSSignpostID(log: logger)
        os_signpost(.begin, log: logger, name: "ImageProcessing", signpostID: signpostID, "Processing image ID: %{public}s", imageID)
        
        // 3. Simulate heavy business logic
        Thread.sleep(forTimeInterval: 0.5)
        
        // 4. Mark the END of the operation.
        // Instruments will now draw a beautiful visual block on the timeline showing exactly how long this took.
        os_signpost(.end, log: logger, name: "ImageProcessing", signpostID: signpostID, "Finished image ID: %{public}s", imageID)
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why use `os_signpost` instead of standard `print()` statements for profiling?
//   A: `print()` is incredibly slow, blocking, and only outputs to the console. `os_signpost` is highly optimized for performance, can be left in production code safely, and integrates visually into the Instruments GUI timeline.
// • Q: What does `%{public}s` mean in the signpost format string?
//   A: Apple redacts variables in OSLog by default for user privacy (they appear as `<private>`). Adding `public` explicitly tells the system it is safe to log this variable in clear text.
