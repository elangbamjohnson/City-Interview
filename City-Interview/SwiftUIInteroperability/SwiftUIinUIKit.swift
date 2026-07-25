import UIKit
import SwiftUI

// MARK: - 🟢 SwiftUI in UIKit Example

// ==========================================
// 💡 INTERVIEW POINT: Using UIHostingController
// ==========================================
// When you are migrating an older app to SwiftUI, you often need to place
// a new SwiftUI view inside an existing UIKit View Controller.
// You do this using `UIHostingController`.

// 1. A simple SwiftUI View
struct ModernSwiftUIView: View {
    var title: String
    
    var body: some View {
        VStack {
            Text(title)
                .font(.largeTitle)
                .fontWeight(.bold)
            Text("This is a SwiftUI View hosted inside UIKit!")
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.1))
        .cornerRadius(12)
    }
}


// 2. The Legacy UIKit View Controller
class LegacyViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        
        setupSwiftUIView()
    }
    
    private func setupSwiftUIView() {
        // 💡 INTERVIEW POINT: UIHostingController bridges the gap.
        // It acts as a standard UIViewController but its `view` is the SwiftUI view.
        let swiftUIView = ModernSwiftUIView(title: "Hello from UIKit!")
        let hostingController = UIHostingController(rootView: swiftUIView)
        
        // 1. Add as a child View Controller (Standard UIKit container pattern)
        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.didMove(toParent: self)
        
        // 2. Setup Constraints
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            hostingController.view.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            hostingController.view.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            hostingController.view.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 20),
            hostingController.view.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -20)
        ])
    }
}
