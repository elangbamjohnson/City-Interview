import UIKit

// MARK: - Anchors and Constraints
// 💡 INTERVIEW TALKING POINTS:
// • `translatesAutoresizingMaskIntoConstraints = false` is required because historically, UIKit auto-generated constraints based on a view's `autoresizingMask` and `frame`. If left as `true`, these auto-generated constraints will conflict with your manual Auto Layout constraints, causing unsatisfiable layout errors.
// • NSLayoutAnchor API is the modern, type-safe way to create constraints (e.g., you can't accidentally constrain a topAnchor to a widthAnchor, the compiler prevents it).

class AnchorsExample: UIViewController {
    
    let headerView = UIView()
    let label1 = UILabel()
    let label2 = UILabel()
    let label3 = UILabel()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        
        setupHeaderView()
        setupLabel()
    }
    
    private func setupLabel() {
        // Setup appearances
        label1.backgroundColor = .systemTeal
        label2.backgroundColor = .systemOrange
        label3.backgroundColor = .systemPink
        
        label1.text = "L1"
        label2.text = "L2"
        label3.text = "L3"
        
        // Add to subview and disable autoresizing mask
        [label1, label2, label3].forEach {
            $0.textAlignment = .center
            $0.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview($0)
        }
        
        let spacing: CGFloat = 10
        
        NSLayoutConstraint.activate([
            // Y-Axis: Pin all labels below the header view
            label1.topAnchor.constraint(equalTo: headerView.bottomAnchor, constant: 20),
            label2.topAnchor.constraint(equalTo: headerView.bottomAnchor, constant: 20),
            label3.topAnchor.constraint(equalTo: headerView.bottomAnchor, constant: 20),
            
            // Heights
            label1.heightAnchor.constraint(equalToConstant: 50),
            label2.heightAnchor.constraint(equalToConstant: 50),
            label3.heightAnchor.constraint(equalToConstant: 50),
            
            // X-Axis: Chain them together horizontally
            label1.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            label2.leadingAnchor.constraint(equalTo: label1.trailingAnchor, constant: spacing),
            label3.leadingAnchor.constraint(equalTo: label2.trailingAnchor, constant: spacing),
            
            // Pin the last one to the trailing edge of the superview
            label3.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            // ⭐️ Equal Widths: This forces them to perfectly distribute the available space
            label1.widthAnchor.constraint(equalTo: label2.widthAnchor),
            label2.widthAnchor.constraint(equalTo: label3.widthAnchor)
        ])
    }
    
    private func setupHeaderView() {
        headerView.backgroundColor = .systemGreen
        view.addSubview(headerView)
        
        // ⚠️ Mandatory step for programmatic Auto Layout
        headerView.translatesAutoresizingMaskIntoConstraints = false
        
        // Using NSLayoutAnchor API
        NSLayoutConstraint.activate([
            // Pin top to the safe area
            headerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
//            headerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            
            // Pin leading and trailing edges to the superview
            headerView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            
            // Note: Trailing and bottom constants often need to be negative to pull "inward"
            headerView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            // Set a fixed height
            headerView.heightAnchor.constraint(equalToConstant: 100)
        ])
    }
}

// ==========================================
// 🎙️ Interview Q&A: Anchors and Constraints
// ==========================================
// • Q: What happens if you forget to set `translatesAutoresizingMaskIntoConstraints = false`?
//   A: UIKit will convert the view's current frame into constraints, which will conflict with your manual constraints and print a massive "Unable to simultaneously satisfy constraints" warning in the console.
// • Q: What is the benefit of activating constraints in an array with `NSLayoutConstraint.activate(_:)`?
//   A: It is more performant than setting `isActive = true` on each constraint individually because the layout engine processes the entire batch of changes at once.
// • Q: Why do we constrain to the `safeAreaLayoutGuide` instead of the `topAnchor` of the view?
//   A: To prevent UI elements from overlapping with the notch, Dynamic Island, or status bar.
