import SwiftUI
import UIKit

// MARK: - 🍎 UIKit in SwiftUI Examples

// ==========================================
// 1. UIViewRepresentable (Simple View)
// ==========================================
// 💡 INTERVIEW POINT: Embedding a simple UIKit component that doesn't need delegates.

struct CustomActivityIndicator: UIViewRepresentable {
    // 🟢 SwiftUI state passed in to control the UIKit view
    let isAnimating: Bool
    
    // 1. Called ONCE when SwiftUI creates the view.
    func makeUIView(context: Context) -> UIActivityIndicatorView {
        let indicator = UIActivityIndicatorView(style: .large)
        indicator.color = .blue
        return indicator
    }
    
    // 2. Called EVERY TIME the SwiftUI state (`isAnimating`) changes.
    func updateUIView(_ uiView: UIActivityIndicatorView, context: Context) {
        if isAnimating {
            uiView.startAnimating()
        } else {
            uiView.stopAnimating()
        }
    }
}


// ==========================================
// 2. UIViewControllerRepresentable + Coordinator
// ==========================================
// 💡 INTERVIEW POINT: How to handle UIKit Delegates (like UIImagePickerControllerDelegate).
// A Coordinator is required because structs cannot safely act as Objective-C delegates.

struct ImagePickerView: UIViewControllerRepresentable {
    // 🟢 The state we want to update in SwiftUI when the UIKit delegate fires
    @Binding var selectedImage: UIImage?
    @Environment(\.presentationMode) var presentationMode
    
    // 1. Create the Coordinator. SwiftUI manages its memory lifecycle.
    func makeCoordinator() -> Coordinator {
        return Coordinator(parent: self)
    }
    
    // 2. Create the View Controller
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        // 💡 INTERVIEW POINT: We assign the Coordinator as the delegate!
        picker.delegate = context.coordinator
        return picker
    }
    
    // 3. Update (Not strictly needed for a simple picker)
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    // ==========================================
    // 🔗 The Coordinator (Bridge Class)
    // ==========================================
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePickerView
        
        init(parent: ImagePickerView) {
            self.parent = parent
        }
        
        // UIKit Delegate Method Fires
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                // Update the SwiftUI @Binding!
                parent.selectedImage = image
            }
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}


// MARK: - Usage Playground
struct InteroperabilityPlaygroundView: View {
    @State private var isLoading = false
    @State private var showPicker = false
    @State private var image: UIImage?
    
    var body: some View {
        VStack(spacing: 40) {
            
            // 1. Using the UIViewRepresentable
            CustomActivityIndicator(isAnimating: isLoading)
            Button(isLoading ? "Stop" : "Start") { isLoading.toggle() }
            
            // 2. Using the UIViewControllerRepresentable
            Button("Pick Image") { showPicker = true }
                .sheet(isPresented: $showPicker) {
                    ImagePickerView(selectedImage: $image)
                }
            
            if let img = image {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 150)
            }
        }
    }
}
