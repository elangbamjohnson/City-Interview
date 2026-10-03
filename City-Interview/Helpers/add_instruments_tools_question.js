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

// 2. Define the new question: "Which Instruments tools do you use? What are their purposes?"
const newQuestion = {
  id: "Q-39", // Placeholder, will be re-indexed
  category: "Modularity & Launch Performance",
  difficulty: "Advanced",
  question: "Which Instruments tools do you use? What are their purposes?",
  interviewSentence: "I pick the tool based on the symptom: Time Profiler for CPU bottlenecks, Allocations for growing heap, Leaks for orphaned pointers, Hangs for UI freezes over 250ms, and Animation Hitches for scroll stutter.",
  answer: `Instruments is Apple's profiling app that comes with Xcode. You open it with Product > Profile (Cmd + I). It records what your app is doing while it runs, such as CPU, memory, and screen drawing. Each tool inside it answers one question. Use it on a real device, with a Release build.

Say it like this:
"I pick the tool based on the symptom, because each one answers a different question.

Time Profiler answers 'where is my CPU time going?' It takes samples of the call stack many times a second, so I see which functions take the most time. I use it when the app feels slow or the UI freezes. I look at the main thread and use 'Invert Call Tree' and 'Hide System Libraries' to find my own heavy function quickly.

Allocations answers 'how much memory is my app using, and what is using it?' It tracks every object created. I use it when memory keeps growing. I use the Generations feature: I take a snapshot, do an action like opening and closing a screen a few times, take another snapshot, and look at what stayed in memory. That tells me what is not being freed.

Leaks answers 'which objects can never be freed?' It finds memory that nothing points to anymore, but was never released. It is good for finding the classic leaks. But it misses retain cycles where objects still point to each other, so I also use the Memory Graph debugger in Xcode for those.

Hangs answers 'when did the UI stop responding?' It marks the moments when the main thread was blocked for too long, usually more than 250 milliseconds. I use it to find the exact moment of a freeze, then look at what the main thread was doing at that time.

Animation Hitches answers 'why does my scrolling or animation stutter?' A hitch is a frame that appears late. The tool shows which frames were late and whether the cause was my app's work (commit) or the system rendering. I use it for janky scrolling and slow transitions."

Which Tool for Which Symptom:
| Symptom | Tool | What I Look At |
|---|---|---|
| **App feels slow, CPU high** | **Time Profiler** | Heaviest functions on the main thread (Invert Call Tree) |
| **Memory keeps growing** | **Allocations** | Generations feature, dirty memory, objects staying alive |
| **Objects never freed** | **Leaks** | Leaked objects and their allocation stack traces |
| **UI freezes for a moment** | **Hangs** | Moments where main thread was blocked (> 250ms) |
| **Scroll or animation stutters** | **Animation Hitches** | Late frames, Commit phase vs Render phase delays |

Good to Mention (Staff-Level Interview Points):
• Always profile a Release build on a real device: Debug builds disable compiler optimizations and inject debug assertions; the Simulator uses your Mac's CPU and memory architecture.
• Other specialized tools: App Launch for startup pre-main dyld and post-main setup, Network for slow endpoints, Energy Log for battery/GPS drain, and SwiftUI instrument for redundant view body evaluations.
• Combined Template: Hangs and Animation Hitches are bundled together in the "Hangs and Hitches" template in Xcode Instruments.
• Subtle Memory Growth: A small, steady growth in Allocations across repeated user flows signifies a logical leak, even if the Leaks instrument reports 0 leaks.
• Field Observability: Complement Instruments with Xcode Organizer and MetricKit to observe real-world hangs and hitches across customer devices.

One-liner: Time Profiler finds slow code, Allocations and Leaks find memory problems, Hangs finds UI freezes, and Animation Hitches finds stutter.

Memory trick: C-M-L-F-S → "CPU = Time Profiler, Memory = Allocations, Leaks = never freed, Freeze = Hangs, Stutter = Hitches."`,
  codeExample: `// =========================================================================
// SENIOR INTERVIEW ARCHITECTURE: Instruments Diagnostics & Profiling Code
// =========================================================================
import Foundation
import UIKit
import os.signpost

// =========================================================================
// 1. TIME PROFILER & SIGNPOSTS: Custom Points of Interest
// =========================================================================
// SENIOR TALKING POINT:
// os_signpost injects labeled intervals directly into the Instruments timeline.
// This bridges the gap between high-level business logic and low-level CPU samples.
final class FeedParserService {
    private let perfLog = OSLog(subsystem: "com.citi.retailbanking", category: "FeedProcessing")

    func processFeedPayload(_ data: Data) async {
        let signpostID = OSSignpostID(log: perfLog)
        
        // Appears as a highlighted duration bar in Instruments 'os_signpost' track
        os_signpost(.begin, log: perfLog, name: "ParseFeed", signpostID: signpostID)
        defer {
            os_signpost(.end, log: perfLog, name: "ParseFeed", signpostID: signpostID)
        }
        
        // SENIOR TALKING POINT: Time Profiler Optimization
        // Parsing offload prevents main-thread hitching (>16.6ms)
        await Task.detached(priority: .userInitiated) {
            self.parseTransactions(data)
        }.value
    }

    private func parseTransactions(_ data: Data) {
        // High-cost JSON decoding performed safely off the main runloop
    }
}

// =========================================================================
// 2. ALLOCATIONS & MEMORY GRAPH: Detecting Retain Cycles
// =========================================================================
// SENIOR TALKING POINT:
// Leaks instrument catches orphaned heap allocations (0 pointers remaining).
// But standard Leaks misses cyclic reference graphs (A <-> B) where retain counts > 0.
// Generations in Allocations & the Xcode Memory Graph Debugger catch these cycles.
final class DetailViewModel {
    var onUpdate: (() -> Void)?
    private var cachedData: [String] = []

    func start() {
        // ❌ RETAIN CYCLE: self -> onUpdate closure -> self
        // Closure captures self strongly by default, creating an unfreeable loop.
        // onUpdate = { self.refresh() }

        // ✅ FIX: [weak self] breaks reference cycle, allowing deallocation
        onUpdate = { [weak self] in
            guard let self = self else { return }
            self.refresh()
        }
    }

    func refresh() {
        // State update safely dispatched to UI
    }

    deinit {
        // SENIOR TIP: Add deinit log to confirm deallocation during manual verification
        print("DetailViewModel safely deallocated")
    }
}

// =========================================================================
// 3. HANGS & HITCHE ELIMINATION: Main-Thread Yielding
// =========================================================================
// SENIOR TALKING POINT:
// Animation Hitches instrument splits frames into Commit phase (app layout)
// and Render phase (system GPU compositing). Use Task.yield() in heavy loops.
actor HeavyBatchProcessor {
    func processLargeArray(_ items: [Int]) async {
        for (index, item) in items.enumerated() {
            // Expensive math computation
            _ = item * 2
            
            // Periodically yield execution to allow higher priority tasks to run
            if index % 500 == 0 {
                await Task.yield()
            }
        }
    }
}`
};

// 3. Insert right after Q-38 ("Your app is slow. How do you find the cause? Walk me through the steps.")
const index38 = questions.findIndex(q => q.id === 'Q-38');
console.log('Inserting right after Q-38 at index:', index38 + 1);
questions.splice(index38 + 1, 0, newQuestion);

// Re-index all questions sequentially Q-01 to Q-70
questions.forEach((q, idx) => {
  q.id = `Q-${String(idx + 1).padStart(2, '0')}`;
});

console.log('New total questions count:', questions.length);

// 4. Save questions.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
console.log('Saved questions.json successfully!');

// 5. Re-map QUESTION_TO_DOCS with shifted IDs
const updatedQToDocs = {};
const profilingDocs = [
  {
    docId: "performance-profiling",
    title: "Performance Profiling & Instruments — Talking Points",
    icon: "⏱️",
    filename: "PerformanceProfiling-TalkingPoints.md"
  },
  {
    docId: "ios-internals",
    title: "iOS Internals — Interview Talking Points",
    icon: "⚙️",
    filename: "iOSInternals-TalkingPoints.md"
  }
];

questions.forEach(q => {
  if (q.question.includes("Which Instruments tools do you use")) {
    updatedQToDocs[q.id] = profilingDocs;
  } else if (textToDocs.has(q.question)) {
    updatedQToDocs[q.id] = textToDocs.get(q.question);
  }
});

generatedDocs.QUESTION_TO_DOCS = updatedQToDocs;
fs.writeFileSync(GENERATED_DOCS_PATH, JSON.stringify(generatedDocs, null, 2), 'utf-8');
console.log('Updated generated_docs.json successfully!');

// 6. Update TOPIC_CATEGORIES questionIds
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
    questionIds: ["Q-35", "Q-36", "Q-37", "Q-38", "Q-39", "Q-40"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#7C5379",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-41", "Q-42", "Q-43", "Q-44"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#B84A39",
    summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "leadership-ownership"],
    questionIds: ["Q-45", "Q-46", "Q-47", "Q-48", "Q-49", "Q-50", "Q-51"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#A34836",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-52", "Q-53"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#4A7C94",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-54", "Q-55", "Q-56", "Q-57", "Q-58", "Q-59", "Q-60", "Q-61"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#B07038",
    summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: [],
    questionIds: ["Q-62"]
  },
  {
    id: "memory-management",
    title: "Memory Management",
    shortTitle: "Memory Mgmt",
    icon: "🧠",
    color: "#477C6B",
    summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit.",
    docIds: [],
    questionIds: ["Q-63", "Q-64", "Q-65", "Q-66", "Q-67", "Q-68", "Q-69", "Q-70"]
  }
];

// 7. Regenerate QUESTIONS.md
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
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, UICollectionView Diffable Data Sources & Compositional Layouts, Background Execution & State Restoration, Performance Profiling & Instruments, Memory Management, System Design, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
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

// 8. Update index.html
let indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');

// Update badges & counts in HTML
indexHtml = indexHtml.replace(/\d+ Questions · 24 Guides/g, `${questions.length} Questions · 24 Guides`);
indexHtml = indexHtml.replace(/\d+ Curated Questions/g, `${questions.length} Curated Questions`);
indexHtml = indexHtml.replace(/All \(\d+\)/g, `All (${questions.length})`);
indexHtml = indexHtml.replace(/All Difficulties \(\d+\)/g, `All Difficulties (${questions.length})`);
indexHtml = indexHtml.replace(/Advanced \(\d+\)/g, `Advanced (31)`);

// Update embedded arrays inside <script>
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
