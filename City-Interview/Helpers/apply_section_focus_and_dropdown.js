const fs = require('fs');
const vm = require('vm');

const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

let html = fs.readFileSync(INDEX_PATH, 'utf-8');

// 1. Add CSS for sidebar dropdown button, topic items container, active section header, and section-focus-bar
const newCss = `
    .sidebar-topic-group {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      margin-bottom: 0.45rem;
    }

    .sidebar-topic-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.38rem 0.55rem;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.03);
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-primary);
      transition: all 0.15s ease;
      gap: 0.4rem;
    }

    .sidebar-topic-header:hover {
      background: rgba(217, 119, 87, 0.12);
      color: var(--accent-claude);
    }

    .sidebar-topic-header.active {
      background: rgba(217, 119, 87, 0.15);
      border-left: 3px solid var(--accent-claude);
      color: var(--accent-claude);
    }

    [data-theme="light"] .sidebar-topic-header {
      background: rgba(0, 0, 0, 0.03);
    }

    [data-theme="light"] .sidebar-topic-header.active {
      background: rgba(217, 119, 87, 0.12);
      border-left: 3px solid var(--accent-claude);
      color: var(--accent-claude);
    }

    .sidebar-dropdown-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      color: var(--text-muted);
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: 0.72rem;
      padding: 0;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .sidebar-dropdown-btn:hover {
      background: rgba(217, 119, 87, 0.2);
      border-color: rgba(217, 119, 87, 0.4);
      color: var(--accent-claude);
    }

    [data-theme="light"] .sidebar-dropdown-btn {
      border-color: rgba(0, 0, 0, 0.1);
    }

    [data-theme="light"] .sidebar-dropdown-btn:hover {
      background: rgba(217, 119, 87, 0.15);
      border-color: var(--accent-claude);
      color: var(--accent-claude);
    }

    .sidebar-topic-items {
      display: flex;
      flex-direction: column;
      gap: 0.12rem;
      padding-left: 0.35rem;
      transition: all 0.2s ease;
    }

    .sidebar-topic-items.collapsed {
      display: none;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.65rem 0.35rem 1rem;
      border-radius: var(--radius-sm);
      text-decoration: none;
      color: var(--text-secondary);
      font-size: 0.78rem;
      transition: all 0.15s ease;
      cursor: pointer;
      line-height: 1.35;
    }

    .sidebar-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
      transform: translateX(2px);
    }

    [data-theme="light"] .sidebar-item:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .sidebar-item.active {
      background: rgba(217, 119, 87, 0.18);
      color: var(--accent-claude);
      border-left: 3px solid var(--accent-claude);
      font-weight: 600;
    }

    .sidebar-item.reviewed .sidebar-item-text {
      opacity: 0.65;
    }

    .sidebar-id-badge {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      flex-shrink: 0;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .sidebar-item.active .sidebar-id-badge {
      background: var(--accent-claude);
      color: #ffffff;
    }

    .sidebar-item-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar-check {
      font-size: 0.72rem;
      color: var(--accent-emerald);
      flex-shrink: 0;
    }

    /* Section Focus Bar in Main View */
    .section-focus-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
      transition: all 0.2s ease;
    }

    .section-focus-left {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    .section-focus-label {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .section-focus-title {
      font-family: var(--font-serif);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .section-focus-count {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.06);
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
    }

    [data-theme="light"] .section-focus-count {
      background: rgba(0, 0, 0, 0.06);
    }

    .section-focus-btn {
      background: rgba(217, 119, 87, 0.12);
      border: 1px solid rgba(217, 119, 87, 0.35);
      color: var(--accent-claude);
      padding: 0.4rem 0.9rem;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      transition: all 0.2s ease;
    }

    .section-focus-btn:hover {
      background: var(--accent-claude);
      color: #ffffff;
      transform: translateY(-1px);
    }
`;

// Replace existing sidebar CSS
const oldCssRegex = /\.sidebar-topic-group \{[\s\S]*?\.sidebar-check \{[\s\S]*?\}/;
html = html.replace(oldCssRegex, newCss.trim());

// 2. Update JavaScript logic inside <script>
const scriptOpen = html.indexOf('<script>');
const scriptClose = html.lastIndexOf('</script>');
let script = html.substring(scriptOpen + 8, scriptClose);

// Replace State variables to include activeSectionId and sidebarSectionOpenState
script = script.replace(
  /let activeQuestionId = null;\n\s*let activeDocPath = '';/,
  `let activeQuestionId = 'Q-01';\n    let activeSectionId = 'architecture';\n    let sidebarSectionOpenState = { 'architecture': true };\n    let activeDocPath = '';`
);

// Add window.toggleSidebarDropdown, window.selectSection, and window.toggleViewAllSections
const newNavMethods = `
    // Toggle Sidebar Section Dropdown (Hide/Unhide questions for a section in the index)
    window.toggleSidebarDropdown = function(topicId, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      sidebarSectionOpenState[topicId] = !sidebarSectionOpenState[topicId];
      renderSidebar();
    };

    // Select Active Section (Shows ONLY this section in the main view)
    window.selectSection = function(topicId, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      activeSectionId = topicId;
      sidebarSectionOpenState[topicId] = true;
      if (searchQuery) {
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        const cmdSearchInput = document.getElementById('cmdSearchInput');
        const cmdSearchClear = document.getElementById('cmdSearchClear');
        if (cmdSearchInput) cmdSearchInput.value = '';
        if (cmdSearchClear) cmdSearchClear.style.display = 'none';
      }
      window.renderTopicsAndQuestions();
      renderSidebar();
      const el = document.getElementById(\`cat-\${topicId}\`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // Toggle between Viewing Single Section vs All Sections
    window.toggleViewAllSections = function() {
      if (activeSectionId === 'all') {
        const currentQ = QUESTIONS.find(q => q.id === activeQuestionId);
        const topic = currentQ ? QUESTION_TO_TOPIC[currentQ.id] : TOPIC_CATEGORIES[0];
        activeSectionId = topic ? topic.id : 'architecture';
      } else {
        activeSectionId = 'all';
      }
      window.renderTopicsAndQuestions();
      renderSidebar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Jump to Topic (delegates to selectSection)
    window.jumpToTopic = function(topicId) {
      window.selectSection(topicId);
    };
`;

// Replace existing window.jumpToTopic
script = script.replace(/window\.jumpToTopic = function\(topicId\) \{[\s\S]*?\n    \};\n/, newNavMethods);

// Update window.navigateToQuestion so selecting a question focuses ONLY that section in main view
const newNavigateToQuestion = `window.navigateToQuestion = function(id, event) {
      if (event) event.preventDefault();
      activeQuestionId = id;

      const qObj = QUESTIONS.find(q => q.id === id);
      const topicInfo = QUESTION_TO_TOPIC[id] || TOPIC_CATEGORIES[0];

      // 1. Focus only the section of the selected question
      activeSectionId = topicInfo.id;
      // 2. Unhide questions of this section in the index
      sidebarSectionOpenState[topicInfo.id] = true;

      if (currentDifficulty !== 'all' && qObj && qObj.difficulty !== currentDifficulty) {
        currentDifficulty = 'all';
        document.querySelectorAll('.filter-pill, .cmd-tier-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.diff === 'all');
        });
      }

      if (searchQuery) {
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        const cmdSearchInput = document.getElementById('cmdSearchInput');
        const cmdSearchClear = document.getElementById('cmdSearchClear');
        if (cmdSearchInput) cmdSearchInput.value = '';
        if (cmdSearchClear) cmdSearchClear.style.display = 'none';
      }

      // Re-render main view so ONLY the section of this question is visible!
      window.renderTopicsAndQuestions();
      renderSidebar();

      if (window.innerWidth <= 1024) {
        window.setSidebarVisible(false);
      }

      // Scroll to question & open answer drawer
      setTimeout(() => {
        const card = document.getElementById(\`card-\${id}\`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const drawer = document.getElementById(\`drawer-\${id}\`);
          const chev = document.getElementById(\`chev-\${id}\`);
          if (drawer) drawer.classList.add('open');
          if (chev) chev.classList.add('rotated');

          card.style.outline = '2px solid var(--accent-claude)';
          setTimeout(() => {
            card.style.outline = 'none';
          }, 2000);
        }
      }, 70);
    };`;

script = script.replace(/window\.navigateToQuestion = function\(id, event\) \{[\s\S]*?\n    \};\n/, newNavigateToQuestion + '\n');

// Update renderSidebar() to include dropdown toggle button and collapsible question items
const newRenderSidebar = `function renderSidebar() {
      if (!sidebarNav) return;
      sidebarNav.innerHTML = '';
      const query = sidebarFilterQuery.toLowerCase();

      TOPIC_CATEGORIES.forEach(topic => {
        const topicQs = QUESTIONS.filter(q => topic.questionIds.includes(q.id));
        const filteredQs = topicQs.filter(q => {
          if (!query) return true;
          return q.question.toLowerCase().includes(query) ||
                 q.id.toLowerCase().includes(query) ||
                 topic.title.toLowerCase().includes(query);
        });

        if (query && filteredQs.length === 0 && !topic.title.toLowerCase().includes(query)) {
          return;
        }

        const reviewedInTopic = topicQs.filter(q => reviewedIDs.has(q.id)).length;
        const isCurrentActiveSection = (activeSectionId === topic.id);

        // If searching in sidebar, auto-open matching; otherwise check sidebarSectionOpenState
        const isOpen = query ? true : (sidebarSectionOpenState[topic.id] === true);

        const group = document.createElement('div');
        group.className = 'sidebar-topic-group';

        const header = document.createElement('div');
        header.className = \`sidebar-topic-header \${isCurrentActiveSection ? 'active' : ''}\`;
        
        header.innerHTML = \`
          <div style="display: flex; align-items: center; gap: 0.35rem; min-width: 0; flex: 1;">
            <button class="sidebar-dropdown-btn" 
                    title="\${isOpen ? 'Hide questions' : 'Show questions'}" 
                    aria-label="\${isOpen ? 'Hide questions' : 'Show questions'}"
                    onclick="window.toggleSidebarDropdown('\${topic.id}', event)">
              <span class="dropdown-caret">\${isOpen ? '▾' : '▸'}</span>
            </button>
            <div onclick="window.selectSection('\${topic.id}', event)" 
                 style="display: flex; align-items: center; gap: 0.35rem; min-width: 0; cursor: pointer; flex: 1;">
              <span>\${topic.icon}</span>
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${escapeHtml(topic.shortTitle)}</span>
            </div>
          </div>
          <span class="sidebar-id-badge" onclick="window.selectSection('\${topic.id}', event)" style="cursor: pointer;">\${reviewedInTopic}/\${topicQs.length}</span>
        \`;
        group.appendChild(header);

        // Container for questions of this section
        const itemsWrap = document.createElement('div');
        itemsWrap.className = \`sidebar-topic-items \${isOpen ? '' : 'collapsed'}\`;
        itemsWrap.id = \`sidebar-items-\${topic.id}\`;

        filteredQs.forEach(q => {
          const isReviewed = reviewedIDs.has(q.id);
          const isActive = (q.id === activeQuestionId);

          const a = document.createElement('a');
          a.className = \`sidebar-item \${isReviewed ? 'reviewed' : ''} \${isActive ? 'active' : ''}\`;
          a.id = \`side-item-\${q.id}\`;
          a.href = \`#card-\${q.id}\`;
          a.onclick = (e) => window.navigateToQuestion(q.id, e);

          a.innerHTML = \`
            <span class="sidebar-id-badge">\${q.id}</span>
            <span class="sidebar-item-text" title="\${escapeHtml(q.question)}">\${escapeHtml(q.question)}</span>
            <span class="sidebar-check">\${isReviewed ? '✓' : '○'}</span>
          \`;
          itemsWrap.appendChild(a);
        });

        group.appendChild(itemsWrap);
        sidebarNav.appendChild(group);
      });
    }`;

script = script.replace(/function renderSidebar\(\) \{[\s\S]*?\n    \}/, newRenderSidebar);

// Update renderTopicsAndQuestions() to display ONLY activeSectionId and add section-focus-bar
const newRenderTopicsAndQuestions = `window.renderTopicsAndQuestions = function() {
      if (!topicsContainer) return;
      topicsContainer.innerHTML = '';
      if (topicsQuickStrip) topicsQuickStrip.innerHTML = '';

      // 1. Build Topics Quick Strip
      if (topicsQuickStrip) {
        const allPill = document.createElement('a');
        allPill.className = \`topic-strip-pill \${activeSectionId === 'all' ? 'active' : ''}\`;
        allPill.href = '#';
        allPill.onclick = (e) => {
          e.preventDefault();
          window.toggleViewAllSections();
        };
        allPill.innerHTML = \`<span>🌐</span> <span>All Sections (\${TOPIC_CATEGORIES.length})</span>\`;
        topicsQuickStrip.appendChild(allPill);

        TOPIC_CATEGORIES.forEach(topic => {
          const pill = document.createElement('a');
          const isSelected = (activeSectionId === topic.id);
          pill.className = \`topic-strip-pill \${isSelected ? 'active' : ''}\`;
          pill.href = \`#cat-\${topic.id}\`;
          pill.onclick = (e) => {
            e.preventDefault();
            window.selectSection(topic.id);
          };
          pill.innerHTML = \`<span>\${topic.icon}</span> <span>\${escapeHtml(topic.shortTitle)}</span>\`;
          topicsQuickStrip.appendChild(pill);
        });
      }

      // 2. Filter Topics to Display
      const query = searchQuery.toLowerCase();
      let totalMatchedQuestions = 0;

      // Determine topics to display:
      // If there is an active search query, display any topic matching the search.
      // Otherwise, if activeSectionId is set and !== 'all', display ONLY that section!
      let topicsToDisplay = TOPIC_CATEGORIES;
      if (!query && activeSectionId && activeSectionId !== 'all') {
        topicsToDisplay = TOPIC_CATEGORIES.filter(t => t.id === activeSectionId);
      }

      // Section Focus Toolbar in Main Area
      const focusBar = document.createElement('div');
      focusBar.className = 'section-focus-bar';

      if (activeSectionId !== 'all' && !query) {
        const currentTopic = TOPIC_CATEGORIES.find(t => t.id === activeSectionId) || TOPIC_CATEGORIES[0];
        const sectionIndex = TOPIC_CATEGORIES.findIndex(t => t.id === currentTopic.id) + 1;
        const totalSectionQs = QUESTIONS.filter(q => currentTopic.questionIds.includes(q.id)).length;

        focusBar.innerHTML = \`
          <div class="section-focus-left">
            <span class="section-focus-label">Section \${sectionIndex} of \${TOPIC_CATEGORIES.length}</span>
            <span class="section-focus-title">\${currentTopic.icon} \${escapeHtml(currentTopic.title)}</span>
            <span class="section-focus-count">\${totalSectionQs} Questions</span>
          </div>
          <div class="section-focus-right">
            <button class="section-focus-btn" onclick="window.toggleViewAllSections()" title="Show all 13 sections in main view">
              <span>🌐</span> <span>Show All Sections (\${TOPIC_CATEGORIES.length})</span>
            </button>
          </div>
        \`;
      } else {
        focusBar.innerHTML = \`
          <div class="section-focus-left">
            <span class="section-focus-label">Viewing Mode</span>
            <span class="section-focus-title">🌐 All Sections (\${TOPIC_CATEGORIES.length} Topics · \${QUESTIONS.length} Questions)</span>
          </div>
          <div class="section-focus-right">
            <button class="section-focus-btn" onclick="window.toggleViewAllSections()" title="Focus on single section">
              <span>🎯</span> <span>Focus Single Section</span>
            </button>
          </div>
        \`;
      }
      topicsContainer.appendChild(focusBar);

      // Update activeSectionPill in the top command bar
      if (activePill) {
        if (activeSectionId !== 'all' && !query) {
          const currentTopic = TOPIC_CATEGORIES.find(t => t.id === activeSectionId) || TOPIC_CATEGORIES[0];
          activePill.textContent = \`\${currentTopic.icon} \${currentTopic.shortTitle}\`;
        } else {
          activePill.textContent = \`🌐 All Sections\`;
        }
      }

      topicsToDisplay.forEach(topic => {
        const topicQuestions = QUESTIONS.filter(q => topic.questionIds.includes(q.id));
        const topicDocs = (topic.docIds || []).map(id => MODULE_DOCS.find(d => d.id === id)).filter(Boolean);

        const filteredQuestions = topicQuestions.filter(q => {
          const matchesDiff = (currentDifficulty === 'all' || q.difficulty === currentDifficulty);
          if (!matchesDiff) return false;

          if (!query) return true;
          return q.question.toLowerCase().includes(query) ||
                 q.id.toLowerCase().includes(query) ||
                 (q.answer && q.answer.toLowerCase().includes(query)) ||
                 (q.interviewSentence && q.interviewSentence.toLowerCase().includes(query)) ||
                 (q.codeExample && q.codeExample.toLowerCase().includes(query));
        });

        if (query && filteredQuestions.length === 0) {
          return;
        }

        totalMatchedQuestions += filteredQuestions.length;

        const isCollapsed = categoryCollapsedState[topic.id] || false;
        const reviewedInTopic = topicQuestions.filter(q => reviewedIDs.has(q.id)).length;
        const totalInTopic = topicQuestions.length;
        const pctInTopic = totalInTopic ? Math.round((reviewedInTopic / totalInTopic) * 100) : 0;

        const catCard = document.createElement('div');
        catCard.className = 'topic-category-card';
        catCard.id = \`cat-\${topic.id}\`;
        catCard.style.borderLeft = \`5px solid \${topic.color}\`;

        // Render Companion Guides
        let guidesHTML = '';
        if (topicDocs.length > 0) {
          let guideCardsHTML = '';
          topicDocs.forEach(d => {
            guideCardsHTML += \`
              <div class="mini-guide-card" onclick="openReaderModal('\${d.id}')">
                <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 0;">
                  <span style="font-size: 1.15rem;">\${d.icon}</span>
                  <span class="mini-guide-title">\${escapeHtml(d.title)}</span>
                </div>
                <button class="mini-guide-read-btn">Read →</button>
              </div>
            \`;
          });

          guidesHTML = \`
            <div class="category-guides-strip">
              <div class="category-guides-label">
                <span>📖 Companion Guides & Decision Tables (\${topicDocs.length})</span>
              </div>
              <div class="category-guides-grid">
                \${guideCardsHTML}
              </div>
            </div>
          \`;
        }

        // Render Questions inside Category
        let questionsHTML = '';
        filteredQuestions.forEach(q => {
          const isReviewed = reviewedIDs.has(q.id);
          const diffClass = \`badge-diff-\${q.difficulty.toLowerCase()}\`;

          let pitchHTML = '';
          if (q.interviewSentence) {
            pitchHTML = \`
              <div class="pitch-box">
                <div class="pitch-label">🗣️ Spoken Interview Pitch (Say it like this)</div>
                <div class="pitch-text">"\${escapeHtml(q.interviewSentence)}"</div>
              </div>
            \`;
          }

          let relatedDocsHTML = '';
          const docs = QUESTION_TO_DOCS[q.id];
          if (docs && docs.length > 0) {
            relatedDocsHTML = '<div class="card-related-docs">';
            docs.forEach(d => {
              relatedDocsHTML += \`
                <a class="doc-pill-link" onclick="openReaderModal('\${d.docId}')">
                  <span>\${d.icon}</span> <span>Companion Guide: \${d.filename}</span>
                </a>
              \`;
            });
            relatedDocsHTML += '</div>';
          }

          let codeHTML = '';
          if (q.codeExample) {
            codeHTML = \`
              <div class="code-container">
                <div class="code-header">
                  <span>Swift / Reference Snippet</span>
                  <button class="copy-btn" onclick="copyCodeTextFromBtn(this, '\${encodeURIComponent(q.codeExample)}')">Copy Code</button>
                </div>
                <pre><code class="language-swift">\${highlightSwift(q.codeExample)}</code></pre>
              </div>
            \`;
          }

          questionsHTML += \`
            <div class="question-card \${isReviewed ? 'reviewed' : ''}" id="card-\${q.id}">
              <div class="card-header">
                <div class="card-badges">
                  <span class="badge badge-id">\${q.id}</span>
                  <span class="badge badge-category">\${escapeHtml(q.category)}</span>
                  <span class="badge \${diffClass}">\${q.difficulty}</span>
                </div>
                <label class="card-check-wrap" onclick="event.stopPropagation()">
                  <input type="checkbox" \${isReviewed ? 'checked' : ''} onchange="toggleReviewed('\${q.id}', this.checked)">
                  <span>Reviewed</span>
                </label>
              </div>

              <h3 class="card-title" onclick="toggleDrawer('\${q.id}')" title="Click question title to expand or hide answer">
                <span>\${escapeHtml(q.question)}</span>
                <span class="toggle-chevron \${allAnswersExpanded ? 'rotated' : ''}" id="chev-\${q.id}">▼</span>
              </h3>

              \${relatedDocsHTML}
              \${pitchHTML}

              <div class="answer-drawer \${allAnswersExpanded ? 'open' : ''}" id="drawer-\${q.id}" onclick="event.stopPropagation()">
                <div class="answer-heading">In-Depth Breakdown</div>
                <div class="answer-text">\${escapeHtml(q.answer)}</div>
                \${codeHTML}
                <div class="drawer-footer">
                  <button class="drawer-collapse-btn" onclick="toggleDrawer('\${q.id}')" title="Collapse this answer">
                    ▲ Collapse Answer
                  </button>
                </div>
              </div>
            </div>
          \`;
        });

        catCard.innerHTML = \`
          <div class="category-header">
            <div class="category-title-left">
              <span class="category-icon">\${topic.icon}</span>
              <h2 class="category-title">\${escapeHtml(topic.title)}</h2>
              <span class="category-count-badge">\${filteredQuestions.length} Questions</span>
              <span class="category-guide-badge">\${topicDocs.length} Guides</span>
              <span class="category-progress-badge" id="cat-prog-\${topic.id}">\${pctInTopic}% Ready</span>
            </div>
            <div>
              <button class="category-toggle-btn \${isCollapsed ? 'collapsed' : ''}" id="btn-cat-\${topic.id}" onclick="toggleCategoryQuestions('\${topic.id}')">
                <span class="cat-toggle-icon">\${isCollapsed ? '▸' : '▾'}</span>
                <span class="cat-toggle-text">\${isCollapsed ? 'Expand Questions (' + filteredQuestions.length + ')' : 'Shrink Questions'}</span>
              </button>
            </div>
          </div>

          <p class="category-tagline">\${escapeHtml(topic.summary)}</p>

          \${guidesHTML}

          <div class="category-questions-wrap \${isCollapsed ? 'collapsed' : ''}" id="wrap-cat-\${topic.id}">
            \${questionsHTML}
          </div>
        \`;

        topicsContainer.appendChild(catCard);
      });

      if (emptyState) {
        if (totalMatchedQuestions === 0) {
          emptyState.style.display = 'block';
        } else {
          emptyState.style.display = 'none';
        }
      }

      updateProgress();
    };`;

script = script.replace(/window\.renderTopicsAndQuestions = function\(\) \{[\s\S]*?\n    \};\n\n    \/\/ Search and Tier Filter Listeners/, newRenderTopicsAndQuestions + '\n\n    // Search and Tier Filter Listeners');

// Validate script syntax with vm.Script
try {
  new vm.Script(script, { filename: 'dashboard.js' });
  console.log('VALIDATION PASSED: 100% valid JavaScript syntax!');
} catch (e) {
  console.error('VALIDATION FAILED in updated script:', e);
  process.exit(1);
}

const finalHtml = `${html.substring(0, scriptOpen)}<script>${script}</script>${html.substring(scriptClose + 9)}`;
fs.writeFileSync(INDEX_PATH, finalHtml, 'utf-8');
console.log('Successfully updated index.html with Section Focus and Index Dropdowns!');
