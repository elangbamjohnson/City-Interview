import UIKit

// MARK: - Dynamic Constraint Updates
// 💡 INTERVIEW TALKING POINTS:
// • Why not create new constraints? To animate a view's size or position, you DO NOT deactivate constraints and create brand new ones. Instead, you keep a reference to the existing constraint and simply update its `.constant` property.
// • How animation works: Updating the constant just sets the new target value. To animate it, you must tell the layout engine to recalculate and apply the frames inside a `UIView.animate` block by calling `layoutIfNeeded()`. This forces the view to immediately lay out its subviews with the new constraint values, interpolating the frame changes smoothly.

class DynamicConstraintExample: UIViewController {
    
    let animatedView = UIView()
    // 🛡️ Keep a reference to the constraint we want to change
    var heightConstraint: NSLayoutConstraint!
    var isExpanded = false
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        setupView()
        
        // Add a tap gesture to trigger the animation
        let tap = UITapGestureRecognizer(target: self, action: #selector(toggleHeight))
        view.addGestureRecognizer(tap)
    }
    
    private func setupView() {
        animatedView.backgroundColor = .systemPurple
        animatedView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(animatedView)
        
        // Create the height constraint and store it
        heightConstraint = animatedView.heightAnchor.constraint(equalToConstant: 100)
        
        NSLayoutConstraint.activate([
            animatedView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            animatedView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            animatedView.widthAnchor.constraint(equalToConstant: 200),
            heightConstraint // Activate our stored constraint
        ])
    }
    
    @objc private func toggleHeight() {
        isExpanded.toggle()
        
        // 1. Update the constraint's constant (this alone does not animate)
        heightConstraint.constant = isExpanded ? 300 : 100
        
        // 2. Animate the layout change
        UIView.animate(withDuration: 0.5, delay: 0, usingSpringWithDamping: 0.7, initialSpringVelocity: 0.5, options: .curveEaseInOut) {
            // Force the layout engine to apply the new constraint constant immediately, inside the animation block
            self.view.layoutIfNeeded()
        }
    }
}

// ==========================================
// 🎙️ Interview Q&A: Dynamic Constraints
// ==========================================
// • Q: What is the difference between `setNeedsLayout()` and `layoutIfNeeded()`?
//   A: `setNeedsLayout()` marks the view as needing an update but waits for the next drawing cycle (asynchronous). `layoutIfNeeded()` forces an immediate, synchronous recalculation of the layout, which is why it is used inside animation blocks.
// • Q: Why do we call `layoutIfNeeded()` on `self.view` instead of `animatedView`?
//   A: Layout changes often affect the entire view hierarchy. Calling it on the parent view ensures all sibling and child views involved in the constraint update recalculate correctly.
// • Q: Can you animate changing the multiplier of a constraint?
//   A: No. The `.constant` property is mutable, but `.multiplier` is read-only. To change a multiplier, you must deactivate the old constraint and create a new one.
