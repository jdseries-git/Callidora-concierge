#!/usr/bin/env bash
# V35 circuit surface detail calibration: original textures, no new downloads.
set -euo pipefail
node - <<'NODE'
const fs = require('fs');
const p = 'dist/js/trackBuilder.js';
if (!fs.existsSync(p)) throw Error('Missing '+p+'; build Apex first');
let s=fs.readFileSync(p,'utf8');
const before='asphalt: { size: 256, normalStrength: 1.15, normalScale: 0.42, roughnessLow: 0.82, roughnessHigh: 0.97, cavity: 0.10 }';
const after='asphalt: { size: 256, normalStrength: 1.35, normalScale: 0.48, roughnessLow: 0.77, roughnessHigh: 0.94, cavity: 0.12 }';
if (!s.includes(before) && !s.includes(after)) throw Error('Upstream asphalt material definition changed');
s=s.replace(before,after);
fs.writeFileSync(p,s);
console.log('V35 asphalt microdetail applied; texture resolution unchanged');
NODE
