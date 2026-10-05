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
NODE
node --check dist/js/car.js

cat >> dist/css/menus.css <<'CSS'
.v1-team-art-wrap{height:165px}
.v1-team-art{width:100%;height:100%;object-fit:cover;object-position:center 50% !important}
CSS
