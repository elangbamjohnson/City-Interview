import Foundation

struct InterviewQuestion: Codable, Identifiable {
    let id: String
    let category: String
    let difficulty: String
    let question: String
    let answer: String
    let interviewSentence: String?
    let codeExample: String?
    let imageName: String?
}

// MARK: - 🧩 Embedded Code Segment Parsing
// 💡 SENIOR INTERVIEW TALKING POINTS:
// • Separation of Concerns: Instead of treating rich explanations as unstructured monolithic text,
//   we parse markdown code fences (```swift ... ```) into strongly typed, identifiable view segments.
// • UX Polish: Code snippets are displayed with monospaced typography and horizontal scrolling,
//   ensuring code clarity while preserving prose formatting for explanatory sentences.

struct AnswerSegment: Identifiable {
    let id = UUID()
    let isCode: Bool
    let content: String
}

extension InterviewQuestion {
    /// Breaks down the answer string into alternating prose and monospaced code blocks
    var answerSegments: [AnswerSegment] {
        guard answer.contains("```") else {
            return [AnswerSegment(isCode: false, content: answer)]
        }
        var segments: [AnswerSegment] = []
        let parts = answer.components(separatedBy: "```")
        for (index, part) in parts.enumerated() {
            let trimmed = part.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { continue }
            if index % 2 == 1 {
                // Code block: strip optional language tag (e.g. swift, javascript, bash, etc.)
                var code = trimmed
                let knownLanguages = ["swift", "javascript", "bash", "js", "sh", "json"]
                for lang in knownLanguages {
                    if code.hasPrefix(lang + "\n") {
                        code = String(code.dropFirst(lang.count + 1))
                        break
                    } else if code.hasPrefix(lang + "\r\n") {
                        code = String(code.dropFirst(lang.count + 2))
                        break
                    } else if code.hasPrefix(lang + " ") {
                        code = String(code.dropFirst(lang.count + 1))
                        break
                    }
                }
                segments.append(AnswerSegment(isCode: true, content: code.trimmingCharacters(in: .whitespacesAndNewlines)))
            } else {
                segments.append(AnswerSegment(isCode: false, content: trimmed))
            }
        }
        return segments
    }
}

