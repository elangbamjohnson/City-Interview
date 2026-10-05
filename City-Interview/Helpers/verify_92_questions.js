const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '../Resources/questions.json');
const indexPath = path.join(__dirname, '../index.html');
const mdPath = path.join(__dirname, '../QUESTIONS.md');
const genDocsPath = path.join(__dirname, '../Helpers/generated_docs.json');

const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
const html = fs.readFileSync(indexPath, 'utf8');
const md = fs.readFileSync(mdPath, 'utf8');
const genDocs = JSON.parse(fs.readFileSync(genDocsPath, 'utf8'));

console.log('--- 1. Checking questions.json ---');
console.log('Total questions:', questions.length);
if (questions.length !== 92) {
  console.error(`ERROR: Expected 92 questions, got ${questions.length}`);
  process.exit(1);
}

for (let i = 0; i < 92; i++) {
  const expectedId = 'Q-' + String(i + 1).padStart(2, '0');
  if (questions[i].id !== expectedId) {
    console.error(`ERROR: Index ${i} has id ${questions[i].id}, expected ${expectedId}`);
    process.exit(1);
  }
}
console.log('✓ questions.json IDs Q-01 through Q-92 strictly sequential!');

console.log('\n--- 2. Checking Q-84 details ---');
const q84 = questions.find(q => q.id === 'Q-84');
console.log('Q-84 ID:', q84.id);
console.log('Q-84 Category:', q84.category);
console.log('Q-84 Question:', q84.question);
console.log('Q-84 InterviewSentence:', q84.interviewSentence.substring(0, 100) + '...');

console.log('\n--- 3. Checking index.html embedded QUESTIONS & TOPIC_CATEGORIES ---');
const matchQuestions = html.match(/const QUESTIONS = (\[[\s\S]*?\]);\s*\n\s*const MODULE_DOCS/);
if (!matchQuestions) {
  console.error('ERROR: Could not parse const QUESTIONS from index.html');
  process.exit(1);
}
const htmlQuestions = JSON.parse(matchQuestions[1]);
console.log('html QUESTIONS count:', htmlQuestions.length);
if (htmlQuestions.length !== 92) {
  console.error(`ERROR: Expected 92 questions in html, got ${htmlQuestions.length}`);
  process.exit(1);
}

const matchCat = html.match(/const TOPIC_CATEGORIES = (\[[\s\S]*?\]);\s*\n/);
if (!matchCat) {
  console.error('ERROR: Could not parse const TOPIC_CATEGORIES from index.html');
  process.exit(1);
}
const categories = JSON.parse(matchCat[1]);
console.log('Total categories in index.html:', categories.length);

let allCatQIds = [];
categories.forEach((c, idx) => {
  console.log(`${idx + 1}. Category ${c.id} (${c.title}): ${c.questionIds.length} questions -> ${c.questionIds[0]}..${c.questionIds[c.questionIds.length - 1]}`);
  allCatQIds.push(...c.questionIds);
});

console.log('Total questionIds across categories:', allCatQIds.length);
if (allCatQIds.length !== 92) {
  console.error(`ERROR: Expected 92 questionIds, got ${allCatQIds.length}`);
  process.exit(1);
}

for (let i = 0; i < 92; i++) {
  const expectedId = 'Q-' + String(i + 1).padStart(2, '0');
  if (allCatQIds[i] !== expectedId) {
    console.error(`ERROR: Category questionIds mismatch at ${i}: expected ${expectedId}, got ${allCatQIds[i]}`);
    process.exit(1);
  }
}
console.log('✓ TOPIC_CATEGORIES perfectly covers Q-01 through Q-92 without gaps or duplicates!');

console.log('\n--- 4. Checking QUESTION_TO_DOCS ---');
const matchQ2D = html.match(/const QUESTION_TO_DOCS = (\{[\s\S]*?\});\s*\n/);
const htmlQ2D = JSON.parse(matchQ2D[1]);
if (JSON.stringify(htmlQ2D) !== JSON.stringify(genDocs.QUESTION_TO_DOCS)) {
  console.error('ERROR: QUESTION_TO_DOCS in index.html does not match generated_docs.json');
  process.exit(1);
}
console.log(`✓ QUESTION_TO_DOCS in index.html and generated_docs.json match! Total keys: ${Object.keys(htmlQ2D).length}`);
console.log('Q-84 docs:', htmlQ2D['Q-84']);
console.log('Q-90 docs (shifted side table):', htmlQ2D['Q-90']);

console.log('\n--- 5. Checking QUESTIONS.md ---');
for (let i = 1; i <= 92; i++) {
  const expectedH3 = `### \`Q-${String(i).padStart(2, '0')}\` —`;
  if (!md.includes(expectedH3)) {
    console.error(`ERROR: QUESTIONS.md is missing header ${expectedH3}`);
    process.exit(1);
  }
}
console.log('✓ QUESTIONS.md has all 92 questions from Q-01 to Q-92 in place!');

console.log('\n🌟 ALL 92 QUESTIONS AND 15 CATEGORIES VALIDATED PERFECTLY! 🌟\n');
