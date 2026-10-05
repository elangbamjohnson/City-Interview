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

const newQ77 = {
  id: "Q-77",
  category: "Engineering Leadership & Operations",
  difficulty: "Staff",
  question: "How do you evaluate a new third-party SDK before adding it?",
  interviewSentence: "Before integrating any third-party SDK, I evaluate seven dimensions: Need (build vs buy), License (commercial compatibility), Maintenance (PR velocity & Swift Concurrency support), Size & Performance (binary footprint & launch impact), Privacy & Security (Apple Privacy Manifest & network audit), Control (binary vs source), and an Exit Plan (protocol wrapper and remote kill switch).",
  answer: `Say it like this:

"I start by asking whether I need it at all. If the feature is small, like a simple image cache, I may write it myself. Every SDK adds size, risk, and maintenance work, so it has to be worth it. If the answer is yes, I check seven things:

• **Need:** Can I build this myself, or skip it? An SDK has to earn its place.
• **License:** Is it MIT or Apache, or does it have terms that do not fit a commercial app? Legal needs to be fine with it.
• **Maintenance:** I look at the last release date, how fast issues get answered, and how many are open. It should support the newest iOS and Xcode, Swift concurrency, and Swift Package Manager. A project that is quiet for a year is a warning sign.
• **Size and speed:** I build the app with and without the SDK and compare the download size. I also measure launch time, memory, and battery, because some SDKs do heavy work at startup.
• **Privacy and security:** I check what data it collects, where it sends it, and whether it tracks users. It needs a privacy manifest, and the data it collects must appear in my App Store privacy answers. I run the app through a proxy tool and watch its network calls. I also check that it does not ask for permissions I do not expect.
• **Control and quality:** Is it source code or a closed binary? A binary is harder to debug, and I cannot patch it. I check that it does not clash with my other dependencies, and that it does not swizzle system methods in a surprising way.
• **Exit plan:** I never call the SDK from all over the app. I wrap it behind my own protocol, so replacing it means changing one file, not hundreds.

Before I decide, I build a small spike. I add the SDK on a branch, run it on a real device, and watch crashes, size, and network traffic. If it passes, I roll it out behind a feature flag with a kill switch, so I can turn it off without waiting for an App Store review."

#### 1. Pinned Version in Package.swift (Supply-Chain Security)

\`\`\`swift
// Package.swift
// 💡 Pin exact version to avoid unexpected breaking changes or compromised minor releases
dependencies: [
    .package(
        url: "https://github.com/vendor/analytics-sdk.git",
        exact: "3.4.1" // Pin exact version or commit hash for reproducible, hermetic builds
    )
]
\`\`\`

#### 2. Apple Privacy Manifest (PrivacyInfo.xcprivacy)

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!-- 💡 Mandatory Apple privacy manifest declaring tracking domains, data types, and required reasons -->
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypePerformanceData</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <false/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAnalytics</string>
            </array>
        </dict>
    </array>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
\`\`\`

#### 3. Protocol Abstraction Wrapper (Exit Plan)

\`\`\`swift
// 💡 Wrap third-party SDK behind an internal domain protocol to prevent vendor lock-in
protocol AnalyticsTracker: Sendable {
    func logEvent(name: String, parameters: [String: Any])
}

final class VendorAnalyticsAdapter: AnalyticsTracker {
    func logEvent(name: String, parameters: [String: Any]) {
        // VendorSDK.shared.track(event: name, properties: parameters)
    }
}
\`\`\`

#### 4. Rollout with Remote Kill Switch

\`\`\`swift
// 💡 Dark launch behind a remote feature flag; kill switch disables SDK server-side in emergency
final class FeatureFlaggedAnalyticsService: AnalyticsTracker {
    private let primaryVendor: AnalyticsTracker
    private let fallbackLogger: AnalyticsTracker
    private let remoteConfig: RemoteConfigService

    init(primaryVendor: AnalyticsTracker, fallbackLogger: AnalyticsTracker, remoteConfig: RemoteConfigService) {
        self.primaryVendor = primaryVendor
        self.fallbackLogger = fallbackLogger
        self.remoteConfig = remoteConfig
    }

    func logEvent(name: String, parameters: [String: Any]) {
        if remoteConfig.isFeatureEnabled("enable_third_party_analytics") {
            primaryVendor.logEvent(name: name, parameters: parameters)
        } else {
            fallbackLogger.logEvent(name: name, parameters: parameters)
        }
    }
}
\`\`\`

One-liner: Before adding an SDK I check need, license, maintenance, size and speed, privacy, control, and exit plan, and I wrap it behind my own protocol with a kill switch so it is easy to remove.

Memory trick: N-L-M-S-P-C-E → "Need, License, Maintenance, Size and speed, Privacy, Control, Exit plan."`,
  codeExample: `// =========================================================================
// 🛡️ SENIOR / STAFF INTERVIEW ARCHITECTURE: Third-Party SDK Evaluation
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • Build vs. Buy: The best dependency is no dependency. An SDK must earn its place
//   by saving months of ongoing compliance/infrastructure work (e.g. Stripe, Mapbox).
// • Supply-Chain Security: Pin exact versions in Package.swift. Never use floating
//   ranges like '.upToNextMajor' for closed-source or mission-critical SDKs.
// • Privacy Manifest Compliance: Enforce 'PrivacyInfo.xcprivacy' verification in CI
//   to avoid App Store Connect upload rejections (mandatory since Spring 2024).
// • Anti-Corruption Layer: Always implement a Protocol Wrapper / Adapter pattern. Domain
//   code never imports 'VendorSDK'; if the vendor changes pricing or terms, swap 1 file.
// • Feature Flag Kill Switch: Dark-launch the integration; if the SDK introduces crashes,
//   memory leaks, or ANR lockups, disable it immediately from server without App Store review.

import Foundation

// MARK: - 1. Domain Protocol (Anti-Corruption Layer)

public protocol ImageCachingService: Sendable {
    func image(for url: URL) async throws -> Data
    func store(_ data: Data, for url: URL) async
}

// MARK: - 2. Vendor Adapter Implementation

public final class ThirdPartyImageSDKAdapter: ImageCachingService {
    // Underlying third-party dependency is encapsulated exclusively within this file
    // private let sdk = ThirdPartyVendorSDK.defaultInstance()

    public init() {}

    public func image(for url: URL) async throws -> Data {
        // Adapt vendor response to domain contract
        // return try await sdk.fetch(url)
        return Data()
    }

    public func store(_ data: Data, for url: URL) async {
        // sdk.cache(data, key: url.absoluteString)
    }
}

// MARK: - 3. Local Native Fallback

public final class NativeURLCacheAdapter: ImageCachingService {
    private let cache = URLCache(memoryCapacity: 20 * 1024 * 1024, diskCapacity: 100 * 1024 * 1024)

    public init() {}

    public func image(for url: URL) async throws -> Data {
        let request = URLRequest(url: url)
        if let cached = cache.cachedResponse(for: request) {
            return cached.data
        }
        let (data, response) = try await URLSession.shared.data(for: request)
        cache.storeCachedResponse(CachedURLResponse(response: response, data: data), for: request)
        return data
    }

    public func store(_ data: Data, for url: URL) async {
        let request = URLRequest(url: url)
        let response = URLResponse(url: url, mimeType: "image/png", expectedContentLength: data.count, textEncodingName: nil)
        cache.storeCachedResponse(CachedURLResponse(response: response, data: data), for: request)
    }
}

// MARK: - 4. Resilient Service with Remote Kill Switch

public protocol RemoteConfigProvider: Sendable {
    func isEnabled(_ key: String) -> Bool
}

public final class ResilientImageManager: ImageCachingService {
    private let vendorAdapter: ImageCachingService
    private let nativeFallback: ImageCachingService
    private let config: RemoteConfigProvider

    public init(
        vendorAdapter: ImageCachingService,
        nativeFallback: ImageCachingService,
        config: RemoteConfigProvider
    ) {
        self.vendorAdapter = vendorAdapter
        self.nativeFallback = nativeFallback
        self.config = config
    }

    public func image(for url: URL) async throws -> Data {
        // 🛡️ Kill switch: If remote flag is toggled OFF, immediately route to native fallback
        if config.isEnabled("enable_vendor_image_cache") {
            return try await vendorAdapter.image(for: url)
        } else {
            return try await nativeFallback.image(for: url)
        }
    }

    public func store(_ data: Data, for url: URL) async {
        if config.isEnabled("enable_vendor_image_cache") {
            await vendorAdapter.store(data, for: url)
        } else {
            await nativeFallback.store(data, for: url)
        }
    }
}`
};

// 1. Shift questions in questions.json from index 76 onwards (current Q-77: ARC onwards)
for (let i = 76; i < questions.length; i++) {
  const currentNum = i + 1; // 77..84
  const newNum = currentNum + 1; // 78..85
  questions[i].id = "Q-" + String(newNum).padStart(2, '0');
}

// Insert newQ77 at index 76 (right after Q-76: crash log symbolication)
questions.splice(76, 0, newQ77);
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
        cat.questionIds = ['Q-75', 'Q-76', 'Q-77'];
        cat.summary = "Production incident triage, crash log analysis & dSYM symbolication, third-party SDK evaluation & governance, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.";
    } else if (cat.id === 'memory-management') {
        cat.questionIds = ['Q-78', 'Q-79', 'Q-80', 'Q-81', 'Q-82', 'Q-83', 'Q-84', 'Q-85'];
    }
}
const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(topicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS: shift keys >= 77 up by 1, and add Q-77
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
const newQ2D = {};

for (const [key, val] of Object.entries(oldQ2D)) {
    const num = parseInt(key.replace('Q-', ''), 10);
    if (num >= 77) {
        const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
        newQ2D[shiftedKey] = val;
    } else {
        newQ2D[key] = val;
    }
}

newQ2D['Q-77'] = [
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
html = html.replace(/84 Questions/g, '85 Questions');
html = html.replace(/84 questions/g, '85 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 3. Update QUESTIONS.md
md = md.replace(
  '| **Engineering Leadership & Operations** | `2` |',
  '| **Engineering Leadership & Operations** | `3` |'
);
md = md.replace(
  '| **Total** | **`84`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`85`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 84 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 85 iOS interview questions'
);

// Update Section headers
md = md.replace(
  '## 👔 Engineering Leadership & Operations (Q-75 – Q-76)',
  '## 👔 Engineering Leadership & Operations (Q-75 – Q-77)'
);
md = md.replace(
  '## 🧠 Memory Management (Q-77 – Q-84)',
  '## 🧠 Memory Management (Q-78 – Q-85)'
);

// Shift question anchors in reverse (from 84 down to 77)
for (let num = 84; num >= 77; num--) {
  const currentRegex = new RegExp(`### \`Q-${num}\` —`, 'g');
  const targetId = `### \`Q-${num + 1}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Prepare markdown for Q-77
const q77Md = `
---

### \`Q-77\` — How do you evaluate a new third-party SDK before adding it?

- **Category:** \`Engineering Leadership & Operations\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"Before integrating any third-party SDK, I evaluate seven dimensions: Need (build vs buy), License (commercial compatibility), Maintenance (PR velocity & Swift Concurrency support), Size & Performance (binary footprint & launch impact), Privacy & Security (Apple Privacy Manifest & network audit), Control (binary vs source), and an Exit Plan (protocol wrapper and remote kill switch)."*

#### 📖 Detailed Answer

${newQ77.answer}

#### 💻 Architectural Implementation Example

\`\`\`swift
${newQ77.codeExample}
\`\`\`
`;

// Insert q77Md right before "## 🧠 Memory Management (Q-78 – Q-85)"
const insertMarker = '## 🧠 Memory Management (Q-78 – Q-85)';
const markerIdx = md.indexOf(insertMarker);
if (markerIdx === -1) {
    console.error('Could not find insertMarker in QUESTIONS.md');
    process.exit(1);
}

md = md.substring(0, markerIdx) + q77Md + '\n\n---\n\n' + md.substring(markerIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
