import Foundation

// MARK: - 📱 Offline-First Architecture (Bare Minimum)
//
// 💡 INTERVIEW TALKING POINTS (The "Notebook & Post Office" Pattern):
// • Rule 1: The UI NEVER reads from the network. It always observes the local database (Single Source of Truth).
// • Rule 2: Save First, Send Later. When the user creates or edits data:
//   1. Save to local store immediately (UI responds instantly with 0ms lag).
//   2. Add mutation to an "Outbox" queue (persisted pending uploads).
//   3. Trigger background sync (if offline, it fails silently and retries later).
// • Rule 3: Conflict Resolution. When local and remote data conflict:
//   - Last-Write-Wins (Timestamp comparison) for simple edits.
//   - Server-Wins for critical business rules (e.g., ticket inventory, pricing).
//   - User intervention for sensitive document merges.

// ==========================================
// 1. Domain Entity
// ==========================================
struct Note: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var content: String
    var updatedAt: Date
}

// ==========================================
// 2. The Local Store (The Notebook - Local DB)
// ==========================================
// In a real app, this could be SwiftData, Core Data, or SQLite.
// The UI only ever reads from this store!
actor LocalNoteStore {
    private var database: [UUID: Note] = [:]

    func save(_ note: Note) {
        database[note.id] = note
    }

    func get(id: UUID) -> Note? {
        return database[id]
    }

    func allNotes() -> [Note] {
        return Array(database.values)
    }
}

// ==========================================
// 3. The Outbox (The Outgoing Mail Tray)
// ==========================================
// Keeps track of items that were modified locally but not yet sent to the server.
// If the app crashes or goes offline, this queue preserves pending work.
actor OutboxQueue {
    private var pendingIDs: Set<UUID> = []

    func add(_ id: UUID) {
        pendingIDs.insert(id)
    }

    func remove(_ id: UUID) {
        pendingIDs.remove(id)
    }

    func pending() -> [UUID] {
        return Array(pendingIDs)
    }
}

// ==========================================
// 4. Mock Remote API (The Server)
// ==========================================
protocol RemoteAPIProtocol: Sendable {
    func upload(note: Note) async throws
    func fetchChanges(since lastSync: Date) async throws -> [Note]
}

actor MockRemoteAPI: RemoteAPIProtocol {
    var isOnline: Bool = true
    
    func setOnline(_ online: Bool) {
        self.isOnline = online
    }
    
    func upload(note: Note) async throws {
        guard isOnline else { throw URLError(.notConnectedToInternet) }
        print("☁️ Server: Saved note '\(note.title)' with idempotency key \(note.id)")
    }
    
    func fetchChanges(since lastSync: Date) async throws -> [Note] {
        guard isOnline else { throw URLError(.notConnectedToInternet) }
        return [] // Returns notes modified on the server since lastSync
    }
}

// ==========================================
// 5. The Sync Engine (The Post Office)
// ==========================================
// Coordinates two-way synchronization:
// 1. PUSH: Sends outgoing changes from the outbox.
// 2. PULL: Fetches delta changes from the server and resolves conflicts.
actor SyncEngine {
    private let localStore: LocalNoteStore
    private let outbox: OutboxQueue
    private let remoteAPI: RemoteAPIProtocol
    private var lastSyncDate: Date = .distantPast

    init(localStore: LocalNoteStore, outbox: OutboxQueue, remoteAPI: RemoteAPIProtocol) {
        self.localStore = localStore
        self.outbox = outbox
        self.remoteAPI = remoteAPI
    }

    func run() async {
        do {
            // STEP 1: PUSH pending local changes to the server
            for noteID in await outbox.pending() {
                guard let note = await localStore.get(id: noteID) else { continue }
                
                // Idempotency: Note.id is used by the server to prevent duplicate creation
                try await remoteAPI.upload(note: note)
                await outbox.remove(noteID)
            }

            // STEP 2: PULL changes that happened on the server since our last sync
            let remoteChanges = try await remoteAPI.fetchChanges(since: lastSyncDate)
            for remoteNote in remoteChanges {
                await resolveConflictAndSave(remoteNote: remoteNote)
            }
            lastSyncDate = Date()
            print("✅ Sync complete!")
        } catch {
            // Offline? No problem. The outbox keeps the changes safe for the next sync.
            print("⚠️ Sync failed (offline): \(error.localizedDescription). Will retry later.")
        }
    }

    // 💡 Conflict Resolution: Last-Write-Wins (LWW) Strategy
    private func resolveConflictAndSave(remoteNote: Note) async {
        if let localNote = await localStore.get(id: remoteNote.id) {
            // Both sides changed the same note. Newest timestamp wins!
            if remoteNote.updatedAt > localNote.updatedAt {
                await localStore.save(remoteNote)
            }
        } else {
            // Brand new note from server
            await localStore.save(remoteNote)
        }
    }
}

// ==========================================
// 6. Note Repository (The Public API for ViewModels)
// ==========================================
class NoteRepository {
    private let store: LocalNoteStore
    private let outbox: OutboxQueue
    private let sync: SyncEngine

    init(store: LocalNoteStore, outbox: OutboxQueue, sync: SyncEngine) {
        self.store = store
        self.outbox = outbox
        self.sync = sync
    }

    // 🎯 THE INTERVIEW GOLDEN METHOD:
    func save(_ note: Note) async throws {
        await store.save(note)       // 1. Save on the phone -> UI updates immediately!
        await outbox.add(note.id)    // 2. Add to outbox -> Remember to upload later
        Task { await sync.run() }    // 3. Try to sync now -> Silent fail if offline
    }
}

// ==========================================
// 🎙️ Interview Q&A Summary
// ==========================================
// • Q: Why save to local store first before calling the network?
//   A: Zero-latency UI. The user gets immediate visual feedback and the app works identically online or offline.
// • Q: What if the phone dies or the app crashes right after local save?
//   A: The Outbox pattern persists pending IDs. When the app relaunches, the SyncEngine processes remaining items.
// • Q: How do you prevent duplicate records if a retry happens during a flaky network?
//   A: Idempotency keys (using the client-generated UUID `note.id`). If the server receives the same UUID twice, it updates rather than creates.
// • Q: How does conflict resolution work?
//   A: Last-Write-Wins compares `updatedAt` timestamps. Server-Wins applies to restricted business logic. User prompt is reserved for conflicting documents.
