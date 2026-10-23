#!/usr/bin/env bash
# V35 optional graphics performance guardrail.
# Run AFTER the Apex build and BEFORE deployment. Does not alter V34.
set -euo pipefail
node - <<'NODE'
const fs = require('fs');
const file = 'dist/js/quality.js';
if (!fs.existsSync(file)) throw new Error('Build first: missing ' + file);
let src = fs.readFileSync(file, 'utf8');
const edits = [
  ['pixelRatio: 1.25,', 'pixelRatio: 1.15,'],
  ['pixelRatio: 2,', 'pixelRatio: 1.5,'],
  ["  return 'high';", "  return 'medium';"],
];
for (const [from, to] of edits) {
  if (!src.includes(from) && !src.includes(to)) {
    throw new Error('Quality source changed; review before applying: ' + from);
  }
  src = src.replace(from, to);
}
fs.writeFileSync(file, src);
console.log('V35 adaptive rendering guardrails applied');
NODE
