#!/usr/bin/env python3
import os
import glob
import json
import re
import html

# Metadata mapping for all 24 module markdown files
MODULE_METADATA = {
    "Architecture/CleanArchitecture/CleanArch-README.md": {
        "id": "clean-architecture",
        "title": "Clean Architecture — Interview Cheat Sheet",
        "category": "Architecture",
        "icon": "🧅",
        "relatedQuestions": ["Q-01"],
        "summary": "Entities, Use Cases, Presenters, and data flow in Clean Architecture with Dependency Inversion."
    },
    "Architecture/CoordinatorPattern/Coordinator-README.md": {
        "id": "coordinator-pattern",
        "title": "Coordinator Pattern — Interview Cheat Sheet",
        "category": "Architecture",
        "icon": "🧭",
        "relatedQuestions": ["Q-05"],
        "summary": "Extracting navigation and routing out of Views/ViewModels. NavigationStack vs Coordinator interview breakdown."
    },
    "Architecture/DependencyInjection/DI-README.md": {
        "id": "dependency-injection",
        "title": "Dependency Injection (DI) — Interview Cheat Sheet",
        "category": "Architecture",
        "icon": "💉",
        "relatedQuestions": ["Q-03"],
        "summary": "Constructor vs property injection, protocol mocking, and container setups for unit testing."
    },
    "Architecture/MVVM/MVVM-TalkingPoints.md": {
        "id": "mvvm",
        "title": "MVVM (Model-View-ViewModel) — Talking Points",
        "category": "Architecture",
        "icon": "📐",
        "relatedQuestions": ["Q-01"],
        "summary": "State binding, single source of truth, testability, and avoiding massive view controllers in SwiftUI."
    },
    "Architecture/ModularArchitecture/ModularArchitecture-TalkingPoints.md": {
        "id": "modular-architecture",
        "title": "Modular App Architecture — Talking Points",
        "category": "Architecture",
        "icon": "📦",
        "relatedQuestions": ["Q-26", "Q-27", "Q-30"],
        "summary": "Interface vs Implementation targets, static vs dynamic linkage launch effects, and compile-time isolation."
    },
    "Architecture/RepositoryPattern/RepositoryPattern-TalkingPoints.md": {
        "id": "repository-pattern",
        "title": "Repository Pattern — Talking Points",
        "category": "Architecture",
        "icon": "🗄️",
        "relatedQuestions": ["Q-49", "Q-23"],
        "summary": "Single source of truth abstraction between local databases (Core Data/SQLite) and remote REST/GraphQL APIs."
    },
    "Architecture/SOLIDPrinciples/SOLID-README.md": {
        "id": "solid-principles",
        "title": "SOLID Principles — Interview Cheat Sheet",
        "category": "Architecture",
        "icon": "🧱",
        "relatedQuestions": ["Q-04"],
        "summary": "Single Responsibility, Open/Closed, Liskov, Interface Segregation, and Dependency Inversion with Swift examples."
    },
    "Architecture/VIPERPattern/VIPER-README.md": {
        "id": "viper-pattern",
        "title": "VIPER Architecture — Interview Cheat Sheet",
        "category": "Architecture",
        "icon": "🐍",
        "relatedQuestions": ["Q-02"],
        "summary": "View, Interactor, Presenter, Entity, Router breakdown for enterprise teams."
    },
    "AutoLayoutBasics/AutoLayoutBasics-TalkingPoints.md": {
        "id": "autolayout-basics",
        "title": "Auto Layout Basics — Talking Points",
        "category": "UI & Layout",
        "icon": "📐",
        "relatedQuestions": ["Q-19"],
        "summary": "Cassowary constraint solver, intrinsic content size, hugging vs compression resistance, and UIKit layout passes."
    },
    "ComposableUI/ComposableUI-TalkingPoints.md": {
        "id": "composable-ui",
        "title": "Composable UI Decomposition — Talking Points",
        "category": "UI & Layout",
        "icon": "🧩",
        "relatedQuestions": ["Q-20"],
        "summary": "Decomposing 500-line monolithic screens into atomic design system components with isolated view models."
    },
    "ConcurrencyIssues/ConcurrencyIssues-ComparisonNotes.md": {
        "id": "concurrency-issues",
        "title": "Concurrency Issues Diagnosis Table",
        "category": "Concurrency & Threading",
        "icon": "⚠️",
        "relatedQuestions": ["Q-09"],
        "summary": "Race conditions, deadlocks, livelocks, priority inversions, and thread explosion troubleshooting."
    },
    "DataPersistence/DataPersistence-ComparisonNotes.md": {
        "id": "data-persistence",
        "title": "Data Persistence & Offline Sync Decision Table",
        "category": "Data & Storage",
        "icon": "💾",
        "relatedQuestions": ["Q-31"],
        "summary": "UserDefaults vs Keychain vs SQLite vs Core Data vs Realm vs SwiftData, plus offline outbox sync patterns."
    },
    "DesignSystem/DesignSystem-TalkingPoints.md": {
        "id": "design-system",
        "title": "Design System & Shared UI Library — Talking Points",
        "category": "UI & Layout",
        "icon": "🎨",
        "relatedQuestions": ["Q-20"],
        "summary": "Typography scales, semantic tokens, snapshot testing, WCAG contrast compliance, and accessibility."
    },
    "Leadership/DevelopmentLeadOwnership-TalkingPoints.md": {
        "id": "leadership-ownership",
        "title": "Development Lead / Feature Ownership — Talking Points",
        "category": "Leadership & Process",
        "icon": "👔",
        "relatedQuestions": ["Q-38", "Q-39", "Q-40"],
        "summary": "End-to-end technical leadership, cross-functional alignment, regulatory compliance (PCI-DSS, SOX, GDPR)."
    },
    "Multithreading/Multithreading-README.md": {
        "id": "multithreading-gcd",
        "title": "iOS Concurrency & GCD Reference",
        "category": "Concurrency & Threading",
        "icon": "⚡",
        "relatedQuestions": ["Q-06", "Q-07", "Q-08"],
        "summary": "GCD queues, DispatchWorkItem, DispatchGroup, Semaphore, barrier flags, and modern Swift Actor migration."
    },
    "Networking/Networking-ComparisonNotes.md": {
        "id": "networking-architecture",
        "title": "Networking Architecture Decision Table & 4 Pillars",
        "category": "Networking & APIs",
        "icon": "🌐",
        "relatedQuestions": ["Q-23"],
        "summary": "Decision table for URLSession vs custom stack vs interceptors, plus retries, auth refresh, caching, cancellation."
    },
    "OperationQueueBasics/OperationQueue-ComparisonNotes.md": {
        "id": "operation-queue",
        "title": "OperationQueue vs Grand Central Dispatch Decision Table",
        "category": "Concurrency & Threading",
        "icon": "⛓️",
        "relatedQuestions": ["Q-10"],
        "summary": "Dependency graphs, priority, maxConcurrentOperationCount, and cancellation in OperationQueue."
    },
    "PerformanceProfiling/PerformanceProfiling-TalkingPoints.md": {
        "id": "performance-profiling",
        "title": "Performance Profiling & Instruments — Talking Points",
        "category": "Performance & Profiling",
        "icon": "⏱️",
        "relatedQuestions": ["Q-29", "Q-28"],
        "summary": "Time Profiler, Allocations, Leaks, Thread Sanitizer, and memory footprint optimization."
    },
    "Security/Security-ComparisonNotes.md": {
        "id": "security-comparison",
        "title": "Security Decision Table (Keychain, Enclave, Pinning)",
        "category": "Security & Compliance",
        "icon": "🛡️",
        "relatedQuestions": ["Q-35", "Q-36", "Q-37"],
        "summary": "Keychain vs Secure Enclave vs App Transport Security vs Certificate Pinning vs Biometrics."
    },
    "SwiftUIInteroperability/Interoperability-README.md": {
        "id": "swiftui-uikit-interop",
        "title": "SwiftUI & UIKit Interoperability — Cheat Sheet",
        "category": "UI & Layout",
        "icon": "🤝",
        "relatedQuestions": ["Q-18"],
        "summary": "UIHostingController, UIViewRepresentable, UIViewControllerRepresentable, Coordinators, and state bridging."
    },
    "SwiftUIStateManagement/StateManagement-README.md": {
        "id": "swiftui-state",
        "title": "SwiftUI State Management — Cheat Sheet",
        "category": "UI & Layout",
        "icon": "🔄",
        "relatedQuestions": ["Q-22", "Q-01"],
        "summary": "@State, @Binding, @StateObject, @ObservedObject, @EnvironmentObject, and iOS 17 @Observable macro."
    },
    "Testing/Testing-TalkingPoints.md": {
        "id": "testing-xctest",
        "title": "Testing, TDD/BDD, and Testability — Talking Points",
        "category": "Testing & Quality",
        "icon": "🧪",
        "relatedQuestions": ["Q-48", "Q-49"],
        "summary": "Unit vs UI testing, mocks vs stubs vs spies, protocol injection, and Given/When/Then BDD methodology."
    },
    "ThreadSafety/ThreadSafety-ComparisonNotes.md": {
        "id": "thread-safety",
        "title": "Thread Safety Primitives Decision Table",
        "category": "Concurrency & Threading",
        "icon": "🔒",
        "relatedQuestions": ["Q-11"],
        "summary": "Serial DispatchQueue vs NSLock vs NSRecursiveLock vs os_unfair_lock vs Swift Actors."
    },
    "iOSInternals/iOSInternals-TalkingPoints.md": {
        "id": "ios-internals",
        "title": "iOS Internals — Interview Talking Points",
        "category": "Internals & Lifecycle",
        "icon": "⚙️",
        "relatedQuestions": ["Q-13"],
        "summary": "dyld dynamic linker, UIApplicationMain, Run Loops (kCFRunLoopCommonModes), and watchdog crash prevention."
    }
}

# The Structured Senior iOS Topics
TOPIC_CATEGORIES = [
    {
        "id": "architecture",
        "title": "Architecture & Design Patterns",
        "shortTitle": "Architecture",
        "icon": "🏗️",
        "color": "#6366f1",
        "summary": "Enterprise presentation patterns (MVVM, Clean Architecture, VIPER), Coordinator routing, Dependency Injection, and SOLID principles.",
        "docIds": [
            "clean-architecture",
            "coordinator-pattern",
            "dependency-injection",
            "mvvm",
            "repository-pattern",
            "solid-principles",
            "viper-pattern"
        ],
        "questionIds": ["Q-01", "Q-02", "Q-03", "Q-04", "Q-05"]
    },
    {
        "id": "concurrency",
        "title": "Swift Concurrency & Multithreading",
        "shortTitle": "Swift Concurrency",
        "icon": "⚡",
        "color": "#f59e0b",
        "summary": "Swift Actors, async/await, Structured Concurrency, Task Groups, synchronization locks, GCD queues, and race conditions.",
        "docIds": [
            "multithreading-gcd",
            "concurrency-issues",
            "thread-safety",
            "operation-queue"
        ],
        "questionIds": ["Q-06", "Q-07", "Q-08", "Q-09", "Q-10", "Q-11"]
    },
    {
        "id": "advance-swift",
        "title": "Advance Swift & iOS Internals",
        "shortTitle": "Advance Swift",
        "icon": "🚀",
        "color": "#ec4899",
        "summary": "Protocol-Oriented Programming, dynamic linker dyld, Run Loops, app launch lifecycle, and SwiftUI/UIKit interoperability.",
        "docIds": [
            "ios-internals",
            "swiftui-state",
            "swiftui-uikit-interop"
        ],
        "questionIds": ["Q-12", "Q-13", "Q-18"]
    },
    {
        "id": "swift-basics-ui",
        "title": "Swift Basics & UI Layout",
        "shortTitle": "Swift Basics",
        "icon": "🎨",
        "color": "#8b5cf6",
        "summary": "Auto Layout Cassowary solver, Dynamic Type, accessibility (a11y) compliance, and decomposing monolithic screens into atomic components.",
        "docIds": [
            "autolayout-basics",
            "composable-ui",
            "design-system"
        ],
        "questionIds": ["Q-19", "Q-20"]
    },
    {
        "id": "networking",
        "title": "Networking & API Integration",
        "shortTitle": "Networking",
        "icon": "🌐",
        "color": "#10b981",
        "summary": "URLSession abstractions, REST vs GraphQL, contract-driven API schemas, token refresh interceptors, and caching policies.",
        "docIds": [
            "networking-architecture"
        ],
        "questionIds": ["Q-23", "Q-24"]
    },
    {
        "id": "modularity-performance",
        "title": "Modularity, Build & Launch Performance",
        "shortTitle": "Modularity & Perf",
        "icon": "📦",
        "color": "#06b6d4",
        "summary": "Swift Package Manager multi-module boundaries, static vs dynamic linkage launch effects, build-time reduction, app thinning, and Instruments profiling.",
        "docIds": [
            "modular-architecture",
            "performance-profiling"
        ],
        "questionIds": ["Q-26", "Q-27", "Q-28", "Q-29", "Q-30"]
    },
    {
        "id": "data-memory",
        "title": "Data Persistence & Memory Management",
        "shortTitle": "Data & Memory",
        "icon": "💾",
        "color": "#a855f7",
        "summary": "Core Data vs SQLite vs Realm, offline sync outbox patterns, ARC memory management, and retain cycle diagnostics.",
        "docIds": [
            "data-persistence"
        ],
        "questionIds": ["Q-31", "Q-32"]
    },
    {
        "id": "security-compliance",
        "title": "Security, Auth & Regulatory Compliance",
        "shortTitle": "Security & Compliance",
        "icon": "🔒",
        "color": "#f43f5e",
        "summary": "Keychain vs Secure Enclave, SSL Certificate Pinning, biometric authentication, and banking regulations (PCI-DSS, SOX, GDPR).",
        "docIds": [
            "security-comparison",
            "leadership-ownership"
        ],
        "questionIds": ["Q-35", "Q-36", "Q-37", "Q-38", "Q-39", "Q-40"]
    },
    {
        "id": "testing-ci-cd",
        "title": "Testing, CI/CD & AI Engineering",
        "shortTitle": "Testing & AI",
        "icon": "🧪",
        "color": "#38bdf8",
        "summary": "Unit and UI testing with XCTest, protocol mocking and stubbing, TDD/BDD, automated CI/CD pipelines, feature flagging, and hybrid cloud/on-device AI systems.",
        "docIds": [
            "testing-xctest"
        ],
        "questionIds": ["Q-44", "Q-45", "Q-46", "Q-47", "Q-48", "Q-49", "Q-50", "Q-51"]
    }
]

def parse_markdown_to_html(md_text):
    lines = md_text.splitlines()
    html_out = []
    in_code_block = False
    code_lang = ""
    code_lines = []

    def format_inline(text):
        text = html.escape(text)
        text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
        text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
        text = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", text)
        text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"<a href=\"\2\" target=\"_blank\" rel=\"noopener\">\1</a>", text)
        return text

    i = 0
    while i < len(lines):
        line = lines[i]
        trimmed = line.strip()

        # Code block fence
        if trimmed.startswith("```"):
            if not in_code_block:
                in_code_block = True
                code_lang = trimmed[3:].strip() or "swift"
                code_lines = []
            else:
                in_code_block = False
                escaped_code = html.escape("\n".join(code_lines))
                html_out.append(f"""<div class="code-container">
  <div class="code-header">
    <span>{code_lang.upper()}</span>
    <button class="copy-btn" onclick="copyCodeFromElement(this)">Copy Code</button>
  </div>
  <pre><code>{escaped_code}</code></pre>
</div>""")
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # Tables
        if "|" in line and (line.startswith("|") or line.strip().endswith("|")):
            table_lines = []
            while i < len(lines) and "|" in lines[i] and (lines[i].strip().startswith("|") or lines[i].strip().endswith("|")):
                table_lines.append(lines[i].strip())
                i += 1
            if len(table_lines) >= 2:
                headers = [c.strip() for c in table_lines[0].strip("|").split("|")]
                sep_line = table_lines[1]
                rows_start = 2 if re.match(r"^[:\-\|\s]+$", sep_line) else 1
                rows = []
                for r_line in table_lines[rows_start:]:
                    cells = [c.strip() for c in r_line.strip("|").split("|")]
                    rows.append(cells)
                
                tbl_html = ["<div class=\"table-responsive\"><table class=\"doc-table\"><thead><tr>"]
                for h in headers:
                    tbl_html.append(f"<th>{format_inline(h)}</th>")
                tbl_html.append("</tr></thead><tbody>")
                for r in rows:
                    tbl_html.append("<tr>")
                    for cell in r:
                        formatted_cell = format_inline(cell).replace("&lt;br&gt;", "<br>").replace("&lt;br/&gt;", "<br>").replace("&lt;br /&gt;", "<br>")
                        tbl_html.append(f"<td>{formatted_cell}</td>")
                    tbl_html.append("</tr>")
                tbl_html.append("</tbody></table></div>")
                html_out.append("".join(tbl_html))
                continue

        # Horizontal rule
        if re.match(r"^\s*(\-{3,}|\*{3,}|_{3,})\s*$", trimmed):
            html_out.append("<hr class=\"doc-divider\">")
            i += 1
            continue

        # Headings
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            level = len(m.group(1))
            heading_text = m.group(2).strip()
            slug = re.sub(r"[^a-zA-Z0-9]+", "-", heading_text.lower()).strip("-")
            html_out.append(f"<h{level} id=\"{slug}\" class=\"doc-heading doc-h{level}\">{format_inline(heading_text)}</h{level}>")
            i += 1
            continue

        # Blockquote / Alert callouts
        if trimmed.startswith(">"):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote_lines.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
            q_text = "<br>".join([format_inline(ql) for ql in quote_lines])
            
            callout_class = "doc-blockquote"
            if "🗣️" in q_text or "Spoken Interview Pitch" in q_text:
                callout_class = "doc-callout doc-pitch"
            elif "[!NOTE]" in q_text:
                callout_class = "doc-callout doc-note"
                q_text = q_text.replace("[!NOTE]", "<strong>NOTE:</strong>")
            elif "[!TIP]" in q_text:
                callout_class = "doc-callout doc-tip"
                q_text = q_text.replace("[!TIP]", "<strong>TIP:</strong>")
            elif "[!IMPORTANT]" in q_text:
                callout_class = "doc-callout doc-important"
                q_text = q_text.replace("[!IMPORTANT]", "<strong>IMPORTANT:</strong>")

            html_out.append(f"<blockquote class=\"{callout_class}\">{q_text}</blockquote>")
            continue

        # List items
        if re.match(r"^[\*\-]\s+(.*)$", trimmed) or re.match(r"^\d+\.\s+(.*)$", trimmed):
            list_items = []
            while i < len(lines) and (re.match(r"^[\*\-]\s+(.*)$", lines[i].strip()) or re.match(r"^\d+\.\s+(.*)$", lines[i].strip())):
                lm = re.match(r"^([\*\-]|\d+\.)\s+(.*)$", lines[i].strip())
                list_items.append(format_inline(lm.group(2)))
                i += 1
            list_html = ["<ul class=\"doc-list\">"]
            for li in list_items:
                list_html.append(f"<li>{li}</li>")
            list_html.append("</ul>")
            html_out.append("".join(list_html))
            continue

        # Empty lines
        if not trimmed:
            i += 1
            continue

        # Paragraph
        html_out.append(f"<p class=\"doc-paragraph\">{format_inline(line)}</p>")
        i += 1

    return "\n".join(html_out)

def sync_dashboard():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    questions_file = os.path.join(base_dir, "Resources", "questions.json")
    index_file = os.path.join(base_dir, "index.html")

    # 1. Load questions
    with open(questions_file, "r", encoding="utf-8") as f:
        questions = json.load(f)

    # 2. Build lookups
    question_to_docs = {}
    question_to_topic = {}
    doc_to_topic = {}

    for topic in TOPIC_CATEGORIES:
        for qid in topic["questionIds"]:
            question_to_topic[qid] = {
                "id": topic["id"],
                "title": topic["title"],
                "shortTitle": topic["shortTitle"],
                "icon": topic["icon"],
                "color": topic["color"]
            }
        for doc_id in topic["docIds"]:
            doc_to_topic[doc_id] = {
                "id": topic["id"],
                "title": topic["title"],
                "shortTitle": topic["shortTitle"],
                "icon": topic["icon"],
                "color": topic["color"]
            }
    
    # 3. Read and parse all 24 module markdown files
    module_docs = []
    for rel_path, meta in MODULE_METADATA.items():
        abs_path = os.path.join(base_dir, rel_path)
        if not os.path.exists(abs_path):
            print(f"Warning: {abs_path} does not exist!")
            continue
        with open(abs_path, "r", encoding="utf-8") as f:
            raw_content = f.read()

        html_content = parse_markdown_to_html(raw_content)
        folder = os.path.dirname(rel_path)
        filename = os.path.basename(rel_path)

        doc_entry = {
            "id": meta["id"],
            "title": meta["title"],
            "category": meta["category"],
            "icon": meta["icon"],
            "filePath": rel_path,
            "filename": filename,
            "folder": folder,
            "summary": meta["summary"],
            "relatedQuestions": meta["relatedQuestions"],
            "rawContent": raw_content,
            "htmlContent": html_content
        }
        module_docs.append(doc_entry)

        for q_id in meta["relatedQuestions"]:
            if q_id not in question_to_docs:
                question_to_docs[q_id] = []
            question_to_docs[q_id].append({
                "docId": meta["id"],
                "title": meta["title"],
                "filename": filename,
                "icon": meta["icon"]
            })

    print(f"Loaded {len(questions)} questions.")
    print(f"Loaded {len(module_docs)} module documents across {len(TOPIC_CATEGORIES)} Topics.")

    questions_json = json.dumps(questions)
    docs_json = json.dumps(module_docs)
    question_to_docs_json = json.dumps(question_to_docs)
    topic_categories_json = json.dumps(TOPIC_CATEGORIES)
    question_to_topic_json = json.dumps(question_to_topic)
    doc_to_topic_json = json.dumps(doc_to_topic)

    template = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Citi iOS Senior Interview Master Suite — All Questions by Topic</title>
  <meta name="description" content="Unified single-view senior iOS interview question bank: all {len(questions)} questions grouped by topic with expand/shrink toggles, spoken pitches, Swift code, and {len(module_docs)} companion architecture guides.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg-primary: #0a0d14;
      --bg-secondary: #121824;
      --bg-card: rgba(18, 24, 38, 0.85);
      --bg-card-hover: rgba(26, 34, 52, 0.95);
      --bg-code: #0b0f17;
      --border-color: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(99, 102, 241, 0.35);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-indigo: #6366f1;
      --accent-indigo-light: #818cf8;
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --accent-purple: #a855f7;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
      --shadow-md: 0 6px 16px rgba(0, 0, 0, 0.4);
      --shadow-lg: 0 12px 32px -8px rgba(0, 0, 0, 0.5);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --sidebar-width: 320px;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }}

    [data-theme="light"] {{
      --bg-primary: #f8fafc;
      --bg-secondary: #ffffff;
      --bg-card: rgba(255, 255, 255, 0.92);
      --bg-card-hover: #ffffff;
      --bg-code: #1e293b;
      --border-color: rgba(0, 0, 0, 0.08);
      --border-accent: rgba(99, 102, 241, 0.45);
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 6px 16px rgba(0, 0, 0, 0.08);
      --shadow-lg: 0 12px 28px -8px rgba(0, 0, 0, 0.12);
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: var(--font-sans);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
      transition: background-color 0.3s ease, color 0.3s ease;
      background-image: 
        radial-gradient(circle at 15% 10%, rgba(99, 102, 241, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 85% 20%, rgba(6, 182, 212, 0.07) 0%, transparent 40%),
        radial-gradient(circle at 50% 90%, rgba(168, 85, 247, 0.06) 0%, transparent 50%);
      background-attachment: fixed;
    }}

    /* Layout */
    .app-layout {{
      display: flex;
      max-width: 1540px;
      margin: 0 auto;
      padding: 1.5rem 1.5rem 5rem 1.5rem;
      gap: 2rem;
      position: relative;
      transition: all 0.3s ease;
    }}

    /* Sidebar Drawer */
    .sidebar-drawer {{
      width: var(--sidebar-width);
      flex-shrink: 0;
      position: sticky;
      top: 1.5rem;
      height: calc(100vh - 3rem);
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-md);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, margin 0.3s ease;
      z-index: 100;
      overflow: hidden;
    }}

    .app-layout.sidebar-hidden .sidebar-drawer {{
      transform: translateX(calc(-1 * var(--sidebar-width) - 2rem));
      margin-right: calc(-1 * var(--sidebar-width));
      opacity: 0;
      pointer-events: none;
    }}

    .sidebar-header {{
      padding: 1rem 1.25rem 0.75rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.02);
    }}

    .sidebar-title {{
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }}

    .sidebar-close-btn {{
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.15rem;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      transition: all 0.2s;
    }}

    .sidebar-close-btn:hover {{
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.08);
    }}

    .sidebar-search-box {{
      padding: 0.65rem 0.85rem;
      border-bottom: 1px solid var(--border-color);
    }}

    .sidebar-search-input {{
      width: 100%;
      padding: 0.45rem 0.75rem;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.82rem;
      outline: none;
      transition: border-color 0.2s;
    }}

    [data-theme="light"] .sidebar-search-input {{
      background: #f1f5f9;
    }}

    .sidebar-search-input:focus {{
      border-color: var(--accent-indigo);
    }}

    .sidebar-nav {{
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }}

    .sidebar-topic-group {{
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      margin-bottom: 0.4rem;
    }}

    .sidebar-topic-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.45rem 0.65rem;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.03);
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-primary);
      transition: all 0.15s ease;
    }}

    .sidebar-topic-header:hover {{
      background: rgba(99, 102, 241, 0.15);
      color: var(--accent-indigo-light);
    }}

    .sidebar-item {{
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.65rem 0.35rem 1.25rem;
      border-radius: var(--radius-sm);
      text-decoration: none;
      color: var(--text-secondary);
      font-size: 0.78rem;
      transition: all 0.15s ease;
      cursor: pointer;
      line-height: 1.35;
    }}

    .sidebar-item:hover {{
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
      transform: translateX(2px);
    }}

    [data-theme="light"] .sidebar-item:hover {{
      background: rgba(0, 0, 0, 0.04);
    }}

    .sidebar-item.active {{
      background: rgba(99, 102, 241, 0.15);
      color: var(--accent-indigo-light);
      border-left: 3px solid var(--accent-indigo);
      font-weight: 600;
    }}

    .sidebar-item.reviewed .sidebar-item-text {{
      opacity: 0.65;
    }}

    .sidebar-id-badge {{
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      flex-shrink: 0;
    }}

    .sidebar-item.active .sidebar-id-badge {{
      background: var(--accent-indigo);
      color: #ffffff;
    }}

    .sidebar-item-text {{
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}

    .sidebar-check {{
      font-size: 0.72rem;
      color: var(--accent-emerald);
      flex-shrink: 0;
    }}

    /* Main Area */
    .main-area {{
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }}

    header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      gap: 1.5rem;
    }}

    .header-content h1 {{
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, var(--accent-indigo-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.35rem;
    }}

    [data-theme="light"] .header-content h1 {{
      background: linear-gradient(135deg, #0f172a 0%, #334155 50%, var(--accent-indigo) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}

    .header-content p {{
      color: var(--text-secondary);
      font-size: 0.95rem;
      max-width: 820px;
    }}

    .header-actions {{
      display: flex;
      gap: 0.6rem;
      align-items: center;
      flex-shrink: 0;
    }}

    .header-btn {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.5rem 0.95rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      transition: all 0.2s ease;
    }}

    .header-btn:hover {{
      background: var(--bg-card-hover);
      border-color: var(--border-accent);
      transform: translateY(-1px);
    }}

    /* Global Progress Tracker */
    .progress-banner {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      box-shadow: var(--shadow-sm);
      backdrop-filter: blur(16px);
    }}

    .progress-info {{
      display: flex;
      gap: 1.5rem;
      align-items: center;
      flex-wrap: wrap;
    }}

    .stat-pill {{
      display: flex;
      flex-direction: column;
    }}

    .stat-value {{
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.2;
    }}

    .stat-label {{
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }}

    .progress-bar-wrap {{
      flex: 1;
      max-width: 320px;
    }}

    .progress-bar-bg {{
      background: rgba(255, 255, 255, 0.08);
      height: 8px;
      border-radius: 999px;
      overflow: hidden;
    }}

    [data-theme="light"] .progress-bar-bg {{
      background: rgba(0, 0, 0, 0.08);
    }}

    .progress-bar-fill {{
      background: linear-gradient(90deg, var(--accent-indigo) 0%, var(--accent-cyan) 100%);
      height: 100%;
      width: 0%;
      border-radius: 999px;
      transition: width 0.4s ease;
    }}

    .reset-progress-btn {{
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }}

    .reset-progress-btn:hover {{
      color: var(--accent-rose);
      border-color: rgba(244, 63, 94, 0.3);
      background: rgba(244, 63, 94, 0.05);
    }}

    /* Global Search and Toolbar */
    .toolbar-section {{
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }}

    .search-input-wrap {{
      position: relative;
      width: 100%;
    }}

    .search-input {{
      width: 100%;
      padding: 0.85rem 1rem 0.85rem 2.75rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 0.95rem;
      outline: none;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
    }}

    .search-input:focus {{
      border-color: var(--accent-indigo);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
    }}

    .search-icon {{
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1rem;
      color: var(--text-muted);
      pointer-events: none;
    }}

    .clear-search-btn {{
      position: absolute;
      right: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.9rem;
      display: none;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
    }}

    .clear-search-btn:hover {{
      color: var(--text-primary);
    }}

    /* Quick Jump Pill Strip */
    .topics-quick-strip {{
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding: 0.2rem 0.1rem 0.5rem 0.1rem;
      scrollbar-width: thin;
    }}

    .topic-jump-pill {{
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.85rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 999px;
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }}

    .topic-jump-pill:hover {{
      color: var(--text-primary);
      border-color: var(--border-accent);
      transform: translateY(-1px);
    }}

    .topic-jump-pill .pill-num {{
      font-size: 0.72rem;
      opacity: 0.8;
      background: rgba(255, 255, 255, 0.08);
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
    }}

    .controls-row {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }}

    .pill-group {{
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }}

    .filter-pill {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.45rem 0.85rem;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }}

    .filter-pill:hover {{
      border-color: var(--border-accent);
      color: var(--text-primary);
    }}

    .filter-pill.active {{
      background: var(--accent-indigo);
      color: #ffffff;
      border-color: var(--accent-indigo);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
    }}

    .global-actions {{
      display: flex;
      gap: 0.6rem;
      align-items: center;
      flex-wrap: wrap;
    }}

    /* Topic Category Card Section */
    .topic-category-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-md);
      backdrop-filter: blur(16px);
      margin-bottom: 2rem;
      position: relative;
      transition: border-color 0.25s ease;
    }}

    .topic-category-card:hover {{
      border-color: var(--border-accent);
    }}

    /* Category Title Bar with Expand/Shrink Button */
    .category-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.15rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      gap: 1rem;
      flex-wrap: wrap;
    }}

    .category-title-left {{
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }}

    .category-icon {{
      font-size: 1.75rem;
      line-height: 1;
    }}

    .category-title {{
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }}

    .category-count-badge {{
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-secondary);
    }}

    .category-guide-badge {{
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: rgba(99, 102, 241, 0.15);
      color: var(--accent-indigo-light);
    }}

    .category-progress-badge {{
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.15);
      color: var(--accent-emerald);
    }}

    /* The Expand / Shrink Button */
    .category-toggle-btn {{
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.95rem;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }}

    .category-toggle-btn:hover {{
      background: var(--accent-indigo);
      color: #ffffff;
      border-color: var(--accent-indigo);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
      transform: translateY(-1px);
    }}

    .category-toggle-btn.collapsed {{
      background: rgba(99, 102, 241, 0.15);
      color: var(--accent-indigo-light);
      border-color: rgba(99, 102, 241, 0.35);
    }}

    .cat-toggle-icon {{
      font-size: 0.9rem;
      transition: transform 0.2s ease;
    }}

    .category-tagline {{
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
      line-height: 1.5;
    }}

    /* Companion Guides Strip inside Category */
    .category-guides-strip {{
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }}

    .category-guides-label {{
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent-indigo-light);
      font-weight: 700;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }}

    .category-guides-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.75rem;
    }}

    .mini-guide-card {{
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.75rem 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }}

    .mini-guide-card:hover {{
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--accent-indigo);
      transform: translateY(-2px);
    }}

    .mini-guide-title {{
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
    }}

    .mini-guide-read-btn {{
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--accent-indigo-light);
      background: transparent;
      border: none;
      white-space: nowrap;
      cursor: pointer;
    }}

    /* Questions Container within Category */
    .category-questions-wrap {{
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: all 0.3s ease;
    }}

    .category-questions-wrap.collapsed {{
      display: none;
    }}

    /* Question Cards */
    .question-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      box-shadow: var(--shadow-sm);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(16px);
      position: relative;
    }}

    .question-card:hover {{
      border-color: var(--border-accent);
      background: var(--bg-card-hover);
      box-shadow: var(--shadow-md);
    }}

    .question-card.reviewed {{
      border-left: 4px solid var(--accent-emerald);
      opacity: 0.94;
    }}

    .card-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      gap: 0.75rem;
      flex-wrap: wrap;
    }}

    .card-badges {{
      display: flex;
      gap: 0.45rem;
      align-items: center;
      flex-wrap: wrap;
    }}

    .badge {{
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      letter-spacing: 0.02em;
    }}

    .badge-id {{
      font-family: var(--font-mono);
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-primary);
    }}

    .badge-tier {{
      background: rgba(99, 102, 241, 0.15);
      color: var(--accent-indigo-light);
      border: 1px solid rgba(99, 102, 241, 0.3);
    }}

    .badge-diff-beginner {{
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }}

    .badge-diff-intermediate {{
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }}

    .badge-diff-advanced {{
      background: rgba(244, 63, 94, 0.15);
      color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }}

    .card-check-wrap {{
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      user-select: none;
    }}

    .card-check-wrap input {{
      cursor: pointer;
      accent-color: var(--accent-emerald);
      width: 15px;
      height: 15px;
    }}

    .card-title {{
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.75rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
      line-height: 1.4;
    }}

    .card-title:hover {{
      color: var(--accent-indigo-light);
    }}

    .toggle-chevron {{
      font-size: 0.85rem;
      color: var(--text-muted);
      transition: transform 0.25s ease;
      flex-shrink: 0;
      margin-top: 0.2rem;
    }}

    .toggle-chevron.rotated {{
      transform: rotate(180deg);
    }}

    /* Spoken Pitch Box */
    .pitch-box {{
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.06) 100%);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-left: 3px solid var(--accent-indigo);
      border-radius: var(--radius-sm);
      padding: 0.85rem 1rem;
      margin-bottom: 0.85rem;
    }}

    .pitch-label {{
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent-indigo-light);
      margin-bottom: 0.35rem;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }}

    .pitch-text {{
      font-size: 0.92rem;
      font-style: italic;
      color: var(--text-primary);
      line-height: 1.5;
    }}

    /* Related Companion Guide Link in Question Card */
    .card-related-docs {{
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.85rem;
    }}

    .doc-pill-link {{
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.65rem;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--accent-indigo-light);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }}

    .doc-pill-link:hover {{
      background: var(--accent-indigo);
      color: #ffffff;
      transform: translateY(-1px);
    }}

    /* Answer Drawer */
    .answer-drawer {{
      display: none;
      margin-top: 0.85rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--border-color);
      animation: fadeIn 0.2s ease;
    }}

    .answer-drawer.open {{
      display: block;
    }}

    @keyframes fadeIn {{
      from {{ opacity: 0; transform: translateY(-4px); }}
      to {{ opacity: 1; transform: translateY(0); }}
    }}

    .answer-heading {{
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      font-weight: 700;
      margin-bottom: 0.45rem;
    }}

    .answer-text {{
      color: var(--text-secondary);
      font-size: 0.94rem;
      line-height: 1.6;
      white-space: pre-line;
      margin-bottom: 0.85rem;
    }}

    /* Code Container */
    .code-container {{
      background: var(--bg-code);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      overflow: hidden;
      margin-top: 0.85rem;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    }}

    .code-header {{
      background: rgba(255, 255, 255, 0.04);
      padding: 0.4rem 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-muted);
    }}

    .copy-btn {{
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 0.72rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }}

    .copy-btn:hover {{
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-primary);
    }}

    pre {{
      padding: 1rem;
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      line-height: 1.5;
      color: #e2e8f0;
    }}

    code {{
      font-family: var(--font-mono);
    }}

    /* Modal / Slide-over Document Reader */
    .reader-modal-backdrop {{
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }}

    .reader-modal-backdrop.open {{
      display: flex;
    }}

    .reader-modal-window {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 1000px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      animation: modalSlideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }}

    @keyframes modalSlideUp {{
      from {{ opacity: 0; transform: translateY(20px) scale(0.98); }}
      to {{ opacity: 1; transform: translateY(0) scale(1); }}
    }}

    .reader-modal-header {{
      padding: 1.25rem 1.75rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.03);
    }}

    .reader-modal-title {{
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }}

    .reader-modal-body {{
      padding: 2rem 2.25rem;
      overflow-y: auto;
      flex: 1;
    }}

    /* Markdown Rendered Typography */
    .doc-content {{
      line-height: 1.75;
      color: var(--text-primary);
    }}

    .doc-content h1.doc-h1 {{
      font-size: 1.85rem;
      font-weight: 800;
      margin: 1.5rem 0 1rem 0;
      letter-spacing: -0.02em;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }}

    .doc-content h2.doc-h2 {{
      font-size: 1.4rem;
      font-weight: 700;
      margin: 2rem 0 0.85rem 0;
      color: var(--accent-indigo-light);
    }}

    .doc-content h3.doc-h3 {{
      font-size: 1.18rem;
      font-weight: 700;
      margin: 1.5rem 0 0.65rem 0;
    }}

    .doc-content p.doc-paragraph {{
      margin-bottom: 1.15rem;
      color: var(--text-secondary);
      font-size: 1rem;
    }}

    .doc-content ul.doc-list {{
      margin-bottom: 1.25rem;
      padding-left: 1.5rem;
      color: var(--text-secondary);
    }}

    .doc-content ul.doc-list li {{
      margin-bottom: 0.4rem;
    }}

    .doc-content hr.doc-divider {{
      border: 0;
      height: 1px;
      background: var(--border-color);
      margin: 2rem 0;
    }}

    .doc-callout {{
      padding: 1rem 1.25rem;
      border-radius: var(--radius-sm);
      margin: 1.25rem 0;
      font-size: 0.95rem;
      line-height: 1.6;
    }}

    .doc-pitch {{
      background: rgba(99, 102, 241, 0.1);
      border-left: 4px solid var(--accent-indigo);
      color: var(--text-primary);
    }}

    .doc-note {{
      background: rgba(6, 182, 212, 0.1);
      border-left: 4px solid var(--accent-cyan);
      color: var(--text-primary);
    }}

    .doc-tip {{
      background: rgba(16, 185, 129, 0.1);
      border-left: 4px solid var(--accent-emerald);
      color: var(--text-primary);
    }}

    .doc-important {{
      background: rgba(245, 158, 11, 0.1);
      border-left: 4px solid var(--accent-amber);
      color: var(--text-primary);
    }}

    .table-responsive {{
      overflow-x: auto;
      margin: 1.5rem 0;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }}

    .doc-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      text-align: left;
    }}

    .doc-table th {{
      background: rgba(255, 255, 255, 0.05);
      padding: 0.75rem 1rem;
      font-weight: 700;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
    }}

    .doc-table td {{
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
      vertical-align: top;
    }}

    .doc-table tr:last-child td {{
      border-bottom: none;
    }}

    .doc-table tr:hover td {{
      background: rgba(255, 255, 255, 0.02);
    }}

    /* Floating Quick Toggle Button */
    .floating-index-btn {{
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: linear-gradient(135deg, var(--accent-indigo) 0%, #4338ca 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.75rem 1.25rem;
      border-radius: 999px;
      font-size: 0.88rem;
      font-weight: 700;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.45);
      cursor: pointer;
      display: none;
      align-items: center;
      gap: 0.5rem;
      z-index: 1000;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }}

    .floating-index-btn:hover {{
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 12px 28px rgba(99, 102, 241, 0.6);
    }}

    .floating-index-btn .kbd-hint {{
      background: rgba(255, 255, 255, 0.2);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      margin-left: 0.25rem;
    }}

    /* Empty state */
    .empty-state {{
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-muted);
    }}

    .empty-state h3 {{
      font-size: 1.25rem;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }}

    footer {{
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }}

    /* Responsive */
    @media (max-width: 1024px) {{
      .sidebar-drawer {{
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        border-radius: 0;
        z-index: 1000;
        transform: translateX(-100%);
      }}
      .app-layout.sidebar-open .sidebar-drawer {{
        transform: translateX(0);
      }}
      .sidebar-backdrop {{
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 999;
        display: none;
      }}
      .app-layout.sidebar-open .sidebar-backdrop {{
        display: block;
      }}
    }}

    @media (min-width: 1025px) {{
      .sidebar-backdrop {{
        display: none !important;
      }}
      .app-layout.sidebar-hidden .sidebar-drawer {{
        transform: translateX(-100%);
        margin-right: 0;
      }}
    }}

    @media (max-width: 768px) {{
      header {{
        flex-direction: column;
        gap: 1rem;
      }}
      .progress-banner {{
        flex-direction: column;
        align-items: stretch;
      }}
      .controls-row {{
        flex-direction: column;
        align-items: stretch;
      }}
    }}
  </style>
</head>
<body>
  <div class="app-layout" id="appLayout">
    <!-- Sidebar Index -->
    <aside class="sidebar-drawer" id="sidebarDrawer">
      <div class="sidebar-header">
        <div class="sidebar-title">
          <span>📚</span> <span>Topics & Questions</span>
        </div>
        <button class="sidebar-close-btn" id="closeSidebarBtn" title="Close Sidebar">✕</button>
      </div>

      <!-- Quick Search inside Sidebar -->
      <div class="sidebar-search-box">
        <input type="text" id="sidebarQuickSearch" class="sidebar-search-input" placeholder="Quick filter questions or topics...">
      </div>

      <!-- Navigation Content -->
      <nav class="sidebar-nav" id="sidebarNav"></nav>
    </aside>

    <!-- Mobile Backdrop -->
    <div class="sidebar-backdrop" id="sidebarBackdrop"></div>

    <!-- Main Content: Single Unified Master View -->
    <div class="main-area">
      <header>
        <div class="header-content">
          <h1>Citi iOS Senior Interview Master Suite</h1>
          <p>Single-item comprehensive view: all {len(questions)} senior iOS interview questions grouped by architectural topic with expandable breakdowns, spoken pitches, and companion deep-dive guides.</p>
        </div>
        <div class="header-actions">
          <button id="sidebarToggleBtn" class="header-btn" title="Toggle Sidebar (or press M)" aria-label="Toggle Sidebar">
            <span>📑</span> <span id="sidebarToggleLabel">Hide Index</span>
          </button>
          <button id="themeToggleBtn" class="header-btn" aria-label="Toggle theme">
            <span id="themeIcon">🌙</span> <span id="themeLabel">Dark</span>
          </button>
        </div>
      </header>

      <!-- Global Progress Tracker -->
      <div class="progress-banner">
        <div class="progress-info">
          <div class="stat-pill">
            <span class="stat-value" id="reviewedCount">0</span>
            <span class="stat-label">Reviewed</span>
          </div>
          <div class="stat-pill">
            <span class="stat-value" id="totalCount">{len(questions)}</span>
            <span class="stat-label">Total Questions</span>
          </div>
          <div class="stat-pill">
            <span class="stat-value" id="percentVal">0%</span>
            <span class="stat-label">Readiness</span>
          </div>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" id="progressBarFill"></div>
          </div>
        </div>
        <button class="reset-progress-btn" id="resetProgressBtn">Reset Progress</button>
      </div>

      <!-- Search & Controls Toolbar -->
      <div class="toolbar-section">
        <!-- Quick Search -->
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" class="search-input" placeholder="Search across all questions, answers, spoken pitches, and Swift code (e.g. Actor, Linkage, Core Data, Coordinator)...">
          <button class="clear-search-btn" id="clearSearchBtn">✕</button>
        </div>

        <!-- Quick Jump Topic Strip -->
        <div class="topics-quick-strip" id="topicsQuickStrip"></div>

        <!-- Controls Row -->
        <div class="controls-row">
          <!-- Tier Filter Pills -->
          <div class="pill-group" id="tierPills">
            <button class="filter-pill active" data-tier="all">All Tiers ({len(questions)})</button>
            <button class="filter-pill" data-tier="Tier 1">Tier 1: Cold (17)</button>
            <button class="filter-pill" data-tier="Tier 2">Tier 2: Differentiator (5)</button>
            <button class="filter-pill" data-tier="Tier 3">Tier 3: Concept (14)</button>
            <button class="filter-pill" data-tier="Tier 4">Tier 4: Safety (3)</button>
          </div>

          <!-- Global Expand/Shrink Action Buttons -->
          <div class="global-actions">
            <button class="header-btn" id="toggleAllCategoriesBtn" onclick="toggleAllCategories()">
              <span>▾</span> <span id="toggleAllCategoriesLabel">Shrink All Categories</span>
            </button>
            <button class="header-btn" id="toggleAllAnswersBtn" onclick="toggleAllAnswers()">
              <span>💬</span> <span id="toggleAllAnswersLabel">Expand All Answers</span>
            </button>
          </div>
        </div>
      </div>

      <!-- All Questions Grouped by Topic -->
      <div id="topicsContainer"></div>

      <!-- Empty State -->
      <div class="empty-state" id="emptyState" style="display: none;">
        <h3>No questions matched your search</h3>
        <p>Try searching for a different keyword or resetting your tier filter.</p>
      </div>

      <footer>
        <p>Citi iOS Senior Interview Prep • Standalone Unified Dashboard • {len(questions)} Curated Questions • {len(module_docs)} Companion Architecture Guides</p>
      </footer>
    </div>
  </div>

  <!-- Slide-over Full Document Reader Modal -->
  <div class="reader-modal-backdrop" id="readerModalBackdrop" onclick="closeReaderModal(event)">
    <div class="reader-modal-window" onclick="event.stopPropagation()">
      <div class="reader-modal-header">
        <div class="reader-modal-title">
          <span id="modalDocIcon">📖</span>
          <span id="modalDocTitle">Companion Architecture Guide</span>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="header-btn" onclick="copyModalFilePath()" title="Copy Relative File Path">
            <span>📋</span> <span id="modalCopyBtnText">Copy Path</span>
          </button>
          <button class="sidebar-close-btn" onclick="closeReaderModalDirect()" title="Close Reader (Esc)">✕</button>
        </div>
      </div>
      <div class="reader-modal-body" id="modalDocContent"></div>
    </div>
  </div>

  <!-- Floating Quick Toggle Button (Always reachable while scrolling) -->
  <button id="floatingIndexBtn" class="floating-index-btn" title="Open Topic & Question Index (or Press 'M')">
    <span>📑</span> <span>Show Topic Index</span> <span class="kbd-hint">M</span>
  </button>

  <script>
    // Embedded Data
    const QUESTIONS = {questions_json};
    const MODULE_DOCS = {docs_json};
    const QUESTION_TO_DOCS = {question_to_docs_json};
    const TOPIC_CATEGORIES = {topic_categories_json};
    const QUESTION_TO_TOPIC = {question_to_topic_json};
    const DOC_TO_TOPIC = {doc_to_topic_json};

    // State
    let currentTier = 'all';
    let searchQuery = '';
    let sidebarFilterQuery = '';
    let allAnswersExpanded = false;
    let allCategoriesShrunk = false;
    let categoryCollapsedState = {{}};
    let reviewedIDs = new Set(JSON.parse(localStorage.getItem('citi_reviewed_questions') || '[]'));
    let activeQuestionId = null;
    let activeDocPath = '';

    // DOM Elements
    const appLayout = document.getElementById('appLayout');
    const sidebarDrawer = document.getElementById('sidebarDrawer');
    const sidebarNav = document.getElementById('sidebarNav');
    const sidebarQuickSearch = document.getElementById('sidebarQuickSearch');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarToggleLabel = document.getElementById('sidebarToggleLabel');
    const floatingIndexBtn = document.getElementById('floatingIndexBtn');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    const topicsQuickStrip = document.getElementById('topicsQuickStrip');
    const topicsContainer = document.getElementById('topicsContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const tierPills = document.getElementById('tierPills');

    const emptyState = document.getElementById('emptyState');
    const reviewedCountEl = document.getElementById('reviewedCount');
    const totalCountEl = document.getElementById('totalCount');
    const percentValEl = document.getElementById('percentVal');
    const progressBarFill = document.getElementById('progressBarFill');
    const resetProgressBtn = document.getElementById('resetProgressBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    const readerModalBackdrop = document.getElementById('readerModalBackdrop');
    const modalDocIcon = document.getElementById('modalDocIcon');
    const modalDocTitle = document.getElementById('modalDocTitle');
    const modalDocContent = document.getElementById('modalDocContent');
    const modalCopyBtnText = document.getElementById('modalCopyBtnText');

    // Sidebar Visibility
    const savedSidebarState = localStorage.getItem('citi_sidebar_visible');
    let isSidebarVisible = savedSidebarState !== null ? (savedSidebarState === 'true') : (window.innerWidth > 1024);
    updateSidebarVisibilityUI();

    function setSidebarVisible(visible) {{
      isSidebarVisible = visible;
      localStorage.setItem('citi_sidebar_visible', visible);
      updateSidebarVisibilityUI();
    }}

    function updateSidebarVisibilityUI() {{
      const isMobile = window.innerWidth <= 1024;
      if (isMobile) {{
        if (isSidebarVisible) {{
          appLayout.classList.add('sidebar-open');
          appLayout.classList.remove('sidebar-hidden');
          sidebarToggleLabel.textContent = 'Hide Index';
          sidebarToggleBtn.classList.remove('btn-highlight');
        }} else {{
          appLayout.classList.remove('sidebar-open');
          appLayout.classList.add('sidebar-hidden');
          sidebarToggleLabel.textContent = 'Show Index';
          sidebarToggleBtn.classList.add('btn-highlight');
        }}
      }} else {{
        if (isSidebarVisible) {{
          appLayout.classList.remove('sidebar-hidden');
          sidebarToggleLabel.textContent = 'Hide Index';
          sidebarToggleBtn.classList.remove('btn-highlight');
        }} else {{
          appLayout.classList.add('sidebar-hidden');
          sidebarToggleLabel.textContent = 'Show Index';
          sidebarToggleBtn.classList.add('btn-highlight');
        }}
      }}

      if (!isSidebarVisible) {{
        floatingIndexBtn.style.display = 'flex';
        floatingIndexBtn.classList.add('visible');
      }} else {{
        floatingIndexBtn.style.display = 'none';
        floatingIndexBtn.classList.remove('visible');
      }}
    }}

    sidebarToggleBtn.addEventListener('click', () => {{
      setSidebarVisible(!isSidebarVisible);
    }});

    closeSidebarBtn.addEventListener('click', () => {{
      setSidebarVisible(false);
    }});

    floatingIndexBtn.addEventListener('click', () => {{
      setSidebarVisible(true);
    }});

    sidebarBackdrop.addEventListener('click', () => {{
      setSidebarVisible(false);
    }});

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {{
      if (e.key === 'Escape' && readerModalBackdrop.classList.contains('open')) {{
        closeReaderModalDirect();
        return;
      }}
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === 'm' || e.key === 'M' || e.key === '[') {{
        e.preventDefault();
        setSidebarVisible(!isSidebarVisible);
      }}
    }});

    window.addEventListener('resize', () => {{
      updateSidebarVisibilityUI();
    }});

    // Theme Management
    const savedTheme = localStorage.getItem('citi_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);

    themeToggleBtn.addEventListener('click', () => {{
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('citi_theme', next);
      updateThemeUI(next);
    }});

    function updateThemeUI(theme) {{
      if (theme === 'light') {{
        themeIcon.textContent = '☀️';
        themeLabel.textContent = 'Light';
      }} else {{
        themeIcon.textContent = '🌙';
        themeLabel.textContent = 'Dark';
      }}
    }}

    // ==========================================
    // RENDER ALL QUESTIONS GROUPED BY TOPIC
    // ==========================================
    function renderTopicsAndQuestions() {{
      topicsContainer.innerHTML = '';
      topicsQuickStrip.innerHTML = '';

      const term = searchQuery.toLowerCase();

      // 1. Render Quick Jump Pills
      TOPIC_CATEGORIES.forEach(topic => {{
        const pill = document.createElement('a');
        pill.className = 'topic-jump-pill';
        pill.href = `#cat-${{topic.id}}`;
        pill.onclick = (e) => {{
          e.preventDefault();
          jumpToTopic(topic.id);
        }};
        pill.innerHTML = `
          <span>${{topic.icon}}</span>
          <span>${{topic.shortTitle}}</span>
          <span class="pill-num">${{topic.questionIds.length}}</span>
        `;
        topicsQuickStrip.appendChild(pill);
      }});

      let totalMatchedQuestions = 0;

      // 2. Render each Topic Category
      TOPIC_CATEGORIES.forEach(topic => {{
        const topicQuestions = QUESTIONS.filter(q => topic.questionIds.includes(q.id));
        const topicDocs = MODULE_DOCS.filter(d => topic.docIds.includes(d.id));

        // Filter questions by search term and tier
        const filteredQuestions = topicQuestions.filter(q => {{
          if (currentTier !== 'all' && !q.category.startsWith(currentTier)) return false;
          if (term) {{
            const matchQ = q.question.toLowerCase().includes(term);
            const matchA = q.answer.toLowerCase().includes(term);
            const matchP = (q.interviewSentence || '').toLowerCase().includes(term);
            const matchID = q.id.toLowerCase().includes(term);
            const matchC = (q.codeExample || '').toLowerCase().includes(term);
            if (!matchQ && !matchA && !matchP && !matchID && !matchC) return false;
          }}
          return true;
        }});

        // If searching/filtering and no questions match in this topic, check if topic docs match
        if (filteredQuestions.length === 0 && (term || currentTier !== 'all')) {{
          return; // Skip rendering this topic if empty after search
        }}

        totalMatchedQuestions += filteredQuestions.length;

        const isCollapsed = categoryCollapsedState[topic.id] || false;
        const reviewedInTopic = topicQuestions.filter(q => reviewedIDs.has(q.id)).length;
        const totalInTopic = topicQuestions.length;
        const pctInTopic = totalInTopic ? Math.round((reviewedInTopic / totalInTopic) * 100) : 0;

        const catCard = document.createElement('div');
        catCard.className = 'topic-category-card';
        catCard.id = `cat-${{topic.id}}`;
        catCard.style.borderLeft = `5px solid ${{topic.color}}`;

        // Render Companion Guides
        let guidesHTML = '';
        if (topicDocs.length > 0) {{
          let guideCardsHTML = '';
          topicDocs.forEach(d => {{
            guideCardsHTML += `
              <div class="mini-guide-card" onclick="openReaderModal('${{d.id}}')">
                <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 0;">
                  <span style="font-size: 1.15rem;">${{d.icon}}</span>
                  <span class="mini-guide-title">${{escapeHtml(d.title)}}</span>
                </div>
                <button class="mini-guide-read-btn">Read →</button>
              </div>
            `;
          }});

          guidesHTML = `
            <div class="category-guides-strip">
              <div class="category-guides-label">
                <span>📖 Companion Guides & Decision Tables (${{topicDocs.length}})</span>
              </div>
              <div class="category-guides-grid">
                ${{guideCardsHTML}}
              </div>
            </div>
          `;
        }}

        // Render Questions
        let questionsHTML = '';
        filteredQuestions.forEach(q => {{
          const isReviewed = reviewedIDs.has(q.id);
          const diffClass = `badge-diff-${{q.difficulty.toLowerCase()}}`;

          let pitchHTML = '';
          if (q.interviewSentence) {{
            pitchHTML = `
              <div class="pitch-box">
                <div class="pitch-label">🗣️ Spoken Interview Pitch (Say it like this)</div>
                <div class="pitch-text">"${{escapeHtml(q.interviewSentence)}}"</div>
              </div>
            `;
          }}

          let relatedDocsHTML = '';
          const docs = QUESTION_TO_DOCS[q.id];
          if (docs && docs.length > 0) {{
            relatedDocsHTML = '<div class="card-related-docs">';
            docs.forEach(d => {{
              relatedDocsHTML += `
                <a class="doc-pill-link" onclick="openReaderModal('${{d.docId}}')">
                  <span>${{d.icon}}</span> <span>Companion Guide: ${{d.filename}}</span>
                </a>
              `;
            }});
            relatedDocsHTML += '</div>';
          }}

          let codeHTML = '';
          if (q.codeExample) {{
            codeHTML = `
              <div class="code-container">
                <div class="code-header">
                  <span>Swift / Reference Snippet</span>
                  <button class="copy-btn" onclick="copyCodeTextFromBtn(this, '${{encodeURIComponent(q.codeExample)}}')">Copy Code</button>
                </div>
                <pre><code>${{escapeHtml(q.codeExample)}}</code></pre>
              </div>
            `;
          }}

          questionsHTML += `
            <div class="question-card ${{isReviewed ? 'reviewed' : ''}}" id="card-${{q.id}}">
              <div class="card-header">
                <div class="card-badges">
                  <span class="badge badge-id">${{q.id}}</span>
                  <span class="badge badge-tier">${{q.category.split('—')[0].trim()}}</span>
                  <span class="badge ${{diffClass}}">${{q.difficulty}}</span>
                </div>
                <label class="card-check-wrap">
                  <input type="checkbox" ${{isReviewed ? 'checked' : ''}} onchange="toggleReviewed('${{q.id}}', this.checked)">
                  <span>Reviewed</span>
                </label>
              </div>

              <h3 class="card-title" onclick="toggleDrawer('${{q.id}}')">
                <span>${{escapeHtml(q.question)}}</span>
                <span class="toggle-chevron ${{allAnswersExpanded ? 'rotated' : ''}}" id="chev-${{q.id}}">▼</span>
              </h3>

              ${{relatedDocsHTML}}
              ${{pitchHTML}}

              <div class="answer-drawer ${{allAnswersExpanded ? 'open' : ''}}" id="drawer-${{q.id}}">
                <div class="answer-heading">In-Depth Breakdown</div>
                <div class="answer-text">${{escapeHtml(q.answer)}}</div>
                ${{codeHTML}}
              </div>
            </div>
          `;
        }});

        catCard.innerHTML = `
          <div class="category-header">
            <div class="category-title-left">
              <span class="category-icon">${{topic.icon}}</span>
              <h2 class="category-title">${{escapeHtml(topic.title)}}</h2>
              <span class="category-count-badge">${{filteredQuestions.length}} Questions</span>
              <span class="category-guide-badge">${{topicDocs.length}} Guides</span>
              <span class="category-progress-badge" id="cat-prog-${{topic.id}}">${{pctInTopic}}% Ready</span>
            </div>
            <div>
              <button class="category-toggle-btn ${{isCollapsed ? 'collapsed' : ''}}" id="btn-cat-${{topic.id}}" onclick="toggleCategoryQuestions('${{topic.id}}')">
                <span class="cat-toggle-icon">${{isCollapsed ? '▸' : '▾'}}</span>
                <span class="cat-toggle-text">${{isCollapsed ? 'Expand Questions (' + filteredQuestions.length + ')' : 'Shrink Questions'}}</span>
              </button>
            </div>
          </div>

          <p class="category-tagline">${{escapeHtml(topic.summary)}}</p>

          ${{guidesHTML}}

          <div class="category-questions-wrap ${{isCollapsed ? 'collapsed' : ''}}" id="wrap-cat-${{topic.id}}">
            ${{questionsHTML}}
          </div>
        `;

        topicsContainer.appendChild(catCard);
      }});

      if (totalMatchedQuestions === 0) {{
        emptyState.style.display = 'block';
      }} else {{
        emptyState.style.display = 'none';
      }}

      updateProgress();
      renderSidebar();
    }}

    // Toggle individual category questions
    window.toggleCategoryQuestions = function(topicId) {{
      const wrap = document.getElementById(`wrap-cat-${{topicId}}`);
      const btn = document.getElementById(`btn-cat-${{topicId}}`);
      if (!wrap || !btn) return;

      const isCollapsed = wrap.classList.toggle('collapsed');
      categoryCollapsedState[topicId] = isCollapsed;

      const topicObj = TOPIC_CATEGORIES.find(t => t.id === topicId);
      const count = topicObj ? topicObj.questionIds.length : '';

      if (isCollapsed) {{
        btn.classList.add('collapsed');
        btn.querySelector('.cat-toggle-icon').textContent = '▸';
        btn.querySelector('.cat-toggle-text').textContent = `Expand Questions (${{count}})`;
      }} else {{
        btn.classList.remove('collapsed');
        btn.querySelector('.cat-toggle-icon').textContent = '▾';
        btn.querySelector('.cat-toggle-text').textContent = 'Shrink Questions';
      }}
    }};

    // Global toggle all categories
    window.toggleAllCategories = function() {{
      allCategoriesShrunk = !allCategoriesShrunk;
      const label = document.getElementById('toggleAllCategoriesLabel');
      label.textContent = allCategoriesShrunk ? 'Expand All Categories' : 'Shrink All Categories';

      TOPIC_CATEGORIES.forEach(topic => {{
        categoryCollapsedState[topic.id] = allCategoriesShrunk;
        const wrap = document.getElementById(`wrap-cat-${{topic.id}}`);
        const btn = document.getElementById(`btn-cat-${{topic.id}}`);
        if (wrap && btn) {{
          wrap.classList.toggle('collapsed', allCategoriesShrunk);
          btn.classList.toggle('collapsed', allCategoriesShrunk);
          btn.querySelector('.cat-toggle-icon').textContent = allCategoriesShrunk ? '▸' : '▾';
          btn.querySelector('.cat-toggle-text').textContent = allCategoriesShrunk ? `Expand Questions (${{topic.questionIds.length}})` : 'Shrink Questions';
        }}
      }});
    }};

    // Global toggle all question answer drawers
    window.toggleAllAnswers = function() {{
      allAnswersExpanded = !allAnswersExpanded;
      const label = document.getElementById('toggleAllAnswersLabel');
      label.textContent = allAnswersExpanded ? 'Collapse All Answers' : 'Expand All Answers';
      document.querySelectorAll('.answer-drawer').forEach(d => {{
        d.classList.toggle('open', allAnswersExpanded);
      }});
      document.querySelectorAll('.toggle-chevron').forEach(c => {{
        c.classList.toggle('rotated', allAnswersExpanded);
      }});
    }};

    // Individual Question Drawer
    function toggleDrawer(id) {{
      const drawer = document.getElementById(`drawer-${{id}}`);
      const chev = document.getElementById(`chev-${{id}}`);
      if (drawer) {{
        drawer.classList.toggle('open');
        if (chev) chev.classList.toggle('rotated');
      }}
    }}

    // Jump to Topic
    window.jumpToTopic = function(topicId) {{
      const el = document.getElementById(`cat-${{topicId}}`);
      if (el) {{
        el.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
        el.style.borderColor = 'var(--accent-indigo)';
        setTimeout(() => {{
          el.style.borderColor = '';
        }}, 1200);
      }}
    }};

    // Jump to Question
    window.navigateToQuestion = function(id, event) {{
      if (event) event.preventDefault();
      activeQuestionId = id;

      const targetCard = document.getElementById(`card-${{id}}`);
      if (!targetCard) {{
        // Reset filters if hidden
        currentTier = 'all';
        searchQuery = '';
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        tierPills.querySelectorAll('.filter-pill').forEach(b => b.classList.toggle('active', b.dataset.tier === 'all'));
        renderTopicsAndQuestions();
      }}

      // Ensure parent category is expanded
      const topicInfo = QUESTION_TO_TOPIC[id];
      if (topicInfo) {{
        const wrap = document.getElementById(`wrap-cat-${{topicInfo.id}}`);
        const btn = document.getElementById(`btn-cat-${{topicInfo.id}}`);
        if (wrap && wrap.classList.contains('collapsed')) {{
          wrap.classList.remove('collapsed');
          categoryCollapsedState[topicInfo.id] = false;
          if (btn) {{
            btn.classList.remove('collapsed');
            btn.querySelector('.cat-toggle-icon').textContent = '▾';
            btn.querySelector('.cat-toggle-text').textContent = 'Shrink Questions';
          }}
        }}
      }}

      setTimeout(() => {{
        const card = document.getElementById(`card-${{id}}`);
        if (card) {{
          card.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
          const drawer = document.getElementById(`drawer-${{id}}`);
          const chev = document.getElementById(`chev-${{id}}`);
          if (drawer) drawer.classList.add('open');
          if (chev) chev.classList.add('rotated');

          card.style.outline = '2px solid var(--accent-indigo)';
          setTimeout(() => {{
            card.style.outline = 'none';
          }}, 2000);
        }}
      }}, 50);
    }};

    // Render Sidebar Topics & Questions
    function renderSidebar() {{
      sidebarNav.innerHTML = '';
      const query = sidebarFilterQuery.toLowerCase();

      TOPIC_CATEGORIES.forEach(topic => {{
        const topicQs = QUESTIONS.filter(q => topic.questionIds.includes(q.id));
        const filteredQs = topicQs.filter(q => {{
          if (!query) return true;
          return q.question.toLowerCase().includes(query) ||
                 q.id.toLowerCase().includes(query) ||
                 topic.title.toLowerCase().includes(query);
        }});

        if (query && filteredQs.length === 0 && !topic.title.toLowerCase().includes(query)) {{
          return;
        }}

        const reviewedInTopic = topicQs.filter(q => reviewedIDs.has(q.id)).length;

        const group = document.createElement('div');
        group.className = 'sidebar-topic-group';

        const header = document.createElement('div');
        header.className = 'sidebar-topic-header';
        header.onclick = () => jumpToTopic(topic.id);
        header.innerHTML = `
          <span style="display: flex; align-items: center; gap: 0.4rem;">
            <span>${{topic.icon}}</span>
            <span>${{escapeHtml(topic.shortTitle)}}</span>
          </span>
          <span class="sidebar-id-badge">${{reviewedInTopic}}/${{topicQs.length}}</span>
        `;
        group.appendChild(header);

        filteredQs.forEach(q => {{
          const isReviewed = reviewedIDs.has(q.id);
          const isActive = (q.id === activeQuestionId);

          const a = document.createElement('a');
          a.className = `sidebar-item ${{isReviewed ? 'reviewed' : ''}} ${{isActive ? 'active' : ''}}`;
          a.id = `side-item-${{q.id}}`;
          a.href = `#card-${{q.id}}`;
          a.onclick = (e) => navigateToQuestion(q.id, e);

          a.innerHTML = `
            <span class="sidebar-id-badge">${{q.id}}</span>
            <span class="sidebar-item-text" title="${{escapeHtml(q.question)}}">${{escapeHtml(q.question)}}</span>
            <span class="sidebar-check">${{isReviewed ? '✓' : '○'}}</span>
          `;
          group.appendChild(a);
        }});

        sidebarNav.appendChild(group);
      }});
    }}

    sidebarQuickSearch.addEventListener('input', (e) => {{
      sidebarFilterQuery = e.target.value.trim();
      renderSidebar();
    }});

    // Review Checkbox State
    function toggleReviewed(id, isChecked) {{
      if (isChecked) {{
        reviewedIDs.add(id);
      }} else {{
        reviewedIDs.delete(id);
      }}
      localStorage.setItem('citi_reviewed_questions', JSON.stringify(Array.from(reviewedIDs)));
      updateProgress();
      
      document.querySelectorAll(`#card-${{id}}`).forEach(card => {{
        card.classList.toggle('reviewed', isChecked);
        const cb = card.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = isChecked;
      }});
      
      const sideItem = document.getElementById(`side-item-${{id}}`);
      if (sideItem) {{
        sideItem.classList.toggle('reviewed', isChecked);
        const checkSpan = sideItem.querySelector('.sidebar-check');
        if (checkSpan) checkSpan.textContent = isChecked ? '✓' : '○';
      }}

      // Update topic readiness badges
      TOPIC_CATEGORIES.forEach(t => {{
        const progEl = document.getElementById(`cat-prog-${{t.id}}`);
        if (progEl) {{
          const tQs = QUESTIONS.filter(q => t.questionIds.includes(q.id));
          const rCount = tQs.filter(q => reviewedIDs.has(q.id)).length;
          const pct = tQs.length ? Math.round((rCount / tQs.length) * 100) : 0;
          progEl.textContent = `${{pct}}% Ready`;
        }}
      }});
    }}

    function updateProgress() {{
      const total = QUESTIONS.length;
      const count = reviewedIDs.size;
      const pct = Math.round((count / total) * 100);
      reviewedCountEl.textContent = count;
      totalCountEl.textContent = total;
      percentValEl.textContent = `${{pct}}%`;
      progressBarFill.style.width = `${{pct}}%`;
    }}

    resetProgressBtn.addEventListener('click', () => {{
      if (confirm('Are you sure you want to reset all review checkmarks?')) {{
        reviewedIDs.clear();
        localStorage.removeItem('citi_reviewed_questions');
        renderTopicsAndQuestions();
      }}
    }});

    // Reader Modal
    window.openReaderModal = function(docId) {{
      const doc = MODULE_DOCS.find(d => d.id === docId);
      if (!doc) return;

      activeDocPath = doc.filePath;
      modalDocIcon.textContent = doc.icon;
      modalDocTitle.textContent = doc.title;
      modalDocContent.innerHTML = doc.htmlContent;
      modalCopyBtnText.textContent = 'Copy Path';
      readerModalBackdrop.classList.add('open');
      modalDocContent.scrollTop = 0;
    }};

    window.closeReaderModal = function(event) {{
      if (event.target === readerModalBackdrop) {{
        closeReaderModalDirect();
      }}
    }};

    window.closeReaderModalDirect = function() {{
      readerModalBackdrop.classList.remove('open');
    }};

    window.copyModalFilePath = function() {{
      if (!activeDocPath) return;
      navigator.clipboard.writeText(activeDocPath).then(() => {{
        modalCopyBtnText.textContent = '✓ Copied!';
        setTimeout(() => {{
          modalCopyBtnText.textContent = 'Copy Path';
        }}, 2000);
      }});
    }};

    window.copyCodeFromElement = function(btn) {{
      const container = btn.closest('.code-container');
      const code = container.querySelector('code').innerText;
      navigator.clipboard.writeText(code).then(() => {{
        btn.textContent = '✓ Copied';
        setTimeout(() => btn.textContent = 'Copy Code', 2000);
      }});
    }};

    window.copyCodeTextFromBtn = function(btn, encodedCode) {{
      const code = decodeURIComponent(encodedCode);
      navigator.clipboard.writeText(code).then(() => {{
        btn.textContent = '✓ Copied';
        setTimeout(() => btn.textContent = 'Copy Code', 2000);
      }});
    }};

    function escapeHtml(str) {{
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }}

    // Search and Tier Filter Listeners
    searchInput.addEventListener('input', (e) => {{
      searchQuery = e.target.value.trim();
      clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      renderTopicsAndQuestions();
    }});

    clearSearchBtn.addEventListener('click', () => {{
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
      renderTopicsAndQuestions();
    }});

    tierPills.addEventListener('click', (e) => {{
      if (e.target.classList.contains('filter-pill')) {{
        tierPills.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentTier = e.target.dataset.tier;
        renderTopicsAndQuestions();
      }}
    }});

    // Initial Execution
    renderTopicsAndQuestions();
  </script>
</body>
</html>
"""

    with open(index_file, "w", encoding="utf-8") as f:
        f.write(template)

    print(f"Successfully synchronized index.html with {len(questions)} questions across {len(TOPIC_CATEGORIES)} Topics in a single unified view!")

if __name__ == "__main__":
    sync_dashboard()
