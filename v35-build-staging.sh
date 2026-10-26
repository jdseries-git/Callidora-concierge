#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"
git clone --depth 1 https://github.com/ahacker-1/apex-formula-2026.git "$ROOT/v35-apex-source"
cd "$ROOT/v35-apex-source"
rm -rf dist && mkdir dist && tar --exclude=dist --exclude=.git -cf - . | tar -xf - -C dist && node - <<'NODE'
const fs=require('fs'),p=require('path');
function brandWalk(d){
  for(const n of fs.readdirSync(d)){
    const f=p.join(d,n),s=fs.statSync(f);
    if(s.isDirectory()) brandWalk(f);
    else if(/\.(html|js|css)$/.test(n)){
      let x=fs.readFileSync(f,'utf8');
      x=x
        .replaceAll('APEX FORMULA 2026','VELOCITÀ ONE')
        .replaceAll('APEX FORMULA','VELOCITÀ ONE')
        .replaceAll('APEX<span>FORMULA</span>','VELOCITÀ<span>ONE</span>')
        .replaceAll('APEX<em>FORMULA</em>','VELOCITÀ <em>ONE</em>')
        .replaceAll('SIMULATION RACING','V1 LEAGUE')
        .replaceAll('TACN RACE WEEKEND','V1 RACE WEEKEND')
        .replaceAll('PRESENTED BY THE AI CONSULTING NETWORK — THEAICONSULTINGNETWORK.COM','PRESENTED BY THE 1915 COLLECTIVE · BY ARMONI')
        .replaceAll('THEAICONSULTINGNETWORK.COM','ARMONI')
        .replaceAll('THE AI CONSULTING NETWORK','THE 1915 COLLECTIVE')
        .replaceAll('<div class="brand">APEX<em>FORMULA</em> \${SEASON}</div>','<div class="brand">VELOCITÀ <em>ONE</em> · <span class="v1-label">V1 LEAGUE</span></div>')
        .replaceAll('<span class="footer-brand">APEX FORMULA \${SEASON} — an original racing simulation</span>','<span class="footer-brand">VELOCITÀ ONE · V1 LEAGUE</span>')
        .replaceAll('<span class="tacn-mark">PRESENTED BY THE AI CONSULTING NETWORK — \${TACN_URL}</span>','<span class="tacn-mark">PRESENTED BY THE 1915 COLLECTIVE · BY ARMONI</span>')
        .replaceAll('<span class="tacn-mark">PRESENTED BY THE 1915 COLLECTIVE · BY ARMONI — ARMONI</span>','<span class="tacn-mark">PRESENTED BY THE 1915 COLLECTIVE · BY ARMONI</span>')
        .replaceAll('PRESENTED BY THE 1915 COLLECTIVE · BY ARMONI — ARMONI','PRESENTED BY THE 1915 COLLECTIVE · BY ARMONI')
        .replaceAll('<div class="boot-logo">APEX<span>FORMULA</span></div>','<div class="boot-logo">VELOCITÀ<span>ONE</span></div>')
        .replaceAll('<div class="boot-year">2026</div>','<div class="boot-year">V1 LEAGUE</div>')
        .replaceAll('<div class="boot-sub">V1 LEAGUE</div>','<div class="boot-sub">THE 1915 COLLECTIVE · BY ARMONI</div>');
      if(n.endsWith('.css')){
        x=x.replaceAll('#e10600','#7A4828')
           .replaceAll('#a00400','#4E2D1B')
           .replaceAll('#f5f5f7','#F5F3EE')
           .replaceAll('#0b0b0d','#0B0B0B')
           .replaceAll('rgba(225,6,0,','rgba(122,72,40,')
           .replaceAll('rgba(35,10,10,0.9)','rgba(31,20,14,0.92)')
           .replaceAll('#ff1e17','#965C38');
      }
      fs.writeFileSync(f,x);
    }
  }
}
brandWalk('dist');

let ui=fs.readFileSync('dist/js/ui.js','utf8');

ui=ui.replace(
  '<button type="button" class="nav-item" data-a="settings"><span><h3>SETTINGS</h3><p>Difficulty, race distance, assists, audio, graphics</p></span></button>',
  '<button type="button" class="nav-item" data-a="settings"><span><h3>SETTINGS</h3><p>Difficulty, race distance, assists, audio, graphics</p></span></button>\n        <button type="button" class="nav-item" data-a="controls"><span><h3>CONTROLS</h3><p>Keyboard and gamepad controls</p></span></button>'
);

const marker = "  showSettings(returnTo = 'main') {\n    this.hideAll();";
const insert = [
"  showSettings(returnTo = 'main') {",
"    this.hideAll();",
"    if (returnTo === 'controls') {",
"      const el = this.screens.settings;",
"      el.className = 'screen active menu-screen';",
"      const rows = [",
"        ['STEER','A / D or ← / →','LEFT STICK'],",
"        ['ACCELERATE','W or ↑','RT / R2'],",
"        ['BRAKE','S or ↓','LT / L2'],",
"        ['SHIFT UP','E','RB / R1'],",
"        ['SHIFT DOWN','Q','LB / L1'],",
"        ['OVERRIDE BOOST','SPACE','A / CROSS'],",
"        ['ERS MODE','V','—'],",
"        ['BOX / PIT REQUEST','P','—'],",
"        ['CAMERA','C','—'],",
"        ['PAUSE','ESC','—']",
"      ];",
"      const rowHtml = rows.map(r => '<div class=\"control-row\"><div class=\"control-action\">'+r[0]+'</div><div class=\"control-bind\"><span>KEYBOARD</span><strong>'+r[1]+'</strong></div><div class=\"control-bind\"><span>GAMEPAD</span><strong>'+r[2]+'</strong></div></div>').join('');",
"      el.innerHTML = header('CONTROLS') + '<div class=\"menu-body\"><div class=\"controls-wrap\"><section class=\"control-panel\"><div class=\"control-panel-head\"><h3>INPUTS</h3><p>Current keyboard and gamepad controls</p></div>'+rowHtml+'</section><div class=\"btn-row\"><button class=\"f1-btn ghost\" id=\"btn-back\"><span>← BACK</span></button></div></div></div><div class=\"menu-footer\"><span class=\"footer-brand\">VELOCITÀ ONE · V1 LEAGUE</span><span class=\"tacn-mark\">PRESENTED BY THE 1915 COLLECTIVE · BY ARMONI</span></div>';",
"      el.querySelector('#btn-back').addEventListener('click', () => this.cb('back', 'main'));",
"      this._enter(el);",
"      return;",
"    }"
].join('\n');

if(!ui.includes(marker)) throw new Error('showSettings marker not found');
ui=ui.replace(marker,insert);
fs.writeFileSync('dist/js/ui.js',ui);

let main=fs.readFileSync('dist/js/main.js','utf8');
const oldLine="else if (payload === 'settings') { this.state = 'settings'; this.ui.showSettings('main'); }";
const newLine=oldLine+"\n        else if (payload === 'controls') { this.state = 'controls'; this.ui.showSettings('controls'); }";
if(!main.includes(oldLine)) throw new Error('settings handler marker not found');
main=main.replace(oldLine,newLine);
fs.writeFileSync('dist/js/main.js',main);
NODE
node --check dist/js/ui.js
node --check dist/js/main.js
cat >> dist/css/menus.css <<'CSS'
:root{--red:#7A4828;--red-dark:#4E2D1B;--bg:#0B0B0B;--bg2:#12100F;--panel:rgba(18,16,15,.94);--panel-light:rgba(31,26,23,.94);--text:#F5F3EE;--text-dim:#B8B1A7;--ink:#0B0B0B;--hair:rgba(245,243,238,.09);--hair-2:rgba(245,243,238,.16);--glass:rgba(17,15,14,.78)}
html,body{background:#0B0B0B;color:#F5F3EE}
#screen-boot{background:radial-gradient(ellipse at 50% 27%,rgba(122,72,40,.20) 0%,rgba(11,11,11,0) 42%),radial-gradient(ellipse at 50% 38%,#181310 0%,#0B0B0B 72%)}
.boot-logo{color:#F5F3EE}.boot-logo span{color:#7A4828}
.boot-year{background:linear-gradient(180deg,#F5F3EE 22%,#B9957C 58%,#7A4828 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.boot-sub{color:#B8B1A7}.boot-bar{background:#241D19}
#boot-progress{background:linear-gradient(90deg,#5B341F,#7A4828,#A86E49);box-shadow:0 0 14px rgba(122,72,40,.42)}
.menu-screen{background:radial-gradient(ellipse at 84% 20%,rgba(122,72,40,.13),transparent 42%),linear-gradient(120deg,rgba(11,11,11,.98) 0%,rgba(17,15,14,.96) 60%,rgba(28,20,16,.94) 100%)}
.menu-bg .bg-carbon{background-color:#0B0B0B;background-image:repeating-linear-gradient(45deg,rgba(245,243,238,.026) 0 2px,transparent 2px 6px),repeating-linear-gradient(-45deg,rgba(0,0,0,.58) 0 2px,transparent 2px 6px),radial-gradient(ellipse at 78% 12%,rgba(122,72,40,.18),transparent 55%)}
.menu-bg .bg-vignette{background:radial-gradient(ellipse at 22% 78%,rgba(122,72,40,.14),transparent 45%),radial-gradient(ellipse at 50% 50%,transparent 42%,rgba(5,5,5,.86) 100%)}
.menu-header::after{background:linear-gradient(90deg,#7A4828,rgba(122,72,40,.38) 34%,transparent 62%)}
.menu-header .brand{color:#F5F3EE}.menu-header .brand em,.menu-header .brand .v1-label,.menu-header .title small{color:#7A4828}
.main-nav .nav-item{background:rgba(19,17,16,.92);border-color:rgba(245,243,238,.08);border-left-color:#7A4828}
.main-nav .nav-item:hover,.main-nav .nav-item.focused,.main-nav .nav-item:focus-visible{background:linear-gradient(90deg,#7A4828,#684027);border-color:#7A4828;box-shadow:0 8px 30px rgba(122,72,40,.32)}
.main-nav .nav-item p{color:#B8B1A7}
.select-card.selected{border-color:#7A4828;box-shadow:0 0 0 2px #7A4828,0 10px 30px rgba(122,72,40,.24)}
.select-card .drv.selected,.seg button.on,.f1-btn{background:#7A4828;border-color:#7A4828;color:#F5F3EE}
.f1-btn:hover{background:#915A38;box-shadow:0 6px 24px rgba(122,72,40,.42)}
.load-spinner{border-top-color:#7A4828}
.menu-footer{border-top-color:rgba(245,243,238,.10);color:#AFA79D}
.menu-footer .footer-brand{margin-left:auto;color:#F5F3EE;font-weight:800;letter-spacing:.06em}
.menu-footer .tacn-mark{color:#B88B6C;font-weight:800;letter-spacing:.08em;white-space:nowrap}
.key-hint b{background:#1B1715;border-color:#3B2B22;color:#F5F3EE}
.controls-wrap{max-width:1000px;display:flex;flex-direction:column;gap:18px}
.control-panel{background:rgba(18,16,15,.94);border:1px solid rgba(245,243,238,.09);border-radius:8px;overflow:hidden}
.control-panel-head{padding:18px 22px;border-bottom:1px solid rgba(245,243,238,.09)}
.control-panel-head h3{font-size:18px;font-weight:900;font-style:italic;letter-spacing:.05em}
.control-panel-head p{margin-top:4px;font-size:12px;color:#B8B1A7}
.control-row{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:14px;align-items:center;padding:14px 22px;border-bottom:1px solid rgba(245,243,238,.06)}
.control-row:last-child{border-bottom:0}
.control-action{font-size:14px;font-weight:850;letter-spacing:.04em}
.control-bind{display:flex;align-items:center;gap:10px}
.control-bind span{font:700 9px var(--mono);letter-spacing:.12em;color:#8F877E;min-width:62px}
.control-bind strong{font:850 12px var(--mono);color:#F5F3EE;background:#1B1715;border:1px solid #3B2B22;padding:6px 9px;border-radius:4px}
CSS
node - <<'NODE'
const fs=require('fs');
const f='dist/js/ui.js';
let x=fs.readFileSync(f,'utf8');
const anchor="    const grid = el.querySelector('#team-grid');\n    for (const team of TEAMS) {\n      const drs = DRIVERS.filter(d => d.team === team.id);";
const repl="    const grid = el.querySelector('#team-grid');\n    const v1Brand = {\n      tacn:{name:'1915 Collective',color:0x0B0B0B,accent:0x7A4828},\n      vantara:{name:'Valen',color:0x5C1520,accent:0xC39A5B},\n      solaris:{name:'Novus',color:0x244B32,accent:0xD86A2B},\n      meridian:{name:'Avelon',color:0x4B3228,accent:0xC49A57},\n      kuroshio:{name:'Voss',color:0x17253F,accent:0xA99784},\n      norvik:{name:'Sierra Mont',color:0x687766,accent:0xD5B48B},\n      halcyon:{name:'Monteclair Racing',color:0x155A5F,accent:0xE8DED0},\n      zephyr:{name:'Rovelle',color:0x111111,accent:0xB08D57},\n      sablewood:{name:'Onyx Racing',color:0x4A315F,accent:0xB8BBC4},\n    };\n    for (const team of TEAMS) {\n      if (!v1Brand[team.id]) continue;\n      const shown = {...team,...v1Brand[team.id]};\n      const drs = DRIVERS.filter(d => d.team === team.id);";
if(!x.includes(anchor)) throw new Error('team anchor missing');
x=x.replace(anchor,repl);
x=x.replace("      const col = hex(team.color);","      const col = hex(shown.color);");
x=x.replace("      const acc = hex(team.accent);","      const acc = hex(shown.accent);");
x=x.replace("      const ink = readable(team.color);","      const ink = readable(shown.color);");
x=x.replace('          <h4>${team.name}</h4>','          <h4>${shown.name}</h4>');
x=x.replace('            <span class="livery-chips" title="Car livery">${liveryChips(team)}</span>','            <span class="livery-chips" title="Car livery">${liveryChips(shown)}</span>');
x=x.replace('          <div class="sub">${team.engine} power unit</div>','          <div class="sub">V1 CONSTRUCTOR</div>');
x=x.replace('<div class="menu-footer"><span>${SEASON} grid — ${TEAMS.length} teams · ${DRIVERS.length} drivers · original line-ups</span>','<div class="menu-footer"><span>V1 LEAGUE — 9 CONSTRUCTORS · DRIVER ROSTER PENDING</span>');
fs.writeFileSync(f,x);
NODE
node --check dist/js/ui.js
curl -fsSL https://raw.githubusercontent.com/jdseries-git/Callidora-concierge/v1-assets/v1-build-patch.sh -o /tmp/v12fix.sh && bash /tmp/v12fix.sh
curl -fsSL https://raw.githubusercontent.com/jdseries-git/Callidora-concierge/v1-assets/v1-livery-pop-pass.sh -o /tmp/v13livery.sh && bash /tmp/v13livery.sh
curl -fsSL https://raw.githubusercontent.com/jdseries-git/Callidora-concierge/v1-assets/v1-final-livery-hierarchy.sh -o /tmp/v14final.sh && bash /tmp/v14final.sh
curl -fsSL https://raw.githubusercontent.com/jdseries-git/Callidora-concierge/v1-assets/v1-1915-remove-blue-overlay.sh -o /tmp/v15bluefix.sh && bash /tmp/v15bluefix.sh
curl -fsSL https://raw.githubusercontent.com/jdseries-git/Callidora-concierge/e258301a88c51dc69623c99aa703ed7ee569ba5b/v1-results-runtime-roster-fix.sh -o /tmp/v17results.sh && bash /tmp/v17results.sh

bash "$ROOT/v35-quality-guardrails.sh"
bash "$ROOT/v35-visual-calibration.sh"
bash "$ROOT/v35-circuit-materials.sh"
node - <<'NODE'
const fs=require('fs'),path=require('path');
function walk(d){for(const n of fs.readdirSync(d)){const p=path.join(d,n);if(fs.statSync(p).isDirectory()){walk(p);continue;}if(!/\.(html|css|js)$/.test(n))continue;let s=fs.readFileSync(p,'utf8');s=s.replaceAll('1915 Collective by ARMONI','1915').replaceAll('THE 1915 COLLECTIVE · BY ARMONI','1915 · LIFE IN MOTION').replaceAll('1915 Collective','1915').replaceAll('THE 1915 COLLECTIVE','1915');fs.writeFileSync(p,s);}}
walk('dist');
NODE
cat "$ROOT/v36-modern-cockpit.css" >> dist/css/style.css
cp -a dist "$ROOT/dist"
echo "V35 staging build assembled"
