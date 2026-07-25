import Foundation

// MARK: - 🧱 SOLID Principles Examples

// ==========================================
// 1. Single Responsibility Principle (SRP)
// ==========================================
// BAD: One class doing everything (Network + Persistence)
class BadUserManager {
    func fetchUsers() { /* ... */ }
    func saveUsersToDatabase() { /* ... */ }
}

// GOOD: Separated responsibilities
class APIFetcher {
    func fetchUsers() { /* ... */ }
}
class DatabaseManager {
    func saveUsers() { /* ... */ }
}


// ==========================================
// 2. Open/Closed Principle (OCP)
// ==========================================
// BAD: If we want to add a new shape (e.g. Triangle), we have to modify the AreaCalculator.
class Rectangle { let w = 1.0; let h = 1.0 }
class Circle { let r = 1.0 }
class BadAreaCalculator {
    func area(shape: Any) -> Double {
        if let rect = shape as? Rectangle { return rect.w * rect.h }
        if let circle = shape as? Circle { return 3.14 * circle.r * circle.r }
        return 0
    }
}

// GOOD: Closed for modification (AreaCalculator doesn't change), Open for extension (we can add Triangle later).
protocol Shape {
    func calculateArea() -> Double
}
class GoodRectangle: Shape {
    let w = 1.0; let h = 1.0
    func calculateArea() -> Double { return w * h }
}
class GoodCircle: Shape {
    let r = 1.0
    func calculateArea() -> Double { return 3.14 * r * r }
}
class GoodAreaCalculator {
    func area(shape: Shape) -> Double {
        return shape.calculateArea()
    }
}


// ==========================================
// 3. Liskov Substitution Principle (LSP)
// ==========================================
// BAD: Ostrich is a Bird, but it crashes if you tell it to fly.
class Bird {
    func fly() { print("Flying") }
}
class Ostrich: Bird {
    override func fly() { fatalError("Ostriches can't fly!") }
}

// GOOD: Subclasses/types accurately represent their capabilities via Protocols.
protocol BirdType {}
protocol FlyingBird: BirdType {
    func fly()
}
class Eagle: FlyingBird {
    func fly() { print("Eagle flying") }
}
class Penguin: BirdType {
    func swim() { print("Penguin swimming") }
}


// ==========================================
// 4. Interface Segregation Principle (ISP)
// ==========================================
// BAD: A Robot is forced to implement eat(), which it doesn't need.
protocol BadWorker {
    func work()
    func eat()
}
class BadRobot: BadWorker {
    func work() { print("Working") }
    func eat() { fatalError("Robots don't eat") }
}

// GOOD: Split into specific interfaces.
protocol Workable {
    func work()
}
protocol Feedable {
    func eat()
}
class GoodHuman: Workable, Feedable {
    func work() { print("Working") }
    func eat() { print("Eating") }
}
class GoodRobot: Workable {
    func work() { print("Working") }
}


// ==========================================
// 5. Dependency Inversion Principle (DIP)
// ==========================================
// BAD: High-level class (ViewModel) depends directly on low-level class (NetworkManager).
class NetworkManager {
    func fetchData() {}
}
class BadViewModel {
    let networkManager = NetworkManager() // Hardcoded dependency! Cannot be mocked for testing.
}

// GOOD: Both depend on an abstraction (Protocol).
protocol Fetchable {
    func fetchData()
}
class APIFetchManager: Fetchable {
    func fetchData() { print("Fetching from API") }
}
class MockFetchManager: Fetchable {
    func fetchData() { print("Fetching mock data for tests") }
}

class GoodViewModel {
    let fetcher: Fetchable // Depends on protocol
    
    // Injected via initializer
    init(fetcher: Fetchable) {
        self.fetcher = fetcher
    }
}
