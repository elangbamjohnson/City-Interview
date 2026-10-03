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

// 2. Define the new question: "What happens when the app is suspended or terminated? How do you save state?"
const newQuestion = {
  id: "Q-34",
  category: "Networking, APIs & Background Tasks",
  difficulty: "Advanced",
  question: "What happens when the app is suspended or terminated? How do you save state?",
  interviewSentence: "A suspended app can be terminated by iOS at any time without notification or deinit, so I save user data as it changes, leverage sceneDidEnterBackground with beginBackgroundTask for in-flight persistence, and restore ephemeral UI state via @SceneStorage or NSUserActivity.",
  answer: `An app moves through a few states. When the user leaves it, the app goes to background, runs a little, and then is suspended. Suspended means the app is still in memory, but no code runs. Later, iOS can terminate it to free memory, with no warning. This matters because users expect to come back and find their work still there: a half-written message, a scroll position, a form. So I save state before it is too late.

Say it like this:
"When the user leaves the app, it goes to the background, and soon after it is suspended. A suspended app stays in memory but runs no code. If iOS needs memory, it kills suspended apps, and I get no callback and no deinit. The user can also swipe the app away, and that also gives me no warning. So I cannot wait for a 'terminate' event. I must save at the right moments.

The last reliable moment is when the app moves to the background. In a scene-based app, that is sceneDidEnterBackground, or scenePhase becoming .background in SwiftUI. I save quickly there. If saving takes a bit longer, I wrap it in beginBackgroundTask, so iOS gives me extra seconds.

I treat state in two groups. First, user data, like notes, orders, and drafts. I save it to disk right when it changes, with SwiftData, Core Data, or a file, not only when the app goes to background. Second, UI state, like the selected tab, scroll position, and text in a field. For this, I use state restoration: NSUserActivity with stateRestorationActivity(for:) in UIKit, and @SceneStorage in SwiftUI. Small settings go to UserDefaults, and secrets like tokens go to the Keychain.

When the app launches again, I read the saved data and put the user back where they were. I also test it by running the app, going to the background, and killing it from Xcode, because that is what really happens in production."

Key Lifecycle States Breakdown:
• Background: App is no longer on screen but executes code for a brief grace period (~5-30s). This is your last reliable hook to finalize state.
• Suspended: App resides in RAM, but CPU execution is completely frozen. iOS can evict (terminate) suspended apps at any instant under memory pressure (Jetsam) without firing applicationWillTerminate or deinit.
• Terminated: App process is killed. Memory is reclaimed. Only persisted state survives.

State Taxonomy & Persistence Strategy:
1. User Data (Source of Truth): Notes, orders, drafts, ledger changes. Persisted immediately upon mutation using SwiftData, Core Data, or atomic file writes. Never defer crucial user data strictly to background transitions.
2. Ephemeral UI State: Selected tab, active navigation path, draft text field contents, scroll offsets. Persisted via @SceneStorage in SwiftUI or NSUserActivity / UIStateRestoring in UIKit.
3. User Preferences: Theme selection, toggle states, non-sensitive flags. Persisted via UserDefaults.
4. Secrets & Credentials: Auth tokens, biometrics, API secrets. Stored strictly in the iOS Keychain with NSFileProtectionComplete.

Quick comparison:
• Background: App is visible no more, still running briefly. Save immediately here.
• Suspended: In memory, no code runs, can be killed any time without warning.
• Terminated: Gone, no callback. Only what was already saved survives.
• User data: Save when it changes, to a database or disk file.
• UI state: @SceneStorage (SwiftUI) or NSUserActivity (UIKit).
• Small settings: UserDefaults. Secrets: Keychain.

Good to mention:
• applicationWillTerminate is practically a myth: iOS skips it entirely for suspended apps and sudden memory kills. Never rely on it for critical business logic.
• Save small and often: Continuous debounced autosaving prevents data loss during sudden app crashes or OS Jetsam kills.
• Offload heavy persistence: Perform large database writes off the main thread, wrapped in beginBackgroundTask to prevent watchdog 0x8badf00d kills.
• Memory warnings (didReceiveMemoryWarning): Purge in-memory image caches and temporary buffers immediately to avoid being top-of-list for Jetsam eviction.
• Defensive state restoration: Never restore invalid or stale state (e.g. referencing a deleted record); always provide safe fallbacks to the root screen.
• User Force-Quit: Swiping the app away clears system state restoration in some iOS versions, so user data must never rely on state restoration alone.

One-liner: A suspended app can be killed with no warning, so I save user data as it changes, save again when the app goes to background, and restore UI state with @SceneStorage or NSUserActivity.`,
  codeExample: `// =========================================================================
// SENIOR INTERVIEW ARCHITECTURE: Lifecycle States & State Restoration
// =========================================================================
import SwiftUI
import UIKit
import Security

// =========================================================================
// 1. SAVE WHEN APP TRANSITIONS TO BACKGROUND (SwiftUI & UIKit)
// =========================================================================

// SwiftUI Scene Phase Observation
struct RootAppView: View {
    @Environment(\\.scenePhase) private var scenePhase
    @StateObject private var ledgerStore = AccountLedgerStore()

    var body: some View {
        ContentView()
            .onChange(of: scenePhase) { _, newPhase in
                switch newPhase {
                case .background:
                    // SENIOR TALKING POINT: Last reliable moment before CPU freeze!
                    // Save pending in-memory mutations immediately.
                    ledgerStore.savePendingChanges()
                case .inactive:
                    // App interrupted by notification shade, Control Center, or app switcher
                    break
                case .active:
                    // App resumed and interactive on screen
                    break
                @unknown default:
                    break
                }
            }
    }
}

// UIKit SceneDelegate Hook with Grace Period Extension
final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func sceneDidEnterBackground(_ scene: UIScene) {
        // Request background execution time if persistence requires disk/network I/O
        var taskID = UIBackgroundTaskIdentifier.invalid
        taskID = UIApplication.shared.beginBackgroundTask(withName: "SaveStateOnBackground") {
            // Watchdog expiration: must end task or iOS terminates with 0x8badf00d
            UIApplication.shared.endBackgroundTask(taskID)
            taskID = .invalid
        }

        Task {
            defer {
                if taskID != .invalid {
                    UIApplication.shared.endBackgroundTask(taskID)
                    taskID = .invalid
                }
            }
            await AccountLedgerStore.shared.flushAsync()
        }
    }

    // =========================================================================
    // 2. UI STATE RESTORATION IN UIKIT: NSUserActivity
    // =========================================================================
    
    // Called when iOS snapshots current scene state for restoration
    func stateRestorationActivity(for scene: UIScene) -> NSUserActivity? {
        let activity = NSUserActivity(activityType: "com.citi.transferForm")
        activity.userInfo = [
            "recipientID": "ACC-98124",
            "amountDraft": "250.00",
            "scrollOffset": 140.0
        ]
        return activity
    }

    // Restores UI state when app relaunches after suspension or Jetsam kill
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        if let activity = session.stateRestorationActivity ?? connectionOptions.userActivities.first {
            restoreFormState(from: activity)
        }
    }

    private func restoreFormState(from activity: NSUserActivity) {
        guard let info = activity.userInfo else { return }
        // Populate navigation stack and input fields safely
        print("Restored recipient: \\(info["recipientID"] ?? "")")
    }
}

// =========================================================================
// 3. UI STATE RESTORATION IN SWIFTIUI: @SceneStorage
// =========================================================================
// @SceneStorage automatically persists lightweight UI state across app terminations
// tied directly to the window scene identity (supports iPad multi-window).
struct TransferDraftView: View {
    @SceneStorage("transfer_draft_notes") private var draftNotes = ""
    @SceneStorage("selected_tab_index") private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            Form {
                TextEditor(text: $draftNotes)
                    .frame(height: 120)
            }
            .tabItem { Label("Transfer", systemImage: "arrow.right.arrow.left") }
            .tag(0)

            Text("Transaction History")
                .tabItem { Label("History", systemImage: "clock") }
                .tag(1)
        }
    }
}

// =========================================================================
// 4. PERSISTENCE TAXONOMY: UserDefaults vs Secure Keychain
// =========================================================================
enum PersistenceCoordinator {
    // Non-sensitive preferences & flags
    static func savePreference(hasSeenOnboarding: Bool) {
        UserDefaults.standard.set(hasSeenOnboarding, forKey: "has_seen_onboarding")
    }

    // Sensitive tokens & secrets -> iOS Keychain with hardware encryption
    static func saveAuthToken(_ token: String) -> Bool {
        guard let data = token.data(using: .utf8) else { return false }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "user_session_token",
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
            kSecValueData as String: data
        ]
        SecItemDelete(query as CFDictionary)
        return SecItemAdd(query as CFDictionary, nil) == errSecSuccess
    }
}

final class AccountLedgerStore: ObservableObject {
    static let shared = AccountLedgerStore()
    func savePendingChanges() {}
    func flushAsync() async {}
}`
};

// 3. Insert question right after Q-33 (What does background execution allow?)
const insertIndex = questions.findIndex(q => q.id === 'Q-33') + 1;
console.log('Inserting at index:', insertIndex);
questions.splice(insertIndex, 0, newQuestion);

// Re-index all questions sequentially Q-01 to Q-69
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
const lifecycleDocs = [
  {
    docId: "ios-internals",
    title: "iOS Internals — Interview Talking Points",
    icon: "⚙️",
    filename: "iOSInternals-TalkingPoints.md"
  },
  {
    docId: "data-persistence",
    title: "Data Persistence & Offline Sync Decision Table",
    icon: "💾",
    filename: "DataPersistence-DecisionTable.md"
  }
];

questions.forEach(q => {
  if (q.question.includes('suspended or terminated') || q.question.includes('save state')) {
    updatedQToDocs[q.id] = lifecycleDocs;
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
    questionIds: ["Q-30", "Q-31", "Q-32", "Q-33", "Q-34"]
  },
  {
    id: "modularity-performance",
    title: "Modularity, Build & Launch Performance",
    shortTitle: "Modularity & Perf",
    icon: "📦",
    color: "#7E6E5C",
    summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.",
    docIds: ["modular-architecture", "performance-profiling"],
    questionIds: ["Q-35", "Q-36", "Q-37", "Q-38", "Q-39"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#7C5379",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-40", "Q-41", "Q-42", "Q-43"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#B84A39",
    summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "leadership-ownership"],
    questionIds: ["Q-44", "Q-45", "Q-46", "Q-47", "Q-48", "Q-49", "Q-50"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#A34836",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-51", "Q-52"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#4A7C94",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-53", "Q-54", "Q-55", "Q-56", "Q-57", "Q-58", "Q-59", "Q-60"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#B07038",
    summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: [],
    questionIds: ["Q-61"]
  },
  {
    id: "memory-management",
    title: "Memory Management",
    shortTitle: "Memory Mgmt",
    icon: "🧠",
    color: "#477C6B",
    summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit.",
    docIds: [],
    questionIds: ["Q-62", "Q-63", "Q-64", "Q-65", "Q-66", "Q-67", "Q-68", "Q-69"]
  }
];

// 7. Regenerate QUESTIONS.md
const topicMeta = {
  "Architecture & Design Patterns": { icon: "🏗️", summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles." },
  "Swift Concurrency & Multithreading": { icon: "⚡", summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions." },
  "Core Swift & Language Internals": { icon: "🚀", summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops." },
  "SwiftUI & UIKit Layout": { icon: "🎨", summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), iPad adaptive layouts, internationalization & RTL, UICollectionView diffable data sources & compositional layouts, atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, Property Wrappers (@State, @Binding, @Published), and UIKit interoperability." },
  "Combine & Reactive Streams": { icon: "🌊", summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles." },
  "Networking, APIs & Background Tasks": { icon: "🌐", summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, BGTaskScheduler, App Suspension & State Restoration." },
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
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, UICollectionView Diffable Data Sources & Compositional Layouts, Background Execution & State Restoration, Memory Management, System Design, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
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

// 8. Rebuild index.html & Perfect Claude.ai Consistent Text Colors
let indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');

// Update badges & counts
indexHtml = indexHtml.replace(/\d+ Questions · 24 Guides/g, `${questions.length} Questions · 24 Guides`);
indexHtml = indexHtml.replace(/\d+ Curated Questions/g, `${questions.length} Curated Questions`);
indexHtml = indexHtml.replace(/All \(\d+\)/g, `All (${questions.length})`);
indexHtml = indexHtml.replace(/All Difficulties \(\d+\)/g, `All Difficulties (${questions.length})`);
indexHtml = indexHtml.replace(/Advanced \(\d+\)/g, `Advanced (30)`);

// Ensure Claude.ai consistent text colors in CSS:
// In Dark:
//   --text-primary: #ECE9E2 (ivory linen)
//   --text-secondary: #B4AEA4 (warm light pewter)
//   --text-muted: #8A847C (warm taupe)
// In Light:
//   --text-primary: #24221E (deep warm espresso ink)
//   --text-secondary: #59544D (warm smoky slate)
//   --text-muted: #8A847C (warm stone)
indexHtml = indexHtml.replace(/--text-secondary: #6B665E;/, '--text-secondary: #59544D;');
indexHtml = indexHtml.replace(/--text-muted: #9E988F;/, '--text-muted: #8A847C;');

// Make .answer-text and modal doc paragraphs use --text-primary for maximum reading comfort just like Claude.ai
indexHtml = indexHtml.replace(
  /\.answer-text \{\s*color: var\(--text-secondary\);/,
  `.answer-text {\n      color: var(--text-primary);`
);

indexHtml = indexHtml.replace(
  /\.doc-content p\.doc-paragraph \{\s*margin-bottom: 1\.15rem;\s*color: var\(--text-secondary\);/,
  `.doc-content p.doc-paragraph {\n      margin-bottom: 1.15rem;\n      color: var(--text-primary);`
);

indexHtml = indexHtml.replace(
  /\.doc-content ul\.doc-list \{\s*margin-bottom: 1\.25rem;\s*padding-left: 1\.5rem;\s*color: var\(--text-secondary\);/,
  `.doc-content ul.doc-list {\n      margin-bottom: 1.25rem;\n      padding-left: 1.5rem;\n      color: var(--text-primary);`
);

// Clean up any remaining legacy hardcoded slate blues in copy button and code headers
indexHtml = indexHtml.replace(/\[data-theme="light"\] \.code-header \{\s*background: #E8E3DA;\s*color: #64748b;/, `[data-theme="light"] .code-header {\n      background: #E8E3DA;\n      color: var(--text-muted);`);
indexHtml = indexHtml.replace(/\[data-theme="light"\] \.copy-btn \{\s*border: 1px solid rgba\(0, 0, 0, 0\.15\);\s*color: #475569;/, `[data-theme="light"] .copy-btn {\n      border: 1px solid rgba(0, 0, 0, 0.15);\n      color: var(--text-secondary);`);
indexHtml = indexHtml.replace(/\[data-theme="light"\] \.copy-btn:hover \{\s*background: rgba\(0, 0, 0, 0\.05\);\s*color: #0f172a;/, `[data-theme="light"] .copy-btn:hover {\n      background: rgba(0, 0, 0, 0.05);\n      color: var(--text-primary);`);

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
console.log(`Successfully updated index.html with all ${questions.length} questions and perfected Claude text colors!`);
console.log(`Total lines: ${finalHtml.split('\n').length}, bytes: ${finalHtml.length}`);
