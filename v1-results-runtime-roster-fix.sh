node - <<'NODE'
const fs=require('fs');

let data=fs.readFileSync('dist/js/data-fictional.js','utf8');
data += '\n\n// ===== V1 LEAGUE RUNTIME ROSTER =====\n{\n  const V1 = {\n    tacn:{name:\'1915 Collective\',fullName:\'1915 Collective by ARMONI\',engine:\'V1\',color:0xB86B3D,accent:0x050505},\n    vantara:{name:\'Valen\',fullName:\'Valen\',engine:\'V1\',color:0x6B1027,accent:0xD0A33B},\n    solaris:{name:\'Novus\',fullName:\'Novus\',engine:\'V1\',color:0x0B512D,accent:0xF05A13},\n    meridian:{name:\'Avelon\',fullName:\'Avelon\',engine:\'V1\',color:0xD0A326,accent:0x4A2B1D},\n    kuroshio:{name:\'Voss\',fullName:\'Voss\',engine:\'V1\',color:0x173A63,accent:0xB67A4D},\n    norvik:{name:\'Sierra Mont\',fullName:\'Sierra Mont\',engine:\'V1\',color:0x557D68,accent:0xE0A64A},\n    halcyon:{name:\'Monteclair Racing\',fullName:\'Monteclair Racing\',engine:\'V1\',color:0x0F6B73,accent:0xF2E8D5},\n    zephyr:{name:\'Rovelle\',fullName:\'Rovelle\',engine:\'V1\',color:0x010101,accent:0xD7B48A},\n    sablewood:{name:\'Onyx Racing\',fullName:\'Onyx Racing\',engine:\'V1\',color:0x7A4FE3,accent:0x090909}\n  };\n  const allowed = new Set(Object.keys(V1));\n  TEAMS.splice(0, TEAMS.length, ...TEAMS.filter(t => allowed.has(t.id)));\n  DRIVERS.splice(0, DRIVERS.length, ...DRIVERS.filter(d => allowed.has(d.team)));\n  for (const t of TEAMS) Object.assign(t, V1[t.id]);\n}\n';
fs.writeFileSync('dist/js/data-fictional.js',data);

let ui=fs.readFileSync('dist/js/ui.js','utf8');
const cardStart = ui.indexOf('function tacnCard() {');
const cardEnd = ui.indexOf('\n}\n\nfunction header', cardStart);
if(cardStart>=0 && cardEnd>=0) ui = ui.slice(0,cardStart) + "function tacnCard() { return ''; }" + ui.slice(cardEnd+2);

ui = ui.replace(
  "return `<div class=\"menu-header\"><div class=\"brand\">VELOCITÀ<em>ONE</em> ${SEASON}</div><div class=\"title\">${title}</div></div>`;",
  "return `<div class=\"menu-header\"><div class=\"brand\">VELOCITÀ <em>ONE</em> · <span class=\"v1-label\">V1 LEAGUE</span></div><div class=\"title\">${title}</div></div>`;"
);

fs.writeFileSync('dist/js/ui.js',ui);
NODE
node --check dist/js/data-fictional.js
node --check dist/js/ui.js