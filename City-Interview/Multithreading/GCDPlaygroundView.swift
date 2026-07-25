import SwiftUI
import Combine

// MARK: - GCD Interview Prep Guide
// This playground demonstrates the 3 most common concurrency pattern requests in iOS interviews using GCD:
// 1. Basic queue switching (offloading work from the Main Thread).
// 2. DispatchGroup (waiting for multiple concurrent tasks to finish).
// 3. DispatchSemaphore (throttling or limiting resource access).

struct Post: Codable, Identifiable {
    let id: Int
    let title: String
    let body: String
}

class GCDNetworkViewModel: ObservableObject {
    @Published var posts: [Post] = []
    @Published var log: [String] = []
    
    /// Thread-safe helper to append log messages.
    /// Since multiple background threads will call this, we force log updates onto the main queue.
    func appendLog(_ msg: String) {
        let t = Date().formatted(date: .omitted, time: .standard)
        DispatchQueue.main.async { self.log.append("[\(t)] \(msg)") }
    }
    
    // MARK: - 1. Basic Queue Switching (global -> main)
    /// INTERVIEW TOPIC: Why queue switch?
    /// - We perform blocking network/data work on a background concurrent queue (`DispatchQueue.global`).
    /// - We MUST return to the main queue (`DispatchQueue.main.async`) to update `@Published` variables that drive UI rendering.
    /// - QoS `.userInitiated` tells the OS scheduling engine that the user is actively waiting for this, prioritizing CPU resources.
    func fetchBasic() {
        log = []; posts = []
        appendLog("🟢 Dispatching to global queue...")
        
        // 1. Hop onto a background thread
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            self.appendLog("📡 On background thread: \(Thread.current)")
            
            let url = URL(string: "https://jsonplaceholder.typicode.com/posts?_limit=5")!
            
            // NOTE: Data(contentsOf:) is a synchronous, blocking network call. 
            // Running this on the main thread would freeze the UI (Watchdog warning/termination).
            // It is safe to use here because we are on a background thread.
            let data = try? Data(contentsOf: url)
            
            if let data = data, let posts = try? JSONDecoder().decode([Post].self, from: data) {
                self.appendLog("✅ Got \(posts.count) posts")
                
                // 2. Hop back to the Main Queue to update UI state
                DispatchQueue.main.async {
                    self.appendLog("🖥️ Updating UI on main thread")
                    self.posts = posts
                }
            }
        }
    }
    
    // MARK: - 2. DispatchGroup (Parallelism & Synchronization)
    /// INTERVIEW TOPIC: How to combine multiple concurrent calls?
    /// - `DispatchGroup` tracks a set of concurrent tasks.
    /// - `enter()` increments the task counter.
    /// - `leave()` decrements the task counter.
    /// - `notify(queue:)` executes its block when the counter reaches 0 (all tasks completed).
    /// - WARNING: Every `enter()` MUST have a matching `leave()`, or the group will never notify.
    func fetchWithGroup() {
        log = []; posts = []
        let group = DispatchGroup()
        var allPosts: [Post] = []
        
        let urls = [
            "https://jsonplaceholder.typicode.com/posts?_limit=3",
            "https://jsonplaceholder.typicode.com/posts?_start=10&_limit=2"
        ]
        
        for (i, urlString) in urls.enumerated() {
            // Increment task count BEFORE launching the async thread block
            group.enter()
            
            DispatchQueue.global().async { [weak self] in
                guard let self = self else { return }
                self.appendLog("📡 API \(i+1) started")
                let url = URL(string: urlString)!
                if let data = try? Data(contentsOf: url),
                   let posts = try? JSONDecoder().decode([Post].self, from: data) {
                    // Standard practice is to protect array mutations on the main thread
                    DispatchQueue.main.async { allPosts.append(contentsOf: posts) }
                }
                self.appendLog("✅ API \(i+1) done")
                
                // Decrement task count when thread block completes
                group.leave()
            }
        }
        
        // This callback is dispatched automatically when the group tasks count drops to 0.
        // We tell it to run on the main queue since we will update the UI model.
        group.notify(queue: .main) {
            self.appendLog("🎯 Both APIs done → \(allPosts.count) total posts")
            self.posts = allPosts
        }
    }
    
    // MARK: - 3. DispatchSemaphore (Resource Throttling)
    /// INTERVIEW TOPIC: How to throttle concurrent tasks or limit access to shared resources?
    /// - `DispatchSemaphore` manages a thread-safe counter.
    /// - `value: 1` limits access to only 1 thread at a time (like a mutual exclusion lock / mutex).
    /// - `wait()` decrements the value. If the value becomes negative, the calling thread is BLOCKED until another thread signals.
    /// - `signal()` increments the value, waking up any thread waiting in the queue.
    /// - WARNING: Never call `wait()` on the main thread, as it will freeze the application.
    func fetchWithSemaphore() {
        log = []; posts = []
        
        // Value: 1 creates a binary semaphore (acting as a mutual exclusion lock)
        let semaphore = DispatchSemaphore(value: 1)
        var allPosts: [Post] = []
        
        let urls = [
            "https://jsonplaceholder.typicode.com/posts/1",
            "https://jsonplaceholder.typicode.com/posts/2",
            "https://jsonplaceholder.typicode.com/posts/3"
        ]
        
        // We must launch a background worker queue, because wait() will block the thread it runs on.
        DispatchQueue.global().async { [weak self] in
            guard let self = self else { return }
            for (i, urlString) in urls.enumerated() {
                // Blocks here until semaphore value is > 0, then decrements it.
                semaphore.wait()
                self.appendLog("🔒 Slot acquired for request \(i+1)")
                
                let url = URL(string: urlString)!
                if let data = try? Data(contentsOf: url),
                   let post = try? JSONDecoder().decode(Post.self, from: data) {
                    DispatchQueue.main.async { allPosts.append(post) }
                    self.appendLog("✅ Post \(post.id): \(post.title.prefix(30))...")
                }
                
                // Increments the semaphore value, signaling any waiting thread to proceed.
                semaphore.signal()
                self.appendLog("🔓 Slot released")
            }
            
            DispatchQueue.main.async {
                self.appendLog("🎯 All \(allPosts.count) posts fetched sequentially")
                self.posts = allPosts
            }
        }
    }
}

// MARK: - View

struct GCDPlaygroundView: View {
    @StateObject private var vm = GCDNetworkViewModel()
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                
                // Buttons
                Group {
                    Button("1. Basic Fetch (global → main)") { vm.fetchBasic() }
                    Button("2. DispatchGroup (2 APIs → combine)") { vm.fetchWithGroup() }
                    Button("3. Semaphore (1 at a time)") { vm.fetchWithSemaphore() }
                }
                .font(.system(size: 18, weight: .semibold))
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(Color(UIColor.secondarySystemGroupedBackground))
                .cornerRadius(10)
                
                // Console log
                if !vm.log.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(vm.log, id: \.self) { line in
                            Text(line)
                                .font(.system(size: 14, design: .monospaced))
                                .foregroundColor(.green)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color.black)
                    .cornerRadius(10)
                }
                
                // Results
                ForEach(vm.posts) { post in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(post.title).font(.system(size: 17, weight: .semibold))
                        Text(post.body).font(.system(size: 15)).foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemGroupedBackground))
                    .cornerRadius(10)
                }
            }
            .padding()
        }
        .navigationTitle("GCD Network Examples")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView { GCDPlaygroundView() }
}

