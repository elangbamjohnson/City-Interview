import SwiftUI
import Combine

// MARK: - COORDINATOR PATTERN — Interview Prep Guide
//
// WHAT IS IT?
// The Coordinator pattern removes navigation logic from Views.
// Views don't know about other Views. They tell the Coordinator
// "I want to go somewhere" and the Coordinator decides WHERE.
//
// WHY USE IT?
// • Views become reusable — they don't hardcode destinations.
// • Navigation logic is centralized in one place.
// • Easy to change navigation flows without touching Views.
// • Simplifies deep linking — Coordinator can jump to any screen.
//
// HOW IT WORKS:
//
//   ┌──────────┐   "user tapped profile"   ┌─────────────┐   pushes   ┌──────────────┐
//   │  View A  │ ────────────────────────►  │ COORDINATOR │ ────────►  │   View B     │
//   │ (no idea │                            │ (owns the   │            │ (no idea     │
//   │  View B  │                            │  nav stack) │            │  View A      │
//   │  exists) │                            └─────────────┘            │  exists)     │
//   └──────────┘                                                       └──────────────┘
//
// INTERVIEW KEY POINT:
// In UIKit, Coordinators use UINavigationController.pushViewController.
// In SwiftUI, Coordinators manage a NavigationPath or @Published enum state.


// MARK: - 1. Define all possible screens as an enum
/// Each case represents a screen the app can navigate to.
/// Using an enum makes the navigation type-safe — you can't navigate to an invalid screen.
enum Screen: Hashable {
    case home
    case userList
    case userDetail(name: String, email: String)
    case settings
}


// MARK: - 2. Coordinator Protocol
/// Defines what ANY coordinator must be able to do.
/// This makes it easy to create different coordinators
/// (e.g., MainCoordinator, AuthCoordinator, OnboardingCoordinator).
protocol CoordinatorProtocol: ObservableObject {
    var path: NavigationPath { get set }
    func navigate(to screen: Screen)
    func goBack()
    func goToRoot()
}


// MARK: - 3. Concrete Coordinator
/// The single source of truth for ALL navigation in this flow.
/// Views call its methods — they never manage NavigationPath themselves.
@MainActor
final class AppCoordinator: CoordinatorProtocol {
    @Published var path = NavigationPath()
    
    /// Central navigation decision point.
    /// If you ever need to add analytics, auth checks, or conditional routing,
    /// this is the ONE place to do it.
    func navigate(to screen: Screen) {
        path.append(screen)
    }
    
    func goBack() {
        if !path.isEmpty {
            path.removeLast()
        }
    }
    
    func goToRoot() {
        path = NavigationPath()
    }
}
