import Foundation
import Security

// MARK: - 🗝️ Keychain Internals
//
// 💡 INTERVIEW TALKING POINTS:
// • Purpose: Built specifically for sensitive data (Auth tokens, passwords, cryptographic keys).
// • Encrypted at Rest: Data is heavily encrypted by the iOS operating system using hardware-backed keys.
// • Survives App Deletion: Unlike UserDefaults/Core Data, Keychain items can (and often do) survive when the user uninstalls and reinstalls the app, depending on how they are provisioned.
// • Access Control Levels: You dictate exactly when data can be accessed (e.g., `kSecAttrAccessibleWhenUnlocked` ensures the data is strictly unreadable if the iPhone is locked).
// • Verbosity: Because it is an old C-level API, it requires creating massive Dictionaries (`CFDictionary`) and managing pointers/references, making it much harder to use than UserDefaults.

// ==========================================
// CRUD Flow Example (Keychain)
// ==========================================
// Using a simple Auth Token string to simulate a "Note ID" or similar sensitive string.

class KeychainDemonstrator {
    
    private let account = "NoteAuthToken"
    
    // Create
    func saveToken(_ token: String) -> Bool {
        guard let data = token.data(using: .utf8) else { return false }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlocked // Secure access control
        ]
        
        SecItemDelete(query as CFDictionary) // Clean up existing
        return SecItemAdd(query as CFDictionary, nil) == errSecSuccess
    }
    
    // Read
    func readToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        if status == errSecSuccess, let data = dataTypeRef as? Data {
            return String(data: data, encoding: .utf8)
        }
        return nil
    }
    
    // Update
    func updateToken(_ newToken: String) -> Bool {
        guard let data = newToken.data(using: .utf8) else { return false }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account
        ]
        
        let attributesToUpdate: [String: Any] = [
            kSecValueData as String: data
        ]
        
        return SecItemUpdate(query as CFDictionary, attributesToUpdate as CFDictionary) == errSecSuccess
    }
    
    // Delete
    func deleteToken() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account
        ]
        
        return SecItemDelete(query as CFDictionary) == errSecSuccess
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why is Keychain better than UserDefaults for passwords?
//   A: UserDefaults is a plaintext XML file. Keychain uses hardware-level AES encryption making it impossible to read by unauthorized entities.
// • Q: Can you share Keychain data between two different apps?
//   A: Yes! By using a "Keychain Access Group", multiple apps from the same developer (e.g., Facebook and Messenger) can share login sessions securely.
// • Q: Does Keychain data get backed up to iCloud?
//   A: By default, yes, it syncs securely if the user has iCloud Keychain enabled, ensuring they don't have to re-login when restoring a new iPhone.
