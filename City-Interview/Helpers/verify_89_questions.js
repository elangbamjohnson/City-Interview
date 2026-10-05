const fs = require('fs');
const path = require('path');

const questions = JSON.parse(fs.readFileSync('Resources/questions.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const md = fs.readFileSync('QUESTIONS.md', 'utf8');
const genDocs = JSON.parse(fs.readFileSync('Helpers/generated_docs.json', 'utf8'));

console.log('--- 1. Checking questions.json ---');
console.log('Total questions:', questions.length);
if (questions.length !== 89) throw new Error('Expected 89 questions, got ' + questions.length);

for (let i = 0; i < 89; i++) {
  const expectedId = 'Q-' + String(i + 1).padStart(2, '0');
  if (questions[i].id !== expectedId) {
    throw new Error('questions.json mismatch at index ' + i + ': expected ' + expectedId + ', got ' + questions[i].id);
  }
}
console.log('✓ questions.json IDs Q-01 through Q-89 strictly sequential!');

console.log('\n--- 2. Checking Q-63 details ---');
const q63 = questions[62];
console.log('Q-63 ID:', q63.id);
console.log('Q-63 Category:', q63.category);
console.log('Q-63 Question:', q63.question);
console.log('Q-63 ImageName:', q63.imageName);

console.log('\n--- 3. Checking index.html embedded QUESTIONS & TOPIC_CATEGORIES ---');
const startQ = html.indexOf('const QUESTIONS = [');
const endQ = html.indexOf(';\n    const MODULE_DOCS =', startQ);
const htmlQuestions = JSON.parse(html.substring(startQ + 'const QUESTIONS = '.length, endQ));
console.log('html QUESTIONS count:', htmlQuestions.length);
if (htmlQuestions.length !== 89) throw new Error('index.html questions length mismatch');

const startCat = html.indexOf('const TOPIC_CATEGORIES = [');
const endCat = html.indexOf('];\n', startCat);
const topicCategories = JSON.parse(html.substring(startCat + 'const TOPIC_CATEGORIES = '.length, endCat + 1));

let allCatIds = [];
topicCategories.forEach(c => {
  console.log('Category ' + c.id + ' (' + c.title + '): ' + c.questionIds.length + ' questions -> ' + c.questionIds[0] + '..' + c.questionIds[c.questionIds.length - 1]);
  allCatIds.push(...c.questionIds);
});

console.log('Total questionIds across categories:', allCatIds.length);
if (allCatIds.length !== 89) throw new Error('Expected 89 questionIds in categories');
for (let i = 0; i < 89; i++) {
  const expectedId = 'Q-' + String(i + 1).padStart(2, '0');
  if (allCatIds[i] !== expectedId) {
    throw new Error('Category mismatch at ' + i + ': expected ' + expectedId + ', got ' + allCatIds[i]);
  }
}
console.log('✓ TOPIC_CATEGORIES perfectly covers Q-01 through Q-89 without gaps or duplicates!');

console.log('\n--- 4. Checking QUESTION_TO_DOCS ---');
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const htmlQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
if (JSON.stringify(htmlQ2D) !== JSON.stringify(genDocs.QUESTION_TO_DOCS)) {
  throw new Error('QUESTION_TO_DOCS in index.html does not match generated_docs.json');
}
console.log('✓ QUESTION_TO_DOCS in index.html and generated_docs.json match! Q-63 docs:', htmlQ2D['Q-63'].length);

console.log('\n--- 5. Checking QUESTIONS.md ---');
for (let i = 1; i <= 89; i++) {
  const anchor = '### `Q-' + String(i).padStart(2, '0') + '` —';
  const idx = md.indexOf(anchor);
  if (idx === -1) {
    throw new Error('QUESTIONS.md missing anchor: ' + anchor);
  }
}
console.log('✓ QUESTIONS.md has all 89 questions from Q-01 to Q-89 in place!');

console.log('\n--- 6. Checking Image Assets ---');
const archRes = path.join('Resources/grocery_app_architecture_diagram.png');
const flowRes = path.join('Resources/grocery_app_order_flow_diagram.png');
const archAsset = path.join('Assets.xcassets/grocery_app_architecture_diagram.imageset/grocery_app_architecture_diagram.png');
const flowAsset = path.join('Assets.xcassets/grocery_app_order_flow_diagram.imageset/grocery_app_order_flow_diagram.png');

if (!fs.existsSync(archRes) || !fs.existsSync(flowRes)) throw new Error('Missing Resources diagrams');
if (!fs.existsSync(archAsset) || !fs.existsSync(flowAsset)) throw new Error('Missing Assets diagrams');
console.log('✓ Both diagrams exist in Resources/ and Assets.xcassets/ !');

console.log('\n🌟 ALL 89 QUESTIONS AND ARTIFACTS VALIDATED PERFECTLY! 🌟');
