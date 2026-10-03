const fs = require('fs');
const vm = require('vm');

const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';
const GENERATED_DOCS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Helpers/generated_docs.json';
const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

// 1. Read existing questions and docs
let questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
const generatedDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));

console.log('Total questions before insertion:', questions.length);

// Map existing questions to their companion docs before ID shift
const textToDocs = new Map();
questions.forEach(q => {
  if (generatedDocs.QUESTION_TO_DOCS[q.id]) {
    textToDocs.set(q.question, generatedDocs.QUESTION_TO_DOCS[q.id]);
  }
});

// 2. Define the new question: "How do you read a crash log? How do you symbolicate it?"
const newQuestion = {
  id: "Q-64", // Placeholder, will be re-indexed
  category: "Engineering Leadership & Operations",
  difficulty: "Advanced",
  question: "How do you read a crash log? How do you symbolicate it?",
  interviewSentence: "Read the exception type, find the crashed thread and the first line of my own code, and symbolicate with the matching dSYM to turn addresses into function names and line numbers using E-T-F-S.",
  answer: `When an app crashes, iOS writes a crash log. It is a report that shows what the app was doing at the moment it died. You find it in Xcode Organizer (crashes from real users), in Crashlytics or Sentry, or on a device under Settings > Privacy > Analytics. The log first shows memory addresses like 0x0000000104a3c2f0, which are hard to read. Symbolication turns those addresses into real function names and line numbers, like ProfileViewModel.load() at ProfileViewModel.swift:42.

Say it like this:
"When I open a crash log, I read it from top to bottom in a few steps. I don't start with the long list of threads.

First, I read the header. It tells me the app version, build number, device, and iOS version. I check if the crash happens only on one version or one device, because that helps me find the cause.

Second, I read the exception type and the termination reason. This tells me the kind of crash. EXC_BAD_ACCESS means I touched memory that was gone, like a dangling pointer. EXC_BREAKPOINT or SIGTRAP is most common in Swift, and it means a runtime check failed, like a force unwrap of nil, an array out of range, or a failed try!. EXC_CRASH (SIGABRT) means the app aborted on purpose, often from an uncaught Objective-C exception. And a termination code like 0x8badf00d means the watchdog killed the app because it took too long, often on launch, and 0xdead10cc means it held a file lock while suspended.

Third, I find the crashed thread. The log says 'Thread 0 Crashed' or similar. I read the stack trace of that thread from the top. The top frame is where it crashed. I look for the first frame that belongs to my app, not a system library. That is usually where the bug is.

Fourth, I check the other threads, if needed. For example, if the main thread is blocked and waiting on a lock, another thread may be holding it. This is how I find deadlocks.

Then, if the log shows only hex addresses, I symbolicate it. The compiler removes names to keep the app small, and it keeps them in a file called a dSYM, one for each build. To symbolicate, I need the exact dSYM that matches the build. Xcode does it automatically if the dSYM is on my Mac. For logs from Crashlytics or App Store Connect, I upload the dSYMs, and the tool symbolicates for me. By hand, I can use the atos command with the load address and the crash address. Every time I archive a release, I save the dSYMs, because if I lose them, old crashes cannot be read."

Key Crash Diagnostic Phases:
1. What a crash log looks like:
   • Raw hex frame:
     0   CitiRetailBank   0x0000000104a3c2f0   0x104a30000 + 49904
   • Symbolicated frame (with dSYM):
     0   CitiRetailBank   ProfileViewModel.loadUser() (ProfileViewModel.swift:42)

2. Symbolicate by hand with atos:
   • Find matching dSYM via UUID:
     mdfind "com_apple_xcode_dsym_uuids == YOUR-BUILD-UUID"
   • Convert address using load address (-l) and crash offset:
     xcrun atos -arch arm64 -o MyApp.app.dSYM/Contents/Resources/DWARF/MyApp -l 0x104a30000 0x0000000104a3c2f0

3. Verify dSYM UUID match:
   • dwarfdump --uuid MyApp.app.dSYM must match binary image UUID in crash report.

4. Ensure dSYM retention in CI/CD:
   • Build Settings: Debug Information Format (Release) = DWARF with dSYM File.
   • Crashlytics: Run upload-symbols script in Build Phases or fastlane download_dsyms.
   • App Store Connect: Check "Upload your app's symbols".

5. Defensive coding habits:
   • Guard array indices (indices.contains) and dictionary values before force-unwrapping.
   • Use assertionFailure / fatalError with descriptive context strings so crash reports pinpoint the exact domain violation.

Quick steps to remember:
1. Header: app version, device, iOS version.
2. Exception type and reason: what kind of crash.
3. Crashed thread: read from the top, find the first line of my own code.
4. Other threads: look for deadlocks or blocked main thread.
5. Symbolicate: match the dSYM to the build, use Xcode, Crashlytics, or atos.

Common crash types:
• EXC_BREAKPOINT / SIGTRAP: Swift runtime failure, like force unwrap of nil, failed try!, or index out of range.
• EXC_BAD_ACCESS (SIGSEGV / SIGBUS): Touching deallocated memory, bad pointer dereferencing, or unsafe C-pointers.
• SIGABRT: Intentional abort, often uncaught NSException, failed assert(), or abort().
• 0x8badf00d: Watchdog killed the app (blocked main thread on launch > 20s or background resume > 10s).
• 0xdead10cc: App held a SQLite / file system lock while entering background suspension.
• Jetsam / High-Water Mark: OS memory kill due to exceeding physical RAM quota; contains no crashed thread in the report.

Good to mention (Staff-Level Interview Points):
• No Crashed Thread = Jetsam OOM: If the report lists no crashed thread and cites Reason: 0x205 / Jetsam, investigate memory footprint (VM Tracker dirty memory), not code logic.
• Bitcode deprecation: In recent Xcode versions, Apple discontinued Bitcode, so your CI archive dSYM is always the definitive symbol source.
• Immutable dSYM Archival: Store all dSYM bundles in S3 or CI artifact caches indefinitely; without them, historic customer crashes become permanently unreadable.
• Blast Radius Evaluation: Correlate crash velocity in Crashlytics and MetricKit against specific OS updates and hardware models to distinguish client bugs from OS vendor regressions.
• Unified Logging Breadcrumbs: Integrate OSLog / Unified Logging so recent in-flight actions preceding a crash appear in MXCrashDiagnostic telemetry.
• Xcode Organizer Direct Navigation: Xcode Organizer automatically symbolicates and links crash stacks directly to Xcode line numbers.

One-liner: Read the exception type, find the crashed thread and the first line of my own code, and symbolicate with the matching dSYM to turn addresses into function names and line numbers.

Memory trick: E-T-F-S → "Exception type, Thread that crashed, First line of my code, Symbolicate with dSYM."`,
  codeExample: `// =========================================================================
// SENIOR INTERVIEW ARCHITECTURE: Crash Log Anatomy, Symbolication & atos
// =========================================================================
import Foundation
import UIKit
import os.log

// =========================================================================
// 1. CRASH LOG ANATOMY: Raw Hex Addresses vs Symbolicated Stack Trace
// =========================================================================
// SENIOR TALKING POINT:
// The compiler strips human-readable function names to keep the binary small.
// A dSYM (Debug Symbol file) maps runtime load addresses back to source lines.
/*
RAW UNSYMBOLICATED LOG:
Exception Type:    EXC_BREAKPOINT (SIGTRAP)
Termination Reason: Swift runtime failure: Unexpectedly found nil while unwrapping an Optional value
Triggered by Thread: 0

Thread 0 Crashed:
0   CitiRetailBank  0x0000000104a3c2f0  0x104a30000 + 49904
1   CitiRetailBank  0x0000000104a3b8a4  0x104a30000 + 47268
2   UIKitCore       0x00000001a2b3c4d5  -[UIViewController loadViewIfRequired] + 680

AFTER SYMBOLICATION (with matching dSYM):
Thread 0 Crashed:
0   CitiRetailBank  ProfileViewModel.loadUser() (ProfileViewModel.swift:42)
1   CitiRetailBank  ProfileViewController.viewDidLoad() (ProfileViewController.swift:18)
2   UIKitCore       -[UIViewController loadViewIfRequired] + 680
*/

// =========================================================================
// 2. TERMINAL SYMBOLICATION: atos & dwarfdump
// =========================================================================
// SENIOR TALKING POINT:
// When Xcode Organizer or Crashlytics lacks matching symbols, use 'atos'
// with the architecture, dSYM binary path, load address (-l), and target hex address.
/*
# Step A: Verify dSYM UUID matches the crash log binary UUID
$ dwarfdump --uuid CitiRetailBank.app.dSYM
UUID: 7F4A8B9C-1234-3A5B-9C0D-123456789ABC (arm64) CitiRetailBank.app.dSYM/Contents/Resources/DWARF/CitiRetailBank

# Step B: Locate dSYM on local Mac via Spotlight
$ mdfind "com_apple_xcode_dsym_uuids == 7F4A8B9C-1234-3A5B-9C0D-123456789ABC"

# Step C: Symbolicate address to source file and exact line number
$ xcrun atos -arch arm64 \
  -o CitiRetailBank.app.dSYM/Contents/Resources/DWARF/CitiRetailBank \
  -l 0x104a30000 \
  0x0000000104a3c2f0

Output:
ProfileViewModel.loadUser() (in CitiRetailBank) (ProfileViewModel.swift:42)
*/

// =========================================================================
// 3. DEFENSIVE CODING HABITS: Eliminate Runtime Traps (SIGTRAP / SIGSEGV)
// =========================================================================
// SENIOR TALKING POINT:
// EXC_BREAKPOINT / SIGTRAP in Swift indicates a failed runtime assumption:
// force-unwrapped nils, out-of-bounds indexing, or force-downcasting (as!).
struct AccountRecord {
    let id: String
    let balance: Decimal
}

final class AccountRepository {
    private var accounts: [AccountRecord] = []
    private let logger = Logger(subsystem: "com.citi.banking", category: "CrashTriage")

    // ❌ Hard to debug in production crash logs:
    // func getAccount(at index: Int) -> AccountRecord {
    //     return accounts[index] // Crashes with EXC_BREAKPOINT: Fatal error: Index out of range
    // }

    // ✅ Defensive & Debuggable: Safe bounds check with breadcrumbs & clear assertion
    func safeAccount(at index: Int) -> AccountRecord? {
        guard accounts.indices.contains(index) else {
            // Emits unified log breadcrumb captured by MetricKit and Crashlytics
            logger.error("Out-of-bounds access requested: index \(index), count \(self.accounts.count)")
            assertionFailure("Array out of bounds in AccountRepository. Index \(index), count \(accounts.count)")
            return nil
        }
        return accounts[index]
    }

    // ❌ Dangerous dictionary unwrapping:
    // func parseUserId(from json: [String: Any]) -> String {
    //     return json["user_id"] as! String // Crashes with EXC_BREAKPOINT if type differs or key is missing
    // }

    // ✅ Safe decoding with structured diagnostics:
    func parseUserId(from json: [String: Any]) -> String? {
        guard let userId = json["user_id"] as? String else {
            logger.fault("Missing or invalid 'user_id' in API response payload: \(json)")
            return nil
        }
        return userId
    }
}

// =========================================================================
// 4. BREADCRUMBS & NON-FATAL TELEMETRY: MetricKit Diagnostics
// =========================================================================
// SENIOR TALKING POINT:
// In enterprise banking, breadcrumbs reveal the user journey leading up to a crash.
// Custom logs written via OSLog are bundled into MXCrashDiagnostic reports.
final class BreadcrumbTracker {
    static let shared = BreadcrumbTracker()
    private let log = OSLog(subsystem: "com.citi.banking", category: "Breadcrumbs")

    func record(step: String, metadata: [String: String] = [:]) {
        // Appears in crash reports as last known user actions before SIGABRT
        os_log("Breadcrumb: %{public}@ | Meta: %{public}@", log: log, type: .info, step, metadata.description)
    }
}`
};

// 3. Insert right after Q-63 ("Engineering Leadership — Production Incident Triage & Strangler Fig Migration")
const index63 = questions.findIndex(q => q.id === 'Q-63');
console.log('Inserting right after Q-63 at index:', index63 + 1);
questions.splice(index63 + 1, 0, newQuestion);

// Re-index all questions sequentially Q-01 to Q-72
questions.forEach((q, idx) => {
  q.id = `Q-${String(idx + 1).padStart(2, '0')}`;
});

console.log('New total questions count:', questions.length);

// 4. Save questions.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
console.log('Saved questions.json successfully!');

// 5. Re-map QUESTION_TO_DOCS with shifted IDs
const updatedQToDocs = {};
const crashDocs = [
  {
    docId: "leadership-ownership",
    title: "Development Lead / Feature Ownership — Talking Points",
    icon: "👔",
    filename: "LeadershipOwnership-TalkingPoints.md"
  },
  {
    docId: "performance-profiling",
    title: "Performance Profiling & Instruments — Talking Points",
    icon: "⏱️",
    filename: "PerformanceProfiling-TalkingPoints.md"
  }
];

questions.forEach(q => {
  if (q.question.includes("crash log") || q.question.includes("symbolicate")) {
    updatedQToDocs[q.id] = crashDocs;
  } else if (textToDocs.has(q.question)) {
    updatedQToDocs[q.id] = textToDocs.get(q.question);
  }
});

generatedDocs.QUESTION_TO_DOCS = updatedQToDocs;
fs.writeFileSync(GENERATED_DOCS_PATH, JSON.stringify(generatedDocs, null, 2), 'utf-8');
console.log('Updated generated_docs.json successfully!');

// 6. Define TOPIC_CATEGORIES for 72 questions
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
    questionIds: ["Q-35", "Q-36", "Q-37", "Q-38", "Q-39", "Q-40", "Q-41"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#7C5379",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-42", "Q-43", "Q-44", "Q-45"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#B84A39",
    summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "leadership-ownership"],
    questionIds: ["Q-46", "Q-47", "Q-48", "Q-49", "Q-50", "Q-51", "Q-52"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#A34836",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-53", "Q-54"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#4A7C94",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-55", "Q-56", "Q-57", "Q-58", "Q-59", "Q-60", "Q-61", "Q-62"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#B07038",
    summary: "Production incident triage, crash log analysis & dSYM symbolication, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: ["leadership-ownership"],
    questionIds: ["Q-63", "Q-64"]
  },
  {
    id: "memory-management",
    title: "Memory Management",
    shortTitle: "Memory Mgmt",
    icon: "🧠",
    color: "#477C6B",
    summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit.",
    docIds: [],
    questionIds: ["Q-65", "Q-66", "Q-67", "Q-68", "Q-69", "Q-70", "Q-71", "Q-72"]
  }
];

// 7. Regenerate QUESTIONS.md without difficulty tags
const topicMeta = {
  "Swift Internals & Advanced Types": { icon: "⚡", summary: "Memory layouts, Copy-on-Write, Existential Containers, Method Dispatch, Generics, and opaque types." },
  "Swift Concurrency & Async/Await": { icon: "🔀", summary: "Actors, Tasks, TaskGroups, AsyncSequence, Thread Sanitizer, and non-blocking concurrency." },
  "Modern Architecture & Patterns": { icon: "🏗️", summary: "VIPER, Clean Swift, Coordinator, TCA, State Machines, and Event-Driven systems." },
  "Auto Layout, UIKit & Modern SwiftUI": { icon: "📐", summary: "Constraint solving engine, intrinsic content size, priorities, iPad multitasking & adaptive size classes, Localizable string catalogs & RTL, and UICollectionView diffable data sources with compositional layouts." },
  "Combine & Reactive Streams": { icon: "🌊", summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles." },
  "Networking, APIs & Background Tasks": { icon: "🌐", summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, BGTaskScheduler, App Suspension & State Restoration." },
  "Modularity & Launch Performance": { icon: "📦", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Modularity, Build & Launch Performance": { icon: "📦", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Data Persistence, SwiftData & Memory Deep Dive": { icon: "💾", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Data Persistence & Memory Management": { icon: "💾", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Security, App Hardening & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "Security, Auth & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "System Design & Mobile Architecture": { icon: "🏛️", summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution." },
  "Testing, CI/CD & AI Engineering": { icon: "🧪", summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems." },
  "Engineering Leadership & Operations": { icon: "👔", summary: "Production incident triage, crash log analysis & dSYM symbolication, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern." },
  "Memory Management": { icon: "🧠", summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit." }
};

const catGroups = {};
for (const q of questions) {
  if (!catGroups[q.category]) catGroups[q.category] = [];
  catGroups[q.category].push(q);
}

const mdLines = [];
mdLines.push("# 📱 iOS Senior & Staff Interview Question Bank");
mdLines.push("");
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, UICollectionView Diffable Data Sources & Compositional Layouts, Background Execution & State Restoration, Performance Profiling & Instruments, 60/120fps Scroll Hitch Elimination, Scalable Image Caching, Production Crash Log Triage & Symbolication, Memory Management, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
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

// 8. Update index.html
let indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');

// Update badges & counts in HTML
indexHtml = indexHtml.replace(/\d+ Questions · 24 Guides/g, `${questions.length} Questions · 24 Guides`);
indexHtml = indexHtml.replace(/\d+ Curated Questions/g, `${questions.length} Curated Questions`);

const scriptOpen = indexHtml.indexOf('<script>');
const scriptClose = indexHtml.lastIndexOf('</script>');
const preScript = indexHtml.substring(0, scriptOpen);
const postScript = indexHtml.substring(scriptClose + 9);
const scriptBody = indexHtml.substring(scriptOpen + 8, scriptClose);

let newScript = scriptBody;
newScript = newScript.replace(
  /const QUESTIONS = \[[\s\S]*?\];\n/,
  () => `const QUESTIONS = ${JSON.stringify(questions)};\n`
);
newScript = newScript.replace(
  /const TOPIC_CATEGORIES = \[[\s\S]*?\];\n/,
  () => `const TOPIC_CATEGORIES = ${JSON.stringify(TOPIC_CATEGORIES)};\n`
);
newScript = newScript.replace(
  /const QUESTION_TO_DOCS = \{[\s\S]*?\};\n/,
  () => `const QUESTION_TO_DOCS = ${JSON.stringify(generatedDocs.QUESTION_TO_DOCS)};\n`
);

// Validate script syntax
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
