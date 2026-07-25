import Foundation

struct InterviewQuestion: Codable, Identifiable {
    let id: String
    let category: String
    let difficulty: String
    let question: String
    let answer: String
    let interviewSentence: String?
    let codeExample: String?
}
