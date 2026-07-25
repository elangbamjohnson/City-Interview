import Foundation
import CoreData

// MARK: - 🗄️ Core Data Internals
//
// 💡 INTERVIEW TALKING POINTS:
// • What is Core Data? It is an **Object Graph Manager** (it manages objects and their relationships), NOT just a database. It usually uses SQLite under the hood, but abstracts it completely.
// • Persistent Container & Coordinator: The Persistent Container encapsulates the Core Data stack. The Coordinator sits between the Context (scratchpad) and the Persistent Store (actual DB file), managing saves and loads.
// • Main vs Background Context: The `viewContext` runs on the main thread and is for UI updates. `newBackgroundContext()` runs on a background thread for heavy importing/saving to avoid freezing the UI.
// • NSFetchedResultsController: A powerful controller used to automatically keep a UITableView/UICollectionView in sync with Core Data changes.

// ==========================================
// CRUD Flow Example (Core Data)
// ==========================================

// Assume `NoteEntity` is defined in an .xcdatamodeld file
@objc(NoteEntity)
class NoteEntity: NSManagedObject {
    @NSManaged var id: String
    @NSManaged var title: String
    @NSManaged var timestamp: Date
}

class CoreDataDemonstrator {
    let context: NSManagedObjectContext
    
    init(context: NSManagedObjectContext) {
        self.context = context
    }
    
    // Create
    func createNote(id: String, title: String) {
        let note = NoteEntity(context: context)
        note.id = id
        note.title = title
        note.timestamp = Date()
        
        try? context.save()
    }
    
    // Read
    func fetchNotes() -> [NoteEntity] {
        let request = NSFetchRequest<NoteEntity>(entityName: "NoteEntity")
        // Optional: request.sortDescriptors = [NSSortDescriptor(key: "timestamp", ascending: false)]
        
        do {
            return try context.fetch(request)
        } catch {
            return []
        }
    }
    
    // Update
    func updateNote(note: NoteEntity, newTitle: String) {
        note.title = newTitle
        try? context.save()
    }
    
    // Delete
    func deleteNote(note: NoteEntity) {
        context.delete(note)
        try? context.save()
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why use Core Data instead of direct SQLite?
//   A: Core Data handles complex object relationships (graph management), lazy loading (faulting), and provides built-in UI synchronization (NSFetchedResultsController).
// • Q: What is a "fault" in Core Data?
//   A: A placeholder object. Core Data doesn't load all data into memory at once; it loads a fault, and only fetches the actual data from disk when you access a property.
// • Q: Why did your app crash when you passed a managed object to a background thread?
//   A: Managed objects are strictly bound to the context/thread they were created on. You must pass the object's `NSManagedObjectID` and re-fetch it on the background context.
