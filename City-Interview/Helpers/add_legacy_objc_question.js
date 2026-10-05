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
if (questions.length !== 91) {
  console.error('Expected 91 questions, found:', questions.length);
  process.exit(1);
}

// 1. Shift IDs of questions from index 83 to 90 (Q-84 -> Q-85 ... Q-91 -> Q-92)
for (let i = 83; i < questions.length; i++) {
  const currentNum = parseInt(questions[i].id.replace('Q-', ''), 10);
  const newNum = currentNum + 1;
  questions[i].id = 'Q-' + String(newNum).padStart(2, '0');
}

const newQ84 = {
  id: "Q-84",
  category: "Engineering Leadership & Operations",
  difficulty: "Staff",
  question: "How do you handle a legacy Objective-C codebase while moving to Swift?",
  interviewSentence: "I migrate legacy Objective-C codebases incrementally using the Strangler Fig approach: writing all new features in Swift, converting existing files only when touched with tests in place, and shielding new code behind Swift protocol wrappers to prevent legacy API leaks. (Memory trick: N-T-C-W → 'New in Swift, Tests first, Convert when touched, Wrap the rest.')",
  answer: `"I never stop and rewrite everything. The app must keep shipping, so I move step by step. The rule I follow is simple: all new code is written in Swift, and old Objective-C is converted only when we have a real reason to touch it, like a bug fix or a feature change.

Before I convert a file, I add tests around it. Then I convert it with no logic changes, so any bug is easy to find. I start with small, low-risk code that has few dependencies, like models, helpers, and utilities. The big, risky classes come last, after the team has learned the process.

For the two languages to work together, I clean up the Objective-C side first. I add nullability and generics, so Swift sees real types and not Optional! everywhere. For old Objective-C code that I cannot convert yet, I write a small Swift wrapper in front of it. The new Swift code uses the wrapper, so the old API does not spread. I also track progress with simple numbers, like the percentage of Swift lines and the number of Objective-C files left."

---

### Real-World Production Example (FordPass & AutoZone)

At Copper Mobile, I worked on client apps that had Objective-C and early Swift in the same project. Later at Cognizant, on FordPass and AutoZone, we worked in large codebases with older Objective-C. In those projects, the safe approach was always the same: new features in Swift, tests before any conversion, and one module at a time.

For example, on FordPass, the legacy vehicle status and command dispatch service was written in Objective-C with completion blocks and implicit optionals. When we needed to support remote start and lock/unlock commands with retry logic, I wrote unit tests around the legacy Objective-C class, wrapped it behind a clean Swift protocol (\`VehicleCommandServiceProtocol\`) using Swift async/await, and later replaced the internals with Swift without breaking the UI coordinators. This eliminated forced unwrapping crashes and cut command failure troubleshooting time significantly.

---

### How We Implement It: The Big Picture

\`\`\`
Old Objective-C app
      │
      ▼
 1. Make ObjC "Swift-friendly"  (nullability, generics, NS_SWIFT_NAME)
      │
      ▼
 2. Connect the languages       (bridging header  +  MyApp-Swift.h)
      │
      ▼
 3. Write all NEW code in Swift
      │
      ▼
 4. Convert old code only when touched  (tests first, no logic change)
      │
      ▼
 5. Wrap what can't move yet    (Swift facade over ObjC)
      │
      ▼
 6. Track progress → remove the last ObjC
\`\`\`

---

### Step 1: Connect the Two Languages

| Direction | What to use | Setting |
| :--- | :--- | :--- |
| **Swift uses ObjC** | Bridging header: \`MyApp-Bridging-Header.h\`, with \`#import "LegacyClass.h"\` | \`SWIFT_OBJC_BRIDGING_HEADER\` |
| **ObjC uses Swift** | Xcode generates \`MyApp-Swift.h\`. In \`.m\` files: \`#import "MyApp-Swift.h"\` | \`SWIFT_OBJC_INTERFACE_HEADER_NAME\` |
| **Inside a framework** | Umbrella header, and ObjC uses \`#import <MyFramework/MyFramework-Swift.h>\` | \`DEFINES_MODULE = YES\` |
| **Expose Swift to ObjC** | \`@objc\`, \`@objcMembers\`, and the class must inherit from \`NSObject\` | in code |

---

### Step 2: Make the Objective-C Side Swift-Friendly

Without this, Swift sees every property as an implicitly unwrapped optional (\`Type!\`), and runtime crashes hide there.

\`\`\`objc
// Before: Swift sees "String!" and "[Any]!"
@interface UserService : NSObject
- (NSString *)userName;
- (NSArray *)orders;
@end

// After: Swift sees "String" and "[Order]"
NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(UserService)
@interface LegacyUserService : NSObject
@property (nonatomic, readonly) NSString *userName;
@property (nonatomic, readonly) NSArray<Order *> *orders;
- (nullable Order *)orderWithId:(NSString *)orderId;
- (void)fetchOrdersWithCompletion:(void (^)(NSArray<Order *> * _Nullable, NSError * _Nullable))completion;
@end

NS_ASSUME_NONNULL_END
\`\`\`

**Useful Macros:**
• \`NS_ASSUME_NONNULL_BEGIN/END\`: Everything is non-null unless explicitly marked \`nullable\`.
• \`NS_SWIFT_NAME\`: Gives a clean, idiomatic Swift name (e.g., stripping legacy prefixes).
• \`NS_ENUM\` / \`NS_CLOSED_ENUM\`: Imports as a native Swift enum.
• \`NS_REFINED_FOR_SWIFT\`: Hides the raw ObjC method (\`__fetchOrders\`) so you can add a refined Swift version in an extension.
• **Lightweight Generics:** e.g., \`NSArray<Order *> *\` imports as typed \`[Order]\`.

Swift also imports completion-handler methods as \`async\` by itself, so you can call old code with \`await\`:
\`\`\`swift
let orders = try await legacyService.fetchOrders()   // imported automatically from completion handler
\`\`\`

---

### Step 3: Swift Wrapper in Front of Old Code (Facade Pattern)

\`\`\`swift
// The rest of the new code only sees this protocol
protocol UserRepository {
    func orders() async throws -> [Order]
}

// Thin wrapper over the legacy class
final class LegacyUserRepository: UserRepository {
    private let legacy = LegacyUserService()

    func orders() async throws -> [Order] {
        try await legacy.fetchOrders()
    }
}
\`\`\`

Later, when you replace the Objective-C code, write a new class conforming to the same protocol. Only the composition root/wiring changes; nothing else in the app is touched.

---

### Step 4: Expose New Swift Code to Old Objective-C

\`\`\`swift
@objcMembers
final class PriceFormatter: NSObject {
    func format(_ amount: Double) -> String { /* ... */ }
}
\`\`\`

\`\`\`objc
#import "MyApp-Swift.h"
PriceFormatter *formatter = [PriceFormatter new];
\`\`\`

#### What Does Not Cross the Boundary

Objective-C runtime cannot see advanced Swift language features. If legacy code needs them, wrap them in an \`@objc\` adapter:

| Swift Feature | Visible to ObjC? | Note / Workaround |
| :--- | :--- | :--- |
| **Structs** | ❌ No | Wrap in an \`NSObject\` class or expose primitive properties |
| **Enums with associated values** | ❌ No | Use \`@objc enum\` (Int-backed) or class hierarchy |
| **Generics (Swift own types)** | ❌ No | Type-erase or create non-generic \`@objc\` subclass |
| **Protocol extensions & Tuples** | ❌ No | Expose concrete methods or wrapper objects |
| **Actors** | ❌ No | Wrap actor calls in an \`@objc\` class with callbacks |
| **async functions** | ✅ Yes | Imported into ObjC as completion-handler block methods |

---

### Step 5: Mixed Code in Swift Packages

A single SwiftPM target cannot mix Swift and Objective-C files in the same directory.
• Create two separate targets:
  1. A C-language/Objective-C target with its \`include/\` public header folder.
  2. A Swift target that declares a dependency on the Objective-C target.
• This modular boundary physically enforces clean dependencies and accelerates parallel compilation.

---

### Step 6: Keep It Safe (Engineering Guardrails)

1. **Tests First:** Add unit tests or UI tests around the old Objective-C class *before* converting it.
2. **Convert with No Behavior Change:** Never refactor and convert in the same pull request. A 1:1 translation ensures any regressions are immediately caught.
3. **Watch Objective-C Runtime Features:** Method swizzling, \`performSelector:\`, KVC/KVO, and \`NSInvocation\` need extra care. Swift properties require \`@objc dynamic\` for KVO observation.
4. **Check Nil Behavior:** Objective-C silently swallows messages sent to \`nil\` (returns \`0\` or \`nil\`), whereas Swift crashes if force-unwrapped (\`!\`).
5. **Use a Linter Rule:** Add a SwiftLint custom rule or CI script that blocks new \`.m\` files from being added to the repository.
6. **Watch Metrics:** Ensure the crash-free user rate does not drop following conversion deployments.

---

### Conversion Order: Leaf Nodes First

| Order | What to Convert | Why (Risk & Dependency Analysis) |
| :---: | :--- | :--- |
| **1** | **Models, Utilities, Extensions** | Fewest dependencies, leaf nodes, lowest risk |
| **2** | **Networking, Parsing, Data Layer** | Easy to mock and unit test with contract fixtures |
| **3** | **ViewModels & Business Logic** | High value; safe once test suite is in place |
| **4** | **ViewControllers & UI** | Complex UIKit dependencies; convert after domain is pure Swift |
| **5** | **AppDelegate, Entry Points & Core Monoliths** | Highest blast radius; convert last when entire app is modernized |

---

### Bonus Points (Staff-Level Interview Highlights)

• **The "Big-Bang" Rewrite Fallacy:** Explain that full rewrites are one of software engineering's most common traps. They take years, freeze feature shipping, and discard a decade of bug fixes baked into the legacy code. Step-by-step Strangler Fig always wins.
• **The "Boy Scout Rule":** Whenever an engineer touches an Objective-C file for a bug fix or small feature, they leave it better than they found it: convert it to Swift if it is small and testable.
• **The Cost of the Bridge:** Calls across the ObjC-Swift bridge involve message dispatch (\`objc_msgSend\`) and type conversions. The generated \`MyApp-Swift.h\` header also increases rebuild cascades. Moving entire modules to Swift eliminates bridge overhead.
• **Some Objective-C Can Stay:** If a legacy C/ObjC crypto, audio, or math engine is completely stable, has 100% test coverage, and never requires changes, converting it has low business ROI. Modernize based on product velocity and defect rates, not dogmatism.

---

### One-Liner & Memory Trick
• **One-liner:** New code in Swift, convert old code only when touched, test first, and wrap what can't move yet.
• **Memory trick:** **N-T-C-W** → *"New in Swift, Tests first, Convert when touched, Wrap the rest."*`,
  codeExample: `// =========================================================================
// 🔄 SENIOR INTERVIEW ARCHITECTURE: Legacy Objective-C to Modern Swift Migration
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • Incremental Modernization (Strangler Fig): Never halt product development
//   for a "big-bang" rewrite. Ship new features in Swift, modernize legacy incrementally.
// • Bridge Hygiene: Add nullability annotations (\`NS_ASSUME_NONNULL_BEGIN/END\`),
//   generics (\`NSArray<Order *> *\`), and \`NS_SWIFT_NAME\` to ObjC headers before touching Swift.
// • Protocol Facade Pattern: Isolate legacy ObjC behind an abstract Swift protocol.
//   New UI/ViewModel layers only talk to the protocol, preventing ObjC leakage.
// • Swift Concurrency Interop: Swift automatically imports Objective-C completion-block
//   APIs as \`async throws\` methods, enabling clean \`await\` syntax without manual wrapping.
// • Safe Conversion Order: Leaf nodes first (Models, Utilities) → Core/Data layers →
//   Business Logic / ViewModels → ViewControllers → AppDelegate / Composition Root.

import Foundation

// MARK: - 1. Simulated Objective-C Header Annotations
// In Objective-C (LegacyUserService.h):
//
// NS_ASSUME_NONNULL_BEGIN
// NS_SWIFT_NAME(LegacyUserBridge)
// @interface LegacyUserService : NSObject
// - (void)fetchProfileWithCompletion:(void (^)(NSDictionary * _Nullable, NSError * _Nullable))completion;
// @end
// NS_ASSUME_NONNULL_END

/// Simulated Legacy Objective-C class exposed through bridging header \`<App>-Bridging-Header.h\`
@objcMembers
public final class LegacyUserBridge: NSObject {
    // In actual ObjC, this uses a completion handler block.
    // Swift automatically synthesizes an async throwing method from this signature!
    public func fetchProfile(completion: @escaping ([String: Any]?, Error?) -> Void) {
        DispatchQueue.global().asyncAfter(deadline: .now() + 0.1) {
            let mockData: [String: Any] = [
                "userId": "usr_9981",
                "name": "Jane Doe",
                "membershipTier": "Platinum"
            ]
            completion(mockData, nil)
        }
    }
}

// MARK: - 2. Modern Swift Protocol Interface (Boundary Abstraction)
// The rest of the modern codebase ONLY depends on this protocol, never the legacy class.

public struct UserProfile: Identifiable, Equatable, Sendable {
    public let id: String
    public let name: String
    public let membershipTier: String
    
    public init(id: String, name: String, membershipTier: String) {
        self.id = id
        self.name = name
        self.membershipTier = membershipTier
    }
}

public protocol UserRepositoryProtocol: Sendable {
    func getUserProfile() async throws -> UserProfile
}

// MARK: - 3. Strangler Facade Adapter (Thin Wrapper)
// Bridges the legacy Objective-C code to modern Swift async/await architecture.

public final class LegacyUserRepositoryAdapter: UserRepositoryProtocol {
    private let legacyService: LegacyUserBridge
    
    public init(legacyService: LegacyUserBridge = LegacyUserBridge()) {
        self.legacyService = legacyService
    }
    
    public func getUserProfile() async throws -> UserProfile {
        // Swift automatically imports completion-handler Objective-C methods as async!
        // We use withCheckedThrowingContinuation to bridge the completion block:
        let rawDict: [String: Any] = try await withCheckedThrowingContinuation { continuation in
            legacyService.fetchProfile { dict, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else if let dict = dict {
                    continuation.resume(returning: dict)
                } else {
                    continuation.resume(throwing: URLError(.badServerResponse))
                }
            }
        }
        
        // Defensive type extraction: Validate untyped legacy dictionaries into type-safe Swift structs
        guard let id = rawDict["userId"] as? String,
              let name = rawDict["name"] as? String,
              let tier = rawDict["membershipTier"] as? String else {
            throw DecodingError.dataCorrupted(.init(codingPath: [], debugDescription: "Invalid legacy payload"))
        }
        
        return UserProfile(id: id, name: name, membershipTier: tier)
    }
}

// MARK: - 4. Exposing Modern Swift to Legacy Objective-C
// When Objective-C screens need to call newly written Swift features.

@objc(SwiftPriceFormatter)
@objcMembers
public final class PriceFormatter: NSObject {
    public func format(cents: Int) -> String {
        let dollars = Double(cents) / 100.0
        return String(format: "$%.2f", dollars)
    }
}

// MARK: - 5. Future-State Pure Swift Implementation
// When the team eventually retires the Objective-C service, we swap this in via DI.
// Zero changes are needed in ViewModels or UI!

public final class ModernUserRepository: UserRepositoryProtocol {
    private let session: URLSession
    
    public init(session: URLSession = .shared) {
        self.session = session
    }
    
    public func getUserProfile() async throws -> UserProfile {
        // Pure Swift Concurrency + Decodable implementation
        return UserProfile(id: "usr_9981", name: "Jane Doe", membershipTier: "Platinum")
    }
}`
};

// 2. Insert newQ84 at index 83
questions.splice(83, 0, newQ84);
console.log('New questions count in questions.json:', questions.length);
if (questions.length !== 92) {
  console.error('Expected 92 questions, got:', questions.length);
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
const topicCategories = JSON.parse(html.substring(startCat + 'const TOPIC_CATEGORIES = '.length, endCat + 1));

for (const cat of topicCategories) {
  if (cat.id === 'leadership-production') {
    cat.questionIds = ['Q-78', 'Q-79', 'Q-80', 'Q-81', 'Q-82', 'Q-83', 'Q-84'];
    cat.summary = "Production incident triage, crash log analysis & dSYM symbolication, 1% production crash forensics, missing crash log triage, third-party SDK evaluation, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, legacy Objective-C to Swift migration, and migrating legacy monoliths using the Strangler Fig pattern.";
  } else if (cat.id === 'memory-management') {
    cat.questionIds = ['Q-85', 'Q-86', 'Q-87', 'Q-88', 'Q-89', 'Q-90', 'Q-91', 'Q-92'];
  }
}

const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(topicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS: shift keys >= 84 up by 1, and add Q-84
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
const newQ2D = {};

for (const [key, val] of Object.entries(oldQ2D)) {
  const num = parseInt(key.replace('Q-', ''), 10);
  if (num >= 84) {
    const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
    newQ2D[shiftedKey] = val;
  } else {
    newQ2D[key] = val;
  }
}

newQ2D['Q-84'] = [
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
html = html.replace(/91 Questions/g, '92 Questions');
html = html.replace(/91 questions/g, '92 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 4. Update QUESTIONS.md
// Summary table updates
md = md.replace(
  '| **Engineering Leadership & Operations** | `6` |',
  '| **Engineering Leadership & Operations** | `7` |'
);
md = md.replace(
  '| **Total** | **`91`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`92`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 91 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 92 iOS interview questions'
);

// Shift question anchors in reverse (from 91 down to 84)
for (let num = 91; num >= 84; num--) {
  const currentRegex = new RegExp(`### \\\`Q-${num.toString().padStart(2, '0')}\\\` —`, 'g');
  const targetId = `### \`Q-${(num + 1).toString().padStart(2, '0')}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Update section headers
const sectionHeaderReplacements = [
  ['## 👔 Engineering Leadership & Operations (Q-78 – Q-83)', '## 👔 Engineering Leadership & Operations (Q-78 – Q-84)'],
  ['## 🧠 Memory Management (Q-84 – Q-91)', '## 🧠 Memory Management (Q-85 – Q-92)']
];

for (const [oldH, newH] of sectionHeaderReplacements) {
  if (!md.includes(oldH)) {
    console.error('Missing expected header in QUESTIONS.md:', oldH);
    process.exit(1);
  }
  md = md.replace(oldH, newH);
}

// Prepare markdown for Q-84
const q84Md = `
---

### \`Q-84\` — How do you handle a legacy Objective-C codebase while moving to Swift?

- **Category:** \`Engineering Leadership & Operations\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I migrate legacy Objective-C codebases incrementally using the Strangler Fig approach: writing all new features in Swift, converting existing files only when touched with tests in place, and shielding new code behind Swift protocol wrappers to prevent legacy API leaks. (Memory trick: N-T-C-W → 'New in Swift, Tests first, Convert when touched, Wrap the rest.')"*

#### 📖 Detailed Answer

${newQ84.answer}

#### 💻 Legacy Interoperability & Facade Adapter Example

\`\`\`swift
${newQ84.codeExample}
\`\`\`
`;

// Insert q84Md right before "## 🧠 Memory Management (Q-85 – Q-92)"
const insertMarker = '## 🧠 Memory Management (Q-85 – Q-92)';
const markerIdx = md.indexOf(insertMarker);
if (markerIdx === -1) {
  console.error('Could not find insertMarker in QUESTIONS.md');
  process.exit(1);
}

md = md.substring(0, markerIdx) + q84Md + '\n\n---\n\n' + md.substring(markerIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
