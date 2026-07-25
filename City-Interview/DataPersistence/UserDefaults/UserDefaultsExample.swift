import Foundation

// MARK: - ⚙️ UserDefaults Internals
//
// 💡 INTERVIEW TALKING POINTS:
// • Purpose: Meant for small, non-sensitive, simple key-value settings (e.g., "isDarkModeEnabled").
// • Plist Backed: Under the hood, UserDefaults writes everything to a single `.plist` (XML) file on disk.
// • Why NOT for large data: Every time the app launches, the ENTIRE plist file is loaded into memory. Storing huge JSONs or images here will cause high memory usage and slow app launch times.
// • Why NOT for sensitive data: It is completely unencrypted. Anyone with access to the file system (or via iTunes backup) can read the plain text plist.

// ==========================================
// CRUD Flow Example (UserDefaults)
// ==========================================

struct NoteCodable: Codable {
    let id: String
    var title: String
    let timestamp: Date
}

class UserDefaultsDemonstrator {
    
    private let userDefaults = UserDefaults.standard
    private let noteKey = "com.cityinterview.savedNote"
    
    // Create / Update
    func saveNote(_ note: NoteCodable) {
        do {
            let data = try JSONEncoder().encode(note)
            // Saves the encoded struct as Data
            userDefaults.set(data, forKey: noteKey)
        } catch {
            print("Encoding error")
        }
    }
    
    // Read
    func readNote() -> NoteCodable? {
        // Read the Data and decode it back to the struct
        guard let data = userDefaults.data(forKey: noteKey) else { return nil }
        
        do {
            return try JSONDecoder().decode(NoteCodable.self, from: data)
        } catch {
            return nil
        }
    }
    
    // Delete
    func deleteNote() {
        userDefaults.removeObject(forKey: noteKey)
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How is UserDefaults stored on disk?
//   A: It is serialized into a standard XML Property List (.plist) file in the app's Preferences folder.
// • Q: Is UserDefaults synchronized immediately when you call `.set()`?
//   A: Historically, you had to call `synchronize()`, but now iOS handles saving it asynchronously in the background. Calling `synchronize()` is deprecated.
// • Q: Can I save custom objects in UserDefaults?
//   A: Yes, but only if you encode them first (e.g., using `Codable` to convert them to `Data`). UserDefaults natively only supports standard types (String, Int, Data, Date, Array, Dictionary).
