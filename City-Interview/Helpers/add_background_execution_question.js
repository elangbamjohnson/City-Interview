const fs = require('fs');
const vm = require('vm');

const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';
const GENERATED_DOCS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Helpers/generated_docs.json';
const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

// 1. Read existing questions and docs
let questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
const generatedDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));

console.log('Current questions count:', questions.length);

// Map existing questions to their companion docs before ID shift
const textToDocs = new Map();
questions.forEach(q => {
  if (generatedDocs.QUESTION_TO_DOCS[q.id]) {
    textToDocs.set(q.question, generatedDocs.QUESTION_TO_DOCS[q.id]);
  }
});

// Harmonize category name for networking questions
questions.forEach(q => {
  if (q.id === 'Q-30' || q.id === 'Q-31' || q.id === 'Q-32') {
    q.category = "Networking, APIs & Background Tasks";
  }
});

// 2. Define the new Background Execution question
const newQuestion = {
  id: "Q-33",
  category: "Networking, APIs & Background Tasks",
  difficulty: "Advanced",
  question: "What does background execution allow?",
  interviewSentence: "Background execution allows an app a limited window to work while off-screen—short tasks use beginBackgroundTask, deferred work uses BGTaskScheduler, out-of-process transfers use background URLSession, and calls use VoIP push with CallKit—treated strictly as an OS favor, not a right.",
  answer: `When the user leaves your app, iOS suspends it, so your code stops running. Background execution is how an app still gets a little time to work while it is not on screen. It is used for things like syncing data, uploading a photo, downloading a file, updating content, or receiving a VoIP call. iOS controls it strictly to save battery, so each API fits one kind of job.

Say it like this:
"By default, when the user leaves the app, it is suspended and my code stops. Background execution lets me get a short, limited time to run, and each API is for a different job.

For a short task that must finish, like saving data, I use beginBackgroundTask. I get around 30 seconds. For work that I want iOS to run later, I use BGTaskScheduler. A refresh task is short and good for fetching fresh content. A processing task is longer and good for cleanup or syncing, and iOS usually runs it when the device is charging and on Wi-Fi. I ask for it, but iOS decides when. For big uploads and downloads, I use a background URLSession. The system does the transfer for me, even if my app is suspended or closed, and wakes my app when it is done. For a signal from my server, I use a silent push with content-available, which gives me about 30 seconds to fetch data, but it is not guaranteed. And for calls, I use VoIP push with PushKit, which wakes my app right away, but I must report the call to CallKit immediately, or iOS kills the app and can stop sending me pushes.

The main idea is: background time is a favor from the system, not a right. I never depend on it for anything critical."

The 5 Core Background Execution Pillars:
1. Finish a Short In-Flight Task (beginBackgroundTask): Requests a brief grace period (~30 seconds) to complete critical work (e.g. saving state, flushing write-ahead logs, or finishing a transaction) before suspension.
2. Scheduled Deferred Work (BGTaskScheduler):
   • BGAppRefreshTask: Short fetch window (<30s) to refresh feeds and cache before user wakes.
   • BGProcessingTask: Long-running task (several minutes) scheduled when charging and on Wi-Fi for heavy database indexing or syncing.
3. Out-of-Process Transfers (Background URLSession): Handled by nsurlsessiond system daemon. Continues even if the app crashes, is suspended, or is Jetsam-killed. Wakes the app via handleEventsForBackgroundURLSession upon completion.
4. Server-Triggered Wakeups (Silent Push Notification): APNs payload with content-available: 1 wakes the app with ~30s execution window. Strictly rate-limited by the OS.
5. Incoming VoIP Audio (PushKit + CallKit): High-priority wake. Under iOS 13+, every VoIP push MUST report to CallKit immediately via reportNewIncomingCall or iOS terminates the app and revokes VoIP entitlements.

Quick comparison:
• beginBackgroundTask: Finish a short job, about 30 seconds.
• BGAppRefreshTask: Short refresh, iOS picks the time based on user habits.
• BGProcessingTask: Longer work, usually runs when device is charging and idle.
• Background URLSession: Big transfers, works out-of-process even if app is closed.
• Silent push: Server asks the app to fetch delta data, not guaranteed.
• VoIP push: Wakes the app for incoming calls, must use CallKit immediately.

Good to mention:
• Background Modes in Info.plist: Add required identifiers to BGTaskSchedulerPermittedIdentifiers.
• Force-Quit Behavior: If the user force-quits the app from the App Switcher, iOS cancels background refresh and silent pushes until the next manual launch.
• Expiration Handlers: Always assign expirationHandler to BGTask and pass an expiration closure to beginBackgroundTask to prevent 0x8badf00d watchdog crashes and OS budget penalties.
• Xcode Debugger Simulation: Test BGTaskScheduler in LLDB using:
  e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.app.refresh"]
• Low Power Mode: Heavily throttles or disables background fetch, discretionary transfers, and processing tasks.

One-liner: Background time is a limited favor from iOS: short tasks use beginBackgroundTask, later work uses BGTaskScheduler, big transfers use background URLSession, and calls use VoIP push.`,
  codeExample: `// =========================================================================
// SENIOR INTERVIEW ARCHITECTURE: The 5 Pillars of iOS Background Execution
// =========================================================================
import UIKit
import BackgroundTasks
import PushKit
import CallKit

// =========================================================================
// 1. FINISH A SHORT TASK: UIApplication.beginBackgroundTask
// =========================================================================
final class AnalyticsUploader {
    func flushEventsToServer(events: [String]) {
        var taskID: UIBackgroundTaskIdentifier = .invalid

        // Request ~30s extension from UIKit before app suspension
        taskID = UIApplication.shared.beginBackgroundTask(withName: "FlushAnalytics") {
            // Expiration handler: OS signals that time is exhausted
            // SENIOR TALKING POINT: Must call endBackgroundTask or watchdogs kill the app (0x8badf00d)
            UIApplication.shared.endBackgroundTask(taskID)
            taskID = .invalid
        }

        // Perform async work
        Task {
            defer {
                if taskID != .invalid {
                    UIApplication.shared.endBackgroundTask(taskID)
                    taskID = .invalid
                }
            }
            try? await sendPayloadToServer(events)
        }
    }

    private func sendPayloadToServer(_ events: [String]) async throws {}
}

// =========================================================================
// 2. SCHEDULE WORK FOR LATER: BGTaskScheduler (Refresh & Processing)
// =========================================================================
final class BackgroundSyncManager {
    static let shared = BackgroundSyncManager()
    static let refreshTaskID = "com.citi.app.refresh"
    static let processingTaskID = "com.citi.app.processing"

    // Register at application launch before didFinishLaunching finishes!
    func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: Self.refreshTaskID, using: nil) { task in
            self.handleAppRefresh(task: task as! BGAppRefreshTask)
        }

        BGTaskScheduler.shared.register(forTaskWithIdentifier: Self.processingTaskID, using: nil) { task in
            self.handleHeavyProcessing(task: task as! BGProcessingTask)
        }
    }

    // Schedule next refresh window
    func scheduleAppRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: Self.refreshTaskID)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // Earliest 15 mins
        try? BGTaskScheduler.shared.submit(request)
    }

    // Schedule heavy overnight sync
    func scheduleNightlyProcessing() {
        let request = BGProcessingTaskRequest(identifier: Self.processingTaskID)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = true // Runs when plugged in overnight
        try? BGTaskScheduler.shared.submit(request)
    }

    private func handleAppRefresh(task: BGAppRefreshTask) {
        scheduleAppRefresh() // Schedule next iteration immediately

        let workTask = Task {
            let success = await syncAccountLedger()
            task.setTaskCompleted(success: success)
        }

        // Handle expiration gracefully if OS revokes time
        task.expirationHandler = {
            workTask.cancel()
        }
    }

    private func handleHeavyProcessing(task: BGProcessingTask) {
        let workTask = Task {
            await compactDatabaseAndCleanCache()
            task.setTaskCompleted(success: true)
        }
        task.expirationHandler = { workTask.cancel() }
    }

    private func syncAccountLedger() async -> Bool { return true }
    private func compactDatabaseAndCleanCache() async {}
}

// =========================================================================
// 3. OUT-OF-PROCESS TRANSFERS: Background URLSession
// =========================================================================
final class BackgroundDownloadService: NSObject, URLSessionDownloadDelegate {
    private lazy var backgroundSession: URLSession = {
        let config = URLSessionConfiguration.background(withIdentifier: "com.citi.app.bgdownload")
        config.isDiscretionary = true // Lets iOS defer transfer to Wi-Fi / power optimal times
        config.sessionSendsLaunchEvents = true
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()

    var backgroundCompletionHandler: (() -> Void)?

    func startLargeExport(url: URL) {
        let downloadTask = backgroundSession.downloadTask(with: url)
        downloadTask.resume()
    }

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        // Move file from temporary location
    }

    func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
        DispatchQueue.main.async {
            // Notify OS that background session UI events have completed
            self.backgroundCompletionHandler?()
            self.backgroundCompletionHandler = nil
        }
    }
}

// =========================================================================
// 4. SERVER TRIGGER: Silent Push (aps: { content-available: 1 })
// =========================================================================
// In AppDelegate:
// func application(_ application: UIApplication,
//                  didReceiveRemoteNotification userInfo: [AnyHashable: Any]) async -> UIBackgroundFetchResult {
//     let hasNewData = await DataSyncManager.fetchDelta()
//     return hasNewData ? .newData : .noData
// }

// =========================================================================
// 5. INCOMING CALLS: PushKit & Mandatory CallKit Reporting
// =========================================================================
final class VoIPPushHandler: NSObject, PKPushRegistryDelegate {
    private let callProvider = CXProvider(configuration: CXProviderConfiguration())

    func setupVoIP() {
        let registry = PKPushRegistry(queue: .main)
        registry.delegate = self
        registry.desiredPushTypes = [.voIP]
    }

    func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
        // CRITICAL INTERVIEW RULE (iOS 13+):
        // Every VoIP push MUST report to CallKit immediately! If you fail to report,
        // iOS will immediately kill the app and permanently revoke VoIP push privileges.
        let callUpdate = CXCallUpdate()
        callUpdate.remoteHandle = CXHandle(type: .generic, value: "Advisor Call")
        callUpdate.hasVideo = false

        callProvider.reportNewIncomingCall(with: UUID(), update: callUpdate) { error in
            completion()
        }
    }
}`
};

// 3. Insert question right after Q-32 (Push Notifications & Background Tasks)
const insertIndex = questions.findIndex(q => q.id === 'Q-32') + 1;
console.log('Inserting at index:', insertIndex);
questions.splice(insertIndex, 0, newQuestion);

// Re-index all questions sequentially Q-01 to Q-68
questions.forEach((q, idx) => {
  q.id = `Q-${String(idx + 1).padStart(2, '0')}`;
});

console.log('New total questions count:', questions.length);
console.log('Inserted question ID:', questions[insertIndex].id, questions[insertIndex].question);

// 4. Save questions.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
console.log('Saved questions.json successfully!');

// 5. Re-map QUESTION_TO_DOCS with shifted IDs
const updatedQToDocs = {};
const bgDocs = [
  {
    docId: "networking-architecture",
    title: "Networking Architecture Decision Table & 4 Pillars",
    icon: "🌐",
    filename: "NetworkingArchitecture-DecisionTable.md"
  }
];

questions.forEach(q => {
  if (q.question.includes('background execution allow')) {
    updatedQToDocs[q.id] = bgDocs;
  } else if (textToDocs.has(q.question)) {
    updatedQToDocs[q.id] = textToDocs.get(q.question);
  }
});

generatedDocs.QUESTION_TO_DOCS = updatedQToDocs;
fs.writeFileSync(GENERATED_DOCS_PATH, JSON.stringify(generatedDocs, null, 2), 'utf-8');
console.log('Saved generated_docs.json successfully!');

// 6. Define updated TOPIC_CATEGORIES
const TOPIC_CATEGORIES = [
  {
    id: "architecture",
    title: "Architecture & Design Patterns",
    shortTitle: "Architecture",
    icon: "🏗️",
    color: "#D97757",
    summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles.",
    docIds: ["clean-architecture", "coordinator-pattern", "dependency-injection", "mvvm", "repository-pattern", "solid-principles", "viper-pattern"],
    questionIds: ["Q-01", "Q-02", "Q-03", "Q-04", "Q-05"]
  },
  {
    id: "concurrency",
    title: "Swift Concurrency & Multithreading",
    shortTitle: "Swift Concurrency",
    icon: "⚡",
    color: "#D49544",
    summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions.",
    docIds: ["multithreading-gcd", "concurrency-issues", "thread-safety", "operation-queue"],
    questionIds: ["Q-06", "Q-07", "Q-08", "Q-09", "Q-10", "Q-11", "Q-12"]
  },
  {
    id: "core-advance-swift",
    title: "Core Swift & Language Internals",
    shortTitle: "Core & Advance Swift",
    icon: "🚀",
    color: "#8E5B70",
    summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops.",
    docIds: ["ios-internals", "swiftui-state"],
    questionIds: ["Q-13", "Q-14", "Q-15", "Q-16", "Q-17", "Q-18"]
  },
  {
    id: "swift-basics-ui",
    title: "SwiftUI & UIKit Layout",
    shortTitle: "UI & Layout",
    icon: "🎨",
    color: "#C15F3D",
    summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), iPad adaptive layouts, internationalization & RTL, UICollectionView diffable data sources & compositional layouts, atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, and UIKit interoperability.",
    docIds: ["autolayout-basics", "composable-ui", "design-system", "swiftui-uikit-interop", "swiftui-state"],
    questionIds: ["Q-19", "Q-20", "Q-21", "Q-22", "Q-23", "Q-24", "Q-25", "Q-26", "Q-27", "Q-28"]
  },
  {
    id: "combine-reactive",
    title: "Combine & Reactive Streams",
    shortTitle: "Combine & Streams",
    icon: "🌊",
    color: "#4D7C8A",
    summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles.",
    docIds: [],
    questionIds: ["Q-29"]
  },
  {
    id: "networking",
    title: "Networking, APIs & Background Tasks",
    shortTitle: "Networking & APIs",
    icon: "🌐",
    color: "#5A7D65",
    summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler.",
    docIds: ["networking-architecture"],
    questionIds: ["Q-30", "Q-31", "Q-32", "Q-33"]
  },
  {
    id: "modularity-performance",
    title: "Modularity, Build & Launch Performance",
    shortTitle: "Modularity & Perf",
    icon: "📦",
    color: "#7E6E5C",
    summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.",
    docIds: ["modular-architecture", "performance-profiling"],
    questionIds: ["Q-34", "Q-35", "Q-36", "Q-37", "Q-38"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#7C5379",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-39", "Q-40", "Q-41", "Q-42"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#B84A39",
    summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "leadership-ownership"],
    questionIds: ["Q-43", "Q-44", "Q-45", "Q-46", "Q-47", "Q-48", "Q-49"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#A34836",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-50", "Q-51"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#4A7C94",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-52", "Q-53", "Q-54", "Q-55", "Q-56", "Q-57", "Q-58", "Q-59"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#B07038",
    summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: [],
    questionIds: ["Q-60"]
  },
  {
    id: "memory-management",
    title: "Memory Management",
    shortTitle: "Memory Mgmt",
    icon: "🧠",
    color: "#477C6B",
    summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit.",
    docIds: [],
    questionIds: ["Q-61", "Q-62", "Q-63", "Q-64", "Q-65", "Q-66", "Q-67", "Q-68"]
  }
];

// 7. Regenerate QUESTIONS.md
const topicMeta = {
  "Architecture & Design Patterns": { icon: "🏗️", summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles." },
  "Swift Concurrency & Multithreading": { icon: "⚡", summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions." },
  "Core Swift & Language Internals": { icon: "🚀", summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops." },
  "SwiftUI & UIKit Layout": { icon: "🎨", summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), iPad adaptive layouts, internationalization & RTL, UICollectionView diffable data sources & compositional layouts, atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, Property Wrappers (@State, @Binding, @Published), and UIKit interoperability." },
  "Combine & Reactive Streams": { icon: "🌊", summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles." },
  "Networking, APIs & Background Tasks": { icon: "🌐", summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler." },
  "Modularity, Build & Launch Performance": { icon: "📦", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Data Persistence, SwiftData & Memory Deep Dive": { icon: "💾", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Security, App Hardening & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "System Design & Mobile Architecture": { icon: "🏛️", summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution." },
  "Testing, CI/CD & AI Engineering": { icon: "🧪", summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems." },
  "Engineering Leadership & Operations": { icon: "👔", summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern." },
  "Memory Management": { icon: "🧠", summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit." }
};

const diffBadge = {
  "Staff": "🟣 `Staff`",
  "Advanced": "🔴 `Advanced`",
  "Intermediate": "🔵 `Intermediate`",
  "Beginner": "🟢 `Beginner`"
};

const catGroups = {};
for (const q of questions) {
  if (!catGroups[q.category]) catGroups[q.category] = [];
  catGroups[q.category].push(q);
}

const mdLines = [];
mdLines.push("# 📱 iOS Senior & Staff Interview Question Bank");
mdLines.push("");
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, UICollectionView Diffable Data Sources & Compositional Layouts, Background Execution APIs, Memory Management, System Design, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
mdLines.push("");
mdLines.push("## 📊 Overview");
mdLines.push("");
mdLines.push("| Category / Topic | Questions | Key Coverage |");
mdLines.push("|---|:---:|---|");

for (const [cat, qList] of Object.entries(catGroups)) {
  const summary = topicMeta[cat]?.summary || "";
  mdLines.push(`| **${cat}** | \`${qList.length}\` | ${summary} |`);
}

mdLines.push(`| **Total** | **\`${questions.length}\`** | Complete Senior & Staff iOS Interview Curriculum |`);
mdLines.push("");
mdLines.push("---");
mdLines.push("");

for (const [cat, qList] of Object.entries(catGroups)) {
  const meta = topicMeta[cat] || { icon: "📌", summary: "" };
  const startId = qList[0].id;
  const endId = qList[qList.length - 1].id;
  const rangeStr = startId !== endId ? `(${startId} – ${endId})` : `(${startId})`;
  mdLines.push(`## ${meta.icon} ${cat} ${rangeStr}`);
  mdLines.push("");
  mdLines.push(`> ${meta.summary}`);
  mdLines.push("");

  for (const q of qList) {
    mdLines.push(`### \`${q.id}\` — ${q.question}`);
    mdLines.push("");
    mdLines.push(`- **Difficulty:** ${diffBadge[q.difficulty] || q.difficulty}`);
    mdLines.push(`- **Category:** \`${q.category}\``);
    mdLines.push("");
    mdLines.push("> [!TIP]");
    mdLines.push("> **🗣️ Interview Pitch (Say it like this):**  ");
    mdLines.push(`> *"${q.interviewSentence}"*`);
    mdLines.push("");
    mdLines.push("#### 📖 Detailed Answer");
    mdLines.push("");
    mdLines.push(q.answer);
    mdLines.push("");
    mdLines.push("#### 💻 Swift Code Example");
    mdLines.push("");
    mdLines.push("```swift");
    mdLines.push(q.codeExample);
    mdLines.push("```");
    mdLines.push("");
    mdLines.push("---");
    mdLines.push("");
  }
}

fs.writeFileSync(QUESTIONS_MD_PATH, mdLines.join("\n"), 'utf-8');
console.log('Regenerated QUESTIONS.md successfully!');

// 8. Rebuild index.html
let indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');

// Update badges & counts
indexHtml = indexHtml.replace(/\d+ Questions · 24 Guides/g, `${questions.length} Questions · 24 Guides`);
indexHtml = indexHtml.replace(/\d+ Curated Questions/g, `${questions.length} Curated Questions`);
indexHtml = indexHtml.replace(/All \(\d+\)/g, `All (${questions.length})`);
indexHtml = indexHtml.replace(/All Difficulties \(\d+\)/g, `All Difficulties (${questions.length})`);
indexHtml = indexHtml.replace(/Advanced \(\d+\)/g, `Advanced (29)`);

// Update embedded arrays
const scriptOpen = indexHtml.indexOf('<script>');
const scriptClose = indexHtml.lastIndexOf('</script>');
const preScript = indexHtml.substring(0, scriptOpen);
const postScript = indexHtml.substring(scriptClose + 9);
const scriptBody = indexHtml.substring(scriptOpen + 8, scriptClose);

// Replace QUESTIONS, QUESTION_TO_DOCS, TOPIC_CATEGORIES safely using function callbacks
let newScript = scriptBody;
newScript = newScript.replace(
  /const QUESTIONS = \[[\s\S]*?\];\n/,
  () => `const QUESTIONS = ${JSON.stringify(questions)};\n`
);
newScript = newScript.replace(
  /const QUESTION_TO_DOCS = \{[\s\S]*?\};\n/,
  () => `const QUESTION_TO_DOCS = ${JSON.stringify(generatedDocs.QUESTION_TO_DOCS)};\n`
);
newScript = newScript.replace(
  /const TOPIC_CATEGORIES = \[[\s\S]*?\];\n/,
  () => `const TOPIC_CATEGORIES = ${JSON.stringify(TOPIC_CATEGORIES)};\n`
);

// Validate newScript syntax
try {
  new vm.Script(newScript, { filename: 'dashboard-bundle.js' });
  console.log('VALIDATION PASSED: 100% Valid JavaScript Syntax! No errors!');
} catch (e) {
  console.error('VALIDATION FAILED in newScript:', e);
  process.exit(1);
}

const finalHtml = `${preScript}<script>${newScript}</script>${postScript}`;
fs.writeFileSync(INDEX_PATH, finalHtml, 'utf-8');
console.log(`Successfully updated index.html with all ${questions.length} questions!`);
console.log(`Total lines: ${finalHtml.split('\n').length}, bytes: ${finalHtml.length}`);
