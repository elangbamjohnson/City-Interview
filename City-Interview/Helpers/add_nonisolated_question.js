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
  id: "Q-08",
  category: "Swift Concurrency & Multithreading",
  difficulty: "Advanced",
  question: "What is nonisolated? When do you use it?",
  interviewSentence: "nonisolated marks an actor member as exempt from actor isolation so it can be called synchronously without await, provided it never accesses the actor's mutable state (Memory trick: P-L-S — Pure helpers, Let constants, Sync protocol conformance).",
  answer: `nonisolated tells the compiler that a method or property inside an actor, or inside a @MainActor class, is not tied to that actor. It does not run on the actor's isolation, so I can call it from anywhere without await. The price is that it cannot touch the actor's mutable state, because that state is protected.

I use it when the code inside does not need the protected state. The common cases are:
1. Pure helper functions that only work on their inputs.
2. Computed properties built from let constants.
3. Synchronous protocol conformances: Hashable, Equatable, CustomStringConvertible, or Identifiable, where the protocol requires a normal synchronous method or property. In those cases, the actor method would otherwise need await, and the protocol would not accept it. So I mark it nonisolated.

I don't use it just to silence a compiler error. If the code needs the actor's state, it should stay isolated, and the caller should use await.

Good to mention in an interview:
• Sendable requirement: A nonisolated member can only read let properties that are Sendable. Reading a var is a compile-time error.
• @MainActor helper offloading: nonisolated on a @MainActor class is useful when background code needs to call a small helper without hopping to the main thread.
• nonisolated(unsafe): Exists for global or static variables, but it is an opt-out promise to the compiler that bypasses concurrency checking, so it should be avoided unless strictly necessary for legacy interop.
• Swift 6+ evolutions: Swift 6 introduces nonisolated(nonsending) and dynamic actor execution for nonisolated async functions, running on the caller's actor context.

One-liner: nonisolated marks a member as not tied to the actor, so I can call it without await, but it cannot touch the actor's mutable state.

Memory trick: P-L-S → "Pure helpers, Let constants, Sync protocol conformance."`,
  codeExample: `// MARK: - Senior Interview Concept: Swift 'nonisolated' Keyword in Practice
import Foundation

// 1. Actor with isolated state and nonisolated exemptions
actor UserStore {
    let id: UUID                       // Immutable let constant (Sendable)
    private var users: [String] = []   // Mutable actor-isolated state (protected)

    init(id: UUID = UUID()) {
        self.id = id
    }

    // 🔒 ISOLATED: Mutates actor-protected state — requires 'await' from outside
    func add(_ name: String) {
        users.append(name)
    }

    // ⚡ NONISOLATED PROPERTY: Reads only an immutable 'let', safe without actor hopping
    nonisolated var storeID: String {
        id.uuidString
    }

    // ⚡ NONISOLATED METHOD: Pure helper function, touches zero actor state
    nonisolated func format(_ name: String) -> String {
        name.trimmingCharacters(in: .whitespaces).capitalized
    }
}

// 2. SYNCHRONOUS PROTOCOL CONFORMANCE:
// Protocols like CustomStringConvertible, Hashable, Equatable require synchronous getters.
// Actors cannot satisfy synchronous protocol requirements unless marked 'nonisolated'.
extension UserStore: CustomStringConvertible {
    nonisolated var description: String {
        "UserStore(\\(id))"
    }
}

// Usage demonstration:
let store = UserStore()
print(store.storeID)            // ✅ Synchronous call: NO await needed
print(store.format(" john "))   // ✅ Synchronous call: NO await needed
Task {
    await store.add("John")     // 🔒 Isolated call: 'await' required
}

// 3. NONISOLATED IN @MainActor CLASSES:
// Avoids hopping onto the main thread for pure computational tasks.
@MainActor
final class ProfileViewModel {
    var name = "" // Bound to MainActor

    // Background threads can call this without triggering a main thread hop
    nonisolated func validate(_ email: String) -> Bool {
        email.contains("@") // Zero access to 'name' or main thread state
    }
}`
};

// Insert new question right after Q-07 (at index 7)
const insertIndex = 7;
questions.splice(insertIndex, 0, newQuestion);

// Renumber strictly Q-01 to Q-54
questions.forEach((q, idx) => {
  q.id = `Q-${String(idx + 1).padStart(2, '0')}`;
});

console.log('New total questions count:', questions.length);

// Reconstruct QUESTION_TO_DOCS for new IDs
const newQToDocs = {};
questions.forEach(q => {
  const docs = textToDocs.get(q.question);
  if (docs) {
    newQToDocs[q.id] = docs;
  }
});
// Attach multithreading-gcd to new question Q-08
newQToDocs['Q-08'] = [
  {
    docId: 'multithreading-gcd',
    title: 'iOS Concurrency & GCD Reference',
    filename: 'Multithreading-README.md',
    icon: '⚡'
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
    questionIds: ["Q-19", "Q-20", "Q-21", "Q-22", "Q-23"]
  },
  {
    id: "combine-reactive",
    title: "Combine & Reactive Streams",
    shortTitle: "Combine & Streams",
    icon: "🌊",
    color: "#0ea5e9",
    summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles.",
    docIds: [],
    questionIds: ["Q-24"]
  },
  {
    id: "networking",
    title: "Networking, APIs & Background Tasks",
    shortTitle: "Networking & APIs",
    icon: "🌐",
    color: "#10b981",
    summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler.",
    docIds: ["networking-architecture"],
    questionIds: ["Q-25", "Q-26", "Q-27"]
  },
  {
    id: "modularity-performance",
    title: "Modularity, Build & Launch Performance",
    shortTitle: "Modularity & Perf",
    icon: "📦",
    color: "#06b6d4",
    summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.",
    docIds: ["modular-architecture", "performance-profiling"],
    questionIds: ["Q-28", "Q-29", "Q-30", "Q-31", "Q-32"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#a855f7",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-33", "Q-34", "Q-35", "Q-36"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#f43f5e",
    summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "leadership-ownership"],
    questionIds: ["Q-37", "Q-38", "Q-39", "Q-40", "Q-41", "Q-42", "Q-43"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#e11d48",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-44", "Q-45"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#38bdf8",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-46", "Q-47", "Q-48", "Q-49", "Q-50", "Q-51", "Q-52", "Q-53"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#d97706",
    summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: [],
    questionIds: ["Q-54"]
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
indexHtml = indexHtml.replace(/53 Questions · 24 Guides/g, '54 Questions · 24 Guides');
indexHtml = indexHtml.replace(/all 53 senior iOS interview questions/g, 'all 54 senior iOS interview questions');
indexHtml = indexHtml.replace(/all 53 questions grouped by topic/g, 'all 54 questions grouped by topic');
indexHtml = indexHtml.replace(/all 53 questions/g, 'all 54 questions');
indexHtml = indexHtml.replace(/<span class="stat-value" id="totalCount">53<\/span>/g, '<span class="stat-value" id="totalCount">54</span>');
indexHtml = indexHtml.replace(/<span class="stat-value" id="totalCount">52<\/span>/g, '<span class="stat-value" id="totalCount">54</span>');

// Update Tier Pills
indexHtml = indexHtml.replace(/All \(53\)/g, 'All (54)');
indexHtml = indexHtml.replace(/All Difficulties \(53\)/g, 'All Difficulties (54)');
indexHtml = indexHtml.replace(/Advanced \(22\)/g, 'Advanced (23)');

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
  "SwiftUI & UIKit Layout": { icon: "🎨", range: "(Q-19 – Q-23)", summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, Property Wrappers (@State, @Binding, @Published), and UIKit interoperability." },
  "Combine & Reactive Streams": { icon: "🌊", range: "(Q-24)", summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles." },
  "Networking, APIs & Background Tasks": { icon: "🌐", range: "(Q-25 – Q-27)", summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler." },
  "Modularity, Build & Launch Performance": { icon: "📦", range: "(Q-28 – Q-32)", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Data Persistence & Memory Deep Dive": { icon: "💾", range: "(Q-33 – Q-36)", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Security, App Hardening & Compliance": { icon: "🔒", range: "(Q-37 – Q-43)", summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "System Design & Mobile Architecture": { icon: "🏛️", range: "(Q-44 – Q-45)", summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution." },
  "Testing, CI/CD & AI Engineering": { icon: "🧪", range: "(Q-46 – Q-53)", summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems." },
  "Engineering Leadership & Operations": { icon: "👔", range: "(Q-54)", summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern." }
};

const diffBadge = {
  "Intermediate": "🔵 `Intermediate`",
  "Advanced": "🔴 `Advanced`",
  "Beginner": "🟢 `Beginner`"
};

const catGroups = {};
for (const q of questions) {
  if (!catGroups[q.category]) catGroups[q.category] = [];
  catGroups[q.category].push(q);
}

const mdLines = [];
mdLines.push("# 📱 iOS Senior Interview Question Bank");
mdLines.push("");
mdLines.push("> A comprehensive, senior-level revision guide for 54 iOS interview questions covering Swift internals, Concurrency, Architecture, System Design, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.");
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
