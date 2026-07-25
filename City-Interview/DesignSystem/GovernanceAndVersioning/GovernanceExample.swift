import Foundation

// MARK: - 🏛️ Governance & Versioning
//
// 💡 INTERVIEW TALKING POINTS:
// Building a Design System is easy. Maintaining it without breaking the apps that rely on it is what makes you a Senior Engineer.
//
// 1. The RFC Process (Request for Comments)
//    - Changes to the Design System impact every team. You don't just push to `main`. 
//    - Proposals for new components or token changes are written up, reviewed by both Design and Engineering leads, and agreed upon before a single line of code is written.
//
// 2. Versioning as an SPM Package
//    - A Design System must be a separate Swift Package Manager (SPM) module with its own Semantic Versioning (SemVer) (e.g., v1.4.2).
//    - Consuming apps pin their dependency to a specific version. This guarantees that if the Design System team introduces a breaking change (v2.0.0), it doesn't instantly crash the main app's build. The feature teams upgrade deliberately when they have time to migrate.
//
// 3. Breaking vs Non-Breaking Changes
//    - Non-Breaking: Adding `DSAvatar`, or adding an optional `icon` parameter to `DSButton`.
//    - Breaking: Removing `DSBadge`, or changing a required parameter on `DSCard`.
//
// 4. Deprecation, not Deletion
//    - If you want to remove an old component, you don't delete it. You mark it as deprecated.
//    - This generates a compiler warning for all teams using it, giving them a grace period to migrate to the new component before you actually delete it in the next major version.

// ==========================================
// Deprecation Example
// ==========================================

// 🚨 The old, legacy button. We want people to stop using this.
@available(*, deprecated, message: "Use DSButtonV2 instead. This will be removed in v3.0.")
struct DSRoundedButton {
    // ...
}

// ✅ The new button everyone should migrate to.
struct DSButtonV2 {
    // ...
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: What is the ownership model of a Design System?
//   A: In a massive enterprise, there is a dedicated "Platform" or "Design Systems" engineering team that owns it. In medium companies, it's often a "Federated" model, where anyone can contribute via PR, but a group of rotating "Stewards" must approve it.
// • Q: Why keep the Design System in a separate git repository?
//   A: If multiple distinct apps (e.g., an iOS App and a separate iPad POS App) share the same branding, putting the Design System in its own repo allows both apps to fetch the exact same SPM package.
