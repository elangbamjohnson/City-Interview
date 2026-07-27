// MARK: - Auto Layout Basics Comparison Notes

// ==========================================
// 🏗️ Layout Systems Comparison
// ==========================================
// • Frame-based Layout: "Put this view exactly at x:10, y:20 with a width of 100 and height of 50." (Absolute, inflexible).
// • Auto Layout (UIKit): "Keep this view centered, 20 points away from the edges." (Relational, rule-based, solves for frames using a linear equation solver).
// • SwiftUI Layout: "I propose a size to my child, the child chooses its own size, and then I place the child in my coordinate space." (Declarative, state-driven, layout by negotiation).

// ==========================================
// 🐞 Common Auto Layout Bugs & Warnings
// ==========================================
// 1. Ambiguous Layout
//   • What it is: The layout engine doesn't have enough constraints to figure out exactly where the view should go or how big it should be. E.g., setting an X and Y position, but forgetting width and height.
//   • The fix: Provide missing constraints or set intrinsic content size priorities.
//
// 2. Unsatisfiable Constraints (The massive red/yellow console warning)
//   • What it is: You gave the layout engine conflicting rules that cannot mathematically both be true. E.g., View width = 100 AND View width = 200. 
//   • Most common cause: Forgetting to set `translatesAutoresizingMaskIntoConstraints = false`, causing auto-generated frames to conflict with your manual constraints.
//   • The fix: Lower the priority of one constraint (e.g., to 999) to break the tie, or fix the conflicting logic.
//
// 3. Debugging Tools for Interviews:
//   • View Debugger: Xcode's 3D hierarchy explorer. Great for seeing if a view is physically there but has a 0x0 frame.
//   • `_autolayoutTrace`: A private LLDB command to print the entire constraint tree.
//   • `hasAmbiguousLayout`: A boolean property you can check in the debugger.
//   • `constraintsAffectingLayout(for: .horizontal)`: A helpful method to print exactly which constraints are fighting each other for a specific axis.
