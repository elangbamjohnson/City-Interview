import Foundation

// MARK: - 🌍 Background URLSession
//
// 💡 INTERVIEW TALKING POINTS:
//
// ==========================================
// 1. What is a Background Session?
// ==========================================
// It allows network tasks (like downloading a large video or uploading a big file) to continue even if your app is suspended, in the background, or completely terminated by the OS.
// The operating system (specifically an out-of-process daemon) takes over the transfer.
//
// ==========================================
// 2. Key Differences from Default Sessions
// ==========================================
// • Requires a unique identifier: `URLSessionConfiguration.background(withIdentifier: "com.app.background")`
// • MUST use Delegate-based URLSession (URLSessionDownloadDelegate / URLSessionTaskDelegate). You CANNOT use closure-based completion handlers for background tasks because closures cannot be serialized and restored if the app is terminated.
// • App Wake-Up: When a background task finishes, the OS wakes your app up in the background by calling `application(_:handleEventsForBackgroundURLSession:completionHandler:)` in the AppDelegate (or SceneDelegate equivalent).
//
// ==========================================
// 3. Simple Code Example
// ==========================================

class BackgroundSessionDemonstrator: NSObject, URLSessionDownloadDelegate {
    
    private var session: URLSession!
    
    override init() {
        super.init()
        // 1. Create a background configuration with a unique identifier
        let config = URLSessionConfiguration.background(withIdentifier: "com.cityinterview.backgroundDownload")
        
        // Optional: Optimize for battery and network
        // Lets iOS schedule the download when it's best (e.g., on Wi-Fi, plugged in)
        config.isDiscretionary = true 
        
        // Wakes the app when complete
        config.sessionSendsLaunchEvents = true 
        
        // 2. Create the session WITH a delegate. Background sessions require delegates!
        self.session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }
    
    func startBackgroundDownload(from url: URL) {
        // Create a download task (must be download or upload task for background sessions)
        let task = session.downloadTask(with: url)
        task.resume()
        print("Started background download. You can background the app now!")
    }
    
    // MARK: - URLSessionDownloadDelegate Methods
    
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        // 3. Handle completion
        // The `location` is a temporary URL. You MUST move it to a permanent location (like the Documents directory) synchronously before this method returns.
        print("Download finished! File temporarily at: \(location.path)")
        
        // (Example: Use FileManager to move the file here)
    }
    
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        // Track progress here
        let progress = Double(totalBytesWritten) / Double(totalBytesExpectedToWrite)
        print("Download progress: \(progress * 100)%")
    }
    
    func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
        // 4. Notify the system that we are done handling the background events
        // You would typically call the saved completion handler from your AppDelegate here.
        print("All background events handled. Ready to sleep again.")
    }
}

// ==========================================
// 🎙️ Interview Summary Rule & One-liner
// ==========================================
// Simple rule to remember:
// "Background sessions let the OS handle big downloads/uploads. They require a unique identifier and MUST use a Delegate (no closures). When finished, the OS wakes your app in the background via the AppDelegate, and you must move the downloaded file out of its temporary location immediately."
//
// One-liner for interview:
// "For large background transfers, I use URLSessionConfiguration.background with an identifier, ensuring I implement URLSessionDelegate since closures aren't supported across app terminations, and I handle the completion handler in the AppDelegate to tell the OS when I'm done processing the downloaded file."
