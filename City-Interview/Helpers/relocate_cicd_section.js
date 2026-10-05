const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '../Resources/questions.json');
const indexPath = path.join(__dirname, '../index.html');
const mdPath = path.join(__dirname, '../QUESTIONS.md');
const genDocsPath = path.join(__dirname, '../Helpers/generated_docs.json');

const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
let html = fs.readFileSync(indexPath, 'utf8');
let md = fs.readFileSync(mdPath, 'utf8');
const genDocs = JSON.parse(fs.readFileSync(genDocsPath, 'utf8'));

console.log('Current questions count:', questions.length);

// 1. Update questions.json
// Existing Q-72 is CI/CD, Q-73 is Feature Flagging
const cicdObj = questions.find(q => q.id === "Q-72");
const ffObj = questions.find(q => q.id === "Q-73");

if (!cicdObj || !ffObj) {
    console.error("Could not find Q-72 or Q-73 in questions.json");
    process.exit(1);
}

// Update category for Q-63..Q-71
for (let i = 62; i <= 70; i++) {
    questions[i].category = "Testing & AI Engineering";
}

// Re-order and re-assign IDs:
// Feature Flagging becomes Q-72 in "Testing & AI Engineering"
ffObj.id = "Q-72";
ffObj.category = "Testing & AI Engineering";

// CI/CD becomes Q-73 in "CI/CD & DevOps"
cicdObj.id = "Q-73";
cicdObj.category = "CI/CD & DevOps";

// In the array: index 71 is Q-72 (ffObj), index 72 is Q-73 (cicdObj)
questions[71] = ffObj;
questions[72] = cicdObj;

console.log('Index 71 is now:', questions[71].id, '-', questions[71].question);
console.log('Index 72 is now:', questions[72].id, '-', questions[72].question);

fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
console.log('✓ questions.json updated successfully!');

// 2. Update index.html
// Replace const QUESTIONS
const startQ = html.indexOf('const QUESTIONS = [');
const endQ = html.indexOf(';\n    const MODULE_DOCS =', startQ);
const newQuestionsCode = 'const QUESTIONS = ' + JSON.stringify(questions);
html = html.substring(0, startQ) + newQuestionsCode + html.substring(endQ);

// Update TOPIC_CATEGORIES
const startCat = html.indexOf('const TOPIC_CATEGORIES = [');
const endCat = html.indexOf('];\n', startCat);
const topicCategories = JSON.parse(html.substring(startCat + 'const TOPIC_CATEGORIES = '.length, endCat + 1));

const newCategories = [];
for (const cat of topicCategories) {
    if (cat.id === 'testing-ci-cd') {
        newCategories.push({
            id: "testing-ai",
            title: "Testing & AI Engineering",
            shortTitle: "Testing & AI",
            icon: "🧪",
            color: "#4A7C94",
            summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, test doubles (mocks/stubs/fakes), feature flagging, and hybrid cloud/on-device AI systems.",
            docIds: [
                "testing-xctest",
                "performance-profiling",
                "dependency-injection"
            ],
            questionIds: [
                "Q-63",
                "Q-64",
                "Q-65",
                "Q-66",
                "Q-67",
                "Q-68",
                "Q-69",
                "Q-70",
                "Q-71",
                "Q-72"
            ]
        });
        newCategories.push({
            id: "cicd-devops",
            title: "CI/CD & DevOps",
            shortTitle: "CI/CD & DevOps",
            icon: "🚀",
            color: "#2563EB",
            summary: "Automated continuous integration and delivery using GitHub Actions and Fastlane: pull request quality gates, macOS runner optimization, ephemeral keychain code signing via Fastlane match, and headless TestFlight deployment via App Store Connect API keys.",
            docIds: [
                "testing-xctest"
            ],
            questionIds: [
                "Q-73"
            ]
        });
    } else {
        newCategories.push(cat);
    }
}

const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(newCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS: move Q-72 doc mapping to Q-73
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));

oldQ2D['Q-73'] = [
    {
        docId: "testing-xctest",
        title: "XCTest, Mocking & UI Testing Guide",
        filename: "Testing-TalkingPoints.md",
        icon: "🧪"
    }
];
delete oldQ2D['Q-72'];

const newQ2DCode = 'const QUESTION_TO_DOCS = ' + JSON.stringify(oldQ2D) + ';';
html = html.substring(0, startQ2D) + newQ2DCode + html.substring(endQ2D + 2);

// Update focus bar button title
html = html.replace('title="Show all 13 sections in main view"', 'title="Show all 14 sections in main view"');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = oldQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 3. Update QUESTIONS.md
// Overview table
md = md.replace(
  '| **Testing, CI/CD & AI Engineering** | `11` | Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems. |',
  `| **Testing & AI Engineering** | \`10\` | Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, test doubles (mocks/stubs/fakes), feature flagging, and hybrid cloud/on-device AI systems. |\n| **CI/CD & DevOps** | \`1\` | Automated continuous integration and delivery with GitHub Actions: PR quality gates, macOS runner optimization, Fastlane match code signing, and headless TestFlight deployment via App Store Connect API keys. |`
);

// Update Section header
md = md.replace(
  '## 🧪 Testing, CI/CD & AI Engineering (Q-63 – Q-73)',
  '## 🧪 Testing & AI Engineering (Q-63 – Q-72)'
);

// Update category for Q-63..Q-71
// (We will extract Q-72 and Q-73 blocks first so replacements don't collide)
const q72Start = md.indexOf('### `Q-72` —');
const q73Start = md.indexOf('### `Q-73` —');
const q74Start = md.indexOf('### `Q-74` —');

if (q72Start === -1 || q73Start === -1 || q74Start === -1) {
    console.error('Could not find Q-72, Q-73, or Q-74 markers in QUESTIONS.md');
    process.exit(1);
}

// Slice out CI/CD block and Feature Flagging block
let cicdMdBlock = md.substring(q72Start, q73Start).trim();
let ffMdBlock = md.substring(q73Start, q74Start).trim();

// Clean up trailing hr or whitespace
if (cicdMdBlock.endsWith('---')) {
    cicdMdBlock = cicdMdBlock.substring(0, cicdMdBlock.length - 3).trim();
}
if (ffMdBlock.endsWith('---')) {
    ffMdBlock = ffMdBlock.substring(0, ffMdBlock.length - 3).trim();
}

// Update Feature Flagging to Q-72 and category "Testing & AI Engineering"
ffMdBlock = ffMdBlock.replace('### `Q-73` —', '### `Q-72` —');
ffMdBlock = ffMdBlock.replace(
    '- **Category:** `Testing, CI/CD & AI Engineering`',
    '- **Category:** `Testing & AI Engineering`'
);

// Update CI/CD to Q-73 and category "CI/CD & DevOps"
cicdMdBlock = cicdMdBlock.replace('### `Q-72` —', '### `Q-73` —');
cicdMdBlock = cicdMdBlock.replace(
    '- **Category:** `Testing, CI/CD & AI Engineering`',
    '- **Category:** `CI/CD & DevOps`'
);

// Format the combined replacement for Q-72 and Q-73
const combinedMd = `${ffMdBlock}

---

## 🚀 CI/CD & DevOps (Q-73)

${cicdMdBlock}

---

`;

// Replace in md
md = md.substring(0, q72Start) + combinedMd + md.substring(q74Start);

// Now update all remaining `- **Category:** `Testing, CI/CD & AI Engineering`` (for Q-63..Q-71)
md = md.replace(
    /- \*\*Category:\*\* `Testing, CI\/CD & AI Engineering`/g,
    '- **Category:** `Testing & AI Engineering`'
);

fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
