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
if (questions.length !== 90) {
  console.error('Expected 90 questions, found:', questions.length);
  process.exit(1);
}

// 1. Shift IDs of questions from index 44 to 89 (Q-45 -> Q-46 ... Q-90 -> Q-91)
for (let i = 44; i < questions.length; i++) {
  const currentNum = parseInt(questions[i].id.replace('Q-', ''), 10);
  const newNum = currentNum + 1;
  questions[i].id = 'Q-' + String(newNum).padStart(2, '0');
}

const newQ45 = {
  id: "Q-45",
  category: "Modularity, Build & Launch Performance",
  difficulty: "Staff",
  question: "How do you stop circular dependencies between modules?",
  interviewSentence: "A circular dependency breaks the build because Swift Package Manager requires an acyclic graph. I prevent cycles by design using four techniques: strict one-way layer rules (App → Features → Core), interface segregation with protocols, dependency inversion where consumers own the interface, and extracting shared models into lower-level packages. (Memory trick: L-P-I-S → 'Layers, Protocols, Inject, Shared-down.')",
  answer: `A circular dependency means module A imports module B, and module B imports module A. In Swift Package Manager, this is not allowed. The build fails with a cycle error. So the compiler catches it, but I want to avoid it by design, not fix it later.

Say it like this:

"A circular dependency means module A imports module B, and module B imports module A. In Swift Package Manager, this is not allowed. The build fails with a cycle error. So the compiler catches it, but I want to avoid it by design, not fix it later.

I use four ways to stop cycles. First, I keep a one-way layer order: App → Features → Core. Core never imports a feature, and features never import other features. Second, I depend on protocols, not on modules. If A needs something from B, A defines a small protocol, and the App target injects the real B. Third, I use dependency inversion. The module that needs the service owns the protocol, so the arrow points to the module that needs it, not to the one that provides it. Fourth, I move the shared part out. If two modules truly need the same code, I pull that code into a new lower-level module that both can import.

I also check this in CI. A script fails the build if a feature imports another feature, so a cycle never comes back."

---

### How a Cycle Happens and How to Fix It

#### The Problem: Circular Dependency Cycle (Build Error)
\`\`\`
  CartFeature  ───imports───►  CheckoutFeature
       ▲                             │
       └───────────imports───────────┘
\`\`\`
In Swift Package Manager or Xcode targets, circular dependency graph edges cause a fatal build failure: \`cycle in dependency graph\`.

---

#### Fix 1: Use a Protocol Injected by the App Target (Dependency Inversion)

Instead of \`CartFeature\` importing \`CheckoutFeature\` to trigger checkout navigation, \`CartFeature\` declares an interface of what it needs:

\`\`\`swift
// In CartFeature (Package): it defines what it needs as a protocol
public protocol CheckoutNavigating: AnyObject {
    func openCheckout()
}

public final class CartViewModel: ObservableObject {
    private let checkoutNavigator: CheckoutNavigating

    public init(checkoutNavigator: CheckoutNavigating) {
        self.checkoutNavigator = checkoutNavigator
    }

    public func payTapped() {
        checkoutNavigator.openCheckout()
    }
}
\`\`\`

\`\`\`swift
// In the App Target: It imports both feature modules and wires them together
import CartFeature
import CheckoutFeature

struct CheckoutNavigator: CheckoutNavigating {
    let router: AppRouter
    func openCheckout() {
        router.push(.checkout)
    }
}

// Composition Root assembly:
let cartViewModel = CartViewModel(checkoutNavigator: CheckoutNavigator(router: router))
\`\`\`

Now \`CartFeature\` never imports \`CheckoutFeature\`. Only the top-level App Target / Coordinator imports both.

\`\`\`
            App Target (Composition Root)
               /            \\
              ▼              ▼
        CartFeature     CheckoutFeature
         (No dependency arrow between them)
\`\`\`

---

#### Fix 2: Move Shared Code Down (Extract Common Entities)

**Before (Cycle due to shared entity \`CartItem\`):**
\`\`\`
CartFeature  ◄──────────────►  CheckoutFeature
(Both need CartItem model, causing tight mutual coupling)
\`\`\`

**After (Extracted Domain Model Layer):**
\`\`\`
CartFeature ───►  SharedCartModels  ◄─── CheckoutFeature
\`\`\`
\`SharedCartModels\` is a tiny, highly stable SPM library containing pure Swift structs and zero dependencies. It sits on a lower architectural tier below all features.

---

### Quick Rules to Prevent Cycles

1. **Dependencies Point One Way:** Down the layers, never up or sideways (\`App\` → \`Features\` → \`Core/Models\`).
2. **Features Talk Through Protocols:** Consumers own the protocol definition; the App target injects the real provider.
3. **Shared Code Moves Down:** If two sibling modules need the same type, extract it into a lower-tier leaf module.
4. **Keep Shared Modules Small and Stable:** Avoid monolithic \`Common\` or \`Utilities\` packages that become dumping grounds.
5. **Enforce in CI Quality Gates:** Run a bash / python dependency linter that fails PR builds if any feature module imports a sibling feature.

---

### Real-World Analogy (Easy to Remember)

Two neighbors who each lock the other's key inside their house. Neither can enter.
• **The Fix:** Give the keys to a third party (the **App Target**) who can open both doors.
• **Or:** Put the shared garden tools in a **shared community shed** (a lower-level module) that both can access independently.

---

### Bonus Points (Staff-Level Interview Highlights)

• **A Cycle is an Architectural Smell:** Even if build tools allowed it, two modules that mutually require each other are logically a single monolith split in two. Merge them or re-evaluate the domain boundary.
• **Micro-Interfaces Pattern (\`CartInterface\` vs \`CartImplementation\`):** Highly scaled apps (e.g. Uber, Meta) split every feature into an \`Interface\` package (protocols & public models only) and an \`Implementation\` package. Features depend only on lightweight \`Interface\` targets, completely eliminating cycles and accelerating parallel compilation.
• **Avoid Global Service Locators:** Using a global singleton \`ServiceLocator.shared.resolve()\` hides circular dependencies from the compiler without resolving the underlying architectural coupling. Use explicit constructor injection.
• **Delegates, Closures & Async Sequences:** Emitting events upwards to a coordinator using closures or \`@Published\` streams keeps leaf modules purely decoupled.

---

### One-Liner & Memory Trick
• **One-liner:** Dependencies flow one way. If two modules need each other, add a protocol, inject it from the App target, or move the shared code down.
• **Memory trick:** **L-P-I-S** → *"Layers, Protocols, Inject, Shared-down."*`,
  codeExample: `// =========================================================================
// 📦 SENIOR INTERVIEW ARCHITECTURE: Preventing Circular Module Dependencies
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • Directed Acyclic Graph (DAG): Swift Package Manager enforces strict acyclic
//   compilation graphs. A cycle triggers compile-time fatal errors.
// • Dependency Inversion Principle (DIP): The high-level module (CartFeature)
//   defines the abstract protocol it requires, inverting the dependency arrow.
// • Composition Root Pattern: Only the App target / AppCoordinator knows about
//   all concrete feature implementations and binds them together via constructor DI.
// • Micro-Interface Segregation: Extracting tiny Interface and SharedModel
//   libraries allows parallel multi-core compilation without cross-import coupling.

import Foundation
import SwiftUI

// MARK: - 1. Lower-Tier Shared Domain Layer (SharedCartModels Package)
// Sits at the bottom of the dependency graph; has ZERO dependencies on feature modules.

public struct CartItem: Identifiable, Equatable, Sendable {
    public let id: UUID
    public let title: String
    public let priceCents: Int
    public let quantity: Int
    
    public init(id: UUID = UUID(), title: String, priceCents: Int, quantity: Int = 1) {
        self.id = id
        self.title = title
        self.priceCents = priceCents
        self.quantity = quantity
    }
}

// MARK: - 2. Feature Module A (CartFeature Package)
// Notice: CartFeature NEVER imports CheckoutFeature!

/// Protocol defined by CartFeature expressing its navigation requirement
public protocol CheckoutNavigating: AnyObject, Sendable {
    func navigateToCheckout(items: [CartItem], orderTotalCents: Int)
}

public final class CartViewModel: ObservableObject {
    @Published public private(set) var items: [CartItem] = []
    private let checkoutNavigator: CheckoutNavigating
    
    public init(checkoutNavigator: CheckoutNavigating) {
        self.checkoutNavigator = checkoutNavigator
    }
    
    public func addItem(_ item: CartItem) {
        items.append(item)
    }
    
    public var totalCents: Int {
        items.reduce(0) { $0 + ($1.priceCents * $1.quantity) }
    }
    
    public func proceedToCheckoutTapped() {
        // Delegates checkout navigation without knowing how Checkout is implemented
        checkoutNavigator.navigateToCheckout(items: items, orderTotalCents: totalCents)
    }
}

// MARK: - 3. Feature Module B (CheckoutFeature Package)
// Notice: CheckoutFeature NEVER imports CartFeature!

public final class CheckoutViewModel: ObservableObject {
    public let orderItems: [CartItem]
    public let totalCents: Int
    
    public init(orderItems: [CartItem], totalCents: Int) {
        self.orderItems = orderItems
        self.totalCents = totalCents
    }
    
    public func submitPayment() {
        print("💳 Processing payment of \\(totalCents) cents for \\(orderItems.count) items.")
    }
}

// MARK: - 4. Top-Level App Target (Composition Root)
// The App target imports both CartFeature and CheckoutFeature, wiring them via DI.

public final class AppCoordinator: CheckoutNavigating {
    private var navigationPath = NavigationPath()
    
    public init() {}
    
    // Conforms to CartFeature's protocol and instantiates CheckoutFeature
    public func navigateToCheckout(items: [CartItem], orderTotalCents: Int) {
        let checkoutVM = CheckoutViewModel(orderItems: items, totalCents: orderTotalCents)
        print("🚀 [App Target] Navigating to Checkout with \\(items.count) items, total: $\\(Double(orderTotalCents)/100.0)")
    }
    
    public func buildCartModule() -> CartViewModel {
        // Constructor Dependency Injection prevents any direct feature-to-feature coupling
        return CartViewModel(checkoutNavigator: self)
    }
}`
};

// 2. Insert newQ45 at index 44
questions.splice(44, 0, newQ45);
console.log('New questions count in questions.json:', questions.length);
if (questions.length !== 91) {
  console.error('Expected 91 questions, got:', questions.length);
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
  if (cat.id === 'modularity-performance') {
    cat.questionIds = ['Q-38', 'Q-39', 'Q-40', 'Q-41', 'Q-42', 'Q-43', 'Q-44', 'Q-45'];
    cat.summary = "SPM multi-module boundaries, circular dependency prevention (DAG & dependency inversion), static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling.";
  } else if (cat.id === 'data-memory') {
    cat.questionIds = ['Q-46', 'Q-47', 'Q-48', 'Q-49'];
  } else if (cat.id === 'security-compliance') {
    cat.questionIds = ['Q-50', 'Q-51', 'Q-52', 'Q-53', 'Q-54', 'Q-55', 'Q-56', 'Q-57', 'Q-58', 'Q-59', 'Q-60', 'Q-61'];
  } else if (cat.id === 'system-design') {
    cat.questionIds = ['Q-62', 'Q-63', 'Q-64', 'Q-65'];
  } else if (cat.id === 'testing-ai') {
    cat.questionIds = ['Q-66', 'Q-67', 'Q-68', 'Q-69', 'Q-70', 'Q-71', 'Q-72', 'Q-73', 'Q-74', 'Q-75'];
  } else if (cat.id === 'cicd-devops') {
    cat.questionIds = ['Q-76', 'Q-77'];
  } else if (cat.id === 'leadership-production') {
    cat.questionIds = ['Q-78', 'Q-79', 'Q-80', 'Q-81', 'Q-82', 'Q-83'];
  } else if (cat.id === 'memory-management') {
    cat.questionIds = ['Q-84', 'Q-85', 'Q-86', 'Q-87', 'Q-88', 'Q-89', 'Q-90', 'Q-91'];
  }
}

const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(topicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS: shift keys >= 45 up by 1, and add Q-45
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
const newQ2D = {};

for (const [key, val] of Object.entries(oldQ2D)) {
  const num = parseInt(key.replace('Q-', ''), 10);
  if (num >= 45) {
    const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
    newQ2D[shiftedKey] = val;
  } else {
    newQ2D[key] = val;
  }
}

newQ2D['Q-45'] = [
  {
    docId: "modular-architecture",
    title: "Modular App Architecture — Talking Points",
    icon: "📦",
    filename: "Modular-Architecture-TalkingPoints.md"
  },
  {
    docId: "dependency-injection",
    title: "Dependency Injection (DI) — Interview Cheat Sheet",
    icon: "💉",
    filename: "DependencyInjection-CheatSheet.md"
  }
];

const newQ2DCode = 'const QUESTION_TO_DOCS = ' + JSON.stringify(newQ2D) + ';';
html = html.substring(0, startQ2D) + newQ2DCode + html.substring(endQ2D + 2);

// Update text counters in index.html
html = html.replace(/90 Questions/g, '91 Questions');
html = html.replace(/90 questions/g, '91 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 4. Update QUESTIONS.md
// Summary table updates
md = md.replace(
  '| **Modularity & Launch Performance** | `7` |',
  '| **Modularity & Launch Performance** | `8` |'
);
md = md.replace(
  '| **Total** | **`90`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`91`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 90 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 91 iOS interview questions'
);

// Shift question anchors in reverse (from 90 down to 45)
for (let num = 90; num >= 45; num--) {
  const currentRegex = new RegExp(`### \`Q-${num.toString().padStart(2, '0')}\` —`, 'g');
  const targetId = `### \`Q-${(num + 1).toString().padStart(2, '0')}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Update section headers
const sectionHeaderReplacements = [
  ['## 📦 Modularity & Launch Performance (Q-38 – Q-44)', '## 📦 Modularity & Launch Performance (Q-38 – Q-45)'],
  ['## 💾 Data Persistence & Memory Management (Q-45 – Q-48)', '## 💾 Data Persistence & Memory Management (Q-46 – Q-49)'],
  ['## 🔒 Security, Auth & Compliance (Q-49 – Q-60)', '## 🔒 Security, Auth & Compliance (Q-50 – Q-61)'],
  ['## 🏛️ System Design & Mobile Architecture (Q-61 – Q-64)', '## 🏛️ System Design & Mobile Architecture (Q-62 – Q-65)'],
  ['## 🧪 Testing & AI Engineering (Q-65 – Q-74)', '## 🧪 Testing & AI Engineering (Q-66 – Q-75)'],
  ['## 🚀 CI/CD & DevOps (Q-75 – Q-76)', '## 🚀 CI/CD & DevOps (Q-76 – Q-77)'],
  ['## 👔 Engineering Leadership & Operations (Q-77 – Q-82)', '## 👔 Engineering Leadership & Operations (Q-78 – Q-83)'],
  ['## 🧠 Memory Management (Q-83 – Q-90)', '## 🧠 Memory Management (Q-84 – Q-91)']
];

for (const [oldH, newH] of sectionHeaderReplacements) {
  if (!md.includes(oldH)) {
    console.error('Missing expected header in QUESTIONS.md:', oldH);
    process.exit(1);
  }
  md = md.replace(oldH, newH);
}

// Prepare markdown for Q-45
const q45Md = `
---

### \`Q-45\` — How do you stop circular dependencies between modules?

- **Category:** \`Modularity, Build & Launch Performance\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"A circular dependency breaks the build because Swift Package Manager requires an acyclic graph. I prevent cycles by design using four techniques: strict one-way layer rules (App → Features → Core), interface segregation with protocols, dependency inversion where consumers own the interface, and extracting shared models into lower-level packages. (Memory trick: L-P-I-S → 'Layers, Protocols, Inject, Shared-down.')"*

#### 📖 Detailed Answer

${newQ45.answer}

#### 💻 Multi-Module Architecture & Dependency Inversion Example

\`\`\`swift
${newQ45.codeExample}
\`\`\`
`;

// Insert q45Md right before "## 💾 Data Persistence & Memory Management (Q-46 – Q-49)"
const insertMarker = '## 💾 Data Persistence & Memory Management (Q-46 – Q-49)';
const markerIdx = md.indexOf(insertMarker);
if (markerIdx === -1) {
  console.error('Could not find insertMarker in QUESTIONS.md');
  process.exit(1);
}

md = md.substring(0, markerIdx) + q45Md + '\n\n---\n\n' + md.substring(markerIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
