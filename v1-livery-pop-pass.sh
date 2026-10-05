node - <<'NODE'
const fs=require('fs');

// Stronger V1 livery palette + chase-camera readability pass.
let car=fs.readFileSync('dist/js/car.js','utf8');

const replacements = [
  ["tacn:{name:'1915 Collective',color:0x0B0B0B,accent:0x7A4828}", "tacn:{name:'1915 Collective',color:0x0B0B0B,accent:0xA85F35}"],
  ["vantara:{name:'Valen',color:0x5A1524,accent:0xA6683C}", "vantara:{name:'Valen',color:0x6B1027,accent:0xD0A33B}"],
  ["solaris:{name:'Novus',color:0x07160D,accent:0xC9440A}", "solaris:{name:'Novus',color:0x0B512D,accent:0xF05A13}"],
  ["meridian:{name:'Avelon',color:0x0B0B0B,accent:0xD0A326}", "meridian:{name:'Avelon',color:0x4A2B1D,accent:0xD0A326}"],
  ["kuroshio:{name:'Voss',color:0x17242F,accent:0xA07653}", "kuroshio:{name:'Voss',color:0x173A63,accent:0xB67A4D}"],
  ["norvik:{name:'Sierra Mont',color:0x557D68,accent:0xD39A47}", "norvik:{name:'Sierra Mont',color:0x557D68,accent:0xE0A64A}"],
  ["halcyon:{name:'Monteclair Racing',color:0x174B52,accent:0xE4DDCC}", "halcyon:{name:'Monteclair Racing',color:0x0F6B73,accent:0xF2E8D5}"],
  ["zephyr:{name:'Rovelle',color:0x000000,accent:0xC8A28F}", "zephyr:{name:'Rovelle',color:0x050505,accent:0xD7B48A}"],
  ["sablewood:{name:'Onyx Racing',color:0x111315,accent:0x5C3FBF}", "sablewood:{name:'Onyx Racing',color:0x111315,accent:0x7A4FE3}"],
  ["ironwood:{name:'1915 Collective',color:0x0B0B0B,accent:0x7A4828}", "ironwood:{name:'1915 Collective',color:0x0B0B0B,accent:0xA85F35}"],
  ["stonehaven:{name:'Valen',color:0x5A1524,accent:0xA6683C}", "stonehaven:{name:'Valen',color:0x6B1027,accent:0xD0A33B}"]
];
for (const [a,b] of replacements) car=car.replaceAll(a,b);

// Remove the old TACN-specific blue rear-wing identity so 1915 uses the
// normal V1 team-name panel in black/copper.
car=car.replace("if (team.id === 'tacn') {", "if (false && team.id === 'tacn') {");

// Make V1 paint richer and more reflective instead of washed-out.
car=car.replace(
"export const PAINT_SPEC = {\n  body: { metalness: 0.06, roughness: 0.34, clearcoat: 1.0, clearcoatRoughness: 0.17 },\n  accent: { metalness: 0.05, roughness: 0.37, clearcoat: 0.92, clearcoatRoughness: 0.20 },\n};",
"export const PAINT_SPEC = {\n  body: { metalness: 0.10, roughness: 0.24, clearcoat: 1.0, clearcoatRoughness: 0.10, envMapIntensity: 1.05 },\n  accent: { metalness: 0.28, roughness: 0.20, clearcoat: 1.0, clearcoatRoughness: 0.08, envMapIntensity: 1.15 },\n};"
);
car=car.replace(
"emissive: new THREE.Color(team.color).multiplyScalar(selfGlow(new THREE.Color(team.color))),",
"emissive: new THREE.Color(team.color).multiplyScalar(Math.max(selfGlow(new THREE.Color(team.color)), 0.055)),"
);
car=car.replace(
"emissive: new THREE.Color(team.accent).multiplyScalar(selfGlow(new THREE.Color(team.accent))),",
"emissive: new THREE.Color(team.accent).multiplyScalar(Math.max(selfGlow(new THREE.Color(team.accent)), 0.085)),"
);
car=car.replaceAll(
"bodyMat.emissive.copy(color).multiplyScalar(selfGlow(color));",
"bodyMat.emissive.copy(color).multiplyScalar(Math.max(selfGlow(color), 0.055));"
);
car=car.replaceAll(
"accentMat.emissive.copy(accent).multiplyScalar(selfGlow(accent));",
"accentMat.emissive.copy(accent).multiplyScalar(Math.max(selfGlow(accent), 0.085));"
);

// AI distant-car proxies must use the same V1 palette as near cars.
car=car.replace(
"export function buildDistantCarProxy(team) {\n  const root = new THREE.Group();",
"export function buildDistantCarProxy(team) {\n  team = v1CarTeam(team);\n  const root = new THREE.Group();"
);

fs.writeFileSync('dist/js/car.js',car);

// Keep team-select chips/cards in sync with the final livery palette.
let ui=fs.readFileSync('dist/js/ui.js','utf8');
const uiRepls = [
  ["color:0x0B0B0B,accent:0x7A4828", "color:0x0B0B0B,accent:0xA85F35"],
  ["color:0x5A1524,accent:0xA6683C", "color:0x6B1027,accent:0xD0A33B"],
  ["color:0x07160D,accent:0xC9440A", "color:0x0B512D,accent:0xF05A13"],
  ["color:0x0B0B0B,accent:0xD0A326", "color:0x4A2B1D,accent:0xD0A326"],
  ["color:0x17242F,accent:0xA07653", "color:0x173A63,accent:0xB67A4D"],
  ["color:0x557D68,accent:0xD39A47", "color:0x557D68,accent:0xE0A64A"],
  ["color:0x174B52,accent:0xE4DDCC", "color:0x0F6B73,accent:0xF2E8D5"],
  ["color:0x000000,accent:0xC8A28F", "color:0x050505,accent:0xD7B48A"],
  ["color:0x111315,accent:0x5C3FBF", "color:0x111315,accent:0x7A4FE3"]
];
for (const [a,b] of uiRepls) ui=ui.replaceAll(a,b);
fs.writeFileSync('dist/js/ui.js',ui);
NODE
node --check dist/js/car.js
node --check dist/js/ui.js
