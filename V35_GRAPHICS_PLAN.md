# V35 — performance-first graphics upgrade

This branch is an isolated development workspace. **It is not deployed and does not change V34.**

## Source of truth
- Base game: `ahacker-1/apex-formula-2026` (Three.js r160 / WebGL).
- V1 customizations: `v1-assets` branch scripts.
- Multiplayer: `main/server.js` — keep unchanged for this graphics phase.

## First implemented guardrail
`v35-quality-guardrails.sh` is an optional post-build script that lowers the maximum render pixel ratio on high (2.0 to 1.5), medium (1.25 to 1.15), and starts automatic graphics selection at medium on non-mobile machines. Existing automatic frame-time quality adjustment remains intact. This reduces GPU load and leaves headroom for better art. It does **not** itself improve visual quality.

## Planned visual upgrade, in order
1. One optimized car model: better normals, body materials, wheel/tire detail; retain the same collision/physics mesh and team-livery mapping.
2. One circuit: improved asphalt/kerb materials and scenery detail using instancing and LOD; do not modify the racing surface geometry.
3. Calibrate exposure, environment lighting, reflections and existing bloom/AO rather than adding expensive new post-processing passes.
4. Compare on a separate staging deployment; retain V34 as rollback.

## Release gates
- Baseline and upgraded builds tested on the same PC, resolution, circuit, and driver count.
- Target >= 60 FPS on a mid-range desktop; avoid sustained frame times above 16.7 ms, and offer automatic fallback for slower hardware.
- No regression in multiplayer synchronization, liveries, race start/restart, input responsiveness, or loading time.
- Test Firestorm media separately; browser performance does not guarantee in-world media performance.
- Do not deploy to the live V34 service until visual and functional checks pass.
