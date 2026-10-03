const fs = require('fs');

const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';
const GENERATED_DOCS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Helpers/generated_docs.json';
const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';

// 1. Read files
const fullHtml = fs.readFileSync(INDEX_PATH, 'utf-8');
const lines = fullHtml.split('\n');
console.log('Original lines count:', lines.length);

// Clean lines: up to line 2902 (ending with </html>)
const cleanLines = lines.slice(0, 2902);
let cleanHtml = cleanLines.join('\n');

const generatedDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));
const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));

console.log('Questions count:', questions.length);
console.log('Module docs count:', generatedDocs.MODULE_DOCS.length);
console.log('Question to docs keys:', Object.keys(generatedDocs.QUESTION_TO_DOCS).length);

// 2. Insert MODULE_DOCS and QUESTION_TO_DOCS if missing
if (!cleanHtml.includes('const MODULE_DOCS =')) {
  const insertMarker = 'const TOPIC_CATEGORIES =';
  const docsCode = `const MODULE_DOCS = ${JSON.stringify(generatedDocs.MODULE_DOCS)};\n    const QUESTION_TO_DOCS = ${JSON.stringify(generatedDocs.QUESTION_TO_DOCS)};\n    `;
  cleanHtml = cleanHtml.replace(insertMarker, docsCode + insertMarker);
  console.log('Inserted MODULE_DOCS and QUESTION_TO_DOCS successfully!');
}

// 3. Make sure toggleDrawer and handleCardClick are on window
if (!cleanHtml.includes('window.handleCardClick =')) {
  cleanHtml = cleanHtml.replace(
    'function toggleDrawer(id) {',
    `window.toggleDrawer = function(id) {
      const drawer = document.getElementById(\`drawer-\${id}\`);
      const chev = document.getElementById(\`chev-\${id}\`);
      if (drawer) {
        drawer.classList.toggle('open');
        if (chev) chev.classList.toggle('rotated');
      }
    };

    window.handleCardClick = function(e, id) {
      if (e.target.closest('button, input, a, pre, code, .copy-btn, .mini-guide-card')) return;
      window.toggleDrawer(id);
    };

    function _legacyToggleDrawer(id) {`
  );
  console.log('Updated toggleDrawer and added window.handleCardClick!');
}

// 4. Add onclick="handleCardClick(event, '${q.id}')" to question-card div
cleanHtml = cleanHtml.replace(
  '<div class="question-card ${isReviewed ? \'reviewed\' : \'\'}" id="card-${q.id}">',
  '<div class="question-card ${isReviewed ? \'reviewed\' : \'\'}" id="card-${q.id}" onclick="handleCardClick(event, \'${q.id}\')">'
);

// 5. Write repaired index.html
fs.writeFileSync(INDEX_PATH, cleanHtml, 'utf-8');
console.log('Successfully repaired index.html!');

// 6. Verify result
const verifiedHtml = fs.readFileSync(INDEX_PATH, 'utf-8');
const verifiedLines = verifiedHtml.split('\n');
console.log('Repaired lines count:', verifiedLines.length);
console.log('Ends with:', verifiedLines.slice(-3).join('\n'));
