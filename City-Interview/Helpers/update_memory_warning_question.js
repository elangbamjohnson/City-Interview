const fs = require('fs');
const vm = require('vm');

const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';
const GENERATED_DOCS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Helpers/generated_docs.json';
const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

// 1. Read existing questions and docs
let questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
const generatedDocs = JSON.parse(fs.readFileSync(GENERATED_DOCS_PATH, 'utf-8'));

console.log('Total questions before update:', questions.length);

// 2. Define the upgraded Q-66
const updatedQ66 = {
  id: "Q-66",
  category: "Memory Management",
  difficulty: "Staff",
  question: "How do you handle memory warnings?",
  interviewSentence: "On a memory warning I free anything I can rebuild, like caches and hidden screens, but the real fix is using less memory all the time.",
  answer: `iOS gives every app a limited amount of memory. When the device is running low, iOS warns the app first, and if the app keeps using too much, iOS kills it. A memory warning is that first warning: "free what you can, now." It matters most for apps that show images, lists, video, or keep big caches.

Say it like this:
"A memory warning means the system is under memory pressure and my app should release anything it can rebuild later. If I ignore it, iOS can terminate my app, and the user sees a crash-like exit.

When the warning comes, I free things that are easy to recreate: image caches, decoded images, downloaded data kept in memory, and any screen or view that is not visible. I never free user data that is not saved yet. I save that first.

In UIKit, I get the warning in didReceiveMemoryWarning on a view controller, or through UIApplication.didReceiveMemoryWarningNotification for non-UI classes like a cache manager. In SwiftUI, I listen to the same notification with onReceive. For caches, I prefer NSCache, because it removes items by itself when memory is low, so I get part of the work for free.

But handling the warning is the last line of defense. The better habit is to use less memory all the time: downsample large images to the display size, use lazy lists and cell reuse, avoid retain cycles, and release big objects when a screen closes. I check this with Xcode's Memory Graph and Instruments, so I find leaks and big allocations before users do."

System & Runtime Delivery Channels:
1. UIViewController.didReceiveMemoryWarning(): Triggered automatically on active/allocated view controllers. Clear reconstructible view caches, off-screen bitmaps, and auxiliary data models.
2. UIApplication.didReceiveMemoryWarningNotification: Dispatched across NotificationCenter for non-UI classes (image caches, network download buffers, data stores).
3. SwiftUI .onReceive: Subscribes to NotificationCenter.default.publisher(for: UIApplication.didReceiveMemoryWarningNotification) to dump temporary state.
4. Auto-Eviction via NSCache: NSCache responds internally to system memory pressure notifications by purging cost-exceeding or LRU items automatically. Thread-safe unlike standard Dictionary.

Proactive Prevention (The Real Fix):
• Downsample Before Display: Decoded image cost in RAM = width × height × 4 bytes (RGBA8888). A 4000×3000 photo consumes ~48 MB of RAM regardless of JPEG/PNG compression. Use Image I/O CGImageSourceCreateThumbnailAtIndex to decode directly at display resolution.
• Lazy Allocation & Cell Reuse: Use LazyVStack / UICollectionView cell reuse to hold only visible subviews in memory.
• Lifecycle & Deallocation: Release heavy coordinators, view models, and unneeded screens upon dismissal; audit ARC retain cycles using Memory Graph.

Quick comparison:
• Free on warning: Image caches, decoded images, in-memory data, hidden screens.
• Never free: Unsaved user data. Save it first.
• Where to listen: didReceiveMemoryWarning (view controller), notification (other classes), onReceive (SwiftUI).
• Best habit: Use less memory all the time.

Good to mention:
• NSCache clears itself under pressure and is thread safe, so it is better than a plain dictionary for caches.
• A memory warning is not guaranteed before termination. iOS can kill the app with no warning (Jetsam high-water mark breach), so reduce memory use early.
• Apps in the background are killed first when memory is low, so drop big caches in sceneDidEnterBackground too.
• A decoded image costs width × height × 4 bytes, no matter how small the file is. A 4000×3000 photo is about 48 MB.
• Use the Memory Graph debugger to find leaks and retain cycles, and Instruments (Allocations, Leaks, VM Tracker) to find growth over time.
• Simulate it in the Simulator with Debug > Simulate Memory Warning.

One-liner: On a memory warning I free anything I can rebuild, like caches and hidden screens, but the real fix is using less memory all the time.`,
  codeExample: `// =========================================================================
// SENIOR INTERVIEW ARCHITECTURE: Memory Pressure & Eviction Strategies
// =========================================================================
import UIKit
import SwiftUI
import ImageIO

// =========================================================================
// 1. IN A VIEW CONTROLLER (UIKit Lifecycle Hook)
// =========================================================================
final class GalleryViewController: UIViewController {
    private var imageCache = NSCache<NSURL, UIImage>()
    private var cachedThumbnails: [String: UIImage] = [:]
    
    // SENIOR TALKING POINT:
    // didReceiveMemoryWarning() is called when the OS determines physical RAM
    // has crossed the warning threshold. Release items that can be reconstructed.
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        
        // 1. Purge reconstructible in-memory caches
        imageCache.removeAllObjects()
        cachedThumbnails.removeAll()
        
        // 2. Clear off-screen render buffers or invisible child views
        // NEVER purge unsaved user state or critical transactional data!
    }
}

// =========================================================================
// 2. IN A NON-UI CLASS (NSCache & System Notification Observer)
// =========================================================================
// SENIOR TALKING POINT:
// NSCache is thread-safe and auto-evicts objects under memory pressure.
// Plain Swift Dictionary does NOT auto-evict and causes Jetsam terminations.
final class ImageCacheManager {
    static let shared = ImageCacheManager()
    private let cache = NSCache<NSURL, UIImage>()

    init() {
        // Configure explicit memory boundaries
        cache.totalCostLimit = 60 * 1024 * 1024 // 60 MB limit
        cache.countLimit = 150                   // Max 150 items

        // Explicit subscription to system-wide memory warning broadcast
        NotificationCenter.default.addObserver(
            forName: UIApplication.didReceiveMemoryWarningNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            // Weak self prevents retain cycle in notification closure
            self?.cache.removeAllObjects()
        }
    }

    func set(_ image: UIImage, for url: NSURL) {
        // Cost estimation: bytes = width * height * 4 (RGBA8888 bitmap)
        let cost = Int(image.size.width * image.size.height * 4)
        cache.setObject(image, forKey: url, cost: cost)
    }

    func get(for url: NSURL) -> UIImage? {
        cache.object(forKey: url)
    }
}

// =========================================================================
// 3. IN SWIFTUI (Declarative NotificationCenter Publisher)
// =========================================================================
// SENIOR TALKING POINT:
// In SwiftUI, use .onReceive with the system notification publisher to flush
// ephemeral memory caches without tightly coupling to UIViewController lifecycle.
struct GalleryView: View {
    @State private var images: [UIImage] = []

    var body: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))]) {
                ForEach(images.indices, id: \.self) { index in
                    Image(uiImage: images[index])
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(
            for: UIApplication.didReceiveMemoryWarningNotification)) { _ in
            // Free ephemeral decoded images; re-fetch or decode lazily on scroll
            images.removeAll()
        }
    }
}

// =========================================================================
// 4. USE LESS MEMORY IN THE FIRST PLACE: Image I/O Downsampling
// =========================================================================
// SENIOR TALKING POINT:
// Decoding a 4000x3000 JPEG into a UIImage creates an uncompressed 48 MB bitmap:
// 4000 * 3000 * 4 bytes = 48,000,000 bytes in dirty RAM!
// Using CGImageSource downsamples the file directly to display pixel dimensions
// WITHOUT ever allocating the full-size uncompressed bitmap in memory.
func downsample(url: URL, maxPixel: CGFloat) -> UIImage? {
    let options: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceCreateThumbnailWithTransform: true, // Respect EXIF orientation
        kCGImageSourceThumbnailMaxPixelSize: maxPixel,
        kCGImageSourceShouldCacheImmediately: true       // Force immediate decode on background thread
    ]
    
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let cg = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
    else { return nil }
    
    return UIImage(cgImage: cg)
}`
};

// 3. Replace Q-66 in questions array
const index66 = questions.findIndex(q => q.id === "Q-66");
if (index66 !== -1) {
  questions[index66] = updatedQ66;
  console.log('Replaced Q-66 at index:', index66);
} else {
  console.error('Q-66 not found!');
  process.exit(1);
}

// 4. Map companion docs for Q-66
generatedDocs.QUESTION_TO_DOCS["Q-66"] = ["performance-profiling", "ios-internals"];

// 5. Write updated questions.json & generated_docs.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
fs.writeFileSync(GENERATED_DOCS_PATH, JSON.stringify(generatedDocs, null, 2), 'utf-8');
console.log('Updated questions.json and generated_docs.json');

// 6. Regenerate QUESTIONS.md
const topicMeta = {
  "Swift Internals & Advanced Types": { icon: "⚡", summary: "Memory layouts, Copy-on-Write, Existential Containers, Method Dispatch, Generics, and opaque types." },
  "Swift Concurrency & Async/Await": { icon: "🔀", summary: "Actors, Tasks, TaskGroups, AsyncSequence, Thread Sanitizer, and non-blocking concurrency." },
  "Modern Architecture & Patterns": { icon: "🏗️", summary: "VIPER, Clean Swift, Coordinator, TCA, State Machines, and Event-Driven systems." },
  "Auto Layout, UIKit & Modern SwiftUI": { icon: "📐", summary: "Constraint solving engine, intrinsic content size, priorities, iPad multitasking & adaptive size classes, Localizable string catalogs & RTL, and UICollectionView diffable data sources with compositional layouts." },
  "Combine & Reactive Streams": { icon: "🌊", summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles." },
  "Networking, APIs & Background Tasks": { icon: "🌐", summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, BGTaskScheduler, App Suspension & State Restoration." },
  "Modularity, Build & Launch Performance": { icon: "📦", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Data Persistence, SwiftData & Memory Deep Dive": { icon: "💾", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Security, App Hardening & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "System Design & Mobile Architecture": { icon: "🏛️", summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution." },
  "Testing, CI/CD & AI Engineering": { icon: "🧪", summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems." },
  "Engineering Leadership & Operations": { icon: "👔", summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern." },
  "Memory Management": { icon: "🧠", summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings & downsampling, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit." }
};

const diffBadge = {
  "Staff": "🟣 `Staff`",
  "Advanced": "🔴 `Advanced`",
  "Intermediate": "🔵 `Intermediate`",
  "Beginner": "🟢 `Beginner`"
};

const catGroups = {};
for (const q of questions) {
  if (!catGroups[q.category]) catGroups[q.category] = [];
  catGroups[q.category].push(q);
}

const mdLines = [];
mdLines.push("# 📱 iOS Senior & Staff Interview Question Bank");
mdLines.push("");
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, UICollectionView Diffable Data Sources & Compositional Layouts, Background Execution & State Restoration, Memory Management, System Design, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
mdLines.push("");
mdLines.push("## 📊 Overview");
mdLines.push("");
mdLines.push("| Category / Topic | Questions | Key Coverage |");
mdLines.push("|---|:---:|---|");

for (const [cat, qList] of Object.entries(catGroups)) {
  const summary = topicMeta[cat]?.summary || "";
  mdLines.push(`| **${cat}** | \`${qList.length}\` | ${summary} |`);
}

mdLines.push(`| **Total** | **\`${questions.length}\`** | Complete Senior & Staff iOS Interview Curriculum |`);
mdLines.push("");
mdLines.push("---");
mdLines.push("");

for (const [cat, qList] of Object.entries(catGroups)) {
  const meta = topicMeta[cat] || { icon: "📌", summary: "" };
  const startId = qList[0].id;
  const endId = qList[qList.length - 1].id;
  const rangeStr = startId !== endId ? `(${startId} – ${endId})` : `(${startId})`;
  mdLines.push(`## ${meta.icon} ${cat} ${rangeStr}`);
  mdLines.push("");
  mdLines.push(`> ${meta.summary}`);
  mdLines.push("");

  for (const q of qList) {
    mdLines.push(`### \`${q.id}\` — ${q.question}`);
    mdLines.push("");
    mdLines.push(`- **Difficulty:** ${diffBadge[q.difficulty] || q.difficulty}`);
    mdLines.push(`- **Category:** \`${q.category}\``);
    mdLines.push("");
    mdLines.push("> [!TIP]");
    mdLines.push("> **🗣️ Interview Pitch (Say it like this):**  ");
    mdLines.push(`> *"${q.interviewSentence}"*`);
    mdLines.push("");
    mdLines.push("#### 📖 Detailed Answer");
    mdLines.push("");
    mdLines.push(q.answer);
    mdLines.push("");
    mdLines.push("#### 💻 Swift Code Example");
    mdLines.push("");
    mdLines.push("```swift");
    mdLines.push(q.codeExample);
    mdLines.push("```");
    mdLines.push("");
    mdLines.push("---");
    mdLines.push("");
  }
}

fs.writeFileSync(QUESTIONS_MD_PATH, mdLines.join("\n"), 'utf-8');
console.log('Regenerated QUESTIONS.md successfully!');

// 7. Update index.html
let indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');

const scriptOpen = indexHtml.indexOf('<script>');
const scriptClose = indexHtml.lastIndexOf('</script>');
const preScript = indexHtml.substring(0, scriptOpen);
const postScript = indexHtml.substring(scriptClose + 9);
const scriptBody = indexHtml.substring(scriptOpen + 8, scriptClose);

let newScript = scriptBody;
newScript = newScript.replace(
  /const QUESTIONS = \[[\s\S]*?\];\n/,
  () => `const QUESTIONS = ${JSON.stringify(questions)};\n`
);
newScript = newScript.replace(
  /const QUESTION_TO_DOCS = \{[\s\S]*?\};\n/,
  () => `const QUESTION_TO_DOCS = ${JSON.stringify(generatedDocs.QUESTION_TO_DOCS)};\n`
);

// Validate newScript syntax
try {
  new vm.Script(newScript, { filename: 'dashboard-bundle.js' });
  console.log('VALIDATION PASSED: 100% Valid JavaScript Syntax! No errors!');
} catch (e) {
  console.error('VALIDATION FAILED in newScript:', e);
  process.exit(1);
}

const finalHtml = `${preScript}<script>${newScript}</script>${postScript}`;
fs.writeFileSync(INDEX_PATH, finalHtml, 'utf-8');
console.log(`Successfully updated index.html!`);
