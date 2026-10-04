const fs = require('fs');
const path = require('path');

const QUESTIONS_JSON_PATH = path.join(__dirname, '../Resources/questions.json');
const INDEX_HTML_PATH = path.join(__dirname, '../index.html');
const QUESTIONS_MD_PATH = path.join(__dirname, '../QUESTIONS.md');

const newQuestion = {
  id: "Q-77",
  category: "Security, Auth & Compliance",
  difficulty: "Advanced",
  question: "Where do you store an AI API key for an iOS app?",
  interviewSentence: "The AI key stays on my server, the app sends the prompt with the user's access token, and the server checks limits, calls the AI provider, and returns only the answer.",
  answer: `An AI API key is a secret that is tied to your billing account. If someone steals it, they can send thousands of requests, and you pay the bill. It is the same case as a payment key, so it follows the same rule from Q44: anything inside the app can be extracted, so the key must not be in the app.

The right approach is a backend proxy. Your own server holds the AI key. The app talks only to your server, and your server talks to the AI provider.

Say it like this:

"I never put the AI key in the app, not in the code, not in Info.plist, not in an xcconfig, and not in the Keychain. The Keychain protects data on a phone I trust, but an attacker can run my app on a jailbroken phone, or unzip it, and read what is shipped inside. So the key lives on my server, in the hosting platform's secret store.

The app sends the user's prompt to my server, with the user's access token. The server checks the token, checks the user's usage limit, and then calls the AI provider with the real key. The provider replies to the server, and the server sends the answer back to the app. The app never sees the key.

This also gives me control. On the server, I can limit how many requests each user can make, cap the prompt size, choose the model, log usage, and stop a user who abuses the service. If the key ever leaks, I rotate it on the server, and no app update is needed. For more protection, I add App Attest, so the server accepts requests only from a genuine copy of my app."

The 6-step Backend Proxy Pattern:

1. The app sends the prompt with the access token

\`\`\`swift
struct AIRequest: Encodable {
    let prompt: String                                            // the text the user typed
}

struct AIResponse: Decodable {
    let answer: String                                            // the AI reply, sent back by my server
}

func askAI(prompt: String, accessToken: String) async throws -> String {
    var request = URLRequest(url: URL(string: "https://api.myapp.com/ai/chat")!) // MY server, not the AI provider
    request.httpMethod = "POST"                                   // we are sending data, so POST
    request.setValue("application/json", forHTTPHeaderField: "Content-Type") // the body is JSON
    request.setValue("Bearer \\(accessToken)", forHTTPHeaderField: "Authorization") // proves which user is asking
    request.httpBody = try JSONEncoder().encode(AIRequest(prompt: prompt)) // only the prompt, no AI key

    let (data, response) = try await URLSession.shared.data(for: request) // send it and wait for the reply
    guard (response as? HTTPURLResponse)?.statusCode == 200 else {        // stop if the server said no
        throw URLError(.badServerResponse)                        // for example: 401 not logged in, 429 too many requests
    }
    return try JSONDecoder().decode(AIResponse.self, from: data).answer   // read the answer from the reply
}
\`\`\`

2. The server checks who is asking and how much they use

\`\`\`javascript
// server.js (Node.js with Express)
import express from "express";                                    // a small web server library

const app = express();                                            // create the server
app.use(express.json());                                          // read JSON request bodies

app.post("/ai/chat", async (req, res) => {                        // the endpoint the app calls
  const user = await verifyAccessToken(req.headers.authorization); // check the token, get the user (or null)
  if (!user) return res.status(401).json({ error: "Unauthorized" }); // no valid token: stop here

  const prompt = String(req.body.prompt || "").slice(0, 4000);    // cap the prompt size, so one request cannot be huge
  if (!prompt) return res.status(400).json({ error: "Empty prompt" }); // reject empty prompts

  const allowed = await checkAndCountUsage(user.id);              // each user has a daily limit
  if (!allowed) return res.status(429).json({ error: "Daily limit reached" }); // too many requests: stop here
\`\`\`

3. The server calls the AI provider with the secret key

\`\`\`javascript
  const aiReply = await fetch("https://api.ai-provider.com/v1/chat", { // the AI provider's address
    method: "POST",                                               // sending data, so POST
    headers: {
      "Content-Type": "application/json",                         // the body is JSON
      "Authorization": \`Bearer \${process.env.AI_API_KEY}\`         // the secret key, read from the server's secret store
    },
    body: JSON.stringify({
      model: "chosen-model-name",                                 // the server picks the model, not the app
      max_tokens: 500,                                            // the server caps the cost of each answer
      messages: [{ role: "user", content: prompt }]               // the user's prompt
    })
  });

  if (!aiReply.ok) return res.status(502).json({ error: "AI service error" }); // the provider failed: tell the app politely
  const result = await aiReply.json();                            // read the provider's reply
\`\`\`

4. The server sends the answer back to the app

\`\`\`javascript
  res.json({ answer: result.text });                              // send only the answer, never the key or raw provider data
});

app.listen(3000);                                                 // start listening for requests
\`\`\`

5. Store the key in the server's secret store, not in the code

\`\`\`bash
# Local development only: a .env file that is ignored by Git
AI_API_KEY=sk-xxxxxxxx                                            # this stays on the developer's machine

# Production: use the hosting platform's secret manager
# Examples: AWS Secrets Manager, Google Secret Manager, or the host's environment variables
# The code reads it with process.env.AI_API_KEY, so the key is never in the repo
\`\`\`

6. Make sure the request comes from a genuine app (App Attest)

\`\`\`swift
import DeviceCheck                                                // gives us App Attest
import CryptoKit                                                  // gives us SHA256

func signAIRequest(keyId: String, body: Data) async throws -> Data {
    let hash = Data(SHA256.hash(data: body))                      // hash the request body about to be sent
    return try await DCAppAttestService.shared.generateAssertion( // sign it with the key created in the Secure Enclave
        keyId,                                                    // the key that was attested earlier (see Q41)
        clientDataHash: hash                                      // ties the proof to this exact request
    )
}
// The app sends this assertion in a header, and the server verifies it.
// The server then knows the request comes from my real app on a real Apple device.
\`\`\`

Quick steps to remember:

1. App → server: send the prompt with the user's access token.
2. Server checks: valid token, usage limit, prompt size.
3. Server → AI provider: call with the secret key from the server's secret store.
4. AI provider → server: the server receives the answer.
5. Server → app: send back only the answer.
6. Extra protection: App Attest, rate limits, and spending caps.

Good to mention:

• Never ship the key inside the app, even in the Keychain or obfuscated. A skilled attacker can still pull it out, and the bill is yours.
• Set a spending cap and alerts in the AI provider's dashboard, so a bug or an abuser cannot create a huge bill.
• Rate limit per user and per device, not only per IP address, because many users share one IP.
• Let the server choose the model and the limits like max_tokens. If the app sends them, a modified app can ask for the most expensive option.
• Streaming: for a chat that types out word by word, the server can stream the provider's reply to the app using Server-Sent Events, and the app reads it with URLSession.bytes(for:). The key still stays on the server.
• Key rotation: if the key leaks, create a new one in the provider's dashboard and update the server's secret store. Apps keep working, with no new release.
• Do not log the key, and be careful about logging full prompts, because they may contain private user data.
• Exception: a provider that offers a key built for client apps, with strict limits and restrictions, can be used directly. Even then, check what damage a stolen key can do before choosing it.

One-liner: The AI key stays on my server, the app sends the prompt with the user's access token, and the server checks limits, calls the AI provider, and returns only the answer.

Memory trick: P-R-O-X-Y → "Proxy Relies On eXternal servers, not Your phone."`,
  codeExample: `// =========================================================================
// 🛡️ SENIOR INTERVIEW ARCHITECTURE: AI API Key Security & Backend Proxy
// =========================================================================
//
// 💡 INTERVIEW TALKING POINTS (Staff/Senior Level):
// • Zero Trust on Client: Never ship paid or billing-tied API keys inside an iOS app.
//   Strings extracted via \`strings\`, \`hopper\`, or decrypted IPAs expose your billing account.
// • Backend Proxy Pattern: The iOS app communicates strictly with your proprietary backend
//   using user authentication (OAuth JWT) and DeviceCheck/App Attest device assertions.
// • Defense-in-Depth:
//   1. Authentication: User access token verifies the identity of the caller.
//   2. Device Integrity: App Attest verifies the binary is untampered and running on a real Apple device.
//   3. Rate Limiting: Leaky bucket / sliding window limits per user ID and per device ID.
//   4. Cost Capping: Server enforces max_tokens, allowed models, and strict prompt character lengths.
//   5. Streaming UX: Server-Sent Events (SSE) proxy streaming via URLSession.bytes(for:) without exposing keys.

import Foundation
import DeviceCheck
import CryptoKit

// MARK: - 1. DTOs (Data Transfer Objects)

struct ChatMessage: Codable {
    let role: String    // "user", "assistant", "system"
    let content: String
}

struct AIProxyRequest: Encodable {
    let prompt: String
    // 💡 Notice: model, temperature, and max_tokens are NOT sent by the client.
    // The server controls all cost-governing parameters to prevent client-side price tampering.
}

struct AIProxyResponse: Decodable {
    let answer: String
    let tokensUsed: Int?
}

// MARK: - 2. Secure Mobile Client Service

@MainActor
final class AIService: ObservableObject {
    private let session: URLSession
    private let baseURL = URL(string: "https://api.myapp.com/v1/ai")!
    
    init(session: URLSession = .shared) {
        self.session = session
    }
    
    /// Sends a prompt to your secure backend proxy with User Auth and App Attest proof
    func sendPrompt(
        prompt: String,
        userAccessToken: String,
        attestKeyId: String? = nil
    ) async throws -> String {
        // 1. Sanitize prompt on client before sending
        let sanitized = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !sanitized.isEmpty else {
            throw AIServiceError.emptyPrompt
        }
        
        let endpoint = baseURL.appendingPathComponent("chat")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // 💡 2. Authenticate the user (proves who is calling and ties billing/quota to user ID)
        request.setValue("Bearer \\(userAccessToken)", forHTTPHeaderField: "Authorization")
        
        let bodyPayload = try JSONEncoder().encode(AIProxyRequest(prompt: sanitized))
        request.httpBody = bodyPayload
        
        // 💡 3. App Attest (DCAppAttestService): Hardware-bound proof that request comes from authentic app
        if let keyId = attestKeyId, DCAppAttestService.shared.isSupported {
            let clientDataHash = Data(SHA256.hash(data: bodyPayload))
            let assertion = try await DCAppAttestService.shared.generateAssertion(keyId, clientDataHash: clientDataHash)
            request.setValue(assertion.base64EncodedString(), forHTTPHeaderField: "X-App-Attest-Assertion")
            request.setValue(keyId, forHTTPHeaderField: "X-App-Attest-Key-ID")
        }
        
        // 4. Execute network request against YOUR proxy, never OpenAI / Anthropic / Gemini directly
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw AIServiceError.networkError
        }
        
        switch httpResponse.statusCode {
        case 200:
            let decoded = try JSONDecoder().decode(AIProxyResponse.self, from: data)
            return decoded.answer
        case 401:
            throw AIServiceError.unauthorized          // Expired or invalid user token
        case 429:
            throw AIServiceError.rateLimitExceeded      // Daily quota reached or too rapid requests
        case 502:
            throw AIServiceError.upstreamAIProviderDown // Provider outage handled gracefully
        default:
            throw AIServiceError.serverError(statusCode: httpResponse.statusCode)
        }
    }
    
    /// Server-Sent Events (SSE) Streaming without exposing the upstream AI key
    func streamPrompt(
        prompt: String,
        userAccessToken: String
    ) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    let endpoint = baseURL.appendingPathComponent("stream")
                    var request = URLRequest(url: endpoint)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.setValue("Bearer \\(userAccessToken)", forHTTPHeaderField: "Authorization")
                    request.httpBody = try JSONEncoder().encode(AIProxyRequest(prompt: prompt))
                    
                    // 💡 URLSession.bytes(for:) delivers chunks as they arrive from your proxy
                    let (asyncBytes, response) = try await session.bytes(for: request)
                    guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                        continuation.finish(throwing: AIServiceError.networkError)
                        return
                    }
                    
                    for try await line in asyncBytes.lines {
                        // SSE protocol format: "data: <chunk_text>"
                        if line.hasPrefix("data: ") {
                            let textChunk = String(line.dropFirst(6))
                            if textChunk == "[DONE]" {
                                break
                            }
                            continuation.yield(textChunk)
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            continuation.onTermination = { _ in
                task.cancel()
            }
        }
    }
}

// MARK: - 3. Service Error Types

enum AIServiceError: LocalizedError {
    case emptyPrompt
    case unauthorized
    case rateLimitExceeded
    case upstreamAIProviderDown
    case networkError
    case serverError(statusCode: Int)
    
    var errorDescription: String? {
        switch self {
        case .emptyPrompt: return "Prompt cannot be empty."
        case .unauthorized: return "Session expired. Please log in again."
        case .rateLimitExceeded: return "Daily AI quota exceeded. Please upgrade or try again tomorrow."
        case .upstreamAIProviderDown: return "AI service is currently busy. Please try again shortly."
        case .networkError: return "Network connection error."
        case .serverError(let code): return "Server returned error code: \\(code)."
        }
    }
}`
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

// Update TOPIC_CATEGORIES in index.html
const topicsMarker = 'const TOPIC_CATEGORIES = ';
const topicsIdx = html.indexOf(topicsMarker);
if (topicsIdx !== -1) {
  const jsonStart = topicsIdx + topicsMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  let topics = JSON.parse(html.substring(jsonStart, nextSemi));
  const sec = topics.find(t => t.id === 'security-compliance');
  if (sec && !sec.questionIds.includes(newQuestion.id)) {
    sec.questionIds.push(newQuestion.id);
    html = html.substring(0, jsonStart) + JSON.stringify(topics) + html.substring(nextSemi);
    console.log(`✓ Added ${newQuestion.id} to TOPIC_CATEGORIES security-compliance.questionIds`);
  }
}

// Update QUESTION_TO_DOCS in index.html
const docsMarker = 'const QUESTION_TO_DOCS = ';
const docsIdx = html.indexOf(docsMarker);
if (docsIdx !== -1) {
  const jsonStart = docsIdx + docsMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  let docs = JSON.parse(html.substring(jsonStart, nextSemi));
  docs[newQuestion.id] = [
    {
      docId: "security-comparison",
      title: "Security Decision Table (Keychain, Enclave, Pinning)",
      filename: "Security-ComparisonNotes.md",
      icon: "🛡️"
    },
    {
      docId: "networking-architecture",
      title: "Networking Architecture Decision Table & 4 Pillars",
      filename: "Networking-ComparisonNotes.md",
      icon: "🌐"
    }
  ];
  html = html.substring(0, jsonStart) + JSON.stringify(docs) + html.substring(nextSemi);
  console.log(`✓ Added ${newQuestion.id} to QUESTION_TO_DOCS`);
}

// Upgrade highlightSwift and renderAnswerWithCode in index.html
const oldHighlightMarker = '// ==========================================\n    // Swift Syntax Highlighter (Xcode accurate tokenization)\n    // ==========================================';
const newHighlighterCode = `// ==========================================
    // Code Syntax Highlighter (Swift, JS, Bash - Xcode accurate tokenization)
    // ==========================================
function highlightCode(rawCode, lang = 'swift') {
  if (!rawCode) return '';

  let commentPattern = '(/\\\\*[\\\\s\\\\S]*?\\\\*/|//[^\\\\n]*)';
  if (lang === 'bash' || lang === 'sh') {
    commentPattern = '(#.*)';
  }

  const stringPattern = '(\"\"\"[\\\\s\\\\S]*?\"\"\"|\"(?:\\\\\\\\.|[^\"\\\\\\\\])*\"|\'(?:\\\\\\\\.|[^\'\\\\\\\\])*\'|\`[\\\\s\\\\S]*?\`)';
  const attrPattern = '(@[A-Za-z_]\\\\w*)';
  const macroPattern = '(#(?:if|else|endif|selector|keyPath|warning|error)\\\\b)';
  const literalPattern = '(\\\\b(?:true|false|nil|null|undefined)\\\\b)';
  const kwPattern = '(\\\\b(?:actor|associatedtype|async|await|break|case|catch|class|const|continue|convenience|default|defer|deinit|didSet|do|else|enum|export|extension|fallthrough|fileprivate|final|for|from|func|function|get|guard|if|import|in|init|inout|internal|is|lazy|let|mutating|new|nonisolated|nonmutating|open|operator|override|precedencegroup|private|protocol|public|repeat|required|rethrows|return|self|Self|set|some|any|static|struct|subscript|super|switch|throw|throws|try|typealias|unowned|var|weak|where|while|willSet|wrappedValue|projectedValue)\\\\b)';
  const numPattern = '(\\\\b\\\\d+(?:\\\\.\\\\d+)?\\\\b)';
  const funcPattern = '(\\\\b[a-z_]\\\\w*(?=\\\\s*\\\\())';
  const typePattern = '(\\\\b[A-Z][A-Za-z0-9_]*\\\\b)';

  const combinedRegex = new RegExp([
    commentPattern,
    stringPattern,
    attrPattern,
    macroPattern,
    literalPattern,
    kwPattern,
    numPattern,
    funcPattern,
    typePattern
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
}

function highlightSwift(rawCode) {
  return highlightCode(rawCode, 'swift');
}`;

// Update highlightSwift if old is present
if (html.includes(oldHighlightMarker)) {
  const endOfFunc = html.indexOf('function escapeHtml(str)', html.indexOf(oldHighlightMarker));
  if (endOfFunc !== -1) {
    html = html.substring(0, html.indexOf(oldHighlightMarker)) + newHighlighterCode + '\n\n    ' + html.substring(endOfFunc);
    console.log("✓ Updated highlightCode & highlightSwift in index.html");
  }
}

// Update renderAnswerWithCode to support multiple language tags
const oldRenderFn = `    // Render answer text with embedded Swift syntax-highlighted code blocks
    function renderAnswerWithCode(answerText) {
      if (!answerText) return '';
      if (!answerText.includes('\`\`\`')) {
        return \`<div class="answer-text">\${escapeHtml(answerText)}</div>\`;
      }

      const parts = answerText.split(/(^\\\`\\\`\\\`(?:swift)?[\\s\\S]*?^\\\`\\\`\\\`)/gm);`;

// Let's use regex replacement for renderAnswerWithCode
const newRenderFn = `    // Render answer text with embedded syntax-highlighted code blocks
    function renderAnswerWithCode(answerText) {
      if (!answerText) return '';
      if (!answerText.includes('\`\`\`')) {
        return \`<div class="answer-text">\${escapeHtml(answerText)}</div>\`;
      }

      const parts = answerText.split(/(\`\`\`[a-zA-Z0-9_-]*[\\s\\S]*?\`\`\`)/g);
      let html = '';
      for (const part of parts) {
        if (part.startsWith('\`\`\`')) {
          const matchLang = part.match(/^\`\`\`([a-zA-Z0-9_-]*)\\n?/);
          const lang = (matchLang && matchLang[1]) ? matchLang[1].toLowerCase() : 'swift';
          const code = part.replace(/^\`\`\`[a-zA-Z0-9_-]*\\n?/, '').replace(/\`\`\`$/, '').trim();
          html += \`
            <div class="inline-code-box">
              <pre><code class="language-\${escapeHtml(lang)}">\${highlightCode(code, lang)}</code></pre>
            </div>
          \`;
        } else if (part.trim()) {
          html += \`<div class="answer-text">\${escapeHtml(part.trim())}</div>\`;
        }
      }
      return html;
    }`;

const renderStartIdx = html.indexOf('function renderAnswerWithCode(answerText)');
if (renderStartIdx !== -1) {
  const renderEndIdx = html.indexOf('window.toggleDrawer = function', renderStartIdx);
  if (renderEndIdx !== -1) {
    html = html.substring(0, renderStartIdx) + newRenderFn.trim() + '\n\n    // Toggle Drawer for Answer\n    ' + html.substring(renderEndIdx);
    console.log("✓ Updated renderAnswerWithCode in index.html");
  }
}

// Update static counts: 76 -> 77
html = html.replace(/<span class="brand-tag">76 Questions/g, '<span class="brand-tag">77 Questions');
html = html.replace(/all 76 questions/g, 'all 77 questions');
html = html.replace(/all 76 senior iOS/g, 'all 77 senior iOS');
html = html.replace(/id="totalCount">76<\/span>/g, 'id="totalCount">77<\/span>');

fs.writeFileSync(INDEX_HTML_PATH, html, 'utf-8');
console.log('✓ index.html successfully updated and saved!');

// 3. Update QUESTIONS.md if it exists
if (fs.existsSync(QUESTIONS_MD_PATH)) {
  let md = fs.readFileSync(QUESTIONS_MD_PATH, 'utf-8');
  if (!md.includes('### `Q-77`')) {
    const mdBlock = `
---

### \`Q-77\` — Where do you store an AI API key for an iOS app?

- **Category:** \`Security, Auth & Compliance\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"The AI key stays on my server, the app sends the prompt with the user's access token, and the server checks limits, calls the AI provider, and returns only the answer."*

#### 📖 Detailed Answer

${newQuestion.answer}

#### 💻 Swift Code Example

\`\`\`swift
${newQuestion.codeExample}
\`\`\`
`;
    md += mdBlock;
    fs.writeFileSync(QUESTIONS_MD_PATH, md, 'utf-8');
    console.log('✓ Appended Q-77 to QUESTIONS.md');
  }
}
