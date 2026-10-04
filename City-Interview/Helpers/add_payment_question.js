const fs = require('fs');
const path = require('path');

// 1. Load questions.json
const questionsPath = path.join(__dirname, '../Resources/questions.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

console.log('Initial questions count:', questions.length);

const newQ59 = {
  id: "Q-59",
  category: "System Design & Mobile Architecture",
  difficulty: "Staff",
  question: "How does a payment process work in an e-commerce app like Amazon?",
  interviewSentence: "E-commerce payment is a distributed workflow across the iOS app, backend server, payment gateway, acquiring bank, card network, and issuing bank—where the client initiates Apple Pay or tokenization, the backend enforces idempotency and order state transitions, and sensitive card data never touches merchant infrastructure.",
  imageName: "payment_process_flow_diagram",
  answer: `In an iOS e-commerce app like Amazon, the checkout and payment process involves the iOS app, backend server, payment gateway, card network, and banks working together.

Let's understand it step by step:

1. Checkout: The user adds products to the cart and proceeds to checkout. The iOS app sends the cart details and delivery address to the backend server.

2. Order creation: The backend validates the products, checks inventory, calculates the final price, including taxes and shipping, and creates a pending order.

3. Payment initiation: The user selects a payment method, such as a credit card, Apple Pay, or Google Pay. For a digital wallet, the wallet authenticates the user and generates a secure payment token.

4. Payment processing: The iOS app sends the payment token to the backend over a secure API. The backend communicates with the payment gateway, which forwards the authorization request through the acquiring bank and card network to the customer's issuing bank.

5. Authorization: The issuing bank checks the available funds, card validity, and potential fraud. It then approves or declines the transaction. The result travels back through the payment network to the payment gateway and backend.

6. Order confirmation: If the payment is successful, the backend verifies the payment result, updates the order status, and confirms the order. The iOS app displays the confirmation to the user. If the payment fails, the app displays an appropriate error and allows the user to retry.

The flow diagram:

![Payment Process Flow Diagram](Resources/payment_process_flow_diagram.png)

\`\`\`
 Customer       Wallet (Apple Pay)        Your App             Your Server         Payment Gateway        Acquiring Bank        Card Network        Issuing Bank
    |                   |                     |                     |                     |                     |                     |                  |
    | 1. Pays via wallet|                     |                     |                     |                     |                     |                  |
    |------------------>|                     |                     |                     |                     |                     |                  |
    |                   | 2. Returns token    |                     |                     |                     |                     |                  |
    |                   |-------------------->|                     |                     |                     |                     |                  |
    |                   |                     | 3. Token + order    |                     |                     |                     |                  |
    |                   |                     |-------------------->|                     |                     |                     |                  |
    |                   |                     |                     | 4. Charge request   |                     |                     |                  |
    |                   |                     |                     |-------------------->|                     |                     |                  |
    |                   |                     |                     |                     | 5. Authorization req|                     |                  |
    |                   |                     |                     |                     |-------------------->|                     |                  |
    |                   |                     |                     |                     |                     | 6. Sends to network |                  |
    |                   |                     |                     |                     |                     |-------------------->|                  |
    |                   |                     |                     |                     |                     |                     | 7. Routes to bank|
    |                   |                     |                     |                     |                     |                     |----------------->|
    |                   |                     |                     |                     |                     |                     |                  | 8. Approves/Declines
    |<===================================================================================================================================================|
    | 9. Payment result displayed in iOS app                                                                                                             |
\`\`\`

The 8 Core Participants & Their Roles:
• Customer: Approves the payment and authorizes charges using biometric auth (Face ID / Touch ID).
• Wallet (Apple Pay / PassKit): Holds the card in the device Secure Element, validates the user biometrically, and generates a single-use payment token / cryptogram.
• Your App (iOS Client): Presents checkout screens, collects shipping preferences, triggers Apple Pay via PassKit, and relays the token and idempotency key to your backend.
• Your Server (Backend): Validates cart items, verifies pricing/taxes, manages the order lifecycle state machine, generates idempotency keys, and coordinates with the payment gateway.
• Payment Gateway (Stripe, Adyen, Razorpay): Decrypts the payment token, issues charges, integrates with banking networks, and returns transaction results.
• Acquiring Bank (Merchant's Bank): Accepts the processed payment and receives the funds on behalf of the store/merchant.
• Card Network (Visa, Mastercard, RuPay, Amex): Routes authorization requests and settlement funds between acquiring and issuing banks.
• Issuing Bank (Customer's Bank): Holds customer funds, checks available balance, performs fraud and 3D Secure risk scoring, and approves or declines the transaction.

The most important architectural concepts:

1. Client-Side Zero-Trust & PCI-DSS Scope Reduction (SAQ A):
   The iOS app must NEVER directly handle sensitive card details (Primary Account Numbers, CVVs, or expiration dates) or make the final decision about whether a payment succeeded. By using Apple Pay (PassKit) or Payment Gateway SDKs (Stripe/Adyen Elements), raw card data never touches your app's memory or merchant servers. This keeps the application in the minimal PCI-DSS compliance scope (SAQ A).

2. Idempotency Key Pattern:
   Network failures are inevitable. If a customer taps 'Pay' on an unstable cellular connection, the request might charge the customer but disconnect before returning the HTTP response. The iOS app generates a unique UUID (Idempotency Key) per checkout session. If the user retries or URLSession automatically retransmits, the backend recognizes the idempotency key and returns the original transaction state without double-charging.

3. Two-Phase Payments (Authorize vs. Capture):
   In e-commerce apps selling physical goods (like Amazon), payments are split into two distinct phases:
   • Authorization: Placed when checkout completes. Holds/reserves the funds on the customer's card without transferring money.
   • Capture: Executed only when physical goods are packaged and dispatched from the fulfillment warehouse. If an item is canceled before shipping, the hold is voided with zero processing fees.

4. Asynchronous Webhooks as Source of Truth:
   Never rely solely on the synchronous client-side API response to finalize an order. If the user force-quits the app or loses signal immediately after approving Face ID, the client may never receive the confirmation. The backend must listen to authenticated payment gateway webhooks (e.g. \`payment_intent.succeeded\`) to transition the order to Confirmed and trigger fulfillment.

Quick steps to remember:
1. Cart & Order: App sends cart to server; server validates inventory and creates Pending order.
2. Tokenize: App requests Apple Pay; Secure Element validates Face ID and yields single-use token.
3. Server Submission: App sends token + Idempotency-Key header to backend.
4. Gateway & Routing: Server requests authorization from Payment Gateway; gateway calls Acquiring Bank.
5. Bank Approval: Card network routes to Issuing Bank; Issuing Bank checks funds and approves.
6. Confirmation & Capture: Server updates order state to Confirmed; app displays success; warehouse captures funds upon shipping.

Good to mention (Staff-Level Interview Points):
• 3D Secure 2.0 (SCA / PSD2): Under European Strong Customer Authentication rules, payment gateways can trigger a frictionless 3DS challenge. Apple Pay inherently satisfies 2-factor SCA out of the box because device ownership + biometrics represent knowledge/inherence.
• Network Tokenization vs PSP Tokenization: Apple Pay uses EMV payment tokens (DPAN) generated by card networks, which do not change when a physical card is reissued due to expiry or loss.
• Replay Attack Prevention: Apple Pay payment tokens contain a transaction-specific cryptogram signed by the Secure Element. A compromised or intercepted token cannot be replayed for another transaction or merchant.

One-liner: The iOS app handles UI and tokenizes via Apple Pay, the backend enforces idempotency and order state transitions, and the payment gateway coordinates banking authorization without sensitive card data ever touching merchant servers.

Memory trick: C-T-I-G-B-C → "Cart validated, Tokenized by wallet, Idempotency sent to server, Gateway routes, Bank authorizes, Confirm and Capture."`,
  codeExample: `// =========================================================================
// 💳 SENIOR INTERVIEW ARCHITECTURE: E-Commerce Payment Flow & Apple Pay
// =========================================================================
//
// 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
// • PCI-DSS Scope Reduction (SAQ A): The iOS app never captures or stores raw card
//   numbers (PAN) or CVVs. Apple Pay (PassKit) uses the device Secure Element to
//   produce a device-specific cryptogram (DPAN) and dynamic one-time security code.
// • Idempotency Pattern: Network retries must NEVER cause duplicate billing. Every checkout
//   payload carries a unique client-generated UUID in the \`Idempotency-Key\` header.
// • Authorize vs. Capture: Physical e-commerce apps (like Amazon) authorize funds at checkout
//   and capture them only upon warehouse dispatch.
// • Order State Machine: Decouple client UI state from backend order lifecycle.

import Foundation
import PassKit

// MARK: - 1. Domain Models & Order State Machine

enum OrderStatus: String, Codable {
    case draft
    case pendingPayment = "pending_payment"
    case authorized
    case captured
    case failed
}

struct CheckoutOrder: Codable, Identifiable {
    let id: String
    let itemsTotal: Decimal
    let tax: Decimal
    let shipping: Decimal
    let grandTotal: Decimal
    let currencyCode: String
    var status: OrderStatus
}

// MARK: - 2. Apple Pay Coordinator (PassKit Integration)

@MainActor
final class ApplePayManager: NSObject, ObservableObject {
    private var paymentCompletion: ((PKPaymentAuthorizationResult) -> Void)?
    private var pendingTokenHandler: ((PKPaymentToken) async throws -> Bool)?
    
    // Check if the user has enrolled payment cards supporting our accepted networks
    var canMakePayments: Bool {
        let supportedNetworks: [PKPaymentNetwork] = [.visa, .masterCard, .amex]
        return PKPaymentAuthorizationController.canMakePayments(usingNetworks: supportedNetworks)
    }
    
    // Present the native Apple Pay sheet
    func initiateApplePay(
        for order: CheckoutOrder,
        onTokenReceived: @escaping (PKPaymentToken) async throws -> Bool
    ) async throws -> Bool {
        guard canMakePayments else {
            throw PaymentError.applePayNotAvailable
        }
        
        self.pendingTokenHandler = onTokenReceived
        
        // 1. Build payment request matching merchant ID and currency
        let request = PKPaymentRequest()
        request.merchantIdentifier = "merchant.com.citi.ecommerce"
        request.countryCode = "US"
        request.currencyCode = order.currencyCode
        request.supportedNetworks = [.visa, .masterCard, .amex]
        request.merchantCapabilities = .threeDSecure // Enforce 3D Secure / EMV chip cryptograms
        
        // 2. Summary items displayed on Apple Pay sheet
        request.paymentSummaryItems = [
            PKPaymentSummaryItem(label: "Items Subtotal", amount: NSDecimalNumber(decimal: order.itemsTotal)),
            PKPaymentSummaryItem(label: "Estimated Tax", amount: NSDecimalNumber(decimal: order.tax)),
            PKPaymentSummaryItem(label: "Shipping", amount: NSDecimalNumber(decimal: order.shipping)),
            PKPaymentSummaryItem(label: "Amazon Store", amount: NSDecimalNumber(decimal: order.grandTotal), type: .final)
        ]
        
        // 3. Present sheet via PKPaymentAuthorizationController
        let controller = PKPaymentAuthorizationController(paymentRequest: request)
        controller.delegate = self
        
        let presented = await controller.present()
        guard presented else {
            throw PaymentError.presentationFailed
        }
        
        return true
    }
}

// MARK: - 3. PKPaymentAuthorizationControllerDelegate

extension ApplePayManager: PKPaymentAuthorizationControllerDelegate {
    
    // Called when the user authorizes payment with Face ID / Touch ID
    nonisolated func paymentAuthorizationController(
        _ controller: PKPaymentAuthorizationController,
        didAuthorizePayment payment: PKPayment,
        handler completion: @escaping (PKPaymentAuthorizationResult) -> Void
    ) {
        Task { @MainActor in
            do {
                // Pass single-use payment token to backend with idempotency key
                guard let tokenHandler = self.pendingTokenHandler else {
                    completion(PKPaymentAuthorizationResult(status: .failure, errors: nil))
                    return
                }
                
                let success = try await tokenHandler(payment.token)
                if success {
                    completion(PKPaymentAuthorizationResult(status: .success, errors: nil))
                } else {
                    completion(PKPaymentAuthorizationResult(status: .failure, errors: nil))
                }
            } catch {
                completion(PKPaymentAuthorizationResult(status: .failure, errors: [error]))
            }
        }
    }
    
    // Called when the payment sheet is dismissed
    nonisolated func paymentAuthorizationControllerDidFinish(_ controller: PKPaymentAuthorizationController) {
        controller.dismiss()
    }
}

// MARK: - 4. Payment Network Service (Client-to-Backend Orchestration)

final class PaymentNetworkService {
    private let session: URLSession
    
    init(session: URLSession = .shared) {
        self.session = session
    }
    
    /// Sends the single-use token to backend server with an Idempotency-Key
    func processPayment(
        orderID: String,
        token: PKPaymentToken,
        idempotencyKey: UUID = UUID()
    ) async throws -> CheckoutOrder {
        guard let url = URL(string: "https://api.amazon-store.com/v1/orders/\\(orderID)/pay") else {
            throw PaymentError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // 💡 SENIOR TALKING POINT: Idempotency Key guarantees safe retries
        request.setValue(idempotencyKey.uuidString, forHTTPHeaderField: "Idempotency-Key")
        
        // Serialize token payload (contains encrypted payment cryptogram from Secure Element)
        let tokenDataString = paymentTokenString(from: token)
        let body: [String: Any] = [
            "paymentMethod": "apple_pay",
            "paymentData": tokenDataString
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw PaymentError.serverDeclined
        }
        
        return try JSONDecoder().decode(CheckoutOrder.self, from: data)
    }
    
    private func paymentTokenString(from token: PKPaymentToken) -> String {
        return token.paymentData.base64EncodedString()
    }
}

enum PaymentError: LocalizedError {
    case applePayNotAvailable
    case presentationFailed
    case invalidURL
    case serverDeclined
}`
};

// Shift questions from index 58 onwards
// Currently index 58 is Q-59. We need to increment its ID to Q-60, etc.
for (let i = 58; i < questions.length; i++) {
  const currentNum = i + 1; // 59, 60, ... 79
  const newNum = currentNum + 1; // 60, 61, ... 80
  questions[i].id = "Q-" + String(newNum).padStart(2, '0');
}

// Insert newQ59 at index 58
questions.splice(58, 0, newQ59);

console.log('New questions count in questions.json:', questions.length);
console.log('Index 56 (Q-57):', questions[56].id, questions[56].question);
console.log('Index 57 (Q-58):', questions[57].id, questions[57].question);
console.log('Index 58 (Q-59):', questions[58].id, questions[58].question);
console.log('Index 59 (Q-60):', questions[59].id, questions[59].question);
console.log('Last item (Q-80):', questions[questions.length - 1].id, questions[questions.length - 1].question);

fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
console.log('Successfully updated questions.json!');
