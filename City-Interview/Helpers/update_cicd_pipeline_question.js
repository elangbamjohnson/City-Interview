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

const q72Index = questions.findIndex(q => q.id === "Q-72");
if (q72Index === -1) {
    console.error("Could not find Q-72 in questions.json");
    process.exit(1);
}

const updatedQ72 = {
  id: "Q-72",
  category: "Testing, CI/CD & AI Engineering",
  difficulty: "Staff",
  question: "How do you build a CI/CD pipeline for an iOS app with GitHub Actions?",
  interviewSentence: "I structure iOS CI/CD into two GitHub Actions workflows: a fast PR workflow (linting, compilation, unit tests) gating branch merges via branch protection, and a post-merge release workflow chaining test, Fastlane match signing, artifact archiving, and TestFlight deployment via App Store Connect API keys.",
  diagram: "Resources/github_actions_cicd_flow_diagram.png",
  answer: `CI (continuous integration) means every change is built and tested automatically. CD (continuous delivery) means a passing build is packaged and sent out without manual steps. For iOS, the runner must be a Mac, because Xcode only runs on macOS. GitHub Actions reads YAML files in \`.github/workflows/\`, and each file is a workflow made of jobs. Here the work splits into two workflows: one that checks pull requests, and one that releases after a merge.

Say it like this:

"I use two workflows. The first runs on every pull request. It lints, builds, and runs the unit tests. Branch protection on main requires this check to pass, so broken code cannot be merged.

The second runs when a pull request is merged. A merge is a push to main, so I trigger on push. It has three jobs that run one after another, using needs. Job one runs the full tests, including UI tests, and saves the results. Job two runs only if the tests passed. It signs the app, archives it, exports the IPA, and uploads the IPA and the dSYM files as artifacts. Job three runs only if the build passed. It downloads that same IPA and uploads it to TestFlight. I deploy the exact file I built and tested, and I do not rebuild it.

Signing is the hard part in CI. I use fastlane match, which keeps the certificates and profiles in an encrypted private repo. For uploading, I use an App Store Connect API key, so there is no Apple ID password and no two-factor prompt. All secrets live in GitHub Secrets and never in the repo. The last job sends a Slack message with the result. TestFlight is automatic, but the App Store release stays manual, with an approval step."

![GitHub Actions CI/CD Architecture Flowchart](Resources/github_actions_cicd_flow_diagram.png)

1. Workflow 1: check every pull request (.github/workflows/pr.yml)

\`\`\`yaml
name: PR checks                              # the name shown on the pull request
on:
  pull_request:                              # run on every pull request
    branches: [main]                         # that targets the main branch
concurrency:
  group: pr-\${{ github.event.pull_request.number }}  # one run per pull request
  cancel-in-progress: true                   # cancel the old run when a new commit is pushed
jobs:
  checks:
    runs-on: macos-latest                    # iOS builds need a Mac runner
    timeout-minutes: 30                      # stop a stuck job instead of paying for it
    steps:
      - uses: actions/checkout@v4            # download the code
      - uses: maxim-lobanov/setup-xcode@v1   # choose the Xcode version
        with:
          xcode-version: latest-stable       # or pin a version, so builds stay repeatable
      - run: brew install swiftlint          # install the linter
      - run: swiftlint --strict              # fail the check when there are lint warnings
      # Build and run only the unit tests here, so feedback stays fast
      # Use a simulator name that exists on the runner's Xcode version
      - run: |
          xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:MyAppTests
\`\`\`

2. Workflow 2, trigger and Job 1: test (.github/workflows/release.yml)

\`\`\`yaml
name: Release                                # workflow name
on:
  push:
    branches: [main]                         # a merged pull request creates a push to main
concurrency:
  group: release                             # only one release runs at a time
  cancel-in-progress: false                  # never cancel a release that is already running
jobs:
  test:                                      # job 1
    runs-on: macos-latest                    # Mac runner
    steps:
      - uses: actions/checkout@v4            # download the code
      - uses: maxim-lobanov/setup-xcode@v1   # choose the Xcode version
        with:
          xcode-version: latest-stable       # same version in every job
      # Run all tests, unit and UI, and save a result bundle with coverage
      - run: |
          xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16' -resultBundlePath TestResults.xcresult -enableCodeCoverage YES
      - uses: actions/upload-artifact@v4     # keep the test report
        if: always()                         # upload it even when tests fail, so you can read why
        with:
          name: test-results                 # the artifact name
          path: TestResults.xcresult         # the file to keep
\`\`\`

3. Job 2: build, sign, and save artifacts

\`\`\`yaml
  build:                                     # job 2
    needs: test                              # runs only if the test job passed
    runs-on: macos-latest                    # Mac runner
    steps:
      - uses: actions/checkout@v4            # download the code
      - uses: maxim-lobanov/setup-xcode@v1   # choose the Xcode version
        with:
          xcode-version: latest-stable       # same version as the test job
      - uses: ruby/setup-ruby@v1             # install Ruby, which fastlane needs
        with:
          bundler-cache: true                # cache the gems, so the next run is faster
      - run: bundle exec fastlane build      # sign, archive, and export the IPA
        env:
          MATCH_PASSWORD: \${{ secrets.MATCH_PASSWORD }}               # decrypts the signing files in the match repo
          MATCH_GIT_BASIC_AUTHORIZATION: \${{ secrets.MATCH_GIT_AUTH }} # lets the job read the private match repo
          BUILD_NUMBER: \${{ github.run_number }}                      # a unique number that always goes up
      - uses: actions/upload-artifact@v4     # keep the build for the next job and for later
        with:
          name: app-build                    # the artifact name
          path: |                            # the files to keep
            build/MyApp.ipa
            build/MyApp.app.dSYM.zip
\`\`\`

4. Job 3: deploy to TestFlight, and Job 4: notify

\`\`\`yaml
  deploy:                                    # job 3
    needs: build                             # runs only if the build job passed
    runs-on: macos-latest                    # Mac runner, fastlane upload works best here
    environment: testflight                  # an environment can require a manual approval
    steps:
      - uses: actions/checkout@v4            # download the code, because the Fastfile is in the repo
      - uses: ruby/setup-ruby@v1             # install Ruby for fastlane
        with:
          bundler-cache: true                # cache the gems
      - uses: actions/download-artifact@v4   # get the exact IPA that the build job made
        with:
          name: app-build                    # the artifact from job 2
          path: build                        # put the files in the build folder
      - run: bundle exec fastlane deploy     # upload the IPA to TestFlight
        env:
          ASC_KEY_ID: \${{ secrets.ASC_KEY_ID }}             # App Store Connect API key id
          ASC_ISSUER_ID: \${{ secrets.ASC_ISSUER_ID }}       # App Store Connect issuer id
          ASC_KEY_CONTENT: \${{ secrets.ASC_KEY_CONTENT }}   # the .p8 key, stored as base64 text

  notify:                                    # job 4
    needs: [test, build, deploy]             # wait for all the jobs
    if: always()                             # run even when an earlier job failed
    runs-on: ubuntu-latest                   # no Mac needed here, and Linux is cheaper
    steps:
      # Post the result of the deploy job to Slack
      - run: |
          curl -X POST -H 'Content-type: application/json' --data "{\\"text\\":\\"iOS release: \${{ needs.deploy.result }}\\"}" \${{ secrets.SLACK_WEBHOOK }}
\`\`\`

5. The Fastfile that the jobs call (fastlane/Fastfile)

\`\`\`ruby
default_platform(:ios)                       # every lane here is for iOS

platform :ios do
  lane :build do                             # called by the build job
    setup_ci                                 # create a temporary keychain on the CI machine
    match(type: "appstore", readonly: true)  # download the distribution certificate and profile, never create new ones
    increment_build_number(build_number: ENV["BUILD_NUMBER"])  # set the unique build number
    build_app(                               # archive and export the IPA
      scheme: "MyApp",                       # the scheme to build
      export_method: "app-store",            # the export type for TestFlight and the App Store
      output_directory: "build"              # put the IPA and dSYM in the build folder
    )
  end

  lane :deploy do                            # called by the deploy job
    api_key = app_store_connect_api_key(     # sign in with an API key, no password and no 2FA
      key_id: ENV["ASC_KEY_ID"],             # the key id from the secrets
      issuer_id: ENV["ASC_ISSUER_ID"],       # the issuer id from the secrets
      key_content: ENV["ASC_KEY_CONTENT"],   # the key text from the secrets
      is_key_content_base64: true            # the key was stored as base64
    )
    upload_to_testflight(                    # send the build to TestFlight
      api_key: api_key,                      # use the API key above
      ipa: "build/MyApp.ipa",                # the IPA downloaded from the artifact
      skip_waiting_for_build_processing: true  # do not hold the runner while Apple processes the build
    )
  end
end
\`\`\`

6. Branch protection (set in GitHub, not in YAML)
GitHub > Settings > Branches > Add rule for "main"
• Require a pull request before merging                   # nobody pushes straight to main
• Require status checks to pass: "checks" (PR checks job) # the merge button stays disabled until tests pass
• Require branches to be up to date before merging        # the PR was tested against the latest main

Secrets to add (Settings > Secrets and variables > Actions):
MATCH_PASSWORD, MATCH_GIT_AUTH, ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_CONTENT, SLACK_WEBHOOK.

Quick steps to remember:
• PR workflow: lint, build, and unit tests. Branch protection blocks the merge if it fails.
• Merge to main: the push triggers the release workflow.
• Job 1, test: unit and UI tests, with the report saved.
• Job 2, build: needs: test, then sign, archive, and upload the IPA and dSYMs as artifacts.
• Job 3, deploy: needs: build, then download the same IPA and send it to TestFlight.
• Notify: Slack message with the result, even on failure.

Good to mention (Staff-Level Interview Points):
• Deploy the file you tested: Passing the IPA between jobs as an artifact means TestFlight gets the exact build that came out of the pipeline, and no job rebuilds it.
• Two workflows keep feedback fast: The PR workflow stays short with unit tests only. The slow UI tests and the release steps run once, after the merge.
• Signing: fastlane match keeps certificates in one encrypted repo, so the team and CI share the same files. setup_ci creates a temporary keychain, so the runner never prompts for a password.
• API key login: the App Store Connect API key avoids Apple ID passwords and two-factor prompts, which cannot work in CI.
• Build numbers must increase on every upload: github.run_number does that without any extra setup.
• Keep the dSYMs: The artifact stores them, and you can upload them to your crash tool (Q-75) in the deploy job.
• Approval gate: an environment with required reviewers pauses the deploy job until someone approves. Use it for the App Store release, and keep TestFlight automatic.
• Speed and cost: macOS runner minutes cost more than Linux ones. Cache Swift Package Manager downloads and gems, set timeout-minutes, and cancel old PR runs. Teams with heavy usage move to self-hosted Mac runners.
• Pin versions for repeatable builds: latest-stable and macos-latest change over time. Pin the Xcode version, and check which simulators and Xcode versions the runner image has, in GitHub's runner documentation.
• Flaky UI tests can block releases: Retry failed tests with -retry-tests-on-failure, and fix flaky tests quickly.
• Secrets stay in GitHub Secrets: Never commit certificates or keys. Secrets are not passed to workflows triggered from forked pull requests, which is the safe default.
• Rollback means shipping a new build with a fix, since a TestFlight or App Store build cannot be undone. Tag each release in Git so you can find what went out.
• Alternatives: Xcode Cloud is Apple's own CI/CD service, and it handles signing and TestFlight for you. GitHub Actions gives more control and fits teams that already use GitHub for everything.

One-liner: A PR workflow blocks bad code before merge, then a merge to main triggers test, build and sign, artifacts, and a TestFlight upload, with each job running only if the one before it passed.

Memory trick: P-M-T-B-D-N → "PR checks, Merge, Test, Build and sign, Deploy, Notify."`,
  codeExample: `# =========================================================================
# 🚀 SENIOR / STAFF INTERVIEW ARCHITECTURE: iOS CI/CD with GitHub Actions
# =========================================================================
#
# 💡 SENIOR / STAFF INTERVIEW TALKING POINTS:
# • Dual-Workflow Model: Fast PR gate (~5 min feedback loop) vs. Chained Release Pipeline.
# • Zero Recompilation Rule: Build and sign ONCE in Job 2, upload IPA artifact, then
#   download the exact same binary in Job 3 for TestFlight deployment.
# • Fastlane Match & Ephemeral Keychains: 'setup_ci' creates a temporary macOS keychain
#   cleared after job execution; 'match(readonly: true)' prevents CI runner from dirtying certificates.
# • App Store Connect API Key: Headless 2FA-free authentication using Apple's official REST API (.p8).
# • Matrix & Cost Optimization: Run notifications and lightweight scripts on ubuntu-latest ($)
#   instead of burning costly macOS runner minutes ($$$).

# -------------------------------------------------------------------------
# 1. PR Gate: .github/workflows/pr.yml
# -------------------------------------------------------------------------
name: PR checks
on:
  pull_request:
    branches: [main]
concurrency:
  group: pr-\${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  checks:
    runs-on: macos-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: latest-stable
      - run: brew install swiftlint
      - run: swiftlint --strict
      - run: |
          xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:MyAppTests

# -------------------------------------------------------------------------
# 2. Fastlane Automation: fastlane/Fastfile
# -------------------------------------------------------------------------
# default_platform(:ios)
# platform :ios do
#   lane :build do
#     setup_ci
#     match(type: "appstore", readonly: true)
#     increment_build_number(build_number: ENV["BUILD_NUMBER"])
#     build_app(scheme: "MyApp", export_method: "app-store", output_directory: "build")
#   end
#   lane :deploy do
#     api_key = app_store_connect_api_key(
#       key_id: ENV["ASC_KEY_ID"],
#       issuer_id: ENV["ASC_ISSUER_ID"],
#       key_content: ENV["ASC_KEY_CONTENT"],
#       is_key_content_base64: true
#     )
#     upload_to_testflight(api_key: api_key, ipa: "build/MyApp.ipa", skip_waiting_for_build_processing: true)
#   end
# end`
};

questions[q72Index] = updatedQ72;
fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
console.log('✓ questions.json updated successfully!');

// 2. Update index.html
const startQ = html.indexOf('const QUESTIONS = [');
const endQ = html.indexOf(';\n    const MODULE_DOCS =', startQ);
const newQuestionsCode = 'const QUESTIONS = ' + JSON.stringify(questions);
html = html.substring(0, startQ) + newQuestionsCode + html.substring(endQ);

// Update QUESTION_TO_DOCS for Q-72
const startQ2D = html.indexOf('const QUESTION_TO_DOCS = {');
const endQ2D = html.indexOf('};\n', startQ2D);
const oldQ2D = JSON.parse(html.substring(startQ2D + 'const QUESTION_TO_DOCS = '.length, endQ2D + 1));
oldQ2D['Q-72'] = [
    {
        docId: "testing-xctest",
        title: "XCTest, Mocking & UI Testing Guide",
        filename: "Testing-TalkingPoints.md",
        icon: "🧪"
    }
];
const newQ2DCode = 'const QUESTION_TO_DOCS = ' + JSON.stringify(oldQ2D) + ';';
html = html.substring(0, startQ2D) + newQ2DCode + html.substring(endQ2D + 2);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ index.html updated successfully!');

genDocs.QUESTION_TO_DOCS['Q-72'] = oldQ2D['Q-72'];
fs.writeFileSync(genDocsPath, JSON.stringify(genDocs, null, 2), 'utf8');
console.log('✓ generated_docs.json updated successfully!');

// 3. Update QUESTIONS.md
const q72StartMarker = '### `Q-72` —';
const q73StartMarker = '### `Q-73` —';
const q72Start = md.indexOf(q72StartMarker);
const q73Start = md.indexOf(q73StartMarker);

if (q72Start === -1 || q73Start === -1) {
    console.error("Could not find markers in QUESTIONS.md", { q72Start, q73Start });
    process.exit(1);
}

const q72Md = `### \`Q-72\` — How do you build a CI/CD pipeline for an iOS app with GitHub Actions?

- **Category:** \`Testing, CI/CD & AI Engineering\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"I structure iOS CI/CD into two GitHub Actions workflows: a fast PR workflow (linting, compilation, unit tests) gating branch merges via branch protection, and a post-merge release workflow chaining test, Fastlane match signing, artifact archiving, and TestFlight deployment via App Store Connect API keys."*

#### 📖 Detailed Answer

${updatedQ72.answer}

#### 💻 YAML & Fastlane Configuration Example

\`\`\`yaml
${updatedQ72.codeExample}
\`\`\`

`;

md = md.substring(0, q72Start) + q72Md + md.substring(q73Start);
fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md updated successfully!');
