import SwiftUI

// MARK: - VIEW
//
// 💡 INTERVIEW TALKING POINTS (VIEW & DEPENDENCY INJECTION):
// • View instantiates ViewModels injecting specific repositories (`APIProductRepository` vs `CacheProductRepository`).
// • Switching Data Sources: Swapping data source in an app is a single line change at the composition root (View / Coordinator / DI Container).
// • Identical Rendering Logic: Both sections share the same `sourceSection` view function, proving the View doesn't care about the underlying data source.

struct RepositoryPlaygroundView: View {
    
    // Injecting API source into ViewModel
    @StateObject private var apiVM = ProductViewModel(repository: APIProductRepository())
    
    // Injecting Cache source into ViewModel
    @StateObject private var cacheVM = ProductViewModel(repository: CacheProductRepository())
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                sourceSection(
                    title: "📡 From API",
                    subtitle: "Fetches from network (1s delay)",
                    vm: apiVM
                )
                
                Divider()
                
                sourceSection(
                    title: "💾 From Cache",
                    subtitle: "Returns instantly from local storage",
                    vm: cacheVM
                )
            }
            .padding()
        }
        .navigationTitle("Repository Pattern")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    @ViewBuilder
    private func sourceSection(title: String, subtitle: String, vm: ProductViewModel) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.system(size: 20, weight: .bold))
            Text(subtitle).font(.system(size: 14)).foregroundStyle(.secondary)
            
            Button("Fetch Products") { vm.loadProducts() }
                .font(.system(size: 17, weight: .semibold))
                .buttonStyle(.borderedProminent)
            
            if vm.isLoading {
                ProgressView("Loading...")
            }
            
            if let error = vm.errorMessage {
                Text("❌ \(error)").foregroundColor(.red)
            }
            
            if !vm.dataSource.isEmpty {
                Text("Source: \(vm.dataSource)")
                    .font(.system(size: 13, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
            
            ForEach(vm.products) { product in
                HStack {
                    Text(product.name)
                        .font(.system(size: 17, weight: .semibold))
                    Spacer()
                    Text("$\(product.price, specifier: "%.2f")")
                        .font(.system(size: 15, design: .monospaced))
                        .foregroundStyle(.secondary)
                }
                .padding()
                .background(Color(UIColor.secondarySystemGroupedBackground))
                .cornerRadius(10)
            }
        }
    }
}

#Preview {
    NavigationView { RepositoryPlaygroundView() }
}

