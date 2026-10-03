const fs = require('fs');
const vm = require('vm');

const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

let html = fs.readFileSync(INDEX_PATH, 'utf-8');

// Replace highlightSwift with robust token-based implementation
const oldHighlighterRegex = /function highlightSwift\(rawCode\) \{[\s\S]*?\n\}/;

const newHighlighter = `function highlightSwift(rawCode) {
  if (!rawCode) return '';

  const tokens = [];
  function saveToken(html) {
    tokens.push(html);
    return '___SWIFT_TOKEN_' + (tokens.length - 1) + '___';
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 1. Comments and Strings extraction (highest precedence)
  const masterRegex = /(\\/\\*[\\s\\S]*?\\*\\/)|(\\/\\/[^\\n]*)|("""[\\s\\S]*?""")|("(?:\\\\.|[^"\\\\])*")/g;

  let masked = rawCode.replace(masterRegex, (match, mComment, sComment, mString, sString) => {
    if (mComment || sComment) {
      const isMark = match.includes('MARK:');
      const cls = isMark ? 'tok-comment tok-mark' : 'tok-comment';
      return saveToken('<span class="' + cls + '">' + escapeHtml(match) + '</span>');
    }
    if (mString || sString) {
      return saveToken('<span class="tok-string">' + escapeHtml(match) + '</span>');
    }
    return match;
  });

  // 2. Escape HTML for the rest of the code
  masked = escapeHtml(masked);

  // 3. Attributes & Macros (e.g. @MainActor, @Published, @State, #if, #selector)
  masked = masked.replace(/(@[A-Za-z_]\\w*)/g, (m) => saveToken('<span class="tok-attr">' + m + '</span>'));
  masked = masked.replace(/(#(?:if|else|endif|selector|keyPath|warning|error)\\b)/g, (m) => saveToken('<span class="tok-macro">' + m + '</span>'));

  // 4. Swift Keywords
  const keywords = [
    'actor', 'associatedtype', 'async', 'await', 'break', 'case', 'catch', 'class', 'continue',
    'convenience', 'default', 'defer', 'deinit', 'didSet', 'do', 'else', 'enum', 'extension',
    'fallthrough', 'fileprivate', 'final', 'for', 'func', 'get', 'guard', 'if', 'import', 'in',
    'init', 'inout', 'internal', 'is', 'lazy', 'let', 'mutating', 'nonisolated', 'nonmutating',
    'open', 'operator', 'override', 'precedencegroup', 'private', 'protocol', 'public', 'repeat',
    'required', 'rethrows', 'return', 'self', 'Self', 'set', 'some', 'any', 'static', 'struct',
    'subscript', 'super', 'switch', 'throw', 'throws', 'try', 'typealias', 'unowned', 'var',
    'weak', 'where', 'while', 'willSet', 'wrappedValue', 'projectedValue'
  ];
  const kwRegex = new RegExp('\\\\b(' + keywords.join('|') + ')\\\\b', 'g');
  masked = masked.replace(kwRegex, (m) => saveToken('<span class="tok-kw">' + m + '</span>'));

  // 5. Literals (true, false, nil)
  masked = masked.replace(/\\b(true|false|nil)\\b/g, (m) => saveToken('<span class="tok-literal">' + m + '</span>'));

  // 6. Function calls: funcName(...)
  masked = masked.replace(/\\b([a-z_]\\w*)(?=\\s*\\()/g, (m) => saveToken('<span class="tok-func">' + m + '</span>'));

  // 7. Types (PascalCase identifiers)
  masked = masked.replace(/\\b([A-Z][A-Za-z0-9_]*)\\b/g, (m) => saveToken('<span class="tok-type">' + m + '</span>'));

  // 8. Numbers
  masked = masked.replace(/\\b(\\d+(?:\\.\\d+)?)\\b/g, (m) => saveToken('<span class="tok-number">' + m + '</span>'));

  // 9. Restore protected tokens (Comments, Strings, Keywords, Types, etc.)
  masked = masked.replace(/___SWIFT_TOKEN_(\\d+)___/g, (m, id) => {
    return tokens[parseInt(id, 10)];
  });

  return masked;
}`;

html = html.replace(oldHighlighterRegex, newHighlighter);

// Validate script syntax
const scriptOpen = html.indexOf('<script>');
const scriptClose = html.lastIndexOf('</script>');
const scriptBody = html.substring(scriptOpen + 8, scriptClose);

try {
  new vm.Script(scriptBody, { filename: 'dashboard.js' });
  console.log('Script syntax validated successfully!');
} catch (e) {
  console.error('Validation failed:', e);
  process.exit(1);
}

fs.writeFileSync(INDEX_PATH, html, 'utf-8');
console.log('Successfully updated highlightSwift in index.html without HTML corruption!');
