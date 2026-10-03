const fs = require('fs');

const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';
let html = fs.readFileSync(INDEX_PATH, 'utf-8');

// 1. Add QUESTION_TO_TOPIC right after TOPIC_CATEGORIES
const topicCatMarker = 'const TOPIC_CATEGORIES = [';
const topicCatEndIndex = html.indexOf(';', html.indexOf(topicCatMarker));
if (topicCatEndIndex !== -1 && !html.includes('const QUESTION_TO_TOPIC =')) {
  const injection = `\n\n    // Fast O(1) Question ID to Topic Category lookup for navigation\n    const QUESTION_TO_TOPIC = {};\n    TOPIC_CATEGORIES.forEach(topic => {\n      topic.questionIds.forEach(qId => {\n        QUESTION_TO_TOPIC[qId] = topic;\n      });\n    });\n    // Fallback mapping so all 53 questions have a guaranteed category\n    QUESTIONS.forEach(q => {\n      if (!QUESTION_TO_TOPIC[q.id]) {\n        const found = TOPIC_CATEGORIES.find(t => t.title.toLowerCase() === (q.category || '').toLowerCase()) || TOPIC_CATEGORIES[0];\n        QUESTION_TO_TOPIC[q.id] = found;\n      }\n    });`;
  
  html = html.slice(0, topicCatEndIndex + 1) + injection + html.slice(topicCatEndIndex + 1);
  console.log('✓ Added QUESTION_TO_TOPIC mapping');
} else {
  console.log('QUESTION_TO_TOPIC already present or marker not found');
}

// 2. Expose setSidebarVisible on window
if (!html.includes('window.setSidebarVisible =')) {
  html = html.replace('function setSidebarVisible(visible) {', 'window.setSidebarVisible = function(visible) {');
  console.log('✓ Exposed window.setSidebarVisible');
}

// 3. Remove duplicate 'm' keyboard shortcut listener at early keydown listener
const oldKeydown = `    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && readerModalBackdrop.classList.contains('open')) {
        closeReaderModalDirect();
        return;
      }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === 'm' || e.key === 'M' || e.key === '[') {
        e.preventDefault();
        setSidebarVisible(!isSidebarVisible);
      }
    });`;

const cleanKeydown = `    // Early modal escape handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && readerModalBackdrop && readerModalBackdrop.classList.contains('open')) {
        closeReaderModalDirect();
      }
    });`;

if (html.includes(oldKeydown)) {
  html = html.replace(oldKeydown, cleanKeydown);
  console.log('✓ Cleaned up redundant keydown listener for M key');
}

// 4. Update jumpToTopic & navigateToQuestion
const oldJumpAndNavigate = `    // Jump to Topic
    window.jumpToTopic = function(topicId) {
      const el = document.getElementById(\`cat-\${topicId}\`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.style.borderColor = 'var(--accent-indigo)';
        setTimeout(() => {
          el.style.borderColor = '';
        }, 1200);
      }
    };

    // Jump to Question
    window.navigateToQuestion = function(id, event) {
      if (event) event.preventDefault();
      activeQuestionId = id;

      const targetCard = document.getElementById(\`card-\${id}\`);
      if (!targetCard) {
        // Reset filters if hidden
        currentDifficulty = 'all';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        if (cmdSearchInput) cmdSearchInput.value = '';
        if (cmdSearchClear) cmdSearchClear.style.display = 'none';
        tierPills.querySelectorAll('.filter-pill').forEach(b => b.classList.toggle('active', b.dataset.diff === 'all'));
        if (cmdTierPills) {
          cmdTierPills.querySelectorAll('.cmd-tier-pill').forEach(b => b.classList.toggle('active', b.dataset.diff === 'all'));
        }
        renderTopicsAndQuestions();
      }

      // Ensure parent category is expanded
      const topicInfo = QUESTION_TO_TOPIC[id];
      if (topicInfo) {
        const wrap = document.getElementById(\`wrap-cat-\${topicInfo.id}\`);
        const btn = document.getElementById(\`btn-cat-\${topicInfo.id}\`);
        if (wrap && wrap.classList.contains('collapsed')) {
          wrap.classList.remove('collapsed');
          categoryCollapsedState[topicInfo.id] = false;
          if (btn) {
            btn.classList.remove('collapsed');
            btn.querySelector('.cat-toggle-icon').textContent = '▾';
            btn.querySelector('.cat-toggle-text').textContent = 'Shrink Questions';
          }
        }
      }

      setTimeout(() => {
        const card = document.getElementById(\`card-\${id}\`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const drawer = document.getElementById(\`drawer-\${id}\`);
          const chev = document.getElementById(\`chev-\${id}\`);
          if (drawer) drawer.classList.add('open');
          if (chev) chev.classList.add('rotated');

          card.style.outline = '2px solid var(--accent-indigo)';
          setTimeout(() => {
            card.style.outline = 'none';
          }, 2000);
        }
      }, 50);
    };`;

const enhancedJumpAndNavigate = `    // Jump to Topic
    window.jumpToTopic = function(topicId) {
      const el = document.getElementById(\`cat-\${topicId}\`);
      if (el) {
        // Expand the category if it was collapsed so user immediately sees questions
        const wrap = document.getElementById(\`wrap-cat-\${topicId}\`);
        const btn = document.getElementById(\`btn-cat-\${topicId}\`);
        if (wrap && wrap.classList.contains('collapsed')) {
          wrap.classList.remove('collapsed');
          categoryCollapsedState[topicId] = false;
          if (btn) {
            btn.classList.remove('collapsed');
            const icon = btn.querySelector('.cat-toggle-icon');
            const text = btn.querySelector('.cat-toggle-text');
            if (icon) icon.textContent = '▾';
            if (text) text.textContent = 'Shrink Questions';
          }
        }

        // On mobile/tablet, close the sidebar overlay so user sees the target topic
        if (window.innerWidth <= 1024) {
          window.setSidebarVisible(false);
        }

        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.style.borderColor = 'var(--accent-indigo)';
        setTimeout(() => {
          el.style.borderColor = '';
        }, 1200);
      }
    };

    // Jump to Question
    window.navigateToQuestion = function(id, event) {
      if (event) event.preventDefault();
      activeQuestionId = id;

      const targetCard = document.getElementById(\`card-\${id}\`);
      if (!targetCard) {
        // Reset filters if hidden
        currentDifficulty = 'all';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        if (cmdSearchInput) cmdSearchInput.value = '';
        if (cmdSearchClear) cmdSearchClear.style.display = 'none';
        tierPills.querySelectorAll('.filter-pill').forEach(b => b.classList.toggle('active', b.dataset.diff === 'all'));
        if (cmdTierPills) {
          cmdTierPills.querySelectorAll('.cmd-tier-pill').forEach(b => b.classList.toggle('active', b.dataset.diff === 'all'));
        }
        renderTopicsAndQuestions();
      }

      // Ensure parent category is expanded
      const topicInfo = QUESTION_TO_TOPIC[id];
      if (topicInfo) {
        const wrap = document.getElementById(\`wrap-cat-\${topicInfo.id}\`);
        const btn = document.getElementById(\`btn-cat-\${topicInfo.id}\`);
        if (wrap && wrap.classList.contains('collapsed')) {
          wrap.classList.remove('collapsed');
          categoryCollapsedState[topicInfo.id] = false;
          if (btn) {
            btn.classList.remove('collapsed');
            const icon = btn.querySelector('.cat-toggle-icon');
            const text = btn.querySelector('.cat-toggle-text');
            if (icon) icon.textContent = '▾';
            if (text) text.textContent = 'Shrink Questions';
          }
        }
      }

      // On mobile/tablet, close the sidebar drawer so user sees the target card
      if (window.innerWidth <= 1024) {
        window.setSidebarVisible(false);
      }

      // Highlight active question item in sidebar
      document.querySelectorAll('.sidebar-item.active').forEach(el => el.classList.remove('active'));
      const sideItem = document.getElementById(\`side-item-\${id}\`);
      if (sideItem) {
        sideItem.classList.add('active');
        sideItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      setTimeout(() => {
        const card = document.getElementById(\`card-\${id}\`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const drawer = document.getElementById(\`drawer-\${id}\`);
          const chev = document.getElementById(\`chev-\${id}\`);
          if (drawer) drawer.classList.add('open');
          if (chev) chev.classList.add('rotated');

          card.style.outline = '2px solid var(--accent-indigo)';
          setTimeout(() => {
            card.style.outline = 'none';
          }, 2000);
        }
      }, 60);
    };`;

if (html.includes(oldJumpAndNavigate)) {
  html = html.replace(oldJumpAndNavigate, enhancedJumpAndNavigate);
  console.log('✓ Updated jumpToTopic and navigateToQuestion');
} else {
  console.log('Could not find oldJumpAndNavigate block');
}

// 5. Call window.renderTopicsAndQuestions() on initial load
const oldBottomRender = `    // Trigger the first render with observer setup
    // (The existing 'renderTopicsAndQuestions()' call at line ~2154
    //  will now go through the patched version above)
    initSectionObserver();`;

const newBottomRender = `    // Trigger initial render so all questions, categories, and index are visible immediately on load!
    window.renderTopicsAndQuestions();`;

if (html.includes(oldBottomRender)) {
  html = html.replace(oldBottomRender, newBottomRender);
  console.log('✓ Replaced bottom render call with window.renderTopicsAndQuestions()');
} else {
  console.log('Could not find oldBottomRender block');
}

// 6. Test syntax
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
new Function(scriptMatch[1]);
console.log('✓ Script passes new Function() syntax validation!');

// 7. Write updated html
fs.writeFileSync(INDEX_PATH, html, 'utf-8');
console.log('✓ Successfully wrote updated index.html! Line count:', html.split('\n').length);
