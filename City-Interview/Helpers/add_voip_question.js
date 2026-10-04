const fs = require('fs');
const path = require('path');

const QUESTIONS_JSON_PATH = path.join(__dirname, '../Resources/questions.json');
const INDEX_HTML_PATH = path.join(__dirname, '../index.html');
const GENERATED_DOCS_PATH = path.join(__dirname, '../Helpers/generated_docs.json');
const QUESTIONS_MD_PATH = path.join(__dirname, '../QUESTIONS.md');

const voipQuestion = {
  id: "Q-36",
  category: "Networking, APIs & Background Tasks",
  difficulty: "Advanced",
  question: "How does a VoIP call work between two iOS devices?",
  interviewSentence: "A VoIP call separates signaling from media: signaling coordinates call setup, PushKit wakes the callee in the background, CallKit manages the native call UI and audio exclusivity, and media streams peer-to-peer via WebRTC using STUN and TURN for NAT traversal.",
  imageName: "voip_call_flow_diagram",
  answer: `A VoIP call is a phone call that travels over the internet instead of the mobile network. It is used in apps like WhatsApp, FaceTime, Zoom, and enterprise phone apps. Four systems work together:

• The two apps (caller A and callee B).
• A signaling server, which sets up and ends the call. It carries only small control messages, such as "A wants to call B", and it does not carry the voice.
• APNs and PushKit, which wake B's app when it is closed.
• CallKit, which gives the call the normal iPhone call screen and audio priority.

The voice itself travels in a separate path, directly between the two phones if possible.

Say it like this:

"A VoIP call has two parts: signaling and media. Signaling is the setup conversation. Media is the actual voice. They use different paths.

Before any call, both apps log in to my signaling server, and both send their VoIP push token to it. That is how the server can reach a phone whose app is closed.

When A starts a call, the app tells CallKit, so the system treats it as a real call. Then A sends a call request to the server, with an offer that describes how A can send and receive audio. The server looks up B. If B's app is not running, the server sends a VoIP push through APNs. iOS wakes B's app, and B must report the incoming call to CallKit right away, so the system shows the full call screen. B's app then connects to the server and replies 'ringing', so A hears a ring.

When B accepts, B sends back an answer. Now both phones need a way to reach each other. They find their public addresses with a STUN server, and try a direct connection. If a firewall blocks it, they use a TURN server, which relays the audio. This process is called ICE. Once connected, the voice flows as encrypted audio packets, and CallKit activates the audio session.

During the call, I handle mute, hold, and network changes, such as Wi-Fi to cellular. When someone hangs up, the app sends an end message through the server, tells CallKit, stops the audio, and releases everything."

The flow diagram:

![VoIP Call Architecture & Flow Diagram](Resources/voip_call_flow_diagram.png)

\`\`\`
  Caller Device             VoIP Backend Server (SIP/Signaling)             APNs                     iOS Device (Callee)
       |                                    |                                 |                               |
       | 1. Incoming call (SIP INVITE)      |                                 |                               |
       |----------------------------------->|                                 |                               |
       |                                    | 2. Server sends VoIP push       |                               |
       |                                    |-------------------------------->| 3. Wakes app via PushKit      |
       |                                    |                                 |------------------------------>| [PushKit]
       |                                    |                                 |                               |     |
       |                                    |                                 |                               | 4. Report to CallKit
       |                                    |                                 |                               |     v
       |                                    |                                 |                               | [CallKit Screen]
       |                                    |                                 |                               |     | 5. User answers
       |                                    |                                 |                               |     v
       |                                    |                                 |                               | [AVAudioSession]
       |<====================================================================================================>|
       |                   6. Direct Media Stream (WebRTC / DTLS-SRTP / P2P via STUN/TURN)                    |
\`\`\`

Step by step

Before any call (setup)
1. Both users log in. Each app connects to the signaling server and sends its VoIP push token, so the server can wake the phone later.

Starting the call (caller A)
2. A taps the call button. The app asks CallKit to start an outgoing call. The system now treats it as a real call, with the call UI and audio priority.
3. A's app creates an offer. It describes which audio codecs A supports and how to reach A's phone.
4. A sends the call request with the offer to the signaling server.

Reaching the callee (callee B)
5. The server looks up B. If B's app is open and connected, the server sends the request directly. Usually the app is closed, so the server sends a VoIP push to APNs, using B's VoIP token.
6. APNs delivers it, and iOS wakes B's app in the background.
7. B's app must report the incoming call to CallKit immediately. The system then shows the full-screen incoming call UI, even on a locked phone. If the app skips this step, iOS kills it and may stop sending VoIP pushes.
8. B's app connects to the signaling server and replies "ringing". A hears the ring tone.

Answering
9. B taps Accept. The app creates an answer, which says which codec B will use, and sends it through the server to A.
10. Both phones now know how to talk.

Connecting the audio
11. Each phone finds its public address with a STUN server, and shares its possible routes with the other. This is called ICE.
12. The phones try the best route first, which is a direct peer-to-peer link. If a firewall or strict network blocks it, they fall back to a TURN server that relays the audio.
13. The phones set up encryption (DTLS-SRTP) so no one in the middle can listen.

During the call
14. Voice travels in small encrypted packets in both directions. CallKit activates the audio session, so the microphone and speaker work.
15. The apps handle mute, hold, speaker, and Bluetooth through CallKit. If the network changes, for example Wi-Fi to cellular, the apps run ICE again to find a new route.

Ending the call
16. Either user hangs up. That app sends an end message through the signaling server and tells CallKit the call is over.
17. The other app receives it, ends the call in CallKit, stops the audio, closes the connection, and releases resources.

Other endings to handle:
• B declines: B sends a reject message, and A shows "declined".
• B is busy: the server or B's app replies "busy".
• No answer: the server times out after about 30 to 60 seconds, and both sides record a missed call.
• Network drops: the call goes into a reconnecting state, then ends after a timeout.

Quick steps to remember:
1. Register: both apps log in and give the server their VoIP tokens.
2. Call: A starts via CallKit and sends an offer.
3. Wake: the server sends a VoIP push, and B reports to CallKit at once.
4. Answer: B accepts and sends an answer.
5. Connect: STUN and TURN find a route (ICE), then the voice flows encrypted.
6. End: a hang-up message through the server, then clean up.

Good to mention (Staff-Level Interview Points):
• Mandatory CallKit Rule (iOS 13+): Every incoming VoIP push delivered via PKPushRegistry MUST be reported to CallKit using reportNewIncomingCall(with:update:completion:) immediately. iOS gives the app approximately 5 seconds. If this step is omitted, iOS terminates the process immediately and revokes the VoIP push entitlement for the app.
• PushKit vs Standard APNs: VoIP pushes bypass Do Not Disturb and Low Power Mode, do not display system notification banners by themselves, and wake the app in the background with high priority to prepare the call engine.
• Signaling vs Media Separation: The signaling channel (SIP over TLS, WebSocket, or gRPC) only exchanges session descriptions (SDP offers/answers). It never carries voice packets, keeping backend server bandwidth negligible.
• NAT Traversal (STUN, TURN, ICE):
  - STUN (Session Traversal Utilities for NAT): Discovers public IP and port mappings.
  - TURN (Traversal Using Relays around NAT): Acts as media relay when symmetric NAT prevents direct peer-to-peer connection.
  - ICE (Interactive Connectivity Establishment): Systematically probes all candidate address pairs to select the lowest-latency, working connection.
• AVAudioSession & CallKit Synchronization: Never activate AVAudioSession manually during call setup. Wait for the CXProviderDelegate provider(_:didActivate:) callback to ensure the system has relinquished audio hardware exclusivity to your app.
• Media Encryption (DTLS-SRTP): Audio and video packets are encrypted end-to-end using Secure Real-Time Transport Protocol (SRTP), with keys exchanged via Datagram Transport Layer Security (DTLS).

One-liner: Signaling sets up the call through the server, PushKit wakes the device, CallKit manages native call UI and audio, and media streams peer-to-peer via WebRTC (ICE/STUN/TURN).

Memory trick: S-P-C-M → "Signaling sets up, PushKit wakes up, CallKit displays, Media flows."`,
  codeExample: `// =========================================================================
// 📞 SENIOR INTERVIEW ARCHITECTURE: VoIP Calling with CallKit & PushKit
// =========================================================================
//
// 💡 INTERVIEW TALKING POINTS (Staff/Senior Level):
// • Separation of Planes: Signaling (Call setup/SIP/WebSocket) vs Media (WebRTC/RTP audio).
// • Mandatory iOS 13+ CallKit Rule: Every incoming VoIP push from PushKit MUST be reported
//   to CallKit via \`reportNewIncomingCall(with:update:completion:)\` immediately.
//   Failing to report results in iOS terminating the app and revoking PushKit privileges.
// • Audio Session Exclusivity: Never activate AVAudioSession manually during call setup.
//   Wait for CXProviderDelegate \`provider(_:didActivate:)\` callback to guarantee exclusivity.
// • NAT Traversal (ICE / STUN / TURN):
//   - STUN: Discovers device public IP:port mapping.
//   - TURN: Relays media packets when symmetric NAT blocks peer-to-peer UDP.
//   - ICE: Gathers candidates and negotiates the lowest-latency encrypted path.

import Foundation
import PushKit
import CallKit
import AVFoundation

// MARK: - 1. VoIP Call Manager (PushKit & CallKit Orchestration)

@MainActor
final class VoIPCallManager: NSObject, ObservableObject {
    static let shared = VoIPCallManager()
    
    // CallKit Controllers
    private let callController = CXCallController()
    private var provider: CXProvider!
    
    // PushKit Registry
    private var voipRegistry: PKPushRegistry!
    
    // Active Call State
    @Published private(set) var activeCallUUID: UUID?
    
    override init() {
        super.init()
        setupCallKit()
        setupPushKit()
    }
    
    // MARK: - CallKit Setup
    private func setupCallKit() {
        let configuration = CXProviderConfiguration(localizedName: "MyBank Talk")
        configuration.supportsVideo = false
        configuration.maximumCallGroups = 1
        configuration.maximumCallsPerCallGroup = 1
        configuration.supportedHandleTypes = [.generic, .phoneNumber]
        configuration.iconTemplateImageData = UIImage(systemName: "phone.fill")?.pngData()
        
        provider = CXProvider(configuration: configuration)
        provider.setDelegate(self, queue: nil) // Dispatched on main queue
    }
    
    // MARK: - PushKit Setup
    private func setupPushKit() {
        voipRegistry = PKPushRegistry(queue: .main)
        voipRegistry.delegate = self
        voipRegistry.desiredPushTypes = [.voIP]
    }
    
    // MARK: - Outgoing Call (Caller A)
    func startOutgoingCall(to recipient: String) async throws {
        let uuid = UUID()
        let handle = CXHandle(type: .generic, value: recipient)
        let startAction = CXStartCallAction(call: uuid, handle: handle)
        let transaction = CXTransaction(action: startAction)
        
        try await callController.request(transaction)
        self.activeCallUUID = uuid
        // App now generates SDP offer and transmits to Signaling Server via WebSocket
    }
    
    // MARK: - End Call
    func endCurrentCall() async throws {
        guard let uuid = activeCallUUID else { return }
        let endAction = CXEndCallAction(call: uuid)
        let transaction = CXTransaction(action: endAction)
        
        try await callController.request(transaction)
    }
}

// MARK: - 2. PKPushRegistryDelegate (Receiving VoIP Wakeup)

extension VoIPCallManager: PKPushRegistryDelegate {
    
    // 💡 Registered device token for VoIP pushes (distinct from standard APNs token)
    func pushRegistry(
        _ registry: PKPushRegistry,
        didUpdate pushCredentials: PKPushCredentials,
        for type: PKPushType
    ) {
        let hexToken = pushCredentials.token.map { String(format: "%02.2hhx", $0) }.joined()
        print("📲 VoIP Push Token Updated: \\(hexToken)")
        // Transmit token to Signaling Server: ties user ID to VoIP wakeup token
    }
    
    // ⚠️ CRITICAL INTERVIEW RULE (iOS 13+):
    // You MUST report the call to CallKit synchronously inside this delegate method.
    // iOS gives you approximately 5 seconds. If you fail, the process will crash.
    func pushRegistry(
        _ registry: PKPushRegistry,
        didReceiveIncomingPushWith payload: PKPushPayload,
        for type: PKPushType
    ) async {
        guard type == .voIP else { return }
        
        let dict = payload.dictionaryPayload
        let callerName = dict["callerName"] as? String ?? "Unknown Caller"
        let callUUIDString = dict["callUUID"] as? String ?? UUID().uuidString
        let callUUID = UUID(uuidString: callUUIDString) ?? UUID()
        
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: callerName)
        update.localizedCallerName = callerName
        update.hasVideo = false
        
        do {
            // 💡 Report to CallKit: triggers full-screen native incoming call UI
            try await provider.reportNewIncomingCall(with: callUUID, update: update)
            self.activeCallUUID = callUUID
            
            // Connect to signaling server and send 'ringing' acknowledgment
        } catch {
            print("❌ Failed to report incoming call to CallKit: \\(error)")
        }
    }
}

// MARK: - 3. CXProviderDelegate (Handling User Actions from Native Call UI)

extension VoIPCallManager: CXProviderDelegate {
    
    func providerDidReset(_ provider: CXProvider) {
        // Stop audio engine, release WebRTC peer connections
        activeCallUUID = nil
    }
    
    // User tapped "Accept" on lock screen / banner
    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        // 1. Send SDP answer back to caller via Signaling Server
        // 2. Start ICE candidate exchange (STUN/TURN)
        action.fulfill()
    }
    
    // User tapped "Decline" or hung up
    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        // Send SIP BYE or reject message to signaling server
        activeCallUUID = nil
        action.fulfill()
    }
    
    // 💡 AUDIO SESSION ACTIVATION:
    // CallKit grants high-priority audio hardware access here
    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        do {
            try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .allowBluetoothA2DP])
            try audioSession.setActive(true)
            // Start WebRTC audio processing & microphone capture
        } catch {
            print("❌ Failed to configure AVAudioSession: \\(error)")
        }
    }
    
    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        // Stop microphone and speaker playback
        try? audioSession.setActive(false)
    }
}`
};

// 1. Load questions and insert at position 35 (index 35 -> 1-based Q-36)
const questions = JSON.parse(fs.readFileSync(QUESTIONS_JSON_PATH, 'utf-8'));

// Insert voipQuestion at index 35 (right after Q-35 APNs)
questions.splice(35, 0, voipQuestion);

// Build idMap: oldId -> newId
const idMap = {};
questions.forEach((q, idx) => {
  const num = idx + 1;
  const newId = 'Q-' + (num < 10 ? '0' + num : num);
  idMap[q.id] = newId;
  q.id = newId;
});

console.log(`Reordered ${questions.length} questions.`);
console.log(`Q-35: ${questions[34].id} - "${questions[34].question}"`);
console.log(`Q-36 (VoIP): ${questions[35].id} - "${questions[35].question}"`);
console.log(`Q-37 (Build time): ${questions[36].id} - "${questions[36].question}"`);
console.log(`Q-79 (AI API key): ${questions[78].id} - "${questions[78].question}"`);

fs.writeFileSync(QUESTIONS_JSON_PATH, JSON.stringify(questions, null, 2) + '\n', 'utf-8');
console.log('✓ questions.json successfully updated.');

// 2. Update index.html
let html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

// Update QUESTIONS array
const qMarker = 'const QUESTIONS = ';
const qIdx = html.indexOf(qMarker);
if (qIdx !== -1) {
  const jsonStart = qIdx + qMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  html = html.substring(0, jsonStart) + JSON.stringify(questions) + html.substring(nextSemi);
  console.log('✓ Updated QUESTIONS array in index.html');
}

// Update TOPIC_CATEGORIES
const topicsMarker = 'const TOPIC_CATEGORIES = ';
const topicsIdx = html.indexOf(topicsMarker);
if (topicsIdx !== -1) {
  const jsonStart = topicsIdx + topicsMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  let topics = JSON.parse(html.substring(jsonStart, nextSemi));
  
  topics.forEach(t => {
    t.questionIds = t.questionIds.map(qid => idMap[qid] || qid);
    if (t.id === 'networking' && !t.questionIds.includes('Q-36')) {
      t.questionIds.push('Q-36');
    }
    t.questionIds.sort((a, b) => parseInt(a.replace('Q-', ''), 10) - parseInt(b.replace('Q-', ''), 10));
  });
  
  html = html.substring(0, jsonStart) + JSON.stringify(topics) + html.substring(nextSemi);
  console.log('✓ Updated TOPIC_CATEGORIES in index.html');
}

// Update QUESTION_TO_DOCS
const docsMarker = 'const QUESTION_TO_DOCS = ';
const docsIdx = html.indexOf(docsMarker);
if (docsIdx !== -1) {
  const jsonStart = docsIdx + docsMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  let docs = JSON.parse(html.substring(jsonStart, nextSemi));
  
  const newDocs = {};
  for (const [oldQId, docArray] of Object.entries(docs)) {
    const newQId = idMap[oldQId] || oldQId;
    newDocs[newQId] = docArray;
  }
  newDocs['Q-36'] = [
    {
      docId: "networking-architecture",
      title: "Networking Architecture Decision Table & 4 Pillars",
      filename: "Networking-ComparisonNotes.md",
      icon: "🌐"
    }
  ];
  
  html = html.substring(0, jsonStart) + JSON.stringify(newDocs) + html.substring(nextSemi);
  console.log('✓ Updated QUESTION_TO_DOCS in index.html');
}

// Update static counts: 78 -> 79
html = html.replace(/<span class="brand-tag">78 Questions/g, '<span class="brand-tag">79 Questions');
html = html.replace(/all 78 questions/g, 'all 79 questions');
html = html.replace(/all 78 senior iOS/g, 'all 79 senior iOS');
html = html.replace(/id="totalCount">78<\/span>/g, 'id="totalCount">79<\/span>');

fs.writeFileSync(INDEX_HTML_PATH, html, 'utf-8');
console.log('✓ index.html successfully saved.');

// 3. Update generated_docs.json
if (fs.existsSync(GENERATED_DOCS_PATH)) {
  const genDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));
  if (genDocs.MODULE_DOCS) {
    genDocs.MODULE_DOCS.forEach(doc => {
      if (doc.relatedQuestions) {
        doc.relatedQuestions = doc.relatedQuestions.map(qid => idMap[qid] || qid);
        doc.relatedQuestions.sort((a, b) => parseInt(a.replace('Q-', ''), 10) - parseInt(b.replace('Q-', ''), 10));
      }
    });
    fs.writeFileSync(GENERATED_DOCS_PATH, JSON.stringify(genDocs, null, 2) + '\n', 'utf-8');
    console.log('✓ Helpers/generated_docs.json successfully updated.');
  }
}

// 4. Update QUESTIONS.md
if (fs.existsSync(QUESTIONS_MD_PATH)) {
  const topicHeaders = [
    { title: "## 📌 Architecture & Design Patterns (Q-01 – Q-05)", ids: ["Q-01","Q-02","Q-03","Q-04","Q-05"] },
    { title: "## ⚡ Swift Concurrency & Multithreading (Q-06 – Q-12)", ids: ["Q-06","Q-07","Q-08","Q-09","Q-10","Q-11","Q-12"] },
    { title: "## 🚀 Core Swift & Language Internals (Q-13 – Q-18)", ids: ["Q-13","Q-14","Q-15","Q-16","Q-17","Q-18"] },
    { title: "## 🎨 SwiftUI & UIKit Layout (Q-19 – Q-28)", ids: ["Q-19","Q-20","Q-21","Q-22","Q-23","Q-24","Q-25","Q-26","Q-27","Q-28"] },
    { title: "## 🌊 Combine & Reactive Streams (Q-29)", ids: ["Q-29"] },
    { title: "## 🌐 Networking, APIs & Background Tasks (Q-30 – Q-36)", ids: ["Q-30","Q-31","Q-32","Q-33","Q-34","Q-35","Q-36"] },
    { title: "## 📦 Modularity & Launch Performance (Q-37 – Q-43)", ids: ["Q-37","Q-38","Q-39","Q-40","Q-41","Q-42","Q-43"] },
    { title: "## 💾 Data Persistence & Memory Management (Q-44 – Q-47)", ids: ["Q-44","Q-45","Q-46","Q-47"] },
    { title: "## 🔒 Security, Auth & Compliance (Q-48 – Q-56, Q-77 – Q-79)", ids: ["Q-48","Q-49","Q-50","Q-51","Q-52","Q-53","Q-54","Q-55","Q-56","Q-77","Q-78","Q-79"] },
    { title: "## 🏛️ System Design & Mobile Architecture (Q-57 – Q-58)", ids: ["Q-57","Q-58"] },
    { title: "## 🧪 Testing, CI/CD & AI Engineering (Q-59 – Q-66)", ids: ["Q-59","Q-60","Q-61","Q-62","Q-63","Q-64","Q-65","Q-66"] },
    { title: "## 👔 Engineering Leadership & Operations (Q-67 – Q-68)", ids: ["Q-67","Q-68"] },
    { title: "## 🧠 Memory Management (Q-69 – Q-76)", ids: ["Q-69","Q-70","Q-71","Q-72","Q-73","Q-74","Q-75","Q-76"] }
  ];

  let mdContent = `# 📱 iOS Senior & Staff Interview Question Bank

> A comprehensive, senior & staff-level revision suite for 79 iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, UICollectionView Diffable Data Sources & Compositional Layouts, Background Execution & State Restoration, Performance Profiling & Instruments, 60/120fps Scroll Hitch Elimination, Scalable Image Caching, Keychain Secrets Management, OAuth 2.0 PKCE & Token Rotation, Production Crash Log Triage & Symbolication, Memory Management, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.

## 📊 Overview

| Category / Topic | Questions | Key Coverage |
|---|:---:|---|
| **Architecture & Design Patterns** | \`5\` | Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles. |
| **Swift Concurrency & Multithreading** | \`7\` | Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions. |
| **Core Swift & Language Internals** | \`6\` | Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops. |
| **SwiftUI & UIKit Layout** | \`10\` | Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), iPad adaptive layouts, internationalization & RTL, UICollectionView diffable data sources & compositional layouts, atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, and UIKit interoperability. |
| **Combine & Reactive Streams** | \`1\` | Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles. |
| **Networking, APIs & Background Tasks** | \`7\` | URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, APNs architecture, VoIP PushKit & CallKit, Notification Service Extensions, and BGTaskScheduler. |
| **Modularity & Launch Performance** | \`7\` | SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling. |
| **Data Persistence & Memory Management** | \`4\` | Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival. |
| **Security, Auth & Compliance** | \`12\` | Keychain vs Secure Enclave, token storage CRUD, OAuth 2.0 PKCE & token rotation, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR). |
| **System Design & Mobile Architecture** | \`2\` | End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution. |
| **Testing, CI/CD & AI Engineering** | \`8\` | Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems. |
| **Engineering Leadership & Operations** | \`2\` | Production incident triage, crash log analysis & dSYM symbolication, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern. |
| **Memory Management** | \`8\` | ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit. |
| **Total** | **\`79\`** | Complete Senior & Staff iOS Interview Curriculum |

---
`;

  const questionMap = {};
  questions.forEach(q => { questionMap[q.id] = q; });

  topicHeaders.forEach(section => {
    mdContent += `\n${section.title}\n\n`;
    section.ids.forEach(qid => {
      const q = questionMap[qid];
      if (!q) return;

      mdContent += `### \`${q.id}\` — ${q.question}\n\n`;
      mdContent += `- **Category:** \`${q.category}\`\n\n`;

      if (q.interviewSentence) {
        mdContent += `> [!TIP]\n> **🗣️ Interview Pitch (Say it like this):**  \n> *"${q.interviewSentence}"*\n\n`;
      }

      mdContent += `#### 📖 Detailed Answer\n\n${q.answer}\n\n`;

      if (q.codeExample) {
        mdContent += `#### 💻 Swift Code Example\n\n\`\`\`swift\n${q.codeExample}\n\`\`\`\n\n`;
      }

      mdContent += `---\n\n`;
    });
  });

  fs.writeFileSync(QUESTIONS_MD_PATH, mdContent, 'utf-8');
  console.log('✓ QUESTIONS.md successfully re-indexed and written.');
}
