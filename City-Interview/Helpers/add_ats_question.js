const fs = require('fs');
const path = require('path');

const QUESTIONS_JSON_PATH = path.join(__dirname, '../Resources/questions.json');
const INDEX_HTML_PATH = path.join(__dirname, '../index.html');

const newQuestion = {
  id: "Q-75",
  category: "Security, Auth & Compliance",
  difficulty: "Advanced",
  question: "What is App Transport Security?",
  interviewSentence: "ATS is the iOS default that blocks non-HTTPS or weak connections, and the safe way to deal with it is to fix the server and keep any exception small and domain-specific.",
  answer: `App Transport Security (ATS) is an iOS rule that says: your app must talk to servers over secure HTTPS. It is turned on by default for every app, so a plain http:// request is blocked unless you ask for an exception. It protects users from someone reading or changing data on the network, like on public Wi-Fi. You meet it the first time a request to http:// fails with an error in the console, and again whenever you need to talk to a local test server or an old backend.

Say it like this:
"ATS is a security default in iOS. It forces the networking that my app does through URLSession and web views to use HTTPS with a modern, safe setup. If a server does not meet the rules, the connection fails before any data is sent.

The rules are: the connection must use HTTPS, with TLS 1.2 or newer. The server needs strong ciphers with forward secrecy, which means that even if the server's key leaks later, old recorded traffic still cannot be decrypted. The certificate must be valid, signed with SHA-256 or stronger, with a strong key size. Redirects from HTTPS to HTTP are blocked too.

If I must break one of these rules, I use exceptions in Info.plist, under NSAppTransportSecurity. I try to keep them as small as possible: one domain, only the setting that is needed. For example, for a local dev server I use NSAllowsLocalNetworking, or an exception for that one domain. I avoid NSAllowsArbitraryLoads, which turns ATS off for everything. App Review asks me to explain broad exceptions, so a global switch can also delay a release.

ATS covers the high-level networking, like URLSession and WKWebView. It does not cover low-level sockets, where I must set up TLS myself. And ATS only checks that the connection is secure. It does not check that I am talking to my own server. For that I add certificate pinning, which I can also set up in Info.plist."

Core ATS Specifications & Requirements:
• Protocol: HTTPS only (plain http:// is rejected before any packet is sent over the wire).
• Minimum TLS Version: TLS 1.2 or higher (TLS 1.0 and 1.1 are completely disabled by default).
• Symmetric Ciphers: Strong modern ciphers only (AES-128 or AES-256 with GCM or CBC).
• Forward Secrecy (PFS): Required via Ephemeral Diffie-Hellman (ECDHE). If a private server key is compromised in the future, past captured traffic cannot be retroactively decrypted.
• Certificate Digest & Key Size: Must be signed by a trusted root CA in the iOS trust store using SHA-256 or stronger digest with at least a 2048-bit RSA key or 256-bit ECC key.
• Redirect Enforcement: HTTPS-to-HTTP redirects are blocked by default to prevent SSL-stripping attacks.

The Hierarchy of ATS Exceptions (Info.plist):
1. Best Practice (Zero Exceptions): Upgrade all endpoints to modern HTTPS with TLS 1.2+. No Info.plist modification needed.
2. Targeted Domain Exception (NSExceptionDomains): Whitelist only a legacy subdomain with NSExceptionAllowsInsecureHTTPLoads or NSExceptionMinimumTLSVersion.
3. Local Development (NSAllowsLocalNetworking): Enables connections to Bonjour, .local domains, and RFC 1918 private IPv4/IPv6 ranges without disabling public ATS.
4. Web-Only Traffic (NSAllowsArbitraryLoadsInWebContent): Allows WKWebView to load non-HTTPS sites without weakening native API security.
5. The Anti-Pattern (NSAllowsArbitraryLoads): Blanket disables ATS across the entire app. Triggers Apple App Review scrutiny and demands written justification.

Good to mention (Staff-Level Interview Points):
• ATS Default Since iOS 9: iOS enforces ATS by default on all Apple networking frameworks: URLSession, WebKit (WKWebView), and AVFoundation streaming.
• Raw Sockets Exception: Low-level BSD sockets (CFSocket, POSIX socket()) bypass ATS; you must configure TLS manually using Network.framework (NWConnection).
• App Store Review Scrutiny: Broad exceptions (like NSAllowsArbitraryLoads = true) require explicit architectural justification during submission and can delay app approval.
• Third-Party SDK Danger: A single misconfigured third-party advertising or analytics SDK using HTTP often tempts developers to disable ATS globally. Always audit SDK network traffic and push vendors for HTTPS endpoints.
• Command-Line Diagnostic: Test any endpoint's ATS compliance directly from macOS terminal using: \`nscurl --ats-diagnostics --verbose https://api.yourbank.com\`. It tests every ATS rule individually and flags exact cipher/certificate failures.
• Configuration Splitting: Never ship development ATS exceptions in production! Use build configurations (xcconfig / per-scheme Info.plist) to enable local networking in Debug while maintaining zero exceptions in Release.
• Defense-in-Depth vs Pinning: ATS guarantees the connection is encrypted with a CA-trusted certificate; Certificate Pinning guarantees the server is genuinely YOUR server, protecting against compromised public CAs.

One-liner: ATS is the iOS default that blocks non-HTTPS or weak connections, and the safe way to deal with it is to fix the server and keep any exception small and domain-specific.

Memory trick: H-T-E → "HTTPS by default, TLS 1.2+ with strong ciphers, Exceptions small and per domain."`,
  codeExample: `// =========================================================================
// 🔒 SENIOR INTERVIEW ARCHITECTURE: App Transport Security (ATS)
// =========================================================================
//
// 💡 INTERVIEW TALKING POINTS (Staff/Senior Level):
// • ATS enforces secure connections (TLS 1.2+, forward secrecy, strong ciphers).
// • URLSession blocks non-compliant or plaintext HTTP requests before packets leave the device.
// • Exceptions in Info.plist must follow the Principle of Least Privilege.

// MARK: - 1. What a Blocked Request Looks Like
// ⚠️ ATS blocks plain HTTP before any network data is transmitted.
func demonstrateBlockedRequest() async {
    let url = URL(string: "http://api.example.com/data")!
    do {
        let (data, _) = try await URLSession.shared.data(from: url)
        print("Received: \\(data.count) bytes")
    } catch {
        // Console error output:
        // "The resource could not be loaded because the
        //  App Transport Security policy requires the use of a secure connection."
        print("❌ ATS Blocked Connection: \\(error.localizedDescription)")
    }
}

// MARK: - 2. The Right Fix: Secure HTTPS Endpoint
// ✅ HTTPS with TLS 1.2+ and forward secrecy passes ATS natively with zero configuration.
func demonstrateSecureRequest() async throws -> Data {
    let url = URL(string: "https://api.example.com/data")!
    let (data, response) = try await URLSession.shared.data(from: url)
    guard (response as? HTTPURLResponse)?.statusCode == 200 else {
        throw URLError(.badServerResponse)
    }
    return data
}

/*
// =========================================================================
// 📄 INFO.PLIST EXCEPTION EXAMPLES (Principle of Least Privilege)
// =========================================================================

// MARK: - 3. Small Exception for a Single Legacy Domain
// 💡 SENIOR TALKING POINT:
// Never use global switches. Narrow down the exception strictly to the domain,
// and disable subdomain inheritance unless strictly necessary.

<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>legacy.example.com</key>
        <dict>
            <!-- Allows plain HTTP only for this specific legacy endpoint -->
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <!-- Strict boundary: Do not apply to subdomains -->
            <key>NSIncludesSubdomains</key>
            <false/>
        </dict>
    </dict>
</dict>

// MARK: - 4. Local Network for Development & Simulator Testing
// 💡 SENIOR TALKING POINT:
// Allows connecting to http://localhost, http://192.168.x.x, or .local Bonjour names
// without weakening ATS rules for any internet-facing domains.

<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>

// MARK: - 5. Allow Older TLS or Relax Forward Secrecy for One Domain
// 💡 SENIOR TALKING POINT:
// Used only during migration when an old partner server does not support ECDHE (PFS).

<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>partner-old.example.com</key>
        <dict>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.2</string>
            <!-- Relax Perfect Forward Secrecy (PFS) rule only for this domain -->
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
        </dict>
    </dict>
</dict>

// MARK: - 6. The Danger Setting to Avoid in Production
// ⚠️ RED FLAG IN SENIOR INTERVIEWS:
// NSAllowsArbitraryLoads turns off ATS for the ENTIRE app.
// Apple App Review will flag this and require written justification before approval.

<key>NSAppTransportSecurity</key>
<dict>
    <!-- ❌ NEVER SHIP THIS IN PRODUCTION BANKING APPS -->
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
*/`
};

// 1. Update questions.json
const questions = JSON.parse(fs.readFileSync(QUESTIONS_JSON_PATH, 'utf-8'));
const existingIdx = questions.findIndex(q => q.id === newQuestion.id);
if (existingIdx !== -1) {
  questions[existingIdx] = newQuestion;
  console.log(`Updated existing ${newQuestion.id} in questions.json`);
} else {
  questions.push(newQuestion);
  console.log(`Appended ${newQuestion.id} to questions.json (Total: ${questions.length})`);
}
fs.writeFileSync(QUESTIONS_JSON_PATH, JSON.stringify(questions, null, 2) + '\n', 'utf-8');

// 2. Update index.html
let html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

// Update QUESTIONS array in index.html
const startMarker = 'const QUESTIONS = ';
const startIdx = html.indexOf(startMarker);
if (startIdx !== -1) {
  const jsonStart = startIdx + startMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  let htmlQuestions = JSON.parse(html.substring(jsonStart, nextSemi));
  const hIdx = htmlQuestions.findIndex(q => q.id === newQuestion.id);
  if (hIdx !== -1) {
    htmlQuestions[hIdx] = newQuestion;
  } else {
    htmlQuestions.push(newQuestion);
  }
  html = html.substring(0, jsonStart) + JSON.stringify(htmlQuestions) + html.substring(nextSemi);
  console.log(`✓ Updated QUESTIONS in index.html (Total: ${htmlQuestions.length})`);
}

// Update TOPIC_CATEGORIES in index.html: add Q-75 to security-compliance.questionIds
if (!html.includes("'Q-75'")) {
  const secMarker = "id: 'security-compliance', title: 'Security, App Hardening & Compliance'";
  const secIdx = html.indexOf(secMarker);
  if (secIdx !== -1) {
    const qIdsEnd = html.indexOf(']', secIdx);
    const before = html.substring(0, qIdsEnd);
    const after = html.substring(qIdsEnd);
    html = before + ", 'Q-75'" + after;
    console.log("✓ Added Q-75 to TOPIC_CATEGORIES security-compliance.questionIds");
  }
}

// Update QUESTION_TO_DOCS for Q-75
const docsMarker = 'const QUESTION_TO_DOCS = {';
const docsIdx = html.indexOf(docsMarker);
if (docsIdx !== -1 && !html.includes('"Q-75":')) {
  const injectDocs = `"Q-75":[{"docId":"security-comparison","title":"Security Decision Table (Keychain, Enclave, Pinning)","filename":"Security-ComparisonNotes.md","icon":"🛡️"}],`;
  html = html.slice(0, docsIdx + docsMarker.length) + injectDocs + html.slice(docsIdx + docsMarker.length);
  console.log("✓ Added Q-75 to QUESTION_TO_DOCS");
}

// Update static counts: 74 -> 75
html = html.replace(/<span class="brand-tag">74 Questions/g, '<span class="brand-tag">75 Questions');
html = html.replace(/all 55 questions/g, 'all 75 questions');
html = html.replace(/all 52 senior iOS/g, 'all 75 senior iOS');
html = html.replace(/id="totalCount">55<\/span>/g, 'id="totalCount">75<\/span>');

fs.writeFileSync(INDEX_HTML_PATH, html, 'utf-8');
console.log('✓ index.html successfully updated and saved!');
