import Foundation

// MARK: - 💉 Dependency Injection Examples

// A simple Protocol representing a dependency
protocol DataService {
    func fetchData() -> String
}

// A concrete implementation for Production
class APIDataService: DataService {
    func fetchData() -> String { return "Data from real API" }
}

// A concrete implementation for Unit Testing
class MockDataService: DataService {
    func fetchData() -> String { return "Mock Data for Tests" }
}

// ==========================================
// ❌ The BAD Approach (Tight Coupling)
// ==========================================
class TightCoupledViewModel {
    // ❌ Hardcoded dependency! 
    // We cannot change this to MockDataService for unit testing.
    private let dataService = APIDataService() 
    
    func load() {
        print(dataService.fetchData())
    }
}


// ==========================================
// ✅ 1. Initializer Injection (Most Preferred)
// ==========================================
class InitInjectionViewModel {
    // It's a `let` and depends on the Protocol (Dependency Inversion).
    private let dataService: DataService
    
    // ✅ Dependency is injected when the object is created.
    // Guaranteed to be available and safe.
    init(dataService: DataService) {
        self.dataService = dataService
    }
    
    func load() {
        print("Init Injection: \(dataService.fetchData())")
    }
}


// ==========================================
// ✅ 2. Property Injection
// ==========================================
class PropertyInjectionViewModel {
    // Has to be a `var` and usually an Optional or forced unwrapped.
    // Often used in older UIKit apps with Storyboards where you don't control `init`.
    var dataService: DataService?
    
    func load() {
        // Must safely unwrap before using
        guard let service = dataService else { return }
        print("Property Injection: \(service.fetchData())")
    }
}


// ==========================================
// ✅ 3. Method Injection
// ==========================================
class MethodInjectionViewModel {
    
    // Dependency is NOT stored in the class.
    // ✅ It is passed directly into the specific function that needs it.
    func load(using service: DataService) {
        print("Method Injection: \(service.fetchData())")
    }
}


// ==========================================
// 🧪 How it shines in Unit Testing / Usage
// ==========================================
func demonstrateDependencyInjection() {
    
    // Usage in App (Production)
    let productionService = APIDataService()
    let appViewModel = InitInjectionViewModel(dataService: productionService)
    appViewModel.load()
    
    // Usage in Tests (Mocking)
    let mockService = MockDataService()
    let testViewModel = InitInjectionViewModel(dataService: mockService)
    testViewModel.load() // Instantly testable without hitting the network!
}
