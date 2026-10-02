import UIKit // Importing UIKit to show UIViewController concepts, even if bare-minimum

// MARK: - 🧭 Coordinator Pattern
//
// 💡 INTERVIEW TALKING POINTS:
// • The Problem: In standard MVC, ViewControllers push other ViewControllers (`self.navigationController?.push(...)`). This makes the ViewController responsible for navigation, permanently coupling it to the next screen and destroying its reusability. (Massive View Controller).
// • The Solution: Coordinators are plain objects solely responsible for app flow. The ViewController only says "I was tapped", and the Coordinator decides where to go next.
// • Parent/Child Coordinators: Large apps have an AppCoordinator (Parent) that launches a LoginCoordinator (Child) or a DashboardCoordinator (Child), strictly managing memory and flow lifecycles.

// ==========================================
// Coordinator Example
// ==========================================

// 1. The Base Protocol
protocol Coordinator {
    var navigationController: UINavigationController { get set }
    func start()
}

// 2. The Concrete Coordinator
class ProfileCoordinator: Coordinator {
    var navigationController: UINavigationController
    
    init(navigationController: UINavigationController) {
        self.navigationController = navigationController
    }
    
    // 3. Coordinator takes charge of UI setup and pushing
    func start() {
        // In a real app, you'd instantiate the VC and inject a ViewModel here
        let profileVC = UIViewController()
        profileVC.title = "Profile"
        
        // Setup a closure so the VC can talk back to the Coordinator
        // profileVC.onSettingsTapped = { [weak self] in
        //     self?.showSettings()
        // }
        
        navigationController.pushViewController(profileVC, animated: true)
    }
    
    func showSettings() {
        let settingsVC = UIViewController()
        settingsVC.title = "Settings"
        navigationController.pushViewController(settingsVC, animated: true)
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: How does the Coordinator pattern enable Deep Linking?
//   A: Beautifully. Because navigation is centralized, a deep link can just be passed to the AppCoordinator, which instantly spins up the exact Child Coordinator and ViewController chain needed to handle the URL, bypassing standard flow.
// • Q: How do ViewControllers communicate back to the Coordinator?
//   A: Typically via Delegate protocols, or more modernly, via simple closure properties (`var onLoginSuccess: (() -> Void)?`) that the Coordinator hooks into.
// • Q: How are Child Coordinators deallocated?
//   A: The Parent Coordinator holds an array of `childCoordinators`. When a child finishes its flow, it must notify the parent to remove it from the array, freeing it from memory.
