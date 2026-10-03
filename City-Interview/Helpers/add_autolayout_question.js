const fs = require('fs');
const vm = require('vm');

const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';
const GENERATED_DOCS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Helpers/generated_docs.json';
const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

// 1. Read existing questions and docs
const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
const generatedDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));

console.log('Current questions count:', questions.length);

// Map existing questions to their companion docs before ID shift
const textToDocs = new Map();
questions.forEach(q => {
  if (generatedDocs.QUESTION_TO_DOCS[q.id]) {
    textToDocs.set(q.question, generatedDocs.QUESTION_TO_DOCS[q.id]);
  }
});

// 2. Define the new Auto Layout question
const newQuestion = {
  id: "Q-21",
  category: "SwiftUI & UIKit Layout",
  difficulty: "Advanced",
  question: "How does Auto Layout work?",
  interviewSentence: "Auto Layout describes relationships between views as constraint equations, and the Cassowary engine solves them to calculate every view's position and size across update, layout, and draw passes.",
  answer: `Auto Layout is a system where I describe the layout with rules, called constraints, instead of fixed frames. A constraint is a simple relationship, like "this view's leading edge is 16 points from its parent" or "this button's width is twice its height." I don't say where a view is. I say how it relates to other views and to the screen.

Behind the scenes, the layout engine turns all the constraints into a set of linear equations (using the Cassowary linear equality and inequality algorithm) and solves them to find the x, y, width, and height of every view. Each view needs enough constraints to answer four things: x position, y position, width, and height. If I give too few, the layout is ambiguous. If I give conflicting ones, the engine breaks one and prints an unsatisfiable constraints warning in the console.

Constraints have a priority from 1 to 1000. A required constraint is 1000 (.required) and must be satisfied. Lower priorities (like .defaultHigh = 750 or .defaultLow = 250) are preferences, and the engine tries to satisfy them if it can. This is how I handle flexible, adaptive layouts across varying screen sizes.

Many views also have an intrinsic content size, like a label or a button, which is the size its content needs based on font and text. For these, I don't need to set explicit width and height. Two more settings decide what happens when space is tight or extra:
• Content Hugging Priority: Says how much a view resists growing larger than its intrinsic size ("hug me tight, don't stretch me").
• Content Compression Resistance Priority: Says how much a view resists shrinking smaller than its intrinsic size ("don't truncate or clip me").
When two labels sit side by side, these decide which one grows or gets cut.

The layout runs in passes:
1. Constraint Pass (updateConstraints): Updates the constraint equations from bottom to top of the view hierarchy when something changes.
2. Layout Pass (layoutSubviews): The engine solves the math and sets the concrete center and bounds (frames) of every view from top to bottom.
3. Draw Pass (draw / display): Views render their pixels to Core Animation layers.

When I change a constraint, I don't force layout directly. I call setNeedsLayout(), and the system batches the work in the next run loop turn. If I need the result right now (for example to read a frame or animate a change inside UIView.animate), I call layoutIfNeeded().

Key ideas:
• Constraints: Mathematical relationships, not hardcoded fixed frames.
• Four answers: Every view needs x, y, width, and height, resolved from constraints or intrinsic size.
• Priority: 1000 is required, lower values are preferences.
• Hugging vs Compression Resistance: Hugging decides who stretches; compression resistance decides who resists truncation.
• Passes: updateConstraints ➔ layoutSubviews ➔ draw.

Good to mention:
• Always set translatesAutoresizingMaskIntoConstraints = false for views created in code. If I forget, UIKit generates implicit constraints from autoresizing masks that conflict with manual constraints.
• Use safeAreaLayoutGuide for notches, Dynamic Island, and the home indicator.
• Use UIStackView where possible: it manages constraints internally and keeps code clean.
• For debugging, use Xcode's Debug View Hierarchy, set accessibilityIdentifier on constraints, and read the "Unable to simultaneously satisfy constraints" log.
• Self-sizing cells require a complete, unbroken vertical chain of constraints from top to bottom of the cell contentView.
• Too many constraints, or constraints that change often on a long scrolling list, can slow down scrolling, so keep cell hierarchies shallow and clean.

One-liner: Auto Layout lets me describe views with constraint rules, and the engine solves them to find every view's position and size.`,
  codeExample: `// MARK: - Senior iOS Interview: Auto Layout Mechanics, Priorities & Constraint Lifecycle
import UIKit

final class ProfileHeaderCard: UIView {
    private let titleLabel = UILabel()
    private let actionButton = UIButton(type: .system)
    
    // Store reference to animate dynamic constraint constant changes
    private var cardHeightConstraint: NSLayoutConstraint?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupViews()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupViews() {
        // MARK: 1. translatesAutoresizingMaskIntoConstraints
        // CRITICAL INTERVIEW RULE: When adding constraints programmatically in code,
        // you MUST set translatesAutoresizingMaskIntoConstraints = false.
        // Otherwise, UIKit converts the legacy autoresizing mask into constraints,
        // creating immediate conflicting constraints with your new rules!
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        actionButton.translatesAutoresizingMaskIntoConstraints = false

        titleLabel.text = "Citi Mobile Priority Access"
        titleLabel.font = .preferredFont(forTextStyle: .headline)
        
        actionButton.setTitle("Verify Identity", for: .normal)
        actionButton.titleLabel?.font = .preferredFont(forTextStyle: .subheadline)

        addSubview(titleLabel)
        addSubview(actionButton)

        // MARK: 2. Activating Constraints (Linear Equations)
        // Auto Layout uses the Cassowary solver to resolve 4 required dimensions per view:
        // x-position, y-position, width, and height.
        NSLayoutConstraint.activate([
            // Y-position: Anchor to the safe area guide (respects notch, Dynamic Island, status bar)
            titleLabel.topAnchor.constraint(equalTo: safeAreaLayoutGuide.topAnchor, constant: 16),
            // X-position: 16pt from leading edge
            titleLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            // Width relationship (Inequality): Label trailing edge must not overlap button leading edge
            titleLabel.trailingAnchor.constraint(lessThanOrEqualTo: actionButton.leadingAnchor, constant: -8),

            // Button Y-position: Centered vertically with titleLabel
            actionButton.centerYAnchor.constraint(equalTo: titleLabel.centerYAnchor),
            // Button X-position: 16pt from container trailing edge
            actionButton.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16)
        ])

        // MARK: 3. Intrinsic Content Size, Hugging & Compression Resistance Priorities
        // UILabel and UIButton provide an intrinsicContentSize based on their content and font.
        // Therefore, explicit width and height constraints are not required.
        // When space is tight (narrow screen / large font), priorities dictate behavior:
        // • Compression Resistance: Resists shrinking ("don't truncate my text")
        // • Content Hugging: Resists expanding beyond intrinsic size ("hug me tight")
        
        // Scenario: When space is constrained, label should shrink and truncate first; button keeps full text!
        titleLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)     // Priority 250 (yields)
        actionButton.setContentCompressionResistancePriority(.required, for: .horizontal)    // Priority 1000 (must not truncate)

        // Button hugs its text tightly; title label expands to fill remaining space
        actionButton.setContentHuggingPriority(.required, for: .horizontal)                  // Priority 1000 (stays compact)
        titleLabel.setContentHuggingPriority(.defaultLow, for: .horizontal)                  // Priority 250 (expands)

        // Height constraint stored for dynamic animation
        let height = heightAnchor.constraint(equalToConstant: 100)
        height.priority = UILayoutPriority(999) // High priority allowing animation overrides
        height.isActive = true
        self.cardHeightConstraint = height
    }

    // MARK: 4. Layout Passes & Animating Constraint Changes
    func updateHeight(to newHeight: CGFloat, animated: Bool) {
        // Step 1: Mutate the constraint constant
        cardHeightConstraint?.constant = newHeight

        if animated {
            // Step 2: Invalidate layout. setNeedsLayout() marks the hierarchy as dirty.
            // It does NOT perform immediate layout; the system batches it in the next run loop turn.
            setNeedsLayout()

            // Step 3: layoutIfNeeded() forces an immediate synchronous layout pass (layoutSubviews).
            // When wrapped inside UIView.animate, Core Animation catches the frame changes and animates them!
            UIView.animate(withDuration: 0.3, delay: 0, options: [.curveEaseInOut]) {
                self.layoutIfNeeded()
            }
        } else {
            layoutIfNeeded()
        }
    }
}`
};

// 3. Insert question right before "Auto Layout, Dynamic Type, and Accessibility (a11y)"
// Find index of current Q-21
const insertIndex = questions.findIndex(q => q.id === 'Q-21');
console.log('Inserting at index:', insertIndex);
questions.splice(insertIndex, 0, newQuestion);

// Re-index all questions sequentially from Q-01 to Q-64
questions.forEach((q, idx) => {
  q.id = `Q-${String(idx + 1).padStart(2, '0')}`;
});

console.log('New total questions count:', questions.length);
console.log('Inserted question new ID:', questions[insertIndex].id, questions[insertIndex].question);

// 4. Save questions.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
console.log('Saved questions.json successfully!');

// 5. Re-map QUESTION_TO_DOCS with shifted IDs
const updatedQToDocs = {};
// Add autolayout companion doc for the new Auto Layout question
const autolayoutDoc = {
  docId: "autolayout-basics",
  title: "Auto Layout Basics — Talking Points",
  icon: "📐",
  filename: "AutoLayoutBasics-TalkingPoints.md"
};

questions.forEach(q => {
  if (q.question === "How does Auto Layout work?") {
    updatedQToDocs[q.id] = [autolayoutDoc];
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
    summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, and UIKit interoperability.",
    docIds: ["autolayout-basics", "composable-ui", "design-system", "swiftui-uikit-interop", "swiftui-state"],
    questionIds: ["Q-19", "Q-20", "Q-21", "Q-22", "Q-23", "Q-24", "Q-25"]
  },
  {
    id: "combine-reactive",
    title: "Combine & Reactive Streams",
    shortTitle: "Combine & Streams",
    icon: "🌊",
    color: "#0ea5e9",
    summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles.",
    docIds: [],
    questionIds: ["Q-26"]
  },
  {
    id: "networking",
    title: "Networking, APIs & Background Tasks",
    shortTitle: "Networking & APIs",
    icon: "🌐",
    color: "#10b981",
    summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler.",
    docIds: ["networking-architecture"],
    questionIds: ["Q-27", "Q-28", "Q-29"]
  },
  {
    id: "modularity-performance",
    title: "Modularity, Build & Launch Performance",
    shortTitle: "Modularity & Perf",
    icon: "📦",
    color: "#06b6d4",
    summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.",
    docIds: ["modular-architecture", "performance-profiling"],
    questionIds: ["Q-30", "Q-31", "Q-32", "Q-33", "Q-34"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#a855f7",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-35", "Q-36", "Q-37", "Q-38"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#f43f5e",
    summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "leadership-ownership"],
    questionIds: ["Q-39", "Q-40", "Q-41", "Q-42", "Q-43", "Q-44", "Q-45"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#e11d48",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-46", "Q-47"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#38bdf8",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-48", "Q-49", "Q-50", "Q-51", "Q-52", "Q-53", "Q-54", "Q-55"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#d97706",
    summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: [],
    questionIds: ["Q-56"]
  },
  {
    id: "memory-management",
    title: "Memory Management",
    shortTitle: "Memory Mgmt",
    icon: "🧠",
    color: "#14b8a6",
    summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit.",
    docIds: [],
    questionIds: ["Q-57", "Q-58", "Q-59", "Q-60", "Q-61", "Q-62", "Q-63", "Q-64"]
  }
];

// 7. Regenerate QUESTIONS.md
const topicMeta = {
  "Architecture & Design Patterns": { icon: "🏗️", summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles." },
  "Swift Concurrency & Multithreading": { icon: "⚡", summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions." },
  "Core Swift & Language Internals": { icon: "🚀", summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops." },
  "SwiftUI & UIKit Layout": { icon: "🎨", summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, Property Wrappers (@State, @Binding, @Published), and UIKit interoperability." },
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
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout, Memory Management, System Design, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
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
indexHtml = indexHtml.replace(/6[0-9] Questions · 24 Guides/g, `${questions.length} Questions · 24 Guides`);
indexHtml = indexHtml.replace(/6[0-9] Curated Questions/g, `${questions.length} Curated Questions`);
indexHtml = indexHtml.replace(/All \(6[0-9]\)/g, `All (${questions.length})`);
indexHtml = indexHtml.replace(/All Difficulties \(6[0-9]\)/g, `All Difficulties (${questions.length})`);
indexHtml = indexHtml.replace(/Advanced \(2[0-9]\)/g, `Advanced (25)`);

// Update embedded arrays
const scriptOpen = indexHtml.indexOf('<script>');
const scriptClose = indexHtml.lastIndexOf('</script>');
const preScript = indexHtml.substring(0, scriptOpen);
const postScript = indexHtml.substring(scriptClose + 9);
const scriptBody = indexHtml.substring(scriptOpen + 8, scriptClose);

// Replace QUESTIONS, QUESTION_TO_DOCS, TOPIC_CATEGORIES
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
console.log('Successfully updated index.html with new Auto Layout question!');
console.log(`Total lines: ${finalHtml.split('\n').length}, bytes: ${finalHtml.length}`);
