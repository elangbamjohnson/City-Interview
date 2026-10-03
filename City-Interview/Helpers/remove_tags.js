const fs = require('fs');
const vm = require('vm');

const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';
const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';

let html = fs.readFileSync(INDEX_PATH, 'utf-8');

// 1. Remove the cmd-tier-pills and its divider from the command bar
// Match from <div class="cmd-divider"></div> to end of <div class="cmd-tier-pills" id="cmdTierPills">...</div>
html = html.replace(
  /\s*<div class="cmd-divider"><\/div>\s*<!-- Difficulty filter pills -->\s*<div class="cmd-tier-pills" id="cmdTierPills">[\s\S]*?<\/div>/,
  ''
);

// 2. Remove tierPills from controls-row (which is kept hidden anyway, but clean it up)
html = html.replace(
  /\s*<!-- Difficulty Filter Pills -->\s*<div class="pill-group" id="tierPills">[\s\S]*?<\/div>/,
  ''
);

// 3. In cmd-search-wrap, give it max-width: 440px so it fills out nicely in CSS
html = html.replace(
  /\.cmd-search-wrap\s*\{\s*position:\s*relative;\s*flex:\s*1;\s*min-width:\s*200px;\s*max-width:\s*360px;\s*\}/,
  `.cmd-search-wrap {
      position: relative;
      flex: 1;
      min-width: 200px;
      max-width: 460px;
    }`
);

// 4. In emptyState, remove "or resetting your difficulty filter."
html = html.replace(
  '<p>Try searching for a different keyword or resetting your difficulty filter.</p>',
  '<p>Try searching for a different keyword.</p>'
);

// 5. In JS:
// a. Remove `let currentDifficulty = 'all';`
html = html.replace("let currentDifficulty = 'all';\n", "");

// b. Remove the difficulty check in selectQuestion:
html = html.replace(
  `      if (currentDifficulty !== 'all' && qObj && qObj.difficulty !== currentDifficulty) {
        currentDifficulty = 'all';
        document.querySelectorAll('.filter-pill, .cmd-tier-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.diff === 'all');
        });
      }\n`,
  ""
);

// c. Remove matchesDiff in renderTopicsAndQuestions:
html = html.replace(
  `        const filteredQuestions = topicQuestions.filter(q => {
          const matchesDiff = (currentDifficulty === 'all' || q.difficulty === currentDifficulty);
          if (!matchesDiff) return false;

          if (!query) return true;`,
  `        const filteredQuestions = topicQuestions.filter(q => {
          if (!query) return true;`
);

// d. Remove diffClass and the difficulty badge in questionsHTML:
html = html.replace(
  "          const isReviewed = reviewedIDs.has(q.id);\n          const diffClass = `badge-diff-${q.difficulty.toLowerCase()}`;",
  "          const isReviewed = reviewedIDs.has(q.id);"
);

html = html.replace(
  `                <div class="card-badges">
                  <span class="badge badge-id">\${q.id}</span>
                  <span class="badge badge-category">\${escapeHtml(q.category)}</span>
                  <span class="badge \${diffClass}">\${q.difficulty}</span>
                </div>`,
  `                <div class="card-badges">
                  <span class="badge badge-id">\${q.id}</span>
                  <span class="badge badge-category">\${escapeHtml(q.category)}</span>
                </div>`
);

// e. Remove tierPills and cmdTierPills event listeners:
html = html.replace(
  `    if (tierPills) {
      tierPills.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-pill');
        if (!btn) return;
        tierPills.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.diff;
        const cmdTierPills = document.getElementById('cmdTierPills');
        if (cmdTierPills) {
          cmdTierPills.querySelectorAll('.cmd-tier-pill').forEach(b =>
            b.classList.toggle('active', b.dataset.diff === currentDifficulty)
          );
        }
        window.renderTopicsAndQuestions();
      });
    }\n`,
  ""
);

html = html.replace(
  `    const cmdTierPills = document.getElementById('cmdTierPills');\n`,
  ""
);

html = html.replace(
  `    if (cmdTierPills) {
      cmdTierPills.addEventListener('click', (e) => {
        const btn = e.target.closest('.cmd-tier-pill');
        if (!btn) return;
        cmdTierPills.querySelectorAll('.cmd-tier-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.diff;
        if (tierPills) {
          tierPills.querySelectorAll('.filter-pill').forEach(b =>
            b.classList.toggle('active', b.dataset.diff === currentDifficulty)
          );
        }
        window.renderTopicsAndQuestions();
      });
    }\n`,
  ""
);

// 6. Validate script syntax in index.html
const scriptOpen = html.indexOf('<script>');
const scriptClose = html.lastIndexOf('</script>');
const js = html.substring(scriptOpen + 8, scriptClose);
try {
  new vm.Script(js, { filename: 'index-cleaned.js' });
  console.log('VALIDATION PASSED: index.html JavaScript is 100% syntactically valid!');
} catch (err) {
  console.error('VALIDATION FAILED in index.html script:', err);
  process.exit(1);
}

fs.writeFileSync(INDEX_PATH, html, 'utf-8');
console.log('Successfully updated index.html with all difficulty tags removed!');

// 7. Update QUESTIONS.md: remove the "- **Difficulty:** ..." lines
let md = fs.readFileSync(QUESTIONS_MD_PATH, 'utf-8');
md = md.replace(/\n- \*\*Difficulty:\*\* [^\n]+/g, '');
fs.writeFileSync(QUESTIONS_MD_PATH, md, 'utf-8');
console.log('Successfully updated QUESTIONS.md with difficulty lines removed!');
