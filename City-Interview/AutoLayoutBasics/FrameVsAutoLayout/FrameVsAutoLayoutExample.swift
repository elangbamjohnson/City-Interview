import UIKit

// MARK: - Frame vs Auto Layout
// 💡 INTERVIEW TALKING POINTS:
// • Frame-based layout defines absolute coordinates (x, y, width, height) relative to the superview's coordinate system.
//   - Why it breaks: Hardcoding frames means the UI won't adapt when the screen size changes (iPhone SE vs Pro Max), the device rotates, or features like Dynamic Type or Split View are used.
// • Auto Layout exists to solve this by describing relationships instead of absolutes.
//   - We define rules like "center this label" or "keep this view 20 points from the edge," allowing the layout engine to calculate the actual frames dynamically based on the current environment.

class FrameVsAutoLayoutExample: UIViewController {
    
    let frameLabel = UILabel()
    let autoLayoutLabel = UILabel()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        
        setupFrameLabel()
        setupAutoLayoutLabel()
    }
    
    // MARK: 1. Frame-based Layout (The old way)
    private func setupFrameLabel() {
        frameLabel.text = "Frame-based (Absolute)"
        frameLabel.backgroundColor = .systemRed
        view.addSubview(frameLabel)
        // Notice we don't set frames here because `view.bounds` might not be final yet.
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // We have to manually recalculate frames every time the view layout changes
        let labelWidth: CGFloat = 200
        let labelHeight: CGFloat = 50
        frameLabel.frame = CGRect(
            x: (view.bounds.width - labelWidth) / 2, // Manually calculating the center
            y: 100, // Hardcoded Y position
            width: labelWidth,
            height: labelHeight
        )
    }
    
    // MARK: 2. Auto Layout (The modern UIKit way)
    private func setupAutoLayoutLabel() {
        autoLayoutLabel.text = "Auto Layout (Relational)"
        autoLayoutLabel.backgroundColor = .systemBlue
        view.addSubview(autoLayoutLabel)
        
        // ⚠️ CRITICAL: Must be false to use Auto Layout programmatically
        autoLayoutLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Defining relationships: Center horizontally, and place 50pt below the frame label's assumed position
        NSLayoutConstraint.activate([
            autoLayoutLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            autoLayoutLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 120),
            autoLayoutLabel.widthAnchor.constraint(equalToConstant: 200),
            autoLayoutLabel.heightAnchor.constraint(equalToConstant: 50)
        ])
    }
}

// ==========================================
// 🎙️ Interview Q&A: Frame vs Auto Layout
// ==========================================
// • Q: Why do we prefer Auto Layout over setting frames?
//   A: Because Auto Layout uses rules (constraints) that automatically adapt to different screen sizes, orientations, and dynamic type, whereas frames are rigid and absolute.
// • Q: Where is the best place to set frames if you aren't using Auto Layout?
//   A: In `viewDidLayoutSubviews()` or `layoutSubviews()`, because that is when the view's own bounds are known and up-to-date.
// • Q: Does Auto Layout eventually set frames?
//   A: Yes, the Auto Layout engine ultimately calculates and sets the underlying `.frame` based on the constraints you provide.
