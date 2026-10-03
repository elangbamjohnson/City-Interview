import Foundation
import SwiftUI
import Combine
class QuestionStore: ObservableObject {
    @Published var questions: [InterviewQuestion] = []
    
    @Published var reviewedQuestionIDs: Set<String> = [] {
        didSet {
            if let encoded = try? JSONEncoder().encode(reviewedQuestionIDs) {
                UserDefaults.standard.set(encoded, forKey: "reviewedQuestions")
            }
        }
    }
    
    init() {
        if let data = UserDefaults.standard.data(forKey: "reviewedQuestions"),
           let decoded = try? JSONDecoder().decode(Set<String>.self, from: data) {
            self.reviewedQuestionIDs = decoded
        }
        loadQuestions()
    }
    
    func loadQuestions() {
        questions = load("questions.json")
    }
    
    // MARK: - 📚 Dynamic Category Projection
    // 💡 SENIOR INTERVIEW TALKING POINTS:
    // Dynamically extracting distinct categories preserves single-source-of-truth (SSOT)
    // from questions.json and eliminates silent desynchronization when questions or topics are added.
    var categories: [String] {
        var seen = Set<String>()
        var result: [String] = []
        for q in questions {
            if !seen.contains(q.category) {
                seen.insert(q.category)
                result.append(q.category)
            }
        }
        return result
    }
    
    func questions(for category: String) -> [InterviewQuestion] {
        questions.filter { $0.category == category }
    }
    
    func isReviewed(id: String) -> Bool {
        reviewedQuestionIDs.contains(id)
    }
    
    func toggleReviewed(id: String) {
        var ids = reviewedQuestionIDs
        if ids.contains(id) {
            ids.remove(id)
        } else {
            ids.insert(id)
        }
        reviewedQuestionIDs = ids
    }
    
    func progress(for category: String) -> (reviewed: Int, total: Int) {
        let categoryQuestions = questions(for: category)
        let reviewedCount = categoryQuestions.filter { isReviewed(id: $0.id) }.count
        return (reviewedCount, categoryQuestions.count)
    }
}
