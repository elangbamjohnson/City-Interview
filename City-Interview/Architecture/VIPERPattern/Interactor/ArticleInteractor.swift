import Foundation

// MARK: - INTERACTOR (VIPER)
//
// 💡 INTERVIEW TALKING POINTS (INTERACTOR):
// • What is it? Contains Pure Business Logic & Data Fetching (API, Database, Cache).
// • Key Property: Entirely independent of UI (no SwiftUI, no UIKit). Speaks ONLY to the Presenter via a weak delegate/reference.
// • Single Responsibility Principle (SRP): Handles fetching, parsing, and processing entity data.

final class ArticleInteractor: ArticleInteractorProtocol {
    
    /// Weak reference to Presenter to prevent retain cycles
    weak var presenter: ArticlePresenterProtocol?
    
    func fetchArticles() {
        Task {
            // Simulating API call latency
            try? await Task.sleep(for: .seconds(1))
            
            let mockArticles = [
                Article(id: 1, title: "VIPER Architecture", content: "VIPER separates responsibilities into 5 distinct layers."),
                Article(id: 2, title: "Single Responsibility", content: "Each component in VIPER does exactly one job."),
                Article(id: 3, title: "Protocol-Oriented", content: "Layers communicate strictly through protocols.")
            ]
            
            // Pass result back to Presenter on Main Thread
            await MainActor.run {
                presenter?.interactorDidFetchArticles(.success(mockArticles))
            }
        }
    }
}
