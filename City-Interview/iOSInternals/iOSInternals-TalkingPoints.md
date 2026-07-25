# iOS Internals — Interview Talking Points

A quick reference for memory management (ARC), run loops, and app lifecycle mechanics in iOS.

## 1. Core Concepts
- **ARC (Automatic Reference Counting):** The Swift compiler automatically tracks memory by inserting `retain` and `release` calls at compile time. It is not a runtime garbage collector.
- **Retain Cycles:** When two objects hold strong references to each other, their retain count never drops to zero, causing a memory leak.
- **Weak vs Unowned:** Both break retain cycles without increasing retain count. `weak` is optional and safely becomes `nil` when the object dies; `unowned` assumes the object is always alive and crashes if accessed after deallocation.
- **RunLoop:** An event processing loop tied to a specific thread that keeps it alive to receive touches, timers, or network callbacks.
- **App vs Scene Lifecycle:** Pre-iOS 13, `AppDelegate` handled everything. Now, `AppDelegate` handles app-level events (launch, core data) and `SceneDelegate` handles UI-level events (backgrounding, foregrounding) to support multiple windows.

## 2. Common Interview Questions
- **Q: How does ARC differ from Garbage Collection?**
  - A: ARC is deterministic and happens at compile-time; Garbage Collection pauses execution to scan memory at runtime.
- **Q: How do closures cause memory leaks?**
  - A: By default, closures strongly capture the objects they use (like `self`). If `self` also owns the closure, it creates a cycle.
- **Q: Why did my Timer pause when the user scrolled a TableView?**
  - A: The Main RunLoop switched from `.default` to `UITrackingRunLoopMode`. You must schedule the timer in `.common` mode.
- **Q: What state does the app enter when the user presses the home button?**
  - A: It briefly hits `Inactive`, moves to `Background`, and usually enters the `Suspended` state where it executes no code.

## 3. Quick Self-Check
- [ ] Can I write code to create and then fix a retain cycle?
- [ ] Do I know when to use `[weak self]` vs `[unowned self]`?
- [ ] Can I explain why the main thread never naturally exits?
- [ ] Can I distinguish between `SceneWillResignActive` and `SceneDidEnterBackground`?
