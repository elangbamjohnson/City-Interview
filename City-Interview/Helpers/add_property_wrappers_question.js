const fs = require('fs');

const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';

const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
console.log('Current question count:', questions.length);

for (const q of questions) {
  if (q.question.includes('What are property wrappers?') || (q.question.includes('@State') && q.question.includes('@Binding') && q.question.includes('inside'))) {
    console.log(`Question already exists as ${q.id}: ${q.question}`);
    process.exit(0);
  }
}

const newQuestion = {
  id: "Q-22",
  category: "SwiftUI & UIKit Layout",
  difficulty: "Advanced",
  question: "What are property wrappers? How do @State, @Binding, and @Published work inside?",
  interviewSentence: "Property wrappers encapsulate property storage and access logic using wrapped and projected values; under the hood, @State allocates persistent heap storage tied to the view identity in the AttributeGraph, @Binding acts as a zero-storage two-way closure proxy (getter/setter), and @Published triggers objectWillChange.send() in willSet to invalidate observing views before mutation.",
  answer: `Property wrappers (introduced in Swift 5.1 via SE-0258) are a metaprogramming mechanism that lets you extract and reuse property management logic — such as storage, synchronization, or validation — behind clean, declarative syntax.

1. Anatomy of a Property Wrapper:
• @propertyWrapper: Declares a struct or class as a property wrapper.
• wrappedValue: Required property that defines what is read and written when accessing the variable directly (e.g. user.name).
• projectedValue: Optional property exposed via the $ prefix ($user.name). In SwiftUI, this exposes an auxiliary interface (such as a two-way Binding or Combine Publisher).
• Synthesized Storage: For a property @Wrapper var count: Int, the Swift compiler synthesizes a private backing variable named _count of type Wrapper.

2. How @State Works Under the Hood:
• The Challenge: SwiftUI Views are ephemeral structs allocated on the stack. When state changes, body re-evaluates and the struct is destroyed and recreated. Normal struct properties would reset to their initial values.
• The Internal Mechanism:
  - @State is a struct that does NOT store its value directly inside the view struct.
  - Instead, @State holds an internal pointer/token to a persistent storage box allocated on the heap inside SwiftUI's AttributeGraph (the persistent dependency graph).
  - When a view's body is re-evaluated, SwiftUI matches the new struct to its existing node in the AttributeGraph via its identity (structural or explicit) and reconnects the _state wrapper to the same heap storage.
  - Mutating wrappedValue: When you write count += 1, the setter mutates the heap box and notifies the AttributeGraph that this node is "dirty", scheduling a redraw on the main runloop.
  - Projected Value ($count): Returns a Binding<Value> whose getter and setter are bound directly to that heap box.

3. How @Binding Works Under the Hood:
• Zero Local Storage: Unlike @State, @Binding stores NO data of its own. It is a reference / proxy to a source of truth owned elsewhere (e.g. a parent's @State or a custom model).
• The Closure Mechanism:
  - Internally, Binding<Value> wraps two closures:
    1. get: () -> Value
    2. set: (Value) -> Void
  - Reading wrappedValue invokes get(). Writing wrappedValue invokes set(newValue).
  - When the child view writes through a @Binding, the mutation executes directly against the parent's source of truth, triggering invalidation in the parent's view graph.
  - Projected Value ($binding): Simply returns self (the Binding itself), allowing bindings to be passed down through child view hierarchies without recreating wrappers.

4. How @Published Works Under the Hood:
• Class-Based Reactive State: Used inside classes conforming to ObservableObject (from Combine).
• The willSet Timing (Critical Interview Detail):
  - When a property marked @Published changes, it fires objectWillChange.send() in willSet (BEFORE the value is assigned), NOT in didSet.
  - Why willSet? Because SwiftUI needs to capture the previous view hierarchy and prepare layout animations before the mutation takes effect.
  - The compiler synthesizes an ObservableObjectPublisher on the enclosing class. The @Published wrapper captures a reference to this enclosing publisher when installed.
  - Projected Value ($name): Returns a Published<Value>.Publisher, which allows Combine subscribers to observe changes as a reactive stream (e.g. $query.debounce(...).sink(...)).

Key Interview Talking Points:
• Why mark @State as private? It prevents external callers from initializing or tampering with the view's local state, preserving single source of truth.
• @StateObject vs @ObservedObject: @StateObject stores the reference type in the AttributeGraph heap (surviving view re-creations), while @ObservedObject only observes an externally owned instance.
• Modern Evolution (iOS 17+): Apple's @Observable macro replaces ObservableObject and @Published by using Swift 5.9 macros to track access at the property level, eliminating whole-object invalidations and Combine dependency overhead.`,
  codeExample: `// MARK: - Interview Concept: How Property Wrappers, @State, @Binding & @Published Work Under the Hood
import SwiftUI
import Combine

// =========================================================================
// 1. ANATOMY OF A CUSTOM PROPERTY WRAPPER (Mental Model)
// =========================================================================
// Property wrappers encapsulate boilerplate logic (validation, persistence, locks).
@propertyWrapper
struct UpperCased {
    private var text: String = ""

    // 🔑 wrappedValue: What the caller sees when reading/writing directly (e.g. user.name)
    var wrappedValue: String {
        get { text }
        set { text = newValue.uppercased() }
    }

    // 🔑 projectedValue ($name): Auxiliary capability exposed via the '$' prefix
    var projectedValue: Int {
        return text.count
    }

    init(wrappedValue: String) {
        self.wrappedValue = wrappedValue
    }
}

// =========================================================================
// 2. SIMULATING HOW @Binding WORKS UNDER THE HOOD (Closure Proxy)
// =========================================================================
// @Binding stores ZERO data. It is a two-way reference (proxy) containing a getter & setter.
@propertyWrapper
struct MyBinding<Value> {
    private let getter: () -> Value
    private let setter: (Value) -> Void

    var wrappedValue: Value {
        get { getter() }
        nonmutating set { setter(newValue) }
    }

    // Projected value returns the wrapper itself ($binding -> MyBinding<Value>)
    var projectedValue: MyBinding<Value> { self }

    init(get: @escaping () -> Value, set: @escaping (Value) -> Void) {
        self.getter = get
        self.setter = set
    }
}

// =========================================================================
// 3. SIMULATING HOW @Published WORKS UNDER THE HOOD (Combine willSet)
// =========================================================================
// Inside ObservableObject, @Published fires \`objectWillChange.send()\` in willSet (BEFORE mutation).
final class MockViewModel: ObservableObject {
    // Under the hood, @Published works similarly to:
    var title: String = "" {
        willSet {
            // ⚠️ SENIOR TALKING POINT: Fires in willSet, NOT didSet!
            // SwiftUI needs to snapshot the UI before mutation to compute diffs & animations.
            objectWillChange.send()
        }
    }
}

// =========================================================================
// 4. PRODUCTION SWIFTUI VIEW: @State, @Binding, and @Published in Harmony
// =========================================================================
struct CounterContainerView: View {
    // 🧠 @State INTERNALS:
    // 'View' is an ephemeral struct destroyed on every render.
    // SwiftUI stores this 'count' in the persistent AttributeGraph (Heap).
    // The '_count' property wrapper only holds an identifier pointing to that heap box.
    @State private var count: Int = 0

    var body: some View {
        VStack(spacing: 16) {
            Text("Parent Count: \\(count)")
                .font(.headline)

            // Passing '$count' projects a Binding<Int> down to the child
            ChildCounterControl(value: $count)
        }
        .padding()
    }
}

struct ChildCounterControl: View {
    // 🧠 @Binding INTERNALS:
    // Holds NO storage. Directly mutates the parent's AttributeGraph heap cell.
    @Binding var value: Int

    var body: some View {
        HStack {
            Button("-") { value -= 1 }
            Text("\\(value)").bold()
            Button("+") { value += 1 }
        }
        .buttonStyle(.borderedProminent)
    }
}`
};

// Insert after Q-21 (index 21)
const insertIndex = 21;
questions.splice(insertIndex, 0, newQuestion);

// Renumber Q-01 to Q-53
questions.forEach((q, idx) => {
  q.id = `Q-${String(idx + 1).padStart(2, '0')}`;
});

console.log('New total questions:', questions.length);
console.log(`Inserted at ${questions[insertIndex].id}: ${questions[insertIndex].question}`);

// Save questions.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
console.log('Saved questions.json successfully!');

// Update index.html
let indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');
const questionsJsonStr = JSON.stringify(questions);
indexHtml = indexHtml.replace(/const QUESTIONS = \[[\s\S]*?\];\n/, () => `const QUESTIONS = ${questionsJsonStr};\n`);

const catMatch = indexHtml.match(/const TOPIC_CATEGORIES = (\[[\s\S]*?\]);\n/);
if (catMatch) {
  const categories = JSON.parse(catMatch[1]);
  for (const cat of categories) {
    if (cat.id === 'swift-basics-ui') {
      cat.questionIds = ['Q-18', 'Q-19', 'Q-20', 'Q-21', 'Q-22'];
      if (!cat.docIds.includes('swiftui-state')) {
        cat.docIds.push('swiftui-state');
      }
    } else if (cat.id === 'combine-reactive') {
      cat.questionIds = ['Q-23'];
    } else if (cat.id === 'networking') {
      cat.questionIds = ['Q-24', 'Q-25', 'Q-26'];
    } else if (cat.id === 'modularity-performance') {
      cat.questionIds = ['Q-27', 'Q-28', 'Q-29', 'Q-30', 'Q-31'];
    } else if (cat.id === 'data-memory') {
      cat.questionIds = ['Q-32', 'Q-33', 'Q-34', 'Q-35'];
    } else if (cat.id === 'security-compliance') {
      cat.questionIds = ['Q-36', 'Q-37', 'Q-38', 'Q-39', 'Q-40', 'Q-41', 'Q-42'];
    } else if (cat.id === 'system-design') {
      cat.questionIds = ['Q-43', 'Q-44'];
    } else if (cat.id === 'testing-ci-cd') {
      cat.questionIds = ['Q-45', 'Q-46', 'Q-47', 'Q-48', 'Q-49', 'Q-50', 'Q-51', 'Q-52'];
    } else if (cat.id === 'leadership-production') {
      cat.questionIds = ['Q-53'];
    }
  }
  const newCatStr = JSON.stringify(categories);
  indexHtml = indexHtml.replace(/const TOPIC_CATEGORIES = \[[\s\S]*?\];\n/, () => `const TOPIC_CATEGORIES = ${newCatStr};\n`);
  console.log('Updated TOPIC_CATEGORIES in index.html!');
}

indexHtml = indexHtml.replace(/52 Questions · 24 Guides/g, '53 Questions · 24 Guides');
indexHtml = indexHtml.replace(/all 52 questions grouped by topic/g, 'all 53 questions grouped by topic');
indexHtml = indexHtml.replace(/All \(52\)/g, 'All (53)');
indexHtml = indexHtml.replace(/All Difficulties \(52\)/g, 'All Difficulties (53)');
indexHtml = indexHtml.replace(/Advanced \(21\)/g, 'Advanced (22)');

fs.writeFileSync(INDEX_PATH, indexHtml, 'utf-8');
console.log('Updated index.html successfully!');

// Update QUESTIONS.md
const topicMeta = {
  "Architecture & Design Patterns": { icon: "🏗️", summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles." },
  "Swift Concurrency & Multithreading": { icon: "⚡", summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions." },
  "Core Swift & Language Internals": { icon: "🚀", summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops." },
  "SwiftUI & UIKit Layout": { icon: "🎨", summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, Property Wrappers (@State, @Binding, @Published), and UIKit interoperability." },
  "Combine & Reactive Streams": { icon: "🌊", summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles." },
  "Networking, APIs & Background Tasks": { icon: "🌐", summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler." },
  "Modularity, Build & Launch Performance": { icon: "📦", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Data Persistence & Memory Deep Dive": { icon: "💾", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Security, App Hardening & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "System Design & Mobile Architecture": { icon: "🏛️", summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution." },
  "Testing, CI/CD & AI Engineering": { icon: "🧪", summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems." },
  "Engineering Leadership & Operations": { icon: "👔", summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern." }
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
mdLines.push("> A comprehensive, senior-level revision guide for 53 iOS interview questions covering Swift internals, Concurrency, Architecture, System Design, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.");
mdLines.push("");
mdLines.push("## 📊 Overview");
mdLines.push("");
mdLines.push("| Category / Topic | Questions | Key Coverage |");
mdLines.push("|---|:---:|---|");

for (const [cat, qList] of Object.entries(catGroups)) {
  const summary = topicMeta[cat]?.summary || "";
  mdLines.push(`| **${cat}** | \`${qList.length}\` | ${summary} |`);
}

mdLines.push(`| **Total** | **\`${questions.length}\`** | Complete Senior iOS Interview Curriculum |`);
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
