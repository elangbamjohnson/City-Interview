const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '../Resources/questions.json');
const indexPath = path.join(__dirname, '../index.html');
const mdPath = path.join(__dirname, '../QUESTIONS.md');
const genDocsPath = path.join(__dirname, '../Helpers/generated_docs.json');

const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
let html = fs.readFileSync(indexPath, 'utf8');
let md = fs.readFileSync(mdPath, 'utf8');
const genDocs = JSON.parse(fs.readFileSync(genDocsPath, 'utf8'));

console.log('Current questions count:', questions.length);

const newQ74 = {
  id: "Q-74",
  category: "CI/CD & DevOps",
  difficulty: "Staff",
  question: "How do you manage signing in CI?",
  interviewSentence: "In CI, code signing requires importing certificates and provisioning profiles into an ephemeral runner keychain without exposing private keys; my standard approach is Fastlane match in read-only mode with setup_ci, with fallbacks to base64-encoded .p12 secrets imported via macOS security CLI or cloud-managed signing with App Store Connect API keys.",
  answer: `To put an app on TestFlight, iOS needs proof that the app comes from you. That proof has three parts:

• **Certificate:** your identity, with a private key. The private key exists only on the Mac that created it, or in a file you exported.
• **Provisioning profile:** says which app ID, which certificate, and which capabilities (push, for example) are allowed.
• **Keychain:** the place on the Mac where codesign looks for the certificate.

On your own Mac, all three are already there. A CI runner is a fresh Mac every time, so it has none of them. Managing signing in CI means getting these files onto the runner safely, using them for the build, and removing them afterward.

Say it like this:

"On CI, I need to give a clean machine the certificate, the private key, and the profile, without ever committing them to the repo.

My first choice is fastlane match. It stores the certificate and profiles, encrypted, in a private Git repo (or cloud storage). The whole team and CI use the same files, so there is no 'it signs on my Mac but not on CI' problem. In CI, I run match in read-only mode, so CI downloads and uses the files but never creates new certificates. That matters because Apple limits how many distribution certificates an account can have. Before match, I call setup_ci, which creates a temporary keychain, so the runner never asks for a password.

If I don't use fastlane, there are two other ways. The first is to export the certificate as a .p12 file, convert it and the profile to base64 text, store both in GitHub Secrets, and have the workflow import them into a temporary keychain with the security command. The second is cloud-managed signing: I give xcodebuild an App Store Connect API key and the -allowProvisioningUpdates flag, and Apple creates and manages the distribution certificate for me. That is the least setup, but I have less control. Xcode Cloud goes one step further and handles signing completely.

Two more habits keep it safe and cheap. For pull request jobs that only build and test on the simulator, I turn signing off, because a simulator does not need it. And I treat certificates like passwords: they live in secrets, never in the repo, and the temporary keychain is deleted after the job."

1. Option A: fastlane match, one-time setup (run on a developer Mac)

\`\`\`ruby
# fastlane/Matchfile
git_url("git@github.com:myorg/ios-certs.git")        # the private repo that stores the encrypted signing files
storage_mode("git")                                  # keep the files in git (S3 or Google Cloud also work)
type("appstore")                                     # the distribution type used for TestFlight and the App Store
app_identifier(["com.mycompany.myapp"])              # the bundle id this certificate and profile are for
\`\`\`

\`\`\`bash
# Run once on a developer Mac. It creates the certificate and profile, encrypts them, and pushes them to the repo.
bundle exec fastlane match appstore                  # you choose an encryption password, which becomes MATCH_PASSWORD
\`\`\`

2. Option A: fastlane match in CI (read-only)

\`\`\`ruby
lane :build do
  setup_ci                                           # create a temporary keychain so the runner never asks for a password
  match(type: "appstore", readonly: true)            # download and install the files, but never create new ones
  build_app(scheme: "MyApp", export_method: "app-store")  # archive and export, signing finds the files in the keychain
end
\`\`\`

\`\`\`yaml
- run: bundle exec fastlane build                    # run the lane on the runner
  env:
    MATCH_PASSWORD: \${{ secrets.MATCH_PASSWORD }}                # decrypts the files in the match repo
    MATCH_GIT_BASIC_AUTHORIZATION: \${{ secrets.MATCH_GIT_AUTH }} # lets the job read the private repo (base64 of "user:token")
\`\`\`

3. Option B: your own certificate and profile in GitHub Secrets

\`\`\`bash
# Run on your Mac once, to turn the files into text that can be stored as secrets
base64 -i Certificates.p12 | pbcopy                  # copy the certificate as base64, then paste it into the secret P12_BASE64
base64 -i MyApp_AppStore.mobileprovision | pbcopy    # copy the profile as base64, then paste it into the secret PROFILE_BASE64
\`\`\`

\`\`\`yaml
- name: Import signing files                         # a step that runs before the build
  env:
    P12_BASE64: \${{ secrets.P12_BASE64 }}            # the certificate with its private key, as text
    P12_PASSWORD: \${{ secrets.P12_PASSWORD }}        # the password you set when exporting the .p12
    PROFILE_BASE64: \${{ secrets.PROFILE_BASE64 }}    # the provisioning profile, as text
    KEYCHAIN_PASSWORD: \${{ secrets.KEYCHAIN_PASSWORD }}  # any random password for the temporary keychain
  run: |
    # Choose where the temporary keychain will live
    KEYCHAIN_PATH=$RUNNER_TEMP/build.keychain-db
    # Turn the base64 text back into the .p12 file
    echo -n "$P12_BASE64" | base64 --decode > $RUNNER_TEMP/cert.p12
    # Create a new empty keychain
    security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
    # Keep it unlocked for six hours, long enough for the build
    security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"
    # Unlock it so tools can use it
    security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
    # Put the certificate and private key into the keychain
    security import $RUNNER_TEMP/cert.p12 -P "$P12_PASSWORD" -A -t cert -f pkcs12 -k "$KEYCHAIN_PATH"
    # Allow codesign to use the key without showing a password popup that would hang CI
    security set-key-partition-list -S apple-tool:,apple: -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
    # Make this keychain the one that tools search
    security list-keychain -d user -s "$KEYCHAIN_PATH"
    # Create the folder where Xcode looks for profiles
    mkdir -p ~/Library/MobileDevice/Provisioning\\ Profiles
    # Turn the base64 text back into the profile file and put it in that folder
    echo -n "$PROFILE_BASE64" | base64 --decode > ~/Library/MobileDevice/Provisioning\\ Profiles/app.mobileprovision
\`\`\`

4. Option C: cloud-managed signing with an API key

\`\`\`bash
# Save the .p8 key from the secret to a file
echo -n "$ASC_KEY_CONTENT" | base64 --decode > $RUNNER_TEMP/AuthKey.p8

# Flags used in the next command:
# -allowProvisioningUpdates : let Xcode create or update the certificate and profile through Apple
# -authenticationKeyPath    : the .p8 key file
# -authenticationKeyID      : the id of the API key
# -authenticationKeyIssuerID: the issuer id of your App Store Connect account
xcodebuild archive -scheme MyApp -archivePath build/MyApp.xcarchive -allowProvisioningUpdates -authenticationKeyPath $RUNNER_TEMP/AuthKey.p8 -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID"
\`\`\`

5. Turn signing off for pull request tests

\`\`\`bash
# CODE_SIGNING_ALLOWED=NO : skip signing, because a simulator does not need it
xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16' CODE_SIGNING_ALLOWED=NO
\`\`\`

6. Clean up after the job

\`\`\`yaml
- name: Delete temporary keychain                    # remove secrets from the machine
  if: always()                                       # run even when the build failed
  run: security delete-keychain $RUNNER_TEMP/build.keychain-db  # the keychain and its certificate are gone
\`\`\`

Which option to choose:
• **fastlane match:** best for teams. One shared source of truth, and CI is read-only.
• **Secrets with security import:** no extra tools, but you manage the files and expiry by hand.
• **Cloud-managed signing:** least setup, Apple handles certificates, but less control.
• **Xcode Cloud:** Apple handles everything, but you are inside Apple's CI.

Quick steps to remember:
• Store the signing files encrypted or in secrets, never in the repo.
• Install them into a temporary keychain on the runner.
• Build with signing, and skip signing for simulator tests.
• Clean up the keychain after the job.
• Renew certificates and profiles before they expire.

Good to mention (Staff-Level Interview Points):
• Certificates expire after one year and profiles expire too. When they do, the build fails with a signing error. Put a calendar reminder, or a scheduled workflow that warns you, a few weeks before the date.
• To renew with match, run it from a developer Mac with write access. CI stays read-only, and the new files reach every machine through the repo.
• Adding a capability such as push notifications or a new device changes the profile. Regenerate it, and with match, run it again for that type.
• Use an API key, not an Apple ID. An Apple ID needs a password and two-factor codes, and neither works in CI.
• The partition-list command matters: Without \`set-key-partition-list\`, codesign can wait for a popup that nobody can click, and the job hangs until it times out.
• Separate certificates by purpose: development for debug builds, distribution for TestFlight and the App Store. Only the distribution one is needed in the release pipeline.
• Self-hosted runners keep their state: Always delete the temporary keychain, or one job's certificate stays available to the next job.
• Secrets are not passed to workflows from forked pull requests, so a stranger's PR cannot read your certificate. Keep it that way.
• Never commit .p12, .p8, or .mobileprovision files, and add them to .gitignore.
• Manual signing is more predictable in CI: Automatic signing can try to change profiles during a build, so for release builds many teams set the signing style to manual and name the profile.

One-liner: In CI I store the certificate and profile encrypted, install them into a temporary keychain, build with signing, and delete the keychain afterward, and fastlane match with read-only mode is my usual way.

Memory trick: S-T-R-C → "Store encrypted, Temporary keychain, Read-only in CI, Clean up after."`,
  codeExample: `# =========================================================================
# 🔐 SENIOR / STAFF INTERVIEW ARCHITECTURE: Code Signing in CI Pipelines
# =========================================================================
#
# 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
# • The Code Signing Triad: Certificate (Private Key Identity) + Mobileprovision Profile +
#   macOS Keychain (where 'codesign' tool searches for matching identities).
# • Fastlane Match: Synchronizes encrypted certs & profiles across the team via a private Git
#   or cloud bucket. In CI, 'readonly: true' prevents running out of Apple developer certificates.
# • Security CLI & Partition Lists: 'security set-key-partition-list -S apple-tool:,apple:' is
#   mandatory to prevent the macOS UI from prompting for keychain unlock during headless execution.
# • PR Optimization: Pass 'CODE_SIGNING_ALLOWED=NO' during simulator testing to bypass signing overhead.

# -------------------------------------------------------------------------
# 1. Fastlane Configuration: Matchfile & Fastfile
# -------------------------------------------------------------------------
# # fastlane/Matchfile
# git_url("git@github.com:myorg/ios-certificates.git")
# storage_mode("git")
# type("appstore")
# app_identifier(["com.mycompany.myapp"])

# # fastlane/Fastfile
# platform :ios do
#   lane :build_release do
#     # 🛡️ 1. Create temporary ephemeral keychain for CI
#     setup_ci
#     # 🛡️ 2. Fetch encrypted certs in READ-ONLY mode (never create new certs on CI)
#     match(type: "appstore", readonly: true)
#     # 🛡️ 3. Archive & export IPA
#     build_app(scheme: "MyApp", export_method: "app-store")
#   end
# end

# -------------------------------------------------------------------------
# 2. Raw GitHub Actions Workflow with macOS Security CLI
# -------------------------------------------------------------------------
# - name: Setup Ephemeral Keychain & Import Signing Files
#   env:
#     P12_BASE64: \${{ secrets.P12_BASE64 }}
#     P12_PASSWORD: \${{ secrets.P12_PASSWORD }}
#     PROFILE_BASE64: \${{ secrets.PROFILE_BASE64 }}
#     KEYCHAIN_PASSWORD: \${{ secrets.TEMP_KEYCHAIN_PASSWORD }}
#   run: |
#     KEYCHAIN_PATH=$RUNNER_TEMP/build.keychain-db
#     echo -n "$P12_BASE64" | base64 --decode > $RUNNER_TEMP/cert.p12
#     security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
#     security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"
#     security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
#     security import $RUNNER_TEMP/cert.p12 -P "$P12_PASSWORD" -A -t cert -f pkcs12 -k "$KEYCHAIN_PATH"
#     security set-key-partition-list -S apple-tool:,apple: -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
#     security list-keychain -d user -s "$KEYCHAIN_PATH"
#     mkdir -p ~/Library/MobileDevice/Provisioning\\ Profiles
#     echo -n "$PROFILE_BASE64" | base64 --decode > ~/Library/MobileDevice/Provisioning\\ Profiles/app.mobileprovision
#
# - name: Build and Archive
#   run: xcodebuild archive -scheme MyApp -archivePath build/MyApp.xcarchive
#
# - name: Ephemeral Keychain Teardown
#   if: always()
#   run: security delete-keychain $RUNNER_TEMP/build.keychain-db`
};

// 1. Shift questions in questions.json from index 73 onwards (current Q-74: Incident Triage onwards)
for (let i = 73; i < questions.length; i++) {
  const currentNum = i + 1; // 74..83
  const newNum = currentNum + 1; // 75..84
  questions[i].id = "Q-" + String(newNum).padStart(2, '0');
}

// Insert newQ74 at index 73
questions.splice(73, 0, newQ74);
console.log('New questions count in questions.json:', questions.length);
fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
console.log('✓ questions.json updated successfully!');

// 2. Update index.html
// Replace const QUESTIONS
const startQ = html.indexOf('const QUESTIONS = [');
const endQ = html.indexOf(';\n    const MODULE_DOCS =', startQ);
const newQuestionsCode = 'const QUESTIONS = ' + JSON.stringify(questions);
html = html.substring(0, startQ) + newQuestionsCode + html.substring(endQ);

// Update TOPIC_CATEGORIES
const startCat = html.indexOf('const TOPIC_CATEGORIES = [');
const endCat = html.indexOf('];\n', startCat);
const topicCategories = JSON.parse(html.substring(startCat + 'const TOPIC_CATEGORIES = '.length, endCat + 1));

for (const cat of topicCategories) {
    if (cat.id === 'cicd-devops') {
        cat.questionIds = ['Q-73', 'Q-74'];
    } else if (cat.id === 'leadership-production') {
        cat.questionIds = ['Q-75', 'Q-76'];
    } else if (cat.id === 'memory-management') {
        cat.questionIds = ['Q-77', 'Q-78', 'Q-79', 'Q-80', 'Q-81', 'Q-82', 'Q-83', 'Q-84'];
    }
}
const newTopicCategoriesCode = 'const TOPIC_CATEGORIES = ' + JSON.stringify(topicCategories) + ';';
html = html.substring(0, startCat) + newTopicCategoriesCode + html.substring(endCat + 2);

// Update QUESTION_TO_DOCS: shift keys >= 74 up by 1, and add Q-74
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
const newQ2D = {};

for (const [key, val] of Object.entries(oldQ2D)) {
    const num = parseInt(key.replace('Q-', ''), 10);
    if (num >= 74) {
        const shiftedKey = 'Q-' + String(num + 1).padStart(2, '0');
        newQ2D[shiftedKey] = val;
    } else {
        newQ2D[key] = val;
    }
}

newQ2D['Q-74'] = [
    {
        docId: "testing-xctest",
        title: "XCTest, Mocking & UI Testing Guide",
        filename: "Testing-TalkingPoints.md",
        icon: "🧪"
    }
];

const newQ2DCode = 'const QUESTION_TO_DOCS = ' + JSON.stringify(newQ2D) + ';';
html = html.substring(0, startQ2D) + newQ2DCode + html.substring(endQ2D + 2);

// Update text counters in index.html
html = html.replace(/83 Questions/g, '84 Questions');
html = html.replace(/83 questions/g, '84 questions');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

// Sync generated_docs.json
genDocs.QUESTION_TO_DOCS = newQ2D;
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 3. Update QUESTIONS.md
md = md.replace(
  '| **CI/CD & DevOps** | `1` |',
  '| **CI/CD & DevOps** | `2` |'
);
md = md.replace(
  '| **Total** | **`83`** | Complete Senior & Staff iOS Interview Curriculum |',
  '| **Total** | **`84`** | Complete Senior & Staff iOS Interview Curriculum |'
);
md = md.replace(
  'A comprehensive, senior & staff-level revision suite for 83 iOS interview questions',
  'A comprehensive, senior & staff-level revision suite for 84 iOS interview questions'
);

// Update Section headers
md = md.replace(
  '## 🚀 CI/CD & DevOps (Q-73)',
  '## 🚀 CI/CD & DevOps (Q-73 – Q-74)'
);
md = md.replace(
  '## 👔 Engineering Leadership & Operations (Q-74 – Q-75)',
  '## 👔 Engineering Leadership & Operations (Q-75 – Q-76)'
);
md = md.replace(
  '## 🧠 Memory Management (Q-76 – Q-83)',
  '## 🧠 Memory Management (Q-77 – Q-84)'
);

// Shift question anchors in reverse (from 83 down to 74)
for (let num = 83; num >= 74; num--) {
  const currentRegex = new RegExp(`### \`Q-${num}\` —`, 'g');
  const targetId = `### \`Q-${num + 1}\` —`;
  md = md.replace(currentRegex, targetId);
}

// Prepare markdown for Q-74
const q74Md = `
---

### \`Q-74\` — How do you manage signing in CI?

- **Category:** \`CI/CD & DevOps\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"In CI, code signing requires importing certificates and provisioning profiles into an ephemeral runner keychain without exposing private keys; my standard approach is Fastlane match in read-only mode with setup_ci, with fallbacks to base64-encoded .p12 secrets imported via macOS security CLI or cloud-managed signing with App Store Connect API keys."*

#### 📖 Detailed Answer

${newQ74.answer}

#### 💻 Configuration & Automation Example

\`\`\`yaml
${newQ74.codeExample}
\`\`\`
`;

// Insert q74Md right before "## 👔 Engineering Leadership & Operations (Q-75 – Q-76)"
const insertMarker = '## 👔 Engineering Leadership & Operations (Q-75 – Q-76)';
const markerIdx = md.indexOf(insertMarker);
if (markerIdx === -1) {
    console.error('Could not find insertMarker in QUESTIONS.md');
    process.exit(1);
}

md = md.substring(0, markerIdx) + q74Md + '\n\n---\n\n' + md.substring(markerIdx);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
