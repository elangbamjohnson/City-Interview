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

// 2. Define the new iPad & Adaptive Layouts question
const newQuestion = {
  id: "Q-23",
  category: "SwiftUI & UIKit Layout",
  difficulty: "Advanced",
  question: "How do you handle iPad, split view, and adaptive layouts?",
  interviewSentence: "I design for the space available rather than specific hardware, leveraging size classes, split view controllers, and flexible adaptive grids so the exact same codebase seamlessly adapts from iPhone to Stage Manager.",
  answer: `My main rule is: don't design for a device, design for the space I am given. On iPad, the app can run full screen, in Split View, in Slide Over, or in a resizable window in Stage Manager. The size can change at any time, so I never check UIDevice.current.userInterfaceIdiom to decide the layout. I react to the size of my own view.

In UIKit, I use size classes through traitCollection. There are two values, horizontal and vertical, and each is either compact (.compact) or regular (.regular). An iPhone in portrait is compact width. A full-screen iPad is regular width. The same iPad in a narrow 1/3 Split View becomes compact width, so my app automatically switches to the iPhone layout. When the size changes, I get traitCollectionDidChange or viewWillTransition(to:with:), and I update the layout there. For the structure of the app, I use UISplitViewController. It shows a sidebar and detail side by side in regular width, and collapses into a normal navigation stack in compact width, so I write the navigation once.

In SwiftUI, I use @Environment(\\.horizontalSizeClass) to read the size class, and NavigationSplitView for sidebar and detail. For custom cases, I use ViewThatFits or GeometryReader. I also use LazyVGrid with .adaptive columns, so the number of columns changes with the width, instead of fixing it to 2 or 3.

For Auto Layout, I pin to safeAreaLayoutGuide and readableContentGuide, so text lines don't become too wide on a big screen. I also set a max width on content when needed. I test with all of these: iPad full screen, 1/3 and 1/2 Split View, Slide Over, landscape, and Stage Manager resizing.

Key ideas:
• Space, not device: Never check "is this an iPad." Check the size class or the real container width.
• Size classes: Compact or Regular, for width and height.
• Split view controller: One navigation setup (UISplitViewController or NavigationSplitView) that works for both iPhone and iPad.
• Flexible layout: Adaptive grids, safe area, readable content guide, max widths, and ViewThatFits.
• Test every size: Split View, Slide Over, and Stage Manager resizable windows.

Good to mention:
• Size class is not the same as screen size. Large iPhones in landscape can be regular width in some cases, and an iPad in 1/3 Split View is compact width.
• Don't cache layout sizes: Re-query traits and geometry when the trait collection or environment size class changes.
• iPad hardware affordances: Support keyboard shortcuts (UIKeyCommand or .keyboardShortcut), pointer hover effects, and drag & drop.
• Multi-window iPadOS: Apps run in resizable windows; support UIScene and multiple scenes where it brings user value.
• Empty state in detail pane: Use UIContentUnavailableConfiguration or ContentUnavailableView when nothing is selected.
• UIDevice.current.userInterfaceIdiom is acceptable for feature availability (e.g., Apple Pencil, camera types), but never for geometric layout decisions.

One-liner: I design for the space available, using size classes, split view controllers, and flexible layouts, so the same code works on iPhone, iPad, and any window size.`,
  codeExample: `// MARK: - Senior iOS Interview: Adaptive Layouts, Size Classes & Multi-Window iPadOS Architecture
import UIKit
import SwiftUI

// =========================================================================
// 1. UIKit Adaptive Strategy: Size Classes & Container View Controllers
// =========================================================================

final class AdaptiveFeedViewController: UIViewController {
    private let stackView = UIStackView()
    private let primaryContentView = UIView()
    private let secondarySidebarView = UIView()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupAdaptiveHierarchy()
    }

    private func setupAdaptiveHierarchy() {
        // MARK: Interview Rule — Never check UIDevice.current.userInterfaceIdiom for Layout!
        // An iPad in 1/3 Split View or Slide Over has a Compact width (.compact),
        // requiring an iPhone-style single-column layout. An iPhone Pro Max in landscape
        // can offer Regular width (.regular). Always query size classes or trait collections!
        stackView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stackView)

        // Readable Content Guide: Prevents text lines from stretching uncomfortably wide on 13" iPad Pro
        NSLayoutConstraint.activate([
            stackView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            stackView.leadingAnchor.constraint(equalTo: view.readableContentGuide.leadingAnchor),
            stackView.trailingAnchor.constraint(equalTo: view.readableContentGuide.trailingAnchor),
            stackView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        updateLayoutForTraitCollection(traitCollection)
    }

    // iOS 17+ Modern Trait Registration (or legacy traitCollectionDidChange)
    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        guard previousTraitCollection?.horizontalSizeClass != traitCollection.horizontalSizeClass else { return }
        updateLayoutForTraitCollection(traitCollection)
    }

    private func updateLayoutForTraitCollection(_ traits: UITraitCollection) {
        let isWide = traits.horizontalSizeClass == .regular
        // Switch between side-by-side (iPad/Regular) and vertical stacking (iPhone/Compact)
        stackView.axis = isWide ? .horizontal : .vertical
        stackView.spacing = isWide ? 24 : 12
    }
}

// MARK: - Enterprise Multi-Column Navigation with UISplitViewController
final class MainSplitCoordinator {
    func makeRootSplitController() -> UISplitViewController {
        // UISplitViewController handles Stage Manager, Split View, and rotation out-of-the-box
        let split = UISplitViewController(style: .doubleColumn)
        split.preferredDisplayMode = .oneBesideSecondary
        split.preferredSplitBehavior = .tile

        let sidebarVC = UIViewController() // Primary sidebar
        let detailVC = UIViewController()  // Secondary detail
        let compactTabsVC = UITabBarController() // Dedicated iPhone tab bar fallback

        split.setViewController(sidebarVC, for: .primary)
        split.setViewController(detailVC, for: .secondary)
        split.setViewController(compactTabsVC, for: .compact) // Automatic collapse on Compact width

        return split
    }
}

// =========================================================================
// 2. SwiftUI Adaptive Strategy: Size Classes, NavigationSplitView & Grids
// =========================================================================

struct AdaptiveDashboardView: View {
    // Read horizontal size class from the environment
    @Environment(\\.horizontalSizeClass) private var horizontalSizeClass
    @State private var selectedAccountID: String?

    var body: some View {
        // MARK: Native Two/Three-Column Adaptive Navigation
        // NavigationSplitView automatically collapses to a NavigationStack on iPhone or 1/3 Split View!
        NavigationSplitView {
            List(selection: $selectedAccountID) {
                Text("Checking Account (••• 4821)").tag("checking")
                Text("Savings Account (••• 9102)").tag("savings")
                Text("Investment Portfolio").tag("investments")
            }
            .navigationTitle("Accounts")
        } detail: {
            if let accountID = selectedAccountID {
                AccountDetailView(accountID: accountID)
            } else {
                // Content Unavailable configuration for iPad when no row is selected
                ContentUnavailableView(
                    "Select an Account",
                    systemImage: "creditcard",
                    description: Text("Choose an account from the sidebar to inspect ledger transactions.")
                )
            }
        }
    }
}

struct AccountDetailView: View {
    let accountID: String

    var body: some View {
        ScrollView {
            // Adaptive Grid: Columns expand automatically based on available canvas width
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 180, maximum: 300), spacing: 16)], spacing: 16) {
                ForEach(1...8, id: \\.self) { idx in
                    MetricCardView(title: "Metric #\\(idx)")
                }
            }
            .padding()

            // ViewThatFits: Selects the first layout that fits into the current width without truncation
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 12) { ActionButtonsGroup() } // Regular width
                VStack(spacing: 8) { ActionButtonsGroup() }   // Compact fallback
            }
            .padding()
        }
        .navigationTitle(accountID.capitalized)
    }
}

struct MetricCardView: View {
    let title: String
    var body: some View {
        RoundedRectangle(cornerRadius: 12)
            .fill(Color.secondary.opacity(0.1))
            .frame(height: 90)
            .overlay(Text(title).font(.subheadline).bold())
    }
}

struct ActionButtonsGroup: View {
    var body: some View {
        Group {
            Button("Transfer Funds") {}
            Button("Deposit Check") {}
            Button("Download Statement") {}
        }
        .buttonStyle(.borderedProminent)
    }
}`
};

// 3. Insert question right after Q-22 ("Auto Layout, Dynamic Type, and Accessibility (a11y)")
// Find index of Q-22
const insertIndex = questions.findIndex(q => q.id === 'Q-22') + 1;
console.log('Inserting at index:', insertIndex);
questions.splice(insertIndex, 0, newQuestion);

// Re-index all questions sequentially Q-01 to Q-65
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
const adaptiveDocs = [
  {
    docId: "autolayout-basics",
    title: "Auto Layout Basics — Talking Points",
    icon: "📐",
    filename: "AutoLayoutBasics-TalkingPoints.md"
  },
  {
    docId: "swiftui-uikit-interop",
    title: "SwiftUI & UIKit Interop — Talking Points",
    icon: "🔄",
    filename: "SwiftUI-UIKit-Interop-TalkingPoints.md"
  }
];

questions.forEach(q => {
  if (q.question.includes('iPad, split view')) {
    updatedQToDocs[q.id] = adaptiveDocs;
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
    color: "#6366f1",
    summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles.",
    docIds: ["clean-architecture", "coordinator-pattern", "dependency-injection", "mvvm", "repository-pattern", "solid-principles", "viper-pattern"],
    questionIds: ["Q-01", "Q-02", "Q-03", "Q-04", "Q-05"]
  },
  {
    id: "concurrency",
    title: "Swift Concurrency & Multithreading",
    shortTitle: "Swift Concurrency",
    icon: "⚡",
    color: "#f59e0b",
    summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions.",
    docIds: ["multithreading-gcd", "concurrency-issues", "thread-safety", "operation-queue"],
    questionIds: ["Q-06", "Q-07", "Q-08", "Q-09", "Q-10", "Q-11", "Q-12"]
  },
  {
    id: "core-advance-swift",
    title: "Core Swift & Language Internals",
    shortTitle: "Core & Advance Swift",
    icon: "🚀",
    color: "#ec4899",
    summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops.",
    docIds: ["ios-internals", "swiftui-state"],
    questionIds: ["Q-13", "Q-14", "Q-15", "Q-16", "Q-17", "Q-18"]
  },
  {
    id: "swift-basics-ui",
    title: "SwiftUI & UIKit Layout",
    shortTitle: "UI & Layout",
    icon: "🎨",
    color: "#8b5cf6",
    summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), iPad adaptive layouts, atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, and UIKit interoperability.",
    docIds: ["autolayout-basics", "composable-ui", "design-system", "swiftui-uikit-interop", "swiftui-state"],
    questionIds: ["Q-19", "Q-20", "Q-21", "Q-22", "Q-23", "Q-24", "Q-25", "Q-26"]
  },
  {
    id: "combine-reactive",
    title: "Combine & Reactive Streams",
    shortTitle: "Combine & Streams",
    icon: "🌊",
    color: "#0ea5e9",
    summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles.",
    docIds: [],
    questionIds: ["Q-27"]
  },
  {
    id: "networking",
    title: "Networking, APIs & Background Tasks",
    shortTitle: "Networking & APIs",
    icon: "🌐",
    color: "#10b981",
    summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler.",
    docIds: ["networking-architecture"],
    questionIds: ["Q-28", "Q-29", "Q-30"]
  },
  {
    id: "modularity-performance",
    title: "Modularity, Build & Launch Performance",
    shortTitle: "Modularity & Perf",
    icon: "📦",
    color: "#06b6d4",
    summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.",
    docIds: ["modular-architecture", "performance-profiling"],
    questionIds: ["Q-31", "Q-32", "Q-33", "Q-34", "Q-35"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#a855f7",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-36", "Q-37", "Q-38", "Q-39"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#f43f5e",
    summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "leadership-ownership"],
    questionIds: ["Q-40", "Q-41", "Q-42", "Q-43", "Q-44", "Q-45", "Q-46"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#e11d48",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-47", "Q-48"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#38bdf8",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-49", "Q-50", "Q-51", "Q-52", "Q-53", "Q-54", "Q-55", "Q-56"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#d97706",
    summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: [],
    questionIds: ["Q-57"]
  },
  {
    id: "memory-management",
    title: "Memory Management",
    shortTitle: "Memory Mgmt",
    icon: "🧠",
    color: "#14b8a6",
    summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit.",
    docIds: [],
    questionIds: ["Q-58", "Q-59", "Q-60", "Q-61", "Q-62", "Q-63", "Q-64", "Q-65"]
  }
];

// 7. Regenerate QUESTIONS.md
const topicMeta = {
  "Architecture & Design Patterns": { icon: "🏗️", summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles." },
  "Swift Concurrency & Multithreading": { icon: "⚡", summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions." },
  "Core Swift & Language Internals": { icon: "🚀", summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops." },
  "SwiftUI & UIKit Layout": { icon: "🎨", summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), iPad adaptive layouts, atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, Property Wrappers (@State, @Binding, @Published), and UIKit interoperability." },
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
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Memory Management, System Design, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
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
indexHtml = indexHtml.replace(/Advanced \(\d+\)/g, `Advanced (26)`);

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
