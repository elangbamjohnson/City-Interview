function highlightSwift(rawCode) {
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
  const masterRegex = /(\/\*[\s\S]*?\*\/)|(\/\/[^\n]*)|("""[\s\S]*?""")|("(?:\\.|[^"\\])*")/g;

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

  // 3. Attributes & Macros (e.g. @MainActor, @Published, @State, #if)
  masked = masked.replace(/(@[A-Za-z_]\w*)/g, '<span class="tok-attr">$1</span>');
  masked = masked.replace(/(#(?:if|else|endif|selector|keyPath|warning|error)\b)/g, '<span class="tok-macro">$1</span>');

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
  const kwRegex = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'g');
  masked = masked.replace(kwRegex, '<span class="tok-kw">$1</span>');

  // 5. Literals (true, false, nil)
  masked = masked.replace(/\b(true|false|nil)\b/g, '<span class="tok-literal">$1</span>');

  // 6. Numbers
  masked = masked.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-number">$1</span>');

  // 7. Types (PascalCase identifiers)
  masked = masked.replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, '<span class="tok-type">$1</span>');

  // 8. Function calls: funcName(...)
  masked = masked.replace(/\b([a-z_]\w*)(?=\s*\()/g, '<span class="tok-func">$1</span>');

  // 9. Restore protected tokens (Comments and Strings)
  masked = masked.replace(/___SWIFT_TOKEN_(\d+)___/g, (m, id) => {
    return tokens[parseInt(id, 10)];
  });

  return masked;
}