# Auto Layout Basics — Interview Talking Points

### 🏗️ Core Concepts (The "Why")
*   **Relational vs. Absolute:** Frame-based layout uses rigid coordinates (x, y, w, h). Auto Layout uses *relationships* (e.g., "center this," "pin to bottom"). This allows UIs to adapt to screen sizes, rotations, and Dynamic Type.
*   **Intrinsic Content Size:** The natural size a view *wants* to be. A `UILabel` knows its size based on its text. A `UIView` does not.
*   **TranslatesAutoresizingMaskIntoConstraints:** MUST be set to `false` when doing programmatic Auto Layout. If true, UIKit converts the view's frame into constraints, which instantly conflict with your manual constraints.
*   **Content Hugging Priority:** Prevents a view from being stretched larger than its intrinsic size. (Higher priority = tighter hug).
*   **Compression Resistance Priority:** Prevents a view from being squished smaller than its intrinsic size. (Higher priority = refuses to truncate).
*   **Stack Views:** An abstraction layer over Auto Layout. `UIStackView` generates and manages constraints for rows/columns automatically.
*   **Constraint Animation:** To animate, you update an existing constraint's `.constant` property, then call `layoutIfNeeded()` inside a `UIView.animate` block.

### 🎙️ Common Interview Questions
*   **Q: Why do we prefer Auto Layout over Frames?**
    *   *A: Frames are rigid. Auto Layout adapts dynamically to different screen sizes, orientations, and accessibility settings like Dynamic Type.*
*   **Q: What happens if you forget `translatesAutoresizingMaskIntoConstraints = false`?**
    *   *A: The system generates constraints based on the view's frame, causing massive "Unsatisfiable Constraints" conflicts with your custom layout code.*
*   **Q: How do you animate an Auto Layout change?**
    *   *A: Update the constraint's `.constant` property, then call `self.view.layoutIfNeeded()` inside an animation block to interpolate the new frames smoothly.*
*   **Q: Two labels are side-by-side, but one is truncating. How do you fix it?**
    *   *A: Increase the Content Compression Resistance Priority of the label that should never be truncated.*
*   **Q: What is Ambiguous Layout vs. Unsatisfiable Constraints?**
    *   *A: Ambiguous means missing rules (engine doesn't know where to put it). Unsatisfiable means conflicting rules (engine mathematically can't satisfy both).*
*   **Q: What's the difference between `setNeedsLayout()` and `layoutIfNeeded()`?**
    *   *A: `setNeedsLayout()` schedules an asynchronous update for the next draw cycle. `layoutIfNeeded()` forces an immediate, synchronous layout update.*

### ✅ Quick Self-Check
*   [ ] Can you explain why `translatesAutoresizingMaskIntoConstraints` exists?
*   [ ] Do you know the difference between Hugging and Compression Resistance?
*   [ ] Can you write a basic NSLayoutAnchor block from memory?
*   [ ] Do you know how to safely animate a constraint's `.constant`?
