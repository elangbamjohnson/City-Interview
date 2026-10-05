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

const newQ79 = {
  id: "Q-79",
  category: "Engineering Leadership & Operations",
  difficulty: "Staff",
  question: "A crash happens only in production, for 1% of users, and you cannot reproduce it. What do you do?",
  interviewSentence: "When a production crash affects a 1% cohort and resists local reproduction, I baseline its blast radius, analyze symbolicated exception types, cross-reference demographic/hardware cohorts against baseline app population distributions, enrich telemetry with Crashlytics breadcrumbs and MetricKit payloads, audit code paths for corrupted or edge-case payloads and race conditions, force the failure via sanitizers and simulated constraints, and mitigate user impact immediately via remote kill switches and defensive phased hotfixes.",
  answer: `This happens to every app that has real users. Your phone, your simulator, and your test accounts are only a tiny part of what users do. Real users have old devices, full storage, strange languages, huge accounts, bad networks, and settings you never tried. A crash that hits 1% of users can still be thousands of people, so it matters. The work is not to guess. It is to turn "I can't reproduce it" into "I know what these users have in common".

Say it like this:

"First, I check how serious it is. How many users are affected, is it growing, and did it start with the latest release? That tells me how fast I must move.

Second, I read the crash report properly. I symbolicate it, look at the crashed thread, and check the exception type. A force unwrap, a memory error, a watchdog kill, and an out-of-memory kill are four different problems, and each one points to a different place.

Third, I look for the pattern. I split the crashes by app version, iOS version, device model, language, region, and anything else my crash tool records. The key is to compare against the normal user population. If 60% of the crashes are on one iOS version, but only 5% of my users are on it, that is a real clue. If the crashes match the normal mix, the cause is probably not the device or the OS.

Fourth, I add more information. If the report does not say enough, I add breadcrumbs, which are short log lines that say what the user did before the crash, and custom keys, like the current screen, free memory, and feature flags. I also use MetricKit, which sends diagnostic reports from the phones. Then I wait for the next crashes to arrive with more detail.

Fifth, I read the code at the crash line and ask what real-world data could break it. Usually the answer is something I never tested: an empty list, a missing value from the server, a very long name, a special character in a URL, a user with ten thousand items, a date in an unusual format, or a user who upgraded from a very old version. I also look for races between threads, because they only fail on some timing.

Sixth, I try to reproduce it on purpose. I match the device and iOS version, switch the language and region, slow the network, simulate low memory, fill the disk, and run with Thread Sanitizer and Address Sanitizer. I also write a test that sends odd values into the suspect code.

Seventh, I protect users while I investigate. If a feature is the suspect, I turn it off with a kill switch. If the cause is clear, I ship a small defensive fix, like replacing a force unwrap with a safe check, and I release it in phases.

Finally, I watch the crash rate for that group after the release, add a regression test, and write down what I learned."

#### 🔬 Steps to Follow
1. **Measure:** Quantify blast radius, trend velocity, and first release appearance.
2. **Read:** Symbolicate backtrace, inspect crashed thread, and decode exception type (\`EXC_BAD_ACCESS\`, \`SIGABRT\`, \`0x8badf00d\`, Jetsam).
3. **Find the pattern:** Compare cohort dimensions (OS, device, locale, memory state) against normal population baseline.
4. **Enrich telemetry:** Deploy non-PII breadcrumbs, diagnostic state keys, and MetricKit subscribers.
5. **Audit code:** Form hypotheses around edge-case schemas, malformed inputs, data migration, and race conditions.
6. **Reproduce on purpose:** Match device profile, simulate environmental stress (Network Link Conditioner, low memory, full disk), and run sanitizers.
7. **Protect users:** Toggle kill switch, deploy defensive validation guard, and ship via phased release.
8. **Verify & document:** Monitor cohort crash-free rate, add automated regression tests, and write blameless post-mortem.

---

#### 1. Add Context & Telemetry Keys to Every Crash Report

\`\`\`swift
import FirebaseCrashlytics
import os

func addCrashContext(screen: String) {
    let crash = Crashlytics.crashlytics()
    // 💡 Key environmental state to isolate low-frequency production bugs
    crash.setCustomValue(screen, forKey: "current_screen")
    crash.setCustomValue(Locale.current.identifier, forKey: "locale")
    crash.setCustomValue(ProcessInfo.processInfo.isLowPowerModeEnabled, forKey: "low_power_mode")
    crash.setCustomValue(Int(os_proc_available_memory() / 1_048_576), forKey: "free_memory_mb")
    crash.log("Navigation: User presented \(screen)")
}
\`\`\`

#### 2. Leave Granular User Action Breadcrumbs

\`\`\`swift
func didTapCheckout(itemCount: Int) {
    // 🛡️ Breadcrumbs record sequence of user interactions leading up to crash
    Crashlytics.crashlytics().log("User tapped checkout button. Item count: \(itemCount)")
    startCheckout()
}
// Keep logs concise; strictly exclude sensitive user PII (names, emails, credentials, card data)
\`\`\`

#### 3. Harvest System Diagnostics via MetricKit

\`\`\`swift
import MetricKit

final class DiagnosticsReceiver: NSObject, MXMetricManagerSubscriber {
    func didReceive(_ payloads: [MXDiagnosticPayload]) {
        for payload in payloads {
            // 💡 MXCrashDiagnostic includes Apple-symbolicated stack traces & termination reasons
            for crash in payload.crashDiagnostics ?? [] {
                uploadDiagnosticReport(crash.jsonRepresentation())
            }
        }
    }
}

// Subscribe during app initialization in AppDelegate / App struct
MXMetricManager.shared.add(DiagnosticsReceiver())
\`\`\`

#### 4. The Usual Production-Only Causes & Safe Defensive Patterns

\`\`\`swift
// ❌ Dangerous: Index out of range on empty list
let first = items[0]

// ✅ Safe: Gracefully handle empty array
guard let first = items.first else { return }

// ❌ Dangerous: Force-unwrapping unencoded or localized URL
let url = URL(string: item.link)!

// ✅ Safe: Validate URL construction and log telemetry telemetry on bad server payload
guard let url = URL(string: item.link) else {
    Crashlytics.crashlytics().log("Malformed server URL received: \(item.link.prefix(50))")
    return
}
\`\`\`

#### 5. Try to Reproduce It On Purpose (Simulate Extreme Conditions)
\`\`\`
Xcode > Product > Scheme > Edit Scheme > Run > Options
  • App Language & Region   # Test Right-to-Left (Arabic), long strings (German), non-Gregorian calendars
  • Core Location           # Test extreme coordinates, null locations, denied authorization

Xcode > Product > Scheme > Edit Scheme > Run > Diagnostics
  • Thread Sanitizer (TSan) # Catches concurrent read/write races that only crash under specific thread timing
  • Address Sanitizer (ASan)# Detects buffer overruns and use-after-free
  • Main Thread Checker     # Traps background UI updates

Physical Device & Simulator Stress Testing:
  • Simulator > Debug > Simulate Memory Warning
  • Developer Settings > Network Link Conditioner (100% Loss, 3G, High Latency)
  • Fill device disk storage to 99% capacity (catches SQLite/Core Data disk full crashes)
  • Test upgrade path: Install old App Store production build, then run new build on top
\`\`\`

#### 6. Protect Users via Remote Feature Flag Kill Switch

\`\`\`swift
func showRecommendations() {
    // 🛡️ Kill switch stops crash immediately server-side without waiting days for App Store review
    guard RemoteConfig.bool("recommendations_enabled") else {
        return
    }
    renderRecommendations()
}
\`\`\`

---

Good to mention (Staff-Level Interview Points):
• **Baseline Population Normalization:** A crash distribution showing 70% iOS 18 devices is only meaningful if your total active user base on iOS 18 is substantially lower (e.g. 15%). Always compute relative over-indexing ratios.
• **Time-Triggered Clues:** Crashes that suddenly spike on a calendar boundary often point to Daylight Saving Time (DST) conversions, expired SSL/token certificates, or server backend deployment shifts.
• **Exception Signatures:** \`EXC_BREAKPOINT\` typically flags Swift runtime traps (force-unwraps, array out of bounds, integer overflow). \`EXC_BAD_ACCESS\` signals corrupted memory or dangling pointers. Watchdog \`0x8badf00d\` flags main thread blocking. Out-of-memory (Jetsam) leaves no stack trace at all.
• **Edge-Case Data Payloads:** Production bugs are rarely device bugs; they are almost always data bugs (e.g., zero-length strings, emojis in database primary keys, huge 50,000-item arrays, dates missing seconds).
• **Timing & Asynchronous Deadlocks:** Race conditions that pass QA on high-end developer test devices often fail on throttled, low-end user devices where background task completion outpaces main thread setup.
• **Avoid Blind "Catch-All" Swallowing:** Replacing a crash with an empty \`guard else { return }\` can silently leave users stranded on an unresponsive blank screen. Always pair defensive fallbacks with logging and user-facing error UI.
• **Automated Regression Locking:** Never close an incident without writing a parameterized unit test passing the exact malformed payload into the function.

One-liner: When I cannot reproduce a production crash, I find what the affected users have in common, add breadcrumbs and diagnostics for the missing details, test with realistic bad data and conditions, and protect users with a kill switch and a phased fix.

Memory trick: M-R-P-A-C-R-P-V → "Measure, Read, Pattern, Add info, Code review, Reproduce on purpose, Protect, Verify."`,
  codeExample: `// =========================================================================
// 🕵️ SENIOR / STAFF INTERVIEW ARCHITECTURE: 1% Production Crash Forensics
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • The 1% Problem: A 1% crash on 5M DAU is 50,000 users crashing daily.
// • Cohort Over-Indexing: Normalize crash counts against base user population
//   (e.g., if 80% of crashes are on iPhone SE while SE represents only 4% of traffic).
// • Forensic Telemetry: Record available memory, low power mode, and localized breadcrumbs.
// • Defensive Resilience: Protect users with non-fatal logging and null-safe fallbacks.

import Foundation
import MetricKit
import os

// MARK: - 1. Forensic Telemetry Manager

public final class ProductionTelemetry {
    public static let shared = ProductionTelemetry()

    private init() {}

    public func captureCrashContext(screen: String) {
        let memoryBytes = os_proc_available_memory()
        let memoryMB = Int(memoryBytes / (1024 * 1024))
        let isLowPower = ProcessInfo.processInfo.isLowPowerModeEnabled
        let localeId = Locale.current.identifier

        // 🛡️ Attach non-PII diagnostic metadata to crash report
        print("[Telemetry] Screen: \\(screen), FreeRAM: \\(memoryMB)MB, LowPower: \\(isLowPower), Locale: \\(localeId)")
    }

    public func recordBreadcrumb(_ message: String) {
        // Enqueue short interaction breadcrumb (e.g. into Crashlytics/Datadog)
        print("[Breadcrumb] \\(message)")
    }
}

// MARK: - 2. MetricKit Diagnostic Subscriber

public final class SystemDiagnosticSubscriber: NSObject, MXMetricManagerSubscriber {
    public static let shared = SystemDiagnosticSubscriber()

    public func register() {
        MXMetricManager.shared.add(self)
    }

    public func didReceive(_ payloads: [MXDiagnosticPayload]) {
        for payload in payloads {
            if let crashDiagnostics = payload.crashDiagnostics {
                for crash in crashDiagnostics {
                    // 💡 Harvest Apple-level crash reasons & termination signals
                    let signal = crash.exceptionCode?.intValue ?? 0
                    let reason = crash.terminationReason ?? "Unknown"
                    print("[MetricKit] Signal: \\(signal), Reason: \\(reason)")
                }
            }
        }
    }
}

// MARK: - 3. Defensive Data Pipeline with Non-Fatal Telemetry

public struct ProductFeedParser {
    public init() {}

    public func parseProductURL(from rawString: String?) -> URL? {
        // 🛡️ Defend against nil, empty, or whitespace-only inputs
        guard let raw = rawString?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty else {
            return nil
        }

        // 🛡️ Defend against unencoded characters or malformed links without crashing
        if let url = URL(string: raw), url.scheme != nil {
            return url
        }

        // 🛡️ Percent-encode fallback for international/special characters
        if let encoded = raw.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
           let url = URL(string: encoded) {
            return url
        }

        // Log non-fatal telemetry event so backend and QA can identify malformed records
        ProductionTelemetry.shared.recordBreadcrumb("Malformed URL encountered: \\(raw.prefix(30))")
        return nil
    }
}`
};

// 1. Shift questions in questions.json from index 78 onwards (current Q-79: ARC onwards)
for (let i = 78; i < questions.length; i++) {
  const currentNum = i + 1; // 79..86
  const newNum = currentNum + 1; // 80..87
  questions[i].id = "Q-" + String(newNum).padStart(2, '0');
}

// Insert newQ79 at index 78
questions.splice(78, 0, newQ79);
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
        cat.questionIds = ['Q-75', 'Q-76', 'Q-77', 'Q-78', 'Q-79'];
        cat.summary = "Production incident triage, crash log analysis & dSYM symbolication, 1% production crash forensics, third-party SDK evaluation, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.";
    } else if (cat.id === 'memory-management') {
        cat.questionIds = ['Q-80', 'Q-81', 'Q-82', 'Q-83', 'Q-84', 'Q-85', 'Q-86', 'Q-87'];
    }
}
const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(topicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS: shift keys >= 79 up by 1, and add Q-79
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
const newQ2D = {};

for (const [key, val] of Object.entries(oldQ2D)) {
    const num = parseInt(key.replace('Q-', ''), 10);
    if (num >= 79) {
        const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
        newQ2D[shiftedKey] = val;
    } else {
        newQ2D[key] = val;
    }
}

newQ2D['Q-79'] = [
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
html = html.replace(/86 Questions/g, '87 Questions');
html = html.replace(/86 questions/g, '87 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 3. Update QUESTIONS.md
md = md.replace(
  '| **Engineering Leadership & Operations** | `4` |',
  '| **Engineering Leadership & Operations** | `5` |'
);
md = md.replace(
  '| **Total** | **`86`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`87`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 86 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 87 iOS interview questions'
);

// Update Section headers
md = md.replace(
  '## 👔 Engineering Leadership & Operations (Q-75 – Q-78)',
  '## 👔 Engineering Leadership & Operations (Q-75 – Q-79)'
);
md = md.replace(
  '## 🧠 Memory Management (Q-79 – Q-86)',
  '## 🧠 Memory Management (Q-80 – Q-87)'
);

// Shift question anchors in reverse (from 86 down to 79)
for (let num = 86; num >= 79; num--) {
  const currentRegex = new RegExp(`### \`Q-${num}\` —`, 'g');
  const targetId = `### \`Q-${num + 1}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Prepare markdown for Q-79
const q79Md = `
---

### \`Q-79\` — A crash happens only in production, for 1% of users, and you cannot reproduce it. What do you do?

- **Category:** \`Engineering Leadership & Operations\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"When a production crash affects a 1% cohort and resists local reproduction, I baseline its blast radius, analyze symbolicated exception types, cross-reference demographic/hardware cohorts against baseline app population distributions, enrich telemetry with Crashlytics breadcrumbs and MetricKit payloads, audit code paths for corrupted or edge-case payloads and race conditions, force the failure via sanitizers and simulated constraints, and mitigate user impact immediately via remote kill switches and defensive phased hotfixes."*

#### 📖 Detailed Answer

${newQ79.answer}

#### 💻 Forensic Telemetry & Defensive Architecture Example

\`\`\`swift
${newQ79.codeExample}
\`\`\`
`;

// Insert q79Md right before "## 🧠 Memory Management (Q-80 – Q-87)"
const insertMarker = '## 🧠 Memory Management (Q-80 – Q-87)';
const markerIdx = md.indexOf(insertMarker);
if (markerIdx === -1) {
    console.error('Could not find insertMarker in QUESTIONS.md');
    process.exit(1);
}

md = md.substring(0, markerIdx) + q79Md + '\n\n---\n\n' + md.substring(markerIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
