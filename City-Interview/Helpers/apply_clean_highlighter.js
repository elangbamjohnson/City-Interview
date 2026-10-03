const fs = require('fs');
const vm = require('vm');

const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

let html = fs.readFileSync(INDEX_PATH, 'utf-8');

const newHighlighter = `function highlightSwift(rawCode) {
  if (!rawCode) return '';

  const combinedRegex = new RegExp([
    '(/\\\\*[\\\\s\\\\S]*?\\\\*/|//[^\\\\n]*)',
    '("""[\\\\s\\\\S]*?"""|"(?:\\\\\\\\.|[^"\\\\\\\\])*")',
    '(@[A-Za-z_]\\\\w*)',
    '(#(?:if|else|endif|selector|keyPath|warning|error)\\\\b)',
    '(\\\\b(?:true|false|nil)\\\\b)',
    '(\\\\b(?:actor|associatedtype|async|await|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|else|enum|extension|fallthrough|fileprivate|final|for|func|get|guard|if|import|in|init|inout|internal|is|lazy|let|mutating|nonisolated|nonmutating|open|operator|override|precedencegroup|private|protocol|public|repeat|required|rethrows|return|self|Self|set|some|any|static|struct|subscript|super|switch|throw|throws|try|typealias|unowned|var|weak|where|while|willSet|wrappedValue|projectedValue)\\\\b)',
    '(\\\\b\\\\d+(?:\\\\.\\\\d+)?\\\\b)',
    '(\\\\b[a-z_]\\\\w*(?=\\\\s*\\\\())',
    '(\\\\b[A-Z][A-Za-z0-9_]*\\\\b)'
  ].join('|'), 'g');

  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(rawCode)) !== null) {
    result += escapeHtml(rawCode.slice(lastIndex, match.index));
    lastIndex = combinedRegex.lastIndex;

    if (match[1]) {
      const isMark = match[1].includes('MARK:');
      const cls = isMark ? 'tok-comment tok-mark' : 'tok-comment';
      result += '<span class="' + cls + '">' + escapeHtml(match[1]) + '</span>';
    } else if (match[2]) {
      result += '<span class="tok-string">' + escapeHtml(match[2]) + '</span>';
    } else if (match[3]) {
      result += '<span class="tok-attr">' + escapeHtml(match[3]) + '</span>';
    } else if (match[4]) {
      result += '<span class="tok-macro">' + escapeHtml(match[4]) + '</span>';
    } else if (match[5]) {
      result += '<span class="tok-literal">' + escapeHtml(match[5]) + '</span>';
    } else if (match[6]) {
      result += '<span class="tok-kw">' + escapeHtml(match[6]) + '</span>';
    } else if (match[7]) {
      result += '<span class="tok-number">' + escapeHtml(match[7]) + '</span>';
    } else if (match[8]) {
      result += '<span class="tok-func">' + escapeHtml(match[8]) + '</span>';
    } else if (match[9]) {
      result += '<span class="tok-type">' + escapeHtml(match[9]) + '</span>';
    }
  }

  result += escapeHtml(rawCode.slice(lastIndex));
  return result;
}`;

html = html.replace(/function highlightSwift\(rawCode\) \{[\s\S]*?\n\}/, newHighlighter);

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
console.log('Clean single-pass highlightSwift written to index.html successfully!');
