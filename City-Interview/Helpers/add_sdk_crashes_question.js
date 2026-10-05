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

const newQ78 = {
  id: "Q-78",
  category: "Engineering Leadership & Operations",
  difficulty: "Staff",
  question: "An SDK is causing crashes. How do you prove it and fix it?",
  interviewSentence: "To prove and fix an SDK crash, I first gather forensic proof via symbolicated crash stacks, loaded binary images, SDK version tagging in Crashlytics, and comparative cohort analysis, confirming causality by turning the SDK off via a remote kill switch; I immediately mitigate user impact via the kill switch or a rolled-back hotfix, isolate the bug with Address/Thread Sanitizers in a standalone reproduction project for the vendor, and deploy thread-safety or deferred launch workarounds.",
  answer: `When users start crashing after you add or update an SDK, the first reaction is often "it's the SDK". But the crash report alone is not proof. The SDK may only be on the stack because your code passed it bad input, or the crash may be in your code while the SDK changed something behind the scenes. So the work has two parts: first, collect evidence until you can show the link; second, protect users right away, then fix the root cause for good.

Say it like this:

"I start with the crash reports, because they show what the app was doing. I open the crashed thread and read the stack from the top. If the top frames belong to the SDK, that is a strong sign. I also check the list of loaded libraries in the report, to confirm the SDK was in the process. If the SDK has no symbols, I ask the vendor for its dSYM files, so I can read the function names.

But one stack trace is not proof, so I look at the pattern. I tag every crash with the SDK version, then compare the crash rate before and after the release that added or updated it. I filter by app version, SDK version, iOS version, and device. If crashes appear only with one SDK version, or only on one iOS version, that points to the SDK.

The strongest proof is isolation. If I have a kill switch, I turn the SDK off for part of the users and compare. If the crash rate drops for them, I know. I also try to reproduce it locally, and build a small sample project with only the SDK. If the sample crashes by itself, the vendor cannot argue. I also run the app with Address Sanitizer, Thread Sanitizer, and Zombie Objects, because many SDK crashes come from memory or threading problems.

Then I act in two steps. First, stop the damage: turn the SDK off with the kill switch, or roll back to the last good version and ship a hotfix, using a phased release so I can watch the crash rate. Second, fix the cause: send the vendor the crash logs, the versions, and the sample project. Meanwhile, I try a workaround, such as starting the SDK later, calling it on the right thread, or checking my inputs. If the vendor is slow or the SDK keeps failing, I replace it. Since I wrapped it behind my own protocol, replacing it is one file. Finally, I add alerts on the crash rate, so the next problem is caught in hours and not days."

#### 🔬 Steps to Prove It
1. **Read the crashed thread:** Are the top frames in the SDK?
2. **Check the loaded libraries:** Was the SDK in the process binary images?
3. **Symbolicate the SDK frames:** Ask the vendor for dSYMs if addresses are unsymbolicated.
4. **Tag crashes with the SDK version:** Group and correlate in Crashlytics/Datadog.
5. **Compare cohorts before and after:** Crash rate by app version, SDK version, iOS version, and device model.
6. **Isolate it via kill switch:** Turn the SDK off for a test group and observe crash reduction.
7. **Reproduce it:** Reproduce in the real app, then isolate in a minimal standalone sample project.
8. **Run diagnostic sanitizers:** Address Sanitizer (ASan), Thread Sanitizer (TSan), and Zombie Objects.

#### 🛠️ Steps to Fix It
1. **Stop the damage:** Toggle remote kill switch OFF, or roll back to the last known good SDK version.
2. **Ship a hotfix:** Deploy via staged/phased rollout and watch real-time Crashlytics velocity alerts.
3. **Report to the vendor:** Send symbolicated logs, device/OS matrix, reproduction project, and triage findings.
4. **Implement workarounds:** Defer initialization post-launch, enforce thread dispatching, and sanitize inputs.
5. **Update or replace:** Upgrade to patched SDK build or swap out via the existing protocol adapter.
6. **Prevent regressions:** Establish automated crash velocity alerts and canary rollout gates.

---

#### 1. Read a Crash Report: What Points to the SDK

\`\`\`
Thread 4 Crashed:                                         <-- the thread that crashed
0   VendorSDK   0x0000000104c1a2f0  -[VendorTracker flush] + 148     <-- top frame is inside the SDK
1   VendorSDK   0x0000000104c19b44  -[VendorTracker queueEvent:] + 96
2   Foundation  0x00000001a3b2c1d8  __NSThreadPerformPerform + 260
3   MyApp       0x0000000104a3b8a4  AnalyticsService.track(_:) + 72  <-- my code called it

Binary Images:                                            <-- the list of libraries loaded in the process
0x104c10000 - 0x104c9ffff VendorSDK arm64                 <-- confirms the SDK was loaded
\`\`\`

#### 2. Tag Every Crash with SDK Version in Crash Reporting

\`\`\`swift
import FirebaseCrashlytics

func tagCrashReports() {
    let crashlytics = Crashlytics.crashlytics()
    // 💡 Tag SDK version and remote config status so reports can be cleanly segmented
    crashlytics.setCustomValue(VendorSDK.version, forKey: "vendor_sdk_version")
    crashlytics.setCustomValue(RemoteConfig.bool("vendor_sdk_enabled"), forKey: "vendor_sdk_enabled")
}
\`\`\`

#### 3. Remote Kill Switch: Instant Damage Mitigation

\`\`\`swift
func startVendorSDKIfAllowed() {
    // 🛡️ Remote feature flag toggled dynamically without requiring an App Store release
    guard RemoteConfig.bool("vendor_sdk_enabled") else {
        analytics = NoOpAnalytics()                       // Fallback to harmless no-op implementation
        return                                            // Terminate initialization early
    }
    VendorSDK.start(apiKey: Config.vendorKey)
    analytics = VendorAnalytics()
}
// Set flag OFF for 10% canary cohort first, then compare crash rates across groups
\`\`\`

#### 4. Defensive Workaround: Defer Launch & Enforce Thread Safety

\`\`\`swift
func startVendorSDKAfterFirstScreen() {
    // 💡 Prevent launch time contention and main thread deadlocks by deferring startup
    Task { @MainActor in
        try? await Task.sleep(for: .seconds(2))           // Wait until initial UI frame renders
        VendorSDK.start(apiKey: Config.vendorKey)
    }
}

func track(_ event: String) {
    guard !event.isEmpty else { return }                  // Sanitize inputs before passing to vendor code
    DispatchQueue.main.async {                            // Guarantee execution on vendor-expected queue
        VendorSDK.shared.logEvent(event)
    }
}
\`\`\`

#### 5. Diagnostics: Enable Sanitizers in Xcode Scheme
\`\`\`
Xcode > Product > Scheme > Edit Scheme > Run > Diagnostics
  • Address Sanitizer (ASan)   # Detects heap-buffer overflows, use-after-free, memory corruption
  • Thread Sanitizer (TSan)    # Catches data races and un-synchronized multi-threaded memory access
  • Zombie Objects             # Detects messages sent to deallocated Objective-C instances
  • Main Thread Checker        # Catches background thread UI invocations
\`\`\`

#### 6. Rollback to Last Known Good Version

\`\`\`swift
// Package.swift
dependencies: [
    .package(
        url: "https://github.com/vendor/sdk.git",
        exact: "4.1.3"                                    // Pin back to last stable build
    )
]
// Commit Package.resolved, ship hotfix via phased rollout, and monitor crash-free users
\`\`\`

---

#### 📋 What to Send the Vendor
• **Symbolicated crash logs** with full thread backtraces and crash addresses.
• **Environment matrix:** SDK version, exact iOS builds, and affected device architectures.
• **Volume metrics:** Crash count, percentage of DAU affected, and time of onset.
• **Minimal reproduction project:** Standalone Xcode project reproducing the crash in isolation.
• **Triage notes:** Diagnostic logs, sanitizer outputs, and temporary workarounds attempted.

Good to mention (Staff-Level Interview Points):
• **Correlation vs. Causality:** An SDK on top of the stack might just be reacting to invalid input passed from your app. Isolation via remote kill switch proves true causality.
• **Method Swizzling Hazards:** SDKs that swizzle \`UIViewController\` or \`NSURLSession\` can crash your code while appearing innocent on the stack. Audit SDK initialization methods for swizzling.
• **Missing Vendor dSYMs:** Closed-source XCFrameworks require matching dSYMs from the vendor; without them, crash reporters only show un-symbolicated hex memory offsets.
• **Phased Rollout Protection:** Always release app updates with Phased Rollout enabled in App Store Connect (1%, 2%, 5%, 10%, 20%, 50%, 100%) to catch SDK crash spikes before 100% distribution.
• **Timing & Startup Budget:** Heavy SDK work during \`application:didFinishLaunchingWithOptions:\` can trigger iOS watchdog 0x8badf00d termination. Defer non-critical SDK initialization until after initial view presentation.
• **OS Deprecation Drift:** Vendor SDK crashes often spike right after major iOS releases due to private API changes or runtime behavioral shifts.
• **Decoupled Architecture Value:** Wrapping third-party SDKs behind internal protocols proves its ROI during an incident: swapping out a broken vendor takes hours instead of weeks.

One-liner: Prove it with crash stacks, version comparison, and by turning the SDK off for some users, then stop the damage with a kill switch or rollback, and fix the cause with the vendor or a replacement.

Memory trick: S-V-I-K-R → "Stack shows it, Version compares it, Isolate it, Kill switch stops it, Replace it if needed."`,
  codeExample: `// =========================================================================
// 🚨 SENIOR / STAFF INTERVIEW ARCHITECTURE: Triage & Fix Crashing SDKs
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • Defense-in-Depth: Never expose raw third-party types to view controllers or domain logic.
// • Fail-Safe Null Object Pattern: Provide a 'NoOp' implementation so disabling the SDK
//   via remote config does not cause nil crashes or require hundreds of if/else checks.
// • Input Sanitization: Validate and clamp all parameters before crossing vendor boundary.
// • Main-Thread Decoupling: Never let a third-party SDK block app launch; defer initialization
//   until after the first frame renders to avoid Watchdog (0x8badf00d) kills.

import Foundation

// MARK: - 1. Domain Protocol

public protocol AnalyticsServiceProtocol: Sendable {
    func track(event: String, parameters: [String: Any])
}

// MARK: - 2. No-Op Null Object Implementation (Safe Fallback)

public final class NoOpAnalyticsService: AnalyticsServiceProtocol {
    public init() {}
    public func track(event: String, parameters: [String: Any]) {
        // Silently discard events when SDK is disabled by kill switch
    }
}

// MARK: - 3. Vendor Adapter with Defensive Input Guards & Thread Safety

public final class SafeVendorAnalyticsAdapter: AnalyticsServiceProtocol {
    public init() {}

    public func track(event: String, parameters: [String: Any]) {
        // 🛡️ Input validation: Protect against third-party crash bugs on empty/nil inputs
        let trimmed = event.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        // 🛡️ Thread confinement: Dispatch to appropriate queue expected by vendor SDK
        DispatchQueue.main.async {
            // VendorSDK.shared.logEvent(trimmed, parameters: parameters)
        }
    }
}

// MARK: - 4. Resilient Service Manager with Kill Switch & Deferred Launch

@MainActor
public final class AnalyticsManager {
    public static let shared = AnalyticsManager()
    
    private(set) var activeService: AnalyticsServiceProtocol = NoOpAnalyticsService()
    private var isInitialized = false

    private init() {}

    /// Called post-launch to prevent Watchdog 0x8badf00d kills
    public func initializeAfterFirstScreen(remoteConfigEnabled: Bool) {
        guard !isInitialized else { return }
        isInitialized = true

        if remoteConfigEnabled {
            // 🛡️ Kill switch ON: Instantiate vendor adapter
            self.activeService = SafeVendorAnalyticsAdapter()
        } else {
            // 🛡️ Kill switch OFF: Revert to zero-impact null object
            self.activeService = NoOpAnalyticsService()
        }
    }

    public func log(_ event: String, parameters: [String: Any] = [:]) {
        activeService.track(event: event, parameters: parameters)
    }
}`
};

// 1. Shift questions in questions.json from index 77 onwards (current Q-78: ARC onwards)
for (let i = 77; i < questions.length; i++) {
  const currentNum = i + 1; // 78..85
  const newNum = currentNum + 1; // 79..86
  questions[i].id = "Q-" + String(newNum).padStart(2, '0');
}

// Insert newQ78 at index 77
questions.splice(77, 0, newQ78);
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
        cat.questionIds = ['Q-75', 'Q-76', 'Q-77', 'Q-78'];
    } else if (cat.id === 'memory-management') {
        cat.questionIds = ['Q-79', 'Q-80', 'Q-81', 'Q-82', 'Q-83', 'Q-84', 'Q-85', 'Q-86'];
    }
}
const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(topicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS: shift keys >= 78 up by 1, and add Q-78
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
const newQ2D = {};

for (const [key, val] of Object.entries(oldQ2D)) {
    const num = parseInt(key.replace('Q-', ''), 10);
    if (num >= 78) {
        const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
        newQ2D[shiftedKey] = val;
    } else {
        newQ2D[key] = val;
    }
}

newQ2D['Q-78'] = [
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
html = html.replace(/85 Questions/g, '86 Questions');
html = html.replace(/85 questions/g, '86 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 3. Update QUESTIONS.md
md = md.replace(
  '| **Engineering Leadership & Operations** | `3` |',
  '| **Engineering Leadership & Operations** | `4` |'
);
md = md.replace(
  '| **Total** | **`85`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`86`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 85 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 86 iOS interview questions'
);

// Update Section headers
md = md.replace(
  '## 👔 Engineering Leadership & Operations (Q-75 – Q-77)',
  '## 👔 Engineering Leadership & Operations (Q-75 – Q-78)'
);
md = md.replace(
  '## 🧠 Memory Management (Q-78 – Q-85)',
  '## 🧠 Memory Management (Q-79 – Q-86)'
);

// Shift question anchors in reverse (from 85 down to 78)
for (let num = 85; num >= 78; num--) {
  const currentRegex = new RegExp(`### \`Q-${num}\` —`, 'g');
  const targetId = `### \`Q-${num + 1}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Prepare markdown for Q-78
const q78Md = `
---

### \`Q-78\` — An SDK is causing crashes. How do you prove it and fix it?

- **Category:** \`Engineering Leadership & Operations\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"To prove and fix an SDK crash, I first gather forensic proof via symbolicated crash stacks, loaded binary images, SDK version tagging in Crashlytics, and comparative cohort analysis, confirming causality by turning the SDK off via a remote kill switch; I immediately mitigate user impact via the kill switch or a rolled-back hotfix, isolate the bug with Address/Thread Sanitizers in a standalone reproduction project for the vendor, and deploy thread-safety or deferred launch workarounds."*

#### 📖 Detailed Answer

${newQ78.answer}

#### 💻 Architectural Triage & Mitigation Example

\`\`\`swift
${newQ78.codeExample}
\`\`\`
`;

// Insert q78Md right before "## 🧠 Memory Management (Q-79 – Q-86)"
const insertMarker = '## 🧠 Memory Management (Q-79 – Q-86)';
const markerIdx = md.indexOf(insertMarker);
if (markerIdx === -1) {
    console.error('Could not find insertMarker in QUESTIONS.md');
    process.exit(1);
}

md = md.substring(0, markerIdx) + q78Md + '\n\n---\n\n' + md.substring(markerIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
