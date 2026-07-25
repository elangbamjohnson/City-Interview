import Foundation
import CryptoKit

// MARK: - 🔐 Data Encryption (CryptoKit)
//
// 💡 INTERVIEW TALKING POINTS:
// • Symmetric vs Asymmetric: Symmetric encryption (AES) uses ONE key to lock and unlock the data (fast, great for local DBs/files). Asymmetric encryption (RSA/ECC) uses TWO keys (Public/Private), making it great for digital signatures or securely sending symmetric keys over a network.
// • Why AES-GCM? It provides "Authenticated Encryption". It doesn't just hide the data (Confidentiality); it also attaches an authentication tag. If a hacker alters even a single bit of the encrypted ciphertext, the decryption will completely fail, proving it was tampered with (Integrity).
// • Key Storage: Generating an encryption key is easy. SECURING it is the hard part. Symmetric keys must be stored in the Keychain (or derived from a user password), NEVER hardcoded or saved in UserDefaults.

// ==========================================
// Minimal Symmetric Encryption Example
// ==========================================
class DataEncryptionDemonstrator {
    
    // In a real app, you generate this ONCE and save it to the iOS Keychain.
    let symmetricKey = SymmetricKey(size: .bits256)
    
    // 1. Encrypting Data
    func encrypt(plainText: String) -> Data? {
        let data = Data(plainText.utf8)
        
        do {
            // AES.GCM (Galois/Counter Mode) automatically handles the Nonce and Authentication Tag.
            let sealedBox = try AES.GCM.seal(data, using: symmetricKey)
            
            // The combined data contains: Nonce + Ciphertext + Tag
            return sealedBox.combined
        } catch {
            print("Encryption Failed: \(error)")
            return nil
        }
    }
    
    // 2. Decrypting Data
    func decrypt(encryptedData: Data) -> String? {
        do {
            // Reconstruct the box from the combined data
            let sealedBox = try AES.GCM.SealedBox(combined: encryptedData)
            
            // Decrypt it. If the data was tampered with, this will THROW an error!
            let decryptedData = try AES.GCM.open(sealedBox, using: symmetricKey)
            
            return String(data: decryptedData, encoding: .utf8)
        } catch {
            print("Decryption Failed! Data was tampered with or key is wrong.")
            return nil
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: What is a Nonce in cryptography, and why is it important?
//   A: A Nonce (Number used ONCE) ensures that encrypting the exact same string twice produces completely different ciphertexts. This prevents attackers from identifying patterns in encrypted data.
// • Q: Why use CryptoKit instead of the older CommonCrypto?
//   A: CommonCrypto is an old C-API that requires complex pointer manipulation and manual memory management, leading to frequent buffer overflows. CryptoKit is a native Swift framework that makes encryption incredibly safe and minimal.
// • Q: If AES-GCM is so secure, why doesn't Apple use it for everything?
//   A: AES-GCM is symmetric, meaning both the app and the server would need to share the exact same key securely. Distributing a symmetric key to an iPhone over the internet safely requires asymmetric cryptography (like a TLS handshake).
