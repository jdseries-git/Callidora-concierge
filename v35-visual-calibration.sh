#!/usr/bin/env bash
# Apply after base Apex build; preserves V1 multiplayer/roster patches.
set -euo pipefail
node - <<'NODE'
const fs = require('fs');
const mainPath = 'dist/js/main.js';
const carPath = 'dist/js/car.js';
const files = [mainPath, carPath];
for (const p of files) if (!fs.existsSync(p)) throw Error('Missing '+p+'; run the Apex build first');
const replacements = [
  [mainPath, '    sun.shadow.bias = -0.0004;', '    sun.shadow.bias = -0.00035;\n    // V35: soften shadow acne without an extra shadow or post-processing pass.\n    sun.shadow.normalBias = 0.018;'],
  [carPath, 'body: { metalness: 0.06, roughness: 0.34, clearcoat: 1.0, clearcoatRoughness: 0.17 }',
   'body: { metalness: 0.06, roughness: 0.30, clearcoat: 1.0, clearcoatRoughness: 0.14 }'],
  [carPath, 'accent: { metalness: 0.05, roughness: 0.37, clearcoat: 0.92, clearcoatRoughness: 0.20 }',
   'accent: { metalness: 0.05, roughness: 0.33, clearcoat: 0.92, clearcoatRoughness: 0.17 }']
];
for (const [p, before, after] of replacements) {
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes(after)) { console.log('Already applied:',p); continue; }
  if (!s.includes(before)) throw Error('Upstream source changed; review required: '+p+' '+before.slice(0,50));
  s = s.replace(before, after);
  fs.writeFileSync(p,s);
}
console.log('V35 visual material and shadow calibration applied');
NODE
