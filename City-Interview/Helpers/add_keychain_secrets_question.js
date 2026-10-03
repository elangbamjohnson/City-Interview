const fs = require('fs');
const vm = require('vm');

const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';
const GENERATED_DOCS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Helpers/generated_docs.json';
const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

// 1. Read existing questions and docs
let questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
const generatedDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));

console.log('Total questions before insertion:', questions.length);

// Map existing questions to their companion docs before ID shift
const textToDocs = new Map();
questions.forEach(q => {
  if (generatedDocs.QUESTION_TO_DOCS[q.id]) {
    textToDocs.set(q.question, generatedDocs.QUESTION_TO_DOCS[q.id]);
  }
});

// 2. Define the new question: "How do you store tokens and secrets on iOS? What goes in Keychain?"
const newQuestion = {
  id: "Q-47", // Placeholder, will be re-indexed
  category: "Security, Auth & Compliance",
  difficulty: "Advanced",
  question: "How do you store tokens and secrets on iOS? What goes in Keychain?",
  interviewSentence: "Secrets that could let someone act as the user go in the Keychain, harmless settings go in UserDefaults, and real API secrets stay on the server.",
  answer: `Every app has some data that must stay private: login tokens, refresh tokens, passwords, and API keys. If I store them in a normal place like UserDefaults or a plain file, anyone with a backup or a jailbroken phone can read them. The Keychain is the iOS safe for small secrets. It is encrypted, the system protects it, and it can survive an app delete and reinstall.

Say it like this:
"My rule is simple: if losing it would let someone pretend to be the user, it goes in the Keychain.

So in the Keychain, I store the access token, the refresh token, passwords, and any private key or session secret. In UserDefaults, I store only harmless settings like dark mode or 'onboarding done'. Big files go to disk with Data Protection turned on. And I never put secrets in the code, in Info.plist, or in the app bundle, because anyone can extract those from the app.

The Keychain stores each item with a class, like kSecClassGenericPassword, and a key. I save, read, update, and delete using four functions: SecItemAdd, SecItemCopyMatching, SecItemUpdate, and SecItemDelete. I also choose when the item can be read, using kSecAttrAccessible. For most tokens, I use AfterFirstUnlockThisDeviceOnly. It lets background work read the token after the first unlock, and ThisDeviceOnly stops it from moving to another phone through backup. For very sensitive data, I use WhenUnlockedThisDeviceOnly, or add Face ID with an access control, so the user must unlock to read it.

For API keys, I know that nothing inside the app is truly safe, because people can reverse the app. So I keep real secrets on my server, and the app gets a short-lived token instead.

I also keep tokens short-lived, so if one leaks, it expires soon. And on logout, I delete the Keychain items."

What Goes Where (The Storage Matrix):
• Keychain: Access tokens, refresh tokens, user passwords, cryptographic private keys, biometric-gated secrets.
• UserDefaults: Harmless non-sensitive user preferences (e.g. app theme, sound toggle, 'hasSeenOnboarding').
• File System with Data Protection (NSFileProtectionComplete): Larger structured databases (Core Data / SQLite files, document caches) encrypted while device is locked.
• Never in the Client App: Hardcoded API master secrets, payment private keys, or credentials embedded in binary code or Info.plist.

The 4 Core Keychain Operations (CRUD) & Accessibility Flags:
1. Save: SecItemAdd with kSecClassGenericPassword. Always call SecItemDelete first (upsert pattern) to avoid errSecDuplicateItem (-25299).
2. Read: SecItemCopyMatching with kSecReturnData: true and kSecMatchLimit: kSecMatchLimitOne.
3. Update: SecItemUpdate passing the query filter and updated kSecValueData dictionary.
4. Delete: SecItemDelete when the user logs out or session is invalidated.
5. Biometric Protection: SecAccessControlCreateWithFlags with .biometryCurrentSet and kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly, requiring Face ID/Touch ID to decrypt.

Accessibility Policies (kSecAttrAccessible):
• kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly: Recommended default for auth tokens. Decrypted once user unlocks the device after reboot; remains accessible for background transfers/syncing while locked, and excluded from iCloud/iTunes backups.
• kSecAttrAccessibleWhenUnlockedThisDeviceOnly: Maximum security for payment or biometric secrets. Only decryptable while device screen is actively unlocked.

Good to mention (Staff-Level Interview Points):
• Pick accessibility levels deliberately: AfterFirstUnlock is required for background BGTaskScheduler refresh tasks; WhenUnlocked is safer but inaccessible during background wakes.
• ThisDeviceOnly protection: Prevents sensitive keys from being migrated across devices during unencrypted iTunes backups or iCloud backups.
• Keychain Persistence Across App Deletions: Keychain items survive app uninstallations. On first launch, check a UserDefaults "isFirstLaunch" flag and clear legacy Keychain items to ensure clean state.
• Keychain Access Groups (kSecAttrAccessGroup): Use Keychain Sharing entitlements to share credentials between your main app, App Clips, and extensions (e.g. Widget, Notification Service Extension).
• Zero Secrets in Logs: Never output auth tokens to OSLog/print statements or embed them as query parameters in URLs (use Authorization: Bearer headers).
• Token Rotation & Lifecycles: Pair short-lived JWT access tokens (15-min) with refresh tokens. Rotate refresh tokens upon each use to minimize the blast radius of token interception.
• Defense-in-Depth: Certificate pinning protects tokens in transit across the wire; Keychain protects tokens at rest on device flash memory.

One-liner: Secrets that could let someone act as the user go in the Keychain, harmless settings go in UserDefaults, and real API secrets stay on the server.

Memory trick: K-U-S → "Keychain = Keep secrets, UserDefaults = Unimportant settings, Server = real API secrets."`,
  codeExample: `// =========================================================================
// SENIOR INTERVIEW ARCHITECTURE: iOS Keychain Token & Secrets Management (K-U-S)
// =========================================================================
import Foundation
import Security

// =========================================================================
// 1. KEYCHAIN CRUD: Save, Read, Update, Delete
// =========================================================================
// SENIOR TALKING POINT:
// The Keychain is a SQLite database encrypted by the OS using hardware-backed keys.
// Unlike UserDefaults (unencrypted plist), Keychain persists across app deletions
// and is inaccessible via device backups when using 'ThisDeviceOnly'.

enum KeychainManager {
    
    // MARK: 1. Save (Upsert pattern: delete old value first to prevent errSecDuplicateItem)
    static func saveToken(_ token: String, key: String) {
        let data = Data(token.utf8) // Keychain values are stored as raw Data
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            // SENIOR TALKING POINT: Accessible after first device unlock; never exported in backups
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        
        // Remove existing item to avoid errSecDuplicateItem (-25299)
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        assert(status == errSecSuccess, "Keychain save failed with OSStatus: \\(status)")
    }
    
    // MARK: 2. Read (Query matching single item with decrypted data payload)
    static func readToken(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,        // Return decrypted payload
            kSecMatchLimit as String: kSecMatchLimitOne // Stop search after first match
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess, let data = result as? Data else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }
    
    // MARK: 3. Update (In-place mutation without recreating metadata)
    static func updateToken(_ token: String, key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        let changes: [String: Any] = [
            kSecValueData as String: Data(token.utf8)
        ]
        let status = SecItemUpdate(query as CFDictionary, changes as CFDictionary)
        if status == errSecItemNotFound {
            saveToken(token, key: key) // Fallback to save if not found
        }
    }
    
    // MARK: 4. Delete (Critical for secure logout and wiping sessions)
    static func deleteToken(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
    
    // =====================================================================
    // 2. BIOMETRIC ACCESS CONTROL: Face ID / Touch ID Gated Secrets
    // =====================================================================
    // SENIOR TALKING POINT:
    // SecAccessControl binds the item to the Secure Enclave.
    // '.biometryCurrentSet' invalidates the item if the user adds or modifies
    // enrolled fingerprints or Face ID profiles (stops unauthorized biometric takeover).
    static func saveBiometricProtectedToken(_ token: String, key: String) {
        var error: Unmanaged<CFError>?
        guard let access = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly, // Requires passcode set
            .biometryCurrentSet,                             // Invalidates on biometric enrollment changes
            &error
        ) else {
            print("Failed to create SecAccessControl: \\(String(describing: error))")
            return
        }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: Data(token.utf8),
            kSecAttrAccessControl as String: access
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
}

// =========================================================================
// 3. ARCHITECTURAL WRAPPER: Type-Safe Session Token Store
// =========================================================================
// SENIOR TALKING POINT:
// Encapsulating raw C-APIs behind a clean Swift property wrapper or struct
// ensures UI and Networking components never handle low-level SecItem dictionaries.
struct TokenStore {
    private let key = "com.citi.retailbanking.accessToken"
    
    var token: String? {
        get { KeychainManager.readToken(key: key) }
        set {
            if let newValue {
                KeychainManager.saveToken(newValue, key: key)
            } else {
                KeychainManager.deleteToken(key: key) // Clear on logout
            }
        }
    }
}

// Usage Example:
// var store = TokenStore()
// store.token = "jwt_ey654321..." // Saved securely to Keychain
// print(store.token ?? "none")     // Retrieved decrypted
// store.token = nil               // Wiped on session termination`
};

// 3. Insert right after Q-46 ("Certificate pinning — what it is, why it stops MITM attacks")
const index46 = questions.findIndex(q => q.id === 'Q-46');
console.log('Inserting right after Q-46 at index:', index46 + 1);
questions.splice(index46 + 1, 0, newQuestion);

// Re-index all questions sequentially Q-01 to Q-73
questions.forEach((q, idx) => {
  q.id = `Q-${String(idx + 1).padStart(2, '0')}`;
});

console.log('New total questions count:', questions.length);

// 4. Save questions.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
console.log('Saved questions.json successfully!');

// 5. Re-map QUESTION_TO_DOCS with shifted IDs
const updatedQToDocs = {};
const securityDocs = [
  {
    docId: "security-comparison",
    title: "Security Decision Table (Keychain, Enclave, Pinning)",
    icon: "🔒",
    filename: "SecurityDecisionTable.md"
  }
];

questions.forEach(q => {
  if (q.question.includes("store tokens and secrets") || q.question.includes("Keychain")) {
    updatedQToDocs[q.id] = securityDocs;
  } else if (textToDocs.has(q.question)) {
    updatedQToDocs[q.id] = textToDocs.get(q.question);
  }
});

generatedDocs.QUESTION_TO_DOCS = updatedQToDocs;
fs.writeFileSync(GENERATED_DOCS_PATH, JSON.stringify(generatedDocs, null, 2), 'utf-8');
console.log('Updated generated_docs.json successfully!');

// 6. Define TOPIC_CATEGORIES for 73 questions
const TOPIC_CATEGORIES = [
  {
    id: "architecture",
    title: "Architecture & Design Patterns",
    shortTitle: "Architecture",
    icon: "🏗️",
    color: "#D97757",
    summary: "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles.",
    docIds: ["clean-architecture", "coordinator-pattern", "dependency-injection", "mvvm", "repository-pattern", "solid-principles", "viper-pattern"],
    questionIds: ["Q-01", "Q-02", "Q-03", "Q-04", "Q-05"]
  },
  {
    id: "concurrency",
    title: "Swift Concurrency & Multithreading",
    shortTitle: "Swift Concurrency",
    icon: "⚡",
    color: "#D49544",
    summary: "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization primitives, GCD queues, and race conditions.",
    docIds: ["multithreading-gcd", "concurrency-issues", "thread-safety", "operation-queue"],
    questionIds: ["Q-06", "Q-07", "Q-08", "Q-09", "Q-10", "Q-11", "Q-12"]
  },
  {
    id: "core-advance-swift",
    title: "Core Swift & Language Internals",
    shortTitle: "Core & Advance Swift",
    icon: "🚀",
    color: "#8E5B70",
    summary: "Protocol-Oriented Programming, Stack vs Heap & CoW, Method Dispatch (V-table/witness), Generics & some/any existentials, Property Wrappers & Macros, and Run Loops.",
    docIds: ["ios-internals", "swiftui-state"],
    questionIds: ["Q-13", "Q-14", "Q-15", "Q-16", "Q-17", "Q-18"]
  },
  {
    id: "swift-basics-ui",
    title: "SwiftUI & UIKit Layout",
    shortTitle: "UI & Layout",
    icon: "🎨",
    color: "#C15F3D",
    summary: "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y), iPad adaptive layouts, internationalization & RTL, UICollectionView diffable data sources & compositional layouts, atomic component decomposition, SwiftUI ViewGraph/AttributeGraph diffing, and UIKit interoperability.",
    docIds: ["autolayout-basics", "composable-ui", "design-system", "swiftui-uikit-interop", "swiftui-state"],
    questionIds: ["Q-19", "Q-20", "Q-21", "Q-22", "Q-23", "Q-24", "Q-25", "Q-26", "Q-27", "Q-28"]
  },
  {
    id: "combine-reactive",
    title: "Combine & Reactive Streams",
    shortTitle: "Combine & Streams",
    icon: "🌊",
    color: "#4D7C8A",
    summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles.",
    docIds: [],
    questionIds: ["Q-29"]
  },
  {
    id: "networking",
    title: "Networking, APIs & Background Tasks",
    shortTitle: "Networking & APIs",
    icon: "🌐",
    color: "#5A7D65",
    summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, and BGTaskScheduler.",
    docIds: ["networking-architecture"],
    questionIds: ["Q-30", "Q-31", "Q-32", "Q-33", "Q-34"]
  },
  {
    id: "modularity-performance",
    title: "Modularity, Build & Launch Performance",
    shortTitle: "Modularity & Perf",
    icon: "📦",
    color: "#7E6E5C",
    summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.",
    docIds: ["modular-architecture", "performance-profiling"],
    questionIds: ["Q-35", "Q-36", "Q-37", "Q-38", "Q-39", "Q-40", "Q-41"]
  },
  {
    id: "data-memory",
    title: "Data Persistence, SwiftData & Memory Deep Dive",
    shortTitle: "Data & Memory",
    icon: "💾",
    color: "#7C5379",
    summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival.",
    docIds: ["data-persistence"],
    questionIds: ["Q-42", "Q-43", "Q-44", "Q-45"]
  },
  {
    id: "security-compliance",
    title: "Security, App Hardening & Compliance",
    shortTitle: "Security & Compliance",
    icon: "🔒",
    color: "#B84A39",
    summary: "Keychain vs Secure Enclave, token storage CRUD, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR).",
    docIds: ["security-comparison", "leadership-ownership"],
    questionIds: ["Q-46", "Q-47", "Q-48", "Q-49", "Q-50", "Q-51", "Q-52", "Q-53"]
  },
  {
    id: "system-design",
    title: "System Design & Mobile Architecture",
    shortTitle: "System Design",
    icon: "🏛️",
    color: "#A34836",
    summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution.",
    docIds: [],
    questionIds: ["Q-54", "Q-55"]
  },
  {
    id: "testing-ci-cd",
    title: "Testing, CI/CD & AI Engineering",
    shortTitle: "Testing & AI",
    icon: "🧪",
    color: "#4A7C94",
    summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
    docIds: ["testing-xctest"],
    questionIds: ["Q-56", "Q-57", "Q-58", "Q-59", "Q-60", "Q-61", "Q-62", "Q-63"]
  },
  {
    id: "leadership-production",
    title: "Engineering Leadership & Operations",
    shortTitle: "Leadership & Ops",
    icon: "👔",
    color: "#B07038",
    summary: "Production incident triage, crash log analysis & dSYM symbolication, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern.",
    docIds: ["leadership-ownership"],
    questionIds: ["Q-64", "Q-65"]
  },
  {
    id: "memory-management",
    title: "Memory Management",
    shortTitle: "Memory Mgmt",
    icon: "🧠",
    color: "#477C6B",
    summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit.",
    docIds: [],
    questionIds: ["Q-66", "Q-67", "Q-68", "Q-69", "Q-70", "Q-71", "Q-72", "Q-73"]
  }
];

// 7. Regenerate QUESTIONS.md
const topicMeta = {
  "Swift Internals & Advanced Types": { icon: "⚡", summary: "Memory layouts, Copy-on-Write, Existential Containers, Method Dispatch, Generics, and opaque types." },
  "Swift Concurrency & Async/Await": { icon: "🔀", summary: "Actors, Tasks, TaskGroups, AsyncSequence, Thread Sanitizer, and non-blocking concurrency." },
  "Modern Architecture & Patterns": { icon: "🏗️", summary: "VIPER, Clean Swift, Coordinator, TCA, State Machines, and Event-Driven systems." },
  "Auto Layout, UIKit & Modern SwiftUI": { icon: "📐", summary: "Constraint solving engine, intrinsic content size, priorities, iPad multitasking & adaptive size classes, Localizable string catalogs & RTL, and UICollectionView diffable data sources with compositional layouts." },
  "Combine & Reactive Streams": { icon: "🌊", summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles." },
  "Networking, APIs & Background Tasks": { icon: "🌐", summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, BGTaskScheduler, App Suspension & State Restoration." },
  "Modularity & Launch Performance": { icon: "📦", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Modularity, Build & Launch Performance": { icon: "📦", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Data Persistence, SwiftData & Memory Deep Dive": { icon: "💾", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Data Persistence & Memory Management": { icon: "💾", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Security, App Hardening & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, token storage CRUD, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "Security, Auth & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, token storage CRUD, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "System Design & Mobile Architecture": { icon: "🏛️", summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution." },
  "Testing, CI/CD & AI Engineering": { icon: "🧪", summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems." },
  "Engineering Leadership & Operations": { icon: "👔", summary: "Production incident triage, crash log analysis & dSYM symbolication, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern." },
  "Memory Management": { icon: "🧠", summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit." }
};

const catGroups = {};
for (const q of questions) {
  if (!catGroups[q.category]) catGroups[q.category] = [];
  catGroups[q.category].push(q);
}

const mdLines = [];
mdLines.push("# 📱 iOS Senior & Staff Interview Question Bank");
mdLines.push("");
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, UICollectionView Diffable Data Sources & Compositional Layouts, Background Execution & State Restoration, Performance Profiling & Instruments, 60/120fps Scroll Hitch Elimination, Scalable Image Caching, Keychain Secrets Management, Production Crash Log Triage & Symbolication, Memory Management, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
mdLines.push("");
mdLines.push("## 📊 Overview");
mdLines.push("");
mdLines.push("| Category / Topic | Questions | Key Coverage |");
mdLines.push("|---|:---:|---|");

for (const [cat, qList] of Object.entries(catGroups)) {
  const summary = topicMeta[cat]?.summary || "";
  mdLines.push(`| **${cat}** | \`${qList.length}\` | ${summary} |`);
}

mdLines.push(`| **Total** | **\`${questions.length}\`** | Complete Senior & Staff iOS Interview Curriculum |`);
mdLines.push("");
mdLines.push("---");
mdLines.push("");

for (const [cat, qList] of Object.entries(catGroups)) {
  const meta = topicMeta[cat] || { icon: "📌", summary: "" };
  const startId = qList[0].id;
  const endId = qList[qList.length - 1].id;
  const rangeStr = startId !== endId ? `(${startId} – ${endId})` : `(${startId})`;
  mdLines.push(`## ${meta.icon} ${cat} ${rangeStr}`);
  mdLines.push("");
  mdLines.push(`> ${meta.summary}`);
  mdLines.push("");

  for (const q of qList) {
    mdLines.push(`### \`${q.id}\` — ${q.question}`);
    mdLines.push("");
    mdLines.push(`- **Category:** \`${q.category}\``);
    mdLines.push("");
    mdLines.push("> [!TIP]");
    mdLines.push("> **🗣️ Interview Pitch (Say it like this):**  ");
    mdLines.push(`> *"${q.interviewSentence}"*`);
    mdLines.push("");
    mdLines.push("#### 📖 Detailed Answer");
    mdLines.push("");
    mdLines.push(q.answer);
    mdLines.push("");
    mdLines.push("#### 💻 Swift Code Example");
    mdLines.push("");
    mdLines.push("```swift");
    mdLines.push(q.codeExample);
    mdLines.push("```");
    mdLines.push("");
    mdLines.push("---");
    mdLines.push("");
  }
}

fs.writeFileSync(QUESTIONS_MD_PATH, mdLines.join("\n"), 'utf-8');
console.log('Regenerated QUESTIONS.md successfully!');

// 8. Update index.html
let indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');

// Update counts in HTML
indexHtml = indexHtml.replace(/\d+ Questions · 24 Guides/g, `${questions.length} Questions · 24 Guides`);
indexHtml = indexHtml.replace(/\d+ Curated Questions/g, `${questions.length} Curated Questions`);

const scriptOpen = indexHtml.indexOf('<script>');
const scriptClose = indexHtml.lastIndexOf('</script>');
const preScript = indexHtml.substring(0, scriptOpen);
const postScript = indexHtml.substring(scriptClose + 9);
const scriptBody = indexHtml.substring(scriptOpen + 8, scriptClose);

let newScript = scriptBody;
newScript = newScript.replace(
  /const QUESTIONS = \[[\s\S]*?\];\n/,
  () => `const QUESTIONS = ${JSON.stringify(questions)};\n`
);
newScript = newScript.replace(
  /const TOPIC_CATEGORIES = \[[\s\S]*?\];\n/,
  () => `const TOPIC_CATEGORIES = ${JSON.stringify(TOPIC_CATEGORIES)};\n`
);
newScript = newScript.replace(
  /const QUESTION_TO_DOCS = \{[\s\S]*?\};\n/,
  () => `const QUESTION_TO_DOCS = ${JSON.stringify(generatedDocs.QUESTION_TO_DOCS)};\n`
);

// Validate script syntax
try {
  new vm.Script(newScript, { filename: 'dashboard-bundle.js' });
  console.log('VALIDATION PASSED: 100% Valid JavaScript Syntax! No errors!');
} catch (e) {
  console.error('VALIDATION FAILED in newScript:', e);
  process.exit(1);
}

const finalHtml = `${preScript}<script>${newScript}</script>${postScript}`;
fs.writeFileSync(INDEX_PATH, finalHtml, 'utf-8');
console.log(`Successfully updated index.html with all ${questions.length} questions!`);
