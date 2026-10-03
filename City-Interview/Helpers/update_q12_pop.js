const fs = require('fs');

const QUESTIONS_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/Resources/questions.json';
const QUESTIONS_MD_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/QUESTIONS.md';
const INDEX_PATH = '/Users/johnsonelangbam/Projects/City-Interview/City-Interview/index.html';

// 1. New Q-12 content
const updatedAnswer = `Protocol-oriented programming means I design my code around protocols, which describe what something can do, instead of around a base class. Each type then says "I can do this" by conforming to the protocol. I can also give a protocol default behavior using a protocol extension, so every type that conforms gets that code for free.

The problem it solves is the limits of class inheritance. With classes, a type can have only one parent. So if I build a deep class tree, it becomes rigid. A subclass inherits everything from the parent, even things it does not need, and changing the base class can break many children. Also, classes are reference types, so sharing and changing state can cause bugs. And if two unrelated types need the same ability, with inheritance I have to force them into one hierarchy.

With protocols, a type can conform to many protocols, so I mix abilities instead of inheriting them. Structs and enums can conform too, so I can keep value types and avoid the problems of shared state. And protocols make testing easy: my code depends on a protocol, so in tests I swap in a mock. This is how I do dependency injection.

Problems it solves:
• Single inheritance limit: one type can conform to many protocols.
• Rigid class trees: no deep hierarchy and no unwanted inherited code.
• Shared mutable state: structs and enums can conform, so I can use value types.
• Hard to test: depend on a protocol and inject a mock.
• Code duplication: protocol extensions give default code to all conforming types.

Good to mention in an interview:
• Use some Protocol or any Protocol. some is faster because the compiler knows the real type. any is flexible but adds a small cost.
• Protocols with associatedtype need generics or some, and cannot be used as a plain type in older Swift.
• Don't overdo it. If there is only one implementation and no need to mock, a protocol adds extra code with no benefit.
• Protocol extension methods that are not declared in the protocol use static dispatch, so a conforming type's own version may not be called through the protocol type. Declare the method in the protocol to get dynamic dispatch.

One-liner: Protocol-oriented programming builds code from small abilities that any type can adopt, which avoids the limits of class inheritance and makes testing easy.

Memory trick: M-V-T → "Many protocols, Value types, Testable."`;

const updatedPitch = `Protocol-oriented programming builds code from small abilities that any type can adopt, which avoids the limits of class inheritance and makes testing easy. (Memory trick: M-V-T → "Many protocols, Value types, Testable.")`;

const updatedCode = `// Protocol: describes the ability
protocol Fetching {
    func fetchUser() async throws -> User
}

// Default behavior for all types that conform
extension Fetching {
    func fetchUserName() async throws -> String {
        try await fetchUser().name
    }
}

// Real implementation (a struct, no inheritance)
struct APIService: Fetching {
    func fetchUser() async throws -> User { /* network call */ }
}

// Mock for tests
struct MockService: Fetching {
    func fetchUser() async throws -> User { User(id: 1, name: "Test") }
}

// ViewModel depends on the protocol, not on a concrete class
final class ProfileViewModel {
    private let service: Fetching
    init(service: Fetching) { self.service = service }
}

let prod = ProfileViewModel(service: APIService())
let test = ProfileViewModel(service: MockService())`;

// 2. Update questions.json
const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
const q12 = questions.find(q => q.id === 'Q-12');
if (q12) {
  q12.question = 'Protocol-Oriented Programming in Swift — What problem does it solve?';
  q12.answer = updatedAnswer;
  q12.interviewSentence = updatedPitch;
  q12.codeExample = updatedCode;
  fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2), 'utf-8');
  console.log('✓ Updated Q-12 in questions.json');
} else {
  console.error('Q-12 not found in questions.json!');
}

// 3. Update index.html
let html = fs.readFileSync(INDEX_PATH, 'utf-8');
const scriptMatch = html.match(/const QUESTIONS = (\[[\s\S]*?\]);\n/);
if (scriptMatch) {
  const parsedQuestions = JSON.parse(scriptMatch[1]);
  const indexQ12 = parsedQuestions.find(q => q.id === 'Q-12');
  if (indexQ12) {
    indexQ12.question = 'Protocol-Oriented Programming in Swift — What problem does it solve?';
    indexQ12.answer = updatedAnswer;
    indexQ12.interviewSentence = updatedPitch;
    indexQ12.codeExample = updatedCode;
    
    const newQuestionsJson = JSON.stringify(parsedQuestions);
    const oldDeclaration = scriptMatch[0];
    const newDeclaration = `const QUESTIONS = ${newQuestionsJson};\n`;
    
    // Use replacer function to avoid pattern replacement issues
    html = html.replace(oldDeclaration, () => newDeclaration);
    
    // Verify syntax
    const updatedScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    new Function(updatedScript);
    console.log('✓ index.html script passed syntax check!');
    
    fs.writeFileSync(INDEX_PATH, html, 'utf-8');
    console.log('✓ Updated Q-12 in index.html');
  }
} else {
  console.error('Could not find const QUESTIONS in index.html');
}

// 4. Update QUESTIONS.md
let md = fs.readFileSync(QUESTIONS_MD_PATH, 'utf-8');
const q12Regex = /### `Q-12` — [\s\S]*?(?=---)/;
const newQ12Md = `### \`Q-12\` — Protocol-Oriented Programming in Swift — What problem does it solve?

- **Difficulty:** 🔵 \`Intermediate\`
- **Category:** \`Core Swift & Language Internals\`

> [!TIP]
> **🗣️ Interview Pitch (Say it like this):**  
> *"Protocol-oriented programming builds code from small abilities that any type can adopt, which avoids the limits of class inheritance and makes testing easy. (Memory trick: M-V-T → 'Many protocols, Value types, Testable.')"*

#### 📖 Detailed Answer

Protocol-oriented programming means I design my code around protocols, which describe what something can do, instead of around a base class. Each type then says "I can do this" by conforming to the protocol. I can also give a protocol default behavior using a protocol extension, so every type that conforms gets that code for free.

The problem it solves is the limits of class inheritance. With classes, a type can have only one parent. So if I build a deep class tree, it becomes rigid. A subclass inherits everything from the parent, even things it does not need, and changing the base class can break many children. Also, classes are reference types, so sharing and changing state can cause bugs. And if two unrelated types need the same ability, with inheritance I have to force them into one hierarchy.

With protocols, a type can conform to many protocols, so I mix abilities instead of inheriting them. Structs and enums can conform too, so I can keep value types and avoid the problems of shared state. And protocols make testing easy: my code depends on a protocol, so in tests I swap in a mock. This is how I do dependency injection.

##### Problems it solves:
- **Single inheritance limit:** One type can conform to many protocols.
- **Rigid class trees:** No deep hierarchy and no unwanted inherited code.
- **Shared mutable state:** Structs and enums can conform, so I can use value types.
- **Hard to test:** Depend on a protocol and inject a mock.
- **Code duplication:** Protocol extensions give default code to all conforming types.

##### Good to mention in an interview:
- Use \`some Protocol\` or \`any Protocol\`. \`some\` is faster because the compiler knows the real type. \`any\` is flexible but adds a small existential container cost.
- Protocols with \`associatedtype\` need generics or \`some\`, and cannot be used as a plain type in older Swift.
- Don't overdo it. If there is only one implementation and no need to mock, a protocol adds extra code with no benefit.
- Protocol extension methods that are not declared in the protocol use static dispatch, so a conforming type's own version may not be called through the protocol type. Declare the method in the protocol to get dynamic dispatch.

**One-liner:** Protocol-oriented programming builds code from small abilities that any type can adopt, which avoids the limits of class inheritance and makes testing easy.

**Memory trick:** **M-V-T** → *"Many protocols, Value types, Testable."*

#### 💻 Swift Code Example

\`\`\`swift
// Protocol: describes the ability
protocol Fetching {
    func fetchUser() async throws -> User
}

// Default behavior for all types that conform
extension Fetching {
    func fetchUserName() async throws -> String {
        try await fetchUser().name
    }
}

// Real implementation (a struct, no inheritance)
struct APIService: Fetching {
    func fetchUser() async throws -> User { /* network call */ }
}

// Mock for tests
struct MockService: Fetching {
    func fetchUser() async throws -> User { User(id: 1, name: "Test") }
}

// ViewModel depends on the protocol, not on a concrete class
final class ProfileViewModel {
    private let service: Fetching
    init(service: Fetching) { self.service = service }
}

let prod = ProfileViewModel(service: APIService())
let test = ProfileViewModel(service: MockService())
\`\`\`

`;

if (q12Regex.test(md)) {
  md = md.replace(q12Regex, () => newQ12Md);
  fs.writeFileSync(QUESTIONS_MD_PATH, md, 'utf-8');
  console.log('✓ Updated Q-12 in QUESTIONS.md');
} else {
  console.error('Could not match Q-12 block in QUESTIONS.md');
}
