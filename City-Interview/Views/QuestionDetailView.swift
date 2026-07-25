import SwiftUI

struct QuestionDetailView: View {
    let question: InterviewQuestion
    @EnvironmentObject var store: QuestionStore
    
    @State private var showAnswer = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Question Header
                Text(question.question)
                    .font(.system(size: 28, weight: .bold))
                
                Divider()
                
                if !showAnswer {
                    Button(action: {
                        withAnimation {
                            showAnswer = true
                        }
                    }) {
                        Text("Show Answer")
                            .font(.system(size: 20, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .padding(.top, 20)
                } else {
                    // Answer Section
                    VStack(alignment: .leading, spacing: 28) {
                        
                        if let interviewSentence = question.interviewSentence {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("💡 One Sentence to Say")
                                    .font(.system(size: 22, weight: .bold))
                                    .foregroundColor(.blue)
                                
                                Text(interviewSentence)
                                    .font(.system(size: 20))
                                    .italic()
                                    .lineSpacing(6)
                                    .padding()
                                    .background(Color.blue.opacity(0.1))
                                    .cornerRadius(10)
                            }
                        }
                        
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Explanation")
                                .font(.system(size: 22, weight: .bold))
                            
                            Text(question.answer)
                                .font(.system(size: 20))
                                .lineSpacing(8)
                        }
                        
                        if let code = question.codeExample {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Code Example")
                                    .font(.system(size: 22, weight: .bold))
                                
                                ScrollView(.horizontal, showsIndicators: false) {
                                    Text(code)
                                        .font(.system(size: 17, design: .monospaced))
                                        .lineSpacing(4)
                                        .padding()
                                        .background(Color(UIColor.secondarySystemBackground))
                                        .cornerRadius(10)
                                }
                            }
                        }
                    }
                    .transition(.opacity.combined(with: .move(edge: .top)))
                    
                    Divider()
                        .padding(.vertical)
                    
                    // Reviewed Toggle
                    Toggle(isOn: Binding(
                        get: { store.isReviewed(id: question.id) },
                        set: { _ in store.toggleReviewed(id: question.id) }
                    )) {
                        Text("Mark as Reviewed")
                            .font(.system(size: 20, weight: .semibold))
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)
                }
            }
            .padding(24)
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView {
        QuestionDetailView(question: InterviewQuestion(
            id: "test",
            category: "Tier 1",
            difficulty: "Advanced",
            question: "How do Swift actors actually prevent data races?",
            answer: "A normal class lets any thread call its methods...",
            interviewSentence: "Actors give me thread safety by construction...",
            codeExample: "actor BankAccount {\n    private var balance: Double = 0.0\n}"
        ))
        .environmentObject(QuestionStore())
    }
}
