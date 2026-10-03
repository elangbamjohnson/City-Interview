const fs = require('fs');

const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';

// 1. Read existing questions and index.html
const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
let indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');

console.log('Current question count:', questions.length);

// Extract current QUESTION_TO_DOCS from index.html
const qDocsMatch = indexHtml.match(/const QUESTION_TO_DOCS = (\{[\s\S]*?\});\n/);
const currentQToDocs = qDocsMatch ? JSON.parse(qDocsMatch[1]) : {};

// Build a mapping from question text to doc list so we can remap after ID shifting
const textToDocs = new Map();
questions.forEach(q => {
  if (currentQToDocs[q.id]) {
    textToDocs.set(q.question, currentQToDocs[q.id]);
  }
});

// 2. Define the new question
const newQuestion = {
  id: "Q-20",
  category: "SwiftUI & UIKit Layout",
  difficulty: "Advanced",
  question: "SwiftUI vs UIKit: how do you decide for a large app?",
  interviewSentence: "For a large app I pick per screen: SwiftUI for new work, UIKit where I need fine control or performance, and I never rewrite stable UIKit screens without a clear business reason.",
  answer: `I don't treat it as one or the other. For a large app, I decide per screen and per feature, based on the team, the minimum iOS version, and how much risk the screen carries.

For new screens, I default to SwiftUI. It is faster to build, it has less code, and previews help the team iterate. It also works well with async/await and @Observable, and it is where Apple is putting its new features. For a large team, one common style across screens is also easier to maintain.

I keep UIKit when the screen needs fine control or is very performance sensitive. Examples are complex collection views with custom layouts, heavy text editing, camera or video screens, and anything that needs a UIKit-only API. I also don't rewrite stable UIKit screens just to use SwiftUI. A rewrite costs time and can bring new bugs, with no value to the user.

The two work together. I use UIHostingController to put SwiftUI inside UIKit, and UIViewRepresentable or UIViewControllerRepresentable to put UIKit inside SwiftUI. So I can migrate one screen at a time, starting with leaf screens like settings or profile, and keep the navigation and shell in UIKit until the end.

Before I decide, I check the minimum iOS version. If we support older versions, some SwiftUI features, like NavigationStack or @Observable, are not available, and that can push me to UIKit for some flows.

How I decide:
• New feature, modern iOS target: SwiftUI.
• Stable UIKit screen that works: leave it.
• Complex custom layout, text editing, camera, heavy lists: UIKit, or SwiftUI with UIKit pieces.
• Older iOS support: check what SwiftUI features I can really use.
• Team skill: if the team knows UIKit well, I move step by step, with training and code review.

Good to mention in an interview:
• Debugging SwiftUI is harder in some cases because the view update rules are less visible; use Self._printChanges() and Instruments to understand redraws.
• Mixed codebases need clear boundaries: a screen is either SwiftUI or UIKit, and they talk through simple models and closures, not shared view code.
• Measure before deciding on performance: many lists that were slow in early SwiftUI are fine now with LazyVStack and List.

One-liner: For a large app I pick per screen: SwiftUI for new work, UIKit where I need control, and I don't rewrite stable screens without a reason.`,
  codeExample: `// MARK: - Senior Interview Concept: SwiftUI vs UIKit Enterprise Hybrid Strategy
import UIKit
import SwiftUI
import MapKit

// =========================================================================
// 1. SWIFTUI INSIDE UIKIT (Incremental Leaf Migration)
// =========================================================================
// UIHostingController wraps a SwiftUI View inside a UIViewController.
// Ideal for migrating leaf screens (Settings, Profile, Forms) inside existing UIKit navigation.
struct SettingsView: View {
    var body: some View {
        Text("Enterprise Settings Screen")
            .font(.headline)
    }
}

class DashboardViewController: UIViewController {
    func openSettings() {
        // Wrap SwiftUI view in UIHostingController
        let hosting = UIHostingController(rootView: SettingsView())
        // Seamlessly push onto existing UIKit UINavigationController
        navigationController?.pushViewController(hosting, animated: true)
    }
}

// =========================================================================
// 2. UIKIT INSIDE SWIFTUI (Fine-Grained Performance & Legacy APIs)
// =========================================================================
// UIViewRepresentable bridges complex UIKit components (MapKit, Camera, UITextView) into SwiftUI.
struct MapContainer: UIViewRepresentable {
    // 1. Create the UIKit view once
    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.showsUserLocation = true
        return mapView
    }

    // 2. Update UIKit view when SwiftUI state changes
    func updateUIView(_ view: MKMapView, context: Context) {
        // Configure region, overlays, or annotations
    }
}`
};

// Insert new question right after Q-19 (index 19)
const insertIndex = 19;
questions.splice(insertIndex, 0, newQuestion);

// Renumber strictly Q-01 to Q-55
questions.forEach((q, idx) => {
  q.id = `Q-${String(idx + 1).padStart(2, '0')}`;
});

console.log('New total questions count:', questions.length);
console.log(`Inserted at ${questions[insertIndex].id}: ${questions[insertIndex].question}`);

// Reconstruct QUESTION_TO_DOCS for new IDs
const newQToDocs = {};
questions.forEach(q => {
  const docs = textToDocs.get(q.question);
  if (docs) {
    newQToDocs[q.id] = docs;
  }
});
// Attach swiftui-uikit-interop to the new Q-20
newQToDocs['Q-20'] = [
  {
    docId: 'swiftui-uikit-interop',
    title: 'SwiftUI & UIKit Interoperability — Cheat Sheet',
    filename: 'Interoperability-README.md',
    icon: '🤝'
  }
];

// Save questions.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
console.log('✓ Saved questions.json successfully!');

// 3. Update TOPIC_CATEGORIES
const updatedCategories = [
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
    summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, and UIKit interoperability.",
    docIds: ["autolayout-basics", "composable-ui", "design-system", "swiftui-uikit-interop", "swiftui-state"],
    questionIds: ["Q-19", "Q-20", "Q-21", "Q-22", "Q-23", "Q-24"]
  },
  {
    id: "combine-reactive",
    title: "Combine & Reactive Streams",
    shortTitle: "Combine & Streams",
    icon: "🌊",
    color: "#0ea5e9",
    summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles.",
    docIds: [],
    questionIds: ["Q-25"]
  },
  {
    id: "networking",
    title: "Networking, APIs & Background Tasks",
    shortTitle: "Networking & APIs",
    icon: "🌐",
    color: "#10b981",
    summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler.",
    docIds: ["networking-architecture"],
    questionIds: ["Q-26", "Q-27", "Q-28"]
  },
  {
    id: "modularity-performance",
    title: "Modularity, Build & Launch Performance",
    shortTitle: "Modularity & Perf",
    icon: "📦",
    color: "#06b6d4",
    summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.",
    docIds: ["modular-architecture", "performance-profiling"],
    questionIds: ["Q-29", "Q-30", "Q-31", "Q-32", "Q-33"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#a855f7",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-34", "Q-35", "Q-36", "Q-37"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#f43f5e",
    summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "leadership-ownership"],
    questionIds: ["Q-38", "Q-39", "Q-40", "Q-41", "Q-42", "Q-43", "Q-44"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#e11d48",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-45", "Q-46"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#38bdf8",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-47", "Q-48", "Q-49", "Q-50", "Q-51", "Q-52", "Q-53", "Q-54"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#d97706",
    summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: [],
    questionIds: ["Q-55"]
  }
];

// 4. Update index.html
// Replace QUESTIONS
const questionsJsonStr = JSON.stringify(questions);
indexHtml = indexHtml.replace(/const QUESTIONS = \[[\s\S]*?\];\n/, () => `const QUESTIONS = ${questionsJsonStr};\n`);

// Replace QUESTION_TO_DOCS
const qDocsJsonStr = JSON.stringify(newQToDocs);
indexHtml = indexHtml.replace(/const QUESTION_TO_DOCS = \{[\s\S]*?\};\n/, () => `const QUESTION_TO_DOCS = ${qDocsJsonStr};\n`);

// Replace TOPIC_CATEGORIES
const categoriesJsonStr = JSON.stringify(updatedCategories);
indexHtml = indexHtml.replace(/const TOPIC_CATEGORIES = \[[\s\S]*?\];\n/, () => `const TOPIC_CATEGORIES = ${categoriesJsonStr};\n`);

// Update header badges and labels
indexHtml = indexHtml.replace(/54 Questions · 24 Guides/g, '55 Questions · 24 Guides');
indexHtml = indexHtml.replace(/all 54 senior iOS interview questions/g, 'all 55 senior iOS interview questions');
indexHtml = indexHtml.replace(/all 54 questions grouped by topic/g, 'all 55 questions grouped by topic');
indexHtml = indexHtml.replace(/all 54 questions/g, 'all 55 questions');
indexHtml = indexHtml.replace(/<span class="stat-value" id="totalCount">54<\/span>/g, '<span class="stat-value" id="totalCount">55</span>');

// Update Tier Pills
indexHtml = indexHtml.replace(/All \(54\)/g, 'All (55)');
indexHtml = indexHtml.replace(/All Difficulties \(54\)/g, 'All Difficulties (55)');
indexHtml = indexHtml.replace(/Advanced \(23\)/g, 'Advanced (24)');

// Verify script syntax
const scriptContent = indexHtml.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(scriptContent);
console.log('✓ index.html script syntax verified!');

fs.writeFileSync(INDEX_PATH, indexHtml, 'utf-8');
console.log('✓ Saved index.html successfully!');

// 5. Generate and write QUESTIONS.md
const catMeta = {
  "Architecture & Design Patterns": { icon: "🏗️", range: "(Q-01 – Q-05)", summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles." },
  "Swift Concurrency & Multithreading": { icon: "⚡", range: "(Q-06 – Q-12)", summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions." },
  "Core Swift & Language Internals": { icon: "🚀", range: "(Q-13 – Q-18)", summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops." },
  "SwiftUI & UIKit Layout": { icon: "🎨", range: "(Q-19 – Q-24)", summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, Property Wrappers (@State, @Binding, @Published), and UIKit interoperability." },
  "Combine & Reactive Streams": { icon: "🌊", range: "(Q-25)", summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles." },
  "Networking, APIs & Background Tasks": { icon: "🌐", range: "(Q-26 – Q-28)", summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler." },
  "Modularity, Build & Launch Performance": { icon: "📦", range: "(Q-29 – Q-33)", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Data Persistence & Memory Deep Dive": { icon: "💾", range: "(Q-34 – Q-37)", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Security, App Hardening & Compliance": { icon: "🔒", range: "(Q-38 – Q-44)", summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "System Design & Mobile Architecture": { icon: "🏛️", range: "(Q-45 – Q-46)", summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution." },
  "Testing, CI/CD & AI Engineering": { icon: "🧪", range: "(Q-47 – Q-54)", summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems." },
  "Engineering Leadership & Operations": { icon: "👔", range: "(Q-55)", summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern." }
};

const diffBadge = {
  "Intermediate": "🔵 `Intermediate`",
  "Advanced": "🔴 `Advanced`",
  "Beginner": "🟢 `Beginner`"
};

const mdLines = [];
mdLines.push("# 📱 iOS Senior Interview Question Bank");
mdLines.push("");
mdLines.push("> A comprehensive, senior-level revision guide for 55 iOS interview questions covering Swift internals, Concurrency, Architecture, System Design, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.");
mdLines.push("");
mdLines.push("## 📊 Overview");
mdLines.push("");
mdLines.push("| Category / Topic | Questions | Key Coverage |");
mdLines.push("| :--- | :---: | :--- |");
for (const cat of updatedCategories) {
  mdLines.push(`| ${cat.icon} **${cat.title}** | \`${cat.questionIds[0]} – ${cat.questionIds[cat.questionIds.length - 1]}\` (${cat.questionIds.length}) | ${cat.summary} |`);
}
mdLines.push("");
mdLines.push("---");
mdLines.push("");

for (const cat of updatedCategories) {
  const catTitle = cat.title;
  const qs = cat.questionIds.map(id => questions.find(q => q.id === id)).filter(Boolean);
  const meta = catMeta[catTitle] || { icon: "📁", range: "", summary: cat.summary };

  mdLines.push(`## ${cat.icon} ${catTitle} ${meta.range}`);
  mdLines.push("");
  mdLines.push(`> ${cat.summary}`);
  mdLines.push("");

  for (const q of qs) {
    mdLines.push(`### \`${q.id}\` — ${q.question}`);
    mdLines.push("");
    mdLines.push(`- **Difficulty:** ${diffBadge[q.difficulty] || q.difficulty}`);
    mdLines.push(`- **Category:** \`${q.category}\``);
    mdLines.push("");
    mdLines.push("> [!TIP]");
    mdLines.push(`> **🗣️ Interview Pitch (Say it like this):**  `);
    mdLines.push(`> *"${q.interviewSentence}"*`);
    mdLines.push("");
    mdLines.push("#### 📖 Detailed Answer");
    mdLines.push("");
    mdLines.push(q.answer);
    mdLines.push("");
    if (q.codeExample) {
      mdLines.push("#### 💻 Swift Code Example");
      mdLines.push("");
      mdLines.push("```swift");
      mdLines.push(q.codeExample);
      mdLines.push("```");
      mdLines.push("");
    }
    mdLines.push("---");
    mdLines.push("");
  }
}

fs.writeFileSync(QUESTIONS_MD_PATH, mdLines.join('\n'), 'utf-8');
console.log('✓ Saved QUESTIONS.md successfully!');
