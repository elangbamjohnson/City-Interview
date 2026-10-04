const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let count = 0;
let errors = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  try {
    new vm.Script(match[1]);
    console.log(`✓ Script block ${count} is syntactically VALID!`);
  } catch (err) {
    errors++;
    console.error(`❌ Syntax error in script block ${count}:`, err.message);
  }
}

if (errors > 0) {
  process.exit(1);
} else {
  console.log(`\n🎉 All ${count} script block(s) passed syntax check!`);
}
