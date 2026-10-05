node - <<'NODE'
const fs=require('fs');

let car=fs.readFileSync('dist/js/car.js','utf8');

const swaps = [
  // 1915: copper primary, black accent
  ["tacn:{name:'1915 Collective',color:0x0B0B0B,accent:0xA85F35}", "tacn:{name:'1915 Collective',color:0xB86B3D,accent:0x050505}"],
  ["ironwood:{name:'1915 Collective',color:0x0B0B0B,accent:0xA85F35}", "ironwood:{name:'1915 Collective',color:0xB86B3D,accent:0x050505}"],

  // Avelon: gold primary, brown accent
  ["meridian:{name:'Avelon',color:0x4A2B1D,accent:0xD0A326}", "meridian:{name:'Avelon',color:0xD0A326,accent:0x4A2B1D}"],

  // Rovelle: deeper black primary, champagne accent
  ["zephyr:{name:'Rovelle',color:0x050505,accent:0xD7B48A}", "zephyr:{name:'Rovelle',color:0x010101,accent:0xD7B48A}"],

  // Onyx: purple primary, black accent
  ["sablewood:{name:'Onyx Racing',color:0x111315,accent:0x7A4FE3}", "sablewood:{name:'Onyx Racing',color:0x7A4FE3,accent:0x090909}"]
];
for (const [a,b] of swaps) car=car.replaceAll(a,b);

fs.writeFileSync('dist/js/car.js',car);

let ui=fs.readFileSync('dist/js/ui.js','utf8');
const uiSwaps = [
  ["color:0x0B0B0B,accent:0xA85F35", "color:0xB86B3D,accent:0x050505"],
  ["color:0x4A2B1D,accent:0xD0A326", "color:0xD0A326,accent:0x4A2B1D"],
  ["color:0x050505,accent:0xD7B48A", "color:0x010101,accent:0xD7B48A"],
  ["color:0x111315,accent:0x7A4FE3", "color:0x7A4FE3,accent:0x090909"]
];
for (const [a,b] of uiSwaps) ui=ui.replaceAll(a,b);
fs.writeFileSync('dist/js/ui.js',ui);
NODE
node --check dist/js/car.js
node --check dist/js/ui.js
