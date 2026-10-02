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
        "relatedQuestions": ["T1-06"],
        "summary": "Entities, Use Cases, Presenters, and data flow in Clean Architecture with Dependency Inversion."
    },
    "Architecture/CoordinatorPattern/Coordinator-README.md": {
        "id": "coordinator-pattern",
        "title": "Coordinator Pattern — Interview Cheat Sheet",
        "category": "Architecture",
        "icon": "🧭",
        "relatedQuestions": ["T1-15"],
        "summary": "Extracting navigation and routing out of Views/ViewModels. NavigationStack vs Coordinator interview breakdown."
    },
    "Architecture/DependencyInjection/DI-README.md": {
        "id": "dependency-injection",
        "title": "Dependency Injection (DI) — Interview Cheat Sheet",
        "category": "Architecture",
        "icon": "💉",
        "relatedQuestions": ["T1-08"],
        "summary": "Constructor vs property injection, protocol mocking, and container setups for unit testing."
    },
    "Architecture/MVVM/MVVM-TalkingPoints.md": {
        "id": "mvvm",
        "title": "MVVM (Model-View-ViewModel) — Talking Points",
        "category": "Architecture",
        "icon": "📐",
        "relatedQuestions": ["T1-06"],
        "summary": "State binding, single source of truth, testability, and avoiding massive view controllers in SwiftUI."
    },
    "Architecture/ModularArchitecture/ModularArchitecture-TalkingPoints.md": {
        "id": "modular-architecture",
        "title": "Modular App Architecture — Talking Points",
        "category": "Architecture",
        "icon": "📦",
        "relatedQuestions": ["T1-16", "T1-17", "T3-11"],
        "summary": "Interface vs Implementation targets, static vs dynamic linkage launch effects, and compile-time isolation."
    },
    "Architecture/RepositoryPattern/RepositoryPattern-TalkingPoints.md": {
        "id": "repository-pattern",
        "title": "Repository Pattern — Talking Points",
        "category": "Architecture",
        "icon": "🗄️",
        "relatedQuestions": ["T3-07", "T1-10"],
        "summary": "Single source of truth abstraction between local databases (Core Data/SQLite) and remote REST/GraphQL APIs."
    },
    "Architecture/SOLIDPrinciples/SOLID-README.md": {
        "id": "solid-principles",
        "title": "SOLID Principles — Interview Cheat Sheet",
        "category": "Architecture",
        "icon": "🧱",
        "relatedQuestions": ["T1-09"],
        "summary": "Single Responsibility, Open/Closed, Liskov, Interface Segregation, and Dependency Inversion with Swift examples."
    },
    "Architecture/VIPERPattern/VIPER-README.md": {
        "id": "viper-pattern",
        "title": "VIPER Architecture — Interview Cheat Sheet",
        "category": "Architecture",
        "icon": "🐍",
        "relatedQuestions": ["T1-07"],
        "summary": "View, Interactor, Presenter, Entity, Router breakdown for enterprise teams."
    },
    "AutoLayoutBasics/AutoLayoutBasics-TalkingPoints.md": {
        "id": "autolayout-basics",
        "title": "Auto Layout Basics — Talking Points",
        "category": "UI & Layout",
        "icon": "📐",
        "relatedQuestions": ["T3-08"],
        "summary": "Cassowary constraint solver, intrinsic content size, hugging vs compression resistance, and UIKit layout passes."
    },
    "ComposableUI/ComposableUI-TalkingPoints.md": {
        "id": "composable-ui",
        "title": "Composable UI Decomposition — Talking Points",
        "category": "UI & Layout",
        "icon": "🧩",
        "relatedQuestions": ["T3-09"],
        "summary": "Decomposing 500-line monolithic screens into atomic design system components with isolated view models."
    },
    "ConcurrencyIssues/ConcurrencyIssues-ComparisonNotes.md": {
        "id": "concurrency-issues",
        "title": "Concurrency Issues Diagnosis Table",
        "category": "Concurrency & Threading",
        "icon": "⚠️",
        "relatedQuestions": ["T1-04"],
        "summary": "Race conditions, deadlocks, livelocks, priority inversions, and thread explosion troubleshooting."
    },
    "DataPersistence/DataPersistence-ComparisonNotes.md": {
        "id": "data-persistence",
        "title": "Data Persistence & Offline Sync Decision Table",
        "category": "Data & Storage",
        "icon": "💾",
        "relatedQuestions": ["T3-03"],
        "summary": "UserDefaults vs Keychain vs SQLite vs Core Data vs Realm vs SwiftData, plus offline outbox sync patterns."
    },
    "DesignSystem/DesignSystem-TalkingPoints.md": {
        "id": "design-system",
        "title": "Design System & Shared UI Library — Talking Points",
        "category": "UI & Layout",
        "icon": "🎨",
        "relatedQuestions": ["T3-09"],
        "summary": "Typography scales, semantic tokens, snapshot testing, WCAG contrast compliance, and accessibility."
    },
    "Leadership/DevelopmentLeadOwnership-TalkingPoints.md": {
        "id": "leadership-ownership",
        "title": "Development Lead / Feature Ownership — Talking Points",
        "category": "Leadership & Process",
        "icon": "👔",
        "relatedQuestions": ["T4-01", "T4-02", "T4-03"],
        "summary": "End-to-end technical leadership, cross-functional alignment, regulatory compliance (PCI-DSS, SOX, GDPR)."
    },
    "Multithreading/Multithreading-README.md": {
        "id": "multithreading-gcd",
        "title": "iOS Concurrency & GCD Reference",
        "category": "Concurrency & Threading",
        "icon": "⚡",
        "relatedQuestions": ["T1-01", "T1-02", "T1-03"],
        "summary": "GCD queues, DispatchWorkItem, DispatchGroup, Semaphore, barrier flags, and modern Swift Actor migration."
    },
    "Networking/Networking-ComparisonNotes.md": {
        "id": "networking-architecture",
        "title": "Networking Architecture Decision Table & 4 Pillars",
        "category": "Networking & APIs",
        "icon": "🌐",
        "relatedQuestions": ["T1-10"],
        "summary": "Decision table for URLSession vs custom stack vs interceptors, plus retries, auth refresh, caching, cancellation."
    },
    "OperationQueueBasics/OperationQueue-ComparisonNotes.md": {
        "id": "operation-queue",
        "title": "OperationQueue vs Grand Central Dispatch Decision Table",
        "category": "Concurrency & Threading",
        "icon": "⛓️",
        "relatedQuestions": ["T1-05"],
        "summary": "Dependency graphs, priority, maxConcurrentOperationCount, and cancellation in OperationQueue."
    },
    "PerformanceProfiling/PerformanceProfiling-TalkingPoints.md": {
        "id": "performance-profiling",
        "title": "Performance Profiling & Instruments — Talking Points",
        "category": "Performance & Profiling",
        "icon": "⏱️",
        "relatedQuestions": ["T3-05", "T2-05"],
        "summary": "Time Profiler, Allocations, Leaks, Thread Sanitizer, and memory footprint optimization."
    },
    "Security/Security-ComparisonNotes.md": {
        "id": "security-comparison",
        "title": "Security Decision Table (Keychain, Enclave, Pinning)",
        "category": "Security & Compliance",
        "icon": "🛡️",
        "relatedQuestions": ["T3-01", "T3-02", "T3-14"],
        "summary": "Keychain vs Secure Enclave vs App Transport Security vs Certificate Pinning vs Biometrics."
    },
    "SwiftUIInteroperability/Interoperability-README.md": {
        "id": "swiftui-uikit-interop",
        "title": "SwiftUI & UIKit Interoperability — Cheat Sheet",
        "category": "UI & Layout",
        "icon": "🤝",
        "relatedQuestions": ["T1-14"],
        "summary": "UIHostingController, UIViewRepresentable, UIViewControllerRepresentable, Coordinators, and state bridging."
    },
    "SwiftUIStateManagement/StateManagement-README.md": {
        "id": "swiftui-state",
        "title": "SwiftUI State Management — Cheat Sheet",
        "category": "UI & Layout",
        "icon": "🔄",
        "relatedQuestions": ["T1-06"],
        "summary": "@State, @Binding, @StateObject, @ObservedObject, @EnvironmentObject, and iOS 17 @Observable macro."
    },
    "Testing/Testing-TalkingPoints.md": {
        "id": "testing-xctest",
        "title": "Testing, TDD/BDD, and Testability — Talking Points",
        "category": "Testing & Quality",
        "icon": "🧪",
        "relatedQuestions": ["T3-06", "T3-07"],
        "summary": "Unit vs UI testing, mocks vs stubs vs spies, protocol injection, and Given/When/Then BDD methodology."
    },
    "ThreadSafety/ThreadSafety-ComparisonNotes.md": {
        "id": "thread-safety",
        "title": "Thread Safety Primitives Decision Table",
        "category": "Concurrency & Threading",
        "icon": "🔒",
        "relatedQuestions": ["T1-11"],
        "summary": "Serial DispatchQueue vs NSLock vs NSRecursiveLock vs os_unfair_lock vs Swift Actors."
    },
    "iOSInternals/iOSInternals-TalkingPoints.md": {
        "id": "ios-internals",
        "title": "iOS Internals — Interview Talking Points",
        "category": "Internals & Lifecycle",
        "icon": "⚙️",
        "relatedQuestions": ["T1-13"],
        "summary": "dyld dynamic linker, UIApplicationMain, Run Loops (kCFRunLoopCommonModes), and watchdog crash prevention."
    }
}

# The 7 Senior iOS Mastery Domains
TOPIC_HUBS = [
    {
        "id": "architecture",
        "title": "Architecture & Design Patterns",
        "icon": "🏗️",
        "badge": "Core Architecture",
        "color": "#6366f1",
        "tagline": "MVVM, Clean Architecture, VIPER, Coordinator Routing, Dependency Injection, and SOLID Principles.",
        "summary": "Enterprise presentation patterns, separation of concerns, decoupling navigation flows, and testable dependency hierarchies.",
        "docIds": [
            "clean-architecture",
            "coordinator-pattern",
            "dependency-injection",
            "mvvm",
            "repository-pattern",
            "solid-principles",
            "viper-pattern",
            "swiftui-state",
            "swiftui-uikit-interop"
        ],
        "questionIds": ["T1-06", "T1-07", "T1-08", "T1-09", "T1-12", "T1-14", "T1-15"]
    },
    {
        "id": "concurrency",
        "title": "Concurrency & Multithreading",
        "icon": "⚡",
        "badge": "Threading & Safety",
        "color": "#f59e0b",
        "tagline": "Swift Actors, async/await, Task Groups, Locks, GCD Queues, and Race Condition Diagnostics.",
        "summary": "Compiler-enforced actor isolation, structured concurrency lifecycle, low-level mutexes, and deadlock prevention.",
        "docIds": [
            "multithreading-gcd",
            "concurrency-issues",
            "thread-safety",
            "operation-queue"
        ],
        "questionIds": ["T1-01", "T1-02", "T1-03", "T1-04", "T1-05", "T1-11"]
    },
    {
        "id": "modularity-performance",
        "title": "Modularity, Build & Launch Performance",
        "icon": "📦",
        "badge": "Scale & Speed",
        "color": "#06b6d4",
        "tagline": "SPM Packages, Static vs Dynamic Linkage, Build Optimization, App Thinning, and UI Performance.",
        "summary": "Pre-main dyld load costs, Interface vs Implementation targets, mergeable libraries, asset thinning, and Instruments profiling.",
        "docIds": [
            "modular-architecture",
            "performance-profiling",
            "autolayout-basics",
            "composable-ui",
            "design-system",
            "ios-internals"
        ],
        "questionIds": ["T1-13", "T1-16", "T1-17", "T2-05", "T3-05", "T3-08", "T3-09", "T3-11"]
    },
    {
        "id": "networking",
        "title": "Networking & API Resiliency",
        "icon": "🌐",
        "badge": "Resilient APIs",
        "color": "#10b981",
        "tagline": "URLSession Abstractions, REST vs GraphQL, Interceptors, Caching, and Retry Policies.",
        "summary": "Contract-driven API schemas, Decodable mapping, token refresh interceptors, and network layer unit testing.",
        "docIds": [
            "networking-architecture"
        ],
        "questionIds": ["T1-10", "T3-12"]
    },
    {
        "id": "security-compliance",
        "title": "Security, Auth & Regulatory Compliance",
        "icon": "🔒",
        "badge": "Financial Security",
        "color": "#f43f5e",
        "tagline": "Keychain, Secure Enclave, SSL Certificate Pinning, Biometrics, and PCI-DSS / SOX / GDPR.",
        "summary": "Hardware-backed cryptographic keys, MITM defense, LocalAuthentication, and financial governance standards.",
        "docIds": [
            "security-comparison",
            "leadership-ownership"
        ],
        "questionIds": ["T3-01", "T3-02", "T3-14", "T4-01", "T4-02", "T4-03"]
    },
    {
        "id": "persistence-memory",
        "title": "Data Persistence & Memory Management",
        "icon": "💾",
        "badge": "Storage & Memory",
        "color": "#a855f7",
        "tagline": "Core Data vs SQLite vs Realm, Offline Sync Outbox, ARC Retain Cycles, and Leaks.",
        "summary": "Local cache invalidation, relational object graphs, memory footprint optimization, and retain cycle diagnosis.",
        "docIds": [
            "data-persistence"
        ],
        "questionIds": ["T3-03", "T3-04"]
    },
    {
        "id": "testing-delivery",
        "title": "Testing, CI/CD & AI Engineering",
        "icon": "🧪",
        "badge": "Quality & AI",
        "color": "#38bdf8",
        "tagline": "XCTest, Mocks vs Stubs, TDD/BDD, Fastlane CI/CD, Feature Flags, and On-Device vs Cloud AI.",
        "summary": "Automated regression pipelines, protocol test doubles, phased release gating, and AI system integration.",
        "docIds": [
            "testing-xctest"
        ],
        "questionIds": ["T2-01", "T2-02", "T2-03", "T2-04", "T3-06", "T3-07", "T3-10", "T3-13"]
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
    question_to_hub = {}
    doc_to_hub = {}

    for hub in TOPIC_HUBS:
        for qid in hub["questionIds"]:
            question_to_hub[qid] = {
                "id": hub["id"],
                "title": hub["title"],
                "icon": hub["icon"],
                "color": hub["color"]
            }
        for doc_id in hub["docIds"]:
            doc_to_hub[doc_id] = {
                "id": hub["id"],
                "title": hub["title"],
                "icon": hub["icon"],
                "color": hub["color"]
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

    # Sort docs by category then title
    category_order = [
        "Architecture",
        "Concurrency & Threading",
        "Networking & APIs",
        "Data & Storage",
        "UI & Layout",
        "Performance & Profiling",
        "Security & Compliance",
        "Testing & Quality",
        "Leadership & Process",
        "Internals & Lifecycle"
    ]
    def cat_key(d):
        try:
            return category_order.index(d["category"])
        except ValueError:
            return 99
    module_docs.sort(key=lambda d: (cat_key(d), d["title"]))

    print(f"Loaded {len(questions)} questions.")
    print(f"Loaded {len(module_docs)} module documents across {len(TOPIC_HUBS)} Topic Hubs.")

    questions_json = json.dumps(questions)
    docs_json = json.dumps(module_docs)
    question_to_docs_json = json.dumps(question_to_docs)
    topic_hubs_json = json.dumps(TOPIC_HUBS)
    question_to_hub_json = json.dumps(question_to_hub)
    doc_to_hub_json = json.dumps(doc_to_hub)

    template = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Citi iOS Senior Interview Master Suite — Hubs, Questions & Deep Dives</title>
  <meta name="description" content="Integrated senior iOS engineering interview preparation platform: 7 domain mastery hubs, {len(questions)} questions with pitches and Swift code, and {len(module_docs)} module architecture guides.">
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
      --sidebar-width: 340px;
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

    /* Sidebar Mode Tabs (3 tabs now!) */
    .sidebar-tabs {{
      display: flex;
      padding: 0.4rem 0.6rem;
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid var(--border-color);
      gap: 0.35rem;
    }}

    [data-theme="light"] .sidebar-tabs {{
      background: rgba(0, 0, 0, 0.04);
    }}

    .sidebar-tab-btn {{
      flex: 1;
      padding: 0.45rem 0.35rem;
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      transition: all 0.2s ease;
      white-space: nowrap;
    }}

    .sidebar-tab-btn:hover {{
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.05);
    }}

    .sidebar-tab-btn.active {{
      background: var(--accent-indigo);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
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
      gap: 0.2rem;
    }}

    .sidebar-tier-header {{
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent-indigo-light);
      padding: 0.6rem 0.65rem 0.25rem 0.65rem;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}

    .sidebar-item {{
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.45rem 0.65rem;
      border-radius: var(--radius-sm);
      text-decoration: none;
      color: var(--text-secondary);
      font-size: 0.82rem;
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
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.12rem 0.35rem;
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
      font-size: 0.75rem;
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

    /* Global Perspective Switcher (Hubs vs Tiers vs Docs) */
    .view-switcher-bar {{
      display: flex;
      gap: 0.75rem;
      padding: 0.4rem;
      background: rgba(18, 24, 38, 0.6);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      backdrop-filter: blur(16px);
      box-shadow: var(--shadow-sm);
    }}

    [data-theme="light"] .view-switcher-bar {{
      background: #f1f5f9;
    }}

    .view-switch-btn {{
      flex: 1;
      padding: 0.75rem 1.25rem;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.92rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }}

    .view-switch-btn:hover {{
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.05);
    }}

    .view-switch-btn.active {{
      background: linear-gradient(135deg, var(--accent-indigo) 0%, #4f46e5 100%);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    }}

    .view-switch-btn .pill-count {{
      font-size: 0.74rem;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.25);
      color: inherit;
    }}

    .view-switch-btn.active .pill-count {{
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }}

    /* Quick Jump Pill Strip for Hubs */
    .hubs-quick-strip {{
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding: 0.25rem 0.1rem 0.65rem 0.1rem;
      scrollbar-width: thin;
    }}

    .hub-jump-pill {{
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

    .hub-jump-pill:hover {{
      color: var(--text-primary);
      border-color: var(--border-accent);
      transform: translateY(-1px);
    }}

    .hub-jump-pill .pill-num {{
      font-size: 0.72rem;
      opacity: 0.8;
      background: rgba(255, 255, 255, 0.08);
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
    }}

    /* Topic Hub Master Container */
    .topic-hub-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.75rem;
      box-shadow: var(--shadow-md);
      backdrop-filter: blur(16px);
      margin-bottom: 2rem;
      position: relative;
      transition: border-color 0.25s ease;
    }}

    .topic-hub-card:hover {{
      border-color: var(--border-accent);
    }}

    .hub-header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      gap: 1.25rem;
    }}

    .hub-title-group {{
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }}

    .hub-title-row {{
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }}

    .hub-icon {{
      font-size: 2rem;
      line-height: 1;
    }}

    .hub-title {{
      font-size: 1.45rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }}

    .hub-badge {{
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}

    .hub-tagline {{
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }}

    .hub-meta-stats {{
      display: flex;
      gap: 0.65rem;
      align-items: center;
      flex-wrap: wrap;
    }}

    .hub-stat-chip {{
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-color);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
    }}

    .hub-stat-chip strong {{
      color: var(--text-primary);
    }}

    /* Hub Subsections: Guides Strip & Questions */
    .hub-section-label {{
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent-indigo-light);
      font-weight: 700;
      margin-bottom: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }}

    /* Guides Ribbon Inside Hub */
    .hub-guides-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.85rem;
      margin-bottom: 1.75rem;
    }}

    .hub-guide-card {{
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }}

    .hub-guide-card:hover {{
      background: rgba(255, 255, 255, 0.06);
      border-color: var(--accent-indigo);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }}

    [data-theme="light"] .hub-guide-card {{
      background: #f8fafc;
    }}

    [data-theme="light"] .hub-guide-card:hover {{
      background: #ffffff;
    }}

    .hub-guide-top {{
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
    }}

    .hub-guide-icon {{
      font-size: 1.35rem;
      line-height: 1;
      padding: 0.35rem;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.05);
    }}

    .hub-guide-title {{
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.35;
    }}

    .hub-guide-desc {{
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.45;
    }}

    .hub-guide-footer {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color);
    }}

    .hub-read-btn {{
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--accent-indigo-light);
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.2rem 0.4rem;
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
    }}

    .hub-read-btn:hover {{
      background: rgba(99, 102, 241, 0.15);
      color: #ffffff;
    }}

    /* Questions Grid inside Hub */
    .hub-questions-list {{
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }}

    /* Progress Banner */
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

    /* Filters Section */
    .filters-section {{
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

    .filters-row {{
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

    .filter-select {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }}

    /* Question Cards */
    .questions-grid {{
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }}

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

    .badge-domain {{
      background: rgba(6, 182, 212, 0.12);
      color: var(--accent-cyan);
      border: 1px solid rgba(6, 182, 212, 0.3);
      cursor: pointer;
      transition: all 0.2s ease;
    }}

    .badge-domain:hover {{
      background: rgba(6, 182, 212, 0.25);
      transform: translateY(-1px);
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

    /* Pitch Callout Box */
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

    /* Card Related Module Guides Banner */
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

    /* Docs Catalog & Reader Section */
    .doc-catalog-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }}

    .doc-catalog-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(16px);
    }}

    .doc-catalog-card:hover {{
      transform: translateY(-2px);
      border-color: var(--border-accent);
      background: var(--bg-card-hover);
      box-shadow: var(--shadow-md);
    }}

    .doc-card-top {{
      display: flex;
      gap: 0.85rem;
      margin-bottom: 0.75rem;
    }}

    .doc-card-icon {{
      font-size: 2rem;
      line-height: 1;
      padding: 0.4rem;
      background: rgba(255, 255, 255, 0.04);
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }}

    .doc-card-info h3 {{
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
      line-height: 1.35;
    }}

    .doc-card-category {{
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--accent-indigo-light);
      font-weight: 700;
    }}

    .doc-card-summary {{
      font-size: 0.86rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 1rem;
    }}

    .doc-card-footer {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.78rem;
    }}

    .doc-path-tag {{
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 180px;
    }}

    .open-doc-btn {{
      background: var(--accent-indigo);
      border: none;
      color: #ffffff;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      font-size: 0.78rem;
      transition: background 0.2s;
    }}

    .open-doc-btn:hover {{
      background: var(--accent-indigo-light);
    }}

    /* Full-Screen Document Reader */
    .doc-reader-view {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 2.25rem;
      box-shadow: var(--shadow-lg);
      backdrop-filter: blur(20px);
    }}

    .doc-reader-toolbar {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.25rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      gap: 1rem;
      flex-wrap: wrap;
    }}

    .back-to-catalog-btn {{
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s;
    }}

    .back-to-catalog-btn:hover {{
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--border-accent);
    }}

    .doc-reader-meta {{
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }}

    .doc-path-badge {{
      font-family: var(--font-mono);
      font-size: 0.78rem;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }}

    .copy-path-btn {{
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.85rem;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
    }}

    .copy-path-btn:hover {{
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.1);
    }}

    .doc-related-questions-banner {{
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: var(--radius-sm);
      padding: 0.85rem 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      font-size: 0.85rem;
    }}

    .related-q-btn {{
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: var(--text-primary);
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }}

    .related-q-btn:hover {{
      background: var(--accent-indigo);
      color: #ffffff;
      transform: translateY(-1px);
    }}

    /* Markdown Rendered Typography */
    .doc-content {{
      line-height: 1.75;
      color: var(--text-primary);
    }}

    .doc-content h1.doc-h1 {{
      font-size: 2rem;
      font-weight: 800;
      margin: 1.5rem 0 1rem 0;
      letter-spacing: -0.02em;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }}

    .doc-content h2.doc-h2 {{
      font-size: 1.45rem;
      font-weight: 700;
      margin: 2rem 0 0.85rem 0;
      color: var(--accent-indigo-light);
    }}

    .doc-content h3.doc-h3 {{
      font-size: 1.2rem;
      font-weight: 700;
      margin: 1.5rem 0 0.65rem 0;
    }}

    .doc-content h4.doc-h4 {{
      font-size: 1.05rem;
      font-weight: 600;
      margin: 1.25rem 0 0.5rem 0;
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
      .filters-row {{
        flex-direction: column;
        align-items: stretch;
      }}
      .view-switcher-bar {{
        flex-direction: column;
      }}
      .doc-reader-view {{
        padding: 1.25rem;
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
          <span>📚</span> <span>Knowledge Index</span>
        </div>
        <button class="sidebar-close-btn" id="closeSidebarBtn" title="Close Sidebar">✕</button>
      </div>

      <!-- Mode Tabs inside Sidebar: Hubs vs Questions vs Docs -->
      <div class="sidebar-tabs">
        <button class="sidebar-tab-btn active" id="sideTabHubsBtn" onclick="setSidebarTab('hubs')">
          <span>🌐 Hubs</span> <span class="sidebar-id-badge" id="sideBadgeH">{len(TOPIC_HUBS)}</span>
        </button>
        <button class="sidebar-tab-btn" id="sideTabQuestionsBtn" onclick="setSidebarTab('questions')">
          <span>❓ Questions</span> <span class="sidebar-id-badge" id="sideBadgeQ">{len(questions)}</span>
        </button>
        <button class="sidebar-tab-btn" id="sideTabDocsBtn" onclick="setSidebarTab('docs')">
          <span>📚 Guides</span> <span class="sidebar-id-badge" id="sideBadgeD">{len(module_docs)}</span>
        </button>
      </div>

      <!-- Quick Search inside Sidebar -->
      <div class="sidebar-search-box">
        <input type="text" id="sidebarQuickSearch" class="sidebar-search-input" placeholder="Quick filter...">
      </div>

      <!-- Navigation Content -->
      <nav class="sidebar-nav" id="sidebarNav"></nav>
    </aside>

    <!-- Mobile Backdrop -->
    <div class="sidebar-backdrop" id="sidebarBackdrop"></div>

    <!-- Main Content -->
    <div class="main-area">
      <header>
        <div class="header-content">
          <h1>Citi iOS Senior Interview Master Suite</h1>
          <p>Integrated mastery workspace: 7 senior architectural domains combining deep-dive module guides and targeted interview questions with spoken pitches.</p>
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

      <!-- Global Perspective Switcher -->
      <div class="view-switcher-bar">
        <button class="view-switch-btn active" id="viewHubsBtn" onclick="switchMainView('hubs')">
          <span>🌐 Topic Mastery Hubs</span>
          <span class="pill-count">7 Hubs</span>
        </button>
        <button class="view-switch-btn" id="viewQuestionsBtn" onclick="switchMainView('questions')">
          <span>🎯 Interview Tiers (Mock Drill)</span>
          <span class="pill-count">{len(questions)} Qs</span>
        </button>
        <button class="view-switch-btn" id="viewDocsBtn" onclick="switchMainView('docs')">
          <span>📚 Full Guides Library</span>
          <span class="pill-count">{len(module_docs)} Guides</span>
        </button>
      </div>

      <!-- PERSPECTIVE 1: TOPIC MASTERY HUBS (Idea 1 Recommended) -->
      <div id="hubsSection">
        <!-- Quick Jump Pill Strip -->
        <div class="hubs-quick-strip" id="hubsQuickStrip"></div>

        <!-- Global Search across Hubs -->
        <div class="filters-section" style="margin-bottom: 1.5rem;">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="hubSearchInput" class="search-input" placeholder="Search across all 7 domain hubs (e.g. Actor, Linkage, Core Data, Coordinator, Instruments)...">
            <button class="clear-search-btn" id="clearHubSearchBtn">✕</button>
          </div>
        </div>

        <!-- Hubs Container -->
        <div id="hubsContainer"></div>
      </div>

      <!-- PERSPECTIVE 2: QUESTIONS BY TIER (Mock Drill Flashcards) -->
      <div id="questionsSection" style="display: none;">
        <!-- Progress Tracker -->
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

        <!-- Filter Controls -->
        <div class="filters-section">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="searchInput" class="search-input" placeholder="Search by topic, keyword, or concept (e.g. Actor, GCD, URLSession, Build time, App size, Static vs Dynamic)...">
            <button class="clear-search-btn" id="clearSearchBtn">✕</button>
          </div>

          <div class="filters-row">
            <div class="pill-group" id="tierPills">
              <button class="filter-pill active" data-tier="all">All ({len(questions)})</button>
              <button class="filter-pill" data-tier="Tier 1">Tier 1: Cold (17)</button>
              <button class="filter-pill" data-tier="Tier 2">Tier 2: Differentiator (5)</button>
              <button class="filter-pill" data-tier="Tier 3">Tier 3: Concept (14)</button>
              <button class="filter-pill" data-tier="Tier 4">Tier 4: Safety (3)</button>
            </div>

            <div style="display: flex; gap: 0.6rem; align-items: center;">
              <select class="filter-select" id="diffFilter">
                <option value="all">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <button class="header-btn" id="toggleAllBtn">Expand All</button>
            </div>
          </div>
        </div>

        <!-- Questions List Container -->
        <div class="questions-grid" id="questionsContainer" style="margin-top: 1.25rem;"></div>
      </div>

      <!-- PERSPECTIVE 3: MODULE GUIDES & NOTES (Dedicated Full Reader) -->
      <div id="docsSection" style="display: none;">
        <!-- Category Pills for Docs -->
        <div class="filters-section" id="docsFiltersSection">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="docSearchInput" class="search-input" placeholder="Search 24 module guides by title, concept, or code snippet...">
            <button class="clear-search-btn" id="clearDocSearchBtn">✕</button>
          </div>

          <div class="filters-row">
            <div class="pill-group" id="docCategoryPills">
              <button class="filter-pill active" data-cat="all">All Guides ({len(module_docs)})</button>
              <button class="filter-pill" data-cat="Architecture">Architecture (8)</button>
              <button class="filter-pill" data-cat="Concurrency & Threading">Concurrency (4)</button>
              <button class="filter-pill" data-cat="UI & Layout">UI & Layout (5)</button>
              <button class="filter-pill" data-cat="Networking & APIs">Networking (1)</button>
              <button class="filter-pill" data-cat="Data & Storage">Data (1)</button>
              <button class="filter-pill" data-cat="Performance & Profiling">Performance (1)</button>
              <button class="filter-pill" data-cat="Security & Compliance">Security (1)</button>
              <button class="filter-pill" data-cat="Testing & Quality">Testing (1)</button>
              <button class="filter-pill" data-cat="Leadership & Process">Leadership (1)</button>
            </div>
          </div>
        </div>

        <!-- Doc Catalog Grid (shown when browsing all or searching) -->
        <div id="docCatalogContainer" class="doc-catalog-grid" style="margin-top: 1.25rem;"></div>

        <!-- Doc Reader View (shown when reading a specific guide) -->
        <div id="docReaderContainer" class="doc-reader-view" style="display: none;">
          <div class="doc-reader-toolbar">
            <button class="back-to-catalog-btn" onclick="showDocCatalog()">
              <span>←</span> <span>Back to All Guides</span>
            </button>
            <div class="doc-reader-meta">
              <span class="doc-path-badge" id="readerFilePath">
                <span id="readerPathText"></span>
                <button class="copy-path-btn" onclick="copyFilePath()" title="Copy Relative Path">📋</button>
              </span>
            </div>
          </div>

          <!-- Related Questions banner -->
          <div class="doc-related-questions-banner" id="readerRelatedBanner">
            <span>🎯 Related Senior Interview Questions:</span>
            <div id="readerRelatedPills" style="display: inline-flex; gap: 0.5rem; flex-wrap: wrap;"></div>
          </div>

          <!-- Document Rendered Body -->
          <article class="doc-content" id="readerContent"></article>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" id="emptyState" style="display: none;">
        <h3>No items matched your query</h3>
        <p>Try searching for a different keyword or resetting your filters.</p>
      </div>

      <footer>
        <p>Citi iOS Interview Prep • Standalone Offline Dashboard • 7 Domain Hubs • {len(questions)} Curated Questions • {len(module_docs)} Architecture Guides</p>
      </footer>
    </div>
  </div>

  <!-- Floating Quick Toggle Button (Always reachable while scrolling) -->
  <button id="floatingIndexBtn" class="floating-index-btn" title="Open Knowledge Index (or Press 'M')">
    <span>📑</span> <span>Show Knowledge Index</span> <span class="kbd-hint">M</span>
  </button>

  <script>
    // Embedded JSON Data
    const QUESTIONS = {questions_json};
    const MODULE_DOCS = {docs_json};
    const QUESTION_TO_DOCS = {question_to_docs_json};
    const TOPIC_HUBS = {topic_hubs_json};
    const QUESTION_TO_HUB = {question_to_hub_json};
    const DOC_TO_HUB = {doc_to_hub_json};

    // State
    let currentMainView = localStorage.getItem('citi_main_view') || 'hubs';
    let currentSidebarTab = 'hubs';
    let currentTier = 'all';
    let currentDiff = 'all';
    let currentDocCategory = 'all';
    let searchQuery = '';
    let hubSearchQuery = '';
    let docSearchQuery = '';
    let sidebarFilterQuery = '';
    let allExpanded = false;
    let reviewedIDs = new Set(JSON.parse(localStorage.getItem('citi_reviewed_questions') || '[]'));
    let activeQuestionId = null;
    let activeDocId = null;

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

    const sideTabHubsBtn = document.getElementById('sideTabHubsBtn');
    const sideTabQuestionsBtn = document.getElementById('sideTabQuestionsBtn');
    const sideTabDocsBtn = document.getElementById('sideTabDocsBtn');

    const viewHubsBtn = document.getElementById('viewHubsBtn');
    const viewQuestionsBtn = document.getElementById('viewQuestionsBtn');
    const viewDocsBtn = document.getElementById('viewDocsBtn');

    const hubsSection = document.getElementById('hubsSection');
    const questionsSection = document.getElementById('questionsSection');
    const docsSection = document.getElementById('docsSection');

    const hubsQuickStrip = document.getElementById('hubsQuickStrip');
    const hubsContainer = document.getElementById('hubsContainer');
    const hubSearchInput = document.getElementById('hubSearchInput');
    const clearHubSearchBtn = document.getElementById('clearHubSearchBtn');

    const questionsContainer = document.getElementById('questionsContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const tierPills = document.getElementById('tierPills');
    const diffFilter = document.getElementById('diffFilter');
    const toggleAllBtn = document.getElementById('toggleAllBtn');

    const docsFiltersSection = document.getElementById('docsFiltersSection');
    const docSearchInput = document.getElementById('docSearchInput');
    const clearDocSearchBtn = document.getElementById('clearDocSearchBtn');
    const docCategoryPills = document.getElementById('docCategoryPills');
    const docCatalogContainer = document.getElementById('docCatalogContainer');
    const docReaderContainer = document.getElementById('docReaderContainer');
    const readerFilePath = document.getElementById('readerFilePath');
    const readerPathText = document.getElementById('readerPathText');
    const readerRelatedBanner = document.getElementById('readerRelatedBanner');
    const readerRelatedPills = document.getElementById('readerRelatedPills');
    const readerContent = document.getElementById('readerContent');

    const emptyState = document.getElementById('emptyState');
    const reviewedCountEl = document.getElementById('reviewedCount');
    const totalCountEl = document.getElementById('totalCount');
    const percentValEl = document.getElementById('percentVal');
    const progressBarFill = document.getElementById('progressBarFill');
    const resetProgressBtn = document.getElementById('resetProgressBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    // Sidebar Visibility State Management
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

      // Control floating button: always visible when sidebar is closed
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

    // Keyboard shortcut: Press 'M' to toggle sidebar
    document.addEventListener('keydown', (e) => {{
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

    // Switch Main Views (Hubs vs Questions vs Docs)
    window.switchMainView = function(view) {{
      currentMainView = view;
      localStorage.setItem('citi_main_view', view);

      viewHubsBtn.classList.toggle('active', view === 'hubs');
      viewQuestionsBtn.classList.toggle('active', view === 'questions');
      viewDocsBtn.classList.toggle('active', view === 'docs');

      hubsSection.style.display = (view === 'hubs') ? 'block' : 'none';
      questionsSection.style.display = (view === 'questions') ? 'block' : 'none';
      docsSection.style.display = (view === 'docs') ? 'block' : 'none';

      if (view === 'hubs') {{
        setSidebarTab('hubs', false);
        renderTopicHubs();
      }} else if (view === 'questions') {{
        setSidebarTab('questions', false);
        renderQuestions();
      }} else {{
        setSidebarTab('docs', false);
        if (activeDocId) {{
          renderDocReader(activeDocId);
        }} else {{
          showDocCatalog();
        }}
      }}
    }};

    // Switch Sidebar Tab
    window.setSidebarTab = function(tab, syncMainView = false) {{
      currentSidebarTab = tab;
      sidebarQuickSearch.value = '';
      sidebarFilterQuery = '';

      sideTabHubsBtn.classList.toggle('active', tab === 'hubs');
      sideTabQuestionsBtn.classList.toggle('active', tab === 'questions');
      sideTabDocsBtn.classList.toggle('active', tab === 'docs');

      if (tab === 'hubs') {{
        sidebarQuickSearch.placeholder = 'Filter 7 domains (e.g. Concurrency)...';
        if (syncMainView && currentMainView !== 'hubs') switchMainView('hubs');
      }} else if (tab === 'questions') {{
        sidebarQuickSearch.placeholder = 'Filter 39 questions (e.g. Actor)...';
        if (syncMainView && currentMainView !== 'questions') switchMainView('questions');
      }} else {{
        sidebarQuickSearch.placeholder = 'Filter 24 guides (e.g. Coordinator)...';
        if (syncMainView && currentMainView !== 'docs') switchMainView('docs');
      }}
      renderSidebar();
    }};

    // Render Sidebar Navigation
    function renderSidebar() {{
      sidebarNav.innerHTML = '';
      const query = sidebarFilterQuery.toLowerCase();

      if (currentSidebarTab === 'hubs') {{
        const filteredHubs = TOPIC_HUBS.filter(h => {{
          if (!query) return true;
          return h.title.toLowerCase().includes(query) ||
                 h.summary.toLowerCase().includes(query) ||
                 h.badge.toLowerCase().includes(query);
        }});

        filteredHubs.forEach(h => {{
          const a = document.createElement('a');
          a.className = 'sidebar-item';
          a.href = `#hub-${{h.id}}`;
          a.onclick = (e) => {{
            if (e) e.preventDefault();
            jumpToHub(h.id);
          }};

          // Calculate hub progress
          const hubQs = QUESTIONS.filter(q => h.questionIds.includes(q.id));
          const reviewedInHub = hubQs.filter(q => reviewedIDs.has(q.id)).length;

          a.innerHTML = `
            <span style="font-size: 1.1rem; line-height: 1;">${{h.icon}}</span>
            <span class="sidebar-item-text" title="${{escapeHtml(h.title)}}">
              ${{escapeHtml(h.title)}}
            </span>
            <span class="sidebar-id-badge">${{reviewedInHub}}/${{hubQs.length}}</span>
          `;
          sidebarNav.appendChild(a);
        }});
      }} else if (currentSidebarTab === 'questions') {{
        const filtered = QUESTIONS.filter(q => {{
          if (!query) return true;
          return q.question.toLowerCase().includes(query) || 
                 q.id.toLowerCase().includes(query) ||
                 q.category.toLowerCase().includes(query);
        }});

        const grouped = {{}};
        filtered.forEach(q => {{
          const tierName = q.category.split('—')[0].trim();
          if (!grouped[tierName]) grouped[tierName] = [];
          grouped[tierName].push(q);
        }});

        for (const [tierName, items] of Object.entries(grouped)) {{
          const tierHeader = document.createElement('div');
          tierHeader.className = 'sidebar-tier-header';
          tierHeader.textContent = `${{tierName}} (${{items.length}})`;
          sidebarNav.appendChild(tierHeader);

          items.forEach(q => {{
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
            sidebarNav.appendChild(a);
          }});
        }}
      }} else {{
        const filtered = MODULE_DOCS.filter(d => {{
          if (!query) return true;
          return d.title.toLowerCase().includes(query) ||
                 d.category.toLowerCase().includes(query) ||
                 d.filename.toLowerCase().includes(query) ||
                 d.summary.toLowerCase().includes(query);
        }});

        const grouped = {{}};
        filtered.forEach(d => {{
          if (!grouped[d.category]) grouped[d.category] = [];
          grouped[d.category].push(d);
        }});

        for (const [catName, items] of Object.entries(grouped)) {{
          const catHeader = document.createElement('div');
          catHeader.className = 'sidebar-tier-header';
          catHeader.textContent = `${{catName}} (${{items.length}})`;
          sidebarNav.appendChild(catHeader);

          items.forEach(d => {{
            const isActive = (d.id === activeDocId);
            const a = document.createElement('a');
            a.className = `sidebar-item ${{isActive ? 'active' : ''}}`;
            a.id = `side-doc-${{d.id}}`;
            a.href = `#${{d.id}}`;
            a.onclick = (e) => {{
              if (e) e.preventDefault();
              openModuleDoc(d.id);
            }};

            a.innerHTML = `
              <span class="sidebar-doc-icon">${{d.icon}}</span>
              <span class="sidebar-item-text" title="${{escapeHtml(d.title)}}">${{escapeHtml(d.title)}}</span>
            `;
            sidebarNav.appendChild(a);
          }});
        }}
      }}
    }}

    sidebarQuickSearch.addEventListener('input', (e) => {{
      sidebarFilterQuery = e.target.value.trim();
      renderSidebar();
    }});

    // Jump to specific Topic Hub
    window.jumpToHub = function(hubId) {{
      if (currentMainView !== 'hubs') {{
        switchMainView('hubs');
      }}
      setTimeout(() => {{
        const el = document.getElementById(`hub-${{hubId}}`);
        if (el) {{
          el.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
          el.style.borderColor = 'var(--accent-indigo)';
          setTimeout(() => {{
            el.style.borderColor = '';
          }}, 1200);
        }}
      }}, 50);
    }};

    // ==========================================
    // PERSPECTIVE 1: RENDER TOPIC MASTERY HUBS
    // ==========================================
    function renderTopicHubs() {{
      hubsContainer.innerHTML = '';
      hubsQuickStrip.innerHTML = '';

      const term = hubSearchQuery.toLowerCase();

      // 1. Build Quick Jump Strip
      TOPIC_HUBS.forEach(hub => {{
        const pill = document.createElement('a');
        pill.className = 'hub-jump-pill';
        pill.href = `#hub-${{hub.id}}`;
        pill.onclick = (e) => {{
          e.preventDefault();
          jumpToHub(hub.id);
        }};
        pill.innerHTML = `
          <span>${{hub.icon}}</span>
          <span>${{hub.title.split('&')[0].trim()}}</span>
          <span class="pill-num">${{hub.questionIds.length}} Qs</span>
        `;
        hubsQuickStrip.appendChild(pill);
      }});

      let matchedHubsCount = 0;

      // 2. Render each Topic Hub
      TOPIC_HUBS.forEach(hub => {{
        // Gather docs and questions for this hub
        const hubDocs = MODULE_DOCS.filter(d => hub.docIds.includes(d.id));
        const hubQuestions = QUESTIONS.filter(q => hub.questionIds.includes(q.id));

        // Filter based on search query
        let filteredDocs = hubDocs;
        let filteredQuestions = hubQuestions;

        if (term) {{
          filteredDocs = hubDocs.filter(d => 
            d.title.toLowerCase().includes(term) ||
            d.summary.toLowerCase().includes(term) ||
            d.filename.toLowerCase().includes(term)
          );
          filteredQuestions = hubQuestions.filter(q => 
            q.question.toLowerCase().includes(term) ||
            q.answer.toLowerCase().includes(term) ||
            (q.interviewSentence || '').toLowerCase().includes(term) ||
            q.id.toLowerCase().includes(term)
          );

          const hubMatches = hub.title.toLowerCase().includes(term) || hub.summary.toLowerCase().includes(term);
          if (!hubMatches && filteredDocs.length === 0 && filteredQuestions.length === 0) {{
            return; // Skip this hub
          }}
          if (hubMatches && filteredDocs.length === 0 && filteredQuestions.length === 0) {{
            filteredDocs = hubDocs;
            filteredQuestions = hubQuestions;
          }}
        }}

        matchedHubsCount++;

        const reviewedInHub = hubQuestions.filter(q => reviewedIDs.has(q.id)).length;
        const totalInHub = hubQuestions.length;
        const pctInHub = totalInHub ? Math.round((reviewedInHub / totalInHub) * 100) : 0;

        const hubCard = document.createElement('div');
        hubCard.className = 'topic-hub-card';
        hubCard.id = `hub-${{hub.id}}`;
        hubCard.style.borderLeft = `5px solid ${{hub.color}}`;

        // Render Guide Cards inside this hub
        let guidesHTML = '';
        if (filteredDocs.length > 0) {{
          filteredDocs.forEach(d => {{
            guidesHTML += `
              <div class="hub-guide-card" onclick="openModuleDoc('${{d.id}}')">
                <div class="hub-guide-top">
                  <div class="hub-guide-icon">${{d.icon}}</div>
                  <div style="flex: 1; min-width: 0;">
                    <div class="hub-guide-title">${{escapeHtml(d.title)}}</div>
                    <div class="hub-guide-desc">${{escapeHtml(d.summary)}}</div>
                  </div>
                </div>
                <div class="hub-guide-footer">
                  <span class="doc-path-tag">${{d.filename}}</span>
                  <button class="hub-read-btn" onclick="event.stopPropagation(); openModuleDoc('${{d.id}}')">
                    📖 Read Deep Dive →
                  </button>
                </div>
              </div>
            `;
          }});
        }} else {{
          guidesHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem 0;">No module guides matched query.</div>';
        }}

        // Render Question Cards inside this hub
        let questionsHTML = '';
        if (filteredQuestions.length > 0) {{
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
                  <a class="doc-pill-link" onclick="openModuleDoc('${{d.docId}}')">
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
                  <span class="toggle-chevron" id="chev-${{q.id}}">▼</span>
                </h3>

                ${{relatedDocsHTML}}
                ${{pitchHTML}}

                <div class="answer-drawer" id="drawer-${{q.id}}">
                  <div class="answer-heading">In-Depth Breakdown</div>
                  <div class="answer-text">${{escapeHtml(q.answer)}}</div>
                  ${{codeHTML}}
                </div>
              </div>
            `;
          }});
        }} else {{
          questionsHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem 0;">No interview questions matched query.</div>';
        }}

        hubCard.innerHTML = `
          <div class="hub-header">
            <div class="hub-title-group">
              <div class="hub-title-row">
                <span class="hub-icon">${{hub.icon}}</span>
                <h2 class="hub-title">${{escapeHtml(hub.title)}}</h2>
                <span class="hub-badge" style="background: ${{hub.color}}22; color: ${{hub.color}}; border: 1px solid ${{hub.color}}44;">${{hub.badge}}</span>
              </div>
              <p class="hub-tagline">${{escapeHtml(hub.tagline)}}</p>
            </div>
            <div class="hub-meta-stats">
              <span class="hub-stat-chip"><strong>${{hubDocs.length}}</strong> Guides</span>
              <span class="hub-stat-chip"><strong>${{hubQuestions.length}}</strong> Questions</span>
              <span class="hub-stat-chip" style="color: var(--accent-emerald);"><strong>${{pctInHub}}%</strong> Ready</span>
            </div>
          </div>

          <!-- Section A: Module Guides & Decision Tables -->
          <div class="hub-section-label">
            <span>📖 Architectural Guides & Decision Tables (${{filteredDocs.length}})</span>
          </div>
          <div class="hub-guides-grid">
            ${{guidesHTML}}
          </div>

          <!-- Section B: Targeted Interview Questions -->
          <div class="hub-section-label" style="margin-top: 1.5rem;">
            <span>🎯 Targeted Senior Interview Questions (${{filteredQuestions.length}})</span>
          </div>
          <div class="hub-questions-list">
            ${{questionsHTML}}
          </div>
        `;

        hubsContainer.appendChild(hubCard);
      }});

      if (matchedHubsCount === 0) {{
        emptyState.style.display = 'block';
      }} else {{
        emptyState.style.display = 'none';
      }}
    }}

    hubSearchInput.addEventListener('input', (e) => {{
      hubSearchQuery = e.target.value.trim();
      clearHubSearchBtn.style.display = hubSearchQuery ? 'block' : 'none';
      renderTopicHubs();
    }});

    clearHubSearchBtn.addEventListener('click', () => {{
      hubSearchInput.value = '';
      hubSearchQuery = '';
      clearHubSearchBtn.style.display = 'none';
      hubSearchInput.focus();
      renderTopicHubs();
    }});

    // ==========================================
    // PERSPECTIVE 2: RENDER QUESTIONS BY TIER
    // ==========================================
    function renderQuestions() {{
      questionsContainer.innerHTML = '';
      
      const filtered = QUESTIONS.filter(q => {{
        if (currentTier !== 'all' && !q.category.startsWith(currentTier)) return false;
        if (currentDiff !== 'all' && q.difficulty !== currentDiff) return false;
        if (searchQuery) {{
          const term = searchQuery.toLowerCase();
          const matchQ = q.question.toLowerCase().includes(term);
          const matchA = q.answer.toLowerCase().includes(term);
          const matchP = (q.interviewSentence || '').toLowerCase().includes(term);
          const matchID = q.id.toLowerCase().includes(term);
          const matchC = (q.codeExample || '').toLowerCase().includes(term);
          if (!matchQ && !matchA && !matchP && !matchID && !matchC) return false;
        }}
        return true;
      }});

      if (filtered.length === 0) {{
        emptyState.style.display = 'block';
      }} else {{
        emptyState.style.display = 'none';
      }}

      filtered.forEach(q => {{
        const isReviewed = reviewedIDs.has(q.id);
        const card = document.createElement('div');
        card.className = `question-card ${{isReviewed ? 'reviewed' : ''}}`;
        card.id = `card-${{q.id}}`;

        const diffClass = `badge-diff-${{q.difficulty.toLowerCase()}}`;
        const hubInfo = QUESTION_TO_HUB[q.id];
        
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
              <a class="doc-pill-link" onclick="openModuleDoc('${{d.docId}}')">
                <span>${{d.icon}}</span> <span>Deep Dive: ${{d.filename}}</span>
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

        let domainBadgeHTML = '';
        if (hubInfo) {{
          domainBadgeHTML = `<span class="badge badge-domain" onclick="jumpToHub('${{hubInfo.id}}')" title="Open Domain Mastery Hub">${{hubInfo.icon}} ${{hubInfo.title.split('&')[0].trim()}}</span>`;
        }}

        card.innerHTML = `
          <div class="card-header">
            <div class="card-badges">
              <span class="badge badge-id">${{q.id}}</span>
              <span class="badge badge-tier">${{q.category.split('—')[0].trim()}}</span>
              ${{domainBadgeHTML}}
              <span class="badge ${{diffClass}}">${{q.difficulty}}</span>
            </div>
            <label class="card-check-wrap">
              <input type="checkbox" ${{isReviewed ? 'checked' : ''}} onchange="toggleReviewed('${{q.id}}', this.checked)">
              <span>Reviewed</span>
            </label>
          </div>

          <h2 class="card-title" onclick="toggleDrawer('${{q.id}}')">
            <span>${{escapeHtml(q.question)}}</span>
            <span class="toggle-chevron ${{allExpanded ? 'rotated' : ''}}" id="chev-${{q.id}}">▼</span>
          </h2>

          ${{relatedDocsHTML}}
          ${{pitchHTML}}

          <div class="answer-drawer ${{allExpanded ? 'open' : ''}}" id="drawer-${{q.id}}">
            <div class="answer-heading">In-Depth Breakdown</div>
            <div class="answer-text">${{escapeHtml(q.answer)}}</div>
            ${{codeHTML}}
          </div>
        `;

        questionsContainer.appendChild(card);
      }});

      updateProgress();
    }}

    function toggleDrawer(id) {{
      const drawer = document.getElementById(`drawer-${{id}}`);
      const chev = document.getElementById(`chev-${{id}}`);
      if (drawer) {{
        drawer.classList.toggle('open');
        if (chev) chev.classList.toggle('rotated');
      }}
    }}

    toggleAllBtn.addEventListener('click', () => {{
      allExpanded = !allExpanded;
      toggleAllBtn.textContent = allExpanded ? 'Collapse All' : 'Expand All';
      document.querySelectorAll('.answer-drawer').forEach(d => {{
        d.classList.toggle('open', allExpanded);
      }});
      document.querySelectorAll('.toggle-chevron').forEach(c => {{
        c.classList.toggle('rotated', allExpanded);
      }});
    }});

    function updateProgress() {{
      const total = QUESTIONS.length;
      const count = reviewedIDs.size;
      const pct = Math.round((count / total) * 100);
      reviewedCountEl.textContent = count;
      totalCountEl.textContent = total;
      percentValEl.textContent = `${{pct}}%`;
      progressBarFill.style.width = `${{pct}}%`;
    }}

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

      // Refresh sidebar badge if in hubs mode
      if (currentSidebarTab === 'hubs') renderSidebar();
    }}

    resetProgressBtn.addEventListener('click', () => {{
      if (confirm('Are you sure you want to reset all review checkmarks?')) {{
        reviewedIDs.clear();
        localStorage.removeItem('citi_reviewed_questions');
        if (currentMainView === 'questions') renderQuestions();
        else if (currentMainView === 'hubs') renderTopicHubs();
        renderSidebar();
      }}
    }});

    // ==========================================
    // PERSPECTIVE 3: RENDER MODULE GUIDES LIBRARY
    // ==========================================
    function renderDocCatalog() {{
      docCatalogContainer.innerHTML = '';
      docCatalogContainer.style.display = 'grid';
      docReaderContainer.style.display = 'none';
      if (docsFiltersSection) docsFiltersSection.style.display = 'block';

      const filtered = MODULE_DOCS.filter(d => {{
        if (currentDocCategory !== 'all' && d.category !== currentDocCategory) return false;
        if (docSearchQuery) {{
          const term = docSearchQuery.toLowerCase();
          return d.title.toLowerCase().includes(term) ||
                 d.summary.toLowerCase().includes(term) ||
                 d.filename.toLowerCase().includes(term) ||
                 d.category.toLowerCase().includes(term) ||
                 d.rawContent.toLowerCase().includes(term);
        }}
        return true;
      }});

      if (filtered.length === 0) {{
        emptyState.style.display = 'block';
      }} else {{
        emptyState.style.display = 'none';
      }}

      filtered.forEach(d => {{
        const card = document.createElement('div');
        card.className = 'doc-catalog-card';
        card.onclick = () => openModuleDoc(d.id);

        card.innerHTML = `
          <div>
            <div class="doc-card-top">
              <div class="doc-card-icon">${{d.icon}}</div>
              <div class="doc-card-info">
                <div class="doc-card-category">${{escapeHtml(d.category)}}</div>
                <h3>${{escapeHtml(d.title)}}</h3>
              </div>
            </div>
            <p class="doc-card-summary">${{escapeHtml(d.summary)}}</p>
          </div>
          <div class="doc-card-footer">
            <span class="doc-path-tag" title="${{d.filePath}}">${{d.filename}}</span>
            <button class="open-doc-btn" onclick="event.stopPropagation(); openModuleDoc('${{d.id}}')">Read Guide →</button>
          </div>
        `;

        docCatalogContainer.appendChild(card);
      }});
    }}

    window.openModuleDoc = function(docId) {{
      activeDocId = docId;
      if (currentMainView !== 'docs') {{
        switchMainView('docs');
      }} else {{
        renderDocReader(docId);
      }}

      document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
      const activeEl = document.getElementById(`side-doc-${{docId}}`);
      if (activeEl) activeEl.classList.add('active');
    }};

    window.showDocCatalog = function() {{
      activeDocId = null;
      renderDocCatalog();
    }};

    function renderDocReader(docId) {{
      const doc = MODULE_DOCS.find(d => d.id === docId);
      if (!doc) {{
        showDocCatalog();
        return;
      }}

      docCatalogContainer.style.display = 'none';
      docReaderContainer.style.display = 'block';
      if (docsFiltersSection) docsFiltersSection.style.display = 'none';
      emptyState.style.display = 'none';

      readerPathText.textContent = doc.filePath;

      if (doc.relatedQuestions && doc.relatedQuestions.length > 0) {{
        readerRelatedBanner.style.display = 'flex';
        readerRelatedPills.innerHTML = '';
        doc.relatedQuestions.forEach(qid => {{
          const qObj = QUESTIONS.find(q => q.id === qid);
          const qTitle = qObj ? qObj.question : qid;
          const btn = document.createElement('button');
          btn.className = 'related-q-btn';
          btn.innerHTML = `<strong>${{qid}}</strong>: ${{escapeHtml(qTitle)}}`;
          btn.onclick = () => navigateToQuestion(qid);
          readerRelatedPills.appendChild(btn);
        }});
      }} else {{
        readerRelatedBanner.style.display = 'none';
      }}

      readerContent.innerHTML = doc.htmlContent;
      docReaderContainer.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
    }}

    window.copyFilePath = function() {{
      const path = readerPathText.textContent;
      navigator.clipboard.writeText(path).then(() => {{
        const btn = document.querySelector('.copy-path-btn');
        btn.textContent = '✓ Copied!';
        setTimeout(() => {{
          btn.textContent = '📋';
        }}, 2000);
      }});
    }};

    // Navigate to Question across views
    window.navigateToQuestion = function(id, event) {{
      if (event) event.preventDefault();
      activeQuestionId = id;

      if (currentMainView === 'docs') {{
        switchMainView('hubs');
      }}

      setTimeout(() => {{
        let targetCard = document.getElementById(`card-${{id}}`);
        if (!targetCard && currentMainView !== 'questions') {{
          switchMainView('questions');
          targetCard = document.getElementById(`card-${{id}}`);
        }}

        if (targetCard) {{
          targetCard.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
          const drawer = document.getElementById(`drawer-${{id}}`);
          const chev = document.getElementById(`chev-${{id}}`);
          if (drawer) drawer.classList.add('open');
          if (chev) chev.classList.add('rotated');

          targetCard.style.outline = '2px solid var(--accent-indigo)';
          setTimeout(() => {{
            targetCard.style.outline = 'none';
          }}, 2000);
        }}
      }}, 100);
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

    // Global Search listeners for Questions view
    searchInput.addEventListener('input', (e) => {{
      searchQuery = e.target.value.trim();
      clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      renderQuestions();
    }});

    clearSearchBtn.addEventListener('click', () => {{
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
      renderQuestions();
    }});

    docSearchInput.addEventListener('input', (e) => {{
      docSearchQuery = e.target.value.trim();
      clearDocSearchBtn.style.display = docSearchQuery ? 'block' : 'none';
      if (docReaderContainer.style.display === 'block') {{
        showDocCatalog();
      }} else {{
        renderDocCatalog();
      }}
    }});

    clearDocSearchBtn.addEventListener('click', () => {{
      docSearchInput.value = '';
      docSearchQuery = '';
      clearDocSearchBtn.style.display = 'none';
      docSearchInput.focus();
      renderDocCatalog();
    }});

    tierPills.addEventListener('click', (e) => {{
      if (e.target.classList.contains('filter-pill')) {{
        tierPills.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentTier = e.target.dataset.tier;
        renderQuestions();
      }}
    }});

    diffFilter.addEventListener('change', (e) => {{
      currentDiff = e.target.value;
      renderQuestions();
    }});

    docCategoryPills.addEventListener('click', (e) => {{
      if (e.target.classList.contains('filter-pill')) {{
        docCategoryPills.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentDocCategory = e.target.dataset.cat;
        if (docReaderContainer.style.display === 'block') {{
          showDocCatalog();
        }} else {{
          renderDocCatalog();
        }}
      }}
    }});

    // Initial Execution
    switchMainView(currentMainView);
  </script>
</body>
</html>
"""

    with open(index_file, "w", encoding="utf-8") as f:
        f.write(template)

    print(f"Successfully synchronized index.html with {len(questions)} questions and {len(module_docs)} module guides across {len(TOPIC_HUBS)} Topic Hubs!")

if __name__ == "__main__":
    sync_dashboard()
