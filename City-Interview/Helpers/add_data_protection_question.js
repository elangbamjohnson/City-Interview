const fs = require('fs');
const path = require('path');

const QUESTIONS_JSON_PATH = path.join(__dirname, '../Resources/questions.json');
const INDEX_HTML_PATH = path.join(__dirname, '../index.html');

const newQuestion = {
  id: "Q-76",
  category: "Security, Auth & Compliance",
  difficulty: "Advanced",
  question: "How do you protect data at rest?",
  interviewSentence: "Secrets go in the Keychain, files get one of four protection levels, and I pick the strongest one that still lets my feature work.",
  answer: `"Data at rest" means data saved on the phone's storage: files, databases, caches, and tokens. If someone gets the phone, or an unencrypted backup, they could try to read it. iOS protects files with hardware-backed Data Protection. Every file is encrypted using a per-file key, and those keys are encrypted with class keys derived from the user's passcode and hardware UID inside the Secure Enclave. You choose when that key is available, and that choice is the file protection level. This matters for any app that stores user documents, messages, financial data, or local databases.

Say it like this:
"First, I decide what I am storing. Tokens, passwords, and cryptographic keys go in the Keychain. Everything else goes in files or a database, and I give those files a protection level based on when my app needs to read and write them.

There are four protection levels. The strongest one makes the file readable only while the phone is actively unlocked. The next one lets a file I already opened stay readable after the phone locks, which is ideal for background downloads, media streaming, and writes. The third makes the file readable any time after the user unlocks the phone once after a restart, which is the system default and works for background sync. The last one means no passcode protection.

I always choose the strongest level that still lets my feature work. If background work needs the file while the phone is locked, I step down one level, but never to 'none' for sensitive data. For Core Data and SQLite, I set the same protection level on the persistent store description. I also explicitly exclude cache directories from iCloud/iTunes backups, enable the Data Protection capability in Xcode, and never write sensitive data to UserDefaults or plain text files. If the data is ultra-sensitive, I add application-layer encryption on top using CryptoKit with AES-GCM, storing the key in the Keychain."

The 4 iOS Data Protection Levels:
1. Complete (.completeFileProtection / NSFileProtectionComplete):
   • Key Availability: Decrypted only while the device is actively unlocked. When the screen locks, the class key is purged from RAM.
   • Ideal For: Highest-sensitivity user data (financial statements, medical records, tax PDFs).
   • Caveat: Background tasks attempting to read this file while locked will trigger an I/O read error.

2. Complete Unless Open (.completeFileProtectionUnlessOpen / NSFileProtectionCompleteUnlessOpen):
   • Key Availability: File must be opened while unlocked. Once opened, it remains readable and writable even if the device locks. New files can also be created while locked.
   • Ideal For: Long-running background downloads, video exports, log file rotation, and audio recording.

3. Until First User Authentication (.completeFileProtectionUntilFirstUserAuthentication / NSFileProtectionCompleteUntilFirstUserAuthentication):
   • Key Availability: Encrypted on reboot. Once the user enters their passcode for the first time, the class key remains in memory across subsequent lock/unlock cycles until the phone reboots.
   • Ideal For: Default level for background synchronization, push notification caching, messages, and offline databases that need BGTaskScheduler access while locked.

4. None (.noFileProtection / NSFileProtectionNone):
   • Key Availability: Uses a key not protected by the user's passcode. Readable at all times, even before first unlock.
   • Ideal For: Non-sensitive public assets, static pre-packaged maps, or sound effects.

Protecting Databases, Caches & Backups:
• Core Data / SQLite: Configure NSPersistentStoreDescription.setOption(FileProtectionType.complete as NSObject, forKey: NSPersistentStoreFileProtectionKey) so all SQLite database files, WAL files, and journal files inherit the protection level.
• Backup Exclusion: Set URLResourceValues.isExcludedFromBackup = true on cached documents so sensitive caches are omitted from iCloud and computer backups.
• Lifecycle Notifications: Observe UIApplication.protectedDataDidBecomeAvailableNotification and protectedDataWillBecomeUnavailableNotification to know exactly when files enter or leave readable state.

Good to mention (Staff-Level Interview Points):
• Hardware Cryptography: Data Protection uses dedicated AES-256 crypto engines between flash storage and memory, ensuring zero CPU overhead for encryption/decryption.
• Capability Entitlement: Always enable the Data Protection capability in Xcode's "Signing & Capabilities" tab so your application bundle acquires the entitlement.
• Background Lock Pitfall: If a background fetch or notification service extension attempts to read a .complete file while the device is locked, the read fails. You must check UIApplication.shared.isProtectedDataAvailable before accessing locked storage, or queue the operation.
• Threat Model Scope: Data Protection protects against lost/stolen physical hardware without the passcode. It does NOT protect against in-process runtime inspection or jailbreak exploits on an already-unlocked phone. For defense-in-depth, use CryptoKit application-layer encryption.
• Keychain Accessibility Parallels: File protection levels map directly to Keychain accessibility flags (.complete ↔ kSecAttrAccessibleWhenUnlockedThisDeviceOnly; .completeUntilFirstUserAuthentication ↔ kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly).
• Zero Secrets in UserDefaults: UserDefaults stores property lists in an unencrypted plist file with default protection; never store tokens, PII, or credentials in UserDefaults.

One-liner: Secrets go in the Keychain, files get one of four protection levels, and I pick the strongest one that still lets my feature work.

Memory trick: C-U-F-N → "Complete, Unless open, First unlock, None: strongest to weakest."`,
  codeExample: `// =========================================================================
// 🛡️ SENIOR INTERVIEW ARCHITECTURE: Data Protection at Rest in iOS
// =========================================================================
//
// 💡 INTERVIEW TALKING POINTS (Staff/Senior Level):
// • Data Protection relies on hardware-backed AES-256 per-file encryption.
// • Class keys are protected by the user's passcode and hardware UID.
// • Match the protection level to the operational lifecycle (Interactive vs Background).

import Foundation
import UIKit
import CoreData
import Security

// MARK: - 1. Writing Files with the 4 Data Protection Levels

func saveFilesWithDataProtection() throws {
    let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    let sampleData = Data("sensitive_financial_payload".utf8)
    
    // Level 1: Complete Protection (.completeFileProtection)
    // 💡 Readable ONLY when the device is actively unlocked.
    // Purged from RAM as soon as user locks the screen.
    let financialURL = docs.appendingPathComponent("statement.pdf")
    try sampleData.write(to: financialURL, options: .completeFileProtection)
    
    // Level 2: Complete Unless Open (.completeFileProtectionUnlessOpen)
    // 💡 Opened while unlocked, stays readable/writable after lock.
    // Ideal for background audio recording or large downloads completing after screen sleep.
    let downloadURL = docs.appendingPathComponent("report_download.tmp")
    try sampleData.write(to: downloadURL, options: .completeFileProtectionUnlessOpen)
    
    // Level 3: Until First User Authentication (.completeFileProtectionUntilFirstUserAuthentication)
    // 💡 Locked on reboot; decrypted once upon first passcode unlock, stays readable.
    // iOS default for user documents. Required for background sync & push extensions.
    let messagesURL = docs.appendingPathComponent("messages.db")
    try sampleData.write(to: messagesURL, options: .completeFileProtectionUntilFirstUserAuthentication)
    
    // Level 4: No Protection (.noFileProtection)
    // ⚠️ Uses a key independent of user passcode. Always accessible.
    // Use strictly for non-sensitive public assets.
    let publicURL = caches.appendingPathComponent("app_public_theme.json")
    try sampleData.write(to: publicURL, options: .noFileProtection)
}

// MARK: - 2. Changing Protection Level of an Existing File
// 💡 SENIOR TALKING POINT:
// You can retroactively upgrade the protection level of any existing file
// without re-encrypting it manually.

func upgradeExistingFileProtection(at url: URL) throws {
    try FileManager.default.setAttributes(
        [.protectionKey: FileProtectionType.complete],
        ofItemAtPath: url.path
    )
}

// MARK: - 3. Database Protection (Core Data SQLite Store)
// 💡 SENIOR TALKING POINT:
// SQLite databases consist of .sqlite, .sqlite-wal, and .sqlite-shm files.
// Setting NSPersistentStoreFileProtectionKey guarantees all SQLite files
// inherit the strict complete protection policy.

func configureCoreDataProtection() -> NSPersistentStoreDescription {
    let storeURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("BankDatabase.sqlite")
    
    let description = NSPersistentStoreDescription(url: storeURL)
    // Set level 1 complete protection on database
    description.setOption(
        FileProtectionType.complete as NSObject,
        forKey: NSPersistentStoreFileProtectionKey
    )
    return description
}

// MARK: - 4. Keychain Equivalent Accessibility Levels
// 💡 SENIOR TALKING POINT:
// File protection and Keychain accessibility share the exact same conceptual tiers.

func saveTokenToKeychain(token: String) {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccount as String: "citi_auth_token",
        kSecValueData as String: Data(token.utf8),
        // Equivalent to Level 1: Readable only while device is unlocked, never leaves this device
        kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    ]
    SecItemDelete(query as CFDictionary)
    SecItemAdd(query as CFDictionary, nil)
}

// MARK: - 5. Excluding Cache Files from Backups
// 💡 SENIOR TALKING POINT:
// Compliance requirement (GDPR/PCI-DSS): Sensitive temporary caches must NOT
// be backed up to iCloud or unencrypted iTunes backups.

func excludeFromCloudBackup(url: URL) throws {
    var resourceValues = URLResourceValues()
    resourceValues.isExcludedFromBackup = true
    var mutableURL = url
    try mutableURL.setResourceValues(resourceValues)
}

// MARK: - 6. Handling Protected Data Availability Lifecycle
// 💡 SENIOR TALKING POINT:
// Before attempting I/O on Level 1 files during background wakes, check isProtectedDataAvailable.
// If locked, register for protectedDataDidBecomeAvailableNotification.

final class BackgroundDataManager {
    func performSafeIO() {
        if UIApplication.shared.isProtectedDataAvailable {
            // Safe: Device is currently unlocked, read .complete files
            readFinancialRecords()
        } else {
            // ⚠️ Device is locked! Defer I/O until device is unlocked by user.
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(protectedDataBecameAvailable),
                name: UIApplication.protectedDataDidBecomeAvailableNotification,
                object: nil
            )
        }
    }
    
    @objc private func protectedDataBecameAvailable() {
        NotificationCenter.default.removeObserver(
            self,
            name: UIApplication.protectedDataDidBecomeAvailableNotification,
            object: nil
        )
        readFinancialRecords()
    }
    
    private func readFinancialRecords() {
        print("Safely accessed completeFileProtection storage.")
    }
}`
};

// 1. Update questions.json
const questions = JSON.parse(fs.readFileSync(QUESTIONS_JSON_PATH, 'utf-8'));
const existingIdx = questions.findIndex(q => q.id === newQuestion.id);
if (existingIdx !== -1) {
  questions[existingIdx] = newQuestion;
  console.log(`Updated existing ${newQuestion.id} in questions.json`);
} else {
  questions.push(newQuestion);
  console.log(`Appended ${newQuestion.id} to questions.json (Total: ${questions.length})`);
}
fs.writeFileSync(QUESTIONS_JSON_PATH, JSON.stringify(questions, null, 2) + '\n', 'utf-8');

// 2. Update index.html
let html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

// Update QUESTIONS array in index.html
const startMarker = 'const QUESTIONS = ';
const startIdx = html.indexOf(startMarker);
if (startIdx !== -1) {
  const jsonStart = startIdx + startMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  let htmlQuestions = JSON.parse(html.substring(jsonStart, nextSemi));
  const hIdx = htmlQuestions.findIndex(q => q.id === newQuestion.id);
  if (hIdx !== -1) {
    htmlQuestions[hIdx] = newQuestion;
  } else {
    htmlQuestions.push(newQuestion);
  }
  html = html.substring(0, jsonStart) + JSON.stringify(htmlQuestions) + html.substring(nextSemi);
  console.log(`✓ Updated QUESTIONS in index.html (Total: ${htmlQuestions.length})`);
}

// Update TOPIC_CATEGORIES in index.html: add Q-76 to security-compliance.questionIds
const catStart = html.indexOf('const TOPIC_CATEGORIES = ');
const catEnd = html.indexOf('];', catStart);
const catStr = html.substring(catStart + 'const TOPIC_CATEGORIES = '.length, catEnd + 1);
const categories = JSON.parse(catStr);

const sec = categories.find(c => c.id === 'security-compliance');
if (sec && !sec.questionIds.includes(newQuestion.id)) {
  sec.questionIds.push(newQuestion.id);
  console.log(`✓ Added ${newQuestion.id} to security-compliance.questionIds:`, sec.questionIds);
  html = html.substring(0, catStart + 'const TOPIC_CATEGORIES = '.length) + JSON.stringify(categories) + html.substring(catEnd + 1);
}

// Update QUESTION_TO_DOCS for Q-76
const docsMarker = 'const QUESTION_TO_DOCS = {';
const docsIdx = html.indexOf(docsMarker);
if (docsIdx !== -1 && !html.includes(`"${newQuestion.id}":`)) {
  const injectDocs = `"${newQuestion.id}":[{"docId":"security-comparison","title":"Security Decision Table (Keychain, Enclave, Pinning)","filename":"Security-ComparisonNotes.md","icon":"🛡️"},{"docId":"data-persistence","title":"Data Persistence & Offline Storage","filename":"DataPersistence-ComparisonNotes.md","icon":"💾"}],`;
  html = html.slice(0, docsIdx + docsMarker.length) + injectDocs + html.slice(docsIdx + docsMarker.length);
  console.log(`✓ Added ${newQuestion.id} to QUESTION_TO_DOCS`);
}

// Update static counts: 75 -> 76
html = html.replace(/<span class="brand-tag">75 Questions/g, '<span class="brand-tag">76 Questions');
html = html.replace(/all 75 questions/g, 'all 76 questions');
html = html.replace(/all 75 senior iOS/g, 'all 76 senior iOS');
html = html.replace(/id="totalCount">75<\/span>/g, 'id="totalCount">76<\/span>');

fs.writeFileSync(INDEX_HTML_PATH, html, 'utf-8');
console.log('✓ index.html successfully updated and saved!');
