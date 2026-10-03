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

// 2. Define the new question: "How do you fix scroll jank and dropped frames?"
const newQuestion = {
  id: "Q-40", // Placeholder, will be re-indexed
  category: "Modularity & Launch Performance",
  difficulty: "Advanced",
  question: "How do you fix scroll jank and dropped frames?",
  interviewSentence: "Find the late frames with Animation Hitches and Time Profiler, then fix the biggest cause using M-I-L-D-R: Main-thread work, Images, Layout, Drawing, and Redraws.",
  answer: `A screen shows a new picture 60 times a second, or 120 on ProMotion phones. Each picture is a frame, and I have about 16 ms (or 8 ms) to prepare it. If my code takes longer, the frame is late, and the user sees the scroll stutter. That is jank. It shows up most in table views, collection views, and SwiftUI lists, because they build many cells while the user scrolls.

Say it like this:
"When someone says scrolling is janky, I first check how bad it is and where it happens. I ask which screen, which device, and whether it happens all the time or only on the first scroll. Then I try it on a real, older phone with a Release build, because the Simulator and Debug builds show wrong results.

To find the cause, I open Instruments. I start with Animation Hitches, which shows me which frames were late. Then I use Time Profiler and look at the main thread while I scroll, to see which function is taking the time. For SwiftUI, I also use the SwiftUI instrument, and I add Self._printChanges() to see why a view redraws. I also check Xcode Organizer to see if real users have the same problem.

Then I fix the biggest cause first. These are the common causes in a scrolling list:
1. Heavy work on the main thread: parsing JSON, formatting dates, or reading files while the cell is being built.
2. Big images: decoded at full size on the main thread.
3. Complex layout: too many nested views or Auto Layout constraints.
4. Expensive drawing: shadows without a shadow path, rounded corners with masks, or lots of transparent views.
5. SwiftUI: too many redraws or a non-lazy container.

After each fix, I measure again. If the hitch number did not go down, that fix was not the real problem, and I go back to the profiler. At the end, I add a scroll performance test, so the problem does not come back."

How to Fix Each Cause:
1. Heavy work on the main thread: Do it before the cell is built. Never allocate DateFormatter inside cellForRowAt; format once upfront in the view model and reuse a single static formatter.
2. Big images: Downsample and load in the background. Use Image I/O CGImageSourceCreateThumbnailAtIndex to decode directly to display size off the main thread. In the cell, load in background, cancel in prepareForReuse, and enable prefetchDataSource.
3. Complex layout: Make it flatter and cheaper. Use UIStackView or fewer nested views. Set fixed row height (tableView.rowHeight = 88) when possible. If heights vary, use automaticDimension with an accurate estimatedRowHeight.
4. Expensive drawing: Give the system a shadow path, avoid masks and transparency. Set layer.shadowPath to eliminate dynamic offscreen render passes. Keep cornerRadius without masksToBounds when combined with shadows. Set cell.contentView.isOpaque = true to skip alpha blending.
5. SwiftUI: Use lazy containers, stable IDs, and eliminate redundant redraws. Replace VStack with LazyVStack so rows build on demand. Keep row views lightweight and debug redraws with Self._printChanges().

Quick Steps to Remember:
1. Find: Animation Hitches, then Time Profiler on the main thread.
2. Fix the biggest cause: main thread work, images, layout, drawing, redraws.
3. Measure again with the same scroll.
4. Protect with a scroll performance test (XCTOSSignpostMetric.scrollingAndDecelerationMetric).

Good to Mention (Staff-Level Interview Points):
• Cell Reuse Discipline: Inside cellForRowAt, only bind pre-calculated data; never allocate views, calculate constraints, or perform disk/network I/O.
• Diffable Data Sources: Use NSDiffableDataSourceSnapshot so updates animate cleanly without calling reloadData() while the user is actively dragging.
• ProMotion Frame Budget: At 120 Hz, each frame budget drops to 8.3 ms, meaning even small synchronous work causes dropped frames.
• Core Animation Debug Overlays: Use Instruments / Xcode "Color Blended Layers" and "Color Offscreen-Rendered" to identify transparency and masking bottlenecks directly on screen.

One-liner: Find the late frames with Animation Hitches and Time Profiler, then fix the biggest cause: main thread work, big images, heavy layout, expensive drawing, or too many SwiftUI redraws.

Memory trick: M-I-L-D-R → "Main thread work, Images, Layout, Drawing, Redraws."`,
  codeExample: `// =========================================================================
// SENIOR INTERVIEW ARCHITECTURE: 60/120fps Scroll Hitch Elimination (M-I-L-D-R)
// =========================================================================
import UIKit
import SwiftUI
import ImageIO
import XCTest

// =========================================================================
// 1. HEAVY WORK ON MAIN THREAD: Do it before the cell is built
// =========================================================================
// SENIOR TALKING POINT:
// Creating DateFormatter() or NumberFormatter() is extraordinarily expensive (~1-3ms)
// because it queries system locale databases. Doing it inside cellForRowAt guarantees
// dropped frames on 120Hz ProMotion screens (budget: 8.3ms per frame).

// ❌ Bad: formatting inside cellForRowAt, runs on every scroll
// cell.dateLabel.text = DateFormatter().string(from: item.date)

// ✅ Good: format once in the view model, reuse a single formatter
struct ItemViewData: Identifiable {
    let id: UUID
    let title: String
    let dateText: String
    let imageURL: URL
}

enum Formatters {
    static let date: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        return f
    }()
}

// In ViewModel or Background Mapper:
// let viewData = ItemViewData(id: UUID(),
//                             title: item.title,
//                             dateText: Formatters.date.string(from: item.date),
//                             imageURL: item.imageURL)

// =========================================================================
// 2. BIG IMAGES: Downsample and load in the background
// =========================================================================
// SENIOR TALKING POINT:
// UIImage(data:) decodes full JPEG/PNG into an uncompressed bitmap on the main thread.
// CGImageSourceCreateThumbnailAtIndex creates a scaled thumbnail directly
// and caches it immediately off the main thread, bypassing massive memory allocations.
func downsample(url: URL, maxPixel: CGFloat) -> UIImage? {
    let options: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceCreateThumbnailWithTransform: true, // Preserve EXIF rotation
        kCGImageSourceShouldCacheImmediately: true,      // Decode now, off the main thread
        kCGImageSourceThumbnailMaxPixelSize: maxPixel
    ]
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let cg = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
    else { return nil }
    return UIImage(cgImage: cg)
}

// In the cell: load in the background, set on main, cancel on reuse
final class ItemCell: UITableViewCell {
    private var imageTask: Task<Void, Never>?
    let customImageView = UIImageView()

    override func prepareForReuse() {
        super.prepareForReuse()
        // Cancel in-flight decode task so recycled cell doesn't process stale work
        imageTask?.cancel()
        imageTask = nil
        customImageView.image = nil
    }

    func configure(with item: ItemViewData) {
        imageTask = Task.detached(priority: .userInitiated) { [weak self] in
            guard let image = downsample(url: item.imageURL, maxPixel: 120) else { return }
            await MainActor.run {
                self?.customImageView.image = image
            }
        }
    }
}

// Also turn on prefetching, so images start loading before the cell appears:
extension ItemListViewController: UITableViewDataSourcePrefetching {
    func tableView(_ tableView: UITableView, prefetchRowsAt indexPaths: [IndexPath]) {
        indexPaths.forEach { indexPath in
            imageLoader.preload(items[indexPath.row].imageURL)
        }
    }
}

// =========================================================================
// 3. COMPLEX LAYOUT: Make it flatter and cheaper
// =========================================================================
// SENIOR TALKING POINT:
// Auto Layout solves systems of linear equalities using the Cassowary solver.
// Fixed row height is O(1). If dynamic height is needed, provide estimatedRowHeight
// to prevent massive table layout recalculations and scrollbar stutter during flings.
func configureListLayout(tableView: UITableView) {
    // Use UIStackView or fewer nested views, and fixed heights when possible
    tableView.rowHeight = 88                       // fixed height is the cheapest

    // If the height must change, use automatic dimension with a full constraint chain
    tableView.rowHeight = UITableView.automaticDimension
    tableView.estimatedRowHeight = 88              // give a good estimate
}

// =========================================================================
// 4. EXPENSIVE DRAWING: Give the system a shadow path, avoid masks & transparency
// =========================================================================
// SENIOR TALKING POINT:
// Without shadowPath, Core Animation must do an offscreen render pass to discover the
// layer's silhouette on EVERY frame. Setting shadowPath enables single-pass GPU compositing.
func optimizeDrawing(cell: UITableViewCell, imageView: UIImageView) {
    // ❌ Bad: the system must work out the shadow shape on every frame
    // cell.layer.shadowOpacity = 0.3

    // ✅ Good: tell it the shape, so it is cheap
    cell.layer.shadowOpacity = 0.3
    cell.layer.shadowPath = UIBezierPath(roundedRect: cell.bounds, cornerRadius: 8).cgPath

    // Rounded corners: cornerRadius alone is fine. Avoid masksToBounds on many cells with shadows.
    imageView.layer.cornerRadius = 8
    imageView.clipsToBounds = true

    // Make views opaque when possible, so the system skips blending
    cell.contentView.backgroundColor = .systemBackground
    cell.contentView.isOpaque = true
}

// =========================================================================
// 5. SWIFTUI: Lazy container, stable IDs, fewer redraws
// =========================================================================
// SENIOR TALKING POINT:
// Standard VStack instantiates and evaluates body for all children instantly.
// LazyVStack allocates views on-demand as they approach the visible scroll boundary.
// Self._printChanges() prints the exact property trigger causing body re-evaluation.

// ❌ Bad: VStack builds every row at once
// ScrollView { VStack { ForEach(items) { ItemRow(item: $0) } } }

// ✅ Good: lazy builds rows only when needed
struct FastScrollFeedView: View {
    let items: [ItemViewData]

    var body: some View {
        ScrollView {
            LazyVStack {
                ForEach(items) { item in
                    ItemRow(item: item)
                }
            }
        }
    }
}

// Row: small, no heavy work inside body, stable id from Identifiable
struct ItemRow: View {
    let item: ItemViewData
    var body: some View {
        let _ = Self._printChanges()          // why did this row redraw?
        Text(item.title)
    }
}

// =========================================================================
// 6. REGRESSION GUARD: Automated Scroll Performance Test
// =========================================================================
// SENIOR TALKING POINT:
// XCTOSSignpostMetric.scrollingAndDecelerationMetric measures hitch ratio
// (ms of late frames per second of animation). Add to CI to prevent regressions.
final class ScrollPerformanceUITests: XCTestCase {
    func testScrollPerformance() throws {
        let app = XCUIApplication()
        app.launch()
        measure(metrics: [XCTOSSignpostMetric.scrollingAndDecelerationMetric]) {
            app.tables.firstMatch.swipeUp(velocity: .fast)
        }
    }
}`
};

// 3. Insert right after Q-39 ("Which Instruments tools do you use? What are their purposes?")
const index39 = questions.findIndex(q => q.id === 'Q-39');
console.log('Inserting right after Q-39 at index:', index39 + 1);
questions.splice(index39 + 1, 0, newQuestion);

// Re-index all questions sequentially Q-01 to Q-71
questions.forEach((q, idx) => {
  q.id = `Q-${String(idx + 1).padStart(2, '0')}`;
});

console.log('New total questions count:', questions.length);

// 4. Save questions.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
console.log('Saved questions.json successfully!');

// 5. Re-map QUESTION_TO_DOCS with shifted IDs
const updatedQToDocs = {};
const hitchDocs = [
  {
    docId: "performance-profiling",
    title: "Performance Profiling & Instruments — Talking Points",
    icon: "⏱️",
    filename: "PerformanceProfiling-TalkingPoints.md"
  },
  {
    docId: "autolayout-basics",
    title: "Auto Layout Basics — Talking Points",
    icon: "📐",
    filename: "AutoLayout-TalkingPoints.md"
  },
  {
    docId: "ios-internals",
    title: "iOS Internals — Interview Talking Points",
    icon: "⚙️",
    filename: "iOSInternals-TalkingPoints.md"
  }
];

questions.forEach(q => {
  if (q.question.includes("scroll jank") || q.question.includes("dropped frames")) {
    updatedQToDocs[q.id] = hitchDocs;
  } else if (textToDocs.has(q.question)) {
    updatedQToDocs[q.id] = textToDocs.get(q.question);
  }
});

generatedDocs.QUESTION_TO_DOCS = updatedQToDocs;
fs.writeFileSync(GENERATED_DOCS_PATH, JSON.stringify(generatedDocs, null, 2), 'utf-8');
console.log('Updated generated_docs.json successfully!');

// 6. Update TOPIC_CATEGORIES questionIds for 71 questions
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
    summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: [],
    questionIds: ["Q-63"]
  },
  {
    id: "memory-management",
    title: "Memory Management",
    shortTitle: "Memory Mgmt",
    icon: "🧠",
    color: "#477C6B",
    summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit.",
    docIds: [],
    questionIds: ["Q-64", "Q-65", "Q-66", "Q-67", "Q-68", "Q-69", "Q-70", "Q-71"]
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
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, UICollectionView Diffable Data Sources & Compositional Layouts, Background Execution & State Restoration, Performance Profiling & Instruments, 60/120fps Scroll Hitch Elimination, Memory Management, System Design, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
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
indexHtml = indexHtml.replace(/Advanced \(\d+\)/g, `Advanced (32)`);

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
