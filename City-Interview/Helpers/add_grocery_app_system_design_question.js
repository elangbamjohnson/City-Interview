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
if (questions.length !== 88) {
  console.error('Expected 88 questions, found:', questions.length);
  process.exit(1);
}

// 1. Shift IDs of questions from index 62 to 87 (Q-63 -> Q-64 ... Q-88 -> Q-89)
for (let i = 62; i < questions.length; i++) {
  const currentNum = parseInt(questions[i].id.replace('Q-', ''), 10);
  const newNum = currentNum + 1;
  questions[i].id = 'Q-' + String(newNum).padStart(2, '0');
}

const newQ63 = {
  id: "Q-63",
  category: "System Design & Mobile Architecture",
  difficulty: "Staff",
  question: "System Design — How do you design an end-to-end Grocery Delivery App (Instacart / Blinkit)?",
  interviewSentence: "I start with the main user journey: browse, search, cart, checkout, and tracking. The iOS app owns the screens, a small local cache so browsing feels fast, and the cart for guests. The cloud owns the truth: prices, stock, the final total, and the order status. Behind an API gateway, microservices coordinate via an asynchronous event bus, and third parties handle payment tokenization, maps, and push delivery. (Memory trick: A-G-S-E-T → 'App shows, Gateway guards, Services own the truth, Events connect them, Third parties do the specialist work.')",
  imageName: "grocery_app_architecture_diagram",
  answer: `A grocery app looks simple, but it joins four worlds: the customer's phone, your own cloud, the store staff who pick the items, and outside companies for payments, delivery, and notifications. The main challenge is that the data changes all the time: prices, stock, delivery slots, and order status. A good design keeps the app fast and still honest about what is in stock and what the customer will pay.

Say it like this:

"I start with the main user journey: browse, search, cart, checkout, and tracking. Then I decide who owns what.

The iOS app owns the screens, a small local cache so browsing feels fast, and the cart for guests. The cloud owns the truth: prices, stock, the final total, and the order status. The app shows what the server says and never calculates money itself.

Between them sits an API gateway, which handles login, rate limits, and routing. Behind it, I split the backend into small services: catalog, search, cart, inventory, order, payment, delivery, and notifications. They share events through an event bus, so when an order is paid, the inventory, delivery, and notification services all hear about it without calling each other directly.

Outside parties do the specialist work. A CDN serves product images fast. A payment gateway charges the card, and Apple Pay creates the secure token. A delivery partner assigns riders and provides the map and location. Push and SMS providers reach the customer. I also have a store staff app, because someone must pick and pack the order, and their updates drive the tracking the customer sees."

---

### Diagram 1: High-Level System Architecture

The first diagram illustrates how the four worlds connect through the API Gateway, Event Bus, Microservices, and Third-Party Specialists:

![Grocery App System Architecture Diagram](Resources/grocery_app_architecture_diagram.png)

\`\`\`
+------------------+         +------------------+         +------------------+
|  Customer App    |         |     iOS App      |         |  Store Staff App |
| (Shops & Pays)   |-------->| (Browse/Cart/UI) |         | (Pick & Pack)    |
+------------------+         +--------+---------+         +--------+---------+
          |                           |                            |
          v                           v                            v
+------------------+         +-----------------------------------------------+
|       CDN        |         |                  API Gateway                  |
| (Product Images) |         |          (Auth, Rate Limits, Routing)         |
+------------------+         +-----------------------+-----------------------+
                                                     |
+----------------------------------------------------+--------------------------------------------------+
|                                        Backend Services                                               |
|  +----------------+  +----------------+  +----------------+  +----------------+                       |
|  | Catalog Svc    |  | Search Svc     |  | Cart Svc       |  | Inventory Svc  |                       |
|  | (Store/Prices) |  | (Index/Filters)|  | (Items/Totals) |  | (Stock/Store)  |                       |
|  +----------------+  +----------------+  +----------------+  +----------------+                       |
|  ---------------------------------------------------------------------------                          |
|                             Event Bus: Services share order and stock events                          |
|  ---------------------------------------------------------------------------                          |
|  +----------------+  +----------------+  +----------------+  +----------------+                       |
|  | Payment Svc    |  | Order Svc      |  | Delivery Svc   |  | Notify Svc     |                       |
|  | (Charges/Refund)|  | (Status Machine)|  | (Slots/ETA)    |  | (APNs/SMS)     |                       |
|  +-------+--------+  +-------+--------+  +-------+--------+  +-------+--------+                       |
+----------|-------------------|-------------------|-------------------|--------------------------------+
           v                   v                   v                   v
    +--------------+    +--------------+    +--------------+    +--------------+
    | Payment GW   |    | Core DB      |    | Delivery     |    | Push & SMS   |
    | Stripe/Apple |    | Orders/Users |    | Partner API  |    | APNs/SMS/Mail|
    +--------------+    +--------------+    +--------------+    +--------------+
\`\`\`

---

### Diagram 2: Checkout to Delivery Sequence Flow

The second diagram shows how these parties talk to each other in sequence from checkout to delivery:

![Grocery App Order Flow Diagram](Resources/grocery_app_order_flow_diagram.png)

\`\`\`
iOS App (Customer)     Order Service      Payment Provider    Store Staff App    Delivery Partner
        |                     |                  |                   |                  |
 1. Place order ------------->|                  |                   |                  |
        |              2. Charge --------------->|                   |                  |
        |                     | 3. Paid (Webhook)|                   |                  |
        |                     |< - - - - - - - - |                   |                  |
        |              4. Pick request ----------------------------->|                  |
        |                     |                  |      5. Packed    |                  |
        |                     |< - - - - - - - - - - - - - - - - - - |                  |
        |              6. Assign rider ------------------------------------------------>|
        |                     |                  |                   | 7. Location, ETA |
        |                     |< - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
        | 8. Push update      |                  |                   |                  |
        |< - - - - - - - - - -|                  |                   |                  |
        |                     |                  |      9. Delivered |                  |
        |                     |< - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
        | 10. Final push      |                  |                   |                  |
        |< - - - - - - - - - -|                  |                   |                  |
\`\`\`

---

### How Each Feature Works

#### 1. Browse
• **Store-Scoped Catalog:** The app asks the catalog service for products by category and store. Prices, taxes, and stock depend on the store or delivery area (dark store / fulfillment hub), so every request includes the \`storeID\`.
• **Paged Feeds:** Lists are paginated (e.g. 20 items per page), so the app loads a screenful at a time using \`AsyncSequence\` or Combine pagination.
• **CDN Image Optimization:** Product images come from an edge CDN in the exact pixel size the screen needs (WebP/AVIF format), and the app caches them locally using a two-tier memory/disk cache (Q34).
• **Local Category Cache:** The app keeps a small local cache of categories and top products in SQLite/SwiftData, so the home screen opens instantly (0ms perceived latency) and still works on a weak network, refreshing quietly in the background.

#### 2. Search
• **Dedicated Search Index:** A separate search service (Elasticsearch / OpenSearch) handles full-text queries, typo tolerance ("avocado" vs "avacado"), and ranking. A normal transactional database is too slow and too weak for faceted filtering.
• **Debouncing & Cancellation:** The app waits 300ms after the user stops typing before firing the query, and cancels in-flight requests when a new character is typed (Q06).
• **Availability Filtering:** Results are filtered on the backend by instant availability in the chosen store, so customers never see products that cannot be fulfilled.
• **Local Search History:** Recent searches and popular trending terms are stored securely on the phone.

#### 3. Cart
• **Guest vs. Signed-In Cart:** A guest cart lives locally on the phone (UserDefaults / SwiftData). A signed-in cart lives on the server in Redis, following the customer across iPad, iPhone, and web. On login, the guest cart items are merged with the server cart.
• **Server Owns Totals:** The server owns line-item sums, discounts, delivery fees, and taxes. The app merely displays what the server calculates and NEVER calculates the final charge itself (Q49).
• **Pre-Checkout Re-Validation:** Cart items are re-validated for current price and stock when the user opens checkout, catching price changes or flash sell-outs before payment.
• **Substitution Preferences:** Grocery apps require item-level substitution rules: "replace with similar brand/size" or "remove and refund" if out of stock during picking.

#### 4. Checkout
• **Delivery Slot Hold:** The customer selects a delivery address and a 1-hour delivery slot. The slot is temporarily locked in Redis with a 5-minute TTL so two customers cannot grab the final slot simultaneously.
• **Idempotency Key:** The checkout request carries a client-generated UUID idempotency key (\`X-Idempotency-Key\`), ensuring network retries or double-taps never produce duplicate charges or multiple orders (Q49).
• **Apple Pay / Gateway SDK:** The app collects an Apple Pay token via PassKit or card details via the Payment Gateway SDK. The app sends ONLY the single-use cryptogram/token to your backend; your server executes the charge through Stripe/Adyen.
• **Temporary Stock Hold:** Inventory is reserved at checkout initiation with a short expiration timer, and immediately released if authorization fails.
• **Reconciliation:** If network drops before receiving the response, the app queries \`GET /orders?idempotency_key=...\` to retrieve the definitive status without re-submitting.

#### 5. Order Tracking
• **Strict State Machine:** The order service owns an immutable status state machine:
  \`Placed\` -> \`Paid\` -> \`Picking\` -> \`Packed\` -> \`Out for Delivery\` -> \`Delivered\`.
  Only valid forward transitions are allowed; illegal jumps are rejected.
• **Store Staff App Updates:** In-store shoppers scan barcodes to verify correct picking and substitutions. Tapping "Packed" marks the order ready for courier handoff.
• **Real-Time Courier Tracking:** While the tracking screen is open, live courier coordinates and ETA stream over a WebSocket or SSE connection (falling back to short polling every 10s).
• **Lock Screen Live Activity:** iOS ActivityKit / Live Activities display real-time order state ("Out for delivery — Arriving in 8 mins") on the Lock Screen and Dynamic Island without opening the app.
• **Proactive Exception Push:** If an item is substituted or delivery is delayed, a push notification alerts the customer immediately with the reason and one-tap approval.

---

### What the iOS App Contains

• **Feature Modules:** \`Browse\`, \`Search\`, \`Cart\`, \`Checkout\`, and \`OrderTracking\` are isolated into independent Swift Packages (SPM), ensuring clean boundaries, fast parallel builds, and team ownership (Q03).
• **Shared Core Layers:** A robust Networking layer with automatic 401 token refresh interceptors and exponential retry; a LRU disk/memory image cache; a local database (SwiftData); analytics engine; and remote feature flag manager.
• **State Management:** Dedicated ViewModels per screen with unidirectional data flow, backed by a single-source-of-truth \`CartActor\` to eliminate race conditions.
• **Universal Links:** Deep links route users directly to specific products, category promotions, or tracking screens from push notifications (\`myapp://orders/{id}\`) (Q48).
• **Secure Auth:** Session tokens and biometric refresh credentials stored securely in the iOS Keychain with \`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly\` (Q36, Q37).
• **Settings & Accessibility:** Full Dynamic Type typography scaling, VoiceOver accessibility labels, RTL localization, and seamless Light/Dark mode.

---

### Key Design Decisions (Senior/Staff Talking Points)

1. **The Server Owns Money and Stock:**
   Prices, vouchers, surge fees, and inventory counts must come exclusively from the cloud. Client-calculated totals are vulnerable to binary tampering, jailbroken memory editing, and clock drift.
2. **Loosely Coupled Services via Event Bus:**
   When an order moves to \`Paid\`, an event is published to Apache Kafka / AWS SNS. Inventory, Delivery, and Notification microservices consume the event asynchronously. A slow or degraded notification service will never block order processing.
3. **Dedicated Search Subsystem:**
   Search is separated from the primary transactional database (PostgreSQL) into an inverted index (OpenSearch), updated asynchronously via change-data-capture (CDC) pipeline events.
4. **Idempotency Everywhere:**
   Every payment authorization, stock reservation, and slot booking requires an idempotency token. Double-tapping "Place Order" or cell-tower handover retransmissions are completely safe.
5. **Third Parties Kept Behind the Gateway:**
   The iOS app never talks to delivery partner APIs or payment providers directly (except PassKit for Apple Pay tokenization). Keeping integration secrets and webhooks on the server minimizes app binary footprint and prevents reverse-engineering vulnerabilities (Q45).
6. **Eventually Consistent Stock with Picking Safety Net:**
   In high-frequency grocery operations, inventory is "eventually consistent". A shelf item might be grabbed by an in-store customer seconds before an online order lands. The true inventory reconciliation happens at picking, backed by customer-approved substitution preferences.

---

### What Can Go Wrong, and the Architectural Answer

• **Item Out of Stock During In-Store Picking:**
  The store staff app prompts the picker with the customer's pre-selected preference: pick suggested substitute or drop item. The customer gets an instant push notification; order totals are automatically adjusted.
• **Payment Succeeded, but Network Crashed Before Order Created:**
  The server listens for payment gateway webhooks (\`payment_intent.succeeded\`). If an orphaned payment is detected without a linked order, the server auto-creates the order or immediately triggers an automated refund.
• **Slow or Dropped Network at Checkout:**
  The iOS client preserves the session idempotency key in local storage. When connectivity resumes, the app issues a status check using the same key before attempting any retry.
• **Push Notification Fails to Deliver:**
  Push is an alert, never the source of truth. Whenever the app launches or enters the foreground, it polls \`GET /orders/active\` to synchronize the latest status (Q27).
• **Delivery Courier Delayed or Offline:**
  The delivery service recalculates ETA using GPS heartbeat pings. If delays exceed threshold limits, the customer is proactively notified with compensation credits or cancellation options.
• **High Traffic Spikes (Festivals / Flash Sales):**
  Edge CDN caches catalog reads; API Gateway applies token-bucket rate limiting; message queues (Kafka) absorb checkout bursts to prevent cascading microservice collapse.

---

### Good to Mention (Staff-Level Interview Highlights)

• **Per-Store / Dark-Store Scoping:** A single product (e.g. Milk) has different prices, warehouse stock levels, and available delivery windows depending on the customer's geo-fenced dark store.
• **Produce Weight-Based Pricing (Two-Phase Auth & Capture):** Apples or bananas cannot be weighed until picking. The app pre-authorizes the card for ~115% of estimated weight. Once picked and weighed at checkout scales, the backend captures the exact amount and releases the excess authorization hold.
• **Regulated Items & Age Checks:** Alcohol and medication trigger automated ID-verification workflows at checkout and require the delivery driver to scan customer photo ID upon doorstep delivery.
• **"Buy Again" High-Value Caching:** Grocery shopping is highly habitual. Caching past orders locally to power a 1-tap "Buy Again" carousel drives massive conversion with minimal server cost.
• **Checkout Funnel Observability:** Telemetry tracks every step: \`View Cart\` -> \`Slot Selected\` -> \`Apple Pay Presented\` -> \`Authorized\` -> \`Success\`, exposing funnel drop-off regressions instantly (Q49).
• **Feature Flags & Kill Switches:** Critical payment gateways, slot booking logic, and checkout variants are wrapped in feature flags (LaunchDarkly), allowing instant rollback without App Store review (Q55).

---

### One-Liner & Memory Trick
• **One-liner:** The iOS app shows and collects, the cloud owns prices, stock, and order status, and third parties handle payment, delivery, and messages, with events and push tying the whole journey together.
• **Memory trick:** **A-G-S-E-T** → *"App shows, Gateway guards, Services own the truth, Events connect them, Third parties do the specialist work."*`,
  codeExample: `// =========================================================================
// 🛒 SENIOR INTERVIEW ARCHITECTURE: End-to-End Grocery Delivery System
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • Single Source of Truth: The iOS app NEVER calculates line-item prices,
//   taxes, or order totals. All calculations are performed on the cloud.
// • Concurrency & Actor Isolation: Cart mutations and idempotency key lifecycle
//   are managed within a thread-safe Swift Actor, preventing race conditions.
// • State Machine Integrity: Order status transitions follow a strict, forward-only
//   validation model (Placed -> Paid -> Picking -> Packed -> OutForDelivery -> Delivered).
// • Two-Phase Payment for Weighted Produce: Pre-authorize estimate (+15%), capture exact weight.
// • Live Activities (ActivityKit): Real-time Lock Screen & Dynamic Island updates via APNs.

import Foundation
import SwiftUI
import ActivityKit

// MARK: - 1. Domain Models & State Machine

/// Strict state machine for grocery order lifecycle.
/// Validates allowed forward transitions, preventing illegal backward jumps.
public enum OrderStatus: String, Codable, Sendable, CaseIterable {
    case placed         = "PLACED"
    case paid           = "PAID"
    case picking        = "PICKING"
    case packed         = "PACKED"
    case outForDelivery = "OUT_FOR_DELIVERY"
    case delivered      = "DELIVERED"
    case cancelled      = "CANCELLED"
    
    /// Verifies if transitioning from current state to target state is legally permissible.
    public func canTransition(to next: OrderStatus) -> Bool {
        switch (self, next) {
        case (.placed, .paid), (.placed, .cancelled):
            return true
        case (.paid, .picking), (.paid, .cancelled):
            return true
        case (.picking, .packed):
            return true
        case (.packed, .outForDelivery):
            return true
        case (.outForDelivery, .delivered):
            return true
        default:
            return false // Illegal jump (e.g. Delivered -> Picking) rejected
        }
    }
}

/// Substitution preference per grocery line item
public enum SubstitutionPolicy: String, Codable, Sendable {
    case replaceWithSimilar = "REPLACE_SIMILAR" // In-store picker picks closest alternative
    case refundAndRemove    = "REFUND_REMOVE"    // Drop from order if out of stock
    case contactCustomer    = "CALL_CUSTOMER"    // Picker calls or chats for approval
}

/// Represents either a packaged barcode item or weighted produce (e.g. bananas, apples)
public struct GroceryItem: Codable, Identifiable, Sendable {
    public let id: String
    public let name: String
    public let storeID: String
    public let unitPriceCents: Int
    public let isWeightBased: Bool
    public let estimatedWeightKg: Double?
    public var substitutionPolicy: SubstitutionPolicy
    
    public init(id: String, name: String, storeID: String, unitPriceCents: Int,
                isWeightBased: Bool = false, estimatedWeightKg: Double? = nil,
                substitutionPolicy: SubstitutionPolicy = .replaceWithSimilar) {
        self.id = id
        self.name = name
        self.storeID = storeID
        self.unitPriceCents = unitPriceCents
        self.isWeightBased = isWeightBased
        self.estimatedWeightKg = estimatedWeightKg
        self.substitutionPolicy = substitutionPolicy
    }
}

/// Server-calculated cart truth (App displays, NEVER calculates)
public struct ServerCartSummary: Codable, Sendable {
    public let subtotalCents: Int
    public let deliveryFeeCents: Int
    public let estimatedTaxCents: Int
    public let discountCents: Int
    public let totalCents: Int
    public let reservedSlotExpiresAt: Date?
    public let items: [GroceryItem]
}

// MARK: - 2. Thread-Safe Cart & Checkout Manager (Actor Isolation)

/// Actor ensuring zero race conditions when mutating local cart or preparing checkout
public actor GroceryCartManager {
    private var localCart: [GroceryItem] = []
    private var activeIdempotencyKey: UUID?
    private let storeID: String
    
    public init(storeID: String) {
        self.storeID = storeID
    }
    
    /// Adds an item with pre-selected substitution policy
    public func addItem(_ item: GroceryItem) {
        guard item.storeID == storeID else { return } // Enforce dark-store boundaries
        localCart.append(item)
    }
    
    /// Merges guest cart items with remote server cart upon successful login
    public func mergeGuestCart(with remoteItems: [GroceryItem]) {
        var merged = remoteItems
        for localItem in localCart where !merged.contains(where: { $0.id == localItem.id }) {
            merged.append(localItem)
        }
        self.localCart = merged
    }
    
    /// Generates or reuses client idempotency key for network resilience
    public func getOrCreateCheckoutIdempotencyKey() -> UUID {
        if let existing = activeIdempotencyKey {
            return existing
        }
        let newKey = UUID()
        self.activeIdempotencyKey = newKey
        return newKey
    }
    
    /// Resets idempotency key once checkout response confirms order creation
    public func finalizeCheckoutSession() {
        self.localCart.removeAll()
        self.activeIdempotencyKey = nil
    }
    
    public var currentItems: [GroceryItem] {
        return localCart
    }
}

// MARK: - 3. Real-Time Order Tracking & Live Activity Integration

/// Attributes required by iOS ActivityKit for Lock Screen & Dynamic Island display
public struct GroceryDeliveryAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var status: OrderStatus
        public var estimatedMinutesRemaining: Int
        public var courierName: String
        public var currentStepDescription: String
    }
    
    public var orderID: String
    public var storeName: String
}

@MainActor
public final class OrderTrackingViewModel: ObservableObject {
    @Published public private(set) var currentStatus: OrderStatus = .placed
    @Published public private(set) var etaMinutes: Int = 15
    @Published public private(set) var statusMessage: String = "Order received by dark store"
    
    private let orderID: String
    private var liveActivity: Activity<GroceryDeliveryAttributes>?
    
    public init(orderID: String) {
        self.orderID = orderID
    }
    
    /// Starts iOS 16.1+ Live Activity on Lock Screen and Dynamic Island
    public func startLiveActivity(storeName: String) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        
        let attributes = GroceryDeliveryAttributes(orderID: orderID, storeName: storeName)
        let initialContentState = GroceryDeliveryAttributes.ContentState(
            status: .placed,
            estimatedMinutesRemaining: 20,
            courierName: "Assigning...",
            currentStepDescription: "Order placed. Awaiting dark store picker."
        )
        
        do {
            liveActivity = try Activity.request(
                attributes: attributes,
                content: .init(state: initialContentState, staleDate: nil),
                pushType: .token // Receive APNs updates to push silent Lock Screen updates!
            )
            print("🚀 Live Activity started for order: \\(orderID)")
        } catch {
            print("Failed to start Live Activity: \\(error)")
        }
    }
    
    /// Processes incoming WebSocket / APNs push payload to transition status machine
    public func applyStatusUpdate(newStatus: OrderStatus, eta: Int, message: String) {
        guard currentStatus.canTransition(to: newStatus) else {
            print("⚠️ Rejected invalid state transition: \\(currentStatus) -> \\(newStatus)")
            return
        }
        
        self.currentStatus = newStatus
        self.etaMinutes = eta
        self.statusMessage = message
        
        // Update Live Activity on Lock Screen
        Task {
            let updatedState = GroceryDeliveryAttributes.ContentState(
                status: newStatus,
                estimatedMinutesRemaining: eta,
                courierName: "Alex R.",
                currentStepDescription: message
            )
            await liveActivity?.update(.init(state: updatedState, staleDate: nil))
            
            if newStatus == .delivered || newStatus == .cancelled {
                await liveActivity?.end(.init(state: updatedState, staleDate: nil), dismissalPolicy: .default)
            }
        }
    }
}`
};

// 2. Insert newQ63 at index 62
questions.splice(62, 0, newQ63);
console.log('New questions count in questions.json:', questions.length);
if (questions.length !== 89) {
  console.error('Expected 89 questions, got:', questions.length);
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
  if (cat.id === 'system-design') {
    cat.questionIds = ['Q-60', 'Q-61', 'Q-62', 'Q-63'];
    cat.summary = "End-to-end mobile system design: Two-tier LRU memory/disk image caching, Offline-First bi-directional sync, E-commerce payment flow (Apple Pay, idempotency), and Grocery delivery architecture (Instacart/Blinkit multi-service, dark-store inventory & real-time order tracking).";
  } else if (cat.id === 'testing-ai') {
    cat.questionIds = ['Q-64', 'Q-65', 'Q-66', 'Q-67', 'Q-68', 'Q-69', 'Q-70', 'Q-71', 'Q-72', 'Q-73'];
  } else if (cat.id === 'cicd-devops') {
    cat.questionIds = ['Q-74', 'Q-75'];
  } else if (cat.id === 'leadership-production') {
    cat.questionIds = ['Q-76', 'Q-77', 'Q-78', 'Q-79', 'Q-80', 'Q-81'];
  } else if (cat.id === 'memory-management') {
    cat.questionIds = ['Q-82', 'Q-83', 'Q-84', 'Q-85', 'Q-86', 'Q-87', 'Q-88', 'Q-89'];
  }
}
const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(topicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS: shift keys >= 63 up by 1, and add Q-63
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
const newQ2D = {};

for (const [key, val] of Object.entries(oldQ2D)) {
  const num = parseInt(key.replace('Q-', ''), 10);
  if (num >= 63) {
    const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
    newQ2D[shiftedKey] = val;
  } else {
    newQ2D[key] = val;
  }
}

newQ2D['Q-63'] = [
  {
    docId: "networking-architecture",
    title: "Networking, API Design & Resilience Guide",
    filename: "Networking-Architecture-TalkingPoints.md",
    icon: "🌐"
  },
  {
    docId: "security-comparison",
    title: "Security, Storage & App Hardening Guide",
    filename: "Security-Comparison-TalkingPoints.md",
    icon: "🔒"
  }
];

const newQ2DCode = 'const QUESTION_TO_DOCS = ' + JSON.stringify(newQ2D) + ';';
html = html.substring(0, startQ2D) + newQ2DCode + html.substring(endQ2D + 2);

// Update text counters in index.html
html = html.replace(/88 Questions/g, '89 Questions');
html = html.replace(/88 questions/g, '89 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 4. Update QUESTIONS.md
md = md.replace(
  '| **System Design & Mobile Architecture** | `3` |',
  '| **System Design & Mobile Architecture** | `4` |'
);
md = md.replace(
  '| **Total** | **`88`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`89`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 88 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 89 iOS interview questions'
);

// Update Section headers
md = md.replace(
  '## 🏛️ System Design & Mobile Architecture (Q-60 – Q-62)',
  '## 🏛️ System Design & Mobile Architecture (Q-60 – Q-63)'
);
md = md.replace(
  '## 🧪 Testing & AI Engineering (Q-63 – Q-72)',
  '## 🧪 Testing & AI Engineering (Q-64 – Q-73)'
);
md = md.replace(
  '## 🚀 CI/CD & DevOps (Q-73 – Q-74)',
  '## 🚀 CI/CD & DevOps (Q-74 – Q-75)'
);
md = md.replace(
  '## 👔 Engineering Leadership & Operations (Q-75 – Q-80)',
  '## 👔 Engineering Leadership & Operations (Q-76 – Q-81)'
);
md = md.replace(
  '## 🧠 Memory Management (Q-81 – Q-88)',
  '## 🧠 Memory Management (Q-82 – Q-89)'
);

// Shift question anchors in reverse (from 88 down to 63)
for (let num = 88; num >= 63; num--) {
  const currentRegex = new RegExp(`### \`Q-${num}\` —`, 'g');
  const targetId = `### \`Q-${num + 1}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Prepare markdown for Q-63
const q63Md = `
---

### \`Q-63\` — System Design — How do you design an end-to-end Grocery Delivery App (Instacart / Blinkit)?

- **Category:** \`System Design & Mobile Architecture\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I start with the main user journey: browse, search, cart, checkout, and tracking. The iOS app owns the screens, a small local cache so browsing feels fast, and the cart for guests. The cloud owns the truth: prices, stock, the final total, and the order status. Behind an API gateway, microservices coordinate via an asynchronous event bus, and third parties handle payment tokenization, maps, and push delivery. (Memory trick: A-G-S-E-T → 'App shows, Gateway guards, Services own the truth, Events connect them, Third parties do the specialist work.')"*

#### 📖 Detailed Answer

${newQ63.answer}

#### 💻 Swift Architecture & Domain Implementation

\`\`\`swift
${newQ63.codeExample}
\`\`\`
`;

// Insert q63Md right before "## 🧪 Testing & AI Engineering (Q-64 – Q-73)"
const insertMarker = '## 🧪 Testing & AI Engineering (Q-64 – Q-73)';
const markerIdx = md.indexOf(insertMarker);
if (markerIdx === -1) {
  console.error('Could not find insertMarker in QUESTIONS.md');
  process.exit(1);
}

md = md.substring(0, markerIdx) + q63Md + '\n\n---\n\n' + md.substring(markerIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
