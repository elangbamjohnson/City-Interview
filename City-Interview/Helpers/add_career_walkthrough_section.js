const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '../Resources/questions.json');
const indexPath = path.join(__dirname, '../index.html');
const mdPath = path.join(__dirname, '../QUESTIONS.md');
const genDocsPath = path.join(__dirname, '../Helpers/generated_docs.json');

const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
let html = fs.readFileSync(indexPath, 'utf8');
let md = fs.readFileSync(mdPath, 'utf8');
const genDocs = JSON.parse(fs.readFileSync(genDocsPath, 'utf8'));

console.log('Current questions count:', questions.length);
if (questions.length !== 89) {
  console.error('Expected 89 questions, found:', questions.length);
  process.exit(1);
}

// 1. Shift IDs of all 89 questions (Q-01 -> Q-02, ..., Q-89 -> Q-90)
for (let i = 0; i < questions.length; i++) {
  const currentNum = parseInt(questions[i].id.replace('Q-', ''), 10);
  const newNum = currentNum + 1;
  questions[i].id = 'Q-' + String(newNum).padStart(2, '0');
}

const newQ01 = {
  id: "Q-01",
  category: "Career Narrative & Leadership Walkthrough",
  difficulty: "Staff",
  question: "Walk me through your career in 2 minutes?",
  interviewSentence: "I'm an iOS engineer with 18+ years of experience across low-level VoIP (PJSIP), offline enterprise/consumer apps (FordPass, Domino's), and enterprise calling platforms at Neurealm/Avaya where I architected Clean Architecture + Swift Concurrency, increasing crash-free sessions to 99% and cutting build times by up to 70%—now positioning for a Staff-level role owning technical direction at scale. (Memory trick: V-O-F-L-N → 'VoIP, Offline apps, Ford & CI/CD, Lead at Avaya, Now Staff role.')",
  answer: `"I'm an iOS engineer with more than 18 years of experience. I started in 2008 with VoIP, building SIP softphone apps at Adore Infotech and then Ascent Telecom, using the PJSIP library. That gave me a strong base in networking, audio, and low-level code. I even modified PJSIP at the C level.

From 2011, I moved to enterprise and consumer apps, at HELM360 and then Copper Mobile. I built an offline-capable iPad app for Thomson Reuters, and I worked on consumer apps like Domino's, with voice ordering, and MyLife. That is where I learned Core Data, offline storage, and syncing.

In 2014, I joined Cognizant in the US and worked on FordPass for Ford. I shipped remote vehicle control, a parking locator, and wallet integration, and I built the CI/CD pipelines that cut release time from days to minutes. I was also the tech lead and scrum master on the AutoZone retail app.

After that, I spent two years freelancing and building my skills. In 2021, I joined Neurealm as Lead iOS Engineer and architected Avaya Workplace and the Spaces SDK, which is calling and video conferencing for enterprise users. I used Clean Architecture with MVVM, and I moved the call layer to Swift Concurrency with actors, which removed the race conditions. Crash-free sessions went from 96 to 99 percent. I also cut build and deploy time by 30 to 70 percent, and I mentored four to five developers.

So across my career, I have worked on large consumer and enterprise apps, with a focus on reliability, architecture, and team leadership. Now I'm looking for a Staff-level role, where I can own the technical direction of a consumer app at scale."

---

### How the Two Minutes Are Split (Execution Blueprint)

| Segment | Duration | Focus | What to Say |
| :--- | :---: | :--- | :--- |
| **1. Opening** | **10s** | Total tenure & root specialization | 18+ years of experience; foundational start in 2008 building low-level SIP/VoIP softphones using PJSIP. |
| **2. Early Career** | **25s** | C internals to offline enterprise apps | C-level PJSIP modifications, then moving to Copper Mobile: Thomson Reuters offline iPad app, Domino's voice ordering, Core Data syncing. |
| **3. Enterprise Scale** | **25s** | Consumer scale & CI/CD automation | Cognizant (US): FordPass connected vehicle features (remote control, parking, wallet), CI/CD cutting releases from days to minutes; Tech Lead on AutoZone. |
| **4. Lead Architect** | **40s** | High-impact numbers & modern architecture | Neurealm / Avaya Workplace & Spaces SDK: Clean Architecture + MVVM, Swift Concurrency/actors eliminating races, **96% $\\rightarrow$ 99% crash-free rate**, **30% – 70% build acceleration**, mentoring 4-5 engineers. |
| **5. Closing Pitch** | **20s** | The common thread & target role | Reliability, architecture, and leadership across consumer & enterprise apps. Ready for a Staff-level role owning technical direction at scale. |

---

### Chronological Career Evolution (2008 – Present)

| Period | Company / Client | Role | Core Tech Stack | High-Impact Deliverables |
| :--- | :--- | :--- | :--- | :--- |
| **2008 – 2011** | **Adore Infotech & Ascent Telecom** | iOS / VoIP Engineer | Objective-C, C, PJSIP, SIP, RTP, CoreAudio | Built enterprise SIP softphones from scratch. Customized PJSIP at the C layer for low-bandwidth codec negotiation and packet-loss concealment. |
| **2011 – 2014** | **HELM360 & Copper Mobile** | Senior iOS Developer | Objective-C, Core Data, REST, SQLite, Voice SDKs | Built Thomson Reuters offline-capable iPad reporting tool; delivered Domino's consumer app with voice-assisted ordering and real-time order tracker. |
| **2014 – 2019** | **Cognizant (USA)** *(Ford & AutoZone)* | Senior iOS Lead / Scrum Master | Swift, Objective-C, Jenkins, Fastlane, Bluetooth, CoreBluetooth | Shipped FordPass vehicle remote control, parking locator, and digital wallet. Engineered automated CI/CD pipelines reducing deployment from days to minutes. Led AutoZone retail app team. |
| **2019 – 2021** | **Independent Consulting** | Principal iOS Consultant | Swift, Architecture Audits, Modern Concurrency | Independent consulting, skills modernization (SwiftUI, Combine, early async/await), and architectural advisory for early-stage products. |
| **2021 – Present** | **Neurealm** *(Avaya Workplace & Spaces)* | Lead iOS Engineer / Architect | Swift, Swift Concurrency (Actors), Clean Architecture, WebRTC, SPM | Architected Avaya Workplace and Spaces SDK. Migrated call pipeline to Swift Actors, eliminating race conditions and boosting **crash-free rate from 96% to 99%**. Slashed build/deploy times by **30% – 70%**. Mentored 4–5 engineers. |

---

### Good to Mention (Staff-Level Interview Tactics)

1. **Lead with Hard Numbers:**
   Metrics like *"crash-free sessions jumped from 96% to 99%"* and *"build times dropped by 30% to 70%"* anchor your seniority. Data sticks in the interviewer's memory far longer than vague phrases like *"improved app performance"*.
2. **Weight the Most Recent Tenure Heavily:**
   Spend 40 seconds (the largest block) on Neurealm/Avaya. Modern interviewers care most about how you write code today (Swift Concurrency, Actors, Clean Architecture) and how you lead teams.
3. **Address Independent Consulting Calmly in One Breath:**
   Summarize the 2019–2021 period in a single confident sentence (*"After that, I spent two years freelancing and building my skills"*), and immediately advance to your Lead role. A calm, matter-of-fact tone signals deliberate career agency.
4. **Directly Connect to the Open Role:**
   Don't make the interviewer guess why you're a match. If the job involves a high-scale consumer or enterprise app, link your experience with FordPass, AutoZone, and Avaya Workplace directly to the company's technical scale.
5. **Maintain Authenticity and Honesty:**
   Never overstate unpracticed skills. If SwiftUI was a secondary layer in an enterprise codebase, keep it out of the elevator pitch and speak candidly about your hands-on depth when asked.
6. **Strict 2-Minute Timebox:**
   Stop at exactly two minutes. Interviewers use your opening response to gauge executive conciseness. A crisp narrative invites targeted, engaging follow-up questions.

---

### One-Liner & Memory Trick
• **One-liner:** Tell a story of growth: VoIP engineer, then offline and consumer apps, then FordPass and CI/CD, then lead architect at Avaya, and finish with why you fit this Staff role.
• **Memory trick:** **V-O-F-L-N** → *"VoIP, Offline apps, Ford and CI/CD, Lead at Avaya, Now Staff role."*`,
  codeExample: `// =========================================================================
// 🎙️ SENIOR / STAFF INTERVIEW ARCHITECTURE: 18-Year Technical Evolution
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • Low-Level Roots (VoIP / C / PJSIP): Modifying C libraries and managing
//   audio/socket buffers instills a hardware-level intuition for memory and threads.
// • Offline-First Enterprise Sync (Thomson Reuters, FordPass): Local persistence
//   acts as the source of truth, queuing mutations in an Outbox with background sync.
// • Modern Swift Concurrency & Actors (Avaya Workplace / Spaces SDK):
//   Transitioning stateful call orchestration to Swift Actors eliminated race conditions,
//   catapulting crash-free sessions from 96% to 99% across enterprise deployments.
// • Clean Architecture & Modularity: Strict separation between Domain Use Cases,
//   Data Repositories, and Presentation ViewModels accelerates build times by up to 70%.

import Foundation
import Combine

// MARK: - 1. Low-Level VoIP & Audio Pipeline (2008 – 2011: PJSIP & C Internals)

/// Abstraction over low-level C / PJSIP socket and RTP audio stream operations.
public protocol VoIPAudioEngineProtocol: AnyObject, Sendable {
    func initializeSIPStack(domain: String, port: Int) -> Bool
    func configureAudioSession(sampleRate: Double, bufferDuration: Double) throws
    func terminateStack()
}

public final class LegacyVoIPBridge: VoIPAudioEngineProtocol {
    public init() {}
    
    public func initializeSIPStack(domain: String, port: Int) -> Bool {
        // Simulates C-level pjsip_init() and transport configuration
        print("🔌 [PJSIP C-Bridge] SIP transport initialized on \\(domain):\\(port)")
        return true
    }
    
    public func configureAudioSession(sampleRate: Double, bufferDuration: Double) throws {
        // Low-level CoreAudio / AudioUnit buffer frame allocation
        print("🎙️ [CoreAudio] Buffer configured: \\(sampleRate)Hz, duration: \\(bufferDuration)s")
    }
    
    public func terminateStack() {
        print("🛑 [PJSIP C-Bridge] Stack destroyed cleanly without memory leaks")
    }
}

// MARK: - 2. Offline-First Enterprise Data Architecture (2011 – 2019: Thomson Reuters & FordPass)

/// Generic entity representing persistent business records (e.g. FordPass vehicle status)
public struct VehicleStatusRecord: Identifiable, Codable, Sendable {
    public let id: String
    public let vin: String
    public let isLocked: Bool
    public let fuelLevelPercent: Double
    public let lastSyncTimestamp: Date
}

/// Demonstrates offline-first pattern: Return local cache immediately, then sync remote
public protocol VehicleRepositoryProtocol: Sendable {
    func getStatus(vin: String) async throws -> VehicleStatusRecord
    func updateLockState(vin: String, locked: Bool) async throws
}

public actor OfflineFirstVehicleRepository: VehicleRepositoryProtocol {
    private var localStore: [String: VehicleStatusRecord] = [:]
    private var pendingSyncOutbox: [(vin: String, locked: Bool)] = []
    
    public init() {}
    
    public func getStatus(vin: String) async throws -> VehicleStatusRecord {
        // 1. Instant local cache lookup (0ms perceived latency for users)
        if let cached = localStore[vin] {
            return cached
        }
        // 2. Fallback default while remote sync completes
        let fresh = VehicleStatusRecord(id: UUID().uuidString, vin: vin, isLocked: true, fuelLevelPercent: 85.0, lastSyncTimestamp: Date())
        localStore[vin] = fresh
        return fresh
    }
    
    public func updateLockState(vin: String, locked: Bool) async throws {
        // Optimistic UI update: Mutate local store immediately
        if var current = localStore[vin] {
            current = VehicleStatusRecord(id: current.id, vin: vin, isLocked: locked, fuelLevelPercent: current.fuelLevelPercent, lastSyncTimestamp: Date())
            localStore[vin] = current
        }
        // Enqueue to offline outbox for opportunistic background transmission
        pendingSyncOutbox.append((vin: vin, locked: locked))
        print("📡 [Offline Outbox] Queued remote vehicle lock command. Pending: \\(pendingSyncOutbox.count)")
    }
}

// MARK: - 3. Modern Concurrency & Lead Architecture (2021 – Present: Avaya Workplace / Spaces)

/// Call status state machine ensuring thread-safe VoIP transitions
public enum CallState: String, Sendable {
    case idle
    case dialing
    case connected
    case onHold
    case terminated
}

/// Swift Actor eliminating race conditions in multi-party enterprise conferencing.
/// Achieved 99% crash-free sessions across global enterprise client bases.
public actor CallSessionActor {
    public private(set) var currentState: CallState = .idle
    public private(set) var callDurationSeconds: Int = 0
    private let callID: String
    
    public init(callID: String) {
        self.callID = callID
    }
    
    /// Thread-safe state transition with actor-isolated mutation
    public func transition(to newState: CallState) {
        // Validate transition
        switch (currentState, newState) {
        case (.idle, .dialing), (.dialing, .connected), (.connected, .onHold), (.onHold, .connected), (_, .terminated):
            print("📞 [CallSessionActor] Transition: \\(currentState) -> \\(newState)")
            self.currentState = newState
        default:
            print("⚠️ [CallSessionActor] Illegal transition rejected: \\(currentState) -> \\(newState)")
        }
    }
    
    public func incrementDuration() {
        guard currentState == .connected else { return }
        callDurationSeconds += 1
    }
}

// MARK: - 4. Presentation Layer (Clean Architecture + MVVM)

@MainActor
public final class CallViewModel: ObservableObject {
    @Published public private(set) var displayState: String = "Idle"
    @Published public private(set) var formattedDuration: String = "00:00"
    
    private let sessionActor: CallSessionActor
    
    public init(callID: String) {
        self.sessionActor = CallSessionActor(callID: callID)
    }
    
    public func startCall() async {
        await sessionActor.transition(to: .dialing)
        self.displayState = "Dialing..."
        
        // Simulating network connection
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        await sessionActor.transition(to: .connected)
        self.displayState = "Connected"
    }
    
    public func endCall() async {
        await sessionActor.transition(to: .terminated)
        self.displayState = "Call Ended"
    }
}`
};

// 2. Prepend newQ01 at index 0
questions.unshift(newQ01);
console.log('New questions count in questions.json:', questions.length);
if (questions.length !== 90) {
  console.error('Expected 90 questions, got:', questions.length);
  process.exit(1);
}

fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
console.log('✓ questions.json updated successfully!');

// 3. Update index.html
// Replace const QUESTIONS
const startQ = html.indexOf('const QUESTIONS = [');
const endQ = html.indexOf(';\n    const MODULE_DOCS =', startQ);
const newQuestionsCode = 'const QUESTIONS = ' + JSON.stringify(questions);
html = html.substring(0, startQ) + newQuestionsCode + html.substring(endQ);

// Update TOPIC_CATEGORIES
const startCat = html.indexOf('const TOPIC_CATEGORIES = [');
const endCat = html.indexOf('];\n', startCat);
const oldCats = JSON.parse(html.substring(startCat + 'const TOPIC_CATEGORIES = '.length, endCat + 1));

// Shift all existing categories' questionIds by +1
for (const cat of oldCats) {
  cat.questionIds = cat.questionIds.map(qid => {
    const num = parseInt(qid.replace('Q-', ''), 10);
    return 'Q-' + String(num + 1).padStart(2, '0');
  });
}

// Prepend the new career narrative category
const newCareerCategory = {
  id: "career-narrative",
  title: "Career Narrative & Leadership Walkthrough",
  shortTitle: "Career Story",
  icon: "🎙️",
  color: "#6366F1",
  summary: "Executive 2-minute career walkthrough, evolution from low-level VoIP/C to enterprise and consumer scale (FordPass, Domino's, Avaya Workplace), quantified reliability metrics, and staff-level positioning.",
  docIds: ["leadership-ownership"],
  questionIds: ["Q-01"]
};

const newTopicCategories = [newCareerCategory, ...oldCats];
const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(newTopicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS: shift all existing keys by +1 and insert Q-01
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
const newQ2D = {};

newQ2D['Q-01'] = [
  {
    docId: "leadership-ownership",
    title: "Development Lead & Feature Ownership Guide",
    filename: "DevelopmentLeadOwnership-TalkingPoints.md",
    icon: "👔"
  }
];

for (const [key, val] of Object.entries(oldQ2D)) {
  const num = parseInt(key.replace('Q-', ''), 10);
  const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
  newQ2D[shiftedKey] = val;
}

const newQ2DCode = 'const QUESTION_TO_DOCS = ' + JSON.stringify(newQ2D) + ';';
html = html.substring(0, startQ2D) + newQ2DCode + html.substring(endQ2D + 2);

// Update activeSectionId initialization in index.html to default to career-narrative
html = html.replace("let activeSectionId = 'architecture';", "let activeSectionId = 'career-narrative';");
html = html.replace("let sidebarSectionOpenState = { 'architecture': true };", "let sidebarSectionOpenState = { 'career-narrative': true };");
html = html.replace("activeSectionId = topic ? topic.id : 'architecture';", "activeSectionId = topic ? topic.id : 'career-narrative';");

// Update text counters in index.html
html = html.replace(/89 Questions/g, '90 Questions');
html = html.replace(/89 questions/g, '90 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 4. Update QUESTIONS.md
// Summary table updates
const oldSummaryTableStart = '| Category / Topic | Questions | Key Coverage |\n|---|:---:|---|\n| **Architecture & Design Patterns** | `5` |';
const newSummaryTableStart = '| Category / Topic | Questions | Key Coverage |\n|---|:---:|---|\n| **Career Narrative & Leadership Walkthrough** | `1` | Executive 2-minute elevator pitch, career evolution from VoIP/C to enterprise scale, quantified reliability metrics, and staff-level positioning. |\n| **Architecture & Design Patterns** | `5` |';

md = md.replace(oldSummaryTableStart, newSummaryTableStart);
md = md.replace(
  '| **Total** | **`89`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`90`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 89 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 90 iOS interview questions'
);

// Shift question anchors in reverse (from 89 down to 1)
for (let num = 89; num >= 1; num--) {
  const currentRegex = new RegExp(`### \`Q-${num.toString().padStart(2, '0')}\` —`, 'g');
  const targetId = `### \`Q-${(num + 1).toString().padStart(2, '0')}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Update existing section headers ranges
const sectionHeaderReplacements = [
  ['## 📌 Architecture & Design Patterns (Q-01 – Q-05)', '## 📌 Architecture & Design Patterns (Q-02 – Q-06)'],
  ['## ⚡ Swift Concurrency & Multithreading (Q-06 – Q-12)', '## ⚡ Swift Concurrency & Multithreading (Q-07 – Q-13)'],
  ['## 🚀 Core Swift & Language Internals (Q-13 – Q-18)', '## 🚀 Core Swift & Language Internals (Q-14 – Q-19)'],
  ['## 🎨 SwiftUI & UIKit Layout (Q-19 – Q-28)', '## 🎨 SwiftUI & UIKit Layout (Q-20 – Q-29)'],
  ['## 🌊 Combine & Reactive Streams (Q-29)', '## 🌊 Combine & Reactive Streams (Q-30)'],
  ['## 🌐 Networking, APIs & Background Tasks (Q-30 – Q-36)', '## 🌐 Networking, APIs & Background Tasks (Q-31 – Q-37)'],
  ['## 📦 Modularity & Launch Performance (Q-37 – Q-43)', '## 📦 Modularity & Launch Performance (Q-38 – Q-44)'],
  ['## 💾 Data Persistence & Memory Management (Q-44 – Q-47)', '## 💾 Data Persistence & Memory Management (Q-45 – Q-48)'],
  ['## 🔒 Security, Auth & Compliance (Q-48 – Q-59)', '## 🔒 Security, Auth & Compliance (Q-49 – Q-60)'],
  ['## 🏛️ System Design & Mobile Architecture (Q-60 – Q-63)', '## 🏛️ System Design & Mobile Architecture (Q-61 – Q-64)'],
  ['## 🧪 Testing & AI Engineering (Q-64 – Q-73)', '## 🧪 Testing & AI Engineering (Q-65 – Q-74)'],
  ['## 🚀 CI/CD & DevOps (Q-74 – Q-75)', '## 🚀 CI/CD & DevOps (Q-75 – Q-76)'],
  ['## 👔 Engineering Leadership & Operations (Q-76 – Q-81)', '## 👔 Engineering Leadership & Operations (Q-77 – Q-82)'],
  ['## 🧠 Memory Management (Q-82 – Q-89)', '## 🧠 Memory Management (Q-83 – Q-90)']
];

for (const [oldH, newH] of sectionHeaderReplacements) {
  if (!md.includes(oldH)) {
    console.error('Missing expected header in QUESTIONS.md:', oldH);
    process.exit(1);
  }
  md = md.replace(oldH, newH);
}

// Prepare markdown for the new section and Q-01
const newSectionMd = `
---

## 🎙️ Career Narrative & Leadership Walkthrough (Q-01)

### \`Q-01\` — Walk me through your career in 2 minutes?

- **Category:** \`Career Narrative & Leadership Walkthrough\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I'm an iOS engineer with 18+ years of experience across low-level VoIP (PJSIP), offline enterprise/consumer apps (FordPass, Domino's), and enterprise calling platforms at Neurealm/Avaya where I architected Clean Architecture + Swift Concurrency, increasing crash-free sessions to 99% and cutting build times by up to 70%—now positioning for a Staff-level role owning technical direction at scale. (Memory trick: V-O-F-L-N → 'VoIP, Offline apps, Ford & CI/CD, Lead at Avaya, Now Staff role.')"*

#### 📖 Detailed Answer

${newQ01.answer}

#### 💻 Technical Evolution & Architecture Blueprint

\`\`\`swift
${newQ01.codeExample}
\`\`\`
`;

// Insert newSectionMd right before "## 📌 Architecture & Design Patterns (Q-02 – Q-06)"
const archHeader = '## 📌 Architecture & Design Patterns (Q-02 – Q-06)';
const archIdx = md.indexOf(archHeader);
if (archIdx === -1) {
  console.error('Could not find archHeader in QUESTIONS.md');
  process.exit(1);
}

md = md.substring(0, archIdx) + newSectionMd + '\n\n---\n\n' + md.substring(archIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
