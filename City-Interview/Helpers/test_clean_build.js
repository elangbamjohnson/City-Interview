const fs = require('fs');

const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';
const GENERATED_DOCS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Helpers/generated_docs.json';
const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';

const fullHtml = fs.readFileSync(INDEX_PATH, 'utf-8');
const lines = fullHtml.split('\n');

// 1. htmlHead: from line 1 to line 1790
const htmlHead = lines.slice(0, 1791).join('\n');

// 2. Data
const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
const generatedDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));

// Topic categories
const TOPIC_CATEGORIES = [
  {"id": "architecture", "title": "Architecture & Design Patterns", "shortTitle": "Architecture", "icon": "🏗️", "color": "#6366f1", "summary": "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles.", "docIds": ["clean-architecture", "coordinator-pattern", "dependency-injection", "mvvm", "repository-pattern", "solid-principles", "viper-pattern"], "questionIds": ["Q-01", "Q-02", "Q-03", "Q-04", "Q-05"]},
  {"id": "concurrency", "title": "Swift Concurrency & Multithreading", "shortTitle": "Swift Concurrency", "icon": "⚡", "color": "#f59e0b", "summary": "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions.", "docIds": ["multithreading-gcd", "concurrency-issues", "thread-safety", "operation-queue"], "questionIds": ["Q-06", "Q-07", "Q-08", "Q-09", "Q-10", "Q-11"]},
  {"id": "core-advance-swift", "title": "Core Swift & Language Internals", "shortTitle": "Core & Advance Swift", "icon": "🚀", "color": "#ec4899", "summary": "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops.", "docIds": ["ios-internals", "swiftui-state"], "questionIds": ["Q-12", "Q-13", "Q-14", "Q-15", "Q-16", "Q-17"]},
  {"id": "swift-basics-ui", "title": "SwiftUI & UIKit Layout", "shortTitle": "UI & Layout", "icon": "🎨", "color": "#8b5cf6", "summary": "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, and UIKit interoperability.", "docIds": ["autolayout-basics", "composable-ui", "design-system", "swiftui-uikit-interop", "swiftui-state"], "questionIds": ["Q-18", "Q-19", "Q-20", "Q-21", "Q-22"]},
  {"id": "combine-reactive", "title": "Combine & Reactive Streams", "shortTitle": "Combine & Streams", "icon": "🌊", "color": "#0ea5e9", "summary": "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles.", "docIds": [], "questionIds": ["Q-23"]},
  {"id": "networking", "title": "Networking, APIs & Background Tasks", "shortTitle": "Networking & APIs", "icon": "🌐", "color": "#10b981", "summary": "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler.", "docIds": ["networking-architecture"], "questionIds": ["Q-24", "Q-25", "Q-26"]},
  {"id": "modularity-performance", "title": "Modularity, Build & Launch Performance", "shortTitle": "Modularity & Perf", "icon": "📦", "color": "#06b6d4", "summary": "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.", "docIds": ["modular-architecture", "performance-profiling"], "questionIds": ["Q-27", "Q-28", "Q-29", "Q-30", "Q-31"]},
  {"id": "data-memory", "title": "Data Persistence, SwiftData & Memory Deep Dive", "shortTitle": "Data & Memory", "icon": "💾", "color": "#a855f7", "summary": "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.", "docIds": ["data-persistence"], "questionIds": ["Q-32", "Q-33", "Q-34", "Q-35"]},
  {"id": "security-compliance", "title": "Security, App Hardening & Compliance", "shortTitle": "Security & Compliance", "icon": "🔒", "color": "#f43f5e", "summary": "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).", "docIds": ["security-comparison", "leadership-ownership"], "questionIds": ["Q-36", "Q-37", "Q-38", "Q-39", "Q-40", "Q-41", "Q-42"]},
  {"id": "system-design", "title": "System Design & Mobile Architecture", "shortTitle": "System Design", "icon": "🏛️", "color": "#e11d48", "summary": "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.", "docIds": [], "questionIds": ["Q-43", "Q-44"]},
  {"id": "testing-ci-cd", "title": "Testing, CI/CD & AI Engineering", "shortTitle": "Testing & AI", "icon": "🧪", "color": "#38bdf8", "summary": "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.", "docIds": ["testing-xctest"], "questionIds": ["Q-45", "Q-46", "Q-47", "Q-48", "Q-49", "Q-50", "Q-51", "Q-52"]},
  {"id": "leadership-production", "title": "Engineering Leadership & Operations", "shortTitle": "Leadership & Ops", "icon": "👔", "color": "#d97706", "summary": "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.", "docIds": [], "questionIds": ["Q-53"]}
];

const embeddedDataCode = `    const QUESTIONS = ${JSON.stringify(questions)};
    const MODULE_DOCS = ${JSON.stringify(generatedDocs.MODULE_DOCS)};
    const QUESTION_TO_DOCS = ${JSON.stringify(generatedDocs.QUESTION_TO_DOCS)};
    const TOPIC_CATEGORIES = ${JSON.stringify(TOPIC_CATEGORIES)};
`;

// 3. tailCode from line 3592
const tailLines = lines.slice(3592);
let tailCode = tailLines.join('\n');

// Ensure handleCardClick is active on question-card
tailCode = tailCode.replace(
  '<div class="question-card ${isReviewed ? \'reviewed\' : \'\'}" id="card-${q.id}">',
  '<div class="question-card ${isReviewed ? \'reviewed\' : \'\'}" id="card-${q.id}" onclick="handleCardClick(event, \'${q.id}\')">'
);

// Assemble clean file
const cleanFile = htmlHead + '\n' + embeddedDataCode + tailCode;

// Test syntax of all script tags
const scriptMatches = cleanFile.matchAll(/<script>([\s\S]*?)<\/script>/g);
let scriptIdx = 0;
for (const match of scriptMatches) {
  scriptIdx++;
  new Function(match[1]);
  console.log(`Script ${scriptIdx} has 100% valid JavaScript syntax!`);
}

// Write clean file
fs.writeFileSync(INDEX_PATH, cleanFile, 'utf-8');
console.log('Successfully wrote clean index.html with line count:', cleanFile.split('\n').length);
