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

const newQ80 = {
  id: "Q-80",
  category: "Engineering Leadership & Operations",
  difficulty: "Staff",
  question: "A customer says the app crashes on a screen, but you have no crash log. How do you find the crash?",
  interviewSentence: "When investigating a reported crash with no logs, I first correlate available telemetry (Xcode Organizer, Crashlytics, App Store Connect crash rates) across app versions and screen breadcrumbs, distinguish true crashes from hangs or Jetsam OOM kills, engage the customer for environment context or native iOS Analytics Data (.ips files), audit suspect screen code for edge cases and memory spikes, and ship enhanced diagnostics with an in-app report-a-problem attachment.",
  answer: `This is common. An App Store review says "the app crashes when I open my orders", and you have nothing else. A review is only a clue. It has no stack trace, no device, and sometimes it is not even a crash. So the work is in three parts: collect more facts, check every data source you already have, and add the missing visibility so the next crash is not invisible.

Say it like this:

"First, I check whether I really have no data. A review tells me the screen and roughly when. So I look in Xcode Organizer, in Crashlytics or Sentry, and in the crash rate in App Store Connect. I filter by that app version and that time window, and I search for the screen name in breadcrumbs or custom keys. Organizer only includes users who agreed to share diagnostics, so a small group can be missing from it.

Second, I ask the customer for details. I reply to the review, politely, and give a support email or an in-app contact, because I need the app version, the iOS version, the device, and the exact steps. I also check what the user means by crash. People say 'crash' when the app freezes, shows a blank screen, or sends them back to the home screen. A freeze shows up as a hang, a memory kill leaves no crash log at all, and a real crash leaves a report. So I look at all three, hangs, crashes, and memory terminations.

Third, I try to reproduce it. I install the same app version, from TestFlight if it is an older one, on a device and iOS version like the customer's. I follow the steps, and I also test with unusual data, like an empty list, a very long list, an account with a lot of history, a different language, and a poor network. I read the code of that screen and look for the usual causes: a force unwrap, an array index, a threading problem, or a large image.

Fourth, if I can get a log from the customer, it solves a lot. On the phone, the customer can open Settings, Privacy and Security, Analytics and Improvements, Analytics Data, and share the crash file for my app. If I have no crash tool, I add one now, along with MetricKit, so crashes are captured from the next release.

Fifth, I add visibility on that screen: breadcrumbs for what the user did, a screen name tag on every report, and an in-app 'Report a problem' button that attaches safe device information. If I still cannot find it, I ship a version with extra logging, and I use a phased release so I can watch it.

Finally, when I fix it, I reply to the review, because that helps the customer and shows other users that the problem is handled."

#### 🔬 Steps to Follow
1. **Check the data you already have:** Xcode Organizer (Crashes & Hangs), Crashlytics/Sentry, and App Store Connect crash rates. Filter by app version, time window, and screen.
2. **Engage the customer:** Politely reply to review; request app version, iOS version, device model, and reproduction steps.
3. **Classify the failure mode:** Differentiate between true crash, main-thread hang, blank screen, or Jetsam out-of-memory (OOM) kill.
4. **Reproduce under stress:** Install matching version via TestFlight; test with extreme datasets (empty, massive, special characters), throttled network, and low RAM.
5. **Audit suspect screen code:** Inspect for force unwraps (\`!\`), unsafe collection subscripting (\`items[index]\`), background thread UI mutations, and uncompressed high-resolution images.
6. **Extract native device logs:** Guide customer to native \`.ips\` crash logs via iOS Settings or invite to TestFlight beta build.
7. **Deploy proactive visibility:** Integrate MetricKit (\`MXDiagnosticPayload\`), Crashlytics breadcrumbs, and an in-app diagnostic support exporter.
8. **Fix, stage, & follow up:** Ship defensive hotfix via Phased Release (1% $\rightarrow$ 100%), monitor crash metrics, and reply to review upon resolution.

---

#### 1. What Users Call a "Crash" vs. What Actually Happened

| User Perception | Technical Reality | Crash Tool Signature | How to Find It |
|---|---|---|---|
| *"The app crashed"* | **True Crash** (SIGSEGV, SIGABRT, EXC_BAD_ACCESS) | Symbolicated stack trace in Crashlytics / Sentry | Filter by screen name, time window, and app version. |
| *"The app froze then closed"* | **Watchdog Termination** (\`0x8badf00d\`) | "App Hangs" tab in Xcode Organizer / MetricKit | Inspect main-thread blocking operations > 20s. |
| *"The app vanished back to home"* | **Jetsam OOM Kill** (Low Memory Termination) | No crash log generated; logged only in MetricKit | Check memory graph, large image decodes, and cache allocations. |
| *"The app crashed to a white screen"* | **Silent Failure** (Swallowed error / unhandled state) | Zero logs in crash reporting tools | Check network response status and state machine error views. |

---

#### 2. Native iOS Crash Log Retrieval (Guide for Customers)

When third-party crash reporters fail to capture an event, customers can retrieve Apple's native crash log directly:
\`\`\`
iPhone Settings > Privacy & Security > Analytics & Improvements > Analytics Data
• Search for: <YourAppName>-YYYY-MM-DD-HHMMSS.ips
• Tap the file > Share button > Email/AirDrop the .ips file to Engineering
\`\`\`

---

#### 3. In-App Diagnostic Feedback Exporter (Safe Telemetry Bundle)

\`\`\`swift
import UIKit
import os

public struct DiagnosticReportBundle {
    public let appVersion: String
    public let osVersion: String
    public let deviceModel: String
    public let freeDiskSpaceGB: Double
    public let freeMemoryMB: Int
    public let recentBreadcrumbs: [String]

    public static func generateCurrent(currentScreen: String) -> DiagnosticReportBundle {
        let memoryBytes = os_proc_available_memory()
        let freeDisk = (try? URL(fileURLWithPath: NSHomeDirectory())
            .resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
            .volumeAvailableCapacityForImportantUsage) ?? 0

        return DiagnosticReportBundle(
            appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown",
            osVersion: UIDevice.current.systemVersion,
            deviceModel: UIDevice.current.model,
            freeDiskSpaceGB: Double(freeDisk) / (1024 * 1024 * 1024),
            freeMemoryMB: Int(memoryBytes / (1024 * 1024)),
            recentBreadcrumbs: [
                "Screen: \\(currentScreen)",
                "Locale: \\(Locale.current.identifier)",
                "LowPowerMode: \\(ProcessInfo.processInfo.isLowPowerModeEnabled)"
            ]
        )
    }
}
\`\`\`

---

Good to mention (Staff-Level Interview Points):
• **Opt-In Bias in Xcode Organizer:** Xcode Organizer only shows crash and hang logs from users who have explicitly opted into "Share With App Developers" in iOS Settings (often < 20% of users). Never assume zero crashes in Organizer means the bug does not exist.
• **Silent Jetsam OOM Terminations:** When the operating system terminates an app due to memory pressure, it does not execute crash handlers. Only MetricKit (\`MXDiagnosticPayload\`) or bespoke watchdog heuristics can quantify OOM frequencies.
• **App Review Sentiment Management:** Replying to 1-star reviews asking for technical details turns public frustration into positive customer advocacy and signals to prospective users that the engineering team is attentive.
• **Dark Launches & Feature Flagging:** When refactoring a suspicious screen to fix an elusive crash, wrap the new implementation in a feature flag so it can be enabled incrementally and rolled back instantly.
• **Defensive Data Handling:** Avoid force unwraps (\`!\`) and raw array subscripts (\`items[index]\`) on data derived from network payloads or local databases. Always prefer safe optional binding (\`guard let\`) and safe collection accessors.

One-liner: When a customer reports a crash without a log, I investigate Xcode Organizer, Crashlytics, and MetricKit for unlinked hangs or Jetsam OOM kills, engage the user for environment context or native .ips logs, audit suspect screen code for edge cases, and add diagnostic breadcrumbs and in-app reporting.

Memory trick: C-A-C-R-R-G-A-F → "Check data, Ask customer, Classify failure, Reproduce under stress, Read code, Get native logs, Add visibility, Fix & follow up."`,
  codeExample: `// =========================================================================
// 🔍 SENIOR / STAFF INTERVIEW ARCHITECTURE: Triage Crashes Without Logs
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • The Invisible Crash Dilemma: Often what users call a "crash" is an unhandled
//   empty view state, a main-thread hang (watchdog), or a Jetsam OOM termination.
// • Diagnostic Support Bundle: Provide an in-app "Report a Problem" mechanism that
//   attaches non-PII environmental diagnostics (RAM, disk, locale, build version).
// • Safe Collection Subscripting: Replace unsafe array indexing with safe bounds-checked
//   accessors to eliminate 'index out of range' crashes entirely.

import Foundation
import UIKit
import os

// MARK: - 1. Safe Collection Extension (Preventing Index Out of Range)

public extension Collection {
    /// Safe bounds-checked element access
    subscript(safe index: Index) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}

// MARK: - 2. Diagnostic Log Buffer (In-Memory Circular Breadcrumb Cache)

public final class DiagnosticLogBuffer {
    public static let shared = DiagnosticLogBuffer()
    private var logs: [String] = []
    private let lock = NSLock()
    private let maxEntries = 50

    private init() {}

    public func log(_ message: String) {
        lock.lock()
        defer { lock.unlock() }
        let timestamp = ISO8601DateFormatter().string(from: Date())
        logs.append("[\\(timestamp)] \\(message)")
        if logs.count > maxEntries {
            logs.removeFirst()
        }
    }

    public func exportRecentLogs() -> [String] {
        lock.lock()
        defer { lock.unlock() }
        return logs
    }
}

// MARK: - 3. Support Attachment Generator

public struct SupportDiagnosticExporter {
    public static func generateDiagnosticPayload(currentScreen: String) -> [String: Any] {
        let availableRAM = os_proc_available_memory() / (1024 * 1024)
        
        return [
            "screen": currentScreen,
            "app_version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] ?? "Unknown",
            "build_number": Bundle.main.infoDictionary?["CFBundleVersion"] ?? "Unknown",
            "ios_version": UIDevice.current.systemVersion,
            "device_model": UIDevice.current.model,
            "free_memory_mb": availableRAM,
            "low_power_mode": ProcessInfo.processInfo.isLowPowerModeEnabled,
            "locale": Locale.current.identifier,
            "breadcrumbs": DiagnosticLogBuffer.shared.exportRecentLogs()
        ]
    }
}`
};

// 1. Shift questions in questions.json from index 79 onwards (current Q-80: ARC onwards)
for (let i = 79; i < questions.length; i++) {
  const currentNum = i + 1; // 80..87
  const newNum = currentNum + 1; // 81..88
  questions[i].id = "Q-" + String(newNum).padStart(2, '0');
}

// Insert newQ80 at index 79
questions.splice(79, 0, newQ80);
console.log('New questions count in questions.json:', questions.length);
fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
console.log('✓ questions.json updated successfully!');

// 2. Update index.html
// Replace const QUESTIONS
const startQ = html.indexOf('const QUESTIONS = [');
const endQ = html.indexOf(';\n    const MODULE_DOCS =', startQ);
const newQuestionsCode = 'const QUESTIONS = ' + JSON.stringify(questions);
html = html.substring(0, startQ) + newQuestionsCode + html.substring(endQ);

// Update TOPIC_CATEGORIES
const startCat = html.indexOf('const TOPIC_CATEGORIES = [');
const endCat = html.indexOf('];\n', startCat);
const topicCategories = JSON.parse(html.substring(startCat + 'const TOPIC_CATEGORIES = '.length, endCat + 1));

for (const cat of topicCategories) {
    if (cat.id === 'leadership-production') {
        cat.questionIds = ['Q-75', 'Q-76', 'Q-77', 'Q-78', 'Q-79', 'Q-80'];
        cat.summary = "Production incident triage, crash log analysis & dSYM symbolication, 1% production crash forensics, missing crash log triage, third-party SDK evaluation, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.";
    } else if (cat.id === 'memory-management') {
        cat.questionIds = ['Q-81', 'Q-82', 'Q-83', 'Q-84', 'Q-85', 'Q-86', 'Q-87', 'Q-88'];
    }
}
const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(topicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS: shift keys >= 80 up by 1, and add Q-80
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
const newQ2D = {};

for (const [key, val] of Object.entries(oldQ2D)) {
    const num = parseInt(key.replace('Q-', ''), 10);
    if (num >= 80) {
        const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
        newQ2D[shiftedKey] = val;
    } else {
        newQ2D[key] = val;
    }
}

newQ2D['Q-80'] = [
    {
        docId: "leadership-ownership",
        title: "Development Lead & Feature Ownership Guide",
        filename: "DevelopmentLeadOwnership-TalkingPoints.md",
        icon: "👔"
    }
];

const newQ2DCode = 'const QUESTION_TO_DOCS = ' + JSON.stringify(newQ2D) + ';';
html = html.substring(0, startQ2D) + newQ2DCode + html.substring(endQ2D + 2);

// Update text counters in index.html
html = html.replace(/87 Questions/g, '88 Questions');
html = html.replace(/87 questions/g, '88 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 3. Update QUESTIONS.md
md = md.replace(
  '| **Engineering Leadership & Operations** | `5` |',
  '| **Engineering Leadership & Operations** | `6` |'
);
md = md.replace(
  '| **Total** | **`87`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`88`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 87 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 88 iOS interview questions'
);

// Update Section headers
md = md.replace(
  '## 👔 Engineering Leadership & Operations (Q-75 – Q-79)',
  '## 👔 Engineering Leadership & Operations (Q-75 – Q-80)'
);
md = md.replace(
  '## 🧠 Memory Management (Q-80 – Q-87)',
  '## 🧠 Memory Management (Q-81 – Q-88)'
);

// Shift question anchors in reverse (from 87 down to 80)
for (let num = 87; num >= 80; num--) {
  const currentRegex = new RegExp(`### \`Q-${num}\` —`, 'g');
  const targetId = `### \`Q-${num + 1}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Prepare markdown for Q-80
const q80Md = `
---

### \`Q-80\` — A customer says the app crashes on a screen, but you have no crash log. How do you find the crash?

- **Category:** \`Engineering Leadership & Operations\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"When investigating a reported crash with no logs, I first correlate available telemetry (Xcode Organizer, Crashlytics, App Store Connect crash rates) across app versions and screen breadcrumbs, distinguish true crashes from hangs or Jetsam OOM kills, engage the customer for environment context or native iOS Analytics Data (.ips files), audit suspect screen code for edge cases and memory spikes, and ship enhanced diagnostics with an in-app report-a-problem attachment."*

#### 📖 Detailed Answer

${newQ80.answer}

#### 💻 Diagnostic Architecture & Safe Accessors Example

\`\`\`swift
${newQ80.codeExample}
\`\`\`
`;

// Insert q80Md right before "## 🧠 Memory Management (Q-81 – Q-88)"
const insertMarker = '## 🧠 Memory Management (Q-81 – Q-88)';
const markerIdx = md.indexOf(insertMarker);
if (markerIdx === -1) {
    console.error('Could not find insertMarker in QUESTIONS.md');
    process.exit(1);
}

md = md.substring(0, markerIdx) + q80Md + '\n\n---\n\n' + md.substring(markerIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
