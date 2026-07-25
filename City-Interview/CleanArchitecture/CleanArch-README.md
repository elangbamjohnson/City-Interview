# 🧅 Clean Architecture — Interview Cheat Sheet

## 1. What is Clean Architecture?
**Clean Architecture** (by Robert C. Martin "Uncle Bob") is a software design philosophy that separates an application into layers (often visualized as concentric circles). 

The primary goal is the **Separation of Concerns**, making the system independent of UI, databases, and external frameworks.

### The Dependency Rule 🛑
The overriding rule of Clean Architecture is: **Source code dependencies must point ONLY inward, toward higher-level policies.**
- The inner layers (Domain) know **nothing** about the outer layers (Data, Presentation).
- The outer layers depend on the inner layers.

---

## 2. The 3 Layers Breakdown

In this project, the architecture is divided into three main layers:

### 🎯 Domain Layer (The Core)
This is the innermost layer. It is the heart of the business logic.
- **Entities**: Pure data models containing enterprise-wide business rules.
- **Use Cases (Interactors)**: Contain application-specific business rules. They execute specific actions (e.g., `FetchUsersUseCase`).
- **Repository Interfaces**: Protocols defining what data is needed, without specifying *how* to get it (Dependency Inversion).
- **Rule**: Does NOT import UI frameworks (SwiftUI/UIKit) or external libraries (Alamofire).

### 💾 Data Layer
The outermost layer for data management. It implements the interfaces defined by the Domain layer.
- **Repositories Implementations**: Concrete classes that fetch data (e.g., `UserRepositoryImpl`).
- **Data Sources**: Handles the actual fetching (Network API, CoreData, Realm).
- **Data Transfer Objects (DTOs)**: Models mapping external JSON/DB schemas into Domain Entities.
- **Rule**: Depends on the Domain layer. It translates raw data into Domain Entities.

### 📱 Presentation Layer
The outermost layer for the UI.
- **Views**: SwiftUI or UIKit views that render the UI.
- **ViewModels**: Handles UI state and logic (often using MVVM pattern). ViewModels talk to the **Use Cases** in the Domain layer, *not* the Repositories directly.
- **Rule**: Depends on the Domain layer. Knows nothing about the Data layer.

---

## 3. Communication & Data Flow

```
┌────────────────────┐       ┌────────────────────┐       ┌────────────────────┐
│ Presentation Layer │       │    Domain Layer    │       │     Data Layer     │
│                    │       │                    │       │                    │
│   ┌────────┐       │       │   ┌────────────┐   │       │  ┌──────────────┐  │
│   │  View  │ ─────────────►│   │  Use Case  │◄──────────── │  Repository  │  │
│   └────────┘       │       │   └────────────┘   │       │  │Implementation│  │
│        ▲           │       │          │         │       │  └──────────────┘  │
│        │           │       │          ▼         │       │          │         │
│   ┌────────┐       │       │   ┌────────────┐   │       │  ┌──────────────┐  │
│   │ViewModel───────┼───────┼─► │ Repository │   │       │  │  Data Source │  │
│   └────────┘       │       │   │  Protocol  │   │       │  │ (API / DB)   │  │
│                    │       │   └────────────┘   │       │  └──────────────┘  │
└────────────────────┘       └────────────────────┘       └────────────────────┘
```
*Note: The Presentation Layer calls the Use Case. The Use Case calls the Repository Protocol. The Data Layer implements the Repository Protocol and returns data back through the Use Case to the ViewModel.*

---

## 4. Common Interview Q&A

### Q1: Why use Clean Architecture instead of just MVVM?
> **Answer:** MVVM separates the UI from presentation logic, but it doesn't dictate how business logic and data fetching should be organized. Clean Architecture provides a robust structure for the entire application, preventing ViewModels from becoming bloated and ensuring business rules are isolated and testable.

### Q2: What is the purpose of a Use Case (Interactor)?
> **Answer:** A Use Case encapsulates a single, specific business action (e.g., "Transfer Money", "Fetch User Profile"). It prevents duplicating business logic across multiple ViewModels and makes the application's capabilities explicitly clear just by looking at the file names.

### Q3: How do you achieve the Dependency Rule if the Domain layer needs data from the Data layer?
> **Answer:** By using the **Dependency Inversion Principle (DIP)**. The Domain layer defines a `Protocol` (Interface) for the Repository. The Data layer provides the concrete `Implementation` of that protocol. The Domain layer never knows about the Data layer; it only knows about its own protocol.

### Q4: Are there any downsides to Clean Architecture?
> **Answer:** Yes, it introduces significant boilerplate. You often have to map models between layers (e.g., Data DTO -> Domain Entity -> Presentation ViewState). It might be over-engineering for simple, small-scale applications.
