node - <<'NODE'
const fs=require('fs');
let car=fs.readFileSync('dist/js/car.js','utf8');

// Remove the legacy TACN shoulder-deck overlay entirely.
// That texture hard-codes electric cyan/blue spears and is the source
// of the blue panels still appearing on the 1915 car.
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
  // V1 / 1915 no longer uses the legacy TACN cyan shoulder-deck graphic.
  // Keep the hook for compatibility, but render no extra overlay.
  return null;
}`;

if (!car.includes(oldFn)) throw new Error('legacy TACN deck livery function not found');
car = car.replace(oldFn,newFn);

// Neutralize the legacy TACN deck material too, so even an unexpected caller
// cannot reintroduce a blue emissive tint.
car = car.replaceAll('emissive: 0x7adfff, emissiveMap: tex, emissiveIntensity: 0.045,',
                     'emissive: 0x000000, emissiveMap: tex, emissiveIntensity: 0.0,');

fs.writeFileSync('dist/js/car.js',car);
NODE
node --check dist/js/car.js
