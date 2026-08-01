import UIKit

// MARK: - 📱 App Lifecycle Internals
//
// 💡 INTERVIEW TALKING POINTS:
// • Pre iOS 13: `AppDelegate` handled EVERYTHING (App launch, push notifications, and UI Window lifecycle).
// • Post iOS 13 (Multiple Windows/iPadOS): `AppDelegate` handles APP-level events (Launch, CoreData, Push Tokens).
//   `SceneDelegate` was introduced to handle UI-level lifecycle events because one app can now have multiple UI instances (Scenes) open simultaneously.

// ==========================================
// 1. AppDelegate (App Level)
// ==========================================
class ExampleAppDelegate: UIResponder, UIApplicationDelegate {
    
    // 1️⃣ Called FIRST when the app launches. Do early setup here (Analytics, Crashlytics, DB config).
    // 💡 INTERVIEW NOTE: application(_:didFinishLaunchingWithOptions:)
    // App just launched — one-time setup (SDKs, push registration, dependency injection root).
    // State transition: Not Running -> Inactive
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        print("AppDelegate: didFinishLaunchingWithOptions")
        return true
    }
    
    // Called when a new Scene session is created.
    // 💡 INTERVIEW NOTE: application(_:configurationForConnecting:options:)
    // iOS 13+, tells the system which scene configuration to use when a new scene is being created.
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        print("AppDelegate: configurationForConnecting (Setting up SceneDelegate)")
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
    
    // Called when the user forcibly closes a scene from the app switcher.
    // 💡 INTERVIEW NOTE: application(_:didDiscardSceneSessions:)
    // Scenes were discarded by the user — clean up related state.
    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        print("AppDelegate: didDiscardSceneSessions")
    }
    
    // Called when the entire app moves to the background.
    // 💡 INTERVIEW NOTE: applicationDidEnterBackground(_:)
    // Pre-scenes / whole-app background transition (still called for app-wide events).
    func applicationDidEnterBackground(_ application: UIApplication) {
        print("AppDelegate: applicationDidEnterBackground")
    }
    
    // Called when the app is about to be terminated by the OS.
    // 💡 INTERVIEW NOTE: applicationWillTerminate(_:)
    // App is being terminated — last chance to save data (not guaranteed to be called if suspended then killed).
    func applicationWillTerminate(_ application: UIApplication) {
        print("AppDelegate: applicationWillTerminate")
    }
}


// ==========================================
// 2. SceneDelegate (UI / Window Level)
// ==========================================
class ExampleSceneDelegate: UIResponder, UIWindowSceneDelegate {
    
    var window: UIWindow?
    
    // 2️⃣ UI is about to appear. Set up your root view controller here.
    // 💡 INTERVIEW NOTE: scene(_:willConnectTo:options:)
    // Replaces AppDelegate's didFinishLaunching for UI setup. Used to optionally configure and attach the UIWindow.
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        print("SceneDelegate: willConnectTo (Setup Root UI)")
    }
    
    // 3️⃣ App is visible but NOT receiving touches (e.g., transitioning from background).
    // 💡 INTERVIEW NOTE: sceneWillEnterForeground(_:)
    // The scene is moving from the background to the foreground. Good place to undo changes made on entering background.
    func sceneWillEnterForeground(_ scene: UIScene) {
        print("SceneDelegate: sceneWillEnterForeground (Background -> Inactive)")
    }
    
    // 4️⃣ App is fully visible and the user can interact with it.
    // 💡 INTERVIEW NOTE: sceneDidBecomeActive(_:)
    // The scene is now active. Restart any paused tasks or timers. Triggered after `sceneWillEnterForeground`.
    func sceneDidBecomeActive(_ scene: UIScene) {
        print("SceneDelegate: sceneDidBecomeActive (Inactive -> Active)")
    }
    
    // 5️⃣ User swipes up to go home (or gets a system prompt). Touches are disabled.
    // 💡 INTERVIEW NOTE: sceneWillResignActive(_:)
    // The scene is about to move from active to inactive state. Pause ongoing tasks, disable timers, etc.
    func sceneWillResignActive(_ scene: UIScene) {
        print("SceneDelegate: sceneWillResignActive (Active -> Inactive)")
    }
    
    // 6️⃣ App is no longer visible on screen. Save state, pause heavy tasks!
    // 💡 INTERVIEW NOTE: sceneDidEnterBackground(_:)
    // The scene is now running in the background. Save user data, release shared resources, and store state information.
    func sceneDidEnterBackground(_ scene: UIScene) {
        print("SceneDelegate: sceneDidEnterBackground (Inactive -> Background)")
    }
    
    // 7️⃣ App is killed by the user (swiped away) or by the OS to reclaim memory.
    // 💡 INTERVIEW NOTE: sceneDidDisconnect(_:)
    // The scene session has been discarded. The OS can also call this if the system is low on resources and suspends the app.
    func sceneDidDisconnect(_ scene: UIScene) {
        print("SceneDelegate: sceneDidDisconnect (Background -> Terminated/Suspended)")
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why did Apple split AppDelegate and SceneDelegate in iOS 13?
//   A: To support multiple windows (especially on iPad). One app can have multiple scenes, so UI state needed to be decoupled from App state.
// • Q: In what state does an app usually reside when the user presses the home button?
//   A: It briefly enters `Inactive`, then `Background`, and quickly moves to the `Suspended` state where it executes no code.
// • Q: What is the difference between `ResignActive` and `EnterBackground`?
//   A: `ResignActive` happens when the app is interrupted (phone call, swipe up gesture started) but still visible. `EnterBackground` happens when it is no longer visible at all.
// • Q: Is `applicationWillTerminate(_:)` guaranteed to be called?
//   A: No. If the app is suspended in the background and the system needs memory, it terminates the app silently without calling this method.
// • Q: How can you finish a critical task if the app enters the background?
//   A: Call `UIApplication.shared.beginBackgroundTask` to request extra execution time (usually around 30 seconds) before the app is suspended.
// • Q: How are deep links handled when using SceneDelegate?
//   A: Handled in `scene(_:willConnectTo:options:)` on a fresh launch, and `scene(_:openURLContexts:)` if the scene is already in memory.
// • Q: What happens when the app is killed from the app switcher?
//   A: The OS calls `application(_:didDiscardSceneSessions:)` in AppDelegate, allowing you to clean up user data associated with the discarded scenes.
// • Q: Can we skip Scene Delegate and use only AppDelegate, like pre-iOS 13?
//   A: Yes. Remove `UIApplicationSceneManifest` from Info.plist. `AppDelegate` will then handle UI setup and all lifecycle methods.
// • Q: Is "suspended" a foreground or background state?
//   A: Background. It's the last stop before termination; the app stays in memory but executes zero code and can be purged silently.
// • Q: Where should push notification setup normally go?
//   A: In `AppDelegate` (`didFinishLaunchingWithOptions`), because push tokens belong to the whole app process, not individual scenes.
// • Q: Which method fires when the user force-quits by swiping up from the app switcher?
//   A: None. iOS terminates the process immediately. No lifecycle method is called, not even `applicationWillTerminate(_:)`.
