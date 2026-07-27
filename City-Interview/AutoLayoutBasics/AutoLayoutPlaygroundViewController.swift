import UIKit

// MARK: - Auto Layout Playground
// 💡 INTERVIEW TALKING POINTS:
// • This is a simple TableViewController acting as a navigation menu to demonstrate the various Auto Layout topics we've implemented.
// • By wrapping our examples in a UINavigationController, we can push them onto the stack, giving us a free "Back" button to return to this menu.

class AutoLayoutPlaygroundViewController: UITableViewController {
    
    // The list of topics and their corresponding View Controllers
    private let topics: [(title: String, subtitle: String, vcType: UIViewController.Type)] = [
        ("Frame vs Auto Layout", "Why frames break & how constraints fix it", FrameVsAutoLayoutExample.self),
        ("Anchors & Constraints", "Modern NSLayoutAnchor API", AnchorsExample.self),
        ("Stack Views", "Automatic constraint generation", StackViewExample.self),
        ("Hugging & Compression", "Resolving layout conflicts (Priorities)", HuggingCompressionExample.self),
        ("Dynamic Constraint Updates", "Animating .constant safely", DynamicConstraintExample.self)
    ]
    
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Auto Layout Basics"
        view.backgroundColor = .systemBackground
        
        // Use a subtitle cell style for a bit more detail
        tableView.register(SubtitleCell.self, forCellReuseIdentifier: "TopicCell")
    }
    
    // MARK: - Table view data source
    
    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return topics.count
    }
    
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "TopicCell", for: indexPath)
        let topic = topics[indexPath.row]
        
        cell.textLabel?.text = topic.title
        cell.textLabel?.font = .preferredFont(forTextStyle: .headline)
        
        cell.detailTextLabel?.text = topic.subtitle
        cell.detailTextLabel?.textColor = .secondaryLabel
        
        cell.accessoryType = .disclosureIndicator
        return cell
    }
    
    // MARK: - Table view delegate
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        let vcType = topics[indexPath.row].vcType
        let vc = vcType.init()
        vc.title = topics[indexPath.row].title
        
        // Push if embedded in a navigation controller, otherwise present as a modal
        if let nav = navigationController {
            nav.pushViewController(vc, animated: true)
        } else {
            let nav = UINavigationController(rootViewController: vc)
            present(nav, animated: true)
        }
    }
}

// Helper class to quickly get a UITableViewCell with a subtitle style programmatically
class SubtitleCell: UITableViewCell {
    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: .subtitle, reuseIdentifier: reuseIdentifier)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

// MARK: - SwiftUI Interoperability Wrapper
import SwiftUI

struct AutoLayoutPlaygroundRepresentable: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> AutoLayoutPlaygroundViewController {
        return AutoLayoutPlaygroundViewController()
    }
    
    func updateUIViewController(_ uiViewController: AutoLayoutPlaygroundViewController, context: Context) {}
}
