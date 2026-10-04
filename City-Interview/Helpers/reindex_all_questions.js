const fs = require('fs');
const path = require('path');

const QUESTIONS_JSON_PATH = path.join(__dirname, '../Resources/questions.json');
const INDEX_HTML_PATH = path.join(__dirname, '../index.html');
const GENERATED_DOCS_PATH = path.join(__dirname, '../Helpers/generated_docs.json');
const QUESTIONS_MD_PATH = path.join(__dirname, '../QUESTIONS.md');

// 1. Load and Reorder questions.json
const questions = JSON.parse(fs.readFileSync(QUESTIONS_JSON_PATH, 'utf-8'));

// Find APNs question
const apnsIdx = questions.findIndex(q => q.question.toLowerCase().includes('apns work end to end'));
if (apnsIdx === -1) {
  console.error("Could not find APNs question!");
  process.exit(1);
}

const apnsQ = questions.splice(apnsIdx, 1)[0];

// Insert after Q-34 (which is at index 33 in the 0-indexed array, so position 34)
questions.splice(34, 0, apnsQ);

// Build idMap: oldId -> newId
const idMap = {};
questions.forEach((q, idx) => {
  const num = idx + 1;
  const newId = 'Q-' + (num < 10 ? '0' + num : num);
  idMap[q.id] = newId;
  q.id = newId;
});

console.log(`Reordered ${questions.length} questions.`);
console.log(`APNs is now: ${questions[34].id} - "${questions[34].question}"`);
console.log(`Build time is now: ${questions[35].id} - "${questions[35].question}"`);
console.log(`AI API key is now: ${questions[77].id} - "${questions[77].question}"`);

fs.writeFileSync(QUESTIONS_JSON_PATH, JSON.stringify(questions, null, 2) + '\n', 'utf-8');
console.log('✓ questions.json successfully updated.');

// 2. Update index.html
let html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

// Update QUESTIONS array
const qMarker = 'const QUESTIONS = ';
const qIdx = html.indexOf(qMarker);
if (qIdx !== -1) {
  const jsonStart = qIdx + qMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  html = html.substring(0, jsonStart) + JSON.stringify(questions) + html.substring(nextSemi);
  console.log('✓ Updated QUESTIONS array in index.html');
}

// Update TOPIC_CATEGORIES
const topicsMarker = 'const TOPIC_CATEGORIES = ';
const topicsIdx = html.indexOf(topicsMarker);
if (topicsIdx !== -1) {
  const jsonStart = topicsIdx + topicsMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  let topics = JSON.parse(html.substring(jsonStart, nextSemi));
  
  topics.forEach(t => {
    t.questionIds = t.questionIds.map(qid => idMap[qid] || qid);
    t.questionIds.sort((a, b) => parseInt(a.replace('Q-', ''), 10) - parseInt(b.replace('Q-', ''), 10));
  });
  
  html = html.substring(0, jsonStart) + JSON.stringify(topics) + html.substring(nextSemi);
  console.log('✓ Updated TOPIC_CATEGORIES in index.html');
}

// Update QUESTION_TO_DOCS
const docsMarker = 'const QUESTION_TO_DOCS = ';
const docsIdx = html.indexOf(docsMarker);
if (docsIdx !== -1) {
  const jsonStart = docsIdx + docsMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  let docs = JSON.parse(html.substring(jsonStart, nextSemi));
  
  const newDocs = {};
  for (const [oldQId, docArray] of Object.entries(docs)) {
    const newQId = idMap[oldQId] || oldQId;
    newDocs[newQId] = docArray;
  }
  
  html = html.substring(0, jsonStart) + JSON.stringify(newDocs) + html.substring(nextSemi);
  console.log('✓ Updated QUESTION_TO_DOCS in index.html');
}

fs.writeFileSync(INDEX_HTML_PATH, html, 'utf-8');
console.log('✓ index.html successfully saved.');

// 3. Update generated_docs.json
if (fs.existsSync(GENERATED_DOCS_PATH)) {
  const genDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));
  if (genDocs.MODULE_DOCS) {
    genDocs.MODULE_DOCS.forEach(doc => {
      if (doc.relatedQuestions) {
        doc.relatedQuestions = doc.relatedQuestions.map(qid => idMap[qid] || qid);
        doc.relatedQuestions.sort((a, b) => parseInt(a.replace('Q-', ''), 10) - parseInt(b.replace('Q-', ''), 10));
      }
    });
    fs.writeFileSync(GENERATED_DOCS_PATH, JSON.stringify(genDocs, null, 2) + '\n', 'utf-8');
    console.log('✓ Helpers/generated_docs.json successfully updated.');
  }
}

// 4. Update QUESTIONS.md
if (fs.existsSync(QUESTIONS_MD_PATH)) {
  // We can re-generate the full QUESTIONS.md from the updated questions and topic categories
  const topicHeaders = [
    { title: "## 📌 Architecture & Design Patterns (Q-01 – Q-05)", ids: ["Q-01","Q-02","Q-03","Q-04","Q-05"] },
    { title: "## ⚡ Swift Concurrency & Multithreading (Q-06 – Q-12)", ids: ["Q-06","Q-07","Q-08","Q-09","Q-10","Q-11","Q-12"] },
    { title: "## 🚀 Core Swift & Language Internals (Q-13 – Q-18)", ids: ["Q-13","Q-14","Q-15","Q-16","Q-17","Q-18"] },
    { title: "## 🎨 SwiftUI & UIKit Layout (Q-19 – Q-28)", ids: ["Q-19","Q-20","Q-21","Q-22","Q-23","Q-24","Q-25","Q-26","Q-27","Q-28"] },
    { title: "## 🌊 Combine & Reactive Streams (Q-29)", ids: ["Q-29"] },
    { title: "## 🌐 Networking, APIs & Background Tasks (Q-30 – Q-35)", ids: ["Q-30","Q-31","Q-32","Q-33","Q-34","Q-35"] },
    { title: "## 📦 Modularity & Launch Performance (Q-36 – Q-42)", ids: ["Q-36","Q-37","Q-38","Q-39","Q-40","Q-41","Q-42"] },
    { title: "## 💾 Data Persistence & Memory Management (Q-43 – Q-46)", ids: ["Q-43","Q-44","Q-45","Q-46"] },
    { title: "## 🔒 Security, Auth & Compliance (Q-47 – Q-55, Q-76 – Q-78)", ids: ["Q-47","Q-48","Q-49","Q-50","Q-51","Q-52","Q-53","Q-54","Q-55","Q-76","Q-77","Q-78"] },
    { title: "## 🏛️ System Design & Mobile Architecture (Q-56 – Q-57)", ids: ["Q-56","Q-57"] },
    { title: "## 🧪 Testing, CI/CD & AI Engineering (Q-58 – Q-65)", ids: ["Q-58","Q-59","Q-60","Q-61","Q-62","Q-63","Q-64","Q-65"] },
    { title: "## 👔 Engineering Leadership & Operations (Q-66 – Q-67)", ids: ["Q-66","Q-67"] },
    { title: "## 🧠 Memory Management (Q-68 – Q-75)", ids: ["Q-68","Q-69","Q-70","Q-71","Q-72","Q-73","Q-74","Q-75"] }
  ];

  let mdContent = `# 📱 iOS Senior & Staff Interview Question Bank

> A comprehensive, senior & staff-level revision suite for 78 iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, UICollectionView Diffable Data Sources & Compositional Layouts, Background Execution & State Restoration, Performance Profiling & Instruments, 60/120fps Scroll Hitch Elimination, Scalable Image Caching, Keychain Secrets Management, OAuth 2.0 PKCE & Token Rotation, Production Crash Log Triage & Symbolication, Memory Management, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.

## 📊 Overview

| Category / Topic | Questions | Key Coverage |
|---|:---:|---|
| **Architecture & Design Patterns** | \`5\` | Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles. |
| **Swift Concurrency & Multithreading** | \`7\` | Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions. |
| **Core Swift & Language Internals** | \`6\` | Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops. |
| **SwiftUI & UIKit Layout** | \`10\` | Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), iPad adaptive layouts, internationalization & RTL, UICollectionView diffable data sources & compositional layouts, atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, and UIKit interoperability. |
| **Combine & Reactive Streams** | \`1\` | Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles. |
| **Networking, APIs & Background Tasks** | \`6\` | URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler. |
| **Modularity & Launch Performance** | \`7\` | SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling. |
| **Data Persistence & Memory Management** | \`4\` | Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival. |
| **Security, Auth & Compliance** | \`12\` | Keychain vs Secure Enclave, token storage CRUD, OAuth 2.0 PKCE & token rotation, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR). |
| **System Design & Mobile Architecture** | \`2\` | End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution. |
| **Testing, CI/CD & AI Engineering** | \`8\` | Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems. |
| **Engineering Leadership & Operations** | \`2\` | Production incident triage, crash log analysis & dSYM symbolication, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern. |
| **Memory Management** | \`8\` | ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit. |
| **Total** | **\`78\`** | Complete Senior & Staff iOS Interview Curriculum |

---
`;

  const questionMap = {};
  questions.forEach(q => { questionMap[q.id] = q; });

  topicHeaders.forEach(section => {
    mdContent += `\n${section.title}\n\n`;
    section.ids.forEach(qid => {
      const q = questionMap[qid];
      if (!q) return;

      mdContent += `### \`${q.id}\` — ${q.question}\n\n`;
      mdContent += `- **Category:** \`${q.category}\`\n\n`;

      if (q.interviewSentence) {
        mdContent += `> [!TIP]\n> **🗣️ Interview Pitch (Say it like this):**  \n> *"${q.interviewSentence}"*\n\n`;
      }

      mdContent += `#### 📖 Detailed Answer\n\n${q.answer}\n\n`;

      if (q.codeExample) {
        mdContent += `#### 💻 Swift Code Example\n\n\`\`\`swift\n${q.codeExample}\n\`\`\`\n\n`;
      }

      mdContent += `---\n\n`;
    });
  });

  fs.writeFileSync(QUESTIONS_MD_PATH, mdContent, 'utf-8');
  console.log('✓ QUESTIONS.md successfully re-indexed and written.');
}
