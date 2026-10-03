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

// 2. Find Q-53
const qIndex = questions.findIndex(q => q.id === 'Q-53');
if (qIndex === -1) {
  console.error('Could not find Q-53!');
  process.exit(1);
}
console.log('Found Q-53 at index:', qIndex, '-', questions[qIndex].question);

// 3. Define the updated Q-53
const updatedQuestion = {
  id: "Q-53",
  category: "System Design & Mobile Architecture",
  difficulty: "Advanced",
  question: "How do you load and cache images at scale?",
  interviewSentence: "Check memory, then disk, then network; shrink images to the display size; share and cancel downloads; and load in the background with prefetching.",
  answer: `Apps like shopping, social, and news show hundreds of images in lists and grids. If I download and decode every image again each time, the app gets slow, uses a lot of data, and can run out of memory. So the idea is simple: download once, keep a small copy, and reuse it.

Say it like this:
"My image loader does four simple things.

First, it uses two caches. A memory cache for fast access while the app is open, and a disk cache so images are still there after the app restarts. I check memory first, then disk, and only then go to the network.

Second, it makes images smaller. A photo can be 4000 pixels wide, but the screen shows it at 100 points. I downsample it to the display size, so it uses much less memory.

Third, it avoids duplicate work. If three cells ask for the same URL, I make only one download and share the result. When a cell scrolls away, I cancel its download.

Fourth, it loads in the background. Download and decode happen off the main thread, and I set the image on the main thread. I also prefetch images for cells that are about to appear, so scrolling feels smooth.

In a real project, I can use a library like Kingfisher or Nuke, because they already do all of this well. In an interview, I explain that I know how it works inside, and I only build my own if there is a special need."

The 4 Core Pillars of Image Caching at Scale:
1. Two-Tier Caching (Memory & Disk):
   - Memory Cache (L1): Instant RAM lookup using NSCache<NSURL, UIImage>. Configure countLimit (e.g. 200 items) and totalCostLimit (~100 MB). NSCache automatically evicts items under memory pressure and is natively thread-safe.
   - Disk Cache (L2): Persistent storage using URLCache (configured on URLSessionConfiguration) or a dedicated directory in Library/Caches. Preserves downloaded images across app restarts.
2. Image Downsampling (Image I/O):
   - Avoid UIImage(data:), which decompresses the full 12MP–48MP bitmap in memory.
   - Use Image I/O CGImageSourceCreateThumbnailAtIndex with kCGImageSourceShouldCacheImmediately: true to downscale directly to the target point dimensions off the main thread.
3. Request Coalescing & Cancellation:
   - Coalescing: Maintain an active inFlight dictionary [URL: Task<UIImage?, Never>] inside a Swift actor. If multiple cells request the same avatar or product URL, share the identical Task.
   - Cancellation: In prepareForReuse(), cancel the cell's active Task so scrolled-away rows stop consuming network bandwidth.
4. Background Execution & Prefetching:
   - Network I/O and thumbnail decoding run asynchronously on cooperative background threads.
   - Use UICollectionViewDataSourcePrefetching (prefetchItemsAt) to start downloading images 5–10 rows before they scroll into the visible viewport.

Quick steps to remember:
1. Cache in two layers: memory first, then disk, then network.
2. Shrink: downsample to the display size.
3. Share: one download for many requests, cancel when not needed.
4. Background: download and decode off the main thread.
5. Prefetch: start loading before the cell appears.

Good to mention (Staff-Level Interview Points):
• Byte Cost in Memory: A decoded bitmap consumes width × height × 4 bytes in RAM regardless of compressed file size. A 4000×3000 photo is ~48 MB in memory!
• NSCache vs Dictionary: NSCache auto-evicts items on memory warnings, does not copy keys, and is thread-safe without manual NSLocking.
• Compound Cache Keys: Include pixel dimensions in cache keys (e.g. "url_w300_h300") so thumbnails and full-size images don't overwrite each other.
• Server-Side Resizing & Modern Formats: Recommend dynamic CDN query parameters (?w=300&fmt=webp) and modern formats like HEIC or WebP to save cellular bandwidth.
• Visual Polish: Provide placeholder images and subtle crossfade animations to eliminate jarring visual pops during fast scrolling.
• SwiftUI AsyncImage Limitations: AsyncImage lacks persistent disk caching; for production feed lists, use Nuke, Kingfisher, or a custom actor-based pipeline.
• Disk Cache Eviction: Enforce maximum disk quota and LRU (Least Recently Used) cleanup based on access timestamps so disk usage doesn't balloon.

One-liner: Check memory, then disk, then network; shrink images to the display size; share and cancel downloads; and load in the background with prefetching.

Memory trick: C-S-S-B-P → "Cache two layers, Shrink, Share, Background, Prefetch."`,
  codeExample: `// =========================================================================
// SENIOR INTERVIEW ARCHITECTURE: Scalable Image Loading & Caching Pipeline (C-S-S-B-P)
// =========================================================================
import UIKit
import ImageIO

// =========================================================================
// 1. TWO-TIER CACHE: Memory (NSCache) & Disk (URLCache / File System)
// =========================================================================
// SENIOR TALKING POINT:
// Decoded bitmaps in memory cost width × height × 4 bytes (RGBA8888).
// A 4000×3000 photo is ~48 MB in RAM!
// NSCache automatically purges objects on UIApplication.didReceiveMemoryWarningNotification
// and is natively thread-safe without requiring locks.
final class ImageCacheConfiguration {
    static let shared = ImageCacheConfiguration()

    // L1: Memory Cache with count and byte cost limits
    let memoryCache: NSCache<NSURL, UIImage> = {
        let cache = NSCache<NSURL, UIImage>()
        cache.countLimit = 200                    // Max 200 images in RAM
        cache.totalCostLimit = 100 * 1024 * 1024  // ~100 MB RAM budget
        return cache
    }()

    // L2: Disk Cache using URLCache on URLSessionConfiguration
    let customSession: URLSession = {
        let config = URLSessionConfiguration.default
        config.urlCache = URLCache(
            memoryCapacity: 20_000_000,           // 20 MB RAM buffer
            diskCapacity: 200_000_000,            // 200 MB on-disk persistence
            diskPath: "scaled_images_cache"
        )
        config.requestCachePolicy = .returnCacheDataElseLoad
        return URLSession(configuration: config)
    }()
}

// =========================================================================
// 2. IMAGE I/O DOWNSAMPLING: Decode Directly to Display Geometry
// =========================================================================
// SENIOR TALKING POINT:
// UIImage(data:) decodes full-resolution JPEG/PNG into an uncompressed bitmap
// on the main thread, spiking memory and causing scroll hitches.
// Image I/O CGImageSourceCreateThumbnailAtIndex creates a pre-scaled thumbnail
// and forces decoding off the main thread via kCGImageSourceShouldCacheImmediately.
func downsample(data: Data, maxPixel: CGFloat) -> UIImage? {
    let options: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceCreateThumbnailWithTransform: true,  // Respect EXIF rotation
        kCGImageSourceShouldCacheImmediately: true,      // Force background decode
        kCGImageSourceThumbnailMaxPixelSize: maxPixel      // Scale down to screen dimensions
    ]
    guard let source = CGImageSourceCreateWithData(data as CFData, nil),
          let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
    else { return nil }
    return UIImage(cgImage: cgImage)
}

// =========================================================================
// 3. THREAD-SAFE LOADER & REQUEST COALESCING: Swift Actor
// =========================================================================
// SENIOR TALKING POINT:
// Request Coalescing prevents duplicate downloads when 5 cells request the same URL.
// We maintain an inFlight dictionary [URL: Task] inside an actor boundary
// so concurrent requests await the identical background Task.
actor ImageLoader {
    static let shared = ImageLoader()
    private let cache = ImageCacheConfiguration.shared.memoryCache
    private var inFlight: [URL: Task<UIImage?, Never>] = [:]

    func image(for url: URL, maxPixel: CGFloat) async -> UIImage? {
        // Step 1: Check L1 Memory Cache (Fastest RAM path)
        if let cached = cache.object(forKey: url as NSURL) {
            return cached
        }

        // Step 2: Request Coalescing — if already downloading, await that existing task!
        if let ongoingTask = inFlight[url] {
            return await ongoingTask.value
        }

        // Step 3: Initiate single download, downsample, and store
        let task = Task<UIImage?, Never> {
            guard let (data, _) = try? await ImageCacheConfiguration.shared.customSession.data(from: url),
                  let image = downsample(data: data, maxPixel: maxPixel)
            else { return nil }
            return image
        }

        inFlight[url] = task
        let image = await task.value
        inFlight[url] = nil // Clear deduplication map once finished

        // Cache the downscaled decoded bitmap in memory
        if let image {
            let cost = Int(image.size.width * image.size.height * 4)
            cache.setObject(image, forKey: url as NSURL, cost: cost)
        }
        return image
    }
}

// =========================================================================
// 4. CELL REUSE & TASK CANCELLATION: Prevent Stale Work
// =========================================================================
// SENIOR TALKING POINT:
// As cells are recycled, in-flight image tasks MUST be cancelled in prepareForReuse().
// Otherwise, stale downloads consume network bandwidth and overwrite new cell content.
final class ProductCell: UICollectionViewCell {
    static let reuseIdentifier = "ProductCell"
    private let imageView = UIImageView()
    private var loadTask: Task<Void, Never>?

    override init(frame: CGRect) {
        super.init(frame: frame)
        contentView.addSubview(imageView)
        imageView.frame = contentView.bounds
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
    }
    
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    func configure(url: URL, loader: ImageLoader = .shared) {
        imageView.image = nil // Clear previous image immediately
        
        loadTask = Task {
            let image = await loader.image(for: url, maxPixel: 300)
            // Verify task was not cancelled while cell was recycled
            if !Task.isCancelled {
                await MainActor.run {
                    self.imageView.image = image
                }
            }
        }
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        loadTask?.cancel()  // Cell scrolled offscreen: stop downloading immediately!
        loadTask = nil
        imageView.image = nil
    }
}

// =========================================================================
// 5. PREFETCHING PIPELINE: Smooth 120Hz Scrolling
// =========================================================================
// SENIOR TALKING POINT:
// UICollectionViewDataSourcePrefetching starts downloads 5-10 rows ahead of the visible viewport.
// When cells scroll onto the screen, the image is already decoded in memory.
extension ProductFeedViewController: UICollectionViewDataSourcePrefetching {
    func collectionView(_ collectionView: UICollectionView, prefetchItemsAt indexPaths: [IndexPath]) {
        for indexPath in indexPaths {
            let imageURL = products[indexPath.item].thumbnailURL
            Task {
                _ = await ImageLoader.shared.image(for: imageURL, maxPixel: 300)
            }
        }
    }
    
    func collectionView(_ collectionView: UICollectionView, cancelPrefetchingForItemsAt indexPaths: [IndexPath]) {
        // Optional: Cancel low-priority prefetch tasks if user changes direction
    }
}`
};

// Replace Q-53 with updatedQuestion
questions[qIndex] = updatedQuestion;

// 4. Save questions.json
fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
console.log('Saved questions.json successfully!');

// 5. Update generated_docs.json mapping for Q-53
generatedDocs.QUESTION_TO_DOCS["Q-53"] = [
  {
    docId: "networking-architecture",
    title: "Networking Architecture Decision Table & 4 Pillars",
    icon: "🌐",
    filename: "NetworkingArchitecture-DecisionTable.md"
  },
  {
    docId: "performance-profiling",
    title: "Performance Profiling & Instruments — Talking Points",
    icon: "⏱️",
    filename: "PerformanceProfiling-TalkingPoints.md"
  }
];

fs.writeFileSync(GENERATED_DOCS_PATH, JSON.stringify(generatedDocs, null, 2), 'utf-8');
console.log('Updated generated_docs.json successfully!');

// 6. Regenerate QUESTIONS.md
const topicMeta = {
  "Swift Internals & Advanced Types": { icon: "⚡", summary: "Memory layouts, Copy-on-Write, Existential Containers, Method Dispatch, Generics, and opaque types." },
  "Swift Concurrency & Async/Await": { icon: "🔀", summary: "Actors, Tasks, TaskGroups, AsyncSequence, Thread Sanitizer, and non-blocking concurrency." },
  "Modern Architecture & Patterns": { icon: "🏗️", summary: "VIPER, Clean Swift, Coordinator, TCA, State Machines, and Event-Driven systems." },
  "Auto Layout, UIKit & Modern SwiftUI": { icon: "📐", summary: "Constraint solving engine, intrinsic content size, priorities, iPad multitasking & adaptive size classes, Localizable string catalogs & RTL, and UICollectionView diffable data sources with compositional layouts." },
  "Combine & Reactive Streams": { icon: "🌊", summary: "Reactive streams, Publishers, Subscribers, Backpressure, Subject types, Debounce vs Throttle, and cancellation lifecycles." },
  "Networking, APIs & Background Tasks": { icon: "🌐", summary: "URLSession abstractions, REST vs GraphQL contract-driven schemas, token refresh interceptors, silent APNs pushes, Notification Service Extensions, BGTaskScheduler, App Suspension & State Restoration." },
  "Modularity & Launch Performance": { icon: "📦", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Modularity, Build & Launch Performance": { icon: "📦", summary: "SPM multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction cascades, binary caching, app thinning, and Instruments profiling." },
  "Data Persistence, SwiftData & Memory Deep Dive": { icon: "💾", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Data Persistence & Memory Management": { icon: "💾", summary: "Core Data vs SQLite vs Realm vs SwiftData, multi-context concurrency & merging, ARC retain cycles, Heap side tables (weak/unowned), and OS Jetsam OOM survival." },
  "Security, App Hardening & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "Security, Auth & Compliance": { icon: "🔒", summary: "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric auth, Jailbreak & Frida detection, NSFileProtectionComplete, and banking compliance (PCI-DSS, SOX, GDPR)." },
  "System Design & Mobile Architecture": { icon: "🏛️", summary: "End-to-end mobile system design: Two-tier LRU memory/disk image caching with coalescing, and Offline-First bi-directional syncing with outbox pattern and LWW conflict resolution." },
  "Testing, CI/CD & AI Engineering": { icon: "🧪", summary: "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems." },
  "Engineering Leadership & Operations": { icon: "👔", summary: "Production incident triage, Crashlytics velocity alerts, MetricKit crash loops, blameless post-mortems, and migrating legacy monoliths using the Strangler Fig pattern." },
  "Memory Management": { icon: "🧠", summary: "ARC strong/weak/unowned, retain cycles, stack vs heap, Copy-on-Write internals, memory warnings, the Swift runtime side table, Jetsam OOM survival, and production memory profiling with Instruments and MetricKit." }
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
mdLines.push(`> A comprehensive, senior & staff-level revision suite for ${questions.length} iOS interview questions covering Swift internals, Concurrency, Architecture, Auto Layout & Adaptive iPad Design, Localization & RTL, UICollectionView Diffable Data Sources & Compositional Layouts, Background Execution & State Restoration, Performance Profiling & Instruments, 60/120fps Scroll Hitch Elimination, Memory Management, System Design & Scalable Image Caching, and Engineering Leadership. Each question includes a spoken pitch, in-depth technical breakdown, and real-world Swift code with interview talking points.`);
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

// Validate script syntax
try {
  new vm.Script(newScript, { filename: 'dashboard-bundle.js' });
  console.log('VALIDATION PASSED: 100% Valid JavaScript Syntax! No errors!');
} catch (e) {
  console.error('VALIDATION FAILED in newScript:', e);
  process.exit(1);
}

const finalHtml = `${preScript}<script>${newScript}</script>${postScript}`;
fs.writeFileSync(INDEX_PATH, finalHtml, 'utf-8');
console.log(`Successfully updated index.html with updated Q-53!`);
