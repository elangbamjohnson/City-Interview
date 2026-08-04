import Foundation
import Security

// MARK: - 🛡️ Secure Enclave
//
// 💡 INTERVIEW TALKING POINTS:
// • What is it physically? The Secure Enclave is a dedicated, isolated hardware coprocessor inside the iPhone. It has its own encrypted memory and boot ROM. It is completely isolated from the main CPU.
// • Why is it so secure? When you generate a private key inside the Secure Enclave, the actual raw key bits NEVER leave it. The iOS kernel and your app cannot read the key. You only get an opaque "token" (reference) to ask the Enclave to perform cryptographic operations (like signing data) on your behalf.
// • Use Cases: It is NOT for general data storage (it can't hold arbitrary strings). It is strictly used for storing Elliptic Curve (P-256) private keys, usually gated behind biometric authentication (Face ID / Touch ID).

// ==========================================
// Minimal Secure Enclave Signing Example
// ==========================================
class SecureEnclaveDemonstrator {
    
    func generateKeyAndSign(dataToSign: Data) -> Data? {
        guard let ac = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenUnlockedThisDeviceOnly, [.privateKeyUsage, .biometryAny], nil) else { return nil }
        let attrs: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: false,
                kSecAttrAccessControl as String: ac
            ]
        ]
        guard let privateKey = SecKeyCreateRandomKey(attrs as CFDictionary, nil) else { return nil }
        var error: Unmanaged<CFError>?
        guard let sig = SecKeyCreateSignature(privateKey, .ecdsaSignatureMessageX962SHA256, dataToSign as CFData, &error) else { return nil }
        return sig as Data
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Can a jailbroken iPhone extract a private key from the Secure Enclave?
//   A: No. Because the Enclave is a separate physical chip with its own OS, even root access to the main iOS kernel cannot access the memory inside the Secure Enclave.
// • Q: Why can't I encrypt large files directly using the Secure Enclave?
//   A: The Enclave only does asymmetric cryptography (specifically 256-bit Elliptic Curve). Asymmetric crypto is mathematically too slow for large files. Instead, you use a symmetric key (AES) to encrypt the file, and use the Enclave's asymmetric key to encrypt the AES key (Envelope Encryption).
// • Q: What happens if the user deletes their Face ID profile?
//   A: If the key was created with the `biometryCurrentSet` flag, changing or deleting Face ID permanently invalidates the key.

