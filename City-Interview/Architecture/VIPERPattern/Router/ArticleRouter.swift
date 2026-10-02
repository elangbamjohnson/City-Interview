import SwiftUI

// MARK: - ROUTER / WIREFRAME (VIPER)
//
// 💡 INTERVIEW TALKING POINTS (ROUTER):
// • What is it? Handles navigation logic and Module Assembly (Dependency Injection container).
// • Assembly: `createModule()` builds View, Presenter, Interactor, and Router, wiring up all weak/strong references.
// • Navigation: Decouples navigation logic from View and Presenter.

@MainActor
final class ArticleRouter: ArticleRouterProtocol {
    
    /// Weak reference back to presenter to update UI state for navigation
    weak var presenter: ArticlePresenter?
    
    // MARK: - Module Assembly (Factory Method)
    static func createModule() -> VIPERPlaygroundView {
        let router = ArticleRouter()
        let interactor = ArticleInteractor()
        let presenter = ArticlePresenter(interactor: interactor, router: router)
        
        // Wire bidirectional references
        interactor.presenter = presenter
        router.presenter = presenter
        
        let view = VIPERPlaygroundView(presenter: presenter)
        return view
    }
    
    // MARK: - Navigation
    func navigateToDetail(for article: Article) {
        print("➡️ Router: Navigating to detail for article '\(article.title)'")
        presenter?.setNavigationAlertMessage("Navigating via Router to: '\(article.title)'")
    }
}
