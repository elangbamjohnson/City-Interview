const fs = require('fs');
const vm = require('vm');

const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';
const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const GENERATED_DOCS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Helpers/generated_docs.json';

const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
const generatedDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));

// Topic categories with all 13 topics and 63 questions
const TOPIC_CATEGORIES = [
  {
    id: "architecture",
    title: "Architecture & Design Patterns",
    shortTitle: "Architecture",
    icon: "🏗️",
    color: "#6366f1",
    summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles.",
    docIds: ["clean-architecture", "coordinator-pattern", "dependency-injection", "mvvm", "repository-pattern", "solid-principles", "viper-pattern"],
    questionIds: ["Q-01", "Q-02", "Q-03", "Q-04", "Q-05"]
  },
  {
    id: "concurrency",
    title: "Swift Concurrency & Multithreading",
    shortTitle: "Swift Concurrency",
    icon: "⚡",
    color: "#f59e0b",
    summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions.",
    docIds: ["multithreading-gcd", "concurrency-issues", "thread-safety", "operation-queue"],
    questionIds: ["Q-06", "Q-07", "Q-08", "Q-09", "Q-10", "Q-11", "Q-12"]
  },
  {
    id: "core-advance-swift",
    title: "Core Swift & Language Internals",
    shortTitle: "Core & Advance Swift",
    icon: "🚀",
    color: "#ec4899",
    summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops.",
    docIds: ["ios-internals", "swiftui-state"],
    questionIds: ["Q-13", "Q-14", "Q-15", "Q-16", "Q-17", "Q-18"]
  },
  {
    id: "swift-basics-ui",
    title: "SwiftUI & UIKit Layout",
    shortTitle: "UI & Layout",
    icon: "🎨",
    color: "#8b5cf6",
    summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, and UIKit interoperability.",
    docIds: ["autolayout-basics", "composable-ui", "design-system", "swiftui-uikit-interop", "swiftui-state"],
    questionIds: ["Q-19", "Q-20", "Q-21", "Q-22", "Q-23", "Q-24"]
  },
  {
    id: "combine-reactive",
    title: "Combine & Reactive Streams",
    shortTitle: "Combine & Streams",
    icon: "🌊",
    color: "#0ea5e9",
    summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles.",
    docIds: [],
    questionIds: ["Q-25"]
  },
  {
    id: "networking",
    title: "Networking, APIs & Background Tasks",
    shortTitle: "Networking & APIs",
    icon: "🌐",
    color: "#10b981",
    summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler.",
    docIds: ["networking-architecture"],
    questionIds: ["Q-26", "Q-27", "Q-28"]
  },
  {
    id: "modularity-performance",
    title: "Modularity, Build & Launch Performance",
    shortTitle: "Modularity & Perf",
    icon: "📦",
    color: "#06b6d4",
    summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.",
    docIds: ["modular-architecture", "performance-profiling"],
    questionIds: ["Q-29", "Q-30", "Q-31", "Q-32", "Q-33"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#a855f7",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-34", "Q-35", "Q-36", "Q-37"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#f43f5e",
    summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "leadership-ownership"],
    questionIds: ["Q-38", "Q-39", "Q-40", "Q-41", "Q-42", "Q-43", "Q-44"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#e11d48",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-45", "Q-46"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#38bdf8",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-47", "Q-48", "Q-49", "Q-50", "Q-51", "Q-52", "Q-53", "Q-54"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#d97706",
    summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: [],
    questionIds: ["Q-55"]
  },
  {
    id: "memory-management",
    title: "Memory Management",
    shortTitle: "Memory Mgmt",
    icon: "🧠",
    color: "#14b8a6",
    summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit.",
    docIds: [],
    questionIds: ["Q-56", "Q-57", "Q-58", "Q-59", "Q-60", "Q-61", "Q-62", "Q-63"]
  }
];

// Read current HTML head up to `<script>`
const origHtml = fs.readFileSync(INDEX_PATH, 'utf-8');
const scriptTagIndex = origHtml.indexOf('<script>');
let htmlHead = origHtml.substring(0, scriptTagIndex);

// Update badges in HTML head
htmlHead = htmlHead.replace(/5[235] Questions · 24 Guides/g, '63 Questions · 24 Guides');
htmlHead = htmlHead.replace(/5[235] Curated Questions/g, '63 Curated Questions');

// Ensure Staff badge CSS exists
if (!htmlHead.includes('.badge-diff-staff')) {
  htmlHead = htmlHead.replace(
    '.badge-diff-advanced {',
    `.badge-diff-staff {
      background: rgba(20, 184, 166, 0.18);
      color: #2dd4bf;
      border: 1px solid rgba(20, 184, 166, 0.4);
    }

    .badge-diff-advanced {`
  );
}

// Update cmdTierPills and tierPills in htmlHead
const updatedCmdTierPills = `<div class="cmd-tier-pills" id="cmdTierPills">
        <button class="cmd-tier-pill active" data-diff="all" title="Show all questions">All (63)</button>
        <button class="cmd-tier-pill" data-diff="Staff" title="Filter Staff level questions">Staff (8)</button>
        <button class="cmd-tier-pill" data-diff="Advanced" title="Filter Advanced questions">Advanced (24)</button>
        <button class="cmd-tier-pill" data-diff="Intermediate" title="Filter Intermediate questions">Intermediate (27)</button>
        <button class="cmd-tier-pill" data-diff="Beginner" title="Filter Beginner questions">Beginner (4)</button>
      </div>`;

htmlHead = htmlHead.replace(/<div class="cmd-tier-pills" id="cmdTierPills">[\s\S]*?<\/div>/, updatedCmdTierPills);

const updatedFilterPills = `<div class="filter-pills" id="tierPills">
          <button class="filter-pill active" data-diff="all">All Difficulties (63)</button>
          <button class="filter-pill" data-diff="Staff">Staff (8)</button>
          <button class="filter-pill" data-diff="Advanced">Advanced (24)</button>
          <button class="filter-pill" data-diff="Intermediate">Intermediate (27)</button>
          <button class="filter-pill" data-diff="Beginner">Beginner (4)</button>
        </div>`;

htmlHead = htmlHead.replace(/<div class="filter-pills" id="tierPills">[\s\S]*?<\/div>/, updatedFilterPills);

// Swift highlighter source
const hlSwiftCode = fs.readFileSync('/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Helpers/highlightSwift.js', 'utf-8');

// Build script content cleanly
const scriptContent = `
    // Embedded Data
    const QUESTIONS = ${JSON.stringify(questions)};
    const MODULE_DOCS = ${JSON.stringify(generatedDocs.MODULE_DOCS)};
    const QUESTION_TO_DOCS = ${JSON.stringify(generatedDocs.QUESTION_TO_DOCS)};
    const TOPIC_CATEGORIES = ${JSON.stringify(TOPIC_CATEGORIES)};

    // Fast O(1) Question ID to Topic Category lookup for navigation
    const QUESTION_TO_TOPIC = {};
    TOPIC_CATEGORIES.forEach(topic => {
      topic.questionIds.forEach(qId => {
        QUESTION_TO_TOPIC[qId] = topic;
      });
    });
    // Fallback mapping so all questions have a guaranteed category
    QUESTIONS.forEach(q => {
      if (!QUESTION_TO_TOPIC[q.id]) {
        const found = TOPIC_CATEGORIES.find(t => t.title.toLowerCase() === (q.category || '').toLowerCase()) || TOPIC_CATEGORIES[0];
        QUESTION_TO_TOPIC[q.id] = found;
      }
    });

    // State
    let currentDifficulty = 'all';
    let searchQuery = '';
    let sidebarFilterQuery = '';
    let allAnswersExpanded = false;
    let allCategoriesShrunk = false;
    let categoryCollapsedState = {};
    let reviewedIDs = new Set(JSON.parse(localStorage.getItem('citi_reviewed_questions') || '[]'));
    let activeQuestionId = null;
    let activeDocPath = '';

    // DOM Elements
    const appLayout = document.getElementById('appLayout');
    const sidebarDrawer = document.getElementById('sidebarDrawer');
    const sidebarNav = document.getElementById('sidebarNav');
    const sidebarQuickSearch = document.getElementById('sidebarQuickSearch');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarToggleLabel = document.getElementById('sidebarToggleLabel');
    const floatingIndexBtn = document.getElementById('floatingIndexBtn');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    const topicsQuickStrip = document.getElementById('topicsQuickStrip');
    const topicsContainer = document.getElementById('topicsContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const tierPills = document.getElementById('tierPills');

    const emptyState = document.getElementById('emptyState');
    const reviewedCountEl = document.getElementById('reviewedCount');
    const totalCountEl = document.getElementById('totalCount');
    const percentValEl = document.getElementById('percentVal');
    const progressBarFill = document.getElementById('progressBarFill');
    const resetProgressBtn = document.getElementById('resetProgressBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    const readerModalBackdrop = document.getElementById('readerModalBackdrop');
    const modalDocIcon = document.getElementById('modalDocIcon');
    const modalDocTitle = document.getElementById('modalDocTitle');
    const modalDocContent = document.getElementById('modalDocContent');
    const modalCopyBtnText = document.getElementById('modalCopyBtnText');

    // Sidebar Toggle Logic
    const savedSidebarState = localStorage.getItem('citi_sidebar_visible');
    let isSidebarVisible = savedSidebarState !== null ? (savedSidebarState === 'true') : (window.innerWidth > 1024);

    window.setSidebarVisible = function(visible) {
      isSidebarVisible = visible;
      localStorage.setItem('citi_sidebar_visible', visible);
      updateSidebarVisibilityUI();
    };

    function updateSidebarVisibilityUI() {
      if (window.innerWidth <= 1024) {
        if (isSidebarVisible) {
          sidebarDrawer.classList.add('mobile-open');
          sidebarBackdrop.classList.add('open');
        } else {
          sidebarDrawer.classList.remove('mobile-open');
          sidebarBackdrop.classList.remove('open');
        }
      } else {
        if (isSidebarVisible) {
          appLayout.classList.remove('sidebar-collapsed');
        } else {
          appLayout.classList.add('sidebar-collapsed');
        }
      }

      const labelText = isSidebarVisible ? 'Hide Index' : 'Show Index';
      if (sidebarToggleLabel) sidebarToggleLabel.textContent = labelText;
      const cmdSidebarLabel = document.getElementById('cmdSidebarLabel');
      if (cmdSidebarLabel) cmdSidebarLabel.textContent = labelText;
    }

    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', () => {
        window.setSidebarVisible(!isSidebarVisible);
      });
    }

    if (floatingIndexBtn) {
      floatingIndexBtn.addEventListener('click', () => {
        window.setSidebarVisible(!isSidebarVisible);
      });
    }

    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', () => {
        window.setSidebarVisible(false);
      });
    }

    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', () => {
        window.setSidebarVisible(false);
      });
    }

    window.addEventListener('resize', () => {
      updateSidebarVisibilityUI();
    });

    updateSidebarVisibilityUI();

    // Theme Management
    const savedTheme = localStorage.getItem('citi_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('citi_theme', next);
        updateThemeUI(next);
      });
    }

    function updateThemeUI(theme) {
      const isLight = theme === 'light';
      if (themeIcon) themeIcon.textContent = isLight ? '☀️' : '🌙';
      if (themeLabel) themeLabel.textContent = isLight ? 'Light' : 'Dark';
      const cmdThemeIcon = document.getElementById('cmdThemeIcon');
      const cmdThemeLabel = document.getElementById('cmdThemeLabel');
      if (cmdThemeIcon) cmdThemeIcon.textContent = isLight ? '☀️' : '🌙';
      if (cmdThemeLabel) cmdThemeLabel.textContent = isLight ? 'Light' : 'Dark';
    }

    // ==========================================
    // Swift Syntax Highlighter (Xcode accurate tokenization)
    // ==========================================
${hlSwiftCode}

    // HTML Escape Helper
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Toggle Drawer for Answer
    window.toggleDrawer = function(id) {
      const drawer = document.getElementById(\`drawer-\${id}\`);
      const chev = document.getElementById(\`chev-\${id}\`);
      if (drawer) {
        const isOpen = drawer.classList.toggle('open');
        if (chev) {
          chev.classList.toggle('rotated', isOpen);
        }
      }
    };

    // Handle Card Click (avoids toggling when user clicks buttons, links, inputs, or code)
    window.handleCardClick = function(e, id) {
      if (e.target.closest('button, input, a, pre, code, .copy-btn, .mini-guide-card, .doc-pill-link, .card-check-wrap')) {
        return;
      }
      window.toggleDrawer(id);
    };

    // Toggle individual category questions
    window.toggleCategoryQuestions = function(topicId) {
      const wrap = document.getElementById(\`wrap-cat-\${topicId}\`);
      const btn = document.getElementById(\`btn-cat-\${topicId}\`);
      if (!wrap) return;

      const isCollapsed = wrap.classList.toggle('collapsed');
      categoryCollapsedState[topicId] = isCollapsed;
      if (btn) {
        btn.classList.toggle('collapsed', isCollapsed);
        const icon = btn.querySelector('.cat-toggle-icon');
        const text = btn.querySelector('.cat-toggle-text');
        if (icon) icon.textContent = isCollapsed ? '▸' : '▾';
        if (text) text.textContent = isCollapsed ? 'Expand Questions' : 'Shrink Questions';
      }
    };

    // Toggle All Categories
    window.toggleAllCategories = function() {
      allCategoriesShrunk = !allCategoriesShrunk;
      TOPIC_CATEGORIES.forEach(t => {
        categoryCollapsedState[t.id] = allCategoriesShrunk;
        const wrap = document.getElementById(\`wrap-cat-\${t.id}\`);
        const btn = document.getElementById(\`btn-cat-\${t.id}\`);
        if (wrap) wrap.classList.toggle('collapsed', allCategoriesShrunk);
        if (btn) {
          btn.classList.toggle('collapsed', allCategoriesShrunk);
          const icon = btn.querySelector('.cat-toggle-icon');
          const text = btn.querySelector('.cat-toggle-text');
          if (icon) icon.textContent = allCategoriesShrunk ? '▸' : '▾';
          if (text) text.textContent = allCategoriesShrunk ? 'Expand Questions' : 'Shrink Questions';
        }
      });
      const cmdCollapseLabel = document.getElementById('cmdCollapseLabel');
      if (cmdCollapseLabel) {
        cmdCollapseLabel.textContent = allCategoriesShrunk ? 'Expand All' : 'Shrink All';
      }
    };

    // Toggle All Answers
    window.toggleAllAnswers = function() {
      allAnswersExpanded = !allAnswersExpanded;
      document.querySelectorAll('.answer-drawer').forEach(drawer => {
        drawer.classList.toggle('open', allAnswersExpanded);
      });
      document.querySelectorAll('.toggle-chevron').forEach(chev => {
        chev.classList.toggle('rotated', allAnswersExpanded);
      });
      const cmdExpandLabel = document.getElementById('cmdExpandLabel');
      if (cmdExpandLabel) {
        cmdExpandLabel.textContent = allAnswersExpanded ? 'Collapse Answers' : 'Expand Answers';
      }
    };

    // Review Checkbox State
    window.toggleReviewed = function(id, isChecked) {
      if (isChecked) {
        reviewedIDs.add(id);
      } else {
        reviewedIDs.delete(id);
      }
      localStorage.setItem('citi_reviewed_questions', JSON.stringify(Array.from(reviewedIDs)));
      updateProgress();

      document.querySelectorAll(\`#card-\${id}\`).forEach(card => {
        card.classList.toggle('reviewed', isChecked);
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = isChecked;
      });

      const sideItem = document.getElementById(\`side-item-\${id}\`);
      if (sideItem) {
        sideItem.classList.toggle('reviewed', isChecked);
        const checkIcon = sideItem.querySelector('.sidebar-check');
        if (checkIcon) checkIcon.textContent = isChecked ? '✓' : '○';
      }

      TOPIC_CATEGORIES.forEach(t => {
        const progEl = document.getElementById(\`cat-prog-\${t.id}\`);
        if (progEl) {
          const tQs = QUESTIONS.filter(q => t.questionIds.includes(q.id));
          const revCount = tQs.filter(q => reviewedIDs.has(q.id)).length;
          const pct = tQs.length ? Math.round((revCount / tQs.length) * 100) : 0;
          progEl.textContent = \`\${pct}% Ready\`;
        }
      });
    };

    // Update Progress Bar
    function updateProgress() {
      const total = QUESTIONS.length;
      const count = reviewedIDs.size;
      const pct = total ? Math.round((count / total) * 100) : 0;

      if (reviewedCountEl) reviewedCountEl.textContent = count;
      if (totalCountEl) totalCountEl.textContent = total;
      if (percentValEl) percentValEl.textContent = \`\${pct}%\`;
      if (progressBarFill) progressBarFill.style.width = \`\${pct}%\`;
    }

    if (resetProgressBtn) {
      resetProgressBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all review checkmarks?')) {
          reviewedIDs.clear();
          localStorage.removeItem('citi_reviewed_questions');
          window.renderTopicsAndQuestions();
        }
      });
    }

    // Reader Modal Logic
    window.openReaderModal = function(docId) {
      const doc = MODULE_DOCS.find(d => d.id === docId);
      if (!doc) return;

      activeDocPath = doc.filePath;
      modalDocIcon.textContent = doc.icon;
      modalDocTitle.textContent = doc.title;
      modalDocContent.innerHTML = doc.htmlContent;
      modalCopyBtnText.textContent = 'Copy Path';
      readerModalBackdrop.classList.add('open');
      modalDocContent.scrollTop = 0;
    };

    window.closeReaderModal = function(event) {
      if (event.target === readerModalBackdrop) {
        readerModalBackdrop.classList.remove('open');
      }
    };

    window.closeReaderModalDirect = function() {
      if (readerModalBackdrop) {
        readerModalBackdrop.classList.remove('open');
      }
    };

    window.copyModalFilePath = function() {
      if (!activeDocPath) return;
      navigator.clipboard.writeText(activeDocPath).then(() => {
        modalCopyBtnText.textContent = 'Copied!';
        setTimeout(() => {
          modalCopyBtnText.textContent = 'Copy Path';
        }, 1800);
      });
    };

    window.copyCodeTextFromBtn = function(btn, encodedCode) {
      const code = decodeURIComponent(encodedCode);
      navigator.clipboard.writeText(code).then(() => {
        const origText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = origText;
          btn.classList.remove('copied');
        }, 1800);
      });
    };

    // Jump to Topic
    window.jumpToTopic = function(topicId) {
      if (searchQuery) {
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        const cmdSearchInput = document.getElementById('cmdSearchInput');
        const cmdSearchClear = document.getElementById('cmdSearchClear');
        if (cmdSearchInput) cmdSearchInput.value = '';
        if (cmdSearchClear) cmdSearchClear.style.display = 'none';
        window.renderTopicsAndQuestions();
      }

      const el = document.getElementById(\`cat-\${topicId}\`);
      if (el) {
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

      const qObj = QUESTIONS.find(q => q.id === id);
      let needsRerender = false;

      if (currentDifficulty !== 'all' && qObj && qObj.difficulty !== currentDifficulty) {
        currentDifficulty = 'all';
        document.querySelectorAll('.filter-pill, .cmd-tier-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.diff === 'all');
        });
        needsRerender = true;
      }

      if (searchQuery) {
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        const cmdSearchInput = document.getElementById('cmdSearchInput');
        const cmdSearchClear = document.getElementById('cmdSearchClear');
        if (cmdSearchInput) cmdSearchInput.value = '';
        if (cmdSearchClear) cmdSearchClear.style.display = 'none';
        needsRerender = true;
      }

      if (needsRerender) {
        window.renderTopicsAndQuestions();
      }

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

      if (window.innerWidth <= 1024) {
        window.setSidebarVisible(false);
      }

      document.querySelectorAll('.sidebar-item.active').forEach(el => el.classList.remove('active'));
      const sideItem = document.getElementById(\`side-item-\${id}\`);
      if (sideItem) {
        sideItem.classList.add('active');
        sideItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
      }, 70);
    };

    // Render Sidebar Topics & Questions
    function renderSidebar() {
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

        const group = document.createElement('div');
        group.className = 'sidebar-topic-group';

        const header = document.createElement('div');
        header.className = 'sidebar-topic-header';
        header.onclick = () => window.jumpToTopic(topic.id);
        header.innerHTML = \`
          <span style="display: flex; align-items: center; gap: 0.4rem; min-width: 0;">
            <span>\${topic.icon}</span>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${escapeHtml(topic.shortTitle)}</span>
          </span>
          <span class="sidebar-id-badge">\${reviewedInTopic}/\${topicQs.length}</span>
        \`;
        group.appendChild(header);

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
          group.appendChild(a);
        });

        sidebarNav.appendChild(group);
      });
    }

    if (sidebarQuickSearch) {
      sidebarQuickSearch.addEventListener('input', (e) => {
        sidebarFilterQuery = e.target.value.trim();
        renderSidebar();
      });
    }

    // ==========================================
    // RENDER ALL QUESTIONS GROUPED BY TOPIC
    // ==========================================
    window.renderTopicsAndQuestions = function() {
      if (!topicsContainer) return;
      topicsContainer.innerHTML = '';
      if (topicsQuickStrip) topicsQuickStrip.innerHTML = '';

      // 1. Build Topics Quick Strip
      TOPIC_CATEGORIES.forEach(topic => {
        if (!topicsQuickStrip) return;
        const pill = document.createElement('a');
        pill.className = 'topic-strip-pill';
        pill.href = \`#cat-\${topic.id}\`;
        pill.onclick = (e) => {
          e.preventDefault();
          window.jumpToTopic(topic.id);
        };
        pill.innerHTML = \`<span>\${topic.icon}</span> <span>\${escapeHtml(topic.shortTitle)}</span>\`;
        topicsQuickStrip.appendChild(pill);
      });

      // 2. Filter Questions by Search and Difficulty
      const query = searchQuery.toLowerCase();
      let totalMatchedQuestions = 0;

      TOPIC_CATEGORIES.forEach(topic => {
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
            <div class="question-card \${isReviewed ? 'reviewed' : ''}" id="card-\${q.id}" onclick="handleCardClick(event, '\${q.id}')">
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

              <h3 class="card-title">
                <span>\${escapeHtml(q.question)}</span>
                <span class="toggle-chevron \${allAnswersExpanded ? 'rotated' : ''}" id="chev-\${q.id}">▼</span>
              </h3>

              \${relatedDocsHTML}
              \${pitchHTML}

              <div class="answer-drawer \${allAnswersExpanded ? 'open' : ''}" id="drawer-\${q.id}">
                <div class="answer-heading">In-Depth Breakdown</div>
                <div class="answer-text">\${escapeHtml(q.answer)}</div>
                \${codeHTML}
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
      renderSidebar();
      setTimeout(initSectionObserver, 80);
    };

    // Search and Tier Filter Listeners
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        if (clearSearchBtn) clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        const cmdSearchInput = document.getElementById('cmdSearchInput');
        const cmdSearchClear = document.getElementById('cmdSearchClear');
        if (cmdSearchInput) cmdSearchInput.value = searchQuery;
        if (cmdSearchClear) cmdSearchClear.style.display = searchQuery ? 'block' : 'none';
        window.renderTopicsAndQuestions();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        const cmdSearchInput = document.getElementById('cmdSearchInput');
        const cmdSearchClear = document.getElementById('cmdSearchClear');
        if (cmdSearchInput) cmdSearchInput.value = '';
        if (cmdSearchClear) cmdSearchClear.style.display = 'none';
        searchInput.focus();
        window.renderTopicsAndQuestions();
      });
    }

    if (tierPills) {
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
    }

    // Command Bar Controls
    const cmdSearchInput = document.getElementById('cmdSearchInput');
    const cmdSearchClear = document.getElementById('cmdSearchClear');
    const cmdTierPills = document.getElementById('cmdTierPills');
    const cmdSidebarBtn = document.getElementById('cmdSidebarBtn');
    const cmdThemeBtn = document.getElementById('cmdThemeBtn');
    const cmdResetBtn = document.getElementById('cmdResetProgressBtn');
    const backToTopBtn = document.getElementById('backToTopBtn');
    const scrollBar = document.getElementById('scrollProgressBar');
    const activePill = document.getElementById('activeSectionPill');

    if (cmdSearchInput) {
      cmdSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        if (cmdSearchClear) cmdSearchClear.style.display = searchQuery ? 'block' : 'none';
        if (searchInput) searchInput.value = searchQuery;
        if (clearSearchBtn) clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        window.renderTopicsAndQuestions();
      });
    }

    if (cmdSearchClear) {
      cmdSearchClear.addEventListener('click', () => {
        cmdSearchInput.value = '';
        searchQuery = '';
        cmdSearchClear.style.display = 'none';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        cmdSearchInput.focus();
        window.renderTopicsAndQuestions();
      });
    }

    if (cmdTierPills) {
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
    }

    if (cmdSidebarBtn) {
      cmdSidebarBtn.addEventListener('click', () => {
        window.setSidebarVisible(!isSidebarVisible);
      });
    }

    if (cmdThemeBtn && themeToggleBtn) {
      cmdThemeBtn.addEventListener('click', () => {
        themeToggleBtn.click();
      });
    }

    if (cmdResetBtn) {
      cmdResetBtn.addEventListener('click', () => {
        if (confirm('Reset all review checkmarks?')) {
          reviewedIDs.clear();
          localStorage.removeItem('citi_reviewed_questions');
          window.renderTopicsAndQuestions();
        }
      });
    }

    // Scroll Progress Bar
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          if (scrollBar) scrollBar.style.width = progress + '%';

          if (backToTopBtn) {
            if (scrollTop > 400) {
              backToTopBtn.classList.add('visible');
            } else {
              backToTopBtn.classList.remove('visible');
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // IntersectionObserver: Active Section Tracking
    let sectionObserver;
    function initSectionObserver() {
      if (sectionObserver) sectionObserver.disconnect();

      const sections = document.querySelectorAll('.topic-category-card[id]');
      if (!sections.length) return;

      const activeSections = new Set();

      sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            activeSections.add(entry.target.id);
          } else {
            activeSections.delete(entry.target.id);
          }
        });

        let topMost = null;
        let topMostY = Infinity;
        activeSections.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top < topMostY) {
              topMostY = rect.top;
              topMost = id;
            }
          }
        });

        if (!topMost) return;

        document.querySelectorAll('.sidebar-item.in-view').forEach(el =>
          el.classList.remove('in-view')
        );

        const topicId = topMost.replace('cat-', '');
        const topicObj = TOPIC_CATEGORIES.find(t => t.id === topicId);
        if (topicObj) {
          topicObj.questionIds.forEach(qId => {
            const sideItem = document.getElementById('side-item-' + qId);
            if (sideItem) sideItem.classList.add('in-view');
          });

          if (activePill) {
            activePill.textContent = topicObj.icon + ' ' + topicObj.shortTitle;
            activePill.classList.add('visible');
          }
        }
      }, {
        rootMargin: '-10% 0px -60% 0px',
        threshold: 0
      });

      sections.forEach(s => sectionObserver.observe(s));
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      const tag = (document.activeElement || {}).tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === '/' && !inInput) {
        e.preventDefault();
        const inp = cmdSearchInput || searchInput;
        if (inp) {
          inp.focus();
          inp.select();
        }
        return;
      }

      if (e.key === 'Escape') {
        const inp = cmdSearchInput || searchInput;
        if (document.activeElement === inp && searchQuery) {
          if (inp) inp.value = '';
          searchQuery = '';
          if (cmdSearchClear) cmdSearchClear.style.display = 'none';
          if (clearSearchBtn) clearSearchBtn.style.display = 'none';
          window.renderTopicsAndQuestions();
          return;
        }
        const modal = document.getElementById('readerModalBackdrop');
        if (modal && modal.classList.contains('open')) {
          window.closeReaderModalDirect();
          return;
        }
        if (inp && document.activeElement === inp) {
          inp.blur();
        }
        return;
      }

      if (inInput) return;

      if (e.key === 'm' || e.key === 'M') {
        window.setSidebarVisible(!isSidebarVisible);
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        window.toggleAllCategories();
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        window.toggleAllAnswers();
        return;
      }

      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const topic = TOPIC_CATEGORIES[num - 1];
        if (topic) {
          window.jumpToTopic(topic.id);
        }
        return;
      }
    });

    if (cmdSearchInput && window.innerWidth > 768) {
      cmdSearchInput.placeholder = 'Search questions, code, pitches… (/ to focus · Esc to clear · 1-9 jump topics)';
    }

    // One-time shortcut hint toast
    if (!localStorage.getItem('citi_shortcuts_seen')) {
      const toast = document.createElement('div');
      toast.style.cssText = \`
        position: fixed; bottom: 5rem; left: 50%; transform: translateX(-50%);
        background: rgba(15,20,35,0.96); border: 1px solid rgba(99,102,241,0.4);
        border-radius: 12px; padding: 0.85rem 1.25rem;
        color: #e2e8f0; font-size: 0.82rem; z-index: 2000;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        display: flex; gap: 1rem; align-items: center;
        animation: fadeIn 0.4s ease; white-space: nowrap;
      \`;
      toast.innerHTML = \`
        <span>⌨️ <strong>Keyboard shortcuts:</strong></span>
        <span><kbd style="background:rgba(255,255,255,0.12);border-radius:3px;padding:1px 5px">/</kbd> Search</span>
        <span><kbd style="background:rgba(255,255,255,0.12);border-radius:3px;padding:1px 5px">M</kbd> Sidebar</span>
        <span><kbd style="background:rgba(255,255,255,0.12);border-radius:3px;padding:1px 5px">1–9</kbd> Topics</span>
        <span><kbd style="background:rgba(255,255,255,0.12);border-radius:3px;padding:1px 5px">E</kbd> Answers</span>
        <span><kbd style="background:rgba(255,255,255,0.12);border-radius:3px;padding:1px 5px">Esc</kbd> Clear</span>
        <button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:1rem;padding:0;margin-left:0.5rem">✕</button>
      \`;
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 5000);
      localStorage.setItem('citi_shortcuts_seen', '1');
    }

    // INITIAL EXECUTION ON PAGE LOAD
    renderSidebar();
    window.renderTopicsAndQuestions();
    updateProgress();
    initSectionObserver();
`;

// Assemble full HTML
const fullCleanHtml = `${htmlHead}<script>${scriptContent}  </script>
</body>
</html>`;

// Validate entire script with VM
try {
  new vm.Script(scriptContent, { filename: 'dashboard-bundle.js' });
  console.log('VALIDATION PASSED: 100% Valid JavaScript Syntax! No errors!');
} catch (e) {
  console.error('VALIDATION FAILED:', e);
  process.exit(1);
}

// Write to index.html
fs.writeFileSync(INDEX_PATH, fullCleanHtml, 'utf-8');
console.log(`Successfully generated pristine ${INDEX_PATH}!`);
console.log(`Total lines: ${fullCleanHtml.split('\n').length}, bytes: ${fullCleanHtml.length}`);
