const fs = require('fs');
const vm = require('vm');

const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';
const GENERATED_DOCS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Helpers/generated_docs.json';
const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

// 1. Read existing questions and docs
let questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
const generatedDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));

console.log('Total questions before update:', questions.length);

// 2. Define the upgraded Q-38
const updatedQ38 = {
  id: "Q-38",
  category: "Modularity & Launch Performance",
  difficulty: "Advanced",
  question: "Your app is slow. How do you find the cause? Walk me through the steps.",
  interviewSentence: "Don't guess: define what is slow, reproduce it on a real device in Release, measure with Instruments and MetricKit, fix the heaviest root cause on the call tree, and protect against regressions with XCTMetric performance tests.",
  answer: `"Slow" can mean many things: the app starts slowly, a screen scrolls with stutter, a button reacts late, or the battery drains. Each one has a different cause and a different tool. So I never start by changing code. I start by measuring. Guessing wastes time and often fixes the wrong thing.

Say it like this:
"First, I get clear on what 'slow' means. Is it launch time, scrolling, a screen load, memory, or battery? I ask when it happens, on which device, and on which iOS version. Then I try to reproduce it on a real device, in a Release build, and preferably on an older phone, because the Simulator and Debug builds give wrong numbers.

Second, I check real user data. I look at MetricKit and Xcode Organizer, which show launch time, hangs, and hitches from real users. This tells me how big the problem is and who has it.

Third, I measure on my device with Instruments. For a stuck or laggy UI, I use Time Profiler to see which functions take the most time on the main thread. For scroll stutter, I use the Animation Hitches and SwiftUI instruments. For memory, I use Allocations and Leaks. For launch, I use App Launch. For network, I use the Network instrument or Charles Proxy. For battery, I use Energy Log.

Fourth, I find the root cause. Most of the time, it is one of these: heavy work on the main thread, too many view redraws, big images decoded at full size, a slow network call or too many calls, slow database queries, or too much work at launch. I read the call tree, find the heaviest path, and fix that one thing.

Fifth, I fix one thing at a time, and measure again. If the number did not improve, my guess was wrong, and I go back. Finally, I add protection so it doesn't return: a performance test with XCTMetric, and tracking with MetricKit or a monitoring tool, so a regression shows up early."

The 6-Step Diagnostic Framework (D-R-M-F-P):
1. Define: Clarify exact symptoms: cold launch latency, UI hangs (>250ms), scroll hitches (>16.6ms frame drops), peak memory usage, or thermal throttling.
2. Reproduce: Isolate on a physical device using the Release configuration. Never profile on the iOS Simulator or Debug builds.
3. Measure: Gather quantitative baselines with Xcode Instruments (Time Profiler, Allocations), MetricKit, and Xcode Organizer.
4. Find Root Cause: Invert Call Tree, hide system libraries, and isolate the heaviest single call stack on the main thread.
5. Fix One Thing & Measure Again: Avoid shotgun optimization; fix the primary bottleneck and verify the delta with numbers.
6. Protect Against Regressions: Add automated XCTMetric performance tests to CI/CD and monitor 24-hr MetricKit aggregates.

Which Tool for Which Problem:
• App starts slowly: App Launch instrument — audit pre-main dyld linkage and initial view setup.
• UI freezes / Hangs: Time Profiler — sample the main thread; look for synchronous I/O or JSON decoding.
• Scroll stutter / Hitches: Animation Hitches & SwiftUI Profiler — detect dropped frames, expensive layout passes, and offscreen rendering.
• Memory grows or app is killed: Allocations, Leaks, and Memory Graph Debugger — identify unbounded object retention and retain cycles.
• Slow screen load: Network instrument, Charles Proxy, and custom os_signpost intervals.
• Battery drain: Energy Log — inspect high-frequency GPS polling, timer runaway, and unnecessary network radio wakeups.

Good to Mention (Staff-Level Insights):
• Always profile a Release build on a real device: Debug mode disables compiler optimizations and injects safety checks; Simulator uses your Mac's multi-core desktop CPU.
• Invert Call Tree & Hide System Libraries: In Time Profiler, checking these options bubbles your app's actual leaf functions to the very top.
• Fix the biggest problem first: If one routine accounts for 80% of CPU time, optimizing a 2% helper offers negligible user impact.
• SwiftUI Redraw Diagnosis: Use Self._printChanges() inside the body property to pinpoint which @State or @Binding dependency triggered view evaluation.
• Xcode Hang Detection & MetricKit: Xcode Organizer groups hangs (>250ms) by frequency and user percentage across production fleets.
• Quantifiable Impact: Always state performance gains in hard metrics (e.g. "Cold start reduced from 2.4s to 850ms, eliminating 65% of main thread hangs").

One-liner: Don't guess: define the problem, reproduce it on a real device in Release, measure with Instruments and MetricKit, fix the biggest cause, then measure again.

Memory trick: D-R-M-F-P → "Define, Reproduce, Measure, Fix one thing, Protect."`,
  codeExample: `// =========================================================================
// SENIOR INTERVIEW ARCHITECTURE: App Performance Diagnosis & Telemetry
// =========================================================================
import Foundation
import UIKit
import os.signpost
import MetricKit
import XCTest

// =========================================================================
// 1. INSTRUMENTS TELEMETRY: os_signpost Intervals
// =========================================================================
// SENIOR TALKING POINT:
// os_signpost injects lightweight points-of-interest directly into the
// Instruments timeline without degrading app performance. Correlates business
// operations (like feed loading) with CPU spikes and animation hitches.
final class FeedTelemetryManager {
    static let shared = FeedTelemetryManager()
    private let perfLog = OSLog(subsystem: "com.citi.retailbanking", category: "Performance")

    func loadFeed() async {
        let signpostID = OSSignpostID(log: perfLog)
        
        // Emits interval start marker visible in Instruments 'Points of Interest'
        os_signpost(.begin, log: perfLog, name: "LoadFeed", signpostID: signpostID)
        
        defer {
            // Guarantee end marker is emitted even if an error is thrown
            os_signpost(.end, log: perfLog, name: "LoadFeed", signpostID: signpostID)
        }
        
        await fetchAndParse()
    }

    private func fetchAndParse() async {
        // Simulated network I/O and JSON deserialization off the main thread
        try? await Task.sleep(nanoseconds: 120_000_000)
    }
}

// =========================================================================
// 2. MAIN-THREAD HANG DETECTION: High-Resolution Timestamp Check
// =========================================================================
// SENIOR TALKING POINT:
// The main runloop must render frames every 16.6ms (60Hz) or 8.3ms (120Hz ProMotion).
// Any main-thread task exceeding 16ms drops frames (hitches); > 250ms is flagged as a Hang by iOS.
enum MainThreadDiagnostics {
    static func auditOperation(named name: String, execute: () -> Void) {
        let start = CFAbsoluteTimeGetCurrent()
        execute()
        let elapsedMs = (CFAbsoluteTimeGetCurrent() - start) * 1000
        
        if elapsedMs > 16.0 {
            // Log warning or emit non-fatal telemetry for main thread bottleneck
            print("⚠️ [MainThread Warning] '\\(name)' took \\(String(format: "%.2f", elapsedMs)) ms (exceeded 16ms frame budget)")
        }
    }
}

// =========================================================================
// 3. AGGREGATED FIELD TELEMETRY: MetricKit Subscriber
// =========================================================================
// SENIOR TALKING POINT:
// MXMetricManager delivers daily aggregated payloads from real user devices
// in production. Captures real-world launch times, hang durations, and memory peaks
// without third-party SDK performance overhead or battery penalty.
final class ProductionMetricsReceiver: NSObject, MXMetricManagerSubscriber {
    static let shared = ProductionMetricsReceiver()

    func startMonitoring() {
        MXMetricManager.shared.add(self)
    }

    // Called once daily by iOS with aggregated metrics from production users
    func didReceive(_ payloads: [MXMetricPayload]) {
        for payload in payloads {
            // Extract critical KPIs: launch time, hang time, memory, battery
            let data = payload.jsonRepresentation()
            uploadMetricPayload(data)
        }
    }

    // Called when iOS detects diagnostic crashes, CPU exceptions, or disk write spikes
    func didReceive(_ payloads: [MXDiagnosticPayload]) {
        for payload in payloads {
            let diagnosticData = payload.jsonRepresentation()
            uploadDiagnosticPayload(diagnosticData)
        }
    }

    private func uploadMetricPayload(_ data: Data) {
        // Asynchronously post to backend APM observability dashboard
    }

    private func uploadDiagnosticPayload(_ data: Data) {
        // Forward crash / hang stack traces to telemetry pipeline
    }
}

// =========================================================================
// 4. REGRESSION PROTECTION: XCTMetric Automated Performance Testing
// =========================================================================
// SENIOR TALKING POINT:
// Prevent performance regressions in CI/CD by asserting quantitative baselines.
// XCTApplicationLaunchMetric fails the build if cold start time exceeds threshold.
final class LaunchPerformanceTests: XCTestCase {
    func testAppLaunchPerformance() throws {
        let metrics: [XCTMetric] = [
            XCTApplicationLaunchMetric(waitUntilResponsive: true),
            XCTCPUMetric(),
            XCTMemoryMetric()
        ]
        
        let options = XCTMeasureOptions()
        options.iterationCount = 5
        
        measure(metrics: metrics, options: options) {
            XCUIApplication().launch()
        }
    }
}`
};

// 3. Replace Q-38 in questions array
const index38 = questions.findIndex(q => q.id === "Q-38");
if (index38 !== -1) {
  questions[index38] = updatedQ38;
  console.log('Replaced Q-38 at index:', index38);
} else {
  console.error('Q-38 not found!');
  process.exit(1);
}

// 4. Map companion docs for Q-38
generatedDocs.QUESTION_TO_DOCS["Q-38"] = ["performance-profiling", "ios-internals"];

// 5. Write updated questions.json & generated_docs.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
fs.writeFileSync(GENERATED_DOCS_PATH, JSON.stringify(generatedDocs, null, 2), 'utf-8');
console.log('Updated questions.json and generated_docs.json');

// 6. Regenerate QUESTIONS.md
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
  "Security, App Hardening & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "System Design & Mobile Architecture": { icon: "🏛️", summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution." },
  "Testing, CI/CD & AI Engineering": { icon: "🧪", summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems." },
  "Engineering Leadership & Operations": { icon: "👔", summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern." },
  "Memory Management": { icon: "🧠", summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings & downsampling, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit." }
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

// 7. Update index.html
let indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');

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
console.log(`Successfully updated index.html!`);
