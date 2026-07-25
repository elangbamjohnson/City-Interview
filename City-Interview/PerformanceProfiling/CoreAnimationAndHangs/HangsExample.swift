import UIKit

// MARK: - 🥶 Core Animation & Hangs
//
// 💡 INTERVIEW TALKING POINTS:
// • Core Animation Instrument: Measures frame rate (FPS) and dropped frames. It highlights expensive rendering operations, like Offscreen Rendering (caused by combining `.cornerRadius`, shadows, and `.masksToBounds` without `shouldRasterize`).
// • What is a Hang? In Instruments and MetricKit, a "Hang" occurs when the Main Thread is blocked for an extended period (typically >250ms), causing the app to freeze and stop responding to user input.
// • Why use the Hangs instrument? When QA or users complain that the "app feels janky or freezes randomly," the Hangs instrument directly pinpoints the exact line of code that blocked the main thread.

class HangsDemonstratorViewController: UIViewController {
    
    // ==========================================
    // ❌ BUGGY: Synchronous I/O on Main Thread
    // ==========================================
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Anti-pattern: Doing heavy parsing or I/O directly in viewDidLoad.
        // This will block the push navigation transition, causing a severe Hang.
        let filePath = Bundle.main.path(forResource: "MassiveJSON", ofType: "json")
        if let path = filePath, let data = try? Data(contentsOf: URL(fileURLWithPath: path)) {
            // This blocking call halts the UI for 300+ ms.
            print("Loaded \(data.count) bytes on the main thread.")
        }
    }
    
    // ==========================================
    // ✅ FIXED: Offloaded to Background
    // ==========================================
    func safeViewDidLoadAlternative() {
        // Show a loading spinner immediately
        
        DispatchQueue.global(qos: .userInitiated).async {
            // Read disk/parse JSON in the background
            let filePath = Bundle.main.path(forResource: "MassiveJSON", ofType: "json")
            if let path = filePath, let data = try? Data(contentsOf: URL(fileURLWithPath: path)) {
                
                DispatchQueue.main.async {
                    // Hide spinner, update UI
                    print("Loaded \(data.count) bytes safely.")
                }
            }
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: What causes "Offscreen Rendering" and why is it bad?
//   A: It happens when the GPU has to stop and allocate a separate offscreen buffer to composite complex layers (like a view with both rounded corners and a drop shadow) before drawing it to the screen. It drops FPS.
// • Q: How does the Hangs instrument differ from the Time Profiler?
//   A: Time Profiler shows ALL CPU work. The Hangs instrument specifically isolates moments where the Main Thread was unresponsive to events, making it much faster to diagnose "freezes."
// • Q: What is MetricKit?
//   A: An Apple framework that gathers on-device performance metrics (including Hangs and Battery Drain) from real users in production and sends the reports back to your server.
