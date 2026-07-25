# Networking Architecture Decision Table

| Approach | Best For... | Pros / Cons |
|---|---|---|
| **Raw URLSession (Closures)** | Very simple apps, quick prototypes. | **Pros:** Zero dependencies, built-in.<br>**Cons:** Callback hell, hard to chain requests, easy to forget `[weak self]`. |
| **Raw URLSession (async/await)** | Modern iOS apps (iOS 13+). | **Pros:** Reads top-to-bottom, no callback hell, native try/catch.<br>**Cons:** Less native infrastructure for global retry/auth logic. |
| **Custom Network Stack (Client + Endpoint)** | Enterprise apps needing high testability and modularity. | **Pros:** Easy to inject Mock clients, completely decoupled from UI, highly scalable.<br>**Cons:** Takes time to build the boilerplate `NetworkClientProtocol` and Enums. |
| **Interceptors (Middleware)** | Apps with complex global logic (Token refresh, Logging, Analytics). | **Pros:** Keeps network calls completely clean. Global logic is centralized.<br>**Cons:** Can make debugging harder if interceptors mutate requests invisibly. |
| **URLProtocol Subclassing** | Legacy apps, or mocking requests deeply at the OS level. | **Pros:** Intercepts ALL requests globally, great for deep caching or offline modes.<br>**Cons:** Heavy, older C-style API, hard to maintain. |
| **Third Party (Alamofire)** | Teams that need multipart form uploads, advanced cert pinning, or retry logic instantly. | **Pros:** Battle-tested, heavily featured.<br>**Cons:** Adds a massive external dependency for things URLSession now does natively. |
