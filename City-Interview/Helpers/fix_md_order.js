const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../QUESTIONS.md');
let md = fs.readFileSync(mdPath, 'utf8');

const q72Marker = '### `Q-72` —';
const q74Marker = '### `Q-74` —';
const q73Marker = '### `Q-73` —';
const q75Marker = '### `Q-75` —';

const idxQ72 = md.indexOf(q72Marker);
const idxQ74 = md.indexOf(q74Marker);
const idxQ73 = md.indexOf(q73Marker);
const idxQ75 = md.indexOf(q75Marker);

console.log({ idxQ72, idxQ74, idxQ73, idxQ75 });

// Extract Q-72 block
// From idxQ72 up to idxQ74
const q72Block = md.substring(idxQ72, idxQ74).trim();

// Extract Q-74 block
// From idxQ74 up to "## 👔 Engineering Leadership & Operations"
const leadershipHeaderMarker = '## 👔 Engineering Leadership & Operations';
const idxLeadership = md.indexOf(leadershipHeaderMarker, idxQ74);
let q74Block = md.substring(idxQ74, idxLeadership).trim();
if (q74Block.endsWith('---')) {
    q74Block = q74Block.substring(0, q74Block.length - 3).trim();
}

// Extract Q-73 block
// From idxQ73 up to idxQ75
const idxSep = md.indexOf('---', idxQ73);
let q73Block = md.substring(idxQ73, idxQ75).trim();
if (q73Block.endsWith('---')) {
    q73Block = q73Block.substring(0, q73Block.length - 3).trim();
}

const cleanSection = `${q72Block}

---

## 🚀 CI/CD & DevOps (Q-73 – Q-74)

${q73Block}

---

${q74Block}

---

## 👔 Engineering Leadership & Operations (Q-75 – Q-76)

`;

md = md.substring(0, idxQ72) + cleanSection + md.substring(idxQ75);

fs.writeFileSync(mdPath, md, 'utf8');
console.log('✓ QUESTIONS.md fixed successfully!');
