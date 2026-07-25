import Foundation
import Combine

// MARK: - PRESENTER (VIPER)
//
// 💡 INTERVIEW TALKING POINTS (PRESENTER):
// • What is it? The central coordinator/brain of the module.
// • Responsibilities:
//   1. Receives user actions from the View.
//   2. Requests data from the Interactor.
//   3. Transforms raw Entity data into View-ready formatting.
//   4. Tells the Router when & where to navigate.
// • Key Note: Presenter contains NO UIKit/SwiftUI rendering code, making it 100% unit-testable!

@MainActor
final class ArticlePresenter: ObservableObject, ArticlePresenterProtocol {
    
    // Dependencies (Injected by Router)
    private let interactor: ArticleInteractorProtocol
    private let router: ArticleRouterProtocol
    
    // Published properties for SwiftUI binding
    @Published private(set) var articles: [Article] = []
    @Published private(set) var isLoading: Bool = false
    @Published private(set) var errorMessage: String? = nil
    @Published private(set) var navigationAlertMessage: String? = nil
    
    init(interactor: ArticleInteractorProtocol, router: ArticleRouterProtocol) {
        self.interactor = interactor
        self.router = router
    }
    
    // MARK: - Input from View
    
    func viewDidLoad() {
        isLoading = true
        errorMessage = nil
        interactor.fetchArticles()
    }
    
    func didSelectArticle(_ article: Article) {
        // Delegate navigation to Router
        router.navigateToDetail(for: article)
    }
    
    // MARK: - Output from Interactor
    
    func interactorDidFetchArticles(_ result: Result<[Article], Error>) {
        isLoading = false
        switch result {
        case .success(let fetchedArticles):
            self.articles = fetchedArticles
        case .failure(let error):
            self.errorMessage = error.localizedDescription
        }
    }
    
    func setNavigationAlertMessage(_ message: String?) {
        self.navigationAlertMessage = message
    }
}
