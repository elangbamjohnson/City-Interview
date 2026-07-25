import SwiftUI

// MARK: - VIEW (VIPER)
//
// 💡 INTERVIEW TALKING POINTS (VIEW):
// • What is it? Passive/Dumb UI component.
// • Responsibilities: Renders state from Presenter and delegates user touches to Presenter.
// • Strict Rule: View NEVER talks directly to Interactor, Router, or Entity!

struct VIPERPlaygroundView: View {
    
    // In SwiftUI, View observes the Presenter directly as a StateObject/ObservedObject
    @StateObject var presenter: ArticlePresenter
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                
                // Header Explanation
                VStack(alignment: .leading, spacing: 6) {
                    Text("🐍 VIPER Architecture")
                        .font(.title2).bold()
                    Text("View ↔ Presenter ↔ Interactor ↔ Entity | Presenter → Router")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(UIColor.secondarySystemGroupedBackground))
                .cornerRadius(10)
                
                // Fetch Action Button
                Button("Load Articles (Presenter → Interactor)") {
                    presenter.viewDidLoad()
                }
                .font(.headline)
                .buttonStyle(.borderedProminent)
                
                // Loading State
                if presenter.isLoading {
                    ProgressView("Interactor fetching data...")
                }
                
                // Error State
                if let error = presenter.errorMessage {
                    Text("❌ Error: \(error)").foregroundColor(.red)
                }
                
                // Articles List
                ForEach(presenter.articles) { article in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(article.title)
                            .font(.headline)
                        Text(article.content)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(UIColor.secondarySystemGroupedBackground))
                    .cornerRadius(10)
                    .onTapGesture {
                        // User tap -> View informs Presenter -> Presenter asks Router to navigate
                        presenter.didSelectArticle(article)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("VIPER Pattern")
        .navigationBarTitleDisplayMode(.inline)
        .alert(isPresented: Binding(
            get: { presenter.navigationAlertMessage != nil },
            set: { if !$0 { presenter.setNavigationAlertMessage(nil) } }
        )) {
            Alert(
                title: Text("Router Navigation"),
                message: Text(presenter.navigationAlertMessage ?? ""),
                dismissButton: .default(Text("OK"))
            )
        }
    }
}

#Preview {
    NavigationView {
        ArticleRouter.createModule()
    }
}
