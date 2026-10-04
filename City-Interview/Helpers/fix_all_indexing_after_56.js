const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '../Resources/questions.json');
const indexPath = path.join(__dirname, '../index.html');
const mdPath = path.join(__dirname, '../QUESTIONS.md');
const genDocsPath = path.join(__dirname, '../Helpers/generated_docs.json');

// Define the exact mapping from old ID to new ID
const idMapping = {
    // 3 security questions that were at the end
    "Q-79": "Q-57", // ATS
    "Q-80": "Q-58", // Data at rest
    "Q-81": "Q-59", // AI API key
    // System Design questions
    "Q-57": "Q-60", // Image caching
    "Q-58": "Q-61", // Offline sync
    "Q-59": "Q-62", // Payment process
    // Testing & AI
    "Q-60": "Q-63", // AIAnalyzer
    "Q-61": "Q-64", // Gemini vs Ollama
    "Q-62": "Q-65", // Validate AI code
    "Q-63": "Q-66", // Tool changed Copilot
    "Q-64": "Q-67", // TDD vs BDD
    "Q-65": "Q-68", // XCTest
    "Q-66": "Q-69", // Write code easy to test
    "Q-67": "Q-70", // CI/CD
    "Q-68": "Q-71", // Feature flagging
    // Leadership
    "Q-69": "Q-72", // Incident triage
    "Q-70": "Q-73", // Crash log
    // Memory
    "Q-71": "Q-74", // ARC
    "Q-72": "Q-75", // Retain cycle
    "Q-73": "Q-76", // Stack vs heap
    "Q-74": "Q-77", // Copy-on-Write
    "Q-75": "Q-78", // Memory warnings
    "Q-76": "Q-79", // Side table
    "Q-77": "Q-80", // Jetsam
    "Q-78": "Q-81"  // Memory profiling
};

console.log('Mapping count:', Object.keys(idMapping).length);

// =========================================================================
// 1. UPDATE questions.json
// =========================================================================
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

// Find the 3 security questions that are currently at indices 78, 79, 80
const atsIdx = questions.findIndex(q => q.question.includes("App Transport Security"));
const dataRestIdx = questions.findIndex(q => q.question.includes("protect data at rest"));
const aiKeyIdx = questions.findIndex(q => q.question.includes("store an AI API key"));

console.log('Indices in questions.json:', { atsIdx, dataRestIdx, aiKeyIdx });

// Extract them
const [atsQ] = questions.splice(atsIdx, 1);
const [dataRestQ] = questions.splice(dataRestIdx > atsIdx ? dataRestIdx - 1 : dataRestIdx, 1);
const [aiKeyQ] = questions.splice(aiKeyIdx > dataRestIdx ? (aiKeyIdx > atsIdx ? aiKeyIdx - 2 : aiKeyIdx - 1) : aiKeyIdx, 1);

// Insert them right after index 55 (after Q-56)
questions.splice(56, 0, atsQ, dataRestQ, aiKeyQ);

// Now reassign IDs sequentially for all 81 questions
questions.forEach((q, idx) => {
    q.id = "Q-" + String(idx + 1).padStart(2, '0');
});

console.log('Reordered questions count:', questions.length);
console.log('Index 55 (Q-56):', questions[55].id, questions[55].question);
console.log('Index 56 (Q-57):', questions[56].id, questions[56].question);
console.log('Index 57 (Q-58):', questions[57].id, questions[57].question);
console.log('Index 58 (Q-59):', questions[58].id, questions[58].question);
console.log('Index 59 (Q-60):', questions[59].id, questions[59].question);
console.log('Index 60 (Q-61):', questions[60].id, questions[61].question);
console.log('Index 61 (Q-62):', questions[61].id, questions[61].question);
console.log('Index 62 (Q-63):', questions[62].id, questions[62].question);
console.log('Index 80 (Q-81):', questions[80].id, questions[80].question);

fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
console.log('✓ questions.json successfully reordered and re-indexed!');

// =========================================================================
// 2. UPDATE index.html
// =========================================================================
let html = fs.readFileSync(indexPath, 'utf8');

// Replace const QUESTIONS
const startQ = html.indexOf('const QUESTIONS = [');
const endQ = html.indexOf(';\n    const MODULE_DOCS =', startQ);
const newQuestionsCode = 'const QUESTIONS = ' + JSON.stringify(questions);
html = html.substring(0, startQ) + newQuestionsCode + html.substring(endQ);

// Update TOPIC_CATEGORIES
const startCat = html.indexOf('const TOPIC_CATEGORIES = [');
const endCat = html.indexOf('];\n', startCat);
const topicCategories = JSON.parse(html.substring(startCat + 'const TOPIC_CATEGORIES = '.length, endCat + 1));

for (const cat of topicCategories) {
    if (cat.id === 'security-compliance') {
        cat.questionIds = ['Q-48', 'Q-49', 'Q-50', 'Q-51', 'Q-52', 'Q-53', 'Q-54', 'Q-55', 'Q-56', 'Q-57', 'Q-58', 'Q-59'];
    } else if (cat.id === 'system-design') {
        cat.questionIds = ['Q-60', 'Q-61', 'Q-62'];
    } else if (cat.id === 'testing-ci-cd') {
        cat.questionIds = ['Q-63', 'Q-64', 'Q-65', 'Q-66', 'Q-67', 'Q-68', 'Q-69', 'Q-70', 'Q-71'];
    } else if (cat.id === 'leadership-production') {
        cat.questionIds = ['Q-72', 'Q-73'];
    } else if (cat.id === 'memory-management') {
        cat.questionIds = ['Q-74', 'Q-75', 'Q-76', 'Q-77', 'Q-78', 'Q-79', 'Q-80', 'Q-81'];
    }
}
const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(topicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
const newQ2D = {};

for (const [key, val] of Object.entries(oldQ2D)) {
    const newKey = idMapping[key] || key;
    newQ2D[newKey] = val;
}

const newQ2DCode = 'const QUESTION_TO_DOCS = ' + JSON.stringify(newQ2D) + ';';
html = html.substring(0, startQ2D) + newQ2DCode + html.substring(endQ2D + 2);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html successfully updated!');

// Sync generated_docs.json
const genDocs = JSON.parse(fs.readFileSync(genDocsPath, 'utf8'));
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json successfully updated!');

// =========================================================================
// 3. UPDATE QUESTIONS.md
// =========================================================================
let md = fs.readFileSync(mdPath, 'utf8');

// Update section headers
md = md.replace(
  '## 🔒 Security, Auth & Compliance (Q-48 – Q-56, Q-79 – Q-81)',
  '## 🔒 Security, Auth & Compliance (Q-48 – Q-59)'
);
md = md.replace(
  '## 🏛️ System Design & Mobile Architecture (Q-57 – Q-59)',
  '## 🏛️ System Design & Mobile Architecture (Q-60 – Q-62)'
);
md = md.replace(
  '## 🧪 Testing, CI/CD & AI Engineering (Q-60 – Q-68)',
  '## 🧪 Testing, CI/CD & AI Engineering (Q-63 – Q-71)'
);
md = md.replace(
  '## 👔 Engineering Leadership & Operations (Q-69 – Q-70)',
  '## 👔 Engineering Leadership & Operations (Q-72 – Q-73)'
);
md = md.replace(
  '## 🧠 Memory Management (Q-71 – Q-78)',
  '## 🧠 Memory Management (Q-74 – Q-81)'
);

// In QUESTIONS.md, the questions appear in physical order from top to bottom.
// We can replace each header based on its unique question title:
const titlesToNewId = [
    { title: "What is App Transport Security?", newId: "Q-57" },
    { title: "How do you protect data at rest?", newId: "Q-58" },
    { title: "Where do you store an AI API key for an iOS app?", newId: "Q-59" },
    { title: "How do you load and cache images at scale?", newId: "Q-60" },
    { title: "System Design — Offline-First Feed & Bi-directional Synchronization", newId: "Q-61" },
    { title: "How does a payment process work in an e-commerce app like Amazon?", newId: "Q-62" },
    { title: "Rehearse the AIAnalyzer walkthrough out loud — cloud/local/hybrid modes, confidence-based fallback", newId: "Q-63" },
    { title: "Why did you choose Gemini for cloud and Ollama/Qwen for local?", newId: "Q-64" },
    { title: "How do you validate AI-generated code before merging?", newId: "Q-65" },
    { title: "How building your own AI tool changed how you use Copilot/Cursor day to day", newId: "Q-66" },
    { title: "TDD vs BDD — the actual difference", newId: "Q-67" },
    { title: "XCTest — writing unit tests and UI tests, mocking and stubbing", newId: "Q-68" },
    { title: "How do you write code that is easy to test?", newId: "Q-69" },
    { title: "CI/CD pipelines for iOS — what goes into one", newId: "Q-70" },
    { title: "Feature flagging, A/B testing, and remote configuration", newId: "Q-71" },
    { title: "Engineering Leadership — Production Incident Triage & Strangler Fig Migration", newId: "Q-72" },
    { title: "How do you read a crash log? How do you symbolicate it?", newId: "Q-73" },
    { title: "How does ARC work? What is the difference between strong, weak, and unowned?", newId: "Q-74" },
    { title: "What is a retain cycle? How do you detect and fix them?", newId: "Q-75" },
    { title: "What is the difference between stack and heap memory? How does Swift decide where to allocate?", newId: "Q-76" },
    { title: "Explain Copy-on-Write (CoW). How does Swift implement it, and how do you implement it in a custom type?", newId: "Q-77" },
    { title: "How do you handle memory warnings?", newId: "Q-78" },
    { title: "What is the Swift runtime side table? How do weak references work under the hood?", newId: "Q-79" },
    { title: "How does Jetsam work? What strategies do you use to survive memory pressure?", newId: "Q-80" },
    { title: "How do you profile and debug memory issues in a production iOS app?", newId: "Q-81" }
];

for (const item of titlesToNewId) {
    // Regex matches: ### `Q-XX` — [escaped title]
    const escapedTitle = item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`### \`Q-\\d+\` — ${escapedTitle}`, 'g');
    md = md.replace(regex, `### \`${item.newId}\` — ${item.title}`);
}

fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md successfully updated!');
