import Foundation

// MARK: - 🔋 Energy Log
//
// 💡 INTERVIEW TALKING POINTS:
// • What it tracks: The Energy Log instrument tracks anything that severely drains the user's battery: CPU waking up constantly, keeping the GPS radio active, or leaving the Network radio turned on unnecessarily.
// • Common Offenders: 
//   1. Polling a server every 2 seconds instead of using WebSockets or Push Notifications.
//   2. Requesting high-accuracy continuous GPS Location updates (`kCLLocationAccuracyBestForNavigation`) when `kCLLocationAccuracyHundredMeters` is enough.
//   3. Leaving a `Timer` firing rapidly in the background.
// • Why it matters: Users actively monitor the iOS Battery Settings page. If your app consistently ranks as a top battery drainer, they will uninstall it. Severe energy issues can also cause App Store Review rejections.

// ==========================================
// ❌ BUGGY: Aggressive Polling (Battery Drain)
// ==========================================
class BadEnergyConsumer {
    var timer: Timer?
    
    func startAggressivePolling() {
        // Wakes the CPU and Network radio every 0.1 seconds!
        // Massive energy overhead.
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            // print("Hitting the network to check for updates...")
        }
    }
}

// ==========================================
// ✅ FIXED: Event-Driven or Throttled
// ==========================================
class GoodEnergyConsumer {
    // 1. Instead of a timer, rely on APNs (Push Notifications) to wake the app silently when new data is ready.
    // 2. Or, if polling is absolutely required, debounce it and use a reasonable interval (e.g., 30 seconds),
    //    and completely stop the timer when the app enters the background!
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How does networking affect the battery?
//   A: Turning on the cellular/WiFi radio uses massive energy. If you make network calls in tiny scattered bursts, the radio never powers down. It's better to batch requests together.
// • Q: What happens to timers when the app goes into the background?
//   A: iOS suspends the app, and standard Timers stop firing entirely. If you use a background task, keeping a timer running will get your app killed by the OS watchdog.
// • Q: How do you debug battery drain from Location Services?
//   A: The Energy Log instrument specifically flags Location Services. You can fix it by using `startMonitoringSignificantLocationChanges()` instead of continuous tracking, or by reducing the accuracy constraint.
