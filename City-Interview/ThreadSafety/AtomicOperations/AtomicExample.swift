import Foundation

// MARK: - ⚛️ Atomic Operations
//
// 💡 INTERVIEW TALKING POINTS:
// • What is "Atomic"? An indivisible operation. It happens entirely or not at all. No other thread can see a "partial" state in the middle of the operation.
// • Swift's Limitation: Unlike C++ or Java, standard Swift does NOT have built-in Atomic types (though `swift-atomics` exists as an external package). 
// • Atomics vs Locks: Locks block threads (put them to sleep). Atomics usually use specialized CPU instructions (like Compare-And-Swap) that don't sleep, making them incredibly fast for tiny operations (like integer increments).

// ==========================================
// Creating a Custom @Atomic Property Wrapper
// ==========================================
// Since OSAtomic is deprecated and we don't have swift-atomics, we simulate an atomic property using a highly optimized os_unfair_lock under the hood.

@propertyWrapper
struct Atomic<Value> {
    private var value: Value
    private let lock = NSLock() // Or os_unfair_lock for extreme performance
    
    init(wrappedValue: Value) {
        self.value = wrappedValue
    }
    
    var wrappedValue: Value {
        get {
            lock.lock()
            defer { lock.unlock() }
            return value
        }
        set {
            lock.lock()
            defer { lock.unlock() }
            value = newValue
        }
    }
    
    // We need a custom mutating method for read-modify-write!
    // `count += 1` with a property wrapper actually calls `get` then `set`, 
    // which breaks atomicity because the lock releases in between!
    mutating func mutate(_ transform: (inout Value) -> Void) {
        lock.lock()
        defer { lock.unlock() }
        transform(&value)
    }
}

class AtomicCounter {
    // Elegant usage syntax!
    @Atomic var count: Int = 0
    
    func increment() {
        // count += 1 // ⚠️ UNSAFE: calls getter (lock/unlock) then setter (lock/unlock)
        
        // ✅ SAFE: locks once, modifies, unlocks
        _count.mutate { $0 += 1 } 
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why is a Property Wrapper `count += 1` not inherently thread-safe even if `get` and `set` are locked?
//   A: Because `+=` is a Read-Modify-Write operation. The getter locks and unlocks to return the value. A second thread can swoop in before the setter locks and unlocks. You need a dedicated `mutate` function that holds the lock the entire time.
// • Q: How does Compare-And-Swap (CAS) work in true CPU Atomics?
//   A: The CPU reads a value, modifies it locally, and attempts to write it back. If the original memory value changed while the CPU was doing math, the write fails and the CPU retries immediately.
// • Q: When should you use Atomics over Locks?
//   A: Atomics are strictly for simple state changes (flags, counters, single pointers). For protecting entire critical sections (like updating a dictionary and an array together), use Locks.
