const fs = require('fs');
const vm = require('vm');

const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

let html = fs.readFileSync(INDEX_PATH, 'utf-8');

// 1. Update Google Fonts to import Newsreader and Lora serif fonts
const oldFontLink = /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Inter[\s\S]*?display=swap" rel="stylesheet">/;
const newFontLink = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">`;

html = html.replace(oldFontLink, newFontLink);
console.log('Updated Google Fonts link!');

// 2. Extract <style> block and update CSS
const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');

if (styleStart === -1 || styleEnd === -1) {
  console.error('Could not find <style> tag!');
  process.exit(1);
}

let css = html.substring(styleStart + 7, styleEnd);

// Replace :root and [data-theme="light"] definitions with Claude.ai Warm Aesthetic
const oldRootRegex = /:root\s*\{[\s\S]*?\}\s*\[data-theme="light"\]\s*\{[\s\S]*?\}/;
const newRootCSS = `:root {
      /* ─── Claude.ai Dark Theme (Warm Obsidian & Espresso Charcoal) ─── */
      --bg-primary: #1F1E1D;
      --bg-secondary: #181716;
      --bg-card: #262523;
      --bg-card-hover: #2C2A28;
      --bg-code: #141312;
      --border-color: #383531;
      --border-accent: rgba(217, 119, 87, 0.45);
      --text-primary: #ECE9E2;
      --text-secondary: #B4AEA4;
      --text-muted: #79746C;
      --accent-claude: #D97757;
      --accent-claude-hover: #C15F3D;
      --accent-claude-light: #E07A5F;
      --accent-claude-subtle: rgba(217, 119, 87, 0.12);
      --accent-indigo: #D97757;
      --accent-indigo-light: #E07A5F;
      --accent-cyan: #5B8CA3;
      --accent-emerald: #5A7D65;
      --accent-amber: #D49544;
      --accent-rose: #C15F3D;
      --accent-purple: #8E5B70;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.35);
      --shadow-md: 0 6px 16px rgba(0, 0, 0, 0.45);
      --shadow-lg: 0 12px 32px -8px rgba(0, 0, 0, 0.6);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --sidebar-width: 320px;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-serif: 'Newsreader', 'Lora', Georgia, 'Times New Roman', serif;
      --font-mono: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    [data-theme="light"] {
      /* ─── Claude.ai Light Theme (Warm Creamy Parchment & Linen) ─── */
      --bg-primary: #FAF9F5;
      --bg-secondary: #F4F1EA;
      --bg-card: #FFFFFF;
      --bg-card-hover: #FAF7F2;
      --bg-code: #F0EDE5;
      --border-color: #E5E0D8;
      --border-accent: rgba(217, 119, 87, 0.45);
      --text-primary: #24221E;
      --text-secondary: #6B665E;
      --text-muted: #9E988F;
      --accent-claude: #D97757;
      --accent-claude-hover: #C15F3D;
      --accent-claude-light: #E07A5F;
      --accent-claude-subtle: rgba(217, 119, 87, 0.08);
      --accent-indigo: #D97757;
      --accent-indigo-light: #C15F3D;
      --accent-cyan: #3B728C;
      --accent-emerald: #4E7A58;
      --accent-amber: #C78532;
      --accent-rose: #B84A39;
      --accent-purple: #7C455C;
      --shadow-sm: 0 2px 8px rgba(36, 34, 30, 0.04);
      --shadow-md: 0 6px 16px rgba(36, 34, 30, 0.06);
      --shadow-lg: 0 12px 28px -8px rgba(36, 34, 30, 0.1);
    }`;

css = css.replace(oldRootRegex, newRootCSS);

// Update body background gradient for Claude's warm aura
css = css.replace(
  /radial-gradient\(circle at 50% 0%, rgba\(99, 102, 241, 0\.04\) 0%, transparent 40%\),\s*radial-gradient\(circle at 100% 100%, rgba\(6, 182, 212, 0\.03\) 0%, transparent 40%\);/,
  `radial-gradient(circle at 50% 0%, rgba(217, 119, 87, 0.05) 0%, transparent 45%),
        radial-gradient(circle at 100% 100%, rgba(212, 149, 68, 0.03) 0%, transparent 45%);`
);

// Update scroll progress bar
css = css.replace(
  /background: linear-gradient\(90deg, var\(--accent-indigo\) 0%, var\(--accent-cyan\) 50%, var\(--accent-emerald\) 100%\);/,
  `background: linear-gradient(90deg, var(--accent-claude) 0%, var(--accent-amber) 50%, var(--accent-emerald) 100%);`
);

// Update sticky command bar background
css = css.replace(
  /background: rgba\(0, 0, 0, 0\.85\);/,
  `background: rgba(24, 23, 22, 0.88);`
);
css = css.replace(
  /\[data-theme="light"\] \.cmd-bar \{\s*background: rgba\(248, 250, 252, 0\.88\);/,
  `[data-theme="light"] .cmd-bar {\n      background: rgba(244, 241, 234, 0.92);`
);

// Update brand typography & gradient
css = css.replace(
  /\.cmd-bar-brand h1 \{\s*font-size: 1rem;\s*font-weight: 800;[\s\S]*?white-space: nowrap;\s*\}/,
  `.cmd-bar-brand h1 {
      font-family: var(--font-serif);
      font-size: 1.15rem;
      font-weight: 600;
      letter-spacing: -0.015em;
      background: linear-gradient(135deg, #ECE9E2 0%, var(--accent-claude-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    }`
);
css = css.replace(
  /\[data-theme="light"\] \.cmd-bar-brand h1 \{\s*background: linear-gradient\(135deg, #0f172a 0%, var\(--accent-indigo\) 100%\);/,
  `[data-theme="light"] .cmd-bar-brand h1 {\n      background: linear-gradient(135deg, #24221E 0%, var(--accent-claude) 100%);`
);

// Update brand tag
css = css.replace(
  /\.cmd-bar-brand \.brand-tag \{[\s\S]*?white-space: nowrap;\s*\}/,
  `.cmd-bar-brand .brand-tag {
      font-size: 0.72rem;
      font-weight: 600;
      background: rgba(217, 119, 87, 0.14);
      color: var(--accent-claude-light);
      border: 1px solid rgba(217, 119, 87, 0.32);
      padding: 0.16rem 0.55rem;
      border-radius: 999px;
      white-space: nowrap;
    }`
);

// Update search inputs
css = css.replace(
  /\.cmd-search-input \{\s*width: 100%;[\s\S]*?font-family: var\(--font-sans\);\s*\}/,
  `.cmd-search-input {
      width: 100%;
      padding: 0.42rem 2rem 0.42rem 2.1rem;
      background: var(--bg-code);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.84rem;
      outline: none;
      transition: all 0.2s ease;
      font-family: var(--font-sans);
    }`
);
css = css.replace(
  /\.cmd-search-input:focus \{\s*border-color: var\(--accent-indigo\);\s*box-shadow: 0 0 0 2px rgba\(99, 102, 241, 0\.25\);\s*background: #000000;\s*\}/,
  `.cmd-search-input:focus {
      border-color: var(--accent-claude);
      box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.22);
      background: var(--bg-card);
    }`
);
css = css.replace(
  /\[data-theme="light"\] \.cmd-search-input \{\s*background: rgba\(0, 0, 0, 0\.05\);\s*\}/,
  `[data-theme="light"] .cmd-search-input {
      background: var(--bg-code);
    }`
);

// Update active pills (tier pills & filter pills)
css = css.replace(
  /\.cmd-tier-pill\.active \{\s*background: var\(--accent-indigo\);\s*color: #fff;\s*border-color: var\(--accent-indigo\);\s*box-shadow: 0 2px 8px rgba\(99, 102, 241, 0\.4\);\s*\}/,
  `.cmd-tier-pill.active {
      background: var(--accent-claude);
      color: #fff;
      border-color: var(--accent-claude);
      box-shadow: 0 2px 8px rgba(217, 119, 87, 0.35);
    }`
);
css = css.replace(
  /\.cmd-btn-primary \{\s*background: var\(--accent-indigo\);\s*border-color: var\(--accent-indigo\);\s*color: #fff;\s*\}/,
  `.cmd-btn-primary {
      background: var(--accent-claude);
      border-color: var(--accent-claude);
      color: #fff;
    }`
);
css = css.replace(
  /\.cmd-btn-primary:hover \{\s*background: var\(--accent-indigo-light\);\s*border-color: var\(--accent-indigo-light\);\s*transform: translateY\(-1px\);\s*\}/,
  `.cmd-btn-primary:hover {
      background: var(--accent-claude-hover);
      border-color: var(--accent-claude-hover);
      transform: translateY(-1px);
    }`
);

// Update sidebar search input
css = css.replace(
  /\.sidebar-search-input \{\s*width: 100%;\s*padding: 0\.45rem 0\.75rem;\s*background: #000000;/,
  `.sidebar-search-input {\n      width: 100%;\n      padding: 0.45rem 0.75rem;\n      background: var(--bg-code);`
);
css = css.replace(
  /\[data-theme="light"\] \.sidebar-search-input \{\s*background: #f1f5f9;\s*\}/,
  `[data-theme="light"] .sidebar-search-input {\n      background: var(--bg-code);\n    }`
);

// Update category title & question card title to Serif
css = css.replace(
  /\.category-title \{\s*font-size: 1\.35rem;\s*font-weight: 800;\s*color: var\(--text-primary\);\s*letter-spacing: -0\.02em;\s*\}/,
  `.category-title {
      font-family: var(--font-serif);
      font-size: 1.45rem;
      font-weight: 600;
      color: var(--text-primary);
      letter-spacing: -0.015em;
    }`
);
css = css.replace(
  /\.card-title \{\s*font-size: 1\.15rem;\s*font-weight: 700;\s*color: var\(--text-primary\);\s*margin-bottom: 0\.75rem;/,
  `.card-title {
      font-family: var(--font-serif);
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-primary);
      letter-spacing: -0.01em;
      margin-bottom: 0.75rem;`
);

// Update pitch box to Claude editorial quote style
css = css.replace(
  /\.pitch-box \{\s*background: linear-gradient\(135deg, rgba\(99, 102, 241, 0\.1\) 0%, rgba\(6, 182, 212, 0\.06\) 100%\);\s*border: 1px solid rgba\(99, 102, 241, 0\.25\);\s*border-left: 3px solid var\(--accent-indigo\);\s*border-radius: var\(--radius-sm\);\s*padding: 0\.85rem 1rem;\s*margin-bottom: 0\.85rem;\s*\}/,
  `.pitch-box {
      background: rgba(217, 119, 87, 0.08);
      border: 1px solid rgba(217, 119, 87, 0.22);
      border-left: 3.5px solid var(--accent-claude);
      border-radius: var(--radius-sm);
      padding: 0.9rem 1.15rem;
      margin-bottom: 0.85rem;
    }`
);
css = css.replace(
  /\.pitch-text \{\s*font-size: 0\.92rem;\s*font-style: italic;\s*color: var\(--text-primary\);\s*line-height: 1\.5;\s*\}/,
  `.pitch-text {
      font-size: 0.98rem;
      font-family: var(--font-serif);
      font-style: italic;
      color: var(--text-primary);
      line-height: 1.62;
    }`
);
css = css.replace(
  /\.pitch-label \{\s*font-size: 0\.72rem;\s*font-weight: 700;\s*text-transform: uppercase;\s*letter-spacing: 0\.05em;\s*color: var\(--accent-indigo-light\);/,
  `.pitch-label {\n      font-size: 0.72rem;\n      font-weight: 700;\n      text-transform: uppercase;\n      letter-spacing: 0.05em;\n      color: var(--accent-claude-light);`
);

// Update collapse button in answer drawer
css = css.replace(
  /\.drawer-collapse-btn:hover \{\s*background: rgba\(99, 102, 241, 0\.15\);\s*border-color: var\(--accent-indigo\);\s*color: #ffffff;\s*transform: translateY\(-1px\);\s*\}/,
  `.drawer-collapse-btn:hover {
      background: var(--accent-claude);
      border-color: var(--accent-claude);
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(217, 119, 87, 0.35);
    }`
);
css = css.replace(
  /\[data-theme="light"\] \.drawer-collapse-btn:hover \{\s*background: rgba\(99, 102, 241, 0\.1\);\s*color: var\(--accent-indigo\);\s*\}/,
  `[data-theme="light"] .drawer-collapse-btn:hover {
      background: var(--accent-claude);
      color: #ffffff;
      border-color: var(--accent-claude);
    }`
);

// Update back-to-top FAB to Claude Terracotta
css = css.replace(
  /\.back-to-top-btn \{\s*position: fixed;[\s\S]*?box-shadow: 0 8px 24px rgba\(99, 102, 241, 0\.45\);/,
  `.back-to-top-btn {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--accent-claude) 0%, var(--accent-claude-hover) 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      font-size: 1.1rem;
      box-shadow: 0 8px 24px rgba(217, 119, 87, 0.45);`
);
css = css.replace(
  /\.back-to-top-btn:hover \{\s*transform: translateY\(-3px\) scale\(1\.08\);\s*box-shadow: 0 14px 30px rgba\(99, 102, 241, 0\.65\);\s*\}/,
  `.back-to-top-btn:hover {
      transform: translateY(-3px) scale(1.08);
      box-shadow: 0 14px 30px rgba(217, 119, 87, 0.65);
    }`
);

// Update code block syntax highlighting to Claude warm palette
const oldDarkSyntaxRegex = /\/\* Swift Syntax Highlighting — Xcode Theme \(Dark Mode\) \*\/[\s\S]*?\/\* Swift Syntax Highlighting — Xcode Theme \(Light Mode\) \*\//;
const newDarkSyntaxCSS = `/* Swift Syntax Highlighting — Claude Warm Dark Theme */
    .tok-comment {
      color: #8A847C;
      font-style: italic;
    }
    .tok-mark {
      color: #B4AEA4;
      font-weight: 600;
      font-style: normal;
    }
    .tok-string {
      color: #D49544; /* Warm honey amber */
    }
    .tok-attr {
      color: #D97757; /* Claude terracotta */
      font-weight: 600;
    }
    .tok-macro {
      color: #D97757;
      font-weight: 600;
    }
    .tok-kw {
      color: #E07A5F; /* Warm terracotta orange */
      font-weight: 600;
    }
    .tok-type {
      color: #7BA7C2; /* Warm muted slate blue */
      font-weight: 500;
    }
    .tok-func {
      color: #C788A8; /* Warm dusty orchid / plum */
    }
    .tok-number {
      color: #DE935F; /* Warm copper */
    }
    .tok-literal {
      color: #E07A5F;
      font-weight: 600;
    }

    /* Swift Syntax Highlighting — Claude Warm Light Theme */`;

css = css.replace(oldDarkSyntaxRegex, newDarkSyntaxCSS);

// Update light mode syntax highlighting
const oldLightSyntaxRegex = /\[data-theme="light"\] \.tok-comment \{[\s\S]*?\[data-theme="light"\] \.code-container \{/;
const newLightSyntaxCSS = `[data-theme="light"] .tok-comment {
      color: #8E8A83;
      font-style: italic;
    }
    [data-theme="light"] .tok-mark {
      color: #57534E;
      font-weight: 600;
      font-style: normal;
    }
    [data-theme="light"] .tok-string {
      color: #B45309; /* Warm amber brown */
    }
    [data-theme="light"] .tok-attr {
      color: #C15F3D;
      font-weight: 600;
    }
    [data-theme="light"] .tok-macro {
      color: #C15F3D;
      font-weight: 600;
    }
    [data-theme="light"] .tok-kw {
      color: #C15F3D; /* Deep terracotta */
      font-weight: 600;
    }
    [data-theme="light"] .tok-type {
      color: #1E6B8C; /* Deep ocean slate */
      font-weight: 600;
    }
    [data-theme="light"] .tok-func {
      color: #7E3B68; /* Rich plum */
    }
    [data-theme="light"] .tok-number {
      color: #92400E;
    }
    [data-theme="light"] .tok-literal {
      color: #C15F3D;
      font-weight: 600;
    }

    [data-theme="light"] .code-container {`;

css = css.replace(oldLightSyntaxRegex, newLightSyntaxCSS);

// Update light mode code container
css = css.replace(
  /\[data-theme="light"\] \.code-container \{\s*background: #f8fafc;\s*border: 1px solid rgba\(0, 0, 0, 0\.1\);/,
  `[data-theme="light"] .code-container {\n      background: var(--bg-code);\n      border: 1px solid var(--border-color);`
);
css = css.replace(
  /\[data-theme="light"\] \.code-header \{\s*background: #f1f5f9;/,
  `[data-theme="light"] .code-header {\n      background: #E8E3DA;`
);
css = css.replace(
  /\[data-theme="light"\] pre \{\s*color: #1e293b;\s*background: #f8fafc;\s*\}/,
  `[data-theme="light"] pre {\n      color: var(--text-primary);\n      background: var(--bg-code);\n    }`
);

// Update document reader modal headers to serif
css = css.replace(
  /\.reader-modal-title \{\s*font-size: 1\.15rem;\s*font-weight: 800;/,
  `.reader-modal-title {\n      font-family: var(--font-serif);\n      font-size: 1.25rem;\n      font-weight: 600;`
);
css = css.replace(
  /\.doc-content h1\.doc-h1 \{\s*font-size: 1\.85rem;\s*font-weight: 800;/,
  `.doc-content h1.doc-h1 {\n      font-family: var(--font-serif);\n      font-size: 2rem;\n      font-weight: 600;`
);
css = css.replace(
  /\.doc-content h2\.doc-h2 \{\s*font-size: 1\.4rem;\s*font-weight: 700;[\s\S]*?color: var\(--accent-indigo-light\);\s*\}/,
  `.doc-content h2.doc-h2 {
      font-family: var(--font-serif);
      font-size: 1.5rem;
      font-weight: 600;
      margin: 2rem 0 0.85rem 0;
      color: var(--accent-claude-light);
    }`
);
css = css.replace(
  /\.doc-content h3\.doc-h3 \{\s*font-size: 1\.18rem;\s*font-weight: 700;/,
  `.doc-content h3.doc-h3 {\n      font-family: var(--font-serif);\n      font-size: 1.25rem;\n      font-weight: 600;`
);

// Replace remaining rgba(99, 102, 241 in CSS with Claude terracotta tints
css = css.replace(/rgba\(99,\s*102,\s*241,\s*0\.15\)/g, 'rgba(217, 119, 87, 0.15)');
css = css.replace(/rgba\(99,\s*102,\s*241,\s*0\.35\)/g, 'rgba(217, 119, 87, 0.35)');
css = css.replace(/rgba\(99,\s*102,\s*241,\s*0\.3\)/g, 'rgba(217, 119, 87, 0.3)');
css = css.replace(/rgba\(99,\s*102,\s*241,\s*0\.25\)/g, 'rgba(217, 119, 87, 0.25)');
css = css.replace(/rgba\(99,\s*102,\s*241,\s*0\.2\)/g, 'rgba(217, 119, 87, 0.2)');
css = css.replace(/rgba\(99,\s*102,\s*241,\s*0\.12\)/g, 'rgba(217, 119, 87, 0.12)');
css = css.replace(/rgba\(99,\s*102,\s*241,\s*0\.1\)/g, 'rgba(217, 119, 87, 0.1)');
css = css.replace(/rgba\(99,\s*102,\s*241,\s*0\.08\)/g, 'rgba(217, 119, 87, 0.08)');
css = css.replace(/rgba\(99,\s*102,\s*241,\s*0\.4\)/g, 'rgba(217, 119, 87, 0.4)');

html = html.substring(0, styleStart + 7) + css + html.substring(styleEnd);
console.log('Successfully updated CSS stylesheet with Claude.ai theme!');

// 3. Update Brand Icon in Header: Replace ⚡ with Claude Terracotta Spark ✳
html = html.replace(
  /<div class="cmd-bar-brand">\s*<span>⚡<\/span>/,
  `<div class="cmd-bar-brand">\n        <span style="color: var(--accent-claude); font-size: 1.25rem; line-height: 1; font-weight: 800;">✳</span>`
);

// 4. Update TOPIC_CATEGORIES colors in <script>
const topicColors = {
  "architecture": "#D97757",        // Claude Terracotta
  "concurrency": "#D49544",         // Claude Warm Amber
  "core-advance-swift": "#8E5B70",  // Claude Plum
  "swift-basics-ui": "#C15F3D",     // Warm Clay
  "combine-reactive": "#4D7C8A",    // Muted Slate Teal
  "networking": "#5A7D65",          // Claude Olive / Sage
  "modularity-performance": "#7E6E5C", // Warm Stone Bronze
  "data-memory": "#7C5379",         // Deep Warm Amethyst
  "security-compliance": "#B84A39", // Claude Russet Red
  "system-design": "#A34836",       // Deep Terracotta Brick
  "testing-ci-cd": "#4A7C94",       // Slate Ocean
  "leadership-production": "#B07038", // Warm Caramel
  "memory-management": "#477C6B"    // Forest Jade
};

const scriptOpen = html.indexOf('<script>');
const scriptClose = html.lastIndexOf('</script>');
let scriptBody = html.substring(scriptOpen + 8, scriptClose);

const topicMatch = scriptBody.match(/const TOPIC_CATEGORIES = (\[[\s\S]*?\]);/);
if (topicMatch) {
  const topics = JSON.parse(topicMatch[1]);
  topics.forEach(t => {
    if (topicColors[t.id]) {
      t.color = topicColors[t.id];
    }
  });
  scriptBody = scriptBody.replace(
    /const TOPIC_CATEGORIES = \[[\s\S]*?\];\n/,
    () => `const TOPIC_CATEGORIES = ${JSON.stringify(topics)};\n`
  );
  console.log('Harmonized TOPIC_CATEGORIES colors to Claude palette!');
}

// 5. Update Theme UI Labels in JavaScript to "Claude Dark" & "Claude Light"
scriptBody = scriptBody.replace(
  /if \(themeLabel\) themeLabel\.textContent = isLight \? 'Light' : 'Dark';/,
  `if (themeLabel) themeLabel.textContent = isLight ? 'Claude Light' : 'Claude Dark';`
);
scriptBody = scriptBody.replace(
  /if \(cmdThemeLabel\) cmdThemeLabel\.textContent = isLight \? 'Light' : 'Dark';/,
  `if (cmdThemeLabel) cmdThemeLabel.textContent = isLight ? 'Claude Light' : 'Claude Dark';`
);

// Validate script syntax
try {
  new vm.Script(scriptBody, { filename: 'dashboard-claude.js' });
  console.log('VALIDATION PASSED: 100% Valid JavaScript Syntax!');
} catch (e) {
  console.error('VALIDATION FAILED:', e);
  process.exit(1);
}

html = html.substring(0, scriptOpen + 8) + scriptBody + html.substring(scriptClose);
fs.writeFileSync(INDEX_PATH, html, 'utf-8');
console.log('Successfully saved index.html with Claude.ai theme transformation!');
