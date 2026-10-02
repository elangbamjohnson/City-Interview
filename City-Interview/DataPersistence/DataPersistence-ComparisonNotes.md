# Data Persistence Decision Table

| Framework | Best For... | Pros / Cons |
|---|---|---|
| **UserDefaults** | Tiny pieces of non-sensitive data (User preferences, dark mode flag, simple states). | **Pros:** Extremely fast and simple.<br>**Cons:** Unsafe for sensitive data. Not for large objects. Synchronous blocking on large datasets. |
| **Keychain** | Secure, sensitive data (Passwords, Auth Tokens, Encryption Keys). | **Pros:** AES-256 encrypted automatically. Persists even if the app is deleted.<br>**Cons:** Slow. C-level API is clunky without a wrapper. |
| **SQLite (Raw / FMDB)** | High-performance, cross-platform apps needing complex SQL joins. | **Pros:** Raw SQL power, incredibly fast, database can be shared with Android.<br>**Cons:** No native Swift object mapping, lots of string-based queries. |
| **Core Data** | Complex object graphs, relationships, and deep iOS integration (CloudKit, NSFetchedResultsController). | **Pros:** Memory efficient (faulting), native Apple support, GUI editor.<br>**Cons:** Extremely steep learning curve, thread-safety nightmares, heavy boilerplate. |
| **Realm** | Modern apps needing reactive, auto-updating objects and easy syntax. | **Pros:** Blazing fast (zero-copy), reactive, very easy to set up.<br>**Cons:** Adds a large third-party binary size, tight coupling to Realm objects, thread boundaries can be tricky. |

---

## 🎙️ Interview Question: "How do you design offline support and data sync?"

### 🗣️ Answer (Say it like this):

> *"For offline support, I keep one simple rule: **the screen never reads from the network. It always reads from the local database.** The network only fills that database in the background. So the app feels the same online or offline. When the user changes something, I save it on the phone first, and the screen updates right away. Then I put that change in a small queue, which I call an **outbox**. The user never waits for the internet.*  
> 
> *When the network comes back, I sync in two steps. First I send the waiting changes from the outbox, in the same order the user made them. I add a unique key to each one, so a retry never creates a duplicate. Then I ask the server only for what changed since the last sync, so I don't download everything again. If the same item was changed on both sides, I use a simple rule. For low-risk data, the newest change wins. For things like prices, the server wins. For important data, I ask the user."*

---

### 💻 Code Pattern (Save First, Send Later)

```swift
func save(_ note: Note) async throws {
    try await store.save(note)       // 1. save on the phone, UI updates now
    try await outbox.add(note.id)    // 2. remember to send it later
    Task { await sync.run() }        // 3. try now, fine if offline
}
```

---

### 💡 Easy Way to Remember (The Mental Model)

Think of a **notebook and a post office**:
* **The notebook** is always with you in your pocket. You write in it and read from it any time, even with zero signal.
* **The outbox tray** is where letters you want to send wait.
* **The post office** takes those letters when you can reach it, sends them off safely, and hands you only the new incoming mail.

---

### 🔑 4 Key Senior Concepts Inside This Answer

1. **Single Source of Truth (SSOT)**: The local database ([`CoreData`](file:///Users/johnsonelangbam/Projects/City-Interview/City-Interview/DataPersistence/CoreData/CoreDataExample.swift), SwiftData, or Realm) is the only place the UI observes. The network is just a background sync worker.
2. **The Outbox Pattern**: Store mutations locally before attempting to send. If the network drops or the app crashes, pending changes are never lost.
3. **Idempotency Keys**: Attaching a unique UUID (`clientMutationId`) to every outgoing change ensures retrying a request over a flaky connection won't create duplicate records on the server.
4. **Conflict Resolution Strategy**:
   - **Last-Write-Wins (Timestamp-based)**: Great for low-risk fields (e.g. note text, user bio).
   - **Server-Wins**: Critical business state (e.g. seat reservation, product pricing, inventory).
   - **User Resolution**: Three-way merge dialog when data cannot be reconciled automatically (e.g. conflicting document edits).

> **🏆 One-liner to remember:**  
> *"Local database is the truth. Save first, send later, and use a clear rule for conflicts."*

* **Related Examples in this Project**:
  - Offline-First implementation: [`OfflineFirstExample.swift`](file:///Users/johnsonelangbam/Projects/City-Interview/City-Interview/DataPersistence/Offline%20Support/OfflineFirstExample.swift)
  - Core Data stack & concurrency: [`CoreDataExample.swift`](file:///Users/johnsonelangbam/Projects/City-Interview/City-Interview/DataPersistence/CoreData/CoreDataExample.swift)
  - Keychain token persistence: [`KeychainExample.swift`](file:///Users/johnsonelangbam/Projects/City-Interview/City-Interview/DataPersistence/Keychain/KeychainExample.swift)


