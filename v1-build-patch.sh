node - <<'NODE'
const fs=require('fs');
let data=fs.readFileSync('dist/js/data-fictional.js','utf8');
const dstart=data.indexOf('export const DRIVERS = [');
const dend=data.indexOf('\n];', dstart);
if(dstart<0 || dend<0) throw new Error('DRIVERS block not found');
const mask = `
];

// V1 presentation layer: preserve original IDs/stats/team assignments.
{
  const byTeam = new Map();
  for (const d of DRIVERS) {
    const n = byTeam.get(d.team) || 0;
    d.firstName = n === 0 ? 'V1 Pro' : 'V1 Ascend';
    d.lastName = 'Driver';
    d.code = n === 0 ? 'PRO' : 'ASC';
    byTeam.set(d.team, n + 1);
  }
}`;
data = data.slice(0,dend) + mask + data.slice(dend + 3);
fs.writeFileSync('dist/js/data-fictional.js',data);

let ui=fs.readFileSync('dist/js/ui.js','utf8');
const start=ui.indexOf('  showTeamSelect(mode) {');
const end=ui.indexOf('  // ============ TRACK SELECT ============', start);
if(start<0 || end<0) throw new Error('showTeamSelect block not found');
const fn = [
"  showTeamSelect(mode) {",
"    this.hideAll();",
"    this.sel.mode = mode;",
"    const el = this.screens.team;",
"    el.className = 'screen active menu-screen';",
"    const V1 = {",
"      tacn:{name:'1915 Collective',country:'UNITED STATES',tagline:'LEGACY, ENGINEERED.',color:0x0B0B0B,accent:0x7A4828,art:'https://apex-clean-v1-base.floot.app/_cdn/static/56ee0bf9-515f-4e00-8371-b4dd3985eb05-1915-team.webp'},",
"      vantara:{name:'Valen',country:'ITALY',tagline:'DRIVEN BY PASSION.',color:0x5A1524,accent:0xA6683C,art:'https://apex-clean-v1-base.floot.app/_cdn/static/8583128a-235b-426d-a507-442364eff10b-valen-team.webp'},",
"      solaris:{name:'Novus',country:'UNITED KINGDOM',tagline:'TOMORROW BEGINS TODAY.',color:0x07160D,accent:0xC9440A,art:'https://apex-clean-v1-base.floot.app/_cdn/static/bd4070de-1de7-40d6-843c-8691891a39b4-novus-team.webp'},",
"      meridian:{name:'Avelon',country:'GERMANY',tagline:'ENGINEERED WITHOUT COMPROMISE.',color:0x0B0B0B,accent:0xD0A326,art:'https://apex-clean-v1-base.floot.app/_cdn/static/ccb8f795-c247-4422-9194-ad01cfcdf281-avelon-team.webp'},",
"      kuroshio:{name:'Voss',country:'GERMANY',tagline:'PROGRESS, PERFECTED.',color:0x17242F,accent:0xA07653,art:'https://apex-clean-v1-base.floot.app/_cdn/static/c419e388-2b86-48f3-a2a9-b13fb2dd592b-voss-team.webp'},",
"      norvik:{name:'Sierra Mont',country:'FRANCE',tagline:'ELEVATED BY PRECISION.',color:0x557D68,accent:0xD39A47,art:'https://apex-clean-v1-base.floot.app/_cdn/static/6f597344-7174-4f0c-9b6c-c2f49f984408-sierra-mont-team.webp'},",
"      halcyon:{name:'Monteclair Racing',country:'SWITZERLAND',tagline:'EARN EVERY VICTORY.',color:0x174B52,accent:0xE4DDCC,art:'https://apex-clean-v1-base.floot.app/_cdn/static/05a03487-15ed-425b-98cf-5ef9ab0b036d-monteclair-team.webp'},",
"      zephyr:{name:'Rovelle',country:'MONACO',tagline:'CRAFTED BEYOND MOTION.',color:0x000000,accent:0xC8A28F,art:'https://apex-clean-v1-base.floot.app/_cdn/static/5f2254b2-abeb-43a0-a700-fe310d8dcb93-rovelle-team.webp'},",
"      sablewood:{name:'Onyx Racing',country:'AUSTRIA',tagline:'CHALLENGE EVERYTHING.',color:0x111315,accent:0x5C3FBF,art:'https://apex-clean-v1-base.floot.app/_cdn/static/90977c7d-5fff-4ea3-b582-a5c2bc1fca11-onyx-team.webp'}",
"    };",
"    el.innerHTML = header('CHOOSE YOUR <small>TEAM</small>') + '<div class=\"menu-body\"><div class=\"card-grid v1-team-grid\" id=\"team-grid\"></div><div class=\"btn-row\"><button class=\"f1-btn ghost\" id=\"btn-back\"><span>← BACK</span></button><button class=\"f1-btn\" id=\"btn-next\" disabled><span>CONTINUE →</span></button></div></div><div class=\"menu-footer\"><span>V1 LEAGUE — 9 CONSTRUCTORS · DRIVER ROSTER PENDING</span><span style=\"margin-left:auto\">Choose a V1 Pro or V1 Ascend seat</span></div>';",
"    const grid = el.querySelector('#team-grid');",
"    for (const team of TEAMS) {",
"      const v = V1[team.id]; if (!v) continue;",
"      const drs = DRIVERS.filter(d => d.team === team.id).slice(0,2);",
"      const col = hex(v.color), acc = hex(v.accent);",
"      const card = document.createElement('div'); card.className = 'select-card v1-team-card';",
"      const seatHtml = drs.map((d,i) => {",
"        const seat = i === 0 ? 'V1 PRO DRIVER' : 'V1 ASCEND DRIVER'; const teamType = i === 0 ? 'PRO TEAM' : 'ASCEND TEAM';",
"        return '<div class=\"drv v1-seat\" data-d=\"'+d.id+'\" role=\"radio\" tabindex=\"0\" aria-checked=\"false\" aria-label=\"'+seat+'\"><div class=\"drv-top\"><span class=\"v1-seat-mark\" style=\"background:linear-gradient(180deg,'+col+','+acc+')\"></span><span class=\"drv-name\">'+seat+'</span></div><div class=\"v1-seat-sub\">'+teamType+'</div></div>';",
"      }).join('');",
"      card.innerHTML = '<div class=\"stripe\" style=\"background:linear-gradient(90deg,'+col+','+acc+')\"></div><div class=\"v1-team-art-wrap\"><img class=\"v1-team-art\" src=\"'+v.art+'\" alt=\"'+v.name+'\" loading=\"lazy\" referrerpolicy=\"no-referrer\"></div><div class=\"card-body\"><h4>'+v.name+'</h4><div class=\"sub\">V1 CONSTRUCTOR · '+v.country+'</div><div class=\"v1-tagline\">'+v.tagline+'</div><div class=\"badge-row\"><span class=\"engine-badge\"><i class=\"engine-glyph\" style=\"color:'+acc+'\">◆</i>V1</span><span class=\"livery-chips\"><i style=\"background:'+col+'\"></i><i style=\"background:'+acc+'\"></i></span></div><div class=\"drivers\">'+seatHtml+'</div></div>';",
"      grid.appendChild(card);",
"    }",
"    grid.addEventListener('click', ev => { const drv = ev.target.closest('.drv'); if (!drv) return; grid.querySelectorAll('.drv.selected, .select-card.selected').forEach(x => x.classList.remove('selected')); grid.querySelectorAll('.drv[aria-checked=\"true\"]').forEach(x => x.setAttribute('aria-checked','false')); drv.classList.add('selected'); drv.setAttribute('aria-checked','true'); drv.closest('.select-card').classList.add('selected'); this.sel.driverId = drv.dataset.d; el.querySelector('#btn-next').disabled = false; this.cb('uiclick'); });",
"    grid.addEventListener('keydown', ev => { if (ev.key !== 'Enter' && ev.key !== ' ') return; const drv = ev.target.closest('.drv'); if (!drv) return; ev.preventDefault(); drv.click(); });",
"    el.querySelector('#btn-back').addEventListener('click', () => this.cb('back','main'));",
"    el.querySelector('#btn-next').addEventListener('click', () => { if (!this.sel.driverId) return; this.cb('teamChosen',{driverId:this.sel.driverId,mode:this.sel.mode}); });",
"    if (this.sel.driverId) { const prev = grid.querySelector('.drv[data-d=\"'+this.sel.driverId+'\"]'); if (prev) { prev.classList.add('selected'); prev.setAttribute('aria-checked','true'); prev.closest('.select-card').classList.add('selected'); el.querySelector('#btn-next').disabled=false; } }",
"    this._enter(el);",
"  }",
""
].join('\n');
ui = ui.slice(0,start) + fn + ui.slice(end);
fs.writeFileSync('dist/js/ui.js',ui);

let car=fs.readFileSync('dist/js/car.js','utf8');
const marker="export function buildCarMesh(team, driver) {\n";
if(!car.includes(marker)) throw new Error('buildCarMesh marker not found');
const ident=[
"const V1_CAR_IDENTITY = {",
"  tacn:{name:'1915 Collective',color:0x0B0B0B,accent:0x7A4828},",
"  vantara:{name:'Valen',color:0x5A1524,accent:0xA6683C},",
"  solaris:{name:'Novus',color:0x07160D,accent:0xC9440A},",
"  meridian:{name:'Avelon',color:0x0B0B0B,accent:0xD0A326},",
"  kuroshio:{name:'Voss',color:0x17242F,accent:0xA07653},",
"  norvik:{name:'Sierra Mont',color:0x557D68,accent:0xD39A47},",
"  halcyon:{name:'Monteclair Racing',color:0x174B52,accent:0xE4DDCC},",
"  zephyr:{name:'Rovelle',color:0x000000,accent:0xC8A28F},",
"  sablewood:{name:'Onyx Racing',color:0x111315,accent:0x5C3FBF},",
"  ironwood:{name:'1915 Collective',color:0x0B0B0B,accent:0x7A4828},",
"  stonehaven:{name:'Valen',color:0x5A1524,accent:0xA6683C}",
"};",
"function v1CarTeam(team) { const v=team && V1_CAR_IDENTITY[team.id]; return v ? {...team,...v} : team; }",
""
].join('\n');
car=car.replace(marker,ident+marker+"  team = v1CarTeam(team);\n");
car=car.replaceAll('APEX FORMULA','V1 LEAGUE');
fs.writeFileSync('dist/js/car.js',car);
NODE
node --check dist/js/data-fictional.js
node --check dist/js/ui.js
node --check dist/js/car.js
cat >> dist/css/menus.css <<'CSS'
#team-grid.v1-team-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;max-width:1200px}
.v1-team-card{overflow:hidden;background:linear-gradient(180deg,rgba(20,18,17,.98),rgba(10,10,10,.98))}
.v1-team-art-wrap{height:150px;overflow:hidden;position:relative;background:#090909;border-bottom:1px solid rgba(245,243,238,.08)}
.v1-team-art-wrap::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.03) 20%,rgba(8,8,8,.82) 100%);pointer-events:none}
.v1-team-art{display:block;width:100%;height:100%;object-fit:cover;object-position:center 30%;filter:saturate(.92) contrast(1.04)}
.v1-team-card .card-body{padding-top:13px}
.v1-team-card h4{font-size:19px!important;letter-spacing:.045em}
.v1-team-card .sub{font-size:9px;letter-spacing:.12em;text-transform:uppercase}
.v1-tagline{margin-top:5px;min-height:24px;color:#D5B48B;font:800 10px var(--mono);letter-spacing:.075em;text-transform:uppercase}
.v1-team-card .drivers{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.v1-team-card .drv.v1-seat{min-height:66px;padding:10px;background:rgba(8,8,8,.64);border:1px solid rgba(245,243,238,.1)}
.v1-team-card .drv.v1-seat.selected{border-color:#7A4828;background:linear-gradient(135deg,rgba(122,72,40,.33),rgba(10,10,10,.92))}
.v1-seat .drv-top{display:flex;align-items:center;gap:8px}
.v1-seat-mark{display:block;width:4px;height:27px;border-radius:4px;flex:0 0 auto}
.v1-seat .drv-name{font-size:10px;line-height:1.2;letter-spacing:.06em}
.v1-seat-sub{margin:6px 0 0 12px;color:#918980;font:700 8px var(--mono);letter-spacing:.12em}
@media(max-width:900px){#team-grid.v1-team-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
CSS
