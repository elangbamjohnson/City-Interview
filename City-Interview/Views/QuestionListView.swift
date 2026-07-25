import SwiftUI

struct QuestionListView: View {
    let category: String
    @EnvironmentObject var store: QuestionStore
    
    var body: some View {
        List {
            ForEach(store.questions(for: category)) { question in
                NavigationLink(destination: QuestionDetailView(question: question)) {
                    HStack {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(question.question)
                                .font(.system(size: 20))
                                .lineLimit(3)
                            
                            HStack {
                                Text(question.difficulty)
                                    .font(.system(size: 15, weight: .medium))
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(difficultyColor(for: question.difficulty).opacity(0.2))
                                    .foregroundStyle(difficultyColor(for: question.difficulty))
                                    .clipShape(Capsule())
                            }
                        }
                        
                        Spacer()
                        
                        if store.isReviewed(id: question.id) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.green)
                        }
                    }
                    .padding(.vertical, 8)
                }
            }
        }
        .navigationTitle(category)
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func difficultyColor(for difficulty: String) -> Color {
        switch difficulty.lowercased() {
        case "beginner": return .green
        case "intermediate": return .orange
        case "advanced": return .red
        default: return .blue
        }
    }
}

#Preview {
    NavigationView {
        QuestionListView(category: "Tier 1 — Must know cold")
            .environmentObject(QuestionStore())
    }
}
