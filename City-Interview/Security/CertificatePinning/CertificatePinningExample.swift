import Foundation
import Security

// MARK: - 📍 Certificate / Public Key Pinning
//
// 💡 INTERVIEW TALKING POINTS:
// • Man-In-The-Middle (MITM) Attacks: On public Wi-Fi, an attacker can trick the user into installing a malicious Root Certificate on their iPhone. The OS will then trust the attacker's server as if it were yours, allowing them to read encrypted HTTPS traffic in plain text.
// • How Pinning Fixes This: Instead of trusting the OS to decide if a certificate is valid, your app hardcodes (pins) the exact Certificate (or Public Key) of your true server. If the server's key doesn't match the pin, the connection is instantly aborted.
// • Certificate vs Public Key Pinning: Certificates expire often (e.g. every year). If you pin the whole certificate, you MUST release an app update before it expires, or the app breaks ("Pinning Lockout"). Pinning the Public Key is safer because server teams can renew the certificate while keeping the same underlying public key.

// ==========================================
// Minimal Public Key Pinning Example
// ==========================================
class PinningSessionDelegate: NSObject, URLSessionDelegate {
    // The known public key of our server (Base64 encoded)
    let pinnedPublicKeyBase64 = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."

    func urlSession(_ session: URLSession,
                    didReceive challenge: URLAuthenticationChallenge,
                    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let trust = challenge.protectionSpace.serverTrust,
              let key = SecTrustCopyKey(trust),
              let data = SecKeyCopyExternalRepresentation(key, nil) as Data? else {
            return completionHandler(.cancelAuthenticationChallenge, nil)
        }
        completionHandler(data.base64EncodedString() == pinnedPublicKeyBase64 ? .useCredential : .cancelAuthenticationChallenge,
                          data.base64EncodedString() == pinnedPublicKeyBase64 ? URLCredential(trust: trust) : nil)
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why doesn't standard HTTPS (SSL/TLS) prevent MITM attacks on corporate networks?
//   A: Because corporations (or attackers) can install a custom Root CA profile on the device. iOS will implicitly trust the attacker's intercepted certificates unless the app explicitly implements Pinning.
// • Q: What is "Pinning Lockout"?
//   A: It occurs when a server's certificate rotates unexpectedly and the app's hardcoded pin no longer matches. Users are locked out of the app until an update is pushed to the App Store.
// • Q: Is there a modern alternative to writing this `URLSessionDelegate` boilerplate?
//   A: Yes! iOS 14 introduced `NSPinnedDomains` in the `Info.plist`. It allows you to configure public key pinning natively without writing any code.

