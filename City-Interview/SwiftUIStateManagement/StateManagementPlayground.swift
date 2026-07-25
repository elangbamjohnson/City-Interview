import SwiftUI
import Combine

// MARK: - 🔄 SwiftUI State Management Examples

// ==========================================
// 1. @State and @Binding (Value Types)
// ==========================================

struct ParentView: View {
    // 💡 INTERVIEW POINT: SwiftUI views are ephemeral structs (recreated constantly).
    // @State tells SwiftUI to allocate storage for this value outside the struct's lifecycle.
    // 🟢 @State: Owned by this View. Always mark it as `private` to enforce encapsulation.
    @State private var isLightOn: Bool = false
    
    var body: some View {
        VStack {
            Text(isLightOn ? "Light is ON 💡" : "Light is OFF 🌑")
            
            // Pass the state to the child view using the $ prefix (creates a Binding)
            ChildToggleView(isOn: $isLightOn)
        }
    }
}

struct ChildToggleView: View {
    // 💡 INTERVIEW POINT: @Binding provides read/write access to a source of truth 
    // owned by another view. It does NOT allocate its own memory for the data.
    // 🟢 @Binding: Requires a $ prefix when passed in (e.g., $isLightOn).
    @Binding var isOn: Bool
    
    var body: some View {
        Toggle("Switch Light", isOn: $isOn)
            .padding()
    }
}


// ==========================================
// 2. @StateObject and @ObservedObject (Reference Types)
// ==========================================

// The class must conform to ObservableObject
class CounterViewModel: ObservableObject {
    // @Published tells SwiftUI to re-render any view observing this class when it changes
    @Published var count: Int = 0
}

struct CounterParentView: View {
    // 💡 INTERVIEW POINT: "What is the difference between @StateObject and @ObservedObject?"
    // - Use @StateObject when the view CREATES the instance. SwiftUI keeps it alive 
    //   across re-renders.
    // - If you used @ObservedObject here, the ViewModel would be destroyed and recreated 
    //   every time CounterParentView re-renders (leading to data loss!).
    // 🟢 @StateObject: Owns the lifecycle of the reference type.
    @StateObject private var viewModel = CounterViewModel()
    
    var body: some View {
        VStack {
            Text("Parent Count: \(viewModel.count)")
            Button("Increment") { viewModel.count += 1 }
            
            // Pass the instance to the child view
            CounterChildView(viewModel: viewModel)
        }
    }
}

struct CounterChildView: View {
    // 💡 INTERVIEW POINT: 
    // - Use @ObservedObject when the instance is passed in from a parent view.
    // - The child view OBSERVING the object does not control its lifecycle.
    // 🟢 @ObservedObject: Does not own the object, only reacts to @Published changes.
    @ObservedObject var viewModel: CounterViewModel
    
    var body: some View {
        Button("Child Increment") {
            viewModel.count += 2
        }
    }
}


// ==========================================
// 3. @EnvironmentObject (Global / Shared State)
// ==========================================

class UserSettings: ObservableObject {
    @Published var username: String = "Guest"
}

struct RootAppView: View {
    // Create the global state
    @StateObject private var settings = UserSettings()
    
    var body: some View {
        DeeplyNestedView()
            // 🟢 Inject into the environment. 
            // All child views (no matter how deep) can now access it.
            .environmentObject(settings)
    }
}

struct DeeplyNestedView: View {
    // 💡 INTERVIEW POINT: 
    // - Why use @EnvironmentObject instead of a Singleton (e.g. UserSettings.shared)?
    //   Answer: @EnvironmentObject acts as Dependency Injection. It makes the view 
    //   testable (you can inject a mock environment) and SwiftUI handles the UI updates automatically.
    // ⚠️ CRASH WARNING: If the object is NOT injected in an ancestor view using 
    //   `.environmentObject()`, accessing this property will crash the app instantly.
    // 🟢 @EnvironmentObject: Extracts the object from the global environment tree.
    @EnvironmentObject var settings: UserSettings
    
    var body: some View {
        VStack {
            Text("Hello, \(settings.username)")
            Button("Login") {
                settings.username = "Johnson"
            }
        }
    }
}


// ==========================================
// 4. @AppStorage (UserDefaults)
// ==========================================

struct AppStorageExampleView: View {
    // 🟢 @AppStorage: Reads/writes directly to UserDefaults.
    // The view automatically updates when this changes.
    @AppStorage("isDarkModeEnabled") private var isDarkMode: Bool = false
    
    var body: some View {
        Toggle("Enable Dark Mode", isOn: $isDarkMode)
    }
}

// MARK: - Preview
struct StateManagementPlayground_Previews: PreviewProvider {
    static var previews: some View {
        ParentView()
    }
}
