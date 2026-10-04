const fs = require('fs');
const path = require('path');

const QUESTIONS_JSON_PATH = path.join(__dirname, '../Resources/questions.json');
const INDEX_HTML_PATH = path.join(__dirname, '../index.html');

const markdownAnswer = `"Data at rest" means data saved on the phone's storage: files, databases, caches, and tokens. If someone gets the phone, or a backup, they could try to read it. iOS protects files with Data Protection. Every file is encrypted, and the key for each file is locked by the user's passcode. You choose when that key is available, and that choice is the protection level. This matters for any app that stores user documents, messages, health data, or a local database.

Say it like this:

"First, I decide what I am storing. Tokens, passwords, and keys go in the Keychain. Everything else goes in files or a database, and I give those files a protection level, based on when my app needs to read them.

There are four levels. The strongest one makes the file readable only while the phone is unlocked. The next one lets a file I already opened stay readable after the phone locks, which is good for downloads and background writes. The third makes the file readable any time after the user unlocks the phone once after a restart, which is the default. The last one means no protection.

I choose the strongest level that still lets my feature work. If background work needs the file while the phone is locked, I step down one level, but not to 'none'. For databases, I set the same level on the store. I also exclude cache files from backups, turn on the Data Protection capability in Xcode, and never write secrets to UserDefaults or plain files. If the data is very sensitive, I add my own encryption on top, using CryptoKit, with the key stored in the Keychain."

The 4 levels of protection:

1. Complete (.completeFileProtection)
The file can be read only while the phone is unlocked. Use it for the most private data, like health or financial records.

\`\`\`swift
let url = documentsURL.appendingPathComponent("health.json")   // where the file will be saved
try data.write(to: url, options: .completeFileProtection)      // readable only while the phone is unlocked
\`\`\`

2. Complete Unless Open (.completeFileProtectionUnlessOpen)
A file you opened while unlocked stays readable even after the phone locks. New files can be created while locked. Use it for downloads or uploads that continue in the background.

\`\`\`swift
let url = documentsURL.appendingPathComponent("download.zip")             // where the file will be saved
try data.write(to: url, options: .completeFileProtectionUnlessOpen)       // a file already open stays usable after lock
\`\`\`

3. Until First User Authentication (.completeFileProtectionUntilFirstUserAuthentication)
The file is locked after a restart, until the user unlocks the phone for the first time. After that it stays readable, even when locked. This is the default level. Use it when background work needs the file, like sync or push handling.

\`\`\`swift
let url = documentsURL.appendingPathComponent("messages.db")                           // where the file will be saved
try data.write(to: url, options: .completeFileProtectionUntilFirstUserAuthentication)  // readable after the first unlock since restart
\`\`\`

4. None (.noFileProtection)
The file is not locked by the passcode at all. Use it only for non-sensitive data that must always be readable, like public content.

\`\`\`swift
let url = cachesURL.appendingPathComponent("public-config.json")   // where the file will be saved
try data.write(to: url, options: .noFileProtection)                // always readable, no protection from the passcode
\`\`\`

Change the level of an existing file:

\`\`\`swift
try FileManager.default.setAttributes(
    [.protectionKey: FileProtectionType.complete],    // the new protection level
    ofItemAtPath: url.path                            // the file that should change
)
\`\`\`

Database and Keychain follow the same idea:

\`\`\`swift
// Core Data store: set the level on the store
let description = NSPersistentStoreDescription()                              // describes where and how the store is saved
description.setOption(FileProtectionType.complete as NSObject,                // use level 1 for the database file
                      forKey: NSPersistentStoreFileProtectionKey)             // the key that controls protection

// Keychain item: the same levels, with different names
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,                            // a generic secret
    kSecAttrAccount as String: "token",                                       // its name
    kSecValueData as String: Data("secret".utf8),                             // the secret value
    kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly // like level 1, and never leaves this device
]
SecItemAdd(query as CFDictionary, nil)                                        // save it
\`\`\`

Quick steps to remember:

• Secrets: Keychain.
• Files and databases: pick a protection level, strongest first.
• Background work needs the file: step down to level 2 or 3, never to 4 for private data.
• Very sensitive data: add your own encryption with CryptoKit, key in the Keychain.

Good to mention:

• Turn on the Data Protection capability in Xcode, so the entitlement is set.
• Check UIApplication.protectedDataDidBecomeAvailableNotification and protectedDataWillBecomeUnavailableNotification to know when protected files become readable or locked.
• Reading a level 1 file while the phone is locked fails, so background tasks must handle that error and retry later.
• Mark cache and temporary files with isExcludedFromBackup, so they do not go into iCloud or computer backups.
• Data Protection protects against someone who has the device but not the passcode. It does not protect against malware running inside your app on an unlocked phone.
• Never store secrets in UserDefaults, Info.plist, or plain text files.

One-liner: Secrets go in the Keychain, files get one of four protection levels, and I pick the strongest one that still lets my feature work.

Memory trick: C-U-F-N → "Complete, Unless open, First unlock, None: strongest to weakest."`;

// 1. Update questions.json
const questions = JSON.parse(fs.readFileSync(QUESTIONS_JSON_PATH, 'utf-8'));
const q76 = questions.find(q => q.id === 'Q-76');
if (q76) {
  q76.answer = markdownAnswer;
  fs.writeFileSync(QUESTIONS_JSON_PATH, JSON.stringify(questions, null, 2) + '\n', 'utf-8');
  console.log('✓ Successfully updated Q-76 answer with markdown code blocks in questions.json!');
}

// 2. Update index.html QUESTIONS array
let html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
const startMarker = 'const QUESTIONS = ';
const startIdx = html.indexOf(startMarker);
if (startIdx !== -1) {
  const jsonStart = startIdx + startMarker.length;
  const nextSemi = html.indexOf(';\n', jsonStart);
  let htmlQuestions = JSON.parse(html.substring(jsonStart, nextSemi));
  const hIdx = htmlQuestions.findIndex(q => q.id === 'Q-76');
  if (hIdx !== -1) {
    htmlQuestions[hIdx].answer = markdownAnswer;
    html = html.substring(0, jsonStart) + JSON.stringify(htmlQuestions) + html.substring(nextSemi);
    fs.writeFileSync(INDEX_HTML_PATH, html, 'utf-8');
    console.log('✓ Successfully updated Q-76 answer in index.html QUESTIONS array!');
  }
}
