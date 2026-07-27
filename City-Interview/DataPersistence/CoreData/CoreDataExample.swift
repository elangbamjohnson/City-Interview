import Foundation
import CoreData

// MARK: - 🗄️ Core Data Stack (Bare Minimum)
//
// 💡 INTERVIEW CONCEPTS TO MEMORIZE:
// 1. Container: Wraps the whole stack (Model, Coordinator, Contexts).
// 2. viewContext: Runs on the MAIN thread. Used for UI fetching.
// 3. Thread Rule: NEVER pass an NSManagedObject across threads. Pass its ID or map it to a struct.

// ==========================================
// 1. The Core Data Stack Initialization
// ==========================================
class PersistenceController {
    static let shared = PersistenceController()
    let container: NSPersistentContainer

    init() {
        // "YourModel" must match the .xcdatamodeld filename exactly
        container = NSPersistentContainer(name: "YourModel")
        
        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Core Data failed to load: \(error)")
            }
        }
        
        // Auto-merge background saves into the main UI context
        container.viewContext.automaticallyMergesChangesFromParent = true
    }
}

// ==========================================
// 2. The Entity (Manual Codegen)
// ==========================================
@objc(NoteEntity)
class NoteEntity: NSManagedObject {
    @NSManaged var title: String
}

// ==========================================
// 3. Simple Usage (Main Thread vs Background)
// ==========================================
class CoreDataDemonstrator {
    let container = PersistenceController.shared.container
    
    // 🟢 MAIN THREAD (UI)
    func saveOnMainThread(title: String) {
        let context = container.viewContext // Main thread context
        let note = NoteEntity(context: context)
        note.title = title
        
        try? context.save() // Blocks UI during disk write
    }
    
    // 🔵 BACKGROUND THREAD (Heavy operations)
    func saveInBackground(title: String) {
        // Automatically creates a private context on a background queue
        container.performBackgroundTask { backgroundContext in
            let note = NoteEntity(context: backgroundContext)
            note.title = title
            
            try? backgroundContext.save() // Safe background disk write
        }
    }
    
    // 🔵 BACKGROUND FETCH (Thread Safety)
    func fetchInBackground(completion: @escaping ([String]) -> Void) {
        let backgroundContext = container.newBackgroundContext()
        
        backgroundContext.perform {
            let request = NSFetchRequest<NoteEntity>(entityName: "NoteEntity")
            let notes = (try? backgroundContext.fetch(request)) ?? []
            
            // ⚠️ CRITICAL: Map NSManagedObjects to simple strings before returning!
            let titles = notes.map { $0.title }
            
            DispatchQueue.main.async {
                completion(titles)
            }
        }
    }
}
