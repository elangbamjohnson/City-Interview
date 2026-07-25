import Foundation
// import RealmSwift // Commented out to prevent build failure if framework isn't linked, but syntax below is accurate.

// MARK: - 👑 Realm Internals
//
// 💡 INTERVIEW TALKING POINTS:
// • Custom Engine: Realm is NOT built on top of SQLite. It uses its own custom C++ core storage engine, optimized for speed and zero-copy data reads.
// • Live Objects / Auto-updating: Realm objects are "live". If you query a list of notes, and another thread adds a note, your list updates automatically without re-fetching.
// • Threading Rules: Realm instances and objects are strictly thread-confined. You CANNOT pass a Realm object created on Thread A to Thread B. You must pass its Primary Key and re-fetch it on Thread B, or use ThreadSafeReference.

// ==========================================
// CRUD Flow Example (Realm)
// ==========================================

/*
// 1. Model Definition
class NoteRealm: Object {
    @Persisted(primaryKey: true) var id: String = UUID().uuidString
    @Persisted var title: String = ""
    @Persisted var timestamp: Date = Date()
}

class RealmDemonstrator {
    
    // Get the default Realm instance for the current thread
    let realm = try! Realm()
    
    // Create
    func createNote(title: String) {
        let note = NoteRealm()
        note.title = title
        
        // All modifications must be wrapped in a write transaction
        try! realm.write {
            realm.add(note)
        }
    }
    
    // Read
    func fetchNotes() -> Results<NoteRealm> {
        // This is a "Live" result set. It updates automatically.
        // Data is lazily loaded (Zero-copy), meaning items are only read from disk when accessed.
        return realm.objects(NoteRealm.self).sorted(byKeyPath: "timestamp", ascending: false)
    }
    
    // Update
    func updateNote(note: NoteRealm, newTitle: String) {
        try! realm.write {
            note.title = newTitle // Directly modify the property inside a write block
        }
    }
    
    // Delete
    func deleteNote(note: NoteRealm) {
        try! realm.write {
            realm.delete(note)
        }
    }
}
*/

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why is Realm generally faster than SQLite/Core Data?
//   A: Realm uses a custom engine with "Zero-copy architecture". It maps memory directly from the database file to the object, skipping the translation layer Core Data/SQLite requires.
// • Q: What happens if I pass a Realm object to a background queue to process it?
//   A: The app will crash. Realm objects are thread-confined. Use `ThreadSafeReference` to pass them safely across threads.
// • Q: How does Realm handle UI updates?
//   A: Realm Results are live. You can attach a `notificationToken` to a Results collection, and Realm will call a block with granular changes (insertions, deletions, modifications) whenever the data changes.
