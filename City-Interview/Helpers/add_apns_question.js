const fs = require('fs');
const path = require('path');

const QUESTIONS_JSON_PATH = path.join(__dirname, '../Resources/questions.json');
const INDEX_HTML_PATH = path.join(__dirname, '../index.html');
const QUESTIONS_MD_PATH = path.join(__dirname, '../QUESTIONS.md');

const newQuestion = {
  id: "Q-78",
  category: "Networking, APIs & Background Tasks",
  difficulty: "Advanced",
  question: "How does APNs work end to end?",
  interviewSentence: "The app gets a device token from APNs and gives it to my server, then my server sends the payload to APNs over HTTP/2, and APNs delivers it to the phone.",
  imageName: "apns_flow_diagram",
  answer: `APNs (Apple Push Notification service) is Apple's server that delivers push notifications to iPhones. Your app cannot receive a push straight from your own server, because the phone has no open connection to it. Instead, every iPhone keeps one secure, always-on connection to Apple, and all pushes travel through it. This is how chat messages, order updates, and reminders reach a user when the app is closed. It matters for any app with a backend that needs to reach the user.

Say it like this:

"There are three parties: my app, my server, and APNs. The flow has two phases, registration and delivery.

For registration, my app asks the user for permission, then calls registerForRemoteNotifications(). iOS contacts APNs, and APNs returns a device token. That token is an address for this app on this device. My app sends it to my server, and the server stores it with the user's ID. The token can change, for example after a restore or reinstall, so I send it to my server on every launch, and the server updates it.

For delivery, when something happens, my server builds a small JSON payload and sends an HTTP/2 request to APNs, with the device token in the URL. The server proves who it is with an auth key, a .p8 file from my Apple developer account, used to sign a short-lived JWT. The request also carries my app's bundle ID as the apns-topic. APNs checks the request and sends the push to the device over its connection. If the device is offline, APNs holds the push for a while, depending on the expiration I set.

On the phone, iOS shows the alert, or if the payload is a silent push with content-available, it wakes my app for a short time. When the user taps it, my app opens and gets the payload, so I can navigate to the right screen.

When something fails, APNs replies with an error, and I handle it. If the reply says the token is no longer valid, like 410 Unregistered, my server deletes that token, so it stops sending to a dead address."

The flow in one picture:

![APNs End-to-End Architecture & Flow Diagram](Resources/apns_flow_diagram.png)

\`\`\`
 REGISTRATION (once per launch)
 iOS App                      APNs                       My Server
    | 1. ask permission          |                            |
    | 2. register -------------->|                            |
    |<-- 3. device token --------|                            |
    | 4. send token + user id ------------------------------->| stores it

 DELIVERY (each notification)
 My Server                    APNs                       iPhone
    | 5. POST /3/device/<token>  |                            |
    |    + JWT + payload ------->|                            |
    |                            | 6. checks, finds device    |
    |                            |--------------------------->| 7. shows alert
    |<-- 8. 200 OK or error -----|                            |   or wakes the app
\`\`\`

1. Turn on the capability

\`\`\`
Xcode > Target > Signing & Capabilities > + Capability > Push Notifications
// This adds the aps-environment entitlement, without it registration fails
\`\`\`

2. Ask permission and register

\`\`\`swift
import UserNotifications                                          // gives us the notification permission API
import UIKit                                                      // gives us UIApplication

func setUpPush() async {
    let center = UNUserNotificationCenter.current()               // the system notification center
    let granted = (try? await center.requestAuthorization(        // show the permission popup
        options: [.alert, .sound, .badge]                         // ask for banners, sound, and badge numbers
    )) ?? false                                                   // treat an error as "not granted"
    guard granted else { return }                                 // user said no, stop here
    await MainActor.run {                                         // this call must run on the main thread
        UIApplication.shared.registerForRemoteNotifications()     // ask iOS to get a device token from APNs
    }
}
\`\`\`

3. Receive the device token

\`\`\`swift
// AppDelegate
func application(_ application: UIApplication,
                 didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02x", $0) }.joined() // turn the bytes into a hex string
    Task { try? await api.registerPushToken(token) }              // send it to my server, on every launch
}

func application(_ application: UIApplication,
                 didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("Push registration failed:", error)                     // for example: no capability, or no network
}
\`\`\`

4. Send the token to my server

\`\`\`swift
func registerPushToken(_ token: String, accessToken: String) async throws {
    var request = URLRequest(url: URL(string: "https://api.myapp.com/push-token")!) // my own endpoint
    request.httpMethod = "POST"                                   // sending data, so POST
    request.setValue("application/json", forHTTPHeaderField: "Content-Type") // the body is JSON
    request.setValue("Bearer \\(accessToken)", forHTTPHeaderField: "Authorization") // tells the server which user this is
    request.httpBody = try JSONEncoder().encode(["token": token]) // the device token
    _ = try await URLSession.shared.data(for: request)            // the server stores token + user id
}
\`\`\`

5. The server sends the push to APNs

\`\`\`bash
# JWT is signed with the .p8 key, and includes the Key ID and Team ID
curl --http2 \\
  --header "authorization: bearer $JWT" \\
  --header "apns-topic: com.mycompany.myapp" \\
  --header "apns-push-type: alert" \\
  --header "apns-priority: 10" \\
  --header "apns-expiration: 0" \\
  --data '{"aps":{"alert":{"title":"Order shipped","body":"Arrives tomorrow"},"sound":"default"},"orderId":"1234"}' \\
  https://api.push.apple.com/3/device/DEVICE_TOKEN
# For debug builds use api.sandbox.push.apple.com, because sandbox and production tokens are different
\`\`\`

6. The payload

\`\`\`json
{
  "aps": {
    "alert": { "title": "Order shipped", "body": "Arrives tomorrow" },
    "sound": "default",
    "badge": 1
  },
  "orderId": "1234"
}
\`\`\`
aps is the part iOS reads: the alert, the sound, and the badge.
orderId is my own custom data. My app reads it when the user taps the notification.
The whole payload is limited to 4 KB, so I send an ID and let the app fetch the details.

7. Handle the notification in the app

\`\`\`swift
extension AppDelegate: UNUserNotificationCenterDelegate {

    // The app is open: choose whether to still show the banner
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .sound]                                         // show a banner even while the app is in the foreground
    }

    // The user tapped the notification
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse) async {
        let info = response.notification.request.content.userInfo // the full payload
        if let orderId = info["orderId"] as? String {             // read my custom value
            router.openOrder(id: orderId)                         // go straight to the right screen
        }
    }
}
// Set this early, in didFinishLaunching:
// UNUserNotificationCenter.current().delegate = self             // so iOS knows where to send these callbacks
\`\`\`

8. Silent push (wake the app to fetch data)

\`\`\`swift
func application(_ application: UIApplication,
                 didReceiveRemoteNotification userInfo: [AnyHashable: Any]) async -> UIBackgroundFetchResult {
    let hasNew = await syncLatestData()                           // fetch fresh data, you get about 30 seconds
    return hasNew ? .newData : .noData                            // tell iOS what happened
}
// The payload is { "aps": { "content-available": 1 } } with apns-push-type: background
// Silent pushes are not guaranteed, and iOS may delay or drop them (see Q27)
\`\`\`

Quick steps to remember:

1. Permission: ask the user, then call registerForRemoteNotifications().
2. Device token: APNs gives it to the app, and the app sends it to my server.
3. Server sends: HTTP/2 request to APNs with the token, JWT, topic, and payload.
4. APNs delivers: to the phone, or holds it if the phone is offline.
5. App handles: show a banner, handle the tap, or wake silently.
6. Clean up: delete tokens that APNs reports as invalid.

Good to mention:

• Two environments: sandbox for debug builds, production for TestFlight and App Store builds. A token from one does not work in the other, and this is the most common cause of "push is not arriving".
• Auth methods: the .p8 token-based key works for all apps and does not expire. The older certificate method expires every year. I prefer the .p8 key.
• JWT rules: refresh the signed token at least every hour, and not more often than every 20 minutes, or APNs rejects it with TooManyProviderTokenUpdates.
• Common errors: 400 BadDeviceToken (wrong environment or bad token), 403 InvalidProviderToken (bad JWT), 410 Unregistered (app deleted, delete the token), 429 (too many pushes to one device).
• Rich notifications: add mutable-content: 1 and a Notification Service Extension to download an image or decrypt content before it is shown.
• Collapse ID: apns-collapse-id replaces an older notification with a new one, so the user does not see five "new message" banners.
• No guarantee: APNs is best-effort. Do not use a push as the only way to deliver important data, and always let the app fetch the real data from the server.
• Do not put private data in the payload. It passes through Apple's servers, so send an ID or an encrypted value.
• If a user turns off notifications, the token may still be valid, so check the permission with getNotificationSettings() before assuming the user will see the push.
• VoIP pushes use PushKit and a different topic, and must be reported to CallKit right away.

One-liner: The app gets a device token from APNs and gives it to my server, then my server sends the payload to APNs over HTTP/2, and APNs delivers it to the phone.

Memory trick: P-T-S-D-H → "Permission, Token to my server, Server calls APNs, Delivered to the phone, Handle the tap."`,
  codeExample: `// =========================================================================
// 🔔 SENIOR INTERVIEW ARCHITECTURE: Apple Push Notification service (APNs)
// =========================================================================
//
// 💡 INTERVIEW TALKING POINTS (Staff/Senior Level):
// • Persistent Socket: The device maintains a single persistent, encrypted TCP socket to APNs.
//   Individual apps do NOT maintain persistent connections, saving cellular radio power and battery.
// • Device Token Lifecycle: Device tokens are ephemeral per app/device install. Reinstalls,
//   device restores, or OS upgrades can rotate the token. Always register on launch and synchronize.
// • Modern HTTP/2 Provider API: Uses Token-based (.p8 JWT) auth. Replaced the legacy binary protocol
//   and legacy Feedback Service. Inactive tokens return HTTP 410 (Unregistered) immediately.
// • Notification Service Extension: Intercepts pushes with "mutable-content": 1 before display
//   for end-to-end decryption (e.g. Signal, WhatsApp) and rich media attachment downloads (images/video).

import Foundation
import UIKit
import UserNotifications

// MARK: - 1. Push Notification Coordinator (Clean Architecture)

@MainActor
final class PushNotificationManager: NSObject, ObservableObject {
    static let shared = PushNotificationManager()
    
    @Published private(set) var isRegistered = false
    @Published private(set) var currentDeviceToken: String?
    
    private let notificationCenter = UNUserNotificationCenter.current()
    private let backendClient: PushBackendClientProtocol
    
    init(backendClient: PushBackendClientProtocol = PushBackendClient()) {
        self.backendClient = backendClient
        super.init()
        notificationCenter.delegate = self
    }
    
    /// Requests user authorization and kicks off remote registration
    func requestAuthorizationAndRegister() async {
        do {
            let options: UNAuthorizationOptions = [.alert, .sound, .badge, .provisional]
            let granted = try await notificationCenter.requestAuthorization(options: options)
            
            guard granted else {
                print("⚠️ Push notification permission denied by user")
                return
            }
            
            // 💡 Must be dispatched on MainActor
            UIApplication.shared.registerForRemoteNotifications()
            self.isRegistered = true
        } catch {
            print("❌ Push authorization error: \\(error.localizedDescription)")
        }
    }
    
    /// Called from AppDelegate when APNs delivers the 32-byte binary token
    func handleDeviceToken(_ deviceTokenData: Data, userAuthToken: String) async {
        // Convert binary token bytes to hex string format required by APNs HTTP/2 path
        let tokenString = deviceTokenData.map { String(format: "%02.2hhx", $0) }.joined()
        self.currentDeviceToken = tokenString
        
        // 💡 Synchronize token with backend provider database
        do {
            try await backendClient.updateDeviceToken(tokenString, authToken: userAuthToken)
            print("✅ Device token successfully synchronized with backend: \\(tokenString)")
        } catch {
            print("❌ Failed to synchronize device token: \\(error)")
        }
    }
}

// MARK: - 2. UNUserNotificationCenterDelegate (Foreground & Interaction)

extension PushNotificationManager: UNUserNotificationCenterDelegate {
    
    /// 💡 Triggered when notification arrives while the app is in the FOREGROUND
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        let userInfo = notification.request.content.userInfo
        print("📨 Received push in foreground: \\(userInfo)")
        
        // Return .banner and .sound to display banner even while app is active
        return [.banner, .sound, .badge]
    }
    
    /// 💡 Triggered when user TAPS on a notification banner or lock screen alert
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo
        
        if let orderId = userInfo["orderId"] as? String {
            // Route user directly to feature screen
            print("🧭 Navigating to order: \\(orderId)")
        }
    }
}

// MARK: - 3. Notification Service Extension (Rich Media & Decryption)
// 💡 Add via: File > New > Target > Notification Service Extension

class NotificationService: UNNotificationServiceExtension {
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    
    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        guard let bestAttemptContent = bestAttemptContent else { return }
        
        // 1. Download media attachment (image/video thumbnail)
        if let attachmentURLString = bestAttemptContent.userInfo["mediaUrl"] as? String,
           let attachmentURL = URL(string: attachmentURLString) {
            
            Task {
                if let attachment = try? await downloadAttachment(for: attachmentURL) {
                    bestAttemptContent.attachments = [attachment]
                }
                contentHandler(bestAttemptContent)
            }
        } else {
            contentHandler(bestAttemptContent)
        }
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called if extension takes too long (~30s limit). Display fallback content immediately.
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
    
    private func downloadAttachment(for url: URL) async throws -> UNNotificationAttachment {
        let (tempURL, _) = try await URLSession.shared.download(from: url)
        let uniqueURL = FileManager.default.temporaryDirectory.appendingPathComponent(url.lastPathComponent)
        try? FileManager.default.removeItem(at: uniqueURL)
        try FileManager.default.moveItem(at: tempURL, to: uniqueURL)
        return try UNNotificationAttachment(identifier: "media", url: uniqueURL, options: nil)
    }
}

// MARK: - 4. Backend Client Protocol

protocol PushBackendClientProtocol {
    func updateDeviceToken(_ token: String, authToken: String) async throws
}

struct PushBackendClient: PushBackendClientProtocol {
    func updateDeviceToken(_ token: String, authToken: String) async throws {
        var req = URLRequest(url: URL(string: "https://api.myapp.com/v1/users/device-token")!)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \\(authToken)", forHTTPHeaderField: "Authorization")
        req.httpBody = try JSONEncoder().encode(["deviceToken": token, "platform": "iOS"])
        _ = try await URLSession.shared.data(for: req)
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

// Update TOPIC_CATEGORIES in index.html: add Q-78 to networking.questionIds
const topicsMarker = 'const TOPIC_CATEGORIES = ';
const topicsIdx = html.indexOf(topicsMarker);
if (topicsIdx !== -1) {
  const jsonStart = topicsIdx + topicsMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  let topics = JSON.parse(html.substring(jsonStart, nextSemi));
  const netTopic = topics.find(t => t.id === 'networking');
  if (netTopic && !netTopic.questionIds.includes(newQuestion.id)) {
    netTopic.questionIds.push(newQuestion.id);
    html = html.substring(0, jsonStart) + JSON.stringify(topics) + html.substring(nextSemi);
    console.log(`✓ Added ${newQuestion.id} to TOPIC_CATEGORIES networking.questionIds`);
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
      docId: "networking-architecture",
      title: "Networking Architecture Decision Table & 4 Pillars",
      filename: "Networking-ComparisonNotes.md",
      icon: "🌐"
    }
  ];
  html = html.substring(0, jsonStart) + JSON.stringify(docs) + html.substring(nextSemi);
  console.log(`✓ Added ${newQuestion.id} to QUESTION_TO_DOCS`);
}

// Update renderAnswerWithCode in index.html to support markdown image tags ![alt](src)
const newRenderFn = `    // Render answer text with embedded syntax-highlighted code blocks & diagrams
    function renderAnswerWithCode(answerText) {
      if (!answerText) return '';
      if (!answerText.includes('\`\`\`') && !answerText.includes('![')) {
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
          let prose = part.trim();
          if (prose.includes('![')) {
            const imgRegex = /!\\[(.*?)\\]\\((.*?)\\)/g;
            let lastIdx = 0;
            let match;
            let proseHtml = '';
            while ((match = imgRegex.exec(prose)) !== null) {
              const textBefore = prose.substring(lastIdx, match.index).trim();
              if (textBefore) {
                proseHtml += \`<div class="answer-text">\${escapeHtml(textBefore)}</div>\`;
              }
              const alt = match[1];
              const src = match[2];
              proseHtml += \`
                <div class="answer-diagram-box" style="margin: 1.25rem 0; border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-card); text-align: center; padding: 1rem; box-shadow: var(--shadow-sm);">
                  <img src="\${escapeHtml(src)}" alt="\${escapeHtml(alt)}" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,0.12);" />
                  <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.65rem; font-weight: 600;">🖼️ \${escapeHtml(alt)}</div>
                </div>
              \`;
              lastIdx = imgRegex.lastIndex;
            }
            const textAfter = prose.substring(lastIdx).trim();
            if (textAfter) {
              proseHtml += \`<div class="answer-text">\${escapeHtml(textAfter)}</div>\`;
            }
            html += proseHtml;
          } else {
            html += \`<div class="answer-text">\${escapeHtml(prose)}</div>\`;
          }
        }
      }
      return html;
    }`;

const renderStartIdx = html.indexOf('function renderAnswerWithCode(answerText)');
if (renderStartIdx !== -1) {
  const renderEndIdx = html.indexOf('window.toggleDrawer = function', renderStartIdx);
  if (renderEndIdx !== -1) {
    html = html.substring(0, renderStartIdx) + newRenderFn.trim() + '\n\n    // Toggle Drawer for Answer\n    ' + html.substring(renderEndIdx);
    console.log("✓ Updated renderAnswerWithCode with image diagram support in index.html");
  }
}

// Update static counts: 77 -> 78
html = html.replace(/<span class="brand-tag">77 Questions/g, '<span class="brand-tag">78 Questions');
html = html.replace(/all 77 questions/g, 'all 78 questions');
html = html.replace(/all 77 senior iOS/g, 'all 78 senior iOS');
html = html.replace(/id="totalCount">77<\/span>/g, 'id="totalCount">78<\/span>');

fs.writeFileSync(INDEX_HTML_PATH, html, 'utf-8');
console.log('✓ index.html successfully updated and saved!');

// 3. Update QUESTIONS.md
if (fs.existsSync(QUESTIONS_MD_PATH)) {
  let md = fs.readFileSync(QUESTIONS_MD_PATH, 'utf-8');
  if (!md.includes('### `Q-78`')) {
    const mdBlock = `
---

### \`Q-78\` — How does APNs work end to end?

- **Category:** \`Networking, APIs & Background Tasks\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"The app gets a device token from APNs and gives it to my server, then my server sends the payload to APNs over HTTP/2, and APNs delivers it to the phone."*

#### 📖 Detailed Answer

${newQuestion.answer}

#### 💻 Swift Code Example

\`\`\`swift
${newQuestion.codeExample}
\`\`\`
`;
    md += mdBlock;
    fs.writeFileSync(QUESTIONS_MD_PATH, md, 'utf-8');
    console.log('✓ Appended Q-78 to QUESTIONS.md');
  }
}
