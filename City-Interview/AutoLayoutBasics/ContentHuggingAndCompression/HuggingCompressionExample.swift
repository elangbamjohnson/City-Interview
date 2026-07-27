import UIKit

// MARK: - Content Hugging and Compression Resistance
// 💡 INTERVIEW TALKING POINTS:
// • Content Hugging Priority: "How much does this view resist being made BIGGER than its intrinsic size?" 
//   - A higher hugging priority means the view wants to stay tight/small and hug its content.
// • Content Compression Resistance Priority: "How much does this view resist being made SMALLER than its intrinsic size?"
//   - A higher compression resistance priority means the view refuses to be squished or truncated.
// • Why it matters: When two flexible views (like UILabels) are in a row (e.g., in an HStack) and compete for space, the layout engine needs to know which one should stretch if there is extra space (lowest hugging priority stretches), and which one should truncate if there isn't enough space (lowest compression resistance gets truncated).

class HuggingCompressionExample: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        
        setupHuggingAndCompression()
    }
    
    private func setupHuggingAndCompression() {
        let titleLabel = UILabel()
        titleLabel.text = "Username:"
        titleLabel.backgroundColor = .systemGray5
        
        let valueLabel = UILabel()
        valueLabel.text = "very_long_username_that_might_not_fit_on_screen"
        valueLabel.backgroundColor = .systemYellow
        
        let stackView = UIStackView(arrangedSubviews: [titleLabel, valueLabel])
        stackView.axis = .horizontal
        stackView.spacing = 8
        stackView.alignment = .fill
        stackView.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(stackView)
        
        NSLayoutConstraint.activate([
            stackView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stackView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            stackView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20)
        ])
        
        // ---------------------------------------------------
        // 🛠️ Managing the conflict
        // ---------------------------------------------------
        
        // 1. Content Hugging: If the screen is super wide, who gets the extra space?
        // We want 'titleLabel' to hug its content ("Username:"), and 'valueLabel' to stretch and fill the rest of the row.
        // Therefore, 'titleLabel' gets a HIGHER hugging priority (it resists stretching).
        titleLabel.setContentHuggingPriority(.defaultHigh, for: .horizontal)
        valueLabel.setContentHuggingPriority(.defaultLow, for: .horizontal)
        
        // 2. Compression Resistance: If the screen is too narrow, who gets squished?
        // We want 'titleLabel' to NEVER truncate, we need to always read "Username:". 
        // We are okay with 'valueLabel' truncating with an ellipsis ("very_long...").
        // Therefore, 'titleLabel' gets a HIGHER compression resistance priority (it refuses to shrink).
        titleLabel.setContentCompressionResistancePriority(.required, for: .horizontal)
        valueLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
    }
}

// ==========================================
// 🎙️ Interview Q&A: Hugging & Compression
// ==========================================
// • Q: What is an Intrinsic Content Size?
//   A: It is the natural size a view wants to be based on its content. A `UILabel` knows its intrinsic size based on its text and font. A blank `UIView` has no intrinsic content size.
// • Q: If two labels are side-by-side with identical hugging priorities and there is extra horizontal space, what happens?
//   A: Auto Layout gets confused. It throws an ambiguous layout warning because it doesn't know which label to stretch. You must explicitly break the tie by raising the hugging priority of one of them.
// • Q: How do you remember which is which?
//   A: Hugging prevents stretching (it "hugs" itself tight). Compression Resistance prevents squishing (it "resists" compression).
