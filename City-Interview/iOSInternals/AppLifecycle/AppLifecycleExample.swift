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
    // State transition: Not Running -> Inactive
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        print("AppDelegate: didFinishLaunchingWithOptions")
        return true
    }
    
    // Called when a new Scene session is created.
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        print("AppDelegate: configurationForConnecting (Setting up SceneDelegate)")
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
}


// ==========================================
// 2. SceneDelegate (UI / Window Level)
// ==========================================
class ExampleSceneDelegate: UIResponder, UIWindowSceneDelegate {
    
    var window: UIWindow?
    
    // 2️⃣ UI is about to appear. Set up your root view controller here.
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        print("SceneDelegate: willConnectTo (Setup Root UI)")
    }
    
    // 3️⃣ App is visible but NOT receiving touches (e.g., a phone call comes in, or app is transitioning to active).
    func sceneWillEnterForeground(_ scene: UIScene) {
        print("SceneDelegate: sceneWillEnterForeground (Background -> Inactive)")
    }
    
    // 4️⃣ App is fully visible and the user can interact with it.
    func sceneDidBecomeActive(_ scene: UIScene) {
        print("SceneDelegate: sceneDidBecomeActive (Inactive -> Active)")
    }
    
    // 5️⃣ User swipes up to go home (or gets a system prompt). Touches are disabled.
    func sceneWillResignActive(_ scene: UIScene) {
        print("SceneDelegate: sceneWillResignActive (Active -> Inactive)")
    }
    
    // 6️⃣ App is no longer visible on screen. Save state, pause heavy tasks!
    func sceneDidEnterBackground(_ scene: UIScene) {
        print("SceneDelegate: sceneDidEnterBackground (Inactive -> Background)")
    }
    
    // 7️⃣ App is killed by the user (swiped away) or by the OS to reclaim memory.
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
