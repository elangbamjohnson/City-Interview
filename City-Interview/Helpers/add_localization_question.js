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

// 2. Define the new Localization question
const newQuestion = {
  id: "Q-24",
  category: "SwiftUI & UIKit Layout",
  difficulty: "Advanced",
  question: "How do you handle localization?",
  interviewSentence: "I keep user-facing text out of the code using String Catalogs (.xcstrings), let Foundation format dates, numbers, and plurals, and strictly use leading/trailing constraints so the entire UI flips automatically in Right-to-Left languages.",
  answer: `Localization means making my app work in many languages and regions, without changing the code. The idea is simple: I never write text directly in the code. I put all the text in a separate file, one file per language, and the app picks the right one based on the phone's language.

In Xcode, I use a String Catalog. It is one file called Localizable.xcstrings, and I add languages to it. For each text, I give a key, and for each language, I write the translation. In SwiftUI, a Text("welcome") looks up the key automatically. In UIKit, I use String(localized: "welcome").

Three more things I always handle:
1. Plurals: like "1 item" and "2 items". I let the String Catalog handle it, because some languages (like Arabic, Russian, Polish) have more than two plural forms (zero, one, two, few, many, other). Never construct plurals with string interpolation or if-statements.
2. Dates, numbers, and currency: I never format them by hand. I use Date.formatted(), NumberFormatter, or Foundation FormatStyle (e.g. .currency(code: "USD")), so they follow the user's active region and locale conventions.
3. Right-to-Left (RTL) languages like Arabic and Hebrew: The whole screen must flip: text starts from the right, and the back button, icons, navigation chevrons, and layout move to the mirror side.

For RTL, the key rule is: don't use left and right. Use leading and trailing. Leading means the start side, which is left in English and right in Arabic. If I use leading and trailing in Auto Layout and SwiftUI, the system flips everything for me. For images that must flip, like a back arrow, I enable the 'Directional' option in the asset catalog. I test by running the app with the Arabic language, or with the pseudolanguage 'Right-to-Left Pseudolanguage' in the Xcode scheme.

Easy steps to remember:
• No hardcoded text: All user-facing strings go into a String Catalog (.xcstrings).
• One file, many languages: Add each language, translate each key with compile-time verification.
• Plurals, dates, numbers: Let the system format them via FormatStyle and locale rules.
• RTL: Use leading and trailing, never left and right. Use .natural text alignment.
• Test: Run with Arabic locale and the RTL Pseudolanguage in Xcode scheme settings.

Good to mention:
• Text expansion: German and Finnish text can be 30-40% longer than English. Never hardcode fixed button or label widths; enable multi-line wrapping (numberOfLines = 0).
• Digits: Arabic can display Eastern Arabic-Indic digits (١, ٢, ٣) or Western digits depending on the user's region setting. Use system number formatters and never hardcode digit substitution.
• Directional Assets: Symmetrical icons (like a settings gear or camera) should not flip; asymmetric navigational icons (like forward/backward arrows) must have 'Directional' enabled in Assets.xcassets.
• Embedded text in images: Never ship bitmap images containing baked-in text, as they cannot be localized without asset duplication.

One-liner: Keep text out of the code in a String Catalog, let the system format dates and plurals, and use leading and trailing so Arabic flips automatically.`,
  codeExample: `// =========================================================================
// QUICK REFERENCE: The 8 Core Rules of Modern iOS Localization
// =========================================================================

// 1. Localizable.xcstrings (String Catalog)
//    key: "welcome"      en: "Welcome"          ar: "مرحباً"
//    key: "items_count"  plural: en: "%lld item(s)"  ar: has its own plural forms

// 2. SwiftUI: key is looked up automatically
Text("welcome")                        // shows "مرحباً" when the phone is in Arabic

// 3. UIKit
label.text = String(localized: "welcome")

// 4. Auto Layout: use leading / trailing, NOT left / right
label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16)   // flips in Arabic
label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16)

// 5. Text alignment: .natural follows the language direction
label.textAlignment = .natural         // left in English, right in Arabic

// 6. Check if the current language is RTL
if UIView.userInterfaceLayoutDirection(for: view.semanticContentAttribute) == .rightToLeft {
    // special handling if needed
}

// 7. Dates and numbers follow the user's region automatically
Text(Date.now, format: .dateTime.day().month().year())
Text(price, format: .currency(code: "SAR"))

// 8. Test Arabic in a SwiftUI preview
ContentView()
    .environment(\\.locale, Locale(identifier: "ar"))
    .environment(\\.layoutDirection, .rightToLeft)

// =========================================================================
// SENIOR PRODUCTION ARCHITECTURE: Enterprise Internationalization & RTL Mirroring
// =========================================================================
import UIKit
import SwiftUI

final class LocalizedAccountCardView: UIView {
    private let titleLabel = UILabel()
    private let transactionCountLabel = UILabel()
    private let balanceLabel = UILabel()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupViews()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupViews() {
        // MARK: 1. String Catalogs (Xcode 15+)
        // String Catalogs replace legacy .strings and .stringsdict with a single typed .xcstrings file.
        // In UIKit, use String(localized:) which extracts compile-time keys automatically into the catalog.
        titleLabel.text = String(localized: "account_overview_title", defaultValue: "Account Overview")
        
        // MARK: 2. Automatic Pluralization Handling
        // Languages like Arabic have 6 plural categories (zero, one, two, few, many, other).
        // Never interpolate numbers manually into strings! Use String Catalog plural rules.
        let txCount = 5
        transactionCountLabel.text = String(localized: "transaction_count_\\(txCount)", defaultValue: "\\(txCount) transactions completed")

        // MARK: 3. Foundation FormatStyle: Currency & Locale-Aware Numbers
        // In financial banking apps, formatting must respect user locale (e.g., decimal comma vs period).
        let currentBalance = 14500.50
        balanceLabel.text = currentBalance.formatted(.currency(code: "USD").locale(.current))

        // MARK: 4. Right-to-Left (RTL) Layout: Leading & Trailing vs Left & Right
        // CRITICAL INTERVIEW RULE: Never use leftAnchor or rightAnchor for geometric layouts!
        // Always use leadingAnchor and trailingAnchor. In RTL locales (Arabic, Hebrew),
        // UIKit automatically inverts leading/trailing so the layout mirrors seamlessly.
        [titleLabel, transactionCountLabel, balanceLabel].forEach {
            $0.translatesAutoresizingMaskIntoConstraints = false
            addSubview($0)
        }

        // Text alignment: .natural respects the text language's reading direction automatically
        titleLabel.textAlignment = .natural
        transactionCountLabel.textAlignment = .natural
        balanceLabel.textAlignment = .natural

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: topAnchor, constant: 16),
            titleLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16), // Left in LTR, Right in RTL

            transactionCountLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            transactionCountLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),

            balanceLabel.topAnchor.constraint(equalTo: transactionCountLabel.bottomAnchor, constant: 8),
            balanceLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            balanceLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16)
        ])
    }

    // MARK: 5. Programmatic Semantic Mirroring Check
    func isCurrentLayoutDirectionRTL() -> Bool {
        // Inspect semanticContentAttribute for custom layout engine overrides if necessary
        return UIView.userInterfaceLayoutDirection(for: semanticContentAttribute) == .rightToLeft
    }
}

// MARK: - SwiftUI Modern Localization, RTL Previews & FormatStyles
struct AccountSummaryRow: View {
    let itemCount: Int
    let amount: Decimal
    let lastUpdated: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // SwiftUI Text automatically treats string literals as LocalizedStringKey!
            Text("welcome_greeting") // Automatically resolves key in Localizable.xcstrings
                .font(.headline)

            // Pluralization via inflected String Catalog key
            Text("^[\\(itemCount) item](inflect: true)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            // Locale-aware Date and Currency formatting via FormatStyle
            HStack {
                Text(amount, format: .currency(code: "SAR")) // Saudi Riyal formatting
                Spacer()
                Text(lastUpdated, format: .dateTime.day().month().year())
            }
            .font(.caption)
        }
        .padding()
    }
}

// MARK: 6. Xcode RTL Testing: SwiftUI Previews with Arabic Locale Override
#Preview("Arabic (RTL) Preview") {
    AccountSummaryRow(itemCount: 2, amount: 2500.0, lastUpdated: .now)
        .environment(\\.locale, Locale(identifier: "ar"))
        .environment(\\.layoutDirection, .rightToLeft) // Simulates full bidirectional mirror
}`
};

// 3. Insert question right after Q-23 ("How do you handle iPad, split view, and adaptive layouts?")
const insertIndex = questions.findIndex(q => q.id === 'Q-23') + 1;
console.log('Inserting at index:', insertIndex);
questions.splice(insertIndex, 0, newQuestion);

// Re-index all questions sequentially Q-01 to Q-66
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
const l10nDocs = [
  {
    docId: "autolayout-basics",
    title: "Auto Layout Basics — Talking Points",
    icon: "📐",
    filename: "AutoLayoutBasics-TalkingPoints.md"
  },
  {
    docId: "design-system",
    title: "Design System Architecture — Talking Points",
    icon: "🎨",
    filename: "DesignSystem-TalkingPoints.md"
  }
];

questions.forEach(q => {
  if (q.question.includes('localization')) {
    updatedQToDocs[q.id] = l10nDocs;
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
    summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), iPad adaptive layouts, internationalization & RTL, atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, and UIKit interoperability.",
    docIds: ["autolayout-basics", "composable-ui", "design-system", "swiftui-uikit-interop", "swiftui-state"],
    questionIds: ["Q-19", "Q-20", "Q-21", "Q-22", "Q-23", "Q-24", "Q-25", "Q-26", "Q-27"]
  },
  {
    id: "combine-reactive",
    title: "Combine & Reactive Streams",
    shortTitle: "Combine & Streams",
    icon: "🌊",
    color: "#0ea5e9",
    summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles.",
    docIds: [],
    questionIds: ["Q-28"]
  },
  {
    id: "networking",
    title: "Networking, APIs & Background Tasks",
    shortTitle: "Networking & APIs",
    icon: "🌐",
    color: "#10b981",
    summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler.",
    docIds: ["networking-architecture"],
    questionIds: ["Q-29", "Q-30", "Q-31"]
  },
  {
    id: "modularity-performance",
    title: "Modularity, Build & Launch Performance",
    shortTitle: "Modularity & Perf",
    icon: "📦",
    color: "#06b6d4",
    summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.",
    docIds: ["modular-architecture", "performance-profiling"],
    questionIds: ["Q-32", "Q-33", "Q-34", "Q-35", "Q-36"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#a855f7",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-37", "Q-38", "Q-39", "Q-40"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#f43f5e",
    summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "leadership-ownership"],
    questionIds: ["Q-41", "Q-42", "Q-43", "Q-44", "Q-45", "Q-46", "Q-47"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#e11d48",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-48", "Q-49"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#38bdf8",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-50", "Q-51", "Q-52", "Q-53", "Q-54", "Q-55", "Q-56", "Q-57"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#d97706",
    summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: [],
    questionIds: ["Q-58"]
  },
  {
    id: "memory-management",
    title: "Memory Management",
    shortTitle: "Memory Mgmt",
    icon: "🧠",
    color: "#14b8a6",
    summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit.",
    docIds: [],
    questionIds: ["Q-59", "Q-60", "Q-61", "Q-62", "Q-63", "Q-64", "Q-65", "Q-66"]
  }
];

// 7. Regenerate QUESTIONS.md
const topicMeta = {
  "Architecture & Design Patterns": { icon: "🏗️", summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles." },
  "Swift Concurrency & Multithreading": { icon: "⚡", summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions." },
  "Core Swift & Language Internals": { icon: "🚀", summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops." },
  "SwiftUI & UIKit Layout": { icon: "🎨", summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), iPad adaptive layouts, internationalization & RTL, atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, Property Wrappers (@State, @Binding, @Published), and UIKit interoperability." },
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
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, Memory Management, System Design, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
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
indexHtml = indexHtml.replace(/Advanced \(\d+\)/g, `Advanced (27)`);

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
