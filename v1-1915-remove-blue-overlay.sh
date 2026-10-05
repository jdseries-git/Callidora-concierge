node - <<'NODE'
const fs=require('fs');
let car=fs.readFileSync('dist/js/car.js','utf8');

// Remove the legacy TACN shoulder-deck overlay entirely.
const oldFn = `function addTacnDeckLivery(body, team, drv, y) {
  if (team.id !== 'tacn') return null;
  const deck = new THREE.Mesh(PLANE(), tacnDeckM(drv));
  deck.name = 'tacnDeckLivery';
  deck.position.set(0, y, -0.22);
  deck.rotation.x = -HALF_PI;
  deck.scale.set(1.36, 1.62, 1);
  deck.renderOrder = 2;
  body.add(deck);
  return deck;
}`;

const newFn = `function addTacnDeckLivery(body, team, drv, y) {
  return null;
}`;

if (!car.includes(oldFn)) throw new Error('legacy TACN deck livery function not found');
car = car.replace(oldFn,newFn);
car = car.replaceAll('emissive: 0x7adfff, emissiveMap: tex, emissiveIntensity: 0.045,',
                     'emissive: 0x000000, emissiveMap: tex, emissiveIntensity: 0.0,');
fs.writeFileSync('dist/js/car.js',car);

// Add team-specific classes so the hero crops can be tuned per card.
let ui=fs.readFileSync('dist/js/ui.js','utf8');
ui = ui.replace(
  "const card = document.createElement('div'); card.className = 'select-card v1-team-card';",
  "const card = document.createElement('div'); card.className = 'select-card v1-team-card v1-team-' + team.id;"
);
fs.writeFileSync('dist/js/ui.js',ui);
NODE
node --check dist/js/car.js
node --check dist/js/ui.js

cat >> dist/css/menus.css <<'CSS'
/* Team-card hero crop: default keeps the full car visible */
.v1-team-art-wrap{
  height:165px;
  overflow:hidden;
}
.v1-team-art{
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center 64% !important;
  transform:scale(1.02);
  transform-origin:center 64%;
}

/* Per-team cleanup for embedded poster footer elements */
.v1-team-tacn .v1-team-art{
  object-position:center 64% !important;
  transform:scale(1.06);
  transform-origin:center 64%;
}
.v1-team-zephyr .v1-team-art{
  object-position:center 57% !important;
  transform:scale(1.02);
  transform-origin:center 57%;
}
.v1-team-sablewood .v1-team-art{
  object-position:center 65% !important;
  transform:scale(1.03);
  transform-origin:center 65%;
}
.v1-team-solaris .v1-team-art{
  object-position:center 58% !important;
  transform:scale(1.02);
  transform-origin:center 58%;
}
CSS
