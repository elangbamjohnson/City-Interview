# Composable UI Decomposition — Interview Talking Points

A rehearsal sheet for "How do you break down a complex screen into reusable components?" style questions. Comes up both as a coding exercise (build/refactor a screen) and as a design-thinking discussion. Practice saying this out loud.

## 1. Open with the framing (10 seconds)
> "I try to design components the same way I'd design functions — single responsibility, minimal input surface, and no knowledge of where they're used. If I can't describe what a view does in one sentence, it's probably doing too much and should be split."

## 2. How to spot a screen that needs decomposing
- The `body` is long enough that you have to scroll to see the whole thing.
- You find yourself duplicating the same chunk of UI (a badge, a card, a rating stars row) across multiple screens by copy-pasting.
- Xcode Previews take a long time to compile/update for that one screen.
- Two people keep merge-conflicting on the same View file.
- You can't unit test or preview a piece of UI without spinning up the entire screen and its full data model.

**Say this rule of thumb out loud if asked:**
> "If it has a name I'd say in a design review — the rating badge, the price tag, the empty state — it should probably be its own View."

## 3. How to decide component boundaries
Two lenses, mention both:

- **Data-driven boundary:** does this chunk of UI need a different/smaller slice of data than the parent? If a subview only needs a `Double` rating, not the whole `Product`, that's a signal it should be extracted with its own minimal `init`.
- **Visual-driven boundary:** is this a self-contained visual unit that could be reused in a different context (a card, a badge, a button style)? If yes, extract it even if it doesn't reduce the data it needs.

> "I lean toward passing primitives or small value types into components rather than a full domain model — it's what makes a `RatingView` reusable for a product, a driver, or a restaurant, instead of being locked to one screen's model."

## 4. Composition tools to mention

| Tool | What it's for |
|---|---|
| `@ViewBuilder` | Lets a parent view slot in child content without knowing its internals — the backbone of composition in SwiftUI. |
| Custom `ViewModifier` | Centralizes repeated styling (e.g. `.cardStyle()`) so every card looks consistent from one source of truth. |
| Generic views | A `Card<Content: View>` wrapper that takes any content — useful for consistent container styling across very different content types. |
| `PreferenceKey` | For child-to-parent communication when composition alone isn't enough (e.g. a child reporting its size up to a parent). |

## 5. Preview-driven development — why it matters here
> "I build and test components in isolation using `#Preview`, with multiple preview blocks per component showing edge cases — empty state, long text truncation, dark mode, max values. It catches bugs before the component ever gets wired into a real screen, and it's effectively a lightweight visual test suite that doubles as living documentation."

## 6. Connecting this to design systems at scale (senior-level angle)
- At scale, this pattern turns into a **shared component library** — a separate SPM module (e.g. `DesignSystem`) that every feature module depends on, so a button or card looks the same everywhere without copy-pasting.
- Componentization + modular architecture go hand in hand: composable UI components are usually what you put inside a `FeatureModule`'s public Views, keeping the internal composition private and exposing only the finished screen or a few reusable pieces.
- Mention: some teams version their design system independently and treat it like any other internal package, with its own changelog and owners.

## 7. A strong closing line if asked to summarize your approach
> "I default to small, data-minimal, reusable components composed together with `@ViewBuilder` and shared `ViewModifier`s, built and validated in isolation via Previews before they ever get wired into a full screen. At scale, that same discipline is what turns into a shared design system other teams can depend on."

---

## Quick self-check before the interview
- [ ] Can I name 3 concrete signs a screen needs decomposing?
- [ ] Can I explain data-driven vs visual-driven component boundaries with an example?
- [ ] Can I explain why a component should depend on primitives, not a full domain model?
- [ ] Can I describe how `@ViewBuilder` enables composition without extra state?
- [ ] Can I connect this topic to design systems / modular architecture if pushed further?
