# Shared UI Component Library / Design System — Interview Talking Points

A rehearsal sheet for "Have you built or maintained a design system?" style questions. This is the systems/infrastructure layer above component decomposition — expect it to come up as a discussion, not a coding exercise. Practice saying this out loud.

## 1. Open with the framing (10 seconds)
> "A design system is what composable components become once they're extracted out of a single app into a shared, versioned, documented package that multiple teams depend on. It's less about the components themselves and more about the tokens, theming, documentation, and governance around them."

## 2. The four pillars (mention all, briefly)

| Pillar | One-liner |
|---|---|
| **Design tokens** | Named values (color, spacing, typography) that every component consumes instead of hardcoded values — one source of truth. |
| **Theming** | Light/dark and possibly multi-brand support, injected via `Environment` rather than hardcoded in each component. |
| **Component catalog** | A gallery/preview set showing every component and variant in one place — living documentation that can't go stale. |
| **Governance & versioning** | How changes get proposed, reviewed, released, and deprecated without breaking every consumer. |

## 3. Design tokens — the "why" that interviewers probe
> "Every component in the design system consumes tokens — `DSSpacing.small`, `DSColor.primary` — never a raw value like `.padding(12)`. That's the whole point: if the brand color changes, you update one token and it propagates everywhere, instead of grep-and-replace across the codebase."

**Be ready to name the typical token categories:** color, spacing, typography, corner radius, elevation/shadow, animation duration.

## 4. Theming — go beyond light/dark
- Inject a `Theme` via SwiftUI `Environment`, not per-component `if colorScheme == .dark` checks — keeps components dumb and themeable.
- Mention multi-brand/white-label as the next step up: some enterprise apps ship the same codebase under different brand skins, and theming architecture needs to support N themes, not just 2.

## 5. Component catalog — why it matters more than it sounds
> "I always want a catalog screen or a set of Previews showing every component in every state — primary/secondary button, empty/full badge, light/dark. It's how designers and engineers audit consistency visually, and unlike a Figma file or wiki page, it can never go stale because it's compiled against the real components."

*If asked about tooling:* some teams build this as an actual in-app debug screen or a standalone SwiftUI Preview app just for the design system package.

## 6. Governance & versioning — the senior-level differentiator
This is usually the part that separates "I used a design system" from "I helped run one." Be ready to speak to:

- **How changes get proposed:** an RFC-style process, a dedicated design system team or rotating ownership, design + engineering sign-off before a new component or breaking change ships.
- **Breaking vs non-breaking changes:** adding a new component or variant = non-breaking; changing an existing public API or removing a component = breaking, needs a deprecation path.
- **Deprecation, not deletion:** mark old components `@available(*, deprecated, message: "Use DSButtonV2 instead")` so consumers get a compiler warning before the old component is actually removed.
- **Versioning as its own package:** when the design system is a separate SPM package, it gets its own semver, changelog, and release cadence — consuming teams pin a version and upgrade deliberately, rather than getting changes pushed on them automatically.
- **Ownership model:** larger orgs often have a dedicated platform/design systems team; smaller orgs rotate ownership or treat it as a shared-responsibility library any team can contribute to via PR review.

## 7. How this connects to modular architecture (tie the two topics together)
> "The design system is usually its own SPM module that every feature module depends on — it's the one exception to 'modules shouldn't know about each other,' since it's explicitly meant to be a shared foundation layer, not a feature. It has its own CI, its own release cadence, and ideally its own dedicated owners."

## 8. A strong closing line if asked to summarize your approach
> "I think of a design system as tokens + theming + a documented component catalog + a governance process for changing it safely — and packaging it as its own versioned module so consuming teams can upgrade deliberately instead of being surprised by changes."

---

## Quick self-check before the interview
- [ ] Can I name the typical token categories (color, spacing, typography, etc.)?
- [ ] Can I explain why theming should be Environment-injected, not hardcoded?
- [ ] Can I explain why a component catalog is better documentation than a wiki page?
- [ ] Can I describe a deprecation path for an old component (`@available` + changelog)?
- [ ] Can I explain why a design system is usually its own versioned SPM package?
- [ ] Can I connect this back to modular architecture (shared foundation module)?
