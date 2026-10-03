const fs = require('fs');

const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';

const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
console.log('Total questions in questions.json:', questions.length);

// Ensure IDs are strictly sequential Q-01 to Q-53
questions.forEach((q, idx) => {
  q.id = `Q-${String(idx + 1).padStart(2, '0')}`;
});

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
