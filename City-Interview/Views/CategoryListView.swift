import SwiftUI

struct CategoryListView: View {
    @EnvironmentObject var store: QuestionStore
    
    var body: some View {
        List {
            Section(header: Text("Interactive Playgrounds").font(.system(size: 16))) {
                NavigationLink(destination: KeychainPlaygroundView()) {
                    HStack {
                        Image(systemName: "key.fill")
                            .foregroundColor(.yellow)
                            .font(.system(size: 24))
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Keychain Storage")
                                .font(.system(size: 22, weight: .bold))
                            Text("SecItem CRUD & Token Management")
                                .font(.system(size: 16))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                NavigationLink(destination: GCDPlaygroundView()) {
                    HStack {
                        Image(systemName: "play.circle.fill")
                            .foregroundColor(.blue)
                            .font(.system(size: 24))
                        VStack(alignment: .leading, spacing: 4) {
                            Text("GCD Playground")
                                .font(.system(size: 22, weight: .bold))
                            Text("Hands-on GCD Networking")
                                .font(.system(size: 16))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                NavigationLink(destination: SwiftConcurrencyPlaygroundView()) {
                    HStack {
                        Image(systemName: "bolt.circle.fill")
                            .foregroundColor(.purple)
                            .font(.system(size: 24))
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Swift Concurrency")
                                .font(.system(size: 22, weight: .bold))
                            Text("async/await, TaskGroup, Actor")
                                .font(.system(size: 16))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                NavigationLink(destination: MVVMPlaygroundView()) {
                    HStack {
                        Image(systemName: "rectangle.3.group.fill")
                            .foregroundColor(.orange)
                            .font(.system(size: 24))
                        VStack(alignment: .leading, spacing: 4) {
                            Text("MVVM Pattern")
                                .font(.system(size: 22, weight: .bold))
                            Text("Model → ViewModel → View")
                                .font(.system(size: 16))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                NavigationLink(destination: CleanArchPlaygroundView()) {
                    HStack {
                        Image(systemName: "building.columns.fill")
                            .foregroundColor(.teal)
                            .font(.system(size: 24))
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Clean Architecture")
                                .font(.system(size: 22, weight: .bold))
                            Text("Domain → Data → Presentation")
                                .font(.system(size: 16))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                NavigationLink(destination: CoordinatorPlaygroundView()) {
                    HStack {
                        Image(systemName: "arrow.triangle.branch")
                            .foregroundColor(.indigo)
                            .font(.system(size: 24))
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Coordinator Pattern")
                                .font(.system(size: 22, weight: .bold))
                            Text("Centralized Navigation")
                                .font(.system(size: 16))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                NavigationLink(destination: RepositoryPlaygroundView()) {
                    HStack {
                        Image(systemName: "externaldrive.fill")
                            .foregroundColor(.mint)
                            .font(.system(size: 24))
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Repository Pattern")
                                .font(.system(size: 22, weight: .bold))
                            Text("Swap API / Cache / Mock")
                                .font(.system(size: 16))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                NavigationLink(destination: AutoLayoutPlaygroundRepresentable()) {
                    HStack {
                        Image(systemName: "squareshape.split.2x2")
                            .foregroundColor(.pink)
                            .font(.system(size: 24))
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Auto Layout Basics")
                                .font(.system(size: 22, weight: .bold))
                            Text("Constraints & Anchors")
                                .font(.system(size: 16))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
            }
            
            Section(header: Text("Interview Questions").font(.system(size: 16))) {
                ForEach(store.categories, id: \.self) { category in
                NavigationLink(destination: QuestionListView(category: category)) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(category)
                            .font(.system(size: 22, weight: .bold))
                        
                        let progress = store.progress(for: category)
                        let percent = progress.total > 0 ? Double(progress.reviewed) / Double(progress.total) : 0
                        
                        HStack {
                            ProgressView(value: percent)
                                .tint(.blue)
                            Text("\(progress.reviewed)/\(progress.total)")
                                .font(.system(size: 16))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 10)
                }
            }
            }
        }
        .navigationTitle("Citi Interview Prep")
    }
}

#Preview {
    NavigationView {
        CategoryListView()
            .environmentObject(QuestionStore())
    }
}
