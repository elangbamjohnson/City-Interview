import UIKit

// MARK: - Stack Views
// 💡 INTERVIEW TALKING POINTS:
// • Why Stack Views exist: UIStackView is a powerful abstraction that automatically generates and manages constraints for a row or column of views. It handles spacing, distribution, and alignment for you, drastically reducing the number of manual constraints you have to write.
// • When to drop down to manual constraints: 
//   - You still need manual constraints to position the Stack View itself relative to its superview.
//   - You avoid Stack Views for complex, overlapping, or highly non-linear layouts (e.g., a view that needs to span across multiple rows/columns arbitrarily) because stack views are strictly linear (horizontal or vertical).

class StackViewExample: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        
        setupStackView()
    }
    
    private func setupStackView() {
        // Create child views
        let view1 = createBox(color: .systemRed)
        let view2 = createBox(color: .systemBlue)
        let view3 = createBox(color: .systemYellow)
        
        // Initialize Stack View
        let stackView = UIStackView(arrangedSubviews: [view1, view2, view3])
        
        // Configure Stack View properties
        stackView.axis = .vertical
        stackView.spacing = 16
        stackView.distribution = .fillEqually // Make all subviews the same size
        stackView.alignment = .fill // Stretch subviews to fill the cross-axis width
        
        stackView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stackView)
        
        // We still need constraints to position the stack view in its parent
        NSLayoutConstraint.activate([
            stackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stackView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stackView.widthAnchor.constraint(equalToConstant: 250),
            stackView.heightAnchor.constraint(equalToConstant: 400)
        ])
    }
    
    private func createBox(color: UIColor) -> UIView {
        let box = UIView()
        box.backgroundColor = color
        // Note: We DO NOT set translatesAutoresizingMaskIntoConstraints = false here 
        // if the view is managed entirely by the stack view's layout, though doing so is fine.
        return box
    }
}

// ==========================================
// 🎙️ Interview Q&A: Stack Views
// ==========================================
// • Q: Does a UIStackView render its own background color?
//   A: Historically, no. It was a non-rendering layout container. However, since iOS 14, UIStackView can display a background color.
// • Q: What is the difference between `addArrangedSubview()` and `addSubview()`?
//   A: `addArrangedSubview()` tells the stack view to manage the view's layout using constraints. It implicitly calls `addSubview()`. Calling only `addSubview()` will add it to the view hierarchy but won't participate in the stack's automatic layout.
// • Q: How does a stack view handle a subview being hidden?
//   A: It automatically recalculates its layout to fill the gap left by the hidden view, making it great for dynamic forms.
