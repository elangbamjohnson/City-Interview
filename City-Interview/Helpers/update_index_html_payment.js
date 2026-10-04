const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '../Resources/questions.json');
const indexPath = path.join(__dirname, '../index.html');
const genDocsPath = path.join(__dirname, '../Helpers/generated_docs.json');

const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
let html = fs.readFileSync(indexPath, 'utf8');
const genDocs = JSON.parse(fs.readFileSync(genDocsPath, 'utf8'));

console.log('Target questions count:', questions.length);

// 1. Replace const QUESTIONS = [...]; in index.html
const startQ = html.indexOf('const QUESTIONS = [');
if (startQ === -1) {
    console.error('Could not find const QUESTIONS in index.html');
    process.exit(1);
}
const endQ = html.indexOf(';\n    const MODULE_DOCS =', startQ);
if (endQ === -1) {
    console.error('Could not find end of const QUESTIONS in index.html');
    process.exit(1);
}

const newQuestionsCode = 'const QUESTIONS = ' + JSON.stringify(questions);
html = html.substring(0, startQ) + newQuestionsCode + html.substring(endQ);
console.log('Replaced const QUESTIONS in index.html');

// 2. Update TOPIC_CATEGORIES
const startCat = html.indexOf('const TOPIC_CATEGORIES = [');
const endCat = html.indexOf('];\n', startCat);
if (startCat === -1 || endCat === -1) {
    console.error('Could not find TOPIC_CATEGORIES in index.html');
    process.exit(1);
}

const topicCategories = JSON.parse(html.substring(startCat + 'const TOPIC_CATEGORIES = '.length, endCat + 1));

// Update categories:
for (const cat of topicCategories) {
    if (cat.id === 'system-design') {
        cat.questionIds = ['Q-57', 'Q-58', 'Q-59'];
        cat.summary = "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, Offline-First bi-directional syncing with outbox pattern, and E-commerce checkout & payment flow (Apple Pay, idempotency, gateway authorization & settlement).";
        cat.docIds = ["security-comparison", "networking-architecture"];
    } else if (cat.id === 'testing-ci-cd') {
        cat.questionIds = ['Q-60', 'Q-61', 'Q-62', 'Q-63', 'Q-64', 'Q-65', 'Q-66', 'Q-67'];
    } else if (cat.id === 'leadership-production') {
        cat.questionIds = ['Q-68', 'Q-69'];
    } else if (cat.id === 'memory-management') {
        cat.questionIds = ['Q-70', 'Q-71', 'Q-72', 'Q-73', 'Q-74', 'Q-75', 'Q-76', 'Q-77'];
    } else if (cat.id === 'security-compliance') {
        cat.questionIds = ['Q-48', 'Q-49', 'Q-50', 'Q-51', 'Q-52', 'Q-53', 'Q-54', 'Q-55', 'Q-56', 'Q-78', 'Q-79', 'Q-80'];
    }
}

const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(topicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);
console.log('Updated TOPIC_CATEGORIES in index.html');

// 3. Update QUESTION_TO_DOCS in index.html & generated_docs.json
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
if (startQ2D === -1 || endQ2D === -1) {
    console.error('Could not find QUESTION_TO_DOCS in index.html');
    process.exit(1);
}

const rawQ2D = html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1);
const oldQ2D = JSON.parse(rawQ2D);
const newQ2D = {};

for (const [key, val] of Object.entries(oldQ2D)) {
    const num = parseInt(key.replace('Q-', ''), 10);
    if (num >= 59) {
        const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
        newQ2D[shiftedKey] = val;
    } else {
        newQ2D[key] = val;
    }
}

// Add mapping for Q-59
newQ2D['Q-59'] = [
    {
        docId: "security-comparison",
        title: "Security Decision Table (Keychain, Enclave, Pinning)",
        filename: "Security-ComparisonNotes.md",
        icon: "🛡️"
    },
    {
        docId: "networking-architecture",
        title: "Networking Architecture Decision Table & 4 Pillars",
        filename: "Networking-ComparisonNotes.md",
        icon: "🌐"
    }
];

const newQ2DCode = 'const QUESTION_TO_DOCS = ' + JSON.stringify(newQ2D) + ';';
html = html.substring(0, startQ2D) + newQ2DCode + html.substring(endQ2D + 2);
console.log('Updated QUESTION_TO_DOCS in index.html');

// 4. Update text counters
html = html.replace(/79 Questions/g, '80 Questions');
html = html.replace(/79 questions/g, '80 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully updated index.html!');

// Also sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('Successfully updated generated_docs.json!');
