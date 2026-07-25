# Data Persistence Decision Table

| Framework | Best For... | Pros / Cons |
|---|---|---|
| **UserDefaults** | Tiny pieces of non-sensitive data (User preferences, dark mode flag, simple states). | **Pros:** Extremely fast and simple.<br>**Cons:** Unsafe for sensitive data. Not for large objects. Synchronous blocking on large datasets. |
| **Keychain** | Secure, sensitive data (Passwords, Auth Tokens, Encryption Keys). | **Pros:** AES-256 encrypted automatically. Persists even if the app is deleted.<br>**Cons:** Slow. C-level API is clunky without a wrapper. |
| **SQLite (Raw / FMDB)** | High-performance, cross-platform apps needing complex SQL joins. | **Pros:** Raw SQL power, incredibly fast, database can be shared with Android.<br>**Cons:** No native Swift object mapping, lots of string-based queries. |
| **Core Data** | Complex object graphs, relationships, and deep iOS integration (CloudKit, NSFetchedResultsController). | **Pros:** Memory efficient (faulting), native Apple support, GUI editor.<br>**Cons:** Extremely steep learning curve, thread-safety nightmares, heavy boilerplate. |
| **Realm** | Modern apps needing reactive, auto-updating objects and easy syntax. | **Pros:** Blazing fast (zero-copy), reactive, very easy to set up.<br>**Cons:** Adds a large third-party binary size, tight coupling to Realm objects, thread boundaries can be tricky. |
