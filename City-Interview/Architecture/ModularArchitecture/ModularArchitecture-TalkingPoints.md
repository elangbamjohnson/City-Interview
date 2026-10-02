# Modular App Architecture — Interview Talking Points

A one-page rehearsal sheet for "How would you design a large, scalable iOS architecture for an enterprise app?" style questions. This is a verbal/ whiteboard topic — practice saying this out loud, not just reading it.

## 1. Open with the framing (10 seconds)
Start broad before diving into specifics — shows you think in tradeoffs, not just patterns:

> "It depends on team size, release cadence, and how independent the teams need to be. For a single small team, a modular monolith is often enough. Once you're past ~15-20 engineers or multiple release trains, I'd start splitting into feature modules with enforced boundaries."

## 2. The core building blocks (mention all five, briefly)

| Piece | One-liner |
|---|---|
| **Module boundaries** | Split by feature/layer into separate SPM targets so teams can build, test, and own code independently. |
| **Dependency Injection** | Constructor-inject protocols, not concrete types, so modules don't need to know about each other's implementations. |
| **Coordinator pattern** | Pull navigation out of view controllers/views into dedicated objects — enables deep linking and reusable flows. |
| **Protocol-oriented layering** | Repository → UseCase → ViewModel, each depending only on the protocol below it, not the concrete class. |
| **Public API surface** | Each module exposes a narrow `public` entry point; everything else stays `internal` — this is your real module contract. |

## 3. Team & build-time reasoning (this is what senior interviewers actually probe)

- **Why modularize at all:** parallel builds (Xcode builds independent SPM targets concurrently), faster incremental builds, enforced boundaries the compiler checks for you (not just a wiki diagram nobody follows).
- **Ownership:** each module can map to a team — team owns their module's public API, internal implementation is theirs to change freely.
- **Circular dependencies:** SPM will hard-fail the build if Module A and Module B depend on each other — this is a feature, not an annoyance. It forces you to extract a shared "Core"/"Kit" module both depend on instead.
- **Versioning:** larger orgs sometimes version internal modules independently (like semver'd internal packages) so a team can update their module without forcing every other team to update in lockstep.
- **Release cadence:** feature modules let you gate features behind flags and ship a "shell" app that assembles modules — useful when different teams ship on different schedules.

## 4. When NOT to modularize (shows judgment, not just pattern-matching)

> "I wouldn't reach for this on a small app or small team — the overhead of maintaining module boundaries, public API surfaces, and DI wiring isn't worth it below a certain size. I'd rather have one well-organized target with clear folder structure and add modules only when build times or team friction actually start to hurt."

**Rule of thumb to say out loud: modularize when build time, merge conflicts, or cross-team coordination start becoming daily pain — not before.**

## 5. Common architecture patterns — one line each (be ready to compare)

- **MVVM** — View binds to an observable ViewModel; good default, but ViewModels can become dumping grounds without discipline.
- **MVVM-C** — MVVM + Coordinators; adds navigation ownership outside the View/ViewModel, solves the "who pushes the next screen" problem.
- **VIPER** — View/Interactor/Presenter/Entity/Router; very strict separation, popular in some enterprise iOS shops, but heavier boilerplate — good to know exists, rarely worth defending as "the best."
- **Clean Architecture** — Concentric layers (Entities → UseCases → Interface Adapters → Frameworks), dependency rule points inward; MVVM + protocol-oriented layering is basically a lightweight version of this.
- **TCA (The Composable Architecture)** — Unidirectional data flow, single source of truth `State`, `Reducer` functions, heavily testable; popular in SwiftUI-first teams, steeper learning curve.

If asked "which do you prefer": don't just pick one — say what you'd pick for a given context (e.g. "MVVM-C for most feature teams, Clean Architecture layering underneath for anything with complex business logic like payments or checkout").

## 6. A strong closing line if asked to summarize your approach

> "My default is: feature-based SPM modules, each with a narrow public API, constructor-based DI throughout, coordinators for navigation, and a thin protocol layer between data and presentation so everything's mockable in tests. But I'd always calibrate that against team size and how much the current pain point actually justifies the structure."

---

## Quick self-check before the interview
- [ ] Can I explain why SPM enforces boundaries better than folders alone?
- [ ] Can I describe a circular dependency and how I'd break it?
- [ ] Can I compare MVVM vs MVVM-C vs VIPER vs Clean vs TCA in one sentence each?
- [ ] Can I give a concrete "when NOT to modularize" answer without being asked twice?
- [ ] Can I connect architecture choices back to team/build-time outcomes, not just code aesthetics?
