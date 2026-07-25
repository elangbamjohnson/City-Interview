import Foundation

// MARK: - VIPER PROTOCOLS (THE CONTRACTS)
//
// 💡 INTERVIEW TALKING POINTS (VIPER CONTRACTS):
// • VIPER relies heavily on Protocol-Oriented Programming (POP).
// • Protocols define strict interfaces between components for 100% loose coupling and easy unit testing.
//
// ┌──────────┐  user action  ┌───────────┐  fetch data  ┌────────────┐
// │   VIEW   │ ────────────► │ PRESENTER │ ───────────► │ INTERACTOR │
// │          │ ◄──────────── │           │ ◄─────────── │ (Business) │
// └──────────┘  update UI    └─────┬─────┘  data back   └────────────┘
//                                  │ navigate
//                                  ▼
//                            ┌───────────┐
//                            │  ROUTER   │
//                            └───────────┘

// MARK: - View Protocol
/// Defines what the View can do (update UI state). Presenter calls this.
@MainActor
protocol ArticleViewProtocol: AnyObject {
    func displayArticles(_ articles: [Article])
    func displayError(_ message: String)
    func showLoading(_ isLoading: Bool)
}

// MARK: - Presenter Protocol
/// Defines actions triggered by the View, and callbacks received from the Interactor.
@MainActor
protocol ArticlePresenterProtocol: AnyObject {
    // Input from View
    func viewDidLoad()
    func didSelectArticle(_ article: Article)
    
    // Output from Interactor
    func interactorDidFetchArticles(_ result: Result<[Article], Error>)
}

// MARK: - Interactor Protocol
/// Defines business logic & data fetching requests. Presenter calls this.
protocol ArticleInteractorProtocol: AnyObject {
    func fetchArticles()
}

// MARK: - Router Protocol
/// Defines navigation & module assembly. Presenter calls this to navigate.
@MainActor
protocol ArticleRouterProtocol: AnyObject {
    static func createModule() -> VIPERPlaygroundView
    func navigateToDetail(for article: Article)
}
