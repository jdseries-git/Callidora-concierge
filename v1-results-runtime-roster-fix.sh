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

# ===== V1 ONLINE LAYER =====
cat > dist/js/v1-online.js <<'JS'
// Velocita One online layer: persistent SL Legacy Name profiles, live leaderboard,
// and race-room lobby foundation. Kept separate from the race engine intentionally.
const API = 'https://v1-league-online.floot.app/_api';
const STORE = {
  name: 'v1_session_legacy_name',
  room: 'v1_session_room_code',
  loginAt: 'v1_session_login_at',
};
const V1_IDLE_MS = 5 * 60 * 1000;
let v1LastActivity = Date.now();
let v1LoginPromise = null;

const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moneyTime = (ms) => {
  if (!ms) return '—';
  const n = Number(ms);
  const m = Math.floor(n/60000);
  const sec = ((n%60000)/1000).toFixed(3).padStart(6,'0');
  return m + ':' + sec;
};
const legacyName = () => (sessionStorage.getItem(STORE.name)||'').trim();
const roomCode = () => (sessionStorage.getItem(STORE.room)||'').trim().toUpperCase();

async function api(path, opts={}) {
  const r = await fetch(API + path, {
    ...opts,
    headers: {'Content-Type':'text/plain;charset=UTF-8', ...(opts.headers||{})},
  });
  let body = {};
  try { body = await r.json(); } catch {}
  if (!r.ok) throw new Error(body.error || ('V1 service error ' + r.status));
  return body;
}

function root() {
  let el=document.getElementById('v1-online-root');
  if (!el) {
    el=document.createElement('div');
    el.id='v1-online-root';
    document.body.appendChild(el);
  }
  return el;
}
function close() { root().innerHTML=''; }

function shell(title, body, footer='', opts={}) {
  root().innerHTML = `
    <div class="v1o-backdrop">
      <section class="v1o-panel" role="dialog" aria-modal="true">
        <header><div><small>VELOCITÀ ONE · DRIVER STATION</small><h2>${title}</h2></div>${opts.locked?'':'<button class="v1o-x" id="v1o-x">×</button>'}</header>
        <div class="v1o-body">${body}</div>
        ${footer ? '<footer>'+footer+'</footer>' : ''}
      </section>
    </div>`;
  document.getElementById('v1o-x')?.addEventListener('click', close);
}

async function ensurePlayer(force=false) {
  let name = force ? '' : legacyName();
  if (!name) {
    if (v1LoginPromise) return v1LoginPromise;
    v1LoginPromise = new Promise(resolve => {
      shell('DRIVER LOGIN', `
        <div class="v1o-kioskmark">VELOCITÀ ONE</div>
        <p class="v1o-muted">Sign in to this simulator with your Second Life <strong>Legacy Name</strong>. Your permanent V1 driver profile, results, and rankings will load automatically.</p>
        <label class="v1o-label">SL LEGACY NAME</label>
        <input class="v1o-input" id="v1o-name" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="example Resident">
        <button class="v1o-btn" id="v1o-save">LOGIN TO V1</button>
        <div class="v1o-status" id="v1o-status"></div>
        <p class="v1o-kioskhelp">New driver? Your V1 profile will be created automatically.</p>`, '', {locked:true});
      const input=document.getElementById('v1o-name');
      const submit=async()=>{
        const value=input.value.trim();
        const status=document.getElementById('v1o-status');
        if (!value) { status.textContent='Enter your SL Legacy Name to continue.'; return; }
        try {
          status.textContent='Loading driver profile…';
          const data=await api('/v1-player',{method:'POST',body:JSON.stringify({legacyName:value})});
          sessionStorage.setItem(STORE.name,data.player.legacy_name);
          sessionStorage.setItem(STORE.loginAt,String(Date.now()));
          v1LastActivity=Date.now();
          v1LoginPromise=null;
          close();
          resolve(data.player.legacy_name);
          v1ShowSignedInDriver();
          const q=new URLSearchParams(location.search).get('v1room');
          if(q) setTimeout(()=>multiplayer(),100);
        } catch(e) { status.textContent=e.message; }
      };
      document.getElementById('v1o-save').onclick=submit;
      input.addEventListener('keydown',e=>{ if(e.key==='Enter') submit(); });
      setTimeout(()=>input.focus(),50);
    });
    return v1LoginPromise;
  }
  try {
    const data=await api('/v1-player',{method:'POST',body:JSON.stringify({legacyName:name})});
    sessionStorage.setItem(STORE.name,data.player.legacy_name);
    return data.player.legacy_name;
  } catch(e) {
    sessionStorage.removeItem(STORE.name);
    sessionStorage.removeItem(STORE.loginAt);
    v1LoginPromise=null;
    return ensurePlayer(true);
  }
}

function v1PositionDriverSession(){
  const badge=document.getElementById('v1-driver-session');
  if(!badge) return;
  const main=document.getElementById('screen-main');
  const title=main?.querySelector('.menu-header .title');
  if(main?.classList.contains('active') && title){
    const r=title.getBoundingClientRect();
    const gap=30;
    const maxLeft=Math.max(18,window.innerWidth-badge.offsetWidth-18);
    badge.style.left=Math.min(r.right+gap,maxLeft)+'px';
    badge.style.top=Math.max(16,r.top+(r.height-badge.offsetHeight)/2)+'px';
    badge.style.right='auto';
  } else {
    badge.style.left='auto';
    badge.style.right='18px';
    badge.style.top='16px';
  }
}
function v1ShowSignedInDriver(){
  const name=legacyName();
  let badge=document.getElementById('v1-driver-session');
  if(!name){ badge?.remove(); return; }
  if(!badge){
    badge=document.createElement('div');
    badge.id='v1-driver-session';
    document.body.appendChild(badge);
  }
  badge.innerHTML='<span>DRIVER</span><b>'+esc(name)+'</b><button type="button" id="v1-logout-mini">LOG OUT</button>';
  document.getElementById('v1-logout-mini').onclick=()=>v1Logout('manual');
  requestAnimationFrame(v1PositionDriverSession);
}

function v1Logout(reason='manual'){
  clearInterval(pollTimer);
  clearTimeout(leaderboardTimer);
  try{ v1mp?.ws?.send(JSON.stringify({type:'leave'})); }catch{}
  try{ v1mp?.ws?.close(); }catch{}
  v1mp=null;
  sessionStorage.removeItem(STORE.name);
  sessionStorage.removeItem(STORE.room);
  sessionStorage.removeItem(STORE.loginAt);
  sessionStorage.removeItem('v1_multiplayer_config');
  localStorage.removeItem('v1_legacy_name'); // remove legacy pre-kiosk persistence
  localStorage.removeItem('v1_room_code');
  v1LoginPromise=null;
  const u=new URL(location.href);
  u.searchParams.delete('v1room'); u.searchParams.delete('seed');
  history.replaceState(null,'',u);
  const game=window.__game;
  if(game?.session) game.teardownSession?.();
  if(game){ game.state='menu'; game.ui?.showMain?.(game.champ); }
  v1ShowSignedInDriver();
  shell(reason==='idle'?'SESSION EXPIRED':'DRIVER LOGGED OUT',
    '<p class="v1o-muted">'+(reason==='idle'
      ? 'This simulator was inactive for 5 minutes, so the previous driver was logged out for privacy.'
      : 'This simulator is ready for the next driver.')+'</p>'+
    '<button class="v1o-btn" id="v1o-next-login">DRIVER LOGIN</button>','',{locked:true});
  document.getElementById('v1o-next-login').onclick=()=>{ close(); ensurePlayer(true); };
}

function v1MarkActivity(){ v1LastActivity=Date.now(); }
['pointerdown','keydown','touchstart','gamepadconnected'].forEach(ev=>addEventListener(ev,v1MarkActivity,{passive:true}));
addEventListener('resize',v1PositionDriverSession);
setInterval(()=>{
  if(legacyName() && Date.now()-v1LastActivity>=V1_IDLE_MS) v1Logout('idle');
},15000);


async function profile() {
  const name = await ensurePlayer();
  const data = await api('/v1-player?legacyName='+encodeURIComponent(name));
  shell('DRIVER PROFILE', `
    <div class="v1o-driver">${esc(data.legacy_name)}</div>
    <div class="v1o-stats">
      <div><b>${data.races||0}</b><span>RACES</span></div>
      <div><b>${data.wins||0}</b><span>WINS</span></div>
      <div><b>${data.best_score||0}</b><span>BEST SCORE</span></div>
      <div><b>${moneyTime(data.fastest_lap_ms)}</b><span>FASTEST LAP</span></div>
    </div>
    <button class="v1o-btn ghost" id="v1o-switch">LOG OUT OF THIS SIMULATOR</button>`);
  document.getElementById('v1o-switch').onclick=()=>v1Logout('manual');
}

let leaderboardTimer=null;
async function leaderboard(period='daily') {
  clearTimeout(leaderboardTimer);
  await ensurePlayer();
  shell('LIVE LEADERBOARD', '<div class="v1o-status">Loading live rankings…</div>');
  try {
    const data = await api('/v1-leaderboard?period='+period+'&limit=50');
    const rows = data.entries.map((e,i)=>`
      <tr><td class="rank">${i+1}</td><td>${esc(e.legacy_name)}</td><td>${e.score||0}</td><td>${moneyTime(e.fastest_lap_ms)}</td></tr>`).join('');
    shell('LIVE LEADERBOARD', `
      <div class="v1o-tabs">
        <button data-p="daily" class="${period==='daily'?'on':''}">TODAY</button>
        <button data-p="weekly" class="${period==='weekly'?'on':''}">7 DAYS</button>
        <button data-p="all" class="${period==='all'?'on':''}">ALL-TIME</button>
      </div>
      <table class="v1o-table"><thead><tr><th>#</th><th>SL LEGACY NAME</th><th>V1 SCORE</th><th>FASTEST LAP</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" class="v1o-muted">No scores yet. Be the first.</td></tr>'}</tbody></table>
      <p class="v1o-update">AUTO-UPDATED · ${new Date(data.updatedAt).toLocaleTimeString()}</p>`);
    document.querySelectorAll('.v1o-tabs button').forEach(b=>b.onclick=()=>leaderboard(b.dataset.p));
    leaderboardTimer=setTimeout(()=>{
      const panel=document.querySelector('#v1-online-root .v1o-panel');
      if(panel && panel.textContent.includes('LIVE LEADERBOARD')) leaderboard(period);
    },10000);
  } catch(e) {
    shell('LIVE LEADERBOARD','<p>'+esc(e.message)+'</p>');
  }
}

async function multiplayer() {
  const name=await ensurePlayer();
  const codeFromUrl = new URLSearchParams(location.search).get('v1room');
  if (codeFromUrl) {
    sessionStorage.setItem(STORE.room, codeFromUrl.toUpperCase());
    return joinRoom(codeFromUrl.toUpperCase(), name);
  }
  shell('MULTIPLAYER', `
    <p class="v1o-muted">Race friends in a private V1 room or join an ARMONI-hosted event with a room link.</p>
    <div class="v1o-grid2">
      <button class="v1o-cardbtn" id="v1o-create"><b>CREATE PRIVATE RACE</b><span>Generate an invite link and host a lobby.</span></button>
      <button class="v1o-cardbtn" id="v1o-join"><b>JOIN RACE</b><span>Enter a V1 room code.</span></button>
    </div>
    ${roomCode()?'<button class="v1o-btn ghost" id="v1o-current">OPEN CURRENT ROOM · '+esc(roomCode())+'</button>':''}`);
  document.getElementById('v1o-create').onclick=()=>createRoom(name);
  document.getElementById('v1o-join').onclick=()=>joinPrompt(name);
  document.getElementById('v1o-current')?.addEventListener('click',()=>openRoom(roomCode(),name));
}

function createRoom(name) {
  shell('CREATE PRIVATE RACE', `
    <label class="v1o-label">RACE TITLE</label><input class="v1o-input" id="v1o-title" value="Private Race">
    <label class="v1o-label">TRACK ID</label><input class="v1o-input" id="v1o-track" value="spa">
    <div class="v1o-grid2"><div><label class="v1o-label">LAPS</label><input class="v1o-input" id="v1o-laps" type="number" min="1" max="100" value="5"></div>
    <div><label class="v1o-label">MAX PLAYERS</label><input class="v1o-input" id="v1o-max" type="number" min="2" max="24" value="12"></div></div>
    <button class="v1o-btn" id="v1o-make">CREATE RACE ROOM</button><div class="v1o-status" id="v1o-status"></div>`);
  document.getElementById('v1o-make').onclick=async()=>{
    const status=document.getElementById('v1o-status');
    try {
      status.textContent='Creating lobby…';
      const data=await api('/v1-room',{method:'POST',body:JSON.stringify({
        legacyName:name,title:document.getElementById('v1o-title').value,
        trackId:document.getElementById('v1o-track').value,
        laps:+document.getElementById('v1o-laps').value,
        maxPlayers:+document.getElementById('v1o-max').value
      })});
      sessionStorage.setItem(STORE.room,data.code);
      openRoom(data.code,name);
    } catch(e){status.textContent=e.message;}
  };
}
function joinPrompt(name) {
  shell('JOIN RACE', `
    <label class="v1o-label">ROOM CODE</label><input class="v1o-input code" id="v1o-code" maxlength="8" placeholder="A8K42">
    <button class="v1o-btn" id="v1o-go">JOIN ROOM</button><div class="v1o-status" id="v1o-status"></div>`);
  document.getElementById('v1o-go').onclick=()=>joinRoom(document.getElementById('v1o-code').value.trim().toUpperCase(),name);
}
async function joinRoom(code,name) {
  if(!code) return joinPrompt(name);
  try {
    await api('/v1-room-join',{method:'POST',body:JSON.stringify({code,legacyName:name})});
    sessionStorage.setItem(STORE.room,code);
    openRoom(code,name);
  } catch(e) {
    shell('JOIN RACE','<p>'+esc(e.message)+'</p><button class="v1o-btn ghost" id="v1o-backmp">BACK</button>');
    document.getElementById('v1o-backmp').onclick=multiplayer;
  }
}
let pollTimer=null;
async function openRoom(code,name) {
  clearInterval(pollTimer);
  const draw=async()=>{
    try {
      const data=await api('/v1-room?code='+encodeURIComponent(code));
      const r=data.room;
      const members=data.members.map(m=>`<li><span>${esc(m.legacy_name)}</span>${m.is_host?'<b>HOST</b>':''}</li>`).join('');
      const host=data.members.find(m=>m.is_host)?.legacy_name?.toLowerCase()===name.toLowerCase();
      const invite=location.origin+location.pathname+'?v1room='+encodeURIComponent(code);
      shell('RACE LOBBY · '+esc(code), `
        <div class="v1o-roomhead"><div><small>${esc(r.kind).toUpperCase()}</small><h3>${esc(r.title)}</h3></div><div><b>${esc(r.track_id).toUpperCase()}</b><span>${r.laps} LAPS</span></div></div>
        <label class="v1o-label">INVITE LINK</label>
        <div class="v1o-copyrow"><input class="v1o-input" id="v1o-link" readonly value="${esc(invite)}"><button class="v1o-btn mini" id="v1o-copy">COPY</button></div>
        <h4 class="v1o-rosterlabel">DRIVERS · ${data.members.length}/${r.max_players}</h4>
        <ul class="v1o-roster">${members}</ul>
        <div class="v1o-status">STATUS · ${esc(r.status).toUpperCase()}</div>
        ${host && r.status==='lobby'?'<button class="v1o-btn" id="v1o-start">START RACE</button>':''}
        ${r.status==='started'?'<button class="v1o-btn" id="v1o-enter">ENTER RACE</button>':''}`);
      document.getElementById('v1o-copy').onclick=async()=>{await navigator.clipboard?.writeText(invite);document.getElementById('v1o-copy').textContent='COPIED';};
      document.getElementById('v1o-start')?.addEventListener('click',async()=>{await api('/v1-room-start',{method:'POST',body:JSON.stringify({code,legacyName:name})});draw();});
      document.getElementById('v1o-enter')?.addEventListener('click',()=>launchMultiplayerRace(data,name));
    } catch(e) { shell('RACE LOBBY','<p>'+esc(e.message)+'</p>'); }
  };
  await draw();
  pollTimer=setInterval(()=>{ if(document.getElementById('v1-online-root')?.innerHTML) draw(); else clearInterval(pollTimer); },3000);
}

// Provisional V1 score: race points are the core score; finishing higher and fastest-lap
// performance remain visible as separate stats. This can be swapped later without changing storage.
async function submitVisibleResult() {
  if(v1mpConfig()) return; // multiplayer results are written only by authoritative race control
  const screen=document.getElementById('screen-results');
  if(!screen?.classList.contains('active') || screen.dataset.v1Submitted==='1') return;
  const name=legacyName();
  if(!name) return;
  const row=screen.querySelector('tr.player-row');
  if(!row) return;
  screen.dataset.v1Submitted='1';
  const cells=[...row.querySelectorAll('td')];
  const posText=cells[0]?.textContent.trim();
  const pos=Number(posText);
  const ptsCell=row.querySelector('.pts');
  const score=Number(ptsCell?.textContent.trim())||0;
  const bestCell=[...row.querySelectorAll('.ftime')].find(x=>/\d+:\d{2}\.\d{3}/.test(x.textContent));
  let fastestLapMs=null;
  if(bestCell){
    const m=bestCell.textContent.match(/(\d+):(\d{2})\.(\d{3})/);
    if(m) fastestLapMs=(+m[1]*60 + +m[2])*1000 + +m[3];
  }
  try {
    await api('/v1-result',{method:'POST',body:JSON.stringify({
      legacyName:name,mode:'race',trackId:'unknown',score,
      finishPosition:Number.isFinite(pos)?pos:null,fastestLapMs,roomCode:roomCode()||null
    })});
  } catch(e) { console.warn('V1 result sync failed',e); }
}

function injectMainButtons() {
  const nav=document.querySelector('#screen-main.active .main-nav');
  if(!nav || nav.querySelector('[data-v1-online]')) return;
  const mk=(title,desc,fn)=>{
    const b=document.createElement('button'); b.type='button'; b.className='nav-item'; b.dataset.v1Online='1';
    b.innerHTML='<span><h3>'+title+'</h3><p>'+desc+'</p></span>'; b.onclick=fn; return b;
  };
  nav.appendChild(mk('MULTIPLAYER','Private races, invite links, and V1 hosted lobbies',multiplayer));
  nav.appendChild(mk('LIVE LEADERBOARD','Daily global rankings by SL Legacy Name',()=>leaderboard('daily')));
  nav.appendChild(mk('DRIVER PROFILE','Persistent V1 career record',profile));
  nav.appendChild(mk('LOG OUT','End this driver session and reset the simulator',()=>v1Logout('manual')));
}

const obs=new MutationObserver(()=>{
  injectMainButtons();
  v1PositionDriverSession();
  const rs=document.getElementById('screen-results');
  if(rs && !rs.classList.contains('active')) delete rs.dataset.v1Submitted;
  submitVisibleResult();
});
obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
addEventListener('DOMContentLoaded',()=>{
  localStorage.removeItem('v1_legacy_name');
  localStorage.removeItem('v1_room_code');
  injectMainButtons();
  v1ShowSignedInDriver();
  setTimeout(()=>ensurePlayer(false),350);
});

// ===== REAL-TIME ON-TRACK MULTIPLAYER =====
const V1_RT_URL = 'wss://callidora-concierge.onrender.com/v1/realtime';
let v1mp = null;

function v1mpOverlay(text, sub='') {
  let el=document.getElementById('v1mp-overlay');
  if(!el){ el=document.createElement('div'); el.id='v1mp-overlay'; document.body.appendChild(el); }
  el.innerHTML='<div class="v1mp-big">'+esc(text)+'</div>'+(sub?'<div class="v1mp-sub">'+esc(sub)+'</div>':'');
  el.style.display='grid';
}
function v1mpHideOverlay(){ const el=document.getElementById('v1mp-overlay'); if(el) el.style.display='none'; }

function v1mpSeed(code){
  let h=2166136261>>>0;
  for(const ch of String(code)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619)>>>0; }
  return h>>>0;
}

function launchMultiplayerRace(data,name){
  const r=data.room;
  const config={
    roomCode:r.code,
    legacyName:name,
    expectedCount:data.members.length,
    trackId:r.track_id,
    laps:r.laps,
    seed:v1mpSeed(r.code),
    previousQuali:window.__game?.ui?.settings?.quali,
    originalRaceLapsFor:null,
  };
  sessionStorage.setItem('v1_multiplayer_config',JSON.stringify(config));
  clearInterval(pollTimer);
  close();
  const game=window.__game;
  if(game?.ui?.settings){
    game.ui.settings.quali=false;
    game.ui.saveSettings?.();
    config.originalRaceLapsFor=game.ui.raceLapsFor;
    game.ui.raceLapsFor=()=>config.laps;
  }
  const u=new URL(location.href);
  u.searchParams.set('seed',String(config.seed));
  history.replaceState(null,'',u);
  document.querySelector('[data-a="quick"]')?.click();
}

function v1mpConfig(){
  try { return JSON.parse(sessionStorage.getItem('v1_multiplayer_config')||'null'); } catch { return null; }
}

function v1mpMaybeAutoTrack(){
  const cfg=v1mpConfig();
  if(!cfg) return;
  const screen=document.getElementById('screen-track');
  if(!screen?.classList.contains('active')) return;
  const card=screen.querySelector('.track-card[data-t="'+CSS.escape(cfg.trackId)+'"]');
  if(card && !card.dataset.v1AutoClicked){
    card.dataset.v1AutoClicked='1';
    card.click();
  }
}

function v1mpMakeRemoteStub(entry){
  if(entry._v1RemoteStub) return;
  entry._v1RemoteStub=true;
  if(entry.ai){
    entry._v1OriginalAiUpdate=entry.ai.update?.bind(entry.ai);
    entry.ai.update=()=>({steer:0,throttle:0,brake:0,boost:false});
  }
  entry._v1OriginalStep=entry.phys.step?.bind(entry.phys);
  entry.phys.step=()=>({crossedSF:0,wrongWay:false,wallHit:0,shifted:0});
}

function v1mpApplyRemote(entry,state){
  if(!entry?.phys || !state) return;
  const p=entry.phys;
  const alpha=.42;
  p.pos.x += (state.x-p.pos.x)*alpha;
  p.pos.y += (state.y-p.pos.y)*alpha;
  p.pos.z += (state.z-p.pos.z)*alpha;
  const da=Math.atan2(Math.sin(state.heading-p.heading),Math.cos(state.heading-p.heading));
  p.heading += da*alpha;
  p.v=state.v;
  p.steer=state.steer||0;
  p.sampleIdx=state.sampleIdx||0;
  p.totalDist=state.totalDist||0;
  entry.lap=state.lap ?? entry.lap;
  entry.wheelSpin=state.wheelSpin||entry.wheelSpin||0;
  if(entry.mesh){
    entry.mesh.position.set(p.pos.x,p.pos.y,p.pos.z);
    entry.mesh.rotation.y=p.heading;
    entry.mesh.visible=true;
  }
}

function v1mpAssignRemoteEntries(game,snapshot){
  if(!v1mp || !game?.session) return;
  const me=v1mp.cfg.legacyName.toLowerCase();
  const remotes=(snapshot.players||[]).filter(p=>p.legacyName?.toLowerCase()!==me);
  const used=new Set();
  for(const remote of remotes){
    const key=remote.legacyName.toLowerCase();
    let entry=v1mp.remoteEntries.get(key);
    if(!entry){
      entry=game.session.entries.find(e=>!e.isPlayer && e.driver?.id===remote.driverId && !used.has(e));
      if(!entry) entry=game.session.entries.find(e=>!e.isPlayer && ![...v1mp.remoteEntries.values()].includes(e) && !used.has(e));
      if(entry){
        v1mp.remoteEntries.set(key,entry);
        used.add(entry);
        entry.dnf=false;
        entry.finished=false;
        entry.phys.disabled=false;
        entry.mesh.visible=true;
        entry.tag && (entry.tag.visible=false);
        v1mpMakeRemoteStub(entry);
      }
    }
  }
  const active=new Set(v1mp.remoteEntries.values());
  for(const e of game.session.entries){
    if(e.isPlayer || active.has(e)) continue;
    e.dnf=true;
    e.phys.disabled=true;
    if(e.mesh) e.mesh.visible=false;
  }
}

function v1mpOfficialResults(classification){
  const rows=(classification||[]).map((p,i)=>'<tr><td class="rank">'+(p.finishPosition||i+1)+'</td><td>'+esc(p.legacyName)+'</td><td>'+(p.dnf?'DNF':'FINISHED')+'</td></tr>').join('');
  shell('OFFICIAL MULTIPLAYER RESULTS',
    '<table class="v1o-table"><thead><tr><th>POS</th><th>SL LEGACY NAME</th><th>STATUS</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<button class="v1o-btn" id="v1o-results-menu">RETURN TO MAIN MENU</button>');
  document.getElementById('v1o-results-menu').onclick=()=>{
    sessionStorage.removeItem('v1_multiplayer_config');
    v1mp?.ws?.close();
    v1mp=null;
    close();
    const game=window.__game;
    game?.teardownSession?.();
    if(game){ game.state='menu'; game.ui.showMain(game.champ); }
  };
}

function v1mpConnect(game,cfg){
  if(v1mp?.ws && v1mp.cfg?.roomCode===cfg.roomCode) return;
  const ws=new WebSocket(V1_RT_URL+'?room='+encodeURIComponent(cfg.roomCode)+'&name='+encodeURIComponent(cfg.legacyName));
  v1mp={
    cfg,ws,remoteEntries:new Map(),latest:new Map(),lastSend:0,green:false,
    originalBegin:game.beginSessionFromGate.bind(game), readySent:false, lastSnapshot:null
  };
  game.beginSessionFromGate=()=>{
    if(v1mp && !v1mp.green) return false;
    return v1mp?.originalBegin ? v1mp.originalBegin() : false;
  };
  v1mpOverlay('CONNECTING','Joining V1 race control…');
  ws.onopen=()=>v1mpOverlay('CONNECTED','Waiting for every driver to load the circuit…');
  ws.onclose=()=>{ if(v1mp) v1mpOverlay('CONNECTION LOST','Attempting to preserve your race for 30 seconds…'); };
  ws.onmessage=(ev)=>{
    let msg; try{msg=JSON.parse(ev.data);}catch{return;}
    if(msg.type==='snapshot'){
      v1mp.lastSnapshot=msg;
      for(const p of msg.players||[]) if(p.state) v1mp.latest.set(p.legacyName.toLowerCase(),p);
      v1mpAssignRemoteEntries(game,msg);
      const mine=(msg.players||[]).find(p=>p.legacyName?.toLowerCase()===cfg.legacyName.toLowerCase());
      if(mine?.position) game.hud?.message?.('LIVE POSITION · P'+mine.position,'');
    }
    if(msg.type==='countdown'){
      const tick=()=>{
        if(!v1mp) return;
        const left=Math.max(0,msg.startAt-Date.now());
        if(left<=0){ v1mpOverlay('GO',''); return; }
        v1mpOverlay(String(Math.max(1,Math.ceil(left/1000))),'V1 OFFICIAL START');
        requestAnimationFrame(tick);
      };
      game.hud?.hideSessionReady?.();
      tick();
    }
    if(msg.type==='green'){
      v1mp.green=true;
      v1mpHideOverlay();
      v1mp.originalBegin();
      if(game.session){
        game.session.phase='racing';
        game.session.phaseT=0;
        game.session.raceTime=0;
        game.session.lightsOn=0;
        game.session.lightsOut=true;
        for(const e of game.session.entries) e.lapStart=0;
      }
      game.hud?.message?.('V1 MULTIPLAYER · GREEN FLAG','green');
    }
    if(msg.type==='finish' && msg.legacyName?.toLowerCase()===cfg.legacyName.toLowerCase()){
      game.hud?.message?.('OFFICIAL FINISH · P'+msg.finishPosition,'green');
    }
    if(msg.type==='raceFinished') v1mpOfficialResults(msg.classification);
    if(msg.type==='disconnect') game.hud?.message?.(msg.legacyName+' disconnected · 30s reconnect window','yellow');
  };
}

function v1mpTick(){
  requestAnimationFrame(v1mpTick);
  v1mpMaybeAutoTrack();
  const cfg=v1mpConfig(), game=window.__game;
  if(!cfg || !game) return;
  if(game.ui?.settings){
    game.ui.settings.quali=false;
    if(!game.ui._v1RaceLapsPatched){
      game.ui._v1RaceLapsPatched=true;
      game.ui._v1OriginalRaceLapsFor=game.ui.raceLapsFor.bind(game.ui);
      game.ui.raceLapsFor=()=>cfg.laps;
    }
  }
  if(game.state!=='race' || !game.session || !game.circuit) return;
  if(!v1mp) v1mpConnect(game,cfg);
  if(!v1mp?.ws || v1mp.ws.readyState!==1) return;

  if(!v1mp.readySent){
    v1mp.readySent=true;
    game.hud?.hideSessionReady?.();
    v1mp.ws.send(JSON.stringify({
      type:'ready', expectedCount:cfg.expectedCount, trackId:cfg.trackId, laps:cfg.laps,
      trackLength:game.circuit.length, driverId:game.session.player?.driver?.id||game.ui?.sel?.driverId||null
    }));
  }

  for(const [key,remote] of v1mp.latest){
    const entry=v1mp.remoteEntries.get(key);
    if(entry && remote.state) v1mpApplyRemote(entry,remote.state);
  }

  const now=performance.now();
  if(now-v1mp.lastSend<50) return;
  v1mp.lastSend=now;
  const e=game.session.player, p=e?.phys;
  if(!p) return;
  v1mp.ws.send(JSON.stringify({type:'state',state:{
    x:p.pos.x,y:p.pos.y,z:p.pos.z,heading:p.heading,v:p.v,steer:p.steer||0,
    wheelSpin:e.wheelSpin||0,sampleIdx:p.sampleIdx||0,totalDist:p.totalDist||0,
    lap:e.lap,bestLapMs:e.bestLap?Math.round(e.bestLap*1000):null
  }}));
}
requestAnimationFrame(v1mpTick);

JS

cat >> dist/css/menus.css <<'CSS'

/* ===== V1 ONLINE ===== */
#v1-online-root{position:relative;z-index:20000}
.v1o-backdrop{position:fixed;inset:0;background:rgba(4,4,4,.88);backdrop-filter:blur(8px);display:grid;place-items:center;padding:24px}
.v1o-panel{width:min(920px,94vw);max-height:90vh;overflow:auto;background:linear-gradient(145deg,#111,#17110e);border:1px solid rgba(213,180,139,.28);box-shadow:0 24px 80px rgba(0,0,0,.65);color:#F5F3EE}
.v1o-panel header{display:flex;justify-content:space-between;align-items:center;padding:24px 28px;border-bottom:1px solid rgba(255,255,255,.08)}
.v1o-panel header small{font:800 10px/1.2 var(--mono,monospace);letter-spacing:.18em;color:#B88B6C}
.v1o-panel h2{margin:5px 0 0;font-size:28px;font-style:italic;letter-spacing:.03em}
.v1o-x{background:none;border:0;color:#eee;font-size:34px;cursor:pointer}
.v1o-body{padding:28px}.v1o-muted,.v1o-status,.v1o-update{color:#aaa;font-size:13px;line-height:1.6}
.v1o-label{display:block;margin:18px 0 8px;font:800 10px var(--mono,monospace);letter-spacing:.15em;color:#D5B48B}
.v1o-input{width:100%;box-sizing:border-box;padding:14px 15px;background:#0a0a0a;border:1px solid #3b2b22;color:#fff;font:700 14px var(--mono,monospace);outline:none}
.v1o-input:focus{border-color:#9A5E3F}.v1o-input.code{text-transform:uppercase;letter-spacing:.22em;font-size:22px}
.v1o-btn{margin-top:18px;width:100%;padding:14px 18px;border:1px solid #9A5E3F;background:#7A4828;color:#fff;font-weight:900;letter-spacing:.06em;cursor:pointer}
.v1o-btn.ghost{background:#14110f}.v1o-btn.mini{width:auto;margin:0}.v1o-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.v1o-cardbtn{min-height:130px;text-align:left;padding:20px;border:1px solid rgba(255,255,255,.1);background:#13110f;color:#fff;cursor:pointer}
.v1o-cardbtn b{display:block;font-size:15px}.v1o-cardbtn span{display:block;margin-top:8px;color:#aaa;line-height:1.5}
.v1o-cardbtn:hover{border-color:#9A5E3F;background:#1a1512}.v1o-tabs{display:flex;gap:8px;margin-bottom:16px}
.v1o-tabs button{padding:9px 13px;border:1px solid #342820;background:#111;color:#aaa;font-weight:800;cursor:pointer}.v1o-tabs button.on{background:#7A4828;color:#fff}
.v1o-table{width:100%;border-collapse:collapse}.v1o-table th,.v1o-table td{padding:12px 10px;border-bottom:1px solid rgba(255,255,255,.07);text-align:left}
.v1o-table th{font:800 10px var(--mono,monospace);letter-spacing:.12em;color:#B88B6C}.v1o-table .rank{font-weight:900;color:#D5B48B}
.v1o-driver{font-size:28px;font-weight:900}.v1o-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0}
.v1o-stats div{padding:18px;background:#0d0c0b;border:1px solid rgba(255,255,255,.07)}.v1o-stats b{display:block;font-size:24px}.v1o-stats span{display:block;margin-top:5px;font:800 9px var(--mono,monospace);color:#999;letter-spacing:.12em}
.v1o-roomhead{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.v1o-roomhead small{color:#B88B6C}.v1o-roomhead h3{font-size:24px;margin:3px 0}.v1o-roomhead div:last-child{text-align:right}.v1o-roomhead span{display:block;color:#999;font-size:12px;margin-top:4px}
.v1o-copyrow{display:flex;gap:8px}.v1o-rosterlabel{margin:24px 0 8px}.v1o-roster{list-style:none;padding:0;margin:0;border-top:1px solid rgba(255,255,255,.08)}.v1o-roster li{display:flex;justify-content:space-between;padding:11px 4px;border-bottom:1px solid rgba(255,255,255,.06)}.v1o-roster b{font-size:10px;color:#D5B48B}
.v1o-kioskmark{font:900 clamp(30px,6vw,54px)/1 var(--font-display,Arial,sans-serif);letter-spacing:.12em;margin-bottom:18px;color:#D5B48B}
.v1o-kioskhelp{margin:14px 0 0;color:#777;font-size:11px;text-align:center}
#v1-driver-session{position:fixed;z-index:15000;display:flex;align-items:center;gap:12px;padding:8px 10px;background:rgba(8,9,9,.92);border:1px solid rgba(213,180,139,.3);color:#fff;font:700 10px var(--mono,monospace);letter-spacing:.08em;white-space:nowrap;transition:left .15s ease,top .15s ease}
#v1-driver-session span{color:#8f877e}#v1-driver-session b{color:#D5B48B;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#v1-driver-session button{border:1px solid #5c3827;background:#19120e;color:#fff;padding:6px 8px;font:800 9px var(--mono,monospace);cursor:pointer}
#v1mp-overlay{position:fixed;inset:0;z-index:19000;display:none;place-content:center;text-align:center;pointer-events:none;background:rgba(0,0,0,.32);color:#fff;text-shadow:0 3px 18px #000}
.v1mp-big{font:900 clamp(44px,10vw,120px)/.9 var(--font-display,Arial,sans-serif);font-style:italic;letter-spacing:-.04em}
.v1mp-sub{margin-top:14px;font:800 12px var(--mono,monospace);letter-spacing:.18em;color:#D5B48B}
@media(max-width:700px){.v1o-grid2,.v1o-stats{grid-template-columns:1fr 1fr}.v1o-body{padding:18px}.v1o-panel header{padding:18px}.v1o-table{font-size:11px}}
CSS

node - <<'NODE'
const fs=require('fs');
const f='dist/index.html';
let x=fs.readFileSync(f,'utf8');
if(!x.includes('js/v1-online.js')){
  x=x.replace('</body>','<script type="module" src="js/v1-online.js"></script>\n</body>');
}
fs.writeFileSync(f,x);
NODE
