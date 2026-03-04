const fs = require('node:fs');
const path = require('node:path');

const ROOTS = ['app', 'components/crud', 'components/data-list.tsx', 'components/sidebar.tsx', 'lib/formatters.ts'];
const TARGET_EXT = new Set(['.ts', '.tsx']);

function walk(target, out = []) {
  if (!fs.existsSync(target)) return out;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (TARGET_EXT.has(path.extname(target))) out.push(target);
    return out;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (TARGET_EXT.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const patterns = [
  /(title|label|placeholder|description|submitLabel|entityName|emptyMessage)="([A-Za-z][^"]*)"/g,
  />([A-Za-z][A-Za-z0-9 ,.!?:\-/()]+)</g,
  /toast\.(success|error|info)\('([A-Za-z][^']*)'/g,
  /errors\.[a-zA-Z]+ = '([A-Za-z][^']*)'/g,
];

let total = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('import ') || line.includes('export ') || line.includes('className=')) return;
      for (const pattern of patterns) {
        const m = [...line.matchAll(pattern)];
        if (!m.length) continue;
        total += m.length;
        console.log(`${file}:${idx + 1}: ${line.trim()}`);
        break;
      }
    });
  }
}

console.log(`\n총 ${total}건 탐지`);
if (total > 0) process.exitCode = 1;
